"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import HomeRevUnderstanding from "./components/HomeRevUnderstanding";
import HomeVisualShell from "./components/HomeVisualShell";
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

const ORIGIN_INTENTS: Array<{ value: ProjectOriginIntent; label: string }> = [
  { value: "developing", label: "I’M DEVELOPING MY IDEA" },
  { value: "evaluating", label: "I’M EVALUATING AN IDEA" },
  { value: "both", label: "I’M DOING BOTH" },
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
const HAI2_MOCK_ROUTE_AVAILABLE = process.env.NEXT_PUBLIC_REAIDEA_HAI2_MOCK_CAPABILITY === "mock" && process.env.NODE_ENV !== "production";
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
    if (!HAI2_MOCK_ROUTE_AVAILABLE) {
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
    <HomeVisualShell knowledgePulseActive={Boolean(pulseKnowledgeEventId)} knowledgePulseKey={pulseKnowledgeEventId}>
      <section className="entry" aria-labelledby="home-title">
        {!project ? (
          <div className="console-regions" aria-busy={busy}>
            <section className="project-region" aria-labelledby="home-title">
              <h1 id="home-title">WHAT BRINGS YOU HERE?</h1>
              <fieldset className="origin-intent" disabled={busy}>
                <legend>Choose one starting point</legend>
                <div className="origin-options">
                  {ORIGIN_INTENTS.map((intent) => (
                    <label key={intent.value} className={originIntent === intent.value ? "is-selected" : ""}>
                      <input type="radio" name="origin-intent" checked={originIntent === intent.value} onChange={() => setOriginIntent(intent.value)} />
                      <span aria-hidden="true">◇</span>
                      <strong>{intent.label}</strong>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="safety-status" role="status" aria-live="polite">
                {state === "SAFETY_CHECKING" ? "REV IS CHECKING THE CREATION BOUNDARY" : "NO PROJECT EXISTS UNTIL SAFETY IS CLEAR"}
              </div>
            </section>

            <section className="idea-region" aria-labelledby="idea-region-title">
              <h2 id="idea-region-title">TELL REV WHAT YOU’RE IMAGINING</h2>
              <textarea
                value={description}
                onChange={(event) => { setDescription(event.target.value); setError(""); }}
                rows={6}
                disabled={busy}
                placeholder="Describe your idea once in plain language. What should it do, and what matters most to you?"
                aria-label="Your invention description"
              />
              <div className="console-action">
                <input ref={fileInputRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectImage(event.target.files?.[0])} disabled={busy} />
                <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy || imageBusy}>{selectedImage ? "CHANGE PHOTO" : "ADD PHOTO OR SKETCH"}</button>
                {selectedImage && <button type="button" className="secondary" onClick={removeImage} disabled={busy}>REMOVE</button>}
                <button type="button" className="ask-rev" onClick={() => void askRev()} disabled={!canAskRev}>
                  {busy ? "REV IS LISTENING" : "ASK REV"} <span aria-hidden="true">→</span>
                </button>
              </div>
              {selectedImage && (
                <div className="image-evidence">
                  {imagePreviewUrl && <Image src={imagePreviewUrl} alt="Selected supporting reference preview" width={64} height={64} unoptimized />}
                  <p><strong>{selectedImage.displayName}</strong><br />Supporting evidence remains separate from inventor-authored Project truth.</p>
                </div>
              )}
              {visualInterpretation && <div className="visual-understanding"><strong>WHAT REV CAN SEE</strong><p>{visualInterpretation.factualSummary}</p><small>Derived supporting evidence · not inventor authority</small></div>}
              {visualUnderstandingMessage && <p className="information">{visualUnderstandingMessage}</p>}
              {error && <div className="entry-error" role="alert"><p>{error}</p><button type="button" onClick={retryCurrentStep} disabled={busy}>TRY AGAIN DELIBERATELY</button></div>}
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

        <section className="core-creation" aria-labelledby="core-creation-heading">
          <h2 id="core-creation-heading">CORE CREATION</h2>
          <ul>
            {HOME_CREATION_STATUS.map((label, index) => (
              <li key={label} className={index < 2 ? "core" : ""}>
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
      `}</style>
    </HomeVisualShell>
  );
}
