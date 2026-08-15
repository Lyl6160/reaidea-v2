import type {
  EngineeringAssertionKind,
  ProjectEngineeringAssertion,
} from "../core/project";

export function createEngineeringAssertion(input: {
  kind: EngineeringAssertionKind;
  value: string;
  createdAt: string;
}): ProjectEngineeringAssertion {
  return {
    id: createId(),
    kind: input.kind,
    value: input.value,
    status: "active",
    createdAt: input.createdAt,
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