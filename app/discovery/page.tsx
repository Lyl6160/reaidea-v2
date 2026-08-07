import Link from "next/link";

export default function DiscoveryPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d1a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "28px",
      }}
    >
      <section
        style={{
          width: "min(760px, 100%)",
          background: "#101827",
          border: "1px solid #243147",
          borderRadius: "18px",
          padding: "40px",
        }}
      >
        <p
          style={{
            color: "#00d4ff",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "12px",
          }}
        >
          Discovery Bench
        </p>

        <h1 style={{ fontSize: "42px", marginBottom: "14px" }}>
          Understand before evaluating.
        </h1>

        <p style={{ color: "#a8b3c7", lineHeight: 1.7, fontSize: "17px" }}>
          Discovery works from the Project&apos;s original observation, clarifies what is
          happening, identifies what remains uncertain, and chooses the next useful
          engineering step.
        </p>

        <div style={{ marginTop: "30px", display: "flex", gap: "18px", flexWrap: "wrap" }}>
          <Link
            href="/discovery/session"
            style={{
              background: "#00d4ff",
              color: "#061018",
              padding: "14px 24px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Open Discovery
          </Link>

          <Link href="/" style={{ color: "#00d4ff", alignSelf: "center" }}>
            Workshop Door
          </Link>
        </div>
      </section>
    </main>
  );
}
