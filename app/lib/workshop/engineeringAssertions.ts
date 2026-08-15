import type {
  EngineeringAssertionKind,
  EngineeringAssertionStatus,
  ProjectEngineeringAssertion,
} from "../core/project";

export function createEngineeringAssertion(input: {
  kind: EngineeringAssertionKind;
  value: string;
  createdAt: string;
  sourceTimelineEventIds?: string[];
}): ProjectEngineeringAssertion {
  return {
    id: createId(),
    kind: input.kind,
    value: input.value,
    status: "active",
    createdAt: input.createdAt,
    ...(input.sourceTimelineEventIds
      ? { sourceTimelineEventIds: [...input.sourceTimelineEventIds] }
      : {}),
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

export function applyValidationOutcomeToAssertions(input: {
  assertions: ProjectEngineeringAssertion[];
  sourceAssertionIds?: string[];
  outcome: "confirmed" | "refined" | "challenged" | "inconclusive";
}): ProjectEngineeringAssertion[] {
  if (!input.sourceAssertionIds?.length) {
    return [...input.assertions];
  }

  const linkedIds = new Set(input.sourceAssertionIds);
  const nextStatus = validationStatus(input.outcome);

  return input.assertions.map((assertion) => {
    if (
      !linkedIds.has(assertion.id) ||
      assertion.kind !== "assumption" ||
      assertion.status !== "active"
    ) {
      return assertion;
    }

    return {
      ...assertion,
      status: nextStatus,
    };
  });
}

function validationStatus(
  outcome: "confirmed" | "refined" | "challenged" | "inconclusive"
): EngineeringAssertionStatus {
  switch (outcome) {
    case "confirmed":
    case "refined":
      return "resolved";
    case "challenged":
      return "challenged";
    case "inconclusive":
      return "active";
  }
}