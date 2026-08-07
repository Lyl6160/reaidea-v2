import type {
  EngineeringState,
  Project,
  ProjectTimelineEvent,
} from "../core/project";

export type DiscoveryQuestionFocus =
  | "purpose"
  | "people"
  | "conditions"
  | "consequence"
  | "evidence"
  | "constraints";

export type DiscoveryQuestion = {
  id: DiscoveryQuestionFocus;
  focus: DiscoveryQuestionFocus;
  focusLabel: string;
  prompt: string;
  purpose: string;
  reason: string;
  uncertainty: string;
  nextEngineeringStep: string;
};

type QuestionCandidate = Omit<DiscoveryQuestion, "reason"> & {
  stateSignals: RegExp[];
  understandingSignals: RegExp[];
  basePriority: number;
};

const QUESTION_CANDIDATES: QuestionCandidate[] = [
  {
    id: "purpose",
    focus: "purpose",
    focusLabel: "Underlying Problem",
    prompt:
      "Before we develop the solution, what problem or failure in the current situation makes this necessary?",
    purpose:
      "Separate the proposed solution from the problem that created the need for it.",
    uncertainty:
      "The underlying problem that created the need for a solution is not yet clear enough.",
    nextEngineeringStep:
      "Clarify the underlying problem before evaluating or developing a solution.",
    stateSignals: [
      /underlying/i,
      /real problem/i,
      /why .*matter/i,
      /why .*necessary/i,
      /problem .*not yet/i,
    ],
    understandingSignals: [
      /\bproblem\b/i,
      /\bissue\b/i,
      /\bfailure\b/i,
      /\bdifficult(?:y)?\b/i,
      /\bunsafe\b/i,
      /\bnot working\b/i,
    ],
    basePriority: 4,
  },
  {
    id: "people",
    focus: "people",
    focusLabel: "People Affected",
    prompt:
      "Who experiences this problem most directly, and whose outcome matters most?",
    purpose:
      "Identify the people affected so Discovery understands the problem from the right point of view.",
    uncertainty:
      "Who is most affected by the problem, and whose outcome matters most, is not yet clear.",
    nextEngineeringStep:
      "Identify the people most affected by the problem and the outcome that matters to them.",
    stateSignals: [
      /\bwho\b/i,
      /affected/i,
      /customer/i,
      /user/i,
      /people/i,
    ],
    understandingSignals: [
      /\bworker\w*\b/i,
      /\bdriver\w*\b/i,
      /\boperator\w*\b/i,
      /\buser\w*\b/i,
      /\bcustomer\w*\b/i,
      /\bpeople\b/i,
      /\bperson\b/i,
      /\bpedestrian\w*\b/i,
      /\bcyclist\w*\b/i,
      /\bstaff\b/i,
      /\bcrew\b/i,
      /\bpublic\b/i,
      /\bresident\w*\b/i,
      /\bpatient\w*\b/i,
      /\bowner\w*\b/i,
      /\btechnician\w*\b/i,
      /\binstaller\w*\b/i,
      /\bfarmer\w*\b/i,
      /\bmotorist\w*\b/i,
    ],
    basePriority: 3,
  },
  {
    id: "conditions",
    focus: "conditions",
    focusLabel: "Operating Conditions",
    prompt:
      "Under what conditions does the problem become most noticeable or most difficult?",
    purpose:
      "Reveal when and where the problem matters so later engineering decisions are grounded in real operating conditions.",
    uncertainty:
      "The conditions in which the problem appears most clearly are not yet understood.",
    nextEngineeringStep:
      "Establish the operating conditions in which the problem occurs or becomes most severe.",
    stateSignals: [
      /condition/i,
      /\bwhen\b/i,
      /\bwhere\b/i,
      /environment/i,
      /circumstance/i,
    ],
    understandingSignals: [
      /\bnight\b/i,
      /\bdark\w*\b/i,
      /\brain\w*\b/i,
      /\bwet\b/i,
      /\bfog\w*\b/i,
      /\bweather\b/i,
      /poor visibility/i,
      /low visibility/i,
      /\bindoor\w*\b/i,
      /\boutdoor\w*\b/i,
      /\bheat\b/i,
      /\bcold\b/i,
      /\bwind\w*\b/i,
      /\bduring\b/i,
      /\bwhile\b/i,
    ],
    basePriority: 2,
  },
  {
    id: "consequence",
    focus: "consequence",
    focusLabel: "Consequence",
    prompt:
      "When this problem occurs, what actually goes wrong, and why does that consequence matter?",
    purpose:
      "Understand the consequence before deciding how valuable or urgent a future solution may be.",
    uncertainty:
      "The consequence of the problem — what goes wrong and why it matters — is not yet clear.",
    nextEngineeringStep:
      "Clarify the consequence of the problem and why that consequence matters.",
    stateSignals: [
      /consequence/i,
      /impact/i,
      /what goes wrong/i,
      /why it matters/i,
      /harm/i,
      /risk/i,
    ],
    understandingSignals: [
      /\brisk\w*\b/i,
      /\bunsafe\b/i,
      /\bdanger\w*\b/i,
      /\baccident\w*\b/i,
      /\binjur\w*\b/i,
      /\bcollision\w*\b/i,
      /near miss/i,
      /\bharm\w*\b/i,
      /\bdamage\w*\b/i,
      /\bdelay\w*\b/i,
      /\bconfus\w*\b/i,
      /fail(?:s|ed|ure)? to/i,
      /\bcostly\b/i,
    ],
    basePriority: 3,
  },
  {
    id: "evidence",
    focus: "evidence",
    focusLabel: "Evidence",
    prompt:
      "What have you seen, measured, recorded, or been told that shows this problem is really occurring?",
    purpose:
      "Separate current evidence from belief so the Project knows what is known and what still needs validation.",
    uncertainty:
      "The Project does not yet have enough evidence showing how often or how severely the problem occurs.",
    nextEngineeringStep:
      "Identify existing evidence and what evidence still needs to be gathered.",
    stateSignals: [
      /evidence/i,
      /measur/i,
      /record/i,
      /how often/i,
      /how severe/i,
      /validation/i,
    ],
    understandingSignals: [
      /\bdata\b/i,
      /\btest\w*\b/i,
      /\bmeasur\w*\b/i,
      /\breport\w*\b/i,
      /\bincident\w*\b/i,
      /\bcomplaint\w*\b/i,
      /\bphoto\w*\b/i,
      /\bvideo\w*\b/i,
      /\bstatistic\w*\b/i,
      /\bobserved\b/i,
      /\brecorded\b/i,
      /\bfrequency\b/i,
      /\boften\b/i,
      /\bpercent\b/i,
      /\b\d+(?:\.\d+)?%\b/i,
    ],
    basePriority: 1,
  },
  {
    id: "constraints",
    focus: "constraints",
    focusLabel: "Constraints",
    prompt:
      "What practical constraints would any future solution have to respect?",
    purpose:
      "Expose boundaries early without allowing them to force a solution before the problem is understood.",
    uncertainty:
      "The practical constraints that any future solution must respect are not yet clear.",
    nextEngineeringStep:
      "Identify the practical, physical, regulatory, cost, and operating constraints that matter.",
    stateSignals: [
      /constraint/i,
      /must respect/i,
      /regulat/i,
      /cost/i,
      /physical/i,
    ],
    understandingSignals: [
      /\bmust\b/i,
      /\bcannot\b/i,
      /\bcan't\b/i,
      /\bregulat\w*\b/i,
      /\bstandard\w*\b/i,
      /\blegal\w*\b/i,
      /\bbudget\w*\b/i,
      /\bcost\w*\b/i,
      /\bweight\w*\b/i,
      /\bsize\w*\b/i,
      /\bpower\w*\b/i,
      /\bbattery\w*\b/i,
      /weatherproof/i,
      /waterproof/i,
    ],
    basePriority: 1,
  },
];

const SOLUTION_LED_OBSERVATION =
  /\b(?:want to|need to|trying to|plan to|would like to)?\s*(?:design|build|create|make|develop|invent|modify)\b/i;

export function selectNextDiscoveryQuestion(project: Project): DiscoveryQuestion {
  const stateText = [
    project.engineeringState.greatestRemainingUncertainty,
    project.engineeringState.nextEngineeringStep,
  ]
    .join(" ")
    .trim();
  const understandingText = [
    project.originalObservation,
    project.engineeringState.currentUnderstanding,
  ]
    .join(" ")
    .trim();
  const answeredFocuses = getAnsweredFocuses(project.timeline);
  const solutionLed = SOLUTION_LED_OBSERVATION.test(project.originalObservation);

  const ranked = QUESTION_CANDIDATES.map((candidate, index) => {
    let score = candidate.basePriority;

    if (answeredFocuses.has(candidate.focus)) {
      score -= 100;
    }

    if (matchesAny(stateText, candidate.stateSignals)) {
      score += 7;
    }

    if (!matchesAny(understandingText, candidate.understandingSignals)) {
      score += 3;
    }

    if (candidate.focus === "purpose" && solutionLed && !answeredFocuses.has("purpose")) {
      score += 8;
    }

    return { candidate, index, score };
  }).sort((left, right) => right.score - left.score || left.index - right.index);

  const selected = ranked[0]?.candidate ?? QUESTION_CANDIDATES[0];

  return {
    id: selected.id,
    focus: selected.focus,
    focusLabel: selected.focusLabel,
    prompt: selected.prompt,
    purpose: selected.purpose,
    uncertainty: selected.uncertainty,
    nextEngineeringStep: selected.nextEngineeringStep,
    reason: buildReason(project, selected, stateText, understandingText, solutionLed),
  };
}

export function recordDiscoveryAnswer(
  project: Project,
  question: DiscoveryQuestion,
  answer: string
): Project {
  const cleanedAnswer = answer.trim();

  if (!cleanedAnswer) {
    return project;
  }

  const now = new Date().toISOString();
  const updatedUnderstanding = appendUnderstanding(
    project.engineeringState.currentUnderstanding,
    cleanedAnswer
  );
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "discovery-answer-recorded",
    title: `Discovery · ${question.focusLabel}`,
    description: `Question: ${question.prompt} Response: ${cleanedAnswer}`,
    subject: question.focus,
    createdAt: now,
  };

  const provisionalProject: Project = {
    ...project,
    readiness: "understanding",
    engineeringState: {
      ...project.engineeringState,
      currentUnderstanding: updatedUnderstanding,
    },
    timeline: [...project.timeline, timelineEvent],
    updatedAt: now,
  };
  const nextQuestion = selectNextDiscoveryQuestion(provisionalProject);
  const nextEngineeringState: EngineeringState = {
    ...provisionalProject.engineeringState,
    greatestRemainingUncertainty: nextQuestion.uncertainty,
    nextEngineeringStep: nextQuestion.nextEngineeringStep,
  };

  return {
    ...provisionalProject,
    engineeringState: nextEngineeringState,
  };
}

function buildReason(
  project: Project,
  candidate: QuestionCandidate,
  stateText: string,
  understandingText: string,
  solutionLed: boolean
): string {
  if (candidate.focus === "purpose" && solutionLed) {
    return "The original observation leads with a proposed solution. Discovery is separating that solution from the problem that created the need.";
  }

  if (matchesAny(stateText, candidate.stateSignals)) {
    return `The Engineering State identifies this as the greatest remaining uncertainty: ${project.engineeringState.greatestRemainingUncertainty}`;
  }

  if (!matchesAny(understandingText, candidate.understandingSignals)) {
    return `The current understanding does not yet make ${candidate.focusLabel.toLowerCase()} clear enough to support the next engineering decision.`;
  }

  return `This question best advances the current Engineering State without evaluating a solution too early.`;
}

function getAnsweredFocuses(timeline: ProjectTimelineEvent[]): Set<string> {
  return new Set(
    timeline
      .filter((event) => event.type === "discovery-answer-recorded")
      .map((event) => event.subject)
      .filter((subject): subject is string => typeof subject === "string")
  );
}

function appendUnderstanding(currentUnderstanding: string, answer: string): string {
  const existing = currentUnderstanding.trim();

  if (!existing) {
    return answer;
  }

  return `${existing}\n\nDiscovery added: ${answer}`;
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
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
