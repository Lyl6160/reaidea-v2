"use client";

import type { Project } from "../lib/core/project";
import {
  HOME_UNDERSTANDING_STAGES,
  type ActiveHomeKnowledge,
  type ActiveHomeQuestion,
  type HomeEvidenceCoverage,
  type HomeUnderstandingState,
} from "../lib/workshop/homeUnderstanding";
import styles from "./HomeRevUnderstanding.module.css";

type HomeRevUnderstandingProps = {
  project: Project;
  state: HomeUnderstandingState;
  knowledge: ActiveHomeKnowledge[];
  coverage: HomeEvidenceCoverage;
  question: ActiveHomeQuestion | null;
  answer: string;
  selectedChoiceId: string;
  busy: boolean;
  error: string;
  notice: string;
  securedKnowledgeEventId: string | null;
  onAnswerChange: (value: string) => void;
  onChoiceChange: (choiceId: string) => void;
  onSubmitOwnWords: () => void;
  onSubmitChoice: () => void;
  onUseRecommendation: () => void;
  onRetry: () => void;
};

const stateLabels: Record<HomeUnderstandingState, string> = {
  IDEA_ENTRY: "WAITING FOR YOUR IDEA",
  SAFETY_CHECKING: "REV IS CHECKING THE CREATION BOUNDARY",
  REV_ANALYSING: "REV IS ORGANISING WHAT YOU TOLD ME",
  QUESTION_READY: "REV NEEDS ONE USEFUL DETAIL",
  ANSWER_RECORDING: "REV IS SECURING YOUR ANSWER",
  KNOWLEDGE_SECURED: "KNOWLEDGE SECURED",
  READY_TO_CREATE_3D: "READY TO CREATE 3D",
  SAFE_ERROR_OR_RETRY: "REV PAUSED SAFELY",
};

function factLabel(fact: ActiveHomeKnowledge): string {
  if (fact.authority === "rev-recommended") return "REV WORKING ASSUMPTION";
  if (fact.sourceKind === "semantic-derivation") return "VERIFIED FROM YOUR INFORMATION";
  if (fact.authority === "derived-support") return "SUPPORTING REFERENCE";
  return fact.sourceKind === "original-description" ? "FROM YOUR DESCRIPTION" : "YOUR ANSWER";
}

export default function HomeRevUnderstanding({
  project,
  state,
  knowledge,
  coverage,
  question,
  answer,
  selectedChoiceId,
  busy,
  error,
  notice,
  securedKnowledgeEventId,
  onAnswerChange,
  onChoiceChange,
  onSubmitOwnWords,
  onSubmitChoice,
  onUseRecommendation,
  onRetry,
}: HomeRevUnderstandingProps) {
  const displayedKnowledge = knowledge.slice(-5).reverse();

  return (
    <section className={styles.understanding} aria-labelledby="rev-understanding-heading" aria-busy={busy}>
      <p className={styles.liveState} role="status" aria-live="polite">{stateLabels[state]}</p>

      <header className={styles.heading}>
        <div>
          <p>REV UNDERSTANDING LOOP</p>
          <h2 id="rev-understanding-heading">WHAT REV UNDERSTANDS</h2>
        </div>
        <details className={styles.originalIdea}>
          <summary>VIEW WHAT I TOLD REV</summary>
          <p>{project.originalObservation}</p>
        </details>
      </header>

      <ol className={styles.meter} aria-label="REV 3D creation readiness">
        {HOME_UNDERSTANDING_STAGES.map((stage) => {
          const complete = coverage.completedStages.includes(stage);
          const current = coverage.currentStage === stage;
          return (
            <li key={stage} className={complete ? styles.complete : undefined} aria-current={current ? "step" : undefined}>
              <span aria-hidden="true" />
              <strong>{stage}</strong>
            </li>
          );
        })}
      </ol>

      <div className={styles.contentGrid}>
        <section className={styles.knowledgePanel} aria-label="Captured Project knowledge">
          <h3>CAPTURED PROJECT KNOWLEDGE</h3>
          {displayedKnowledge.length ? (
            <ul>
              {displayedKnowledge.map((fact) => (
                <li
                  key={fact.eventId}
                  className={fact.eventId === securedKnowledgeEventId ? styles.newFact : undefined}
                >
                  <span>{factLabel(fact)}</span>
                  <p>{fact.value}</p>
                  {fact.reversibleAssumption && <small>Reversible working assumption</small>}
                </li>
              ))}
            </ul>
          ) : <p className={styles.emptyKnowledge}>REV is organising the accepted Project information.</p>}
        </section>

        <section className={styles.questionPanel} aria-label="One useful REV question">
          {coverage.ready ? (
            <div className={styles.readyState}>
              <span>READY TO CREATE 3D</span>
              <h3>REV understands enough to create your first 3D concept.</h3>
              <p>This means the first representation is ready to begin—not that engineering, feasibility or validation is complete.</p>
            </div>
          ) : question ? (
            <>
              <p className={styles.questionEyebrow}>ONE USEFUL QUESTION</p>
              <h3>{question.prompt}</h3>
              {question.choices.length > 0 && (
                <fieldset className={styles.choices} disabled={busy}>
                  <legend className={styles.srOnly}>Choose one answer</legend>
                  {question.choices.map((choice) => (
                    <label key={choice.id}>
                      <input
                        type="radio"
                        name={`home-question-${question.eventId}`}
                        value={choice.id}
                        checked={selectedChoiceId === choice.id}
                        onChange={() => onChoiceChange(choice.id)}
                      />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                  <button type="button" onClick={onSubmitChoice} disabled={!selectedChoiceId || busy}>USE THIS ANSWER</button>
                </fieldset>
              )}
              <label className={styles.ownWords}>
                <span>OR ANSWER IN YOUR OWN WORDS</span>
                <textarea
                  value={answer}
                  onChange={(event) => onAnswerChange(event.target.value)}
                  disabled={busy}
                  rows={3}
                  maxLength={700}
                />
              </label>
              <div className={styles.actions}>
                <button type="button" onClick={onSubmitOwnWords} disabled={!answer.trim() || busy}>ADD THIS TO REV’S UNDERSTANDING</button>
                {question.recommendation && (
                  <button type="button" className={styles.recommend} onClick={onUseRecommendation} disabled={busy}>
                    {question.recommendation.label}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.analysing}>
              <span aria-hidden="true" />
              <h3>REV is organising the accepted Project information.</h3>
              <p>No concept, geometry or Workshop navigation begins in this understanding step.</p>
            </div>
          )}
          {error && (
            <div className={styles.safeError} role="alert">
              <p>{error}</p>
              <button type="button" onClick={onRetry} disabled={busy}>TRY THIS STEP AGAIN</button>
            </div>
          )}
          {notice && !error && <p className={styles.emptyKnowledge} role="status">{notice}</p>}
        </section>
      </div>
    </section>
  );
}
