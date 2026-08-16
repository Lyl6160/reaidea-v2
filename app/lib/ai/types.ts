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
  | "engineering-outline"
  | "wireframe"
  | "solid-concept";

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
  sourceKind: "project-field" | "timeline-event";
  sourceId: string;
};

export type ImageConceptOutput = {
  type: "image";
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  url?: string;
  dataUrl?: string;
  altText: string;
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
  inventorRefinement: string;
  sourceImage: {
    mediaType: "image/png" | "image/jpeg" | "image/webp";
    dataUrl: string;
  };
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
  disclaimer: string;
};

export type ConceptGenerationErrorCode =
  | "invalid-request"
  | "unsupported-mode"
  | "not-configured"
  | "provider-failure";

export type ConceptGenerationApiResponse =
  | { candidate: ConceptCandidate }
  | {
      error: {
        code: ConceptGenerationErrorCode;
        message: string;
        retryable: boolean;
      };
    };

export type ConceptRefinementApiResponse = ConceptGenerationApiResponse;

export interface ConceptGenerationProvider {
  generateConcept(request: ConceptGenerationRequest): Promise<ConceptCandidate>;
  refineConcept(request: ConceptRefinementRequest): Promise<ConceptCandidate>;
}
