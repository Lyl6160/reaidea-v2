# Blueprint 004

# SYSTEM_ARCHITECTURE.md

Revision: 1.0  
Status: Engineering Review  
Owner: reAIdea Engineering  
Date Created: 3 August 2026  
Last Reviewed: 3 August 2026  

────────────────────────────────────────────────────────

# Purpose

This blueprint defines the master system architecture of reAIdea.

It identifies the core engines, their responsibilities, their relationships and the movement of information through the platform.

This architecture exists to ensure that reAIdea remains one coherent system rather than becoming a collection of disconnected features.

────────────────────────────────────────────────────────

# Scope

This blueprint covers:

- The person interacting with reAIdea.
- The conversation layer.
- The reasoning layer.
- Specialist engines.
- Evidence and decision processing.
- Project Core.
- Role-based behaviour.
- Information flow.
- System boundaries.

This blueprint does not define:

- User-interface styling.
- Database technology.
- AI model providers.
- API implementation.
- Hosting infrastructure.
- Individual feature designs.

Those details belong in later blueprints.

────────────────────────────────────────────────────────

# Design Intent

reAIdea must behave as one coordinated engineering system.

The person should experience a clear, natural and supportive journey.

Internally, specialist engines perform separate responsibilities.

The Reasoning Engine coordinates those engines.

Project Core remains the single source of project truth.

No engine may create an isolated version of the project.

────────────────────────────────────────────────────────

# Master Architecture

```text
                         PERSON
                            │
                            ▼
                  CONVERSATION ENGINE
              Natural communication and trust
                            │
                            ▼
                    JOURNEY ENGINE
           Understands stage, role, pace and context
                            │
                            ▼
                   REASONING ENGINE
        Determines what the person needs to consider next
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
  DISCOVERY ENGINE   LEARNING ENGINE   CHALLENGE ENGINE
  Explores unknowns  Explains process  Tests assumptions
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                    EVIDENCE ENGINE
        Classifies facts, assumptions and uncertainties
                            │
                            ▼
                    DECISION ENGINE
       Records decisions, reasons, trade-offs and impact
                            │
                            ▼
                      PROJECT CORE
        Single source of project truth and project history
                            │
                            ▼
                       ROLE ENGINE
     Presents appropriate reasoning for each project role
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    INVENTOR VIEW      INVESTOR VIEW      MENTOR VIEW