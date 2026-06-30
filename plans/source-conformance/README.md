# Declared Source Conformance Proof

## Status
Implemented as a target-specific proof-only expansion when `artifacts/source-conformance/evidence.json` records `status: "pass"`.

This is not a numbered roadmap phase, production adapter, public API, SDK, A2UI target, live ingestion path, live SurfaceOps workflow, live JudgmentKit invocation, native runtime, or action execution path. It proves that one manifest-declared local source bundle can be checked against accepted P2 catalog/evidence with deterministic diagnostics, review-required routing, reports, and final evidence.

## Inputs
The proof consumes only repo-owned, POSIX-relative inputs:

- `sources/source-conformance/declared-source-bundle/manifest.json`
- manifest-declared files under `sources/source-conformance/declared-source-bundle/components/`
- manifest-declared files under `sources/source-conformance/declared-source-bundle/policies/`
- manifest-declared files under `sources/source-conformance/declared-source-bundle/governance/`
- `artifacts/p2/evidence.json`
- `artifacts/p2/governed-catalog.json`
- `fixtures/source-conformance/expectations.manifest.json`
- fixture files under `fixtures/source-conformance/valid/`, `review/`, `invalid/`, and `mutations/`

The proof validates the upstream P2 evidence self-hash, P2 evidence status, and P2 governed-catalog hash before reading source-conformance fixtures.

## Schemas
Source-conformance-owned schemas:

- `schemas/declared-source-manifest.v0.schema.json`
- `schemas/declared-source-document.v0.schema.json`
- `schemas/declared-source-inventory.v0.schema.json`
- `schemas/source-authority-map.v0.schema.json`
- `schemas/source-review-queue.v0.schema.json`
- `schemas/source-conformance-report.v0.schema.json`
- `schemas/source-conformance-evidence.v0.schema.json`
- `schemas/source-conformance-expectations.v0.schema.json`
- `schemas/source-conformance-diagnostics.v0.schema.json`
- `schemas/source-conformance-fixture.v0.schema.json`
- `schemas/source-conformance-preflight-mutation.v0.schema.json`

The proof also loads the consumed P2 schema closure because accepted P2 evidence and the governed catalog are upstream authority inputs.

## Proof Command
Implemented command:

```bash
interfacectl surfaces source-conformance proof --source sources/source-conformance/declared-source-bundle --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/source-conformance --out artifacts/source-conformance
```

Package scripts execute this as:

```bash
npm run proof:source-conformance
```

The proof-bearing CI gate is:

```bash
npm run check:source-conformance:ci
```

In the GitHub workflow, `source-conformance-proof` runs the phase-only gate after `p2-proof`.

## Generated Artifacts
The proof emits exactly these artifacts under `artifacts/source-conformance/`:

- `source-inventory.json`
- `source-authority-map.json`
- `source-review-queue.json`
- `source-conformance-report.json`
- `evidence.json`

There is no generated demo for this target. Presentation should use the report, review queue, authority map, and final evidence as proof artifacts. Those artifacts are presentation aids only until `artifacts/source-conformance/evidence.json` passes.

## Diagnostics
The diagnostic registry covers:

- missing upstream P2 evidence;
- undeclared source paths;
- source hash mismatches;
- missing, malformed, or undeclared source refs;
- components absent from accepted P2 catalog evidence;
- component/source-ref mismatches against manifest-declared component source documents;
- unresolved source authority conflicts;
- review-required routing;
- missing review owner, rationale, or expiry metadata;
- forbidden customer validation, production readiness, pilot readiness, self-serve, live integration, API/SDK/A2UI, native runtime, action execution, live SurfaceOps, or live JudgmentKit claims;
- source-conformance evidence hash mismatches.

Invalid and mutation fixtures are expected coverage. Their diagnostics can appear in a passing evidence file because the proof passes when every fixture produces the expected result.

## Pass Condition
Given accepted P2 evidence and catalog, the manifest-declared local source bundle, and the source-conformance fixture set, the command must:

- reject non-normalized or non-contract command paths;
- fail closed on missing upstream P2 evidence, invalid P2 evidence, stale output, undeclared source files, and source hash drift;
- validate every fixture against `fixtures/source-conformance/expectations.manifest.json`;
- preserve review-required rows as non-executable output with owner, rationale, and expiry metadata;
- emit a source inventory, source authority map, review queue, report, and final evidence;
- hash schemas, declared source files, fixtures, upstream refs, generated artifacts, and final evidence;
- finish with `status: "pass"` and the expected aggregate `promotionStatus: "review_required"` when all expectations match.

## Non-Goals
- No customer validation or pilot-readiness claim.
- No production readiness, self-serve support, or live integration claim.
- No live ingestion, source API, crawler, API/SDK, A2UI, live SurfaceOps, live JudgmentKit, native runtime, or action execution.
- No use of partner feedback as proof.
- No promotion of declared-source output beyond the evidence-backed proof boundary.
