import assert from "node:assert/strict";

import { assessHomeUnderstanding } from "./revWorkingUnderstanding";

assert.equal(assessHomeUnderstanding("A new physical object.").ready, false);
assert.equal(
  assessHomeUnderstanding("I want a safer control that a person can operate.").ready,
  true,
  "entry readiness must follow meaning rather than a character or word threshold"
);

const meaningfulDescription = "I want a portable illuminated STOP/GO traffic sign that one person can operate safely from beside the road. The STOP and GO faces should rotate or change remotely so the operator does not have to stand in moving traffic. It needs to be stable outdoors, visible in daylight and at night, easy to transport, and powered for a full work shift.";

assert.equal(
  assessHomeUnderstanding(meaningfulDescription).ready,
  true,
  "Expected the detailed founder example to be ready"
);

console.log("Home readiness fixtures: PASS");
