import type { Project } from "../core/project";
import type { WorkshopBenchId } from "./workshopBrain";

export type RevWorkingSource = {
  id: string;
  kind: "original-observation" | "timeline" | "bench-note" | "source-evidence-interpretation";
  label: string;
  text: string;
};

export type RevBenchWorkingContext = {
  known: Array<{ text: string; sourceIds: string[] }>;
  prepared: string[];
  missingQuestion: string | null;
  sources: RevWorkingSource[];
};

export type RevWorkingUnderstanding = {
  sources: RevWorkingSource[];
  byBench: Record<WorkshopBenchId, RevBenchWorkingContext>;
  conceptBrief: RevConceptBriefWorkingContext;
};

export type RevWorkingValue = { text: string; sourceIds: string[] };

export type RevConceptBriefWorkingContext = {
  proposedSolution: RevWorkingValue | null;
  operatingConcept: RevWorkingValue | null;
  functionalElements: RevWorkingValue | null;
  arrangement: RevWorkingValue | null;
  userInteraction: RevWorkingValue | null;
  constraints: RevWorkingValue[];
};

export type WorkingBenchNote = { question: string; answer: string };
export type WorkingBenchNotes = Partial<Record<WorkshopBenchId, WorkingBenchNote[]>>;
export type RoutedVisualInterpretation = {
  evidenceReference: string;
  factualSummary: string;
  visualObservations: string[];
  uncertainties: string[];
};

const categoryPatterns = {
  purpose: /\b(problem|purpose|help|helps|prevent|improve|solve|allow|enable|designed|used to|so that)\b/i,
  user: /\b(user|people|person|child|adult|worker|driver|customer|operator|homeowner|inventor)\b/i,
  form: /\b(shape|size|tall|wide|long|small|large|mm|cm|metre|meter|inch|foot|feet|colour|color)\b/i,
  build: /\b(part|component|material|steel|metal|aluminium|aluminum|plastic|timber|wood|fabric|glass|rubber)\b/i,
  operation: /\b(move|moves|moved|moving|rotate|rotates|rotated|rotating|turn|turns|turned|turning|present|presents|presented|presenting|fold|folds|folded|folding|slide|slides|slid|sliding|open|opens|opened|opening|close|closes|closed|closing|adjust|adjusts|adjusted|adjusting|power|powers|powered|powering|battery|electric|manual|motor|sensor|software)\b/i,
  constraint: /\b(safe|safety|risk|weather|heat|weight|cost|limit|strong|strength|waterproof|outdoor|indoor)\b/i,
  difference: /\b(different|better|faster|easier|cheaper|unique|unlike|improvement)\b/i,
};

type Category = keyof typeof categoryPatterns;

const conceptFacetPatterns = {
  purposeProblemBenefit: /\b(problem|purpose|benefit|help|helps|prevent|improve|solve|allow|enable|designed|intended|used to|so that|safer|easier)\b/i,
  operationMovementPower: /\b(operate|operates|operated|operating|operation|work|works|worked|working|move|moves|moved|moving|rotate|rotates|rotated|rotating|turn|turns|turned|turning|present|presents|presented|presenting|fold|folds|folded|folding|slide|slides|slid|sliding|open|opens|opened|opening|close|closes|closed|closing|adjust|adjusts|adjusted|adjusting|power|powers|powered|powering|battery|electric|manual|motor|sensor|software|switch|switches|switched|switching)\b/i,
  componentsMaterialsAppearance: /\b(has|have|having|include|includes|including|consist|consists|consisting|feature|features|part|component|material|shape|size|tall|wide|long|small|large|mm|cm|metre|meter|inch|foot|feet|colour|color|steel|metal|aluminium|aluminum|plastic|timber|wood|fabric|glass|rubber|light|lights|illuminated|label|labels|face|faces|grip|handle|control|controls)\b/i,
  arrangementProportionRelationship: /\b(arrange|arranged|arrangement|attach|attached|mount|mounted|connect|connected|above|below|behind|rear|front|side|opposing|between|inside|outside|around|perimeter|top|base|proportion|relationship|mm|cm|metre|meter|inch|foot|feet)\b/i,
  userGripControlInteraction: /\b(user|people|person|child|adult|worker|driver|customer|operator|homeowner|inventor|hold|held|grip|handle|carry|portable|press|button|control|controls|interact|interaction)\b/i,
  environmentSafetyConstraint: /\b(safe|safety|risk|weather|heat|weight|cost|limit|constraint|strong|strength|waterproof|outdoor|indoor|road|roadside|site|environment|portable)\b/i,
};

type ConceptFacet = keyof typeof conceptFacetPatterns;

const benchCategories: Record<WorkshopBenchId, Category[]> = {
  knowledge: ["purpose", "user", "form", "build", "operation", "constraint", "difference"],
  engineering: ["form", "build", "operation", "constraint", "purpose"],
  prototype: ["form", "build", "operation", "purpose"],
  validation: ["purpose", "operation", "constraint", "user"],
  patent: ["purpose", "build", "operation", "difference"],
  manufacturing: ["form", "build", "operation", "constraint"],
  marketing: ["user", "purpose", "difference"],
  reality: ["user", "purpose", "operation", "constraint", "difference"],
};

const preparedByBench: Record<WorkshopBenchId, string> = {
  knowledge: "Your original description is already the starting point. Use this bench only to add a thought or correct REV.",
  engineering: "REV has routed the useful form, construction, operation, and constraint details here for design development.",
  prototype: "REV has prepared the current design context so Prototype can stay in the same concept family.",
  validation: "REV has prepared the intended result and known operating limits as the basis for the smallest useful check.",
  patent: "REV has prepared the described purpose, mechanism, and differences for an early IP review; this is not legal advice.",
  manufacturing: "REV has prepared the known parts, materials, scale, and constraints for build and cost thinking.",
  marketing: "REV has prepared the known user, problem, benefit, and points of difference for market thinking.",
  reality: "REV has prepared the known value, operation, and constraints for a practical reality check.",
};

const missingByBench: Record<WorkshopBenchId, Array<[Category, string]>> = {
  knowledge: [],
  engineering: [["form", "What rough size or shape matters most to the design?"], ["operation", "What is the most important action the invention must perform?"], ["build", "What main part or material should REV account for?"]],
  prototype: [["form", "What visual feature must the prototype make clear?"], ["operation", "What movement or working relationship must the prototype preserve?"]],
  validation: [["purpose", "What single result would show the invention is helping?"], ["constraint", "What is the most important limit or risk to check first?"]],
  patent: [["difference", "What do you believe is most different about this invention?"]],
  manufacturing: [["build", "What main material or part should the build plan account for first?"], ["form", "What rough scale should manufacturing assume?"]],
  marketing: [["user", "Who would benefit from this invention first?"], ["difference", "Why would they choose it over what they use now?"]],
  reality: [["constraint", "What real-world limit could most affect whether this succeeds?"], ["user", "Who needs to find this practical to use?"]],
};

const ENGINEERING_REFERENCE_ALIGNMENT_QUESTION = "Which parts of the reference image should REV keep or change?";
const referenceRelationshipPattern = /\b(reference|image|photo|sketch)\b[\s\S]*\b(keep|keeps|kept|retain|retains|retained|use|uses|used|change|changes|changed|different|differ|same|match|matches|matched|copy|copies|copied|adapt|adapts|adapted)\b|\b(keep|keeps|kept|retain|retains|retained|use|uses|used|change|changes|changed|different|differ|same|match|matches|matched|copy|copies|copied|adapt|adapts|adapted)\b[\s\S]*\b(reference|image|photo|sketch)\b/i;

function statements(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map((value) => value.trim()).filter(Boolean);
}

function categoriesFor(text: string): Category[] {
  return (Object.entries(categoryPatterns) as Array<[Category, RegExp]>)
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category);
}

function conceptFacetsFor(text: string): ConceptFacet[] {
  return (Object.entries(conceptFacetPatterns) as Array<[ConceptFacet, RegExp]>)
    .filter(([, pattern]) => pattern.test(text))
    .map(([facet]) => facet);
}

function workingValue(
  facts: Array<{ text: string; sourceIds: string[]; conceptFacets: ConceptFacet[] }>,
  facets: ConceptFacet[]
): RevWorkingValue | null {
  const matching = facts.filter((fact) => fact.conceptFacets.some((facet) => facets.includes(facet)));
  if (!matching.length) return null;
  return {
    text: Array.from(new Set(matching.map((fact) => fact.text))).join(" "),
    sourceIds: Array.from(new Set(matching.flatMap((fact) => fact.sourceIds))),
  };
}

export function assessHomeUnderstanding(
  description: string,
  visualInterpretation?: Pick<RoutedVisualInterpretation, "factualSummary" | "visualObservations">
) {
  const text = description.trim();
  const categories = categoriesFor(text);
  const conceptFacets = conceptFacetsFor(text);
  const hasPurposeOrProblem = categories.includes("purpose") ||
    conceptFacets.includes("purposeProblemBenefit") ||
    /\b(i|we) (want|need)\b|\b(should|must|meant to|intended to|in order to)\b|\bso (a|an|the|people|someone|users?|workers?|operators?)\b/i.test(text);
  const hasFunctionalOrContextDetail = categories.some((category) =>
    category === "user" || category === "operation" || category === "constraint"
  ) || conceptFacets.some((facet) =>
    facet === "operationMovementPower" ||
    facet === "userGripControlInteraction" ||
    facet === "environmentSafetyConstraint"
  );
  const ready = Boolean(text) && hasPurposeOrProblem && hasFunctionalOrContextDetail;
  const helperQuestion = !hasPurposeOrProblem
    ? "What problem should this invention solve?"
    : !categories.includes("operation")
      ? "How should the invention work when someone uses it?"
      : !categories.includes("form") && !categories.includes("build")
        ? "What main parts, shape, or size do you already imagine?"
        : "What one detail would matter most if REV began developing this now?";
  return {
    ready,
    helperQuestion,
    supportingReferenceAvailable: Boolean(
      visualInterpretation?.factualSummary.trim() || visualInterpretation?.visualObservations.some((item) => item.trim())
    ),
  };
}

export function deriveRevWorkingUnderstanding(
  project: Project,
  notes: WorkingBenchNotes,
  visualInterpretations: RoutedVisualInterpretation[] = []
): RevWorkingUnderstanding {
  const sourceImageEvents = project.timeline.filter(
    (event) => event.type === "knowledge-input-recorded" && event.subject?.startsWith("source-image:")
  );
  const sourceImageEventIds = new Set(sourceImageEvents.map((event) => `timeline.${event.id}`));
  const sources: RevWorkingSource[] = [{ id: "project.originalObservation", kind: "original-observation", label: "Original Home description", text: project.originalObservation }];
  project.timeline.forEach((event) => {
    const text = event.response?.trim() || event.description.trim();
    if (text.trim()) sources.push({ id: `timeline.${event.id}`, kind: "timeline", label: event.title, text });
  });
  Object.entries(notes).forEach(([benchId, benchNotes]) => {
    benchNotes?.forEach((note, index) => sources.push({ id: `bench.${benchId}.${index}`, kind: "bench-note", label: `${benchId} bench note: ${note.question}`, text: note.answer }));
  });
  visualInterpretations.forEach((interpretation) => {
    const text = [
      interpretation.factualSummary,
      ...interpretation.visualObservations,
      ...interpretation.uncertainties.map((item) => `Visual uncertainty: ${item}`),
    ].filter(Boolean).join("\n");
    if (text) sources.push({
      id: interpretation.evidenceReference,
      kind: "source-evidence-interpretation",
      label: "REV interpretation of inventor-supplied visual evidence",
      text,
    });
  });

  const facts = sources.flatMap((source) => statements(source.text)
    .filter((text) => !text.startsWith("Visual uncertainty:"))
    .map((text) => {
      const neutralSourceImageRecord = sourceImageEventIds.has(source.id);
      return {
        text,
        sourceIds: [source.id],
        sourceKind: source.kind,
        categories: neutralSourceImageRecord ? [] : categoriesFor(text),
        conceptFacets: neutralSourceImageRecord ? [] : conceptFacetsFor(text),
      };
    }));
  const authoritativeFacts = facts.filter((fact) => {
    if (fact.sourceKind === "original-observation" || fact.sourceKind === "bench-note") return true;
    if (fact.sourceKind !== "timeline") return false;
    const eventId = fact.sourceIds[0]?.slice("timeline.".length);
    const event = project.timeline.find((item) => item.id === eventId);
    return Boolean(event?.response?.trim()) && !sourceImageEventIds.has(fact.sourceIds[0]);
  });
  const authoritativeCategories = new Set(authoritativeFacts.flatMap((fact) => fact.categories));
  const hasReferenceRelationship = Boolean(
    notes.engineering?.some((note) => note.question === ENGINEERING_REFERENCE_ALIGNMENT_QUESTION && note.answer.trim()) ||
    project.timeline.some((event) => event.subject === ENGINEERING_REFERENCE_ALIGNMENT_QUESTION && (event.response?.trim() || event.description.trim())) ||
    authoritativeFacts.some((fact) => referenceRelationshipPattern.test(fact.text))
  );
  const hasDerivedVisualFormOrComponents = visualInterpretations.some((interpretation) =>
    interpretation.visualObservations.some((observation) => observation.trim()) ||
    [interpretation.factualSummary, ...interpretation.visualObservations].some((text) => {
      const categories = categoriesFor(text);
      const facets = conceptFacetsFor(text);
      return categories.includes("form") || categories.includes("build") ||
        facets.includes("componentsMaterialsAppearance") || facets.includes("arrangementProportionRelationship");
    })
  );
  const sourceImageFact = sourceImageEvents.length > 0
    ? [{
        text: "The inventor supplied a visual reference.",
        sourceIds: sourceImageEvents.map((event) => `timeline.${event.id}`),
      }]
    : [];
  const byBench = Object.fromEntries((Object.keys(benchCategories) as WorkshopBenchId[]).map((benchId) => {
    const relevant = facts.filter((fact) => fact.categories.some((category) => benchCategories[benchId].includes(category)));
    const known = [
      ...(relevant.length ? relevant : facts.slice(0, 2)).slice(0, 6).map(({ text, sourceIds }) => ({ text, sourceIds })),
      ...sourceImageFact,
    ].slice(0, 7);
    const available = new Set(relevant.flatMap((fact) => fact.categories));
    const engineeringReferenceQuestion = benchId === "engineering" &&
      sourceImageEvents.length > 0 &&
      hasDerivedVisualFormOrComponents &&
      authoritativeCategories.has("purpose") &&
      authoritativeCategories.has("operation");
    const missingQuestion = benchId === "knowledge"
      ? (notes.knowledge?.length ? null : "What would you like to add or correct?")
      : engineeringReferenceQuestion
        ? (hasReferenceRelationship ? null : ENGINEERING_REFERENCE_ALIGNMENT_QUESTION)
        : missingByBench[benchId].find(([category]) => !available.has(category))?.[1] ?? null;
    return [benchId, { known, prepared: [preparedByBench[benchId]], missingQuestion, sources }];
  })) as Record<WorkshopBenchId, RevBenchWorkingContext>;
  const constraints = facts
    .filter((fact) => fact.conceptFacets.includes("environmentSafetyConstraint"))
    .map(({ text, sourceIds }) => ({ text, sourceIds }));
  return {
    sources,
    byBench,
    conceptBrief: {
      proposedSolution: workingValue(facts, ["purposeProblemBenefit"]),
      operatingConcept: workingValue(facts, ["operationMovementPower"]),
      functionalElements: workingValue(facts, ["componentsMaterialsAppearance"]),
      arrangement: workingValue(facts, ["arrangementProportionRelationship"]),
      userInteraction: workingValue(facts, ["userGripControlInteraction"]),
      constraints,
    },
  };
}
