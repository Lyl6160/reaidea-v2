import assert from "node:assert/strict";
import fs from "node:fs";

import { createProject, type Project } from "../core/project";
import {
  HOME_UNDERSTANDING_STAGES,
  claimHomeKnowledgePresentation,
  createInitialHomeKnowledge,
  deriveActiveHomeKnowledge,
  deriveBlockingHomeConflicts,
  deriveHomeEvidenceCoverage,
  ensureHomeUnderstandingQuestion,
  getActiveHomeQuestion,
  getPulseEligibleKnowledge,
  isMatchingHomeProject,
  recordHomeUnderstandingAnswer,
  type HomeUnderstandingEventFactory,
} from "./homeUnderstanding";

function factory(prefix: string): HomeUnderstandingEventFactory {
  let index = 0;
  return {
    now: "2026-08-26T10:00:00.000Z",
    nextId: () => `${prefix}-${++index}`,
  };
}

function project(description: string): Project {
  return createProject({ ownerId: "inventor-fixture", originalObservation: description, originIntent: "developing" });
}

const fixtureDescriptions = [
  "I want eyewear portrayed on a person’s face, with a large mirrored front form, a rubber rim and a rear retaining strap that holds the assembly in place underwater.",
  "I want a portable illuminated traffic-control system that one person can operate beside a road. Two faces change remotely above a stable wheeled base with four supporting legs.",
  "I want a countertop organising device with three removable bins arranged side by side so a cook can separate utensils and lift each bin for cleaning.",
] as const;

for (const [index, description] of fixtureDescriptions.entries()) {
  const seeded = createInitialHomeKnowledge(project(description), [], factory(`fixture-${index}`));
  const coverage = deriveHomeEvidenceCoverage(seeded);
  assert.equal(coverage.ready, true, `fixture ${index + 1} should satisfy persisted evidence readiness`);
  assert.deepEqual(coverage.completedStages, HOME_UNDERSTANDING_STAGES);
}

const countertopDescription = "A countertop device that peels oranges without the user holding a knife.";
let countertopProject = createInitialHomeKnowledge(project(countertopDescription), [], factory("countertop"));
const countertopKnowledge = deriveActiveHomeKnowledge(countertopProject);
const countertopValues = countertopKnowledge.map((fact) => fact.value);
assert.equal(new Set(countertopValues.map((value) => value.toLocaleLowerCase())).size, countertopValues.length, "initial knowledge values must be distinct");
assert.deepEqual(
  countertopKnowledge.map(({ category, value }) => ({ category, value })),
  [
    { category: "overall-form", value: "A countertop device." },
    { category: "purpose-use", value: "Peels oranges." },
    { category: "must-avoid", value: "Without the user holding a knife." },
  ],
  "the complete description must be conservatively separated into category-specific facts"
);
assert.ok(countertopValues.every((value) => value !== countertopDescription), "the complete description must not be repeated as visible knowledge");
countertopProject = ensureHomeUnderstandingQuestion(countertopProject, factory("countertop-question"));
assert.equal(getActiveHomeQuestion(countertopProject)?.targetCategory, "major-parts", "a supported purpose must not be asked again");

for (const [description, expectedPurpose] of [
  ["A handheld tool that trims sheet material without exposed blades.", "Trims sheet material."],
  ["A sorting system used to separate recyclable items.", "Separate recyclable items."],
  ["A device for reducing hand strain.", "Reducing hand strain."],
] as const) {
  const facts = deriveActiveHomeKnowledge(createInitialHomeKnowledge(project(description), [], factory("general")));
  assert.equal(facts.find((fact) => fact.category === "purpose-use")?.value, expectedPurpose);
  assert.ok(facts.some((fact) => fact.category === "overall-form"), "a general physical form must remain source-backed");
}

const conservativeFacts = deriveActiveHomeKnowledge(
  createInitialHomeKnowledge(project("A compact device that sorts small items."), [], factory("conservative"))
);
assert.doesNotMatch(conservativeFacts.map((fact) => fact.value).join(" "), /motor|sensor|metal|dimensions?|automatic/i, "unsupported details must not be invented");

const source = fs.readFileSync("app/lib/workshop/homeUnderstanding.ts", "utf8");
assert.doesNotMatch(source, /surf eyewear|STOP\/GO|household invention/i, "production rules must not contain fixture intelligence");
assert.doesNotMatch(source, /orange|peeler|countertop/i, "production extraction must not contain walkthrough-specific intelligence");
assert.doesNotMatch(source, /wordCount|characterCount|confidence|percentage/i, "readiness must not use text or confidence scores");

const exactObservation = "  I want a physical form that helps organise a workspace.\nKeep my wording.  ";
assert.equal(project(exactObservation).originalObservation, exactObservation, "Project must preserve the exact original observation");
const matchingProject = project(exactObservation);
assert.equal(isMatchingHomeProject(matchingProject, "I want a physical form that helps organise a workspace. Keep my wording.", "developing"), true);
assert.equal(isMatchingHomeProject(matchingProject, "A materially different invention.", "developing"), false);

let incomplete = createInitialHomeKnowledge(
  project("I want an invention that helps a person prepare items."),
  [{ sourceReference: "source-image:fixture", value: "A clear photograph shows a rectangular object with several details." }],
  factory("seed")
);
assert.equal(deriveHomeEvidenceCoverage(incomplete).ready, false, "derived reference support cannot complete inventor evidence coverage");
assert.equal(deriveActiveHomeKnowledge(incomplete).find((fact) => fact.sourceKind === "cleared-reference")?.authority, "derived-support");

incomplete = ensureHomeUnderstandingQuestion(incomplete, factory("question"));
const firstQuestion = getActiveHomeQuestion(incomplete);
assert.ok(firstQuestion, "one question should be persisted");
const questionCount = incomplete.timeline.filter((event) => event.homeUnderstanding?.kind === "question").length;
incomplete = ensureHomeUnderstandingQuestion(incomplete, factory("question-again"));
assert.equal(incomplete.timeline.filter((event) => event.homeUnderstanding?.kind === "question").length, questionCount, "the active question must not repeat");

assert.equal(recordHomeUnderstandingAnswer(incomplete, "other-project-question", { kind: "own-words", value: "A body." }, factory("wrong")).kind, "invalid");
assert.equal(recordHomeUnderstandingAnswer(incomplete, firstQuestion.eventId, { kind: "own-words", value: "   " }, factory("empty")).kind, "invalid");

const ownWords = recordHomeUnderstandingAnswer(
  incomplete,
  firstQuestion.eventId,
  { kind: "own-words", value: "A compact freestanding body." },
  factory("answer")
);
assert.equal(ownWords.kind, "recorded");
assert.equal(ownWords.kind === "recorded" && deriveActiveHomeKnowledge(ownWords.project).at(-1)?.authority, "inventor-authored");
assert.equal(ownWords.kind === "recorded" && getPulseEligibleKnowledge(ownWords.project)?.eventId, ownWords.kind === "recorded" ? ownWords.knowledgeEventId : "");

if (ownWords.kind === "recorded") {
  const claimed = claimHomeKnowledgePresentation(ownWords.project, ownWords.knowledgeEventId, factory("claim"));
  assert.equal(getPulseEligibleKnowledge(claimed), null, "a persisted presentation claim prevents refresh replay");
  assert.equal(claimHomeKnowledgePresentation(claimed, ownWords.knowledgeEventId, factory("claim-again")), claimed, "a claimed event cannot pulse twice");
}

let choiceProject = createInitialHomeKnowledge(project("I want an invention that helps a person complete a task."), [], factory("choice-seed"));
choiceProject = ensureHomeUnderstandingQuestion(choiceProject, factory("choice-question"));
const choiceQuestion = getActiveHomeQuestion(choiceProject);
assert.ok(choiceQuestion?.choices.length, "a truthful form question should offer concise choices");
const choiceResult = recordHomeUnderstandingAnswer(choiceProject, choiceQuestion.eventId, { kind: "choice", choiceId: choiceQuestion.choices[0].id }, factory("choice-answer"));
assert.equal(choiceResult.kind, "recorded");

if (choiceResult.kind === "recorded") {
  const recommendationProject = ensureHomeUnderstandingQuestion(choiceResult.project, factory("recommend-question"));
  const recommendationQuestion = getActiveHomeQuestion(recommendationProject);
  assert.ok(recommendationQuestion?.recommendation, "REV may recommend only from persisted supporting evidence");
  const recommendationResult = recordHomeUnderstandingAnswer(recommendationProject, recommendationQuestion.eventId, { kind: "rev-recommendation" }, factory("recommend-answer"));
  assert.equal(recommendationResult.kind, "recorded");
  if (recommendationResult.kind === "recorded") {
    const fact = deriveActiveHomeKnowledge(recommendationResult.project).at(-1);
    assert.equal(fact?.authority, "rev-recommended");
    assert.equal(fact?.reversibleAssumption, true);
    assert.ok(fact?.supportingSourceIds?.length);
  }
}

const conflictProject = structuredClone(incomplete);
const activeQuestion = getActiveHomeQuestion(conflictProject);
assert.ok(activeQuestion);
conflictProject.timeline.push(
  {
    id: "conflict-a",
    type: "home-understanding-knowledge-recorded",
    title: "Conflicting answer",
    description: "Fixture conflict A.",
    createdAt: "2026-08-26T10:01:00.000Z",
    homeUnderstanding: { kind: "knowledge", knowledge: { version: 1, category: activeQuestion.targetCategory, value: "First answer", sourceKind: "inventor-answer", sourceReference: "fixture", authority: "inventor-authored", reversibleAssumption: false, questionEventId: activeQuestion.eventId, sequence: 90, createdAt: "2026-08-26T10:01:00.000Z" } },
  },
  {
    id: "conflict-b",
    type: "home-understanding-knowledge-recorded",
    title: "Conflicting answer",
    description: "Fixture conflict B.",
    createdAt: "2026-08-26T10:02:00.000Z",
    homeUnderstanding: { kind: "knowledge", knowledge: { version: 1, category: activeQuestion.targetCategory, value: "Second answer", sourceKind: "inventor-answer", sourceReference: "fixture", authority: "inventor-authored", reversibleAssumption: false, questionEventId: activeQuestion.eventId, sequence: 91, createdAt: "2026-08-26T10:02:00.000Z" } },
  }
);
assert.deepEqual(deriveBlockingHomeConflicts(conflictProject), ["conflict-a", "conflict-b"]);
conflictProject.timeline.push({
  id: "superseding-answer",
  type: "home-understanding-knowledge-recorded",
  title: "Corrected answer",
  description: "Fixture correction.",
  createdAt: "2026-08-26T10:03:00.000Z",
  homeUnderstanding: { kind: "knowledge", knowledge: { version: 1, category: activeQuestion.targetCategory, value: "Corrected answer", sourceKind: "inventor-answer", sourceReference: "fixture", authority: "inventor-authored", reversibleAssumption: false, questionEventId: activeQuestion.eventId, supersedesEventId: "conflict-b", sequence: 92, createdAt: "2026-08-26T10:03:00.000Z" } },
});
assert.ok(!deriveActiveHomeKnowledge(conflictProject).some((fact) => fact.eventId === "conflict-b"), "superseded knowledge must not remain active");

console.log("Provider-free Home understanding fixtures: PASS");
