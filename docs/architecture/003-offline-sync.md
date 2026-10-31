# Offline Sync Protocol v1

## Local model
The client stores business data in a local database and records mutations in a durable outbox.

## Mutation envelope
```json
{
  "operation_id": "uuid",
  "device_id": "uuid",
  "organization_id": "uuid",
  "entity": "sale",
  "operation": "create",
  "payload": {},
  "client_created_at": "ISO-8601",
  "idempotency_key": "uuid",
  "base_cursor": "opaque-cursor"
}
```

## Flow
1. Validate locally.
2. Commit local transaction + outbox atomically.
3. UI confirms local persistence immediately.
4. Sync engine batches pending operations.
5. Server authenticates and authorizes.
6. Server validates domain rules.
7. Server commits idempotently.
8. Server returns acknowledgement and cursor.
9. Client marks operation synced.
10. Pull delta changes using cursor.

## Conflict policy
Financial and inventory state is derived from durable business transactions/ledger entries. Do not use blind last-write-wins for financial mutations.

## Failure policy
Retry with exponential backoff and jitter. Persist failed operations for diagnosis. Never silently discard a mutation.
