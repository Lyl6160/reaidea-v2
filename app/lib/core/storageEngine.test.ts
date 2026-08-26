import assert from "node:assert/strict";

import { createProject } from "./project";
import { parseProjectSnapshot } from "./storageEngine";
import {
  createHomeRevUnderstandingRequest,
  createInitialHomeKnowledge,
  ensureHomeUnderstandingQuestion,
  recordHomeUnderstandingOperationStarted,
} from "../workshop/homeUnderstanding";

for (const originIntent of ["developing", "evaluating", "both"] as const) {
  const project = createProject({
    ownerId: "inventor-fixture",
    originalObservation: "A clearly described fixture idea.",
    originIntent,
  });
  assert.equal(parseProjectSnapshot(JSON.stringify(project))?.originIntent, originIntent);
}

const legacyProject = createProject({
  ownerId: "inventor-fixture",
  originalObservation: "A legacy fixture idea.",
  originIntent: "developing",
});
delete legacyProject.originIntent;
assert.equal(parseProjectSnapshot(JSON.stringify(legacyProject))?.originIntent, undefined);

const invalidProject = createProject({
  ownerId: "inventor-fixture",
  originalObservation: "An invalid fixture idea.",
  originIntent: "developing",
});
const invalidSnapshot = { ...invalidProject, originIntent: "guessed" };
assert.equal(parseProjectSnapshot(JSON.stringify(invalidSnapshot))?.originIntent, undefined);

let eventIndex = 0;
const homeProject = ensureHomeUnderstandingQuestion(
  createInitialHomeKnowledge(
    createProject({
      ownerId: "inventor-fixture",
      originalObservation: "I want an invention that helps a person prepare a task.",
      originIntent: "developing",
    }),
    [],
    { now: "2026-08-26T10:00:00.000Z", nextId: () => `home-${++eventIndex}` }
  ),
  { now: "2026-08-26T10:01:00.000Z", nextId: () => `home-${++eventIndex}` }
);
const restoredHomeProject = parseProjectSnapshot(JSON.stringify(homeProject));
assert.ok(restoredHomeProject?.timeline.some((event) => event.homeUnderstanding?.kind === "knowledge"));
assert.ok(restoredHomeProject?.timeline.some((event) => event.homeUnderstanding?.kind === "question"));

const malformedHomeProject = structuredClone(homeProject);
malformedHomeProject.timeline.at(-1)!.homeUnderstanding = { kind: "question", question: { version: 1 } } as never;
assert.equal(parseProjectSnapshot(JSON.stringify(malformedHomeProject))?.timeline.at(-1)?.homeUnderstanding, undefined);

const operationRequest = createHomeRevUnderstandingRequest(homeProject, "storage-operation");
const operationProject = recordHomeUnderstandingOperationStarted(homeProject, operationRequest, {
  now: "2026-08-26T10:02:00.000Z",
  nextId: () => "home-operation-receipt",
}).project;
const restoredOperation = parseProjectSnapshot(JSON.stringify(operationProject));
const restoredReceipt = restoredOperation?.timeline.find((event) => event.id === "home-operation-receipt")?.homeUnderstanding;
assert.equal(restoredReceipt?.kind, "operation-receipt");
assert.equal(restoredReceipt?.kind === "operation-receipt" && "externalProviderAttempts" in restoredReceipt.receipt, false, "accounting remains nested safe metadata");
assert.equal(restoredReceipt?.kind === "operation-receipt" && restoredReceipt.receipt.accounting.externalProviderAttempts, 0);
assert.equal(JSON.stringify(restoredReceipt).includes(operationProject.originalObservation), false, "operation receipts must not duplicate inventor text");

console.log("Project origin intent storage fixtures: PASS");
