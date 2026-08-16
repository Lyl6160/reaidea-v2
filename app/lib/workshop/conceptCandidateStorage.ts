import type { ConceptCandidate } from "../ai/types";

const DATABASE_NAME = "reaidea-workshop-concepts";
const DATABASE_VERSION = 1;
const STORE_NAME = "current-candidates";
const MAX_PERSISTED_IMAGE_BYTES = 8_000_000;

type StoredConceptCandidate = {
  version: 1 | 2;
  projectId: string;
  candidate?: ConceptCandidate;
  candidates?: ConceptCandidate[];
};

export async function restoreConceptCandidateHistory(projectId: string): Promise<ConceptCandidate[]> {
  if (!projectId.trim() || typeof indexedDB === "undefined") return [];
  const database = await openDatabase();
  try {
    const stored = await requestResult<StoredConceptCandidate | undefined>(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(projectId)
    );
    if (stored?.projectId !== projectId) return [];
    const candidates = stored.candidates ?? (stored.candidate ? [stored.candidate] : []);
    return candidates.filter(isPersistableCandidate).sort((left, right) => left.revision - right.revision);
  } finally {
    database.close();
  }
}

export async function restoreCurrentConceptCandidate(
  projectId: string
): Promise<ConceptCandidate | null> {
  const history = await restoreConceptCandidateHistory(projectId);
  return history.at(-1) ?? null;
}

export async function persistConceptCandidateHistory(
  projectId: string,
  candidates: ConceptCandidate[]
): Promise<boolean> {
  if (
    !projectId.trim() || typeof indexedDB === "undefined" || candidates.length === 0 ||
    candidates.length > 12 || !candidates.every(isPersistableCandidate)
  ) return false;
  const familyId = candidates[0].conceptFamilyId;
  if (candidates.some((candidate, index) => candidate.conceptFamilyId !== familyId || candidate.revision !== index + 1)) {
    return false;
  }
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ version: 2, projectId, candidates } satisfies StoredConceptCandidate);
    await transactionComplete(transaction);
    return true;
  } finally {
    database.close();
  }
}

export async function persistCurrentConceptCandidate(
  projectId: string,
  candidate: ConceptCandidate
): Promise<boolean> {
  return persistConceptCandidateHistory(projectId, [candidate]);
}

function isPersistableCandidate(value: unknown): value is ConceptCandidate {
  if (
    !isRecord(value) ||
    value.status !== "generated" ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    !["product", "machine", "process", "software", "system", "environmental", "mixed", "unknown"].includes(String(value.visualMode)) ||
    !["engineering-outline", "wireframe", "solid-concept"].includes(String(value.representationStyle)) ||
    typeof value.sourceBriefVersion !== "number"
  ) return false;
  if (
    !nonEmptyString(value.candidateId) ||
    !nonEmptyString(value.conceptFamilyId) ||
    !nonEmptyString(value.title) ||
    !nonEmptyString(value.createdAt) ||
    !nonEmptyString(value.sourceBriefHash) ||
    !nonEmptyString(value.disclaimer) ||
    !Array.isArray(value.sourceEventIds) ||
    !value.sourceEventIds.every(nonEmptyString) ||
    !isRecord(value.output) ||
    value.output.type !== "image" ||
    !nonEmptyString(value.output.altText) ||
    !nonEmptyString(value.output.dataUrl)
  ) {
    return false;
  }
  if (
    (value.sourceCandidateId !== undefined && !nonEmptyString(value.sourceCandidateId)) ||
    (value.inventorRefinement !== undefined && !nonEmptyString(value.inventorRefinement))
  ) return false;
  const imageMatch = value.output.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!imageMatch) return false;
  const estimatedBytes = Math.floor((imageMatch[2].length * 3) / 4);
  return estimatedBytes <= MAX_PERSISTED_IMAGE_BYTES;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Concept cache could not be opened."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Concept cache request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Concept cache transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Concept cache transaction was aborted."));
  });
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
