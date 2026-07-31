"use client";

import { useState } from "react";

export default function InterviewSession() {
  const questions = [
    "What problem frustrates you enough that you decided to invent this product?",
    "Who experiences this problem the most?",
    "How are people solving this problem today?",
    "What makes your solution different?",
    "If your invention succeeds, what changes for the customer?",
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [analysisMessage, setAnalysisMessage] = useState("");
  const progress =
    questions.length === 1
      ? 100
      : Math.round(1 + (currentQuestion / (questions.length - 1)) * 99);

  const confidence = Math.max(8, Math.round(progress * 0.72));

  const bulbBrightness = 0.35 + progress / 100;
  const bulbGlow = Math.round(progress / 4);
  const bulbSaturation = Math.round(progress);

  function nextQuestion() {
    async function nextQuestion() {
  if (!answer.trim() || isAnalyzing) return;

  console.log("Answer:", answer);

  setIsAnalyzing(true);
  setAnalysisMessage("Understanding your answer...");

  await new Promise((resolve) => setTimeout(resolve, 800));

  setAnalysisMessage("Updating the Innovation Brain...");

  await new Promise((resolve) => setTimeout(resolve, 800));

  setAnalysisMessage("Generating the next question...");

  await new Promise((resolve) => setTimeout(resolve, 800));

  setAnswer("");

  if (currentQuestion < questions.length - 1) {
    setCurrentQuestion((previousQuestion) => previousQuestion + 1);
  } else {
    alert("Interview Complete!");
  }

  setAnalysisMessage("");
  setIsAnalyzing(false);
}

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08101d",
        color: "white",
        fontFamily: "Arial",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <span
            style={{
              fontSize: "54px",
              display: "inline-block",
              filter: `
                grayscale(${100 - bulbSaturation}%)
                brightness(${bulbBrightness})
                drop-shadow(
                  0 0 ${bulbGlow}px
                  rgba(255, 215, 0, ${progress / 100})
                )
              `,
              transform:
                progress === 100
                  ? "scale(1.12)"
                  : `rotate(${-5 + progress / 10}deg)`,
              transition: "filter 0.8s ease, transform 0.8s ease",
            }}
          >
            💡
          </span>

          <div>
            <h1
              style={{
                fontSize: "48px",
                margin: 0,
              }}
            >
              re<span style={{ color: "#00d4ff" }}>AI</span>
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                color: "#8fa4c4",
              }}
            >
              Innovation Consultant
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#0d1728",
            border: "1px solid #1d3150",
            borderRadius: "18px",
            padding: "26px",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "9px",
            }}
          >
            <span
              style={{
                color: "#00d4ff",
                fontWeight: "bold",
              }}
            >
              Idea Synthesis
            </span>

            <span
              style={{
                color: "#8fa4c4",
                fontSize: "14px",
              }}
            >
              Active
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#1d2b46",
              borderRadius: "20px",
              overflow: "hidden",
              marginBottom: "28px",
              position: "relative",
            }}
          >
            <div className="synthesis-scanner" />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              color: "#9bb5d6",
            }}
          >
            <span>Innovation Brain</span>
            <span>{progress}% Complete</span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#1d2b46",
              borderRadius: "20px",
              overflow: "hidden",
              marginBottom: "26px",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background:
                  progress < 20
                    ? "#4a4638"
                    : progress < 40
                    ? "#7a642c"
                    : progress < 60
                    ? "#a97818"
                    : progress < 80
                    ? "#d6a600"
                    : progress < 100
                    ? "#f2cf00"
                    : "#fff200",
                boxShadow:
                  progress < 20
                    ? "none"
                    : `0 0 ${Math.round(
                        progress / 3
                      )}px rgba(255, 225, 0, ${progress / 110})`,
                transition:
                  "width 0.8s ease, background 0.8s ease, box-shadow 0.8s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              color: "#9bb5d6",
            }}
          >
            <span>AI Confidence</span>
            <span>{confidence}%</span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#1d2b46",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${confidence}%`,
                height: "100%",
                background: "#7e6cff",
                boxShadow: "0 0 14px rgba(126, 108, 255, 0.55)",
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>

        <p
          style={{
            color: "#00d4ff",
            marginBottom: "6px",
          }}
        >
          Mission 1
          {isAnalyzing && (
  <div
    style={{
      background: "#0d1728",
      border: "1px solid #00d4ff",
      borderRadius: "14px",
      padding: "18px 22px",
      marginBottom: "25px",
      color: "#00d4ff",
      boxShadow: "0 0 20px rgba(0, 212, 255, 0.12)",
    }}
  >
    <strong>💡 Idea Synthesis</strong>

    <p
      style={{
        margin: "8px 0 0",
        color: "#b6c9e2",
      }}
    >
      {analysisMessage}
    </p>
  </div>
)}
        </p>

        <p
          style={{
            color: "#8fa4c4",
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Understand the Problem
        </p>

        <div
          style={{
            background: "#11182b",
            padding: "35px",
            borderRadius: "18px",
          }}
        >
          <p
            style={{
              color: "#8fa4c4",
              marginTop: 0,
            }}
          >
            Question {currentQuestion + 1} of {questions.length}
          </p>

          <h2>{questions[currentQuestion]}</h2>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Describe your answer in as much detail as possible..."
            style={{
              boxSizing: "border-box",
              width: "100%",
              height: "180px",
              marginTop: "25px",
              background: "#08101d",
              color: "white",
              border: "1px solid #2b3c61",
              borderRadius: "12px",
              padding: "18px",
              fontSize: "18px",
              resize: "vertical",
            }}
          />

          <button
            onClick={nextQuestion}
            disabled={!answer.trim() || isAnalyzing}
            style={{
              marginTop: "30px",
              cursor:
              answer.trim() && !isAnalyzing ? "pointer" : "not-allowed",
              color: answer.trim() ? "#04101c" : "#70839d",
              border: "none",
              padding: "16px 36px",
              borderRadius: "10px",
              fontSize: "20px",
              fontWeight: "bold",
            
              transition: "0.25s ease",
            }}
          >
            {isAnalyzing ? "Analysing..." : "Continue"}
          </button>
        </div>
      </div>
    <style jsx>{`
  .synthesis-scanner {
    width: 38%;
    height: 100%;
    border-radius: 20px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 212, 255, 0.35),
      #00d4ff,
      rgba(0, 212, 255, 0.35),
      transparent
    );
    box-shadow: 0 0 18px rgba(0, 212, 255, 0.8);
    animation: synthesisSweep 1.8s ease-in-out infinite;
  }

  @keyframes synthesisSweep {
    0% {
      transform: translateX(-110%);
      opacity: 0.35;
    }

    50% {
      opacity: 1;
    }

    100% {
      transform: translateX(270%);
      opacity: 0.35;
    }
  }
`}</style>
</main>
  );
}