import assert from "node:assert/strict";

import { ConceptGenerationServiceError, generateConcept } from "./aiService.server";
import { preflightCreationIntent } from "./revImageSafetyPolicy.server";
import type { ConceptCandidate, ConceptGenerationRequest, ProviderImageSafetyReport } from "./types";

const baseRequest: ConceptGenerationRequest = {
  requestId: "safety-fixture", conceptFamilyId: "family-fixture", revision: 1,
  title: "Safety fixture", visualMode: "product", representationStyle: "product-concept", outputType: "image",
  brief: {
    originalIdea: "A portable illuminated STOP/GO traffic sign for safer roadside operation.", problemContext: "Keep an operator away from moving traffic.", proposedSolution: "A stable portable sign.", operatingConcept: "Remote operation.", functionalElements: "Sign, pole, base and lights.", constraints: [], assumptions: [],
  },
  sourceEventIds: [], sourceTrace: [], briefVersion: 1,
};

const clearSafety: ProviderImageSafetyReport = {
  available: true, flagged: false, immediateBlock: false, controlledRisk: "none", factualSummary: "Fixture output.", visualObservations: [], uncertainties: [],
};
const candidate: ConceptCandidate = {
  candidateId: "candidate-fixture", conceptFamilyId: "family-fixture", revision: 1, title: "Fixture", visualMode: "product", representationStyle: "product-concept", status: "generated", createdAt: "2026-08-24T00:00:00.000Z", sourceBriefVersion: 1, sourceBriefHash: "fixture", sourceEventIds: [], output: { type: "image", dataUrl: "data:image/png;base64,AA==", mediaType: "image/png", altText: "Fixture" }, disclaimer: "Fixture only.",
};

function decision(text: string): string {
  return preflightCreationIntent(text).decision;
}

async function assertNoCreation(text: string, expected: "HOLD" | "BLOCK" | "unavailable"): Promise<void> {
  let providerCreated = 0;
  const request = text.trim()
    ? { ...baseRequest, brief: { ...baseRequest.brief, originalIdea: text } }
    : { ...baseRequest, brief: { ...baseRequest.brief, originalIdea: "", problemContext: "", proposedSolution: "", operatingConcept: "", functionalElements: "", constraints: [], assumptions: [] } };
  try {
    await generateConcept(request, {
      apiKey: "fixture-key",
      createProvider: () => { providerCreated += 1; throw new Error("Provider must not be constructed."); },
    });
    assert.fail("Expected creation preflight failure.");
  } catch (error) {
    assert.ok(error instanceof ConceptGenerationServiceError);
    assert.equal(error.code, expected === "HOLD" ? "safety-hold" : expected === "BLOCK" ? "safety-block" : "safety-unavailable");
    assert.equal(error.diagnostic?.providerOperationAttempts, 0);
    if (text.trim()) assert.equal(error.message.includes(text.trim()), false);
  }
  assert.equal(providerCreated, 0);
}

async function runFixtures(): Promise<void> {
  // CLEAR: ordinary product, protective storage, and protective chemical contexts.
  assert.equal(decision("A portable STOP/GO traffic sign for roadside safety."), "CLEAR");
  assert.equal(decision("A gun safe for secure firearm storage and access prevention."), "CLEAR");
  assert.equal(decision("A chemical containment cabinet for spill control and detection."), "CLEAR");
  assert.equal(decision("Decommissioning equipment for safe storage and protective handling."), "CLEAR");

  // HOLD: controlled subject is present but its protective/lawful purpose is unclear.
  assert.equal(decision("A firearm-related device."), "HOLD");
  assert.equal(decision("A hazardous chemical apparatus."), "HOLD");

  // BLOCK: minimal synthetic labels; no procedural details are included in fixtures.
  assert.equal(decision("Modify a firearm to increase accuracy."), "BLOCK");
  assert.equal(decision("A weapon component suitable for printing."), "BLOCK");
  assert.equal(decision("Create an explosive mixture."), "BLOCK");
  assert.equal(decision("Weaponise a harmful chemical."), "BLOCK");
  assert.equal(decision("Bypass a firearm safety control."), "BLOCK");
  assert.equal(decision(" Secure storage, but modify a GUN for concealment! "), "BLOCK");

  await assertNoCreation("Modify a firearm to increase accuracy.", "BLOCK");
  await assertNoCreation("A firearm-related device.", "HOLD");
  await assertNoCreation("   ", "unavailable");
  await assertNoCreation("modify a FIREARM to increase accuracy", "BLOCK");

  let referenceImageCreationOperations = 0;
  try {
    await generateConcept({
      ...baseRequest,
      referenceImage: { evidenceReference: "source-image:fixture", sourceEventId: "event-fixture", mediaType: "image/png", dataUrl: "data:image/png;base64,AA==" },
    }, {
      apiKey: "fixture-key",
      createProvider: () => ({
        supportsReferenceImages: true,
        generateConcept: async () => { referenceImageCreationOperations += 1; return candidate; },
        inspectImageSafety: async () => ({ ...clearSafety, controlledRisk: "firearm" }),
      }),
    });
    assert.fail("Expected image-assisted reference safety HOLD.");
  } catch (error) {
    assert.ok(error instanceof ConceptGenerationServiceError);
    assert.equal(error.code, "safety-hold");
  }
  assert.equal(referenceImageCreationOperations, 0);

  let imageCreationOperations = 0;
  const clearResult = await generateConcept(baseRequest, {
    apiKey: "fixture-key",
    createProvider: () => ({
      supportsReferenceImages: true,
      generateConcept: async () => { imageCreationOperations += 1; return candidate; },
      inspectImageSafety: async () => clearSafety,
    }),
  });
  assert.equal(clearResult.candidate.candidateId, "candidate-fixture");
  assert.equal(imageCreationOperations, 1);
  console.log("Creation intent safety fixtures: PASS");
}

void runFixtures();
