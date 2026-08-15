import type {
  Project,
  ProjectDecision,
  ProjectTimelineEvent,
} from "../core/project";

export type RecordEngineeringDirectionInput = {
  direction: string;
  reason: string;
  basisConclusionIds?: string[];
  supersedesDirectionId?: string;
};

export type RecordEngineeringDirectionResult =
  | { status: "recorded"; project: Project; decisionId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordEngineeringDirection(
  project: Project,
  input: RecordEngineeringDirectionInput
): RecordEngineeringDirectionResult {
  const direction = input.direction.trim();

  if (!direction) {
    return {
      status: "invalid",
      project,
      reason: "Record an engineering direction before saving it.",
    };
  }

  const basisConclusionIds = normalizeBasisConclusionIds(input.basisConclusionIds);

  if (basisConclusionIds.length === 0) {
    return {
      status: "invalid",
      project,
      reason: "Select at least one current engineering conclusion as the basis for this direction.",
    };
  }

  const currentConclusionIds = currentEngineeringConclusionIds(project);

  if (basisConclusionIds.some((id) => !currentConclusionIds.has(id))) {
    return {
      status: "invalid",
      project,
      reason: "Every selected basis must be a current engineering conclusion.",
    };
  }

  const supersededDirection = input.supersedesDirectionId
    ? project.decisions.find((decision) => decision.id === input.supersedesDirectionId)
    : undefined;

  if (
    input.supersedesDirectionId &&
    (!supersededDirection || supersededDirection.category !== "engineering-direction")
  ) {
    return {
      status: "invalid",
      project,
      reason: "An engineering direction can only supersede another engineering direction.",
    };
  }

  const now = new Date().toISOString();
  const decisionId = createId();
  const decision: ProjectDecision = {
    id: decisionId,
    category: "engineering-direction",
    decision: direction,
    reason: input.reason.trim(),
    supportingEvidenceIds: [],
    validationItemIds: [],
    sourceTimelineEventIds: [],
    basisConclusionIds,
    ...(supersededDirection ? { supersedesDecisionId: supersededDirection.id } : {}),
    ownerId: project.ownerId,
    createdAt: now,
  };
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "engineering-direction-recorded",
    title: "Engineering direction recorded",
    description: "The inventor recorded an engineering direction.",
    subject: "Engineering direction",
    response: direction,
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

function normalizeBasisConclusionIds(basisConclusionIds: string[] | undefined): string[] {
  if (!basisConclusionIds?.length) return [];

  const seenIds = new Set<string>();

  return basisConclusionIds.filter(
    (id) => typeof id === "string" && id.trim().length > 0 && !seenIds.has(id) && Boolean(seenIds.add(id))
  );
}

function currentEngineeringConclusionIds(project: Project): Set<string> {
  const conclusions = project.decisions.filter(
    (decision) => decision.category === "engineering-conclusion"
  );
  const conclusionIds = new Set(conclusions.map((decision) => decision.id));
  const supersededIds = new Set(
    conclusions
      .map((decision) => {
        const supersededId = decision.supersedesDecisionId;
        return supersededId && supersededId !== decision.id && conclusionIds.has(supersededId)
          ? supersededId
          : null;
      })
      .filter((id): id is string => Boolean(id))
  );

  return new Set(
    conclusions
      .filter((decision) => !supersededIds.has(decision.id))
      .map((decision) => decision.id)
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