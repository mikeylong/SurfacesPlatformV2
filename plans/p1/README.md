# Surfaces Platform V2 P1 Subplans

## Decision
P1 proves a governed product surface through a `web-static` runtime projection and deterministic render-plan proof. It does not build a general DOM runtime, React package, native adapter, A2UI adapter, SurfaceOps console, JudgmentKit evaluator, or public Surface IR protocol.

P1 extends the P0 contract by proving that the governed Surfaces Catalog can cross into an adapter-visible, product-visible surface without becoming a second source of authority. The product-visible demo is an output of the proof contract, not a hand-authored mock.

P1 Surface IR fixture files are internal proof material only. They are not an adapter API, public protocol, or product integration contract, and projection generation must not derive authority from fixture contents.

## Mission Fit
Surfaces Platform turns design-system source material into governed, versioned UI contracts that agents and runtimes can use to generate, validate, reject, review, and render UI safely.

P1 must preserve this mission by requiring every adapter, projection, review, demo, and evidence artifact to consume the Surfaces Catalog contract. The Surfaces Catalog remains the source of truth for what agents may emit and what runtime adapters may render, reject, or send to review.

## P1 Dependency Order
1. [Product Boundaries](product-boundaries.md)
2. [Runtime Projection v0](runtime-projection-v0.md)
3. [P1 Fixture](p1-fixture.md)
4. [Runtime Adapter Proof](runtime-adapter-proof.md)
5. [Validation And Evidence](validation-evidence.md)
6. [Demo And CI](demo-ci.md)

## P1 Contract Layout

```text
schemas/
  runtime-projection.v0.schema.json
  render-plan.v0.schema.json
  runtime-adapter-report.v0.schema.json
  runtime-adapter-evidence.v0.schema.json
  runtime-adapter-expectations.v0.schema.json
  runtime-adapter-diagnostics.v0.schema.json

fixtures/p1/
  expectations.manifest.json
  valid/
    confirm-panel.surface-ir.json
    status-callout.surface-ir.json
    button-defaults.surface-ir.json
  review/
    review-required-action.surface-ir.json
  invalid/
    unknown-component.surface-ir.json
    unknown-prop.surface-ir.json
    unsafe-markup.surface-ir.json
    disabled-action-execution.surface-ir.json
    unknown-action.surface-ir.json
    unknown-event.surface-ir.json
    unknown-slot.surface-ir.json
    unknown-token-key.surface-ir.json
    unknown-token-ref.surface-ir.json
    unknown-data-binding.surface-ir.json
    unknown-variant.surface-ir.json
    unknown-state.surface-ir.json
    modal-role-not-supported.surface-ir.json
  mutations/
    missing-catalog-ref.runtime-projection.json
    catalog-hash-mismatch.runtime-projection.json
    projection-authority-escalation.runtime-projection.json
    missing-render-plan-provenance.render-plan.json
    runtime-projection-hash-mismatch.runtime-adapter-report.json
    hash-mismatch.runtime-adapter-evidence.json

artifacts/p1/
  runtime-projection.json
  render-plan.confirm-panel.json
  render-plan.status-callout.json
  render-plan.button-defaults.json
  runtime-adapter-report.json
  evidence.json

demo/p1/
  README.md
  index.html
```

## P1 Proof Command

```bash
interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1
```

`proof:p1` may wrap `proof:p0`, but the P1 proof command itself must validate that `artifacts/p0/evidence.json`, `artifacts/p0/governed-catalog.json`, and `artifacts/p0/adapter-diagnostics.json` match the hashes it consumes.

Before P1 projection starts, the command must treat P0 as an upstream preflight gate: P0 evidence self-hash must validate, `evidence.status` must be `pass`, aggregate promotion status must be non-blocked, adapter diagnostics must report `status: "pass"`, P0 run ids and artifact refs must match across consumed artifacts, and the governed catalog hash must match the hash recorded in P0 evidence.

## Pass Condition
Given a valid P0 proof and the P1 fixture set, the adapter proof command emits the exact P1 artifacts, creates a hash-bound `web-static` runtime projection from the governed catalog, validates every P1 fixture against the manifest, emits deterministic render plans for allowed surfaces only, blocks invalid and review-required usage without executing actions, records adapter diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P1 schema, fixture, input artifact, generated proof artifact under `artifacts/p1`, and final evidence artifact.

Review-required fixtures are report/evidence-only. They must produce a manifest-checked report row, diagnostics, and final evidence refs, but they must not produce any `render-plan.*.json` artifact or alternate preview artifact during P1.

## Product Surface Rule
P1 proves a governed product surface, not a product mock.

`demo/p1/index.html` must be generated from P1 proof artifacts. It may show the product-visible surface, projection, render plans, diagnostics, and evidence. It must not contain proof-only data that was hand-authored to make the demo look valid.

## P0 Invariants Carried Forward
- P0 proof must still pass unchanged before and after P1 work.
- Paths are POSIX-style paths relative to the workspace root.
- Stale unexpected output under the declared P1 output root fails before writing.
- Expected output symlinks, symlinked output roots, absolute paths, and `..` traversal fail with the same exit-code discipline as P0.
- Golden metadata is deterministic: `1970-01-01T00:00:00.000Z`, UTC, host-derived fields set to `null`, and stable command arguments.
- Evidence canonicalization follows RFC 8785/JCS with I-JSON numeric input constraints.
- Diagnostic messages used in hashed evidence are canonical registry messages, not validator-native text.
- P1 diagnostics preserve P0 diagnostic meaning for shared failures and add only registry-backed P1 rows for projection, render-plan, adapter, and evidence failures.

## P1 Diagnostic Additions
P1 introduces a strict extension registry for adapter proof failures. The evidence-grade source of truth is [Validation And Evidence](validation-evidence.md), where each row includes canonical message, severity, diagnostic source, stage, phase, artifact path, JSON Pointer, source ref, validation result, promotion status, suggested action, and fixture coverage. Each row must be represented in `runtime-adapter-diagnostics.v0.schema.json`, `fixtures/p1/expectations.manifest.json`, and this P1 subplan set.

| Code | Trigger | Stage | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- |
| `PROJECTION_CATALOG_REF_MISSING` | Runtime projection omits its governed catalog reference | `projection` | `blocked` | `mutations/missing-catalog-ref.runtime-projection.json` |
| `PROJECTION_SOURCE_HASH_MISMATCH` | Runtime projection catalog hash differs from P0 evidence | `projection` | `blocked` | `mutations/catalog-hash-mismatch.runtime-projection.json` |
| `PROJECTION_AUTHORITY_ESCALATION` | Runtime projection grants component, prop, action, token, data-binding, or governance authority absent from the governed catalog | `projection` | `blocked` | `mutations/projection-authority-escalation.runtime-projection.json` |
| `RUNTIME_PROJECTION_HASH_MISMATCH` | Adapter proof consumes a projection whose hash differs from evidence or report metadata | `runtime-boundary` | `blocked` | `mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json` |
| `RUNTIME_RENDER_PLAN_PROVENANCE_MISSING` | Render plan omits required provenance | `runtime-boundary` | `blocked` | `mutations/missing-render-plan-provenance.render-plan.json` |
| `RUNTIME_ACTION_EXECUTION_BLOCKED` | Runtime proof encounters disabled or unsupported action execution | `runtime-boundary` | `blocked` | `invalid/disabled-action-execution.surface-ir.json` |
| `RUNTIME_PROJECTION_MEMBER_UNKNOWN` | Runtime Surface IR references a component member or token absent from the runtime projection | `runtime-boundary` | `blocked` | `manifest-wide` |
| `RUNTIME_REVIEW_REQUIRED` | Runtime proof encounters structurally valid usage that requires review | `runtime-boundary` | `review_required` | `review/review-required-action.surface-ir.json` |
| `RUNTIME_EVIDENCE_HASH_MISMATCH` | Runtime adapter evidence hash differs from manifest or self-hash rule | `evidence` | `blocked` | `mutations/hash-mismatch.runtime-adapter-evidence.json` |

## Proof CLI Contract
`interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1` has these documented behaviors:

- The command is run from the workspace root.
- `--catalog`, `--fixture`, and `--out` are POSIX-style paths relative to the workspace root.
- `--catalog` must point to the governed P0 catalog artifact recorded in P0 evidence.
- The command verifies the upstream hashes for `artifacts/p0/evidence.json`, `artifacts/p0/governed-catalog.json`, and `artifacts/p0/adapter-diagnostics.json` before projection.
- Upstream P0 preflight failures stop before projection and before writing any P1 output.
- `fixtures/p1/expectations.manifest.json` is the source of truth for fixture comparisons.
- Exit `0`: all P1 expectations match, all render plans are schema-valid, final evidence is reproducible, `evidence.status` is `pass`, and aggregate `evidence.promotionStatus` is `review_required` when review fixtures are present.
- Exit `1`: contract validation fails, manifest expectations do not match, invalid usage is not blocked, review-required usage is rendered as allowed, hashes/provenance are missing, actions execute, or stale unexpected output exists under `--out`.
- Exit `2`: command usage, missing catalog path, missing fixture path, unreadable schema path, or output path error.
- The command overwrites files only under the declared `--out` directory.
- The expected P1 output set is exactly the artifact set listed in this document; review-required fixtures do not add render-plan artifacts.
- The command writes a concise stage summary to stdout and machine-readable artifacts to `--out`.
- The command writes diagnostics to stderr only for command/runtime failure, not expected invalid fixture failures.

## Non-Goals
- No live Figma ingestion.
- No general renderer.
- No React, native, or web-component adapter package.
- No A2UI compatibility claim.
- No modal or `alertdialog` runtime support; that support is deferred beyond P1.
- No live action execution, callbacks, RPC commands, workflow triggers, network calls, or secret access.
- No SurfaceOps review console.
- No JudgmentKit execution.
- No public Surface IR protocol.
