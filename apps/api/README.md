# AZAZ BUSINESS API

Runnable reference API for the foundation slice. It demonstrates health, tenant-scoped products, sales, authentication boundary, and idempotency. It is intentionally an in-memory execution slice until PostgreSQL is connected.

Run: `npm run build && npm start`

Health: `GET /health`

Protected endpoints require `Authorization: Bearer <token>` and `X-Organization-Id`.
