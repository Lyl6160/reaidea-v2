import { ProjectBrain, createProjectBrain } from "./project";

const STORAGE_KEY = "reaidea-current-project";

export function createProject(idea: string): ProjectBrain {
  const project = createProjectBrain(idea);

  saveProject(project);

  return project;
}

export function saveProject(project: ProjectBrain) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(project)
  );
}

export function loadProject(): ProjectBrain | null {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return null;

  return JSON.parse(saved);
}