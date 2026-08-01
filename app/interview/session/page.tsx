 "use client";

import { useState } from "react";
import AnalysisPanel from "../../components/AnalysisPanel";
import CompletionCard from "../../components/CompletionCard";
import InnovationBrain from "../../components/InnovationBrain";
import QuestionCard from "../../components/QuestionCard";

const questions = [
  {
    mission: "Understand the Problem",
    question:
      "What problem frustrates you enough that you decided to invent this product?",
  },
  {
    mission: "Understand the Customer",
    question: "Who experiences this problem the most?",
  },
  {
    mission: "Understand Existing Solutions",
    question: "How are people solving this problem today?",
  },
  {
    mission: "Identify the Advantage",
    question: "What makes your solution different?",
  },
  {
    mission: "Define the Customer Outcome",
    question:
      "If your invention succeeds, what changes for the customer?",
  },
];

const analysisSteps = [
  "Understanding your answer...",
  "Updating the Innovation Brain...",
  "Finding relationships...",
  "Searching for opportunities...",
  "Generating the next question...",
];

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export default function InterviewSession() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const progress = isComplete
    ? 100
    : Math.max(
        1,
        Math.round((answeredCount / questions.length) * 100)
      );

  const confidence = isComplete
    ? 92
    : Math.max(8, Math.round(progress * 0.72));

  async function nextQuestion() {
    const cleanedAnswer = answer.trim();

    if (!cleanedAnswer || isAnalyzing || isComplete) {
      return;
    }

    console.log("Answer:", cleanedAnswer);

    setIsAnalyzing(true);

    for (const step of analysisSteps) {
      setAnalysisMessage(step);
      await wait(650);
    }

    const newAnsweredCount = answeredCount + 1;

    setAnsweredCount(newAnsweredCount);
    setAnswer("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previousQuestion) => previousQuestion + 1);
    } else {
      setIsComplete(true);
    }

    setAnalysisMessage("");
    setIsAnalyzing(false);
  }

  function restartInterview() {
    setCurrentQuestion(0);
    setAnsweredCount(0);
    setAnswer("");
    setAnalysisMessage("");
    setIsAnalyzing(false);
    setIsComplete(false);
  }

  const activeQuestion = questions[currentQuestion];

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
          progress={progress}
          confidence={confidence}
          isAnalyzing={isAnalyzing}
        />

        {!isComplete && (
          <>
            <p
              style={{
                color: "#00d4ff",
                marginBottom: "6px",
              }}
            >
              Mission {currentQuestion + 1}
            </p>

            <p
              style={{
                color: "#8fa4c4",
                marginTop: 0,
                marginBottom: "20px",
              }}
            >
              {activeQuestion.mission}
            </p>

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
          </>
        )}

        {isComplete && (
          <CompletionCard onRestart={restartInterview} />
        )}
      </div>
    </main>
  );
}