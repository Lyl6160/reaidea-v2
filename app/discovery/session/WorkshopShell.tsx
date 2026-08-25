"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import ProjectReviewView from "./ProjectReviewView";
import ConceptPreview from "../../workshop/ConceptPreview";
import StandardBenchShell from "../../workshop/StandardBenchShell";
import RollingBenchFlow, { readRollingBenchNotes, type BenchNote } from "../../workshop/RollingBenchFlow";
import GenerationProgress from "../../workshop/GenerationProgress";
import WorkshopRoom from "../../workshop/WorkshopRoom";
import { resolveWorkshopStagePresentation } from "../../workshop/workshopStagePresentation";

import {
  isSpecialistContributionBenchId,
  type Project,
  type SpecialistContributionBenchId,
} from "../../lib/core/project";
import {
  loadProjectSourceImage,
  isValidSafetyReceipt,
  parseSourceImageReference,
  sourceImageToDataUrl,
  type ProjectSourceImageRecord,
} from "../../lib/core/projectSourceEvidenceStorage";
import { recordConceptDecision } from "../../lib/workshop/conceptDecisions";
import { deriveSharedConceptPreview } from "../../lib/workshop/conceptPreview";
import {
  MAX_RETAINED_CONCEPT_CANDIDATES,
  persistConceptCandidateHistory,
  persistCurrentConceptCandidate,
  restoreConceptCandidateHistory,
} from "../../lib/workshop/conceptCandidateStorage";
import {
  assessDiscovery,
  recordDiscoveryAnswer,
} from "../../lib/workshop/discoveryReasoning";
import {
  assessEngineeringDefinition,
  getEngineeringDefinitionInputs,
  recordEngineeringDefinitionAnswer,
} from "../../lib/workshop/engineeringDefinition";
import type {
  ConceptCandidate,
  ConceptGenerationApiResponse,
  ConceptGenerationRequest,
  ConceptRefinementApiResponse,
  ConceptRefinementRequest,
  ConceptViewAssetApiResponse,
  ConceptViewAssetRequest,
  ConceptViewId,
  IdeaVisualMode,
} from "../../lib/ai/types";
import { bindConceptGeometry } from "../../lib/geometry/buildConceptGeometry";
import { interpretRefinementIntent, type RefinementIntent } from "../../lib/ai/viewRequest";
import {
  IDEA_VISUAL_MODES,
  buildConceptGenerationFoundation,
  createConceptWorkflowIdentity,
  suggestVisualMode,
  visualModeLabel,
} from "../../lib/workshop/conceptGeneration";
import {
  getSpecialistContributions,
  recordSpecialistContribution,
} from "../../lib/workshop/specialistContributions";
import { recordProjectEvidenceFromSpecialistContribution } from "../../lib/workshop/specialistContributionEvidence";
import { createSpecialistBenchGuidance } from "../../lib/workshop/specialistBenchGuidance";
import {
  createSpecialistProjectContext,
  type LimitedSpecialistContextItems,
} from "../../lib/workshop/specialistProjectContext";
import type {
  WorkshopBenchId,
  WorkshopState,
} from "../../lib/workshop/workshopBrain";
import { assessWorkshop, CANONICAL_WORKSHOP_BENCHES } from "../../lib/workshop/workshopBrain";
import { assessHomeUnderstanding, deriveRevWorkingUnderstanding } from "../../lib/workshop/revWorkingUnderstanding";

type WorkshopShellProps = {
  project: Project;
  workshop: WorkshopState;
  onProjectChange: (project: Project) => boolean;
};

type ConceptReview = "unreviewed" | "accepted" | "refine" | "rethink";
type ConceptDecision = "undecided" | "accept" | "refine" | "rethink";
type ValidationEvidenceOutcome = "pending" | "supported" | "not-supported" | "inconclusive";
type ConceptCandidateStorageStatus =
  | "loading"
  | "no-candidate-saved"
  | "candidate-restored"
  | "candidate-saving"
  | "candidate-saved"
  | "candidate-could-not-be-saved"
  | "restore-failed";
type SpecialistEvidenceInput = {
  eventId: string;
  summary: string;
  source: string;
};
type SourceEvidenceView = {
  reference: string;
  status: "available" | "unavailable";
  record?: ProjectSourceImageRecord;
  objectUrl?: string;
};

const MIN_ACTION_FEEDBACK_MS = 450;

async function holdActionFeedback(startedAt: number): Promise<void> {
  const remaining = MIN_ACTION_FEEDBACK_MS - (performance.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
}

const DISCOVERY_REVIEW_AREAS = [
  { id: "purpose", label: "What's the main problem?" },
  { id: "people", label: "Who is having this problem?" },
  { id: "conditions", label: "When or where does it happen?" },
  { id: "consequence", label: "What happens when it goes wrong?" },
  { id: "evidence", label: "What have you seen or measured?" },
  { id: "constraints", label: "What could affect a solution?" },
] as const;

function getBench(workshop: WorkshopState, id: WorkshopBenchId) {
  return workshop.benches.find((bench) => bench.id === id);
}

function specialistContextLimitNote(
  collection: LimitedSpecialistContextItems<unknown>
) {
  if (!collection.truncated) return null;

  return `Showing ${collection.items.length} of ${collection.total} recorded items.`;
}

function sameStringSet(left: string[], right: string[]): boolean {
  const leftValues = new Set(left);
  const rightValues = new Set(right);
  if (leftValues.size !== rightValues.size) return false;
  return Array.from(leftValues).every((value) => rightValues.has(value));
}

async function attachSourceImageReference(
  project: Project,
  request: ConceptGenerationRequest
): Promise<ConceptGenerationRequest> {
  for (const reference of project.files) {
    const evidenceId = parseSourceImageReference(reference);
    if (!evidenceId) continue;
    const sourceEvent = project.timeline.find(
      (event) => event.type === "knowledge-input-recorded" && event.subject === reference
    );
    if (!sourceEvent) continue;
    try {
      const record = await loadProjectSourceImage(project.id, evidenceId);
      if (!record || !isValidSafetyReceipt(record.safetyReceipt)) continue;
      return {
        ...request,
        referenceImage: {
          evidenceReference: reference,
          sourceEventId: sourceEvent.id,
          mediaType: record.mediaType,
          dataUrl: await sourceImageToDataUrl(record),
        },
      };
    } catch {
      // Missing, corrupt, or unavailable evidence remains history but is not transmitted.
    }
  }
  return request;
}

function hasValidConceptImageSet(candidate: ConceptCandidate): boolean {
  if (candidate.output.type !== "image" || !candidate.output.dataUrl?.startsWith("data:image/")) return false;
  const output = candidate.output;
  const views = output.views;
  return Boolean(
    views?.length && views.length <= 3 &&
    views.every((view) => view.dataUrl.startsWith("data:image/")) &&
    new Set(views.map((view) => view.id)).size === views.length &&
    views.some((view) => view.id === output.primaryView && view.dataUrl === output.dataUrl)
  );
}


function conceptKey(project: Project) {
  return `reaidea.workshop.concept.v2.${project.id}`;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" role="img" aria-label="Early working model">
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
    <text x="28" y="34" fill="#86dce9" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">REV · EARLY WORKING MODEL</text>
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

function formatReadiness(readiness: Project["readiness"]): string {
  return readiness.replace("-", " ");
}

export default function WorkshopShell({
  project,
  workshop: initialWorkshop,
  onProjectChange,
}: WorkshopShellProps) {
  const showLegacyBenchPanels: boolean = false;
  const projectName = project.projectName;
  const workspaceRef = useRef<HTMLDivElement>(null);
  const conceptGenerationInFlightRef = useRef(false);
  const pendingConceptGenerationRequestRef = useRef<ConceptGenerationRequest | null>(null);
  const conceptRefinementInFlightRef = useRef(false);
  const lastCanonicalRollingSaveRef = useRef("");
  const [patentBenchFocused, setPatentBenchFocused] = useState(false);
  const [prototypeBenchFocused, setPrototypeBenchFocused] = useState(false);
  const [selectedId, setSelectedId] = useState<WorkshopBenchId | null>(null);
  const [workingUnderstandingRevision, setWorkingUnderstandingRevision] = useState(0);
  const [discoveryReviewOpen, setDiscoveryReviewOpen] = useState(false);
  const [knowledgeAnswerDraft, setKnowledgeAnswerDraft] = useState("");
  const [knowledgeAnswerError, setKnowledgeAnswerError] = useState("");
  const [engineeringAnswerDraft, setEngineeringAnswerDraft] = useState("");
  const [engineeringAnswerError, setEngineeringAnswerError] = useState("");
  const [visualModeOverride, setVisualModeOverride] = useState<IdeaVisualMode | null>(null);
  const [confirmedVisualMode, setConfirmedVisualMode] = useState<IdeaVisualMode | null>(null);
  const [visualModeCorrectionOpen, setVisualModeCorrectionOpen] = useState(false);
  const [generatedConceptCandidate, setGeneratedConceptCandidate] = useState<ConceptCandidate | null>(null);
  const [candidateStorageStatus, setCandidateStorageStatus] = useState<ConceptCandidateStorageStatus>("loading");
  const [conceptCandidateHistory, setConceptCandidateHistory] = useState<ConceptCandidate[]>([]);
  const [conceptGenerationState, setConceptGenerationState] = useState<"idle" | "generating" | "ready" | "failed" | "not-configured" | "unsupported">("idle");
  const [conceptGenerationMessage, setConceptGenerationMessage] = useState("");
  const [sourceEvidenceViews, setSourceEvidenceViews] = useState<SourceEvidenceView[]>([]);
  const [sourceEvidenceLoading, setSourceEvidenceLoading] = useState(true);
  const [conceptRefinementOpen, setConceptRefinementOpen] = useState(false);
  const [conceptRefinementDraft, setConceptRefinementDraft] = useState("");
  const [conceptRefinementState, setConceptRefinementState] = useState<"idle" | "refining" | "ready" | "failed">("idle");
  const [conceptRefinementMessage, setConceptRefinementMessage] = useState("");
  const [conceptViewState, setConceptViewState] = useState<"idle" | "generating" | "ready" | "failed">("idle");
  const [conceptViewMessage, setConceptViewMessage] = useState("");
  const [viewedConceptRevision, setViewedConceptRevision] = useState<number | null>(null);
  const [prototypeConceptView, setPrototypeConceptView] = useState<ConceptViewId>("iso");
  const [prototypeRepresentation, setPrototypeRepresentation] = useState<"2d" | "3d">("3d");
  const [specialistContributionDrafts, setSpecialistContributionDrafts] = useState<
    Partial<Record<SpecialistContributionBenchId, string>>
  >({});
  const [specialistContributionError, setSpecialistContributionError] = useState("");
  const [benchPresentationProgress, setBenchPresentationProgress] = useState<
    Partial<Record<WorkshopBenchId, "red" | "yellow" | "green">>
  >({});
  const [specialistEvidenceInputs, setSpecialistEvidenceInputs] = useState<
    Partial<Record<SpecialistContributionBenchId, SpecialistEvidenceInput>>
  >({});
  const [specialistEvidenceError, setSpecialistEvidenceError] = useState("");
  const conceptStorageKey = useMemo(() => conceptKey(project), [project]);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const references = project.files.filter((value) => parseSourceImageReference(value));
    void Promise.all(references.map(async (reference): Promise<SourceEvidenceView> => {
      const evidenceId = parseSourceImageReference(reference);
      if (!evidenceId) return { reference, status: "unavailable" };
      try {
        const record = await loadProjectSourceImage(project.id, evidenceId);
        if (!record) return { reference, status: "unavailable" };
        const objectUrl = URL.createObjectURL(record.blob);
        objectUrls.push(objectUrl);
        return { reference, status: "available", record, objectUrl };
      } catch {
        return { reference, status: "unavailable" };
      }
    })).then((views) => {
      if (active) {
        setSourceEvidenceViews(views);
        setSourceEvidenceLoading(false);
      }
      else objectUrls.forEach((url) => URL.revokeObjectURL(url));
    });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [project.id, project.files]);

  const restoredVisualInterpretations = useMemo(
    () => sourceEvidenceViews.flatMap((evidence) => evidence.record?.interpretation
      ? [evidence.record.interpretation]
      : []),
    [sourceEvidenceViews]
  );
  const primaryVisualInterpretation = restoredVisualInterpretations[0];
  const effectiveHomeAssessment = useMemo(
    () => assessHomeUnderstanding(project.originalObservation, primaryVisualInterpretation),
    [primaryVisualInterpretation, project.originalObservation]
  );
  const workshop = useMemo(
    () => sourceEvidenceLoading
      ? initialWorkshop
      : assessWorkshop(project, primaryVisualInterpretation),
    [initialWorkshop, primaryVisualInterpretation, project, sourceEvidenceLoading]
  );

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
  const [conceptFamilyId, setConceptFamilyId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { conceptFamilyId?: string };
      return parsed.conceptFamilyId ?? "";
    } catch {
      return "";
    }
  });
  const [engineeringPreviewRevision, setEngineeringPreviewRevision] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return 1;
      const parsed = JSON.parse(saved) as { engineeringPreviewRevision?: number };
      return Math.max(1, parsed.engineeringPreviewRevision ?? 1);
    } catch {
      return 1;
    }
  });
  const [, setEngineeringPreviewLatestChange] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { engineeringPreviewLatestChange?: string };
      return parsed.engineeringPreviewLatestChange ?? "";
    } catch {
      return "";
    }
  });
  const [conceptWorkflowIdentity, setConceptWorkflowIdentity] = useState(() =>
    createConceptWorkflowIdentity(conceptFamilyId || undefined)
  );
  useEffect(() => {
    let active = true;
    restoreConceptCandidateHistory(project.id)
      .then((history) => {
        if (!active) return;
        const boundHistory = history.map(bindConceptGeometry);
        const candidate = boundHistory.at(-1) ?? null;
        setCandidateStorageStatus(candidate ? "candidate-restored" : "no-candidate-saved");
        setConceptCandidateHistory(boundHistory);
        setGeneratedConceptCandidate(candidate);
        if (boundHistory.some((item, index) => item !== history[index])) void persistConceptCandidateHistory(project.id, boundHistory);
        if (candidate) {
          setVisualModeOverride(candidate.visualMode);
          setConfirmedVisualMode(candidate.visualMode);
          setConceptFamilyId(candidate.conceptFamilyId);
          setConceptWorkflowIdentity(createConceptWorkflowIdentity(candidate.conceptFamilyId));
        }
      })
      .catch(() => {
        if (active) setCandidateStorageStatus("restore-failed");
        // Workshop continuity remains optional if the browser cache is unavailable.
      });
    return () => {
      active = false;
    };
  }, [project.id]);
  const [conceptReviewDecisionId, setConceptReviewDecisionId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { conceptReviewDecisionId?: string };
      return parsed.conceptReviewDecisionId ?? "";
    } catch {
      return "";
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
  const [conceptReviewDraftNote, setConceptReviewDraftNote] = useState("");
  const [selectedSupportingEvidenceIds, setSelectedSupportingEvidenceIds] = useState<string[]>([]);

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
  const [conceptDirectionDecisionId, setConceptDirectionDecisionId] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = window.localStorage.getItem(conceptKey(project));
      if (!saved) return "";
      const parsed = JSON.parse(saved) as { conceptDirectionDecisionId?: string };
      return parsed.conceptDirectionDecisionId ?? "";
    } catch {
      return "";
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
  const [conceptDecisionDraftNote, setConceptDecisionDraftNote] = useState("");
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
  const engineeringDefinitionAssessment = useMemo(
    () => assessEngineeringDefinition(project),
    [project]
  );
  const visualModeSuggestion = useMemo(
    () => suggestVisualMode(project, [], primaryVisualInterpretation),
    [primaryVisualInterpretation, project]
  );
  const selectedVisualMode = visualModeOverride ?? visualModeSuggestion.mode;
  const conceptGenerationFoundation = useMemo(
    () => buildConceptGenerationFoundation(
      project,
      confirmedVisualMode,
      conceptWorkflowIdentity,
      [],
      [],
      restoredVisualInterpretations
    ),
    [project, confirmedVisualMode, conceptWorkflowIdentity, restoredVisualInterpretations]
  );
  const generatedConceptCandidateIsStale = useMemo(() => {
    if (!generatedConceptCandidate) return false;
    const currentRequest = conceptGenerationFoundation.request;
    const activeSourceReference = sourceEvidenceViews.find((evidence) => evidence.status === "available")?.reference;
    const activeSourceReferenceEventId = activeSourceReference
      ? project.timeline.find(
          (event) => event.type === "knowledge-input-recorded" && event.subject === activeSourceReference
        )?.id
      : undefined;
    return !currentRequest ||
      generatedConceptCandidate.visualMode !== currentRequest.visualMode ||
      !sameStringSet(
        generatedConceptCandidate.sourceEventIds,
        [
          ...currentRequest.sourceEventIds,
          ...(activeSourceReferenceEventId ? [activeSourceReferenceEventId] : []),
        ]
      );
  }, [conceptGenerationFoundation.request, generatedConceptCandidate, project, sourceEvidenceViews]);
  const hasEngineeringDesignBrief = engineeringDefinitionAssessment.addressedAreas.length > 0;
  const previousConceptCandidate = conceptCandidateHistory.at(-2) ?? null;
  const viewedConceptCandidate = viewedConceptRevision === null
    ? generatedConceptCandidate
    : conceptCandidateHistory.find((candidate) => candidate.revision === viewedConceptRevision) ?? generatedConceptCandidate;
  const viewedConceptAvailableViews: ConceptViewId[] = viewedConceptCandidate?.output.type === "image" && viewedConceptCandidate.output.views?.length
    ? viewedConceptCandidate.output.views.map((view) => view.id)
    : ["iso"];
  const selectedPrototypeConceptView = viewedConceptAvailableViews.includes(prototypeConceptView)
    ? prototypeConceptView
    : viewedConceptAvailableViews[0];

  const conceptSheet = useMemo(() => {
    const engineering = project.engineeringState;
    const definition = engineeringDefinitionAssessment;
    const definitionAnswers = definition.latestAnswers;
    const hasEngineeringDefinition = definition.addressedAreas.length > 0;
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
        definitionAnswers["operating-concept"]?.trim() ||
        definitionAnswers["proposed-solution"]?.trim() ||
        engineering.currentUnderstanding.trim() ||
        project.originalObservation,
      hasEngineeringDefinition,
      proposedSolution: definitionAnswers["proposed-solution"]?.trim() || "",
      howItWorks: definitionAnswers["operating-concept"]?.trim() || "",
      mainElements: definitionAnswers["functional-elements"]?.trim() || "",
      inputsOutputs: definitionAnswers["inputs-outputs"]?.trim() || "",
      relationshipsFlow: definitionAnswers["relationships-flow"]?.trim() || "",
      userInteraction: definitionAnswers["user-interaction"]?.trim() || "",
      arrangement: definitionAnswers.arrangement?.trim() || "",
      constraintSafetyResponse:
        definitionAnswers["constraint-safety-response"]?.trim() || "",
      technicalUncertainty:
        definitionAnswers["technical-uncertainty"]?.trim() || "",
      definitionSummary: definition.solutionDefinitionSummary,
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
        definition.status === "ready-for-summary"
          ? "Use this inventor-defined solution brief to create and inspect the first concept. Validation and formal Engineering Review remain separate."
          : hasEngineeringDefinition && definition.nextQuestion
            ? `Continue Engineering Definition with ${definition.nextQuestion.label}: ${definition.nextQuestion.prompt}`
            : engineering.nextEngineeringStep || engineeringBench?.nextMove || workshop.summary,
      evidenceCount: project.evidence.length,
    };
  }, [project, engineeringBench, engineeringDefinitionAssessment, workshop.summary]);

  const visualConceptBrief = useMemo(() => {
    return {
      title: `CONCEPT 01 · ${projectName}`,
      hasEngineeringDefinition: conceptSheet.hasEngineeringDefinition,
      purpose: conceptSheet.purpose,
      principle: conceptSheet.operatingPrinciple,
      proposedSolution: conceptSheet.proposedSolution,
      howItWorks: conceptSheet.howItWorks,
      mainElements: conceptSheet.mainElements,
      inputsOutputs: conceptSheet.inputsOutputs,
      relationshipsFlow: conceptSheet.relationshipsFlow,
      userInteraction: conceptSheet.userInteraction,
      arrangement: conceptSheet.arrangement,
      constraintSafetyResponse: conceptSheet.constraintSafetyResponse,
      technicalUncertainty: conceptSheet.technicalUncertainty,
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
    () => (selectedId ? getBench(workshop, selectedId) ?? null : null),
    [selectedId, workshop]
  );
  const discoveryAssessment = useMemo(() => assessDiscovery(project), [project]);
  const recentEngineeringDefinitionInputs = useMemo(
    () => getEngineeringDefinitionInputs(project).slice(-5).reverse(),
    [project]
  );
  const sharedConceptPreview = useMemo(
    () => deriveSharedConceptPreview(project),
    [project]
  );
  const compactConceptPreview = (
    <ConceptPreview preview={sharedConceptPreview} candidate={generatedConceptCandidate} candidateStale={generatedConceptCandidateIsStale} compact />
  );
  const roomStageCandidate = viewedConceptCandidate ?? generatedConceptCandidate;
  const roomStagePresentation = resolveWorkshopStagePresentation(roomStageCandidate);
  const roomConceptPreview = roomStageCandidate ? (
    <ConceptPreview
      preview={sharedConceptPreview}
      candidate={roomStageCandidate}
      candidateStale={generatedConceptCandidateIsStale}
      selectedView={selectedBench?.id === "prototype" ? selectedPrototypeConceptView : "iso"}
    />
  ) : (
    <div className="workshop-stage-empty" role="status">
      <strong>NO DESIGN SAVED</strong>
      <span>Concept 01 will appear here after it is created.</span>
    </div>
  );
  const recentDiscoveryResponses = useMemo(
    () =>
      project.timeline
        .filter((event) => event.type === "discovery-answer-recorded")
        .slice(-4)
        .reverse(),
    [project.timeline]
  );
  const discoveryReviewResponses = useMemo(() => {
    const responses = new Map<string, string>();

    for (const event of project.timeline) {
      if (event.type !== "discovery-answer-recorded" || !event.subject) continue;
      responses.set(event.subject, event.response ?? event.description);
    }

    return responses;
  }, [project.timeline]);
  const prototypeBenchIsFocused =
    prototypeBenchFocused && selectedBench?.id === "prototype";
  const selectedSpecialistBenchId = selectedBench && isSpecialistContributionBenchId(selectedBench.id)
    ? selectedBench.id
    : null;
  const selectedSpecialistContributions = selectedSpecialistBenchId
    ? getSpecialistContributions(project, selectedSpecialistBenchId)
    : [];
  const selectedSpecialistContributionTrace = selectedSpecialistBenchId
    ? workshop.trace.specialistContributions.filter(
        (contribution) => contribution.specialistBenchId === selectedSpecialistBenchId
      )
    : [];
  const specialistProjectContext = useMemo(
    () => createSpecialistProjectContext(project, workshop.trace),
    [project, workshop.trace]
  );
  const specialistBenchGuidance = selectedSpecialistBenchId
    ? createSpecialistBenchGuidance(
        selectedSpecialistBenchId,
        specialistProjectContext
      )
    : null;
  const currentSpecialistPrompt = specialistBenchGuidance
    ? specialistBenchGuidance.prompts[
        Math.min(selectedSpecialistContributions.length, specialistBenchGuidance.prompts.length - 1)
      ]
    : null;
  const rollingSpecialistNotes: BenchNote[] = selectedSpecialistContributions.map(
    (event) => ({
      question: event.subject?.trim() || "Specialist contribution",
      answer: event.description,
    })
  );
  const recommendedBench = getBench(workshop, workshop.recommendedBench) ?? workshop.benches[0];
  const revWorkingUnderstanding = useMemo(() => {
    void workingUnderstandingRevision;
    return deriveRevWorkingUnderstanding(
      project,
      Object.fromEntries(CANONICAL_WORKSHOP_BENCHES.map((bench) => [bench.id, readRollingBenchNotes(project.id, bench.id)])),
      restoredVisualInterpretations
    );
  }, [project, workingUnderstandingRevision, restoredVisualInterpretations]);

  function selectBench(id: WorkshopBenchId) {
    setSelectedId(id);
    setDiscoveryReviewOpen(false);
    setPatentBenchFocused(false);
    setPrototypeBenchFocused(false);
    setSpecialistContributionError("");
    setSpecialistEvidenceError("");
  }

  function returnToWorkshop() {
    setSelectedId(null);
    setDiscoveryReviewOpen(false);
    setPatentBenchFocused(false);
    setPrototypeBenchFocused(false);
    setKnowledgeAnswerDraft("");
    setKnowledgeAnswerError("");
    setEngineeringAnswerDraft("");
    setEngineeringAnswerError("");
  }

  function submitDiscoveryAnswer() {
    const currentQuestion = discoveryAssessment.nextQuestion;
    const cleanedAnswer = knowledgeAnswerDraft.trim();

    if (!currentQuestion) return;

    if (!cleanedAnswer) {
      setKnowledgeAnswerError("Add your response before recording this Discovery answer.");
      return;
    }

    onProjectChange(recordDiscoveryAnswer(project, currentQuestion, cleanedAnswer));
    setKnowledgeAnswerDraft("");
    setKnowledgeAnswerError("");
  }

  function submitEngineeringDefinitionAnswer() {
    const currentQuestion = engineeringDefinitionAssessment.nextQuestion;
    if (!currentQuestion) return;

    const result = recordEngineeringDefinitionAnswer(
      project,
      currentQuestion,
      engineeringAnswerDraft
    );

    if (result.status === "invalid") {
      setEngineeringAnswerError(result.reason);
      return;
    }

    onProjectChange(result.project);
    setEngineeringAnswerDraft("");
    setEngineeringAnswerError("");
  }

  function submitSpecialistContribution() {
    if (!selectedSpecialistBenchId) return;

    const result = recordSpecialistContribution(project, {
      specialistBenchId: selectedSpecialistBenchId,
      contribution: specialistContributionDrafts[selectedSpecialistBenchId] ?? "",
    });

    if (result.status === "invalid") {
      setSpecialistContributionError(result.reason);
      return;
    }

    onProjectChange(result.project);
    setSpecialistContributionDrafts((drafts) => ({
      ...drafts,
      [selectedSpecialistBenchId]: "",
    }));
    setSpecialistContributionError("");
  }

  function recordRollingSpecialistAnswer(answer: string, subject: string): boolean {
    if (!selectedSpecialistBenchId) return false;

    const result = recordSpecialistContribution(project, {
      specialistBenchId: selectedSpecialistBenchId,
      contribution: answer,
      subject,
    });

    if (result.status === "invalid") {
      setSpecialistContributionError(result.reason);
      return false;
    }

    onProjectChange(result.project);
    setSpecialistContributionError("");
    return true;
  }

  function recordRollingCanonicalAnswer(answer: string, prompt: string):
    | { status: "recorded"; message: string }
    | { status: "invalid"; reason: string } {
    const cleanedAnswer = answer.trim();
    if (!cleanedAnswer) return { status: "invalid", reason: "Add your answer before continuing." };

    if (selectedBench?.id === "knowledge") {
      const question = discoveryAssessment.nextQuestion;
      if (!question || question.prompt !== prompt) {
        return { status: "invalid", reason: "That Discovery question is no longer the current Project question." };
      }
      const saveKey = `${project.id}:knowledge:${question.id}`;
      if (lastCanonicalRollingSaveRef.current === saveKey) {
        return { status: "invalid", reason: "That answer is already being recorded in the Project." };
      }
      lastCanonicalRollingSaveRef.current = saveKey;
      const saved = onProjectChange(recordDiscoveryAnswer(project, question, cleanedAnswer));
      if (!saved) {
        lastCanonicalRollingSaveRef.current = "";
        return { status: "invalid", reason: "REV couldn't record that Discovery answer in the Project." };
      }
      return { status: "recorded", message: "Answer recorded in the Project." };
    }

    if (selectedBench?.id === "engineering") {
      const question = engineeringDefinitionAssessment.nextQuestion;
      if (!question || question.prompt !== prompt) {
        return { status: "invalid", reason: "That Engineering question is no longer the current Project question." };
      }
      const saveKey = `${project.id}:engineering:${question.id}`;
      if (lastCanonicalRollingSaveRef.current === saveKey) {
        return { status: "invalid", reason: "That answer is already being recorded in the Project." };
      }
      lastCanonicalRollingSaveRef.current = saveKey;
      const result = recordEngineeringDefinitionAnswer(project, question, cleanedAnswer);
      if (result.status === "invalid") {
        lastCanonicalRollingSaveRef.current = "";
        return { status: "invalid", reason: result.reason };
      }
      if (!onProjectChange(result.project)) {
        lastCanonicalRollingSaveRef.current = "";
        return { status: "invalid", reason: "REV couldn't record that Engineering answer in the Project." };
      }
      return { status: "recorded", message: "Answer recorded in the Project." };
    }

    return { status: "invalid", reason: "This note is not attached to a canonical Project question." };
  }

  function submitSpecialistEvidence() {
    if (!selectedSpecialistBenchId) return;

    const input = specialistEvidenceInputs[selectedSpecialistBenchId] ?? {
      eventId: "",
      summary: "",
      source: "",
    };
    const result = recordProjectEvidenceFromSpecialistContribution(project, {
      specialistContributionEventId: input.eventId,
      summary: input.summary,
      source: input.source,
    });

    if (result.status === "invalid") {
      setSpecialistEvidenceError(result.reason);
      return;
    }

    onProjectChange(result.project);
    setSpecialistEvidenceInputs((inputs) => ({
      ...inputs,
      [selectedSpecialistBenchId]: { eventId: "", summary: "", source: "" },
    }));
    setSpecialistEvidenceError("");
  }

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
    setPrototypeBenchFocused(true);
  }

  function confirmVisualMode() {
    setConfirmedVisualMode(selectedVisualMode);
    setVisualModeCorrectionOpen(false);
  }

  function changeVisualMode(mode: IdeaVisualMode) {
    setVisualModeOverride(mode);
    setConfirmedVisualMode(null);
    setConceptGenerationState("idle");
    setConceptGenerationMessage("");
  }

  async function generateFirstRecognisableConcept(requestOverride?: ConceptGenerationRequest) {
    const baseGenerationRequest = requestOverride ?? conceptGenerationFoundation.request;
    if (!baseGenerationRequest || conceptGenerationInFlightRef.current) return;

    conceptGenerationInFlightRef.current = true;
    setConceptGenerationState("generating");
    setConceptGenerationMessage("");
    const generationStartedAt = performance.now();

    try {
      const generationRequest = baseGenerationRequest.referenceImage
        ? baseGenerationRequest
        : await attachSourceImageReference(project, baseGenerationRequest);

      if (generationRequest.visualMode !== "product" || generationRequest.outputType !== "image") {
        setConceptGenerationState("unsupported");
        setConceptGenerationMessage("Visual generation for this mode is coming next.");
        return;
      }

      pendingConceptGenerationRequestRef.current = generationRequest;
      const response = await fetch("/api/concepts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generationRequest),
      });
      const payload = await response.json() as ConceptGenerationApiResponse;

      if (!response.ok || "error" in payload) {
        const error = "error" in payload ? payload.error : null;
        await holdActionFeedback(generationStartedAt);
        setConceptGenerationState(error?.code === "not-configured" ? "not-configured" : error?.code === "unsupported-mode" ? "unsupported" : "failed");
        setConceptGenerationMessage(error?.message ?? "Concept generation could not complete.");
        return;
      }

      const candidate = bindConceptGeometry(payload.candidate);
      if (
        candidate.conceptFamilyId !== generationRequest.conceptFamilyId ||
        candidate.revision !== generationRequest.revision ||
        !hasValidConceptImageSet(candidate)
      ) {
        await holdActionFeedback(generationStartedAt);
        setConceptGenerationState("failed");
        setConceptGenerationMessage("Concept generation returned an invalid result.");
        return;
      }

      await holdActionFeedback(generationStartedAt);
      setGeneratedConceptCandidate(candidate);
      setConceptCandidateHistory([candidate]);
      setConceptGenerationState("ready");
      setConceptGenerationMessage(payload.referenceUsage === "unsupported"
        ? "The reference image remains saved, but this provider created Concept 01 from your description only."
        : "");
      pendingConceptGenerationRequestRef.current = null;
      setCandidateStorageStatus("candidate-saving");
      try {
        const persisted = await persistCurrentConceptCandidate(project.id, candidate);
        setCandidateStorageStatus(persisted ? "candidate-saved" : "candidate-could-not-be-saved");
      } catch {
        setCandidateStorageStatus("candidate-could-not-be-saved");
      }
    } catch {
      await holdActionFeedback(generationStartedAt);
      setConceptGenerationState("failed");
      setConceptGenerationMessage("Concept generation could not complete.");
    } finally {
      conceptGenerationInFlightRef.current = false;
    }
  }

  function retryFirstRecognisableConcept() {
    const failedRequest = pendingConceptGenerationRequestRef.current;
    if (conceptGenerationInFlightRef.current) return;
    if (failedRequest) {
      void generateFirstRecognisableConcept(failedRequest);
      return;
    }
    void createOrUpdateDesignModel("inventor-hero");
  }

  async function createOrUpdateDesignModel(intent: "inventor-hero" | "technical" = selectedId === "knowledge" ? "inventor-hero" : "technical") {
    const rollingEngineeringNotes = readRollingBenchNotes(project.id, "engineering");
    const rollingInventorNotes = readRollingBenchNotes(project.id, "knowledge");
    const suggestedMode = suggestVisualMode(
      project,
      [...rollingInventorNotes, ...rollingEngineeringNotes],
      primaryVisualInterpretation
    ).mode;
    const selectedMode = confirmedVisualMode && confirmedVisualMode !== "unknown"
      ? confirmedVisualMode
      : visualModeOverride && visualModeOverride !== "unknown"
        ? visualModeOverride
        : suggestedMode;
    if (selectedMode === "unknown") {
      setConceptGenerationState("failed");
      setConceptGenerationMessage("What are we designing? Tell REV whether it is a physical product, machine, process, software, or system.");
      return;
    }
    const visualMode = selectedMode;
    const foundation = buildConceptGenerationFoundation(
      project,
      visualMode,
      conceptWorkflowIdentity,
      rollingEngineeringNotes,
      rollingInventorNotes,
      restoredVisualInterpretations
    );
    if (!foundation.request) {
      setConceptGenerationState("failed");
      setConceptGenerationMessage(`Still needed: ${foundation.missingRequiredFields.map(missingConceptDetailLabel).join(", ")}.`);
      return;
    }
    setConfirmedVisualMode(visualMode);
    await generateFirstRecognisableConcept({
      ...foundation.request,
      representationStyle: intent === "inventor-hero" ? "product-concept" : foundation.request.representationStyle,
    });
  }

  useEffect(() => {
    // Build 1D intentionally retires the one-shot auto-generation hand-off. A legacy
    // marker is cleared without a provider call; persisted candidates still restore above.
    if (window.sessionStorage.getItem("reaidea.entry-generation.v2") === project.id) {
      window.sessionStorage.removeItem("reaidea.entry-generation.v2");
    }
  }, [project.id]);

  const conceptRecoveryAvailable = effectiveHomeAssessment.ready &&
    !sourceEvidenceLoading &&
    candidateStorageStatus !== "loading" &&
    !generatedConceptCandidate &&
    conceptGenerationState !== "generating";

  function recoverConcept01() {
    if (!conceptRecoveryAvailable || conceptGenerationInFlightRef.current) return;
    if (pendingConceptGenerationRequestRef.current) {
      retryFirstRecognisableConcept();
      return;
    }
    void createOrUpdateDesignModel("inventor-hero");
  }

  async function refineCurrentConcept() {
    const currentCandidate = generatedConceptCandidate;
    const rawInventorRefinement = conceptRefinementDraft.trim();
    const refinementIntent = interpretRefinementIntent(rawInventorRefinement);
    const inventorRefinement = refinementIntent.designClauses.join(", ");
    const rollingEngineeringNotes = readRollingBenchNotes(project.id, "engineering");
    const rollingInventorNotes = readRollingBenchNotes(project.id, "knowledge");
    const currentRequest = currentCandidate
      ? buildConceptGenerationFoundation(
          project,
          currentCandidate.visualMode,
          conceptWorkflowIdentity,
          rollingEngineeringNotes,
          rollingInventorNotes
        ).request
      : null;
    if (
      !currentCandidate || !rawInventorRefinement ||
      conceptRefinementInFlightRef.current || currentCandidate.output.type !== "image" ||
      !currentCandidate.output.dataUrl
    ) return;
    if (!currentRequest) {
      setConceptRefinementState("failed");
      setConceptRefinementMessage("The current Engineering design could not be prepared for an update.");
      return;
    }
    if (refinementIntent.hasViewChange && refinementIntent.designClauses.length === 0) {
      await generateRequestedViewAsset(currentCandidate, currentRequest, refinementIntent, conceptCandidateHistory);
      return;
    }
    if (conceptCandidateHistory.length >= MAX_RETAINED_CONCEPT_CANDIDATES) {
      setConceptRefinementState("failed");
      setConceptRefinementMessage("You've reached 5 design versions for this direction.");
      return;
    }

    const refinementRequest: ConceptRefinementRequest = {
      requestId: globalThis.crypto.randomUUID(),
      conceptFamilyId: currentCandidate.conceptFamilyId,
      sourceCandidateId: currentCandidate.candidateId,
      sourceRevision: currentCandidate.revision,
      nextRevision: currentCandidate.revision + 1,
      title: currentCandidate.title.replace(/^CONCEPT \d+/, `CONCEPT ${String(currentCandidate.revision + 1).padStart(2, "0")}`),
      visualMode: currentRequest.visualMode,
      representationStyle: currentCandidate.representationStyle,
      outputType: "image",
      brief: currentRequest.brief,
      sourceEventIds: currentRequest.sourceEventIds,
      sourceTrace: currentRequest.sourceTrace,
      briefVersion: currentRequest.briefVersion,
      inventorRefinement,
      sourceVisualDesignSnapshot: currentCandidate.visualDesignSnapshot,
      sourceImage: {
        mediaType: currentCandidate.output.mediaType,
        dataUrl: currentCandidate.output.dataUrl,
      },
    };

    conceptRefinementInFlightRef.current = true;
    setConceptRefinementState("refining");
    setConceptRefinementMessage("");
    // Event-handler timing keeps brief progress feedback visible; it is not render output.
    const refinementStartedAt = performance.now();
    try {
      const response = await fetch("/api/concepts/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refinementRequest),
      });
      const payload = await response.json() as ConceptRefinementApiResponse;
      if (!response.ok || "error" in payload) {
        await holdActionFeedback(refinementStartedAt);
        setConceptRefinementState("failed");
        setConceptRefinementMessage("error" in payload ? payload.error.message : "Model update could not complete.");
        return;
      }
      const candidate = bindConceptGeometry(payload.candidate);
      if (
        candidate.conceptFamilyId !== currentCandidate.conceptFamilyId ||
        candidate.revision !== currentCandidate.revision + 1 ||
        candidate.sourceCandidateId !== currentCandidate.candidateId ||
        !hasValidConceptImageSet(candidate)
      ) {
        await holdActionFeedback(refinementStartedAt);
        setConceptRefinementState("failed");
        setConceptRefinementMessage("Model update returned an invalid result.");
        return;
      }
      await holdActionFeedback(refinementStartedAt);
      const history = [...conceptCandidateHistory, candidate];
      setConceptCandidateHistory(history);
      setGeneratedConceptCandidate(candidate);
      setConceptRefinementState("ready");
      setViewedConceptRevision(null);
      setCandidateStorageStatus("candidate-saving");
      try {
        const persisted = await persistConceptCandidateHistory(project.id, history);
        setCandidateStorageStatus(persisted ? "candidate-saved" : "candidate-could-not-be-saved");
        if (persisted) {
          if (refinementIntent.hasViewChange) {
            await generateRequestedViewAsset(candidate, currentRequest, refinementIntent, history);
          } else {
            setConceptRefinementDraft("");
            setConceptRefinementOpen(false);
          }
        }
      } catch {
        setCandidateStorageStatus("candidate-could-not-be-saved");
      }
    } catch {
      await holdActionFeedback(refinementStartedAt);
      setConceptRefinementState("failed");
      setConceptRefinementMessage("Model update could not complete.");
    } finally {
      conceptRefinementInFlightRef.current = false;
    }
  }

  async function generateRequestedViewAsset(
    candidate: ConceptCandidate,
    currentRequest: ConceptGenerationRequest,
    intent: RefinementIntent,
    history: ConceptCandidate[]
  ) {
    if (candidate.output.type !== "image" || !candidate.output.views?.length || conceptViewState === "generating") return;
    const requestedView = intent.requestedView ?? selectedPrototypeConceptView;
    const viewRequest: ConceptViewAssetRequest = {
      ...currentRequest,
      requestId: globalThis.crypto.randomUUID(),
      conceptFamilyId: candidate.conceptFamilyId,
      revision: candidate.revision,
      sourceCandidateId: candidate.candidateId,
      requestedView,
      fullObject: intent.fullObject,
      visualDesignSnapshot: candidate.visualDesignSnapshot,
    };
    setConceptViewState("generating");
    setConceptViewMessage("");
    const viewStartedAt = performance.now();
    try {
      const response = await fetch("/api/concepts/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viewRequest),
      });
      const payload = await response.json() as ConceptViewAssetApiResponse;
      if (!response.ok || "error" in payload || payload.view.id !== requestedView || !payload.view.dataUrl.startsWith("data:image/")) {
        await holdActionFeedback(viewStartedAt);
        setConceptViewState("failed");
        setConceptViewMessage("error" in payload ? payload.error.message : "The requested view could not be created.");
        return;
      }
      const existingView = candidate.output.views.some((view) => view.id === requestedView);
      const views = existingView
        ? candidate.output.views.map((view) => view.id === requestedView ? payload.view : view)
        : [...candidate.output.views, payload.view];
      const updatedCandidate: ConceptCandidate = {
        ...candidate,
        output: {
          ...candidate.output,
          views,
          availableViews: views.map((view) => view.id),
          dataUrl: candidate.output.primaryView === requestedView ? payload.view.dataUrl : candidate.output.dataUrl,
        },
        createdAt: new Date().toISOString(),
      };
      const updatedHistory = history.map((item) => item.candidateId === candidate.candidateId ? updatedCandidate : item);
      const persisted = await persistConceptCandidateHistory(project.id, updatedHistory);
      await holdActionFeedback(viewStartedAt);
      if (!persisted) {
        setConceptViewState("failed");
        setConceptViewMessage("The requested view could not be saved.");
        return;
      }
      setConceptCandidateHistory(updatedHistory);
      setGeneratedConceptCandidate(updatedCandidate);
      setViewedConceptRevision(null);
      setPrototypeConceptView(requestedView);
      setCandidateStorageStatus("candidate-saved");
      setConceptViewState("ready");
      setConceptRefinementDraft("");
      setConceptRefinementOpen(false);
    } catch {
      await holdActionFeedback(viewStartedAt);
      setConceptViewState("failed");
      setConceptViewMessage("The requested view could not be created.");
    }
  }

  async function deleteHistoricalConceptRevision(revision: number): Promise<boolean> {
    const currentCandidate = generatedConceptCandidate;
    if (!currentCandidate || revision === currentCandidate.revision) return false;
    const nextHistory = conceptCandidateHistory.filter((candidate) => candidate.revision !== revision);
    if (nextHistory.length === conceptCandidateHistory.length || nextHistory.length === 0) return false;
    try {
      const persisted = await persistConceptCandidateHistory(project.id, nextHistory);
      if (!persisted) {
        setConceptRefinementState("failed");
        setConceptRefinementMessage("That saved design version could not be deleted.");
        return false;
      }
      setConceptCandidateHistory(nextHistory);
      if (viewedConceptRevision === revision) setViewedConceptRevision(null);
      setCandidateStorageStatus("candidate-saved");
      setConceptRefinementState("idle");
      setConceptRefinementMessage("");
      return true;
    } catch {
      setConceptRefinementState("failed");
      setConceptRefinementMessage("That saved design version could not be deleted.");
      return false;
    }
  }

  function visualiseConcept() {
    setConceptCreated(true);
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

    const reviewNote = conceptReviewNotes[review] || conceptReviewDraftNote;
    const nextReviewNotes = { ...conceptReviewNotes, [review]: reviewNote };
    const trace = recordConceptDecision(project, {
      stage: "review",
      decision: review,
      reason: reviewNote,
      supportingEvidenceIds: selectedSupportingEvidenceIds,
      conceptFamilyId: conceptFamilyId || undefined,
      existingDecisionId: conceptReviewDecisionId || undefined,
    });

    setConceptReview(review);
    setConceptReviewNotes(nextReviewNotes);
    setConceptReviewDraftNote("");
    setConceptFamilyId(trace.conceptFamilyId);
    setConceptReviewDecisionId(trace.decisionId);
    if (trace.created) {
      onProjectChange(trace.project);
      setSelectedSupportingEvidenceIds([]);
    }

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
          conceptFamilyId: trace.conceptFamilyId,
          conceptReviewDecisionId: trace.decisionId,
          conceptReview: review,
          conceptReviewNotes: nextReviewNotes,
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

    const decisionNote = conceptDecisionNotes[decision] || conceptDecisionDraftNote;
    const nextDecisionNotes = { ...conceptDecisionNotes, [decision]: decisionNote };
    const trace = recordConceptDecision(project, {
      stage: "direction",
      decision,
      reason: decisionNote,
      supportingEvidenceIds: selectedSupportingEvidenceIds,
      conceptFamilyId: conceptFamilyId || undefined,
      existingDecisionId: conceptDirectionDecisionId || undefined,
    });

    setConceptDecision(decision);
    setConceptDecisionNotes(nextDecisionNotes);
    setConceptDecisionDraftNote("");
    setConceptFamilyId(trace.conceptFamilyId);
    setConceptDirectionDecisionId(trace.decisionId);
    if (trace.created) {
      onProjectChange(trace.project);
      setSelectedSupportingEvidenceIds([]);
    }
    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved ? (JSON.parse(saved) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        conceptStorageKey,
        JSON.stringify({
          ...existing,
          version: 5,
          conceptFamilyId: trace.conceptFamilyId,
          conceptDirectionDecisionId: trace.decisionId,
          conceptDecision: decision,
          conceptDecisionNotes: nextDecisionNotes,
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

  function toggleSupportingEvidence(evidenceId: string) {
    setSelectedSupportingEvidenceIds((selectedIds) =>
      selectedIds.includes(evidenceId)
        ? selectedIds.filter((id) => id !== evidenceId)
        : [...selectedIds, evidenceId]
    );
  }

  function renderSupportingEvidenceSelector() {
    if (project.evidence.length === 0) {
      return <p className="concept-evidence-empty">No Project evidence recorded yet.</p>;
    }

    return (
      <fieldset className="concept-evidence-selector">
        <legend>Project evidence to support this decision (optional)</legend>
        <p>Choose only the evidence you want to link to this decision.</p>
        <div className="concept-evidence-options">
          {project.evidence.map((evidence) => (
            <label key={evidence.id}>
              <input
                type="checkbox"
                checked={selectedSupportingEvidenceIds.includes(evidence.id)}
                onChange={() => toggleSupportingEvidence(evidence.id)}
              />
              <span>
                <strong>{evidence.summary}</strong>
                <small>
                  {evidence.source}
                  {evidence.validationOutcome && ` · ${evidence.validationOutcome}`}
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  function saveConceptDecisionNote(value: string) {
    if (conceptDecision === "undecided") {
      setConceptDecisionDraftNote(value);
      return;
    }

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
    if (conceptReview === "unreviewed") {
      setConceptReviewDraftNote(value);
      return;
    }

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

  function updateInheritedEngineeringPreview() {
    const inventorChange = conceptRefinementDraft.trim();
    if (!inventorChange) return;
    const nextRevision = engineeringPreviewRevision + 1;
    setEngineeringPreviewRevision(nextRevision);
    setEngineeringPreviewLatestChange(inventorChange);
    setViewedConceptRevision(null);
    setConceptRefinementState("ready");

    try {
      const saved = window.localStorage.getItem(conceptStorageKey);
      const existing = saved ? (JSON.parse(saved) as Record<string, unknown>) : {};
      window.localStorage.setItem(conceptStorageKey, JSON.stringify({
        ...existing,
        projectId: project.id,
        conceptFamilyId: conceptFamilyId || conceptWorkflowIdentity.conceptFamilyId,
        engineeringPreviewRevision: nextRevision,
        engineeringPreviewLatestChange: inventorChange,
        engineeringPreviewUpdatedAt: new Date().toISOString(),
      }));
    } catch {
      // The inherited Engineering preview remains available for this session if persistence fails.
    }
  }

  const specialistWorkArea = selectedSpecialistBenchId && (
    <>
      {specialistBenchGuidance && (
        <section className="specialist-inquiry" aria-label="Specialist Inquiry">
          <div className="specialist-inquiry-heading">
            <div>
              <p className="station-summary-label">Questions to explore</p>
              <strong>{specialistBenchGuidance.title}</strong>
            </div>
            <span>Guide</span>
          </div>
          <p className="specialist-inquiry-lens">
            <strong>Focus:</strong> {specialistBenchGuidance.lens}
          </p>
          <p>{specialistBenchGuidance.explanation}</p>
          <p className="specialist-inquiry-boundary">
            These questions are here to help you think. Nothing is added to the Project unless you choose to save it.
          </p>
          {currentSpecialistPrompt && (
            <div className="specialist-current-question">
              <span>Current question</span>
              <strong>{currentSpecialistPrompt}</strong>
            </div>
          )}
          {selectedSpecialistBenchId !== "patent" && <div className="specialist-inquiry-notes">
            <strong>What we already know</strong>
            <ul>
              {specialistBenchGuidance.structuralNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>}
        </section>
      )}
      <div className="specialist-contribution-panel">
        <p className="station-summary-label">What did you learn here?</p>
        <p>
          Write down anything useful you learned while working on this bench.
        </p>
        <label className="specialist-answer-input">
          <span>Your answer</span>
        <textarea
          id="specialist-contribution"
          value={specialistContributionDrafts[selectedSpecialistBenchId] ?? ""}
          onChange={(event) => {
            setSpecialistContributionDrafts((drafts) => ({
              ...drafts,
              [selectedSpecialistBenchId]: event.target.value,
            }));
            if (specialistContributionError) setSpecialistContributionError("");
          }}
          placeholder="Write your answer in your own words."
          rows={4}
        />
        </label>
        {specialistContributionError && (
          <p className="specialist-contribution-error" role="alert">
            {specialistContributionError}
          </p>
        )}
        <button type="button" onClick={submitSpecialistContribution}>
          Save &amp; Continue
        </button>

        {selectedSpecialistContributions.length > 0 && (
          <div className="specialist-contribution-history">
            <strong>Earlier notes from this bench</strong>
            {selectedSpecialistContributions.map((event) => (
              <article key={event.id}>
                <p>{event.description}</p>
                <time dateTime={event.createdAt}>{event.createdAt}</time>
                <span>
                  {(() => {
                    const adoption = selectedSpecialistContributionTrace.find(
                      (candidate) => candidate.eventId === event.id
                    );
                    const count = adoption?.adoptedEvidenceIds.length ?? 0;
                    return count > 0
                      ? `Explicitly adopted as ${count} Project evidence item${count === 1 ? "" : "s"}.`
                      : "Not explicitly adopted as Project evidence.";
                  })()}
                </span>
              </article>
            ))}
          </div>
        )}

        {selectedSpecialistContributions.length > 0 && (
          <div className="specialist-evidence-adoption">
            <strong>Add as Project Evidence</strong>
            <p>
              Save this as information we can use to judge how well the invention works.
            </p>
            <select
              value={specialistEvidenceInputs[selectedSpecialistBenchId]?.eventId ?? ""}
              onChange={(event) => {
                setSpecialistEvidenceInputs((inputs) => ({
                  ...inputs,
                  [selectedSpecialistBenchId]: {
                    eventId: event.target.value,
                    summary: inputs[selectedSpecialistBenchId]?.summary ?? "",
                    source: inputs[selectedSpecialistBenchId]?.source ?? "",
                  },
                }));
                if (specialistEvidenceError) setSpecialistEvidenceError("");
              }}
            >
              <option value="">Choose a specialist finding</option>
              {selectedSpecialistContributions.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.description}
                </option>
              ))}
            </select>
            <textarea
              value={specialistEvidenceInputs[selectedSpecialistBenchId]?.summary ?? ""}
              onChange={(event) => {
                setSpecialistEvidenceInputs((inputs) => ({
                  ...inputs,
                  [selectedSpecialistBenchId]: {
                    eventId: inputs[selectedSpecialistBenchId]?.eventId ?? "",
                    summary: event.target.value,
                    source: inputs[selectedSpecialistBenchId]?.source ?? "",
                  },
                }));
                if (specialistEvidenceError) setSpecialistEvidenceError("");
              }}
              placeholder="What did we learn?"
              rows={3}
            />
            <input
              value={specialistEvidenceInputs[selectedSpecialistBenchId]?.source ?? ""}
              onChange={(event) => {
                setSpecialistEvidenceInputs((inputs) => ({
                  ...inputs,
                  [selectedSpecialistBenchId]: {
                    eventId: inputs[selectedSpecialistBenchId]?.eventId ?? "",
                    summary: inputs[selectedSpecialistBenchId]?.summary ?? "",
                    source: event.target.value,
                  },
                }));
                if (specialistEvidenceError) setSpecialistEvidenceError("");
              }}
              placeholder="Where this information came from"
            />
            {specialistEvidenceError && (
              <p className="specialist-contribution-error" role="alert">
                {specialistEvidenceError}
              </p>
            )}
            <button type="button" onClick={submitSpecialistEvidence}>
              Add as Project Evidence
            </button>
          </div>
        )}
      </div>
      {specialistBenchGuidance?.disclaimer && (
        <p className="specialist-inquiry-disclaimer">
          {specialistBenchGuidance.disclaimer}
        </p>
      )}
    </>
  );

  function presentationProgressForBench(id: WorkshopBenchId): "red" | "yellow" | "green" {
    const override = benchPresentationProgress[id];
    if (override) return override;

    if (id === "knowledge") {
      const inventorNotes = readRollingBenchNotes(project.id, "knowledge");
      const inventorUnderstanding = inventorNotes.map((note) => note.answer).join(" ");
      return generatedConceptCandidate && (inventorNotes.length >= 2 || inventorUnderstanding.length >= 360)
        ? "green"
        : generatedConceptCandidate || inventorNotes.length > 0 || discoveryAssessment.addressedFocuses.length > 0 ? "yellow" : "red";
    }
    if (id === "engineering") {
      return engineeringDefinitionAssessment.status === "ready-for-summary"
        ? "green"
        : engineeringDefinitionAssessment.addressedAreas.length > 0 ? "yellow" : "red";
    }
    if (id === "prototype") return generatedConceptCandidate || hasEngineeringDesignBrief ? "yellow" : "red";
    if (id === "validation") {
      return validationEvidence.outcome !== "pending"
        ? "green"
        : validationEvidence.question || validationEvidence.evidence || validationEvidence.observed ? "yellow" : "red";
    }
    const count = getSpecialistContributions(project, id).length;
    const total = id === "patent" || id === "reality" ? 4 : 5;
    return count >= total ? "green" : count > 0 ? "yellow" : "red";
  }

  if (showLegacyBenchPanels && selectedBench?.id === "engineering") {
    const currentQuestion = engineeringDefinitionAssessment.nextQuestion;
    const totalAreas =
      engineeringDefinitionAssessment.addressedAreas.length +
      engineeringDefinitionAssessment.remainingAreas.length;

    return (
      <StandardBenchShell
        benchId={selectedBench.id}
        benchTitle={selectedBench.label}
        benchState={selectedBench.state}
        reason={selectedBench.reason}
        nextMove={selectedBench.nextMove}
        conceptPreview={compactConceptPreview}
        onBackToWorkshop={returnToWorkshop}
        askRevState="unavailable"
        thisBenchLedger={
          <div className="engineering-definition-ledger">
            <p className="engineering-definition-ledger-label">How the idea works</p>
            <dl>
              <div><dt>Current focus</dt><dd>{currentQuestion?.label ?? "Ready for summary"}</dd></div>
              <div><dt>Areas addressed</dt><dd>{engineeringDefinitionAssessment.addressedAreas.length}</dd></div>
              <div><dt>Areas remaining</dt><dd>{engineeringDefinitionAssessment.remainingAreas.length}</dd></div>
              <div><dt>Progress</dt><dd>{engineeringDefinitionAssessment.status.replaceAll("-", " ")}</dd></div>
            </dl>
            <p className="engineering-definition-ledger-label">Your saved answers</p>
            {recentEngineeringDefinitionInputs.length > 0 ? (
              <div className="engineering-definition-input-list">
                {recentEngineeringDefinitionInputs.map((input) => (
                  <section key={input.eventId}>
                    <strong>{input.label}</strong>
                    <p>{input.answer}</p>
                    <small>{new Date(input.createdAt).toLocaleString()}</small>
                  </section>
                ))}
              </div>
            ) : (
              <p className="engineering-definition-empty">No Engineering answers have been saved yet.</p>
            )}
          </div>
        }
        projectLedger={
          <div className="engineering-definition-ledger">
            <strong className="engineering-definition-project-name">{project.projectName}</strong>
            <section><strong>Original observation</strong><p>{project.originalObservation}</p></section>
            <section><strong>Current understanding</strong><p>{project.engineeringState.currentUnderstanding}</p></section>
            <section><strong>Biggest unknown</strong><p>{project.engineeringState.greatestRemainingUncertainty}</p></section>
            <section><strong>What to do next</strong><p>{project.engineeringState.nextEngineeringStep}</p></section>
            <dl>
              <div><dt>Project stage</dt><dd>{project.readiness}</dd></div>
              <div><dt>Known limits</dt><dd>{project.engineeringState.currentConstraints.length}</dd></div>
              <div><dt>Ideas to check</dt><dd>{project.engineeringState.currentAssumptions.length}</dd></div>
              <div><dt>Project evidence</dt><dd>{project.evidence.length}</dd></div>
              <div><dt>What we have learned</dt><dd>{workshop.trace.currentEngineeringConclusions.length}</dd></div>
              <div><dt>Current directions</dt><dd>{workshop.trace.currentEngineeringDirections.length}</dd></div>
              <div><dt>Planned actions</dt><dd>{workshop.trace.adoptedEngineeringActions.length}</dd></div>
            </dl>
            <section><strong>Test plan</strong><p>{project.validationPlan?.status ?? "No test plan has been created."}</p></section>
          </div>
        }
      >
        <div className="engineering-definition-work-area">
          <section className="engineering-definition-intro">
            <span>REV · ENGINEERING DEFINITION</span>
            <h2>Now I understand the problem. Let&apos;s work out how your idea works.</h2>
            <p>Explain your idea one step at a time. These are your working notes, and they can change.</p>
          </section>

          {currentQuestion ? (
            <>
              <div className="engineering-definition-progress" aria-label="Engineering definition progress">
                <span>{engineeringDefinitionAssessment.addressedAreas.length} OF {totalAreas} AREAS</span>
                <i><b style={{ width: `${(engineeringDefinitionAssessment.addressedAreas.length / totalAreas) * 100}%` }} /></i>
              </div>
              <section className="engineering-definition-question">
                <span>REV · {currentQuestion.label}</span>
                <h2>{currentQuestion.prompt}</h2>
                <p>{currentQuestion.purpose}</p>
                <small>{currentQuestion.guidance}</small>
              </section>
              <label className="engineering-definition-answer">
                <span>Your explanation</span>
                <textarea
                  value={engineeringAnswerDraft}
                  onChange={(event) => {
                    setEngineeringAnswerDraft(event.target.value);
                    if (engineeringAnswerError) setEngineeringAnswerError("");
                  }}
                  placeholder="Explain it in your own words..."
                  rows={7}
                />
              </label>
              {engineeringAnswerError && <p className="engineering-definition-error" role="alert">{engineeringAnswerError}</p>}
              <button type="button" className="engineering-definition-record" onClick={submitEngineeringDefinitionAnswer}>Save &amp; Continue</button>
            </>
          ) : (
            <section className="engineering-definition-ready">
              <span>YOUR IDEA · READY TO REVIEW</span>
              <h2>You have explained the main parts of how your idea could work.</h2>
              <p>This is your current thinking. It can change and has not been proven yet.</p>
            </section>
          )}

          {engineeringDefinitionAssessment.solutionDefinitionSummary && (
            <section className="engineering-definition-summary">
              <span>HOW YOUR IDEA COULD WORK</span>
              <p>{engineeringDefinitionAssessment.solutionDefinitionSummary}</p>
            </section>
          )}

          <section className="engineering-definition-legacy">
            <div>
              <span>CREATE A WORKING MODEL</span>
              <strong>{conceptCreated ? "Concept 01 study is available." : "Create the existing local procedural study when useful."}</strong>
              <small>Create an early model when it will help you explore the idea.</small>
            </div>
            <button type="button" onClick={createConcept} disabled={!canCreateConcept}>
              {conceptCreated ? "Open Concept 01" : "Create Model"}
            </button>
          </section>

          <ProjectReviewView project={project} showValidationPlan={false} />
        </div>

        <style jsx>{`
          .engineering-definition-work-area { display: grid; gap: 19px; }
          .engineering-definition-intro, .engineering-definition-question, .engineering-definition-ready, .engineering-definition-summary, .engineering-definition-legacy { padding: 19px; border: 1px solid #435256; border-radius: 11px; background: rgba(8, 14, 16, .58); }
          .engineering-definition-intro span, .engineering-definition-question > span, .engineering-definition-ready > span, .engineering-definition-summary > span, .engineering-definition-legacy span, .engineering-definition-answer > span, .engineering-definition-ledger-label { color: #69d9e9; font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
          .engineering-definition-intro h2, .engineering-definition-question h2, .engineering-definition-ready h2 { margin: 8px 0; color: #f3f5f1; font-size: 23px; line-height: 1.25; }
          .engineering-definition-intro p, .engineering-definition-question p, .engineering-definition-ready p { margin: 0; color: #b9c3c1; line-height: 1.6; }
          .engineering-definition-question small { display: block; margin-top: 13px; color: #8fa7a8; line-height: 1.55; }
          .engineering-definition-progress { display: flex; align-items: center; gap: 13px; color: #b8c6c4; font-size: 10px; font-weight: 850; letter-spacing: .08em; }
          .engineering-definition-progress i { height: 7px; flex: 1; overflow: hidden; border-radius: 999px; background: #172326; }
          .engineering-definition-progress b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #318f9d, #77e5e8); }
          .engineering-definition-answer { display: grid; gap: 8px; }
          .engineering-definition-error { margin: -9px 0 0; color: #ffb6a9; font-size: 12px; }
          .engineering-definition-record { justify-self: start; }
          .engineering-definition-summary p { margin: 11px 0 0; color: #d5ddda; white-space: pre-line; line-height: 1.65; }
          .engineering-definition-legacy { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-color: #5d5548; }
          .engineering-definition-legacy div { display: grid; gap: 6px; }
          .engineering-definition-legacy strong { color: #e7e0d4; }
          .engineering-definition-legacy small { color: #948f86; line-height: 1.45; }
          .engineering-definition-ledger { display: grid; gap: 13px; }
          .engineering-definition-ledger dl { display: grid; gap: 7px; margin: 0; }
          .engineering-definition-ledger dl div, .engineering-definition-ledger section { padding: 10px; border: 1px solid #454d4e; border-radius: 8px; background: rgba(8, 12, 13, .38); }
          .engineering-definition-ledger dt, .engineering-definition-ledger section strong { color: #c5b999; font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
          .engineering-definition-ledger dd, .engineering-definition-ledger section p { margin: 5px 0 0; color: #eef0ec; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-line; }
          .engineering-definition-input-list { display: grid; gap: 8px; }
          .engineering-definition-input-list section small { display: block; margin-top: 6px; color: #8d9997; font-size: 10px; }
          .engineering-definition-empty { margin: 0; color: #929d9b; font-size: 12px; line-height: 1.5; }
          .engineering-definition-project-name { color: #f4efe6; font-size: 18px; }
          @media (max-width: 700px) { .engineering-definition-legacy { align-items: stretch; flex-direction: column; } }
        `}</style>
      </StandardBenchShell>
    );
  }

  if (showLegacyBenchPanels && selectedBench?.id === "knowledge") {
    const currentQuestion = discoveryAssessment.nextQuestion;

    return (
      <StandardBenchShell
        benchId={selectedBench.id}
        benchTitle={selectedBench.label}
        benchState={selectedBench.state}
        reason={selectedBench.reason}
        nextMove={selectedBench.nextMove}
        conceptPreview={compactConceptPreview}
        onBackToWorkshop={returnToWorkshop}
        askRevState="unavailable"
        thisBenchLedger={
          <div className="knowledge-ledger-view">
            <p className="knowledge-ledger-label">What we understand so far</p>
            <dl>
              <div><dt>Current focus</dt><dd>{currentQuestion?.focusLabel ?? "Discovery checkpoint reached"}</dd></div>
              <div><dt>Addressed areas</dt><dd>{discoveryAssessment.addressedFocuses.length}</dd></div>
              <div><dt>Remaining areas</dt><dd>{discoveryAssessment.unansweredFocuses.length}</dd></div>
              <div><dt>Checkpoint</dt><dd>{discoveryAssessment.readyToAdvance ? "Reached" : "Not reached"}</dd></div>
              <div><dt>What we know</dt><dd>{discoveryAssessment.evidenceStatus}</dd></div>
            </dl>
            <p className="knowledge-ledger-label">Recorded responses</p>
            {recentDiscoveryResponses.length > 0 ? (
              <div className="knowledge-response-list">
                {recentDiscoveryResponses.map((event) => (
                  <section key={event.id}>
                    <strong>{event.title.replace(/^Discovery ·\s*/, "")}</strong>
                    <p>{event.response ?? event.description}</p>
                    <small>{new Date(event.createdAt).toLocaleString()}</small>
                  </section>
                ))}
              </div>
            ) : (
              <p className="knowledge-ledger-empty">No Discovery responses recorded yet.</p>
            )}
          </div>
        }
        projectLedger={
          <div className="knowledge-ledger-view">
            <strong className="knowledge-project-name">{project.projectName}</strong>
            <section><strong>Original observation</strong><p>{project.originalObservation}</p></section>
            <section><strong>Current understanding</strong><p>{project.engineeringState.currentUnderstanding}</p></section>
            <dl>
              <div><dt>Project stage</dt><dd>{project.readiness}</dd></div>
              <div><dt>Known limits</dt><dd>{project.engineeringState.currentConstraints.length}</dd></div>
              <div><dt>Ideas to check</dt><dd>{project.engineeringState.currentAssumptions.length}</dd></div>
              <div><dt>Notes from checks</dt><dd>{project.engineeringState.currentEvidence.length}</dd></div>
              <div><dt>Project evidence</dt><dd>{project.evidence.length}</dd></div>
            </dl>
            <section><strong>Biggest unknown</strong><p>{project.engineeringState.greatestRemainingUncertainty}</p></section>
            <section><strong>What to do next</strong><p>{project.engineeringState.nextEngineeringStep}</p></section>
            <section><strong>Test plan</strong><p>{project.validationPlan?.status ?? "No test plan has been created."}</p></section>
          </div>
        }
      >
        <div className="knowledge-work-area">
          {discoveryReviewOpen ? (
            <section className="discovery-review" aria-label="Discovery review">
              <div className="discovery-review-heading">
                <div>
                  <span>DISCOVERY REVIEW</span>
                  <h2>What you have shared</h2>
                </div>
                <b>READ ONLY</b>
              </div>
              <p>Review your Discovery answers without leaving the Workshop.</p>
              <div className="discovery-review-grid">
                {DISCOVERY_REVIEW_AREAS.map((area) => (
                  <article key={area.id}>
                    <strong>{area.label}</strong>
                    <p>{discoveryReviewResponses.get(area.id) ?? "No answer recorded yet."}</p>
                  </article>
                ))}
              </div>
              <button type="button" onClick={() => setDiscoveryReviewOpen(false)}>
                Back to Your Idea
              </button>
            </section>
          ) : currentQuestion ? (
            <>
              <div className="knowledge-question-heading">
                <div><span>DISCOVERY · CURRENT QUESTION</span><h2>{currentQuestion.focusLabel}</h2></div>
                <b>{discoveryAssessment.addressedFocuses.length} / {discoveryAssessment.addressedFocuses.length + discoveryAssessment.unansweredFocuses.length} AREAS</b>
              </div>
              <section className="knowledge-question-card">
                <p className="knowledge-question-prompt">{currentQuestion.prompt}</p>
                <p>{currentQuestion.purpose}</p>
                <details><summary>Why REV is asking this now</summary><p>{currentQuestion.reason}</p></details>
              </section>
              <label className="knowledge-answer-input">
                <span>Your response</span>
                <textarea
                  value={knowledgeAnswerDraft}
                  onChange={(event) => {
                    setKnowledgeAnswerDraft(event.target.value);
                    if (knowledgeAnswerError) setKnowledgeAnswerError("");
                  }}
                  placeholder="Answer in your own words..."
                  rows={7}
                />
              </label>
              {knowledgeAnswerError && <p className="knowledge-answer-error" role="alert">{knowledgeAnswerError}</p>}
              <button type="button" className="knowledge-record-action" onClick={submitDiscoveryAnswer}>Save &amp; Continue</button>
              <section className="knowledge-next-context">
                <strong>What we still need to know</strong><p>{currentQuestion.uncertainty}</p>
                <strong>What to do next</strong><p>{currentQuestion.nextEngineeringStep}</p>
              </section>
            </>
          ) : (
            <section className="knowledge-checkpoint-card">
              <span>WE HAVE ENOUGH TO MOVE ON</span>
              <h2>You have covered the main Discovery questions.</h2>
              <p>{discoveryAssessment.summary}</p>
              <p>Review what you shared and decide what to check next.</p>
              <button type="button" onClick={() => setDiscoveryReviewOpen(true)}>Review Discovery</button>
            </section>
          )}
          {!discoveryReviewOpen && (
            <div className="knowledge-compatibility-links">
              <button type="button" onClick={() => setDiscoveryReviewOpen(true)}>Review Discovery</button>
              <Link href="/interview">Open Knowledge Interview</Link>
            </div>
          )}
        </div>

        <style jsx>{`
          .knowledge-work-area { display: grid; gap: 18px; }
          .knowledge-question-heading { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
          .knowledge-question-heading span, .knowledge-ledger-label, .knowledge-next-context strong, .knowledge-checkpoint-card > span { color: #69d9e9; font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
          .knowledge-question-heading h2, .knowledge-checkpoint-card h2 { margin: 6px 0 0; color: #f2f5f3; font-size: 25px; }
          .knowledge-question-heading b { color: #b7a879; font-size: 10px; letter-spacing: .08em; white-space: nowrap; }
          .knowledge-question-card, .knowledge-next-context, .knowledge-checkpoint-card { padding: 18px; border: 1px solid #3e5055; border-radius: 10px; background: rgba(7, 13, 15, .5); }
          .knowledge-question-card > p, .knowledge-next-context p, .knowledge-checkpoint-card p { color: #aeb9b9; line-height: 1.6; }
          .knowledge-question-prompt { margin-top: 0; color: #f1f3ef !important; font-size: 20px; font-weight: 720; }
          .knowledge-question-card details { margin-top: 14px; color: #aeb9b9; }
          .knowledge-question-card summary { cursor: pointer; color: #9edce5; font-weight: 750; }
          .knowledge-answer-input { display: grid; gap: 8px; color: #c7d0cd; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
          .knowledge-answer-input textarea { resize: vertical; box-sizing: border-box; width: 100%; padding: 13px; border: 1px solid #496069; border-radius: 9px; background: #081114; color: #edf2ef; font: inherit; line-height: 1.55; }
          .knowledge-answer-input textarea:focus { outline: 2px solid rgba(79, 205, 224, .45); border-color: #67d6e7; }
          .knowledge-answer-error { margin: -8px 0 0; color: #ffb6a9; font-size: 12px; }
          .discovery-review { display: grid; gap: 16px; }
          .discovery-review > p { margin: 0; color: #aeb9b9; line-height: 1.6; }
          .discovery-review-heading { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
          .discovery-review-heading span { color: #69d9e9; font-size: 10px; font-weight: 850; letter-spacing: .1em; }
          .discovery-review-heading h2 { margin: 6px 0 0; color: #f2f5f3; font-size: 25px; }
          .discovery-review-heading b { color: #b7a879; font-size: 10px; letter-spacing: .08em; }
          .discovery-review-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .discovery-review-grid article { padding: 14px; border: 1px solid #3e5055; border-radius: 9px; background: rgba(7, 13, 15, .5); }
          .discovery-review-grid strong { color: #9edce5; font-size: 12px; }
          .discovery-review-grid p { margin: 8px 0 0; color: #eef0ec; line-height: 1.55; white-space: pre-line; }
          .discovery-review > button { justify-self: start; }
          @media (max-width: 700px) { .discovery-review-grid { grid-template-columns: 1fr; } }
          .knowledge-record-action { justify-self: start; padding: 12px 18px; border: 1px solid #69d9e9; border-radius: 8px; background: #173c44; color: #edfdff; font: inherit; font-size: 12px; font-weight: 850; letter-spacing: .07em; cursor: pointer; }
          .knowledge-next-context p { margin: 5px 0 13px; }
          .knowledge-next-context p:last-child { margin-bottom: 0; }
          .knowledge-compatibility-links { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 14px; border-top: 1px solid #334448; }
          .knowledge-compatibility-links a, .knowledge-checkpoint-card a { color: #89dce8; font-size: 12px; font-weight: 750; }
          .knowledge-ledger-view { display: grid; gap: 14px; color: #dce1de; }
          .knowledge-ledger-view dl { display: grid; gap: 7px; margin: 0; }
          .knowledge-ledger-view dl div, .knowledge-ledger-view section { padding: 10px; border: 1px solid #454d4e; border-radius: 8px; background: rgba(8, 12, 13, .38); }
          .knowledge-ledger-view dt, .knowledge-ledger-view section strong { color: #c5b999; font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
          .knowledge-ledger-view dd, .knowledge-ledger-view section p { margin: 5px 0 0; color: #eef0ec; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
          .knowledge-ledger-view section small { display: block; margin-top: 6px; color: #8d9997; font-size: 10px; }
          .knowledge-response-list { display: grid; gap: 8px; }
          .knowledge-ledger-empty { margin: 0; color: #929d9b; font-size: 12px; line-height: 1.5; }
          .knowledge-project-name { color: #f4efe6; font-size: 18px; }
          @media (max-width: 700px) { .knowledge-question-heading { flex-direction: column; } }
        `}</style>
      </StandardBenchShell>
    );
  }

  if (showLegacyBenchPanels && patentBenchFocused && selectedBench?.id === "patent") {
    const latestContribution = selectedSpecialistContributionTrace.at(-1);
    const adoptedEvidenceCount = latestContribution?.adoptedEvidenceIds.length ?? 0;

    return (
      <StandardBenchShell
        benchId={selectedBench.id}
        benchTitle={selectedBench.label}
        benchState={selectedBench.state}
        reason={selectedBench.reason}
        nextMove={selectedBench.nextMove}
        conceptPreview={compactConceptPreview}
        onBackToWorkshop={returnToWorkshop}
        askRevState="unavailable"
        thisBenchLedger={
          <div className="patent-ledger-view">
            <dl>
              <div>
                <dt>Recorded Contributions</dt>
                <dd>{selectedSpecialistContributionTrace.length}</dd>
              </div>
            </dl>
            {latestContribution ? (
              <>
                <section>
                  <strong>Latest Contribution</strong>
                  <p>{latestContribution.contribution}</p>
                </section>
                <section>
                  <strong>Evidence Added to Project</strong>
                  <p>
                    {adoptedEvidenceCount > 0
                      ? `Explicitly adopted as ${adoptedEvidenceCount} Project evidence item${adoptedEvidenceCount === 1 ? "" : "s"}.`
                      : "Not explicitly adopted as Project evidence."}
                  </p>
                </section>
              </>
            ) : (
              <p>No Patent / IP contribution has been recorded yet.</p>
            )}
          </div>
        }
        projectLedger={
          <div className="patent-ledger-view project-ledger-view">
            <strong className="ledger-project-name">{specialistProjectContext.projectName}</strong>
            <section>
              <strong>Current Understanding</strong>
              <p>{specialistProjectContext.currentUnderstanding || "No current Project understanding recorded."}</p>
            </section>
            <section>
              <strong>Greatest Remaining Uncertainty</strong>
              <p>{specialistProjectContext.greatestRemainingUncertainty || "No greatest remaining uncertainty recorded."}</p>
            </section>
            <dl className="ledger-counts">
              <div><dt>Constraints</dt><dd>{specialistProjectContext.constraints.total}</dd></div>
              <div><dt>Project Evidence</dt><dd>{specialistProjectContext.evidence.total}</dd></div>
              <div><dt>Current Conclusions</dt><dd>{specialistProjectContext.conclusions.total}</dd></div>
              <div><dt>Current Directions</dt><dd>{specialistProjectContext.directions.total}</dd></div>
              <div><dt>Adopted Actions</dt><dd>{specialistProjectContext.actions.total}</dd></div>
            </dl>
            <small>Concise Project snapshot. Recorded collections are represented by counts rather than full lists.</small>
          </div>
        }
      >
        {specialistWorkArea}
        <style jsx>{`
          .patent-ledger-view {
            display: grid;
            gap: 18px;
          }
          .patent-ledger-view dl,
          .patent-ledger-view p {
            margin: 0;
          }
          .patent-ledger-view dl div,
          .patent-ledger-view section {
            padding: 13px 0;
            border-bottom: 1px solid #35475a;
          }
          .patent-ledger-view dt,
          .patent-ledger-view section strong {
            color: #91a4b2;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          .patent-ledger-view dd {
            margin: 5px 0 0;
            color: #f2f6f8;
            font-size: 26px;
            font-weight: 850;
          }
          .patent-ledger-view section p {
            margin-top: 7px;
            color: #d1dbe2;
            font-size: 13px;
            line-height: 1.55;
            overflow-wrap: anywhere;
          }
          .ledger-project-name {
            color: #f2f6f8;
            font-size: 18px;
          }
          .ledger-counts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .ledger-counts div {
            padding: 10px;
            border: 1px solid #35475a;
            border-radius: 8px;
          }
          .project-ledger-view > small {
            color: #8295a4;
            line-height: 1.45;
          }
        `}</style>
      </StandardBenchShell>
    );
  }

  return (
    <section
      className={`living-workshop${prototypeBenchIsFocused ? " prototype-mode" : ""}`}
      aria-label="reAIdea living workshop"
    >
      {!prototypeBenchIsFocused && (
        <>
      <WorkshopRoom
        projectName={projectName}
        projectStatus={formatReadiness(project.readiness)}
        conceptPreview={roomConceptPreview}
        stagePresentation={roomStagePresentation}
        benches={CANONICAL_WORKSHOP_BENCHES.flatMap(({ id, shortLabel, positionClass }) => {
          const bench = getBench(workshop, id);
          return bench ? [{ id, shortLabel, positionClass, state: bench.state, progress: presentationProgressForBench(id), selected: selectedBench?.id === id, recommended: recommendedBench.id === id }] : [];
        })}
        prototypeActive={selectedBench?.id === "prototype"}
        prototypeRepresentation={prototypeRepresentation}
        onSelectBench={selectBench}
        onReturnToOverview={returnToWorkshop}
        caption="One Project · every bench works from the same evolving idea."
      >
      <div
        ref={workspaceRef}
        className={
          prototypeBenchIsFocused
            ? "prototype-focused-workspace"
            : selectedBench
              ? `bench-readout active-bench-workspace readout-${selectedBench.state}`
              : "bench-readout workshop-floor-guidance"
        }
      >
        {!selectedBench && (
          <>
            <div className="workshop-floor-screen workshop-floor-status-screen" role="region" aria-label="Workshop Floor selection status">
              <span>WORKSHOP STATUS</span>
              <strong>NO BENCH SELECTED</strong>
              <p>Choose a bench when you are ready. The Workshop remains yours to navigate.</p>
            </div>
            <div className="workshop-floor-screen workshop-floor-recommendation-screen" role="region" aria-label={`REV recommends ${recommendedBench.label}`}>
              <span>REV RECOMMENDS</span>
              <strong>{recommendedBench.label}</strong>
            </div>
            <div className="workshop-floor-screen workshop-floor-next-screen" role="region" aria-label="REV next move">
              <span>REV · NEXT USEFUL DECISION</span>
              <strong>{recommendedBench.nextMove}</strong>
            </div>
            {(conceptGenerationState === "generating" || conceptGenerationState === "failed") && (
              <div className="workshop-floor-recovery" role="status" aria-live="polite">
                {conceptGenerationState === "generating" && <GenerationProgress kind="first-generation" status="working" />}
                {conceptGenerationState === "failed" && <GenerationProgress kind="first-generation" status="failed" failureMessage="REV couldn't create your concept this time." onRetry={retryFirstRecognisableConcept} />}
              </div>
            )}
            <div className="workshop-floor-actions">
              {conceptRecoveryAvailable && (
                <button type="button" className="workshop-floor-gold-control" onClick={recoverConcept01}>
                  {conceptGenerationState === "failed" ? "TRY AGAIN" : "CREATE CONCEPT 01"}
                </button>
              )}
              <button type="button" className="workshop-floor-silver-control" onClick={() => selectBench(recommendedBench.id)}>
                GO TO {recommendedBench.label.toUpperCase()} BENCH
              </button>
            </div>
          </>
        )}
        {selectedBench && !prototypeBenchIsFocused && (
          <>
        {selectedBench.id === "validation" && (
          <div className="bench-guided-actions testing-guided-actions">
            {!discoveryAssessment.readyToAdvance ? (
              <button type="button" onClick={() => selectBench("engineering")}>GO TO ENGINEERING BENCH</button>
            ) : (
              <button type="button" onClick={() => document.getElementById("validation-check-question")?.focus()}>
                CHOOSE WHAT TO CHECK
              </button>
            )}
          </div>
        )}
          </>
        )}
        {selectedBench && (
          <>
          <RollingBenchFlow
            key={selectedBench.id}
            benchId={selectedBench.id}
            benchState={selectedBench.state}
            projectId={project.id}
            benchReason={selectedBench.reason}
            benchNextMove={selectedBench.nextMove}
            workingContext={{
              ...revWorkingUnderstanding.byBench[selectedBench.id],
              missingQuestion: selectedBench.id === "knowledge"
                ? discoveryAssessment.nextQuestion?.prompt ?? null
                : selectedBench.id === "engineering"
                  ? engineeringDefinitionAssessment.nextQuestion?.prompt ?? null
                  : revWorkingUnderstanding.byBench[selectedBench.id].missingQuestion,
            }}
            sourceEvidence={sourceEvidenceViews.map((evidence) => ({
              reference: evidence.reference,
              status: evidence.status,
              ...(evidence.record ? {
                displayName: evidence.record.displayName,
                width: evidence.record.width,
                height: evidence.record.height,
              } : {}),
              ...(evidence.objectUrl ? { objectUrl: evidence.objectUrl } : {}),
            }))}
            onWorkingNotesChange={() => setWorkingUnderstandingRevision((revision) => revision + 1)}
            externalNotes={selectedSpecialistBenchId ? rollingSpecialistNotes : undefined}
            onSaveExternal={selectedSpecialistBenchId ? recordRollingSpecialistAnswer : undefined}
            onSaveCanonical={selectedBench.id === "knowledge" || selectedBench.id === "engineering" ? recordRollingCanonicalAnswer : undefined}
            error={specialistContributionError}
            modelStorageStatus={<ConceptCandidateStorageStatusLine status={candidateStorageStatus} />}
            modelView={generatedConceptCandidate ? (
              <ConceptPreview preview={sharedConceptPreview} candidate={selectedBench.id === "prototype" ? viewedConceptCandidate : generatedConceptCandidate} candidateStale={generatedConceptCandidateIsStale} expanded selectedView={selectedBench.id === "prototype" ? selectedPrototypeConceptView : "iso"} />
            ) : undefined}
            modelReady={selectedBench.id === "knowledge" ? Boolean(generatedConceptCandidate) : Boolean(generatedConceptCandidate || hasEngineeringDesignBrief)}
            generatedModelReady={Boolean(generatedConceptCandidate && (candidateStorageStatus === "candidate-saved" || candidateStorageStatus === "candidate-restored"))}
            canCreateModel={false}
            modelUpdating={conceptGenerationState === "generating" || conceptRefinementState === "refining" || conceptViewState === "generating"}
            modelJustUpdated={(conceptViewState === "ready" || conceptRefinementState === "ready" || (conceptRefinementState === "idle" && conceptGenerationState === "ready")) && (candidateStorageStatus === "candidate-saved" || candidateStorageStatus === "candidate-restored")}
            modelActionKind={conceptViewState === "generating" || conceptViewState === "ready" || conceptViewState === "failed" ? "view" : conceptRefinementState === "refining" || conceptRefinementState === "ready" || conceptRefinementState === "failed" ? "refinement" : "generation"}
            modelPresentationKey={generatedConceptCandidate?.createdAt}
            modelError={conceptViewState === "failed"
              ? conceptViewMessage || "The requested view could not be created."
              : conceptRefinementState === "failed"
                ? conceptRefinementMessage || "Your design could not be updated. Try again."
              : conceptGenerationState === "failed" || conceptGenerationState === "unsupported" || conceptGenerationState === "not-configured"
                ? conceptGenerationMessage || "Your design could not be created. Try again."
                : undefined}
            currentRevision={generatedConceptCandidate?.revision ?? (selectedBench.id !== "knowledge" && hasEngineeringDesignBrief ? engineeringPreviewRevision : undefined)}
            modelRevisions={conceptCandidateHistory.map((candidate) => ({
              revision: candidate.revision,
              candidateId: candidate.candidateId,
              changeNote: candidate.inventorRefinement,
            }))}
            viewedRevision={viewedConceptCandidate?.revision}
            conceptLimitReached={conceptCandidateHistory.length >= MAX_RETAINED_CONCEPT_CANDIDATES}
            availableViews={viewedConceptAvailableViews}
            selectedView={selectedPrototypeConceptView}
            conceptGeometry={selectedBench.id === "prototype" ? viewedConceptCandidate?.conceptGeometry : undefined}
            prototypeRepresentation={prototypeRepresentation}
            modelPresentedOnWorkshopStage={selectedBench.id === "prototype"}
            refinementDraft={conceptRefinementDraft}
            onRefinementDraftChange={setConceptRefinementDraft}
            onCreateModel={conceptGenerationState === "failed" ? retryFirstRecognisableConcept : () => void createOrUpdateDesignModel()}
            onUpdateModel={generatedConceptCandidate ? refineCurrentConcept : updateInheritedEngineeringPreview}
            onViewRevision={setViewedConceptRevision}
            onBackToCurrent={() => setViewedConceptRevision(null)}
            onDeleteRevision={deleteHistoricalConceptRevision}
            onViewChange={setPrototypeConceptView}
            onPrototypeRepresentationChange={setPrototypeRepresentation}
            onGoToBench={selectBench}
            onBack={returnToWorkshop}
            testingOutcome={validationEvidence.outcome}
            onTestingOutcomeChange={(outcome) => saveValidationEvidence({ outcome })}
            onProgressChange={(answered, total) => {
              setBenchPresentationProgress((progress) => ({
                ...progress,
                [selectedBench.id]: answered >= total ? "green" : answered > 0 ? "yellow" : "red",
              }));
            }}
          />
          {conceptGenerationState === "ready" && conceptGenerationMessage && (
            <p className="first-concept-generation-status is-warning" role="status">{conceptGenerationMessage}</p>
          )}
          </>
        )}
        {showLegacyBenchPanels && selectedBench?.id === "validation" && (
          <div className="station-summary validation-summary">
            <p className="station-summary-label">Project Validation Status · Read only</p>
            <p>{discoveryAssessment.readyToAdvance ? "Discovery is complete. Choose something useful to test." : "We found something worth checking. Finish Discovery, then choose what you want to test."}</p>
            <div className="validation-summary-grid">
              <span>Plan: {project.validationPlan?.status ?? "not created"}</span>
              <span>Items: {project.validationPlan?.items.length ?? 0}</span>
              <span>Completed: {project.validationPlan?.items.filter((item) => item.status === "completed").length ?? 0}</span>
              <span>Evidence: {project.evidence.length}</span>
            </div>
            <button type="button" onClick={() => discoveryAssessment.readyToAdvance ? document.getElementById("validation-check-question")?.focus() : selectBench("knowledge")}>
              {discoveryAssessment.readyToAdvance ? "CHOOSE WHAT TO CHECK" : "GO TO DISCOVERY"}
            </button>
          </div>
        )}
        {showLegacyBenchPanels && selectedSpecialistBenchId && selectedSpecialistBenchId !== "patent" && (
          <section className="specialist-project-context" aria-label="Project summary">
            <div className="specialist-project-context-heading">
              <p className="station-summary-label">Project Summary</p>
              <span>Guide</span>
            </div>
            <p className="specialist-project-context-name">
              {specialistProjectContext.projectName}
            </p>
            <div className="specialist-project-context-grid">
              <section>
                <strong>{selectedSpecialistBenchId === "reality" ? "What We Know" : "Current Understanding"}</strong>
                <p>
                  {specialistProjectContext.currentUnderstanding ||
                    "No current Project understanding recorded."}
                </p>
              </section>
              <section>
                <strong>Constraints</strong>
                {specialistProjectContext.constraints.items.length > 0 ? (
                  <ul>
                    {specialistProjectContext.constraints.items.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No recorded current constraints.</p>
                )}
                {specialistContextLimitNote(specialistProjectContext.constraints) && (
                  <small>{specialistContextLimitNote(specialistProjectContext.constraints)}</small>
                )}
              </section>
              <section>
                <strong>{selectedSpecialistBenchId === "reality" ? "What Still Needs Checking" : "Biggest Unknown"}</strong>
                <p>
                  {specialistProjectContext.greatestRemainingUncertainty ||
                    "No greatest remaining uncertainty recorded."}
                </p>
              </section>
              <section>
                <strong>Project Evidence</strong>
                {specialistProjectContext.evidence.items.length > 0 ? (
                  <div className="specialist-project-context-records">
                    {specialistProjectContext.evidence.items.map((evidence) => (
                      <article key={evidence.evidenceId}>
                        <p>{evidence.summary}</p>
                        <small>Source / reference: {evidence.source}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <>
                    <p>No recorded Project evidence.</p>
                    {(selectedSpecialistBenchId === "marketing" || selectedSpecialistBenchId === "reality") && (
                      <button type="button" onClick={() => selectBench("validation")}>REVIEW VALIDATION</button>
                    )}
                  </>
                )}
                {specialistContextLimitNote(specialistProjectContext.evidence) && (
                  <small>{specialistContextLimitNote(specialistProjectContext.evidence)}</small>
                )}
              </section>
              <section>
                <strong>What We Have Learned</strong>
                {specialistProjectContext.conclusions.items.length > 0 ? (
                  <ul>
                    {specialistProjectContext.conclusions.items.map((conclusion) => (
                      <li key={conclusion.id}>{conclusion.conclusion}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p>No current findings have been saved.</p>
                    {(selectedSpecialistBenchId === "marketing" || selectedSpecialistBenchId === "reality") && (
                      <button type="button" onClick={() => document.getElementById("specialist-contribution")?.focus()}>
                        ADD WHAT YOU LEARNED
                      </button>
                    )}
                  </>
                )}
                {specialistContextLimitNote(specialistProjectContext.conclusions) && (
                  <small>{specialistContextLimitNote(specialistProjectContext.conclusions)}</small>
                )}
              </section>
              <section>
                <strong>{selectedSpecialistBenchId === "reality" ? "What Should We Do Next" : "Current Directions"}</strong>
                {specialistProjectContext.directions.items.length > 0 ? (
                  <ul>
                    {specialistProjectContext.directions.items.map((direction) => (
                      <li key={direction.id}>{direction.direction}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p>No current directions have been saved.</p>
                    {(selectedSpecialistBenchId === "marketing" || selectedSpecialistBenchId === "reality") && (
                      <button type="button" onClick={() => selectBench("engineering")}>GO TO ENGINEERING</button>
                    )}
                  </>
                )}
                {specialistContextLimitNote(specialistProjectContext.directions) && (
                  <small>{specialistContextLimitNote(specialistProjectContext.directions)}</small>
                )}
              </section>
              <section>
                <strong>Planned Engineering Actions</strong>
                {specialistProjectContext.actions.items.length > 0 ? (
                  <ul>
                    {specialistProjectContext.actions.items.map((action) => (
                      <li key={action.id}>{action.action}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p>No engineering actions have been planned.</p>
                    {(selectedSpecialistBenchId === "marketing" || selectedSpecialistBenchId === "reality") && (
                      <button type="button" onClick={() => selectBench("engineering")}>PLAN IN ENGINEERING</button>
                    )}
                  </>
                )}
                {specialistContextLimitNote(specialistProjectContext.actions) && (
                  <small>{specialistContextLimitNote(specialistProjectContext.actions)}</small>
                )}
              </section>
            </div>
          </section>
        )}
        {showLegacyBenchPanels && selectedSpecialistBenchId !== "patent" && specialistBenchGuidance && (
          <section className="specialist-inquiry" aria-label="Specialist Inquiry">
            <div className="specialist-inquiry-heading">
              <div>
              <p className="station-summary-label">Questions to explore</p>
                <strong>{specialistBenchGuidance.title}</strong>
              </div>
              <span>Guide</span>
            </div>
            <p className="specialist-inquiry-lens">
            <strong>Focus:</strong> {specialistBenchGuidance.lens}
            </p>
            <p>{specialistBenchGuidance.explanation}</p>
            <p className="specialist-inquiry-boundary">
              These questions are here to help you think. Nothing is added to the Project unless you choose to save it.
            </p>
            {currentSpecialistPrompt && (
              <div className="specialist-current-question">
                <span>Current question</span>
                <strong>{currentSpecialistPrompt}</strong>
              </div>
            )}
            <div className="specialist-inquiry-notes">
            <strong>What we already know</strong>
              <ul>
                {specialistBenchGuidance.structuralNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
        {showLegacyBenchPanels && selectedSpecialistBenchId && selectedSpecialistBenchId !== "patent" && (
          <div className="specialist-contribution-panel">
        <p className="station-summary-label">What did you learn here?</p>
            <p>
              Write down anything useful you learned while working on this bench.
            </p>
            <label className="specialist-answer-input">
              <span>Your answer</span>
            <textarea
              id="specialist-contribution"
              value={specialistContributionDrafts[selectedSpecialistBenchId] ?? ""}
              onChange={(event) => {
                setSpecialistContributionDrafts((drafts) => ({
                  ...drafts,
                  [selectedSpecialistBenchId]: event.target.value,
                }));
                if (specialistContributionError) setSpecialistContributionError("");
              }}
          placeholder="Write your answer in your own words."
              rows={4}
            />
            </label>
            {specialistContributionError && (
              <p className="specialist-contribution-error" role="alert">
                {specialistContributionError}
              </p>
            )}
            <button type="button" onClick={submitSpecialistContribution}>
              Save &amp; Continue
            </button>

            {selectedSpecialistContributions.length > 0 && (
              <div className="specialist-contribution-history">
            <strong>Earlier notes from this bench</strong>
                {selectedSpecialistContributions.map((event) => (
                  <article key={event.id}>
                    <p>{event.description}</p>
                    <time dateTime={event.createdAt}>{event.createdAt}</time>
                    <span>
                      {(() => {
                        const adoption = selectedSpecialistContributionTrace.find(
                          (candidate) => candidate.eventId === event.id
                        );
                        const count = adoption?.adoptedEvidenceIds.length ?? 0;
                        return count > 0
                          ? `Explicitly adopted as ${count} Project evidence item${count === 1 ? "" : "s"}.`
                          : "Not explicitly adopted as Project evidence.";
                      })()}
                    </span>
                  </article>
                ))}
              </div>
            )}

            {selectedSpecialistContributions.length > 0 && (
              <div className="specialist-evidence-adoption">
            <strong>Add as Project Evidence</strong>
                <p>
                  Save this as information we can use to judge how well the invention works.
                </p>
                <select
                  value={specialistEvidenceInputs[selectedSpecialistBenchId]?.eventId ?? ""}
                  onChange={(event) => {
                    setSpecialistEvidenceInputs((inputs) => ({
                      ...inputs,
                      [selectedSpecialistBenchId]: {
                        eventId: event.target.value,
                        summary: inputs[selectedSpecialistBenchId]?.summary ?? "",
                        source: inputs[selectedSpecialistBenchId]?.source ?? "",
                      },
                    }));
                    if (specialistEvidenceError) setSpecialistEvidenceError("");
                  }}
                >
              <option value="">Choose a specialist finding</option>
                  {selectedSpecialistContributions.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.description}
                    </option>
                  ))}
                </select>
                <textarea
                  value={specialistEvidenceInputs[selectedSpecialistBenchId]?.summary ?? ""}
                  onChange={(event) => {
                    setSpecialistEvidenceInputs((inputs) => ({
                      ...inputs,
                      [selectedSpecialistBenchId]: {
                        eventId: inputs[selectedSpecialistBenchId]?.eventId ?? "",
                        summary: event.target.value,
                        source: inputs[selectedSpecialistBenchId]?.source ?? "",
                      },
                    }));
                    if (specialistEvidenceError) setSpecialistEvidenceError("");
                  }}
                  placeholder="What did we learn?"
                  rows={3}
                />
                <input
                  value={specialistEvidenceInputs[selectedSpecialistBenchId]?.source ?? ""}
                  onChange={(event) => {
                    setSpecialistEvidenceInputs((inputs) => ({
                      ...inputs,
                      [selectedSpecialistBenchId]: {
                        eventId: inputs[selectedSpecialistBenchId]?.eventId ?? "",
                        summary: inputs[selectedSpecialistBenchId]?.summary ?? "",
                        source: event.target.value,
                      },
                    }));
                    if (specialistEvidenceError) setSpecialistEvidenceError("");
                  }}
              placeholder="Where this information came from"
                />
                {specialistEvidenceError && (
                  <p className="specialist-contribution-error" role="alert">
                    {specialistEvidenceError}
                  </p>
                )}
                <button type="button" onClick={submitSpecialistEvidence}>
                  Add as Project Evidence
                </button>
              </div>
            )}
          </div>
        )}
        {showLegacyBenchPanels && selectedBench?.id === "validation" && (
          <div className="concept-decision-panel">
            <div className="concept-decision-heading">
              <div>
                <span>REV · CHECK YOUR INVENTION</span>
            <strong>Let&apos;s check whether your invention works the way you expect.</strong>
              </div>
              <b>{validationEvidence.outcome === "pending" ? "EVIDENCE PENDING" : validationEvidence.outcome.toUpperCase()}</b>
            </div>
            <p className="concept-decision-intro">
              Use what you tested and saw to decide whether your invention worked as expected.
            </p>
            <div className="concept-refinement-grid">
              <section>
              <span>1. WHAT ARE WE CHECKING?</span>
              <textarea id="validation-check-question" value={validationEvidence.question} onChange={(event) => saveValidationEvidence({ question: event.target.value })} placeholder="What part of your invention do you want to test?" rows={3} />
              </section>
              <section>
              <span>2. WHAT DID YOU DO?</span>
              <textarea value={validationEvidence.evidence} onChange={(event) => saveValidationEvidence({ evidence: event.target.value })} placeholder="Tell REV what you tested, measured, or looked at." rows={3} />
              </section>
            </div>
            <label className="concept-decision-note">
              <span>3. WHAT HAPPENED?</span>
              <textarea value={validationEvidence.observed} onChange={(event) => saveValidationEvidence({ observed: event.target.value })} placeholder="Tell REV what you saw or measured." rows={4} />
            </label>
            <p className="concept-decision-step">4. WHAT DOES THAT TELL US ABOUT YOUR INVENTION?</p>
            <div className="concept-decision-actions">
              <button type="button" className={validationEvidence.outcome === "supported" ? "is-selected" : ""} onClick={() => saveValidationEvidence({ outcome: "supported" })}>It worked</button>
              <button type="button" className={validationEvidence.outcome === "inconclusive" ? "is-selected" : ""} onClick={() => saveValidationEvidence({ outcome: "inconclusive" })}>Still unsure</button>
              <button type="button" className={validationEvidence.outcome === "not-supported" ? "is-selected" : ""} onClick={() => saveValidationEvidence({ outcome: "not-supported" })}>It didn&apos;t work</button>
            </div>
            <div className={`concept-decision-status decision-${validationEvidence.outcome}`}>
              {validationEvidence.outcome === "pending" && "Choose the answer that best matches what happened."}
              {validationEvidence.outcome === "supported" && "What happened supports the idea so far. Decide what to check next."}
              {validationEvidence.outcome === "inconclusive" && "The result is not clear yet. Choose another useful check."}
              {validationEvidence.outcome === "not-supported" && "The result did not support the idea. Take what you learned back to Engineering."}
            </div>
          </div>
        )}
        {showLegacyBenchPanels && selectedBench?.id === "prototype" && (
          <StandardBenchShell
            benchId={selectedBench.id}
            benchTitle={selectedBench.label}
            benchState={selectedBench.state}
            reason={selectedBench.reason}
            nextMove={selectedBench.nextMove}
            conceptPreview={compactConceptPreview}
            onBackToWorkshop={returnToWorkshop}
            askRevState="unavailable"
            thisBenchLedger={
              <div className="prototype-ledger-view">
                <p className="prototype-ledger-boundary">Models saved in this browser</p>
                <dl>
                  <div><dt>Concept study started</dt><dd>{conceptCreated ? "Yes" : "No"}</dd></div>
                  <div><dt>Concept 01 model</dt><dd>{conceptGenerated ? "Available" : "Not available"}</dd></div>
                  <div><dt>Concept 02 model</dt><dd>{refinedConceptGenerated ? "Available" : "Not available"}</dd></div>
                  <div><dt>Concept 03 model</dt><dd>{thirdConceptGenerated ? "Available" : "Not available"}</dd></div>
                  <div>
                    <dt>Latest local study stage</dt>
                    <dd>
                      {thirdConceptGenerated
                        ? "Concept 03 model"
                        : refinedConceptGenerated
                          ? "Concept 02 model"
                          : conceptGenerated
                            ? "Concept 01 model"
                            : conceptVisualised
                              ? "Visual brief prepared"
                              : conceptCreated
                                ? "Concept Sheet prepared"
                                : "Not started"}
                    </dd>
                  </div>
                </dl>
                <p className="prototype-ledger-boundary">Decisions saved in the Project</p>
                <section>
                  <strong>Active concept review</strong>
                  <p>{workshop.trace.activeConceptReview?.outcome ?? "No concept review has been saved."}</p>
                  {workshop.trace.activeConceptReview && (
                    <small>
                      {workshop.trace.activeConceptReview.supportingEvidence.length > 0
                        ? `${workshop.trace.activeConceptReview.supportingEvidence.length} supporting evidence item${workshop.trace.activeConceptReview.supportingEvidence.length === 1 ? "" : "s"} explicitly selected.`
                        : "No supporting evidence explicitly selected."}
                    </small>
                  )}
                </section>
                <section>
                  <strong>Active concept direction</strong>
                  <p>{workshop.trace.activeConceptDirection?.outcome ?? "No concept direction has been saved."}</p>
                  {workshop.trace.activeConceptDirection && (
                    <small>
                      {workshop.trace.activeConceptDirection.supportingEvidence.length > 0
                        ? `${workshop.trace.activeConceptDirection.supportingEvidence.length} supporting evidence item${workshop.trace.activeConceptDirection.supportingEvidence.length === 1 ? "" : "s"} explicitly selected.`
                        : "No supporting evidence explicitly selected."}
                    </small>
                  )}
                </section>
              </div>
            }
            projectLedger={
              <div className="prototype-ledger-view">
                <strong className="prototype-ledger-project-name">{project.projectName}</strong>
                <section>
                  <strong>Current Understanding</strong>
                  <p>{project.engineeringState.currentUnderstanding || "No current Project understanding recorded."}</p>
                </section>
                <section>
                  <strong>Greatest Remaining Uncertainty</strong>
                  <p>{project.engineeringState.greatestRemainingUncertainty || "No greatest remaining uncertainty recorded."}</p>
                </section>
                <dl className="prototype-ledger-counts">
                  <div><dt>Known Limits</dt><dd>{project.engineeringState.currentConstraints.length}</dd></div>
                  <div><dt>Project Evidence</dt><dd>{workshop.trace.projectEvidence.length}</dd></div>
                  <div><dt>Current Conclusions</dt><dd>{workshop.trace.currentEngineeringConclusions.length}</dd></div>
                  <div><dt>Current Directions</dt><dd>{workshop.trace.currentEngineeringDirections.length}</dd></div>
                  <div><dt>Planned Actions</dt><dd>{workshop.trace.adoptedEngineeringActions.length}</dd></div>
                </dl>
                <section>
                  <strong>Test Plan</strong>
                  <p>{project.validationPlan?.status ?? "No test plan has been created."}</p>
                </section>
              </div>
            }
          >
          <div className="concept-readout">
            <div className="concept-sheet-heading">
              <div>
              <span>PROTOTYPE BENCH · BUILD YOUR IDEA</span>
                <strong>{projectName}</strong>
              </div>
              <b>CONCEPT SHEET</b>
            </div>
              <p className="concept-persistence-note">This early working model is saved in this browser. It can change and has not been proven yet.</p>
              <p className="concept-persistence-note">Keep developing the same idea you started with. Each new concept is another version, not a separate idea.</p>

            <section className="first-concept-foundation" aria-label="First recognisable concept foundation">
              <div className="first-concept-mode-heading">
                <div>
                  <span>REV SUGGESTS</span>
                  <strong>{visualModeLabel(selectedVisualMode).toUpperCase()}</strong>
                </div>
                <b>{confirmedVisualMode ? "TYPE CONFIRMED" : `${visualModeSuggestion.confidence.toUpperCase()} MATCH`}</b>
              </div>
              <p className="first-concept-mode-reason">{visualModeSuggestion.reason}</p>
              {visualModeSuggestion.supportingSignals.length > 0 && (
                <p className="first-concept-signals">
                  Supporting signals: {visualModeSuggestion.supportingSignals.join(" · ")}
                </p>
              )}
              <div className="first-concept-mode-actions">
                <button type="button" onClick={confirmVisualMode}>
                  USE {selectedVisualMode.toUpperCase()}
                </button>
                <button
                  type="button"
                  className="first-concept-secondary-action"
                  onClick={() => setVisualModeCorrectionOpen((open) => !open)}
                >
                  CHANGE TYPE
                </button>
              </div>
              {visualModeCorrectionOpen && (
                <label className="first-concept-mode-select">
                  <span>Choose the kind of picture that best fits this idea</span>
                  <select
                    value={selectedVisualMode}
                    onChange={(event) => changeVisualMode(event.target.value as IdeaVisualMode)}
                  >
                    {IDEA_VISUAL_MODES.map((mode) => (
                      <option key={mode} value={mode}>{visualModeLabel(mode)}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="first-concept-brief-heading">
                <div>
                <span>REV · FIRST MODEL BRIEF</span>
                <strong>What REV will use for Concept 01</strong>
                </div>
              <b>EARLY WORKING MODEL · NOT PROVEN YET</b>
              </div>
              <div className="first-concept-brief-grid">
                <section><span>VISUAL MODE</span><p>{visualModeLabel(confirmedVisualMode ?? selectedVisualMode)}</p></section>
                <section><span>ORIGINAL IDEA</span><p>{conceptGenerationFoundation.brief.originalIdea}</p></section>
                <section><span>PROBLEM</span><p>{conceptGenerationFoundation.brief.problemContext}</p></section>
                {conceptGenerationFoundation.brief.proposedSolution && <section><span>PROPOSED SOLUTION</span><p>{conceptGenerationFoundation.brief.proposedSolution}</p></section>}
                {conceptGenerationFoundation.brief.operatingConcept && <section><span>HOW IT WORKS</span><p>{conceptGenerationFoundation.brief.operatingConcept}</p></section>}
                {conceptGenerationFoundation.brief.functionalElements && <section><span>MAIN ELEMENTS</span><p>{conceptGenerationFoundation.brief.functionalElements}</p></section>}
                {conceptGenerationFoundation.brief.inputsOutputs && <section><span>INPUTS / OUTPUTS</span><p>{conceptGenerationFoundation.brief.inputsOutputs}</p></section>}
                {conceptGenerationFoundation.brief.relationshipsFlow && <section><span>RELATIONSHIPS</span><p>{conceptGenerationFoundation.brief.relationshipsFlow}</p></section>}
                {conceptGenerationFoundation.brief.userInteraction && <section><span>INTERACTION</span><p>{conceptGenerationFoundation.brief.userInteraction}</p></section>}
                {conceptGenerationFoundation.brief.arrangement && <section><span>ARRANGEMENT</span><p>{conceptGenerationFoundation.brief.arrangement}</p></section>}
                {conceptGenerationFoundation.brief.constraints.length > 0 && (
                  <section><span>CONSTRAINTS</span><ul>{conceptGenerationFoundation.brief.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></section>
                )}
                {conceptGenerationFoundation.brief.technicalUncertainty && <section><span>TECHNICAL UNCERTAINTY</span><p>{conceptGenerationFoundation.brief.technicalUncertainty}</p></section>}
              </div>
              <details className="first-concept-trace">
                <summary>See where this came from · {conceptGenerationFoundation.sourceEventIds.length} saved item{conceptGenerationFoundation.sourceEventIds.length === 1 ? "" : "s"}</summary>
                <ul>
                  {conceptGenerationFoundation.sourceTrace.map((source) => (
                    <li key={`${source.field}-${source.sourceKind}-${source.sourceId}`}>
                      <strong>{source.field}</strong> · {source.sourceKind} · <code>{source.sourceId}</code>
                    </li>
                  ))}
                </ul>
              </details>
              <div className={`first-concept-readiness${conceptGenerationFoundation.generationReady ? " is-ready" : ""}`}>
                <div>
              <span>READY TO CREATE</span>
                  <strong>{conceptGenerationFoundation.generationReady ? "READY TO CREATE CONCEPT 01" : "MORE DETAILS NEEDED"}</strong>
                  <small>
                    {conceptGenerationFoundation.generationReady
                      ? "reAIdea has enough detail to prepare the first working model."
                      : `Still needed: ${conceptGenerationFoundation.missingRequiredFields.map(missingConceptDetailLabel).join(", ")}.`}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => void generateFirstRecognisableConcept()}
                  disabled={Boolean(generatedConceptCandidate) || !conceptGenerationFoundation.generationReady || conceptGenerationState === "generating" || conceptGenerationFoundation.request?.visualMode !== "product" || conceptGenerationFoundation.request?.outputType !== "image"}
                >
                  {generatedConceptCandidate
                    ? "CURRENT MODEL EXISTS"
                    : conceptGenerationState === "generating"
                    ? "REV IS FORMING CONCEPT 01..."
                    : conceptGenerationState === "failed"
                      ? "RETRY CONCEPT 01"
                    : conceptGenerationFoundation.generationReady && (conceptGenerationFoundation.request?.visualMode !== "product" || conceptGenerationFoundation.request?.outputType !== "image")
                      ? "VISUAL GENERATION FOR THIS MODE IS COMING NEXT"
                      : "Create Concept 01"}
                </button>
              </div>
              {conceptGenerationState === "generating" && (
                <GenerationProgress kind="generation" status="working" />
              )}
              {conceptGenerationState === "ready" && (
                <GenerationProgress kind="generation" status="ready" />
              )}
              {conceptGenerationState === "not-configured" && (
              <p className="first-concept-generation-status is-warning">MODEL CREATION IS NOT AVAILABLE</p>
              )}
              {(conceptGenerationState === "failed" || conceptGenerationState === "unsupported") && (
                conceptGenerationState === "failed" ? <GenerationProgress kind="generation" status="failed" onRetry={retryFirstRecognisableConcept} /> : <p className="first-concept-generation-status is-error">{conceptGenerationMessage}</p>
              )}
              {conceptGenerationFoundation.request && (
                <p className="first-concept-identity">
                  Concept family <code>{conceptGenerationFoundation.request.conceptFamilyId}</code> · revision {conceptGenerationFoundation.request.revision} · output {conceptGenerationFoundation.request.outputType}
                </p>
              )}
            </section>

            {generatedConceptCandidate?.output.type === "image" && generatedConceptCandidate.output.dataUrl && (
              <section className="generated-concept-candidate" aria-label={`Engineering Concept Model ${String(generatedConceptCandidate.revision).padStart(2, "0")}`}>
                <div className="generated-concept-candidate-heading">
                  <div><span>REV · ENGINEERING CONCEPT MODEL</span><strong>CONCEPT {String(generatedConceptCandidate.revision).padStart(2, "0")}</strong></div>
                  <b>{generatedConceptCandidateIsStale ? "CURRENT MODEL · UPDATE AVAILABLE" : generatedConceptCandidate.representationStyle.replaceAll("-", " ")}</b>
                </div>
                <div className="generated-concept-model-viewport">
                  <i className="generated-concept-grid" aria-hidden="true" />
                  <Image
                    src={generatedConceptCandidate.output.dataUrl}
                    alt={generatedConceptCandidate.output.altText}
                    width={1024}
                    height={1024}
                    unoptimized
                  />
                  <span className="generated-concept-axis" aria-hidden="true">Z ↑<br />Y ↙ · X ↘</span>
                </div>
                <p>{generatedConceptCandidate.disclaimer}</p>
                <p className="generated-concept-candidate-note">This early model shows what reAIdea currently understands. It may change, has not been proven, and is not a finished product.</p>
                {generatedConceptCandidateIsStale && <p className="generated-concept-update-note">NEW INFORMATION SAVED · Your current model is unchanged. Choose to update it when you are ready.</p>}
                <small>Candidate <code>{generatedConceptCandidate.candidateId}</code> · family <code>{generatedConceptCandidate.conceptFamilyId}</code> · revision {generatedConceptCandidate.revision}</small>
                <small>This is the next view of the same idea you have been developing.</small>
                <small>This model is saved in this browser and may be removed if browser data is cleared.</small>
                <div className="concept-refinement-actions">
                  <button type="button" onClick={() => setConceptRefinementOpen((open) => !open)}>REFINE MODEL</button>
                  {conceptCandidateHistory.length > 1 && (
                    <button type="button" onClick={() => setViewedConceptRevision((revision) => revision === previousConceptCandidate?.revision ? null : previousConceptCandidate?.revision ?? null)}>
                      {viewedConceptRevision === previousConceptCandidate?.revision ? "HIDE PREVIOUS" : "VIEW PREVIOUS"}
                    </button>
                  )}
                </div>
                {conceptRefinementState === "refining" && (
                  <GenerationProgress kind="refinement" status="working" />
                )}
                {conceptRefinementState === "ready" && (
                  <GenerationProgress kind="refinement" status="ready" />
                )}
                {conceptRefinementOpen && (
                  <div className="concept-refinement-panel">
                    <label>
                    <span>What would you like to change?</span>
                      <textarea
                        value={conceptRefinementDraft}
                        onChange={(event) => setConceptRefinementDraft(event.target.value)}
                        maxLength={1200}
                        rows={4}
                        placeholder="Describe what doesn't look right yet..."
                      />
                    </label>
                    <small>This creates a new version of the same idea. It does not mark the model as approved.</small>
                    <button
                      type="button"
                      onClick={refineCurrentConcept}
                      disabled={!conceptRefinementDraft.trim() || conceptRefinementState === "refining"}
                    >
                      {conceptRefinementState === "refining" ? "REV IS UPDATING THE MODEL..." : "UPDATE MODEL"}
                    </button>
                    {conceptRefinementState === "failed" && (
                      <GenerationProgress kind="refinement" status="failed" onRetry={() => void refineCurrentConcept()} />
                    )}
                  </div>
                )}
                {viewedConceptRevision === previousConceptCandidate?.revision && previousConceptCandidate?.output.type === "image" && previousConceptCandidate.output.dataUrl && (
                  <div className="previous-concept-model">
                    <span>PREVIOUS · CONCEPT {String(previousConceptCandidate.revision).padStart(2, "0")}</span>
                    <Image
                      src={previousConceptCandidate.output.dataUrl}
                      alt={previousConceptCandidate.output.altText}
                      width={1024}
                      height={1024}
                      unoptimized
                    />
                  </div>
                )}
              </section>
            )}

            {!generatedConceptCandidate && <div className="concept-visual-actions">
              <button type="button" className="concept-visualise-button" onClick={visualiseConcept}>
                {conceptVisualised ? "WORKING MODEL STARTED" : "Create Working Model"}
              </button>
              <span>{conceptVisualised ? "An early model has been prepared from what you shared." : "Create an early picture of the idea. It will not be a finished or approved design."}</span>
            </div>}
            {conceptVisualised && !generatedConceptCandidate && (
              <div className="concept-visual-board" aria-label="Concept 01 visual study">
                <div className="visual-board-grid" aria-hidden="true" />
                <div className="visual-board-label">CONCEPT 01 · EARLY WORKING MODEL</div>
                <div className="visual-object">
                  <i className="visual-object-top" />
                  <i className="visual-object-core" />
                  <i className="visual-object-leg visual-object-leg-left" />
                  <i className="visual-object-leg visual-object-leg-right" />
                  <span className="visual-callout visual-callout-purpose">PURPOSE</span>
                  <span className="visual-callout visual-callout-constraint">CONSTRAINT</span>
                  <span className="visual-callout visual-callout-unknown">UNKNOWN</span>
                </div>
                <div className="visual-board-footer">EARLY WORKING MODEL · IT CAN CHANGE AND HAS NOT BEEN PROVEN YET</div>
              </div>
            )}

            {conceptVisualised && !generatedConceptCandidate && (
              <div className="visual-concept-brief">
                <div className="visual-concept-brief-heading">
                  <div>
                    <span>REV · VISUAL CONCEPT BRIEF</span>
                    <strong>{visualConceptBrief.title}</strong>
                  </div>
                  <b>WHAT REV UNDERSTANDS</b>
                </div>

                <p className="visual-concept-brief-intro">
                  {visualConceptBrief.hasEngineeringDefinition
                    ? "Use what you have shared about the idea and problem to prepare the first picture."
                    : "Translate the current Project engineering state into a first-pass visual. This brief is the controlled handoff between REV reasoning and future visual generation."}
                </p>

                {visualConceptBrief.hasEngineeringDefinition && (
                  <p className="concept-persistence-note">
                    This is how you have explained the idea so far. It can change and has not been proven yet.
                  </p>
                )}

                <div className="visual-concept-brief-grid">
                  <section>
                    <span>{visualConceptBrief.hasEngineeringDefinition ? "PROBLEM / PURPOSE" : "PURPOSE"}</span>
                    <p>{visualConceptBrief.purpose}</p>
                  </section>

                  {visualConceptBrief.hasEngineeringDefinition ? (
                    <>
                      {visualConceptBrief.proposedSolution && <section><span>INVENTOR-DEFINED SOLUTION</span><p>{visualConceptBrief.proposedSolution}</p></section>}
                      {visualConceptBrief.howItWorks && <section><span>HOW IT WORKS</span><p>{visualConceptBrief.howItWorks}</p></section>}
                      {visualConceptBrief.mainElements && <section><span>MAIN ELEMENTS / STAGES</span><p>{visualConceptBrief.mainElements}</p></section>}
                      {visualConceptBrief.inputsOutputs && <section><span>INPUTS / OUTPUTS</span><p>{visualConceptBrief.inputsOutputs}</p></section>}
                      {visualConceptBrief.relationshipsFlow && <section><span>RELATIONSHIPS / FLOW</span><p>{visualConceptBrief.relationshipsFlow}</p></section>}
                      {visualConceptBrief.userInteraction && <section><span>USER INTERACTION</span><p>{visualConceptBrief.userInteraction}</p></section>}
                      {visualConceptBrief.arrangement && <section><span>ARRANGEMENT</span><p>{visualConceptBrief.arrangement}</p></section>}
                    </>
                  ) : (
                    <section>
                      <span>OPERATING PRINCIPLE</span>
                      <p>{visualConceptBrief.principle}</p>
                    </section>
                  )}

                  <section>
                    <span>IMPORTANT LIMITS</span>
                    <ul>
                      {visualConceptBrief.constraints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  {visualConceptBrief.hasEngineeringDefinition && visualConceptBrief.constraintSafetyResponse && (
                    <section>
                      <span>INVENTOR CONSTRAINT / SAFETY RESPONSE</span>
                      <p>{visualConceptBrief.constraintSafetyResponse}</p>
                    </section>
                  )}

                  <section>
                    <span>ASSUMPTIONS</span>
                    <ul>
                      {visualConceptBrief.assumptions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="visual-concept-brief-warning">
                    <span>WHAT WE STILL NEED TO KNOW</span>
                    <ul>
                      {visualConceptBrief.unknowns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => selectBench("engineering")}>OPEN ENGINEERING</button>
                  </section>

                  {visualConceptBrief.hasEngineeringDefinition && visualConceptBrief.technicalUncertainty && (
                    <section className="visual-concept-brief-warning">
                      <span>WHAT YOU&apos;RE STILL UNSURE ABOUT</span>
                      <p>{visualConceptBrief.technicalUncertainty}</p>
                      <button type="button" onClick={() => selectBench("engineering")}>WORK ON THIS IN ENGINEERING</button>
                    </section>
                  )}

                  <section className="visual-concept-brief-next">
                    <span>NEXT STEP</span>
                    <p>{visualConceptBrief.nextMove}</p>
                    <button type="button" onClick={() => selectBench("engineering")}>OPEN ENGINEERING BENCH</button>
                  </section>
                </div>

                <div className="visual-concept-brief-footer">
                  REV · STRUCTURED VISUAL INPUT · NOT A CAD MODEL
                </div>

                <div className="concept-generation-action">
                  <div>
                    <span>REV · CONCEPT GENERATION</span>
                    <strong>{conceptGenerated ? "EARLY WORKING MODEL AVAILABLE" : "Create the first working model from this brief."}</strong>
                    <small>{conceptGenerated ? "Saved in this browser. It can change and has not been proven yet." : "Creates an early picture of the idea, not a finished or approved design."}</small>
                  </div>
                  <button type="button" onClick={generateConcept}>
                    {conceptGenerated ? "Working Model Available" : "Create Working Model"}
                  </button>
                </div>

                {conceptGenerated && generatedConceptDataUri && (
                  <div className="generated-concept-board generated-concept-board-real" aria-label="Procedural Concept 01 study">
                    <img
                      className="generated-concept-image"
                      src={generatedConceptDataUri}
                      alt={`Early working model for ${projectName}`}
                    />
                    <div className="generated-concept-meta">
                      <span>CREATED FROM CURRENT VISUAL BRIEF</span>
                  <b>EARLY WORKING MODEL · NOT PROVEN YET</b>
                    </div>
                  </div>
                )}

                {conceptGenerated && (
                  <div className="concept-review-panel">
                    <div className="concept-review-heading">
                      <div>
                        <span>REV · CONCEPT REVIEW</span>
                  <strong>Review the first model</strong>
                      </div>
                      <b>{conceptReview === "unreviewed" ? "AWAITING REVIEW" : conceptReview.toUpperCase()}</b>
                    </div>

                    <p className="concept-review-intro">
                      The render is a hypothesis, not a conclusion. Record the inventor&apos;s judgement before the next refinement.
                    </p>

                    {renderSupportingEvidenceSelector()}

                    <div className="concept-review-actions">
                  <button type="button" className={conceptReview === "accepted" ? "is-selected" : ""} onClick={() => reviewConcept("accepted")}>Looks Right</button>
                  <button type="button" className={conceptReview === "refine" ? "is-selected" : ""} onClick={() => reviewConcept("refine")}>Needs Changes</button>
                  <button type="button" className={conceptReview === "rethink" ? "is-selected" : ""} onClick={() => reviewConcept("rethink")}>Try a Different Direction</button>
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
                  <span>REV · CHANGES TO MAKE</span>
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
                              <span>NEXT STEP</span>
                              <p>{refinementDirective.nextMove}</p>
                              <button type="button" onClick={() => selectBench("engineering")}>OPEN ENGINEERING BENCH</button>
                            </section>
                          </div>

                          <button type="button" className="concept-refinement-button" onClick={generateRefinedConcept}>
                            {refinedConceptGenerated ? "CONCEPT 02 STUDY AVAILABLE" : "CREATE CONCEPT 02 PROCEDURAL STUDY"}
                          </button>
                        </div>

                        {refinedConceptGenerated && refinedConceptDataUri && (
                          <div className="generated-concept-board generated-concept-board-real concept-two-board" aria-label="Procedural Concept 02 refinement study">
                            <img
                              className="generated-concept-image"
                              src={refinedConceptDataUri}
                              alt={`Procedural Concept 02 study for ${projectName}`}
                            />
                            <div className="generated-concept-meta">
                    <span>UPDATED FROM YOUR REVIEW</span>
                    <b>CONCEPT 02 · EARLY WORKING MODEL · NOT PROVEN YET</b>
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
                            {renderSupportingEvidenceSelector()}
                            <div className="concept-decision-actions">
                  <button type="button" className={conceptDecision === "accept" ? "is-selected" : ""} onClick={() => decideConcept("accept")}>Ready to Test</button>
                              <button type="button" className={conceptDecision === "refine" ? "is-selected" : ""} onClick={() => decideConcept("refine")}>REFINE AGAIN</button>
                  <button type="button" className={conceptDecision === "rethink" ? "is-selected" : ""} onClick={() => decideConcept("rethink")}>Try a Different Direction</button>
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
                                {thirdConceptGenerated ? "CONCEPT 03 STUDY AVAILABLE" : "CREATE CONCEPT 03 PROCEDURAL STUDY"}
                              </button>
                            )}

                            {conceptDecision === "rethink" && (
                              <div className="concept-decision-handoff">
                                <span>REV · ENGINEERING HANDOFF</span>
                  <p>Your earlier concepts are saved. Return to Engineering to think through a different direction.</p>
                              </div>
                            )}

                            {conceptDecision === "accept" && (
                              <div className="concept-decision-handoff">
                                <span>REV · VALIDATION HANDOFF</span>
                  <p>Concept 02 is ready to test. Your earlier concepts and review notes are still saved.</p>
                              </div>
                            )}

                            {thirdConceptGenerated && thirdConceptDataUri && (
                              <div className="generated-concept-board generated-concept-board-real concept-three-board" aria-label="Procedural Concept 03 refinement study">
                                <img
                                  className="generated-concept-image"
                                  src={thirdConceptDataUri}
                                  alt={`Procedural Concept 03 study for ${projectName}`}
                                />
                                <div className="generated-concept-meta">
                    <span>UPDATED FROM YOUR SECOND REVIEW</span>
                    <b>CONCEPT 03 · EARLY WORKING MODEL · NOT PROVEN YET</b>
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
                  <span>{conceptSheet.hasEngineeringDefinition ? "PROBLEM / PURPOSE" : "PURPOSE"}</span>
                  <p>{conceptSheet.purpose}</p>
                </section>
                {conceptSheet.hasEngineeringDefinition ? (
                  <>
                    <section className="concept-sheet-card concept-sheet-wide">
                <span>YOUR CURRENT IDEA</span>
                <p>This is how you have explained the idea so far. It can change and has not been proven yet.</p>
                    </section>
                    {conceptSheet.proposedSolution && <section className="concept-sheet-card concept-sheet-wide"><span>INVENTOR-DEFINED SOLUTION</span><p>{conceptSheet.proposedSolution}</p></section>}
                    {conceptSheet.howItWorks && <section className="concept-sheet-card concept-sheet-wide"><span>HOW IT WORKS</span><p>{conceptSheet.howItWorks}</p></section>}
                    {conceptSheet.mainElements && <section className="concept-sheet-card"><span>MAIN ELEMENTS / STAGES</span><p>{conceptSheet.mainElements}</p></section>}
                    {conceptSheet.inputsOutputs && <section className="concept-sheet-card"><span>INPUTS / OUTPUTS</span><p>{conceptSheet.inputsOutputs}</p></section>}
                    {conceptSheet.relationshipsFlow && <section className="concept-sheet-card"><span>RELATIONSHIPS / FLOW</span><p>{conceptSheet.relationshipsFlow}</p></section>}
                    {conceptSheet.userInteraction && <section className="concept-sheet-card"><span>USER INTERACTION</span><p>{conceptSheet.userInteraction}</p></section>}
                    {conceptSheet.arrangement && <section className="concept-sheet-card"><span>ARRANGEMENT</span><p>{conceptSheet.arrangement}</p></section>}
                  </>
                ) : (
                  <section className="concept-sheet-card concept-sheet-wide">
                    <span>HOW IT COULD WORK</span>
                    <p>{conceptSheet.operatingPrinciple}</p>
                  </section>
                )}
                <section className="concept-sheet-card">
                  <span>{conceptSheet.hasEngineeringDefinition ? "KNOWN LIMITS" : "IMPORTANT LIMITS"}</span>
                  <ul>{conceptSheet.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                {conceptSheet.hasEngineeringDefinition && conceptSheet.constraintSafetyResponse && (
                  <section className="concept-sheet-card">
                    <span>INVENTOR CONSTRAINT / SAFETY RESPONSE</span>
                    <p>{conceptSheet.constraintSafetyResponse}</p>
                  </section>
                )}
                <section className="concept-sheet-card">
                  <span>ASSUMPTIONS</span>
                  <ul>{conceptSheet.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card concept-sheet-alert">
                  <span>WHAT WE STILL NEED TO KNOW</span>
                  <ul>{conceptSheet.unresolvedQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
                  <button type="button" onClick={() => selectBench("engineering")}>OPEN ENGINEERING</button>
                </section>
                {conceptSheet.hasEngineeringDefinition && conceptSheet.technicalUncertainty && (
                  <section className="concept-sheet-card concept-sheet-alert">
                    <span>WHAT YOU&apos;RE STILL UNSURE ABOUT</span>
                    <p>{conceptSheet.technicalUncertainty}</p>
                    <button type="button" onClick={() => selectBench("engineering")}>WORK ON THIS IN ENGINEERING</button>
                  </section>
                )}
                <section className="concept-sheet-card concept-sheet-next">
                  <span>NEXT STEP</span>
                  <p>{conceptSheet.nextEngineeringMove}</p>
                  <small>{conceptSheet.evidenceCount} evidence item{conceptSheet.evidenceCount === 1 ? "" : "s"} currently attached to the Project.</small>
                  <button type="button" onClick={() => selectBench("engineering")}>OPEN ENGINEERING BENCH</button>
                </section>
              </div>
            )}
          </div>
          </StandardBenchShell>
        )}
        {showLegacyBenchPanels && selectedBench && selectedBench.id !== "prototype" && (
          <div className="active-workspace-navigation">
            <button type="button" onClick={returnToWorkshop}>← Back to Workshop</button>
            <span>{selectedBench.label} · Selected bench</span>
            <button type="button" disabled>ASK REV · COMING LATER</button>
          </div>
        )}
      </div>
      </WorkshopRoom>
        </>
      )}

      <style jsx global>{`
        .living-workshop {
          box-sizing: border-box;
          width: min(1672px, 100%);
          max-width: 1672px;
          margin: 28px auto 0;
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

        .workshop-brief {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.42fr);
          gap: 14px;
          max-width: 1360px;
          margin: 0 auto 10px;
          padding: 12px 16px;
          border: 1px solid #3f7080;
          border-radius: 12px;
          background: linear-gradient(110deg, #0d202a, #0a151e);
        }

        .workshop-brief h3 {
          margin: 0;
          color: #f0fbfd;
          font-size: 17px;
        }

        .workshop-brief-partner {
          margin: 0 0 5px;
          color: #9bbac2;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .workshop-brief-reason {
          max-width: 760px;
          margin: 5px 0 0;
          color: #c9dbe0;
          font-size: 12px;
          line-height: 1.45;
        }

        .workshop-brief-reason strong {
          color: #70dfed;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .workshop-brief-move {
          display: grid;
          gap: 4px;
          margin-top: 7px;
          color: #a7c2c9;
          font-size: 12px;
        }

        .workshop-brief-move span,
        .workshop-brief-action p {
          margin: 0;
          color: #70dfed;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .workshop-brief-move strong {
          color: #edf8fa;
          line-height: 1.4;
        }

        .workshop-brief-action {
          display: grid;
          align-content: center;
          gap: 5px;
          padding-left: 14px;
          border-left: 1px solid #315463;
        }

        .workshop-brief-action > strong {
          color: #f4fbfc;
          font-size: 16px;
        }

        .workshop-brief-informational {
          color: #e5bd7b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .workshop-brief-action button {
          width: fit-content;
          margin-top: 2px;
          padding: 10px 12px;
          border: 1px solid #48d9ed;
          border-radius: 7px;
          background: #123844;
          color: #e9fcff;
          font: inherit;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        .workshop-brief-action button:hover {
          background: #185161;
        }

        .workshop-brief-action small {
          color: #91adb5;
          line-height: 1.35;
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

        .workshop-flow .is-recommended b {
          color: #79edbc;
        }

        .workshop-flow .is-recommended::before {
          content: "REV NEXT";
          margin-right: 2px;
          color: #79edbc;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.08em;
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
          min-height: 870px;
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

        .shared-design-screen.has-current-design { box-shadow: inset 0 0 11px rgba(88, 226, 240, .24), 0 0 6px rgba(88, 226, 240, .2); }
        .shared-design-screen > i { position:absolute; inset:3px 24%; display:block; }
        .mini-current-design { border:1px solid #7cdde6; transform:skewX(-12deg); background:rgba(75,188,202,.18); }
        .mini-stop-go-design::before { content:""; position:absolute; left:50%; top:0; width:11px; height:11px; transform:translateX(-50%); clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%); border:1px solid #8eeef1; background:#6d2027; }
        .mini-stop-go-design::after { content:""; position:absolute; left:50%; top:10px; width:2px; height:9px; transform:translateX(-50%); background:#8bd3d9; }

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

        .room-bench.is-recommended .bench-sign {
          border-color: #e0c27d;
          color: #fff8dc;
          box-shadow: 0 0 0 2px rgba(224, 194, 125, 0.18), 0 0 18px rgba(224, 194, 125, 0.32);
        }

        .room-bench.is-recommended .room-light,
        .room-bench.is-recommended .light-pool {
          opacity: 0.9;
        }

        .bench-recommendation {
          position: absolute;
          left: 50%;
          bottom: -39px;
          transform: translateX(-50%);
          width: max-content;
          padding: 3px 6px;
          border: 1px solid rgba(224, 194, 125, 0.55);
          border-radius: 999px;
          background: rgba(28, 25, 18, 0.92);
          color: #ead394;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.08em;
          line-height: 1.2;
        }

        .slot-discovery { left: 3.2%; top: 257px; }
        .slot-engineering { left: 17.8%; top: 228px; }
        .slot-validation { left: 32.4%; top: 212px; }
        .slot-patent { right: 32.4%; top: 212px; }
        .slot-marketing { right: 17.8%; top: 228px; }
        .slot-manufacturing { right: 3.2%; top: 257px; }
        .slot-reality { right: 2.2%; top: 455px; width: 12.5%; }

        .slot-prototype {
          left: 39%;
          top: 680px;
          width: 22%;
          height: 194px;
          z-index: 5;
        }

        .hub-concept-preview {
          position: absolute;
          left: 37%;
          top: 408px;
          z-index: 6;
          width: 26%;
          display: grid;
          justify-items: center;
          pointer-events: none;
        }

        .hub-concept-pointer {
          color: #84e7ec;
          font-size: 25px;
          line-height: 1;
          text-shadow: 0 0 12px rgba(80, 223, 234, .75);
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
          left: 7%;
          top: 625px;
          display: flex;
          gap: 12px;
          align-items: flex-end;
          pointer-events: none;
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

        .active-bench-workspace {
          scroll-margin-top: 20px;
        }

        .workshop-floor-guidance {
          scroll-margin-top: 20px;
        }

        .workshop-floor-actions,
        .active-workspace-navigation {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid #34465a;
        }

        .workshop-floor-actions button,
        .active-workspace-navigation button {
          padding: 10px 13px;
          border: 1px solid #486070;
          border-radius: 8px;
          background: #132633;
          color: #d8edf3;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          cursor: pointer;
        }

        .workshop-floor-actions button:disabled,
        .active-workspace-navigation button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .active-workspace-navigation span {
          color: #9cb0bc;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .living-workshop.prototype-mode {
          width: 100%;
          max-width: none;
          margin-top: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .prototype-focused-workspace {
          min-width: 0;
        }

        .prototype-ledger-view {
          display: grid;
          gap: 16px;
          color: #d8dcda;
        }

        .prototype-ledger-view p,
        .prototype-ledger-view dl {
          margin: 0;
        }

        .prototype-ledger-boundary {
          padding: 8px 10px;
          border-left: 3px solid #d2ad73;
          background: rgba(117, 96, 61, 0.18);
          color: #d4c5a6;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .prototype-ledger-view dl {
          display: grid;
          gap: 8px;
        }

        .prototype-ledger-view dl div,
        .prototype-ledger-view section {
          padding: 11px;
          border: 1px solid #454d4e;
          border-radius: 8px;
          background: rgba(8, 12, 13, 0.38);
        }

        .prototype-ledger-view dt,
        .prototype-ledger-view section strong {
          color: #c5b999;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .prototype-ledger-view dd,
        .prototype-ledger-view section p {
          margin: 6px 0 0;
          color: #eef0ec;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .prototype-ledger-view section small {
          display: block;
          margin-top: 6px;
          color: #969f9d;
          line-height: 1.45;
        }

        .prototype-ledger-project-name {
          color: #f4efe6;
          font-size: 19px;
        }

        .prototype-ledger-counts {
          grid-template-columns: 1fr 1fr;
        }

        .station-summary {
          grid-column: 1 / -1;
          margin-top: 4px;
          padding: 15px 16px;
          border-top: 1px solid #34465a;
          background: rgba(8, 20, 28, 0.42);
          color: #c6d0db;
          line-height: 1.5;
        }

        .station-summary p {
          margin: 6px 0 0;
        }

        .workshop-brief-conclusion {
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid rgba(111, 156, 168, 0.2);
        }

        .workshop-brief-conclusion p {
          margin: 4px 0 0;
        }

        .workshop-brief-direction {
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid rgba(191, 158, 85, 0.24);
        }

        .workshop-brief-direction p {
          margin: 4px 0 0;
        }

        .workshop-brief-action-record {
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid rgba(101, 178, 112, 0.24);
        }

        .workshop-brief-action-record p {
          margin: 4px 0 0;
        }

        .station-summary-label {
          color: #73e1ee;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .station-summary a {
          display: inline-flex;
          margin-top: 12px;
          padding: 9px 12px;
          border: 1px solid #35d9f5;
          border-radius: 7px;
          color: #e5fbff;
          font-size: 11px;
          font-weight: 850;
          text-decoration: none;
        }

        .engineering-summary p strong {
          color: #e8f3f5;
        }

        .validation-summary-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 10px;
          color: #b4d1d8;
          font-size: 12px;
        }

        .specialist-contribution-panel {
          grid-column: 1 / -1;
          margin-top: 4px;
          padding: 16px;
          border-top: 1px solid rgba(224, 173, 86, 0.38);
          background: rgba(45, 33, 14, 0.24);
        }

        .knowledge-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .knowledge-actions a {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          padding: 0 13px;
          border: 1px solid #63b9ca;
          border-radius: 7px;
          background: #17333b;
          color: #dff8fc;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .specialist-project-context {
          grid-column: 1 / -1;
          padding: 16px;
          border: 1px solid rgba(99, 185, 202, 0.28);
          border-radius: 10px;
          background: rgba(15, 37, 45, 0.42);
        }

        .specialist-project-context-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .specialist-project-context-heading > span {
          color: #9fc4cb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .specialist-project-context-name {
          margin: 7px 0 13px;
          color: #e4f3f5;
          font-size: 14px;
          font-weight: 800;
        }

        .specialist-project-context-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .specialist-project-context-grid > section {
          padding: 11px;
          border: 1px solid rgba(99, 185, 202, 0.18);
          border-radius: 8px;
          background: rgba(7, 17, 29, 0.44);
        }

        .specialist-project-context-grid strong {
          color: #cce8ed;
          font-size: 12px;
        }

        .specialist-project-context-grid p,
        .specialist-project-context-grid ul {
          margin: 7px 0 0;
          color: #c5d0d6;
          font-size: 12px;
          line-height: 1.5;
        }

        .specialist-project-context-grid ul {
          padding-left: 18px;
        }

        .specialist-project-context-grid li + li {
          margin-top: 5px;
        }

        .specialist-project-context-grid small {
          display: block;
          margin-top: 7px;
          color: #98aab4;
          font-size: 10px;
        }

        .specialist-project-context-records {
          display: grid;
          gap: 7px;
          margin-top: 7px;
        }

        .specialist-project-context-records article {
          padding-top: 7px;
          border-top: 1px solid rgba(99, 185, 202, 0.14);
        }

        .specialist-project-context-records article:first-child {
          padding-top: 0;
          border-top: 0;
        }

        .specialist-project-context-records p {
          margin: 0;
        }

        .specialist-inquiry {
          grid-column: 1 / -1;
          padding: 16px;
          border: 1px solid rgba(174, 147, 219, 0.3);
          border-radius: 10px;
          background: rgba(35, 24, 55, 0.34);
        }

        .specialist-inquiry-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .specialist-inquiry-heading > div > strong {
          display: block;
          margin-top: 5px;
          color: #eadcfa;
          font-size: 14px;
        }

        .specialist-inquiry-heading > span {
          color: #c3abd9;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .specialist-current-question { display:grid; gap:6px; margin:14px 0; padding:12px; border:1px solid rgba(119,218,240,.28); background:rgba(13,29,40,.48); }
        .specialist-current-question span { color:#77daf0; font:800 9px/1.25 Arial,sans-serif; letter-spacing:.8px; text-transform:uppercase; }
        .specialist-current-question strong { color:#f4f8fb; font:700 13px/1.45 Arial,sans-serif; }
        .bench-guided-actions { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 0; }

        .specialist-inquiry > p,
        .specialist-inquiry > ol,
        .specialist-inquiry-notes ul {
          color: #d0c7d8;
          font-size: 12px;
          line-height: 1.55;
        }

        .specialist-inquiry > p {
          margin: 9px 0 0;
        }

        .specialist-inquiry-lens strong,
        .specialist-inquiry-notes > strong {
          color: #e5d4f3;
        }

        .specialist-inquiry-boundary {
          color: #c6e6ec !important;
          font-weight: 700;
        }

        .specialist-inquiry-disclaimer {
          color: #efcf9d !important;
        }

        .specialist-inquiry > ol {
          margin: 12px 0 0;
          padding-left: 21px;
        }

        .specialist-inquiry > ol li + li,
        .specialist-inquiry-notes li + li {
          margin-top: 6px;
        }

        .specialist-inquiry-notes {
          margin-top: 13px;
          padding-top: 11px;
          border-top: 1px solid rgba(174, 147, 219, 0.18);
        }

        .specialist-inquiry-notes ul {
          margin: 7px 0 0;
          padding-left: 18px;
        }

        @media (max-width: 760px) {
          .specialist-project-context-grid {
            grid-template-columns: 1fr;
          }
        }

        .specialist-contribution-panel > p:not(.station-summary-label) {
          margin: 7px 0 12px;
          color: #c9c1b3;
          font-size: 13px;
          line-height: 1.5;
        }

        .specialist-contribution-panel textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #655535;
          border-radius: 8px;
          background: #0b1119;
          color: #eef3f7;
          font: inherit;
          resize: vertical;
        }

        .specialist-contribution-panel > button {
          margin-top: 10px;
          padding: 9px 13px;
          border: 1px solid #d6a64e;
          border-radius: 7px;
          background: #3a2c13;
          color: #f5dfb4;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .specialist-contribution-error {
          margin: 8px 0 0 !important;
          color: #ffb4b4 !important;
          font-size: 12px !important;
        }

        .specialist-contribution-history {
          display: grid;
          gap: 8px;
          margin-top: 16px;
          padding-top: 13px;
          border-top: 1px solid rgba(224, 173, 86, 0.22);
        }

        .specialist-contribution-history > strong {
          color: #e8d5ad;
          font-size: 12px;
        }

        .specialist-contribution-history article {
          padding: 10px;
          border: 1px solid rgba(224, 173, 86, 0.2);
          border-radius: 7px;
          background: rgba(7, 17, 29, 0.48);
        }

        .specialist-contribution-history article p {
          margin: 0;
          color: #dbe2e7;
          font-size: 12px;
          line-height: 1.5;
        }

        .specialist-contribution-history time {
          display: block;
          margin-top: 5px;
          color: #9aa7b1;
          font-size: 10px;
        }

        .specialist-contribution-history article > span {
          display: block;
          margin-top: 7px;
          color: #b8c8d3;
          font-size: 11px;
        }

        .specialist-evidence-adoption {
          display: grid;
          gap: 9px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(224, 173, 86, 0.22);
        }

        .specialist-evidence-adoption > strong {
          color: #f0dba9;
          font-size: 13px;
        }

        .specialist-evidence-adoption > p {
          margin: 0;
          color: #b9c3cb;
          font-size: 12px;
          line-height: 1.5;
        }

        .specialist-evidence-adoption select,
        .specialist-evidence-adoption input {
          box-sizing: border-box;
          width: 100%;
          padding: 10px 11px;
          border: 1px solid #655535;
          border-radius: 7px;
          background: #0b1119;
          color: #eef3f7;
          font: inherit;
        }

        .specialist-evidence-adoption > button {
          justify-self: start;
          padding: 9px 13px;
          border: 1px solid #63b9ca;
          border-radius: 7px;
          background: #17333b;
          color: #dff8fc;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
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

        .concept-evidence-selector {
          margin: 12px 0;
          padding: 10px 11px;
          border: 1px solid rgba(106, 151, 164, 0.3);
          border-radius: 7px;
          background: rgba(220, 232, 235, 0.025);
        }

        .concept-evidence-selector legend {
          padding: 0 5px;
          color: #a9d6de;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .concept-evidence-selector > p,
        .concept-evidence-empty {
          margin: 0 0 9px;
          color: #94a8af;
          font-size: 10px;
          line-height: 1.45;
        }

        .concept-evidence-empty {
          margin-top: 12px;
        }

        .concept-evidence-options {
          display: grid;
          gap: 6px;
        }

        .concept-evidence-options label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 7px 8px;
          border: 1px solid rgba(106, 132, 144, 0.24);
          border-radius: 5px;
          color: #d4e0e3;
          cursor: pointer;
        }

        .concept-evidence-options input {
          flex: 0 0 auto;
          margin: 2px 0 0;
          accent-color: #72cdda;
        }

        .concept-evidence-options span {
          min-width: 0;
        }

        .concept-evidence-options strong,
        .concept-evidence-options small {
          display: block;
        }

        .concept-evidence-options strong {
          color: #e4eff1;
          font-size: 10px;
          line-height: 1.35;
        }

        .concept-evidence-options small {
          margin-top: 2px;
          color: #8fa9b1;
          font-size: 9px;
          line-height: 1.35;
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

        .first-concept-foundation { margin:0 0 18px; padding:16px; border:1px solid rgba(83,192,211,.38); border-radius:12px; background:linear-gradient(145deg,rgba(9,31,38,.94),rgba(10,20,27,.96)); box-shadow:inset 0 1px rgba(255,255,255,.035); }
        .first-concept-mode-heading, .first-concept-brief-heading, .first-concept-readiness { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
        .first-concept-mode-heading span, .first-concept-brief-heading span, .first-concept-readiness span { display:block; color:#70cddd; font:800 9px/1.2 Arial,sans-serif; letter-spacing:1.4px; }
        .first-concept-mode-heading strong, .first-concept-brief-heading strong, .first-concept-readiness strong { display:block; margin-top:6px; color:#f0f8fa; font:800 16px/1.2 Arial,sans-serif; }
        .first-concept-mode-heading b, .first-concept-brief-heading b { padding:6px 8px; border:1px solid rgba(99,185,201,.45); border-radius:6px; color:#9bcbd3; font:800 8px/1 Arial,sans-serif; letter-spacing:1px; }
        .first-concept-mode-reason { margin:12px 0 4px; color:#d7e4e7; font-size:13px; line-height:1.55; }
        .first-concept-signals { margin:0; color:#7f9ca5; font-size:10px; line-height:1.5; }
        .first-concept-mode-actions { display:flex; flex-wrap:wrap; gap:8px; margin:13px 0; }
        .first-concept-mode-actions button, .first-concept-readiness button { border:1px solid rgba(87,201,220,.62); background:linear-gradient(180deg,#226071,#123c48); color:#e8fbff; padding:9px 12px; font:800 9px/1 Arial,sans-serif; letter-spacing:1px; cursor:pointer; }
        .first-concept-mode-actions .first-concept-secondary-action { background:#111d25; border-color:#536773; color:#aebec5; }
        .first-concept-mode-select { display:grid; gap:6px; margin:0 0 14px; color:#91aab2; font-size:10px; }
        .first-concept-mode-select select { min-height:38px; border:1px solid #496975; border-radius:6px; background:#0d1a21; color:#e4f0f2; padding:0 10px; }
        .first-concept-brief-heading { margin-top:16px; padding-top:14px; border-top:1px solid rgba(92,149,162,.3); }
        .first-concept-brief-heading b { max-width:240px; color:#d7b879; border-color:rgba(193,151,75,.4); text-align:right; line-height:1.35; }
        .first-concept-brief-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin:12px 0; }
        .first-concept-brief-grid section { min-width:0; padding:10px; border:1px solid rgba(72,120,133,.3); background:rgba(5,15,20,.5); }
        .first-concept-brief-grid span { color:#6fb8c6; font:800 8px/1 Arial,sans-serif; letter-spacing:1px; }
        .first-concept-brief-grid p, .first-concept-brief-grid ul { margin:6px 0 0; color:#cfdbdf; font-size:11px; line-height:1.5; }
        .first-concept-brief-grid ul { padding-left:16px; }
        .first-concept-trace { margin:10px 0; padding:8px 10px; border:1px solid rgba(76,113,124,.32); color:#8fa6ae; font-size:10px; }
        .first-concept-trace summary { cursor:pointer; color:#9fc3cb; }
        .first-concept-trace ul { margin:8px 0 0; padding-left:17px; }
        .first-concept-trace li { margin:4px 0; overflow-wrap:anywhere; }
        .first-concept-trace code, .first-concept-identity code { color:#81d0dc; }
        .first-concept-readiness { margin-top:12px; padding:12px; border:1px solid rgba(151,121,67,.45); background:rgba(40,29,13,.42); }
        .first-concept-readiness.is-ready { border-color:rgba(73,188,158,.5); background:rgba(15,48,41,.45); }
        .first-concept-readiness small { display:block; max-width:600px; margin-top:6px; color:#9eb0b6; font-size:10px; line-height:1.45; }
        .first-concept-readiness button:disabled { max-width:250px; border-color:#4a626b; background:#15242b; color:#789099; cursor:not-allowed; }
        .first-concept-generation-status { margin:10px 0 0; padding:9px 11px; border:1px solid rgba(213,174,91,.48); color:#efd599; background:rgba(62,42,13,.38); font:800 10px/1.4 Arial,sans-serif; letter-spacing:.7px; }
        .first-concept-generation-status.is-working { animation:rev-working-pulse 1.15s ease-in-out infinite alternate; }
        @keyframes rev-working-pulse { from { box-shadow:0 0 0 rgba(105,217,233,0); opacity:.72; } to { box-shadow:0 0 18px rgba(105,217,233,.28); opacity:1; } }
        .first-concept-generation-status.is-error { border-color:rgba(218,102,102,.48); color:#f1b2b2; background:rgba(62,20,20,.34); }
        .generated-concept-candidate { margin:16px 0; padding:15px; border:1px solid rgba(79,208,203,.5); border-radius:12px; background:rgba(7,23,28,.86); }
        .generated-concept-candidate-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:12px; }
        .generated-concept-candidate-heading span { display:block; color:#76dce0; font:800 9px/1.2 Arial,sans-serif; letter-spacing:1.3px; }
        .generated-concept-candidate-heading strong { display:block; margin-top:5px; color:#f3ffff; font:900 20px/1.1 Arial,sans-serif; }
        .generated-concept-candidate-heading b { color:#9bd1d4; font:800 9px/1.2 Arial,sans-serif; letter-spacing:1px; }
        .generated-concept-model-viewport { position:relative; overflow:hidden; border:1px solid rgba(92,204,209,.22); border-radius:9px; background:#091216; }
        .generated-concept-candidate img { position:relative; z-index:1; display:block; width:100%; max-height:620px; object-fit:contain; }
        .generated-concept-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(78,174,190,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(78,174,190,.08) 1px,transparent 1px); background-size:28px 28px; }
        .generated-concept-axis { position:absolute; z-index:2; right:12px; bottom:10px; color:rgba(119,225,228,.78); font:700 9px/1.25 monospace; text-align:center; }
        .generated-concept-candidate p { margin:11px 0 4px; color:#c7f3ef; font:850 10px/1.4 Arial,sans-serif; letter-spacing:1px; }
        .generated-concept-candidate .generated-concept-candidate-note { margin:4px 0; color:#a9bec2; font-weight:500; letter-spacing:0; }
        .generated-concept-candidate .generated-concept-update-note { margin:8px 0; padding:8px 10px; border-left:2px solid #d4aa61; color:#dfc28d; background:rgba(67,47,19,.34); }
        .generated-concept-candidate small { display:block; color:#8aa2a7; font-size:10px; line-height:1.45; }
        .concept-refinement-actions { display:flex; flex-wrap:wrap; gap:9px; margin-top:14px; }
        .concept-refinement-actions button, .concept-refinement-panel > button { padding:9px 12px; border:1px solid rgba(105,217,233,.52); border-radius:7px; background:rgba(15,57,66,.62); color:#dffcff; font:850 9px/1.2 Arial,sans-serif; letter-spacing:1px; }
        .concept-refinement-panel { display:grid; gap:10px; margin-top:12px; padding:12px; border:1px solid rgba(105,217,233,.28); border-radius:9px; background:rgba(4,13,16,.64); }
        .concept-refinement-panel label span, .previous-concept-model > span { display:block; margin-bottom:7px; color:#8de5e9; font:800 10px/1.3 Arial,sans-serif; letter-spacing:.8px; }
        .concept-refinement-panel textarea { box-sizing:border-box; width:100%; resize:vertical; padding:10px; border:1px solid #496069; border-radius:7px; background:#081114; color:#edf2ef; font:inherit; line-height:1.5; }
        .concept-refinement-panel button:disabled { opacity:.48; cursor:not-allowed; }
        .previous-concept-model { margin-top:14px; padding:10px; border:1px solid rgba(126,151,157,.3); border-radius:9px; background:#081114; }
        .previous-concept-model img { max-height:420px; }
        .first-concept-identity { margin:9px 0 0; color:#758e97; font-size:9px; overflow-wrap:anywhere; }

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
          .living-workshop { width: 100%; padding: 16px; }
          .workshop-heading { grid-template-columns: 1fr; gap: 10px; }
          .workshop-brief { grid-template-columns: 1fr; }
          .workshop-brief-action { padding: 14px 0 0; border-top: 1px solid #315463; border-left: 0; }
          .bench-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .room { min-height: 990px; }
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
          .slot-prototype { left: 37%; top: 800px; width: 26%; }
          .hub-concept-preview { left: 35%; top: 565px; width: 30%; }
          .rev-station { left: 3%; top: 790px; }
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
          .first-concept-mode-heading, .first-concept-brief-heading, .first-concept-readiness { flex-direction:column; }
          .first-concept-brief-grid { grid-template-columns:1fr; }
          .room { min-height: 1280px; }
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
          .slot-prototype { left: 53%; top: 1050px; width: 42%; }
          .hub-concept-preview { left: 51%; top: 815px; width: 46%; }
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

function ConceptCandidateStorageStatusLine({ status }: { status: ConceptCandidateStorageStatus }) {
  const labels: Record<ConceptCandidateStorageStatus, string> = {
    loading: "CHECKING SAVED CANDIDATE",
    "no-candidate-saved": "NO CANDIDATE SAVED",
    "candidate-restored": "CANDIDATE RESTORED",
    "candidate-saving": "SAVING CANDIDATE",
    "candidate-saved": "CANDIDATE SAVED",
    "candidate-could-not-be-saved": "CANDIDATE COULD NOT BE SAVED",
    "restore-failed": "SAVED CANDIDATE COULD NOT BE CHECKED",
  };
  const failed = status === "candidate-could-not-be-saved" || status === "restore-failed";

  return (
    <p
      className={`first-concept-generation-status ${failed ? "is-error" : "is-ready"}`}
      role="status"
      title="Browser storage status only. This does not change the Project."
    >
      MODEL STORAGE · {labels[status]}
    </p>
  );
}

function missingConceptDetailLabel(
  field: "proposedSolution" | "operatingConcept" | "functionalElements" | "confirmedVisualMode"
): string {
  const labels = {
    proposedSolution: "what the idea should do",
    operatingConcept: "how the idea could work",
    functionalElements: "the main parts or steps",
    confirmedVisualMode: "what we are designing",
  } as const;

  return labels[field];
}
