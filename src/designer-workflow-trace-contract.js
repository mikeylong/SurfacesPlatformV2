import path from "node:path";
import { canonicalJson } from "./p0.js";
import { deepClone, sha256Hex, writeCanonicalJson } from "./p2-contract.js";

export const DWT_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const DWT_VERSION = "0.0.0";
export const DWT_SCHEMA_ROOT = "schemas";
export const DWT_FIXTURE_ROOT = "fixtures/designer-workflow-trace";
export const DWT_ARTIFACT_ROOT = "artifacts/designer-workflow-trace";
export const DWT_COMMAND = "interfacectl surfaces designer-workflow-trace proof";
export const DWT_CONTRACT_ID = "surfaces-designer-workflow-trace-proof";
export const DWT_TARGET_ID = "designer-workflow-trace";
export const DWT_SCENARIO_ID = "p2-button-authority-to-static-handoff";
export const DWT_COMPONENT_ID = "Button";
export const DWT_REVIEW_REQUIRED_EXCEPTION_FIXTURE_PATH = "fixtures/source-conformance/review/brand-exception.source-conformance.json";
export const DWT_GOVERNED_EXCEPTION_FIXTURE_PATH = "fixtures/source-conformance/invalid/review-expired.source-conformance.json";
export const DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE = "SOURCE_REVIEW_EXPIRED";
export const DWT_REVIEW_REQUIRED_EXCEPTION_DIAGNOSTIC_CODE = "SOURCE_REVIEW_REQUIRED";

export const DWT_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const DWT_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const DWT_P2_INGESTION_REPORT_PATH = "artifacts/p2/ingestion-report.json";
export const DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH = "artifacts/source-conformance/evidence.json";
export const DWT_SOURCE_AUTHORITY_MAP_PATH = "artifacts/source-conformance/source-authority-map.json";
export const DWT_SOURCE_CONFORMANCE_REPORT_PATH = "artifacts/source-conformance/source-conformance-report.json";
export const DWT_SOURCE_REVIEW_QUEUE_PATH = "artifacts/source-conformance/source-review-queue.json";
export const DWT_P3_EVIDENCE_PATH = "artifacts/p3/evidence.json";
export const DWT_P3_REVIEW_QUEUE_PATH = "artifacts/p3/review-queue.json";
export const DWT_P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
export const DWT_P4_DECISION_LEDGER_PATH = "artifacts/p4/surfaceops-decision-ledger.json";
export const DWT_P4_REVIEW_REPORT_PATH = "artifacts/p4/review-judgment-report.json";
export const DWT_P4_EVALUATION_REPORT_PATH = "artifacts/p4/judgmentkit-evaluation-report.json";
export const DWT_PROTOCOL_EVIDENCE_PATH = "artifacts/p5/protocol/evidence.json";
export const DWT_NATIVE_EVIDENCE_PATH = "artifacts/p5/native/evidence.json";

export const DWT_ACCEPTED_P2_EVIDENCE_HASH = "d469eb7027a724c87e237b6b0e92d7526bb9a9dfee58dd47e4830bf64352a0f4";
export const DWT_ACCEPTED_P2_CATALOG_HASH = "2ba1d418bc51051bb642a0c675efbc7e16f4f315dae62674a6b6e363461c9d29";
export const DWT_ACCEPTED_P2_INGESTION_REPORT_HASH = "5db246399a04eae4ea557bd3fdaec0fd278194970feeecbd751dc0b677f64a5b";
export const DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH = "1b82591027555e15b42c4da62587b372cc62e0853ac19bad7df839dd96c40691";
export const DWT_ACCEPTED_SOURCE_AUTHORITY_MAP_HASH = "edd4e6b36373e43d2663bd761a4c114cb57a2cbfde016b703e3508f27e2366ec";
export const DWT_ACCEPTED_SOURCE_CONFORMANCE_REPORT_HASH = "3445ba2ce716524c5781f3635d2f8f113d3c61ea650a722e046476c452b36ef0";
export const DWT_ACCEPTED_SOURCE_REVIEW_QUEUE_HASH = "705dea0330212439f46f8f88044b00bfde18ed214285567b82d9f36d883dd408";
export const DWT_ACCEPTED_P3_EVIDENCE_HASH = "08c4c9e62c8643e7427b60f1ad8e48c86cfa5fced0ad1e0d3b6c3e0e5025589c";
export const DWT_ACCEPTED_P3_REVIEW_QUEUE_HASH = "aac26d2171acaaabbe27c6262d45575eac8bf08c6e6a5284c1340cec184694da";
export const DWT_ACCEPTED_P4_EVIDENCE_HASH = "a9de1573bc5c4dcd9e0d509d8b60885470a4d6cb2bfcbc0eff5ed451997d71f3";
export const DWT_ACCEPTED_P4_DECISION_LEDGER_HASH = "91dd2b08dc7c99f2ff28c6dca2862379269f0f89c7feb63a073bd51fc5f1ebb8";
export const DWT_ACCEPTED_P4_REVIEW_REPORT_HASH = "ca31dcd66c7037e0b8eff4e24ad5a41ae99497d7a44bc7a558f85bd981f32add";
export const DWT_ACCEPTED_P4_EVALUATION_REPORT_HASH = "f792803e20a7bca5e235ab332b8b264e3a284bd4d93ba1abc1227582de889243";
export const DWT_ACCEPTED_PROTOCOL_EVIDENCE_HASH = "5c374dda129f223539514f361f827072e0f5c1d73c7cab4572e7f19d74a0665a";
export const DWT_ACCEPTED_NATIVE_EVIDENCE_HASH = "8fe59fce2ab75f056a6a640656f91ddfdd30ad112b167b55dc9a9f56f6ceef75";

export const DWT_ENVIRONMENT = Object.freeze({
  generatedAt: DWT_TIMESTAMP,
  host: null
});

export const DWT_FORBIDDEN_CLAIM_KEYS = [
  "productWorkflowImplementation",
  "customerValidation",
  "productionAdoption",
  "liveSurfaceOps",
  "liveJudgmentKit",
  "liveAgentExecution",
  "toolCallExecution",
  "networkCallExecution",
  "callbackExecution",
  "secretAccess",
  "actionExecution",
  "workOrderExecution",
  "productionAdapter",
  "api",
  "sdk",
  "runtime",
  "a2ui",
  "p6",
  "p7"
];

export const DWT_TARGET_IDS = ["surfaces-protocol-static", "surfaces-native-static"];

export const DWT_WORKFLOW_STEPS = [
  "declare-design-authority",
  "compile-governed-contracts",
  "generate-inside-catalog-boundary",
  "inspect-evidence-not-pixels",
  "decide-or-revise-authority-layer",
  "hand-off-proven-target-output",
  "govern-changes-over-time"
];

export const DWT_PROTOCOL_HANDOFF_PATHS = [
  "artifacts/p5/protocol/adapter-target-selection.json",
  "artifacts/p5/protocol/protocol-projection.json",
  "artifacts/p5/protocol/protocol-envelope.button.json",
  "artifacts/p5/protocol/protocol-adapter-report.json"
];

const DWT_PROTOCOL_HANDOFF_SCHEMA_IDS = [
  "protocol-target-selection.v0",
  "protocol-projection.v0",
  "protocol-envelope.v0",
  "protocol-adapter-report.v0"
];

const DWT_PROTOCOL_HANDOFF_HASHES = [
  "5ea802849be160244aa7b5b78d27a34ab12f149933fea4e1a6a58b58525c31f1",
  "aec0791abff3883e48dbcffb753190044c878890a4e4d011c448baa4a8504c8c",
  "ee0a7d91ed18e3183745f7f828612ceb4cb3ea8ba22efb66d003e7f9b7e23e54",
  "02f35148316c2547867227ce00566e3dc054635513a9c40d3d0b189ad22d4149"
];

export const DWT_NATIVE_HANDOFF_PATHS = [
  "artifacts/p5/native/adapter-target-selection.json",
  "artifacts/p5/native/surfaces-native-projection.json",
  "artifacts/p5/native/surfaces-native-packet.button.json",
  "artifacts/p5/native/surfaces-native-report.json"
];

const DWT_NATIVE_HANDOFF_SCHEMA_IDS = [
  "surfaces-native-target-selection.v0",
  "surfaces-native-projection.v0",
  "surfaces-native-packet.v0",
  "surfaces-native-report.v0"
];

const DWT_NATIVE_HANDOFF_HASHES = [
  "18262b07078be021e41551a19cb2d2d31d59f729a57b3b3a00caf17f66e7e5ed",
  "e06918c871c0527abdcf4bbc1f992dca436cdc413fcf920153c9e91bcf7b8a7d",
  "291610db5a39c38c4ac5b0e1f965af3bd5adc54f437c12ba8c4855a819fc41e4",
  "2b8f0955175fdc5b4c763f517301e16c7a880b30664e2cb913996bf1c5094657"
];

export const DWT_REQUIRED_EVIDENCE_PATHS = [
  DWT_P2_EVIDENCE_PATH,
  DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH,
  DWT_P3_EVIDENCE_PATH,
  DWT_P4_EVIDENCE_PATH,
  DWT_PROTOCOL_EVIDENCE_PATH,
  DWT_NATIVE_EVIDENCE_PATH
];

export const DWT_REQUIRED_ARTIFACT_PATHS = [
  DWT_P2_CATALOG_PATH,
  DWT_P2_INGESTION_REPORT_PATH,
  DWT_SOURCE_AUTHORITY_MAP_PATH,
  DWT_SOURCE_CONFORMANCE_REPORT_PATH,
  DWT_SOURCE_REVIEW_QUEUE_PATH,
  DWT_P3_REVIEW_QUEUE_PATH,
  DWT_P4_DECISION_LEDGER_PATH,
  DWT_P4_REVIEW_REPORT_PATH,
  DWT_P4_EVALUATION_REPORT_PATH,
  ...DWT_PROTOCOL_HANDOFF_PATHS,
  ...DWT_NATIVE_HANDOFF_PATHS
];

export const DWT_SCHEMA_FILES = [
  "designer-workflow-trace-selection.v0.schema.json",
  "designer-workflow-trace-report.v0.schema.json",
  "designer-workflow-trace-evidence.v0.schema.json",
  "designer-workflow-trace-expectations.v0.schema.json",
  "designer-workflow-trace-diagnostics.v0.schema.json",
  "designer-workflow-trace-fixture.v0.schema.json",
  "designer-workflow-trace-preflight-mutation.v0.schema.json"
];

export const DWT_CONSUMED_SCHEMA_FILES = [
  "design-system-ingestion-evidence.v0.schema.json",
  "design-system-ingestion-diagnostics.v0.schema.json",
  "design-system-ingestion-report.v0.schema.json",
  "runtime-catalog.v0.schema.json",
  "source-conformance-evidence.v0.schema.json",
  "source-conformance-diagnostics.v0.schema.json",
  "source-authority-map.v0.schema.json",
  "source-conformance-report.v0.schema.json",
  "source-review-queue.v0.schema.json",
  "agent-orchestration-evidence.v0.schema.json",
  "agent-orchestration-diagnostics.v0.schema.json",
  "agent-review-queue.v0.schema.json",
  "review-judgment-evidence.v0.schema.json",
  "review-judgment-diagnostics.v0.schema.json",
  "surfaceops-decision-ledger.v0.schema.json",
  "review-judgment-report.v0.schema.json",
  "judgmentkit-evaluation-report.v0.schema.json",
  "protocol-adapter-evidence.v0.schema.json",
  "protocol-adapter-diagnostics.v0.schema.json",
  "surfaces-native-evidence.v0.schema.json",
  "surfaces-native-diagnostics.v0.schema.json",
  "diagnostics.v0.schema.json"
];

export const DWT_FIXTURE_FILES = [
  "trace-selection.fixture.json",
  "valid/button-authority-to-handoff.designer-workflow-trace.json",
  "review/review-required-status.designer-workflow-trace.json",
  "invalid/source-conformance-review-expired.designer-workflow-trace.json",
  "invalid/unknown-component.designer-workflow-trace.json",
  "invalid/missing-target-handoff.designer-workflow-trace.json",
  "invalid/forbidden-claim.designer-workflow-trace.json",
  "mutations/missing-upstream-evidence.designer-workflow-trace-preflight.json",
  "mutations/upstream-hash-mismatch.designer-workflow-trace-preflight.json",
  "mutations/hash-mismatch.designer-workflow-trace-evidence.json"
].map((file) => `${DWT_FIXTURE_ROOT}/${file}`);

export const DWT_GENERATED_ARTIFACTS = [
  "trace-selection.json",
  "designer-workflow-trace-report.json",
  "evidence.json"
];

export const DWT_ARTIFACT_PATHS = DWT_GENERATED_ARTIFACTS.map((file) => `${DWT_ARTIFACT_ROOT}/${file}`);

export const DWT_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "TRACE_UPSTREAM_EVIDENCE_MISSING",
    trigger: "Required designer workflow trace evidence or artifact input is missing",
    canonicalMessage: "Designer workflow trace upstream evidence is missing.",
    stage: "preflight",
    phase: "designer-workflow-trace-preflight",
    artifactPath: "fixtures/designer-workflow-trace/mutations/missing-upstream-evidence.designer-workflow-trace-preflight.json",
    jsonPointer: "/boundaryRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-upstream-evidence.designer-workflow-trace-preflight.json"
  }),
  diagnosticRow({
    code: "TRACE_UPSTREAM_EVIDENCE_HASH_MISMATCH",
    trigger: "Required designer workflow trace evidence or artifact hash does not match the accepted boundary",
    canonicalMessage: "Designer workflow trace upstream evidence or artifact hash does not match accepted evidence.",
    stage: "preflight",
    phase: "designer-workflow-trace-preflight",
    artifactPath: "fixtures/designer-workflow-trace/mutations/upstream-hash-mismatch.designer-workflow-trace-preflight.json",
    jsonPointer: "/boundaryRefs/0/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/upstream-hash-mismatch.designer-workflow-trace-preflight.json"
  }),
  diagnosticRow({
    code: "TRACE_COMPONENT_OUT_OF_SCOPE",
    trigger: "Trace fixture references a component outside the selected scenario scope",
    canonicalMessage: "Designer workflow trace fixture references a component outside the selected trace scope.",
    stage: "trace-validation",
    phase: "designer-workflow-trace-fixture",
    artifactPath: "fixtures/designer-workflow-trace/invalid/unknown-component.designer-workflow-trace.json",
    jsonPointer: "/componentId",
    sourceRef: "fixture://designer-workflow-trace/invalid/unknown-component#/componentId",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unknown-component.designer-workflow-trace.json"
  }),
  diagnosticRow({
    code: "TRACE_HANDOFF_TARGET_MISSING",
    trigger: "Trace fixture omits a required target handoff",
    canonicalMessage: "Designer workflow trace fixture omits a required target handoff.",
    stage: "target-handoff",
    phase: "designer-workflow-trace-fixture",
    artifactPath: "fixtures/designer-workflow-trace/invalid/missing-target-handoff.designer-workflow-trace.json",
    jsonPointer: "/targetIds",
    sourceRef: "fixture://designer-workflow-trace/invalid/missing-target-handoff#/targetIds",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/missing-target-handoff.designer-workflow-trace.json"
  }),
  diagnosticRow({
    code: "TRACE_REVIEW_REQUIRED_STATUS_INDEXED",
    trigger: "Trace fixture requires review-required and blocked status to remain visible in the index",
    canonicalMessage: "Designer workflow trace preserves review-required or blocked status as indexed evidence.",
    stage: "status-index",
    phase: "designer-workflow-trace-fixture",
    artifactPath: "fixtures/designer-workflow-trace/review/review-required-status.designer-workflow-trace.json",
    jsonPointer: "/requiresReviewStatus",
    sourceRef: "fixture://designer-workflow-trace/review/review-required-status#/requiresReviewStatus",
    validationResult: "review_required",
    promotionStatus: "review_required",
    fixtureCoverage: "review/review-required-status.designer-workflow-trace.json",
    severity: "review"
  }),
  diagnosticRow({
    code: "TRACE_SOURCE_CONFORMANCE_REVIEW_EXPIRED_INDEXED",
    trigger: "Trace fixture requires expired source-conformance review metadata to remain visible in the index",
    canonicalMessage: "Designer workflow trace indexes expired source-conformance review metadata as blocked evidence.",
    stage: "status-index",
    phase: "designer-workflow-trace-fixture",
    artifactPath: "fixtures/designer-workflow-trace/invalid/source-conformance-review-expired.designer-workflow-trace.json",
    jsonPointer: "/sourceConformanceReviewStatus",
    sourceRef: "fixture://designer-workflow-trace/invalid/source-conformance-review-expired#/sourceConformanceReviewStatus",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/source-conformance-review-expired.designer-workflow-trace.json"
  }),
  diagnosticRow({
    code: "TRACE_FORBIDDEN_CLAIM",
    trigger: "Trace fixture claims product workflow implementation, customer validation, production adoption, live behavior, live agent or work-order execution, A2UI, P6, or P7",
    canonicalMessage: "Designer workflow trace fixtures cannot claim product workflow implementation, customer validation, production adoption, live integrations, live agent execution, tool calls, network calls, callbacks, secrets, action execution, work-order execution, production adapters, APIs, SDKs, runtimes, A2UI, P6, or P7.",
    stage: "claim-boundary",
    phase: "designer-workflow-trace-fixture",
    artifactPath: "fixtures/designer-workflow-trace/invalid/forbidden-claim.designer-workflow-trace.json",
    jsonPointer: "/claims",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/forbidden-claim.designer-workflow-trace.json"
  }),
  diagnosticRow({
    code: "TRACE_EVIDENCE_HASH_MISMATCH",
    trigger: "Designer workflow trace evidence hash differs from generated artifacts",
    canonicalMessage: "Designer workflow trace evidence hash does not match generated artifacts.",
    stage: "evidence",
    phase: "designer-workflow-trace-evidence",
    artifactPath: "fixtures/designer-workflow-trace/mutations/hash-mismatch.designer-workflow-trace-evidence.json",
    jsonPointer: "/artifacts/0/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hash-mismatch.designer-workflow-trace-evidence.json"
  })
];

export const DWT_EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/valid/button-authority-to-handoff.designer-workflow-trace.json",
    kind: "valid",
    stage: "trace-validation",
    phase: "designer-workflow-trace-fixture",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/designer-workflow-trace/designer-workflow-trace-report.json",
    jsonPointer: "/designerWorkflowSteps"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/review/review-required-status.designer-workflow-trace.json",
    kind: "review",
    stage: "status-index",
    phase: "designer-workflow-trace-fixture",
    expectedResult: "review_required",
    promotionStatus: "review_required",
    diagnosticCodes: ["TRACE_REVIEW_REQUIRED_STATUS_INDEXED"],
    artifactPath: "artifacts/designer-workflow-trace/designer-workflow-trace-report.json",
    jsonPointer: "/evidenceStatus"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/invalid/source-conformance-review-expired.designer-workflow-trace.json",
    kind: "invalid",
    stage: "status-index",
    phase: "designer-workflow-trace-fixture",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_SOURCE_CONFORMANCE_REVIEW_EXPIRED_INDEXED"],
    artifactPath: "artifacts/designer-workflow-trace/designer-workflow-trace-report.json",
    jsonPointer: "/sourceConformanceGovernance"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/invalid/unknown-component.designer-workflow-trace.json",
    kind: "invalid",
    stage: "trace-validation",
    phase: "designer-workflow-trace-fixture",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_COMPONENT_OUT_OF_SCOPE"],
    artifactPath: "fixtures/designer-workflow-trace/invalid/unknown-component.designer-workflow-trace.json",
    jsonPointer: "/componentId"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/invalid/missing-target-handoff.designer-workflow-trace.json",
    kind: "invalid",
    stage: "target-handoff",
    phase: "designer-workflow-trace-fixture",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_HANDOFF_TARGET_MISSING"],
    artifactPath: "fixtures/designer-workflow-trace/invalid/missing-target-handoff.designer-workflow-trace.json",
    jsonPointer: "/targetIds"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/invalid/forbidden-claim.designer-workflow-trace.json",
    kind: "invalid",
    stage: "claim-boundary",
    phase: "designer-workflow-trace-fixture",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_FORBIDDEN_CLAIM"],
    artifactPath: "fixtures/designer-workflow-trace/invalid/forbidden-claim.designer-workflow-trace.json",
    jsonPointer: "/claims"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/mutations/missing-upstream-evidence.designer-workflow-trace-preflight.json",
    kind: "mutation",
    stage: "preflight",
    phase: "designer-workflow-trace-preflight",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_UPSTREAM_EVIDENCE_MISSING"],
    artifactPath: "fixtures/designer-workflow-trace/mutations/missing-upstream-evidence.designer-workflow-trace-preflight.json",
    jsonPointer: "/boundaryRefs"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/mutations/upstream-hash-mismatch.designer-workflow-trace-preflight.json",
    kind: "mutation",
    stage: "preflight",
    phase: "designer-workflow-trace-preflight",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_UPSTREAM_EVIDENCE_HASH_MISMATCH"],
    artifactPath: "fixtures/designer-workflow-trace/mutations/upstream-hash-mismatch.designer-workflow-trace-preflight.json",
    jsonPointer: "/boundaryRefs/0/hash"
  }),
  expectationRow({
    fixturePath: "fixtures/designer-workflow-trace/mutations/hash-mismatch.designer-workflow-trace-evidence.json",
    kind: "mutation",
    stage: "evidence",
    phase: "designer-workflow-trace-evidence",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["TRACE_EVIDENCE_HASH_MISMATCH"],
    artifactPath: "fixtures/designer-workflow-trace/mutations/hash-mismatch.designer-workflow-trace-evidence.json",
    jsonPointer: "/artifacts/0/hash"
  })
];

export function dwtSchemaPaths() {
  return [...DWT_SCHEMA_FILES, ...DWT_CONSUMED_SCHEMA_FILES].map((file) => `${DWT_SCHEMA_ROOT}/${file}`);
}

export function dwtOwnedSchemaPaths() {
  return DWT_SCHEMA_FILES.map((file) => `${DWT_SCHEMA_ROOT}/${file}`);
}

export function dwtConsumedSchemaPaths() {
  return DWT_CONSUMED_SCHEMA_FILES.map((file) => `${DWT_SCHEMA_ROOT}/${file}`);
}

export function dwtFixturePaths() {
  return [`${DWT_FIXTURE_ROOT}/expectations.manifest.json`, ...DWT_FIXTURE_FILES];
}

export function dwtArtifactOrder() {
  return [
    ...dwtSchemaPaths(),
    ...dwtFixturePaths(),
    ...DWT_ARTIFACT_PATHS
  ];
}

export function schemaIdForDesignerWorkflowTracePath(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (DWT_SCHEMA_FILES.includes(file) || DWT_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath.endsWith("expectations.manifest.json")) return "designer-workflow-trace-expectations.v0";
  if (artifactPath.endsWith("trace-selection.fixture.json")) return "designer-workflow-trace-selection.v0";
  if (artifactPath.endsWith(".designer-workflow-trace.json")) return "designer-workflow-trace-fixture.v0";
  if (artifactPath.endsWith(".designer-workflow-trace-preflight.json")) return "designer-workflow-trace-preflight-mutation.v0";
  if (artifactPath.endsWith("trace-selection.json")) return "designer-workflow-trace-selection.v0";
  if (artifactPath.endsWith("designer-workflow-trace-report.json")) return "designer-workflow-trace-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "designer-workflow-trace-evidence.v0";
  return null;
}

export async function materializeDesignerWorkflowTraceContract(cwd) {
  const schemas = buildDesignerWorkflowTraceSchemas();
  for (const [file, schema] of Object.entries(schemas)) {
    await writeCanonicalJson(path.join(cwd, DWT_SCHEMA_ROOT, file), schema);
  }
  const fixtures = buildDesignerWorkflowTraceFixtures();
  await writeCanonicalJson(path.join(cwd, DWT_FIXTURE_ROOT, "expectations.manifest.json"), expectationsManifest());
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, DWT_FIXTURE_ROOT, file), fixture);
  }
}

export function buildDesignerWorkflowTraceSchemas() {
  return {
    "designer-workflow-trace-selection.v0.schema.json": traceSelectionSchema(),
    "designer-workflow-trace-report.v0.schema.json": traceReportSchema(),
    "designer-workflow-trace-evidence.v0.schema.json": traceEvidenceSchema(),
    "designer-workflow-trace-expectations.v0.schema.json": traceExpectationsSchema(),
    "designer-workflow-trace-diagnostics.v0.schema.json": traceDiagnosticsSchema(),
    "designer-workflow-trace-fixture.v0.schema.json": traceFixtureSchema(),
    "designer-workflow-trace-preflight-mutation.v0.schema.json": tracePreflightMutationSchema()
  };
}

export function buildDesignerWorkflowTraceFixtures() {
  const valid = traceFixture({
    fixtureId: "button-authority-to-handoff"
  });
  const review = traceFixture({
    fixtureId: "review-required-status",
    requiresReviewStatus: true
  });
  const expiredReview = traceFixture({
    fixtureId: "source-conformance-review-expired",
    sourceConformanceReviewStatus: "expired",
    sourceConformanceReviewPath: DWT_GOVERNED_EXCEPTION_FIXTURE_PATH
  });
  return {
    "trace-selection.fixture.json": traceSelectionFixture(),
    "valid/button-authority-to-handoff.designer-workflow-trace.json": valid,
    "review/review-required-status.designer-workflow-trace.json": review,
    "invalid/source-conformance-review-expired.designer-workflow-trace.json": expiredReview,
    "invalid/unknown-component.designer-workflow-trace.json": {
      ...deepClone(valid),
      fixtureId: "unknown-component",
      componentId: "PrivateCard"
    },
    "invalid/missing-target-handoff.designer-workflow-trace.json": {
      ...deepClone(valid),
      fixtureId: "missing-target-handoff",
      targetIds: ["surfaces-protocol-static"]
    },
    "invalid/forbidden-claim.designer-workflow-trace.json": {
      ...deepClone(valid),
      fixtureId: "forbidden-claim",
      claims: Object.fromEntries(DWT_FORBIDDEN_CLAIM_KEYS.map((key) => [key, true]))
    },
    "mutations/missing-upstream-evidence.designer-workflow-trace-preflight.json": preflightMutation({
      mutation: "missing-upstream-evidence",
      boundaryRefs: []
    }),
    "mutations/upstream-hash-mismatch.designer-workflow-trace-preflight.json": preflightMutation({
      mutation: "upstream-hash-mismatch",
      boundaryRefs: defaultBoundaryRefs().map((ref, index) => index === 0 ? { ...ref, hash: "0".repeat(64) } : ref)
    }),
    "mutations/hash-mismatch.designer-workflow-trace-evidence.json": {
      contractId: DWT_CONTRACT_ID,
      schemaId: "designer-workflow-trace-evidence.v0",
      version: DWT_VERSION,
      runId: "designer-workflow-trace-mutation",
      checkedAt: DWT_TIMESTAMP,
      command: DWT_COMMAND,
      args: defaultCommandArgs(),
      environment: { ...DWT_ENVIRONMENT },
      schemaClosure: [],
      fixtureRefs: [],
      boundaryRefs: [],
      artifacts: [
        artifactRef(`${DWT_ARTIFACT_ROOT}/designer-workflow-trace-report.json`, "designer-workflow-trace-report.v0", "0".repeat(64), {
          provenance: provenance("interfacectl-designer-workflow-trace-materialize", ["fixture://designer-workflow-trace/mutations/hash-mismatch"])
        })
      ],
      diagnostics: [],
      diagnosticsRegistry: diagnosticsRegistry(),
      validationResults: [],
      status: "pass",
      promotionStatus: "blocked",
      provenance: provenance("interfacectl-designer-workflow-trace-materialize", ["fixture://designer-workflow-trace/mutations/hash-mismatch"])
    }
  };
}

export function defaultCommandArgs() {
  return {
    ingestionEvidence: DWT_P2_EVIDENCE_PATH,
    catalog: DWT_P2_CATALOG_PATH,
    ingestionReport: DWT_P2_INGESTION_REPORT_PATH,
    sourceConformanceEvidence: DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH,
    sourceAuthorityMap: DWT_SOURCE_AUTHORITY_MAP_PATH,
    sourceConformanceReport: DWT_SOURCE_CONFORMANCE_REPORT_PATH,
    sourceReviewQueue: DWT_SOURCE_REVIEW_QUEUE_PATH,
    orchestrationEvidence: DWT_P3_EVIDENCE_PATH,
    reviewQueue: DWT_P3_REVIEW_QUEUE_PATH,
    reviewEvidence: DWT_P4_EVIDENCE_PATH,
    decisionLedger: DWT_P4_DECISION_LEDGER_PATH,
    reviewReport: DWT_P4_REVIEW_REPORT_PATH,
    evaluationReport: DWT_P4_EVALUATION_REPORT_PATH,
    protocolEvidence: DWT_PROTOCOL_EVIDENCE_PATH,
    nativeEvidence: DWT_NATIVE_EVIDENCE_PATH,
    fixture: DWT_FIXTURE_ROOT,
    out: DWT_ARTIFACT_ROOT
  };
}

export function defaultBoundaryRefs() {
  return [
    artifactRef(DWT_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", DWT_ACCEPTED_P2_EVIDENCE_HASH),
    artifactRef(DWT_P2_CATALOG_PATH, "runtime-catalog.v0", DWT_ACCEPTED_P2_CATALOG_HASH, { sourceEvidenceHash: DWT_ACCEPTED_P2_EVIDENCE_HASH }),
    artifactRef(DWT_P2_INGESTION_REPORT_PATH, "design-system-ingestion-report.v0", DWT_ACCEPTED_P2_INGESTION_REPORT_HASH, { sourceEvidenceHash: DWT_ACCEPTED_P2_EVIDENCE_HASH }),
    artifactRef(DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH, "source-conformance-evidence.v0", DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH),
    artifactRef(DWT_SOURCE_AUTHORITY_MAP_PATH, "source-authority-map.v0", DWT_ACCEPTED_SOURCE_AUTHORITY_MAP_HASH, { sourceEvidenceHash: DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH }),
    artifactRef(DWT_SOURCE_CONFORMANCE_REPORT_PATH, "source-conformance-report.v0", DWT_ACCEPTED_SOURCE_CONFORMANCE_REPORT_HASH, { sourceEvidenceHash: DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH }),
    artifactRef(DWT_SOURCE_REVIEW_QUEUE_PATH, "source-review-queue.v0", DWT_ACCEPTED_SOURCE_REVIEW_QUEUE_HASH, { sourceEvidenceHash: DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH }),
    artifactRef(DWT_P3_EVIDENCE_PATH, "agent-orchestration-evidence.v0", DWT_ACCEPTED_P3_EVIDENCE_HASH),
    artifactRef(DWT_P3_REVIEW_QUEUE_PATH, "agent-review-queue.v0", DWT_ACCEPTED_P3_REVIEW_QUEUE_HASH, { sourceEvidenceHash: DWT_ACCEPTED_P3_EVIDENCE_HASH }),
    artifactRef(DWT_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", DWT_ACCEPTED_P4_EVIDENCE_HASH),
    artifactRef(DWT_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", DWT_ACCEPTED_P4_DECISION_LEDGER_HASH, { sourceEvidenceHash: DWT_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(DWT_P4_EVALUATION_REPORT_PATH, "judgmentkit-evaluation-report.v0", DWT_ACCEPTED_P4_EVALUATION_REPORT_HASH, { sourceEvidenceHash: DWT_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(DWT_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", DWT_ACCEPTED_P4_REVIEW_REPORT_HASH, { sourceEvidenceHash: DWT_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(DWT_PROTOCOL_EVIDENCE_PATH, "protocol-adapter-evidence.v0", DWT_ACCEPTED_PROTOCOL_EVIDENCE_HASH),
    artifactRef(DWT_NATIVE_EVIDENCE_PATH, "surfaces-native-evidence.v0", DWT_ACCEPTED_NATIVE_EVIDENCE_HASH)
  ];
}

export function diagnosticsRegistry() {
  return DWT_DIAGNOSTIC_ROWS.map((row) => ({ ...row }));
}

export function artifactRef(pathValue, schemaId, hash, extra = {}) {
  return {
    path: pathValue,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    sourceRef: null,
    ...extra
  };
}

function targetHandoffArtifactRef(pathValue, schemaId, hash, generator) {
  return artifactRef(pathValue, schemaId, hash, {
    provenance: {
      generatedAt: DWT_TIMESTAMP,
      generator,
      sourceRefs: [pathValue]
    }
  });
}

function targetHandoffArtifactRefs(paths, schemaIds, hashes, generator) {
  return paths.map((artifactPath, index) =>
    targetHandoffArtifactRef(artifactPath, schemaIds[index], hashes[index], generator)
  );
}

function protocolTargetHandoffArtifactRefs() {
  return targetHandoffArtifactRefs(
    DWT_PROTOCOL_HANDOFF_PATHS,
    DWT_PROTOCOL_HANDOFF_SCHEMA_IDS,
    DWT_PROTOCOL_HANDOFF_HASHES,
    "interfacectl-p5-protocol-boundary-ref"
  );
}

function nativeTargetHandoffArtifactRefs() {
  return targetHandoffArtifactRefs(
    DWT_NATIVE_HANDOFF_PATHS,
    DWT_NATIVE_HANDOFF_SCHEMA_IDS,
    DWT_NATIVE_HANDOFF_HASHES,
    "interfacectl-p5-native-boundary-ref"
  );
}

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: DWT_TIMESTAMP,
    generator,
    sourceRefs
  };
}

function expectationsManifest() {
  return {
    schemaId: "designer-workflow-trace-expectations.v0",
    version: DWT_VERSION,
    fixtureRoot: DWT_FIXTURE_ROOT,
    artifactRoot: DWT_ARTIFACT_ROOT,
    schemaRoot: DWT_SCHEMA_ROOT,
    inputs: dwtFixturePaths(),
    artifactOrder: dwtArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: DWT_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "blocked"
    }
  };
}

function traceSelectionFixture() {
  return {
    schemaId: "designer-workflow-trace-selection.v0",
    version: DWT_VERSION,
    targetId: DWT_TARGET_ID,
    scenarioId: DWT_SCENARIO_ID,
    componentScope: [DWT_COMPONENT_ID],
    targetIds: DWT_TARGET_IDS,
    workflowSteps: DWT_WORKFLOW_STEPS,
    claimStatus: "proof-only-evidence-index",
    excludedClaims: DWT_FORBIDDEN_CLAIM_KEYS,
    boundaryRefs: defaultBoundaryRefs(),
    targetHandoffRefs: [],
    traceSelectionRef: null,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-designer-workflow-trace-materialize", ["plans/product-designer-workflow-trace.md"])
  };
}

function traceFixture(overrides = {}) {
  return {
    schemaId: "designer-workflow-trace-fixture.v0",
    version: DWT_VERSION,
    fixtureId: overrides.fixtureId,
    scenarioId: overrides.scenarioId || DWT_SCENARIO_ID,
    componentId: overrides.componentId || DWT_COMPONENT_ID,
    targetIds: overrides.targetIds || DWT_TARGET_IDS,
    requiredEvidencePaths: DWT_REQUIRED_EVIDENCE_PATHS,
    requiredArtifactPaths: DWT_REQUIRED_ARTIFACT_PATHS,
    requiresReviewStatus: overrides.requiresReviewStatus === true,
    sourceConformanceReviewStatus: overrides.sourceConformanceReviewStatus || "none",
    sourceConformanceReviewPath: overrides.sourceConformanceReviewPath || null,
    claims: overrides.claims || Object.fromEntries(DWT_FORBIDDEN_CLAIM_KEYS.map((key) => [key, false])),
    provenance: provenance("interfacectl-designer-workflow-trace-materialize", [`fixture://designer-workflow-trace/${overrides.fixtureId}`])
  };
}

function preflightMutation(overrides) {
  return {
    schemaId: "designer-workflow-trace-preflight-mutation.v0",
    version: DWT_VERSION,
    command: DWT_COMMAND,
    mutation: overrides.mutation,
    status: "invalid",
    boundaryRefs: overrides.boundaryRefs,
    provenance: provenance("interfacectl-designer-workflow-trace-materialize", [`fixture://designer-workflow-trace/mutations/${overrides.mutation}`])
  };
}

function diagnosticRow(row) {
  return {
    severity: row.severity ?? "error",
    diagnosticSource: diagnosticSourceForStage(row.stage),
    suggestedAction: suggestedActionForCode(row.code),
    ...row
  };
}

function expectationRow(row) {
  return deepClone(row);
}

function diagnosticSourceForStage(stage) {
  if (stage === "preflight") return "designer-workflow-trace-preflight-validator";
  if (stage === "target-handoff") return "designer-workflow-trace-handoff-validator";
  if (stage === "status-index") return "designer-workflow-trace-status-indexer";
  if (stage === "claim-boundary") return "designer-workflow-trace-claim-boundary";
  if (stage === "evidence") return "designer-workflow-trace-evidence-validator";
  return "designer-workflow-trace-validator";
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM")) return "Restore accepted P2, source-conformance, P3, P4, protocol, and native evidence before regenerating the trace.";
  if (code.includes("COMPONENT")) return "Keep the first designer workflow trace scoped to the accepted Button catalog component.";
  if (code.includes("HANDOFF")) return "Keep both implemented static handoff targets in the trace fixture.";
  if (code.includes("REVIEW")) return "Preserve review-required and blocked statuses as indexed evidence.";
  if (code.includes("FORBIDDEN")) return "Keep the trace proof-only; add a target proof before claiming live or production behavior.";
  if (code.includes("EVIDENCE")) return "Regenerate designer workflow trace artifacts from accepted evidence.";
  return "Correct the designer workflow trace fixture and rerun the proof.";
}

function objectSchema(schemaId, properties, required, options = {}) {
  const schema = {
    type: "object",
    additionalProperties: options.additionalProperties ?? false,
    properties,
    required
  };
  if (schemaId !== null) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/designer-workflow-trace/${schemaId}.schema.json`;
  }
  return schema;
}

function artifactRefSchema(options = false) {
  const withProvenance = typeof options === "object" && options !== null ? options.provenance ?? false : options;
  const nullableHash = typeof options === "object" && options !== null ? options.nullableHash !== false : true;
  const properties = {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: nullableHash
      ? { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" }
      : { type: "string", pattern: "^[0-9a-f]{64}$" },
    sourceRef: { type: ["string", "null"] },
    sourceEvidenceHash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  };
  const required = ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"];
  if (withProvenance === true || withProvenance === "optional") {
    properties.provenance = provenanceSchema();
  }
  if (withProvenance === true) {
    required.push("provenance");
  }
  return objectSchema(null, properties, required);
}

function exactArtifactRefSchema(expectedRef) {
  return { const: expectedRef };
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: DWT_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function diagnosticObjectSchema() {
  return { oneOf: diagnosticsRegistry().map((diagnostic) => ({ const: diagnostic })) };
}

function resultRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    kind: { type: "string" },
    stage: { type: "string" },
    phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" },
    componentId: { type: ["string", "null"] },
    matched: { type: "boolean" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "componentId", "matched"]);
}

function expectationRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    kind: { type: "string" },
    stage: { type: "string" },
    phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"]);
}

function designerWorkflowStepSchema(stepId, visionStepNumber) {
  return objectSchema(null, {
    stepId: { const: stepId },
    visionStepNumber: { const: visionStepNumber },
    visionSourceRef: { const: `VISION.md#product-designer-workflow-step-${visionStepNumber}` },
    label: { type: "string" },
    designerAction: { type: "string" },
    proofTrace: { type: "string" },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    refs: {
      type: "array",
      minItems: 1,
      items: artifactRefSchema({ provenance: "optional", nullableHash: false })
    },
    traceArtifactPaths: { type: "array", minItems: 1, items: { type: "string" } },
    reportAuthority: { const: "index-only" },
    proofAuthority: { const: false },
    productAuthority: { const: false },
    productWorkflowImplementation: { const: false },
    liveSurfaceOps: { const: false },
    liveJudgmentKit: { const: false },
    productionBehavior: { const: false },
    componentId: { const: DWT_COMPONENT_ID },
    catalogSourceRef: { type: "string" },
    statusNote: { type: "string" }
  }, [
    "stepId",
    "visionStepNumber",
    "visionSourceRef",
    "label",
    "designerAction",
    "proofTrace",
    "status",
    "promotionStatus",
    "refs",
    "reportAuthority",
    "proofAuthority",
    "productAuthority",
    "productWorkflowImplementation",
    "liveSurfaceOps",
    "liveJudgmentKit",
    "productionBehavior"
  ]);
}

function evidenceStatusRowSchema() {
  return objectSchema(null, {
    label: { type: "string" },
    path: { type: "string" },
    schemaId: { type: "string" },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    hashAlgorithm: { const: "sha256" },
    hash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  }, ["label", "path", "schemaId", "status", "promotionStatus", "hashAlgorithm", "hash"]);
}

function targetHandoffArtifactSchema({ targetId, evidenceRef, artifactRefs }) {
  return objectSchema(null, {
    targetId: { const: targetId },
    evidenceRef: exactArtifactRefSchema(evidenceRef),
    artifactRefs: {
      type: "array",
      minItems: artifactRefs.length,
      maxItems: artifactRefs.length,
      prefixItems: artifactRefs.map((artifactRefRow) => exactArtifactRefSchema(artifactRefRow)),
      items: false
    },
    emittedForComponent: { const: DWT_COMPONENT_ID },
    liveBehavior: { const: false },
    handoffAllowedForGovernedException: { const: false },
    reportAuthority: { const: "index-only" }
  }, ["targetId", "evidenceRef", "artifactRefs", "emittedForComponent", "liveBehavior", "handoffAllowedForGovernedException", "reportAuthority"]);
}

function sourceConformanceGovernanceSchema() {
  return objectSchema(null, {
    status: { const: "indexed" },
    blockedFixturePath: { const: DWT_GOVERNED_EXCEPTION_FIXTURE_PATH },
    diagnosticCode: { const: DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE },
    sourceConformanceEvidenceRef: artifactRefSchema({ nullableHash: false }),
    sourceConformanceReportRef: artifactRefSchema({ nullableHash: false }),
    sourceReviewQueueRef: artifactRefSchema({ nullableHash: false }),
    exceptionLifecycle: sourceConformanceExceptionLifecycleSchema(),
    routeToAuthorityLayer: { const: true },
    targetHandoffAllowed: { const: false },
    reportAuthority: { const: "index-only" },
    proofAuthority: { const: false },
    liveSurfaceOps: { const: false },
    liveJudgmentKit: { const: false },
    actionExecution: { const: false },
    productionBehavior: { const: false }
  }, ["status", "blockedFixturePath", "diagnosticCode", "sourceConformanceEvidenceRef", "sourceConformanceReportRef", "sourceReviewQueueRef", "exceptionLifecycle", "routeToAuthorityLayer", "targetHandoffAllowed", "reportAuthority", "proofAuthority", "liveSurfaceOps", "liveJudgmentKit", "actionExecution", "productionBehavior"]);
}

function sourceConformanceExceptionLifecycleSchema() {
  return objectSchema(null, {
    status: { const: "expired-blocked" },
    reviewRequiredFixturePath: { const: DWT_REVIEW_REQUIRED_EXCEPTION_FIXTURE_PATH },
    reviewRequiredDiagnosticCode: { const: DWT_REVIEW_REQUIRED_EXCEPTION_DIAGNOSTIC_CODE },
    reviewRequiredQueueItemId: { const: "source-review-brand-exception" },
    expiredFixturePath: { const: DWT_GOVERNED_EXCEPTION_FIXTURE_PATH },
    expiredDiagnosticCode: { const: DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE },
    owner: { type: "string" },
    approvedRationale: { type: "string" },
    expiredRationale: { type: "string" },
    approvedExpiresAt: { type: "string" },
    expiredExpiresAt: { type: "string" },
    governancePolicySourceRef: { const: "declared-source://source-conformance/governance/review-policy.json#/" },
    expiredExceptionReviewQueueItemId: { type: "null" },
    expiredExceptionExecutable: { const: false },
    renewalRequiredBeforeHandoff: { const: true },
    routeToAuthorityLayer: { const: true }
  }, ["status", "reviewRequiredFixturePath", "reviewRequiredDiagnosticCode", "reviewRequiredQueueItemId", "expiredFixturePath", "expiredDiagnosticCode", "owner", "approvedRationale", "expiredRationale", "approvedExpiresAt", "expiredExpiresAt", "governancePolicySourceRef", "expiredExceptionReviewQueueItemId", "expiredExceptionExecutable", "renewalRequiredBeforeHandoff", "routeToAuthorityLayer"]);
}

function presentationLinkSchema() {
  return objectSchema(null, {
    path: { type: "string" },
    role: { const: "presentation-only" },
    proofAuthority: { const: false }
  }, ["path", "role", "proofAuthority"]);
}

function boundaryClaimsSchema() {
  return objectSchema(null, {
    excludedClaims: { const: DWT_FORBIDDEN_CLAIM_KEYS },
    reportAuthority: { const: "index-only" },
    implementedScope: { const: "non-numbered cross-cutting proof target over accepted evidence" },
    liveBehavior: { const: false },
    liveAgentExecution: { const: false },
    toolCallExecution: { const: false },
    networkCallExecution: { const: false },
    callbackExecution: { const: false },
    secretAccess: { const: false },
    actionExecution: { const: false },
    workOrderExecution: { const: false },
    productionBehavior: { const: false }
  }, ["excludedClaims", "reportAuthority", "implementedScope", "liveBehavior", "liveAgentExecution", "toolCallExecution", "networkCallExecution", "callbackExecution", "secretAccess", "actionExecution", "workOrderExecution", "productionBehavior"]);
}

function targetIdArraySchema() {
  return {
    type: "array",
    minItems: 1,
    maxItems: DWT_TARGET_IDS.length,
    uniqueItems: true,
    items: { enum: DWT_TARGET_IDS }
  };
}

function traceSelectionSchema() {
  return objectSchema("designer-workflow-trace-selection.v0", {
    schemaId: { const: "designer-workflow-trace-selection.v0" },
    version: { type: "string" },
    targetId: { const: DWT_TARGET_ID },
    scenarioId: { const: DWT_SCENARIO_ID },
    componentScope: { const: [DWT_COMPONENT_ID] },
    targetIds: { const: DWT_TARGET_IDS },
    workflowSteps: { const: DWT_WORKFLOW_STEPS },
    claimStatus: { const: "proof-only-evidence-index" },
    excludedClaims: { const: DWT_FORBIDDEN_CLAIM_KEYS },
    boundaryRefs: { const: defaultBoundaryRefs() },
    targetHandoffRefs: {
      oneOf: [
        { const: [] },
        { type: "array", minItems: 2, maxItems: 2, items: artifactRefSchema({ provenance: true, nullableHash: false }) }
      ]
    },
    traceSelectionRef: { type: ["object", "null"], additionalProperties: true },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "componentScope", "targetIds", "workflowSteps", "claimStatus", "excludedClaims", "boundaryRefs", "targetHandoffRefs", "traceSelectionRef", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function traceReportSchema() {
  return objectSchema("designer-workflow-trace-report.v0", {
    schemaId: { const: "designer-workflow-trace-report.v0" },
    version: { type: "string" },
    runId: { type: "string" },
    targetId: { const: DWT_TARGET_ID },
    scenarioId: { const: DWT_SCENARIO_ID },
    componentScope: { const: [DWT_COMPONENT_ID] },
    targetIds: { const: DWT_TARGET_IDS },
    scopeStatement: { type: "string" },
    nonAuthorityStatement: { type: "string" },
    upstreamPreflight: objectSchema(null, {
      status: { const: "pass" },
      refs: { const: defaultBoundaryRefs() }
    }, ["status", "refs"]),
    traceSelectionRef: artifactRefSchema({ nullableHash: false }),
    designerWorkflowSteps: {
      type: "array",
      minItems: DWT_WORKFLOW_STEPS.length,
      maxItems: DWT_WORKFLOW_STEPS.length,
      prefixItems: DWT_WORKFLOW_STEPS.map((stepId, index) => designerWorkflowStepSchema(stepId, index + 1)),
      items: false
    },
    evidenceStatus: {
      type: "array",
      minItems: DWT_REQUIRED_EVIDENCE_PATHS.length,
      maxItems: DWT_REQUIRED_EVIDENCE_PATHS.length,
      items: evidenceStatusRowSchema()
    },
    targetHandoffArtifacts: {
      type: "array",
      minItems: DWT_TARGET_IDS.length,
      maxItems: DWT_TARGET_IDS.length,
      prefixItems: [
        targetHandoffArtifactSchema({
          targetId: "surfaces-protocol-static",
          evidenceRef: artifactRef(DWT_PROTOCOL_EVIDENCE_PATH, "protocol-adapter-evidence.v0", DWT_ACCEPTED_PROTOCOL_EVIDENCE_HASH),
          artifactRefs: protocolTargetHandoffArtifactRefs()
        }),
        targetHandoffArtifactSchema({
          targetId: "surfaces-native-static",
          evidenceRef: artifactRef(DWT_NATIVE_EVIDENCE_PATH, "surfaces-native-evidence.v0", DWT_ACCEPTED_NATIVE_EVIDENCE_HASH),
          artifactRefs: nativeTargetHandoffArtifactRefs()
        })
      ],
      items: false
    },
    sourceConformanceGovernance: sourceConformanceGovernanceSchema(),
    presentationLinks: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: presentationLinkSchema()
    },
    boundaryClaims: boundaryClaimsSchema(),
    validationResults: {
      type: "array",
      minItems: DWT_EXPECTATION_ROWS.length,
      maxItems: DWT_EXPECTATION_ROWS.length,
      items: resultRowSchema()
    },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "runId", "targetId", "scenarioId", "componentScope", "targetIds", "scopeStatement", "nonAuthorityStatement", "upstreamPreflight", "traceSelectionRef", "designerWorkflowSteps", "evidenceStatus", "targetHandoffArtifacts", "sourceConformanceGovernance", "presentationLinks", "boundaryClaims", "validationResults", "diagnostics", "diagnosticsRegistry", "status", "promotionStatus", "provenance"]);
}

function traceEvidenceSchema() {
  return objectSchema("designer-workflow-trace-evidence.v0", {
    contractId: { const: DWT_CONTRACT_ID },
    schemaId: { const: "designer-workflow-trace-evidence.v0" },
    version: { type: "string" },
    runId: { type: "string" },
    checkedAt: { const: DWT_TIMESTAMP },
    command: { const: DWT_COMMAND },
    args: { const: defaultCommandArgs() },
    environment: { type: "object", additionalProperties: true },
    schemaClosure: { type: "array", items: artifactRefSchema({ nullableHash: false }) },
    fixtureRefs: { type: "array", items: artifactRefSchema({ nullableHash: false }) },
    boundaryRefs: { type: "array", items: artifactRefSchema({ provenance: true, nullableHash: false }) },
    artifacts: { type: "array", items: artifactRefSchema({ provenance: true, nullableHash: false }) },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    validationResults: { type: "array", items: resultRowSchema() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"]);
}

function traceExpectationsSchema() {
  return objectSchema("designer-workflow-trace-expectations.v0", {
    schemaId: { const: "designer-workflow-trace-expectations.v0" },
    version: { type: "string" },
    fixtureRoot: { const: DWT_FIXTURE_ROOT },
    artifactRoot: { const: DWT_ARTIFACT_ROOT },
    schemaRoot: { const: DWT_SCHEMA_ROOT },
    inputs: { type: "array", items: { type: "string" } },
    artifactOrder: { type: "array", items: { type: "string" } },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    expectations: { type: "array", items: expectationRowSchema() },
    runExpectation: objectSchema(null, {
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
    }, ["status", "promotionStatus"])
  }, ["schemaId", "version", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"]);
}

function traceDiagnosticsSchema() {
  return objectSchema("designer-workflow-trace-diagnostics.v0", {
    schemaId: { const: "designer-workflow-trace-diagnostics.v0" },
    version: { type: "string" },
    diagnosticsRegistry: { const: diagnosticsRegistry() }
  }, ["schemaId", "version", "diagnosticsRegistry"]);
}

function traceFixtureSchema() {
  const schema = objectSchema("designer-workflow-trace-fixture.v0", {
    schemaId: { const: "designer-workflow-trace-fixture.v0" },
    version: { type: "string" },
    fixtureId: { type: "string" },
    scenarioId: { const: DWT_SCENARIO_ID },
    componentId: { type: "string" },
    targetIds: targetIdArraySchema(),
    requiredEvidencePaths: { const: DWT_REQUIRED_EVIDENCE_PATHS },
    requiredArtifactPaths: { const: DWT_REQUIRED_ARTIFACT_PATHS },
    requiresReviewStatus: { type: "boolean" },
    sourceConformanceReviewStatus: { enum: ["none", "expired"] },
    sourceConformanceReviewPath: { type: ["string", "null"] },
    claims: claimsSchema(),
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "scenarioId", "componentId", "targetIds", "requiredEvidencePaths", "requiredArtifactPaths", "requiresReviewStatus", "sourceConformanceReviewStatus", "sourceConformanceReviewPath", "claims", "provenance"]);
  schema.allOf = [
    {
      if: {
        properties: { sourceConformanceReviewStatus: { const: "expired" } },
        required: ["sourceConformanceReviewStatus"]
      },
      then: {
        properties: { sourceConformanceReviewPath: { const: DWT_GOVERNED_EXCEPTION_FIXTURE_PATH } },
        required: ["sourceConformanceReviewPath"]
      }
    },
    {
      if: {
        properties: { sourceConformanceReviewStatus: { const: "none" } },
        required: ["sourceConformanceReviewStatus"]
      },
      then: {
        properties: { sourceConformanceReviewPath: { type: "null" } },
        required: ["sourceConformanceReviewPath"]
      }
    }
  ];
  return schema;
}

function tracePreflightMutationSchema() {
  return objectSchema("designer-workflow-trace-preflight-mutation.v0", {
    schemaId: { const: "designer-workflow-trace-preflight-mutation.v0" },
    version: { type: "string" },
    command: { const: DWT_COMMAND },
    mutation: { type: "string" },
    status: { const: "invalid" },
    boundaryRefs: { type: "array", items: artifactRefSchema() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "command", "mutation", "status", "boundaryRefs", "provenance"]);
}

function claimsSchema() {
  return objectSchema(
    null,
    Object.fromEntries(DWT_FORBIDDEN_CLAIM_KEYS.map((key) => [key, { type: "boolean" }])),
    DWT_FORBIDDEN_CLAIM_KEYS
  );
}
