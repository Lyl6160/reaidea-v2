 ARCH-001 — Core Domain Model

Document ID: ARCH-001Version: 1.0 DraftStatus: Under Whiteboard ReviewRepository Location: blueprints/architecture/ARCH-001_Core_Domain_Model.md

Purpose

Define the permanent domain objects that form the foundation of reAIdea.

Every module, workflow, service, interface and future feature must identify which domain object it reads, changes or supports.

Why This Document Exists

This document reduces one fundamental uncertainty:

What are the stable objects that reAIdea is actually managing?

Without this definition, modules may create duplicate truth, overlapping responsibilities or conflicting records.

Core Domain Objects

1. Inventor

Represents the person using reAIdea to develop, evaluate or strengthen engineering work.

One Inventor may own or participate in many Projects.

Contains

Preferred workshop name

Account or session identity when implemented

Voluntarily provided experience and skills

Industries and interests

Working preferences

Project relationships

Ownership permissions

Does Not Contain

Project engineering truth

Project evidence

Project readiness

Project decisions

Those belong to the Project.

Version 1 Note

The broader future term may become Member because investors, manufacturers, researchers and others may use the workshop. Version 1 retains Inventor until a broader object is proven necessary.

2. Project

Represents one engineering challenge, invention, opportunity or evaluation.

Examples

Illuminated STOP/GO Sign

PowerPal Australia

Birthday Cake Shield

Contains

Project identity

Owner and authorised participants

Original observation

Engineering purpose

Engineering State

Evidence

Remaining uncertainties

Current direction

Readiness

Decisions

Files and references

Revision history

Engineering State

The Engineering State is the current engineering snapshot inside the Project.

It contains:

Current understanding

Current evidence

Greatest remaining uncertainty

Next responsible engineering step

The Engineering State is dynamic. The Project is the permanent container.

Golden Rule

One Project must maintain one source of engineering truth.

Perspectives may interpret the Project differently, but they must not create separate conflicting Project states.

3. Workshop

Represents the operating behaviour of reAIdea.

The Workshop does not own the invention or Project. It receives work, improves engineering understanding and returns a stronger Project state.

Contains

Foreman

Thinking Engine

Specialist benches

Perspectives

Workflow

Readiness logic

Validation behaviour

Routing rules

Workshop communication style

Responsibilities

Understand before challenging

Identify the greatest remaining uncertainty

Select the most useful next action

Bring the right specialist capability to the user

Maintain continuity across the engineering journey

Move the Project toward its next responsible readiness level

Does Not Contain

Ownership of user ideas

Independent Project truth

Duplicate versions of the Engineering State

4. Knowledge Vault

Preserves engineering knowledge that has crossed a meaningful threshold and may assist current or future Projects.

The Knowledge Vault is not a transcript store and is not raw AI memory.

Stores

Validated discoveries

Reusable engineering principles

Proven patterns

Lessons learned

References and evidence links

Approved design rationale

Cross-project knowledge where ownership and permission allow it

Does Not Store by Default

Entire conversations

Unverified speculation

Temporary emotional state

Every intermediate thought

Private Project information for reuse without permission

Golden Rule

Preserve engineering knowledge without preserving engineering clutter.

Relationships

INVENTOR
   │
   ├── owns or participates in
   ▼
PROJECT
   │
   ├── contains the Engineering State
   │
   └── is processed by
   ▼
WORKSHOP
   │
   ├── improves the Project
   └── preserves approved discoveries in
   ▼
KNOWLEDGE VAULT

Supporting States

Inventor State

May include:

Preferred name

Working preferences

Permissions

Project access

Voluntarily supplied experience

It must not claim to diagnose emotions or psychological conditions.

Project State

Contains the current engineering truth and readiness of one Project.

Workshop State

Contains workflow and orchestration information such as:

Current bench

Current perspective

Foreman routing status

Required information

Completed workshop actions

Knowledge State

Contains approved, versioned and permission-aware engineering knowledge.

Perspective Rule

Inventor, investor, manufacturer, customer, compliance and other perspectives are not separate domain objects and do not create separate engines.

They are lenses applied by the Workshop to the same Project.

Changing perspective changes the questions, not the truth.

Any discovery made through a perspective must return to the same Project and Engineering State.

Ownership Rule

The Project and its Engineering State belong to the user or authorised Project owners.

reAIdea is the custodian and engineering partner.

The Workshop must preserve:

User ownership

Access control

Project continuity

Engineering integrity

Clear separation between private and reusable knowledge

Core Invariants

One Inventor may own or participate in many Projects.

One Project maintains one Engineering State.

One Workshop may process many Projects.

One Thinking Engine serves multiple perspectives.

Perspectives must not duplicate Project truth.

The Workshop improves Projects but does not own them.

The Knowledge Vault stores threshold knowledge, not conversation clutter.

No module may silently move Project truth into another domain object.

Every write operation must identify the domain object it modifies.

Every future domain object must pass a KIS review before being introduced.

Module Ownership Test

Every module specification must answer:

Which domain object does this module belong to?

Which object does it read?

Which object does it modify?

Which object must it never modify?

What uncertainty does the module reduce?

Can the responsibility remain inside an existing object?

If these cannot be answered clearly, the module is not ready for construction.

KIS Review

Can Inventor be removed?

No. The workshop exists to work with a person.

Can Project be removed?

No. Engineering work requires a controlled container and single source of truth.

Can Workshop be removed?

No. It contains the behaviour that improves the Project.

Can Knowledge Vault be removed?

No. Without it, engineering learning is lost or trapped in conversations.

All four objects carry structural load.

Success Criteria

ARCH-001 succeeds when:

Every future module maps clearly to one or more core objects.

Project truth is never duplicated across perspectives or benches.

Developers can understand the domain model without knowing the technical stack.

Databases, APIs and UI can change without changing these core concepts.

A new engineer can explain the four objects after one reading.

Related Documents

CHARTER-001_reAIdea_COMPANY_CHARTER_v1.0_DRAFT.md

reAIdea_Constitution_v1.0_Draft

MODULE-001_Workshop_Door.md

MODULE-002_Project.md — next

WORKSHOP_MANUAL.md — future

ENGINEERING_STATE.md — future supporting architecture document

Revision History

Version

Status

Description

1.0 Draft

Under Whiteboard Review

Initial definition of Inventor, Project, Workshop and Knowledge Vault

Approval

Current Status: Under Whiteboard ReviewNext Review: Confirm the four objects before writing MODULE-002Proposed Next Document: MODULE-002_Project.md