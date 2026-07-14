import path from "node:path";
import { canonicalJson } from "./p0.js";
import { sha256Hex, writeCanonicalJson } from "./p2-contract.js";

export const DRUI_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const DRUI_VERSION = "0.0.0";
export const DRUI_SCHEMA_ROOT = "schemas";
export const DRUI_FIXTURE_ROOT = "fixtures/surfaceops-designer-review-ui";
export const DRUI_ARTIFACT_ROOT = "artifacts/surfaceops-designer-review-ui";
export const DRUI_DEMO_ROOT = "demo/surfaceops-designer-review-ui";
export const DRUI_RUNTIME_OUTPUT_ROOT = "output/playwright/surfaceops-designer-review-ui";
export const DRUI_COMMAND = "interfacectl surfaces surfaceops-designer-review-ui proof";
export const DRUI_CONTRACT_ID = "surfaceops-designer-review-ui-proof";
export const DRUI_TARGET_ID = "surfaceops-designer-review-ui";
export const DRUI_SCENARIO_ID = "button-variants-live-review";
export const DRUI_COMPONENT_ID = "Button";

export const DRUI_DWT_EVIDENCE_PATH = "artifacts/designer-workflow-trace/evidence.json";
export const DRUI_DWT_REPORT_PATH = "artifacts/designer-workflow-trace/designer-workflow-trace-report.json";
export const DRUI_P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
export const DRUI_P4_DECISION_LEDGER_PATH = "artifacts/p4/surfaceops-decision-ledger.json";
export const DRUI_KANBAN_LIVE_EVIDENCE_PATH = "artifacts/surfaceops-kanban-live/evidence.json";
export const DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH = "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json";

export const DRUI_ACCEPTED_DWT_EVIDENCE_HASH = "c02c0d48ed5c60fd67fb7921783b89a058642425032f159513fc35629e3a7e52";
export const DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH = "394d6d84835bc5bfd27eb114838f392b637638ed5d05277e7fce71a92d7a52f3";
export const DRUI_ACCEPTED_P4_EVIDENCE_HASH = "a9de1573bc5c4dcd9e0d509d8b60885470a4d6cb2bfcbc0eff5ed451997d71f3";

export const DRUI_SCHEMA_FILES = [
  "surfaceops-designer-review-ui-target-selection.v0.schema.json",
  "surfaceops-designer-review-workbench.v0.schema.json",
  "surfaceops-designer-review-decision-receipt.v0.schema.json",
  "surfaceops-designer-review-ui-report.v0.schema.json",
  "surfaceops-designer-review-ui-evidence.v0.schema.json",
  "surfaceops-designer-review-ui-expectations.v0.schema.json",
  "surfaceops-designer-review-ui-fixture.v0.schema.json",
  "surfaceops-designer-review-ui-diagnostics.v0.schema.json",
  "surfaceops-designer-review-ui-browser-functional-report.v0.schema.json",
  "surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json"
];

export const DRUI_CONSUMED_SCHEMA_FILES = [
  "designer-workflow-trace-evidence.v0.schema.json",
  "designer-workflow-trace-report.v0.schema.json",
  "review-judgment-evidence.v0.schema.json",
  "surfaceops-decision-ledger.v0.schema.json",
  "surfaceops-kanban-live-evidence.v0.schema.json",
  "surfaceops-kanban-live-operation-plan.v0.schema.json",
  "diagnostics.v0.schema.json"
];

export const DRUI_GENERATED_ARTIFACTS = [
  "surfaceops-designer-review-ui-target-selection.json",
  "surfaceops-designer-review-workbench.json",
  "surfaceops-designer-review-decision-receipt.json",
  "surfaceops-designer-review-ui-report.json",
  "evidence.json"
];

export const DRUI_ARTIFACT_PATHS = DRUI_GENERATED_ARTIFACTS.map((file) => `${DRUI_ARTIFACT_ROOT}/${file}`);

export const DRUI_DIAGNOSTIC_ROWS = [
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_MISSING", "Required designer review UI upstream evidence is missing.", "preflight", "mutations/missing-upstream-evidence.surfaceops-designer-review-ui.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_HASH_MISMATCH", "Designer review UI upstream hash does not match the accepted boundary.", "preflight", "mutations/upstream-hash-mismatch.surfaceops-designer-review-ui.json", "/upstreamRefs"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_TARGET_UNDECLARED", "SurfaceOps designer review UI target is not declared.", "target-selection", "invalid/target-undeclared.surfaceops-designer-review-ui.json", "/targetId"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_REF_MISSING", "Designer review UI requires exact evidence refs before decisions are enabled.", "workbench", "invalid/missing-evidence-ref.surfaceops-designer-review-ui.json", "/evidenceRefs"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_AUTHORITY_OVERRIDE", "Designer review UI must not let kanban.cards override SurfaceOps decisions.", "authority", "invalid/authority-override.surfaceops-designer-review-ui.json", "/authority"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_HIDDEN_DECISION", "Designer review UI decisions must be visible in the receipt and evidence refs.", "decision", "invalid/hidden-decision.surfaceops-designer-review-ui.json", "/decision"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_MIRROR_STATUS_INVALID", "Mirrored kanban status must be derived from the SurfaceOps decision receipt.", "mirror", "invalid/mirror-status-override.surfaceops-designer-review-ui.json", "/mirroredStatus"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN", "Production adapter behavior is outside the designer review UI proof.", "boundary", "invalid/production-adapter-claim.surfaceops-designer-review-ui.json", "/claims"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_LIVE_KANBAN_REQUIRED", "Designer review UI needs the local live kanban adapter evidence before browser proof.", "live-boundary", "review/live-kanban-required.surfaceops-designer-review-ui.json", "/kanbanMirror", {
    severity: "review",
    validationResult: "review_required",
    promotionStatus: "review_required"
  }),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_HASH_MISMATCH", "Designer review UI evidence hash does not match the evidence manifest.", "evidence", "mutations/hash-mismatch.surfaceops-designer-review-ui-evidence.json", "/artifacts")
];

export const DRUI_EXPECTATION_ROWS = [
  expectation("valid/button-variants-workbench.surfaceops-designer-review-ui.json", "valid", "allowed", []),
  expectation("valid/decision-receipt.surfaceops-designer-review-ui.json", "valid", "allowed", []),
  expectation("valid/kanban-mirror.surfaceops-designer-review-ui.json", "valid", "allowed", []),
  expectation("review/live-kanban-required.surfaceops-designer-review-ui.json", "review_required", "review_required", ["SURFACEOPS_DESIGNER_REVIEW_LIVE_KANBAN_REQUIRED"]),
  expectation("invalid/target-undeclared.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_TARGET_UNDECLARED"]),
  expectation("invalid/missing-evidence-ref.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_REF_MISSING"]),
  expectation("invalid/authority-override.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_AUTHORITY_OVERRIDE"]),
  expectation("invalid/hidden-decision.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_HIDDEN_DECISION"]),
  expectation("invalid/mirror-status-override.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_MIRROR_STATUS_INVALID"]),
  expectation("invalid/production-adapter-claim.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN"]),
  expectation("mutations/missing-upstream-evidence.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_MISSING"]),
  expectation("mutations/upstream-hash-mismatch.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/hash-mismatch.surfaceops-designer-review-ui-evidence.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_HASH_MISMATCH"])
];

export async function materializeSurfaceopsDesignerReviewUiContract(cwd) {
  const schemas = buildSurfaceopsDesignerReviewUiSchemas();
  for (const file of DRUI_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, DRUI_SCHEMA_ROOT, file), schemas[file]);
  }
  const fixtures = buildSurfaceopsDesignerReviewUiFixtures();
  for (const [file, fixture] of fixtures.entries()) {
    await writeCanonicalJson(path.join(cwd, DRUI_FIXTURE_ROOT, file), fixture);
  }
}

export function buildSurfaceopsDesignerReviewUiFixtures() {
  const fixtures = new Map();
  fixtures.set("expectations.manifest.json", buildExpectationsManifest());
  fixtures.set("target-selection.fixture.json", buildTargetSelectionFixture());
  for (const row of DRUI_EXPECTATION_ROWS) {
    const fixturePath = row.fixturePath.slice(`${DRUI_FIXTURE_ROOT}/`.length);
    fixtures.set(fixturePath, buildFixture(row));
  }
  return fixtures;
}

export function buildExpectationsManifest() {
  return {
    schemaId: "surfaceops-designer-review-ui-expectations.v0",
    version: DRUI_VERSION,
    targetId: DRUI_TARGET_ID,
    command: DRUI_COMMAND,
    fixtureRoot: DRUI_FIXTURE_ROOT,
    artifactRoot: DRUI_ARTIFACT_ROOT,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required",
      totalResults: DRUI_EXPECTATION_ROWS.length,
      matchedResults: DRUI_EXPECTATION_ROWS.length
    },
    generatedArtifacts: DRUI_ARTIFACT_PATHS,
    expectedResults: DRUI_EXPECTATION_ROWS,
    provenance: provenance("surfaceops-designer-review-ui-expectations", ["plans/surfaceops-button-variants-journey.md"])
  };
}

export function buildTargetSelectionFixture() {
  return {
    schemaId: "surfaceops-designer-review-ui-target-selection.v0",
    version: DRUI_VERSION,
    targetId: DRUI_TARGET_ID,
    scenarioId: DRUI_SCENARIO_ID,
    componentId: DRUI_COMPONENT_ID,
    reviewSurface: "surfaceops-designer-review-workbench",
    kanbanSurface: "kanban.cards-local-live-board",
    claimStatus: "local_live_review_ui_proof",
    authority: authorityBoundary(),
    outcomeStates: ["needs review", "needs refinement", "approved for handoff", "blocked"],
    upstreamRefs: defaultUpstreamRefs(),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("surfaceops-designer-review-ui-target-selection-fixture", ["VISION.md"])
  };
}

function buildFixture(row) {
  const code = row.expectedDiagnosticCodes[0] || null;
  return {
    schemaId: "surfaceops-designer-review-ui-fixture.v0",
    version: DRUI_VERSION,
    fixtureId: row.fixturePath.split("/").pop().replace(/\.surfaceops-designer-review-ui(?:-evidence)?\.json$/, ""),
    scenarioId: DRUI_SCENARIO_ID,
    targetId: code === "SURFACEOPS_DESIGNER_REVIEW_TARGET_UNDECLARED" ? null : DRUI_TARGET_ID,
    componentId: DRUI_COMPONENT_ID,
    expectedResult: row.expectedResult,
    expectedPromotionStatus: row.promotionStatus,
    diagnosticCodes: row.expectedDiagnosticCodes,
    evidenceRefs: code === "SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_REF_MISSING" ? [] : defaultUpstreamRefs(),
    authorityOverride: code === "SURFACEOPS_DESIGNER_REVIEW_AUTHORITY_OVERRIDE",
    hiddenDecision: code === "SURFACEOPS_DESIGNER_REVIEW_HIDDEN_DECISION",
    mirrorStatusOverride: code === "SURFACEOPS_DESIGNER_REVIEW_MIRROR_STATUS_INVALID",
    productionAdapterClaim: code === "SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN",
    liveKanbanRequired: code === "SURFACEOPS_DESIGNER_REVIEW_LIVE_KANBAN_REQUIRED",
    mutation: row.fixturePath.includes("/mutations/") ? code : null,
    provenance: provenance("surfaceops-designer-review-ui-fixture", [row.fixturePath])
  };
}

export function buildSurfaceopsDesignerReviewUiSchemas() {
  const common = {
    version: { const: DRUI_VERSION },
    provenance: provenanceSchema()
  };
  const artifactRef = artifactRefSchema();
  const diagnostics = { type: "array", items: diagnosticSchema() };
  return {
    "surfaceops-designer-review-ui-target-selection.v0.schema.json": objectSchema("surfaceops-designer-review-ui-target-selection.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-ui-target-selection.v0" },
      targetId: { const: DRUI_TARGET_ID },
      scenarioId: { const: DRUI_SCENARIO_ID },
      componentId: { const: DRUI_COMPONENT_ID },
      reviewSurface: { type: "string" },
      kanbanSurface: { type: "string" },
      claimStatus: { const: "local_live_review_ui_proof" },
      authority: authoritySchema(),
      outcomeStates: { type: "array", minItems: 4, items: { type: "string" } },
      upstreamRefs: { type: "array", minItems: 1, items: artifactRef },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "targetId", "scenarioId", "componentId", "reviewSurface", "kanbanSurface", "claimStatus", "authority", "outcomeStates", "upstreamRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-designer-review-workbench.v0.schema.json": objectSchema("surfaceops-designer-review-workbench.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-workbench.v0" },
      scenarioId: { const: DRUI_SCENARIO_ID },
      targetSelectionRef: artifactRef,
      workItem: objectAny(),
      dag: objectSchema(null, {
        nodes: { type: "array", minItems: 4, items: objectAny() },
        edges: { type: "array", minItems: 3, items: objectAny() }
      }, ["nodes", "edges"]),
      inspector: objectAny(),
      decisionPanel: objectAny(),
      kanbanMirror: objectAny(),
      authority: authoritySchema(),
      evidenceRefs: { type: "array", minItems: 1, items: artifactRef },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "scenarioId", "targetSelectionRef", "workItem", "dag", "inspector", "decisionPanel", "kanbanMirror", "authority", "evidenceRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-designer-review-decision-receipt.v0.schema.json": objectSchema("surfaceops-designer-review-decision-receipt.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-decision-receipt.v0" },
      scenarioId: { const: DRUI_SCENARIO_ID },
      workbenchRef: artifactRef,
      decisionId: { type: "string" },
      decisionState: { enum: ["needs refinement", "approved for handoff", "blocked"] },
      selectedVariantId: { type: "string" },
      rationale: { type: "string", minLength: 1 },
      reviewer: { type: "string" },
      mirroredKanbanStatus: { enum: ["needs refinement", "approved for handoff", "blocked"] },
      variantOfRecord: objectAny(),
      handoffEligibility: objectAny(),
      evidenceRefs: { type: "array", minItems: 1, items: artifactRef },
      mediaRefs: { type: "array", minItems: 1, items: objectAny() },
      authority: authoritySchema()
    }, ["schemaId", "version", "scenarioId", "workbenchRef", "decisionId", "decisionState", "selectedVariantId", "rationale", "reviewer", "mirroredKanbanStatus", "variantOfRecord", "handoffEligibility", "evidenceRefs", "mediaRefs", "authority", "provenance"]),
    "surfaceops-designer-review-ui-report.v0.schema.json": reportSchema(common, artifactRef, diagnostics),
    "surfaceops-designer-review-ui-evidence.v0.schema.json": evidenceSchema(common, artifactRef, diagnostics),
    "surfaceops-designer-review-ui-expectations.v0.schema.json": objectSchema("surfaceops-designer-review-ui-expectations.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-ui-expectations.v0" },
      targetId: { const: DRUI_TARGET_ID },
      command: { const: DRUI_COMMAND },
      fixtureRoot: { const: DRUI_FIXTURE_ROOT },
      artifactRoot: { const: DRUI_ARTIFACT_ROOT },
      runExpectation: objectAny(),
      generatedArtifacts: { type: "array", items: { type: "string" } },
      expectedResults: { type: "array", items: expectationSchema() }
    }, ["schemaId", "version", "targetId", "command", "fixtureRoot", "artifactRoot", "runExpectation", "generatedArtifacts", "expectedResults", "provenance"]),
    "surfaceops-designer-review-ui-fixture.v0.schema.json": fixtureSchema(),
    "surfaceops-designer-review-ui-diagnostics.v0.schema.json": objectSchema("surfaceops-designer-review-ui-diagnostics.v0", {
      schemaId: { const: "surfaceops-designer-review-ui-diagnostics.v0" },
      version: { const: DRUI_VERSION },
      diagnostics,
      provenance: provenanceSchema()
    }, ["schemaId", "version", "diagnostics", "provenance"]),
    "surfaceops-designer-review-ui-browser-functional-report.v0.schema.json": browserReportSchema(),
    "surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json": browserEvidenceSchema()
  };
}

function reportSchema(common, artifactRef, diagnostics) {
  return objectSchema("surfaceops-designer-review-ui-report.v0", {
    ...common,
    schemaId: { const: "surfaceops-designer-review-ui-report.v0" },
    runId: { type: "string" },
    targetId: { const: DRUI_TARGET_ID },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    upstreamPreflight: objectAny(),
    artifactRefs: { type: "array", minItems: 1, items: artifactRef },
    validationResults: { type: "array", items: validationResultSchema() },
    diagnostics,
    diagnosticsRegistry: diagnostics
  }, ["schemaId", "version", "runId", "targetId", "status", "promotionStatus", "upstreamPreflight", "artifactRefs", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function evidenceSchema(common, artifactRef, diagnostics) {
  return objectSchema("surfaceops-designer-review-ui-evidence.v0", {
    ...common,
    schemaId: { const: "surfaceops-designer-review-ui-evidence.v0" },
    runId: { type: "string" },
    contractId: { const: DRUI_CONTRACT_ID },
    targetId: { const: DRUI_TARGET_ID },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    command: { const: DRUI_COMMAND },
    args: objectAny(),
    checkedAt: { const: DRUI_TIMESTAMP },
    environment: objectSchema(null, { generatedAt: { const: DRUI_TIMESTAMP }, host: { type: "null" } }, ["generatedAt", "host"]),
    schemaClosure: { type: "array", items: artifactRef },
    fixtureRefs: { type: "array", items: artifactRef },
    boundaryRefs: { type: "array", items: artifactRef },
    artifacts: { type: "array", items: artifactRef },
    validationResults: { type: "array", items: validationResultSchema() },
    diagnostics,
    diagnosticsRegistry: diagnostics
  }, ["schemaId", "version", "runId", "contractId", "targetId", "status", "promotionStatus", "command", "args", "checkedAt", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function browserReportSchema() {
  const fileRef = browserFileRefSchema();
  return objectSchema("surfaceops-designer-review-ui-browser-functional-report.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-browser-functional-report.v0" },
    version: { const: DRUI_VERSION },
    targetId: { const: DRUI_TARGET_ID },
    scenarioId: { const: DRUI_SCENARIO_ID },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    command: { type: "string" },
    deterministicEvidenceRef: artifactRefSchema(),
    kanbanRuntime: objectAny(),
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    steps: { type: "array", minItems: 1, items: objectAny() },
    mirrorResult: objectAny(),
    recordingRef: fileRef,
    screenshotRef: fileRef,
    transcriptRef: fileRef,
    apiExchangeRef: fileRef,
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "status", "promotionStatus", "command", "deterministicEvidenceRef", "kanbanRuntime", "assertions", "steps", "mirrorResult", "recordingRef", "screenshotRef", "transcriptRef", "apiExchangeRef", "provenance"]);
}

function browserEvidenceSchema() {
  const fileRef = browserFileRefSchema();
  return objectSchema("surfaceops-designer-review-ui-browser-functional-evidence.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-browser-functional-evidence.v0" },
    version: { const: DRUI_VERSION },
    targetId: { const: DRUI_TARGET_ID },
    scenarioId: { const: DRUI_SCENARIO_ID },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    command: { type: "string" },
    checkedAt: { type: "string" },
    environment: objectAny(),
    deterministicEvidenceRef: artifactRefSchema(),
    reportRef: fileRef,
    recordingRef: fileRef,
    screenshotRef: fileRef,
    transcriptRef: fileRef,
    apiExchangeRef: fileRef,
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    mirrorResult: objectAny(),
    selfHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "status", "promotionStatus", "command", "checkedAt", "environment", "deterministicEvidenceRef", "reportRef", "recordingRef", "screenshotRef", "transcriptRef", "apiExchangeRef", "assertions", "mirrorResult", "selfHash", "provenance"]);
}

function fixtureSchema() {
  return objectSchema("surfaceops-designer-review-ui-fixture.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-fixture.v0" },
    version: { const: DRUI_VERSION },
    fixtureId: { type: "string" },
    scenarioId: { const: DRUI_SCENARIO_ID },
    targetId: { type: ["string", "null"] },
    componentId: { const: DRUI_COMPONENT_ID },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    expectedPromotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    evidenceRefs: { type: "array", items: artifactRefSchema() },
    authorityOverride: { type: "boolean" },
    hiddenDecision: { type: "boolean" },
    mirrorStatusOverride: { type: "boolean" },
    productionAdapterClaim: { type: "boolean" },
    liveKanbanRequired: { type: "boolean" },
    mutation: { type: ["string", "null"] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "scenarioId", "targetId", "componentId", "expectedResult", "expectedPromotionStatus", "diagnosticCodes", "evidenceRefs", "authorityOverride", "hiddenDecision", "mirrorStatusOverride", "productionAdapterClaim", "liveKanbanRequired", "mutation", "provenance"]);
}

function authorityBoundary() {
  return {
    surfaceOpsOwnsReviewDecision: true,
    kanbanCardsOwnsCollaborationState: true,
    kanbanLaneMovementCommitsDecision: false,
    surfacesEvidenceRemainsProofAuthority: true,
    productionAdapterImplemented: false
  };
}

function authoritySchema() {
  return objectSchema(null, {
    surfaceOpsOwnsReviewDecision: { const: true },
    kanbanCardsOwnsCollaborationState: { const: true },
    kanbanLaneMovementCommitsDecision: { const: false },
    surfacesEvidenceRemainsProofAuthority: { const: true },
    productionAdapterImplemented: { const: false }
  }, ["surfaceOpsOwnsReviewDecision", "kanbanCardsOwnsCollaborationState", "kanbanLaneMovementCommitsDecision", "surfacesEvidenceRemainsProofAuthority", "productionAdapterImplemented"]);
}

export function defaultUpstreamRefs() {
  return [
    artifactRef(DRUI_DWT_EVIDENCE_PATH, "designer-workflow-trace-evidence.v0", DRUI_ACCEPTED_DWT_EVIDENCE_HASH),
    artifactRef(DRUI_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", DRUI_ACCEPTED_P4_EVIDENCE_HASH),
    artifactRef(DRUI_KANBAN_LIVE_EVIDENCE_PATH, "surfaceops-kanban-live-evidence.v0", DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH)
  ];
}

export function diagnosticsRegistry() {
  return DRUI_DIAGNOSTIC_ROWS.map((row) => ({ ...row }));
}

export function diagnosticForCode(code, overrides = {}) {
  const base = DRUI_DIAGNOSTIC_ROWS.find((row) => row.code === code);
  if (!base) throw new Error(`Unknown SurfaceOps designer review UI diagnostic: ${code}`);
  return {
    ...base,
    message: base.canonicalMessage,
    suggestedAction: suggestedActionForCode(code),
    ...overrides
  };
}

function diagnosticRow(code, canonicalMessage, stage, fixtureCoverage, jsonPointer, overrides = {}) {
  return {
    code,
    trigger: canonicalMessage,
    canonicalMessage,
    message: canonicalMessage,
    severity: overrides.severity || "error",
    stage,
    phase: "surfaceops-designer-review-ui",
    validationResult: overrides.validationResult || "invalid",
    promotionStatus: overrides.promotionStatus || "blocked",
    artifactPath: `${DRUI_FIXTURE_ROOT}/${fixtureCoverage}`,
    jsonPointer,
    sourceRef: null,
    fixtureCoverage,
    suggestedAction: suggestedActionForCode(code)
  };
}

function expectation(fixture, expectedResult, promotionStatus, expectedDiagnosticCodes) {
  return {
    fixturePath: `${DRUI_FIXTURE_ROOT}/${fixture}`,
    expectedResult,
    promotionStatus,
    expectedDiagnosticCodes,
    stage: fixture.includes("/mutations/") ? "preflight" : fixture.includes("/review/") ? "review" : fixture.includes("/invalid/") ? "validation" : "validation"
  };
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM")) return "Regenerate accepted designer workflow, P4, and kanban-live evidence before continuing.";
  if (code.includes("LIVE_KANBAN")) return "Run the local-live kanban proof and browser proof before claiming the designer review UI loop.";
  if (code.includes("MIRROR")) return "Mirror only the structured SurfaceOps decision receipt back to kanban.cards.";
  if (code.includes("PRODUCTION")) return "Keep production auth, hosted persistence, webhooks, and production sync in the later adapter proof.";
  return "Keep SurfaceOps review authority explicit and regenerate designer review UI evidence.";
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

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: DRUI_TIMESTAMP,
    generator,
    sourceRefs
  };
}

export function druiSchemaPaths() {
  return DRUI_SCHEMA_FILES.map((file) => `${DRUI_SCHEMA_ROOT}/${file}`);
}

export function druiConsumedSchemaPaths() {
  return DRUI_CONSUMED_SCHEMA_FILES.map((file) => `${DRUI_SCHEMA_ROOT}/${file}`);
}

export function druiFixturePaths() {
  return [
    `${DRUI_FIXTURE_ROOT}/expectations.manifest.json`,
    `${DRUI_FIXTURE_ROOT}/target-selection.fixture.json`,
    ...DRUI_EXPECTATION_ROWS.map((row) => row.fixturePath)
  ];
}

export function schemaIdForDesignerReviewUiPath(pathValue) {
  const file = pathValue.split("/").pop();
  if (!file) return null;
  if (file.endsWith(".schema.json")) return file.replace(".schema.json", "");
  if (file === "expectations.manifest.json") return "surfaceops-designer-review-ui-expectations.v0";
  if (file === "target-selection.fixture.json") return "surfaceops-designer-review-ui-target-selection.v0";
  if (pathValue.includes(DRUI_FIXTURE_ROOT)) return "surfaceops-designer-review-ui-fixture.v0";
  if (file === "surfaceops-designer-review-ui-target-selection.json") return "surfaceops-designer-review-ui-target-selection.v0";
  if (file === "surfaceops-designer-review-workbench.json") return "surfaceops-designer-review-workbench.v0";
  if (file === "surfaceops-designer-review-decision-receipt.json") return "surfaceops-designer-review-decision-receipt.v0";
  if (file === "surfaceops-designer-review-ui-report.json") return "surfaceops-designer-review-ui-report.v0";
  if (file === "evidence.json") return "surfaceops-designer-review-ui-evidence.v0";
  return null;
}

function objectAny() {
  return { type: "object", additionalProperties: true };
}

function nullableStringSchema() {
  return { type: ["string", "null"] };
}

function artifactRefSchema() {
  return objectSchema(null, {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" },
    sourceRef: nullableStringSchema()
  }, ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"]);
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

function browserAssertionSchema() {
  return objectSchema(null, {
    assertionId: { type: "string" },
    status: { enum: ["pass", "fail"] },
    expected: { type: "string" },
    actual: { type: "string" }
  }, ["assertionId", "status", "expected", "actual"]);
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

function diagnosticSchema() {
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

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: DRUI_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function objectSchema(schemaId, properties, required) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
  if (schemaId) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/surfaceops-designer-review-ui/${schemaId}.schema.json`;
  }
  return schema;
}

export function expectedManifestHash() {
  return sha256Hex(canonicalJson(buildExpectationsManifest()));
}
