# Product Boundaries

## Status
This document defines the product boundary for the implemented `surfaces-protocol-static` P5 proof. It does not register or claim a production adapter, public API, SDK, live protocol service, or A2UI target.

## Decision
The first P5 protocol proof preserves the authority model from `VISION.md`: design-system source material is product authority, the Surfaces Catalog is governed contract authority, and passing evidence is proof authority for implemented behavior.

The `surfaces-protocol-static` projection exposes a protocol-facing subset of governed catalog behavior, but it remains a derived consumer. It must not become a new catalog, a production API, a public Surface IR protocol, an A2UI data model, or a route around review and evidence gates.

## Inputs
- `VISION.md` canonical authority model, roadmap sequence, surface roles, and agent operating rules.
- Implemented P1 runtime projection and render-plan proof boundaries.
- Implemented P2 real-source ingestion evidence and governed catalog.
- Implemented P3 inert orchestration evidence.
- Implemented P4 deterministic review/judgment evidence, decision ledger, and review/judgment report.
- P5 protocol target selection, fixtures, schemas, diagnostics, report, and evidence.

## Outputs
- Boundary rules for the implemented `surfaces-protocol-static` protocol proof.
- A phase-local responsibility matrix for the protocol proof.
- Must-not-cross rules for production adapter, protocol, A2UI, SurfaceOps, and JudgmentKit claims.

## Phase-Local Responsibility Matrix
This matrix is a P5 proof-boundary delta over `VISION.md`. Passing P5 evidence remains the implementation proof authority.

| Surface | P5 role | Consumes | Emits | Must not do |
| --- | --- | --- | --- | --- |
| Surfaces Catalog | Governed contract authority | P2 real-source extract, catalog, governed catalog, and evidence | No new authority by itself in P5 | Accept protocol projection or A2UI output as catalog policy |
| `interfacectl` | Proof command surface | P2/P4 evidence, P2 governed catalog, P5 fixtures, P5 schemas | Protocol target selection, projection, envelopes, report, evidence | Expose a live API, execute actions, call services, invoke live review/evaluation tools, or bypass stale-output checks |
| Protocol target selection | Target gate | Declared fixture and upstream evidence | Deterministic target-selection artifact | Select targets from package availability, docs inference, live services, or fixture contents after projection |
| Protocol projection | Adapter-facing contract subset | Governed catalog and accepted evidence refs | Hash-bound protocol projection | Add components, props, actions, data bindings, tokens, review policy, transport semantics, or API authority |
| Protocol adapter proof | Deterministic proof boundary | Projection and P5 fixtures | Allowed protocol envelopes and adapter report | Execute protocol operations, create callbacks, send network traffic, or become a renderer |
| Generated protocol demo | Presentation output | Passing P5 evidence and protocol artifacts | Static demo files | Become proof authority, production documentation, or a live protocol console |
| SurfaceOps | Implemented P4 deterministic proof consumer, future operational product | P4 evidence, P4 decision ledger, P4 review/judgment report, and P5 evidence | No live P5 decisions | Persist live decisions or authorize protocol execution without a later proof |
| JudgmentKit | Implemented P4 deterministic evaluation-shaped proof consumer | P4 evidence and possible future P5 evidence | No live P5 evaluations | Invoke live MCP/connectors or override protocol/catalog policy |
| A2UI | Possible future P5 target | A declared P5 A2UI projection and conformance fixture, if added later | Separate A2UI proof artifacts | Serve as Surfaces data model or be claimed by this protocol proof |

## Boundary Rules
- P5 `surfaces-protocol-static` is the only implemented P5 target in this slice.
- P5 implementation work starts from accepted P4 evidence and keeps P4 limited to deterministic review/judgment proof.
- Protocol projection authority must come from the governed P2 catalog and accepted evidence refs, not from demo output, fixture convenience, live service behavior, product docs, or reviewer preference.
- Target selection must be explicit, bounded, fixture-declared, and evidence-backed before projection generation.
- Protocol fixtures are validation inputs only. They must not decide what the projection supports.
- Protocol envelopes are inert proof artifacts. They must not contain executable callbacks, RPC commands, workflow triggers, network URLs requiring fetches, secrets, tokens, or live account identifiers.
- Review-required protocol usage is structurally valid but not unattended-allowed. It remains report/evidence-only.
- SurfaceOps and JudgmentKit artifacts from P4 may be consumed as deterministic evidence boundaries, including the P4 decision ledger and P4 review/judgment report, but neither can create protocol, adapter, API, A2UI, or execution authority.
- Demo output is generated presentation output and is never proof authority.

## P5 Proof Boundary
The implemented P5 claim is limited to the `surfaces-protocol-static` proof shape: P5 schemas, P5 fixtures, canonical diagnostics, command implementation, exact artifact set, final evidence, generated demo, tests, CI, and accepted evidence. Any future P5 target needs its own equivalent proof shape before it can be claimed.

## Non-Goals
- No public Surface IR protocol.
- No production adapter or live API claim.
- No live protocol server, SDK, webhook, callback, queue, connector, or network call.
- No live action execution or work-order execution.
- No live SurfaceOps persistence.
- No live JudgmentKit invocation.
- No A2UI export or conformance claim in this protocol proof.
- No claim that future P5 targets are implemented by this static protocol-envelope proof.
- No changes to P0/P1/P2/P3/P4 authority, evidence, review, or stale-output gates.
