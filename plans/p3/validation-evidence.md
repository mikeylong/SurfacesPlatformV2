# Validation And Evidence

## Decision
P3 evidence extends P2 ingestion evidence for agent capability registry, recruitment, orchestration, work orders, review queue, and report proof. It preserves P0/P1/P2 canonicalization, hash, provenance, diagnostic, preflight, and stale-output rules while adding agent-control artifacts. Under VISION.md, P3 evidence proves only implemented proof behavior; it does not add product, UI, runtime, projection, review-decision, or execution authority.

## Goal
Create one P3 evidence artifact that can prove governed agent orchestration without coupling P3 to live agent execution, SurfaceOps persistence, JudgmentKit evaluation, or a task runtime.

## Inputs
- P3 schemas.
- `fixtures/p3/agent-capability-registry.fixture.json`.
- `fixtures/p3/expectations.manifest.json`.
- All P3 valid, review, invalid, and mutation fixtures.
- `artifacts/p2/evidence.json`.
- `artifacts/p2/governed-catalog.json`.
- `artifacts/p3/agent-capability-registry.json`.
- `artifacts/p3/orchestration-plan.json`.
- P3 work-order artifacts.
- `artifacts/p3/review-queue.json`.
- `artifacts/p3/agent-orchestration-report.json`.

## Outputs
- `schemas/agent-orchestration-evidence.v0.schema.json`.
- `schemas/agent-orchestration-diagnostics.v0.schema.json`.
- `artifacts/p3/evidence.json`.

## Evidence Shape
`agent-orchestration-evidence.v0` must include all fields needed to verify:

- run id and deterministic environment;
- proof command and arguments;
- upstream P2 ingestion evidence and governed catalog refs;
- P3 schema refs;
- P3 fixture refs;
- capability registry ref;
- orchestration plan ref;
- work-order refs;
- review queue ref;
- orchestration report ref;
- diagnostics;
- validation results;
- artifact hashes and provenance for schemas, fixtures, upstream inputs, and generated proof artifacts under `artifacts/p3`;
- aggregate `status`;
- aggregate `promotionStatus`;
- final evidence self-hash.

## Upstream Boundary Refs
P3 evidence must include `boundaryRefs[]` for:

- `artifacts/p2/evidence.json`;
- `artifacts/p2/governed-catalog.json`;
- `artifacts/p3/agent-capability-registry.json`;
- `artifacts/p3/orchestration-plan.json`;
- every emitted work order;
- `artifacts/p3/review-queue.json`;
- `artifacts/p3/agent-orchestration-report.json`.

Each ref must include artifact path, schema id, hash, source artifact hash when applicable, and provenance.

## P2 Preflight Gate
Before materializing `artifacts/p3/agent-capability-registry.json`, P3 proof must run strict P2 ingestion preflight checks and fail closed before writing any P3 proof artifact when any check fails.

Required preflight checks:

1. P2 evidence and governed catalog exist at their exact POSIX-relative paths.
2. P2 evidence self-hash validates using the null-placeholder rule.
3. P2 evidence has `status: "pass"` and aggregate `promotionStatus` is not `blocked`.
4. P2 evidence contains exactly one artifact ref for `artifacts/p2/governed-catalog.json` and `artifacts/p2/evidence.json`.
5. Current P2 artifact bytes match the hashes recorded in accepted evidence.
6. P2 governed catalog ref matches the command input and evidence ref.
7. No alternate catalog ref, alternate ingestion evidence ref, absolute path, symlinked path, `..` traversal, or extra upstream input is accepted before registry materialization.

P3 evidence must copy accepted upstream refs into `boundaryRefs[]` without rewriting paths, hashes, run ids, or schema ids.

## Artifact Ordering
P3 evidence artifact order is:

1. P3 schemas.
2. Upstream P2 evidence and artifacts consumed by P3.
3. P3 capability registry fixture.
4. P3 expectations manifest.
5. P3 valid fixtures.
6. P3 review fixtures.
7. P3 invalid fixtures.
8. P3 mutation fixtures.
9. Agent capability registry.
10. Orchestration plan.
11. Work orders.
12. Review queue.
13. Agent orchestration report.
14. Final P3 evidence.

The `artifacts` entry for `artifacts/p3/evidence.json` is required and ordered last. Its persisted `hash` is the lowercase SHA-256 hex digest of the canonical evidence object after replacing only that entry's `hash` field with JSON `null`.

Capability registry, orchestration plan, work orders, review queue, orchestration report, and final evidence are generated proof artifacts under `artifacts/p3`. Demo files under `demo/p3` are generated presentation output, not evidence-hashed proof artifacts.

## Diagnostics
P3 diagnostics must use canonical registry messages. Validator-native messages are non-normative and must not be used in golden evidence hashing or manifest comparison. The registry `canonicalMessage` is emitted as the diagnostic `message`; any schema or manifest field named `canonicalMessage` must match it exactly.

P3 diagnostics are sorted by artifact path, stage order (`preflight`, `registry`, `recruitment`, `orchestration`, `work-order`, `review`, `report`, `evidence`), phase, path, keyword location, code, source ref, then canonical message. Nulls sort after strings.

`schemas/agent-orchestration-diagnostics.v0.schema.json`, `fixtures/p3/expectations.manifest.json`, `artifacts/p3/agent-orchestration-report.json`, and `artifacts/p3/evidence.json` must encode the same registry rows. Codes not listed here are invalid in P3.

| Code | Trigger | `canonicalMessage` | Severity | Diagnostic source | Stage | Phase | Artifact path | JSON Pointer | Validation result | Promotion status | Fixture coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AGENT_REGISTRY_REF_MISSING` | Orchestration plan omits its capability registry reference | Agent orchestration plan registry reference is missing. | `error` | `orchestration-validator` | `orchestration` | `orchestration-plan` | `fixtures/p3/mutations/missing-registry-ref.agent-orchestration-plan.json` | `/registryRef` | `invalid` | `blocked` | `mutations/missing-registry-ref.agent-orchestration-plan.json` |
| `AGENT_REGISTRY_HASH_MISMATCH` | Orchestration plan registry hash differs from the generated registry | Agent orchestration plan registry hash does not match generated registry evidence. | `error` | `orchestration-validator` | `orchestration` | `orchestration-plan` | `fixtures/p3/mutations/registry-hash-mismatch.agent-orchestration-plan.json` | `/registryRef/hash` | `invalid` | `blocked` | `mutations/registry-hash-mismatch.agent-orchestration-plan.json` |
| `AGENT_CAPABILITY_UNREGISTERED` | A task or plan selects a capability absent from the registry | Agent task requires an unregistered capability. | `error` | `recruitment-validator` | `recruitment` | `recruitment-selection` | `agent-task-fixture` | `/requiredCapabilities` | `invalid` | `blocked` | `manifest-wide` |
| `AGENT_TOOL_DENIED` | A task or work order requests a denied tool, command, network, secret, or side effect | Agent task requests a denied tool or side effect. | `error` | `recruitment-validator` | `recruitment` | `recruitment-selection` | `fixtures/p3/invalid/denied-tool.agent-task.json` | `/deniedCapabilities` | `invalid` | `blocked` | `invalid/denied-tool.agent-task.json` |
| `AGENT_SCOPE_ESCALATION` | A task or work order reads, writes, or emits outside declared artifact scope | Agent work order exceeds declared scope. | `error` | `work-order-validator` | `work-order` | `work-order-validation` | `agent-work-order-fixture` | `/allowedOutputs` | `invalid` | `blocked` | `manifest-wide` |
| `AGENT_OUTPUT_HIDDEN` | A task or work order declares hidden, untracked, or non-evidence output | Agent work order declares hidden output. | `error` | `work-order-validator` | `work-order` | `work-order-validation` | `fixtures/p3/invalid/hidden-output.agent-task.json` | `/outputs` | `invalid` | `blocked` | `invalid/hidden-output.agent-task.json` |
| `AGENT_DEPENDENCY_CYCLE` | Orchestration plan contains a dependency cycle or missing dependency | Agent orchestration plan contains an invalid dependency graph. | `error` | `orchestration-validator` | `orchestration` | `orchestration-plan` | `fixtures/p3/invalid/cycle-dependency.agent-task.json` | `/dependencies` | `invalid` | `blocked` | `invalid/cycle-dependency.agent-task.json` |
| `AGENT_UPSTREAM_EVIDENCE_MISSING` | P3 input task lacks required P2 ingestion evidence refs | Agent orchestration input is missing required upstream evidence. | `error` | `preflight-validator` | `preflight` | `upstream-preflight` | `fixtures/p3/invalid/missing-upstream-evidence.agent-task.json` | `/upstreamRefs` | `invalid` | `blocked` | `invalid/missing-upstream-evidence.agent-task.json` |
| `AGENT_REVIEW_REQUIRED` | A structurally valid task requires review before execution | Agent work requires review before execution. | `review` | `review-router` | `review` | `review-routing` | `fixtures/p3/review/review-required-work.agent-task.json` | `/reviewPolicy` | `review_required` | `review_required` | `review/review-required-work.agent-task.json` |
| `AGENT_REPORT_PLAN_HASH_MISMATCH` | Orchestration report references a plan hash that differs from the current plan | Agent orchestration report plan hash does not match generated plan. | `error` | `report-validator` | `report` | `orchestration-report` | `fixtures/p3/mutations/report-plan-hash-mismatch.agent-orchestration-report.json` | `/orchestrationPlanRef/hash` | `invalid` | `blocked` | `mutations/report-plan-hash-mismatch.agent-orchestration-report.json` |
| `AGENT_EVIDENCE_HASH_MISMATCH` | Agent orchestration evidence hash differs from manifest or self-hash rule | Agent orchestration evidence hash does not match the manifest or self-hash rule. | `error` | `evidence-validator` | `evidence` | `orchestration-evidence` | `fixtures/p3/mutations/hash-mismatch.agent-orchestration-evidence.json` | `/artifacts/0/hash` | `invalid` | `blocked` | `mutations/hash-mismatch.agent-orchestration-evidence.json` |

## Aggregation Rules
1. If any expectation is unmatched, `status` is `fail` and `promotionStatus` is `blocked`.
2. If any invalid fixture is allowed, `status` is `fail` and `promotionStatus` is `blocked`.
3. If any review-required fixture emits executable work or is promoted as allowed, `status` is `fail` and `promotionStatus` is `blocked`.
4. If all expectations match and any structurally valid fixture requires review, `status` is `pass` and `promotionStatus` is `review_required`.
5. If all expectations match and no structurally valid fixture requires review, `status` is `pass` and `promotionStatus` is `allowed`.

## Hash And Environment Policy
- Canonical JSON follows RFC 8785/JCS with I-JSON numeric input constraints.
- Hashes are lowercase SHA-256 hex digests.
- Paths are POSIX-style relative paths.
- Golden `generatedAt` is `1970-01-01T00:00:00.000Z`.
- Host-derived fields are `null`.
- Command arguments are recorded in deterministic order.
- The evidence self-hash uses the P0/P1/P2 null-placeholder rule.
- Evidence hashes generated proof artifacts under `artifacts/p3`; it must not hash `demo/p3` output.

## P3 Proof
One evidence file records registry validation, recruitment selection, orchestration DAG validation, work-order scope checks, review queue routing, report diagnostics, input and output hashes, and enough provenance to reproduce the run.

## Non-Goals
- No live agent transcript.
- No SurfaceOps review-decision persistence.
- No JudgmentKit evaluation output.
- No demo HTML hash requirement inside proof evidence.
- No validator-native message hashing.
- No non-deterministic environment capture.

## Closed P3 Decisions
- P3 evidence hashes upstream P2 artifacts.
- P3 evidence hashes generated proof artifacts under `artifacts/p3`, not demo output.
- Agent orchestration report is produced before final P3 evidence.
- Demo output is checked by CI drift, not included in final evidence.
