export type ProjectReadiness =
  | "observation"
  | "understanding"
  | "development"
  | "validation"
  | "ready";

export type ProjectStatus = "active";

export type ValidationOutcome =
  | "confirmed"
  | "refined"
  | "challenged"
  | "inconclusive";

export type ProjectEvidence = {
  id: string;
  summary: string;
  source: string;
  validationItemId?: string;
  validationOutcome?: ValidationOutcome;
  createdAt: string;
};

export type ProjectDecisionCategory =
  | "engineering-conclusion"
  | "concept-review"
  | "concept-direction"
  | "engineering-direction";

export type ProjectConceptRef = {
  id: string;
  revision: number;
};

export type ProjectDecision = {
  id: string;
  decision: string;
  reason: string;
  supportingEvidenceIds: string[];
  ownerId: string;
  createdAt: string;
  category?: ProjectDecisionCategory;
  sourceTimelineEventIds?: string[];
  validationItemIds?: string[];
  conceptRef?: ProjectConceptRef;
  supersedesDecisionId?: string;
};

export type ValidationPlanItemSource =
  | "assumption"
  | "evidence-gap"
  | "reported-evidence"
  | "engineering-state";

export type ValidationPlanItemStatus = "planned" | "in-progress" | "completed";

export type ValidationPlanStatus = "planned" | "in-progress" | "completed";

export type ValidationPlanItem = {
  id: string;
  source: ValidationPlanItemSource;
  title: string;
  target: string;
  method: string;
  evidenceNeeded: string;
  completionRule: string;
  status: ValidationPlanItemStatus;
  startedAt?: string;
  completedAt?: string;
  evidenceId?: string;
  sourceTimelineEventIds?: string[];
  evidenceSummary?: string;
  evidenceSource?: string;
  resultSummary?: string;
  outcome?: ValidationOutcome;
  assessmentRationale?: string;
};

export type ValidationPlan = {
  status: ValidationPlanStatus;
  purpose: string;
  items: ValidationPlanItem[];
  createdAt: string;
  updatedAt: string;
};

export type EngineeringState = {
  currentUnderstanding: string;
  currentEvidence: string[];
  currentAssumptions: string[];
  currentConstraints: string[];
  greatestRemainingUncertainty: string;
  nextEngineeringStep: string;
};

export type EngineeringStateField =
  | "currentUnderstanding"
  | "currentEvidence"
  | "currentAssumptions"
  | "currentConstraints"
  | "greatestRemainingUncertainty"
  | "nextEngineeringStep";

export type ProjectTimelineEventType =
  | "project-created"
  | "discovery-understanding-added"
  | "discovery-answer-recorded"
  | "validation-plan-created"
  | "validation-item-started"
  | "validation-result-recorded"
  | "validation-plan-completed"
  | "knowledge-input-recorded";

export type ProjectTimelineEvent = {
  id: string;
  type: ProjectTimelineEventType;
  title: string;
  description: string;
  subject?: string;
  response?: string;
  createdAt: string;
  validationItemId?: string;
  evidenceId?: string;
  validationOutcome?: ValidationOutcome;
  engineeringStateChangedFields?: EngineeringStateField[];
};

export type Project = {
  id: string;
  projectName: string;
  ownerId: string;
  originalObservation: string;
  purpose: string;
  status: ProjectStatus;
  readiness: ProjectReadiness;
  engineeringState: EngineeringState;
  validationPlan: ValidationPlan | null;
  evidence: ProjectEvidence[];
  decisions: ProjectDecision[];
  files: string[];
  timeline: ProjectTimelineEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  ownerId: string;
  originalObservation: string;
};

export function createProject(input: CreateProjectInput): Project {
  const originalObservation = input.originalObservation.trim();

  if (!originalObservation) {
    throw new Error("A Project requires an original observation.");
  }

  const now = new Date().toISOString();
  const projectName = createProjectName(originalObservation);

  return {
    id: createId(),
    projectName,
    ownerId: input.ownerId,
    originalObservation,
    purpose: "",
    status: "active",
    readiness: "observation",
    engineeringState: {
      currentUnderstanding: originalObservation,
      currentEvidence: [],
      currentAssumptions: [],
      currentConstraints: [],
      greatestRemainingUncertainty:
        "The observation has not yet been explored in enough detail to identify the underlying engineering problem.",
      nextEngineeringStep:
        "Clarify what is happening now and why the observation matters.",
    },
    validationPlan: null,
    evidence: [],
    decisions: [],
    files: [],
    timeline: [
      createTimelineEvent(
        "project-created",
        "Project created",
        "The original observation was preserved and the Project entered Discovery.",
        now
      ),
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function createProjectName(observation: string): string {
  const firstSentence = observation.split(/[.!?]/)[0]?.trim() || "";
  const source = firstSentence || observation.trim();

  if (source.length <= 60) {
    return source;
  }

  return `${source.slice(0, 57).trim()}...`;
}

function createTimelineEvent(
  type: ProjectTimelineEventType,
  title: string,
  description: string,
  createdAt: string
): ProjectTimelineEvent {
  return {
    id: createId(),
    type,
    title,
    description,
    createdAt,
  };
}

function createId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
