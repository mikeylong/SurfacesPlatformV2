# Demo And CI

## Decision
P2 includes a generated static demo and CI gate for real design-system ingestion proof artifacts. The demo is presentation output derived from passing P2 evidence; it is not proof authority and does not contain hand-authored source claims.

## Goal
Make the ingestion proof inspectable without weakening the proof boundary. A reviewer should be able to see source coverage, extracted catalog material, mapping decisions, review-required rows, diagnostics, and hashes from the current evidence.

## Inputs
- `artifacts/p2/evidence.json`.
- `artifacts/p2/source-inventory.json`.
- `artifacts/p2/source-mapping.json`.
- `artifacts/p2/extract.json`.
- `artifacts/p2/catalog.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p2/ingestion-report.json`.

## Outputs
- `demo/p2/README.md`.
- `demo/p2/data.json`.
- `demo/p2/index.html`.
- CI scripts that materialize P2, run P0/P1/P2 proof gates, rebuild the demo, run tests, and fail on tracked or untracked drift.

## Demo Rules
- Demo generation must require passing `artifacts/p2/evidence.json`.
- Demo generation must verify the full evidence closure, including `sourceManifestRef`, `sourceFileRefs`, `schemaClosure`, `fixtureRefs`, `artifactRefs`, and the final self-hash.
- Demo output must be deterministic and self-contained.
- Demo output may display source file coverage, source refs, mapping rows, extracted components, token coverage, governance results, review-required rows, diagnostics, artifact refs, and evidence status.
- Demo output must not contain remote source calls, hidden source files, untracked mapping decisions, or hand-authored claims absent from evidence.
- Demo output is not included in P2 evidence hashes.

## CI Gate
P2 keeps a non-mutating planning guard:

```bash
npm run check:p2:planning
```

That guard validates the schemas, source-plan files, valid Spectrum fixtures, invalid/review/mutation fixture presence, diagnostic-code coverage, source and mapping ref normalization, evidence closure, package script wiring, and the `check:p2:untracked` guard. It is not proof evidence and must not be described as `check:p2:ci`.

P2 also exposes proof-bearing commands:

```bash
npm run materialize:p2
npm run proof:p2
npm run build:p2-demo
npm run check:p2
npm run check:p2:ci
```

`proof:p2` and any test helper that eventually executes the ingest proof must invoke:

```bash
node bin/interfacectl.js surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2
```

The evidence artifact records `interfacectl surfaces ingest proof` as the logical command string while package scripts invoke `node bin/interfacectl.js`.

`check:p2:ci` must:

- materialize P0/P1/P2 schemas, fixtures, and declared source bundle metadata;
- run P0 proof unchanged;
- run P1 proof unchanged;
- run P2 ingest proof;
- rebuild `demo/p2`;
- run the full test suite;
- fail if generated schemas, fixtures, artifacts, source inventory, source mapping, catalogs, evidence, or demos drift;
- run the inherited P0 and P1 untracked-file guards or an equivalent superset before claiming P2 CI success;
- fail if expected P2 generated/source files are untracked.

The shared `npm test` invocation is intentional. P2 test coverage lives in the common Node test suite, but the P2 CI sequence runs after the inherited P0 and P1 proof gates so new P2 tests cannot silently replace or weaken earlier phase checks.

P2 CI must treat `git diff --exit-code -- schemas fixtures artifacts demo` as necessary but not sufficient. It must also detect untracked P0, P1, and P2 generated-output and source files because untracked files can otherwise bypass proof drift checks.

## P2 Proof
The demo/CI layer passes only when P2 evidence passes, demo output rebuilds deterministically from evidence, tests cover the P2 ingestion proof contract and tamper cases, and drift checks confirm generated artifacts are current.

Proof-bearing gate logs, commit SHA, and the final `artifacts/p2/evidence.json` hash must be preserved with the PR or merge record for shipped claims. They are not generated proof artifacts and must not be written under `artifacts/p2`.

## Follow-Up Backlog
The next follow-up PR should be scoped as public/docs overclaim guard plus remaining workflow filename or CI cleanup, if needed. It should keep P2 claims limited to deterministic local ingestion of the declared `@adobe/spectrum-design-data@0.7.0` source snapshot for `button` and `in-line-alert`, and it must not treat generated demos, workflow labels, or CI summaries as proof authority beyond `artifacts/p2/evidence.json`.

Later hardening work remains backlog, not current implementation. Track double-run determinism, ref-closure tampering variants, additional JSON Pointer negative cases, additional symlink cases, evidence tampering variants, and the source-tree closure decision as future cases extending existing coverage classes; each still needs schemas, fixtures, diagnostics, commands, artifacts, reports, and evidence before it can be claimed.

## Allowed Claims
With passing evidence, claims are scoped to deterministic local npm package ingestion for `@adobe/spectrum-design-data@0.7.0`, initial components `button` and `in-line-alert`, and the declared source snapshot. P2 must not claim full Spectrum support, live ingestion, runtime adapter rendering, A2UI support, SurfaceOps operation, JudgmentKit evaluation, P3 orchestration, or Adobe endorsement.

## Non-Goals
- No public docs deployment.
- No live dashboard.
- No source connector execution.
- No SurfaceOps persistence.
- No analytics or telemetry.
