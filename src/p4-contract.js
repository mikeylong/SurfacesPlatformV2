import path from "node:path";
import {
  deepClone,
  writeCanonicalJson
} from "./p2-contract.js";

export const P4_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const P4_VERSION = "0.0.0";
export const P4_SCHEMA_ROOT = "schemas";
export const P4_FIXTURE_ROOT = "fixtures/p4";
export const P4_ARTIFACT_ROOT = "artifacts/p4";
export const P4_ORCHESTRATION_EVIDENCE_PATH = "artifacts/p3/evidence.json";
export const P4_REVIEW_QUEUE_PATH = "artifacts/p3/review-queue.json";
export const P4_ORCHESTRATION_REPORT_PATH = "artifacts/p3/agent-orchestration-report.json";
export const P4_ACCEPTED_P3_EVIDENCE_HASH = "08c4c9e62c8643e7427b60f1ad8e48c86cfa5fced0ad1e0d3b6c3e0e5025589c";
export const P4_ACCEPTED_P3_REVIEW_QUEUE_HASH = "aac26d2171acaaabbe27c6262d45575eac8bf08c6e6a5284c1340cec184694da";
export const P4_ACCEPTED_P3_REPORT_HASH = "a15550b663925ffeedb30c29b217f778aa5cb4b78d50bc2ba9f3b3ce81700cfc";
export const P4_ACCEPTED_P3_REVIEW_QUEUE_RUN_ID = "p3-86e10678b81c8c15bb7deb852429f033";

export const P4_ENVIRONMENT = Object.freeze({
  generatedAt: P4_TIMESTAMP,
  host: null
});

export const P4_CONSUMED_P3_SCHEMA_FILES = [
  "agent-orchestration-evidence.v0.schema.json",
  "agent-review-queue.v0.schema.json",
  "agent-orchestration-report.v0.schema.json"
];

export const P4_SCHEMA_FILES = [
  "surfaceops-decision-ledger.v0.schema.json",
  "judgmentkit-evaluation-report.v0.schema.json",
  "review-judgment-fixture.v0.schema.json",
  "review-judgment-report.v0.schema.json",
  "review-judgment-evidence.v0.schema.json",
  "review-judgment-expectations.v0.schema.json",
  "review-judgment-diagnostics.v0.schema.json",
  "review-preflight-mutation.v0.schema.json"
];

export const P4_FIXTURE_FILES = [
  "valid/approve-reviewed-work.review-judgment.json",
  "valid/reject-unsafe-work.review-judgment.json",
  "valid/request-changes.review-judgment.json",
  "valid/evaluate-evidence-quality.review-judgment.json",
  "review/second-review-required.review-judgment.json",
  "invalid/missing-evidence-ref.review-judgment.json",
  "invalid/decision-overrides-catalog.review-judgment.json",
  "invalid/executes-work-order.review-judgment.json",
  "invalid/judgmentkit-missing-boundary-ref.review-judgment.json",
  "invalid/judgmentkit-overrides-policy.review-judgment.json",
  "invalid/hidden-decision.review-judgment.json",
  "mutations/missing-upstream-evidence.review-preflight.json",
  "mutations/failing-upstream-evidence.review-preflight.json",
  "mutations/upstream-evidence-hash-mismatch.review-preflight.json",
  "mutations/stale-upstream-evidence.review-preflight.json",
  "mutations/duplicate-decision.surfaceops-decision-ledger.json",
  "mutations/ledger-hash-mismatch.surfaceops-decision-ledger.json",
  "mutations/report-ledger-hash-mismatch.review-judgment-report.json",
  "mutations/hash-mismatch.review-judgment-evidence.json"
].map((file) => `${P4_FIXTURE_ROOT}/${file}`);

export const P4_GENERATED_ARTIFACTS = [
  "surfaceops-decision-ledger.json",
  "judgmentkit-evaluation-report.json",
  "review-judgment-report.json",
  "evidence.json"
];

export const P4_ARTIFACT_PATHS = P4_GENERATED_ARTIFACTS.map((file) => `${P4_ARTIFACT_ROOT}/${file}`);

export const P4_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "REVIEW_UPSTREAM_EVIDENCE_MISSING",
    trigger: "Command-level upstream P3 evidence input is missing",
    canonicalMessage: "P4 upstream P3 evidence input is missing.",
    severity: "error",
    diagnosticSource: "review-preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p4/mutations/missing-upstream-evidence.review-preflight.json",
    jsonPointer: "/orchestrationEvidenceRef",
    sourceRef: "fixture://p4/mutations/missing-upstream-evidence#/orchestrationEvidenceRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-upstream-evidence.review-preflight.json"
  }),
  diagnosticRow({
    code: "REVIEW_UPSTREAM_EVIDENCE_FAILED",
    trigger: "Command-level upstream P3 evidence is not passing",
    canonicalMessage: "P4 upstream P3 evidence status is not pass.",
    severity: "error",
    diagnosticSource: "review-preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p4/mutations/failing-upstream-evidence.review-preflight.json",
    jsonPointer: "/status",
    sourceRef: "fixture://p4/mutations/failing-upstream-evidence#/status",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/failing-upstream-evidence.review-preflight.json"
  }),
  diagnosticRow({
    code: "REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH",
    trigger: "Command-level upstream P3 evidence or review queue hash does not match the accepted boundary",
    canonicalMessage: "P4 upstream P3 evidence or review queue hash does not match the accepted boundary.",
    severity: "error",
    diagnosticSource: "review-preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p4/mutations/upstream-evidence-hash-mismatch.review-preflight.json",
    jsonPointer: "/boundaryRefs/0/hash",
    sourceRef: "fixture://p4/mutations/upstream-evidence-hash-mismatch#/boundaryRefs/0/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/upstream-evidence-hash-mismatch.review-preflight.json"
  }),
  diagnosticRow({
    code: "REVIEW_UPSTREAM_EVIDENCE_STALE",
    trigger: "Command-level upstream P3 evidence or review queue ref is stale or not the exact declared input",
    canonicalMessage: "P4 upstream P3 evidence boundary is stale.",
    severity: "error",
    diagnosticSource: "review-preflight-validator",
    stage: "preflight",
    phase: "upstream-preflight",
    artifactPath: "fixtures/p4/mutations/stale-upstream-evidence.review-preflight.json",
    jsonPointer: "/boundaryRefs",
    sourceRef: "fixture://p4/mutations/stale-upstream-evidence#/boundaryRefs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/stale-upstream-evidence.review-preflight.json"
  }),
  diagnosticRow({
    code: "SURFACEOPS_EVIDENCE_REF_MISSING",
    trigger: "Review decision omits required evidence or queue item refs",
    canonicalMessage: "SurfaceOps decision is missing required evidence references.",
    severity: "error",
    diagnosticSource: "surfaceops-decision-validator",
    stage: "review",
    phase: "surfaceops-decision",
    artifactPath: "fixtures/p4/invalid/missing-evidence-ref.review-judgment.json",
    jsonPointer: "/decision/evidenceRefs",
    sourceRef: "fixture://p4/invalid/missing-evidence-ref#/decision/evidenceRefs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/missing-evidence-ref.review-judgment.json"
  }),
  diagnosticRow({
    code: "SURFACEOPS_DECISION_OVERRIDE",
    trigger: "SurfaceOps decision rewrites catalog policy or upstream promotion status outside the ledger",
    canonicalMessage: "SurfaceOps decision attempts to override catalog or upstream policy.",
    severity: "error",
    diagnosticSource: "surfaceops-decision-validator",
    stage: "review",
    phase: "surfaceops-decision",
    artifactPath: "fixtures/p4/invalid/decision-overrides-catalog.review-judgment.json",
    jsonPointer: "/decision/catalogOverride",
    sourceRef: "fixture://p4/invalid/decision-overrides-catalog#/decision/catalogOverride",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/decision-overrides-catalog.review-judgment.json"
  }),
  diagnosticRow({
    code: "SURFACEOPS_EXECUTION_FORBIDDEN",
    trigger: "Review decision attempts to execute a P3 work order or invoke tools",
    canonicalMessage: "SurfaceOps decision attempts forbidden work-order execution.",
    severity: "error",
    diagnosticSource: "surfaceops-decision-validator",
    stage: "review",
    phase: "surfaceops-decision",
    artifactPath: "fixtures/p4/invalid/executes-work-order.review-judgment.json",
    jsonPointer: "/decision/execution",
    sourceRef: "fixture://p4/invalid/executes-work-order#/decision/execution",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/executes-work-order.review-judgment.json"
  }),
  diagnosticRow({
    code: "SURFACEOPS_DECISION_HIDDEN",
    trigger: "Review decision contains hidden, untracked, or non-evidence-backed state",
    canonicalMessage: "SurfaceOps decision contains hidden review state.",
    severity: "error",
    diagnosticSource: "surfaceops-decision-validator",
    stage: "review",
    phase: "surfaceops-decision",
    artifactPath: "fixtures/p4/invalid/hidden-decision.review-judgment.json",
    jsonPointer: "/decision/hiddenState",
    sourceRef: "fixture://p4/invalid/hidden-decision#/decision/hiddenState",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/hidden-decision.review-judgment.json"
  }),
  diagnosticRow({
    code: "SURFACEOPS_SECOND_REVIEW_REQUIRED",
    trigger: "Structurally valid decision requires a second reviewer",
    canonicalMessage: "SurfaceOps decision requires a second reviewer before promotion.",
    severity: "review",
    diagnosticSource: "surfaceops-decision-validator",
    stage: "review",
    phase: "surfaceops-decision",
    artifactPath: "fixtures/p4/review/second-review-required.review-judgment.json",
    jsonPointer: "/decision/secondReviewRequired",
    sourceRef: "fixture://p4/review/second-review-required#/decision/secondReviewRequired",
    validationResult: "review_required",
    promotionStatus: "review_required",
    fixtureCoverage: "review/second-review-required.review-judgment.json"
  }),
  diagnosticRow({
    code: "SURFACEOPS_DUPLICATE_DECISION",
    trigger: "SurfaceOps decision ledger contains more than one committed decision for the same P3 review item",
    canonicalMessage: "SurfaceOps decision ledger contains duplicate committed decisions for a P3 review item.",
    severity: "error",
    diagnosticSource: "surfaceops-decision-validator",
    stage: "review",
    phase: "surfaceops-decision",
    artifactPath: "fixtures/p4/mutations/duplicate-decision.surfaceops-decision-ledger.json",
    jsonPointer: "/decisions/1/reviewItemId",
    sourceRef: "fixture://p4/mutations/duplicate-decision#/decisions/1/reviewItemId",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/duplicate-decision.surfaceops-decision-ledger.json"
  }),
  diagnosticRow({
    code: "JUDGMENTKIT_EVIDENCE_REF_MISSING",
    trigger: "Judgment finding omits accepted P3 evidence or review queue boundary refs",
    canonicalMessage: "JudgmentKit finding is missing accepted P3 evidence boundary references.",
    severity: "error",
    diagnosticSource: "judgmentkit-evaluation-validator",
    stage: "judgment",
    phase: "judgmentkit-evaluation",
    artifactPath: "fixtures/p4/invalid/judgmentkit-missing-boundary-ref.review-judgment.json",
    jsonPointer: "/finding/evidenceRefs",
    sourceRef: "fixture://p4/invalid/judgmentkit-missing-boundary-ref#/finding/evidenceRefs",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/judgmentkit-missing-boundary-ref.review-judgment.json"
  }),
  diagnosticRow({
    code: "JUDGMENTKIT_POLICY_OVERRIDE",
    trigger: "Judgment finding attempts to override catalog or SurfaceOps decision authority",
    canonicalMessage: "JudgmentKit finding attempts to override review or catalog authority.",
    severity: "error",
    diagnosticSource: "judgmentkit-evaluation-validator",
    stage: "judgment",
    phase: "judgmentkit-evaluation",
    artifactPath: "fixtures/p4/invalid/judgmentkit-overrides-policy.review-judgment.json",
    jsonPointer: "/finding/authority",
    sourceRef: "fixture://p4/invalid/judgmentkit-overrides-policy#/finding/authority",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/judgmentkit-overrides-policy.review-judgment.json"
  }),
  diagnosticRow({
    code: "REVIEW_LEDGER_HASH_MISMATCH",
    trigger: "Review report or fixture references a decision ledger hash that differs from the current ledger",
    canonicalMessage: "SurfaceOps decision ledger hash does not match current proof output.",
    severity: "error",
    diagnosticSource: "review-report-validator",
    stage: "report",
    phase: "review-judgment-report",
    artifactPath: "fixtures/p4/mutations/ledger-hash-mismatch.surfaceops-decision-ledger.json",
    jsonPointer: "/integrityCheck/expectedLedgerHash",
    sourceRef: "fixture://p4/mutations/ledger-hash-mismatch#/integrityCheck/expectedLedgerHash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/ledger-hash-mismatch.surfaceops-decision-ledger.json"
  }),
  diagnosticRow({
    code: "REVIEW_REPORT_LEDGER_HASH_MISMATCH",
    trigger: "Review report references a ledger hash that differs from the current ledger",
    canonicalMessage: "Review judgment report ledger reference hash does not match current ledger.",
    severity: "error",
    diagnosticSource: "review-report-validator",
    stage: "report",
    phase: "review-judgment-report",
    artifactPath: "fixtures/p4/mutations/report-ledger-hash-mismatch.review-judgment-report.json",
    jsonPointer: "/decisionLedgerRef/hash",
    sourceRef: "fixture://p4/mutations/report-ledger-hash-mismatch#/decisionLedgerRef/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/report-ledger-hash-mismatch.review-judgment-report.json"
  }),
  diagnosticRow({
    code: "REVIEW_EVIDENCE_HASH_MISMATCH",
    trigger: "Review evidence hash differs from manifest or self-hash rule",
    canonicalMessage: "Review judgment evidence hash does not match the manifest or self-hash rule.",
    severity: "error",
    diagnosticSource: "review-evidence-validator",
    stage: "evidence",
    phase: "review-judgment-evidence",
    artifactPath: "fixtures/p4/mutations/hash-mismatch.review-judgment-evidence.json",
    jsonPointer: "/artifacts/0/hash",
    sourceRef: "fixture://p4/mutations/hash-mismatch#/artifacts/0/hash",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hash-mismatch.review-judgment-evidence.json"
  })
];

export const P4_EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: "fixtures/p4/valid/approve-reviewed-work.review-judgment.json",
    kind: "valid",
    stage: "review",
    phase: "surfaceops-decision",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/p4/surfaceops-decision-ledger.json",
    jsonPointer: "/decision/status",
    requiredSourceRef: "fixture://p4/valid/approve-reviewed-work#/decision/status",
    ledgerBehavior: "committed",
    decisionStatus: "approved",
    evaluationResult: null
  }),
  expectationRow({
    fixturePath: "fixtures/p4/valid/reject-unsafe-work.review-judgment.json",
    kind: "valid",
    stage: "review",
    phase: "surfaceops-decision",
    expectedResult: "valid",
    promotionStatus: "blocked",
    diagnosticCodes: [],
    artifactPath: "artifacts/p4/surfaceops-decision-ledger.json",
    jsonPointer: "/decision/status",
    requiredSourceRef: "fixture://p4/valid/reject-unsafe-work#/decision/status",
    ledgerBehavior: "coverage_only",
    decisionStatus: "rejected",
    evaluationResult: null
  }),
  expectationRow({
    fixturePath: "fixtures/p4/valid/request-changes.review-judgment.json",
    kind: "valid",
    stage: "review",
    phase: "surfaceops-decision",
    expectedResult: "valid",
    promotionStatus: "blocked",
    diagnosticCodes: [],
    artifactPath: "artifacts/p4/surfaceops-decision-ledger.json",
    jsonPointer: "/decision/status",
    requiredSourceRef: "fixture://p4/valid/request-changes#/decision/status",
    ledgerBehavior: "coverage_only",
    decisionStatus: "changes_requested",
    evaluationResult: null
  }),
  expectationRow({
    fixturePath: "fixtures/p4/valid/evaluate-evidence-quality.review-judgment.json",
    kind: "valid",
    stage: "judgment",
    phase: "judgmentkit-evaluation",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/p4/judgmentkit-evaluation-report.json",
    jsonPointer: "/finding/dimension",
    requiredSourceRef: "fixture://p4/valid/evaluate-evidence-quality#/finding/dimension",
    ledgerBehavior: "none",
    decisionStatus: null,
    evaluationResult: "warn"
  }),
  expectationRow({
    fixturePath: "fixtures/p4/review/second-review-required.review-judgment.json",
    kind: "review",
    stage: "review",
    phase: "surfaceops-decision",
    expectedResult: "review_required",
    promotionStatus: "review_required",
    diagnosticCodes: ["SURFACEOPS_SECOND_REVIEW_REQUIRED"],
    artifactPath: "artifacts/p4/surfaceops-decision-ledger.json",
    jsonPointer: "/decision/secondReviewRequired",
    requiredSourceRef: "fixture://p4/review/second-review-required#/decision/secondReviewRequired",
    ledgerBehavior: "coverage_only",
    decisionStatus: "deferred",
    evaluationResult: null
  }),
  ...[
    ["invalid/missing-evidence-ref.review-judgment.json", "review", "surfaceops-decision", "SURFACEOPS_EVIDENCE_REF_MISSING", "/decision/evidenceRefs", "approved", null],
    ["invalid/decision-overrides-catalog.review-judgment.json", "review", "surfaceops-decision", "SURFACEOPS_DECISION_OVERRIDE", "/decision/catalogOverride", "approved", null],
    ["invalid/executes-work-order.review-judgment.json", "review", "surfaceops-decision", "SURFACEOPS_EXECUTION_FORBIDDEN", "/decision/execution", "approved", null],
    ["invalid/judgmentkit-missing-boundary-ref.review-judgment.json", "judgment", "judgmentkit-evaluation", "JUDGMENTKIT_EVIDENCE_REF_MISSING", "/finding/evidenceRefs", null, "warn"],
    ["invalid/judgmentkit-overrides-policy.review-judgment.json", "judgment", "judgmentkit-evaluation", "JUDGMENTKIT_POLICY_OVERRIDE", "/finding/authority", null, "fail"],
    ["invalid/hidden-decision.review-judgment.json", "review", "surfaceops-decision", "SURFACEOPS_DECISION_HIDDEN", "/decision/hiddenState", "approved", null],
    ["mutations/missing-upstream-evidence.review-preflight.json", "preflight", "upstream-preflight", "REVIEW_UPSTREAM_EVIDENCE_MISSING", "/orchestrationEvidenceRef", null, null],
    ["mutations/failing-upstream-evidence.review-preflight.json", "preflight", "upstream-preflight", "REVIEW_UPSTREAM_EVIDENCE_FAILED", "/status", null, null],
    ["mutations/upstream-evidence-hash-mismatch.review-preflight.json", "preflight", "upstream-preflight", "REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH", "/boundaryRefs/0/hash", null, null],
    ["mutations/stale-upstream-evidence.review-preflight.json", "preflight", "upstream-preflight", "REVIEW_UPSTREAM_EVIDENCE_STALE", "/boundaryRefs", null, null],
    ["mutations/duplicate-decision.surfaceops-decision-ledger.json", "review", "surfaceops-decision", "SURFACEOPS_DUPLICATE_DECISION", "/decisions/1/reviewItemId", null, null],
    ["mutations/ledger-hash-mismatch.surfaceops-decision-ledger.json", "report", "review-judgment-report", "REVIEW_LEDGER_HASH_MISMATCH", "/integrityCheck/expectedLedgerHash", null, null],
    ["mutations/report-ledger-hash-mismatch.review-judgment-report.json", "report", "review-judgment-report", "REVIEW_REPORT_LEDGER_HASH_MISMATCH", "/decisionLedgerRef/hash", null, null],
    ["mutations/hash-mismatch.review-judgment-evidence.json", "evidence", "review-judgment-evidence", "REVIEW_EVIDENCE_HASH_MISMATCH", "/artifacts/0/hash", null, null]
  ].map(([file, stage, phase, code, jsonPointer, decisionStatus, evaluationResult]) => expectationRow({
    fixturePath: `${P4_FIXTURE_ROOT}/${file}`,
    kind: path.posix.dirname(file) === "mutations" ? "mutation" : path.posix.dirname(file),
    stage,
    phase,
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: [code],
    artifactPath: `${P4_FIXTURE_ROOT}/${file}`,
    jsonPointer,
    requiredSourceRef: `fixture://p4/${file.replace(/\.[^.]+(?:\.[^.]+)?$/, "").replace(".review-judgment", "").replace(".review-preflight", "").replace(".surfaceops-decision-ledger", "").replace(".review-judgment-report", "").replace(".review-judgment-evidence", "")}#${jsonPointer}`,
    ledgerBehavior: "none",
    decisionStatus,
    evaluationResult
  }))
];

export function p4SchemaPaths() {
  return P4_SCHEMA_FILES.map((file) => `${P4_SCHEMA_ROOT}/${file}`);
}

export function p4ConsumedSchemaPaths() {
  return P4_CONSUMED_P3_SCHEMA_FILES.map((file) => `${P4_SCHEMA_ROOT}/${file}`);
}

export function p4FixturePaths() {
  return [
    `${P4_FIXTURE_ROOT}/expectations.manifest.json`,
    ...P4_FIXTURE_FILES
  ];
}

export function p4ArtifactOrder() {
  return [
    ...p4SchemaPaths(),
    ...p4ConsumedSchemaPaths(),
    P4_ORCHESTRATION_EVIDENCE_PATH,
    P4_REVIEW_QUEUE_PATH,
    P4_ORCHESTRATION_REPORT_PATH,
    ...p4FixturePaths(),
    ...P4_ARTIFACT_PATHS
  ];
}

export function schemaIdForP4Path(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (P4_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (P4_CONSUMED_P3_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath === P4_ORCHESTRATION_EVIDENCE_PATH) return "agent-orchestration-evidence.v0";
  if (artifactPath === P4_REVIEW_QUEUE_PATH) return "agent-review-queue.v0";
  if (artifactPath === P4_ORCHESTRATION_REPORT_PATH) return "agent-orchestration-report.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "review-judgment-expectations.v0";
  if (artifactPath.endsWith(".review-judgment.json")) return "review-judgment-fixture.v0";
  if (artifactPath.endsWith(".review-preflight.json")) return "review-preflight-mutation.v0";
  if (artifactPath.endsWith(".surfaceops-decision-ledger.json")) return "surfaceops-decision-ledger.v0";
  if (artifactPath.endsWith(".review-judgment-report.json")) return "review-judgment-report.v0";
  if (artifactPath.endsWith(".review-judgment-evidence.json")) return "review-judgment-evidence.v0";
  if (artifactPath.endsWith("surfaceops-decision-ledger.json")) return "surfaceops-decision-ledger.v0";
  if (artifactPath.endsWith("judgmentkit-evaluation-report.json")) return "judgmentkit-evaluation-report.v0";
  if (artifactPath.endsWith("review-judgment-report.json")) return "review-judgment-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "review-judgment-evidence.v0";
  return null;
}

export async function materializeP4Contract(cwd) {
  const schemas = buildP4Schemas();
  for (const file of P4_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, P4_SCHEMA_ROOT, file), schemas[file]);
  }

  const fixtures = buildP4Fixtures();
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, P4_FIXTURE_ROOT, file), fixture);
  }
  console.log("P4 materialize: pass");
}

export function buildP4Schemas() {
  return {
    "surfaceops-decision-ledger.v0.schema.json": surfaceopsDecisionLedgerSchema(),
    "judgmentkit-evaluation-report.v0.schema.json": judgmentkitEvaluationReportSchema(),
    "review-judgment-fixture.v0.schema.json": reviewJudgmentFixtureSchema(),
    "review-judgment-report.v0.schema.json": reviewJudgmentReportSchema(),
    "review-judgment-evidence.v0.schema.json": reviewJudgmentEvidenceSchema(),
    "review-judgment-expectations.v0.schema.json": reviewJudgmentExpectationsSchema(),
    "review-judgment-diagnostics.v0.schema.json": reviewJudgmentDiagnosticsSchema(),
    "review-preflight-mutation.v0.schema.json": reviewPreflightMutationSchema()
  };
}

export function buildP4Fixtures() {
  return {
    "expectations.manifest.json": expectationsManifest(),
    "valid/approve-reviewed-work.review-judgment.json": decisionFixture({
      fixtureId: "approve-reviewed-work",
      sourceRef: "fixture://p4/valid/approve-reviewed-work#/decision/status",
      status: "approved",
      rationale: "P3 review queue item is structurally valid, evidence-backed, and remains non-executable.",
      promotionStatus: "allowed"
    }),
    "valid/reject-unsafe-work.review-judgment.json": decisionFixture({
      fixtureId: "reject-unsafe-work",
      sourceRef: "fixture://p4/valid/reject-unsafe-work#/decision/status",
      status: "rejected",
      rationale: "Reviewer rejects execution eligibility because the upstream item intentionally remains review-required.",
      promotionStatus: "blocked"
    }),
    "valid/request-changes.review-judgment.json": decisionFixture({
      fixtureId: "request-changes",
      sourceRef: "fixture://p4/valid/request-changes#/decision/status",
      status: "changes_requested",
      rationale: "Reviewer requests explicit downstream implementation proof before any future execution authority.",
      requestedChanges: ["Add later-phase execution authorization proof before consuming this queue item."],
      promotionStatus: "blocked"
    }),
    "valid/evaluate-evidence-quality.review-judgment.json": evaluationFixture({
      fixtureId: "evaluate-evidence-quality",
      sourceRef: "fixture://p4/valid/evaluate-evidence-quality#/finding/dimension",
      dimension: "evidence_quality",
      severity: "warning",
      result: "warn",
      rationale: "P3 evidence is complete enough for deterministic review while still requiring human handoff."
    }),
    "review/second-review-required.review-judgment.json": decisionFixture({
      fixtureId: "second-review-required",
      sourceRef: "fixture://p4/review/second-review-required#/decision/secondReviewRequired",
      status: "deferred",
      rationale: "Reviewer defers the queue item pending a second reviewer before downstream eligibility.",
      secondReviewRequired: true,
      promotionStatus: "review_required"
    }),
    "invalid/missing-evidence-ref.review-judgment.json": decisionFixture({
      fixtureId: "missing-evidence-ref",
      sourceRef: "fixture://p4/invalid/missing-evidence-ref#/decision/evidenceRefs",
      status: "approved",
      rationale: "Invalid fixture omits evidence refs.",
      evidenceRefs: [],
      promotionStatus: "blocked"
    }),
    "invalid/decision-overrides-catalog.review-judgment.json": decisionFixture({
      fixtureId: "decision-overrides-catalog",
      sourceRef: "fixture://p4/invalid/decision-overrides-catalog#/decision/catalogOverride",
      status: "approved",
      rationale: "Invalid fixture attempts to rewrite upstream policy.",
      catalogOverride: {
        targetPath: "artifacts/p2/governed-catalog.json",
        promotionStatus: "allowed"
      },
      promotionStatus: "blocked"
    }),
    "invalid/executes-work-order.review-judgment.json": decisionFixture({
      fixtureId: "executes-work-order",
      sourceRef: "fixture://p4/invalid/executes-work-order#/decision/execution",
      status: "approved",
      rationale: "Invalid fixture attempts work-order execution.",
      execution: {
        authorized: true,
        reason: "Invalid mutation fixture attempts execution.",
        shellCommands: ["npm run proof:p3"],
        toolCalls: [],
        connectorCalls: [],
        networkCalls: [],
        fileEdits: [],
        secrets: [],
        callbacks: []
      },
      promotionStatus: "blocked"
    }),
    "invalid/judgmentkit-missing-boundary-ref.review-judgment.json": evaluationFixture({
      fixtureId: "judgmentkit-missing-boundary-ref",
      sourceRef: "fixture://p4/invalid/judgmentkit-missing-boundary-ref#/finding/evidenceRefs",
      dimension: "evidence_quality",
      severity: "warning",
      result: "warn",
      rationale: "Invalid fixture omits the accepted P3 review queue boundary ref.",
      evidenceRefs: [
        artifactRef(P4_ORCHESTRATION_EVIDENCE_PATH, "agent-orchestration-evidence.v0", P4_ACCEPTED_P3_EVIDENCE_HASH)
      ]
    }),
    "invalid/judgmentkit-overrides-policy.review-judgment.json": evaluationFixture({
      fixtureId: "judgmentkit-overrides-policy",
      sourceRef: "fixture://p4/invalid/judgmentkit-overrides-policy#/finding/authority",
      dimension: "contract_quality",
      severity: "error",
      result: "fail",
      rationale: "Invalid fixture attempts to turn a finding into decision authority.",
      authority: {
        approves: true,
        rejects: false,
        requestsChanges: false,
        defers: false,
        routes: true,
        promotes: true,
        mutates: false,
        renders: false,
        executes: false,
        overridesPolicy: true
      }
    }),
    "invalid/hidden-decision.review-judgment.json": decisionFixture({
      fixtureId: "hidden-decision",
      sourceRef: "fixture://p4/invalid/hidden-decision#/decision/hiddenState",
      status: "approved",
      rationale: "Invalid fixture carries hidden reviewer state.",
      hiddenState: {
        privateReviewerNote: "not evidence tracked"
      },
      promotionStatus: "blocked"
    }),
    "mutations/missing-upstream-evidence.review-preflight.json": preflightMutation({
      mutation: "missing-file",
      orchestrationEvidenceRef: null
    }),
    "mutations/failing-upstream-evidence.review-preflight.json": preflightMutation({
      mutation: "status",
      status: "fail",
      orchestrationEvidenceRef: {
        path: P4_ORCHESTRATION_EVIDENCE_PATH,
        schemaId: "agent-orchestration-evidence.v0"
      }
    }),
    "mutations/upstream-evidence-hash-mismatch.review-preflight.json": preflightMutation({
      mutation: "hash-mismatch",
      boundaryRefs: [{ path: P4_REVIEW_QUEUE_PATH, hash: "0".repeat(64) }]
    }),
    "mutations/stale-upstream-evidence.review-preflight.json": preflightMutation({
      mutation: "stale-boundary",
      boundaryRefs: [{ path: "artifacts/p3/alternate-review-queue.json", hash: P4_ACCEPTED_P3_REVIEW_QUEUE_HASH }]
    }),
    "mutations/duplicate-decision.surfaceops-decision-ledger.json": duplicateDecisionLedgerMutation(),
    "mutations/ledger-hash-mismatch.surfaceops-decision-ledger.json": ledgerMutation(),
    "mutations/report-ledger-hash-mismatch.review-judgment-report.json": reportMutation(),
    "mutations/hash-mismatch.review-judgment-evidence.json": evidenceMutation()
  };
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
  if (code.includes("UPSTREAM")) return "Restore accepted P3 evidence, review queue, and report artifacts before P4 proof continues.";
  if (code.includes("SURFACEOPS")) return "Keep SurfaceOps decisions evidence-backed, ledger-only, and non-executable.";
  if (code.includes("JUDGMENTKIT")) return "Keep JudgmentKit-shaped findings evaluation-only with no decision authority.";
  if (code.includes("HASH")) return "Regenerate P4 proof artifacts from current accepted inputs.";
  return "Correct the P4 fixture or generated artifact and rerun the proof.";
}

function expectationsManifest() {
  return {
    schemaId: "review-judgment-expectations.v0",
    version: P4_VERSION,
    fixtureRoot: P4_FIXTURE_ROOT,
    artifactRoot: P4_ARTIFACT_ROOT,
    schemaRoot: P4_SCHEMA_ROOT,
    inputs: p4FixturePaths(),
    artifactOrder: p4ArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: P4_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "blocked"
    }
  };
}

export function diagnosticsRegistry() {
  return P4_DIAGNOSTIC_ROWS.map((row) => ({ ...row }));
}

function decisionFixture({
  fixtureId,
  sourceRef,
  status,
  rationale,
  requestedChanges = [],
  secondReviewRequired = false,
  evidenceRefs = defaultDecisionEvidenceRefs(),
  execution = inertReviewExecution(),
  catalogOverride = null,
  hiddenState = null,
  promotionStatus
}) {
  return {
    schemaId: "review-judgment-fixture.v0",
    version: P4_VERSION,
    fixtureId,
    fixtureKind: "surfaceops-decision",
    upstream: upstreamFixtureRefs(),
    reviewItemRef: defaultReviewItemRef(),
    reviewer: reviewerFixture("surfaceops-reviewer", sourceRef),
    decision: {
      decisionId: `decision.${fixtureId}`,
      decisionKey: `review.review-required-work#${fixtureId}`,
      reviewItemId: "review.review-required-work",
      status,
      rationale,
      requestedChanges,
      evidenceRefs,
      fixtureRef: {
        path: `${P4_FIXTURE_ROOT}/${fixturePathForId(fixtureId)}`,
        schemaId: "review-judgment-fixture.v0",
        sourceRef
      },
      secondReviewRequired,
      execution,
      catalogOverride,
      hiddenState
    },
    finding: null,
    expectedPromotionStatus: promotionStatus,
    provenance: provenance("interfacectl-p4-materialize", [sourceRef])
  };
}

function evaluationFixture({
  fixtureId,
  sourceRef,
  dimension,
  severity,
  result,
  rationale,
  evidenceRefs = defaultDecisionEvidenceRefs(),
  affectedArtifactPaths = [
    P4_ORCHESTRATION_EVIDENCE_PATH,
    P4_REVIEW_QUEUE_PATH
  ],
  authority = evaluationOnlyAuthority()
}) {
  return {
    schemaId: "review-judgment-fixture.v0",
    version: P4_VERSION,
    fixtureId,
    fixtureKind: "judgmentkit-evaluation",
    upstream: upstreamFixtureRefs(),
    reviewItemRef: defaultReviewItemRef(),
    reviewer: reviewerFixture("judgmentkit-evaluator", sourceRef),
    decision: null,
    finding: {
      findingId: `finding.${fixtureId}`,
      dimension,
      severity,
      result,
      rationale,
      evidenceRefs,
      affectedArtifactPaths,
      authority
    },
    expectedPromotionStatus: result === "fail" ? "blocked" : "allowed",
    provenance: provenance("interfacectl-p4-materialize", [sourceRef])
  };
}

function fixturePathForId(fixtureId) {
  const found = P4_FIXTURE_FILES.find((fixturePath) => fixturePath.includes(`/${fixtureId}.`));
  return found ? found.slice(`${P4_FIXTURE_ROOT}/`.length) : `${fixtureId}.review-judgment.json`;
}

function upstreamFixtureRefs() {
  return {
    orchestrationEvidenceRef: artifactRef(P4_ORCHESTRATION_EVIDENCE_PATH, "agent-orchestration-evidence.v0", P4_ACCEPTED_P3_EVIDENCE_HASH),
    reviewQueueRef: {
      ...artifactRef(P4_REVIEW_QUEUE_PATH, "agent-review-queue.v0", P4_ACCEPTED_P3_REVIEW_QUEUE_HASH),
      sourceEvidenceHash: P4_ACCEPTED_P3_EVIDENCE_HASH
    },
    orchestrationReportRef: {
      ...artifactRef(P4_ORCHESTRATION_REPORT_PATH, "agent-orchestration-report.v0", P4_ACCEPTED_P3_REPORT_HASH),
      sourceEvidenceHash: P4_ACCEPTED_P3_EVIDENCE_HASH
    }
  };
}

function defaultReviewItemRef() {
  return {
    path: P4_REVIEW_QUEUE_PATH,
    schemaId: "agent-review-queue.v0",
    runId: P4_ACCEPTED_P3_REVIEW_QUEUE_RUN_ID,
    reviewItemId: "review.review-required-work",
    taskId: "review-required-work"
  };
}

function reviewerFixture(role, sourceRef) {
  return {
    reviewerId: role,
    role,
    displayName: role === "surfaceops-reviewer" ? "SurfaceOps fixture reviewer" : "JudgmentKit fixture evaluator",
    hostUser: null,
    accountId: null,
    sourceRef
  };
}

function defaultDecisionEvidenceRefs() {
  return [
    artifactRef(P4_ORCHESTRATION_EVIDENCE_PATH, "agent-orchestration-evidence.v0", P4_ACCEPTED_P3_EVIDENCE_HASH),
    {
      ...artifactRef(P4_REVIEW_QUEUE_PATH, "agent-review-queue.v0", P4_ACCEPTED_P3_REVIEW_QUEUE_HASH),
      sourceEvidenceHash: P4_ACCEPTED_P3_EVIDENCE_HASH
    }
  ];
}

export function inertReviewExecution() {
  return {
    authorized: false,
    reason: "P4 review and judgment artifacts are deterministic proof records and authorize no work-order execution.",
    shellCommands: [],
    toolCalls: [],
    connectorCalls: [],
    networkCalls: [],
    fileEdits: [],
    secrets: [],
    callbacks: []
  };
}

export function evaluationOnlyAuthority() {
  return {
    approves: false,
    rejects: false,
    requestsChanges: false,
    defers: false,
    routes: false,
    promotes: false,
    mutates: false,
    renders: false,
    executes: false,
    overridesPolicy: false
  };
}

function preflightMutation(overrides) {
  return {
    schemaId: "review-preflight-mutation.v0",
    version: P4_VERSION,
    command: "interfacectl surfaces review proof",
    ...overrides,
    provenance: provenance("interfacectl-p4-materialize", ["plans/p4/validation-evidence.md#p3-preflight-gate"])
  };
}

function ledgerMutation() {
  return {
    schemaId: "surfaceops-decision-ledger.v0",
    version: P4_VERSION,
    runId: "p4-mutation",
    upstreamEvidenceRef: artifactRef(P4_ORCHESTRATION_EVIDENCE_PATH, "agent-orchestration-evidence.v0", P4_ACCEPTED_P3_EVIDENCE_HASH),
    reviewQueueRef: artifactRef(P4_REVIEW_QUEUE_PATH, "agent-review-queue.v0", P4_ACCEPTED_P3_REVIEW_QUEUE_HASH),
    orchestrationReportRef: artifactRef(P4_ORCHESTRATION_REPORT_PATH, "agent-orchestration-report.v0", P4_ACCEPTED_P3_REPORT_HASH),
    reviewers: [],
    decisions: [],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    integrityCheck: { expectedLedgerHash: "0".repeat(64) },
    environment: { ...P4_ENVIRONMENT },
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p4-materialize", ["fixture://p4/mutations/ledger-hash-mismatch#/integrityCheck/expectedLedgerHash"])
  };
}

function duplicateDecisionLedgerMutation() {
  const sourceRef = "fixture://p4/mutations/duplicate-decision#/decisions/1/reviewItemId";
  const reviewer = reviewerFixture("surfaceops-reviewer", sourceRef);
  const decisions = [
    duplicateDecisionRow({
      decisionId: "decision.duplicate-primary",
      decisionKey: "review.review-required-work#duplicate-primary",
      fixtureSourceRef: "fixture://p4/mutations/duplicate-decision#/decisions/0/reviewItemId",
      status: "approved",
      rationale: "Mutation fixture records the first committed decision for the queue item."
    }),
    duplicateDecisionRow({
      decisionId: "decision.duplicate-secondary",
      decisionKey: "review.review-required-work#duplicate-secondary",
      fixtureSourceRef: sourceRef,
      status: "rejected",
      rationale: "Mutation fixture records a second committed decision for the same queue item."
    })
  ];
  return {
    schemaId: "surfaceops-decision-ledger.v0",
    version: P4_VERSION,
    runId: "p4-mutation",
    upstreamEvidenceRef: artifactRef(P4_ORCHESTRATION_EVIDENCE_PATH, "agent-orchestration-evidence.v0", P4_ACCEPTED_P3_EVIDENCE_HASH),
    reviewQueueRef: {
      ...artifactRef(P4_REVIEW_QUEUE_PATH, "agent-review-queue.v0", P4_ACCEPTED_P3_REVIEW_QUEUE_HASH),
      sourceEvidenceHash: P4_ACCEPTED_P3_EVIDENCE_HASH
    },
    orchestrationReportRef: {
      ...artifactRef(P4_ORCHESTRATION_REPORT_PATH, "agent-orchestration-report.v0", P4_ACCEPTED_P3_REPORT_HASH),
      sourceEvidenceHash: P4_ACCEPTED_P3_EVIDENCE_HASH
    },
    reviewers: [reviewer],
    decisions,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    integrityCheck: null,
    environment: { ...P4_ENVIRONMENT },
    status: "pass",
    promotionStatus: "blocked",
    provenance: provenance("interfacectl-p4-materialize", [sourceRef])
  };
}

function duplicateDecisionRow({ decisionId, decisionKey, fixtureSourceRef, status, rationale }) {
  return {
    decisionId,
    decisionKey,
    reviewItemId: "review.review-required-work",
    taskId: "review-required-work",
    reviewerId: "surfaceops-reviewer",
    status,
    rationale,
    requestedChanges: [],
    evidenceRefs: defaultDecisionEvidenceRefs(),
    fixtureRef: {
      path: `${P4_FIXTURE_ROOT}/mutations/duplicate-decision.surfaceops-decision-ledger.json`,
      schemaId: "review-judgment-fixture.v0",
      sourceRef: fixtureSourceRef
    },
    secondReviewRequired: false,
    nonExecutable: true,
    execution: inertReviewExecution(),
    promotionStatus: status === "approved" ? "allowed" : "blocked",
    provenance: provenance("interfacectl-p4-materialize", [fixtureSourceRef])
  };
}

function reportMutation() {
  return {
    schemaId: "review-judgment-report.v0",
    version: P4_VERSION,
    runId: "p4-mutation",
    upstreamPreflight: {
      status: "pass",
      promotionStatus: "review_required",
      refs: []
    },
    decisionLedgerRef: artifactRef(`${P4_ARTIFACT_ROOT}/surfaceops-decision-ledger.json`, "surfaceops-decision-ledger.v0", "0".repeat(64)),
    judgmentkitEvaluationReportRef: artifactRef(`${P4_ARTIFACT_ROOT}/judgmentkit-evaluation-report.json`, "judgmentkit-evaluation-report.v0", "1".repeat(64)),
    results: [],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    generatedArtifactRefs: [],
    environment: { ...P4_ENVIRONMENT },
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p4-materialize", ["fixture://p4/mutations/report-ledger-hash-mismatch#/decisionLedgerRef/hash"])
  };
}

function evidenceMutation() {
  return {
    contractId: "surfaces-p4-review-judgment-proof",
    schemaId: "review-judgment-evidence.v0",
    version: P4_VERSION,
    runId: "p4-mutation",
    checkedAt: P4_TIMESTAMP,
    command: "interfacectl surfaces review proof",
    args: {
      orchestrationEvidence: P4_ORCHESTRATION_EVIDENCE_PATH,
      reviewQueue: P4_REVIEW_QUEUE_PATH,
      fixture: P4_FIXTURE_ROOT,
      out: P4_ARTIFACT_ROOT
    },
    environment: { ...P4_ENVIRONMENT },
    schemaClosure: [],
    fixtureRefs: [],
    boundaryRefs: [],
    artifacts: [{
      path: `${P4_ARTIFACT_ROOT}/surfaceops-decision-ledger.json`,
      schemaId: "surfaceops-decision-ledger.v0",
      hashAlgorithm: "sha256",
      hash: "0".repeat(64),
      sourceRef: null,
      provenance: provenance("interfacectl-p4-materialize", ["fixture://p4/mutations/hash-mismatch#/artifacts/0/hash"])
    }],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: [],
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p4-materialize", ["fixture://p4/mutations/hash-mismatch#/artifacts/0/hash"])
  };
}

function artifactRef(pathValue, schemaId, hash, extra = {}) {
  return {
    path: pathValue,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    sourceRef: null,
    ...extra
  };
}

function provenance(generator, sourceRefs) {
  return {
    generatedAt: P4_TIMESTAMP,
    generator,
    sourceRefs
  };
}

function schemaBase(schemaId) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://surfaces.dev/schemas/p4/${schemaId}.schema.json`,
    title: schemaId,
    schemaId,
    version: P4_VERSION,
    type: "object"
  };
}

function surfaceopsDecisionLedgerSchema() {
  return {
    ...schemaBase("surfaceops-decision-ledger.v0"),
    required: ["schemaId", "version", "runId", "upstreamEvidenceRef", "reviewQueueRef", "orchestrationReportRef", "reviewers", "decisions", "diagnostics", "diagnosticsRegistry", "integrityCheck", "environment", "status", "promotionStatus", "provenance"],
    properties: {
      schemaId: { const: "surfaceops-decision-ledger.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      upstreamEvidenceRef: artifactRefSchema(),
      reviewQueueRef: artifactRefSchema({ sourceEvidenceHash: true }),
      orchestrationReportRef: artifactRefSchema({ sourceEvidenceHash: true }),
      reviewers: { type: "array", items: reviewerSchema() },
      decisions: { type: "array", items: decisionRowSchema() },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      integrityCheck: {
        oneOf: [
          { type: "null" },
          {
            type: "object",
            required: ["expectedLedgerHash"],
            properties: { expectedLedgerHash: hashSchema() },
            unevaluatedProperties: false
          }
        ]
      },
      environment: environmentSchema(),
      status: { enum: ["pass", "fail"] },
      promotionStatus: promotionStatusSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function judgmentkitEvaluationReportSchema() {
  return {
    ...schemaBase("judgmentkit-evaluation-report.v0"),
    required: ["schemaId", "version", "runId", "upstreamEvidenceRef", "reviewQueueRef", "decisionLedgerRef", "evaluator", "dimensions", "findings", "diagnostics", "diagnosticsRegistry", "aggregateResult", "environment", "status", "promotionStatus", "provenance"],
    properties: {
      schemaId: { const: "judgmentkit-evaluation-report.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      upstreamEvidenceRef: artifactRefSchema(),
      reviewQueueRef: artifactRefSchema({ sourceEvidenceHash: true }),
      decisionLedgerRef: artifactRefSchema(),
      evaluator: reviewerSchema(),
      dimensions: exactArraySchema(["activity_fit", "contract_quality", "evidence_quality", "handoff_quality"]),
      findings: {
        type: "array",
        items: findingSchema({
          authorityMustBeFalse: true,
          acceptedP3BoundaryRefs: true
        })
      },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      aggregateResult: { enum: ["pass", "warn", "fail"] },
      environment: environmentSchema(),
      status: { enum: ["pass", "fail"] },
      promotionStatus: promotionStatusSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function reviewJudgmentFixtureSchema() {
  return {
    ...schemaBase("review-judgment-fixture.v0"),
    required: ["schemaId", "version", "fixtureId", "fixtureKind", "upstream", "reviewItemRef", "reviewer", "decision", "finding", "expectedPromotionStatus", "provenance"],
    properties: {
      schemaId: { const: "review-judgment-fixture.v0" },
      version: semverSchema(),
      fixtureId: identifierSchema(),
      fixtureKind: { enum: ["surfaceops-decision", "judgmentkit-evaluation"] },
      upstream: upstreamRefsSchema(),
      reviewItemRef: reviewItemRefSchema(),
      reviewer: reviewerSchema(),
      decision: {
        oneOf: [
          decisionFixtureSchema(),
          { type: "null" }
        ]
      },
      finding: {
        oneOf: [
          findingSchema(),
          { type: "null" }
        ]
      },
      expectedPromotionStatus: promotionStatusSchema(),
      provenance: provenanceSchema()
    },
    allOf: [
      {
        if: { properties: { fixtureKind: { const: "surfaceops-decision" } }, required: ["fixtureKind"] },
        then: { properties: { decision: decisionFixtureSchema(), finding: { type: "null" } } }
      },
      {
        if: { properties: { fixtureKind: { const: "judgmentkit-evaluation" } }, required: ["fixtureKind"] },
        then: { properties: { decision: { type: "null" }, finding: findingSchema() } }
      }
    ],
    unevaluatedProperties: false
  };
}

function reviewPreflightMutationSchema() {
  return {
    ...schemaBase("review-preflight-mutation.v0"),
    required: ["schemaId", "version", "command", "mutation", "provenance"],
    properties: {
      schemaId: { const: "review-preflight-mutation.v0" },
      version: semverSchema(),
      command: { const: "interfacectl surfaces review proof" },
      mutation: { enum: ["missing-file", "status", "hash-mismatch", "stale-boundary"] },
      orchestrationEvidenceRef: {
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
          required: ["orchestrationEvidenceRef"],
          properties: {
            orchestrationEvidenceRef: { type: "null" },
            status: false,
            boundaryRefs: false
          }
        }
      },
      {
        if: { properties: { mutation: { const: "status" } }, required: ["mutation"] },
        then: {
          required: ["orchestrationEvidenceRef", "status"],
          properties: {
            orchestrationEvidenceRef: {
              type: "object",
              required: ["path", "schemaId"],
              properties: {
                path: { const: P4_ORCHESTRATION_EVIDENCE_PATH },
                schemaId: { const: "agent-orchestration-evidence.v0" }
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
            orchestrationEvidenceRef: false,
            status: false,
            boundaryRefs: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                required: ["path", "hash"],
                properties: {
                  path: { const: P4_REVIEW_QUEUE_PATH },
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
            orchestrationEvidenceRef: false,
            status: false,
            boundaryRefs: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                required: ["path", "hash"],
                properties: {
                  path: { const: "artifacts/p3/alternate-review-queue.json" },
                  hash: { const: P4_ACCEPTED_P3_REVIEW_QUEUE_HASH }
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

function reviewJudgmentReportSchema() {
  return {
    ...schemaBase("review-judgment-report.v0"),
    required: ["schemaId", "version", "runId", "upstreamPreflight", "decisionLedgerRef", "judgmentkitEvaluationReportRef", "results", "diagnostics", "diagnosticsRegistry", "generatedArtifactRefs", "environment", "status", "promotionStatus", "provenance"],
    properties: {
      schemaId: { const: "review-judgment-report.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      upstreamPreflight: upstreamPreflightSchema(),
      decisionLedgerRef: artifactRefSchema(),
      judgmentkitEvaluationReportRef: artifactRefSchema(),
      results: { type: "array", items: resultRowSchema() },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      generatedArtifactRefs: { type: "array", items: artifactRefSchema() },
      environment: environmentSchema(),
      status: { enum: ["pass", "fail"] },
      promotionStatus: promotionStatusSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function reviewJudgmentEvidenceSchema() {
  return {
    ...schemaBase("review-judgment-evidence.v0"),
    required: ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"],
    properties: {
      contractId: { const: "surfaces-p4-review-judgment-proof" },
      schemaId: { const: "review-judgment-evidence.v0" },
      version: semverSchema(),
      runId: { type: "string", minLength: 1 },
      checkedAt: { const: P4_TIMESTAMP },
      command: { const: "interfacectl surfaces review proof" },
      args: {
        type: "object",
        required: ["orchestrationEvidence", "reviewQueue", "fixture", "out"],
        properties: {
          orchestrationEvidence: { const: P4_ORCHESTRATION_EVIDENCE_PATH },
          reviewQueue: { const: P4_REVIEW_QUEUE_PATH },
          fixture: { const: P4_FIXTURE_ROOT },
          out: { const: P4_ARTIFACT_ROOT }
        },
        unevaluatedProperties: false
      },
      environment: environmentSchema(),
      schemaClosure: { type: "array", items: artifactRefSchema(), minItems: P4_SCHEMA_FILES.length + P4_CONSUMED_P3_SCHEMA_FILES.length },
      fixtureRefs: { type: "array", items: artifactRefSchema(), minItems: p4FixturePaths().length },
      boundaryRefs: { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true, provenance: true, requireProvenance: true }) },
      artifacts: { type: "array", items: artifactRefSchema({ nullableHash: true, provenance: true }), minItems: P4_ARTIFACT_PATHS.length },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      validationResults: { type: "array", items: resultRowSchema() },
      status: { enum: ["pass", "fail"] },
      promotionStatus: promotionStatusSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function reviewJudgmentExpectationsSchema() {
  const order = p4ArtifactOrder();
  const inputs = p4FixturePaths();
  return {
    ...schemaBase("review-judgment-expectations.v0"),
    required: ["schemaId", "version", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"],
    properties: {
      schemaId: { const: "review-judgment-expectations.v0" },
      version: semverSchema(),
      fixtureRoot: { const: P4_FIXTURE_ROOT },
      artifactRoot: { const: P4_ARTIFACT_ROOT },
      schemaRoot: { const: P4_SCHEMA_ROOT },
      inputs: exactArraySchema(inputs),
      artifactOrder: exactArraySchema(order),
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      expectations: {
        type: "array",
        prefixItems: P4_EXPECTATION_ROWS.map(expectationRowSchema),
        minItems: P4_EXPECTATION_ROWS.length,
        maxItems: P4_EXPECTATION_ROWS.length
      },
      runExpectation: {
        type: "object",
        required: ["status", "promotionStatus"],
        properties: {
          status: { const: "pass" },
          promotionStatus: { const: "blocked" }
        },
        unevaluatedProperties: false
      }
    },
    unevaluatedProperties: false
  };
}

function reviewJudgmentDiagnosticsSchema() {
  return {
    ...schemaBase("review-judgment-diagnostics.v0"),
    required: ["schemaId", "version", "diagnostics"],
    properties: {
      schemaId: { const: "review-judgment-diagnostics.v0" },
      version: semverSchema(),
      diagnostics: diagnosticsRegistrySchema()
    },
    $defs: {
      diagnosticCode: {
        enum: [...new Set(P4_DIAGNOSTIC_ROWS.map((row) => row.code))]
      },
      diagnostic: diagnosticObjectSchema()
    },
    xDiagnosticsRegistry: diagnosticsRegistry(),
    unevaluatedProperties: false
  };
}

function upstreamRefsSchema() {
  return {
    type: "object",
    required: ["orchestrationEvidenceRef", "reviewQueueRef", "orchestrationReportRef"],
    properties: {
      orchestrationEvidenceRef: artifactRefSchema(),
      reviewQueueRef: artifactRefSchema({ sourceEvidenceHash: true }),
      orchestrationReportRef: artifactRefSchema({ sourceEvidenceHash: true })
    },
    unevaluatedProperties: false
  };
}

function reviewItemRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "runId", "reviewItemId", "taskId"],
    properties: {
      path: { const: P4_REVIEW_QUEUE_PATH },
      schemaId: { const: "agent-review-queue.v0" },
      runId: { type: "string", minLength: 1 },
      reviewItemId: identifierSchema(),
      taskId: identifierSchema()
    },
    unevaluatedProperties: false
  };
}

function decisionFixtureSchema() {
  return {
    type: "object",
    required: ["decisionId", "decisionKey", "reviewItemId", "status", "rationale", "requestedChanges", "evidenceRefs", "fixtureRef", "secondReviewRequired", "execution", "catalogOverride", "hiddenState"],
    properties: {
      decisionId: identifierSchema(),
      decisionKey: { type: "string", minLength: 1 },
      reviewItemId: identifierSchema(),
      status: { enum: ["approved", "rejected", "changes_requested", "deferred"] },
      rationale: { type: "string", minLength: 1, maxLength: 500 },
      requestedChanges: { type: "array", items: { type: "string", minLength: 1 }, maxItems: 8 },
      evidenceRefs: { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true }) },
      fixtureRef: fixtureRefSchema(),
      secondReviewRequired: { type: "boolean" },
      execution: executionSchema({ allowAuthorized: true }),
      catalogOverride: {
        oneOf: [
          { type: "null" },
          {
            type: "object",
            required: ["targetPath", "promotionStatus"],
            properties: {
              targetPath: relativePathSchema(),
              promotionStatus: promotionStatusSchema()
            },
            unevaluatedProperties: false
          }
        ]
      },
      hiddenState: {
        oneOf: [
          { type: "null" },
          { type: "object", minProperties: 1, additionalProperties: true }
        ]
      }
    },
    unevaluatedProperties: false
  };
}

function decisionRowSchema() {
  return {
    type: "object",
    required: ["decisionId", "decisionKey", "reviewItemId", "taskId", "reviewerId", "status", "rationale", "requestedChanges", "evidenceRefs", "fixtureRef", "secondReviewRequired", "nonExecutable", "execution", "promotionStatus", "provenance"],
    properties: {
      decisionId: identifierSchema(),
      decisionKey: { type: "string", minLength: 1 },
      reviewItemId: identifierSchema(),
      taskId: identifierSchema(),
      reviewerId: identifierSchema(),
      status: { enum: ["approved", "rejected", "changes_requested", "deferred"] },
      rationale: { type: "string", minLength: 1 },
      requestedChanges: { type: "array", items: { type: "string", minLength: 1 } },
      evidenceRefs: { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true }), minItems: 2 },
      fixtureRef: fixtureRefSchema(),
      secondReviewRequired: { type: "boolean" },
      nonExecutable: { const: true },
      execution: executionSchema({ allowAuthorized: false }),
      promotionStatus: promotionStatusSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function findingSchema({ authorityMustBeFalse = false, acceptedP3BoundaryRefs = false } = {}) {
  return {
    type: "object",
    required: ["findingId", "dimension", "severity", "result", "rationale", "evidenceRefs", "affectedArtifactPaths", "authority"],
    properties: {
      findingId: identifierSchema(),
      dimension: { enum: ["activity_fit", "contract_quality", "evidence_quality", "handoff_quality"] },
      severity: { enum: ["info", "warning", "error"] },
      result: { enum: ["pass", "warn", "fail"] },
      rationale: { type: "string", minLength: 1 },
      evidenceRefs: acceptedP3BoundaryRefs ?
        exactArtifactRefsArraySchema(defaultDecisionEvidenceRefs()) :
        { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true }), minItems: 1 },
      affectedArtifactPaths: acceptedP3BoundaryRefs ?
        exactArraySchema([P4_ORCHESTRATION_EVIDENCE_PATH, P4_REVIEW_QUEUE_PATH]) :
        { type: "array", items: relativePathSchema(), minItems: 1 },
      authority: authoritySchema({ allFalse: authorityMustBeFalse })
    },
    unevaluatedProperties: false
  };
}

function reviewerSchema() {
  return {
    type: "object",
    required: ["reviewerId", "role", "displayName", "hostUser", "accountId", "sourceRef"],
    properties: {
      reviewerId: identifierSchema(),
      role: identifierSchema(),
      displayName: { type: "string", minLength: 1 },
      hostUser: { type: "null" },
      accountId: { type: "null" },
      sourceRef: { type: "string", minLength: 1 }
    },
    unevaluatedProperties: false
  };
}

function authoritySchema({ allFalse = false } = {}) {
  const properties = {};
  for (const key of ["approves", "rejects", "requestsChanges", "defers", "routes", "promotes", "mutates", "renders", "executes", "overridesPolicy"]) {
    properties[key] = allFalse ? { const: false } : { type: "boolean" };
  }
  return {
    type: "object",
    required: Object.keys(properties),
    properties,
    unevaluatedProperties: false
  };
}

function upstreamPreflightSchema() {
  return {
    type: "object",
    required: ["status", "promotionStatus", "refs"],
    properties: {
      status: { enum: ["pass", "fail"] },
      promotionStatus: promotionStatusSchema(),
      refs: { type: "array", items: artifactRefSchema({ sourceEvidenceHash: true }) }
    },
    unevaluatedProperties: false
  };
}

function resultRowSchema() {
  return {
    type: "object",
    required: ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "decisionStatus", "evaluationResult", "matched"],
    properties: {
      fixturePath: relativePathSchema(),
      kind: { enum: ["valid", "review", "invalid", "mutation"] },
      stage: { enum: ["preflight", "review", "judgment", "report", "evidence"] },
      phase: { enum: ["upstream-preflight", "surfaceops-decision", "judgmentkit-evaluation", "review-judgment-report", "review-judgment-evidence"] },
      expectedResult: { enum: ["valid", "invalid", "review_required"] },
      actualResult: { enum: ["valid", "invalid", "review_required"] },
      promotionStatus: promotionStatusSchema(),
      diagnosticCodes: { type: "array", items: diagnosticCodeSchema() },
      artifactPath: relativePathSchema(),
      decisionStatus: {
        oneOf: [
          { enum: ["approved", "rejected", "changes_requested", "deferred"] },
          { type: "null" }
        ]
      },
      evaluationResult: {
        oneOf: [
          { enum: ["pass", "warn", "fail"] },
          { type: "null" }
        ]
      },
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
      stage: { enum: ["preflight", "review", "judgment", "report", "evidence"] },
      phase: { enum: ["upstream-preflight", "surfaceops-decision", "judgmentkit-evaluation", "review-judgment-report", "review-judgment-evidence"] },
      artifactPath: relativePathSchema(),
      jsonPointer: { type: "string", pattern: "^/" },
      sourceRef: nullableStringSchema(),
      validationResult: { enum: ["valid", "invalid", "review_required"] },
      promotionStatus: promotionStatusSchema(),
      suggestedAction: { type: "string", minLength: 1 }
    },
    allOf: P4_DIAGNOSTIC_ROWS.map((row) => ({
      if: { properties: { code: { const: row.code } }, required: ["code"] },
      then: {
        properties: {
          message: { const: row.canonicalMessage },
          severity: { const: row.severity },
          diagnosticSource: { const: row.diagnosticSource },
          stage: { const: row.stage },
          phase: { const: row.phase },
          artifactPath: { const: row.artifactPath },
          jsonPointer: { const: row.jsonPointer },
          sourceRef: row.sourceRef === null ? { type: "null" } : { const: row.sourceRef },
          validationResult: { const: row.validationResult },
          promotionStatus: { const: row.promotionStatus },
          suggestedAction: { const: row.suggestedAction }
        }
      }
    })),
    unevaluatedProperties: false
  };
}

function diagnosticsRegistrySchema() {
  return {
    type: "array",
    prefixItems: P4_DIAGNOSTIC_ROWS.map(diagnosticRegistryRowSchema),
    minItems: P4_DIAGNOSTIC_ROWS.length,
    maxItems: P4_DIAGNOSTIC_ROWS.length
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
    required: ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "requiredSourceRef", "ledgerBehavior", "decisionStatus", "evaluationResult"],
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
      ledgerBehavior: { const: row.ledgerBehavior },
      decisionStatus: row.decisionStatus === null ? { type: "null" } : { const: row.decisionStatus },
      evaluationResult: row.evaluationResult === null ? { type: "null" } : { const: row.evaluationResult }
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
    if (options.requireProvenance) required.push("provenance");
  }
  return {
    type: "object",
    required,
    properties,
    unevaluatedProperties: false
  };
}

function exactArtifactRefsArraySchema(refs) {
  return {
    type: "array",
    prefixItems: refs.map(exactArtifactRefSchema),
    minItems: refs.length,
    maxItems: refs.length
  };
}

function exactArtifactRefSchema(ref) {
  const properties = {};
  for (const [key, value] of Object.entries(ref)) {
    properties[key] = value === null ? { type: "null" } : { const: value };
  }
  return {
    type: "object",
    required: Object.keys(ref),
    properties,
    unevaluatedProperties: false
  };
}

function fixtureRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "sourceRef"],
    properties: {
      path: relativePathSchema(),
      schemaId: { const: "review-judgment-fixture.v0" },
      sourceRef: { type: "string", minLength: 1 }
    },
    unevaluatedProperties: false
  };
}

function executionSchema({ allowAuthorized }) {
  const authorizedSchema = allowAuthorized ? { type: "boolean" } : { const: false };
  const payloadKeys = ["shellCommands", "toolCalls", "connectorCalls", "networkCalls", "fileEdits", "secrets", "callbacks"];
  const payloadArraySchema = (emptyOnly) => ({
    type: "array",
    items: { type: "string" },
    ...(emptyOnly ? { maxItems: 0 } : {})
  });
  const payloadProperties = Object.fromEntries(payloadKeys.map((key) => [key, payloadArraySchema(!allowAuthorized)]));
  return {
    type: "object",
    required: ["authorized", "reason", "shellCommands", "toolCalls", "connectorCalls", "networkCalls", "fileEdits", "secrets", "callbacks"],
    properties: {
      authorized: authorizedSchema,
      reason: { type: "string", minLength: 1 },
      ...payloadProperties
    },
    allOf: [
      {
        if: { properties: { authorized: { const: false } }, required: ["authorized"] },
        then: {
          properties: Object.fromEntries(payloadKeys.map((key) => [key, payloadArraySchema(true)]))
        }
      }
    ],
    unevaluatedProperties: false
  };
}

function provenanceSchema() {
  return {
    type: "object",
    required: ["generatedAt", "generator", "sourceRefs"],
    properties: {
      generatedAt: { const: P4_TIMESTAMP },
      generator: { type: "string", minLength: 1 },
      sourceRefs: { type: "array", items: { type: "string", minLength: 1 } }
    },
    unevaluatedProperties: false
  };
}

function environmentSchema() {
  return {
    type: "object",
    required: ["generatedAt", "host"],
    properties: {
      generatedAt: { const: P4_TIMESTAMP },
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

function nullableStringSchema() {
  return {
    type: ["string", "null"]
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
    enum: [...new Set(P4_DIAGNOSTIC_ROWS.map((row) => row.code))]
  };
}

function promotionStatusSchema() {
  return {
    enum: ["allowed", "blocked", "review_required"]
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
