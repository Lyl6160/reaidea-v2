import type { Project, ProjectTimelineEvent } from "../core/project";

export type EngineeringDefinitionArea =
  | "proposed-solution"
  | "operating-concept"
  | "functional-elements"
  | "inputs-outputs"
  | "relationships-flow"
  | "user-interaction"
  | "arrangement"
  | "constraint-safety-response"
  | "technical-uncertainty";

export type EngineeringDefinitionQuestion = {
  id: EngineeringDefinitionArea;
  area: EngineeringDefinitionArea;
  label: string;
  prompt: string;
  purpose: string;
  guidance: string;
};

export type EngineeringDefinitionInput = {
  eventId: string;
  area: EngineeringDefinitionArea;
  label: string;
  answer: string;
  createdAt: string;
};

export type EngineeringDefinitionAssessment = {
  status: "not-started" | "forming" | "ready-for-summary";
  nextQuestion: EngineeringDefinitionQuestion | null;
  addressedAreas: EngineeringDefinitionArea[];
  remainingAreas: EngineeringDefinitionArea[];
  latestAnswers: Partial<Record<EngineeringDefinitionArea, string>>;
  solutionDefinitionSummary: string;
  conceptBriefReadiness: "not-ready" | "ready-for-summary";
};

export type RecordEngineeringDefinitionAnswerResult =
  | { status: "recorded"; project: Project; eventId: string }
  | { status: "invalid"; project: Project; reason: string };

export const ENGINEERING_DEFINITION_QUESTIONS: readonly EngineeringDefinitionQuestion[] = [
  {
    id: "proposed-solution",
    area: "proposed-solution",
    label: "What should your idea do?",
    prompt: "What do you think your idea should do?",
    purpose: "Describe the useful result your idea should produce. It does not need to be proven yet.",
    guidance: "Describe the useful outcome in your own words. It can still change as the idea develops.",
  },
  {
    id: "operating-concept",
    area: "operating-concept",
    label: "How It Works",
    prompt: "How do you think your idea makes that happen?",
    purpose: "Capture the inventor's current operating concept before choosing a detailed design.",
    guidance: "Explain it simply in your own words. We can work out the technical detail as the idea develops.",
  },
  {
    id: "functional-elements",
    area: "functional-elements",
    label: "Main parts or steps",
    prompt: "What main parts or steps does it need?",
    purpose: "Describe the main parts or steps, whether your idea is a product, process, or something else.",
    guidance: "Just name the important pieces needed for the idea to work.",
  },
  {
    id: "inputs-outputs",
    area: "inputs-outputs",
    label: "What it needs and produces",
    prompt: "What does it need, and what does it produce?",
    purpose: "Make the proposed transformation visible across product, process, software, and system ideas.",
    guidance: "Think about things such as power, materials, information, an action from a person, or another input.",
  },
  {
    id: "relationships-flow",
    area: "relationships-flow",
    label: "How the parts work together",
    prompt: "How do the parts work together?",
    purpose: "Show how the parts connect and work as one idea.",
    guidance: "Tell REV what connects to what, what moves between the parts, and what happens next.",
  },
  {
    id: "user-interaction",
    area: "user-interaction",
    label: "How someone uses it",
    prompt: "How would someone use it?",
    purpose: "Clarify how the solution is started, controlled, observed, or used.",
    guidance: "If nobody directly uses it, explain what starts it, controls it, or receives the result.",
  },
  {
    id: "arrangement",
    area: "arrangement",
    label: "Where things go",
    prompt: "Where does everything go?",
    purpose: "Show how the main parts are laid out or arranged.",
    guidance: "Describe where the main parts sit or how they are arranged.",
  },
  {
    id: "constraint-safety-response",
    area: "constraint-safety-response",
    label: "Problems, limits, and safety",
    prompt: "What problems, limits, or safety issues do you see?",
    purpose: "Connect the proposed solution to known boundaries without claiming they are resolved.",
    guidance: "Think about the things the solution must respect, avoid, withstand, or protect against.",
  },
  {
    id: "technical-uncertainty",
    area: "technical-uncertainty",
    label: "What are you unsure about?",
    prompt: "What are you still unsure about?",
    purpose: "Keep uncertainty explicit so later Engineering and Validation can challenge the right thing.",
    guidance: "Tell REV what still feels difficult or may not work.",
  },
] as const;

const QUESTION_BY_AREA = new Map(
  ENGINEERING_DEFINITION_QUESTIONS.map((question) => [question.area, question])
);

export function assessEngineeringDefinition(
  project: Project
): EngineeringDefinitionAssessment {
  const latestAnswers: Partial<Record<EngineeringDefinitionArea, string>> = {};

  for (const input of getEngineeringDefinitionInputs(project)) {
    latestAnswers[input.area] = input.answer;
  }

  const addressedAreas = ENGINEERING_DEFINITION_QUESTIONS
    .map((question) => question.area)
    .filter((area) => Boolean(latestAnswers[area]?.trim()));
  const remainingAreas = ENGINEERING_DEFINITION_QUESTIONS
    .map((question) => question.area)
    .filter((area) => !latestAnswers[area]?.trim());
  const nextQuestion = ENGINEERING_DEFINITION_QUESTIONS.find(
    (question) => remainingAreas.includes(question.area)
  ) ?? null;
  const readyForSummary = remainingAreas.length === 0;

  return {
    status: readyForSummary
      ? "ready-for-summary"
      : addressedAreas.length > 0
        ? "forming"
        : "not-started",
    nextQuestion,
    addressedAreas,
    remainingAreas,
    latestAnswers,
    solutionDefinitionSummary: buildSolutionDefinitionSummary(latestAnswers),
    conceptBriefReadiness: readyForSummary ? "ready-for-summary" : "not-ready",
  };
}

export function getEngineeringDefinitionInputs(
  project: Project
): EngineeringDefinitionInput[] {
  return project.timeline.flatMap((event) => {
    if (
      event.type !== "engineering-definition-input-recorded" ||
      !isEngineeringDefinitionArea(event.subject)
    ) {
      return [];
    }

    const answer = event.response?.trim();
    const question = QUESTION_BY_AREA.get(event.subject);
    if (!answer || !question) return [];

    return [{
      eventId: event.id,
      area: event.subject,
      label: question.label,
      answer,
      createdAt: event.createdAt,
    }];
  });
}

export function recordEngineeringDefinitionAnswer(
  project: Project,
  question: EngineeringDefinitionQuestion,
  answer: string
): RecordEngineeringDefinitionAnswerResult {
  const cleanedAnswer = answer.trim();

  if (!cleanedAnswer) {
    return {
      status: "invalid",
      project,
      reason: "Record your Engineering definition response before continuing.",
    };
  }

  const canonicalQuestion = QUESTION_BY_AREA.get(question.area);
  if (!canonicalQuestion || canonicalQuestion.id !== question.id) {
    return {
      status: "invalid",
      project,
      reason: "This Engineering definition question is not available.",
    };
  }

  const now = new Date().toISOString();
  const eventId = createId();
  const timelineEvent: ProjectTimelineEvent = {
    id: eventId,
    type: "engineering-definition-input-recorded",
    title: `Engineering Definition · ${canonicalQuestion.label}`,
    description: `Question: ${canonicalQuestion.prompt} Response: ${cleanedAnswer}`,
    subject: canonicalQuestion.area,
    response: cleanedAnswer,
    createdAt: now,
  };

  return {
    status: "recorded",
    eventId,
    project: {
      ...project,
      timeline: [...project.timeline, timelineEvent],
      updatedAt: now,
    },
  };
}

function buildSolutionDefinitionSummary(
  latestAnswers: Partial<Record<EngineeringDefinitionArea, string>>
): string {
  return ENGINEERING_DEFINITION_QUESTIONS.flatMap((question) => {
    const answer = latestAnswers[question.area]?.trim();
    return answer ? [`${question.label}: ${answer.slice(0, 320)}`] : [];
  }).join("\n\n");
}

function isEngineeringDefinitionArea(
  value: string | undefined
): value is EngineeringDefinitionArea {
  return typeof value === "string" && QUESTION_BY_AREA.has(value as EngineeringDefinitionArea);
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
