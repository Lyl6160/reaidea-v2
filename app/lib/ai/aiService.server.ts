import "server-only";

import type {
  ConceptCandidate,
  ConceptGenerationErrorCode,
  ConceptGenerationRequest,
  ConceptRefinementRequest,
} from "./types";
import { OpenAIConceptGenerationProvider } from "./providers/openaiProvider.server";

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

export async function generateConcept(
  request: ConceptGenerationRequest
): Promise<ConceptCandidate> {
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
    return await provider.generateConcept(request);
  } catch (error) {
    console.error(
      "Concept provider generation failed.",
      error instanceof Error ? error.name : "Unknown provider failure"
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
    return await new OpenAIConceptGenerationProvider(apiKey).refineConcept(request);
  } catch (error) {
    console.error(
      "Concept provider refinement failed.",
      error instanceof Error ? error.name : "Unknown provider failure"
    );
    throw new ConceptGenerationServiceError("provider-failure", "Model update could not complete.", true);
  }
}
