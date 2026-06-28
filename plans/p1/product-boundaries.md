# Product Boundaries

## Decision
P1 keeps the Surfaces Catalog as the governed contract and introduces a derived `web-static` runtime projection as an adapter input. Product surfaces may consume proof artifacts, but they must not reinterpret policy, mutate the catalog, or become hidden proof authorities.

## Goal
Make the first product-visible surface prove the Surfaces Platform mission: governed contracts decide what agents may emit and what runtime adapters may render, reject, or send to review.

## Inputs
- `VISION.md` canonical authority model and surface roles.
- Root plan P0/P1 surface mechanics and catalog contract implication.
- P0 governed catalog, adapter diagnostics, and evidence artifacts.
- P1 runtime projection and adapter proof outputs.

## Outputs
- Boundary rules for every P1 product surface.
- P1 phase-local responsibility matrix for product, instruction, review, evaluation, compiler, projection, and demo surfaces.
- Must-not-cross rules that keep P1 from becoming a product mock or a broad platform launch.

## Phase-Local Responsibility Matrix
The complete cross-phase [authority model](../../VISION.md#canonical-authority-model) and [surface-role taxonomy](../../VISION.md#surface-roles) live in VISION. This matrix is a P1-local delta that names how each surface participates in the runtime projection proof.

| Surface | P1 role | Consumes | Emits | Must not do |
| --- | --- | --- | --- | --- |
| Surfaces Catalog | Governed contract consumed by P1 | P0 extract, governance rules, fixture-backed schema contracts | Governed catalog and projection refs | Become a renderer, public runtime protocol, or design-system source |
| `interfacectl` | Compiler and proof command surface | P0 artifacts, P1 fixtures, P1 schemas | Runtime projection, render plans, report, evidence | Execute actions or accept stale output |
| `web-static` projection | Adapter-specific contract subset | Governed catalog, runtime projection schema constants, P0 evidence refs | `runtime-projection.json` | Add components, props, actions, policy, review decisions, or fixture-derived authority |
| Runtime adapter proof | Render-plan boundary | Runtime projection, fixture inputs | Allowed render plans and adapter report | Interpret the full catalog as a second governance engine |
| Product demo | Generated product-visible proof view | P1 proof artifacts | `demo/p1/index.html` | Hand-author proof data or bypass evidence |
| `surfaces.systems` | Category and product home | Published proof summaries | Product narrative | Own validation or enforcement |
| `surfaces.dev` | Agent-ready instructions | Contract artifacts and docs | Human-readable agent instructions | Replace schemas, manifest, or CLI proof |
| SurfaceOps | Future review console | Review-required evidence records | Human review decisions in a later phase | Invent policy outside governed catalog |
| JudgmentKit | Future evaluator | Evidence and evaluator metadata | Quality and handoff evaluation in a later phase | Compile, mutate, or override the catalog |
| A2UI | Future A2UI-specific P5 target | Governed catalog or declared A2UI projection | A2UI export or conformance proof | Serve as the Surfaces data model without a separate A2UI proof |

## Boundary Rules
- The governed catalog remains the contract authority for P1.
- A runtime projection is a derived, hash-bound subset of the governed catalog.
- Runtime projection generation must not inspect P1 Surface IR fixture contents; fixtures are internal proof material used after projection for manifest checks and adapter proof only.
- The adapter proof consumes only the runtime projection and fixture inputs.
- The adapter proof must reject any projection that expands authority beyond the governed catalog.
- Product demo output must be generated from proof artifacts.
- Review-required usage is report/evidence-only in P1. It must not execute, become `allowed`, or emit a render-plan or preview artifact.
- P1 Surface IR fixtures are not an adapter API, public protocol, or product integration contract.
- P1 may prepare evidence fields that SurfaceOps or JudgmentKit can later consume, but neither product executes in P1.
- A2UI remains a P5 downstream projection target, not the P1 adapter target.

## P1 Proof
The proof can be completed with P0 artifacts, P1 fixtures, P1 schemas, runtime projection, allowed render plans, adapter report, final evidence, and a generated demo. No product application needs to be built.

## Non-Goals
- No public site redesign.
- No JudgmentKit default-source change.
- No SurfaceOps persistence.
- No A2UI adapter without a separate A2UI-specific P5 proof.
- No live user approval workflow.
- No modal or `alertdialog` runtime support; that support is deferred beyond P1.
- No product analytics or telemetry.
- No ownership claim beyond the P1 proof boundary.

## Closed P1 Decisions
- The first runtime target is `web-static`.
- The first runtime boundary uses an adapter-specific projection, not direct renderer consumption of the full governed catalog.
- The product demo is proof output, not independent product implementation.
- A2UI compatibility is deferred to the P5 projection or conformance proof.
