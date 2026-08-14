"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Project } from "../../lib/core/project";
import type {
  WorkshopBenchId,
  WorkshopBenchSignal,
  WorkshopState,
} from "../../lib/workshop/workshopBrain";
import { CANONICAL_WORKSHOP_BENCHES } from "../../lib/workshop/workshopBrain";

type WorkshopShellProps = {
  project: Project;
  workshop: WorkshopState;
};

type ConceptReview = "unreviewed" | "accepted" | "refine" | "rethink";
type ConceptDecision = "undecided" | "accept" | "refine" | "rethink";
type ValidationEvidenceOutcome = "pending" | "supported" | "not-supported" | "inconclusive";

function getBench(workshop: WorkshopState, id: WorkshopBenchId) {
  return workshop.benches.find((bench) => bench.id === id);
}


function conceptKey(project: Project) {
  const source = `${project.projectName}::${project.originalObservation}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `reaidea.workshop.concept.v1.${(hash >>> 0).toString(16)}`;
}


function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createConceptRenderSvg(brief: {
  title: string;
  purpose: string;
  principle: string;
  constraints: string[];
  nextMove: string;
  conceptLabel?: string;
}) {
  const source = `${brief.title}|${brief.purpose}|${brief.principle}|${brief.constraints.join("|")}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const variant = (hash >>> 0) % 3;
  const bodySkew = variant === 0 ? 0 : variant === 1 ? -14 : 14;
  const purpose = escapeSvgText(brief.purpose.slice(0, 92));
  const principle = escapeSvgText(brief.principle.slice(0, 88));
  const constraint = escapeSvgText((brief.constraints[0] ?? "Constraint not yet captured").slice(0, 72));
  const nextMove = escapeSvgText(brief.nextMove.slice(0, 82));
  const conceptLabel = escapeSvgText(brief.conceptLabel ?? "CONCEPT 01");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" role="img" aria-label="Generated engineering concept render">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#071217"/>
        <stop offset="0.52" stop-color="#102a32"/>
        <stop offset="1" stop-color="#050b0e"/>
      </linearGradient>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5d9aa7" stop-opacity=".55"/>
        <stop offset="1" stop-color="#163b45" stop-opacity=".9"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="1000" height="560" fill="url(#bg)"/>
    <g opacity=".18" stroke="#78d4e2" stroke-width="1">
      <path d="M0 80H1000M0 160H1000M0 240H1000M0 320H1000M0 400H1000M0 480H1000"/>
      <path d="M80 0V560M160 0V560M240 0V560M320 0V560M400 0V560M480 0V560M560 0V560M640 0V560M720 0V560M800 0V560M880 0V560M960 0V560"/>
    </g>
    <text x="28" y="34" fill="#86dce9" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">REV · GENERATED CONCEPT STUDY</text>
    <text x="28" y="54" fill="#718891" font-family="Arial,sans-serif" font-size="9" letter-spacing="1.2">${conceptLabel} · PROCEDURAL ENGINEERING VISUAL · REVISION ${variant + 1}</text>

    <g transform="translate(165 190) skewX(${bodySkew})" filter="url(#glow)">
      <path d="M70 155 L120 65 L500 35 L690 105 L650 205 L105 215 Z" fill="url(#body)" stroke="#83dce7" stroke-width="3"/>
      <path d="M150 75 L470 50 L575 101 L185 111 Z" fill="#0b2027" stroke="#5db7c5" stroke-width="2"/>
      <path d="M235 124 H525 V181 H235 Z" fill="#15515d" fill-opacity=".7" stroke="#65c5d3" stroke-width="2"/>
      <rect x="300" y="135" width="140" height="38" rx="5" fill="#071419" stroke="#8be7ef" stroke-width="2"/>
      <circle cx="210" cy="215" r="42" fill="#081115" stroke="#76cbd6" stroke-width="4"/>
      <circle cx="560" cy="205" r="42" fill="#081115" stroke="#76cbd6" stroke-width="4"/>
      <circle cx="210" cy="215" r="16" fill="#2e6975"/>
      <circle cx="560" cy="205" r="16" fill="#2e6975"/>
      <path d="M105 215 H650" stroke="#4caab9" stroke-width="2" stroke-dasharray="8 7"/>
    </g>

    <g font-family="Arial,sans-serif">
      <path d="M240 285 L95 350" stroke="#7ed9e5" stroke-width="1.5"/>
      <rect x="28" y="332" width="250" height="62" rx="7" fill="#061116" stroke="#438c99"/>
      <text x="42" y="350" fill="#7fc8d8" font-size="9" font-weight="700" letter-spacing="1">PURPOSE</text>
      <text x="42" y="368" fill="#d3e0e4" font-size="10">${purpose}</text>
      <text x="42" y="384" fill="#8da5ad" font-size="8">Derived directly from the approved brief.</text>

      <path d="M590 250 L805 175" stroke="#7ed9e5" stroke-width="1.5"/>
      <rect x="720" y="126" width="252" height="68" rx="7" fill="#061116" stroke="#438c99"/>
      <text x="736" y="145" fill="#7fc8d8" font-size="9" font-weight="700" letter-spacing="1">OPERATING PRINCIPLE</text>
      <text x="736" y="164" fill="#d3e0e4" font-size="10">${principle}</text>
      <text x="736" y="181" fill="#8da5ad" font-size="8">Engineering understanding, not invented specification.</text>

      <path d="M620 350 L820 355" stroke="#e5bd7b" stroke-width="1.5"/>
      <rect x="720" y="320" width="252" height="68" rx="7" fill="#17130b" stroke="#8d6b36"/>
      <text x="736" y="339" fill="#e5bd7b" font-size="9" font-weight="700" letter-spacing="1">KEY CONSTRAINT</text>
      <text x="736" y="358" fill="#eadcc4" font-size="10">${constraint}</text>
      <text x="736" y="375" fill="#a99574" font-size="8">Constraint carried into the visual study.</text>
    </g>

    <rect x="28" y="474" width="944" height="56" rx="7" fill="#071217" stroke="#2e6571"/>
    <text x="44" y="494" fill="#7fc8d8" font-family="Arial,sans-serif" font-size="9" font-weight="700" letter-spacing="1">NEXT ENGINEERING MOVE</text>
    <text x="44" y="514" fill="#d1dfe3" font-family="Arial,sans-serif" font-size="10">${nextMove}</text>
    <text x="972" y="494" text-anchor="end" fill="#607983" font-family="Arial,sans-serif" font-size="8" font-weight="700">REV · NOT CAD</text>
  </svg>`;
}

function stateLabel(state: WorkshopBenchSignal["state"]) {
  switch (state) {
    case "active":
      return "Working here";
    case "pulse":
      return "New knowledge";
    case "ready":
      return "Ready";
    case "available":
      return "Available";
    default:
      return "Dormant";
  }
}

function formatReadiness(readiness: Project["readiness"]): string {
  return readiness.replace("-", " ");
}

function summarizeUnderstanding(value: string): string {
  const summary = value.split("\n")[0]?.trim() || value.trim();
  return summary.length > 220 ? `${summary.slice(0, 217).trim()}...` : summary;
}

export default function WorkshopShell({
  project,
  workshop,
}: WorkshopShellProps) {
  const projectName = project.projectName;
  const [selectedId, setSelectedId] = useState<WorkshopBenchId>(() => {
    if (typeof window === "undefined") return workshop.recommendedBench;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return workshop.recommendedBench;
      const parsed = JSON.parse(saved) as { conceptDecision?: ConceptDecision };
      if (parsed.conceptDecision === "accept") return "validation";
      if (parsed.conceptDecision === "rethink") return "engineering";
    } catch {
      // Fall back to the workshop's recommended bench.
    }
    return workshop.recommendedBench;
  });
  const conceptStorageKey = useMemo(() => conceptKey(project), [project]);
  const [conceptCreated, setConceptCreated] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return false;
      const parsed = JSON.parse(saved) as { conceptCreated?: boolean };
      return Boolean(parsed.conceptCreated);
    } catch {
      return false;
    }
  });
  const [conceptVisualised, setConceptVisualised] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return false;
      const parsed = JSON.parse(saved) as { conceptVisualised?: boolean };
      return Boolean(parsed.conceptVisualised);
    } catch {
      return false;
    }
  });
  const [conceptGenerated, setConceptGenerated] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return false;
      const parsed = JSON.parse(saved) as { conceptGenerated?: boolean };
      return Boolean(parsed.conceptGenerated);
    } catch {
      return false;
    }
  });
  const [generatedConceptSvg, setGeneratedConceptSvg] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { generatedConceptSvg?: string };
      return parsed.generatedConceptSvg ?? "";
    } catch {
      return "";
    }
  });
  const [conceptReview, setConceptReview] = useState<ConceptReview>(() => {
    if (typeof window === "undefined") return "unreviewed";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "unreviewed";
      const parsed = JSON.parse(saved) as { conceptReview?: ConceptReview };
      return parsed.conceptReview ?? "unreviewed";
    } catch {
      return "unreviewed";
    }
  });
  const [conceptReviewNotes, setConceptReviewNotes] = useState<Record<Exclude<ConceptReview, "unreviewed">, string>>(() => {
    if (typeof window === "undefined") return { accepted: "", refine: "", rethink: "" };
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return { accepted: "", refine: "", rethink: "" };
      const parsed = JSON.parse(saved) as {
        conceptReview?: ConceptReview;
        conceptReviewNotes?: Partial<Record<Exclude<ConceptReview, "unreviewed">, string>>;
        conceptReviewNote?: string;
      };
      const notes = {
        accepted: parsed.conceptReviewNotes?.accepted ?? "",
        refine: parsed.conceptReviewNotes?.refine ?? "",
        rethink: parsed.conceptReviewNotes?.rethink ?? "",
      };
      if (parsed.conceptReview && parsed.conceptReview !== "unreviewed" && !notes[parsed.conceptReview]) {
        notes[parsed.conceptReview] = parsed.conceptReviewNote ?? "";
      }
      return notes;
    } catch {
      return { accepted: "", refine: "", rethink: "" };
    }
  });

  const [refinedConceptGenerated, setRefinedConceptGenerated] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return false;
      const parsed = JSON.parse(saved) as { refinedConceptGenerated?: boolean };
      return Boolean(parsed.refinedConceptGenerated);
    } catch {
      return false;
    }
  });

  const [refinedConceptSvg, setRefinedConceptSvg] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { refinedConceptSvg?: string };
      return parsed.refinedConceptSvg ?? "";
    } catch {
      return "";
    }
  });
  const [conceptDecision, setConceptDecision] = useState<ConceptDecision>(() => {
    if (typeof window === "undefined") return "undecided";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "undecided";
      const parsed = JSON.parse(saved) as { conceptDecision?: ConceptDecision };
      return parsed.conceptDecision ?? "undecided";
    } catch {
      return "undecided";
    }
  });
  const [conceptDecisionNotes, setConceptDecisionNotes] = useState<Record<Exclude<ConceptDecision, "undecided">, string>>(() => {
    if (typeof window === "undefined") return { accept: "", refine: "", rethink: "" };
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return { accept: "", refine: "", rethink: "" };
      const parsed = JSON.parse(saved) as {
        conceptDecisionNotes?: Partial<Record<Exclude<ConceptDecision, "undecided">, string>>;
        conceptDecisionNote?: string;
        conceptDecision?: ConceptDecision;
      };
      const notes = {
        accept: parsed.conceptDecisionNotes?.accept ?? "",
        refine: parsed.conceptDecisionNotes?.refine ?? "",
        rethink: parsed.conceptDecisionNotes?.rethink ?? "",
      };
      if (parsed.conceptDecision && parsed.conceptDecision !== "undecided" && !notes[parsed.conceptDecision]) {
        notes[parsed.conceptDecision] = parsed.conceptDecisionNote ?? "";
      }
      return notes;
    } catch {
      return { accept: "", refine: "", rethink: "" };
    }
  });
  const [thirdConceptGenerated, setThirdConceptGenerated] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return false;
      const parsed = JSON.parse(saved) as { thirdConceptGenerated?: boolean };
      return Boolean(parsed.thirdConceptGenerated);
    } catch {
      return false;
    }
  });
  const [thirdConceptSvg, setThirdConceptSvg] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { thirdConceptSvg?: string };
      return parsed.thirdConceptSvg ?? "";
    } catch {
      return "";
    }
  });
  const [validationEvidence, setValidationEvidence] = useState<{
    question: string;
    evidence: string;
    observed: string;
    outcome: ValidationEvidenceOutcome;
  }>(() => {
    if (typeof window === "undefined") return { question: "", evidence: "", observed: "", outcome: "pending" };
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return { question: "", evidence: "", observed: "", outcome: "pending" };
      const parsed = JSON.parse(saved) as { validationEvidence?: Partial<{ question: string; evidence: string; observed: string; outcome: ValidationEvidenceOutcome }> };
      return {
        question: parsed.validationEvidence?.question ?? "",
        evidence: parsed.validationEvidence?.evidence ?? "",
        observed: parsed.validationEvidence?.observed ?? "",
        outcome: parsed.validationEvidence?.outcome ?? "pending",
      };
    } catch {
      return { question: "", evidence: "", observed: "", outcome: "pending" };
    }
  });

  const engineeringBench = getBench(workshop, "engineering");
  const canCreateConcept = engineeringBench?.state !== "dormant";

  const conceptSheet = useMemo(() => {
    const engineering = project.engineeringState;
    const constraints = engineering.currentConstraints.filter(Boolean);
    const assumptions = engineering.currentAssumptions.filter(Boolean);
    const validationQuestions =
      project.validationPlan?.items
        .filter((item) => item.status !== "completed")
        .slice(0, 3)
        .map((item) => item.target || item.title) ?? [];

    const unresolvedQuestions = [
      engineering.greatestRemainingUncertainty,
      ...validationQuestions,
    ].filter((item, index, items) => Boolean(item) && items.indexOf(item) === index);

    return {
      purpose:
        project.purpose.trim() ||
        `Develop a workable response to: ${project.originalObservation}`,
      operatingPrinciple:
        engineering.currentUnderstanding.trim() || project.originalObservation,
      constraints:
        constraints.length > 0
          ? constraints
          : ["No hard engineering constraints have been captured yet."],
      assumptions:
        assumptions.length > 0
          ? assumptions
          : ["No explicit assumptions have been recorded yet."],
      unresolvedQuestions:
        unresolvedQuestions.length > 0
          ? unresolvedQuestions
          : ["REV has not yet identified the next engineering uncertainty."],
      nextEngineeringMove:
        engineering.nextEngineeringStep || engineeringBench?.nextMove || workshop.summary,
      evidenceCount: project.evidence.length,
    };
  }, [project, engineeringBench, workshop.summary]);

  const visualConceptBrief = useMemo(() => {
    return {
      title: `CONCEPT 01 · ${projectName}`,
      purpose: conceptSheet.purpose,
      principle: conceptSheet.operatingPrinciple,
      constraints: conceptSheet.constraints,
      assumptions: conceptSheet.assumptions,
      unknowns: conceptSheet.unresolvedQuestions,
      nextMove: conceptSheet.nextEngineeringMove,
    };
  }, [conceptSheet, projectName]);

  const refinementDirective = useMemo(() => {
    const note = conceptReview === "unreviewed"
      ? "No review has been recorded yet."
      : conceptReviewNotes[conceptReview].trim() || "No additional review note was recorded.";

    if (conceptReview === "accepted") {
      return {
        focus: "PRESERVE CURRENT DIRECTION",
        directive: "Carry the accepted concept forward while tightening the engineering detail around the current working direction.",
        note,
        nextMove: "Advance the accepted concept into a more defined second-pass study.",
      };
    }

    if (conceptReview === "rethink") {
      return {
        focus: "RECONSIDER CORE APPROACH",
        directive: "Re-examine the concept against the inventor's concern before committing to the next physical arrangement.",
        note,
        nextMove: "Generate Concept 02 as a deliberate alternative to the first-pass direction.",
      };
    }

    return {
      focus: "REFINE IDENTIFIED ISSUE",
      directive: "Carry the review concern into the next concept and make the identified weakness the primary refinement target.",
      note,
      nextMove: "Generate Concept 02 with the review concern explicitly carried forward.",
    };
  }, [conceptReview, conceptReviewNotes]);

  const refinedConceptRender = useMemo(() => {
    if (!refinedConceptGenerated) return "";
    return refinedConceptSvg || createConceptRenderSvg({
      ...visualConceptBrief,
      conceptLabel: "CONCEPT 02",
      nextMove: refinementDirective.nextMove,
    });
  }, [refinedConceptGenerated, refinedConceptSvg, refinementDirective.nextMove, visualConceptBrief]);

  const refinedConceptDataUri = useMemo(() => {
    if (!refinedConceptRender) return "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(refinedConceptRender)}`;
  }, [refinedConceptRender]);

  const thirdConceptRender = useMemo(() => {
    if (!thirdConceptGenerated) return "";
    return thirdConceptSvg || createConceptRenderSvg({
      ...visualConceptBrief,
      conceptLabel: "CONCEPT 03",
      nextMove: "Re-examine the concept direction using the latest engineering decision before another generation pass.",
    });
  }, [thirdConceptGenerated, thirdConceptSvg, visualConceptBrief]);

  const thirdConceptDataUri = useMemo(() => {
    if (!thirdConceptRender) return "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(thirdConceptRender)}`;
  }, [thirdConceptRender]);

  const generatedConceptRender = useMemo(() => {
    if (!conceptGenerated) return "";
    return generatedConceptSvg || createConceptRenderSvg(visualConceptBrief);
  }, [conceptGenerated, generatedConceptSvg, visualConceptBrief]);

  const generatedConceptDataUri = useMemo(() => {
    if (!generatedConceptRender) return "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generatedConceptRender)}`;
  }, [generatedConceptRender]);

  const selectedBench = useMemo(
    () =>
      getBench(workshop, selectedId) ??
      getBench(workshop, workshop.recommendedBench) ??
      workshop.benches[0],
    [selectedId, workshop]
  );

  function createConcept() {
    if (!canCreateConcept) return;

    if (!conceptCreated) {
      setConceptCreated(true);
      try {
        window.localStorage.setItem(
          conceptStorageKey,
          JSON.stringify({
            version: 1,
            conceptCreated: true,
            projectName,
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        // The concept still works for this session if local storage is unavailable.
      }
    }

    setSelectedId("prototype");
  }

  function visualiseConcept() {
    if (!conceptCreated) return;

    setConceptVisualised(true);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved
        ? (JSON.parse(saved) as Record<string, unknown>)
        : {};

      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 1,
          conceptCreated: true,
          conceptVisualised: true,
          projectName,
          visualisedAt: new Date().toISOString(),
        })
      );
    } catch {
      // The visual study still works for this session if local storage is unavailable.
    }
  }

  function generateConcept() {
    if (!conceptVisualised) return;

    const renderSvg = createConceptRenderSvg(visualConceptBrief);
    setGeneratedConceptSvg(renderSvg);
    setConceptGenerated(true);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved
        ? (JSON.parse(saved) as Record<string, unknown>)
        : {};

      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 2,
          conceptCreated: true,
          conceptVisualised: true,
          conceptGenerated: true,
          generatedConceptSvg: renderSvg,
          projectName,
          generatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // The generated concept still works for this session if local storage is unavailable.
    }
  }

  function reviewConcept(review: Exclude<ConceptReview, "unreviewed">) {
    if (!conceptGenerated) return;

    setConceptReview(review);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved
        ? (JSON.parse(saved) as Record<string, unknown>)
        : {};

      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 3,
          conceptGenerated: true,
          conceptReview: review,
          conceptReviewNotes,
          reviewedAt: new Date().toISOString(),
        })
      );
    } catch {
      // The review still works for this session if local storage is unavailable.
    }
  }

  function generateRefinedConcept() {
    if (conceptReview === "unreviewed") return;

    const renderSvg = createConceptRenderSvg({
      ...visualConceptBrief,
      conceptLabel: "CONCEPT 02",
      nextMove: refinementDirective.nextMove,
    });

    setRefinedConceptSvg(renderSvg);
    setRefinedConceptGenerated(true);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved
        ? (JSON.parse(saved) as Record<string, unknown>)
        : {};

      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 4,
          conceptReview,
          conceptReviewNotes,
          refinedConceptGenerated: true,
          refinedConceptSvg: renderSvg,
          refinementDirective: refinementDirective.directive,
          refinedAt: new Date().toISOString(),
        })
      );
    } catch {
      // The refinement still works for this session if local storage is unavailable.
    }
  }

  function decideConcept(decision: Exclude<ConceptDecision, "undecided">) {
    if (!refinedConceptGenerated) return;

    setConceptDecision(decision);
    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved ? (JSON.parse(saved) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 5,
          conceptDecision: decision,
          conceptDecisionNotes,
          decidedAt: new Date().toISOString(),
        })
      );
    } catch {
      // The decision still works for this session if local storage is unavailable.
    }

    if (decision === "accept") {
      setSelectedId("validation");
    }
    if (decision === "rethink") {
      setSelectedId("engineering");
    }
  }

  function saveConceptDecisionNote(value: string) {
    if (conceptDecision === "undecided") return;

    const nextNotes = { ...conceptDecisionNotes, [conceptDecision]: value };
    setConceptDecisionNotes(nextNotes);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved ? (JSON.parse(saved) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          conceptDecisionNotes: nextNotes,
        })
      );
    } catch {
      // The decision note still works for this session if local storage is unavailable.
    }
  }

  function generateThirdConcept() {
    if (conceptDecision !== "refine") return;

    const renderSvg = createConceptRenderSvg({
      ...visualConceptBrief,
      conceptLabel: "CONCEPT 03",
      nextMove: "Carry the decision note into another deliberate refinement pass.",
    });

    setThirdConceptSvg(renderSvg);
    setThirdConceptGenerated(true);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved ? (JSON.parse(saved) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 6,
          conceptDecision,
          conceptDecisionNotes,
          thirdConceptGenerated: true,
          thirdConceptSvg: renderSvg,
          thirdConceptAt: new Date().toISOString(),
        })
      );
    } catch {
      // The third concept still works for this session if local storage is unavailable.
    }
  }

  function saveConceptReviewNote(value: string) {
    if (conceptReview === "unreviewed") return;

    const nextNotes = { ...conceptReviewNotes, [conceptReview]: value };
    setConceptReviewNotes(nextNotes);

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved
        ? (JSON.parse(saved) as Record<string, unknown>)
        : {};

      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          conceptReviewNotes: nextNotes,
        })
      );
    } catch {
      // The note still works for this session if local storage is unavailable.
    }
  }

  function saveValidationEvidence(patch: Partial<typeof validationEvidence>) {
    const next = { ...validationEvidence, ...patch };
    setValidationEvidence(next);
    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved
        ? (JSON.parse(saved) as Record<string, unknown>)
        : {};
      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          validationEvidence: next,
          validationEvidenceUpdatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Validation evidence still works for this session if local storage is unavailable.
    }
  }

  return (
    <section className="living-workshop" aria-label="reAIdea living workshop">
      <header className="workshop-heading">
        <div>
          <p className="workshop-kicker">reAIdea · Living Workshop</p>
          <h2>Living Engineering Workshop</h2>
          <p className="workshop-project-name">{projectName}</p>
        </div>
        <div className="workshop-header-status">
          <div className="rev-partner-label">REV · AI Engineering Partner</div>
          <p>{workshop.summary}</p>
        </div>
      </header>

      <section className="project-core" aria-label="Active Project">
        <div className="project-core-heading">
          <div>
            <p className="workshop-kicker">Active Project</p>
            <h3>{projectName}</h3>
          </div>
          <span className="project-status">{formatReadiness(project.readiness)}</span>
        </div>
        <p className="project-understanding">
          {summarizeUnderstanding(project.engineeringState.currentUnderstanding)}
        </p>
        <div className="project-signals">
          <span>{project.evidence.length} evidence items</span>
          <span>{project.engineeringState.currentConstraints.length} constraints</span>
          <span>{project.engineeringState.currentAssumptions.length} assumptions</span>
          <span>Next: {project.engineeringState.nextEngineeringStep}</span>
        </div>
      </section>

      <div className="workshop-flow" aria-label="Engineering cycle">
        {[
          "Knowledge",
          "Engineering",
          "Validation",
          "Prototype",
          "Reality",
        ].map((stage, index, stages) => (
          <span key={stage}>
            <b>{stage}</b>
            {index < stages.length - 1 && <i aria-hidden="true">→</i>}
          </span>
        ))}
      </div>

      <div className="room" role="group" aria-label="Workshop benches">
        <div className="ceiling ceiling-left" aria-hidden="true" />
        <div className="ceiling ceiling-right" aria-hidden="true" />
        <div className="beam beam-one" aria-hidden="true" />
        <div className="beam beam-two" aria-hidden="true" />
        <div className="back-wall" aria-hidden="true" />
        <div className="side-wall side-left" aria-hidden="true" />
        <div className="side-wall side-right" aria-hidden="true" />
        <div className="floor" aria-hidden="true" />
        <div className="floor-line floor-line-one" aria-hidden="true" />
        <div className="floor-line floor-line-two" aria-hidden="true" />

        <div className="conduit conduit-main" aria-hidden="true" />
        <div className="conduit conduit-left" aria-hidden="true" />
        <div className="conduit conduit-right" aria-hidden="true" />
        <div className="junction junction-one" aria-hidden="true" />
        <div className="junction junction-two" aria-hidden="true" />
        <div className="junction junction-three" aria-hidden="true" />

        <div className="workshop-plaque" aria-hidden="true">
          <span>reAIdea</span>
          <small>WHERE IDEAS BECOME REAL</small>
        </div>

        <div className="wall-life" aria-hidden="true">
          <span className="shelf shelf-left"><i /><i /><i /></span>
          <span className="shelf shelf-right"><i /><i /></span>
          <span className="tall-cabinet cabinet-left"><i /><i /><i /></span>
          <span className="tall-cabinet cabinet-right"><i /><i /></span>
          <span className="wall-sheet sheet-left"><i /><i /></span>
          <span className="wall-sheet sheet-right"><i /><i /><i /></span>
        </div>

        <div className="rev-station" aria-label="REV, your AI design engineer">
          <div className="rev-bubble">
            <strong>REV</strong>
            <span>{selectedBench.reason}</span>
          </div>
          <div className="rev-figure" aria-hidden="true">
            <div className="rev-hair" />
            <div className="rev-head"><i className="rev-eye rev-eye-left" /><i className="rev-eye rev-eye-right" /><i className="rev-smile" /></div>
            <div className="rev-neck" />
            <div className="rev-body">
              <span>REV</span>
              <i className="rev-pocket" />
            </div>
            <div className="rev-arm rev-arm-left" />
            <div className="rev-arm rev-arm-right" />
            <div className="rev-leg rev-leg-left" />
            <div className="rev-leg rev-leg-right" />
          </div>
        </div>

        {CANONICAL_WORKSHOP_BENCHES.map(({ id, shortLabel, positionClass }) => {
          const bench = getBench(workshop, id);
          if (!bench) return null;

          const isSelected = selectedBench.id === id;

          return (
            <button
              key={id}
              type="button"
              className={`room-bench ${positionClass} state-${bench.state} ${
                isSelected ? "is-selected" : ""
              }`}
              onClick={() => setSelectedId(id)}
              aria-pressed={isSelected}
              aria-label={`${bench.label}: ${stateLabel(bench.state)}`}
            >
              <span className="lamp-rig" aria-hidden="true">
                <span className="lamp-cord" />
                <span className="lamp-cap" />
                <span className="lamp-shade" />
                <span className="room-light" />
                <span className="light-pool" />
              </span>
              <span className="bench-sign">{shortLabel}</span>
              <span className="bench-backsplash" aria-hidden="true">
                <span className="pinboard-line" />
                <span className="pinboard-note note-a" />
                <span className="pinboard-note note-b" />
              </span>
              <span className="bench-top" aria-hidden="true">
                {id !== "prototype" && <span className="bench-screen" />}
                {id !== "prototype" && (
                  <span className="bench-tools">
                    <i className="tool-a" />
                    <i className="tool-b" />
                    <i className="tool-c" />
                  </span>
                )}
                {id === "prototype" && !conceptCreated && <span className="empty-bench-glint" />}
                {id === "prototype" && conceptCreated && (
                  <span className="concept-model" aria-label={`${projectName} concept 01`}>
                    <i className="concept-body" />
                    <i className="concept-deck" />
                    <i className="concept-wheel concept-wheel-left" />
                    <i className="concept-wheel concept-wheel-right" />
                    <b>CONCEPT 01</b>
                  </span>
                )}
              </span>
              <span className="bench-cabinet" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="bench-stool" aria-hidden="true"><i /><b /></span>
              <span className="bench-shadow" aria-hidden="true" />
              <span className="bench-status">{stateLabel(bench.state)}</span>
            </button>
          );
        })}

        <p className="room-caption">
          One project brain · every bench listens to the same evolving invention.
        </p>
      </div>

      <section className="bench-overview" aria-label="Workshop bench overview">
        {CANONICAL_WORKSHOP_BENCHES.map(({ id, shortLabel, informational }) => {
          const bench = getBench(workshop, id);
          if (!bench) return null;

          return (
            <button
              key={id}
              type="button"
              className={`bench-overview-card ${selectedBench.id === id ? "is-selected" : ""}`}
              onClick={() => setSelectedId(id)}
            >
              <span className="bench-overview-heading">
                <strong>{shortLabel}</strong>
                <em>{stateLabel(bench.state)}</em>
              </span>
              <span>{bench.reason}</span>
              <small>
                {informational ? "Informational · Future capability" : `Next: ${bench.nextMove}`}
              </small>
            </button>
          );
        })}
      </section>

      <div className={`bench-readout readout-${selectedBench.state}`}>
        <div className="readout-title">
          <div>
            <span className="readout-light" aria-hidden="true" />
            <strong>{selectedBench.label}</strong>
          </div>
          <span>{stateLabel(selectedBench.state)}</span>
        </div>
        <p>{selectedBench.reason}</p>
        <div className="next-move">
          <span>REV · NEXT MOVE</span>
          <strong>{selectedBench.nextMove}</strong>
        </div>
        {selectedBench.id === "knowledge" && (
          <div className="bench-entry-action">
            <p>Review and record the Project&apos;s structured inventor knowledge.</p>
            <Link href="/interview">Open Interview</Link>
          </div>
        )}
        {selectedBench.id === "validation" && (conceptDecision === "accept" || selectedBench.state === "pulse" || selectedBench.state === "active") && (
          <div className="concept-decision-panel">
            <div className="concept-decision-heading">
              <div>
                <span>REV · VALIDATION EVIDENCE</span>
                <strong>Turn the accepted concept into testable evidence.</strong>
              </div>
              <b>{validationEvidence.outcome === "pending" ? "EVIDENCE PENDING" : validationEvidence.outcome.toUpperCase()}</b>
            </div>
            <p className="concept-decision-intro">
              Validation is not a second opinion. Record what must be proven, what evidence will count, and what the observation actually showed.
            </p>
            <div className="concept-refinement-grid">
              <section>
                <span>VALIDATION QUESTION</span>
                <textarea value={validationEvidence.question} onChange={(event) => saveValidationEvidence({ question: event.target.value })} placeholder="What must be true for Concept 02 to remain credible?" rows={3} />
              </section>
              <section>
                <span>EVIDENCE TO COLLECT</span>
                <textarea value={validationEvidence.evidence} onChange={(event) => saveValidationEvidence({ evidence: event.target.value })} placeholder="What measurement, test, observation, comparison, or prototype evidence will answer it?" rows={3} />
              </section>
            </div>
            <label className="concept-decision-note">
              <span>OBSERVED RESULT</span>
              <textarea value={validationEvidence.observed} onChange={(event) => saveValidationEvidence({ observed: event.target.value })} placeholder="Record what actually happened. Separate observation from interpretation." rows={4} />
            </label>
            <div className="concept-decision-actions">
              <button type="button" className={validationEvidence.outcome === "supported" ? "is-selected" : ""} onClick={() => saveValidationEvidence({ outcome: "supported" })}>SUPPORTED</button>
              <button type="button" className={validationEvidence.outcome === "inconclusive" ? "is-selected" : ""} onClick={() => saveValidationEvidence({ outcome: "inconclusive" })}>INCONCLUSIVE</button>
              <button type="button" className={validationEvidence.outcome === "not-supported" ? "is-selected" : ""} onClick={() => saveValidationEvidence({ outcome: "not-supported" })}>NOT SUPPORTED</button>
            </div>
            <div className={`concept-decision-status decision-${validationEvidence.outcome}`}>
              {validationEvidence.outcome === "pending" && "No validation outcome recorded yet."}
              {validationEvidence.outcome === "supported" && "Evidence currently supports the tested proposition. Record what should be tested next."}
              {validationEvidence.outcome === "inconclusive" && "The evidence is insufficient to decide. Define the next test or observation."}
              {validationEvidence.outcome === "not-supported" && "The evidence does not support the proposition. Feed the finding back into Engineering."}
            </div>
          </div>
        )}
        {selectedBench.id === "engineering" && (
          <div className="engineering-action">
            <div>
              <span>ENGINEERING BENCH</span>
              <strong>Turn what we know into the first visible concept.</strong>
              {!canCreateConcept && (
                <small>REV needs more Engineering definition before this control can be used.</small>
              )}
            </div>
            <button type="button" onClick={createConcept} disabled={!canCreateConcept}>
              {conceptCreated ? "OPEN CONCEPT 01" : "CREATE CONCEPT"}
            </button>
          </div>
        )}
        {conceptCreated && selectedBench.id === "prototype" && (
          <div className="concept-readout">
            <div className="concept-sheet-heading">
              <div>
                <span>PROTOTYPE BENCH · CONCEPT 01</span>
                <strong>{projectName}</strong>
              </div>
              <b>CONCEPT SHEET</b>
            </div>
            <p className="concept-persistence-note">Saved with this Project workshop · safe to refresh or return later.</p>
            <div className="concept-visual-actions">
              <button type="button" className="concept-visualise-button" onClick={visualiseConcept}>
                {conceptVisualised ? "CONCEPT VISUALISED" : "VISUALISE CONCEPT"}
              </button>
              <span>{conceptVisualised ? "First visual study generated from the current engineering understanding." : "Turn the Concept Sheet into a first visual study."}</span>
            </div>
            {conceptVisualised && (
              <div className="concept-visual-board" aria-label="Concept 01 visual study">
                <div className="visual-board-grid" aria-hidden="true" />
                <div className="visual-board-label">CONCEPT 01 · ENGINEERING STUDY</div>
                <div className="visual-object">
                  <i className="visual-object-top" />
                  <i className="visual-object-core" />
                  <i className="visual-object-leg visual-object-leg-left" />
                  <i className="visual-object-leg visual-object-leg-right" />
                  <span className="visual-callout visual-callout-purpose">PURPOSE</span>
                  <span className="visual-callout visual-callout-constraint">CONSTRAINT</span>
                  <span className="visual-callout visual-callout-unknown">UNKNOWN</span>
                </div>
                <div className="visual-board-footer">REV · FIRST-PASS VISUAL ONLY · NOT A CAD MODEL</div>
              </div>
            )}

            {conceptVisualised && (
              <div className="visual-concept-brief">
                <div className="visual-concept-brief-heading">
                  <div>
                    <span>REV · VISUAL CONCEPT BRIEF</span>
                    <strong>{visualConceptBrief.title}</strong>
                  </div>
                  <b>ENGINEERING HANDOFF</b>
                </div>

                <p className="visual-concept-brief-intro">
                  Translate the current Project engineering state into a first-pass visual.
                  This brief is the controlled handoff between REV reasoning and future visual generation.
                </p>

                <div className="visual-concept-brief-grid">
                  <section>
                    <span>PURPOSE</span>
                    <p>{visualConceptBrief.purpose}</p>
                  </section>

                  <section>
                    <span>OPERATING PRINCIPLE</span>
                    <p>{visualConceptBrief.principle}</p>
                  </section>

                  <section>
                    <span>KEY CONSTRAINTS</span>
                    <ul>
                      {visualConceptBrief.constraints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <span>ASSUMPTIONS</span>
                    <ul>
                      {visualConceptBrief.assumptions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="visual-concept-brief-warning">
                    <span>UNRESOLVED QUESTIONS</span>
                    <ul>
                      {visualConceptBrief.unknowns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="visual-concept-brief-next">
                    <span>NEXT ENGINEERING MOVE</span>
                    <p>{visualConceptBrief.nextMove}</p>
                  </section>
                </div>

                <div className="visual-concept-brief-footer">
                  REV · STRUCTURED VISUAL INPUT · NOT A CAD MODEL
                </div>

                <div className="concept-generation-action">
                  <div>
                    <span>REV · CONCEPT GENERATION</span>
                    <strong>{conceptGenerated ? "CONCEPT STUDY GENERATED" : "Generate the first concept render from this brief."}</strong>
                    <small>{conceptGenerated ? "Saved with this Project workshop. The render remains a first-pass engineering study." : "This stage turns the approved visual brief into a visual concept study."}</small>
                  </div>
                  <button type="button" onClick={generateConcept}>
                    {conceptGenerated ? "CONCEPT GENERATED" : "GENERATE CONCEPT"}
                  </button>
                </div>

                {conceptGenerated && generatedConceptDataUri && (
                  <div className="generated-concept-board generated-concept-board-real" aria-label="Generated Concept 01 study">
                    <img
                      className="generated-concept-image"
                      src={generatedConceptDataUri}
                      alt={`Generated engineering concept for ${projectName}`}
                    />
                    <div className="generated-concept-meta">
                      <span>GENERATED FROM APPROVED VISUAL BRIEF</span>
                      <b>PROCEDURAL ENGINEERING RENDER</b>
                    </div>
                  </div>
                )}

                {conceptGenerated && (
                  <div className="concept-review-panel">
                    <div className="concept-review-heading">
                      <div>
                        <span>REV · CONCEPT REVIEW</span>
                        <strong>Challenge the first-pass concept</strong>
                      </div>
                      <b>{conceptReview === "unreviewed" ? "AWAITING REVIEW" : conceptReview.toUpperCase()}</b>
                    </div>

                    <p className="concept-review-intro">
                      The render is a hypothesis, not a conclusion. Record the inventor&apos;s judgement before the next refinement.
                    </p>

                    <div className="concept-review-actions">
                      <button type="button" className={conceptReview === "accepted" ? "is-selected" : ""} onClick={() => reviewConcept("accepted")}>ACCEPT CONCEPT</button>
                      <button type="button" className={conceptReview === "refine" ? "is-selected" : ""} onClick={() => reviewConcept("refine")}>NEEDS REFINEMENT</button>
                      <button type="button" className={conceptReview === "rethink" ? "is-selected" : ""} onClick={() => reviewConcept("rethink")}>RETHINK CONCEPT</button>
                    </div>

                    <label className="concept-review-note">
                      <span>REV · REVIEW NOTE</span>
                      <textarea
                        value={conceptReview === "unreviewed" ? "" : conceptReviewNotes[conceptReview]}
                        onChange={(event) => saveConceptReviewNote(event.target.value)}
                        placeholder="What looks right, wrong, missing, or worth changing?"
                        rows={3}
                      />
                    </label>

                    <div className={`concept-review-status review-${conceptReview}`}>
                      {conceptReview === "unreviewed" && "No judgement recorded yet."}
                      {conceptReview === "accepted" && "Concept accepted as the current working direction."}
                      {conceptReview === "refine" && "Refinement required before this becomes the next working direction."}
                      {conceptReview === "rethink" && "The concept should be reconsidered before further development."}
                    </div>

                    {conceptReview !== "unreviewed" && (
                      <>
                        <div className="concept-refinement-panel">
                          <div className="concept-refinement-heading">
                            <div>
                              <span>REV · REFINEMENT DIRECTIVE</span>
                              <strong>{refinementDirective.focus}</strong>
                            </div>
                            <b>CONCEPT 02</b>
                          </div>

                          <p className="concept-refinement-directive">{refinementDirective.directive}</p>

                          <div className="concept-refinement-grid">
                            <section>
                              <span>INVENTOR REVIEW</span>
                              <p>{refinementDirective.note}</p>
                            </section>
                            <section>
                              <span>NEXT ENGINEERING MOVE</span>
                              <p>{refinementDirective.nextMove}</p>
                            </section>
                          </div>

                          <button type="button" className="concept-refinement-button" onClick={generateRefinedConcept}>
                            {refinedConceptGenerated ? "CONCEPT 02 GENERATED" : "GENERATE CONCEPT 02"}
                          </button>
                        </div>

                        {refinedConceptGenerated && refinedConceptDataUri && (
                          <div className="generated-concept-board generated-concept-board-real concept-two-board" aria-label="Generated Concept 02 refinement study">
                            <img
                              className="generated-concept-image"
                              src={refinedConceptDataUri}
                              alt={`Refined engineering concept for ${projectName}`}
                            />
                            <div className="generated-concept-meta">
                              <span>GENERATED FROM REVIEW-DRIVEN REFINEMENT</span>
                              <b>CONCEPT 02 · SECOND-PASS STUDY</b>
                            </div>
                          </div>
                        )}

                        {refinedConceptGenerated && (
                          <div className="concept-decision-panel">
                            <div className="concept-decision-heading">
                              <div>
                                <span>REV · ENGINEERING DECISION</span>
                                <strong>Is Concept 02 ready to move forward?</strong>
                              </div>
                              <b>{conceptDecision === "undecided" ? "DECISION PENDING" : conceptDecision.toUpperCase()}</b>
                            </div>
                            <p className="concept-decision-intro">
                              This is a stage gate. Accept the direction for validation, refine it again, or deliberately rethink the direction.
                            </p>
                            <div className="concept-decision-actions">
                              <button type="button" className={conceptDecision === "accept" ? "is-selected" : ""} onClick={() => decideConcept("accept")}>ACCEPT FOR VALIDATION</button>
                              <button type="button" className={conceptDecision === "refine" ? "is-selected" : ""} onClick={() => decideConcept("refine")}>REFINE AGAIN</button>
                              <button type="button" className={conceptDecision === "rethink" ? "is-selected" : ""} onClick={() => decideConcept("rethink")}>RETHINK DIRECTION</button>
                            </div>
                            <label className="concept-decision-note">
                              <span>REV · DECISION NOTE</span>
                              <textarea
                                value={conceptDecision === "undecided" ? "" : conceptDecisionNotes[conceptDecision]}
                                onChange={(event) => saveConceptDecisionNote(event.target.value)}
                                placeholder="Why is this concept ready, not ready, or headed in the wrong direction?"
                                rows={3}
                              />
                            </label>
                            <div className={`concept-decision-status decision-${conceptDecision}`}>
                              {conceptDecision === "undecided" && "No engineering decision recorded yet."}
                              {conceptDecision === "accept" && "Concept 02 accepted for the Validation bench."}
                              {conceptDecision === "refine" && "Another refinement pass is required before validation."}
                              {conceptDecision === "rethink" && "Return to Engineering reasoning and reconsider the direction."}
                            </div>

                            {conceptDecision === "refine" && (
                              <button type="button" className="concept-refinement-button" onClick={generateThirdConcept}>
                                {thirdConceptGenerated ? "CONCEPT 03 GENERATED" : "GENERATE CONCEPT 03"}
                              </button>
                            )}

                            {conceptDecision === "rethink" && (
                              <div className="concept-decision-handoff">
                                <span>REV · ENGINEERING HANDOFF</span>
                                <p>The previous concepts remain preserved. Continue the reasoning from the Engineering bench before generating another direction.</p>
                              </div>
                            )}

                            {conceptDecision === "accept" && (
                              <div className="concept-decision-handoff">
                                <span>REV · VALIDATION HANDOFF</span>
                                <p>Concept 02 is now the working candidate for validation. The earlier concepts and review history remain preserved.</p>
                              </div>
                            )}

                            {thirdConceptGenerated && thirdConceptDataUri && (
                              <div className="generated-concept-board generated-concept-board-real concept-three-board" aria-label="Generated Concept 03 refinement study">
                                <img
                                  className="generated-concept-image"
                                  src={thirdConceptDataUri}
                                  alt={`Third-pass engineering concept for ${projectName}`}
                                />
                                <div className="generated-concept-meta">
                                  <span>GENERATED FROM SECOND DECISION GATE</span>
                                  <b>CONCEPT 03 · THIRD-PASS STUDY</b>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {!conceptVisualised && (
              <div className="concept-sheet-grid">
                <section className="concept-sheet-card concept-sheet-wide">
                  <span>PURPOSE</span>
                  <p>{conceptSheet.purpose}</p>
                </section>
                <section className="concept-sheet-card concept-sheet-wide">
                  <span>CURRENT OPERATING PRINCIPLE</span>
                  <p>{conceptSheet.operatingPrinciple}</p>
                </section>
                <section className="concept-sheet-card">
                  <span>KEY CONSTRAINTS</span>
                  <ul>{conceptSheet.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card">
                  <span>ASSUMPTIONS</span>
                  <ul>{conceptSheet.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card concept-sheet-alert">
                  <span>UNRESOLVED QUESTIONS</span>
                  <ul>{conceptSheet.unresolvedQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card concept-sheet-next">
                  <span>NEXT ENGINEERING MOVE</span>
                  <p>{conceptSheet.nextEngineeringMove}</p>
                  <small>{conceptSheet.evidenceCount} evidence item{conceptSheet.evidenceCount === 1 ? "" : "s"} currently attached to the Project.</small>
                </section>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .living-workshop {
          box-sizing: border-box;
          width: min(1500px, calc(100% - 28px));
          max-width: 1500px;
          margin-top: 28px;
          margin-left: 50%;
          transform: translateX(-50%);
          padding: 16px 20px 20px;
          border: 1px solid #415064;
          border-radius: 20px;
          background: #111923;
          box-shadow: 0 22px 70px rgba(8, 13, 20, 0.24);
          overflow: hidden;
        }

        .project-core {
          max-width: 1360px;
          margin: 0 auto 12px;
          padding: 16px 20px;
          border: 1px solid #4b6878;
          border-radius: 14px;
          background: linear-gradient(135deg, #152631, #0d1721);
          box-shadow: 0 14px 34px rgba(5, 12, 18, 0.18);
        }

        .project-core-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .project-core-heading h3 {
          margin: 0;
          color: #f5fafc;
          font-size: clamp(23px, 2.4vw, 34px);
          line-height: 1.12;
        }

        .project-status {
          padding: 7px 11px;
          border: 1px solid #56c3d5;
          border-radius: 999px;
          color: #a8f2fa;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .project-understanding {
          max-width: 980px;
          margin: 10px 0 0;
          color: #d5e2e7;
          line-height: 1.6;
          white-space: pre-line;
        }

        .project-signals {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 12px;
          color: #9fb4be;
          font-size: 12px;
        }

        .project-signals span:last-child {
          flex-basis: 100%;
          color: #c4d8de;
        }

        .workshop-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 1360px;
          margin: 0 auto 12px;
          padding: 9px 14px;
          border: 1px solid #314a59;
          border-radius: 10px;
          background: #0c151e;
          color: #9fb4be;
          font-size: 12px;
          letter-spacing: 0.03em;
        }

        .workshop-flow span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .workshop-flow b {
          color: #d9eef2;
          font-weight: 750;
        }

        .workshop-flow i {
          color: #4cd4e7;
          font-style: normal;
          font-size: 16px;
        }

        .workshop-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
          gap: 28px;
          align-items: end;
          max-width: 1360px;
          margin: 0 auto 16px;
        }

        .workshop-kicker {
          margin: 0 0 6px;
          color: #1bd7ff;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .workshop-heading h2 {
          margin: 0;
          color: #f4f7fb;
          font-size: clamp(22px, 2vw, 30px);
          letter-spacing: -0.02em;
        }

        .workshop-project-name {
          margin: 7px 0 0;
          color: #a9c0c8;
          font-size: 13px;
        }

        .workshop-header-status {
          max-width: 460px;
          padding: 14px 16px;
          border-left: 2px solid #33d8ef;
          background: rgba(8, 20, 28, 0.56);
        }

        .rev-partner-label {
          color: #72e2ef;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .workshop-header-status p {
          margin: 8px 0 0;
          color: #c3d1d7;
          line-height: 1.5;
        }

        .bench-overview {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          max-width: 1360px;
          margin: 18px auto 0;
        }

        .bench-overview-card {
          min-height: 150px;
          padding: 14px;
          border: 1px solid #334b5b;
          border-radius: 10px;
          background: #0c151e;
          color: #b9cbd1;
          text-align: left;
          cursor: pointer;
          transition: border-color 140ms ease, background 140ms ease;
        }

        .bench-overview-card:hover,
        .bench-overview-card.is-selected {
          border-color: #35d8ed;
          background: #12232d;
        }

        .bench-overview-card > span:not(.bench-overview-heading) {
          display: block;
          margin-top: 11px;
          font-size: 12px;
          line-height: 1.45;
        }

        .bench-overview-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .bench-overview-heading strong {
          color: #eef8fa;
          font-size: 13px;
        }

        .bench-overview-heading em {
          color: #70dce9;
          font-size: 10px;
          font-style: normal;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .bench-overview-card small {
          display: block;
          margin-top: 10px;
          color: #819da7;
          font-size: 11px;
          line-height: 1.4;
        }

        .workshop-summary {
          margin: 0;
          color: #b7c1cf;
          line-height: 1.55;
        }

        .room {
          position: relative;
          min-height: 610px;
          overflow: hidden;
          border: 1px solid #546375;
          border-radius: 17px;
          background:
            radial-gradient(circle at 50% 32%, rgba(255, 223, 167, 0.28), transparent 31%),
            radial-gradient(circle at 18% 48%, rgba(255, 221, 170, 0.08), transparent 20%),
            radial-gradient(circle at 82% 48%, rgba(255, 221, 170, 0.08), transparent 20%),
            linear-gradient(#3b4348 0%, #41494e 48%, #292f34 66%, #1a2025 100%);
          box-shadow:
            inset 0 0 80px rgba(15, 22, 28, 0.25),
            inset 0 -90px 120px rgba(7, 11, 15, 0.34);
          isolation: isolate;
        }

        .back-wall {
          position: absolute;
          left: 12%;
          right: 12%;
          top: 68px;
          bottom: 35%;
          background:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(#596168, #3f474d);
          background-size: 38px 22px, 76px 22px, auto;
          border-left: 2px solid rgba(255,255,255,0.09);
          border-right: 2px solid rgba(0,0,0,0.20);
          box-shadow: inset 0 -70px 80px rgba(25,31,35,0.28);
          z-index: -8;
        }

        .side-wall {
          position: absolute;
          top: 72px;
          bottom: 29%;
          width: 28%;
          background: linear-gradient(#4a5359, #30383e);
          z-index: -9;
        }

        .side-left {
          left: -14%;
          transform: skewY(7deg);
        }

        .side-right {
          right: -14%;
          transform: skewY(-7deg);
        }

        .ceiling {
          position: absolute;
          top: -120px;
          width: 66%;
          height: 250px;
          background:
            repeating-linear-gradient(90deg, transparent 0 84px, rgba(212,220,223,0.16) 85px 89px),
            linear-gradient(#252d32, #353d42);
          border-bottom: 4px solid #687278;
          z-index: -2;
        }

        .ceiling-left { left: -7%; transform: rotate(10deg); }
        .ceiling-right { right: -7%; transform: rotate(-10deg); }

        .beam {
          position: absolute;
          top: 74px;
          height: 12px;
          width: 62%;
          background: linear-gradient(#727b7e, #3b4347);
          border: 1px solid #7a8588;
          box-shadow: 0 6px 10px rgba(0,0,0,0.30);
          z-index: -1;
        }

        .beam-one { left: -4%; transform: rotate(5deg); }
        .beam-two { right: -4%; transform: rotate(-5deg); }

        .floor {
          position: absolute;
          left: -8%;
          right: -8%;
          bottom: -12%;
          height: 58%;
          background:
            radial-gradient(ellipse at 50% 15%, rgba(255,220,164,0.13), transparent 42%),
            repeating-linear-gradient(90deg, transparent 0 120px, rgba(255,255,255,0.025) 121px 123px),
            linear-gradient(#4c5050, #272c30 64%, #171c20);
          transform: perspective(700px) rotateX(58deg);
          transform-origin: bottom;
          z-index: -7;
        }

        .floor-line {
          position: absolute;
          bottom: 66px;
          height: 2px;
          background: rgba(255, 221, 161, 0.18);
          z-index: -4;
        }

        .floor-line-one { left: 7%; right: 7%; transform: rotate(-2deg); }
        .floor-line-two { left: 18%; right: 18%; bottom: 126px; transform: rotate(1deg); }

        .conduit {
          position: absolute;
          border: 1px solid #8d8d86;
          background: linear-gradient(#8d8f8c, #505559);
          box-shadow: 0 2px 4px rgba(0,0,0,0.34);
          z-index: 0;
        }

        .conduit-main {
          top: 119px;
          left: 5%;
          right: 5%;
          height: 5px;
          border-radius: 999px;
        }

        .conduit-left {
          left: 8%;
          top: 119px;
          width: 5px;
          height: 98px;
        }

        .conduit-right {
          right: 8%;
          top: 119px;
          width: 5px;
          height: 98px;
        }

        .junction {
          position: absolute;
          top: 112px;
          width: 18px;
          height: 18px;
          border: 2px solid #888c89;
          border-radius: 4px;
          background: #474d50;
          z-index: 1;
        }

        .junction-one { left: 27%; }
        .junction-two { left: calc(50% - 9px); }
        .junction-three { right: 27%; }

        .workshop-plaque {
          position: absolute;
          top: 136px;
          left: 50%;
          transform: translateX(-50%);
          width: 210px;
          padding: 10px 16px 9px;
          border: 1px solid #78838a;
          border-radius: 4px;
          background: linear-gradient(#2f383d, #20282d);
          color: #f0f3f5;
          text-align: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.28);
          z-index: 1;
        }

        .workshop-plaque span {
          display: block;
          color: #35d9f4;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .workshop-plaque small {
          display: block;
          margin-top: 2px;
          color: #cdd5da;
          font-size: 8px;
          letter-spacing: 0.12em;
        }

        .wall-life {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: -1;
        }

        .shelf {
          position: absolute;
          top: 184px;
          width: 150px;
          height: 8px;
          border: 1px solid #707778;
          background: #343b3d;
          box-shadow: 0 6px 8px rgba(0,0,0,0.22);
        }

        .shelf-left { left: 4%; }
        .shelf-right { right: 4%; }

        .shelf i {
          position: absolute;
          bottom: 7px;
          width: 24px;
          border: 1px solid #6e7575;
          background: #434b4d;
        }

        .shelf i:nth-child(1) { left: 8px; height: 31px; }
        .shelf i:nth-child(2) { left: 42px; height: 23px; background: #68604f; }
        .shelf i:nth-child(3) { right: 13px; height: 37px; }

        .tall-cabinet {
          position: absolute;
          top: 336px;
          width: 68px;
          height: 146px;
          border: 1px solid #646c6e;
          background: linear-gradient(90deg, #343b3e, #252c2f);
          box-shadow: 8px 12px 16px rgba(0,0,0,0.22);
        }

        .cabinet-left { left: 1.2%; }
        .cabinet-right { right: 1.2%; }

        .tall-cabinet i {
          display: block;
          height: 31%;
          border-bottom: 1px solid #555e61;
          position: relative;
        }

        .tall-cabinet i::after {
          content: "";
          position: absolute;
          top: 8px;
          left: 50%;
          width: 15px;
          height: 2px;
          transform: translateX(-50%);
          background: #727979;
        }

        .wall-sheet {
          position: absolute;
          top: 158px;
          width: 78px;
          height: 66px;
          border: 1px solid rgba(221,216,199,0.45);
          background: rgba(214,208,190,0.19);
          transform: rotate(-2deg);
        }

        .sheet-left { left: 19%; }
        .sheet-right { right: 19%; transform: rotate(2deg); }

        .wall-sheet i {
          display: block;
          width: 65%;
          height: 2px;
          margin: 10px auto 0;
          background: rgba(216,219,213,0.35);
        }

        .room-bench {
          position: absolute;
          width: 13.5%;
          min-width: 112px;
          height: 176px;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #edf2f6;
          cursor: pointer;
          z-index: 3;
        }

        .room-bench:focus-visible {
          outline: 3px solid #34d9ff;
          outline-offset: 7px;
          border-radius: 10px;
        }

        .bench-sign {
          position: absolute;
          left: 50%;
          bottom: 137px;
          transform: translateX(-50%);
          width: max-content;
          max-width: 155px;
          padding: 5px 9px;
          border: 1px solid #6c7478;
          border-radius: 4px;
          background: linear-gradient(#383c3d, #222628);
          color: #f0ede5;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .lamp-rig {
          position: absolute;
          left: 50%;
          bottom: 166px;
          width: 124px;
          height: 132px;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .lamp-cord {
          position: absolute;
          left: 50%;
          top: 0;
          width: 3px;
          height: 72px;
          transform: translateX(-50%);
          background: #303637;
          box-shadow: 1px 0 #8a8981;
        }

        .lamp-cap {
          position: absolute;
          left: 50%;
          top: 64px;
          width: 16px;
          height: 10px;
          transform: translateX(-50%);
          border-radius: 4px 4px 1px 1px;
          background: #313637;
        }

        .lamp-shade {
          position: absolute;
          left: 50%;
          top: 71px;
          width: 66px;
          height: 29px;
          transform: translateX(-50%);
          border: 1px solid #6a6a63;
          border-radius: 34px 34px 7px 7px;
          background: linear-gradient(#4b4e4c, #25292a);
          box-shadow: 0 5px 7px rgba(0,0,0,0.46);
        }

        .lamp-shade::after {
          content: "";
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: -5px;
          height: 9px;
          border-radius: 50%;
          background: #3a3c39;
        }

        .room-light {
          position: absolute;
          left: 50%;
          top: 94px;
          width: 21px;
          height: 8px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: #b9ad94;
          box-shadow: 0 0 8px 3px rgba(255, 218, 157, 0.18);
          z-index: 2;
        }

        .light-pool {
          position: absolute;
          left: 50%;
          top: 99px;
          width: 140px;
          height: 122px;
          transform: translateX(-50%);
          clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
          background: linear-gradient(rgba(255, 221, 165, 0.13), transparent 80%);
          opacity: 0.35;
          filter: blur(2px);
        }

        .bench-backsplash {
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: 86px;
          height: 56px;
          border: 1px solid #646d72;
          background: linear-gradient(#3f4649, #30373a);
          box-shadow: inset 0 -10px 16px rgba(0,0,0,0.16);
        }

        .pinboard-line {
          position: absolute;
          left: 10%;
          right: 10%;
          top: 18px;
          height: 2px;
          background: #798387;
          opacity: 0.45;
        }

        .pinboard-note {
          position: absolute;
          width: 18px;
          height: 20px;
          background: #c9c0a7;
          opacity: 0.52;
          transform: rotate(-4deg);
        }

        .note-a { left: 20%; top: 8px; }
        .note-b { right: 20%; top: 26px; transform: rotate(5deg); }

        .bench-top {
          position: absolute;
          left: 3%;
          right: 3%;
          bottom: 55px;
          height: 38px;
          border: 1px solid #687276;
          border-radius: 4px 4px 2px 2px;
          background: linear-gradient(#71685b, #46413a);
          box-shadow: inset 0 -8px #2b2d2c, 0 10px 15px rgba(0,0,0,0.24);
        }

        .bench-cabinet {
          position: absolute;
          left: 10%;
          right: 10%;
          bottom: 4px;
          height: 53px;
          border: 1px solid #596267;
          border-top: 0;
          background: linear-gradient(90deg, #343b3e, #2b3235);
        }

        .bench-cabinet i {
          position: absolute;
          top: 11px;
          bottom: 8px;
          width: 32%;
          border: 1px solid #4d565b;
          background: #262d31;
        }

        .bench-cabinet i:first-child { left: 10%; }
        .bench-cabinet i:last-child { right: 10%; }

        .bench-screen {
          position: absolute;
          left: 27%;
          right: 27%;
          top: 5px;
          height: 25px;
          border: 1px solid #697a85;
          background: linear-gradient(#17242f, #0d171f);
          box-shadow: inset 0 0 9px rgba(55, 217, 245, 0.08);
        }

        .bench-status {
          position: absolute;
          left: 50%;
          bottom: -19px;
          transform: translateX(-50%);
          color: rgba(232,238,242,0.62);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .bench-tools {
          position: absolute;
          inset: 0;
          display: block;
        }

        .bench-tools i {
          position: absolute;
          display: block;
          opacity: 0.84;
        }

        .tool-a {
          left: 8%;
          bottom: 5px;
          width: 23px;
          height: 5px;
          border: 1px solid #9b9a91;
          border-radius: 2px;
          background: #6a6b67;
          transform: rotate(-8deg);
        }

        .tool-b {
          right: 9%;
          bottom: 6px;
          width: 16px;
          height: 11px;
          border: 1px solid #8a8e8c;
          background: #373e40;
          transform: rotate(5deg);
        }

        .tool-c {
          left: 49%;
          bottom: 4px;
          width: 3px;
          height: 18px;
          background: #b18b58;
          transform: rotate(18deg);
          transform-origin: bottom;
        }

        .slot-discovery .tool-a { width: 28px; height: 18px; border-radius: 1px; background: #d4ccb5; }
        .slot-discovery .tool-b { width: 10px; height: 14px; background: #8c7051; }
        .slot-engineering .tool-a { width: 38px; height: 4px; background: #a4a39b; }
        .slot-engineering .tool-b { border-radius: 50%; width: 15px; height: 15px; }
        .slot-validation .tool-a { width: 21px; height: 14px; background: #424b4f; }
        .slot-validation .tool-b { width: 4px; height: 19px; border-radius: 3px; background: #c2a35e; }
        .slot-patent .tool-a { width: 30px; height: 20px; background: #ddd5be; border-color: #b9ae93; }
        .slot-patent .tool-b { width: 24px; height: 15px; background: #c8bea8; }
        .slot-marketing .tool-a { width: 22px; height: 18px; background: #8a7762; }
        .slot-marketing .tool-b { width: 20px; height: 16px; background: #5f6870; }
        .slot-manufacturing .tool-a { width: 25px; height: 8px; background: #7d8585; }
        .slot-manufacturing .tool-b { width: 18px; height: 13px; background: #916f46; }
        .slot-reality .tool-a { width: 26px; height: 18px; background: #c7bea7; }


        .concept-model {
          position: absolute;
          left: 50%;
          top: 2px;
          width: 92px;
          height: 35px;
          transform: translateX(-50%);
          filter: drop-shadow(0 7px 7px rgba(0,0,0,0.38));
        }

        .concept-model .concept-body {
          position: absolute;
          left: 12px;
          top: 8px;
          width: 67px;
          height: 17px;
          border: 1px solid #a8c0c4;
          border-radius: 4px 10px 3px 3px;
          background: linear-gradient(135deg, #829398, #46575d 65%, #27353b);
          transform: skewX(-10deg);
          box-shadow: inset 0 0 8px rgba(191,239,245,0.13);
        }

        .concept-model .concept-deck {
          position: absolute;
          left: 23px;
          top: 4px;
          width: 43px;
          height: 6px;
          border: 1px solid #97a9aa;
          background: #303f44;
          transform: skewX(-18deg);
        }

        .concept-wheel {
          position: absolute;
          top: 21px;
          width: 12px;
          height: 12px;
          border: 2px solid #20272a;
          border-radius: 50%;
          background: #556166;
          box-shadow: inset 0 0 0 2px #262d30;
        }

        .concept-wheel-left { left: 20px; }
        .concept-wheel-right { right: 18px; }

        .concept-model b {
          position: absolute;
          left: 50%;
          top: -11px;
          transform: translateX(-50%);
          color: #c9f7ff;
          font-size: 6px;
          letter-spacing: 0.12em;
          white-space: nowrap;
        }

        .empty-bench-glint {
          position: absolute;
          left: 18%;
          right: 18%;
          top: 8px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(235,225,205,0.35), transparent);
        }

        .bench-stool {
          position: absolute;
          left: 50%;
          bottom: -7px;
          width: 31px;
          height: 31px;
          transform: translateX(-50%) translateY(25px);
          opacity: 0.68;
          pointer-events: none;
        }

        .bench-stool::before {
          content: "";
          position: absolute;
          left: 3px;
          right: 3px;
          top: 0;
          height: 7px;
          border: 1px solid #6c6860;
          border-radius: 50%;
          background: #3a3834;
        }

        .bench-stool i, .bench-stool b {
          position: absolute;
          top: 7px;
          width: 2px;
          height: 24px;
          background: #555b5c;
        }

        .bench-stool i { left: 9px; transform: rotate(8deg); }
        .bench-stool b { right: 9px; transform: rotate(-8deg); }

        .bench-shadow {
          position: absolute;
          left: 1%;
          right: 1%;
          bottom: -25px;
          height: 18px;
          border-radius: 50%;
          background: rgba(0,0,0,0.28);
          filter: blur(7px);
          pointer-events: none;
          z-index: -1;
        }

        .state-ready .room-light,
        .state-active .room-light {
          background: #fff0c6;
          box-shadow: 0 0 14px 7px rgba(255, 219, 154, 0.84);
        }

        .state-ready .light-pool,
        .state-active .light-pool {
          opacity: 0.88;
          background: linear-gradient(rgba(255, 222, 165, 0.34), transparent 82%);
        }

        .state-pulse .room-light {
          background: #ffd28f;
          box-shadow: 0 0 17px 9px rgba(255, 179, 78, 0.86);
        }

        .state-pulse .light-pool {
          opacity: 1;
          background: linear-gradient(rgba(255, 190, 94, 0.42), transparent 82%);
        }

        .state-available .room-light {
          background: #e4dfd1;
          box-shadow: 0 0 11px 5px rgba(230, 221, 201, 0.55);
        }

        .state-available .light-pool {
          opacity: 0.58;
        }

        .state-dormant .room-light {
          background: #9c9587;
          box-shadow: 0 0 5px 2px rgba(255, 225, 176, 0.10);
        }

        .state-dormant .light-pool { opacity: 0.18; }
        .state-dormant .bench-backsplash,
        .state-dormant .bench-top,
        .state-dormant .bench-cabinet { filter: saturate(0.72) brightness(0.88); }

        .is-selected .bench-sign {
          border-color: #b6d8df;
          color: #fff;
          box-shadow: 0 0 0 1px rgba(69, 213, 239, 0.20), 0 4px 11px rgba(0,0,0,0.36);
        }

        .is-selected .bench-top { border-color: #90aab3; }
        .is-selected .bench-status { color: #8ce7f7; }

        .slot-discovery { left: 3.2%; top: 257px; }
        .slot-engineering { left: 17.8%; top: 228px; }
        .slot-validation { left: 32.4%; top: 212px; }
        .slot-patent { right: 32.4%; top: 212px; }
        .slot-marketing { right: 17.8%; top: 228px; }
        .slot-manufacturing { right: 3.2%; top: 257px; }
        .slot-reality { right: 2.2%; top: 455px; width: 12.5%; }

        .slot-prototype {
          left: 39%;
          top: 448px;
          width: 22%;
          height: 194px;
          z-index: 5;
        }

        .slot-prototype .bench-sign { bottom: 149px; }
        .slot-prototype .lamp-rig { bottom: 178px; transform: translateX(-50%) scale(1.16); }
        .slot-prototype .bench-backsplash { bottom: 96px; height: 60px; }
        .slot-prototype .bench-top {
          bottom: 58px;
          height: 43px;
          background: linear-gradient(#796d5d, #4a433a);
          box-shadow: inset 0 -8px #302d29, 0 12px 18px rgba(0,0,0,0.28);
        }
        .slot-prototype .bench-cabinet { height: 59px; }

        .rev-station {
          position: absolute;
          left: 22.5%;
          top: 430px;
          display: flex;
          gap: 12px;
          align-items: flex-end;
          z-index: 7;
        }

        .rev-figure {
          position: relative;
          width: 76px;
          height: 190px;
          flex: 0 0 auto;
        }

        .rev-hair {
          position: absolute;
          top: 3px;
          left: 21px;
          width: 38px;
          height: 19px;
          border-radius: 48% 55% 22% 32%;
          background: #313333;
          transform: rotate(-5deg);
          z-index: 2;
        }

        .rev-head {
          position: absolute;
          top: 10px;
          left: 23px;
          width: 35px;
          height: 42px;
          border: 1px solid #8b9293;
          border-radius: 47% 47% 42% 42%;
          background: linear-gradient(#b8aa95, #847866);
        }

        .rev-eye {
          position: absolute;
          top: 17px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #363b3b;
        }

        .rev-eye-left { left: 9px; }
        .rev-eye-right { right: 9px; }

        .rev-smile {
          position: absolute;
          left: 12px;
          top: 27px;
          width: 10px;
          height: 5px;
          border-bottom: 1px solid #4d4b45;
          border-radius: 50%;
        }

        .rev-arm {
          position: absolute;
          top: 67px;
          width: 12px;
          height: 70px;
          border: 1px solid #657074;
          border-radius: 7px;
          background: linear-gradient(#465250, #2d3737);
          z-index: -1;
        }

        .rev-arm-left { left: 3px; transform: rotate(8deg); }
        .rev-arm-right { right: 1px; transform: rotate(-11deg); }

        .rev-neck {
          position: absolute;
          top: 49px;
          left: 34px;
          width: 15px;
          height: 13px;
          background: #776d5d;
        }

        .rev-body {
          position: absolute;
          left: 10px;
          top: 58px;
          width: 60px;
          height: 82px;
          border: 1px solid #6b777b;
          border-radius: 11px 11px 5px 5px;
          background: linear-gradient(#4f5957, #2e3736);
          box-shadow: inset 0 0 18px rgba(255,255,255,0.035);
        }

        .rev-body span {
          position: absolute;
          top: 17px;
          left: 11px;
          padding: 2px 6px;
          border: 1px solid #8b969a;
          border-radius: 3px;
          color: #f3f6f5;
          font-size: 8px;
          font-weight: 900;
        }

        .rev-pocket {
          position: absolute;
          right: 9px;
          top: 15px;
          width: 13px;
          height: 11px;
          border: 1px solid #708084;
        }

        .rev-leg {
          position: absolute;
          top: 136px;
          width: 18px;
          height: 52px;
          border: 1px solid #5d686c;
          background: #313b3d;
        }

        .rev-leg-left { left: 17px; }
        .rev-leg-right { right: 14px; }

        .rev-bubble {
          width: min(270px, 24vw);
          margin-bottom: 84px;
          padding: 12px 14px;
          border: 1px solid #6e7d83;
          border-radius: 10px;
          background: rgba(32, 41, 46, 0.94);
          color: #e1e6e8;
          box-shadow: 0 10px 24px rgba(0,0,0,0.28);
          font-size: 12px;
          line-height: 1.5;
        }

        .rev-bubble strong {
          display: block;
          margin-bottom: 4px;
          color: #39d9f7;
          font-size: 10px;
          letter-spacing: 0.1em;
        }

        .room-caption {
          position: absolute;
          left: 22px;
          bottom: 16px;
          margin: 0;
          color: #9ca8ae;
          font-size: 10px;
          letter-spacing: 0.04em;
        }

        .bench-readout {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px 28px;
          max-width: 1360px;
          margin: 15px auto 0;
          padding: 15px 18px;
          border: 1px solid #415166;
          border-radius: 13px;
          background: #16212d;
        }

        .readout-title,
        .readout-title > div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .readout-title { grid-column: 1 / -1; justify-content: space-between; }

        .readout-title > span {
          color: #9caabd;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .readout-light {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #707780;
        }

        .readout-active .readout-light,
        .readout-ready .readout-light { background: #47d782; }
        .readout-pulse .readout-light { background: #ffb449; }
        .readout-available .readout-light { background: #70d9f0; }

        .bench-readout > p {
          margin: 0;
          color: #c6d0db;
          line-height: 1.55;
        }

        .next-move {
          min-width: 330px;
          padding-left: 22px;
          border-left: 1px solid #34465a;
        }

        .next-move span {
          display: block;
          margin-bottom: 4px;
          color: #35d9f5;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.09em;
        }

        .next-move strong {
          color: #eef2f6;
          font-size: 13px;
          line-height: 1.5;
        }


        .engineering-action {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 3px;
          padding-top: 14px;
          border-top: 1px solid #34465a;
        }

        .engineering-action > div > span,

        .concept-visual-actions { display:flex; align-items:center; gap:12px; margin:14px 0 16px; padding:10px 12px; border:1px solid rgba(74,185,205,.24); background:rgba(12,35,42,.34); }
        .concept-visual-actions span { color:#8299a3; font-size:10px; line-height:1.45; }
        .concept-visualise-button { border:1px solid rgba(93,201,220,.58); background:linear-gradient(180deg,rgba(31,92,105,.92),rgba(15,49,58,.94)); color:#dffbff; padding:9px 13px; font:700 10px/1 Arial,sans-serif; letter-spacing:1.2px; cursor:pointer; box-shadow:0 0 18px rgba(45,178,202,.12); }
        .concept-visualise-button:hover { border-color:rgba(134,224,238,.9); }
        .concept-visual-board { position:relative; min-height:250px; margin:0 0 18px; overflow:hidden; border:1px solid rgba(80,191,210,.34); background:linear-gradient(135deg,#09171c,#102a32 52%,#071217); box-shadow:inset 0 0 50px rgba(28,148,169,.08); }
        .visual-board-grid { position:absolute; inset:0; opacity:.28; background-image:linear-gradient(rgba(111,204,218,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(111,204,218,.14) 1px,transparent 1px); background-size:24px 24px; }
        .visual-board-label { position:absolute; left:16px; top:14px; color:#86dce9; font:700 9px/1 Arial,sans-serif; letter-spacing:1.8px; }
        .visual-object { position:absolute; left:50%; top:54%; width:330px; height:120px; transform:translate(-50%,-50%); filter:drop-shadow(0 0 14px rgba(66,193,211,.16)); }
        .visual-object-top { position:absolute; left:55px; top:28px; width:220px; height:40px; transform:skewX(-22deg); border:2px solid #7fd8e4; background:linear-gradient(180deg,rgba(83,157,170,.32),rgba(18,55,63,.75)); }
        .visual-object-core { position:absolute; left:96px; top:51px; width:138px; height:28px; border:1px solid #5caebc; background:rgba(20,91,103,.52); }
        .visual-object-leg { position:absolute; top:76px; width:8px; height:28px; border:1px solid #63b9c7; background:#183d46; }
        .visual-object-leg-left { left:105px; }
        .visual-object-leg-right { right:103px; }
        .visual-callout { position:absolute; padding:4px 6px; border:1px solid rgba(116,212,225,.38); color:#9ee6ee; background:rgba(5,20,25,.86); font:700 7px/1 Arial,sans-serif; letter-spacing:1px; }
        .visual-callout-purpose { left:0; top:34px; }
        .visual-callout-constraint { right:0; top:60px; }
        .visual-callout-unknown { right:32px; bottom:0; color:#e5bd7b; border-color:rgba(224,173,86,.42); }
        .visual-board-footer { position:absolute; left:16px; bottom:12px; color:#6f8992; font:700 8px/1 Arial,sans-serif; letter-spacing:1px; }

        .visual-concept-brief {
          margin: 0 0 18px;
          padding: 16px;
          border: 1px solid rgba(80, 191, 210, 0.32);
          border-radius: 12px;
          background: linear-gradient(145deg, rgba(13, 31, 38, 0.96), rgba(7, 18, 24, 0.96));
        }

        .visual-concept-brief-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(118, 151, 164, 0.24);
        }

        .visual-concept-brief-heading span,
        .visual-concept-brief-grid section > span {
          display: block;
          color: #7fc8d8;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .visual-concept-brief-heading strong {
          display: block;
          margin-top: 5px;
          color: #f3f7f8;
          font-size: 17px;
        }

        .visual-concept-brief-heading b {
          padding: 6px 8px;
          border: 1px solid #587584;
          border-radius: 6px;
          color: #c8e4ea;
          background: rgba(26, 55, 66, 0.42);
          font-size: 9px;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }

        .visual-concept-brief-intro {
          margin: 11px 0 12px;
          color: #9eb0b8;
          font-size: 11px;
          line-height: 1.5;
        }

        .visual-concept-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .visual-concept-brief-grid section {
          padding: 11px 12px;
          border: 1px solid rgba(106, 132, 144, 0.24);
          border-radius: 8px;
          background: rgba(220, 232, 235, 0.025);
        }

        .visual-concept-brief-grid p,
        .visual-concept-brief-grid ul {
          margin: 7px 0 0;
          color: #d0dade;
          font-size: 11px;
          line-height: 1.5;
        }

        .visual-concept-brief-grid ul {
          padding-left: 17px;
        }

        .visual-concept-brief-grid li + li {
          margin-top: 4px;
        }

        .visual-concept-brief-warning {
          border-color: rgba(224, 173, 86, 0.32) !important;
          background: rgba(94, 65, 22, 0.1) !important;
        }

        .visual-concept-brief-warning > span {
          color: #e5bd7b !important;
        }

        .visual-concept-brief-next {
          border-color: rgba(72, 182, 205, 0.32) !important;
          background: rgba(17, 75, 87, 0.1) !important;
        }

        .visual-concept-brief-footer {
          margin-top: 11px;
          color: #637c85;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .concept-generation-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 14px;
          padding: 12px 13px;
          border: 1px solid rgba(72, 182, 205, 0.34);
          background: rgba(17, 75, 87, 0.12);
        }

        .concept-generation-action > div {
          min-width: 0;
        }

        .concept-generation-action span {
          display: block;
          color: #7fc8d8;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .concept-generation-action strong {
          display: block;
          margin-top: 5px;
          color: #edf7f8;
          font-size: 12px;
        }

        .concept-generation-action small {
          display: block;
          margin-top: 5px;
          color: #8299a3;
          font-size: 10px;
          line-height: 1.4;
        }

        .concept-generation-action button {
          flex: 0 0 auto;
          border: 1px solid rgba(112, 221, 235, 0.72);
          background: linear-gradient(180deg, rgba(39, 116, 129, 0.96), rgba(18, 65, 76, 0.98));
          color: #e8fdff;
          padding: 10px 14px;
          font: 800 10px/1 Arial, sans-serif;
          letter-spacing: 1.1px;
          cursor: pointer;
        }

        .concept-generation-action button:hover {
          border-color: rgba(154, 236, 246, 0.96);
        }

        .generated-concept-board-real {
          position: relative;
          overflow: hidden;
          margin-top: 14px;
          border: 1px solid rgba(80, 191, 210, 0.34);
          background: #071217;
          box-shadow: inset 0 0 50px rgba(28, 148, 169, 0.08);
        }

        .generated-concept-image {
          display: block;
          width: 100%;
          height: auto;
          min-height: 260px;
          object-fit: cover;
        }

        .generated-concept-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 12px;
          border-top: 1px solid rgba(80, 191, 210, 0.24);
          color: #708891;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.09em;
        }

        .generated-concept-meta b {
          color: #8fd7e1;
          font-size: 8px;
        }

        .concept-refinement-panel { margin-top:14px; padding:14px; border:1px solid rgba(80,191,210,.32); border-radius:10px; background:linear-gradient(145deg,rgba(15,37,44,.96),rgba(7,18,23,.96)); }
        .concept-refinement-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding-bottom:10px; border-bottom:1px solid rgba(118,151,164,.22); }
        .concept-refinement-heading span, .concept-refinement-grid section > span { display:block; color:#7fc8d8; font-size:9px; font-weight:900; letter-spacing:.12em; }
        .concept-refinement-heading strong { display:block; margin-top:5px; color:#f3f7f8; font-size:15px; }
        .concept-refinement-heading b { padding:6px 8px; border:1px solid rgba(93,201,220,.45); border-radius:6px; color:#c8e4ea; font-size:9px; letter-spacing:.1em; white-space:nowrap; }
        .concept-refinement-directive { margin:11px 0; color:#d0dade; font-size:11px; line-height:1.5; }
        .concept-refinement-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
        .concept-refinement-grid section { padding:10px 11px; border:1px solid rgba(106,132,144,.24); border-radius:8px; background:rgba(220,232,235,.025); }
        .concept-refinement-grid p { margin:6px 0 0; color:#b9c9cf; font-size:10px; line-height:1.5; }
        .concept-refinement-button { margin-top:12px; border:1px solid rgba(93,201,220,.58); background:linear-gradient(180deg,rgba(31,92,105,.92),rgba(15,49,58,.94)); color:#dffbff; padding:9px 13px; font:700 10px/1 Arial,sans-serif; letter-spacing:1.1px; cursor:pointer; }
        .concept-two-board { border-color:rgba(116,201,145,.34); }

        .concept-decision-panel { margin-top: 18px; padding: 20px; border: 1px solid rgba(194,163,94,0.42); border-radius: 12px; background: rgba(10,14,16,0.78); }
        .concept-decision-heading { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
        .concept-decision-heading span, .concept-decision-note > span { display: block; font-size: 10px; letter-spacing: 0.18em; color: #c2a35e; }
        .concept-decision-heading strong { display: block; margin-top: 5px; font-size: 16px; color: #eef2f1; }
        .concept-decision-heading b { font-size: 10px; letter-spacing: 0.14em; color: #c2a35e; white-space: nowrap; }
        .concept-decision-intro { margin: 14px 0; color: #aeb8b8; font-size: 13px; line-height: 1.55; }
        .concept-decision-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .concept-decision-actions button { border: 1px solid rgba(194,163,94,0.35); background: rgba(255,255,255,0.025); color: #d7dddd; padding: 11px 10px; border-radius: 7px; font-size: 10px; letter-spacing: 0.08em; cursor: pointer; }
        .concept-decision-actions button:hover, .concept-decision-actions button.is-selected { border-color: #c2a35e; background: rgba(194,163,94,0.12); color: #fff3ca; }
        .concept-decision-note { display: block; margin-top: 14px; }
        .concept-decision-note textarea { width: 100%; margin-top: 7px; resize: vertical; box-sizing: border-box; min-height: 78px; border: 1px solid rgba(194,163,94,0.22); background: rgba(0,0,0,0.24); color: #eef2f1; border-radius: 7px; padding: 10px; font: inherit; }
        .concept-decision-note textarea:focus { outline: none; border-color: #c2a35e; }
        .concept-decision-status { margin-top: 12px; padding: 10px 12px; border-left: 3px solid #667276; background: rgba(255,255,255,0.025); color: #bdc6c6; font-size: 12px; }
        .decision-accept { border-left-color: #72c98c; color: #b9e4c6; }
        .decision-refine { border-left-color: #e0b36a; color: #e8c98f; }
        .decision-rethink { border-left-color: #d98282; color: #efb0b0; }
        .concept-decision-handoff { margin-top: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; }
        .concept-decision-handoff span { font-size: 10px; letter-spacing: 0.15em; color: #c2a35e; }
        .concept-decision-handoff p { margin: 6px 0 0; color: #b6c0c0; font-size: 12px; line-height: 1.5; }
        @media (max-width: 760px) { .concept-decision-actions { grid-template-columns: 1fr; } }
        .concept-review-panel {
          margin-top: 14px;
          padding: 15px;
          border: 1px solid rgba(80,191,210,.28);
          border-radius: 12px;
          background: rgba(7,18,24,.72);
        }

        .concept-review-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 11px;
          border-bottom: 1px solid rgba(118,151,164,.2);
        }

        .concept-review-heading span,
        .concept-review-note > span {
          display: block;
          color: #7fc8d8;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .concept-review-heading strong {
          display: block;
          margin-top: 5px;
          color: #f3f7f8;
          font-size: 15px;
        }

        .concept-review-heading b {
          padding: 6px 8px;
          border: 1px solid #587584;
          border-radius: 6px;
          color: #c8e4ea;
          font-size: 9px;
          letter-spacing: .1em;
          white-space: nowrap;
        }

        .concept-review-intro {
          margin: 10px 0 12px;
          color: #9eb0b8;
          font-size: 11px;
          line-height: 1.5;
        }

        .concept-review-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .concept-review-actions button {
          border: 1px solid #536c77;
          background: rgba(25,43,51,.76);
          color: #d7e6ea;
          padding: 9px 11px;
          font: 800 9px/1 Arial,sans-serif;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .concept-review-actions button:hover,
        .concept-review-actions button.is-selected {
          border-color: #71d1df;
          background: rgba(28,83,95,.9);
          color: #f0fdff;
        }

        .concept-review-note {
          display: block;
          margin-top: 12px;
        }

        .concept-review-note textarea {
          width: 100%;
          box-sizing: border-box;
          margin-top: 7px;
          resize: vertical;
          border: 1px solid #3e5661;
          border-radius: 7px;
          background: #081217;
          color: #d6e1e5;
          padding: 9px 10px;
          font: 11px/1.45 Arial,sans-serif;
          outline: none;
        }

        .concept-review-note textarea:focus {
          border-color: #66c7d6;
        }

        .concept-review-status {
          margin-top: 10px;
          padding: 8px 10px;
          border-left: 2px solid #587584;
          color: #9fb3bb;
          background: rgba(255,255,255,.025);
          font-size: 10px;
          line-height: 1.4;
        }

        .review-accepted { border-left-color: #72c98c; color: #b9e4c6; }
        .review-refine { border-left-color: #e0b36a; color: #e8c98f; }
        .review-rethink { border-left-color: #d98282; color: #efb0b0; }

        .generated-concept-board {
          position: relative;
          min-height: 340px;
          margin-top: 14px;
          overflow: hidden;
          border: 1px solid rgba(80, 191, 210, 0.42);
          background: linear-gradient(135deg, #08161b, #12323a 52%, #071217);
          box-shadow: inset 0 0 70px rgba(28, 148, 169, 0.09);
        }

        .generated-concept-grid {
          position: absolute;
          inset: 0;
          opacity: 0.22;
          background-image: linear-gradient(rgba(111, 204, 218, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(111, 204, 218, 0.15) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .generated-concept-title {
          position: absolute;
          left: 16px;
          top: 14px;
          color: #8be3ed;
          font: 800 9px/1 Arial, sans-serif;
          letter-spacing: 1.6px;
        }

        .generated-concept-object {
          position: absolute;
          left: 50%;
          top: 53%;
          width: 430px;
          height: 190px;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 18px rgba(66, 193, 211, 0.16));
        }

        .generated-concept-top {
          position: absolute;
          left: 42px;
          top: 45px;
          width: 346px;
          height: 56px;
          transform: skewX(-18deg);
          border: 2px solid #8ee4ed;
          background: linear-gradient(180deg, rgba(92, 178, 190, 0.38), rgba(18, 55, 63, 0.9));
          box-shadow: inset 0 -8px 20px rgba(0, 0, 0, 0.18);
        }

        .generated-concept-body {
          position: absolute;
          left: 84px;
          top: 91px;
          width: 264px;
          height: 45px;
          border: 1px solid #62b8c6;
          background: linear-gradient(180deg, rgba(25, 100, 112, 0.65), rgba(10, 41, 49, 0.9));
        }

        .generated-concept-core {
          position: absolute;
          left: 135px;
          top: 102px;
          width: 164px;
          height: 23px;
          border: 1px solid rgba(143, 230, 239, 0.72);
          background: rgba(33, 125, 139, 0.34);
        }

        .generated-concept-wheel {
          position: absolute;
          top: 129px;
          width: 38px;
          height: 38px;
          border: 3px solid #77ced9;
          border-radius: 50%;
          background: #0b2026;
          box-shadow: inset 0 0 0 8px #152f36;
        }

        .generated-concept-wheel-left { left: 99px; }
        .generated-concept-wheel-right { right: 101px; }

        .generated-callout {
          position: absolute;
          padding: 5px 7px;
          border: 1px solid rgba(116, 212, 225, 0.42);
          color: #a4e9f0;
          background: rgba(5, 20, 25, 0.88);
          font: 800 7px/1 Arial, sans-serif;
          letter-spacing: 0.9px;
        }

        .generated-callout-purpose { left: 0; top: 31px; }
        .generated-callout-principle { right: 0; top: 76px; }
        .generated-callout-constraint { right: 30px; bottom: 4px; color: #e5bd7b; border-color: rgba(224, 173, 86, 0.42); }

        .generated-concept-caption {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 38px;
          color: #b9d4da;
          font-size: 11px;
          line-height: 1.45;
        }

        .generated-concept-footer {
          position: absolute;
          left: 16px;
          bottom: 14px;
          color: #637c85;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        @media (max-width: 700px) {
          .visual-concept-brief-grid {
            grid-template-columns: 1fr;
          }

          .visual-concept-brief-heading {
            flex-direction: column;
          }

          .concept-generation-action {
            flex-direction: column;
            align-items: stretch;
          }

          .concept-generation-action button {
            width: 100%;
          }

          .generated-concept-object {
            transform: translate(-50%, -50%) scale(0.78);
          }
        }

        .concept-readout > span {
          display: block;
          margin-bottom: 4px;
          color: #35d9f5;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.09em;
        }

        .engineering-action strong {
          color: #eef2f6;
          font-size: 13px;
        }

        .engineering-action small {
          display: block;
          margin-top: 5px;
          color: #9caabd;
        }

        .engineering-action button {
          flex: 0 0 auto;
          padding: 12px 18px;
          border: 1px solid #d7a852;
          border-radius: 7px;
          background: linear-gradient(#bb7a23, #7b4d17);
          color: #fff5df;
          box-shadow: 0 6px 16px rgba(0,0,0,0.24), inset 0 1px rgba(255,255,255,0.16);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          cursor: pointer;
        }

        .engineering-action button:disabled {
          border-color: #58616a;
          background: #303941;
          color: #7f8a94;
          cursor: not-allowed;
          box-shadow: none;
        }

        .concept-readout {
          grid-column: 1 / -1;
          margin-top: 3px;
          padding: 18px;
          border: 1px solid #526c79;
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(16, 31, 39, 0.96), rgba(9, 21, 29, 0.96));
          box-shadow: inset 0 1px rgba(255,255,255,0.035);
        }

        .concept-sheet-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(118, 151, 164, 0.28);
        }

        .concept-sheet-heading > div > span, .concept-sheet-card > span {
          display: block;
          color: #7fc8d8;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .concept-sheet-heading strong {
          display: block;
          margin-top: 5px;
          color: #f3f7f8;
          font-size: 18px;
        }

        .concept-sheet-heading b {
          padding: 7px 9px;
          border: 1px solid #587584;
          border-radius: 7px;
          color: #c8e4ea;
          background: rgba(26, 55, 66, 0.42);
          font-size: 10px;
          letter-spacing: 0.12em;
          white-space: nowrap;
        }

        .concept-persistence-note {
          margin: 8px 0 14px;
          color: #93a4b6;
          font-size: 12px;
          line-height: 1.45;
        }

        .concept-sheet-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .concept-sheet-card {
          min-height: 108px;
          padding: 13px 14px;
          border: 1px solid rgba(106, 132, 144, 0.28);
          border-radius: 10px;
          background: rgba(220, 232, 235, 0.035);
        }

        .concept-sheet-wide { grid-column: 1 / -1; min-height: auto; }

        .concept-sheet-card p {
          margin: 8px 0 0;
          color: #d3dce0;
          font-size: 13px;
          line-height: 1.52;
        }

        .concept-sheet-card ul {
          margin: 8px 0 0;
          padding-left: 18px;
          color: #d0dade;
          font-size: 12px;
          line-height: 1.5;
        }

        .concept-sheet-card li + li { margin-top: 5px; }
        .concept-sheet-alert { border-color: rgba(224, 173, 86, 0.36); background: rgba(94, 65, 22, 0.12); }
        .concept-sheet-alert > span { color: #e5bd7b; }
        .concept-sheet-next { border-color: rgba(72, 182, 205, 0.34); background: rgba(17, 75, 87, 0.12); }
        .concept-sheet-next small { display: block; margin-top: 9px; color: #8299a3; font-size: 10px; }

        @media (max-width: 980px) {
          .living-workshop { width: calc(100vw - 18px); padding: 16px; }
          .workshop-heading { grid-template-columns: 1fr; gap: 10px; }
          .bench-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .room { min-height: 760px; }
          .wall-life {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: -1;
        }

        .shelf {
          position: absolute;
          top: 184px;
          width: 150px;
          height: 8px;
          border: 1px solid #707778;
          background: #343b3d;
          box-shadow: 0 6px 8px rgba(0,0,0,0.22);
        }

        .shelf-left { left: 4%; }
        .shelf-right { right: 4%; }

        .shelf i {
          position: absolute;
          bottom: 7px;
          width: 24px;
          border: 1px solid #6e7575;
          background: #434b4d;
        }

        .shelf i:nth-child(1) { left: 8px; height: 31px; }
        .shelf i:nth-child(2) { left: 42px; height: 23px; background: #68604f; }
        .shelf i:nth-child(3) { right: 13px; height: 37px; }

        .tall-cabinet {
          position: absolute;
          top: 336px;
          width: 68px;
          height: 146px;
          border: 1px solid #646c6e;
          background: linear-gradient(90deg, #343b3e, #252c2f);
          box-shadow: 8px 12px 16px rgba(0,0,0,0.22);
        }

        .cabinet-left { left: 1.2%; }
        .cabinet-right { right: 1.2%; }

        .tall-cabinet i {
          display: block;
          height: 31%;
          border-bottom: 1px solid #555e61;
          position: relative;
        }

        .tall-cabinet i::after {
          content: "";
          position: absolute;
          top: 8px;
          left: 50%;
          width: 15px;
          height: 2px;
          transform: translateX(-50%);
          background: #727979;
        }

        .wall-sheet {
          position: absolute;
          top: 158px;
          width: 78px;
          height: 66px;
          border: 1px solid rgba(221,216,199,0.45);
          background: rgba(214,208,190,0.19);
          transform: rotate(-2deg);
        }

        .sheet-left { left: 19%; }
        .sheet-right { right: 19%; transform: rotate(2deg); }

        .wall-sheet i {
          display: block;
          width: 65%;
          height: 2px;
          margin: 10px auto 0;
          background: rgba(216,219,213,0.35);
        }

        .room-bench { width: 26%; min-width: 0; }
          .slot-discovery { left: 4%; top: 230px; }
          .slot-engineering { left: 37%; top: 230px; }
          .slot-validation { left: 70%; top: 230px; }
          .slot-patent { left: 4%; top: 412px; right: auto; }
          .slot-marketing { left: 37%; top: 412px; right: auto; }
          .slot-manufacturing { left: 70%; top: 412px; right: auto; }
          .slot-reality { right: 4%; top: 594px; width: 26%; }
          .slot-prototype { left: 37%; top: 594px; width: 26%; }
          .rev-station { left: 4%; top: 575px; }
          .rev-bubble { display: none; }
          .workshop-plaque { top: 142px; }
          .bench-readout { grid-template-columns: 1fr; }
          .engineering-action { align-items: stretch; flex-direction: column; }
          .engineering-action button { width: 100%; }
          .next-move { min-width: 0; padding: 12px 0 0; border-left: 0; border-top: 1px solid #34465a; }
        }

        @media (max-width: 620px) {
          .concept-sheet-grid { grid-template-columns: 1fr; }
          .concept-sheet-wide { grid-column: auto; }
          .concept-sheet-heading { flex-direction: column; }
          .room { min-height: 1040px; }
          .wall-life {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: -1;
        }

        .shelf {
          position: absolute;
          top: 184px;
          width: 150px;
          height: 8px;
          border: 1px solid #707778;
          background: #343b3d;
          box-shadow: 0 6px 8px rgba(0,0,0,0.22);
        }

        .shelf-left { left: 4%; }
        .shelf-right { right: 4%; }

        .shelf i {
          position: absolute;
          bottom: 7px;
          width: 24px;
          border: 1px solid #6e7575;
          background: #434b4d;
        }

        .shelf i:nth-child(1) { left: 8px; height: 31px; }
        .shelf i:nth-child(2) { left: 42px; height: 23px; background: #68604f; }
        .shelf i:nth-child(3) { right: 13px; height: 37px; }

        .tall-cabinet {
          position: absolute;
          top: 336px;
          width: 68px;
          height: 146px;
          border: 1px solid #646c6e;
          background: linear-gradient(90deg, #343b3e, #252c2f);
          box-shadow: 8px 12px 16px rgba(0,0,0,0.22);
        }

        .cabinet-left { left: 1.2%; }
        .cabinet-right { right: 1.2%; }

        .tall-cabinet i {
          display: block;
          height: 31%;
          border-bottom: 1px solid #555e61;
          position: relative;
        }

        .tall-cabinet i::after {
          content: "";
          position: absolute;
          top: 8px;
          left: 50%;
          width: 15px;
          height: 2px;
          transform: translateX(-50%);
          background: #727979;
        }

        .wall-sheet {
          position: absolute;
          top: 158px;
          width: 78px;
          height: 66px;
          border: 1px solid rgba(221,216,199,0.45);
          background: rgba(214,208,190,0.19);
          transform: rotate(-2deg);
        }

        .sheet-left { left: 19%; }
        .sheet-right { right: 19%; transform: rotate(2deg); }

        .wall-sheet i {
          display: block;
          width: 65%;
          height: 2px;
          margin: 10px auto 0;
          background: rgba(216,219,213,0.35);
        }

        .room-bench { width: 42%; }
          .slot-discovery { left: 5%; top: 225px; }
          .slot-engineering { left: 53%; top: 225px; }
          .slot-validation { left: 5%; top: 420px; }
          .slot-patent { left: 53%; top: 420px; }
          .slot-marketing { left: 5%; top: 615px; }
          .slot-manufacturing { left: 53%; top: 615px; }
          .slot-reality { left: 5%; right: auto; top: 810px; width: 42%; }
          .slot-prototype { left: 53%; top: 810px; width: 42%; }
          .rev-station { display: none; }
          .room-caption { max-width: 85%; }
        }
        @media (max-width: 700px) {
          .project-core-heading { flex-direction: column; }
          .project-signals span:last-child { flex-basis: auto; }
          .bench-overview { grid-template-columns: 1fr; }
          .workshop-flow { justify-content: flex-start; }
          .concept-refinement-grid { grid-template-columns:1fr; }
          .concept-refinement-heading { flex-direction:column; }
        }
      `}</style>
    </section>
  );
}