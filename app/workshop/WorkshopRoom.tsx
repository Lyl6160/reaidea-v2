import type { ReactNode } from "react";

import type { WorkshopBenchId, WorkshopBenchState } from "../lib/workshop/workshopBrain";

export type WorkshopRoomBench = {
  id: WorkshopBenchId;
  shortLabel: string;
  positionClass: string;
  state: WorkshopBenchState;
  progress: "red" | "yellow" | "green";
  selected: boolean;
  recommended: boolean;
};

type WorkshopRoomProps = {
  benches: WorkshopRoomBench[];
  revMessage: string;
  conceptPreview: ReactNode;
  hasCurrentDesign?: boolean;
  stopGoDesign?: boolean;
  onSelectBench: (id: WorkshopBenchId) => void;
  caption: string;
};

export default function WorkshopRoom({ benches, revMessage, conceptPreview, hasCurrentDesign = false, stopGoDesign = false, onSelectBench, caption }: WorkshopRoomProps) {
  return (
    <div className="room" role="group" aria-label="Workshop benches">
      <div className="ceiling ceiling-left" aria-hidden="true" /><div className="ceiling ceiling-right" aria-hidden="true" />
      <div className="beam beam-one" aria-hidden="true" /><div className="beam beam-two" aria-hidden="true" />
      <div className="back-wall" aria-hidden="true" /><div className="side-wall side-left" aria-hidden="true" /><div className="side-wall side-right" aria-hidden="true" />
      <div className="floor" aria-hidden="true" /><div className="floor-line floor-line-one" aria-hidden="true" /><div className="floor-line floor-line-two" aria-hidden="true" />
      <div className="conduit conduit-main" aria-hidden="true" /><div className="conduit conduit-left" aria-hidden="true" /><div className="conduit conduit-right" aria-hidden="true" />
      <div className="junction junction-one" aria-hidden="true" /><div className="junction junction-two" aria-hidden="true" /><div className="junction junction-three" aria-hidden="true" />
      <div className="workshop-plaque" aria-hidden="true"><span>reAIdea</span><small>WHERE IDEAS BECOME REAL</small></div>
      <div className="wall-life" aria-hidden="true"><span className="shelf shelf-left"><i /><i /><i /></span><span className="shelf shelf-right"><i /><i /></span><span className="tall-cabinet cabinet-left"><i /><i /><i /></span><span className="tall-cabinet cabinet-right"><i /><i /></span><span className="wall-sheet sheet-left"><i /><i /></span><span className="wall-sheet sheet-right"><i /><i /><i /></span></div>
      <div className="rev-station" aria-label="REV, your AI design engineer"><div className="rev-bubble"><strong>REV</strong><span>{revMessage}</span></div><div className="rev-figure" aria-hidden="true"><div className="rev-hair" /><div className="rev-head"><i className="rev-eye rev-eye-left" /><i className="rev-eye rev-eye-right" /><i className="rev-smile" /></div><div className="rev-neck" /><div className="rev-body"><span>REV</span><i className="rev-pocket" /></div><div className="rev-arm rev-arm-left" /><div className="rev-arm rev-arm-right" /><div className="rev-leg rev-leg-left" /><div className="rev-leg rev-leg-right" /></div></div>
      <div className="hub-concept-preview">{conceptPreview}<span className="hub-concept-pointer" aria-hidden="true">↓</span></div>
      {benches.map((bench) => (
        <button key={bench.id} type="button" className={`room-bench ${bench.positionClass} state-${bench.state} ${bench.selected ? "is-selected" : ""} ${bench.recommended ? "is-recommended" : ""}`} onClick={() => onSelectBench(bench.id)} aria-pressed={bench.selected} aria-label={`${bench.shortLabel}: ${bench.progress}`}>
          <span className="lamp-rig" aria-hidden="true"><span className="lamp-cord" /><span className="lamp-cap" /><span className="lamp-shade" /><span className="room-light" /><span className="light-pool" /></span>
          <span className="bench-sign">{bench.shortLabel}</span><span className="bench-backsplash" aria-hidden="true"><span className="pinboard-line" /><span className="pinboard-note note-a" /><span className="pinboard-note note-b" /></span>
          <span className="bench-top" aria-hidden="true"><span className={`bench-screen shared-design-screen ${hasCurrentDesign ? "has-current-design" : ""}`}>{hasCurrentDesign && <i className={stopGoDesign ? "mini-stop-go-design" : "mini-current-design"} />}</span>{bench.id !== "prototype" && <span className="bench-tools"><i className="tool-a" /><i className="tool-b" /><i className="tool-c" /></span>}</span>
          <span className="bench-cabinet" aria-hidden="true"><i /><i /></span><span className="bench-stool" aria-hidden="true"><i /><b /></span><span className="bench-shadow" aria-hidden="true" />
          <span className="bench-status">{bench.progress.toUpperCase()}</span>{bench.recommended && <span className="bench-recommendation">REV RECOMMENDS</span>}
        </button>
      ))}
      <p className="room-caption">{caption}</p>
      <style jsx global>{`
        .room .concept-preview .concept-candidate-preview { height: 220px; }
        .room .concept-preview .concept-candidate-preview img { max-height: none; }
        .room{position:relative;min-height:690px;overflow:hidden;border:1px solid #55514a;border-radius:16px;background:linear-gradient(180deg,#263139 0 42%,#172025 42% 64%,#292723 64%);box-shadow:0 28px 70px rgba(0,0,0,.45)}.back-wall{position:absolute;inset:0 0 36%;background:linear-gradient(90deg,rgba(0,0,0,.24),transparent 18% 82%,rgba(0,0,0,.24)),repeating-linear-gradient(0deg,transparent 0 34px,rgba(255,255,255,.025) 35px)}.ceiling{position:absolute;top:-80px;width:58%;height:150px;background:#11181c;border-bottom:8px solid #455158}.beam{position:absolute;top:76px;width:46%;height:13px;background:#111719}.ceiling-left,.beam-one{left:-5%;transform:rotate(7deg)}.ceiling-right,.beam-two{right:-5%;transform:rotate(-7deg)}.floor{position:absolute;inset:64% 0 0;background:linear-gradient(165deg,#34302a,#171818)}.floor-line{position:absolute;bottom:92px;height:1px;background:rgba(210,193,159,.16)}.floor-line-one{left:7%;right:7%;transform:rotate(-2deg)}.floor-line-two{left:18%;right:18%;bottom:126px}.side-wall{position:absolute;top:0;bottom:36%;width:9%;background:rgba(7,12,15,.42)}.side-left{left:0}.side-right{right:0}.conduit{position:absolute;top:138px;height:4px;background:#12191c}.conduit-main{left:20%;right:20%}.conduit-left{left:0;width:23%}.conduit-right{right:0;width:23%}.junction{position:absolute;top:130px;width:18px;height:18px;border:2px solid #171d20;background:#39444a}.junction-one{left:27%}.junction-two{left:calc(50% - 9px)}.junction-three{right:27%}.workshop-plaque{position:absolute;top:76px;left:50%;transform:translateX(-50%);display:grid;text-align:center;color:#61dff0}.workshop-plaque span{font-size:30px;font-weight:950}.workshop-plaque small{color:#c6d0ce;font-size:8px;letter-spacing:.18em}.wall-life{position:absolute;inset:0;pointer-events:none}.room-bench{position:absolute;z-index:5;width:13%;height:188px;padding:0;border:0;background:transparent;color:#eaf3f1;cursor:pointer}.slot-discovery{left:3.2%;top:257px}.slot-engineering{left:17.8%;top:228px}.slot-validation{left:32.4%;top:212px}.slot-patent{right:32.4%;top:212px}.slot-marketing{right:17.8%;top:228px}.slot-manufacturing{right:3.2%;top:257px}.slot-reality{right:2.2%;top:455px;width:12.5%}.slot-prototype{left:42%;top:410px;width:16%}.bench-sign{position:absolute;left:4%;right:4%;top:18px;padding:7px 3px;border:1px solid #69757a;background:#253137;font-size:10px;font-weight:900;text-align:center}.lamp-rig{position:absolute;left:50%;top:-12px}.lamp-cord{position:absolute;width:2px;height:28px;background:#171b1d}.lamp-shade{position:absolute;top:24px;left:-14px;width:30px;height:12px;border-radius:50% 50% 20% 20%;background:#3f494c}.room-light,.light-pool{position:absolute;top:30px;left:-35px;width:72px;height:85px;border-radius:50%;background:radial-gradient(circle,rgba(104,217,233,.2),transparent 68%)}.bench-backsplash{position:absolute;left:4%;right:4%;top:56px;height:48px;border:1px solid #505b5e;background:#30383a}.bench-top{position:absolute;left:0;right:0;top:104px;height:16px;background:#8b7960}.bench-screen{position:absolute;left:34%;bottom:12px;width:32%;height:28px;border:2px solid #536167;background:#0a1114}.bench-cabinet{position:absolute;left:7%;right:7%;top:120px;height:55px;background:#404749;border:1px solid #202628}.bench-status{position:absolute;top:180px;left:0;right:0;color:#9ba8a8;font-size:8px;font-weight:900}.bench-recommendation{position:absolute;top:200px;left:0;right:0;color:#8feaf2;font-size:8px;font-weight:900}.room-bench.is-recommended .bench-sign{border-color:#69d9e9;box-shadow:0 0 20px rgba(105,217,233,.45);animation:shared-room-pulse 1.5s ease-in-out infinite alternate}.rev-station{position:absolute;z-index:4;left:47%;top:175px}.rev-figure{position:relative;width:70px;height:126px}.rev-head{position:absolute;top:12px;left:18px;width:38px;height:42px;border-radius:48%;background:#d4aa82}.rev-hair{position:absolute;z-index:2;top:7px;left:16px;width:42px;height:18px;border-radius:50% 50% 20% 20%;background:#302923}.rev-body{position:absolute;top:54px;left:9px;width:56px;height:58px;border-radius:13px 13px 5px 5px;background:#174a55}.rev-body span{position:absolute;top:20px;left:15px;color:#8ee7ef;font-size:10px;font-weight:900}.rev-bubble{position:absolute;right:58px;top:-10px;width:210px;padding:10px;border:1px solid #59686c;border-radius:9px;background:rgba(9,18,21,.94);color:#cbd6d5;font-size:10px}.rev-bubble strong{display:block;color:#73dfeb}.hub-concept-preview{position:absolute;z-index:3;left:40%;top:304px;width:20%;min-height:82px}.hub-concept-pointer{display:block;color:#72dce8;text-align:center}.room-caption{position:absolute;bottom:15px;left:0;right:0;color:#8f9c9c;font-size:9px;text-align:center}.room .concept-preview{min-height:68px}.room .concept-preview img{max-height:80px}@keyframes shared-room-pulse{from{box-shadow:0 0 8px rgba(105,217,233,.22)}to{box-shadow:0 0 28px rgba(105,217,233,.62)}}@media(prefers-reduced-motion:reduce){.room-bench.is-recommended .bench-sign{animation:none}}@media(max-width:900px){.room{min-height:760px}.room-bench{width:26%}.slot-discovery{left:3%;top:240px}.slot-engineering{left:37%;top:240px}.slot-validation{left:71%;top:240px}.slot-patent{left:3%;right:auto;top:445px}.slot-manufacturing{left:37%;right:auto;top:445px}.slot-marketing{left:71%;right:auto;top:445px}.slot-prototype{left:37%;top:620px}.slot-reality{display:none}.rev-station,.hub-concept-preview{display:none}}
      `}</style>
    </div>
  );
}
