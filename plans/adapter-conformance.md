# Adapter Conformance

## Decision
Adapter conformance is the P0 consumer proof. It validates that a consumer can accept valid catalog usage, reject invalid usage, and block unattended promotion for review-required actions without building a renderer.

## Goal
Prove that the governed Surfaces Catalog is enforceable at the catalog/export boundary. P0 demonstrates rejection behavior for invalid Surface IR and review behavior for sensitive usage.

## Inputs
- `artifacts/p0/governed-catalog.json`.
- `fixtures/p0/valid.surface-ir.json`.
- `fixtures/p0/invalid/*.json`.
- `fixtures/p0/review/*.json`.
- `schemas/surface-ir.v0.schema.json`.
- `schemas/adapter-diagnostics.v0.schema.json`.
- `schemas/diagnostics.v0.schema.json`.
- Runtime Catalog v0 compatibility and runtime capability rules.

## Outputs
- `artifacts/p0/adapter-diagnostics.json` conforming to `schemas/adapter-diagnostics.v0.schema.json`.
- Pass/fail matrix for valid and invalid Surface IR inputs.
- Diagnostics that can be referenced by `artifacts/p0/evidence.json`.

## Adapter Diagnostics v0 Minimum Shape
`adapter-diagnostics.json` must include:

- `schemaId`: `adapter-diagnostics.v0`.
- `version`.
- `runId`: same value recorded in `artifacts/p0/evidence.json`.
- `status`: `pass` or `fail` for adapter conformance correctness.
- `promotionStatus`: aggregate adapter result using the evidence aggregation rule.
- `fixtureRoot`: `fixtures/p0`.
- `catalogRef`: artifact path, schema id, and hash for `artifacts/p0/governed-catalog.json`.
- `manifestRef`: artifact path, schema id, and hash for `fixtures/p0/expectations.manifest.json`.
- `results[]`: one entry for every manifest expectation whose expected phase is `surface-ir-validation`, `adapter-conformance`, or `review`.
- `diagnostics`: diagnostics conforming to `schemas/diagnostics.v0.schema.json`.
- `environment`: exact deterministic proof environment object defined by `artifacts/p0/evidence.json`.
- `provenance`: evaluator name/version, command, args, and checkedAt.

Each `results[]` entry must include fixture path, fixture kind, expected stage, actual stage, expected phase, actual phase, expected validation result, actual validation result, expected promotion status, actual promotion status, expected diagnostic codes, actual diagnostic codes, matched boolean, artifact path, JSON Pointer, and source ref. `adapter-diagnostics.json` does not include source-mutation results except by manifest/artifact reference; those are recorded in final evidence.

For golden proof output, `adapter-diagnostics.json.environment` must be byte-for-byte identical to `evidence.json.environment` before `adapter-diagnostics.json` is hashed into final evidence. Environment summaries, host-derived projections, or adapter-specific environment fields are invalid in P0.

## Conformance Matrix

| Input | Expected phase | Validation result | Promotion status | Expected code |
| --- | --- | --- | --- | --- |
| `fixtures/p0/valid.surface-ir.json` | `surface-ir-validation` | `valid` | `allowed` | none |
| `invalid/unknown-component.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_COMPONENT` |
| `invalid/unknown-prop.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_PROP` |
| `invalid/unknown-variant.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_VARIANT` |
| `invalid/unknown-state.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_STATE` |
| `invalid/unknown-slot.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_SLOT` |
| `invalid/unknown-action.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_ACTION` |
| `invalid/unknown-event.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_EVENT` |
| `invalid/unknown-data-binding.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_DATA_BINDING` |
| `invalid/unknown-token-ref.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_UNKNOWN_TOKEN_REF` |
| `invalid/extra-property.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_EXTRA_PROPERTY` |
| `invalid/invalid-prop-type.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/invalid-enum-value.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/invalid-string-bounds.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/missing-required-prop.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/unsafe-markup.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/illegal-slot-child.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/slot-max-items.json` | `surface-ir-validation` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/disabled-action-execution.json` | `adapter-conformance` | `invalid` | `blocked` | `CATALOG_INVALID_VALUE` |
| `invalid/invalid-a11y.json` | `surface-ir-validation` | `invalid` | `blocked` | `ACCESSIBILITY_LABEL_MISSING` |
| `invalid/invalid-keyboard-contract.json` | `surface-ir-validation` | `invalid` | `blocked` | `ACCESSIBILITY_CONTRACT_UNMET` |
| `invalid/invalid-focus-contract.json` | `surface-ir-validation` | `invalid` | `blocked` | `ACCESSIBILITY_CONTRACT_UNMET` |
| `invalid/invalid-live-region.json` | `surface-ir-validation` | `invalid` | `blocked` | `ACCESSIBILITY_CONTRACT_UNMET` |
| `invalid/modal-role-not-supported.json` | `surface-ir-validation` | `invalid` | `blocked` | `ACCESSIBILITY_MODAL_UNSUPPORTED` |
| `review/review-required-action.json` | `review` | `valid` | `review_required` | `GOVERNANCE_REVIEW_REQUIRED` |

## P0 Proof
The adapter conformance check runs before final evidence. It accepts the valid Surface IR, rejects invalid fixtures with specific diagnostics, records review-required actions, and does not render UI or execute actions.

## Adapter Safety Checks
P0 adapter conformance must fail closed with an explicit registry code and dedicated fixture coverage for:

- extra properties not declared by `surface-ir.v0`: `invalid/extra-property.json` -> `CATALOG_EXTRA_PROPERTY`;
- wrong prop type, enum value, string bounds, and required prop state: `invalid/invalid-prop-type.json`, `invalid/invalid-enum-value.json`, `invalid/invalid-string-bounds.json`, and `invalid/missing-required-prop.json` -> `CATALOG_INVALID_VALUE`;
- unsafe markup or unsanitized text in string props: `invalid/unsafe-markup.json` -> `CATALOG_INVALID_VALUE`;
- illegal slot child type and max item violation: `invalid/illegal-slot-child.json` and `invalid/slot-max-items.json` -> `CATALOG_INVALID_VALUE`;
- unknown token ref: `invalid/unknown-token-ref.json` -> `CATALOG_UNKNOWN_TOKEN_REF`;
- unknown event ref: `invalid/unknown-event.json` -> `CATALOG_UNKNOWN_EVENT`;
- unknown action ref: `invalid/unknown-action.json` -> `CATALOG_UNKNOWN_ACTION`;
- unknown data-binding ref: `invalid/unknown-data-binding.json` -> `CATALOG_UNKNOWN_DATA_BINDING`;
- unsupported modal dialog semantics: `invalid/modal-role-not-supported.json` -> `ACCESSIBILITY_MODAL_UNSUPPORTED`;
- action execution requests for review-required actions: `review/review-required-action.json` -> `GOVERNANCE_REVIEW_REQUIRED`;
- action execution requests for disabled actions: `invalid/disabled-action-execution.json` -> `CATALOG_INVALID_VALUE`.

Each P0 adapter safety check above must appear in `fixtures/p0/expectations.manifest.json`. Any additional adapter failure discovered during implementation must either map to an existing registered fixture before P0 completion or be deferred to P1 without expanding the P0 pass condition. P0 must emit only registered codes.

## Non-Goals
- No DOM renderer.
- No native renderer.
- No A2UI adapter.
- No visual output.
- No runtime state manager.
- No live action execution.

## Closed P0 Decisions
- Adapter conformance is part of the proof command.
- A2UI remains reference-only in P0.
- Runtime capability diagnostics share codes with compiler and validation diagnostics.
