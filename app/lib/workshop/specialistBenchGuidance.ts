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
    title: "Patent / IP Inquiry",
    lens: "Technical distinction and investigation",
    explanation:
      "Consider how the recorded technical definition could be described and investigated without treating this inquiry as an IP finding.",
    prompts: [
      "What technical features appear distinctive enough to investigate further?",
      "What alternative arrangements or implementations should be considered before describing the technical distinction?",
      "What public disclosures, prior art or existing products should be investigated?",
      "What technical detail would need clearer definition before an IP professional could assess it?",
    ],
    disclaimer: "These inquiry prompts are not legal advice or patentability findings.",
  },
  marketing: {
    title: "Marketing Inquiry",
    lens: "People, value claims and validation",
    explanation:
      "Consider the recorded problem and evidence without inferring demand, market size or customer preference.",
    prompts: [
      "Who experiences the problem or benefit being described?",
      "What value is being claimed for that user or customer?",
      "What recorded evidence supports that claimed value?",
      "What assumptions would need real customer or market testing?",
    ],
  },
  manufacturing: {
    title: "Manufacturing / Costing Inquiry",
    lens: "Physical definition, sourcing and measurement",
    explanation:
      "Consider what would require definition or measurement without selecting a process, material, supplier or cost.",
    prompts: [
      "What would physically need to be made, assembled or sourced?",
      "Which materials, components or processes would require clearer definition?",
      "Which recorded constraints could affect manufacture or cost?",
      "What should be measured or quoted before relying on a costing assumption?",
    ],
  },
  reality: {
    title: "Reality Inquiry",
    lens: "Practical conditions, uncertainty and evidence",
    explanation:
      "Consider what should be checked in real use without making a viability, safety, affordability or adoption determination.",
    prompts: [
      "What conditions must be true for the concept to work in practical use?",
      "What real-world constraint or uncertainty deserves testing?",
      "What evidence currently supports practical viability?",
      "What cost, adoption, operating or implementation assumption should be checked?",
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
      ? "Recorded Project evidence is available for reference in Project Context."
      : "No Project evidence is currently recorded.",
    context.directions.total > 0
      ? "Current Engineering Directions are recorded."
      : "No current Engineering Direction is recorded.",
    context.actions.total > 0
      ? "Adopted Engineering Actions are already recorded."
      : "No adopted Engineering Action is currently recorded.",
    context.constraints.total > 0
      ? "Current constraints are recorded in Project Context."
      : "No current constraint is recorded.",
    context.greatestRemainingUncertainty.trim()
      ? "A greatest remaining uncertainty is recorded in Project Context."
      : "No greatest remaining uncertainty is currently recorded.",
  ];
}
