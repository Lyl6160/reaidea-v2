# reAIdea Prototype Threat Model

## Status

**NOT PRODUCTION-SECURITY VERIFIED.** This is a living prototype threat model,
not evidence that production controls exist.

## Assets

- Project and invention evidence.
- User identity and account data.
- Uploaded files.
- Provider credentials.
- Generated candidates, Visual Concepts, geometry, and REV assumptions.
- Browser persistence.
- Operational receipts and logs.

## Trust boundaries

1. Browser and its local persistence.
2. Next.js server and API routes.
3. Browser storage and future server-side storage.
4. OpenAI and other providers.
5. Future identity, hosting, and observability services.
6. Repository, CI/CD, and deployment pipeline.

## Initial risks and required direction

| Risk | Threat | Required production control |
| --- | --- | --- |
| Missing identity and access control | Unauthorised Project access | Authenticated, server-side Project object authorisation for every operation. |
| Cross-Project access | Horizontal data exposure | Deny-by-default ownership checks and isolation tests. |
| Malicious text or files | Injection, unsafe files, storage abuse | Schema, magic-byte/type/size validation, content controls, and constrained processing. |
| Prompt injection and AI output | Unsafe or false derived output | Treat input/output as untrusted; provenance, validation, and truthful presentation. |
| Provider cost abuse | Unauthorised or repeated generation | Authentication, authorisation, rate limits, idempotency/replay controls, quotas, and audit. |
| Secret leakage | Credential compromise | Secret manager, scanning, redacted logs/errors, least privilege, rotation. |
| Sensitive logging | Evidence disclosure | Data minimisation, safe diagnostic schema, restricted log access and retention. |
| Candidate tampering | False output or geometry display | Server-side validation, provenance, integrity controls, and Project-scoped reads. |
| Supply chain compromise | Malicious dependency/build input | Lockfile, SCA, provenance/integrity checks, CI controls. |
| Retention/deletion failure | Persistent confidential data | Explicit retention, export, deletion, backup, and recovery design. |
| Denial of service | Resource exhaustion | Rate limits, size/time budgets, queues, monitoring, and recovery controls. |

## Build 1E security decision

**Decision:** Use a local, typed, data-driven geometry profile with labelled REV
working assumptions for supported inventions.

**Threat/risk:** AI or deterministic inference could silently become false
inventor evidence or unsafe geometry.

**Control:** Assumptions remain non-authoritative candidate data, validate before
rendering, and never become canonical Project evidence without inventor
acceptance.

**Standard:** NIST SSDF, CISA Secure by Design, and OWASP secure input/output
validation principles.

**Residual risk:** Supported profiles remain limited; dimensional assumptions are
conceptual and are not fabrication approval.

**Verification:** Geometry schema and boundary tests, provenance checks,
one-Canvas checks, Project-isolation tests, and truthful fallback acceptance.
