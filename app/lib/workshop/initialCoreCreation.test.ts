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
let persistedCandidate: ConceptCandidate | null = null;
const corePhases: string[] = [];
const success = await runInitialCoreCreation(project, undefined, {
  persistReceipt: async () => { receiptCount += 1; return true; },
  fetchConcept: async (request) => { requestCount += 1; return { status: 200, payload: { candidate: { ...candidate, conceptFamilyId: request.conceptFamilyId, revision: request.revision } } }; },
  persistCandidate: async (_projectId, saved) => { persistedCandidate = saved; return true; },
  restoreCandidate: async () => persistedCandidate,
  onPhase: (phase) => corePhases.push(phase),
  onCandidateValidated: (validated) => { validatedCandidateId = validated.candidateId; },
});
assert.equal(success.kind, "success");
assert.equal(requestCount, 1);
assert.equal(receiptCount, 1);
assert.equal(validatedCandidateId, "fixture-candidate");
assert(persistedCandidate);
assert.equal((persistedCandidate as ConceptCandidate).conceptGeometryStatus, "available");
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
  persistCandidate: async (_projectId, saved) => { persistedCandidate = saved; return true; },
  restoreCandidate: async () => persistedCandidate,
});
assert.equal(failed.kind, "failure");
assert.equal(failedReceipt, "failed");

let persistenceCalls = 0;
const persistenceFailure = await runInitialCoreCreation(project, undefined, {
  persistReceipt: async () => true,
  fetchConcept: async (request) => ({ status: 200, payload: { candidate: { ...candidate, conceptFamilyId: request.conceptFamilyId, revision: request.revision } } }),
  persistCandidate: async (_projectId, saved) => { persistedCandidate = saved; persistenceCalls += 1; return persistenceCalls > 1; },
  restoreCandidate: async () => persistedCandidate,
});
assert.equal(persistenceFailure.kind, "failure");
assert.ok(persistenceFailure.kind === "failure" && persistenceFailure.retryPersistence);
assert.equal((await persistenceFailure.retryPersistence!()).kind, "success");
assert.equal(persistenceCalls, 2);

const mixedProject = createProject({
  ownerId: "fixture-inventor",
  originIntent: "developing",
  originalObservation: "I want a physical wearable device with a frame and lens plus a software app with screens that control how it operates.",
});
let unresolvedGenerationCalls = 0;
let unresolvedCandidateWrites = 0;
const routingReceipts: string[] = [];
const unresolved = await runInitialCoreCreation(mixedProject, undefined, {
  persistReceipt: async (receipt) => { routingReceipts.push(receipt.status); return true; },
  fetchConcept: async () => { unresolvedGenerationCalls += 1; throw new Error("Generation must not run before representation resolution."); },
  persistCandidate: async () => { unresolvedCandidateWrites += 1; return true; },
});
assert.equal(unresolved.kind, "needs-representation");
assert.equal(unresolvedGenerationCalls, 0);
assert.equal(unresolvedCandidateWrites, 0);
assert.deepEqual(routingReceipts, ["awaiting-representation"]);
assert.equal(unresolved.kind === "needs-representation" && unresolved.receipt.projectId, mixedProject.id);
let unresolvedTransactionSaves = 0;
const unresolvedTransactionPhases: string[] = [];
const unresolvedTransaction = await runInitialCoreCreationTransaction({
  saveProject: async () => { unresolvedTransactionSaves += 1; return mixedProject; },
  createConcept: async (savedProject) => {
    assert.equal(savedProject.id, mixedProject.id);
    return unresolved;
  },
  onPhase: (phase) => unresolvedTransactionPhases.push(phase),
});
assert.equal(unresolvedTransaction.kind, "needs-representation");
assert.equal(unresolvedTransactionSaves, 1);
assert.deepEqual(unresolvedTransactionPhases, ["saving"]); // No Workshop-opening phase before resolution.

let resolvedGenerationCalls = 0;
let resolvedCandidate: ConceptCandidate | null = null;
const resolved = await runInitialCoreCreation(mixedProject, undefined, {
  persistReceipt: async (receipt) => { routingReceipts.push(receipt.status); return true; },
  fetchConcept: async (request) => {
    resolvedGenerationCalls += 1;
    assert.equal(request.visualMode, "product");
    assert.match(request.brief.assumptions.join(" "), /^REV working assumption:/);
    return { status: 200, payload: { candidate: { ...candidate, conceptFamilyId: request.conceptFamilyId, revision: request.revision } } };
  },
  persistCandidate: async (projectId, saved) => { assert.equal(projectId, mixedProject.id); resolvedCandidate = saved; return true; },
  restoreCandidate: async (projectId) => { assert.equal(projectId, mixedProject.id); return resolvedCandidate; },
}, { mode: "product", source: "rev-recommendation" });
assert.equal(resolved.kind, "success");
assert.equal(resolvedGenerationCalls, 1);
assert.equal(unresolvedGenerationCalls, 0);
assert.deepEqual(routingReceipts, ["awaiting-representation", "creating"]);

const unknownProject = createProject({ ownerId: "fixture-inventor", originIntent: "both", originalObservation: "I want a better way to improve mornings for people." });
let unknownGenerationCalls = 0;
const unknown = await runInitialCoreCreation(unknownProject, undefined, {
  persistReceipt: async () => true,
  fetchConcept: async () => { unknownGenerationCalls += 1; throw new Error("Generation must remain stopped."); },
});
assert.equal(unknown.kind, "needs-representation");
assert.equal(unknownGenerationCalls, 0);

const wearableProject = createProject({
  ownerId: "fixture-inventor",
  originIntent: "developing",
  originalObservation: "i want to design surf sun glasses, they would look like goggles, but better portrayed on your face like sun glasses, rubber seal, back strap to hold the glasses when diving under water, show me possible ideas",
});
let wearableProjectSaves = 0;
let wearableGenerationCalls = 0;
let wearablePersisted: ConceptCandidate | null = null;
const wearableEvents: string[] = [];
const wearableTransaction = await runInitialCoreCreationTransaction({
  saveProject: async () => { wearableProjectSaves += 1; wearableEvents.push("project-saved"); return wearableProject; },
  createConcept: async (savedProject, onPhase) => runInitialCoreCreation(savedProject, undefined, {
    persistReceipt: async () => true,
    fetchConcept: async (request) => {
      wearableGenerationCalls += 1;
      wearableEvents.push("candidate-returned");
      return { status: 200, payload: { candidate: { ...candidate, conceptFamilyId: request.conceptFamilyId, revision: request.revision, sourceEventIds: request.sourceEventIds } } };
    },
    persistCandidate: async (projectId, saved) => { assert.equal(projectId, wearableProject.id); wearableEvents.push("candidate-persisted"); wearablePersisted = saved; return true; },
    restoreCandidate: async (projectId) => { assert.equal(projectId, wearableProject.id); wearableEvents.push("candidate-restored"); return wearablePersisted; },
    onPhase,
  }),
  onPhase: (phase) => wearableEvents.push(`phase:${phase}`),
});
assert.equal(wearableTransaction.kind, "success");
assert.equal(wearableProjectSaves, 1);
assert.equal(wearableGenerationCalls, 1);
assert(wearablePersisted);
assert.equal((wearablePersisted as ConceptCandidate).initialGeometryPlan?.profile, "wearable-enclosure");
assert.equal((wearablePersisted as ConceptCandidate).conceptGeometryStatus, "available");
assert.equal((wearablePersisted as ConceptCandidate).conceptGeometry?.components.length, 9);
assert(wearableEvents.indexOf("project-saved") < wearableEvents.indexOf("candidate-returned"));
assert(wearableEvents.indexOf("candidate-returned") < wearableEvents.indexOf("candidate-persisted"));
assert(wearableEvents.indexOf("candidate-persisted") < wearableEvents.indexOf("candidate-restored"));
assert(wearableEvents.indexOf("candidate-restored") < wearableEvents.indexOf("phase:opening"));

console.log("Initial Core Creation fixtures: PASS");
}

void runFixtures();
