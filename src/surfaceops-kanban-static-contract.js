import path from "node:path";
import { canonicalJson } from "./p0.js";
import { deepClone, sha256Hex, writeCanonicalJson } from "./p2-contract.js";

export const SK_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SK_VERSION = "0.0.0";
export const SK_SCHEMA_ROOT = "schemas";
export const SK_SOURCE_ROOT = "sources/surfaceops-kanban-static";
export const SK_FIXTURE_ROOT = "fixtures/surfaceops-kanban-static";
export const SK_ARTIFACT_ROOT = "artifacts/surfaceops-kanban-static";
export const SK_COMMAND = "interfacectl surfaces surfaceops-kanban-static proof";
export const SK_CONTRACT_ID = "surfaceops-kanban-static-proof";
export const SK_TARGET_ID = "surfaceops-kanban-static";
export const SK_TARGET_KIND = "surfaceops-owned-static-kanban-projection";
export const SK_SCENARIO_ID = "p3-p4-review-work-to-static-board";

export const SK_P3_EVIDENCE_PATH = "artifacts/p3/evidence.json";
export const SK_P3_REVIEW_QUEUE_PATH = "artifacts/p3/review-queue.json";
export const SK_P3_ORCHESTRATION_REPORT_PATH = "artifacts/p3/agent-orchestration-report.json";
export const SK_P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
export const SK_P4_DECISION_LEDGER_PATH = "artifacts/p4/surfaceops-decision-ledger.json";
export const SK_P4_REVIEW_REPORT_PATH = "artifacts/p4/review-judgment-report.json";
export const SK_P4_EVALUATION_REPORT_PATH = "artifacts/p4/judgmentkit-evaluation-report.json";
export const SK_SUBSTRATE_MANIFEST_PATH = `${SK_SOURCE_ROOT}/kanban-substrate-manifest.json`;
export const SK_SUBSTRATE_PATH = `${SK_SOURCE_ROOT}/kanban-board-substrate.json`;

export const SK_ACCEPTED_P3_EVIDENCE_HASH = "08c4c9e62c8643e7427b60f1ad8e48c86cfa5fced0ad1e0d3b6c3e0e5025589c";
export const SK_ACCEPTED_P3_REVIEW_QUEUE_HASH = "aac26d2171acaaabbe27c6262d45575eac8bf08c6e6a5284c1340cec184694da";
export const SK_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH = "a15550b663925ffeedb30c29b217f778aa5cb4b78d50bc2ba9f3b3ce81700cfc";
export const SK_ACCEPTED_P4_EVIDENCE_HASH = "a9de1573bc5c4dcd9e0d509d8b60885470a4d6cb2bfcbc0eff5ed451997d71f3";
export const SK_ACCEPTED_P4_DECISION_LEDGER_HASH = "91dd2b08dc7c99f2ff28c6dca2862379269f0f89c7feb63a073bd51fc5f1ebb8";
export const SK_ACCEPTED_P4_REVIEW_REPORT_HASH = "ca31dcd66c7037e0b8eff4e24ad5a41ae99497d7a44bc7a558f85bd981f32add";
export const SK_ACCEPTED_P4_EVALUATION_REPORT_HASH = "f792803e20a7bca5e235ab332b8b264e3a284bd4d93ba1abc1227582de889243";

export const SK_ENVIRONMENT = Object.freeze({
  generatedAt: SK_TIMESTAMP,
  host: null
});

export const SK_SCHEMA_FILES = [
  "surfaceops-kanban-target-selection.v0.schema.json",
  "kanban-board-substrate-manifest.v0.schema.json",
  "kanban-board-substrate.v0.schema.json",
  "surfaceops-kanban-board-projection.v0.schema.json",
  "surfaceops-kanban-designer-view-model.v0.schema.json",
  "surfaceops-kanban-board-packet.v0.schema.json",
  "surfaceops-kanban-adapter-report.v0.schema.json",
  "surfaceops-kanban-evidence.v0.schema.json",
  "surfaceops-kanban-expectations.v0.schema.json",
  "surfaceops-kanban-diagnostics.v0.schema.json",
  "surfaceops-kanban-preflight-mutation.v0.schema.json",
  "surfaceops-kanban-fixture.v0.schema.json"
];

export const SK_CONSUMED_SCHEMA_FILES = [
  "agent-orchestration-evidence.v0.schema.json",
  "agent-review-queue.v0.schema.json",
  "agent-orchestration-report.v0.schema.json",
  "review-judgment-evidence.v0.schema.json",
  "surfaceops-decision-ledger.v0.schema.json",
  "review-judgment-report.v0.schema.json",
  "judgmentkit-evaluation-report.v0.schema.json",
  "diagnostics.v0.schema.json"
];

export const SK_FIXTURE_FILES = [
  "expectations.manifest.json",
  "surfaceops-kanban-target-selection.fixture.json",
  "valid/p3-review-queue-to-board.surfaceops-kanban.json",
  "valid/p4-decisions-to-board-packet.surfaceops-kanban.json",
  "valid/judgment-findings-to-card-annotations.surfaceops-kanban.json",
  "valid/designer-view-model.surfaceops-kanban.json",
  "review/deferred-decision-remains-review-required.surfaceops-kanban.json",
  "invalid/target-undeclared.surfaceops-kanban.json",
  "invalid/target-out-of-scope.surfaceops-kanban.json",
  "invalid/authority-override.surfaceops-kanban.json",
  "invalid/missing-evidence-ref.surfaceops-kanban.json",
  "invalid/hidden-review-state.surfaceops-kanban.json",
  "invalid/live-kanban-write.surfaceops-kanban.json",
  "invalid/live-surfaceops-write.surfaceops-kanban.json",
  "invalid/live-judgmentkit-call.surfaceops-kanban.json",
  "invalid/executes-work-order.surfaceops-kanban.json",
  "invalid/network-call.surfaceops-kanban.json",
  "invalid/secret-ref.surfaceops-kanban.json",
  "invalid/production-adapter-claim.surfaceops-kanban.json",
  "invalid/a2ui-claim.surfaceops-kanban.json",
  "invalid/unsupported-substrate.surfaceops-kanban.json",
  "mutations/missing-p3-evidence.surfaceops-kanban-preflight.json",
  "mutations/failing-p3-evidence.surfaceops-kanban-preflight.json",
  "mutations/p3-evidence-hash-mismatch.surfaceops-kanban-preflight.json",
  "mutations/missing-p4-evidence.surfaceops-kanban-preflight.json",
  "mutations/failing-p4-evidence.surfaceops-kanban-preflight.json",
  "mutations/p4-evidence-hash-mismatch.surfaceops-kanban-preflight.json",
  "mutations/missing-kanban-substrate-manifest.surfaceops-kanban-preflight.json",
  "mutations/missing-kanban-substrate.surfaceops-kanban-preflight.json",
  "mutations/kanban-substrate-hash-mismatch.surfaceops-kanban-preflight.json",
  "mutations/malformed-kanban-substrate.surfaceops-kanban-preflight.json",
  "mutations/projection-hash-mismatch.surfaceops-kanban.json",
  "mutations/report-packet-hash-mismatch.surfaceops-kanban.json",
  "mutations/hash-mismatch.surfaceops-kanban-evidence.json"
].map((file) => `${SK_FIXTURE_ROOT}/${file}`);

export const SK_GENERATED_ARTIFACTS = [
  "surfaceops-kanban-target-selection.json",
  "surfaceops-kanban-board-projection.json",
  "surfaceops-kanban-designer-view-model.json",
  "surfaceops-kanban-board-packet.review-work.json",
  "surfaceops-kanban-board-packet.decisions.json",
  "surfaceops-kanban-adapter-report.json",
  "evidence.json"
];

export const SK_ARTIFACT_PATHS = SK_GENERATED_ARTIFACTS.map((file) => `${SK_ARTIFACT_ROOT}/${file}`);

export const SK_FORBIDDEN_CLAIM_KEYS = [
  "liveKanbanWrite",
  "liveSurfaceOpsWrite",
  "liveJudgmentKitCall",
  "execution",
  "networkCall",
  "secretAccess",
  "productionAdapter",
  "api",
  "sdk",
  "a2ui",
  "persistence",
  "bidirectionalSync",
  "webhook",
  "runtimeAdapter"
];

export const SK_DIAGNOSTIC_ROWS = [
  diagnosticRow("SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_MISSING", "Required P3 or P4 upstream evidence or artifact input is missing.", "preflight", "mutations/missing-p3-evidence.surfaceops-kanban-preflight.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_FAILED", "Required P3 or P4 upstream evidence is not passing.", "preflight", "mutations/failing-p3-evidence.surfaceops-kanban-preflight.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH", "Upstream evidence or artifact hash does not match the accepted boundary.", "preflight", "mutations/p3-evidence-hash-mismatch.surfaceops-kanban-preflight.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_SUBSTRATE_MISSING", "Kanban substrate manifest or contract input is missing.", "preflight", "mutations/missing-kanban-substrate.surfaceops-kanban-preflight.json", "/substrateRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_SUBSTRATE_HASH_MISMATCH", "Kanban substrate hash does not match the manifest or accepted boundary.", "preflight", "mutations/kanban-substrate-hash-mismatch.surfaceops-kanban-preflight.json", "/substrateRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_SUBSTRATE_INVALID", "Kanban substrate contract is malformed or unsupported.", "preflight", "mutations/malformed-kanban-substrate.surfaceops-kanban-preflight.json", "/substrateRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_SUBSTRATE_UNSUPPORTED", "Kanban substrate declares unsupported live or authority behavior.", "projection", "invalid/unsupported-substrate.surfaceops-kanban.json", "/claims"),
  diagnosticRow("SURFACEOPS_KANBAN_TARGET_UNDECLARED", "SurfaceOps kanban target is not declared.", "target-selection", "invalid/target-undeclared.surfaceops-kanban.json", "/targetId"),
  diagnosticRow("SURFACEOPS_KANBAN_TARGET_OUT_OF_SCOPE", "SurfaceOps kanban target exceeds the accepted static board scope.", "target-selection", "invalid/target-out-of-scope.surfaceops-kanban.json", "/boardScope"),
  diagnosticRow("SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE", "Kanban projection must not override Surfaces authority.", "projection", "invalid/authority-override.surfaceops-kanban.json", "/authority"),
  diagnosticRow("SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING", "Kanban projection row is missing evidence refs.", "projection", "invalid/missing-evidence-ref.surfaceops-kanban.json", "/evidenceRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_HIDDEN_REVIEW_STATE", "Kanban projection must not hide review state outside evidence-backed fields.", "projection", "invalid/hidden-review-state.surfaceops-kanban.json", "/hiddenReviewState"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN", "Live kanban writes are forbidden in the static proof.", "projection", "invalid/live-kanban-write.surfaceops-kanban.json", "/claims/liveKanbanWrite"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_SURFACEOPS_FORBIDDEN", "Live SurfaceOps behavior is forbidden in the static proof.", "projection", "invalid/live-surfaceops-write.surfaceops-kanban.json", "/claims/liveSurfaceOpsWrite"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_JUDGMENTKIT_FORBIDDEN", "Live JudgmentKit behavior is forbidden in the static proof.", "projection", "invalid/live-judgmentkit-call.surfaceops-kanban.json", "/claims/liveJudgmentKitCall"),
  diagnosticRow("SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN", "Work-order execution is forbidden in the static proof.", "projection", "invalid/executes-work-order.surfaceops-kanban.json", "/claims/execution"),
  diagnosticRow("SURFACEOPS_KANBAN_NETWORK_FORBIDDEN", "Network behavior is forbidden in the static proof.", "projection", "invalid/network-call.surfaceops-kanban.json", "/claims/networkCall"),
  diagnosticRow("SURFACEOPS_KANBAN_SECRET_FORBIDDEN", "Secret access is forbidden in the static proof.", "projection", "invalid/secret-ref.surfaceops-kanban.json", "/claims/secretAccess"),
  diagnosticRow("SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN", "Production adapter claims are forbidden in the static proof.", "projection", "invalid/production-adapter-claim.surfaceops-kanban.json", "/claims/productionAdapter"),
  diagnosticRow("SURFACEOPS_KANBAN_A2UI_FORBIDDEN", "A2UI support is forbidden without a separate proof.", "projection", "invalid/a2ui-claim.surfaceops-kanban.json", "/claims/a2ui"),
  diagnosticRow("SURFACEOPS_KANBAN_PROJECTION_HASH_MISMATCH", "Board projection hash does not match generated artifacts.", "projection", "mutations/projection-hash-mismatch.surfaceops-kanban.json", "/projectionRef/hash"),
  diagnosticRow("SURFACEOPS_KANBAN_REPORT_HASH_MISMATCH", "Adapter report or packet hash does not match generated artifacts.", "report", "mutations/report-packet-hash-mismatch.surfaceops-kanban.json", "/packetRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH", "Evidence hash closure does not match generated artifacts.", "evidence", "mutations/hash-mismatch.surfaceops-kanban-evidence.json", "/artifacts"),
  diagnosticRow("SURFACEOPS_KANBAN_REVIEW_REQUIRED", "Review remains required because no committed allowed decision is present.", "projection", "review/deferred-decision-remains-review-required.surfaceops-kanban.json", "/cards/0/laneId", {
    severity: "review",
    validationResult: "review_required",
    promotionStatus: "review_required"
  })
];

export const SK_EXPECTATION_ROWS = [
  expectation("valid/p3-review-queue-to-board.surfaceops-kanban.json", "valid", "allowed", []),
  expectation("valid/p4-decisions-to-board-packet.surfaceops-kanban.json", "valid", "allowed", []),
  expectation("valid/judgment-findings-to-card-annotations.surfaceops-kanban.json", "valid", "allowed", []),
  expectation("valid/designer-view-model.surfaceops-kanban.json", "valid", "allowed", []),
  expectation("review/deferred-decision-remains-review-required.surfaceops-kanban.json", "review_required", "review_required", ["SURFACEOPS_KANBAN_REVIEW_REQUIRED"]),
  expectation("invalid/target-undeclared.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_TARGET_UNDECLARED"]),
  expectation("invalid/target-out-of-scope.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_TARGET_OUT_OF_SCOPE"]),
  expectation("invalid/authority-override.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE"]),
  expectation("invalid/missing-evidence-ref.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING"]),
  expectation("invalid/hidden-review-state.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_HIDDEN_REVIEW_STATE"]),
  expectation("invalid/live-kanban-write.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN"]),
  expectation("invalid/live-surfaceops-write.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_SURFACEOPS_FORBIDDEN"]),
  expectation("invalid/live-judgmentkit-call.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_JUDGMENTKIT_FORBIDDEN"]),
  expectation("invalid/executes-work-order.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN"]),
  expectation("invalid/network-call.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_NETWORK_FORBIDDEN"]),
  expectation("invalid/secret-ref.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_SECRET_FORBIDDEN"]),
  expectation("invalid/production-adapter-claim.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN"]),
  expectation("invalid/a2ui-claim.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_A2UI_FORBIDDEN"]),
  expectation("invalid/unsupported-substrate.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_SUBSTRATE_UNSUPPORTED"]),
  expectation("mutations/missing-p3-evidence.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_MISSING"]),
  expectation("mutations/failing-p3-evidence.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_FAILED"]),
  expectation("mutations/p3-evidence-hash-mismatch.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/missing-p4-evidence.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_MISSING"]),
  expectation("mutations/failing-p4-evidence.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_UPSTREAM_EVIDENCE_FAILED"]),
  expectation("mutations/p4-evidence-hash-mismatch.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/missing-kanban-substrate-manifest.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_SUBSTRATE_MISSING"]),
  expectation("mutations/missing-kanban-substrate.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_SUBSTRATE_MISSING"]),
  expectation("mutations/kanban-substrate-hash-mismatch.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_SUBSTRATE_HASH_MISMATCH"]),
  expectation("mutations/malformed-kanban-substrate.surfaceops-kanban-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_SUBSTRATE_INVALID"]),
  expectation("mutations/projection-hash-mismatch.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_PROJECTION_HASH_MISMATCH"]),
  expectation("mutations/report-packet-hash-mismatch.surfaceops-kanban.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_REPORT_HASH_MISMATCH"]),
  expectation("mutations/hash-mismatch.surfaceops-kanban-evidence.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH"])
];

export const SK_ACCEPTED_SUBSTRATE_HASH = sha256Hex(canonicalJson(buildKanbanBoardSubstrate()));
export const SK_ACCEPTED_SUBSTRATE_MANIFEST_HASH = sha256Hex(canonicalJson(buildKanbanSubstrateManifest(SK_ACCEPTED_SUBSTRATE_HASH)));

export async function materializeSurfaceopsKanbanStaticContract(cwd) {
  const schemas = buildSurfaceopsKanbanStaticSchemas();
  for (const file of SK_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, SK_SCHEMA_ROOT, file), schemas[file]);
  }
  await writeCanonicalJson(path.join(cwd, SK_SUBSTRATE_PATH), buildKanbanBoardSubstrate());
  await writeCanonicalJson(path.join(cwd, SK_SUBSTRATE_MANIFEST_PATH), buildKanbanSubstrateManifest(SK_ACCEPTED_SUBSTRATE_HASH));
  const fixtures = buildSurfaceopsKanbanStaticFixtures();
  for (const [file, fixture] of fixtures.entries()) {
    await writeCanonicalJson(path.join(cwd, SK_FIXTURE_ROOT, file), fixture);
  }
}

export function buildSurfaceopsKanbanStaticFixtures() {
  const fixtures = new Map();
  fixtures.set("expectations.manifest.json", buildExpectationsManifest());
  fixtures.set("surfaceops-kanban-target-selection.fixture.json", buildTargetSelectionFixture());
  for (const row of SK_EXPECTATION_ROWS) {
    const fixturePath = row.fixturePath.slice(`${SK_FIXTURE_ROOT}/`.length);
    fixtures.set(fixturePath, buildFixture(row));
  }
  return fixtures;
}

export function buildKanbanBoardSubstrate() {
  return {
    schemaId: "kanban-board-substrate.v0",
    version: SK_VERSION,
    substrateId: "kanban.cards/static-board.v0",
    substrateName: "kanban.cards static board substrate",
    upstreamProject: {
      name: "kanban.cards",
      role: "collaboration-board-substrate",
      sourceControl: "external-upstream",
      modificationPolicy: "do-not-modify-upstream-source"
    },
    supportedBoardKinds: ["review-governance"],
    lanes: [
      { laneId: "allowed", title: "Allowed", result: "allowed" },
      { laneId: "review-required", title: "Review Required", result: "review_required" },
      { laneId: "blocked", title: "Blocked", result: "blocked" }
    ],
    cardFields: [
      "cardId",
      "title",
      "laneId",
      "taskId",
      "reviewItemId",
      "queuePromotionStatus",
      "decisionStatus",
      "decisionPromotionStatus",
      "nonExecutable",
      "evidenceRefs"
    ],
    packetKinds: ["review-work", "decisions"],
    capabilities: {
      liveKanbanWrite: false,
      liveSurfaceOpsWrite: false,
      liveJudgmentKitCall: false,
      execution: false,
      networkCall: false,
      secretAccess: false,
      productionAdapter: false,
      api: false,
      sdk: false,
      a2ui: false,
      persistence: false,
      bidirectionalSync: false,
      webhook: false,
      runtimeAdapter: false
    },
    authority: {
      presentationOnly: true,
      canOverrideSurfacesAuthority: false,
      canApproveWork: false,
      canExecuteWork: false,
      sourceAuthority: "Surfaces design-system source remains product authority.",
      contractAuthority: "Surfaces Catalog and P3/P4 review contracts remain contract authority.",
      proofAuthority: "Passing Surfaces evidence remains proof authority."
    },
    provenance: provenance("surfaceops-kanban-static-substrate", ["plans/surfaceops-kanban-static.md"])
  };
}

export function buildKanbanSubstrateManifest(substrateHash = SK_ACCEPTED_SUBSTRATE_HASH) {
  return {
    schemaId: "kanban-board-substrate-manifest.v0",
    version: SK_VERSION,
    manifestId: "surfaceops-kanban-static-substrate-manifest",
    upstream: {
      name: "kanban.cards",
      role: "upstream collaboration-board substrate",
      localContractPath: SK_SUBSTRATE_PATH,
      modificationPolicy: "SurfaceOps extensions live adjacent to the upstream substrate."
    },
    substrateRefs: [
      artifactRef(SK_SUBSTRATE_PATH, "kanban-board-substrate.v0", substrateHash, {
        sourceRef: "kanban.cards://static-board-substrate"
      })
    ],
    excludedClaims: SK_FORBIDDEN_CLAIM_KEYS,
    provenance: provenance("surfaceops-kanban-static-substrate-manifest", [SK_SUBSTRATE_PATH])
  };
}

export function buildExpectationsManifest() {
  return {
    schemaId: "surfaceops-kanban-expectations.v0",
    version: SK_VERSION,
    targetId: SK_TARGET_ID,
    command: SK_COMMAND,
    fixtureRoot: SK_FIXTURE_ROOT,
    artifactRoot: SK_ARTIFACT_ROOT,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required"
    },
    generatedArtifacts: SK_ARTIFACT_PATHS,
    expectedResults: deepClone(SK_EXPECTATION_ROWS),
    provenance: provenance("surfaceops-kanban-static-expectations", ["plans/surfaceops-kanban-static.md"])
  };
}

export function buildTargetSelectionFixture() {
  return {
    schemaId: "surfaceops-kanban-target-selection.v0",
    version: SK_VERSION,
    targetId: SK_TARGET_ID,
    targetKind: SK_TARGET_KIND,
    claimStatus: "proof_only",
    scenarioId: SK_SCENARIO_ID,
    boardScope: {
      boardId: "surfaceops.review-governance",
      scenarioId: SK_SCENARIO_ID,
      componentScope: [],
      taskScope: ["review-required-work"]
    },
    capabilityScope: zeroCapabilityScope(),
    excludedClaims: SK_FORBIDDEN_CLAIM_KEYS,
    upstreamRefs: defaultUpstreamRefs(),
    substrateRefs: defaultSubstrateRefs(),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    targetSelectionRef: null,
    provenance: provenance("surfaceops-kanban-static-target-selection-fixture", [
      SK_P3_EVIDENCE_PATH,
      SK_P4_EVIDENCE_PATH,
      SK_SUBSTRATE_MANIFEST_PATH
    ])
  };
}

function buildFixture(row) {
  const relativePath = row.fixturePath.slice(`${SK_FIXTURE_ROOT}/`.length);
  const diagnosticCode = row.expectedDiagnosticCodes[0] ?? null;
  const claims = Object.fromEntries(SK_FORBIDDEN_CLAIM_KEYS.map((key) => [key, false]));
  if (diagnosticCode === "SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN") claims.liveKanbanWrite = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_LIVE_SURFACEOPS_FORBIDDEN") claims.liveSurfaceOpsWrite = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_LIVE_JUDGMENTKIT_FORBIDDEN") claims.liveJudgmentKitCall = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN") claims.execution = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_NETWORK_FORBIDDEN") claims.networkCall = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_SECRET_FORBIDDEN") claims.secretAccess = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN") claims.productionAdapter = true;
  if (diagnosticCode === "SURFACEOPS_KANBAN_A2UI_FORBIDDEN") claims.a2ui = true;
  return {
    schemaId: row.fixturePath.includes("/mutations/") && row.fixturePath.endsWith("-preflight.json")
      ? "surfaceops-kanban-preflight-mutation.v0"
      : "surfaceops-kanban-fixture.v0",
    version: SK_VERSION,
    fixtureId: relativePath.replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, ""),
    scenarioId: SK_SCENARIO_ID,
    targetId: diagnosticCode === "SURFACEOPS_KANBAN_TARGET_UNDECLARED" ? "" : SK_TARGET_ID,
    fixtureKind: row.expectedResult === "valid" ? "valid" : row.expectedResult,
    expectedResult: row.expectedResult,
    expectedPromotionStatus: row.promotionStatus,
    diagnosticCodes: row.expectedDiagnosticCodes,
    mutation: diagnosticCode,
    authorityOverride: diagnosticCode === "SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE",
    missingEvidenceRef: diagnosticCode === "SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING",
    hiddenReviewState: diagnosticCode === "SURFACEOPS_KANBAN_HIDDEN_REVIEW_STATE",
    boardScopeOutOfScope: diagnosticCode === "SURFACEOPS_KANBAN_TARGET_OUT_OF_SCOPE",
    unsupportedSubstrate: diagnosticCode === "SURFACEOPS_KANBAN_SUBSTRATE_UNSUPPORTED",
    claims,
    evidenceRefs: diagnosticCode === "SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING" ? [] : defaultUpstreamRefs(),
    sourceRefs: [
      SK_P3_REVIEW_QUEUE_PATH,
      SK_P4_DECISION_LEDGER_PATH,
      SK_P4_EVALUATION_REPORT_PATH
    ],
    provenance: provenance("surfaceops-kanban-static-fixture", [row.fixturePath])
  };
}

export function buildSurfaceopsKanbanStaticSchemas() {
  const artifactRef = artifactRefSchema();
  const provenance = provenanceSchema();
  const diagnostics = { type: "array", items: diagnosticObjectSchema() };
  const diagnosticsRegistry = { type: "array", items: diagnosticRegistrySchema() };
  const capabilityScope = capabilityScopeSchema();
  const commonArtifactProperties = {
    version: { const: SK_VERSION },
    provenance
  };
  const genericObject = { type: "object", additionalProperties: true };
  return {
    "surfaceops-kanban-target-selection.v0.schema.json": objectSchema("surfaceops-kanban-target-selection.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-target-selection.v0" },
      targetId: { type: "string" },
      targetKind: { type: "string" },
      claimStatus: { const: "proof_only" },
      scenarioId: { type: "string" },
      boardScope: genericObject,
      capabilityScope,
      excludedClaims: { type: "array", items: { type: "string" } },
      upstreamRefs: { type: "array", items: artifactRef },
      substrateRefs: { type: "array", items: artifactRef },
      diagnostics,
      diagnosticsRegistry,
      targetSelectionRef: { anyOf: [artifactRef, { type: "null" }] }
    }, ["schemaId", "version", "targetId", "targetKind", "claimStatus", "scenarioId", "boardScope", "capabilityScope", "excludedClaims", "upstreamRefs", "substrateRefs", "diagnostics", "diagnosticsRegistry", "targetSelectionRef", "provenance"]),
    "kanban-board-substrate-manifest.v0.schema.json": objectSchema("kanban-board-substrate-manifest.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "kanban-board-substrate-manifest.v0" },
      manifestId: { type: "string" },
      upstream: genericObject,
      substrateRefs: { type: "array", minItems: 1, items: artifactRef },
      excludedClaims: { type: "array", items: { type: "string" } }
    }, ["schemaId", "version", "manifestId", "upstream", "substrateRefs", "excludedClaims", "provenance"]),
    "kanban-board-substrate.v0.schema.json": objectSchema("kanban-board-substrate.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "kanban-board-substrate.v0" },
      substrateId: { type: "string" },
      substrateName: { type: "string" },
      upstreamProject: genericObject,
      supportedBoardKinds: { type: "array", items: { type: "string" } },
      lanes: { type: "array", items: genericObject },
      cardFields: { type: "array", items: { type: "string" } },
      packetKinds: { type: "array", items: { type: "string" } },
      capabilities: capabilityScope,
      authority: genericObject
    }, ["schemaId", "version", "substrateId", "substrateName", "upstreamProject", "supportedBoardKinds", "lanes", "cardFields", "packetKinds", "capabilities", "authority", "provenance"]),
    "surfaceops-kanban-board-projection.v0.schema.json": objectSchema("surfaceops-kanban-board-projection.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-board-projection.v0" },
      targetSelectionRef: artifactRef,
      upstreamRefs: { type: "array", items: artifactRef },
      substrateRefs: { type: "array", items: artifactRef },
      board: genericObject,
      lanes: { type: "array", items: genericObject },
      cards: { type: "array", items: genericObject },
      annotations: { type: "array", items: genericObject },
      authority: genericObject,
      evidenceRefs: { type: "array", items: artifactRef },
      diagnostics,
      diagnosticsRegistry
    }, ["schemaId", "version", "targetSelectionRef", "upstreamRefs", "substrateRefs", "board", "lanes", "cards", "annotations", "authority", "evidenceRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-designer-view-model.v0.schema.json": objectSchema("surfaceops-kanban-designer-view-model.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-designer-view-model.v0" },
      scenarioId: { type: "string" },
      targetId: { type: "string" },
      proofStatus: genericObject,
      promotionStatus: genericObject,
      designerSummary: genericObject,
      boardSummary: genericObject,
      outcomes: genericObject,
      authorityActionQueue: { type: "array", items: genericObject },
      evidence: genericObject,
      handoffEligibility: genericObject,
      packetRefs: { type: "array", items: artifactRef },
      diagnostics,
      diagnosticsRegistry
    }, ["schemaId", "version", "scenarioId", "targetId", "proofStatus", "promotionStatus", "designerSummary", "boardSummary", "outcomes", "authorityActionQueue", "evidence", "handoffEligibility", "packetRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-board-packet.v0.schema.json": objectSchema("surfaceops-kanban-board-packet.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-board-packet.v0" },
      packetId: { type: "string" },
      packetKind: { enum: ["review-work", "decisions"] },
      projectionRef: artifactRef,
      records: { type: "array", items: genericObject },
      execution: genericObject,
      evidenceRefs: { type: "array", items: artifactRef },
      diagnostics,
      diagnosticsRegistry
    }, ["schemaId", "version", "packetId", "packetKind", "projectionRef", "records", "execution", "evidenceRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-adapter-report.v0.schema.json": objectSchema("surfaceops-kanban-adapter-report.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-adapter-report.v0" },
      runId: { type: "string" },
      targetId: { type: "string" },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      upstreamPreflight: genericObject,
      substratePreflight: genericObject,
      artifactRefs: { type: "array", items: artifactRef },
      validationResults: { type: "array", items: validationResultSchema() },
      diagnostics,
      diagnosticsRegistry
    }, ["schemaId", "version", "runId", "targetId", "status", "promotionStatus", "upstreamPreflight", "substratePreflight", "artifactRefs", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-evidence.v0.schema.json": objectSchema("surfaceops-kanban-evidence.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-evidence.v0" },
      runId: { type: "string" },
      contractId: { const: SK_CONTRACT_ID },
      targetId: { const: SK_TARGET_ID },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      command: { const: SK_COMMAND },
      args: genericObject,
      checkedAt: { const: SK_TIMESTAMP },
      environment: genericObject,
      schemaClosure: { type: "array", items: artifactRef },
      fixtureRefs: { type: "array", items: artifactRef },
      boundaryRefs: { type: "array", items: artifactRef },
      artifacts: { type: "array", items: artifactRef },
      validationResults: { type: "array", items: validationResultSchema() },
      diagnostics,
      diagnosticsRegistry
    }, ["schemaId", "version", "runId", "contractId", "targetId", "status", "promotionStatus", "command", "args", "checkedAt", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-expectations.v0.schema.json": objectSchema("surfaceops-kanban-expectations.v0", {
      ...commonArtifactProperties,
      schemaId: { const: "surfaceops-kanban-expectations.v0" },
      targetId: { const: SK_TARGET_ID },
      command: { const: SK_COMMAND },
      fixtureRoot: { const: SK_FIXTURE_ROOT },
      artifactRoot: { const: SK_ARTIFACT_ROOT },
      runExpectation: genericObject,
      generatedArtifacts: { type: "array", items: { type: "string" } },
      expectedResults: { type: "array", items: expectationSchema() }
    }, ["schemaId", "version", "targetId", "command", "fixtureRoot", "artifactRoot", "runExpectation", "generatedArtifacts", "expectedResults", "provenance"]),
    "surfaceops-kanban-diagnostics.v0.schema.json": objectSchema("surfaceops-kanban-diagnostics.v0", {
      schemaId: { const: "surfaceops-kanban-diagnostics.v0" },
      version: { const: SK_VERSION },
      diagnostics: { type: "array", items: diagnosticRegistrySchema() },
      provenance
    }, ["schemaId", "version", "diagnostics", "provenance"]),
    "surfaceops-kanban-preflight-mutation.v0.schema.json": fixtureSchema("surfaceops-kanban-preflight-mutation.v0"),
    "surfaceops-kanban-fixture.v0.schema.json": fixtureSchema("surfaceops-kanban-fixture.v0")
  };
}

export function defaultUpstreamRefs() {
  return [
    artifactRef(SK_P3_EVIDENCE_PATH, "agent-orchestration-evidence.v0", SK_ACCEPTED_P3_EVIDENCE_HASH),
    artifactRef(SK_P3_REVIEW_QUEUE_PATH, "agent-review-queue.v0", SK_ACCEPTED_P3_REVIEW_QUEUE_HASH, { sourceEvidenceHash: SK_ACCEPTED_P3_EVIDENCE_HASH }),
    artifactRef(SK_P3_ORCHESTRATION_REPORT_PATH, "agent-orchestration-report.v0", SK_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH, { sourceEvidenceHash: SK_ACCEPTED_P3_EVIDENCE_HASH }),
    artifactRef(SK_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", SK_ACCEPTED_P4_EVIDENCE_HASH),
    artifactRef(SK_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", SK_ACCEPTED_P4_DECISION_LEDGER_HASH, { sourceEvidenceHash: SK_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(SK_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", SK_ACCEPTED_P4_REVIEW_REPORT_HASH, { sourceEvidenceHash: SK_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(SK_P4_EVALUATION_REPORT_PATH, "judgmentkit-evaluation-report.v0", SK_ACCEPTED_P4_EVALUATION_REPORT_HASH, { sourceEvidenceHash: SK_ACCEPTED_P4_EVIDENCE_HASH })
  ];
}

export function defaultSubstrateRefs() {
  return [
    artifactRef(SK_SUBSTRATE_MANIFEST_PATH, "kanban-board-substrate-manifest.v0", SK_ACCEPTED_SUBSTRATE_MANIFEST_HASH),
    artifactRef(SK_SUBSTRATE_PATH, "kanban-board-substrate.v0", SK_ACCEPTED_SUBSTRATE_HASH, {
      sourceEvidenceHash: SK_ACCEPTED_SUBSTRATE_MANIFEST_HASH
    })
  ];
}

export function artifactRef(pathValue, schemaId, hash, extra = {}) {
  const ref = {
    path: pathValue,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    sourceRef: extra.sourceRef ?? null
  };
  if (extra.sourceEvidenceHash !== undefined) {
    ref.sourceEvidenceHash = extra.sourceEvidenceHash;
  }
  return ref;
}

export function diagnosticsRegistry() {
  return SK_DIAGNOSTIC_ROWS.map((row) => ({
    code: row.code,
    message: row.canonicalMessage,
    severity: row.severity,
    stage: row.stage,
    phase: row.phase,
    promotionStatus: row.promotionStatus,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    suggestedAction: row.suggestedAction
  }));
}

export function diagnosticForCode(code, overrides = {}) {
  const row = SK_DIAGNOSTIC_ROWS.find((entry) => entry.code === code);
  if (!row) {
    throw new Error(`unknown surfaceops kanban diagnostic: ${code}`);
  }
  return {
    code: row.code,
    message: row.canonicalMessage,
    severity: row.severity,
    stage: row.stage,
    phase: row.phase,
    artifactPath: overrides.artifactPath ?? row.artifactPath,
    jsonPointer: overrides.jsonPointer ?? row.jsonPointer,
    sourceRef: overrides.sourceRef ?? row.sourceRef,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction
  };
}

export function schemaIdForSurfaceopsKanbanPath(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (SK_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath.endsWith("kanban-substrate-manifest.json")) return "kanban-board-substrate-manifest.v0";
  if (artifactPath.endsWith("kanban-board-substrate.json")) return "kanban-board-substrate.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "surfaceops-kanban-expectations.v0";
  if (artifactPath.endsWith("surfaceops-kanban-target-selection.fixture.json")) return "surfaceops-kanban-target-selection.v0";
  if (artifactPath.endsWith("surfaceops-kanban-target-selection.json")) return "surfaceops-kanban-target-selection.v0";
  if (artifactPath.endsWith("surfaceops-kanban-board-projection.json")) return "surfaceops-kanban-board-projection.v0";
  if (artifactPath.endsWith("surfaceops-kanban-designer-view-model.json")) return "surfaceops-kanban-designer-view-model.v0";
  if (artifactPath.includes("surfaceops-kanban-board-packet")) return "surfaceops-kanban-board-packet.v0";
  if (artifactPath.endsWith("surfaceops-kanban-adapter-report.json")) return "surfaceops-kanban-adapter-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "surfaceops-kanban-evidence.v0";
  if (artifactPath.endsWith("-preflight.json")) return "surfaceops-kanban-preflight-mutation.v0";
  if (artifactPath.includes(`${SK_FIXTURE_ROOT}/`)) return "surfaceops-kanban-fixture.v0";
  if (SK_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  return null;
}

export function skSchemaPaths() {
  return SK_SCHEMA_FILES.map((file) => `${SK_SCHEMA_ROOT}/${file}`);
}

export function skConsumedSchemaPaths() {
  return SK_CONSUMED_SCHEMA_FILES.map((file) => `${SK_SCHEMA_ROOT}/${file}`);
}

export function skFixturePaths() {
  return SK_FIXTURE_FILES;
}

export function skSourcePaths() {
  return [SK_SUBSTRATE_MANIFEST_PATH, SK_SUBSTRATE_PATH];
}

export function zeroCapabilityScope() {
  return Object.fromEntries(SK_FORBIDDEN_CLAIM_KEYS.map((key) => [key, false]));
}

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: SK_TIMESTAMP,
    generator,
    sourceRefs: [...sourceRefs].sort()
  };
}

function diagnosticRow(code, canonicalMessage, stage, fixtureCoverage, jsonPointer, overrides = {}) {
  return {
    code,
    trigger: canonicalMessage,
    canonicalMessage,
    severity: overrides.severity ?? "error",
    stage,
    phase: overrides.phase ?? `surfaceops-kanban-${stage}`,
    artifactPath: `${SK_FIXTURE_ROOT}/${fixtureCoverage}`,
    jsonPointer,
    sourceRef: overrides.sourceRef ?? null,
    validationResult: overrides.validationResult ?? "invalid",
    promotionStatus: overrides.promotionStatus ?? "blocked",
    suggestedAction: overrides.suggestedAction ?? "Inspect the evidence-backed authority layer and regenerate this static proof after the source issue is corrected."
  };
}

function expectation(relativePath, expectedResult, promotionStatus, expectedDiagnosticCodes) {
  return {
    fixturePath: `${SK_FIXTURE_ROOT}/${relativePath}`,
    expectedResult,
    promotionStatus,
    expectedDiagnosticCodes,
    stage: expectationStage(relativePath)
  };
}

function expectationStage(relativePath) {
  if (!relativePath.startsWith("mutations/")) return "projection";
  if (relativePath.includes("report-packet")) return "report";
  if (relativePath.includes("surfaceops-kanban-evidence")) return "evidence";
  if (relativePath.includes("projection-hash")) return "projection";
  return "preflight";
}

function fixtureSchema(schemaId) {
  return objectSchema(schemaId, {
    schemaId: { const: schemaId },
    version: { const: SK_VERSION },
    fixtureId: { type: "string" },
    scenarioId: { type: "string" },
    targetId: { type: "string" },
    fixtureKind: { enum: ["valid", "invalid", "review_required"] },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    expectedPromotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    mutation: { type: ["string", "null"] },
    authorityOverride: { type: "boolean" },
    missingEvidenceRef: { type: "boolean" },
    hiddenReviewState: { type: "boolean" },
    boardScopeOutOfScope: { type: "boolean" },
    unsupportedSubstrate: { type: "boolean" },
    claims: capabilityScopeSchema(),
    evidenceRefs: { type: "array", items: artifactRefSchema() },
    sourceRefs: { type: "array", items: { type: "string" } },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "scenarioId", "targetId", "fixtureKind", "expectedResult", "expectedPromotionStatus", "diagnosticCodes", "mutation", "authorityOverride", "missingEvidenceRef", "hiddenReviewState", "boardScopeOutOfScope", "unsupportedSubstrate", "claims", "evidenceRefs", "sourceRefs", "provenance"]);
}

function objectSchema(schemaId, properties, required) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
  if (schemaId !== null) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/surfaceops-kanban-static/${schemaId}.schema.json`;
  }
  return schema;
}

function artifactRefSchema() {
  return objectSchema(null, {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" },
    sourceRef: { type: ["string", "null"] },
    sourceEvidenceHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    provenance: provenanceSchema()
  }, ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"]);
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: SK_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function capabilityScopeSchema() {
  return objectSchema(null, Object.fromEntries(SK_FORBIDDEN_CLAIM_KEYS.map((key) => [key, { type: "boolean" }])), SK_FORBIDDEN_CLAIM_KEYS);
}

function diagnosticObjectSchema() {
  return objectSchema(null, {
    code: { type: "string" },
    message: { type: "string" },
    severity: { enum: ["error", "warning", "review"] },
    stage: { type: "string" },
    phase: { type: "string" },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" },
    sourceRef: { type: ["string", "null"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    suggestedAction: { type: "string" }
  }, ["code", "message", "severity", "stage", "phase", "artifactPath", "jsonPointer", "sourceRef", "promotionStatus", "suggestedAction"]);
}

function diagnosticRegistrySchema() {
  return objectSchema(null, {
    code: { type: "string" },
    message: { type: "string" },
    severity: { enum: ["error", "warning", "review"] },
    stage: { type: "string" },
    phase: { type: "string" },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" },
    suggestedAction: { type: "string" }
  }, ["code", "message", "severity", "stage", "phase", "promotionStatus", "artifactPath", "jsonPointer", "suggestedAction"]);
}

function validationResultSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    matched: { type: "boolean" },
    stage: { type: "string" },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" },
    suggestedAction: { type: "string" }
  }, ["fixturePath", "expectedResult", "actualResult", "promotionStatus", "matched", "stage", "diagnosticCodes", "expectedDiagnosticCodes", "artifactPath", "jsonPointer", "suggestedAction"]);
}

function expectationSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
    stage: { type: "string" }
  }, ["fixturePath", "expectedResult", "promotionStatus", "expectedDiagnosticCodes", "stage"]);
}
