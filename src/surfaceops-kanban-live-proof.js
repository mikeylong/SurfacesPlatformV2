import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p3Internals } from "./p3-proof.js";
import { p4Internals } from "./p4-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  KL_ACCEPTED_API_MANIFEST_HASH,
  KL_ACCEPTED_P3_EVIDENCE_HASH,
  KL_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH,
  KL_ACCEPTED_P3_REVIEW_QUEUE_HASH,
  KL_ACCEPTED_P4_DECISION_LEDGER_HASH,
  KL_ACCEPTED_P4_EVALUATION_REPORT_HASH,
  KL_ACCEPTED_P4_EVIDENCE_HASH,
  KL_ACCEPTED_P4_REVIEW_REPORT_HASH,
  KL_API_MANIFEST_PATH,
  KL_ARTIFACT_PATHS,
  KL_ARTIFACT_ROOT,
  KL_COMMAND,
  KL_CONSUMED_SCHEMA_FILES,
  KL_CONTRACT_ID,
  KL_EXPECTATION_ROWS,
  KL_FIXTURE_ROOT,
  KL_GENERATED_ARTIFACTS,
  KL_P3_EVIDENCE_PATH,
  KL_P3_ORCHESTRATION_REPORT_PATH,
  KL_P3_REVIEW_QUEUE_PATH,
  KL_P4_DECISION_LEDGER_PATH,
  KL_P4_EVALUATION_REPORT_PATH,
  KL_P4_EVIDENCE_PATH,
  KL_P4_REVIEW_REPORT_PATH,
  KL_RUNTIME_OUTPUT_ROOT,
  KL_SCENARIO_ID,
  KL_SCHEMA_FILES,
  KL_SCHEMA_ROOT,
  KL_SOURCE_ROOT,
  KL_TARGET_ID,
  KL_TARGET_KIND,
  KL_TIMESTAMP,
  KL_VERSION,
  artifactRef,
  defaultApiManifestRef,
  defaultUpstreamRefs,
  diagnosticForCode,
  diagnosticsRegistry,
  klConsumedSchemaPaths,
  klFixturePaths,
  klSchemaPaths,
  klSourcePaths,
  provenance,
  schemaIdForSurfaceopsKanbanLivePath
} from "./surfaceops-kanban-live-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;

export async function runSurfaceopsKanbanLiveInterfacectl(argv, io) {
  const parsed = parseSurfaceopsKanbanLiveArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runSurfaceopsKanbanLiveProof({
      cwd: io.cwd,
      orchestrationEvidencePath: parsed.orchestrationEvidence,
      reviewQueuePath: parsed.reviewQueue,
      orchestrationReportPath: parsed.orchestrationReport,
      reviewEvidencePath: parsed.reviewEvidence,
      decisionLedgerPath: parsed.decisionLedger,
      reviewReportPath: parsed.reviewReport,
      evaluationReportPath: parsed.evaluationReport,
      kanbanApiManifestPath: parsed.kanbanApiManifest,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: KL_COMMAND,
      args: {
        orchestrationEvidence: parsed.orchestrationEvidence,
        reviewQueue: parsed.reviewQueue,
        orchestrationReport: parsed.orchestrationReport,
        reviewEvidence: parsed.reviewEvidence,
        decisionLedger: parsed.decisionLedger,
        reviewReport: parsed.reviewReport,
        evaluationReport: parsed.evaluationReport,
        kanbanApiManifest: parsed.kanbanApiManifest,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces surfaceops-kanban-live proof: ${result.status}`,
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

function parseSurfaceopsKanbanLiveArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--orchestration-evidence") result.orchestrationEvidence = argv[++index];
    else if (current === "--review-queue") result.reviewQueue = argv[++index];
    else if (current === "--orchestration-report") result.orchestrationReport = argv[++index];
    else if (current === "--review-evidence") result.reviewEvidence = argv[++index];
    else if (current === "--decision-ledger") result.decisionLedger = argv[++index];
    else if (current === "--review-report") result.reviewReport = argv[++index];
    else if (current === "--evaluation-report") result.evaluationReport = argv[++index];
    else if (current === "--kanban-api-manifest") result.kanbanApiManifest = argv[++index];
    else if (current === "--fixture") result.fixture = argv[++index];
    else if (current === "--out") result.out = argv[++index];
    else return { ok: false, error: `unexpected argument: ${current}` };
  }
  if (!result.orchestrationEvidence || !result.reviewQueue || !result.orchestrationReport || !result.reviewEvidence || !result.decisionLedger || !result.reviewReport || !result.evaluationReport || !result.kanbanApiManifest || !result.fixture || !result.out) {
    return { ok: false, error: usage() };
  }
  for (const [flagName, value] of [
    ["--orchestration-evidence", result.orchestrationEvidence],
    ["--review-queue", result.reviewQueue],
    ["--orchestration-report", result.orchestrationReport],
    ["--review-evidence", result.reviewEvidence],
    ["--decision-ledger", result.decisionLedger],
    ["--review-report", result.reviewReport],
    ["--evaluation-report", result.evaluationReport],
    ["--kanban-api-manifest", result.kanbanApiManifest],
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

export async function runSurfaceopsKanbanLiveProof({
  cwd,
  orchestrationEvidencePath,
  reviewQueuePath,
  orchestrationReportPath,
  reviewEvidencePath,
  decisionLedgerPath,
  reviewReportPath,
  evaluationReportPath,
  kanbanApiManifestPath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({
    orchestrationEvidencePath,
    reviewQueuePath,
    orchestrationReportPath,
    reviewEvidencePath,
    decisionLedgerPath,
    reviewReportPath,
    evaluationReportPath,
    kanbanApiManifestPath,
    fixtureRoot,
    outRoot
  });
  await assertReadableDir(path.join(cwd, KL_SCHEMA_ROOT), `unreadable schema path: ${KL_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  const upstream = await strictUpstreamPreflight(cwd, {
    orchestrationEvidencePath,
    reviewQueuePath,
    orchestrationReportPath,
    reviewEvidencePath,
    decisionLedgerPath,
    reviewReportPath,
    evaluationReportPath,
    kanbanApiManifestPath
  }, validators);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredFiles(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "surfaceops-kanban-live-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  assertExpectations(expectations, fixtureRoot, outRoot);

  const targetSelectionFixture = await readJson(path.join(cwd, fixtureRoot, "target-selection.fixture.json"));
  assertSchema(validators, "surfaceops-kanban-live-target-selection.v0", targetSelectionFixture, `${fixtureRoot}/target-selection.fixture.json`);
  const targetSelection = buildTargetSelection({ upstream, fixture: targetSelectionFixture });
  assertSchema(validators, "surfaceops-kanban-live-target-selection.v0", targetSelection, `${outRoot}/surfaceops-kanban-live-target-selection.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-live-target-selection.json"), targetSelection);
  const targetSelectionRef = artifactRef(`${outRoot}/surfaceops-kanban-live-target-selection.json`, "surfaceops-kanban-live-target-selection.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-live-target-selection.json")));

  const apiProjection = buildApiProjection(upstream);
  assertSchema(validators, "kanban-cards-api-manifest.v0", apiProjection, `${outRoot}/surfaceops-kanban-live-api-projection.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-live-api-projection.json"), apiProjection);
  const apiProjectionRef = artifactRef(`${outRoot}/surfaceops-kanban-live-api-projection.json`, "kanban-cards-api-manifest.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-live-api-projection.json")));

  const operationPlan = buildOperationPlan({ upstream, targetSelectionRef });
  assertSchema(validators, "surfaceops-kanban-live-operation-plan.v0", operationPlan, `${outRoot}/surfaceops-kanban-live-operation-plan.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-live-operation-plan.json"), operationPlan);
  const operationPlanRef = artifactRef(`${outRoot}/surfaceops-kanban-live-operation-plan.json`, "surfaceops-kanban-live-operation-plan.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-live-operation-plan.json")));

  const handoffRecord = buildHandoffRecord({ upstream, operationPlanRef });
  assertSchema(validators, "surfaceops-kanban-live-handoff-record.v0", handoffRecord, `${outRoot}/surfaceops-kanban-live-handoff-record.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-live-handoff-record.json"), handoffRecord);
  const handoffRecordRef = artifactRef(`${outRoot}/surfaceops-kanban-live-handoff-record.json`, "surfaceops-kanban-live-handoff-record.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-live-handoff-record.json")));

  const fixtureRows = await loadFixtureRows(cwd, expectations, validators);
  const validationResults = evaluateExpectations(fixtureRows);
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "fail") {
    throw contractError(`SurfaceOps kanban live validation expectation mismatch: ${validationResults.filter((result) => !result.matched).map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.expectedDiagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.diagnosticCodes.join(",") || "none"}`).join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults);
  const runId = buildRunId({
    upstream,
    targetSelectionRef,
    apiProjectionRef,
    operationPlanRef,
    handoffRecordRef,
    expectations,
    command,
    args
  });
  const artifactRefs = [targetSelectionRef, apiProjectionRef, operationPlanRef, handoffRecordRef];
  const report = buildReport({
    runId,
    upstream,
    artifactRefs,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "surfaceops-kanban-live-adapter-report.v0", report, `${outRoot}/surfaceops-kanban-live-adapter-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-live-adapter-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/surfaceops-kanban-live-adapter-report.json`, "surfaceops-kanban-live-adapter-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-live-adapter-report.json")));

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
  assertSchema(validators, "surfaceops-kanban-live-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: KL_GENERATED_ARTIFACTS
  };
}

function buildTargetSelection({ upstream, fixture }) {
  return {
    ...deepClone(fixture),
    targetId: KL_TARGET_ID,
    targetKind: KL_TARGET_KIND,
    upstreamRefs: upstreamRefs(upstream),
    apiManifestRef: upstream.apiManifestRef,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-live-target-selection", [
      KL_P3_EVIDENCE_PATH,
      KL_P4_EVIDENCE_PATH,
      KL_API_MANIFEST_PATH
    ])
  };
}

function buildApiProjection(upstream) {
  return {
    ...deepClone(upstream.apiManifest),
    manifestId: "kanban-cards-local-live-api-v0-projection",
    provenance: provenance("interfacectl-surfaceops-kanban-live-api-projection", [
      KL_API_MANIFEST_PATH,
      upstream.apiManifestRef.path
    ])
  };
}

function buildOperationPlan({ upstream, targetSelectionRef }) {
  const evidenceRefs = upstreamRefs(upstream);
  return {
    schemaId: "surfaceops-kanban-live-operation-plan.v0",
    version: KL_VERSION,
    targetSelectionRef,
    apiManifestRef: upstream.apiManifestRef,
    adapterMode: "surfaceops-backend-adapter",
    operations: [
      operation("health", "GET", "/api/health", "admin-bootstrap", "verify local kanban.cards server health", "health responds ok"),
      operation("unauthenticated-write-denied", "POST", "/api/boards", "anonymous", "prove missing auth cannot create a board", "returns 401 or 403"),
      operation("bootstrap-board", "POST", "/api/boards", "admin-bootstrap", "create dedicated SurfaceOps Approvals board", "board id persisted"),
      operation("create-agent-session", "POST", "/api/boards/:boardId/agent-sessions", "admin-bootstrap", "create scoped adapter agent session", "token redacted and session persisted"),
      operation("create-evidence-card", "POST", "/api/boards/:boardId/work-items", "scoped-agent", "create card from SurfaceOps evidence refs", "card contains redacted evidence marker"),
      operation("move-card", "PATCH", "/api/boards/:boardId/work-items/:itemId", "scoped-agent", "move card as collaboration signal", "move does not commit SurfaceOps decision"),
      operation("append-comment", "POST", "/api/boards/:boardId/work-items/:itemId/comments", "scoped-agent", "append designer/reviewer collaboration comment", "comment event is replayable"),
      operation("stream-events", "GET", "/api/events", "admin-backend", "receive realtime workspace_changed event", "SSE cursor observed"),
      operation("replay-events", "GET", "/api/boards/:boardId/events", "admin-backend", "replay board/card event history", "card_created and comment_created replay"),
      operation("whole-state-shortcut-denied", "PUT", "/api/state", "scoped-agent", "prove whole-state shortcut writes are denied", "scoped agent receives 403 for whole-state write"),
      operation("restart-persistence", "GET", "/api/boards/:boardId", "admin-backend", "verify state after local server restart", "card and comment survive restart"),
      operation("adapter-marker-reconcile", "GET", "/api/boards/:boardId", "surfaceops-adapter", "reconcile by deterministic marker before duplicate create", "existing SurfaceOps review card is found and duplicate create is skipped")
    ],
    mappingStore: {
      owner: "SurfaceOps",
      implementedInThisProof: false,
      plannedStoreShape: [
        "kanban_board_bindings",
        "kanban_card_bindings",
        "kanban_sync_outbox",
        "kanban_event_cursor",
        "kanban_sync_audit",
        "kanban_conflicts",
        "surfaceops_decisions"
      ],
      cardBindingKey: "reviewItemId + evidenceHash",
      cardTextIsAuthority: false
    },
    conflictPolicy: {
      authorityFieldsWinner: "SurfaceOps",
      comments: "append-only-merge",
      laneMoves: "signals-until-structured-decision",
      evidenceHashChange: "successor-card",
      silentOverwriteAllowed: false
    },
    evidenceRefs,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-live-operation-plan", [
      targetSelectionRef.path,
      KL_API_MANIFEST_PATH
    ])
  };
}

function buildHandoffRecord({ upstream, operationPlanRef }) {
  return {
    schemaId: "surfaceops-kanban-live-handoff-record.v0",
    version: KL_VERSION,
    operationPlanRef,
    designerWorkflow: {
      startsAtVisionStep: "inspect evidence, not only pixels",
      boardPurpose: "track SurfaceOps approvals for designer workflow coordination",
      cardMapping: "one card per SurfaceOps review item and evidence hash",
      laneMovesCommitDecisions: false,
      structuredDecisionRequired: true
    },
    boundary: liveBoundary(),
    runtimeEvidence: {
      required: true,
      outputRoot: KL_RUNTIME_OUTPUT_ROOT,
      reportPath: `${KL_RUNTIME_OUTPUT_ROOT}/browser-functional-report.json`,
      evidencePath: `${KL_RUNTIME_OUTPUT_ROOT}/browser-functional-evidence.json`,
      recordingPath: `${KL_RUNTIME_OUTPUT_ROOT}/surfaceops-kanban-live-browser.webm`
    },
    handoffEligibility: {
      deterministicProof: "required",
      browserFunctionalProof: "required",
      productionAdapterClaim: false,
      postgresClaim: false,
      auth0DelegatedClaim: false
    },
    evidenceRefs: upstreamRefs(upstream),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-live-handoff-record", [
      operationPlanRef.path,
      "VISION.md",
      "plans/surfaceops-ui-decisions-review-criteria.md"
    ])
  };
}

function operation(operationId, method, endpoint, actor, purpose, expectedProofAssertion) {
  return {
    operationId,
    method,
    endpoint,
    actor,
    purpose,
    idempotencyKey: `surfaceops-kanban-live:${operationId}:{{reviewItemId}}:{{evidenceHash}}`,
    redacted: true,
    expectedProofAssertion
  };
}

function buildReport({ runId, upstream, artifactRefs, validationResults, diagnostics, status, promotionStatus }) {
  return {
    schemaId: "surfaceops-kanban-live-adapter-report.v0",
    version: KL_VERSION,
    runId,
    targetId: KL_TARGET_ID,
    status,
    promotionStatus,
    upstreamPreflight: {
      status: "pass",
      p3EvidenceRef: upstream.p3EvidenceRef,
      p4EvidenceRef: upstream.p4EvidenceRef
    },
    apiPreflight: {
      status: "pass",
      apiManifestRef: upstream.apiManifestRef,
      localOnly: true,
      endpointCount: upstream.apiManifest.endpoints.length,
      deniedEndpoints: upstream.apiManifest.explicitlyDeniedEndpoints
    },
    artifactRefs,
    validationResults: publicValidationResults(validationResults),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-live-adapter-report", [
      ...artifactRefs.map((ref) => ref.path),
      KL_API_MANIFEST_PATH
    ])
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, artifactRefs, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = await refsForPaths(cwd, [...klSchemaPaths(), ...klConsumedSchemaPaths()]);
  const fixtureRefs = await refsForPaths(cwd, klFixturePaths());
  const boundaryRefs = [upstream.apiManifestRef, ...upstreamRefs(upstream)];
  const artifactsWithoutEvidence = [...artifactRefs];
  const evidenceRef = artifactRef(`${KL_ARTIFACT_ROOT}/evidence.json`, "surfaceops-kanban-live-evidence.v0", null);
  const evidence = {
    schemaId: "surfaceops-kanban-live-evidence.v0",
    version: KL_VERSION,
    runId,
    contractId: KL_CONTRACT_ID,
    targetId: KL_TARGET_ID,
    status,
    promotionStatus,
    command,
    args,
    checkedAt: KL_TIMESTAMP,
    environment: { generatedAt: KL_TIMESTAMP, host: null },
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts: [...artifactsWithoutEvidence, evidenceRef],
    validationResults: publicValidationResults(validationResults),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-live-evidence", [
      ...klSchemaPaths(),
      ...klFixturePaths(),
      ...klSourcePaths(),
      ...artifactsWithoutEvidence.map((ref) => ref.path)
    ])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

function evaluateExpectations(fixtureRows) {
  return fixtureRows.map((fixture) => {
    const diagnostics = diagnosticsForFixture(fixture);
    const actualResult = diagnostics.length === 0 ? "valid" : diagnostics[0].validationResult;
    const promotionStatus = diagnostics.length === 0 ? "allowed" : diagnostics[0].promotionStatus;
    const diagnosticCodes = diagnostics.map((diagnostic) => diagnostic.code);
    const matched =
      actualResult === fixture.expectedResult &&
      promotionStatus === fixture.expectedPromotionStatus &&
      arrayEquals(diagnosticCodes, fixture.diagnosticCodes);
    return {
      fixturePath: fixture.fixturePath,
      expectedResult: fixture.expectedResult,
      actualResult,
      promotionStatus,
      expectedDiagnosticCodes: fixture.diagnosticCodes,
      diagnosticCodes,
      diagnostics,
      matched
    };
  });
}

function diagnosticsForFixture(fixture) {
  const codes = [];
  if (!fixture.targetId) codes.push("SURFACEOPS_KANBAN_LIVE_TARGET_UNDECLARED");
  if (fixture.targetOutOfScope) codes.push("SURFACEOPS_KANBAN_LIVE_TARGET_OUT_OF_SCOPE");
  if (fixture.authorityOverride) codes.push("SURFACEOPS_KANBAN_LIVE_AUTHORITY_OVERRIDE");
  if (fixture.missingEvidenceRef || fixture.evidenceRefs.length === 0) codes.push("SURFACEOPS_KANBAN_LIVE_EVIDENCE_REF_MISSING");
  if (fixture.secretLeak) codes.push("SURFACEOPS_KANBAN_LIVE_SECRET_LEAK");
  if (fixture.unsupportedEndpoint) codes.push("SURFACEOPS_KANBAN_LIVE_UNSUPPORTED_ENDPOINT");
  if (fixture.productionUrl) codes.push("SURFACEOPS_KANBAN_LIVE_PRODUCTION_URL_FORBIDDEN");
  if (fixture.permissionBypass) codes.push("SURFACEOPS_KANBAN_LIVE_PERMISSION_BYPASS");
  if (fixture.conflictSilentOverwrite) codes.push("SURFACEOPS_KANBAN_LIVE_CONFLICT_REQUIRED");
  if (fixture.idempotencyMissing) codes.push("SURFACEOPS_KANBAN_LIVE_IDEMPOTENCY_REQUIRED");
  if (fixture.laneMoveSignal) codes.push("SURFACEOPS_KANBAN_LIVE_REVIEW_REQUIRED");
  if (fixture.mutation && !codes.includes(fixture.mutation)) codes.push(fixture.mutation);
  return codes.map((code) => diagnosticForCode(code, { artifactPath: fixture.fixturePath }));
}

async function strictUpstreamPreflight(cwd, paths, validators) {
  for (const [artifactPath, label] of [
    [paths.orchestrationEvidencePath, "P3 orchestration evidence"],
    [paths.reviewQueuePath, "P3 review queue"],
    [paths.orchestrationReportPath, "P3 orchestration report"],
    [paths.reviewEvidencePath, "P4 review evidence"],
    [paths.decisionLedgerPath, "P4 decision ledger"],
    [paths.reviewReportPath, "P4 review judgment report"],
    [paths.evaluationReportPath, "P4 JudgmentKit evaluation report"],
    [paths.kanbanApiManifestPath, "kanban.cards API manifest"]
  ]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), label);
  }

  const p3Evidence = await readJson(path.join(cwd, paths.orchestrationEvidencePath));
  const p3ReviewQueue = await readJson(path.join(cwd, paths.reviewQueuePath));
  const p3OrchestrationReport = await readJson(path.join(cwd, paths.orchestrationReportPath));
  const p4Evidence = await readJson(path.join(cwd, paths.reviewEvidencePath));
  const p4DecisionLedger = await readJson(path.join(cwd, paths.decisionLedgerPath));
  const p4ReviewReport = await readJson(path.join(cwd, paths.reviewReportPath));
  const p4EvaluationReport = await readJson(path.join(cwd, paths.evaluationReportPath));
  const apiManifest = await readJson(path.join(cwd, paths.kanbanApiManifestPath));

  assertSchema(validators, "agent-orchestration-evidence.v0", p3Evidence, paths.orchestrationEvidencePath);
  assertSchema(validators, "agent-review-queue.v0", p3ReviewQueue, paths.reviewQueuePath);
  assertSchema(validators, "agent-orchestration-report.v0", p3OrchestrationReport, paths.orchestrationReportPath);
  assertSchema(validators, "review-judgment-evidence.v0", p4Evidence, paths.reviewEvidencePath);
  assertSchema(validators, "surfaceops-decision-ledger.v0", p4DecisionLedger, paths.decisionLedgerPath);
  assertSchema(validators, "review-judgment-report.v0", p4ReviewReport, paths.reviewReportPath);
  assertSchema(validators, "judgmentkit-evaluation-report.v0", p4EvaluationReport, paths.evaluationReportPath);
  assertSchema(validators, "kanban-cards-api-manifest.v0", apiManifest, paths.kanbanApiManifestPath);

  const p3EvidenceSelfHash = p3Internals.computeEvidenceSelfHash(p3Evidence);
  const p4EvidenceSelfHash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const p3EvidenceRef = findSingleArtifactRef(p3Evidence, paths.orchestrationEvidencePath, "P3 evidence");
  const p3ReviewQueueRef = findSingleArtifactRef(p3Evidence, paths.reviewQueuePath, "P3 review queue");
  const p3OrchestrationReportRef = findSingleArtifactRef(p3Evidence, paths.orchestrationReportPath, "P3 orchestration report");
  const p4EvidenceRef = findSingleArtifactRef(p4Evidence, paths.reviewEvidencePath, "P4 evidence");
  const p4DecisionLedgerRef = findSingleArtifactRef(p4Evidence, paths.decisionLedgerPath, "P4 decision ledger");
  const p4ReviewReportRef = findSingleArtifactRef(p4Evidence, paths.reviewReportPath, "P4 review report");
  const p4EvaluationReportRef = findSingleArtifactRef(p4Evidence, paths.evaluationReportPath, "P4 evaluation report");

  if (p3Evidence.schemaId !== "agent-orchestration-evidence.v0" || p3EvidenceRef.hash !== p3EvidenceSelfHash || p3Evidence.status !== "pass") {
    throw contractError("SurfaceOps kanban live upstream P3 evidence is missing or not passing", 1);
  }
  const currentReviewQueueHash = await canonicalFileHash(path.join(cwd, paths.reviewQueuePath));
  const currentOrchestrationReportHash = await canonicalFileHash(path.join(cwd, paths.orchestrationReportPath));
  if (
    p3EvidenceSelfHash !== KL_ACCEPTED_P3_EVIDENCE_HASH ||
    p3ReviewQueueRef.hash !== currentReviewQueueHash ||
    currentReviewQueueHash !== KL_ACCEPTED_P3_REVIEW_QUEUE_HASH ||
    p3OrchestrationReportRef.hash !== currentOrchestrationReportHash ||
    currentOrchestrationReportHash !== KL_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH
  ) {
    throw contractError("SurfaceOps kanban live upstream P3 evidence or artifact hash does not match the accepted boundary", 1);
  }

  if (p4Evidence.schemaId !== "review-judgment-evidence.v0" || p4EvidenceRef.hash !== p4EvidenceSelfHash || p4Evidence.status !== "pass") {
    throw contractError("SurfaceOps kanban live upstream P4 evidence is missing or not passing", 1);
  }
  const currentDecisionLedgerHash = await canonicalFileHash(path.join(cwd, paths.decisionLedgerPath));
  const currentReviewReportHash = await canonicalFileHash(path.join(cwd, paths.reviewReportPath));
  const currentEvaluationReportHash = await canonicalFileHash(path.join(cwd, paths.evaluationReportPath));
  if (
    p4EvidenceSelfHash !== KL_ACCEPTED_P4_EVIDENCE_HASH ||
    p4DecisionLedgerRef.hash !== currentDecisionLedgerHash ||
    currentDecisionLedgerHash !== KL_ACCEPTED_P4_DECISION_LEDGER_HASH ||
    p4ReviewReportRef.hash !== currentReviewReportHash ||
    currentReviewReportHash !== KL_ACCEPTED_P4_REVIEW_REPORT_HASH ||
    p4EvaluationReportRef.hash !== currentEvaluationReportHash ||
    currentEvaluationReportHash !== KL_ACCEPTED_P4_EVALUATION_REPORT_HASH
  ) {
    throw contractError("SurfaceOps kanban live upstream P4 evidence or artifact hash does not match the accepted boundary", 1);
  }

  const currentApiManifestHash = await canonicalFileHash(path.join(cwd, paths.kanbanApiManifestPath));
  if (currentApiManifestHash !== KL_ACCEPTED_API_MANIFEST_HASH) {
    throw contractError("SurfaceOps kanban live API manifest hash does not match the accepted boundary", 1);
  }
  if (!apiManifest.endpoints.some((endpoint) => endpoint.method === "GET" && endpoint.path === "/api/events")) {
    throw contractError("SurfaceOps kanban live API manifest does not declare realtime events", 1);
  }

  return {
    p3Evidence,
    p3ReviewQueue,
    p3OrchestrationReport,
    p4Evidence,
    p4DecisionLedger,
    p4ReviewReport,
    p4EvaluationReport,
    apiManifest,
    p3EvidenceRef: artifactRef(paths.orchestrationEvidencePath, "agent-orchestration-evidence.v0", p3EvidenceSelfHash),
    p3ReviewQueueRef: artifactRef(paths.reviewQueuePath, "agent-review-queue.v0", currentReviewQueueHash, { sourceEvidenceHash: p3EvidenceSelfHash }),
    p3OrchestrationReportRef: artifactRef(paths.orchestrationReportPath, "agent-orchestration-report.v0", currentOrchestrationReportHash, { sourceEvidenceHash: p3EvidenceSelfHash }),
    p4EvidenceRef: artifactRef(paths.reviewEvidencePath, "review-judgment-evidence.v0", p4EvidenceSelfHash),
    p4DecisionLedgerRef: artifactRef(paths.decisionLedgerPath, "surfaceops-decision-ledger.v0", currentDecisionLedgerHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    p4ReviewReportRef: artifactRef(paths.reviewReportPath, "review-judgment-report.v0", currentReviewReportHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    p4EvaluationReportRef: artifactRef(paths.evaluationReportPath, "judgmentkit-evaluation-report.v0", currentEvaluationReportHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    apiManifestRef: artifactRef(paths.kanbanApiManifestPath, "kanban-cards-api-manifest.v0", currentApiManifestHash)
  };
}

async function loadFixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectedResults) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    const schemaId = expectation.fixturePath.endsWith("-preflight.json")
      ? "surfaceops-kanban-live-preflight-mutation.v0"
      : "surfaceops-kanban-live-fixture.v0";
    assertSchema(validators, schemaId, fixture, expectation.fixturePath);
    rows.push({ ...fixture, fixturePath: expectation.fixturePath });
  }
  return rows;
}

function assertExpectations(expectations, fixtureRoot, outRoot) {
  if (expectations.targetId !== KL_TARGET_ID || expectations.command !== KL_COMMAND || expectations.fixtureRoot !== fixtureRoot || expectations.artifactRoot !== outRoot) {
    throw contractError("SurfaceOps kanban live expectations do not match the requested proof target", 1);
  }
  const expectedPaths = KL_EXPECTATION_ROWS.map((row) => row.fixturePath);
  const actualPaths = expectations.expectedResults.map((row) => row.fixturePath);
  if (!arrayEquals(actualPaths, expectedPaths)) {
    throw contractError("SurfaceOps kanban live expectations fixture list drifted", 1);
  }
}

function assertRunExpectation(expectations, report) {
  const expected = expectations.runExpectation || {};
  if (report.status !== expected.status || report.promotionStatus !== expected.promotionStatus || report.validationResults.length !== expected.totalResults || report.validationResults.filter((row) => row.matched).length !== expected.matchedResults) {
    throw contractError("SurfaceOps kanban live run expectation mismatch", 1);
  }
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const schemaPath of [...klSchemaPaths(), ...klConsumedSchemaPaths()]) {
    const schema = await readJson(path.join(cwd, schemaPath));
    const schemaId = schemaIdForSurfaceopsKanbanLivePath(schemaPath);
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
  const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-kanban-live/${schemaId}.schema.json`) || ajv.getSchema(schemaId);
  if (!validate) throw contractError(`missing schema validator for ${schemaId}`, 1);
  if (!validate(data)) {
    throw contractError(`schema validation failed for ${label}: ${ajv.errorsText(validate.errors, { separator: "; " })}`, 1);
  }
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const entries = await fs.readdir(path.join(cwd, KL_SCHEMA_ROOT), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !SCHEMA_FILE_NAME_PATTERN.test(entry.name)) {
      throw contractError(`schema root contains unsupported entry for SurfaceOps kanban live proof: ${entry.name}`, 1);
    }
  }
  for (const file of [...KL_SCHEMA_FILES, ...KL_CONSUMED_SCHEMA_FILES]) {
    await assertRegularLocalFile(path.join(cwd, KL_SCHEMA_ROOT, file), `required schema ${file}`);
  }
}

async function assertRequiredFiles(cwd) {
  for (const artifactPath of [...klSchemaPaths(), ...klConsumedSchemaPaths(), ...klFixturePaths(), ...klSourcePaths()]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), artifactPath);
  }
}

function assertCommandRoots(paths) {
  if (
    paths.orchestrationEvidencePath !== KL_P3_EVIDENCE_PATH ||
    paths.reviewQueuePath !== KL_P3_REVIEW_QUEUE_PATH ||
    paths.orchestrationReportPath !== KL_P3_ORCHESTRATION_REPORT_PATH ||
    paths.reviewEvidencePath !== KL_P4_EVIDENCE_PATH ||
    paths.decisionLedgerPath !== KL_P4_DECISION_LEDGER_PATH ||
    paths.reviewReportPath !== KL_P4_REVIEW_REPORT_PATH ||
    paths.evaluationReportPath !== KL_P4_EVALUATION_REPORT_PATH ||
    paths.kanbanApiManifestPath !== KL_API_MANIFEST_PATH ||
    paths.fixtureRoot !== KL_FIXTURE_ROOT ||
    paths.outRoot !== KL_ARTIFACT_ROOT
  ) {
    throw contractError(`SurfaceOps kanban live proof requires ${usage()}`, 2);
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
  const allowed = new Set(KL_GENERATED_ARTIFACTS);
  const stale = [];
  const unsafeExpected = [];
  for (const entry of entries) {
    const entryPath = `${outRoot}/${entry.name}${entry.isDirectory() ? "/" : ""}`;
    if (!allowed.has(entry.name)) stale.push(entryPath);
    else if (!entry.isFile()) unsafeExpected.push(entryPath);
  }
  unsafeExpected.sort();
  if (unsafeExpected.length > 0) {
    throw contractError(`unsafe expected output entry under --out: ${unsafeExpected.join(", ")}`, 1);
  }
  stale.sort();
  if (stale.length > 0) {
    throw contractError(`SurfaceOps kanban live stale unexpected output: ${stale.join(", ")}`, 1);
  }
}

async function ensureSafeOutputDirectory(cwd, outRoot) {
  const segments = outRoot.split("/");
  let current = cwd;
  for (const segment of segments) {
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
    refs.push(artifactRef(artifactPath, schemaIdForSurfaceopsKanbanLivePath(artifactPath) || "unknown.v0", await canonicalFileHash(path.join(cwd, artifactPath))));
  }
  return refs;
}

function upstreamRefs(upstream) {
  return [
    upstream.p3EvidenceRef,
    upstream.p3ReviewQueueRef,
    upstream.p3OrchestrationReportRef,
    upstream.p4EvidenceRef,
    upstream.p4DecisionLedgerRef,
    upstream.p4ReviewReportRef,
    upstream.p4EvaluationReportRef
  ];
}

function liveBoundary() {
  return {
    liveKanbanCardsApi: true,
    modifiesKanbanCardsSource: false,
    liveSurfaceOpsProduct: false,
    liveJudgmentKit: false,
    workExecution: false,
    productionMutation: false,
    browserVideoProofRequired: true
  };
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  clone.artifacts[clone.artifacts.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

function findSingleArtifactRef(evidence, artifactPath, label) {
  const refs = (evidence.artifacts || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) throw contractError(`SurfaceOps kanban live ${label} must contain exactly one ref for ${artifactPath}`, 1);
  return refs[0];
}

function buildRunId({ upstream, targetSelectionRef, apiProjectionRef, operationPlanRef, handoffRecordRef, expectations, command, args }) {
  return `surfaceops-kanban-live-${sha256Hex(canonicalJson({
    p3: upstream.p3EvidenceRef.hash,
    p4: upstream.p4EvidenceRef.hash,
    api: upstream.apiManifestRef.hash,
    targetSelection: targetSelectionRef.hash,
    apiProjection: apiProjectionRef.hash,
    operationPlan: operationPlanRef.hash,
    handoffRecord: handoffRecordRef.hash,
    expectations: expectations.expectedResults.map((row) => row.fixturePath),
    command,
    args
  })).slice(0, 32)}`;
}

function aggregatePromotionStatus(results) {
  if (results.some((result) => !result.matched)) return "blocked";
  if (results.some((result) => result.actualResult === "review_required")) return "review_required";
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
    if (!stat.isFile() || stat.isSymbolicLink()) throw contractError(`SurfaceOps kanban live input is not a regular file: ${label}`, 1);
  } catch (error) {
    if (error.exitCode) throw error;
    throw contractError(`SurfaceOps kanban live input is missing: ${label}`, 1);
  }
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

function usage() {
  return `interfacectl surfaces surfaceops-kanban-live proof --orchestration-evidence ${KL_P3_EVIDENCE_PATH} --review-queue ${KL_P3_REVIEW_QUEUE_PATH} --orchestration-report ${KL_P3_ORCHESTRATION_REPORT_PATH} --review-evidence ${KL_P4_EVIDENCE_PATH} --decision-ledger ${KL_P4_DECISION_LEDGER_PATH} --review-report ${KL_P4_REVIEW_REPORT_PATH} --evaluation-report ${KL_P4_EVALUATION_REPORT_PATH} --kanban-api-manifest ${KL_API_MANIFEST_PATH} --fixture ${KL_FIXTURE_ROOT} --out ${KL_ARTIFACT_ROOT}`;
}

export const surfaceopsKanbanLiveInternals = {
  computeEvidenceSelfHash,
  liveBoundary
};
