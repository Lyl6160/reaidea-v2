"use client";

import Image from "next/image";
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
    router.push("/workshop");
  }

  return (
    <main className="workshop-door">
      <section className="workshop-scene" aria-labelledby="observation-title">
        <div className="artwork-layer" aria-hidden="true">
          <Image
            src="/images/reaidea-workshop-entrance.png"
            alt=""
            fill
            preload
            sizes="100vw"
            className="workshop-artwork"
          />
          <div className="artwork-scrim" />
        </div>

        <p className="sr-only">
          reAIdea and REV welcome the inventor into the engineering workshop.
        </p>

        <aside className="name-station" aria-labelledby="name-station-title">
          <div className="station-heading">
            <span className="station-line" aria-hidden="true" />
            <div>
              <p>Workshop introduction</p>
              <h2 id="name-station-title">Welcome.</h2>
            </div>
          </div>

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
        </aside>

        <div className="observation-station">
          <header className="observation-heading">
            <p>Original observation</p>
            <h1 id="observation-title">What have you observed?</h1>
            <span>Start with what you saw, heard, measured, or experienced.</span>
          </header>

          <div className="observation-field">
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
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="button" onClick={beginDiscovery}>
            <span>Enter Workshop</span>
            <span className="button-arrow" aria-hidden="true">→</span>
          </button>

          <p className="door-note">
            Your first observation is preserved as the Project&apos;s starting point.
          </p>
        </div>
      </section>

      <style jsx>{`
        .workshop-door {
          --cyan: #55cde8;
          min-height: 100svh;
          overflow: hidden;
          background: #050708;
          color: #f2f5f6;
          font-family: var(--font-geist-sans), Arial, sans-serif;
        }

        .workshop-scene {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          isolation: isolate;
        }

        .artwork-layer {
          position: absolute;
          z-index: -2;
          inset: 0;
          overflow: hidden;
          background: #080b0d;
        }

        .workshop-artwork {
          object-fit: cover;
          object-position: center center;
        }

        .artwork-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(2, 5, 7, 0.28), transparent 23%, transparent 72%, rgba(2, 4, 5, 0.08)),
            radial-gradient(ellipse at 50% 68%, rgba(2, 6, 8, 0.34), transparent 40%),
            linear-gradient(180deg, transparent 0 47%, rgba(2, 5, 7, 0.08) 75%, rgba(2, 4, 5, 0.22));
        }

        .name-station {
          position: absolute;
          z-index: 2;
          top: clamp(74px, 10vh, 112px);
          left: clamp(22px, 2.8vw, 52px);
          width: clamp(235px, 18vw, 286px);
          border-left: 1px solid rgba(83, 189, 211, 0.56);
          background: linear-gradient(90deg, rgba(4, 11, 15, 0.88), rgba(4, 10, 14, 0.64) 80%, transparent);
          padding: 18px 24px 21px 18px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
        }

        .station-heading {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 19px;
        }

        .station-line {
          flex: 0 0 auto;
          width: 2px;
          height: 31px;
          margin-top: 2px;
          background: var(--cyan);
          box-shadow: 0 0 9px rgba(85, 205, 232, 0.45);
        }

        .station-heading p,
        .observation-heading > p {
          margin: 0 0 5px;
          color: #72d2e4;
          font-family: var(--font-geist-mono), monospace;
          font-size: 8px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .station-heading h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 560;
          letter-spacing: -0.035em;
        }

        .field-label {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 7px;
          margin-bottom: 8px;
          color: #e2e8ea;
          font-size: 11px;
          font-weight: 620;
          line-height: 1.4;
        }

        .field-label span {
          color: #72909a;
          font-family: var(--font-geist-mono), monospace;
          font-size: 7px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        input,
        textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid rgba(116, 146, 155, 0.65);
          border-radius: 3px;
          outline: none;
          background: rgba(2, 7, 10, 0.79);
          color: #f3f7f8;
          font: inherit;
          backdrop-filter: blur(7px);
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        input {
          padding: 11px 12px;
          font-size: 13px;
        }

        textarea {
          min-height: 122px;
          padding: 15px 17px;
          font-size: 15px;
          line-height: 1.55;
          resize: vertical;
        }

        input::placeholder,
        textarea::placeholder {
          color: #748188;
        }

        input:focus,
        textarea:focus {
          border-color: #70d3e7;
          background: rgba(2, 9, 13, 0.91);
          box-shadow: 0 0 0 3px rgba(85, 205, 232, 0.09), 0 0 20px rgba(41, 155, 178, 0.1);
        }

        .observation-station {
          position: absolute;
          z-index: 2;
          top: 51%;
          left: 50%;
          width: min(540px, 39vw);
          transform: translateX(-50%);
          text-align: center;
          text-shadow: 0 2px 9px rgba(0, 0, 0, 0.9);
        }

        .observation-heading h1 {
          margin: 0;
          font-size: clamp(27px, 2.45vw, 39px);
          font-weight: 550;
          letter-spacing: -0.045em;
          line-height: 1.08;
        }

        .observation-heading > span {
          display: block;
          margin-top: 9px;
          color: #c0c9cc;
          font-size: 12px;
          line-height: 1.45;
        }

        .observation-field {
          margin-top: 15px;
        }

        .form-error {
          margin: 8px 0 -3px;
          color: #ffc0c0;
          text-align: left;
          font-size: 12px;
          text-shadow: 0 2px 8px #000;
        }

        button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(245px, 100%);
          margin: 14px auto 0;
          border: 1px solid rgba(91, 211, 234, 0.9);
          border-radius: 3px;
          background: rgba(3, 20, 27, 0.82);
          color: #83dfef;
          padding: 12px 16px 12px 19px;
          font-size: 13px;
          font-weight: 720;
          cursor: pointer;
          backdrop-filter: blur(8px);
          box-shadow: 0 0 20px rgba(43, 169, 193, 0.12), inset 0 0 18px rgba(54, 169, 190, 0.05);
          transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
        }

        button:hover {
          color: #e1fbff;
          background: rgba(5, 38, 48, 0.89);
          box-shadow: 0 0 25px rgba(58, 191, 216, 0.22);
          transform: translateY(-1px);
        }

        button:focus-visible {
          outline: 2px solid #d8faff;
          outline-offset: 3px;
        }

        .button-arrow {
          font-size: 17px;
          font-weight: 400;
        }

        .door-note {
          margin: 8px 0 0;
          color: #8b9ba1;
          font-size: 9px;
          line-height: 1.4;
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

        @media (max-width: 1100px) {
          .workshop-door {
            overflow: visible;
          }

          .workshop-scene {
            display: grid;
            grid-template-columns: minmax(220px, 0.62fr) minmax(390px, 1.38fr);
            gap: 22px;
            min-height: 100svh;
            padding: min(64vw, 61svh) 22px 34px;
            background: linear-gradient(180deg, #070a0c, #0a1014 75%, #050708);
          }

          .artwork-layer {
            bottom: auto;
            height: min(64vw, 61svh);
          }

          .workshop-artwork {
            object-position: 56% center;
          }

          .artwork-scrim {
            background: linear-gradient(180deg, transparent 55%, rgba(4, 7, 9, 0.2) 76%, #070a0c 100%);
          }

          .name-station,
          .observation-station {
            position: relative;
            inset: auto;
            width: auto;
            transform: none;
          }

          .name-station {
            align-self: start;
            border-top: 1px solid rgba(83, 189, 211, 0.3);
            border-left-color: rgba(83, 189, 211, 0.3);
            background: linear-gradient(135deg, rgba(12, 23, 29, 0.92), rgba(5, 12, 16, 0.82));
            padding: 19px;
          }

          .observation-station {
            text-align: left;
          }

          .observation-heading h1 {
            font-size: clamp(29px, 4.4vw, 38px);
          }

          button {
            margin-left: 0;
          }

          .door-note {
            max-width: 360px;
          }
        }

        @media (max-width: 680px) {
          .workshop-scene {
            display: flex;
            flex-direction: column;
            gap: 25px;
            padding: min(86vw, 50svh) 16px 36px;
          }

          .artwork-layer {
            height: min(86vw, 50svh);
          }

          .workshop-artwork {
            object-position: 53% center;
          }

          .name-station {
            order: 1;
          }

          .observation-station {
            order: 2;
          }

          .observation-heading h1 {
            font-size: 32px;
          }

          .observation-heading > span {
            font-size: 12px;
          }

          textarea {
            min-height: 155px;
          }

          button {
            width: 100%;
          }
        }

        @media (max-height: 760px) and (min-width: 1101px) {
          .name-station {
            top: 46px;
          }

          .observation-station {
            top: 48%;
          }

          textarea {
            min-height: 100px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          input,
          textarea,
          button {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
