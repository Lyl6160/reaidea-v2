import type {
  EngineeringStateField,
  Project,
  ProjectDecision,
  ProjectTimelineEvent,
  ValidationOutcome,
} from "../core/project";

export type ActiveConceptDecision = {
  id: string;
  outcome: string;
  reason: string;
  conceptFamilyId: string;
  revision: number;
  createdAt: string;
  supersededDecisionId?: string;
};

export type LatestValidationResult = {
  validationItemId: string;
  evidenceId: string;
  outcome: ValidationOutcome;
  changedFields: EngineeringStateField[];
  evidenceSummary: string;
  evidenceSource: string;
  createdAt: string;
};

export type EngineeringTraceSummary = {
  activeConceptReview: ActiveConceptDecision | null;
  activeConceptDirection: ActiveConceptDecision | null;
  latestValidationResult: LatestValidationResult | null;
  unresolvedValidation: boolean;
  validationPlanComplete: boolean;
};

export function summarizeEngineeringTrace(project: Project): EngineeringTraceSummary {
  const validationPlan = project.validationPlan;
  const latestValidationResult = findLatestValidationResult(project);

  return {
    activeConceptReview: resolveActiveConceptDecision(
      project.decisions,
      "concept-review",
      1
    ),
    activeConceptDirection: resolveActiveConceptDecision(
      project.decisions,
      "concept-direction",
      2
    ),
    latestValidationResult,
    unresolvedValidation: Boolean(
      validationPlan?.items.some((item) => item.status !== "completed") ||
        latestValidationResult?.outcome === "inconclusive" ||
        project.engineeringState.greatestRemainingUncertainty.toLowerCase().includes("inconclusive")
    ),
    validationPlanComplete: Boolean(
      validationPlan && validationPlan.items.length > 0 && validationPlan.items.every(
        (item) => item.status === "completed"
      )
    ),
  };
}

function resolveActiveConceptDecision(
  decisions: ProjectDecision[],
  category: "concept-review" | "concept-direction",
  revision: number
): ActiveConceptDecision | null {
  const candidates = decisions
    .map((decision, index) => ({ decision, index }))
    .filter(
      ({ decision }) =>
        decision.category === category && decision.conceptRef?.revision === revision
    );
  const candidateIds = new Set(candidates.map(({ decision }) => decision.id));
  const supersededIds = new Set(
    candidates
      .map(({ decision }) => {
        const superseded = decision.supersedesDecisionId;
        return superseded && candidateIds.has(superseded) ? superseded : null;
      })
      .filter((id): id is string => Boolean(id))
  );
  const active = candidates.filter(({ decision }) => !supersededIds.has(decision.id));

  active.sort((left, right) => {
    const leftTime = Date.parse(left.decision.createdAt);
    const rightTime = Date.parse(right.decision.createdAt);
    const validTimes = Number.isFinite(leftTime) && Number.isFinite(rightTime);

    if (validTimes && leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return right.index - left.index;
  });

  const selected = active[0]?.decision;
  if (!selected?.conceptRef) return null;

  return {
    id: selected.id,
    outcome: selected.decision,
    reason: selected.reason,
    conceptFamilyId: selected.conceptRef.id,
    revision: selected.conceptRef.revision,
    createdAt: selected.createdAt,
    ...(selected.supersedesDecisionId
      ? { supersededDecisionId: selected.supersedesDecisionId }
      : {}),
  };
}

function findLatestValidationResult(project: Project): LatestValidationResult | null {
  const events = project.timeline
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === "validation-result-recorded")
    .sort((left, right) => {
      const leftTime = Date.parse(left.event.createdAt);
      const rightTime = Date.parse(right.event.createdAt);
      const validTimes = Number.isFinite(leftTime) && Number.isFinite(rightTime);

      if (validTimes && leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return right.index - left.index;
    });

  for (const { event } of events) {
    const result = toValidationResult(project, event);
    if (result) return result;
  }

  return null;
}

function toValidationResult(
  project: Project,
  event: ProjectTimelineEvent
): LatestValidationResult | null {
  if (!event.validationItemId || !event.evidenceId || !event.validationOutcome) {
    return null;
  }

  const item = project.validationPlan?.items.find(
    (candidate) => candidate.id === event.validationItemId
  );
  const evidence = project.evidence.find(
    (candidate) => candidate.id === event.evidenceId
  );

  if (
    !item ||
    !evidence ||
    evidence.validationItemId !== item.id ||
    evidence.validationOutcome !== event.validationOutcome
  ) {
    return null;
  }

  return {
    validationItemId: item.id,
    evidenceId: evidence.id,
    outcome: event.validationOutcome,
    changedFields: event.engineeringStateChangedFields ?? [],
    evidenceSummary: evidence.summary,
    evidenceSource: evidence.source,
    createdAt: event.createdAt,
  };
}