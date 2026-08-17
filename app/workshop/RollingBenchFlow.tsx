"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { WorkshopBenchId } from "../lib/workshop/workshopBrain";

export type BenchNote = {
  question: string;
  answer: string;
};

type BenchQuestion = { prompt: string; helper?: string };

type RollingBenchFlowProps = {
  benchId: WorkshopBenchId;
  projectId: string;
  externalNotes?: BenchNote[];
  onSaveExternal?: (answer: string) => boolean;
  error?: string;
  modelView?: ReactNode;
  modelReady?: boolean;
  canCreateModel?: boolean;
  modelUpdating?: boolean;
  modelJustUpdated?: boolean;
  currentRevision?: number;
  previousAvailable?: boolean;
  viewingPrevious?: boolean;
  refinementDraft?: string;
  onRefinementDraftChange?: (value: string) => void;
  onCreateModel?: () => void;
  onUpdateModel?: () => void;
  onViewPrevious?: () => void;
  onGoToBench: (benchId: WorkshopBenchId) => void;
  onBack: () => void;
  testingOutcome?: "pending" | "supported" | "not-supported" | "inconclusive";
  onTestingOutcomeChange?: (outcome: "supported" | "not-supported" | "inconclusive") => void;
  onProgressChange?: (answered: number, total: number) => void;
};

const FLOW: Record<Exclude<WorkshopBenchId, "prototype">, {
  title: string;
  purpose: string;
  questions: BenchQuestion[];
  summary: string;
  completion: string;
  next?: WorkshopBenchId;
  nextLabel?: string;
}> = {
  knowledge: {
    title: "Inventor's Bench",
    purpose: "Help REV understand your invention well enough to begin developing the design.",
    questions: [
      { prompt: "What is your invention intended to do?", helper: "Tell REV, in simple words, what you want your invention to achieve." },
      { prompt: "What problem are you trying to fix?", helper: "Tell REV what is happening now that you want your invention to improve or solve." },
      { prompt: "Who is having this problem?", helper: "Tell REV who is affected most by the problem." },
      { prompt: "How do you imagine your invention helping with the problem?", helper: "Tell REV what you think your invention would change or make better." },
      { prompt: "What would make your invention better than what people use now?", helper: "Tell REV what you want it to do better, easier, safer, faster, cheaper, or differently." },
      { prompt: "Have you seen anything similar to your invention already?", helper: "Tell REV about anything you've seen that is similar, and what you would want to do differently." },
    ],
    summary: "YOUR INVENTION NOTES",
    completion: "Thanks — I now have a clear understanding of your invention. Return to the Workshop, or open Engineering so we can develop the design in more detail.",
    next: "engineering",
    nextLabel: "OPEN ENGINEERING BENCH",
  },
  engineering: {
    title: "Engineering Bench",
    purpose: "Turn your invention into a clear design REV can model.",
    questions: [
      { prompt: "Describe your design in more detail.", helper: "Tell REV what you picture in your head — its shape, layout, main parts, colours, or anything else you can already see." },
      { prompt: "Do you have a rough size or dimensions in mind?", helper: "Approximate measurements are fine. If you're not sure yet, tell REV what you imagine." },
      { prompt: "What materials are you considering?", helper: "For example steel, aluminium, plastic, timber, fabric — or tell REV if you're not sure yet." },
      { prompt: "What are the main parts of your design?", helper: "Tell REV about the important pieces you think it needs." },
      { prompt: "How do those parts work together?", helper: "Tell REV what moves, connects, turns, carries, powers, controls, or interacts with something else." },
      { prompt: "Does anything need to move, fold, rotate, open, slide, or adjust?", helper: "Describe any movement you imagine in the design." },
      { prompt: "Does your invention need power or another input to work?", helper: "For example electricity, batteries, fuel, water, air, manual force, software, data — or none at all." },
      { prompt: "What problems, limits, or safety issues should we allow for?", helper: "Think about things like weight, weather, heat, strength, cost, people using it, or where it will operate." },
    ],
    summary: "DESIGN NOTES",
    completion: "Thanks — I now have enough design information to develop your engineering model.",
    next: "prototype",
    nextLabel: "CREATE / UPDATE DESIGN MODEL",
  },
  validation: {
    title: "Testing Bench",
    purpose: "Check important parts of your invention and learn what works.",
    questions: [
      { prompt: "What part of your invention do you want to check?", helper: "Tell REV what you want to check first." },
      { prompt: "What do you expect it to do?", helper: "Tell REV what you think should happen if the idea works." },
      { prompt: "What do we need to find out?", helper: "REV suggests: choose the simplest check that gives you something useful to observe or measure." },
      { prompt: "What happened?", helper: "Tell REV what you saw, measured, or experienced." },
      { prompt: "What did we learn from the test?", helper: "Did it work as expected, partly work, or show something that needs changing?" },
    ],
    summary: "TEST NOTES",
    completion: "Thanks — we now know more about how your invention performs.",
    next: "patent",
    nextLabel: "CONTINUE",
  },
  patent: {
    title: "Patent / IP Bench",
    purpose: "What is already out there, and what makes this invention different?",
    questions: [
      { prompt: "What part of your invention do you think is most different?" },
      { prompt: "Have you seen anything that works in a similar way?" },
      { prompt: "What part of your design would you most want to protect?" },
      { prompt: "What should REV look into further?" },
    ],
    summary: "WHAT MAY BE DIFFERENT ABOUT YOUR INVENTION",
    completion: "You have recorded the main differences worth checking further.",
    next: "manufacturing",
    nextLabel: "OPEN MANUFACTURING & COSTING BENCH",
  },
  manufacturing: {
    title: "Manufacturing & Costing Bench",
    purpose: "Can we build it, what will we need, and what might it cost?",
    questions: [
      { prompt: "What parts would need to be made or bought?" },
      { prompt: "What materials are you thinking about?" },
      { prompt: "How do you imagine it being built or put together?" },
      { prompt: "Are there any parts you would need to buy from a supplier?" },
      { prompt: "What do you think will cost the most?" },
    ],
    summary: "BUILD SUMMARY",
    completion: "Thanks — I now have a good picture of how your invention could be built and where the main costs may be.",
    next: "marketing",
    nextLabel: "OPEN MARKETING BENCH",
  },
  marketing: {
    title: "Marketing Bench",
    purpose: "Who wants it, why would they want it, and what do we still need to learn about the market?",
    questions: [
      { prompt: "Who do you think would use or buy this?" },
      { prompt: "What problem does it solve for them?" },
      { prompt: "Why would they choose your invention instead of what they use now?" },
      { prompt: "Where would people normally find or buy something like this?" },
      { prompt: "What do we still need to learn about the market?", helper: "REV suggests: check what similar products cost and who currently buys them." },
    ],
    summary: "MARKET SUMMARY",
    completion: "Thanks — I now have a good picture of who this invention may help and why they might want it.",
    next: "reality",
    nextLabel: "OPEN REALITY BENCH",
  },
  reality: {
    title: "Reality Bench",
    purpose: "Does this invention make sense in the real world?",
    questions: [
      { prompt: "Would people actually use it?" },
      { prompt: "Can it realistically be built and used?" },
      { prompt: "Does the likely cost make sense for the value it provides?" },
      { prompt: "Is there anything important that could stop it succeeding?" },
    ],
    summary: "REALITY CHECK",
    completion: "REV has enough notes to show what looks strong and what still needs attention. This is guidance, not proof of commercial success.",
  },
};

function storageKey(projectId: string, benchId: WorkshopBenchId) {
  return `reaidea.workshop.bench-flow.v1.${projectId}.${benchId}`;
}

export default function RollingBenchFlow(props: RollingBenchFlowProps) {
  const { benchId, projectId } = props;
  const [localNotes, setLocalNotes] = useState<BenchNote[]>(() => {
    if (benchId === "prototype" || props.externalNotes || typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(storageKey(projectId, benchId));
      return saved ? JSON.parse(saved) as BenchNote[] : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");

  const notes = props.externalNotes ?? localNotes;
  const flow = benchId === "prototype" ? null : FLOW[benchId];
  const currentQuestion = flow?.questions[Math.min(notes.length, flow.questions.length - 1)];
  const complete = Boolean(flow && notes.length >= flow.questions.length);

  const progress = useMemo(() => {
    if (!flow) return props.modelReady ? "yellow" : "red";
    if (complete) return "green";
    return notes.length > 0 ? "yellow" : "red";
  }, [complete, flow, notes.length, props.modelReady]);

  function save() {
    if (!currentQuestion || !draft.trim()) {
      setLocalError("Write your answer before continuing.");
      return;
    }
    if (benchId === "validation" && notes.length === 4 && props.testingOutcome === "pending") {
      setLocalError("Choose WORKED, STILL UNSURE, or NEEDS IMPROVEMENT before continuing.");
      return;
    }
    if (props.onSaveExternal) {
      if (!props.onSaveExternal(draft.trim())) return;
    } else {
      const next = [...notes, { question: currentQuestion.prompt, answer: draft.trim() }];
      setLocalNotes(next);
      window.localStorage.setItem(storageKey(projectId, benchId), JSON.stringify(next));
    }
    props.onProgressChange?.(notes.length + 1, flow.questions.length);
    setDraft("");
    setLocalError("");
  }

  if (benchId === "prototype") {
    return (
      <section className="rolling-bench-flow prototype-rolling-flow" data-progress={progress} aria-label="Prototype Bench work area">
        <header><div><span>ACTIVE BENCH</span><h2>Prototype Bench</h2><p>Turn the current design into a working visual model and refine it until it matches what you have in mind.</p></div><b>{progress.toUpperCase()}</b></header>
        <div className="prototype-model-stage">{props.modelView}</div>
        {props.modelUpdating && <p className="model-working-state" role="status">REV is updating your design — please wait…</p>}
        {!props.modelUpdating && props.modelJustUpdated && <p className="model-ready-state" role="status">Your updated design is ready.</p>}
        <div className="rolling-bench-main">
          <section className="rev-question-card">
            <span>REV ASKS</span>
            <h3>{props.modelReady ? "What would you like to change?" : "Create the first model when your Engineering notes are ready."}</h3>
            <p>{props.modelReady ? "Tell REV what doesn't look right or what you want changed." : "This begins the first visual version of the same evolving design."}</p>
            {props.modelReady ? <textarea value={props.refinementDraft ?? ""} onChange={(event) => props.onRefinementDraftChange?.(event.target.value)} rows={5} placeholder="For example: make this longer, move this part, or change the shape." /> : null}
            <button type="button" onClick={props.modelReady ? props.onUpdateModel : props.canCreateModel ? props.onCreateModel : () => props.onGoToBench("engineering")} disabled={props.modelUpdating || (props.modelReady && !props.refinementDraft?.trim())}>
              {props.modelUpdating ? "REV IS UPDATING YOUR DESIGN..." : props.modelReady ? "UPDATE MODEL" : props.canCreateModel ? "CREATE FIRST MODEL" : "OPEN ENGINEERING"}
            </button>
            <small>{props.modelReady ? "This creates the next version of the same design." : "The model is an early working representation, not a final or proven design."}</small>
          </section>
          <aside className="bench-notepad"><span>PROTOTYPE NOTEPAD</span><h3>CURRENT DESIGN</h3><p>{props.modelReady ? `Concept · Revision ${props.currentRevision ?? 1}` : "No useful model yet."}</p><h3>LATEST CHANGE</h3><p>{props.refinementDraft?.trim() || "No new correction entered."}</p><h3>PREVIOUS VERSION</h3><p>{props.previousAvailable ? "Available" : "Not available yet"}</p>{props.previousAvailable && <button type="button" onClick={props.onViewPrevious}>{props.viewingPrevious ? "VIEW CURRENT" : "VIEW PREVIOUS"}</button>}</aside>
        </div>
        <footer><button type="button" disabled>ASK REV · COMING LATER</button><button type="button" onClick={props.onBack}>BACK TO WORKSHOP</button><button type="button" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button><button type="button" onClick={() => props.onGoToBench("validation")}>OPEN TESTING BENCH</button></footer>
      </section>
    );
  }

  if (!flow || !currentQuestion) return null;

  return (
    <section className="rolling-bench-flow" data-progress={progress} aria-label={`${flow.title} work area`}>
      <header><div><span>ACTIVE BENCH</span><h2>{flow.title}</h2><p>{flow.purpose}</p></div><b>{progress.toUpperCase()}</b></header>
      <div className="rolling-bench-main">
        <section className="rev-question-card">
          {complete ? <><span>REV</span><h3>{flow.completion}</h3></> : <><span>REV ASKS · QUESTION {notes.length + 1} OF {flow.questions.length}</span><h3>{currentQuestion.prompt}</h3>{currentQuestion.helper && <p>{currentQuestion.helper}</p>}<label><span>YOUR ANSWER</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={6} placeholder="Write your answer in your own words." /></label>{benchId === "engineering" && notes.length === 0 && <button type="button" className="secondary-action" disabled title="File upload is not available in this build.">ADD A SKETCH OR FILE · COMING LATER</button>}{benchId === "validation" && notes.length === 4 && <div className="testing-outcomes"><button type="button" className={props.testingOutcome === "supported" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("supported")}>WORKED</button><button type="button" className={props.testingOutcome === "inconclusive" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("inconclusive")}>STILL UNSURE</button><button type="button" className={props.testingOutcome === "not-supported" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("not-supported")}>NEEDS IMPROVEMENT</button></div>}<button type="button" onClick={save}>SAVE &amp; CONTINUE</button>{(localError || props.error) && <p className="flow-error" role="alert">{localError || props.error}</p>}</>}
          {benchId === "patent" && <p className="legal-note">This is an early check only. It is not legal advice or a patent decision.</p>}
          {benchId === "patent" && <div className="research-unavailable"><strong>SIMILAR PATENTS REV FOUND</strong><p>Live patent research is not yet available. REV will not invent results.</p></div>}
        </section>
        <aside className="bench-notepad"><span>{flow.summary}</span>{benchId === "reality" && <><h3>WHAT LOOKS STRONG</h3><p>Your positive answers will stay visible here.</p><h3>WHAT STILL NEEDS ATTENTION</h3></>}{notes.length === 0 ? <p>Your saved answers will appear here.</p> : notes.map((note, index) => <article key={`${note.question}-${index}`}><strong>REV asked:</strong><p>{note.question}</p><strong>You said:</strong><p>{note.answer}</p></article>)}</aside>
      </div>
      <footer><button type="button" disabled>ASK REV · COMING LATER</button><button type="button" onClick={props.onBack}>BACK TO WORKSHOP</button>{flow.next && <button type="button" onClick={() => props.onGoToBench(flow.next!)}>{flow.nextLabel ?? `OPEN ${FLOW[flow.next as Exclude<WorkshopBenchId, "prototype">]?.title?.toUpperCase() ?? "PROTOTYPE BENCH"}`}</button>}{benchId === "validation" && props.testingOutcome === "not-supported" && <button type="button" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button>}</footer>
    </section>
  );
}
