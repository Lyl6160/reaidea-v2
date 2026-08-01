"use client";

type AnalysisPanelProps = {
  isVisible: boolean;
  message: string;
};

export default function AnalysisPanel({
  isVisible,
  message,
}: AnalysisPanelProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <section
      className="analysis-panel"
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
          margin: "10px 0 0",
          color: "#b6c9e2",
        }}
      >
        {message}
      </p>

      <style jsx>{`
        .analysis-panel {
          animation: panelFadeIn 0.3s ease-out;
        }

        @keyframes panelFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
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