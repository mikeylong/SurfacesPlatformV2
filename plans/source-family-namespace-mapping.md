# Source Family Namespace Mapping Proof Plan

## Status

Implemented as a bounded non-numbered Connect Authority proof when
`artifacts/source-family-namespace-mapping/evidence.json` records
`status: "pass"`. This plan is subordinate to `VISION.md`, `PLAN.md`,
`plans/README.md`, and `PROGRESS.md`.

## Purpose

Prove that one checked copy of the accepted Button and InLineAlert authority
bundle can use the fixed source-ref prefix
`declared-source://product-team-authority/` and normalize it onto the canonical
`declared-source://source-conformance/` prefix before the unchanged
source-conformance compiler runs.

Passing evidence removes one fixed source-ref namespace constraint. It does not
prove arbitrary namespaces, broader source coverage, live source connection, or
self-serve configuration, and it does not complete the Connect Authority
milestone.

## Locked Boundary

- Consume accepted P2 catalog/evidence and accepted
  source-family-layout-mapping evidence.
- Reuse exactly the accepted fixed-layout physical paths, their 12 canonical
  logical targets, and the existing Button/InLineAlert source-family ABI.
- Change checked input content only by replacing the canonical prefix with the
  one fixed alternate prefix and refreshing the manifest hashes that bind those
  changed files.
- Bind every allowed source-ref substitution to an exact file, JSON Pointer,
  alternate value, canonical value, and before/after file hash in an immutable
  namespace package.
- Reject canonical, mixed, foreign, undeclared, overlapping, traversal-bearing,
  encoded-separator, backslash, query-bearing, or otherwise unsupported source
  refs.
- Normalize only the declared string values and manifest source-file hashes in
  an isolated workspace. No regex, selector, plugin, parser hook, merge,
  default, semantic transform, or family-specific module is allowed.
- Require every normalized logical file to be byte-identical to the accepted
  fixed-layout baseline before compilation.
- Run the unchanged source-conformance compiler under Node 22, persist all eight
  inner artifacts, and re-verify their evidence after the temporary workspace
  is removed.
- Hash-bind the namespace-specific contract, materializer, and proof runner in
  a separate proof-implementation closure; do not misclassify them as part of
  the unchanged source-conformance compiler.
- Require exact semantic equality with the accepted layout-mapping outputs for
  source facts, immutable P2 catalog fields, active owner, review metadata,
  diagnostics, promotion status, and non-executable state.
- Preserve the causal `SOURCE_FACT_AUTHORITY_ESCALATION` probe through the
  unchanged compiler.
- Emit report/evidence artifacts only. No demo is generated.

## Authority And Inputs

The target is a derived normalization consumer. It cannot add catalog, policy,
review, or proof authority. Its evidence is authoritative only for this fixed
namespace mapping contract.

Required accepted boundaries:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/source-family-layout-mapping/evidence.json` and its complete
  referenced closure.

Immutable checked trust inputs:

```text
sources/source-family-namespace-mapping/team-owned-namespaced-bundle/
sources/source-family-namespace-mapping/namespace-mapping.json
fixtures/source-family-namespace-mapping/namespace-package.fixture.json
```

Deterministically materialized proof fixtures:

```text
fixtures/source-family-namespace-mapping/expectations.manifest.json
fixtures/source-family-namespace-mapping/{valid,review,invalid,mutations}/
```

Ordinary materialization verifies the namespaced bundle, mapping descriptor,
and namespace package before and after regenerating the schemas and causal
fixtures. It must never generate or rewrite the three trust inputs.

## Schemas

```text
schemas/source-family-namespace-mapping.v0.schema.json
schemas/source-family-namespace-package.v0.schema.json
schemas/source-family-namespace-mapping-receipt.v0.schema.json
schemas/source-family-namespace-mapping-fixture.v0.schema.json
schemas/source-family-namespace-mapping-preflight-mutation.v0.schema.json
schemas/source-family-namespace-mapping-expectations.v0.schema.json
schemas/source-family-namespace-mapping-diagnostics.v0.schema.json
schemas/source-family-namespace-mapping-report.v0.schema.json
schemas/source-family-namespace-mapping-evidence.v0.schema.json
```

The schemas close command paths, namespace values, exact substitution pointers,
file hashes, normalized hashes, manifest hash refreshes, receipt rows, captured
inner artifacts, diagnostics, validation results, upstream refs, compiler and
runtime refs, generated refs, environment, status, promotion status, and final
evidence self-hash.

## Command

```bash
interfacectl surfaces source-family-namespace-mapping proof \
  --source sources/source-family-namespace-mapping/team-owned-namespaced-bundle \
  --mapping sources/source-family-namespace-mapping/namespace-mapping.json \
  --namespace-package fixtures/source-family-namespace-mapping/namespace-package.fixture.json \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --source-family-layout-mapping-evidence artifacts/source-family-layout-mapping/evidence.json \
  --fixture fixtures/source-family-namespace-mapping \
  --out artifacts/source-family-namespace-mapping
```

All arguments are required normalized POSIX-relative paths. Absolute,
duplicate, substituted, hidden, traversal-bearing, symlinked, or hardlink-
aliased inputs and outputs fail closed. Exit `0` means every expected result
matches and evidence passes; exit `1` means a proof or integrity failure; exit
`2` means invalid command usage or unsafe paths.

## Artifacts

```text
artifacts/source-family-namespace-mapping/
  namespace-mapping-receipt.json
  normalized-source-inventory.json
  normalized-source-fact-coverage.json
  normalized-source-authority-map.json
  normalized-source-review-queue.json
  normalized-governed-catalog.json
  normalized-authority-connection-report.json
  normalized-source-conformance-report.json
  normalized-source-conformance-evidence.json
  source-family-namespace-mapping-report.json
  evidence.json
```

The receipt records the fixed from/to namespace, exact substitution rows,
before/after hashes, manifest hash refreshes, suffix preservation, and baseline
byte equality. The eight `normalized-*` files are persisted copies of the
unchanged inner compiler output. The report records normalization, compiler,
comparison, probe, and fixture results before final evidence.

## Diagnostics And Causal Fixtures

The closed registry covers:

- `SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING`;
- `SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH`;
- `SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH`;
- `SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH`;
- `SOURCE_NAMESPACE_UNSUPPORTED`;
- `SOURCE_NAMESPACE_MAPPING_INCOMPLETE`;
- `SOURCE_NAMESPACE_REF_UNSAFE`;
- `SOURCE_NAMESPACE_COLLISION`;
- `SOURCE_NAMESPACE_SUFFIX_MISMATCH`;
- `SOURCE_NAMESPACE_BASELINE_MISMATCH`;
- `SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN`;
- `SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH`;
- `SOURCE_NAMESPACE_COMPILER_RUN_FAILED`;
- `SOURCE_NAMESPACE_REVIEW_REQUIRED`;
- `SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID`;
- `SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH`.

The minimum matrix includes:

| Kind | Case | Expected result |
| --- | --- | --- |
| valid | Fixed alternate prefix normalizes across the exact 12-file closure | `allowed` |
| review | Existing owner-bound Button exception survives normalization | `review_required` |
| preflight mutation | Upstream evidence is missing, non-passing, stale, or hash-drifted | blocked |
| mutation | Mapping or namespace-package hash drifts | blocked |
| mutation | One namespaced source byte or manifest-bound hash drifts | blocked |
| invalid | From/to namespace is malformed, mixed, canonical, foreign, or undeclared | blocked |
| invalid | One expected substitution is absent, duplicated, overlapping, or at the wrong pointer | blocked |
| invalid | A source-ref suffix contains traversal, backslash, query, or encoded-separator syntax | blocked |
| invalid | A path or fragment suffix changes during normalization | blocked |
| invalid | Any non-ref value differs after normalization | blocked |
| invalid | Regex, selector, plugin, merge, default, or semantic transform is requested | blocked |
| mutation | Checked compiler/runtime input drifts or the compiler cannot run | blocked |
| mutation | Persisted inner evidence or final evidence is tampered | blocked |
| probe | Verified input adds the unaccepted Button `expressive` variant | exact inner `SOURCE_FACT_AUTHORITY_ESCALATION` |

Fixture expectations must be derived from actual changed proof inputs. Fixture
ids and declared expected diagnostics are not evidence that a failure occurred.

## Pass Condition

The proof passes only when:

1. accepted upstream evidence and every referenced boundary pass integrity;
2. source, mapping, namespace package, fixture, schema, compiler, runtime,
   namespace proof implementation, and output closures are exact regular-file
   sets;
3. the alternate and canonical prefixes are the two locked values;
4. every alternate occurrence is declared exactly once and no canonical or
   foreign declared-source namespace remains in checked input;
5. every path and RFC 6901 fragment suffix is preserved;
6. manifest hash refreshes bind the exact normalized files;
7. all 12 normalized files are byte-identical to the accepted baseline;
8. the unchanged compiler runs under Node 22 and produces passing evidence;
9. all eight persisted inner artifacts re-verify after workspace cleanup and
   equal the accepted layout-mapping outputs;
10. Button/InLineAlert facts, P2 catalog fields, active owner, review semantics,
    and non-executable state remain unchanged;
11. the isolated authority-expansion probe returns the exact inner diagnostic;
12. every causal fixture result matches the registry-backed expectation; and
13. final evidence closes every input, output, boundary, and self ref with
    `status: "pass"` and `promotionStatus: "review_required"`.

## CI And Documentation

The serial package surface is:

```text
materialize:source-family-namespace-mapping
proof:source-family-namespace-mapping
check:source-family-namespace-mapping
check:source-family-namespace-mapping:ci
check:source-family-namespace-mapping:ci:phase
check:source-family-namespace-mapping:untracked
```

The GitHub job depends on `source-family-layout-mapping-proof`. The capability
index includes this target only after passing evidence exists. Implementation
updates `VISION.md`, `PLAN.md`, `plans/README.md`, `PROGRESS.md`,
`plans/capability-index.md`, and `plans/surfaces-dev.md` in the same change set.

## Non-Goals

- No arbitrary namespace, alias chain, regex mapping, or general rewrite engine.
- No additional physical layout, filename set, component, token, fact, policy,
  exception, action, accessibility, or review authority.
- No broader P2 or Spectrum coverage and no new design-system family.
- No live connector, network fetch, source API, crawler, Figma, Storybook, Code
  Connect, CLI, MCP, template, theme, swizzle, or ejected-source authority.
- No self-serve connection UI.
- No runtime accessibility, browser, or assistive-technology claim.
- No production adapter, API, SDK, A2UI, native runtime, or hosted service.
- No SurfaceOps expansion and no JudgmentKit invocation or judgment claim.
- No customer validation, pilot readiness, production readiness, or adoption
  claim.
