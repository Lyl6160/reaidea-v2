"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createProject } from "./lib/core/project";
import { savePreferredName } from "./lib/core/inventorStorage";
import { saveProject } from "./lib/core/storageEngine";
import { assessHomeUnderstanding } from "./lib/workshop/revWorkingUnderstanding";

const ENTRY_GENERATION_SESSION_KEY = "reaidea.entry-generation.v2";

export default function Home() {
  const [preferredName, setPreferredName] = useState("");
  const [description, setDescription] = useState("");
  const [helpingQuestion, setHelpingQuestion] = useState("");
  const [error, setError] = useState("");
  const projectCreationStartedRef = useRef(false);
  const router = useRouter();
  const understanding = useMemo(() => assessHomeUnderstanding(description), [description]);

  function enterWorkshop() {
    const completeDescription = description.trim();
    if (!understanding.ready || !completeDescription || projectCreationStartedRef.current) return;
    projectCreationStartedRef.current = true;
    try {
      const inventor = savePreferredName(preferredName);
      const project = createProject({ ownerId: inventor.id, originalObservation: completeDescription });
      window.sessionStorage.setItem(ENTRY_GENERATION_SESSION_KEY, project.id);
      saveProject(project);
      router.push("/workshop");
    } catch {
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
        <label><span>DESCRIBE YOUR INVENTION</span><textarea value={description} onChange={(event) => { setDescription(event.target.value); setHelpingQuestion(""); setError(""); }} rows={8} placeholder="What is it, who does it help, and how do you imagine it working?" /></label>
        <section className="meter" aria-label={`REV understanding ${understanding.score} percent`}><div><span>REV UNDERSTANDING</span><strong>{understanding.ready ? "READY FOR WORKSHOP" : "BUILDING"}</strong></div><progress max="100" value={understanding.score}>{understanding.score}%</progress></section>
        {helpingQuestion && !understanding.ready && <p className="question"><strong>REV ASKS</strong>{helpingQuestion}<small>Add the answer to your description above.</small></p>}
        {understanding.ready ? <><p className="ready">I have enough information to get started. Enter the Workshop and we’ll develop your invention from here.</p><button type="button" onClick={enterWorkshop}>ENTER WORKSHOP <span aria-hidden="true">→</span></button></> : <button type="button" onClick={() => setHelpingQuestion(understanding.helperQuestion)} disabled={!description.trim()}>ASK REV</button>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
      <style jsx>{`
        .home{min-height:100svh;position:relative;display:grid;place-items:center;overflow:hidden;padding:24px;background:#050708;color:#f2f5f6}.background{object-fit:cover;z-index:0}.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(rgba(2,5,7,.28),rgba(2,5,7,.72)),radial-gradient(circle at center,transparent,rgba(0,0,0,.52))}.entry{position:relative;z-index:2;box-sizing:border-box;width:min(620px,100%);padding:clamp(24px,4vw,42px);border:1px solid rgba(85,205,232,.45);border-radius:14px;background:rgba(4,10,14,.9);box-shadow:0 25px 80px rgba(0,0,0,.55);backdrop-filter:blur(12px)}header{text-align:center;margin-bottom:25px}header p,label>span,.meter span,.question strong{display:block;margin:0 0 7px;color:#72d2e4;font-size:10px;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:clamp(29px,5vw,42px);letter-spacing:-.045em}header>span{display:block;margin-top:8px;color:#bdc8cc}label{display:block;margin-top:16px}label small{color:#7f9299}input,textarea{box-sizing:border-box;width:100%;padding:13px;border:1px solid #526873;border-radius:7px;outline:none;background:#071014;color:#f3f7f8;font:inherit}textarea{resize:vertical;line-height:1.5}input:focus,textarea:focus{border-color:#70d3e7;box-shadow:0 0 0 3px rgba(85,205,232,.1)}.meter{margin:18px 0}.meter div{display:flex;justify-content:space-between}.meter strong{color:#d6e4e7;font-size:10px}progress{width:100%;height:9px;accent-color:#55cde8}.question,.ready{padding:13px;border:1px solid #39555e;border-radius:7px;background:#0b1a20;color:#dce8eb}.question small{display:block;margin-top:5px;color:#91a3a9}.ready{border-color:#4a766c;color:#dff5ed}button{width:100%;min-height:48px;border:1px solid #55cde8;border-radius:7px;background:#153d48;color:#f1fdff;font-weight:900;letter-spacing:.05em;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.error{color:#ffb6a9}@media(max-height:760px){.entry{padding:22px}header{margin-bottom:12px}textarea{max-height:150px}}
      `}</style>
    </main>
  );
}
