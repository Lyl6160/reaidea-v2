"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [idea, setIdea] = useState("");

  useEffect(() => {
    const savedIdea = localStorage.getItem("reaidea-current-idea");
    setIdea(savedIdea || "Untitled Innovation");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d1a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "32px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto 40px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          re<span style={{ color: "#00d4ff" }}>AI</span>dea
        </h1>

        <Link
          href="/"
          style={{
            color: "#00d4ff",
            textDecoration: "none",
          }}
        >
          Create New Project
        </Link>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <p style={{ color: "#8b9bbb", marginBottom: "8px" }}>
          Innovation Workspace
        </p>

        <h2
          style={{
            fontSize: "40px",
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          {idea}
        </h2>

        <p
          style={{
            color: "#a8b3c7",
            maxWidth: "760px",
            lineHeight: 1.6,
            marginBottom: "36px",
          }}
        >
          Your project has been created. The next step is to develop the idea
          through the AI innovation interview.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          <Link href="/interview" style={{ textDecoration: "none", color: "inherit" }}>
  <DashboardCard
    title="AI Interview"
    description="Develop the idea through an intelligent guided interview."
    status="Ready"
  />
</Link>
        

          <DashboardCard
            title="Idea Summary"
            description="A structured summary of the problem, solution and opportunity."
            status="Coming Soon"
          />

          <DashboardCard
            title="Innovation Score"
            description="Evaluate market potential, uniqueness and feasibility."
            status="Coming Soon"
          />

          <DashboardCard
            title="Market Research"
            description="Explore customers, competitors and market demand."
            status="Coming Soon"
          />

          <DashboardCard
            title="Patent Research"
            description="Investigate prior art and intellectual-property direction."
            status="Coming Soon"
          />

          <DashboardCard
            title="Manufacturing"
            description="Develop materials, components, suppliers and production plans."
            status="Coming Soon"
          />

          <DashboardCard
            title="Investor Pack"
            description="Prepare reports, financials and a professional pitch."
            status="Coming Soon"
          />

          <DashboardCard
            title="Project Files"
            description="Store sketches, photos, documents and design revisions."
            status="Coming Soon"
          />
        </div>
      </section>
    </main>
  );
}

type DashboardCardProps = {
  title: string;
  description: string;
  status: string;
};

function DashboardCard({
  title,
  description,
  status,
}: DashboardCardProps) {
  return (
    <article
      style={{
        background: "#11182b",
        border: "1px solid #24304d",
        borderRadius: "18px",
        padding: "24px",
        minHeight: "170px",
      }}
    >
      <div
        style={{
          color: status === "Ready" ? "#00d4ff" : "#75819a",
          fontSize: "13px",
          fontWeight: 700,
          marginBottom: "16px",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {status}
      </div>

      <h3 style={{ fontSize: "22px", margin: "0 0 12px" }}>
        {title}
      </h3>

      <p
        style={{
          color: "#a8b3c7",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {description}
      </p>
    </article>
  );
}