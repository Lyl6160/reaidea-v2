"use client";

import Link from "next/link";

export default function InterviewPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d1a",
        color: "white",
        fontFamily: "Arial",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "850px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            marginBottom: "20px",
          }}
        >
          👋 Welcome to reAIdea
        </h1>

        <h2
          style={{
            color: "#00d4ff",
            fontWeight: 400,
            marginBottom: "40px",
          }}
        >
          Your AI Innovation Consultant
        </h2>

        <div
          style={{
            background: "#11182b",
            padding: "40px",
            borderRadius: "20px",
            border: "1px solid #24304d",
            textAlign: "left",
          }}
        >
          <h3>Hello Lyn.</h3>

          <p>
            I've created your innovation workspace and I'm ready to help you
            develop this idea into a commercial product.
          </p>

          <p>
            Before we begin I'll work with you to understand:
          </p>

          <ul
            style={{
              lineHeight: "2",
            }}
          >
            <li>✔ The real problem you're solving</li>
            <li>✔ Why existing solutions fall short</li>
            <li>✔ Your competitive advantage</li>
            <li>✔ Potential customers</li>
            <li>✔ Manufacturing considerations</li>
            <li>✔ Business opportunities</li>
            <li>✔ Intellectual property</li>
          </ul>

          <p
            style={{
              marginTop: "35px",
              color: "#00d4ff",
            }}
          >
            Estimated interview time:
            <strong> 15–20 minutes</strong>
          </p>

          <div
            style={{
              marginTop: "40px",
              textAlign: "center",
            }}
          >
            <Link
  href="/interview/session"
  style={{
    background: "#00d4ff",
    color: "#061018",
    padding: "18px 40px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "bold",
    marginRight: "20px",
  }}
>
  Begin Interview
</Link>

             <Link
  href="/dashboard"
  style={{
    color: "#00d4ff",
    textDecoration: "none",
  }}
>
  Return to Dashboard
</Link>
          </div>
        </div>
      </div>
    </main>
  );
}