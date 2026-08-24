import assert from "node:assert/strict";

import { isInitialCoreCreationReceipt } from "./conceptCandidateStorage";

const valid = {
  projectId: "project-fixture", status: "failed", correlationId: "request-fixture", startedAt: "2026-08-24T00:00:00.000Z", updatedAt: "2026-08-24T00:00:01.000Z",
  diagnostic: { correlationId: "request-fixture", category: "provider-failure", httpStatus: 502, providerOperationAttempts: 1, modelIdentifier: "gpt-image-2", occurredAt: "2026-08-24T00:00:01.000Z", retryable: true },
};
assert.equal(isInitialCoreCreationReceipt(valid, "project-fixture"), true);
assert.equal(isInitialCoreCreationReceipt({ ...valid, projectId: "other" }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ ...valid, diagnostic: { ...valid.diagnostic, category: "unsafe" } }, "project-fixture"), false);
assert.equal(isInitialCoreCreationReceipt({ ...valid, diagnostic: { ...valid.diagnostic, providerOperationAttempts: "secret" } }, "project-fixture"), false);
console.log("Initial Core Creation receipt fixtures: PASS");
