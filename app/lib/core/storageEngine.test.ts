import assert from "node:assert/strict";

import { createProject } from "./project";
import { parseProjectSnapshot } from "./storageEngine";

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

console.log("Project origin intent storage fixtures: PASS");
