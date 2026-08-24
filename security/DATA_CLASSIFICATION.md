# reAIdea Data Classification and Handling

| Classification | Examples | Handling, logging, and sharing |
| --- | --- | --- |
| **PUBLIC** | Founder-approved marketing material. | May be published only through approved channels. Do not mix with confidential Project records. |
| **INTERNAL** | Source architecture, non-sensitive diagnostics, and test fixtures. | Limit to authorised project personnel and repositories. Logs must remain non-sensitive and minimised. |
| **CONFIDENTIAL** | Inventor descriptions, names, uploads, Project evidence, concepts, geometry, REV assumptions, and specialist outputs. | Need-to-know access, encrypted transport/storage in production, Project-level authorisation, minimised/redacted logs, controlled provider sharing, and explicit retention/export/deletion rules. |
| **RESTRICTED** | API keys, authentication tokens, private keys, session secrets, and recovery credentials. | Never commit, expose in browser code, log, or include in errors. Store only in approved secret management with least privilege, rotation, and restricted access. |

## Rules

- Classification follows the most sensitive included data.
- Browser persistence is not a production authorisation boundary.
- Confidential and Restricted data must not be copied into screenshots, prompts,
  tickets, diagnostics, or test fixtures unless explicitly approved and safely
  minimised.
- Provider input/output handling must follow the applicable Confidential rules;
  production provider data-sharing remains disabled.
- AI outputs retain their generated/unvalidated provenance and do not become
  inventor evidence merely through storage or display.
