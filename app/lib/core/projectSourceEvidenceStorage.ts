"use client";

export const SOURCE_IMAGE_REFERENCE_PREFIX = "source-image:";
export const MAX_SOURCE_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_DIMENSION = 4096;
export const MAX_SOURCE_IMAGE_PIXELS = 16_777_216;

export type SourceImageMediaType = "image/png" | "image/jpeg" | "image/webp";

export type ProjectSourceImageRecord = {
  evidenceId: string;
  projectId: string;
  mediaType: SourceImageMediaType;
  byteSize: number;
  displayName: string;
  createdAt: string;
  width: number;
  height: number;
  blob: Blob;
  interpretation?: import("../ai/types").VisualUnderstandingResult;
  safetyReceipt?: import("../ai/types").RevImageSafetyReceipt;
};

export type ValidatedSourceImage = Omit<
  ProjectSourceImageRecord,
  "projectId" | "createdAt" | "interpretation" | "safetyReceipt"
>;

const DATABASE_NAME = "reaidea-project-source-evidence";
const DATABASE_VERSION = 1;
const STORE_NAME = "source-images";

export function createSourceImageReference(evidenceId: string): string {
  return `${SOURCE_IMAGE_REFERENCE_PREFIX}${evidenceId}`;
}

export function parseSourceImageReference(reference: string): string | null {
  if (!reference.startsWith(SOURCE_IMAGE_REFERENCE_PREFIX)) return null;
  const evidenceId = reference.slice(SOURCE_IMAGE_REFERENCE_PREFIX.length).trim();
  return evidenceId || null;
}

export async function validateSourceImage(file: File): Promise<ValidatedSourceImage> {
  if (!isSourceImageMediaType(file.type)) {
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  }
  if (file.size === 0 || file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Choose an image no larger than 4 MiB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasMatchingImageSignature(bytes, file.type)) {
    throw new Error("This file does not contain a valid supported image.");
  }

  const dimensions = await decodeImageDimensions(file);
  if (
    dimensions.width > MAX_SOURCE_IMAGE_DIMENSION ||
    dimensions.height > MAX_SOURCE_IMAGE_DIMENSION ||
    dimensions.width * dimensions.height > MAX_SOURCE_IMAGE_PIXELS
  ) {
    throw new Error("Choose an image no larger than 4096 pixels per side or 16.8 megapixels.");
  }

  return {
    evidenceId: createId(),
    mediaType: file.type,
    byteSize: file.size,
    displayName: safeDisplayName(file.name),
    width: dimensions.width,
    height: dimensions.height,
    blob: file.slice(0, file.size, file.type),
  };
}

export async function saveProjectSourceImage(
  projectId: string,
  image: ValidatedSourceImage,
  interpretation: import("../ai/types").VisualUnderstandingResult | undefined,
  safetyReceipt: import("../ai/types").RevImageSafetyReceipt,
  inventorDescription: string
): Promise<ProjectSourceImageRecord> {
  if (!isValidSafetyReceipt(safetyReceipt)) throw new Error("REV has not cleared this image for evidence storage.");
  const [imageHash, contextHash] = await Promise.all([
    browserSha256(await image.blob.arrayBuffer()),
    browserSha256(new TextEncoder().encode(inventorDescription.replace(/\r\n?/g, "\n").trim())),
  ]);
  if (imageHash !== safetyReceipt.imageDigest || contextHash !== safetyReceipt.inventorContextDigest) {
    throw new Error("REV image clearance no longer matches the current evidence and description.");
  }
  const record: ProjectSourceImageRecord = {
    ...image,
    projectId,
    createdAt: new Date().toISOString(),
    safetyReceipt,
    ...(interpretation?.evidenceReference === createSourceImageReference(image.evidenceId)
      ? { interpretation }
      : {}),
  };
  const database = await openDatabase();
  await transactionRequest(database, "readwrite", (store) => store.add(record));
  database.close();
  return record;
}

export async function loadProjectSourceImage(
  projectId: string,
  evidenceId: string
): Promise<ProjectSourceImageRecord | null> {
  const database = await openDatabase();
  const value = await transactionRequest(database, "readonly", (store) => store.get(evidenceId));
  database.close();
  if (!isStoredSourceImage(value) || value.projectId !== projectId) return null;

  try {
    const validated = await validateSourceImage(
      new File([value.blob], value.displayName, { type: value.mediaType })
    );
    if (
      validated.byteSize !== value.byteSize ||
      validated.width !== value.width ||
      validated.height !== value.height
    ) return null;
    if (value.interpretation && !isValidInterpretation(value.interpretation, evidenceId)) {
      const { interpretation: _invalidInterpretation, ...record } = value;
      void _invalidInterpretation;
      return record;
    }
    if (value.safetyReceipt && !isValidSafetyReceipt(value.safetyReceipt)) {
      const { safetyReceipt: _invalidReceipt, ...record } = value;
      void _invalidReceipt;
      return record;
    }
    return value;
  } catch {
    return null;
  }
}

export async function deleteProjectSourceImage(
  projectId: string,
  evidenceId: string
): Promise<boolean> {
  const database = await openDatabase();
  const existing = await transactionRequest(database, "readonly", (store) => store.get(evidenceId));
  if (!isStoredSourceImage(existing) || existing.projectId !== projectId) {
    database.close();
    return false;
  }
  await transactionRequest(database, "readwrite", (store) => store.delete(evidenceId));
  database.close();
  return true;
}

export async function sourceImageToDataUrl(record: Pick<ProjectSourceImageRecord, "blob" | "mediaType">): Promise<string> {
  const bytes = new Uint8Array(await record.blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return `data:${record.mediaType};base64,${window.btoa(binary)}`;
}

function isSourceImageMediaType(value: string): value is SourceImageMediaType {
  return value === "image/png" || value === "image/jpeg" || value === "image/webp";
}

function hasMatchingImageSignature(bytes: Uint8Array, mediaType: SourceImageMediaType): boolean {
  if (mediaType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((value, index) => bytes[index] === value);
  }
  if (mediaType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

async function decodeImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    if (dimensions.width < 1 || dimensions.height < 1) throw new Error();
    return dimensions;
  } catch {
    throw new Error("REV couldn't read this image. Choose another PNG, JPEG, or WebP image.");
  }
}

function safeDisplayName(value: string): string {
  const leaf = value.split(/[\\/]/).at(-1) ?? "reference-image";
  const cleaned = leaf.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 120);
  return cleaned || "reference-image";
}

function isStoredSourceImage(value: unknown): value is ProjectSourceImageRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ProjectSourceImageRecord>;
  return typeof record.evidenceId === "string" && Boolean(record.evidenceId) &&
    typeof record.projectId === "string" && Boolean(record.projectId) &&
    isSourceImageMediaType(String(record.mediaType)) &&
    Number.isInteger(record.byteSize) && Number(record.byteSize) > 0 && Number(record.byteSize) <= MAX_SOURCE_IMAGE_BYTES &&
    typeof record.displayName === "string" && Boolean(record.displayName) && record.displayName.length <= 120 &&
    typeof record.createdAt === "string" &&
    Number.isInteger(record.width) && Number(record.width) > 0 && Number(record.width) <= MAX_SOURCE_IMAGE_DIMENSION &&
    Number.isInteger(record.height) && Number(record.height) > 0 && Number(record.height) <= MAX_SOURCE_IMAGE_DIMENSION &&
    Number(record.width) * Number(record.height) <= MAX_SOURCE_IMAGE_PIXELS &&
    record.blob instanceof Blob && record.blob.size === record.byteSize && record.blob.type === record.mediaType;
}

export function isValidSafetyReceipt(value: unknown): value is import("../ai/types").RevImageSafetyReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<import("../ai/types").RevImageSafetyReceipt>;
  const allowed = new Set([
    "safety-only", "secure-storage-only", "lawful-transport-only", "training-only",
    "disabled-replica-only", "historical-study-only", "non-weapon-accessory-only",
    "containment-only", "shielding-only", "hazard-detection-only", "remote-handling-only",
    "emergency-response-only", "verified-hazard-input-required",
  ]);
  return receipt.decision === "CLEAR" && receipt.policyVersion === 1 &&
    typeof receipt.imageDigest === "string" && /^[a-f0-9]{64}$/.test(receipt.imageDigest) &&
    typeof receipt.inventorContextDigest === "string" && /^[a-f0-9]{64}$/.test(receipt.inventorContextDigest) &&
    typeof receipt.checkedAt === "string" &&
    Array.isArray(receipt.limitations) && receipt.limitations.length <= 8 && receipt.limitations.every((item) => allowed.has(String(item)));
}

function isValidInterpretation(
  value: unknown,
  evidenceId: string
): value is import("../ai/types").VisualUnderstandingResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<import("../ai/types").VisualUnderstandingResult>;
  return result.evidenceReference === createSourceImageReference(evidenceId) &&
    result.nonAuthoritative === true &&
    typeof result.createdAt === "string" &&
    typeof result.factualSummary === "string" && result.factualSummary.trim().length > 0 && result.factualSummary.length <= 280 &&
    isBoundedInterpretationList(result.visualObservations, 8) &&
    isBoundedInterpretationList(result.uncertainties, 4);
}

function isBoundedInterpretationList(value: unknown, maxItems: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every(
    (item) => typeof item === "string" && item.trim().length > 0 && item.length <= 240
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.createObjectStore(STORE_NAME, { keyPath: "evidenceId" });
      store.createIndex("projectId", "projectId", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("REV couldn't open source evidence storage."));
    request.onblocked = () => reject(new Error("REV couldn't update source evidence storage."));
  });
}

function transactionRequest(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("REV couldn't update source evidence storage."));
    transaction.onabort = () => reject(new Error("REV couldn't update source evidence storage."));
  });
}

function createId(): string {
  return globalThis.crypto.randomUUID();
}

async function browserSha256(value: ArrayBuffer | ArrayBufferView): Promise<string> {
  const bytes = value instanceof ArrayBuffer
    ? value
    : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
