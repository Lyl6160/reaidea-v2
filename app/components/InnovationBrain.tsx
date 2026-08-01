"use client";

type InnovationBrainProps = {
  progress: number;
  confidence: number;
  isAnalyzing: boolean;
};

export default function InnovationBrain({
  progress,
  confidence,
  isAnalyzing,
}: InnovationBrainProps) {
  const clampedProgress = Math.min(100, Math.max(1, progress));
  const clampedConfidence = Math.min(100, Math.max(0, confidence));

  const bulbBrightness = 0.35 + clampedProgress / 100;
  const bulbGlow = Math.round(clampedProgress / 4);
  const bulbSaturation = Math.round(clampedProgress);

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          marginBottom: "30px",
        }}
      >
        <span
          className={isAnalyzing ? "brain-bulb brain-bulb-active" : "brain-bulb"}
          style={{
            fontSize: "54px",
            display: "inline-block",
            filter: `
              grayscale(${100 - bulbSaturation}%)
              brightness(${bulbBrightness})
              drop-shadow(
                0 0 ${bulbGlow}px
                rgba(255, 215, 0, ${clampedProgress / 100})
              )
            `,
            transform:
              clampedProgress === 100
                ? "scale(1.12)"
                : `rotate(${-5 + clampedProgress / 10}deg)`,
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
      </header>

      <section
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
            {isAnalyzing ? "Analysing" : "Active"}
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
          <span>{clampedProgress}% Complete</span>
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
              width: `${clampedProgress}%`,
              height: "100%",
              background:
                clampedProgress < 20
                  ? "#4a4638"
                  : clampedProgress < 40
                    ? "#7a642c"
                    : clampedProgress < 60
                      ? "#a97818"
                      : clampedProgress < 80
                        ? "#d6a600"
                        : clampedProgress < 100
                          ? "#f2cf00"
                          : "#fff200",
              boxShadow:
                clampedProgress < 20
                  ? "none"
                  : `0 0 ${Math.round(
                      clampedProgress / 3
                    )}px rgba(255, 225, 0, ${clampedProgress / 110})`,
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
          <span>{clampedConfidence}%</span>
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
              width: `${clampedConfidence}%`,
              height: "100%",
              background: "#7e6cff",
              boxShadow: "0 0 14px rgba(126, 108, 255, 0.55)",
              transition: "width 0.8s ease",
            }}
          />
        </div>
      </section>

      <style jsx>{`
        .brain-bulb {
          transition: filter 0.8s ease, transform 0.8s ease;
        }

        .brain-bulb-active {
          animation: bulbPulse 0.9s ease-in-out infinite;
        }

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

        @keyframes bulbPulse {
          0%,
          100% {
            scale: 1;
          }

          50% {
            scale: 1.12;
          }
        }
      `}</style>
    </>
  );
}