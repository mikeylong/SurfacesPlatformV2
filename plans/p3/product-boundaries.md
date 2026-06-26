# Product Boundaries

## Decision
P3 is subordinate to [VISION.md](../../VISION.md#canonical-authority-model)'s canonical authority model: the design system is the authority, the Surfaces Catalog is the governed contract, runtime projections cannot add authority, and evidence has proof authority only for implemented proof behavior. P3 consumes the P2 governed catalog as the governed contract and accepted P2 ingestion evidence as proof input, then introduces an agent orchestration proof as a derived control-plane contract. Product and agent-facing surfaces may consume orchestration artifacts, but those artifacts do not add product, UI, runtime, projection, or review authority, and they must not authorize execution, reinterpret review policy, or create hidden work outside evidence.

## Goal
Make agent recruitment itself governed. P3 should prove that the platform can decide which agents may be asked to work, what they may see, what they may emit, when handoff is allowed, and when review is required.

## Inputs
- Root plan working thesis and P0/P1/P2 decisions.
- P2 governed catalog and ingestion evidence artifacts.
- P3 agent capability registry fixture and task fixtures.

## Outputs
- Boundary rules for P3 orchestration artifacts.
- Responsibility matrix for product, instruction, review, evaluation, compiler, runtime, and agent surfaces.
- Must-not-cross rules that apply VISION.md's canonical no-live-execution boundary to P3.

## Phase-Local Responsibility Matrix
This matrix is a P3 phase-local delta over [VISION.md Surface Roles](../../VISION.md#surface-roles), not a complete surface list. VISION.md remains canonical for the full surface model, including `surfaces.systems` and P5 A2UI; P3 omits them here because neither consumes nor emits P3 orchestration artifacts in this phase.

| Surface | P3 role | Consumes | Emits | Must not do |
| --- | --- | --- | --- | --- |
| Surfaces Catalog | Governed UI contract consumed by P3 | P2 governed catalog and P2 proof evidence | Governed catalog refs used by orchestration | Become an agent registry, task planner, or source beyond VISION.md |
| Runtime projection | Later projection candidate | Later runtime proof artifacts | Runtime boundary refs in later phases | Expand what agents may emit in P3 or add catalog claims |
| `interfacectl` | Compiler and proof command surface | P2 artifacts, P3 fixtures, P3 schemas | Registry, orchestration plan, work-order artifacts, review queue, report, evidence | Execute agent work or accept stale output |
| Agent capability registry | Bounded recruitment input | P3 registry fixture, upstream evidence refs | `agent-capability-registry.json` | Invent capabilities from task text or define product/UI/runtime authority |
| Recruitment policy | Selection boundary | Task requirements, registry entries, denied capabilities | Selected registered capabilities | Select unregistered or denied capabilities |
| Orchestration proof | Control-plane proof | Registry, task fixtures, upstream evidence | Task DAG, work orders, review queue, report | Spawn agents, call tools, edit files, or run commands |
| Work orders | Inert assignment descriptors | Orchestration plan and accepted refs | No runtime output; they are generated proof artifacts | Execute, mutate, fetch secrets, emit future outputs, or widen scope |
| Review queue | Future SurfaceOps input | Review-required task rows | Non-executable review records | Persist decisions or promote work as allowed |
| Surfaces.dev | Agent-ready instruction surface | Accepted work orders and evidence summaries | Human-readable instructions in later phases | Replace schemas, manifest, proof, or evidence |
| SurfaceOps | Future review console | Review queue and evidence | Human decisions in a later phase | Own P3 policy or execute work in P3 |
| JudgmentKit | Future evaluator | Evidence and evaluator metadata | Quality and handoff evaluation in a later phase | Override recruitment or orchestration proof |

## Boundary Rules
- P3 starts only from clean post-merge `main` after the P0, P1, and P2 proof gates pass on that branch.
- P3 orchestration is derived from P2 proof evidence, the P2 governed catalog, and P3 fixtures; it is not a new source of product, UI, runtime, or projection authority.
- Agent selection must come from `agent-capability-registry.json`, not task text alone.
- P3 applies VISION.md's canonical no-live-execution boundary; these rules do not define a separate execution policy.
- Product P3 remains inert: no live agents, shell/tool/network calls, file edits, secrets, persistent review decisions, SurfaceOps, JudgmentKit, A2UI, or production adapters.
- A work order is an inert descriptor. It must never contain executable callbacks, shell commands, connector calls, network calls, secrets, or file edits.
- Each work order must declare allowed inputs, allowed output paths, denied capabilities, dependencies, source refs, and evidence obligations.
- Task fixtures request exact inputs and outputs, the registry authorizes agent and capability scope, recruitment computes the allowed intersection, and `interfacectl` is the sole author of orchestration plan and work-order artifacts. Work orders must only echo resolved scope; they cannot widen or reinterpret it.
- Review-required work is recorded in `review-queue.json` and `agent-orchestration-report.json`; it must not be promoted to executable work.
- Orchestration plans must be deterministic DAGs with stable ids, no duplicate task or work-order ids, and no hidden dependencies.
- Product demos must be generated from proof artifacts.
- P3 may prepare review and evaluator records that SurfaceOps or JudgmentKit can later consume, but neither product executes in P3.

## P3 Proof
The proof can be completed with P2 artifacts, P3 fixtures, P3 schemas, capability registry, orchestration plan, scoped work orders, review queue, report, final evidence, and a generated demo. No live agent runtime needs to be built; this applies VISION.md's canonical no-live-execution boundary to P3.

## Non-Goals
- No live agent execution; this applies VISION.md's canonical no-live-execution boundary.
- No background worker, scheduler, or queue service.
- No persistent SurfaceOps review decisions.
- No JudgmentKit evaluator execution.
- No connector or tool invocation from generated work orders.
- No hidden prompts or untracked outputs.

## Closed P3 Decisions
- The first agent-control target is deterministic orchestration proof.
- Agent capability registry is the bounded input for P3 recruitment decisions.
- Work orders are proof artifacts, not executable jobs.
- Review queue is generated proof output, not a live product workflow.
