import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { designerWorkflowTraceInternals } from "./designer-workflow-trace-proof.js";
import { p3Internals } from "./p3-proof.js";
import { p4Internals } from "./p4-proof.js";
import { surfaceopsKanbanLiveInternals } from "./surfaceops-kanban-live-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  DRUI_ACCEPTED_DWT_EVIDENCE_HASH,
  DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH,
  DRUI_ACCEPTED_P4_EVIDENCE_HASH,
  DRUI_ARTIFACT_PATHS,
  DRUI_ARTIFACT_ROOT,
  DRUI_COMMAND,
  DRUI_CONTRACT_ID,
  DRUI_COMPONENT_ID,
  DRUI_DWT_EVIDENCE_PATH,
  DRUI_DWT_REPORT_PATH,
  DRUI_FIXTURE_ROOT,
  DRUI_GENERATED_ARTIFACTS,
  DRUI_KANBAN_LIVE_EVIDENCE_PATH,
  DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH,
  DRUI_P4_DECISION_LEDGER_PATH,
  DRUI_P4_EVIDENCE_PATH,
  DRUI_RUNTIME_OUTPUT_ROOT,
  DRUI_SCENARIO_ID,
  DRUI_SCHEMA_ROOT,
  DRUI_TARGET_ID,
  DRUI_TIMESTAMP,
  DRUI_VERSION,
  artifactRef,
  defaultUpstreamRefs,
  diagnosticForCode,
  diagnosticsRegistry,
  druiConsumedSchemaPaths,
  druiFixturePaths,
  druiSchemaPaths,
  provenance,
  schemaIdForDesignerReviewUiPath
} from "./surfaceops-designer-review-ui-contract.js";
import {
  computeSurfaceopsDesignerReviewUiEvidenceSelfHash,
  deriveSurfaceopsDesignerReviewGovernanceOutcome,
  verifySurfaceopsDesignerReviewUiEvidenceClosure
} from "./surfaceops-designer-review-ui-evidence.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)*\.v[0-9]+\.schema\.json$/;

export async function runSurfaceopsDesignerReviewUiInterfacectl(argv, io) {
  const parsed = parseSurfaceopsDesignerReviewUiArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runSurfaceopsDesignerReviewUiProof({
      cwd: io.cwd,
      designerEvidencePath: parsed.designerEvidence,
      designerReportPath: parsed.designerReport,
      reviewEvidencePath: parsed.reviewEvidence,
      decisionLedgerPath: parsed.decisionLedger,
      kanbanLiveEvidencePath: parsed.kanbanLiveEvidence,
      kanbanLiveOperationPlanPath: parsed.kanbanLiveOperationPlan,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: DRUI_COMMAND,
      args: {
        designerEvidence: parsed.designerEvidence,
        designerReport: parsed.designerReport,
        reviewEvidence: parsed.reviewEvidence,
        decisionLedger: parsed.decisionLedger,
        kanbanLiveEvidence: parsed.kanbanLiveEvidence,
        kanbanLiveOperationPlan: parsed.kanbanLiveOperationPlan,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces surfaceops-designer-review-ui proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `artifacts: ${result.artifacts.join(", ")}`
    ].join("\n") + "\n");
    return result.status === "pass" ? 0 : 1;
  } catch (error) {
    if (error && (error.exitCode === 1 || error.exitCode === 2)) {
      io.stderr.write(`${error.message}\n`);
      return error.exitCode;
    }
    throw error;
  }
}

function parseSurfaceopsDesignerReviewUiArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--designer-evidence") result.designerEvidence = argv[++index];
    else if (current === "--designer-report") result.designerReport = argv[++index];
    else if (current === "--review-evidence") result.reviewEvidence = argv[++index];
    else if (current === "--decision-ledger") result.decisionLedger = argv[++index];
    else if (current === "--kanban-live-evidence") result.kanbanLiveEvidence = argv[++index];
    else if (current === "--kanban-live-operation-plan") result.kanbanLiveOperationPlan = argv[++index];
    else if (current === "--fixture") result.fixture = argv[++index];
    else if (current === "--out") result.out = argv[++index];
    else return { ok: false, error: `unexpected argument: ${current}` };
  }
  if (!result.designerEvidence || !result.designerReport || !result.reviewEvidence || !result.decisionLedger || !result.kanbanLiveEvidence || !result.kanbanLiveOperationPlan || !result.fixture || !result.out) {
    return { ok: false, error: usage() };
  }
  for (const [flagName, value] of [
    ["--designer-evidence", result.designerEvidence],
    ["--designer-report", result.designerReport],
    ["--review-evidence", result.reviewEvidence],
    ["--decision-ledger", result.decisionLedger],
    ["--kanban-live-evidence", result.kanbanLiveEvidence],
    ["--kanban-live-operation-plan", result.kanbanLiveOperationPlan],
    ["--fixture", result.fixture],
    ["--out", result.out]
  ]) {
    const parsed = p3Internals.parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    const key = flagName.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = parsed.path;
  }
  return { ok: true, ...result };
}

export async function runSurfaceopsDesignerReviewUiProof({
  cwd,
  designerEvidencePath,
  designerReportPath,
  reviewEvidencePath,
  decisionLedgerPath,
  kanbanLiveEvidencePath,
  kanbanLiveOperationPlanPath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({
    designerEvidencePath,
    designerReportPath,
    reviewEvidencePath,
    decisionLedgerPath,
    kanbanLiveEvidencePath,
    kanbanLiveOperationPlanPath,
    fixtureRoot,
    outRoot
  });
  await assertReadableDir(path.join(cwd, DRUI_SCHEMA_ROOT), `unreadable schema path: ${DRUI_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  const upstream = await strictUpstreamPreflight(cwd, {
    designerEvidencePath,
    designerReportPath,
    reviewEvidencePath,
    decisionLedgerPath,
    kanbanLiveEvidencePath,
    kanbanLiveOperationPlanPath
  }, validators);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredFiles(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "surfaceops-designer-review-ui-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  await assertExpectations(cwd, expectations, fixtureRoot, outRoot);

  const targetSelectionFixture = await readJson(path.join(cwd, fixtureRoot, "target-selection.fixture.json"));
  assertSchema(validators, "surfaceops-designer-review-ui-target-selection.v0", targetSelectionFixture, `${fixtureRoot}/target-selection.fixture.json`);
  const targetSelection = buildTargetSelection({ upstream, fixture: targetSelectionFixture });
  assertSchema(validators, "surfaceops-designer-review-ui-target-selection.v0", targetSelection, `${outRoot}/surfaceops-designer-review-ui-target-selection.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-designer-review-ui-target-selection.json"), targetSelection);
  const targetSelectionRef = artifactRef(`${outRoot}/surfaceops-designer-review-ui-target-selection.json`, "surfaceops-designer-review-ui-target-selection.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-designer-review-ui-target-selection.json")));

  const workbench = buildWorkbench({ upstream, targetSelectionRef });
  assertWorkbenchGraph(workbench);
  assertSchema(validators, "surfaceops-designer-review-workbench.v0", workbench, `${outRoot}/surfaceops-designer-review-workbench.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-designer-review-workbench.json"), workbench);
  const workbenchRef = artifactRef(`${outRoot}/surfaceops-designer-review-workbench.json`, "surfaceops-designer-review-workbench.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-designer-review-workbench.json")));

  const decisionReceipt = buildDecisionReceipt({ upstream, workbenchRef });
  assertSchema(validators, "surfaceops-designer-review-decision-receipt.v0", decisionReceipt, `${outRoot}/surfaceops-designer-review-decision-receipt.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-designer-review-decision-receipt.json"), decisionReceipt);
  const decisionReceiptRef = artifactRef(`${outRoot}/surfaceops-designer-review-decision-receipt.json`, "surfaceops-designer-review-decision-receipt.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-designer-review-decision-receipt.json")));

  const fixtureRows = await loadFixtureRows(cwd, expectations, validators);
  const validationResults = evaluateExpectations(fixtureRows, upstream);
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "fail") {
    throw contractError(`SurfaceOps designer review UI validation expectation mismatch: ${validationResults.filter((result) => !result.matched).map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.expectedDiagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.diagnosticCodes.join(",") || "none"}`).join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults, upstream);
  const artifactRefs = [targetSelectionRef, workbenchRef, decisionReceiptRef];
  const runId = buildRunId({ upstream, targetSelectionRef, workbenchRef, decisionReceiptRef, expectations, command, args });
  const report = buildReport({ runId, upstream, artifactRefs, validationResults, diagnostics, status, promotionStatus });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "surfaceops-designer-review-ui-report.v0", report, `${outRoot}/surfaceops-designer-review-ui-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-designer-review-ui-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/surfaceops-designer-review-ui-report.json`, "surfaceops-designer-review-ui-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-designer-review-ui-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    upstream,
    artifactRefs: [...artifactRefs, reportRef],
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "surfaceops-designer-review-ui-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  await verifySurfaceopsDesignerReviewUiEvidenceClosure({
    cwd,
    evidence: persistedEvidence,
    evidencePath: `${outRoot}/evidence.json`,
    assertSchema: (schemaId, data, label) => assertSchema(validators, schemaId, data, label)
  });

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: DRUI_GENERATED_ARTIFACTS
  };
}

function buildTargetSelection({ upstream, fixture }) {
  return {
    ...deepClone(fixture),
    targetId: DRUI_TARGET_ID,
    governanceOutcome: deepClone(upstream.governanceOutcome),
    upstreamRefs: upstreamRefs(upstream),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-designer-review-ui-target-selection", [
      DRUI_DWT_EVIDENCE_PATH,
      DRUI_P4_EVIDENCE_PATH,
      DRUI_KANBAN_LIVE_EVIDENCE_PATH
    ])
  };
}

function buildWorkbench({ upstream, targetSelectionRef }) {
  const evidenceRefs = upstreamRefs(upstream);
  return {
    schemaId: "surfaceops-designer-review-workbench.v0",
    version: DRUI_VERSION,
    scenarioId: DRUI_SCENARIO_ID,
    targetSelectionRef,
    workItem: {
      reviewItemId: "review-item.button.primary",
      surfaceOpsReviewId: "surfaceops-review.button.primary.local-live",
      title: "Button primary variant review",
      componentId: DRUI_COMPONENT_ID,
      source: "agent-submitted-change",
      owner: "design-systems-governance",
      mirroredKanbanStatus: "needs review",
      kanbanCardTitle: "Button primary blocked review",
      primaryEvidenceRef: upstream.designerEvidenceRef,
      reviewContextEvidenceRef: upstream.p4EvidenceRef,
      kanbanAdapterEvidenceRef: upstream.kanbanLiveEvidenceRef
    },
    dag: {
      nodes: [
        node("kanban-card", "kanban.cards card", "collaboration-signal", "needs review"),
        node("surfaceops-intake", "SurfaceOps intake", "evidence-binding", "bound"),
        node("authority-trace", "SurfaceOps DAG", "authority-routing", "ready"),
        node("inspector", "Designer inspector", "visual-review", "selected"),
        node("decision-receipt", "Decision receipt", "structured-decision", "pending"),
        node("kanban-mirror", "Mirrored card update", "collaboration-mirror", "planned")
      ],
      edges: [
        edge("kanban-card", "surfaceops-intake", "evidence marker opens review workbench"),
        edge("surfaceops-intake", "authority-trace", "review item is bound to accepted evidence refs"),
        edge("authority-trace", "inspector", "DAG node selection drives inspector context"),
        edge("inspector", "decision-receipt", "designer records structured receipt"),
        edge("decision-receipt", "kanban-mirror", "receipt summary mirrors back to kanban.cards")
      ]
    },
    inspector: {
      selectedNodeId: "inspector",
      visualFirst: true,
      selectedVariantId: "button.primary.candidate",
      canonicalMediaRefs: [
        { label: "before", role: "source-conformance-reference", path: "artifacts/designer-workflow-trace/designer-workflow-trace-report.json#/sourceConformanceGovernance" },
        { label: "P4 context only", role: "unrelated-review-context-not-button-authority", path: "artifacts/p4/surfaceops-decision-ledger.json#/decisions/0" }
      ],
      interpretedDeltas: [
        "Primary Button remains bound to accepted Button evidence.",
        "The accepted P4 ledger row is context-only and does not authorize this Button handoff.",
        "Governed source-conformance exception is visible before handoff.",
        "Lane movement remains a collaboration signal until SurfaceOps records a receipt."
      ],
      blockingRisks: ["SOURCE_REVIEW_EXPIRED"],
      diagnostics: []
    },
    decisionPanel: {
      controlsEnabled: true,
      rationaleRequired: true,
      actionControls: {
        approveForHandoff: false,
        requestRefinement: false,
        recordBlocked: true
      },
      allowedActions: ["block"],
      defaultAction: "block",
      blockedWhenEvidenceMissing: true,
      sequentialReplayClaims: {
        identicalSequentialReplayReusesReceipt: true,
        conflictingSequentialReplayRejected: true
      }
    },
    kanbanMirror: {
      mirrorOnly: true,
      laneMovementCommitsDecision: false,
      beforeStatus: "needs review",
      afterStatus: "blocked",
      mirroredFields: ["laneId", "summary", "receiptLink"],
      forbiddenMirroredFields: ["surfacesAuthority", "proofAuthority", "variantOfRecord"],
      idempotencyKey: `surfaceops-designer-review-ui:review-item.button.primary:${upstream.designerEvidenceRef.hash}`
    },
    governanceOutcome: deepClone(upstream.governanceOutcome),
    authority: authorityBoundary(),
    evidenceRefs,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-designer-review-ui-workbench", [
      targetSelectionRef.path,
      upstream.designerReportRef.path,
      upstream.kanbanLiveOperationPlanRef.path
    ])
  };
}

function buildDecisionReceipt({ upstream, workbenchRef }) {
  const decisionId = `surfaceops-decision-${sha256Hex(canonicalJson({
    reviewItemId: "review-item.button.primary",
    evidenceHash: upstream.designerEvidenceRef.hash,
    action: "blocked"
  })).slice(0, 16)}`;
  return {
    schemaId: "surfaceops-designer-review-decision-receipt.v0",
    version: DRUI_VERSION,
    scenarioId: DRUI_SCENARIO_ID,
    workbenchRef,
    decisionId,
    decisionState: "blocked",
    selectedVariantId: null,
    rationale: "Blocked because SOURCE_REVIEW_EXPIRED requires renewed source-owner review metadata before any target handoff.",
    reviewer: "surfaceops-designer-reviewer",
    mirroredKanbanStatus: "blocked",
    variantOfRecord: null,
    handoffEligibility: {
      eligible: false,
      targetHandoffAllowed: false,
      renewalRequiredBeforeHandoff: true,
      blockingDiagnosticCodes: ["SOURCE_REVIEW_EXPIRED"],
      localLiveReviewUi: true,
      kanbanCardsMirror: true,
      productionAdapter: false,
      hostedPersistence: false,
      webhooks: false,
      liveJudgmentKit: false
    },
    governanceOutcome: deepClone(upstream.governanceOutcome),
    evidenceRefs: upstreamRefs(upstream),
    mediaRefs: [
      { label: "SurfaceOps workbench", path: `${DRUI_ARTIFACT_ROOT}/surfaceops-designer-review-workbench.json`, mimeType: "application/json" },
      { label: "kanban.cards mirror plan", path: DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH, mimeType: "application/json" }
    ],
    authority: authorityBoundary(),
    provenance: provenance("interfacectl-surfaceops-designer-review-ui-decision-receipt", [
      workbenchRef.path,
      upstream.designerReportRef.path,
      upstream.kanbanLiveOperationPlanRef.path
    ])
  };
}

function buildReport({ runId, upstream, artifactRefs, validationResults, diagnostics, status, promotionStatus }) {
  return {
    schemaId: "surfaceops-designer-review-ui-report.v0",
    version: DRUI_VERSION,
    runId,
    targetId: DRUI_TARGET_ID,
    status,
    promotionStatus,
    governanceOutcome: deepClone(upstream.governanceOutcome),
    upstreamPreflight: {
      status: "pass",
      designerEvidenceRef: upstream.designerEvidenceRef,
      p4EvidenceRef: upstream.p4EvidenceRef,
      kanbanLiveEvidenceRef: upstream.kanbanLiveEvidenceRef,
      exactHashBoundary: true,
      governanceOutcome: deepClone(upstream.governanceOutcome)
    },
    artifactRefs,
    validationResults: publicValidationResults(validationResults),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-designer-review-ui-report", artifactRefs.map((ref) => ref.path))
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, artifactRefs, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = await refsForPaths(cwd, [...druiSchemaPaths(), ...druiConsumedSchemaPaths()]);
  const fixtureRefs = await refsForPaths(cwd, druiFixturePaths());
  const boundaryRefs = [
    upstream.designerEvidenceRef,
    upstream.designerReportRef,
    upstream.p4EvidenceRef,
    upstream.p4DecisionLedgerRef,
    upstream.kanbanLiveEvidenceRef,
    upstream.kanbanLiveOperationPlanRef
  ];
  const evidenceRef = artifactRef(`${DRUI_ARTIFACT_ROOT}/evidence.json`, "surfaceops-designer-review-ui-evidence.v0", null);
  const evidence = {
    schemaId: "surfaceops-designer-review-ui-evidence.v0",
    version: DRUI_VERSION,
    runId,
    contractId: DRUI_CONTRACT_ID,
    targetId: DRUI_TARGET_ID,
    status,
    promotionStatus,
    governanceOutcome: deepClone(upstream.governanceOutcome),
    command,
    args,
    checkedAt: DRUI_TIMESTAMP,
    environment: { generatedAt: DRUI_TIMESTAMP, host: null },
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts: [...artifactRefs, evidenceRef],
    validationResults: publicValidationResults(validationResults),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-designer-review-ui-evidence", [
      ...druiSchemaPaths(),
      ...druiFixturePaths(),
      ...artifactRefs.map((ref) => ref.path)
    ])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeSurfaceopsDesignerReviewUiEvidenceSelfHash(evidence);
  return evidence;
}

function evaluateExpectations(fixtureRows, upstream) {
  return fixtureRows.map(({ fixture, expectation }) => {
    const actual = fixture.mutationOperations.length > 0
      ? evaluateMutationFixture(fixture, upstream)
      : evaluateCandidateFixture(fixture.candidate);
    const diagnostics = actual.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      artifactPath: expectation.fixturePath
    }));
    const diagnosticCodes = diagnostics.map((diagnostic) => diagnostic.code);
    const matched =
      actual.result === expectation.expectedResult &&
      actual.promotionStatus === expectation.promotionStatus &&
      arrayEquals(diagnosticCodes, expectation.expectedDiagnosticCodes);
    return {
      fixturePath: expectation.fixturePath,
      expectedResult: expectation.expectedResult,
      actualResult: actual.result,
      promotionStatus: actual.promotionStatus,
      expectedDiagnosticCodes: expectation.expectedDiagnosticCodes,
      diagnosticCodes,
      diagnostics,
      matched
    };
  });
}

function evaluateCandidateFixture(candidate) {
  if (candidate.targetId !== DRUI_TARGET_ID) return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_TARGET_UNDECLARED");
  if (canonicalJson(candidate.evidenceRefs) !== canonicalJson(defaultUpstreamRefs())) {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_REF_MISSING");
  }
  const acceptedAuthority = authorityBoundary();
  if (canonicalJson(candidate.authority) !== canonicalJson(acceptedAuthority)) {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_AUTHORITY_OVERRIDE");
  }
  if (!candidate.decision.visibleInReceipt || !candidate.decision.referencedByEvidence) {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_HIDDEN_DECISION");
  }
  if (!candidate.kanbanMirror.derivedFromDecisionReceipt || candidate.kanbanMirror.mirroredStatus !== candidate.decision.state) {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_MIRROR_STATUS_INVALID");
  }
  if (candidate.governanceOutcome.targetHandoffAllowed === false && candidate.decision.state === "approved for handoff") {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_HANDOFF_WHILE_BLOCKED");
  }
  if (candidate.governanceOutcome.targetHandoffAllowed === false && candidate.decision.state === "needs refinement") {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_REFINEMENT_WHILE_BLOCKED");
  }
  if (candidate.boundaryClaims.productionAdapterImplemented) {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN");
  }
  if (!candidate.liveKanbanBoundary.evidenceAvailable) {
    return {
      result: "review_required",
      promotionStatus: "review_required",
      diagnostics: [diagnosticForCode("SURFACEOPS_DESIGNER_REVIEW_LIVE_KANBAN_REQUIRED")]
    };
  }
  return { result: "valid", promotionStatus: "allowed", diagnostics: [] };
}

function evaluateMutationFixture(fixture, upstream) {
  const documents = new Map([
    [DRUI_DWT_EVIDENCE_PATH, deepClone(upstream.designerEvidence)],
    [DRUI_P4_EVIDENCE_PATH, deepClone(upstream.p4Evidence)],
    [DRUI_KANBAN_LIVE_EVIDENCE_PATH, deepClone(upstream.kanbanLiveEvidence)],
    [`${DRUI_ARTIFACT_ROOT}/evidence.json`, buildEvidenceMutationCandidate()]
  ]);
  for (const operation of fixture.mutationOperations) applyMutationOperation(documents, operation);

  for (const requiredPath of [DRUI_DWT_EVIDENCE_PATH, DRUI_P4_EVIDENCE_PATH, DRUI_KANBAN_LIVE_EVIDENCE_PATH]) {
    if (!documents.has(requiredPath)) return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_MISSING");
  }
  const evidenceHashRows = [
    [DRUI_DWT_EVIDENCE_PATH, designerWorkflowTraceInternals.computeEvidenceSelfHash, DRUI_ACCEPTED_DWT_EVIDENCE_HASH],
    [DRUI_P4_EVIDENCE_PATH, p4Internals.computeEvidenceSelfHash, DRUI_ACCEPTED_P4_EVIDENCE_HASH],
    [DRUI_KANBAN_LIVE_EVIDENCE_PATH, surfaceopsKanbanLiveInternals.computeEvidenceSelfHash, DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH]
  ];
  for (const [documentPath, computeSelfHash, acceptedHash] of evidenceHashRows) {
    const document = documents.get(documentPath);
    const finalRef = document?.artifacts?.[document.artifacts.length - 1];
    const actualHash = computeSelfHash(document);
    if (finalRef?.path !== documentPath || finalRef?.hash !== actualHash || actualHash !== acceptedHash) {
      return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_UPSTREAM_HASH_MISMATCH");
    }
  }
  const evidenceCandidate = documents.get(`${DRUI_ARTIFACT_ROOT}/evidence.json`);
  const evidenceRef = evidenceCandidate?.artifacts?.[evidenceCandidate.artifacts.length - 1];
  if (evidenceRef?.hash !== computeSurfaceopsDesignerReviewUiEvidenceSelfHash(evidenceCandidate)) {
    return invalidFixtureResult("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_HASH_MISMATCH");
  }
  return evaluateCandidateFixture(fixture.candidate);
}

function buildEvidenceMutationCandidate() {
  const candidate = {
    schemaId: "surfaceops-designer-review-ui-evidence.v0",
    targetId: DRUI_TARGET_ID,
    artifacts: DRUI_ARTIFACT_PATHS.map((artifactPath) => artifactRef(
      artifactPath,
      schemaIdForDesignerReviewUiPath(artifactPath),
      null
    ))
  };
  candidate.artifacts[candidate.artifacts.length - 1].hash = computeSurfaceopsDesignerReviewUiEvidenceSelfHash(candidate);
  return candidate;
}

function applyMutationOperation(documents, operation) {
  if (operation.op === "remove-document") {
    documents.delete(operation.documentPath);
    return;
  }
  const document = documents.get(operation.documentPath);
  if (!document || operation.op !== "replace" || typeof operation.jsonPointer !== "string" || !operation.jsonPointer.startsWith("/")) {
    throw contractError(`SurfaceOps designer review UI mutation operation is invalid for ${operation.documentPath}`, 1);
  }
  const segments = operation.jsonPointer.slice(1).split("/").map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
  const finalSegment = segments.pop();
  let parent = document;
  for (const segment of segments) {
    if (parent == null || !(segment in parent)) throw contractError(`SurfaceOps designer review UI mutation pointer is unresolved: ${operation.jsonPointer}`, 1);
    parent = parent[segment];
  }
  if (parent == null || !(finalSegment in parent)) throw contractError(`SurfaceOps designer review UI mutation pointer is unresolved: ${operation.jsonPointer}`, 1);
  parent[finalSegment] = operation.value;
}

function invalidFixtureResult(code) {
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForCode(code)]
  };
}

async function strictUpstreamPreflight(cwd, paths, validators) {
  for (const [artifactPath, label] of [
    [paths.designerEvidencePath, "designer workflow trace evidence"],
    [paths.designerReportPath, "designer workflow trace report"],
    [paths.reviewEvidencePath, "P4 review evidence"],
    [paths.decisionLedgerPath, "P4 decision ledger"],
    [paths.kanbanLiveEvidencePath, "SurfaceOps kanban live evidence"],
    [paths.kanbanLiveOperationPlanPath, "SurfaceOps kanban live operation plan"]
  ]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), label);
  }

  const designerEvidence = await readJson(path.join(cwd, paths.designerEvidencePath));
  const designerReport = await readJson(path.join(cwd, paths.designerReportPath));
  const p4Evidence = await readJson(path.join(cwd, paths.reviewEvidencePath));
  const p4DecisionLedger = await readJson(path.join(cwd, paths.decisionLedgerPath));
  const kanbanLiveEvidence = await readJson(path.join(cwd, paths.kanbanLiveEvidencePath));
  const kanbanLiveOperationPlan = await readJson(path.join(cwd, paths.kanbanLiveOperationPlanPath));

  assertSchema(validators, "designer-workflow-trace-evidence.v0", designerEvidence, paths.designerEvidencePath);
  assertSchema(validators, "designer-workflow-trace-report.v0", designerReport, paths.designerReportPath);
  assertSchema(validators, "review-judgment-evidence.v0", p4Evidence, paths.reviewEvidencePath);
  assertSchema(validators, "surfaceops-decision-ledger.v0", p4DecisionLedger, paths.decisionLedgerPath);
  assertSchema(validators, "surfaceops-kanban-live-evidence.v0", kanbanLiveEvidence, paths.kanbanLiveEvidencePath);
  assertSchema(validators, "surfaceops-kanban-live-operation-plan.v0", kanbanLiveOperationPlan, paths.kanbanLiveOperationPlanPath);

  const designerEvidenceSelfHash = designerWorkflowTraceInternals.computeEvidenceSelfHash(designerEvidence);
  const p4EvidenceSelfHash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const kanbanLiveEvidenceSelfHash = surfaceopsKanbanLiveInternals.computeEvidenceSelfHash(kanbanLiveEvidence);
  const designerEvidenceRef = findSingleArtifactRef(designerEvidence, paths.designerEvidencePath, "designer workflow trace evidence");
  const designerReportRef = findSingleArtifactRef(designerEvidence, paths.designerReportPath, "designer workflow trace report");
  const p4EvidenceRef = findSingleArtifactRef(p4Evidence, paths.reviewEvidencePath, "P4 evidence");
  const p4DecisionLedgerRef = findSingleArtifactRef(p4Evidence, paths.decisionLedgerPath, "P4 decision ledger");
  const kanbanLiveEvidenceRef = findSingleArtifactRef(kanbanLiveEvidence, paths.kanbanLiveEvidencePath, "kanban live evidence");
  const kanbanLiveOperationPlanRef = findSingleArtifactRef(kanbanLiveEvidence, paths.kanbanLiveOperationPlanPath, "kanban live operation plan");

  const currentDesignerReportHash = await canonicalFileHash(path.join(cwd, paths.designerReportPath));
  const currentP4DecisionLedgerHash = await canonicalFileHash(path.join(cwd, paths.decisionLedgerPath));
  const currentKanbanLiveOperationPlanHash = await canonicalFileHash(path.join(cwd, paths.kanbanLiveOperationPlanPath));

  if (designerEvidence.schemaId !== "designer-workflow-trace-evidence.v0" || designerEvidence.status !== "pass" || designerEvidenceRef.hash !== designerEvidenceSelfHash) {
    throw contractError("SurfaceOps designer review UI upstream designer trace evidence is missing or not passing", 1);
  }
  if (designerEvidenceSelfHash !== DRUI_ACCEPTED_DWT_EVIDENCE_HASH || designerReportRef.hash !== currentDesignerReportHash) {
    throw contractError("SurfaceOps designer review UI upstream designer trace hash does not match the accepted boundary", 1);
  }
  if (p4Evidence.schemaId !== "review-judgment-evidence.v0" || p4Evidence.status !== "pass" || p4EvidenceRef.hash !== p4EvidenceSelfHash) {
    throw contractError("SurfaceOps designer review UI upstream P4 evidence is missing or not passing", 1);
  }
  if (p4EvidenceSelfHash !== DRUI_ACCEPTED_P4_EVIDENCE_HASH || p4DecisionLedgerRef.hash !== currentP4DecisionLedgerHash) {
    throw contractError("SurfaceOps designer review UI upstream P4 hash does not match the accepted boundary", 1);
  }
  if (kanbanLiveEvidence.schemaId !== "surfaceops-kanban-live-evidence.v0" || kanbanLiveEvidence.status !== "pass" || kanbanLiveEvidenceRef.hash !== kanbanLiveEvidenceSelfHash) {
    throw contractError("SurfaceOps designer review UI upstream kanban live evidence is missing or not passing", 1);
  }
  if (kanbanLiveEvidenceSelfHash !== DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH || kanbanLiveOperationPlanRef.hash !== currentKanbanLiveOperationPlanHash) {
    throw contractError("SurfaceOps designer review UI upstream kanban live hash does not match the accepted boundary", 1);
  }
  if (kanbanLiveOperationPlan.mappingStore?.owner !== "SurfaceOps" || kanbanLiveOperationPlan.conflictPolicy?.silentOverwriteAllowed !== false) {
    throw contractError("SurfaceOps designer review UI requires SurfaceOps-owned kanban mapping and non-silent conflict policy", 1);
  }
  const governanceOutcome = deriveSurfaceopsDesignerReviewGovernanceOutcome(designerEvidence, designerReport);

  return {
    designerEvidence,
    designerReport,
    p4Evidence,
    p4DecisionLedger,
    kanbanLiveEvidence,
    kanbanLiveOperationPlan,
    governanceOutcome,
    designerEvidenceRef: artifactRef(paths.designerEvidencePath, "designer-workflow-trace-evidence.v0", designerEvidenceSelfHash),
    designerReportRef: artifactRef(paths.designerReportPath, "designer-workflow-trace-report.v0", currentDesignerReportHash),
    p4EvidenceRef: artifactRef(paths.reviewEvidencePath, "review-judgment-evidence.v0", p4EvidenceSelfHash),
    p4DecisionLedgerRef: artifactRef(paths.decisionLedgerPath, "surfaceops-decision-ledger.v0", currentP4DecisionLedgerHash),
    kanbanLiveEvidenceRef: artifactRef(paths.kanbanLiveEvidencePath, "surfaceops-kanban-live-evidence.v0", kanbanLiveEvidenceSelfHash),
    kanbanLiveOperationPlanRef: artifactRef(paths.kanbanLiveOperationPlanPath, "surfaceops-kanban-live-operation-plan.v0", currentKanbanLiveOperationPlanHash)
  };
}

async function loadFixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectedResults) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    assertSchema(validators, "surfaceops-designer-review-ui-fixture.v0", fixture, expectation.fixturePath);
    rows.push({ fixture, expectation });
  }
  return rows;
}

async function assertExpectations(cwd, expectations, fixtureRoot, outRoot) {
  if (expectations.targetId !== DRUI_TARGET_ID || expectations.command !== DRUI_COMMAND || expectations.fixtureRoot !== fixtureRoot || expectations.artifactRoot !== outRoot) {
    throw contractError("SurfaceOps designer review UI expectations do not match the requested proof target", 1);
  }
  const actualPaths = expectations.expectedResults.map((row) => row.fixturePath);
  if (new Set(actualPaths).size !== actualPaths.length) {
    throw contractError("SurfaceOps designer review UI expectations contain duplicate fixture paths", 1);
  }
  const discoveredPaths = await discoverCaseFixturePaths(cwd, fixtureRoot);
  if (!arrayEquals([...actualPaths].sort(), discoveredPaths)) {
    throw contractError("SurfaceOps designer review UI expectations do not exactly cover the checked-in fixture corpus", 1);
  }
  if (
    expectations.runExpectation.totalResults !== actualPaths.length ||
    expectations.runExpectation.matchedResults !== actualPaths.length
  ) {
    throw contractError("SurfaceOps designer review UI run expectation count does not match the fixture corpus", 1);
  }
}

async function discoverCaseFixturePaths(cwd, fixtureRoot) {
  const paths = [];
  async function walk(relativeDir) {
    const entries = await fs.readdir(path.join(cwd, relativeDir), { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const relativePath = `${relativeDir}/${entry.name}`;
      if (entry.isDirectory()) await walk(relativePath);
      else if (entry.isFile() && /\.surfaceops-designer-review-ui(?:-evidence)?\.json$/.test(entry.name)) paths.push(relativePath);
    }
  }
  await walk(fixtureRoot);
  return paths.sort();
}

function assertRunExpectation(expectations, report) {
  const expected = expectations.runExpectation || {};
  if (report.status !== expected.status || report.promotionStatus !== expected.promotionStatus || report.validationResults.length !== expected.totalResults || report.validationResults.filter((row) => row.matched).length !== expected.matchedResults) {
    throw contractError("SurfaceOps designer review UI run expectation mismatch", 1);
  }
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const schemaPath of [...druiSchemaPaths(), ...druiConsumedSchemaPaths()]) {
    const schema = await readJson(path.join(cwd, schemaPath));
    const schemaId = schemaIdForDesignerReviewUiPath(schemaPath);
    ajv.addSchema(schema, schema.$id || schemaId);
    if (schemaId && !ajv.getSchema(schemaId)) {
      const aliasSchema = deepClone(schema);
      delete aliasSchema.$id;
      delete aliasSchema.$schema;
      ajv.addSchema(aliasSchema, schemaId);
    }
  }
  return ajv;
}

function assertSchema(ajv, schemaId, data, label) {
  const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-designer-review-ui/${schemaId}.schema.json`) || ajv.getSchema(schemaId);
  if (!validate) throw contractError(`missing schema validator for ${schemaId}`, 1);
  if (!validate(data)) {
    throw contractError(`schema validation failed for ${label}: ${ajv.errorsText(validate.errors, { separator: "; " })}`, 1);
  }
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const entries = await fs.readdir(path.join(cwd, DRUI_SCHEMA_ROOT), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !SCHEMA_FILE_NAME_PATTERN.test(entry.name)) {
      throw contractError(`schema root contains unsupported entry for SurfaceOps designer review UI proof: ${entry.name}`, 1);
    }
  }
  for (const schemaPath of [...druiSchemaPaths(), ...druiConsumedSchemaPaths()]) {
    await assertRegularLocalFile(path.join(cwd, schemaPath), schemaPath);
  }
}

async function assertRequiredFiles(cwd) {
  for (const artifactPath of [...druiSchemaPaths(), ...druiConsumedSchemaPaths(), ...druiFixturePaths()]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), artifactPath);
  }
}

function assertCommandRoots(paths) {
  if (
    paths.designerEvidencePath !== DRUI_DWT_EVIDENCE_PATH ||
    paths.designerReportPath !== DRUI_DWT_REPORT_PATH ||
    paths.reviewEvidencePath !== DRUI_P4_EVIDENCE_PATH ||
    paths.decisionLedgerPath !== DRUI_P4_DECISION_LEDGER_PATH ||
    paths.kanbanLiveEvidencePath !== DRUI_KANBAN_LIVE_EVIDENCE_PATH ||
    paths.kanbanLiveOperationPlanPath !== DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH ||
    paths.fixtureRoot !== DRUI_FIXTURE_ROOT ||
    paths.outRoot !== DRUI_ARTIFACT_ROOT
  ) {
    throw contractError(`SurfaceOps designer review UI proof requires ${usage()}`, 2);
  }
}

async function rejectStaleOutput(cwd, outRoot) {
  const outDir = await ensureSafeOutputDirectory(cwd, outRoot);
  let entries = [];
  try {
    entries = await fs.readdir(outDir, { withFileTypes: true });
  } catch (error) {
    throw contractError(`output path error for --out ${outRoot}: ${error.code || error.message}`, 2);
  }
  const allowed = new Set(DRUI_GENERATED_ARTIFACTS);
  const stale = [];
  const unsafeExpected = [];
  for (const entry of entries) {
    const entryPath = `${outRoot}/${entry.name}${entry.isDirectory() ? "/" : ""}`;
    if (!allowed.has(entry.name)) stale.push(entryPath);
    else if (!entry.isFile()) unsafeExpected.push(entryPath);
  }
  if (unsafeExpected.length > 0) {
    throw contractError(`unsafe expected output entry under --out: ${unsafeExpected.sort().join(", ")}`, 1);
  }
  if (stale.length > 0) {
    throw contractError(`SurfaceOps designer review UI stale unexpected output: ${stale.sort().join(", ")}`, 1);
  }
}

async function ensureSafeOutputDirectory(cwd, outRoot) {
  let current = cwd;
  for (const segment of outRoot.split("/")) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw contractError(`output path error for --out ${outRoot}: ${error.code || error.message}`, 2);
      }
      await fs.mkdir(current);
      stat = await fs.lstat(current);
    }
    if (!stat.isDirectory()) {
      throw contractError(`output path error for --out ${outRoot}: ${path.relative(cwd, current)} is not a directory`, 2);
    }
  }
  return current;
}

async function refsForPaths(cwd, artifactPaths) {
  const refs = [];
  for (const artifactPath of artifactPaths) {
    refs.push(artifactRef(artifactPath, schemaIdForDesignerReviewUiPath(artifactPath) || "unknown.v0", await canonicalFileHash(path.join(cwd, artifactPath))));
  }
  return refs;
}

function upstreamRefs(upstream) {
  return [
    upstream.designerEvidenceRef,
    upstream.p4EvidenceRef,
    upstream.kanbanLiveEvidenceRef
  ];
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

function buildRunId({ upstream, targetSelectionRef, workbenchRef, decisionReceiptRef, expectations, command, args }) {
  return `surfaceops-designer-review-ui-${sha256Hex(canonicalJson({
    designerEvidence: upstream.designerEvidenceRef.hash,
    p4: upstream.p4EvidenceRef.hash,
    kanbanLive: upstream.kanbanLiveEvidenceRef.hash,
    targetSelection: targetSelectionRef.hash,
    workbench: workbenchRef.hash,
    decisionReceipt: decisionReceiptRef.hash,
    expectations: expectations.expectedResults.map((row) => row.fixturePath),
    command,
    args
  })).slice(0, 32)}`;
}

function aggregatePromotionStatus(results, upstream) {
  if (results.some((result) => !result.matched)) return "blocked";
  const statuses = [
    upstream.designerEvidence.promotionStatus,
    upstream.p4Evidence.promotionStatus,
    upstream.kanbanLiveEvidence.promotionStatus,
    ...results.map((result) => result.promotionStatus)
  ];
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("review_required")) return "review_required";
  return "allowed";
}

function publicValidationResults(results) {
  return results.map((result) => ({
    fixturePath: result.fixturePath,
    expectedResult: result.expectedResult,
    actualResult: result.actualResult,
    promotionStatus: result.promotionStatus,
    expectedDiagnosticCodes: result.expectedDiagnosticCodes,
    diagnosticCodes: result.diagnosticCodes,
    matched: result.matched
  }));
}

function findSingleArtifactRef(evidence, artifactPath, label) {
  const refs = (evidence.artifacts || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) throw contractError(`SurfaceOps designer review UI ${label} must contain exactly one ref for ${artifactPath}`, 1);
  return refs[0];
}

function node(nodeId, label, role, status) {
  return { nodeId, label, role, status };
}

function edge(from, to, label) {
  return { from, to, label };
}

function assertWorkbenchGraph(workbench) {
  const nodes = workbench?.dag?.nodes || [];
  const edges = workbench?.dag?.edges || [];
  const nodeIds = nodes.map((entry) => entry.nodeId);
  const requiredNodeIds = ["kanban-card", "surfaceops-intake", "authority-trace", "inspector", "decision-receipt", "kanban-mirror"];
  if (new Set(nodeIds).size !== nodeIds.length || !requiredNodeIds.every((nodeId) => nodeIds.includes(nodeId))) {
    throw contractError("SurfaceOps designer review UI DAG requires unique canonical nodes", 1);
  }
  if (!nodeIds.includes(workbench.inspector?.selectedNodeId)) {
    throw contractError("SurfaceOps designer review UI inspector selection is not present in the DAG", 1);
  }
  const outgoing = new Map(nodeIds.map((nodeId) => [nodeId, []]));
  for (const edgeEntry of edges) {
    if (!outgoing.has(edgeEntry.from) || !outgoing.has(edgeEntry.to)) {
      throw contractError("SurfaceOps designer review UI DAG contains an unresolved edge endpoint", 1);
    }
    outgoing.get(edgeEntry.from).push(edgeEntry.to);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(nodeId) {
    if (visiting.has(nodeId)) throw contractError("SurfaceOps designer review UI DAG must be acyclic", 1);
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    for (const next of outgoing.get(nodeId)) visit(next);
    visiting.delete(nodeId);
    visited.add(nodeId);
  }
  for (const nodeId of nodeIds) visit(nodeId);
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((left, right) => `${left.code}:${left.artifactPath}`.localeCompare(`${right.code}:${right.artifactPath}`));
}

function arrayEquals(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function assertReadableDir(dirPath, message) {
  const stat = await fs.stat(dirPath).catch((error) => {
    if (error.code === "ENOENT") throw contractError(message, 1);
    throw error;
  });
  if (!stat.isDirectory()) throw contractError(message, 1);
}

async function assertRegularLocalFile(filePath, label) {
  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw contractError(`SurfaceOps designer review UI input is not a regular file: ${label}`, 1);
  } catch (error) {
    if (error.exitCode) throw error;
    throw contractError(`SurfaceOps designer review UI input is missing: ${label}`, 1);
  }
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

function usage() {
  return `interfacectl surfaces surfaceops-designer-review-ui proof --designer-evidence ${DRUI_DWT_EVIDENCE_PATH} --designer-report ${DRUI_DWT_REPORT_PATH} --review-evidence ${DRUI_P4_EVIDENCE_PATH} --decision-ledger ${DRUI_P4_DECISION_LEDGER_PATH} --kanban-live-evidence ${DRUI_KANBAN_LIVE_EVIDENCE_PATH} --kanban-live-operation-plan ${DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH} --fixture ${DRUI_FIXTURE_ROOT} --out ${DRUI_ARTIFACT_ROOT}`;
}

export const surfaceopsDesignerReviewUiInternals = {
  computeEvidenceSelfHash: computeSurfaceopsDesignerReviewUiEvidenceSelfHash,
  authorityBoundary
};
