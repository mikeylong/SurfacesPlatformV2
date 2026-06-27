# Demo And CI

## Status
This is the implemented P5 demo and CI contract for the `surfaces-protocol-static` proof.

## Decision
The P5 protocol demo makes protocol proof artifacts inspectable, but it remains deterministic presentation output derived from passing P5 protocol evidence. It must not become proof authority, production protocol documentation, a live API console, a SurfaceOps product, a JudgmentKit integration, or an A2UI claim.

## Inputs
- `artifacts/p5/protocol/evidence.json`.
- `artifacts/p5/protocol/adapter-target-selection.json`.
- `artifacts/p5/protocol/protocol-projection.json`.
- P5 protocol envelope artifacts.
- `artifacts/p5/protocol/protocol-adapter-report.json`.
- Upstream P2 and P4 refs recorded in P5 evidence.

## Outputs
- `demo/p5/protocol/README.md`.
- `demo/p5/protocol/index.html`.
- Package scripts and CI gate for the `surfaces-protocol-static` proof.

## Demo Rules
- Demo generation must require passing `artifacts/p5/protocol/evidence.json`.
- Demo output must be deterministic and self-contained.
- Demo output may display target selection, projection scope, protocol envelopes, review-required and blocked outcomes, diagnostics, artifact refs, and evidence status.
- Demo output must not include live forms, editable protocol state, API consoles, SDK snippets that imply runnable support, network fetches, connector calls, callbacks, secrets, live account identifiers, SurfaceOps decision submission, JudgmentKit execution controls, or A2UI conformance claims.
- Demo output must not execute actions.
- Demo output must not be included in P5 evidence hashes.

## Package Scripts
The implemented proof uses these package scripts:

```bash
npm run materialize:p5:protocol
npm run proof:p5:protocol
npm run build:p5-protocol-demo
npm run check:p5:protocol
npm run check:p5:protocol:ci
npm run check:p5:protocol:untracked
```

The `check:p5:protocol:ci` gate:

- materialize P5 protocol schemas and fixtures;
- run prior implemented proof gates unchanged as required by the release scope;
- run the P5 protocol proof command;
- rebuild `demo/p5/protocol`;
- run the full test suite or a justified phase-specific suite;
- fail if generated schemas, fixtures, artifacts, or demos drift;
- fail if expected P5 generated/source files are untracked;
- fail if stale unexpected output exists under `artifacts/p5/protocol` before proof or demo generation writes files.

## Stale Output Contract
- The declared P5 protocol proof artifact set must be the only allowed file set directly under `artifacts/p5/protocol`.
- Any other file, directory, symlink, generated residue, hidden output, absolute-path output, `.` segment, `..` traversal, or symlinked output root must fail before writing.
- `artifacts/p5/protocol/evidence.json` is stale when its self-hash is invalid, its `status` is not `pass`, its aggregate `promotionStatus` is `blocked`, an artifact or boundary ref points at a missing file, or any recomputed artifact hash differs from evidence.
- Demo generation must enumerate `artifacts/p5/protocol` and reject stale unexpected output before reading proof artifacts or writing demo files.
- CI must fail on untracked files under `artifacts/p5/protocol` because `git diff --exit-code` does not report untracked files.

## Demo Acceptance Criteria
- The demo shows the selected protocol target as proof output, not live availability.
- The demo shows allowed protocol envelopes as inert JSON artifacts.
- The demo shows `review_required` and blocked fixtures as evidence-backed statuses, not executable protocol operations.
- The demo links or embeds enough artifact metadata to inspect hashes, provenance, diagnostics, and promotion status.
- The demo can be opened from `demo/p5/protocol/index.html` without a dev server.
- Re-running the demo build from unchanged passing evidence produces no diff and no untracked files under both `artifacts/p5/protocol` and `demo/p5/protocol`.

## Non-Goals
- No hosted product site.
- No live interactive protocol console.
- No external assets.
- No screenshot baseline requirement in the first protocol proof.
- No browser-driven accessibility audit.
- No production API documentation claim.
- No A2UI conformance claim.
- No claim that future P5 targets are implemented by this static protocol demo or CI gate.
