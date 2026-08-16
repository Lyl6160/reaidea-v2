import Image from "next/image";

import type { ConceptCandidate } from "../lib/ai/types";
import type { SharedConceptPreview } from "../lib/workshop/conceptPreview";

type ConceptPreviewProps = {
  preview: SharedConceptPreview;
  candidate?: ConceptCandidate | null;
  candidateStale?: boolean;
  compact?: boolean;
};

const POINTS = [
  [18, 53], [30, 27], [44, 43], [57, 20], [72, 38], [84, 61],
  [67, 72], [48, 79], [28, 69], [39, 57], [60, 53], [76, 23],
] as const;

const CLUSTER_LINES = [[2, 9], [9, 10], [10, 4], [4, 6]] as const;
const OUTLINE_LINES = [[1, 3], [3, 11], [11, 5], [5, 6], [6, 7], [7, 8], [8, 0], [0, 1]] as const;
const STRUCTURE_LINES = [[1, 9], [3, 4], [9, 3], [9, 7], [10, 5], [10, 7], [8, 9], [4, 10]] as const;
const REAR_POINTS = POINTS.map(([x, y]) => [x - 5, y - 7] as const);
const PRELIMINARY_REAR_LINES = OUTLINE_LINES.slice(0, 6);
const DEPTH_NODES = [1, 3, 5, 6, 7, 8] as const;

export default function ConceptPreview({ preview, candidate, candidateStale = false, compact = false }: ConceptPreviewProps) {
  const discoveryStageIndex = ["dormant", "spark", "clustering", "outline", "structure", "wireframe", "early-ready"].indexOf(preview.stage);
  const engineeringLevel = preview.engineeringAnswerCount;
  const stageIndex = engineeringLevel > 0 ? 6 : discoveryStageIndex;
  const showCluster = stageIndex >= 2;
  const showOutline = stageIndex >= 3;
  const showStructure = stageIndex >= 4;
  const showWireframe = stageIndex >= 5;
  const showSettledWireframe = preview.stage === "early-ready" || engineeringLevel > 0;

  return (
    <section
      className={`concept-preview${compact ? " is-compact" : ""} stage-${preview.stage}`}
      aria-label={candidate ? `Concept ${String(candidate.revision).padStart(2, "0")}: ${candidate.title}` : `Idea evolving: ${preview.title}`}
      data-concept-stage={preview.stage}
      data-discovery-input-count={preview.answerCount}
      data-engineering-input-count={preview.engineeringAnswerCount}
      data-visual-journey-stage={preview.visualStage}
    >
      <div className="concept-preview-heading">
        <span>{candidate ? `CONCEPT ${String(candidate.revision).padStart(2, "0")}` : "IDEA EVOLVING"}</span>
        {!compact && <b>{candidate ? "ENGINEERING CONCEPT MODEL" : preview.visualStage.replaceAll("-", " ")}</b>}
      </div>
      {candidate?.output.type === "image" && candidate.output.dataUrl ? (
        <div className="concept-candidate-preview">
          <i className="technical-grid" aria-hidden="true" />
          <Image
            src={candidate.output.dataUrl}
            alt={candidate.output.altText}
            width={1024}
            height={1024}
            unoptimized
          />
          <span className="orientation-cue" aria-hidden="true">Z<br />↑<br />Y · X</span>
        </div>
      ) : <div className="concept-field" aria-hidden="true">
        <svg viewBox="0 0 100 100" role="presentation">
          <defs>
            <radialGradient id={`idea-glow-${compact ? "compact" : "hub"}`}>
              <stop offset="0" stopColor="#dfffff" />
              <stop offset="0.45" stopColor="#69e5ef" />
              <stop offset="1" stopColor="#25849d" />
            </radialGradient>
            <marker id={`flow-arrow-${compact ? "compact" : "hub"}`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M0 0 L6 3 L0 6 Z" fill="#8eeef0" />
            </marker>
          </defs>
          {showOutline && OUTLINE_LINES.map(([from, to]) => (
            <line key={`o-${from}-${to}`} className="outline-line" x1={POINTS[from][0]} y1={POINTS[from][1]} x2={POINTS[to][0]} y2={POINTS[to][1]} />
          ))}
          {showCluster && CLUSTER_LINES.map(([from, to]) => (
            <line key={`c-${from}-${to}`} className="cluster-line" x1={POINTS[from][0]} y1={POINTS[from][1]} x2={POINTS[to][0]} y2={POINTS[to][1]} />
          ))}
          {showStructure && STRUCTURE_LINES.map(([from, to]) => (
            <line key={`s-${from}-${to}`} className="structure-line" x1={POINTS[from][0]} y1={POINTS[from][1]} x2={POINTS[to][0]} y2={POINTS[to][1]} />
          ))}
          {showWireframe && (showSettledWireframe ? OUTLINE_LINES : PRELIMINARY_REAR_LINES).map(([from, to]) => (
            <line key={`r-${from}-${to}`} className="rear-line" x1={REAR_POINTS[from][0]} y1={REAR_POINTS[from][1]} x2={REAR_POINTS[to][0]} y2={REAR_POINTS[to][1]} />
          ))}
          {showWireframe && DEPTH_NODES.map((index) => (
            <line key={`d-${index}`} className="depth-line" x1={POINTS[index][0]} y1={POINTS[index][1]} x2={REAR_POINTS[index][0]} y2={REAR_POINTS[index][1]} />
          ))}
          {showSettledWireframe && STRUCTURE_LINES.map(([from, to]) => (
            <line key={`rs-${from}-${to}`} className="rear-structure-line" x1={REAR_POINTS[from][0]} y1={REAR_POINTS[from][1]} x2={REAR_POINTS[to][0]} y2={REAR_POINTS[to][1]} />
          ))}
          {showWireframe && REAR_POINTS.map(([x, y], index) => (
            <circle key={`rear-${x}-${y}`} className={`rear-point rear-point-${index}`} cx={x} cy={y} r={showSettledWireframe ? 1.45 : 1.05} />
          ))}
          {POINTS.map(([x, y], index) => (
            <circle key={`${x}-${y}`} className={`idea-point point-${index}`} cx={x} cy={y} r={stageIndex === 0 ? 0.65 : showStructure ? 2 : 1.45} />
          ))}
          {engineeringLevel >= 1 && (
            <g className="engineering-signals">
              <line x1="39" y1="57" x2="72" y2="38" />
              <line x1="44" y1="43" x2="67" y2="72" />
              <circle cx="39" cy="57" r="3.4" />
            </g>
          )}
          {engineeringLevel >= 2 && (
            <g className="functional-zones">
              <circle cx="40" cy="51" r="12" />
              <circle cx="67" cy="51" r="13" />
              <line x1="52" y1="51" x2="54" y2="51" />
            </g>
          )}
          {engineeringLevel >= 3 && (
            <g className="functional-elements">
              {[2, 4, 7].map((index) => <circle key={`element-${index}`} cx={POINTS[index][0]} cy={POINTS[index][1]} r="4.3" />)}
            </g>
          )}
          {engineeringLevel >= 4 && (
            <g className="input-output-flow">
              <line x1="5" y1="53" x2="18" y2="53" markerEnd={`url(#flow-arrow-${compact ? "compact" : "hub"})`} />
              <line x1="84" y1="61" x2="96" y2="61" markerEnd={`url(#flow-arrow-${compact ? "compact" : "hub"})`} />
            </g>
          )}
          {engineeringLevel >= 5 && (
            <path className="functional-path" d="M18 53 C30 39, 42 65, 57 45 S74 43, 84 61" markerEnd={`url(#flow-arrow-${compact ? "compact" : "hub"})`} />
          )}
          {engineeringLevel >= 6 && (
            <g className="interaction-node">
              <circle cx="91" cy="20" r="4.5" />
              <line x1="87" y1="22" x2="76" y2="23" markerEnd={`url(#flow-arrow-${compact ? "compact" : "hub"})`} />
            </g>
          )}
          {engineeringLevel >= 7 && (
            <g className="arrangement-frames">
              <path d="M23 23 L55 14 L80 31" />
              <path d="M21 72 L49 86 L77 76" />
            </g>
          )}
          {engineeringLevel >= 8 && <rect className="constraint-boundary" x="8" y="9" width="84" height="79" rx="15" />}
          {engineeringLevel >= 9 && (
            <g className="definition-ready-core">
              <circle cx="54" cy="51" r="7" />
              <line x1="30" y1="27" x2="54" y2="51" />
              <line x1="54" y1="51" x2="84" y2="61" />
              <line x1="54" y1="51" x2="48" y2="79" />
            </g>
          )}
        </svg>
      </div>}
      <div className="concept-preview-copy">
        <strong>{candidate ? `CONCEPT ${String(candidate.revision).padStart(2, "0")}` : preview.title}</strong>
        <span>
          {candidate
            ? candidateStale
              ? "CURRENT MODEL · UPDATE AVAILABLE"
              : `ENGINEERING CONCEPT MODEL · REVISION ${candidate.revision}`
            : preview.engineeringAnswerCount > 0
            ? `${preview.engineeringAnswerCount} ENGINEERING INPUT${preview.engineeringAnswerCount === 1 ? "" : "S"} RECORDED`
            : `${preview.answerCount} DISCOVERY INPUT${preview.answerCount === 1 ? "" : "S"} RECORDED`}
        </span>
        {!compact && <p>{candidate ? (candidateStale ? "New recorded information exists. The current model remains visible until you explicitly update it." : "The same current engineering model follows the idea through the Workshop.") : preview.progressReason}</p>}
        {!compact && !candidate && preview.recognisableGenerationAvailable && <em>MODEL CHECKPOINT AVAILABLE · EXPLICIT GENERATION ONLY</em>}
      </div>
      <small>CONCEPTUAL · UNVALIDATED · NOT PROJECT TRUTH</small>

      <style jsx>{`
        .concept-preview {
          box-sizing: border-box;
          width: min(420px, 100%);
          padding: 15px;
          border: 1px solid rgba(105, 229, 239, 0.42);
          border-radius: 14px;
          background: radial-gradient(circle at 50% 38%, rgba(39, 131, 151, 0.2), transparent 52%), #071014;
          color: #eaffff;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.42), 0 0 26px rgba(64, 206, 224, 0.09) inset;
        }
        .concept-preview-heading { display: flex; justify-content: space-between; gap: 12px; }
        .concept-preview-heading span, .concept-preview-heading b, .concept-preview-copy span, small {
          font-size: 9px; font-weight: 850; letter-spacing: .11em; text-transform: uppercase;
        }
        .concept-preview-heading span { color: #8bf2f4; }
        .concept-preview-heading b { color: #779096; }
        .concept-field { height: 150px; margin: 8px 0; border: 1px solid rgba(102, 210, 224, .16); border-radius: 10px; overflow: hidden; background: radial-gradient(circle, rgba(53, 186, 204, .1), transparent 62%); }
        .concept-candidate-preview { position:relative; height:150px; margin:8px 0; border:1px solid rgba(102,210,224,.28); border-radius:10px; overflow:hidden; background:#0a1216; }
        .concept-candidate-preview img { position:relative; z-index:1; width:100%; height:100%; object-fit:contain; }
        .technical-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(88,180,194,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(88,180,194,.08) 1px,transparent 1px); background-size:16px 16px; }
        .orientation-cue { position:absolute; z-index:2; right:7px; bottom:6px; color:rgba(139,242,244,.72); font:700 7px/1.05 monospace; text-align:center; }
        svg { width: 100%; height: 100%; }
        line { vector-effect: non-scaling-stroke; }
        .cluster-line { stroke: rgba(92, 214, 226, .32); stroke-width: .7; }
        .outline-line { stroke: rgba(120, 235, 239, .58); stroke-width: .9; stroke-dasharray: 2 1.4; }
        .structure-line { stroke: rgba(159, 246, 239, .78); stroke-width: 1.05; }
        .rear-line { stroke: rgba(94, 183, 218, .72); stroke-width: .85; stroke-dasharray: 1.5 1; }
        .depth-line { stroke: rgba(129, 226, 235, .82); stroke-width: .9; }
        .rear-structure-line { stroke: rgba(104, 202, 225, .48); stroke-width: .7; }
        .idea-point { fill: url(#idea-glow-hub); filter: drop-shadow(0 0 2px #66e5ee); opacity: .92; }
        .rear-point { fill: #72cfe0; opacity: .72; filter: drop-shadow(0 0 1.5px #48b7ce); }
        .engineering-signals line { stroke: #c5ffff; stroke-width: 1.35; }
        .engineering-signals circle { fill: rgba(123, 238, 240, .16); stroke: #b9ffff; stroke-width: 1.1; }
        .functional-zones circle { fill: rgba(47, 163, 184, .08); stroke: rgba(104, 226, 232, .58); stroke-width: .8; stroke-dasharray: 2 1.5; }
        .functional-zones line { stroke: rgba(151, 244, 242, .72); stroke-width: 1.1; }
        .functional-elements circle { fill: rgba(8, 20, 24, .68); stroke: #a6f6f3; stroke-width: 1.35; }
        .input-output-flow line, .interaction-node line { stroke: #8eeef0; stroke-width: 1.2; }
        .functional-path { fill: none; stroke: rgba(155, 250, 246, .92); stroke-width: 1.45; stroke-dasharray: 3 1; }
        .interaction-node circle { fill: rgba(65, 181, 199, .18); stroke: #8eeef0; stroke-width: 1.2; }
        .arrangement-frames path { fill: none; stroke: rgba(111, 219, 230, .68); stroke-width: .9; }
        .constraint-boundary { fill: none; stroke: rgba(221, 186, 112, .8); stroke-width: 1; stroke-dasharray: 3 2; }
        .definition-ready-core circle { fill: rgba(176, 255, 248, .2); stroke: #e0fffb; stroke-width: 1.5; filter: drop-shadow(0 0 3px #6ce0e7); }
        .definition-ready-core line { stroke: rgba(207, 255, 250, .9); stroke-width: 1.25; }
        .stage-dormant .idea-point { opacity: .13; filter: none; }
        .stage-spark .idea-point:nth-of-type(3n) { opacity: .38; }
        .stage-early-ready .idea-point { fill: #dfffff; }
        .stage-wireframe .outline-line { stroke-width: 1.2; stroke-dasharray: 2.4 1; }
        .stage-early-ready .outline-line, .stage-early-ready .rear-line { stroke-dasharray: none; stroke-width: 1.25; }
        .stage-early-ready .depth-line { stroke: rgba(172, 248, 243, .95); stroke-width: 1.1; }
        .stage-early-ready .structure-line { stroke-width: 1.2; }
        .stage-early-ready .concept-field { box-shadow: 0 0 32px rgba(76, 224, 226, .2) inset; }
        .concept-preview-copy { display: grid; gap: 4px; }
        .concept-preview-copy strong { font-size: 17px; letter-spacing: .035em; }
        .concept-preview-copy span { color: #8eb3b8; }
        .concept-preview-copy p { margin: 4px 0 0; color: #b9cacc; font-size: 12px; line-height: 1.45; }
        .concept-preview-copy em { color:#d6bb7c; font:800 8px/1.35 Arial,sans-serif; letter-spacing:.09em; font-style:normal; }
        small { display: block; margin-top: 10px; color: #71898d; }
        .is-compact { margin-top: 24px; padding: 11px; border-radius: 10px; }
        .is-compact .concept-field { height: 86px; margin: 7px 0; }
        .is-compact .concept-candidate-preview { height:86px; margin:7px 0; }
        .is-compact .concept-preview-copy strong { font-size: 13px; }
        .is-compact small { font-size: 7px; line-height: 1.4; }
        .is-compact .idea-point { fill: url(#idea-glow-compact); }
        @media (prefers-reduced-motion: no-preference) {
          .stage-spark .idea-point, .stage-clustering .idea-point { animation: idea-pulse 3.6s ease-in-out infinite alternate; }
        }
        @keyframes idea-pulse { from { opacity: .62; } to { opacity: 1; } }
      `}</style>
    </section>
  );
}
