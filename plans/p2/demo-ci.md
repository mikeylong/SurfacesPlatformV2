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
- `demo/p2/index.html`.
- CI scripts that materialize P2, run P0/P1/P2 proof gates, rebuild the demo, run tests, and fail on tracked or untracked drift.

## Demo Rules
- Demo generation must require passing `artifacts/p2/evidence.json`.
- Demo output must be deterministic and self-contained.
- Demo output may display source file coverage, source refs, mapping rows, extracted components, token coverage, governance results, review-required rows, diagnostics, artifact refs, and evidence status.
- Demo output must not contain remote source calls, hidden source files, untracked mapping decisions, or hand-authored claims absent from evidence.
- Demo output is not included in P2 evidence hashes.

## CI Gate
P2 is not implementation-complete until `package.json` exposes:

```bash
npm run materialize:p2
npm run proof:p2
npm run build:p2-demo
npm run check:p2
npm run check:p2:ci
```

`check:p2:ci` must:

- materialize P0/P1/P2 schemas, fixtures, and declared source bundle metadata;
- run P0 proof unchanged;
- run P1 proof unchanged;
- run P2 ingest proof;
- rebuild `demo/p2`;
- run the full test suite;
- fail if generated schemas, fixtures, artifacts, source inventory, source mapping, catalogs, evidence, or demos drift;
- fail if expected P2 generated/source files are untracked.

## P2 Proof
The demo/CI layer passes only when P2 evidence passes, demo output rebuilds deterministically from evidence, tests cover the P2 ingestion proof contract and tamper cases, and drift checks confirm generated artifacts are current.

## Non-Goals
- No public docs deployment.
- No live dashboard.
- No source connector execution.
- No SurfaceOps persistence.
- No analytics or telemetry.
