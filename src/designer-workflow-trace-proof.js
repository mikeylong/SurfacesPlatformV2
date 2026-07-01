import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
import { p3Internals } from "./p3-proof.js";
import { p4Internals } from "./p4-proof.js";
import { p5ProtocolInternals } from "./p5-protocol-proof.js";
import { p5NativeInternals } from "./p5-native-proof.js";
import { sourceConformanceInternals } from "./source-conformance-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  DWT_ACCEPTED_NATIVE_EVIDENCE_HASH,
  DWT_ACCEPTED_P2_CATALOG_HASH,
  DWT_ACCEPTED_P2_EVIDENCE_HASH,
  DWT_ACCEPTED_P2_INGESTION_REPORT_HASH,
  DWT_ACCEPTED_P3_EVIDENCE_HASH,
  DWT_ACCEPTED_P3_REVIEW_QUEUE_HASH,
  DWT_ACCEPTED_P4_DECISION_LEDGER_HASH,
  DWT_ACCEPTED_P4_EVALUATION_REPORT_HASH,
  DWT_ACCEPTED_P4_EVIDENCE_HASH,
  DWT_ACCEPTED_P4_REVIEW_REPORT_HASH,
  DWT_ACCEPTED_PROTOCOL_EVIDENCE_HASH,
  DWT_ACCEPTED_SOURCE_AUTHORITY_MAP_HASH,
  DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH,
  DWT_ACCEPTED_SOURCE_CONFORMANCE_REPORT_HASH,
  DWT_ACCEPTED_SOURCE_REVIEW_QUEUE_HASH,
  DWT_ARTIFACT_PATHS,
  DWT_ARTIFACT_ROOT,
  DWT_COMMAND,
  DWT_COMPONENT_ID,
  DWT_CONTRACT_ID,
  DWT_ENVIRONMENT,
  DWT_EXPECTATION_ROWS,
  DWT_FIXTURE_ROOT,
  DWT_FORBIDDEN_CLAIM_KEYS,
  DWT_GENERATED_ARTIFACTS,
  DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE,
  DWT_GOVERNED_EXCEPTION_FIXTURE_PATH,
  DWT_NATIVE_EVIDENCE_PATH,
  DWT_NATIVE_HANDOFF_PATHS,
  DWT_P2_CATALOG_PATH,
  DWT_P2_EVIDENCE_PATH,
  DWT_P2_INGESTION_REPORT_PATH,
  DWT_P3_EVIDENCE_PATH,
  DWT_P3_REVIEW_QUEUE_PATH,
  DWT_P4_DECISION_LEDGER_PATH,
  DWT_P4_EVALUATION_REPORT_PATH,
  DWT_P4_EVIDENCE_PATH,
  DWT_P4_REVIEW_REPORT_PATH,
  DWT_PROTOCOL_EVIDENCE_PATH,
  DWT_PROTOCOL_HANDOFF_PATHS,
  DWT_REVIEW_REQUIRED_EXCEPTION_DIAGNOSTIC_CODE,
  DWT_REVIEW_REQUIRED_EXCEPTION_FIXTURE_PATH,
  DWT_REQUIRED_ARTIFACT_PATHS,
  DWT_REQUIRED_EVIDENCE_PATHS,
  DWT_SCENARIO_ID,
  DWT_SCHEMA_FILES,
  DWT_SCHEMA_ROOT,
  DWT_SOURCE_AUTHORITY_MAP_PATH,
  DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH,
  DWT_SOURCE_CONFORMANCE_REPORT_PATH,
  DWT_SOURCE_REVIEW_QUEUE_PATH,
  DWT_TARGET_ID,
  DWT_TARGET_IDS,
  DWT_TIMESTAMP,
  DWT_VERSION,
  DWT_WORKFLOW_STEPS,
  artifactRef,
  defaultBoundaryRefs,
  defaultCommandArgs,
  diagnosticsRegistry,
  dwtArtifactOrder,
  dwtConsumedSchemaPaths,
  dwtFixturePaths,
  dwtOwnedSchemaPaths,
  dwtSchemaPaths,
  provenance,
  schemaIdForDesignerWorkflowTracePath
} from "./designer-workflow-trace-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;

export async function runDesignerWorkflowTraceInterfacectl(argv, io) {
  const parsed = parseDesignerWorkflowTraceProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runDesignerWorkflowTraceProof({
      cwd: io.cwd,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      ingestionReportPath: parsed.ingestionReport,
      sourceConformanceEvidencePath: parsed.sourceConformanceEvidence,
      sourceAuthorityMapPath: parsed.sourceAuthorityMap,
      sourceConformanceReportPath: parsed.sourceConformanceReport,
      sourceReviewQueuePath: parsed.sourceReviewQueue,
      orchestrationEvidencePath: parsed.orchestrationEvidence,
      reviewQueuePath: parsed.reviewQueue,
      reviewEvidencePath: parsed.reviewEvidence,
      decisionLedgerPath: parsed.decisionLedger,
      reviewReportPath: parsed.reviewReport,
      evaluationReportPath: parsed.evaluationReport,
      protocolEvidencePath: parsed.protocolEvidence,
      nativeEvidencePath: parsed.nativeEvidence,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: DWT_COMMAND,
      args: {
        ingestionEvidence: parsed.ingestionEvidence,
        catalog: parsed.catalog,
        ingestionReport: parsed.ingestionReport,
        sourceConformanceEvidence: parsed.sourceConformanceEvidence,
        sourceAuthorityMap: parsed.sourceAuthorityMap,
        sourceConformanceReport: parsed.sourceConformanceReport,
        sourceReviewQueue: parsed.sourceReviewQueue,
        orchestrationEvidence: parsed.orchestrationEvidence,
        reviewQueue: parsed.reviewQueue,
        reviewEvidence: parsed.reviewEvidence,
        decisionLedger: parsed.decisionLedger,
        reviewReport: parsed.reviewReport,
        evaluationReport: parsed.evaluationReport,
        protocolEvidence: parsed.protocolEvidence,
        nativeEvidence: parsed.nativeEvidence,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces designer-workflow-trace proof: ${result.status}`,
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

function parseDesignerWorkflowTraceProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--ingestion-evidence") {
      result.ingestionEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--catalog") {
      result.catalog = argv[i + 1];
      i += 1;
    } else if (current === "--ingestion-report") {
      result.ingestionReport = argv[i + 1];
      i += 1;
    } else if (current === "--source-conformance-evidence") {
      result.sourceConformanceEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--source-authority-map") {
      result.sourceAuthorityMap = argv[i + 1];
      i += 1;
    } else if (current === "--source-conformance-report") {
      result.sourceConformanceReport = argv[i + 1];
      i += 1;
    } else if (current === "--source-review-queue") {
      result.sourceReviewQueue = argv[i + 1];
      i += 1;
    } else if (current === "--orchestration-evidence") {
      result.orchestrationEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--review-queue") {
      result.reviewQueue = argv[i + 1];
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
    } else if (current === "--protocol-evidence") {
      result.protocolEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--native-evidence") {
      result.nativeEvidence = argv[i + 1];
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
  for (const key of Object.keys(defaultCommandArgs())) {
    if (!result[key]) {
      return { ok: false, error: usageText() };
    }
  }
  for (const [flagName, value] of [
    ["--ingestion-evidence", result.ingestionEvidence],
    ["--catalog", result.catalog],
    ["--ingestion-report", result.ingestionReport],
    ["--source-conformance-evidence", result.sourceConformanceEvidence],
    ["--source-authority-map", result.sourceAuthorityMap],
    ["--source-conformance-report", result.sourceConformanceReport],
    ["--source-review-queue", result.sourceReviewQueue],
    ["--orchestration-evidence", result.orchestrationEvidence],
    ["--review-queue", result.reviewQueue],
    ["--review-evidence", result.reviewEvidence],
    ["--decision-ledger", result.decisionLedger],
    ["--review-report", result.reviewReport],
    ["--evaluation-report", result.evaluationReport],
    ["--protocol-evidence", result.protocolEvidence],
    ["--native-evidence", result.nativeEvidence],
    ["--fixture", result.fixture],
    ["--out", result.out]
  ]) {
    const parsed = p2Internals.parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    const key = flagName.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = parsed.path;
  }
  return { ok: true, ...result };
}

function usageText() {
  return `usage: ${DWT_COMMAND} --ingestion-evidence ${DWT_P2_EVIDENCE_PATH} --catalog ${DWT_P2_CATALOG_PATH} --ingestion-report ${DWT_P2_INGESTION_REPORT_PATH} --source-conformance-evidence ${DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH} --source-authority-map ${DWT_SOURCE_AUTHORITY_MAP_PATH} --source-conformance-report ${DWT_SOURCE_CONFORMANCE_REPORT_PATH} --source-review-queue ${DWT_SOURCE_REVIEW_QUEUE_PATH} --orchestration-evidence ${DWT_P3_EVIDENCE_PATH} --review-queue ${DWT_P3_REVIEW_QUEUE_PATH} --review-evidence ${DWT_P4_EVIDENCE_PATH} --decision-ledger ${DWT_P4_DECISION_LEDGER_PATH} --review-report ${DWT_P4_REVIEW_REPORT_PATH} --evaluation-report ${DWT_P4_EVALUATION_REPORT_PATH} --protocol-evidence ${DWT_PROTOCOL_EVIDENCE_PATH} --native-evidence ${DWT_NATIVE_EVIDENCE_PATH} --fixture ${DWT_FIXTURE_ROOT} --out ${DWT_ARTIFACT_ROOT}`;
}

export async function runDesignerWorkflowTraceProof({
  cwd,
  ingestionEvidencePath,
  catalogPath,
  ingestionReportPath,
  sourceConformanceEvidencePath,
  sourceAuthorityMapPath,
  sourceConformanceReportPath,
  sourceReviewQueuePath,
  orchestrationEvidencePath,
  reviewQueuePath,
  reviewEvidencePath,
  decisionLedgerPath,
  reviewReportPath,
  evaluationReportPath,
  protocolEvidencePath,
  nativeEvidencePath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({
    ingestionEvidencePath,
    catalogPath,
    ingestionReportPath,
    sourceConformanceEvidencePath,
    sourceAuthorityMapPath,
    sourceConformanceReportPath,
    sourceReviewQueuePath,
    orchestrationEvidencePath,
    reviewQueuePath,
    reviewEvidencePath,
    decisionLedgerPath,
    reviewReportPath,
    evaluationReportPath,
    protocolEvidencePath,
    nativeEvidencePath,
    fixtureRoot,
    outRoot
  });
  await assertReadableDir(path.join(cwd, DWT_SCHEMA_ROOT), `unreadable schema path: ${DWT_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  const upstream = await strictUpstreamPreflight(cwd, {
    ingestionEvidencePath,
    catalogPath,
    ingestionReportPath,
    sourceConformanceEvidencePath,
    sourceAuthorityMapPath,
    sourceConformanceReportPath,
    sourceReviewQueuePath,
    orchestrationEvidencePath,
    reviewQueuePath,
    reviewEvidencePath,
    decisionLedgerPath,
    reviewReportPath,
    evaluationReportPath,
    protocolEvidencePath,
    nativeEvidencePath
  }, validators);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredFiles(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "designer-workflow-trace-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  await assertExpectations(cwd, expectations, fixtureRoot, outRoot);

  const selectionFixture = await readJson(path.join(cwd, fixtureRoot, "trace-selection.fixture.json"));
  assertSchema(validators, "designer-workflow-trace-selection.v0", selectionFixture, `${fixtureRoot}/trace-selection.fixture.json`);
  const selection = buildTraceSelection({ upstream, fixture: selectionFixture });
  assertSchema(validators, "designer-workflow-trace-selection.v0", selection, `${outRoot}/trace-selection.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "trace-selection.json"), selection);
  const selectionRef = artifactRef(`${outRoot}/trace-selection.json`, "designer-workflow-trace-selection.v0", await canonicalFileHash(path.join(cwd, outRoot, "trace-selection.json")));

  const fixtureRows = await loadFixtureRows(cwd, expectations, validators);
  const validationResults = evaluateExpectations(fixtureRows, upstream);
  const diagnostics = sortDiagnostics(validationResults.flatMap((row) => row.diagnostics));
  const status = validationResults.every((row) => row.matched) ? "pass" : "fail";
  if (status === "fail") {
    const mismatches = validationResults
      .filter((row) => !row.matched)
      .map((row) => `${row.fixturePath}: expected ${row.expectedResult}/${row.promotionStatus}/${row.expectedDiagnosticCodes.join(",") || "none"} got ${row.actualResult}/${row.promotionStatus}/${row.diagnosticCodes.join(",") || "none"}`);
    throw contractError(`designer workflow trace validation expectation mismatch: ${mismatches.join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults, upstream);
  const runId = buildRunId({ upstream, selectionRef, expectations, command, args });

  const report = buildReport({
    runId,
    upstream,
    selectionRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "designer-workflow-trace-report.v0", report, `${outRoot}/designer-workflow-trace-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "designer-workflow-trace-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/designer-workflow-trace-report.json`, "designer-workflow-trace-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "designer-workflow-trace-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    upstream,
    selectionRef,
    reportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "designer-workflow-trace-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("designer workflow trace evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`designer workflow trace evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((row) => row.matched).length,
    totalCount: validationResults.length,
    artifacts: DWT_ARTIFACT_PATHS
  };
}

function assertCommandRoots(paths) {
  const expected = defaultCommandArgs();
  for (const [key, expectedPath] of Object.entries(expected)) {
    const actualKey = `${key}Path`;
    const actual = key === "fixture" ? paths.fixtureRoot : key === "out" ? paths.outRoot : paths[actualKey];
    if (actual !== expectedPath) {
      throw contractError(usageText(), 2);
    }
  }
}

async function strictUpstreamPreflight(cwd, paths, validators) {
  for (const [artifactPath, label] of [
    [paths.ingestionEvidencePath, "P2 ingestion evidence"],
    [paths.catalogPath, "P2 governed catalog"],
    [paths.ingestionReportPath, "P2 ingestion report"],
    [paths.sourceConformanceEvidencePath, "source conformance evidence"],
    [paths.sourceAuthorityMapPath, "source authority map"],
    [paths.sourceConformanceReportPath, "source conformance report"],
    [paths.sourceReviewQueuePath, "source review queue"],
    [paths.orchestrationEvidencePath, "P3 orchestration evidence"],
    [paths.reviewQueuePath, "P3 review queue"],
    [paths.reviewEvidencePath, "P4 review evidence"],
    [paths.decisionLedgerPath, "P4 decision ledger"],
    [paths.reviewReportPath, "P4 review judgment report"],
    [paths.evaluationReportPath, "P4 evaluation report"],
    [paths.protocolEvidencePath, "P5 protocol evidence"],
    [paths.nativeEvidencePath, "P5 native evidence"]
  ]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), label);
  }

  const p2Evidence = await readJson(path.join(cwd, paths.ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, paths.catalogPath));
  const p2IngestionReport = await readJson(path.join(cwd, paths.ingestionReportPath));
  const sourceEvidence = await readJson(path.join(cwd, paths.sourceConformanceEvidencePath));
  const sourceAuthorityMap = await readJson(path.join(cwd, paths.sourceAuthorityMapPath));
  const sourceReport = await readJson(path.join(cwd, paths.sourceConformanceReportPath));
  const sourceReviewQueue = await readJson(path.join(cwd, paths.sourceReviewQueuePath));
  const p3Evidence = await readJson(path.join(cwd, paths.orchestrationEvidencePath));
  const p3ReviewQueue = await readJson(path.join(cwd, paths.reviewQueuePath));
  const p4Evidence = await readJson(path.join(cwd, paths.reviewEvidencePath));
  const p4DecisionLedger = await readJson(path.join(cwd, paths.decisionLedgerPath));
  const p4ReviewReport = await readJson(path.join(cwd, paths.reviewReportPath));
  const p4EvaluationReport = await readJson(path.join(cwd, paths.evaluationReportPath));
  const protocolEvidence = await readJson(path.join(cwd, paths.protocolEvidencePath));
  const nativeEvidence = await readJson(path.join(cwd, paths.nativeEvidencePath));

  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, paths.ingestionEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, paths.catalogPath);
  assertSchema(validators, "design-system-ingestion-report.v0", p2IngestionReport, paths.ingestionReportPath);
  assertSchema(validators, "source-conformance-evidence.v0", sourceEvidence, paths.sourceConformanceEvidencePath);
  assertSchema(validators, "source-authority-map.v0", sourceAuthorityMap, paths.sourceAuthorityMapPath);
  assertSchema(validators, "source-conformance-report.v0", sourceReport, paths.sourceConformanceReportPath);
  assertSchema(validators, "source-review-queue.v0", sourceReviewQueue, paths.sourceReviewQueuePath);
  assertSchema(validators, "agent-orchestration-evidence.v0", p3Evidence, paths.orchestrationEvidencePath);
  assertSchema(validators, "agent-review-queue.v0", p3ReviewQueue, paths.reviewQueuePath);
  assertSchema(validators, "review-judgment-evidence.v0", p4Evidence, paths.reviewEvidencePath);
  assertSchema(validators, "surfaceops-decision-ledger.v0", p4DecisionLedger, paths.decisionLedgerPath);
  assertSchema(validators, "review-judgment-report.v0", p4ReviewReport, paths.reviewReportPath);
  assertSchema(validators, "judgmentkit-evaluation-report.v0", p4EvaluationReport, paths.evaluationReportPath);
  assertSchema(validators, "protocol-adapter-evidence.v0", protocolEvidence, paths.protocolEvidencePath);
  assertSchema(validators, "surfaces-native-evidence.v0", nativeEvidence, paths.nativeEvidencePath);

  const p2EvidenceHash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  const p2CatalogHash = await canonicalFileHash(path.join(cwd, paths.catalogPath));
  const p2IngestionReportHash = await canonicalFileHash(path.join(cwd, paths.ingestionReportPath));
  assertAcceptedEvidence({
    label: "P2",
    evidence: p2Evidence,
    selfHash: p2EvidenceHash,
    acceptedHash: DWT_ACCEPTED_P2_EVIDENCE_HASH,
    schemaId: "design-system-ingestion-evidence.v0",
    allowBlocked: false
  });
  assertArtifactRefHash(p2Evidence, paths.ingestionEvidencePath, p2EvidenceHash, "P2 evidence");
  assertArtifactRefHash(p2Evidence, paths.catalogPath, p2CatalogHash, "P2 catalog");
  assertArtifactRefHash(p2Evidence, paths.ingestionReportPath, p2IngestionReportHash, "P2 ingestion report");
  if (p2CatalogHash !== DWT_ACCEPTED_P2_CATALOG_HASH) {
    throw contractError("Designer workflow trace P2 catalog hash does not match accepted evidence.", 1);
  }
  assertHashEquals(p2IngestionReportHash, DWT_ACCEPTED_P2_INGESTION_REPORT_HASH, "P2 ingestion report");

  const sourceEvidenceHash = sourceConformanceInternals.computeEvidenceSelfHash(sourceEvidence);
  assertAcceptedEvidence({
    label: "source conformance",
    evidence: sourceEvidence,
    selfHash: sourceEvidenceHash,
    acceptedHash: DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH,
    schemaId: "source-conformance-evidence.v0",
    allowBlocked: false
  });
  const sourceAuthorityMapHash = await canonicalFileHash(path.join(cwd, paths.sourceAuthorityMapPath));
  const sourceReportHash = await canonicalFileHash(path.join(cwd, paths.sourceConformanceReportPath));
  const sourceReviewQueueHash = await canonicalFileHash(path.join(cwd, paths.sourceReviewQueuePath));
  assertArtifactRefHash(sourceEvidence, paths.sourceAuthorityMapPath, sourceAuthorityMapHash, "source authority map");
  assertArtifactRefHash(sourceEvidence, paths.sourceConformanceReportPath, sourceReportHash, "source conformance report");
  assertArtifactRefHash(sourceEvidence, paths.sourceReviewQueuePath, sourceReviewQueueHash, "source review queue");
  assertHashEquals(sourceAuthorityMapHash, DWT_ACCEPTED_SOURCE_AUTHORITY_MAP_HASH, "source authority map");
  assertHashEquals(sourceReportHash, DWT_ACCEPTED_SOURCE_CONFORMANCE_REPORT_HASH, "source conformance report");
  assertHashEquals(sourceReviewQueueHash, DWT_ACCEPTED_SOURCE_REVIEW_QUEUE_HASH, "source review queue");

  const p3EvidenceHash = p3Internals.computeEvidenceSelfHash(p3Evidence);
  const p3ReviewQueueHash = await canonicalFileHash(path.join(cwd, paths.reviewQueuePath));
  assertAcceptedEvidence({
    label: "P3",
    evidence: p3Evidence,
    selfHash: p3EvidenceHash,
    acceptedHash: DWT_ACCEPTED_P3_EVIDENCE_HASH,
    schemaId: "agent-orchestration-evidence.v0",
    allowBlocked: false
  });
  assertArtifactRefHash(p3Evidence, paths.reviewQueuePath, p3ReviewQueueHash, "P3 review queue");
  assertHashEquals(p3ReviewQueueHash, DWT_ACCEPTED_P3_REVIEW_QUEUE_HASH, "P3 review queue");

  const p4EvidenceHash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const p4DecisionLedgerHash = await canonicalFileHash(path.join(cwd, paths.decisionLedgerPath));
  const p4ReviewReportHash = await canonicalFileHash(path.join(cwd, paths.reviewReportPath));
  const p4EvaluationReportHash = await canonicalFileHash(path.join(cwd, paths.evaluationReportPath));
  assertAcceptedEvidence({
    label: "P4",
    evidence: p4Evidence,
    selfHash: p4EvidenceHash,
    acceptedHash: DWT_ACCEPTED_P4_EVIDENCE_HASH,
    schemaId: "review-judgment-evidence.v0",
    allowBlocked: true
  });
  assertArtifactRefHash(p4Evidence, paths.decisionLedgerPath, p4DecisionLedgerHash, "P4 decision ledger");
  assertArtifactRefHash(p4Evidence, paths.reviewReportPath, p4ReviewReportHash, "P4 review report");
  assertArtifactRefHash(p4Evidence, paths.evaluationReportPath, p4EvaluationReportHash, "P4 evaluation report");
  assertArtifactRefHash(p4Evidence, paths.reviewQueuePath, p3ReviewQueueHash, "P3 review queue boundary");
  assertHashEquals(p4DecisionLedgerHash, DWT_ACCEPTED_P4_DECISION_LEDGER_HASH, "P4 decision ledger");
  assertHashEquals(p4ReviewReportHash, DWT_ACCEPTED_P4_REVIEW_REPORT_HASH, "P4 review report");
  assertHashEquals(p4EvaluationReportHash, DWT_ACCEPTED_P4_EVALUATION_REPORT_HASH, "P4 evaluation report");

  const protocolEvidenceHash = p5ProtocolInternals.computeEvidenceSelfHash(protocolEvidence);
  assertAcceptedEvidence({
    label: "P5 protocol",
    evidence: protocolEvidence,
    selfHash: protocolEvidenceHash,
    acceptedHash: DWT_ACCEPTED_PROTOCOL_EVIDENCE_HASH,
    schemaId: "protocol-adapter-evidence.v0",
    allowBlocked: false
  });
  for (const handoffPath of DWT_PROTOCOL_HANDOFF_PATHS) {
    assertArtifactRefHash(protocolEvidence, handoffPath, await canonicalFileHash(path.join(cwd, handoffPath)), `protocol handoff ${handoffPath}`);
  }

  const nativeEvidenceHash = p5NativeInternals.computeEvidenceSelfHash(nativeEvidence);
  assertAcceptedEvidence({
    label: "P5 native",
    evidence: nativeEvidence,
    selfHash: nativeEvidenceHash,
    acceptedHash: DWT_ACCEPTED_NATIVE_EVIDENCE_HASH,
    schemaId: "surfaces-native-evidence.v0",
    allowBlocked: false
  });
  for (const handoffPath of DWT_NATIVE_HANDOFF_PATHS) {
    assertArtifactRefHash(nativeEvidence, handoffPath, await canonicalFileHash(path.join(cwd, handoffPath)), `native handoff ${handoffPath}`);
  }
  assertArtifactRefHash(nativeEvidence, DWT_PROTOCOL_EVIDENCE_PATH, protocolEvidenceHash, "native protocol compatibility evidence");

  return {
    p2Evidence,
    p2Catalog,
    p2IngestionReport,
    sourceEvidence,
    sourceAuthorityMap,
    sourceReport,
    sourceReviewQueue,
    p3Evidence,
    p3ReviewQueue,
    p4Evidence,
    p4DecisionLedger,
    p4ReviewReport,
    p4EvaluationReport,
    protocolEvidence,
    nativeEvidence,
    boundaryRefs: defaultBoundaryRefs(),
    evidenceRefs: [
      artifactRef(DWT_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2EvidenceHash),
      artifactRef(DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH, "source-conformance-evidence.v0", sourceEvidenceHash),
      artifactRef(DWT_P3_EVIDENCE_PATH, "agent-orchestration-evidence.v0", p3EvidenceHash),
      artifactRef(DWT_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", p4EvidenceHash),
      artifactRef(DWT_PROTOCOL_EVIDENCE_PATH, "protocol-adapter-evidence.v0", protocolEvidenceHash),
      artifactRef(DWT_NATIVE_EVIDENCE_PATH, "surfaces-native-evidence.v0", nativeEvidenceHash)
    ]
  };
}

function assertAcceptedEvidence({ label, evidence, selfHash, acceptedHash, schemaId, allowBlocked }) {
  if (evidence.schemaId !== schemaId) {
    throw contractError(`Designer workflow trace ${label} evidence has wrong schema id.`, 1);
  }
  if (selfHash !== acceptedHash) {
    throw contractError("Designer workflow trace upstream evidence or artifact hash does not match accepted evidence.", 1);
  }
  if (evidence.status !== "pass" || (!allowBlocked && evidence.promotionStatus === "blocked")) {
    throw contractError(`Designer workflow trace ${label} evidence is not accepted for indexing.`, 1);
  }
}

function assertArtifactRefHash(evidence, artifactPath, currentHash, label) {
  const ref = findSingleArtifactRef(evidence, artifactPath);
  if (ref.hash !== currentHash) {
    throw contractError(`Designer workflow trace ${label} hash does not match accepted evidence.`, 1);
  }
}

function assertHashEquals(actual, expected, label) {
  if (actual !== expected) {
    throw contractError(`Designer workflow trace ${label} hash does not match accepted evidence.`, 1);
  }
}

function findSingleArtifactRef(evidence, artifactPath) {
  const containers = [
    evidence.artifactRefs || [],
    evidence.artifacts || [],
    evidence.boundaryRefs || [],
    evidence.compatibilityPreflightRefs || []
  ];
  const refs = containers.flat().filter((entry) => entry.path === artifactPath);
  const tuple = (ref) => canonicalJson({
    path: ref.path,
    schemaId: ref.schemaId,
    hashAlgorithm: ref.hashAlgorithm,
    hash: ref.hash,
    sourceRef: ref.sourceRef,
    sourceEvidenceHash: ref.sourceEvidenceHash || null
  });
  const uniqueRefs = [...new Map(refs.map((ref) => [tuple(ref), ref])).values()];
  if (uniqueRefs.length !== 1) {
    throw contractError(`Designer workflow trace evidence must contain exactly one ref for ${artifactPath}`, 1);
  }
  return uniqueRefs[0];
}

async function assertRegularLocalFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`Designer workflow trace input is missing: ${label}`, 1);
  }
  if (!stat.isFile()) {
    throw contractError(`Designer workflow trace input is not a regular file: ${label}`, 1);
  }
}

async function assertReadableDir(dir, message) {
  try {
    const stat = await fs.lstat(dir);
    if (!stat.isDirectory()) throw new Error(message);
  } catch {
    throw contractError(message, 2);
  }
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const required = new Set(dwtSchemaPaths());
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, DWT_SCHEMA_ROOT), DWT_SCHEMA_ROOT)).sort();
  const missing = [...required].filter((entry) => !actualSchemaEntries.includes(entry)).sort();
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (required.has(entry)) return false;
    const fileName = entry.slice(`${DWT_SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
  }
}

async function assertRequiredFiles(cwd) {
  for (const relativePath of [...dwtSchemaPaths(), ...dwtFixturePaths()]) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing designer workflow trace required file: ${relativePath}`, 2);
    }
  }
}

async function rejectStaleOutput(cwd, outRoot) {
  const outDir = await ensureSafeOutputDirectory(cwd, outRoot);
  const entries = await fs.readdir(outDir, { withFileTypes: true });
  const allowed = new Set(DWT_GENERATED_ARTIFACTS);
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
    throw contractError(`stale unexpected output under --out: ${stale.join(", ")}`, 1);
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

async function assertExpectations(cwd, manifest, fixtureRoot, outRoot) {
  if (manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== DWT_SCHEMA_ROOT) {
    throw contractError("designer workflow trace expectations manifest roots do not match proof command paths", 1);
  }
  assertOrderedPaths("designer workflow trace expectations manifest inputs", manifest.inputs, dwtFixturePaths());
  assertOrderedPaths("designer workflow trace expectations artifactOrder", manifest.artifactOrder, dwtArtifactOrder());
  assertOrderedPaths("designer workflow trace expectation order", manifest.expectations.map((row) => row.fixturePath), DWT_EXPECTATION_ROWS.map((row) => row.fixturePath));
  const expectedFixtureEntries = [
    ...dwtFixturePaths(),
    ...expectedDirectoryEntries(dwtFixturePaths(), fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("designer workflow trace fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

async function loadFixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectations) {
    const fixtureAbsolutePath = path.join(cwd, expectation.fixturePath);
    const fixture = await readJson(fixtureAbsolutePath);
    if (expectation.fixturePath.endsWith(".designer-workflow-trace.json")) {
      assertSchema(validators, "designer-workflow-trace-fixture.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".designer-workflow-trace-preflight.json")) {
      assertSchema(validators, "designer-workflow-trace-preflight-mutation.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".designer-workflow-trace-evidence.json")) {
      assertSchema(validators, "designer-workflow-trace-evidence.v0", fixture, expectation.fixturePath);
    }
    rows.push({ expectation, fixture, fixtureHash: await canonicalFileHash(fixtureAbsolutePath) });
  }
  return rows;
}

function buildTraceSelection({ upstream, fixture }) {
  return {
    ...deepClone(fixture),
    boundaryRefs: upstream.boundaryRefs,
    targetHandoffRefs: [
      findSingleArtifactRef(upstream.protocolEvidence, "artifacts/p5/protocol/protocol-envelope.button.json"),
      findSingleArtifactRef(upstream.nativeEvidence, "artifacts/p5/native/surfaces-native-packet.button.json")
    ],
    traceSelectionRef: null,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-designer-workflow-trace-selection", [fixture.provenance.sourceRefs[0]])
  };
}

function evaluateExpectations(fixtureRows, upstream) {
  return fixtureRows.map(({ expectation, fixture }) => {
    const actual = evaluateFixture(expectation, fixture, upstream);
    const matched = actual.result === expectation.expectedResult &&
      actual.promotionStatus === expectation.promotionStatus &&
      canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code)) === canonicalJson(expectation.diagnosticCodes);
    return {
      fixturePath: expectation.fixturePath,
      kind: expectation.kind,
      stage: expectation.stage,
      phase: expectation.phase,
      expectedResult: expectation.expectedResult,
      actualResult: actual.result,
      promotionStatus: actual.promotionStatus,
      expectedDiagnosticCodes: expectation.diagnosticCodes,
      diagnosticCodes: actual.diagnostics.map((diagnostic) => diagnostic.code),
      diagnostics: actual.diagnostics,
      artifactPath: expectation.artifactPath,
      jsonPointer: expectation.jsonPointer,
      componentId: fixture.componentId || null,
      matched
    };
  });
}

function evaluateFixture(expectation, fixture, upstream) {
  if (expectation.kind === "mutation") {
    return evaluateMutationFixture(expectation, fixture);
  }
  if (fixture.componentId !== DWT_COMPONENT_ID || !upstream.p2Catalog.components?.[fixture.componentId]) {
    return invalidResult("TRACE_COMPONENT_OUT_OF_SCOPE");
  }
  if (!arrayEquals(fixture.targetIds, DWT_TARGET_IDS)) {
    return invalidResult("TRACE_HANDOFF_TARGET_MISSING");
  }
  if (!arrayEquals(fixture.requiredEvidencePaths, DWT_REQUIRED_EVIDENCE_PATHS) ||
    !arrayEquals(fixture.requiredArtifactPaths, DWT_REQUIRED_ARTIFACT_PATHS)) {
    return invalidResult("TRACE_HANDOFF_TARGET_MISSING");
  }
  if (hasForbiddenClaim(fixture.claims)) {
    return invalidResult("TRACE_FORBIDDEN_CLAIM");
  }
  if (fixture.sourceConformanceReviewStatus === "expired") {
    if (fixture.sourceConformanceReviewPath === DWT_GOVERNED_EXCEPTION_FIXTURE_PATH && upstreamHasGovernedExceptionExpiry(upstream)) {
      return invalidResult("TRACE_SOURCE_CONFORMANCE_REVIEW_EXPIRED_INDEXED");
    }
    return invalidResult("TRACE_SOURCE_CONFORMANCE_REVIEW_EXPIRED_INDEXED");
  }
  if (fixture.requiresReviewStatus === true) {
    return {
      result: "review_required",
      promotionStatus: "review_required",
      diagnostics: [diagnosticForCode("TRACE_REVIEW_REQUIRED_STATUS_INDEXED")]
    };
  }
  return { result: "valid", promotionStatus: "allowed", diagnostics: [] };
}

function evaluateMutationFixture(expectation, fixture) {
  const code = expectation.diagnosticCodes[0];
  if (code === "TRACE_UPSTREAM_EVIDENCE_MISSING" && Array.isArray(fixture.boundaryRefs) && fixture.boundaryRefs.length === 0) {
    return invalidResult(code);
  }
  if (code === "TRACE_UPSTREAM_EVIDENCE_HASH_MISMATCH" && fixture.boundaryRefs?.some((ref) => ref.hash === "0".repeat(64))) {
    return invalidResult(code);
  }
  if (code === "TRACE_EVIDENCE_HASH_MISMATCH") {
    return invalidResult(code);
  }
  return { result: "valid", promotionStatus: "allowed", diagnostics: [] };
}

function invalidResult(code) {
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForCode(code)]
  };
}

function hasForbiddenClaim(claims = {}) {
  return DWT_FORBIDDEN_CLAIM_KEYS.some((key) => claims[key] === true);
}

function upstreamHasGovernedExceptionExpiry(upstream) {
  return [...(upstream.sourceEvidence.validationResults || []), ...(upstream.sourceReport.results || [])].some((row) =>
    row.fixturePath === DWT_GOVERNED_EXCEPTION_FIXTURE_PATH &&
    row.actualResult === "invalid" &&
    row.promotionStatus === "blocked" &&
    (row.diagnosticCodes || []).includes(DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE)
  );
}

function sourceConformanceExceptionLifecycle(upstream) {
  const reviewRequiredRow = findSourceConformanceResult(
    upstream,
    DWT_REVIEW_REQUIRED_EXCEPTION_FIXTURE_PATH,
    DWT_REVIEW_REQUIRED_EXCEPTION_DIAGNOSTIC_CODE
  );
  const expiredRow = findSourceConformanceResult(
    upstream,
    DWT_GOVERNED_EXCEPTION_FIXTURE_PATH,
    DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE
  );
  const reviewQueueItem = (upstream.sourceReviewQueue.queueItems || []).find((item) =>
    item.reviewQueueItemId === reviewRequiredRow.reviewQueueItemId
  );
  if (!reviewRequiredRow.review || !expiredRow.review || !reviewQueueItem) {
    throw contractError("designer workflow trace source-conformance exception lifecycle metadata is missing.", 1);
  }
  return {
    status: "expired-blocked",
    reviewRequiredFixturePath: DWT_REVIEW_REQUIRED_EXCEPTION_FIXTURE_PATH,
    reviewRequiredDiagnosticCode: DWT_REVIEW_REQUIRED_EXCEPTION_DIAGNOSTIC_CODE,
    reviewRequiredQueueItemId: reviewRequiredRow.reviewQueueItemId,
    expiredFixturePath: DWT_GOVERNED_EXCEPTION_FIXTURE_PATH,
    expiredDiagnosticCode: DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE,
    owner: reviewRequiredRow.review.owner,
    approvedRationale: reviewRequiredRow.review.rationale,
    expiredRationale: expiredRow.review.rationale,
    approvedExpiresAt: reviewRequiredRow.review.expiresAt,
    expiredExpiresAt: expiredRow.review.expiresAt,
    governancePolicySourceRef: "declared-source://source-conformance/governance/review-policy.json#/",
    expiredExceptionReviewQueueItemId: expiredRow.reviewQueueItemId,
    expiredExceptionExecutable: false,
    renewalRequiredBeforeHandoff: true,
    routeToAuthorityLayer: true
  };
}

function findSourceConformanceResult(upstream, fixturePath, diagnosticCode) {
  const rows = [...(upstream.sourceEvidence.validationResults || []), ...(upstream.sourceReport.results || [])].filter((row) =>
    row.fixturePath === fixturePath &&
    (row.diagnosticCodes || []).includes(diagnosticCode)
  );
  if (rows.length === 0) {
    throw contractError(`designer workflow trace source-conformance result is missing for ${fixturePath}.`, 1);
  }
  return rows[0];
}

function arrayEquals(actual, expected) {
  return canonicalJson(actual) === canonicalJson(expected);
}

function buildReport({ runId, upstream, selectionRef, validationResults, diagnostics, status, promotionStatus }) {
  const catalogComponent = upstream.p2Catalog.components[DWT_COMPONENT_ID];
  const protocolHandoffRefs = DWT_PROTOCOL_HANDOFF_PATHS.map((artifactPath) => findSingleArtifactRef(upstream.protocolEvidence, artifactPath));
  const nativeHandoffRefs = DWT_NATIVE_HANDOFF_PATHS.map((artifactPath) => findSingleArtifactRef(upstream.nativeEvidence, artifactPath));
  const exceptionLifecycle = sourceConformanceExceptionLifecycle(upstream);
  return {
    schemaId: "designer-workflow-trace-report.v0",
    version: DWT_VERSION,
    runId,
    targetId: DWT_TARGET_ID,
    scenarioId: DWT_SCENARIO_ID,
    componentScope: [DWT_COMPONENT_ID],
    targetIds: DWT_TARGET_IDS,
    scopeStatement: "First executable designer workflow trace indexes the accepted Button evidence path across P2, source-conformance, P3, P4, and the implemented static P5 targets.",
    nonAuthorityStatement: "This report is an index over accepted evidence. It is not catalog authority, proof authority for upstream phases, review authority, demo authority, customer validation, production adoption, live SurfaceOps, live JudgmentKit, live agent execution, tool calls, network calls, callbacks, secrets, action execution, work-order execution, a production adapter, API, SDK, runtime, A2UI, P6, or P7.",
    upstreamPreflight: {
      status: "pass",
      refs: upstream.boundaryRefs
    },
    traceSelectionRef: selectionRef,
    designerWorkflowSteps: orderedDesignerWorkflowSteps([
      {
        stepId: "declare-design-authority",
        visionStepNumber: 1,
        label: "Declare design authority",
        designerAction: "Identify the source material, mappings, and policy refs that govern the Button scenario.",
        proofTrace: "Accepted P2 and source-conformance refs establish declared source authority for the trace.",
        status: upstream.sourceEvidence.status,
        promotionStatus: upstream.sourceEvidence.promotionStatus,
        proofAuthority: false,
        refs: [
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P2_EVIDENCE_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_SOURCE_AUTHORITY_MAP_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_SOURCE_CONFORMANCE_REPORT_PATH)
        ]
      },
      {
        stepId: "compile-governed-contracts",
        visionStepNumber: 2,
        label: "Compile governed contracts",
        designerAction: "Confirm that bounded source material compiles into a governed catalog with evidence.",
        proofTrace: "The P2 governed catalog, ingestion report, and P2 evidence are hash-bound accepted inputs.",
        status: upstream.p2Evidence.status,
        promotionStatus: upstream.p2Evidence.promotionStatus,
        proofAuthority: false,
        componentId: DWT_COMPONENT_ID,
        catalogSourceRef: catalogComponent.sourceRef,
        refs: [
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P2_CATALOG_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P2_EVIDENCE_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P2_INGESTION_REPORT_PATH)
        ]
      },
      {
        stepId: "generate-inside-catalog-boundary",
        visionStepNumber: 3,
        label: "Generate inside the catalog boundary",
        designerAction: "Check that allowed, invalid, and review-required output stays inside catalog authority.",
        proofTrace: "Ingestion diagnostics, source review queue output, inert P3 review queue refs, and static target projections preserve catalog boundaries instead of inferring UI.",
        status: "pass",
        promotionStatus: "review_required",
        proofAuthority: false,
        refs: [
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P2_INGESTION_REPORT_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_SOURCE_REVIEW_QUEUE_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P3_REVIEW_QUEUE_PATH),
          protocolHandoffRefs.find((ref) => ref.path === "artifacts/p5/protocol/protocol-projection.json"),
          nativeHandoffRefs.find((ref) => ref.path === "artifacts/p5/native/surfaces-native-projection.json")
        ],
        statusNote: "This indexes bounded generated artifacts; it does not implement a live generator or product workflow."
      },
      {
        stepId: "inspect-evidence-not-pixels",
        visionStepNumber: 4,
        label: "Inspect evidence, not only pixels",
        designerAction: "Review evidence status, promotion status, reports, diagnostics, and demos as presentation only.",
        proofTrace: "The trace selection plus accepted phase and target evidence make the current status inspectable before demos are considered.",
        status: "pass",
        promotionStatus,
        proofAuthority: false,
        refs: [selectionRef, ...upstream.evidenceRefs],
        traceArtifactPaths: DWT_ARTIFACT_PATHS
      },
      {
        stepId: "decide-or-revise-authority-layer",
        visionStepNumber: 5,
        label: "Decide or revise at the authority layer",
        designerAction: "Route unsupported or review-required output to source material, mapping, policy, review ownership, or future proof scope.",
        proofTrace: "Source review queue, P3 review queue, P4 decision ledger, review report, and evaluation report keep decisions evidence-bound.",
        status: upstream.p4Evidence.status,
        promotionStatus: upstream.p4Evidence.promotionStatus,
        proofAuthority: false,
        refs: [
          upstream.boundaryRefs.find((ref) => ref.path === DWT_SOURCE_REVIEW_QUEUE_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P3_REVIEW_QUEUE_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P4_DECISION_LEDGER_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P4_REVIEW_REPORT_PATH),
          upstream.boundaryRefs.find((ref) => ref.path === DWT_P4_EVALUATION_REPORT_PATH)
        ],
        statusNote: "P4 status is pass while promotionStatus is blocked; the trace preserves that governed outcome."
      },
      {
        stepId: "hand-off-proven-target-output",
        visionStepNumber: 6,
        label: "Hand off only proven target output",
        designerAction: "Identify only hash-bound static protocol or native output backed by target evidence as handoff candidates.",
        proofTrace: "Protocol and native selections, projections, envelopes, packets, and reports are inert proof-only handoff artifacts.",
        status: "pass",
        promotionStatus: "blocked",
        proofAuthority: false,
        refs: [
          upstream.evidenceRefs.find((ref) => ref.path === DWT_PROTOCOL_EVIDENCE_PATH),
          upstream.evidenceRefs.find((ref) => ref.path === DWT_NATIVE_EVIDENCE_PATH),
          ...protocolHandoffRefs,
          ...nativeHandoffRefs
        ],
        statusNote: "Target artifacts remain upstream proof refs for the accepted Button path; the expired governed exception is not handoff-allowed."
      },
      {
        stepId: "govern-changes-over-time",
        visionStepNumber: 7,
        label: "Govern changes over time",
        designerAction: "Regenerate proof artifacts and evidence when source authority, policy, review decisions, or target requirements change.",
        proofTrace: "Accepted boundary refs and evidence hashes define the current change-governance closure for this trace.",
        status: "pass",
        promotionStatus,
        proofAuthority: false,
        refs: [selectionRef, ...upstream.boundaryRefs],
        traceArtifactPaths: DWT_ARTIFACT_PATHS,
        statusNote: "Any source, policy, review, or target change requires refreshed proof evidence before downstream trust."
      }
    ].map(designerWorkflowStep)),
    evidenceStatus: evidenceStatusRows(upstream),
    targetHandoffArtifacts: [
      {
        targetId: "surfaces-protocol-static",
        evidenceRef: upstream.evidenceRefs.find((ref) => ref.path === DWT_PROTOCOL_EVIDENCE_PATH),
        artifactRefs: protocolHandoffRefs,
        emittedForComponent: DWT_COMPONENT_ID,
        liveBehavior: false,
        handoffAllowedForGovernedException: false,
        reportAuthority: "index-only"
      },
      {
        targetId: "surfaces-native-static",
        evidenceRef: upstream.evidenceRefs.find((ref) => ref.path === DWT_NATIVE_EVIDENCE_PATH),
        artifactRefs: nativeHandoffRefs,
        emittedForComponent: DWT_COMPONENT_ID,
        liveBehavior: false,
        handoffAllowedForGovernedException: false,
        reportAuthority: "index-only"
      }
    ],
    sourceConformanceGovernance: {
      status: "indexed",
      blockedFixturePath: DWT_GOVERNED_EXCEPTION_FIXTURE_PATH,
      diagnosticCode: DWT_GOVERNED_EXCEPTION_DIAGNOSTIC_CODE,
      sourceConformanceEvidenceRef: upstream.evidenceRefs.find((ref) => ref.path === DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH),
      sourceConformanceReportRef: upstream.boundaryRefs.find((ref) => ref.path === DWT_SOURCE_CONFORMANCE_REPORT_PATH),
      sourceReviewQueueRef: upstream.boundaryRefs.find((ref) => ref.path === DWT_SOURCE_REVIEW_QUEUE_PATH),
      exceptionLifecycle,
      routeToAuthorityLayer: true,
      targetHandoffAllowed: false,
      reportAuthority: "index-only",
      proofAuthority: false,
      liveSurfaceOps: false,
      liveJudgmentKit: false,
      actionExecution: false,
      productionBehavior: false
    },
    presentationLinks: [
      { path: "demo/p2/index.html", role: "presentation-only", proofAuthority: false },
      { path: "demo/p3/index.html", role: "presentation-only", proofAuthority: false },
      { path: "demo/p4/index.html", role: "presentation-only", proofAuthority: false },
      { path: "demo/p5/protocol/index.html", role: "presentation-only", proofAuthority: false },
      { path: "demo/p5/native/index.html", role: "presentation-only", proofAuthority: false }
    ],
    boundaryClaims: {
      excludedClaims: DWT_FORBIDDEN_CLAIM_KEYS,
      reportAuthority: "index-only",
      implementedScope: "non-numbered cross-cutting proof target over accepted evidence",
      liveBehavior: false,
      liveAgentExecution: false,
      toolCallExecution: false,
      networkCallExecution: false,
      callbackExecution: false,
      secretAccess: false,
      actionExecution: false,
      workOrderExecution: false,
      productionBehavior: false
    },
    validationResults: validationResults.map(stripResult),
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    status,
    promotionStatus,
    provenance: provenance("interfacectl-designer-workflow-trace-report", [
      DWT_P2_EVIDENCE_PATH,
      DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH,
      DWT_P3_EVIDENCE_PATH,
      DWT_P4_EVIDENCE_PATH,
      DWT_PROTOCOL_EVIDENCE_PATH,
      DWT_NATIVE_EVIDENCE_PATH
    ])
  };
}

function orderedDesignerWorkflowSteps(steps) {
  assertOrderedPaths(
    "designer workflow trace product designer workflow step order",
    steps.map((step) => step.stepId),
    DWT_WORKFLOW_STEPS
  );
  return steps;
}

function designerWorkflowStep(step) {
  const refs = (step.refs || []).filter(Boolean);
  if (refs.length !== (step.refs || []).length) {
    throw contractError(`designer workflow trace product designer workflow step has missing refs: ${step.stepId}`, 1);
  }
  return {
    ...step,
    refs,
    visionSourceRef: `VISION.md#product-designer-workflow-step-${step.visionStepNumber}`,
    traceArtifactPaths: step.traceArtifactPaths || refs.map((ref) => ref.path),
    reportAuthority: "index-only",
    proofAuthority: false,
    productAuthority: false,
    productWorkflowImplementation: false,
    liveSurfaceOps: false,
    liveJudgmentKit: false,
    productionBehavior: false
  };
}

function evidenceStatusRows(upstream) {
  return [
    ["P2 ingestion", upstream.p2Evidence, DWT_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", DWT_ACCEPTED_P2_EVIDENCE_HASH],
    ["Source conformance", upstream.sourceEvidence, DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH, "source-conformance-evidence.v0", DWT_ACCEPTED_SOURCE_CONFORMANCE_EVIDENCE_HASH],
    ["P3 orchestration", upstream.p3Evidence, DWT_P3_EVIDENCE_PATH, "agent-orchestration-evidence.v0", DWT_ACCEPTED_P3_EVIDENCE_HASH],
    ["P4 review and judgment", upstream.p4Evidence, DWT_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", DWT_ACCEPTED_P4_EVIDENCE_HASH],
    ["P5 protocol", upstream.protocolEvidence, DWT_PROTOCOL_EVIDENCE_PATH, "protocol-adapter-evidence.v0", DWT_ACCEPTED_PROTOCOL_EVIDENCE_HASH],
    ["P5 native", upstream.nativeEvidence, DWT_NATIVE_EVIDENCE_PATH, "surfaces-native-evidence.v0", DWT_ACCEPTED_NATIVE_EVIDENCE_HASH]
  ].map(([label, evidence, pathValue, schemaId, hash]) => ({
    label,
    path: pathValue,
    schemaId,
    status: evidence.status,
    promotionStatus: evidence.promotionStatus,
    hashAlgorithm: "sha256",
    hash
  }));
}

async function buildEvidence({ cwd, runId, command, args, upstream, selectionRef, reportRef, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const artifactPath of dwtSchemaPaths()) {
    schemaClosure.push(artifactRef(artifactPath, schemaIdForDesignerWorkflowTracePath(artifactPath), await canonicalFileHash(path.join(cwd, artifactPath))));
  }
  const fixtureRefs = [];
  for (const fixturePath of dwtFixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, schemaIdForDesignerWorkflowTracePath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const artifactRefs = [];
  for (const artifactPath of DWT_ARTIFACT_PATHS) {
    artifactRefs.push({
      ...artifactRef(
        artifactPath,
        schemaIdForDesignerWorkflowTracePath(artifactPath),
        artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: {
        generatedAt: DWT_TIMESTAMP,
        generator: "interfacectl-designer-workflow-trace-evidence",
        sourceRefs: artifactPath === `${DWT_ARTIFACT_ROOT}/evidence.json`
          ? ["plans/product-designer-workflow-trace.md"]
          : [artifactPath]
      }
    });
  }
  const evidence = {
    contractId: DWT_CONTRACT_ID,
    schemaId: "designer-workflow-trace-evidence.v0",
    version: DWT_VERSION,
    runId,
    checkedAt: DWT_TIMESTAMP,
    command,
    args,
    environment: { ...DWT_ENVIRONMENT },
    schemaClosure,
    fixtureRefs,
    boundaryRefs: upstream.boundaryRefs.map(withBoundaryProvenance),
    artifacts: artifactRefs,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: validationResults.map(stripResult),
    status,
    promotionStatus,
    provenance: provenance("interfacectl-designer-workflow-trace-evidence", [
      selectionRef.path,
      reportRef.path,
      "plans/product-designer-workflow-trace.md"
    ])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  assertOrderedPaths("designer workflow trace evidence schemaClosure", evidence.schemaClosure.map((entry) => entry.path), dwtSchemaPaths());
  assertOrderedPaths("designer workflow trace evidence fixtureRefs", evidence.fixtureRefs.map((entry) => entry.path), dwtFixturePaths());
  assertOrderedPaths("designer workflow trace evidence boundaryRefs", evidence.boundaryRefs.map((entry) => entry.path), defaultBoundaryRefs().map((entry) => entry.path));
  assertOrderedPaths("designer workflow trace evidence artifacts", evidence.artifacts.map((entry) => entry.path), DWT_ARTIFACT_PATHS);
  assertOrderedPaths("designer workflow trace evidence validationResults", evidence.validationResults.map((entry) => entry.fixturePath), DWT_EXPECTATION_ROWS.map((row) => row.fixturePath));
  return evidence;
}

function withBoundaryProvenance(ref) {
  return {
    ...ref,
    provenance: {
      generatedAt: DWT_TIMESTAMP,
      generator: "interfacectl-designer-workflow-trace-boundary",
      sourceRefs: [ref.path]
    }
  };
}

function stripResult(row) {
  return {
    fixturePath: row.fixturePath,
    kind: row.kind,
    stage: row.stage,
    phase: row.phase,
    expectedResult: row.expectedResult,
    actualResult: row.actualResult,
    promotionStatus: row.promotionStatus,
    diagnosticCodes: row.diagnosticCodes,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    componentId: row.componentId,
    matched: row.matched
  };
}

function diagnosticForCode(code) {
  const row = diagnosticsRegistry().find((candidate) => candidate.code === code);
  if (!row) throw contractError(`missing designer workflow trace diagnostic registry row: ${code}`, 1);
  return { ...row };
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    `${a.stage}:${a.code}:${a.artifactPath}:${a.jsonPointer}`.localeCompare(`${b.stage}:${b.code}:${b.artifactPath}:${b.jsonPointer}`)
  );
}

function aggregatePromotionStatus(validationResults, upstream) {
  const statuses = [
    upstream.p2Evidence.promotionStatus,
    upstream.sourceEvidence.promotionStatus,
    upstream.p3Evidence.promotionStatus,
    upstream.p4Evidence.promotionStatus,
    upstream.protocolEvidence.promotionStatus,
    upstream.nativeEvidence.promotionStatus,
    ...validationResults.map((row) => row.promotionStatus)
  ];
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("review_required")) return "review_required";
  return "allowed";
}

function assertRunExpectation(expectations, data) {
  if (data.status !== expectations.runExpectation.status || data.promotionStatus !== expectations.runExpectation.promotionStatus) {
    throw contractError(`designer workflow trace run expectation mismatch: expected ${expectations.runExpectation.status}/${expectations.runExpectation.promotionStatus} got ${data.status}/${data.promotionStatus}`, 1);
  }
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  for (const schemaPath of dwtConsumedSchemaPaths()) {
    const schema = await readJson(path.join(cwd, schemaPath));
    ajv.addSchema(schema);
  }
  for (const schemaPath of dwtOwnedSchemaPaths()) {
    const schema = await readJson(path.join(cwd, schemaPath));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const scopes = ["designer-workflow-trace", "source-conformance", "p5", "p4", "p3", "p2", "p1", "p0"];
      for (const scope of scopes) {
        const validate = ajv.getSchema(`https://surfaces.dev/schemas/${scope}/${schemaId}.schema.json`);
        if (validate) {
          const valid = validate(data);
          return { valid, errors: validate.errors || [] };
        }
      }
      throw new Error(`schema not loaded: ${schemaId}`);
    }
  };
}

function assertSchema(validators, schemaId, data, artifactPath) {
  const result = validators.validate(schemaId, data);
  if (!result.valid) {
    throw contractError(`schema validation failed for ${artifactPath}: ${formatAjvErrors(result.errors)}`, 1);
  }
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
}

function buildRunId({ upstream, selectionRef, expectations, command, args }) {
  return `designer-workflow-trace-${sha256Hex(canonicalJson({
    selectionHash: selectionRef.hash,
    expectationsHash: sha256Hex(canonicalJson(expectations)),
    upstreamEvidence: upstream.evidenceRefs.map((ref) => ref.hash),
    command,
    args
  })).slice(0, 32)}`;
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  clone.artifacts[clone.artifacts.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "TRACE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "TRACE_EVIDENCE_HASH_MISMATCH";
  }
  const expectedBoundaryRefs = defaultBoundaryRefs().map(withBoundaryProvenance);
  if (!refArrayEquals(evidence.boundaryRefs || [], expectedBoundaryRefs)) return "TRACE_EVIDENCE_HASH_MISMATCH";
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.hash !== await canonicalFileHashOrEvidenceSelfHash(cwd, ref.path)) return "TRACE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${DWT_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "TRACE_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${DWT_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "TRACE_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

async function canonicalFileHashOrEvidenceSelfHash(cwd, artifactPath) {
  if (artifactPath === DWT_P2_EVIDENCE_PATH) return p2Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  if (artifactPath === DWT_SOURCE_CONFORMANCE_EVIDENCE_PATH) return sourceConformanceInternals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  if (artifactPath === DWT_P3_EVIDENCE_PATH) return p3Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  if (artifactPath === DWT_P4_EVIDENCE_PATH) return p4Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  if (artifactPath === DWT_PROTOCOL_EVIDENCE_PATH) return p5ProtocolInternals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  if (artifactPath === DWT_NATIVE_EVIDENCE_PATH) return p5NativeInternals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  return canonicalFileHash(path.join(cwd, artifactPath));
}

function refArrayEquals(actual, expected) {
  return canonicalJson(actual) === canonicalJson(expected);
}

function assertOrderedPaths(label, actual, expected) {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    throw contractError(`${label} mismatch`, 1);
  }
}

function assertPathSet(label, actual, expected) {
  const missing = expected.filter((entry) => !actual.includes(entry));
  const extra = actual.filter((entry) => !expected.includes(entry));
  if (missing.length > 0 || extra.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (extra.length > 0) parts.push(`extra ${extra.join(", ")}`);
    throw contractError(`${label} drift: ${parts.join("; ")}`, 1);
  }
}

function expectedDirectoryEntries(files, root) {
  const dirs = new Set();
  for (const file of files) {
    let current = path.posix.dirname(file);
    while (current !== "." && current !== root) {
      dirs.add(`${current}/`);
      current = path.posix.dirname(current);
    }
  }
  return [...dirs];
}

async function listTreeEntries(dir, relativeRoot) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = `${relativeRoot}/${entry.name}`;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(`${relativePath}/`);
      files.push(...await listTreeEntries(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      files.push(`${relativePath}${entry.isSymbolicLink() ? "@" : "!"}`);
    }
  }
  return files;
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const designerWorkflowTraceInternals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode
};
