import type { ConceptGeometryComponent, ConceptGeometryJoint, GeometryVector3 } from "./conceptGeometry";

export function resolveComponentTransform(component: ConceptGeometryComponent, joint?: ConceptGeometryJoint): {
  containerPosition: GeometryVector3;
  localPosition: GeometryVector3;
} {
  if (!joint) return { containerPosition: [0, 0, 0], localPosition: component.position };
  return {
    containerPosition: joint.pivot,
    localPosition: [component.position[0] - joint.pivot[0], component.position[1] - joint.pivot[1], component.position[2] - joint.pivot[2]],
  };
}
