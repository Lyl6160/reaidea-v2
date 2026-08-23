import styles from "./ReAIdeaBrand.module.css";

export default function ReAIdeaBrand() {
  return (
    <div className={styles.brand}>
      <span className={styles.screenReaderIdentity}>
        reAIdea. REV. Realize, Engineer, Validation. REV is AI.
      </span>
      <div
        className={styles.visualIdentity}
        aria-hidden="true"
        data-visual-wordmark="reAIdea"
        data-visual-expansion="ReAlize · Engineer · ValidatIon"
      >
        <p className={styles.wordmark}>
          <span className={styles.powder}>re</span>
          <span className={styles.ai}>AI</span>
          <span className={styles.powder}>dea</span>
        </p>
        <p className={styles.rev}>REV</p>
        <p className={styles.expansion}>
          <span className={styles.revInitial}>R</span>
          <span className={styles.powder}>e</span>
          <span className={styles.aiInitial}>A</span>
          <span className={styles.powder}>lize</span>
          <span className={styles.separator}> · </span>
          <span className={styles.revInitial}>E</span>
          <span className={styles.powder}>ngineer</span>
          <span className={styles.separator}> · </span>
          <span className={styles.revInitial}>V</span>
          <span className={styles.powder}>alidat</span>
          <span className={styles.aiInitial}>I</span>
          <span className={styles.powder}>on</span>
        </p>
      </div>
    </div>
  );
}
