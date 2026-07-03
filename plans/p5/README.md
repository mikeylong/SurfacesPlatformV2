# Surfaces Platform V2 P5 Protocol Static Proof

## Status
This P5 subplan set covers the implemented P5 targets: `surfaces-protocol-static` and the sibling `surfaces-native-static` proof documented in [Native Static Proof](native-static-proof.md).

The protocol slice is a deterministic inert protocol-envelope proof with target-specific schemas, fixtures, diagnostics, command implementation, generated artifacts, protocol adapter report, final evidence, demo output, tests, and CI gate. The native slice is a deterministic inert native-packet proof with its own target-specific schemas, fixtures, diagnostics, command implementation, generated artifacts, native report, final evidence, demo output, tests, and CI gate. Neither slice is a production adapter, public API, SDK, native SDK, live protocol service, live native runtime, A2UI export, A2UI conformance claim, live SurfaceOps integration, or live JudgmentKit integration.

## Decision
P5 opens bounded target-specific proofs after P4 review and judgment evidence passes. `surfaces-protocol-static` selects a protocol target, derives a protocol projection from governed catalog authority, validates protocol-facing fixtures, emits deterministic inert protocol artifacts, records diagnostics, and finalizes evidence. `surfaces-native-static` selects a native target, derives a Surfaces-native projection from the same governed catalog authority, consumes protocol evidence only as compatibility preflight, emits deterministic inert native packets, records diagnostics, and finalizes separate native evidence.

The protocol adapter is proof-only. It must not be treated as a live production API, SDK, renderer, A2UI adapter, transport service, workflow runtime, SurfaceOps console, JudgmentKit invocation, or public Surface IR protocol.

## Mission Fit
Surfaces Platform compiles design-system source material into governed UI contracts. A P5 protocol adapter can only add value if it proves a downstream protocol boundary without weakening that contract authority.

The design-system source remains product authority. The Surfaces Catalog remains governed contract authority. Passing evidence remains proof authority for implemented behavior. The protocol projection is a derived consumer and must not add components, props, actions, token refs, data bindings, review policy, runtime behavior, or production API semantics absent from accepted upstream evidence.

## Implemented Boundary Carried Forward
- P1 implements the `web-static` runtime projection and render-plan proof.
- P2 implements bounded local real design-system ingestion from the declared `@adobe/spectrum-design-data@0.7.0` source snapshot, scoped to `button` and `in-line-alert`.
- P3 implements inert agent orchestration proof only. P3 work orders authorize no live agents, tools, shell commands, network calls, file edits, secrets, callbacks, or execution.
- P4 implements deterministic review and judgment proof only. P4 emits SurfaceOps and JudgmentKit-shaped proof artifacts without live SurfaceOps persistence, live JudgmentKit invocation, work-order execution, production adapters, protocol boundaries, or A2UI scope.
- P5 implements `surfaces-protocol-static` as a deterministic inert protocol-envelope proof only and `surfaces-native-static` as a deterministic inert native-packet proof only. P5 does not implement A2UI, production adapters, public APIs, SDKs, native SDKs, live protocols, live native runtimes, live SurfaceOps, or live JudgmentKit.

## Dependency Order
1. [Product Boundaries](product-boundaries.md)
2. [Adapter Target Selection](adapter-target-selection.md)
3. [Protocol Projection v0](protocol-projection-v0.md)
4. [Protocol Fixture](protocol-fixture.md)
5. [Protocol Adapter Proof](protocol-adapter-proof.md)
6. [Validation And Evidence](validation-evidence.md)
7. [Demo And CI](demo-ci.md)
8. [Native Static Proof](native-static-proof.md)

## Contract Layout
The implemented `surfaces-protocol-static` proof uses this target-specific contract shape.

```text
schemas/
  protocol-target-selection.v0.schema.json
  protocol-projection.v0.schema.json
  protocol-envelope.v0.schema.json
  protocol-adapter-report.v0.schema.json
  protocol-adapter-evidence.v0.schema.json
  protocol-adapter-expectations.v0.schema.json
  protocol-adapter-diagnostics.v0.schema.json
  protocol-preflight-mutation.v0.schema.json

fixtures/p5/protocol/
  expectations.manifest.json
  adapter-target-selection.fixture.json
  valid/
    button-protocol-envelope.surface-ir.json
    in-line-alert-protocol-envelope.surface-ir.json
  review/
    review-required-protocol-action.surface-ir.json
  invalid/
    unknown-component.surface-ir.json
    unknown-prop.surface-ir.json
    protocol-authority-escalation.protocol-projection.json
    live-action-callback.surface-ir.json
    production-api-claim.protocol-projection.json
    a2ui-claim-without-conformance.protocol-projection.json
    target-undeclared.protocol-target-selection.json
    target-out-of-scope.protocol-target-selection.json
    target-selection-a2ui-claim.protocol-target-selection.json
    target-selection-live-api-claim.protocol-target-selection.json
  mutations/
    missing-upstream-evidence.protocol-preflight.json
    missing-decision-ledger.protocol-preflight.json
    missing-review-report.protocol-preflight.json
    failing-upstream-evidence.protocol-preflight.json
    upstream-evidence-hash-mismatch.protocol-preflight.json
    decision-ledger-hash-mismatch.protocol-preflight.json
    review-report-hash-mismatch.protocol-preflight.json
    stale-upstream-evidence.protocol-preflight.json
    target-selection-hash-mismatch.protocol-target-selection.json
    missing-projection-ref.protocol-projection.json
    projection-hash-mismatch.protocol-projection.json
    projection-target-selection-hash-mismatch.protocol-projection.json
    projection-token-extra-property.protocol-projection.json
    projection-token-missing-source-ref.protocol-projection.json
    envelope-token-extra-property.protocol-envelope.json
    report-projection-hash-mismatch.protocol-adapter-report.json
    hash-mismatch.protocol-adapter-evidence.json

artifacts/p5/protocol/
  adapter-target-selection.json
  protocol-projection.json
  protocol-envelope.button.json
  protocol-envelope.in-line-alert.json
  protocol-adapter-report.json
  evidence.json

demo/p5/protocol/
  README.md
  index.html
```

## Proof Command
Implemented command:

```bash
interfacectl surfaces protocol proof \
  --ingestion-evidence artifacts/p2/evidence.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --catalog artifacts/p2/governed-catalog.json \
  --fixture fixtures/p5/protocol \
  --out artifacts/p5/protocol
```

Package scripts execute this as `node bin/interfacectl.js surfaces protocol proof --ingestion-evidence artifacts/p2/evidence.json --review-evidence artifacts/p4/evidence.json --decision-ledger artifacts/p4/surfaceops-decision-ledger.json --review-report artifacts/p4/review-judgment-report.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p5/protocol --out artifacts/p5/protocol`. P5 evidence records the logical command string above.

## Pass Condition
Given accepted P2 ingestion evidence, accepted P4 review/judgment evidence, the P4 decision ledger, the P4 review/judgment report, the governed P2 catalog, and the P5 protocol fixture set, the protocol proof command emits the exact P5 protocol artifact set, derives a hash-bound protocol projection from catalog authority, validates every fixture against the expectations manifest, emits deterministic protocol envelopes for allowed surfaces only, blocks invalid and review-required usage without executing actions or calling live services, records protocol diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P5 schema, fixture, upstream input, generated proof artifact, and final evidence artifact.

## Acceptance Criteria
- P0, P1, P2, P3, and P4 proof gates still pass unchanged before and after P5 implementation work.
- The P5 proof starts only after accepted P4 evidence exists and P4 remains deterministic review/judgment only.
- The protocol target is declared by a target-selection fixture and validated before projection.
- The protocol projection is derived from the governed P2 catalog and accepted evidence refs, not from fixture contents.
- The projection cannot introduce catalog authority, production API behavior, protocol operations, actions, tokens, accessibility semantics, data bindings, or review policy absent from upstream governed authority.
- Allowed protocol envelopes are deterministic, inert, and side-effect free.
- Review-required protocol fixtures are report/evidence-only and do not emit protocol-envelope artifacts.
- Invalid and mutation fixtures fail with canonical protocol diagnostics.
- The protocol adapter report is emitted before final evidence.
- Final evidence hashes upstream inputs, P5 schemas, P5 fixtures, generated P5 artifacts, and itself under the established canonicalization discipline.
- Demo output is generated from passing P5 evidence and is not proof authority.

## Non-Goals
- No public Surface IR protocol.
- No live production API, SDK, service, transport, webhook, callback, queue, or network boundary.
- No live action execution.
- No live SurfaceOps or live JudgmentKit integration.
- No work-order execution.
- No A2UI export or conformance claim without a separate A2UI-specific P5 proof shape.
- No relaxation of P0/P1/P2/P3/P4 evidence, stale-output, diagnostic, review, or authority gates.
- No claim that future P5 targets are implemented by these static protocol-envelope or native-packet proofs.
