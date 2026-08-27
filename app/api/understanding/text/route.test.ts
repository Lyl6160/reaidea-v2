import assert from "node:assert/strict";
import fs from "node:fs";

import { createProject } from "../../../lib/core/project";
import { createHomeRevUnderstandingRequest } from "../../../lib/workshop/homeUnderstanding";
import {
  resetRevUnderstandingLiveAttemptBudgetForTests,
  resetRevUnderstandingOperationRegistryForTests,
  setRevUnderstandingProviderPreparerForTests,
  setRevUnderstandingMockExecutorForTests,
} from "../../../lib/ai/revUnderstandingService.server";
import * as route from "./route";

const endpoint = "http://localhost/api/understanding/text";

function validRequest() {
  return createHomeRevUnderstandingRequest(
    createProject({
      ownerId: "inventor-fixture",
      originalObservation: "A wearable frame with a mirrored front panel and a retaining strap.",
      originIntent: "developing",
    }),
    "route-operation",
  );
}

async function post(body: unknown, options: {
  origin?: string | null;
  contentType?: string;
  contentLength?: string;
  url?: string;
  headers?: Record<string, string>;
} = {}) {
  const headers = new Headers();
  if (options.origin !== null) headers.set("Origin", options.origin ?? "http://localhost");
  headers.set("Content-Type", options.contentType ?? "application/json");
  if (options.contentLength) headers.set("Content-Length", options.contentLength);
  for (const [name, value] of Object.entries(options.headers ?? {})) headers.set(name, value);
  const response = await route.POST(new Request(options.url ?? endpoint, { method: "POST", headers, body: JSON.stringify(body) }));
  return { response, payload: await response.json() as Record<string, unknown> };
}

async function run(): Promise<void> {
  assert.equal("GET" in route, false, "the route must export POST only");
  const input = validRequest();

  delete process.env.REAIDEA_HAI2_MODE;
  process.env.REAIDEA_HAI2_MOCK_SCENARIO = "interpretive-proposal";
  let result = await post(input);
  assert.equal(result.response.status, 503);
  assert.equal(result.payload.status, "disabled");
  assert.equal((result.payload.accounting as Record<string, unknown>).externalProviderAttempts, 0);
  assert.equal((result.payload.accounting as Record<string, unknown>).mockExecutions, 0, "a scenario must be inaccessible while HAI-2A is disabled");
  delete process.env.REAIDEA_HAI2_MOCK_SCENARIO;

  process.env.REAIDEA_HAI2_MODE = "founder-live-test";
  delete process.env.REAIDEA_HAI2_FOUNDER_LIVE_ATTEMPT;
  process.env.NEXT_PUBLIC_REAIDEA_HAI2_ROUTE_CAPABILITY = "enabled";
  resetRevUnderstandingOperationRegistryForTests();
  resetRevUnderstandingLiveAttemptBudgetForTests();
  result = await post(input);
  assert.equal(result.response.status, 503);
  assert.equal(result.payload.status, "disabled", "client capability cannot authorize founder-live mode");

  result = await post(input, { url: `${endpoint}?REAIDEA_HAI2_FOUNDER_LIVE_ATTEMPT=authorize-one` });
  assert.equal(result.response.status, 503, "a query parameter cannot authorize founder-live mode");
  result = await post(input, { headers: { "X-Reaidea-Hai2-Founder-Live-Attempt": "authorize-one" } });
  assert.equal(result.response.status, 503, "a header cannot authorize founder-live mode");
  result = await post({ ...input, founderLiveAttempt: "authorize-one" });
  assert.equal(result.response.status, 400, "a request body cannot authorize founder-live mode");

  process.env.REAIDEA_HAI2_FOUNDER_LIVE_ATTEMPT = "authorize-one";
  result = await post(input, {
    url: "http://192.168.1.25/api/understanding/text",
    origin: "http://192.168.1.25",
  });
  assert.equal(result.response.status, 503, "founder-live mode must reject non-loopback hosts");

  const originalNodeEnvironment = process.env.NODE_ENV;
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true, enumerable: true });
  result = await post(input);
  assert.equal(result.response.status, 503, "founder-live mode is prohibited in production");
  if (originalNodeEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.defineProperty(process.env, "NODE_ENV", { value: originalNodeEnvironment, configurable: true, writable: true, enumerable: true });

  let founderLiveExecutions = 0;
  resetRevUnderstandingOperationRegistryForTests();
  resetRevUnderstandingLiveAttemptBudgetForTests();
  setRevUnderstandingProviderPreparerForTests(() => ({
    providerRequest: { model: "gpt-5-mini", input: "fixture", store: false, stream: false },
    providerRequestBytes: 128,
    execute: async () => {
      founderLiveExecutions += 1;
      return {
        result: {
          version: 1,
          proposedFacts: [{
            resultClass: "verified-explicit-derivation",
            category: "major-parts",
            value: "retaining strap",
            sourceIds: ["project.originalObservation"],
          }],
          unresolvedConflictEventIds: [],
        },
        evidence: {
          operationReference: input.operationId,
          projectReference: "project-ref:0123456789abcdef",
          knowledgeBasisReference: input.knowledgeBasisRevision,
          configuredModel: "gpt-5-mini",
          externalProviderAttempts: 1,
          responsesCreateInvocations: 1,
          retryCount: 0,
          durationMilliseconds: 10,
          schemaStatus: "valid",
          usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120, cachedInputTokens: 0 },
          cost: { kind: "calculated", currency: "USD", nominalAmount: 0.000065, rateDate: "2026-08-27" },
          providerRequestId: "req_route_fixture",
        },
      };
    },
  }));
  result = await post(input);
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.status, "completed");
  assert.equal(founderLiveExecutions, 1);
  assert.equal((result.payload.accounting as Record<string, unknown>).externalProviderAttempts, 1);

  const anotherInput = createHomeRevUnderstandingRequest(
    createProject({
      ownerId: "inventor-fixture",
      originalObservation: "A compact enclosure with a removable front panel.",
      originIntent: "developing",
    }),
    "route-operation-two",
  );
  result = await post(anotherInput);
  assert.equal(result.response.status, 503);
  assert.equal(result.payload.status, "fallback");
  assert.equal((result.payload.accounting as Record<string, unknown>).externalProviderAttempts, 0);
  assert.equal(founderLiveExecutions, 1, "the process-wide latch must block a second Project");

  process.env.REAIDEA_HAI2_MODE = "production";
  resetRevUnderstandingOperationRegistryForTests();
  result = await post(input);
  assert.equal(result.response.status, 503);
  assert.equal(result.payload.status, "disabled", "production mode must remain prohibited");
  delete process.env.REAIDEA_HAI2_MOCK_SCENARIO;
  delete process.env.REAIDEA_HAI2_MODE;
  delete process.env.REAIDEA_HAI2_FOUNDER_LIVE_ATTEMPT;
  delete process.env.NEXT_PUBLIC_REAIDEA_HAI2_ROUTE_CAPABILITY;

  result = await post(input, { origin: null });
  assert.equal(result.response.status, 403);
  result = await post(input, { origin: "https://different.example" });
  assert.equal(result.response.status, 403);
  result = await post(input, { contentType: "text/plain" });
  assert.equal(result.response.status, 415);
  result = await post(input, { contentLength: "60000" });
  assert.equal(result.response.status, 413);
  result = await post({ ...input, unexpected: true });
  assert.equal(result.response.status, 400);
  result = await post({ ...input, projectId: "other-project" });
  assert.equal(result.response.status, 409);
  result = await post({ ...input, knowledgeBasisRevision: "knowledge-basis-v1:wrong" });
  assert.equal(result.response.status, 409);
  result = await post({ ...input, operationKey: "hai2a-v1:wrong" });
  assert.equal(result.response.status, 409);

  process.env.REAIDEA_HAI2_MODE = "mock";
  resetRevUnderstandingOperationRegistryForTests();
  setRevUnderstandingMockExecutorForTests(async () => ({
    version: 1,
    proposedFacts: [{
      resultClass: "verified-explicit-derivation",
      category: "major-parts",
      value: "retaining strap",
      sourceIds: ["project.originalObservation"],
    }],
    unresolvedConflictEventIds: [],
  }));
  result = await post(input);
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.status, "completed");
  const accounting = result.payload.accounting as Record<string, unknown>;
  assert.equal(accounting.mockExecutions, 1);
  assert.equal(accounting.externalProviderAttempts, 0);

  resetRevUnderstandingOperationRegistryForTests();
  process.env.REAIDEA_HAI2_MOCK_SCENARIO = "interpretive-proposal";
  result = await post(input);
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.status, "completed");
  const scenarioQuestion = result.payload.question as Record<string, unknown>;
  assert.equal(scenarioQuestion.prompt, "REV thinks a soft seal surrounds each eye separately. Is that what you mean?");
  assert.equal((result.payload.acceptedDerivations as unknown[]).length, 0);
  assert.equal((result.payload.accounting as Record<string, unknown>).interpretiveProposals, 1);
  assert.equal((result.payload.accounting as Record<string, unknown>).externalProviderAttempts, 0);

  delete process.env.REAIDEA_HAI2_MOCK_SCENARIO;
  resetRevUnderstandingOperationRegistryForTests();
  result = await post(input, { url: `${endpoint}?mockScenario=interpretive-proposal` });
  assert.equal(result.response.status, 503, "a query parameter must not select a mock scenario");
  assert.equal(result.payload.status, "fallback");

  resetRevUnderstandingOperationRegistryForTests();
  result = await post(input, { headers: { "X-Reaidea-Hai2-Mock-Scenario": "interpretive-proposal" } });
  assert.equal(result.response.status, 503, "a request header must not select a mock scenario");
  assert.equal(result.payload.status, "fallback");

  resetRevUnderstandingOperationRegistryForTests();
  result = await post({ ...input, mockScenario: "interpretive-proposal" });
  assert.equal(result.response.status, 400, "a request body must not select a mock scenario");

  const rawDescription = input.originalDescriptionSource.text;
  const invalid = await post({ ...input, originalDescriptionSource: { ...input.originalDescriptionSource, text: `${rawDescription} changed` } });
  assert.equal(invalid.response.status, 409);
  assert.equal(JSON.stringify(invalid.payload).includes(rawDescription), false, "safe errors must not echo inventor content");

  const source = fs.readFileSync("app/api/understanding/text/route.ts", "utf8");
  assert.doesNotMatch(source, /openai|images\.generate|\/api\/concepts\/generate/i);
  assert.match(source, /Cache-Control/);

  resetRevUnderstandingOperationRegistryForTests();
  resetRevUnderstandingLiveAttemptBudgetForTests();
  delete process.env.REAIDEA_HAI2_MOCK_SCENARIO;
  delete process.env.REAIDEA_HAI2_MODE;
  delete process.env.REAIDEA_HAI2_FOUNDER_LIVE_ATTEMPT;
  delete process.env.NEXT_PUBLIC_REAIDEA_HAI2_ROUTE_CAPABILITY;
  console.log("HAI-2A/HAI-2B text-understanding route fixtures: PASS");
}

void run();
