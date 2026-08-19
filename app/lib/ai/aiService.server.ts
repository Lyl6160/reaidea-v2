import "server-only";

import type {
  ConceptCandidate,
  ConceptGenerationErrorCode,
  ConceptGenerationRequest,
  ConceptImageView,
  ConceptRefinementRequest,
  ConceptViewAssetRequest,
  VisualUnderstandingRequest,
  VisualUnderstandingResult,
  RevImageSafetyDecision,
} from "./types";
import { OpenAIConceptGenerationProvider } from "./providers/openaiProvider.server";
import { decideRevImageSafety, inferRevSafetyLimitations } from "./revImageSafetyPolicy.server";

export class ConceptGenerationServiceError extends Error {
  constructor(
    readonly code: ConceptGenerationErrorCode,
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "ConceptGenerationServiceError";
  }
}

export class VisualUnderstandingServiceError extends Error {
  constructor(
    readonly code: "not-configured" | "unsupported" | "provider-failure",
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "VisualUnderstandingServiceError";
  }
}

type ConceptDiagnosticStage = "route-validation" | "reference-safety" | "reference-image-edit" | "output-safety" | "candidate-validation";

interface ConceptDiagnosticTrace {
  requestId: string;
  endpoint: "/api/concepts/generate";
  hasReference: boolean;
  attemptedProviderOperations: number;
}

export async function understandVisualEvidence(
  request: VisualUnderstandingRequest
): Promise<{ safety: RevImageSafetyDecision; interpretation?: VisualUnderstandingResult }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new VisualUnderstandingServiceError(
      "not-configured",
      "REV image understanding is not configured.",
      false
    );
  }
  const provider = new OpenAIConceptGenerationProvider(apiKey);
  if (!provider.supportsVisualUnderstanding) {
    throw new VisualUnderstandingServiceError(
      "unsupported",
      "This provider cannot interpret the reference image.",
      false
    );
  }
  try {
    const report = await provider.inspectImageSafety(request);
    const safety = decideRevImageSafety({ report, inventorDescription: request.inventorDescription ?? "", imageDataUrl: request.dataUrl });
    if (safety.decision !== "CLEAR") return { safety };
    return {
      safety,
      interpretation: {
        evidenceReference: request.evidenceReference,
        nonAuthoritative: true,
        createdAt: new Date().toISOString(),
        factualSummary: report.factualSummary,
        visualObservations: report.visualObservations,
        uncertainties: report.uncertainties,
      },
    };
  } catch (error) {
    console.error(
      "Visual-understanding provider failed.",
      error instanceof Error ? error.name : "Unknown provider failure"
    );
    throw new VisualUnderstandingServiceError(
      "provider-failure",
      "REV couldn't interpret the reference image this time.",
      true
    );
  }
}

export async function generateViewAsset(request: ConceptViewAssetRequest): Promise<ConceptImageView> {
  if (request.visualMode !== "product" || request.outputType !== "image") {
    throw new ConceptGenerationServiceError("unsupported-mode", "View generation for this mode is coming next.", false);
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ConceptGenerationServiceError("not-configured", "View generation is not configured.", false);
  try {
    const provider = new OpenAIConceptGenerationProvider(apiKey);
    const safetyContext = conceptSafetyContext(request);
    const safetyLimitations = inferRevSafetyLimitations(safetyContext);
    const safeRequest = { ...request, ...(safetyLimitations.length ? { safetyLimitations } : {}) };
    const view = await provider.generateViewAsset(safeRequest);
    await requireSafeOutput(provider, view.dataUrl, view.mediaType, safetyContext, safetyLimitations);
    return view;
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) throw error;
    console.error("Concept provider view generation failed.", error instanceof Error ? error.name : "Unknown provider failure");
    throw new ConceptGenerationServiceError("provider-failure", "View generation could not complete.", true);
  }
}

export async function generateConcept(
  request: ConceptGenerationRequest
): Promise<{ candidate: ConceptCandidate; referenceUsage?: "used" | "unsupported" }> {
  const diagnostic: ConceptDiagnosticTrace = {
    requestId: request.requestId,
    endpoint: "/api/concepts/generate",
    hasReference: Boolean(request.referenceImage),
    attemptedProviderOperations: 0,
  };
  if (request.visualMode !== "product" || request.outputType !== "image") {
    throw new ConceptGenerationServiceError(
      "unsupported-mode",
      "Visual generation for this mode is coming next.",
      false
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Concept generation is not configured: OPENAI_API_KEY is missing.");
    throw new ConceptGenerationServiceError(
      "not-configured",
      "Concept generation is not configured.",
      false
    );
  }

  try {
    const provider = new OpenAIConceptGenerationProvider(apiKey);
    const safetyContext = conceptSafetyContext(request);
    let safeRequest = request;
    if (request.referenceImage) {
      const safety = await inspectSafety(provider, request.referenceImage.dataUrl, request.referenceImage.mediaType, safetyContext, diagnostic, "reference-safety");
      if (safety.decision !== "CLEAR") {
        const error = safetyError(safety, "Concept generation could not complete.");
        logConceptDiagnostic(diagnostic, "reference-safety", "moderation+visual-safety", error.code, error, error.code === "safety-unavailable" ? 503 : 422);
        throw error;
      }
      safeRequest = { ...request, safetyLimitations: safety.receipt.limitations };
    }
    if (safeRequest.referenceImage && !provider.supportsReferenceImages) {
      const { referenceImage: _unusedReference, ...textOnlyRequest } = safeRequest;
      void _unusedReference;
      diagnostic.attemptedProviderOperations += 1;
      return {
        candidate: await approveCandidateOutput(provider, await provider.generateConcept(textOnlyRequest), safetyContext, safeRequest.safetyLimitations, diagnostic),
        referenceUsage: "unsupported",
      };
    }
    diagnostic.attemptedProviderOperations += 1;
    return {
      candidate: await approveCandidateOutput(provider, await provider.generateConcept(safeRequest), safetyContext, safeRequest.safetyLimitations, diagnostic),
      ...(safeRequest.referenceImage ? { referenceUsage: "used" as const } : {}),
    };
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) throw error;
    logConceptDiagnostic(
      diagnostic,
      request.referenceImage ? "reference-image-edit" : "candidate-validation",
      request.referenceImage ? "images.edit" : "images.generate",
      "provider-failure",
      error
    );
    throw new ConceptGenerationServiceError(
      "provider-failure",
      "Concept generation could not complete.",
      true
    );
  }
}

export async function refineConcept(
  request: ConceptRefinementRequest
): Promise<ConceptCandidate> {
  if (request.visualMode !== "product" || request.outputType !== "image") {
    throw new ConceptGenerationServiceError(
      "unsupported-mode",
      "Visual refinement for this mode is coming next.",
      false
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Concept refinement is not configured: OPENAI_API_KEY is missing.");
    throw new ConceptGenerationServiceError("not-configured", "Concept refinement is not configured.", false);
  }

  try {
    const provider = new OpenAIConceptGenerationProvider(apiKey);
    const safetyContext = `${conceptSafetyContext(request)}\n${request.inventorRefinement}`;
    const safety = await inspectSafety(provider, request.sourceImage.dataUrl, request.sourceImage.mediaType, safetyContext);
    if (safety.decision !== "CLEAR") throw safetyError(safety, "Model update could not complete.");
    const safeRequest = { ...request, safetyLimitations: safety.receipt.limitations };
    return await approveCandidateOutput(provider, await provider.refineConcept(safeRequest), safetyContext, safeRequest.safetyLimitations);
  } catch (error) {
    if (error instanceof ConceptGenerationServiceError) throw error;
    console.error(
      "Concept provider refinement failed.",
      error instanceof Error ? error.name : "Unknown provider failure"
    );
    throw new ConceptGenerationServiceError("provider-failure", "Model update could not complete.", true);
  }
}

async function inspectSafety(
  provider: OpenAIConceptGenerationProvider,
  dataUrl: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp",
  inventorDescription: string,
  diagnostic?: ConceptDiagnosticTrace,
  stage: Extract<ConceptDiagnosticStage, "reference-safety" | "output-safety"> = "output-safety"
): Promise<RevImageSafetyDecision> {
  if (diagnostic) diagnostic.attemptedProviderOperations += 2;
  try {
    const report = await provider.inspectImageSafety({
      requestId: crypto.randomUUID(),
      evidenceReference: "source-image:server-boundary",
      mediaType,
      dataUrl,
      inventorDescription,
    });
    return decideRevImageSafety({ report, inventorDescription, imageDataUrl: dataUrl });
  } catch (error) {
    if (diagnostic) logConceptDiagnostic(diagnostic, stage, "moderation+visual-safety", "safety-unavailable", error, 503);
    return { decision: "unavailable", retryable: true };
  }
}

async function approveCandidateOutput(
  provider: OpenAIConceptGenerationProvider,
  candidate: ConceptCandidate,
  inventorDescription: string,
  limitations?: import("./types").RevImageSafetyLimitation[],
  diagnostic?: ConceptDiagnosticTrace
): Promise<ConceptCandidate> {
  if (candidate.output.type !== "image") return candidate;
  const outputs = candidate.output.views?.length
    ? candidate.output.views
    : [{ dataUrl: candidate.output.dataUrl, mediaType: candidate.output.mediaType }];
  for (const output of outputs) {
    if (!output.dataUrl) {
      const error = new ConceptGenerationServiceError("provider-failure", "Concept generation could not complete.", true);
      if (diagnostic) logConceptDiagnostic(diagnostic, "candidate-validation", "local-response-validation", error.code, error, 502);
      throw error;
    }
    await requireSafeOutput(provider, output.dataUrl, output.mediaType, inventorDescription, limitations, diagnostic);
  }
  return candidate;
}

async function requireSafeOutput(
  provider: OpenAIConceptGenerationProvider,
  dataUrl: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp",
  inventorDescription: string,
  limitations?: import("./types").RevImageSafetyLimitation[],
  diagnostic?: ConceptDiagnosticTrace
): Promise<void> {
  const decision = await inspectSafety(provider, dataUrl, mediaType, inventorDescription, diagnostic, "output-safety");
  if (decision.decision !== "CLEAR") {
    const error = safetyError(decision, "Concept generation could not complete.");
    if (diagnostic) logConceptDiagnostic(diagnostic, "output-safety", "moderation+visual-safety", error.code, error, error.code === "safety-unavailable" ? 503 : 422);
    throw error;
  }
  if (limitations?.length && decision.receipt.limitations.some((item) => !limitations.includes(item))) {
    const error = new ConceptGenerationServiceError("safety-block", "Concept generation could not complete.", false);
    if (diagnostic) logConceptDiagnostic(diagnostic, "output-safety", "helm-limitation-check", error.code, error, 422);
    throw error;
  }
}

function logConceptDiagnostic(
  trace: ConceptDiagnosticTrace,
  stage: ConceptDiagnosticStage,
  operationType: string,
  finalInternalServiceErrorCode: ConceptGenerationErrorCode,
  error?: unknown,
  httpStatus?: number
): void {
  if (process.env.NODE_ENV !== "development") return;
  const providerError = error && typeof error === "object" ? error as Record<string, unknown> : null;
  console.error("Concept generation diagnostic.", {
    requestId: trace.requestId,
    endpoint: trace.endpoint,
    stage,
    operationType,
    imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1",
    httpStatus: typeof providerError?.status === "number" ? providerError.status : httpStatus,
    providerErrorCode: typeof providerError?.code === "string" ? providerError.code.slice(0, 80) : undefined,
    providerErrorName: error instanceof Error ? error.name : undefined,
    finalInternalServiceErrorCode,
    referencePresent: trace.hasReference,
    attemptedProviderOperations: trace.attemptedProviderOperations,
  });
}

function safetyError(decision: Exclude<RevImageSafetyDecision, { decision: "CLEAR" }>, message: string): ConceptGenerationServiceError {
  if (decision.decision === "HOLD") return new ConceptGenerationServiceError("safety-hold", message, false);
  if (decision.decision === "BLOCK") return new ConceptGenerationServiceError("safety-block", message, false);
  return new ConceptGenerationServiceError("safety-unavailable", message, decision.retryable);
}

function conceptSafetyContext(request: Pick<ConceptGenerationRequest, "brief">): string {
  const brief = request.brief;
  return [
    brief.originalIdea,
    brief.problemContext,
    brief.proposedSolution,
    brief.operatingConcept,
    brief.functionalElements,
    brief.inputsOutputs,
    brief.relationshipsFlow,
    brief.userInteraction,
    brief.arrangement,
    ...brief.constraints,
  ].filter(Boolean).join("\n");
}
