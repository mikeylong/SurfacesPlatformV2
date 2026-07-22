# Platform Path Consolidation

Status: Phase 2 shared proof runtime and single-adapter compiler
release-compatibility validation implemented, with an internal
architecture-conformance gate active. A source-neutral platform release
receipt, catalog composition, source migration, consumer rebinding, and legacy
retirement remain planned.

This plan is subordinate to `VISION.md`, `PLAN.md`, and passing target evidence.
It consolidates implementation mechanics without changing P0-P5 semantics,
source authority, diagnostics, promotion outcomes, or historical evidence.

## End state

The target architecture beyond the current compatibility envelope is:

```text
locked source + declarative adapter
  -> shared normalization and ingestion
  -> shared catalog compiler
  -> adapter receipt
  -> optional shared composition/governance
  -> canonical catalog-release receipt
  -> shared consumer preflight
  -> target-specific consumer
```

P0, P1, and P2 remain named proof surfaces and become thin conformance
harnesses. P3, P4, P5, source policy, workflow, and SurfaceOps retain their
target-specific behavior but stop owning generic catalog validation or
P2-specific preflight.

## Architecture enforcement during migration

The canonical rules are
`VISION.md#platform-architecture-invariants`. The checked policy at
`fixtures/platform-path-consolidation/architecture-policy.json` registers the
83 executable paths discovered under `bin/`, `scripts/`, and `src/`, every
detected CLI route, the 241-edge local module graph, data-only adapter roots,
exclusive platform-role owners, direct legacy P2 consumers, and the finite
legacy-exception set.

```bash
npm run check:platform-architecture
npm run check:platform-architecture -- --base <git-sha>
```

The command validates the policy, executes 34 declared causal mutations in
memory, checks the current repository, verifies the immutable migration
baseline, and optionally checks new branch changes against a base SHA. It
rejects unregistered executables and routes, computed module loading,
dependencies that leave the protected closure, new direct P2 consumers, and
legacy-exception growth. Every current test and GitHub execution file, the
dependency lock, all four generic compiler mutation fixtures, each admitted
adapter closure, and the complete 15-schema compiler runtime contract closure
are byte-frozen. A repo-wide tracked-path inventory rejects new root
tools, workflows, actions, tests, or other side paths outside the four inert
adapter/output roots. Frozen paths must remain regular files; symbolic links at
the repository root or under executable, test, and workflow roots fail closed.

Protected shared code is source-identity-branch-free: it does not dispatch on a
concrete package, source family, component, adapter key, or output key. Generic
identity validation is allowed only by an exact row in the frozen, non-growing
113-row allowance registry. An adapter change may cochange only
`sources/design-system-compiler`, `fixtures/design-system-compiler`,
`artifacts/design-system-compiler`, `artifacts/capability-index`,
`plans/design-system-compiler.md`, and `plans/surfaces-dev.md`. Any code,
command, schema, runtime path, other documentation, or reusable platform change
outside those six entries fails the adapter change set.
The manifest, adapter contracts, and portable source locks are validated
against their canonical schemas. Fixture and derived-output roots are
JSON-only. Source snapshots may contain executable-looking upstream files only
inside the exact regular-file closure whose byte counts and SHA-256 values
match the inert source lock; symlinks and noncanonical paths fail admission.
Base-aware adapter evolution preserves all existing manifest rows and closures,
keeps the four generic mutation fixtures unchanged, and permits exactly one new
sorted adapter row under a unique direct-child adapter key, with three fixtures
under that key's unshared fixture directory.

The first base-aware run is anchored to immutable checkpoint
`32543bfb7c5701c054f9c8c157a4f7cf0504fcbf`. The exact admitted policy is bound
to SHA-256 `2c8b25a7680bd9eb433d48b9369aac869fc7fd4f4b288e07c50a8051d0ce55a0`,
and the normalized policy schema is bound to SHA-256
`1e83158351aea11f56490b49087e33dbddfe24ac7955b799f105aee981c0b272`.
After validating the checkpoint relationship, the command applies change-set
separation only to checkpoint-to-`HEAD`; it does not claim that the supplied
base-to-checkpoint range was reviewed or architecture-conformant.

Ordinary local and base-aware runs schema-validate the candidate policy and
verify the normalized policy-schema hash. Bootstrap runs also verify the
admitted initial policy hash. When a comparison base contains the contract, the
base-aware run separately loads and validates the base policy, schema, and
adapter manifest before applying evolution rules.

The v0 role registry freezes one exclusive owner for source ingestion, compiler
orchestration, catalog authority, release compatibility, and catalog
consumption. Catalog composition has no owner and remains planned. New
canonical, neutral, and legacy executable registrations are all prohibited, as
are new CLI routes. Canonical and neutral registrations cannot be removed or
reclassified, and every canonical and neutral executable is byte-frozen in v0.
Legacy implementation bytes stay separately frozen while registered, but
actual file deletion may remove the matching legacy registration, frozen hash,
and exception. The policy also binds exact raw hashes for 177 v0 implementation,
test, adapter, dependency, guard, control, schema, mutation, workflow, and
baseline-protection files. A future architecture-rule change
requires a separately reviewed versioned successor instead of an in-place v0
rewrite.

The architecture gate runs before every `npm test`, before the focused
design-system compiler proof, and in a dedicated full-history CI job that
compares pull requests with their base and main pushes with the pre-push SHA.
After this bootstrap PR merges, the separate `pull_request_target` workflow
runs only the default branch's trusted verifier over the candidate checkout;
repository settings must require its `platform-architecture-trusted` status and
an up-to-date head. The workflow reruns on PR edits so a retargeted base cannot
reuse a result computed against the previous base.
Existing legacy exceptions are a shrinking migration queue. The gate emits no
proof artifacts and does not satisfy the final retirement-proof contract.

## Phase 1: freeze and baseline

`fixtures/platform-path-consolidation/baseline.manifest.json` is the immutable
pre-migration comparison boundary. `node scripts/verify-platform-path-baseline.mjs`
reconstructs it directly from checked evidence, catalogs, source locks, and the
tracked implementation inventory. It does not materialize proofs or read a
candidate output tree. The architecture policy binds the baseline's raw bytes
to SHA-256
`be51419b5b3f3eb43bdfae4b6a6d27e98f2b2336c18c9f5c7fb395663d6da71c`.

The baseline records:

- every retained top-level target evidence self-hash, status, and promotion;
- JCS hashes for components, tokens, source refs, runtime capabilities,
  governance, and provenance in the five catalog baselines;
- raw-byte hashes for the P2, Checkbox, Spectrum Switch, and Astryx locks; and
- a scoped 1,117-path tracked implementation inventory and its ordered-path
  hash. Its four policy-declared root exclusions are
  `artifacts/capability-index`, `artifacts/design-system-compiler`,
  `fixtures/design-system-compiler`, and `sources/design-system-compiler`.

The Phase 1 slice admitted no new component work after this freeze. A baseline
change requires a separately reviewed versioned migration contract; ordinary
implementation and proof commands must never rewrite it in place.

The verifier validates the manifest schema, recomputes every evidence self-hash
with its self-ref hash set to `null`, and checks each embedded catalog/report
hash against the referenced JSON's JCS serialization. Source-lock,
catalog-authority, and implementation-inventory checks always remain active.
The policy records exact post-extraction self-hashes for the eight evidence rows
changed by this work and exact post-extraction catalog/report-closure hashes for
the seven rows whose closures changed. These are admitted migration values, not
ongoing drift allowances: any later byte movement fails. The verifier still
checks each evidence self-hash and every referenced artifact before comparing
the admitted value.

## Retirement-proof contract shape

The schemas and fixtures added in Phase 1 reserve the final proof boundary.
They are not an implemented proof claim. The eventual proof must emit one
report, diagnostics registry, and evidence closure and causally reject a
negative fixture that reintroduces a legacy import, command, artifact ref, or
accepted-hash constant.

Required final assertions:

1. shared and consumer modules import neither `p0.js`, `p2-contract.js`, nor
   `p2Internals`;
2. shared implementations contain no source-family or component branches;
3. every consumer names the future source-neutral canonical catalog-release
   receipt;
4. declared legacy files, routes, scripts, jobs, schemas, and accepted-hash
   constants are absent;
5. preserved locks and source bytes remain hash-valid;
6. all migration parity reports pass; and
7. P0-P5 and every retained non-numbered target still pass.

## Phase 2: proof runtime and compiler release compatibility

`src/proof-runtime.js` owns phase-independent RFC 8785/JCS serialization,
SHA-256 hashing, and typed canonical artifact references for shared platform
kernels. `src/catalog-authority.js` owns recursive catalog source-ref collection
and the non-expanding authority-escalation comparison used by ingestion and
consumers. `src/catalog-release-boundary.js` owns the fail-closed compatibility
validator for the current single-adapter compiler proof. These neutral modules
do not compose catalogs, resolve source precedence, interpret policy, or grant
authority. The source-independent ingestion and portable consumer kernels
import neither P0 nor P2 implementation modules.

The current `catalog-boundary-receipt.v0` schema identifies the accepted
compiler proof's single-adapter compatibility envelope. It is validated before
the first consumer artifact is written. A missing, stale, nonpassing, blocked,
mistyped, or hash-drifted receipt fails at `catalog-boundary` and produces no
consumer output. This validator is not the source-neutral platform release
receipt and cannot be reused as proof of generic catalog composition.

The generic platform release receipt and catalog composition remain planned.
This phase does not compose catalogs, migrate any source, rebind legacy
downstream consumers, delete legacy mechanics, or change accepted catalog
authority, diagnostics, promotion outcomes, source refs, locks, or P0-P5
semantics.

## Migration sequence

1. Extract a phase-independent proof runtime and the compiler's single-adapter
   release-compatibility validator.
2. Add a source-neutral platform release receipt and generic ordered catalog
   composition with collision rejection, explicit reviewed policy,
   strictest-promotion propagation, and two independent proofs.
3. Shadow P2 Button/InLineAlert through declarative data, then migrate Checkbox
   through composition while preserving exact authority subtrees and outcomes.
4. Consolidate layout, namespace, identity, and non-expanding governance
   normalization without interpreting free-form policy.
5. Rebind P1, source conformance, P3, P4, P5 protocol/native, SurfaceOps,
   designer workflow, review UI, and capability index in dependency order.
6. Run the retirement proof, then delete only legacy mechanics whose
   reachability is zero.

Rollback remains a manifest selection change until retirement. Immutable locks,
selected source bytes, migration parity evidence, and historical proof evidence
are preserved.

## Phase 1 non-goals

The Phase 1 freeze-and-baseline slice changed no kernel, compiler, catalog,
receipt, consumer, source adapter, phase command, or generated target evidence.
It did not implement composition, migrate Spectrum or Checkbox, rebind
downstream consumers, delete legacy mechanics, invoke live SurfaceOps or
JudgmentKit, or claim production readiness.
