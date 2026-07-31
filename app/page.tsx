"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const [idea, setIdea] = useState("");
const router = useRouter();
function startInnovation() {
  const cleanedIdea = idea.trim();

  if (!cleanedIdea) {
    alert("Please describe your idea first.");
    return;
  }

  localStorage.setItem("reaidea-current-idea", cleanedIdea);

  router.push("/dashboard");
}
  

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1020",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "64px",
            marginBottom: "8px",
          }}
        >
          re<span style={{ color: "#00d4ff" }}>AI</span>dea
        </h1>

        <h2
          style={{
            color: "#00d4ff",
            fontWeight: 400,
            marginBottom: "32px",
          }}
        >
          Where Ideas Become Innovations
        </h2>

        <textarea
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="Describe your invention..."
          style={{
            width: "100%",
            minHeight: "180px",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid #24304d",
            background: "#11182b",
            color: "white",
            fontSize: "18px",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={startInnovation}
          style={{
            marginTop: "24px",
            background: "#00d4ff",
            color: "#061018",
            padding: "18px 46px",
            fontSize: "20px",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Start My Innovation
        </button>
      </div>
    </main>
  );
}