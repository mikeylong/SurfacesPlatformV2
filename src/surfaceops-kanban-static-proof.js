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
  SK_ACCEPTED_P3_EVIDENCE_HASH,
  SK_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH,
  SK_ACCEPTED_P3_REVIEW_QUEUE_HASH,
  SK_ACCEPTED_P4_DECISION_LEDGER_HASH,
  SK_ACCEPTED_P4_EVALUATION_REPORT_HASH,
  SK_ACCEPTED_P4_EVIDENCE_HASH,
  SK_ACCEPTED_P4_REVIEW_REPORT_HASH,
  SK_ACCEPTED_SUBSTRATE_HASH,
  SK_ACCEPTED_SUBSTRATE_MANIFEST_HASH,
  SK_ARTIFACT_PATHS,
  SK_ARTIFACT_ROOT,
  SK_COMMAND,
  SK_CONSUMED_SCHEMA_FILES,
  SK_CONTRACT_ID,
  SK_ENVIRONMENT,
  SK_EXPECTATION_ROWS,
  SK_FIXTURE_ROOT,
  SK_FORBIDDEN_CLAIM_KEYS,
  SK_GENERATED_ARTIFACTS,
  SK_P3_EVIDENCE_PATH,
  SK_P3_ORCHESTRATION_REPORT_PATH,
  SK_P3_REVIEW_QUEUE_PATH,
  SK_P4_DECISION_LEDGER_PATH,
  SK_P4_EVALUATION_REPORT_PATH,
  SK_P4_EVIDENCE_PATH,
  SK_P4_REVIEW_REPORT_PATH,
  SK_SCENARIO_ID,
  SK_SCHEMA_FILES,
  SK_SCHEMA_ROOT,
  SK_SOURCE_ROOT,
  SK_SUBSTRATE_MANIFEST_PATH,
  SK_SUBSTRATE_PATH,
  SK_TARGET_ID,
  SK_TARGET_KIND,
  SK_TIMESTAMP,
  SK_VERSION,
  artifactRef,
  defaultSubstrateRefs,
  defaultUpstreamRefs,
  diagnosticForCode,
  diagnosticsRegistry,
  provenance,
  schemaIdForSurfaceopsKanbanPath,
  skConsumedSchemaPaths,
  skFixturePaths,
  skSchemaPaths,
  skSourcePaths,
  zeroCapabilityScope
} from "./surfaceops-kanban-static-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;
const REQUIRED_LANES = ["allowed", "review-required", "blocked"];

export async function runSurfaceopsKanbanStaticInterfacectl(argv, io) {
  const parsed = parseSurfaceopsKanbanStaticArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runSurfaceopsKanbanStaticProof({
      cwd: io.cwd,
      orchestrationEvidencePath: parsed.orchestrationEvidence,
      reviewQueuePath: parsed.reviewQueue,
      orchestrationReportPath: parsed.orchestrationReport,
      reviewEvidencePath: parsed.reviewEvidence,
      decisionLedgerPath: parsed.decisionLedger,
      reviewReportPath: parsed.reviewReport,
      evaluationReportPath: parsed.evaluationReport,
      kanbanSubstrateManifestPath: parsed.kanbanSubstrateManifest,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: SK_COMMAND,
      args: {
        orchestrationEvidence: parsed.orchestrationEvidence,
        reviewQueue: parsed.reviewQueue,
        orchestrationReport: parsed.orchestrationReport,
        reviewEvidence: parsed.reviewEvidence,
        decisionLedger: parsed.decisionLedger,
        reviewReport: parsed.reviewReport,
        evaluationReport: parsed.evaluationReport,
        kanbanSubstrateManifest: parsed.kanbanSubstrateManifest,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces surfaceops-kanban-static proof: ${result.status}`,
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

function parseSurfaceopsKanbanStaticArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--orchestration-evidence") {
      result.orchestrationEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--review-queue") {
      result.reviewQueue = argv[i + 1];
      i += 1;
    } else if (current === "--orchestration-report") {
      result.orchestrationReport = argv[i + 1];
      i += 1;
    } else if (current === "--review-evidence") {
      result.reviewEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--decision-ledger") {
      result.decisionLedger = argv[i + 1];
      i += 1;
    } else if (current === "--review-report") {
      result.reviewReport = argv[i + 1];
      i += 1;
    } else if (current === "--evaluation-report") {
      result.evaluationReport = argv[i + 1];
      i += 1;
    } else if (current === "--kanban-substrate-manifest") {
      result.kanbanSubstrateManifest = argv[i + 1];
      i += 1;
    } else if (current === "--fixture") {
      result.fixture = argv[i + 1];
      i += 1;
    } else if (current === "--out") {
      result.out = argv[i + 1];
      i += 1;
    } else {
      return { ok: false, error: `unexpected argument: ${current}` };
    }
  }
  if (
    !result.orchestrationEvidence ||
    !result.reviewQueue ||
    !result.orchestrationReport ||
    !result.reviewEvidence ||
    !result.decisionLedger ||
    !result.reviewReport ||
    !result.evaluationReport ||
    !result.kanbanSubstrateManifest ||
    !result.fixture ||
    !result.out
  ) {
    return {
      ok: false,
      error: usage()
    };
  }
  for (const [flagName, value] of [
    ["--orchestration-evidence", result.orchestrationEvidence],
    ["--review-queue", result.reviewQueue],
    ["--orchestration-report", result.orchestrationReport],
    ["--review-evidence", result.reviewEvidence],
    ["--decision-ledger", result.decisionLedger],
    ["--review-report", result.reviewReport],
    ["--evaluation-report", result.evaluationReport],
    ["--kanban-substrate-manifest", result.kanbanSubstrateManifest],
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

export async function runSurfaceopsKanbanStaticProof({
  cwd,
  orchestrationEvidencePath,
  reviewQueuePath,
  orchestrationReportPath,
  reviewEvidencePath,
  decisionLedgerPath,
  reviewReportPath,
  evaluationReportPath,
  kanbanSubstrateManifestPath,
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
    kanbanSubstrateManifestPath,
    fixtureRoot,
    outRoot
  });
  await assertReadableDir(path.join(cwd, SK_SCHEMA_ROOT), `unreadable schema path: ${SK_SCHEMA_ROOT}`);
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
    kanbanSubstrateManifestPath
  }, validators);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredFiles(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "surfaceops-kanban-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  assertExpectations(expectations, fixtureRoot, outRoot);

  const targetSelectionFixture = await readJson(path.join(cwd, fixtureRoot, "surfaceops-kanban-target-selection.fixture.json"));
  assertSchema(validators, "surfaceops-kanban-target-selection.v0", targetSelectionFixture, `${fixtureRoot}/surfaceops-kanban-target-selection.fixture.json`);
  const targetSelection = buildTargetSelection({ upstream, fixture: targetSelectionFixture });
  assertSchema(validators, "surfaceops-kanban-target-selection.v0", targetSelection, `${outRoot}/surfaceops-kanban-target-selection.json`);
  assertGeneratedTargetSelection(targetSelection, upstream);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-target-selection.json"), targetSelection);
  const targetSelectionRef = artifactRef(`${outRoot}/surfaceops-kanban-target-selection.json`, "surfaceops-kanban-target-selection.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-target-selection.json")));

  const projection = buildBoardProjection({ upstream, targetSelectionRef });
  assertSchema(validators, "surfaceops-kanban-board-projection.v0", projection, `${outRoot}/surfaceops-kanban-board-projection.json`);
  assertGeneratedProjection(projection);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-board-projection.json"), projection);
  const projectionRef = artifactRef(`${outRoot}/surfaceops-kanban-board-projection.json`, "surfaceops-kanban-board-projection.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-board-projection.json")));

  const reviewWorkPacket = buildReviewWorkPacket({ projection, projectionRef });
  assertSchema(validators, "surfaceops-kanban-board-packet.v0", reviewWorkPacket, `${outRoot}/surfaceops-kanban-board-packet.review-work.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-board-packet.review-work.json"), reviewWorkPacket);
  const reviewWorkPacketRef = artifactRef(`${outRoot}/surfaceops-kanban-board-packet.review-work.json`, "surfaceops-kanban-board-packet.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-board-packet.review-work.json")));

  const decisionsPacket = buildDecisionsPacket({ projection, projectionRef });
  assertSchema(validators, "surfaceops-kanban-board-packet.v0", decisionsPacket, `${outRoot}/surfaceops-kanban-board-packet.decisions.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-board-packet.decisions.json"), decisionsPacket);
  const decisionsPacketRef = artifactRef(`${outRoot}/surfaceops-kanban-board-packet.decisions.json`, "surfaceops-kanban-board-packet.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-board-packet.decisions.json")));

  const packetRefs = [reviewWorkPacketRef, decisionsPacketRef];
  const designerViewModel = buildDesignerViewModel({ upstream, projection, projectionRef, packetRefs });
  assertSchema(validators, "surfaceops-kanban-designer-view-model.v0", designerViewModel, `${outRoot}/surfaceops-kanban-designer-view-model.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-designer-view-model.json"), designerViewModel);
  const designerViewModelRef = artifactRef(`${outRoot}/surfaceops-kanban-designer-view-model.json`, "surfaceops-kanban-designer-view-model.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-designer-view-model.json")));

  const fixtureRows = await loadFixtureRows(cwd, expectations, validators);
  const runId = buildRunId({ upstream, targetSelectionRef, projectionRef, designerViewModelRef, packetRefs, expectations, command, args });
  const validationResults = evaluateExpectations({ fixtureRows, expectations });
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "fail") {
    throw contractError(`SurfaceOps kanban validation expectation mismatch: ${validationResults.filter((result) => !result.matched).map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.expectedDiagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.diagnosticCodes.join(",") || "none"}`).join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults);

  const report = buildReport({
    runId,
    upstream,
    targetSelectionRef,
    projectionRef,
    designerViewModelRef,
    packetRefs,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "surfaceops-kanban-adapter-report.v0", report, `${outRoot}/surfaceops-kanban-adapter-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-kanban-adapter-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/surfaceops-kanban-adapter-report.json`, "surfaceops-kanban-adapter-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-kanban-adapter-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    upstream,
    targetSelectionRef,
    projectionRef,
    designerViewModelRef,
    packetRefs,
    reportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "surfaceops-kanban-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const finalArtifact = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (finalArtifact.path !== `${outRoot}/evidence.json` || finalArtifact.hash !== persistedSelfHash) {
    throw contractError("SurfaceOps kanban evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`SurfaceOps kanban evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: SK_ARTIFACT_PATHS
  };
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
    [paths.kanbanSubstrateManifestPath, "kanban substrate manifest"],
    [SK_SUBSTRATE_PATH, "kanban board substrate"]
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
  const substrateManifest = await readJson(path.join(cwd, paths.kanbanSubstrateManifestPath));
  const substrate = await readJson(path.join(cwd, SK_SUBSTRATE_PATH));

  assertSchema(validators, "agent-orchestration-evidence.v0", p3Evidence, paths.orchestrationEvidencePath);
  assertSchema(validators, "agent-review-queue.v0", p3ReviewQueue, paths.reviewQueuePath);
  assertSchema(validators, "agent-orchestration-report.v0", p3OrchestrationReport, paths.orchestrationReportPath);
  assertSchema(validators, "review-judgment-evidence.v0", p4Evidence, paths.reviewEvidencePath);
  assertSchema(validators, "surfaceops-decision-ledger.v0", p4DecisionLedger, paths.decisionLedgerPath);
  assertSchema(validators, "review-judgment-report.v0", p4ReviewReport, paths.reviewReportPath);
  assertSchema(validators, "judgmentkit-evaluation-report.v0", p4EvaluationReport, paths.evaluationReportPath);
  assertSchema(validators, "kanban-board-substrate-manifest.v0", substrateManifest, paths.kanbanSubstrateManifestPath);
  assertSchema(validators, "kanban-board-substrate.v0", substrate, SK_SUBSTRATE_PATH);

  const p3EvidenceSelfHash = p3Internals.computeEvidenceSelfHash(p3Evidence);
  const p4EvidenceSelfHash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const p3EvidenceRef = findSingleArtifactRef(p3Evidence, paths.orchestrationEvidencePath, "P3 evidence");
  const p3ReviewQueueRef = findSingleArtifactRef(p3Evidence, paths.reviewQueuePath, "P3 review queue");
  const p3OrchestrationReportRef = findSingleArtifactRef(p3Evidence, paths.orchestrationReportPath, "P3 orchestration report");
  const p4EvidenceRef = findSingleArtifactRef(p4Evidence, paths.reviewEvidencePath, "P4 evidence");
  const p4DecisionLedgerRef = findSingleArtifactRef(p4Evidence, paths.decisionLedgerPath, "P4 decision ledger");
  const p4ReviewReportRef = findSingleArtifactRef(p4Evidence, paths.reviewReportPath, "P4 review report");
  const p4EvaluationReportRef = findSingleArtifactRef(p4Evidence, paths.evaluationReportPath, "P4 evaluation report");

  if (p3Evidence.schemaId !== "agent-orchestration-evidence.v0" || p3EvidenceRef.hash !== p3EvidenceSelfHash) {
    throw contractError("SurfaceOps kanban upstream P3 evidence self-hash validation failed", 1);
  }
  if (p3Evidence.status !== "pass") {
    throw contractError("SurfaceOps kanban upstream P3 evidence is not passing", 1);
  }
  const currentReviewQueueHash = await canonicalFileHash(path.join(cwd, paths.reviewQueuePath));
  const currentOrchestrationReportHash = await canonicalFileHash(path.join(cwd, paths.orchestrationReportPath));
  if (
    p3EvidenceSelfHash !== SK_ACCEPTED_P3_EVIDENCE_HASH ||
    p3EvidenceRef.hash !== SK_ACCEPTED_P3_EVIDENCE_HASH ||
    p3ReviewQueueRef.hash !== currentReviewQueueHash ||
    currentReviewQueueHash !== SK_ACCEPTED_P3_REVIEW_QUEUE_HASH ||
    p3OrchestrationReportRef.hash !== currentOrchestrationReportHash ||
    currentOrchestrationReportHash !== SK_ACCEPTED_P3_ORCHESTRATION_REPORT_HASH
  ) {
    throw contractError("SurfaceOps kanban upstream P3 evidence or artifact hash does not match the accepted boundary", 1);
  }

  if (p4Evidence.schemaId !== "review-judgment-evidence.v0" || p4EvidenceRef.hash !== p4EvidenceSelfHash) {
    throw contractError("SurfaceOps kanban upstream P4 evidence self-hash validation failed", 1);
  }
  if (p4Evidence.status !== "pass") {
    throw contractError("SurfaceOps kanban upstream P4 evidence is not passing", 1);
  }
  const currentDecisionLedgerHash = await canonicalFileHash(path.join(cwd, paths.decisionLedgerPath));
  const currentReviewReportHash = await canonicalFileHash(path.join(cwd, paths.reviewReportPath));
  const currentEvaluationReportHash = await canonicalFileHash(path.join(cwd, paths.evaluationReportPath));
  if (
    p4EvidenceSelfHash !== SK_ACCEPTED_P4_EVIDENCE_HASH ||
    p4EvidenceRef.hash !== SK_ACCEPTED_P4_EVIDENCE_HASH ||
    p4DecisionLedgerRef.hash !== currentDecisionLedgerHash ||
    currentDecisionLedgerHash !== SK_ACCEPTED_P4_DECISION_LEDGER_HASH ||
    p4ReviewReportRef.hash !== currentReviewReportHash ||
    currentReviewReportHash !== SK_ACCEPTED_P4_REVIEW_REPORT_HASH ||
    p4EvaluationReportRef.hash !== currentEvaluationReportHash ||
    currentEvaluationReportHash !== SK_ACCEPTED_P4_EVALUATION_REPORT_HASH
  ) {
    throw contractError("SurfaceOps kanban upstream P4 evidence or artifact hash does not match the accepted boundary", 1);
  }

  const currentSubstrateHash = await canonicalFileHash(path.join(cwd, SK_SUBSTRATE_PATH));
  const currentSubstrateManifestHash = await canonicalFileHash(path.join(cwd, paths.kanbanSubstrateManifestPath));
  const manifestSubstrateRef = substrateManifest.substrateRefs?.find((ref) => ref.path === SK_SUBSTRATE_PATH);
  if (
    currentSubstrateHash !== SK_ACCEPTED_SUBSTRATE_HASH ||
    currentSubstrateManifestHash !== SK_ACCEPTED_SUBSTRATE_MANIFEST_HASH ||
    manifestSubstrateRef?.hash !== currentSubstrateHash
  ) {
    throw contractError("SurfaceOps kanban substrate hash does not match the accepted boundary", 1);
  }
  if (!substrate.supportedBoardKinds?.includes("review-governance") || !REQUIRED_LANES.every((laneId) => substrate.lanes.some((lane) => lane.laneId === laneId))) {
    throw contractError("SurfaceOps kanban substrate is unsupported", 1);
  }
  for (const key of SK_FORBIDDEN_CLAIM_KEYS) {
    if (substrate.capabilities?.[key] !== false) {
      throw contractError("SurfaceOps kanban substrate declares forbidden live behavior", 1);
    }
  }

  return {
    p3Evidence,
    p3ReviewQueue,
    p3OrchestrationReport,
    p4Evidence,
    p4DecisionLedger,
    p4ReviewReport,
    p4EvaluationReport,
    substrateManifest,
    substrate,
    p3EvidenceRef: artifactRef(paths.orchestrationEvidencePath, "agent-orchestration-evidence.v0", p3EvidenceSelfHash),
    p3ReviewQueueRef: artifactRef(paths.reviewQueuePath, "agent-review-queue.v0", currentReviewQueueHash, { sourceEvidenceHash: p3EvidenceSelfHash }),
    p3OrchestrationReportRef: artifactRef(paths.orchestrationReportPath, "agent-orchestration-report.v0", currentOrchestrationReportHash, { sourceEvidenceHash: p3EvidenceSelfHash }),
    p4EvidenceRef: artifactRef(paths.reviewEvidencePath, "review-judgment-evidence.v0", p4EvidenceSelfHash),
    p4DecisionLedgerRef: artifactRef(paths.decisionLedgerPath, "surfaceops-decision-ledger.v0", currentDecisionLedgerHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    p4ReviewReportRef: artifactRef(paths.reviewReportPath, "review-judgment-report.v0", currentReviewReportHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    p4EvaluationReportRef: artifactRef(paths.evaluationReportPath, "judgmentkit-evaluation-report.v0", currentEvaluationReportHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    substrateManifestRef: artifactRef(paths.kanbanSubstrateManifestPath, "kanban-board-substrate-manifest.v0", currentSubstrateManifestHash),
    substrateRef: artifactRef(SK_SUBSTRATE_PATH, "kanban-board-substrate.v0", currentSubstrateHash, { sourceEvidenceHash: currentSubstrateManifestHash })
  };
}

function buildTargetSelection({ upstream, fixture }) {
  return {
    ...deepClone(fixture),
    upstreamRefs: upstreamRefs(upstream),
    substrateRefs: substrateRefs(upstream),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    targetSelectionRef: null,
    provenance: provenance("interfacectl-surfaceops-kanban-static-target-selection", [
      SK_P3_EVIDENCE_PATH,
      SK_P4_EVIDENCE_PATH,
      SK_SUBSTRATE_MANIFEST_PATH
    ])
  };
}

function buildBoardProjection({ upstream, targetSelectionRef }) {
  const decisionByReviewItem = new Map((upstream.p4DecisionLedger.decisions || []).map((decision) => [decision.reviewItemId, decision]));
  const cards = (upstream.p3ReviewQueue.items || []).map((item) => {
    const decision = decisionByReviewItem.get(item.reviewItemId);
    const laneId = laneForDecision(decision);
    return {
      cardId: `card.${item.reviewItemId}`,
      title: item.taskId,
      laneId,
      result: laneId === "allowed" ? "allowed" : laneId === "blocked" ? "blocked" : "review_required",
      source: {
        reviewItemId: item.reviewItemId,
        taskId: item.taskId,
        sourceFixtureRef: item.sourceFixtureRef,
        requiredReviewerRole: item.requiredReviewerRole,
        requiredCapabilities: item.requiredCapabilities,
        selectedAgentIds: item.selectedAgentIds,
        diagnosticCode: item.diagnosticCode,
        evidenceObligations: item.evidenceObligations
      },
      queuePromotionStatus: item.promotionStatus,
      decisionStatus: decision?.status ?? null,
      decisionPromotionStatus: decision?.promotionStatus ?? null,
      nonExecutable: item.nonExecutable === true && decision?.nonExecutable !== false,
      suggestedAction: item.suggestedAction,
      nextActionOwner: {
        ownerRole: item.requiredReviewerRole,
        reviewerId: decision?.reviewerId ?? null,
        selectedAgentIds: item.selectedAgentIds,
        nextAction: decision?.status === "approved" && decision?.promotionStatus === "allowed"
          ? "Inspect the static packet refs; no live kanban or SurfaceOps write is authorized."
          : item.suggestedAction
      },
      evidenceRefs: [upstream.p3EvidenceRef, upstream.p3ReviewQueueRef, upstream.p4EvidenceRef, upstream.p4DecisionLedgerRef]
    };
  });
  const annotations = [
    ...buildDecisionAnnotations(upstream, cards),
    ...buildJudgmentAnnotations(upstream, cards)
  ];
  return {
    schemaId: "surfaceops-kanban-board-projection.v0",
    version: SK_VERSION,
    targetSelectionRef,
    upstreamRefs: upstreamRefs(upstream),
    substrateRefs: substrateRefs(upstream),
    board: {
      boardId: "surfaceops.review-governance",
      boardKind: "review-governance",
      title: "SurfaceOps Review Governance",
      scenarioId: SK_SCENARIO_ID,
      componentScope: [],
      taskScope: cards.map((card) => card.source.taskId)
    },
    lanes: upstream.substrate.lanes.map((lane) => ({
      laneId: lane.laneId,
      title: lane.title,
      result: lane.result,
      cards: cards.filter((card) => card.laneId === lane.laneId).map((card) => card.cardId)
    })),
    cards,
    annotations,
    authority: {
      sourceAuthority: "Design-system source remains product authority.",
      contractAuthority: "The Surfaces Catalog and P3/P4 review contracts remain contract authority.",
      proofAuthority: "Passing evidence remains proof authority.",
      substrateAuthority: "kanban.cards constrains presentation only.",
      canOverrideAuthority: false,
      canExecuteWork: false,
      hiddenReviewState: false
    },
    evidenceRefs: upstreamRefs(upstream),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-static-board-projection", [
      SK_P3_REVIEW_QUEUE_PATH,
      SK_P4_DECISION_LEDGER_PATH,
      SK_P4_EVALUATION_REPORT_PATH,
      SK_SUBSTRATE_PATH
    ])
  };
}

function laneForDecision(decision) {
  if (!decision) return "review-required";
  if (decision.status === "approved" && decision.promotionStatus === "allowed") return "allowed";
  if (["rejected", "changes_requested"].includes(decision.status) || decision.promotionStatus === "blocked") return "blocked";
  return "review-required";
}

function buildDecisionAnnotations(upstream, cards) {
  return (upstream.p4DecisionLedger.decisions || []).map((decision) => {
    const card = cards.find((candidate) => candidate.source.reviewItemId === decision.reviewItemId);
    return {
      annotationId: `annotation.${decision.decisionId}`,
      cardId: card?.cardId ?? null,
      kind: "surfaceops-decision",
      committed: true,
      decisionId: decision.decisionId,
      reviewItemId: decision.reviewItemId,
      status: decision.status,
      promotionStatus: decision.promotionStatus,
      rationale: decision.rationale,
      reviewerId: decision.reviewerId,
      secondReviewRequired: decision.secondReviewRequired,
      requestedChanges: decision.requestedChanges,
      nonExecutable: decision.nonExecutable,
      execution: decision.execution,
      evidenceRefs: [upstream.p4EvidenceRef, upstream.p4DecisionLedgerRef]
    };
  });
}

function buildJudgmentAnnotations(upstream, cards) {
  return (upstream.p4EvaluationReport.findings || []).map((finding) => ({
    annotationId: `annotation.${finding.findingId}`,
    cardId: cards[0]?.cardId ?? null,
    kind: "judgmentkit-quality-finding",
    committed: false,
    findingId: finding.findingId,
    dimension: finding.dimension,
    result: finding.result,
    severity: finding.severity,
    rationale: finding.rationale,
    authority: finding.authority,
    affectedArtifactPaths: finding.affectedArtifactPaths,
    evidenceRefs: [upstream.p4EvidenceRef, upstream.p4EvaluationReportRef]
  }));
}

function buildReviewWorkPacket({ projection, projectionRef }) {
  return {
    schemaId: "surfaceops-kanban-board-packet.v0",
    version: SK_VERSION,
    packetId: "surfaceops-kanban-board-packet.review-work",
    packetKind: "review-work",
    projectionRef,
    records: projection.cards.map((card) => ({
      cardId: card.cardId,
      laneId: card.laneId,
      reviewItemId: card.source.reviewItemId,
      taskId: card.source.taskId,
      queuePromotionStatus: card.queuePromotionStatus,
      nonExecutable: card.nonExecutable,
      suggestedAction: card.suggestedAction,
      nextActionOwner: card.nextActionOwner,
      evidenceRefs: card.evidenceRefs
    })),
    execution: inertExecution("Static board packets do not authorize work execution or live kanban writes."),
    evidenceRefs: projection.evidenceRefs,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-static-review-work-packet", [projectionRef.path])
  };
}

function buildDecisionsPacket({ projection, projectionRef }) {
  return {
    schemaId: "surfaceops-kanban-board-packet.v0",
    version: SK_VERSION,
    packetId: "surfaceops-kanban-board-packet.decisions",
    packetKind: "decisions",
    projectionRef,
    records: projection.annotations.map((annotation) => ({
      annotationId: annotation.annotationId,
      cardId: annotation.cardId,
      kind: annotation.kind,
      committed: annotation.committed,
      status: annotation.status ?? annotation.result ?? null,
      promotionStatus: annotation.promotionStatus ?? null,
      rationale: annotation.rationale,
      evidenceRefs: annotation.evidenceRefs
    })),
    execution: inertExecution("Decision packets are static evidence packets and do not persist review state."),
    evidenceRefs: projection.evidenceRefs,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-static-decisions-packet", [projectionRef.path])
  };
}

function buildDesignerViewModel({ upstream, projection, projectionRef, packetRefs }) {
  const allowed = projection.cards.filter((card) => card.result === "allowed");
  const reviewRequired = projection.cards.filter((card) => card.result === "review_required");
  const blocked = projection.cards.filter((card) => card.result === "blocked");
  const primaryDecision = projection.annotations.find((annotation) => annotation.kind === "surfaceops-decision");
  const qualityFindings = projection.annotations.filter((annotation) => annotation.kind === "judgmentkit-quality-finding");
  const designSystemAuthorityRefs = (upstream.p3Evidence.boundaryRefs || [])
    .filter((ref) => ["artifacts/p2/evidence.json", "artifacts/p2/governed-catalog.json"].includes(ref.path))
    .map((ref) => artifactRef(ref.path, ref.schemaId, ref.hash));
  return {
    schemaId: "surfaceops-kanban-designer-view-model.v0",
    version: SK_VERSION,
    scenarioId: SK_SCENARIO_ID,
    targetId: SK_TARGET_ID,
    proofStatus: {
      p3: upstream.p3Evidence.status,
      p4: upstream.p4Evidence.status,
      surfaceopsKanbanStatic: "pass"
    },
    promotionStatus: {
      p3: upstream.p3Evidence.promotionStatus,
      p4: upstream.p4Evidence.promotionStatus,
      explanation: "Upstream proof promotion status is preserved separately from the board card outcome. The current card is allowed because a committed P4 decision approves that review item; P4 remains blocked globally because its proof also proves unsafe fixture outcomes are blocked.",
      boardCards: {
        allowed: allowed.map((card) => card.cardId),
        reviewRequired: reviewRequired.map((card) => card.cardId),
        blocked: blocked.map((card) => card.cardId)
      }
    },
    designerSummary: {
      decision: allowed.length > 0 ? "allowed" : reviewRequired.length > 0 ? "review required" : "blocked",
      answer: allowed.length > 0
        ? "The current review item can be projected into inert board packets because the committed SurfaceOps decision approves it and all packets remain non-executable."
        : "The current review item is not ready for static packet handoff.",
      sourceMaterial: "This board is governed by accepted P3 review-queue evidence, accepted P4 review/judgment evidence, and a manifest-declared local kanban.cards substrate contract.",
      governedBy: {
        designSystemAuthorityRefs,
        reviewQueueRef: upstream.p3ReviewQueueRef,
        decisionLedgerRef: upstream.p4DecisionLedgerRef,
        evaluationReportRef: upstream.p4EvaluationReportRef,
        substrateRefs: projection.substrateRefs
      },
      staticBoardRecordsAllowed: allowed.map((card) => card.title),
      reviewRequired: reviewRequired.map((card) => card.title),
      blocked: blocked.map((card) => card.title),
      qualityFindings: qualityFindings.map((finding) => ({
        findingId: finding.findingId,
        dimension: finding.dimension,
        result: finding.result,
        severity: finding.severity,
        rationale: finding.rationale,
        blocking: false,
        authority: "evaluation-only",
        evidenceRefs: finding.evidenceRefs
      })),
      decisionRationale: primaryDecision?.rationale ?? null,
      evidenceRefs: projection.evidenceRefs
    },
    boardSummary: {
      boardId: projection.board.boardId,
      lanes: projection.lanes.map((lane) => ({ laneId: lane.laneId, title: lane.title, cardCount: lane.cards.length })),
      cards: projection.cards.map((card) => ({
        cardId: card.cardId,
        title: card.title,
        laneId: card.laneId,
        result: card.result,
        status: card.decisionStatus,
        promotionStatus: card.decisionPromotionStatus,
        queuePromotionStatus: card.queuePromotionStatus,
        nonExecutable: card.nonExecutable,
        whyThisLane: card.result === "allowed"
          ? "Committed P4 decision status is approved with allowed promotion status."
          : card.result === "review_required"
            ? "No committed allowed decision is present for this review item."
            : "The accepted authority layer blocks this review item.",
        sourceRefs: sourceRefsForCard(card),
        decisionRef: decisionRefForCard(projection, card),
        nextActionOwner: card.nextActionOwner,
        evidenceRefs: card.evidenceRefs
      }))
    },
    outcomes: {
      allowed: allowed.map((card) => outcomeSummary(projection, card, "The committed SurfaceOps decision allows static packet handoff.")),
      reviewRequired: reviewRequired.map((card) => outcomeSummary(projection, card, "A review decision is still required before handoff.")),
      blocked: blocked.map((card) => outcomeSummary(projection, card, "The current authority layer blocks handoff."))
    },
    authorityActionQueue: projection.cards.map((card) => ({
      cardId: card.cardId,
      question: "What should change?",
      source: card.result === "blocked" ? "Inspect the source or policy evidence that produced the block." : "No source change is required for this static projection.",
      mapping: card.result === "review_required" ? "Map this queue row to a committed decision before handoff." : "No mapping change is required for this static projection.",
      policy: card.result === "blocked" ? "Inspect blocking diagnostics before changing target scope." : "No policy change is required for this static projection.",
      reviewDecision: card.result === "review_required" ? "Commit an approve, reject, request-changes, or defer decision." : "The committed decision is already represented as an evidence-backed annotation.",
      targetScope: "static board projection only",
      sourceRefs: sourceRefsForCard(card),
      decisionRef: decisionRefForCard(projection, card),
      nextActionOwner: card.nextActionOwner,
      evidenceRefs: card.evidenceRefs
    })),
    evidence: {
      projectionRef,
      upstreamRefs: projection.upstreamRefs,
      substrateRefs: projection.substrateRefs,
      annotations: projection.annotations.map((annotation) => annotation.annotationId)
    },
    handoffEligibility: {
      staticBoardPacket: allowed.length > 0 && reviewRequired.length === 0 && blocked.length === 0,
      reason: allowed.length > 0 && reviewRequired.length === 0 && blocked.length === 0
        ? "All projected cards have committed allowed decisions; static packets remain inert."
        : "Only allowed cards may be handed off, and packets remain inert.",
      forbiddenClaims: SK_FORBIDDEN_CLAIM_KEYS
    },
    packetRefs,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-static-designer-view-model", [projectionRef.path])
  };
}

function outcomeSummary(projection, card, reason) {
  return {
    cardId: card.cardId,
    title: card.title,
    result: card.result,
    status: card.decisionStatus,
    promotionStatus: card.decisionPromotionStatus,
    reason,
    sourceRefs: sourceRefsForCard(card),
    decisionRef: decisionRefForCard(projection, card),
    nextActionOwner: card.nextActionOwner,
    evidenceRefs: card.evidenceRefs
  };
}

function sourceRefsForCard(card) {
  return [card.source.sourceFixtureRef];
}

function decisionRefForCard(projection, card) {
  const decision = projection.annotations.find((annotation) =>
    annotation.kind === "surfaceops-decision" && annotation.cardId === card.cardId
  );
  if (!decision) return null;
  return {
    annotationId: decision.annotationId,
    decisionId: decision.decisionId,
    evidenceRefs: decision.evidenceRefs
  };
}

function buildReport({ runId, upstream, targetSelectionRef, projectionRef, designerViewModelRef, packetRefs, validationResults, diagnostics, status, promotionStatus }) {
  return {
    schemaId: "surfaceops-kanban-adapter-report.v0",
    version: SK_VERSION,
    runId,
    targetId: SK_TARGET_ID,
    status,
    promotionStatus,
    upstreamPreflight: {
      status: "pass",
      p3EvidenceRef: upstream.p3EvidenceRef,
      p4EvidenceRef: upstream.p4EvidenceRef
    },
    substratePreflight: {
      status: "pass",
      substrateManifestRef: upstream.substrateManifestRef,
      substrateRef: upstream.substrateRef,
      presentationOnly: true
    },
    artifactRefs: [targetSelectionRef, projectionRef, designerViewModelRef, ...packetRefs],
    validationResults: validationResults.map(stripDiagnostics),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-static-report", [
      targetSelectionRef.path,
      projectionRef.path,
      designerViewModelRef.path,
      ...packetRefs.map((ref) => ref.path)
    ])
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, targetSelectionRef, projectionRef, designerViewModelRef, packetRefs, reportRef, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const schemaPath of [...skSchemaPaths(), ...skConsumedSchemaPaths()]) {
    schemaClosure.push(artifactRef(schemaPath, schemaIdForSurfaceopsKanbanPath(schemaPath), await canonicalFileHash(path.join(cwd, schemaPath))));
  }
  const fixtureRefs = [];
  for (const fixturePath of skFixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, schemaIdForSurfaceopsKanbanPath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const boundaryRefs = [
    ...upstreamRefs(upstream),
    ...substrateRefs(upstream),
    targetSelectionRef,
    projectionRef,
    designerViewModelRef,
    ...packetRefs,
    reportRef
  ].map(withBoundaryProvenance);
  const artifacts = [];
  for (const artifactPath of SK_ARTIFACT_PATHS) {
    artifacts.push({
      ...artifactRef(
        artifactPath,
        schemaIdForSurfaceopsKanbanPath(artifactPath),
        artifactPath === `${SK_ARTIFACT_ROOT}/evidence.json` ? null : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: provenance("interfacectl-surfaceops-kanban-static-artifact-ref", [artifactPath])
    });
  }
  const evidence = {
    schemaId: "surfaceops-kanban-evidence.v0",
    version: SK_VERSION,
    runId,
    contractId: SK_CONTRACT_ID,
    targetId: SK_TARGET_ID,
    status,
    promotionStatus,
    command,
    args,
    checkedAt: SK_TIMESTAMP,
    environment: SK_ENVIRONMENT,
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts,
    validationResults: validationResults.map(stripDiagnostics),
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-surfaceops-kanban-static-evidence", [
      SK_P3_EVIDENCE_PATH,
      SK_P4_EVIDENCE_PATH,
      SK_SUBSTRATE_MANIFEST_PATH,
      reportRef.path
    ])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

async function loadFixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectedResults) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    const schemaId = fixture.schemaId;
    assertSchema(validators, schemaId, fixture, expectation.fixturePath);
    rows.push({ expectation, fixture });
  }
  return rows;
}

function evaluateExpectations({ fixtureRows }) {
  return fixtureRows.map(({ expectation, fixture }) => {
    const evaluation = evaluateFixture(fixture);
    const expectedCodes = expectation.expectedDiagnosticCodes;
    const matched = evaluation.actualResult === expectation.expectedResult &&
      evaluation.promotionStatus === expectation.promotionStatus &&
      arrayEquals(evaluation.diagnosticCodes, expectedCodes);
    const diagnostic = evaluation.diagnosticCodes[0] ? diagnosticForCode(evaluation.diagnosticCodes[0], { artifactPath: expectation.fixturePath }) : null;
    return {
      fixturePath: expectation.fixturePath,
      expectedResult: expectation.expectedResult,
      actualResult: evaluation.actualResult,
      promotionStatus: evaluation.promotionStatus,
      matched,
      stage: expectation.stage,
      diagnosticCodes: evaluation.diagnosticCodes,
      expectedDiagnosticCodes: expectedCodes,
      artifactPath: expectation.fixturePath,
      jsonPointer: diagnostic?.jsonPointer ?? "/",
      suggestedAction: diagnostic?.suggestedAction ?? "No action required.",
      diagnostics: diagnostic ? [diagnostic] : []
    };
  });
}

function evaluateFixture(fixture) {
  const diagnosticCodes = [];
  if (fixture.targetId !== SK_TARGET_ID) diagnosticCodes.push("SURFACEOPS_KANBAN_TARGET_UNDECLARED");
  if (fixture.boardScopeOutOfScope === true) diagnosticCodes.push("SURFACEOPS_KANBAN_TARGET_OUT_OF_SCOPE");
  if (fixture.authorityOverride === true) diagnosticCodes.push("SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE");
  if (fixture.missingEvidenceRef === true || fixture.evidenceRefs.length === 0) diagnosticCodes.push("SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING");
  if (fixture.hiddenReviewState === true) diagnosticCodes.push("SURFACEOPS_KANBAN_HIDDEN_REVIEW_STATE");
  if (fixture.unsupportedSubstrate === true) diagnosticCodes.push("SURFACEOPS_KANBAN_SUBSTRATE_UNSUPPORTED");
  for (const [claimKey, diagnosticCode] of [
    ["liveKanbanWrite", "SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN"],
    ["liveSurfaceOpsWrite", "SURFACEOPS_KANBAN_LIVE_SURFACEOPS_FORBIDDEN"],
    ["liveJudgmentKitCall", "SURFACEOPS_KANBAN_LIVE_JUDGMENTKIT_FORBIDDEN"],
    ["execution", "SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN"],
    ["networkCall", "SURFACEOPS_KANBAN_NETWORK_FORBIDDEN"],
    ["secretAccess", "SURFACEOPS_KANBAN_SECRET_FORBIDDEN"],
    ["productionAdapter", "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN"],
    ["api", "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN"],
    ["sdk", "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN"],
    ["runtimeAdapter", "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN"],
    ["webhook", "SURFACEOPS_KANBAN_NETWORK_FORBIDDEN"],
    ["persistence", "SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN"],
    ["bidirectionalSync", "SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN"],
    ["a2ui", "SURFACEOPS_KANBAN_A2UI_FORBIDDEN"]
  ]) {
    if (fixture.claims?.[claimKey] === true) diagnosticCodes.push(diagnosticCode);
  }
  if (fixture.mutation && fixture.mutation !== "SURFACEOPS_KANBAN_REVIEW_REQUIRED") diagnosticCodes.push(fixture.mutation);
  if (diagnosticCodes.length > 0) {
    return {
      actualResult: "invalid",
      promotionStatus: "blocked",
      diagnosticCodes: [...new Set(diagnosticCodes)]
    };
  }
  if (fixture.fixtureKind === "review_required") {
    return {
      actualResult: "review_required",
      promotionStatus: "review_required",
      diagnosticCodes: ["SURFACEOPS_KANBAN_REVIEW_REQUIRED"]
    };
  }
  return {
    actualResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: []
  };
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  const expectedSchemaPaths = [...skSchemaPaths(), ...skConsumedSchemaPaths()];
  const expectedFixturePaths = skFixturePaths();
  const expectedBoundaryPaths = [
    SK_P3_EVIDENCE_PATH,
    SK_P3_REVIEW_QUEUE_PATH,
    SK_P3_ORCHESTRATION_REPORT_PATH,
    SK_P4_EVIDENCE_PATH,
    SK_P4_DECISION_LEDGER_PATH,
    SK_P4_REVIEW_REPORT_PATH,
    SK_P4_EVALUATION_REPORT_PATH,
    SK_SUBSTRATE_MANIFEST_PATH,
    SK_SUBSTRATE_PATH,
    `${SK_ARTIFACT_ROOT}/surfaceops-kanban-target-selection.json`,
    `${SK_ARTIFACT_ROOT}/surfaceops-kanban-board-projection.json`,
    `${SK_ARTIFACT_ROOT}/surfaceops-kanban-designer-view-model.json`,
    `${SK_ARTIFACT_ROOT}/surfaceops-kanban-board-packet.review-work.json`,
    `${SK_ARTIFACT_ROOT}/surfaceops-kanban-board-packet.decisions.json`,
    `${SK_ARTIFACT_ROOT}/surfaceops-kanban-adapter-report.json`
  ];
  if (!arrayEquals(evidence.schemaClosure?.map((ref) => ref.path), expectedSchemaPaths)) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  if (!arrayEquals(evidence.fixtureRefs?.map((ref) => ref.path), expectedFixturePaths)) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  if (!arrayEquals(evidence.boundaryRefs?.map((ref) => ref.path), expectedBoundaryPaths)) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  if (!arrayEquals(evidence.artifacts?.map((ref) => ref.path), SK_ARTIFACT_PATHS)) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  if (!arrayEquals(evidence.validationResults?.map((result) => result.fixturePath), SK_EXPECTATION_ROWS.map((row) => row.fixturePath))) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";

  for (const ref of [...(evidence.schemaClosure || []), ...(evidence.fixtureRefs || [])]) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.path === SK_P3_EVIDENCE_PATH) {
      const p3Evidence = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== p3Internals.computeEvidenceSelfHash(p3Evidence)) return "SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH";
    } else if (ref.path === SK_P4_EVIDENCE_PATH) {
      const p4Evidence = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== p4Internals.computeEvidenceSelfHash(p4Evidence)) return "SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH";
    } else if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) {
      if (ref.path.startsWith("artifacts/p3/") || ref.path.startsWith("artifacts/p4/")) return "SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH";
      if (ref.path.startsWith(SK_SOURCE_ROOT)) return "SURFACEOPS_KANBAN_SUBSTRATE_HASH_MISMATCH";
      return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
    }
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${SK_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${SK_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "SURFACEOPS_KANBAN_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  clone.artifacts[clone.artifacts.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

function assertGeneratedTargetSelection(targetSelection, upstream) {
  if (targetSelection.targetId !== SK_TARGET_ID || targetSelection.targetKind !== SK_TARGET_KIND) {
    throw contractError("generated SurfaceOps kanban target selection failed semantic validation: SURFACEOPS_KANBAN_TARGET_UNDECLARED", 1);
  }
  if (targetSelection.claimStatus !== "proof_only") {
    throw contractError("generated SurfaceOps kanban target selection failed semantic validation: SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN", 1);
  }
  for (const key of SK_FORBIDDEN_CLAIM_KEYS) {
    if (targetSelection.capabilityScope?.[key] !== false) {
      throw contractError(`generated SurfaceOps kanban target selection failed semantic validation: ${diagnosticForCapability(key)}`, 1);
    }
  }
  if (!arrayEquals(targetSelection.upstreamRefs.map((ref) => ref.path), upstreamRefs(upstream).map((ref) => ref.path))) {
    throw contractError("generated SurfaceOps kanban target selection failed semantic validation: SURFACEOPS_KANBAN_UPSTREAM_HASH_MISMATCH", 1);
  }
}

function assertGeneratedProjection(projection) {
  if (projection.authority.canOverrideAuthority !== false || projection.authority.canExecuteWork !== false) {
    throw contractError("generated SurfaceOps kanban projection failed semantic validation: SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE", 1);
  }
  if (!REQUIRED_LANES.every((laneId) => projection.lanes.some((lane) => lane.laneId === laneId))) {
    throw contractError("generated SurfaceOps kanban projection failed semantic validation: SURFACEOPS_KANBAN_SUBSTRATE_UNSUPPORTED", 1);
  }
  for (const card of projection.cards) {
    if (!Array.isArray(card.evidenceRefs) || card.evidenceRefs.length === 0) {
      throw contractError("generated SurfaceOps kanban projection failed semantic validation: SURFACEOPS_KANBAN_EVIDENCE_REF_MISSING", 1);
    }
    if (card.nonExecutable !== true) {
      throw contractError("generated SurfaceOps kanban projection failed semantic validation: SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN", 1);
    }
  }
  for (const annotation of projection.annotations) {
    if (annotation.kind === "surfaceops-decision") {
      const execution = annotation.execution || {};
      if (
        annotation.nonExecutable !== true ||
        execution.authorized !== false ||
        ![
          "callbacks",
          "connectorCalls",
          "fileEdits",
          "networkCalls",
          "secrets",
          "shellCommands",
          "toolCalls"
        ].every((key) => Array.isArray(execution[key]) && execution[key].length === 0)
      ) {
        throw contractError("generated SurfaceOps kanban projection failed semantic validation: SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN", 1);
      }
    }
    if (annotation.kind === "judgmentkit-quality-finding") {
      if (Object.values(annotation.authority || {}).some((value) => value !== false)) {
        throw contractError("generated SurfaceOps kanban projection failed semantic validation: SURFACEOPS_KANBAN_AUTHORITY_OVERRIDE", 1);
      }
    }
  }
}

function assertCommandRoots(paths) {
  if (
    paths.orchestrationEvidencePath !== SK_P3_EVIDENCE_PATH ||
    paths.reviewQueuePath !== SK_P3_REVIEW_QUEUE_PATH ||
    paths.orchestrationReportPath !== SK_P3_ORCHESTRATION_REPORT_PATH ||
    paths.reviewEvidencePath !== SK_P4_EVIDENCE_PATH ||
    paths.decisionLedgerPath !== SK_P4_DECISION_LEDGER_PATH ||
    paths.reviewReportPath !== SK_P4_REVIEW_REPORT_PATH ||
    paths.evaluationReportPath !== SK_P4_EVALUATION_REPORT_PATH ||
    paths.kanbanSubstrateManifestPath !== SK_SUBSTRATE_MANIFEST_PATH ||
    paths.fixtureRoot !== SK_FIXTURE_ROOT ||
    paths.outRoot !== SK_ARTIFACT_ROOT
  ) {
    throw contractError(usage(), 2);
  }
}

async function assertRequiredFiles(cwd) {
  for (const file of [...skSchemaPaths(), ...skConsumedSchemaPaths(), ...skSourcePaths(), ...skFixturePaths()]) {
    await assertRegularLocalFile(path.join(cwd, file), file);
  }
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const entries = await fs.readdir(path.join(cwd, SK_SCHEMA_ROOT));
  for (const file of [...SK_SCHEMA_FILES, ...SK_CONSUMED_SCHEMA_FILES]) {
    if (!entries.includes(file)) {
      throw contractError(`missing SurfaceOps kanban schema: ${file}`, 1);
    }
    if (!SCHEMA_FILE_NAME_PATTERN.test(file)) {
      throw contractError(`invalid SurfaceOps kanban schema file name: ${file}`, 1);
    }
  }
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  const validators = new Map();
  for (const file of [...SK_SCHEMA_FILES, ...SK_CONSUMED_SCHEMA_FILES]) {
    const schema = await readJson(path.join(cwd, SK_SCHEMA_ROOT, file));
    const schemaId = schemaIdForSurfaceopsKanbanPath(`${SK_SCHEMA_ROOT}/${file}`);
    ajv.addSchema(schema, schemaId);
    validators.set(schemaId, ajv.getSchema(schemaId));
  }
  return validators;
}

function assertSchema(validators, schemaId, data, label) {
  const validate = validators.get(schemaId);
  if (!validate) {
    throw contractError(`missing SurfaceOps kanban validator for ${schemaId}`, 1);
  }
  if (!validate(data)) {
    const errors = (validate.errors || []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
    throw contractError(`schema validation failed for ${label}: ${errors}`, 1);
  }
}

function assertExpectations(expectations, fixtureRoot, outRoot) {
  if (expectations.fixtureRoot !== fixtureRoot || expectations.artifactRoot !== outRoot) {
    throw contractError("SurfaceOps kanban expectation roots do not match command roots", 1);
  }
  if (!arrayEquals(expectations.generatedArtifacts, SK_ARTIFACT_PATHS)) {
    throw contractError("SurfaceOps kanban generated artifact expectation mismatch", 1);
  }
  if (!arrayEquals(expectations.expectedResults.map((row) => row.fixturePath), SK_EXPECTATION_ROWS.map((row) => row.fixturePath))) {
    throw contractError("SurfaceOps kanban fixture expectation order mismatch", 1);
  }
}

function assertRunExpectation(expectations, data) {
  if (data.status !== expectations.runExpectation.status || data.promotionStatus !== expectations.runExpectation.promotionStatus) {
    throw contractError(`SurfaceOps kanban run expectation mismatch: expected ${expectations.runExpectation.status}/${expectations.runExpectation.promotionStatus} got ${data.status}/${data.promotionStatus}`, 1);
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
  const allowed = new Set(SK_GENERATED_ARTIFACTS);
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
    throw contractError(`SurfaceOps kanban stale unexpected output: ${stale.join(", ")}`, 1);
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

async function assertReadableDir(dir, message) {
  try {
    const stat = await fs.lstat(dir);
    if (!stat.isDirectory()) throw new Error("not a directory");
  } catch {
    throw contractError(message, 1);
  }
}

async function assertRegularLocalFile(filePath, label) {
  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile()) {
      throw contractError(`SurfaceOps kanban input is not a regular file: ${label}`, 1);
    }
  } catch (error) {
    if (error.exitCode) throw error;
    throw contractError(`SurfaceOps kanban input is missing: ${label}`, 1);
  }
}

function findSingleArtifactRef(evidence, artifactPath, label) {
  const refs = (evidence.artifacts || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) {
    throw contractError(`SurfaceOps kanban ${label} must contain exactly one ref for ${artifactPath}`, 1);
  }
  return refs[0];
}

function buildRunId({ upstream, targetSelectionRef, projectionRef, designerViewModelRef, packetRefs, expectations, command, args }) {
  return `surfaceops-kanban-static-${sha256Hex(canonicalJson({
    p3: upstream.p3EvidenceRef.hash,
    p4: upstream.p4EvidenceRef.hash,
    targetSelection: targetSelectionRef.hash,
    projection: projectionRef.hash,
    designerViewModel: designerViewModelRef.hash,
    packets: packetRefs.map((ref) => ref.hash),
    expectations: expectations.expectedResults.map((row) => row.fixturePath),
    command,
    args
  })).slice(0, 32)}`;
}

function aggregatePromotionStatus(results) {
  if (results.some((result) => result.matched === false)) return "blocked";
  if (results.some((result) => result.actualResult === "review_required")) return "review_required";
  return "allowed";
}

function stripDiagnostics(result) {
  return {
    fixturePath: result.fixturePath,
    expectedResult: result.expectedResult,
    actualResult: result.actualResult,
    promotionStatus: result.promotionStatus,
    matched: result.matched,
    stage: result.stage,
    diagnosticCodes: result.diagnosticCodes,
    expectedDiagnosticCodes: result.expectedDiagnosticCodes,
    artifactPath: result.artifactPath,
    jsonPointer: result.jsonPointer,
    suggestedAction: result.suggestedAction
  };
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    `${a.stage}:${a.code}:${a.artifactPath}:${a.jsonPointer}`.localeCompare(`${b.stage}:${b.code}:${b.artifactPath}:${b.jsonPointer}`)
  );
}

function withBoundaryProvenance(ref) {
  return {
    ...ref,
    provenance: provenance("interfacectl-surfaceops-kanban-static-boundary-ref", [ref.path])
  };
}

function upstreamRefs(upstream) {
  if (!upstream) return defaultUpstreamRefs();
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

function substrateRefs(upstream) {
  if (!upstream) return defaultSubstrateRefs();
  return [upstream.substrateManifestRef, upstream.substrateRef];
}

function inertExecution(reason) {
  return {
    authorized: false,
    reason,
    fileEdits: [],
    networkCalls: [],
    callbacks: [],
    secrets: [],
    liveWrites: []
  };
}

function diagnosticForCapability(key) {
  if (key === "liveKanbanWrite" || key === "persistence" || key === "bidirectionalSync") return "SURFACEOPS_KANBAN_LIVE_WRITE_FORBIDDEN";
  if (key === "liveSurfaceOpsWrite") return "SURFACEOPS_KANBAN_LIVE_SURFACEOPS_FORBIDDEN";
  if (key === "liveJudgmentKitCall") return "SURFACEOPS_KANBAN_LIVE_JUDGMENTKIT_FORBIDDEN";
  if (key === "execution") return "SURFACEOPS_KANBAN_EXECUTION_FORBIDDEN";
  if (key === "networkCall" || key === "webhook") return "SURFACEOPS_KANBAN_NETWORK_FORBIDDEN";
  if (key === "secretAccess") return "SURFACEOPS_KANBAN_SECRET_FORBIDDEN";
  if (key === "productionAdapter" || key === "api" || key === "sdk" || key === "runtimeAdapter") return "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN";
  if (key === "a2ui") return "SURFACEOPS_KANBAN_A2UI_FORBIDDEN";
  return "SURFACEOPS_KANBAN_PRODUCTION_ADAPTER_FORBIDDEN";
}

function usage() {
  return `usage: interfacectl surfaces surfaceops-kanban-static proof --orchestration-evidence ${SK_P3_EVIDENCE_PATH} --review-queue ${SK_P3_REVIEW_QUEUE_PATH} --orchestration-report ${SK_P3_ORCHESTRATION_REPORT_PATH} --review-evidence ${SK_P4_EVIDENCE_PATH} --decision-ledger ${SK_P4_DECISION_LEDGER_PATH} --review-report ${SK_P4_REVIEW_REPORT_PATH} --evaluation-report ${SK_P4_EVALUATION_REPORT_PATH} --kanban-substrate-manifest ${SK_SUBSTRATE_MANIFEST_PATH} --fixture ${SK_FIXTURE_ROOT} --out ${SK_ARTIFACT_ROOT}`;
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

function arrayEquals(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => canonicalJson(value) === canonicalJson(right[index]));
}

export const surfaceopsKanbanStaticInternals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  parseSurfaceopsKanbanStaticArgs
};
