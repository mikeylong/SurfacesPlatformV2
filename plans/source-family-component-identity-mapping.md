# Source Family Component Identity Mapping Proof Plan

## Status

Implemented as a bounded non-numbered Connect Authority proof when
`artifacts/source-family-component-identity-mapping/evidence.json` records
`status: "pass"`. This plan is subordinate to `VISION.md`, `PLAN.md`,
`plans/README.md`, and `PROGRESS.md`.

## Purpose

Prove that one checked 12-file Button and InLineAlert authority bundle can use
the fixture-local `TeamButton` component identity when one explicit, team-owned
authority declaration authorizes the exact `TeamButton` to accepted P2 `Button`
relation.

Passing evidence removes one exact component-identity constraint. It does not
prove arbitrary component identities, an alias registry, semantic inference,
broader component coverage, live source connection, or self-serve
configuration, and it does not complete the Connect Authority milestone.

## Authority Model And User Value

The authority declaration is checked design-system source material. It owns the
identity relation because it binds the source identity, accepted P2 target,
source refs, provenance, hashes, review owner, and review status. The mapping
descriptor, Stage 1 normalizer, namespace normalizer, receipts, reports, and
evidence are derived consumers. They may verify and apply the declared relation;
they cannot create, infer, broaden, or override it.

The bounded user value is: a team can explicitly declare that one of its source
component identities refers to the already accepted P2 Button contract, and
Surfaces can verify and apply that declaration without a source-conformance
compiler edit.

This proof does not claim that Surfaces inferred semantic equivalence or that
`TeamButton` and `Button` are generally interchangeable. `TeamButton` is a
fixture-local source identity, and the accepted target remains exactly the
current P2 `Button` contract.

## Locked Boundary

- Consume accepted P2 catalog/evidence and accepted
  source-family-namespace-mapping evidence with their complete referenced
  closures.
- Reuse exactly the accepted fixed physical layout, alternate source-ref
  namespace, 12-file closure, Button and InLineAlert facts, policies, owner-bound
  review semantics, and accepted P2 capability ceiling.
- Use one checked source bundle whose only authorized identity-content changes
  are exactly 22 `TeamButton` occurrences at declared JSON Pointers in these
  five files:
  - `review/authority-map.json`;
  - `ui/button-definition.json`;
  - `ui/button-fork.json`;
  - `ui/button-source-a.json`; and
  - `ui/button-source-b.json`.
- Refresh exactly the five corresponding manifest source-file hashes. No other
  manifest field may change.
- Preserve exactly four declared narrative `Button` fields in
  `rules/source-order.json`, `ui/button-definition.json`,
  `ui/button-source-a.json`, and `ui/button-source-b.json`. Narrative prose is
  not part of the component-identity relation and must not be rewritten.
- Require one explicit team-owned authority declaration for exactly
  `TeamButton` to accepted P2 `Button`. No inverse relation, second relation,
  alias chain, fallback, wildcard, or registry is allowed.
- Stage 1 may replace only the 22 declared identity values and five declared
  manifest hashes in an isolated workspace. Its 12-file result must be
  byte-identical to the accepted fixed-namespace input.
- Stage 2 must invoke the existing fixed namespace normalizer over the Stage 1
  result. Stage 2 must reproduce the accepted canonical logical bundle before
  the unchanged source-conformance compiler runs.
- Persist all eight inner compiler artifacts, re-verify their complete evidence
  closure after temporary workspace removal, and require exact equality with
  the accepted source-family namespace-mapping artifacts.
- Preserve the causal `SOURCE_FACT_AUTHORITY_ESCALATION` probe through the
  unchanged compiler.
- Emit report/evidence artifacts only. No demo is generated.

## Authority Declaration Contract

The checked authority manifest and declaration at
`sources/source-family-component-identity-mapping/authority/component-identity-authority-manifest.json`
and
`sources/source-family-component-identity-mapping/authority/component-identity-declaration.json`
must be closed. The manifest binds the declaration bytes, schema, source refs,
and provenance. The declaration must contain at least:

- `schemaId`, `version`, and a stable declaration id;
- `relationKind: "component-identity"` and
  `scope: "component-identity-only"`;
- `fromComponentId: "TeamButton"` and `toComponentId: "Button"`;
- exact declared source refs for the source component documents and authority
  profile covered by the relation;
- a source-bundle manifest ref and raw-byte hash;
- an accepted target record naming `Button`,
  `catalog://p2/components/Button`, the exact P2 governed-catalog path and hash,
  the RFC 8785/JCS hash of the exact `components.Button` record, and the exact
  passing P2 evidence path and hash;
- review metadata with accepted status, the active source owner, a declared
  review-policy ref, rationale, canonical expiry metadata, and
  `executable: false`; and
- provenance with author identity, canonical declared time, declaration source
  ref, and the complete ordered source-ref closure.

The identity package and final evidence hash-bind the raw declaration bytes.
The declaration's accepted target hashes must match current accepted P2
evidence before Stage 1 begins. The review owner must match the active owner
proved by accepted namespace-mapping evidence. Missing, stale, expired,
review-required, or contradictory declaration metadata cannot authorize
normalization.

The declaration authorizes identity resolution only. It cannot authorize new or
changed components, facts, props, variants, states, tokens, actions,
accessibility semantics, policies, exceptions, review routes, or runtime
capabilities.

## Authority And Inputs

The target is a derived mapping proof. Its evidence is authoritative only for
this one declared relation and two-stage execution contract.

Required accepted boundaries:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/source-family-namespace-mapping/evidence.json` and its complete
  referenced closure.

Immutable checked trust inputs:

```text
sources/source-family-component-identity-mapping/team-owned-identity-bundle/
sources/source-family-component-identity-mapping/component-identity-mapping.json
sources/source-family-component-identity-mapping/authority/component-identity-authority-manifest.json
sources/source-family-component-identity-mapping/authority/component-identity-declaration.json
fixtures/source-family-component-identity-mapping/component-identity-package.fixture.json
```

Deterministically materialized proof fixtures:

```text
fixtures/source-family-component-identity-mapping/expectations.manifest.json
fixtures/source-family-component-identity-mapping/{valid,review,mutations}/
```

Ordinary materialization verifies the source bundle, declaration, mapping
descriptor, and identity package before and after regenerating target-owned
schemas and causal fixtures. It must never generate or rewrite those trust
inputs.

## Two-Stage Causal Pipeline

```text
checked TeamButton bundle + authority declaration
  -> Stage 1: exact component-identity substitutions
  -> exact accepted fixed-namespace input
  -> Stage 2: existing fixed namespace normalizer
  -> exact accepted canonical logical bundle
  -> unchanged source-conformance compiler
  -> exact accepted eight-artifact result
  -> persisted post-workspace evidence re-verification
```

Stage 1 must prove all of the following before writing its receipt:

1. the declaration, descriptor, identity package, and source hashes match;
2. the declaration targets the current accepted P2 Button ref and hashes;
3. review status is accepted, owner-bound, unexpired, and non-executable;
4. all 22 alternate identity values occur once at the declared pointers;
5. no canonical `Button` identity value occurs at a mapped identity pointer;
6. exactly four declared narrative `Button` mentions remain unchanged;
7. only the five declared manifest hashes change during normalization; and
8. the complete 12-file output is byte-identical to the accepted namespaced
   baseline.

Stage 2 must use the accepted namespace mapping and production normalizer rather
than a component-identity-specific reimplementation. The namespace descriptor,
namespace package, implementation closure, and output must pass their existing
validators. Stage 2 then runs the unchanged source-conformance compiler under
Node 22.

## Schemas

```text
schemas/source-family-component-identity-authority-manifest.v0.schema.json
schemas/source-family-component-identity-authority-declaration.v0.schema.json
schemas/source-family-component-identity-mapping.v0.schema.json
schemas/source-family-component-identity-package.v0.schema.json
schemas/source-family-component-identity-mapping-receipt.v0.schema.json
schemas/source-family-component-identity-mapping-fixture.v0.schema.json
schemas/source-family-component-identity-mapping-preflight-mutation.v0.schema.json
schemas/source-family-component-identity-mapping-expectations.v0.schema.json
schemas/source-family-component-identity-mapping-diagnostics.v0.schema.json
schemas/source-family-component-identity-mapping-report.v0.schema.json
schemas/source-family-component-identity-mapping-evidence.v0.schema.json
```

The schemas close command paths, the exact `TeamButton` and `Button` values, the
authority declaration, source refs, provenance, hashes, P2 target refs, review
owner and status, the ordered 22-substitution and five-manifest-refresh closure,
the four unchanged narrative mentions, Stage 1 and Stage 2 receipts, the exact
ordered eight-row logical-to-persisted artifact remap, captured inner artifacts,
diagnostics, validation results, upstream refs, compiler/runtime/proof
implementation refs, environment, status, promotion status, and final evidence
self-hash.

## Command

```bash
interfacectl surfaces source-family-component-identity-mapping proof \
  --source sources/source-family-component-identity-mapping/team-owned-identity-bundle \
  --authority-manifest sources/source-family-component-identity-mapping/authority/component-identity-authority-manifest.json \
  --authority-declaration sources/source-family-component-identity-mapping/authority/component-identity-declaration.json \
  --mapping sources/source-family-component-identity-mapping/component-identity-mapping.json \
  --identity-package fixtures/source-family-component-identity-mapping/component-identity-package.fixture.json \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --source-family-namespace-mapping-evidence artifacts/source-family-namespace-mapping/evidence.json \
  --fixture fixtures/source-family-component-identity-mapping \
  --out artifacts/source-family-component-identity-mapping
```

All arguments are required normalized POSIX-relative paths. Absolute,
duplicate, substituted, hidden, traversal-bearing, symlinked, or hardlink-
aliased inputs and outputs fail closed. Exit `0` means every expected result
matches and evidence passes; exit `1` means a proof or integrity failure; exit
`2` means invalid command usage or unsafe paths.

## Artifacts

```text
artifacts/source-family-component-identity-mapping/
  component-identity-mapping-receipt.json
  namespace-mapping-receipt.json
  identity-mapped-source-inventory.json
  identity-mapped-source-fact-coverage.json
  identity-mapped-source-authority-map.json
  identity-mapped-source-review-queue.json
  identity-mapped-governed-catalog.json
  identity-mapped-authority-connection-report.json
  identity-mapped-source-conformance-report.json
  identity-mapped-source-conformance-evidence.json
  source-family-component-identity-mapping-report.json
  evidence.json
```

The component-identity receipt records the authority-manifest and declaration
refs, exact from/to identity, 22 ordered substitution rows, five manifest hash
refreshes, four unchanged narrative rows, before/after file hashes, Stage 1
baseline equality, and Stage 2 namespace input ref. The persisted namespace
receipt is built directly from the actual existing-normalizer result and must
match the accepted namespace receipt schema. The eight `identity-mapped-*`
files are persisted copies of the unchanged inner compiler output. The report
records declaration, Stage 1, namespace, compiler, comparison, probe, and
fixture results before final evidence.

## Diagnostics And Mutation Matrix

The closed registry covers:

- missing, non-passing, or hash-drifted P2 or namespace evidence;
- authority-manifest, authority-declaration, mapping-descriptor,
  identity-package, or source hash drift;
- the same authority declaration changing to `review_required`;
- a missing identity substitution or reversed mapping;
- a wrong alternate or canonical identity value at any declared pointer;
- an extra identity pointer;
- an identity substitution in a sixth physical file;
- a changed or missing narrative `Button` mention;
- undeclared top-level or nested component scope or executable behavior added
  to the authority declaration, immutable package, or mapping descriptor;
- accepted-baseline input used directly to bypass the declared `TeamButton`
  relation;
- skipped or reversed Stage 1 and Stage 2 execution;
- Stage 1 intermediate output tampering before Stage 2;
- accepted namespace mapping, namespace package, or namespace implementation
  drift;
- compiler/runtime drift or compiler failure;
- persisted inner-evidence failure; and
- final evidence self-hash mismatch.

The minimum causal matrix is:

| Kind | Changed proof input | Expected result |
| --- | --- | --- |
| valid | One accepted declaration authorizes all 22 exact `TeamButton` to `Button` substitutions | `allowed` |
| review | A fixture changes the same owner-bound declaration to `review_required` | `review_required`; Stage 1 does not normalize and no compiler artifacts are emitted for that fixture |
| accepted run | The accepted declaration normalizes and the existing fork semantics survive both stages | aggregate `promotionStatus: "review_required"` |
| preflight mutation | P2 evidence is missing, non-passing, stale, or hash-drifted | blocked |
| preflight mutation | Namespace evidence is missing, non-passing, stale, or hash-drifted | blocked |
| mutation | Declaration bytes or the identity-package declaration hash drifts | blocked |
| mutation | Authority-manifest bytes or its identity-package hash drifts | blocked |
| mutation | Mapping bytes or identity-package mapping hash drifts | blocked |
| mutation | One checked source byte or manifest-bound hash drifts | blocked |
| invalid | One of 22 substitution pointers is missing or an extra pointer is requested | blocked |
| invalid | One declared pointer contains the wrong alternate or canonical value | blocked |
| invalid | An identity substitution expands into a sixth file | blocked |
| invalid | The fixed relation is reversed | blocked |
| invalid | One of four narrative `Button` mentions changes | blocked |
| invalid | Undeclared top-level or nested component scope or executable behavior appears in the authority declaration, immutable package, or mapping descriptor | blocked |
| mutation | The accepted namespaced baseline is supplied directly to bypass Stage 1 and the declared relation | blocked |
| mutation | Stage 1 intermediate output is changed after its receipt and before Stage 2 | blocked |
| mutation | Stage 1 or Stage 2 is skipped or executed in reverse order | blocked |
| mutation | Accepted namespace mapping or namespace package bytes drift | blocked |
| mutation | Existing namespace normalizer implementation drifts | blocked |
| mutation | Checked compiler/runtime input drifts or the compiler cannot run | blocked |
| mutation | Persisted inner evidence or final evidence is tampered | blocked |
| probe | Verified input adds the unaccepted Button `expressive` variant | exact inner `SOURCE_FACT_AUTHORITY_ESCALATION` |

Fixture expectations must come from actual changed proof inputs. Fixture ids and
declared expected diagnostics are not evidence that production validation ran.
Authority-manifest, declaration, mapping, identity-package, namespace mapping,
namespace package, namespace implementation, and compiler hash mutations must
invoke the corresponding production validators.

## Pass Condition

The proof passes only when:

1. accepted P2 and namespace-mapping evidence and every referenced boundary pass
   full integrity checks;
2. source, declaration, mapping, identity package, fixture, schema, namespace,
   compiler, runtime, proof-implementation, and output closures are exact regular-
   file sets;
3. the authority manifest and declaration validate, and the declaration is the
   sole authority for exactly
   `TeamButton` to accepted P2 `Button`, and its refs, provenance, hashes, target,
   owner, status, rationale, expiry, and non-executable state validate;
4. Stage 1 applies exactly 22 declared substitutions across the exact five files
   and refreshes exactly five manifest hashes;
5. all four narrative `Button` mentions remain byte-identical;
6. no undeclared or non-identity source content changes;
7. the Stage 1 12-file output is byte-identical to the accepted fixed-namespace
   input;
8. Stage 1 cannot be bypassed, and Stage 1 and Stage 2 execute exactly once in
   that order with the intermediate hash closure preserved;
9. the accepted namespace mapping, package, and implementation validate, and the
   existing namespace normalizer runs unchanged and produces its accepted
   canonical 12-file result plus its persisted schema-locked receipt;
10. the unchanged source-conformance compiler runs under Node 22 and produces
   passing evidence;
11. all eight persisted inner artifacts and their schema-locked remap re-verify
    after workspace cleanup and equal accepted namespace-mapping outputs;
12. Button and InLineAlert facts, nine immutable P2 catalog fields, active owner,
    review semantics, promotion status, and non-executable state remain
    unchanged;
13. the explicit review declaration fixture emits non-executable review-required
    output without running Stage 1 or emitting compiler artifacts for that
    fixture, while the accepted declaration run remains aggregate
    `review_required` because the existing fork semantics survive;
14. the isolated authority-expansion probe returns the exact blocked inner
    diagnostic and source-conformance run-expectation failure;
15. every causal fixture result matches its registry-backed expectation; and
16. final evidence closes all 12 artifacts plus every input, boundary, and self
    ref with
    `status: "pass"` and `promotionStatus: "review_required"`.

## Implementation Inventory

Implementation is closed over these target surfaces:

- source trust inputs under
  `sources/source-family-component-identity-mapping/`;
- target schemas listed above;
- target fixtures under `fixtures/source-family-component-identity-mapping/`;
- generated artifacts listed above;
- `src/source-family-component-identity-mapping-contract.js`;
- `src/source-family-component-identity-mapping-proof.js`;
- `scripts/materialize-source-family-component-identity-mapping.mjs`;
- `test/source-family-component-identity-mapping-proof.test.js`;
- shared CLI dispatch and usage behind the unchanged `bin/interfacectl.js`
  entrypoint;
- package scripts for materialization, proof, checks, CI, phase-only CI, and the
  untracked guard;
- one GitHub job depending on `source-family-namespace-mapping-proof`;
- one capability-index row and refreshed capability artifacts; and
- same-change updates to `VISION.md`, `PLAN.md`, `plans/README.md`,
  `PROGRESS.md`, `plans/capability-index.md`, `plans/surfaces-dev.md`,
  `plans/design-system-readiness.md`, and this subplan.

No generated demo, runtime surface, or public product implementation belongs in
this inventory.

## Serial Verification Order

The repository's mutation-heavy gates must not overlap edits or one another.
Before implementation edits, establish and record the accepted baseline in this
exact order:

```bash
git status --short
npm run check:source-family-namespace-mapping:ci
git status --short
```

The first and final status checks must show a clean expected baseline. After
implementation is complete and no agent or process is writing the repository,
verify serially:

```bash
git status --short
npm run materialize:source-family-component-identity-mapping
npm run proof:source-family-component-identity-mapping
git status --short
node --test --test-concurrency=1 test/source-family-component-identity-mapping-proof.test.js
git status --short
npm test
npm run status
git diff --check
```

On a clean committed tree or in CI, run the proof-bearing gates serially:

```bash
git status --short
npm run check:source-family-component-identity-mapping:ci
git status --short
npm run check:capability-index:ci
npm run status
git diff --cached --check
git diff --check
```

Each status check audits the immediately following mutation-heavy gate group.
For the composed `:ci` gates, the intended slice must already be staged and the
status audit must show no unexpected unstaged or untracked files.

Do not claim a composed `:ci` wrapper passed when intentional unstaged changes
cause its drift guard to fail. Report every command actually run and every
skipped command with its reason.

## CI Edges And Documentation

The serial package surface is:

```text
materialize:source-family-component-identity-mapping
proof:source-family-component-identity-mapping
check:source-family-component-identity-mapping
check:source-family-component-identity-mapping:ci
check:source-family-component-identity-mapping:ci:phase
check:source-family-component-identity-mapping:untracked
```

The `source-family-component-identity-mapping-proof` GitHub job depends on
`source-family-namespace-mapping-proof`. The capability-index proof depends on
passing component-identity evidence and covers 18 implemented targets other than
itself. No designer-workflow-trace, SurfaceOps, JudgmentKit, runtime, adapter, or
other consumer gains authority or a new dependency merely because this target
passes.

## Non-Goals

- No arbitrary component identity, second identity pair, alias registry, alias
  chain, inverse mapping, wildcard, fallback, or general rewrite engine.
- No inference of semantic, behavioral, visual, accessibility, or runtime
  equivalence.
- No new component, prop, variant, state, token, fact, policy, exception,
  action, accessibility, review, or runtime authority.
- No additional physical layout, filename set, or source-ref namespace.
- No broader P2 or Spectrum coverage and no new design-system family.
- No live connector, network fetch, source API, crawler, Figma, Storybook, Code
  Connect, CLI, MCP, template, theme, swizzle, or ejected-source authority.
- No self-serve connection UI.
- No runtime accessibility, browser, assistive-technology, or WCAG claim.
- No production adapter, API, SDK, A2UI, native runtime, or hosted service.
- No SurfaceOps expansion and no JudgmentKit invocation or judgment claim.
- No customer validation, pilot readiness, production readiness, or adoption
  claim.
