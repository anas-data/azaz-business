# L99 Engineering Loop

L99 means the team continuously searches for the highest-leverage improvement while preserving system invariants.

For every iteration:
1. Observe production/user evidence.
2. Orient against product goals, domain rules, threat model and constraints.
3. Decide the smallest safe change with measurable acceptance criteria.
4. Act through a small pull request.
5. Verify automatically and in staging.
6. Release gradually.
7. Observe telemetry.
8. Update the decision record/backlog.

Never optimize a local component by weakening global invariants such as tenant isolation, financial integrity, sync correctness, privacy or recoverability.
