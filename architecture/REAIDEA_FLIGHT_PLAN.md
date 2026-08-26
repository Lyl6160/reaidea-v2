# reAIdea Flight Plan

**Status:** FOUNDER APPROVED — current shared construction plan
**Baseline:** `a62b597e32f98669832f30956bc023eadbcc85e0`
**Branch:** `sprint006-build24-40-home-rebuild`
**Active work:** Lane 0 authority reconciliation and packaging; B2B-3A is paused and uncommitted

## Purpose

This Flight Plan translates the Founder Product Constitution into one controlled route from the current prototype to a limited paid beta. It controls sequence, dependencies and acceptance; it does not itself authorize production implementation.

The companion registers are:

- `PAGE_BLUEPRINT_REGISTER.md` — page-by-page ownership and acceptance;
- `VISUAL_AUTHORITY_REGISTER.md` — approved images and superseded references;
- `BUILD_LANES.md` — lane contracts and status;
- `SUPERSESSION_REGISTER.md` — explicit resolution of stale rules;
- `AGENT_HANDOVER_STANDARD.md` — continuity and rollback evidence;
- `PROJECT_000_REAIDEA.md` — reAIdea applying its own method to itself.

## Outcome-delivery journey

```mermaid
flowchart LR
    I[Choose intent] --> D[Describe once]
    D --> S[Safety and upload preflight]
    S -- CLEAR --> P[Create and verify canonical Project]
    S -- HOLD --> Q[One smallest purpose question]
    S -- BLOCK or unavailable --> X[No persistence or generation]
    Q --> D
    P --> T[Creation Theatre with real phases]
    T --> C[Concept 01]
    T --> G[Supported geometry plan]
    C --> V[Validate output safety and source binding]
    G --> V
    V --> R[Persist and reload verification]
    R --> W[Living Workshop reveal]
    W --> B[Route understanding to relevant benches]
    B --> E[Specialist evidence and limitations]
    E --> N[One next useful decision]
    N --> H[Decision validation and Project history]
    H --> W
```

## Runtime architecture

```mermaid
flowchart TB
    subgraph Browser[Inventor browser]
        HOME[Home and Creation Theatre]
        WORKSHOP[Living Workshop]
        VIEWER[Prototype3DViewer one Canvas]
        LOCAL[Prototype local persistence]
    end

    subgraph Server[reAIdea server]
        ROUTES[Validated server routes]
        SAFETY[Creation image and output safety]
        REV[REV orchestration and routing]
        CORE[Core Creation]
        DOMAIN[Project candidate geometry evidence domains]
    end

    subgraph Suppliers[Replaceable external suppliers]
        MODELS[AI models]
        SOURCES[Authorized research sources]
    end

    subgraph Production[Required production foundation]
        ID[Identity and sessions]
        AUTHZ[Project object authorization]
        STORE[Encrypted server storage]
        ABUSE[Rate limits idempotency quota and audit]
    end

    HOME --> ROUTES
    ROUTES --> SAFETY
    SAFETY --> REV
    REV --> CORE
    CORE --> DOMAIN
    REV --> MODELS
    REV --> SOURCES
    DOMAIN --> WORKSHOP
    WORKSHOP --> VIEWER
    DOMAIN --> LOCAL
    ID --> AUTHZ
    AUTHZ --> ROUTES
    AUTHZ --> STORE
    ABUSE --> ROUTES
    DOMAIN --> STORE
```

Browser persistence is a prototype continuity mechanism, not a production security or authorization boundary.

## Project truth and evidence architecture

```mermaid
flowchart LR
    IE[Inventor evidence] --> CP[Canonical Project]
    IE --> RU[REV understanding]
    CP --> RU
    RU --> RA[REV assumptions]
    RU --> OUT[Generated outputs]
    RA --> OUT
    EXT[External evidence] --> REVIEW[Evidence review]
    OUT --> REVIEW
    CP --> REVIEW
    REVIEW -- inventor adopts or decides --> PT[Accepted Project truth]
    PT --> CP
    REVIEW -- rejects or corrects --> RU
    CP --> HIST[Evidence decisions actions results history]
    HIST --> RU
```

Derived read models may support routing and presentation, but they cannot become parallel Project truth.

## Construction dependency map

```mermaid
flowchart LR
    L0[Lane 0 Governance safety truth] --> L1[Lane 1 Inventor Entry]
    L0 --> L2[Lane 2 REV Intelligence]
    L1 --> L2
    L2 --> L3[Lane 3 Core Creation]
    L3 --> L4[Lane 4 Living Workshop]
    L4 --> L5[Lane 5 Evidence Engine]
    L0 --> L6[Lane 6 Production Foundation]
    L1 --> L6
    L2 --> L6
    L3 --> L6
    L4 --> L6
    L5 --> L6
    L6 --> L7[Lane 7 Product Polish]
    L4 --> L7
```

Only one lane may be active in a Build Contract. Cross-lane work requires a founder-approved architecture decision that lists the dependency, bounded files, protected behavior, combined acceptance and rollback.

## Current flight position

| Area | Verified position | Next controlled gate |
| --- | --- | --- |
| Governance and safety | Constitution and authority hierarchy are founder accepted; packaging is uncommitted | Verify and package the reconciled authority without unfinished work |
| Inventor Entry | Responsive Home, origin intent, readiness, optional image and one-action transaction accepted | Final responsive product review after architecture acceptance |
| REV Intelligence | Description-led routing, source-provenance separation and explicit weapon-construction BLOCK are accepted at `a62b597e32f98669832f30956bc023eadbcc85e0` | Define S1B separately; do not infer acceptance of provider-backed smallest-question work |
| Core Creation | Concept persistence and bounded portable-signage geometry accepted; surf-goggle geometry remains unsupported | Define bounded physical-product geometry support without rebuilding the viewer |
| Living Workshop | B2A, B2B-1 and B2B-2 functional checkpoints accepted | Decide whether to resume paused B2B-3A in Lane 7 or address Lane 5 first |
| Evidence Engine | Project evidence/decision/action/result foundations exist | Define minimum sourced specialist output and adoption flow |
| Production Foundation | Material controls absent | Identity, authorization and server persistence architecture |
| Product Polish | Home/Workshop visual foundations are partial | Resume only after founder selects the active lane |

## Roadmap to limited paid beta

```mermaid
flowchart LR
    A[Accept Architecture Authority] --> B[Freeze truthful golden journey]
    B --> C[Minimum sourced specialist evidence]
    C --> D[Identity and Project authorization]
    D --> E[Encrypted server persistence]
    E --> F[Rate limit idempotency quota and cost controls]
    F --> G[Retention export deletion backup recovery]
    G --> H[Security accessibility and recovery evidence]
    H --> I[Invitation-only pilot]
    I --> J{Exit gates met?}
    J -- No --> K[Repair and reassess]
    K --> I
    J -- Yes --> L[Limited paid beta with explicit limitations]
```

Exit gates require a truthful golden journey, safe failure, no cross-Project access, cost controls, accessible responsive behavior, recoverable storage and explicit founder acceptance. Visual polish or a successful provider call cannot substitute for these gates.

## Immediate hold

No production lane is active while the founder-approved Architecture and Visual Authority records are reconciled and packaged. The two-file B2B-3A diff is preserved as an uncommitted rollback-safe experiment. A later production step requires one active lane and a founder-approved Build Contract before coding resumes.
