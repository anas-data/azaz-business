# ADR-001: Modular monolith first

Status: Accepted

## Decision
Use a modular monolith for the initial backend.

## Why
The product is early-stage. Microservices would add deployment, observability, networking, data consistency, and operational complexity before scale requires it.

## Exit criteria
Extract a module only when at least one is true:
- independent scaling is required;
- independent availability is required;
- security/isolation requires a separate trust boundary;
- team ownership requires it;
- deployment cadence materially benefits from separation.
