# Development Automation

## Golden pipeline

`commit → format/lint → unit tests → typecheck → secret scan → dependency scan → SAST → build → integration tests → security tests → migration check → staging → smoke tests → canary → production → observe`

## OODA automation

The pipeline records a release evidence bundle containing:
- commit SHA
- dependency lock state
- test results
- security scan results
- migration checksum
- build artifact checksum
- deployment environment
- rollback target

## Release is a state machine

`DRAFT → VERIFIED → STAGED → CANARY → RELEASED → OBSERVED → CLOSED`

Any critical failure moves the release to `BLOCKED` and triggers rollback/containment according to the incident runbook.
