import type { Project } from "../core/project";
import { assessDiscovery } from "./discoveryReasoning";

export type ConceptEvolutionStage =
  | "dormant"
  | "spark"
  | "clustering"
  | "outline"
  | "structure"
  | "wireframe"
  | "early-ready";

export type SharedConceptPreview = {
  stage: ConceptEvolutionStage;
  answerCount: number;
  title: string;
  subtitle: string;
};

const STAGE_COPY: Record<
  Exclude<ConceptEvolutionStage, "early-ready">,
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

  for (const event of project.timeline) {
    if (event.type !== "discovery-answer-recorded") continue;
    recordedSubjects.add(event.subject?.trim() || event.id);
  }

  const answerCount = recordedSubjects.size;

  if (assessDiscovery(project).readyToAdvance) {
    return {
      stage: "early-ready",
      answerCount,
      title: "EARLY CONCEPT READY",
      subtitle: "Enough early understanding exists to begin a more specific concept study.",
    };
  }

  const stage: Exclude<ConceptEvolutionStage, "early-ready"> =
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

  return { stage, answerCount, ...STAGE_COPY[stage] };
}
