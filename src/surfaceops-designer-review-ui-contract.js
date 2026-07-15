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

export const DRUI_ACCEPTED_DWT_EVIDENCE_HASH = "7def46aacc1fddffe685e3e514a2fda9b21e6349b8cf447b30cd139935f51715";
export const DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH = "9b631ba1b22854bb7241eea073c1a182053713385bda4cf5057826fb73807372";
export const DRUI_ACCEPTED_P4_EVIDENCE_HASH = "553ed16729bd0fd3ee7bb385364f1d82b756f236393a85e98f9aa05fdea3201d";

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
  "surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json",
  "surfaceops-designer-review-ui-browser-functional-transcript.v0.schema.json",
  "surfaceops-designer-review-ui-redacted-api-exchange-log.v0.schema.json",
  "surfaceops-designer-review-ui-kanban-binding-runtime.v0.schema.json",
  "surfaceops-designer-review-decision-receipt-runtime.v0.schema.json",
  "surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0.schema.json"
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
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_MISSING", "Required designer review UI upstream evidence is missing.", "preflight", "mutations/missing-upstream-evidence.surfaceops-designer-review-ui.json", "/mutationOperations/0"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_HASH_MISMATCH", "Designer review UI upstream hash does not match the accepted boundary.", "preflight", "mutations/upstream-hash-mismatch.surfaceops-designer-review-ui.json", "/mutationOperations/0"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_TARGET_UNDECLARED", "SurfaceOps designer review UI target is not declared.", "target-selection", "invalid/target-undeclared.surfaceops-designer-review-ui.json", "/candidate/targetId"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_REF_MISSING", "Designer review UI requires exact evidence refs before decisions are enabled.", "workbench", "invalid/missing-evidence-ref.surfaceops-designer-review-ui.json", "/candidate/evidenceRefs"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_AUTHORITY_OVERRIDE", "Designer review UI must not let kanban.cards override SurfaceOps decisions.", "authority", "invalid/authority-override.surfaceops-designer-review-ui.json", "/candidate/authority"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_HIDDEN_DECISION", "Designer review UI decisions must be visible in the receipt and evidence refs.", "decision", "invalid/hidden-decision.surfaceops-designer-review-ui.json", "/candidate/decision"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_MIRROR_STATUS_INVALID", "Mirrored kanban status must be derived from the SurfaceOps decision receipt.", "mirror", "invalid/mirror-status-override.surfaceops-designer-review-ui.json", "/candidate/kanbanMirror/mirroredStatus"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_HANDOFF_WHILE_BLOCKED", "Designer review UI must not approve handoff while upstream governance is blocked.", "governance", "invalid/handoff-while-blocked.surfaceops-designer-review-ui.json", "/candidate/decision/state"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_REFINEMENT_WHILE_BLOCKED", "Designer review UI must not request refinement while upstream governance permits only a blocked outcome.", "governance", "invalid/refinement-while-blocked.surfaceops-designer-review-ui.json", "/candidate/decision/state"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN", "Production adapter behavior is outside the designer review UI proof.", "boundary", "invalid/production-adapter-claim.surfaceops-designer-review-ui.json", "/candidate/boundaryClaims"),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_LIVE_KANBAN_REQUIRED", "Designer review UI needs the local live kanban adapter evidence before browser proof.", "live-boundary", "review/live-kanban-required.surfaceops-designer-review-ui.json", "/candidate/liveKanbanBoundary", {
    severity: "review",
    validationResult: "review_required",
    promotionStatus: "review_required"
  }),
  diagnosticRow("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_HASH_MISMATCH", "Designer review UI evidence hash does not match the evidence manifest.", "evidence", "mutations/hash-mismatch.surfaceops-designer-review-ui-evidence.json", "/mutationOperations/0")
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
  expectation("invalid/handoff-while-blocked.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_HANDOFF_WHILE_BLOCKED"]),
  expectation("invalid/refinement-while-blocked.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_REFINEMENT_WHILE_BLOCKED"]),
  expectation("invalid/production-adapter-claim.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN"]),
  expectation("mutations/missing-upstream-evidence.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_MISSING"]),
  expectation("mutations/upstream-hash-mismatch.surfaceops-designer-review-ui.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/hash-mismatch.surfaceops-designer-review-ui-evidence.json", "invalid", "blocked", ["SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_HASH_MISMATCH"])
];

export const DRUI_FIXTURE_CASES = [
  fixtureCase("valid/button-variants-workbench.surfaceops-designer-review-ui.json", "blocked-workbench"),
  fixtureCase("valid/decision-receipt.surfaceops-designer-review-ui.json", "blocked-decision-receipt"),
  fixtureCase("valid/kanban-mirror.surfaceops-designer-review-ui.json", "blocked-kanban-mirror"),
  fixtureCase("review/live-kanban-required.surfaceops-designer-review-ui.json", "local-live-kanban-boundary", {
    liveKanbanBoundary: { evidenceAvailable: false }
  }),
  fixtureCase("invalid/target-undeclared.surfaceops-designer-review-ui.json", "target-selection", {
    targetId: null
  }),
  fixtureCase("invalid/missing-evidence-ref.surfaceops-designer-review-ui.json", "evidence-binding", {
    evidenceRefs: []
  }),
  fixtureCase("invalid/authority-override.surfaceops-designer-review-ui.json", "authority-boundary", {
    authority: {
      surfaceOpsOwnsReviewDecision: false,
      kanbanLaneMovementCommitsDecision: true
    }
  }),
  fixtureCase("invalid/hidden-decision.surfaceops-designer-review-ui.json", "decision-visibility", {
    decision: {
      visibleInReceipt: false,
      referencedByEvidence: false
    }
  }),
  fixtureCase("invalid/mirror-status-override.surfaceops-designer-review-ui.json", "mirror-derivation", {
    kanbanMirror: {
      mirroredStatus: "approved for handoff",
      derivedFromDecisionReceipt: false
    }
  }),
  fixtureCase("invalid/handoff-while-blocked.surfaceops-designer-review-ui.json", "blocked-handoff", {
    decision: { state: "approved for handoff" },
    kanbanMirror: {
      mirroredStatus: "approved for handoff",
      derivedFromDecisionReceipt: true
    }
  }),
  fixtureCase("invalid/refinement-while-blocked.surfaceops-designer-review-ui.json", "blocked-refinement", {
    decision: { state: "needs refinement" },
    kanbanMirror: {
      mirroredStatus: "needs refinement",
      derivedFromDecisionReceipt: true
    }
  }),
  fixtureCase("invalid/production-adapter-claim.surfaceops-designer-review-ui.json", "production-adapter-boundary", {
    boundaryClaims: { productionAdapterImplemented: true }
  }),
  fixtureCase("mutations/missing-upstream-evidence.surfaceops-designer-review-ui.json", "upstream-presence", {
    mutationOperations: [{ op: "remove-document", documentPath: DRUI_DWT_EVIDENCE_PATH, jsonPointer: null, value: null }]
  }),
  fixtureCase("mutations/upstream-hash-mismatch.surfaceops-designer-review-ui.json", "upstream-integrity", {
    mutationOperations: [{ op: "replace", documentPath: DRUI_DWT_EVIDENCE_PATH, jsonPointer: "/artifacts/2/hash", value: "0".repeat(64) }]
  }),
  fixtureCase("mutations/hash-mismatch.surfaceops-designer-review-ui-evidence.json", "evidence-self-integrity", {
    mutationOperations: [{ op: "replace", documentPath: `${DRUI_ARTIFACT_ROOT}/evidence.json`, jsonPointer: "/artifacts/4/hash", value: "f".repeat(64) }]
  })
];

export const DRUI_PROOF_FOCUS_VALUES = DRUI_FIXTURE_CASES.map((fixture) => fixture.proofFocus);

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

export function buildSurfaceopsDesignerReviewUiFixtures({ expectationRows = DRUI_EXPECTATION_ROWS } = {}) {
  assertFixtureCaseAlignment(expectationRows);
  const fixtures = new Map();
  fixtures.set("expectations.manifest.json", buildExpectationsManifest(expectationRows));
  fixtures.set("target-selection.fixture.json", buildTargetSelectionFixture());
  for (const fixtureCaseRow of DRUI_FIXTURE_CASES) {
    const fixturePath = fixtureCaseRow.fixturePath.slice(`${DRUI_FIXTURE_ROOT}/`.length);
    fixtures.set(fixturePath, buildFixture(fixtureCaseRow));
  }
  return fixtures;
}

export function buildExpectationsManifest(expectationRows = DRUI_EXPECTATION_ROWS) {
  return {
    schemaId: "surfaceops-designer-review-ui-expectations.v0",
    version: DRUI_VERSION,
    targetId: DRUI_TARGET_ID,
    command: DRUI_COMMAND,
    fixtureRoot: DRUI_FIXTURE_ROOT,
    artifactRoot: DRUI_ARTIFACT_ROOT,
    runExpectation: {
      status: "pass",
      promotionStatus: "blocked",
      totalResults: expectationRows.length,
      matchedResults: expectationRows.length
    },
    generatedArtifacts: DRUI_ARTIFACT_PATHS,
    expectedResults: expectationRows,
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
    governanceOutcome: governanceOutcome(),
    outcomeStates: ["blocked"],
    upstreamRefs: defaultUpstreamRefs(),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("surfaceops-designer-review-ui-target-selection-fixture", ["VISION.md"])
  };
}

function buildFixture(fixtureCaseRow) {
  const stimulus = fixtureCaseRow.stimulus;
  const decision = {
    state: "blocked",
    visibleInReceipt: true,
    referencedByEvidence: true,
    ...(stimulus.decision || {})
  };
  return {
    schemaId: "surfaceops-designer-review-ui-fixture.v0",
    version: DRUI_VERSION,
    fixtureId: fixtureCaseRow.fixturePath.split("/").pop().replace(/\.surfaceops-designer-review-ui(?:-evidence)?\.json$/, ""),
    scenarioId: DRUI_SCENARIO_ID,
    componentId: DRUI_COMPONENT_ID,
    proofFocus: fixtureCaseRow.proofFocus,
    candidate: {
      targetId: Object.hasOwn(stimulus, "targetId") ? stimulus.targetId : DRUI_TARGET_ID,
      evidenceRefs: Object.hasOwn(stimulus, "evidenceRefs") ? stimulus.evidenceRefs.map((ref) => ({ ...ref })) : defaultUpstreamRefs(),
      authority: { ...authorityBoundary(), ...(stimulus.authority || {}) },
      decision,
      kanbanMirror: {
        mirroredStatus: decision.state,
        derivedFromDecisionReceipt: true,
        ...(stimulus.kanbanMirror || {})
      },
      boundaryClaims: { productionAdapterImplemented: false, ...(stimulus.boundaryClaims || {}) },
      liveKanbanBoundary: { evidenceAvailable: true, ...(stimulus.liveKanbanBoundary || {}) },
      governanceOutcome: governanceOutcome()
    },
    mutationOperations: (stimulus.mutationOperations || []).map((operation) => ({ ...operation })),
    provenance: provenance("surfaceops-designer-review-ui-fixture", [fixtureCaseRow.fixturePath])
  };
}

function fixtureCase(relativePath, proofFocus, stimulus = {}) {
  return {
    fixturePath: `${DRUI_FIXTURE_ROOT}/${relativePath}`,
    proofFocus,
    stimulus
  };
}

function assertFixtureCaseAlignment(expectationRows) {
  const fixturePaths = DRUI_FIXTURE_CASES.map((fixture) => fixture.fixturePath);
  const expectationPaths = expectationRows.map((row) => row.fixturePath);
  if (canonicalJson(fixturePaths) !== canonicalJson(expectationPaths)) {
    throw new Error("SurfaceOps designer review UI fixture cases and expectations must be one-to-one and ordered");
  }
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
      governanceOutcome: governanceOutcomeSchema(),
      outcomeStates: exactStringArraySchema(["blocked"]),
      upstreamRefs: { type: "array", minItems: 1, items: artifactRef },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "targetId", "scenarioId", "componentId", "reviewSurface", "kanbanSurface", "claimStatus", "authority", "governanceOutcome", "outcomeStates", "upstreamRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-designer-review-workbench.v0.schema.json": objectSchema("surfaceops-designer-review-workbench.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-workbench.v0" },
      scenarioId: { const: DRUI_SCENARIO_ID },
      targetSelectionRef: artifactRef,
      workItem: workItemSchema(),
      dag: objectSchema(null, {
        nodes: { type: "array", minItems: 4, items: dagNodeSchema() },
        edges: { type: "array", minItems: 3, items: dagEdgeSchema() }
      }, ["nodes", "edges"]),
      inspector: inspectorSchema(),
      decisionPanel: decisionPanelSchema(),
      kanbanMirror: kanbanMirrorSchema(),
      authority: authoritySchema(),
      governanceOutcome: governanceOutcomeSchema(),
      evidenceRefs: { type: "array", minItems: 1, items: artifactRef },
      diagnostics,
      diagnosticsRegistry: diagnostics
    }, ["schemaId", "version", "scenarioId", "targetSelectionRef", "workItem", "dag", "inspector", "decisionPanel", "kanbanMirror", "authority", "governanceOutcome", "evidenceRefs", "diagnostics", "diagnosticsRegistry", "provenance"]),
    "surfaceops-designer-review-decision-receipt.v0.schema.json": objectSchema("surfaceops-designer-review-decision-receipt.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-decision-receipt.v0" },
      scenarioId: { const: DRUI_SCENARIO_ID },
      workbenchRef: artifactRef,
      decisionId: { type: "string" },
      decisionState: { const: "blocked" },
      selectedVariantId: { type: "null" },
      rationale: { type: "string", minLength: 1 },
      reviewer: { type: "string" },
      mirroredKanbanStatus: { const: "blocked" },
      variantOfRecord: { type: "null" },
      handoffEligibility: handoffEligibilitySchema(),
      evidenceRefs: { type: "array", minItems: 1, items: artifactRef },
      mediaRefs: { type: "array", minItems: 1, items: mediaRefSchema() },
      authority: authoritySchema(),
      governanceOutcome: governanceOutcomeSchema()
    }, ["schemaId", "version", "scenarioId", "workbenchRef", "decisionId", "decisionState", "selectedVariantId", "rationale", "reviewer", "mirroredKanbanStatus", "variantOfRecord", "handoffEligibility", "evidenceRefs", "mediaRefs", "authority", "governanceOutcome", "provenance"]),
    "surfaceops-designer-review-ui-report.v0.schema.json": reportSchema(common, artifactRef, diagnostics),
    "surfaceops-designer-review-ui-evidence.v0.schema.json": evidenceSchema(common, artifactRef, diagnostics),
    "surfaceops-designer-review-ui-expectations.v0.schema.json": objectSchema("surfaceops-designer-review-ui-expectations.v0", {
      ...common,
      schemaId: { const: "surfaceops-designer-review-ui-expectations.v0" },
      targetId: { const: DRUI_TARGET_ID },
      command: { const: DRUI_COMMAND },
      fixtureRoot: { const: DRUI_FIXTURE_ROOT },
      artifactRoot: { const: DRUI_ARTIFACT_ROOT },
      runExpectation: runExpectationSchema(),
      generatedArtifacts: exactStringArraySchema(DRUI_ARTIFACT_PATHS),
      expectedResults: fixedLengthArraySchema(DRUI_EXPECTATION_ROWS.length, expectationSchema())
    }, ["schemaId", "version", "targetId", "command", "fixtureRoot", "artifactRoot", "runExpectation", "generatedArtifacts", "expectedResults", "provenance"]),
    "surfaceops-designer-review-ui-fixture.v0.schema.json": fixtureSchema(),
    "surfaceops-designer-review-ui-diagnostics.v0.schema.json": objectSchema("surfaceops-designer-review-ui-diagnostics.v0", {
      schemaId: { const: "surfaceops-designer-review-ui-diagnostics.v0" },
      version: { const: DRUI_VERSION },
      diagnostics,
      provenance: provenanceSchema()
    }, ["schemaId", "version", "diagnostics", "provenance"]),
    "surfaceops-designer-review-ui-browser-functional-report.v0.schema.json": browserReportSchema(),
    "surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json": browserEvidenceSchema(),
    "surfaceops-designer-review-ui-browser-functional-transcript.v0.schema.json": browserTranscriptSchema(),
    "surfaceops-designer-review-ui-redacted-api-exchange-log.v0.schema.json": redactedApiExchangeLogSchema(),
    "surfaceops-designer-review-ui-kanban-binding-runtime.v0.schema.json": runtimeKanbanBindingSchema(),
    "surfaceops-designer-review-decision-receipt-runtime.v0.schema.json": runtimeDecisionReceiptSchema(),
    "surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0.schema.json": browserMirrorResultSchema("surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0")
  };
}

function reportSchema(common, artifactRef, diagnostics) {
  const proofDiagnostics = fixedLengthArraySchema(DRUI_DIAGNOSTIC_ROWS.length, diagnosticSchema());
  return objectSchema("surfaceops-designer-review-ui-report.v0", {
    ...common,
    schemaId: { const: "surfaceops-designer-review-ui-report.v0" },
    runId: { type: "string" },
    targetId: { const: DRUI_TARGET_ID },
    status: { const: "pass" },
    promotionStatus: { const: "blocked" },
    governanceOutcome: governanceOutcomeSchema(),
    upstreamPreflight: upstreamPreflightSchema(),
    artifactRefs: fixedLengthArraySchema(3, artifactRef),
    validationResults: fixedLengthArraySchema(DRUI_EXPECTATION_ROWS.length, validationResultSchema({ matched: true })),
    diagnostics: proofDiagnostics,
    diagnosticsRegistry: proofDiagnostics
  }, ["schemaId", "version", "runId", "targetId", "status", "promotionStatus", "governanceOutcome", "upstreamPreflight", "artifactRefs", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function evidenceSchema(common, artifactRef, diagnostics) {
  const proofDiagnostics = fixedLengthArraySchema(DRUI_DIAGNOSTIC_ROWS.length, diagnosticSchema());
  return objectSchema("surfaceops-designer-review-ui-evidence.v0", {
    ...common,
    schemaId: { const: "surfaceops-designer-review-ui-evidence.v0" },
    runId: { type: "string" },
    contractId: { const: DRUI_CONTRACT_ID },
    targetId: { const: DRUI_TARGET_ID },
    status: { const: "pass" },
    promotionStatus: { const: "blocked" },
    governanceOutcome: governanceOutcomeSchema(),
    command: { const: DRUI_COMMAND },
    args: proofArgsSchema(),
    checkedAt: { const: DRUI_TIMESTAMP },
    environment: objectSchema(null, { generatedAt: { const: DRUI_TIMESTAMP }, host: { type: "null" } }, ["generatedAt", "host"]),
    schemaClosure: fixedLengthArraySchema(DRUI_SCHEMA_FILES.length + DRUI_CONSUMED_SCHEMA_FILES.length, artifactRef),
    fixtureRefs: fixedLengthArraySchema(DRUI_FIXTURE_CASES.length + 2, artifactRef),
    boundaryRefs: fixedLengthArraySchema(6, artifactRef),
    artifacts: fixedLengthArraySchema(DRUI_ARTIFACT_PATHS.length, artifactRef),
    validationResults: fixedLengthArraySchema(DRUI_EXPECTATION_ROWS.length, validationResultSchema({ matched: true })),
    diagnostics: proofDiagnostics,
    diagnosticsRegistry: proofDiagnostics
  }, ["schemaId", "version", "runId", "contractId", "targetId", "status", "promotionStatus", "governanceOutcome", "command", "args", "checkedAt", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "validationResults", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function browserReportSchema() {
  const fileRef = browserFileRefSchema();
  return objectSchema("surfaceops-designer-review-ui-browser-functional-report.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-browser-functional-report.v0" },
    version: { const: DRUI_VERSION },
    targetId: { const: DRUI_TARGET_ID },
    scenarioId: { const: DRUI_SCENARIO_ID },
    status: { const: "pass" },
    promotionStatus: { const: "blocked" },
    governanceOutcome: governanceOutcomeSchema(),
    command: { type: "string" },
    deterministicEvidenceRef: artifactRefSchema(),
    kanbanBindingRef: fileRef,
    runtimeDecisionReceiptRef: fileRef,
    kanbanMirrorResultRef: fileRef,
    kanbanRuntime: kanbanRuntimeSchema(),
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    steps: { type: "array", minItems: 1, items: browserStepSchema() },
    mirrorResult: browserMirrorResultSchema(),
    recordingRef: fileRef,
    screenshotRef: fileRef,
    transcriptRef: fileRef,
    apiExchangeRef: fileRef,
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "status", "promotionStatus", "governanceOutcome", "command", "deterministicEvidenceRef", "kanbanBindingRef", "runtimeDecisionReceiptRef", "kanbanMirrorResultRef", "kanbanRuntime", "assertions", "steps", "mirrorResult", "recordingRef", "screenshotRef", "transcriptRef", "apiExchangeRef", "provenance"]);
}

function browserEvidenceSchema() {
  const fileRef = browserFileRefSchema();
  return objectSchema("surfaceops-designer-review-ui-browser-functional-evidence.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-browser-functional-evidence.v0" },
    version: { const: DRUI_VERSION },
    targetId: { const: DRUI_TARGET_ID },
    scenarioId: { const: DRUI_SCENARIO_ID },
    status: { const: "pass" },
    promotionStatus: { const: "blocked" },
    governanceOutcome: governanceOutcomeSchema(),
    command: { type: "string" },
    checkedAt: { type: "string" },
    environment: browserEnvironmentSchema(),
    deterministicEvidenceRef: artifactRefSchema(),
    kanbanBindingRef: fileRef,
    runtimeDecisionReceiptRef: fileRef,
    kanbanMirrorResultRef: fileRef,
    reportRef: fileRef,
    recordingRef: fileRef,
    screenshotRef: fileRef,
    transcriptRef: fileRef,
    apiExchangeRef: fileRef,
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    mirrorResult: browserMirrorResultSchema(),
    selfHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "scenarioId", "status", "promotionStatus", "governanceOutcome", "command", "checkedAt", "environment", "deterministicEvidenceRef", "kanbanBindingRef", "runtimeDecisionReceiptRef", "kanbanMirrorResultRef", "reportRef", "recordingRef", "screenshotRef", "transcriptRef", "apiExchangeRef", "assertions", "mirrorResult", "selfHash", "provenance"]);
}

function browserTranscriptSchema() {
  return objectSchema("surfaceops-designer-review-ui-browser-functional-transcript.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-browser-functional-transcript.v0" },
    version: { const: DRUI_VERSION },
    scenarioId: { const: DRUI_SCENARIO_ID },
    targetId: { const: DRUI_TARGET_ID },
    steps: { type: "array", minItems: 1, items: browserStepSchema() },
    assertions: { type: "array", minItems: 1, items: browserAssertionSchema() },
    tokensRedacted: { const: true }
  }, ["schemaId", "version", "scenarioId", "targetId", "steps", "assertions", "tokensRedacted"]);
}

function redactedApiExchangeLogSchema() {
  const common = {
    stepId: { type: "string", minLength: 1 },
    method: { enum: ["GET", "POST", "PATCH"] },
    route: { type: "string", minLength: 1 },
    response: { type: "string" }
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://surfaces.dev/schemas/surfaceops-designer-review-ui/surfaceops-designer-review-ui-redacted-api-exchange-log.v0.schema.json",
    type: "array",
    minItems: 1,
    items: {
      oneOf: [
        objectSchema(null, {
          ...common,
          status: { const: "pass" }
        }, ["stepId", "method", "route", "status", "response"]),
        objectSchema(null, {
          ...common,
          status: { type: "integer", minimum: 100, maximum: 599 }
        }, ["stepId", "method", "route", "status", "response"]),
        objectSchema(null, {
          ...common,
          status: { const: "pass" },
          actor: { const: "surfaceops-server" }
        }, ["stepId", "method", "route", "status", "actor", "response"])
      ]
    }
  };
}

function runtimeKanbanBindingSchema() {
  return objectSchema("surfaceops-designer-review-ui-kanban-binding-runtime.v0", {
    bindingId: { type: "string", minLength: 1 },
    boardId: { type: "string", minLength: 1 },
    cardId: { type: "string", minLength: 1 },
    reviewUrl: { const: "http://127.0.0.1:<redacted-port>/review/<bindingId>" },
    evidenceHash: sha256Schema()
  }, ["bindingId", "boardId", "cardId", "reviewUrl", "evidenceHash"]);
}

function runtimeDecisionReceiptSchema() {
  return objectSchema("surfaceops-designer-review-decision-receipt-runtime.v0", {
    schemaId: { const: "surfaceops-designer-review-decision-receipt-runtime.v0" },
    receiptId: { type: "string", minLength: 1 },
    reviewItemId: { const: "review-item.button.primary" },
    componentId: { const: DRUI_COMPONENT_ID },
    decisionStatus: { const: "blocked" },
    mirroredStatus: { const: "blocked" },
    selectedVariantId: { type: "null" },
    variantOfRecord: { type: "null" },
    rationale: { type: "string", minLength: 8 },
    evidenceHash: sha256Schema(),
    diagnosticCode: { const: "SOURCE_REVIEW_EXPIRED" },
    renewalRequiredBeforeHandoff: { const: true },
    governanceOutcome: governanceOutcomeSchema(),
    handoffEligibility: handoffEligibilitySchema(),
    evidenceRefs: fixedLengthArraySchema(3, artifactRefSchema()),
    kanbanBinding: objectSchema(null, {
      boardId: { type: "string", minLength: 1 },
      cardId: { type: "string", minLength: 1 },
      bindingId: { type: "string", minLength: 1 }
    }, ["boardId", "cardId", "bindingId"]),
    authority: objectSchema(null, {
      surfaceopsOwnsDecision: { const: true },
      kanbanCardsOwnsDecision: { const: false }
    }, ["surfaceopsOwnsDecision", "kanbanCardsOwnsDecision"]),
    nonExecutable: { const: true },
    selfHash: sha256Schema()
  }, ["schemaId", "receiptId", "reviewItemId", "componentId", "decisionStatus", "mirroredStatus", "selectedVariantId", "variantOfRecord", "rationale", "evidenceHash", "diagnosticCode", "renewalRequiredBeforeHandoff", "governanceOutcome", "handoffEligibility", "evidenceRefs", "kanbanBinding", "authority", "nonExecutable", "selfHash"]);
}

function fixtureSchema() {
  return objectSchema("surfaceops-designer-review-ui-fixture.v0", {
    schemaId: { const: "surfaceops-designer-review-ui-fixture.v0" },
    version: { const: DRUI_VERSION },
    fixtureId: { type: "string" },
    scenarioId: { const: DRUI_SCENARIO_ID },
    componentId: { const: DRUI_COMPONENT_ID },
    proofFocus: { enum: DRUI_PROOF_FOCUS_VALUES },
    candidate: fixtureCandidateSchema(),
    mutationOperations: { type: "array", items: mutationOperationSchema() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "scenarioId", "componentId", "proofFocus", "candidate", "mutationOperations", "provenance"]);
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

export function governanceOutcome() {
  return {
    status: "blocked",
    targetHandoffAllowed: false,
    sourceExceptionStatus: "expired-blocked",
    renewalRequiredBeforeHandoff: true,
    blockingDiagnosticCodes: ["SOURCE_REVIEW_EXPIRED"]
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
    stage: fixture.startsWith("mutations/") ? "preflight" : fixture.startsWith("review/") ? "review" : "validation"
  };
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM")) return "Regenerate accepted designer workflow, P4, and kanban-live evidence before continuing.";
  if (code.includes("LIVE_KANBAN")) return "Run the local-live kanban proof and browser proof before claiming the designer review UI loop.";
  if (code.includes("MIRROR")) return "Mirror only the structured SurfaceOps decision receipt back to kanban.cards.";
  if (code.includes("HANDOFF_WHILE_BLOCKED")) return "Keep handoff blocked until the governed source review is renewed.";
  if (code.includes("REFINEMENT_WHILE_BLOCKED")) return "Keep refinement unavailable until the governed source review is renewed.";
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
    ...DRUI_FIXTURE_CASES.map((fixture) => fixture.fixturePath)
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

function governanceOutcomeSchema() {
  return objectSchema(null, {
    status: { const: "blocked" },
    targetHandoffAllowed: { const: false },
    sourceExceptionStatus: { const: "expired-blocked" },
    renewalRequiredBeforeHandoff: { const: true },
    blockingDiagnosticCodes: exactStringArraySchema(["SOURCE_REVIEW_EXPIRED"])
  }, ["status", "targetHandoffAllowed", "sourceExceptionStatus", "renewalRequiredBeforeHandoff", "blockingDiagnosticCodes"]);
}

function workItemSchema() {
  return objectSchema(null, {
    reviewItemId: { type: "string" },
    surfaceOpsReviewId: { type: "string" },
    title: { type: "string" },
    componentId: { const: DRUI_COMPONENT_ID },
    source: { type: "string" },
    owner: { type: "string" },
    mirroredKanbanStatus: { enum: ["needs review", "blocked"] },
    kanbanCardTitle: { type: "string" },
    primaryEvidenceRef: artifactRefSchema(),
    reviewContextEvidenceRef: artifactRefSchema(),
    kanbanAdapterEvidenceRef: artifactRefSchema()
  }, ["reviewItemId", "surfaceOpsReviewId", "title", "componentId", "source", "owner", "mirroredKanbanStatus", "kanbanCardTitle", "primaryEvidenceRef", "reviewContextEvidenceRef", "kanbanAdapterEvidenceRef"]);
}

function dagNodeSchema() {
  return objectSchema(null, {
    nodeId: { type: "string" },
    label: { type: "string" },
    role: { type: "string" },
    status: { type: "string" }
  }, ["nodeId", "label", "role", "status"]);
}

function dagEdgeSchema() {
  return objectSchema(null, {
    from: { type: "string" },
    to: { type: "string" },
    label: { type: "string" }
  }, ["from", "to", "label"]);
}

function inspectorSchema() {
  return objectSchema(null, {
    selectedNodeId: { type: "string" },
    visualFirst: { const: true },
    selectedVariantId: { type: ["string", "null"] },
    canonicalMediaRefs: { type: "array", minItems: 1, items: canonicalMediaRefSchema() },
    interpretedDeltas: { type: "array", minItems: 1, items: { type: "string" } },
    blockingRisks: exactStringArraySchema(["SOURCE_REVIEW_EXPIRED"]),
    diagnostics: { type: "array", items: diagnosticSchema() }
  }, ["selectedNodeId", "visualFirst", "selectedVariantId", "canonicalMediaRefs", "interpretedDeltas", "blockingRisks", "diagnostics"]);
}

function canonicalMediaRefSchema() {
  return objectSchema(null, {
    label: { type: "string" },
    role: { type: "string" },
    path: { type: "string" }
  }, ["label", "role", "path"]);
}

function decisionPanelSchema() {
  return objectSchema(null, {
    controlsEnabled: { const: true },
    rationaleRequired: { const: true },
    actionControls: objectSchema(null, {
      approveForHandoff: { const: false },
      requestRefinement: { const: false },
      recordBlocked: { const: true }
    }, ["approveForHandoff", "requestRefinement", "recordBlocked"]),
    allowedActions: exactStringArraySchema(["block"]),
    defaultAction: { const: "block" },
    blockedWhenEvidenceMissing: { const: true },
    sequentialReplayClaims: objectSchema(null, {
      identicalSequentialReplayReusesReceipt: { const: true },
      conflictingSequentialReplayRejected: { const: true }
    }, ["identicalSequentialReplayReusesReceipt", "conflictingSequentialReplayRejected"])
  }, ["controlsEnabled", "rationaleRequired", "actionControls", "allowedActions", "defaultAction", "blockedWhenEvidenceMissing", "sequentialReplayClaims"]);
}

function kanbanMirrorSchema() {
  return objectSchema(null, {
    mirrorOnly: { const: true },
    laneMovementCommitsDecision: { const: false },
    beforeStatus: { const: "needs review" },
    afterStatus: { const: "blocked" },
    mirroredFields: exactStringArraySchema(["laneId", "summary", "receiptLink"]),
    forbiddenMirroredFields: exactStringArraySchema(["surfacesAuthority", "proofAuthority", "variantOfRecord"]),
    idempotencyKey: { type: "string", minLength: 1 }
  }, ["mirrorOnly", "laneMovementCommitsDecision", "beforeStatus", "afterStatus", "mirroredFields", "forbiddenMirroredFields", "idempotencyKey"]);
}

function handoffEligibilitySchema() {
  return objectSchema(null, {
    eligible: { const: false },
    targetHandoffAllowed: { const: false },
    renewalRequiredBeforeHandoff: { const: true },
    blockingDiagnosticCodes: exactStringArraySchema(["SOURCE_REVIEW_EXPIRED"]),
    localLiveReviewUi: { const: true },
    kanbanCardsMirror: { const: true },
    productionAdapter: { const: false },
    hostedPersistence: { const: false },
    webhooks: { const: false },
    liveJudgmentKit: { const: false }
  }, ["eligible", "targetHandoffAllowed", "renewalRequiredBeforeHandoff", "blockingDiagnosticCodes", "localLiveReviewUi", "kanbanCardsMirror", "productionAdapter", "hostedPersistence", "webhooks", "liveJudgmentKit"]);
}

function mediaRefSchema() {
  return objectSchema(null, {
    label: { type: "string" },
    path: { type: "string" },
    mimeType: { type: "string" }
  }, ["label", "path", "mimeType"]);
}

function runExpectationSchema() {
  return objectSchema(null, {
    status: { const: "pass" },
    promotionStatus: { const: "blocked" },
    totalResults: { const: DRUI_EXPECTATION_ROWS.length },
    matchedResults: { const: DRUI_EXPECTATION_ROWS.length }
  }, ["status", "promotionStatus", "totalResults", "matchedResults"]);
}

function upstreamPreflightSchema() {
  return objectSchema(null, {
    status: { const: "pass" },
    designerEvidenceRef: artifactRefSchema(),
    p4EvidenceRef: artifactRefSchema(),
    kanbanLiveEvidenceRef: artifactRefSchema(),
    exactHashBoundary: { const: true },
    governanceOutcome: governanceOutcomeSchema()
  }, ["status", "designerEvidenceRef", "p4EvidenceRef", "kanbanLiveEvidenceRef", "exactHashBoundary", "governanceOutcome"]);
}

function proofArgsSchema() {
  return objectSchema(null, {
    designerEvidence: { const: DRUI_DWT_EVIDENCE_PATH },
    designerReport: { const: DRUI_DWT_REPORT_PATH },
    reviewEvidence: { const: DRUI_P4_EVIDENCE_PATH },
    decisionLedger: { const: DRUI_P4_DECISION_LEDGER_PATH },
    kanbanLiveEvidence: { const: DRUI_KANBAN_LIVE_EVIDENCE_PATH },
    kanbanLiveOperationPlan: { const: DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH },
    fixture: { const: DRUI_FIXTURE_ROOT },
    out: { const: DRUI_ARTIFACT_ROOT }
  }, ["designerEvidence", "designerReport", "reviewEvidence", "decisionLedger", "kanbanLiveEvidence", "kanbanLiveOperationPlan", "fixture", "out"]);
}

function fixtureCandidateSchema() {
  return objectSchema(null, {
    targetId: { type: ["string", "null"] },
    evidenceRefs: { type: "array", items: artifactRefSchema() },
    authority: candidateAuthoritySchema(),
    decision: objectSchema(null, {
      state: { enum: ["needs refinement", "approved for handoff", "blocked"] },
      visibleInReceipt: { type: "boolean" },
      referencedByEvidence: { type: "boolean" }
    }, ["state", "visibleInReceipt", "referencedByEvidence"]),
    kanbanMirror: objectSchema(null, {
      mirroredStatus: { enum: ["needs refinement", "approved for handoff", "blocked"] },
      derivedFromDecisionReceipt: { type: "boolean" }
    }, ["mirroredStatus", "derivedFromDecisionReceipt"]),
    boundaryClaims: objectSchema(null, {
      productionAdapterImplemented: { type: "boolean" }
    }, ["productionAdapterImplemented"]),
    liveKanbanBoundary: objectSchema(null, {
      evidenceAvailable: { type: "boolean" }
    }, ["evidenceAvailable"]),
    governanceOutcome: governanceOutcomeSchema()
  }, ["targetId", "evidenceRefs", "authority", "decision", "kanbanMirror", "boundaryClaims", "liveKanbanBoundary", "governanceOutcome"]);
}

function candidateAuthoritySchema() {
  return objectSchema(null, {
    surfaceOpsOwnsReviewDecision: { type: "boolean" },
    kanbanCardsOwnsCollaborationState: { type: "boolean" },
    kanbanLaneMovementCommitsDecision: { type: "boolean" },
    surfacesEvidenceRemainsProofAuthority: { type: "boolean" },
    productionAdapterImplemented: { type: "boolean" }
  }, ["surfaceOpsOwnsReviewDecision", "kanbanCardsOwnsCollaborationState", "kanbanLaneMovementCommitsDecision", "surfacesEvidenceRemainsProofAuthority", "productionAdapterImplemented"]);
}

function mutationOperationSchema() {
  return {
    oneOf: [
      objectSchema(null, {
        op: { const: "remove-document" },
        documentPath: safeRelativePosixPathSchema(),
        jsonPointer: { type: "null" },
        value: { type: "null" }
      }, ["op", "documentPath", "jsonPointer", "value"]),
      objectSchema(null, {
        op: { const: "replace" },
        documentPath: safeRelativePosixPathSchema(),
        jsonPointer: { type: "string", pattern: "^/" },
        value: { type: "string" }
      }, ["op", "documentPath", "jsonPointer", "value"])
    ]
  };
}

function kanbanRuntimeSchema() {
  return objectSchema(null, {
    upstreamWorkspace: { type: "string" },
    upstreamWorkspaceName: { type: "string" },
    upstreamCommit: commitHashSchema(),
    expectedUpstreamCommit: commitHashSchema(),
    kanbanBaseUrl: { type: "string" },
    surfaceOpsBaseUrl: { type: "string" },
    browserReceivesKanbanBearerTokens: { const: false },
    persistence: { type: "string" },
    auth: { type: "string" }
  }, ["upstreamWorkspace", "upstreamWorkspaceName", "upstreamCommit", "expectedUpstreamCommit", "kanbanBaseUrl", "surfaceOpsBaseUrl", "browserReceivesKanbanBearerTokens", "persistence", "auth"]);
}

function browserStepSchema() {
  return objectSchema(null, {
    stepId: { type: "string" },
    action: { type: "string" },
    status: { enum: ["pass", "fail"] },
    detail: { type: "string" }
  }, ["stepId", "action", "status", "detail"]);
}

function browserMirrorResultSchema(schemaId = null) {
  return objectSchema(schemaId, {
    bindingId: { type: "string" },
    receiptId: { type: "string" },
    receiptHash: sha256Schema(),
    cardId: { type: "string" },
    beforeLaneId: { const: "needs-review" },
    afterLaneId: { const: "blocked" },
    commentId: { type: "string" },
    commentKind: { const: "change_request" },
    commentStatus: { const: "open" },
    diagnosticCode: { const: "SOURCE_REVIEW_EXPIRED" },
    renewalRequiredBeforeHandoff: { const: true },
    mirrorOnly: { const: true },
    laneMovementCommitsDecision: { const: false }
  }, ["bindingId", "receiptId", "receiptHash", "cardId", "beforeLaneId", "afterLaneId", "commentId", "commentKind", "commentStatus", "diagnosticCode", "renewalRequiredBeforeHandoff", "mirrorOnly", "laneMovementCommitsDecision"]);
}

function browserEnvironmentSchema() {
  return objectSchema(null, {
    generatedAt: { type: "string" },
    host: { type: "null" },
    selfHashMode: { const: "sha256 over canonical JSON with selfHash set to 64 zero characters before final assignment" }
  }, ["generatedAt", "host", "selfHashMode"]);
}

function exactStringArraySchema(values) {
  return {
    type: "array",
    minItems: values.length,
    maxItems: values.length,
    prefixItems: values.map((value) => ({ const: value })),
    items: false
  };
}

function fixedLengthArraySchema(length, items) {
  return {
    type: "array",
    minItems: length,
    maxItems: length,
    items
  };
}

function commitHashSchema() {
  return { type: "string", pattern: "^[0-9a-f]{40}$" };
}

function sha256Schema() {
  return { type: "string", pattern: "^[0-9a-f]{64}$" };
}

function nullableStringSchema() {
  return { type: ["string", "null"] };
}

function artifactRefSchema() {
  return objectSchema(null, {
    path: safeRelativePosixPathSchema(),
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: sha256Schema(),
    sourceRef: nullableStringSchema()
  }, ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"]);
}

function browserFileRefSchema() {
  return objectSchema(null, {
    path: safeRelativePosixPathSchema(),
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: "string", pattern: "^[0-9a-f]{64}$" },
    mimeType: { type: "string" }
  }, ["path", "schemaId", "hashAlgorithm", "hash", "mimeType"]);
}

function safeRelativePosixPathSchema() {
  return {
    type: "string",
    minLength: 1,
    pattern: "^(?!/)(?!.*(?:^|/)\\.)(?!.*//)(?!.*\\\\)[^\\u0000]+$"
  };
}

function browserAssertionSchema() {
  return objectSchema(null, {
    assertionId: { type: "string" },
    status: { enum: ["pass", "fail"] },
    expected: { type: "string" },
    actual: { type: "string" }
  }, ["assertionId", "status", "expected", "actual"]);
}

function validationResultSchema({ matched } = {}) {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    matched: matched === undefined ? { type: "boolean" } : { const: matched }
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
