import type {
  EngineeringState,
  EngineeringStateField,
  EngineeringAssertionKind,
  EngineeringAssertionStatus,
  Project,
  ProjectDecision,
  ProjectDecisionCategory,
  ProjectEngineeringAction,
  ProjectEngineeringAssertion,
  ProjectTimelineEvent,
  ValidationOutcome,
  ValidationPlan,
  ValidationPlanItem,
  ValidationPlanItemSource,
  ValidationPlanItemStatus,
  ValidationPlanStatus,
} from "./project";

type StoredEngineeringState = Omit<
  EngineeringState,
  "currentAssumptions" | "currentConstraints"
> &
  Partial<Pick<EngineeringState, "currentAssumptions" | "currentConstraints">>;

type StoredProject = Omit<
  Project,
  "engineeringState" | "validationPlan" | "engineeringActions"
> & {
  engineeringState: StoredEngineeringState;
  validationPlan?: ValidationPlan | null;
  engineeringActions?: unknown;
};

const STORAGE_KEY = "reaidea-project";
const STORAGE_EVENT = "reaidea-project-changed";
const LEGACY_PROJECT_KEYS = [
  "reaidea-current-idea",
  "reaidea-current-project",
  "reaidea-project-core",
];

export function saveProject(project: Project): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));

    for (const legacyKey of LEGACY_PROJECT_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }

    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch (error) {
    console.error("Could not save the reAIdea Project.", error);
  }
}

export function loadProject(): Project | null {
  return parseProjectSnapshot(getProjectStorageSnapshot());
}

export function clearProject(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch (error) {
    console.error("Could not clear the reAIdea Project.", error);
  }
}

export function getProjectStorageSnapshot(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function getServerProjectStorageSnapshot(): null {
  return null;
}

export function subscribeToProjectStorage(
  listener: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, listener);
  };
}

export function parseProjectSnapshot(snapshot: string | null): Project | null {
  if (!snapshot) {
    return null;
  }

  try {
    const parsedProject = JSON.parse(snapshot) as unknown;

    if (!isValidStoredProject(parsedProject)) {
      return null;
    }

    return normalizeProject(parsedProject);
  } catch (error) {
    console.error("Could not read the reAIdea Project.", error);
    return null;
  }
}

function isValidStoredProject(value: unknown): value is StoredProject {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const project = value as Partial<StoredProject>;
  const engineeringState = project.engineeringState as
    | Partial<StoredEngineeringState>
    | undefined;

  return (
    typeof project.id === "string" &&
    typeof project.projectName === "string" &&
    typeof project.ownerId === "string" &&
    typeof project.originalObservation === "string" &&
    project.originalObservation.length > 0 &&
    typeof project.status === "string" &&
    typeof project.readiness === "string" &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string" &&
    typeof engineeringState === "object" &&
    engineeringState !== null &&
    typeof engineeringState.currentUnderstanding === "string" &&
    Array.isArray(engineeringState.currentEvidence) &&
    typeof engineeringState.greatestRemainingUncertainty === "string" &&
    typeof engineeringState.nextEngineeringStep === "string" &&
    Array.isArray(project.evidence) &&
    Array.isArray(project.files) &&
    Array.isArray(project.timeline)
  );
}

function normalizeProject(project: StoredProject): Project {
  return {
    ...project,
    decisions: normalizeProjectDecisions(project.decisions),
    engineeringState: {
      ...project.engineeringState,
      currentEvidence: stringList(project.engineeringState.currentEvidence),
      currentAssumptions: stringList(project.engineeringState.currentAssumptions),
      currentConstraints: stringList(project.engineeringState.currentConstraints),
    },
    engineeringAssertions: normalizeEngineeringAssertions(
      project.engineeringAssertions
    ),
    engineeringActions: normalizeEngineeringActions(project.engineeringActions),
    validationPlan: normalizeValidationPlan(project.validationPlan),
    timeline: normalizeTimeline(project.timeline),
  };
}

function normalizeEngineeringAssertions(
  value: unknown
): ProjectEngineeringAssertion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeEngineeringAssertion)
    .filter(
      (assertion): assertion is ProjectEngineeringAssertion => assertion !== null
    );
}

function normalizeEngineeringActions(value: unknown): ProjectEngineeringAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeEngineeringAction)
    .filter(
      (action): action is ProjectEngineeringAction => action !== null
    );
}

function normalizeEngineeringAction(
  value: unknown
): ProjectEngineeringAction | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const action = value as Partial<ProjectEngineeringAction>;

  if (
    typeof action.id !== "string" ||
    !action.id.trim() ||
    typeof action.action !== "string" ||
    !action.action.trim() ||
    typeof action.reason !== "string" ||
    !Array.isArray(action.basisDirectionIds) ||
    typeof action.ownerId !== "string" ||
    !action.ownerId.trim() ||
    typeof action.createdAt !== "string" ||
    !action.createdAt.trim()
  ) {
    return null;
  }

  return {
    id: action.id,
    action: action.action,
    reason: action.reason,
    basisDirectionIds: stringList(action.basisDirectionIds, true),
    ownerId: action.ownerId,
    createdAt: action.createdAt,
  };
}

function normalizeEngineeringAssertion(
  value: unknown
): ProjectEngineeringAssertion | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const assertion = value as Partial<ProjectEngineeringAssertion>;

  if (
    typeof assertion.id !== "string" ||
    !assertion.id.trim() ||
    !isEngineeringAssertionKind(assertion.kind) ||
    typeof assertion.value !== "string" ||
    !assertion.value.trim() ||
    !isEngineeringAssertionStatus(assertion.status) ||
    typeof assertion.createdAt !== "string" ||
    !assertion.createdAt.trim()
  ) {
    return null;
  }

  return {
    id: assertion.id,
    kind: assertion.kind,
    value: assertion.value,
    status: assertion.status,
    createdAt: assertion.createdAt,
    ...(Array.isArray(assertion.sourceTimelineEventIds)
      ? { sourceTimelineEventIds: stringList(assertion.sourceTimelineEventIds, true) }
      : {}),
    ...(typeof assertion.supersedesAssertionId === "string" &&
    assertion.supersedesAssertionId.trim()
      ? { supersedesAssertionId: assertion.supersedesAssertionId }
      : {}),
  };
}

function isEngineeringAssertionKind(
  value: unknown
): value is EngineeringAssertionKind {
  return (
    value === "assumption" ||
    value === "constraint" ||
    value === "uncertainty"
  );
}

function isEngineeringAssertionStatus(
  value: unknown
): value is EngineeringAssertionStatus {
  return (
    value === "active" ||
    value === "resolved" ||
    value === "challenged" ||
    value === "superseded"
  );
}

function normalizeTimeline(events: ProjectTimelineEvent[]): ProjectTimelineEvent[] {
  return events.map((event) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    description: event.description,
    ...(typeof event.subject === "string" ? { subject: event.subject } : {}),
    ...(typeof event.response === "string" ? { response: event.response } : {}),
    createdAt: event.createdAt,
    ...(typeof event.validationItemId === "string"
      ? { validationItemId: event.validationItemId }
      : {}),
    ...(typeof event.evidenceId === "string"
      ? { evidenceId: event.evidenceId }
      : {}),
    ...(isValidationOutcome(event.validationOutcome)
      ? { validationOutcome: event.validationOutcome }
      : {}),
    ...(Array.isArray(event.engineeringStateChangedFields)
      ? {
          engineeringStateChangedFields: engineeringStateFields(
            event.engineeringStateChangedFields
          ),
        }
      : {}),
    ...(typeof event.decisionId === "string"
      ? { decisionId: event.decisionId }
      : {}),
  }));
}

function engineeringStateFields(value: unknown[]): EngineeringStateField[] {
  return value.filter(isEngineeringStateField);
}

function isEngineeringStateField(value: unknown): value is EngineeringStateField {
  return (
    value === "currentUnderstanding" ||
    value === "currentEvidence" ||
    value === "currentAssumptions" ||
    value === "currentConstraints" ||
    value === "greatestRemainingUncertainty" ||
    value === "nextEngineeringStep"
  );
}

function normalizeProjectDecisions(value: unknown): ProjectDecision[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeProjectDecision)
    .filter((decision): decision is ProjectDecision => decision !== null);
}

function normalizeProjectDecision(value: unknown): ProjectDecision | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const decision = value as Partial<ProjectDecision>;

  if (
    typeof decision.id !== "string" ||
    typeof decision.decision !== "string" ||
    typeof decision.reason !== "string" ||
    !Array.isArray(decision.supportingEvidenceIds) ||
    typeof decision.ownerId !== "string" ||
    typeof decision.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: decision.id,
    decision: decision.decision,
    reason: decision.reason,
    supportingEvidenceIds: stringList(decision.supportingEvidenceIds),
    ownerId: decision.ownerId,
    createdAt: decision.createdAt,
    ...(isProjectDecisionCategory(decision.category)
      ? { category: decision.category }
      : {}),
    ...(Array.isArray(decision.sourceTimelineEventIds)
      ? { sourceTimelineEventIds: stringList(decision.sourceTimelineEventIds) }
      : {}),
    ...(Array.isArray(decision.validationItemIds)
      ? { validationItemIds: stringList(decision.validationItemIds) }
      : {}),
    ...(Array.isArray(decision.basisConclusionIds)
      ? { basisConclusionIds: stringList(decision.basisConclusionIds, true) }
      : {}),
    ...(isProjectConceptRef(decision.conceptRef)
      ? { conceptRef: decision.conceptRef }
      : {}),
    ...(typeof decision.supersedesDecisionId === "string"
      ? { supersedesDecisionId: decision.supersedesDecisionId }
      : {}),
  };
}

function isProjectDecisionCategory(
  value: unknown
): value is ProjectDecisionCategory {
  return (
    value === "engineering-conclusion" ||
    value === "concept-review" ||
    value === "concept-direction" ||
    value === "engineering-direction"
  );
}

function isProjectConceptRef(value: unknown): value is ProjectDecision["conceptRef"] {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const conceptRef = value as Partial<NonNullable<ProjectDecision["conceptRef"]>>;

  return typeof conceptRef.id === "string" && Number.isInteger(conceptRef.revision);
}

function normalizeValidationPlan(value: unknown): ValidationPlan | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const plan = value as Partial<ValidationPlan>;

  if (
    !isValidationPlanStatus(plan.status) ||
    typeof plan.purpose !== "string" ||
    typeof plan.createdAt !== "string" ||
    typeof plan.updatedAt !== "string" ||
    !Array.isArray(plan.items)
  ) {
    return null;
  }

  const items = plan.items
    .map(normalizeValidationPlanItem)
    .filter((item): item is ValidationPlanItem => item !== null);

  if (items.length === 0) {
    return null;
  }

  return {
    status: deriveValidationPlanStatus(items),
    purpose: plan.purpose,
    items,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function normalizeValidationPlanItem(value: unknown): ValidationPlanItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Partial<ValidationPlanItem>;

  if (
    typeof item.id !== "string" ||
    !isValidationPlanItemSource(item.source) ||
    typeof item.title !== "string" ||
    typeof item.target !== "string" ||
    typeof item.method !== "string" ||
    typeof item.evidenceNeeded !== "string" ||
    typeof item.completionRule !== "string" ||
    !isValidationPlanItemStatus(item.status)
  ) {
    return null;
  }

  if (
    item.status === "in-progress" &&
    typeof item.startedAt !== "string"
  ) {
    return null;
  }

  if (
    item.status === "completed" &&
    (typeof item.startedAt !== "string" ||
      typeof item.completedAt !== "string" ||
      typeof item.evidenceId !== "string" ||
      typeof item.evidenceSummary !== "string" ||
      typeof item.evidenceSource !== "string" ||
      typeof item.resultSummary !== "string" ||
      !isValidationOutcome(item.outcome) ||
      (item.assessmentRationale !== undefined && typeof item.assessmentRationale !== "string"))
  ) {
    return null;
  }

  return {
    id: item.id,
    source: item.source,
    title: item.title,
    target: item.target,
    method: item.method,
    evidenceNeeded: item.evidenceNeeded,
    completionRule: item.completionRule,
    status: item.status,
    ...(typeof item.startedAt === "string" ? { startedAt: item.startedAt } : {}),
    ...(typeof item.completedAt === "string" ? { completedAt: item.completedAt } : {}),
    ...(typeof item.evidenceId === "string" ? { evidenceId: item.evidenceId } : {}),
    ...(Array.isArray(item.sourceAssertionIds)
      ? { sourceAssertionIds: stringList(item.sourceAssertionIds, true) }
      : {}),
    ...(Array.isArray(item.sourceTimelineEventIds)
      ? { sourceTimelineEventIds: stringList(item.sourceTimelineEventIds) }
      : {}),
    ...(typeof item.evidenceSummary === "string"
      ? { evidenceSummary: item.evidenceSummary }
      : {}),
    ...(typeof item.evidenceSource === "string"
      ? { evidenceSource: item.evidenceSource }
      : {}),
    ...(typeof item.resultSummary === "string"
      ? { resultSummary: item.resultSummary }
      : {}),
    ...(isValidationOutcome(item.outcome) ? { outcome: item.outcome } : {}),
    ...(typeof item.assessmentRationale === "string"
      ? { assessmentRationale: item.assessmentRationale }
      : {}),
  };
}

function deriveValidationPlanStatus(
  items: ValidationPlanItem[]
): ValidationPlanStatus {
  if (items.every((item) => item.status === "completed")) {
    return "completed";
  }

  if (items.some((item) => item.status !== "planned")) {
    return "in-progress";
  }

  return "planned";
}

function isValidationPlanItemSource(
  value: unknown
): value is ValidationPlanItemSource {
  return (
    value === "assumption" ||
    value === "evidence-gap" ||
    value === "reported-evidence" ||
    value === "engineering-state"
  );
}

function isValidationPlanItemStatus(
  value: unknown
): value is ValidationPlanItemStatus {
  return (
    value === "planned" || value === "in-progress" || value === "completed"
  );
}

function isValidationPlanStatus(value: unknown): value is ValidationPlanStatus {
  return (
    value === "planned" || value === "in-progress" || value === "completed"
  );
}

function isValidationOutcome(value: unknown): value is ValidationOutcome {
  return (
    value === "confirmed" ||
    value === "refined" ||
    value === "challenged" ||
    value === "inconclusive"
  );
}

function stringList(value: unknown, requireNonEmpty = false): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && (!requireNonEmpty || item.trim().length > 0)
  );
}
