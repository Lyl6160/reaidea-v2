import type {
  Project,
  ProjectTimelineEvent,
} from "../core/project";

/**
 * Knowledge Interview Module
 *
 * Captures structured knowledge input from the inventor.
 * Records knowledge as Project Timeline events.
 * Timeline is the single source of truth for all knowledge.
 *
 * No separate knowledge store is created.
 * Knowledge does not modify Engineering State.
 * Knowledge is distinct from validation evidence.
 */

export type KnowledgeCategory =
  | "problem"
  | "customer"
  | "existing-solutions"
  | "competitive-advantage"
  | "customer-outcome";

export type KnowledgeEntry = {
  category: KnowledgeCategory;
  content: string;
};

/**
 * Get human-readable label for a knowledge category
 */
export function getCategoryLabel(category: KnowledgeCategory): string {
  switch (category) {
    case "problem":
      return "Problem";
    case "customer":
      return "Customer";
    case "existing-solutions":
      return "Existing Solutions";
    case "competitive-advantage":
      return "Competitive Advantage";
    case "customer-outcome":
      return "Customer Outcome";
  }
}

/**
 * Record a knowledge entry into the Project timeline
 *
 * Creates a new ProjectTimelineEvent and returns updated Project.
 * Does not modify Engineering State or other Project fields.
 * Editing is handled by creating new events; original events are preserved.
 */
export function recordKnowledgeEntry(
  project: Project,
  entry: KnowledgeEntry
): Project {
  const cleanedContent = entry.content.trim();

  if (!cleanedContent) {
    return project;
  }

  const now = new Date().toISOString();
  const categoryLabel = getCategoryLabel(entry.category);

  const timelineEvent: ProjectTimelineEvent = {
    id: createId(),
    type: "knowledge-input-recorded",
    title: `Knowledge · ${categoryLabel}`,
    description: cleanedContent,
    subject: entry.category,
    createdAt: now,
  };

  return {
    ...project,
    timeline: [...project.timeline, timelineEvent],
    updatedAt: now,
  };
}

/**
 * Get all knowledge entries from the Project timeline
 *
 * Returns timeline events that are knowledge-input-recorded,
 * organized by category. Latest entry per category is at end of array.
 */
export function getKnowledgeEntries(project: Project): Record<
  KnowledgeCategory,
  {
    entries: ProjectTimelineEvent[];
    latest: ProjectTimelineEvent | null;
  }
> {
  const categories: KnowledgeCategory[] = [
    "problem",
    "customer",
    "existing-solutions",
    "competitive-advantage",
    "customer-outcome",
  ];

  const result: Record<
    KnowledgeCategory,
    {
      entries: ProjectTimelineEvent[];
      latest: ProjectTimelineEvent | null;
    }
  > = {} as Record<
    KnowledgeCategory,
    {
      entries: ProjectTimelineEvent[];
      latest: ProjectTimelineEvent | null;
    }
  >;

  for (const category of categories) {
    const entries = project.timeline.filter(
      (event) =>
        event.type === "knowledge-input-recorded" &&
        event.subject === category
    );

    result[category] = {
      entries,
      latest: entries.length > 0 ? entries[entries.length - 1] : null,
    };
  }

  return result;
}

/**
 * Get the most recent knowledge entry for a category
 */
export function getLatestKnowledgeEntry(
  project: Project,
  category: KnowledgeCategory
): ProjectTimelineEvent | null {
  const entries = project.timeline.filter(
    (event) =>
      event.type === "knowledge-input-recorded" &&
      event.subject === category
  );

  return entries.length > 0 ? entries[entries.length - 1] : null;
}

/**
 * Check if any knowledge has been recorded yet
 */
export function hasKnowledge(project: Project): boolean {
  return project.timeline.some(
    (event) => event.type === "knowledge-input-recorded"
  );
}

/**
 * Get count of knowledge entries
 */
export function getKnowledgeEntryCount(project: Project): number {
  return project.timeline.filter(
    (event) => event.type === "knowledge-input-recorded"
  ).length;
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
