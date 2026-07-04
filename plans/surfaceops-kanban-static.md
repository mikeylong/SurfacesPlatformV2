# SurfaceOps Kanban Static Proof Shape

## Status
This is a planning-only proof-shape document for a future `surfaceops-kanban-static` target. It does not implement schemas, fixtures, commands, artifacts, evidence, CI gates, demos, live product behavior, or support claims.

`VISION.md` remains canonical for product vision, authority taxonomy, roadmap sequence, surface roles, and agent operating rules. This document is subordinate to `VISION.md`, `PLAN.md`, and accepted proof evidence.

## Decision
`surfaceops-kanban-static` should be the first SurfaceOps-owned proof target for using `kanban.cards` as an upstream board substrate for SurfaceOps workflows.

The target is a deterministic inert projection proof. It consumes accepted P3/P4 evidence plus a local, manifest-declared, hash-bound `kanban.cards` board substrate contract. It emits SurfaceOps-owned board projection, board packet, report, and evidence artifacts that can be inspected by humans or future tools without becoming live board state.

The target preserves the Surfaces authority chain:

- The Surfaces Catalog remains governed contract authority.
- Accepted P3/P4 evidence remains proof authority for implemented review and judgment behavior.
- The `kanban.cards` substrate contract constrains board-shaped presentation only.
- Board projections and packets are derived consumers. They do not add catalog policy, review policy, promotion status, execution authority, persistence authority, or hidden review state.

## Product Boundary
`surfaceops-kanban-static` is a future target proof, not a new roadmap phase and not a live SurfaceOps product.

It may prove that accepted review queue rows, SurfaceOps decision rows, JudgmentKit-shaped findings, and evidence refs can be projected into deterministic board-ready records under a declared `kanban.cards` substrate contract.

It must not:

- write to `kanban.cards`;
- call live `kanban.cards`, SurfaceOps, or JudgmentKit services;
- persist operational SurfaceOps decisions;
- execute work orders, callbacks, commands, agents, tools, connectors, SDKs, or network calls;
- read secrets, credentials, tokens, live identities, account metadata, or hidden state;
- expose production adapters, APIs, SDKs, A2UI, or hosted services;
- use cards, lanes, comments, assignments, or board status as Surfaces proof authority.

## Inputs
The future proof should consume only local POSIX-relative paths from the workspace root.

Required Surfaces inputs:

- `artifacts/p3/evidence.json`
- `artifacts/p3/review-queue.json`
- `artifacts/p3/agent-orchestration-report.json`
- `artifacts/p4/evidence.json`
- `artifacts/p4/surfaceops-decision-ledger.json`
- `artifacts/p4/review-judgment-report.json`
- `artifacts/p4/judgmentkit-evaluation-report.json`

Required substrate input:

- a local manifest declaring the `kanban.cards` substrate bundle, such as
  `sources/surfaceops-kanban-static/kanban-substrate-manifest.json`;
- a local, manifest-declared `kanban.cards` board substrate contract, such as
  `sources/surfaceops-kanban-static/kanban-board-substrate.json`.

The substrate contract must be hash-bound before projection. If `kanban.cards` later emits its own substrate evidence artifact, this proof should consume that accepted local evidence as a preflight input. Until such a proof exists, Surfaces can only claim compatibility with the declared local substrate contract shape, not with live `kanban.cards` behavior.

## Outputs
The future target should emit a closed artifact set under `artifacts/surfaceops-kanban-static/`.

Planned generated artifacts:

```text
artifacts/surfaceops-kanban-static/
  surfaceops-kanban-target-selection.json
  surfaceops-kanban-board-projection.json
  surfaceops-kanban-designer-view-model.json
  surfaceops-kanban-board-packet.review-work.json
  surfaceops-kanban-board-packet.decisions.json
  surfaceops-kanban-adapter-report.json
  evidence.json
```

The board projection defines the allowed board, lane, card, tag, evidence-ref, and provenance subset derived from accepted P3/P4 artifacts plus the substrate contract.

The designer view model translates those refs into the SurfaceOps product
language a reviewer or product designer needs before inspecting raw JSON:
scenario, component, proof status, promotion status, allowed outcomes,
review-required outcomes, blocked outcomes, authority refs, decision refs,
diagnostic summaries, handoff eligibility, and audit-packet inputs. It remains
an index over accepted evidence and must not become proof authority.

Board packets are inert handoff artifacts. They may contain declarative board records with refs to P3 queue items, P4 decision rows, JudgmentKit-shaped findings, diagnostics, and evidence. They must not contain write intents, callbacks, commands, live URLs requiring network access, webhook targets, transport config, credentials, hidden comments, hidden labels, or runtime execution flags.

The adapter report records expected and actual fixture outcomes before final evidence. Final evidence owns the complete hash closure for upstream inputs, substrate contract input, fixtures, schemas, generated artifacts, diagnostics, and itself.

## Command Sketch
This command is a planned sketch only. It must not be documented as runnable until the schemas, fixtures, implementation, reports, evidence, tests, and package scripts exist.

```bash
interfacectl surfaces surfaceops-kanban-static proof \
  --orchestration-evidence artifacts/p3/evidence.json \
  --review-queue artifacts/p3/review-queue.json \
  --orchestration-report artifacts/p3/agent-orchestration-report.json \
  --review-evidence artifacts/p4/evidence.json \
  --decision-ledger artifacts/p4/surfaceops-decision-ledger.json \
  --review-report artifacts/p4/review-judgment-report.json \
  --evaluation-report artifacts/p4/judgmentkit-evaluation-report.json \
  --kanban-substrate-manifest sources/surfaceops-kanban-static/kanban-substrate-manifest.json \
  --fixture fixtures/surfaceops-kanban-static \
  --out artifacts/surfaceops-kanban-static
```

Command behavior should follow existing proof gates:

- run from the workspace root;
- accept only POSIX-style relative paths;
- reject absolute paths, `.` segments, `..` traversal, symlinked output roots, hidden outputs, and stale unexpected output;
- validate accepted upstream P3/P4 evidence and hashes before reading target fixtures;
- validate the `kanban.cards` substrate contract before projection;
- write only the exact declared output set under `--out`;
- use deterministic ordering, deterministic timestamps, host-derived fields set to `null`, and RFC 8785/JCS canonical JSON;
- produce report rows before final evidence.

## Planned Schemas
A future implementation should add target-specific schemas before claiming support.

```text
schemas/
  surfaceops-kanban-target-selection.v0.schema.json
  kanban-board-substrate-manifest.v0.schema.json
  kanban-board-substrate.v0.schema.json
  surfaceops-kanban-board-projection.v0.schema.json
  surfaceops-kanban-designer-view-model.v0.schema.json
  surfaceops-kanban-board-packet.v0.schema.json
  surfaceops-kanban-adapter-report.v0.schema.json
  surfaceops-kanban-evidence.v0.schema.json
  surfaceops-kanban-expectations.v0.schema.json
  surfaceops-kanban-diagnostics.v0.schema.json
  surfaceops-kanban-preflight-mutation.v0.schema.json
```

If the upstream `kanban.cards` contract is copied into a declared local source
bundle rather than consumed as an upstream evidence artifact, the implementation
should validate both the local `kanban-board-substrate-manifest.v0` schema and
the local `kanban-board-substrate.v0` schema. The manifest validates substrate
refs, paths, schema ids, hashes, source refs, and bundle provenance. The
substrate contract validates the allowed board, lane, card, comment,
assignment, label, evidence-ref, and provenance fields that projection may use.

## Projection Rules
The projection must be one-way and SurfaceOps-owned.

- P3 review queue rows may become board cards or card source refs.
- P4 decision ledger rows may become evidence-backed card status annotations.
- P4 JudgmentKit-shaped findings may become card evidence annotations or quality flags.
- P4 review/judgment report rows may become report refs.
- Surfaces evidence refs must remain visible on every projected card or packet row.
- The substrate contract may constrain board fields, lane ids, card fields, labels, ordering, and packet shape.
- The substrate contract must not determine Surfaces promotion status, review status, decision status, proof status, or evidence acceptance.

Lane and card status must be derived deterministically from accepted P3/P4 artifacts. A board card may display a decision, but it must not become the decision.

## Fixtures
The future fixture root should be `fixtures/surfaceops-kanban-static/`.

Planned fixture layout:

```text
fixtures/surfaceops-kanban-static/
  expectations.manifest.json
  valid/
    p3-review-queue-to-board.surfaceops-kanban.json
    button-designer-view-model.surfaceops-kanban.json
    p4-decisions-to-board-packet.surfaceops-kanban.json
    judgment-findings-to-card-annotations.surfaceops-kanban.json
  review/
    deferred-decision-remains-review-required.surfaceops-kanban.json
  invalid/
    missing-evidence-ref.surfaceops-kanban.json
    hidden-review-state.surfaceops-kanban.json
    live-kanban-write.surfaceops-kanban.json
    live-surfaceops-write.surfaceops-kanban.json
    live-judgmentkit-call.surfaceops-kanban.json
    executes-work-order.surfaceops-kanban.json
    network-call.surfaceops-kanban.json
    secret-ref.surfaceops-kanban.json
    production-adapter-claim.surfaceops-kanban.json
    a2ui-claim.surfaceops-kanban.json
    malformed-kanban-substrate.surfaceops-kanban.json
    substrate-authority-override.surfaceops-kanban.json
  mutations/
    missing-p3-evidence.surfaceops-kanban-preflight.json
    failing-p3-evidence.surfaceops-kanban-preflight.json
    p3-evidence-hash-mismatch.surfaceops-kanban-preflight.json
    missing-p4-evidence.surfaceops-kanban-preflight.json
    failing-p4-evidence.surfaceops-kanban-preflight.json
    p4-evidence-hash-mismatch.surfaceops-kanban-preflight.json
    missing-kanban-substrate-manifest.surfaceops-kanban-preflight.json
    missing-kanban-substrate.surfaceops-kanban-preflight.json
    kanban-substrate-hash-mismatch.surfaceops-kanban-preflight.json
    projection-hash-mismatch.surfaceops-kanban-board-projection.json
    report-packet-hash-mismatch.surfaceops-kanban-adapter-report.json
    hash-mismatch.surfaceops-kanban-evidence.json
```

Every fixture expectation should declare stage, phase, expected diagnostic code, expected promotion status, expected artifact paths, expected evidence refs, and whether output packets are emitted.

## Diagnostics
The future diagnostics registry should include canonical messages, severity,
artifact paths, JSON Pointers, source refs, and fixture coverage for every
invalid or mutation case.

| Code | Trigger | `canonicalMessage` | Stage | Severity | Promotion status | Artifact path | JSON Pointer | Source ref | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_MISSING` | Required P3 or P4 evidence input is missing | Required upstream evidence is missing. | `preflight` | `error` | `blocked` | `artifacts/p3/evidence.json`; `artifacts/p4/evidence.json` | `/upstreamRefs` | `null` | `mutations/missing-p3-evidence.surfaceops-kanban-preflight.json`; `mutations/missing-p4-evidence.surfaceops-kanban-preflight.json` |
| `SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_FAILED` | Required P3 or P4 evidence is not passing | Required upstream evidence is not passing. | `preflight` | `error` | `blocked` | `artifacts/p3/evidence.json`; `artifacts/p4/evidence.json` | `/status` | `null` | `mutations/failing-p3-evidence.surfaceops-kanban-preflight.json`; `mutations/failing-p4-evidence.surfaceops-kanban-preflight.json` |
| `SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH` | Upstream artifact hash differs from accepted evidence | Upstream artifact hash does not match accepted evidence. | `preflight` | `error` | `blocked` | `artifacts/p3/evidence.json`; `artifacts/p4/evidence.json` | `/artifacts` | `null` | `mutations/p3-evidence-hash-mismatch.surfaceops-kanban-preflight.json`; `mutations/p4-evidence-hash-mismatch.surfaceops-kanban-preflight.json` |
| `SURFACEOPS_KANBAN_SUBSTRATE_MISSING` | Declared `kanban.cards` substrate manifest or contract is missing | Kanban substrate boundary is missing. | `substrate` | `error` | `blocked` | `sources/surfaceops-kanban-static/kanban-substrate-manifest.json` | `/substrateRefs` | `null` | `mutations/missing-kanban-substrate-manifest.surfaceops-kanban-preflight.json`; `mutations/missing-kanban-substrate.surfaceops-kanban-preflight.json` |
| `SURFACEOPS_KANBAN_SUBSTRATE_HASH_MISMATCH` | Substrate hash differs from the declared manifest or evidence ref | Kanban substrate hash does not match the declared boundary. | `substrate` | `error` | `blocked` | `sources/surfaceops-kanban-static/kanban-substrate-manifest.json` | `/substrateRefs/0/hash` | `null` | `mutations/kanban-substrate-hash-mismatch.surfaceops-kanban-preflight.json` |
| `SURFACEOPS_KANBAN_SUBSTRATE_INVALID` | Declared `kanban.cards` substrate contract is malformed or contains unsupported fields | Kanban substrate contract is invalid. | `substrate` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/malformed-kanban-substrate.surfaceops-kanban.json` | `/substrate` | `fixture://surfaceops-kanban-static/invalid/malformed-kanban-substrate#/substrate` | `invalid/malformed-kanban-substrate.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_SUBSTRATE_UNSUPPORTED` | Projection requests board fields outside the declared substrate | Board projection requests unsupported kanban substrate behavior. | `projection` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/substrate-authority-override.surfaceops-kanban.json` | `/projection/boardFields` | `fixture://surfaceops-kanban-static/invalid/substrate-authority-override#/projection` | `invalid/substrate-authority-override.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE` | Board projection attempts to override catalog, evidence, review, or decision authority | Kanban projection must not override Surfaces authority. | `projection` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/substrate-authority-override.surfaceops-kanban.json` | `/projection/authority` | `fixture://surfaceops-kanban-static/invalid/substrate-authority-override#/projection/authority` | `invalid/substrate-authority-override.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING` | Projected card, packet, view-model row, or report row omits required evidence refs | Kanban projection required evidence reference is missing. | `projection` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/missing-evidence-ref.surfaceops-kanban.json` | `/projection/evidenceRefs` | `fixture://surfaceops-kanban-static/invalid/missing-evidence-ref#/projection/evidenceRefs` | `invalid/missing-evidence-ref.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_HIDDEN_REVIEW_STATE` | Card, lane, packet, or report contains hidden decision or review state | Kanban packet contains hidden review state. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/hidden-review-state.surfaceops-kanban.json` | `/packet/hiddenState` | `fixture://surfaceops-kanban-static/invalid/hidden-review-state#/packet/hiddenState` | `invalid/hidden-review-state.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN` | Fixture or packet attempts a live kanban write | Live kanban writes are forbidden. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/live-kanban-write.surfaceops-kanban.json` | `/packet/liveWrite` | `fixture://surfaceops-kanban-static/invalid/live-kanban-write#/packet/liveWrite` | `invalid/live-kanban-write.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_LIVE_SURFACEOPS_FORBIDDEN` | Fixture or packet attempts live SurfaceOps behavior | Live SurfaceOps behavior is forbidden. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/live-surfaceops-write.surfaceops-kanban.json` | `/packet/liveSurfaceOps` | `fixture://surfaceops-kanban-static/invalid/live-surfaceops-write#/packet/liveSurfaceOps` | `invalid/live-surfaceops-write.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_LIVE_JUDGMENTKIT_FORBIDDEN` | Fixture or packet attempts live JudgmentKit invocation | Live JudgmentKit invocation is forbidden. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/live-judgmentkit-call.surfaceops-kanban.json` | `/packet/liveJudgmentKit` | `fixture://surfaceops-kanban-static/invalid/live-judgmentkit-call#/packet/liveJudgmentKit` | `invalid/live-judgmentkit-call.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN` | Fixture or packet attempts work-order, command, callback, tool, connector, or agent execution | Kanban packets must not execute work. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/executes-work-order.surfaceops-kanban.json` | `/packet/execution` | `fixture://surfaceops-kanban-static/invalid/executes-work-order#/packet/execution` | `invalid/executes-work-order.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_NETWORK_FORBIDDEN` | Fixture or packet requires a network call, webhook, API, or SDK transport | Kanban packets must not require network transport. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/network-call.surfaceops-kanban.json` | `/packet/networkCalls` | `fixture://surfaceops-kanban-static/invalid/network-call#/packet/networkCalls` | `invalid/network-call.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_SECRET_FORBIDDEN` | Fixture or packet contains credentials, tokens, or secret refs | Kanban packets must not contain secrets. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/secret-ref.surfaceops-kanban.json` | `/packet/secrets` | `fixture://surfaceops-kanban-static/invalid/secret-ref#/packet/secrets` | `invalid/secret-ref.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN` | Fixture or packet claims production adapter, API, SDK, or hosted service support | Production adapter claims are outside this proof. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/production-adapter-claim.surfaceops-kanban.json` | `/packet/claims` | `fixture://surfaceops-kanban-static/invalid/production-adapter-claim#/packet/claims` | `invalid/production-adapter-claim.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_A2UI_FORBIDDEN` | Fixture or packet claims A2UI export or conformance | A2UI claims are outside this proof. | `packet` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/invalid/a2ui-claim.surfaceops-kanban.json` | `/packet/claims` | `fixture://surfaceops-kanban-static/invalid/a2ui-claim#/packet/claims` | `invalid/a2ui-claim.surfaceops-kanban.json` |
| `SURFACEOPS_KANBAN_PROJECTION_HASH_MISMATCH` | Projection hash differs from the report or evidence manifest | Kanban projection hash does not match generated artifact refs. | `projection` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/mutations/projection-hash-mismatch.surfaceops-kanban-board-projection.json` | `/projectionRef/hash` | `null` | `mutations/projection-hash-mismatch.surfaceops-kanban-board-projection.json` |
| `SURFACEOPS_KANBAN_REPORT_HASH_MISMATCH` | Report refs do not match generated projection or packet hashes | Kanban report hash does not match generated artifacts. | `report` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/mutations/report-packet-hash-mismatch.surfaceops-kanban-adapter-report.json` | `/packetRefs` | `null` | `mutations/report-packet-hash-mismatch.surfaceops-kanban-adapter-report.json` |
| `SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH` | Final evidence hash differs from manifest or self-hash rule | Kanban evidence hash does not match the evidence manifest. | `evidence` | `error` | `blocked` | `fixtures/surfaceops-kanban-static/mutations/hash-mismatch.surfaceops-kanban-evidence.json` | `/artifacts` | `null` | `mutations/hash-mismatch.surfaceops-kanban-evidence.json` |

## Acceptance Tests
The future implementation should not be accepted until these tests pass.

- The command rejects missing, failing, stale, or hash-mismatched P3/P4 evidence before reading target fixtures or writing artifacts.
- The command rejects missing, stale, or hash-mismatched `kanban.cards`
  substrate manifests and contracts before projection.
- The command emits exactly the planned output set and fails closed on stale unexpected output.
- The target selection declares exactly `surfaceops-kanban-static`.
- The board projection is derived only from accepted P3/P4 artifacts and the declared substrate contract.
- The designer view model keeps proof status separate from promotion status and
  renders `allowed`, `review_required`, and `blocked` as governed outcomes, not
  SurfaceOps decision statuses.
- The designer view model foregrounds design-system source authority, catalog
  rule or queue rationale, canonical diagnostics, evidence refs, decision
  rationale when present, and target handoff eligibility before exposing raw
  artifacts.
- Board packets are inert data only and include no write intents, callbacks, commands, tools, connectors, network calls, SDK transport, secrets, live URLs, hidden decisions, or execution flags.
- Every projected card or packet row preserves Surfaces evidence refs and provenance.
- Cards, lanes, comments, annotations, and packet statuses cannot override catalog policy, P3 review queue state, P4 SurfaceOps decisions, P4 JudgmentKit-shaped findings, evidence status, or promotion status.
- Invalid and mutation fixtures fail with canonical diagnostic codes and messages from `surfaceops-kanban-diagnostics.v0`.
- `surfaceops-kanban-adapter-report.json` records every expected and actual fixture result before final evidence.
- `evidence.json` records schema, fixture, upstream input, substrate input, generated artifact, report, diagnostic, and self hashes under the same canonicalization discipline as prior proofs.
- Existing P0/P1/P2/P3/P4 proof gates continue to pass unchanged.

## Non-Goals
- No live kanban writes.
- No live `kanban.cards` API, SDK, webhook, connector, sync, import, export, or persistence behavior.
- No live SurfaceOps console, operational store, review workflow, assignment workflow, or durable decision persistence.
- No live JudgmentKit MCP, connector, hosted evaluation, or evaluator execution.
- No work-order execution, agent execution, command execution, shell execution, callbacks, tools, connectors, network calls, or secret access.
- No production adapters, public APIs, SDKs, hosted services, native bridges, live runtimes, or A2UI export or conformance.
- No catalog policy changes, promotion-status changes, review-decision overrides, evidence rewrites, hidden review state, or proof-authority transfer to `kanban.cards`.
- No claim that `kanban.cards` is implemented as SurfaceOps or that SurfaceOps is implemented as `kanban.cards`.

## First PR Scope
The first implementation PR for this target should be narrow and proof-shaped.

Include:

- the target-specific schema files;
- a local declared substrate contract fixture or accepted substrate evidence ref;
- a local substrate manifest binding every substrate contract path, schema id,
  hash, source ref, and bundle provenance;
- schema validation for the local substrate manifest and substrate contract;
- `fixtures/surfaceops-kanban-static/expectations.manifest.json`;
- valid, invalid, review, and mutation fixtures;
- diagnostic registry rows with canonical messages;
- the proof command implementation and package script;
- deterministic generation for target selection, board projection, designer view
  model, board packets, adapter report, and evidence;
- focused tests plus the relevant proof gate;
- updates to `PLAN.md`, `plans/README.md`, and `plans/surfaces-dev.md` in the same implementation change.

Exclude:

- live `kanban.cards` writes or reads;
- live SurfaceOps or JudgmentKit;
- production adapters, APIs, SDKs, A2UI, execution, secrets, callbacks, network calls, or hidden review state;
- broad product UI work beyond any generated proof demo explicitly backed by passing evidence.

This planning document alone is not that implementation PR and creates no runnable command or support claim.
