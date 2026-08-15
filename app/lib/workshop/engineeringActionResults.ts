import type { Project, ProjectTimelineEvent } from "../core/project";

export type RecordEngineeringActionResultInput = {
  actionId: string;
  result: string;
};

export type RecordEngineeringActionResultResult =
  | { status: "recorded"; project: Project; eventId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordEngineeringActionResult(
  project: Project,
  input: RecordEngineeringActionResultInput
): RecordEngineeringActionResultResult {
  const result = input.result.trim();

  if (!result) {
    return {
      status: "invalid",
      project,
      reason: "Record what happened before saving an engineering action result.",
    };
  }

  const action = project.engineeringActions.find(
    (candidate) => candidate.id === input.actionId
  );

  if (!action) {
    return {
      status: "invalid",
      project,
      reason: "Select an existing adopted engineering action before recording a result.",
    };
  }

  const now = new Date().toISOString();
  const eventId = createId();
  const timelineEvent: ProjectTimelineEvent = {
    id: eventId,
    type: "engineering-action-result-recorded",
    title: "Engineering action result recorded",
    description:
      "The inventor recorded what happened while undertaking an adopted engineering action.",
    subject: action.action,
    response: result,
    engineeringActionId: action.id,
    createdAt: now,
  };

  return {
    status: "recorded",
    eventId,
    project: {
      ...project,
      timeline: [...project.timeline, timelineEvent],
      updatedAt: now,
    },
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
