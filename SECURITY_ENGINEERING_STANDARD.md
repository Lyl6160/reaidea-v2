# reAIdea Secure-by-Design AI Engineering Standard

## Purpose and scope

Security, privacy, resilience, and maintainability are mandatory design
requirements for all reAIdea architecture, code, configuration, APIs,
integrations, data stores, automation, deployment artefacts, and operations.
They are not deferred enhancements.

This project applies relevant current guidance from NIST SSDF (SP 800-218), NIST
Cybersecurity Framework 2.0, applicable NIST SP 800-53 control principles, CISA
Secure by Design and Secure by Default, OWASP ASVS, OWASP Top 10, OWASP API
Security Top 10, OWASP MASVS where mobile applies, CWE/SANS, and current
language, framework, cloud, and vendor guidance. Prefer current stable
standards and practices. Where requirements conflict, identify the conflict and
recommend the safer approach.

## Information and trust boundaries

Invention descriptions, uploads, Project evidence, Visual Concepts, geometry,
REV working assumptions, and generated specialist outputs are
Confidential/proprietary. Credentials and API keys are Restricted. OpenAI
production input/output sharing remains disabled.

Inventor content and uploaded files are untrusted input. AI-generated code,
interpretations, images, geometry, and specialist output are untrusted until
validated. Inventor evidence, REV assumptions, and generated output must remain
distinguishable in data contracts, user presentation, provenance, and storage.
No AI output implies engineering, legal, patent, safety, feasibility, or
commercial approval.

Before material design or implementation, establish enough security context:
information processed and sensitivity; users and administrators; authentication
and authorisation; public/internal/privileged exposure; hosting and third-party
trusts; applicable privacy, sovereignty, and contractual requirements; threat
actors and abuse scenarios; resilience, recovery, audit, and secret needs. Do
not invent security-sensitive requirements. Document safe assumptions and their
implications; ask targeted questions where an answer is required for a safe
decision.

## Threat assessment and architecture

Perform a lightweight threat assessment before material applications, services,
APIs, or architecture changes. Identify protected assets, trust boundaries,
entry points, identities and privilege levels, sensitive flows, external
dependencies, abuse cases, credible STRIDE-equivalent threats, escalation and
exfiltration paths, denial-of-service, and supply-chain risks. Highlight HIGH
or CRITICAL unresolved risks before implementation; do not knowingly implement
them without explicit founder consideration.

Apply least privilege, zero trust, deny-by-default, explicit server-side
authorisation, separation of duties, defence in depth, minimal attack surface,
secure defaults, strong identity controls, segmentation, encryption in transit
and at rest, secret management, input validation, output encoding, safe error
handling, security-relevant audit logging, monitoring, minimisation, retention,
and secure disposal. Security through obscurity is not a primary control.

Project-level object authorisation is mandatory before production. Provider
actions require authentication, authorisation, rate limiting, replay/double
submit protection, and cost-abuse controls before public release. Retention,
export, and secure deletion require explicit production design.

## Identity, secrets, cryptography, and transport

Use established identity providers and contemporary standard protocols where
authentication is required; enforce server-side authorisation for every
protected operation. Prefer MFA for privileged or sensitive access, secure
session management, short-lived credentials where practical, and separate
administrative access.

Never hard-code, commit, expose, or log passwords, API keys, private keys,
tokens, or credentials. Use approved secret-management mechanisms and current
cryptographic libraries; never invent cryptography or use deprecated algorithms
or protocols. Document protected data, encryption location, key management,
access, rotation, and revocation where encryption is required. TLS certificate
verification must never be disabled.

## Input, upload, data, and API security

Treat all external input as untrusted. Apply strict server-side schema and
allow-list validation, contextual output encoding, safe deserialisation,
parameterised queries, upload type/magic-byte/size validation, content controls
where appropriate, rate limiting, replay protection, API authentication and
authorisation, object-level authorisation, appropriate CORS and CSRF controls,
injection protection, and SSRF protection for external resources. Never
construct executable commands, queries, or code directly from untrusted input.
Client-side validation is usability support, not a security control.

## Dependencies, operations, and logging

Minimise dependencies. Prefer maintained, reputable, official packages and
registries; avoid deprecated or unnecessary libraries; constrain versions and
consider known vulnerabilities. Use lock files, SCA/dependency scanning, secret
scanning, SBOM/provenance and integrity verification where appropriate.

For infrastructure, use least-privilege IAM, encrypted storage, logging and
monitoring, restricted administration and network paths, secure baselines,
environment separation, and protected management planes. Flag public exposure.

Log enough security-relevant activity to support investigation, including
authentication, authorisation failures, privileged changes, sensitive access,
integration failures, and anomalies where applicable. Do not log credentials,
tokens, cryptographic keys, raw sensitive content, or unnecessary personal
information. Logs must not become a secondary sensitive-data repository.

## Secure coding, verification, and escalation

Code must fail securely, handle exceptions safely, avoid sensitive detail in
errors or logs, use explicit controls, minimise interfaces and privileges,
handle security-relevant concurrency safely, and retain server-side checks.
Do not disable TLS, authentication, compiler protections, warnings, or other
security controls merely to make a workflow succeed.

Security testing is part of done. Select proportionate unit, negative,
authentication, authorisation, input-validation, boundary, abuse-case, SAST,
SCA, secret-scanning, IaC/container, DAST, API, fuzz, and independent
penetration tests. Include bypass and failure tests, not only successful paths.
Treat AI-generated code as untrusted until reviewed for trust boundaries,
access control, input/output handling, secrets, errors, logs, dependencies, and
relevant OWASP/CWE weaknesses.

When a request would create a material security vulnerability, explain the
threat, impact, relevant principle, and safer approach. For HIGH or CRITICAL
risk, stop implementation until it is explicitly considered. For material
security decisions record: decision, threat/risk, control, recognised standard,
residual risk, and verification.

## Reporting and definition of done

Do not describe reAIdea as production-ready or security-verified without
evidence. Every material implementation report states:

- Security posture: PASS, PASS WITH RISKS, or NOT READY.
- Threats considered and controls implemented.
- Security tests completed or required.
- Open risks, dependencies, residual risk, and production requirements.

If evidence is insufficient, explicitly state that the system has not been
security verified.
