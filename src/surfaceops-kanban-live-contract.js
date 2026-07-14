import path from "node:path";
import { canonicalJson } from "./p0.js";
import { sha256Hex, writeCanonicalJson } from "./p2-contract.js";

export const KL_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const KL_VERSION = "0.0.0";
export const KL_SCHEMA_ROOT = "schemas";
export const KL_SOURCE_ROOT = "sources/surfaceops-kanban-live";
export const KL_FIXTURE_ROOT = "fixtures/surfaceops-kanban-live";
export const KL_ARTIFACT_ROOT = "artifacts/surfaceops-kanban-live";
export const KL_COMMAND = "interfacectl surfaces surfaceops-kanban-live proof";
export const KL_CONTRACT_ID = "surfaceops-kanban-live-proof";
export const KL_TARGET_ID = "surfaceops-kanban-live";
export const KL_TARGET_KIND = "surfaceops-owned-live-kanban-adapter";
export const KL_SCENARIO_ID = "designer-surfaceops-approval-live-kanban";
export const KL_KANBAN_CARDS_COMMIT = "3b2a6f78693f0032439a1149eaed896f532aac09";

export const KL_P3_EVIDENCE_PATH = "artifacts/p3/evidence.json";
export const KL_P3_REVIEW_QUEUE_PATH = "artifacts/p3/review-queue.json";
export const KL_P3_ORCHESTRATION_REPORT_PATH = "artifacts/p3/agent-orchestration-report.json";
export const KL_P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
export const KL_P4_DECISION_LEDGER_PATH = "artifacts/p4/surfaceops-decision-ledger.json";
export const KL_P4_REVIEW_REPORT_PATH = "artifacts/p4/review-judgment-report.json";
export const KL_P4_EVALUATION_REPORT_PATH = "artifacts/p4/judgmentkit-evaluation-report.json";
export const KL_API_MANIFEST_PATH = `${KL_SOURCE_ROOT}/kanban-cards-api-manifest.json`;

export const KL_ACCEPTED_P3_EVIDENCE_HASH = "08c4c9e62c8643e7427b60f1ad8e48c86cfa5fced0ad1e0d3b6c3e0e5025589c";
export const KL_ACCEPTED_P3_REVIEW_QUEUE_HASH = "aac26d2171acaaabbe27c6262d45575eac8bf08c6e6a5284c1340cec184694da";
export const KL_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH = "a15550b663925ffeedb30c29b217f778aa5cb4b78d50bc2ba9f3b3ce81700cfc";
export const KL_ACCEPTED_P4_EVIDENCE_HASH = "a9de1573bc5c4dcd9e0d509d8b60885470a4d6cb2bfcbc0eff5ed451997d71f3";
export const KL_ACCEPTED_P4_DECISION_LEDGER_HASH = "91dd2b08dc7c99f2ff28c6dca2862379269f0f89c7feb63a073bd51fc5f1ebb8";
export const KL_ACCEPTED_P4_REVIEW_REPORT_HASH = "ca31dcd66c7037e0b8eff4e24ad5a41ae99497d7a44bc7a558f85bd981f32add";
export const KL_ACCEPTED_P4_EVALUATION_REPORT_HASH = "f792803e20a7bca5e235ab332b8b264e3a284bd4d93ba1abc1227582de889243";

export const KL_SCHEMA_FILES = [
  "kanban-cards-api-manifest.v0.schema.json",
  "surfaceops-kanban-live-target-selection.v0.schema.json",
  "surfaceops-kanban-live-operation-plan.v0.schema.json",
  "surfaceops-kanban-live-handoff-record.v0.schema.json",
  "surfaceops-kanban-live-adapter-report.v0.schema.json",
  "surfaceops-kanban-live-evidence.v0.schema.json",
  "surfaceops-kanban-live-expectations.v0.schema.json",
  "surfaceops-kanban-live-diagnostics.v0.schema.json",
  "surfaceops-kanban-live-fixture.v0.schema.json",
  "surfaceops-kanban-live-preflight-mutation.v0.schema.json",
  "surfaceops-kanban-live-browser-functional-report.v0.schema.json",
  "surfaceops-kanban-live-browser-functional-evidence.v0.schema.json"
];

export const KL_CONSUMED_SCHEMA_FILES = [
  "agent-orchestration-evidence.v0.schema.json",
  "agent-review-queue.v0.schema.json",
  "agent-orchestration-report.v0.schema.json",
  "review-judgment-evidence.v0.schema.json",
  "surfaceops-decision-ledger.v0.schema.json",
  "review-judgment-report.v0.schema.json",
  "judgmentkit-evaluation-report.v0.schema.json",
  "diagnostics.v0.schema.json"
];

export const KL_GENERATED_ARTIFACTS = [
  "surfaceops-kanban-live-target-selection.json",
  "surfaceops-kanban-live-api-projection.json",
  "surfaceops-kanban-live-operation-plan.json",
  "surfaceops-kanban-live-handoff-record.json",
  "surfaceops-kanban-live-adapter-report.json",
  "evidence.json"
];

export const KL_ARTIFACT_PATHS = KL_GENERATED_ARTIFACTS.map((file) => `${KL_ARTIFACT_ROOT}/${file}`);

export const KL_RUNTIME_OUTPUT_ROOT = "output/playwright/surfaceops-kanban-live";

export const KL_FIELD_OWNERSHIP = Object.freeze({
  surfaceopsOwned: [
    "reviewItemId",
    "evidenceRefs",
    "evidenceHashes",
    "diagnosticCode",
    "promotionStatus",
    "decisionStatus",
    "reviewerProvenance",
    "handoffEligibility",
    "nonExecutable"
  ],
  humanEditableSignals: ["comments", "mentions", "assignment", "collaborationNotes"],
  deniedManualEdits: ["evidenceRefs", "evidenceHashes", "promotionStatus", "decisionStatus", "diagnosticCode", "nonExecutable"]
});

export const KL_DIAGNOSTIC_ROWS = [
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_UPSTREAM_EVIDENCE_MISSING", "Required upstream evidence is missing.", "preflight", "mutations/missing-upstream-evidence.surfaceops-kanban-live-preflight.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_UPSTREAM_EVIDENCE_FAILED", "Required upstream evidence is not passing.", "preflight", "mutations/failing-upstream-evidence.surfaceops-kanban-live-preflight.json", "/status"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_UPSTREAM_HASH_MISMATCH", "Upstream artifact hash does not match accepted evidence.", "preflight", "mutations/upstream-hash-mismatch.surfaceops-kanban-live-preflight.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_API_MANIFEST_MISSING", "kanban.cards API manifest is missing.", "api-boundary", "mutations/missing-api-manifest.surfaceops-kanban-live-preflight.json", "/apiManifestRef"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_API_MANIFEST_HASH_MISMATCH", "kanban.cards API manifest hash does not match the declared live boundary.", "api-boundary", "mutations/api-manifest-hash-mismatch.surfaceops-kanban-live-preflight.json", "/apiManifestRef/hash"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_TARGET_UNDECLARED", "SurfaceOps kanban live target is not declared.", "target-selection", "invalid/target-undeclared.surfaceops-kanban-live.json", "/targetId"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_TARGET_OUT_OF_SCOPE", "SurfaceOps kanban live target exceeds the designer approval workflow scope.", "target-selection", "invalid/target-out-of-scope.surfaceops-kanban-live.json", "/boardScope"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_AUTHORITY_OVERRIDE", "kanban.cards must not override SurfaceOps or Surfaces authority.", "authority", "invalid/authority-override.surfaceops-kanban-live.json", "/authority"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_EVIDENCE_REF_MISSING", "Live kanban operation requires exact SurfaceOps evidence references.", "operation-plan", "invalid/missing-evidence-ref.surfaceops-kanban-live.json", "/evidenceRefs"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_SECRET_LEAK", "Live kanban proof artifacts must not contain secrets or bearer tokens.", "security", "invalid/secret-leak.surfaceops-kanban-live.json", "/redaction"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_UNSUPPORTED_ENDPOINT", "Live kanban adapter attempted an unsupported endpoint.", "api-boundary", "invalid/unsupported-endpoint.surfaceops-kanban-live.json", "/apiCalls"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_PRODUCTION_URL_FORBIDDEN", "First live proof must run against local loopback kanban.cards only.", "runtime-boundary", "invalid/production-url.surfaceops-kanban-live.json", "/runtime/baseUrl"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_PERMISSION_BYPASS", "Adapter permissions must fail closed for denied kanban operations.", "permissions", "invalid/permission-bypass.surfaceops-kanban-live.json", "/permissions"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_CONFLICT_REQUIRED", "Divergent kanban state must create a conflict instead of silent overwrite.", "conflict", "invalid/conflict-silent-overwrite.surfaceops-kanban-live.json", "/conflictPolicy"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_IDEMPOTENCY_REQUIRED", "Adapter operations require deterministic idempotency keys.", "idempotency", "invalid/idempotency-missing.surfaceops-kanban-live.json", "/operations"),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_REVIEW_REQUIRED", "Kanban lane movement is a collaboration signal until a structured SurfaceOps decision is committed.", "decision-boundary", "review/lane-move-signal-requires-decision.surfaceops-kanban-live.json", "/decisionBoundary", {
    severity: "review",
    validationResult: "review_required",
    promotionStatus: "review_required"
  }),
  diagnosticRow("SURFACEOPS_KANBAN_LIVE_EVIDENCE_HASH_MISMATCH", "Live kanban evidence hash does not match the evidence manifest.", "evidence", "mutations/hash-mismatch.surfaceops-kanban-live-evidence.json", "/artifacts")
];

export const KL_EXPECTATION_ROWS = [
  expectation("valid/live-board-bootstrap.surfaceops-kanban-live.json", "valid", "allowed", []),
  expectation("valid/card-from-surfaceops-evidence.surfaceops-kanban-live.json", "valid", "allowed", []),
  expectation("valid/realtime-event-replay.surfaceops-kanban-live.json", "valid", "allowed", []),
  expectation("valid/persistence-restart.surfaceops-kanban-live.json", "valid", "allowed", []),
  expectation("valid/adapter-marker-reconcile.surfaceops-kanban-live.json", "valid", "allowed", []),
  expectation("review/lane-move-signal-requires-decision.surfaceops-kanban-live.json", "review_required", "review_required", ["SURFACEOPS_KANBAN_LIVE_REVIEW_REQUIRED"]),
  expectation("invalid/target-undeclared.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_TARGET_UNDECLARED"]),
  expectation("invalid/target-out-of-scope.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_TARGET_OUT_OF_SCOPE"]),
  expectation("invalid/authority-override.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_AUTHORITY_OVERRIDE"]),
  expectation("invalid/missing-evidence-ref.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_EVIDENCE_REF_MISSING"]),
  expectation("invalid/secret-leak.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_SECRET_LEAK"]),
  expectation("invalid/unsupported-endpoint.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_UNSUPPORTED_ENDPOINT"]),
  expectation("invalid/production-url.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_PRODUCTION_URL_FORBIDDEN"]),
  expectation("invalid/permission-bypass.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_PERMISSION_BYPASS"]),
  expectation("invalid/conflict-silent-overwrite.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_CONFLICT_REQUIRED"]),
  expectation("invalid/idempotency-missing.surfaceops-kanban-live.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_IDEMPOTENCY_REQUIRED"]),
  expectation("mutations/missing-upstream-evidence.surfaceops-kanban-live-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_UPSTREAM_EVIDENCE_MISSING"]),
  expectation("mutations/failing-upstream-evidence.surfaceops-kanban-live-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_UPSTREAM_EVIDENCE_FAILED"]),
  expectation("mutations/upstream-hash-mismatch.surfaceops-kanban-live-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/missing-api-manifest.surfaceops-kanban-live-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_API_MANIFEST_MISSING"]),
  expectation("mutations/api-manifest-hash-mismatch.surfaceops-kanban-live-preflight.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_API_MANIFEST_HASH_MISMATCH"]),
  expectation("mutations/hash-mismatch.surfaceops-kanban-live-evidence.json", "invalid", "blocked", ["SURFACEOPS_KANBAN_LIVE_EVIDENCE_HASH_MISMATCH"])
];

export const KL_ACCEPTED_API_MANIFEST_HASH = sha256Hex(canonicalJson(buildKanbanCardsApiManifest()));

export async function materializeSurfaceopsKanbanLiveContract(cwd) {
  const schemas = buildSurfaceopsKanbanLiveSchemas();
  for (const file of KL_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, KL_SCHEMA_ROOT, file), schemas[file]);
  }
  await writeCanonicalJson(path.join(cwd, KL_API_MANIFEST_PATH), buildKanbanCardsApiManifest());
  const fixtures = buildSurfaceopsKanbanLiveFixtures();
  for (const [file, fixture] of fixtures.entries()) {
    await writeCanonicalJson(path.join(cwd, KL_FIXTURE_ROOT, file), fixture);
  }
}

export function buildKanbanCardsApiManifest() {
  return {
    schemaId: "kanban-cards-api-manifest.v0",
    version: KL_VERSION,
    manifestId: "kanban-cards-local-live-api-v0",
    upstreamProject: {
      name: "kanban.cards",
      role: "standalone-collaboration-board-substrate",
      sourceControl: "external-upstream",
      modificationPolicy: "do-not-modify-upstream-source",
      pinnedCommit: KL_KANBAN_CARDS_COMMIT,
      localWorkspaceHint: "../kanban.cards"
    },
    firstProofEnvironment: {
      kind: "local-loopback",
      allowedBaseUrlPattern: "^http://127\\.0\\.0\\.1:[0-9]+$",
      productionMutationAllowed: false
    },
    auth: {
      localAdminBearerBootstrap: true,
      scopedAgentTokens: true,
      auth0DelegatedProduction: false,
      tokenRedactionRequired: true
    },
    endpoints: [
      endpoint("GET", "/api/health", "health preflight", true, false),
      endpoint("POST", "/api/boards", "bootstrap SurfaceOps approvals board", true, true),
      endpoint("PATCH", "/api/boards/:boardId", "controlled board bootstrap updates only", true, true),
      endpoint("GET", "/api/boards/:boardId", "read live board snapshot", true, false),
      endpoint("POST", "/api/boards/:boardId/agent-sessions", "create scoped agent session during bootstrap", true, true),
      endpoint("POST", "/api/boards/:boardId/work-items", "create card from SurfaceOps evidence", true, true),
      endpoint("PATCH", "/api/boards/:boardId/work-items/:itemId", "move or update adapter projection fields", true, true),
      endpoint("POST", "/api/boards/:boardId/work-items/:itemId/comments", "append collaboration comment", true, true),
      endpoint("PATCH", "/api/boards/:boardId/work-items/:itemId/comments/:commentId", "update own comment status", true, true),
      endpoint("GET", "/api/events", "SSE realtime workspace event stream", true, false),
      endpoint("GET", "/api/boards/:boardId/events", "board and card event replay", true, false)
    ],
    explicitlyDeniedEndpoints: [
      "PUT /api/state",
      "POST /api/team/invites",
      "DELETE /api/team/members/:memberId",
      "POST /api/boards/:boardId/flow/ai-draft",
      "POST /api/boards/:boardId/flow/apply",
      "DELETE /api/boards/:boardId/agent-sessions/:sessionId"
    ],
    realtime: {
      transport: "server-sent-events",
      endpoint: "/api/events",
      cursorModes: ["query-since", "last-event-id"],
      refetchSnapshotBeforeReconcile: true,
      browserBearerTransportAllowed: false
    },
    persistence: {
      upstreamStoresBoardState: true,
      proofStartsWithFileStore: true,
      postgresProductionPathPlanned: true,
      surfaceopsOwnsMappingsAndAudit: true
    },
    unsupportedCapabilities: [
      "upstream-idempotency-key",
      "etag-cas-revision",
      "webhooks",
      "custom-card-metadata",
      "full-before-after-event-diff",
      "scoped-service-account"
    ],
    fieldOwnership: KL_FIELD_OWNERSHIP,
    authority: {
      kanbanCardsOwnsBoardPersistence: true,
      kanbanCardsOwnsSurfaceOpsDecisions: false,
      kanbanCardsOwnsSurfacesProofAuthority: false,
      surfaceopsOwnsDecisions: true,
      surfacesEvidenceRemainsProofAuthority: true
    },
    provenance: provenance("kanban-cards-api-manifest", [
      "VISION.md",
      "plans/surfaceops-product-brief.md",
      "plans/surfaceops-ui-decisions-review-criteria.md",
      "kanban-cards://README.md",
      "kanban-cards://src/server.ts",
      "kanban-cards://src/event-store.ts",
      "kanban-cards://src/agent-token-store.ts"
    ])
  };
}

export function buildSurfaceopsKanbanLiveFixtures() {
  const fixtures = new Map();
  fixtures.set("expectations.manifest.json", buildExpectationsManifest());
  fixtures.set("target-selection.fixture.json", buildTargetSelectionFixture());
  for (const row of KL_EXPECTATION_ROWS) {
    const fixturePath = row.fixturePath.slice(`${KL_FIXTURE_ROOT}/`.length);
    fixtures.set(fixturePath, buildFixture(row));
  }
  return fixtures;
}

export function buildExpectationsManifest() {
  return {
    schemaId: "surfaceops-kanban-live-expectations.v0",
    version: KL_VERSION,
    targetId: KL_TARGET_ID,
    command: KL_COMMAND,
    fixtureRoot: KL_FIXTURE_ROOT,
    artifactRoot: KL_ARTIFACT_ROOT,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required",
      totalResults: KL_EXPECTATION_ROWS.length,
      matchedResults: KL_EXPECTATION_ROWS.length
    },
    generatedArtifacts: KL_ARTIFACT_PATHS,
    expectedResults: KL_EXPECTATION_ROWS,
    provenance: provenance("surfaceops-kanban-live-expectations", ["plans/surfaceops-kanban-live.md"])
  };
}

export function buildTargetSelectionFixture() {
  return {
    schemaId: "surfaceops-kanban-live-target-selection.v0",
    version: KL_VERSION,
    targetId: KL_TARGET_ID,
    targetKind: KL_TARGET_KIND,
    claimStatus: "local_live_functional_proof",
    scenarioId: KL_SCENARIO_ID,
    boardScope: {
      strategy: "create-dedicated-board",
      boardName: "SurfaceOps Approvals",
      lifecycle: "proof-run-or-review-program",
      componentScope: ["button"],
      reviewProgramScope: ["designer-approval-workflow"]
    },
    userScope: {
      scopeKind: "team-project-review-program",
      primaryRoles: ["product-designer", "design-system-owner"],
      secondaryRoles: ["frontend-engineer", "platform-engineer"],
      perUserBoard: false
    },
    authModel: {
      firstProof: "local-admin-bearer-bootstrap-plus-scoped-agent-token",
      productionDirection: "surfaceops-authenticated-backend-adapter",
      browserBearerTokensAllowed: false
    },
    upstreamRefs: defaultUpstreamRefs(),
    apiManifestRef: defaultApiManifestRef(),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("surfaceops-kanban-live-target-selection-fixture", [
      KL_P3_EVIDENCE_PATH,
      KL_P4_EVIDENCE_PATH,
      KL_API_MANIFEST_PATH
    ])
  };
}

export function buildSurfaceopsKanbanLiveSchemas() {
  const artifactRef = artifactRefSchema();
  const provenance = provenanceSchema();
  const diagnostics = { type: "array", items: diagnosticRegistrySchema() };
  const genericObject = { type: "object", additionalProperties: true };
  const stringArray = { type: "array", items: { type: "string" } };
  const common = { version: { const: KL_VERSION }, provenance };
  return {
    "kanban-cards-api-manifest.v0.schema.json": objectSchema("kanban-cards-api-manifest.v0", {
      ...common,
      schemaId: { const: "kanban-cards-api-manifest.v0" },
      manifestId: { type: "string" },
      upstreamProject: genericObject,
      firstProofEnvironment: genericObject,
      auth: genericObject,
      endpoints: { type: "array", minItems: 1, items: endpointSchema() },
      explicitlyDeniedEndpoints: stringArray,
      realtime: genericObject,
      persistence: genericObject,
      unsupportedCapabilities: stringArray,
      fieldOwnership: fieldOwnershipSchema(),
      authority: genericObject
    }, ["schemaId", "version", "manifestId", "upstreamProject", "firstProofEnvironment", "auth", "endpoints", "explicitlyDeniedEndpoints", "realtime", "persistence", "unsupportedCapabilities", "fieldOwnership", "authority", "provenance"]),
    "surfaceops-kanban-live-target-selection.v0.schema.json": objectSchema("surfaceops-kanban-live-target-selection.v0", {
      ...common,
      schemaId: { const: "surfaceops-kanban-live-target-selection.v0" },
      targetId: { type: "string" },
      targetKind: { type: "string" },
      claimStatus: { const: "local_live_functional_proof" },
      scenarioId: { type: "string" },
      boardScope: genericObject,
      userScope: genericObject,
      authModel: genericObject,
      upstreamRefs: { type: "array", items: artifactRef },
      apiManifestRef: artifactRef,
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "targetId", "targetKind", "claimStatus", "scenarioId", "boardScope", "userScope", "authModel", "upstreamRefs", "apiManifestRef", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-live-operation-plan.v0.schema.json": objectSchema("surfaceops-kanban-live-operation-plan.v0", {
      ...common,
      schemaId: { const: "surfaceops-kanban-live-operation-plan.v0" },
      targetSelectionRef: artifactRef,
      apiManifestRef: artifactRef,
      adapterMode: { const: "surfaceops-backend-adapter" },
      operations: { type: "array", minItems: 1, items: operationSchema() },
      mappingStore: mappingStoreSchema(),
      conflictPolicy: conflictPolicySchema(),
      evidenceRefs: { type: "array", minItems: 1, items: artifactRef },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "targetSelectionRef", "apiManifestRef", "adapterMode", "operations", "mappingStore", "conflictPolicy", "evidenceRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-live-handoff-record.v0.schema.json": objectSchema("surfaceops-kanban-live-handoff-record.v0", {
      ...common,
      schemaId: { const: "surfaceops-kanban-live-handoff-record.v0" },
      operationPlanRef: artifactRef,
      designerWorkflow: genericObject,
      boundary: liveBoundarySchema(),
      runtimeEvidence: genericObject,
      handoffEligibility: genericObject,
      evidenceRefs: { type: "array", minItems: 1, items: artifactRef },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "operationPlanRef", "designerWorkflow", "boundary", "runtimeEvidence", "handoffEligibility", "evidenceRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-live-adapter-report.v0.schema.json": objectSchema("surfaceops-kanban-live-adapter-report.v0", {
      ...common,
      schemaId: { const: "surfaceops-kanban-live-adapter-report.v0" },
      runId: { type: "string" },
      targetId: { const: KL_TARGET_ID },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      upstreamPreflight: genericObject,
      apiPreflight: genericObject,
      artifactRefs: { type: "array", items: artifactRef },
      validationResults: { type: "array", items: validationResultSchema() },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "runId", "targetId", "status", "promotionStatus", "upstreamPreflight", "apiPreflight", "artifactRefs", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-live-evidence.v0.schema.json": objectSchema("surfaceops-kanban-live-evidence.v0", {
      ...common,
      schemaId: { const: "surfaceops-kanban-live-evidence.v0" },
      runId: { type: "string" },
      contractId: { const: KL_CONTRACT_ID },
      targetId: { const: KL_TARGET_ID },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      command: { const: KL_COMMAND },
      args: genericObject,
      checkedAt: { const: KL_TIMESTAMP },
      environment: environmentSchema(),
      schemaClosure: { type: "array", items: artifactRef },
      fixtureRefs: { type: "array", items: artifactRef },
      boundaryRefs: { type: "array", items: artifactRef },
      artifacts: { type: "array", items: artifactRef },
      validationResults: { type: "array", items: validationResultSchema() },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "runId", "contractId", "targetId", "status", "promotionStatus", "command", "args", "checkedAt", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-kanban-live-expectations.v0.schema.json": objectSchema("surfaceops-kanban-live-expectations.v0", {
      ...common,
      schemaId: { const: "surfaceops-kanban-live-expectations.v0" },
      targetId: { const: KL_TARGET_ID },
      command: { const: KL_COMMAND },
      fixtureRoot: { const: KL_FIXTURE_ROOT },
      artifactRoot: { const: KL_ARTIFACT_ROOT },
      runExpectation: genericObject,
      generatedArtifacts: stringArray,
      expectedResults: { type: "array", items: expectationSchema() }
    }, ["schemaId", "version", "targetId", "command", "fixtureRoot", "artifactRoot", "runExpectation", "generatedArtifacts", "expectedResults", "provenance"]),
    "surfaceops-kanban-live-diagnostics.v0.schema.json": objectSchema("surfaceops-kanban-live-diagnostics.v0", {
      schemaId: { const: "surfaceops-kanban-live-diagnostics.v0" },
      version: { const: KL_VERSION },
      diagnostics,
      provenance
    }, ["schemaId", "version", "diagnostics", "provenance"]),
    "surfaceops-kanban-live-fixture.v0.schema.json": fixtureSchema("surfaceops-kanban-live-fixture.v0"),
    "surfaceops-kanban-live-preflight-mutation.v0.schema.json": fixtureSchema("surfaceops-kanban-live-preflight-mutation.v0"),
    "surfaceops-kanban-live-browser-functional-report.v0.schema.json": browserReportSchema(),
    "surfaceops-kanban-live-browser-functional-evidence.v0.schema.json": browserEvidenceSchema()
  };
}

export function defaultUpstreamRefs() {
  return [
    artifactRef(KL_P3_EVIDENCE_PATH, "agent-orchestration-evidence.v0", KL_ACCEPTED_P3_EVIDENCE_HASH),
    artifactRef(KL_P3_REVIEW_QUEUE_PATH, "agent-review-queue.v0", KL_ACCEPTED_P3_REVIEW_QUEUE_HASH, { sourceEvidenceHash: KL_ACCEPTED_P3_EVIDENCE_HASH }),
    artifactRef(KL_P3_ORCHESTRATION_REPORT_PATH, "agent-orchestration-report.v0", KL_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH, { sourceEvidenceHash: KL_ACCEPTED_P3_EVIDENCE_HASH }),
    artifactRef(KL_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", KL_ACCEPTED_P4_EVIDENCE_HASH),
    artifactRef(KL_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", KL_ACCEPTED_P4_DECISION_LEDGER_HASH, { sourceEvidenceHash: KL_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(KL_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", KL_ACCEPTED_P4_REVIEW_REPORT_HASH, { sourceEvidenceHash: KL_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(KL_P4_EVALUATION_REPORT_PATH, "judgmentkit-evaluation-report.v0", KL_ACCEPTED_P4_EVALUATION_REPORT_HASH, { sourceEvidenceHash: KL_ACCEPTED_P4_EVIDENCE_HASH })
  ];
}

export function defaultApiManifestRef() {
  return artifactRef(KL_API_MANIFEST_PATH, "kanban-cards-api-manifest.v0", KL_ACCEPTED_API_MANIFEST_HASH);
}

export function klSchemaPaths() {
  return KL_SCHEMA_FILES.map((file) => `${KL_SCHEMA_ROOT}/${file}`);
}

export function klConsumedSchemaPaths() {
  return KL_CONSUMED_SCHEMA_FILES.map((file) => `${KL_SCHEMA_ROOT}/${file}`);
}

export function klFixturePaths() {
  return [`${KL_FIXTURE_ROOT}/expectations.manifest.json`, `${KL_FIXTURE_ROOT}/target-selection.fixture.json`, ...KL_EXPECTATION_ROWS.map((row) => row.fixturePath)];
}

export function klSourcePaths() {
  return [KL_API_MANIFEST_PATH];
}

export function schemaIdForSurfaceopsKanbanLivePath(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (KL_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath.endsWith("kanban-cards-api-manifest.json")) return "kanban-cards-api-manifest.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "surfaceops-kanban-live-expectations.v0";
  if (artifactPath.endsWith("target-selection.fixture.json")) return "surfaceops-kanban-live-target-selection.v0";
  if (artifactPath.endsWith("surfaceops-kanban-live-target-selection.json")) return "surfaceops-kanban-live-target-selection.v0";
  if (artifactPath.endsWith("surfaceops-kanban-live-api-projection.json")) return "kanban-cards-api-manifest.v0";
  if (artifactPath.endsWith("surfaceops-kanban-live-operation-plan.json")) return "surfaceops-kanban-live-operation-plan.v0";
  if (artifactPath.endsWith("surfaceops-kanban-live-handoff-record.json")) return "surfaceops-kanban-live-handoff-record.v0";
  if (artifactPath.endsWith("surfaceops-kanban-live-adapter-report.json")) return "surfaceops-kanban-live-adapter-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "surfaceops-kanban-live-evidence.v0";
  if (artifactPath.endsWith("-preflight.json")) return "surfaceops-kanban-live-preflight-mutation.v0";
  if (artifactPath.includes(`${KL_FIXTURE_ROOT}/`)) return "surfaceops-kanban-live-fixture.v0";
  if (KL_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  return null;
}

export function artifactRef(pathValue, schemaId, hash, extra = {}) {
  const ref = {
    path: pathValue,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    sourceRef: extra.sourceRef ?? null
  };
  if (extra.sourceEvidenceHash !== undefined) ref.sourceEvidenceHash = extra.sourceEvidenceHash;
  return ref;
}

export function diagnosticsRegistry() {
  return KL_DIAGNOSTIC_ROWS.map((row) => ({
    code: row.code,
    trigger: row.trigger,
    canonicalMessage: row.canonicalMessage,
    message: row.canonicalMessage,
    severity: row.severity,
    stage: row.stage,
    phase: row.phase,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef: row.sourceRef,
    fixtureCoverage: row.fixtureCoverage,
    suggestedAction: row.suggestedAction
  }));
}

export function diagnosticForCode(code, overrides = {}) {
  const row = KL_DIAGNOSTIC_ROWS.find((entry) => entry.code === code);
  if (!row) throw new Error(`unknown surfaceops kanban live diagnostic: ${code}`);
  return {
    code: row.code,
    trigger: row.trigger,
    canonicalMessage: row.canonicalMessage,
    message: row.canonicalMessage,
    severity: row.severity,
    stage: row.stage,
    phase: row.phase,
    artifactPath: overrides.artifactPath ?? row.artifactPath,
    jsonPointer: overrides.jsonPointer ?? row.jsonPointer,
    sourceRef: overrides.sourceRef ?? row.sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    fixtureCoverage: row.fixtureCoverage,
    suggestedAction: row.suggestedAction
  };
}

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: KL_TIMESTAMP,
    generator,
    sourceRefs: [...sourceRefs].sort()
  };
}

function buildFixture(row) {
  const diagnosticCode = row.expectedDiagnosticCodes[0] ?? null;
  return {
    schemaId: row.fixturePath.includes("/mutations/") && row.fixturePath.endsWith("-preflight.json")
      ? "surfaceops-kanban-live-preflight-mutation.v0"
      : "surfaceops-kanban-live-fixture.v0",
    version: KL_VERSION,
    fixtureId: row.fixturePath.slice(`${KL_FIXTURE_ROOT}/`.length).replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, ""),
    scenarioId: KL_SCENARIO_ID,
    targetId: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_TARGET_UNDECLARED" ? "" : KL_TARGET_ID,
    fixtureKind: row.expectedResult === "valid" ? "valid" : row.expectedResult,
    expectedResult: row.expectedResult,
    expectedPromotionStatus: row.promotionStatus,
    diagnosticCodes: row.expectedDiagnosticCodes,
    mutation: diagnosticCode,
    authorityOverride: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_AUTHORITY_OVERRIDE",
    targetOutOfScope: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_TARGET_OUT_OF_SCOPE",
    missingEvidenceRef: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_EVIDENCE_REF_MISSING",
    secretLeak: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_SECRET_LEAK",
    unsupportedEndpoint: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_UNSUPPORTED_ENDPOINT",
    productionUrl: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_PRODUCTION_URL_FORBIDDEN",
    permissionBypass: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_PERMISSION_BYPASS",
    conflictSilentOverwrite: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_CONFLICT_REQUIRED",
    idempotencyMissing: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_IDEMPOTENCY_REQUIRED",
    laneMoveSignal: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_REVIEW_REQUIRED",
    evidenceRefs: diagnosticCode === "SURFACEOPS_KANBAN_LIVE_EVIDENCE_REF_MISSING" ? [] : defaultUpstreamRefs(),
    apiManifestRef: defaultApiManifestRef(),
    provenance: provenance("surfaceops-kanban-live-fixture", [row.fixturePath])
  };
}

function endpoint(method, pathValue, purpose, allowedForFirstProof, write) {
  return { method, path: pathValue, purpose, allowedForFirstProof, write };
}

function diagnosticRow(code, canonicalMessage, stage, fixtureCoverage, jsonPointer, overrides = {}) {
  return {
    code,
    trigger: overrides.trigger ?? canonicalMessage,
    canonicalMessage,
    severity: overrides.severity ?? "error",
    stage,
    phase: overrides.phase ?? `surfaceops-kanban-live-${stage}`,
    artifactPath: `${KL_FIXTURE_ROOT}/${fixtureCoverage}`,
    jsonPointer,
    sourceRef: overrides.sourceRef ?? defaultDiagnosticSourceRef(fixtureCoverage, jsonPointer),
    validationResult: overrides.validationResult ?? "invalid",
    promotionStatus: overrides.promotionStatus ?? "blocked",
    fixtureCoverage,
    suggestedAction: overrides.suggestedAction ?? "Use the SurfaceOps-owned adapter boundary and regenerate live proof evidence after correcting the integration issue."
  };
}

function defaultDiagnosticSourceRef(fixtureCoverage, jsonPointer) {
  if (!fixtureCoverage.startsWith("invalid/") && !fixtureCoverage.startsWith("review/")) return null;
  const fixtureId = fixtureCoverage
    .replace(/\.surfaceops-kanban-live(?:-preflight|-evidence)?\.json$/, "")
    .replace(/\.json$/, "");
  return `fixture://surfaceops-kanban-live/${fixtureId}#${jsonPointer}`;
}

function expectation(relativePath, expectedResult, promotionStatus, expectedDiagnosticCodes) {
  return {
    fixturePath: `${KL_FIXTURE_ROOT}/${relativePath}`,
    expectedResult,
    promotionStatus,
    expectedDiagnosticCodes,
    stage: expectedDiagnosticCodes[0]
      ? KL_DIAGNOSTIC_ROWS.find((row) => row.code === expectedDiagnosticCodes[0])?.stage ?? "operation-plan"
      : "operation-plan"
  };
}

function objectSchema(schemaId, properties, required) {
  const schema = { type: "object", additionalProperties: false, properties, required };
  if (schemaId !== null) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/surfaceops-kanban-live/${schemaId}.schema.json`;
  }
  return schema;
}

function nullableStringSchema() {
  return { type: ["string", "null"] };
}

function artifactRefSchema() {
  return objectSchema(null, {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    sourceRef: nullableStringSchema(),
    sourceEvidenceHash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  }, ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"]);
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: KL_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function diagnosticRegistrySchema() {
  return objectSchema(null, {
    code: { type: "string" },
    trigger: { type: "string" },
    canonicalMessage: { type: "string" },
    message: { type: "string" },
    severity: { enum: ["error", "warning", "review"] },
    stage: { type: "string" },
    phase: { type: "string" },
    validationResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" },
    sourceRef: nullableStringSchema(),
    fixtureCoverage: { type: "string" },
    suggestedAction: { type: "string" }
  }, ["code", "trigger", "canonicalMessage", "message", "severity", "stage", "phase", "validationResult", "promotionStatus", "artifactPath", "jsonPointer", "sourceRef", "fixtureCoverage", "suggestedAction"]);
}

function endpointSchema() {
  return objectSchema(null, {
    method: { enum: ["GET", "POST", "PATCH", "PUT", "DELETE"] },
    path: { type: "string" },
    purpose: { type: "string" },
    allowedForFirstProof: { type: "boolean" },
    write: { type: "boolean" }
  }, ["method", "path", "purpose", "allowedForFirstProof", "write"]);
}

function fieldOwnershipSchema() {
  const arr = { type: "array", items: { type: "string" } };
  return objectSchema(null, {
    surfaceopsOwned: arr,
    humanEditableSignals: arr,
    deniedManualEdits: arr
  }, ["surfaceopsOwned", "humanEditableSignals", "deniedManualEdits"]);
}

function operationSchema() {
  return objectSchema(null, {
    operationId: { type: "string" },
    method: { type: "string" },
    endpoint: { type: "string" },
    actor: { type: "string" },
    purpose: { type: "string" },
    idempotencyKey: { type: "string" },
    redacted: { const: true },
    expectedProofAssertion: { type: "string" }
  }, ["operationId", "method", "endpoint", "actor", "purpose", "idempotencyKey", "redacted", "expectedProofAssertion"]);
}

function mappingStoreSchema() {
  return objectSchema(null, {
    owner: { const: "SurfaceOps" },
    implementedInThisProof: { const: false },
    plannedStoreShape: { type: "array", items: { type: "string" } },
    cardBindingKey: { type: "string" },
    cardTextIsAuthority: { const: false }
  }, ["owner", "implementedInThisProof", "plannedStoreShape", "cardBindingKey", "cardTextIsAuthority"]);
}

function conflictPolicySchema() {
  return objectSchema(null, {
    authorityFieldsWinner: { const: "SurfaceOps" },
    comments: { const: "append-only-merge" },
    laneMoves: { const: "signals-until-structured-decision" },
    evidenceHashChange: { const: "successor-card" },
    silentOverwriteAllowed: { const: false }
  }, ["authorityFieldsWinner", "comments", "laneMoves", "evidenceHashChange", "silentOverwriteAllowed"]);
}

function liveBoundarySchema() {
  return objectSchema(null, {
    liveKanbanCardsApi: { const: true },
    modifiesKanbanCardsSource: { const: false },
    liveSurfaceOpsProduct: { const: false },
    liveJudgmentKit: { const: false },
    workExecution: { const: false },
    productionMutation: { const: false },
    browserVideoProofRequired: { const: true }
  }, ["liveKanbanCardsApi", "modifiesKanbanCardsSource", "liveSurfaceOpsProduct", "liveJudgmentKit", "workExecution", "productionMutation", "browserVideoProofRequired"]);
}

function environmentSchema() {
  return objectSchema(null, {
    generatedAt: { const: KL_TIMESTAMP },
    host: { type: "null" }
  }, ["generatedAt", "host"]);
}

function validationResultSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    matched: { type: "boolean" }
  }, ["fixturePath", "expectedResult", "actualResult", "promotionStatus", "expectedDiagnosticCodes", "diagnosticCodes", "matched"]);
}

function expectationSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
    stage: { type: "string" }
  }, ["fixturePath", "expectedResult", "promotionStatus", "expectedDiagnosticCodes", "stage"]);
}

function fixtureSchema(schemaId) {
  return objectSchema(schemaId, {
    schemaId: { const: schemaId },
    version: { const: KL_VERSION },
    fixtureId: { type: "string" },
    scenarioId: { type: "string" },
    targetId: { type: "string" },
    fixtureKind: { enum: ["valid", "invalid", "review_required"] },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    expectedPromotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    mutation: nullableStringSchema(),
    authorityOverride: { type: "boolean" },
    targetOutOfScope: { type: "boolean" },
    missingEvidenceRef: { type: "boolean" },
    secretLeak: { type: "boolean" },
    unsupportedEndpoint: { type: "boolean" },
    productionUrl: { type: "boolean" },
    permissionBypass: { type: "boolean" },
    conflictSilentOverwrite: { type: "boolean" },
    idempotencyMissing: { type: "boolean" },
    laneMoveSignal: { type: "boolean" },
    evidenceRefs: { type: "array", items: artifactRefSchema() },
    apiManifestRef: artifactRefSchema(),
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "scenarioId", "targetId", "fixtureKind", "expectedResult", "expectedPromotionStatus", "diagnosticCodes", "mutation", "authorityOverride", "targetOutOfScope", "missingEvidenceRef", "secretLeak", "unsupportedEndpoint", "productionUrl", "permissionBypass", "conflictSilentOverwrite", "idempotencyMissing", "laneMoveSignal", "evidenceRefs", "apiManifestRef", "provenance"]);
}

function browserFileRefSchema() {
  return objectSchema(null, {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    mimeType: { type: "string" }
  }, ["path", "schemaId", "hashAlgorithm", "hash", "mimeType"]);
}

function browserStepSchema() {
  return objectSchema(null, {
    stepId: { type: "string" },
    action: { type: "string" },
    status: { enum: ["pass", "fail"] },
    detail: { type: "string" }
  }, ["stepId", "action", "status", "detail"]);
}

function browserAssertionSchema() {
  return objectSchema(null, {
    assertionId: { type: "string" },
    status: { enum: ["pass", "fail"] },
    expected: { type: "string" },
    actual: { type: "string" }
  }, ["assertionId", "status", "expected", "actual"]);
}

function browserReportSchema() {
  return objectSchema("surfaceops-kanban-live-browser-functional-report.v0", {
    schemaId: { const: "surfaceops-kanban-live-browser-functional-report.v0" },
    version: { const: KL_VERSION },
    targetId: { const: KL_TARGET_ID },
    scenarioId: { const: KL_SCENARIO_ID },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    command: { type: "string" },
    liveEvidenceRef: artifactRefSchema(),
    kanbanRuntime: { type: "object", additionalProperties: true },
    steps: { type: "array", minItems: 1, items: browserStepSchema() },
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    redactedApiExchangeRef: browserFileRefSchema(),
    recordingRef: browserFileRefSchema(),
    screenshotRef: browserFileRefSchema(),
    transcriptRef: browserFileRefSchema(),
    boundary: liveBoundarySchema(),
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "status", "promotionStatus", "command", "liveEvidenceRef", "kanbanRuntime", "steps", "assertions", "redactedApiExchangeRef", "recordingRef", "screenshotRef", "transcriptRef", "boundary", "provenance"]);
}

function browserEvidenceSchema() {
  return objectSchema("surfaceops-kanban-live-browser-functional-evidence.v0", {
    schemaId: { const: "surfaceops-kanban-live-browser-functional-evidence.v0" },
    version: { const: KL_VERSION },
    targetId: { const: KL_TARGET_ID },
    scenarioId: { const: KL_SCENARIO_ID },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    command: { type: "string" },
    checkedAt: { type: "string" },
    environment: { type: "object", additionalProperties: true },
    liveEvidenceRef: artifactRefSchema(),
    reportRef: browserFileRefSchema(),
    recordingRef: browserFileRefSchema(),
    screenshotRef: browserFileRefSchema(),
    transcriptRef: browserFileRefSchema(),
    redactedApiExchangeRef: browserFileRefSchema(),
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    boundary: liveBoundarySchema(),
    selfHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "status", "promotionStatus", "command", "checkedAt", "environment", "liveEvidenceRef", "reportRef", "recordingRef", "screenshotRef", "transcriptRef", "redactedApiExchangeRef", "assertions", "boundary", "selfHash", "provenance"]);
}
