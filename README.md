# AZAZ BUSINESS

Arabic-first, mobile-first, offline-first business platform for local merchants.

## Engineering principles
- Offline-first with durable local outbox and idempotent sync.
- Multi-tenant isolation enforced at application and database layers.
- Financial and inventory records are append-oriented and auditable.
- Modular monolith first; extract services only when justified by scale or isolation needs.
- DevSecOps gates on every change.
- OODA loop: Observe → Orient → Decide → Act → Verify → Learn.

## Repository
- `apps/mobile` — mobile client skeleton.
- `apps/api` — backend modular-monolith skeleton.
- `apps/admin` — administration portal skeleton.
- `packages/domain` — domain contracts/rules.
- `packages/contracts` — API/event contracts.
- `database` — PostgreSQL migrations/policies.
- `infrastructure` — deployment/observability definitions.
- `docs` — architecture, security, ADRs, product, operations.
- `tests` — test layers.

## MVP domains
Identity, organizations, branches, products, customers, suppliers, sales, payments, expenses, inventory ledger, sync, audit, subscriptions.
