import type { SpecialistContributionBenchId } from "../core/project";
import type { SpecialistProjectContext } from "./specialistProjectContext";

export type SpecialistBenchGuidance = {
  title: string;
  lens: string;
  explanation: string;
  prompts: string[];
  structuralNotes: string[];
  disclaimer?: string;
};

const GUIDANCE_FRAMEWORKS: Record<
  SpecialistContributionBenchId,
  Omit<SpecialistBenchGuidance, "structuralNotes">
> = {
  patent: {
    title: "What might be different about your idea?",
    lens: "What seems new or different",
    explanation:
      "Start with the parts of your idea that seem different from things you have seen before.",
    prompts: [
      "What parts of your idea seem new or different?",
      "Have you seen anything similar before?",
      "What should we look into further?",
    ],
    disclaimer: "This is an early check only. It is not legal advice or a patent decision.",
  },
  marketing: {
    title: "Who is this idea for?",
    lens: "Who it helps and why",
    explanation:
      "Think about who this idea could help and why it may matter to them.",
    prompts: [
      "Who is this for?",
      "Why would it help them?",
      "What would make them interested in it?",
    ],
  },
  manufacturing: {
    title: "Manufacturing / Costing Inquiry",
    lens: "How it could be built and costed",
    explanation:
      "Work out what still needs to be defined or measured before choosing how to build it or what it may cost.",
    prompts: [
      "What would need to be made, bought, or put together?",
      "Which materials, parts, or building methods need a clearer plan?",
      "What problems or limits could affect how we build it or what it costs?",
      "What should we measure or get a price for before estimating the cost?",
    ],
  },
  reality: {
    title: "Reality — will this work in the real world?",
    lens: "Useful, practical, and worth building",
    explanation:
      "Check whether the idea is useful, practical, and worth building.",
    prompts: [
      "Would people actually use this?",
      "Could it be built and used practically?",
      "Is the cost and effort worth it?",
    ],
  },
};

export function createSpecialistBenchGuidance(
  specialistBenchId: SpecialistContributionBenchId,
  context: SpecialistProjectContext
): SpecialistBenchGuidance {
  const framework = GUIDANCE_FRAMEWORKS[specialistBenchId];

  return {
    ...framework,
    prompts: [...framework.prompts],
    structuralNotes: createStructuralNotes(context),
  };
}

function createStructuralNotes(context: SpecialistProjectContext): string[] {
  return [
    context.evidence.total > 0
      ? "Project evidence is available in the project summary."
      : "No Project evidence has been added yet.",
    context.directions.total > 0
      ? "Current directions are available."
      : "No current direction has been added yet.",
    context.actions.total > 0
      ? "Planned engineering actions are available."
      : "No engineering action has been added yet.",
    context.constraints.total > 0
      ? "Current limits are shown in the project summary."
      : "No current limits have been added yet.",
    context.greatestRemainingUncertainty.trim()
      ? "The biggest remaining unknown is shown in the project summary."
      : "No biggest remaining unknown has been added yet.",
  ];
}
