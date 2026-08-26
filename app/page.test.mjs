import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

assert.match(page, /"ASK REV"/);
assert.match(page, /\/api\/creation-intent/);
assert.match(page, /\/api\/understanding\/image/);
assert.match(page, /createInitialHomeKnowledge/);
assert.match(page, /persistAndReload/);
assert.match(page, /NEXT_PUBLIC_REAIDEA_HAI2_MOCK_CAPABILITY/);
assert.match(page, /if \(!HAI2_MOCK_ROUTE_AVAILABLE\)/, "normal disabled Home must remain on HAI-1 without a route request");
assert.match(page, /recordHomeUnderstandingOperationStarted/);
assert.match(page, /deriveHomeKnowledgeBasisRevision/);
const prepareUnderstanding = page.slice(page.indexOf("async function prepareNextUnderstandingStep"), page.indexOf("function localHai2Fallback"));
assert.ok(prepareUnderstanding.indexOf("if (!HAI2_MOCK_ROUTE_AVAILABLE)") < prepareUnderstanding.indexOf('fetch("/api/understanding/text"'), "the mock capability gate must precede the route call");
assert.ok(prepareUnderstanding.indexOf("recordHomeUnderstandingOperationStarted") < prepareUnderstanding.indexOf('fetch("/api/understanding/text"'), "the started receipt must persist before the route call");
assert.ok(prepareUnderstanding.lastIndexOf("deriveHomeKnowledgeBasisRevision") > prepareUnderstanding.indexOf('fetch("/api/understanding/text"'), "the basis must be rechecked after the response");
assert.doesNotMatch(page, /\/api\/concepts\/generate|runInitialCoreCreation|buildConceptGeometry|router\.push|\/workshop["']/);
assert.doesNotMatch(page, /setInterval|setTimeout|percentage|confidence score/i);
assert.equal((page.match(/createProject\(/g) ?? []).length, 1, "ASK REV owns one canonical Project creation point");
const askRev = page.slice(page.indexOf("async function askRev"), page.indexOf("function answerQuestion"));
assert.ok(askRev.indexOf("assessCreationIntent") < askRev.indexOf("createProject"), "safety must clear before Project creation");
assert.match(askRev, /isMatchingHomeProject/, "a repeated matching action must reuse the canonical Project");

console.log("Provider-free Home orchestration fixtures: PASS");
