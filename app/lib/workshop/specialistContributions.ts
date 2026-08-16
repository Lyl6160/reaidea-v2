import {
  isSpecialistContributionBenchId,
  type Project,
  type ProjectTimelineEvent,
  type SpecialistContributionBenchId,
} from "../core/project";

export type RecordSpecialistContributionInput = {
  specialistBenchId: SpecialistContributionBenchId;
  contribution: string;
};

export type RecordSpecialistContributionResult =
  | { status: "recorded"; project: Project; eventId: string }
  | { status: "invalid"; project: Project; reason: string };

export function recordSpecialistContribution(
  project: Project,
  input: RecordSpecialistContributionInput
): RecordSpecialistContributionResult {
  if (!isSpecialistContributionBenchId(input.specialistBenchId)) {
    return {
      status: "invalid",
      project,
      reason: "Select an informational specialist bench before recording a contribution.",
    };
  }

  const contribution = input.contribution.trim();

  if (!contribution) {
    return {
      status: "invalid",
      project,
      reason: "Record a specialist contribution before saving it.",
    };
  }

  const now = new Date().toISOString();
  const eventId = createId();
  const timelineEvent: ProjectTimelineEvent = {
    id: eventId,
    type: "specialist-contribution-recorded",
    title: "Specialist contribution recorded",
    description: contribution,
    specialistBenchId: input.specialistBenchId,
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

export function getSpecialistContributions(
  project: Project,
  specialistBenchId: SpecialistContributionBenchId
): ProjectTimelineEvent[] {
  return project.timeline.filter(
    (event) =>
      event.type === "specialist-contribution-recorded" &&
      event.specialistBenchId === specialistBenchId
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
