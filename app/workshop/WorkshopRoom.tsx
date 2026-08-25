"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, type ReactNode } from "react";

import revGuide from "../../public/images/reaidea-rev-friendly-ai-approved-2026-08-24.png";
import workshopPlate from "../../public/images/reaidea-workshop-clean-scene-approved-2026-08-25.png";
import { isValidConceptGeometry } from "../lib/geometry/conceptGeometry";
import type { WorkshopBenchId, WorkshopBenchState } from "../lib/workshop/workshopBrain";

import styles from "./WorkshopRoom.module.css";
import type { WorkshopStagePresentation } from "./workshopStagePresentation";

const Prototype3DViewer = dynamic(() => import("./Prototype3DViewer"), {
  ssr: false,
  loading: () => <p className={styles.stageLoading}>Preparing the current 3D model…</p>,
});

export type WorkshopRoomBench = {
  id: WorkshopBenchId;
  shortLabel: string;
  positionClass: string;
  state: WorkshopBenchState;
  progress: "red" | "yellow" | "green";
  selected: boolean;
  recommended: boolean;
};

type WorkshopRoomProps = {
  benches: WorkshopRoomBench[];
  projectName: string;
  projectStatus: string;
  conceptPreview: ReactNode;
  stagePresentation: WorkshopStagePresentation;
  prototypeActive: boolean;
  prototypeRepresentation: "2d" | "3d";
  onSelectBench: (id: WorkshopBenchId) => void;
  onReturnToOverview: () => void;
  caption: string;
  children: ReactNode;
};

function stateLabel(state: WorkshopBenchState): string {
  return state.replaceAll("-", " ").toUpperCase();
}

function WorkshopStationEmblem({ id }: { id: WorkshopBenchId }) {
  const commonProps = {
    className: styles.stationEmblem,
    viewBox: "0 0 48 48",
    fill: "none",
    "aria-hidden": true,
    focusable: false,
  } as const;

  if (id === "knowledge") {
    return <svg {...commonProps}><circle cx="24" cy="15" r="6" /><path d="M13 39c1-8 5-13 11-13s10 5 11 13M18 17c-5 2-8 6-8 11m20-11c5 2 8 6 8 11" /><path className={styles.stationAccent} d="M8 13h6m-3-3v6m23-6 4-4m-2 7h6" /></svg>;
  }
  if (id === "engineering") {
    return <svg {...commonProps}><circle cx="24" cy="11" r="4" /><path d="m22 15-9 27m13-27 9 27M16 31h16M10 42h8m12 0h8" /><path className={styles.stationAccent} d="M13 22 33 14M17 18l3 5" /></svg>;
  }
  if (id === "prototype") {
    return <svg {...commonProps}><path d="m24 7 13 8-13 8-13-8 13-8Zm-13 8v17l13 8 13-8V15M24 23v17" /><ellipse className={styles.stationAccent} cx="24" cy="24" rx="20" ry="9" transform="rotate(-14 24 24)" /></svg>;
  }
  if (id === "validation") {
    return <svg {...commonProps}><rect x="11" y="9" width="27" height="34" rx="3" /><path d="M18 9V5h13v4M17 20l3 3 5-6m5 3h4M17 31l3 3 5-6m5 3h4" /><path className={styles.stationAccent} d="M14 13h21" /></svg>;
  }
  if (id === "patent") {
    return <svg {...commonProps}><path d="M24 5 39 10v12c0 10-6 17-15 22C15 39 9 32 9 22V10l15-5Z" /><circle cx="22" cy="22" r="7" /><path d="m27 27 6 6M19 22h6m-3-3v6" /><path className={styles.stationAccent} d="m24 8 11 4" /></svg>;
  }
  if (id === "manufacturing") {
    return <svg {...commonProps}><path d="M6 42V22l12 7v-8l11 7v-8l13 8v14H6ZM13 22V9h8v18M12 36h5m6 0h5m6 0h4" /><path className={styles.stationAccent} d="m33 14 2-6m3 9 5-3m-13-3-2-5" /></svg>;
  }
  if (id === "marketing") {
    return <svg {...commonProps}><path d="M7 42h35M11 38V29h8v9m4 0V21h8v17m4 0V12h8v26M10 22l10-9 8 4L41 6" /><path className={styles.stationAccent} d="m35 6 6 .2-.5 6" /></svg>;
  }
  return <svg {...commonProps}><circle cx="24" cy="24" r="18" /><circle className={styles.stationAccent} cx="24" cy="24" r="13" /><path d="m15 24 6 6 12-14" /></svg>;
}

function BenchButton({ bench, compact, onSelectBench }: {
  bench: WorkshopRoomBench;
  compact?: boolean;
  onSelectBench: (id: WorkshopBenchId) => void;
}) {
  const viewingDormant = bench.selected && bench.state === "dormant";
  const visibleState = bench.selected
    ? viewingDormant ? "SELECTED · DORMANT" : "SELECTED"
    : bench.recommended
      ? "REV RECOMMENDS"
      : stateLabel(bench.state);

  return (
    <button
      type="button"
      className={`${compact ? styles.compactBench : styles.benchPlaque} ${bench.selected ? styles.selected : ""} ${viewingDormant ? styles.viewingDormant : ""} ${bench.recommended ? styles.recommended : ""}`}
      data-bench={bench.id}
      data-state={bench.state}
      onClick={() => onSelectBench(bench.id)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelectBench(bench.id);
      }}
      aria-pressed={bench.selected}
      aria-label={`${bench.shortLabel}. ${stateLabel(bench.state)}${viewingDormant ? ". Viewing dormant bench" : bench.selected ? ". Active bench" : ""}${bench.recommended ? ". REV recommends" : ""}`}
    >
      <span className={styles.stationEmblemWrap}><WorkshopStationEmblem id={bench.id} /></span>
      <span className={`${styles.benchName} ${styles.benchNameText}`}>{bench.shortLabel}</span>
      <span className={`${styles.benchMarkers} ${styles.benchStatusLine}`}>
        <b>{visibleState}</b>
      </span>
    </button>
  );
}

export default function WorkshopRoom({
  benches,
  projectName,
  projectStatus,
  conceptPreview,
  stagePresentation,
  prototypeActive,
  prototypeRepresentation,
  onSelectBench,
  onReturnToOverview,
  caption,
  children,
}: WorkshopRoomProps) {
  const validPrototypeGeometry = stagePresentation.kind === "interactive-3d" && isValidConceptGeometry(stagePresentation.geometry)
    ? stagePresentation.geometry
    : undefined;
  const showPrototype3D = Boolean(validPrototypeGeometry);
  const selectedBench = benches.find((bench) => bench.selected);
  const selectedBenchIsDormant = selectedBench?.state === "dormant";
  const [viewerControlsHost, setViewerControlsHost] = useState<HTMLDivElement | null>(null);

  return (
    <section className={styles.workshopRoom} aria-label="reAIdea Living Workshop">
      <h1 className={styles.visuallyHidden}>reAIdea Living Workshop</h1>
      <div className={styles.panorama}>
        <Image
          src={workshopPlate}
          alt=""
          className={styles.workshopPlate}
          sizes="(max-width: 980px) 100vw, 1500px"
          preload
          unoptimized
        />

        <header className={styles.architecturalHeader}>
          <div className={styles.liveIdentity} aria-label="reAIdea Living Workshop">
            <strong><span>re</span><span className={styles.ai}>AI</span><span>dea</span></strong>
            <small>Living Engineering Workshop</small>
          </div>
          <div className={styles.activeProject} aria-label={`Active Project: ${projectName}. ${projectStatus}`}>
            <span>ACTIVE PROJECT</span>
            <strong>{projectName}</strong>
            <small>{projectStatus}</small>
          </div>
          <div className={styles.revIdentity}>
            <strong>REV</strong>
            <small>AI Engineering Partner</small>
          </div>
        </header>

        <div className={styles.revGuideFigure} aria-hidden="true">
          <Image src={revGuide} alt="" sizes="(max-width: 700px) 0px, 22vw" unoptimized />
        </div>

        <nav className={styles.desktopBenchMap} aria-label="Workshop benches">
          {benches.map((bench) => (
            <BenchButton key={bench.id} bench={bench} onSelectBench={onSelectBench} />
          ))}
        </nav>

        <section
          id="workshop-central-stage"
          className={`${styles.centralStage} ${showPrototype3D ? styles.prototypeStage : ""} ${stagePresentation.kind === "visual-concept" ? styles.visualConceptStage : ""}`}
          aria-label={showPrototype3D ? "Current Prototype 3D model" : "Current Concept presentation"}
        >
          <div className={styles.stageHeading}>
            <span>{showPrototype3D ? "PROTOTYPE · LIVE 3D" : stagePresentation.kind === "visual-concept" ? "VISUAL CONCEPT" : "CURRENT DESIGN"}</span>
            {stagePresentation.kind === "visual-concept" && (
              <small>VISUAL CONCEPT · {stagePresentation.blocker}</small>
            )}
            {prototypeActive && !showPrototype3D && stagePresentation.kind === "empty" && (
              <small>{prototypeRepresentation === "2d" ? "2D CONCEPT SELECTED" : "3D MODEL NEEDS MORE DESIGN DETAIL"}</small>
            )}
          </div>
          <div className={styles.stageContent}>
            {showPrototype3D && validPrototypeGeometry
              ? <Prototype3DViewer geometry={validPrototypeGeometry} presentationMode="stage" autoRotate controlsHost={viewerControlsHost} />
              : conceptPreview}
          </div>
        </section>
      </div>

      <nav className={styles.compactBenchSelector} aria-label="Workshop benches">
        <span className={styles.selectorHeading}>
          SELECT A BENCH BELOW
          <small>WORKSHOP BENCHES · SWIPE TO EXPLORE ALL EIGHT</small>
        </span>
        <div className={styles.compactBenchRail}>
          {benches.map((bench) => (
            <BenchButton key={bench.id} bench={bench} compact onSelectBench={onSelectBench} />
          ))}
        </div>
      </nav>

      <section
        className={`${styles.foregroundConsole} ${!selectedBench ? styles.overviewConsole : ""}`}
        aria-labelledby={!selectedBench ? "workshop-decision-panel-title" : undefined}
        aria-label={selectedBench ? `${selectedBench.shortLabel} foreground console` : undefined}
      >
        <div className={styles.consoleScreenPlane}>
          {!selectedBench && <h2 id="workshop-decision-panel-title" className={styles.visuallyHidden}>Workshop decision panel</h2>}
          <header className={styles.consoleHeader}>
            <div className={styles.consoleWorkingState}>
              <strong>{selectedBench ? `${selectedBenchIsDormant ? "VIEWING" : "WORKING AT"} · ${selectedBench.shortLabel}` : "WORKSHOP FLOOR · FULL OVERVIEW"}</strong>
            </div>
            <div className={styles.consoleStatus}>
              <span>{selectedBench ? selectedBenchIsDormant ? "VIEWING · DORMANT" : `${selectedBench.progress.toUpperCase()} · ACTIVE` : `PROJECT · ${projectStatus.toUpperCase()}`}</span>
            </div>
          </header>
          {selectedBench && (
            <button type="button" className={styles.silverConsoleControl} onClick={onReturnToOverview}>SHOW WORKSHOP FLOOR</button>
          )}
          <div className={styles.consoleContent}>{children}</div>
          {showPrototype3D && (
            <section className={styles.viewerControlsPanel} aria-labelledby="workshop-viewer-controls-title">
              <span id="workshop-viewer-controls-title">INTERACTIVE 3D VIEW CONTROLS</span>
              <div ref={setViewerControlsHost} className={styles.viewerControlsHost} />
            </section>
          )}
        </div>
      </section>

      <p className={styles.caption}>{caption}</p>
    </section>
  );
}
