import type {
  Project,
  ProjectDecision,
  ProjectTimelineEvent,
} from "../core/project";

export type RecordEngineeringConclusionInput = {
  conclusion: string;
  reason: string;
  supportingEvidenceIds?: string[];
  supersedesConclusionId?: string;
};

export type RecordEngineeringConclusionResult =
  | { status: "recorded"; project: Project; decisionId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordEngineeringConclusion(
  project: Project,
  input: RecordEngineeringConclusionInput
): RecordEngineeringConclusionResult {
  const conclusion = input.conclusion.trim();

  if (!conclusion) {
    return {
      status: "invalid",
      project,
      reason: "Record an engineering conclusion before saving it.",
    };
  }

  const supersededDecision = input.supersedesConclusionId
    ? project.decisions.find((decision) => decision.id === input.supersedesConclusionId)
    : undefined;

  if (
    input.supersedesConclusionId &&
    (!supersededDecision || supersededDecision.category !== "engineering-conclusion")
  ) {
    return {
      status: "invalid",
      project,
      reason: "An engineering conclusion can only supersede another engineering conclusion.",
    };
  }

  const now = new Date().toISOString();
  const decisionId = createId();
  const supportingEvidenceIds = normalizeSupportingEvidenceIds(
    project.evidence,
    input.supportingEvidenceIds
  );
  const decision: ProjectDecision = {
    id: decisionId,
    category: "engineering-conclusion",
    decision: conclusion,
    reason: input.reason.trim(),
    supportingEvidenceIds,
    sourceTimelineEventIds: [],
    validationItemIds: [],
    ...(supersededDecision ? { supersedesDecisionId: supersededDecision.id } : {}),
    ownerId: project.ownerId,
    createdAt: now,
  };
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "engineering-conclusion-recorded",
    title: "Engineering conclusion recorded",
    description: "The inventor recorded an engineering conclusion.",
    subject: "Engineering conclusion",
    response: conclusion,
    decisionId,
    createdAt: now,
  };

  return {
    status: "recorded",
    decisionId,
    project: {
      ...project,
      decisions: [...project.decisions, decision],
      timeline: [...project.timeline, timelineEvent],
      updatedAt: now,
    },
  };
}

function normalizeSupportingEvidenceIds(
  evidence: Project["evidence"],
  supportingEvidenceIds: string[] | undefined
): string[] {
  if (!supportingEvidenceIds?.length) return [];

  const availableIds = new Set(evidence.map((item) => item.id));
  const selectedIds = new Set<string>();

  return supportingEvidenceIds.filter(
    (id) => availableIds.has(id) && !selectedIds.has(id) && Boolean(selectedIds.add(id))
  );
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