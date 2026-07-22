# Source-Independent Design-System Compiler Proof Plan

Status: Implemented when `artifacts/design-system-compiler/evidence.json`
records `status: "pass"` and `promotionStatus: "review_required"`.

This non-numbered Connect Authority target replaces the bespoke Spectrum
Switch proof path with one source-independent compiler contract and one
portable, proof-only downstream consumer. Spectrum Switch and Astryx Button
are bounded data-only adapters. Both execute the same ingestion kernel and the
same consumer implementation without source-family or component branches.

This plan is subordinate to `VISION.md`, `PLAN.md`, and passing evidence. It
does not redefine the roadmap, authority taxonomy, or surface roles.

## Decision and authority boundary

Source-family differences belong in declarative adapter data, not compiler
modules. Each adapter owns:

- an immutable selected-file source lock with package identity, acquisition
  evidence, exact local root, ordered paths, byte counts, SHA-256 hashes,
  provenance, and a bounded license record;
- typed, unique source anchors over locked bytes: exact JSON Pointers or exact
  text ranges with required contained text;
- an `extract.v0`-shaped normalized fact set with source refs;
- a complete declarative mapping from every emitted component, member,
  accessibility, example, and token fact to verified anchors, including the
  source value, target value, allowed transform, and review status;
- the exact narrowing-only policy contract for inert runtime capabilities and
  non-executable review-required governance; and
- one allowed, one blocked, and one review-required consumer fixture.

`sources/design-system-compiler/*/adapter.json` and
`sources/design-system-compiler/*/source.lock.json` are checked data. They are
not executable source-specific adapters. There is no Spectrum module, Astryx
module, Switch branch, or Button branch in either shared kernel.

## Bounded source adapters

### Spectrum Switch

The Spectrum adapter is
`sources/design-system-compiler/spectrum-switch/adapter.json`. Its immutable
lock is `sources/design-system-compiler/spectrum-switch/source.lock.json`, and
its selected local tree contains exact `LICENSE` and `components/switch.json`
bytes from `@adobe/spectrum-design-data@0.7.0`.

The review-time identity is:

- npm SRI: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`;
- tarball SHA-256: `12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0`;
- selected-file SHA-256: `f71fca208251775638f52f9b6dfefc19104b17119512f6c3ae491da3c684b512`; and
- license boundary: the selected Apache-2.0 byte at
  `sources/design-system-compiler/spectrum-switch/npm/@adobe/spectrum-design-data/0.7.0/package/LICENSE`,
  SHA-256 `981250df8283f951cb49f9cdcaa405d49e0313b0d4f3cd174d25f709f802cfba`.

The adapter normalizes only the locked Switch facts it maps: component
identity, six props, three states, bounded accessibility metadata, and one
purpose example. It emits no executable actions, events, slots, data bindings,
token values, runtime key behavior, toggle execution, or accessibility
compliance claim. Promotion remains `review_required`.

### Astryx Button

The independent second adapter is
`sources/design-system-compiler/astryx-core/adapter.json`. Its immutable lock is
`sources/design-system-compiler/astryx-core/source.lock.json`. It binds the
official Astryx release tag `v0.1.2` to commit
`6c533c70674cf32c38a2ef85a3d4a648df91eb4b` and selects a materially different
documentation-and-StyleX source model.

The review-time identity is:

- npm package: `@astryxdesign/core@0.1.2`;
- npm SRI: `sha512-SJOEXUaRvcVgGbdPwV5UL5aYMbwIl09H2yQb3hPh4NNGWqmLTHE05IFTNRi37Mk9ywoo01+UM2ZrewmJe39f0A==`;
- tarball SHA-256: `9c35a4d56053457d55f4388d3fb28b46f95dd707df099dd439cfe0d5c94f9c2a`;
- `src/Button/Button.doc.mjs` SHA-256:
  `fda24e50a206d4e1061a548b62eee3ced10bde354159386b7ddc43dbe79e7ad6`;
- `src/theme/tokens.stylex.ts` SHA-256:
  `b9a5274e60c502c396794a0b396c0d7e3e9969f0c7205db12f120b98d60c166d`;
  and
- license boundary: the MIT `LICENSE` byte at the tagged commit, SHA-256
  `a6855be541fc8f446acd1bc4f2f8efce1ace6dce71dba32fcd8da553ee54b473`.

The adapter normalizes only its mapped Button identity, props, variant,
disabled state, accessibility naming facts, one purpose example, and the
`size-element-md` token. The documented async click action remains
non-executable and review-required rather than becoming runtime authority.

These identities are immutable review inputs, not live npm or GitHub
authority. Ordinary proof execution performs local lock conformance only: it
does not fetch a registry tarball, resolve a current tag, run upstream code, or
rewrite a lock.

## Shared ingestion kernel

`src/design-system-ingestion-kernel.js`, invoked by the source-independent
`src/design-system-compiler-proof.js` orchestrator, owns the reusable
compilation path. For each manifest row the kernel:

1. enforces relative POSIX roots and exact selected-file closure, rejects
   symlinks and byte/hash drift, and verifies the immutable source lock;
2. derives and checks every source ref from its typed locator, and requires text
   anchors to have exactly one start and end match;
3. proves normalized source-ref closure and complete mapping coverage;
4. requires lossless structured target leaves, including emitted member keys
   and member `id` values, to be justified by verified source atoms or
   conservative platform defaults, and keeps declared inferences
   review-required;
5. admits runtime capability and governance data only through the exact
   narrowing-only, inert, review-required policy contract;
6. rejects mapping source drift, target drift, or invented catalog authority;
7. returns deterministic `extract.v0`, catalog, and governed-catalog values
   with normalized timestamps and provenance.

The generic proof orchestrator validates and persists those values, sets
host-derived catalog/report provenance to `null`, and issues a
`catalog-boundary-receipt.v0` single-adapter compiler compatibility envelope
binding the source lock, adapter, extract, catalog, governed catalog, and shared
compiler implementation hash. It also aggregates kernel diagnostics, report
results, source and implementation refs, and final evidence without branching
on a source family. This envelope is not the source-neutral platform release
receipt, and it proves no catalog composition.

The kernel owns the canonical source-preflight, adapter, compile, and evidence
diagnostics. It fails closed with codes including `SOURCE_LOCK_MISMATCH`,
`SOURCE_REF_UNRESOLVED`, `MAPPING_SOURCE_MISMATCH`,
`MAPPING_TARGET_MISMATCH`, `MAPPING_COVERAGE_INCOMPLETE`,
`MAPPING_AUTHORITY_UNJUSTIFIED`, `SOURCE_IDENTITY_REUSED`, and
`COMPILER_AUTHORITY_ESCALATION`.

## Shared portable consumer

`src/catalog-consumer-kernel.js` proves the first reusable downstream loop. It
does not read a source-family adapter directly. It accepts only a
schema-complete, passing, review-required, hash-valid
`catalog-boundary-receipt.v0`. The shared compiler compatibility validator binds
the requested adapter identity, receipt identity, governed-catalog provenance,
adapter hash, compiler identity, canonical receipt source refs, and the exact
supplied governed-catalog ref before projection.

For each adapter, the unchanged consumer:

- derives a `web-static-portable` runtime projection without adding catalog
  authority;
- accepts the allowed fixture and emits exactly one deterministic inert render
  plan with `executed: false` and no side effects;
- blocks an unknown component member with `CONSUMER_UNKNOWN_MEMBER` and emits
  no render plan; and
- preserves review-required governance for a promotion request with
  `CONSUMER_REVIEW_REQUIRED` and emits no promoted render plan.

A missing, stale, nonpassing, or hash-drifted receipt fails before projection
or rendering with `CATALOG_BOUNDARY_INVALID`. This is a proof-only consumer,
not a production renderer. Generic platform release validation and catalog
composition remain planned contracts.

## Contract files

The proof validates its complete shape through these exact schema groups:

- shared normalized output: `schemas/diagnostics.v0.schema.json`,
  `schemas/extract.v0.schema.json`, and
  `schemas/runtime-catalog.v0.schema.json`;
- source and adapter data: `schemas/portable-design-source-lock.v0.schema.json`
  and `schemas/design-system-adapter.v0.schema.json`;
- target orchestration: `schemas/design-system-compiler-manifest.v0.schema.json`
  and `schemas/design-system-compiler-mutation.v0.schema.json`;
- consumer boundary: `schemas/catalog-boundary-receipt.v0.schema.json`,
  `schemas/catalog-consumer-fixture.v0.schema.json`,
  `schemas/catalog-runtime-projection.v0.schema.json`,
  `schemas/catalog-render-plan.v0.schema.json`, and
  `schemas/catalog-consumer-report.v0.schema.json`; and
- aggregate closure: `schemas/design-system-compiler-diagnostics.v0.schema.json`,
  `schemas/design-system-compiler-report.v0.schema.json`, and
  `schemas/design-system-compiler-evidence.v0.schema.json`.

## Proof command and CI

The exact proof command is:

```bash
interfacectl surfaces design-system-compiler proof \
  --manifest fixtures/design-system-compiler/targets.manifest.json \
  --out artifacts/design-system-compiler
```

Package gates are:

```bash
npm run proof:design-system-compiler
npm run check:design-system-compiler
npm run check:design-system-compiler:ci:phase
npm run check:design-system-compiler:ci
```

CI authority is the `design-system-compiler-proof` job in
`.github/workflows/surfaces-proof.yml`. It runs
`npm run check:design-system-compiler:ci:phase` after the P2 proof job. The
composed `check:design-system-compiler:ci` gate also runs the accepted P2 CI
chain first; this dependency does not make P2 portable or make P2 an input to
the generic compiler command.

## Artifacts and evidence

For each manifest `outputKey`, the proof writes:

```text
artifacts/design-system-compiler/<outputKey>/extract.json
artifacts/design-system-compiler/<outputKey>/catalog.json
artifacts/design-system-compiler/<outputKey>/governed-catalog.json
artifacts/design-system-compiler/<outputKey>/boundary-receipt.json
artifacts/design-system-compiler/<outputKey>/runtime-projection.json
artifacts/design-system-compiler/<outputKey>/render-plan.json
artifacts/design-system-compiler/<outputKey>/consumer-report.json
```

The two current output keys are `astryx-core-button` and `spectrum-switch`.
The aggregate outputs are:

```text
artifacts/design-system-compiler/design-system-compiler-report.json
artifacts/design-system-compiler/evidence.json
```

The report records both adapter runs, all six consumer outcomes, causal
mutation results, and a reuse proof. The reuse proof requires one transitive
local implementation-closure hash for every ingestion run, one transitive
local implementation-closure hash for every consumer run, `sharedKernel: true`,
`sharedConsumer: true`, and an empty `sourceSpecificImplementationModules`
array derived from the transitive compiler closure. Final evidence closes every
generated artifact, the proof's checked schemas, its implementation and
instruction refs, the target manifest, both adapters, both source locks,
selected source bytes, consumer fixtures, report, and its own JCS self-hash.
Those 43 checked refs are an implementation-and-instruction inventory, not the
transitive implementation closure. Evidence verification independently
re-derives adapter, source, package, and component identities; transitive kernel
and consumer closure hashes; every adapter artifact chain; reuse proof;
diagnostics; and run ID. It does not trust those relationships merely because
the report and evidence hashes were repaired together.

## Causal mutation and rejection coverage

The committed mutation fixtures prove four cross-boundary failures:

- adding an Astryx executable action without a corresponding declarative
  mapping fails with `MAPPING_COVERAGE_INCOMPLETE`;
- changing Spectrum's lossless `isDisabled` target default from source-backed
  `false` to `true` fails with `MAPPING_AUTHORITY_UNJUSTIFIED`;
- renaming Spectrum's lossless `isDisabled` member key and `id` to an
  unverified identifier fails with `MAPPING_AUTHORITY_UNJUSTIFIED`; and
- changing the Spectrum receipt's governed-catalog hash fails consumer
  preflight with `CATALOG_BOUNDARY_INVALID`.

Focused contract tests also require a changed selected source byte to fail with
`SOURCE_LOCK_MISMATCH`, report the exact path of authority added above a
normalized baseline, reject non-canonical CLI roots, forbid source-family and
component names in the shared compiler closure, causally detect a
source-specific executable module, reject computed module loads and symlinked
closure paths, and re-verify every artifact, implementation, source, report,
and evidence relationship even after coherent hash repair.

## Declining marginal-cost criterion

Adding a third qualifying design system may change only:

- selected locked source bytes and one immutable source lock under
  `sources/design-system-compiler/<source-id>/`;
- one declarative `adapter.json` in that directory;
- allowed, blocked, and review fixtures under
  `fixtures/design-system-compiler/<source-id>/`;
- one sorted data row in
  `fixtures/design-system-compiler/targets.manifest.json`;
- the manifest-derived output under `artifacts/design-system-compiler` and
  aggregate capability-index output under `artifacts/capability-index`; and
- the required instruction updates in `plans/design-system-compiler.md` and
  `plans/surfaces-dev.md`.

The architecture gate compares this change with the admitted base manifest. It
must preserve every existing adapter row and adapter/fixture/source closure,
leave the four generic compiler mutation fixtures unchanged, append exactly one
sorted row under a unique direct-child adapter key, and keep each consumer
fixture under that key's unshared
`fixtures/design-system-compiler/<adapter-key>/` directory. A fixture may not point into an
artifact or another adapter's data.

Adapter/report/evidence cardinality and the expected per-adapter artifact
closure are derived from the sorted manifest. The capability registry declares
the aggregate output root rather than enumerating the current two adapters.
Therefore a third qualifying row must not require an output-schema or registry
change.

It must not add or change a source-family implementation module, compiler
branch, consumer branch, component special case, output schema, or capability
registry row, and it must not change any other doc. If a new source cannot pass
through that closure, it is not evidence of reuse and must not be called a
supported adapter without a
separately reviewed source-neutral contract change with existing-adapter parity.
That platform change must land separately from the adapter data that needs it.

## Acceptance criteria

- Both locked adapters pass the same ingestion and consumer implementations.
- Spectrum JSON Pointers and Astryx text anchors resolve only inside their exact
  selected-file locks.
- Every normalized authority fact has an accepted or review-required mapping;
  unmapped authority and invented member keys or identifiers block.
- Each adapter emits extract, catalog, governed catalog, hash-bound receipt,
  projection, one allowed inert render plan, and a three-case consumer report.
- Both implementation-hash arrays contain one shared value and no
  source-specific implementation module is recorded.
- Allowed, blocked, review-required, source-byte-tamper, unmapped-authority,
  and stale-receipt cases produce the expected outcomes and diagnostics.
- `artifacts/design-system-compiler/evidence.json` reconstructs and passes its
  complete hash closure.
- A future qualifying source requires data-only additions described above.

## Legacy boundaries and non-capabilities

P2 remains the accepted bounded Spectrum Button/InLineAlert ingestion proof,
and Spectrum Checkbox remains its accepted adjacent catalog proof. They are not
rewritten or portabilized by this target. P3, P4, P5 protocol, and P5 native
remain bound to their existing P2-derived inputs and do not consume these
portable catalogs. The existing P1 proof is also not redefined; this target
owns a separate portable consumer contract only.

This target does not claim full Spectrum support, full Astryx support, arbitrary
source models, multi-source catalog merge, live npm or GitHub authority, source
execution, production runtime behavior, production accessibility compliance,
production adapters, a public API, an SDK, A2UI export or conformance,
production SurfaceOps, live JudgmentKit invocation, or production readiness.
