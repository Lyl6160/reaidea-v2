"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";

import GenerationProgress from "./GenerationProgress";

import type { ConceptViewId } from "../lib/ai/types";
import { isValidConceptGeometry, type ConceptGeometry } from "../lib/geometry/conceptGeometry";
import type { WorkshopBenchId, WorkshopBenchState } from "../lib/workshop/workshopBrain";
import type { RevBenchWorkingContext } from "../lib/workshop/revWorkingUnderstanding";

export type BenchNote = {
  question: string;
  answer: string;
};

type BenchQuestion = { prompt: string; helper?: string };

function scrollInstrumentRegion(event: KeyboardEvent<HTMLElement>) {
  if (event.target !== event.currentTarget) return;
  const region = event.currentTarget;
  if (region.scrollHeight <= region.clientHeight + 1) return;
  const pageStep = Math.max(48, region.clientHeight * 0.82);
  const steps: Partial<Record<string, number>> = {
    ArrowDown: 40,
    ArrowUp: -40,
    PageDown: pageStep,
    PageUp: -pageStep,
  };
  const step = steps[event.key];

  if (step !== undefined) {
    event.preventDefault();
    region.scrollBy({ top: step, behavior: "auto" });
    return;
  }
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    region.scrollTo({ top: event.key === "Home" ? 0 : region.scrollHeight, behavior: "auto" });
  }
}

type RollingBenchFlowProps = {
  benchId: WorkshopBenchId;
  benchState?: WorkshopBenchState;
  projectId: string;
  benchReason?: string;
  benchNextMove?: string;
  workingContext?: RevBenchWorkingContext;
  sourceEvidence?: Array<{
    reference: string;
    status: "available" | "unavailable";
    displayName?: string;
    width?: number;
    height?: number;
    objectUrl?: string;
  }>;
  onWorkingNotesChange?: () => void;
  externalNotes?: BenchNote[];
  onSaveExternal?: (answer: string, question: string) => boolean;
  error?: string;
  modelStorageStatus?: ReactNode;
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
  prototypeRepresentation?: "2d" | "3d";
  modelPresentedOnWorkshopStage?: boolean;
  refinementDraft?: string;
  onRefinementDraftChange?: (value: string) => void;
  onCreateModel?: () => void;
  onUpdateModel?: () => void;
  onViewRevision?: (revision: number) => void;
  onBackToCurrent?: () => void;
  onDeleteRevision?: (revision: number) => Promise<boolean>;
  onViewChange?: (view: ConceptViewId) => void;
  onPrototypeRepresentationChange?: (representation: "2d" | "3d") => void;
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

type BenchConsoleStatusPresentation = {
  heading: string;
  primary: string;
  detail: string;
  facts: Array<{ label: string; value: string }>;
};

const SPECIALIST_STATUS: Record<Exclude<WorkshopBenchId, "knowledge" | "engineering" | "prototype">, {
  heading: string;
  readyLabel: string;
  dormantLabel: string;
}> = {
  validation: { heading: "TEST STATUS", readyLabel: "TESTING WORKSPACE AVAILABLE", dormantLabel: "TESTING NOT READY" },
  patent: { heading: "IP REVIEW STATUS", readyLabel: "IP REVIEW WORKSPACE AVAILABLE", dormantLabel: "IP REVIEW NOT READY" },
  manufacturing: { heading: "BUILD STATUS", readyLabel: "BUILD WORKSPACE AVAILABLE", dormantLabel: "BUILD REVIEW NOT READY" },
  marketing: { heading: "MARKET STATUS", readyLabel: "MARKET WORKSPACE AVAILABLE", dormantLabel: "MARKET REVIEW NOT READY" },
  reality: { heading: "REALITY STATUS", readyLabel: "REALITY WORKSPACE AVAILABLE", dormantLabel: "REALITY REVIEW NOT READY" },
};

function BenchConsoleStatusScreen({
  presentation,
  storageStatus,
  children,
}: {
  presentation: BenchConsoleStatusPresentation;
  storageStatus?: ReactNode;
  children?: ReactNode;
}) {
  return <section className="bench-console-status" aria-label={`${presentation.heading} — scroll for complete status`} tabIndex={0} onKeyDown={scrollInstrumentRegion}>
    <div className="engineering-visible-design-heading"><span>{presentation.heading}</span></div>
    <div className="console-design-status" role="status">
      <strong>{presentation.primary}</strong>
      <span>{presentation.detail}</span>
      <dl>{presentation.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    </div>
    {storageStatus}
    {children}
  </section>;
}

function buildBenchConsoleStatus({
  benchId,
  state,
  progress,
  reason,
  descriptionRecorded,
  conceptAvailable,
  modelReady,
  currentRevision,
  discoveryInputCount,
  workingDetailCount,
  savedAnswerCount,
  testingOutcome,
}: {
  benchId: Exclude<WorkshopBenchId, "prototype">;
  state: WorkshopBenchState;
  progress: "red" | "yellow" | "green";
  reason: string;
  descriptionRecorded: boolean;
  conceptAvailable: boolean;
  modelReady: boolean;
  currentRevision?: number;
  discoveryInputCount: number;
  workingDetailCount: number;
  savedAnswerCount: number;
  testingOutcome?: "pending" | "supported" | "not-supported" | "inconclusive";
}): BenchConsoleStatusPresentation {
  if (benchId === "knowledge") {
    return {
      heading: "DISCOVERY STATUS",
      primary: descriptionRecorded ? "PROJECT OBSERVATION RECORDED" : "WAITING FOR DESCRIPTION",
      detail: reason,
      facts: [
        { label: "DESCRIPTION", value: descriptionRecorded ? "RECORDED" : "NOT RECORDED" },
        { label: "DISCOVERY INPUTS", value: `${discoveryInputCount} RECORDED` },
        { label: "KNOWN DETAILS", value: `${workingDetailCount} AVAILABLE` },
        { label: "SAVED ANSWERS", value: String(savedAnswerCount) },
      ],
    };
  }

  if (benchId === "engineering") {
    return {
      heading: "DESIGN STATUS",
      primary: conceptAvailable ? "CONCEPT MODEL AVAILABLE" : modelReady ? "ENGINEERING DEFINITION RECORDED" : "NO DESIGN SAVED",
      detail: conceptAvailable ? "The current Concept is presented on the central Workshop stage." : "Concept 01 has not been created yet.",
      facts: [
        { label: "CONCEPT / MODEL", value: conceptAvailable ? "AVAILABLE" : "NOT CREATED" },
        ...(currentRevision ? [{ label: "REVISION", value: `CONCEPT ${String(currentRevision).padStart(2, "0")}` }] : []),
        { label: "DISCOVERY INPUTS", value: `${discoveryInputCount} RECORDED` },
        { label: "WORKING DETAILS", value: `${workingDetailCount} AVAILABLE` },
      ],
    };
  }

  const specialist = SPECIALIST_STATUS[benchId];
  return {
    heading: specialist.heading,
    primary: state === "dormant" ? specialist.dormantLabel : specialist.readyLabel,
    detail: reason,
    facts: [
      { label: "AVAILABILITY", value: state.toUpperCase() },
      { label: "WORKING STATE", value: progress.toUpperCase() },
      { label: "SAVED ANSWERS", value: String(savedAnswerCount) },
      ...(benchId === "validation" ? [{ label: "TEST OUTCOME", value: (testingOutcome ?? "pending").replaceAll("-", " ").toUpperCase() }] : []),
    ],
  };
}

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

function RevWorkingContextPanel({ context, benchReason, benchNextMove }: {
  context?: RevBenchWorkingContext;
  benchReason?: string;
  benchNextMove?: string;
}) {
  if (!context && !benchReason && !benchNextMove) return null;
  const sourceById = new Map((context?.sources ?? []).map((source) => [source.id, source.label]));
  const knownFacts = context?.known ?? [];
  const preparedItems = context?.prepared ?? [];
  const knownScreenHasOverflow = knownFacts.length > 1 || knownFacts.some((fact) => fact.text.length > 90);
  const preparedScreenHasOverflow = preparedItems.length > 1 || Boolean(benchReason) || preparedItems.some((item) => item.length > 90);
  return <section className="rev-working-context" aria-label="REV Working Understanding">
    <div className="rev-context-known"><span>WHAT REV ALREADY KNOWS</span><div className="rev-screen-scroll-body" role="region" aria-label="What REV already knows — scroll for complete information" tabIndex={0} onKeyDown={scrollInstrumentRegion}>{knownFacts.length ? <ul>{knownFacts.map((fact, index) => <li key={`${fact.text}-${index}`}><p>{fact.text}</p><small>Source: {fact.sourceIds.map((id) => sourceById.get(id) ?? id).join(", ")}</small></li>)}</ul> : <p>No relevant detail has been recorded yet.</p>}</div>{knownScreenHasOverflow && <small className="rev-screen-more" aria-hidden="true">MORE ↓</small>}</div>
    <div className="rev-context-prepared"><span>WHAT REV PREPARED</span><div className="rev-screen-scroll-body" role="region" aria-label="What REV prepared — scroll for complete information" tabIndex={0} onKeyDown={scrollInstrumentRegion}>{preparedItems.map((item) => <p key={item}>{item}</p>)}{benchReason && <p className="rev-bench-reason">{benchReason}</p>}{preparedItems.length === 0 && !benchReason && <p>No prepared information is available yet.</p>}</div>{preparedScreenHasOverflow && <small className="rev-screen-more" aria-hidden="true">MORE ↓</small>}</div>
    {benchNextMove && <div className="rev-next-move" role="region" aria-label="REV next move" tabIndex={0} onKeyDown={scrollInstrumentRegion}><span>REV · NEXT MOVE</span><strong>{benchNextMove}</strong>{benchNextMove.length > 90 && <small className="rev-screen-more" aria-hidden="true">MORE ↓</small>}</div>}
  </section>;
}

function SourceEvidencePanel({ evidence }: { evidence?: RollingBenchFlowProps["sourceEvidence"] }) {
  if (!evidence?.length) return null;
  return <section className="source-evidence-panel" aria-label="Inventor source evidence">
    <span>ORIGINAL VISUAL REFERENCE</span>
    {evidence.map((item) => item.status === "available" && item.objectUrl && item.width && item.height
      ? <figure key={item.reference}>
          <Image src={item.objectUrl} alt="Inventor-supplied visual reference" width={item.width} height={item.height} unoptimized />
          <figcaption><strong>{item.displayName ?? "Reference image"}</strong><small>Inventor-supplied source evidence · read only</small></figcaption>
        </figure>
      : <p key={item.reference}>The inventor supplied a visual reference, but it is unavailable in this browser. The historical Project record has been preserved.</p>)}
  </section>;
}

export default function RollingBenchFlow(props: RollingBenchFlowProps) {
  const { benchId, projectId } = props;
  const consoleRootRef = useRef<HTMLElement>(null);
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
  const [localStatus, setLocalStatus] = useState("");
  const [deleteRevision, setDeleteRevision] = useState<number | null>(null);
  const [deletingRevision, setDeletingRevision] = useState(false);
  const [inventorReview, setInventorReview] = useState<"unreviewed" | "yes" | "change">("unreviewed");
  const [localPrototypeRepresentation, setLocalPrototypeRepresentation] = useState<"2d" | "3d">("2d");
  const [reviewedInventorPresentation, setReviewedInventorPresentation] = useState<string>();
  const inventorSubmissionStartedRef = useRef(false);
  const prototypeRepresentation = props.prototypeRepresentation ?? localPrototypeRepresentation;

  function changePrototypeRepresentation(representation: "2d" | "3d") {
    if (props.onPrototypeRepresentationChange) props.onPrototypeRepresentationChange(representation);
    else setLocalPrototypeRepresentation(representation);
  }

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
  const benchState = props.benchState ?? "available";
  const benchIsDormant = benchState === "dormant";
  const originalObservation = props.workingContext?.sources.find((source) => source.kind === "original-observation")?.text ?? notes[0]?.answer ?? "";
  const currentConceptAvailable = Boolean(props.modelPresentationKey || props.generatedModelReady);
  const discoveryInputCount = props.workingContext?.sources.length ?? 0;
  const workingDetailCount = props.workingContext?.known.length ?? 0;
  const consoleStatus = benchId === "prototype" ? null : buildBenchConsoleStatus({
    benchId,
    state: benchState,
    progress,
    reason: props.benchReason ?? "REV has not recorded a bench status yet.",
    descriptionRecorded: Boolean(originalObservation),
    conceptAvailable: currentConceptAvailable,
    modelReady: Boolean(props.modelReady),
    currentRevision: props.currentRevision,
    discoveryInputCount,
    workingDetailCount,
    savedAnswerCount: notes.length,
    testingOutcome: props.testingOutcome,
  });

  useEffect(() => {
    consoleRootRef.current
      ?.querySelectorAll<HTMLElement>(
        ".rev-context-known, .rev-context-prepared, .rev-next-move, .bench-console-status, .prototype-console-status, .rev-question-screen, .rev-screen-scroll-body"
      )
      .forEach((region) => {
        region.scrollTop = 0;
        region.scrollLeft = 0;
      });
  }, [benchId]);

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
    saveRollingBenchNotes(projectId, benchId, next);
    setLocalNotes(next);
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

  function saveInventorInformation() {
    if (!draft.trim()) {
      setLocalStatus("");
      setLocalError("Add the information you want REV to record.");
      return;
    }
    try {
      saveLocalNote("Inventor addition or correction", draft);
      setLocalStatus("Information recorded in REV's non-authoritative Working Understanding.");
    } catch {
      setLocalStatus("");
      setLocalError("REV couldn't save that information in this browser. Your original observation is unchanged.");
    }
  }

  if (benchId === "knowledge") {
    const initialDescription = originalObservation;
    const contextualQuestion = props.workingContext?.missingQuestion
      ? { prompt: props.workingContext.missingQuestion, helper: "Only add the smallest detail REV still needs." }
      : null;
    const inventorPresentation = `${props.currentRevision ?? "none"}:${props.modelPresentationKey ?? "initial"}`;
    const currentInventorReview = reviewedInventorPresentation === inventorPresentation ? inventorReview : "unreviewed";
    const usefulUnderstanding = Boolean(props.modelReady && (!contextualQuestion || notes.length >= 2));
    const inventorProgress = usefulUnderstanding ? "green" : props.modelReady || initialDescription ? "yellow" : "red";
    return (
      <section ref={consoleRootRef} className="rolling-bench-flow command-console-flow inventor-bench-v2" data-bench="knowledge" data-console-layout="physical" data-progress={inventorProgress} aria-label="Inventor's Bench work area">
        <RevWorkingContextPanel context={props.workingContext} benchReason={props.benchReason} benchNextMove={props.benchNextMove} />
        <BenchConsoleStatusScreen presentation={consoleStatus!} storageStatus={props.modelStorageStatus}>
          {props.modelUpdating && <GenerationProgress kind={props.modelActionKind === "view" ? "view" : props.modelReady ? "refinement" : "first-generation"} status="working" />}
          {!props.modelUpdating && props.modelJustUpdated && <GenerationProgress kind={props.modelActionKind === "view" ? "view" : props.currentRevision && props.currentRevision > 1 ? "refinement" : "first-generation"} status="ready" />}
          {!props.modelUpdating && props.modelError && <GenerationProgress kind={props.modelActionKind === "view" ? "view" : props.modelReady ? "refinement" : "first-generation"} status="failed" failureMessage={props.modelReady ? undefined : "REV couldn't create your concept this time."} onRetry={props.modelReady ? props.onUpdateModel : props.onCreateModel} />}
        </BenchConsoleStatusScreen>
        <SourceEvidencePanel evidence={props.sourceEvidence} />
        <div className="rolling-bench-main">
          <section className="rev-question-card inventor-primary-card">
            <div className="rev-question-screen" role="region" aria-label="Inventor question and response" tabIndex={0} onKeyDown={scrollInstrumentRegion}>
              {!initialDescription
                ? <><span>REV ASKS</span><h3>Describe your invention</h3><p>Tell REV what it looks like, the main parts you imagine, and anything important you want included.</p><label><span>YOUR DESCRIPTION</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={6} placeholder="Describe what your invention looks like and what it includes..." /></label></>
                : !props.modelReady
                  ? <div className="inventor-correction-layout"><div className="inventor-correction-toolbar"><label htmlFor="inventor-correction-input">ADD OR CORRECT INFORMATION</label><button type="button" className="console-inline-action" disabled aria-describedby="inventor-ask-rev-boundary" title="Workshop ASK REV is not available yet. Saving information locally does not call a provider.">ASK REV · NOT AVAILABLE</button></div><textarea id="inventor-correction-input" aria-describedby="inventor-ask-rev-boundary" value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); setLocalStatus(""); }} rows={1} placeholder="Add a thought, correction, or missing detail…" /><span id="inventor-ask-rev-boundary" className="inventor-boundary-copy">Workshop ASK REV is not available yet. Saving this information locally does not call a provider or change your original observation.</span></div>
                  : currentInventorReview === "unreviewed"
                    ? <><span>REV ASKS</span><h3>Is this close to what you had in mind?</h3><p>This is an early concept. Tell REV what looks right or what needs changing.</p><button type="button" className="console-inline-action" onClick={() => { setReviewedInventorPresentation(inventorPresentation); setInventorReview("change"); }}>NOT QUITE — LET&apos;S CHANGE IT</button></>
                    : currentInventorReview === "change"
                      ? <><span>REV ASKS</span><h3>What would you like to change?</h3><p>Describe the correction. REV will keep this in the same concept family.</p><label><span>YOUR CHANGE</span><textarea value={props.refinementDraft ?? ""} onChange={(event) => props.onRefinementDraftChange?.(event.target.value)} rows={5} placeholder="Tell REV what should look or work differently..." /></label></>
                      : props.refinementDraft?.trim()
                        ? <><span>REV</span><h3>Update the visual with what you just told REV?</h3><p>The update is deliberate and will create the next revision in the same concept family.</p><button type="button" className="console-inline-action" onClick={() => props.onRefinementDraftChange?.("")}>KEEP CURRENT VISUAL</button></>
                        : contextualQuestion
                          ? <><span>REV ASKS</span><h3>{contextualQuestion.prompt}</h3><p>{contextualQuestion.helper}</p><label><span>YOUR ANSWER</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={5} placeholder="Add the detail in your own words..." /></label></>
                          : <><span>REV</span><h3>REV understands the current idea.</h3><p>Engineering can now develop the design in more detail.</p></>}
              {localStatus && <p className="flow-success" role="status">{localStatus}</p>}
              {localError && <p className="flow-error" role="alert">{localError}</p>}
            </div>
            {!initialDescription
              ? <button type="button" className="console-primary-control" onClick={createFirstConcept} disabled={props.modelUpdating || !draft.trim()}>BRING MY IDEA TO LIFE</button>
              : !props.modelReady
                ? <button type="button" className="console-primary-control" onClick={saveInventorInformation} disabled={!draft.trim()}>SAVE INFORMATION</button>
                : currentInventorReview === "unreviewed"
                  ? <button type="button" className="console-primary-control" onClick={() => { setReviewedInventorPresentation(inventorPresentation); setInventorReview("yes"); }}>YES — KEEP DEVELOPING</button>
                  : currentInventorReview === "change" || props.refinementDraft?.trim()
                    ? <button type="button" className="console-primary-control" onClick={props.onUpdateModel} disabled={props.modelUpdating || !props.refinementDraft?.trim()}>UPDATE DESIGN</button>
                    : contextualQuestion
                      ? <button type="button" className="console-primary-control" onClick={() => saveContextualAnswer(contextualQuestion.prompt)}>SAVE ANSWER</button>
                      : <button type="button" className="console-primary-control" onClick={() => props.onGoToBench("engineering")}>OPEN ENGINEERING BENCH</button>}
          </section>
        </div>
      </section>
    );
  }

  if (benchId === "prototype") {
    const viewingHistoricalRevision = props.viewedRevision !== undefined && props.viewedRevision !== props.currentRevision;
    const displayedRevision = props.viewedRevision ?? props.currentRevision;
    const conceptAvailable = Boolean(props.modelPresentationKey || props.generatedModelReady);
    const conceptHistory = props.modelRevisions?.length
      ? [...props.modelRevisions].sort((left, right) => right.revision - left.revision)
      : [];
    const viewLabels: Record<ConceptViewId, string> = { iso: "ISOMETRIC", front: "FRONT", side: "SIDE" };
    const viewSelector = <div className="prototype-view-selector" aria-label="Concept views">{(props.availableViews ?? ["iso"]).map((view) => <button key={view} type="button" className={view === props.selectedView ? "is-selected" : ""} disabled={!conceptAvailable} aria-pressed={view === props.selectedView} onClick={() => props.onViewChange?.(view)}>{viewLabels[view]}</button>)}</div>;
    const validConceptGeometry = props.conceptGeometry && isValidConceptGeometry(props.conceptGeometry)
      ? props.conceptGeometry
      : undefined;
    const showing3d = prototypeRepresentation === "3d" && Boolean(validConceptGeometry);
    const representationSelector = <div className="prototype-representation-selector" aria-label="Prototype representation"><button type="button" className={!showing3d ? "is-selected" : ""} disabled={!conceptAvailable} aria-pressed={!showing3d} onClick={() => changePrototypeRepresentation("2d")}>2D CONCEPT</button><div className="prototype-3d-control"><button type="button" className={showing3d ? "is-selected" : ""} disabled={!validConceptGeometry} aria-pressed={showing3d} aria-label={validConceptGeometry ? "3D MODEL" : "3D MODEL locked — needs more design detail"} onClick={() => changePrototypeRepresentation("3d")}>{validConceptGeometry ? "3D MODEL" : "3D MODEL 🔒"}</button>{!validConceptGeometry && <small>Needs more design detail</small>}</div></div>;
    const modelIsPresentedOnStage = Boolean(props.modelPresentedOnWorkshopStage && (showing3d || props.modelView));
    const prototypeNextMove = conceptAvailable
      ? props.benchNextMove
      : "More Engineering design detail is required before Prototype can build and present the model.";
    return (
      <section ref={consoleRootRef} className="rolling-bench-flow command-console-flow prototype-rolling-flow" data-bench="prototype" data-console-layout="physical" data-progress={progress} aria-label="Prototype Bench work area">
        <RevWorkingContextPanel context={props.workingContext} benchReason={props.benchReason} benchNextMove={prototypeNextMove} />
        <section className="prototype-console-status" aria-label="Prototype model status and central-stage controls" tabIndex={0} onKeyDown={scrollInstrumentRegion}>
          <div className="engineering-visible-design-heading">
            <span>MODEL STATUS</span>
            <small>The central Workshop stage is the only visual presentation.</small>
          </div>
          <div className="console-design-status" role="status">
            {conceptAvailable ? <><strong>CONCEPT MODEL AVAILABLE</strong><span>{showing3d ? "Validated geometry is live on the central Workshop stage." : "The current Concept is live on the central Workshop stage."}</span></> : <><strong>NO DESIGN SAVED</strong><span>Concept 01 has not been created yet.</span></>}
            <dl>
              <div><dt>GEOMETRY</dt><dd>{validConceptGeometry ? "AVAILABLE" : "NOT AVAILABLE"}</dd></div>
              <div><dt>REVISION</dt><dd>{displayedRevision ? `CONCEPT ${String(displayedRevision).padStart(2, "0")}${viewingHistoricalRevision ? " · SAVED" : " · CURRENT"}` : "NOT AVAILABLE"}</dd></div>
              <div><dt>PRESENTATION</dt><dd>{modelIsPresentedOnStage ? "CENTRAL STAGE" : "NOT AVAILABLE"}</dd></div>
              {showing3d && <div><dt>STAGE CONTROLS</dt><dd>ORBIT · ZOOM · FIT · RESET · JOINT · PAUSE</dd></div>}
            </dl>
          </div>
          {representationSelector}
          {!showing3d && viewSelector}
          {props.modelStorageStatus}
        </section>
        <SourceEvidencePanel evidence={props.sourceEvidence} />
        {props.modelUpdating && <GenerationProgress kind="refinement" status="working" />}
        {!props.modelUpdating && props.modelJustUpdated && <GenerationProgress kind="refinement" status="ready" />}
        {!props.modelUpdating && props.modelError && <GenerationProgress kind="refinement" status="failed" onRetry={props.onUpdateModel} />}
        <div className="rolling-bench-main">
          <section className="rev-question-card">
            <div className="rev-question-screen" role="region" aria-label="Prototype readiness and controls">
              {!conceptAvailable
                ? <><span>PROTOTYPE READINESS</span><h3>Prototype is waiting for an Engineering design.</h3></>
                : viewingHistoricalRevision
                  ? <><span>PROTOTYPE REVISION</span><h3>Viewing Concept {String(displayedRevision).padStart(2, "0")}</h3><p>This saved revision is read only.</p></>
                  : props.conceptLimitReached
                    ? <><span>PROTOTYPE LIMIT</span><h3>You&apos;ve reached 5 design versions for this direction.</h3><p>Review the current design or return to Engineering if you want to change the direction.</p></>
                    : <><span>REV ASKS</span><h3>What would you like to change?</h3><p>Tell REV what doesn&apos;t look right or what you want changed.</p><label><span>YOUR CHANGE</span><textarea value={props.refinementDraft ?? ""} onChange={(event) => props.onRefinementDraftChange?.(event.target.value)} rows={5} placeholder="For example: make this longer, move this part, or change the shape." /></label></>}
            </div>
            {!conceptAvailable
              ? <button type="button" className="console-primary-control" onClick={() => props.onGoToBench("engineering")}>OPEN ENGINEERING BENCH</button>
              : viewingHistoricalRevision
                ? <button type="button" className="console-primary-control" onClick={props.onBackToCurrent}>BACK TO CURRENT</button>
                : props.conceptLimitReached
                  ? <button type="button" className="console-primary-control" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button>
                  : <button type="button" className="console-primary-control" onClick={props.onUpdateModel} disabled={props.modelUpdating || !props.refinementDraft?.trim()}>{props.modelUpdating ? "REV IS UPDATING YOUR DESIGN..." : "UPDATE MODEL"}</button>}
            {conceptAvailable && <small>{viewingHistoricalRevision ? "Viewing this revision does not change your Project or model history." : props.conceptLimitReached ? "Delete an older saved version if you want to keep refining this direction." : "This creates the next version of the same design."}</small>}
          </section>
          {conceptHistory.length > 0 && <aside id="prototype-concept-history" className="bench-notepad concept-history"><span>CONCEPT HISTORY</span>{conceptHistory.map((revision) => <article key={revision.candidateId} className={revision.revision === props.currentRevision ? "is-current" : ""}><div><strong>CONCEPT {String(revision.revision).padStart(2, "0")}</strong>{revision.revision === props.currentRevision && <b>CURRENT</b>}</div>{revision.changeNote && <p>{revision.changeNote}</p>}<div className="concept-history-actions"><button type="button" onClick={() => props.onViewRevision?.(revision.revision)} disabled={revision.revision === displayedRevision}>VIEW</button>{revision.revision !== props.currentRevision && <button type="button" onClick={() => setDeleteRevision(revision.revision)}>DELETE</button>}</div></article>)}{deleteRevision !== null && <div className="concept-delete-confirmation" role="alertdialog" aria-modal="true" aria-label={`Delete Concept ${String(deleteRevision).padStart(2, "0")}?`}><strong>Delete Concept {String(deleteRevision).padStart(2, "0")}?</strong><p>This removes this saved design version from Prototype history. It does not remove your Project information.</p><div><button type="button" onClick={() => setDeleteRevision(null)} disabled={deletingRevision}>CANCEL</button><button type="button" disabled={deletingRevision} onClick={async () => { setDeletingRevision(true); const deleted = await props.onDeleteRevision?.(deleteRevision); setDeletingRevision(false); if (deleted) setDeleteRevision(null); }}>DELETE CONCEPT</button></div></div>}</aside>}
        </div>
      </section>
    );
  }

  if (!flow || !currentQuestion) return null;

  return (
    <section ref={consoleRootRef} className="rolling-bench-flow command-console-flow" data-bench={benchId} data-console-layout="physical" data-progress={progress} aria-label={`${flow.title} work area`}>
      <RevWorkingContextPanel context={props.workingContext} benchReason={props.benchReason} benchNextMove={props.benchNextMove} />
      <BenchConsoleStatusScreen presentation={consoleStatus!} storageStatus={props.modelStorageStatus}>
        {benchId === "engineering" && props.modelUpdating && <GenerationProgress kind="generation" status="working" />}
        {benchId === "engineering" && !props.modelUpdating && props.modelJustUpdated && <GenerationProgress kind="generation" status="ready" />}
        {benchId === "engineering" && !props.modelUpdating && props.modelError && <GenerationProgress kind="generation" status="failed" onRetry={props.onCreateModel} />}
      </BenchConsoleStatusScreen>
      <SourceEvidencePanel evidence={props.sourceEvidence} />
      <div className="rolling-bench-main">
        <section className="rev-question-card">
          <div className="rev-question-screen" role="region" aria-label="Current REV question and answer" tabIndex={0} onKeyDown={scrollInstrumentRegion}>
            {benchIsDormant
              ? <><span>BENCH STATUS</span><h3>{props.benchReason ?? `${flow.title} is not ready yet.`}</h3></>
              : complete
                ? <><span>REV</span><h3>{flow.completion}</h3></>
                : <><span>REV ASKS · QUESTION {notes.length + 1} OF {flow.questions.length}</span><h3>{currentQuestion.prompt}</h3>{currentQuestion.helper && <p className="rev-question-helper">{currentQuestion.helper}</p>}<label><span>YOUR ANSWER</span><textarea value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} rows={6} placeholder="Write your answer in your own words." /></label>{benchId === "validation" && notes.length === 4 && <div className="testing-outcomes"><button type="button" className={props.testingOutcome === "supported" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("supported")}>WORKED</button><button type="button" className={props.testingOutcome === "inconclusive" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("inconclusive")}>STILL UNSURE</button><button type="button" className={props.testingOutcome === "not-supported" ? "selected" : ""} onClick={() => props.onTestingOutcomeChange?.("not-supported")}>NEEDS IMPROVEMENT</button></div>}{(localError || props.error) && <p className="flow-error" role="alert">{localError || props.error}</p>}</>}
            {!benchIsDormant && benchId === "patent" && <p className="legal-note">This is an early check only. It is not legal advice or a patent decision.</p>}
            {!benchIsDormant && benchId === "patent" && <div className="research-unavailable"><strong>SIMILAR PATENTS REV FOUND</strong><p>Live patent research is not yet available. REV will not invent results.</p></div>}
          </div>
          {benchIsDormant
            ? <button type="button" className="console-primary-control" disabled>{flow.nextLabel ?? "NO ACTION READY"}</button>
            : benchId === "validation" && props.testingOutcome === "not-supported"
              ? <button type="button" className="console-primary-control" onClick={() => props.onGoToBench("engineering")}>BACK TO ENGINEERING</button>
              : !complete
                ? <button type="button" className="console-primary-control" onClick={save}>SAVE &amp; CONTINUE</button>
                : flow.next
                  ? <button type="button" className="console-primary-control" onClick={benchId === "engineering" && !props.generatedModelReady ? props.onCreateModel : () => props.onGoToBench(flow.next!)} disabled={benchId === "engineering" && props.modelUpdating}>{benchId === "engineering" && props.generatedModelReady ? "OPEN PROTOTYPE" : flow.nextLabel ?? "CONTINUE"}</button>
                  : <button type="button" className="console-primary-control" disabled>NO ACTION READY</button>}
        </section>
        {notes.length > 0 && <aside className="bench-notepad"><span>{flow.summary}</span>{benchId === "reality" && <><h3>WHAT LOOKS STRONG</h3><h3>WHAT STILL NEEDS ATTENTION</h3></>}{notes.map((note, index) => <article key={`${note.question}-${index}`}><strong>REV asked:</strong><p>{note.question}</p><strong>You said:</strong><p>{note.answer}</p></article>)}</aside>}
      </div>
    </section>
  );
}
