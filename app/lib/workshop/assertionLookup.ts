import type {
  EngineeringAssertionKind,
  ProjectEngineeringAssertion,
} from "../core/project";

export function findSingleActiveAssertionForValue(input: {
  assertions: ProjectEngineeringAssertion[];
  kind: EngineeringAssertionKind;
  value: string;
}): ProjectEngineeringAssertion | null {
  const matches = input.assertions.filter(
    (assertion) =>
      assertion.kind === input.kind &&
      assertion.status === "active" &&
      assertion.value === input.value
  );

  return matches.length === 1 ? matches[0] : null;
}