import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(page, /"ASK REV"/);
assert.match(page, /\/api\/creation-intent/);
assert.match(page, /\/api\/understanding\/image/);
assert.match(page, /createInitialHomeKnowledge/);
assert.match(page, /persistAndReload/);
assert.doesNotMatch(page, /\/api\/concepts\/generate|runInitialCoreCreation|buildConceptGeometry|router\.push|\/workshop["']/);
assert.doesNotMatch(page, /setInterval|setTimeout|percentage|confidence score/i);
assert.equal((page.match(/createProject\(/g) ?? []).length, 1, "ASK REV owns one canonical Project creation point");
const askRev = page.slice(page.indexOf("async function askRev"), page.indexOf("function answerQuestion"));
assert.ok(askRev.indexOf("assessCreationIntent") < askRev.indexOf("createProject"), "safety must clear before Project creation");
assert.match(askRev, /isMatchingHomeProject/, "a repeated matching action must reuse the canonical Project");

console.log("Provider-free Home orchestration fixtures: PASS");
