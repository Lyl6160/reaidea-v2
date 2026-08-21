"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { ReactNode } from "react";

import revAvatar from "../../public/images/reaidea-rev-avatar-2026-08-19.png";
import workshopPlate from "../../public/images/reaidea-living-workshop-runtime-neutral-plate-2026-08-19.png";
import { isValidConceptGeometry, type ConceptGeometry } from "../lib/geometry/conceptGeometry";
import type { WorkshopBenchId, WorkshopBenchState } from "../lib/workshop/workshopBrain";

import styles from "./WorkshopRoom.module.css";

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
  prototypeActive: boolean;
  prototypeGeometry?: ConceptGeometry;
  prototypeRepresentation: "2d" | "3d";
  onSelectBench: (id: WorkshopBenchId) => void;
  onReturnToOverview: () => void;
  caption: string;
  children: ReactNode;
};

function stateLabel(state: WorkshopBenchState): string {
  return state.replaceAll("-", " ").toUpperCase();
}

function BenchButton({ bench, compact, onSelectBench }: {
  bench: WorkshopRoomBench;
  compact?: boolean;
  onSelectBench: (id: WorkshopBenchId) => void;
}) {
  const viewingDormant = bench.selected && bench.state === "dormant";

  return (
    <button
      type="button"
      className={`${compact ? styles.compactBench : styles.benchPlaque} ${bench.selected ? styles.selected : ""} ${viewingDormant ? styles.viewingDormant : ""} ${bench.recommended ? styles.recommended : ""}`}
      data-bench={bench.id}
      data-progress={bench.progress}
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
      <span className={styles.benchName}>{bench.shortLabel}</span>
      <span className={styles.benchMarkers}>
        {viewingDormant ? <b className={styles.viewingMarker}>VIEWING · DORMANT</b> : bench.selected && <b className={styles.activeMarker}>ACTIVE</b>}
        {bench.recommended && <b className={styles.recommendedMarker}>REV RECOMMENDS</b>}
        {!bench.selected && !bench.recommended && <b>{stateLabel(bench.state)}</b>}
      </span>
    </button>
  );
}

export default function WorkshopRoom({
  benches,
  projectName,
  projectStatus,
  conceptPreview,
  prototypeActive,
  prototypeGeometry,
  prototypeRepresentation,
  onSelectBench,
  onReturnToOverview,
  caption,
  children,
}: WorkshopRoomProps) {
  const validPrototypeGeometry = prototypeGeometry && isValidConceptGeometry(prototypeGeometry)
    ? prototypeGeometry
    : undefined;
  const showPrototype3D = Boolean(
    prototypeActive &&
    prototypeRepresentation === "3d" &&
    validPrototypeGeometry
  );
  const selectedBench = benches.find((bench) => bench.selected);
  const selectedBenchIsDormant = selectedBench?.state === "dormant";

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
            <strong title={projectName}>{projectName}</strong>
            <small>{projectStatus}</small>
          </div>
          <div className={styles.revIdentity}>
            <span className={styles.revPortrait} aria-hidden="true">
              <Image src={revAvatar} alt="" sizes="88px" unoptimized />
            </span>
            <strong>REV</strong>
            <small>AI Engineering Partner</small>
          </div>
        </header>

        <nav className={styles.desktopBenchMap} aria-label="Workshop benches">
          {benches.map((bench) => (
            <BenchButton key={bench.id} bench={bench} onSelectBench={onSelectBench} />
          ))}
        </nav>

        <section
          id="workshop-central-stage"
          className={`${styles.centralStage} ${showPrototype3D ? styles.prototypeStage : ""}`}
          aria-label={showPrototype3D ? "Current Prototype 3D model" : "Current Concept presentation"}
        >
          <div className={styles.stageHeading}>
            <span>{showPrototype3D ? "PROTOTYPE · LIVE 3D" : "CURRENT DESIGN"}</span>
            {prototypeActive && !showPrototype3D && (
              <small>{validPrototypeGeometry ? "2D CONCEPT SELECTED" : "3D MODEL NEEDS MORE DESIGN DETAIL"}</small>
            )}
          </div>
          <div className={styles.stageContent}>
            {showPrototype3D && validPrototypeGeometry
              ? <Prototype3DViewer geometry={validPrototypeGeometry} presentationMode="stage" autoRotate />
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

      <section className={styles.foregroundConsole} aria-label={selectedBench ? `${selectedBench.shortLabel} foreground console` : "Workshop foreground console"}>
        <div className={styles.consoleScreenPlane}>
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
        </div>
      </section>

      <p className={styles.caption}>{caption}</p>
    </section>
  );
}
