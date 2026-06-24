# Governance Layer

## Decision
P0 governance annotates `artifacts/p0/catalog.json` with generation, review, and blocking rules to produce `artifacts/p0/governed-catalog.json`. It does not implement workflow, roles, approvals, or product policy administration.

## Goal
Express human-owned constraints in `governed-catalog.json` so validation, evidence, and adapter conformance can make the same decisions from the same contract.

## Inputs
- `artifacts/p0/catalog.json`.
- Runtime Catalog v0 governance fields.
- P0 fixture governance rules.
- `schemas/diagnostics.v0.schema.json`.

## Outputs
- `artifacts/p0/governed-catalog.json`.
- Governance diagnostics.
- Rule metadata for `artifacts/p0/evidence.json`.

## Promotion Status
P0 has exactly three promotion statuses:

- `allowed`: usage passes and may be promoted.
- `review_required`: usage is structurally valid but cannot be promoted unattended.
- `blocked`: usage fails and cannot be promoted.

`review_required` blocks unattended promotion in P0. It must be represented in `evidence.json` and `adapter-diagnostics.json`.

## P0 Governance Rules
- Unknown components, props, variants, states, slots, actions, events, token refs, and data bindings are `blocked`.
- Missing accessibility label semantics are `blocked`.
- Missing provenance is `blocked`.
- Invalid artifact hashes are `blocked`.
- Destructive actions are `review_required`.
- P0 fixtures must not contain deprecated entries. Deprecation policy, warning severity, and deprecated-usage promotion are deferred beyond P1 unless backed by manifest and registry fixtures in a later phase.

## P0 Proof
The governed catalog marks valid usage as `allowed`, marks destructive usage as `review_required`, and marks invalid usage as `blocked`. These statuses are visible in evidence and adapter diagnostics.

## Non-Goals
- No authorization system.
- No approval workflow.
- No policy editor.
- No JudgmentKit default-source change.
- No SurfaceOps review implementation.

## Closed P0 Decisions
- `review_required` fails unattended promotion.
- Governance rules are embedded in `governed-catalog.json` for P0.
- Policy ownership and expiration dates are post-P0 unless required by `review_required` evidence metadata.
