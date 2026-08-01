"use client";

type CompletionCardProps = {
  onRestart: () => void;
};

export default function CompletionCard({
  onRestart,
}: CompletionCardProps) {
  return (
    <section
      className="completion-card"
      style={{
        background: "#11182b",
        border: "1px solid #f2cf00",
        borderRadius: "18px",
        padding: "40px",
        textAlign: "center",
        boxShadow: "0 0 35px rgba(255, 225, 0, 0.12)",
      }}
    >
      <div
        style={{
          fontSize: "72px",
          marginBottom: "12px",
        }}
      >
        💡
      </div>

      <h2
        style={{
          color: "#fff200",
          fontSize: "34px",
          marginBottom: "12px",
        }}
      >
        Innovation Brain Complete
      </h2>

      <p
        style={{
          color: "#b6c9e2",
          lineHeight: 1.6,
          marginBottom: "28px",
        }}
      >
        reAI has completed the first stage of understanding your invention.
      </p>

      <button
        type="button"
        onClick={onRestart}
        style={{
          background: "#00d4ff",
          color: "#04101c",
          border: "none",
          padding: "16px 36px",
          borderRadius: "10px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Restart Test Interview
      </button>

      <style jsx>{`
        .completion-card {
          animation: completionFadeIn 0.7s ease-out;
        }

        @keyframes completionFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}