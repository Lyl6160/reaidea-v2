import type {
  Project,
  ProjectEvidence,
  ProjectTimelineEvent,
  ValidationOutcome,
  ValidationPlan,
  ValidationPlanItem,
} from "../core/project";

type StartValidationResult =
  | { status: "started"; project: Project }
  | { status: "already-started"; project: Project }
  | { status: "blocked"; project: Project; reason: string }
  | { status: "missing"; project: Project };

export type CompleteValidationInput = {
  itemId: string;
  evidenceSummary: string;
  evidenceSource: string;
  resultSummary: string;
};

export type CompleteValidationResult =
  | { status: "completed"; project: Project }
  | { status: "invalid"; project: Project; reason: string }
  | { status: "missing"; project: Project };

export function startValidationItem(
  project: Project,
  itemId: string
): StartValidationResult {
  const plan = project.validationPlan;

  if (!plan) {
    return { status: "missing", project };
  }

  const targetItem = plan.items.find((item) => item.id === itemId);

  if (!targetItem) {
    return { status: "missing", project };
  }

  if (targetItem.status === "in-progress") {
    return { status: "already-started", project };
  }

  if (targetItem.status === "completed") {
    return {
      status: "blocked",
      project,
      reason: "This validation activity is already complete.",
    };
  }

  const activeItem = plan.items.find((item) => item.status === "in-progress");

  if (activeItem) {
    return {
      status: "blocked",
      project,
      reason: `Finish the current validation activity first: ${activeItem.title}.`,
    };
  }

  const now = new Date().toISOString();
  const items = plan.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status: "in-progress" as const,
          startedAt: now,
        }
      : item
  );
  const updatedPlan: ValidationPlan = {
    ...plan,
    status: "in-progress",
    items,
    updatedAt: now,
  };
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "validation-item-started",
    title: "Validation activity started",
    description: `Targeted validation began for: ${targetItem.target}`,
    subject: targetItem.title,
    createdAt: now,
  };

  return {
    status: "started",
    project: {
      ...project,
      readiness: "validation",
      validationPlan: updatedPlan,
      engineeringState: {
        ...project.engineeringState,
        greatestRemainingUncertainty: targetItem.target,
        nextEngineeringStep: `Execute the validation method for ${targetItem.title.toLowerCase()} and record traceable evidence before drawing a conclusion.`,
      },
      timeline: [...project.timeline, timelineEvent],
      updatedAt: now,
    },
  };
}

export function completeValidationItem(
  project: Project,
  input: CompleteValidationInput
): CompleteValidationResult {
  const plan = project.validationPlan;

  if (!plan) {
    return { status: "missing", project };
  }

  const targetItem = plan.items.find((item) => item.id === input.itemId);

  if (!targetItem) {
    return { status: "missing", project };
  }

  if (targetItem.status !== "in-progress") {
    return {
      status: "invalid",
      project,
      reason: "Start this validation activity before recording a result.",
    };
  }

  const evidenceSummary = input.evidenceSummary.trim();
  const evidenceSource = input.evidenceSource.trim();
  const resultSummary = input.resultSummary.trim();

  if (!evidenceSummary || !evidenceSource || !resultSummary) {
    return {
      status: "invalid",
      project,
      reason:
        "Record the evidence gathered, where it came from, and what it showed before completing validation.",
    };
  }

  const now = new Date().toISOString();
  const assessment = assessValidationEvidence(targetItem, evidenceSummary, resultSummary);
  const evidence: ProjectEvidence = {
    id: createId(),
    summary: evidenceSummary,
    source: evidenceSource,
    validationItemId: targetItem.id,
    validationOutcome: assessment.outcome,
    createdAt: now,
  };
  const completedItem: ValidationPlanItem = {
    ...targetItem,
    status: "completed",
    completedAt: now,
    evidenceId: evidence.id,
    evidenceSummary,
    evidenceSource,
    resultSummary,
    outcome: assessment.outcome,
    assessmentRationale: assessment.rationale,
  };
  const items = plan.items.map((item) =>
    item.id === targetItem.id ? completedItem : item
  );
  const updatedPlan: ValidationPlan = {
    ...plan,
    status: items.every((item) => item.status === "completed")
      ? "completed"
      : "in-progress",
    items,
    updatedAt: now,
  };
  const projectEvidence = updateEngineeringEvidence(
    project.engineeringState.currentEvidence,
    targetItem,
    evidenceSummary,
    evidenceSource,
    assessment.outcome
  );
  const projectAssumptions = updateAssumptions(
    project.engineeringState.currentAssumptions,
    targetItem,
    assessment.outcome
  );
  const nextState = describeNextState(updatedPlan);
  const understanding = appendValidationUnderstanding(
    project.engineeringState.currentUnderstanding,
    targetItem,
    resultSummary,
    assessment.outcome
  );
  const resultEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "validation-result-recorded",
    title: "Validation result recorded",
    description: `${outcomeLabel(assessment.outcome)} — ${resultSummary}`,
    subject: targetItem.title,
    response: evidenceSummary,
    createdAt: now,
  };
  const completionEvent: ProjectTimelineEvent | null =
    updatedPlan.status === "completed"
      ? {
          id: createId(),
          type: "validation-plan-completed",
          title: "Validation plan completed",
          description:
            "Every planned validation activity now has a recorded result. Remaining uncertainty stays explicit and no result is treated as proof beyond the evidence gathered.",
          createdAt: now,
        }
      : null;

  return {
    status: "completed",
    project: {
      ...project,
      readiness: "validation",
      validationPlan: updatedPlan,
      engineeringState: {
        ...project.engineeringState,
        currentUnderstanding: understanding,
        currentEvidence: projectEvidence,
        currentAssumptions: projectAssumptions,
        greatestRemainingUncertainty: nextState.uncertainty,
        nextEngineeringStep: nextState.nextStep,
      },
      evidence: [...project.evidence, evidence],
      timeline: [
        ...project.timeline,
        resultEvent,
        ...(completionEvent ? [completionEvent] : []),
      ],
      updatedAt: now,
    },
  };
}

export function assessValidationEvidence(
  item: ValidationPlanItem,
  evidenceSummary: string,
  resultSummary: string
): { outcome: ValidationOutcome; rationale: string } {
  const text = normalize(`${evidenceSummary} ${resultSummary}`);

  const inconclusiveSignals = [
    "inconclusive",
    "not enough",
    "insufficient",
    "too small",
    "cannot determine",
    "can't determine",
    "unable to determine",
    "unknown",
    "not measured",
    "not yet measured",
    "no formal",
  ];
  const challengedSignals = [
    "contradict",
    "did not support",
    "does not support",
    "no evidence of",
    "not observed",
    "was not observed",
    "disproved",
  ];
  const confirmedSignals = [
    "confirmed",
    "supports",
    "supported",
    "consistent with",
    "demonstrated",
    "measured",
    "repeatable",
  ];

  if (inconclusiveSignals.some((signal) => text.includes(signal))) {
    return {
      outcome: "inconclusive",
      rationale: `REV assessment: the evidence records a useful result for "${item.title}", but the finding itself says the available evidence is not yet strong enough to resolve the target uncertainty.`,
    };
  }

  if (challengedSignals.some((signal) => text.includes(signal))) {
    return {
      outcome: "challenged",
      rationale: `REV assessment: the recorded evidence appears to challenge the current understanding of "${item.target}" rather than support it.`,
    };
  }

  if (confirmedSignals.some((signal) => text.includes(signal))) {
    return {
      outcome: "confirmed",
      rationale: `REV assessment: the recorded evidence appears to support the current understanding of "${item.target}". The Project should still avoid claiming more certainty than the evidence justifies.`,
    };
  }

  return {
    outcome: "refined",
    rationale: `REV assessment: the evidence changes or sharpens the current understanding of "${item.target}", but does not clearly confirm or overturn it.`,
  };
}

function updateEngineeringEvidence(
  currentEvidence: string[],
  item: ValidationPlanItem,
  evidenceSummary: string,
  evidenceSource: string,
  outcome: ValidationOutcome
): string[] {
  const withoutResolvedGap =
    outcome === "inconclusive"
      ? currentEvidence
      : currentEvidence.filter((note) => !isResolvedEvidenceNote(note, item));
  const note = `Validation evidence (${outcomeLabel(outcome)}): ${evidenceSummary} Source: ${evidenceSource}.`;

  return uniqueStrings([...withoutResolvedGap, note]);
}

function updateAssumptions(
  assumptions: string[],
  item: ValidationPlanItem,
  outcome: ValidationOutcome
): string[] {
  if (item.source !== "assumption" || outcome === "inconclusive") {
    return assumptions;
  }

  const target = normalize(item.target);

  return assumptions.filter((assumption) => !normalize(assumption).includes(target));
}

function isResolvedEvidenceNote(note: string, item: ValidationPlanItem): boolean {
  if (item.source !== "evidence-gap" && item.source !== "reported-evidence") {
    return false;
  }

  const target = normalize(item.target);
  return normalize(note).includes(target);
}

function appendValidationUnderstanding(
  currentUnderstanding: string,
  item: ValidationPlanItem,
  resultSummary: string,
  outcome: ValidationOutcome
): string {
  const entry = `Validation result — ${item.title} (${outcomeLabel(outcome)}): ${resultSummary}`;

  if (currentUnderstanding.includes(entry)) {
    return currentUnderstanding;
  }

  return `${currentUnderstanding.trim()}\n\n${entry}`.trim();
}

function describeNextState(plan: ValidationPlan): {
  uncertainty: string;
  nextStep: string;
} {
  const active = plan.items.find((item) => item.status === "in-progress");

  if (active) {
    return {
      uncertainty: active.target,
      nextStep: `Complete the active validation activity: ${active.title}.`,
    };
  }

  const planned = plan.items.find((item) => item.status === "planned");

  if (planned) {
    return {
      uncertainty: planned.target,
      nextStep: `Begin the next targeted validation activity: ${planned.title}.`,
    };
  }

  const inconclusive = plan.items.find(
    (item) => item.status === "completed" && item.outcome === "inconclusive"
  );

  if (inconclusive) {
    return {
      uncertainty: `Validation remains inconclusive for: ${inconclusive.target}`,
      nextStep:
        "Review the inconclusive result and decide whether another targeted validation activity is required before solution development.",
    };
  }

  return {
    uncertainty:
      "The initial validation plan is complete. New uncertainty may still emerge as the Project moves forward.",
    nextStep:
      "Review the validation results together, confirm what changed in the Engineering State, and decide the next responsible development action.",
  };
}

function outcomeLabel(outcome: ValidationOutcome): string {
  switch (outcome) {
    case "confirmed":
      return "Supported by evidence";
    case "refined":
      return "Understanding refined";
    case "challenged":
      return "Understanding challenged";
    case "inconclusive":
      return "Inconclusive";
  }
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = normalize(value);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
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
