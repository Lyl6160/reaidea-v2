# reAIdea Security Verification Checklist

Statuses are **NOT STARTED**, **PARTIAL**, **VERIFIED**, or **BLOCKED**. A status
must not be marked VERIFIED without retained evidence.

| Control area | Status | Required evidence before public production |
| --- | --- | --- |
| Threat-model review for material changes | PARTIAL | Update the living threat model and decision records. |
| Authentication | NOT STARTED | Established identity integration, session tests, and privileged-access review. |
| Server-side Project authorisation | NOT STARTED | Object-level allow/deny tests across Projects and roles. |
| Upload validation | PARTIAL | Magic-byte/type/size validation, malformed-file tests, and malware/content controls where required. |
| API rate limiting and replay/double-submit controls | PARTIAL | Abuse, retry, idempotency, quota, and cost-control tests. |
| Secret scanning | NOT STARTED | CI secret scan and remediation process. |
| Dependency/SCA scanning | NOT STARTED | Repeatable dependency vulnerability and provenance review. |
| SAST | NOT STARTED | CI SAST results and triage process. |
| Negative and abuse fixtures | PARTIAL | Input, authorisation, geometry, provider-failure, and cross-Project tests. |
| Safe logs and errors | PARTIAL | Redaction tests and access/retention controls for diagnostics. |
| Retention, export, and deletion | NOT STARTED | Approved data lifecycle design and tests. |
| Backup and recovery | NOT STARTED | Encrypted backup, restore, recovery objective, and access tests. |
| Incident response | NOT STARTED | Runbook, ownership, alerting, and exercise evidence. |
| Provider data controls | PARTIAL | Confirmed data-sharing settings, contract review, and least-privilege credentials. |
| Deployment headers, CORS, and CSRF | NOT STARTED | Environment-specific review and automated tests where applicable. |
| Independent penetration testing | NOT STARTED | Scoped independent assessment before public production. |

## Minimum gate for a material release

The release owner must review this checklist, resolve or formally accept risks,
and attach evidence for applicable controls. Passing functional tests alone does
not establish security verification.
