import type { ConceptGeometry } from "../geometry/conceptGeometry";

export type IdeaVisualMode =
  | "product"
  | "machine"
  | "process"
  | "software"
  | "system"
  | "environmental"
  | "mixed"
  | "unknown";

export type ConceptOutputType =
  | "image"
  | "diagram"
  | "ui-mockup"
  | "graph"
  | "hybrid";

export type ConceptRepresentationStyle =
  | "product-concept"
  | "engineering-outline"
  | "wireframe"
  | "solid-concept";

export type ConceptViewId = "iso" | "front" | "side";

export type ConceptImageView = {
  id: ConceptViewId;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  dataUrl: string;
  altText: string;
};

export type ConceptVisualDesignSnapshot = {
  nonAuthoritative: true;
  overallGeometry: string[];
  components: string[];
  materials: string[];
  colours: string[];
  labels: string[];
  relationships: string[];
  movement: string[];
  proportions: string[];
  visualConstraints: string[];
  preservedFeatures: string[];
  uncertainties: string[];
  componentAttributes: Record<string, Partial<Record<"geometry" | "materials" | "colours" | "labels" | "relationships" | "movement" | "proportions", string[]>>>;
};

export type ConceptBrief = {
  originalIdea: string;
  problemContext: string;
  proposedSolution: string;
  operatingConcept: string;
  functionalElements: string;
  inputsOutputs?: string;
  relationshipsFlow?: string;
  userInteraction?: string;
  arrangement?: string;
  constraints: string[];
  assumptions: string[];
  technicalUncertainty?: string;
};

export type ConceptBriefSource = {
  field: keyof ConceptBrief;
  sourceKind: "project-field" | "timeline-event" | "bench-note" | "source-evidence-interpretation";
  sourceId: string;
};

export type VisualUnderstandingRequest = {
  requestId: string;
  evidenceReference: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  dataUrl: string;
  inventorDescription?: string;
};

export type RevImageSafetyLimitation =
  | "safety-only"
  | "secure-storage-only"
  | "lawful-transport-only"
  | "training-only"
  | "disabled-replica-only"
  | "historical-study-only"
  | "non-weapon-accessory-only"
  | "containment-only"
  | "shielding-only"
  | "hazard-detection-only"
  | "remote-handling-only"
  | "emergency-response-only"
  | "verified-hazard-input-required";

export type RevImageSafetyReceipt = {
  decision: "CLEAR";
  imageDigest: string;
  inventorContextDigest: string;
  checkedAt: string;
  policyVersion: 1;
  limitations: RevImageSafetyLimitation[];
};

export type RevImageSafetyDecision =
  | { decision: "CLEAR"; receipt: RevImageSafetyReceipt }
  | { decision: "HOLD"; question: string }
  | { decision: "BLOCK" }
  | { decision: "unavailable"; retryable: boolean };

export type ProviderImageSafetyReport = {
  available: true;
  flagged: boolean;
  immediateBlock: boolean;
  controlledRisk: "firearm" | "chemical-explosive" | "none";
  factualSummary: string;
  visualObservations: string[];
  uncertainties: string[];
};

export type VisualUnderstandingResult = {
  evidenceReference: string;
  nonAuthoritative: true;
  createdAt: string;
  factualSummary: string;
  visualObservations: string[];
  uncertainties: string[];
};

export type VisualUnderstandingApiResponse =
  | { safety: Extract<RevImageSafetyDecision, { decision: "CLEAR" }>; interpretation: VisualUnderstandingResult }
  | { safety: Exclude<RevImageSafetyDecision, { decision: "CLEAR" }> }
  | { error: { code: "invalid-request" | "not-configured" | "unsupported" | "provider-failure"; message: string; retryable: boolean } };

export type ImageConceptOutput = {
  type: "image";
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  url?: string;
  dataUrl?: string;
  altText: string;
  viewLayout?: "three-view-sheet";
  availableViews?: ConceptViewId[];
  primaryView?: ConceptViewId;
  views?: ConceptImageView[];
};

export type DiagramConceptOutput = {
  type: "diagram";
  format: "svg" | "structured-json";
  content: string;
};

export type UiMockupConceptOutput = {
  type: "ui-mockup";
  format: "image" | "structured-json";
  content: string;
};

export type GraphConceptOutput = {
  type: "graph";
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string; label?: string }>;
};

export type HybridConceptOutput = {
  type: "hybrid";
  parts: Array<
    ImageConceptOutput | DiagramConceptOutput | UiMockupConceptOutput | GraphConceptOutput
  >;
};

export type ConceptOutput =
  | ImageConceptOutput
  | DiagramConceptOutput
  | UiMockupConceptOutput
  | GraphConceptOutput
  | HybridConceptOutput;

export type ConceptGenerationRequest = {
  requestId: string;
  conceptFamilyId: string;
  revision: number;
  title: string;
  visualMode: IdeaVisualMode;
  representationStyle: ConceptRepresentationStyle;
  outputType: ConceptOutputType;
  brief: ConceptBrief;
  sourceEventIds: string[];
  sourceTrace: ConceptBriefSource[];
  briefVersion: 1;
  safetyLimitations?: RevImageSafetyLimitation[];
  referenceImage?: {
    evidenceReference: string;
    sourceEventId: string;
    mediaType: "image/png" | "image/jpeg" | "image/webp";
    dataUrl: string;
  };
};

export type ConceptRefinementRequest = {
  requestId: string;
  conceptFamilyId: string;
  sourceCandidateId: string;
  sourceRevision: number;
  nextRevision: number;
  title: string;
  visualMode: IdeaVisualMode;
  representationStyle: ConceptRepresentationStyle;
  outputType: "image";
  brief: ConceptBrief;
  sourceEventIds: string[];
  sourceTrace: ConceptBriefSource[];
  briefVersion: 1;
  safetyLimitations?: RevImageSafetyLimitation[];
  inventorRefinement: string;
  sourceVisualDesignSnapshot?: ConceptVisualDesignSnapshot;
  sourceImage: {
    mediaType: "image/png" | "image/jpeg" | "image/webp";
    dataUrl: string;
  };
};

export type ConceptViewAssetRequest = ConceptGenerationRequest & {
  sourceCandidateId: string;
  requestedView: ConceptViewId;
  fullObject: boolean;
  visualDesignSnapshot?: ConceptVisualDesignSnapshot;
};

export type ConceptCandidate = {
  candidateId: string;
  conceptFamilyId: string;
  revision: number;
  title: string;
  visualMode: IdeaVisualMode;
  representationStyle: ConceptRepresentationStyle;
  status: "generated";
  output: ConceptOutput;
  createdAt: string;
  sourceBriefVersion: number;
  sourceBriefHash: string;
  sourceEventIds: string[];
  sourceCandidateId?: string;
  inventorRefinement?: string;
  visualDesignSnapshot?: ConceptVisualDesignSnapshot;
  initialGeometryPlan?: InitialGeometryPlan;
  conceptGeometry?: ConceptGeometry;
  conceptGeometryStatus?: "available" | "insufficient-data" | "unsupported-geometry" | "invalid-snapshot";
  disclaimer: string;
};

export type InitialGeometryDatum = {
  id: string;
  label: string;
  value: string | number | boolean;
  unit?: "mm" | "degrees" | "count";
  status: "inventor-evidence" | "interpreted" | "working-assumption";
  basis: "accepted-description" | "cleared-image-interpretation" | "rev-portable-signage-profile";
  blocksGeometry: boolean;
  inventorConfirmationDesirable: boolean;
};

export type InitialGeometryBlocker = {
  code: "unsupported-profile" | "insufficient-form" | "invalid-plan" | "invalid-geometry";
  safeMessage: string;
};

/** Non-authoritative, candidate-owned construction input; it never replaces inventor evidence. */
export type InitialGeometryPlan = {
  version: 1;
  nonAuthoritative: true;
  profile: "portable-signage";
  parameters: InitialGeometryDatum[];
  componentIds: string[];
  blocker?: InitialGeometryBlocker;
};

export type ConceptGenerationErrorCode =
  | "invalid-request"
  | "unsupported-mode"
  | "not-configured"
  | "provider-failure"
  | "safety-hold"
  | "safety-block"
  | "safety-unavailable";

export type ConceptCreationFailureCategory =
  | ConceptGenerationErrorCode
  | "network"
  | "candidate-validation"
  | "local-persistence"
  | "request-construction"
  | "interrupted";

/** Safe operational metadata only. It deliberately excludes prompts, images and provider payloads. */
export type ConceptCreationDiagnostic = {
  correlationId: string;
  category: ConceptCreationFailureCategory;
  httpStatus?: number;
  providerOperationAttempts: number | "unknown";
  modelIdentifier?: string;
  occurredAt: string;
  retryable: boolean;
};

export type ConceptGenerationApiResponse =
  | {
      candidate: ConceptCandidate;
      referenceUsage?: "used" | "unsupported";
    }
  | {
      error: {
        code: ConceptGenerationErrorCode;
        message: string;
        retryable: boolean;
        diagnostic?: ConceptCreationDiagnostic;
      };
    };

export type ConceptRefinementApiResponse = ConceptGenerationApiResponse;
export type ConceptViewAssetApiResponse =
  | { view: ConceptImageView }
  | Exclude<ConceptGenerationApiResponse, { candidate: ConceptCandidate }>;

export interface ConceptGenerationProvider {
  readonly supportsReferenceImages: boolean;
  generateConcept(request: ConceptGenerationRequest): Promise<ConceptCandidate>;
  refineConcept(request: ConceptRefinementRequest): Promise<ConceptCandidate>;
  generateViewAsset(request: ConceptViewAssetRequest): Promise<ConceptImageView>;
}

export interface VisualUnderstandingProvider {
  readonly supportsVisualUnderstanding: boolean;
  understandImage(request: VisualUnderstandingRequest): Promise<VisualUnderstandingResult>;
  inspectImageSafety(request: VisualUnderstandingRequest): Promise<ProviderImageSafetyReport>;
}
