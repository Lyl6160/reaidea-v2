import type { Project } from "../core/project";
import type { WorkshopBenchId } from "./workshopBrain";

export type RevWorkingSource = {
  id: string;
  kind: "original-observation" | "timeline" | "bench-note";
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
};

export type WorkingBenchNote = { question: string; answer: string };
export type WorkingBenchNotes = Partial<Record<WorkshopBenchId, WorkingBenchNote[]>>;

const categoryPatterns = {
  purpose: /\b(problem|purpose|help|helps|prevent|improve|solve|allow|enable|designed|used to|so that)\b/i,
  user: /\b(user|people|person|child|adult|worker|driver|customer|operator|homeowner|inventor)\b/i,
  form: /\b(shape|size|tall|wide|long|small|large|mm|cm|metre|meter|inch|foot|feet|colour|color)\b/i,
  build: /\b(part|component|material|steel|metal|aluminium|aluminum|plastic|timber|wood|fabric|glass|rubber)\b/i,
  operation: /\b(move|moves|moving|rotate|turn|fold|slide|open|close|adjust|power|battery|electric|manual|motor|sensor|software)\b/i,
  constraint: /\b(safe|safety|risk|weather|heat|weight|cost|limit|strong|strength|waterproof|outdoor|indoor)\b/i,
  difference: /\b(different|better|faster|easier|cheaper|unique|unlike|improvement)\b/i,
};

type Category = keyof typeof categoryPatterns;

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

function statements(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map((value) => value.trim()).filter(Boolean);
}

function categoriesFor(text: string): Category[] {
  return (Object.entries(categoryPatterns) as Array<[Category, RegExp]>)
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category);
}

export function assessHomeUnderstanding(description: string) {
  const text = description.trim();
  const categories = categoriesFor(text);
  const score = Math.min(100, Math.round(Math.min(text.length, 240) / 4.8) + categories.length * 8);
  const ready = text.length >= 100 && categories.length >= 2 || text.length >= 180;
  const helperQuestion = !categories.includes("purpose")
    ? "What problem should this invention solve?"
    : !categories.includes("operation")
      ? "How should the invention work when someone uses it?"
      : !categories.includes("form") && !categories.includes("build")
        ? "What main parts, shape, or size do you already imagine?"
        : "What one detail would matter most if REV began developing this now?";
  return { score, ready, helperQuestion };
}

export function deriveRevWorkingUnderstanding(project: Project, notes: WorkingBenchNotes): RevWorkingUnderstanding {
  const sources: RevWorkingSource[] = [{ id: "project.originalObservation", kind: "original-observation", label: "Original Home description", text: project.originalObservation }];
  project.timeline.forEach((event) => {
    const text = [event.title, event.description, event.subject, event.response].filter(Boolean).join(" — ");
    if (text.trim()) sources.push({ id: `timeline.${event.id}`, kind: "timeline", label: event.title, text });
  });
  Object.entries(notes).forEach(([benchId, benchNotes]) => {
    benchNotes?.forEach((note, index) => sources.push({ id: `bench.${benchId}.${index}`, kind: "bench-note", label: `${benchId} bench note`, text: `${note.question} — ${note.answer}` }));
  });

  const facts = sources.flatMap((source) => statements(source.text).map((text) => ({ text, sourceIds: [source.id], categories: categoriesFor(text) })));
  const byBench = Object.fromEntries((Object.keys(benchCategories) as WorkshopBenchId[]).map((benchId) => {
    const relevant = facts.filter((fact) => fact.categories.some((category) => benchCategories[benchId].includes(category)));
    const known = (relevant.length ? relevant : facts.slice(0, 2)).slice(0, 6).map(({ text, sourceIds }) => ({ text, sourceIds }));
    const available = new Set(relevant.flatMap((fact) => fact.categories));
    const missingQuestion = benchId === "knowledge"
      ? (notes.knowledge?.length ? null : "What would you like to add or correct?")
      : missingByBench[benchId].find(([category]) => !available.has(category))?.[1] ?? null;
    return [benchId, { known, prepared: [preparedByBench[benchId]], missingQuestion, sources }];
  })) as Record<WorkshopBenchId, RevBenchWorkingContext>;
  return { sources, byBench };
}
