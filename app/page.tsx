"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createProject, recordHomeSourceImage } from "./lib/core/project";
import { savePreferredName } from "./lib/core/inventorStorage";
import { loadProject, removeProjectIfCurrent, saveProject } from "./lib/core/storageEngine";
import {
  createSourceImageReference,
  deleteProjectSourceImage,
  saveProjectSourceImage,
  sourceImageToDataUrl,
  validateSourceImage,
  type ValidatedSourceImage,
} from "./lib/core/projectSourceEvidenceStorage";
import { assessHomeUnderstanding } from "./lib/workshop/revWorkingUnderstanding";
import type { RevImageSafetyReceipt, VisualUnderstandingApiResponse, VisualUnderstandingResult } from "./lib/ai/types";

const ENTRY_GENERATION_SESSION_KEY = "reaidea.entry-generation.v2";
const BLOCKED_IMAGE_MESSAGE = "REV can’t use that image. Choose another image or continue without one.";

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

export default function Home() {
  const [preferredName, setPreferredName] = useState("");
  const [description, setDescription] = useState("");
  const [helpingQuestion, setHelpingQuestion] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<ValidatedSourceImage | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageInvalid, setImageInvalid] = useState(false);
  const [visualInterpretation, setVisualInterpretation] = useState<VisualUnderstandingResult | null>(null);
  const [imageSafetyState, setImageSafetyState] = useState<"unchecked" | "checking" | "CLEAR" | "HOLD" | "BLOCK" | "unavailable">("unchecked");
  const [imageSafetyReceipt, setImageSafetyReceipt] = useState<RevImageSafetyReceipt | null>(null);
  const [visualUnderstandingState, setVisualUnderstandingState] = useState<"idle" | "working" | "ready" | "failed" | "unsupported">("idle");
  const [visualUnderstandingMessage, setVisualUnderstandingMessage] = useState("");
  const [blockedInventorContext, setBlockedInventorContext] = useState("");
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
  const effectiveReady = understanding.ready && (
    !selectedImage || (imageSafetyState === "CLEAR" && imageSafetyReceipt !== null)
  ) && !blockedContextActive;

  useEffect(() => {
    return () => {
      const attempt = imageUnderstandingAttemptRef.current;
      imageUnderstandingAttemptRef.current = null;
      attempt?.controller.abort();
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    };
  }, []);

  function revokeImagePreview() {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    imagePreviewUrlRef.current = "";
    setImagePreviewUrl("");
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
      setImagePreviewUrl(objectUrl);
      setSelectedImage(validated);
      setImageInvalid(false);
      setVisualUnderstandingMessage("ASK REV to check and understand this image.");
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

  async function askRev() {
    setError("");
    if (!selectedImage) {
      if (blockedContextActive) return;
      setHelpingQuestion(understanding.helperQuestion);
      return;
    }
    if (visualUnderstandingState === "working") return;
    if (!navigator.onLine) {
      markImageUnavailable();
      return;
    }
    setHelpingQuestion("");
    setVisualUnderstandingState("working");
    setImageSafetyState("checking");
    setVisualUnderstandingMessage("");
    const evidenceReference = createSourceImageReference(selectedImage.evidenceId);
    const attempt: ImageUnderstandingAttempt = {
      token: globalThis.crypto.randomUUID(),
      evidenceId: selectedImage.evidenceId,
      inventorContext: normalizeAttemptContext(description),
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
      const dataUrl = await sourceImageToDataUrl(selectedImage);
      if (!isCurrentAttempt()) return;
      const response = await fetch("/api/understanding/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: attempt.controller.signal,
        body: JSON.stringify({
          requestId: attempt.token,
          evidenceReference,
          mediaType: selectedImage.mediaType,
          dataUrl,
          ...(description.trim() ? { inventorDescription: description.trim() } : {}),
        }),
      });
      const payload = await response.json() as VisualUnderstandingApiResponse;
      if (!isCurrentAttempt()) return;
      if (!response.ok || "error" in payload) {
        markImageUnavailable();
        return;
      }
      if (payload.safety.decision === "BLOCK") {
        revokeImagePreview();
        setSelectedImage(null);
        setVisualInterpretation(null);
        setImageSafetyReceipt(null);
        setBlockedInventorContext(normalizeBlockedContext(description));
        setImageSafetyState("BLOCK");
        setVisualUnderstandingState("failed");
        setVisualUnderstandingMessage(BLOCKED_IMAGE_MESSAGE);
        setHelpingQuestion("");
        return;
      }
      if (payload.safety.decision === "HOLD") {
        setVisualInterpretation(null);
        setImageSafetyReceipt(null);
        setImageSafetyState("HOLD");
        setVisualUnderstandingState("idle");
        setVisualUnderstandingMessage("");
        setHelpingQuestion(payload.safety.question);
        return;
      }
      if (payload.safety.decision === "unavailable") {
        markImageUnavailable();
        return;
      }
      if (!("interpretation" in payload)) throw new Error("REV did not return a cleared interpretation.");
      if (payload.interpretation.evidenceReference !== evidenceReference) {
        throw new Error("Interpretation provenance did not match the selected evidence.");
      }
      setVisualInterpretation(payload.interpretation);
      setImageSafetyReceipt(payload.safety.receipt);
      setImageSafetyState("CLEAR");
      setVisualUnderstandingState("ready");
      const nextUnderstanding = assessHomeUnderstanding(description, payload.interpretation);
      setHelpingQuestion(nextUnderstanding.ready ? "" : nextUnderstanding.helperQuestion);
    } catch {
      if (!isCurrentAttempt()) return;
      markImageUnavailable();
    } finally {
      window.removeEventListener("offline", handleOffline);
      if (isCurrentAttempt()) imageUnderstandingAttemptRef.current = null;
    }
  }

  async function enterWorkshop() {
    const completeDescription = description.trim();
    if (blockedContextActive || !understanding.ready || !completeDescription || imageBusy || imageInvalid || (selectedImage && (!imageSafetyReceipt || imageSafetyState !== "CLEAR")) || projectCreationStartedRef.current) return;
    projectCreationStartedRef.current = true;
    let persistedEvidence: { projectId: string; evidenceId: string } | null = null;
    let createdProjectId = "";
    try {
      const inventor = savePreferredName(preferredName);
      let project = createProject({ ownerId: inventor.id, originalObservation: completeDescription });
      createdProjectId = project.id;
      let evidenceReference = "";
      if (selectedImage) {
        if (!imageSafetyReceipt) throw new Error("Image safety clearance is missing.");
        const evidence = await saveProjectSourceImage(project.id, selectedImage, visualInterpretation ?? undefined, imageSafetyReceipt, completeDescription);
        persistedEvidence = { projectId: project.id, evidenceId: evidence.evidenceId };
        evidenceReference = createSourceImageReference(evidence.evidenceId);
        project = recordHomeSourceImage(project, evidenceReference);
      }
      if (!saveProject(project)) throw new Error("Project save failed.");
      const savedProject = loadProject();
      if (
        savedProject?.id !== project.id ||
        (evidenceReference && !savedProject.files.includes(evidenceReference))
      ) throw new Error("Project verification failed.");
      window.sessionStorage.setItem(ENTRY_GENERATION_SESSION_KEY, project.id);
      router.push("/workshop");
    } catch {
      if (createdProjectId) removeProjectIfCurrent(createdProjectId);
      if (persistedEvidence) {
        try {
          await deleteProjectSourceImage(persistedEvidence.projectId, persistedEvidence.evidenceId);
        } catch {
          // The exact new record is the only permitted rollback target.
        }
      }
      projectCreationStartedRef.current = false;
      setError("REV couldn't start your Project. Please try again.");
    }
  }

  return (
    <main className="home">
      <Image src="/images/reaidea-workshop-entrance.png" alt="" fill priority sizes="100vw" className="background" />
      <div className="scrim" />
      <section className="entry" aria-labelledby="home-title">
        <header><p>WELCOME TO reAIdea</p><h1 id="home-title">Tell REV about your invention.</h1><span>Say it once in your own words. Rough is fine.</span></header>
        <label><span>NAME <small>OPTIONAL</small></span><input value={preferredName} onChange={(event) => setPreferredName(event.target.value)} placeholder="What should REV call you?" autoComplete="name" /></label>
        <label><span>DESCRIBE YOUR INVENTION</span><textarea value={description} onChange={(event) => { const nextDescription = event.target.value; const contextChanged = Boolean(blockedInventorContext) && normalizeBlockedContext(nextDescription) !== blockedInventorContext; if (imageUnderstandingAttemptRef.current && normalizeAttemptContext(nextDescription) !== imageUnderstandingAttemptRef.current.inventorContext) invalidateImageUnderstandingAttempt(); setDescription(nextDescription); setHelpingQuestion(""); setError(""); if (contextChanged) { setBlockedInventorContext(""); setImageSafetyState("unchecked"); setVisualUnderstandingState("idle"); setVisualUnderstandingMessage(selectedImage ? "ASK REV to check and understand this image." : ""); } if (selectedImage) { setVisualInterpretation(null); setImageSafetyReceipt(null); setImageSafetyState("unchecked"); setVisualUnderstandingState("idle"); setVisualUnderstandingMessage("ASK REV to check and understand this image."); } }} rows={8} placeholder="What is it, who does it help, and how do you imagine it working?" /></label>
        <section className="source-image-picker" aria-label="Optional visual reference">
          <div><span>Add a sketch or photo — optional</span><small>PNG, JPEG or WebP · up to 4 MiB</small></div>
          <input ref={fileInputRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectImage(event.target.files?.[0])} />
          {selectedImage && imagePreviewUrl ? <div className={`source-image-preview${imageSafetyState === "HOLD" || imageSafetyState === "unavailable" ? " is-censored" : ""}`}>{imageSafetyState === "HOLD" || imageSafetyState === "unavailable" ? <div className="censored-preview">IMAGE HELD</div> : <Image src={imagePreviewUrl} alt="Selected visual reference" width={selectedImage.width} height={selectedImage.height} unoptimized />}<p><strong>{selectedImage.displayName}</strong><small>{selectedImage.width} × {selectedImage.height} · {Math.ceil(selectedImage.byteSize / 1024)} KiB</small></p><div><button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>REPLACE</button><button type="button" className="secondary" onClick={removeImage}>REMOVE</button></div></div> : <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()} disabled={imageBusy}>{imageBusy ? "CHECKING IMAGE..." : "ADD IMAGE"}</button>}
          <p className="disclosure">ASK REV may send this image to the configured AI provider for interpretation. Concept 01 may later use it as a visual reference. Nothing is sent when you only attach, replace or remove it.</p>
        </section>
        {visualInterpretation && <section className="visual-understanding" aria-label="REV visual understanding"><span>WHAT REV CAN SEE</span><p>{visualInterpretation.factualSummary}</p><small>Derived from the attached visual reference · not Project truth</small></section>}
        {visualUnderstandingMessage && <p className="visual-understanding-message" role="status">{visualUnderstandingMessage}</p>}
        <section className="meter" aria-label={`REV understanding ${understanding.score} percent`}><div><span>REV UNDERSTANDING</span><strong>{effectiveReady ? "READY FOR WORKSHOP" : "BUILDING"}</strong></div><progress max="100" value={understanding.score}>{understanding.score}%</progress></section>
        {helpingQuestion && !blockedContextActive && (imageSafetyState === "HOLD" || !understanding.ready) && <p className="question"><strong>REV ASKS</strong>{helpingQuestion}<small>Add the answer to your description above.</small></p>}
        {blockedContextActive && (!selectedImage || imageSafetyState === "CLEAR" || imageSafetyState === "BLOCK") ? null : selectedImage && imageSafetyState !== "CLEAR" ? <button type="button" onClick={() => void askRev()} disabled={imageBusy || imageInvalid || imageSafetyState === "checking"}>{imageSafetyState === "checking" ? "REV IS CHECKING THE IMAGE…" : "ASK REV"}</button> : effectiveReady ? <><p className="ready">I have enough information to get started. Enter the Workshop and we’ll develop your invention from here.</p><button type="button" onClick={() => void enterWorkshop()} disabled={imageBusy || imageInvalid}>ENTER WORKSHOP <span aria-hidden="true">→</span></button></> : <button type="button" onClick={() => void askRev()} disabled={(!description.trim() && !selectedImage) || imageBusy || imageInvalid || visualUnderstandingState === "working"}>{visualUnderstandingState === "working" ? "REV IS LOOKING..." : "ASK REV"}</button>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
      <style jsx>{`
        .home{min-height:100svh;position:relative;display:grid;place-items:center;overflow:auto;padding:24px;background:#050708;color:#f2f5f6}.background{object-fit:cover;z-index:0}.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(rgba(2,5,7,.28),rgba(2,5,7,.72)),radial-gradient(circle at center,transparent,rgba(0,0,0,.52))}.entry{position:relative;z-index:2;box-sizing:border-box;width:min(620px,100%);padding:clamp(24px,4vw,42px);border:1px solid rgba(85,205,232,.45);border-radius:14px;background:rgba(4,10,14,.9);box-shadow:0 25px 80px rgba(0,0,0,.55);backdrop-filter:blur(12px)}header{text-align:center;margin-bottom:25px}header p,label>span,.meter span,.question strong,.source-image-picker>div>span,.visual-understanding>span{display:block;margin:0 0 7px;color:#72d2e4;font-size:10px;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:clamp(29px,5vw,42px);letter-spacing:-.045em}header>span{display:block;margin-top:8px;color:#bdc8cc}label{display:block;margin-top:16px}label small{color:#7f9299}input,textarea{box-sizing:border-box;width:100%;padding:13px;border:1px solid #526873;border-radius:7px;outline:none;background:#071014;color:#f3f7f8;font:inherit}textarea{resize:vertical;line-height:1.5}input:focus,textarea:focus{border-color:#70d3e7;box-shadow:0 0 0 3px rgba(85,205,232,.1)}.source-image-picker,.visual-understanding{margin-top:16px;padding:13px;border:1px solid #39515b;border-radius:7px;background:rgba(5,15,19,.72)}.source-image-picker>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:12px}.source-image-picker small,.disclosure,.visual-understanding small{color:#91a3a9;font-size:11px}.file-input{display:none}.source-image-preview{display:grid;grid-template-columns:72px 1fr auto;align-items:center;gap:12px}.source-image-preview img,.censored-preview{width:72px;height:72px;object-fit:contain;border-radius:5px;background:#020708}.censored-preview{display:grid;place-items:center;color:#d8bd82;font-size:9px;text-align:center}.source-image-preview p{min-width:0;margin:0}.source-image-preview strong,.source-image-preview small{display:block;overflow-wrap:anywhere}.source-image-preview>div{display:flex;gap:7px}.secondary{width:auto;min-height:36px;padding:7px 10px;background:#0a1a20;font-size:10px}.disclosure{margin:10px 0 0;line-height:1.4}.visual-understanding p{margin:7px 0;color:#d8e5e8;line-height:1.45}.visual-understanding ul{margin:8px 0;padding-left:19px;color:#bdcdd1}.visual-understanding .uncertainty{color:#aebdc1}.visual-understanding .uncertainty strong{display:block;color:#d8bd82;font-size:10px;letter-spacing:.08em}.visual-understanding-message{color:#e2c78f}.meter{margin:18px 0}.meter div{display:flex;justify-content:space-between}.meter strong{color:#d6e4e7;font-size:10px}progress{width:100%;height:9px;accent-color:#55cde8}.question,.ready{padding:13px;border:1px solid #39555e;border-radius:7px;background:#0b1a20;color:#dce8eb}.question small{display:block;margin-top:5px;color:#91a3a9}.ready{border-color:#4a766c;color:#dff5ed}button{width:100%;min-height:48px;border:1px solid #55cde8;border-radius:7px;background:#153d48;color:#f1fdff;font-weight:900;letter-spacing:.05em;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.error{color:#ffb6a9}@media(max-width:560px){.source-image-preview{grid-template-columns:64px 1fr}.source-image-preview>div{grid-column:1/-1}.source-image-preview>div .secondary{flex:1}}@media(max-height:760px){.entry{padding:22px}header{margin-bottom:12px}textarea{max-height:150px}}
      `}</style>
    </main>
  );
}
