import Link from "next/link";

export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d1a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px 24px",
      }}
    >
      <section style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#00d4ff", fontWeight: 800, letterSpacing: "0.08em" }}>
          ENGINEERING WORKSPACE
        </p>
        <h1 style={{ fontSize: "42px", marginBottom: "12px" }}>Project Workshop</h1>
        <p style={{ color: "#a8b3c7", lineHeight: 1.7, maxWidth: "680px" }}>
          The Project is the engineering truth. Workshop benches improve that same
          Project rather than creating separate copies of its knowledge.
        </p>

        <div
          style={{
            marginTop: "34px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          <Link href="/discovery/session" style={{ textDecoration: "none", color: "inherit" }}>
            <article
              style={{
                background: "#101827",
                border: "1px solid #2a3b53",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <p style={{ color: "#00d4ff", fontSize: "12px", fontWeight: 800 }}>READY</p>
              <h2>Discovery Bench</h2>
              <p style={{ color: "#a8b3c7", lineHeight: 1.6 }}>
                Improve understanding of the original observation before evaluating
                solutions.
              </p>
            </article>
          </Link>
        </div>

        <Link href="/" style={{ display: "inline-block", marginTop: "28px", color: "#00d4ff" }}>
          Create a new Project
        </Link>
      </section>
    </main>
  );
}
