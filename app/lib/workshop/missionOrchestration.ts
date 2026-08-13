import type { Project } from "../core/project";
import type { DiscoveryQuestion } from "./discoveryReasoning";

/**
 * Mission Framework
 *
 * A Mission wraps a Discovery Question into the reAIdea mission structure:
 * - Mission Brief: What is this mission about?
 * - Why This Matters: Context for why REV is asking this now
 * - Your Assignment: What the inventor needs to do
 * - AI Reflection: What REV understands about the Project so far
 * - Mission Complete: Signal when answer is saved
 * - Next Mission: What follows this one
 *
 * This is a pure presentation wrapper around existing Discovery reasoning.
 * No changes to question selection, validation, or engineering state logic.
 */

export type Mission = {
    // Source question (unchanged)
    question: DiscoveryQuestion;

    // Mission framework components
    brief: string;
    whyItMatters: string;
    yourAssignment: string;
    aiReflection: string;
    nextMissionHint: string;

    // Project context for reflections
    projectState: {
        hasEvidence: boolean;
        evidenceCount: number;
        currentUnderstanding: string;
        currentConstraints: string[];
        currentAssumptions: string[];
        greatestRemainingUncertainty: string;
    };
};

/**
 * Convert a DiscoveryQuestion into a full Mission with context
 */
export function createMission(
    question: DiscoveryQuestion,
    project: Project
): Mission {
    const projectState = {
        hasEvidence: project.engineeringState.currentEvidence.length > 0,
        evidenceCount: project.engineeringState.currentEvidence.length,
        currentUnderstanding: project.engineeringState.currentUnderstanding,
        currentConstraints: project.engineeringState.currentConstraints,
        currentAssumptions: project.engineeringState.currentAssumptions,
        greatestRemainingUncertainty:
            project.engineeringState.greatestRemainingUncertainty,
    };

    return {
        question,
        brief: getMissionBrief(question),
        whyItMatters: getMissionWhy(question, projectState),
        yourAssignment: question.prompt,
        aiReflection: getMissionReflection(projectState),
        nextMissionHint: getMissionNextHint(question),
        projectState,
    };
}

/**
 * Mission Brief: Topic and high-level purpose
 */
function getMissionBrief(question: DiscoveryQuestion): string {
    return question.focusLabel;
}

/**
 * Why This Matters: Context for why REV is asking this now
 * Derives from question purpose + project state
 */
function getMissionWhy(
    question: DiscoveryQuestion,
    projectState: Mission["projectState"]
): string {
    const lines: string[] = [];

    // Primary reason from the question
    lines.push(question.purpose);

    // Add state-specific context
    if (question.focus === "evidence" && !projectState.hasEvidence) {
        lines.push(
            "The Project has not yet captured what has been measured or observed. This mission establishes what is currently known."
        );
    }

    if (question.focus === "constraints" && projectState.currentConstraints.length === 0) {
        lines.push(
            "Constraints identified early prevent later surprises in solution development."
        );
    }

    if (question.focus === "people" && projectState.currentConstraints.length === 0) {
        lines.push("Understanding who is affected most shapes all downstream decisions.");
    }

    return lines.join(" ");
}

/**
 * AI Reflection: What REV understands about the Project now
 * Shows state without inventing confidence
 */
function getMissionReflection(projectState: Mission["projectState"]): string {
    const parts: string[] = [];

    // Current understanding status
    if (projectState.currentUnderstanding) {
        parts.push(`**What REV understands:** ${projectState.currentUnderstanding}`);
    }

    // Evidence status
    if (projectState.evidenceCount > 0) {
        parts.push(
            `**Evidence gathered:** ${projectState.evidenceCount} piece${projectState.evidenceCount === 1 ? "" : "s"} of evidence recorded.`
        );
    } else {
        parts.push("**Evidence gathered:** None yet. This mission may help identify what exists.");
    }

    // Constraints
    if (projectState.currentConstraints.length > 0) {
        parts.push(
            `**Known constraints:** ${projectState.currentConstraints.length} constraint${projectState.currentConstraints.length === 1 ? "" : "s"} recorded.`
        );
    } else {
        parts.push("**Known constraints:** Not yet explored.");
    }

    // Assumptions
    if (projectState.currentAssumptions.length > 0) {
        parts.push(
            `**Assumptions noted:** ${projectState.currentAssumptions.length} assumption${projectState.currentAssumptions.length === 1 ? "" : "s"} identified for testing.`
        );
    } else {
        parts.push("**Assumptions noted:** None explicitly captured yet.");
    }

    // Greatest uncertainty
    if (projectState.greatestRemainingUncertainty) {
        parts.push(
            `**Greatest uncertainty:** ${projectState.greatestRemainingUncertainty}`
        );
    }

    return parts.join("\n\n");
}

/**
 * Next Mission Hint: What comes after this mission
 */
function getMissionNextHint(question: DiscoveryQuestion): string {
    return question.nextEngineeringStep;
}

/**
 * Strip markdown formatting from text for plain UI rendering
 */
export function stripMarkdownFormatting(text: string): string {
    return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * Mission Complete: Describes what happens when this mission is answered
 */
export function getMissionCompleteMessage(): string {
    return `When you submit your response, REV will update the Project's Engineering State with your answer and determine the next step. Your response becomes part of the Project's permanent record.`;
}

/**
 * Next Mission: Describes what follows this mission
 */
export function getNextMissionMessage(mission: Mission): string {
    return `After this mission is completed, the next mission will be determined by REV's discovery reasoning based on what remains uncertain in the Project. ${mission.nextMissionHint}`;
}

/**
 * Format Mission for UI rendering as markdown or structured text
 */
export function formatMissionForDisplay(mission: Mission): {
    brief: string;
    whyItMatters: string;
    yourAssignment: string;
    aiReflection: string;
    nextMissionHint: string;
} {
    return {
        brief: mission.brief,
        whyItMatters: mission.whyItMatters,
        yourAssignment: mission.yourAssignment,
        aiReflection: mission.aiReflection,
        nextMissionHint: mission.nextMissionHint,
    };
}
