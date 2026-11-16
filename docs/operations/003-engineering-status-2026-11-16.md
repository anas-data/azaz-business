# AZAZ BUSINESS — Engineering Status (2026-11-16)

## Scope and evidence

This status note records a repository review of `anas-data/azaz-business` on 2026-11-16. It does not claim that the local Claude Code workspace was inspected, that tests were executed in this change, or that the application is production-ready.

The previous repository `anasalsalam/azaz-business` is historical only. The active repository is `anas-data/azaz-business`.

## Confirmed repository baseline

- Latest previously observed main commit: `bc6233f9b1a569bb8416a696ad75085609258547` (2026-10-31).
- Pull request #1 is merged.
- The API implementation currently uses in-memory Maps.
- The current API auth check accepts any Authorization value beginning with `Bearer `; it does not validate JWTs.
- The checked-in PostgreSQL migration defines core tables, but the API is not yet connected to PostgreSQL and the inspected migration does not enable tenant RLS policies.
- Offline sync is documented as a protocol; a complete client outbox and sync worker were not verified.
- The existing smoke test uses a fixed port and a fixed startup delay.
- The previously committed test report is dated 2026-10-31 and is historical evidence only.

## Change in this branch

The CI workflow is expanded to run on pull requests and pushes to `main` and now includes:

1. Node.js 22 setup and npm dependency caching.
2. `npm ci`.
3. TypeScript typecheck.
4. Unit/integration tests.
5. Smoke tests.
6. Production TypeScript build.
7. npm dependency audit.
8. Gitleaks secret scanning.
9. Required repository-document checks.

These are workflow definitions only. Their success is not established until GitHub Actions executes the workflow on this branch or its pull request.

## Release blockers

Do not deploy this baseline as a production application until the following are implemented and tested:

- Real JWT authentication, refresh-token rotation, session revocation, and RBAC.
- PostgreSQL persistence, migrations, transaction boundaries, and tenant RLS.
- Cross-tenant authorization tests at API and database levels.
- Complete inventory, sales, invoicing, payment, returns, and audit workflows.
- Durable offline outbox, idempotent sync, cursor handling, retry/backoff, and conflict tests.
- Request/body limits, rate limiting, request IDs, audit trails, and safe error handling.
- Arabic RTL mobile-first UI and weak-network usability validation.
- Docker/staging deployment, monitoring, verified backups, and restore drills.

## Verification status

- Repository changes: CI workflow update committed on a feature branch.
- CI execution: pending; no result is claimed in this report.
- Local Claude Code workspace: not inspected; the registered `kali` device was offline at the time of review.
- Production deployment: not performed.
