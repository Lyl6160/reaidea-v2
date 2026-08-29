# reAIdea Founder Visual Lock Standard

**Status:** FOUNDER DIRECTED — mandatory from 28 August 2026
**Authority:** Founder direction `ok lock it in, no deviation from my approval`

## Non-negotiable rule

A founder-approved image is immutable authority, not inspiration. No Codex agent, sub-agent, image model or implementation tool may regenerate, redraw, rescan, restyle, recolour, recompose, crop, replace, patch over or silently reinterpret any approved part of that image.

The founder approves the complete visible result. Approval of one image never authorizes a different composition that merely uses similar components.

## Hard gate

Before any visual work, every agent must:

1. identify the exact approved source by Visual Page Blueprint ID, repository path and SHA-256;
2. run `node scripts/verify-founder-visual-lock.mjs` and stop on any mismatch;
3. name the one screen/state and one requested visual change;
4. prove that clean source layers exist for the requested transition; and
5. remain read-only if the approved source is flattened in a way that prevents unchanged pixels from being preserved.

A flattened screen containing controls from one state must never be used as the backdrop for another state. Hiding old controls with masks, opaque panels, generated repainting or repeated CSS patches is prohibited. The agent must stop and ask the founder for a clean source or a newly approved complete image.

## KIS approval sequence

1. Preserve the last approved screen unchanged.
2. Create one complete standalone next-state image outside production code.
3. Make only the founder-requested change. Add nothing else.
4. Show that single image immediately for founder approval or rejection.
5. On rejection, label it rejected and stop. Do not begin another attempt without founder direction.
6. On approval, register the exact file, dimensions, state and SHA-256.
7. Only then prepare or activate a bounded Build Contract and implement the approved screen.
8. Run the real founder walkthrough. Automated checks cannot grant visual approval.

There is no hidden polishing loop. If the first attempt cannot preserve the approved visual deterministically, stop before generation or implementation and explain the constraint in one short message.

## Mechanical protection

`visual-authority/FOUNDER_VISUAL_LOCK_MANIFEST.json` records the byte identity of the current protected visual authorities. `scripts/verify-founder-visual-lock.mjs` must pass:

- at login before any visual work;
- immediately before creating an approval image;
- before production implementation;
- after implementation; and
- at handover.

Hash verification protects approved asset bytes. It does not approve a rendered page. Where a future contract permits one defined changed region, the implementation must also provide a full-screen comparison proving that all pixels outside that region are unchanged. Any unexplained difference is a failure.

## Failure and time protection

- One failed visual attempt means stop and return to the founder; it does not authorize patching.
- No agent may spend repeated cycles on an unapproved design while the founder waits.
- Governance recording and broad technical checks occur after the founder sees the requested visual, unless a safety or integrity check is needed first.
- KIS means one screen, one state, one requested change, one preview and one founder decision.
- Agent capability, convenience or aesthetic preference never overrides founder approval.

## Rejected evidence

Rejected images, code experiments and walkthrough screenshots remain historical evidence only. They cannot be used as visual authority, design inspiration, fallback, implementation source or acceptance evidence.

## Stop rule

When approved authority, clean source layers, allowed change boundary, truthful runtime state or founder direction is unclear, stop. Do not infer. Do not redesign. Do not patch.
