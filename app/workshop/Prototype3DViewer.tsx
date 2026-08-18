"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  type GeometryVector3,
} from "../lib/geometry/conceptGeometry";

type Prototype3DViewerProps = {
  geometry: ConceptGeometry;
};

export default function Prototype3DViewer({ geometry }: Prototype3DViewerProps) {
  const [fitRequest, setFitRequest] = useState(0);
  const [resetRequest, setResetRequest] = useState(0);
  const [jointPreview, setJointPreview] = useState(false);

  if (!isValidConceptGeometry(geometry)) {
    return <p className="prototype-3d-unavailable">3D model not available yet.</p>;
  }

  return (
    <section className="prototype-3d-viewer" aria-label="Interactive 3D model">
      <div className="prototype-3d-instructions"><strong>3D MODEL</strong><span>DRAG TO ROTATE · SCROLL TO ZOOM</span></div>
      <div className="prototype-3d-canvas">
        <Canvas camera={{ position: [3.8, 2.8, 5.2], fov: 38 }} dpr={[1, 1.75]} frameloop="demand" gl={{ antialias: true }}>
          <color attach="background" args={["#eef2f3"]} />
          <ambientLight intensity={1.7} />
          <directionalLight position={[4, 8, 6]} intensity={2.4} />
          <directionalLight position={[-5, 3, -4]} intensity={1.1} />
          <Bounds fit clip observe margin={1.25}>
            <GeometryModel geometry={geometry} jointPreview={jointPreview} />
            <ViewController fitRequest={fitRequest} resetRequest={resetRequest} />
          </Bounds>
        </Canvas>
      </div>
      <div className="prototype-3d-actions">
        <button type="button" onClick={() => setResetRequest((value) => value + 1)}>RESET VIEW</button>
        <button type="button" onClick={() => setFitRequest((value) => value + 1)}>FIT MODEL</button>
        {geometry.joints.length > 0 && <button type="button" onClick={() => setJointPreview((value) => !value)}>{jointPreview ? "RETURN JOINT" : "ROTATE JOINT"}</button>}
      </div>
      <style jsx>{`
        .prototype-3d-viewer{display:grid;grid-template-rows:auto minmax(360px,1fr) auto;width:100%;height:100%;min-height:440px;overflow:hidden;border:1px solid rgba(94,198,211,.34);border-radius:9px;background:#10191d}.prototype-3d-instructions{display:flex;justify-content:space-between;gap:16px;padding:10px 12px;border-bottom:1px solid rgba(94,198,211,.24);color:#dffbff;font-size:10px;letter-spacing:.1em}.prototype-3d-instructions span{color:#8da7ac}.prototype-3d-canvas{min-height:360px}.prototype-3d-canvas :global(canvas){display:block;touch-action:none}.prototype-3d-actions{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border-top:1px solid rgba(94,198,211,.24)}.prototype-3d-actions button{min-height:34px;padding:0 12px;border:1px solid rgba(105,217,233,.58);border-radius:6px;background:#173b45;color:#e9fbff;font:850 9px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer}.prototype-3d-unavailable{padding:20px;color:#aab9bb;text-align:center}
      `}</style>
    </section>
  );
}

function ViewController({ fitRequest, resetRequest }: { fitRequest: number; resetRequest: number }) {
  const bounds = useBounds();
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null);

  useEffect(() => {
    if (fitRequest === 0) return;
    bounds.refresh().fit().clip();
  }, [bounds, fitRequest]);

  useEffect(() => {
    if (resetRequest === 0) return;
    controls.current?.reset();
    bounds.refresh().fit().clip();
  }, [bounds, resetRequest]);

  return <OrbitControls ref={controls} makeDefault enableDamping enablePan={false} minDistance={0.5} maxDistance={30} />;
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
  const pivot: GeometryVector3 = joint?.pivot ?? [0, 0, 0];
  const localPosition = joint ? subtract(component.position, pivot) : [0, 0, 0] as [number, number, number];
  const node = (
    <group position={localPosition} rotation={component.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]} scale={component.scale ? [...component.scale] : [1, 1, 1]}>
      <Primitive component={component} />
      {(childrenByParent.get(component.id) ?? []).map((child) => <ComponentNode key={child.id} component={components.get(child.id)!} components={components} childrenByParent={childrenByParent} jointsByChild={jointsByChild} jointPreview={jointPreview} />)}
    </group>
  );
  return <group position={joint ? pivot : component.position} quaternion={quaternion}>{node}</group>;
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
  return <mesh position={placement.position} rotation={placement.rotation}><planeGeometry args={placement.size} /><meshBasicMaterial map={texture} transparent={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>;
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

function subtract(left: GeometryVector3, right: GeometryVector3): [number, number, number] {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}
