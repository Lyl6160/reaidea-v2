import type { Project, ProjectTimelineEvent } from "../core/project";

export const HOME_UNDERSTANDING_STAGES = [
  "IDEA CAPTURED",
  "FORM UNDERSTOOD",
  "KEY PARTS UNDERSTOOD",
  "RELATIONSHIPS UNDERSTOOD",
  "READY TO CREATE 3D",
] as const;

export type HomeUnderstandingStage = (typeof HOME_UNDERSTANDING_STAGES)[number];

export type HomeUnderstandingState =
  | "IDEA_ENTRY"
  | "SAFETY_CHECKING"
  | "REV_ANALYSING"
  | "QUESTION_READY"
  | "ANSWER_RECORDING"
  | "KNOWLEDGE_SECURED"
  | "READY_TO_CREATE_3D"
  | "SAFE_ERROR_OR_RETRY";

export type HomeKnowledgeCategory =
  | "purpose-use"
  | "overall-form"
  | "major-parts"
  | "spatial-relationship"
  | "operating-relationship"
  | "size-proportion"
  | "interaction-point"
  | "constraint"
  | "must-have"
  | "must-avoid"
  | "reference-evidence";

export type HomeKnowledgeSourceKind =
  | "original-description"
  | "inventor-answer"
  | "cleared-reference"
  | "rev-recommendation";

export type HomeKnowledgeAuthority =
  | "inventor-authored"
  | "derived-support"
  | "rev-recommended";

export type HomeKnowledgeRecord = {
  version: 1;
  category: HomeKnowledgeCategory;
  value: string;
  sourceKind: HomeKnowledgeSourceKind;
  sourceReference: string;
  authority: HomeKnowledgeAuthority;
  reversibleAssumption: boolean;
  questionEventId?: string;
  supersedesEventId?: string;
  supportingSourceIds?: string[];
  sequence: number;
  createdAt: string;
};

export type HomeQuestionChoice = {
  id: string;
  label: string;
  value: string;
};

export type HomeRecommendation = {
  label: "I'M NOT SURE / LET REV RECOMMEND";
  value: string;
  supportingSourceIds: string[];
};

export type HomeUnderstandingQuestionRecord = {
  version: 1;
  targetCategory: HomeKnowledgeCategory;
  prompt: string;
  choices: HomeQuestionChoice[];
  recommendation?: HomeRecommendation;
  sequence: number;
  createdAt: string;
};

export type HomePresentationClaim = {
  version: 1;
  knowledgeEventId: string;
  sequence: number;
  createdAt: string;
};

export type HomeUnderstandingTimelineMetadata =
  | { kind: "knowledge"; knowledge: HomeKnowledgeRecord }
  | { kind: "question"; question: HomeUnderstandingQuestionRecord }
  | { kind: "presentation-claim"; claim: HomePresentationClaim };

export type ActiveHomeKnowledge = HomeKnowledgeRecord & { eventId: string };
export type ActiveHomeQuestion = HomeUnderstandingQuestionRecord & { eventId: string };

export type HomeEvidenceCoverage = {
  completedStages: HomeUnderstandingStage[];
  currentStage: HomeUnderstandingStage;
  ready: boolean;
  blockingConflictEventIds: string[];
};

export type HomeUnderstandingEventFactory = {
  now: string;
  nextId: () => string;
};

export type HomeAnswerInput =
  | { kind: "choice"; choiceId: string; supersedesEventId?: string }
  | { kind: "own-words"; value: string; supersedesEventId?: string }
  | { kind: "rev-recommendation"; supersedesEventId?: string };

export type HomeAnswerResult =
  | { kind: "recorded"; project: Project; knowledgeEventId: string }
  | { kind: "duplicate"; message: string }
  | { kind: "invalid"; message: string };

export function isMatchingHomeProject(
  project: Project,
  originalObservation: string,
  originIntent: Project["originIntent"]
): boolean {
  return normalize(project.originalObservation) === normalize(originalObservation) &&
    project.originIntent === originIntent;
}

const categoryLabels: Record<HomeKnowledgeCategory, string> = {
  "purpose-use": "Purpose and use",
  "overall-form": "Overall form",
  "major-parts": "Key parts",
  "spatial-relationship": "Part arrangement",
  "operating-relationship": "Working relationship",
  "size-proportion": "Size and proportion",
  "interaction-point": "Inventor interaction",
  constraint: "Constraint",
  "must-have": "Must-have",
  "must-avoid": "Must-avoid",
  "reference-evidence": "Reference evidence",
};

type ExtractedAuthoredFact = {
  category: HomeKnowledgeCategory;
  value: string;
};

const physicalFormPattern = /\b(?:eyewear|goggles?|glasses|viewer|frame|body|housing|enclosure|panel|system|assembly|device|equipment|structure|tool|machine|cabinet|product)\b/iu;
const physicalFormPrefixPattern = /^(?:(?:i|we)\s+(?:want|need)(?:\s+rev)?(?:\s+to)?\s+(?:(?:design|develop|create|make)\s+)?)/iu;

function asFact(value: string): string {
  const clean = bounded(value).replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, "").replace(/[.!?]+$/g, "");
  if (!clean) return "";
  return `${clean.charAt(0).toLocaleUpperCase()}${clean.slice(1)}.`;
}

function firstBoundedMatch(statement: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = statement.match(pattern)?.[1];
    if (match) return asFact(match);
  }
  return "";
}

function extractOverallForm(statement: string): string {
  const source = statement.replace(physicalFormPrefixPattern, "").trim();
  const words = source.split(/\s+/);
  const nounIndex = words.findIndex((_, index) => physicalFormPattern.test(words.slice(index, index + 1).join(" ")));
  if (nounIndex < 0 || nounIndex > 7) return "";
  return asFact(words.slice(0, nounIndex + 1).join(" "));
}

function extractPurpose(statement: string): string {
  return firstBoundedMatch(statement, [
    /\b(?:used\s+to|in\s+order\s+to)\s+([^.;,]+?)(?=\s+\b(?:without|while|but)\b|[.;,]|$)/iu,
    /\b(?:that|which)\s+([^.;,]+?)(?=\s+\b(?:without|with|while|but)\b|[.;,]|$)/iu,
    /\bhelps?\s+([^.;,]+?)(?=\s+\b(?:without|while|but)\b|[.;,]|$)/iu,
    /\bso\s+(?:that\s+)?([^.;]+?)(?=\s+\b(?:without|while|but)\b|[.;]|$)/iu,
    /\bfor\s+([^.;,]+?)(?=\s+\b(?:without|while|but)\b|[.;,]|$)/iu,
  ]);
}

function extractMajorParts(statement: string): string {
  return firstBoundedMatch(statement, [
    /\b(?:with|has|have|includes?|consists?\s+of|made\s+of)\s+(.+?)(?=\s+\b(?:arranged|positioned|mounted|attached|connected|above|below|behind|inside|outside|around|between|that|which|so)\b|[.;]|$)/iu,
  ]);
}

function extractSpatialRelationship(statement: string): string {
  return firstBoundedMatch(statement, [
    /\b((?:arranged|positioned|mounted|attached|connected)\s+.+?)(?=\s+\b(?:so|that|which|while|but)\b|[.;,]|$)/iu,
    /\b((?:side\s+by\s+side|in\s+front\s+of|above|below|behind|inside|outside|around|between|through|under|over|on)\s+.+?)(?=\s+\b(?:so|that|which|while|but)\b|[.;,]|$)/iu,
  ]);
}

function extractMustAvoid(statement: string): string {
  return firstBoundedMatch(statement, [
    /\b((?:must\s+not|should\s+not|without|avoid|never|no\s+conventional|does\s+not|do\s+not)\b[^.;]*)/iu,
  ]);
}

function extractAuthoredFacts(statement: string): ExtractedAuthoredFact[] {
  const candidates: ExtractedAuthoredFact[] = [
    { category: "overall-form", value: extractOverallForm(statement) },
    { category: "purpose-use", value: extractPurpose(statement) },
    { category: "major-parts", value: extractMajorParts(statement) },
    { category: "spatial-relationship", value: extractSpatialRelationship(statement) },
    { category: "must-avoid", value: extractMustAvoid(statement) },
  ];
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const normalized = normalize(candidate.value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const relationshipCategories = new Set<HomeKnowledgeCategory>([
  "spatial-relationship",
  "operating-relationship",
]);

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function bounded(value: string, maximum = 700): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maximum);
}

function descriptionStatements(description: string): string[] {
  return description
    .split(/(?<=[.!?])\s+|\n+/)
    .map((statement) => bounded(statement))
    .filter(Boolean);
}

function isKnowledgeEvent(event: ProjectTimelineEvent): event is ProjectTimelineEvent & {
  homeUnderstanding: { kind: "knowledge"; knowledge: HomeKnowledgeRecord };
} {
  return event.homeUnderstanding?.kind === "knowledge";
}

function isQuestionEvent(event: ProjectTimelineEvent): event is ProjectTimelineEvent & {
  homeUnderstanding: { kind: "question"; question: HomeUnderstandingQuestionRecord };
} {
  return event.homeUnderstanding?.kind === "question";
}

function event(
  project: Project,
  type: ProjectTimelineEvent["type"],
  title: string,
  description: string,
  homeUnderstanding: HomeUnderstandingTimelineMetadata,
  factory: HomeUnderstandingEventFactory
): ProjectTimelineEvent {
  return {
    id: factory.nextId(),
    type,
    title,
    description,
    createdAt: factory.now,
    homeUnderstanding,
  };
}

function withEvents(project: Project, additions: ProjectTimelineEvent[], now: string): Project {
  if (!additions.length) return project;
  return {
    ...project,
    timeline: [...project.timeline, ...additions],
    updatedAt: now,
  };
}

function sourceEventIds(project: Project): Set<string> {
  return new Set(project.timeline.map((entry) => entry.id));
}

export function deriveActiveHomeKnowledge(project: Project): ActiveHomeKnowledge[] {
  const records = project.timeline
    .filter(isKnowledgeEvent)
    .map((entry) => ({ eventId: entry.id, ...entry.homeUnderstanding.knowledge }));
  const superseded = new Set(records.map((record) => record.supersedesEventId).filter(Boolean));
  return records.filter((record) => !superseded.has(record.eventId));
}

export function deriveBlockingHomeConflicts(project: Project): string[] {
  const byQuestion = new Map<string, ActiveHomeKnowledge[]>();
  for (const record of deriveActiveHomeKnowledge(project)) {
    if (record.authority === "derived-support" || !record.questionEventId) continue;
    const key = `${record.category}:${record.questionEventId}`;
    const current = byQuestion.get(key) ?? [];
    current.push(record);
    byQuestion.set(key, current);
  }

  const conflicts: string[] = [];
  for (const records of byQuestion.values()) {
    const values = new Set(records.map((record) => normalize(record.value)));
    if (values.size > 1) conflicts.push(...records.map((record) => record.eventId));
  }
  return conflicts;
}

export function deriveHomeEvidenceCoverage(project: Project): HomeEvidenceCoverage {
  const active = deriveActiveHomeKnowledge(project);
  const authored = active.filter((record) => record.authority === "inventor-authored" || record.authority === "rev-recommended");
  const has = (category: HomeKnowledgeCategory) => authored.some((record) => record.category === category);
  const conflicts = deriveBlockingHomeConflicts(project);
  const completedStages: HomeUnderstandingStage[] = ["IDEA CAPTURED"];

  if (has("overall-form")) completedStages.push("FORM UNDERSTOOD");
  if (has("overall-form") && has("major-parts")) completedStages.push("KEY PARTS UNDERSTOOD");
  if (
    has("overall-form") &&
    has("major-parts") &&
    authored.some((record) => relationshipCategories.has(record.category))
  ) {
    completedStages.push("RELATIONSHIPS UNDERSTOOD");
  }
  const ready = completedStages.includes("RELATIONSHIPS UNDERSTOOD") && has("purpose-use") && conflicts.length === 0;
  if (ready) completedStages.push("READY TO CREATE 3D");

  return {
    completedStages,
    currentStage: completedStages.at(-1) ?? "IDEA CAPTURED",
    ready,
    blockingConflictEventIds: conflicts,
  };
}

export function deriveHomeUnderstandingState(project: Project | null): HomeUnderstandingState {
  if (!project) return "IDEA_ENTRY";
  if (deriveHomeEvidenceCoverage(project).ready) return "READY_TO_CREATE_3D";
  return getActiveHomeQuestion(project) ? "QUESTION_READY" : "REV_ANALYSING";
}

export function createInitialHomeKnowledge(
  project: Project,
  clearedReferenceSummaries: Array<{ sourceReference: string; value: string }>,
  factory: HomeUnderstandingEventFactory
): Project {
  if (project.timeline.some(isKnowledgeEvent)) return project;
  const additions: ProjectTimelineEvent[] = [];
  const seenValues = new Set<string>();

  for (const statement of descriptionStatements(project.originalObservation)) {
    for (const { category, value } of extractAuthoredFacts(statement)) {
      const key = normalize(value);
      if (seenValues.has(key)) continue;
      seenValues.add(key);
      const eventId = factory.nextId();
      additions.push({
        id: eventId,
        type: "home-understanding-knowledge-recorded",
        title: categoryLabels[category],
        description: "Inventor-authored Project information was secured for Home understanding.",
        createdAt: factory.now,
        homeUnderstanding: {
          kind: "knowledge",
          knowledge: {
            version: 1,
            category,
            value,
            sourceKind: "original-description",
            sourceReference: "project.originalObservation",
            authority: "inventor-authored",
            reversibleAssumption: false,
            sequence: project.timeline.length + additions.length,
            createdAt: factory.now,
          },
        },
      });
    }
  }

  for (const reference of clearedReferenceSummaries) {
    const value = bounded(reference.value);
    if (!value || !reference.sourceReference.trim()) continue;
    const eventId = factory.nextId();
    additions.push({
      id: eventId,
      type: "home-understanding-knowledge-recorded",
      title: categoryLabels["reference-evidence"],
      description: "Cleared reference interpretation was retained as derived support, not inventor authority.",
      createdAt: factory.now,
      homeUnderstanding: {
        kind: "knowledge",
        knowledge: {
          version: 1,
          category: "reference-evidence",
          value,
          sourceKind: "cleared-reference",
          sourceReference: reference.sourceReference.trim(),
          authority: "derived-support",
          reversibleAssumption: false,
          sequence: project.timeline.length + additions.length,
          createdAt: factory.now,
        },
      },
    });
  }
  return withEvents(project, additions, factory.now);
}

function questionForCategory(project: Project, category: HomeKnowledgeCategory): Omit<HomeUnderstandingQuestionRecord, "sequence" | "createdAt"> {
  const active = deriveActiveHomeKnowledge(project);
  const activeIds = active.map((record) => record.eventId);
  if (category === "purpose-use") return {
    version: 1,
    targetCategory: category,
    prompt: "What should this invention help someone do?",
    choices: [],
  };
  if (category === "overall-form") return {
    version: 1,
    targetCategory: category,
    prompt: "What overall physical form should REV develop first?",
    choices: [
      { id: "worn-carried", label: "WORN OR CARRIED", value: "A form worn or carried by the user." },
      { id: "freestanding", label: "FREESTANDING", value: "A freestanding physical form." },
      { id: "mounted", label: "MOUNTED OR ATTACHED", value: "A form mounted or attached to another surface or object." },
      { id: "enclosed", label: "ENCLOSED OR HOUSED", value: "An enclosed or housed physical form." },
    ],
  };
  if (category === "major-parts") {
    const form = active.find((record) => record.category === "overall-form");
    return {
      version: 1,
      targetCategory: category,
      prompt: "Which main parts must REV show in the first 3D concept?",
      choices: [],
      ...(form ? {
        recommendation: {
          label: "I'M NOT SURE / LET REV RECOMMEND" as const,
          value: "Use one main body and only the explicitly described attachments for the first 3D concept.",
          supportingSourceIds: [form.eventId],
        },
      } : {}),
    };
  }
  const parts = active.find((record) => record.category === "major-parts");
  return {
    version: 1,
    targetCategory: "spatial-relationship",
    prompt: "How should those main parts connect or sit in relation to each other?",
    choices: [
      { id: "fixed", label: "FIXED TOGETHER", value: "Keep the described main parts fixed together." },
      { id: "moving", label: "MOVES OR ADJUSTS", value: "Allow the described main parts to move or adjust in relation to each other." },
      { id: "removable", label: "REMOVABLE", value: "Make the described attachment removable from the main body." },
    ],
    ...(parts ? {
      recommendation: {
        label: "I'M NOT SURE / LET REV RECOMMEND" as const,
        value: "Keep the first 3D concept fixed, with no unrequested moving relationship.",
        supportingSourceIds: [parts.eventId, ...activeIds.filter((id) => id !== parts.eventId).slice(0, 1)],
      },
    } : {}),
  };
}

export function selectSmallestMissingHomeCategory(project: Project): HomeKnowledgeCategory | null {
  const coverage = deriveHomeEvidenceCoverage(project);
  if (coverage.blockingConflictEventIds.length) {
    const first = deriveActiveHomeKnowledge(project).find((record) => coverage.blockingConflictEventIds.includes(record.eventId));
    return first?.category ?? null;
  }
  const active = deriveActiveHomeKnowledge(project);
  const has = (category: HomeKnowledgeCategory) => active.some((record) => record.category === category && record.authority !== "derived-support");
  if (!has("purpose-use")) return "purpose-use";
  if (!has("overall-form")) return "overall-form";
  if (!has("major-parts")) return "major-parts";
  if (!active.some((record) => relationshipCategories.has(record.category) && record.authority !== "derived-support")) return "spatial-relationship";
  return null;
}

export function getActiveHomeQuestion(project: Project): ActiveHomeQuestion | null {
  const answeredQuestionIds = new Set(
    deriveActiveHomeKnowledge(project).map((record) => record.questionEventId).filter(Boolean)
  );
  const questions = project.timeline.filter(isQuestionEvent);
  const active = questions.findLast((entry) => !answeredQuestionIds.has(entry.id));
  return active ? { eventId: active.id, ...active.homeUnderstanding.question } : null;
}

export function ensureHomeUnderstandingQuestion(project: Project, factory: HomeUnderstandingEventFactory): Project {
  if (deriveHomeEvidenceCoverage(project).ready || getActiveHomeQuestion(project)) return project;
  const category = selectSmallestMissingHomeCategory(project);
  if (!category) return project;
  const question = questionForCategory(project, category);
  const addition = event(
    project,
    "home-understanding-question-recorded",
    "REV asked one useful question",
    "One bounded Home understanding question was persisted for deliberate inventor input.",
    {
      kind: "question",
      question: {
        ...question,
        sequence: project.timeline.length,
        createdAt: factory.now,
      },
    },
    factory
  );
  return withEvents(project, [addition], factory.now);
}

export function recordHomeUnderstandingAnswer(
  project: Project,
  questionEventId: string,
  input: HomeAnswerInput,
  factory: HomeUnderstandingEventFactory
): HomeAnswerResult {
  const question = getActiveHomeQuestion(project);
  if (!question || question.eventId !== questionEventId) {
    return { kind: "invalid", message: "That question is not active for this Project." };
  }

  let value = "";
  let sourceKind: HomeKnowledgeSourceKind = "inventor-answer";
  let authority: HomeKnowledgeAuthority = "inventor-authored";
  let reversibleAssumption = false;
  let supportingSourceIds: string[] | undefined;

  if (input.kind === "choice") {
    value = question.choices.find((choice) => choice.id === input.choiceId)?.value ?? "";
  } else if (input.kind === "own-words") {
    if (input.value.trim().length > 700) {
      return { kind: "invalid", message: "Keep this answer concise so REV can use it safely." };
    }
    value = bounded(input.value);
  } else if (question.recommendation) {
    value = question.recommendation.value;
    sourceKind = "rev-recommendation";
    authority = "rev-recommended";
    reversibleAssumption = true;
    supportingSourceIds = question.recommendation.supportingSourceIds;
  }

  if (!value) return { kind: "invalid", message: "Add one useful answer before REV records it." };
  const active = deriveActiveHomeKnowledge(project);
  const duplicate = active.some((record) => record.category === question.targetCategory && normalize(record.value) === normalize(value));
  if (duplicate) return { kind: "duplicate", message: "REV already has that Project information." };

  const supersedesEventId = input.supersedesEventId;
  if (supersedesEventId) {
    const target = active.find((record) => record.eventId === supersedesEventId);
    if (!target || target.category !== question.targetCategory) {
      return { kind: "invalid", message: "That correction does not match the active Project information." };
    }
  }
  if (supportingSourceIds?.some((id) => !sourceEventIds(project).has(id))) {
    return { kind: "invalid", message: "REV cannot support that recommendation from this Project." };
  }

  const knowledgeEventId = factory.nextId();
  const addition: ProjectTimelineEvent = {
    id: knowledgeEventId,
    type: "home-understanding-knowledge-recorded",
    title: categoryLabels[question.targetCategory],
    description: reversibleAssumption
      ? "A reversible REV working assumption was secured with cited Project support."
      : "An inventor answer was secured for Home understanding.",
    createdAt: factory.now,
    homeUnderstanding: {
      kind: "knowledge",
      knowledge: {
        version: 1,
        category: question.targetCategory,
        value,
        sourceKind,
        sourceReference: reversibleAssumption ? `timeline.${question.eventId}.recommendation` : `timeline.${question.eventId}.answer`,
        authority,
        reversibleAssumption,
        questionEventId: question.eventId,
        ...(supersedesEventId ? { supersedesEventId } : {}),
        ...(supportingSourceIds ? { supportingSourceIds } : {}),
        sequence: project.timeline.length,
        createdAt: factory.now,
      },
    },
  };
  return { kind: "recorded", project: withEvents(project, [addition], factory.now), knowledgeEventId };
}

export function getPulseEligibleKnowledge(project: Project): ActiveHomeKnowledge | null {
  const claimed = new Set(
    project.timeline
      .filter((entry) => entry.homeUnderstanding?.kind === "presentation-claim")
      .map((entry) => entry.homeUnderstanding?.kind === "presentation-claim" ? entry.homeUnderstanding.claim.knowledgeEventId : "")
  );
  return deriveActiveHomeKnowledge(project).findLast((record) =>
    (record.sourceKind === "inventor-answer" || record.sourceKind === "rev-recommendation") && !claimed.has(record.eventId)
  ) ?? null;
}

export function claimHomeKnowledgePresentation(
  project: Project,
  knowledgeEventId: string,
  factory: HomeUnderstandingEventFactory
): Project {
  const eligible = getPulseEligibleKnowledge(project);
  if (!eligible || eligible.eventId !== knowledgeEventId) return project;
  const addition = event(
    project,
    "home-understanding-presentation-claimed",
    "Knowledge presentation claimed",
    "The persisted Home knowledge event was claimed once for truthful presentation.",
    {
      kind: "presentation-claim",
      claim: {
        version: 1,
        knowledgeEventId,
        sequence: project.timeline.length,
        createdAt: factory.now,
      },
    },
    factory
  );
  return withEvents(project, [addition], factory.now);
}

export function normalizeHomeUnderstandingMetadata(value: unknown): HomeUnderstandingTimelineMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metadata = value as Record<string, unknown>;
  if (metadata.kind === "knowledge") {
    const knowledge = metadata.knowledge as Partial<HomeKnowledgeRecord> | undefined;
    if (!knowledge || knowledge.version !== 1 || !isHomeKnowledgeCategory(knowledge.category) ||
      typeof knowledge.value !== "string" || !knowledge.value.trim() || knowledge.value.length > 700 || !isSourceKind(knowledge.sourceKind) ||
      typeof knowledge.sourceReference !== "string" || !knowledge.sourceReference.trim() || knowledge.sourceReference.length > 300 || !isAuthority(knowledge.authority) ||
      typeof knowledge.reversibleAssumption !== "boolean" || !Number.isInteger(knowledge.sequence) || (knowledge.sequence ?? -1) < 0 ||
      typeof knowledge.createdAt !== "string") return null;
    return {
      kind: "knowledge",
      knowledge: {
        version: 1,
        category: knowledge.category,
        value: bounded(knowledge.value),
        sourceKind: knowledge.sourceKind,
        sourceReference: knowledge.sourceReference,
        authority: knowledge.authority,
        reversibleAssumption: knowledge.reversibleAssumption,
        ...(typeof knowledge.questionEventId === "string" ? { questionEventId: knowledge.questionEventId } : {}),
        ...(typeof knowledge.supersedesEventId === "string" ? { supersedesEventId: knowledge.supersedesEventId } : {}),
        ...(Array.isArray(knowledge.supportingSourceIds) && knowledge.supportingSourceIds.every((id) => typeof id === "string")
          ? { supportingSourceIds: [...knowledge.supportingSourceIds] } : {}),
        sequence: knowledge.sequence as number,
        createdAt: knowledge.createdAt,
      },
    };
  }
  if (metadata.kind === "question") {
    const question = metadata.question as Partial<HomeUnderstandingQuestionRecord> | undefined;
    if (!question || question.version !== 1 || !isHomeKnowledgeCategory(question.targetCategory) ||
      typeof question.prompt !== "string" || !question.prompt.trim() || question.prompt.length > 300 || !Array.isArray(question.choices) ||
      question.choices.length > 4 || !question.choices.every(isChoice) || !Number.isInteger(question.sequence) ||
      (question.sequence ?? -1) < 0 || typeof question.createdAt !== "string") return null;
    const recommendation = question.recommendation;
    if (recommendation && (recommendation.label !== "I'M NOT SURE / LET REV RECOMMEND" ||
      typeof recommendation.value !== "string" || recommendation.value.length > 700 ||
      !Array.isArray(recommendation.supportingSourceIds) || recommendation.supportingSourceIds.length > 8 ||
      !recommendation.supportingSourceIds.every((id) => typeof id === "string" && id.length <= 200))) return null;
    return {
      kind: "question",
      question: {
        version: 1,
        targetCategory: question.targetCategory,
        prompt: question.prompt.trim(),
        choices: question.choices.map((choice) => ({ id: choice.id, label: choice.label, value: choice.value })),
        ...(recommendation ? { recommendation: { label: recommendation.label, value: recommendation.value, supportingSourceIds: [...recommendation.supportingSourceIds] } } : {}),
        sequence: question.sequence as number,
        createdAt: question.createdAt,
      },
    };
  }
  if (metadata.kind === "presentation-claim") {
    const claim = metadata.claim as Partial<HomePresentationClaim> | undefined;
    if (!claim || claim.version !== 1 || typeof claim.knowledgeEventId !== "string" ||
      claim.knowledgeEventId.length > 200 || !Number.isInteger(claim.sequence) || (claim.sequence ?? -1) < 0 ||
      typeof claim.createdAt !== "string") return null;
    return { kind: "presentation-claim", claim: claim as HomePresentationClaim };
  }
  return null;
}

function isChoice(value: unknown): value is HomeQuestionChoice {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const choice = value as Partial<HomeQuestionChoice>;
  return typeof choice.id === "string" && Boolean(choice.id.trim()) && typeof choice.label === "string" &&
    Boolean(choice.label.trim()) && choice.id.length <= 100 && choice.label.length <= 100 &&
    typeof choice.value === "string" && Boolean(choice.value.trim()) && choice.value.length <= 700;
}

function isHomeKnowledgeCategory(value: unknown): value is HomeKnowledgeCategory {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(categoryLabels, value);
}

function isSourceKind(value: unknown): value is HomeKnowledgeSourceKind {
  return value === "original-description" || value === "inventor-answer" || value === "cleared-reference" || value === "rev-recommendation";
}

function isAuthority(value: unknown): value is HomeKnowledgeAuthority {
  return value === "inventor-authored" || value === "derived-support" || value === "rev-recommended";
}
