import type {
  Project,
  ProjectEngineeringAction,
  ProjectTimelineEvent,
} from "../core/project";

export type RecordEngineeringActionInput = {
  action: string;
  reason: string;
  basisDirectionIds?: string[];
};

export type RecordEngineeringActionResult =
  | { status: "recorded"; project: Project; actionId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordEngineeringAction(
  project: Project,
  input: RecordEngineeringActionInput
): RecordEngineeringActionResult {
  const action = input.action.trim();

  if (!action) {
    return {
      status: "invalid",
      project,
      reason: "Record an engineering action before saving it.",
    };
  }

  const basisDirectionIds = normalizeBasisDirectionIds(input.basisDirectionIds);

  if (basisDirectionIds.length === 0) {
    return {
      status: "invalid",
      project,
      reason: "Select at least one current engineering direction as the basis for this action.",
    };
  }

  const currentDirectionIds = currentEngineeringDirectionIds(project);

  if (basisDirectionIds.some((id) => !currentDirectionIds.has(id))) {
    return {
      status: "invalid",
      project,
      reason: "Every selected basis must be a current engineering direction.",
    };
  }

  const now = new Date().toISOString();
  const actionId = createId();
  const engineeringAction: ProjectEngineeringAction = {
    id: actionId,
    action,
    reason: input.reason.trim(),
    basisDirectionIds,
    ownerId: project.ownerId,
    createdAt: now,
  };
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "engineering-action-recorded",
    title: "Engineering action recorded",
    description: "The inventor adopted an engineering action.",
    subject: "Engineering action",
    response: action,
    createdAt: now,
  };

  return {
    status: "recorded",
    actionId,
    project: {
      ...project,
      engineeringActions: [...project.engineeringActions, engineeringAction],
      timeline: [...project.timeline, timelineEvent],
      updatedAt: now,
    },
  };
}

function normalizeBasisDirectionIds(basisDirectionIds: string[] | undefined): string[] {
  if (!basisDirectionIds?.length) return [];

  const seenIds = new Set<string>();

  return basisDirectionIds.filter(
    (id) => typeof id === "string" && id.trim().length > 0 && !seenIds.has(id) && Boolean(seenIds.add(id))
  );
}

function currentEngineeringDirectionIds(project: Project): Set<string> {
  const directions = project.decisions.filter(
    (decision) => decision.category === "engineering-direction"
  );
  const directionIds = new Set(directions.map((decision) => decision.id));
  const supersededIds = new Set(
    directions
      .map((decision) => {
        const supersededId = decision.supersedesDecisionId;
        return supersededId && supersededId !== decision.id && directionIds.has(supersededId)
          ? supersededId
          : null;
      })
      .filter((id): id is string => Boolean(id))
  );

  return new Set(
    directions
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