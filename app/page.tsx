"use client";

import { type ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createProject } from "./lib/core/project";
import { savePreferredName } from "./lib/core/inventorStorage";
import { saveProject } from "./lib/core/storageEngine";

export default function Home() {
  const [preferredName, setPreferredName] = useState("");
  const [observation, setObservation] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function beginDiscovery() {
    const cleanedObservation = observation.trim();

    if (!cleanedObservation) {
      setError("Please share the observation that brought you into the workshop.");
      return;
    }

    const inventor = savePreferredName(preferredName);
    const project = createProject({
      ownerId: inventor.id,
      originalObservation: cleanedObservation,
    });

    saveProject(project);
    setError("");
    router.push("/discovery/session");
  }

  return (
    <main className="workshop-door">
      <section className="workshop-shell" aria-labelledby="workshop-title">
        <header className="workshop-header">
          <p className="eyebrow">Engineering Workshop</p>
          <h1 id="workshop-title" className="brand">
            re<span>AI</span>dea
          </h1>
          <p className="workshop-intro">
            Welcome. Bring the observation. We will work out what it means together.
          </p>
        </header>

        <div className="workshop-scene" aria-label="Workshop entrance">
          <div className="wall-tool wall-tool-left" title="Measure before deciding">
            MEASURE
          </div>
          <div className="wall-tool wall-tool-right" title="Test what matters">
            TEST
          </div>
          <div className="bench-glow" aria-hidden="true" />
          <div className="inventor-bench">INVENTOR BENCH</div>
          <div className="footsteps" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="door-form">
          <label className="field-label" htmlFor="preferred-name">
            What would you like us to call you?
            <span> Optional</span>
          </label>
          <input
            id="preferred-name"
            value={preferredName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPreferredName(event.target.value)}
            placeholder="Preferred name"
            autoComplete="name"
          />

          <div className="observation-heading">
            <p>Welcome.</p>
            <h2>What have you observed?</h2>
          </div>

          <label className="sr-only" htmlFor="observation">
            Your observation
          </label>
          <textarea
            id="observation"
            value={observation}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              setObservation(event.target.value);
              if (error) setError("");
            }}
            placeholder="Describe what you have noticed in your own words..."
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="button" onClick={beginDiscovery}>
            Begin Discovery
          </button>

          <p className="door-note">
            Your first observation is preserved as the starting point of the Project.
          </p>
        </div>
      </section>

      <style jsx>{`
        .workshop-door {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 35%, rgba(0, 212, 255, 0.08), transparent 32%),
            linear-gradient(180deg, #0a101b 0%, #070b12 100%);
          color: #f4f7fb;
          font-family: Arial, sans-serif;
          padding: 38px 20px 56px;
        }

        .workshop-shell {
          width: min(920px, 100%);
          margin: 0 auto;
        }

        .workshop-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #8090a6;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .brand {
          margin: 0;
          font-size: clamp(44px, 8vw, 68px);
          letter-spacing: -0.04em;
        }

        .brand span {
          color: #00d4ff;
        }

        .workshop-intro {
          margin: 12px auto 0;
          max-width: 620px;
          color: #a6b2c3;
          line-height: 1.6;
        }

        .workshop-scene {
          position: relative;
          height: 190px;
          overflow: hidden;
          border: 1px solid #1f2b3b;
          border-radius: 20px 20px 8px 8px;
          background:
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            #0c131f;
          background-size: 56px 56px;
          box-shadow: inset 0 -40px 70px rgba(0, 0, 0, 0.42);
        }

        .wall-tool {
          position: absolute;
          top: 34px;
          color: #637087;
          border: 1px solid #26364b;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          letter-spacing: 0.14em;
          transition: color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .wall-tool:hover {
          color: #aeefff;
          border-color: #00d4ff;
          box-shadow: 0 0 16px rgba(0, 212, 255, 0.18);
        }

        .wall-tool-left { left: 32px; }
        .wall-tool-right { right: 32px; }

        .bench-glow {
          position: absolute;
          left: 50%;
          bottom: 30px;
          width: 210px;
          height: 80px;
          transform: translateX(-50%);
          background: radial-gradient(ellipse, rgba(0, 212, 255, 0.18), transparent 68%);
        }

        .inventor-bench {
          position: absolute;
          left: 50%;
          bottom: 31px;
          transform: translateX(-50%);
          width: 180px;
          border-top: 3px solid #44536a;
          padding-top: 10px;
          text-align: center;
          color: #75849a;
          font-size: 10px;
          letter-spacing: 0.18em;
        }

        .footsteps {
          position: absolute;
          left: 50%;
          bottom: 5px;
          display: flex;
          gap: 17px;
          transform: translateX(-50%);
        }

        .footsteps i {
          display: block;
          width: 7px;
          height: 15px;
          border-radius: 55% 45% 48% 52%;
          background: rgba(0, 212, 255, 0.55);
          box-shadow: 0 0 9px rgba(0, 212, 255, 0.28);
          transform: rotate(18deg);
        }

        .footsteps i:nth-child(even) { transform: rotate(-18deg); }

        .door-form {
          background: #101827;
          border: 1px solid #243147;
          border-top: none;
          border-radius: 8px 8px 20px 20px;
          padding: clamp(24px, 5vw, 42px);
        }

        .field-label {
          display: block;
          margin-bottom: 9px;
          color: #d7deea;
          font-size: 14px;
          font-weight: 700;
        }

        .field-label span {
          color: #718096;
          font-weight: 400;
        }

        input,
        textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #2b3a51;
          border-radius: 12px;
          outline: none;
          background: #0a111d;
          color: white;
          font: inherit;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        input {
          max-width: 360px;
          padding: 13px 15px;
        }

        textarea {
          min-height: 180px;
          padding: 18px;
          font-size: 17px;
          line-height: 1.55;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.09);
        }

        .observation-heading {
          margin: 34px 0 14px;
        }

        .observation-heading p {
          margin: 0 0 5px;
          color: #8b99ad;
        }

        .observation-heading h2 {
          margin: 0;
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 600;
        }

        button {
          display: block;
          margin: 22px auto 0;
          min-width: 210px;
          border: none;
          border-radius: 11px;
          background: #00d4ff;
          color: #041019;
          padding: 15px 28px;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
        }

        button:hover { filter: brightness(1.06); }

        .form-error {
          margin: 12px 0 0;
          color: #ffb4b4;
          font-size: 14px;
        }

        .door-note {
          margin: 14px 0 0;
          color: #738197;
          text-align: center;
          font-size: 12px;
          line-height: 1.5;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </main>
  );
}
