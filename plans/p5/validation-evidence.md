# Validation And Evidence

## Status
This is the implemented P5 validation and evidence contract for the `surfaces-protocol-static` and `surfaces-native-static` proofs.

## Decision
P5 protocol evidence proves the `surfaces-protocol-static` boundary without coupling P5 to a live production API, public protocol, SurfaceOps product, JudgmentKit invocation, or A2UI export.

P5 native evidence proves the sibling `surfaces-native-static` boundary without coupling P5 to A2UI, a native SDK, production API, native bridge, live runtime, live SurfaceOps, or live JudgmentKit. The native proof consumes protocol evidence as compatibility preflight only; authority still comes from accepted P2 catalog/evidence and P4 review evidence.

P5 evidence proves only the implemented static protocol-envelope and native static-packet behavior whose full proof shapes exist and pass. Future P5 targets need separate evidence before they can be claimed.

## Inputs
- P5 schemas.
- `fixtures/p5/protocol/expectations.manifest.json`.
- P5 target-selection, valid, review, invalid, and mutation fixtures.
- `artifacts/p2/evidence.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p4/evidence.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/review-judgment-report.json`.
- `artifacts/p5/protocol/adapter-target-selection.json`.
- `artifacts/p5/protocol/protocol-projection.json`.
- P5 protocol envelope artifacts.
- `artifacts/p5/protocol/protocol-adapter-report.json`.
- `fixtures/p5/native/expectations.manifest.json`.
- `artifacts/p5/protocol/evidence.json` as native compatibility preflight only.
- `artifacts/p5/native/adapter-target-selection.json`.
- `artifacts/p5/native/surfaces-native-projection.json`.
- P5 native packet artifacts.
- `artifacts/p5/native/surfaces-native-report.json`.

## Outputs
- `schemas/protocol-adapter-evidence.v0.schema.json`.
- `schemas/protocol-adapter-diagnostics.v0.schema.json`.
- `artifacts/p5/protocol/evidence.json`.
- `schemas/surfaces-native-evidence.v0.schema.json`.
- `schemas/surfaces-native-diagnostics.v0.schema.json`.
- `artifacts/p5/native/evidence.json`.

## Evidence Shape
`protocol-adapter-evidence.v0` includes all fields needed to verify:

- run id and deterministic environment;
- proof command and arguments;
- upstream P2 ingestion evidence ref;
- upstream P2 governed catalog ref;
- upstream P4 review/judgment evidence ref;
- upstream P4 decision ledger ref;
- upstream P4 review/judgment report ref;
- P5 schema refs;
- P5 fixture refs;
- target selection ref;
- protocol projection ref;
- protocol envelope refs for allowed fixtures;
- protocol adapter report ref;
- diagnostics;
- validation results;
- artifact hashes and provenance for schemas, fixtures, upstream inputs, generated proof artifacts under `artifacts/p5/protocol`, and final evidence;
- aggregate `status`;
- aggregate `promotionStatus`;
- final evidence self-hash.

`surfaces-native-evidence.v0` mirrors the proof closure for `surfaces-native-static`: command args, accepted P2/P4 authority refs, protocol evidence compatibility preflight ref, native schema and fixture refs, native target selection, Surfaces-native projection, inert native packet refs, native report, diagnostics, validation results, aggregate status, promotion status, and final evidence self-hash.

## Boundary Refs
P5 protocol evidence includes `boundaryRefs[]` for:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/p4/evidence.json`;
- `artifacts/p4/surfaceops-decision-ledger.json`;
- `artifacts/p4/review-judgment-report.json`;
- `artifacts/p5/protocol/adapter-target-selection.json`;
- `artifacts/p5/protocol/protocol-projection.json`;
- every emitted protocol envelope;
- `artifacts/p5/protocol/protocol-adapter-report.json`.

P5 native evidence includes `boundaryRefs[]` for accepted P2/P4 authority and generated native artifacts:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/p4/evidence.json`;
- `artifacts/p4/surfaceops-decision-ledger.json`;
- `artifacts/p4/review-judgment-report.json`;
- `artifacts/p5/native/adapter-target-selection.json`;
- `artifacts/p5/native/surfaces-native-projection.json`;
- every emitted native packet;
- `artifacts/p5/native/surfaces-native-report.json`.

P5 native evidence records `artifacts/p5/protocol/evidence.json` separately in required `compatibilityPreflightRefs[]`. That ref is compatibility preflight only and must not appear in native `boundaryRefs[]`.

Each ref must include the full expected tuple: artifact path, schema id, hash algorithm, hash, source evidence hash where applicable, role by field placement (`boundaryRefs[]` versus `compatibilityPreflightRefs[]`), and deterministic provenance where the schema requires it. Missing, duplicated, reordered, wrong-schema, wrong-path, wrong-hash-algorithm, wrong-source-evidence-hash, alternate, or extra refs must fail closed.

## Upstream Preflight
Before target selection or projection, the P5 protocol proof must fail closed when any required upstream check fails:

1. P2 evidence exists at `artifacts/p2/evidence.json`.
2. P2 governed catalog exists at `artifacts/p2/governed-catalog.json`.
3. P4 evidence exists at `artifacts/p4/evidence.json`.
4. P4 decision ledger exists at `artifacts/p4/surfaceops-decision-ledger.json`.
5. P4 review/judgment report exists at `artifacts/p4/review-judgment-report.json`.
6. P2 and P4 evidence self-hashes validate under the established null-placeholder rule.
7. P2 evidence has `status: "pass"` and aggregate promotion status not equal to `blocked`.
8. P4 evidence has `status: "pass"` and is consumed as deterministic review/judgment evidence only; aggregate P4 `promotionStatus` may remain `blocked` because P4 covers reject and request-changes decisions.
9. Current P2 catalog bytes match the hash recorded in P2 evidence.
10. Current P4 decision ledger and review/judgment report bytes match the hashes recorded in P4 evidence.
11. Target-specific P5 eligibility must be derived from explicit P4 decision ledger and review/judgment report refs when the target contract declares that dependency. P5 must preserve committed ledger decisions and coverage-only rejected, changes-requested, deferred, or second-review-required report rows as `blocked` or `review_required`.
12. P4 evidence records accepted upstream refs without stale or mismatched artifacts.
13. Command inputs exactly match the accepted evidence refs by full tuple: path, schema id, hash algorithm, hash, source evidence hash where applicable, and deterministic order.
14. No alternate evidence ref, alternate catalog ref, alternate decision-ledger ref, alternate review-report ref, absolute path, symlinked path, `.` segment, `..` traversal, or extra upstream input is accepted.

The P5 native proof applies the same accepted P2/P4 preflight and additionally requires passing `artifacts/p5/protocol/evidence.json` at the accepted protocol evidence hash as compatibility preflight only. The target-selection artifact records P2/P4 authority in `upstreamRefs[]` and protocol compatibility in `compatibilityPreflightRefs[]`; both arrays must match the accepted full tuples. Protocol evidence does not add native authority and does not prove native support by itself.

## Accepted Upstream Boundary Refresh Runbook
Use this runbook only when P2, P4, or accepted protocol compatibility proof artifacts intentionally change and the P5 accepted boundary for `surfaces-protocol-static` or `surfaces-native-static` must be advanced. This runbook is procedural guidance, not proof authority. Passing P5 evidence remains the proof authority.

The accepted P2/P4 authority tuple is exactly:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/p4/evidence.json`;
- `artifacts/p4/surfaceops-decision-ledger.json`;
- `artifacts/p4/review-judgment-report.json`.

For native only, the accepted compatibility-preflight tuple is exactly:

- `artifacts/p5/protocol/evidence.json`.

Refresh procedure:

1. Confirm the worktree is quiescent and the upstream P2/P4 or protocol compatibility change is intentional.
2. Run or cite fresh passing P0-P4 proof gates before advancing any P5 authority boundary. If the native protocol compatibility hash changes, also run or cite a fresh passing `npm run check:p5:protocol:ci` before refreshing native compatibility refs.
3. Keep P5 command inputs fixed to the canonical `artifacts/p2/*`, `artifacts/p4/*`, and, for native, `artifacts/p5/protocol/evidence.json` paths listed above.
4. Review the new P2 evidence, P2 governed catalog, P4 evidence, P4 decision ledger, P4 review/judgment report, and, for native, protocol evidence hashes before changing P5 refs.
5. Update only the reviewed accepted-boundary refs, compatibility-preflight refs, and derived P5 materialized refs needed by the affected target, including pinned P5 accepted-hash constants, materialized fixtures when their embedded refs change, generated P5 artifacts, report, evidence, demo, and documentation tracking.
6. Do not move protocol evidence into native authority refs. Native must keep P2/P4 authority in `upstreamRefs[]` and protocol evidence in `compatibilityPreflightRefs[]`.
7. Do not change target scope, projection authority, review semantics, A2UI claims, production API claims, live protocol behavior, live native behavior, live SurfaceOps behavior, live JudgmentKit behavior, transport, callbacks, network calls, or action execution during a boundary refresh.
8. Re-run `npm run check:p5:protocol:ci` for protocol boundary refreshes and `npm run check:p5:native:ci` for native boundary or compatibility-preflight refreshes.
9. Review the diff for no target expansion, no authority expansion, no live behavior, and no future P5 target claim.
10. Preserve gate logs, commit SHA, and final P5 evidence hashes with the PR or merge record, not under generated artifact roots.

If P5 protocol reports `PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH`, `PROTOCOL_DECISION_LEDGER_HASH_MISMATCH`, `PROTOCOL_REVIEW_REPORT_HASH_MISMATCH`, or `PROTOCOL_UPSTREAM_EVIDENCE_STALE` after an intentional upstream change, either refresh the accepted boundary through this review procedure or restore the upstream artifacts. If P5 native reports `NATIVE_UPSTREAM_EVIDENCE_HASH_MISMATCH`, `NATIVE_DECISION_LEDGER_HASH_MISMATCH`, `NATIVE_REVIEW_REPORT_HASH_MISMATCH`, `NATIVE_PROTOCOL_EVIDENCE_HASH_MISMATCH`, `NATIVE_UPSTREAM_EVIDENCE_STALE`, or `NATIVE_PROTOCOL_EVIDENCE_STALE`, either refresh the accepted authority or compatibility-preflight boundary through this review procedure or restore the referenced artifacts. Do not weaken preflight checks, point P5 at alternate paths, or treat latest upstream artifacts as accepted without explicit review.

## Artifact Ordering
P5 evidence artifact order is:

1. P5 schemas.
2. Upstream P2 and P4 artifacts consumed by P5.
3. P5 expectations manifest.
4. P5 target-selection fixture.
5. P5 valid fixtures.
6. P5 review fixtures.
7. P5 invalid fixtures.
8. P5 mutation fixtures.
9. Adapter target selection artifact.
10. Protocol projection.
11. Protocol envelope artifacts.
12. Protocol adapter report.
13. Final P5 evidence.

The `artifacts` entry for `artifacts/p5/protocol/evidence.json` must be ordered last. Its persisted `hash` must be the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`.

The native evidence artifact order follows the same closure pattern with native schemas, fixtures, accepted upstream refs, protocol compatibility-preflight ref, native target selection, native projection, native packet artifacts, native report, and `artifacts/p5/native/evidence.json` ordered last under the same self-hash rule.

Demo files under `demo/p5/protocol` and `demo/p5/native` are generated presentation output, not evidence-hashed proof artifacts.

## Diagnostics Registry
P5 diagnostics use canonical registry messages. Validator-native messages are non-normative and must not be used in golden evidence hashing or manifest comparison.

| Code | Canonical message | Stage | Promotion status | Artifact path | JSON Pointer | Source ref | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PROTOCOL_UPSTREAM_EVIDENCE_MISSING` | Protocol upstream evidence is missing. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/missing-upstream-evidence.protocol-preflight.json` | `/` | `null` | `mutations/missing-upstream-evidence.protocol-preflight.json` |
| `PROTOCOL_DECISION_LEDGER_MISSING` | Protocol decision ledger input is missing. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/missing-decision-ledger.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/missing-decision-ledger.protocol-preflight.json` |
| `PROTOCOL_REVIEW_REPORT_MISSING` | Protocol review report input is missing. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/missing-review-report.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/missing-review-report.protocol-preflight.json` |
| `PROTOCOL_UPSTREAM_EVIDENCE_FAILED` | Protocol upstream evidence is not passing. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/failing-upstream-evidence.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/failing-upstream-evidence.protocol-preflight.json` |
| `PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH` | Protocol upstream evidence or catalog hash does not match the accepted boundary. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/upstream-evidence-hash-mismatch.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/upstream-evidence-hash-mismatch.protocol-preflight.json` |
| `PROTOCOL_DECISION_LEDGER_HASH_MISMATCH` | Protocol decision ledger hash does not match accepted P4 evidence. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/decision-ledger-hash-mismatch.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/decision-ledger-hash-mismatch.protocol-preflight.json` |
| `PROTOCOL_REVIEW_REPORT_HASH_MISMATCH` | Protocol review report hash does not match accepted P4 evidence. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/review-report-hash-mismatch.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/review-report-hash-mismatch.protocol-preflight.json` |
| `PROTOCOL_UPSTREAM_EVIDENCE_STALE` | Protocol upstream evidence or catalog ref is stale or not the exact declared input. | `preflight` | `blocked` | `fixtures/p5/protocol/mutations/stale-upstream-evidence.protocol-preflight.json` | `/upstreamRefs` | `null` | `mutations/stale-upstream-evidence.protocol-preflight.json` |
| `PROTOCOL_TARGET_UNDECLARED` | Protocol adapter target is not declared. | `target-selection` | `blocked` | `fixtures/p5/protocol/invalid/target-undeclared.protocol-target-selection.json` | `/targetId` | `fixture://p5/protocol/invalid/target-undeclared#/targetId` | `invalid/target-undeclared.protocol-target-selection.json` |
| `PROTOCOL_TARGET_OUT_OF_SCOPE` | Protocol adapter target exceeds accepted upstream scope. | `target-selection` | `blocked` | `fixtures/p5/protocol/invalid/target-out-of-scope.protocol-target-selection.json` | `/componentScope` | `fixture://p5/protocol/invalid/target-out-of-scope#/componentScope` | `invalid/target-out-of-scope.protocol-target-selection.json` |
| `PROTOCOL_A2UI_CLAIM_FORBIDDEN` | A2UI support requires a separate P5 conformance proof. | `target-selection` | `blocked` | `fixtures/p5/protocol/invalid/target-selection-a2ui-claim.protocol-target-selection.json` | `/excludedClaims` | `fixture://p5/protocol/invalid/target-selection-a2ui-claim#/excludedClaims` | `invalid/target-selection-a2ui-claim.protocol-target-selection.json` |
| `PROTOCOL_LIVE_API_FORBIDDEN` | Live protocol API behavior is forbidden in this proof. | `target-selection` | `blocked` | `fixtures/p5/protocol/invalid/target-selection-live-api-claim.protocol-target-selection.json` | `/capabilityScope` | `fixture://p5/protocol/invalid/target-selection-live-api-claim#/capabilityScope` | `invalid/target-selection-live-api-claim.protocol-target-selection.json` |
| `PROTOCOL_TARGET_SELECTION_HASH_MISMATCH` | Protocol target selection hash does not match generated artifacts. | `target-selection` | `blocked` | `fixtures/p5/protocol/mutations/target-selection-hash-mismatch.protocol-target-selection.json` | `/targetSelectionRef/hash` | `null` | `mutations/target-selection-hash-mismatch.protocol-target-selection.json` |
| `PROTOCOL_PROJECTION_REF_MISSING` | Protocol projection required boundary reference is missing. | `projection` | `blocked` | `fixtures/p5/protocol/mutations/missing-projection-ref.protocol-projection.json` | `/targetSelectionRef` | `null` | `mutations/missing-projection-ref.protocol-projection.json` |
| `PROTOCOL_SOURCE_HASH_MISMATCH` | Protocol projection source hash does not match accepted evidence. | `projection` | `blocked` | `fixtures/p5/protocol/mutations/projection-hash-mismatch.protocol-projection.json` | `/catalogRef/hash` | `null` | `mutations/projection-hash-mismatch.protocol-projection.json` |
| `PROTOCOL_AUTHORITY_ESCALATION` | Protocol projection grants authority absent from the governed catalog. | `projection` | `blocked` | `fixtures/p5/protocol/invalid/protocol-authority-escalation.protocol-projection.json` | `/components` | `fixture://p5/protocol/invalid/protocol-authority-escalation#/components` | `invalid/protocol-authority-escalation.protocol-projection.json` |
| `PROTOCOL_PRODUCTION_API_FORBIDDEN` | Production API, SDK, transport, callback, or network behavior is forbidden in this proof. | `projection` | `blocked` | `fixtures/p5/protocol/invalid/production-api-claim.protocol-projection.json` | `/protocolEnvelope` | `fixture://p5/protocol/invalid/production-api-claim#/protocolEnvelope` | `invalid/production-api-claim.protocol-projection.json` |
| `PROTOCOL_A2UI_CLAIM_FORBIDDEN` | A2UI support requires a separate P5 conformance proof. | `projection` | `blocked` | `fixtures/p5/protocol/invalid/a2ui-claim-without-conformance.protocol-projection.json` | `/protocolEnvelope` | `fixture://p5/protocol/invalid/a2ui-claim-without-conformance#/protocolEnvelope` | `invalid/a2ui-claim-without-conformance.protocol-projection.json` |
| `PROTOCOL_MEMBER_UNKNOWN` | Protocol fixture references authority absent from the protocol projection. | `protocol-boundary` | `blocked` | `fixtures/p5/protocol/invalid/unknown-component.surface-ir.json` | `/root/component` | `fixture://p5/protocol/invalid/unknown-component#/root` | `invalid/unknown-component.surface-ir.json` |
| `PROTOCOL_MEMBER_UNKNOWN` | Protocol fixture references authority absent from the protocol projection. | `protocol-boundary` | `blocked` | `fixtures/p5/protocol/invalid/unknown-prop.surface-ir.json` | `/root/props` | `fixture://p5/protocol/invalid/unknown-prop#/root/props` | `invalid/unknown-prop.surface-ir.json` |
| `PROTOCOL_ACTION_EXECUTION_FORBIDDEN` | Protocol action execution is forbidden. | `protocol-boundary` | `blocked` | `fixtures/p5/protocol/invalid/live-action-callback.surface-ir.json` | `/root/actions` | `fixture://p5/protocol/invalid/live-action-callback#/root/actions` | `invalid/live-action-callback.surface-ir.json` |
| `PROTOCOL_REVIEW_REQUIRED` | Protocol usage requires review before unattended promotion. | `protocol-boundary` | `review_required` | `fixtures/p5/protocol/review/review-required-protocol-action.surface-ir.json` | `/root/actions` | `fixture://p5/protocol/review/review-required-protocol-action#/root/actions` | `review/review-required-protocol-action.surface-ir.json` |
| `PROTOCOL_REPORT_HASH_MISMATCH` | Protocol adapter report hash does not match generated artifacts. | `report` | `blocked` | `fixtures/p5/protocol/mutations/report-projection-hash-mismatch.protocol-adapter-report.json` | `/projectionRef/hash` | `null` | `mutations/report-projection-hash-mismatch.protocol-adapter-report.json` |
| `PROTOCOL_EVIDENCE_HASH_MISMATCH` | Protocol adapter evidence hash does not match the manifest or self-hash rule. | `evidence` | `blocked` | `fixtures/p5/protocol/mutations/hash-mismatch.protocol-adapter-evidence.json` | `/artifacts` | `null` | `mutations/hash-mismatch.protocol-adapter-evidence.json` |

`schemas/protocol-adapter-diagnostics.v0.schema.json`, `fixtures/p5/protocol/expectations.manifest.json`, `artifacts/p5/protocol/protocol-adapter-report.json`, and `artifacts/p5/protocol/evidence.json` encode the same registry rows. Codes not listed there are invalid for the P5 protocol proof.

`schemas/surfaces-native-diagnostics.v0.schema.json`, `fixtures/p5/native/expectations.manifest.json`, `artifacts/p5/native/surfaces-native-report.json`, and `artifacts/p5/native/evidence.json` encode the native registry rows. Codes not listed there are invalid for the P5 native proof.

## Aggregation Rules
1. If any expectation is unmatched, `status` is `fail` and `promotionStatus` is `blocked`.
2. If any invalid fixture is allowed, `status` is `fail` and `promotionStatus` is `blocked`.
3. If any protocol envelope or native packet contains live execution, callback, transport other than `"none"`, network, secret, hidden state, or production API behavior, `status` is `fail` and `promotionStatus` is `blocked`.
4. If all expectations match and any structurally valid fixture requires review, `status` is `pass` and `promotionStatus` is `review_required`.
5. If all expectations match and no structurally valid fixture requires review, `status` is `pass` and `promotionStatus` is `allowed`.

## Hash And Environment Policy
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.
- Hashes are lowercase SHA-256 hex digests.
- Paths are POSIX-style relative paths.
- Golden `generatedAt` is `1970-01-01T00:00:00.000Z`.
- Host-derived fields are `null`.
- Command arguments are recorded in deterministic order.
- Evidence self-hash uses the prior-phase null-placeholder rule.
- Evidence hashes generated proof artifacts under `artifacts/p5/protocol` or `artifacts/p5/native`; it must not hash `demo/p5/protocol` or `demo/p5/native` output.

## Non-Goals
- No demo HTML hash requirement inside proof evidence.
- No validator-native message hashing.
- No non-deterministic environment capture.
- No live SurfaceOps, live JudgmentKit, production API, or A2UI authority.
- No claim that future P5 targets are implemented by this static P5 evidence.
