import type { Project } from "../core/project";
import type { EngineeringTraceSummary } from "./traceSummary";

const DISPLAY_LIMIT = 5;

export type LimitedSpecialistContextItems<T> = {
  items: T[];
  total: number;
  truncated: boolean;
};

export type SpecialistProjectContext = {
  projectName: string;
  currentUnderstanding: string;
  constraints: LimitedSpecialistContextItems<string>;
  greatestRemainingUncertainty: string;
  evidence: LimitedSpecialistContextItems<
    EngineeringTraceSummary["projectEvidence"][number]
  >;
  conclusions: LimitedSpecialistContextItems<
    EngineeringTraceSummary["currentEngineeringConclusions"][number]
  >;
  directions: LimitedSpecialistContextItems<
    EngineeringTraceSummary["currentEngineeringDirections"][number]
  >;
  actions: LimitedSpecialistContextItems<
    EngineeringTraceSummary["adoptedEngineeringActions"][number]
  >;
};

export function createSpecialistProjectContext(
  project: Project,
  trace: EngineeringTraceSummary
): SpecialistProjectContext {
  return {
    projectName: project.projectName,
    currentUnderstanding: project.engineeringState.currentUnderstanding,
    constraints: limitItems(project.engineeringState.currentConstraints),
    greatestRemainingUncertainty:
      project.engineeringState.greatestRemainingUncertainty,
    evidence: limitItems(trace.projectEvidence),
    conclusions: limitItems(trace.currentEngineeringConclusions),
    directions: limitItems(trace.currentEngineeringDirections),
    actions: limitItems(trace.adoptedEngineeringActions),
  };
}

function limitItems<T>(items: T[]): LimitedSpecialistContextItems<T> {
  return {
    items: items.slice(0, DISPLAY_LIMIT),
    total: items.length,
    truncated: items.length > DISPLAY_LIMIT,
  };
}
