import assert from "node:assert/strict";

import { createProject } from "./project";
import { parseProjectSnapshot } from "./storageEngine";
import { createInitialHomeKnowledge, ensureHomeUnderstandingQuestion } from "../workshop/homeUnderstanding";

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

console.log("Project origin intent storage fixtures: PASS");
