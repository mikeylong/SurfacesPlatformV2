# Runtime Adapter

## Decision
The runtime adapter is planned but not built in P0. P0 defines enough catalog, Surface IR, diagnostic, evidence, and conformance behavior for a future adapter to consume approved components, actions, and runtime capabilities safely.

## Goal
Keep runtime rendering as a future implementation target while making the contract boundary testable now through adapter conformance.

## Inputs
- `artifacts/p0/governed-catalog.json`.
- `fixtures/p0/valid.surface-ir.json`.
- `artifacts/p0/adapter-diagnostics.json`.
- Runtime Catalog v0 runtime capability rules.

## Outputs
- Future adapter contract notes.
- P0 `artifacts/p0/adapter-diagnostics.json` from the conformance check.
- Open questions for renderer and protocol implementation after P0.

## Future Adapter Constraints
Any future runtime adapter must:

- consume a governed catalog or a declared adapter-specific projection;
- accept only known components, props, variants, states, slots, actions, events, token refs, and data bindings;
- reject unsupported capabilities fail-closed;
- reject extra properties, unsafe text/markup, invalid prop values, invalid token refs, and illegal action execution;
- preserve diagnostic code compatibility with P0;
- respect `review_required` by blocking unattended action execution;
- provide evidence-compatible provenance and artifact hashes.

## A2UI Position
A2UI is reference-only in P0. Post-P0, Surfaces may emit A2UI-compatible projections/exports from the governed Surfaces Catalog and validate those projections against A2UI conformance. P0 does not implement an A2UI adapter and does not claim A2UI compatibility.

## P0 Proof
No renderer is built. The proof is that adapter conformance can accept valid usage, reject invalid usage, and record review-required usage from the governed catalog.

## Non-Goals
- No runtime renderer.
- No A2UI compatibility implementation.
- No web/native adapter.
- No component package integration.
- No live action execution.

## Post-P0 Decisions
- Whether the first runtime adapter targets A2UI, React, web components, or another runtime.
- Whether runtime actions are declarative intents, callbacks, RPC commands, or workflow triggers.
- Whether runtime adapters consume `governed-catalog.json` directly or a smaller adapter-specific projection.
