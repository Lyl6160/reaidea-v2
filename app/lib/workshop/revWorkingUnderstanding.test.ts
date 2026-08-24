import assert from "node:assert/strict";

import { assessHomeUnderstanding } from "./revWorkingUnderstanding";

const insufficientDescriptions = [
  "A safer traffic sign.",
  "A new lawn mower.",
  "Help me build an app.",
  "Solar power trailer.",
  "Better wheelchair.",
] as const;

for (const description of insufficientDescriptions) {
  assert.equal(
    assessHomeUnderstanding(description).ready,
    false,
    `Expected short description to remain insufficient: ${description}`
  );
}

const incompleteDescriptions = [
  "I want a new product concept that feels exciting and modern and would be wonderful to create someday.",
  "A portable illuminated trailer with batteries, wheels, controls, a metal frame, and an outdoor cover.",
] as const;

for (const description of incompleteDescriptions) {
  assert.equal(
    assessHomeUnderstanding(description).ready,
    false,
    `Expected both purpose and practical detail before readiness: ${description}`
  );
}

const meaningfulDescription = "I want a portable illuminated STOP/GO traffic sign that one person can operate safely from beside the road. The STOP and GO faces should rotate or change remotely so the operator does not have to stand in moving traffic. It needs to be stable outdoors, visible in daylight and at night, easy to transport, and powered for a full work shift.";

assert.equal(
  assessHomeUnderstanding(meaningfulDescription).ready,
  true,
  "Expected the detailed founder example to be ready"
);

console.log("Home readiness fixtures: PASS");
