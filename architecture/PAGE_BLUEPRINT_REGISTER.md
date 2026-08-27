# reAIdea Page Blueprint Register

**Status:** FOUNDER APPROVED — current page authority register
**Inventory date:** Updated 26 August 2026

## Status vocabulary

- **BUILT:** The route exists and performs its stated bounded purpose. This does not imply final visual or product acceptance.
- **PARTIAL:** The route exists but is incomplete, legacy-conflicted or awaiting acceptance.
- **PLANNED:** Required by the flight plan but not yet implemented as a route.
- **FUTURE:** A founder direction or possible surface whose product contract is not yet approved.

This register lists every current routable page and every named future page/surface identified by the architecture audit. New pages require a register update and bounded Build Contract before implementation.

## Current route inventory

### `/` — Home and Inventor Entry — PARTIAL

- **Purpose:** Low-friction entry into a live REV understanding loop and one truthful stored-3D initial creation transaction.
- **User action:** Select origin intent, describe once, optionally attach evidence, deliberately select `ASK REV`, answer one useful question at a time where needed, then select `ENTER WORKSHOP` only after stored 3D is ready.
- **REV work:** Pre-Project safety, optional image safety/understanding, one canonical Project, source-traced understanding, evidence-derived meter growth, smallest-question selection, Creation Theatre, Concept 01 fidelity/geometry validation, persistence and reload verification.
- **Data read/written:** Session-only form/denial context; on CLEAR only, one canonical Project, accepted answers, approved source evidence, operational receipt, validated candidate and source-bound geometry.
- **Security boundary:** Untrusted text/upload; bounded client preflight; provider-free server intent gate before Project creation; server validation; no secrets in browser code; explicit retry.
- **Approved appearance:** `VPB-HOME-001` remains the visual foundation; `VPB-HOME-002` controls the AI-understanding conversation state and `VPB-HOME-003` controls genuine blue-to-orange knowledge advancement. See `VISUAL_AUTHORITY_REGISTER.md`.
- **Current implementation:** Responsive Home, truthful no-percentage readiness, origin intent, image path, Creation Theatre and description-led routing are accepted foundations. The approved `ASK REV` loop, evidence-derived meter and stored-3D handover are not implemented.
- **Current reset qualification:** `VPB-HOME-006` is the final founder-approved Homepage entry for the `BLANK NEW PROJECT` state. The intent cards are the first active choice; the REV entry panel is dim and disabled until selection, then opens and receives focus. No Returning Project or Workshop entry appears. `VPB-HOME-004/004A/005` remain preserved approval evidence.
- **Next acceptance test:** Morning handover at the accepted Homepage entry checkpoint. REV-FIX-02.5 remains locked pending a separate founder direction. Compact responsive visual acceptance remains open.

### `/workshop` — Living Workshop — PARTIAL

- **Purpose:** Restore the active Project and present its current invention, benches, evidence context and next useful decision.
- **User action:** Inspect Visual Concept or validated 3D, orbit/fit/reset/joint-preview, enter full screen and navigate benches.
- **REV work:** Restore source-bound candidate, assess Workshop state, recommend a truthful bench/decision and expose available information.
- **Data read/written:** Reads canonical Project and Project-scoped candidate; bench actions may use existing canonical Project writers. Refresh must not generate.
- **Security boundary:** Candidate/Project/revision binding; safe React text rendering; no cross-Project restoration; one Canvas; generated images remain untrusted until validated.
- **Approved appearance:** `VPB-WORKSHOP-001` and `VPB-JOURNEY-001` retain the sign-free room and one-Canvas podium foundation; `VPB-JOURNEY-002` controls the same-stored-3D arrival composition with REV extending both hands.
- **Current implementation:** B2A, B2B-1 and B2B-2 functional presentation checkpoints are accepted. The two-hands arrival layer and strict initial stored-3D entry gate are not implemented. B2B-3A remains experimental on its archive branch.
- **Next acceptance test:** After HAI and source-aware geometry contracts, verify deliberate entry restores the exact persisted geometry with zero regeneration and one Canvas. Any presentation change still requires its own blueprint/contract.

### `/discovery` — Legacy Discovery Door — PARTIAL

- **Purpose:** Existing route introducing a structured Discovery session.
- **User action:** Enter Discovery or return Home.
- **REV work:** None material at the route; it introduces the legacy session.
- **Data read/written:** No canonical Project write by the route itself.
- **Security boundary:** Safe static rendering and navigation.
- **Approved appearance:** None current. Older Workshop-door presentation is historical only.
- **Current implementation:** Route exists, but the normal long-question journey is superseded by Tell REV Once and output before questions.
- **Next acceptance test:** Founder decides retire, redirect or repurpose; no cosmetic work before that decision.

### `/discovery/session` — Legacy Discovery and Engineering Review — PARTIAL

- **Purpose:** Existing mission flow plus extensive Project review, validation, conclusion, direction, action and result controls.
- **User action:** Answer legacy missions and deliberately record Project engineering/validation records.
- **REV work:** Deterministic mission/Workshop assessment and trace presentation.
- **Data read/written:** Reads and writes canonical Project through established writers; includes evidence, validation, conclusion, direction, action and result records.
- **Security boundary:** Browser persistence is prototype-only; production requires identity and Project authorization. User text is rendered through React, not unsafe HTML.
- **Approved appearance:** None current.
- **Current implementation:** Valuable Project truth tooling is built, but the mission questionnaire conflicts with the current default journey. The engineering review capabilities need a future home in Workshop/evidence architecture.
- **Next acceptance test:** Founder and architect decide which read/write capabilities migrate, remain internal or retire without losing evidence semantics.

### `/interview` — Legacy Knowledge Interview — PARTIAL

- **Purpose:** Existing five-category knowledge capture and history review.
- **User action:** Enter and update problem, customer, existing-solution, advantage and outcome statements.
- **REV work:** Categorizes and presents recorded entries; no provider work.
- **Data read/written:** Reads inventor preference and canonical Project; writes knowledge entries through the existing Project path.
- **Security boundary:** Confidential inventor text; production authorization and server persistence are absent.
- **Approved appearance:** None current.
- **Current implementation:** Route exists, but a required five-step interview is not the approved default experience. Useful facts should be routed from Tell REV Once or requested as one smallest question.
- **Next acceptance test:** Founder decides retire, repurpose as an optional evidence review, or integrate its records into the Inventor/Marketing benches.

### `/dashboard` — Workshop Compatibility Redirect — BUILT

- **Purpose:** Preserve compatibility by redirecting to `/workshop`.
- **User action:** None beyond navigation.
- **REV work:** None.
- **Data read/written:** None.
- **Security boundary:** Server redirect only; future authenticated routing must enforce Project authorization.
- **Approved appearance:** Not applicable; the route has no rendered page.
- **Current implementation:** Redirects directly to Workshop.
- **Next acceptance test:** Retain redirect coverage when authenticated Project routing is introduced.

## Planned and future page/surface register

### Account and secure access — PLANNED

- **Purpose:** Authenticate inventors and establish a secure session.
- **User action:** Sign in, recover access and sign out.
- **REV work:** None; REV must not become the identity authority.
- **Data read/written:** Account/session records only, separate from invention evidence.
- **Security boundary:** Strong session security, credential isolation, abuse controls and privacy disclosures.
- **Approved appearance:** Missing; founder decision required.
- **Current implementation:** No production identity system.
- **Next acceptance test:** Threat model, session fixation/CSRF/authorization negative tests and founder UX approval.

### Project Library / Returning Project — PLANNED

- **Purpose:** List and open only Projects the authenticated inventor is authorized to access.
- **User action:** Create, open, rename, export or request deletion within policy.
- **REV work:** Summarize status only from authorized Project data.
- **Data read/written:** Project metadata through server-authorized storage.
- **Security boundary:** Deny-by-default object authorization and no identifier enumeration.
- **Approved appearance:** Missing; the current RETURNING PROJECT control is a direction, not a completed page authority.
- **Current implementation:** Home links directly to local `/workshop`; browser storage holds one prototype Project.
- **Next acceptance test:** Cross-account/cross-Project denial, empty/loading/error states and founder journey review.

### REV Project Board overlay — FUTURE

- **Purpose:** Reveal evidence, assumptions, decisions, materials, manufacturing, risks, specialist findings and history without cluttering the active bench.
- **User action:** Open the edge control, inspect Project intelligence and return to the bench.
- **REV work:** Assemble authorized read models from the same canonical Project.
- **Data read/written:** Read-only by default; any adopted decision uses an existing canonical writer.
- **Security boundary:** Same Project authorization as Workshop; no separate evidence store, timeline or Canvas.
- **Approved appearance:** Whiteboard-style sliding overlay direction only; no approved final asset.
- **Current implementation:** Not implemented.
- **Next acceptance test:** Founder approves information hierarchy, desktop partial overlay, near-full-screen mobile behavior and Back to Bench control.

### Evidence and Validation report — PLANNED

- **Purpose:** Present traceable evidence, tests, decisions, limitations and unresolved risks for review/export.
- **User action:** Filter, inspect sources and deliberately adopt or reject a conclusion where authorized.
- **REV work:** Organize source-bound evidence and identify contradictions/gaps.
- **Data read/written:** Reads Project evidence/history; writes only deliberate decisions through canonical writers.
- **Security boundary:** Project authorization, safe external links, export controls and confidential-data handling.
- **Approved appearance:** Missing; founder decision required.
- **Current implementation:** Relevant controls exist inside the legacy Discovery session but not as an approved page.
- **Next acceptance test:** Evidence provenance, no-fake-proof language, export security and founder information review.

### Privacy, export and deletion — PLANNED

- **Purpose:** Let an inventor understand retention and exercise export/deletion rights.
- **User action:** Review policy, export Project data, request deletion and confirm consequences.
- **REV work:** Explain scope without making policy decisions.
- **Data read/written:** Account/Project lifecycle records and auditable deletion requests.
- **Security boundary:** Reauthentication, authorization, secure archives, retention and recoverability policy.
- **Approved appearance:** Missing; founder decision required.
- **Current implementation:** Not implemented.
- **Next acceptance test:** Complete lifecycle and backup/deletion evidence.

### Billing and limited paid-beta controls — FUTURE

- **Purpose:** Support a limited paid beta only after production gates pass.
- **User action:** Review plan/cost limits and manage billing.
- **REV work:** None beyond truthful usage explanation.
- **Data read/written:** Billing identity, entitlements and usage limits; never provider credentials.
- **Security boundary:** Payment-provider isolation, authorization, webhook validation, quota and dispute handling.
- **Approved appearance:** Missing, and no founder-approved pricing model exists.
- **Current implementation:** Not implemented.
- **Next acceptance test:** Founder approves commercial model after product/security exit gates and demand evidence.

## Register rule

A route's existence does not make its wording, workflow or appearance current authority. Any new or materially changed page must update this register, identify its active lane and pass its recorded acceptance gate.
