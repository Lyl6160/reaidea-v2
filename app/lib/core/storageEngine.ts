import type { EngineeringState, Project } from "./project";

type StoredEngineeringState = Omit<
  EngineeringState,
  "currentAssumptions" | "currentConstraints"
> &
  Partial<Pick<EngineeringState, "currentAssumptions" | "currentConstraints">>;

type StoredProject = Omit<Project, "engineeringState"> & {
  engineeringState: StoredEngineeringState;
};

const STORAGE_KEY = "reaidea-project";
const STORAGE_EVENT = "reaidea-project-changed";
const LEGACY_PROJECT_KEYS = [
  "reaidea-current-idea",
  "reaidea-current-project",
  "reaidea-project-core",
];

export function saveProject(project: Project): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));

    for (const legacyKey of LEGACY_PROJECT_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }

    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch (error) {
    console.error("Could not save the reAIdea Project.", error);
  }
}

export function loadProject(): Project | null {
  return parseProjectSnapshot(getProjectStorageSnapshot());
}

export function clearProject(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch (error) {
    console.error("Could not clear the reAIdea Project.", error);
  }
}

export function getProjectStorageSnapshot(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function getServerProjectStorageSnapshot(): null {
  return null;
}

export function subscribeToProjectStorage(
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

export function parseProjectSnapshot(snapshot: string | null): Project | null {
  if (!snapshot) {
    return null;
  }

  try {
    const parsedProject = JSON.parse(snapshot) as unknown;

    if (!isValidStoredProject(parsedProject)) {
      return null;
    }

    return normalizeProject(parsedProject);
  } catch (error) {
    console.error("Could not read the reAIdea Project.", error);
    return null;
  }
}

function isValidStoredProject(value: unknown): value is StoredProject {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const project = value as Partial<StoredProject>;
  const engineeringState = project.engineeringState as
    | Partial<StoredEngineeringState>
    | undefined;

  return (
    typeof project.id === "string" &&
    typeof project.projectName === "string" &&
    typeof project.ownerId === "string" &&
    typeof project.originalObservation === "string" &&
    project.originalObservation.length > 0 &&
    typeof project.status === "string" &&
    typeof project.readiness === "string" &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string" &&
    typeof engineeringState === "object" &&
    engineeringState !== null &&
    typeof engineeringState.currentUnderstanding === "string" &&
    Array.isArray(engineeringState.currentEvidence) &&
    typeof engineeringState.greatestRemainingUncertainty === "string" &&
    typeof engineeringState.nextEngineeringStep === "string" &&
    Array.isArray(project.evidence) &&
    Array.isArray(project.decisions) &&
    Array.isArray(project.files) &&
    Array.isArray(project.timeline)
  );
}

function normalizeProject(project: StoredProject): Project {
  return {
    ...project,
    engineeringState: {
      ...project.engineeringState,
      currentEvidence: stringList(project.engineeringState.currentEvidence),
      currentAssumptions: stringList(project.engineeringState.currentAssumptions),
      currentConstraints: stringList(project.engineeringState.currentConstraints),
    },
  };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
