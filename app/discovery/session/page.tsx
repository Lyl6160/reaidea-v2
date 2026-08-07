"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  hasInitialDiscoveryUnderstanding,
  recordDiscoveryUnderstanding,
} from "../../lib/core/project";
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

  const hasClarification = hasInitialDiscoveryUnderstanding(project);
  const greeting = inventor?.preferredName
    ? `Good to have you at the bench, ${inventor.preferredName}.`
    : "Good to have you at the bench.";

  function saveUnderstanding() {
    if (!project) {
      return;
    }

    const cleanedAnswer = answer.trim();

    if (!cleanedAnswer) {
      setError("Add your observation before we update the Project.");
      return;
    }

    const updatedProject = recordDiscoveryUnderstanding(project, cleanedAnswer);
    saveProject(updatedProject);
    setAnswer("");
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
          <Link href="/" className="new-project-link">
            New Project
          </Link>
        </header>

        <section className="project-origin">
          <p className="section-label">Original Observation · Preserved</p>
          <blockquote>{project.originalObservation}</blockquote>
        </section>

        {!hasClarification ? (
          <section className="mission-card">
            <p className="greeting">{greeting}</p>
            <p className="mission-label">Discovery Mission</p>
            <h2>Help me understand what you observed.</h2>
            <p className="why">
              What is happening now, and what made it stand out to you? We are not
              judging the idea or choosing a solution yet. This step is only about
              making the observation clearer.
            </p>

            <label htmlFor="discovery-answer">Your clarification</label>
            <textarea
              id="discovery-answer"
              value={answer}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setAnswer(event.target.value);
                if (error) setError("");
              }}
              placeholder="Describe the situation in your own words..."
            />

            {error && <p className="error">{error}</p>}

            <button type="button" onClick={saveUnderstanding}>
              Update Project
            </button>
          </section>
        ) : (
          <section className="reflection-card">
            <p className="mission-label">Project Updated</p>
            <h2>Discovery has strengthened the Engineering State.</h2>
            <p className="reflection-intro">
              The first clarification is now part of the Project. The original
              observation remains unchanged.
            </p>

            <StateItem
              label="Current Understanding"
              value={project.engineeringState.currentUnderstanding}
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
              Sprint 006 foundation: the next Discovery question will be selected by
              the reasoning layer in the next construction step.
            </p>
          </section>
        )}
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
          width: min(860px, 100%);
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
        .mission-label {
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

        .project-origin,
        .mission-card,
        .reflection-card {
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
        .reflection-card {
          padding: clamp(24px, 5vw, 38px);
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
        .foundation-note {
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
      <p style={{ margin: 0, color: "#e3e9f2", lineHeight: 1.6 }}>{value}</p>
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
          Start at the Workshop Door so the original observation can be preserved and
          the Project can be created correctly.
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
