# AZAZ BUSINESS — System Architecture v1.0

## Target architecture

Mobile/Web clients → Edge/WAF → API → Modular Domain Modules → PostgreSQL/Object Storage/Queues.

The first production architecture is a modular monolith. Boundaries are explicit so modules can later become services without rewriting domain rules.

## Core modules
1. Identity & Access
2. Organizations & Tenancy
3. Catalog
4. Inventory Ledger
5. Sales
6. Purchasing
7. Customers & Receivables
8. Payments
9. Expenses
10. Reporting
11. Offline Sync
12. Audit & Security Events
13. Notifications
14. Billing & Subscriptions

## Trust boundaries
- Device boundary
- Internet/edge boundary
- API boundary
- Application boundary
- Data boundary
- Administrative boundary

## Non-negotiable properties
- Every tenant-scoped record carries an organization context.
- Server authorization is authoritative.
- Financial/inventory mutations are transactional and auditable.
- Sync requests are idempotent.
- Offline clients never overwrite server state blindly.
- Production database is private, not internet-exposed.
