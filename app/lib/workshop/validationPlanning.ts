import type {
  Project,
  ProjectTimelineEvent,
  ValidationPlan,
  ValidationPlanItem,
} from "../core/project";
import { findSingleActiveAssertionForValue } from "./assertionLookup";
import { assessDiscovery } from "./discoveryReasoning";

const MAX_VALIDATION_ITEMS = 4;
const ASSUMPTION_PREFIX = /^Potential assumption:\s*/i;
const EVIDENCE_GAP_PREFIX = /^Evidence gap recorded:\s*/i;
const REPORTED_EVIDENCE_PREFIX =
  /^Owner-reported evidence; not yet attached or validated:\s*/i;

export type ValidationPlanningResult =
  | { status: "created"; project: Project }
  | { status: "existing"; project: Project }
  | { status: "not-ready"; project: Project };

export function createValidationPlan(project: Project): ValidationPlanningResult {
  if (project.validationPlan) {
    return { status: "existing", project };
  }

  const assessment = assessDiscovery(project);

  if (!assessment.readyToAdvance) {
    return { status: "not-ready", project };
  }

  const now = new Date().toISOString();
  const items = buildValidationItems(project).slice(0, MAX_VALIDATION_ITEMS);
  const validationPlan: ValidationPlan = {
    status: "planned",
    purpose:
      "Check the biggest unknowns before developing the solution further.",
    items,
    createdAt: now,
    updatedAt: now,
  };
  const firstItem = items[0];
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "validation-plan-created",
    title: "Validation plan created",
    description: `Discovery checkpoint converted the remaining uncertainty into ${items.length} targeted validation ${items.length === 1 ? "activity" : "activities"}. No conclusion was treated as proven.`,
    createdAt: now,
  };

  return {
    status: "created",
    project: {
      ...project,
      validationPlan,
      engineeringState: {
        ...project.engineeringState,
        greatestRemainingUncertainty: firstItem.target,
        nextEngineeringStep: `Begin targeted validation: ${firstItem.title}. Record evidence that can confirm, refine, or challenge the current understanding.`,
      },
      timeline: [...project.timeline, timelineEvent],
      updatedAt: now,
    },
  };
}

function buildValidationItems(project: Project): ValidationPlanItem[] {
  const items: ValidationPlanItem[] = [];

  for (const assumption of project.engineeringState.currentAssumptions) {
    addUniqueItem(items, {
      id: createId(),
      source: "assumption",
      title: "Check something we think may be true",
      target: stripPrefix(assumption, ASSUMPTION_PREFIX),
      method:
        "Observe, measure, test, or ask someone independent to review it in realistic conditions.",
      evidenceNeeded:
        "Information that shows whether this idea is right, partly right, or wrong.",
      completionRule:
        "Record what the check showed so we no longer rely only on a belief.",
      status: "planned",
      ...getAssumptionAssertionLink(project, assumption),
    });
  }

  for (const note of project.engineeringState.currentEvidence) {
    if (EVIDENCE_GAP_PREFIX.test(note)) {
      addUniqueItem(items, {
        id: createId(),
        source: "evidence-gap",
        title: "Fill a gap in what we know",
        target: stripPrefix(note, EVIDENCE_GAP_PREFIX),
        method:
          "Gather measurements, records, tests, photos, video, or observations that answer this question.",
        evidenceNeeded:
          "Information with a clear source that can be reviewed later.",
        completionRule:
          "Record whether the new information answers the question, narrows it, or leaves it open.",
        status: "planned",
      });
      continue;
    }

    if (REPORTED_EVIDENCE_PREFIX.test(note)) {
      addUniqueItem(items, {
        id: createId(),
        source: "reported-evidence",
        title: "Check information from the inventor",
        target: stripPrefix(note, REPORTED_EVIDENCE_PREFIX),
        method:
          "Add existing records, or repeat the observation in a controlled way and record where it came from.",
        evidenceNeeded:
          "A source, record, measurement, test result, image, video, or independent observation linked to the information.",
        completionRule:
          "The Project clearly shows what the inventor reported and what someone else can check.",
        status: "planned",
      });
    }
  }

  if (items.length === 0) {
    addUniqueItem(items, {
      id: createId(),
      source: "engineering-state",
      title: "Check what we understand so far",
      target: project.engineeringState.greatestRemainingUncertainty,
      method:
        "Choose the simplest useful observation, measurement, calculation, test, or independent review.",
      evidenceNeeded:
        "A result with a clear source that can support or change what we understand.",
      completionRule:
        "Record what was tested, what happened, and what we learned from it.",
      status: "planned",
    });
  }

  return items;
}

function getAssumptionAssertionLink(
  project: Project,
  assumption: string
): { sourceAssertionIds?: string[] } {
  const assertion = findSingleActiveAssertionForValue({
    assertions: project.engineeringAssertions ?? [],
    kind: "assumption",
    value: assumption,
  });

  return assertion ? { sourceAssertionIds: [assertion.id] } : {};
}

function addUniqueItem(
  items: ValidationPlanItem[],
  candidate: ValidationPlanItem
): void {
  const normalizedTarget = candidate.target.trim().toLowerCase();

  if (!normalizedTarget) {
    return;
  }

  if (items.some((item) => item.target.trim().toLowerCase() === normalizedTarget)) {
    return;
  }

  items.push(candidate);
}

function stripPrefix(value: string, prefix: RegExp): string {
  return value.replace(prefix, "").trim();
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
