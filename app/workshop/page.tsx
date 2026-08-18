"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import WorkshopShell from "../discovery/session/WorkshopShell";
import { createProject } from "../lib/core/project";
import { loadInventor } from "../lib/core/inventorStorage";
import {
  getProjectStorageSnapshot,
  getServerProjectStorageSnapshot,
  parseProjectSnapshot,
  saveProject,
  subscribeToProjectStorage,
} from "../lib/core/storageEngine";
import { assessWorkshop, CANONICAL_WORKSHOP_BENCHES } from "../lib/workshop/workshopBrain";
import { saveRollingBenchNotes } from "./RollingBenchFlow";
import WorkshopRoom from "./WorkshopRoom";

const NEW_JOURNEY_SESSION_KEY = "reaidea.new-journey.v2";
const ENTRY_GENERATION_SESSION_KEY = "reaidea.entry-generation.v2";
const subscribeToSessionFlag = () => () => undefined;
const getNewJourneySnapshot = () => typeof window !== "undefined" && window.sessionStorage.getItem(NEW_JOURNEY_SESSION_KEY) === "true";
const getServerNewJourneySnapshot = () => false;

export default function WorkshopPage() {
  const [journeyCompleted, setJourneyCompleted] = useState(false);
  const newJourneyRequested = useSyncExternalStore(
    subscribeToSessionFlag,
    getNewJourneySnapshot,
    getServerNewJourneySnapshot
  );
  const projectSnapshot = useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectStorageSnapshot,
    getServerProjectStorageSnapshot
  );

  const project = useMemo(
    () => parseProjectSnapshot(projectSnapshot),
    [projectSnapshot]
  );

  if (newJourneyRequested && !journeyCompleted) {
    return <NewJourneyWorkshop onProjectCreated={() => setJourneyCompleted(true)} />;
  }

  if (!project) {
    return (
      <main className="missing-workshop">
        <p>There is no active Project to bring into the workshop.</p>
        <Link href="/">Start a Project</Link>
        <style jsx>{`
          .missing-workshop {
            min-height: 100vh;
            display: grid;
            place-content: center;
            gap: 14px;
            padding: 28px;
            background: #07101b;
            color: #eef5fb;
            text-align: center;
          }
          .missing-workshop a {
            color: #18d9ff;
          }
        `}</style>
      </main>
    );
  }

  const workshop = assessWorkshop(project);

  return (
    <main className="workshop-page">
      <header className="workshop-nav">
        <div>
          <span>reAIdea</span>
          <strong>Living Workshop</strong>
        </div>
        <Link href="/">Home / New Project</Link>
      </header>

      <WorkshopShell
        project={project}
        workshop={workshop}
        onProjectChange={saveProject}
      />

      <style jsx>{`
        .workshop-page {
          min-height: 100vh;
          padding: 14px 14px 32px;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 50% 0%, rgba(34, 50, 63, 0.72), transparent 42%),
            #07101b;
          color: #eef5fb;
        }

        .workshop-nav {
          width: min(1540px, calc(100vw - 28px));
          min-height: 58px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 0 12px;
        }

        .workshop-nav div {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .workshop-nav span {
          color: #19d8ff;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .workshop-nav strong {
          color: #f2f5f7;
          font-size: 14px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .workshop-nav a {
          padding: 10px 13px;
          border: 1px solid #3b4b5c;
          border-radius: 9px;
          color: #c5d0da;
          text-decoration: none;
          font-size: 13px;
          font-weight: 750;
        }

        .workshop-nav a:hover {
          border-color: #19d8ff;
          color: #f4fbff;
        }

        @media (max-width: 680px) {
          .workshop-nav strong {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function NewJourneyWorkshop({ onProjectCreated }: { onProjectCreated: () => void }) {
  const [idea, setIdea] = useState("");
  const [error, setError] = useState("");
  const [inventorBenchOpen, setInventorBenchOpen] = useState(false);
  const projectCreationStartedRef = useRef(false);

  function bringIdeaToLife() {
    const description = idea.trim();
    if (!description) {
      setError("Describe your invention before REV creates the first concept.");
      return;
    }
    const inventor = loadInventor();
    if (!inventor) {
      setError("Return Home and tell REV what to call you before entering the Workshop.");
      return;
    }
    if (projectCreationStartedRef.current) return;
    projectCreationStartedRef.current = true;
    const project = createProject({ ownerId: inventor.id, originalObservation: description });
    saveRollingBenchNotes(project.id, "knowledge", [{ question: "Describe your invention", answer: description }]);
    window.sessionStorage.setItem(ENTRY_GENERATION_SESSION_KEY, project.id);
    window.sessionStorage.removeItem(NEW_JOURNEY_SESSION_KEY);
    saveProject(project);
    onProjectCreated();
  }

  return (
    <main className="journey-workshop">
      <header><div><span>reAIdea</span><strong>Living Workshop</strong></div><Link href="/">Home / New Project</Link></header>
      <section className="fresh-workshop-shell" aria-label="Living Engineering Workshop">
        <header className="fresh-workshop-heading"><p>reAIdea · Living Workshop</p><h1>Living Engineering Workshop</h1><span>Welcome to your Workshop.</span></header>
        <section className="fresh-workshop-brief" aria-label="REV Workshop Brief"><div><span>REV · WORKSHOP BRIEF</span><h2>Welcome to your Workshop.</h2><p>Start at the Inventor&apos;s Bench so we can bring your idea to life.</p><strong>Next move · Tell REV what your invention is intended to do.</strong></div><button type="button" onClick={() => setInventorBenchOpen(true)}>OPEN INVENTOR&apos;S BENCH</button></section>
        <div className="fresh-workshop-flow" aria-label="Workshop stages">{["Inventor","Engineering","Prototype","Testing","Patent / IP","Manufacturing","Marketing","Reality"].map((stage,index,stages)=><span key={stage} className={index===0?"is-recommended":""}><b>{stage}</b>{index<stages.length-1&&<i>→</i>}</span>)}</div>
        <WorkshopRoom
          revMessage="Welcome to your Workshop. Start at the Inventor's Bench so we can bring your idea to life."
          conceptPreview={<section className="concept-preview" aria-label="Idea evolving"><span>IDEA EVOLVING</span><strong>YOUR IDEA STARTS HERE</strong><small>No Project created yet</small></section>}
          benches={CANONICAL_WORKSHOP_BENCHES.map(({id,shortLabel,positionClass})=>({id,shortLabel,positionClass,state:id==="knowledge"?"pulse":"dormant",progress:"red",selected:inventorBenchOpen&&id==="knowledge",recommended:id==="knowledge"}))}
          onSelectBench={(id) => { if (id === "knowledge") setInventorBenchOpen(true); }}
          caption="Your Workshop is ready · no Project has been created yet."
        />
        {!inventorBenchOpen ? <section className="fresh-floor-guidance" aria-label="Workshop Overview"><div><strong>WORKSHOP FLOOR</strong><span>NO BENCH SELECTED</span></div><p>Welcome to your Workshop. Start at the Inventor&apos;s Bench so we can bring your idea to life.</p><button type="button" onClick={() => setInventorBenchOpen(true)}>OPEN INVENTOR&apos;S BENCH</button><button type="button" disabled>ASK REV · COMING LATER</button></section> : <section className="journey-bench" aria-label="Inventor's Bench work area">
          <div className="journey-bench-heading"><div><span>ACTIVE BENCH</span><h1>Inventor&apos;s Bench</h1><p>Show REV your idea.</p></div><b>RED</b></div>
          <div className="journey-question"><span>REV ASKS</span><h2>Describe your invention</h2><p>Tell REV what it looks like, the main parts you imagine, and anything important you want included. Rough is fine — we&apos;ll use this to create your first visual concept.</p><label><span>YOUR DESCRIPTION</span><textarea value={idea} onChange={(event) => { setIdea(event.target.value); setError(""); }} rows={9} placeholder="Describe what your invention looks like and what it includes..." /></label><button type="button" disabled title="File upload is not available in this build.">ADD A SKETCH OR FILE · COMING LATER</button><button type="button" onClick={bringIdeaToLife} disabled={!idea.trim()}>BRING MY IDEA TO LIFE</button>{error && <p className="journey-error" role="alert">{error}</p>}</div>
          <footer><button type="button" disabled>ASK REV · COMING LATER</button><button type="button" onClick={() => setInventorBenchOpen(false)}>BACK TO WORKSHOP</button></footer>
        </section>}
      </section>
      <style jsx>{`
        .fresh-workshop-shell{width:min(1540px,calc(100vw - 28px));margin:10px auto}.fresh-workshop-heading{padding:18px 4px}.fresh-workshop-heading p,.fresh-workshop-brief span{margin:0;color:#69d9e9;font-size:10px;font-weight:850;letter-spacing:.1em}.fresh-workshop-heading h1{margin:5px 0;font-size:28px}.fresh-workshop-heading>span{color:#aebcbe}.fresh-workshop-brief{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:12px;padding:20px;border:1px solid #4c5552;border-radius:12px;background:linear-gradient(135deg,#252822,#12191b)}.fresh-workshop-brief h2{margin:7px 0 3px}.fresh-workshop-brief p{margin:0 0 9px;color:#bdc8c7}.fresh-workshop-brief strong{font-size:11px;color:#d9c892}.fresh-workshop-brief button,.fresh-floor-guidance button{min-height:42px;padding:0 15px;border:1px solid #69d9e9;border-radius:7px;background:#173b45;color:#e9fbff;font-weight:850}.fresh-workshop-flow{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 12px;padding:9px;border:1px solid #3f494a;border-radius:9px;background:#101719;color:#788689;font-size:9px}.fresh-workshop-flow span{display:flex;gap:8px}.fresh-workshop-flow .is-recommended{color:#7de1eb}.fresh-workshop-flow i{font-style:normal;color:#566368}.fresh-floor-guidance{margin-top:14px;padding:18px;border:1px solid #4c595b;border-radius:12px;background:#101719}.fresh-floor-guidance>div{display:flex;justify-content:space-between;color:#dce5e3}.fresh-floor-guidance>div span{color:#91a0a1;font-size:10px}.fresh-floor-guidance p{color:#b7c3c2}.fresh-floor-guidance button+button{margin-left:8px;opacity:.5}
        .journey-workshop{min-height:100vh;padding:14px;background:radial-gradient(circle at 50% 0%,rgba(34,50,63,.72),transparent 42%),#07101b;color:#eef5fb}.journey-workshop>header{width:min(1540px,calc(100vw - 28px));min-height:58px;margin:auto;display:flex;align-items:center;justify-content:space-between;padding:0 12px}.journey-workshop>header div{display:flex;gap:12px;align-items:baseline}.journey-workshop>header span{color:#19d8ff;font-weight:900}.journey-workshop>header strong{font-size:14px;letter-spacing:.08em;text-transform:uppercase}.journey-workshop a{color:#c5d0da;text-decoration:none}.journey-floor{width:min(1540px,calc(100vw - 28px));margin:10px auto;display:grid;grid-template-columns:minmax(220px,.55fr) minmax(480px,1.8fr);overflow:hidden;border:1px solid #514c43;border-radius:16px;background:#151719;box-shadow:0 30px 80px rgba(0,0,0,.5)}.journey-floor>aside{padding:30px 24px;border-right:1px solid #514c43;background:linear-gradient(180deg,#2d2d2a,#181a1b)}.journey-floor>aside p,.journey-question>span,.journey-bench-heading span,label>span{color:#69d9e9;font-size:10px;font-weight:850;letter-spacing:.1em}.journey-floor>aside strong,.journey-floor>aside span{display:block}.journey-floor>aside strong{margin:8px 0;color:#f4efe6;font-size:22px}.journey-floor>aside span{color:#c8cfcc;line-height:1.5}.journey-overview{display:grid;place-content:center;min-height:560px;padding:34px;text-align:center;background:radial-gradient(circle at 50% 45%,rgba(35,122,139,.14),transparent 48%),#111719}.journey-overview>span{color:#69d9e9;font-size:10px;font-weight:850;letter-spacing:.12em}.journey-overview h1{margin:10px 0 4px;font-size:32px}.journey-overview>p{margin:0;color:#b9c8cb}.recommended-inventor{width:min(420px,100%);margin:28px auto 0;padding:20px;border:1px solid #69d9e9;border-radius:12px;background:#102c33;color:#ecfdff;cursor:pointer;box-shadow:0 0 24px rgba(80,210,228,.2);animation:recommended-bench-glow 1.6s ease-in-out infinite alternate}.recommended-inventor span,.recommended-inventor strong,.recommended-inventor small{display:block}.recommended-inventor span{color:#86e5ef;font-size:9px;letter-spacing:.12em}.recommended-inventor strong{margin:7px 0;font-size:22px}.recommended-inventor small{color:#d7f9fc;font-weight:850}.overview-footer{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:24px;color:#8e9c9f;font-size:10px;letter-spacing:.08em}.overview-footer button{min-height:38px;padding:0 13px;border:1px solid #445359;border-radius:7px;background:#172025;color:#77868a}.journey-bench-heading{display:flex;justify-content:space-between;padding:22px;border-bottom:1px solid rgba(97,210,230,.2);background:#0b1418}.journey-bench-heading h1{margin:6px 0;color:#f2f8fa}.journey-bench-heading p{margin:0;color:#bfd0d5}.journey-bench-heading b{align-self:flex-start;padding:6px 9px;border-radius:999px;background:#6b2020;color:#ffd7d7;font-size:10px}.journey-question{margin:22px;padding:22px;border:1px solid rgba(97,210,230,.24);border-radius:10px;background:#10191d}.journey-question h2{font-size:26px}.journey-question p{color:#b9c8cb}.journey-question label{display:grid;gap:8px}.journey-question textarea{box-sizing:border-box;width:100%;resize:vertical;padding:13px;border:1px solid #496069;border-radius:9px;background:#081114;color:#edf2ef;font:inherit;line-height:1.55}.journey-question button,.journey-bench footer button{min-height:40px;margin:12px 8px 0 0;padding:0 14px;border:1px solid #59cadc;border-radius:7px;background:#173b45;color:#e9fbff;font-weight:850}.journey-question button:disabled,.journey-bench footer button:disabled{opacity:.5}.journey-error{color:#ffb6a9!important}.journey-bench footer{display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:12px 18px;border-top:1px solid rgba(97,210,230,.2)}.journey-bench footer button{margin:0}@keyframes recommended-bench-glow{from{box-shadow:0 0 10px rgba(80,210,228,.12)}to{box-shadow:0 0 30px rgba(80,210,228,.38)}}@media(prefers-reduced-motion:reduce){.recommended-inventor{animation:none}}@media(max-width:760px){.journey-floor{grid-template-columns:1fr}.journey-floor>aside{border-right:0;border-bottom:1px solid #514c43}}
      `}</style>
    </main>
  );
}
