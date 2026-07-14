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
- P5: production adapters, protocol boundaries, and A2UI exports or conformance.

P0, P1, P2, P3, and P4 are currently implemented through package scripts and tracked proof artifacts.

P5 is a planned contract until its schemas, fixtures, commands, artifacts, reports, demos, and evidence are implemented. Do not treat planned proof commands as runnable just because they appear in docs.

Important phase constraints:

- P0 fixtures are synthetic proof inputs, not real design-system extraction.
- P1 runtime projections, render plans, and demos are derived consumers, not new authority.
- P2 is ingestion only. It must not call live source APIs, crawl docs, build runtime adapters, recruit agents, persist SurfaceOps decisions, or run JudgmentKit.
- P3 work orders are inert proof artifacts. They authorize no live agents, shell commands, tool calls, connector calls, network calls, file edits, secrets, callbacks, persistent review decisions, or execution.
- P4 emits deterministic SurfaceOps and JudgmentKit-shaped proof artifacts only. Do not invoke live SurfaceOps or live JudgmentKit unless the user explicitly asks for it in this project.
- A2UI is deferred to P5 unless P5 adds its own schema, fixtures, diagnostics, command contract, conformance proof, and evidence.

Do not revive older P2-as-agent-orchestration wording. Current docs place real design-system ingestion in `plans/p2/` and agent orchestration in `plans/p3/`.

## Repository Shape

- `bin/interfacectl.js` and `bin/interfacectl`: CLI entrypoints.
- `src/`: proof and contract implementation.
- `scripts/`: materialization and demo-generation scripts.
- `schemas/`: JSON Schema contracts.
- `fixtures/`: proof inputs and expectation manifests.
- `artifacts/`: generated proof artifacts and evidence.
- `demo/`: generated static demo output.
- `test/`: Node test suite.
- `.github/workflows/surfaces-proof.yml`: CI for P0-P4 proof gates.

The project is Node.js ESM and CI uses Node 22.

## Editing Rules

Prefer changing the source of truth and regenerating derived output:

- Change implementation in `src/`, `scripts/`, or `bin/`.
- Change contracts in `schemas/` and corresponding fixture manifests together.
- Regenerate `artifacts/` and `demo/` with the package scripts.
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
npm test
npm run check:p0:ci
npm run check:p1:ci
npm run check:p2:ci
npm run check:p3:ci
npm run check:p4:ci
npm run check:p4:ci:phase
```

Minimum expectations:

- Docs-only changes: run `git diff --check`.
- P0-only contract or implementation changes: run `npm run check:p0:ci`.
- P1-only, CLI, package, generated artifact, broad proof, or cross-phase changes: run the highest relevant proof gate, at minimum `npm run check:p1:ci`.
- P2 ingestion changes: run `npm run check:p2:ci`.
- P3 orchestration changes or broad post-P3 changes: run `npm run check:p3:ci`.
- P4 review/judgment changes or broad post-P4 changes: run `npm run check:p4:ci`.
- P4 phase-only CI jobs may use `npm run check:p4:ci:phase` after the P3 proof gate has already passed.
- Focused code changes can use `npm test` during iteration, but finish with the relevant proof gate.

Before mutation-heavy gates such as `npm test`, `npm run check:p0:ci`, `npm run check:p1:ci`, `npm run check:p2:ci`, `npm run check:p3:ci`, `npm run check:p4:ci`, or `npm run check:p4:ci:phase`, run `git status --short` and confirm the worktree is quiescent: no unexpected files, no in-progress generated-output edits, and no parallel agent or process writing into the repo. If a gate must run with intentional source edits present, make that scope explicit before starting.

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
