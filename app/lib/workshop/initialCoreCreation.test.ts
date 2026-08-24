import assert from "node:assert/strict";

import type { ConceptCandidate } from "../ai/types";
import { createProject } from "../core/project";
import { isInitialCoreCreationActive, runInitialCoreCreation, runInitialCoreCreationTransaction } from "./initialCoreCreation";

const project = createProject({
  ownerId: "fixture-inventor",
  originIntent: "developing",
  originalObservation: "I want a portable illuminated STOP/GO traffic sign that one person can operate safely beside the road. It must rotate remotely, remain stable outdoors, be visible in daylight and at night, and last a full work shift.",
});

const candidate: ConceptCandidate = {
  candidateId: "fixture-candidate", conceptFamilyId: "", revision: 1, title: "STOP/GO sign", visualMode: "product", representationStyle: "product-concept", status: "generated", createdAt: new Date().toISOString(), sourceBriefVersion: 1, sourceBriefHash: "fixture", sourceEventIds: project.timeline.map((event) => event.id), output: { type: "image", dataUrl: "data:image/png;base64,AA==", mediaType: "image/png", altText: "Fixture concept" }, disclaimer: "Fixture only.",
};

async function runFixtures(): Promise<void> {
let receiptCount = 0;
let requestCount = 0;
let validatedCandidateId = "";
const corePhases: string[] = [];
const success = await runInitialCoreCreation(project, undefined, {
  persistReceipt: async () => { receiptCount += 1; return true; },
  fetchConcept: async (request) => { requestCount += 1; return { status: 200, payload: { candidate: { ...candidate, conceptFamilyId: request.conceptFamilyId, revision: request.revision } } }; },
  persistCandidate: async () => true,
  onPhase: (phase) => corePhases.push(phase),
  onCandidateValidated: (validated) => { validatedCandidateId = validated.candidateId; },
});
assert.equal(success.kind, "success");
assert.equal(requestCount, 1);
assert.equal(receiptCount, 1);
assert.equal(validatedCandidateId, "fixture-candidate");
assert.deepEqual(corePhases, ["generating", "checking-geometry", "building"]);

let projectSaves = 0;
let conceptCreations = 0;
const transactionPhases: string[] = [];
const transaction = await runInitialCoreCreationTransaction({
  saveProject: async () => { projectSaves += 1; return project; },
  createConcept: async (savedProject, onPhase) => {
    conceptCreations += 1;
    assert.equal(savedProject.id, project.id);
    onPhase("generating");
    onPhase("building");
    return { kind: "success", candidate };
  },
  onPhase: (phase) => transactionPhases.push(phase),
});
assert.equal(transaction.kind, "success");
assert.equal(projectSaves, 1);
assert.equal(conceptCreations, 1);
assert.deepEqual(transactionPhases, ["saving", "generating", "building", "opening"]);
for (const phase of ["reading", "saving", "generating", "checking-geometry", "building", "opening"] as const) assert.equal(isInitialCoreCreationActive(phase), true);
assert.equal(isInitialCoreCreationActive("idle"), false);
assert.equal(isInitialCoreCreationActive("failed"), false);

const stoppedTransaction = await runInitialCoreCreationTransaction({
  saveProject: async () => null,
  createConcept: async () => { throw new Error("Creation must not run without a saved Project."); },
});
assert.equal(stoppedTransaction.kind, "stopped");

let failedReceipt = "";
const failed = await runInitialCoreCreation(project, undefined, {
  persistReceipt: async (receipt) => { failedReceipt = receipt.status; return true; },
  fetchConcept: async () => ({ status: 502, payload: { error: { code: "provider-failure", message: "Concept generation could not complete.", retryable: true } } }),
  persistCandidate: async () => true,
});
assert.equal(failed.kind, "failure");
assert.equal(failedReceipt, "failed");

let persistenceCalls = 0;
const persistenceFailure = await runInitialCoreCreation(project, undefined, {
  persistReceipt: async () => true,
  fetchConcept: async (request) => ({ status: 200, payload: { candidate: { ...candidate, conceptFamilyId: request.conceptFamilyId, revision: request.revision } } }),
  persistCandidate: async () => { persistenceCalls += 1; return persistenceCalls > 1; },
});
assert.equal(persistenceFailure.kind, "failure");
assert.ok(persistenceFailure.kind === "failure" && persistenceFailure.retryPersistence);
assert.equal((await persistenceFailure.retryPersistence!()).kind, "success");
assert.equal(persistenceCalls, 2);

console.log("Initial Core Creation fixtures: PASS");
}

void runFixtures();
