"use client";

type QuestionCardProps = {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  answer: string;
  isAnalyzing: boolean;
  onAnswerChange: (value: string) => void;
  onContinue: () => void;
};

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  answer,
  isAnalyzing,
  onAnswerChange,
  onContinue,
}: QuestionCardProps) {
  const canContinue = Boolean(answer.trim()) && !isAnalyzing;

  return (
    <section
      className="question-card"
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
        Question {questionNumber} of {totalQuestions}
      </p>

      <h2
        style={{
          lineHeight: 1.35,
        }}
      >
        {question}
      </h2>

      <textarea
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        disabled={isAnalyzing}
        placeholder="Describe your answer in as much detail as possible..."
        style={{
          boxSizing: "border-box",
          width: "100%",
          minHeight: "180px",
          marginTop: "25px",
          background: "#08101d",
          color: "white",
          border: "1px solid #2b3c61",
          borderRadius: "12px",
          padding: "18px",
          fontSize: "18px",
          resize: "vertical",
          opacity: isAnalyzing ? 0.65 : 1,
          outline: "none",
        }}
      />

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          marginTop: "30px",
          cursor: canContinue ? "pointer" : "not-allowed",
          background: canContinue ? "#00d4ff" : "#17233a",
          color: canContinue ? "#04101c" : "#70839d",
          border: "none",
          padding: "16px 36px",
          borderRadius: "10px",
          fontSize: "20px",
          fontWeight: "bold",
          transition:
            "background 0.25s ease, color 0.25s ease, transform 0.25s ease",
        }}
      >
        {isAnalyzing ? "Analysing..." : "Continue"}
      </button>

      <style jsx>{`
        .question-card {
          animation: questionFadeIn 0.45s ease-out;
        }

        @keyframes questionFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}