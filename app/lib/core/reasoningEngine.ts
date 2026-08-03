import { ProjectCore } from "./projectCore";

export type ReasoningResult = {
    learned: string[];
    missing: string[];
    nextObjective: string;
    confidenceComment: string;
    summary: string;
};

type KnowledgeCheck = {
    title: string;
    complete: boolean;
};

export function analyseProject(
    project: ProjectCore
): ReasoningResult {
    const checks: KnowledgeCheck[] = [
        {
            title: "Problem",
            complete: project.brain.problem.completed,
        },
        {
            title: "Customer",
            complete: project.brain.customer.completed,
        },
        {
            title: "Existing Solution",
            complete: project.brain.existingSolution.completed,
        },
        {
            title: "Competitive Advantage",
            complete: project.brain.advantage.completed,
        },
        {
            title: "Customer Outcome",
            complete: project.brain.outcome.completed,
        },
    ];

    const learned = checks
        .filter((c) => c.complete)
        .map((c) => c.title);

    const missing = checks
        .filter((c) => !c.complete)
        .map((c) => c.title);

    const nextObjective =
        missing.length > 0
            ? `Understand ${missing[0]}`
            : "Project Discovery Complete";

    let confidenceComment = "";

    const confidence = project.brain.aiConfidence;

    if (confidence < 25) {
        confidenceComment =
            "Project understanding is still very limited.";
    } else if (confidence < 50) {
        confidenceComment =
            "The Project is beginning to form a clear direction.";
    } else if (confidence < 75) {
        confidenceComment =
            "The invention is becoming well understood.";
    } else {
        confidenceComment =
            "The Project has a strong knowledge foundation.";
    }

    const summary =
        learned.length === 0
            ? "The Project has not yet learned enough to form conclusions."
            : `The Project currently understands ${learned.join(", ")}.`;

    return {
        learned,
        missing,
        nextObjective,
        confidenceComment,
        summary,
    };
}