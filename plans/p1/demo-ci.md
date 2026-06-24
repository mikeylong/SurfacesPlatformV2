# Demo And CI

## Decision
P1 includes a generated static demo that visualizes proof artifacts and the product-visible allowed surface. The demo is not itself the proof; it is a deterministic presentation of proof outputs.

## Goal
Make P1 inspectable without weakening the contract boundary. The demo should help a technical stakeholder see source artifact lineage, projection, render plans, diagnostics, and evidence while staying generated and repeatable.

## Inputs
- `artifacts/p1/runtime-projection.json`.
- P1 render-plan artifacts.
- `artifacts/p1/runtime-adapter-report.json`.
- `artifacts/p1/evidence.json`.

`build:p1-demo` must treat `artifacts/p1/evidence.json` as the entrypoint. It may read projection, render-plan, and report artifacts only after verifying that evidence is current and passing.

## Outputs
- `demo/p1/README.md`.
- `demo/p1/index.html`.
- Package scripts for materializing, proving, building, and checking P1.

## Demo Rules
- `demo/p1/index.html` is generated, not hand-authored proof data.
- The demo may render allowed `web-static` plans as static HTML.
- The demo must show review-required and blocked cases as evidence-backed statuses, not as executable UI.
- The demo must not execute actions.
- The demo must not fetch network resources.
- The demo must not read secrets.
- The demo must not claim A2UI compatibility.
- Demo generation must be byte-identical across repeated runs from the same artifacts.
- Demo generation must fail before writing when `artifacts/p1/evidence.json` is missing, schema-invalid, self-hash-invalid, stale, or not passing.
- Demo generation must fail when `artifacts/p1/evidence.json` has `status` other than `pass` or aggregate `promotionStatus: "blocked"`.
- Demo generation must fail when any evidence `boundaryRefs[]` or `artifacts[]` entry for `artifacts/p1/*` is missing on disk or its recomputed hash differs from evidence.
- Demo generation must fail when stale unexpected files or directories exist under `artifacts/p1`.
- Demo output is not included in P1 evidence hashes; it is governed by deterministic rebuild and CI drift checks.

## Normative Package Scripts

```json
{
  "materialize:p1": "npm run materialize:p0 && node scripts/materialize-p1.mjs",
  "proof:p1": "npm run proof:p0 && node bin/interfacectl.js surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1",
  "build:p1-demo": "node scripts/build-p1-demo.mjs --evidence artifacts/p1/evidence.json --out demo/p1",
  "demo:p1": "npm run proof:p1 && npm run build:p1-demo",
  "check:p1": "npm run materialize:p1 && npm run proof:p1 && npm run build:p1-demo && npm test",
  "check:p1:ci": "npm run check:p1 && git diff --exit-code -- schemas fixtures artifacts demo && npm run check:p1:untracked"
}
```

The script names are normative. Implementations may split helper commands, but `check:p1:ci` must enforce the same materialize, proof, demo build, tests, tracked diff, and `check:p1:untracked` coverage for P1 generated-output and source files.

## Stale Output Contract
- The declared P1 proof artifact set is the only allowed file set directly under `artifacts/p1`.
- Any other file, directory, symlink, or generated residue under `artifacts/p1` is stale unexpected output and must fail `proof:p1`, `build:p1-demo`, and `check:p1:ci`.
- `artifacts/p1/evidence.json` is stale when its self-hash is invalid, its `status` is not `pass`, its aggregate `promotionStatus` is `blocked`, an artifact or boundary ref points at a missing file, or any recomputed artifact hash differs from evidence.
- `build:p1-demo` must enumerate `artifacts/p1` and reject stale unexpected output before reading proof artifacts or writing `demo/p1` files.
- `check:p1:ci` must fail on untracked files under `artifacts/p1` because `git diff --exit-code` does not report untracked files.

## Implementation Slices
1. Lock P0 with `npm run check:p0:ci`.
2. Extract shared deterministic proof utilities from `src/p0.js` only if required by P1 implementation, and run P0 drift checks after extraction.
3. Add P1 schemas and fixtures.
4. Implement runtime projection generation.
5. Implement adapter proof and render-plan generation.
6. Implement P1 evidence.
7. Generate deterministic demo.
8. Add P1 tests and CI drift checks.

## CI Gates
- P0 CI remains unchanged and passing.
- P1 CI must fail if P0 artifacts drift unexpectedly.
- P1 CI must fail if P1 generated proof artifacts or demo output drift.
- P1 CI must fail if schema, manifest, diagnostics registry, or evidence rows are out of lockstep.
- P1 CI must fail on stale unexpected output under `artifacts/p1` before proof or demo generation writes files.
- P1 CI must fail when `artifacts/p1/evidence.json` is missing, stale, self-hash-invalid, schema-invalid, has `status` other than `pass`, or has aggregate `promotionStatus: "blocked"`.
- P1 CI must fail when any proof artifact referenced by evidence is missing or has a recomputed hash that differs from evidence.
- P1 CI must fail when any untracked file remains under `artifacts/p1`, even if `git diff --exit-code` is clean.
- P1 CI must treat `git diff --exit-code -- schemas fixtures artifacts demo` as necessary but not sufficient; it must also check untracked files under `artifacts/p1`.

## Demo Acceptance Criteria
- The demo shows the allowed `ConfirmPanel` render plan as a product-visible surface.
- The demo shows `review_required` and blocked fixtures as non-executable evidence-backed outcomes.
- The demo links or embeds enough artifact metadata to inspect hashes, provenance, diagnostics, and promotion status.
- The demo can be opened from `demo/p1/index.html` without a dev server.
- Re-running `npm run build:p1-demo` from unchanged passing evidence produces no diff and no untracked files under `artifacts/p1`.

## Non-Goals
- No hosted product site.
- No live interactive runtime.
- No external assets.
- No screenshot baseline requirement in P1.
- No browser-driven accessibility audit in P1.
