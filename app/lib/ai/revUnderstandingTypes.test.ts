import assert from "node:assert/strict";

import {
  deriveAcceptedBindingDigest,
  deriveKnowledgeBasisRevision,
  deriveRevUnderstandingOperationKey,
  parseRevUnderstandingApiResponse,
  parseRevUnderstandingRawResult,
  parseRevUnderstandingRequest,
  recomputeRequestKnowledgeBasisRevision,
  recomputeRequestOperationKey,
  type RevUnderstandingRequest,
} from "./revUnderstandingTypes";

function request(): RevUnderstandingRequest {
  const activeKnowledge: RevUnderstandingRequest["activeKnowledge"] = [{
    eventId: "fact-1",
    category: "overall-form",
    value: "A wearable frame.",
    sourceKind: "original-description",
    sourceReference: "project.originalObservation",
    authority: "inventor-authored",
    reversibleAssumption: false,
    supportingSourceIds: [],
  }];
  const knowledgeBasisRevision = deriveKnowledgeBasisRevision({
    originalDescription: "A wearable frame.",
    originIntent: "developing",
    activeKnowledge,
    blockingConflictEventIds: [],
  });
  const acceptedBindingDigest = deriveAcceptedBindingDigest(activeKnowledge);
  const base = {
    version: 1 as const,
    operationId: "operation-1",
    operationKind: "home-one-question" as const,
    projectId: "project-1",
    knowledgeBasisRevision,
    acceptedBindingDigest,
    originalDescriptionSource: { id: "project.originalObservation" as const, text: "A wearable frame." },
    originIntent: "developing" as const,
    activeKnowledge,
    unresolvedConflictEventIds: [],
    meterCoverage: { completedStages: ["IDEA CAPTURED", "FORM UNDERSTOOD"], ready: false },
    previousQuestions: [],
    mustHaves: [],
    mustAvoids: [],
    reversibleAssumptions: [],
    permittedTargetCategories: ["purpose-use", "major-parts"] as RevUnderstandingRequest["permittedTargetCategories"],
  };
  return {
    ...base,
    operationKey: deriveRevUnderstandingOperationKey({ projectId: base.projectId, knowledgeBasisRevision, acceptedBindingDigest }),
  };
}

const valid = request();
assert.deepEqual(parseRevUnderstandingRequest(valid), valid);
assert.equal(recomputeRequestKnowledgeBasisRevision(valid), valid.knowledgeBasisRevision);
assert.equal(recomputeRequestOperationKey(valid), valid.operationKey);
assert.equal(parseRevUnderstandingRequest({ ...valid, unexpected: true }), null, "unknown request fields must fail closed");
assert.equal(parseRevUnderstandingRequest({ ...valid, originalDescriptionSource: { ...valid.originalDescriptionSource, text: "x".repeat(1_601) } }), null);
assert.equal(parseRevUnderstandingRequest({ ...valid, activeKnowledge: [{ ...valid.activeKnowledge[0], category: "invented-category" }] }), null);

const raw = {
  version: 1,
  proposedFacts: [{ resultClass: "verified-explicit-derivation", category: "overall-form", value: "wearable frame", sourceIds: ["project.originalObservation"] }],
  proposal: { resultClass: "interpretive-proposal", proposalId: "proposal-1", targetCategory: "major-parts", proposalText: "the front panel should be removable", basisSourceIds: ["project.originalObservation"], questionKind: "confirm-interpretation" },
  unresolvedConflictEventIds: [],
};
assert.ok(parseRevUnderstandingRawResult(raw));
assert.equal(parseRevUnderstandingRawResult({ ...raw, proposedFacts: Array.from({ length: 7 }, () => raw.proposedFacts[0]) }), null);
assert.equal(parseRevUnderstandingRawResult({ ...raw, proposal: { ...raw.proposal, proposalText: "x".repeat(121) } }), null);

const completed = {
  status: "completed",
  operationId: valid.operationId,
  operationKey: valid.operationKey,
  projectId: valid.projectId,
  knowledgeBasisRevision: valid.knowledgeBasisRevision,
  acceptedDerivations: raw.proposedFacts,
  question: null,
  accounting: {
    deliberateRouteRequests: 1,
    mockExecutions: 1,
    externalProviderAttempts: 0,
    acceptedExplicitDerivations: 1,
    interpretiveProposals: 0,
    persistedQuestions: 0,
    fallbackPresentations: 0,
  },
};
assert.ok(parseRevUnderstandingApiResponse(completed));
assert.equal(parseRevUnderstandingApiResponse({ ...completed, accounting: { ...completed.accounting, externalProviderAttempts: -1 } }), null);

console.log("HAI-2A understanding schema fixtures: PASS");
