"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import WorkshopShell from "../discovery/session/WorkshopShell";
import { getProjectStorageSnapshot, getServerProjectStorageSnapshot, parseProjectSnapshot, saveProject, subscribeToProjectStorage } from "../lib/core/storageEngine";
import { assessWorkshop } from "../lib/workshop/workshopBrain";

export default function WorkshopPage() {
  const projectSnapshot = useSyncExternalStore(subscribeToProjectStorage, getProjectStorageSnapshot, getServerProjectStorageSnapshot);
  const project = useMemo(() => parseProjectSnapshot(projectSnapshot), [projectSnapshot]);

  if (!project) return <main className="missing-workshop"><p>There is no active Project to bring into the workshop.</p><Link href="/">Start a Project</Link><style jsx>{`.missing-workshop{min-height:100vh;display:grid;place-content:center;gap:14px;padding:28px;background:#07101b;color:#eef5fb;text-align:center}.missing-workshop a{color:#18d9ff}`}</style></main>;

  return (
    <main className="workshop-page">
      <header className="workshop-nav"><div><span>reAIdea</span><strong>Living Workshop</strong></div><Link href="/">Home / New Project</Link></header>
      <WorkshopShell project={project} workshop={assessWorkshop(project)} onProjectChange={saveProject} />
      <style jsx>{`
        .workshop-page{min-height:100vh;padding:14px 14px 32px;overflow-x:hidden;background:radial-gradient(circle at 50% 0%,rgba(34,50,63,.72),transparent 42%),#07101b;color:#eef5fb}.workshop-nav{width:min(1540px,calc(100vw - 28px));min-height:58px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 12px}.workshop-nav div{display:flex;align-items:baseline;gap:12px}.workshop-nav span{color:#19d8ff;font-weight:900;letter-spacing:-.03em}.workshop-nav strong{color:#f2f5f7;font-size:14px;letter-spacing:.08em;text-transform:uppercase}.workshop-nav a{padding:10px 13px;border:1px solid #3b4b5c;border-radius:9px;color:#c5d0da;text-decoration:none;font-size:13px;font-weight:750}.workshop-nav a:hover{border-color:#19d8ff;color:#f4fbff}@media(max-width:680px){.workshop-nav strong{display:none}}
      `}</style>
    </main>
  );
}
