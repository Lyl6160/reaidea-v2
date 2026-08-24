"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import HomeVisualShell from "./components/HomeVisualShell";
import { createProject, recordHomeSourceImage, type Project, type ProjectOriginIntent } from "./lib/core/project";
import { savePreferredName } from "./lib/core/inventorStorage";
import { loadProject, saveProject } from "./lib/core/storageEngine";
import {
  createSourceImageReference,
  saveProjectSourceImage,
  sourceImageToDataUrl,
  validateSourceImage,
  type ValidatedSourceImage,
} from "./lib/core/projectSourceEvidenceStorage";
import { assessHomeUnderstanding } from "./lib/workshop/revWorkingUnderstanding";
import {
  runInitialCoreCreation,
  runInitialCoreCreationTransaction,
  isInitialCoreCreationActive,
  type InitialCoreCreationPhase,
  type InitialCoreCreationResult,
} from "./lib/workshop/initialCoreCreation";
import { persistInitialCoreCreationReceipt, restoreInitialCoreCreationReceipt } from "./lib/workshop/conceptCandidateStorage";
import type { RevImageSafetyReceipt, VisualUnderstandingApiResponse, VisualUnderstandingResult } from "./lib/ai/types";

const BLOCKED_IMAGE_MESSAGE = "REV can’t use that image. Choose another image or continue without one.";

const HOME_WORKFLOW_STAGES = [
  "YOUR IDEA",
  "CONCEPT GENERATING",
  "REV BUILDING",
  "INVENTION READINESS",
] as const;

const HOME_CREATION_STATUS = [
  { label: "VISUAL CONCEPT", detail: "Begins in Workshop.", core: true, icon: "visual" },
  { label: "INTERACTIVE 3D MODEL", detail: "Available when validated geometry exists.", core: true, icon: "model" },
  { label: "ENGINEERING DIRECTION", detail: "Developed in Workshop.", core: false, icon: "engineering" },
  { label: "TESTING PLAN", detail: "Available after useful checks are defined.", core: false, icon: "testing" },
  { label: "PATENT / IP FINDINGS", detail: "Available later · not completed.", core: false, icon: "patent" },
  { label: "MANUFACTURING CONSIDERATIONS", detail: "Available later · not completed.", core: false, icon: "manufacturing" },
  { label: "MARKET INSIGHT", detail: "Available later · not completed.", core: false, icon: "market" },
  { label: "REALITY CHECK", detail: "Available later · not completed.", core: false, icon: "reality" },
] as const;

const ORIGIN_INTENTS: Array<{ value: ProjectOriginIntent; label: string; icon: "bulb" | "search" | "both" }> = [
  { value: "developing", label: "I’M DEVELOPING MY IDEA", icon: "bulb" },
  { value: "evaluating", label: "I’M EVALUATING AN IDEA", icon: "search" },
  { value: "both", label: "I’M DOING BOTH", icon: "both" },
];

type HomeCreationIconKind = (typeof HOME_CREATION_STATUS)[number]["icon"];

function HomeCreationIcon({ kind }: { kind: HomeCreationIconKind }) {
  if (kind === "visual") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <ellipse className="icon-gold-accent icon-base" cx="20" cy="32.5" rx="15" ry="3.8" />
      <path className="icon-depth" d="m9 13.2 11 6.3v13.4l-11-6.2V13.2Z" />
      <path className="icon-depth" d="m20 19.5 11-6.3v13.5L20 32.9V19.5Z" />
      <path d="m20 5 11 6.3-11 6.2-11-6.2L20 5Z" />
      <path d="m9 11.3 11 6.2 11-6.2M20 17.5v15.4M14.2 8.2 25.7 14.8M25.7 8.2 14.2 14.8" />
      <path className="icon-highlight" d="m11.5 12.7 8.5 4.8 8.5-4.8" />
    </svg>
  );
  if (kind === "model") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path className="icon-depth" d="m11 14.2 9 5.3V31l-9-5.3V14.2Z" />
      <path className="icon-depth" d="m20 19.5 9-5.3v11.5L20 31V19.5Z" />
      <path d="m20 8 9 5.2-9 5.3-9-5.3L20 8Z" />
      <path d="m11 13.2 9 5.3 9-5.3M20 18.5V31M15.2 10.8l9.6 5.5M24.8 10.8l-9.6 5.5" />
      <ellipse className="icon-gold-accent" cx="20" cy="20" rx="17" ry="7.5" transform="rotate(-18 20 20)" />
      <path className="icon-gold-accent" d="m34.8 12.2 1.2 4-4.1-.3" />
    </svg>
  );
  if (kind === "engineering") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <ellipse className="icon-base" cx="20" cy="34.5" rx="12" ry="2.5" />
      <path className="icon-depth" d="m19 11-7.7 22h3.8l6.3-19.5L19 11ZM22 11l7.7 22h-3.8l-6.3-19.5L22 11Z" />
      <circle cx="20" cy="8" r="3" /><circle className="icon-highlight" cx="20" cy="8" r="1.1" />
      <path d="m18.2 11-8 23M21.8 11l8 23M12.5 27h15M9 34h5M26 34h5M14 20l12-5" />
    </svg>
  );
  if (kind === "testing") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path className="icon-depth" d="M11 9.5h23v26H11Z" /><rect x="8" y="7" width="24" height="29" rx="2.5" />
      <path className="icon-highlight" d="M10 9h20" /><path d="M15 7V4h10v3M13 16l2.2 2.2 4-4M22 17h6M13 25l2.2 2.2 4-4M22 26h6" />
    </svg>
  );
  if (kind === "patent") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path className="icon-depth" d="m22 5 12 4v10c0 8-4.5 14.2-12 18V5Z" />
      <path d="M20 4 32 8v10c0 8.2-4.7 14.3-12 18-7.3-3.7-12-9.8-12-18V8l12-4Z" />
      <path className="icon-highlight" d="m20 6 9.5 3.2" /><circle cx="20" cy="18" r="5" /><circle className="icon-highlight" cx="20" cy="18" r="2" />
      <path d="M20 13v10M15 18h10M16 28h8" />
    </svg>
  );
  if (kind === "manufacturing") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path className="icon-depth" d="M8 35V19l10 6v-7l10 6v-7l10 6v12H8Z" />
      <path d="M5 35V17l10 6v-7l10 6v-7l10 6v14H5Z" />
      <path className="icon-highlight" d="M7 33h25M9 19V7h7v12" /><path d="M11 30h4M20 30h4M29 30h3" />
      <path className="manufacturing-sparks" d="m28 10 2-4M33 13l4-2M25 8l-1-4m9 10 2-5M30 7l4-3" />
    </svg>
  );
  if (kind === "market") return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path className="icon-depth" d="M11 34v-8h6v8M21 34V20h6v14M31 34V13h6v21" />
      <path d="M6 34h29M9 31v-8h6v8M19 31V17h6v14M29 31V10h6v21M9 17l8-7 7 3 10-8" />
      <path className="icon-highlight" d="M10 23h4M20 17h4M30 10h4" /><path d="m29 5 5 .2-.4 5" />
    </svg>
  );
  return (
    <svg className="status-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <ellipse className="icon-gold-accent icon-base" cx="20" cy="33" rx="15" ry="3.5" /><circle className="icon-depth" cx="21.5" cy="21.5" r="15" />
      <circle cx="20" cy="20" r="15" /><circle className="icon-highlight" cx="20" cy="20" r="11.5" />
      <path d="m12.5 20.5 5 5 10-11" />
    </svg>
  );
}

function OriginIntentIcon({ kind }: { kind: "bulb" | "search" | "both" }) {
  if (kind === "bulb") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><path className="origin-depth" d="M9.2 16.2C7.8 15 7 13.4 7 11.2a5.6 5.6 0 0 1 10.8-2.1" /><path d="M8.3 15.8C6.9 14.7 6 13 6 10.9a6 6 0 0 1 12 0c0 2.1-.9 3.8-2.3 4.9-.7.6-1.1 1.4-1.1 2.3H9.4c0-.9-.4-1.7-1.1-2.3Z" /><path className="origin-highlight" d="M8.4 10.2a3.9 3.9 0 0 1 3.2-3.5" /><path className="origin-gold" d="m10 11 2 2 2-2m-2 2v5" /><path d="M9.5 19h5M10 21h4M9 4.5 7.5 3M15 4.5 16.5 3M4.8 10H3M21 10h-1.8" /></svg>;
  if (kind === "search") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><circle className="origin-depth" cx="11.5" cy="11.5" r="6" /><circle cx="10.5" cy="10.5" r="5.8" /><path className="origin-highlight" d="M7.3 9a3.8 3.8 0 0 1 3.5-2.3" /><path className="origin-metal" d="m15 15 5 5" /><path className="origin-highlight" d="m15.8 15.2 4.4 4.4" /><path d="M10.5 7.6v5.8M7.6 10.5h5.8" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><ellipse className="origin-depth" cx="9.2" cy="12.8" rx="5.2" ry="4.8" /><circle cx="8.4" cy="12" r="5" /><circle className="origin-gold" cx="15.6" cy="12" r="5" /><path className="origin-highlight" d="M6.2 8.2a4.7 4.7 0 0 1 4.2-.5M14 8a4.6 4.6 0 0 1 4 .5" /></svg>;
}

function normalizeBlockedContext(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeAttemptContext(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

interface ImageUnderstandingAttempt {
  token: string;
  evidenceId: string;
  inventorContext: string;
  controller: AbortController;
}

type ClearedImageUnderstanding = {
  interpretation: VisualUnderstandingResult;
  safetyReceipt: RevImageSafetyReceipt;
};

export default function Home() {
  const [preferredName] = useState("");
  const [originIntent, setOriginIntent] = useState<ProjectOriginIntent | null>(null);
  const [description, setDescription] = useState("");
  const [, setHelpingQuestion] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<ValidatedSourceImage | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageInvalid, setImageInvalid] = useState(false);
  const [visualInterpretation, setVisualInterpretation] = useState<VisualUnderstandingResult | null>(null);
  const [imageSafetyState, setImageSafetyState] = useState<"unchecked" | "checking" | "CLEAR" | "HOLD" | "BLOCK" | "unavailable">("unchecked");
  const [imageSafetyReceipt, setImageSafetyReceipt] = useState<RevImageSafetyReceipt | null>(null);
  const [, setVisualUnderstandingState] = useState<"idle" | "working" | "ready" | "failed" | "unsupported">("idle");
  const [visualUnderstandingMessage, setVisualUnderstandingMessage] = useState("");
  const [blockedInventorContext, setBlockedInventorContext] = useState("");
  const [initialProject, setInitialProject] = useState<Project | null>(null);
  const [creationPhase, setCreationPhase] = useState<InitialCoreCreationPhase | "idle" | "failed">("idle");
  const [retryPersistence, setRetryPersistence] = useState<(() => Promise<InitialCoreCreationResult>) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewUrlRef = useRef("");
  const imageUnderstandingAttemptRef = useRef<ImageUnderstandingAttempt | null>(null);
  const projectCreationStartedRef = useRef(false);
  const router = useRouter();
  const understanding = useMemo(
    () => assessHomeUnderstanding(description, visualInterpretation ?? undefined),
    [description, visualInterpretation]
  );
  const blockedContextActive = Boolean(blockedInventorContext) &&
    normalizeBlockedContext(description) === blockedInventorContext;
  const readyToStart = understanding.ready && !blockedContextActive;
  const creationActive = isInitialCoreCreationActive(creationPhase);
  const currentWorkflowStage = creationPhase === "reading" || creationPhase === "generating" ? 1 : creationPhase === "building" ? 2 : creationPhase === "opening" ? 3 : understanding.ready ? 0 : -1;
  const liveCreationStatus = creationPhase === "reading" ? "REV IS READING YOUR SKETCH"
    : creationPhase === "saving" ? "REV IS SAVING YOUR PROJECT"
      : creationPhase === "generating" ? "REV IS CREATING CONCEPT 01"
        : creationPhase === "building" ? "REV IS SECURING YOUR CREATION"
          : creationPhase === "opening" ? "OPENING YOUR WORKSHOP"
            : creationPhase === "failed" ? "CREATION PAUSED"
              : understanding.ready ? "READY TO BEGIN" : "WAITING FOR DETAIL";

  useEffect(() => {
    return () => {
      const attempt = imageUnderstandingAttemptRef.current;
      imageUnderstandingAttemptRef.current = null;
      attempt?.controller.abort();
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const project = loadProject();
    if (!project) return;
    void restoreInitialCoreCreationReceipt(project.id).then((receipt) => {
      if (!receipt) return;
      setInitialProject(project);
      setOriginIntent(project.originIntent ?? null);
      setDescription(project.originalObservation);
      setCreationPhase("failed");
      if (receipt.status === "creating") {
        const occurredAt = new Date().toISOString();
        void persistInitialCoreCreationReceipt({
          ...receipt,
          status: "failed",
          updatedAt: occurredAt,
          diagnostic: {
            correlationId: receipt.correlationId,
            category: "interrupted",
            providerOperationAttempts: "unknown",
            occurredAt,
            retryable: true,
          },
        }).catch(() => undefined);
      }
      setError(receipt.status === "creating"
        ? "Concept creation was interrupted. Start another creation attempt when you are ready."
        : "REV could not complete Concept 01. You can deliberately start another creation attempt.");
    }).catch(() => undefined);
  }, []);

  function revokeImagePreview() {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = "";
  }

  async function selectImage(file: File | undefined) {
    if (!file) return;
    invalidateImageUnderstandingAttempt();
    setImageBusy(true);
    setError("");
    setVisualInterpretation(null);
    setVisualUnderstandingState("idle");
    setVisualUnderstandingMessage("");
    setImageSafetyState("unchecked");
    setImageSafetyReceipt(null);
    setHelpingQuestion("");
    try {
      const validated = await validateSourceImage(file);
      revokeImagePreview();
      const objectUrl = URL.createObjectURL(validated.blob);
      imagePreviewUrlRef.current = objectUrl;
      setSelectedImage(validated);
      setImageInvalid(false);
      setVisualUnderstandingMessage("START WITH REV to check and understand this image.");
    } catch (validationError) {
      revokeImagePreview();
      setSelectedImage(null);
      setImageInvalid(true);
      setError(validationError instanceof Error ? validationError.message : "REV couldn't read this image.");
    } finally {
      setImageBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    const restoreBlockedContext = Boolean(blockedInventorContext) &&
      normalizeBlockedContext(description) === blockedInventorContext;
    invalidateImageUnderstandingAttempt();
    revokeImagePreview();
    setSelectedImage(null);
    setImageInvalid(false);
    setVisualInterpretation(null);
    setVisualUnderstandingState("idle");
    setVisualUnderstandingMessage(restoreBlockedContext ? BLOCKED_IMAGE_MESSAGE : "");
    setImageSafetyState(restoreBlockedContext ? "BLOCK" : "unchecked");
    setImageSafetyReceipt(null);
    setHelpingQuestion("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function markImageUnavailable() {
    setVisualInterpretation(null);
    setImageSafetyReceipt(null);
    setImageSafetyState("unavailable");
    setVisualUnderstandingState("failed");
    setVisualUnderstandingMessage("REV couldn’t check this image. Try again, or remove it to continue without the image.");
    setHelpingQuestion("");
  }

  function invalidateImageUnderstandingAttempt() {
    const attempt = imageUnderstandingAttemptRef.current;
    imageUnderstandingAttemptRef.current = null;
    attempt?.controller.abort();
  }

  async function understandSelectedImage(
    image: ValidatedSourceImage,
    inventorDescription: string
  ): Promise<ClearedImageUnderstanding | null> {
    if (!navigator.onLine) {
      markImageUnavailable();
      return null;
    }
    setHelpingQuestion("");
    setVisualUnderstandingState("working");
    setImageSafetyState("checking");
    setVisualUnderstandingMessage("");
    const evidenceReference = createSourceImageReference(image.evidenceId);
    const attempt: ImageUnderstandingAttempt = {
      token: globalThis.crypto.randomUUID(),
      evidenceId: image.evidenceId,
      inventorContext: normalizeAttemptContext(inventorDescription),
      controller: new AbortController(),
    };
    imageUnderstandingAttemptRef.current = attempt;
    const isCurrentAttempt = () => {
      const current = imageUnderstandingAttemptRef.current;
      return current?.token === attempt.token &&
        current.evidenceId === attempt.evidenceId &&
        current.inventorContext === attempt.inventorContext;
    };
    const handleOffline = () => {
      if (!isCurrentAttempt()) return;
      imageUnderstandingAttemptRef.current = null;
      attempt.controller.abort();
      markImageUnavailable();
    };
    window.addEventListener("offline", handleOffline);
    try {
      const dataUrl = await sourceImageToDataUrl(image);
      if (!isCurrentAttempt()) return null;
      const response = await fetch("/api/understanding/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: attempt.controller.signal,
        body: JSON.stringify({
          requestId: attempt.token,
          evidenceReference,
          mediaType: image.mediaType,
          dataUrl,
          ...(inventorDescription.trim() ? { inventorDescription: inventorDescription.trim() } : {}),
        }),
      });
      const payload = await response.json() as VisualUnderstandingApiResponse;
      if (!isCurrentAttempt()) return null;
      if (!response.ok || "error" in payload) {
        markImageUnavailable();
        return null;
      }
      if (payload.safety.decision === "BLOCK") {
        revokeImagePreview();
        setSelectedImage(null);
        setVisualInterpretation(null);
        setImageSafetyReceipt(null);
        setBlockedInventorContext(normalizeBlockedContext(inventorDescription));
        setImageSafetyState("BLOCK");
        setVisualUnderstandingState("failed");
        setVisualUnderstandingMessage(BLOCKED_IMAGE_MESSAGE);
        setHelpingQuestion("");
        return null;
      }
      if (payload.safety.decision === "HOLD") {
        setVisualInterpretation(null);
        setImageSafetyReceipt(null);
        setImageSafetyState("HOLD");
        setVisualUnderstandingState("idle");
        setVisualUnderstandingMessage("");
        setHelpingQuestion(payload.safety.question);
        return null;
      }
      if (payload.safety.decision === "unavailable") {
        markImageUnavailable();
        return null;
      }
      if (!("interpretation" in payload)) throw new Error("REV did not return a cleared interpretation.");
      if (payload.interpretation.evidenceReference !== evidenceReference) {
        throw new Error("Interpretation provenance did not match the selected evidence.");
      }
      setVisualInterpretation(payload.interpretation);
      setImageSafetyReceipt(payload.safety.receipt);
      setImageSafetyState("CLEAR");
      setVisualUnderstandingState("ready");
      const nextUnderstanding = assessHomeUnderstanding(inventorDescription, payload.interpretation);
      setHelpingQuestion(nextUnderstanding.ready ? "" : nextUnderstanding.helperQuestion);
      return { interpretation: payload.interpretation, safetyReceipt: payload.safety.receipt };
    } catch {
      if (!isCurrentAttempt()) return null;
      markImageUnavailable();
      return null;
    } finally {
      window.removeEventListener("offline", handleOffline);
      if (isCurrentAttempt()) imageUnderstandingAttemptRef.current = null;
    }
  }

  async function startWithRev() {
    const completeDescription = description.trim();
    const submittedImage = selectedImage;
    const submittedOriginIntent = originIntent;
    if (blockedContextActive || !submittedOriginIntent || !understanding.ready || !completeDescription || imageBusy || imageInvalid || projectCreationStartedRef.current) return;
    projectCreationStartedRef.current = true;
    let persistedProject: Project | null = initialProject;
    let returnedImageUnderstanding: ClearedImageUnderstanding | null = null;
    try {
      setError("");
      setRetryPersistence(null);
      const result = await runInitialCoreCreationTransaction({
        onPhase: setCreationPhase,
        saveProject: async () => {
          if (persistedProject) return persistedProject;
          const inventor = savePreferredName(preferredName);
          const project = createProject({ ownerId: inventor.id, originalObservation: completeDescription, originIntent: submittedOriginIntent });
          if (!saveProject(project) || loadProject()?.id !== project.id) throw new Error("Project save failed.");
          persistedProject = project;
          setInitialProject(project);
          return project;
        },
        ...(submittedImage && !(visualInterpretation && imageSafetyReceipt && imageSafetyState === "CLEAR")
          ? { understandReference: async () => {
            returnedImageUnderstanding = await understandSelectedImage(submittedImage, completeDescription);
            return returnedImageUnderstanding?.interpretation ?? null;
          } }
          : {}),
        createConcept: async (project, returnedInterpretation, onPhase) => {
          const interpretation = returnedInterpretation ?? visualInterpretation ?? undefined;
          let projectWithEvidence = project;
          if (submittedImage) {
            const safetyReceipt = returnedImageUnderstanding?.safetyReceipt ?? imageSafetyReceipt;
            if (!interpretation || !safetyReceipt) throw new Error("Image safety clearance is missing.");
            const evidenceReference = createSourceImageReference(submittedImage.evidenceId);
            if (!project.files.includes(evidenceReference)) {
              await saveProjectSourceImage(project.id, submittedImage, interpretation, safetyReceipt, completeDescription);
              projectWithEvidence = recordHomeSourceImage(project, evidenceReference);
              if (!saveProject(projectWithEvidence) || !loadProject()?.files.includes(evidenceReference)) throw new Error("Project source-image verification failed.");
              persistedProject = projectWithEvidence;
              setInitialProject(projectWithEvidence);
            }
          }
          return runInitialCoreCreation(projectWithEvidence, interpretation, { onPhase });
        },
      });
      if (result.kind === "success") {
        router.push("/workshop");
        return;
      }
      if (result.kind === "stopped") {
        setCreationPhase("failed");
        return;
      }
      setCreationPhase("failed");
      setError(result.message);
      if (result.retryPersistence) setRetryPersistence(() => result.retryPersistence!);
    } catch {
      setCreationPhase("failed");
      setError(persistedProject ? "REV could not continue this creation. Your Project remains saved; start another creation attempt when ready." : "REV could not save your Project before creation began. No creation request was made.");
    } finally {
      projectCreationStartedRef.current = false;
    }
  }

  return (
    <HomeVisualShell>
      <section className="entry" aria-labelledby="home-title" aria-busy={creationActive}>
        <p className="sr-only" role="status" aria-live="polite">{creationActive ? liveCreationStatus : ""}</p>
        <div className="console-regions">
          <section className="project-region" aria-labelledby="home-title">
            <header className="region-heading">
              <h1 id="home-title">WHAT BRINGS YOU HERE?</h1>
            </header>

            <fieldset className="origin-intent">
              <legend>Choose one starting point</legend>
              <div className="origin-options">
                {ORIGIN_INTENTS.map((intent) => (
                  <label key={intent.value} className={originIntent === intent.value ? "is-selected" : ""}>
                    <input type="radio" name="origin-intent" value={intent.value} checked={originIntent === intent.value} onChange={() => setOriginIntent(intent.value)} disabled={creationActive} />
                    <OriginIntentIcon kind={intent.icon} />
                    <span>{intent.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section className="workflow" aria-labelledby="workflow-heading">
              <div className="workflow-heading">
                <span id="workflow-heading">REV CREATION READINESS</span>
                <small>{liveCreationStatus}</small>
              </div>
              <div className={`journey-bar${currentWorkflowStage >= 0 ? " is-active" : ""}`} aria-hidden="true">
                {HOME_WORKFLOW_STAGES.map((stage) => <span key={stage} />)}
              </div>
              <ol>
                {HOME_WORKFLOW_STAGES.map((stage, index) => {
                  const current = index === currentWorkflowStage;
                  return (
                    <li key={stage} className={current ? "is-current" : ""} aria-current={current ? "step" : undefined}>
                      <span>{stage}</span>
                      <small>{current ? liveCreationStatus : index === 0 ? "WAITING FOR DETAIL" : "NOT STARTED"}</small>
                    </li>
                  );
                })}
              </ol>
            </section>
          </section>

          <section className="idea-region" aria-labelledby="idea-region-title">
            <header className="region-heading idea-heading">
              <h2 id="idea-region-title">TELL REV WHAT YOU’RE IMAGINING</h2>
            </header>

            <label className="description-field" htmlFor="idea-description">
              <span className="sr-only">Your complete idea</span>
              <textarea id="idea-description" value={description} onChange={(event) => { const nextDescription = event.target.value; const contextChanged = Boolean(blockedInventorContext) && normalizeBlockedContext(nextDescription) !== blockedInventorContext; if (imageUnderstandingAttemptRef.current && normalizeAttemptContext(nextDescription) !== imageUnderstandingAttemptRef.current.inventorContext) invalidateImageUnderstandingAttempt(); setDescription(nextDescription); setHelpingQuestion(""); setError(""); if (contextChanged) { setBlockedInventorContext(""); setImageSafetyState("unchecked"); setVisualUnderstandingState("idle"); setVisualUnderstandingMessage(selectedImage ? "START WITH REV to check and understand this image." : ""); } if (selectedImage) { setVisualInterpretation(null); setImageSafetyReceipt(null); setImageSafetyState("unchecked"); setVisualUnderstandingState("idle"); setVisualUnderstandingMessage("START WITH REV to check and understand this image."); } }} rows={5} placeholder="Describe your idea in plain language. What should it do, and what matters most to you?" disabled={creationActive} />
            </label>

            <div className="console-action">
              <input ref={fileInputRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectImage(event.target.files?.[0])} disabled={creationActive} />
              <button type="button" className="secondary add-image" onClick={() => fileInputRef.current?.click()} disabled={imageBusy || creationActive}>{selectedImage ? "CHANGE PHOTO" : imageBusy ? "CHECKING IMAGE..." : "ADD PHOTO OR SKETCH"}</button>
              {selectedImage && <button type="button" className="secondary remove-image" onClick={removeImage} disabled={imageBusy || creationActive}>REMOVE</button>}
              <button type="button" className="start-button" onClick={() => void startWithRev()} disabled={!originIntent || !readyToStart || imageBusy || imageInvalid || creationActive}>{creationActive ? liveCreationStatus : creationPhase === "failed" ? "START ANOTHER CREATION ATTEMPT" : "START WITH REV"} <span aria-hidden="true">→</span></button>
            </div>

            {visualInterpretation && <section className="visual-understanding" aria-label="REV visual understanding"><span>WHAT REV CAN SEE</span><p>{visualInterpretation.factualSummary}</p><small>Derived from the attached visual reference · not Project truth</small></section>}
            {visualUnderstandingMessage && <p className="visual-understanding-message" role="status">{visualUnderstandingMessage.replace("ASK REV", "START WITH REV")}</p>}
            {error && <p className="error" role="alert">{error}</p>}
            {retryPersistence && <button type="button" className="secondary" onClick={() => void retryPersistence().then((result) => { if (result.kind === "success") router.push("/workshop"); })}>TRY SAVING CONCEPT 01 AGAIN</button>}
          </section>
        </div>

        <section className="creation-status" aria-labelledby="creation-status-heading">
          <div className="creation-status-heading">
            <span id="creation-status-heading">CORE CREATION</span>
            <small>PROJECT WORKFLOW · INFORMATION ONLY</small>
          </div>
          <ul>
            {HOME_CREATION_STATUS.map((item) => (
              <li key={item.label} className={[item.core ? "is-core" : "", item.icon === "manufacturing" ? "is-manufacturing" : "", item.icon === "reality" ? "is-reality" : ""].filter(Boolean).join(" ")}>
                <HomeCreationIcon kind={item.icon} />
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </li>
            ))}
          </ul>
        </section>
      </section>
      <style jsx>{`
        .entry{box-sizing:border-box;width:min(100%,98rem);margin-top:-1rem;font-size:clamp(14px,.82vw,16px);line-height:1.42;color:#edf5f7}
        .console-regions{display:grid;grid-template-columns:minmax(19rem,42fr) minmax(0,58fr);overflow:hidden;border:1px solid rgba(80,189,216,.52);border-radius:12px;background:linear-gradient(120deg,rgba(5,17,30,.93),rgba(4,14,25,.88));box-shadow:0 24px 68px rgba(0,0,0,.48),inset 0 1px rgba(171,230,240,.05);backdrop-filter:blur(11px)}
        .project-region,.idea-region{box-sizing:border-box;min-width:0;padding:8px 10px}
        .project-region{border-right:1px solid rgba(91,174,195,.34)}
        .region-heading{margin:0 0 3px;text-align:left}.region-heading>span,.name-field>span,.description-field>span,.attachment-heading>span,.visual-understanding>span,.question>strong,.workflow-heading>span,.creation-status-heading>span{display:block;color:#81e1f0;font-size:clamp(10px,.64vw,12px);font-weight:850;line-height:1.3;letter-spacing:.12em}.region-heading h1,.region-heading h2{margin:0;color:#f4f6f4;font-weight:560;line-height:1.06;letter-spacing:-.025em}.region-heading h1{font-size:clamp(24px,1.75vw,32px)}.region-heading h2{font-size:clamp(22px,1.55vw,29px)}.region-heading p{max-width:46rem;margin:4px 0 0;color:#b9cbd1;font-size:12px;line-height:1.35}
        .name-field,.description-field{display:block}.name-field{margin-top:12px}.name-field small,.attachment-heading span small{color:#78929b;font-size:.82em;font-weight:780}.description-field>span{margin-bottom:5px}
        input,textarea{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid #416878;border-radius:6px;outline:none;background:rgba(4,14,23,.76);color:#f4f8f8;font:inherit}input::placeholder,textarea::placeholder{color:#758b94}textarea{height:clamp(120px,14vh,140px);min-height:120px;resize:vertical;line-height:1.48}input:focus-visible,textarea:focus-visible{border-color:#81e8f7;box-shadow:0 0 0 3px rgba(70,208,232,.17)}
        .workflow{margin-top:14px;padding-top:12px;border-top:1px solid rgba(85,160,181,.28)}.workflow-heading,.creation-status-heading{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.workflow-heading small,.creation-status-heading small{color:#718a94;font-size:9px;font-weight:750;line-height:1.3;letter-spacing:.09em}.journey-bar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));height:10px;margin-top:10px;overflow:hidden;border:1px solid rgba(83,162,186,.52);border-radius:3px;background:#07131d;box-shadow:inset 0 0 8px rgba(18,72,93,.3)}.journey-bar span{min-width:0;border-right:1px solid rgba(132,188,202,.34);box-shadow:inset 0 1px rgba(170,228,239,.06)}.journey-bar span:first-child{background:linear-gradient(90deg,rgba(42,190,219,.25),rgba(36,112,174,.2))}.journey-bar span:nth-child(2){background:linear-gradient(90deg,rgba(36,105,164,.18),rgba(42,76,122,.17))}.journey-bar span:nth-child(3){background:linear-gradient(90deg,rgba(47,75,115,.16),rgba(126,93,55,.15))}.journey-bar span:last-child{border-right:0;background:linear-gradient(90deg,rgba(117,86,53,.14),rgba(174,123,54,.18))}.journey-bar.is-active span:first-child{background:linear-gradient(90deg,#45d8ec,#258ed8);box-shadow:inset 0 1px rgba(224,252,255,.58),0 0 12px rgba(52,204,232,.5)}.workflow ol{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:7px 0 0;padding:0;list-style:none}.workflow li{display:grid;justify-items:center;align-content:start;gap:2px;min-width:0;color:#68818a;text-align:center}.workflow li span{font-size:clamp(8px,.54vw,10px);font-weight:820;line-height:1.24;letter-spacing:.03em}.workflow li small{color:#5f7780;font-size:8px;font-weight:750;letter-spacing:.05em}.workflow li.is-current{color:#c7f8ff;text-shadow:0 0 8px rgba(79,214,235,.25)}.workflow li.is-current small{color:#dfa94f}
        .source-image-picker,.visual-understanding,.question,.ready{margin-top:4px;padding:4px 7px;border:1px solid rgba(64,112,128,.72);border-radius:7px;background:rgba(5,17,27,.6)}.source-image-picker{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:3px 8px}.attachment-heading{display:flex;grid-column:1/-1;align-items:center;justify-content:space-between;gap:8px}.attachment-heading>small,.source-image-picker small,.disclosure,.visual-understanding small,.question small,.creation-disclosure{color:#8ca3ab;font-size:8.5px;line-height:1.16}.file-input{display:none}.secondary{width:auto;min-height:44px;padding:8px 12px;border:1px solid #48869a;border-radius:6px;background:rgba(8,31,43,.84);color:#dffaff;font-size:10px;font-weight:850;letter-spacing:.07em;cursor:pointer}.add-image{margin:0}.source-image-preview{display:grid;grid-column:1/-1;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:10px}.source-image-preview img,.censored-preview{width:58px;height:58px;object-fit:contain;border-radius:5px;background:#02080d}.censored-preview{display:grid;place-items:center;color:#e0bd79;font-size:9px;font-weight:800;text-align:center}.source-image-preview p{min-width:0;margin:0}.source-image-preview strong,.source-image-preview small{display:block;overflow-wrap:anywhere}.source-image-preview>div{display:flex;gap:7px}.disclosure{margin:0}.visual-understanding p{margin:5px 0;color:#d9e7ea;line-height:1.4}.visual-understanding-message{margin:8px 0 0;color:#e6cb93;font-size:11px;line-height:1.4}.question>p{margin:4px 0 0;color:#dce9eb}.question small{display:block;margin-top:4px}.ready{border-color:rgba(88,169,143,.62);color:#ddf6ec}.ready strong{display:block;margin-bottom:3px;color:#aeeed8;font-size:10px;letter-spacing:.1em}.creation-disclosure{margin:5px 0 0}.console-action{margin-top:3px}.console-action>button{width:100%;min-height:44px;padding:9px 14px;border:1px solid #e0ac55;border-radius:6px;background:linear-gradient(180deg,#b87b2f,#81511f);box-shadow:0 0 20px rgba(211,151,61,.16);color:#fff8ea;font-size:12px;font-weight:900;letter-spacing:.07em;cursor:pointer}.console-action>button:focus-visible,.secondary:focus-visible{outline:3px solid #89ecfb;outline-offset:3px}.console-action>button:disabled,.secondary:disabled{opacity:.46;cursor:not-allowed}.error{margin:8px 0 0;color:#ffb6a9}
        .creation-status{margin-top:1px;padding:3px clamp(10px,1vw,15px);border:1px solid rgba(57,118,138,.42);border-radius:10px;background:rgba(4,14,24,.78);box-shadow:0 18px 45px rgba(0,0,0,.32);backdrop-filter:blur(9px)}.creation-status-heading>span{color:#dfa94f}.creation-status ul{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px;margin:1px 0 0;padding:0;list-style:none}.creation-status li{display:grid;grid-template-columns:31px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;justify-items:start;column-gap:5px;row-gap:1px;min-width:0;padding:1px 3px;color:#78a9b7;text-align:left}.creation-status li :global(.status-icon){display:block;grid-row:1/-1;width:21px;height:21px;overflow:visible;color:#70c7d9;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(67,196,221,.28))}.creation-status li strong{font-size:clamp(8px,.52vw,10px);line-height:1.15;letter-spacing:.02em}.creation-status li small{grid-column:2;color:#708891;font-size:8px;line-height:1.14}.creation-status li.is-core{color:#f0c77f}.creation-status li.is-core :global(.status-icon){width:28px;height:28px;color:#a5f3ff;stroke-width:1.55;filter:drop-shadow(0 0 3px rgba(91,228,250,.82)) drop-shadow(0 0 7px rgba(219,164,75,.48))}.creation-status li.is-core :global(.icon-gold-accent){stroke:#dfa94f;stroke-width:1.2;opacity:.94;filter:drop-shadow(0 0 3px rgba(223,169,79,.72))}.creation-status li.is-core small{color:#a9cad1}.creation-status li.is-manufacturing :global(.manufacturing-sparks){stroke:#e0aa51;stroke-width:1.35;filter:drop-shadow(0 0 3px rgba(224,170,81,.58))}.creation-status li.is-reality{grid-template-columns:35px minmax(0,1fr);color:#b7eef6}.creation-status li.is-reality :global(.status-icon){width:31px;height:31px;color:#9cefff;stroke-width:1.8;filter:drop-shadow(0 0 4px rgba(70,211,238,.62)) drop-shadow(0 0 7px rgba(220,166,76,.32))}.creation-status li.is-reality strong{color:#f0c77f}
        @media(min-width:1201px){.idea-region{display:grid;grid-template-columns:minmax(0,1fr) minmax(10.5rem,12rem);grid-auto-flow:row;align-content:start;column-gap:8px}.idea-heading,.description-field,.visual-understanding,.visual-understanding-message,.question,.error{grid-column:1/-1}.idea-heading{grid-row:1}.description-field{grid-row:2}.source-image-picker{grid-column:1;grid-row:3;grid-template-columns:minmax(7rem,8rem) auto minmax(0,1fr)}.source-image-picker .attachment-heading{display:block;grid-column:auto}.source-image-picker .attachment-heading>small{display:block;margin-top:2px}.source-image-picker .disclosure{grid-column:auto;margin:0}.console-action{grid-column:2;grid-row:3;align-self:start;margin-top:5px}.console-action.is-ready{grid-column:1/-1;grid-row:auto;margin-left:0}}
        @media(max-width:1600px) and (min-width:1201px){.entry{margin-top:-1.75rem}}
        @media(max-width:1100px){.console-regions{grid-template-columns:minmax(17rem,40fr) minmax(0,60fr)}.project-region,.idea-region{padding:14px}.creation-status ul{grid-template-columns:repeat(4,minmax(0,1fr))}.creation-status li{min-height:62px}}
        @media(max-width:900px){.entry{margin-top:0}.console-regions{grid-template-columns:1fr}.project-region{border-right:0;border-bottom:1px solid rgba(91,174,195,.34)}.workflow{margin-top:18px}.source-image-picker{display:block}.add-image{margin-top:9px}.disclosure{margin-top:8px}.creation-status ul{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.project-region,.idea-region{padding:18px 15px}.region-heading h1{font-size:28px}.region-heading h2{font-size:25px}.workflow-heading,.creation-status-heading,.attachment-heading{align-items:flex-start;flex-direction:column;gap:5px}.journey-bar{height:9px;margin-top:9px}.workflow ol{gap:3px;margin-top:6px}.workflow li span{font-size:8px}.workflow li small{font-size:7px}textarea{min-height:190px}.source-image-preview{grid-template-columns:58px minmax(0,1fr)}.source-image-preview img,.censored-preview{width:58px;height:58px}.source-image-preview>div{grid-column:1/-1}.source-image-preview>div .secondary{flex:1}.creation-status{padding-inline:12px}.creation-status ul{gap:5px}.creation-status li{padding-inline:3px}.console-action>button{font-size:11px}}
        @media(max-width:390px){.creation-status ul{grid-template-columns:1fr}.creation-status li{grid-template-columns:34px minmax(0,1fr);grid-template-rows:auto auto;justify-items:start;min-height:0;text-align:left}.creation-status li :global(.status-icon){grid-row:1/-1}.creation-status li small{grid-column:2}}
        @media(max-height:520px) and (min-width:681px){.entry{margin-top:0}.project-region,.idea-region{padding:12px}.region-heading{margin-bottom:8px}.region-heading p{margin-top:4px}.name-field{margin-top:9px}.workflow{margin-top:10px;padding-top:9px}textarea{height:140px;min-height:120px}.source-image-picker,.visual-understanding,.question,.ready{margin-top:7px;padding:8px}.creation-status{padding-block:7px 8px}.creation-status li{padding-block:4px}}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .creation-status :global(.icon-depth){fill:rgba(30,125,158,.5);stroke:rgba(100,216,235,.82);filter:drop-shadow(1px 2px 1px rgba(0,0,0,.5))}.creation-status :global(.icon-highlight){stroke:#d8fbff;stroke-width:1.15;opacity:.92;filter:drop-shadow(0 0 2px rgba(131,234,251,.7))}.creation-status :global(.icon-base){fill:rgba(50,154,184,.25);stroke:rgba(224,169,79,.62);filter:drop-shadow(0 3px 2px rgba(0,0,0,.55))}
        .origin-intent{margin:7px 0 0;padding:0;border:0}.origin-intent legend{padding:0;color:#86aeb9;font-size:9px;font-weight:720;letter-spacing:.07em}.origin-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:5px}.origin-options label{display:grid;grid-template-columns:23px minmax(0,1fr);align-items:center;gap:5px;min-height:42px;padding:5px 7px;border:1px solid rgba(72,129,146,.65);border-radius:5px;background:rgba(3,15,25,.48);color:#dcecf0;cursor:pointer}.origin-options input{position:absolute;inline-size:1px;block-size:1px;opacity:0}.origin-options svg{width:21px;height:21px;color:#8ce9fb;stroke:currentColor;stroke-width:1.45;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px rgba(72,207,238,.42))}.origin-options svg :global(path),.origin-options svg :global(circle),.origin-options svg :global(ellipse){stroke:currentColor}.origin-options :global(.origin-depth){fill:rgba(39,153,183,.2);stroke:rgba(84,177,199,.66)}.origin-options :global(.origin-highlight){stroke:#dcfbff;stroke-width:1;opacity:.9}.origin-options :global(.origin-gold){stroke:#e0aa51;filter:drop-shadow(0 0 2px rgba(224,170,81,.74))}.origin-options :global(.origin-metal){stroke:#8bafbb;stroke-width:3}.origin-options span{font-size:clamp(8px,.56vw,10px);font-weight:800;line-height:1.2}.origin-options label.is-selected{border-color:#dda850;background:linear-gradient(135deg,rgba(41,132,156,.3),rgba(162,104,38,.21));box-shadow:inset 0 0 0 1px rgba(219,165,76,.2),0 0 12px rgba(69,186,216,.16);color:#fff5df}.origin-options label:focus-within{outline:3px solid #8ce9fb;outline-offset:2px}
        .console-action{display:flex;align-items:center;gap:8px;margin-top:7px}.console-action>button{width:auto;min-height:39px;padding:8px 13px;font-size:10px;white-space:nowrap}.console-action .secondary{min-height:39px;border-color:rgba(83,185,211,.8);background:rgba(4,26,39,.8)}.console-action .start-button{margin-left:auto;background:linear-gradient(180deg,#c18432,#7d4b1c)}
        @media(min-width:1201px){.entry{width:min(100%,98rem);margin-top:-.55rem}.console-regions{grid-template-columns:42fr 58fr}.project-region,.idea-region{padding:12px 14px}.region-heading{margin-bottom:0}.region-heading h1,.region-heading h2{font-size:clamp(16px,1.05vw,20px);letter-spacing:.015em}.description-field{margin-top:7px}.description-field textarea{height:108px;min-height:108px;padding:10px 12px;font-size:13px}.workflow{margin-top:10px;padding-top:8px}.workflow-heading small{font-size:8px}.journey-bar{height:8px;margin-top:6px}.workflow ol{margin-top:5px}.workflow li span{font-size:8px}.workflow li small{display:none}.idea-region{display:block}.origin-options label{grid-template-columns:27px minmax(0,1fr);min-height:44px}.origin-options svg{width:24px;height:24px}.creation-status{margin-top:4px;padding:7px 12px 8px}.creation-status-heading{justify-content:center}.creation-status-heading small{display:none}.creation-status ul{gap:6px;margin-top:5px}.creation-status li{position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:auto auto;align-content:start;justify-items:center;gap:4px;min-height:104px;padding:0;text-align:center}.creation-status li:not(.is-core):not(.is-reality)::before{content:"";position:absolute;z-index:0;top:34px;width:42px;height:12px;border:1px solid rgba(224,169,79,.44);border-radius:50%;background:radial-gradient(ellipse,rgba(73,199,222,.3),rgba(29,90,121,.14) 48%,transparent 72%);box-shadow:0 4px 6px rgba(0,0,0,.58),0 0 11px rgba(50,187,219,.22)}.creation-status li :global(.status-icon){position:relative;z-index:1;grid-row:auto;width:47px;height:47px;stroke-width:1.5;filter:drop-shadow(0 0 5px rgba(67,196,221,.5)) drop-shadow(0 4px 4px rgba(0,0,0,.48))}.creation-status li strong{position:relative;z-index:1;font-size:clamp(9px,.59vw,11px);line-height:1.18;letter-spacing:.01em;text-shadow:0 2px 3px rgba(0,0,0,.8)}.creation-status li small{display:none}.creation-status li.is-core :global(.status-icon){width:61px;height:61px;stroke-width:1.5;filter:drop-shadow(0 0 5px rgba(91,228,250,.96)) drop-shadow(0 0 12px rgba(219,164,75,.62))}.creation-status li.is-reality :global(.status-icon){width:62px;height:62px;stroke-width:1.75;filter:drop-shadow(0 0 6px rgba(70,211,238,.82)) drop-shadow(0 0 12px rgba(220,166,76,.5))}.creation-status li.is-reality{grid-template-columns:1fr}.creation-status li.is-reality strong{font-size:clamp(9px,.59vw,11px)}.creation-status li.is-manufacturing :global(.manufacturing-sparks){stroke-width:1.65;filter:drop-shadow(0 0 4px rgba(235,173,74,.86))}.visual-understanding,.visual-understanding-message,.question{margin-top:5px}.error{margin:5px 0 0;font-size:11px}}
        @media(min-width:901px) and (max-width:1200px){.entry{width:100%;margin-top:0}.console-regions{grid-template-columns:minmax(22rem,42fr) minmax(0,58fr)}.project-region,.idea-region{padding:14px}.region-heading h1,.region-heading h2{font-size:20px}.origin-options label{min-height:48px}.creation-status{margin-top:8px;padding:10px 12px}.creation-status-heading small{display:none}.creation-status ul{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:7px}.creation-status li{position:relative;display:grid;grid-template-columns:1fr;grid-template-rows:auto auto;justify-items:center;gap:5px;min-height:105px;text-align:center}.creation-status li :global(.status-icon){grid-row:auto;width:47px;height:47px}.creation-status li.is-core :global(.status-icon),.creation-status li.is-reality :global(.status-icon){width:60px;height:60px}.creation-status li strong{font-size:10px;line-height:1.2}.creation-status li small{display:none}}
        @media(max-width:900px){.entry{width:100%;margin-top:0}.console-regions{display:flex;flex-direction:column;padding:16px;overflow:visible}.project-region,.idea-region{display:contents}.project-region>.region-heading{order:1}.origin-intent{order:2}.idea-heading{order:3;margin-top:16px;padding-top:16px;border-top:1px solid rgba(91,174,195,.34)}.description-field{order:4;margin-top:8px}.console-action{order:5}.workflow{order:6;margin-top:16px;padding-top:14px}.visual-understanding,.visual-understanding-message,.question{order:7}.error{order:8}.region-heading h1,.region-heading h2{font-size:clamp(20px,3vw,26px)}textarea{height:160px;min-height:160px}.origin-options label{min-height:48px}.console-action>button{min-height:48px}.creation-status{margin-top:10px;padding:12px}.creation-status-heading small{display:none}.creation-status ul{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px}.creation-status li{display:grid;grid-template-columns:1fr;grid-template-rows:auto auto;justify-items:center;gap:5px;min-height:104px;text-align:center}.creation-status li :global(.status-icon){grid-row:auto;width:47px;height:47px}.creation-status li.is-core :global(.status-icon),.creation-status li.is-reality :global(.status-icon){width:60px;height:60px}.creation-status li strong{font-size:10px;line-height:1.22}.creation-status li small{display:none}}
        @media(max-width:560px){.console-regions{padding:15px 14px}.origin-options{grid-template-columns:1fr;gap:8px}.origin-options label{grid-template-columns:32px minmax(0,1fr);min-height:52px;padding:8px 10px}.origin-options svg{width:27px;height:27px}.origin-options span{font-size:11px}.console-action{display:grid;grid-template-columns:1fr;gap:9px}.console-action>button,.console-action .secondary,.console-action .start-button{width:100%;min-height:50px;margin-left:0;font-size:11px}.workflow-heading{align-items:flex-start;flex-direction:column;gap:4px}.workflow ol{gap:4px}.workflow li span{font-size:9px}.workflow li small{font-size:7.5px}textarea{height:175px;min-height:175px;font-size:16px}.creation-status ul{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.creation-status li{min-height:112px;padding:5px}.creation-status li strong{font-size:10px}.creation-status li :global(.status-icon){width:49px;height:49px}.creation-status li.is-core :global(.status-icon),.creation-status li.is-reality :global(.status-icon){width:62px;height:62px}}
        @media(max-width:900px) and (max-height:520px){.console-regions{padding:14px}.origin-options{grid-template-columns:repeat(3,minmax(0,1fr))}.origin-options label{grid-template-columns:24px minmax(0,1fr);min-height:46px;padding:6px}.origin-options svg{width:22px;height:22px}.origin-options span{font-size:9px}.creation-status ul{grid-template-columns:repeat(4,minmax(0,1fr))}.creation-status li{min-height:96px}.creation-status li :global(.status-icon){width:43px;height:43px}.creation-status li.is-core :global(.status-icon),.creation-status li.is-reality :global(.status-icon){width:55px;height:55px}}
      `}</style>
    </HomeVisualShell>
  );
}
