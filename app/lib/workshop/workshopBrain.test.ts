import assert from "node:assert/strict";

import { createProject } from "../core/project";
import { assessWorkshop } from "./workshopBrain";

const project = createProject({ ownerId: "fixture", originIntent: "developing", originalObservation: "I want a portable illuminated STOP/GO sign that one person can operate safely beside traffic. It rotates remotely, remains stable outdoors, is visible day and night, and lasts a work shift." });
const engineering = assessWorkshop(project).benches.find((bench) => bench.id === "engineering");
assert.ok(engineering);
assert.match(engineering!.nextMove, /Review the current Concept 01/);
assert.doesNotMatch(engineering!.nextMove, /Add more detail/);
console.log("Workshop Home-ready guidance fixtures: PASS");
