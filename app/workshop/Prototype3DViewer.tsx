"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bounds, OrbitControls, useBounds } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import {
  isValidConceptGeometry,
  type ConceptGeometry,
  type ConceptGeometryComponent,
  type ConceptGeometryFace,
  type ConceptGeometryJoint,
  type ConceptGeometryMarking,
} from "../lib/geometry/conceptGeometry";
import { resolveComponentTransform } from "../lib/geometry/componentTransforms";

type Prototype3DViewerProps = {
  geometry: ConceptGeometry;
  presentationMode?: "console" | "stage";
  autoRotate?: boolean;
  controlsHost?: HTMLElement | null;
};

export default function Prototype3DViewer({ geometry, presentationMode = "console", autoRotate = false, controlsHost = null }: Prototype3DViewerProps) {
  const [fitRequest, setFitRequest] = useState(0);
  const [resetRequest, setResetRequest] = useState(0);
  const [jointPreview, setJointPreview] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(true);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const rotationPreferenceInitialisedRef = useRef(false);
  const fullScreenButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => {
      if (!rotationPreferenceInitialisedRef.current) {
        setRotationPaused(!autoRotate || reducedMotion.matches);
        rotationPreferenceInitialisedRef.current = true;
      } else if (reducedMotion.matches) {
        setRotationPaused(true);
      }
    };
    applyPreference();
    reducedMotion.addEventListener("change", applyPreference);
    return () => reducedMotion.removeEventListener("change", applyPreference);
  }, [autoRotate]);

  useEffect(() => {
    if (!fullScreenOpen || !portalRoot) return;

    const previousOverflow = document.body.style.overflow;
    const backgroundState = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== portalRoot)
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));

    document.body.style.overflow = "hidden";
    backgroundState.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusClose = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusClose);
      document.body.style.overflow = previousOverflow;
      backgroundState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      portalRoot.remove();
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>('[data-prototype3d-fullscreen-trigger="true"]')?.focus();
      });
    };
  }, [fullScreenOpen, portalRoot]);

  const automaticRotationActive = autoRotate && !rotationPaused;

  if (!isValidConceptGeometry(geometry)) {
    return <p className="prototype-3d-unavailable">3D model not available yet.</p>;
  }

  function openFullScreen() {
    const root = document.createElement("div");
    root.dataset.prototype3dPortal = "true";
    document.body.appendChild(root);
    setPortalRoot(root);
    setFitRequest((value) => value + 1);
    setFullScreenOpen(true);
  }

  function closeFullScreen() {
    setFitRequest((value) => value + 1);
    setFullScreenOpen(false);
  }

  function containDialogFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeFullScreen();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []).filter((element) => !element.hasAttribute("hidden"));
    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const surface = (
    <Prototype3DSurface
      geometry={geometry}
      presentationMode={fullScreenOpen ? "console" : presentationMode}
      autoRotateEnabled={autoRotate}
      automaticRotationActive={automaticRotationActive}
      rotationPaused={rotationPaused}
      jointPreview={jointPreview}
      fitRequest={fitRequest}
      resetRequest={resetRequest}
      fullScreen={fullScreenOpen}
      controlsHost={fullScreenOpen ? null : controlsHost}
      fullScreenButtonRef={fullScreenButtonRef}
      onToggleRotation={() => setRotationPaused((paused) => !paused)}
      onInteractionStart={() => setRotationPaused(true)}
      onReset={() => setResetRequest((value) => value + 1)}
      onFit={() => setFitRequest((value) => value + 1)}
      onToggleJoint={() => setJointPreview((value) => !value)}
      onOpenFullScreen={openFullScreen}
    />
  );

  if (fullScreenOpen) {
    if (!portalRoot) return null;
    return createPortal(
      <div className="prototype-3d-modal-backdrop">
        <div ref={dialogRef} className="prototype-3d-modal" role="dialog" aria-modal="true" aria-labelledby="prototype-3d-modal-title" tabIndex={-1} onKeyDown={containDialogFocus}>
          <header className="prototype-3d-modal-header">
            <h2 id="prototype-3d-modal-title">Prototype 3D model</h2>
            <button ref={closeButtonRef} type="button" onClick={closeFullScreen}>CLOSE</button>
          </header>
          <div className="prototype-3d-modal-content">{surface}</div>
        </div>
        <style jsx>{`
          .prototype-3d-modal-backdrop{position:fixed;z-index:2147483647;inset:0;box-sizing:border-box;display:grid;min-width:0;min-height:0;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:rgba(2,8,11,.98)}.prototype-3d-modal{display:grid;grid-template-rows:auto minmax(0,1fr);width:min(1280px,100%);height:100%;min-width:0;min-height:0;margin:auto;overflow:hidden;border:1px solid rgba(112,230,244,.58);border-radius:12px;background:#071014;box-shadow:0 24px 80px rgba(0,0,0,.7)}.prototype-3d-modal-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid rgba(94,198,211,.34);background:#10191d}.prototype-3d-modal-header h2{margin:0;color:#e9fbff;font:900 clamp(16px,2vw,24px)/1.2 Arial,sans-serif;letter-spacing:.04em}.prototype-3d-modal-header button{min-width:96px;min-height:44px;padding:0 16px;border:1px solid rgba(105,217,233,.7);border-radius:7px;background:#173b45;color:#e9fbff;font:850 12px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer}.prototype-3d-modal-header button:focus-visible{outline:3px solid #f4d27d;outline-offset:3px}.prototype-3d-modal-content{min-width:0;min-height:0;overflow:hidden;padding:12px}.prototype-3d-modal-content :global(.prototype-3d-viewer){min-height:0;border:0;box-shadow:none}.prototype-3d-modal-content :global(.prototype-3d-actions){display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:10px 12px;border-top:1px solid rgba(94,198,211,.34);background:rgba(10,27,33,.96)}.prototype-3d-modal-content :global(.prototype-3d-actions button){min-height:44px;padding:0 16px;border:1px solid rgba(105,217,233,.72);border-radius:7px;background:linear-gradient(180deg,#1a4a58,#112f38);box-shadow:inset 0 1px 0 rgba(225,252,255,.12),0 3px 10px rgba(0,0,0,.28);color:#e9fbff;font:850 11px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer}.prototype-3d-modal-content :global(.prototype-3d-actions button:hover){border-color:#8ceaf5;background:linear-gradient(180deg,#225b69,#153c47)}.prototype-3d-modal-content :global(.prototype-3d-actions button:focus-visible){outline:3px solid #f4d27d;outline-offset:2px}@media(max-width:700px){.prototype-3d-modal-backdrop{padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}.prototype-3d-modal{border-radius:8px}.prototype-3d-modal-header{padding:9px 10px}.prototype-3d-modal-header h2{font-size:15px}.prototype-3d-modal-header button{min-width:84px;min-height:44px;padding:0 12px}.prototype-3d-modal-content{padding:7px}.prototype-3d-modal-content :global(.prototype-3d-actions){gap:7px;padding:8px}.prototype-3d-modal-content :global(.prototype-3d-actions button){flex:1 1 148px;min-height:44px;padding:0 12px;font-size:10px}}@media(max-height:520px) and (orientation:landscape){.prototype-3d-modal-backdrop{padding:6px}.prototype-3d-modal-header{padding:6px 10px}.prototype-3d-modal-header button{min-height:44px}.prototype-3d-modal-content{padding:5px}.prototype-3d-modal-content :global(.prototype-3d-actions){padding:6px 8px}}
        `}</style>
      </div>,
      portalRoot
    );
  }

  return surface;
}

function Prototype3DSurface({ geometry, presentationMode, autoRotateEnabled, automaticRotationActive, rotationPaused, jointPreview, fitRequest, resetRequest, fullScreen, controlsHost, fullScreenButtonRef, onToggleRotation, onInteractionStart, onReset, onFit, onToggleJoint, onOpenFullScreen }: {
  geometry: ConceptGeometry;
  presentationMode: "console" | "stage";
  autoRotateEnabled: boolean;
  automaticRotationActive: boolean;
  rotationPaused: boolean;
  jointPreview: boolean;
  fitRequest: number;
  resetRequest: number;
  fullScreen: boolean;
  controlsHost: HTMLElement | null;
  fullScreenButtonRef: React.RefObject<HTMLButtonElement | null>;
  onToggleRotation: () => void;
  onInteractionStart: () => void;
  onReset: () => void;
  onFit: () => void;
  onToggleJoint: () => void;
  onOpenFullScreen: () => void;
}) {
  const actions = (
    <div className="prototype-3d-actions" role="group" aria-label="Interactive 3D viewer controls">
      {autoRotateEnabled && (
        <button
          type="button"
          aria-label={automaticRotationActive ? "Pause automatic Prototype model rotation" : "Resume automatic Prototype model rotation"}
          aria-pressed={automaticRotationActive}
          onClick={onToggleRotation}
        >
          {rotationPaused ? "RESUME ROTATION" : "PAUSE ROTATION"}
        </button>
      )}
      <button type="button" onClick={onReset}>RESET VIEW</button>
      <button type="button" onClick={onFit}>FIT MODEL</button>
      {geometry.joints.length > 0 && <button type="button" onClick={onToggleJoint}>{jointPreview ? "RETURN JOINT" : "ROTATE JOINT"}</button>}
      {!fullScreen && <button ref={fullScreenButtonRef} data-prototype3d-fullscreen-trigger="true" type="button" onClick={onOpenFullScreen}>VIEW FULL SCREEN</button>}
    </div>
  );
  const externalActions = presentationMode === "stage" && controlsHost && !fullScreen
    ? createPortal(actions, controlsHost)
    : null;
  const inlineActions = fullScreen || presentationMode !== "stage" ? actions : null;

  return (
    <section className={`prototype-3d-viewer${presentationMode === "stage" ? " is-stage" : ""}${fullScreen ? " is-full-screen" : ""}${externalActions ? " has-external-actions" : ""}`} aria-label="Interactive 3D model">
      <div className="prototype-3d-instructions"><strong>3D MODEL</strong><span>DRAG TO ROTATE · SCROLL TO ZOOM</span></div>
      <div className="prototype-3d-canvas">
        <Canvas camera={{ position: [3.8, 2.8, 5.2], fov: 38 }} dpr={[1, 1.75]} frameloop={automaticRotationActive ? "always" : "demand"} gl={{ antialias: true, alpha: presentationMode === "stage" }}>
          {presentationMode !== "stage" && <color attach="background" args={["#eef2f3"]} />}
          <ambientLight intensity={1.7} />
          <directionalLight position={[4, 8, 6]} intensity={2.4} />
          <directionalLight position={[-5, 3, -4]} intensity={1.1} />
          <Bounds fit clip observe margin={0.85}>
            <GeometryModel geometry={geometry} jointPreview={jointPreview} />
            <ViewController
              fitRequest={fitRequest}
              resetRequest={resetRequest}
              autoRotate={automaticRotationActive}
              onInteractionStart={onInteractionStart}
            />
          </Bounds>
        </Canvas>
      </div>
      {inlineActions}
      {externalActions}
      <style jsx>{`
        :global(#workshop-central-stage:has(.prototype-3d-viewer)){z-index:9}.prototype-3d-viewer{display:grid;grid-template-rows:auto minmax(360px,1fr) auto;width:100%;height:100%;min-height:440px;overflow:hidden;border:1px solid rgba(94,198,211,.34);border-radius:9px;background:#10191d}.prototype-3d-instructions{display:flex;justify-content:space-between;gap:16px;padding:10px 12px;border-bottom:1px solid rgba(94,198,211,.24);color:#dffbff;font-size:10px;letter-spacing:.1em}.prototype-3d-instructions span{color:#8da7ac}.prototype-3d-canvas{min-height:360px}.prototype-3d-canvas :global(canvas){display:block;touch-action:none}.prototype-3d-actions{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border-top:1px solid rgba(94,198,211,.24)}.prototype-3d-actions button{min-height:34px;padding:0 12px;border:1px solid rgba(105,217,233,.58);border-radius:6px;background:#173b45;color:#e9fbff;font:850 9px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer}.prototype-3d-actions button:focus-visible{outline:3px solid #f4d27d;outline-offset:2px}.prototype-3d-unavailable{padding:20px;color:#aab9bb;text-align:center}.prototype-3d-viewer.is-stage{grid-template-rows:minmax(250px,1fr);min-height:0;overflow:visible;border:0;border-radius:0;background:transparent;box-shadow:none}.is-stage .prototype-3d-instructions{display:none}.is-stage .prototype-3d-canvas{min-height:250px;filter:drop-shadow(0 10px 13px rgba(0,0,0,.42))}.prototype-3d-viewer.is-full-screen{grid-template-rows:auto minmax(0,1fr) auto;min-height:0}.is-full-screen .prototype-3d-canvas{min-height:0}.is-full-screen .prototype-3d-actions button{min-height:44px;padding:0 16px;font-size:11px}@media(max-width:700px){.prototype-3d-viewer.is-stage{grid-template-rows:minmax(132px,1fr)}.is-stage .prototype-3d-canvas{min-height:132px}.prototype-3d-viewer.is-full-screen{min-height:0}.is-full-screen .prototype-3d-instructions{padding:8px 10px;font-size:9px}.is-full-screen .prototype-3d-instructions span{display:block}.is-full-screen .prototype-3d-actions{gap:7px;padding:8px 10px}.is-full-screen .prototype-3d-actions button{min-height:44px;padding:0 12px;font-size:10px}}@media(prefers-reduced-motion:reduce){.prototype-3d-viewer{scroll-behavior:auto}}
      `}</style>
    </section>
  );
}

function ViewController({ fitRequest, resetRequest, autoRotate, onInteractionStart }: {
  fitRequest: number;
  resetRequest: number;
  autoRotate: boolean;
  onInteractionStart: () => void;
}) {
  const bounds = useBounds();
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null);

  useEffect(() => {
    if (fitRequest === 0) return;
    let fitFrame = 0;
    const layoutFrame = window.requestAnimationFrame(() => {
      fitFrame = window.requestAnimationFrame(() => bounds.refresh().fit().clip());
    });
    return () => {
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(fitFrame);
    };
  }, [bounds, fitRequest]);

  useEffect(() => {
    if (resetRequest === 0) return;
    controls.current?.reset();
    bounds.refresh().fit().clip();
  }, [bounds, resetRequest]);

  return <OrbitControls ref={controls} makeDefault autoRotate={autoRotate} autoRotateSpeed={0.45} enableDamping enablePan={false} minDistance={0.5} maxDistance={30} onStart={onInteractionStart} />;
}

function GeometryModel({ geometry, jointPreview }: { geometry: ConceptGeometry; jointPreview: boolean }) {
  const components = useMemo(() => new Map(geometry.components.map((component) => [component.id, component])), [geometry]);
  const children = useMemo(() => {
    const byParent = new Map<string, ConceptGeometryComponent[]>();
    for (const component of geometry.components) {
      if (!component.parentId) continue;
      byParent.set(component.parentId, [...(byParent.get(component.parentId) ?? []), component]);
    }
    return byParent;
  }, [geometry]);
  const joints = useMemo(() => new Map(geometry.joints.map((joint) => [joint.childId, joint])), [geometry]);
  const roots = geometry.components.filter((component) => !component.parentId);
  const unitScale = geometry.units === "mm" ? 0.001 : 1;

  return <group scale={unitScale}>{roots.map((component) => <ComponentNode key={component.id} component={component} components={components} childrenByParent={children} jointsByChild={joints} jointPreview={jointPreview} />)}</group>;
}

function ComponentNode({ component, components, childrenByParent, jointsByChild, jointPreview }: {
  component: ConceptGeometryComponent;
  components: Map<string, ConceptGeometryComponent>;
  childrenByParent: Map<string, ConceptGeometryComponent[]>;
  jointsByChild: Map<string, ConceptGeometryJoint>;
  jointPreview: boolean;
}) {
  const joint = jointsByChild.get(component.id);
  const angle = joint ? (jointPreview ? joint.maxAngle : joint.defaultAngle) : 0;
  const quaternion = useMemo(() => joint
    ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...joint.axis), THREE.MathUtils.degToRad(angle))
    : new THREE.Quaternion(), [angle, joint]);
  // Components are parent-local. A joint introduces one pivot transform; its child
  // keeps the remaining local offset inside that transform exactly once.
  const { containerPosition, localPosition } = resolveComponentTransform(component, joint);
  const node = (
    <group position={localPosition} rotation={component.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]} scale={component.scale ? [...component.scale] : [1, 1, 1]}>
      <Primitive component={component} />
      {(childrenByParent.get(component.id) ?? []).map((child) => <ComponentNode key={child.id} component={components.get(child.id)!} components={components} childrenByParent={childrenByParent} jointsByChild={jointsByChild} jointPreview={jointPreview} />)}
    </group>
  );
  return <group position={containerPosition} quaternion={quaternion}>{node}</group>;
}

function Primitive({ component }: { component: ConceptGeometryComponent }) {
  const material = materialProps(component);
  const extrudedGeometry = useMemo(() => {
    if (component.primitive !== "extruded-polygon" || !component.vertices) return null;
    const shape = new THREE.Shape();
    component.vertices.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
    shape.closePath();
    const result = new THREE.ExtrudeGeometry(shape, { depth: component.dimensions.depth!, bevelEnabled: false });
    result.translate(0, 0, -component.dimensions.depth! / 2);
    return result;
  }, [component]);
  useEffect(() => () => extrudedGeometry?.dispose(), [extrudedGeometry]);
  const geometry = component.primitive === "box"
    ? <boxGeometry args={[component.dimensions.x!, component.dimensions.y!, component.dimensions.z!]} />
    : component.primitive === "cylinder"
      ? <cylinderGeometry args={[component.dimensions.radius!, component.dimensions.radius!, component.dimensions.height!, 32]} />
      : component.primitive === "sphere"
        ? <sphereGeometry args={[component.dimensions.radius!, 24, 16]} />
        : component.primitive === "plane"
          ? <planeGeometry args={[component.dimensions.x!, component.dimensions.y!]} />
          : <primitive object={extrudedGeometry!} attach="geometry" />;
  return (
    <group>
      <mesh castShadow receiveShadow>{geometry}<meshStandardMaterial {...material} side={component.primitive === "plane" ? THREE.DoubleSide : THREE.FrontSide} /></mesh>
      {component.markings?.map((marking, index) => <FaceMarking key={`${marking.face}-${index}`} component={component} marking={marking} />)}
    </group>
  );
}

function FaceMarking({ component, marking }: { component: ConceptGeometryComponent; marking: ConceptGeometryMarking }) {
  const texture = useMemo(() => createMarkingTexture(marking), [marking]);
  useEffect(() => () => texture.dispose(), [texture]);
  const placement = markingPlacement(component, marking.face);
  const circularHousing = component.primitive === "extruded-polygon" && component.vertices && component.vertices.length >= 12;
  const radius = circularHousing ? Math.min(placement.size[0], placement.size[1]) / 2 : 0;
  return <mesh position={placement.position} rotation={placement.rotation}>{circularHousing ? <circleGeometry args={[radius, component.vertices!.length]} /> : <planeGeometry args={placement.size} />}<meshBasicMaterial map={texture} transparent={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>;
}

function createMarkingTexture(marking: ConceptGeometryMarking): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas texture is unavailable.");
  context.fillStyle = marking.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = marking.foreground;
  context.font = `900 ${Math.round(marking.fontSize * 2.4)}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(marking.text, canvas.width / 2, canvas.height / 2, canvas.width * 0.88);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function markingPlacement(component: ConceptGeometryComponent, face: ConceptGeometryFace) {
  const polygonBounds = component.vertices ? { x: Math.max(...component.vertices.map(([x]) => x)) - Math.min(...component.vertices.map(([x]) => x)), y: Math.max(...component.vertices.map(([, y]) => y)) - Math.min(...component.vertices.map(([, y]) => y)) } : undefined;
  const x = component.dimensions.x ?? polygonBounds?.x ?? (component.dimensions.radius ?? 1) * 2;
  const y = component.dimensions.y ?? polygonBounds?.y ?? component.dimensions.height ?? (component.dimensions.radius ?? 1) * 2;
  const z = component.dimensions.z ?? component.dimensions.depth ?? 1;
  const offset = 1;
  const placements: Record<ConceptGeometryFace, { position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }> = {
    front: { position: [0, 0, z / 2 + offset], rotation: [0, 0, 0], size: [x * .82, y * .82] },
    back: { position: [0, 0, -z / 2 - offset], rotation: [0, Math.PI, 0], size: [x * .82, y * .82] },
    left: { position: [-x / 2 - offset, 0, 0], rotation: [0, -Math.PI / 2, 0], size: [z * .82, y * .82] },
    right: { position: [x / 2 + offset, 0, 0], rotation: [0, Math.PI / 2, 0], size: [z * .82, y * .82] },
    top: { position: [0, y / 2 + offset, 0], rotation: [-Math.PI / 2, 0, 0], size: [x * .82, z * .82] },
    bottom: { position: [0, -y / 2 - offset, 0], rotation: [Math.PI / 2, 0, 0], size: [x * .82, z * .82] },
  };
  return placements[face];
}

function materialProps(component: ConceptGeometryComponent) {
  if (component.material === "metal") return { color: component.colour, metalness: .78, roughness: .27 };
  if (component.material === "plastic") return { color: component.colour, metalness: .06, roughness: .38 };
  if (component.material === "emissive") return { color: component.colour, emissive: component.colour, emissiveIntensity: 1.15, metalness: 0, roughness: .3 };
  return { color: component.colour, metalness: 0, roughness: .76 };
}
