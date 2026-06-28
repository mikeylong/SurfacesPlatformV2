# Runtime Adapter

## Decision
The runtime adapter is planned but not built in P0. P0 defines enough catalog, Surface IR, diagnostic, evidence, and conformance behavior for later adapter proofs to consume approved components, actions, and runtime capabilities safely. P1 resolves the first adapter proof boundary as `web-static` over `runtime-projection.v0`, while live rendering remains deferred.

## Goal
Keep live runtime rendering as a future implementation target while making the contract boundary testable through adapter conformance and adapter-specific proof artifacts.

## Inputs
- `artifacts/p0/governed-catalog.json`.
- `fixtures/p0/valid.surface-ir.json`.
- `artifacts/p0/adapter-diagnostics.json`.
- Runtime Catalog v0 runtime capability rules.

## Outputs
- Runtime adapter boundary notes.
- P0 `artifacts/p0/adapter-diagnostics.json` from the conformance check.
- Open questions for live renderer and protocol implementation after P1.

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
A2UI is reference-only in P0/P1 and is not implemented by the first `surfaces-protocol-static` P5 slice. A future A2UI-specific P5 target may emit projections, exports, or conformance artifacts from the governed Surfaces Catalog. P0 does not implement an A2UI adapter and does not claim A2UI compatibility.

## P0 Proof
No renderer is built. The proof is that adapter conformance can accept valid usage, reject invalid usage, and record review-required usage from the governed catalog.

## Non-Goals
- No runtime renderer.
- No A2UI compatibility implementation without a separate A2UI-specific P5 proof.
- No P0 web/native adapter; P1's `web-static` proof target is not a live or general-purpose web/native adapter.
- No component package integration.
- No live action execution.

## Later Adapter Decisions
- P1 resolves the first adapter proof target as `web-static`.
- P1 resolves the first runtime boundary as `runtime-projection.v0`, a smaller adapter-specific projection derived from `governed-catalog.json`.
- Runtime actions remain inert descriptors in P1; callbacks, RPC commands, workflow triggers, and live side effects remain deferred beyond P1.
- A2UI remains deferred to a future A2UI-specific P5 target. React, web-component, native, or live runtime adapters remain future targets unless a later phase defines their schema, fixtures, conformance proof, and evidence.
