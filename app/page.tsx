"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import HomeRevUnderstanding from "./components/HomeRevUnderstanding";
import HomeVisualShell from "./components/HomeVisualShell";
import homeStyles from "./components/HomeVisualShell.module.css";
import { createProject, recordHomeSourceImage, type Project, type ProjectOriginIntent } from "./lib/core/project";
import { savePreferredName } from "./lib/core/inventorStorage";
import { loadProject, saveProject } from "./lib/core/storageEngine";
import {
  createSourceImageReference,
  loadProjectSourceImage,
  parseSourceImageReference,
  saveProjectSourceImage,
  sourceImageToDataUrl,
  validateSourceImage,
  type ValidatedSourceImage,
} from "./lib/core/projectSourceEvidenceStorage";
import {
  claimHomeKnowledgePresentation,
  applyHomeRevUnderstandingFallback,
  applyHomeRevUnderstandingResponse,
  createInitialHomeKnowledge,
  createHomeRevUnderstandingRequest,
  deriveActiveHomeKnowledge,
  deriveHomeEvidenceCoverage,
  deriveHomeKnowledgeBasisRevision,
  deriveHomeUnderstandingState,
  ensureHomeUnderstandingQuestion,
  getActiveHomeQuestion,
  getPulseEligibleKnowledge,
  isMatchingHomeProject,
  recordHomeRevUnderstandingStale,
  recordHomeUnderstandingOperationStarted,
  recordHomeUnderstandingAnswer,
  type HomeAnswerInput,
  type HomeUnderstandingEventFactory,
  type HomeUnderstandingState,
} from "./lib/workshop/homeUnderstanding";
import {
  emptyRevUnderstandingAccounting,
  parseRevUnderstandingApiResponse,
  type RevUnderstandingApiResponse,
  type RevUnderstandingRequest,
} from "./lib/ai/revUnderstandingTypes";
import type {
  RevImageSafetyReceipt,
  VisualUnderstandingApiResponse,
  VisualUnderstandingResult,
} from "./lib/ai/types";

const ORIGIN_INTENTS: Array<{ value: ProjectOriginIntent; label: string; description: string }> = [
  { value: "developing", label: "DEVELOP AN INVENTION", description: "Turn an idea into a working concept." },
  { value: "evaluating", label: "EVALUATE AN INVENTION", description: "Assess technical, market and financial viability." },
  { value: "both", label: "DEVELOP + EVALUATE", description: "Build the concept and assess the opportunity." },
];

const HOME_CREATION_STATUS = [
  "VISUAL CONCEPT",
  "INTERACTIVE 3D MODEL",
  "ENGINEERING DIRECTION",
  "TESTING PLAN",
  "PATENT / IP FINDINGS",
  "MANUFACTURING CONSIDERATIONS",
  "MARKET INSIGHT",
  "REALITY CHECK",
] as const;

const CREATION_INTENT_UNAVAILABLE_MESSAGE = "REV couldn’t confirm the creation safety boundary. No Project was created.";
const CREATION_INTENT_BLOCK_MESSAGE = "REV can’t help design, modify or improve weapons or explosive materials. I can help with safe storage, decommissioning, compliance, detection or protective systems.";
const HAI2_ROUTE_AVAILABLE = process.env.NEXT_PUBLIC_REAIDEA_HAI2_ROUTE_CAPABILITY === "enabled" && process.env.NODE_ENV !== "production";
const HAI2_FALLBACK_MESSAGE = "REV is continuing with the information already secured.";

type CreationIntentResponse =
  | { decision: "CLEAR"; limitations: string[] }
  | { decision: "HOLD"; message: string; question: string }
  | { decision: "BLOCK"; message: string }
  | { decision: "unavailable"; message: string };

type ClearedImageUnderstanding = {
  interpretation: VisualUnderstandingResult;
  safetyReceipt: RevImageSafetyReceipt;
};

type ImageUnderstandingAttempt = {
  token: string;
  evidenceId: string;
  inventorContext: string;
  controller: AbortController;
};

function isCreationIntentResponse(value: unknown): value is CreationIntentResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  if (payload.decision === "CLEAR") return Array.isArray(payload.limitations) && payload.limitations.every((item) => typeof item === "string");
  if (payload.decision === "HOLD") return typeof payload.message === "string" && typeof payload.question === "string";
  if (payload.decision === "BLOCK" || payload.decision === "unavailable") return typeof payload.message === "string";
  return false;
}

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function newFactory(): HomeUnderstandingEventFactory {
  const now = new Date().toISOString();
  return { now, nextId: () => globalThis.crypto.randomUUID() };
}

function persistAndReload(project: Project, expectedEventId?: string): Project {
  if (!saveProject(project)) throw new Error("Project persistence failed.");
  const restored = loadProject();
  if (!restored || restored.id !== project.id) throw new Error("Project reload verification failed.");
  if (expectedEventId && !restored.timeline.some((entry) => entry.id === expectedEventId)) {
    throw new Error("Project evidence reload verification failed.");
  }
  return restored;
}

export default function Home() {
  const [originIntent, setOriginIntent] = useState<ProjectOriginIntent | null>(null);
  const [description, setDescription] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<HomeUnderstandingState>("IDEA_ENTRY");
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [pulseKnowledgeEventId, setPulseKnowledgeEventId] = useState<string | null>(null);
  const [understandingNotice, setUnderstandingNotice] = useState("");
  const [selectedImage, setSelectedImage] = useState<ValidatedSourceImage | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageInvalid, setImageInvalid] = useState(false);
  const [visualInterpretation, setVisualInterpretation] = useState<VisualUnderstandingResult | null>(null);
  const [imageSafetyReceipt, setImageSafetyReceipt] = useState<RevImageSafetyReceipt | null>(null);
  const [imageSafetyState, setImageSafetyState] = useState<"unchecked" | "checking" | "CLEAR" | "HOLD" | "BLOCK" | "unavailable">("unchecked");
  const [visualUnderstandingMessage, setVisualUnderstandingMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const imagePreviewUrlRef = useRef("");
  const imageAttemptRef = useRef<ImageUnderstandingAttempt | null>(null);
  const actionRef = useRef(false);

  const activeKnowledge = useMemo(() => project ? deriveActiveHomeKnowledge(project) : [], [project]);
  const coverage = useMemo(() => project ? deriveHomeEvidenceCoverage(project) : null, [project]);
  const activeQuestion = useMemo(() => project ? getActiveHomeQuestion(project) : null, [project]);
  const busy = state === "SAFETY_CHECKING" || state === "REV_ANALYSING" || state === "ANSWER_RECORDING";
  const canAskRev = Boolean(originIntent && description.trim() && !imageBusy && !imageInvalid && !busy && !project);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = loadProject();
      if (!restored) return;
      setProject(restored);
      setDescription(restored.originalObservation);
      setOriginIntent(restored.originIntent ?? null);
      if (getPulseEligibleKnowledge(restored)) {
        setState("SAFE_ERROR_OR_RETRY");
        setError("A saved answer still needs a deliberate presentation step. Your Project information is intact.");
      } else {
        setState(deriveHomeUnderstandingState(restored));
      }
      void restoreClearedReference(restored);
    });

    async function restoreClearedReference(currentProject: Project) {
      for (const reference of currentProject.files) {
        const evidenceId = parseSourceImageReference(reference);
        if (!evidenceId) continue;
        const stored = await loadProjectSourceImage(currentProject.id, evidenceId);
        if (!stored?.interpretation || !stored.safetyReceipt) continue;
        setVisualInterpretation(stored.interpretation);
        setImageSafetyReceipt(stored.safetyReceipt);
        setImageSafetyState("CLEAR");
        break;
      }
    }
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    imageAttemptRef.current?.controller.abort();
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
  }, []);

  useEffect(() => {
    if (originIntent && !project) descriptionInputRef.current?.focus();
  }, [originIntent, project]);

  function revokeImagePreview() {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = "";
    setImagePreviewUrl("");
  }

  async function selectImage(file: File | undefined) {
    if (!file || project) return;
    imageAttemptRef.current?.controller.abort();
    setImageBusy(true);
    setError("");
    setVisualInterpretation(null);
    setImageSafetyReceipt(null);
    setImageSafetyState("unchecked");
    try {
      const validated = await validateSourceImage(file);
      revokeImagePreview();
      const url = URL.createObjectURL(validated.blob);
      imagePreviewUrlRef.current = url;
      setImagePreviewUrl(url);
      setSelectedImage(validated);
      setImageInvalid(false);
      setVisualUnderstandingMessage("ASK REV to check and understand this image.");
    } catch (caught) {
      setSelectedImage(null);
      setImageInvalid(true);
      setError(caught instanceof Error ? caught.message : "REV couldn’t read this image.");
    } finally {
      setImageBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    if (project || busy) return;
    imageAttemptRef.current?.controller.abort();
    revokeImagePreview();
    setSelectedImage(null);
    setImageInvalid(false);
    setVisualInterpretation(null);
    setImageSafetyReceipt(null);
    setImageSafetyState("unchecked");
    setVisualUnderstandingMessage("");
    setError("");
  }

  async function assessCreationIntent(inventorDescription: string): Promise<CreationIntentResponse> {
    try {
      const response = await fetch("/api/creation-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: inventorDescription }),
      });
      const payload: unknown = await response.json();
      if (!isCreationIntentResponse(payload) || (payload.decision === "CLEAR" && !response.ok)) {
        return { decision: "unavailable", message: CREATION_INTENT_UNAVAILABLE_MESSAGE };
      }
      return payload;
    } catch {
      return { decision: "unavailable", message: CREATION_INTENT_UNAVAILABLE_MESSAGE };
    }
  }

  async function understandImage(image: ValidatedSourceImage, inventorDescription: string): Promise<ClearedImageUnderstanding | null> {
    if (!navigator.onLine) {
      setImageSafetyState("unavailable");
      setError("REV couldn’t check this image. Remove it or deliberately try again.");
      return null;
    }
    setImageSafetyState("checking");
    const evidenceReference = createSourceImageReference(image.evidenceId);
    const attempt: ImageUnderstandingAttempt = {
      token: globalThis.crypto.randomUUID(),
      evidenceId: image.evidenceId,
      inventorContext: normalized(inventorDescription),
      controller: new AbortController(),
    };
    imageAttemptRef.current = attempt;
    try {
      const dataUrl = await sourceImageToDataUrl(image);
      const response = await fetch("/api/understanding/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: attempt.controller.signal,
        body: JSON.stringify({
          requestId: attempt.token,
          evidenceReference,
          mediaType: image.mediaType,
          dataUrl,
          inventorDescription,
        }),
      });
      const payload = await response.json() as VisualUnderstandingApiResponse;
      if (!response.ok || "error" in payload || payload.safety.decision === "unavailable") {
        setImageSafetyState("unavailable");
        setError("REV couldn’t check this image. Remove it or deliberately try again.");
        return null;
      }
      if (payload.safety.decision === "BLOCK") {
        revokeImagePreview();
        setSelectedImage(null);
        setVisualInterpretation(null);
        setImageSafetyReceipt(null);
        setImageSafetyState("BLOCK");
        setError(CREATION_INTENT_BLOCK_MESSAGE);
        return null;
      }
      if (payload.safety.decision === "HOLD") {
        setImageSafetyState("HOLD");
        setError(payload.safety.question);
        return null;
      }
      if (!("interpretation" in payload) || payload.interpretation.evidenceReference !== evidenceReference) {
        setImageSafetyState("unavailable");
        setError("REV couldn’t verify the supporting image interpretation.");
        return null;
      }
      setImageSafetyState("CLEAR");
      setVisualInterpretation(payload.interpretation);
      setImageSafetyReceipt(payload.safety.receipt);
      setVisualUnderstandingMessage("REV retained this as supporting evidence, not inventor-authored Project truth.");
      return { interpretation: payload.interpretation, safetyReceipt: payload.safety.receipt };
    } catch {
      setImageSafetyState("unavailable");
      setError("REV couldn’t check this image. Remove it or deliberately try again.");
      return null;
    } finally {
      if (imageAttemptRef.current?.token === attempt.token) imageAttemptRef.current = null;
    }
  }

  async function askRev() {
    if (!originIntent || !description.trim() || project || actionRef.current || imageBusy || imageInvalid) return;
    actionRef.current = true;
    setPulseKnowledgeEventId(null);
    setUnderstandingNotice("");
    setError("");
    setState("SAFETY_CHECKING");
    try {
      const intent = await assessCreationIntent(description);
      if (intent.decision !== "CLEAR") {
        setState("SAFE_ERROR_OR_RETRY");
        setError(intent.decision === "HOLD" ? `${intent.message} ${intent.question}` : intent.message);
        return;
      }

      let cleared = visualInterpretation && imageSafetyReceipt && imageSafetyState === "CLEAR"
        ? { interpretation: visualInterpretation, safetyReceipt: imageSafetyReceipt }
        : null;
      if (selectedImage && !cleared) {
        cleared = await understandImage(selectedImage, description);
        if (!cleared) {
          setState("SAFE_ERROR_OR_RETRY");
          return;
        }
      }

      setState("REV_ANALYSING");
      const inventor = savePreferredName("");
      const storedProject = loadProject();
      if (storedProject && !isMatchingHomeProject(storedProject, description, originIntent)) {
        throw new Error("A different active Project already owns Home persistence.");
      }
      let nextProject = storedProject ?? createProject({ ownerId: inventor.id, originalObservation: description, originIntent });
      nextProject = persistAndReload(nextProject);

      const clearedReferences: Array<{ sourceReference: string; value: string }> = [];
      if (selectedImage && cleared) {
        const evidenceReference = createSourceImageReference(selectedImage.evidenceId);
        await saveProjectSourceImage(nextProject.id, selectedImage, cleared.interpretation, cleared.safetyReceipt, description);
        nextProject = recordHomeSourceImage(nextProject, evidenceReference);
        nextProject = persistAndReload(nextProject);
        clearedReferences.push({ sourceReference: evidenceReference, value: cleared.interpretation.factualSummary });
      }

      nextProject = createInitialHomeKnowledge(nextProject, clearedReferences, newFactory());
      nextProject = persistAndReload(nextProject);
      nextProject = await prepareNextUnderstandingStep(nextProject);
      setProject(nextProject);
      setState(deriveHomeUnderstandingState(nextProject));
    } catch {
      const restored = loadProject();
      if (restored) setProject(restored);
      setState("SAFE_ERROR_OR_RETRY");
      setError(restored
        ? "REV paused safely. Your Project and accepted information remain saved."
        : "REV could not verify the Project save. No Concept or geometry operation began.");
    } finally {
      actionRef.current = false;
    }
  }

  async function answerQuestion(input: HomeAnswerInput) {
    if (!project || !activeQuestion || actionRef.current) return;
    actionRef.current = true;
    setState("ANSWER_RECORDING");
    setError("");
    setUnderstandingNotice("");
    setPulseKnowledgeEventId(null);
    try {
      const result = recordHomeUnderstandingAnswer(project, activeQuestion.eventId, input, newFactory());
      if (result.kind !== "recorded") {
        setState(result.kind === "duplicate" ? "QUESTION_READY" : "SAFE_ERROR_OR_RETRY");
        setError(result.message);
        return;
      }
      let restored = persistAndReload(result.project, result.knowledgeEventId);
      const claimed = claimHomeKnowledgePresentation(restored, result.knowledgeEventId, newFactory());
      const claimId = claimed.timeline.at(-1)?.id;
      if (claimed === restored || !claimId) throw new Error("Presentation claim could not be secured.");
      restored = persistAndReload(claimed, claimId);
      restored = await prepareNextUnderstandingStep(restored);
      setProject(restored);
      setAnswer("");
      setSelectedChoiceId("");
      setPulseKnowledgeEventId(result.knowledgeEventId);
      setState("KNOWLEDGE_SECURED");
    } catch {
      const restored = loadProject();
      if (restored?.id === project.id) setProject(restored);
      setState("SAFE_ERROR_OR_RETRY");
      setError("REV paused safely while securing this answer. No accepted Project information was discarded.");
    } finally {
      actionRef.current = false;
    }
  }

  async function prepareNextUnderstandingStep(currentProject: Project): Promise<Project> {
    if (deriveHomeEvidenceCoverage(currentProject).ready || getActiveHomeQuestion(currentProject)) return currentProject;
    if (!HAI2_ROUTE_AVAILABLE) {
      return persistAndReload(ensureHomeUnderstandingQuestion(currentProject, newFactory()));
    }

    setState("REV_ANALYSING");
    const operationId = globalThis.crypto.randomUUID();
    const request = createHomeRevUnderstandingRequest(currentProject, operationId);
    const started = recordHomeUnderstandingOperationStarted(currentProject, request, newFactory());
    if (!started.receiptEventId) throw new Error("The understanding operation could not bind to this Project.");
    let restored = persistAndReload(started.project, started.receiptEventId);
    if (deriveHomeKnowledgeBasisRevision(restored) !== request.knowledgeBasisRevision) {
      throw new Error("The Project knowledge changed before the understanding operation began.");
    }

    let response: RevUnderstandingApiResponse;
    try {
      const routeResponse = await fetch("/api/understanding/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const payload: unknown = await routeResponse.json();
      response = parseRevUnderstandingApiResponse(payload) ?? localHai2Fallback(request, "malformed-response");
    } catch {
      response = localHai2Fallback(request, "unavailable");
    }

    const current = loadProject();
    if (!current || current.id !== request.projectId) {
      throw new Error("The Project knowledge changed while REV was organising it.");
    }
    if (deriveHomeKnowledgeBasisRevision(current) !== request.knowledgeBasisRevision) {
      const stale = recordHomeRevUnderstandingStale(current, request, response.accounting, newFactory());
      persistAndReload(stale, stale.timeline.at(-1)?.id);
      throw new Error("The Project knowledge changed while REV was organising it.");
    }

    if (response.status === "completed") {
      const applied = applyHomeRevUnderstandingResponse(current, request, response, newFactory());
      if (!applied) throw new Error("The understanding response no longer matches this Project.");
      restored = persistAndReload(applied.project, applied.project.timeline.at(-1)?.id);
      return restored;
    }

    const fallback = applyHomeRevUnderstandingFallback(current, request, response, newFactory());
    if (!fallback) throw new Error("The fallback no longer matches this Project.");
    restored = persistAndReload(fallback, fallback.timeline.at(-1)?.id);
    setUnderstandingNotice(HAI2_FALLBACK_MESSAGE);
    return restored;
  }

  function localHai2Fallback(
    request: RevUnderstandingRequest,
    errorCategory: "malformed-response" | "unavailable"
  ): Extract<RevUnderstandingApiResponse, { status: "fallback" | "disabled" }> {
    return {
      status: "fallback",
      operationId: request.operationId,
      operationKey: request.operationKey,
      projectId: request.projectId,
      knowledgeBasisRevision: request.knowledgeBasisRevision,
      message: HAI2_FALLBACK_MESSAGE,
      errorCategory,
      accounting: emptyRevUnderstandingAccounting({
        deliberateRouteRequests: 1,
        fallbackPresentations: 1,
      }),
    };
  }

  function retryCurrentStep() {
    setError("");
    setUnderstandingNotice("");
    setPulseKnowledgeEventId(null);
    if (!project) {
      void askRev();
      return;
    }
    if (actionRef.current) return;
    actionRef.current = true;
    setState("REV_ANALYSING");
    try {
      let restored = project;
      const eligible = getPulseEligibleKnowledge(restored);
      if (eligible) {
        const claimed = claimHomeKnowledgePresentation(restored, eligible.eventId, newFactory());
        const claimId = claimed.timeline.at(-1)?.id;
        if (claimed === restored || !claimId) throw new Error("Presentation claim could not be secured.");
        restored = persistAndReload(claimed, claimId);
        setPulseKnowledgeEventId(eligible.eventId);
      }
      restored = createInitialHomeKnowledge(
        restored,
        visualInterpretation ? [{ sourceReference: visualInterpretation.evidenceReference, value: visualInterpretation.factualSummary }] : [],
        newFactory()
      );
      restored = ensureHomeUnderstandingQuestion(restored, newFactory());
      restored = persistAndReload(restored);
      setProject(restored);
      setState(eligible ? "KNOWLEDGE_SECURED" : deriveHomeUnderstandingState(restored));
    } catch {
      setState("SAFE_ERROR_OR_RETRY");
      setError("REV paused safely. Your Project and accepted information remain saved.");
    } finally {
      actionRef.current = false;
    }
  }

  return (
    <HomeVisualShell openingMode={!project} knowledgePulseActive={Boolean(pulseKnowledgeEventId)} knowledgePulseKey={pulseKnowledgeEventId}>
      <section className={`${homeStyles.entry} ${!project ? homeStyles.openingEntry : ""}`} aria-labelledby="home-title">
        {!project ? (
          <div className={`${homeStyles.consoleRegions} ${originIntent ? homeStyles.hasIntent : homeStyles.awaitingIntent}`} aria-busy={busy}>
            <section className={homeStyles.projectRegion} aria-labelledby="home-title">
              <h1 id="home-title">FIRST, WHAT DO YOU WANT REV TO HELP WITH?</h1>
              <fieldset className={homeStyles.originIntent} disabled={busy} aria-describedby="intent-guidance">
                <legend className={homeStyles.screenReaderOnly}>Choose one path</legend>
                <div className={homeStyles.intentOptions}>
                  {ORIGIN_INTENTS.map((intent) => (
                    <label key={intent.value} className={originIntent === intent.value ? homeStyles.intentSelected : ""}>
                      <input
                        type="radio"
                        name="origin-intent"
                        checked={originIntent === intent.value}
                        onChange={() => { setOriginIntent(intent.value); setError(""); }}
                      />
                      <span className={homeStyles.intentIcon} aria-hidden="true">
                        {intent.value === "developing" ? (
                          <svg viewBox="0 0 64 64" focusable="false" data-intent-icon="plasma-ignition">
                            <defs>
                              <radialGradient id="develop-plasma-core" cx="50%" cy="50%" r="50%">
                                <stop offset="0" stopColor="#fff6cf" />
                                <stop offset="0.25" stopColor="#f0ad38" />
                                <stop offset="0.58" stopColor="#4be7ff" stopOpacity="0.8" />
                                <stop offset="1" stopColor="#1679cf" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                            <circle cx="32" cy="32" r="14" fill="url(#develop-plasma-core)" stroke="#61eaff" strokeWidth="1.2" strokeDasharray="2 3" />
                            <circle cx="32" cy="32" r="7" fill="none" stroke="#f2b342" strokeWidth="1.8" />
                            <circle cx="32" cy="32" r="2.8" fill="#fff8d8" stroke="#ffbd43" strokeWidth="1.2" />
                            <path d="m32 2-2 11 3 5-2 9M32 62l2-11-3-5 2-9M2 32l11-2 5 3 9-2M62 32l-11 2-5-3-9 2" stroke="#effcff" />
                            <path d="M8 9l9 8-1 6 9 4M56 55l-9-8 1-6-9-4M8 55l9-8-1-6 9-4M56 9l-9 8 1 6-9 4" stroke="#36cfff" />
                            <path d="M18 4l3 10 6 3M46 60l-3-10-6-3M4 46l10-3 3-6M60 18l-10 3-3 6" stroke="#168df0" />
                            <path d="M12 27h4m32 10h4M27 12v4m10 32v4" stroke="#f0ad38" />
                          </svg>
                        ) : intent.value === "evaluating" ? (
                          <svg viewBox="0 0 64 64" focusable="false" data-intent-icon="scanning-lens">
                            <circle cx="29" cy="28" r="20" fill="none" stroke="#58e4ff" strokeWidth="1.5" />
                            <circle cx="29" cy="28" r="15" fill="none" stroke="#b8f6ff" strokeWidth="1.2" />
                            <circle cx="29" cy="28" r="8" fill="none" stroke="#248fd8" strokeWidth="1" strokeDasharray="2 2" />
                            <path d="M29 10v36M11 28h36M17 16l24 24M17 40l24-24" stroke="#248fd8" strokeWidth="0.75" opacity="0.68" />
                            <path d="M14 18a20 20 0 0 1 30-4" stroke="#f0ad38" strokeWidth="2.2" />
                            <path d="m43 42 15 15" stroke="#ecfbff" strokeWidth="5" />
                            <path d="m43 42 15 15" stroke="#167fc8" strokeWidth="2.2" />
                            <path d="M21 28h16M29 20v16" stroke="#f4fdff" strokeWidth="1" />
                            <circle cx="29" cy="28" r="2.5" fill="#e9fbff" stroke="#55e4ff" strokeWidth="1" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 64 64" focusable="false" data-intent-icon="converging-energy">
                            <circle cx="32" cy="32" r="13" fill="none" stroke="#75eaff" strokeWidth="1.2" strokeDasharray="3 3" />
                            <circle cx="32" cy="32" r="6" fill="none" stroke="#effcff" strokeWidth="1.8" />
                            <circle cx="32" cy="32" r="2.8" fill="#fffde9" stroke="#8defff" strokeWidth="1" />
                            <path d="M2 16h10l4 6 8 2 8 8M2 25h8l5 4 10 1 7 2M2 39h8l5-4 10-1 7-2M2 48h10l4-6 8-2 8-8" stroke="#edae3e" />
                            <path d="M62 16H52l-4 6-8 2-8 8M62 25h-8l-5 4-10 1-7 2M62 39h-8l-5-4-10-1-7-2M62 48H52l-4-6-8-2-8-8" stroke="#39d8ff" />
                            <path d="M6 11l8 7m-8 35 8-7m44-35-8 7m8 35-8-7" stroke="#f5fbff" strokeWidth="0.8" />
                            <path d="M18 32h8m12 0h8M32 18v8m0 12v8" stroke="#f4fdff" strokeWidth="1" />
                          </svg>
                        )}
                      </span>
                      <strong>{intent.label}</strong>
                      <small>{intent.description}</small>
                      <span className={homeStyles.selectedMarker} aria-hidden="true">✓</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p id="intent-guidance" className={homeStyles.intentGuidance}>CHOOSE ONE PATH TO UNLOCK YOUR IDEA</p>
            </section>

            <section className={`${homeStyles.ideaRegion} ${originIntent ? homeStyles.ideaOpen : homeStyles.ideaLocked}`} aria-labelledby="idea-region-title">
              <h2 id="idea-region-title">TELL REV WHAT YOU’RE IMAGINING</h2>
              <p className={homeStyles.ideaGuidance}>Describe your idea in plain language. What should it do, and what matters most to you?</p>
              <textarea
                ref={descriptionInputRef}
                value={description}
                onChange={(event) => { setDescription(event.target.value); setError(""); }}
                rows={6}
                disabled={!originIntent || busy}
                placeholder="Describe your idea once in plain language. What should it do, and what matters most to you?"
                aria-label="Your invention description"
              />
              <div className={homeStyles.consoleAction}>
                <input ref={fileInputRef} className={homeStyles.fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectImage(event.target.files?.[0])} disabled={!originIntent || busy} />
                <button type="button" className={homeStyles.secondaryAction} onClick={() => fileInputRef.current?.click()} disabled={!originIntent || busy || imageBusy}>{selectedImage ? "CHANGE PHOTO" : "ADD PHOTO OR SKETCH"}</button>
                {selectedImage && <button type="button" className={homeStyles.secondaryAction} onClick={removeImage} disabled={!originIntent || busy}>REMOVE</button>}
                <button type="button" className={homeStyles.askRevAction} onClick={() => void askRev()} disabled={!canAskRev}>
                  {busy ? "REV IS LISTENING" : "ASK REV"} <span aria-hidden="true">→</span>
                </button>
              </div>
              <span className={homeStyles.screenReaderOnly} role="status" aria-live="polite">
                {originIntent ? "REV idea entry is open. Describe the invention." : "Choose one intent to open REV idea entry."}
              </span>
              {selectedImage && (
                <div className={homeStyles.imageEvidence}>
                  {imagePreviewUrl && <Image src={imagePreviewUrl} alt="Selected supporting reference preview" width={64} height={64} unoptimized />}
                  <p><strong>{selectedImage.displayName}</strong><br />Supporting evidence remains separate from inventor-authored Project truth.</p>
                </div>
              )}
              {visualInterpretation && <div className={homeStyles.visualUnderstanding}><strong>WHAT REV CAN SEE</strong><p>{visualInterpretation.factualSummary}</p><small>Derived supporting evidence · not inventor authority</small></div>}
              {visualUnderstandingMessage && <p className={homeStyles.information}>{visualUnderstandingMessage}</p>}
              {error && <div className={homeStyles.entryError} role="alert"><p>{error}</p><button type="button" onClick={retryCurrentStep} disabled={busy}>TRY AGAIN DELIBERATELY</button></div>}
            </section>
          </div>
        ) : coverage && (
          <HomeRevUnderstanding
            project={project}
            state={state}
            knowledge={activeKnowledge}
            coverage={coverage}
            question={activeQuestion}
            answer={answer}
            selectedChoiceId={selectedChoiceId}
            busy={busy}
            error={error}
            notice={understandingNotice}
            securedKnowledgeEventId={pulseKnowledgeEventId}
            onAnswerChange={(value) => { setAnswer(value); setError(""); setState("QUESTION_READY"); }}
            onChoiceChange={(choiceId) => { setSelectedChoiceId(choiceId); setError(""); setState("QUESTION_READY"); }}
            onSubmitOwnWords={() => answerQuestion({ kind: "own-words", value: answer })}
            onSubmitChoice={() => answerQuestion({ kind: "choice", choiceId: selectedChoiceId })}
            onUseRecommendation={() => answerQuestion({ kind: "rev-recommendation" })}
            onRetry={retryCurrentStep}
          />
        )}

        <section className={homeStyles.coreCreation} aria-labelledby="core-creation-heading">
          <h2 id="core-creation-heading">CORE CREATION</h2>
          <ul>
            {HOME_CREATION_STATUS.map((label, index) => (
              <li key={label} className={index < 2 ? homeStyles.coreItem : ""}>
                <span aria-hidden="true">{index === 0 ? "◇" : index === 1 ? "⬡" : "○"}</span>
                <strong>{label}</strong>
                <small>{index < 2 ? "BEGINS AFTER READINESS" : "WORKSHOP OUTPUT · NOT STARTED"}</small>
              </li>
            ))}
          </ul>
        </section>
      </section>
      <style jsx>{`
        .entry{box-sizing:border-box;width:min(100%,98rem);color:#edf5f7}.console-regions{display:grid;grid-template-columns:minmax(19rem,42fr) minmax(0,58fr);overflow:hidden;border:1px solid rgba(80,189,216,.52);border-radius:12px;background:linear-gradient(120deg,rgba(5,17,30,.94),rgba(4,14,25,.9));box-shadow:0 24px 68px rgba(0,0,0,.48);backdrop-filter:blur(11px)}.project-region,.idea-region{box-sizing:border-box;min-width:0;padding:clamp(1rem,2vw,1.5rem)}.project-region{border-right:1px solid rgba(91,174,195,.34)}h1,h2{margin:0;color:#f4f6f4;font-weight:560;line-height:1.08;letter-spacing:-.025em}h1{font-size:clamp(1.45rem,2.2vw,2.1rem)}h2{font-size:clamp(1.25rem,2vw,1.8rem)}.origin-intent{margin:1rem 0 0;padding:0;border:0}.origin-intent legend{color:#86aeb9;font-size:.68rem;font-weight:760;letter-spacing:.08em}.origin-options{display:grid;gap:.55rem;margin-top:.55rem}.origin-options label{display:grid;grid-template-columns:2rem minmax(0,1fr);align-items:center;min-height:3rem;padding:.5rem .7rem;border:1px solid rgba(72,129,146,.65);border-radius:.35rem;background:rgba(3,15,25,.48);cursor:pointer}.origin-options input{position:absolute;opacity:0}.origin-options label>span{color:#85e8f7;font-size:1.35rem}.origin-options strong{font-size:.72rem;letter-spacing:.045em}.origin-options label.is-selected{border-color:#dda850;background:linear-gradient(135deg,rgba(41,132,156,.3),rgba(162,104,38,.21))}.origin-options label:focus-within{outline:3px solid #8ce9fb;outline-offset:2px}.safety-status{margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(85,160,181,.28);color:#8fc3ce;font-size:.65rem;font-weight:800;letter-spacing:.08em}.idea-region textarea{box-sizing:border-box;width:100%;min-height:9rem;margin-top:.75rem;padding:.8rem;border:1px solid #416878;border-radius:.4rem;resize:vertical;outline:none;background:rgba(4,14,23,.76);color:#f4f8f8;font:inherit;line-height:1.5}.idea-region textarea:focus-visible{border-color:#81e8f7;box-shadow:0 0 0 3px rgba(70,208,232,.17)}.console-action{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.7rem}.file-input{display:none}.console-action button,.entry-error button{min-height:2.75rem;padding:.6rem .85rem;border:1px solid #48869a;border-radius:.35rem;background:rgba(8,31,43,.88);color:#e8fbff;font-size:.7rem;font-weight:850;letter-spacing:.06em;cursor:pointer}.console-action .ask-rev{margin-left:auto;border-color:#e0ac55;background:linear-gradient(180deg,#b87b2f,#81511f);color:#fff8ea}.console-action button:focus-visible,.entry-error button:focus-visible{outline:3px solid #89ecfb;outline-offset:3px}.console-action button:disabled{opacity:.46;cursor:not-allowed}.image-evidence{display:grid;grid-template-columns:4rem minmax(0,1fr);align-items:center;gap:.7rem;margin-top:.75rem;color:#a9c0c6;font-size:.72rem}.image-evidence img{width:4rem;height:4rem;object-fit:contain;border-radius:.35rem;background:#02080d}.visual-understanding{margin-top:.7rem;padding:.65rem;border:1px solid rgba(64,112,128,.72);border-radius:.4rem;background:rgba(5,17,27,.6)}.visual-understanding strong{color:#81e1f0;font-size:.68rem;letter-spacing:.1em}.visual-understanding p{margin:.3rem 0}.visual-understanding small,.information{color:#8ca3ab;font-size:.65rem}.entry-error{margin-top:.7rem;color:#ffb6a9}.entry-error p{margin:0 0 .5rem}.core-creation{margin-top:.7rem;padding:.7rem;border:1px solid rgba(57,118,138,.42);border-radius:.65rem;background:rgba(4,14,24,.82)}.core-creation h2{color:#dfa94f;font-size:.72rem;font-weight:850;letter-spacing:.13em;text-align:center}.core-creation ul{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:.35rem;margin:.55rem 0 0;padding:0;list-style:none}.core-creation li{display:grid;justify-items:center;align-content:start;min-width:0;min-height:5rem;color:#6f98a4;text-align:center}.core-creation li>span{font-size:2rem;color:#4c98aa}.core-creation li.core>span{color:#9fefff;text-shadow:0 0 .7rem rgba(79,211,238,.72)}.core-creation li strong{font-size:.59rem;line-height:1.2}.core-creation li small{display:none}@media(max-width:900px){.console-regions{grid-template-columns:1fr}.project-region{border-right:0;border-bottom:1px solid rgba(91,174,195,.34)}.core-creation ul{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:560px){.console-action{display:grid;grid-template-columns:1fr}.console-action button,.console-action .ask-rev{width:100%;margin-left:0}.core-creation ul{grid-template-columns:repeat(2,minmax(0,1fr))}.core-creation li{min-height:5.5rem}}.entry :global(button:disabled),.entry :global(fieldset:disabled){cursor:not-allowed}
        /* VPB-HOME-004 — blank intent-gated Home */
        .entry{width:100%;max-width:none}
        .screen-reader-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .console-regions{grid-template-columns:minmax(0,56%) minmax(0,44%);border-color:rgba(48,176,212,.62);border-radius:.5rem;background:linear-gradient(112deg,rgba(3,18,31,.97),rgba(2,12,22,.94));box-shadow:0 1.35rem 4.8rem rgba(0,0,0,.58),inset 0 0 1.6rem rgba(40,156,193,.08);transition:border-color .25s ease,box-shadow .25s ease}
        .project-region,.idea-region{padding:clamp(.85rem,1.25vw,1.2rem)}
        .project-region{position:relative;border-right:1px solid rgba(75,154,181,.42);transition:border-color .25s ease,box-shadow .25s ease}
        .awaiting-intent .project-region{border-color:rgba(78,223,255,.88);box-shadow:inset 0 0 1.4rem rgba(36,186,224,.18),0 0 1rem rgba(30,175,222,.34)}
        .project-region h1,.idea-region h2{font-size:clamp(.94rem,1.12vw,1.15rem);font-weight:680;letter-spacing:.035em;text-shadow:0 .12rem .32rem rgba(0,0,0,.94)}
        .origin-intent{margin:.72rem 0 0}
        .origin-options{grid-template-columns:repeat(3,minmax(0,1fr));gap:.72rem;margin-top:0}
        .origin-options label{position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:3.35rem auto 1fr;justify-items:center;align-items:start;align-content:start;min-height:8.7rem;padding:.72rem .56rem .6rem;border:1px solid rgba(59,192,225,.76);border-radius:.42rem;background:linear-gradient(160deg,rgba(7,34,52,.96),rgba(2,18,30,.96));box-shadow:inset 0 0 1rem rgba(38,143,177,.08),0 .45rem 1rem rgba(0,0,0,.24);text-align:center;transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
        .origin-options label:hover{transform:translateY(-2px);border-color:#8befff;box-shadow:inset 0 0 1.1rem rgba(59,197,234,.16),0 0 1rem rgba(42,187,225,.2)}
        .origin-options label.is-selected{border-color:#e0ac55;background:linear-gradient(155deg,rgba(20,102,151,.96),rgba(6,48,78,.97));box-shadow:inset 0 0 1.35rem rgba(88,216,247,.27),0 0 .2rem #e0ac55,0 0 1.1rem rgba(48,191,232,.42)}
        .origin-options label>span.intent-icon{display:grid;place-items:center;width:3rem;height:3rem;color:#e0a743;font-size:inherit}
        .intent-icon svg{display:block;width:2.9rem;height:2.9rem;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 .3rem rgba(222,163,60,.42))}
        .origin-options label:nth-child(2) .intent-icon{color:#a8efff}
        .origin-options label:nth-child(3) .intent-icon{color:#e0a743}
        .origin-options strong{align-self:start;color:#f3f7f8;font-size:clamp(.64rem,.72vw,.74rem);font-weight:730;line-height:1.18;letter-spacing:.015em}
        .origin-options small{display:block;margin-top:.28rem;color:#bacbd1;font-size:clamp(.58rem,.64vw,.66rem);line-height:1.28}
        .selected-marker{position:absolute;top:.48rem;right:.48rem;display:none!important;place-items:center;width:1.35rem!important;height:1.35rem!important;border:1px solid #e4ae4f;border-radius:50%;color:#ffd476!important;font-size:.78rem!important;font-weight:900;background:#132a34;box-shadow:0 0 .55rem rgba(224,170,72,.55)}
        .origin-options label.is-selected .selected-marker{display:grid!important}
        .intent-guidance{margin:.48rem 0 -.14rem;color:#a9c4cd;font-size:.61rem;font-weight:690;letter-spacing:.045em;text-align:center}
        .idea-region{position:relative;border-right:0;transition:opacity .25s ease,filter .25s ease,box-shadow .25s ease}
        .idea-region.is-locked{opacity:.42;filter:saturate(.35)}
        .idea-region.is-open{box-shadow:inset 0 0 1.2rem rgba(35,157,196,.08)}
        .idea-guidance{margin:.28rem 0 0;color:#a9bcc4;font-size:.66rem;line-height:1.35}
        .idea-region textarea{min-height:5rem;height:5rem;margin-top:.5rem;padding:.62rem .72rem;border-color:rgba(66,118,137,.82);border-radius:.35rem;background:rgba(1,10,18,.82);font-size:.78rem;line-height:1.4}
        .idea-region textarea:disabled{resize:none}
        .console-action{align-items:center;margin-top:.58rem}
        .console-action button,.entry-error button{min-height:2.55rem;border-radius:.32rem}
        .console-action .secondary{padding-left:2.05rem;background:linear-gradient(180deg,rgba(6,40,55,.96),rgba(3,23,34,.96));position:relative}
        .console-action .secondary:before{content:"◇";position:absolute;left:.78rem;color:#83e8fb;font-size:1rem}
        .console-action .ask-rev{min-width:9rem;border-color:#e2a846;background:linear-gradient(180deg,#b47829,#754617);box-shadow:inset 0 0 .75rem rgba(255,205,113,.14),0 0 .7rem rgba(214,145,44,.26)}
        .console-action .ask-rev:disabled{border-color:#637078;background:rgba(40,44,48,.82);box-shadow:none;color:#9ca3a7}
        .core-creation{margin-top:.45rem;padding:.65rem .9rem .55rem;border-radius:.5rem;border-color:rgba(45,147,179,.58);background:linear-gradient(180deg,rgba(3,19,32,.96),rgba(2,12,22,.96));box-shadow:0 .8rem 2.4rem rgba(0,0,0,.4)}
        .core-creation h2{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0)}
        .core-creation ul{gap:.2rem;margin:0}
        .core-creation li{min-height:7.3rem;align-content:start;padding:.15rem .18rem;color:#d2dde0}
        .core-creation li>span{display:grid;place-items:center;width:4.5rem;height:4.5rem;margin:0 auto .2rem;border:1px solid rgba(51,171,204,.54);border-radius:50%;color:#5cdfff;font-size:2.3rem;background:radial-gradient(circle,rgba(25,126,164,.34),rgba(2,16,28,.2) 65%);box-shadow:inset 0 0 1rem rgba(55,181,218,.2),0 0 .8rem rgba(32,148,190,.25)}
        .core-creation li.core>span{border-color:rgba(223,164,69,.76);color:#87ecff;box-shadow:inset 0 0 1rem rgba(64,199,237,.24),0 0 .8rem rgba(224,161,61,.38)}
        .core-creation li strong{font-size:clamp(.55rem,.62vw,.65rem);font-weight:620;line-height:1.2}
        @media(max-width:1100px){.console-regions{grid-template-columns:1fr}.project-region{border-right:0;border-bottom:1px solid rgba(75,154,181,.42)}.origin-options label{min-height:8rem}.core-creation ul{grid-template-columns:repeat(4,minmax(0,1fr))}}
        @media(max-width:620px){.project-region,.idea-region{padding:.8rem}.origin-options{grid-template-columns:1fr}.origin-options label{grid-template-columns:3.2rem minmax(0,1fr);grid-template-rows:auto auto;justify-items:start;align-items:center;min-height:5.2rem;padding:.58rem .75rem;text-align:left}.origin-options label>span.intent-icon{grid-row:1/3}.origin-options small{margin-top:.15rem}.selected-marker{display:none!important;grid-row:auto!important}.origin-options label.is-selected .selected-marker{display:grid!important;position:absolute}.core-creation ul{grid-template-columns:repeat(2,minmax(0,1fr))}.core-creation li{min-height:6.8rem}.console-action{display:grid;grid-template-columns:1fr}.console-action .ask-rev{min-width:0}}
        @media(prefers-reduced-motion:reduce){.console-regions,.project-region,.idea-region,.origin-options label{transition:none}.origin-options label:hover{transform:none}}
      `}</style>
    </HomeVisualShell>
  );
}
