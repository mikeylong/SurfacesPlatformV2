# Demo And CI

## Decision
P3 includes a generated static demo and CI gate for agent orchestration proof artifacts. The demo is presentation output derived from passing P3 evidence; it is not proof, product, UI, runtime, projection, review-decision, or execution authority and does not contain hand-authored orchestration state.

## Goal
Make the agent orchestration proof inspectable without weakening the proof boundary. A reviewer should be able to see selected agents, task dependencies, work orders, review queue rows, diagnostics, and hashes from the current evidence.

## Inputs
- `artifacts/p3/evidence.json`.
- `artifacts/p3/agent-capability-registry.json`.
- `artifacts/p3/orchestration-plan.json`.
- P3 work-order artifacts.
- `artifacts/p3/review-queue.json`.
- `artifacts/p3/agent-orchestration-report.json`.

## Outputs
- `demo/p3/README.md`.
- `demo/p3/index.html`.
- CI scripts that materialize P3, run P0/P1/P2/P3 proof gates, rebuild the demo, run tests, and fail on tracked or untracked drift.

## Demo Rules
- Demo generation must require passing `artifacts/p3/evidence.json`.
- Demo output must be deterministic and self-contained.
- Demo output may display registry entries, selected capabilities, DAG edges, work orders, review queue rows, diagnostics, artifact refs, and evidence status.
- Demo output must not contain executable work-order behavior, forms, scripts that call tools, network fetches, secrets, or live agent status; this applies VISION.md's canonical no-live-execution boundary.
- Demo output is not included in P3 evidence hashes.

## Normative Package Scripts
P3 is not implementation-complete until `package.json` exposes:

```bash
npm run materialize:p3
npm run proof:p3
npm run build:p3-demo
npm run check:p3
npm run check:p3:ci
```

`check:p3:ci` must:

- materialize P0/P1/P2/P3 schemas and fixtures;
- run P0 proof unchanged;
- run P1 proof unchanged;
- run P2 ingest proof unchanged;
- run P3 proof;
- rebuild `demo/p3`;
- run the full test suite;
- fail if generated schemas, fixtures, artifacts, or demos drift;
- fail if expected P3 generated/source files are untracked.

## P3 Proof
The demo/CI layer passes only when P3 evidence passes, demo output rebuilds deterministically from evidence, tests cover the P3 proof contract and tamper cases, and drift checks confirm generated artifacts are current.

## Non-Goals
- No live dashboard.
- No agent execution controls under VISION.md's canonical no-live-execution boundary.
- No SurfaceOps persistence.
- No analytics or telemetry.
- No demo as proof authority.

## Closed P3 Decisions
- P3 demo is generated from evidence.
- P3 evidence remains proof authority only for P3 generated proof artifacts.
- Demo drift is checked by CI, not evidence self-hash.
