# Mobile architecture

Arabic RTL, mobile-first, offline-first.

Layers:
- Presentation
- Application/state
- Domain
- Data/repositories
- Local SQLite
- Outbox + Sync Engine
- Secure storage
- API client

UI must never call the API directly; it calls application use-cases/repositories. This preserves offline behavior and testability.
