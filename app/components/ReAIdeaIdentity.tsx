import styles from "./ReAIdeaIdentity.module.css";

type ReAIdeaIdentityProps = {
  className?: string;
};

export default function ReAIdeaIdentity({ className }: ReAIdeaIdentityProps) {
  const identityClassName = className
    ? `${styles.identity} ${className}`
    : styles.identity;

  return (
    <section
      className={identityClassName}
      aria-label="reAIdea — REV, AI Engineering Partner"
    >
      <p className={styles.wordmark} aria-label="reAIdea">
        <span aria-hidden="true">re</span>
        <span className={styles.ai} aria-hidden="true">AI</span>
        <span aria-hidden="true">dea</span>
      </p>
      <p className={styles.rev}>REV</p>
      <p className={styles.expansion}>
        <span className={styles.realise}>REALISE</span>
        <span className={styles.separator} aria-hidden="true">•</span>
        <span className={styles.engineer}>ENGINEER</span>
        <span className={styles.separator} aria-hidden="true">•</span>
        <span className={styles.validate}>VALIDATE</span>
      </p>
      <p className={styles.partner}>AI Engineering Partner</p>
    </section>
  );
}
