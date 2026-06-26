# Demo And CI

## Decision
P4 should include a generated static demo and CI gate for review and judgment proof artifacts after the P4 proof is implemented. The demo is presentation output derived from passing P4 evidence; it is not proof, product, UI, runtime, projection, review-decision, judgment, or execution authority.

## Goal
Make the review and judgment proof inspectable without weakening the proof boundary. A reviewer should be able to see P3 review queue intake, SurfaceOps decision rows, JudgmentKit-shaped findings, diagnostics, and hashes from current evidence.

## Inputs
- `artifacts/p4/evidence.json`.
- `artifacts/p4/surfaceops-decision-ledger.json`.
- `artifacts/p4/judgmentkit-evaluation-report.json`.
- `artifacts/p4/review-judgment-report.json`.
- Upstream P3 evidence and review queue refs recorded in P4 evidence.

## Outputs
- `demo/p4/README.md`.
- `demo/p4/index.html`.
- CI scripts that materialize P4, run P0/P1/P2/P3/P4 proof gates, rebuild the demo, run tests, and fail on tracked or untracked drift.

## Demo Rules
- Demo generation must require passing `artifacts/p4/evidence.json`.
- Demo output must be deterministic and self-contained.
- Demo output may display queue intake, decision ledger rows, evaluation findings, diagnostics, artifact refs, and evidence status.
- Demo output must not contain editable review state, live forms, scripts that call tools, JudgmentKit connector calls, network fetches, secrets, work-order execution controls, or live agent status.
- Demo output is not included in P4 evidence hashes.

## Package Scripts
P4 should expose these scripts only after implementation exists:

```bash
npm run materialize:p4
npm run proof:p4
npm run build:p4-demo
npm run check:p4
npm run check:p4:ci
npm run check:p4:untracked
```

`check:p4:ci` must:

- materialize P0/P1/P2/P3/P4 schemas and fixtures;
- run P0 proof unchanged;
- run P1 proof unchanged;
- run P2 ingest proof unchanged;
- run P3 agents proof unchanged;
- run P4 review proof;
- rebuild `demo/p4`;
- run the full test suite;
- fail if generated schemas, fixtures, artifacts, or demos drift;
- fail if expected P4 generated/source files are untracked.

## P4 Proof
The demo/CI layer passes only when P4 evidence passes, demo output rebuilds deterministically from evidence, tests cover the P4 proof contract and tamper cases, and drift checks confirm generated artifacts are current.

## Non-Goals
- No live SurfaceOps dashboard.
- No review submission controls.
- No live JudgmentKit execution controls.
- No work-order execution controls.
- No analytics or telemetry.
- No demo as proof authority.

## Closed P4 Decisions
- P4 demo is generated from evidence.
- P4 evidence remains proof authority only for P4 generated proof artifacts.
- Demo drift is checked by CI, not evidence self-hash.
