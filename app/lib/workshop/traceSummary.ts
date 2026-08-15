import type {
  EngineeringStateField,
  Project,
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
  supportingEvidenceState: ConceptSupportingEvidenceState;
  supportingEvidence: ConceptSupportingEvidenceReference[];
  supersededDecisionId?: string;
};

export type ConceptSupportingEvidenceState =
  | "none-explicitly-selected"
  | "selected-and-available"
  | "selected-partially-available"
  | "selected-unavailable";

export type ConceptSupportingEvidenceReference = {
  evidenceId: string;
  available: boolean;
  summary?: string;
  source?: string;
  validationOutcome?: ValidationOutcome;
};

export type EngineeringConclusionSupportingEvidenceState =
  | "none-explicitly-selected"
  | "selected-and-available"
  | "selected-partially-available"
  | "selected-unavailable";

export type EngineeringConclusionSupportingEvidenceReference = {
  evidenceId: string;
  available: boolean;
  summary?: string;
  source?: string;
  validationOutcome?: ValidationOutcome;
};

export type EngineeringConclusionTraceEntry = {
  id: string;
  conclusion: string;
  reason: string;
  createdAt: string;
  supportingEvidenceState: EngineeringConclusionSupportingEvidenceState;
  supportingEvidence: EngineeringConclusionSupportingEvidenceReference[];
  supersedesDecisionId?: string;
};

export type EngineeringDirectionBasisState =
  | "no-basis-recorded"
  | "recorded-and-available"
  | "recorded-partially-available"
  | "recorded-unavailable";

export type EngineeringDirectionBasisReference = {
  conclusionId: string;
  available: boolean;
  conclusion?: string;
  reason?: string;
  conclusionStatus?: "current" | "superseded";
};

export type EngineeringDirectionTraceEntry = {
  id: string;
  direction: string;
  reason: string;
  createdAt: string;
  basisState: EngineeringDirectionBasisState;
  basisConclusions: EngineeringDirectionBasisReference[];
  supersedesDecisionId?: string;
};

export type EngineeringActionDirectionBasisState =
  | "no-basis-recorded"
  | "recorded-and-available"
  | "recorded-partially-available"
  | "recorded-unavailable";

export type EngineeringActionDirectionBasisReference = {
  directionId: string;
  available: boolean;
  direction?: string;
  reason?: string;
  directionStatus?: "current" | "superseded";
};

export type EngineeringActionResultTraceEntry = {
  eventId: string;
  result?: string;
  createdAt: string;
};

export type EngineeringActionTraceEntry = {
  id: string;
  action: string;
  reason: string;
  createdAt: string;
  basisState: EngineeringActionDirectionBasisState;
  basisDirections: EngineeringActionDirectionBasisReference[];
  results: EngineeringActionResultTraceEntry[];
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

export type AssertionSourceProvenanceState =
  | "not-recorded"
  | "recorded-and-available"
  | "recorded-partially-available"
  | "recorded-source-unavailable";

export type AssertionSourceReference = {
  eventId: string;
  available: boolean;
  eventType?: ProjectTimelineEvent["type"];
  title?: string;
  createdAt?: string;
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
  sourceProvenance: AssertionSourceProvenanceState;
  sourceReferences: AssertionSourceReference[];
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
  currentEngineeringConclusions: EngineeringConclusionTraceEntry[];
  supersededEngineeringConclusions: EngineeringConclusionTraceEntry[];
  currentEngineeringDirections: EngineeringDirectionTraceEntry[];
  supersededEngineeringDirections: EngineeringDirectionTraceEntry[];
  adoptedEngineeringActions: EngineeringActionTraceEntry[];
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
      project,
      "concept-review",
      1
    ),
    activeConceptDirection: resolveActiveConceptDecision(
      project,
      "concept-direction",
      2
    ),
    ...summarizeEngineeringConclusions(project),
    ...summarizeEngineeringDirections(project),
    adoptedEngineeringActions: summarizeEngineeringActions(project),
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

function engineeringConclusionSupersededIds(project: Project): Set<string> {
  const conclusions = project.decisions.filter(
    (decision) => decision.category === "engineering-conclusion"
  );
  const conclusionIds = new Set(conclusions.map((decision) => decision.id));

  return new Set(
    conclusions
      .map((decision) => {
        const supersededId = decision.supersedesDecisionId;
        return supersededId && supersededId !== decision.id && conclusionIds.has(supersededId)
          ? supersededId
          : null;
      })
      .filter((id): id is string => Boolean(id))
  );
}

function summarizeEngineeringConclusions(project: Project): Pick<
  EngineeringTraceSummary,
  "currentEngineeringConclusions" | "supersededEngineeringConclusions"
> {
  const conclusions = project.decisions.filter(
    (decision) => decision.category === "engineering-conclusion"
  );
  const supersededIds = engineeringConclusionSupersededIds(project);
  const toTraceEntry = (decision: (typeof conclusions)[number]) =>
    createEngineeringConclusionTraceEntry(project, decision);

  return {
    currentEngineeringConclusions: conclusions
      .filter((decision) => !supersededIds.has(decision.id))
      .map(toTraceEntry),
    supersededEngineeringConclusions: conclusions
      .filter((decision) => supersededIds.has(decision.id))
      .map(toTraceEntry),
  };
}

function summarizeEngineeringDirections(project: Project): Pick<
  EngineeringTraceSummary,
  "currentEngineeringDirections" | "supersededEngineeringDirections"
> {
  const directions = project.decisions.filter(
    (decision) => decision.category === "engineering-direction"
  );
  const supersededIds = engineeringDirectionSupersededIds(project);
  const toTraceEntry = (decision: (typeof directions)[number]) =>
    createEngineeringDirectionTraceEntry(project, decision);

  return {
    currentEngineeringDirections: directions
      .filter((decision) => !supersededIds.has(decision.id))
      .map(toTraceEntry),
    supersededEngineeringDirections: directions
      .filter((decision) => supersededIds.has(decision.id))
      .map(toTraceEntry),
  };
}

function engineeringDirectionSupersededIds(project: Project): Set<string> {
  const directions = project.decisions.filter(
    (decision) => decision.category === "engineering-direction"
  );
  const directionIds = new Set(directions.map((decision) => decision.id));

  return new Set(
    directions
      .map((decision) => {
        const supersededId = decision.supersedesDecisionId;
        return supersededId && supersededId !== decision.id && directionIds.has(supersededId)
          ? supersededId
          : null;
      })
      .filter((id): id is string => Boolean(id))
  );
}

function summarizeEngineeringActions(project: Project): EngineeringActionTraceEntry[] {
  return project.engineeringActions.map((action) =>
    createEngineeringActionTraceEntry(project, action)
  );
}

function createEngineeringActionTraceEntry(
  project: Project,
  action: Project["engineeringActions"][number]
): EngineeringActionTraceEntry {
  const basisDirections = resolveEngineeringActionBasisDirections(
    project,
    action.basisDirectionIds
  );

  return {
    id: action.id,
    action: action.action,
    reason: action.reason,
    createdAt: action.createdAt,
    basisState: engineeringActionDirectionBasisState(basisDirections),
    basisDirections,
    results: resolveEngineeringActionResults(project, action.id),
  };
}

function resolveEngineeringActionResults(
  project: Project,
  actionId: string
): EngineeringActionResultTraceEntry[] {
  return project.timeline
    .filter(
      (event) =>
        event.type === "engineering-action-result-recorded" &&
        event.engineeringActionId === actionId
    )
    .map((event) => ({
      eventId: event.id,
      ...(typeof event.response === "string" && event.response.trim()
        ? { result: event.response }
        : {}),
      createdAt: event.createdAt,
    }));
}

function resolveEngineeringActionBasisDirections(
  project: Project,
  basisDirectionIds: string[] | undefined
): EngineeringActionDirectionBasisReference[] {
  if (!basisDirectionIds?.length) return [];

  const supersededDirectionIds = engineeringDirectionSupersededIds(project);

  return basisDirectionIds.map((directionId) => {
    const direction = project.decisions.find(
      (decision) =>
        decision.id === directionId && decision.category === "engineering-direction"
    );

    return direction
      ? {
          directionId,
          available: true,
          direction: direction.decision,
          reason: direction.reason,
          directionStatus: supersededDirectionIds.has(direction.id)
            ? "superseded"
            : "current",
        }
      : { directionId, available: false };
  });
}

function engineeringActionDirectionBasisState(
  basisDirections: EngineeringActionDirectionBasisReference[]
): EngineeringActionDirectionBasisState {
  if (basisDirections.length === 0) return "no-basis-recorded";

  const availableCount = basisDirections.filter((basis) => basis.available).length;
  if (availableCount === 0) return "recorded-unavailable";
  if (availableCount === basisDirections.length) return "recorded-and-available";

  return "recorded-partially-available";
}

function createEngineeringDirectionTraceEntry(
  project: Project,
  decision: Project["decisions"][number]
): EngineeringDirectionTraceEntry {
  const basisConclusions = resolveEngineeringDirectionBasisConclusions(
    project,
    decision.basisConclusionIds
  );

  return {
    id: decision.id,
    direction: decision.decision,
    reason: decision.reason,
    createdAt: decision.createdAt,
    basisState: engineeringDirectionBasisState(basisConclusions),
    basisConclusions,
    ...(decision.supersedesDecisionId
      ? { supersedesDecisionId: decision.supersedesDecisionId }
      : {}),
  };
}

function resolveEngineeringDirectionBasisConclusions(
  project: Project,
  basisConclusionIds: string[] | undefined
): EngineeringDirectionBasisReference[] {
  if (!basisConclusionIds?.length) return [];

  const supersededConclusionIds = engineeringConclusionSupersededIds(project);

  return basisConclusionIds.map((conclusionId) => {
    const conclusion = project.decisions.find(
      (decision) =>
        decision.id === conclusionId && decision.category === "engineering-conclusion"
    );

    return conclusion
      ? {
          conclusionId,
          available: true,
          conclusion: conclusion.decision,
          reason: conclusion.reason,
          conclusionStatus: supersededConclusionIds.has(conclusion.id)
            ? "superseded"
            : "current",
        }
      : { conclusionId, available: false };
  });
}

function engineeringDirectionBasisState(
  basisConclusions: EngineeringDirectionBasisReference[]
): EngineeringDirectionBasisState {
  if (basisConclusions.length === 0) return "no-basis-recorded";

  const availableCount = basisConclusions.filter((basis) => basis.available).length;
  if (availableCount === 0) return "recorded-unavailable";
  if (availableCount === basisConclusions.length) return "recorded-and-available";

  return "recorded-partially-available";
}

function createEngineeringConclusionTraceEntry(
  project: Project,
  decision: Project["decisions"][number]
): EngineeringConclusionTraceEntry {
  const supportingEvidence = resolveEngineeringConclusionSupportingEvidence(
    project.evidence,
    decision.supportingEvidenceIds
  );

  return {
    id: decision.id,
    conclusion: decision.decision,
    reason: decision.reason,
    createdAt: decision.createdAt,
    supportingEvidenceState: engineeringConclusionSupportingEvidenceState(
      supportingEvidence
    ),
    supportingEvidence,
    ...(decision.supersedesDecisionId
      ? { supersedesDecisionId: decision.supersedesDecisionId }
      : {}),
  };
}

function resolveEngineeringConclusionSupportingEvidence(
  evidence: Project["evidence"],
  supportingEvidenceIds: string[]
): EngineeringConclusionSupportingEvidenceReference[] {
  return supportingEvidenceIds.map((evidenceId) => {
    const selectedEvidence = evidence.find((item) => item.id === evidenceId);

    return selectedEvidence
      ? {
          evidenceId,
          available: true,
          summary: selectedEvidence.summary,
          source: selectedEvidence.source,
          ...(selectedEvidence.validationOutcome
            ? { validationOutcome: selectedEvidence.validationOutcome }
            : {}),
        }
      : { evidenceId, available: false };
  });
}

function engineeringConclusionSupportingEvidenceState(
  supportingEvidence: EngineeringConclusionSupportingEvidenceReference[]
): EngineeringConclusionSupportingEvidenceState {
  if (supportingEvidence.length === 0) return "none-explicitly-selected";

  const availableCount = supportingEvidence.filter((reference) => reference.available).length;
  if (availableCount === 0) return "selected-unavailable";
  if (availableCount === supportingEvidence.length) return "selected-and-available";

  return "selected-partially-available";
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
    const sourceReferences = resolveSourceReferences(
      project.timeline,
      assertion.sourceTimelineEventIds
    );

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
      sourceProvenance: sourceProvenanceState(sourceReferences),
      sourceReferences,
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

function resolveSourceReferences(
  timeline: ProjectTimelineEvent[],
  sourceTimelineEventIds: string[] | undefined
): AssertionSourceReference[] {
  if (!sourceTimelineEventIds?.length) return [];

  return sourceTimelineEventIds.map((eventId) => {
    const event = timeline.find((candidate) => candidate.id === eventId);

    return event
      ? {
          eventId,
          available: true,
          eventType: event.type,
          title: event.title,
          createdAt: event.createdAt,
        }
      : { eventId, available: false };
  });
}

function sourceProvenanceState(
  sourceReferences: AssertionSourceReference[]
): AssertionSourceProvenanceState {
  if (sourceReferences.length === 0) return "not-recorded";

  const resolvedCount = sourceReferences.filter((reference) => reference.available).length;
  if (resolvedCount === 0) return "recorded-source-unavailable";
  if (resolvedCount === sourceReferences.length) return "recorded-and-available";

  return "recorded-partially-available";
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
  project: Project,
  category: "concept-review" | "concept-direction",
  revision: number
): ActiveConceptDecision | null {
  const candidates = project.decisions
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

  const supportingEvidence = resolveConceptSupportingEvidence(
    project.evidence,
    selected.supportingEvidenceIds
  );

  return {
    id: selected.id,
    outcome: selected.decision,
    reason: selected.reason,
    conceptFamilyId: selected.conceptRef.id,
    revision: selected.conceptRef.revision,
    createdAt: selected.createdAt,
    supportingEvidenceState: conceptSupportingEvidenceState(supportingEvidence),
    supportingEvidence,
    ...(selected.supersedesDecisionId
      ? { supersededDecisionId: selected.supersedesDecisionId }
      : {}),
  };
}

function resolveConceptSupportingEvidence(
  evidence: Project["evidence"],
  supportingEvidenceIds: string[]
): ConceptSupportingEvidenceReference[] {
  return supportingEvidenceIds.map((evidenceId) => {
    const selectedEvidence = evidence.find((item) => item.id === evidenceId);

    return selectedEvidence
      ? {
          evidenceId,
          available: true,
          summary: selectedEvidence.summary,
          source: selectedEvidence.source,
          ...(selectedEvidence.validationOutcome
            ? { validationOutcome: selectedEvidence.validationOutcome }
            : {}),
        }
      : { evidenceId, available: false };
  });
}

function conceptSupportingEvidenceState(
  supportingEvidence: ConceptSupportingEvidenceReference[]
): ConceptSupportingEvidenceState {
  if (supportingEvidence.length === 0) return "none-explicitly-selected";

  const availableCount = supportingEvidence.filter((reference) => reference.available).length;
  if (availableCount === 0) return "selected-unavailable";
  if (availableCount === supportingEvidence.length) return "selected-and-available";

  return "selected-partially-available";
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