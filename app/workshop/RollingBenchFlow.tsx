"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

import GenerationProgress from "./GenerationProgress";

import type { ConceptViewId } from "../lib/ai/types";
import type { ConceptGeometry } from "../lib/geometry/conceptGeometry";
import type { WorkshopBenchId } from "../lib/workshop/workshopBrain";
import type { RevBenchWorkingContext } from "../lib/workshop/revWorkingUnderstanding";

const Prototype3DViewer = dynamic(() => import("./Prototype3DViewer"), {
  ssr: false,
  loading: () => <p className="prototype-3d-loading">Preparing 3D model…</p>,
});

export type BenchNote = {
  question: string;
  answer: string;
};

type BenchQuestion = { prompt: string; helper?: string };

type RollingBenchFlowProps = {
  benchId: WorkshopBenchId;
  projectId: string;
  workingContext?: RevBenchWorkingContext;
  onWorkingNotesChange?: () => void;
  externalNotes?: BenchNote[];
  onSaveExternal?: (answer: string, question: string) => boolean;
  error?: string;
  modelView?: ReactNode;
  modelReady?: boolean;
  generatedModelReady?: boolean;
  canCreateModel?: boolean;
  modelUpdating?: boolean;
  modelJustUpdated?: boolean;
  modelActionKind?: "generation" | "refinement" | "view";
  modelPresentationKey?: string;
  modelError?: string;
  currentRevision?: number;
  modelRevisions?: Array<{ revision: number; candidateId: string; changeNote?: string }>;
  viewedRevision?: number;
  conceptLimitReached?: boolean;
  availableViews?: ConceptViewId[];
  selectedView?: ConceptViewId;
  conceptGeometry?: ConceptGeometry;
  refinementDraft?: string;
  onRefinementDraftChange?: (value: string) => void;
  onCreateModel?: () => void;
  onUpdateModel?: () => void;
  onViewRevision?: (revision: number) => void;
  onBackToCurrent?: () => void;
  onDeleteRevision?: (revision: number) => Promise<boolean>;
  onViewChange?: (view: ConceptViewId) => void;
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

export function readRollingBenchNotes(projectId: string, benchId: WorkshopBenchId): BenchNote[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(storageKey(projectId, benchId));
    if (!saved) return [];
    const notes = JSON.parse(saved) as unknown;
    return Array.isArray(notes)
      ? notes.filter((note): note is BenchNote => Boolean(
          note && typeof note === "object" &&
          typeof (note as BenchNote).question === "string" &&
          typeof (note as BenchNote).answer === "string" &&
          (note as BenchNote).answer.trim()
        ))
      : [];
  } catch {
    return [];
  }
}

export function saveRollingBenchNotes(projectId: string, benchId: WorkshopBenchId, notes: BenchNote[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(projectId, benchId), JSON.stringify(notes));
}

function RevWorkingContextPanel({ context }: { context?: RevBenchWorkingContext }) {
  if (!context) return null;
  const sourceById = new Map(context.sources.map((source) => [source.id, source.label]));
  return <section className="rev-working-context" aria-label="REV Working Understanding">
    <div><span>WHAT REV ALREADY KNOWS</span>{context.known.length ? <ul>{context.known.map((fact, index) => <li key={`${fact.text}-${index}`}>{fact.text}<small>Source: {fact.sourceIds.map((id) => sourceById.get(id) ?? id).join(", ")}</small></li>)}</ul> : <p>No relevant detail has been recorded yet.</p>}</div>
    <div><span>WHAT REV PREPARED</span>{context.prepared.map((item) => <p key={item}>{item}</p>)}</div>
  </section>;
}

export default function RollingBenchFlow(props: RollingBenchFlowProps) {
  const { benchId, projectId } = props;
  const [localNotes, setLocalNotes] = useState<BenchNote[]>(() => {
    if (benchId === "prototype" || props.externalNotes || typeof window === "undefined") return [];
    try {
      return readRollingBenchNotes(projectId, benchId);
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [deleteRevision, setDeleteRevision] = useState<number | null>(null);
  const [deletingRevision, setDeletingRevision] = useState(false);
  const [inventorReview, setInventorReview] = useState<"unreviewed" | "yes" | "change">("unreviewed");
  const [prototypeRepresentation, setPrototypeRepresentation] = useState<"2d" | "3d">("2d");
  const [reviewedInventorPresentation, setReviewedInventorPresentation] = useState<string>();
  const inventorSubmissionStartedRef = useRef(false);

  useEffect(() => {
    if (!fullScreenOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullScreenOpen]);

  const notes = props.externalNotes ?? localNotes;
  const baseFlow = benchId === "prototype" ? null : FLOW[benchId];
  const routedQuestion = props.workingContext?.missingQuestion ?? null;
  const flow = baseFlow ? { ...baseFlow, questions: routedQuestion ? [{ prompt: routedQuestion }] : [] } : null;
  const currentQuestion: BenchQuestion | undefined = flow ? { prompt: routedQuestion ?? "" } : undefined;
  const complete = Boolean(flow && (
    !routedQuestion ||
    (props.externalNotes ? notes.length > 0 : notes.some((note) => note.question === routedQuestion))
  ));

  const progress = !flow ? (props.modelReady ? "yellow" : "red") : complete ? "green" : notes.length > 0 ? "yellow" : "red";

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
      if (!props.onSaveExternal(draft.trim(), currentQuestion.prompt)) return;
    } else {
      const next = [...notes, { question: currentQuestion.prompt, answer: draft.trim() }];
      setLocalNotes(next);
      saveRollingBenchNotes(projectId, benchId, next);
      props.onWorkingNotesChange?.();
    }
    props.onProgressChange?.(1, 1);
    setDraft("");
    setLocalError("");
  }

  function saveLocalNote(question: string, answer: string): BenchNote[] {
    const next = [...notes, { question, answer: answer.trim() }];
    setLocalNotes(next);
    saveRollingBenchNotes(projectId, benchId, next);
    props.onWorkingNotesChange?.();
    setDraft("");
    setLocalError("");
    return next;
  }

  function createFirstConcept() {
    if (!draft.trim()) {
      setLocalError("Describe your invention before REV creates the first concept.");
      return;
    }
    if (inventorSubmissionStartedRef.current) return;
    inventorSubmissionStartedRef.current = true;
    saveLocalNote("Describe your invention", draft);
    props.onProgressChange?.(1, 3);
    props.onCreateModel?.();
  }

  function saveContextualAnswer(question: string) {
    if (!draft.trim()) {
      setLocalError("Add your answer before continuing.");
      return;
    }
    const next = saveLocalNote(question, draft);
    props.onRefinementDraftChange?.(draft.trim());
    props.onProgressChange?.(next.length >= 3 || next.map((note) => note.answer).join(" ").length >= 360 ? 3 : 2, 3);
  }

  if (benchId === "knowledge") {
    const initialDescription = props.workingContext?.sources.find((source) => source.kind === "original-observation")?.text ?? notes[0]?.answer ?? "";
    const contextualQuestion = props.workingContext?.missingQuestion
      ? { prompt: props.workingContext.missingQuestion, helper: "Only add the smallest detail REV still needs." }
      : null;
    const inventorPresentation = `${props.currentRevision ?? "none"}:${props.modelPresentationKey ?? "initial"}`;
    const currentInventorReview = reviewedInventorPresentation === inventorPresentation ? inventorReview : "unreviewed";
    const usefulUnderstanding = Boolean(props.modelReady && (!contextualQuestion || notes.length >= 2));
    const inventorProgress = usefulUnderstanding ? "green" : props.modelReady || initialDescription ? "yellow" : "red";
    return (
      <section className="rolling-bench-flow inventor-bench-v2" data-progress={inventorProgress} aria-label="Inventor's Bench work area">
        <header><div><span>ACTIVE BENCH</span><h2>Inventor&apos;s Bench</h2><p>Show REV your idea.</p></div><b>{inventorProgress.toUpperCase()}</b></header>
        <RevWorkingContextPanel context={props.workingContext} />
        {props.modelReady && props.modelView && <section className="inventor-concept-stage" aria-label="Idea Evolving"><div><span>IDEA EVOLVING</span><strong>CONCEPT {String(props.currentRevision ?? 1).padStart(2, "0")}</strong></div>{props.modelView}</section>}
        {props.modelUpdating && <GenerationProgress kind={props.modelActionKind === "view" ? "view" : props.modelReady ? "refinement" : "first-generation"} status="working" />}
        {!props.modelUpdating && props.modelJustUpdated && <GenerationProgress kind={props.modelActionKind === "view" ? "view" : props.currentRevision && props.currentRevision > 1 ? "refinement" : "first-generation"} status="ready" />}
        {!props.modelUpdating && props.modelError && <GenerationProgress kind={props.modelActionKind === "view" ? "view" : props.modelReady ? "refinement" : "first-generation"} status="failed" failureMessage={props.modelReady ? undefined : "REV couldn't create your concept this time."} onRetry={props.modelReady ? props.onUpdateModel : props.onCreateModel} />}
        <div className="rolling-bench-main">
          <section className="rev-question-card inventor-primary-card">
            {!initialDescription ? <><span>REV ASKS</span><h3>Describe your invention</h3><p>Tell REV what it looks like, the main parts you imagine, and anything important you want included. Rough is fine — we&apos;ll use this to create your first visual concept.</p><label><span>YOUR DESCRIPTION</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={9} placeholder="Describe what your invention looks like and what it includes..." /></label><button type="button" className="secondary-action" disabled title="File upload is not available in this build.">ADD A SKETCH OR FILE · COMING LATER</button><button type="button" onClick={createFirstConcept} disabled={props.modelUpdating || !draft.trim()}>BRING MY IDEA TO LIFE</button></> : !props.modelReady ? <><span>YOUR DESCRIPTION</span><h3>{initialDescription}</h3><p>REV has your description and can use it to create the early visual.</p>{!props.modelError && <button type="button" onClick={props.onCreateModel} disabled={props.modelUpdating}>BRING MY IDEA TO LIFE</button>}</> : currentInventorReview === "unreviewed" ? <><span>REV ASKS</span><h3>Is this close to what you had in mind?</h3><p>This is an early concept. Tell REV what looks right or what needs changing.</p><div className="inventor-review-actions"><button type="button" onClick={() => { setReviewedInventorPresentation(inventorPresentation); setInventorReview("yes"); }}>YES — KEEP DEVELOPING</button><button type="button" onClick={() => { setReviewedInventorPresentation(inventorPresentation); setInventorReview("change"); }}>NOT QUITE — LET&apos;S CHANGE IT</button></div></> : currentInventorReview === "change" ? <><span>REV ASKS</span><h3>What would you like to change?</h3><p>Describe the correction. REV will keep this in the same concept family.</p><textarea value={props.refinementDraft ?? ""} onChange={(event) => props.onRefinementDraftChange?.(event.target.value)} rows={7} placeholder="Tell REV what should look or work differently..." /><button type="button" onClick={props.onUpdateModel} disabled={props.modelUpdating || !props.refinementDraft?.trim()}>UPDATE DESIGN</button></> : props.refinementDraft?.trim() ? <><span>REV</span><h3>Update the visual with what you just told REV?</h3><p>The update is deliberate and will create the next revision in the same concept family.</p><div className="inventor-review-actions"><button type="button" onClick={props.onUpdateModel}>UPDATE DESIGN</button><button type="button" onClick={() => props.onRefinementDraftChange?.("")}>KEEP CURRENT VISUAL</button></div></> : contextualQuestion ? <><span>REV ASKS</span><h3>{contextualQuestion.prompt}</h3><p>{contextualQuestion.helper}</p><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={6} placeholder="Add the detail in your own words..." /><button type="button" onClick={() => saveContextualAnswer(contextualQuestion.prompt)}>SAVE ANSWER</button><small>Your answer updates REV&apos;s understanding. It does not generate another image automatically.</small></> : <><span>REV</span><h3>Thanks — I understand your idea now.</h3><p>Let&apos;s move to Engineering and work out the design in more detail.</p><button type="button" onClick={() => props.onGoToBench("engineering")}>OPEN ENGINEERING BENCH</button></>}
            {localError && <p className="flow-error" role="alert">{localError}</p>}
          </section>
          <aside className="bench-notepad inventor-notepad"><span>INVENTOR NOTEPAD</span><h3>WHAT REV UNDERSTANDS</h3><p>{initialDescription || "REV is waiting for your first description."}</p>{notes.map((note, index) => <article key={`${note.question}-${index}`}><strong>REV asked:</strong><p>{note.question}</p><strong>You said:</strong><p>{note.answer}</p></article>)}</aside>
        </div>
        <footer><button type="button" disabled>ASK REV · COMING LATER</button><button type="button" onClick={props.onBack}>BACK TO WORKSHOP</button>{usefulUnderstanding && <button type="button" onClick={() => props.onGoToBench("engineering")}>OPEN ENGINEERING BENCH</button>}</footer>
      </section>
    );
  }

  if (benchId === "prototype") {
    const viewingHistoricalRevision = props.viewedRevision !== undefined && props.viewedRevision !== props.currentRevision;
    const displayedRevision = props.viewedRevision ?? props.currentRevision;
    const viewLabels: Record<ConceptViewId, string> = { iso: "ISOMETRIC", front: "FRONT", side: "SIDE" };
    const viewSelector = <div className="prototype-view-selector" aria-label="Concept views">{(props.availableViews ?? ["iso"]).map((view) => <button key={view} type="button" className={view === props.selectedView ? "is-selected" : ""} aria-pressed={view === props.selectedView} onClick={() => props.onViewChange?.(view)}>{viewLabels[view]}</button>)}</div>;
    const showing3d = prototypeRepresentation === "3d" && Boolean(props.conceptGeometry);
    const displayedModel = showing3d && props.conceptGeometry ? <Prototype3DViewer geometry={props.conceptGeometry} /> : props.modelView;
    const representationSelector = <div className="prototype-representation-selector" aria-label="Prototype representation"><button type="button" className={!showing3d ? "is-selected" : ""} onClick={() => setPrototypeRepresentation("2d")}>2D CONCEPT</button><div className="prototype-3d-control"><button type="button" className={showing3d ? "is-selected" : ""} disabled={!props.conceptGeometry} aria-label={props.conceptGeometry ? "3D MODEL" : "3D MODEL locked — needs more design detail"} onClick={() => setPrototypeRepresentation("3d")}>{props.conceptGeometry ? "3D MODEL" : "3D MODEL 🔒"}</button>{!props.conceptGeometry && <small>Needs more design detail</small>}</div></div>;
    return (
      <section className="rolling-bench-flow prototype-rolling-flow" data-progress={progress} aria-label="Prototype Bench work area">
        <header><div><span>ACTIVE BENCH</span><h2>Prototype Bench</h2><p>Turn the current design into a working visual model and refine it until it matches what you have in mind.</p></div><b>{progress.toUpperCase()}</b></header>
        <RevWorkingContextPanel context={props.workingContext} />
        {displayedModel && <div className="prototype-model-stage"><div className="prototype-model-toolbar"><strong>{viewingHistoricalRevision ? `VIEWING CONCEPT ${String(displayedRevision).padStart(2, "0")}` : `CONCEPT ${String(displayedRevision ?? 1).padStart(2, "0")} · CURRENT`}</strong><button type="button" onClick={() => setFullScreenOpen(true)}>VIEW FULL SCREEN</button></div>{representationSelector}{!showing3d && viewSelector}{!fullScreenOpen && displayedModel}</div>}
        {!props.conceptGeometry && <div className="prototype-3d-unavailable"><strong>3D model needs more design information.</strong><p>Add a few more design details in Engineering, then REV can build the 3D model.</p><button type="button" onClick={() => props.onGoToBench("engineering")}>OPEN ENGINEERING BENCH</button></div>}
        {fullScreenOpen && displayedModel && <div className="prototype-fullscreen" role="dialog" aria-modal="true" aria-label={`Concept ${String(displayedRevision ?? 1).padStart(2, "0")} full screen`}><div className="prototype-fullscreen-toolbar"><strong>{showing3d ? "3D MODEL" : viewingHistoricalRevision ? `VIEWING CONCEPT ${String(displayedRevision).padStart(2, "0")}` : `CONCEPT ${String(displayedRevision ?? 1).padStart(2, "0")} · CURRENT`}</strong><button type="button" onClick={() => setFullScreenOpen(false)}>CLOSE</button></div>{representationSelector}{!showing3d && viewSelector}<div className="prototype-fullscreen-model">{displayedModel}</div></div>}
        {props.modelUpdating && <GenerationProgress kind="refinement" status="working" />}
        {!props.modelUpdating && props.modelJustUpdated && <GenerationProgress kind="refinement" status="ready" />}
        {!props.modelUpdating && props.modelError && <GenerationProgress kind="refinement" status="failed" onRetry={props.onUpdateModel} />}
        <div className="rolling-bench-main">
          <section className="rev-question-card">
            <span>REV ASKS</span>
            <h3>{viewingHistoricalRevision ? `Viewing Concept ${String(displayedRevision).padStart(2, "0")}` : props.conceptLimitReached ? "You've reached 5 design versions for this direction." : props.modelReady ? "What would you like to change?" : "No Engineering design is ready yet."}</h3>
            <p>{viewingHistoricalRevision ? "This saved revision is read only." : props.conceptLimitReached ? "Review the current design or return to Engineering if you want to change the direction." : props.modelReady ? "Tell REV what doesn't look right or what you want changed." : "Complete more of the Engineering Bench first, then return here to build the model."}</p>
            {props.modelReady && !viewingHistoricalRevision && !props.conceptLimitReached ? <textarea value={props.refinementDraft ?? ""} onChange={(event) => props.onRefinementDraftChange?.(event.target.value)} rows={5} placeholder="For example: make this longer, move this part, or change the shape." /> : null}
            {viewingHistoricalRevision ? <button type="button" onClick={props.onBackToCurrent}>BACK TO CURRENT</button> : props.conceptLimitReached ? <div className="prototype-limit-actions"><button type="button" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button><button type="button" onClick={() => document.getElementById("prototype-concept-history")?.scrollIntoView({ behavior: "smooth", block: "nearest" })}>VIEW CONCEPT HISTORY</button></div> : <button type="button" onClick={props.modelReady ? props.onUpdateModel : () => props.onGoToBench("engineering")} disabled={props.modelUpdating || (props.modelReady && !props.refinementDraft?.trim())}>{props.modelUpdating ? "REV IS UPDATING YOUR DESIGN..." : props.modelReady ? "UPDATE MODEL" : "OPEN ENGINEERING BENCH"}</button>}
            <small>{viewingHistoricalRevision ? "Viewing this revision does not change your Project or model history." : props.conceptLimitReached ? "Delete an older saved version if you want to keep refining this direction." : props.modelReady ? "This creates the next version of the same design." : "Prototype will not invent a replacement design."}</small>
          </section>
          <aside id="prototype-concept-history" className="bench-notepad concept-history"><span>CONCEPT HISTORY</span>{props.modelRevisions?.length ? [...props.modelRevisions].sort((left, right) => right.revision - left.revision).map((revision) => <article key={revision.candidateId} className={revision.revision === props.currentRevision ? "is-current" : ""}><div><strong>CONCEPT {String(revision.revision).padStart(2, "0")}</strong>{revision.revision === props.currentRevision && <b>CURRENT</b>}</div>{revision.changeNote && <p>{revision.changeNote}</p>}<div className="concept-history-actions"><button type="button" onClick={() => props.onViewRevision?.(revision.revision)} disabled={revision.revision === displayedRevision}>VIEW</button>{revision.revision !== props.currentRevision && <button type="button" onClick={() => setDeleteRevision(revision.revision)}>DELETE</button>}</div></article>) : <p>No saved concept revisions yet.</p>}{deleteRevision !== null && <div className="concept-delete-confirmation" role="alertdialog" aria-modal="true" aria-label={`Delete Concept ${String(deleteRevision).padStart(2, "0")}?`}><strong>Delete Concept {String(deleteRevision).padStart(2, "0")}?</strong><p>This removes this saved design version from Prototype history. It does not remove your Project information.</p><div><button type="button" onClick={() => setDeleteRevision(null)} disabled={deletingRevision}>CANCEL</button><button type="button" disabled={deletingRevision} onClick={async () => { setDeletingRevision(true); const deleted = await props.onDeleteRevision?.(deleteRevision); setDeletingRevision(false); if (deleted) setDeleteRevision(null); }}>DELETE CONCEPT</button></div></div>}</aside>
        </div>
        <footer><button type="button" disabled>ASK REV · COMING LATER</button><button type="button" onClick={props.onBack}>BACK TO WORKSHOP</button><button type="button" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button><button type="button" onClick={() => props.onGoToBench("validation")}>OPEN TESTING BENCH</button></footer>
      </section>
    );
  }

  if (!flow || !currentQuestion) return null;

  return (
    <section className="rolling-bench-flow" data-progress={progress} aria-label={`${flow.title} work area`}>
      <header><div><span>ACTIVE BENCH</span><h2>{flow.title}</h2><p>{flow.purpose}</p></div><b>{progress.toUpperCase()}</b></header>
      <RevWorkingContextPanel context={props.workingContext} />
      {benchId === "engineering" && (
        <section className="engineering-visible-design" aria-label="Your Design">
          <div className="engineering-visible-design-heading">
            <span>YOUR DESIGN</span>
            <small>The current model follows the same invention into Prototype.</small>
          </div>
          {props.modelView ?? <p>No current design representation is available yet.</p>}
          {props.modelUpdating && <GenerationProgress kind="generation" status="working" />}
          {!props.modelUpdating && props.modelJustUpdated && <GenerationProgress kind="generation" status="ready" />}
          {!props.modelUpdating && props.modelError && <GenerationProgress kind="generation" status="failed" onRetry={props.onCreateModel} />}
        </section>
      )}
      <div className="rolling-bench-main">
        <section className="rev-question-card">
          {complete ? <><span>REV</span><h3>{flow.completion}</h3></> : <><span>REV ASKS · QUESTION {notes.length + 1} OF {flow.questions.length}</span><h3>{currentQuestion.prompt}</h3>{currentQuestion.helper && <p>{currentQuestion.helper}</p>}<label><span>YOUR ANSWER</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={6} placeholder="Write your answer in your own words." /></label>{benchId === "engineering" && notes.length === 0 && <button type="button" className="secondary-action" disabled title="File upload is not available in this build.">ADD A SKETCH OR FILE · COMING LATER</button>}{benchId === "validation" && notes.length === 4 && <div className="testing-outcomes"><button type="button" className={props.testingOutcome === "supported" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("supported")}>WORKED</button><button type="button" className={props.testingOutcome === "inconclusive" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("inconclusive")}>STILL UNSURE</button><button type="button" className={props.testingOutcome === "not-supported" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("not-supported")}>NEEDS IMPROVEMENT</button></div>}<button type="button" onClick={save}>SAVE &amp; CONTINUE</button>{(localError || props.error) && <p className="flow-error" role="alert">{localError || props.error}</p>}</>}
          {benchId === "patent" && <p className="legal-note">This is an early check only. It is not legal advice or a patent decision.</p>}
          {benchId === "patent" && <div className="research-unavailable"><strong>SIMILAR PATENTS REV FOUND</strong><p>Live patent research is not yet available. REV will not invent results.</p></div>}
        </section>
        <aside className="bench-notepad"><span>{flow.summary}</span>{benchId === "reality" && <><h3>WHAT LOOKS STRONG</h3><p>Your positive answers will stay visible here.</p><h3>WHAT STILL NEEDS ATTENTION</h3></>}{notes.length === 0 ? <p>Your saved answers will appear here.</p> : notes.map((note, index) => <article key={`${note.question}-${index}`}><strong>REV asked:</strong><p>{note.question}</p><strong>You said:</strong><p>{note.answer}</p></article>)}</aside>
      </div>
      <footer><button type="button" disabled>ASK REV · COMING LATER</button><button type="button" onClick={props.onBack}>BACK TO WORKSHOP</button>{flow.next && <button type="button" onClick={benchId === "engineering" && complete && !props.generatedModelReady ? props.onCreateModel : () => props.onGoToBench(flow.next!)} disabled={benchId === "engineering" && complete && props.modelUpdating}>{benchId === "engineering" && complete && props.generatedModelReady ? "OPEN PROTOTYPE BENCH" : flow.nextLabel ?? `OPEN ${FLOW[flow.next as Exclude<WorkshopBenchId, "prototype">]?.title?.toUpperCase() ?? "PROTOTYPE BENCH"}`}</button>}{benchId === "validation" && props.testingOutcome === "not-supported" && <button type="button" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button>}</footer>
    </section>
  );
}
