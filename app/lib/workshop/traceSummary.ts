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

export type AssertionValidationLink = {
  validationItemId: string;
  planStatus: "planned" | "in-progress" | "completed";
  outcome?: ValidationOutcome;
  evidenceId?: string;
  evidenceSummary?: string;
  evidenceSource?: string;
  resultCreatedAt?: string;
};

export type AssertionTraceEntry = {
  assertionId: string;
  kind: "assumption" | "constraint" | "uncertainty";
  value: string;
  status: "active" | "resolved" | "challenged" | "superseded";
  createdAt: string;
  supersededAssertionId?: string;
  validationLinks: AssertionValidationLink[];
  latestValidationOutcome?: ValidationOutcome;
  sourceProvenance: "not-recorded";
};

export type AssertionTraceSummary = {
  assertions: AssertionTraceEntry[];
  activeAssumptions: AssertionTraceEntry[];
  historicalAssertions: AssertionTraceEntry[];
  legacyCurrentAssumptions: string[];
  primaryAssertion: AssertionTraceEntry | null;
  primaryLegacyCurrentAssumption: string | null;
};

export type EngineeringTraceSummary = {
  assertionTrace: AssertionTraceSummary;
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
    assertionTrace: summarizeAssertions(project),
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

function summarizeAssertions(project: Project): AssertionTraceSummary {
  const assertions = project.engineeringAssertions ?? [];
  const entries = assertions.map((assertion) => {
    const validationLinks = project.validationPlan?.items
      .filter((item) => item.sourceAssertionIds?.includes(assertion.id))
      .map((item) => createAssertionValidationLink(project, item)) ?? [];
    const latestValidationOutcome = [...validationLinks]
      .filter((link) => link.outcome)
      .sort(compareValidationLinks)
      .at(-1)?.outcome;

    return {
      assertionId: assertion.id,
      kind: assertion.kind,
      value: assertion.value,
      status: assertion.status,
      createdAt: assertion.createdAt,
      ...(assertion.supersedesAssertionId
        ? { supersededAssertionId: assertion.supersedesAssertionId }
        : {}),
      validationLinks,
      ...(latestValidationOutcome ? { latestValidationOutcome } : {}),
      sourceProvenance: "not-recorded" as const,
    };
  });
  const activeAssumptions = entries.filter(
    (entry) => entry.kind === "assumption" && entry.status === "active"
  );
  const activeValues = new Set(activeAssumptions.map((entry) => entry.value));
  const legacyCurrentAssumptions = project.engineeringState.currentAssumptions.filter(
    (value) => !activeValues.has(value)
  );

  return {
    assertions: entries,
    activeAssumptions,
    historicalAssertions: entries.filter((entry) => entry.status !== "active"),
    legacyCurrentAssumptions,
    primaryAssertion: selectPrimaryAssertion(activeAssumptions),
    primaryLegacyCurrentAssumption:
      activeAssumptions.length === 0 ? legacyCurrentAssumptions[0] ?? null : null,
  };
}

function selectPrimaryAssertion(
  assertions: AssertionTraceEntry[]
): AssertionTraceEntry | null {
  const ranked = assertions
    .map((assertion, index) => ({ assertion, index, rank: assertionRank(assertion) }))
    .sort((left, right) => right.rank - left.rank || left.index - right.index);

  return ranked[0]?.assertion ?? null;
}

function assertionRank(assertion: AssertionTraceEntry): number {
  if (assertion.validationLinks.some((link) => link.planStatus === "in-progress")) {
    return 5;
  }

  if (assertion.latestValidationOutcome === "inconclusive") {
    return 4;
  }

  if (assertion.validationLinks.some((link) => link.planStatus === "planned")) {
    return 3;
  }

  return assertion.validationLinks.length > 0 ? 2 : 1;
}

function createAssertionValidationLink(
  project: Project,
  item: NonNullable<Project["validationPlan"]>["items"][number]
): AssertionValidationLink {
  const evidence = item.evidenceId
    ? project.evidence.find(
        (candidate) =>
          candidate.id === item.evidenceId &&
          candidate.validationItemId === item.id &&
          candidate.validationOutcome === item.outcome
      )
    : undefined;
  const resultEvent = evidence
    ? project.timeline.find(
        (event) =>
          event.type === "validation-result-recorded" &&
          event.validationItemId === item.id &&
          event.evidenceId === evidence.id &&
          event.validationOutcome === evidence.validationOutcome
      )
    : undefined;

  return {
    validationItemId: item.id,
    planStatus: item.status,
    ...(resultEvent && evidence?.validationOutcome
      ? {
          outcome: evidence.validationOutcome,
          evidenceId: evidence.id,
          evidenceSummary: evidence.summary,
          evidenceSource: evidence.source,
          resultCreatedAt: resultEvent.createdAt,
        }
      : {}),
  };
}

function compareValidationLinks(
  left: AssertionValidationLink,
  right: AssertionValidationLink
): number {
  const leftTime = left.resultCreatedAt ? Date.parse(left.resultCreatedAt) : NaN;
  const rightTime = right.resultCreatedAt ? Date.parse(right.resultCreatedAt) : NaN;

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return 0;
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