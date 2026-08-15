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
      "Reduce the highest-impact uncertainty by testing assumptions and strengthening evidence before solution development.",
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
      title: "Test a potential assumption",
      target: stripPrefix(assumption, ASSUMPTION_PREFIX),
      method:
        "Observe, measure, test, or independently review the suspected relationship under representative operating conditions.",
      evidenceNeeded:
        "Recorded evidence that can confirm, refine, or contradict the assumption.",
      completionRule:
        "The assumption is no longer carried as an untested belief; the Project records what the evidence actually showed.",
      status: "planned",
      ...getAssumptionAssertionLink(project, assumption),
    });
  }

  for (const note of project.engineeringState.currentEvidence) {
    if (EVIDENCE_GAP_PREFIX.test(note)) {
      addUniqueItem(items, {
        id: createId(),
        source: "evidence-gap",
        title: "Close an evidence gap",
        target: stripPrefix(note, EVIDENCE_GAP_PREFIX),
        method:
          "Gather direct measurements, records, tests, photographs, video, or independent observations that specifically address this gap.",
        evidenceNeeded:
          "Traceable evidence that addresses the stated gap and can be reviewed later.",
        completionRule:
          "The gap is supported, narrowed, or explicitly retained as unresolved based on the evidence gathered.",
        status: "planned",
      });
      continue;
    }

    if (REPORTED_EVIDENCE_PREFIX.test(note)) {
      addUniqueItem(items, {
        id: createId(),
        source: "reported-evidence",
        title: "Validate owner-reported evidence",
        target: stripPrefix(note, REPORTED_EVIDENCE_PREFIX),
        method:
          "Attach existing records where available or repeat the observation in a controlled, traceable way.",
        evidenceNeeded:
          "A source, record, measurement, test result, image, video, or independent observation linked to the reported evidence.",
        completionRule:
          "The Project can distinguish the inventor's report from independently reviewable evidence.",
        status: "planned",
      });
    }
  }

  if (items.length === 0) {
    addUniqueItem(items, {
      id: createId(),
      source: "engineering-state",
      title: "Challenge the current understanding",
      target: project.engineeringState.greatestRemainingUncertainty,
      method:
        "Choose the simplest practical observation, measurement, calculation, test, or independent review capable of confirming or contradicting the current understanding.",
      evidenceNeeded:
        "A traceable result that can strengthen, refine, or challenge the current Engineering State.",
      completionRule:
        "The Project records what was tested, what happened, and how the Engineering State changed as a result.",
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
