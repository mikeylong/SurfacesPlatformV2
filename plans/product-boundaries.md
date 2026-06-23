# Product Boundaries

## Decision
For P0, `interfacectl` is the future command surface for compiling, validating, and enforcing the proof contract; JudgmentKit evaluates quality, evidence, and handoff after the contract exists; SurfaceOps is the future human review console. Surfaces.systems and Surfaces.dev remain product context, not implementation targets.

## Goal
Prevent overlap between product surfaces while proving the Surfaces Catalog contract. P0 should make each product's future responsibility legible without requiring product implementation.

## Inputs
- Root plan product shape.
- P0 contract layout.
- Runtime Catalog v0 contract.
- Evidence and diagnostics contracts.

## Outputs
- Boundary rules for every subplan.
- Evidence fields that can later be consumed by JudgmentKit or SurfaceOps.
- A clear statement that Surfaces.systems and Surfaces.dev remain context-only in P0.

## Boundary Rules
- Surfaces Catalog is a governed design-system catalog/compiler artifact, not a competing runtime protocol.
- A2UI is reference-only in P0. Post-P0, Surfaces may emit A2UI-compatible projections/exports from the governed Surfaces Catalog and validate those projections against A2UI conformance.
- `interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0` is the only P0 command specified by docs.
- JudgmentKit is not required to execute in P0, but `evidence.json` must include evaluator metadata that JudgmentKit can later consume.
- SurfaceOps is not implemented in P0, but `review_required` results must be explicit enough for a future review console.

## P0 Proof
The proof can be completed with fixture artifacts, validation outputs, evidence, and adapter diagnostics alone. P0 does not require changing JudgmentKit defaults, SurfaceOps application code, Surfaces.systems, or Surfaces.dev.

## Non-Goals
- No public site redesign.
- No JudgmentKit default-source change.
- No SurfaceOps review-console implementation.
- No interfacectl repo migration.
- No ownership claim beyond the P0 proof boundary.

## Closed P0 Decisions
- The first proof is specified as a neutral workspace contract.
- JudgmentKit evaluation is post-P0.
- SurfaceOps persistence is post-P0.
