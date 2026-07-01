# Source Conformance Validation And Evidence

## Evidence Authority
`artifacts/source-conformance/evidence.json` is the proof authority for declared-source conformance behavior. Reports, review queues, authority maps, docs, and any presentation material are consumers of that evidence.

The evidence records:

- the exact command and POSIX-relative arguments;
- deterministic environment fields with `host: null`;
- source-conformance schema closure plus the consumed P2 schema closure;
- declared source manifest and source-file refs;
- fixture refs;
- upstream boundary refs for accepted P2 evidence and governed catalog;
- generated artifact refs;
- deterministic diagnostics and diagnostic registry rows;
- validation results for every expected valid, review, invalid, and mutation fixture;
- `status` and aggregate `promotionStatus`;
- the final evidence self-hash.

## Upstream Preflight
The proof validates `artifacts/p2/evidence.json` and `artifacts/p2/governed-catalog.json` before reading source-conformance fixtures. The proof fails if:

- P2 evidence is missing;
- P2 evidence does not validate;
- P2 evidence self-hash does not match its final artifact ref;
- P2 evidence does not have `status: "pass"`;
- the governed catalog hash does not match the catalog ref recorded in P2 evidence.

## Source Closure
The declared source bundle is closed by `sources/source-conformance/declared-source-bundle/manifest.json`. The proof fails if the source tree contains files outside the manifest, the manifest lists files absent from the owned source tree, or any manifest hash differs from the current source file hash.

Source refs use:

```text
declared-source://source-conformance/<posix-path>#<rfc6901-json-pointer>
```

## Review Semantics
Review-required rows are proof artifacts only. They must preserve:

- review owner;
- rationale;
- canonical future expiry metadata;
- the declared review-policy source ref in `requiredSourceRefs`;
- evidence path;
- `executable: false`;
- `promotionStatus: "review_required"`.

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

## Acceptance Criteria
- `npm run proof:source-conformance` emits exactly the source-conformance artifact set.
- `npm run check:source-conformance:ci` runs the upstream P2 gate and source-conformance phase gate.
- `artifacts/source-conformance/source-conformance-report.json` records every expected and actual result before final evidence.
- `artifacts/source-conformance/source-review-queue.json` contains only non-executable review-required rows.
- `artifacts/source-conformance/evidence.json` records `status: "pass"` and `promotionStatus: "review_required"` for the current fixture set.
- No source-conformance artifact claims customer validation, production readiness, pilot readiness, self-serve support, live integration, API/SDK support, A2UI support, native runtime support, live SurfaceOps, live JudgmentKit, or action execution.
