# Protocol Fixture

## Status
This is the implemented P5 fixture contract for the `surfaces-protocol-static` proof.

## Decision
P5 protocol fixtures prove that the protocol adapter can accept allowed protocol-facing usage, reject unsupported or unsafe usage, preserve review-required status, and block production/API/A2UI overclaims.

Fixtures are proof inputs. They are not product data, public API examples, SDK requests, protocol documentation, or runtime state.

## Fixture Layout

```text
fixtures/p5/protocol/
  expectations.manifest.json
  adapter-target-selection.fixture.json
  valid/
    button-protocol-envelope.surface-ir.json
    in-line-alert-protocol-envelope.surface-ir.json
  review/
    review-required-protocol-action.surface-ir.json
  invalid/
    unknown-component.surface-ir.json
    unknown-prop.surface-ir.json
    protocol-authority-escalation.protocol-projection.json
    live-action-callback.surface-ir.json
    production-api-claim.protocol-projection.json
    a2ui-claim-without-conformance.protocol-projection.json
    target-undeclared.protocol-target-selection.json
    target-out-of-scope.protocol-target-selection.json
    target-selection-a2ui-claim.protocol-target-selection.json
    target-selection-live-api-claim.protocol-target-selection.json
  mutations/
    missing-upstream-evidence.protocol-preflight.json
    missing-decision-ledger.protocol-preflight.json
    missing-review-report.protocol-preflight.json
    failing-upstream-evidence.protocol-preflight.json
    upstream-evidence-hash-mismatch.protocol-preflight.json
    decision-ledger-hash-mismatch.protocol-preflight.json
    review-report-hash-mismatch.protocol-preflight.json
    stale-upstream-evidence.protocol-preflight.json
    target-selection-hash-mismatch.protocol-target-selection.json
    missing-projection-ref.protocol-projection.json
    projection-hash-mismatch.protocol-projection.json
    report-projection-hash-mismatch.protocol-adapter-report.json
    hash-mismatch.protocol-adapter-evidence.json
```

## Fixture Categories
- `adapter-target-selection.fixture.json` declares the bounded protocol target before projection.
- `valid/` fixtures produce deterministic protocol envelopes for allowed surfaces only.
- `review/` fixtures are structurally valid but preserve `review_required`; they produce report and evidence rows only.
- `invalid/` fixtures are blocked for unknown catalog members, authority escalation, live callback or action execution attempts, production API claims, or A2UI claims without conformance proof.
- `mutations/` fixtures model upstream preflight, generated artifact, report, projection, and evidence tampering failures.

## Expectations Manifest
`fixtures/p5/protocol/expectations.manifest.json` declares every fixture input, expected stage, expected phase, expected validation result, expected promotion status, and expected diagnostic code.

The manifest must also declare the exact generated artifact set for allowed fixtures. Review-required and invalid fixtures must not emit protocol-envelope artifacts.

Unknown fixtures, hidden directories, symlinks, alternate fixture roots, absolute paths, `.` segments, and `..` traversal must fail closed.

## Stages
The stage order is:

1. `preflight`
2. `target-selection`
3. `projection`
4. `protocol-boundary`
5. `report`
6. `evidence`

## Phases
The phase labels are:

- `protocol-upstream-preflight`
- `protocol-target-selection`
- `protocol-projection`
- `protocol-valid`
- `protocol-review`
- `protocol-invalid`
- `protocol-adapter-report`
- `protocol-adapter-evidence`

## Normative Coverage
The fixture set covers:

- target selection for `surfaces-protocol-static`;
- allowed button protocol envelope;
- allowed in-line-alert protocol envelope;
- review-required action intent with no envelope artifact;
- unknown component and prop references;
- projection authority escalation;
- live action callback or execution request;
- production API, SDK, transport, callback, webhook, queue, or network claim;
- A2UI claim without a separate A2UI proof contract;
- missing, failing, mismatched, and stale upstream evidence, decision ledger refs, or review report refs;
- missing target selection, out-of-scope target selection, and missing projection refs as distinct negative cases;
- target-selection, projection, report, and evidence hash tampering.

## Acceptance Criteria
- Every fixture row is declared in the expectations manifest.
- Valid fixtures emit only deterministic, inert protocol envelopes.
- Review-required fixtures aggregate as `review_required`, execute nothing, and emit no protocol envelope.
- Invalid fixtures are blocked with canonical diagnostics.
- Mutation fixtures fail in the expected stage.
- Final evidence records the complete fixture and artifact hash closure.

## Non-Goals
- No production protocol test vectors.
- No public API examples.
- No SDK request/response examples.
- No live network, callback, webhook, queue, or connector fixture.
- No A2UI fixture in this protocol proof unless a separate A2UI proof is added later.
- No claim that future P5 targets are implemented by this static protocol fixture set.
