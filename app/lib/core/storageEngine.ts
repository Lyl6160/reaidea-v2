import {
    ProjectCore,
    createProjectCore,
} from "./projectCore";

const STORAGE_KEY = "reaidea-project-core";

export function saveProjectCore(
    projectCore: ProjectCore
): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(projectCore)
        );
    } catch (error) {
        console.error(
            "Could not save the reAIdea Project Core.",
            error
        );
    }
}

export function loadProjectCore(): ProjectCore {
    if (typeof window === "undefined") {
        return createProjectCore();
    }

    try {
        const savedProject = window.localStorage.getItem(
            STORAGE_KEY
        );

        if (!savedProject) {
            return createProjectCore();
        }

        const parsedProject = JSON.parse(
            savedProject
        ) as ProjectCore;

        if (!isValidProjectCore(parsedProject)) {
            return createProjectCore();
        }

        return parsedProject;
    } catch (error) {
        console.error(
            "Could not load the reAIdea Project Core.",
            error
        );

        return createProjectCore();
    }
}

export function clearProjectCore(): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error(
            "Could not clear the reAIdea Project Core.",
            error
        );
    }
}

export function projectCoreExists(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return window.localStorage.getItem(STORAGE_KEY) !== null;
}

function isValidProjectCore(
    value: unknown
): value is ProjectCore {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const project = value as Partial<ProjectCore>;

    return (
        typeof project.id === "string" &&
        typeof project.projectName === "string" &&
        typeof project.status === "string" &&
        typeof project.createdAt === "string" &&
        typeof project.updatedAt === "string" &&
        typeof project.brain === "object" &&
        project.brain !== null &&
        Array.isArray(project.timeline)
    );
}