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
  sourceKind: "project-field" | "timeline-event" | "bench-note";
  sourceId: string;
};

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
  conceptGeometry?: ConceptGeometry;
  conceptGeometryStatus?: "available" | "insufficient-data" | "unsupported-geometry" | "invalid-snapshot";
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
export type ConceptViewAssetApiResponse =
  | { view: ConceptImageView }
  | Exclude<ConceptGenerationApiResponse, { candidate: ConceptCandidate }>;

export interface ConceptGenerationProvider {
  generateConcept(request: ConceptGenerationRequest): Promise<ConceptCandidate>;
  refineConcept(request: ConceptRefinementRequest): Promise<ConceptCandidate>;
  generateViewAsset(request: ConceptViewAssetRequest): Promise<ConceptImageView>;
}
