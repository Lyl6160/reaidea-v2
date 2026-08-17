import {
  isSpecialistContributionBenchId,
  type Project,
  type ProjectEvidence,
  type ProjectTimelineEvent,
} from "../core/project";

export type RecordProjectEvidenceFromSpecialistContributionInput = {
  specialistContributionEventId: string;
  summary: string;
  source: string;
};

export type RecordProjectEvidenceFromSpecialistContributionResult =
  | { status: "recorded"; project: Project; evidenceId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordProjectEvidenceFromSpecialistContribution(
  project: Project,
  input: RecordProjectEvidenceFromSpecialistContributionInput
): RecordProjectEvidenceFromSpecialistContributionResult {
  const summary = input.summary.trim();
  const source = input.source.trim();

  if (!summary || !source) {
    return {
      status: "invalid",
      project,
      reason: "Record the evidence summary and source before adding it to the Project.",
    };
  }

  const sourceEvent = project.timeline.find(
    (event) =>
      event.id === input.specialistContributionEventId &&
      event.type === "specialist-contribution-recorded"
  );

  if (
    !sourceEvent ||
    !isSpecialistContributionBenchId(sourceEvent.specialistBenchId) ||
    !sourceEvent.description.trim()
  ) {
    return {
      status: "invalid",
      project,
      reason: "Choose a saved specialist finding before adding it as Project evidence.",
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
      "The inventor explicitly adopted Project evidence from a recorded specialist contribution.",
    response: summary,
    evidenceId,
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
