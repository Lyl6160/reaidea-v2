import type { Project, ProjectTimelineEvent } from "../core/project";
import type {
  ConceptBrief,
  ConceptBriefSource,
  ConceptGenerationRequest,
  ConceptOutputType,
  ConceptRepresentationStyle,
  IdeaVisualMode,
  RepresentationResolution,
  RepresentationRoutingDiagnostic,
  RepresentationSupportingSignalLabel,
  SupportedRepresentationMode,
} from "../ai/types";
import {
  assessEngineeringDefinition,
  getEngineeringDefinitionInputs,
  type EngineeringDefinitionArea,
} from "./engineeringDefinition";
import {
  deriveRevWorkingUnderstanding,
  type RevWorkingSource,
  type RevWorkingValue,
} from "./revWorkingUnderstanding";

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

export type ConceptGenerationBenchNote = {
  question: string;
  answer: string;
};

export type DerivedVisualModeContext = {
  factualSummary: string;
  visualObservations: string[];
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

export const REPRESENTATION_CHOICE_HEADING = "REV NEEDS ONE REPRESENTATION CHOICE";
export const REPRESENTATION_CHOICE_QUESTION = "What should REV create first so you can judge this idea?";
export const REV_RECOMMENDATION_LABEL = "I'M NOT SURE / LET REV RECOMMEND";

export type RepresentationChoice = {
  mode: SupportedRepresentationMode;
  label: string;
};

export type InitialRepresentationRoutingDecision =
  | {
      kind: "ready";
      mode: SupportedRepresentationMode;
      diagnostic: RepresentationRoutingDiagnostic;
      workingAssumptions: string[];
    }
  | {
      kind: "needs-representation";
      heading: typeof REPRESENTATION_CHOICE_HEADING;
      question: typeof REPRESENTATION_CHOICE_QUESTION;
      choices: RepresentationChoice[];
      recommendation: SupportedRepresentationMode | null;
      diagnostic: RepresentationRoutingDiagnostic;
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
    /\b\d+(?:\.\d+)?\s*(?:mm|cm|m|millimet(?:re|er)s?|centimet(?:re|er)s?|met(?:re|er)s?)\b/i,
    /\b(?:steel|stainless steel|aluminium|aluminum|plastic|timber|wood|fabric)\b/i,
    /\b(?:leds?|lights?|illuminat(?:e|ed|ion))\b/i,
    /\b(?:physical|shape|dimensions?|materials?|parts?)\b/i,
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

const SAFE_SIGNAL_LABELS: Record<SupportedRepresentationMode, RepresentationSupportingSignalLabel> = {
  product: "description-physical-form",
  machine: "description-machine",
  process: "description-process",
  software: "description-software",
  system: "description-system",
  environmental: "description-environmental",
};

const INITIAL_GENERATION_MODES = new Set<SupportedRepresentationMode>(["product"]);
const INITIAL_PRODUCT_SIGNALS = {
  form: /\b(?:wearable|eyewear|[a-z]+glasses|goggles|lens(?:es)?|strap|handle|tool|device|appliance|pair)\b/i,
  operation: /\b(?:wear|worn|fit|fits|fitted|attach|attached|secure|secured|stay on|stays on|fall off|falls off|carry|carried|operate|operated)\b/i,
  components: /\b(?:frame|lens(?:es)?|strap|hinge|fastener|mount|holder|enclosure|housing|base|wheel(?:s)?|button(?:s)?)\b/i,
} as const;

export function visualModeLabel(mode: IdeaVisualMode): string {
  return MODE_LABELS[mode];
}

export function suggestVisualMode(
  project: Project,
  rollingEngineeringNotes: ConceptGenerationBenchNote[] = [],
  derivedVisualContext?: DerivedVisualModeContext
): VisualModeSuggestion {
  const definition = assessEngineeringDefinition(project);
  const discoveryContext = latestDiscoveryResponses(project, ["purpose", "conditions"])
    .map((event) => event.response?.trim())
    .filter((value): value is string => Boolean(value));
  const boundedText = [
    project.originalObservation,
    ...Object.values(definition.latestAnswers),
    ...rollingEngineeringNotes.map((note) => note.answer),
    ...discoveryContext,
    ...(derivedVisualContext
      ? [
          derivedVisualContext.factualSummary.slice(0, 280),
          ...derivedVisualContext.visualObservations.slice(0, 8).map((item) => item.slice(0, 240)),
        ]
      : []),
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
      reason: "There is not enough detail yet for REV to suggest one type of picture.",
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

/**
 * Routes initial creation from inventor-owned Project text first. Derived image
 * interpretation may corroborate that decision, but cannot replace or override it.
 */
export function routeInitialRepresentation(
  project: Project,
  derivedVisualContext?: DerivedVisualModeContext,
  resolution?: RepresentationResolution
): InitialRepresentationRoutingDecision {
  const authoritative = scoreModes(project.originalObservation);
  const relevant = authoritative.filter((item) => item.score > 0);
  const strongest = relevant[0];
  const second = relevant[1];
  const mixed = Boolean(strongest && second && second.score >= 2 && second.score >= strongest.score - 1);
  const supported = Boolean(strongest && strongest.score >= 2 && !mixed && INITIAL_GENERATION_MODES.has(strongest.mode));
  const imageLabels = imageRelationshipLabels(strongest?.mode, derivedVisualContext);
  const signalLabels = uniqueSignalLabels([
    ...relevant.slice(0, 2).map((item) => SAFE_SIGNAL_LABELS[item.mode]),
    ...(authoritative.find((item) => item.mode === "product")?.wearable ? ["description-wearable-use" as const] : []),
    ...(authoritative.find((item) => item.mode === "product")?.operation ? ["description-operation" as const] : []),
    ...(authoritative.find((item) => item.mode === "product")?.components ? ["description-components" as const] : []),
    ...imageLabels,
  ]);

  if (resolution) {
    if (!INITIAL_GENERATION_MODES.has(resolution.mode)) {
      return needsRepresentation(authoritative, signalLabels, mixed);
    }
    const selectedIsRelevant = relevant.some((item) => item.mode === resolution.mode);
    const recommendationIsSupported =
      resolution.source === "rev-recommendation" &&
      strongest?.mode === resolution.mode &&
      strongest.score >= 2 &&
      (!second || strongest.score > second.score);
    if (resolution.source === "rev-recommendation" && !recommendationIsSupported) {
      return needsRepresentation(authoritative, signalLabels, mixed);
    }
    const reason = resolution.source === "rev-recommendation"
      ? "evidence-backed-recommendation"
      : "explicit-inventor-choice";
    return {
      kind: "ready",
      mode: resolution.mode,
      diagnostic: routingDiagnostic(resolution.mode, reason, signalLabels),
      workingAssumptions: resolution.source === "rev-recommendation"
        ? [`REV working assumption: begin with a ${visualModeLabel(resolution.mode).toLowerCase()} representation, based on the captured Project information.`]
        : selectedIsRelevant
          ? []
          : [`Inventor representation choice: begin with a ${visualModeLabel(resolution.mode).toLowerCase()} representation.`],
    };
  }

  if (supported && strongest) {
    return {
      kind: "ready",
      mode: strongest.mode,
      diagnostic: routingDiagnostic(strongest.mode, "explicit-description-supported", signalLabels),
      workingAssumptions: [],
    };
  }
  return needsRepresentation(authoritative, signalLabels, mixed);
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

export function representationStyleForVisualMode(
  mode: IdeaVisualMode
): ConceptRepresentationStyle {
  switch (mode) {
    case "product":
    case "machine":
      return "engineering-outline";
    default:
      return "wireframe";
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
  identity: ConceptWorkflowIdentity,
  rollingEngineeringNotes: ConceptGenerationBenchNote[] = [],
  rollingInventorNotes: ConceptGenerationBenchNote[] = [],
  visualInterpretations: import("./revWorkingUnderstanding").RoutedVisualInterpretation[] = [],
  routingAssumptions: string[] = []
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
  const rollingAnswers = rollingEngineeringNotes.map((note) => note.answer.trim().slice(0, 1_600));
  const inventorDescription = rollingInventorNotes[0]?.answer.trim().slice(0, 1_600) || project.originalObservation.slice(0, 1_600);
  const inventorDescriptionSource = rollingInventorNotes[0] ? "bench-note" : "project-field";
  const workingUnderstanding = deriveRevWorkingUnderstanding(project, {
    engineering: rollingEngineeringNotes,
    knowledge: rollingInventorNotes,
  }, visualInterpretations);
  const workingBrief = workingUnderstanding.conceptBrief;
  const rollingProposedSolution = rollingAnswers[0] ?? "";
  const rollingOperatingConcept = joinBenchAnswers([rollingAnswers[4], rollingAnswers[5], rollingAnswers[6]]);
  const rollingFunctionalElements = joinBenchAnswers([rollingAnswers[3], rollingAnswers[1], rollingAnswers[2]]);
  const derivedConstraints = workingBrief.constraints.map((value) => value.text);
  const brief: ConceptBrief = {
    originalIdea: project.originalObservation,
    problemContext,
    proposedSolution: answers["proposed-solution"]?.trim() || rollingProposedSolution || workingBrief.proposedSolution?.text || inventorDescription,
    operatingConcept: answers["operating-concept"]?.trim() || rollingOperatingConcept || workingBrief.operatingConcept?.text || inventorDescription,
    functionalElements: answers["functional-elements"]?.trim() || rollingFunctionalElements || workingBrief.functionalElements?.text || inventorDescription,
    ...(optionalAnswer(answers, "inputs-outputs", "inputsOutputs", rollingAnswers[6])),
    ...(optionalAnswer(answers, "relationships-flow", "relationshipsFlow", rollingAnswers[4])),
    ...(optionalAnswer(answers, "user-interaction", "userInteraction", workingBrief.userInteraction?.text)),
    ...(optionalAnswer(answers, "arrangement", "arrangement", rollingAnswers[1] || workingBrief.arrangement?.text)),
    constraints: unique([...constraints, ...derivedConstraints, rollingAnswers[7] ?? ""]),
    assumptions: unique([...project.engineeringState.currentAssumptions, ...routingAssumptions]),
    ...(optionalAnswer(answers, "technical-uncertainty", "technicalUncertainty")),
  };
  const sourceTrace: ConceptBriefSource[] = [
    { field: "originalIdea", sourceKind: "project-field", sourceId: "originalObservation" },
    ...(problemEvent
      ? [{ field: "problemContext", sourceKind: "timeline-event", sourceId: problemEvent.id } as const]
      : [{ field: "problemContext", sourceKind: "project-field", sourceId: project.purpose.trim() ? "purpose" : "originalObservation" } as const]),
    ...definitionSourceTrace(definitionInputs),
    ...rollingBriefSourceTrace(answers, rollingAnswers),
    ...workingBriefSourceTrace(brief, answers, rollingAnswers, workingBrief, workingUnderstanding.sources),
    ...(inventorDescription && !workingBrief.proposedSolution && !answers["proposed-solution"]?.trim() && !rollingProposedSolution
      ? [
          { field: "proposedSolution", sourceKind: inventorDescriptionSource, sourceId: inventorDescriptionSource === "bench-note" ? "inventor-rolling-1" : "originalObservation" } as const,
        ]
      : []),
    ...(inventorDescription && !workingBrief.operatingConcept && !answers["operating-concept"]?.trim() && !rollingOperatingConcept
      ? [{ field: "operatingConcept", sourceKind: inventorDescriptionSource, sourceId: inventorDescriptionSource === "bench-note" ? "inventor-rolling-1" : "originalObservation" } as const]
      : []),
    ...(inventorDescription && !workingBrief.functionalElements && !answers["functional-elements"]?.trim() && !rollingFunctionalElements
      ? [{ field: "functionalElements", sourceKind: inventorDescriptionSource, sourceId: inventorDescriptionSource === "bench-note" ? "inventor-rolling-1" : "originalObservation" } as const]
      : []),
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
          representationStyle: representationStyleForVisualMode(confirmedVisualMode),
          outputType,
          brief,
          sourceEventIds,
          sourceTrace,
          briefVersion: 1,
        }
      : null,
  };
}

function workingBriefSourceTrace(
  brief: ConceptBrief,
  answers: ReturnType<typeof assessEngineeringDefinition>["latestAnswers"],
  rollingAnswers: string[],
  workingBrief: ReturnType<typeof deriveRevWorkingUnderstanding>["conceptBrief"],
  sources: RevWorkingSource[]
): ConceptBriefSource[] {
  const selected: Array<[keyof ConceptBrief, RevWorkingValue | RevWorkingValue[] | null, boolean]> = [
    ["proposedSolution", workingBrief.proposedSolution, !answers["proposed-solution"]?.trim() && !rollingAnswers[0]],
    ["operatingConcept", workingBrief.operatingConcept, !answers["operating-concept"]?.trim() && !joinBenchAnswers([rollingAnswers[4], rollingAnswers[5], rollingAnswers[6]])],
    ["functionalElements", workingBrief.functionalElements, !answers["functional-elements"]?.trim() && !joinBenchAnswers([rollingAnswers[3], rollingAnswers[1], rollingAnswers[2]])],
    ["arrangement", workingBrief.arrangement, !answers.arrangement?.trim() && !rollingAnswers[1] && Boolean(brief.arrangement)],
    ["userInteraction", workingBrief.userInteraction, !answers["user-interaction"]?.trim() && Boolean(brief.userInteraction)],
    ["constraints", workingBrief.constraints, workingBrief.constraints.length > 0],
  ];
  const byId = new Map(sources.map((source) => [source.id, source]));
  return selected.flatMap(([field, value, used]) => {
    if (!used || !value) return [];
    const values = Array.isArray(value) ? value : [value];
    return Array.from(new Set(values.flatMap((item) => item.sourceIds))).flatMap((sourceId) => {
      const source = byId.get(sourceId);
      if (!source) return [];
      return [{
        field,
        sourceKind: source.kind === "timeline" ? "timeline-event" as const
          : source.kind === "bench-note" ? "bench-note" as const
          : source.kind === "source-evidence-interpretation" ? "source-evidence-interpretation" as const
          : "project-field" as const,
        sourceId: source.kind === "timeline" ? source.id.slice("timeline.".length)
          : source.kind === "bench-note" ? source.id.slice("bench.".length)
          : source.kind === "source-evidence-interpretation" ? source.id
          : "originalObservation",
      }];
    });
  });
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
  key: Key,
  fallback = ""
): Partial<Record<Key, string>> {
  const answer = answers[area]?.trim() || fallback.trim();
  return answer ? { [key]: answer } as Partial<Record<Key, string>> : {};
}

function rollingBriefSourceTrace(
  answers: ReturnType<typeof assessEngineeringDefinition>["latestAnswers"],
  rollingAnswers: string[]
): ConceptBriefSource[] {
  return [
    !answers["proposed-solution"]?.trim() && rollingAnswers[0] ? { field: "proposedSolution", sourceKind: "bench-note", sourceId: "engineering-rolling-1" } : null,
    !answers["operating-concept"]?.trim() && [rollingAnswers[4], rollingAnswers[5], rollingAnswers[6]].some(Boolean) ? { field: "operatingConcept", sourceKind: "bench-note", sourceId: "engineering-rolling-5-7" } : null,
    !answers["functional-elements"]?.trim() && [rollingAnswers[3], rollingAnswers[1], rollingAnswers[2]].some(Boolean) ? { field: "functionalElements", sourceKind: "bench-note", sourceId: "engineering-rolling-2-4" } : null,
    !answers["inputs-outputs"]?.trim() && rollingAnswers[6] ? { field: "inputsOutputs", sourceKind: "bench-note", sourceId: "engineering-rolling-7" } : null,
    !answers["relationships-flow"]?.trim() && rollingAnswers[4] ? { field: "relationshipsFlow", sourceKind: "bench-note", sourceId: "engineering-rolling-5" } : null,
    !answers.arrangement?.trim() && rollingAnswers[1] ? { field: "arrangement", sourceKind: "bench-note", sourceId: "engineering-rolling-2" } : null,
    rollingAnswers[7] ? { field: "constraints", sourceKind: "bench-note", sourceId: "engineering-rolling-8" } : null,
  ].filter((source): source is ConceptBriefSource => source !== null);
}

type ModeScore = {
  mode: SupportedRepresentationMode;
  score: number;
  wearable: boolean;
  operation: boolean;
  components: boolean;
};

function scoreModes(text: string): ModeScore[] {
  const bounded = text.slice(0, 6_000);
  return (Object.entries(MODE_SIGNALS) as Array<[SupportedRepresentationMode, RegExp[]]>)
    .map(([mode, patterns]) => {
      const initialProductMatches = mode === "product"
        ? Object.values(INITIAL_PRODUCT_SIGNALS).filter((pattern) => pattern.test(bounded)).length
        : 0;
      return {
        mode,
        score: patterns.reduce((count, pattern) => count + (pattern.test(bounded) ? 1 : 0), 0) + initialProductMatches,
        wearable: mode === "product" && INITIAL_PRODUCT_SIGNALS.form.test(bounded) && /\b(?:wear|worn|fit|fits|fitted|stay on|stays on)\b/i.test(bounded),
        operation: mode === "product" && INITIAL_PRODUCT_SIGNALS.operation.test(bounded),
        components: mode === "product" && INITIAL_PRODUCT_SIGNALS.components.test(bounded),
      };
    })
    .sort((left, right) => right.score - left.score || MODE_LABELS[left.mode].localeCompare(MODE_LABELS[right.mode]));
}

function needsRepresentation(
  scores: ModeScore[],
  signalLabels: RepresentationSupportingSignalLabel[],
  mixed: boolean
): InitialRepresentationRoutingDecision {
  const relevant = scores.filter((item) => item.score > 0).slice(0, 2);
  const supportedChoices = relevant.filter((item) => INITIAL_GENERATION_MODES.has(item.mode));
  if (supportedChoices.length === 0) {
    const product = scores.find((item) => item.mode === "product");
    if (product) supportedChoices.push(product);
  }
  const strongest = relevant[0];
  const second = relevant[1];
  const recommendation = strongest && INITIAL_GENERATION_MODES.has(strongest.mode) && strongest.score >= 2 && (!second || strongest.score > second.score)
    ? strongest.mode
    : null;
  return {
    kind: "needs-representation",
    heading: REPRESENTATION_CHOICE_HEADING,
    question: REPRESENTATION_CHOICE_QUESTION,
    choices: supportedChoices.map((item) => ({ mode: item.mode, label: visualModeLabel(item.mode) })),
    recommendation,
    diagnostic: routingDiagnostic(
      mixed ? "mixed" : "unknown",
      mixed ? "description-mixed" : "description-insufficient",
      signalLabels
    ),
  };
}

function routingDiagnostic(
  mode: IdeaVisualMode,
  reason: RepresentationRoutingDiagnostic["reason"],
  supportingSignalLabels: RepresentationSupportingSignalLabel[]
): RepresentationRoutingDiagnostic {
  return {
    mode,
    reason,
    supportingSignalLabels: supportingSignalLabels.slice(0, 8),
    phase: "request-construction",
    category: "representation-question",
  };
}

function imageRelationshipLabels(
  authoritativeMode: SupportedRepresentationMode | undefined,
  context?: DerivedVisualModeContext
): RepresentationSupportingSignalLabel[] {
  if (!context || !authoritativeMode) return [];
  const derived = scoreModes([
    context.factualSummary.slice(0, 280),
    ...context.visualObservations.slice(0, 8).map((item) => item.slice(0, 240)),
  ].join("\n"))[0];
  if (!derived || derived.score < 2) return [];
  return [derived.mode === authoritativeMode ? "image-corroborates-description" : "image-context-differs"];
}

function uniqueSignalLabels(
  values: RepresentationSupportingSignalLabel[]
): RepresentationSupportingSignalLabel[] {
  return Array.from(new Set(values));
}

function articleFor(mode: IdeaVisualMode): "a" | "an" {
  return mode === "environmental" ? "an" : "a";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function joinBenchAnswers(values: Array<string | undefined>): string {
  return unique(values.filter((value): value is string => Boolean(value))).join(" ").slice(0, 1_600).trim();
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
