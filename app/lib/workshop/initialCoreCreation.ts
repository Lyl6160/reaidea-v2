import type { ConceptCandidate, ConceptCreationDiagnostic, ConceptGenerationApiResponse, ConceptGenerationRequest, VisualUnderstandingResult } from "../ai/types";
import { bindConceptGeometry } from "../geometry/buildConceptGeometry";
import { buildInitialGeometryPlan } from "../geometry/initialGeometryPlan";
import type { Project } from "../core/project";
import { isValidSafetyReceipt, loadProjectSourceImage, parseSourceImageReference, sourceImageToDataUrl } from "../core/projectSourceEvidenceStorage";
import { buildConceptGenerationFoundation, createConceptWorkflowIdentity, suggestVisualMode } from "./conceptGeneration";
import { persistCurrentConceptCandidate, persistInitialCoreCreationReceipt, restoreCurrentConceptCandidate, type InitialCoreCreationReceipt } from "./conceptCandidateStorage";

export type InitialCoreCreationResult =
  | { kind: "success"; candidate: ConceptCandidate }
  | { kind: "failure"; message: string; receipt: InitialCoreCreationReceipt; retryPersistence?: () => Promise<InitialCoreCreationResult> };

export type InitialCoreCreationPhase = "reading" | "saving" | "generating" | "checking-geometry" | "building" | "opening";
export type InitialCoreCreationUiPhase = InitialCoreCreationPhase | "idle" | "failed";

export type InitialCoreCreationTransactionResult =
  | InitialCoreCreationResult
  | { kind: "stopped" };

type InitialCoreCreationDependencies = {
  fetchConcept?: (request: ConceptGenerationRequest) => Promise<{ status: number; payload: ConceptGenerationApiResponse }>;
  persistCandidate?: (projectId: string, candidate: ConceptCandidate) => Promise<boolean>;
  restoreCandidate?: (projectId: string) => Promise<ConceptCandidate | null>;
  persistReceipt?: (receipt: InitialCoreCreationReceipt) => Promise<boolean>;
  onPhase?: (phase: Extract<InitialCoreCreationPhase, "generating" | "checking-geometry" | "building">) => void;
  onCandidateValidated?: (candidate: ConceptCandidate) => void;
};

type InitialCoreCreationTransactionDependencies = {
  saveProject: () => Promise<Project | null>;
  createConcept: (
    project: Project,
    onPhase: (phase: Extract<InitialCoreCreationPhase, "generating" | "checking-geometry" | "building">) => void
  ) => Promise<InitialCoreCreationResult>;
  onPhase?: (phase: InitialCoreCreationPhase) => void;
};

/**
 * Runs only after Home has completed its pre-Project safety gates. This keeps the
 * displayed saving phase truthful: a canonical Project is never saved for a
 * denied or unresolved submission.
 */
export async function runInitialCoreCreationTransaction(
  dependencies: InitialCoreCreationTransactionDependencies
): Promise<InitialCoreCreationTransactionResult> {
  dependencies.onPhase?.("saving");
  const project = await dependencies.saveProject();
  if (!project) return { kind: "stopped" };

  const result = await dependencies.createConcept(project, (phase) => dependencies.onPhase?.(phase));
  if (result.kind === "success") dependencies.onPhase?.("opening");
  return result;
}

export function isInitialCoreCreationActive(phase: InitialCoreCreationUiPhase): boolean {
  return phase !== "idle" && phase !== "failed";
}

export async function runInitialCoreCreation(
  project: Project,
  visualInterpretation?: VisualUnderstandingResult,
  dependencies: InitialCoreCreationDependencies = {}
): Promise<InitialCoreCreationResult> {
  const identity = createConceptWorkflowIdentity();
  const mode = suggestVisualMode(project, [], visualInterpretation).mode;
  const now = new Date().toISOString();
  const creating: InitialCoreCreationReceipt = { projectId: project.id, status: "creating", correlationId: identity.requestId, startedAt: now, updatedAt: now };
  const saveReceipt = dependencies.persistReceipt ?? persistInitialCoreCreationReceipt;
  await saveReceipt(creating);
  if (mode === "unknown" || mode === "mixed") return fail(project.id, creating, "request-construction", "REV could not form one supported visual concept from this submission.", false, dependencies, 0);
  const foundation = buildConceptGenerationFoundation(project, mode, identity, [], [], visualInterpretation ? [visualInterpretation] : []);
  if (!foundation.request) return fail(project.id, creating, "request-construction", "REV could not prepare the initial Concept 01 request.", false, dependencies, 0);
  const request = await attachSourceImageReference(project, foundation.request);
  const fetchConcept = dependencies.fetchConcept ?? requestConcept;
  dependencies.onPhase?.("generating");
  let response: { status: number; payload: ConceptGenerationApiResponse };
  try {
    response = await fetchConcept(request);
  } catch {
    return fail(project.id, creating, "network", "Concept creation could not complete because this browser could not reach REV.", true, dependencies, "unknown");
  }
  if (!response.payload || "error" in response.payload || response.status < 200 || response.status >= 300) {
    const error = response.payload && "error" in response.payload ? response.payload.error : undefined;
    const diagnostic = error?.diagnostic;
    return fail(project.id, creating, diagnostic?.category ?? "provider-failure", error?.message ?? "Concept generation could not complete.", error?.retryable ?? true, dependencies, diagnostic?.providerOperationAttempts ?? "unknown", response.status, diagnostic?.modelIdentifier);
  }
  if (!isValidInitialCandidate(response.payload.candidate, request)) return fail(project.id, creating, "candidate-validation", "Concept generation returned an invalid result.", true, dependencies, 1, response.status);
  dependencies.onPhase?.("checking-geometry");
  const plan = buildInitialGeometryPlan(project, visualInterpretation);
  const candidate = bindConceptGeometry({ ...response.payload.candidate, initialGeometryPlan: plan });
  if (!isValidInitialCandidate(candidate, request) || !geometryBindingMatchesCandidate(candidate)) return fail(project.id, creating, "candidate-validation", "Concept generation returned an invalid result.", true, dependencies, 1, response.status);
  dependencies.onCandidateValidated?.(candidate);
  dependencies.onPhase?.("building");
  const persistCandidate = dependencies.persistCandidate ?? persistCurrentConceptCandidate;
  const restoreCandidate = dependencies.restoreCandidate ?? restoreCurrentConceptCandidate;
  if (await persistCandidate(project.id, candidate) && await confirmsPersistedCandidate(project.id, candidate, restoreCandidate)) return { kind: "success", candidate };
  const retryPersistence = async (): Promise<InitialCoreCreationResult> => {
    if (await persistCandidate(project.id, candidate) && await confirmsPersistedCandidate(project.id, candidate, restoreCandidate)) return { kind: "success", candidate };
    return fail(project.id, creating, "local-persistence", "Concept 01 was created but could not be saved in this browser.", true, dependencies, 1, response.status);
  };
  return fail(project.id, creating, "local-persistence", "Concept 01 was created but could not be saved in this browser.", true, dependencies, 1, response.status, undefined, retryPersistence);
}

async function confirmsPersistedCandidate(projectId: string, candidate: ConceptCandidate, restoreCandidate: (projectId: string) => Promise<ConceptCandidate | null>): Promise<boolean> {
  const restored = await restoreCandidate(projectId);
  return restored?.candidateId === candidate.candidateId && restored.conceptFamilyId === candidate.conceptFamilyId && restored.revision === candidate.revision &&
    restored.conceptGeometryStatus === candidate.conceptGeometryStatus &&
    restored.initialGeometryPlan?.version === candidate.initialGeometryPlan?.version &&
    geometryBindingMatchesCandidate(restored);
}

async function fail(projectId: string, creating: InitialCoreCreationReceipt, category: ConceptCreationDiagnostic["category"], message: string, retryable: boolean, dependencies: InitialCoreCreationDependencies, providerOperationAttempts: number | "unknown", httpStatus?: number, modelIdentifier?: string, retryPersistence?: () => Promise<InitialCoreCreationResult>): Promise<InitialCoreCreationResult> {
  const diagnostic: ConceptCreationDiagnostic = { correlationId: creating.correlationId, category, ...(httpStatus ? { httpStatus } : {}), providerOperationAttempts, ...(modelIdentifier ? { modelIdentifier } : {}), occurredAt: new Date().toISOString(), retryable };
  const receipt: InitialCoreCreationReceipt = { ...creating, projectId, status: "failed", updatedAt: diagnostic.occurredAt, diagnostic };
  await (dependencies.persistReceipt ?? persistInitialCoreCreationReceipt)(receipt);
  return { kind: "failure", message, receipt, retryPersistence };
}

async function requestConcept(request: ConceptGenerationRequest): Promise<{ status: number; payload: ConceptGenerationApiResponse }> {
  const response = await fetch("/api/concepts/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
  return { status: response.status, payload: await response.json() as ConceptGenerationApiResponse };
}

async function attachSourceImageReference(project: Project, request: ConceptGenerationRequest): Promise<ConceptGenerationRequest> {
  if (request.referenceImage) return request;
  for (const evidenceReference of project.files) {
    const evidenceId = parseSourceImageReference(evidenceReference);
    if (!evidenceId) continue;
    const event = project.timeline.find((item) => item.type === "knowledge-input-recorded" && item.subject === evidenceReference);
    const record = await loadProjectSourceImage(project.id, evidenceId);
    if (!event || !record || !isValidSafetyReceipt(record.safetyReceipt)) continue;
    return { ...request, referenceImage: { evidenceReference, sourceEventId: event.id, mediaType: record.mediaType, dataUrl: await sourceImageToDataUrl(record) } };
  }
  return request;
}

function isValidInitialCandidate(candidate: ConceptCandidate, request: ConceptGenerationRequest): boolean {
  return candidate.conceptFamilyId === request.conceptFamilyId && candidate.revision === request.revision && candidate.output.type === "image" && Boolean(candidate.output.dataUrl) && Boolean(candidate.output.altText);
}

function geometryBindingMatchesCandidate(candidate: ConceptCandidate): boolean {
  if (!candidate.conceptGeometry) return candidate.conceptGeometryStatus !== "available";
  const source = candidate.conceptGeometry.source;
  return Boolean(source && source.conceptFamilyId === candidate.conceptFamilyId && source.candidateId === candidate.candidateId && source.revision === candidate.revision);
}
