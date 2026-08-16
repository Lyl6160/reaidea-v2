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
  outputType: ConceptOutputType;
  brief: ConceptBrief;
  sourceEventIds: string[];
  sourceTrace: ConceptBriefSource[];
  briefVersion: 1;
};

export type ConceptCandidate = {
  candidateId: string;
  conceptFamilyId: string;
  revision: number;
  title: string;
  visualMode: IdeaVisualMode;
  status: "generated";
  output: ConceptOutput;
  createdAt: string;
  sourceBriefVersion: number;
  sourceBriefHash: string;
  sourceEventIds: string[];
  disclaimer: string;
};
