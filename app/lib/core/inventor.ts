export type Inventor = {
  id: string;
  preferredName: string;
  createdAt: string;
  updatedAt: string;
};

export function createInventor(preferredName: string): Inventor {
  const now = new Date().toISOString();

  return {
    id: createId(),
    preferredName: preferredName.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateInventorName(
  inventor: Inventor,
  preferredName: string
): Inventor {
  return {
    ...inventor,
    preferredName: preferredName.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function createId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
