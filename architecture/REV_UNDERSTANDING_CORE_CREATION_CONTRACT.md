# REV Understanding to Core Creation Contract

**Status:** Founder-approved correction direction — documentation only; implementation is not authorized

**Recorded:** 26 August 2026

**Applies to:** REV Intelligence routing into initial Core Creation

**Protected baseline:** `4171b8ee426ff7703617e3062b59ac5e5cdf4f8c`

## Authority and purpose

This contract corrects the representation-routing limitation isolated as `FAIL-3D-001`. It operates beneath the [Founder Product Constitution](../FOUNDER_PRODUCT_CONSTITUTION.md), the [Flight Plan](REAIDEA_FLIGHT_PLAN.md), the [Secure-by-Design AI Engineering Standard](../SECURITY_ENGINEERING_STANDARD.md), and the protected [3D Design Journey](3D_DESIGN_JOURNEY.md).

The inventor's explicit natural-language description leads representation routing. An optional photograph or sketch is supportive, derived and non-authoritative. A safety decision of `CLEAR` means the supplied content may proceed through the applicable safety boundary; it does not give an image authority to redefine the invention described by the inventor.

No implementation, provider operation, retry, Project mutation or browser-storage action is authorized by this document. A future implementation requires a founder-approved Build Contract with an active lane, exact file boundary, acceptance evidence and rollback point.

## Proven failure boundary

The controlled `FAIL-3D-001` observation established:

- `/api/creation-intent` returned HTTP `200`;
- `/api/understanding/image` returned HTTP `200` with a `CLEAR` safety receipt;
- a non-authoritative interpretation and matching evidence reference were returned and Home displayed `WHAT REV CAN SEE`;
- request construction then returned `REV could not form one supported visual concept from this submission.`;
- no `/api/concepts/generate` request occurred and no Workshop navigation occurred.

The current request-construction boundary combines the canonical description with bounded derived visual interpretation and refuses before generation when its provisional visual mode is `unknown` or `mixed`. That refusal is a truthful guard, but allowing a supportive lifestyle/reference image to outweigh an explicit physical-product description is an unintended routing limitation.

## Representation authority

Representation routing follows this precedence:

1. **Inventor description:** the explicit statement of what is to be created and the leading routing authority.
2. **Inventor-confirmed answers:** deliberate clarification of a representation blocker; these refine rather than replace accepted information.
3. **Optional image evidence:** supportive source evidence that may clarify appearance, use context, components or constraints.
4. **REV image interpretation:** derived, non-authoritative and source-linked; it may support or qualify routing but may not silently contradict or replace the explicit description.
5. **REV working assumptions:** labelled, reversible details used only to continue useful work when they do not materially change the invention.

A `CLEAR` lifestyle or reference image must not override an explicitly described physical product. Conflicting signals must remain visible as a routing reason or become one smallest question; they must not silently change the product class or select an unrelated representation.

## Readiness contract

REV determines whether the accepted information is sufficient to begin Concept 01. The user-facing meaning of readiness is exactly:

> REV understands enough to create your first concept.

Readiness does not mean complete understanding, feasibility, validation, engineering approval, safety approval, patentability, commercial proof or probability of success.

The Understanding meter measures captured Project information needed to begin useful creation. It must not measure model confidence, completion probability, feasibility or eventual success, and it must not display fake percentages or timer-driven progress.

## Ready path

When enough information exists, REV must:

1. select a supported visual mode from the accepted description, using optional evidence only as support;
2. retain the supporting-signal labels that explain the routing without retaining raw confidential content in diagnostics;
3. record any sensible inferred dimensions, proportions, materials or arrangement as labelled REV working assumptions;
4. begin Concept 01 exactly once through the accepted initial Core Creation transaction;
5. preserve the existing safety checks, canonical Project ownership, provider-independent generation boundary, candidate validation, candidate/source binding, geometry validation, persistence/reload verification and Workshop navigation;
6. preserve the truthful Visual Concept fallback whenever genuine validated geometry is unavailable; and
7. preserve the single centre-podium `Prototype3DViewer` mount and one-Canvas foundation.

No silent product default is permitted. A working assumption may refine a supported representation; it may not invent the product class merely to make generation proceed.

## Representation-blocked path

If the visual mode remains genuinely `unknown` or `mixed`, REV must not fall into generic `CREATION PAUSED` handling. It must:

1. retain the same canonical Project and all information already accepted;
2. ask exactly one smallest representation-blocking question whose answer materially selects or clarifies the output form;
3. provide bounded choices appropriate to the known alternatives, including **I'M NOT SURE / LET REV RECOMMEND**;
4. explain the distinction in plain language without asking the inventor to repeat accepted information;
5. perform no provider generation until readiness is resolved;
6. resume the same transaction and Project deliberately after the inventor answers; and
7. prevent double submission, duplicate Project creation and hidden provider retry.

`LET REV RECOMMEND` authorizes REV to select from supported modes using recorded evidence and labelled assumptions. It does not authorize an arbitrary product default, fabricated certainty or unsupported 3D.

## Service principles

The correction preserves these governing principles:

- **Tell REV Once:** accepted information follows the same Project.
- **KIS:** keep the inventor interaction direct, understandable and low friction.
- **Smallest Question:** ask only the one question that materially unblocks representation.
- **REV Does More Work:** REV performs interpretation, routing, assumption labelling and preparation behind the scenes.
- **Inventor authority:** the inventor may accept, reject, correct or defer REV's recommendation and remains the final decision-maker.
- **No fake certainty or progress:** a selected mode is a creation routing decision, not proof that the design will work.

## Safe diagnostic contract

Diagnostics for this boundary may retain only bounded operational metadata:

| Field | Allowed value | Prohibited content |
| --- | --- | --- |
| `mode` | Supported visual-mode enum, `mixed` or `unknown` | Raw description, prompt or image data |
| `reason` | Bounded safe reason code | Keyword matches, internal policy detail or provider payload |
| `supportingSignalLabels` | Allow-listed labels such as `explicit-physical-product`, `supporting-lifestyle-image`, `representation-conflict` | Quoted inventor text or reconstructed image content |
| `phase` | Bounded transaction phase such as `request-construction` | Stack traces or secret-bearing runtime detail |
| `category` | Bounded safe failure/hold category | Raw exceptions, credentials or personal data |

The diagnostic contract must not retain raw descriptions, prompts, image bytes, derived visual prose, provider responses, credentials or source evidence. User-facing smallest-question wording belongs to the active interaction state, not to an operational receipt containing confidential content.

## Acceptance fixtures

A future provider-free fixture suite must prove:

1. A physical wearable description plus a lifestyle photograph routes from the explicit physical-product description; the image remains supportive.
2. A physical-product description without an image selects a supported mode when the text is sufficient.
3. A genuinely mixed representation request asks one smallest representation-blocking question and performs no generation.
4. A genuinely unknown request asks one smallest representation-blocking question and performs no generation.
5. The smallest-question answer resolves the mode without repeating or discarding accepted information.
6. The same canonical Project resumes without duplicate Project or transaction creation.
7. Provider-operation count remains zero before readiness.
8. Provider generation begins exactly once after readiness and deliberate continuation.
9. The Visual Concept fallback remains truthful when geometry is unavailable, invalid or mismatched.
10. The one-Canvas 3D foundation, candidate/source binding and centre-podium ownership remain unchanged.

The fixtures must also assert that no raw confidential input enters operational diagnostics and that no timer, percentage or unverified completion state is introduced.

## Explicit prohibitions

- No surf-sunglasses, wearable, STOP/GO or other invention-specific special case.
- No silent `product`, `image` or other default used to bypass genuine uncertainty.
- No optional image promoted above the inventor's explicit description.
- No second Project, parallel intake truth or repeated accepted question.
- No provider call before readiness and deliberate action.
- No 2D image represented as validated Interactive 3D.
- No weakening of creation-intent, reference-image or generated-output safety gates.

## Future implementation gate

This correction begins in REV Intelligence and hands off to the protected Core Creation transaction. Before implementation, the Build Contract must identify whether the change can remain in one active lane or needs an approved bounded cross-lane decision. It must name the exact source/test boundary, preserve the current Project and persistence schema unless separately justified, define rollback to the protected baseline, and pass the fixtures above plus the existing Build 1E-S, initial Core Creation, candidate-storage, geometry-binding, Workshop restoration and one-Canvas tests.

## Security posture

**PASS WITH RISKS** for the documentation contract.

- **Threats considered:** image-derived authority escalation, confidential input leakage, hidden provider cost, duplicate creation, unsafe-content bypass, fabricated representation and cross-Project resume.
- **Controls required:** explicit authority precedence, bounded diagnostics, provider-free readiness, deliberate continuation, same-Project binding, defence-in-depth safety and output validation.
- **Open risks:** the implementation boundary and UI state contract are not yet approved or verified; production authentication, Project-level object authorization, rate limiting, replay protection and secure server persistence remain incomplete.
- **Residual risk:** a future routing implementation may still misclassify novel inventions; it must fail into one smallest question rather than a silent default.
- **Production requirement:** do not describe reAIdea as production-ready or security-verified without retained evidence for the production controls in the security standard.
