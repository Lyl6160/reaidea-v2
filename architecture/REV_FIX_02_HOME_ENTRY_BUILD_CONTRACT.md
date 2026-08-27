# REV-FIX-02 Home Entry Build Contract

**Status:** FOUNDER VISUALLY APPROVED — CHECKPOINT READY
**Approved:** 27 August 2026
**Founder authorization:** `upload the new image you just refined as HOMEPAGE entry, and update github with out latest files for our new way forward`
**Reference:** Combined `REV-FIX-02.1` through `REV-FIX-02.4` Home entry walkthrough
**Phase / iteration:** Phase 5 — Documentation checkpoint / Iteration 3
**Active lane:** Lane 1 — Inventor Entry
**Baseline / rollback:** `b27f10e9bc651a9492d9b4872d59336f123af5b0`

## Outcome

Build the founder-approved Home as the truthful start of the user journey. A new isolated origin begins with no selected intent and a visibly inactive REV entry panel. Selecting one intent visibly opens the panel and moves focus to the description. Existing safe `ASK REV` plumbing remains available without expanding REV intelligence, provider, Core Creation or Workshop behavior.

## Exact visual authority

- Blank intent-gated Home: `visual-authority/home/VPB-HOME-004-approved-blank-intent-gated-home-2026-08-27.png`
- Dimensions: `1825 × 862` PNG
- SHA-256: `BE36A3F98E43A919BC59B873AF68C424B57081DDE03BBC21795E5EABF422B07F`
- Protected backdrop: `F5DC0F8BCA331B3137E04F155AEDF9A94CCD7F2A5F1F4062B15950EB02B496E2`
- Protected REV identity: `B385D98AAB0038940512D4780EA72CFD89CDB0921C10F651BA8BD5067DC49070`
- Intent icon refinement: `visual-authority/home/VPB-HOME-004A-approved-intent-icon-refinement-2026-08-27.png`
- Intent icon refinement dimensions: `1928 × 815` PNG
- Intent icon refinement SHA-256: `FB072D0EAFE55BA08A7CDE85101F55AF621F60E5B804AE813B20E2335BF9CC1B`
- Approved opening Home: `visual-authority/home/VPB-HOME-005-approved-opening-homepage-2026-08-27.png`
- Approved opening Home dimensions: `1825 × 862` PNG
- Approved opening Home SHA-256: `E3CEBF8DAC0B9F7D11B1BDC8AC56CBDF0BC6CAFD5C561F329D91A7DDD5E0E448`
- Founder-approved live brand amendment: `ReAlize · Engineer · ValidatIon`; REV initials orange, A and I blue
- Final Homepage entry: `visual-authority/home/VPB-HOME-006-approved-homepage-entry-2026-08-27.png`
- Final Homepage entry dimensions: `1825 × 862` PNG
- Final Homepage entry SHA-256: `122F5579FC5A34D219C42CC4C517C2F93C1543A3D7269A73415C3BDEBFA48B1F`

## Required states and controls

Initial state:

- no intent, description, upload, Project, Concept, ConceptGeometry, question, pulse, generated invention, Returning Project control or Workshop entry;
- the three intent cards own the visual emphasis;
- the complete REV entry panel remains present but dim and disabled;
- no API, provider or persistence operation occurs on load.

Intent selected:

- the selected card gains clear blue/gold state without relying on color alone;
- the REV entry panel becomes active and focus moves to the description;
- intent selection alone creates no Project and makes no API/provider call;
- the exact choices are `DEVELOP AN INVENTION`, `EVALUATE AN INVENTION`, and `DEVELOP + EVALUATE`.
- `DEVELOP AN INVENTION` uses the approved blue-white plasma ignition with a warm-gold engineered core;
- `EVALUATE AN INVENTION` uses the approved cyan scanning lens with restrained gold inspection detail;
- `DEVELOP + EVALUATE` uses the approved gold and cyan energy streams converging into one white engineered core;
- this refinement changes icons only; card architecture, wording, state and interaction remain unchanged.

Entry controls:

- the description and optional image select/preview/change/remove controls retain their existing safe behavior;
- `ASK REV` remains unavailable until intent and description exist and any image selection is valid;
- `ASK REV` retains the accepted safety-before-Project and single-Project plumbing;
- `HOW IT WORKS` and `WHAT REV DOES` remain real in-page navigation;
- advanced REV responses, providers, Creation Theatre and Workshop progression are outside this build.

## Exact file boundary

Production and focused test paths:

- `app/page.tsx`
- `app/page.test.mjs`
- `app/components/HomeVisualShell.tsx`
- `app/components/HomeVisualShell.module.css`

Authority and continuity paths:

- `CURRENT_CONSTRUCTION_STATE.md`
- `architecture/BUILD_LANES.md`
- `architecture/PAGE_BLUEPRINT_REGISTER.md`
- `architecture/REAIDEA_FLIGHT_PLAN.md`
- `architecture/REV_FIX_02_HOME_ENTRY_BUILD_CONTRACT.md`
- `architecture/SUPERSESSION_REGISTER.md`
- `architecture/VISUAL_AUTHORITY_REGISTER.md`
- `continuity/ACTIVE_HANDOFF.md`
- `continuity/DAILY_INDEX.md`
- `continuity/daily/2026-08-27/DAILY_LOG.md`
- `continuity/daily/2026-08-27/EVIDENCE_INDEX.md`
- `visual-authority/SCREEN_INDEX.md`
- `visual-authority/home/VPB-HOME-004-approved-blank-intent-gated-home-2026-08-27.png`
- `visual-authority/home/VPB-HOME-004-authority-2026-08-27.md`
- `visual-authority/home/VPB-HOME-004A-approved-intent-icon-refinement-2026-08-27.png`
- `visual-authority/home/VPB-HOME-004A-authority-2026-08-27.md`
- `visual-authority/home/VPB-HOME-005-approved-opening-homepage-2026-08-27.png`
- `visual-authority/home/VPB-HOME-005-authority-2026-08-27.md`
- `visual-authority/home/VPB-HOME-006-approved-homepage-entry-2026-08-27.png`
- `visual-authority/home/VPB-HOME-006-authority-2026-08-27.md`

Every other repository path is prohibited. In particular, do not change `app/api/**`, `app/lib/**`, Workshop source, providers, storage, Project schemas, dependencies, configuration, public assets, fixtures, generated runtime data or `REAIDEA_ARCHITECTURE_GUIDE.md`.

## Protected behavior

- one canonical Project and the existing safety-before-persistence boundary;
- zero Project/provider operation from load, intent selection, typing or local image selection;
- existing source-evidence validation and separation;
- no automatic Workshop navigation;
- no fake progress, percentage, readiness, checkmark or generated invention;
- approved assets remain byte-identical;
- approved Home architecture, plasma, REV scale/floor position and workstation strip remain unchanged during this icon-only iteration;
- accessible labels, keyboard selection, focus visibility and reduced-motion behavior.

## Security, privacy and cost

Home text and images remain confidential untrusted input. This build adds no endpoint, external request, provider operation, persistence authority, unsafe HTML or dependency. Client gating supports usability; the existing guarded action remains the enforcement boundary. Production identity, object authorization, encrypted server storage and abuse controls remain unresolved and out of scope. Test data must not contain real confidential invention information.

## Acceptance

- focused Home orchestration test;
- lint, TypeScript no-emit, production build and `git diff --check`;
- isolated-origin browser proof at desktop, `1100 × 800` and `390 × 844`;
- initial panel and controls truth, three intent paths, keyboard/focus, responsive overflow and no Returning Project control;
- zero API/provider/storage operation before deliberate `ASK REV`;
- founder live visual walkthrough.

Stop at `TECHNICALLY VERIFIED — AWAITING FOUNDER VISUAL WALKTHROUGH`. Do not advance the reference, stage, commit or push.

## Technical verification — 27 August 2026

- `VPB-HOME-006` is the final exact desktop opening presentation, with the founder-approved plasma, REV floor position, detailed eight-station geometry, refined intent icons and corrected blue A, orange E and blue I treatment without ghosting;
- all three intent choices open the REV panel and move focus to the description;
- `ASK REV` remains locked without a description;
- Home navigation remains in-page and no Workshop route is entered;
- focused Home test, TypeScript, lint, production build and `git diff --check` pass;
- the protected backdrop and REV asset hashes remain unchanged;
- the isolated browser recorded Home GET requests only and no API/provider request;
- compact responsive visual acceptance remains part of the founder walkthrough;
- lint retains three pre-existing Workshop image warnings and no errors;
- isolated-origin walkthrough used `http://localhost:43117/` with only Home GET requests and no API/provider operation;
- responsive CSS compiles; final desktop and compact visual acceptance remains founder-only.
