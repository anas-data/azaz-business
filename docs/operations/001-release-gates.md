# Release Gates

A production release is blocked if any critical gate fails:

1. Build reproducibility
2. Unit/integration tests
3. Tenant isolation tests
4. Authorization tests
5. Sync/idempotency tests
6. Financial ledger integrity tests
7. Migration compatibility
8. Backup/restore verification
9. Dependency and secret scanning
10. Staging smoke tests
11. Observability checks
12. Rollback readiness
