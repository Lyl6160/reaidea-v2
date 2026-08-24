import type { ConceptCandidate, VisualUnderstandingResult } from "../lib/ai/types";
import type { ProjectOriginIntent } from "../lib/core/project";
import type { InitialCoreCreationUiPhase } from "../lib/workshop/initialCoreCreation";

import styles from "./HomeCreationTheatre.module.css";

type HomeCreationTheatreProps = {
  phase: InitialCoreCreationUiPhase;
  preflightActive: boolean;
  description: string;
  originIntent: ProjectOriginIntent | null;
  imagePreviewUrl?: string;
  imageName?: string;
  interpretation?: VisualUnderstandingResult | null;
  candidate?: ConceptCandidate | null;
};

const STAGES = [
  { id: "boundary", label: "CHECKING THE CREATION BOUNDARY", phase: "preflight" },
  { id: "sketch", label: "READING YOUR SKETCH", phase: "reading", imageOnly: true },
  { id: "project", label: "SECURING YOUR PROJECT", phase: "saving" },
  { id: "concept", label: "CREATING CONCEPT 01", phase: "generating" },
  { id: "geometry", label: "CHECKING CREATION GEOMETRY", phase: "checking-geometry" },
  { id: "creation", label: "SECURING YOUR CREATION", phase: "building" },
  { id: "workshop", label: "OPENING YOUR WORKSHOP", phase: "opening" },
] as const;

const ORIGIN_INTENT_LABELS: Record<ProjectOriginIntent, string> = {
  developing: "DEVELOPING MY IDEA",
  evaluating: "EVALUATING AN IDEA",
  both: "DEVELOPING AND EVALUATING",
};

type CoreCreationEmblemKind = "visual" | "model" | "engineering" | "testing" | "patent" | "manufacturing" | "market" | "reality";

const CORE_CREATION_ITEMS: Array<{ kind: CoreCreationEmblemKind; label: string }> = [
  { kind: "visual", label: "VISUAL CONCEPT" },
  { kind: "model", label: "INTERACTIVE 3D" },
  { kind: "engineering", label: "ENGINEERING DIRECTION" },
  { kind: "testing", label: "TESTING PLAN" },
  { kind: "patent", label: "PATENT / IP FINDINGS" },
  { kind: "manufacturing", label: "MANUFACTURING CONSIDERATIONS" },
  { kind: "market", label: "MARKET INSIGHT" },
  { kind: "reality", label: "REALITY CHECK" },
];

export default function HomeCreationTheatre({
  phase,
  preflightActive,
  description,
  originIntent,
  imagePreviewUrl,
  imageName,
  interpretation,
  candidate,
}: HomeCreationTheatreProps) {
  const activePhase = preflightActive ? "preflight" : phase;
  const stageIndex = STAGES.findIndex((stage) => stage.phase === activePhase);
  const visibleStages = STAGES.filter((stage) => !("imageOnly" in stage) || Boolean(imageName));
  const candidateImage = candidate?.output.type === "image" ? candidate.output.dataUrl ?? candidate.output.url : undefined;
  const geometryState = candidate?.conceptGeometryStatus === "available"
    ? "AVAILABLE"
    : phase === "checking-geometry"
      ? "CHECKING GEOMETRY"
      : "PENDING";
  const visualState = candidate ? "CREATED" : phase === "generating" ? "CREATING" : "PENDING";

  return (
    <section className={styles.theatre} aria-label="REV creation progress">
      <ol className={styles.stages} aria-label="Creation stages">
        {visibleStages.map((stage) => {
          const originalIndex = STAGES.indexOf(stage);
          const current = stage.phase === activePhase;
          const complete = stageIndex > originalIndex;
          const firstTextStage = !imageName && stage.id === "project";
          return (
            <li key={stage.id} className={current ? styles.current : complete ? styles.complete : ""} aria-current={current ? "step" : undefined}>
              <span className={styles.stageMarker} aria-hidden="true" />
              <div>
                <strong>{firstTextStage ? "IDEA CAPTURED" : stage.label}</strong>
                <small>{complete ? "COMPLETE" : current ? "IN PROGRESS" : "WAITING"}</small>
              </div>
            </li>
          );
        })}
      </ol>

      <section className={styles.creationField} aria-label="Creation field">
        {candidateImage ? (
          <figure className={styles.candidatePreview}>
            {/* The generated visual is evidence of a validated candidate, not 3D geometry. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- candidate data remains local browser content. */}
            <img src={candidateImage} alt={candidate?.output.type === "image" ? candidate.output.altText : "Generated Visual Concept"} />
            <figcaption>VISUAL CONCEPT — CREATED</figcaption>
          </figure>
        ) : (
          <div className={styles.scaffold} aria-hidden="true">
            <svg viewBox="0 0 540 320" focusable="false">
              <path className={styles.grid} d="M42 270H498M61 236H479M84 204H456M112 174H428M144 146H396M61 270 144 94M154 270 212 94M248 270V94M342 270 300 94M436 270 368 94" />
              <path className={styles.backPlane} d="m176 204 91-63 123 35-88 69-126-41Zm91-63V95l123 34v47m-123-81 88 48-88-2-91-42 91-6Z" />
              <path className={styles.form} d="m145 224 109-57 132 34-101 68-140-45Zm109-57v-58l132 35v57m-132-92 101 58-101 4-109-51 109-11Z" />
              <path className={styles.component} d="m171 149 43-31 51 14-38 35-56-18Zm133 71 48-32 56 16-40 37-64-21Zm-155 13 45-25 41 13-39 29-47-17Z" />
              <ellipse className={styles.orbit} cx="270" cy="198" rx="177" ry="58" />
              <ellipse className={styles.orbitSecondary} cx="270" cy="198" rx="122" ry="34" />
              <path className={styles.dimension} d="M100 80h340M100 74v13m340-13v13M67 285h406M64 156l56-38m355 36-51-34" />
              <path className={styles.fragment} d="m92 174 52-35m254-44 58 31m-345 114 48 21m199 12 57-34M112 112l42 17m238 129 36-17" />
              <path className={styles.energy} d="M88 250c57-44 64 9 111-38s78-7 112-42 76-16 141-68" />
              <circle className={styles.trace} cx="92" cy="174" r="4" /><circle className={styles.trace} cx="456" cy="126" r="4" />
              <circle className={styles.trace} cx="159" cy="240" r="4" /><circle className={styles.trace} cx="392" cy="258" r="4" />
            </svg>
            <p>REV IS FORMING YOUR FIRST VISUAL CONCEPT</p>
          </div>
        )}
      </section>

      <aside className={styles.captured} aria-label="Captured submission">
        <h2>REV HAS CAPTURED</h2>
        <p>{summarise(description)}</p>
        <dl>
          <div><dt>ORIGIN</dt><dd>{originIntent ? ORIGIN_INTENT_LABELS[originIntent] : "NOT RECORDED"}</dd></div>
          {imageName && <div><dt>SKETCH</dt><dd>{imagePreviewUrl && <>
            {/* eslint-disable-next-line @next/next/no-img-element -- selected source remains a local blob. */}
            <img src={imagePreviewUrl} alt="Selected source reference" />
          </>}<span>{imageName}</span></dd></div>}
          {interpretation && <div><dt>VISUAL REFERENCE</dt><dd><span>{interpretation.factualSummary}</span><em>NON-AUTHORITATIVE</em></dd></div>}
        </dl>
        <div className={styles.outputStatus}>
          <p className={phase === "generating" ? styles.outputActive : ""}><CoreCreationEmblem kind="visual" /><strong>VISUAL CONCEPT</strong><b>{visualState}</b></p>
          <p className={phase === "checking-geometry" ? styles.outputGeometry : ""}><CoreCreationEmblem kind="model" /><strong>INTERACTIVE 3D</strong><b>{geometryState}</b></p>
        </div>
        <small>REV will open the Workshop only after Concept 01 is safely stored.</small>
      </aside>

      <footer className={styles.coreCreation} aria-label="Core Creation status">
        <span>CORE CREATION</span>
        <ul>
          {CORE_CREATION_ITEMS.map((item) => {
            const active = item.kind === "visual" && phase === "generating";
            const geometryChecking = item.kind === "model" && phase === "checking-geometry";
            return <li key={item.kind} className={[styles.coreItem, styles[item.kind], active ? styles.coreActive : "", geometryChecking ? styles.geometryChecking : ""].filter(Boolean).join(" ")}>
              <CoreCreationEmblem kind={item.kind} />
              <span>{item.label}</span>
            </li>;
          })}
        </ul>
      </footer>
    </section>
  );
}

function CoreCreationEmblem({ kind }: { kind: CoreCreationEmblemKind }) {
  if (kind === "visual") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><ellipse className={`${styles.goldAccent} ${styles.base}`} cx="20" cy="32.5" rx="15" ry="3.8" /><path className={styles.depth} d="m9 13.2 11 6.3v13.4l-11-6.2V13.2Z" /><path className={styles.depth} d="m20 19.5 11-6.3v13.5L20 32.9V19.5Z" /><path d="m20 5 11 6.3-11 6.2-11-6.2L20 5Z" /><path d="m9 11.3 11 6.2 11-6.2M20 17.5v15.4M14.2 8.2 25.7 14.8M25.7 8.2 14.2 14.8" /><path className={styles.highlight} d="m11.5 12.7 8.5 4.8 8.5-4.8" /></svg>;
  if (kind === "model") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path className={styles.depth} d="m11 14.2 9 5.3V31l-9-5.3V14.2Z" /><path className={styles.depth} d="m20 19.5 9-5.3v11.5L20 31V19.5Z" /><path d="m20 8 9 5.2-9 5.3-9-5.3L20 8Z" /><path d="m11 13.2 9 5.3 9-5.3M20 18.5V31M15.2 10.8l9.6 5.5M24.8 10.8l-9.6 5.5" /><ellipse className={styles.goldAccent} cx="20" cy="20" rx="17" ry="7.5" transform="rotate(-18 20 20)" /><path className={styles.goldAccent} d="m34.8 12.2 1.2 4-4.1-.3" /></svg>;
  if (kind === "engineering") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><ellipse className={styles.base} cx="20" cy="34.5" rx="12" ry="2.5" /><path className={styles.depth} d="m19 11-7.7 22h3.8l6.3-19.5L19 11ZM22 11l7.7 22h-3.8l-6.3-19.5L22 11Z" /><circle cx="20" cy="8" r="3" /><circle className={styles.highlight} cx="20" cy="8" r="1.1" /><path d="m18.2 11-8 23M21.8 11l8 23M12.5 27h15M9 34h5M26 34h5M14 20l12-5" /></svg>;
  if (kind === "testing") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path className={styles.depth} d="M11 9.5h23v26H11Z" /><rect x="8" y="7" width="24" height="29" rx="2.5" /><path className={styles.highlight} d="M10 9h20" /><path d="M15 7V4h10v3M13 16l2.2 2.2 4-4M22 17h6M13 25l2.2 2.2 4-4M22 26h6" /></svg>;
  if (kind === "patent") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path className={styles.depth} d="m22 5 12 4v10c0 8-4.5 14.2-12 18V5Z" /><path d="M20 4 32 8v10c0 8.2-4.7 14.3-12 18-7.3-3.7-12-9.8-12-18V8l12-4Z" /><path className={styles.highlight} d="m20 6 9.5 3.2" /><circle cx="20" cy="18" r="5" /><circle className={styles.highlight} cx="20" cy="18" r="2" /><path d="M20 13v10M15 18h10M16 28h8" /></svg>;
  if (kind === "manufacturing") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path className={styles.depth} d="M8 35V19l10 6v-7l10 6v-7l10 6v12H8Z" /><path d="M5 35V17l10 6v-7l10 6v-7l10 6v14H5Z" /><path className={styles.highlight} d="M7 33h25M9 19V7h7v12" /><path d="M11 30h4M20 30h4M29 30h3" /><path className={styles.sparks} d="m28 10 2-4M33 13l4-2M25 8l-1-4m9 10 2-5M30 7l4-3" /></svg>;
  if (kind === "market") return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path className={styles.depth} d="M11 34v-8h6v8M21 34V20h6v14M31 34V13h6v21" /><path d="M6 34h29M9 31v-8h6v8M19 31V17h6v14M29 31V10h6v21M9 17l8-7 7 3 10-8" /><path className={styles.highlight} d="M10 23h4M20 17h4M30 10h4" /><path d="m29 5 5 .2-.4 5" /></svg>;
  return <svg className={styles.emblem} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><ellipse className={`${styles.goldAccent} ${styles.base}`} cx="20" cy="33" rx="15" ry="3.5" /><circle className={styles.depth} cx="21.5" cy="21.5" r="15" /><circle cx="20" cy="20" r="15" /><circle className={styles.highlight} cx="20" cy="20" r="11.5" /><path d="m12.5 20.5 5 5 10-11" /></svg>;
}

function summarise(description: string): string {
  const normalised = description.replace(/\s+/g, " ").trim();
  if (normalised.length <= 250) return normalised;
  const sentences = normalised.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) ?? [normalised];
  const first = sentences[0] ?? normalised;
  const last = sentences.at(-1) ?? first;
  const concise = first === last ? first : `${first} ${last}`;
  return concise.length <= 250 ? concise : `${first.slice(0, 247).trimEnd()}…`;
}
