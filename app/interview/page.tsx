"use client";

import Link from "next/link";
import React from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  getProjectStorageSnapshot,
  getServerProjectStorageSnapshot,
  parseProjectSnapshot,
  saveProject,
  subscribeToProjectStorage,
} from "../lib/core/storageEngine";
import { loadInventor } from "../lib/core/inventorStorage";
import {
  recordKnowledgeEntry,
  getKnowledgeEntries,
  getCategoryLabel,
  type KnowledgeCategory,
} from "../lib/workshop/interviewModule";

const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  "problem",
  "customer",
  "existing-solutions",
  "competitive-advantage",
  "customer-outcome",
];

export default function InterviewPage() {
  const projectSnapshot = useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectStorageSnapshot,
    getServerProjectStorageSnapshot
  );
  const project = useMemo(
    () => parseProjectSnapshot(projectSnapshot),
    [projectSnapshot]
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [reviewCategory, setReviewCategory] = useState<KnowledgeCategory | null>(null);

  const inventor = loadInventor();

  if (!project) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Knowledge Interview</h1>
          <p style={styles.noProject}>
            No active project. Create or open a project to begin the knowledge interview.
          </p>
        </div>
      </div>
    );
  }

  const greeting = inventor?.preferredName
    ? `Good to have you here, ${inventor.preferredName}.`
    : "Good to have you here.";

  const knowledgeRecords = getKnowledgeEntries(project);
  const firstIncompleteIndex = KNOWLEDGE_CATEGORIES.findIndex(
    (category) => knowledgeRecords[category].entries.length === 0
  );
  const persistedCategoryIndex =
    firstIncompleteIndex === -1
      ? KNOWLEDGE_CATEGORIES.length
      : firstIncompleteIndex;
  const effectiveActiveCategoryIndex = Math.max(
    activeCategoryIndex,
    persistedCategoryIndex
  );

  const handleSubmit = (category: KnowledgeCategory, content: string): boolean => {
    const trimmed = content.trim();
    if (!trimmed) {
      return false;
    }

    const updated = recordKnowledgeEntry(project, {
      category,
      content: trimmed,
    });

    saveProject(updated);
    setActiveCategoryIndex((currentIndex) =>
      Math.min(
        Math.max(currentIndex, persistedCategoryIndex) + 1,
        KNOWLEDGE_CATEGORIES.length
      )
    );
    return true;
  };

  const activeCategory = KNOWLEDGE_CATEGORIES[effectiveActiveCategoryIndex];
  const interviewComplete =
    effectiveActiveCategoryIndex >= KNOWLEDGE_CATEGORIES.length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/workshop" style={styles.backToWorkshop}>
          ← Back to Workshop
        </Link>
        <h1>Knowledge Interview</h1>
        <p style={styles.greeting}>{greeting}</p>
        <p style={styles.description}>
          Share what you know about your project. Knowledge builds understanding.
        </p>
      </div>

      <div style={styles.interviewSection}>
        <div style={styles.progressCard}>
          <p style={styles.progressLabel}>Interview progress</p>
          <div style={styles.progressList}>
            {KNOWLEDGE_CATEGORIES.map((category, index) => {
              const status =
                index < effectiveActiveCategoryIndex
                  ? "Completed"
                  : index === effectiveActiveCategoryIndex && !interviewComplete
                    ? "Current"
                    : "Upcoming";

              return (
                <div key={category} style={styles.progressItem}>
                  <span style={styles.progressIndex}>{index + 1}</span>
                  <span style={styles.progressCategory}>{getCategoryLabel(category)}</span>
                  <span style={styles.progressStatus}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {interviewComplete ? (
          <>
            <div style={styles.completionCard}>
              <p style={styles.progressLabel}>Interview complete</p>
              <p style={styles.completionText}>
                The five approved knowledge areas have been recorded in the Project timeline.
              </p>
              <label style={styles.reviewLabel}>
                Review a recorded category
                <select
                  value={reviewCategory ?? ""}
                  onChange={(event) =>
                    setReviewCategory(
                      (event.currentTarget.value || null) as KnowledgeCategory | null
                    )
                  }
                  style={styles.reviewSelect}
                >
                  <option value="">Select a category</option>
                  {KNOWLEDGE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {reviewCategory && (
              <KnowledgeInputField
                key={reviewCategory}
                category={reviewCategory}
                knowledgeRecords={knowledgeRecords}
                onSubmit={(content) => handleSubmit(reviewCategory, content)}
              />
            )}
          </>
        ) : (
          <KnowledgeInputField
            category={activeCategory}
            knowledgeRecords={knowledgeRecords}
            onSubmit={(content) => handleSubmit(activeCategory, content)}
          />
        )}

        <KnowledgeHistory knowledgeRecords={knowledgeRecords} />
      </div>

      <div style={styles.continuationSection}>
        <h2>Next Steps</h2>
        <p>
          Knowledge you share here builds the Project&apos;s understanding. When you&apos;re ready:
        </p>
        <ul>
          <li>
            <strong>Discovery:</strong> Answer structured questions to clarify the core problem.
          </li>
          <li>
            <strong>Validation:</strong> Test your assumptions with evidence.
          </li>
          <li>
            <strong>Workshop:</strong> Explore concepts and decisions.
          </li>
        </ul>
        <p style={styles.note}>
          Interview and Discovery are optional and independent. Proceed at your own pace.
        </p>
      </div>
    </div>
  );
}

function KnowledgeInputField({
  category,
  knowledgeRecords,
  onSubmit,
}: {
  category: KnowledgeCategory;
  knowledgeRecords: ReturnType<typeof getKnowledgeEntries>;
  onSubmit: (content: string) => boolean;
}) {
  const [input, setInput] = React.useState("");
  const record = knowledgeRecords[category];
  const latestEntry = record.latest;

  const handleSubmit = () => {
    if (onSubmit(input)) {
      setInput("");
    }
  };

  const getPlaceholder = (cat: KnowledgeCategory): string => {
    const placeholders: Record<KnowledgeCategory, string> = {
      "problem": "Describe the problem or challenge you're addressing...",
      "customer": "Who is affected by this? What matters to them?",
      "existing-solutions": "What approaches already exist? What are their limitations?",
      "competitive-advantage": "What makes your approach different or better?",
      "customer-outcome": "What is the desired outcome for your customer?",
    };
    return placeholders[cat];
  };

  return (
    <div style={styles.fieldCard}>
      <div style={styles.fieldHeader}>
        <h3>{getCategoryLabel(category)}</h3>
        {latestEntry && (
          <div style={styles.badge}>
            recorded
          </div>
        )}
      </div>

      {latestEntry && (
        <div style={styles.recordedEntry}>
          <p style={styles.recordedLabel}>Current understanding:</p>
          <p style={styles.recordedText}>{latestEntry.description}</p>
          <p style={styles.recordedMeta}>
            Updated {formatDate(latestEntry.createdAt)}
          </p>
        </div>
      )}

      <div style={styles.inputGroup}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder={getPlaceholder(category)}
          style={styles.textarea}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          style={{
            ...styles.submitButton,
            opacity: input.trim() ? 1 : 0.5,
            cursor: input.trim() ? "pointer" : "not-allowed",
          }}
        >
          {latestEntry ? "Update" : "Record"} Knowledge
        </button>
      </div>

    </div>
  );
}

function KnowledgeHistory({
  knowledgeRecords,
}: {
  knowledgeRecords: ReturnType<typeof getKnowledgeEntries>;
}) {
  const entries = KNOWLEDGE_CATEGORIES.flatMap((category) =>
    knowledgeRecords[category].entries.map((entry) => ({ category, entry }))
  );

  return (
    <div style={styles.history}>
      <p style={styles.historyLabel}>Knowledge history ({entries.length} total)</p>
      {entries.length === 0 ? (
        <p style={styles.historyEmpty}>Recorded responses will remain available here.</p>
      ) : (
        <div style={styles.historyList}>
          {entries.map(({ category, entry }, index) => (
            <div key={entry.id} style={styles.historyItem}>
              <span style={styles.historyIndex}>#{index + 1}</span>
              <span style={styles.historyText}>
                <strong>{getCategoryLabel(category)}:</strong> {entry.description}
              </span>
              <span style={styles.historyDate}>{formatDate(entry.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return `today at ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#e3e8ef",
    backgroundColor: "#0b1320",
    minHeight: "100vh",
  } as const,

  header: {
    marginBottom: "40px",
  } as const,

  backToWorkshop: {
    display: "inline-block",
    marginBottom: "20px",
    padding: "10px 14px",
    border: "1px solid #2a7a92",
    borderRadius: "6px",
    color: "#7edff2",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
  } as const,

  greeting: {
    fontSize: "16px",
    color: "#a8b3c7",
    marginTop: "8px",
  } as const,

  noProject: {
    fontSize: "15px",
    color: "#8b94a5",
    marginTop: "12px",
    lineHeight: "1.6",
  } as const,

  description: {
    fontSize: "15px",
    color: "#8b94a5",
    marginTop: "12px",
    lineHeight: "1.6",
  } as const,

  interviewSection: {
    display: "grid",
    gap: "24px",
    marginBottom: "40px",
  } as const,

  progressCard: {
    backgroundColor: "#0f1829",
    border: "1px solid #1f3a4f",
    borderRadius: "8px",
    padding: "16px 20px",
  } as const,

  progressLabel: {
    fontSize: "12px",
    color: "#6b7a8f",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 12px",
  } as const,

  progressList: {
    display: "grid",
    gap: "8px",
  } as const,

  progressItem: {
    display: "grid",
    gridTemplateColumns: "28px 1fr auto",
    gap: "10px",
    alignItems: "center",
    fontSize: "14px",
    color: "#d4dce8",
  } as const,

  progressIndex: {
    color: "#6b7a8f",
    fontSize: "12px",
  } as const,

  progressCategory: {
    minWidth: 0,
  } as const,

  progressStatus: {
    color: "#8b94a5",
    fontSize: "12px",
  } as const,

  completionCard: {
    backgroundColor: "#0f1829",
    border: "1px solid #2d5a3d",
    borderRadius: "8px",
    padding: "20px",
  } as const,

  completionText: {
    margin: 0,
    color: "#d4dce8",
    lineHeight: "1.6",
  } as const,

  reviewLabel: {
    display: "grid",
    gap: "8px",
    marginTop: "20px",
    color: "#d4dce8",
    fontSize: "14px",
  } as const,

  reviewSelect: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#0a1018",
    border: "1px solid #1f3a4f",
    borderRadius: "6px",
    color: "#e3e8ef",
    fontFamily: "inherit",
    fontSize: "14px",
  } as const,

  fieldCard: {
    backgroundColor: "#0f1829",
    border: "1px solid #1f3a4f",
    borderRadius: "8px",
    padding: "20px",
  } as const,

  fieldHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  } as const,

  badge: {
    display: "inline-block",
    backgroundColor: "#1e3a2a",
    color: "#7fc97f",
    fontSize: "12px",
    padding: "4px 12px",
    borderRadius: "12px",
    border: "1px solid #2d5a3d",
  } as const,

  recordedEntry: {
    backgroundColor: "#0a1018",
    border: "1px solid #1a2f42",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "16px",
  } as const,

  recordedLabel: {
    fontSize: "12px",
    color: "#6b7a8f",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  } as const,

  recordedText: {
    fontSize: "15px",
    color: "#d4dce8",
    lineHeight: "1.6",
    margin: "0 0 8px 0",
  } as const,

  recordedMeta: {
    fontSize: "12px",
    color: "#6b7a8f",
    margin: "0",
  } as const,

  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  } as const,

  textarea: {
    minHeight: "100px",
    padding: "12px",
    backgroundColor: "#0a1018",
    border: "1px solid #1f3a4f",
    borderRadius: "6px",
    color: "#e3e8ef",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.5",
    resize: "vertical" as const,
  } as const,

  submitButton: {
    padding: "10px 16px",
    backgroundColor: "#1f5f6f",
    color: "#e3e8ef",
    border: "1px solid #2a7a92",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as const,

  history: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #1f3a4f",
  } as const,

  historyEmpty: {
    margin: 0,
    color: "#8b94a5",
    fontSize: "14px",
  } as const,

  historyLabel: {
    fontSize: "12px",
    color: "#6b7a8f",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  } as const,

  historyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  } as const,

  historyItem: {
    display: "grid",
    gridTemplateColumns: "40px 1fr 120px",
    gap: "12px",
    fontSize: "13px",
    padding: "8px",
    backgroundColor: "rgba(15, 24, 41, 0.5)",
    borderRadius: "4px",
    color: "#a8b3c7",
  } as const,

  historyIndex: {
    color: "#6b7a8f",
    fontSize: "11px",
  } as const,

  historyText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  } as const,

  historyDate: {
    fontSize: "11px",
    color: "#6b7a8f",
    textAlign: "right" as const,
  } as const,

  continuationSection: {
    backgroundColor: "#0f1829",
    border: "1px solid #1f3a4f",
    borderRadius: "8px",
    padding: "20px",
    marginTop: "40px",
  } as const,

  note: {
    fontSize: "13px",
    color: "#8b94a5",
    fontStyle: "italic",
    marginTop: "16px",
  } as const,
};
