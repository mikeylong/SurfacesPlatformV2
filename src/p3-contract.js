import path from "node:path";
import fs from "node:fs/promises";
import {
  canonicalFileHash,
  deepClone,
  rawFileHash,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";

export const P3_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const P3_VERSION = "0.0.0";
export const P3_SCHEMA_ROOT = "schemas";
export const P3_FIXTURE_ROOT = "fixtures/p3";
export const P3_ARTIFACT_ROOT = "artifacts/p3";
export const P3_INGESTION_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const P3_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const P3_ACCEPTED_P2_EVIDENCE_HASH = "ec5fe3e0bf4f2ac0b8f10ba746610df94175085ee35904186a23c0f27282906f";
export const P3_ACCEPTED_P2_CATALOG_HASH = "2ba1d418bc51051bb642a0c675efbc7e16f4f315dae62674a6b6e363461c9d29";

export const P3_ENVIRONMENT = Object.freeze({
  generatedAt: P3_TIMESTAMP,
  host: null
});

export const P3_SCHEMA_FILES = [
  "agent-capability-registry-fixture.v0.schema.json",
  "agent-capability-registry.v0.schema.json",
  "agent-preflight-mutation.v0.schema.json",
  "agent-task.v0.schema.json",
  "agent-work-order.v0.schema.json",
  "agent-orchestration-plan.v0.schema.json",
  "agent-review-queue.v0.schema.json",
  "agent-orchestration-report.v0.schema.json",
  "agent-orchestration-evidence.v0.schema.json",
  "agent-orchestration-expectations.v0.schema.json",
  "agent-orchestration-diagnostics.v0.schema.json"
];

export const P3_FIXTURE_FILES = [
  "valid/runtime-adapter-plan.agent-task.json",
  "valid/fixture-authoring.agent-task.json",
  "valid/evidence-review.agent-task.json",
  "review/review-required-work.agent-task.json",
  "invalid/unregistered-capability.agent-task.json",
  "invalid/denied-tool.agent-task.json",
  "invalid/scope-escalation.agent-task.json",
  "invalid/hidden-output.agent-task.json",
  "invalid/blocked-review-policy.agent-task.json",
  "invalid/cycle-dependency.agent-task.json",
  "invalid/missing-dependency.agent-task.json",
  "mutations/missing-upstream-evidence.agent-preflight.json",
  "mutations/failing-upstream-evidence.agent-preflight.json",
  "mutations/upstream-evidence-hash-mismatch.agent-preflight.json",
  "mutations/stale-upstream-evidence.agent-preflight.json",
  "mutations/missing-registry-ref.agent-orchestration-plan.json",
  "mutations/registry-hash-mismatch.agent-orchestration-plan.json",
  "mutations/unregistered-agent.agent-orchestration-plan.json",
  "mutations/duplicate-task-id.agent-orchestration-plan.json",
  "mutations/duplicate-work-order-id.agent-orchestration-plan.json",
  "mutations/hidden-handoff.agent-orchestration-plan.json",
  "mutations/work-order-scope-escalation.agent-work-order.json",
  "mutations/report-plan-hash-mismatch.agent-orchestration-report.json",
  "mutations/hash-mismatch.agent-orchestration-evidence.json"
].map((file) => `${P3_FIXTURE_ROOT}/${file}`);

export const P3_GENERATED_ARTIFACTS = [
  "agent-capability-registry.json",
  "orchestration-plan.json",
  "work-order.contract-architect.json",
  "work-order.fixture-author.json",
  "work-order.evidence-reviewer.json",
  "review-queue.json",
  "agent-orchestration-report.json",
  "evidence.json"
];

export const P3_ARTIFACT_PATHS = P3_GENERATED_ARTIFACTS.map((file) => `${P3_ARTIFACT_ROOT}/${file}`);

export const P3_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "AGENT_REGISTRY_REF_MISSING",
    trigger: "Orchestration plan omits its capability registry reference",
    canonicalMessage: "Agent orchestration plan registry reference is missing.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/mutations/missing-registry-ref.agent-orchestration-plan.json",
    jsonPointer: "/registryRef",
    sourceRef: "fixture://p3/mutations/missing-registry-ref#/registryRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-registry-ref.agent-orchestration-plan.json"
  }),
  diagnosticRow({
    code: "AGENT_REGISTRY_HASH_MISMATCH",
    trigger: "Orchestration plan registry hash differs from the generated registry",
    canonicalMessage: "Agent orchestration plan registry hash does not match generated registry evidence.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/mutations/registry-hash-mismatch.agent-orchestration-plan.json",
    jsonPointer: "/registryRef/hash",
    sourceRef: "fixture://p3/mutations/registry-hash-mismatch#/registryRef/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/registry-hash-mismatch.agent-orchestration-plan.json"
  }),
  diagnosticRow({
    code: "AGENT_UNREGISTERED",
    trigger: "An orchestration plan or work order selects an agent id absent from the registry",
    canonicalMessage: "Agent orchestration plan selects an unregistered agent.",
    severity: "error",
    diagnosticSource: "recruitment-validator",
    stage: "recruitment",
    phase: "recruitment-selection",
    artifactPath: "fixtures/p3/mutations/unregistered-agent.agent-orchestration-plan.json",
    jsonPointer: "/tasks/0/selectedAgentIds/0",
    sourceRef: "fixture://p3/mutations/unregistered-agent#/tasks/0/selectedAgentIds/0",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/unregistered-agent.agent-orchestration-plan.json"
  }),
  diagnosticRow({
    code: "AGENT_CAPABILITY_UNREGISTERED",
    trigger: "A task requires a capability absent from the registry",
    canonicalMessage: "Agent task requires an unregistered capability.",
    severity: "error",
    diagnosticSource: "recruitment-validator",
    stage: "recruitment",
    phase: "recruitment-selection",
    artifactPath: "fixtures/p3/invalid/unregistered-capability.agent-task.json",
    jsonPointer: "/requiredCapabilities",
    sourceRef: "fixture://p3/invalid/unregistered-capability#/requiredCapabilities",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unregistered-capability.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_TOOL_DENIED",
    trigger: "A task or work order requests a denied tool, command, network, secret, or side effect",
    canonicalMessage: "Agent task requests a denied tool or side effect.",
    severity: "error",
    diagnosticSource: "recruitment-validator",
    stage: "recruitment",
    phase: "recruitment-selection",
    artifactPath: "fixtures/p3/invalid/denied-tool.agent-task.json",
    jsonPointer: "/deniedCapabilities",
    sourceRef: "fixture://p3/invalid/denied-tool#/deniedCapabilities",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/denied-tool.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_SCOPE_ESCALATION",
    trigger: "A task reads, writes, or emits outside declared artifact scope",
    canonicalMessage: "Agent task exceeds declared scope.",
    severity: "error",
    diagnosticSource: "work-order-validator",
    stage: "work-order",
    phase: "work-order-validation",
    artifactPath: "fixtures/p3/invalid/scope-escalation.agent-task.json",
    jsonPointer: "/allowedOutputs",
    sourceRef: "fixture://p3/invalid/scope-escalation#/allowedOutputs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/scope-escalation.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_SCOPE_ESCALATION",
    trigger: "A generated work order reads, writes, or emits outside resolved artifact scope",
    canonicalMessage: "Agent work order exceeds declared scope.",
    severity: "error",
    diagnosticSource: "work-order-validator",
    stage: "work-order",
    phase: "work-order-validation",
    artifactPath: "fixtures/p3/mutations/work-order-scope-escalation.agent-work-order.json",
    jsonPointer: "/allowedOutputs",
    sourceRef: "fixture://p3/mutations/work-order-scope-escalation#/allowedOutputs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/work-order-scope-escalation.agent-work-order.json"
  }),
  diagnosticRow({
    code: "AGENT_OUTPUT_HIDDEN",
    trigger: "A task declares hidden, untracked, or non-evidence output",
    canonicalMessage: "Agent task declares hidden output.",
    severity: "error",
    diagnosticSource: "work-order-validator",
    stage: "work-order",
    phase: "work-order-validation",
    artifactPath: "fixtures/p3/invalid/hidden-output.agent-task.json",
    jsonPointer: "/allowedOutputs",
    sourceRef: "fixture://p3/invalid/hidden-output#/allowedOutputs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/hidden-output.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_REVIEW_POLICY_BLOCKED",
    trigger: "A task declares blocked review policy",
    canonicalMessage: "Agent task review policy is blocked and cannot be promoted.",
    severity: "error",
    diagnosticSource: "review-router",
    stage: "review",
    phase: "review-routing",
    artifactPath: "fixtures/p3/invalid/blocked-review-policy.agent-task.json",
    jsonPointer: "/reviewPolicy",
    sourceRef: "fixture://p3/invalid/blocked-review-policy#/reviewPolicy",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/blocked-review-policy.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_DEPENDENCY_CYCLE",
    trigger: "Orchestration plan contains a dependency cycle",
    canonicalMessage: "Agent orchestration plan contains a dependency cycle.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/invalid/cycle-dependency.agent-task.json",
    jsonPointer: "/dependencies",
    sourceRef: "fixture://p3/invalid/cycle-dependency#/dependencies",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/cycle-dependency.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_DEPENDENCY_MISSING",
    trigger: "Orchestration plan references a missing dependency",
    canonicalMessage: "Agent orchestration plan references a missing dependency.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/invalid/missing-dependency.agent-task.json",
    jsonPointer: "/dependencies",
    sourceRef: "fixture://p3/invalid/missing-dependency#/dependencies",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/missing-dependency.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_TASK_DUPLICATE_ID",
    trigger: "Orchestration plan contains a duplicate task id",
    canonicalMessage: "Agent orchestration plan contains a duplicate task id.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/mutations/duplicate-task-id.agent-orchestration-plan.json",
    jsonPointer: "/tasks/1/taskId",
    sourceRef: "fixture://p3/mutations/duplicate-task-id#/tasks/1/taskId",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/duplicate-task-id.agent-orchestration-plan.json"
  }),
  diagnosticRow({
    code: "AGENT_WORK_ORDER_DUPLICATE_ID",
    trigger: "Orchestration plan contains a duplicate work-order id",
    canonicalMessage: "Agent orchestration plan contains a duplicate work-order id.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/mutations/duplicate-work-order-id.agent-orchestration-plan.json",
    jsonPointer: "/workOrders/1/workOrderId",
    sourceRef: "fixture://p3/mutations/duplicate-work-order-id#/workOrders/1/workOrderId",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/duplicate-work-order-id.agent-orchestration-plan.json"
  }),
  diagnosticRow({
    code: "AGENT_HANDOFF_HIDDEN",
    trigger: "Orchestration plan contains a handoff not declared by task dependencies or evidence refs",
    canonicalMessage: "Agent orchestration plan contains a hidden handoff.",
    severity: "error",
    diagnosticSource: "orchestration-validator",
    stage: "orchestration",
    phase: "orchestration-plan",
    artifactPath: "fixtures/p3/mutations/hidden-handoff.agent-orchestration-plan.json",
    jsonPointer: "/tasks/1/dependencies/0",
    sourceRef: "fixture://p3/mutations/hidden-handoff#/tasks/1/dependencies/0",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hidden-handoff.agent-orchestration-plan.json"
  }),
  diagnosticRow({
    code: "AGENT_UPSTREAM_EVIDENCE_MISSING",
    trigger: "Command-level upstream P2 evidence input is missing",
    canonicalMessage: "P3 upstream evidence input is missing.",
    severity: "error",
    diagnosticSource: "preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p3/mutations/missing-upstream-evidence.agent-preflight.json",
    jsonPointer: "/ingestionEvidenceRef",
    sourceRef: "fixture://p3/mutations/missing-upstream-evidence#/ingestionEvidenceRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-upstream-evidence.agent-preflight.json"
  }),
  diagnosticRow({
    code: "AGENT_UPSTREAM_EVIDENCE_FAILED",
    trigger: "Command-level upstream P2 evidence is not passing",
    canonicalMessage: "P3 upstream evidence status is not pass.",
    severity: "error",
    diagnosticSource: "preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p3/mutations/failing-upstream-evidence.agent-preflight.json",
    jsonPointer: "/status",
    sourceRef: "fixture://p3/mutations/failing-upstream-evidence#/status",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/failing-upstream-evidence.agent-preflight.json"
  }),
  diagnosticRow({
    code: "AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH",
    trigger: "Command-level upstream P2 evidence or catalog hash does not match the accepted boundary",
    canonicalMessage: "P3 upstream evidence hash does not match the accepted boundary.",
    severity: "error",
    diagnosticSource: "preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p3/mutations/upstream-evidence-hash-mismatch.agent-preflight.json",
    jsonPointer: "/boundaryRefs/0/hash",
    sourceRef: "fixture://p3/mutations/upstream-evidence-hash-mismatch#/boundaryRefs/0/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/upstream-evidence-hash-mismatch.agent-preflight.json"
  }),
  diagnosticRow({
    code: "AGENT_UPSTREAM_EVIDENCE_STALE",
    trigger: "Command-level upstream P2 evidence or catalog ref is stale or not the exact declared input",
    canonicalMessage: "P3 upstream evidence boundary is stale.",
    severity: "error",
    diagnosticSource: "preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p3/mutations/stale-upstream-evidence.agent-preflight.json",
    jsonPointer: "/boundaryRefs",
    sourceRef: "fixture://p3/mutations/stale-upstream-evidence#/boundaryRefs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/stale-upstream-evidence.agent-preflight.json"
  }),
  diagnosticRow({
    code: "AGENT_REVIEW_REQUIRED",
    trigger: "A structurally valid task requires review before execution",
    canonicalMessage: "Agent work requires review before execution.",
    severity: "review",
    diagnosticSource: "review-router",
    stage: "review",
    phase: "review-routing",
    artifactPath: "fixtures/p3/review/review-required-work.agent-task.json",
    jsonPointer: "/reviewPolicy",
    sourceRef: "fixture://p3/review/review-required-work#/reviewPolicy",
    validationResult: "review_required",
    promotionStatus: "review_required",
    fixtureCoverage: "review/review-required-work.agent-task.json"
  }),
  diagnosticRow({
    code: "AGENT_REPORT_PLAN_HASH_MISMATCH",
    trigger: "Orchestration report references a plan hash that differs from the current plan",
    canonicalMessage: "Agent orchestration report plan hash does not match generated plan.",
    severity: "error",
    diagnosticSource: "report-validator",
    stage: "report",
    phase: "orchestration-report",
    artifactPath: "fixtures/p3/mutations/report-plan-hash-mismatch.agent-orchestration-report.json",
    jsonPointer: "/orchestrationPlanRef/hash",
    sourceRef: "fixture://p3/mutations/report-plan-hash-mismatch#/orchestrationPlanRef/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/report-plan-hash-mismatch.agent-orchestration-report.json"
  }),
  diagnosticRow({
    code: "AGENT_EVIDENCE_HASH_MISMATCH",
    trigger: "Agent orchestration evidence hash differs from manifest or self-hash rule",
    canonicalMessage: "Agent orchestration evidence hash does not match the manifest or self-hash rule.",
    severity: "error",
    diagnosticSource: "evidence-validator",
    stage: "evidence",
    phase: "orchestration-evidence",
    artifactPath: "fixtures/p3/mutations/hash-mismatch.agent-orchestration-evidence.json",
    jsonPointer: "/artifacts/0/hash",
    sourceRef: "fixture://p3/mutations/hash-mismatch#/artifacts/0/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hash-mismatch.agent-orchestration-evidence.json"
  })
];

export const P3_EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: "fixtures/p3/valid/runtime-adapter-plan.agent-task.json",
    kind: "valid",
    stage: "orchestration",
    phase: "orchestration-plan",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/p3/orchestration-plan.json",
    jsonPointer: "/taskId",
    requiredSourceRef: "fixture://p3/valid/runtime-adapter-plan#/taskId",
    selectedAgentIds: ["contract-architect"],
    workOrderPath: "artifacts/p3/work-order.contract-architect.json",
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/valid/fixture-authoring.agent-task.json",
    kind: "valid",
    stage: "work-order",
    phase: "work-order-validation",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/p3/work-order.fixture-author.json",
    jsonPointer: "/taskId",
    requiredSourceRef: "fixture://p3/valid/fixture-authoring#/taskId",
    selectedAgentIds: ["fixture-author"],
    workOrderPath: "artifacts/p3/work-order.fixture-author.json",
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/valid/evidence-review.agent-task.json",
    kind: "valid",
    stage: "work-order",
    phase: "work-order-validation",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/p3/work-order.evidence-reviewer.json",
    jsonPointer: "/taskId",
    requiredSourceRef: "fixture://p3/valid/evidence-review#/taskId",
    selectedAgentIds: ["evidence-reviewer"],
    workOrderPath: "artifacts/p3/work-order.evidence-reviewer.json",
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/review/review-required-work.agent-task.json",
    kind: "review",
    stage: "review",
    phase: "review-routing",
    expectedResult: "review_required",
    promotionStatus: "review_required",
    diagnosticCodes: ["AGENT_REVIEW_REQUIRED"],
    artifactPath: "artifacts/p3/review-queue.json",
    jsonPointer: "/reviewPolicy",
    requiredSourceRef: "fixture://p3/review/review-required-work#/reviewPolicy",
    selectedAgentIds: ["contract-architect"],
    workOrderPath: null,
    reviewQueuePath: "artifacts/p3/review-queue.json"
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/unregistered-capability.agent-task.json",
    kind: "invalid",
    stage: "recruitment",
    phase: "recruitment-selection",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_CAPABILITY_UNREGISTERED"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/requiredCapabilities",
    requiredSourceRef: "fixture://p3/invalid/unregistered-capability#/requiredCapabilities",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/denied-tool.agent-task.json",
    kind: "invalid",
    stage: "recruitment",
    phase: "recruitment-selection",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_TOOL_DENIED"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/deniedCapabilities",
    requiredSourceRef: "fixture://p3/invalid/denied-tool#/deniedCapabilities",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/scope-escalation.agent-task.json",
    kind: "invalid",
    stage: "work-order",
    phase: "work-order-validation",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_SCOPE_ESCALATION"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/allowedOutputs",
    requiredSourceRef: "fixture://p3/invalid/scope-escalation#/allowedOutputs",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/hidden-output.agent-task.json",
    kind: "invalid",
    stage: "work-order",
    phase: "work-order-validation",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_OUTPUT_HIDDEN"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/allowedOutputs",
    requiredSourceRef: "fixture://p3/invalid/hidden-output#/allowedOutputs",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/blocked-review-policy.agent-task.json",
    kind: "invalid",
    stage: "review",
    phase: "review-routing",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_REVIEW_POLICY_BLOCKED"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/reviewPolicy",
    requiredSourceRef: "fixture://p3/invalid/blocked-review-policy#/reviewPolicy",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/cycle-dependency.agent-task.json",
    kind: "invalid",
    stage: "orchestration",
    phase: "orchestration-plan",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_DEPENDENCY_CYCLE"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/dependencies",
    requiredSourceRef: "fixture://p3/invalid/cycle-dependency#/dependencies",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p3/invalid/missing-dependency.agent-task.json",
    kind: "invalid",
    stage: "orchestration",
    phase: "orchestration-plan",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["AGENT_DEPENDENCY_MISSING"],
    artifactPath: "artifacts/p3/agent-orchestration-report.json",
    jsonPointer: "/dependencies",
    requiredSourceRef: "fixture://p3/invalid/missing-dependency#/dependencies",
    selectedAgentIds: [],
    workOrderPath: null,
    reviewQueuePath: null
  }),
  ...[
    ["mutations/missing-upstream-evidence.agent-preflight.json", "preflight", "upstream-preflight", "AGENT_UPSTREAM_EVIDENCE_MISSING", "/ingestionEvidenceRef"],
    ["mutations/failing-upstream-evidence.agent-preflight.json", "preflight", "upstream-preflight", "AGENT_UPSTREAM_EVIDENCE_FAILED", "/status"],
    ["mutations/upstream-evidence-hash-mismatch.agent-preflight.json", "preflight", "upstream-preflight", "AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH", "/boundaryRefs/0/hash"],
    ["mutations/stale-upstream-evidence.agent-preflight.json", "preflight", "upstream-preflight", "AGENT_UPSTREAM_EVIDENCE_STALE", "/boundaryRefs"],
    ["mutations/missing-registry-ref.agent-orchestration-plan.json", "orchestration", "orchestration-plan", "AGENT_REGISTRY_REF_MISSING", "/registryRef"],
    ["mutations/registry-hash-mismatch.agent-orchestration-plan.json", "orchestration", "orchestration-plan", "AGENT_REGISTRY_HASH_MISMATCH", "/registryRef/hash"],
    ["mutations/unregistered-agent.agent-orchestration-plan.json", "recruitment", "recruitment-selection", "AGENT_UNREGISTERED", "/tasks/0/selectedAgentIds/0"],
    ["mutations/duplicate-task-id.agent-orchestration-plan.json", "orchestration", "orchestration-plan", "AGENT_TASK_DUPLICATE_ID", "/tasks/1/taskId"],
    ["mutations/duplicate-work-order-id.agent-orchestration-plan.json", "orchestration", "orchestration-plan", "AGENT_WORK_ORDER_DUPLICATE_ID", "/workOrders/1/workOrderId"],
    ["mutations/hidden-handoff.agent-orchestration-plan.json", "orchestration", "orchestration-plan", "AGENT_HANDOFF_HIDDEN", "/tasks/1/dependencies/0"],
    ["mutations/work-order-scope-escalation.agent-work-order.json", "work-order", "work-order-validation", "AGENT_SCOPE_ESCALATION", "/allowedOutputs"],
    ["mutations/report-plan-hash-mismatch.agent-orchestration-report.json", "report", "orchestration-report", "AGENT_REPORT_PLAN_HASH_MISMATCH", "/orchestrationPlanRef/hash"],
    ["mutations/hash-mismatch.agent-orchestration-evidence.json", "evidence", "orchestration-evidence", "AGENT_EVIDENCE_HASH_MISMATCH", "/artifacts/0/hash"]
  ].map(([file, stage, phase, code, jsonPointer]) => expectationRow({
    fixturePath: `${P3_FIXTURE_ROOT}/${file}`,
    kind: "mutation",
    stage,
    phase,
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: [code],
    artifactPath: `${P3_FIXTURE_ROOT}/${file}`,
    jsonPointer,
    requiredSourceRef: `fixture://p3/${file.replace(/\.[^.]+(?:\.[^.]+)?$/, "").replace(".agent-preflight", "").replace(".agent-orchestration-plan", "").replace(".agent-work-order", "").replace(".agent-orchestration-report", "").replace(".agent-orchestration-evidence", "")}#${jsonPointer}`,
    selectedAgentIds: code === "AGENT_UNREGISTERED" ? ["unregistered-agent"] : code === "AGENT_SCOPE_ESCALATION" && file.includes("work-order") ? ["fixture-author"] : [],
    workOrderPath: null,
    reviewQueuePath: null
  }))
];

export function p3SchemaPaths() {
  return P3_SCHEMA_FILES.map((file) => `${P3_SCHEMA_ROOT}/${file}`);
}

export function p3FixturePaths() {
  return [
    `${P3_FIXTURE_ROOT}/agent-capability-registry.fixture.json`,
    `${P3_FIXTURE_ROOT}/expectations.manifest.json`,
    ...P3_FIXTURE_FILES
  ];
}

export function p3ArtifactOrder() {
  return [
    ...p3SchemaPaths(),
    P3_INGESTION_EVIDENCE_PATH,
    P3_CATALOG_PATH,
    ...p3FixturePaths(),
    ...P3_ARTIFACT_PATHS
  ];
}

export function schemaIdForP3Path(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (artifactPath === P3_INGESTION_EVIDENCE_PATH) return "design-system-ingestion-evidence.v0";
  if (artifactPath === P3_CATALOG_PATH) return "runtime-catalog.v0";
  if (P3_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath.endsWith("agent-capability-registry.fixture.json")) return "agent-capability-registry-fixture.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "agent-orchestration-expectations.v0";
  if (artifactPath.endsWith(".agent-task.json")) return "agent-task.v0";
  if (artifactPath.endsWith(".agent-preflight.json")) return "agent-preflight-mutation.v0";
  if (artifactPath.endsWith(".agent-orchestration-plan.json")) return "agent-orchestration-plan.v0";
  if (artifactPath.endsWith(".agent-work-order.json")) return "agent-work-order.v0";
  if (artifactPath.endsWith(".agent-orchestration-report.json")) return "agent-orchestration-report.v0";
  if (artifactPath.endsWith(".agent-orchestration-evidence.json")) return "agent-orchestration-evidence.v0";
  if (artifactPath.endsWith("agent-capability-registry.json")) return "agent-capability-registry.v0";
  if (artifactPath.endsWith("orchestration-plan.json")) return "agent-orchestration-plan.v0";
  if (artifactPath.includes("/work-order.")) return "agent-work-order.v0";
  if (artifactPath.endsWith("review-queue.json")) return "agent-review-queue.v0";
  if (artifactPath.endsWith("agent-orchestration-report.json")) return "agent-orchestration-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "agent-orchestration-evidence.v0";
  return null;
}

export async function materializeP3Contract(cwd) {
  const schemas = buildP3Schemas();
  for (const file of P3_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, P3_SCHEMA_ROOT, file), schemas[file]);
  }

  const fixtures = buildP3Fixtures();
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, P3_FIXTURE_ROOT, file), fixture);
  }
  console.log("P3 materialize: pass");
}

export function buildP3Schemas() {
  return {
    "agent-capability-registry-fixture.v0.schema.json": agentCapabilityRegistryFixtureSchema(),
    "agent-capability-registry.v0.schema.json": agentCapabilityRegistrySchema(),
    "agent-preflight-mutation.v0.schema.json": agentPreflightMutationSchema(),
    "agent-task.v0.schema.json": agentTaskSchema(),
    "agent-work-order.v0.schema.json": agentWorkOrderSchema(),
    "agent-orchestration-plan.v0.schema.json": agentOrchestrationPlanSchema(),
    "agent-review-queue.v0.schema.json": agentReviewQueueSchema(),
    "agent-orchestration-report.v0.schema.json": agentOrchestrationReportSchema(),
    "agent-orchestration-evidence.v0.schema.json": agentOrchestrationEvidenceSchema(),
    "agent-orchestration-expectations.v0.schema.json": agentOrchestrationExpectationsSchema(),
    "agent-orchestration-diagnostics.v0.schema.json": agentOrchestrationDiagnosticsSchema()
  };
}

export function buildP3Fixtures() {
  return {
    "agent-capability-registry.fixture.json": registryFixture(),
    "expectations.manifest.json": expectationsManifest(),
    "valid/runtime-adapter-plan.agent-task.json": taskFixture({
      taskId: "runtime-adapter-plan",
      sourceRef: "fixture://p3/valid/runtime-adapter-plan#/taskId",
      taskKind: "contract-planning",
      requiredCapabilities: ["plan-contracts", "schema-boundaries", "risk-review"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.contract-architect.json", "agent-work-order.v0")],
      dependencies: [artifactDependency(P3_INGESTION_EVIDENCE_PATH), artifactDependency(P3_CATALOG_PATH)],
      reviewPolicy: "allowed",
      evidenceObligations: ["schema-boundary-notes", "scope-risk-register", "diagnostic-coverage"]
    }),
    "valid/fixture-authoring.agent-task.json": taskFixture({
      taskId: "fixture-authoring",
      sourceRef: "fixture://p3/valid/fixture-authoring#/taskId",
      taskKind: "fixture-authoring",
      requiredCapabilities: ["fixture-design", "diagnostics-mapping", "negative-coverage"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.fixture-author.json", "agent-work-order.v0")],
      dependencies: [taskDependency("runtime-adapter-plan")],
      reviewPolicy: "allowed",
      evidenceObligations: ["manifest-row-coverage", "negative-fixture-coverage", "diagnostic-code-coverage"]
    }),
    "valid/evidence-review.agent-task.json": taskFixture({
      taskId: "evidence-review",
      sourceRef: "fixture://p3/valid/evidence-review#/taskId",
      taskKind: "evidence-review",
      requiredCapabilities: ["evidence-audit", "hash-provenance", "ci-gates"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.evidence-reviewer.json", "agent-work-order.v0")],
      dependencies: [taskDependency("fixture-authoring")],
      reviewPolicy: "allowed",
      evidenceObligations: ["hash-closure-audit", "report-row-audit", "ci-drift-gate-audit"]
    }),
    "review/review-required-work.agent-task.json": taskFixture({
      taskId: "review-required-work",
      sourceRef: "fixture://p3/review/review-required-work#/reviewPolicy",
      taskKind: "review-required-orchestration",
      requiredCapabilities: ["plan-contracts", "risk-review"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.contract-architect.json", "agent-work-order.v0")],
      dependencies: [taskDependency("runtime-adapter-plan")],
      reviewPolicy: "review_required",
      requiredReviewerRole: "surface-ops-reviewer",
      suggestedAction: "Review the candidate orchestration scope in a later SurfaceOps proof before execution.",
      evidenceObligations: ["review-queue-row", "non-executable-status", "source-fixture-ref"]
    }),
    "invalid/unregistered-capability.agent-task.json": taskFixture({
      taskId: "unregistered-capability",
      sourceRef: "fixture://p3/invalid/unregistered-capability#/requiredCapabilities",
      taskKind: "invalid-recruitment",
      requiredCapabilities: ["live-agent-execution"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.unregistered.json", "agent-work-order.v0")],
      dependencies: [],
      reviewPolicy: "allowed"
    }),
    "invalid/denied-tool.agent-task.json": taskFixture({
      taskId: "denied-tool",
      sourceRef: "fixture://p3/invalid/denied-tool#/deniedCapabilities",
      taskKind: "invalid-recruitment",
      requiredCapabilities: ["fixture-design"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.denied-tool.json", "agent-work-order.v0")],
      dependencies: [],
      reviewPolicy: "allowed",
      requestedTools: ["shell"],
      deniedCapabilities: ["shell", "network", "connector", "secret", "file-edit", "callback"]
    }),
    "invalid/scope-escalation.agent-task.json": taskFixture({
      taskId: "scope-escalation",
      sourceRef: "fixture://p3/invalid/scope-escalation#/allowedOutputs",
      taskKind: "invalid-work-order",
      requiredCapabilities: ["fixture-design"],
      allowedOutputs: [outputRef("artifacts/p4/future-output.json", "agent-work-order.v0")],
      dependencies: [],
      reviewPolicy: "allowed"
    }),
    "invalid/hidden-output.agent-task.json": taskFixture({
      taskId: "hidden-output",
      sourceRef: "fixture://p3/invalid/hidden-output#/allowedOutputs",
      taskKind: "invalid-work-order",
      requiredCapabilities: ["fixture-design"],
      allowedOutputs: [outputRef("artifacts/p3/.hidden-output.json", "agent-work-order.v0", { hidden: true, evidenceTracked: false })],
      dependencies: [],
      reviewPolicy: "allowed"
    }),
    "invalid/blocked-review-policy.agent-task.json": taskFixture({
      taskId: "blocked-review-policy",
      sourceRef: "fixture://p3/invalid/blocked-review-policy#/reviewPolicy",
      taskKind: "invalid-review-policy",
      requiredCapabilities: ["plan-contracts"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.contract-architect.json", "agent-work-order.v0")],
      dependencies: [],
      reviewPolicy: "blocked",
      evidenceObligations: ["blocked-policy-preserved", "no-work-order", "report-row"]
    }),
    "invalid/cycle-dependency.agent-task.json": taskFixture({
      taskId: "cycle-dependency",
      sourceRef: "fixture://p3/invalid/cycle-dependency#/dependencies",
      taskKind: "invalid-orchestration",
      requiredCapabilities: ["fixture-design"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.cycle.json", "agent-work-order.v0")],
      dependencies: [taskDependency("cycle-dependency")],
      reviewPolicy: "allowed"
    }),
    "invalid/missing-dependency.agent-task.json": taskFixture({
      taskId: "missing-dependency",
      sourceRef: "fixture://p3/invalid/missing-dependency#/dependencies",
      taskKind: "invalid-orchestration",
      requiredCapabilities: ["fixture-design"],
      allowedOutputs: [outputRef("artifacts/p3/work-order.missing-dependency.json", "agent-work-order.v0")],
      dependencies: [taskDependency("not-declared")],
      reviewPolicy: "allowed"
    }),
    "mutations/missing-upstream-evidence.agent-preflight.json": preflightMutation({
      mutation: "missing-file",
      ingestionEvidenceRef: null
    }),
    "mutations/failing-upstream-evidence.agent-preflight.json": preflightMutation({
      mutation: "status",
      status: "fail",
      ingestionEvidenceRef: { path: P3_INGESTION_EVIDENCE_PATH, schemaId: "design-system-ingestion-evidence.v0" }
    }),
    "mutations/upstream-evidence-hash-mismatch.agent-preflight.json": preflightMutation({
      mutation: "hash-mismatch",
      boundaryRefs: [{ path: P3_CATALOG_PATH, hash: "0".repeat(64) }]
    }),
    "mutations/stale-upstream-evidence.agent-preflight.json": preflightMutation({
      mutation: "stale-boundary",
      boundaryRefs: [{ path: "artifacts/p2/alternate-evidence.json", hash: P3_ACCEPTED_P2_EVIDENCE_HASH }]
    }),
    "mutations/missing-registry-ref.agent-orchestration-plan.json": planMutation({ omitRegistryRef: true }),
    "mutations/registry-hash-mismatch.agent-orchestration-plan.json": planMutation({ registryHash: "0".repeat(64) }),
    "mutations/unregistered-agent.agent-orchestration-plan.json": planMutation({ selectedAgentIds: ["unregistered-agent"] }),
    "mutations/duplicate-task-id.agent-orchestration-plan.json": planMutation({ duplicateTaskId: true }),
    "mutations/duplicate-work-order-id.agent-orchestration-plan.json": planMutation({ duplicateWorkOrderId: true }),
    "mutations/hidden-handoff.agent-orchestration-plan.json": planMutation({ hiddenHandoff: true }),
    "mutations/work-order-scope-escalation.agent-work-order.json": workOrderMutation(),
    "mutations/report-plan-hash-mismatch.agent-orchestration-report.json": reportMutation(),
    "mutations/hash-mismatch.agent-orchestration-evidence.json": evidenceMutation()
  };
}

export async function fileHashForEvidence(cwd, relativePath) {
  return relativePath.endsWith(".json") ? canonicalFileHash(path.join(cwd, relativePath)) : rawFileHash(path.join(cwd, relativePath));
}

function diagnosticRow(row) {
  return {
    ...row,
    suggestedAction: row.suggestedAction ?? suggestedActionForCode(row.code)
  };
}

function expectationRow(row) {
  return deepClone(row);
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM")) return "Regenerate or restore the accepted P2 ingestion evidence and governed catalog before P3 proof continues.";
  if (code.includes("REGISTRY")) return "Regenerate the orchestration plan from the current agent capability registry.";
  if (code.includes("SCOPE") || code.includes("OUTPUT")) return "Keep agent inputs and outputs inside the declared P3 artifact scope.";
  if (code.includes("REVIEW")) return "Route the task to the non-executable review queue.";
  if (code.includes("HASH")) return "Regenerate P3 proof artifacts from current inputs.";
  return "Correct the P3 fixture or generated artifact and rerun the proof.";
}

function registryFixture() {
  const agents = {
    "contract-architect": agentDefinition({
      agentId: "contract-architect",
      role: "Defines or reviews plan/schema boundaries",
      capabilityIds: ["plan-contracts", "schema-boundaries", "risk-review"],
      allowedOutputs: ["artifacts/p3/work-order.contract-architect.json"]
    }),
    "fixture-author": agentDefinition({
      agentId: "fixture-author",
      role: "Defines proof fixtures and manifest expectations",
      capabilityIds: ["fixture-design", "diagnostics-mapping", "negative-coverage"],
      allowedOutputs: ["artifacts/p3/work-order.fixture-author.json"]
    }),
    "evidence-reviewer": agentDefinition({
      agentId: "evidence-reviewer",
      role: "Reviews report/evidence completeness and drift gates",
      capabilityIds: ["evidence-audit", "hash-provenance", "ci-gates"],
      allowedOutputs: ["artifacts/p3/work-order.evidence-reviewer.json"]
    })
  };

  return {
    schemaId: "agent-capability-registry-fixture.v0",
    version: P3_VERSION,
    upstreamRequirements: {
      ingestionEvidencePath: P3_INGESTION_EVIDENCE_PATH,
      acceptedIngestionEvidenceHash: P3_ACCEPTED_P2_EVIDENCE_HASH,
      catalogPath: P3_CATALOG_PATH,
      acceptedCatalogHash: P3_ACCEPTED_P2_CATALOG_HASH
    },
    agents,
    capabilities: capabilityDefinitions(agents),
    policies: registryPolicies(),
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-materialize",
      sourceRefs: ["plans/p3/agent-capability-registry-v0.md", "plans/p3/recruitment-policy.md"]
    }
  };
}

function agentDefinition({ agentId, role, capabilityIds, allowedOutputs }) {
  return {
    agentId,
    role,
    capabilityIds,
    allowedInputs: [
      P3_INGESTION_EVIDENCE_PATH,
      P3_CATALOG_PATH,
      `${P3_FIXTURE_ROOT}/expectations.manifest.json`
    ],
    allowedOutputs,
    deniedCapabilities: deniedCapabilities(),
    reviewRoutes: ["agent-orchestration-review"],
    evidenceObligations: ["hashes", "provenance", "diagnostics", "report-row"],
    nonExecutable: true
  };
}

function capabilityDefinitions(agents) {
  const rows = {};
  for (const agent of Object.values(agents)) {
    for (const capabilityId of agent.capabilityIds) {
      rows[capabilityId] = {
        capabilityId,
        allowedInputClasses: ["p2-evidence", "p2-catalog", "p3-fixture", "p3-plan"],
        allowedOutputClasses: ["agent-work-order.v0"],
        allowedOutputPaths: agent.allowedOutputs,
        deniedTools: deniedCapabilities(),
        reviewRoutes: agent.reviewRoutes,
        evidenceObligations: agent.evidenceObligations,
        nonExecutable: true
      };
    }
  }
  return rows;
}

function registryPolicies() {
  return {
    recruitment: {
      selection: "smallest-registered-agent-set",
      tieBreakers: ["registryOrder", "agentId", "capabilityId", "taskId"]
    },
    scope: {
      allowedOutputRoot: P3_ARTIFACT_ROOT,
      hiddenOutputsAllowed: false,
      evidenceTrackedOutputsRequired: true
    },
    inertBoundary: {
      liveAgents: false,
      shellCommands: false,
      toolCalls: false,
      connectorCalls: false,
      networkCalls: false,
      fileEdits: false,
      secrets: false,
      callbacks: false,
      persistentReviewDecisions: false
    },
    review: {
      queuePath: `${P3_ARTIFACT_ROOT}/review-queue.json`,
      promotionStatus: "review_required",
      executableWorkOrders: false
    }
  };
}

function taskFixture({
  taskId,
  sourceRef,
  taskKind,
  requiredCapabilities,
  allowedOutputs,
  dependencies,
  reviewPolicy,
  evidenceObligations = ["hashes", "provenance", "diagnostics"],
  requestedTools = [],
  deniedCapabilities: explicitDenied = deniedCapabilities(),
  requiredReviewerRole = null,
  suggestedAction = null
}) {
  return {
    schemaId: "agent-task.v0",
    version: P3_VERSION,
    taskId,
    taskKind,
    requiredCapabilities,
    allowedInputs: [
      inputRef(P3_INGESTION_EVIDENCE_PATH, "design-system-ingestion-evidence.v0"),
      inputRef(P3_CATALOG_PATH, "runtime-catalog.v0")
    ],
    allowedOutputs,
    dependencies,
    reviewPolicy,
    evidenceObligations,
    deniedCapabilities: explicitDenied,
    requestedTools,
    requiredReviewerRole,
    suggestedAction,
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-materialize",
      sourceRefs: [sourceRef]
    }
  };
}

function inputRef(pathValue, schemaId) {
  return {
    path: pathValue,
    schemaId,
    evidenceTracked: true
  };
}

function outputRef(pathValue, schemaId, options = {}) {
  return {
    path: pathValue,
    schemaId,
    artifactClass: "agent-orchestration-proof",
    evidenceTracked: options.evidenceTracked ?? true,
    hidden: options.hidden ?? false
  };
}

function artifactDependency(pathValue) {
  return {
    dependencyType: "artifact",
    ref: pathValue
  };
}

function taskDependency(taskId) {
  return {
    dependencyType: "task",
    ref: taskId
  };
}

function deniedCapabilities() {
  return ["shell", "network", "connector", "secret", "file-edit", "callback", "live-agent-execution"];
}

function preflightMutation(overrides) {
  return {
    schemaId: "agent-preflight-mutation.v0",
    version: P3_VERSION,
    command: "interfacectl surfaces agents proof",
    ...overrides,
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-materialize",
      sourceRefs: ["plans/p3/validation-evidence.md#p2-preflight-gate"]
    }
  };
}

function planMutation(options = {}) {
  const task = {
    taskId: "runtime-adapter-plan",
    selectedAgentIds: options.selectedAgentIds ?? ["contract-architect"],
    requiredCapabilities: ["plan-contracts"],
    dependencies: []
  };
  const secondTask = options.duplicateTaskId ?
    { ...task, selectedAgentIds: ["fixture-author"] } :
    { taskId: "fixture-authoring", selectedAgentIds: ["fixture-author"], requiredCapabilities: ["fixture-design"], dependencies: options.hiddenHandoff ? ["hidden-task"] : ["runtime-adapter-plan"] };
  const workOrder = {
    workOrderId: "work-order.contract-architect",
    taskId: "runtime-adapter-plan",
    agentId: "contract-architect",
    path: "artifacts/p3/work-order.contract-architect.json"
  };
  const secondWorkOrder = options.duplicateWorkOrderId ?
    { ...workOrder, taskId: "fixture-authoring", agentId: "fixture-author" } :
    { workOrderId: "work-order.fixture-author", taskId: "fixture-authoring", agentId: "fixture-author", path: "artifacts/p3/work-order.fixture-author.json" };
  const plan = {
    schemaId: "agent-orchestration-plan.v0",
    version: P3_VERSION,
    runId: "p3-mutation",
    boundaryRefs: [],
    tasks: options.duplicateTaskId ? [task, secondTask] : [task, secondTask],
    workOrders: options.duplicateWorkOrderId ? [workOrder, secondWorkOrder] : [workOrder],
    reviewQueueRef: {
      path: "artifacts/p3/review-queue.json",
      schemaId: "agent-review-queue.v0",
      runId: "p3-mutation",
      expectedItemCount: 1
    },
    diagnostics: [],
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-materialize",
      sourceRefs: ["plans/p3/orchestration-proof.md"]
    }
  };
  if (!options.omitRegistryRef) {
    plan.registryRef = {
      path: "artifacts/p3/agent-capability-registry.json",
      schemaId: "agent-capability-registry.v0",
      hashAlgorithm: "sha256",
      hash: options.registryHash ?? "1".repeat(64)
    };
  }
  return plan;
}

function workOrderMutation() {
  return {
    schemaId: "agent-work-order.v0",
    version: P3_VERSION,
    runId: "p3-mutation",
    workOrderId: "work-order.fixture-author",
    taskId: "fixture-authoring",
    agentId: "fixture-author",
    capabilityIds: ["fixture-design"],
    allowedInputs: [inputRef(P3_INGESTION_EVIDENCE_PATH, "design-system-ingestion-evidence.v0")],
    allowedOutputs: [outputRef("artifacts/p4/escalated-output.json", "agent-work-order.v0")],
    dependencies: [taskDependency("runtime-adapter-plan")],
    deniedCapabilities: deniedCapabilities(),
    evidenceObligations: ["hashes"],
    promotionStatus: "allowed",
    nonExecutable: true,
    execution: inertExecution(),
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-materialize",
      sourceRefs: ["fixture://p3/mutations/work-order-scope-escalation#/allowedOutputs"]
    }
  };
}

function reportMutation() {
  return {
    schemaId: "agent-orchestration-report.v0",
    version: P3_VERSION,
    runId: "p3-mutation",
    orchestrationPlanRef: {
      path: "artifacts/p3/orchestration-plan.json",
      schemaId: "agent-orchestration-plan.v0",
      hashAlgorithm: "sha256",
      hash: "0".repeat(64)
    },
    results: [],
    diagnostics: [],
    status: "pass",
    promotionStatus: "allowed"
  };
}

function evidenceMutation() {
  return {
    schemaId: "agent-orchestration-evidence.v0",
    version: P3_VERSION,
    runId: "p3-mutation",
    artifacts: [
      {
        path: "artifacts/p3/agent-capability-registry.json",
        schemaId: "agent-capability-registry.v0",
        hashAlgorithm: "sha256",
        hash: "0".repeat(64)
      }
    ],
    status: "pass",
    promotionStatus: "allowed"
  };
}

export function inertExecution() {
  return {
    authorized: false,
    reason: "P3 work orders are inert proof descriptors and authorize no execution.",
    shellCommands: [],
    toolCalls: [],
    connectorCalls: [],
    networkCalls: [],
    fileEdits: [],
    secrets: [],
    callbacks: []
  };
}

function expectationsManifest() {
  return {
    schemaId: "agent-orchestration-expectations.v0",
    version: P3_VERSION,
    fixtureRoot: P3_FIXTURE_ROOT,
    artifactRoot: P3_ARTIFACT_ROOT,
    schemaRoot: P3_SCHEMA_ROOT,
    inputs: p3FixturePaths(),
    artifactOrder: p3ArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: P3_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required"
    }
  };
}

export function diagnosticsRegistry() {
  return P3_DIAGNOSTIC_ROWS.map((row) => ({ ...row }));
}

function schemaBase(schemaId) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://surfaces.dev/schemas/p3/${schemaId}.schema.json`,
    title: schemaId,
    schemaId,
    version: P3_VERSION,
    type: "object"
  };
}

function agentCapabilityRegistrySchema() {
  return {
    ...schemaBase("agent-capability-registry.v0"),
    required: ["schemaId", "version", "ingestionEvidenceRef", "catalogRef", "agents", "capabilities", "policies", "provenance", "diagnostics"],
    properties: {
      schemaId: { const: "agent-capability-registry.v0" },
      version: semverSchema(),
      ingestionEvidenceRef: artifactRefSchema(),
      catalogRef: artifactRefSchema({ sourceEvidenceHash: true }),
      agents: { type: "object", additionalProperties: agentDefinitionSchema(), minProperties: 1 },
      capabilities: { type: "object", additionalProperties: capabilityDefinitionSchema(), minProperties: 1 },
      policies: registryPoliciesSchema(),
      provenance: provenanceSchema(),
      diagnostics: { type: "array", items: diagnosticObjectSchema() }
    },
    unevaluatedProperties: false
  };
}

function agentCapabilityRegistryFixtureSchema() {
  return {
    ...schemaBase("agent-capability-registry-fixture.v0"),
    required: ["schemaId", "version", "upstreamRequirements", "agents", "capabilities", "policies", "provenance"],
    properties: {
      schemaId: { const: "agent-capability-registry-fixture.v0" },
      version: semverSchema(),
      upstreamRequirements: {
        type: "object",
        required: [
          "ingestionEvidencePath",
          "acceptedIngestionEvidenceHash",
          "catalogPath",
          "acceptedCatalogHash"
        ],
        properties: {
          ingestionEvidencePath: { const: P3_INGESTION_EVIDENCE_PATH },
          acceptedIngestionEvidenceHash: { const: P3_ACCEPTED_P2_EVIDENCE_HASH },
          catalogPath: { const: P3_CATALOG_PATH },
          acceptedCatalogHash: { const: P3_ACCEPTED_P2_CATALOG_HASH }
        },
        unevaluatedProperties: false
      },
      agents: { type: "object", additionalProperties: agentDefinitionSchema(), minProperties: 1 },
      capabilities: { type: "object", additionalProperties: capabilityDefinitionSchema(), minProperties: 1 },
      policies: registryPoliciesSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentTaskSchema() {
  return {
    ...schemaBase("agent-task.v0"),
    required: ["schemaId", "version", "taskId", "taskKind", "requiredCapabilities", "allowedInputs", "allowedOutputs", "dependencies", "reviewPolicy", "evidenceObligations", "deniedCapabilities", "provenance"],
    properties: {
      schemaId: { const: "agent-task.v0" },
      version: semverSchema(),
      taskId: identifierSchema(),
      taskKind: identifierSchema(),
      requiredCapabilities: stringArraySchema({ minItems: 1 }),
      allowedInputs: { type: "array", items: pathRefSchema(), minItems: 1 },
      allowedOutputs: { type: "array", items: outputRefSchema(), minItems: 1 },
      dependencies: { type: "array", items: dependencySchema() },
      reviewPolicy: { enum: ["allowed", "blocked", "review_required"] },
      evidenceObligations: stringArraySchema({ minItems: 1 }),
      deniedCapabilities: stringArraySchema({ minItems: 1 }),
      requestedTools: stringArraySchema(),
      requiredReviewerRole: nullableStringSchema(),
      suggestedAction: nullableStringSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentPreflightMutationSchema() {
  return {
    ...schemaBase("agent-preflight-mutation.v0"),
    required: ["schemaId", "version", "command", "mutation", "provenance"],
    properties: {
      schemaId: { const: "agent-preflight-mutation.v0" },
      version: semverSchema(),
      command: { const: "interfacectl surfaces agents proof" },
      mutation: { enum: ["missing-file", "status", "hash-mismatch", "stale-boundary"] },
      ingestionEvidenceRef: {
        oneOf: [
          { type: "null" },
          {
            type: "object",
            required: ["path", "schemaId"],
            properties: {
              path: relativePathSchema(),
              schemaId: { type: "string", minLength: 1 }
            },
            unevaluatedProperties: false
          }
        ]
      },
      status: { const: "fail" },
      boundaryRefs: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["path", "hash"],
          properties: {
            path: relativePathSchema(),
            hash: hashSchema()
          },
          unevaluatedProperties: false
        }
      },
      provenance: provenanceSchema()
    },
    allOf: [
      {
        if: { properties: { mutation: { const: "missing-file" } }, required: ["mutation"] },
        then: {
          required: ["ingestionEvidenceRef"],
          properties: {
            ingestionEvidenceRef: { type: "null" },
            status: false,
            boundaryRefs: false
          }
        }
      },
      {
        if: { properties: { mutation: { const: "status" } }, required: ["mutation"] },
        then: {
          required: ["ingestionEvidenceRef", "status"],
          properties: {
            ingestionEvidenceRef: {
              type: "object",
              required: ["path", "schemaId"],
              properties: {
                path: { const: P3_INGESTION_EVIDENCE_PATH },
                schemaId: { const: "design-system-ingestion-evidence.v0" }
              },
              unevaluatedProperties: false
            },
            boundaryRefs: false,
            status: { const: "fail" }
          }
        }
      },
      {
        if: { properties: { mutation: { const: "hash-mismatch" } }, required: ["mutation"] },
        then: {
          required: ["boundaryRefs"],
          properties: {
            ingestionEvidenceRef: false,
            status: false,
            boundaryRefs: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                required: ["path", "hash"],
                properties: {
                  path: { const: P3_CATALOG_PATH },
                  hash: { const: "0".repeat(64) }
                },
                unevaluatedProperties: false
              }
            }
          }
        }
      },
      {
        if: { properties: { mutation: { const: "stale-boundary" } }, required: ["mutation"] },
        then: {
          required: ["boundaryRefs"],
          properties: {
            ingestionEvidenceRef: false,
            status: false,
            boundaryRefs: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                required: ["path", "hash"],
                properties: {
                  path: { const: "artifacts/p2/alternate-evidence.json" },
                  hash: { const: P3_ACCEPTED_P2_EVIDENCE_HASH }
                },
                unevaluatedProperties: false
              }
            }
          }
        }
      }
    ],
    unevaluatedProperties: false
  };
}

function agentWorkOrderSchema() {
  return {
    ...schemaBase("agent-work-order.v0"),
    required: ["schemaId", "version", "runId", "workOrderId", "taskId", "agentId", "capabilityIds", "allowedInputs", "allowedOutputs", "dependencies", "deniedCapabilities", "evidenceObligations", "promotionStatus", "nonExecutable", "execution", "provenance"],
    properties: {
      schemaId: { const: "agent-work-order.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      workOrderId: identifierSchema(),
      taskId: identifierSchema(),
      agentId: identifierSchema(),
      capabilityIds: stringArraySchema({ minItems: 1 }),
      allowedInputs: { type: "array", items: pathRefSchema(), minItems: 1 },
      allowedOutputs: { type: "array", items: outputRefSchema(), minItems: 1 },
      dependencies: { type: "array", items: dependencySchema() },
      deniedCapabilities: stringArraySchema({ minItems: 1 }),
      evidenceObligations: stringArraySchema({ minItems: 1 }),
      promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
      nonExecutable: { const: true },
      execution: inertExecutionSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentOrchestrationPlanSchema() {
  return {
    ...schemaBase("agent-orchestration-plan.v0"),
    required: ["schemaId", "version", "runId", "registryRef", "boundaryRefs", "tasks", "workOrders", "reviewQueueRef", "diagnostics", "provenance"],
    properties: {
      schemaId: { const: "agent-orchestration-plan.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      registryRef: artifactRefSchema(),
      boundaryRefs: { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true }), minItems: 3 },
      tasks: { type: "array", items: planTaskSchema(), minItems: 1 },
      workOrders: { type: "array", items: plannedWorkOrderRefSchema(), minItems: 1 },
      reviewQueueRef: forwardReviewQueueRefSchema(),
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentReviewQueueSchema() {
  return {
    ...schemaBase("agent-review-queue.v0"),
    required: ["schemaId", "version", "runId", "orchestrationPlanRef", "items", "diagnostics", "provenance"],
    properties: {
      schemaId: { const: "agent-review-queue.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      orchestrationPlanRef: artifactRefSchema(),
      items: { type: "array", items: reviewQueueItemSchema() },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentOrchestrationReportSchema() {
  return {
    ...schemaBase("agent-orchestration-report.v0"),
    required: ["schemaId", "version", "runId", "ingestionEvidenceRef", "catalogRef", "registryRef", "orchestrationPlanRef", "reviewQueueRef", "results", "workOrderRefs", "reviewQueueItems", "diagnostics", "diagnosticsRegistry", "environment", "status", "promotionStatus", "provenance"],
    properties: {
      schemaId: { const: "agent-orchestration-report.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      ingestionEvidenceRef: artifactRefSchema(),
      catalogRef: artifactRefSchema({ sourceEvidenceHash: true }),
      registryRef: artifactRefSchema(),
      orchestrationPlanRef: artifactRefSchema(),
      reviewQueueRef: artifactRefSchema(),
      results: { type: "array", items: resultRowSchema() },
      workOrderRefs: { type: "array", items: artifactRefSchema() },
      reviewQueueItems: { type: "array", items: reviewQueueItemSchema() },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      environment: environmentSchema(),
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentOrchestrationEvidenceSchema() {
  return {
    ...schemaBase("agent-orchestration-evidence.v0"),
    required: ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"],
    properties: {
      contractId: { const: "surfaces-p3-agent-orchestration-proof" },
      schemaId: { const: "agent-orchestration-evidence.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      checkedAt: { const: P3_TIMESTAMP },
      command: { const: "interfacectl surfaces agents proof" },
      args: {
        type: "object",
        required: ["ingestionEvidence", "catalog", "fixture", "out"],
        properties: {
          ingestionEvidence: { const: P3_INGESTION_EVIDENCE_PATH },
          catalog: { const: P3_CATALOG_PATH },
          fixture: { const: P3_FIXTURE_ROOT },
          out: { const: P3_ARTIFACT_ROOT }
        },
        unevaluatedProperties: false
      },
      environment: environmentSchema(),
      schemaClosure: { type: "array", items: artifactRefSchema({ provenance: true }), minItems: P3_SCHEMA_FILES.length },
      fixtureRefs: { type: "array", items: artifactRefSchema({ provenance: true }), minItems: p3FixturePaths().length },
      boundaryRefs: { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true, provenance: true }) },
      artifacts: { type: "array", items: artifactRefSchema({ nullableHash: true, provenance: true }), minItems: P3_ARTIFACT_PATHS.length },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      validationResults: { type: "array", items: resultRowSchema() },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function agentOrchestrationExpectationsSchema() {
  const order = p3ArtifactOrder();
  const inputs = p3FixturePaths();
  return {
    ...schemaBase("agent-orchestration-expectations.v0"),
    required: ["schemaId", "version", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"],
    properties: {
      schemaId: { const: "agent-orchestration-expectations.v0" },
      version: semverSchema(),
      fixtureRoot: { const: P3_FIXTURE_ROOT },
      artifactRoot: { const: P3_ARTIFACT_ROOT },
      schemaRoot: { const: P3_SCHEMA_ROOT },
      inputs: {
        type: "array",
        prefixItems: inputs.map((fixturePath) => ({ const: fixturePath })),
        minItems: inputs.length,
        maxItems: inputs.length
      },
      artifactOrder: {
        type: "array",
        prefixItems: order.map((artifactPath) => ({ const: artifactPath })),
        minItems: order.length,
        maxItems: order.length
      },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      expectations: {
        type: "array",
        prefixItems: P3_EXPECTATION_ROWS.map(expectationRowSchema),
        minItems: P3_EXPECTATION_ROWS.length,
        maxItems: P3_EXPECTATION_ROWS.length
      },
      runExpectation: {
        type: "object",
        required: ["status", "promotionStatus"],
        properties: {
          status: { const: "pass" },
          promotionStatus: { const: "review_required" }
        },
        unevaluatedProperties: false
      }
    },
    unevaluatedProperties: false
  };
}

function agentOrchestrationDiagnosticsSchema() {
  return {
    ...schemaBase("agent-orchestration-diagnostics.v0"),
    required: ["schemaId", "version", "diagnostics"],
    properties: {
      schemaId: { const: "agent-orchestration-diagnostics.v0" },
      version: semverSchema(),
      diagnostics: diagnosticsRegistrySchema()
    },
    $defs: {
      diagnosticCode: {
        enum: [...new Set(P3_DIAGNOSTIC_ROWS.map((row) => row.code))]
      },
      diagnostic: diagnosticObjectSchema()
    },
    xDiagnosticsRegistry: diagnosticsRegistry(),
    unevaluatedProperties: false
  };
}

function agentDefinitionSchema() {
  return {
    type: "object",
    required: ["agentId", "role", "capabilityIds", "allowedInputs", "allowedOutputs", "deniedCapabilities", "reviewRoutes", "evidenceObligations", "nonExecutable"],
    properties: {
      agentId: identifierSchema(),
      role: { type: "string", minLength: 1 },
      capabilityIds: stringArraySchema({ minItems: 1 }),
      allowedInputs: pathStringArraySchema({ minItems: 1 }),
      allowedOutputs: pathStringArraySchema({ minItems: 1 }),
      deniedCapabilities: stringArraySchema({ minItems: 1 }),
      reviewRoutes: stringArraySchema({ minItems: 1 }),
      evidenceObligations: stringArraySchema({ minItems: 1 }),
      nonExecutable: { const: true }
    },
    unevaluatedProperties: false
  };
}

function capabilityDefinitionSchema() {
  return {
    type: "object",
    required: ["capabilityId", "allowedInputClasses", "allowedOutputClasses", "allowedOutputPaths", "deniedTools", "reviewRoutes", "evidenceObligations", "nonExecutable"],
    properties: {
      capabilityId: identifierSchema(),
      allowedInputClasses: stringArraySchema({ minItems: 1 }),
      allowedOutputClasses: stringArraySchema({ minItems: 1 }),
      allowedOutputPaths: pathStringArraySchema({ minItems: 1 }),
      deniedTools: stringArraySchema({ minItems: 1 }),
      reviewRoutes: stringArraySchema({ minItems: 1 }),
      evidenceObligations: stringArraySchema({ minItems: 1 }),
      nonExecutable: { const: true }
    },
    unevaluatedProperties: false
  };
}

function planTaskSchema() {
  return {
    type: "object",
    required: ["taskId", "taskKind", "sourceFixtureRef", "requiredCapabilities", "selectedAgentIds", "dependencies", "promotionStatus", "workOrderRef", "reviewQueueRef"],
    properties: {
      taskId: identifierSchema(),
      taskKind: identifierSchema(),
      sourceFixtureRef: { type: "string", minLength: 1 },
      requiredCapabilities: stringArraySchema({ minItems: 1 }),
      selectedAgentIds: stringArraySchema({ minItems: 1 }),
      dependencies: { type: "array", items: dependencySchema() },
      promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
      workOrderRef: {
        oneOf: [
          plannedWorkOrderRefSchema(),
          { type: "null" }
        ]
      },
      reviewQueueRef: {
        oneOf: [
          forwardReviewQueueRefSchema(),
          { type: "null" }
        ]
      }
    },
    unevaluatedProperties: false
  };
}

function plannedWorkOrderRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "runId", "workOrderId", "taskId", "agentId"],
    properties: {
      path: { type: "string", pattern: "^artifacts/p3/work-order\\.[A-Za-z0-9._-]+\\.json$" },
      schemaId: { const: "agent-work-order.v0" },
      runId: { type: "string", minLength: 1 },
      workOrderId: identifierSchema(),
      taskId: identifierSchema(),
      agentId: identifierSchema()
    },
    not: { required: ["hash"] },
    unevaluatedProperties: false
  };
}

function forwardReviewQueueRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "runId", "expectedItemCount"],
    properties: {
      path: { const: `${P3_ARTIFACT_ROOT}/review-queue.json` },
      schemaId: { const: "agent-review-queue.v0" },
      runId: { type: "string", minLength: 1 },
      expectedItemCount: { type: "integer", minimum: 0 }
    },
    not: { required: ["hash"] },
    unevaluatedProperties: false
  };
}

function reviewQueueItemSchema() {
  return {
    type: "object",
    required: ["reviewItemId", "taskId", "sourceFixtureRef", "selectedAgentIds", "requiredCapabilities", "requiredReviewerRole", "suggestedAction", "diagnosticCode", "promotionStatus", "workOrderRef", "nonExecutable", "evidenceObligations", "provenance"],
    properties: {
      reviewItemId: identifierSchema(),
      taskId: identifierSchema(),
      sourceFixtureRef: { type: "string", minLength: 1 },
      selectedAgentIds: stringArraySchema({ minItems: 1 }),
      requiredCapabilities: stringArraySchema({ minItems: 1 }),
      requiredReviewerRole: { type: "string", minLength: 1 },
      suggestedAction: { type: "string", minLength: 1 },
      diagnosticCode: { const: "AGENT_REVIEW_REQUIRED" },
      promotionStatus: { const: "review_required" },
      workOrderRef: { type: "null" },
      nonExecutable: { const: true },
      evidenceObligations: stringArraySchema({ minItems: 1 }),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function resultRowSchema() {
  return {
    type: "object",
    required: ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "selectedAgentIds", "workOrderPath", "reviewQueuePath"],
    properties: {
      fixturePath: relativePathSchema(),
      kind: { enum: ["valid", "review", "invalid", "mutation"] },
      stage: { enum: ["preflight", "registry", "recruitment", "orchestration", "work-order", "review", "report", "evidence"] },
      phase: { enum: ["upstream-preflight", "registry-materialization", "recruitment-selection", "orchestration-plan", "work-order-validation", "review-routing", "orchestration-report", "orchestration-evidence"] },
      expectedResult: { enum: ["valid", "invalid", "review_required"] },
      actualResult: { enum: ["valid", "invalid", "review_required"] },
      promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
      diagnosticCodes: { type: "array", items: diagnosticCodeSchema() },
      artifactPath: relativePathSchema(),
      selectedAgentIds: { type: "array", items: { type: "string" } },
      workOrderPath: nullablePathStringSchema(),
      reviewQueuePath: nullablePathStringSchema(),
      matched: { type: "boolean" }
    },
    unevaluatedProperties: false
  };
}

function diagnosticObjectSchema() {
  return {
    type: "object",
    required: ["code", "message", "severity", "diagnosticSource", "stage", "phase", "artifactPath", "jsonPointer", "sourceRef", "validationResult", "promotionStatus", "suggestedAction"],
    properties: {
      code: diagnosticCodeSchema(),
      message: { type: "string", minLength: 1 },
      severity: { enum: ["error", "review"] },
      diagnosticSource: { type: "string", minLength: 1 },
      stage: { enum: ["preflight", "registry", "recruitment", "orchestration", "work-order", "review", "report", "evidence"] },
      phase: { enum: ["upstream-preflight", "registry-materialization", "recruitment-selection", "orchestration-plan", "work-order-validation", "review-routing", "orchestration-report", "orchestration-evidence"] },
      artifactPath: relativePathSchema(),
      jsonPointer: { type: "string", pattern: "^/" },
      sourceRef: nullableStringSchema(),
      validationResult: { enum: ["valid", "invalid", "review_required"] },
      promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
      suggestedAction: { type: "string", minLength: 1 }
    },
    allOf: P3_DIAGNOSTIC_ROWS.map((row) => ({
      if: { properties: { code: { const: row.code }, artifactPath: { const: row.artifactPath }, jsonPointer: { const: row.jsonPointer } }, required: ["code", "artifactPath", "jsonPointer"] },
      then: {
        properties: {
          message: { const: row.canonicalMessage },
          severity: { const: row.severity },
          diagnosticSource: { const: row.diagnosticSource },
          stage: { const: row.stage },
          phase: { const: row.phase },
          validationResult: { const: row.validationResult },
          promotionStatus: { const: row.promotionStatus }
        }
      }
    })),
    unevaluatedProperties: false
  };
}

function diagnosticsRegistrySchema() {
  return {
    type: "array",
    prefixItems: P3_DIAGNOSTIC_ROWS.map(diagnosticRegistryRowSchema),
    minItems: P3_DIAGNOSTIC_ROWS.length,
    maxItems: P3_DIAGNOSTIC_ROWS.length
  };
}

function diagnosticRegistryRowSchema(row) {
  return {
    type: "object",
    required: ["code", "trigger", "canonicalMessage", "severity", "diagnosticSource", "stage", "phase", "artifactPath", "jsonPointer", "sourceRef", "validationResult", "promotionStatus", "suggestedAction", "fixtureCoverage"],
    properties: {
      code: { const: row.code },
      trigger: { const: row.trigger },
      canonicalMessage: { const: row.canonicalMessage },
      severity: { const: row.severity },
      diagnosticSource: { const: row.diagnosticSource },
      stage: { const: row.stage },
      phase: { const: row.phase },
      artifactPath: { const: row.artifactPath },
      jsonPointer: { const: row.jsonPointer },
      sourceRef: row.sourceRef === null ? { type: "null" } : { const: row.sourceRef },
      validationResult: { const: row.validationResult },
      promotionStatus: { const: row.promotionStatus },
      suggestedAction: { const: row.suggestedAction },
      fixtureCoverage: { const: row.fixtureCoverage }
    },
    unevaluatedProperties: false
  };
}

function expectationRowSchema(row) {
  return {
    type: "object",
    required: ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "requiredSourceRef", "selectedAgentIds", "workOrderPath", "reviewQueuePath"],
    properties: {
      fixturePath: { const: row.fixturePath },
      kind: { const: row.kind },
      stage: { const: row.stage },
      phase: { const: row.phase },
      expectedResult: { const: row.expectedResult },
      promotionStatus: { const: row.promotionStatus },
      diagnosticCodes: exactArraySchema(row.diagnosticCodes),
      artifactPath: { const: row.artifactPath },
      jsonPointer: { const: row.jsonPointer },
      requiredSourceRef: row.requiredSourceRef === null ? { type: "null" } : { const: row.requiredSourceRef },
      selectedAgentIds: exactArraySchema(row.selectedAgentIds),
      workOrderPath: row.workOrderPath === null ? { type: "null" } : { const: row.workOrderPath },
      reviewQueuePath: row.reviewQueuePath === null ? { type: "null" } : { const: row.reviewQueuePath }
    },
    unevaluatedProperties: false
  };
}

function artifactRefSchema(options = {}) {
  const hashSchemaValue = options.nullableHash ? { oneOf: [hashSchema(), { type: "null" }] } : hashSchema();
  const required = ["path", "schemaId", "hashAlgorithm", "hash"];
  const properties = {
    path: relativePathSchema(),
    schemaId: { type: "string", minLength: 1 },
    hashAlgorithm: { const: "sha256" },
    hash: hashSchemaValue,
    sourceRef: nullableStringSchema()
  };
  if (options.sourceEvidenceHash) properties.sourceEvidenceHash = hashSchema();
  if (options.provenance) {
    properties.provenance = provenanceSchema();
    required.push("provenance");
  }
  return {
    type: "object",
    required,
    properties,
    unevaluatedProperties: false
  };
}

function pathRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "evidenceTracked"],
    properties: {
      path: relativePathSchema(),
      schemaId: { type: "string", minLength: 1 },
      evidenceTracked: { type: "boolean" }
    },
    unevaluatedProperties: false
  };
}

function outputRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "artifactClass", "evidenceTracked", "hidden"],
    properties: {
      path: relativePathSchema(),
      schemaId: { type: "string", minLength: 1 },
      artifactClass: { type: "string", minLength: 1 },
      evidenceTracked: { type: "boolean" },
      hidden: { type: "boolean" }
    },
    unevaluatedProperties: false
  };
}

function dependencySchema() {
  return {
    type: "object",
    required: ["dependencyType", "ref"],
    properties: {
      dependencyType: { enum: ["task", "artifact"] },
      ref: { type: "string", minLength: 1 }
    },
    allOf: [
      {
        if: { properties: { dependencyType: { const: "task" } }, required: ["dependencyType"] },
        then: { properties: { ref: identifierSchema() } }
      },
      {
        if: { properties: { dependencyType: { const: "artifact" } }, required: ["dependencyType"] },
        then: { properties: { ref: relativePathSchema() } }
      }
    ],
    unevaluatedProperties: false
  };
}

function inertExecutionSchema() {
  return {
    type: "object",
    required: ["authorized", "reason", "shellCommands", "toolCalls", "connectorCalls", "networkCalls", "fileEdits", "secrets", "callbacks"],
    properties: {
      authorized: { const: false },
      reason: { type: "string", minLength: 1 },
      shellCommands: emptyArraySchema(),
      toolCalls: emptyArraySchema(),
      connectorCalls: emptyArraySchema(),
      networkCalls: emptyArraySchema(),
      fileEdits: emptyArraySchema(),
      secrets: emptyArraySchema(),
      callbacks: emptyArraySchema()
    },
    unevaluatedProperties: false
  };
}

function provenanceSchema() {
  return {
    type: "object",
    required: ["generatedAt", "generator", "sourceRefs"],
    properties: {
      generatedAt: { const: P3_TIMESTAMP },
      generator: { type: "string", minLength: 1 },
      sourceRefs: stringArraySchema()
    },
    unevaluatedProperties: false
  };
}

function registryPoliciesSchema() {
  return {
    type: "object",
    required: ["recruitment", "scope", "inertBoundary", "review"],
    properties: {
      recruitment: {
        type: "object",
        required: ["selection", "tieBreakers"],
        properties: {
          selection: { const: "smallest-registered-agent-set" },
          tieBreakers: exactArraySchema(["registryOrder", "agentId", "capabilityId", "taskId"])
        },
        unevaluatedProperties: false
      },
      scope: {
        type: "object",
        required: ["allowedOutputRoot", "hiddenOutputsAllowed", "evidenceTrackedOutputsRequired"],
        properties: {
          allowedOutputRoot: { const: P3_ARTIFACT_ROOT },
          hiddenOutputsAllowed: { const: false },
          evidenceTrackedOutputsRequired: { const: true }
        },
        unevaluatedProperties: false
      },
      inertBoundary: inertBoundaryPolicySchema(),
      review: {
        type: "object",
        required: ["queuePath", "promotionStatus", "executableWorkOrders"],
        properties: {
          queuePath: { const: `${P3_ARTIFACT_ROOT}/review-queue.json` },
          promotionStatus: { const: "review_required" },
          executableWorkOrders: { const: false }
        },
        unevaluatedProperties: false
      }
    },
    unevaluatedProperties: false
  };
}

function inertBoundaryPolicySchema() {
  const disabled = {
    liveAgents: { const: false },
    shellCommands: { const: false },
    toolCalls: { const: false },
    connectorCalls: { const: false },
    networkCalls: { const: false },
    fileEdits: { const: false },
    secrets: { const: false },
    callbacks: { const: false },
    persistentReviewDecisions: { const: false }
  };
  return {
    type: "object",
    required: Object.keys(disabled),
    properties: disabled,
    unevaluatedProperties: false
  };
}

function environmentSchema() {
  return {
    type: "object",
    required: ["generatedAt", "host"],
    properties: {
      generatedAt: { const: P3_TIMESTAMP },
      host: { type: "null" }
    },
    unevaluatedProperties: false
  };
}

function exactArraySchema(values) {
  const schema = {
    type: "array",
    minItems: values.length,
    maxItems: values.length
  };
  if (values.length > 0) {
    schema.prefixItems = values.map((value) => ({ const: value }));
  }
  return schema;
}

function stringArraySchema({ minItems = 0 } = {}) {
  return {
    type: "array",
    minItems,
    items: { type: "string", minLength: 1 }
  };
}

function pathStringArraySchema({ minItems = 0 } = {}) {
  return {
    type: "array",
    minItems,
    items: relativePathSchema()
  };
}

function emptyArraySchema() {
  return {
    type: "array",
    minItems: 0,
    maxItems: 0
  };
}

function nullableStringSchema() {
  return {
    type: ["string", "null"]
  };
}

function nullablePathStringSchema() {
  return {
    oneOf: [
      relativePathSchema(),
      { type: "null" }
    ]
  };
}

function identifierSchema() {
  return {
    type: "string",
    pattern: "^[a-z][a-z0-9.-]*$"
  };
}

function diagnosticCodeSchema() {
  return {
    enum: [...new Set(P3_DIAGNOSTIC_ROWS.map((row) => row.code))]
  };
}

function hashSchema() {
  return {
    type: "string",
    pattern: "^[a-f0-9]{64}$"
  };
}

function semverSchema() {
  return {
    type: "string",
    pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
  };
}

function relativePathSchema() {
  return {
    type: "string",
    minLength: 1,
    pattern: "^(?!.*(?:^|/)\\.\\.(?:/|$))(?!.*(?:^|/)\\.(?:/|$))(?!.*//)[A-Za-z0-9._@-]+(?:/[A-Za-z0-9._@-]+)*$"
  };
}
