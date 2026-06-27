# Surfaces.dev Documentation Tracking

## Decision
`surfaces.dev` is the developer and agent documentation surface for Surfaces Platform. This repo tracks its required phase updates here until a dedicated docs site or package exists.

`surfaces.dev` is not proof authority. It must point back to versioned schemas, fixtures, commands, artifacts, evidence, `VISION.md`, `PLAN.md`, and phase subplans.

## Goal
Make documentation obligations explicit at each phase boundary so the platform does not advance proof contracts without keeping developer and agent instructions current.

## Phase Update Rule
Every phase that changes commands, schemas, fixtures, artifacts, evidence, diagnostics, demos, or operating rules must update this tracking file or the future `surfaces.dev` docs package in the same change set.

Each phase update must include:

- supported `interfacectl` commands;
- schema and artifact refs;
- fixture and source roots;
- evidence authority and promotion semantics;
- examples or generated demo refs;
- non-goals and safety boundaries;
- agent instructions for using the phase correctly;
- links back to the normative plan and subplans.

## Current Tracking

| Phase | Documentation state | Required surfaces.dev update |
| --- | --- | --- |
| P0 | Planned and implemented in proof docs | Explain catalog proof, fixture-only extraction, diagnostics, evidence, and no real design-system ingestion claim |
| P1 | Planned and implemented in proof docs | Explain `web-static` runtime projection, render plans, generated demo, review-required behavior, exact ordered P1 evidence closure for upstream refs, boundary refs, render-plan refs, artifacts, required `boundaryRefs[].sourceArtifactHash`, generalized projection-versus-governed-catalog authority checks including top-level accessibility derived from component accessibility, evidence self-hash validation with the null placeholder limited to the final self ref, and no runtime authority expansion |
| P2 | Implemented as deterministic local source-bundle ingestion for `@adobe/spectrum-design-data@0.7.0`, scoped to `button` and `in-line-alert` when `artifacts/p2/evidence.json` passes | Explain the local source bundle requirements, npm package integrity, declared Spectrum subset authority set, source snapshot paths, source-ref grammar, mapping review, ingestion diagnostics, `design-system-ingestion-valid-fixture.v0`, exact invalid/review/mutation fixture coverage, valid Spectrum fixture coverage, consumed-schema evidence closure, deterministic provenance on exact ordered source/fixture/artifact/evidence refs, full evidence-closure demo verification, `node bin/interfacectl.js` script/test invocation, `check:p2:planning:validate` guard scope, proof-bearing `check:p2:ci`, evidence authority, and the allowed-claims limit after proof evidence passes |
| P3 | Implemented as deterministic inert agent-orchestration proof when `artifacts/p3/evidence.json` passes | Explain `agent-capability-registry-fixture.v0`, `agent-preflight-mutation.v0`, `agent-task.v0`, capability registry, registry/task scope intersection, deterministic DAG validation, inert work orders, review queue, report, proof evidence, generated demo, acyclic generated-artifact refs, deterministic provenance on evidence refs, blocked `reviewPolicy` preservation, full evidence-closure demo verification, exact diagnostic fixture coverage, `node bin/interfacectl.js` script/test invocation, proof-bearing `check:p3:ci`, evidence authority, and no live agent execution in P3; any later live execution requires a separate proof or explicit authorization |
| P4 | Implemented as deterministic review and judgment proof when `artifacts/p4/evidence.json` passes | Explain the SurfaceOps decision ledger, committed-versus-coverage-only decision fixture behavior, duplicate committed decision diagnostics, JudgmentKit-shaped evaluation report, review/judgment report, P3 evidence and review queue inputs, accepted queue run-id and item binding for fixture `reviewItemRef`, exact diagnostic fixture coverage, deterministic provenance on P4 evidence boundary refs, evidence authority, second-review semantics, `node bin/interfacectl.js surfaces review proof` invocation, proof-bearing cumulative `check:p4:ci`, phase-only GitHub `check:p4:ci:phase` after `p3-proof`, SurfaceOps ownership of approve/reject/request-changes/defer decision coverage, JudgmentKit evaluation-only findings, and no live SurfaceOps console, live JudgmentKit invocation, work-order execution, production adapter, A2UI, or authority override in P4 |

## Follow-Up Documentation Queue
- Next PR: public/docs overclaim guard plus remaining workflow filename or CI cleanup, if needed. Keep public and agent-facing wording tied to passing evidence, align CI/workflow labels with the implemented proof gates, and avoid describing P2 as full Spectrum support, live ingestion, runtime adapter rendering, SurfaceOps, JudgmentKit, A2UI, P3 orchestration, production adapters, or Adobe endorsement.
- P2 merge evidence: preserve proof-bearing gate logs, commit SHA, and the final `artifacts/p2/evidence.json` hash with the PR or merge record, not under `artifacts/p2`.
- Hardening backlog: double-run determinism, ref-closure tampering variants, additional JSON Pointer negative cases, additional symlink cases, evidence tampering variants, and the source-tree closure decision. These are future cases extending existing coverage classes, not current implementation claims.
- P3 start gate: satisfied for planning on 2026-06-25 after PR #3 merged and `npm run check:p0:ci`, `npm run check:p1:ci`, and `npm run check:p2:ci` passed on clean `main`. P3 implementation claims now remain tied to passing `artifacts/p3/evidence.json` and the P3 package gates.
- P3 public/docs follow-up: explain the implemented inert proof command and artifacts without implying live agent execution, SurfaceOps persistence, JudgmentKit execution, production adapters, or P5/A2UI scope.
- P4 implementation start gate: satisfied on 2026-06-26 after PR #5 merged and clean post-merge `main` passed `npm run check:p0:ci`, `npm run check:p1:ci`, `npm run check:p2:ci`, and `npm run check:p3:ci`; accepted P3 evidence hash is now `9a1ae85b240561ab39e427ff5495beeff03088a17f623d2ce35cb633ca9914d7` after the P3 evidence-ref provenance and blocked-policy fixture update.
- P4 public/docs follow-up: explain the implemented deterministic review and judgment proof without implying live SurfaceOps persistence, live JudgmentKit MCP or connector invocation, work-order execution, production adapters, P5/A2UI scope, or authority override.

## Non-Goals
- No docs site implementation in this repo yet.
- No replacement for schemas, manifests, proof commands, or evidence.
- No product marketing content.
- No live API reference beyond implemented commands.
