import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import approvedPanoramicScene from "../../public/images/reaidea-home-panoramic-scene-candidate-corrected-2026-08-24.png";
import approvedRev from "../../public/images/reaidea-rev-friendly-ai-approved-2026-08-24.png";
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
          src={approvedPanoramicScene}
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.scenePlate}
          unoptimized
        />
        <div className={styles.sceneContrast} />
      </div>

      <div className={styles.energyPath} aria-hidden="true">
        <svg viewBox="0 0 1600 430" preserveAspectRatio="none" focusable="false">
          <defs>
            <filter id="home-energy-glow" x="-20%" y="-80%" width="140%" height="260%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            className={styles.energyHalo}
            d="M205 72 C236 65 254 82 281 79 L316 91 C341 102 357 84 382 111 L421 105 Q446 110 460 137 L498 128 C525 124 540 164 569 157 L609 171 Q626 177 635 204 L680 192 C702 188 713 227 741 224 L781 211 Q805 210 819 251 L859 243 C884 239 897 278 926 275 L966 263 Q991 264 1003 302 L1041 294 C1068 293 1075 321 1102 321 L1122 324"
          />
          <path
            className={styles.energyCore}
            d="M205 72 C236 65 254 82 281 79 L316 91 C341 102 357 84 382 111 L421 105 Q446 110 460 137 L498 128 C525 124 540 164 569 157 L609 171 Q626 177 635 204 L680 192 C702 188 713 227 741 224 L781 211 Q805 210 819 251 L859 243 C884 239 897 278 926 275 L966 263 Q991 264 1003 302 L1041 294 C1068 293 1075 321 1102 321 L1122 324"
          />
          <path
            className={styles.energyGold}
            d="M211 80 C240 73 255 88 280 86 L315 98 C341 109 359 91 383 118 L421 112 Q445 118 457 144 L499 135 C524 131 542 171 570 164 L608 178 Q626 184 632 211 L681 199 C702 195 715 234 742 231 L781 218 Q804 217 816 258 L860 250 C883 247 900 285 927 282 L966 270 Q989 272 1000 309 L1042 301 C1067 301 1078 328 1103 328 L1121 331"
          />
          <path className={styles.energyBranch} d="m420 105-18 17 4 13m-21-9 20-8m180 39-22 13 7 18m-29-8 22-10m158 24-17 18 3 17m-27-9 21-12m166 34-23 10 7 20m-29-9 23-10m164 16-13 17 10 13m-28-4 19-11" />
          <path className={styles.energyFilaments} d="M281 79C267 62 260 51 246 49c-10-1-13-10-23-7M382 111c-8-18-19-29-31-32-9-2-14-13-25-12M460 137c13-20 20-31 35-34 10-2 14-12 27-11M569 157c-8-18-17-28-30-31-10-2-14-12-25-12M680 192c13-19 24-28 38-28 10 0 17-11 28-10M819 251c-7-18-18-28-31-30-10-2-16-11-28-10M926 275c13-18 23-27 38-28 11 0 16-10 28-9M1003 302c-7-15-16-24-28-27-9-2-13-10-24-10M315 91c7 13 15 21 27 23 8 2 11 10 20 11M635 204c8 13 17 20 29 21 9 1 13 9 23 9" />
          <path className={styles.energyApproach} d="M1003 302 1041 294 C1068 293 1075 321 1102 321 L1122 324" />
          <circle className={styles.energyPalm} cx="1122" cy="324" r="13" />
        </svg>
      </div>

      <header className={styles.siteHeader}>
        <div className={styles.brandPlacement}>
          <ReAIdeaBrand />
          <p className={styles.tagline}>FROM IDEA TO EVIDENCE</p>
        </div>
        <nav className={styles.navigation} aria-label="Home navigation">
          <a href="#how-it-works">HOW IT WORKS</a>
          <a href="#what-rev-does">WHAT REV DOES</a>
          <Link href="/workshop">RETURNING PROJECT</Link>
        </nav>
      </header>

      <section id="how-it-works" className={styles.introduction} aria-labelledby="home-founder-message">
        <div className={styles.founderMessage}>
          <p className={styles.eyebrow}>YOUR AI ENGINEERING WORKSHOP</p>
          <h2 id="home-founder-message" className={styles.headline}>
            <span>YOUR IDEA.</span>
            <span>ONE CONVERSATION.</span>
            <span><b>A WORKSHOP</b> AWAITING YOUR INVENTION.</span>
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
      </section>

      <div id="what-rev-does" className={styles.revFigure}>
        <Image
          src={approvedRev}
          alt="REV, reAIdea’s friendly AI engineering partner, welcoming you to begin"
          sizes="(max-width: 680px) 45vw, (max-width: 1180px) 23vw, 21vw"
          loading="eager"
          className={styles.revImage}
        />
      </div>

      <div className={styles.formRegion}>{children}</div>
    </main>
  );
}
