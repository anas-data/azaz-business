# OODA / L99 Delivery Loop

Every feature follows:

OBSERVE → ORIENT → DECIDE → ACT → VERIFY → LEARN → UPDATE BACKLOG → REPEAT

## Gate model
- G0: Problem validated
- G1: Domain + threat model approved
- G2: UX/API/data contracts approved
- G3: Implementation complete
- G4: Automated tests/security gates pass
- G5: Staging verification
- G6: Canary release
- G7: Production verification
- G8: Post-release learning

No feature skips a gate because it is "small" if it changes security, data integrity, sync, or financial behavior.
