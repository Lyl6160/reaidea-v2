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
          min-height: calc(100vh - 96px);
          margin: 10px auto 0;
          display: grid;
          grid-template-columns: minmax(220px, 0.72fr) minmax(440px, 1.8fr) minmax(270px, 0.9fr);
          grid-template-rows: 1fr auto;
          overflow: hidden;
          border: 1px solid #405369;
          border-radius: 18px;
          background: #0b141e;
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.38);
        }

        .bench-focus,
        .project-ledger {
          padding: 26px 22px;
          background: linear-gradient(180deg, rgba(27, 42, 54, 0.96), rgba(11, 20, 30, 0.98));
        }

        .bench-focus {
          border-right: 1px solid #35475a;
        }

        .project-ledger {
          border-left: 1px solid #35475a;
        }

        .eyebrow {
          margin: 0;
          color: #52d8eb;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .bench-identity {
          margin: 24px 0 34px;
          padding-bottom: 24px;
          border-bottom: 1px solid #3a4b5d;
        }

        .bench-identity span,
        .bench-identity small {
          display: block;
          color: #8fa0ae;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .bench-identity h1 {
          margin: 7px 0 10px;
          color: #f3f7f9;
          font-size: clamp(25px, 2vw, 34px);
          letter-spacing: -0.035em;
        }

        .bench-focus section + section {
          margin-top: 24px;
        }

        .bench-focus h2 {
          margin: 0 0 9px;
          color: #a9bbc8;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .bench-focus p {
          margin: 0;
          color: #d2dce3;
          font-size: 15px;
          line-height: 1.65;
        }

        .focus-next-move {
          padding: 16px;
          border: 1px solid rgba(82, 216, 235, 0.28);
          border-radius: 11px;
          background: rgba(17, 53, 62, 0.45);
        }

        .bench-work-area {
          min-width: 0;
          padding: 28px;
          background:
            linear-gradient(rgba(13, 28, 39, 0.9), rgba(8, 17, 26, 0.97)),
            repeating-linear-gradient(90deg, transparent 0 31px, rgba(118, 165, 180, 0.035) 32px);
        }

        .work-area-heading,
        .ledger-heading {
          margin-bottom: 22px;
        }

        .work-area-heading h2,
        .ledger-heading h2 {
          margin: 6px 0 0;
          color: #f2f6f8;
          font-size: 24px;
        }

        .ledger-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          padding: 4px;
          border: 1px solid #3a4b5d;
          border-radius: 9px;
          background: #09121b;
        }

        .ledger-tabs button {
          padding: 10px 8px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #8fa0ae;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .ledger-tabs button[aria-selected="true"] {
          background: #1b5260;
          color: #f4fbfc;
        }

        .ledger-content {
          margin-top: 18px;
          color: #d2dce3;
        }

        .bench-footer {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          padding: 13px 18px;
          border-top: 1px solid #405369;
          background: #071019;
        }

        .bench-footer > span {
          color: #8295a4;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.05em;
          text-align: center;
          text-transform: uppercase;
        }

        .back-to-workshop,
        .ask-rev {
          min-height: 44px;
          border-radius: 9px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .back-to-workshop {
          justify-self: start;
          padding: 0 16px;
          border: 1px solid #52d8eb;
          background: #123b47;
          color: #ecfbfd;
          cursor: pointer;
        }

        .ask-rev {
          justify-self: end;
          min-width: 132px;
          display: grid;
          place-content: center;
          padding: 6px 14px;
          border: 1px solid #45515d;
          background: #1a222a;
          color: #7f8b94;
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
          padding: 20px;
          border: 1px solid #365166;
          border-radius: 12px;
          background: rgba(9, 21, 31, 0.88);
        }

        .bench-work-area :global(.specialist-contribution-panel) {
          margin-top: 18px;
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
          color: #eef5f8;
        }

        .bench-work-area :global(.station-summary-label),
        .bench-work-area :global(.specialist-inquiry-heading > span) {
          margin: 0 0 7px;
          color: #52d8eb;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .bench-work-area :global(.specialist-inquiry p),
        .bench-work-area :global(.specialist-inquiry li),
        .bench-work-area :global(.specialist-contribution-panel p) {
          color: #c8d4dc;
          line-height: 1.6;
        }

        .bench-work-area :global(.specialist-inquiry-disclaimer),
        .bench-work-area :global(.specialist-inquiry-boundary) {
          padding: 11px 13px;
          border-left: 3px solid #d0a45d;
          background: rgba(69, 51, 24, 0.36);
        }

        .bench-work-area :global(.specialist-inquiry ol),
        .bench-work-area :global(.specialist-inquiry-notes ul) {
          display: grid;
          gap: 9px;
          padding-left: 22px;
        }

        .bench-work-area :global(.specialist-inquiry-notes),
        .bench-work-area :global(.specialist-contribution-history),
        .bench-work-area :global(.specialist-evidence-adoption) {
          margin-top: 18px;
          padding-top: 17px;
          border-top: 1px solid #35475a;
        }

        .bench-work-area :global(textarea),
        .bench-work-area :global(input),
        .bench-work-area :global(select) {
          box-sizing: border-box;
          width: 100%;
          margin-top: 10px;
          padding: 12px;
          border: 1px solid #41576b;
          border-radius: 8px;
          background: #07121b;
          color: #edf4f7;
          font: inherit;
        }

        .bench-work-area :global(button) {
          margin-top: 12px;
          padding: 11px 15px;
          border: 1px solid #52d8eb;
          border-radius: 8px;
          background: #123b47;
          color: #ecfbfd;
          font-weight: 800;
          cursor: pointer;
        }

        .bench-work-area :global(.specialist-contribution-history article) {
          margin-top: 10px;
          padding: 12px;
          border: 1px solid #33495c;
          border-radius: 8px;
          background: #0a1721;
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
            grid-template-columns: minmax(210px, 0.75fr) minmax(420px, 1.6fr);
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
