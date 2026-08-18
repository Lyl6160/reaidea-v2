"use client";

import { useEffect, useState } from "react";

const STAGES = ["Reading your idea", "Understanding the design", "Building the concept", "Finishing the image", "Ready"] as const;

type GenerationProgressProps = {
  kind: "generation" | "first-generation" | "refinement" | "view";
  status: "working" | "ready" | "failed";
  onRetry?: () => void;
  failureMessage?: string;
};

export default function GenerationProgress({ kind, status, onRetry, failureMessage }: GenerationProgressProps) {
  const [timedStage, setTimedStage] = useState(-1);

  useEffect(() => {
    if (status !== "working") return;
    const timers = [
      window.setTimeout(() => setTimedStage(-1), 0),
      ...[300, 3800, 7600, 12000, 17000].map((delay, index) =>
        window.setTimeout(() => setTimedStage(index), delay)
      ),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [status]);

  const reachedStage = status === "ready" ? 4 : status === "working" ? Math.min(timedStage, 3) : -1;
  const holding = status === "working" && timedStage >= 4;
  const currentText = status === "ready" ? kind === "view" ? "Your new view is ready." : "Your idea is ready." : status === "failed" ? failureMessage ?? "REV couldn't finish the design this time." : holding ? "Almost there..." : `${STAGES[Math.max(timedStage, 0)]}...`;

  return (
    <section className={`generation-progress is-${status}`} aria-label={status === "working" ? "Design generation progress" : undefined}>
      <div className="generation-progress-copy">
        <span>REV · WORKSHOP PROGRESS</span>
        <strong>{status === "failed" ? "LET'S TRY THAT AGAIN" : status === "ready" ? kind === "view" ? "YOUR NEW VIEW IS READY" : "YOUR IDEA IS READY" : kind === "view" ? "REV IS CREATING ANOTHER VIEW" : kind === "refinement" ? "REV IS UPDATING YOUR DESIGN" : "YOUR IDEA IS COMING TO LIFE"}</strong>
        {status === "working" && <small>{kind === "view" ? "REV is creating another view of your design." : kind === "refinement" ? "REV is updating your design." : kind === "first-generation" ? "REV is building your first concept." : "REV is building your concept."} This usually takes about 15–20 seconds.</small>}
      </div>
      {status !== "failed" && (
        <ol className="footstep-trail" aria-label="Generation stages">
          {STAGES.map((stage, index) => {
            const complete = index < reachedStage || status === "ready";
            const active = index === reachedStage && status === "working";
            return (
              <li key={stage} className={`${complete ? "is-complete" : ""} ${active ? "is-active" : ""}`} aria-current={active ? "step" : undefined}>
                <span className="footprint" aria-hidden="true"><i className="sole" /><i className="toe toe-one" /><i className="toe toe-two" /><i className="toe toe-three" /></span>
                <span className="stage-label">{stage}</span>
              </li>
            );
          })}
        </ol>
      )}
      <p className="generation-current-status" role={status === "failed" ? "alert" : "status"} aria-live="polite">{currentText}</p>
      {status === "failed" && onRetry && <button type="button" onClick={onRetry}>TRY AGAIN</button>}
      <style jsx>{`
        .generation-progress{margin:14px 0;padding:16px;overflow:hidden;border:1px solid rgba(105,217,233,.34);border-radius:10px;background:linear-gradient(145deg,rgba(8,25,30,.97),rgba(5,13,16,.98));box-shadow:0 12px 28px rgba(0,0,0,.25),0 0 24px rgba(72,190,207,.07) inset}.generation-progress-copy span{display:block;color:#78d9e6;font:850 9px/1.2 Arial,sans-serif;letter-spacing:.15em}.generation-progress-copy strong{display:block;margin-top:5px;color:#f4f5ef;font:900 15px/1.25 Arial,sans-serif;letter-spacing:.07em}.generation-progress-copy small{display:block;margin-top:5px;color:#b8c9cc;font:600 11px/1.45 Arial,sans-serif}.footstep-trail{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:18px 0 12px;padding:0;list-style:none}.footstep-trail:before{content:"";position:absolute;top:17px;left:9%;right:9%;height:1px;background:linear-gradient(90deg,rgba(96,151,160,.12),rgba(116,203,214,.25),rgba(96,151,160,.12))}.footstep-trail li{position:relative;z-index:1;display:grid;justify-items:center;gap:7px;min-width:0;color:#65767a;text-align:center}.footprint{position:relative;display:block;width:24px;height:34px;transform:rotate(-18deg);opacity:.34;filter:saturate(.6)}.footstep-trail li:nth-child(even) .footprint{transform:rotate(18deg) translateY(-2px)}.sole{position:absolute;left:7px;top:11px;width:11px;height:20px;border-radius:58% 48% 55% 48%;background:#73939a}.toe{position:absolute;border-radius:50%;background:#73939a}.toe-one{left:5px;top:3px;width:7px;height:7px}.toe-two{left:12px;top:1px;width:6px;height:6px}.toe-three{left:18px;top:4px;width:5px;height:5px}.stage-label{max-width:105px;font:750 9px/1.25 Arial,sans-serif;letter-spacing:.02em}.footstep-trail li.is-complete,.footstep-trail li.is-active{color:#c9f5f7}.footstep-trail li.is-complete .footprint,.footstep-trail li.is-active .footprint{opacity:1;filter:drop-shadow(0 0 5px rgba(104,226,237,.72))}.footstep-trail li.is-complete .footprint i,.footstep-trail li.is-active .footprint i{background:#8ae7ec}.footstep-trail li.is-active .footprint{animation:footstep-glow 1.3s ease-in-out infinite alternate}.is-ready .footstep-trail li:last-child .footprint{filter:drop-shadow(0 0 8px rgba(238,204,113,.9))}.is-ready .footstep-trail li:last-child .footprint i{background:#f0d078}.generation-current-status{margin:0;color:#e5f6f5;font:850 11px/1.35 Arial,sans-serif;letter-spacing:.04em}.is-failed{border-color:rgba(218,102,102,.48)}.is-failed .generation-current-status{color:#f1b2b2}button{margin-top:11px;padding:9px 14px;border:1px solid rgba(105,217,233,.58);border-radius:6px;background:rgba(15,57,66,.9);color:#e4fbfc;font:850 10px/1 Arial,sans-serif;letter-spacing:.1em;cursor:pointer}@keyframes footstep-glow{from{filter:drop-shadow(0 0 3px rgba(104,226,237,.45));opacity:.9}to{filter:drop-shadow(0 0 10px rgba(104,226,237,.95));opacity:1}}@media(prefers-reduced-motion:reduce){.footstep-trail li.is-active .footprint{animation:none}}@media(max-width:700px){.stage-label{font-size:8px}.generation-progress{padding:14px 10px}}
      `}</style>
    </section>
  );
}
