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

const ASSUMPTION_SIGNALS =
  /\b(?:i think|i believe|probably|maybe|might|assum(?:e|ed|ing)|expect(?:ed)?|likely|guess)\b/i;

const EVIDENCE_PRESENT_SIGNALS = [
  /\b(?:seen|saw|observed|noticed|witnessed|measured|recorded|reported|documented|tested|told)\b/i,
  /\b(?:data|records?|measurements?|tests?|reports?|photos?|videos?|incidents?|complaints?|statistics?)\b/i,
  /\b\d+\s+(?:times?|shifts?|days?|weeks?|months?|incidents?|events?|cases?)\b/i,
];

const CONSTRAINT_SIGNALS = [
  /\b(?:must|must not|have to|has to|need to|cannot|can't|required|limited to|no more than|at least|at most)\b/i,
  /\b(?:portable|carry|weight|size|budget|cost|battery|power|mains|runtime|shift|weatherproof|waterproof|regulat\w*|standard\w*|legal\w*)\b/i,
];

const EVIDENCE_GAP_SIGNALS = [
  /\b(?:no|without)\s+(?:data|records?|measurements?|tests?|reports?|photos?|videos?|evidence)\b/i,
  /\b(?:do not|don't|have not|haven't|not)\s+(?:yet\s+)?(?:have|measured|recorded|tested|documented|validated|collected)\b/i,
  /\bnot yet\b/i,
  /\bneed to (?:measure|record|test|document|validate|collect)\b/i,
];

const OPEN_UNCERTAINTY_SIGNALS = [
  /\b(?:do not know|don't know|not sure|unsure|unknown|no idea)\b/i,
  /\bneed to (?:find out|investigate|check|confirm|determine|measure|test|validate)\b/i,
  /\bnot yet (?:known|confirmed|measured|tested|validated|determined)\b/i,
];

export type DiscoveryEvidenceStatus =
  | "not-addressed"
  | "reported"
  | "supported";

export type DiscoveryAssessment = {
  status: "exploring" | "checkpoint";
  readyToAdvance: boolean;
  nextQuestion: DiscoveryQuestion | null;
  addressedFocuses: DiscoveryQuestionFocus[];
  unansweredFocuses: DiscoveryQuestionFocus[];
  openFocuses: DiscoveryQuestionFocus[];
  evidenceStatus: DiscoveryEvidenceStatus;
  summary: string;
};

export function assessDiscovery(project: Project): DiscoveryAssessment {
  const addressedFocusSet = getAddressedFocuses(project);
  const addressedFocuses = QUESTION_CANDIDATES.map((candidate) => candidate.focus).filter(
    (focus) => addressedFocusSet.has(focus)
  );
  const unansweredFocuses = QUESTION_CANDIDATES.map((candidate) => candidate.focus).filter(
    (focus) => !addressedFocusSet.has(focus)
  );
  const evidenceStatus = getEvidenceStatus(project, addressedFocusSet);
  const openFocuses = getOpenFocuses(project);
  const nextQuestion = selectNextDiscoveryQuestion(project);
  const readyToAdvance = unansweredFocuses.length === 0;

  return {
    status: readyToAdvance ? "checkpoint" : "exploring",
    readyToAdvance,
    nextQuestion,
    addressedFocuses,
    unansweredFocuses,
    openFocuses,
    evidenceStatus,
    summary: readyToAdvance
      ? buildCheckpointSummary(evidenceStatus, openFocuses)
      : `${addressedFocuses.length} of ${QUESTION_CANDIDATES.length} core Discovery areas have been addressed. The remaining areas stay visible so questioning stops when sufficient understanding has been reached.`,
  };
}

export function selectNextDiscoveryQuestion(
  project: Project
): DiscoveryQuestion | null {
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
  const addressedFocuses = getAddressedFocuses(project);
  const solutionLed = SOLUTION_LED_OBSERVATION.test(project.originalObservation);
  const availableCandidates = QUESTION_CANDIDATES.filter(
    (candidate) => !addressedFocuses.has(candidate.focus)
  );

  if (availableCandidates.length === 0) {
    return null;
  }

  const ranked = availableCandidates
    .map((candidate) => {
      const originalIndex = QUESTION_CANDIDATES.findIndex(
        (item) => item.focus === candidate.focus
      );
      let score = candidate.basePriority;

      if (matchesAny(stateText, candidate.stateSignals)) {
        score += 7;
      }

      if (!matchesAny(understandingText, candidate.understandingSignals)) {
        score += 3;
      }

      if (
        candidate.focus === "purpose" &&
        solutionLed &&
        !addressedFocuses.has("purpose")
      ) {
        score += 8;
      }

      return { candidate, originalIndex, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.originalIndex - right.originalIndex
    );

  const selected = ranked[0]?.candidate;

  if (!selected) {
    return null;
  }

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
    question.focusLabel,
    cleanedAnswer
  );
  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "discovery-answer-recorded",
    title: `Discovery · ${question.focusLabel}`,
    description: `Question: ${question.prompt} Response: ${cleanedAnswer}`,
    subject: question.focus,
    response: cleanedAnswer,
    createdAt: now,
  };
  const currentEvidence = updateEvidenceNotes(project, cleanedAnswer);
  const currentConstraints = updateConstraints(project, cleanedAnswer);
  const currentAssumptions = updateAssumptions(project, cleanedAnswer);

  const provisionalProject: Project = {
    ...project,
    readiness: "understanding",
    engineeringState: {
      ...project.engineeringState,
      currentUnderstanding: updatedUnderstanding,
      currentEvidence,
      currentAssumptions,
      currentConstraints,
    },
    timeline: [...project.timeline, timelineEvent],
    updatedAt: now,
  };
  const assessment = assessDiscovery(provisionalProject);
  const nextEngineeringState: EngineeringState = {
    ...provisionalProject.engineeringState,
    greatestRemainingUncertainty: assessment.nextQuestion
      ? assessment.nextQuestion.uncertainty
      : buildCheckpointUncertainty(provisionalProject, assessment),
    nextEngineeringStep: assessment.nextQuestion
      ? assessment.nextQuestion.nextEngineeringStep
      : "Pause Discovery questioning. Review the Engineering State and plan evidence validation before solution development.",
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

  return "This question best advances the current Engineering State without evaluating a solution too early.";
}


function getAddressedFocuses(project: Project): Set<DiscoveryQuestionFocus> {
  const addressed = getAnsweredFocuses(project.timeline);

  // Discovery may learn structured evidence or constraints while asking about
  // another area. Treat those areas as addressed so REV does not force the
  // inventor through a redundant broad question after the information has
  // already been captured. Evidence gaps remain visible in the Engineering
  // State and can become targeted validation work at the checkpoint.
  if ((project.engineeringState.currentEvidence ?? []).length > 0) {
    addressed.add("evidence");
  }

  if ((project.engineeringState.currentConstraints ?? []).length > 0) {
    addressed.add("constraints");
  }

  return addressed;
}

function getAnsweredFocuses(
  timeline: ProjectTimelineEvent[]
): Set<DiscoveryQuestionFocus> {
  return new Set(
    timeline
      .filter((event) => event.type === "discovery-answer-recorded")
      .map((event) => event.subject)
      .filter(isDiscoveryQuestionFocus)
  );
}

function isDiscoveryQuestionFocus(
  value: string | undefined
): value is DiscoveryQuestionFocus {
  return QUESTION_CANDIDATES.some((candidate) => candidate.focus === value);
}

function getOpenFocuses(project: Project): DiscoveryQuestionFocus[] {
  const latestResponses = new Map<DiscoveryQuestionFocus, string>();

  for (const event of project.timeline) {
    if (event.type !== "discovery-answer-recorded" || !isDiscoveryQuestionFocus(event.subject)) {
      continue;
    }

    const response = event.response ?? extractLegacyResponse(event.description);
    latestResponses.set(event.subject, response);
  }

  return QUESTION_CANDIDATES.map((candidate) => candidate.focus).filter((focus) => {
    if (
      focus === "evidence" &&
      project.engineeringState.currentEvidence.some((note) =>
        note.startsWith("Evidence gap recorded:")
      )
    ) {
      return true;
    }

    const response = latestResponses.get(focus);
    return response ? matchesAny(response, OPEN_UNCERTAINTY_SIGNALS) : false;
  });
}

function extractLegacyResponse(description: string): string {
  const marker = " Response: ";
  const index = description.indexOf(marker);
  return index >= 0 ? description.slice(index + marker.length).trim() : description;
}

function getFocusLabel(focus: DiscoveryQuestionFocus): string {
  return (
    QUESTION_CANDIDATES.find((candidate) => candidate.focus === focus)?.focusLabel ??
    focus
  );
}

function appendUnderstanding(
  currentUnderstanding: string,
  focusLabel: string,
  answer: string
): string {
  const existing = currentUnderstanding.trim();
  const addition = `${focusLabel}: ${answer}`;

  if (!existing) {
    return addition;
  }

  return `${existing}\n\n${addition}`;
}

function updateEvidenceNotes(project: Project, answer: string): string[] {
  let notes = project.engineeringState.currentEvidence ?? [];

  for (const statement of splitDiscoveryStatements(answer)) {
    if (matchesAny(statement, EVIDENCE_GAP_SIGNALS)) {
      notes = appendUnique(notes, `Evidence gap recorded: ${statement}`);
      continue;
    }

    if (matchesAny(statement, EVIDENCE_PRESENT_SIGNALS)) {
      notes = appendUnique(
        notes,
        `Owner-reported evidence; not yet attached or validated: ${statement}`
      );
    }
  }

  return notes;
}

function updateConstraints(project: Project, answer: string): string[] {
  let constraints = project.engineeringState.currentConstraints ?? [];

  for (const statement of splitDiscoveryStatements(answer)) {
    if (matchesAny(statement, CONSTRAINT_SIGNALS)) {
      constraints = appendUnique(constraints, statement);
    }
  }

  return constraints;
}

function updateAssumptions(project: Project, answer: string): string[] {
  let assumptions = project.engineeringState.currentAssumptions ?? [];

  for (const statement of splitDiscoveryStatements(answer)) {
    if (ASSUMPTION_SIGNALS.test(statement)) {
      assumptions = appendUnique(assumptions, `Potential assumption: ${statement}`);
    }
  }

  return assumptions;
}

function splitDiscoveryStatements(answer: string): string[] {
  return (answer.match(/[^.!?]+[.!?]?/g) ?? [])
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function getEvidenceStatus(
  project: Project,
  answeredFocuses: Set<DiscoveryQuestionFocus>
): DiscoveryEvidenceStatus {
  if (project.evidence.length > 0) {
    return "supported";
  }

  if (
    answeredFocuses.has("evidence") ||
    project.engineeringState.currentEvidence.length > 0
  ) {
    return "reported";
  }

  return "not-addressed";
}

function buildCheckpointSummary(
  evidenceStatus: DiscoveryEvidenceStatus,
  openFocuses: DiscoveryQuestionFocus[]
): string {
  if (openFocuses.length > 0) {
    const labels = openFocuses.map(getFocusLabel).join(", ");
    return `Discovery has addressed all six core areas and made the remaining unknowns explicit: ${labels}. Broad questioning can stop; those unknowns should now become targeted evidence or validation work.`;
  }

  if (evidenceStatus === "supported") {
    return "Discovery has addressed all six core problem-understanding areas and supporting Project evidence exists. The Project has enough structured understanding to continue responsibly.";
  }

  return "Discovery has addressed all six core problem-understanding areas. The Project has enough structured understanding to stop broad questioning, while evidence validation remains an explicit next engineering task.";
}

function buildCheckpointUncertainty(
  project: Project,
  assessment: DiscoveryAssessment
): string {
  const latestAssumption = project.engineeringState.currentAssumptions.at(-1);

  if (latestAssumption) {
    return `A potential assumption still requires validation: ${latestAssumption.replace(
      /^Potential assumption:\s*/,
      ""
    )}`;
  }

  if (assessment.openFocuses.length > 0) {
    return `Discovery has exposed an unresolved area that now needs targeted work: ${getFocusLabel(
      assessment.openFocuses[0]
    )}.`;
  }

  if (assessment.evidenceStatus !== "supported") {
    return "Supporting evidence has not yet been attached and validated. Discovery has recorded the current evidence position so the gap remains explicit.";
  }

  return "Discovery has reached a sufficient-understanding checkpoint. Remaining uncertainty should now be reduced through validation and the next engineering discipline.";
}

function appendUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
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
