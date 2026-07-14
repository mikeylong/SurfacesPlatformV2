# SurfaceOps Kanban Live Proof Target

## Status
`surfaceops-kanban-live` is implemented as a target-specific proof for a local-loopback live `kanban.cards` integration. It has schemas, fixtures, diagnostics, a command implementation, generated artifacts, adapter report, final evidence, package scripts, tests, CI wiring for the deterministic contract gate, and a browser-functional CI job that checks out `kanban.cards`, drives a real local server, and records video evidence.

The deterministic proof authority is `artifacts/surfaceops-kanban-live/evidence.json`.
The browser-functional run writes runtime evidence under `output/playwright/surfaceops-kanban-live/`. Those runtime files are intentionally outside the deterministic artifact root because browser video encoding is not byte-stable across platforms.

This target proves a bounded local integration only. It does not claim production SurfaceOps, production `kanban.cards` deployment, Auth0 delegated production auth, production service tokens, hosted persistence, public API or SDK, A2UI, live JudgmentKit invocation, work execution, customer validation, or production adoption.

`VISION.md` remains canonical for product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules. This document is subordinate to `VISION.md`, `PLAN.md`, and accepted proof evidence.

## Decision
`surfaceops-kanban-live` replaces the static-only direction for the next SurfaceOps/kanban proof. It keeps `kanban.cards` as the upstream collaboration-board substrate while SurfaceOps owns the Surfaces-specific review semantics and adapter boundary.

The target proves that a SurfaceOps-owned adapter can:

- bootstrap a real local `kanban.cards` board for a designer approval workflow;
- create cards from accepted P3/P4 SurfaceOps evidence refs;
- read and write real board, card, lane, and comment state through the `kanban.cards` API;
- observe realtime events through server-sent events and replay board event history;
- verify persistence across a local server restart;
- fail closed on denied operations and permission bypasses;
- prove the whole-state `PUT /api/state` shortcut is denied for the scoped adapter token;
- reconcile by deterministic SurfaceOps evidence marker before creating a duplicate card;
- treat manual lane movement as a collaboration signal, not a SurfaceOps decision.

The target preserves the Surfaces authority chain:

- Surfaces evidence remains proof authority.
- SurfaceOps owns decision semantics, promotion status, review requirements, handoff eligibility, mappings, and audit interpretation.
- `kanban.cards` owns board persistence and collaboration mechanics for the proved local scenario.
- Board state does not become catalog authority, proof authority, promotion authority, or hidden decision state.

## Product Boundary
`surfaceops-kanban-live` is a target proof, not a new numbered roadmap phase and not a production SurfaceOps product.

It must not:

- modify the `kanban.cards` source repository;
- use `PUT /api/state` or other whole-state shortcuts;
- expose bearer tokens or secrets in generated artifacts, logs, reports, or evidence;
- allow browser bearer-token transport for the SSE stream;
- allow manual kanban edits to silently overwrite SurfaceOps-owned evidence, decisions, diagnostics, promotion status, or handoff eligibility;
- infer approvals from lane movement without a structured SurfaceOps decision;
- claim production auth, hosted persistence, production service-account permissions, webhooks, ETags, or upstream idempotency support unless a future proof adds those capabilities;
- treat browser recordings, screenshots, uploaded artifacts, or demos as a substitute for deterministic proof evidence.

## Inputs
The deterministic proof consumes only local POSIX-relative paths from the workspace root.

Required Surfaces inputs:

- `artifacts/p3/evidence.json`
- `artifacts/p3/review-queue.json`
- `artifacts/p3/agent-orchestration-report.json`
- `artifacts/p4/evidence.json`
- `artifacts/p4/surfaceops-decision-ledger.json`
- `artifacts/p4/review-judgment-report.json`
- `artifacts/p4/judgmentkit-evaluation-report.json`

Required `kanban.cards` boundary input:

- `sources/surfaceops-kanban-live/kanban-cards-api-manifest.json`

The API manifest is hash-bound and declares the local-loopback API surface, allowed endpoints, explicitly denied endpoints, auth assumptions, realtime behavior, persistence boundary, unsupported upstream capabilities, field ownership, and authority rules.

The API manifest also pins the upstream `kanban.cards` source commit exercised by the browser-functional proof. The browser proof fails before starting the server if the configured local checkout is not at that pinned commit.

## Outputs
The deterministic target emits a closed artifact set under `artifacts/surfaceops-kanban-live/`.

```text
artifacts/surfaceops-kanban-live/
  surfaceops-kanban-live-target-selection.json
  surfaceops-kanban-live-api-projection.json
  surfaceops-kanban-live-operation-plan.json
  surfaceops-kanban-live-handoff-record.json
  surfaceops-kanban-live-adapter-report.json
  evidence.json
```

The browser-functional proof writes runtime evidence under:

```text
output/playwright/surfaceops-kanban-live/
  surfaceops-kanban-live-browser.webm
  surfaceops-kanban-live-final.png
  browser-functional-transcript.json
  redacted-api-exchange-log.json
  browser-functional-report.json
  browser-functional-evidence.json
```

The browser run starts a real local `kanban.cards` server from `../kanban.cards`, uses isolated temporary board, token, and event stores, drives API operations and Chromium interactions, records video, captures a screenshot, redacts API exchange logs, and writes hashed browser evidence.

The browser UI is used for visual inspection of the live board after adapter-side writes. The upstream UI may show its own persistence warning because the UI saves through `PUT /api/state`; this proof intentionally denies that whole-state shortcut for the scoped adapter token and uses granular board, card, comment, SSE, and event-history endpoints for adapter behavior.

## Command
The implemented deterministic proof command is:

```bash
interfacectl surfaces surfaceops-kanban-live proof \
  --orchestration-evidence artifacts/p3/evidence.json \
  --review-queue artifacts/p3/review-queue.json \
  --orchestration-report artifacts/p3/agent-orchestration-report.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --evaluation-report artifacts/p4/judgmentkit-evaluation-report.json \
  --kanban-api-manifest sources/surfaceops-kanban-live/kanban-cards-api-manifest.json \
  --fixture fixtures/surfaceops-kanban-live \
  --out artifacts/surfaceops-kanban-live
```

Command behavior follows existing proof gates:

- run from the workspace root;
- accept only POSIX-style relative paths;
- reject absolute paths, `.` segments, `..` traversal, symlinked output roots, hidden outputs, and stale unexpected output;
- validate accepted upstream P3/P4 evidence and hashes before reading target fixtures;
- validate the `kanban.cards` API manifest before producing a live operation plan;
- write only the exact declared output set under `--out`;
- use deterministic ordering, deterministic timestamps, host-derived fields set to `null`, and RFC 8785/JCS canonical JSON;
- produce adapter report rows before final evidence.

The browser-functional proof command is:

```bash
npm run check:surfaceops-kanban-live:browser
```

It requires a local sibling `kanban.cards` checkout at `../kanban.cards` and Playwright Chromium:

```bash
npx playwright install chromium
```

## Schemas
The implementation adds target-specific schemas before claiming support.

```text
schemas/
  kanban-cards-api-manifest.v0.schema.json
  surfaceops-kanban-live-target-selection.v0.schema.json
  surfaceops-kanban-live-operation-plan.v0.schema.json
  surfaceops-kanban-live-handoff-record.v0.schema.json
  surfaceops-kanban-live-adapter-report.v0.schema.json
  surfaceops-kanban-live-evidence.v0.schema.json
  surfaceops-kanban-live-expectations.v0.schema.json
  surfaceops-kanban-live-diagnostics.v0.schema.json
  surfaceops-kanban-live-fixture.v0.schema.json
  surfaceops-kanban-live-preflight-mutation.v0.schema.json
  surfaceops-kanban-live-browser-functional-report.v0.schema.json
  surfaceops-kanban-live-browser-functional-evidence.v0.schema.json
```

## Fixtures
The fixture root is `fixtures/surfaceops-kanban-live/`.

Fixture coverage includes valid live board bootstrap, card creation from SurfaceOps evidence, realtime event replay, persistence restart, adapter marker reconciliation before duplicate create, review-required lane movement, authority override blocking, missing evidence refs, secret redaction, unsupported endpoints, production URL rejection, permission bypass rejection, conflict-required policy behavior, idempotency-key requirements, upstream evidence preflight failures, API manifest failures, and evidence hash mismatch.

## Acceptance Criteria
The target is review-ready only when all of the following are true:

- deterministic evidence records `status: "pass"`;
- deterministic evidence records the expected `promotionStatus`;
- adapter report rows match all expected fixture outcomes;
- generated artifacts hash back to final evidence;
- the browser-functional proof records a real local API/browser scenario with video, screenshot, transcript, redacted API exchange log, report, and evidence;
- denied operations fail closed;
- the scoped adapter token is denied whole-state `PUT /api/state` writes;
- secrets are redacted from generated proof and browser evidence;
- lane movement remains a collaboration signal until a structured SurfaceOps decision exists;
- broad conflict reconciliation remains a deterministic policy/fixture boundary until a later proof adds a SurfaceOps mapping store and conflict artifact;
- the operation plan may name the planned SurfaceOps adapter store shape, but it records `implementedInThisProof: false` and does not claim live SurfaceOps persistence;
- docs continue to distinguish local proof from production SurfaceOps or production `kanban.cards` integration.
