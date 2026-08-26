import type { HomeUnderstandingTimelineMetadata } from "../workshop/homeUnderstanding";

export type ProjectReadiness =
  | "observation"
  | "understanding"
  | "development"
  | "validation"
  | "ready";

export type ProjectStatus = "active";

export type ProjectOriginIntent =
  | "developing"
  | "evaluating"
  | "both";

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
  sourceTimelineEventIds?: string[];
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
  basisConclusionIds?: string[];
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
  sourceAssertionIds?: string[];
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

export type EngineeringAssertionKind =
  | "assumption"
  | "constraint"
  | "uncertainty";

export type EngineeringAssertionStatus =
  | "active"
  | "resolved"
  | "challenged"
  | "superseded";

export type ProjectEngineeringAssertion = {
  id: string;
  kind: EngineeringAssertionKind;
  value: string;
  status: EngineeringAssertionStatus;
  createdAt: string;
  sourceTimelineEventIds?: string[];
  supersedesAssertionId?: string;
};

export type ProjectEngineeringAction = {
  id: string;
  action: string;
  reason: string;
  basisDirectionIds: string[];
  ownerId: string;
  createdAt: string;
};

export type SpecialistContributionBenchId =
  | "patent"
  | "marketing"
  | "manufacturing"
  | "reality";

export function isSpecialistContributionBenchId(
  value: unknown
): value is SpecialistContributionBenchId {
  return (
    value === "patent" ||
    value === "marketing" ||
    value === "manufacturing" ||
    value === "reality"
  );
}

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
  | "engineering-definition-input-recorded"
  | "validation-plan-created"
  | "validation-item-started"
  | "validation-result-recorded"
  | "validation-plan-completed"
  | "knowledge-input-recorded"
  | "concept-review-recorded"
  | "concept-direction-recorded"
  | "engineering-conclusion-recorded"
  | "engineering-direction-recorded"
  | "engineering-action-recorded"
  | "engineering-action-result-recorded"
  | "project-evidence-recorded"
  | "specialist-contribution-recorded"
  | "home-understanding-question-recorded"
  | "home-understanding-knowledge-recorded"
  | "home-understanding-presentation-claimed";

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
  decisionId?: string;
  engineeringActionId?: string;
  specialistBenchId?: SpecialistContributionBenchId;
  homeUnderstanding?: HomeUnderstandingTimelineMetadata;
};

export type Project = {
  id: string;
  projectName: string;
  ownerId: string;
  originalObservation: string;
  originIntent?: ProjectOriginIntent;
  purpose: string;
  status: ProjectStatus;
  readiness: ProjectReadiness;
  engineeringState: EngineeringState;
  engineeringAssertions: ProjectEngineeringAssertion[];
  engineeringActions: ProjectEngineeringAction[];
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
  originIntent: ProjectOriginIntent;
};

export function createProject(input: CreateProjectInput): Project {
  const originalObservation = input.originalObservation;

  if (!originalObservation.trim()) {
    throw new Error("A Project requires an original observation.");
  }

  const now = new Date().toISOString();
  const projectName = createProjectName(originalObservation);

  return {
    id: createId(),
    projectName,
    ownerId: input.ownerId,
    originalObservation,
    originIntent: input.originIntent,
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
    engineeringAssertions: [],
    engineeringActions: [],
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

export function recordHomeSourceImage(project: Project, reference: string): Project {
  const cleanReference = reference.trim();
  if (!cleanReference || project.files.includes(cleanReference)) return project;
  const now = new Date().toISOString();
  return {
    ...project,
    files: [...project.files, cleanReference],
    timeline: [
      ...project.timeline,
      {
        id: createId(),
        type: "knowledge-input-recorded",
        title: "Home reference image supplied",
        description: "The inventor supplied a visual reference with the Home description.",
        subject: cleanReference,
        createdAt: now,
      },
    ],
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
