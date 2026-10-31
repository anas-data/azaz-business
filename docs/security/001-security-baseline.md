# Security Baseline v1.0

## Identity
- Short-lived access tokens.
- Rotating refresh tokens.
- MFA required for owner/admin in production.
- Device/session inventory and remote revocation.

## Authorization
- RBAC + scoped attributes.
- Tenant isolation at API and database layers.
- Deny-by-default.
- Object-level and function-level authorization tests.

## Data
- TLS in transit.
- Encryption at rest.
- Secure local storage for device secrets.
- Secrets only through secret management; never in source control or mobile binaries.
- Data minimization and retention policies.

## API
- Schema validation.
- Rate limiting.
- Idempotency keys for mutation endpoints.
- Input/output validation.
- Safe error handling.
- API inventory and versioning.

## Mobile
- Secure storage.
- Network security configuration.
- Release signing.
- Obfuscation where appropriate.
- Integrity signals as defense-in-depth, never as sole authorization.

## Operations
- Audit logs.
- Security event monitoring.
- SAST, dependency scanning, secret scanning, SBOM.
- Backup verification and restore drills.
- Incident response runbook.
