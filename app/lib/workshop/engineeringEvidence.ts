import type { Project, ProjectEvidence, ProjectTimelineEvent } from "../core/project";

export type RecordProjectEvidenceFromActionResultInput = {
  actionResultEventId: string;
  summary: string;
  source: string;
};

export type RecordProjectEvidenceFromActionResultResult =
  | { status: "recorded"; project: Project; evidenceId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordProjectEvidenceFromActionResult(
  project: Project,
  input: RecordProjectEvidenceFromActionResultInput
): RecordProjectEvidenceFromActionResultResult {
  const summary = input.summary.trim();
  const source = input.source.trim();

  if (!summary || !source) {
    return {
      status: "invalid",
      project,
      reason: "Record the evidence and its source before adding it to the Project.",
    };
  }

  const sourceEvent = project.timeline.find(
    (event) =>
      event.id === input.actionResultEventId &&
      event.type === "engineering-action-result-recorded"
  );

  if (
    !sourceEvent ||
    !sourceEvent.engineeringActionId ||
    !sourceEvent.response?.trim()
  ) {
    return {
      status: "invalid",
      project,
      reason: "Select a recorded engineering action result before adopting Project evidence.",
    };
  }

  const action = project.engineeringActions.find(
    (candidate) => candidate.id === sourceEvent.engineeringActionId
  );

  if (!action) {
    return {
      status: "invalid",
      project,
      reason: "The selected action result is not linked to an available adopted engineering action.",
    };
  }

  const now = new Date().toISOString();
  const evidenceId = createId();
  const evidence: ProjectEvidence = {
    id: evidenceId,
    summary,
    source,
    sourceTimelineEventIds: [sourceEvent.id],
    createdAt: now,
  };
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "project-evidence-recorded",
    title: "Project evidence recorded",
    description:
      "The inventor explicitly adopted Project evidence from a recorded engineering action result.",
    subject: action.action,
    response: summary,
    evidenceId,
    engineeringActionId: action.id,
    createdAt: now,
  };

  return {
    status: "recorded",
    evidenceId,
    project: {
      ...project,
      evidence: [...project.evidence, evidence],
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
