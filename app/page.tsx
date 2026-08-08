"use client";

import { type ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createProject } from "./lib/core/project";
import { savePreferredName } from "./lib/core/inventorStorage";
import { saveProject } from "./lib/core/storageEngine";

const workshopDisciplines = [
  { name: "Mechanical", mark: "ME" },
  { name: "Electrical", mark: "EL" },
  { name: "Civil", mark: "CI" },
  { name: "Systems", mark: "SY" },
];

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
      <div className="workshop-atmosphere" aria-hidden="true" />

      <section className="workshop-shell" aria-labelledby="workshop-title">
        <header className="workshop-header">
          <div className="workshop-kicker">
            <span className="kicker-line" />
            <p>Engineering workshop · Bay 01</p>
            <span className="kicker-line" />
          </div>
          <h1 id="workshop-title" className="brand">
            re<span>AI</span>dea
          </h1>
          <p className="workshop-intro">
            Bring what you have noticed. We will examine it together and find the next
            responsible engineering step.
          </p>
        </header>

        <div className="workshop-frame">
          <div className="frame-cap" aria-hidden="true">
            <span>WS–001</span>
            <span className="frame-status">Workshop ready</span>
          </div>

          <div className="workshop-scene" aria-label="The reAIdea workshop entrance">
            <div className="ceiling-grid" aria-hidden="true" />
            <div className="doorway doorway-left" aria-hidden="true" />
            <div className="doorway doorway-right" aria-hidden="true" />

            <div className="discipline-wall discipline-wall-left">
              {workshopDisciplines.slice(0, 2).map((discipline) => (
                <div className="discipline" key={discipline.name} title={discipline.name}>
                  <span className="discipline-mark" aria-hidden="true">
                    {discipline.mark}
                  </span>
                  <span>{discipline.name}</span>
                </div>
              ))}
            </div>

            <div className="discipline-wall discipline-wall-right">
              {workshopDisciplines.slice(2).map((discipline) => (
                <div className="discipline" key={discipline.name} title={discipline.name}>
                  <span className="discipline-mark" aria-hidden="true">
                    {discipline.mark}
                  </span>
                  <span>{discipline.name}</span>
                </div>
              ))}
            </div>

            <div className="symbol-presence" aria-label="reAIdea Living Engineering Symbol">
              <div className="symbol-orbit symbol-orbit-outer" aria-hidden="true" />
              <div className="symbol-orbit symbol-orbit-inner" aria-hidden="true" />
              <div className="symbol-axis symbol-axis-horizontal" aria-hidden="true" />
              <div className="symbol-axis symbol-axis-vertical" aria-hidden="true" />
              <span>rA</span>
            </div>

            <div className="bench-light" aria-hidden="true" />
            <div className="inventor-bench" aria-hidden="true">
              <span className="bench-surface" />
              <span className="bench-front">INVENTOR BENCH</span>
              <span className="bench-leg bench-leg-left" />
              <span className="bench-leg bench-leg-right" />
            </div>

            <div className="floor-lines" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="footsteps" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="door-form">
            <div className="form-heading">
              <p className="form-eyebrow">At the inventor bench</p>
              <h2>What have you observed?</h2>
              <p>Start with what you saw, heard, measured, or experienced.</p>
            </div>

            <div className="field-group name-field">
              <label className="field-label" htmlFor="preferred-name">
                What would you like us to call you?
                <span>Optional</span>
              </label>
              <input
                id="preferred-name"
                value={preferredName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setPreferredName(event.target.value)
                }
                placeholder="Preferred name"
                autoComplete="name"
              />
            </div>

            <div className="field-group observation-field">
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
              <span className="field-corner field-corner-left" aria-hidden="true" />
              <span className="field-corner field-corner-right" aria-hidden="true" />
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="form-action">
              <button type="button" onClick={beginDiscovery}>
                <span>Begin Discovery</span>
                <span className="button-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <p className="door-note">
                Your first observation is preserved as the Project&apos;s starting point.
              </p>
            </div>
          </div>
        </div>

        <footer className="workshop-footer">
          <span>Observe</span>
          <i />
          <span>Walk around it</span>
          <i />
          <span>Keep it simple</span>
        </footer>
      </section>

      <style jsx>{`
        .workshop-door {
          --cyan: #62d5e9;
          --cyan-soft: rgba(98, 213, 233, 0.14);
          --steel: #8190a0;
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.014) 1px, transparent 1px),
            radial-gradient(circle at 50% 26%, #162737 0%, #0a111a 37%, #05080d 78%);
          background-size: 72px 72px, 72px 72px, auto;
          color: #eef3f7;
          font-family: var(--font-geist-sans), Arial, sans-serif;
          padding: 42px 20px 34px;
        }

        .workshop-atmosphere {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.72), transparent 18%, transparent 82%, rgba(0, 0, 0, 0.72)),
            radial-gradient(ellipse at 50% 78%, rgba(58, 119, 137, 0.09), transparent 45%);
        }

        .workshop-shell {
          position: relative;
          z-index: 1;
          width: min(1040px, 100%);
          margin: 0 auto;
        }

        .workshop-header {
          max-width: 680px;
          margin: 0 auto 28px;
          text-align: center;
        }

        .workshop-kicker {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: #7f909e;
          font-family: var(--font-geist-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.19em;
          text-transform: uppercase;
        }

        .workshop-kicker p { margin: 0; }
        .kicker-line { width: 42px; height: 1px; background: #344654; }

        .brand {
          margin: 9px 0 0;
          font-size: clamp(46px, 8vw, 74px);
          font-weight: 570;
          letter-spacing: -0.065em;
          line-height: 1;
          text-shadow: 0 10px 38px rgba(0, 0, 0, 0.62);
        }

        .brand span { color: var(--cyan); font-weight: 680; }

        .workshop-intro {
          margin: 16px auto 0;
          max-width: 630px;
          color: #a9b4be;
          font-size: 15px;
          line-height: 1.65;
        }

        .workshop-frame {
          border: 1px solid #31404b;
          border-radius: 5px;
          background: #091019;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.018);
        }

        .frame-cap {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #2a3944;
          background: linear-gradient(180deg, #1a252e, #111a22);
          color: #788995;
          padding: 9px 14px;
          font-family: var(--font-geist-mono), monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .frame-status { color: #86a6ab; }
        .frame-status::before { content: ""; display: inline-block; width: 5px; height: 5px; margin: 0 7px 1px 0; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px rgba(98, 213, 233, 0.7); }

        .workshop-scene {
          position: relative;
          height: 300px;
          overflow: hidden;
          perspective: 650px;
          background:
            linear-gradient(90deg, rgba(6, 10, 15, 0.82), transparent 28%, transparent 72%, rgba(6, 10, 15, 0.82)),
            radial-gradient(ellipse at 50% 35%, rgba(72, 146, 164, 0.15), transparent 28%),
            linear-gradient(180deg, #101a24 0%, #0b131c 58%, #070c12 59%, #0a1017 100%);
          border-bottom: 1px solid #33434e;
        }

        .ceiling-grid {
          position: absolute;
          top: -80px;
          left: 17%;
          width: 66%;
          height: 200px;
          transform: rotateX(66deg);
          background-image: linear-gradient(#2c3c47 1px, transparent 1px), linear-gradient(90deg, #2c3c47 1px, transparent 1px);
          background-size: 44px 34px;
          opacity: 0.35;
          -webkit-mask-image: linear-gradient(to bottom, black, transparent 85%);
          mask-image: linear-gradient(to bottom, black, transparent 85%);
        }

        .doorway { position: absolute; top: 0; bottom: 0; width: 26%; border-color: #283741; opacity: 0.8; }
        .doorway-left { left: 0; border-right: 1px solid; background: linear-gradient(100deg, #070b10 18%, rgba(15, 24, 32, 0.6)); clip-path: polygon(0 0, 100% 16%, 100% 84%, 0 100%); }
        .doorway-right { right: 0; border-left: 1px solid; background: linear-gradient(260deg, #070b10 18%, rgba(15, 24, 32, 0.6)); clip-path: polygon(0 16%, 100% 0, 100% 100%, 0 84%); }

        .discipline-wall { position: absolute; z-index: 2; top: 55px; display: grid; gap: 20px; }
        .discipline-wall-left { left: 4.5%; transform: rotateY(14deg); }
        .discipline-wall-right { right: 4.5%; transform: rotateY(-14deg); }
        .discipline { display: grid; justify-items: center; gap: 5px; color: transparent; font-family: var(--font-geist-mono), monospace; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; transition: color 180ms ease; }
        .discipline:hover, .discipline:focus-within { color: #819aa3; }
        .discipline-mark { display: grid; place-items: center; width: 35px; height: 35px; border: 1px solid #354550; color: #6d7e89; font-size: 9px; letter-spacing: 0.08em; transform: rotate(45deg); transition: border-color 180ms ease, color 180ms ease, box-shadow 180ms ease; }
        .discipline-mark::first-line { transform: rotate(-45deg); }
        .discipline:hover .discipline-mark { border-color: #5597a4; color: #a0d5dd; box-shadow: 0 0 17px rgba(98, 213, 233, 0.12); }

        .symbol-presence { position: absolute; z-index: 3; top: 36px; left: 50%; display: grid; place-items: center; width: 104px; height: 104px; transform: translateX(-50%); color: #a6e4ed; font-size: 20px; font-weight: 650; letter-spacing: -0.08em; filter: drop-shadow(0 0 14px rgba(98, 213, 233, 0.16)); }
        .symbol-orbit { position: absolute; border: 1px solid rgba(113, 188, 201, 0.52); border-radius: 50%; }
        .symbol-orbit-outer { inset: 4px; border-left-color: transparent; border-bottom-color: rgba(113, 188, 201, 0.15); transform: rotate(-24deg); }
        .symbol-orbit-inner { inset: 24px; border-right-color: transparent; transform: rotate(38deg); }
        .symbol-axis { position: absolute; background: rgba(113, 188, 201, 0.28); }
        .symbol-axis-horizontal { width: 75px; height: 1px; }
        .symbol-axis-vertical { width: 1px; height: 75px; }

        .bench-light { position: absolute; z-index: 1; left: 50%; bottom: 22px; width: 360px; height: 135px; transform: translateX(-50%); background: radial-gradient(ellipse, rgba(78, 164, 182, 0.17), transparent 67%); }
        .inventor-bench { position: absolute; z-index: 4; left: 50%; bottom: 57px; width: 250px; height: 54px; transform: translateX(-50%); }
        .bench-surface { display: block; height: 9px; border: 1px solid #63727c; background: linear-gradient(180deg, #3c4a54, #1e2b34); box-shadow: 0 -8px 25px rgba(98, 213, 233, 0.07); }
        .bench-front { display: block; border-top: 1px solid #293842; color: #64757f; padding-top: 7px; text-align: center; font-family: var(--font-geist-mono), monospace; font-size: 8px; letter-spacing: 0.22em; }
        .bench-leg { position: absolute; top: 9px; bottom: 0; width: 7px; background: #27343d; }
        .bench-leg-left { left: 24px; transform: skew(-7deg); }
        .bench-leg-right { right: 24px; transform: skew(7deg); }

        .floor-lines { position: absolute; inset: 58% 0 0; overflow: hidden; opacity: 0.35; }
        .floor-lines i { position: absolute; top: 0; left: 50%; width: 1px; height: 180%; background: linear-gradient(#43505a, transparent); transform-origin: top; }
        .floor-lines i:nth-child(1) { transform: rotate(67deg); }
        .floor-lines i:nth-child(2) { transform: rotate(35deg); }
        .floor-lines i:nth-child(3) { transform: rotate(-35deg); }
        .floor-lines i:nth-child(4) { transform: rotate(-67deg); }

        .footsteps { position: absolute; z-index: 5; left: 50%; bottom: 5px; display: grid; grid-template-columns: repeat(2, 7px); gap: 7px 13px; transform: translateX(-50%) scale(0.72); transform-origin: bottom; }
        .footsteps i { width: 6px; height: 13px; border-radius: 55% 45% 48% 52%; background: rgba(113, 218, 234, 0.58); box-shadow: 0 0 10px rgba(98, 213, 233, 0.33); transform: rotate(16deg); }
        .footsteps i:nth-child(even) { transform: rotate(-16deg) translateY(-8px); }

        .door-form { display: grid; grid-template-columns: minmax(210px, 0.72fr) minmax(330px, 1.28fr); gap: 28px 42px; background: linear-gradient(145deg, #111b24 0%, #0d151d 56%, #0a1118 100%); padding: clamp(28px, 5vw, 50px); }
        .form-heading { align-self: end; grid-column: 1; grid-row: 1 / span 2; border-left: 2px solid #344752; padding-left: 20px; }
        .form-eyebrow { margin: 0 0 11px; color: var(--cyan); font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; }
        .form-heading h2 { margin: 0; max-width: 280px; font-size: clamp(28px, 4vw, 40px); font-weight: 540; letter-spacing: -0.035em; line-height: 1.12; }
        .form-heading > p:last-child { margin: 16px 0 0; max-width: 270px; color: #8d9aa5; font-size: 13px; line-height: 1.55; }

        .field-group { min-width: 0; }
        .name-field { grid-column: 2; }
        .observation-field { position: relative; grid-column: 2; }
        .field-label { display: flex; gap: 10px; align-items: baseline; margin-bottom: 9px; color: #c9d2d9; font-size: 13px; font-weight: 600; }
        .field-label span { color: #667784; font-family: var(--font-geist-mono), monospace; font-size: 8px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }

        input, textarea { box-sizing: border-box; width: 100%; border: 1px solid #344550; border-radius: 2px; outline: none; background: rgba(4, 9, 14, 0.74); color: #edf2f5; font: inherit; transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease; }
        input { max-width: 360px; padding: 12px 14px; font-size: 14px; }
        textarea { min-height: 155px; padding: 17px 18px; font-size: 16px; line-height: 1.6; resize: vertical; }
        input::placeholder, textarea::placeholder { color: #64727d; }
        input:focus, textarea:focus { border-color: #5ca9b7; background: rgba(7, 14, 20, 0.92); box-shadow: 0 0 0 3px rgba(98, 213, 233, 0.07), inset 0 0 25px rgba(98, 213, 233, 0.025); }
        .field-corner { position: absolute; bottom: 7px; width: 15px; height: 1px; background: #3c5360; }
        .field-corner-left { left: 7px; }
        .field-corner-right { right: 7px; }

        .form-error { grid-column: 2; margin: -16px 0 0; color: #ffb7b7; font-size: 13px; }
        .form-action { grid-column: 2; }
        button { display: flex; align-items: center; justify-content: space-between; width: min(100%, 280px); border: 1px solid #6cb8c5; border-radius: 2px; background: linear-gradient(135deg, #70d5e5, #4eb4c6); color: #071116; padding: 14px 17px 14px 20px; font-size: 14px; font-weight: 750; letter-spacing: 0.015em; cursor: pointer; box-shadow: 0 8px 28px rgba(30, 131, 150, 0.13); transition: transform 160ms ease, filter 160ms ease, box-shadow 160ms ease; }
        button:hover { filter: brightness(1.07); box-shadow: 0 10px 32px rgba(48, 168, 188, 0.2); transform: translateY(-1px); }
        button:focus-visible { outline: 2px solid #d4f8ff; outline-offset: 3px; }
        .button-arrow { font-size: 19px; font-weight: 400; }
        .door-note { margin: 11px 0 0; max-width: 380px; color: #697985; font-size: 11px; line-height: 1.45; }

        .workshop-footer { display: flex; justify-content: center; align-items: center; gap: 13px; color: #586975; padding: 17px 8px 0; font-family: var(--font-geist-mono), monospace; font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; }
        .workshop-footer i { width: 3px; height: 3px; border-radius: 50%; background: #547783; }

        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

        @media (max-width: 760px) {
          .workshop-door { padding: 28px 14px 25px; }
          .workshop-scene { height: 260px; }
          .discipline-wall { top: 52px; }
          .discipline-wall-left { left: 6%; }
          .discipline-wall-right { right: 6%; }
          .door-form { grid-template-columns: 1fr; gap: 24px; }
          .form-heading, .name-field, .observation-field, .form-error, .form-action { grid-column: 1; grid-row: auto; }
          .form-heading { margin-bottom: 3px; }
          .form-heading h2, .form-heading > p:last-child { max-width: 100%; }
          input { max-width: none; }
        }

        @media (max-width: 500px) {
          .workshop-door { padding-inline: 10px; }
          .workshop-kicker { gap: 9px; }
          .kicker-line { width: 20px; }
          .workshop-intro { font-size: 14px; }
          .frame-cap { padding-inline: 10px; }
          .workshop-scene { height: 225px; }
          .discipline-wall { display: none; }
          .symbol-presence { top: 26px; transform: translateX(-50%) scale(0.86); }
          .inventor-bench { bottom: 44px; width: 210px; }
          .footsteps { bottom: 0; }
          .door-form { padding: 27px 20px 31px; }
          textarea { min-height: 145px; font-size: 15px; }
          button { width: 100%; }
          .workshop-footer { gap: 8px; letter-spacing: 0.08em; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </main>
  );
}
