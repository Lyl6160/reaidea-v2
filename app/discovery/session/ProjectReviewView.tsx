"use client";

import { type ChangeEvent, useState } from "react";

import type { Project, ValidationOutcome } from "../../lib/core/project";
import {
  loadProject,
  saveProject,
} from "../../lib/core/storageEngine";
import {
  completeValidationItem,
  startValidationItem,
} from "../../lib/workshop/validationExecution";
import { recordEngineeringConclusion } from "../../lib/workshop/engineeringConclusions";
import { recordEngineeringDirection } from "../../lib/workshop/engineeringDirections";
import { recordEngineeringAction } from "../../lib/workshop/engineeringActions";
import { recordEngineeringActionResult } from "../../lib/workshop/engineeringActionResults";
import { recordProjectEvidenceFromActionResult } from "../../lib/workshop/engineeringEvidence";
import { summarizeEngineeringTrace } from "../../lib/workshop/traceSummary";

type ProjectReviewViewProps = {
  project: Project;
  showValidationPlan?: boolean;
};

export default function ProjectReviewView({
  project,
  showValidationPlan = true,
}: ProjectReviewViewProps) {
  const plan = showValidationPlan ? project.validationPlan : null;
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [evidenceSource, setEvidenceSource] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [validationError, setValidationError] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [conclusionReason, setConclusionReason] = useState("");
  const [selectedConclusionEvidenceIds, setSelectedConclusionEvidenceIds] = useState<string[]>([]);
  const [supersedesConclusionId, setSupersedesConclusionId] = useState("");
  const [conclusionError, setConclusionError] = useState("");
  const [direction, setDirection] = useState("");
  const [directionReason, setDirectionReason] = useState("");
  const [selectedDirectionBasisIds, setSelectedDirectionBasisIds] = useState<string[]>([]);
  const [supersedesDirectionId, setSupersedesDirectionId] = useState("");
  const [directionError, setDirectionError] = useState("");
  const [action, setAction] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [selectedActionBasisIds, setSelectedActionBasisIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState("");
  const [actionResultActionId, setActionResultActionId] = useState("");
  const [actionResult, setActionResult] = useState("");
  const [actionResultError, setActionResultError] = useState("");
  const [evidenceActionResultEventId, setEvidenceActionResultEventId] = useState("");
  const [actionResultEvidenceSummary, setActionResultEvidenceSummary] = useState("");
  const [actionResultEvidenceSource, setActionResultEvidenceSource] = useState("");
  const [actionResultEvidenceError, setActionResultEvidenceError] = useState("");
  const inProgressItemId = plan?.items.find((item) => item.status === "in-progress")?.id ?? null;
  const [optimisticActiveItemId, setOptimisticActiveItemId] = useState<string | null>(null);
  const activeItemId = inProgressItemId ?? optimisticActiveItemId;

  const completedCount = plan?.items.filter(
    (item) => item.status === "completed"
  ).length ?? 0;
  const hasProjectEvidence = project.evidence.length > 0;
  const existingConclusions = project.decisions.filter(
    (decision) => decision.category === "engineering-conclusion"
  );
  const engineeringTrace = summarizeEngineeringTrace(project);
  const currentEngineeringConclusions = engineeringTrace.currentEngineeringConclusions;
  const currentEngineeringDirections = engineeringTrace.currentEngineeringDirections;
  const projectEvidenceCoverage = engineeringTrace.projectEvidence;
  const existingDirections = project.decisions.filter(
    (decision) => decision.category === "engineering-direction"
  );
  const adoptableActionResultEvents = project.timeline.filter(
    (event) =>
      event.type === "engineering-action-result-recorded" &&
      Boolean(event.engineeringActionId) &&
      Boolean(event.response?.trim()) &&
      project.engineeringActions.some(
        (engineeringAction) => engineeringAction.id === event.engineeringActionId
      )
  );
  const hasEngineeringReviewActivity =
    hasProjectEvidence ||
    currentEngineeringConclusions.length > 0 ||
    currentEngineeringDirections.length > 0 ||
    project.engineeringActions.length > 0 ||
    adoptableActionResultEvents.length > 0;

  if (!plan && !hasEngineeringReviewActivity) {
    return null;
  }

  function startItem(itemId: string) {
    const result = startValidationItem(project, itemId);

    if (result.status === "blocked") {
      setValidationError(result.reason);
      return;
    }

    if (result.status === "missing") {
      setValidationError("This validation activity could not be found.");
      return;
    }

    saveProject(result.project);
    setOptimisticActiveItemId(itemId);
    setEvidenceSummary("");
    setEvidenceSource("");
    setResultSummary("");
    setValidationError("");
  }

  function completeItem(itemId: string) {
    const missingFields = [
      !evidenceSummary.trim() ? "evidence gathered" : "",
      !evidenceSource.trim() ? "evidence source / reference" : "",
      !resultSummary.trim() ? "what the evidence showed" : "",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setValidationError(
        `Complete ${missingFields.join(", ")} before recording the validation result.`
      );
      return;
    }

    // Complete against the latest persisted Project rather than the render-time
    // snapshot. This prevents a just-started validation activity from being
    // treated as still planned if the UI render is one storage event behind.
    const latestProject = loadProject() ?? project;
    const result = completeValidationItem(latestProject, {
      itemId,
      evidenceSummary,
      evidenceSource,
      resultSummary,
    });

    if (result.status === "invalid") {
      setValidationError(result.reason);
      return;
    }

    if (result.status === "missing") {
      setValidationError("This validation activity could not be found.");
      return;
    }

    const nextItem = result.project.validationPlan?.items.find(
      (item) => item.status === "planned"
    );

    saveProject(result.project);
    setEvidenceSummary("");
    setEvidenceSource("");
    setResultSummary("");
    setOptimisticActiveItemId(null);
    setValidationError("");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const nextTarget = nextItem
          ? document.getElementById(`validation-${nextItem.id}`)
          : document.getElementById("validation-plan");

        nextTarget?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function toggleConclusionEvidence(evidenceId: string) {
    setSelectedConclusionEvidenceIds((selectedIds) =>
      selectedIds.includes(evidenceId)
        ? selectedIds.filter((id) => id !== evidenceId)
        : [...selectedIds, evidenceId]
    );
  }

  function recordConclusion() {
    if (!conclusion.trim()) {
      setConclusionError("Record a conclusion before saving it.");
      return;
    }

    const latestProject = loadProject() ?? project;
    const result = recordEngineeringConclusion(latestProject, {
      conclusion,
      reason: conclusionReason,
      supportingEvidenceIds: selectedConclusionEvidenceIds,
      ...(supersedesConclusionId
        ? { supersedesConclusionId }
        : {}),
    });

    if (result.status === "invalid") {
      setConclusionError(result.reason);
      return;
    }

    saveProject(result.project);
    setConclusion("");
    setConclusionReason("");
    setSelectedConclusionEvidenceIds([]);
    setSupersedesConclusionId("");
    setConclusionError("");
  }

  function toggleDirectionBasis(conclusionId: string) {
    setSelectedDirectionBasisIds((selectedIds) =>
      selectedIds.includes(conclusionId)
        ? selectedIds.filter((id) => id !== conclusionId)
        : [...selectedIds, conclusionId]
    );
  }

  function recordDirection() {
    if (!direction.trim() || selectedDirectionBasisIds.length === 0) {
      setDirectionError("Record a direction and select at least one current conclusion.");
      return;
    }

    const latestProject = loadProject() ?? project;
    const result = recordEngineeringDirection(latestProject, {
      direction,
      reason: directionReason,
      basisConclusionIds: selectedDirectionBasisIds,
      ...(supersedesDirectionId ? { supersedesDirectionId } : {}),
    });

    if (result.status === "invalid") {
      setDirectionError(result.reason);
      return;
    }

    saveProject(result.project);
    setDirection("");
    setDirectionReason("");
    setSelectedDirectionBasisIds([]);
    setSupersedesDirectionId("");
    setDirectionError("");
  }

  function toggleActionBasis(directionId: string) {
    setSelectedActionBasisIds((selectedIds) =>
      selectedIds.includes(directionId)
        ? selectedIds.filter((id) => id !== directionId)
        : [...selectedIds, directionId]
    );
  }

  function recordAction() {
    if (!action.trim() || selectedActionBasisIds.length === 0) {
      setActionError("Record an action and select at least one current engineering direction.");
      return;
    }

    const latestProject = loadProject() ?? project;
    const result = recordEngineeringAction(latestProject, {
      action,
      reason: actionReason,
      basisDirectionIds: selectedActionBasisIds,
    });

    if (result.status === "invalid") {
      setActionError(result.reason);
      return;
    }

    saveProject(result.project);
    setAction("");
    setActionReason("");
    setSelectedActionBasisIds([]);
    setActionError("");
  }

  function recordActionResult() {
    if (!actionResultActionId || !actionResult.trim()) {
      setActionResultError(
        "Select an adopted engineering action and record what happened before saving the result."
      );
      return;
    }

    const latestProject = loadProject() ?? project;
    const result = recordEngineeringActionResult(latestProject, {
      actionId: actionResultActionId,
      result: actionResult,
    });

    if (result.status === "invalid") {
      setActionResultError(result.reason);
      return;
    }

    saveProject(result.project);
    setActionResultActionId("");
    setActionResult("");
    setActionResultError("");
  }

  function recordActionResultEvidence() {
    if (
      !evidenceActionResultEventId ||
      !actionResultEvidenceSummary.trim() ||
      !actionResultEvidenceSource.trim()
    ) {
      setActionResultEvidenceError(
        "Select a recorded action result and explicitly record the evidence summary and source."
      );
      return;
    }

    const latestProject = loadProject() ?? project;
    const result = recordProjectEvidenceFromActionResult(latestProject, {
      actionResultEventId: evidenceActionResultEventId,
      summary: actionResultEvidenceSummary,
      source: actionResultEvidenceSource,
    });

    if (result.status === "invalid") {
      setActionResultEvidenceError(result.reason);
      return;
    }

    saveProject(result.project);
    setEvidenceActionResultEventId("");
    setActionResultEvidenceSummary("");
    setActionResultEvidenceSource("");
    setActionResultEvidenceError("");
  }

  return (
    <>
      {plan && (
        <section className="validation-plan" id="validation-plan">
          <div className="validation-heading">
        <div>
          <p className="validation-label">
            Validation Plan · {formatValidationStatus(plan.status)}
          </p>
          <h3>{plan.purpose}</h3>
        </div>
        <p className="validation-progress">
          {completedCount} / {plan.items.length} complete
        </p>
      </div>
      <p className="validation-plan-intro">
        Each activity must produce reviewable evidence and is allowed to confirm,
        refine or contradict the current Engineering State. REV records the result;
        it does not manufacture certainty.
      </p>

      {plan.status === "completed" && (
        <div className="validation-complete-note">
          <p className="validation-label">Initial Validation Cycle Complete</p>
          <p>
            Every planned activity has a recorded result. Review the Engineering State
            below before choosing the next development or validation action.
          </p>
        </div>
      )}

      {validationError && <p className="error">{validationError}</p>}

      <div className="validation-items">
        {plan.items.map((item, index) => (
          <article
            className="validation-item"
            id={`validation-${item.id}`}
            key={item.id}
          >
            <div className="validation-item-heading">
              <div>
                <p className="validation-label">Validation {index + 1}</p>
                <h4>{item.title}</h4>
              </div>
              <span className={`status-pill status-${item.status}`}>
                {formatValidationStatus(item.status)}
              </span>
            </div>
            <p><strong>Target:</strong> {item.target}</p>
            <p><strong>Method:</strong> {item.method}</p>
            <p><strong>Evidence needed:</strong> {item.evidenceNeeded}</p>
            <p><strong>Done when:</strong> {item.completionRule}</p>

            {item.status === "planned" && activeItemId !== item.id && (
              <button
                type="button"
                className="validation-action"
                onClick={() => startItem(item.id)}
              >
                Start Validation
              </button>
            )}

            {(item.status === "in-progress" || activeItemId === item.id) && (
              <section className="validation-execution">
                <p className="validation-label">Record Validation Evidence</p>

                <div className="validation-field validation-evidence-field">
                  <label htmlFor={`evidence-${item.id}`}>Evidence gathered</label>
                  <p className="validation-field-hint">
                    Record what you actually observed, measured, tested or independently reviewed.
                  </p>
                  <textarea
                    id={`evidence-${item.id}`}
                    className="validation-textarea evidence-textarea"
                    value={evidenceSummary}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                      setEvidenceSummary(event.target.value);
                      if (validationError) setValidationError("");
                    }}
                    placeholder="Type the evidence you actually gathered here — example text is not saved."
                  />
                </div>

                <div className="validation-field validation-source-field">
                  <label htmlFor={`source-${item.id}`}>Evidence source / reference</label>
                  <p className="validation-field-hint">
                    Identify where the evidence came from so it can be reviewed later.
                  </p>
                  <input
                    id={`source-${item.id}`}
                    className="validation-input"
                    value={evidenceSource}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setEvidenceSource(event.target.value);
                      if (validationError) setValidationError("");
                    }}
                    placeholder="Type the real source or reference here — example text is not saved."
                  />
                </div>

                <div className="validation-field validation-finding-field">
                  <label htmlFor={`result-${item.id}`}>What did the evidence show?</label>
                  <p className="validation-field-hint">
                    Type the finding here in your own words. REV will assess its effect on the Engineering State after you record it.
                  </p>
                  <textarea
                    id={`result-${item.id}`}
                    className="validation-textarea result-textarea"
                    value={resultSummary}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                      setResultSummary(event.target.value);
                      if (validationError) setValidationError("");
                    }}
                    placeholder="Type what the evidence actually showed here — example text is not saved."
                  />
                </div>

                <div className="validation-rev-assessment-note">
                  <p className="validation-label">REV Assessment</p>
                  <p>
                    You provide the evidence and describe what happened. REV will assess how
                    that evidence affects the current Engineering State when the result is
                    recorded. You can then review or challenge REV&apos;s interpretation.
                  </p>
                </div>

                {validationError && (
                  <p className="validation-form-error" role="alert">
                    {validationError}
                  </p>
                )}

                <button
                  type="button"
                  className="validation-action"
                  onClick={() => completeItem(item.id)}
                >
                  Record Validation Result
                </button>
              </section>
            )}

            {item.status === "completed" && (
              <section className="validation-result">
                <p className="validation-label">Recorded Result</p>
                <p><strong>Outcome:</strong> {formatValidationOutcome(item.outcome)}</p>
                <p><strong>Evidence:</strong> {item.evidenceSummary}</p>
                <p><strong>Source:</strong> {item.evidenceSource}</p>
                <p><strong>What it showed:</strong> {item.resultSummary}</p>
                {item.assessmentRationale && (
                  <p><strong>REV assessment:</strong> {item.assessmentRationale.replace(/^REV assessment:\s*/i, "")}</p>
                )}
              </section>
            )}
          </article>
        ))}
      </div>
        </section>
      )}

      {hasEngineeringReviewActivity && (
        <section className="engineering-review" aria-label="Engineering review">
          <p className="validation-label">Engineering Review</p>
          <p className="engineering-review-intro">
            Continue the inventor-owned engineering loop from recorded Project truth.
            This review remains available whether or not a formal Validation plan exists.
          </p>

      {hasProjectEvidence && (
        <>
          <section
            className="evidence-review-coverage"
            aria-label="Project evidence review coverage"
          >
            <p className="validation-label">Project Evidence Review Coverage</p>
            <p className="evidence-review-coverage-intro">
              Read-only trace of whether each recorded Project evidence item is
              explicitly selected as support by current or superseded Engineering
              Conclusions. It reports recorded selection only; it does not prove whether
              unselected evidence was read or reviewed, rank evidence, judge its
              importance or require another conclusion.
            </p>
            <div className="evidence-review-coverage-list">
              {projectEvidenceCoverage.map((evidence) => (
                <article key={evidence.evidenceId}>
                  <div>
                    <strong>{evidence.summary}</strong>
                    <small>{evidence.source}</small>
                  </div>
                  <span
                    className={
                      evidence.currentConclusionIds.length > 0
                        ? "coverage-referenced"
                        : evidence.supersededConclusionIds.length > 0
                          ? "coverage-historical"
                          : "coverage-unreferenced"
                    }
                  >
                    {evidence.currentConclusionIds.length > 0
                      ? `Explicitly selected by ${evidence.currentConclusionIds.length} current Engineering Conclusion${evidence.currentConclusionIds.length === 1 ? "" : "s"}.${evidence.supersededConclusionIds.length > 0 ? ` Also selected by ${evidence.supersededConclusionIds.length} superseded Engineering Conclusion${evidence.supersededConclusionIds.length === 1 ? "" : "s"}.` : ""}`
                      : evidence.supersededConclusionIds.length > 0
                        ? `Not explicitly selected by a current Engineering Conclusion. Previously selected by ${evidence.supersededConclusionIds.length} superseded Engineering Conclusion${evidence.supersededConclusionIds.length === 1 ? "" : "s"}.`
                        : "Never explicitly selected by an Engineering Conclusion."}
                  </span>
                </article>
              ))}
            </div>
          </section>

        <section className="engineering-conclusion" aria-label="Engineering conclusion">
          <p className="validation-label">Engineering Conclusion</p>
          <p>
            After reviewing recorded Project evidence, you may deliberately record what you conclude from the evidence you explicitly select. Project evidence may come from Validation or another inventor-adopted engineering source.
          </p>

          <div className="validation-field">
            <label htmlFor="engineering-conclusion">Conclusion</label>
            <textarea
              id="engineering-conclusion"
              className="validation-textarea"
              value={conclusion}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setConclusion(event.target.value);
                if (conclusionError) setConclusionError("");
              }}
              placeholder="Record your bounded engineering conclusion in your own words."
            />
          </div>

          <div className="validation-field">
            <label htmlFor="engineering-conclusion-reason">Reason</label>
            <textarea
              id="engineering-conclusion-reason"
              className="validation-textarea"
              value={conclusionReason}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setConclusionReason(event.target.value);
                if (conclusionError) setConclusionError("");
              }}
              placeholder="Optionally record why you reached this conclusion."
            />
          </div>

          <fieldset className="conclusion-evidence-selector">
            <legend>Supporting Project evidence (optional)</legend>
            {project.evidence.length === 0 ? (
              <p>No Project evidence recorded yet.</p>
            ) : (
              <div className="conclusion-evidence-options">
                {project.evidence.map((evidence) => (
                  <label key={evidence.id}>
                    <input
                      type="checkbox"
                      checked={selectedConclusionEvidenceIds.includes(evidence.id)}
                      onChange={() => toggleConclusionEvidence(evidence.id)}
                    />
                    <span>
                      <strong>{evidence.summary}</strong>
                      <small>
                        {evidence.source}
                        {evidence.validationOutcome && ` · ${evidence.validationOutcome}`}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {existingConclusions.length > 0 && (
            <label className="validation-field conclusion-supersession">
              <span>Supersedes previous conclusion (optional)</span>
              <select
                value={supersedesConclusionId}
                onChange={(event) => setSupersedesConclusionId(event.target.value)}
              >
                <option value="">Do not supersede a previous conclusion</option>
                {existingConclusions.map((decision) => (
                  <option key={decision.id} value={decision.id}>
                    {decision.decision}
                  </option>
                ))}
              </select>
            </label>
          )}

          {conclusionError && <p className="validation-form-error" role="alert">{conclusionError}</p>}

          <button
            type="button"
            className="validation-action"
            disabled={!conclusion.trim()}
            onClick={recordConclusion}
          >
            Record Engineering Conclusion
          </button>
        </section>
        </>
      )}

      {currentEngineeringConclusions.length > 0 && (
        <section className="engineering-direction" aria-label="Engineering direction">
          <p className="validation-label">Engineering Direction</p>
          <p>
            After reviewing current engineering conclusions, you may deliberately record the engineering course you choose to pursue next.
          </p>

          <div className="validation-field">
            <label htmlFor="engineering-direction">Direction</label>
            <textarea
              id="engineering-direction"
              className="validation-textarea"
              value={direction}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setDirection(event.target.value);
                if (directionError) setDirectionError("");
              }}
              placeholder="Record the engineering course you deliberately choose in your own words."
            />
          </div>

          <div className="validation-field">
            <label htmlFor="engineering-direction-reason">Reason</label>
            <textarea
              id="engineering-direction-reason"
              className="validation-textarea"
              value={directionReason}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setDirectionReason(event.target.value);
                if (directionError) setDirectionError("");
              }}
              placeholder="Optionally record why you chose this direction."
            />
          </div>

          <fieldset className="direction-basis-selector">
            <legend>Based on current conclusions</legend>
            <div className="direction-basis-options">
              {currentEngineeringConclusions.map((conclusion) => (
                <label key={conclusion.id}>
                  <input
                    type="checkbox"
                    checked={selectedDirectionBasisIds.includes(conclusion.id)}
                    onChange={() => toggleDirectionBasis(conclusion.id)}
                  />
                  <span>
                    <strong>{conclusion.conclusion}</strong>
                    {conclusion.reason && <small>{conclusion.reason}</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {existingDirections.length > 0 && (
            <label className="validation-field direction-supersession">
              <span>Supersedes previous direction (optional)</span>
              <select
                value={supersedesDirectionId}
                onChange={(event) => setSupersedesDirectionId(event.target.value)}
              >
                <option value="">Do not supersede a previous direction</option>
                {existingDirections.map((existingDirection) => (
                  <option key={existingDirection.id} value={existingDirection.id}>
                    {existingDirection.decision}
                  </option>
                ))}
              </select>
            </label>
          )}

          {directionError && <p className="validation-form-error" role="alert">{directionError}</p>}

          <button
            type="button"
            className="validation-action"
            disabled={!direction.trim() || selectedDirectionBasisIds.length === 0}
            onClick={recordDirection}
          >
            Record Engineering Direction
          </button>
        </section>
      )}

      {currentEngineeringDirections.length > 0 && (
        <section className="engineering-action" aria-label="Engineering action">
          <p className="validation-label">Engineering Action</p>
          <p>
            Based on the current engineering directions you select, you may deliberately adopt a concrete engineering action.
          </p>

          <div className="validation-field">
            <label htmlFor="engineering-action">Action</label>
            <textarea
              id="engineering-action"
              className="validation-textarea"
              value={action}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setAction(event.target.value);
                if (actionError) setActionError("");
              }}
              placeholder="Record the concrete engineering action you deliberately adopt."
            />
          </div>

          <div className="validation-field">
            <label htmlFor="engineering-action-reason">Reason</label>
            <textarea
              id="engineering-action-reason"
              className="validation-textarea"
              value={actionReason}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setActionReason(event.target.value);
                if (actionError) setActionError("");
              }}
              placeholder="Optionally record why you adopted this action."
            />
          </div>

          <fieldset className="action-basis-selector">
            <legend>Based on current engineering directions</legend>
            <div className="action-basis-options">
              {currentEngineeringDirections.map((direction) => (
                <label key={direction.id}>
                  <input
                    type="checkbox"
                    checked={selectedActionBasisIds.includes(direction.id)}
                    onChange={() => toggleActionBasis(direction.id)}
                  />
                  <span>
                    <strong>{direction.direction}</strong>
                    {direction.reason && <small>{direction.reason}</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {actionError && <p className="validation-form-error" role="alert">{actionError}</p>}

          <button
            type="button"
            className="validation-action"
            disabled={!action.trim() || selectedActionBasisIds.length === 0}
            onClick={recordAction}
          >
            Adopt Engineering Action
          </button>
        </section>
      )}

      {project.engineeringActions.length > 0 && (
        <section
          className="engineering-action-result"
          aria-label="Engineering action result"
        >
          <p className="validation-label">Engineering Action Result</p>
          <p>
            Record what actually happened while undertaking an adopted engineering action.
            This records engineering history only and does not mark the action complete.
          </p>

          <div className="validation-field">
            <label htmlFor="engineering-action-result-action">Adopted engineering action</label>
            <select
              id="engineering-action-result-action"
              className="engineering-action-result-select"
              value={actionResultActionId}
              onChange={(event) => {
                setActionResultActionId(event.target.value);
                if (actionResultError) setActionResultError("");
              }}
            >
              <option value="">Select an adopted engineering action</option>
              {project.engineeringActions.map((engineeringAction) => (
                <option key={engineeringAction.id} value={engineeringAction.id}>
                  {engineeringAction.action}
                </option>
              ))}
            </select>
          </div>

          <div className="validation-field">
            <label htmlFor="engineering-action-result">What happened?</label>
            <textarea
              id="engineering-action-result"
              className="validation-textarea"
              value={actionResult}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setActionResult(event.target.value);
                if (actionResultError) setActionResultError("");
              }}
              placeholder="Record what actually happened while undertaking this adopted action."
            />
          </div>

          {actionResultError && (
            <p className="validation-form-error" role="alert">
              {actionResultError}
            </p>
          )}

          <button
            type="button"
            className="validation-action"
            disabled={!actionResultActionId || !actionResult.trim()}
            onClick={recordActionResult}
          >
            Record Engineering Action Result
          </button>
        </section>
      )}


      {adoptableActionResultEvents.length > 0 && (
        <section
          className="engineering-action-evidence"
          aria-label="Adopt project evidence from action result"
        >
          <p className="validation-label">Adopt Project Evidence</p>
          <p>
            Explicitly adopt a recorded engineering action result as Project evidence.
            A result does not become evidence automatically.
          </p>

          <div className="validation-field">
            <label htmlFor="action-result-evidence-result">Recorded engineering action result</label>
            <select
              id="action-result-evidence-result"
              className="engineering-action-result-select"
              value={evidenceActionResultEventId}
              onChange={(event) => {
                setEvidenceActionResultEventId(event.target.value);
                if (actionResultEvidenceError) setActionResultEvidenceError("");
              }}
            >
              <option value="">Select a recorded engineering action result</option>
              {adoptableActionResultEvents.map((resultEvent) => {
                const engineeringAction = project.engineeringActions.find(
                  (action) => action.id === resultEvent.engineeringActionId
                );

                return (
                  <option key={resultEvent.id} value={resultEvent.id}>
                    {engineeringAction?.action}: {resultEvent.response}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="validation-field">
            <label htmlFor="action-result-evidence-summary">Evidence summary</label>
            <textarea
              id="action-result-evidence-summary"
              className="validation-textarea"
              value={actionResultEvidenceSummary}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                setActionResultEvidenceSummary(event.target.value);
                if (actionResultEvidenceError) setActionResultEvidenceError("");
              }}
              placeholder="Record the evidence you explicitly adopt from this result."
            />
          </div>

          <div className="validation-field">
            <label htmlFor="action-result-evidence-source">Evidence source / reference</label>
            <input
              id="action-result-evidence-source"
              value={actionResultEvidenceSource}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setActionResultEvidenceSource(event.target.value);
                if (actionResultEvidenceError) setActionResultEvidenceError("");
              }}
              placeholder="Record the source or reference for this evidence."
            />
          </div>

          {actionResultEvidenceError && (
            <p className="validation-form-error" role="alert">
              {actionResultEvidenceError}
            </p>
          )}

          <button
            type="button"
            className="validation-action"
            disabled={
              !evidenceActionResultEventId ||
              !actionResultEvidenceSummary.trim() ||
              !actionResultEvidenceSource.trim()
            }
            onClick={recordActionResultEvidence}
          >
            Adopt as Project Evidence
          </button>
        </section>
      )}
        </section>
      )}

      <style jsx>{`
        .validation-plan,
        .engineering-review {
          margin-top: 22px;
          padding: 20px;
          background: #0b1320;
          border: 1px solid #27435a;
          border-radius: 12px;
        }

        .engineering-review-intro {
          margin: 0 0 4px;
          color: #a8b3c7;
          line-height: 1.65;
        }

        .validation-heading,
        .validation-item-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .validation-label {
          margin: 0 0 8px;
          color: #00d4ff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .validation-progress {
          margin: 0;
          color: #8fa0b6;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        h3 {
          margin: 4px 0 10px;
          font-size: 21px;
        }

        .validation-plan-intro,
        .validation-complete-note p {
          color: #a8b3c7;
          line-height: 1.65;
        }

        .validation-complete-note {
          margin-top: 18px;
          padding: 16px;
          background: #0c1b1a;
          border: 1px solid #27514d;
          border-radius: 10px;
        }

        .validation-complete-note p:last-child {
          margin-bottom: 0;
        }

        .evidence-review-coverage {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid rgba(103, 132, 155, 0.42);
          border-radius: 9px;
          background: rgba(20, 31, 46, 0.46);
        }

        .evidence-review-coverage-intro {
          margin: 0 0 12px;
          color: #aebdca;
          font-size: 13px;
          line-height: 1.5;
        }

        .evidence-review-coverage-list {
          display: grid;
          gap: 8px;
        }

        .evidence-review-coverage-list article {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 10px;
          border: 1px solid rgba(103, 132, 155, 0.24);
          border-radius: 7px;
          background: rgba(7, 17, 29, 0.5);
        }

        .evidence-review-coverage-list strong,
        .evidence-review-coverage-list small {
          display: block;
        }

        .evidence-review-coverage-list strong {
          color: #e1eaf2;
          font-size: 12px;
        }

        .evidence-review-coverage-list small {
          margin-top: 3px;
          color: #91a3b4;
          font-size: 11px;
        }

        .evidence-review-coverage-list span {
          max-width: 310px;
          font-size: 11px;
          line-height: 1.4;
          text-align: right;
        }

        .coverage-referenced {
          color: #8ed9c4;
        }

        .coverage-historical {
          color: #d7c58f;
        }

        .coverage-unreferenced {
          color: #b7c1ce;
        }

        .engineering-conclusion {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid rgba(101, 184, 198, 0.4);
          border-radius: 9px;
          background: rgba(11, 38, 48, 0.42);
        }

        .engineering-conclusion > p:not(.validation-label) {
          margin: 0 0 14px;
          color: #b3c6cd;
          font-size: 13px;
          line-height: 1.5;
        }

        .engineering-direction {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid rgba(196, 163, 94, 0.46);
          border-radius: 9px;
          background: rgba(48, 37, 14, 0.26);
        }

        .engineering-direction > p:not(.validation-label) {
          margin: 0 0 14px;
          color: #c9c0a5;
          font-size: 13px;
          line-height: 1.5;
        }

        .engineering-action {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid rgba(108, 178, 118, 0.46);
          border-radius: 9px;
          background: rgba(21, 49, 27, 0.28);
        }

        .engineering-action > p:not(.validation-label) {
          margin: 0 0 14px;
          color: #b5cbb7;
          font-size: 13px;
          line-height: 1.5;
        }

        .engineering-action-result {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid rgba(93, 151, 165, 0.46);
          border-radius: 9px;
          background: rgba(16, 44, 52, 0.28);
        }

        .engineering-action-result > p:not(.validation-label) {
          margin: 0 0 14px;
          color: #aec8ce;
          font-size: 13px;
          line-height: 1.5;
        }

        .engineering-action-result-select {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-top: 7px;
          padding: 10px;
          border: 1px solid #38566a;
          border-radius: 6px;
          background: #0a1821;
          color: #e1edf0;
          font: inherit;
        }

        .engineering-action-evidence {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid rgba(178, 151, 86, 0.46);
          border-radius: 9px;
          background: rgba(54, 42, 15, 0.24);
        }

        .engineering-action-evidence > p:not(.validation-label) {
          margin: 0 0 14px;
          color: #d0c39e;
          font-size: 13px;
          line-height: 1.5;
        }

        .conclusion-evidence-selector {
          margin: 14px 0;
          padding: 11px;
          border: 1px solid rgba(100, 139, 150, 0.35);
          border-radius: 7px;
        }

        .conclusion-evidence-selector legend,
        .conclusion-supersession > span,
        .direction-supersession > span,
        .direction-basis-selector legend,
        .action-basis-selector legend {
          padding: 0 4px;
          color: #8fd5df;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .action-basis-selector {
          margin: 14px 0;
          padding: 11px;
          border: 1px solid rgba(89, 154, 100, 0.42);
          border-radius: 7px;
        }

        .action-basis-options {
          display: grid;
          gap: 7px;
        }

        .action-basis-options label {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 8px;
          border: 1px solid rgba(89, 154, 100, 0.28);
          border-radius: 6px;
          cursor: pointer;
        }

        .action-basis-options input {
          margin-top: 3px;
          accent-color: #72c982;
        }

        .action-basis-options strong,
        .action-basis-options small {
          display: block;
        }

        .action-basis-options strong {
          color: #e0f0e2;
          font-size: 12px;
        }

        .action-basis-options small {
          margin-top: 3px;
          color: #a8c5ac;
          font-size: 11px;
        }

        .direction-basis-selector {
          margin: 14px 0;
          padding: 11px;
          border: 1px solid rgba(162, 134, 73, 0.4);
          border-radius: 7px;
        }

        .direction-basis-options {
          display: grid;
          gap: 7px;
        }

        .direction-basis-options label {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 8px;
          border: 1px solid rgba(162, 134, 73, 0.28);
          border-radius: 6px;
          cursor: pointer;
        }

        .direction-basis-options input {
          margin-top: 3px;
          accent-color: #d3ad59;
        }

        .direction-basis-options strong,
        .direction-basis-options small {
          display: block;
        }

        .direction-basis-options strong {
          color: #eee5ca;
          font-size: 12px;
        }

        .direction-basis-options small {
          margin-top: 3px;
          color: #b9ab88;
          font-size: 11px;
        }

        .conclusion-evidence-selector > p {
          margin: 0;
          color: #9fb2b9;
          font-size: 12px;
        }

        .conclusion-evidence-options {
          display: grid;
          gap: 7px;
        }

        .conclusion-evidence-options label {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 8px;
          border: 1px solid rgba(100, 139, 150, 0.26);
          border-radius: 6px;
          cursor: pointer;
        }

        .conclusion-evidence-options input {
          margin-top: 3px;
          accent-color: #54c8d5;
        }

        .conclusion-evidence-options strong,
        .conclusion-evidence-options small {
          display: block;
        }

        .conclusion-evidence-options strong {
          color: #e1edf0;
          font-size: 12px;
        }

        .conclusion-evidence-options small {
          margin-top: 3px;
          color: #96acb4;
          font-size: 11px;
        }

        .conclusion-supersession select,
        .direction-supersession select {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-top: 7px;
          padding: 10px;
          border: 1px solid #38566a;
          border-radius: 6px;
          background: #0a1821;
          color: #e1edf0;
          font: inherit;
        }

        .validation-items {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .validation-item {
          background: #08101d;
          border: 1px solid #22334a;
          border-radius: 10px;
          padding: 16px;
        }

        .validation-item h4 {
          margin: 0 0 8px;
          font-size: 17px;
        }

        .validation-item p,
        .validation-result p {
          margin: 7px 0 0;
          color: #a8b3c7;
          line-height: 1.55;
        }

        .validation-item strong,
        .validation-result strong {
          color: #dfe8f4;
        }

        .status-pill {
          display: inline-block;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .status-planned {
          color: #a8b3c7;
          background: #172131;
          border: 1px solid #2a3b53;
        }

        .status-in-progress {
          color: #ffe08a;
          background: #2a2413;
          border: 1px solid #55481d;
        }

        .status-completed {
          color: #8ee8d6;
          background: #102521;
          border: 1px solid #28574e;
        }

        .validation-rev-assessment-note {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid #28574e;
          border-radius: 9px;
          background: #0c1b1a;
        }

        .validation-rev-assessment-note p:last-child {
          margin-bottom: 0;
          color: #a8b3c7;
          line-height: 1.55;
        }

        .validation-form-error {
          margin: 14px 0 0 !important;
          padding: 10px 12px;
          border: 1px solid #7a3d48;
          border-radius: 8px;
          background: #28131a;
          color: #ffb4b4 !important;
          font-size: 13px;
          line-height: 1.5 !important;
        }

        .validation-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          margin-top: 16px;
          padding: 0 16px;
          border: 1px solid #00d4ff;
          border-radius: 8px;
          background: #00d4ff;
          color: #00131a;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.08);
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }

        .validation-action:hover {
          background: #4de1ff;
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.12);
          transform: translateY(-1px);
        }

        .validation-action:focus-visible {
          outline: 3px solid rgba(0, 212, 255, 0.35);
          outline-offset: 2px;
        }

        .validation-execution,
        .validation-result {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #22334a;
        }

        .validation-execution label {
          margin-top: 16px;
        }

        .validation-textarea {
          min-height: 120px;
          font-size: 15px;
        }

        .result-textarea {
          display: block;
          min-height: 140px;
          border-color: #3a5877;
        }

        .validation-field {
          display: block;
          width: 100%;
        }

        .validation-evidence-field,
        .validation-source-field,
        .validation-finding-field {
          margin-top: 18px;
          padding: 14px;
          border: 1px solid #27435a;
          border-radius: 10px;
          background: #091522;
        }

        .validation-evidence-field label,
        .validation-source-field label,
        .validation-finding-field label {
          display: block;
          margin-top: 0;
        }

        .evidence-textarea {
          display: block;
          width: 100%;
          min-height: 120px;
        }

        .validation-field-hint {
          margin: 6px 0 10px !important;
          color: #7f8da2 !important;
          font-size: 13px;
          line-height: 1.5 !important;
        }

        .validation-outcome-fieldset {
          margin: 18px 0 0;
          padding: 14px;
          border: 1px solid #27435a;
          border-radius: 10px;
          background: #091522;
        }

        .validation-outcome-fieldset legend {
          padding: 0 6px;
          color: #dbe3ee;
          font-weight: 800;
        }

        .validation-outcome-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }

        .validation-outcome-option {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0;
          padding: 11px 12px;
          border: 1px solid #2b3c55;
          border-radius: 8px;
          background: #08101d;
          color: #dbe3ee;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .validation-outcome-option:hover {
          border-color: #00d4ff;
        }

        .validation-outcome-option.selected {
          border-color: #00d4ff;
          background: #0b2530;
          box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.08);
        }

        .validation-outcome-option input {
          accent-color: #00d4ff;
        }

        @media (max-width: 640px) {
          .evidence-review-coverage-list article {
            grid-template-columns: 1fr;
          }

          .evidence-review-coverage-list span {
            max-width: none;
            text-align: left;
          }

          .validation-outcome-options {
            grid-template-columns: 1fr;
          }
        }

        .validation-input {
          box-sizing: border-box;
          width: 100%;
          background: #08101d;
          color: white;
          border: 1px solid #2b3c55;
          border-radius: 10px;
          padding: 13px 14px;
          font: inherit;
          outline: none;
        }

        .validation-input:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.08);
        }

        .validation-result {
          background: #0b151f;
          border: 1px solid #24405a;
          border-radius: 10px;
          padding: 14px;
        }
      `}</style>
    </>
  );
}

function formatValidationStatus(
  status: "planned" | "in-progress" | "completed"
): string {
  if (status === "in-progress") {
    return "In Progress";
  }

  return status === "completed" ? "Completed" : "Planned";
}

function formatValidationOutcome(outcome?: ValidationOutcome): string {
  switch (outcome) {
    case "confirmed":
      return "Supported by evidence";
    case "refined":
      return "Understanding refined";
    case "challenged":
      return "Understanding challenged";
    case "inconclusive":
      return "Inconclusive";
    default:
      return "Not recorded";
  }
}
