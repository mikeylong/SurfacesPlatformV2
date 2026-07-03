# Protocol Projection v0

## Status
This is the implemented P5 projection contract for the `surfaces-protocol-static` proof.

## Decision
`protocol-projection.v0` is a hash-bound, protocol-adapter-specific projection derived from accepted governed catalog authority and accepted evidence refs. It must be smaller than or equal to upstream authority and must be generated before protocol fixture validation creates any allowed protocol envelope.

The adapter id is `surfaces-protocol-static`. It represents deterministic, inert protocol envelopes for proof only. It is not a live protocol service, public API, SDK, renderer, or A2UI export.

## Inputs
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p2/evidence.json`.
- `artifacts/p4/evidence.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/review-judgment-report.json`.
- `artifacts/p5/protocol/adapter-target-selection.json`.
- Schema constants from `schemas/protocol-projection.v0.schema.json`.

P5 valid, review, invalid, and mutation fixtures are not projection inputs. They may be read only after projection generation for manifest-backed validation and protocol-envelope generation.

## Outputs
- `schemas/protocol-projection.v0.schema.json`.
- `artifacts/p5/protocol/protocol-projection.json`.
- Projection diagnostics recorded in `artifacts/p5/protocol/protocol-adapter-report.json` and final evidence.

## Projection Shape
`protocol-projection.v0` requires:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `protocol-projection.v0` |
| `version` | string | yes | Semver |
| `adapter` | const | yes | `surfaces-protocol-static` |
| `targetSelectionRef` | object | yes | Ref for `adapter-target-selection.json` |
| `catalogRef` | object | yes | Ref for `artifacts/p2/governed-catalog.json` |
| `p2EvidenceRef` | object | yes | Ref for `artifacts/p2/evidence.json` |
| `p4EvidenceRef` | object | yes | Ref for `artifacts/p4/evidence.json` |
| `p4DecisionLedgerRef` | object | yes | Ref for `artifacts/p4/surfaceops-decision-ledger.json` |
| `p4ReviewReportRef` | object | yes | Ref for `artifacts/p4/review-judgment-report.json` |
| `components` | object | yes | Protocol-visible component subset |
| `tokens` | object | yes | Protocol-visible token refs and normalized values |
| `actions` | object | yes | Inert action descriptors only |
| `events` | object | yes | Declared event names only, with no transport binding |
| `dataBindings` | object | yes | Declared data-binding refs only, with no live data source |
| `governance` | object | yes | Copied or narrowed review and promotion policy |
| `accessibility` | object | yes | Protocol-visible accessibility expectations |
| `protocolEnvelope` | object | yes | Static envelope shape constraints |
| `diagnostics` | array | yes | Protocol diagnostics |
| `provenance` | object | yes | Source refs and deterministic generator metadata |

## Projection Rules
- Projection generation must not inspect P5 Surface IR fixture contents to decide supported components, props, actions, events, tokens, data bindings, accessibility, or governance.
- Components, props, variants, states, slots, actions, events, token refs, data bindings, and accessibility fields must be copied from or narrowed from the governed catalog.
- Protocol projection `tokens` must validate as normalized catalog-derived token records closed over `type`, `value`, and `sourceRef`; CSS variables, CSS property names, renderer metadata, transport metadata, and arbitrary implementation fields are not protocol token authority.
- Initial component scope cannot exceed the P2 real-source subset unless later proof extends the governed catalog.
- Projection must not convert `blocked` or `review_required` to `allowed`.
- Review-required and destructive actions remain inert descriptors only.
- Protocol envelope fields must be declarative data only. They must not contain callbacks, executable code, network URLs that must be fetched, secret refs, live account ids, or transport configuration.
- Projection must not claim A2UI compatibility unless a separate A2UI proof contract is added.
- Projection must not claim production API, SDK, webhook, queue, or live protocol service behavior.

## Authority Checks
Projection generation must fail with `PROTOCOL_AUTHORITY_ESCALATION` when any projected field grants authority absent from the governed catalog or accepted target selection.

Representative checks compare:

- projected component ids and prop allowed values;
- projected variants, states, slots, actions, events, and data bindings;
- token refs and normalized values;
- review and promotion policy;
- accessibility roles and name requirements;
- protocol envelope operations;
- target-selection scope.

Projection generation must fail when upstream hashes, evidence self-hashes, target selection refs, catalog refs, or accepted P4 evidence refs are missing, stale, mismatched, absolute, symlinked, or outside the declared workspace-relative paths.

## Diagnostics
The diagnostics registry includes projection rows for:

| Code | Trigger | Stage | Promotion status |
| --- | --- | --- | --- |
| `PROTOCOL_PROJECTION_REF_MISSING` | Projection omits target, catalog, P2 evidence, or P4 evidence refs | `projection` | `blocked` |
| `PROTOCOL_SOURCE_HASH_MISMATCH` | Projection target-selection or upstream hash differs from generated target selection or accepted evidence | `projection` | `blocked` |
| `PROTOCOL_TOKEN_RECORD_INVALID` | Protocol projection token record is missing source refs or contains implementation metadata | `projection` | `blocked` |
| `PROTOCOL_AUTHORITY_ESCALATION` | Projection grants authority absent from governed catalog or target selection | `projection` | `blocked` |
| `PROTOCOL_PRODUCTION_API_FORBIDDEN` | Projection claims live API, SDK, transport, callback, webhook, queue, or network behavior | `projection` | `blocked` |
| `PROTOCOL_A2UI_CLAIM_FORBIDDEN` | Projection claims A2UI support without separate A2UI conformance proof | `projection` | `blocked` |

## P5 Proof Requirement
The projection is proof-bearing only when the P5 proof validates it against `schemas/protocol-projection.v0.schema.json`, compares authority against accepted upstream artifacts, records diagnostics in the protocol adapter report, and includes the projection hash in final P5 evidence.

## Non-Goals
- No public Surface IR protocol.
- No direct renderer consumption of the full governed catalog.
- No live production API or SDK.
- No transport binding.
- No runtime state manager.
- No A2UI projection in this protocol proof.
- No claim that future P5 targets are implemented by this static protocol-envelope projection.
