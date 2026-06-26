import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p3Internals } from "./p3-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  P4_ACCEPTED_P3_EVIDENCE_HASH,
  P4_ACCEPTED_P3_REPORT_HASH,
  P4_ACCEPTED_P3_REVIEW_QUEUE_HASH,
  P4_ARTIFACT_PATHS,
  P4_ARTIFACT_ROOT,
  P4_CONSUMED_P3_SCHEMA_FILES,
  P4_DIAGNOSTIC_ROWS,
  P4_ENVIRONMENT,
  P4_EXPECTATION_ROWS,
  P4_FIXTURE_ROOT,
  P4_GENERATED_ARTIFACTS,
  P4_ORCHESTRATION_EVIDENCE_PATH,
  P4_ORCHESTRATION_REPORT_PATH,
  P4_REVIEW_QUEUE_PATH,
  P4_SCHEMA_FILES,
  P4_SCHEMA_ROOT,
  P4_TIMESTAMP,
  P4_VERSION,
  buildP4Fixtures,
  diagnosticsRegistry,
  evaluationOnlyAuthority,
  inertReviewExecution,
  p4ArtifactOrder,
  p4ConsumedSchemaPaths,
  p4FixturePaths,
  p4SchemaPaths,
  schemaIdForP4Path
} from "./p4-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;
const STAGE_ORDER = new Map([
  ["preflight", 0],
  ["review", 1],
  ["judgment", 2],
  ["report", 3],
  ["evidence", 4]
]);
const PREFLIGHT_DIAGNOSTIC_FIXTURES = new Map([
  ["REVIEW_UPSTREAM_EVIDENCE_MISSING", "mutations/missing-upstream-evidence.review-preflight.json"],
  ["REVIEW_UPSTREAM_EVIDENCE_FAILED", "mutations/failing-upstream-evidence.review-preflight.json"],
  ["REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH", "mutations/upstream-evidence-hash-mismatch.review-preflight.json"],
  ["REVIEW_UPSTREAM_EVIDENCE_STALE", "mutations/stale-upstream-evidence.review-preflight.json"]
]);

export async function runP4Interfacectl(argv, io) {
  const parsed = parseReviewProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runReviewProof({
      cwd: io.cwd,
      orchestrationEvidencePath: parsed.orchestrationEvidence,
      reviewQueuePath: parsed.reviewQueue,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: "interfacectl surfaces review proof",
      args: {
        orchestrationEvidence: parsed.orchestrationEvidence,
        reviewQueue: parsed.reviewQueue,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces review proof: ${result.status}`,
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

function parseReviewProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--orchestration-evidence") {
      result.orchestrationEvidence = argv[i + 1];
      i += 1;
    } else if (current === "--review-queue") {
      result.reviewQueue = argv[i + 1];
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
  if (!result.orchestrationEvidence || !result.reviewQueue || !result.fixture || !result.out) {
    return { ok: false, error: `usage: interfacectl surfaces review proof --orchestration-evidence ${P4_ORCHESTRATION_EVIDENCE_PATH} --review-queue ${P4_REVIEW_QUEUE_PATH} --fixture ${P4_FIXTURE_ROOT} --out ${P4_ARTIFACT_ROOT}` };
  }
  for (const [flagName, value] of [
    ["--orchestration-evidence", result.orchestrationEvidence],
    ["--review-queue", result.reviewQueue],
    ["--fixture", result.fixture],
    ["--out", result.out]
  ]) {
    const parsed = parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    if (flagName === "--orchestration-evidence") result.orchestrationEvidence = parsed.path;
    else if (flagName === "--review-queue") result.reviewQueue = parsed.path;
    else result[flagName.slice(2)] = parsed.path;
  }
  return { ok: true, ...result };
}

function parseRelativePosixPath(value, flagName) {
  return p3Internals.parseRelativePosixPath(value, flagName);
}

export async function runReviewProof({ cwd, orchestrationEvidencePath, reviewQueuePath, fixtureRoot, outRoot, command, args }) {
  assertP4CommandRoots(orchestrationEvidencePath, reviewQueuePath, fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, P4_SCHEMA_ROOT), `unreadable schema path: ${P4_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  const upstream = await strictP3Preflight(cwd, orchestrationEvidencePath, reviewQueuePath, validators);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredP4Files(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "review-judgment-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  await assertP4Expectations(cwd, expectations, fixtureRoot, outRoot);

  const fixtureRows = await loadP4FixtureRows(cwd, expectations, validators);
  const runId = buildRunId({ upstream, expectations, command, args });
  const validationResults = evaluateP4Expectations({ fixtureRows });
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "fail") {
    const mismatches = validationResults
      .filter((result) => !result.matched)
      .map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"}`);
    throw contractError(`P4 validation expectation mismatch: ${mismatches.join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults);

  const ledger = buildDecisionLedger({ runId, upstream, fixtureRows, validationResults, diagnostics });
  assertSchema(validators, "surfaceops-decision-ledger.v0", ledger, `${outRoot}/surfaceops-decision-ledger.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "surfaceops-decision-ledger.json"), ledger);
  const ledgerRef = artifactRef(`${outRoot}/surfaceops-decision-ledger.json`, "surfaceops-decision-ledger.v0", await canonicalFileHash(path.join(cwd, outRoot, "surfaceops-decision-ledger.json")));

  const evaluationReport = buildEvaluationReport({ runId, upstream, ledgerRef, fixtureRows, validationResults });
  assertSchema(validators, "judgmentkit-evaluation-report.v0", evaluationReport, `${outRoot}/judgmentkit-evaluation-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "judgmentkit-evaluation-report.json"), evaluationReport);
  const evaluationReportRef = artifactRef(`${outRoot}/judgmentkit-evaluation-report.json`, "judgmentkit-evaluation-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "judgmentkit-evaluation-report.json")));

  const report = buildReport({
    runId,
    upstream,
    ledgerRef,
    evaluationReportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "review-judgment-report.v0", report, `${outRoot}/review-judgment-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "review-judgment-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/review-judgment-report.json`, "review-judgment-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "review-judgment-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    upstream,
    ledgerRef,
    evaluationReportRef,
    reportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "review-judgment-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("P4 evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`P4 evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: P4_ARTIFACT_PATHS
  };
}

function assertP4CommandRoots(orchestrationEvidencePath, reviewQueuePath, fixtureRoot, outRoot) {
  if (
    orchestrationEvidencePath !== P4_ORCHESTRATION_EVIDENCE_PATH ||
    reviewQueuePath !== P4_REVIEW_QUEUE_PATH ||
    fixtureRoot !== P4_FIXTURE_ROOT ||
    outRoot !== P4_ARTIFACT_ROOT
  ) {
    throw contractError(
      `P4 review proof requires --orchestration-evidence ${P4_ORCHESTRATION_EVIDENCE_PATH} --review-queue ${P4_REVIEW_QUEUE_PATH} --fixture ${P4_FIXTURE_ROOT} --out ${P4_ARTIFACT_ROOT}`,
      2
    );
  }
}

async function strictP3Preflight(cwd, orchestrationEvidencePath, reviewQueuePath, validators) {
  await assertRegularLocalFile(path.join(cwd, orchestrationEvidencePath), orchestrationEvidencePath);
  await assertRegularLocalFile(path.join(cwd, reviewQueuePath), reviewQueuePath);
  await assertRegularLocalFile(path.join(cwd, P4_ORCHESTRATION_REPORT_PATH), P4_ORCHESTRATION_REPORT_PATH);

  const p3Evidence = await readJson(path.join(cwd, orchestrationEvidencePath));
  const p3ReviewQueue = await readJson(path.join(cwd, reviewQueuePath));
  const p3Report = await readJson(path.join(cwd, P4_ORCHESTRATION_REPORT_PATH));
  assertSchema(validators, "agent-orchestration-evidence.v0", p3Evidence, orchestrationEvidencePath);
  assertSchema(validators, "agent-review-queue.v0", p3ReviewQueue, reviewQueuePath);
  assertSchema(validators, "agent-orchestration-report.v0", p3Report, P4_ORCHESTRATION_REPORT_PATH);

  const p3EvidenceRef = findSingleArtifactRef(p3Evidence, orchestrationEvidencePath);
  const p3ReviewQueueRef = findSingleArtifactRef(p3Evidence, reviewQueuePath);
  const p3ReportRef = findSingleArtifactRef(p3Evidence, P4_ORCHESTRATION_REPORT_PATH);
  const p3PlanRef = findSingleArtifactRef(p3Evidence, "artifacts/p3/orchestration-plan.json");
  const p3EvidenceSelfHash = p3Internals.computeEvidenceSelfHash(p3Evidence);
  if (p3Evidence.schemaId !== "agent-orchestration-evidence.v0" || p3EvidenceRef.hash !== p3EvidenceSelfHash) {
    throw contractError("P4 upstream P3 evidence self-hash validation failed", 1);
  }
  if (p3Evidence.status !== "pass" || p3Evidence.promotionStatus === "blocked") {
    throw contractError("P4 upstream P3 evidence status is not pass", 1);
  }
  if (p3EvidenceSelfHash !== P4_ACCEPTED_P3_EVIDENCE_HASH || p3EvidenceRef.hash !== P4_ACCEPTED_P3_EVIDENCE_HASH) {
    throw contractError("P4 upstream P3 evidence hash does not match the accepted boundary", 1);
  }

  const currentQueueHash = await canonicalFileHash(path.join(cwd, reviewQueuePath));
  if (
    p3ReviewQueue.schemaId !== "agent-review-queue.v0" ||
    p3ReviewQueue.runId !== p3Evidence.runId ||
    p3ReviewQueueRef.path !== reviewQueuePath ||
    p3ReviewQueueRef.hash !== currentQueueHash ||
    p3ReviewQueueRef.hash !== P4_ACCEPTED_P3_REVIEW_QUEUE_HASH
  ) {
    throw contractError("P4 upstream P3 review queue hash does not match the accepted boundary", 1);
  }
  if (
    p3ReviewQueue.orchestrationPlanRef?.path !== "artifacts/p3/orchestration-plan.json" ||
    p3ReviewQueue.orchestrationPlanRef?.hash !== p3PlanRef.hash
  ) {
    throw contractError("P4 upstream P3 review queue boundary is stale", 1);
  }

  const currentReportHash = await canonicalFileHash(path.join(cwd, P4_ORCHESTRATION_REPORT_PATH));
  if (
    p3Report.schemaId !== "agent-orchestration-report.v0" ||
    p3Report.runId !== p3Evidence.runId ||
    p3Report.status !== "pass" ||
    p3Report.promotionStatus === "blocked" ||
    p3ReportRef.hash !== currentReportHash ||
    p3ReportRef.hash !== P4_ACCEPTED_P3_REPORT_HASH ||
    p3Report.reviewQueueRef?.path !== reviewQueuePath ||
    p3Report.reviewQueueRef?.hash !== currentQueueHash
  ) {
    throw contractError("P4 upstream P3 report boundary is stale", 1);
  }

  return {
    evidence: p3Evidence,
    reviewQueue: p3ReviewQueue,
    report: p3Report,
    orchestrationEvidenceRef: artifactRef(orchestrationEvidencePath, "agent-orchestration-evidence.v0", p3EvidenceSelfHash),
    reviewQueueRef: {
      ...artifactRef(reviewQueuePath, "agent-review-queue.v0", currentQueueHash),
      sourceEvidenceHash: p3EvidenceSelfHash
    },
    orchestrationReportRef: {
      ...artifactRef(P4_ORCHESTRATION_REPORT_PATH, "agent-orchestration-report.v0", currentReportHash),
      sourceEvidenceHash: p3EvidenceSelfHash
    }
  };
}

function findSingleArtifactRef(evidence, artifactPath) {
  const refs = (evidence.artifacts || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) {
    throw contractError(`P4 upstream P3 evidence must contain exactly one ref for ${artifactPath}`, 1);
  }
  return refs[0];
}

async function assertRegularLocalFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`P4 upstream evidence input is missing: ${label}`, 1);
  }
  if (!stat.isFile()) {
    throw contractError(`P4 input is not a regular file: ${label}`, 1);
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
  const required = new Set([...p4SchemaPaths(), ...p4ConsumedSchemaPaths()]);
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, P4_SCHEMA_ROOT), P4_SCHEMA_ROOT)).sort();
  const missing = [...required].filter((entry) => !actualSchemaEntries.includes(entry)).sort();
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (required.has(entry)) return false;
    const fileName = entry.slice(`${P4_SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
  }
}

async function assertRequiredP4Files(cwd) {
  for (const relativePath of [...p4SchemaPaths(), ...p4ConsumedSchemaPaths(), ...p4FixturePaths()]) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing P4 required file: ${relativePath}`, 2);
    }
  }
}

async function rejectStaleOutput(cwd, outRoot) {
  const outDir = await ensureSafeOutputDirectory(cwd, outRoot);
  let entries;
  try {
    entries = await fs.readdir(outDir, { withFileTypes: true });
  } catch (error) {
    throw contractError(`output path error for --out ${outRoot}: ${error.code || error.message}`, 2);
  }
  const allowed = new Set(P4_GENERATED_ARTIFACTS);
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

async function assertP4Expectations(cwd, manifest, fixtureRoot, outRoot) {
  if (manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== P4_SCHEMA_ROOT) {
    throw contractError("P4 expectations manifest roots do not match proof command paths", 1);
  }
  assertOrderedPaths("P4 expectations manifest inputs", manifest.inputs, p4FixturePaths());
  assertOrderedPaths("P4 expectations manifest artifactOrder", manifest.artifactOrder, p4ArtifactOrder());
  assertOrderedPaths("P4 expectations fixture order", manifest.expectations.map((row) => row.fixturePath), P4_EXPECTATION_ROWS.map((row) => row.fixturePath));
  assertNoDuplicatePaths("P4 expectations manifest inputs", manifest.inputs);
  assertNoDuplicatePaths("P4 expectations manifest expectations", manifest.expectations.map((row) => row.fixturePath));
  for (const inputPath of manifest.inputs) {
    assertPathUnderRoot(inputPath, fixtureRoot, "P4 expectations input");
  }
  const expectedFixtureEntries = [
    ...p4FixturePaths(),
    ...expectedDirectoryEntries(p4FixturePaths(), fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("P4 fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

async function loadP4FixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    if (expectation.fixturePath.endsWith(".review-judgment.json")) {
      assertSchema(validators, "review-judgment-fixture.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".review-preflight.json")) {
      assertSchema(validators, "review-preflight-mutation.v0", fixture, expectation.fixturePath);
    }
    rows.push({ expectation, fixture });
  }
  return rows;
}

function evaluateP4Expectations({ fixtureRows }) {
  return fixtureRows.map(({ expectation, fixture }) => {
    const actual = evaluateP4Fixture({ fixture, expectation });
    const matched = compareExpectation(expectation, actual);
    return {
      fixturePath: expectation.fixturePath,
      kind: expectation.kind,
      stage: expectation.stage,
      phase: expectation.phase,
      expectedResult: expectation.expectedResult,
      actualResult: actual.result,
      promotionStatus: actual.promotionStatus,
      diagnosticCodes: actual.diagnostics.map((diagnostic) => diagnostic.code),
      artifactPath: expectation.artifactPath,
      decisionStatus: actual.decisionStatus,
      evaluationResult: actual.evaluationResult,
      matched,
      diagnostics: actual.diagnostics
    };
  });
}

function evaluateP4Fixture({ fixture, expectation }) {
  if (expectation.diagnosticCodes.length === 0) {
    return validateAllowedReviewJudgment(fixture, expectation);
  }
  const code = expectation.diagnosticCodes[0];
  if (!fixtureMatchesDiagnostic(code, fixture)) {
    return {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: [],
      decisionStatus: fixture.decision?.status ?? null,
      evaluationResult: fixture.finding?.result ?? null
    };
  }
  if (code === "SURFACEOPS_SECOND_REVIEW_REQUIRED") {
    const validation = validateAllowedReviewJudgment(fixture, expectation);
    if (validation.result === "invalid") return validation;
    return {
      result: "review_required",
      promotionStatus: "review_required",
      diagnostics: [diagnosticForExpectation(expectation)],
      decisionStatus: fixture.decision.status,
      evaluationResult: null
    };
  }
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForExpectation(expectation)],
    decisionStatus: fixture.decision?.status ?? null,
    evaluationResult: fixture.finding?.result ?? null
  };
}

function validateAllowedReviewJudgment(fixture, expectation) {
  if (fixture.fixtureKind === "surfaceops-decision") {
    const decision = fixture.decision;
    const invalidCode = firstDecisionFailureCode(fixture);
    if (invalidCode) {
      return invalidResult(expectation, invalidCode, decision?.status ?? null, null);
    }
    const promotionStatus = decision.secondReviewRequired || decision.status === "deferred" ? "review_required" :
      decision.status === "approved" ? "allowed" : "blocked";
    const result = promotionStatus === "review_required" ? "review_required" : "valid";
    return {
      result,
      promotionStatus,
      diagnostics: [],
      decisionStatus: decision.status,
      evaluationResult: null
    };
  }

  if (fixture.fixtureKind === "judgmentkit-evaluation") {
    const invalidCode = firstFindingFailureCode(fixture);
    if (invalidCode) return invalidResult(expectation, invalidCode, null, fixture.finding?.result ?? null);
    return {
      result: "valid",
      promotionStatus: fixture.finding.result === "fail" ? "blocked" : "allowed",
      diagnostics: [],
      decisionStatus: null,
      evaluationResult: fixture.finding.result
    };
  }

  return invalidResult(expectation, "SURFACEOPS_EVIDENCE_REF_MISSING", null, null);
}

function firstDecisionFailureCode(fixture) {
  const decision = fixture.decision;
  if (!decision || fixture.reviewItemRef?.reviewItemId !== decision.reviewItemId) return "SURFACEOPS_EVIDENCE_REF_MISSING";
  if (!decisionHasAcceptedEvidence(decision)) return "SURFACEOPS_EVIDENCE_REF_MISSING";
  if (decision.catalogOverride !== null) return "SURFACEOPS_DECISION_OVERRIDE";
  if (decisionExecutionForbidden(decision.execution)) return "SURFACEOPS_EXECUTION_FORBIDDEN";
  if (decision.hiddenState !== null) return "SURFACEOPS_DECISION_HIDDEN";
  return null;
}

function decisionHasAcceptedEvidence(decision) {
  return refsHaveAcceptedP3Boundary(decision.evidenceRefs || []);
}

function refsHaveAcceptedP3Boundary(refs) {
  return refs.some((ref) =>
    ref.path === P4_ORCHESTRATION_EVIDENCE_PATH &&
    ref.schemaId === "agent-orchestration-evidence.v0" &&
    ref.hashAlgorithm === "sha256" &&
    ref.hash === P4_ACCEPTED_P3_EVIDENCE_HASH
  ) &&
    refs.some((ref) =>
      ref.path === P4_REVIEW_QUEUE_PATH &&
      ref.schemaId === "agent-review-queue.v0" &&
      ref.hashAlgorithm === "sha256" &&
      ref.hash === P4_ACCEPTED_P3_REVIEW_QUEUE_HASH &&
      ref.sourceEvidenceHash === P4_ACCEPTED_P3_EVIDENCE_HASH
    );
}

function decisionExecutionForbidden(execution) {
  return execution?.authorized !== false ||
    [
      "shellCommands",
      "toolCalls",
      "connectorCalls",
      "networkCalls",
      "fileEdits",
      "secrets",
      "callbacks"
    ].some((key) => (execution?.[key] || []).length > 0);
}

function firstFindingFailureCode(fixture) {
  const finding = fixture.finding;
  if (!finding || !Array.isArray(finding.evidenceRefs) || finding.evidenceRefs.length === 0) {
    return "JUDGMENTKIT_EVIDENCE_REF_MISSING";
  }
  if (!refsHaveAcceptedP3Boundary(finding.evidenceRefs)) return "JUDGMENTKIT_EVIDENCE_REF_MISSING";
  const authority = finding.authority || {};
  if (Object.values(authority).some((value) => value !== false)) return "JUDGMENTKIT_POLICY_OVERRIDE";
  return null;
}

function fixtureMatchesDiagnostic(code, fixture) {
  switch (code) {
    case "REVIEW_UPSTREAM_EVIDENCE_MISSING":
    case "REVIEW_UPSTREAM_EVIDENCE_FAILED":
    case "REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH":
    case "REVIEW_UPSTREAM_EVIDENCE_STALE":
      return preflightFixtureMatchesDiagnostic(code, fixture);
    case "SURFACEOPS_EVIDENCE_REF_MISSING":
      return firstDecisionFailureCode(fixture) === "SURFACEOPS_EVIDENCE_REF_MISSING";
    case "SURFACEOPS_DECISION_OVERRIDE":
      return firstDecisionFailureCode(fixture) === "SURFACEOPS_DECISION_OVERRIDE";
    case "SURFACEOPS_EXECUTION_FORBIDDEN":
      return firstDecisionFailureCode(fixture) === "SURFACEOPS_EXECUTION_FORBIDDEN";
    case "SURFACEOPS_DECISION_HIDDEN":
      return firstDecisionFailureCode(fixture) === "SURFACEOPS_DECISION_HIDDEN";
    case "SURFACEOPS_SECOND_REVIEW_REQUIRED":
      return fixture.decision?.secondReviewRequired === true && firstDecisionFailureCode(fixture) === null;
    case "JUDGMENTKIT_EVIDENCE_REF_MISSING":
      return firstFindingFailureCode(fixture) === "JUDGMENTKIT_EVIDENCE_REF_MISSING";
    case "JUDGMENTKIT_POLICY_OVERRIDE":
      return firstFindingFailureCode(fixture) === "JUDGMENTKIT_POLICY_OVERRIDE";
    case "REVIEW_LEDGER_HASH_MISMATCH":
      return fixture.integrityCheck?.expectedLedgerHash === "0".repeat(64);
    case "REVIEW_REPORT_LEDGER_HASH_MISMATCH":
      return fixture.decisionLedgerRef?.hash === "0".repeat(64);
    case "REVIEW_EVIDENCE_HASH_MISMATCH":
      return fixture.artifacts?.[0]?.hash === "0".repeat(64);
    default:
      return false;
  }
}

function preflightFixtureMatchesDiagnostic(code, fixture) {
  const fixturePath = PREFLIGHT_DIAGNOSTIC_FIXTURES.get(code);
  if (!fixturePath) return false;
  return canonicalJson(fixture) === canonicalJson(buildP4Fixtures()[fixturePath]);
}

function invalidResult(expectation, code, decisionStatus, evaluationResult) {
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForExpectation({ ...expectation, diagnosticCodes: [code] })],
    decisionStatus,
    evaluationResult
  };
}

function compareExpectation(expectation, actual) {
  return actual.result === expectation.expectedResult &&
    actual.promotionStatus === expectation.promotionStatus &&
    canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code)) === canonicalJson(expectation.diagnosticCodes) &&
    actual.decisionStatus === expectation.decisionStatus &&
    actual.evaluationResult === expectation.evaluationResult;
}

function buildDecisionLedger({ runId, upstream, fixtureRows, validationResults, diagnostics }) {
  const rowsByPath = new Map(fixtureRows.map((row) => [row.expectation.fixturePath, row]));
  const decisionResults = validationResults.filter((result) =>
    (result.kind === "valid" || result.kind === "review") &&
    (result.actualResult === "valid" || result.actualResult === "review_required") &&
    result.decisionStatus !== null
  );
  const decisions = decisionResults.map((result) => {
    const fixture = rowsByPath.get(result.fixturePath).fixture;
    return {
      decisionId: fixture.decision.decisionId,
      decisionKey: fixture.decision.decisionKey,
      reviewItemId: fixture.decision.reviewItemId,
      taskId: fixture.reviewItemRef.taskId,
      reviewerId: fixture.reviewer.reviewerId,
      status: fixture.decision.status,
      rationale: fixture.decision.rationale,
      requestedChanges: fixture.decision.requestedChanges,
      evidenceRefs: fixture.decision.evidenceRefs,
      fixtureRef: fixture.decision.fixtureRef,
      secondReviewRequired: fixture.decision.secondReviewRequired,
      nonExecutable: true,
      execution: inertReviewExecution(),
      promotionStatus: result.promotionStatus,
      provenance: {
        generatedAt: P4_TIMESTAMP,
        generator: "interfacectl-p4-decision-ledger",
        sourceRefs: [result.fixturePath, fixture.decision.fixtureRef.sourceRef]
      }
    };
  }).sort((a, b) =>
    a.reviewItemId.localeCompare(b.reviewItemId) ||
    a.decisionKey.localeCompare(b.decisionKey) ||
    a.decisionId.localeCompare(b.decisionId)
  );
  const reviewers = uniqueReviewers(decisionResults.map((result) => rowsByPath.get(result.fixturePath).fixture.reviewer));
  const ledgerDiagnostics = sortDiagnostics(diagnostics.filter((diagnostic) =>
    diagnostic.code === "SURFACEOPS_SECOND_REVIEW_REQUIRED"
  ));
  return {
    schemaId: "surfaceops-decision-ledger.v0",
    version: P4_VERSION,
    runId,
    upstreamEvidenceRef: upstream.orchestrationEvidenceRef,
    reviewQueueRef: upstream.reviewQueueRef,
    orchestrationReportRef: upstream.orchestrationReportRef,
    reviewers,
    decisions,
    diagnostics: ledgerDiagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    integrityCheck: null,
    environment: { ...P4_ENVIRONMENT },
    status: "pass",
    promotionStatus: aggregateDecisionPromotionStatus(decisions),
    provenance: {
      generatedAt: P4_TIMESTAMP,
      generator: "interfacectl-p4-decision-ledger",
      sourceRefs: decisions.map((decision) => decision.fixtureRef.sourceRef)
    }
  };
}

function buildEvaluationReport({ runId, upstream, ledgerRef, fixtureRows, validationResults }) {
  const rowsByPath = new Map(fixtureRows.map((row) => [row.expectation.fixturePath, row]));
  const evaluationResults = validationResults.filter((result) =>
    result.kind === "valid" &&
    result.actualResult === "valid" &&
    result.evaluationResult !== null
  );
  const findings = evaluationResults.map((result) => {
    const finding = deepClone(rowsByPath.get(result.fixturePath).fixture.finding);
    return {
      ...finding,
      evidenceRefs: [
        upstream.orchestrationEvidenceRef,
        upstream.reviewQueueRef
      ],
      affectedArtifactPaths: [
        P4_ORCHESTRATION_EVIDENCE_PATH,
        P4_REVIEW_QUEUE_PATH
      ],
      authority: evaluationOnlyAuthority()
    };
  })
    .sort((a, b) =>
      a.dimension.localeCompare(b.dimension) ||
      a.severity.localeCompare(b.severity) ||
      a.findingId.localeCompare(b.findingId)
    );
  const evaluator = evaluationResults.length > 0 ?
    deepClone(rowsByPath.get(evaluationResults[0].fixturePath).fixture.reviewer) :
    {
      reviewerId: "judgmentkit-evaluator",
      role: "judgmentkit-evaluator",
      displayName: "JudgmentKit fixture evaluator",
      hostUser: null,
      accountId: null,
      sourceRef: "plans/p4/judgmentkit-evaluation-v0.md"
    };
  const aggregateResult = aggregateEvaluationResult(findings);
  return {
    schemaId: "judgmentkit-evaluation-report.v0",
    version: P4_VERSION,
    runId,
    upstreamEvidenceRef: upstream.orchestrationEvidenceRef,
    reviewQueueRef: upstream.reviewQueueRef,
    decisionLedgerRef: ledgerRef,
    evaluator,
    dimensions: ["activity_fit", "contract_quality", "evidence_quality", "handoff_quality"],
    findings,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    aggregateResult,
    environment: { ...P4_ENVIRONMENT },
    status: "pass",
    promotionStatus: aggregateResult === "fail" ? "blocked" : "allowed",
    provenance: {
      generatedAt: P4_TIMESTAMP,
      generator: "interfacectl-p4-judgmentkit-evaluation",
      sourceRefs: findings.map((finding) => finding.findingId)
    }
  };
}

function buildReport({ runId, upstream, ledgerRef, evaluationReportRef, validationResults, diagnostics, status, promotionStatus }) {
  return {
    schemaId: "review-judgment-report.v0",
    version: P4_VERSION,
    runId,
    upstreamPreflight: {
      status: "pass",
      promotionStatus: upstream.evidence.promotionStatus,
      refs: [
        upstream.orchestrationEvidenceRef,
        upstream.reviewQueueRef,
        upstream.orchestrationReportRef
      ]
    },
    decisionLedgerRef: ledgerRef,
    judgmentkitEvaluationReportRef: evaluationReportRef,
    results: validationResults.map(stripResult),
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    generatedArtifactRefs: [ledgerRef, evaluationReportRef],
    environment: { ...P4_ENVIRONMENT },
    status,
    promotionStatus,
    provenance: {
      generatedAt: P4_TIMESTAMP,
      generator: "interfacectl-p4-report",
      sourceRefs: validationResults.map((result) => result.fixturePath)
    }
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, ledgerRef, evaluationReportRef, reportRef, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const artifactPath of [...p4SchemaPaths(), ...p4ConsumedSchemaPaths()]) {
    schemaClosure.push(artifactRef(artifactPath, schemaIdForP4Path(artifactPath), await canonicalFileHash(path.join(cwd, artifactPath))));
  }

  const fixtureRefs = [];
  for (const fixturePath of p4FixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, schemaIdForP4Path(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }

  const boundaryRefs = [
    upstream.orchestrationEvidenceRef,
    upstream.reviewQueueRef,
    upstream.orchestrationReportRef,
    ledgerRef,
    evaluationReportRef,
    reportRef
  ];

  const artifactRefs = [];
  for (const artifactPath of P4_ARTIFACT_PATHS) {
    artifactRefs.push({
      ...artifactRef(
        artifactPath,
        schemaIdForP4Path(artifactPath),
        artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: {
        generatedAt: P4_TIMESTAMP,
        generator: "interfacectl-p4-evidence",
        sourceRefs: artifactPath === `${P4_ARTIFACT_ROOT}/evidence.json` ? ["plans/p4/validation-evidence.md"] : [artifactPath]
      }
    });
  }

  const evidence = {
    contractId: "surfaces-p4-review-judgment-proof",
    schemaId: "review-judgment-evidence.v0",
    version: P4_VERSION,
    runId,
    checkedAt: P4_TIMESTAMP,
    command,
    args,
    environment: { ...P4_ENVIRONMENT },
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts: artifactRefs,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: validationResults.map(stripResult),
    status,
    promotionStatus,
    provenance: {
      generatedAt: P4_TIMESTAMP,
      generator: "interfacectl-p4-evidence",
      sourceRefs: ["plans/p4/validation-evidence.md"]
    }
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);

  assertOrderedPaths("P4 evidence schemaClosure", evidence.schemaClosure.map((entry) => entry.path), [...p4SchemaPaths(), ...p4ConsumedSchemaPaths()]);
  assertOrderedPaths("P4 evidence fixtureRefs", evidence.fixtureRefs.map((entry) => entry.path), p4FixturePaths());
  assertOrderedPaths("P4 evidence artifacts", evidence.artifacts.map((entry) => entry.path), P4_ARTIFACT_PATHS);
  assertOrderedPaths("P4 evidence validationResults", evidence.validationResults.map((entry) => entry.fixturePath), P4_EXPECTATION_ROWS.map((row) => row.fixturePath));
  return evidence;
}

function stripResult(result) {
  return {
    fixturePath: result.fixturePath,
    kind: result.kind,
    stage: result.stage,
    phase: result.phase,
    expectedResult: result.expectedResult,
    actualResult: result.actualResult,
    promotionStatus: result.promotionStatus,
    diagnosticCodes: result.diagnosticCodes,
    artifactPath: result.artifactPath,
    decisionStatus: result.decisionStatus,
    evaluationResult: result.evaluationResult,
    matched: result.matched
  };
}

function diagnosticForExpectation(expectation) {
  const code = expectation.diagnosticCodes[0];
  const row = P4_DIAGNOSTIC_ROWS.find((candidate) =>
    candidate.code === code &&
    candidate.artifactPath === expectation.fixturePath &&
    candidate.jsonPointer === expectation.jsonPointer
  ) || P4_DIAGNOSTIC_ROWS.find((candidate) => candidate.code === code);
  if (!row) throw contractError(`missing P4 diagnostic registry row: ${code}`, 1);
  return diagnosticFromRow(row, expectation.requiredSourceRef ?? row.sourceRef ?? null);
}

function diagnosticFromRow(row, sourceRef) {
  return {
    code: row.code,
    message: row.canonicalMessage,
    severity: row.severity,
    diagnosticSource: row.diagnosticSource,
    stage: row.stage,
    phase: row.phase,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction
  };
}

function aggregatePromotionStatus(results) {
  if (results.some((result) => result.matched === false)) return "blocked";
  if (results.some((result) => result.actualResult === "valid" && result.promotionStatus === "blocked")) return "blocked";
  if (results.some((result) => result.actualResult === "review_required")) return "review_required";
  return "allowed";
}

function aggregateDecisionPromotionStatus(decisions) {
  if (decisions.some((decision) => decision.status === "rejected" || decision.status === "changes_requested")) return "blocked";
  if (decisions.some((decision) => decision.status === "deferred" || decision.secondReviewRequired)) return "review_required";
  return "allowed";
}

function aggregateEvaluationResult(findings) {
  if (findings.some((finding) => finding.severity === "error" || finding.result === "fail")) return "fail";
  if (findings.some((finding) => finding.severity === "warning" || finding.result === "warn")) return "warn";
  return "pass";
}

function uniqueReviewers(reviewers) {
  const byId = new Map();
  for (const reviewer of reviewers) {
    if (!byId.has(reviewer.reviewerId)) byId.set(reviewer.reviewerId, reviewer);
  }
  return [...byId.values()].sort((a, b) => a.reviewerId.localeCompare(b.reviewerId));
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

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    compareNullable(a.artifactPath, b.artifactPath) ||
    (STAGE_ORDER.get(a.stage) ?? 99) - (STAGE_ORDER.get(b.stage) ?? 99) ||
    compareNullable(a.phase, b.phase) ||
    compareNullable(a.jsonPointer, b.jsonPointer) ||
    compareNullable(a.code, b.code) ||
    compareNullable(a.sourceRef, b.sourceRef) ||
    compareNullable(a.message, b.message)
  );
}

function compareNullable(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return a < b ? -1 : 1;
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });

  for (const file of [...P4_CONSUMED_P3_SCHEMA_FILES, ...P4_SCHEMA_FILES]) {
    const schema = await readJson(path.join(cwd, P4_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }

  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/p4/${schemaId}.schema.json`) ||
        ajv.getSchema(`https://surfaces.dev/schemas/p3/${schemaId}.schema.json`);
      if (!validate) throw new Error(`schema not loaded: ${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
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

function buildRunId({ upstream, expectations, command, args }) {
  return `p4-${sha256Hex(canonicalJson({
    upstreamEvidenceHash: upstream.orchestrationEvidenceRef.hash,
    upstreamReviewQueueHash: upstream.reviewQueueRef.hash,
    upstreamReportHash: upstream.orchestrationReportRef.hash,
    expectationsHash: sha256Hex(canonicalJson(expectations)),
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
  const expectedSchemaPaths = [...p4SchemaPaths(), ...p4ConsumedSchemaPaths()];
  const expectedBoundaryPaths = [
    P4_ORCHESTRATION_EVIDENCE_PATH,
    P4_REVIEW_QUEUE_PATH,
    P4_ORCHESTRATION_REPORT_PATH,
    `${P4_ARTIFACT_ROOT}/surfaceops-decision-ledger.json`,
    `${P4_ARTIFACT_ROOT}/judgmentkit-evaluation-report.json`,
    `${P4_ARTIFACT_ROOT}/review-judgment-report.json`
  ];
  if (!pathArrayEquals(evidence.schemaClosure?.map((ref) => ref.path), expectedSchemaPaths)) {
    return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  if (!pathArrayEquals(evidence.fixtureRefs?.map((ref) => ref.path), p4FixturePaths())) {
    return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  if (!pathArrayEquals(evidence.boundaryRefs?.map((ref) => ref.path), expectedBoundaryPaths)) {
    return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  if (!pathArrayEquals(evidence.artifacts?.map((ref) => ref.path), P4_ARTIFACT_PATHS)) {
    return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  if (!pathArrayEquals(evidence.validationResults?.map((result) => result.fixturePath), P4_EXPECTATION_ROWS.map((row) => row.fixturePath))) {
    return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.path === P4_ORCHESTRATION_EVIDENCE_PATH) {
      const p3Evidence = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== p3Internals.computeEvidenceSelfHash(p3Evidence)) return "REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH";
    } else if (ref.path.startsWith("artifacts/p3/")) {
      if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "REVIEW_UPSTREAM_EVIDENCE_HASH_MISMATCH";
    } else if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) {
      return "REVIEW_EVIDENCE_HASH_MISMATCH";
    }
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${P4_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${P4_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "REVIEW_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

function pathArrayEquals(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((entry, index) => entry === expected[index]);
}

function assertRunExpectation(manifest, artifact) {
  const expected = manifest.runExpectation;
  if (artifact.status !== expected.status || artifact.promotionStatus !== expected.promotionStatus) {
    throw contractError(
      `P4 run expectation mismatch: expected ${expected.status}/${expected.promotionStatus}, got ${artifact.status}/${artifact.promotionStatus}`,
      1
    );
  }
}

function assertOrderedPaths(label, actual, expected) {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    throw contractError(`${label} mismatch`, 1);
  }
}

function assertNoDuplicatePaths(label, paths) {
  const duplicates = paths.filter((entry, index) => paths.indexOf(entry) !== index);
  if (duplicates.length > 0) {
    throw contractError(`${label} contains duplicate paths: ${[...new Set(duplicates)].join(", ")}`, 1);
  }
}

function assertPathUnderRoot(value, root, label) {
  if (
    typeof value !== "string" ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..") ||
    !value.startsWith(`${root}/`)
  ) {
    throw contractError(`${label} must stay under ${root}: ${value}`, 1);
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

export const p4Internals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  preflightFixtureMatchesDiagnostic,
  parseRelativePosixPath
};
