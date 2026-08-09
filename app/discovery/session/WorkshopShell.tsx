"use client";

import { useMemo, useState } from "react";

import type { Project } from "../../lib/core/project";
import type {
  WorkshopBenchId,
  WorkshopBenchSignal,
  WorkshopState,
} from "../../lib/workshop/workshopBrain";

type WorkshopShellProps = {
  project: Project;
  workshop: WorkshopState;
};

const benchPositions: Array<{
  id: WorkshopBenchId;
  shortLabel: string;
  positionClass: string;
}> = [
  { id: "discovery", shortLabel: "Inventor", positionClass: "slot-discovery" },
  { id: "engineering", shortLabel: "Engineering", positionClass: "slot-engineering" },
  { id: "validation", shortLabel: "Validation", positionClass: "slot-validation" },
  { id: "patent", shortLabel: "Patent / IP", positionClass: "slot-patent" },
  { id: "marketing", shortLabel: "Marketing", positionClass: "slot-marketing" },
  {
    id: "manufacturing",
    shortLabel: "Manufacturing / Costing",
    positionClass: "slot-manufacturing",
  },
  { id: "reality", shortLabel: "Reality", positionClass: "slot-reality" },
  { id: "prototype", shortLabel: "Prototype", positionClass: "slot-prototype" },
];

function getBench(workshop: WorkshopState, id: WorkshopBenchId) {
  return workshop.benches.find((bench) => bench.id === id);
}


function conceptKey(project: Project) {
  const source = `${project.projectName}::${project.originalObservation}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `reaidea.workshop.concept.v1.${(hash >>> 0).toString(16)}`;
}

function stateLabel(state: WorkshopBenchSignal["state"]) {
  switch (state) {
    case "active":
      return "Working here";
    case "pulse":
      return "New knowledge";
    case "ready":
      return "Ready";
    case "available":
      return "Available";
    default:
      return "Dormant";
  }
}

export default function WorkshopShell({
  project,
  workshop,
}: WorkshopShellProps) {
  const projectName = project.projectName;
  const [selectedId, setSelectedId] = useState<WorkshopBenchId>(
    workshop.recommendedBench
  );
  const conceptStorageKey = useMemo(() => conceptKey(project), [project]);
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

  const engineeringBench = getBench(workshop, "engineering");
  const canCreateConcept = engineeringBench?.state !== "dormant";

  const conceptSheet = useMemo(() => {
    const engineering = project.engineeringState;
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
        engineering.currentUnderstanding.trim() || project.originalObservation,
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
        engineering.nextEngineeringStep || engineeringBench?.nextMove || workshop.summary,
      evidenceCount: project.evidence.length,
    };
  }, [project, engineeringBench, workshop.summary]);

  const visualConceptBrief = useMemo(() => {
    return {
      title: `CONCEPT 01 · ${projectName}`,
      purpose: conceptSheet.purpose,
      principle: conceptSheet.operatingPrinciple,
      constraints: conceptSheet.constraints,
      assumptions: conceptSheet.assumptions,
      unknowns: conceptSheet.unresolvedQuestions,
      nextMove: conceptSheet.nextEngineeringMove,
    };
  }, [conceptSheet, projectName]);

  const selectedBench = useMemo(
    () =>
      getBench(workshop, selectedId) ??
      getBench(workshop, workshop.recommendedBench) ??
      workshop.benches[0],
    [selectedId, workshop]
  );

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
  }

  function visualiseConcept() {
    if (!conceptCreated) return;

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

  return (
    <section className="living-workshop" aria-label="reAIdea living workshop">
      <div className="workshop-heading">
        <div>
          <p className="workshop-kicker">reAIdea · Living Workshop</p>
          <h2>{projectName}</h2>
        </div>
        <p className="workshop-summary">{workshop.summary}</p>
      </div>

      <div className="room" role="group" aria-label="Workshop benches">
        <div className="ceiling ceiling-left" aria-hidden="true" />
        <div className="ceiling ceiling-right" aria-hidden="true" />
        <div className="beam beam-one" aria-hidden="true" />
        <div className="beam beam-two" aria-hidden="true" />
        <div className="back-wall" aria-hidden="true" />
        <div className="side-wall side-left" aria-hidden="true" />
        <div className="side-wall side-right" aria-hidden="true" />
        <div className="floor" aria-hidden="true" />
        <div className="floor-line floor-line-one" aria-hidden="true" />
        <div className="floor-line floor-line-two" aria-hidden="true" />

        <div className="conduit conduit-main" aria-hidden="true" />
        <div className="conduit conduit-left" aria-hidden="true" />
        <div className="conduit conduit-right" aria-hidden="true" />
        <div className="junction junction-one" aria-hidden="true" />
        <div className="junction junction-two" aria-hidden="true" />
        <div className="junction junction-three" aria-hidden="true" />

        <div className="workshop-plaque" aria-hidden="true">
          <span>reAIdea</span>
          <small>WHERE IDEAS BECOME REAL</small>
        </div>

        <div className="wall-life" aria-hidden="true">
          <span className="shelf shelf-left"><i /><i /><i /></span>
          <span className="shelf shelf-right"><i /><i /></span>
          <span className="tall-cabinet cabinet-left"><i /><i /><i /></span>
          <span className="tall-cabinet cabinet-right"><i /><i /></span>
          <span className="wall-sheet sheet-left"><i /><i /></span>
          <span className="wall-sheet sheet-right"><i /><i /><i /></span>
        </div>

        <div className="rev-station" aria-label="REV, your AI design engineer">
          <div className="rev-bubble">
            <strong>REV</strong>
            <span>{selectedBench.reason}</span>
          </div>
          <div className="rev-figure" aria-hidden="true">
            <div className="rev-hair" />
            <div className="rev-head"><i className="rev-eye rev-eye-left" /><i className="rev-eye rev-eye-right" /><i className="rev-smile" /></div>
            <div className="rev-neck" />
            <div className="rev-body">
              <span>REV</span>
              <i className="rev-pocket" />
            </div>
            <div className="rev-arm rev-arm-left" />
            <div className="rev-arm rev-arm-right" />
            <div className="rev-leg rev-leg-left" />
            <div className="rev-leg rev-leg-right" />
          </div>
        </div>

        {benchPositions.map(({ id, shortLabel, positionClass }) => {
          const bench = getBench(workshop, id);
          if (!bench) return null;

          const isSelected = selectedBench.id === id;

          return (
            <button
              key={id}
              type="button"
              className={`room-bench ${positionClass} state-${bench.state} ${
                isSelected ? "is-selected" : ""
              }`}
              onClick={() => setSelectedId(id)}
              aria-pressed={isSelected}
              aria-label={`${bench.label}: ${stateLabel(bench.state)}`}
            >
              <span className="lamp-rig" aria-hidden="true">
                <span className="lamp-cord" />
                <span className="lamp-cap" />
                <span className="lamp-shade" />
                <span className="room-light" />
                <span className="light-pool" />
              </span>
              <span className="bench-sign">{shortLabel}</span>
              <span className="bench-backsplash" aria-hidden="true">
                <span className="pinboard-line" />
                <span className="pinboard-note note-a" />
                <span className="pinboard-note note-b" />
              </span>
              <span className="bench-top" aria-hidden="true">
                {id !== "prototype" && <span className="bench-screen" />}
                {id !== "prototype" && (
                  <span className="bench-tools">
                    <i className="tool-a" />
                    <i className="tool-b" />
                    <i className="tool-c" />
                  </span>
                )}
                {id === "prototype" && !conceptCreated && <span className="empty-bench-glint" />}
                {id === "prototype" && conceptCreated && (
                  <span className="concept-model" aria-label={`${projectName} concept 01`}>
                    <i className="concept-body" />
                    <i className="concept-deck" />
                    <i className="concept-wheel concept-wheel-left" />
                    <i className="concept-wheel concept-wheel-right" />
                    <b>CONCEPT 01</b>
                  </span>
                )}
              </span>
              <span className="bench-cabinet" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="bench-stool" aria-hidden="true"><i /><b /></span>
              <span className="bench-shadow" aria-hidden="true" />
              <span className="bench-status">{stateLabel(bench.state)}</span>
            </button>
          );
        })}

        <p className="room-caption">
          One project brain · every bench listens to the same evolving invention.
        </p>
      </div>

      <div className={`bench-readout readout-${selectedBench.state}`}>
        <div className="readout-title">
          <div>
            <span className="readout-light" aria-hidden="true" />
            <strong>{selectedBench.label}</strong>
          </div>
          <span>{stateLabel(selectedBench.state)}</span>
        </div>
        <p>{selectedBench.reason}</p>
        <div className="next-move">
          <span>REV · NEXT MOVE</span>
          <strong>{selectedBench.nextMove}</strong>
        </div>
        {selectedBench.id === "engineering" && (
          <div className="engineering-action">
            <div>
              <span>ENGINEERING BENCH</span>
              <strong>Turn what we know into the first visible concept.</strong>
              {!canCreateConcept && (
                <small>REV needs more Engineering definition before this control can be used.</small>
              )}
            </div>
            <button type="button" onClick={createConcept} disabled={!canCreateConcept}>
              {conceptCreated ? "OPEN CONCEPT 01" : "CREATE CONCEPT"}
            </button>
          </div>
        )}
        {conceptCreated && selectedBench.id === "prototype" && (
          <div className="concept-readout">
            <div className="concept-sheet-heading">
              <div>
                <span>PROTOTYPE BENCH · CONCEPT 01</span>
                <strong>{projectName}</strong>
              </div>
              <b>CONCEPT SHEET</b>
            </div>
            <p className="concept-persistence-note">Saved with this Project workshop · safe to refresh or return later.</p>
            <div className="concept-visual-actions">
              <button type="button" className="concept-visualise-button" onClick={visualiseConcept}>
                {conceptVisualised ? "CONCEPT VISUALISED" : "VISUALISE CONCEPT"}
              </button>
              <span>{conceptVisualised ? "First visual study generated from the current engineering understanding." : "Turn the Concept Sheet into a first visual study."}</span>
            </div>
            {conceptVisualised && (
              <div className="concept-visual-board" aria-label="Concept 01 visual study">
                <div className="visual-board-grid" aria-hidden="true" />
                <div className="visual-board-label">CONCEPT 01 · ENGINEERING STUDY</div>
                <div className="visual-object">
                  <i className="visual-object-top" />
                  <i className="visual-object-core" />
                  <i className="visual-object-leg visual-object-leg-left" />
                  <i className="visual-object-leg visual-object-leg-right" />
                  <span className="visual-callout visual-callout-purpose">PURPOSE</span>
                  <span className="visual-callout visual-callout-constraint">CONSTRAINT</span>
                  <span className="visual-callout visual-callout-unknown">UNKNOWN</span>
                </div>
                <div className="visual-board-footer">REV · FIRST-PASS VISUAL ONLY · NOT A CAD MODEL</div>
              </div>
            )}

            {conceptVisualised && (
              <div className="visual-concept-brief">
                <div className="visual-concept-brief-heading">
                  <div>
                    <span>REV · VISUAL CONCEPT BRIEF</span>
                    <strong>{visualConceptBrief.title}</strong>
                  </div>
                  <b>ENGINEERING HANDOFF</b>
                </div>

                <p className="visual-concept-brief-intro">
                  Translate the current Project engineering state into a first-pass visual.
                  This brief is the controlled handoff between REV reasoning and future visual generation.
                </p>

                <div className="visual-concept-brief-grid">
                  <section>
                    <span>PURPOSE</span>
                    <p>{visualConceptBrief.purpose}</p>
                  </section>

                  <section>
                    <span>OPERATING PRINCIPLE</span>
                    <p>{visualConceptBrief.principle}</p>
                  </section>

                  <section>
                    <span>KEY CONSTRAINTS</span>
                    <ul>
                      {visualConceptBrief.constraints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <span>ASSUMPTIONS</span>
                    <ul>
                      {visualConceptBrief.assumptions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="visual-concept-brief-warning">
                    <span>UNRESOLVED QUESTIONS</span>
                    <ul>
                      {visualConceptBrief.unknowns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="visual-concept-brief-next">
                    <span>NEXT ENGINEERING MOVE</span>
                    <p>{visualConceptBrief.nextMove}</p>
                  </section>
                </div>

                <div className="visual-concept-brief-footer">
                  REV · STRUCTURED VISUAL INPUT · NOT A CAD MODEL
                </div>
              </div>
            )}

            {!conceptVisualised && (
              <div className="concept-sheet-grid">
                <section className="concept-sheet-card concept-sheet-wide">
                  <span>PURPOSE</span>
                  <p>{conceptSheet.purpose}</p>
                </section>
                <section className="concept-sheet-card concept-sheet-wide">
                  <span>CURRENT OPERATING PRINCIPLE</span>
                  <p>{conceptSheet.operatingPrinciple}</p>
                </section>
                <section className="concept-sheet-card">
                  <span>KEY CONSTRAINTS</span>
                  <ul>{conceptSheet.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card">
                  <span>ASSUMPTIONS</span>
                  <ul>{conceptSheet.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card concept-sheet-alert">
                  <span>UNRESOLVED QUESTIONS</span>
                  <ul>{conceptSheet.unresolvedQuestions.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="concept-sheet-card concept-sheet-next">
                  <span>NEXT ENGINEERING MOVE</span>
                  <p>{conceptSheet.nextEngineeringMove}</p>
                  <small>{conceptSheet.evidenceCount} evidence item{conceptSheet.evidenceCount === 1 ? "" : "s"} currently attached to the Project.</small>
                </section>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .living-workshop {
          width: min(1540px, calc(100vw - 28px));
          margin-top: 28px;
          margin-left: 50%;
          transform: translateX(-50%);
          padding: 20px 22px 22px;
          border: 1px solid #415064;
          border-radius: 20px;
          background: #111923;
          box-shadow: 0 22px 70px rgba(8, 13, 20, 0.24);
          overflow: hidden;
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

        .workshop-summary {
          margin: 0;
          color: #b7c1cf;
          line-height: 1.55;
        }

        .room {
          position: relative;
          min-height: 680px;
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

        .slot-discovery { left: 3.2%; top: 257px; }
        .slot-engineering { left: 17.8%; top: 228px; }
        .slot-validation { left: 32.4%; top: 212px; }
        .slot-patent { right: 32.4%; top: 212px; }
        .slot-marketing { right: 17.8%; top: 228px; }
        .slot-manufacturing { right: 3.2%; top: 257px; }
        .slot-reality { right: 2.2%; top: 455px; width: 12.5%; }

        .slot-prototype {
          left: 39%;
          top: 448px;
          width: 22%;
          height: 194px;
          z-index: 5;
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
          left: 22.5%;
          top: 430px;
          display: flex;
          gap: 12px;
          align-items: flex-end;
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

        @media (max-width: 700px) {
          .visual-concept-brief-grid {
            grid-template-columns: 1fr;
          }

          .visual-concept-brief-heading {
            flex-direction: column;
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
          .living-workshop { width: calc(100vw - 18px); padding: 16px; }
          .workshop-heading { grid-template-columns: 1fr; gap: 10px; }
          .room { min-height: 760px; }
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
          .slot-prototype { left: 37%; top: 594px; width: 26%; }
          .rev-station { left: 4%; top: 575px; }
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
          .room { min-height: 1040px; }
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
          .slot-prototype { left: 53%; top: 810px; width: 42%; }
          .rev-station { display: none; }
          .room-caption { max-width: 85%; }
        }
      `}</style>
    </section>
  );
}
