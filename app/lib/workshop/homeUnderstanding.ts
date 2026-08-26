import type { Project, ProjectTimelineEvent } from "../core/project";
import {
  REV_UNDERSTANDING_CATEGORIES,
  REV_UNDERSTANDING_CONTRACT_VERSION,
  REV_UNDERSTANDING_OPERATION_KIND,
  deriveAcceptedBindingDigest,
  deriveKnowledgeBasisRevision,
  deriveRevUnderstandingOperationKey,
  type RevUnderstandingAccounting,
  type RevUnderstandingApiResponse,
  type RevUnderstandingErrorCategory,
  type RevUnderstandingProposal,
  type RevUnderstandingRequest,
} from "../ai/revUnderstandingTypes";

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

export type HomeKnowledgeCategory = (typeof REV_UNDERSTANDING_CATEGORIES)[number];

export type HomeKnowledgeSourceKind =
  | "original-description"
  | "inventor-answer"
  | "cleared-reference"
  | "rev-recommendation"
  | "semantic-derivation";

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
  interpretiveProposal?: RevUnderstandingProposal;
  sequence: number;
  createdAt: string;
};

export type HomePresentationClaim = {
  version: 1;
  knowledgeEventId: string;
  sequence: number;
  createdAt: string;
};

export type HomeUnderstandingOperationReceipt = {
  version: 1;
  operationId: string;
  operationKey: string;
  knowledgeBasisRevision: string;
  acceptedBindingDigest: string;
  operationKind: typeof REV_UNDERSTANDING_OPERATION_KIND;
  status: "started" | "completed" | "fallback" | "failed" | "stale";
  accounting: RevUnderstandingAccounting;
  errorCategory?: RevUnderstandingErrorCategory;
  createdAt: string;
  completedAt?: string;
};

export type HomeUnderstandingTimelineMetadata =
  | { kind: "knowledge"; knowledge: HomeKnowledgeRecord }
  | { kind: "question"; question: HomeUnderstandingQuestionRecord }
  | { kind: "presentation-claim"; claim: HomePresentationClaim }
  | { kind: "operation-receipt"; receipt: HomeUnderstandingOperationReceipt };

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
  "intended-user": "Intended user",
  "major-parts": "Key parts",
  "spatial-relationship": "Part arrangement",
  "operating-relationship": "Working relationship",
  "size-proportion": "Size and proportion",
  "interaction-point": "Inventor interaction",
  constraint: "Constraint",
  comparison: "Comparison",
  contrast: "Contrast",
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

function revKnowledgeInput(project: Project) {
  return deriveActiveHomeKnowledge(project).map((record) => ({
    eventId: record.eventId,
    category: record.category,
    value: record.value,
    sourceKind: record.sourceKind,
    sourceReference: record.sourceReference,
    authority: record.authority,
    reversibleAssumption: record.reversibleAssumption,
    ...(record.questionEventId ? { questionEventId: record.questionEventId } : {}),
    ...(record.supersedesEventId ? { supersedesEventId: record.supersedesEventId } : {}),
    supportingSourceIds: record.supportingSourceIds ? [...record.supportingSourceIds] : [],
  }));
}

export function deriveHomeKnowledgeBasisRevision(project: Project): string {
  return deriveKnowledgeBasisRevision({
    originalDescription: project.originalObservation,
    originIntent: project.originIntent ?? null,
    activeKnowledge: revKnowledgeInput(project),
    blockingConflictEventIds: deriveBlockingHomeConflicts(project),
  });
}

export function deriveHomeAcceptedBindingDigest(project: Project): string {
  return deriveAcceptedBindingDigest(revKnowledgeInput(project));
}

export function createHomeRevUnderstandingRequest(project: Project, operationId: string): RevUnderstandingRequest {
  const activeKnowledge = revKnowledgeInput(project);
  const knowledgeBasisRevision = deriveHomeKnowledgeBasisRevision(project);
  const acceptedBindingDigest = deriveAcceptedBindingDigest(activeKnowledge);
  const answered = new Set(activeKnowledge.map((record) => record.questionEventId).filter(Boolean));
  const coverage = deriveHomeEvidenceCoverage(project);
  return {
    version: REV_UNDERSTANDING_CONTRACT_VERSION,
    operationId,
    operationKind: REV_UNDERSTANDING_OPERATION_KIND,
    operationKey: deriveRevUnderstandingOperationKey({ projectId: project.id, knowledgeBasisRevision, acceptedBindingDigest }),
    projectId: project.id,
    knowledgeBasisRevision,
    acceptedBindingDigest,
    originalDescriptionSource: { id: "project.originalObservation", text: project.originalObservation },
    originIntent: project.originIntent ?? null,
    activeKnowledge,
    unresolvedConflictEventIds: deriveBlockingHomeConflicts(project),
    meterCoverage: { completedStages: coverage.completedStages, ready: coverage.ready },
    previousQuestions: project.timeline.filter(isQuestionEvent).slice(-24).map((entry) => ({
      eventId: entry.id,
      targetCategory: entry.homeUnderstanding.question.targetCategory,
      answered: answered.has(entry.id),
    })),
    mustHaves: activeKnowledge.filter((record) => record.category === "must-have").map((record) => record.value).slice(0, 12),
    mustAvoids: activeKnowledge.filter((record) => record.category === "must-avoid").map((record) => record.value).slice(0, 12),
    reversibleAssumptions: activeKnowledge.filter((record) => record.reversibleAssumption).map((record) => record.value).slice(0, 12),
    permittedTargetCategories: REV_UNDERSTANDING_CATEGORIES.filter((category) => category !== "reference-evidence"),
  };
}

export function recordHomeUnderstandingOperationStarted(
  project: Project,
  request: RevUnderstandingRequest,
  factory: HomeUnderstandingEventFactory
): { project: Project; receiptEventId: string } {
  if (project.id !== request.projectId || deriveHomeKnowledgeBasisRevision(project) !== request.knowledgeBasisRevision ||
    deriveHomeAcceptedBindingDigest(project) !== request.acceptedBindingDigest) {
    return { project, receiptEventId: "" };
  }
  const receiptEventId = factory.nextId();
  const addition: ProjectTimelineEvent = {
    id: receiptEventId,
    type: "home-understanding-operation-recorded",
    title: "REV understanding operation started",
    description: "A bounded Home understanding operation was recorded without storing inventor content.",
    createdAt: factory.now,
    homeUnderstanding: {
      kind: "operation-receipt",
      receipt: {
        version: 1,
        operationId: request.operationId,
        operationKey: request.operationKey,
        knowledgeBasisRevision: request.knowledgeBasisRevision,
        acceptedBindingDigest: request.acceptedBindingDigest,
        operationKind: REV_UNDERSTANDING_OPERATION_KIND,
        status: "started",
        accounting: {
          deliberateRouteRequests: 0,
          mockExecutions: 0,
          externalProviderAttempts: 0,
          acceptedExplicitDerivations: 0,
          interpretiveProposals: 0,
          persistedQuestions: 0,
          fallbackPresentations: 0,
        },
        createdAt: factory.now,
      },
    },
  };
  return { project: withEvents(project, [addition], factory.now), receiptEventId };
}

export function applyHomeRevUnderstandingResponse(
  project: Project,
  request: RevUnderstandingRequest,
  response: RevUnderstandingApiResponse,
  factory: HomeUnderstandingEventFactory
): { project: Project; questionEventId: string | null } | null {
  if (project.id !== request.projectId || response.status !== "completed" ||
    response.projectId !== request.projectId || response.operationId !== request.operationId ||
    response.operationKey !== request.operationKey || response.knowledgeBasisRevision !== request.knowledgeBasisRevision ||
    deriveHomeKnowledgeBasisRevision(project) !== request.knowledgeBasisRevision || getActiveHomeQuestion(project)) return null;

  const additions: ProjectTimelineEvent[] = [];
  const existingSources = sourceEventIds(project);
  existingSources.add("project.originalObservation");
  const active = deriveActiveHomeKnowledge(project);

  for (const fact of response.acceptedDerivations) {
    if (!fact.sourceIds.every((sourceId) => existingSources.has(sourceId)) ||
      active.some((record) => record.category === fact.category && normalize(record.value) === normalize(fact.value))) continue;
    additions.push({
      id: factory.nextId(),
      type: "home-understanding-knowledge-recorded",
      title: categoryLabels[fact.category],
      description: "A deterministic source-backed derivation was secured as supporting Project knowledge.",
      createdAt: factory.now,
      homeUnderstanding: {
        kind: "knowledge",
        knowledge: {
          version: 1,
          category: fact.category,
          value: bounded(fact.value),
          sourceKind: "semantic-derivation",
          sourceReference: fact.sourceIds[0],
          authority: "derived-support",
          reversibleAssumption: false,
          supportingSourceIds: [...fact.sourceIds],
          sequence: project.timeline.length + additions.length,
          createdAt: factory.now,
        },
      },
    });
  }

  let questionEventId: string | null = null;
  const withDerivations = additions.length ? withEvents(project, additions, factory.now) : project;
  const localCategory = !deriveHomeEvidenceCoverage(withDerivations).ready
    ? selectSmallestMissingHomeCategory(withDerivations)
    : null;
  const questionToPersist = response.question ?? (localCategory ? questionForCategory(withDerivations, localCategory) : null);
  if (questionToPersist && !deriveHomeEvidenceCoverage(withDerivations).ready) {
    questionEventId = factory.nextId();
    additions.push({
      id: questionEventId,
      type: "home-understanding-question-recorded",
      title: "REV asked one useful question",
      description: "One bounded Home understanding question was persisted for deliberate inventor input.",
      createdAt: factory.now,
      homeUnderstanding: {
        kind: "question",
        question: {
          version: 1,
          targetCategory: questionToPersist.targetCategory,
          prompt: questionToPersist.prompt,
          choices: questionToPersist.choices,
          ...("recommendation" in questionToPersist && questionToPersist.recommendation ? { recommendation: questionToPersist.recommendation } : {}),
          ...("proposal" in questionToPersist && questionToPersist.proposal ? { interpretiveProposal: questionToPersist.proposal } : {}),
          sequence: project.timeline.length + additions.length,
          createdAt: factory.now,
        },
      },
    });
  }

  const persistedDerivations = additions.filter((entry) => entry.homeUnderstanding?.kind === "knowledge").length;
  const accounting = {
    ...response.accounting,
    acceptedExplicitDerivations: persistedDerivations,
    persistedQuestions: questionEventId ? 1 : 0,
  };
  additions.push(operationCompletionEvent(project, request, accounting, "completed", factory));
  return { project: withEvents(project, additions, factory.now), questionEventId };
}

export function applyHomeRevUnderstandingFallback(
  project: Project,
  request: RevUnderstandingRequest,
  response: Extract<RevUnderstandingApiResponse, { status: "fallback" | "disabled" }>,
  factory: HomeUnderstandingEventFactory
): Project | null {
  if (project.id !== request.projectId || deriveHomeKnowledgeBasisRevision(project) !== request.knowledgeBasisRevision ||
    (response.projectId !== undefined && response.projectId !== request.projectId) ||
    (response.operationId !== undefined && response.operationId !== request.operationId) ||
    (response.operationKey !== undefined && response.operationKey !== request.operationKey) ||
    (response.knowledgeBasisRevision !== undefined && response.knowledgeBasisRevision !== request.knowledgeBasisRevision)) return null;
  let fallbackProject = project;
  if (!deriveHomeEvidenceCoverage(fallbackProject).ready && !getActiveHomeQuestion(fallbackProject)) {
    fallbackProject = ensureHomeUnderstandingQuestion(fallbackProject, factory);
  }
  const completion = operationCompletionEvent(fallbackProject, request, response.accounting, "fallback", factory, response.errorCategory);
  return withEvents(fallbackProject, [completion], factory.now);
}

export function recordHomeRevUnderstandingStale(
  project: Project,
  request: RevUnderstandingRequest,
  accounting: RevUnderstandingAccounting,
  factory: HomeUnderstandingEventFactory
): Project {
  if (project.id !== request.projectId) return project;
  return withEvents(project, [operationCompletionEvent(project, request, accounting, "stale", factory, "stale")], factory.now);
}

function operationCompletionEvent(
  project: Project,
  request: RevUnderstandingRequest,
  accounting: RevUnderstandingAccounting,
  status: "completed" | "fallback" | "failed" | "stale",
  factory: HomeUnderstandingEventFactory,
  errorCategory?: RevUnderstandingErrorCategory
): ProjectTimelineEvent {
  return {
    id: factory.nextId(),
    type: "home-understanding-operation-recorded",
    title: `REV understanding operation ${status}`,
    description: "A safe Home understanding operation status was recorded without inventor content.",
    createdAt: factory.now,
    homeUnderstanding: {
      kind: "operation-receipt",
      receipt: {
        version: 1,
        operationId: request.operationId,
        operationKey: request.operationKey,
        knowledgeBasisRevision: request.knowledgeBasisRevision,
        acceptedBindingDigest: request.acceptedBindingDigest,
        operationKind: REV_UNDERSTANDING_OPERATION_KIND,
        status,
        accounting,
        ...(errorCategory ? { errorCategory } : {}),
        createdAt: project.timeline.find((entry) => entry.homeUnderstanding?.kind === "operation-receipt" &&
          entry.homeUnderstanding.receipt.operationId === request.operationId)?.createdAt ?? factory.now,
        completedAt: factory.now,
      },
    },
  };
}

export function deriveHomeEvidenceCoverage(project: Project): HomeEvidenceCoverage {
  const active = deriveActiveHomeKnowledge(project);
  const authored = active.filter((record) =>
    record.authority === "inventor-authored" ||
    record.authority === "rev-recommended" ||
    (record.authority === "derived-support" && record.sourceKind === "semantic-derivation")
  );
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
    const proposal = question.interpretiveProposal;
    if (proposal && (!isInterpretiveProposal(proposal) || proposal.targetCategory !== question.targetCategory)) return null;
    return {
      kind: "question",
      question: {
        version: 1,
        targetCategory: question.targetCategory,
        prompt: question.prompt.trim(),
        choices: question.choices.map((choice) => ({ id: choice.id, label: choice.label, value: choice.value })),
        ...(recommendation ? { recommendation: { label: recommendation.label, value: recommendation.value, supportingSourceIds: [...recommendation.supportingSourceIds] } } : {}),
        ...(proposal ? { interpretiveProposal: proposal } : {}),
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
  if (metadata.kind === "operation-receipt") {
    const receipt = metadata.receipt as Partial<HomeUnderstandingOperationReceipt> | undefined;
    if (!receipt || receipt.version !== 1 || typeof receipt.operationId !== "string" || !receipt.operationId.trim() || receipt.operationId.length > 120 ||
      typeof receipt.operationKey !== "string" || !receipt.operationKey.trim() || receipt.operationKey.length > 160 ||
      typeof receipt.knowledgeBasisRevision !== "string" || !receipt.knowledgeBasisRevision.trim() || receipt.knowledgeBasisRevision.length > 160 ||
      typeof receipt.acceptedBindingDigest !== "string" || !receipt.acceptedBindingDigest.trim() || receipt.acceptedBindingDigest.length > 160 ||
      receipt.operationKind !== REV_UNDERSTANDING_OPERATION_KIND || !["started", "completed", "fallback", "failed", "stale"].includes(String(receipt.status)) ||
      !isOperationAccounting(receipt.accounting) || typeof receipt.createdAt !== "string" ||
      (receipt.completedAt !== undefined && typeof receipt.completedAt !== "string") ||
      (receipt.errorCategory !== undefined && !isOperationErrorCategory(receipt.errorCategory))) return null;
    return { kind: "operation-receipt", receipt: receipt as HomeUnderstandingOperationReceipt };
  }
  return null;
}

function isInterpretiveProposal(value: unknown): value is RevUnderstandingProposal {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proposal = value as Partial<RevUnderstandingProposal>;
  return proposal.resultClass === "interpretive-proposal" && proposal.questionKind === "confirm-interpretation" &&
    typeof proposal.proposalId === "string" && proposal.proposalId.length > 0 && proposal.proposalId.length <= 120 &&
    isHomeKnowledgeCategory(proposal.targetCategory) && typeof proposal.proposalText === "string" &&
    proposal.proposalText.length > 0 && proposal.proposalText.length <= 120 && Array.isArray(proposal.basisSourceIds) &&
    proposal.basisSourceIds.length > 0 && proposal.basisSourceIds.length <= 3 &&
    proposal.basisSourceIds.every((id) => typeof id === "string" && id.length > 0 && id.length <= 200);
}

function isOperationAccounting(value: unknown): value is RevUnderstandingAccounting {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const accounting = value as Record<string, unknown>;
  const keys = ["deliberateRouteRequests", "mockExecutions", "externalProviderAttempts", "acceptedExplicitDerivations", "interpretiveProposals", "persistedQuestions", "fallbackPresentations"];
  return Object.keys(accounting).length === keys.length && keys.every((key) => Number.isInteger(accounting[key]) && Number(accounting[key]) >= 0);
}

function isOperationErrorCategory(value: unknown): value is RevUnderstandingErrorCategory {
  return typeof value === "string" && [
    "disabled", "invalid-request", "origin-rejected", "malformed-response", "oversized-response",
    "unsafe-response", "repeated-question", "unsupported-source", "timeout", "unavailable", "stale", "duplicate",
  ].includes(value);
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
  return value === "original-description" || value === "inventor-answer" || value === "cleared-reference" || value === "rev-recommendation" || value === "semantic-derivation";
}

function isAuthority(value: unknown): value is HomeKnowledgeAuthority {
  return value === "inventor-authored" || value === "derived-support" || value === "rev-recommended";
}
