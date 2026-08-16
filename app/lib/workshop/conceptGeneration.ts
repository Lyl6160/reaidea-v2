import type { Project, ProjectTimelineEvent } from "../core/project";
import type {
  ConceptBrief,
  ConceptBriefSource,
  ConceptGenerationRequest,
  ConceptOutputType,
  IdeaVisualMode,
} from "../ai/types";
import {
  assessEngineeringDefinition,
  getEngineeringDefinitionInputs,
  type EngineeringDefinitionArea,
} from "./engineeringDefinition";

export type VisualModeSuggestion = {
  mode: IdeaVisualMode;
  confidence: "low" | "medium";
  reason: string;
  supportingSignals: string[];
};

export type ConceptWorkflowIdentity = {
  requestId: string;
  conceptFamilyId: string;
  revision: 1;
};

export type ConceptGenerationFoundation = {
  brief: ConceptBrief;
  sourceTrace: ConceptBriefSource[];
  sourceEventIds: string[];
  missingRequiredFields: Array<
    "proposedSolution" | "operatingConcept" | "functionalElements" | "confirmedVisualMode"
  >;
  generationReady: boolean;
  request: ConceptGenerationRequest | null;
};

export const IDEA_VISUAL_MODES: readonly IdeaVisualMode[] = [
  "product",
  "machine",
  "process",
  "software",
  "system",
  "environmental",
  "mixed",
  "unknown",
] as const;

const MODE_LABELS: Record<IdeaVisualMode, string> = {
  product: "Physical Product",
  machine: "Machine",
  process: "Process",
  software: "Software",
  system: "System",
  environmental: "Environmental",
  mixed: "Mixed",
  unknown: "Unknown",
};

const MODE_SIGNALS: Record<Exclude<IdeaVisualMode, "mixed" | "unknown">, RegExp[]> = {
  product: [
    /\bhand[ -]?held\b/i,
    /\bpole\b/i,
    /\bshaft\b/i,
    /\bsign head\b/i,
    /\bframe\b/i,
    /\bhousing\b/i,
    /\bmounted\b/i,
    /\bopposing (?:face|side)s?\b/i,
    /\bstop (?:face|side)\b/i,
    /\bgo (?:face|side)\b/i,
    /\bbattery\b/i,
    /\bportable\b/i,
  ],
  machine: [
    /\bmotor\b/i,
    /\bgear(?:box|s)?\b/i,
    /\bactuator\b/i,
    /\bmechanism\b/i,
    /\bdrive train\b/i,
    /\bpump\b/i,
    /\bautomatically rotat/i,
    /\breciprocat/i,
  ],
  process: [
    /\bprocess\b/i,
    /\bstages?\b/i,
    /\bsteps?\b/i,
    /\bsequence\b/i,
    /\bmaterial flow\b/i,
    /\bmixtur/i,
    /\btreatment\b/i,
    /\btransform(?:ation|s|ed)?\b/i,
  ],
  software: [
    /\bsoftware\b/i,
    /\bapp(?:lication)?\b/i,
    /\bscreens?\b/i,
    /\buser interface\b/i,
    /\bdata(?:base)?\b/i,
    /\bapi\b/i,
    /\bcode\b/i,
    /\blog[ -]?in\b/i,
  ],
  system: [
    /\bsystem\b/i,
    /\bnetwork\b/i,
    /\bactors?\b/i,
    /\bsubsystems?\b/i,
    /\bcomponents? communicate\b/i,
    /\bworkflow\b/i,
    /\bdistributed\b/i,
  ],
  environmental: [
    /\benvironment(?:al)?\b/i,
    /\becosystem\b/i,
    /\bhabitat\b/i,
    /\bpollution\b/i,
    /\bwaterway\b/i,
    /\bstormwater\b/i,
    /\bsoil\b/i,
    /\bair quality\b/i,
    /\bintervention zones?\b/i,
  ],
};

export function visualModeLabel(mode: IdeaVisualMode): string {
  return MODE_LABELS[mode];
}

export function suggestVisualMode(project: Project): VisualModeSuggestion {
  const definition = assessEngineeringDefinition(project);
  const discoveryContext = latestDiscoveryResponses(project, ["purpose", "conditions"])
    .map((event) => event.response?.trim())
    .filter((value): value is string => Boolean(value));
  const boundedText = [
    project.originalObservation,
    ...Object.values(definition.latestAnswers),
    ...discoveryContext,
  ].join("\n");
  const matches = Object.entries(MODE_SIGNALS).map(([mode, patterns]) => {
    const signals = patterns.flatMap((pattern) => {
      const match = boundedText.match(pattern)?.[0]?.trim();
      return match ? [match] : [];
    });
    return { mode: mode as Exclude<IdeaVisualMode, "mixed" | "unknown">, signals };
  }).filter((result) => result.signals.length > 0)
    .sort((left, right) => right.signals.length - left.signals.length);

  const strongest = matches[0];
  const second = matches[1];
  if (!strongest || strongest.signals.length < 2) {
    return {
      mode: "unknown",
      confidence: "low",
      reason: "The current bounded Project context does not yet indicate one safe visual language.",
      supportingSignals: strongest?.signals.slice(0, 4) ?? [],
    };
  }

  if (second && second.signals.length >= 2 && second.signals.length >= strongest.signals.length - 1) {
    const supportingSignals = unique([...strongest.signals, ...second.signals]).slice(0, 6);
    return {
      mode: "mixed",
      confidence: "low",
      reason: `You described meaningful ${visualModeLabel(strongest.mode).toLowerCase()} and ${visualModeLabel(second.mode).toLowerCase()} characteristics, so one visual mode may not be sufficient.`,
      supportingSignals,
    };
  }

  const supportingSignals = unique(strongest.signals).slice(0, 6);
  return {
    mode: strongest.mode,
    confidence: strongest.signals.length >= 4 ? "medium" : "low",
    reason: `You described ${supportingSignals.join(", ")}, which currently reads most naturally as ${articleFor(strongest.mode)} ${visualModeLabel(strongest.mode).toLowerCase()}.`,
    supportingSignals,
  };
}

export function outputTypeForVisualMode(mode: IdeaVisualMode): ConceptOutputType | null {
  switch (mode) {
    case "product":
    case "machine":
      return "image";
    case "process":
      return "diagram";
    case "software":
      return "ui-mockup";
    case "system":
      return "graph";
    case "environmental":
    case "mixed":
      return "hybrid";
    case "unknown":
      return null;
  }
}

export function createConceptWorkflowIdentity(
  existingConceptFamilyId?: string
): ConceptWorkflowIdentity {
  return {
    requestId: createId(),
    conceptFamilyId: existingConceptFamilyId?.trim() || createId(),
    revision: 1,
  };
}

export function buildConceptGenerationFoundation(
  project: Project,
  confirmedVisualMode: IdeaVisualMode | null,
  identity: ConceptWorkflowIdentity
): ConceptGenerationFoundation {
  const definition = assessEngineeringDefinition(project);
  const definitionInputs = latestDefinitionInputs(project);
  const problemEvent = latestDiscoveryResponses(project, ["purpose"])[0];
  const constraintEvent = latestDiscoveryResponses(project, ["constraints"])[0];
  const problemContext =
    problemEvent?.response?.trim() ||
    project.purpose.trim() ||
    project.originalObservation;
  const constraints = unique([
    ...project.engineeringState.currentConstraints.map((item) => item.trim()).filter(Boolean),
    ...(constraintEvent?.response?.trim() ? [constraintEvent.response.trim()] : []),
    ...(definition.latestAnswers["constraint-safety-response"]?.trim()
      ? [definition.latestAnswers["constraint-safety-response"].trim()]
      : []),
  ]);
  const answers = definition.latestAnswers;
  const brief: ConceptBrief = {
    originalIdea: project.originalObservation,
    problemContext,
    proposedSolution: answers["proposed-solution"]?.trim() || "",
    operatingConcept: answers["operating-concept"]?.trim() || "",
    functionalElements: answers["functional-elements"]?.trim() || "",
    ...(optionalAnswer(answers, "inputs-outputs", "inputsOutputs")),
    ...(optionalAnswer(answers, "relationships-flow", "relationshipsFlow")),
    ...(optionalAnswer(answers, "user-interaction", "userInteraction")),
    ...(optionalAnswer(answers, "arrangement", "arrangement")),
    constraints,
    assumptions: unique(project.engineeringState.currentAssumptions),
    ...(optionalAnswer(answers, "technical-uncertainty", "technicalUncertainty")),
  };
  const sourceTrace: ConceptBriefSource[] = [
    { field: "originalIdea", sourceKind: "project-field", sourceId: "originalObservation" },
    ...(problemEvent
      ? [{ field: "problemContext", sourceKind: "timeline-event", sourceId: problemEvent.id } as const]
      : [{ field: "problemContext", sourceKind: "project-field", sourceId: project.purpose.trim() ? "purpose" : "originalObservation" } as const]),
    ...definitionSourceTrace(definitionInputs),
    ...(constraintEvent
      ? [{ field: "constraints", sourceKind: "timeline-event", sourceId: constraintEvent.id } as const]
      : []),
    ...(project.engineeringState.currentConstraints.length > 0
      ? [{ field: "constraints", sourceKind: "project-field", sourceId: "engineeringState.currentConstraints" } as const]
      : []),
    ...(project.engineeringState.currentAssumptions.length > 0
      ? [{ field: "assumptions", sourceKind: "project-field", sourceId: "engineeringState.currentAssumptions" } as const]
      : []),
  ];
  const sourceEventIds = unique(
    sourceTrace
      .filter((source) => source.sourceKind === "timeline-event")
      .map((source) => source.sourceId)
  );
  const missingRequiredFields: ConceptGenerationFoundation["missingRequiredFields"] = [];
  if (!brief.proposedSolution) missingRequiredFields.push("proposedSolution");
  if (!brief.operatingConcept) missingRequiredFields.push("operatingConcept");
  if (!brief.functionalElements) missingRequiredFields.push("functionalElements");
  if (!confirmedVisualMode || confirmedVisualMode === "unknown") {
    missingRequiredFields.push("confirmedVisualMode");
  }
  const outputType = confirmedVisualMode
    ? outputTypeForVisualMode(confirmedVisualMode)
    : null;
  const generationReady = missingRequiredFields.length === 0 && outputType !== null;

  return {
    brief,
    sourceTrace,
    sourceEventIds,
    missingRequiredFields,
    generationReady,
    request: generationReady && confirmedVisualMode && outputType
      ? {
          requestId: identity.requestId,
          conceptFamilyId: identity.conceptFamilyId,
          revision: identity.revision,
          title: `CONCEPT 01 · ${project.projectName}`,
          visualMode: confirmedVisualMode,
          outputType,
          brief,
          sourceEventIds,
          sourceTrace,
          briefVersion: 1,
        }
      : null,
  };
}

function latestDefinitionInputs(project: Project) {
  const byArea = new Map<EngineeringDefinitionArea, ReturnType<typeof getEngineeringDefinitionInputs>[number]>();
  for (const input of getEngineeringDefinitionInputs(project)) byArea.set(input.area, input);
  return byArea;
}

function definitionSourceTrace(
  inputs: Map<EngineeringDefinitionArea, ReturnType<typeof getEngineeringDefinitionInputs>[number]>
): ConceptBriefSource[] {
  const fields: Partial<Record<EngineeringDefinitionArea, keyof ConceptBrief>> = {
    "proposed-solution": "proposedSolution",
    "operating-concept": "operatingConcept",
    "functional-elements": "functionalElements",
    "inputs-outputs": "inputsOutputs",
    "relationships-flow": "relationshipsFlow",
    "user-interaction": "userInteraction",
    arrangement: "arrangement",
    "constraint-safety-response": "constraints",
    "technical-uncertainty": "technicalUncertainty",
  };
  return Array.from(inputs.entries()).flatMap(([area, input]) => {
    const field = fields[area];
    return field
      ? [{ field, sourceKind: "timeline-event" as const, sourceId: input.eventId }]
      : [];
  });
}

function latestDiscoveryResponses(project: Project, subjects: string[]) {
  const requested = new Set(subjects);
  const bySubject = new Map<string, ProjectTimelineEvent>();
  for (const event of project.timeline) {
    if (
      event.type === "discovery-answer-recorded" &&
      event.subject &&
      requested.has(event.subject) &&
      event.response?.trim()
    ) {
      bySubject.set(event.subject, event);
    }
  }
  return subjects.flatMap((subject) => {
    const event = bySubject.get(subject);
    return event ? [event] : [];
  });
}

function optionalAnswer<
  Key extends "inputsOutputs" | "relationshipsFlow" | "userInteraction" | "arrangement" | "technicalUncertainty"
>(
  answers: ReturnType<typeof assessEngineeringDefinition>["latestAnswers"],
  area: EngineeringDefinitionArea,
  key: Key
): Partial<Record<Key, string>> {
  const answer = answers[area]?.trim();
  return answer ? { [key]: answer } as Partial<Record<Key, string>> : {};
}

function articleFor(mode: IdeaVisualMode): "a" | "an" {
  return mode === "environmental" ? "an" : "a";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function createId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
