export const REV_UNDERSTANDING_CONTRACT_VERSION = 1 as const;
export const REV_UNDERSTANDING_OPERATION_KIND = "home-one-question" as const;
export const REV_UNDERSTANDING_MAX_REQUEST_BYTES = 49_152;
export const REV_UNDERSTANDING_MAX_RESPONSE_BYTES = 16_384;
export const REV_UNDERSTANDING_TIMEOUT_MS = 20_000;
export const REV_UNDERSTANDING_MAX_FACTS = 6;
export const REV_UNDERSTANDING_MAX_FACT_LENGTH = 240;
export const REV_UNDERSTANDING_MAX_SOURCE_REFERENCES = 3;
export const REV_UNDERSTANDING_MAX_QUESTION_LENGTH = 180;
export const REV_UNDERSTANDING_MAX_CHOICES = 3;
export const REV_UNDERSTANDING_MAX_CHOICE_LENGTH = 80;
export const REV_UNDERSTANDING_MAX_RECOMMENDATION_LENGTH = 160;
export const REV_UNDERSTANDING_MAX_CONFLICT_REFERENCES = 6;

export const REV_UNDERSTANDING_CATEGORIES = [
  "purpose-use",
  "overall-form",
  "intended-user",
  "major-parts",
  "spatial-relationship",
  "operating-relationship",
  "size-proportion",
  "interaction-point",
  "constraint",
  "comparison",
  "contrast",
  "must-have",
  "must-avoid",
  "reference-evidence",
] as const;

export type RevUnderstandingCategory = (typeof REV_UNDERSTANDING_CATEGORIES)[number];
export type RevUnderstandingAuthority = "inventor-authored" | "derived-support" | "rev-recommended";
export type RevUnderstandingSourceKind =
  | "original-description"
  | "inventor-answer"
  | "cleared-reference"
  | "rev-recommendation"
  | "semantic-derivation";

export type RevUnderstandingKnowledgeInput = {
  eventId: string;
  category: RevUnderstandingCategory;
  value: string;
  sourceKind: RevUnderstandingSourceKind;
  sourceReference: string;
  authority: RevUnderstandingAuthority;
  reversibleAssumption: boolean;
  questionEventId?: string;
  supersedesEventId?: string;
  supportingSourceIds: string[];
};

export type RevUnderstandingPreviousQuestion = {
  eventId: string;
  targetCategory: RevUnderstandingCategory;
  answered: boolean;
};

export type RevUnderstandingBasisInput = {
  originalDescription: string;
  originIntent: "developing" | "evaluating" | "both" | null;
  activeKnowledge: RevUnderstandingKnowledgeInput[];
  blockingConflictEventIds: string[];
};

export type RevUnderstandingRequest = {
  version: typeof REV_UNDERSTANDING_CONTRACT_VERSION;
  operationId: string;
  operationKind: typeof REV_UNDERSTANDING_OPERATION_KIND;
  operationKey: string;
  projectId: string;
  knowledgeBasisRevision: string;
  acceptedBindingDigest: string;
  originalDescriptionSource: {
    id: "project.originalObservation";
    text: string;
  };
  originIntent: "developing" | "evaluating" | "both" | null;
  activeKnowledge: RevUnderstandingKnowledgeInput[];
  unresolvedConflictEventIds: string[];
  meterCoverage: {
    completedStages: string[];
    ready: boolean;
  };
  previousQuestions: RevUnderstandingPreviousQuestion[];
  mustHaves: string[];
  mustAvoids: string[];
  reversibleAssumptions: string[];
  permittedTargetCategories: RevUnderstandingCategory[];
};

export type RevUnderstandingProposedFact = {
  resultClass: "verified-explicit-derivation";
  category: RevUnderstandingCategory;
  value: string;
  sourceIds: string[];
};

export type RevUnderstandingProposal = {
  resultClass: "interpretive-proposal";
  proposalId: string;
  targetCategory: RevUnderstandingCategory;
  proposalText: string;
  basisSourceIds: string[];
  questionKind: "confirm-interpretation";
};

export type RevUnderstandingRawResult = {
  version: typeof REV_UNDERSTANDING_CONTRACT_VERSION;
  proposedFacts: RevUnderstandingProposedFact[];
  proposal?: RevUnderstandingProposal;
  unresolvedConflictEventIds: string[];
};

export type RevUnderstandingQuestion = {
  targetCategory: RevUnderstandingCategory;
  prompt: string;
  choices: Array<{ id: string; label: string; value: string }>;
  proposal?: RevUnderstandingProposal;
};

export type RevUnderstandingAccounting = {
  deliberateRouteRequests: number;
  mockExecutions: number;
  externalProviderAttempts: number;
  acceptedExplicitDerivations: number;
  interpretiveProposals: number;
  persistedQuestions: number;
  fallbackPresentations: number;
};

export type RevUnderstandingErrorCategory =
  | "disabled"
  | "invalid-request"
  | "origin-rejected"
  | "malformed-response"
  | "oversized-response"
  | "unsafe-response"
  | "repeated-question"
  | "unsupported-source"
  | "timeout"
  | "unavailable"
  | "stale"
  | "duplicate";

export type RevUnderstandingApiResponse =
  | {
      status: "completed";
      operationId: string;
      operationKey: string;
      projectId: string;
      knowledgeBasisRevision: string;
      acceptedDerivations: RevUnderstandingProposedFact[];
      question: RevUnderstandingQuestion | null;
      accounting: RevUnderstandingAccounting;
    }
  | {
      status: "fallback" | "disabled";
      operationId?: string;
      operationKey?: string;
      projectId?: string;
      knowledgeBasisRevision?: string;
      message: "REV is continuing with the information already secured.";
      errorCategory: RevUnderstandingErrorCategory;
      accounting: RevUnderstandingAccounting;
    };

const REQUEST_KEYS = [
  "version", "operationId", "operationKind", "operationKey", "projectId",
  "knowledgeBasisRevision", "acceptedBindingDigest", "originalDescriptionSource",
  "originIntent", "activeKnowledge", "unresolvedConflictEventIds", "meterCoverage",
  "previousQuestions", "mustHaves", "mustAvoids", "reversibleAssumptions",
  "permittedTargetCategories",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.trim().length > 0);
}

function isStringArray(value: unknown, maximumItems: number, maximumLength: number): value is string[] {
  return Array.isArray(value) && value.length <= maximumItems && value.every((item) => isBoundedString(item, maximumLength));
}

export function isRevUnderstandingCategory(value: unknown): value is RevUnderstandingCategory {
  return typeof value === "string" && (REV_UNDERSTANDING_CATEGORIES as readonly string[]).includes(value);
}

function parseKnowledge(value: unknown): RevUnderstandingKnowledgeInput | null {
  if (!isPlainObject(value)) return null;
  const allowed = ["eventId", "category", "value", "sourceKind", "sourceReference", "authority", "reversibleAssumption", "questionEventId", "supersedesEventId", "supportingSourceIds"];
  if (Object.keys(value).some((key) => !allowed.includes(key))) return null;
  if (!isBoundedString(value.eventId, 200) || !isRevUnderstandingCategory(value.category) ||
    !isBoundedString(value.value, 700) || !isBoundedString(value.sourceReference, 300) ||
    !["original-description", "inventor-answer", "cleared-reference", "rev-recommendation", "semantic-derivation"].includes(String(value.sourceKind)) ||
    !["inventor-authored", "derived-support", "rev-recommended"].includes(String(value.authority)) ||
    typeof value.reversibleAssumption !== "boolean" ||
    (value.questionEventId !== undefined && !isBoundedString(value.questionEventId, 200)) ||
    (value.supersedesEventId !== undefined && !isBoundedString(value.supersedesEventId, 200)) ||
    !isStringArray(value.supportingSourceIds, 12, 200)) return null;
  return value as RevUnderstandingKnowledgeInput;
}

function parsePreviousQuestion(value: unknown): RevUnderstandingPreviousQuestion | null {
  if (!isPlainObject(value) || !hasExactKeys(value, ["eventId", "targetCategory", "answered"]) ||
    !isBoundedString(value.eventId, 200) || !isRevUnderstandingCategory(value.targetCategory) || typeof value.answered !== "boolean") return null;
  return value as RevUnderstandingPreviousQuestion;
}

export function parseRevUnderstandingRequest(value: unknown): RevUnderstandingRequest | null {
  if (!isPlainObject(value) || !hasExactKeys(value, REQUEST_KEYS)) return null;
  if (value.version !== 1 || value.operationKind !== REV_UNDERSTANDING_OPERATION_KIND ||
    !isBoundedString(value.operationId, 120) || !isBoundedString(value.operationKey, 160) ||
    !isBoundedString(value.projectId, 200) || !isBoundedString(value.knowledgeBasisRevision, 160) ||
    !isBoundedString(value.acceptedBindingDigest, 160) ||
    !isPlainObject(value.originalDescriptionSource) ||
    !hasExactKeys(value.originalDescriptionSource, ["id", "text"]) ||
    value.originalDescriptionSource.id !== "project.originalObservation" ||
    !isBoundedString(value.originalDescriptionSource.text, 1_600) ||
    ![null, "developing", "evaluating", "both"].includes(value.originIntent as null | string) ||
    !Array.isArray(value.activeKnowledge) || value.activeKnowledge.length > 48 ||
    !Array.isArray(value.previousQuestions) || value.previousQuestions.length > 24 ||
    !isStringArray(value.unresolvedConflictEventIds, REV_UNDERSTANDING_MAX_CONFLICT_REFERENCES, 200) ||
    !isStringArray(value.mustHaves, 12, 240) || !isStringArray(value.mustAvoids, 12, 240) ||
    !isStringArray(value.reversibleAssumptions, 12, REV_UNDERSTANDING_MAX_RECOMMENDATION_LENGTH) ||
    !Array.isArray(value.permittedTargetCategories) || value.permittedTargetCategories.length > REV_UNDERSTANDING_CATEGORIES.length ||
    !value.permittedTargetCategories.every(isRevUnderstandingCategory) ||
    !isPlainObject(value.meterCoverage) || !hasExactKeys(value.meterCoverage, ["completedStages", "ready"]) ||
    !isStringArray(value.meterCoverage.completedStages, 5, 40) || typeof value.meterCoverage.ready !== "boolean") return null;

  const activeKnowledge = value.activeKnowledge.map(parseKnowledge);
  const previousQuestions = value.previousQuestions.map(parsePreviousQuestion);
  if (activeKnowledge.some((entry) => entry === null) || previousQuestions.some((entry) => entry === null)) return null;
  return { ...value, activeKnowledge, previousQuestions } as RevUnderstandingRequest;
}

function parseProposedFact(value: unknown): RevUnderstandingProposedFact | null {
  if (!isPlainObject(value) || !hasExactKeys(value, ["resultClass", "category", "value", "sourceIds"]) ||
    value.resultClass !== "verified-explicit-derivation" || !isRevUnderstandingCategory(value.category) ||
    !isBoundedString(value.value, REV_UNDERSTANDING_MAX_FACT_LENGTH) ||
    !isStringArray(value.sourceIds, REV_UNDERSTANDING_MAX_SOURCE_REFERENCES, 200) || value.sourceIds.length === 0) return null;
  return value as RevUnderstandingProposedFact;
}

function parseProposal(value: unknown): RevUnderstandingProposal | null {
  if (!isPlainObject(value) || !hasExactKeys(value, ["resultClass", "proposalId", "targetCategory", "proposalText", "basisSourceIds", "questionKind"]) ||
    value.resultClass !== "interpretive-proposal" || value.questionKind !== "confirm-interpretation" ||
    !isBoundedString(value.proposalId, 120) || !isRevUnderstandingCategory(value.targetCategory) ||
    !isBoundedString(value.proposalText, 120) ||
    !isStringArray(value.basisSourceIds, REV_UNDERSTANDING_MAX_SOURCE_REFERENCES, 200) || value.basisSourceIds.length === 0) return null;
  return value as RevUnderstandingProposal;
}

export function parseRevUnderstandingRawResult(value: unknown): RevUnderstandingRawResult | null {
  if (!isPlainObject(value)) return null;
  const allowed = ["version", "proposedFacts", "proposal", "unresolvedConflictEventIds"];
  if (Object.keys(value).some((key) => !allowed.includes(key)) || value.version !== 1 ||
    !Array.isArray(value.proposedFacts) || value.proposedFacts.length > REV_UNDERSTANDING_MAX_FACTS ||
    !isStringArray(value.unresolvedConflictEventIds, REV_UNDERSTANDING_MAX_CONFLICT_REFERENCES, 200)) return null;
  const proposedFacts = value.proposedFacts.map(parseProposedFact);
  if (proposedFacts.some((fact) => fact === null)) return null;
  const proposal = value.proposal === undefined ? undefined : parseProposal(value.proposal);
  if (value.proposal !== undefined && !proposal) return null;
  return { version: 1, proposedFacts: proposedFacts as RevUnderstandingProposedFact[], ...(proposal ? { proposal } : {}), unresolvedConflictEventIds: value.unresolvedConflictEventIds };
}

export function parseRevUnderstandingApiResponse(value: unknown): RevUnderstandingApiResponse | null {
  if (!isPlainObject(value) || !["completed", "fallback", "disabled"].includes(String(value.status)) || !isPlainObject(value.accounting)) return null;
  const accounting = value.accounting as Record<string, unknown>;
  const accountingKeys = ["deliberateRouteRequests", "mockExecutions", "externalProviderAttempts", "acceptedExplicitDerivations", "interpretiveProposals", "persistedQuestions", "fallbackPresentations"];
  if (!hasExactKeys(accounting, accountingKeys) || accountingKeys.some((key) => !Number.isInteger(accounting[key]) || Number(accounting[key]) < 0)) return null;
  if (value.status === "completed") {
    if (!hasExactKeys(value, ["status", "operationId", "operationKey", "projectId", "knowledgeBasisRevision", "acceptedDerivations", "question", "accounting"]) ||
      !isBoundedString(value.operationId, 120) || !isBoundedString(value.operationKey, 160) || !isBoundedString(value.projectId, 200) ||
      !isBoundedString(value.knowledgeBasisRevision, 160) || !Array.isArray(value.acceptedDerivations) || value.acceptedDerivations.length > REV_UNDERSTANDING_MAX_FACTS ||
      value.acceptedDerivations.map(parseProposedFact).some((fact) => fact === null) ||
      !(value.question === null || isValidQuestion(value.question))) return null;
    return value as RevUnderstandingApiResponse;
  }
  const fallbackRequired = ["status", "message", "errorCategory", "accounting"];
  const fallbackOptional = ["operationId", "operationKey", "projectId", "knowledgeBasisRevision"];
  if (Object.keys(value).some((key) => ![...fallbackRequired, ...fallbackOptional].includes(key)) ||
    fallbackRequired.some((key) => !(key in value)) || value.message !== "REV is continuing with the information already secured." ||
    !isRevUnderstandingErrorCategory(value.errorCategory) ||
    (value.operationId !== undefined && !isBoundedString(value.operationId, 120)) ||
    (value.operationKey !== undefined && !isBoundedString(value.operationKey, 160)) ||
    (value.projectId !== undefined && !isBoundedString(value.projectId, 200)) ||
    (value.knowledgeBasisRevision !== undefined && !isBoundedString(value.knowledgeBasisRevision, 160))) return null;
  return value as RevUnderstandingApiResponse;
}

function isRevUnderstandingErrorCategory(value: unknown): value is RevUnderstandingErrorCategory {
  return typeof value === "string" && [
    "disabled", "invalid-request", "origin-rejected", "malformed-response", "oversized-response",
    "unsafe-response", "repeated-question", "unsupported-source", "timeout", "unavailable",
    "stale", "duplicate",
  ].includes(value);
}

function isValidQuestion(value: unknown): value is RevUnderstandingQuestion {
  if (!isPlainObject(value)) return false;
  const allowed = ["targetCategory", "prompt", "choices", "proposal"];
  if (Object.keys(value).some((key) => !allowed.includes(key)) || !isRevUnderstandingCategory(value.targetCategory) ||
    !isBoundedString(value.prompt, REV_UNDERSTANDING_MAX_QUESTION_LENGTH) || !Array.isArray(value.choices) || value.choices.length > REV_UNDERSTANDING_MAX_CHOICES) return false;
  if (!value.choices.every((choice) => isPlainObject(choice) && hasExactKeys(choice, ["id", "label", "value"]) &&
    isBoundedString(choice.id, 80) && isBoundedString(choice.label, REV_UNDERSTANDING_MAX_CHOICE_LENGTH) && isBoundedString(choice.value, REV_UNDERSTANDING_MAX_FACT_LENGTH))) return false;
  return value.proposal === undefined || parseProposal(value.proposal) !== null;
}

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function canonicalKnowledge(records: RevUnderstandingKnowledgeInput[]): RevUnderstandingKnowledgeInput[] {
  return [...records]
    .map((record) => ({ ...record, value: normalized(record.value), sourceReference: normalized(record.sourceReference), supportingSourceIds: [...record.supportingSourceIds].sort() }))
    .sort((left, right) => left.eventId.localeCompare(right.eventId));
}

export function canonicalKnowledgeBasis(input: RevUnderstandingBasisInput): string {
  return JSON.stringify({
    version: "knowledge-basis-v1",
    originalDescription: normalized(input.originalDescription),
    originIntent: input.originIntent,
    activeKnowledge: canonicalKnowledge(input.activeKnowledge),
    blockingConflictEventIds: [...input.blockingConflictEventIds].sort(),
  });
}

function stableDigest(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

export function deriveKnowledgeBasisRevision(input: RevUnderstandingBasisInput): string {
  return `knowledge-basis-v1:${stableDigest(canonicalKnowledgeBasis(input))}`;
}

export function deriveAcceptedBindingDigest(knowledge: RevUnderstandingKnowledgeInput[]): string {
  const bindings = knowledge
    .filter((record) => record.questionEventId && record.authority !== "derived-support")
    .map((record) => `${record.questionEventId}:${record.eventId}`)
    .sort();
  return `accepted-bindings-v1:${stableDigest(JSON.stringify(bindings))}`;
}

export function deriveRevUnderstandingOperationKey(input: {
  projectId: string;
  knowledgeBasisRevision: string;
  acceptedBindingDigest: string;
}): string {
  return `hai2a-v1:${stableDigest(JSON.stringify({ ...input, operationKind: REV_UNDERSTANDING_OPERATION_KIND, contractVersion: 1 }))}`;
}

export function recomputeRequestKnowledgeBasisRevision(request: RevUnderstandingRequest): string {
  return deriveKnowledgeBasisRevision({
    originalDescription: request.originalDescriptionSource.text,
    originIntent: request.originIntent,
    activeKnowledge: request.activeKnowledge,
    blockingConflictEventIds: request.unresolvedConflictEventIds,
  });
}

export function recomputeRequestOperationKey(request: RevUnderstandingRequest): string {
  return deriveRevUnderstandingOperationKey({
    projectId: request.projectId,
    knowledgeBasisRevision: request.knowledgeBasisRevision,
    acceptedBindingDigest: request.acceptedBindingDigest,
  });
}

export function emptyRevUnderstandingAccounting(overrides: Partial<RevUnderstandingAccounting> = {}): RevUnderstandingAccounting {
  return {
    deliberateRouteRequests: 0,
    mockExecutions: 0,
    externalProviderAttempts: 0,
    acceptedExplicitDerivations: 0,
    interpretiveProposals: 0,
    persistedQuestions: 0,
    fallbackPresentations: 0,
    ...overrides,
  };
}
