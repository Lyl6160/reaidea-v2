import assert from "node:assert/strict";

import type { VisualUnderstandingResult } from "../ai/types";
import { createProject } from "../core/project";
import {
  buildConceptGenerationFoundation,
  createConceptWorkflowIdentity,
  REPRESENTATION_CHOICE_HEADING,
  REPRESENTATION_CHOICE_QUESTION,
  REV_RECOMMENDATION_LABEL,
  routeInitialRepresentation,
} from "./conceptGeneration";

function projectFor(originalObservation: string) {
  return createProject({ ownerId: "fixture-inventor", originIntent: "developing", originalObservation });
}

const lifestyleImage: VisualUnderstandingResult = {
  evidenceReference: "project-source-image:fixture",
  nonAuthoritative: true,
  createdAt: "2026-08-26T00:00:00.000Z",
  factualSummary: "A person outdoors near water while looking at a software app screen.",
  visualObservations: ["A mobile application screen, bright sunlight and casual clothing are visible."],
  uncertainties: ["The pictured setting does not establish the product construction."],
};

const wearableProject = projectFor(
  "I want physical wearable eyewear with two lenses held in a lightweight frame and an adjustable strap so a person can wear it outdoors comfortably."
);
const wearableRouting = routeInitialRepresentation(wearableProject, lifestyleImage);
assert.equal(wearableRouting.kind, "ready");
assert.equal(wearableRouting.kind === "ready" && wearableRouting.mode, "product");
assert.equal(wearableRouting.diagnostic.supportingSignalLabels.includes("image-context-differs"), true);

const productOnly = routeInitialRepresentation(projectFor(
  "I want a portable physical enclosure with a handle, battery lights and replaceable parts that one person can carry and operate outdoors."
));
assert.equal(productOnly.kind, "ready");
assert.equal(productOnly.kind === "ready" && productOnly.mode, "product");

const mixedProject = projectFor(
  "I want a physical wearable device with a frame and lens plus a software app with screens that control how it operates."
);
const mixed = routeInitialRepresentation(mixedProject);
assert.equal(mixed.kind, "needs-representation");
assert.equal(mixed.kind === "needs-representation" && mixed.diagnostic.mode, "mixed");
assert.equal(mixed.kind === "needs-representation" && mixed.recommendation, "product");
assert.deepEqual(mixed.kind === "needs-representation" ? mixed.choices.map((choice) => choice.mode) : [], ["product"]);
assert.equal(mixed.kind === "needs-representation" && mixed.heading, REPRESENTATION_CHOICE_HEADING);
assert.equal(mixed.kind === "needs-representation" && mixed.question, REPRESENTATION_CHOICE_QUESTION);
assert.equal(REV_RECOMMENDATION_LABEL, "I'M NOT SURE / LET REV RECOMMEND");

const unknownProject = projectFor("I want a better way to improve mornings for people.");
const unknown = routeInitialRepresentation(unknownProject);
assert.equal(unknown.kind, "needs-representation");
assert.equal(unknown.kind === "needs-representation" && unknown.diagnostic.mode, "unknown");
assert.equal(unknown.kind === "needs-representation" && unknown.recommendation, null);
assert.deepEqual(unknown.kind === "needs-representation" ? unknown.choices.map((choice) => choice.mode) : [], ["product"]);

const recommended = routeInitialRepresentation(mixedProject, undefined, {
  mode: "product",
  source: "rev-recommendation",
});
assert.equal(recommended.kind, "ready");
assert.equal(recommended.kind === "ready" && recommended.diagnostic.reason, "evidence-backed-recommendation");
assert.match(recommended.kind === "ready" ? recommended.workingAssumptions[0] : "", /^REV working assumption:/);

const unsupportedRecommendation = routeInitialRepresentation(unknownProject, undefined, {
  mode: "product",
  source: "rev-recommendation",
});
assert.equal(unsupportedRecommendation.kind, "needs-representation");

if (recommended.kind === "ready") {
  const foundation = buildConceptGenerationFoundation(
    mixedProject,
    recommended.mode,
    createConceptWorkflowIdentity(),
    [],
    [],
    [],
    recommended.workingAssumptions
  );
  assert(foundation.request);
  assert.match(foundation.request.brief.assumptions.join(" "), /REV working assumption:/);
}

const diagnostics = JSON.stringify([wearableRouting.diagnostic, mixed.diagnostic, unknown.diagnostic]);
assert.doesNotMatch(diagnostics, /wearable eyewear|improve mornings|person outdoors/i);
assert.doesNotMatch(diagnostics, /data:image|prompt|provider/i);

console.log("Concept representation routing fixtures: PASS");
