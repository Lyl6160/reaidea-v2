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

        <div className="rev-station" aria-label="REV, your AI design engineer">
          <div className="rev-bubble">
            <strong>REV</strong>
            <span>{selectedBench.reason}</span>
          </div>
          <div className="rev-figure" aria-hidden="true">
            <div className="rev-hair" />
            <div className="rev-head" />
            <div className="rev-neck" />
            <div className="rev-body">
              <span>REV</span>
              <i className="rev-pocket" />
            </div>
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
                {id === "prototype" ? (
                  <span className="concept-object">
                    <i />
                    <i />
                    <b />
                    <em />
                  </span>
                ) : (
                  <span className="bench-screen" />
                )}
              </span>
              <span className="bench-cabinet" aria-hidden="true">
                <i />
                <i />
              </span>
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
            radial-gradient(circle at 50% 34%, rgba(255, 219, 157, 0.20), transparent 29%),
            linear-gradient(#343b40 0%, #3a4248 48%, #252b30 65%, #171d22 100%);
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
          background: linear-gradient(#64615a, #3d3d39);
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

        .concept-object {
          position: absolute;
          inset: 1px 9% 1px;
        }

        .concept-object b {
          position: absolute;
          left: 18%;
          right: 18%;
          top: 7px;
          height: 20px;
          border: 1px solid #98a8ad;
          border-radius: 11px 11px 3px 3px;
          background: linear-gradient(#596a72, #35434a);
          transform: skewX(-12deg);
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        }

        .concept-object em {
          position: absolute;
          left: 39%;
          top: 1px;
          width: 31%;
          height: 12px;
          border: 1px solid #8ca0a9;
          background: #465860;
          transform: skewX(-14deg);
        }

        .concept-object i {
          position: absolute;
          bottom: 0;
          width: 14px;
          height: 14px;
          border: 2px solid #8c989c;
          border-radius: 999px;
          background: #20282c;
        }

        .concept-object i:first-child { left: 22%; }
        .concept-object i:nth-child(2) { right: 22%; }

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
        .slot-prototype .bench-top { bottom: 58px; height: 43px; }
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

        @media (max-width: 980px) {
          .living-workshop { width: calc(100vw - 18px); padding: 16px; }
          .workshop-heading { grid-template-columns: 1fr; gap: 10px; }
          .room { min-height: 760px; }
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
          .next-move { min-width: 0; padding: 12px 0 0; border-left: 0; border-top: 1px solid #34465a; }
        }

        @media (max-width: 620px) {
          .room { min-height: 1040px; }
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
