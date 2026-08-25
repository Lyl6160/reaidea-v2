import type { ConceptCandidate } from "../lib/ai/types";
import { isValidConceptGeometry, type ConceptGeometry } from "../lib/geometry/conceptGeometry";

export type WorkshopStagePresentation =
  | { kind: "interactive-3d"; candidate: ConceptCandidate; geometry: ConceptGeometry }
  | { kind: "visual-concept"; candidate: ConceptCandidate; blocker: string }
  | { kind: "empty" };

/** Resolves exactly one centre-stage representation for the already active Project candidate. */
export function resolveWorkshopStagePresentation(candidate: ConceptCandidate | null | undefined): WorkshopStagePresentation {
  if (!candidate || candidate.output.type !== "image" || !candidate.output.dataUrl?.startsWith("data:image/")) return { kind: "empty" };
  const geometry = candidate.conceptGeometry;
  if (candidate.conceptGeometryStatus === "available" && geometry && isValidConceptGeometry(geometry) && geometrySourceMatchesCandidate(geometry, candidate)) {
    return { kind: "interactive-3d", candidate, geometry };
  }
  return { kind: "visual-concept", candidate, blocker: geometryBlocker(candidate) };
}

export function geometrySourceMatchesCandidate(geometry: ConceptGeometry, candidate: Pick<ConceptCandidate, "conceptFamilyId" | "candidateId" | "revision">): boolean {
  const source = geometry.source;
  return Boolean(source && source.conceptFamilyId === candidate.conceptFamilyId && source.candidateId === candidate.candidateId && source.revision === candidate.revision);
}

function geometryBlocker(candidate: ConceptCandidate): string {
  const safePlanBlocker = candidate.initialGeometryPlan?.blocker?.safeMessage;
  if (safePlanBlocker) return safePlanBlocker;
  return "Interactive 3D is not yet available for this Visual Concept.";
}
