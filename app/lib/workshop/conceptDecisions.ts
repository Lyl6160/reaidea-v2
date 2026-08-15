import type {
  Project,
  ProjectDecision,
  ProjectDecisionCategory,
  ProjectTimelineEvent,
} from "../core/project";

export type ConceptDecisionStage = "review" | "direction";

export type RecordConceptDecisionInput = {
  stage: ConceptDecisionStage;
  decision: string;
  reason: string;
  conceptFamilyId?: string;
  existingDecisionId?: string;
};

export type RecordConceptDecisionResult = {
  project: Project;
  conceptFamilyId: string;
  decisionId: string;
  created: boolean;
};

export function recordConceptDecision(
  project: Project,
  input: RecordConceptDecisionInput
): RecordConceptDecisionResult {
  const category = categoryForStage(input.stage);
  const revision = revisionForStage(input.stage);
  const existingById = input.existingDecisionId
    ? project.decisions.find((decision) => decision.id === input.existingDecisionId)
    : undefined;
  const existingAtStage = project.decisions.find(
    (decision) =>
      decision.category === category &&
      decision.conceptRef?.revision === revision &&
      (!input.conceptFamilyId || decision.conceptRef.id === input.conceptFamilyId)
  );
  const conceptFamilyId =
    input.conceptFamilyId ??
    existingById?.conceptRef?.id ??
    existingAtStage?.conceptRef?.id ??
    createId();
  const existingDecision = existingById ?? existingAtStage;

  if (existingDecision?.decision === input.decision) {
    return {
      project,
      conceptFamilyId,
      decisionId: existingDecision.id,
      created: false,
    };
  }

  const now = new Date().toISOString();
  const decisionId = createId();
  const eventId = createId();
  const decision: ProjectDecision = {
    id: decisionId,
    category,
    decision: input.decision,
    reason: input.reason,
    supportingEvidenceIds: [],
    sourceTimelineEventIds: [],
    validationItemIds: [],
    conceptRef: {
      id: conceptFamilyId,
      revision,
    },
    ...(existingDecision ? { supersedesDecisionId: existingDecision.id } : {}),
    ownerId: project.ownerId,
    createdAt: now,
  };
  const event: ProjectTimelineEvent = {
    id: eventId,
    type: eventTypeForStage(input.stage),
    title: titleForStage(input.stage),
    description: descriptionForStage(input.stage, input.decision),
    subject: subjectForStage(input.stage),
    response: input.reason,
    decisionId,
    createdAt: now,
  };

  return {
    project: {
      ...project,
      decisions: [...project.decisions, decision],
      timeline: [...project.timeline, event],
      updatedAt: now,
    },
    conceptFamilyId,
    decisionId,
    created: true,
  };
}

function categoryForStage(stage: ConceptDecisionStage): ProjectDecisionCategory {
  return stage === "review" ? "concept-review" : "concept-direction";
}

function revisionForStage(stage: ConceptDecisionStage): number {
  return stage === "review" ? 1 : 2;
}

function eventTypeForStage(
  stage: ConceptDecisionStage
): "concept-review-recorded" | "concept-direction-recorded" {
  return stage === "review"
    ? "concept-review-recorded"
    : "concept-direction-recorded";
}

function titleForStage(stage: ConceptDecisionStage): string {
  return stage === "review"
    ? "Concept review recorded"
    : "Concept direction recorded";
}

function subjectForStage(stage: ConceptDecisionStage): string {
  return stage === "review" ? "Concept 01" : "Concept 02";
}

function descriptionForStage(
  stage: ConceptDecisionStage,
  decision: string
): string {
  return stage === "review"
    ? `Concept 01 review outcome: ${decision}.`
    : `Concept 02 direction outcome: ${decision}.`;
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