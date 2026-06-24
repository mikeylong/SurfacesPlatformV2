# P0/P1 Product Boundaries

## Decision
This is a P0/P1-scoped root subplan, not the global product-boundary authority. [Surfaces Platform Vision And Roadmap](../VISION.md) owns the canonical product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules.

For P0/P1, `interfacectl` is the implemented proof command surface: P0 uses `interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0`, and P1 uses `interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1`. JudgmentKit evaluates quality, evidence, and handoff after the contract exists; SurfaceOps is the future human review console. Surfaces.systems and Surfaces.dev remain product context, not implementation targets.

## Goal
Prevent overlap between product surfaces while proving the P0 catalog contract and P1 runtime projection contract. This file records phase-local mechanics and deltas for P0/P1 only.

## Inputs
- `VISION.md` canonical authority model and surface roles.
- Root plan P0/P1 surface mechanics and catalog contract implication.
- P0/P1 contract layout.
- Runtime Catalog v0 contract.
- Evidence and diagnostics contracts.

## Outputs
- Boundary rules for P0/P1 subplans.
- P0/P1 evidence fields that can later be consumed by JudgmentKit or SurfaceOps.
- A clear statement that Surfaces.systems and Surfaces.dev remain context-only in P0/P1.

## Boundary Rules
- Within P0/P1, Surfaces Catalog is a governed design-system catalog/compiler artifact, not a competing runtime protocol.
- A2UI is reference-only before P5. P5 may emit A2UI-compatible projections/exports from the governed Surfaces Catalog and validate those projections against A2UI conformance.
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
- No ownership claim beyond the P0/P1 proof boundary.

## Closed P0 Decisions
- The first proof is specified as a neutral workspace contract.
- JudgmentKit evaluation is deferred to the P4 review and judgment proof.
- SurfaceOps persistence is deferred to the P4 review and judgment proof.
