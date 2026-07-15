# Source Conformance Validation And Evidence

## Evidence Authority
`artifacts/source-conformance/evidence.json` is the proof authority for the canonical bundle's fact-level compiler run and remains the direct source-conformance input to designer-workflow-trace. `artifacts/source-family-packaging/evidence.json` is the aggregate proof authority for the indexed claim that the unchanged compiler consumes two compatible team-owned bundles. Fact coverage, governed catalogs, connection and conformance reports, review queues, authority maps, captured candidate artifacts, docs, and presentation material remain consumers of those evidence boundaries.

The evidence records:

- the exact command and POSIX-relative arguments;
- deterministic environment fields with `host: null`;
- source-conformance schema closure plus the consumed P2 schema closure;
- declared source manifest and source-file refs;
- an explicit hash-bound ref to the checked authority profile;
- fixture refs;
- upstream boundary refs for accepted P2 evidence and governed catalog;
- generated artifact refs;
- deterministic diagnostics and diagnostic registry rows;
- validation results for every expected valid, review, invalid, and mutation fixture;
- `status` and aggregate `promotionStatus`;
- the final evidence self-hash.

Aggregate package evidence adds:

- the second physical bundle manifest, authority profile, and raw source-file refs;
- checked raw hashes for the exact seven-file local JavaScript execution closure, plus Node 22, `package.json`, and `package-lock.json`;
- the source-family package fixture and packaging fixture closure;
- accepted P2 evidence/catalog and canonical source-conformance evidence/catalog boundary refs;
- all eight captured candidate compiler artifacts plus the aggregate report;
- the fixed logical-to-persisted candidate artifact remap and post-workspace inner-evidence verification result;
- deterministic package diagnostics and validation results;
- a final aggregate evidence self-hash.

## Upstream Preflight
The proof validates `artifacts/p2/evidence.json` and `artifacts/p2/governed-catalog.json` before reading source-conformance fixtures. The proof fails if:

- P2 evidence is missing;
- P2 evidence does not validate;
- P2 evidence self-hash does not match its final artifact ref;
- P2 evidence does not have `status: "pass"`;
- the governed catalog hash does not match the catalog ref recorded in P2 evidence.

## Source Closure
The declared source bundle is closed by `sources/source-conformance/declared-source-bundle/manifest.json`. The proof fails if the source tree contains files outside the manifest, the manifest lists files absent from the owned source tree, paths or source roots are duplicated, a source root does not match its path, a document identity does not match its manifest row, or any manifest hash differs from the current source file hash. Materialization reads these inputs but never regenerates them.

The second bundle is independently closed by `sources/source-family-packaging/team-owned-authority-bundle/manifest.json` and the raw manifest hash in `fixtures/source-family-packaging/package.fixture.json`. It must expose the same ordered source-file ABI as the canonical bundle, but it carries distinct bundle, profile, owner, document, binding, policy, exception, and source-family identities. The package proof copies those bytes into the compiler's fixed logical layout in a temporary workspace. It does not symlink, hardlink, rewrite, or normalize the physical team-owned source files.

Source refs use:

```text
declared-source://source-conformance/<posix-path>#<rfc6901-json-pointer>
```

## Authority Compilation
`governance/authority-profile.json` declares component bindings, primary and supporting sources, authoritative catalog pointers, precedence, policy bindings, review routes, and exceptions. Active review ownership is resolved only through the `reviewRouteId` values referenced by component bindings and exceptions; an unreferenced route cannot change the reported owner by moving earlier in the array. The proof validates those cross-references against the manifest and accepted P2 catalog, then emits:

- `source-fact-coverage.json`, which records six checked component facts, actual supporting-source disagreements, applied precedence, five policy bindings, and one review-required exception;
- `source-authority-map.json`, derived from the profile rather than a hardcoded Button map;
- `governed-catalog.json`, which can add governance metadata but must preserve accepted P2 components, tokens, runtime capabilities, compatibility, catalog identity, version, and diagnostics;
- `authority-connection-report.json`, which separates proof status from promotion status and gives source refs, candidate refs, edit paths or pointers, and owners for follow-up.

The current Button supporting facts disagree on allowed variants. The checked profile applies primary-source precedence, so the conflict is understood and allowed without changing the P2 catalog. The forked Button variant remains a declared exception, stays outside the governed catalog, and routes to owner review.

## Review Semantics
Review-required rows are proof artifacts only. Queue items identify whether they came from `fixture-proof` coverage or the actual `authority-profile`. They must preserve:

- review owner;
- rationale;
- canonical future expiry metadata;
- the declared review-policy source ref in `requiredSourceRefs`;
- any source-precedence or source-authority refs needed to explain the review
  route;
- evidence path;
- `executable: false`;
- `promotionStatus: "review_required"`.

Ambiguous Button source mappings are routed to review with
`SOURCE_MAPPING_AMBIGUOUS`. The queue item remains non-executable and does not
resolve product authority; it preserves the actual conflicting Button source
refs, source-precedence policy ref, review-policy ref, owner, rationale, expiry,
and evidence path for authority-layer follow-up.

Declared forked Button variant exceptions are routed to review with
`SOURCE_FORKED_VARIANT_REVIEW_REQUIRED`. The queue item remains non-executable
and preserves the primary Button source, forked variant source, exception-policy
ref, review-policy ref, owner, rationale, expiry, and evidence path.
Undocumented fork drift is blocked with `SOURCE_EXCEPTION_UNDECLARED` and does
not create a review queue item. Forked source refs without exception metadata
are blocked with `SOURCE_EXCEPTION_METADATA_MISSING`.

Expired or non-canonical review expiry metadata is blocked with
`SOURCE_REVIEW_EXPIRED`. The expired-review fixture is invalid coverage; it
keeps stale exceptions from becoming unattended generated UI.
The blocked result row preserves owner, rationale, and expiry metadata for
downstream index-only consumers, but it does not create a review queue item.
Review-required output missing the review-policy source ref is blocked with
`SOURCE_REVIEW_POLICY_REF_MISSING`.

They must not execute actions, persist decisions, call tools, call connectors, invoke SurfaceOps, or invoke JudgmentKit.

## Evidence Integrity
The final evidence must validate its own ref closure. Schema, source, fixture, upstream, generated artifact, and final evidence hashes are deterministic. Any source, fixture, schema, generated artifact, or final evidence tamper is represented by deterministic diagnostics and a failing proof unless the tamper fixture is expected coverage.

The aggregate proof executes the canonical and candidate bundles in separate isolated workspaces and validates both passing evidence closures before cleanup. It matches the fresh canonical artifacts to the tracked primary output, then writes canonical candidate copies under `artifacts/source-family-packaging`. After the original candidate workspace is removed, the proof reconstructs its fixed logical source, fixture, schema, P2, and artifact paths from checked repository inputs and the recorded remap, then runs the unchanged inner evidence verifier again. Aggregate evidence binds that result, the captured bytes, the physical bundle, the active referenced-route owner, the checked JavaScript closure, and the runtime inputs. A read-only capability-index verification checks the aggregate schema, source, compiler, runtime, boundary, captured-artifact, report, remap, and final-evidence hashes from repository paths.

## Acceptance Criteria
- `npm run source-conformance:proof` emits exactly the canonical source-conformance artifact set.
- `npm run proof:source-conformance` runs the canonical compiler and the reusable package proof.
- `npm run check:source-conformance:ci` runs the upstream P2 gate and canonical source-conformance phase gate.
- `npm run check:source-family-packaging:ci` then runs the package phase gate and is the indexed target gate.
- `artifacts/source-conformance/source-conformance-report.json` records every expected and actual result before final evidence.
- `artifacts/source-conformance/source-fact-coverage.json` accounts for every authoritative profile pointer and never treats an undeclared expansion as authority.
- `artifacts/source-conformance/governed-catalog.json` preserves accepted P2 capability fields byte-semantically.
- `artifacts/source-conformance/authority-connection-report.json` records `status: "pass"`, `promotionStatus: "review_required"`, and actionable source-owner follow-up.
- `artifacts/source-conformance/source-review-queue.json` contains only non-executable review-required rows.
- Button source precedence is allowed only when the declared source-precedence
  policy selects the primary Button source; unresolved conflicts block, and
  ambiguous mappings route to review.
- Declared forked Button variant exceptions route to review only when the
  forked source, exception-policy source ref, review-policy source ref, owner,
  rationale, and expiry metadata are present; undocumented fork drift blocks.
- `artifacts/source-conformance/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"` for the current fixture set.
- `artifacts/source-family-packaging/source-family-packaging-report.json` records two passing accepted-bundle compiler executions, one separately counted failing causal probe, preserved source bytes, distinct active referenced-route owners and bundle identities, matching P2 capability fields, matching normalized fact tuples that bind primary and supporting logical fact refs to their JCS value hashes plus conflict, resolution, catalog hash, and status, and post-workspace candidate evidence verification.
- `artifacts/source-family-packaging/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"`, closes over the full package proof, and is the declared-source-conformance evidence path in the capability index.
- Reusable packaging does not change P2, add components, add source facts, generalize arbitrary source layouts or namespaces, call live connectors, add a self-serve UI, or invoke JudgmentKit.
- No source-conformance artifact claims customer validation, production readiness, pilot readiness, self-serve support, live integration, API/SDK support, A2UI support, native runtime support, live SurfaceOps, live JudgmentKit, or action execution.
