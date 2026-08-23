import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import approvedScenePlate from "../../public/images/reaidea-home-approved-scene-plate-2026-08-23.png";
import ReAIdeaBrand from "./ReAIdeaBrand";
import styles from "./HomeVisualShell.module.css";

type HomeVisualShellProps = {
  children: ReactNode;
  className?: string;
};

export default function HomeVisualShell({ children, className }: HomeVisualShellProps) {
  const shellClassName = className
    ? `${styles.shell} ${className}`
    : styles.shell;

  return (
    <main className={shellClassName}>
      <div className={styles.scene} aria-hidden="true">
        <Image
          src={approvedScenePlate}
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.scenePlate}
          unoptimized
        />
        <div className={styles.sceneContrast} />
      </div>

      <header className={styles.siteHeader}>
        <div className={styles.brandPlacement}>
          <ReAIdeaBrand />
          <p className={styles.tagline}>FROM IDEA TO EVIDENCE</p>
        </div>
        <nav className={styles.navigation} aria-label="Home navigation">
          <a href="#what-rev-does">WHAT REV DOES</a>
          <Link href="/workshop">RETURNING PROJECT</Link>
        </nav>
      </header>

      <section className={styles.introduction} aria-labelledby="home-founder-message">
        <div className={styles.founderMessage}>
          <p className={styles.eyebrow}>YOUR AI ENGINEERING WORKSHOP</p>
          <h2 id="home-founder-message" className={styles.headline}>
            <span>YOUR IDEA.</span>
            <span>ONE CONVERSATION.</span>
            <span><b>A WORKSHOP</b> ALREADY WORKING.</span>
          </h2>
          <p className={styles.supportingCopy}>
            Describe your idea in plain language. REV will understand it,
            create the first visual concept and start the specialist work around it.
          </p>
          <ul className={styles.benefits} aria-label="How reAIdea works with you">
            <li>
              <span aria-hidden="true">
                <svg
                  className={styles.benefitIcon}
                  viewBox="0 0 32 32"
                  fill="none"
                  focusable="false"
                >
                  <path d="M7 7.5h18a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H15l-6 4v-4H7a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z" />
                  <path d="M10 13h12M10 17h8" />
                </svg>
              </span>
              NO TECHNICAL LANGUAGE
            </li>
            <li>
              <span aria-hidden="true">
                <svg
                  className={styles.benefitIcon}
                  viewBox="0 0 32 32"
                  fill="none"
                  focusable="false"
                >
                  <rect x="6" y="13" width="20" height="15" rx="2.5" />
                  <path d="M10 13V9a6 6 0 0 1 12 0v4M16 19v4" />
                </svg>
              </span>
              PRIVATE TO YOUR PROJECT
            </li>
            <li>
              <span aria-hidden="true">
                <svg
                  className={styles.benefitIcon}
                  viewBox="0 0 32 32"
                  fill="none"
                  focusable="false"
                >
                  <circle cx="16" cy="10" r="5" />
                  <path d="M6.5 28c.8-6.1 4-9.1 9.5-9.1s8.7 3 9.5 9.1" />
                </svg>
              </span>
              YOU MAKE THE DECISIONS
            </li>
          </ul>
        </div>

        <div className={styles.revClearance} aria-hidden="true" />

        <aside
          id="what-rev-does"
          className={styles.revPanel}
          aria-labelledby="rev-panel-title"
        >
          <h2 id="rev-panel-title">REV</h2>
          <p className={styles.screenReaderText}>Realize · Engineer · Validation</p>
          <p className={styles.revExpansion} aria-hidden="true">
            <b>R</b>e<span className={styles.aiLetter}>A</span>lize
            <span> · </span>
            <b>E</b>ngineer
            <span> · </span>
            <b>V</b>alidat<span className={styles.aiLetter}>I</span>on
          </p>
          <p className={styles.partner}>YOUR AI ENGINEERING PARTNER</p>
          <p className={styles.revInvitation}>
            Start wherever you are.<br />
            I’ll help shape what comes next.
          </p>
        </aside>
      </section>

      <div className={styles.formRegion}>{children}</div>
    </main>
  );
}
