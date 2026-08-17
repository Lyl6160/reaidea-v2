"use client";

import Link from "next/link";
import ProjectReviewView from "./ProjectReviewView";
import {
  type ChangeEvent,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  assessDiscovery,
  recordDiscoveryAnswer,
} from "../../lib/workshop/discoveryReasoning";
import {
  createMission,
  stripMarkdownFormatting,
  getMissionCompleteMessage,
  getNextMissionMessage,
} from "../../lib/workshop/missionOrchestration";
import { createValidationPlan } from "../../lib/workshop/validationPlanning";
import {
  getProjectStorageSnapshot,
  getServerProjectStorageSnapshot,
  parseProjectSnapshot,
  saveProject,
  subscribeToProjectStorage,
} from "../../lib/core/storageEngine";
import {
  getInventorStorageSnapshot,
  getServerInventorStorageSnapshot,
  parseInventorSnapshot,
  subscribeToInventorStorage,
} from "../../lib/core/inventorStorage";

export default function DiscoverySession() {
  const projectSnapshot = useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectStorageSnapshot,
    getServerProjectStorageSnapshot
  );
  const inventorSnapshot = useSyncExternalStore(
    subscribeToInventorStorage,
    getInventorStorageSnapshot,
    getServerInventorStorageSnapshot
  );

  const project = useMemo(
    () => parseProjectSnapshot(projectSnapshot),
    [projectSnapshot]
  );
  const inventor = useMemo(
    () => parseInventorSnapshot(inventorSnapshot),
    [inventorSnapshot]
  );

  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  if (!project) {
    return <MissingProject />;
  }

  const assessment = assessDiscovery(project);
  const nextQuestion = assessment.nextQuestion;
  const nextMission = nextQuestion ? createMission(nextQuestion, project) : null;
  const greeting = inventor?.preferredName
    ? `Good to have you at the bench, ${inventor.preferredName}.`
    : "Good to have you at the bench.";

  function saveAnswer() {
    if (!project || !nextQuestion) {
      return;
    }

    const cleanedAnswer = answer.trim();

    if (!cleanedAnswer) {
      setError("Add your response before we update the Project.");
      return;
    }

    const updatedProject = recordDiscoveryAnswer(
      project,
      nextQuestion,
      cleanedAnswer
    );
    saveProject(updatedProject);
    setAnswer("");
    setError("");
  }

  function planValidation() {
    if (!project) {
      return;
    }

    const result = createValidationPlan(project);

    if (result.status === "not-ready") {
      setError("Discovery must reach its checkpoint before validation planning begins.");
      return;
    }

    saveProject(result.project);
    setError("");
  }

  return (
    <main className="discovery-page">
      <section className="discovery-shell">
        <header className="bench-header">
          <div>
            <p className="eyebrow">Discovery Bench</p>
            <h1>{project.projectName}</h1>
          </div>
          <div className="bench-navigation">
            <Link href="/workshop" className="back-to-workshop-link">
              ← Back to Workshop
            </Link>
            <Link href="/" className="new-project-link">
              New Project
            </Link>
          </div>
        </header>

        <section className="project-origin">
            <p className="section-label">Your Original Observation</p>
          <blockquote>{project.originalObservation}</blockquote>
        </section>

        {nextQuestion ? (
          <section className="mission-card">
            <p className="greeting">{greeting}</p>
            <p className="mission-label">{nextMission?.brief}</p>
            <h2>{nextMission?.yourAssignment}</h2>
            <p className="why">{nextMission?.whyItMatters}</p>

            <details className="reasoning-disclosure">
              <summary>REV&apos;s current understanding</summary>
              <div className="ai-reflection-content">
                {nextMission?.aiReflection.split("\n\n").map((section, index) => {
                  const cleaned = stripMarkdownFormatting(section);
                  return <p key={index}>{cleaned}</p>;
                })}
              </div>
            </details>

            <section className="mission-complete-section">
              <p className="mission-label">Your Answer</p>
              <p>{getMissionCompleteMessage()}</p>
            </section>

            <label htmlFor="discovery-answer">Your response</label>
            <textarea
              id="discovery-answer"
              value={answer}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setAnswer(event.target.value);
                if (error) setError("");
              }}
              placeholder="Answer in your own words..."
            />

            {error && <p className="error">{error}</p>}

            <button type="button" onClick={saveAnswer}>
              Save &amp; Continue
            </button>

            <section className="next-mission-section">
              <p className="mission-label">Next Mission</p>
              <p>{getNextMissionMessage(nextMission!)}</p>
            </section>
          </section>
        ) : (
          <section className="mission-card checkpoint-card">
            <p className="greeting">{greeting}</p>
            <p className="mission-label">We Have Enough to Move On</p>
            <h2>You have covered the main Discovery questions.</h2>
            <p className="why">{assessment.summary}</p>

            <details className="reasoning-disclosure">
              <summary>Why REV has stopped asking broad questions</summary>
              <p>
                You have answered each main Discovery area. Any unanswered details
                will stay visible so you can check them with real information later.
              </p>
            </details>

            {!project.validationPlan && (
              <section className="validation-planning">
                <p className="reasoning-label">What to Do Next</p>
                <h3>Make a plan to check the biggest unknowns.</h3>
                <p>
                  REV will turn the things you are unsure about into a short list of
                  checks. The results may support or change what we understand.
                </p>
                {error && <p className="error">{error}</p>}
                <button type="button" onClick={planValidation}>
                  Create Validation Plan
                </button>
              </section>
            )}

            <ProjectReviewView project={project} />

            <Link href="/workshop" className="checkpoint-link secondary-link">
              Return to Project Workshop
            </Link>
          </section>
        )}

        <section className="enter-workshop-card">
          <div>
            <p className="mission-label">Living Workshop</p>
            <h2>Step inside the reAIdea workshop.</h2>
            <p>
              Leave the Discovery bench and enter the full workshop. REV will show you
              which benches have useful work waiting.
            </p>
          </div>
          <Link href="/workshop" className="enter-workshop-link">
            Enter Workshop →
          </Link>
        </section>

        <details className="state-card project-workshop">
          <summary className="project-workshop-summary">
            <span>
              <span className="mission-label workshop-label">Project Workshop</span>
              <strong>Review What We Know</strong>
            </span>
            <span className="workshop-summary-hint">Open</span>
          </summary>

          <div className="project-workshop-body">
            <p className="reflection-intro">
              This summary keeps the project details nearby without getting in the way.
            </p>

            <StateItem
              label="Discovery Assessment"
              value={assessment.summary}
            />
            <StateItem
              label="Current Understanding"
              value={project.engineeringState.currentUnderstanding}
            />
            <ListStateItem
              label="Current Evidence Position"
              values={project.engineeringState.currentEvidence}
              emptyValue={
                assessment.evidenceStatus === "not-addressed"
                  ? "Evidence has not yet been addressed in Discovery."
                  : "No supporting Project evidence is recorded yet."
              }
            />
            <ListStateItem
              label="Potential Assumptions"
              values={project.engineeringState.currentAssumptions}
              emptyValue="No potential assumptions have been flagged from the current Discovery responses."
            />
            <ListStateItem
              label="Constraints"
              values={project.engineeringState.currentConstraints}
              emptyValue="Constraints have not yet been recorded."
            />
            <StateItem
              label="Greatest Remaining Uncertainty"
              value={project.engineeringState.greatestRemainingUncertainty}
            />
            <StateItem
              label="Next Engineering Step"
              value={project.engineeringState.nextEngineeringStep}
            />

            <p className="foundation-note">
              Engineering detail remains available for review and traceability while
              REV keeps the inventor focused on the next responsible task.
            </p>
          </div>
        </details>
      </section>

      <style jsx>{`
        .discovery-page {
          min-height: 100vh;
          background: #080d1a;
          color: #f4f7fb;
          font-family: Arial, sans-serif;
          padding: 42px 20px 64px;
        }

        .discovery-shell {
          width: min(1080px, 100%);
          margin: 0 auto;
        }

        .bench-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 28px;
        }

        .eyebrow,
        .section-label,
        .mission-label,
        .reasoning-label {
          margin: 0 0 8px;
          color: #00d4ff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          font-size: clamp(32px, 5vw, 48px);
          line-height: 1.08;
        }

        .new-project-link {
          color: #91a0b5;
          text-decoration: none;
          border-bottom: 1px solid #45536a;
          padding-bottom: 3px;
          white-space: nowrap;
        }

        .bench-navigation {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px 16px;
        }

        .back-to-workshop-link {
          padding: 9px 13px;
          border: 1px solid #00a9cc;
          border-radius: 8px;
          background: #092532;
          color: #8be8f8;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        .project-origin,
        .mission-card,
        .state-card {
          background: #101827;
          border: 1px solid #243147;
          border-radius: 16px;
        }

        .project-origin {
          padding: 20px 24px;
          margin-bottom: 18px;
        }

        .project-origin blockquote {
          margin: 0;
          color: #d8e0eb;
          line-height: 1.65;
          font-size: 16px;
        }

        .mission-card,
        .state-card {
          padding: clamp(24px, 5vw, 38px);
        }

        .state-card {
          margin-top: 18px;
        }

        .greeting {
          color: #a8b3c7;
          margin-top: 0;
        }

        h2 {
          margin: 6px 0 12px;
          font-size: clamp(26px, 4vw, 34px);
          line-height: 1.2;
        }

        .why,
        .reflection-intro,
        .foundation-note,
        .reasoning-note p {
          color: #a8b3c7;
          line-height: 1.65;
        }

        .reasoning-note {
          margin-top: 20px;
          padding: 16px 18px;
          background: #0b1320;
          border: 1px solid #1d2b3f;
          border-radius: 12px;
        }

        .reasoning-note p {
          margin: 0;
        }

        .reasoning-note .reasoning-label {
          margin-bottom: 6px;
          color: #7f8da2;
        }

        .reasoning-disclosure {
          margin-top: 18px;
          background: #0b1320;
          border: 1px solid #1d2b3f;
          border-radius: 10px;
          overflow: hidden;
        }

        .reasoning-disclosure summary {
          cursor: pointer;
          list-style: none;
          padding: 13px 16px;
          color: #91a0b5;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .reasoning-disclosure summary::-webkit-details-marker {
          display: none;
        }

        .reasoning-disclosure summary::after {
          content: "▸";
          float: right;
          color: #00d4ff;
          transition: transform 140ms ease;
        }

        .reasoning-disclosure[open] summary::after {
          transform: rotate(90deg);
        }

        .reasoning-disclosure p {
          margin: 0;
          padding: 0 16px 16px;
          color: #a8b3c7;
          line-height: 1.6;
        }

        .ai-reflection-content {
          padding: 0 16px 16px;
        }

        .ai-reflection-content p {
          margin: 0 0 12px;
          color: #a8b3c7;
          line-height: 1.6;
          font-size: 14px;
        }

        .ai-reflection-content p:last-child {
          margin-bottom: 0;
        }

        .ai-reflection-content strong {
          color: #dbe3ee;
          font-weight: 700;
        }

        .mission-complete-section,
        .next-mission-section {
          margin-top: 22px;
          padding: 18px 20px;
          background: #0b1320;
          border: 1px solid #27435a;
          border-radius: 12px;
        }

        .mission-complete-section p,
        .next-mission-section p {
          margin: 0;
          color: #a8b3c7;
          line-height: 1.65;
        }

        .mission-complete-section .mission-label,
        .next-mission-section .mission-label {
          margin-bottom: 10px;
        }

        .enter-workshop-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 16px;
          padding: 22px 24px;
          border: 1px solid #33455b;
          border-radius: 14px;
          background: #0d1723;
        }

        .enter-workshop-card h2 {
          margin: 5px 0 7px;
          color: #f4f7fb;
          font-size: 19px;
        }

        .enter-workshop-card p:not(.mission-label) {
          max-width: 620px;
          margin: 0;
          color: #aebac8;
          line-height: 1.55;
        }

        .enter-workshop-link {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 9px;
          background: #16d8ff;
          color: #03111a;
          font-weight: 850;
          text-decoration: none;
        }

        .enter-workshop-link:hover {
          background: #55e4ff;
        }

        .project-workshop {
          padding: 0;
          overflow: hidden;
        }

        .project-workshop-summary {
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 24px;
        }

        .project-workshop-summary::-webkit-details-marker {
          display: none;
        }

        .project-workshop-summary strong {
          display: block;
          color: #e3e9f2;
          font-size: 16px;
        }

        .workshop-label {
          display: block;
          margin-bottom: 5px;
        }

        .workshop-summary-hint {
          color: #00d4ff;
          font-size: 13px;
          font-weight: 800;
        }

        .project-workshop[open] .workshop-summary-hint {
          font-size: 0;
        }

        .project-workshop[open] .workshop-summary-hint::after {
          content: "Close";
          font-size: 13px;
        }

        .project-workshop-body {
          padding: 0 24px 28px;
          border-top: 1px solid #243147;
        }

        .validation-planning {
          margin-top: 22px;
          padding: 20px;
          background: #0b1320;
          border: 1px solid #27435a;
          border-radius: 12px;
        }

        .validation-planning h3 {
          margin: 4px 0 10px;
          font-size: 21px;
        }

        .validation-planning p {
          color: #a8b3c7;
          line-height: 1.65;
        }

        label {
          display: block;
          margin: 28px 0 9px;
          font-weight: 700;
          color: #dbe3ee;
        }

        textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: 190px;
          background: #08101d;
          color: white;
          border: 1px solid #2b3c55;
          border-radius: 12px;
          padding: 18px;
          font: inherit;
          font-size: 17px;
          line-height: 1.55;
          resize: vertical;
          outline: none;
        }

        textarea:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.08);
        }

        button {
          margin-top: 20px;
          border: none;
          border-radius: 10px;
          background: #00d4ff;
          color: #041019;
          padding: 14px 24px;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
        }

        .checkpoint-link {
          display: inline-block;
          margin-top: 22px;
          border-radius: 10px;
          background: #00d4ff;
          color: #041019;
          padding: 14px 24px;
          font-weight: 800;
          text-decoration: none;
        }

        .secondary-link {
          margin-left: 12px;
          background: transparent;
          color: #a8b3c7;
          border: 1px solid #33445d;
        }

        .error {
          color: #ffb4b4;
          margin-bottom: 0;
        }

        .foundation-note {
          margin: 28px 0 0;
          padding-top: 20px;
          border-top: 1px solid #243147;
          font-size: 13px;
          color: #728096;
        }
      `}</style>
    </main>
  );
}

function StateItem({ label, value }: { label: string; value: string }) {
  return (
    <section
      style={{
        marginTop: "16px",
        background: "#0b1320",
        border: "1px solid #1d2b3f",
        borderRadius: "12px",
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          color: "#7e8da4",
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          color: "#e3e9f2",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </p>
    </section>
  );
}

function ListStateItem({
  label,
  values,
  emptyValue,
}: {
  label: string;
  values: string[];
  emptyValue: string;
}) {
  return (
    <section
      style={{
        marginTop: "16px",
        background: "#0b1320",
        border: "1px solid #1d2b3f",
        borderRadius: "12px",
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          color: "#7e8da4",
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      {values.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: "20px",
            color: "#e3e9f2",
            lineHeight: 1.65,
          }}
        >
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            color: "#91a0b5",
            lineHeight: 1.6,
          }}
        >
          {emptyValue}
        </p>
      )}
    </section>
  );
}

function MissingProject() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d1a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "min(560px, 100%)",
          background: "#101827",
          border: "1px solid #243147",
          borderRadius: "16px",
          padding: "34px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#00d4ff", fontWeight: 800 }}>Discovery Bench</p>
        <h1>No active Project is open.</h1>
        <p style={{ color: "#a8b3c7", lineHeight: 1.6 }}>
          Start at the Workshop Door to share your first observation and create a Project.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "12px",
            background: "#00d4ff",
            color: "#061018",
            padding: "13px 22px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Return to Workshop Door
        </Link>
      </section>
    </main>
  );
}
