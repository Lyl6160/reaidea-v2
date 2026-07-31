export type ProjectBrain = {
  id: string;
  name: string;
  originalIdea: string;
  createdAt: string;
  updatedAt: string;

  industry: string;
  problem: string;
  solution: string;

  targetCustomers: string[];
  competitors: string[];
  advantages: string[];
  risks: string[];
  openQuestions: string[];

  businessModel: string;
  manufacturingNotes: string;
  patentStatus: string;
  fundingStatus: string;

  confidenceScore: number;
  interviewComplete: boolean;
};

export function createProjectBrain(idea: string): ProjectBrain {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: createProjectName(idea),
    originalIdea: idea,
    createdAt: now,
    updatedAt: now,

    industry: "",
    problem: "",
    solution: "",

    targetCustomers: [],
    competitors: [],
    advantages: [],
    risks: [],
    openQuestions: [],

    businessModel: "",
    manufacturingNotes: "",
    patentStatus: "Not assessed",
    fundingStatus: "Not started",

    confidenceScore: 0,
    interviewComplete: false,
  };
}

function createProjectName(idea: string): string {
  const firstSentence = idea.split(/[.!?]/)[0].trim();

  if (firstSentence.length <= 60) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 57).trim()}...`;
}