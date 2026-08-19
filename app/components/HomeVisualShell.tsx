import Image from "next/image";
import type { ReactNode } from "react";

import homeAuthority from "../../public/images/reaidea-home-rev-engineer-approved-2026-08-18.png";
import ReAIdeaIdentity from "./ReAIdeaIdentity";
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
      <div className={styles.scene}>
        <Image
          src={homeAuthority}
          alt="REV, reAIdea’s wireframe AI Engineering Partner, welcoming the inventor into a bright engineering Workshop"
          fill
          preload
          sizes="100vw"
          className={styles.environment}
        />
        <div className={styles.sceneWash} aria-hidden="true" />
      </div>
      <div className={styles.identityPlacement}>
        <ReAIdeaIdentity />
      </div>
      <div className={styles.formRegion}>{children}</div>
    </main>
  );
}
