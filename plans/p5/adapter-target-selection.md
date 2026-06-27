# Adapter Target Selection

## Status
This is the implemented P5 target-selection contract for `surfaces-protocol-static`.

## Decision
The first P5 protocol adapter target must be selected by a deterministic, manifest-backed proof input before any projection is generated. Target selection is a gate, not an inference step.

The first target is a bounded `surfaces-protocol-static` proof target for deterministic protocol envelopes. This target is not a live production protocol, public API, transport service, SDK, A2UI adapter, or renderer.

## Goal
Prevent P5 from expanding into broad production adapter scope by making target selection explicit, auditable, and reversible before projection generation starts.

## Inputs
- `artifacts/p2/evidence.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p4/evidence.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/review-judgment-report.json`.
- `fixtures/p5/protocol/adapter-target-selection.fixture.json`.
- `fixtures/p5/protocol/expectations.manifest.json`.
- `schemas/protocol-target-selection.v0.schema.json`.

## Output
- `artifacts/p5/protocol/adapter-target-selection.json`.

## Target Selection Shape
`protocol-target-selection.v0` requires:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `protocol-target-selection.v0` |
| `version` | string | yes | Semver |
| `targetId` | const | yes | `surfaces-protocol-static` |
| `targetKind` | enum | yes | `protocol-envelope-proof` |
| `claimStatus` | const | yes | Proof-only implemented target status; not production support |
| `upstreamRefs` | array | yes | Exact P2 evidence/catalog refs and P4 evidence/decision-ledger/review-report refs accepted for this target |
| `componentScope` | array | yes | Initial scope cannot exceed P2 `button` and `in-line-alert` coverage |
| `capabilityScope` | object | yes | Inert protocol envelope generation only |
| `excludedClaims` | array | yes | Production API, live transport, SDK, A2UI, renderer, live actions, live review/evaluation |
| `diagnostics` | array | yes | Protocol diagnostics |
| `provenance` | object | yes | Deterministic generator metadata and source refs |

## Selection Rules
- Target selection must validate accepted P2 evidence before reading target fixture contents that depend on the governed catalog.
- Target selection must validate accepted P4 evidence, the P4 decision ledger, and the P4 review/judgment report before claiming that P4 review/judgment proof has been consumed.
- The first target scope cannot exceed the P2 real-source subset unless a later ingestion proof extends catalog coverage.
- Target selection must fail closed when a target fixture names a component, action, token, protocol operation, transport, or API behavior not present in accepted upstream authority.
- Target selection must fail closed when the fixture claims A2UI compatibility without a separate A2UI schema, fixture, conformance command, artifact set, and evidence path.
- Target selection must fail closed when the fixture claims live production API behavior, SDK behavior, runtime hosting, webhooks, callbacks, connector calls, network calls, or action execution.
- Target selection must be recorded as a generated proof artifact before protocol projection.

## Diagnostics
The diagnostics registry includes target-selection rows for:

| Code | Trigger | Stage | Promotion status |
| --- | --- | --- | --- |
| `PROTOCOL_TARGET_UNDECLARED` | Target selection fixture omits the target id or target kind | `target-selection` | `blocked` |
| `PROTOCOL_TARGET_OUT_OF_SCOPE` | Target selection names unsupported catalog, component, capability, transport, or API scope | `target-selection` | `blocked` |
| `PROTOCOL_A2UI_CLAIM_FORBIDDEN` | Target selection claims A2UI support without a separate A2UI proof contract | `target-selection` | `blocked` |
| `PROTOCOL_LIVE_API_FORBIDDEN` | Target selection claims live production API, transport, SDK, callback, or network behavior | `target-selection` | `blocked` |
| `PROTOCOL_TARGET_SELECTION_HASH_MISMATCH` | Target selection artifact hash differs from accepted evidence or report refs | `target-selection` | `blocked` |

## Acceptance Criteria
- The target-selection fixture validates against the target-selection schema.
- Target scope is exact, deterministic, and no broader than accepted upstream authority.
- Unsupported target claims produce canonical diagnostics and block projection.
- `adapter-target-selection.json` is emitted before `protocol-projection.json`.
- Final P5 evidence hashes target-selection schema, fixture, artifact, diagnostics, and upstream refs.

## Non-Goals
- No automatic target discovery from package contents, docs, network services, or runtime inspection.
- No broad target matrix in the first P5 protocol proof.
- No production API readiness scoring.
- No A2UI selection without a separate proof contract.
- No claim that future P5 targets are selected or implemented by this static proof.
