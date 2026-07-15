# Declared Source Conformance Proof

## Status
Implemented as a target-specific proof-only expansion when `artifacts/source-family-packaging/evidence.json` records `status: "pass"`.

The base proof compiles one manifest-declared local source bundle into an actionable governed result. The aggregate packaging proof runs the same completed fact-level compiler over a second compatible, team-owned bundle without changing the compiler or expanding accepted P2 capability. The target covers only Button and InLineAlert. It is not a numbered roadmap phase, arbitrary source-family system, production adapter, public API, SDK, A2UI target, live ingestion path, live SurfaceOps workflow, live JudgmentKit invocation, native runtime, or action execution path.

## Inputs
The proof consumes only repo-owned, POSIX-relative inputs:

- `sources/source-conformance/declared-source-bundle/manifest.json`
- manifest-declared files under `sources/source-conformance/declared-source-bundle/components/`
- manifest-declared files under `sources/source-conformance/declared-source-bundle/policies/`
- manifest-declared files under `sources/source-conformance/declared-source-bundle/governance/`
- `sources/source-conformance/declared-source-bundle/governance/authority-profile.json`, a checked product-authority input that materialization never rewrites
- `artifacts/p2/evidence.json`
- `artifacts/p2/governed-catalog.json`
- `fixtures/source-conformance/expectations.manifest.json`
- fixture files under `fixtures/source-conformance/valid/`, `review/`, `invalid/`, and `mutations/`
- `fixtures/source-family-packaging/package.fixture.json`
- fixture files under `fixtures/source-family-packaging/valid/`, `review/`, `invalid/`, and `mutations/`
- `sources/source-family-packaging/team-owned-authority-bundle/manifest.json`
- the second bundle's manifest-declared component, policy, governance, and authority-profile files
- accepted base output at `artifacts/source-conformance/evidence.json` and `artifacts/source-conformance/governed-catalog.json`
- the exact local JavaScript execution closure declared in the package: `bin/interfacectl.js`, `scripts/materialize-source-conformance.mjs`, `src/p0.js`, `src/p2-contract.js`, `src/p2-proof.js`, `src/source-conformance-contract.js`, and `src/source-conformance-proof.js`
- Node 22 plus hash-bound `package.json` and `package-lock.json` runtime inputs

The proof validates the upstream P2 evidence self-hash, P2 evidence status, and P2 governed-catalog hash before reading source-conformance fixtures.

## Schemas
Source-conformance-owned schemas:

- `schemas/declared-source-manifest.v0.schema.json`
- `schemas/declared-source-document.v0.schema.json`
- `schemas/declared-source-inventory.v0.schema.json`
- `schemas/source-authority-profile.v0.schema.json`
- `schemas/source-fact-coverage.v0.schema.json`
- `schemas/source-authority-map.v0.schema.json`
- `schemas/source-review-queue.v0.schema.json`
- `schemas/authority-connection-report.v0.schema.json`
- `schemas/source-conformance-report.v0.schema.json`
- `schemas/source-conformance-evidence.v0.schema.json`
- `schemas/source-conformance-expectations.v0.schema.json`
- `schemas/source-conformance-diagnostics.v0.schema.json`
- `schemas/source-conformance-fixture.v0.schema.json`
- `schemas/source-conformance-preflight-mutation.v0.schema.json`

The proof also loads the consumed P2 schema closure because accepted P2 evidence and the governed catalog are upstream authority inputs.

Reusable packaging adds:

- `schemas/source-family-package.v0.schema.json`
- `schemas/source-family-packaging-fixture.v0.schema.json`
- `schemas/source-family-packaging-expectations.v0.schema.json`
- `schemas/source-family-packaging-diagnostics.v0.schema.json`
- `schemas/source-family-packaging-report.v0.schema.json`
- `schemas/source-family-packaging-evidence.v0.schema.json`

## Proof Command
Implemented command:

```bash
interfacectl surfaces source-conformance proof --source sources/source-conformance/declared-source-bundle --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/source-conformance --out artifacts/source-conformance
```

Reusable packaging command:

```bash
interfacectl surfaces source-family-packaging proof --package fixtures/source-family-packaging/package.fixture.json --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --source-conformance-evidence artifacts/source-conformance/evidence.json --source-conformance-catalog artifacts/source-conformance/governed-catalog.json --fixture fixtures/source-family-packaging --out artifacts/source-family-packaging
```

Package scripts execute the base compiler alone as `npm run source-conformance:proof`. The indexed aggregate target runs both compiler instances as:

```bash
npm run proof:source-conformance
```

The proof-bearing CI gate is:

```bash
npm run check:source-family-packaging:ci
```

In the GitHub workflow, `source-conformance-proof` runs the base phase-only gate after `p2-proof`. `source-family-packaging-proof` then runs the package gate before the designer workflow trace.

## Generated Artifacts
The proof emits exactly these artifacts under `artifacts/source-conformance/`:

- `source-inventory.json`
- `source-fact-coverage.json`
- `source-authority-map.json`
- `source-review-queue.json`
- `governed-catalog.json`
- `authority-connection-report.json`
- `source-conformance-report.json`
- `evidence.json`

There is no generated demo for this target. Presentation should lead with the authority connection report and use fact coverage, the review queue, authority map, conformance report, and final evidence for detail. Those artifacts are presentation aids only until `artifacts/source-conformance/evidence.json` passes.

The package proof also emits ten deterministic artifacts under `artifacts/source-family-packaging/`: captured candidate inventory, fact coverage, authority map, review queue, governed catalog, connection report, conformance report, compiler evidence, the aggregate package report, and final aggregate evidence. The captured inner evidence keeps the compiler's isolated logical paths. Aggregate evidence records the exact logical-to-persisted artifact remap, reconstructs the candidate logical workspace from checked repository inputs, and runs the unchanged inner evidence verifier again after the original compiler workspace is removed.

## Diagnostics
The diagnostic registry covers:

- missing upstream P2 evidence;
- undeclared source paths;
- source hash mismatches;
- missing, malformed, or undeclared source refs;
- components absent from accepted P2 catalog evidence;
- component/source-ref mismatches against manifest-declared component source documents;
- checked source facts that exceed the accepted P2 catalog, blocked by `SOURCE_FACT_AUTHORITY_ESCALATION`;
- attempted component, token, runtime-capability, or compatibility changes in the derived governed catalog, blocked by `SOURCE_GOVERNED_CATALOG_DRIFT`;
- explicit Button source precedence over supporting acquired-system Button
  source refs;
- unresolved Button source authority conflicts;
- ambiguous Button source mappings routed to review;
- declared forked Button variant exceptions routed to review by
  `SOURCE_FORKED_VARIANT_REVIEW_REQUIRED`;
- undocumented fork drift blocked by `SOURCE_EXCEPTION_UNDECLARED`;
- forked Button source refs without exception metadata blocked by
  `SOURCE_EXCEPTION_METADATA_MISSING`;
- review-required routing;
- missing review owner, rationale, or expiry metadata;
- missing declared review-policy source ref for review-required output;
- expired or non-canonical review expiry metadata;
- forbidden customer validation, production readiness, pilot readiness, self-serve, live integration, API/SDK/A2UI, native runtime, action execution, live SurfaceOps, or live JudgmentKit claims;
- source-conformance evidence hash mismatches.

The package diagnostic registry adds checked compiler or runtime hash drift, second-bundle manifest or source hash drift, component or capability expansion, preserved owner review, unchanged-compiler run failure, and aggregate evidence hash mismatch. The report records two passing accepted-bundle compiler executions. It records the causal probe separately: the probe adds `expressive` to the primary Button facts, updates the candidate manifest hash, runs the unchanged compiler, and requires `SOURCE_FACT_AUTHORITY_ESCALATION` with exit code `1`.

Invalid and mutation fixtures are expected coverage. Their diagnostics can appear in a passing evidence file because the proof passes when every fixture produces the expected result.

## Pass Condition
Given accepted P2 evidence and catalog, the manifest-declared local source bundle, and the source-conformance fixture set, the command must:

- reject non-normalized or non-contract command paths;
- fail closed on missing upstream P2 evidence, invalid P2 evidence, stale output, undeclared source files, and source hash drift;
- validate every fixture against `fixtures/source-conformance/expectations.manifest.json`;
- validate every declared source document and the checked authority profile without rewriting source bytes;
- compare each authoritative fact pointer with accepted P2 catalog values and derive source disagreements from the checked facts themselves;
- compile component bindings, precedence, policy bindings, exceptions, and review ownership from the profile rather than implementation constants;
- allow a Button multi-source path only when declared source-precedence policy
  selects the primary Button source;
- block unresolved Button source conflicts with `SOURCE_AUTHORITY_CONFLICT`;
- route ambiguous Button source mappings to non-executable review with
  `SOURCE_MAPPING_AMBIGUOUS`, preserving the actual conflicting Button source
  refs in `requiredSourceRefs`;
- route declared forked Button variant exceptions to non-executable review with
  `SOURCE_FORKED_VARIANT_REVIEW_REQUIRED`, preserving the forked source,
  exception-policy, and review-policy refs in `requiredSourceRefs`;
- block undocumented fork drift with `SOURCE_EXCEPTION_UNDECLARED`;
- block forked source refs that omit exception metadata with
  `SOURCE_EXCEPTION_METADATA_MISSING`;
- preserve review-required rows as non-executable output with owner, rationale, and canonical future expiry metadata;
- require review-required output to include the declared review-policy source ref;
- block expired or non-canonical review expiry metadata with `SOURCE_REVIEW_EXPIRED`;
- block primary or supporting facts that exceed accepted P2 values with `SOURCE_FACT_AUTHORITY_ESCALATION`;
- emit a governed catalog whose `components`, `tokens`, `runtimeCapabilities`, and `compatibility` fields match accepted P2 byte-semantically;
- emit actionable findings with source refs, candidate refs, edit paths or pointers, and owners for any non-allowed result;
- emit a source inventory, fact coverage, source authority map, review queue, governed catalog, authority connection report, conformance report, and final evidence;
- hash schemas, declared source files, fixtures, upstream refs, generated artifacts, and final evidence;
- finish with `status: "pass"` and the expected aggregate `promotionStatus: "review_required"` when all expectations match.

The aggregate package proof must also:

- hash-bind the exact seven-file local JavaScript closure, Node 22, `package.json`, and `package-lock.json` to the checked package descriptor;
- copy the canonical and second bundles into separate isolated workspaces as regular files and preserve every source byte through materialization and compilation;
- require two passing accepted-bundle compiler executions, match the fresh canonical output to the tracked primary artifacts, and count the failing causal probe separately as the third compiler invocation;
- run the compiler with its existing fixed command roots, source-ref namespace, fixtures, schemas, and artifact layout, with `familySpecificModule: null`;
- capture and validate the second run's complete eight-artifact evidence closure before deleting the isolated workspace, then reconstruct its logical paths and re-run the unchanged inner verifier from persisted artifacts;
- derive the active owner only from component and exception `reviewRouteId` references, then prove distinct bundle, profile, manifest, active owner, and source-family identities;
- compare the same six normalized source-fact tuples across both bundles, binding each catalog pointer and hash to its primary logical fact ref and JCS value hash, sorted supporting logical fact refs and JCS value hashes, conflict state, resolution, and status;
- preserve `catalogId`, `artifactKind`, `schemaId`, `version`, `tokens`, `components`, `runtimeCapabilities`, `diagnostics`, and `compatibility` across P2, the base run, and the second run;
- reject the causal `expressive` Button expansion through the unchanged compiler;
- emit `artifacts/source-family-packaging/source-family-packaging-report.json` and `artifacts/source-family-packaging/evidence.json` with `status: "pass"` and `promotionStatus: "review_required"`.

## Non-Goals
- No customer validation or pilot-readiness claim.
- No production readiness, self-serve support, or live integration claim.
- No live ingestion, source API, crawler, API/SDK, A2UI, live SurfaceOps, live JudgmentKit, native runtime, or action execution.
- No arbitrary source layout, filename set, source-ref namespace, or connector. The proof covers exactly two checked instances of the fixed package ABI.
- No self-serve connection UI or broader component support beyond Button and InLineAlert.
- No use of partner feedback as proof.
- No promotion of declared-source output beyond the evidence-backed proof boundary.
