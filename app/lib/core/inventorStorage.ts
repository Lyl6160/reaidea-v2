import {
  type Inventor,
  createInventor,
  updateInventorName,
} from "./inventor";

const STORAGE_KEY = "reaidea-inventor";
const STORAGE_EVENT = "reaidea-inventor-changed";

export function saveInventor(inventor: Inventor): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inventor));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch (error) {
    console.error("Could not save the reAIdea Inventor state.", error);
  }
}

export function loadInventor(): Inventor | null {
  return parseInventorSnapshot(getInventorStorageSnapshot());
}

export function savePreferredName(preferredName: string): Inventor {
  const existingInventor = loadInventor();
  const inventor = existingInventor
    ? updateInventorName(existingInventor, preferredName)
    : createInventor(preferredName);

  saveInventor(inventor);
  return inventor;
}

export function getInventorStorageSnapshot(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function getServerInventorStorageSnapshot(): null {
  return null;
}

export function subscribeToInventorStorage(
  listener: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, listener);
  };
}

export function parseInventorSnapshot(snapshot: string | null): Inventor | null {
  if (!snapshot) {
    return null;
  }

  try {
    const parsedInventor = JSON.parse(snapshot) as unknown;

    return isValidInventor(parsedInventor) ? parsedInventor : null;
  } catch (error) {
    console.error("Could not read the reAIdea Inventor state.", error);
    return null;
  }
}

function isValidInventor(value: unknown): value is Inventor {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const inventor = value as Partial<Inventor>;

  return (
    typeof inventor.id === "string" &&
    typeof inventor.preferredName === "string" &&
    typeof inventor.createdAt === "string" &&
    typeof inventor.updatedAt === "string"
  );
}
