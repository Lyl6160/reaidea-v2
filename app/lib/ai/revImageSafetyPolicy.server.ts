import "server-only";

import { createHash } from "node:crypto";

import type {
  ProviderImageSafetyReport,
  RevImageSafetyDecision,
  RevImageSafetyLimitation,
  RevImageSafetyReceipt,
} from "./types";

export const REV_IMAGE_SAFETY_POLICY_VERSION = 1 as const;
export const FIREARM_INTENT_QUESTION = "What are you trying to design or improve using this reference?";
export const HAZARD_INTENT_QUESTION = "Is the goal to contain an existing hazard, or to create or strengthen the reaction?";

const immediatelyBlockedIntent = /\b(build|construct|convert|make|manufacture)\b[\s\S]*\b(working firearm|working gun|working weapon)\b/i;
const firearmHarmfulIntent = /\b(?:caus(?:e|es|ed|ing))\b(?:\W+\w+){0,5}\W+\b(?:more|greater|additional)\s+(?:damage|harm)\b|\b(?:increas(?:e|es|ed|ing))\b(?:\W+\w+){0,5}\W+\b(?:lethal|lethality|range|rate of fire)\b|\b(?:more|greater)\s+(?:damage|harm)\b|\b(?:lethal|lethality)\b|\b(?:conceal|conceals|concealed|concealing|concealment)\b|\b(?:ammunition|ammo)\s+development\b|\b(?:defeat|defeats|defeated|defeating|disable|disables|disabled|disabling|bypass|bypasses|bypassed|bypassing)\b(?:\W+\w+){0,5}\W+\b(?:safety system|safety control)\b|\b(?:target|targets|targeted|targeting|shoot|shoots|shooting|harm|harms|harmed|harming)\b(?:\W+\w+){0,5}\W+\b(?:person|people|human|humans)\b|\b(?:evade|evades|evaded|evading|avoid|avoids|avoided|avoiding)\b(?:\W+\w+){0,5}\W+\b(?:authority|authorities|police)\b/i;
const hazardHarmfulIntent = new RegExp([
  String.raw`\b(?:chemical\s+)?mixtures?\s+(?:recipes?|ratios?)\b|\b(?:recipes?|ratios?)\s+(?:for|of)\s+(?:a\s+)?(?:chemical|explosive|mixture|reaction)\b`,
  String.raw`\b(?:synthesi[sz](?:e|es|ed|ing)?|synthesis|precursors?\s+prepar(?:e|es|ed|ing|ation))\b`,
  String.raw`\b(?:initiat(?:e|es|ed|ing|ion)|initiators?)\b`,
  String.raw`\btrigger(?:s|ed|ing)?\s+(?:the\s+)?(?:reaction|explosive|blast|charge|device)\b|\b(?:reaction|explosive|blast|charge|device)\s+trigger(?:s|ed|ing)?\b|\btriggering\s+design\b`,
  String.raw`\b(?:increase|increases|increased|increasing|boost|boosts|boosted|boosting|strengthen|strengthens|strengthened|strengthening)\b(?:\W+\w+){0,5}\W+\b(?:explosive|blast|reaction)?\s*(?:force|yield|strength)\b`,
  String.raw`\b(?:explosive|blast|reaction)?\s*(?:force|yield|strength)\b(?:\W+\w+){0,5}\W+\b(?:increase|increases|increased|increasing|boost|boosts|boosted|boosting|strengthen|strengthens|strengthened|strengthening)\b`,
  String.raw`\b(?:higher|greater)\s+(?:(?:explosive|blast|reaction)\s+)?(?:force|yield|strength)\b`,
  String.raw`\b(?:conceal|conceals|concealed|concealing|concealment)\b`,
  String.raw`\b(?:harmful|malicious|weaponi[sz]ed)\b(?:\W+\w+){0,4}\W+\b(?:deliver|delivers|delivered|delivering|delivery|disperse|disperses|dispersed|dispersing|dispersal|release|releases|released|releasing)\b|\b(?:deliver|delivers|delivered|delivering|delivery|disperse|disperses|dispersed|dispersing|dispersal|release|releases|released|releasing)\b(?:\W+\w+){0,4}\W+\b(?:harmful|malicious|weaponi[sz]ed)\b`,
  String.raw`\b(?:defeat|defeats|defeated|defeating|disable|disables|disabled|disabling|bypass|bypasses|bypassed|bypassing|circumvent|circumvents|circumvented|circumventing|override|overrides|overrode|overridden|overriding)\b(?:\W+\w+){0,5}\W+\b(?:safety\s+(?:control|system)|interlock|containment\s+control|monitoring\s+control)\b`,
  String.raw`\b(?:safety\s+(?:control|system)|interlock|containment\s+control|monitoring\s+control)\b(?:\W+\w+){0,5}\W+\b(?:defeat|defeats|defeated|defeating|disable|disables|disabled|disabling|bypass|bypasses|bypassed|bypassing|circumvent|circumvents|circumvented|circumventing|override|overrides|overrode|overridden|overriding)\b`,
  String.raw`\b(?:evade|evades|evaded|evading|avoid|avoids|avoided|avoiding|bypass|bypasses|bypassed|bypassing|circumvent|circumvents|circumvented|circumventing)\b(?:\W+\w+){0,5}\W+\b(?:authorit(?:y|ies)|regulators?|inspection|law\s+enforcement)\b`,
  String.raw`\b(?:authorit(?:y|ies)|regulators?|inspection|law\s+enforcement)\b(?:\W+\w+){0,5}\W+\b(?:evade|evades|evaded|evading|avoid|avoids|avoided|avoiding|bypass|bypasses|bypassed|bypassing|circumvent|circumvents|circumvented|circumventing)\b`,
].join("|"), "i");
const protectiveHazardIntent = /\b(?:contain|contains|contained|containing|containment|shield|shields|shielded|shielding|barrier|enclosure|detect|detects|detected|detecting|detection|monitor|monitors|monitored|monitoring|protect|protects|protected|protecting|protection|protective|controlled\s+vent)\b|\bremote(?:ly)?\s+(?:handle|handles|handled|handling)\b|\bemergency\s+response\b/i;

const permittedFirearmIntents: Array<[RegExp, RevImageSafetyLimitation]> = [
  [/\b(safe|safety)\b/i, "safety-only"],
  [/\b(secure storage|safe storage|gun safe|lock box|locked cabinet|storage)\b/i, "secure-storage-only"],
  [/\b(lawful transport|legal transport|transport case|carrying case|transport)\b/i, "lawful-transport-only"],
  [/\b(training|instruction|education)\b/i, "training-only"],
  [/\b(disabled replica|non[- ]?functional replica|prop|replica)\b/i, "disabled-replica-only"],
  [/\b(historical|history|museum|study)\b/i, "historical-study-only"],
  [/\b(accessory|case|rack|sling|lock|stand|holder|mount)\b/i, "non-weapon-accessory-only"],
];

export function decideRevImageSafety(input: {
  report: ProviderImageSafetyReport;
  inventorDescription: string;
  imageDataUrl: string;
}): RevImageSafetyDecision {
  const description = normalizeInventorContext(input.inventorDescription);
  if (input.report.immediateBlock || input.report.flagged || immediatelyBlockedIntent.test(description)) {
    return { decision: "BLOCK" };
  }

  let limitations: RevImageSafetyLimitation[] = [];
  if (input.report.controlledRisk === "firearm") {
    if (firearmHarmfulIntent.test(description)) return { decision: "BLOCK" };
    limitations = permittedFirearmIntents
      .filter(([pattern]) => pattern.test(description))
      .map(([, limitation]) => limitation);
    if (limitations.length === 0) return { decision: "HOLD", question: FIREARM_INTENT_QUESTION };
  }

  if (input.report.controlledRisk === "chemical-explosive") {
    if (hazardHarmfulIntent.test(description)) return { decision: "BLOCK" };
    if (!protectiveHazardIntent.test(description)) {
      return { decision: "HOLD", question: HAZARD_INTENT_QUESTION };
    }
    limitations = hazardLimitations(description);
  }

  return {
    decision: "CLEAR",
    receipt: createReceipt(input.imageDataUrl, description, limitations),
  };
}

export function imageDigest(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  const encoded = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  return createHash("sha256").update(Buffer.from(encoded, "base64")).digest("hex");
}

export function inventorContextDigest(description: string): string {
  return createHash("sha256").update(normalizeInventorContext(description), "utf8").digest("hex");
}

export function normalizeInventorContext(description: string): string {
  return description.replace(/\r\n?/g, "\n").trim();
}

export function inferRevSafetyLimitations(description: string): RevImageSafetyLimitation[] {
  const normalized = normalizeInventorContext(description);
  const limitations = permittedFirearmIntents.filter(([pattern]) => pattern.test(normalized)).map(([, limitation]) => limitation);
  if (protectiveHazardIntent.test(normalized)) limitations.push(...hazardLimitations(normalized));
  return Array.from(new Set(limitations));
}

function createReceipt(
  dataUrl: string,
  description: string,
  limitations: RevImageSafetyLimitation[]
): RevImageSafetyReceipt {
  return {
    decision: "CLEAR",
    imageDigest: imageDigest(dataUrl),
    inventorContextDigest: inventorContextDigest(description),
    checkedAt: new Date().toISOString(),
    policyVersion: REV_IMAGE_SAFETY_POLICY_VERSION,
    limitations: Array.from(new Set(limitations)),
  };
}

function hazardLimitations(description: string): RevImageSafetyLimitation[] {
  const limitations: RevImageSafetyLimitation[] = [];
  if (/\b(?:contain|contains|contained|containing|containment|enclosure|controlled\s+vent)\b/i.test(description)) limitations.push("containment-only");
  if (/\b(?:shield|shields|shielded|shielding|barrier)\b/i.test(description)) limitations.push("shielding-only");
  if (/\b(?:detect|detects|detected|detecting|detection|monitor|monitors|monitored|monitoring)\b/i.test(description)) limitations.push("hazard-detection-only");
  if (/\bremote(?:ly)?\s+(?:handle|handles|handled|handling)\b/i.test(description)) limitations.push("remote-handling-only");
  if (/\b(emergency response)\b/i.test(description)) limitations.push("emergency-response-only");
  limitations.push("verified-hazard-input-required");
  return Array.from(new Set(limitations));
}
