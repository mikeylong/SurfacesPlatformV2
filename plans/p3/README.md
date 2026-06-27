# Surfaces Platform V2 P3 Subplans

## Decision
P3 proves agent recruitment and orchestration as a governed control-plane capability. It consumes accepted P2 ingestion evidence and governed catalog boundaries, selects registered agent capabilities for declared work, emits deterministic scoped work orders, routes review-required work to a non-executable review queue, and records report and evidence artifacts.

P3 is subordinate to [VISION.md](../../VISION.md#canonical-authority-model)'s canonical authority model: the design system is the authority, the Surfaces Catalog is the governed contract, runtime projections cannot add authority, and evidence has proof authority only for implemented proof behavior, not product, UI, or runtime scope.

P3 applies VISION.md's canonical no-live-execution boundary. It does not execute agents, call tools, edit files, open network connections, persist review decisions, or build a live SurfaceOps or JudgmentKit workflow. The P3 proof records inert, bounded work that a later phase may consume only after that phase defines its own proof or authorization.

## Mission Fit
Surfaces Platform turns design-system source material into governed, versioned UI contracts that agents and runtimes can use to generate, validate, reject, review, and render UI safely.

P3 preserves this mission by making agent work itself a governed artifact. Agents may be recruited only through declared capabilities, bounded inputs, bounded outputs, explicit dependencies, review gates, and evidence refs. The orchestration plan is not a prompt transcript or informal task list; it is a versioned proof artifact that can be validated, rejected, reviewed, and reproduced.

P3 must run only after P2 real design-system ingestion evidence passes. Agent orchestration over the old P0 synthetic fixture catalog is not a product-readiness proof.

P3 implementation starts only from clean post-merge `main` after the P0, P1, and P2 proof gates pass on that branch. A dirty worktree, feature branch, or locally generated P2 artifact set is not enough to open P3 product work.

## Start Gate Record
P3 planning opened on 2026-06-25 from clean post-merge `main` after PR #3 merged as `ca6ad68113d2be5f820fe656b0faf242148fd7ff`. The merged P2 implementation commit is `fd205835620a6bcebd348b6949059b38987a1781`, and the accepted final `artifacts/p2/evidence.json` self-hash is `05972eb0791db7bad5b0b84b6ba447e4869e5ff066e6faf7e7de54cb6c592621`.

The post-merge start gate ran on `main` with:

- `npm run check:p0:ci`
- `npm run check:p1:ci`
- `npm run check:p2:ci`

This record opened P3 planning. P3 implementation claims remain evidence-gated by the full proof shape: schemas, fixtures, diagnostics, command implementation, report and artifact paths, generated demo, final evidence, and a passing P3 proof gate.

## Initial Implementation Slice
The first P3 implementation slice preserves the inert no-live-execution boundary and proceeds in this order:

1. Materialize P3 schema contracts and shared constants for the capability registry, task fixtures, orchestration plan, work orders, review queue, report, diagnostics, expectations manifest, and evidence.
2. Add the P3 registry fixture, task fixtures, mutation fixtures, and `fixtures/p3/expectations.manifest.json` before adding proof output claims.
3. Implement strict P2 preflight and P3 artifact generation for registry, orchestration plan, work orders, review queue, report, and evidence.
4. Add the generated demo and CI drift/untracked guards only after P3 evidence is reproducible.

Generated work orders remain inert descriptors throughout P3. They authorize no live agents, shell commands, tool calls, connector calls, network calls, file edits, secrets, callbacks, or persistent review decisions.

## P3 Dependency Order
1. [Product Boundaries](product-boundaries.md)
2. [Agent Capability Registry v0](agent-capability-registry-v0.md)
3. [Recruitment Policy](recruitment-policy.md)
4. [Orchestration Fixture](orchestration-fixture.md)
5. [Orchestration Proof](orchestration-proof.md)
6. [Review Queue v0](review-queue-v0.md)
7. [Validation And Evidence](validation-evidence.md)
8. [Demo And CI](demo-ci.md)

## P3 Contract Layout

```text
schemas/
  agent-capability-registry-fixture.v0.schema.json
  agent-capability-registry.v0.schema.json
  agent-preflight-mutation.v0.schema.json
  agent-task.v0.schema.json
  agent-work-order.v0.schema.json
  agent-orchestration-plan.v0.schema.json
  agent-review-queue.v0.schema.json
  agent-orchestration-report.v0.schema.json
  agent-orchestration-evidence.v0.schema.json
  agent-orchestration-expectations.v0.schema.json
  agent-orchestration-diagnostics.v0.schema.json

fixtures/p3/
  agent-capability-registry.fixture.json
  expectations.manifest.json
  valid/
    runtime-adapter-plan.agent-task.json
    fixture-authoring.agent-task.json
    evidence-review.agent-task.json
  review/
    review-required-work.agent-task.json
  invalid/
    unregistered-capability.agent-task.json
    denied-tool.agent-task.json
    scope-escalation.agent-task.json
    hidden-output.agent-task.json
    blocked-review-policy.agent-task.json
    cycle-dependency.agent-task.json
    missing-dependency.agent-task.json
  mutations/
    missing-upstream-evidence.agent-preflight.json
    failing-upstream-evidence.agent-preflight.json
    upstream-evidence-hash-mismatch.agent-preflight.json
    stale-upstream-evidence.agent-preflight.json
    missing-registry-ref.agent-orchestration-plan.json
    registry-hash-mismatch.agent-orchestration-plan.json
    unregistered-agent.agent-orchestration-plan.json
    duplicate-task-id.agent-orchestration-plan.json
    duplicate-work-order-id.agent-orchestration-plan.json
    hidden-handoff.agent-orchestration-plan.json
    work-order-scope-escalation.agent-work-order.json
    report-plan-hash-mismatch.agent-orchestration-report.json
    hash-mismatch.agent-orchestration-evidence.json

artifacts/p3/
  agent-capability-registry.json
  orchestration-plan.json
  work-order.contract-architect.json
  work-order.fixture-author.json
  work-order.evidence-reviewer.json
  review-queue.json
  agent-orchestration-report.json
  evidence.json

demo/p3/
  README.md
  index.html
```

## P3 Proof Command

```bash
interfacectl surfaces agents proof \
  --ingestion-evidence artifacts/p2/evidence.json \
  --catalog artifacts/p2/governed-catalog.json \
  --fixture fixtures/p3 \
  --out artifacts/p3
```

The command must verify upstream P2 ingestion hashes before reading the P3 registry or task fixtures. It must fail closed before writing P3 artifacts when upstream evidence is missing, failing, hash-mismatched, stale, or not the exact declared input.

Command-level upstream preflight mutation fixtures cover missing, failing, hash-mismatched, and stale upstream evidence. Those fixtures model command invocation failures before `agent-capability-registry.fixture.json` or any `*.agent-task.json` fixture is read.

Package scripts and tests execute this as `node bin/interfacectl.js surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3`. Evidence records the logical command string above.

## Pass Condition
Given valid P2 ingestion evidence and the P3 fixture set, the agents proof command emits the exact P3 artifacts, creates a hash-bound agent capability registry, recruits only registered capabilities for declared task requirements, emits deterministic scoped work orders, blocks invalid and mutation cases with registry-backed diagnostics, preserves blocked review policies without downgrading them to allowed, records review-required work without execution, records orchestration diagnostics before final evidence, and writes reproducible evidence with hashes and provenance for every P3 schema, fixture, input artifact, generated proof artifact under `artifacts/p3`, and final evidence artifact.

P3 generated artifact refs must be acyclic: forward refs to later same-run artifacts omit hashes, resolved backward refs to already materialized artifacts may include hashes, and final P3 evidence owns the complete hash closure.

## Product Surface Rule
P3 proves governed agent orchestration, not agent execution.

`demo/p3/index.html` must be generated from P3 proof artifacts. It may show recruited capabilities, the task DAG, work orders, review queue rows, diagnostics, and evidence. It must not contain hand-authored orchestration state that bypasses `artifacts/p3/evidence.json`.

## P0/P1/P2 Invariants Carried Forward
- P0, P1, and P2 proof gates must still pass unchanged before and after P3 work.
- P3 consumes the P2 governed catalog as the governed contract and P2 evidence as proof input; it does not create product, UI, runtime, or projection authority beyond VISION.md's design-system/Catalog rule.
- Paths are POSIX-style paths relative to the workspace root.
- Stale unexpected output under the declared P3 output root fails before writing.
- Expected output symlinks, symlinked output roots, absolute paths, and `..` traversal fail with the same exit-code discipline as P0/P1.
- Golden metadata is deterministic: `1970-01-01T00:00:00.000Z`, UTC, host-derived fields set to `null`, and stable command arguments.
- Evidence canonicalization follows RFC 8785/JCS with I-JSON numeric input constraints.
- Diagnostic messages used in hashed evidence are canonical registry messages, not validator-native text.
- P3 diagnostics preserve P0/P1/P2 diagnostic meaning for shared upstream failures and add only registry-backed P3 rows for registry, recruitment, orchestration, work-order, review queue, report, and evidence failures.

## P3 Diagnostic Additions

| Code | Trigger | Stage | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- |
| `AGENT_REGISTRY_REF_MISSING` | Orchestration plan omits its capability registry reference | `orchestration` | `blocked` | `mutations/missing-registry-ref.agent-orchestration-plan.json` |
| `AGENT_REGISTRY_HASH_MISMATCH` | Orchestration plan registry hash differs from the generated registry | `orchestration` | `blocked` | `mutations/registry-hash-mismatch.agent-orchestration-plan.json` |
| `AGENT_UNREGISTERED` | An orchestration plan or work order selects an agent id absent from the registry | `recruitment` | `blocked` | `mutations/unregistered-agent.agent-orchestration-plan.json` |
| `AGENT_CAPABILITY_UNREGISTERED` | A task requires a capability absent from the registry | `recruitment` | `blocked` | `invalid/unregistered-capability.agent-task.json` |
| `AGENT_TOOL_DENIED` | A task or work order requests a denied tool, command, network, secret, or side effect | `recruitment` | `blocked` | `invalid/denied-tool.agent-task.json` |
| `AGENT_SCOPE_ESCALATION` | A task reads, writes, or emits outside declared artifact scope | `work-order` | `blocked` | `invalid/scope-escalation.agent-task.json` |
| `AGENT_SCOPE_ESCALATION` | A generated work order reads, writes, or emits outside resolved artifact scope | `work-order` | `blocked` | `mutations/work-order-scope-escalation.agent-work-order.json` |
| `AGENT_OUTPUT_HIDDEN` | A task declares hidden, untracked, or non-evidence output | `work-order` | `blocked` | `invalid/hidden-output.agent-task.json` |
| `AGENT_REVIEW_POLICY_BLOCKED` | A task declares blocked review policy | `review` | `blocked` | `invalid/blocked-review-policy.agent-task.json` |
| `AGENT_DEPENDENCY_CYCLE` | Orchestration plan contains a dependency cycle | `orchestration` | `blocked` | `invalid/cycle-dependency.agent-task.json` |
| `AGENT_DEPENDENCY_MISSING` | Orchestration plan references a missing dependency | `orchestration` | `blocked` | `invalid/missing-dependency.agent-task.json` |
| `AGENT_TASK_DUPLICATE_ID` | Orchestration plan contains a duplicate task id | `orchestration` | `blocked` | `mutations/duplicate-task-id.agent-orchestration-plan.json` |
| `AGENT_WORK_ORDER_DUPLICATE_ID` | Orchestration plan contains a duplicate work-order id | `orchestration` | `blocked` | `mutations/duplicate-work-order-id.agent-orchestration-plan.json` |
| `AGENT_HANDOFF_HIDDEN` | Orchestration plan contains a handoff not declared by task dependencies or evidence refs | `orchestration` | `blocked` | `mutations/hidden-handoff.agent-orchestration-plan.json` |
| `AGENT_UPSTREAM_EVIDENCE_MISSING` | Command-level upstream P2 evidence input is missing | `preflight` | `blocked` | `mutations/missing-upstream-evidence.agent-preflight.json` |
| `AGENT_UPSTREAM_EVIDENCE_FAILED` | Command-level upstream P2 evidence is not passing | `preflight` | `blocked` | `mutations/failing-upstream-evidence.agent-preflight.json` |
| `AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH` | Command-level upstream P2 evidence or catalog hash does not match the accepted boundary | `preflight` | `blocked` | `mutations/upstream-evidence-hash-mismatch.agent-preflight.json` |
| `AGENT_UPSTREAM_EVIDENCE_STALE` | Command-level upstream P2 evidence or catalog ref is stale or not the exact declared input | `preflight` | `blocked` | `mutations/stale-upstream-evidence.agent-preflight.json` |
| `AGENT_REVIEW_REQUIRED` | A structurally valid task requires review before execution | `review` | `review_required` | `review/review-required-work.agent-task.json` |
| `AGENT_REPORT_PLAN_HASH_MISMATCH` | Orchestration report references a plan hash that differs from the current plan | `report` | `blocked` | `mutations/report-plan-hash-mismatch.agent-orchestration-report.json` |
| `AGENT_EVIDENCE_HASH_MISMATCH` | Agent orchestration evidence hash differs from manifest or self-hash rule | `evidence` | `blocked` | `mutations/hash-mismatch.agent-orchestration-evidence.json` |

## Non-Goals
- No live subagent spawning or execution under VISION.md's canonical no-live-execution boundary.
- No autonomous file edits, shell commands, connector calls, network calls, or secret access under that same boundary.
- No prompt-library governance claim without schemas, fixtures, report, and evidence.
- No SurfaceOps persistence or reviewer decision workflow.
- No JudgmentKit execution.
- No general job scheduler or distributed task queue.
- No public agent marketplace.
- No relaxation of P0/P1/P2 catalog, projection, ingestion, review, or evidence boundaries.
