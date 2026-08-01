import {
    BrainField,
    InnovationBrain,
    createEmptyInnovationBrain,
    updateBrainWithAnswer,
} from "../innovationBrain";

export type ProjectCoreStatus =
    | "new"
    | "learning"
    | "complete";

export type ProjectTimelineEventType =
    | "project-created"
    | "knowledge-added"
    | "knowledge-updated"
    | "interview-completed"
    | "project-reset";

export type ProjectTimelineEvent = {
    id: string;
    type: ProjectTimelineEventType;
    title: string;
    description: string;
    createdAt: string;
};

export type ProjectCore = {
    id: string;
    projectName: string;
    originalIdea: string;

    status: ProjectCoreStatus;
    brain: InnovationBrain;
    timeline: ProjectTimelineEvent[];

    createdAt: string;
    updatedAt: string;
};

export type CreateProjectCoreInput = {
    projectName?: string;
    originalIdea?: string;
};

export type LearnFromAnswerInput = {
    field: BrainField;
    answer: string;
};

export function createProjectCore(
    input: CreateProjectCoreInput = {}
): ProjectCore {
    const now = new Date().toISOString();

    const projectName =
        input.projectName?.trim() || "Untitled Innovation";

    const originalIdea = input.originalIdea?.trim() || "";

    return {
        id: createId(),
        projectName,
        originalIdea,

        status: "new",
        brain: createEmptyInnovationBrain(),

        timeline: [
            createTimelineEvent(
                "project-created",
                "Project created",
                `${projectName} was created.`,
                now
            ),
        ],

        createdAt: now,
        updatedAt: now,
    };
}

export function learnFromAnswer(
    currentCore: ProjectCore,
    input: LearnFromAnswerInput
): ProjectCore {
    const cleanedAnswer = input.answer.trim();

    if (!cleanedAnswer) {
        return currentCore;
    }

    const now = new Date().toISOString();
    const previousNode = currentCore.brain[input.field];

    const updatedBrain = updateBrainWithAnswer(
        currentCore.brain,
        input.field,
        cleanedAnswer
    );

    const eventType: ProjectTimelineEventType =
        previousNode.completed
            ? "knowledge-updated"
            : "knowledge-added";

    const eventTitle = previousNode.completed
        ? `${previousNode.title} updated`
        : `${previousNode.title} learned`;

    const eventDescription = previousNode.completed
        ? `The Project updated its understanding of ${previousNode.title.toLowerCase()}.`
        : `The Project learned about ${previousNode.title.toLowerCase()}.`;

    const isComplete =
        updatedBrain.completedNodes === updatedBrain.totalNodes;

    const completionEvent =
        isComplete && currentCore.status !== "complete"
            ? [
                createTimelineEvent(
                    "interview-completed",
                    "Innovation Brain completed",
                    "The first Project-learning interview was completed.",
                    now
                ),
            ]
            : [];

    return {
        ...currentCore,

        status: isComplete ? "complete" : "learning",
        brain: updatedBrain,

        timeline: [
            ...currentCore.timeline,
            createTimelineEvent(
                eventType,
                eventTitle,
                eventDescription,
                now
            ),
            ...completionEvent,
        ],

        updatedAt: now,
    };
}

export function renameProject(
    currentCore: ProjectCore,
    projectName: string
): ProjectCore {
    const cleanedName = projectName.trim();

    if (!cleanedName) {
        return currentCore;
    }

    return {
        ...currentCore,
        projectName: cleanedName,
        updatedAt: new Date().toISOString(),
    };
}

export function updateOriginalIdea(
    currentCore: ProjectCore,
    originalIdea: string
): ProjectCore {
    return {
        ...currentCore,
        originalIdea: originalIdea.trim(),
        updatedAt: new Date().toISOString(),
    };
}

export function resetProjectCore(
    currentCore: ProjectCore
): ProjectCore {
    const now = new Date().toISOString();

    return {
        ...currentCore,

        status: "new",
        brain: createEmptyInnovationBrain(),

        timeline: [
            ...currentCore.timeline,
            createTimelineEvent(
                "project-reset",
                "Project learning reset",
                "Interview knowledge was reset for testing.",
                now
            ),
        ],

        updatedAt: now,
    };
}

export function getProjectSummary(core: ProjectCore) {
    return {
        projectId: core.id,
        projectName: core.projectName,
        status: core.status,

        completedKnowledge:
            core.brain.completedNodes,

        totalKnowledge:
            core.brain.totalNodes,

        progress:
            core.brain.progress,

        confidence:
            core.brain.aiConfidence,

        innovationScore:
            core.brain.innovationScore,

        timelineEvents:
            core.timeline.length,

        lastUpdated:
            core.updatedAt,
    };
}

function createTimelineEvent(
    type: ProjectTimelineEventType,
    title: string,
    description: string,
    createdAt: string
): ProjectTimelineEvent {
    return {
        id: createId(),
        type,
        title,
        description,
        createdAt,
    };
}

function createId(): string {
    if (
        typeof globalThis.crypto !== "undefined" &&
        typeof globalThis.crypto.randomUUID === "function"
    ) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}