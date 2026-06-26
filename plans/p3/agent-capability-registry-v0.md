# Agent Capability Registry v0

## Decision
P3 introduces `agent-capability-registry.v0` as the hash-bound input for P3 recruitment decisions over recruitable agent capabilities. The registry is derived from `fixtures/p3/agent-capability-registry.fixture.json`, verified against upstream P2 ingestion evidence refs, and consumed by recruitment before any orchestration plan or work order can be accepted.

## Goal
Create the smallest agent-facing contract that can support deterministic P3 recruitment without allowing task text to define capabilities. The registry must describe who can be recruited, what capabilities they offer, which inputs and outputs are allowed, which tools or actions are denied, what review routes apply, and what evidence obligations each work order inherits. It is not product, UI, runtime, projection, or review authority.

## Inputs
- `fixtures/p3/agent-capability-registry.fixture.json`.
- `artifacts/p2/evidence.json`.
- `artifacts/p2/governed-catalog.json`.
- Schema constants from `schemas/agent-capability-registry-fixture.v0.schema.json` and `schemas/agent-capability-registry.v0.schema.json`.

P3 valid, invalid, review, and mutation task fixtures are not registry inputs. Task fixtures may be read only after command-level upstream preflight passes and registry materialization completes for recruitment, orchestration, mutation, report, and evidence checks.

## Outputs
- `schemas/agent-capability-registry-fixture.v0.schema.json`.
- `schemas/agent-capability-registry.v0.schema.json`.
- `artifacts/p3/agent-capability-registry.json`.
- Registry diagnostics recorded in `artifacts/p3/agent-orchestration-report.json` and final evidence.

## Registry Shape
`agent-capability-registry.v0` must require:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `schemaId` | const | yes | `agent-capability-registry.v0` |
| `version` | string | yes | Semver |
| `ingestionEvidenceRef` | object | yes | Artifact path, schema id, and hash for `artifacts/p2/evidence.json` |
| `catalogRef` | object | yes | Artifact path, schema id, hash, and source evidence hash for `artifacts/p2/governed-catalog.json` |
| `agents` | object | yes | Stable agent definitions keyed by id |
| `capabilities` | object | yes | Capability definitions keyed by id |
| `policies` | object | yes | Recruitment, scope, denied tool, review, and evidence policies |
| `provenance` | object | yes | Source refs, generator metadata, and deterministic environment |
| `diagnostics` | array | yes | Agent orchestration diagnostics objects |

## Initial Registered Agents

| Agent id | Role | Required capabilities | Allowed outputs |
| --- | --- | --- | --- |
| `contract-architect` | Defines or reviews plan/schema boundaries | `plan-contracts`, `schema-boundaries`, `risk-review` | `artifacts/p3/work-order.contract-architect.json` |
| `fixture-author` | Defines proof fixtures and manifest expectations | `fixture-design`, `diagnostics-mapping`, `negative-coverage` | `artifacts/p3/work-order.fixture-author.json` |
| `evidence-reviewer` | Reviews report/evidence completeness and drift gates | `evidence-audit`, `hash-provenance`, `ci-gates` | `artifacts/p3/work-order.evidence-reviewer.json` |

## Capability Rules
- Capabilities are explicit registry entries, not free-form prompt labels.
- A capability must declare allowed input artifact classes, allowed output artifact classes, review routes, denied tools, and required evidence refs.
- The denied execution, tool, network, connector, and secret rules apply VISION.md's canonical no-live-execution boundary; the registry does not define a separate live-execution policy.
- A capability cannot permit modification of P2 artifacts, action execution, secret reads, connector calls, or shell commands.
- A capability may depend on upstream P2 evidence, but it must not reinterpret catalog policy.
- Review-required capabilities must emit review queue records instead of executable work orders.

## Registry Checks
Command-level preflight fails before registry materialization when required P2 ingestion evidence is missing, failing, hash-mismatched, stale, or not the exact declared input. These failures use `AGENT_UPSTREAM_EVIDENCE_MISSING`, `AGENT_UPSTREAM_EVIDENCE_FAILED`, `AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH`, or `AGENT_UPSTREAM_EVIDENCE_STALE`.

Orchestration validation fails with `AGENT_UNREGISTERED` if a generated plan or work order selects an agent id absent from the registry.

Recruitment fails with `AGENT_CAPABILITY_UNREGISTERED` if a task requires a capability absent from the registry.

Recruitment fails with `AGENT_TOOL_DENIED` if a task or work order requests shell, connector, network, secret, callback, or file-system execution.

Task or work-order validation fails with `AGENT_SCOPE_ESCALATION` if requested or resolved scope reads, writes, or emits outside the declared artifact bounds.

## P3 Proof
The P3 proof validates `fixtures/p3/agent-capability-registry.fixture.json` against `schemas/agent-capability-registry-fixture.v0.schema.json`, emits `artifacts/p3/agent-capability-registry.json`, validates it against `schemas/agent-capability-registry.v0.schema.json`, compares selected capabilities against task requirements and resolved scope, records diagnostics in the orchestration report, and includes the registry hash in final evidence.

## Non-Goals
- No dynamic agent discovery.
- No model or vendor selection.
- No live tool permissions; this applies VISION.md's canonical no-live-execution boundary.
- No persistent identity store.
- No runtime authorization service.

## Closed P3 Decisions
- The registry is the bounded input for P3 recruitment decisions.
- Task fixtures cannot create capabilities.
- Registry hashes are evidence-bound before orchestration-plan generation.
