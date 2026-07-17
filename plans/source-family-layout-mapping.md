# Source Family Layout Mapping Proof Plan

## Status

Implemented as a bounded non-numbered Connect Authority proof slice when
`artifacts/source-family-layout-mapping/evidence.json` records
`status: "pass"`. The current tracked evidence passes with
`promotionStatus: "review_required"`.

This plan is subordinate to [VISION.md](../VISION.md), [PLAN.md](../PLAN.md),
[the subplan index](README.md), and [PROGRESS.md](../PROGRESS.md). The existing
[Declared Source Conformance Proof](source-conformance/README.md) remains the
implemented inner compiler boundary consumed by this target.

## Purpose

Prove that one checked team-owned authority bundle can use a different physical
directory and filename layout while preserving the existing
`declared-local-source-bundle.v0` logical ABI, canonical source refs, source
bytes, Button and InLineAlert facts, review semantics, and accepted P2 ceiling.

Passing evidence for this slice advances the Connect Authority requirement that
a team connect its authority without repo-specific compiler changes. It removes
one physical packaging constraint only. It does not prove arbitrary layouts or
source-ref namespaces, and it does not complete the
Connect Authority milestone.

## Locked Boundary

- Add exactly one third physical-layout instance of the currently accepted
  team-owned bundle, with physical paths that differ from its current package
  paths but with no new bundle identity or authority content.
- Require each physical file to be an independent regular file, with no
  symlink or hardlink aliases, and byte-identical to its corresponding file in
  the currently accepted team-owned package so layout is the only changed
  variable.
- Use one checked layout descriptor to map every physical regular file
  bijectively onto exactly 12 ordered canonical logical entries:
  `manifest.json`, followed by the 11 paths in the existing `SC_SOURCE_FILES`
  closure. The manifest is mapped, byte-identical, and hash-checked like every
  other entry.
- Bind the raw mapping descriptor to a separate immutable, review-controlled
  layout-package fixture. Materialization verifies that trust anchor before
  staging and must never generate or rewrite it.
- Treat the physical files, layout descriptor, and layout-package fixture as
  immutable checked inputs. Materialization must never rewrite any input.
- Copy raw bytes into an isolated canonical logical workspace without parsing,
  transforming, normalizing, or rewriting file contents.
- Keep the existing `declared-source://source-conformance/` namespace and every
  embedded source ref unchanged.
- Run the unchanged source-conformance compiler closure in that workspace.
- Capture and re-verify the complete eight-artifact inner compiler closure after
  the temporary workspace is removed.
- Preserve exactly the current Button and InLineAlert authority boundary, six
  normalized source-fact tuples, nine immutable P2 catalog fields, referenced-
  route ownership, non-executable review items, and causal authority-expansion
  rejection.
- Emit report/evidence artifacts only. No demo is generated.

## Authority And Dependencies

The target is a derived proof consumer. Accepted P2 evidence and catalog remain
authority; source-family packaging evidence supplies compatibility and baseline
comparison only. The target cannot add or override upstream catalog, policy,
review, or proof authority. Its final evidence is authoritative only for
this physical-layout mapping contract.

Required accepted boundaries:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/source-family-packaging/evidence.json`, including its referenced
  canonical and candidate compiler closures;
- the checked source-conformance schema, fixture, compiler, Node 22, and package
  dependency closure already bound by the source-family packaging proof.

Checked inputs live under:

```text
sources/source-family-layout-mapping/team-owned-physical-bundle/
sources/source-family-layout-mapping/layout-mapping.json
fixtures/source-family-layout-mapping/layout-package.fixture.json
fixtures/source-family-layout-mapping/expectations.manifest.json
fixtures/source-family-layout-mapping/{valid,review,invalid,mutations}/
```

`layout-package.fixture.json` is the independent review-controlled trust anchor.
It fixes the physical root, mapping path, raw mapping SHA-256, and the exact
ordered 12-entry logical closure. It is an immutable checked input analogous to
a package lock: ordinary materialization verifies it and must never regenerate
it.

`layout-mapping.json` must close the complete independent-regular-file physical
tree. Its mapping rows may declare only:

- `physicalPath`;
- `logicalPath` from the existing canonical logical file set;
- raw-byte SHA-256.

The descriptor must also fix `copyMode: "raw-bytes"`,
`sourceRefRewrite: false`, `familySpecificModule: null`, and the current
canonical logical root. It must not define namespace aliases, replacements,
selectors, transforms, merges, defaults, JSON Pointers, parsers, plugins, or
other content-aware behavior.

The mapping must be one-to-one and onto `manifest.json` plus the ordered 11
`SC_SOURCE_FILES` entries. The physical layout must differ from the logical
layout for at least one directory and one filename so the proof cannot pass by
replaying the current package. The manifest's `sourceBundleId`, source-file
order, source refs, and all other content remain unchanged.

## Schemas

The target owns this closed schema set:

```text
schemas/source-family-layout-mapping.v0.schema.json
schemas/source-family-layout-mapping-package.v0.schema.json
schemas/source-family-layout-mapping-receipt.v0.schema.json
schemas/source-family-layout-mapping-fixture.v0.schema.json
schemas/source-family-layout-mapping-preflight-mutation.v0.schema.json
schemas/source-family-layout-mapping-expectations.v0.schema.json
schemas/source-family-layout-mapping-diagnostics.v0.schema.json
schemas/source-family-layout-mapping-report.v0.schema.json
schemas/source-family-layout-mapping-evidence.v0.schema.json
```

The schemas must close command paths, the physical file set, logical targets,
raw hashes, mapping cardinality, staging receipts, captured inner artifacts,
diagnostics, validation results, upstream refs, generated refs, environment,
status, promotion status, and final evidence self-hash.

## Command Contract

The implemented command is:

```bash
interfacectl surfaces source-family-layout-mapping proof \
  --source sources/source-family-layout-mapping/team-owned-physical-bundle \
  --mapping sources/source-family-layout-mapping/layout-mapping.json \
  --layout-package fixtures/source-family-layout-mapping/layout-package.fixture.json \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --source-family-packaging-evidence artifacts/source-family-packaging/evidence.json \
  --fixture fixtures/source-family-layout-mapping \
  --out artifacts/source-family-layout-mapping
```

All arguments are required fixed POSIX-relative paths. Absolute, duplicate,
substituted, non-normalized, hidden, traversal-bearing, symlinked, or
hardlink-aliased inputs and outputs must fail. The command may write only the
exact artifact set under `--out`; stale output must fail closed.

Exit codes preserve the repository convention:

- `0`: every expected result matches and final evidence passes;
- `1`: proof, fixture, integrity, mapping, authority, or evidence failure;
- `2`: invalid command usage or unsafe path.

## Artifacts

The target emits exactly:

```text
artifacts/source-family-layout-mapping/
  layout-mapping-receipt.json
  mapped-source-inventory.json
  mapped-source-fact-coverage.json
  mapped-source-authority-map.json
  mapped-source-review-queue.json
  mapped-governed-catalog.json
  mapped-authority-connection-report.json
  mapped-source-conformance-report.json
  mapped-source-conformance-evidence.json
  source-family-layout-mapping-report.json
  evidence.json
```

`layout-mapping-receipt.json` is a byte-preservation and path-mapping receipt,
not a new authority map. It records successful verification of the separate
layout-package trust anchor before staging. The eight `mapped-*` files are
persisted copies of the unchanged compiler output.
`source-family-layout-mapping-report.json` records mapping, staging, compiler,
comparison, probe, and fixture results before final evidence. Both the report
and final evidence require `mappedEvidenceRemap`, containing the logical source
root, physical source root, mapping ref, all eight logical-to-persisted artifact
pairs, and `verifiedAfterTemporaryWorkspaceRemoval: true`. `evidence.json` is
the proof authority for this target.

The report also requires a separate `authorityExpansionProbe` record. It must
state that baseline mapping and integrity verification passed before the probe,
identify the probe-only workspace and its two staged logical mutations, record
the unchanged inner compiler's `SOURCE_FACT_AUTHORITY_ESCALATION` code, and
confirm that no checked source or baseline artifact was changed. The inner code
is report evidence, not a target fixture diagnostic.

## Diagnostics

The target-specific registry includes canonical rows for:

- `SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING`;
- `SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH`;
- `SOURCE_LAYOUT_MAPPING_HASH_MISMATCH`;
- `SOURCE_LAYOUT_SOURCE_HASH_MISMATCH`;
- `SOURCE_LAYOUT_MAPPING_INCOMPLETE`;
- `SOURCE_LAYOUT_MAPPING_COLLISION`;
- `SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE`;
- `SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN`;
- `SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED`;
- `SOURCE_LAYOUT_FILE_UNDECLARED`;
- `SOURCE_LAYOUT_BYTE_MISMATCH`;
- `SOURCE_LAYOUT_TRANSFORM_FORBIDDEN`;
- `SOURCE_LAYOUT_CANONICAL_REF_MISMATCH`;
- `SOURCE_LAYOUT_COMPILER_HASH_MISMATCH`;
- `SOURCE_LAYOUT_COMPILER_RUN_FAILED`;
- `SOURCE_LAYOUT_AUTHORITY_EXPANSION`;
- `SOURCE_LAYOUT_REVIEW_REQUIRED`;
- `SOURCE_LAYOUT_INNER_EVIDENCE_INVALID`;
- `SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH`.

Canonical messages, stages, severities, promotion statuses, artifact paths,
JSON Pointers, source refs, suggested actions, and fixture coverage must be
declared before implementation. Expected invalid and mutation diagnostics may
appear in passing evidence only when their manifest expectations match.

`SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED` is reserved for an otherwise safe path
outside the exact 12-entry ABI. `SOURCE_LAYOUT_AUTHORITY_EXPANSION` is reserved
for a prohibited descriptor field that requests new component, fact, policy,
review, or namespace authority. Source-content authority expansion must reach
the unchanged compiler and preserve its exact inner diagnostic, including
`SOURCE_FACT_AUTHORITY_ESCALATION`; the wrapper must not replace or short-
circuit that causal result.

The source-content authority probe is causally isolated from outer integrity
checks. The proof must first stage and fully verify the accepted mapped bundle.
It then copies that verified logical workspace into a separate probe-only
workspace, mutates only the staged logical Button document and its inner
manifest hash, and invokes the unchanged compiler directly. Probe bytes never
replace checked source inputs or baseline output. The passing outer proof must
record the unchanged inner `SOURCE_FACT_AUTHORITY_ESCALATION` result from this
separate probe.

## Fixture Matrix

The minimum causal matrix is:

| Kind | Required case | Expected result | Promotion | Required diagnostic or report record |
| --- | --- | --- | --- | --- |
| valid | One alternate physical layout maps onto the exact 12-entry logical ABI and runs the unchanged compiler | `valid` | `allowed` | no diagnostic |
| review | The existing forked Button exception survives mapping with owner, rationale, expiry, required refs, and `executable: false` | `review_required` | `review_required` | `SOURCE_LAYOUT_REVIEW_REQUIRED` |
| preflight mutation | Accepted P2 or source-family packaging evidence is missing or non-passing | `invalid` | `blocked` | `SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING` |
| preflight mutation | One upstream boundary hash drifts | `invalid` | `blocked` | `SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH` |
| invalid | One required logical target is omitted | `invalid` | `blocked` | `SOURCE_LAYOUT_MAPPING_INCOMPLETE` |
| invalid | Two physical rows select the same logical target | `invalid` | `blocked` | `SOURCE_LAYOUT_MAPPING_COLLISION` |
| invalid | One physical path is traversal-bearing or hidden; focused variants cover symlink and other non-regular entries | `invalid` | `blocked` | `SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE` |
| invalid | One physical entry has a hardlink alias | `invalid` | `blocked` | `SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN` |
| invalid | One otherwise safe logical path is outside the exact 12-entry ABI | `invalid` | `blocked` | `SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED` |
| invalid | One extra physical regular file is absent from the descriptor | `invalid` | `blocked` | `SOURCE_LAYOUT_FILE_UNDECLARED` |
| mutation | One staged logical file differs from its verified physical input | `invalid` | `blocked` | `SOURCE_LAYOUT_BYTE_MISMATCH` |
| invalid | A parser, merge, selector, or other content-transform directive is added | `invalid` | `blocked` | `SOURCE_LAYOUT_TRANSFORM_FORBIDDEN` |
| invalid | One embedded canonical source ref drifts | `invalid` | `blocked` | `SOURCE_LAYOUT_CANONICAL_REF_MISMATCH` |
| invalid | A descriptor authority field requests a new component, fact, or namespace declaration | `invalid` | `blocked` | `SOURCE_LAYOUT_AUTHORITY_EXPANSION` |
| mutation | One physical source byte hash drifts from the accepted packaged-candidate counterpart | `invalid` | `blocked` | `SOURCE_LAYOUT_SOURCE_HASH_MISMATCH` |
| mutation | The raw mapping descriptor hash drifts from `layout-package.fixture.json` | `invalid` | `blocked` | `SOURCE_LAYOUT_MAPPING_HASH_MISMATCH` |
| mutation | The checked compiler hash drifts | `invalid` | `blocked` | `SOURCE_LAYOUT_COMPILER_HASH_MISMATCH` |
| probe | The verified probe workspace cannot complete the unchanged compiler run | `invalid` | `blocked` | `SOURCE_LAYOUT_COMPILER_RUN_FAILED` |
| mutation | One captured inner evidence hash drifts after workspace removal | `invalid` | `blocked` | `SOURCE_LAYOUT_INNER_EVIDENCE_INVALID` |
| mutation | The final evidence self-hash drifts | `invalid` | `blocked` | `SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH` |
| probe | After baseline mapping passes, the separate probe workspace adds the unaccepted Button `expressive` variant and updates only its inner manifest hash | `invalid` | `blocked` | `authorityExpansionProbe.innerDiagnostic.code: SOURCE_FACT_AUTHORITY_ESCALATION` |

Fixture expectations must be derived from changed proof inputs. Fixture ids or
declared expected diagnostics are not evidence that a failure occurred.

## Pass Condition

The proof passes only when:

1. accepted P2 and source-family packaging evidence pass full integrity checks;
2. the physical source tree, descriptor, immutable layout-package fixture,
   fixture tree, schema set, and output root are exact closed regular-file sets
   with no symlink or hardlink aliases;
3. the physical layout is demonstrably different from the canonical logical
   layout;
4. the mapping is bijective and covers exactly `manifest.json` plus the ordered
   11-entry `SC_SOURCE_FILES` closure;
5. each physical hash matches its accepted packaged-candidate counterpart before
   staging and the corresponding logical hash matches after staging, proving
   that layout is the only changed variable;
6. no manifest, source document, authority profile, policy, source ref, or
   namespace is rewritten;
7. the checked source-conformance compiler and runtime closure are unchanged and
   produce passing inner evidence;
8. `mappedEvidenceRemap` binds the logical and physical source roots, mapping
   ref, and all eight logical-to-persisted inner artifact pairs, and the
   persisted inner closure re-verifies after the isolated workspace is removed;
9. the six normalized fact tuples, nine immutable P2 catalog fields, active
   owner, review-required semantics, and non-executable state match accepted
   source-family packaging evidence;
10. the source-content authority-expansion probe still fails through the
    unchanged compiler in a separate post-verification probe workspace with the
    exact inner `SOURCE_FACT_AUTHORITY_ESCALATION` code, while wrapper-only
    scope probes use the target diagnostic;
11. every fixture result and canonical diagnostic matches the expectations
    manifest;
12. final evidence closes every schema, source, descriptor, fixture, compiler,
    runtime, upstream, generated, and self ref; and
13. final evidence records `status: "pass"` and
    `promotionStatus: "review_required"`.

## CI And Documentation

Implementation includes these serial package gates:

```text
materialize:source-family-layout-mapping
proof:source-family-layout-mapping
check:source-family-layout-mapping
check:source-family-layout-mapping:ci
check:source-family-layout-mapping:ci:phase
check:source-family-layout-mapping:untracked
```

The implemented script composition is:

- `materialize:source-family-layout-mapping` runs
  `materialize:source-family-packaging`, then only the target materializer;
- `check:source-family-layout-mapping` runs
  `npm run materialize:source-family-layout-mapping`, then
  `npm run proof:source-family-layout-mapping`, then serial `npm test`;
- `check:source-family-layout-mapping:ci` runs
  `npm run check:source-family-packaging:ci`, then
  `npm run check:source-family-layout-mapping:ci:phase`;
- `check:source-family-layout-mapping:ci:phase` runs
  `npm run check:source-family-layout-mapping`, then
  `git diff --exit-code -- schemas fixtures sources artifacts scripts src test bin/interfacectl.js package.json package-lock.json .github/workflows/surfaces-proof.yml VISION.md PLAN.md PROGRESS.md README.md plans`, then
  `npm run check:source-family-layout-mapping:untracked`; and
- `check:source-family-layout-mapping:untracked` enumerates exactly the target
  roots under `artifacts/`, `fixtures/`, and `sources/`; the nine schema paths;
  `scripts/materialize-source-family-layout-mapping.mjs`;
  `src/source-family-layout-mapping-contract.js`;
  `src/source-family-layout-mapping-proof.js`;
  `test/source-family-layout-mapping-proof.test.js`; and this plan path.

Proof and test commands remain sequential. The
`source-family-layout-mapping-proof` GitHub Actions job runs the phase gate
after source-family packaging passes. The capability index includes this target
because its evidence passes.

Implementation must update `PLAN.md`, `plans/README.md`, `PROGRESS.md`, and
`plans/surfaces-dev.md` in the same change set without changing `VISION.md`
authority or claiming milestone completion.

## Non-Goals

- No arbitrary layout, arbitrary filename set, or general packaging claim.
- No source-ref namespace parameterization, aliasing, remapping, or rewriting.
- No content transformation, parser, semantic inference, policy interpretation,
  or family-specific JavaScript.
- No new component, token, fact, policy, exception, action, accessibility, or
  review authority.
- No broader P2, Spectrum, source-family, or designer-workflow coverage.
- No live connector, source API, crawler, network fetch, or live ingestion.
- No self-serve connection or review UI.
- No runtime accessibility, WCAG, browser, or assistive-technology claim.
- No production adapter, public API, SDK, A2UI, native runtime, or hosted service.
- No SurfaceOps expansion and no JudgmentKit invocation or judgment claim.
- No customer validation, pilot readiness, production readiness, or product
  adoption claim.

## Implementation Record

1. Added the alternate physical-layout instance, checked byte-only mapping
   descriptor, and separate immutable layout-package trust anchor.
2. Added the target-owned schemas and diagnostics registry.
3. Added valid, review, invalid, mutation, probe, and expectations fixtures.
4. Implemented isolated byte-preserving staging with the unchanged inner
   source-conformance compiler.
5. Captured, remapped, and re-verified the eight inner artifacts after workspace
   cleanup.
6. Added baseline comparison, two causal failing probes, report, final evidence,
   tests, and serial gates.
7. Recorded passing evidence with `promotionStatus: "review_required"` and added
   the capability-index row without broadening the target boundary.
