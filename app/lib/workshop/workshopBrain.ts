import type { Project } from "../core/project";
import { assessDiscovery } from "./discoveryReasoning";
import {
  summarizeEngineeringTrace,
  type AssertionTraceEntry,
  type AssertionValidationLink,
  type EngineeringTraceSummary,
} from "./traceSummary";

export type WorkshopBenchId =
  | "knowledge"
  | "engineering"
  | "validation"
  | "patent"
  | "marketing"
  | "prototype"
  | "manufacturing"
  | "reality";

export type WorkshopBenchState =
  | "dormant"
  | "available"
  | "ready"
  | "pulse"
  | "active";

export type WorkshopBenchSignal = {
  id: WorkshopBenchId;
  label: string;
  state: WorkshopBenchState;
  reason: string;
  nextMove: string;
  fedBy: WorkshopBenchId[];
};

export type WorkshopState = {
  benches: WorkshopBenchSignal[];
  recommendedBench: WorkshopBenchId;
  summary: string;
  trace: EngineeringTraceSummary;
  assertionGuidance: AssertionGuidance | null;
};

export type AssertionGuidance = {
  recordedFact: string;
  sourceFact: string;
  validationFact: string;
  guidance: string;
};

export type WorkshopBenchDefinition = {
  id: WorkshopBenchId;
  label: string;
  shortLabel: string;
  positionClass: string;
  route?: string;
  informational?: boolean;
};

export const CANONICAL_WORKSHOP_BENCHES: WorkshopBenchDefinition[] = [
  { id: "knowledge", label: "Inventor's Bench", shortLabel: "Inventor", positionClass: "slot-discovery", route: "/interview" },
  { id: "engineering", label: "Engineering", shortLabel: "Engineering", positionClass: "slot-engineering" },
  { id: "prototype", label: "Prototype", shortLabel: "Prototype", positionClass: "slot-prototype" },
  { id: "validation", label: "Testing Bench", shortLabel: "Testing", positionClass: "slot-validation" },
  { id: "patent", label: "Patent / IP", shortLabel: "Patent / IP", positionClass: "slot-patent", informational: true },
  { id: "manufacturing", label: "Manufacturing & Costing", shortLabel: "Manufacturing", positionClass: "slot-manufacturing", informational: true },
  { id: "marketing", label: "Marketing", shortLabel: "Marketing", positionClass: "slot-marketing", informational: true },
  { id: "reality", label: "Reality", shortLabel: "Reality", positionClass: "slot-reality", informational: true },
];

function hasMeaningfulEngineeringDefinition(project: Project): boolean {
  const state = project.engineeringState;
  const combined = [
    state.currentUnderstanding,
    ...state.currentConstraints,
    ...state.currentAssumptions,
  ]
    .join(" ")
    .trim();

  return project.readiness !== "observation" && combined.length >= 120;
}

function hasValidationActivity(project: Project): boolean {
  return Boolean(project.validationPlan?.items.length);
}

function hasCompletedValidation(project: Project): boolean {
  return Boolean(
    project.validationPlan?.items.some((item) => item.status === "completed") ||
      project.evidence.some((item) => item.validationOutcome)
  );
}

function discoveryComplete(project: Project): boolean {
  return assessDiscovery(project).readyToAdvance;
}

export function assessWorkshop(project: Project): WorkshopState {
  const trace = summarizeEngineeringTrace(project);
  const engineeringDefined = hasMeaningfulEngineeringDefinition(project);
  const validationPlanned = hasValidationActivity(project);
  const validationCompleted = hasCompletedValidation(project);
  const discoveryReachedCheckpoint = discoveryComplete(project);
  const hasEvidence = project.evidence.length > 0;
  const hasConstraints = project.engineeringState.currentConstraints.length > 0;
  const hasAssumptions = project.engineeringState.currentAssumptions.length > 0;

  const benches: WorkshopBenchSignal[] = [
    {
      id: "knowledge",
      label: "Inventor's Bench",
      state: discoveryReachedCheckpoint ? "available" : "active",
      reason: discoveryReachedCheckpoint
        ? "You have answered the main Discovery questions. Come back here whenever something needs more detail."
        : "Keep sharing what you know so the rest of the workshop can help.",
      nextMove: discoveryReachedCheckpoint
        ? "Return here when another bench shows that something is missing or unclear."
        : "Answer the next Discovery question.",
      fedBy: [],
    },
    {
      id: "engineering",
      label: "Engineering",
      state: engineeringDefined ? "ready" : "available",
      reason: engineeringDefined
        ? "We know enough about the idea and its limits to start useful engineering work."
        : "We know some things about the idea, but important details are still missing.",
      nextMove: engineeringDefined
        ? "Develop the idea and find out what still may not work."
        : "Add more detail about the problem, when it happens, and any limits.",
      fedBy: ["knowledge"],
    },
    {
      id: "validation",
      label: "Testing Bench",
      state: validationPlanned
        ? validationCompleted
          ? "ready"
          : "pulse"
        : discoveryReachedCheckpoint && (hasAssumptions || hasEvidence)
          ? "pulse"
          : "dormant",
      reason: validationPlanned
        ? validationCompleted
          ? "Your checks have produced information the rest of the workshop can use."
          : "Your test plan is ready to begin."
        : discoveryReachedCheckpoint && (hasAssumptions || hasEvidence)
          ? "Discovery found things we should now check."
          : "We need a clearer question before testing will be useful.",
      nextMove: validationPlanned
        ? "Complete the next check and record what you learn."
        : "Finish the main Discovery questions and choose something useful to check.",
      fedBy: ["knowledge", "engineering"],
    },
    {
      id: "patent",
      label: "Patent / IP",
      state: engineeringDefined ? "pulse" : "dormant",
      reason: engineeringDefined
        ? "The idea now has enough detail to look for parts that may be different from earlier inventions."
        : "The idea needs more detail before a patent review would be useful.",
      nextMove: engineeringDefined
        ? "Review how the idea works and decide what earlier inventions or public information to check."
        : "Explain how the idea works so REV can identify what to look into.",
      fedBy: ["engineering", "validation"],
    },
    {
      id: "marketing",
      label: "Marketing",
      state: discoveryReachedCheckpoint && engineeringDefined ? "available" : "dormant",
      reason: discoveryReachedCheckpoint && engineeringDefined
        ? "The Project has enough problem and concept definition to begin discussing audience and value without inventing a market story."
        : "We need to know more about the problem and the idea before asking who may want it.",
      nextMove: discoveryReachedCheckpoint && engineeringDefined
        ? "Work out who this helps, why they would want it, and what makes it useful."
        : "Work out who this helps, why they would want it, and what makes it useful.",
      fedBy: ["knowledge", "engineering", "validation"],
    },
    {
      id: "prototype",
      label: "Prototype",
      state: engineeringDefined && hasConstraints ? "ready" : "dormant",
      reason: engineeringDefined && hasConstraints
        ? "The idea has enough detail to start an early physical or visual model."
        : "The idea and its practical limits need more detail before making a model.",
      nextMove: engineeringDefined && hasConstraints
        ? "Create the first model and decide what it needs to show."
        : "Use Engineering to explain the idea and its limits.",
      fedBy: ["engineering", "validation"],
    },
    {
      id: "manufacturing",
      label: "Manufacturing & Costing",
      state: engineeringDefined && hasConstraints ? "available" : "dormant",
      reason: engineeringDefined && hasConstraints
        ? "We know enough about the limits to start asking how to build it and what it may cost."
        : "We need to know more about the idea's limits before estimating how to build or price it.",
      nextMove: engineeringDefined && hasConstraints
        ? "Look at how to build it, the main parts, and what may affect the cost."
        : "Describe the limits that could affect how it is built and what it costs.",
      fedBy: ["engineering", "prototype", "validation"],
    },
    {
      id: "reality",
      label: "Reality",
      state: validationCompleted && engineeringDefined ? "available" : "dormant",
      reason: validationCompleted && engineeringDefined
        ? "We know enough about the idea and its test results to ask whether it will work in the real world."
        : "We still need a clearer design and test results before deciding whether the idea will work in the real world.",
      nextMove: validationCompleted && engineeringDefined
        ? "Check whether the idea is useful, practical, and worth building."
        : "Use Engineering and Validation to fill the gaps, then return here.",
      fedBy: ["marketing", "manufacturing", "validation", "prototype"],
    },
  ];

  const baselineRecommended =
    benches.find((bench) => bench.state === "pulse") ??
    benches.find((bench) => bench.state === "active") ??
    benches.find((bench) => bench.state === "ready") ??
    benches.find((bench) => bench.state === "available") ??
    benches[0];
  const direction = trace.activeConceptDirection?.outcome;
  const latestOutcome = trace.latestValidationResult?.outcome;
  let recommended = baselineRecommended;

  if (direction === "rethink") {
    recommended = benches.find((bench) => bench.id === "engineering") ?? recommended;
  } else if (direction === "refine") {
    recommended = benches.find((bench) => bench.id === "prototype") ?? recommended;
  } else if (direction === "accept" && trace.unresolvedValidation) {
    recommended = benches.find((bench) => bench.id === "validation") ?? recommended;
  } else if (
    !direction &&
    trace.validationPlanComplete &&
    (latestOutcome === "inconclusive" || latestOutcome === "challenged")
  ) {
    recommended = benches.find((bench) => bench.id === "engineering") ?? recommended;
  }

  const recommendationReason = recommendationReasonForTrace(
    recommended,
    trace,
    direction,
    latestOutcome
  );
  const assertionGuidance = createAssertionGuidance(
    trace,
    recommended.label
  );

  return {
    benches,
    recommendedBench: recommended.id,
    summary:
      recommendationReason ??
      (recommended.state === "pulse"
        ? `${recommended.label} has new value waiting because another part of the Project has advanced.`
        : `${recommended.label} is the strongest next place to work from the current Project state.`),
    trace,
    assertionGuidance,
  };
}

function createAssertionGuidance(
  trace: EngineeringTraceSummary,
  recommendedBenchLabel: string
): AssertionGuidance | null {
  const assertion =
    trace.assertionTrace.primaryAssertion ??
    (trace.assertionTrace.primaryLegacyCurrentAssumption
      ? null
      : trace.assertionTrace.historicalAssertions[0] ?? null);

  if (!assertion) {
    const legacy = trace.assertionTrace.primaryLegacyCurrentAssumption;
    if (!legacy) return null;

    return {
      recordedFact: `Current assumption recorded in Engineering State: ${legacy}`,
      sourceFact: "Stable assertion provenance is unavailable.",
      validationFact: "No stable assertion identity or linked Project Validation is recorded.",
      guidance: `REV recommends ${recommendedBenchLabel} from the current Engineering State.`,
    };
  }

  const link = selectPrimaryValidationLink(assertion);
  const recordedFact = `${assertion.kind === "assumption" ? "Current assumption" : "Recorded assertion"}: ${assertion.value}. Lifecycle: ${lifecycleLabel(assertion.status)}.`;
  const validationFact = link
    ? link.outcome
      ? `Latest linked Validation outcome: ${outcomeLabel(link.outcome)}.`
      : `Linked Project Validation is ${link.planStatus}.`
    : "No linked Project Validation is recorded.";
  const sourceFact = sourceFactForAssertion(assertion);

  let guidance = `REV recommends ${recommendedBenchLabel} from the current Project state.`;
  if (link?.outcome === "inconclusive" && assertion.status === "active") {
    guidance = `The assumption remains active because the latest linked Validation was inconclusive. REV recommends ${recommendedBenchLabel} while the uncertainty remains.`;
  } else if (link?.outcome === "challenged" && assertion.status === "challenged") {
    guidance = `Validation challenged this assumption. REV recommends ${recommendedBenchLabel} to reconsider the engineering direction.`;
  } else if (link?.planStatus === "planned" || link?.planStatus === "in-progress") {
    guidance = `REV recommends ${recommendedBenchLabel} to continue the recorded Validation path.`;
  } else if (assertion.status === "resolved") {
    guidance = `Validation addressed this assertion without claiming universal proof. REV recommends ${recommendedBenchLabel} from the current Project state.`;
  }

  return { recordedFact, sourceFact, validationFact, guidance };
}

function sourceFactForAssertion(assertion: AssertionTraceEntry): string {
  if (assertion.sourceProvenance === "not-recorded") {
    return "Source provenance has not been recorded for this assertion.";
  }

  const availableSources = assertion.sourceReferences.filter(
    (reference) => reference.available
  );
  const unavailableCount = assertion.sourceReferences.length - availableSources.length;

  if (availableSources.length === 0) {
    return "A recorded source reference is unavailable in the current Project history.";
  }

  const sourceDescriptions = availableSources.map(describeSourceReference);
  const availableText =
    sourceDescriptions.length === 1
      ? `Recorded from ${sourceDescriptions[0]} in Project history.`
      : `Recorded Project sources: ${sourceDescriptions.join("; ")}.`;

  return unavailableCount > 0
    ? `${availableText} ${unavailableCount} recorded source ${unavailableCount === 1 ? "reference is" : "references are"} unavailable in the current Project history.`
    : availableText;
}

function describeSourceReference(
  reference: AssertionTraceEntry["sourceReferences"][number]
): string {
  const recordedAt = formatRecordedAt(reference.createdAt);

  if (reference.eventType === "discovery-answer-recorded") {
    return `a Discovery response${recordedAt}`;
  }

  return `${reference.title ?? reference.eventType ?? "a Project event"}${recordedAt}`;
}

function formatRecordedAt(createdAt: string | undefined): string {
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) return "";

  return ` recorded ${new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt))}`;
}

function selectPrimaryValidationLink(
  assertion: EngineeringTraceSummary["assertionTrace"]["assertions"][number]
) {
  return [...assertion.validationLinks].sort((left, right) => {
    const leftRank = left.planStatus === "in-progress" ? 3 : left.planStatus === "planned" ? 2 : 1;
    const rightRank = right.planStatus === "in-progress" ? 3 : right.planStatus === "planned" ? 2 : 1;
    return rightRank - leftRank;
  })[0];
}

function lifecycleLabel(status: AssertionTraceEntry["status"]): string {
  switch (status) {
    case "active":
      return "still active / unresolved";
    case "resolved":
      return "addressed by Validation";
    case "challenged":
      return "challenged by Validation";
    case "superseded":
      return "superseded by an explicit later assertion";
  }
}

function outcomeLabel(outcome: NonNullable<AssertionValidationLink["outcome"]>): string {
  return outcome.charAt(0).toUpperCase() + outcome.slice(1);
}

function recommendationReasonForTrace(
  recommended: WorkshopBenchSignal,
  trace: EngineeringTraceSummary,
  direction: string | undefined,
  latestOutcome: string | undefined
): string | null {
  if (direction === "rethink") {
    return "Recorded direction: rethink Concept 02. REV recommends Engineering to reconsider the working direction.";
  }

  if (direction === "refine") {
    return "Recorded direction: refine Concept 02. REV recommends Prototype to develop the next Concept revision.";
  }

  if (direction === "accept" && trace.unresolvedValidation) {
    return "Recorded direction: accept Concept 02. REV recommends Validation while planned work remains.";
  }

  if (latestOutcome === "inconclusive") {
    return `Latest validation: inconclusive. REV recommends ${recommended.label} without treating the result as support or closure.`;
  }

  if (latestOutcome === "challenged") {
    return `Latest validation: challenged. REV recommends ${recommended.label} for engineering reconsideration.`;
  }

  return null;
}
