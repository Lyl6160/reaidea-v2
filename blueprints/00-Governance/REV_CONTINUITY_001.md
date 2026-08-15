# REV_CONTINUITY_001 — reAIdea Continuity Record

**Document ID:** REV-CONTINUITY-001  
**Version:** 1.0  
**Status:** Approved Continuity Baseline  
**Repository Location:** `blueprints/00-Governance/REV_CONTINUITY_001.md`  
**Purpose:** Restore reAIdea design continuity in a fresh chat or development session before any architecture, code, UI, or reasoning changes are made.

---

# 1. Activation Phrase

Use this exact phrase at the start of a new chat:

> **REV-CONTINUITY-001 — reAIdea. Read the continuity record first. KIS. Walk Around It. One Project. One Engineering Truth.**

The phrase alone does not carry authority.

The continuity record, the current repository state, approved blueprints, and current Project state are the authority.

---

# 2. Continuity Rule

A fresh chat must not redesign reAIdea from the code it happens to see.

Before making any design or code decision it must:

1. Read this continuity record.
2. Inspect the current repository / latest uploaded ZIP.
3. Read the relevant approved blueprint documents.
4. Preserve established engineering truth.
5. Identify whether a proposed change is:
   - construction,
   - bug repair,
   - UX refinement,
   - blueprint change,
   - or architectural change.
6. Architectural or philosophical changes require deliberate review with the Chairman before implementation.

> **Do not infer the product from legacy screens. The approved design outranks old prototype UI.**

---

# 3. REV Identity

REV is the engineering partner inside reAIdea.

REV is not a mascot, generic chatbot, motivational character, or all-knowing authority.

REV behaves like an experienced senior engineering partner:

- calm,
- curious,
- evidence-driven,
- practical,
- respectful,
- willing to challenge,
- willing to admit uncertainty,
- focused on the next useful engineering step.

Canonical behavioural line:

> **Challenge the idea. Respect the inventor. Follow the evidence.**

REV must never confuse confidence with evidence.

REV does not dominate the inventor.

REV helps the inventor think more clearly.

---

# 4. Core Workshop Habits

## KIS

**Keep It Simple.**

When complexity begins to engulf the work:

- stop,
- stand back,
- remove unnecessary parts,
- rethink the process,
- choose the simplest structure that still carries the engineering load.

KIS does not mean simplistic.

It means complexity must earn its place.

## Walk Around It

Before committing to an important decision:

- observe it,
- change perspective,
- challenge assumptions,
- consider fabrication / implementation,
- consider use,
- consider evidence,
- then decide.

The design may be technically correct and still be impractical.

---

# 5. reAIdea Core Definition

reAIdea helps people make better engineering decisions by reducing uncertainty until the next responsible step becomes clear.

It is not primarily a chatbot.

It is experienced as an engineering workshop.

The workshop may contain complex reasoning internally, but the inventor-facing bench must remain clear and focused.

> **The workshop can be complicated. The bench should not be.**

---

# 6. One Workshop

There is one workshop.

Do not build separate inventor and investor engines.

Different users or roles may view the same Project through different perspectives.

Changing perspective changes the questions.

It must not change the engineering truth.

---

# 7. One Project. One Engineering Truth.

Every Project maintains one authoritative engineering state.

Do not create competing Project models, duplicate project brains, separate investor truth, separate inventor truth, or conflicting storage records.

The Project is more important than the conversation.

Conversations may disappear.

Engineering truth must persist.

---

# 8. Original Observation

The user's first input is preserved.

It may be:

- an observation,
- an idea,
- a proposed solution,
- a complaint,
- a failure,
- a half-formed thought.

Do not reject it because it is not written as a perfect engineering observation.

Preserve it exactly as the Project's **Original Observation**.

Then Discovery may work backwards to understand the underlying problem.

> **Original Observation must never be silently overwritten.**

---

# 9. Preferred Workshop Name

Module 001 includes an optional field:

> **What would you like us to call you?**

This is not authentication.

It creates a respectful working relationship.

Use the preferred name naturally.

Never hard-code a user's name into source code.

If no preferred name is given, continue naturally without one.

---

# 10. Workshop Door

The Workshop Door is part of reAIdea's identity, not disposable decoration.

Approved visual / experiential elements include:

- dark professional engineering workshop atmosphere,
- Living Engineering Symbol / canonical reAIdea mark,
- subtle illuminated footsteps / steps indicating a journey,
- engineering symbols on workshop walls representing broad engineering domains,
- wall symbols may glow / reveal meaning on hover rather than clutter the scene with labels,
- central inventor bench,
- curiosity before instruction,
- workshop environment rather than generic corporate landing page.

Approved opening language centres on:

> **What have you observed?**

Do not revert to generic AI language such as:

- "Enter prompt"
- "AI interview"
- "Start my innovation"
- "Your AI Innovation Consultant"

The richer Workshop experience may be layered over the tested engine, but must not be forgotten or redesigned from scratch without review.

---

# 11. Discovery Responsibility

Discovery exists to reduce uncertainty until the real engineering problem becomes visible.

Discovery does not rush to a solution.

Discovery should:

- understand what the inventor means,
- separate observation from assumption where useful,
- identify evidence position,
- identify constraints when already supplied,
- identify the greatest remaining uncertainty,
- ask the next best question,
- avoid asking for information already supplied,
- explain why a question matters when useful.

Important behaviour:

> **Understand before challenge.**

Useful inventor-facing capability:

> **WHY THIS QUESTION**

This may later be collapsible for KIS, but the reasoning transparency is valuable.

---

# 12. Engineering State

The Engineering State belongs inside the Project.

The inventor-facing minimum is:

- Current Understanding
- Current Evidence / Evidence Position
- Greatest Remaining Uncertainty
- Next Engineering Step

As Discovery matures, useful structured signals may also include:

- Potential Assumptions
- Constraints
- Consequences
- Validation gaps

Do not expose every internal field at equal visual weight.

Detailed state remains available for auditability, but the user should normally see the next important thing first.

---

# 13. Evidence Rule

The inventor provides real-world evidence.

REV reasons about what that evidence means.

The Project stores the resulting engineering state.

Do not make the inventor perform REV's reasoning.

Specifically:

The inventor should not be required to select an internal conclusion such as:

- Supported by evidence
- Understanding refined
- Understanding challenged
- Inconclusive

Those may remain valid internal engineering-state outcomes.

REV should assess / propose the effect of the evidence and explain why.

Then the inventor may confirm, correct, or discuss REV's interpretation.

> **Evidence comes from the inventor. Reasoning belongs to REV. Engineering State belongs to the Project.**

Synthetic evidence may be used during software acceptance tests only when clearly labelled **TEST / SYNTHETIC DATA**.

Synthetic acceptance-test evidence must never become indistinguishable from real Project evidence.

---

# 14. Validation

Discovery should not continue indefinitely.

When enough understanding exists to proceed responsibly, REV may create a targeted Validation Plan from remaining evidence gaps and assumptions.

Approved checkpoint language:

> **Sufficient understanding to continue responsibly.**

Validation activities may contain:

- target uncertainty / assumption,
- validation method,
- evidence required,
- completion criteria,
- status.

Validation does not require a binary yes / no outcome.

A result may:

- support,
- refine,
- challenge,
- or remain inconclusive.

REV must keep unresolved uncertainty alive when evidence is insufficient.

---

# 15. Sprint 006 Trial Findings

The following behaviours were demonstrated during Builds 1–5 and are considered valuable unless later evidence proves otherwise.

## Build 1

- Project handoff worked.
- Preferred name carried into Discovery.
- Original Observation remained preserved.
- Project persistence survived browser refresh.

## Build 2

- Discovery reasoning layer added.
- Next question selected from the current Project / Engineering State rather than a rigid interview sequence.
- Discovery reasoning survived lint, TypeScript, production build, and live testing.

## Build 3

- Mixed inventor responses were separated into useful signals:
  - evidence,
  - assumptions,
  - constraints,
  - current understanding.
- Discovery avoided re-asking constraints already supplied.
- Next question moved toward the greatest remaining uncertainty.

## Build 4

- Discovery could reach a responsible checkpoint.
- Remaining uncertainty converted into targeted Validation activities.
- Validation Plan persisted after refresh.

## Build 5

Useful:
- Validation execution workflow exists.
- Activity states such as PLANNED / IN PROGRESS / COMPLETED exist.
- Evidence/results can update Engineering State.
- Inconclusive evidence can keep uncertainty alive.

Known issue:
- Validation 1 could complete.
- Validation 2 did not correctly open its input / execution form.
- This is treated as a software state/UI bug, not a reason to redesign Validation.

Important UX finding:
- The inventor should not select the effect evidence has on the Engineering State.
- REV should perform that reasoning.

---

# 16. Anti-Drift Rules

---

# 18. Current HP-24.7 REV Continuity

HP-24.7 is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint after Build 4, commit `f4dbcf9`, on branch `sprint006-build24-7-engineering-traceability`. The final tag is `v24.7-engineering-traceability`.

REV now has deterministic, read-only trace awareness in Workshop orchestration. It can consume:


REV may summarize recorded history and recommend the next Workshop bench. REV does not autonomously mutate Engineering State, create Project decisions, create evidence, complete Validation, or write provenance.

HP-24.7 does not provide full inventor-statement provenance. Assumption identity, constraint identity, exact source-event lineage, explicit Concept evidence selection, specialist engines, and autonomous engineering decisions remain future capabilities. Missing historical provenance is acceptable; fabricated provenance is not.

Build 5 is not required for HP-24.7.

---

# 19. Current HP-24.8 REV Continuity

HP-24.8 is complete and verified through Build 4 at commit `841324f` on branch `sprint006-build24-8-engineering-provenance`, pending final freeze documentation commit and tag. The intended final tag is `v24.8-engineering-assertion-identity`.

The Project now supports stable identity for new Discovery-created assumptions and constraints, exact linkage from assumption-derived ValidationPlanItems, and identity-driven Validation lifecycle transitions. Engineering State remains the current snapshot; assertion records remain identity and lifecycle history.

REV remains read-only. Validation outcomes do not become Project decisions. Source provenance, multi-source lineage, uncertainty identity, constraint Validation lifecycle, and other deferred layers remain future work.

HP-24.9 — Engineering Assertion Source Provenance is not started.

Build 5 is not required for HP-24.8.

---

# 20. Current HP-24.9 REV Continuity

HP-24.9 is complete and verified through Build 2 at commit `605c200` on branch `sprint006-build24-9-trace-aware-guidance`, pending final freeze documentation commit and tag. The intended final tag is `v24.9-trace-aware-guidance`.

REV now explains stored assertion and Validation context in the existing Workshop Brief. It distinguishes recorded Project facts, Validation facts, and REV guidance while remaining read-only. It does not create Project truth, decisions, evidence, provenance, or lifecycle transitions.

HP-24.9 Build 3 is not required. Source provenance, evidence selection, engineering decision writers, constraint/uncertainty expansion, specialist benches, and Workshop Validation unification remain future capabilities.

---

# 21. Current HP-24.10 REV Continuity

HP-24.10 — Engineering Assertion Source Provenance is complete, verified, tagged, pushed, and frozen at the final documentation checkpoint on branch `sprint006-build24-10-assertion-provenance`. The final tag is `v24.10-assertion-source-provenance`.

The Project supports forward-only explicit source provenance for new Discovery-created assertion identities. Discovery is the only production assertion provenance writer: during the same Project action, a new assumption or constraint stores the exact ID of its `discovery-answer-recorded` timeline event. One event may source multiple assertions. Existing duplicates are not enriched, legacy strings are not promoted, and reintroduced historical values receive a new identity and new source event.

Assertion source provenance is optional and structural. Missing historical source provenance remains missing. REV resolves sources only by exact stored assertion source ID against Project timeline event ID, preserving not-recorded, available, unavailable, and partially available states. Source answers where an assertion was recorded, not proof, complete causality, derivation, exact inventor wording, or Validation evidence.

The existing Workshop Brief distinguishes Recorded Project fact, Source, Validation, and REV guidance. Validation lifecycle updates do not rewrite assertion source provenance. REV remains read-only; ProjectDecision provenance, Interview knowledge, and Original Observation are not assertion provenance without an explicit future writer.

Manual/multi-source enrichment, supporting-source and derivation models, Interview/original-observation provenance, Concept evidence selection, engineering decision writers, constraint Validation lifecycle, uncertainty identity/lifecycle, specialist benches, and Workshop Validation unification remain deferred. Build 4 implementation is not required.
- Innovation Brain as a separate truth source
- Project Brain as a competing project model
- AI Confidence derived from word count
- Innovation Score used as engineering confidence
- duplicate project storage keys
- separate role engines that create separate truth

Old code may contain useful implementation work.

Do not delete legacy code merely because the name is old.

Inspect what it does first.

Keep useful mechanics.

Remove or rename only after deliberate comparison.

---

# 17. Repository / Construction Discipline

The repository is the long-term memory.

Chats are working rooms.

Approved documents live in the repository.

Current principle:

> **Preserve first. Modify second.**

Before a major refactor:

- create / retain a current ZIP snapshot,
- inspect current code,
- compare against approved design,
- classify changes as:
  - KEEP
  - MODIFY
  - REMOVE
  - RESTORE

Do not blindly roll back good code because it was written in a different chat.

Do not blindly keep code because it passes tests.

Passing tests proves implementation behaviour, not design alignment.

---

# 18. Current Development Machine Rule

The home PC is the primary and only development machine going forward.

Do not create workflows that depend on swapping between work and home computers.

Old work-PC ZIPs may be used as baseline evidence only.

---

# 19. REV Continuity Handshake Test

Before a fresh chat is trusted to make changes, ask it these questions.

## Q1
What does KIS mean inside reAIdea?

Expected:
Complexity must earn its place. Stop, stand back, simplify the process without weakening the engineering purpose.

## Q2
What does Walk Around It mean?

Expected:
Deliberately examine the same problem from multiple relevant perspectives before committing.

## Q3
Who supplies engineering evidence during real validation?

Expected:
The inventor / project team supplies real evidence. REV may define what evidence is needed and interpret evidence provided.

## Q4
Who decides what the evidence appears to do to current understanding?

Expected:
REV reasons about the evidence and proposes the effect. The inventor may confirm, correct, or discuss it.

## Q5
What happens to the Original Observation?

Expected:
It is preserved exactly and never silently overwritten.

## Q6
What is the relationship between Investor and Inventor perspectives?

Expected:
One Project, one Thinking Engine, one engineering truth. Perspectives change the questions, not the truth.

## Q7
What should REV do before proposing a solution?

Expected:
Understand the observation/problem, identify uncertainty, inspect evidence/assumptions/constraints, then reduce the most important uncertainty.

## Q8
What is the Workshop Door supposed to feel like?

Expected:
A professional engineering workshop with curiosity, footsteps / journey cues, engineering wall symbols, Living Engineering Symbol, inventor bench, and observation-first entry — not a generic chatbot form.

## Q9
What is more important: the chat or the Project?

Expected:
The Project. Conversations are temporary; engineering truth must persist.

## Q10
May a new chat redesign architecture because the current code suggests a different structure?

Expected:
No. It must read continuity / approved blueprints first and discuss any architectural change deliberately before implementing it.

---

# 20. Failure Condition

If a fresh chat cannot answer the handshake questions consistently:

> **Do not allow it to modify the repository.**

Re-upload:

- `REV_CONTINUITY_001.md`
- the latest lean source ZIP
- the relevant blueprint files

Then repeat the handshake.

---

# 21. Working Motto

> **Observe.**  
> **Walk Around It.**  
> **Keep It Simple.**  
> **Build With Evidence.**

And:

> **Challenge the idea. Respect the inventor. Follow the evidence.**

---

# 22. Continuity Status

This document records the approved continuity baseline after the Sprint 006 continuity failure between chat threads.

It is intentionally concise enough to restore operating context, but it does not replace:

- the Constitution,
- Core Domain Model,
- Module 001,
- Module 002,
- Foreman specification,
- Discovery Discipline,
- Project Lifecycle,
- current source code,
- current Engineering Review records.

Where conflicts arise:

1. Current approved controlled documents take precedence.
2. Current Project / source evidence is inspected.
3. Historical chat prose does not silently override controlled documents.
4. Architectural changes require deliberate review.

---

**END OF REV-CONTINUITY-001**
