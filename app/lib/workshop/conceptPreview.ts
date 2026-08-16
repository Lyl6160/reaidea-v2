import type { Project } from "../core/project";
import { assessDiscovery } from "./discoveryReasoning";

export type ConceptEvolutionStage =
  | "dormant"
  | "spark"
  | "clustering"
  | "outline"
  | "structure"
  | "wireframe"
  | "early-ready"
  | "solution-forming"
  | "solution-shaping"
  | "functional-elements"
  | "input-output"
  | "functional-flow"
  | "interaction"
  | "arrangement"
  | "constraint-response"
  | "engineering-ready";

export type SharedConceptPreview = {
  stage: ConceptEvolutionStage;
  answerCount: number;
  engineeringAnswerCount: number;
  title: string;
  subtitle: string;
};

type FrozenDiscoveryStage =
  | "dormant"
  | "spark"
  | "clustering"
  | "outline"
  | "structure"
  | "wireframe";

const STAGE_COPY: Record<
  FrozenDiscoveryStage,
  Pick<SharedConceptPreview, "title" | "subtitle">
> = {
  dormant: {
    title: "IDEA WAITING",
    subtitle: "Record a Discovery answer to begin forming the idea.",
  },
  spark: {
    title: "IDEA EVOLVING",
    subtitle: "The first signals of the idea are appearing.",
  },
  clustering: {
    title: "IDEA EVOLVING",
    subtitle: "The concept is clustering around what you have shared.",
  },
  outline: {
    title: "IDEA TAKING SHAPE",
    subtitle: "A loose conceptual outline is beginning to emerge.",
  },
  structure: {
    title: "IDEA TAKING SHAPE",
    subtitle: "Early relationships are forming between the idea's parts.",
  },
  wireframe: {
    title: "EARLY CONCEPT FORMING",
    subtitle: "Discovery has formed an abstract preliminary structure.",
  },
};

export function deriveSharedConceptPreview(project: Project): SharedConceptPreview {
  const recordedSubjects = new Set<string>();
  const engineeringSubjects = new Set<string>();

  for (const event of project.timeline) {
    if (event.type === "discovery-answer-recorded") {
      recordedSubjects.add(event.subject?.trim() || event.id);
    }

    if (event.type === "engineering-definition-input-recorded") {
      engineeringSubjects.add(event.subject?.trim() || event.id);
    }
  }

  const answerCount = recordedSubjects.size;
  const engineeringAnswerCount = engineeringSubjects.size;

  if (assessDiscovery(project).readyToAdvance) {
    if (engineeringAnswerCount > 0) {
      return deriveEngineeringPreview(answerCount, engineeringAnswerCount);
    }

    return {
      stage: "early-ready",
      answerCount,
      engineeringAnswerCount,
      title: "EARLY CONCEPT READY",
      subtitle: "Enough early understanding exists to begin a more specific concept study.",
    };
  }

  const stage: FrozenDiscoveryStage =
    answerCount === 0
      ? "dormant"
      : answerCount === 1
        ? "spark"
        : answerCount === 2
          ? "clustering"
          : answerCount === 3
            ? "outline"
            : answerCount === 4
              ? "structure"
              : "wireframe";

  return { stage, answerCount, engineeringAnswerCount, ...STAGE_COPY[stage] };
}

function deriveEngineeringPreview(
  answerCount: number,
  engineeringAnswerCount: number
): SharedConceptPreview {
  const stages: Array<Pick<SharedConceptPreview, "stage" | "title" | "subtitle">> = [
    {
      stage: "solution-forming",
      title: "SOLUTION FORMING",
      subtitle: "The proposed outcome is beginning to organise the early concept.",
    },
    {
      stage: "solution-shaping",
      title: "SOLUTION TAKING SHAPE",
      subtitle: "The operating concept is adding stronger functional organisation.",
    },
    {
      stage: "functional-elements",
      title: "FUNCTIONAL ELEMENTS FORMING",
      subtitle: "Major abstract elements and their relationships are becoming distinct.",
    },
    {
      stage: "input-output",
      title: "INPUT / OUTPUT FORMING",
      subtitle: "Generic entry, transformation, and exit relationships are appearing.",
    },
    {
      stage: "functional-flow",
      title: "FUNCTIONAL FLOW FORMING",
      subtitle: "A more organised functional pathway is forming through the concept.",
    },
    {
      stage: "interaction",
      title: "INTERACTION FORMING",
      subtitle: "An external interaction point is joining the functional structure.",
    },
    {
      stage: "arrangement",
      title: "ARRANGEMENT FORMING",
      subtitle: "The concept is gaining clearer spatial and logical order.",
    },
    {
      stage: "constraint-response",
      title: "CONSTRAINT RESPONSE FORMING",
      subtitle: "A conceptual boundary now marks where constraints must be addressed.",
    },
    {
      stage: "engineering-ready",
      title: "ENGINEERING DEFINITION READY",
      subtitle: "Enough inventor-defined solution detail exists to classify the idea and prepare a more specific concept.",
    },
  ];
  const selected = stages[Math.min(engineeringAnswerCount, stages.length) - 1];

  return {
    ...selected,
    answerCount,
    engineeringAnswerCount,
  };
}
