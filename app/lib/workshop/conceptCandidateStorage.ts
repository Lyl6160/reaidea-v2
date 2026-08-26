import type { ConceptCandidate, ConceptCreationDiagnostic, RepresentationRoutingDiagnostic } from "../ai/types";
import { isValidConceptGeometry } from "../geometry/conceptGeometry";
import { validateInitialGeometryPlan } from "../geometry/initialGeometryPlan";

const DATABASE_NAME = "reaidea-workshop-concepts";
const DATABASE_VERSION = 1;
const STORE_NAME = "current-candidates";
const MAX_PERSISTED_IMAGE_BYTES = 18_000_000;
const MAX_PERSISTED_VIEW_SET_BYTES = MAX_PERSISTED_IMAGE_BYTES * 3;
export const MAX_RETAINED_CONCEPT_CANDIDATES = 5;

export type InitialCoreCreationReceipt = {
  projectId: string;
  status: "creating" | "awaiting-representation" | "failed";
  correlationId: string;
  startedAt: string;
  updatedAt: string;
  diagnostic?: ConceptCreationDiagnostic;
  representationDiagnostic?: RepresentationRoutingDiagnostic;
};

type StoredConceptCandidate = {
  version: 1 | 2 | 3;
  projectId: string;
  candidate?: ConceptCandidate;
  candidates?: ConceptCandidate[];
  initialCreationReceipt?: InitialCoreCreationReceipt;
};

export async function restoreConceptCandidateHistory(projectId: string): Promise<ConceptCandidate[]> {
  if (!projectId.trim() || typeof indexedDB === "undefined") return [];
  const database = await openDatabase();
  try {
    const stored = await requestResult<StoredConceptCandidate | undefined>(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(projectId)
    );
    if (stored?.projectId !== projectId) return [];
    const candidates = stored.candidates ?? (stored.candidate ? [stored.candidate] : []);
    return candidates.filter(isPersistableCandidate).sort((left, right) => left.revision - right.revision);
  } finally {
    database.close();
  }
}

export async function restoreCurrentConceptCandidate(
  projectId: string
): Promise<ConceptCandidate | null> {
  const history = await restoreConceptCandidateHistory(projectId);
  return history.at(-1) ?? null;
}

export async function restoreInitialCoreCreationReceipt(projectId: string): Promise<InitialCoreCreationReceipt | null> {
  if (!projectId.trim() || typeof indexedDB === "undefined") return null;
  const database = await openDatabase();
  try {
    const stored = await requestResult<StoredConceptCandidate | undefined>(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(projectId)
    );
    return stored?.projectId === projectId && isInitialCoreCreationReceipt(stored.initialCreationReceipt, projectId)
      ? stored.initialCreationReceipt
      : null;
  } finally {
    database.close();
  }
}

export async function persistInitialCoreCreationReceipt(receipt: InitialCoreCreationReceipt): Promise<boolean> {
  if (!isInitialCoreCreationReceipt(receipt, receipt.projectId) || typeof indexedDB === "undefined") return false;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const existing = await requestResult<StoredConceptCandidate | undefined>(store.get(receipt.projectId));
    store.put({ ...existing, version: 3, projectId: receipt.projectId, initialCreationReceipt: receipt } satisfies StoredConceptCandidate);
    await transactionComplete(transaction);
    return true;
  } finally {
    database.close();
  }
}

export async function persistConceptCandidateHistory(
  projectId: string,
  candidates: ConceptCandidate[]
): Promise<boolean> {
  if (
    !projectId.trim() || typeof indexedDB === "undefined" || candidates.length === 0 ||
    candidates.length > MAX_RETAINED_CONCEPT_CANDIDATES || !candidates.every(isPersistableCandidate)
  ) return false;
  const familyId = candidates[0].conceptFamilyId;
  if (candidates.some((candidate, index) =>
    candidate.conceptFamilyId !== familyId ||
    (index > 0 && candidate.revision <= candidates[index - 1].revision)
  )) {
    return false;
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    // A completed write is the durable success boundary: it also clears a prior operational receipt.
    transaction.objectStore(STORE_NAME).put({ version: 3, projectId, candidates } satisfies StoredConceptCandidate);
    await transactionComplete(transaction);
    return true;
  } finally {
    database.close();
  }
}

export async function persistCurrentConceptCandidate(
  projectId: string,
  candidate: ConceptCandidate
): Promise<boolean> {
  return persistConceptCandidateHistory(projectId, [candidate]);
}

export function isPersistableCandidate(value: unknown): value is ConceptCandidate {
  if (
    !isRecord(value) ||
    value.status !== "generated" ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    !["product", "machine", "process", "software", "system", "environmental", "mixed", "unknown"].includes(String(value.visualMode)) ||
    !["product-concept", "engineering-outline", "wireframe", "solid-concept"].includes(String(value.representationStyle)) ||
    typeof value.sourceBriefVersion !== "number"
  ) return false;
  if (
    !nonEmptyString(value.candidateId) ||
    !nonEmptyString(value.conceptFamilyId) ||
    !nonEmptyString(value.title) ||
    !nonEmptyString(value.createdAt) ||
    !nonEmptyString(value.sourceBriefHash) ||
    !nonEmptyString(value.disclaimer) ||
    !Array.isArray(value.sourceEventIds) ||
    !value.sourceEventIds.every(nonEmptyString) ||
    !isRecord(value.output) ||
    value.output.type !== "image" ||
    !nonEmptyString(value.output.altText) ||
    !nonEmptyString(value.output.dataUrl)
  ) {
    return false;
  }
  const availableViews = value.output.availableViews;
  const views = value.output.views;
  const primaryViewId = value.output.primaryView;
  if (
    (value.output.viewLayout !== undefined && value.output.viewLayout !== "three-view-sheet") ||
    (availableViews !== undefined && (
      !Array.isArray(availableViews) ||
      availableViews.length < 1 || availableViews.length > 3 ||
      new Set(availableViews).size !== availableViews.length ||
      !availableViews.every((view) => ["iso", "front", "side"].includes(String(view)))
    ))
  ) return false;
  if (views !== undefined) {
    if (!Array.isArray(views) || views.length < 1 || views.length > 3) return false;
    const viewIds = new Set<string>();
    let totalBytes = 0;
    for (const view of views) {
      if (
        !isRecord(view) ||
        !["iso", "front", "side"].includes(String(view.id)) ||
        viewIds.has(String(view.id)) ||
        !["image/png", "image/jpeg", "image/webp"].includes(String(view.mediaType)) ||
        !nonEmptyString(view.altText) ||
        !nonEmptyString(view.dataUrl)
      ) return false;
      const viewBytes = imageDataUrlBytes(view.dataUrl);
      if (viewBytes === null || viewBytes > MAX_PERSISTED_IMAGE_BYTES) return false;
      viewIds.add(String(view.id));
      totalBytes += viewBytes;
    }
    if (
      totalBytes > MAX_PERSISTED_VIEW_SET_BYTES ||
      !["iso", "front", "side"].includes(String(primaryViewId)) ||
      (Array.isArray(availableViews) && (availableViews.length !== viewIds.size || !availableViews.every((view) => viewIds.has(String(view)))))
    ) return false;
    const primaryView = views.find((view) => isRecord(view) && view.id === primaryViewId);
    if (!isRecord(primaryView) || primaryView.dataUrl !== value.output.dataUrl) return false;
  }
  if (
    (value.sourceCandidateId !== undefined && !nonEmptyString(value.sourceCandidateId)) ||
    (value.inventorRefinement !== undefined && !nonEmptyString(value.inventorRefinement)) ||
    (value.visualDesignSnapshot !== undefined && !isVisualDesignSnapshot(value.visualDesignSnapshot)) ||
    (value.initialGeometryPlan !== undefined && !validateInitialGeometryPlan(value.initialGeometryPlan)) ||
    (value.conceptGeometry !== undefined && (!isValidConceptGeometry(value.conceptGeometry) || !geometryMatchesCandidate(value.conceptGeometry, value) || !geometryMatchesPlan(value.conceptGeometry, value.initialGeometryPlan))) ||
    (value.conceptGeometryStatus !== undefined && !["available", "insufficient-data", "unsupported-geometry", "invalid-snapshot"].includes(String(value.conceptGeometryStatus))) ||
    (value.conceptGeometryStatus === "available" && value.conceptGeometry === undefined)
  ) return false;
  const estimatedBytes = imageDataUrlBytes(value.output.dataUrl);
  return estimatedBytes !== null && estimatedBytes <= MAX_PERSISTED_IMAGE_BYTES;
}

function geometryMatchesCandidate(geometry: { source?: { conceptFamilyId: string; candidateId: string; revision: number } }, candidate: Record<string, unknown>): boolean {
  const source = geometry.source;
  return Boolean(source && source.conceptFamilyId === candidate.conceptFamilyId && source.candidateId === candidate.candidateId && source.revision === candidate.revision);
}

function geometryMatchesPlan(geometry: { components: Array<{ id: string }> }, plan: unknown): boolean {
  if (plan === undefined) return true;
  if (!validateInitialGeometryPlan(plan) || plan.blocker) return false;
  return plan.componentIds.length === geometry.components.length && plan.componentIds.every((id) => geometry.components.some((component) => component.id === id));
}

export function isInitialCoreCreationReceipt(value: unknown, projectId?: string): value is InitialCoreCreationReceipt {
  if (!isRecord(value) || !["creating", "awaiting-representation", "failed"].includes(String(value.status))) return false;
  if (!nonEmptyString(value.projectId) || (projectId && value.projectId !== projectId) || !nonEmptyString(value.correlationId) || !nonEmptyString(value.startedAt) || !nonEmptyString(value.updatedAt)) return false;
  if (value.status === "awaiting-representation") {
    return Object.keys(value).every((key) => ["projectId", "status", "correlationId", "startedAt", "updatedAt", "representationDiagnostic"].includes(key)) &&
      value.diagnostic === undefined && isRepresentationRoutingDiagnostic(value.representationDiagnostic);
  }
  if (value.representationDiagnostic !== undefined) return false;
  if (value.diagnostic === undefined) return value.status === "creating";
  const diagnostic = value.diagnostic;
  return isRecord(diagnostic) && diagnostic.correlationId === value.correlationId && nonEmptyString(diagnostic.occurredAt) && typeof diagnostic.retryable === "boolean" &&
    (typeof diagnostic.providerOperationAttempts === "number" || diagnostic.providerOperationAttempts === "unknown") &&
    (diagnostic.httpStatus === undefined || typeof diagnostic.httpStatus === "number") &&
    (diagnostic.modelIdentifier === undefined || nonEmptyString(diagnostic.modelIdentifier)) &&
    ["invalid-request", "unsupported-mode", "not-configured", "provider-failure", "safety-hold", "safety-block", "safety-unavailable", "network", "candidate-validation", "local-persistence", "request-construction", "interrupted"].includes(String(diagnostic.category));
}

function isRepresentationRoutingDiagnostic(value: unknown): value is RepresentationRoutingDiagnostic {
  if (!isRecord(value)) return false;
  return ["product", "machine", "process", "software", "system", "environmental", "mixed", "unknown"].includes(String(value.mode)) &&
    ["explicit-description-supported", "description-mixed", "description-insufficient", "explicit-inventor-choice", "evidence-backed-recommendation"].includes(String(value.reason)) &&
    value.phase === "request-construction" && value.category === "representation-question" &&
    Array.isArray(value.supportingSignalLabels) && value.supportingSignalLabels.length <= 8 &&
    value.supportingSignalLabels.every((label) => [
      "description-physical-form", "description-components", "description-operation", "description-wearable-use",
      "description-machine", "description-process", "description-software", "description-system",
      "description-environmental", "image-corroborates-description", "image-context-differs",
    ].includes(String(label)));
}

function isVisualDesignSnapshot(value: unknown): boolean {
  if (!isRecord(value) || value.nonAuthoritative !== true || JSON.stringify(value).length > 16_000 || !isRecord(value.componentAttributes)) return false;
  return ["overallGeometry", "components", "materials", "colours", "labels", "relationships", "movement", "proportions", "visualConstraints", "preservedFeatures", "uncertainties"]
    .every((key) => Array.isArray(value[key]) && (value[key] as unknown[]).length <= 48 && (value[key] as unknown[]).every(nonEmptyString));
}

function imageDataUrlBytes(dataUrl: string): number | null {
  const imageMatch = dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  return imageMatch ? Math.floor((imageMatch[2].length * 3) / 4) : null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Concept cache could not be opened."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Concept cache request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Concept cache transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Concept cache transaction was aborted."));
  });
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
