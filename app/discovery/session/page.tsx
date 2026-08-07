"use client";

import { useEffect, useState } from "react";

import AnalysisPanel from "../../components/AnalysisPanel";
import CompletionCard from "../../components/CompletionCard";
import InnovationBrain from "../../components/InnovationBrain";
import QuestionCard from "../../components/QuestionCard";

import type { BrainField } from "../../lib/innovationBrain";

import {
  type ProjectCore,
  createProjectCore,
  learnFromAnswer,
  resetProjectCore,
} from "../../lib/core/projectCore";

import {
  loadProjectCore,
  saveProjectCore,
} from "../../lib/core/storageEngine";

type InterviewQuestion = {
  field: BrainField;
  mission: string;
  question: string;
};

const questions: InterviewQuestion[] = [
  {
    field: "problem",
    mission: "Understand the Problem",
    question:
      "What problem frustrates you enough that you decided to invent this product?",
  },
  {
    field: "customer",
    mission: "Understand the Customer",
    question: "Who experiences this problem the most?",
  },
  {
    field: "existingSolution",
    mission: "Understand Existing Solutions",
    question: "How are people solving this problem today?",
  },
  {
    field: "advantage",
    mission: "Identify the Advantage",
    question: "What makes your solution different?",
  },
  {
    field: "outcome",
    mission: "Define the Customer Outcome",
    question:
      "If your invention succeeds, what changes for the customer?",
  },
];

const analysisSteps = [
  "Understanding your answer...",
  "Identifying useful Project knowledge...",
  "Updating the reAI Core...",
  "Recalculating Project confidence...",
  "Saving the Project...",
  "Preparing the next mission...",
];

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function findFirstIncompleteQuestion(core: ProjectCore) {
  const incompleteIndex = questions.findIndex(
    (question) => !core.brain[question.field].completed
  );

  if (incompleteIndex === -1) {
    return questions.length - 1;
  }

  return incompleteIndex;
}

export default function InterviewSession() {
  const [projectCore, setProjectCore] =
    useState<ProjectCore | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedCore = loadProjectCore();

    setProjectCore(loadedCore);
    setCurrentQuestion(
      findFirstIncompleteQuestion(loadedCore)
    );
    setIsLoaded(true);
  }, []);

  if (!isLoaded || !projectCore) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#08101d",
          color: "white",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            className="loading-bulb"
            style={{
              fontSize: "64px",
              marginBottom: "18px",
            }}
          >
            💡
          </div>

          <p
            style={{
              color: "#00d4ff",
              fontSize: "18px",
            }}
          >
            Loading reAI Core...
          </p>

          <style jsx>{`
            .loading-bulb {
              animation: loadingPulse 1s ease-in-out infinite;
            }

            @keyframes loadingPulse {
              0%,
              100% {
                opacity: 0.45;
                transform: scale(0.96);
                filter: brightness(0.8);
              }

              50% {
                opacity: 1;
                transform: scale(1.08);
                filter: brightness(1.35)
                  drop-shadow(
                    0 0 24px rgba(255, 225, 0, 0.8)
                  );
              }
            }
          `}</style>
        </div>
      </main>
    );
  }

  const isComplete =
    projectCore.status === "complete" ||
    projectCore.brain.completedNodes ===
    projectCore.brain.totalNodes;

  const activeQuestion = questions[currentQuestion];

  async function nextQuestion() {
    if (
      !projectCore ||
      !activeQuestion ||
      !answer.trim() ||
      isAnalyzing ||
      isComplete
    ) {
      return;
    }

    setIsAnalyzing(true);

    for (const step of analysisSteps) {
      setAnalysisMessage(step);
      await wait(520);
    }

    const updatedCore = learnFromAnswer(projectCore, {
      field: activeQuestion.field,
      answer,
    });

    saveProjectCore(updatedCore);
    setProjectCore(updatedCore);
    setAnswer("");

    if (updatedCore.status !== "complete") {
      const nextIncompleteQuestion =
        findFirstIncompleteQuestion(updatedCore);

      setCurrentQuestion(nextIncompleteQuestion);
    }

    setAnalysisMessage("");
    setIsAnalyzing(false);
  }

  function restartInterview() {
    if (!projectCore) {
      const newCore = createProjectCore();

      saveProjectCore(newCore);
      setProjectCore(newCore);
    } else {
      const resetCore = resetProjectCore(projectCore);

      saveProjectCore(resetCore);
      setProjectCore(resetCore);
    }

    setCurrentQuestion(0);
    setAnswer("");
    setAnalysisMessage("");
    setIsAnalyzing(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08101d",
        color: "white",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
        }}
      >
        <InnovationBrain
          progress={projectCore.brain.progress}
          confidence={projectCore.brain.aiConfidence}
          isAnalyzing={isAnalyzing}
        />

        {!isComplete && activeQuestion && (
          <>
            <section
              style={{
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  color: "#00d4ff",
                  margin: "0 0 6px",
                  fontWeight: "bold",
                }}
              >
                Mission {currentQuestion + 1}
              </p>

              <p
                style={{
                  color: "#8fa4c4",
                  margin: 0,
                }}
              >
                {activeQuestion.mission}
              </p>
            </section>

            <AnalysisPanel
              isVisible={isAnalyzing}
              message={analysisMessage}
            />

            <QuestionCard
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              question={activeQuestion.question}
              answer={answer}
              isAnalyzing={isAnalyzing}
              onAnswerChange={setAnswer}
              onContinue={nextQuestion}
            />

            <section
              style={{
                marginTop: "22px",
                padding: "16px 20px",
                background: "#0d1728",
                border: "1px solid #1d3150",
                borderRadius: "12px",
                color: "#8fa4c4",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              <strong
                style={{
                  color: "#00d4ff",
                }}
              >
                reAI Core status
              </strong>

              <div
                style={{
                  marginTop: "7px",
                }}
              >
                Knowledge learned:{" "}
                {projectCore.brain.completedNodes} of{" "}
                {projectCore.brain.totalNodes}
              </div>

              <div>
                Timeline events:{" "}
                {projectCore.timeline.length}
              </div>

              <div>
                Project status: {projectCore.status}
              </div>
            </section>
          </>
        )}

        {isComplete && (
          <>
            <CompletionCard onRestart={restartInterview} />

            <section
              style={{
                marginTop: "24px",
                padding: "22px",
                background: "#0d1728",
                border: "1px solid #1d3150",
                borderRadius: "14px",
              }}
            >
              <h3
                style={{
                  color: "#00d4ff",
                  marginTop: 0,
                }}
              >
                reAI Core Summary
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "14px",
                }}
              >
                <SummaryItem
                  label="Knowledge"
                  value={`${projectCore.brain.progress}%`}
                />

                <SummaryItem
                  label="AI Confidence"
                  value={`${projectCore.brain.aiConfidence}%`}
                />

                <SummaryItem
                  label="Innovation Score"
                  value={`${projectCore.brain.innovationScore}%`}
                />

                <SummaryItem
                  label="Timeline Events"
                  value={String(projectCore.timeline.length)}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({
  label,
  value,
}: SummaryItemProps) {
  return (
    <div
      style={{
        background: "#11182b",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "#8fa4c4",
          fontSize: "14px",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "white",
          fontSize: "25px",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}