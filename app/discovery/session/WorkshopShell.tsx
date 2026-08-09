"use client";

import { useMemo, useState } from "react";

import type {
  WorkshopBenchId,
  WorkshopBenchSignal,
  WorkshopState,
} from "../../lib/workshop/workshopBrain";

type WorkshopShellProps = {
  projectName: string;
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
  projectName,
  workshop,
}: WorkshopShellProps) {
  const [selectedId, setSelectedId] = useState<WorkshopBenchId>(
    workshop.recommendedBench
  );

  const selectedBench = useMemo(
    () =>
      getBench(workshop, selectedId) ??
      getBench(workshop, workshop.recommendedBench) ??
      workshop.benches[0],
    [selectedId, workshop]
  );

  return (
    <section className="living-workshop" aria-label="reAIdea living workshop">
      <div className="workshop-heading">
        <div>
          <p className="workshop-kicker">reAIdea Workshop · Living Proof</p>
          <h2>{projectName}</h2>
        </div>
        <p className="workshop-summary">{workshop.summary}</p>
      </div>

      <div className="room" role="group" aria-label="Workshop benches">
        <div className="roof roof-left" aria-hidden="true" />
        <div className="roof roof-right" aria-hidden="true" />
        <div className="back-wall" aria-hidden="true" />
        <div className="floor" aria-hidden="true" />

        <div className="conduit conduit-main" aria-hidden="true" />
        <div className="conduit conduit-drop drop-one" aria-hidden="true" />
        <div className="conduit conduit-drop drop-two" aria-hidden="true" />
        <div className="conduit conduit-drop drop-three" aria-hidden="true" />
        <div className="conduit conduit-drop drop-four" aria-hidden="true" />
        <div className="conduit conduit-drop drop-five" aria-hidden="true" />

        <div className="rev-station" aria-label="REV, your AI design engineer">
          <div className="rev-bubble">
            <strong>REV</strong>
            <span>{selectedBench.reason}</span>
          </div>
          <div className="rev-figure" aria-hidden="true">
            <div className="rev-head" />
            <div className="rev-body">
              <span>REV</span>
            </div>
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
              <span className="room-light" aria-hidden="true" />
              <span className="bench-sign">{shortLabel}</span>
              <span className="bench-top" aria-hidden="true">
                {id === "prototype" ? (
                  <span className="concept-object">
                    <i />
                    <i />
                    <b />
                  </span>
                ) : (
                  <span className="bench-screen" />
                )}
              </span>
              <span className="bench-cabinet" aria-hidden="true" />
            </button>
          );
        })}

        <p className="room-caption">
          The lights are driven by the Project Brain — not hard-coded decoration.
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
      </div>

      <style jsx>{`
        .living-workshop {
          margin-top: 26px;
          padding: 22px;
          border: 1px solid #263650;
          border-radius: 18px;
          background: #0a111d;
          overflow: hidden;
        }

        .workshop-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr);
          gap: 22px;
          align-items: end;
          margin-bottom: 18px;
        }

        .workshop-kicker {
          margin: 0 0 7px;
          color: #00d4ff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .workshop-heading h2 {
          margin: 0;
          font-size: 24px;
        }

        .workshop-summary {
          margin: 0;
          color: #a8b3c7;
          line-height: 1.55;
        }

        .room {
          position: relative;
          min-height: 520px;
          overflow: hidden;
          border: 1px solid #33445b;
          border-radius: 16px;
          background: #111927;
          isolation: isolate;
        }

        .back-wall {
          position: absolute;
          inset: 0 0 34%;
          background:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px),
            #151d28;
          background-size: 34px 18px, 70px 18px, auto;
          z-index: -5;
        }

        .roof {
          position: absolute;
          top: -105px;
          width: 64%;
          height: 230px;
          border-bottom: 2px solid #566171;
          background: #0d141f;
          z-index: -2;
        }

        .roof-left {
          left: -8%;
          transform: rotate(11deg);
        }

        .roof-right {
          right: -8%;
          transform: rotate(-11deg);
        }

        .floor {
          position: absolute;
          left: -8%;
          right: -8%;
          bottom: -10%;
          height: 49%;
          background:
            linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.035) 50%, transparent 51%),
            linear-gradient(#171f2a, #0d131d);
          transform: perspective(520px) rotateX(56deg);
          transform-origin: bottom;
          z-index: -4;
        }

        .conduit {
          position: absolute;
          background: #596575;
          opacity: 0.82;
          z-index: -1;
        }

        .conduit-main {
          top: 98px;
          left: 5%;
          right: 5%;
          height: 4px;
          border-radius: 999px;
        }

        .conduit-drop {
          top: 98px;
          width: 3px;
          height: 54px;
        }

        .drop-one { left: 13%; }
        .drop-two { left: 31%; }
        .drop-three { left: 49%; }
        .drop-four { left: 67%; }
        .drop-five { left: 85%; }

        .room-bench {
          position: absolute;
          width: 15%;
          min-width: 86px;
          height: 122px;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #e7edf7;
          cursor: pointer;
          z-index: 2;
        }

        .room-bench:focus-visible {
          outline: 2px solid #00d4ff;
          outline-offset: 5px;
          border-radius: 8px;
        }

        .bench-sign {
          position: absolute;
          left: 50%;
          bottom: 96px;
          transform: translateX(-50%);
          width: max-content;
          max-width: 126px;
          padding: 4px 7px;
          border: 1px solid #526177;
          border-radius: 4px;
          background: #111a26;
          color: #dce4ef;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.045em;
          text-transform: uppercase;
        }

        .room-light {
          position: absolute;
          left: 50%;
          bottom: 132px;
          width: 11px;
          height: 11px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: #525b68;
          box-shadow: 0 0 0 3px rgba(82, 91, 104, 0.14);
        }

        .bench-top {
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: 53px;
          height: 45px;
          border: 1px solid #526071;
          border-radius: 5px 5px 2px 2px;
          background: #202a37;
          box-shadow: inset 0 -7px #18212d;
        }

        .bench-cabinet {
          position: absolute;
          left: 15%;
          right: 15%;
          bottom: 5px;
          height: 50px;
          border: 1px solid #445265;
          border-top: 0;
          background:
            linear-gradient(90deg, transparent 49%, #354256 50%, transparent 51%),
            #182230;
        }

        .bench-screen {
          position: absolute;
          left: 28%;
          right: 28%;
          top: 7px;
          height: 23px;
          border: 1px solid #53667d;
          background: #0f1723;
        }

        .concept-object {
          position: absolute;
          inset: 5px 15% 3px;
        }

        .concept-object b {
          position: absolute;
          left: 20%;
          right: 20%;
          top: 9px;
          height: 17px;
          border: 1px solid #8191a5;
          border-radius: 9px 9px 3px 3px;
          background: #2b3746;
          transform: skewX(-12deg);
        }

        .concept-object i {
          position: absolute;
          bottom: 1px;
          width: 13px;
          height: 13px;
          border: 2px solid #77889d;
          border-radius: 999px;
          background: #121a25;
        }

        .concept-object i:first-child { left: 23%; }
        .concept-object i:nth-child(2) { right: 23%; }

        .state-ready .room-light,
        .state-active .room-light {
          background: #22c55e;
          box-shadow: 0 0 7px 3px rgba(34, 197, 94, 0.68);
        }

        .state-pulse .room-light {
          background: #f59e0b;
          box-shadow: 0 0 10px 4px rgba(245, 158, 11, 0.76);
        }

        .state-available .room-light {
          background: #38bdf8;
          box-shadow: 0 0 7px 3px rgba(56, 189, 248, 0.54);
        }

        .is-selected .bench-sign {
          border-color: #b7c6d9;
          color: #fff;
        }

        .is-selected .bench-top {
          border-color: #7c8ca1;
          background: #263344;
        }

        .slot-discovery { left: 3%; top: 168px; }
        .slot-engineering { left: 18%; top: 151px; }
        .slot-validation { left: 34%; top: 142px; }
        .slot-patent { left: 50%; top: 142px; }
        .slot-marketing { left: 66%; top: 151px; }
        .slot-manufacturing { left: 81%; top: 168px; }
        .slot-reality { right: 1.5%; top: 302px; width: 12%; }

        .slot-prototype {
          left: 38%;
          top: 326px;
          width: 24%;
          height: 142px;
        }

        .slot-prototype .bench-sign {
          bottom: 112px;
        }

        .slot-prototype .room-light {
          bottom: 148px;
        }

        .slot-prototype .bench-top {
          bottom: 58px;
          height: 55px;
        }

        .slot-prototype .bench-cabinet {
          height: 57px;
        }

        .rev-station {
          position: absolute;
          left: 20%;
          top: 304px;
          display: flex;
          gap: 10px;
          align-items: flex-end;
          z-index: 4;
        }

        .rev-figure {
          position: relative;
          width: 58px;
          height: 130px;
          flex: 0 0 auto;
        }

        .rev-head {
          position: absolute;
          top: 0;
          left: 16px;
          width: 29px;
          height: 35px;
          border: 1px solid #718096;
          border-radius: 47% 47% 42% 42%;
          background: #303c4a;
        }

        .rev-body {
          position: absolute;
          left: 5px;
          bottom: 0;
          width: 52px;
          height: 96px;
          border: 1px solid #617085;
          border-radius: 14px 14px 7px 7px;
          background: #263342;
        }

        .rev-body span {
          position: absolute;
          top: 16px;
          left: 11px;
          padding: 2px 5px;
          border: 1px solid #78889c;
          border-radius: 3px;
          color: #dbe5f2;
          font-size: 8px;
          font-weight: 900;
        }

        .rev-bubble {
          width: min(230px, 28vw);
          margin-bottom: 61px;
          padding: 10px 12px;
          border: 1px solid #526279;
          border-radius: 10px;
          background: rgba(9, 16, 26, 0.94);
          color: #c7d0de;
          font-size: 11px;
          line-height: 1.45;
        }

        .rev-bubble strong {
          display: block;
          margin-bottom: 4px;
          color: #00d4ff;
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .room-caption {
          position: absolute;
          left: 18px;
          bottom: 14px;
          margin: 0;
          color: #6f7d90;
          font-size: 10px;
          letter-spacing: 0.035em;
        }

        .bench-readout {
          margin-top: 14px;
          padding: 16px 17px;
          border: 1px solid #2b3b52;
          border-radius: 13px;
          background: #101827;
        }

        .readout-title,
        .readout-title > div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .readout-title {
          justify-content: space-between;
        }

        .readout-title > span {
          color: #8fa0b8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .readout-light {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #525b68;
        }

        .readout-active .readout-light,
        .readout-ready .readout-light { background: #22c55e; }
        .readout-pulse .readout-light { background: #f59e0b; }
        .readout-available .readout-light { background: #38bdf8; }

        .bench-readout > p {
          margin: 11px 0 13px;
          color: #bdc7d6;
          line-height: 1.55;
        }

        .next-move {
          padding-top: 12px;
          border-top: 1px solid #29394f;
        }

        .next-move span {
          display: block;
          margin-bottom: 5px;
          color: #00d4ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.09em;
        }

        .next-move strong {
          color: #e5ebf4;
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 760px) {
          .workshop-heading {
            grid-template-columns: 1fr;
          }

          .room {
            min-height: 660px;
          }

          .room-bench {
            width: 27%;
            min-width: 0;
          }

          .slot-discovery { left: 4%; top: 158px; }
          .slot-engineering { left: 36.5%; top: 158px; }
          .slot-validation { left: 69%; top: 158px; }
          .slot-patent { left: 4%; top: 302px; }
          .slot-marketing { left: 36.5%; top: 302px; }
          .slot-manufacturing { left: 69%; top: 302px; }
          .slot-reality { right: 4%; top: 456px; width: 27%; }
          .slot-prototype { left: 36.5%; top: 474px; width: 27%; }

          .rev-station {
            left: 5%;
            top: 474px;
          }

          .rev-bubble {
            display: none;
          }

          .conduit-drop { display: none; }

          .room-caption {
            max-width: 56%;
          }
        }
      `}</style>
    </section>
  );
}
