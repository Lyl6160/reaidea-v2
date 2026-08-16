"use client";

import { useState, type ReactNode } from "react";

import type {
  WorkshopBenchId,
  WorkshopBenchState,
} from "../lib/workshop/workshopBrain";

type StandardBenchShellProps = {
  benchId: WorkshopBenchId;
  benchTitle: string;
  benchState: WorkshopBenchState;
  reason: string;
  nextMove: string;
  conceptPreview?: ReactNode;
  children: ReactNode;
  thisBenchLedger: ReactNode;
  projectLedger: ReactNode;
  onBackToWorkshop: () => void;
  askRevState: "unavailable";
};

export default function StandardBenchShell({
  benchId,
  benchTitle,
  benchState,
  reason,
  nextMove,
  conceptPreview,
  children,
  thisBenchLedger,
  projectLedger,
  onBackToWorkshop,
  askRevState,
}: StandardBenchShellProps) {
  const [ledgerTab, setLedgerTab] = useState<"bench" | "project">("bench");

  return (
    <section
      className="standard-bench-shell"
      data-bench-id={benchId}
      data-bench-state={benchState}
      aria-label={`${benchTitle} bench workspace`}
    >
      <aside className="bench-focus">
        <p className="eyebrow">REV · YOUR ENGINEERING PARTNER</p>
        <div className="bench-identity">
          <span>Bench</span>
          <h1>{benchTitle}</h1>
          <small>{benchState}</small>
        </div>
        <section>
          <h2>Why this bench</h2>
          <p>{reason}</p>
        </section>
        <section className="focus-next-move">
          <h2>Next move</h2>
          <p>{nextMove}</p>
        </section>
        {conceptPreview}
      </aside>

      <main className="bench-work-area">
        <div className="work-area-heading">
          <p className="eyebrow">ACTIVE WORK AREA</p>
          <h2>{benchTitle}</h2>
        </div>
        {children}
      </main>

      <aside className="project-ledger" aria-label="Project Ledger">
        <div className="ledger-heading">
          <p className="eyebrow">READ ONLY</p>
          <h2>Project Ledger</h2>
        </div>
        <div className="ledger-tabs" role="tablist" aria-label="Project Ledger views">
          <button
            type="button"
            role="tab"
            aria-selected={ledgerTab === "bench"}
            onClick={() => setLedgerTab("bench")}
          >
            This Bench
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ledgerTab === "project"}
            onClick={() => setLedgerTab("project")}
          >
            Project
          </button>
        </div>
        <div className="ledger-content" role="tabpanel">
          {ledgerTab === "bench" ? thisBenchLedger : projectLedger}
        </div>
      </aside>

      <footer className="bench-footer">
        <button type="button" className="back-to-workshop" onClick={onBackToWorkshop}>
          ← Back to Workshop
        </button>
        <span>{benchTitle} · Focused bench</span>
        <button
          type="button"
          className="ask-rev"
          disabled={askRevState === "unavailable"}
          title="Interactive REV guidance is not enabled yet."
        >
          <strong>Ask REV</strong>
          <small>Coming later</small>
        </button>
      </footer>

      <style jsx>{`
        .standard-bench-shell {
          width: min(1580px, calc(100vw - 28px));
          height: calc(100vh - 96px);
          min-height: calc(100vh - 96px);
          margin: 10px auto 0;
          display: grid;
          grid-template-columns: minmax(220px, 0.72fr) minmax(440px, 1.8fr) minmax(270px, 0.9fr);
          grid-template-rows: 1fr auto;
          overflow: hidden;
          border: 1px solid #514c43;
          border-radius: 16px;
          background: #151719;
          box-shadow:
            0 34px 90px rgba(0, 0, 0, 0.55),
            0 1px 0 rgba(219, 196, 158, 0.14) inset;
        }

        .bench-focus,
        .project-ledger {
          padding: 30px 24px;
        }

        .bench-focus,
        .bench-work-area,
        .project-ledger {
          overflow-y: auto;
          scrollbar-color: #625c51 #171a1b;
          scrollbar-width: thin;
        }

        .bench-focus {
          border-right: 1px solid #514c43;
          background:
            linear-gradient(180deg, rgba(45, 45, 42, 0.98), rgba(24, 26, 27, 0.99)),
            #252626;
          box-shadow: -14px 0 30px rgba(0, 0, 0, 0.2) inset;
        }

        .project-ledger {
          border-left: 1px solid #454b4d;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.014) 1px, transparent 1px),
            #171d20;
          background-size: 24px 24px;
          box-shadow: 14px 0 34px rgba(0, 0, 0, 0.28) inset;
        }

        .eyebrow {
          margin: 0;
          color: #d2ad73;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .bench-identity {
          margin: 26px -10px 36px;
          padding: 19px 18px 21px;
          border: 1px solid #5b554b;
          border-radius: 10px;
          background: #1a1d1e;
          box-shadow:
            0 14px 28px rgba(0, 0, 0, 0.3),
            0 1px 0 rgba(255, 255, 255, 0.04) inset;
        }

        .bench-identity span,
        .bench-identity small {
          display: block;
          color: #a6a39b;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .bench-identity h1 {
          margin: 7px 0 10px;
          color: #f5f0e8;
          font-size: clamp(28px, 2.2vw, 37px);
          letter-spacing: -0.035em;
        }

        .bench-focus section + section {
          margin-top: 24px;
        }

        .bench-focus h2 {
          margin: 0 0 9px;
          color: #c7b898;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .bench-focus p {
          margin: 0;
          color: #dfded8;
          font-size: 16px;
          line-height: 1.68;
        }

        .focus-next-move {
          padding: 18px;
          border: 1px solid rgba(210, 173, 115, 0.38);
          border-radius: 11px;
          background: rgba(79, 61, 37, 0.32);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }

        .bench-work-area {
          min-width: 0;
          padding: 34px 36px 40px;
          background:
            radial-gradient(circle at 48% 4%, rgba(205, 165, 102, 0.14), transparent 38%),
            linear-gradient(180deg, #292724 0, #1b1c1c 190px, #141719 100%);
          box-shadow:
            18px 0 36px rgba(0, 0, 0, 0.25) inset,
            -18px 0 36px rgba(0, 0, 0, 0.2) inset;
        }

        .work-area-heading,
        .ledger-heading {
          margin-bottom: 26px;
        }

        .work-area-heading h2,
        .ledger-heading h2 {
          margin: 6px 0 0;
          color: #f5f0e8;
          font-size: 28px;
          letter-spacing: -0.025em;
        }

        .ledger-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 5px;
          border: 1px solid #4b5659;
          border-radius: 9px;
          background: #0f1416;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24) inset;
        }

        .ledger-tabs button {
          padding: 12px 8px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #a6afb1;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .ledger-tabs button[aria-selected="true"] {
          background: #75603d;
          color: #fff8ec;
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.3);
        }

        .ledger-content {
          margin-top: 22px;
          color: #d8dcda;
        }

        .project-ledger :global(.patent-ledger-view) {
          gap: 20px;
        }

        .project-ledger :global(.patent-ledger-view dl div),
        .project-ledger :global(.patent-ledger-view section) {
          padding: 15px 0;
          border-bottom-color: #454d4e;
        }

        .project-ledger :global(.patent-ledger-view dt),
        .project-ledger :global(.patent-ledger-view section strong) {
          color: #c5b999;
          font-size: 12px;
        }

        .project-ledger :global(.patent-ledger-view dd) {
          color: #f4efe6;
          font-size: 30px;
        }

        .project-ledger :global(.patent-ledger-view section p) {
          color: #d6dad7;
          font-size: 14px;
          line-height: 1.62;
        }

        .project-ledger :global(.ledger-project-name) {
          color: #f4efe6;
          font-size: 20px;
        }

        .project-ledger :global(.ledger-counts div) {
          border-color: #4a5151;
          background: rgba(8, 12, 13, 0.42);
        }

        .bench-footer {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          padding: 15px 20px;
          border-top: 1px solid #514c43;
          background: #101314;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4) inset;
        }

        .bench-footer > span {
          color: #999d9b;
          font-size: 13px;
          font-weight: 750;
          letter-spacing: 0.05em;
          text-align: center;
          text-transform: uppercase;
        }

        .back-to-workshop,
        .ask-rev {
          min-height: 48px;
          border-radius: 9px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .back-to-workshop {
          justify-self: start;
          padding: 0 19px;
          border: 1px solid #d2ad73;
          background: #5f4d31;
          color: #fff8ec;
          box-shadow: 0 7px 18px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        .ask-rev {
          justify-self: end;
          min-width: 132px;
          display: grid;
          place-content: center;
          padding: 6px 14px;
          border: 1px solid #484b49;
          background: #222625;
          color: #777d7a;
        }

        .ask-rev strong,
        .ask-rev small {
          display: block;
        }

        .ask-rev small {
          margin-top: 2px;
          font-size: 9px;
          letter-spacing: 0.06em;
        }

        .bench-work-area :global(.specialist-inquiry),
        .bench-work-area :global(.specialist-contribution-panel) {
          padding: 24px;
          border: 1px solid #55514a;
          border-radius: 12px;
          background: rgba(24, 26, 26, 0.94);
          box-shadow:
            0 18px 34px rgba(0, 0, 0, 0.3),
            0 1px 0 rgba(255, 255, 255, 0.04) inset;
        }

        .bench-work-area :global(.specialist-contribution-panel) {
          margin-top: 24px;
          border-color: #766448;
          background: rgba(31, 29, 25, 0.96);
        }

        .bench-work-area :global(.specialist-inquiry-heading) {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .bench-work-area :global(.specialist-inquiry-heading strong),
        .bench-work-area :global(.specialist-inquiry-lens strong),
        .bench-work-area :global(.specialist-contribution-history > strong),
        .bench-work-area :global(.specialist-evidence-adoption > strong) {
          color: #f4eee4;
        }

        .bench-work-area :global(.station-summary-label),
        .bench-work-area :global(.specialist-inquiry-heading > span) {
          margin: 0 0 7px;
          color: #d2ad73;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .bench-work-area :global(.specialist-inquiry p),
        .bench-work-area :global(.specialist-inquiry li),
        .bench-work-area :global(.specialist-contribution-panel p) {
          color: #d5d6d1;
          font-size: 15px;
          line-height: 1.65;
        }

        .bench-work-area :global(.specialist-inquiry-disclaimer),
        .bench-work-area :global(.specialist-inquiry-boundary) {
          padding: 11px 13px;
          border-left: 3px solid #c89c5b;
          background: rgba(87, 65, 32, 0.3);
        }

        .bench-work-area :global(.specialist-inquiry ol),
        .bench-work-area :global(.specialist-inquiry-notes ul) {
          display: grid;
          gap: 9px;
          padding-left: 22px;
        }

        .bench-work-area :global(.specialist-inquiry ol) {
          margin: 20px 0 0;
        }

        .bench-work-area :global(.specialist-inquiry ol li) {
          padding: 9px 12px;
          border-left: 2px solid #766448;
          background: rgba(255, 255, 255, 0.025);
        }

        .bench-work-area :global(.specialist-inquiry-notes) {
          opacity: 0.72;
          font-size: 13px;
        }

        .bench-work-area :global(.specialist-inquiry-notes),
        .bench-work-area :global(.specialist-contribution-history),
        .bench-work-area :global(.specialist-evidence-adoption) {
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid #494945;
        }

        .bench-work-area :global(textarea),
        .bench-work-area :global(input),
        .bench-work-area :global(select) {
          box-sizing: border-box;
          width: 100%;
          margin-top: 10px;
          padding: 14px;
          border: 1px solid #5e5a52;
          border-radius: 8px;
          background: #101414;
          color: #f1eee7;
          font: inherit;
        }

        .bench-work-area :global(textarea) {
          min-height: 132px;
          line-height: 1.55;
          resize: vertical;
        }

        .bench-work-area :global(textarea:focus),
        .bench-work-area :global(input:focus),
        .bench-work-area :global(select:focus) {
          outline: 2px solid rgba(210, 173, 115, 0.48);
          outline-offset: 2px;
          border-color: #d2ad73;
        }

        .bench-work-area :global(button) {
          margin-top: 12px;
          padding: 13px 18px;
          border: 1px solid #d2ad73;
          border-radius: 8px;
          background: #665235;
          color: #fff8ec;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 7px 16px rgba(0, 0, 0, 0.26);
        }

        .bench-work-area :global(.specialist-contribution-history article) {
          margin-top: 10px;
          padding: 12px;
          border: 1px solid #4d514e;
          border-radius: 8px;
          background: #14191a;
        }

        .bench-work-area :global(.specialist-contribution-history time),
        .bench-work-area :global(.specialist-contribution-history span) {
          display: block;
          margin-top: 6px;
          color: #8fa2b0;
          font-size: 12px;
        }

        @media (max-width: 1080px) {
          .standard-bench-shell {
            height: auto;
            grid-template-columns: minmax(210px, 0.75fr) minmax(420px, 1.6fr);
          }

          .bench-focus,
          .bench-work-area,
          .project-ledger {
            overflow-y: visible;
          }

          .project-ledger {
            grid-column: 1 / -1;
            border-top: 1px solid #35475a;
            border-left: 0;
          }
        }

        @media (max-width: 720px) {
          .standard-bench-shell {
            grid-template-columns: 1fr;
          }

          .bench-focus,
          .bench-work-area,
          .project-ledger {
            grid-column: 1;
            padding: 22px 18px;
            border-right: 0;
            border-left: 0;
            border-bottom: 1px solid #35475a;
          }

          .bench-footer {
            grid-template-columns: 1fr 1fr;
          }

          .bench-footer > span {
            display: none;
          }

          .back-to-workshop,
          .ask-rev {
            justify-self: stretch;
          }
        }
      `}</style>
    </section>
  );
}
