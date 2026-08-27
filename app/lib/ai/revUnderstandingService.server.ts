import "server-only";

import {
  REV_UNDERSTANDING_MAX_RESPONSE_BYTES,
  REV_UNDERSTANDING_TIMEOUT_MS,
  emptyRevUnderstandingAccounting,
  parseRevUnderstandingRawResult,
  type RevUnderstandingApiResponse,
  type RevUnderstandingCategory,
  type RevUnderstandingErrorCategory,
  type RevUnderstandingProposedFact,
  type RevUnderstandingProposal,
  type RevUnderstandingQuestion,
  type RevUnderstandingRawResult,
  type RevUnderstandingRequest,
} from "./revUnderstandingTypes";
import {
  OpenAIRevUnderstandingProviderError,
  prepareOpenAIRevUnderstandingOperation,
  type OpenAIRevUnderstandingEvidence,
  type PreparedOpenAIRevUnderstandingOperation,
} from "./providers/openaiRevUnderstandingProvider.server";

export type RevUnderstandingFeatureGate = "disabled" | "mock" | "founder-live-test" | "production";
export type RevUnderstandingMockExecutor = (request: RevUnderstandingRequest) => Promise<unknown>;
export type RevUnderstandingProviderPreparer = (
  request: RevUnderstandingRequest,
) => PreparedOpenAIRevUnderstandingOperation;
export type RevUnderstandingLiveEvidence = OpenAIRevUnderstandingEvidence & {
  liveBudgetConsumed: boolean;
};

type RegistryEntry = {
  routeRequests: number;
  promise: Promise<RevUnderstandingApiResponse>;
};

const registry = new Map<string, RegistryEntry>();
const MAX_PROCESS_LOCAL_OPERATIONS = 128;
let testExecutor: RevUnderstandingMockExecutor | null = null;
let testTimeoutMilliseconds: number | null = null;
let testProviderPreparer: RevUnderstandingProviderPreparer | null = null;
let testEvidenceSink: ((evidence: RevUnderstandingLiveEvidence) => void) | null = null;

type LiveAttemptState =
  | { status: "unused" }
  | {
      status: "in-flight" | "consumed";
      operationKey: string;
      routeRequests: number;
      promise: Promise<RevUnderstandingApiResponse>;
      evidence?: RevUnderstandingLiveEvidence;
    };

declare global {
  // A single development-server process owns one founder-authorized live attempt.
  // The global survives Next development module reloads; it is not distributed production enforcement.
  var __REAIDEA_HAI2B_LIVE_ATTEMPT_V1__: LiveAttemptState | undefined;
}

const FALLBACK_MESSAGE = "REV is continuing with the information already secured." as const;

export function resolveRevUnderstandingFeatureGate(): RevUnderstandingFeatureGate {
  const configured = process.env.REAIDEA_HAI2_MODE;
  if (configured === "mock" && process.env.NODE_ENV !== "production") return "mock";
  if (configured === "founder-live-test") return "founder-live-test";
  if (configured === "production") return "production";
  return "disabled";
}

export function setRevUnderstandingMockExecutorForTests(executor: RevUnderstandingMockExecutor | null): void {
  testExecutor = executor;
}

export function setRevUnderstandingTimeoutForTests(milliseconds: number | null): void {
  testTimeoutMilliseconds = milliseconds;
}

export function setRevUnderstandingProviderPreparerForTests(
  preparer: RevUnderstandingProviderPreparer | null,
): void {
  testProviderPreparer = preparer;
}

export function setRevUnderstandingEvidenceSinkForTests(
  sink: ((evidence: RevUnderstandingLiveEvidence) => void) | null,
): void {
  testEvidenceSink = sink;
}

export function resetRevUnderstandingLiveAttemptBudgetForTests(): void {
  globalThis.__REAIDEA_HAI2B_LIVE_ATTEMPT_V1__ = { status: "unused" };
}

export function getRevUnderstandingLiveAttemptStateForTests(): Readonly<{
  status: LiveAttemptState["status"];
  operationKey?: string;
  routeRequests?: number;
  evidence?: RevUnderstandingLiveEvidence;
}> {
  const state = liveAttemptState();
  return state.status === "unused"
    ? { status: state.status }
    : {
        status: state.status,
        operationKey: state.operationKey,
        routeRequests: state.routeRequests,
        ...(state.evidence ? { evidence: state.evidence } : {}),
      };
}

export function resetRevUnderstandingOperationRegistryForTests(): void {
  registry.clear();
  testExecutor = null;
  testTimeoutMilliseconds = null;
  testProviderPreparer = null;
  testEvidenceSink = null;
}

export async function runRevUnderstandingOperation(
  request: RevUnderstandingRequest,
  gate = resolveRevUnderstandingFeatureGate()
): Promise<RevUnderstandingApiResponse> {
  if (gate === "founder-live-test") return runFounderLiveOperation(request);
  if (gate !== "mock") return fallback(request, "disabled", "disabled", 0, 0);

  const current = registry.get(request.operationKey);
  if (current) {
    current.routeRequests += 1;
    const response = await current.promise;
    return {
      ...response,
      accounting: { ...response.accounting, deliberateRouteRequests: current.routeRequests },
    };
  }

  const entry: RegistryEntry = {
    routeRequests: 1,
    promise: executeMockOperation(request),
  };
  if (registry.size >= MAX_PROCESS_LOCAL_OPERATIONS) {
    const oldest = registry.keys().next().value as string | undefined;
    if (oldest) registry.delete(oldest);
  }
  registry.set(request.operationKey, entry);
  return entry.promise;
}

async function executeMockOperation(request: RevUnderstandingRequest): Promise<RevUnderstandingApiResponse> {
  const executor = testExecutor ?? networklessMockExecutor;
  let raw: unknown;
  try {
    raw = await withTimeout(executor(request), testTimeoutMilliseconds ?? REV_UNDERSTANDING_TIMEOUT_MS);
  } catch (error) {
    return fallback(request, error instanceof TimeoutError ? "timeout" : "unavailable", "fallback", 1, 0);
  }

  let serialized = "";
  try {
    serialized = JSON.stringify(raw);
  } catch {
    return fallback(request, "malformed-response", "fallback", 1, 0);
  }
  if (new TextEncoder().encode(serialized).byteLength > REV_UNDERSTANDING_MAX_RESPONSE_BYTES) {
    return fallback(request, "oversized-response", "fallback", 1, 0);
  }

  const parsed = parseRevUnderstandingRawResult(raw);
  if (!parsed) return fallback(request, "malformed-response", "fallback", 1, 0);
  return applySemanticAuthority(request, parsed, 1, 0);
}

async function runFounderLiveOperation(request: RevUnderstandingRequest): Promise<RevUnderstandingApiResponse> {
  const current = liveAttemptState();
  if (current.status !== "unused") {
    if (current.status === "in-flight" && current.operationKey === request.operationKey) {
      current.routeRequests += 1;
      const response = await current.promise;
      return {
        ...response,
        accounting: { ...response.accounting, deliberateRouteRequests: current.routeRequests },
      };
    }
    return fallback(request, "duplicate", "fallback", 0, 0);
  }

  let prepared: PreparedOpenAIRevUnderstandingOperation;
  try {
    prepared = (testProviderPreparer ?? prepareOpenAIRevUnderstandingOperation)(request);
  } catch (error) {
    if (error instanceof OpenAIRevUnderstandingProviderError) {
      emitLiveEvidence({ ...error.evidence, liveBudgetConsumed: false });
      return fallback(request, publicErrorCategory(error), "fallback", 0, 0);
    }
    return fallback(request, "unavailable", "fallback", 0, 0);
  }

  let resolveOperation!: (response: RevUnderstandingApiResponse) => void;
  const promise = new Promise<RevUnderstandingApiResponse>((resolve) => {
    resolveOperation = resolve;
  });
  globalThis.__REAIDEA_HAI2B_LIVE_ATTEMPT_V1__ = {
    status: "in-flight",
    operationKey: request.operationKey,
    routeRequests: 1,
    promise,
  };

  void executeFounderLiveOperation(request, prepared, promise).then(resolveOperation);
  return promise;
}

async function executeFounderLiveOperation(
  request: RevUnderstandingRequest,
  prepared: PreparedOpenAIRevUnderstandingOperation,
  promise: Promise<RevUnderstandingApiResponse>,
): Promise<RevUnderstandingApiResponse> {
  let response: RevUnderstandingApiResponse;
  let evidence: RevUnderstandingLiveEvidence | undefined;
  try {
    const completed = await prepared.execute();
    evidence = { ...completed.evidence, liveBudgetConsumed: true };
    emitLiveEvidence(evidence);
    response = applySemanticAuthority(
      request,
      completed.result,
      0,
      completed.evidence.externalProviderAttempts,
    );
  } catch (error) {
    if (error instanceof OpenAIRevUnderstandingProviderError) {
      evidence = { ...error.evidence, liveBudgetConsumed: true };
      emitLiveEvidence(evidence);
      response = fallback(
        request,
        publicErrorCategory(error),
        "fallback",
        0,
        error.evidence.externalProviderAttempts,
      );
    } else {
      response = fallback(request, "unavailable", "fallback", 0, 0);
    }
  }
  const state = liveAttemptState();
  globalThis.__REAIDEA_HAI2B_LIVE_ATTEMPT_V1__ = {
    status: "consumed",
    operationKey: request.operationKey,
    routeRequests: state.status === "unused" ? 1 : state.routeRequests,
    promise,
    ...(evidence ? { evidence } : {}),
  };
  return response;
}

function applySemanticAuthority(
  request: RevUnderstandingRequest,
  parsed: RevUnderstandingRawResult,
  mockExecutions: number,
  externalProviderAttempts: number,
): RevUnderstandingApiResponse {

  const sourceMap = sourceTextById(request);
  const accepted: RevUnderstandingProposedFact[] = [];
  let demotedProposal: RevUnderstandingProposal | null = null;

  for (const fact of parsed.proposedFacts) {
    if (!referencesClose(fact.sourceIds, sourceMap) || !request.permittedTargetCategories.includes(fact.category)) continue;
    if (conflictsWithInventorAuthority(fact, request)) {
      demotedProposal ??= proposalFromFact(fact, request.operationId);
      continue;
    }
    if (!fact.sourceIds.some((sourceId) => deterministicallySupports(fact, sourceId, sourceMap, request))) {
      demotedProposal ??= proposalFromFact(fact, request.operationId);
      continue;
    }
    const duplicate = request.activeKnowledge.some((record) => record.category === fact.category && normalize(record.value) === normalize(fact.value)) ||
      accepted.some((record) => record.category === fact.category && normalize(record.value) === normalize(fact.value));
    if (!duplicate) accepted.push(fact);
  }

  const conflictQuestion = buildConflictQuestion(request);
  const candidateProposal = parsed.proposal ?? demotedProposal;
  if (!conflictQuestion && candidateProposal && repeatedCategory(candidateProposal.targetCategory, request)) {
    return fallback(request, "repeated-question", "fallback", mockExecutions, externalProviderAttempts);
  }
  if (!conflictQuestion && candidateProposal && unsafeProposal(candidateProposal.proposalText)) {
    return fallback(request, "unsafe-response", "fallback", mockExecutions, externalProviderAttempts);
  }
  if (!conflictQuestion && candidateProposal && !referencesClose(candidateProposal.basisSourceIds, sourceMap)) {
    return fallback(request, "unsupported-source", "fallback", mockExecutions, externalProviderAttempts);
  }
  const proposalQuestion = !conflictQuestion && candidateProposal
    ? buildProposalQuestion(candidateProposal, request, sourceMap)
    : null;

  if (candidateProposal && !conflictQuestion && !proposalQuestion) {
    return fallback(request, "unsafe-response", "fallback", mockExecutions, externalProviderAttempts);
  }

  if (!accepted.length && !conflictQuestion && !proposalQuestion && !request.meterCoverage.ready) {
    return fallback(request, "unsupported-source", "fallback", mockExecutions, externalProviderAttempts);
  }

  return {
    status: "completed",
    operationId: request.operationId,
    operationKey: request.operationKey,
    projectId: request.projectId,
    knowledgeBasisRevision: request.knowledgeBasisRevision,
    acceptedDerivations: accepted,
    question: conflictQuestion ?? proposalQuestion,
    accounting: emptyRevUnderstandingAccounting({
      deliberateRouteRequests: 1,
      mockExecutions,
      externalProviderAttempts,
      acceptedExplicitDerivations: accepted.length,
      interpretiveProposals: proposalQuestion ? 1 : 0,
      persistedQuestions: conflictQuestion || proposalQuestion ? 1 : 0,
    }),
  };
}

async function networklessMockExecutor(request: RevUnderstandingRequest): Promise<RevUnderstandingRawResult> {
  if (resolveNetworklessMockScenario() === "interpretive-proposal") {
    return {
      version: 1,
      proposedFacts: [],
      proposal: {
        resultClass: "interpretive-proposal",
        proposalId: "mock-interpretive-proposal",
        targetCategory: "spatial-relationship",
        proposalText: "a soft seal surrounds each eye separately",
        basisSourceIds: [request.originalDescriptionSource.id],
        questionKind: "confirm-interpretation",
      },
      unresolvedConflictEventIds: [],
    };
  }
  return { version: 1, proposedFacts: [], unresolvedConflictEventIds: [] };
}

function resolveNetworklessMockScenario(): "default" | "interpretive-proposal" {
  if (resolveRevUnderstandingFeatureGate() !== "mock") return "default";
  return process.env.REAIDEA_HAI2_MOCK_SCENARIO === "interpretive-proposal"
    ? "interpretive-proposal"
    : "default";
}

function sourceTextById(request: RevUnderstandingRequest): Map<string, string> {
  const sources = new Map<string, string>([[request.originalDescriptionSource.id, request.originalDescriptionSource.text]]);
  for (const record of request.activeKnowledge) sources.set(record.eventId, record.value);
  return sources;
}

function referencesClose(sourceIds: string[], sources: Map<string, string>): boolean {
  return sourceIds.length > 0 && sourceIds.every((sourceId) => sources.has(sourceId));
}

function deterministicallySupports(
  fact: RevUnderstandingProposedFact,
  sourceId: string,
  sources: Map<string, string>,
  request: RevUnderstandingRequest
): boolean {
  const factValue = normalizeForSupport(fact.value);
  const sourceValue = normalizeForSupport(sources.get(sourceId) ?? "");
  if (factValue.length >= 3 && sourceValue.includes(factValue)) return true;
  return request.activeKnowledge.some((record) =>
    record.eventId === sourceId && record.category === fact.category && normalizeForSupport(record.value) === factValue &&
    (record.authority === "inventor-authored" || record.authority === "rev-recommended")
  );
}

function conflictsWithInventorAuthority(fact: RevUnderstandingProposedFact, request: RevUnderstandingRequest): boolean {
  const authoritative = request.activeKnowledge.filter((record) => record.category === fact.category && record.authority === "inventor-authored");
  return authoritative.length > 0 && authoritative.every((record) => normalizeForSupport(record.value) !== normalizeForSupport(fact.value));
}

function proposalFromFact(fact: RevUnderstandingProposedFact, operationId: string): RevUnderstandingProposal {
  return {
    resultClass: "interpretive-proposal",
    proposalId: `${operationId}-proposal`,
    targetCategory: fact.category,
    proposalText: fact.value.slice(0, 120).replace(/[?\r\n]+/g, " ").trim(),
    basisSourceIds: fact.sourceIds,
    questionKind: "confirm-interpretation",
  };
}

function buildProposalQuestion(
  proposal: RevUnderstandingProposal,
  request: RevUnderstandingRequest,
  sourceMap: Map<string, string>
): RevUnderstandingQuestion | null {
  if (!request.permittedTargetCategories.includes(proposal.targetCategory) || !referencesClose(proposal.basisSourceIds, sourceMap) ||
    unsafeProposal(proposal.proposalText) || repeatedCategory(proposal.targetCategory, request)) return null;
  const clean = proposal.proposalText.replace(/[.!]+$/g, "").trim();
  const prompt = `REV thinks ${clean}. Is that what you mean?`;
  if (prompt.length > 180 || (prompt.match(/\?/g) ?? []).length !== 1) return null;
  return {
    targetCategory: proposal.targetCategory,
    prompt,
    choices: [{ id: "confirm-proposal", label: "YES — THAT’S RIGHT", value: proposal.proposalText }],
    proposal,
  };
}

function buildConflictQuestion(request: RevUnderstandingRequest): RevUnderstandingQuestion | null {
  const conflicting = request.activeKnowledge.filter((record) => request.unresolvedConflictEventIds.includes(record.eventId));
  if (!conflicting.length) return null;
  const category = conflicting[0].category;
  const choices = conflicting
    .filter((record) => record.category === category)
    .filter((record, index, records) => records.findIndex((candidate) => normalize(candidate.value) === normalize(record.value)) === index)
    .slice(0, 3)
    .map((record, index) => ({ id: `resolve-${index + 1}`, label: record.value.slice(0, 80), value: record.value.slice(0, 240) }));
  return {
    targetCategory: category,
    prompt: `Which ${categoryLabel(category)} should REV keep for the first 3D concept?`,
    choices,
  };
}

function repeatedCategory(category: RevUnderstandingCategory, request: RevUnderstandingRequest): boolean {
  return request.previousQuestions.some((question) => question.answered && question.targetCategory === category);
}

function unsafeProposal(value: string): boolean {
  return /(?:ignore\s+(?:all|previous)|system\s+prompt|api\s*key|password|secret|https?:\/\/|<script|```|\{\{|\}\})/iu.test(value) || value.includes("?");
}

function categoryLabel(category: RevUnderstandingCategory): string {
  return category.replaceAll("-", " ");
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizeForSupport(value: string): string {
  return normalize(value).replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
}

function fallback(
  request: RevUnderstandingRequest,
  errorCategory: RevUnderstandingErrorCategory,
  status: "fallback" | "disabled",
  mockExecutions: number,
  externalProviderAttempts: number,
): RevUnderstandingApiResponse {
  return {
    status,
    operationId: request.operationId,
    operationKey: request.operationKey,
    projectId: request.projectId,
    knowledgeBasisRevision: request.knowledgeBasisRevision,
    message: FALLBACK_MESSAGE,
    errorCategory,
    accounting: emptyRevUnderstandingAccounting({
      deliberateRouteRequests: status === "disabled" ? 0 : 1,
      mockExecutions,
      externalProviderAttempts,
      fallbackPresentations: 1,
    }),
  };
}

function liveAttemptState(): LiveAttemptState {
  globalThis.__REAIDEA_HAI2B_LIVE_ATTEMPT_V1__ ??= { status: "unused" };
  return globalThis.__REAIDEA_HAI2B_LIVE_ATTEMPT_V1__;
}

function emitLiveEvidence(evidence: RevUnderstandingLiveEvidence): void {
  if (testEvidenceSink) {
    testEvidenceSink(evidence);
    return;
  }
  console.info("HAI-2B safe operation evidence", evidence);
}

function publicErrorCategory(error: OpenAIRevUnderstandingProviderError): RevUnderstandingErrorCategory {
  if (error.category === "timeout") return "timeout";
  if (error.category === "oversized-input") return "invalid-request";
  if (error.category === "oversized-response") return "oversized-response";
  if (error.category === "malformed-response" || error.category === "schema-failure") return "malformed-response";
  if (error.category === "unsafe-response") return "unsafe-response";
  return "unavailable";
}

class TimeoutError extends Error {}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new TimeoutError("Understanding operation timed out.")), milliseconds);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
