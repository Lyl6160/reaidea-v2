export type BrainField =
  | "problem"
  | "customer"
  | "existingSolution"
  | "advantage"
  | "outcome";

export type KnowledgeNode = {
  id: BrainField;
  title: string;
  value: string;
  confidence: number;
  completed: boolean;
  updatedAt: string | null;
};

export type InnovationBrain = {
  problem: KnowledgeNode;
  customer: KnowledgeNode;
  existingSolution: KnowledgeNode;
  advantage: KnowledgeNode;
  outcome: KnowledgeNode;

  completedNodes: number;
  totalNodes: number;
  progress: number;
  aiConfidence: number;
  innovationScore: number;
  updatedAt: string | null;
};

export const interviewFieldOrder: BrainField[] = [
  "problem",
  "customer",
  "existingSolution",
  "advantage",
  "outcome",
];

export function createEmptyInnovationBrain(): InnovationBrain {
  return {
    problem: createNode("problem", "Problem"),
    customer: createNode("customer", "Target Customer"),
    existingSolution: createNode(
      "existingSolution",
      "Existing Solutions"
    ),
    advantage: createNode(
      "advantage",
      "Competitive Advantage"
    ),
    outcome: createNode("outcome", "Customer Outcome"),

    completedNodes: 0,
    totalNodes: interviewFieldOrder.length,
    progress: 1,
    aiConfidence: 8,
    innovationScore: 0,
    updatedAt: null,
  };
}

function createNode(
  id: BrainField,
  title: string
): KnowledgeNode {
  return {
    id,
    title,
    value: "",
    confidence: 0,
    completed: false,
    updatedAt: null,
  };
}

export function updateBrainWithAnswer(
  currentBrain: InnovationBrain,
  field: BrainField,
  answer: string
): InnovationBrain {
  const cleanedAnswer = answer.trim();

  if (!cleanedAnswer) {
    return currentBrain;
  }

  const now = new Date().toISOString();
  const previousNode = currentBrain[field];

  const updatedNode: KnowledgeNode = {
    ...previousNode,
    value: cleanedAnswer,
    confidence: calculateNodeConfidence(cleanedAnswer),
    completed: true,
    updatedAt: now,
  };

  const updatedBrain: InnovationBrain = {
    ...currentBrain,
    [field]: updatedNode,
    updatedAt: now,
  };

  return recalculateBrain(updatedBrain);
}

export function recalculateBrain(
  brain: InnovationBrain
): InnovationBrain {
  const nodes = interviewFieldOrder.map(
    (field) => brain[field]
  );

  const completedNodes = nodes.filter(
    (node) => node.completed
  ).length;

  const progress =
    completedNodes === brain.totalNodes
      ? 100
      : Math.max(
          1,
          Math.round(
            (completedNodes / brain.totalNodes) * 100
          )
        );

  const completedConfidence = nodes
    .filter((node) => node.completed)
    .map((node) => node.confidence);

  const averageConfidence =
    completedConfidence.length === 0
      ? 8
      : Math.round(
          completedConfidence.reduce(
            (total, value) => total + value,
            0
          ) / completedConfidence.length
        );

  const aiConfidence = Math.min(
    96,
    Math.max(
      8,
      Math.round(
        averageConfidence *
          (0.45 + progress / 180)
      )
    )
  );

  const innovationScore = calculateInnovationScore(
    nodes,
    progress
  );

  return {
    ...brain,
    completedNodes,
    progress,
    aiConfidence,
    innovationScore,
  };
}

function calculateNodeConfidence(answer: string): number {
  const wordCount = answer
    .split(/\s+/)
    .filter(Boolean).length;

  if (wordCount >= 80) return 95;
  if (wordCount >= 50) return 88;
  if (wordCount >= 30) return 80;
  if (wordCount >= 15) return 68;
  if (wordCount >= 8) return 55;

  return 40;
}

function calculateInnovationScore(
  nodes: KnowledgeNode[],
  progress: number
): number {
  const completedNodes = nodes.filter(
    (node) => node.completed
  );

  if (completedNodes.length === 0) {
    return 0;
  }

  const averageConfidence =
    completedNodes.reduce(
      (total, node) => total + node.confidence,
      0
    ) / completedNodes.length;

  return Math.min(
    100,
    Math.round(
      averageConfidence * 0.6 + progress * 0.4
    )
  );
}