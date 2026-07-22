# Agent Instructions

## Project Contract

SurfacesPlatformV2 is a proof-contract repo, not a conventional application. The work here is to compile design-system source material into governed UI contracts with deterministic schemas, fixtures, diagnostics, generated artifacts, demos, and evidence.

Work from the repository root:

```bash
/Users/mike/SurfacesPlatformV2
```

Do not claim a capability is implemented unless it has the full proof shape: schema, fixture, proof command, diagnostics, report or artifact path, and evidence path.

## Documentation Authority

Read in this order before selecting or implementing phase work:

1. `VISION.md`
2. `PLAN.md`
3. `plans/README.md`
4. The relevant phase subplans
5. The matching machine contracts under `schemas/`, `fixtures/`, `src/`, `scripts/`, `artifacts/`, and `demo/`

`VISION.md` is canonical for product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules.

`PLAN.md` and `plans/**` are mechanical proof-contract references: schemas, fixtures, commands, artifacts, diagnostics, reports, evidence, and acceptance criteria. Phase subplans may add phase-local mechanics. They must not redefine the product vision, authority taxonomy, roadmap sequence, surface roles, or agent operating rules from `VISION.md`.

If docs conflict, preserve this authority order unless the user explicitly directs a change.

## Current Phase Boundaries

The accepted roadmap sequence is:

- P0: synthetic catalog contract proof.
- P1: `web-static` runtime projection and render-plan proof.
- P2: real design-system ingestion from a bounded, manifest-declared local source bundle.
- P3: inert agent recruitment and orchestration proof after P2 ingestion evidence passes.
- P4: SurfaceOps and JudgmentKit review and judgment proof.
- P5: protocol boundaries and target-specific adapter proofs.

P0-P5 are currently implemented through package scripts and tracked proof artifacts. P5 implementation is limited to the proof-only `surfaces-protocol-static` and `surfaces-native-static` slices.

Production adapters, public APIs, SDKs, live runtimes, A2UI export or conformance, production SurfaceOps, and live JudgmentKit remain planned until each target adds its own schemas, fixtures, commands, artifacts, reports, demos, CI gate, and passing evidence. Do not treat planned proof commands as runnable just because they appear in docs.

Important phase constraints:

- P0 fixtures are synthetic proof inputs, not real design-system extraction.
- P1 runtime projections, render plans, and demos are derived consumers, not new authority.
- P2 is ingestion only. Its local npm package snapshot is checked against the review-controlled `sources/p2/design-system-source/package-snapshot.lock.json`, whose npm identity, SRI, tarball SHA-256, and file hashes were established during a separate review-time tarball verification. Normal materialization verifies the exact local package tree against this lock and must never regenerate it. The deterministic proof does not fetch or reconstruct the tarball, so it proves local lock conformance rather than the original download ceremony. P2 must not call live source APIs, crawl docs, build runtime adapters, recruit agents, persist SurfaceOps decisions, or run JudgmentKit.
- P3 work orders are inert proof artifacts. They authorize no live agents, shell commands, tool calls, connector calls, network calls, file edits, secrets, callbacks, persistent review decisions, or execution.
- P4 emits deterministic SurfaceOps and JudgmentKit-shaped proof artifacts only. Do not invoke live SurfaceOps or live JudgmentKit unless the user explicitly asks for it in this project.
- P5 protocol and native artifacts remain inert derived consumers. They do not implement production adapters, live runtimes, public APIs, or SDKs.
- A2UI remains unimplemented until a target-specific P5 proof adds its own schema, fixtures, diagnostics, command contract, conformance proof, and evidence.

Do not revive older P2-as-agent-orchestration wording. Current docs place real design-system ingestion in `plans/p2/` and agent orchestration in `plans/p3/`.

## Platform Architecture Guardrails

`VISION.md#platform-architecture-invariants` is canonical. The checked policy at
`fixtures/platform-path-consolidation/architecture-policy.json` makes its
machine-checkable subset executable.

- Run `npm run check:platform-architecture` before adding or changing a source
  adapter, component proof, catalog path, shared kernel, or downstream catalog
  consumer. When reviewing a branch, run
  `npm run check:platform-architecture -- --base <git-sha>` so change-boundary
  rules compare the branch with its base.
- Treat a new source or component as a data addition. Adapter changes may touch
  only the six policy-listed cochange entries: the four data and derived-output
  prefixes
  `sources/design-system-compiler`, `fixtures/design-system-compiler`,
  `artifacts/design-system-compiler`, and `artifacts/capability-index`, plus the
  required instruction surfaces `plans/design-system-compiler.md` and
  `plans/surfaces-dev.md`. Code, commands, schemas, runtime paths, and other docs
  are outside the adapter change boundary.
- Adapter manifests, adapter contracts, and portable source locks must satisfy
  their canonical schemas. Fixture and derived-output roots are JSON-only;
  source snapshots may contain executable-looking upstream files only when the
  exact regular-file closure, byte counts, and SHA-256 values match the inert
  source lock. Base-aware admission preserves every existing adapter row and
  closure, freezes the four generic compiler mutation fixtures, and permits
  exactly one new sorted manifest row under a unique direct-child adapter key.
  Its three consumer fixtures must be regular JSON files rooted under that
  key's unshared fixture directory. Symlinks,
  noncanonical paths, artifact-as-input fixture refs, replacement adapters,
  and unowned adapter data are prohibited.
- If an adapter exposes a missing generic capability, implement and prove the
  shared capability first with source-neutral contract fixtures and parity for
  existing adapters. Do not combine that platform change with the source or
  component addition that needs it.
- Keep shared platform modules source-identity-branch-free: do not dispatch on
  a concrete source family, package, component, adapter key, or output key.
  Generic identity validation is permitted only by an exact row in the frozen,
  non-growing 113-row allowance registry. Express supported variation through
  closed schemas and checked data.
- Keep every dependency imported by protected shared code inside the protected,
  source-identity-branch-free closure. The v0 scanner closes 83 executable
  paths under `bin/`, `scripts/`, and `src/` and 241 local dependency edges.
  Every canonical and neutral executable is byte-frozen in v0; legacy
  executables retain their separate exact hash locks. Every current test and
  GitHub execution file, the dependency lock, all four generic compiler mutation
  fixtures, each admitted adapter closure, and the complete 15-schema compiler
  runtime contract closure are also byte-frozen. The repo-wide
  tracked-path inventory rejects a new root tool, workflow, action, test, or
  other side path outside the four inert adapter/output roots. Frozen paths
  must remain regular files; do not introduce symbolic links at the repository
  root or under executable, test, or workflow roots. Computed
  `import()` and `require()` targets are prohibited.
- Do not add an executable registration or CLI route. v0 prohibits new
  canonical, neutral, and legacy executables, freezes every route, and freezes
  the exclusive role owners for source ingestion, compiler orchestration,
  catalog authority, release compatibility, and catalog consumption. Catalog
  composition has no owner and remains planned.
- Do not add a source-specific compiler, catalog merger, receipt validator,
  proof kernel, or consumer. Catalog creation uses its registered shared
  authority function. Do not claim or introduce composition until its separate
  generic proof exists.
- Treat `catalog-boundary-receipt.v0` and
  `src/catalog-release-boundary.js` as the single-adapter design-system-compiler
  compatibility envelope only. They are not a source-neutral platform release
  receipt or a generic composition boundary.
- Do not import P0, P2, target-specific modules, source-specific modules, or
  their internal exports from shared platform code. Dependency direction is
  phase or target to shared platform code.
- Do not add a new consumer that reads P2 catalog/evidence directly, imports a
  producer's internals, or clones and expands an accepted catalog.
- Do not add or broaden a legacy exception. Existing exceptions in the
  architecture policy are a migration queue. Their implementation bytes remain
  frozen while present. They may shrink only when the corresponding legacy
  implementation is actually deleted; that deletion may remove its exact
  registration, frozen hash, and exception.
- Do not rewrite the migration baseline. The policy binds
  `fixtures/platform-path-consolidation/baseline.manifest.json` to raw SHA-256
  `be51419b5b3f3eb43bdfae4b6a6d27e98f2b2336c18c9f5c7fb395663d6da71c`.
  Its scoped inventory contains 1,117 paths. The policy-declared root exclusions
  are the four adapter and derived-output roots listed above. The changed
  evidence rows use exact admitted post-extraction self and closure hashes, not
  permanent drift allowances.
- Do not change the one-time architecture bootstrap checkpoint at
  `32543bfb7c5701c054f9c8c157a4f7cf0504fcbf`, its admitted-policy SHA-256
  `2c8b25a7680bd9eb433d48b9369aac869fc7fd4f4b288e07c50a8051d0ce55a0`, or
  its normalized policy-schema SHA-256
  `1e83158351aea11f56490b49087e33dbddfe24ac7955b799f105aee981c0b272`.
  The bootstrap also binds the initial adapter manifest hash recorded in the
  machine policy.
  The first base-aware run enforces change-set separation only from that
  checkpoint to `HEAD`; it does not claim that the supplied base-to-checkpoint
  range was reviewed or conformed.
- Every architecture run schema-validates the candidate policy and verifies
  the normalized policy-schema hash. Bootstrap runs also verify the admitted
  initial policy hash. When a comparison base contains the contract, the gate
  loads and validates that base policy, schema, and adapter manifest before
  enforcing closed evolution. The trusted `pull_request_target` job must run
  the base branch's verifier over the candidate checkout without executing
  candidate lifecycle or architecture code; require its status and an
  up-to-date head before merge after bootstrap.
- Do not edit the 177 frozen v0 implementation, test, adapter, dependency,
  guard, control, schema, mutation, workflow, or baseline-protection files in
  place. A machine-enforced rule change requires a separately reviewed,
  versioned successor contract and corresponding schemas, fixtures, tests,
  `plans/platform-path-consolidation.md`, and `plans/surfaces-dev.md` updates.

The architecture command is a read-only internal conformance gate. It writes no
artifacts and creates no implemented capability or retirement claim.

## Repository Shape

- `bin/interfacectl.js` and `bin/interfacectl`: CLI entrypoints.
- `src/`: proof and contract implementation.
- `scripts/`: materialization and demo-generation scripts.
- `schemas/`: JSON Schema contracts.
- `fixtures/`: proof inputs and expectation manifests.
- `artifacts/`: generated proof artifacts and evidence.
- `demo/`: generated static demo output.
- `test/`: Node test suite.
- `.github/workflows/surfaces-proof.yml`: CI for the implemented P0-P5 and non-numbered target proof gates.

The project is Node.js ESM and CI uses Node 22.

## Editing Rules

Prefer changing the source of truth and regenerating derived output:

- Change implementation in `src/`, `scripts/`, or `bin/`.
- Change contracts in `schemas/` and corresponding fixture manifests together.
- Regenerate `artifacts/` and `demo/` with the package scripts.
- Treat `sources/p2/design-system-source/package-snapshot.lock.json` as an immutable checked input. Ordinary materialization may compare local package bytes with it but must never regenerate or rewrite it.
- Avoid hand-editing generated artifacts unless the task is specifically to inspect or repair generated output and the proof still passes afterward.

Preserve:

- source refs;
- provenance;
- artifact hashes;
- diagnostic codes and canonical diagnostic messages;
- promotion status;
- review-required semantics;
- deterministic ordering;
- UTC normalized timestamps;
- host-derived fields set to `null`;
- RFC 8785/JCS canonical JSON expectations.

Proof command paths must remain POSIX-style paths relative to the workspace root. Do not introduce absolute CLI inputs, `.` segments, `..` traversal, symlinked output roots, hidden outputs, or stale-output bypasses.

Deterministic generated artifacts and demos are tracked in this repo. `.gitignore` ignores dependencies and non-byte-stable browser runtime evidence under `output/playwright/`, so new deterministic files under `schemas/`, `fixtures/`, `artifacts/`, `demo/`, `src/`, `scripts/`, or `test/` must be intentionally added or removed.

For any phase change that alters commands, schemas, fixtures, artifacts, evidence, diagnostics, demos, or operating rules, update `plans/surfaces-dev.md` or the future `surfaces.dev` docs package in the same change set. That tracking doc is an instruction surface, not proof authority.

## Verification

Use `npm ci` when dependencies need installation.

Verification is selected by change scope. These are the available command sets, not a requirement to run every command for every change:

```bash
npm run check:platform-architecture
npm test
npm run check:p0:ci
npm run check:p1:ci
npm run check:p2:ci
npm run check:p3:ci
npm run check:p4:ci
npm run check:p4:ci:phase
npm run check:p5:protocol:ci
npm run check:p5:native:ci
```

Minimum expectations:

- Docs-only changes: run `git diff --check`.
- Architecture, adapter, shared-kernel, catalog-authority, or catalog-consumer
  changes: run `npm run check:platform-architecture`; use `--base <git-sha>`
  when the change boundary must be reviewed against a branch base.
- P0-only contract or implementation changes: run `npm run check:p0:ci`.
- P1-only, CLI, package, generated artifact, broad proof, or cross-phase changes: run the highest relevant proof gate, at minimum `npm run check:p1:ci`.
- P2 ingestion changes: run `npm run check:p2:ci`.
- P3 orchestration changes or broad post-P3 changes: run `npm run check:p3:ci`.
- P4 review/judgment changes or broad post-P4 changes: run `npm run check:p4:ci`.
- P4 phase-only CI jobs may use `npm run check:p4:ci:phase` after the P3 proof gate has already passed.
- P5 protocol changes: run `npm run check:p5:protocol:ci`.
- P5 native or broad post-P5 changes: run `npm run check:p5:native:ci`.
- Focused code changes can use `npm test` during iteration, but finish with the relevant proof gate.

`npm test` runs `check:platform-architecture` first through `pretest`. The
dedicated CI job supplies the pull-request base SHA or the pre-push main SHA so
rules about newly introduced paths, policy weakening, and cross-boundary
changes cannot rely on the checked-out head alone.

Before mutation-heavy gates such as `npm test`, `npm run check:p0:ci`, `npm run check:p1:ci`, `npm run check:p2:ci`, `npm run check:p3:ci`, `npm run check:p4:ci`, `npm run check:p4:ci:phase`, `npm run check:p5:protocol:ci`, or `npm run check:p5:native:ci`, run `git status --short` and confirm the worktree is quiescent: no unexpected files, no in-progress generated-output edits, and no parallel agent or process writing into the repo. If a gate must run with intentional source edits present, make that scope explicit before starting.

Do not run proof/test commands concurrently with edits. The P0 tests mutate the real workspace and restore it; keep verification sequential.

Always report which commands passed. If a command was skipped, say why.

## Agent Orchestration

The user may ask you to recruit and orchestrate helper agents during normal repository work. That is an execution technique for this coding session. The lead agent remains responsible for synthesis, edits, verification, and final claims.

When using helper agents:

- Give each agent a bounded, non-overlapping task.
- Prefer read-only explorer agents for independent repo questions.
- Use worker agents only when their write scope is explicit and disjoint.
- Tell worker agents they are not alone in the codebase and must not revert unrelated edits.
- Integrate results yourself instead of pasting them unreviewed.
- Close agents when their output is no longer needed.

Do not confuse live helper-agent usage in the coding environment with the product's P3 orchestration proof. P3 artifacts are inert descriptors until a later phase explicitly proves and authorizes live execution.

## Memory And Durable Context

When Agent Memory tools are available, retrieve relevant project context before work and capture durable repo decisions after work. Store durable facts at project scope for this repository. Do not use memory to override the current user request, repository files, or proof evidence.

## Final Response Expectations

Keep final responses concise and evidence-oriented:

- Name the files changed.
- Call out implemented versus planned phase scope.
- Report verification commands and outcomes.
- Mention any remaining risk or skipped verification.

Do not overclaim demos, runtime projections, review queues, docs, or planned phase commands as proof authority.
