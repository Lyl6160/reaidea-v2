import type { Project } from "../core/project";
import { assessDiscovery } from "./discoveryReasoning";
import {
  summarizeEngineeringTrace,
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
  { id: "knowledge", label: "Inventor / Knowledge", shortLabel: "Inventor", positionClass: "slot-discovery", route: "/interview" },
  { id: "engineering", label: "Engineering", shortLabel: "Engineering", positionClass: "slot-engineering" },
  { id: "prototype", label: "Prototype", shortLabel: "Prototype", positionClass: "slot-prototype" },
  { id: "validation", label: "Validation", shortLabel: "Validation", positionClass: "slot-validation" },
  { id: "patent", label: "Patent / IP", shortLabel: "Patent / IP", positionClass: "slot-patent", informational: true },
  { id: "marketing", label: "Marketing", shortLabel: "Marketing", positionClass: "slot-marketing", informational: true },
  { id: "manufacturing", label: "Manufacturing / Costing", shortLabel: "Manufacturing / Costing", positionClass: "slot-manufacturing", informational: true },
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
      label: "Inventor / Knowledge",
      state: discoveryReachedCheckpoint ? "available" : "active",
      reason: discoveryReachedCheckpoint
        ? "The core Discovery checkpoint has been reached, but this bench remains available when the Project needs clarification."
        : "The Project is still building the understanding needed by the rest of the workshop.",
      nextMove: discoveryReachedCheckpoint
        ? "Return here when another bench exposes a missing fact or unclear assumption."
        : "Keep answering the next best Discovery question.",
      fedBy: [],
    },
    {
      id: "engineering",
      label: "Engineering",
      state: engineeringDefined ? "ready" : "available",
      reason: engineeringDefined
        ? "The Project contains enough defined understanding and constraints for meaningful engineering work."
        : "Engineering has some Project knowledge, but important definition is still forming.",
      nextMove: engineeringDefined
        ? "Develop the concept and expose the next technical uncertainties."
        : "Strengthen the problem, operating conditions and constraints first.",
      fedBy: ["knowledge"],
    },
    {
      id: "validation",
      label: "Validation",
      state: validationPlanned
        ? validationCompleted
          ? "ready"
          : "pulse"
        : discoveryReachedCheckpoint && (hasAssumptions || hasEvidence)
          ? "pulse"
          : "dormant",
      reason: validationPlanned
        ? validationCompleted
          ? "Validation has produced evidence the rest of the workshop can now use."
          : "A validation plan exists and is waiting for execution."
        : discoveryReachedCheckpoint && (hasAssumptions || hasEvidence)
          ? "Discovery has exposed assumptions or evidence gaps that can now be tested."
          : "There is not yet enough defined uncertainty to make validation useful.",
      nextMove: validationPlanned
        ? "Work the next validation item and record what the evidence changes."
        : "Reach the Discovery checkpoint and identify testable assumptions or evidence gaps.",
      fedBy: ["knowledge", "engineering"],
    },
    {
      id: "patent",
      label: "Patent / IP",
      state: engineeringDefined ? "pulse" : "dormant",
      reason: engineeringDefined
        ? "Engineering definition now contains features and constraints that may be worth examining for potentially distinctive territory."
        : "Patent reasoning would be premature while the invention is still too loosely defined.",
      nextMove: engineeringDefined
        ? "Inspect the defined mechanism and features before deciding what deserves prior-art investigation."
        : "Add enough engineering definition for REV to identify concrete features to examine.",
      fedBy: ["engineering", "validation"],
    },
    {
      id: "marketing",
      label: "Marketing",
      state: discoveryReachedCheckpoint && engineeringDefined ? "available" : "dormant",
      reason: discoveryReachedCheckpoint && engineeringDefined
        ? "The Project has enough problem and concept definition to begin discussing audience and value without inventing a market story."
        : "There is not enough reliable problem and concept definition yet for a responsible marketing strategy.",
      nextMove: discoveryReachedCheckpoint && engineeringDefined
        ? "Define who benefits, why they care, and what evidence would support the value proposition."
        : "Return to Discovery and Engineering to strengthen the problem, user and concept definition.",
      fedBy: ["knowledge", "engineering", "validation"],
    },
    {
      id: "prototype",
      label: "Prototype",
      state: engineeringDefined && hasConstraints ? "ready" : "dormant",
      reason: engineeringDefined && hasConstraints
        ? "The concept has enough definition and constraints to begin planning a physical or visual prototype."
        : "Prototype work needs a more defined concept and practical constraints first.",
      nextMove: engineeringDefined && hasConstraints
        ? "Create the first concept representation and decide what the prototype must prove."
        : "Use Engineering to establish the concept and constraints.",
      fedBy: ["engineering", "validation"],
    },
    {
      id: "manufacturing",
      label: "Manufacturing / Costing",
      state: engineeringDefined && hasConstraints ? "available" : "dormant",
      reason: engineeringDefined && hasConstraints
        ? "Defined constraints are beginning to expose materials, construction and cost questions."
        : "Manufacturing and costing would be guesswork before key engineering constraints exist.",
      nextMove: engineeringDefined && hasConstraints
        ? "Identify build method, major components and the cost-driving assumptions."
        : "Define the engineering constraints that will drive construction and cost.",
      fedBy: ["engineering", "prototype", "validation"],
    },
    {
      id: "reality",
      label: "Reality",
      state: validationCompleted && engineeringDefined ? "available" : "dormant",
      reason: validationCompleted && engineeringDefined
        ? "The Project now has both concept definition and tested evidence that can meet real-world viability questions."
        : "Reality needs a defined concept plus evidence from validation before strong viability conclusions are justified.",
      nextMove: validationCompleted && engineeringDefined
        ? "Challenge customer value, practical viability, cost and impact against the evidence."
        : "Strengthen Engineering and Validation before treating viability as known.",
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

  return {
    benches,
    recommendedBench: recommended.id,
    summary:
      recommendationReason ??
      (recommended.state === "pulse"
        ? `${recommended.label} has new value waiting because another part of the Project has advanced.`
        : `${recommended.label} is the strongest next place to work from the current Project state.`),
    trace,
  };
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
