Library
/
reAIdea
/
ENGINEERING_REVIEW_001.md


reAIdea Engineering Review 001
Review basis: Uploaded reaidea-v2.zip
Review type: Repository, architecture alignment, application flow, KIS compliance
Important: This ZIP is an earlier snapshot than the latest VS Code screenshots shown after upload. Findings below describe the ZIP itself, not necessarily the current working tree.

Executive Summary
The project has a strong conceptual foundation but the implementation snapshot is currently split between two generations:

Old product language and flow — “AI interview”, “Innovation Brain”, fixed five-question interview, innovation score, AI confidence.

New approved architecture — Workshop Door, Project, Foreman, Discovery Discipline, Engineering State, one source of engineering truth, “understand before challenge”, observation-first, KIS.

The biggest engineering task is therefore not adding features. It is aligning the code with the blueprint.

Review outcome
Architecture direction: Strong

Blueprint discipline: Strong and improving

Current code alignment: Partial

Technical debt: Moderate but manageable

KIS compliance: Mixed

Ready to continue building: Yes, after a short alignment/refactor sprint

Priority 0 — Protect the Repository
The uploaded ZIP is approximately 493 MB and contains:

.git/

.next/

node_modules/

Those folders account for almost all of the archive size.

Approximate raw contents:

node_modules: 423 MB

.next: 293 MB

.git: small but unnecessary in review archives

The normal unzip utility also reported an overlapping-components / malformed ZIP warning. Python was still able to read the central directory and extract the source files.

Required action
Do not include these folders in future review ZIPs:

node_modules/
.next/
.git/
A future review archive should contain source and controlled documents only and will likely be only a few megabytes.

Priority 1 — Fix Broken Discovery Routes
The repository contains the new route:

app/discovery/
app/discovery/session/
but the UI still links to the old route:

/interview
/interview/session
Examples in the ZIP snapshot:

Dashboard points to /interview

Discovery page points to /interview/session

These routes will not match the renamed discovery structure.

Required action
Standardise Version 1 on:

/discovery
/discovery/session
Remove “interview” from routes and user-facing language unless it has a specific approved purpose.

Priority 2 — Rebuild the Workshop Door Against MODULE-001
The current home page does not match the approved Workshop Door specification.

Current ZIP snapshot:

“Where Ideas Become Innovations”

“Describe your invention...”

“Start My Innovation”

no preferred-name field

no Living Engineering Symbol

no workshop environment

no engineering wall icons

no footsteps

no “What have you observed?”

routes directly to Dashboard

Approved Module 001 requires the first experience to be:

professional engineering workshop

optional preferred name

Living Engineering Symbol

subtle footsteps

engineering icons

“What have you observed?”

free-form observation

“Begin Discovery”

creation of Project / Engineering State

route into Discovery

Required action
Treat the existing app/page.tsx as a prototype and replace it from the Module 001 blueprint rather than incrementally patching the old innovation screen.

Priority 3 — Remove the Old “AI Interview” Product Model
The current Discovery pages still say:

“Your AI Innovation Consultant”

“AI Interview”

“Begin Interview”

“Estimated interview time: 15–20 minutes”

“Innovation Brain Complete”

“AI Confidence”

“Innovation Score”

This conflicts directly with the current reAIdea architecture.

The approved direction is:

Discovery reduces uncertainty until the real engineering problem becomes visible.

Discovery is not a fixed questionnaire and is not measured by the amount of text entered.

Required action
Retire the fixed “AI Interview” framing.

Discovery should eventually select the next best question based on the Project's current Engineering State.

Priority 4 — Confidence Calculation Is Not Engineering Evidence
innovationBrain.ts currently estimates confidence from answer length.

Examples:

80+ words → 95 confidence
50+ words → 88
30+ words → 80
...
Overall “AI Confidence” then derives from these word-count scores and completion percentage.

This violates a major approved principle:

Evidence before confidence.

A long answer is not necessarily more accurate, more complete, or better supported than a short answer.

Required action
Remove word-count-derived confidence from the engineering domain.

For Version 1, it is safer to use explicit states such as:

unknown
observed
assumed
supported
validated
or simply omit confidence until evidence logic exists.

Do not invent a numeric engineering confidence score just to fill the UI.

Priority 5 — Two Competing Project Models Exist
The ZIP contains two overlapping project representations.

Model A
app/lib/project.ts
ProjectBrain
Fields include:

problem

solution

customers

competitors

business model

manufacturing

patent status

funding status

confidence score

Model B
app/lib/core/projectCore.ts
ProjectCore
Fields include:

original idea

InnovationBrain

timeline

status

This violates the architecture rule:

One Project. One Engineering Truth.

Required action
Do not continue evolving both.

Consolidate around the approved Project model from:

ARCH-001_Core_Domain_Model

MODULE-002-Project

The Project should contain the Engineering State rather than several competing “brains”.

Priority 6 — The Original Observation Must Be Preserved
The approved architecture says the original observation is never overwritten.

But projectCore.ts currently provides:

updateOriginalIdea(...)
which replaces the stored original idea.

Required action
Separate:

originalObservation   // immutable
currentUnderstanding  // evolves
The system may refine its understanding, but the user's first observation should remain preserved.

Priority 7 — Preferred Name Is Missing From the Domain and UI
Module 001 explicitly approved:

“What would you like us to call you?”

The uploaded ZIP does not yet implement this field and instead hard-codes:

Hello Lyn.
Required action
Implement optional preferred name as part of the Inventor / Member state.

Never hard-code a person’s name into Discovery UI.

Fallback should simply omit the name naturally.

Priority 8 — Discovery Is Predetermined Instead of Reasoned
The current session uses five fixed questions:

Problem

Customer

Existing solution

Advantage

Outcome

This is a reasonable prototype, but it is not yet the approved Discovery Discipline.

The current reasoning engine simply checks which predetermined field is incomplete and chooses the next one.

That is checklist routing rather than engineering reasoning.

Required action
Keep the fixed questions only if explicitly labelled as a temporary prototype.

The intended architecture should move toward:

Current Understanding
Current Evidence
Greatest Remaining Uncertainty
Next Best Question
One carefully selected question at a time.

Priority 9 — Project Creation Flow Is Fragmented
The homepage currently writes:

reaidea-current-idea
to localStorage and sends the user to Dashboard.

The Project Core storage engine separately writes:

reaidea-project-core
The older project service separately writes:

reaidea-current-project
That means Version 1 currently has three different local-storage concepts for one engineering journey.

Required action
Create one Project through one Project repository/storage boundary.

The Workshop Door should create the Project once and Discovery should load that same Project.

Priority 10 — Blueprint Drift and Empty Placeholders
In this ZIP snapshot, several newly created architecture documents are empty:

ARCH-003_Project_Lifecycle.md
ARCH-004_Engineering_State.md
ARCH-005_Reasoning_Architecture.md
ARCH-006_Digital_Twin.md
Several module package files are also empty placeholders.

This is not inherently wrong during construction, but an empty file should not appear to be an approved controlled document.

Required action
Use explicit status markers:

STATUS: RESERVED
or do not create the document until its content is approved.

This keeps “file exists” from being confused with “design approved”.

Documentation Quality Finding
Some generated Markdown files in the ZIP have lost Markdown formatting / line separation, for example metadata appears as:

Document ID: ...Version: ...Status: ...
rather than separate lines.

The meaning is still readable, but controlled documents should use a consistent header.

Recommended header
# Title

**Document ID:** ...
**Version:** ...
**Status:** ...
**Owner:** ...
**Last Reviewed:** ...
Strong Areas
The following parts of the project are already structurally strong:

Clear separation between application and blueprints

Numbered governance / architecture / workshop / module structure

ARCH-001 defines a useful core domain model

Module packaging (Specification, Decisions, Checklist, Revisions, Assets) is scalable

Workshop / Foreman / Discipline separation is conceptually clean

Git is already being used as the project history

TypeScript strict mode is enabled

Storage code guards against server-side window

Project IDs use crypto.randomUUID() with a fallback

Timeline/event thinking provides useful auditability

The project is small enough that the major refactor is inexpensive now

KIS Review
The most important simplification is:

Remove these competing concepts from Version 1
Innovation Brain
Project Brain
AI Confidence
Innovation Score
AI Interview
fixed 15–20 minute interview
multiple project storage keys
Keep these
Inventor
Project
Engineering State
Workshop
Foreman
Discovery
Evidence
Uncertainty
Next Step
That is much closer to the architecture reAIdea has now approved.

Recommended Alignment Sprint
Before adding another major feature, perform one short Blueprint Alignment Sprint.

Task 1 — Project Core
Create one canonical Project type aligned with MODULE-002.

Task 2 — Engineering State
Create the four working fields:

currentUnderstanding
currentEvidence
greatestRemainingUncertainty
nextEngineeringStep
Task 3 — Storage
Use one Project storage service and one storage key.

Task 4 — Workshop Door
Rebuild app/page.tsx from MODULE-001.

Task 5 — Discovery Routing
Use /discovery and /discovery/session consistently.

Task 6 — Discovery Vocabulary
Replace “AI Interview”, “Innovation Brain”, “AI Confidence” and related old product language.

Task 7 — Preferred Name
Implement the optional workshop name.

Task 8 — First End-to-End Test
Prove this path:

Workshop Door
   ↓
Observation entered
   ↓
Project created
   ↓
Engineering State created
   ↓
Discovery receives Project
   ↓
One discovery question asked
   ↓
Project updated
   ↓
Project survives browser refresh
When that works, reAIdea has its first real vertical slice.

Suggested Construction Order
Do not build investor, manufacturing, patents, scoring or advanced dashboards yet.

Build one excellent path:

Observation → Project → Discovery → Updated Engineering State

That is Version 1's first machine.

Review Verdict
Architecture
Strong direction

Implementation alignment
Needs refactor before expansion

Risk
Low if corrected now; high if old and new models continue in parallel

KIS
Architecture passes; current prototype code contains unnecessary legacy concepts

Recommended status
READY FOR BLUEPRINT ALIGNMENT SPRINT

Final Review Note
The uploaded ZIP predates some of the latest VS Code restructuring shown after the upload. In particular, the ZIP still contains app/lib/..., while later screenshots show additional movement toward a cleaner core structure. Re-run this review against the next lean source-only ZIP after the alignment sprint.