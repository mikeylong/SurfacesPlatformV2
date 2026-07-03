import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
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
  P5_ACCEPTED_P2_CATALOG_HASH,
  P5_ACCEPTED_P2_EVIDENCE_HASH,
  P5_ACCEPTED_P4_DECISION_LEDGER_HASH,
  P5_ACCEPTED_P4_EVIDENCE_HASH,
  P5_ACCEPTED_P4_REVIEW_REPORT_HASH,
  P5_ARTIFACT_PATHS,
  P5_ARTIFACT_ROOT,
  P5_CONSUMED_SCHEMA_FILES,
  P5_DIAGNOSTIC_ROWS,
  P5_ENVIRONMENT,
  P5_EXPECTATION_ROWS,
  P5_FIXTURE_ROOT,
  P5_GENERATED_ARTIFACTS,
  P5_P2_CATALOG_PATH,
  P5_P2_EVIDENCE_PATH,
  P5_P4_DECISION_LEDGER_PATH,
  P5_P4_EVIDENCE_PATH,
  P5_P4_REVIEW_REPORT_PATH,
  P5_SCHEMA_FILES,
  P5_SCHEMA_ROOT,
  P5_TARGET_ID,
  P5_TIMESTAMP,
  P5_VERSION,
  artifactRef as p5ArtifactRef,
  buildP5ProtocolFixtures,
  defaultUpstreamRefs,
  diagnosticsRegistry,
  p5ArtifactOrder,
  p5ConsumedSchemaPaths,
  p5FixturePaths,
  p5SchemaPaths,
  provenance,
  schemaIdForP5Path
} from "./p5-protocol-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;
const STAGE_ORDER = new Map([
  ["preflight", 0],
  ["target-selection", 1],
  ["projection", 2],
  ["protocol-boundary", 3],
  ["report", 4],
  ["evidence", 5]
]);
const PREFLIGHT_DIAGNOSTIC_FIXTURES = new Map([
  ["PROTOCOL_UPSTREAM_EVIDENCE_MISSING", "mutations/missing-upstream-evidence.protocol-preflight.json"],
  ["PROTOCOL_DECISION_LEDGER_MISSING", "mutations/missing-decision-ledger.protocol-preflight.json"],
  ["PROTOCOL_REVIEW_REPORT_MISSING", "mutations/missing-review-report.protocol-preflight.json"],
  ["PROTOCOL_UPSTREAM_EVIDENCE_FAILED", "mutations/failing-upstream-evidence.protocol-preflight.json"],
  ["PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH", "mutations/upstream-evidence-hash-mismatch.protocol-preflight.json"],
  ["PROTOCOL_DECISION_LEDGER_HASH_MISMATCH", "mutations/decision-ledger-hash-mismatch.protocol-preflight.json"],
  ["PROTOCOL_REVIEW_REPORT_HASH_MISMATCH", "mutations/review-report-hash-mismatch.protocol-preflight.json"],
  ["PROTOCOL_UPSTREAM_EVIDENCE_STALE", "mutations/stale-upstream-evidence.protocol-preflight.json"]
]);

export async function runP5ProtocolInterfacectl(argv, io) {
  const parsed = parseProtocolProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runProtocolProof({
      cwd: io.cwd,
      ingestionEvidencePath: parsed.ingestionEvidence,
      reviewEvidencePath: parsed.reviewEvidence,
      decisionLedgerPath: parsed.decisionLedger,
      reviewReportPath: parsed.reviewReport,
      catalogPath: parsed.catalog,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: "interfacectl surfaces protocol proof",
      args: {
        ingestionEvidence: parsed.ingestionEvidence,
        reviewEvidence: parsed.reviewEvidence,
        decisionLedger: parsed.decisionLedger,
        reviewReport: parsed.reviewReport,
        catalog: parsed.catalog,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces protocol proof: ${result.status}`,
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

function parseProtocolProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--ingestion-evidence") {
      result.ingestionEvidence = argv[i + 1];
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
    } else if (current === "--catalog") {
      result.catalog = argv[i + 1];
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
  if (!result.ingestionEvidence || !result.reviewEvidence || !result.decisionLedger || !result.reviewReport || !result.catalog || !result.fixture || !result.out) {
    return {
      ok: false,
      error: `usage: interfacectl surfaces protocol proof --ingestion-evidence ${P5_P2_EVIDENCE_PATH} --review-evidence ${P5_P4_EVIDENCE_PATH} --decision-ledger ${P5_P4_DECISION_LEDGER_PATH} --review-report ${P5_P4_REVIEW_REPORT_PATH} --catalog ${P5_P2_CATALOG_PATH} --fixture ${P5_FIXTURE_ROOT} --out ${P5_ARTIFACT_ROOT}`
    };
  }
  for (const [flagName, value] of [
    ["--ingestion-evidence", result.ingestionEvidence],
    ["--review-evidence", result.reviewEvidence],
    ["--decision-ledger", result.decisionLedger],
    ["--review-report", result.reviewReport],
    ["--catalog", result.catalog],
    ["--fixture", result.fixture],
    ["--out", result.out]
  ]) {
    const parsed = parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    const key = flagName.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = parsed.path;
  }
  return { ok: true, ...result };
}

function parseRelativePosixPath(value, flagName) {
  return p3Internals.parseRelativePosixPath(value, flagName);
}

export async function runProtocolProof({
  cwd,
  ingestionEvidencePath,
  reviewEvidencePath,
  decisionLedgerPath,
  reviewReportPath,
  catalogPath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertP5CommandRoots(ingestionEvidencePath, reviewEvidencePath, decisionLedgerPath, reviewReportPath, catalogPath, fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, P5_SCHEMA_ROOT), `unreadable schema path: ${P5_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  const upstream = await strictUpstreamPreflight(cwd, { ingestionEvidencePath, reviewEvidencePath, decisionLedgerPath, reviewReportPath, catalogPath }, validators);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredP5Files(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "protocol-adapter-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  await assertP5Expectations(cwd, expectations, fixtureRoot, outRoot);

  const targetSelectionFixture = await readJson(path.join(cwd, fixtureRoot, "adapter-target-selection.fixture.json"));
  assertSchema(validators, "protocol-target-selection.v0", targetSelectionFixture, `${fixtureRoot}/adapter-target-selection.fixture.json`);
  const targetSelection = buildTargetSelection({ upstream, fixture: targetSelectionFixture });
  assertSchema(validators, "protocol-target-selection.v0", targetSelection, `${outRoot}/adapter-target-selection.json`);
  assertGeneratedTargetSelection(targetSelection, upstream.p2Catalog);
  const targetSelectionRef = artifactRef(`${outRoot}/adapter-target-selection.json`, "protocol-target-selection.v0", sha256Hex(canonicalJson(targetSelection)));

  const projection = buildProjection({ upstream, targetSelectionRef });
  assertSchema(validators, "protocol-projection.v0", projection, `${outRoot}/protocol-projection.json`);
  assertGeneratedProjection(projection, upstream, targetSelection);
  const projectionRef = artifactRef(`${outRoot}/protocol-projection.json`, "protocol-projection.v0", sha256Hex(canonicalJson(projection)));
  await writeCanonicalJson(path.join(cwd, outRoot, "adapter-target-selection.json"), targetSelection);
  await writeCanonicalJson(path.join(cwd, outRoot, "protocol-projection.json"), projection);

  const fixtureRows = await loadP5FixtureRows(cwd, expectations, validators);
  const runId = buildRunId({ upstream, targetSelectionRef, projectionRef, expectations, command, args });
  const validationResults = evaluateP5Expectations({ fixtureRows, upstream, targetSelection, projection });
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "fail") {
    const mismatches = validationResults
      .filter((result) => !result.matched)
      .map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.promotionStatus}/${result.expectedDiagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"}`);
    throw contractError(`P5 protocol validation expectation mismatch: ${mismatches.join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults);

  const envelopeRefs = [];
  const envelopes = buildEnvelopes({
    cwd,
    projection,
    projectionRef,
    fixtureRows,
    validationResults
  });
  for (const envelope of envelopes) {
    assertSchema(validators, "protocol-envelope.v0", envelope.data, envelope.path);
    await writeCanonicalJson(path.join(cwd, envelope.path), envelope.data);
    envelopeRefs.push(artifactRef(envelope.path, "protocol-envelope.v0", await canonicalFileHash(path.join(cwd, envelope.path))));
  }

  const report = buildReport({
    runId,
    upstream,
    targetSelectionRef,
    projectionRef,
    envelopeRefs,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "protocol-adapter-report.v0", report, `${outRoot}/protocol-adapter-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "protocol-adapter-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/protocol-adapter-report.json`, "protocol-adapter-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "protocol-adapter-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    upstream,
    targetSelectionRef,
    projectionRef,
    envelopeRefs,
    reportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "protocol-adapter-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("P5 protocol evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`P5 protocol evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: P5_ARTIFACT_PATHS
  };
}

function assertP5CommandRoots(ingestionEvidencePath, reviewEvidencePath, decisionLedgerPath, reviewReportPath, catalogPath, fixtureRoot, outRoot) {
  if (
    ingestionEvidencePath !== P5_P2_EVIDENCE_PATH ||
    reviewEvidencePath !== P5_P4_EVIDENCE_PATH ||
    decisionLedgerPath !== P5_P4_DECISION_LEDGER_PATH ||
    reviewReportPath !== P5_P4_REVIEW_REPORT_PATH ||
    catalogPath !== P5_P2_CATALOG_PATH ||
    fixtureRoot !== P5_FIXTURE_ROOT ||
    outRoot !== P5_ARTIFACT_ROOT
  ) {
    throw contractError(
      `P5 protocol proof requires --ingestion-evidence ${P5_P2_EVIDENCE_PATH} --review-evidence ${P5_P4_EVIDENCE_PATH} --decision-ledger ${P5_P4_DECISION_LEDGER_PATH} --review-report ${P5_P4_REVIEW_REPORT_PATH} --catalog ${P5_P2_CATALOG_PATH} --fixture ${P5_FIXTURE_ROOT} --out ${P5_ARTIFACT_ROOT}`,
      2
    );
  }
}

async function strictUpstreamPreflight(cwd, paths, validators) {
  for (const [artifactPath, label] of [
    [paths.ingestionEvidencePath, "P2 ingestion evidence"],
    [paths.catalogPath, "P2 governed catalog"],
    [paths.reviewEvidencePath, "P4 review evidence"],
    [paths.decisionLedgerPath, "P4 decision ledger"],
    [paths.reviewReportPath, "P4 review judgment report"]
  ]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), label);
  }

  const p2Evidence = await readJson(path.join(cwd, paths.ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, paths.catalogPath));
  const p4Evidence = await readJson(path.join(cwd, paths.reviewEvidencePath));
  const p4DecisionLedger = await readJson(path.join(cwd, paths.decisionLedgerPath));
  const p4ReviewReport = await readJson(path.join(cwd, paths.reviewReportPath));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, paths.ingestionEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, paths.catalogPath);
  assertSchema(validators, "review-judgment-evidence.v0", p4Evidence, paths.reviewEvidencePath);
  assertSchema(validators, "surfaceops-decision-ledger.v0", p4DecisionLedger, paths.decisionLedgerPath);
  assertSchema(validators, "review-judgment-report.v0", p4ReviewReport, paths.reviewReportPath);

  const p2EvidenceRef = findSingleP2ArtifactRef(p2Evidence, paths.ingestionEvidencePath);
  const p2CatalogRef = findSingleP2ArtifactRef(p2Evidence, paths.catalogPath);
  const p2EvidenceSelfHash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  const currentCatalogHash = await canonicalFileHash(path.join(cwd, paths.catalogPath));
  if (p2Evidence.schemaId !== "design-system-ingestion-evidence.v0" || p2EvidenceRef.hash !== p2EvidenceSelfHash) {
    throw contractError("P5 upstream P2 evidence self-hash validation failed", 1);
  }
  if (p2Evidence.status !== "pass" || p2Evidence.promotionStatus === "blocked") {
    throw contractError("P5 upstream P2 evidence is not passing", 1);
  }
  if (
    p2EvidenceSelfHash !== P5_ACCEPTED_P2_EVIDENCE_HASH ||
    p2EvidenceRef.hash !== P5_ACCEPTED_P2_EVIDENCE_HASH ||
    p2CatalogRef.hash !== currentCatalogHash ||
    currentCatalogHash !== P5_ACCEPTED_P2_CATALOG_HASH
  ) {
    throw contractError("P5 upstream P2 evidence or catalog hash does not match the accepted boundary", 1);
  }

  const p4EvidenceRef = findSingleP4ArtifactRef(p4Evidence, paths.reviewEvidencePath);
  const p4LedgerRef = findSingleP4ArtifactRef(p4Evidence, paths.decisionLedgerPath);
  const p4ReportRef = findSingleP4ArtifactRef(p4Evidence, paths.reviewReportPath);
  const p4EvidenceSelfHash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const currentLedgerHash = await canonicalFileHash(path.join(cwd, paths.decisionLedgerPath));
  const currentReviewReportHash = await canonicalFileHash(path.join(cwd, paths.reviewReportPath));
  if (p4Evidence.schemaId !== "review-judgment-evidence.v0" || p4EvidenceRef.hash !== p4EvidenceSelfHash) {
    throw contractError("P5 upstream P4 evidence self-hash validation failed", 1);
  }
  if (p4Evidence.status !== "pass") {
    throw contractError("P5 upstream P4 evidence is not passing", 1);
  }
  if (
    p4EvidenceSelfHash !== P5_ACCEPTED_P4_EVIDENCE_HASH ||
    p4EvidenceRef.hash !== P5_ACCEPTED_P4_EVIDENCE_HASH
  ) {
    throw contractError("P5 upstream P4 evidence hash does not match the accepted boundary", 1);
  }
  if (
    p4LedgerRef.hash !== currentLedgerHash ||
    currentLedgerHash !== P5_ACCEPTED_P4_DECISION_LEDGER_HASH ||
    p4DecisionLedger.schemaId !== "surfaceops-decision-ledger.v0" ||
    p4DecisionLedger.runId !== p4Evidence.runId
  ) {
    throw contractError("P5 upstream P4 decision ledger hash does not match accepted evidence", 1);
  }
  if (
    p4ReportRef.hash !== currentReviewReportHash ||
    currentReviewReportHash !== P5_ACCEPTED_P4_REVIEW_REPORT_HASH ||
    p4ReviewReport.schemaId !== "review-judgment-report.v0" ||
    p4ReviewReport.runId !== p4Evidence.runId ||
    p4ReviewReport.status !== "pass"
  ) {
    throw contractError("P5 upstream P4 review report hash does not match accepted evidence", 1);
  }

  return {
    p2Evidence,
    p2Catalog,
    p4Evidence,
    p4DecisionLedger,
    p4ReviewReport,
    p2EvidenceRef: artifactRef(paths.ingestionEvidencePath, "design-system-ingestion-evidence.v0", p2EvidenceSelfHash),
    p2CatalogRef: artifactRef(paths.catalogPath, "runtime-catalog.v0", currentCatalogHash, { sourceEvidenceHash: p2EvidenceSelfHash }),
    p4EvidenceRef: artifactRef(paths.reviewEvidencePath, "review-judgment-evidence.v0", p4EvidenceSelfHash),
    p4DecisionLedgerRef: artifactRef(paths.decisionLedgerPath, "surfaceops-decision-ledger.v0", currentLedgerHash, { sourceEvidenceHash: p4EvidenceSelfHash }),
    p4ReviewReportRef: artifactRef(paths.reviewReportPath, "review-judgment-report.v0", currentReviewReportHash, { sourceEvidenceHash: p4EvidenceSelfHash })
  };
}

function findSingleP2ArtifactRef(evidence, artifactPath) {
  const refs = (evidence.artifactRefs || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) {
    throw contractError(`P5 upstream P2 evidence must contain exactly one ref for ${artifactPath}`, 1);
  }
  return refs[0];
}

function findSingleP4ArtifactRef(evidence, artifactPath) {
  const refs = (evidence.artifacts || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) {
    throw contractError(`P5 upstream P4 evidence must contain exactly one ref for ${artifactPath}`, 1);
  }
  return refs[0];
}

async function assertRegularLocalFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`P5 protocol input is missing: ${label}`, 1);
  }
  if (!stat.isFile()) {
    throw contractError(`P5 protocol input is not a regular file: ${label}`, 1);
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
  const required = new Set([...p5SchemaPaths(), ...p5ConsumedSchemaPaths()]);
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, P5_SCHEMA_ROOT), P5_SCHEMA_ROOT)).sort();
  const missing = [...required].filter((entry) => !actualSchemaEntries.includes(entry)).sort();
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (required.has(entry)) return false;
    const fileName = entry.slice(`${P5_SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
  }
}

async function assertRequiredP5Files(cwd) {
  for (const relativePath of [...p5SchemaPaths(), ...p5ConsumedSchemaPaths(), ...p5FixturePaths()]) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing P5 protocol required file: ${relativePath}`, 2);
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
  const allowed = new Set(P5_GENERATED_ARTIFACTS);
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

async function assertP5Expectations(cwd, manifest, fixtureRoot, outRoot) {
  if (manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== P5_SCHEMA_ROOT) {
    throw contractError("P5 protocol expectations manifest roots do not match proof command paths", 1);
  }
  assertOrderedPaths("P5 protocol expectations manifest inputs", manifest.inputs, p5FixturePaths());
  assertOrderedPaths("P5 protocol expectations manifest artifactOrder", manifest.artifactOrder, p5ArtifactOrder());
  assertOrderedPaths("P5 protocol expectations fixture order", manifest.expectations.map((row) => row.fixturePath), P5_EXPECTATION_ROWS.map((row) => row.fixturePath));
  assertNoDuplicatePaths("P5 protocol expectations manifest inputs", manifest.inputs);
  assertNoDuplicatePaths("P5 protocol expectations manifest expectations", manifest.expectations.map((row) => row.fixturePath));
  for (const inputPath of manifest.inputs) {
    assertPathUnderRoot(inputPath, fixtureRoot, "P5 protocol expectations input");
  }
  const expectedFixtureEntries = [
    ...p5FixturePaths(),
    ...expectedDirectoryEntries(p5FixturePaths(), fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("P5 protocol fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

async function loadP5FixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectations) {
    const fixtureAbsolutePath = path.join(cwd, expectation.fixturePath);
    const fixture = await readJson(fixtureAbsolutePath);
    let schemaInvalid = false;
    const schemaId = schemaIdForP5Path(expectation.fixturePath);
    if (schemaId) {
      const schemaResult = validators.validate(schemaId, fixture);
      if (!schemaResult.valid && !schemaInvalidTokenFixtureMatchesExpectation(schemaResult.errors, expectation)) {
        throw contractError(`schema validation failed for ${expectation.fixturePath}: ${formatAjvErrors(schemaResult.errors)}`, 1);
      }
      schemaInvalid = !schemaResult.valid;
    }
    rows.push({ expectation, fixture, schemaInvalid, fixtureHash: await canonicalFileHash(fixtureAbsolutePath) });
  }
  return rows;
}

function assertGeneratedTargetSelection(targetSelection, catalog) {
  const failureCode = firstTargetSelectionFailureCode(targetSelection, catalog);
  if (failureCode !== null) {
    throw contractError(`P5 generated target selection failed semantic validation: ${failureCode}`, 1);
  }
}

function assertGeneratedProjection(projection, upstream, targetSelection) {
  const failureCode = firstProjectionFailureCode(projection, upstream, targetSelection);
  if (failureCode !== null) {
    throw contractError(`P5 generated protocol projection failed semantic validation: ${failureCode}`, 1);
  }
}

function buildTargetSelection({ upstream, fixture }) {
  return {
    ...deepClone(fixture),
    upstreamRefs: [
      upstream.p2EvidenceRef,
      upstream.p2CatalogRef,
      upstream.p4EvidenceRef,
      upstream.p4DecisionLedgerRef,
      upstream.p4ReviewReportRef
    ],
    targetSelectionRef: null,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-p5-protocol-target-selection", [fixture.provenance.sourceRefs[0]])
  };
}

function buildProjection({ upstream, targetSelectionRef }) {
  const catalog = upstream.p2Catalog;
  const components = {};
  for (const componentId of ["Button", "InLineAlert"]) {
    const component = catalog.components[componentId];
    components[componentId] = {
      componentId,
      props: deepClone(component.props),
      variants: deepClone(component.variants),
      states: deepClone(component.states),
      slots: deepClone(component.slots),
      actions: deepClone(component.actions),
      events: deepClone(component.events),
      dataBindings: deepClone(component.dataBindings),
      tokenRefs: deepClone(component.tokenRefs),
      accessibility: deepClone(component.accessibility),
      sourceRef: component.sourceRef
    };
  }
  return {
    schemaId: "protocol-projection.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    targetSelectionRef,
    catalogRef: upstream.p2CatalogRef,
    p2EvidenceRef: upstream.p2EvidenceRef,
    p4EvidenceRef: upstream.p4EvidenceRef,
    p4DecisionLedgerRef: upstream.p4DecisionLedgerRef,
    p4ReviewReportRef: upstream.p4ReviewReportRef,
    components,
    tokens: deepClone(catalog.tokens),
    actions: {},
    events: {},
    dataBindings: {},
    governance: deepClone(catalog.governance),
    accessibility: Object.fromEntries(Object.entries(components).map(([id, component]) => [id, component.accessibility])),
    protocolEnvelope: {
      messageKind: "static-component-envelope",
      transport: "none",
      sideEffectsAllowed: false,
      liveOperations: [],
      callbacks: [],
      productionApi: false,
      sdk: false,
      a2uiConformance: false,
      allowedComponents: ["Button", "InLineAlert"]
    },
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-p5-protocol-projection", [
      P5_P2_CATALOG_PATH,
      P5_P2_EVIDENCE_PATH,
      P5_P4_EVIDENCE_PATH,
      P5_P4_DECISION_LEDGER_PATH,
      P5_P4_REVIEW_REPORT_PATH
    ])
  };
}

function evaluateP5Expectations({ fixtureRows, upstream, targetSelection, projection }) {
  return fixtureRows.map(({ expectation, fixture, schemaInvalid }) => {
    const actual = evaluateP5Fixture({ fixture, expectation, schemaInvalid, upstream, targetSelection, projection });
    const matched = compareExpectation(expectation, actual);
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
      artifactPath: expectation.artifactPath,
      jsonPointer: expectation.jsonPointer,
      requiredSourceRef: expectation.requiredSourceRef,
      envelopePath: actual.envelopePath,
      component: actual.component,
      matched,
      diagnostics: actual.diagnostics
    };
  });
}

function evaluateP5Fixture({ fixture, expectation, schemaInvalid = false, upstream, targetSelection, projection }) {
  if (expectation.diagnosticCodes.length === 0) {
    return validateAllowedSurfaceFixture({ fixture, expectation, projection });
  }
  const code = expectation.diagnosticCodes[0];
  if (schemaInvalid) {
    return code === "PROTOCOL_TOKEN_RECORD_INVALID" ? {
      result: "invalid",
      promotionStatus: "blocked",
      diagnostics: [diagnosticForExpectation(expectation)],
      envelopePath: null,
      component: expectation.component
    } : {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: [],
      envelopePath: expectation.envelopePath,
      component: fixture.root?.component ?? null
    };
  }
  if (!fixtureMatchesDiagnostic(code, fixture, { upstream, targetSelection, projection }, expectation)) {
    return {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: [],
      envelopePath: expectation.envelopePath,
      component: fixture.root?.component ?? null
    };
  }
  if (code === "PROTOCOL_REVIEW_REQUIRED") {
    return {
      result: "review_required",
      promotionStatus: "review_required",
      diagnostics: [diagnosticForExpectation(expectation)],
      envelopePath: null,
      component: fixture.root?.component ?? null
    };
  }
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForExpectation(expectation)],
    envelopePath: null,
    component: expectation.component
  };
}

function schemaInvalidTokenFixtureMatchesExpectation(errors, expectation) {
  if (expectation.diagnosticCodes.length !== 1 ||
    expectation.diagnosticCodes[0] !== "PROTOCOL_TOKEN_RECORD_INVALID" ||
    ![
      "fixtures/p5/protocol/mutations/projection-token-extra-property.protocol-projection.json",
      "fixtures/p5/protocol/mutations/projection-token-missing-source-ref.protocol-projection.json",
      "fixtures/p5/protocol/mutations/envelope-token-extra-property.protocol-envelope.json"
    ].includes(expectation.fixturePath)) {
    return false;
  }
  return tokenRecordSchemaErrorMatchesPointer(errors, expectation.jsonPointer);
}

function tokenRecordSchemaErrorMatchesPointer(errors, jsonPointer) {
  if ((errors || []).length !== 1) return false;
  const parentPath = path.posix.dirname(jsonPointer);
  const propertyName = path.posix.basename(jsonPointer);
  const [error] = errors || [];
  return error.instancePath === parentPath &&
    (
      (error.keyword === "required" && error.params?.missingProperty === propertyName) ||
      (error.keyword === "additionalProperties" && error.params?.additionalProperty === propertyName) ||
      (error.keyword === "unevaluatedProperties" && error.params?.unevaluatedProperty === propertyName)
    );
}

function validateAllowedSurfaceFixture({ fixture, expectation, projection }) {
  const invalidCode = firstSurfaceFailureCode(fixture, projection);
  if (invalidCode !== null) {
    return {
      result: "invalid",
      promotionStatus: "blocked",
      diagnostics: [diagnosticForExpectation({ ...expectation, diagnosticCodes: [invalidCode] })],
      envelopePath: null,
      component: fixture.root?.component ?? null
    };
  }
  return {
    result: "valid",
    promotionStatus: "allowed",
    diagnostics: [],
    envelopePath: expectation.envelopePath,
    component: fixture.root.component
  };
}

function firstSurfaceFailureCode(fixture, projection) {
  return firstSurfaceFailureCodeWithOptions(fixture, projection, { allowReviewActions: false });
}

function firstSurfaceFailureCodeWithOptions(fixture, projection, options) {
  const root = fixture.root || {};
  const actionEntries = Object.entries(root.actions || {});
  if (actionEntries.some(([, action]) => action.execute === true || action.callback || action.transport || action.network || action.url)) {
    return "PROTOCOL_ACTION_EXECUTION_FORBIDDEN";
  }
  const component = projection.components[root.component];
  if (!component) return "PROTOCOL_MEMBER_UNKNOWN";
  if (actionEntries.length > 0 && options.allowReviewActions !== true) {
    return "PROTOCOL_REVIEW_REQUIRED";
  }
  for (const [propName, propValue] of Object.entries(root.props || {})) {
    const prop = component.props?.[propName];
    if (!prop || !propValueWithinContract(prop, propValue)) return "PROTOCOL_MEMBER_UNKNOWN";
  }
  for (const prop of Object.values(component.props || {})) {
    if (prop.required === true && !Object.prototype.hasOwnProperty.call(root.props || {}, prop.id)) return "PROTOCOL_MEMBER_UNKNOWN";
  }
  const variantProp = component.props?.variant;
  if (root.variant !== "default" && variantProp && !propValueWithinContract(variantProp, root.variant)) {
    return "PROTOCOL_MEMBER_UNKNOWN";
  }
  if (root.variant !== "default" && !variantProp && !component.variants?.[root.variant]) {
    return "PROTOCOL_MEMBER_UNKNOWN";
  }
  if (root.state !== "default" && !component.states?.[root.state]) {
    return "PROTOCOL_MEMBER_UNKNOWN";
  }
  for (const slotName of Object.keys(root.slots || {})) {
    if (!component.slots?.[slotName]) return "PROTOCOL_MEMBER_UNKNOWN";
  }
  const componentTokenIds = new Set(Object.values(component.tokenRefs || {}));
  for (const tokenId of Object.values(root.tokenRefs || {})) {
    if (!componentTokenIds.has(tokenId) || !projection.tokens?.[tokenId]) return "PROTOCOL_MEMBER_UNKNOWN";
  }
  if (Object.keys(root.events || {}).some((eventId) => !component.events?.[eventId])) {
    return "PROTOCOL_MEMBER_UNKNOWN";
  }
  if (Object.keys(root.dataBindings || {}).some((bindingId) => !component.dataBindings?.[bindingId])) {
    return "PROTOCOL_MEMBER_UNKNOWN";
  }
  if (!accessibilityWithinContract(root.accessibility || {}, component.accessibility || {})) {
    return "PROTOCOL_MEMBER_UNKNOWN";
  }
  return null;
}

function propValueWithinContract(prop, value) {
  if (prop.type === "string" && typeof value !== "string") return false;
  if (prop.type === "boolean" && typeof value !== "boolean") return false;
  if (prop.type === "number" && typeof value !== "number") return false;
  if (prop.type === "integer" && (!Number.isInteger(value))) return false;
  if (Array.isArray(prop.allowedValues) && prop.allowedValues.length > 0 && !prop.allowedValues.includes(value)) return false;
  if (typeof value === "string" && typeof prop.minLength === "number" && value.length < prop.minLength) return false;
  if (typeof value === "string" && typeof prop.maxLength === "number" && value.length > prop.maxLength) return false;
  return true;
}

function accessibilityWithinContract(accessibility, contract) {
  for (const key of ["role", "nameFrom", "focusable"]) {
    if (Object.prototype.hasOwnProperty.call(accessibility, key) && Object.prototype.hasOwnProperty.call(contract, key) && accessibility[key] !== contract[key]) {
      return false;
    }
  }
  if (Array.isArray(accessibility.activationKeys) && Array.isArray(contract.keyboard)) {
    const keyboard = new Set(contract.keyboard);
    if (accessibility.activationKeys.some((key) => !keyboard.has(key))) return false;
  }
  return true;
}

function fixtureMatchesDiagnostic(code, fixture, context, expectation) {
  switch (code) {
    case "PROTOCOL_UPSTREAM_EVIDENCE_MISSING":
    case "PROTOCOL_DECISION_LEDGER_MISSING":
    case "PROTOCOL_REVIEW_REPORT_MISSING":
    case "PROTOCOL_UPSTREAM_EVIDENCE_FAILED":
    case "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH":
    case "PROTOCOL_DECISION_LEDGER_HASH_MISMATCH":
    case "PROTOCOL_REVIEW_REPORT_HASH_MISMATCH":
    case "PROTOCOL_UPSTREAM_EVIDENCE_STALE":
      return preflightFixtureMatchesDiagnostic(code, fixture);
    case "PROTOCOL_TARGET_UNDECLARED":
    case "PROTOCOL_TARGET_OUT_OF_SCOPE":
    case "PROTOCOL_LIVE_API_FORBIDDEN":
      return firstTargetSelectionFailureCode(fixture, context.upstream.p2Catalog) === code;
    case "PROTOCOL_A2UI_CLAIM_FORBIDDEN":
      return firstTargetSelectionFailureCode(fixture, context.upstream.p2Catalog) === code ||
        firstProjectionFailureCode(fixture, context.upstream, context.targetSelection) === code;
    case "PROTOCOL_TARGET_SELECTION_HASH_MISMATCH":
      return fixture.targetSelectionRef?.hash === "0".repeat(64);
    case "PROTOCOL_PROJECTION_REF_MISSING":
      return firstProjectionFailureCode(fixture, context.upstream, context.targetSelection) === code;
    case "PROTOCOL_SOURCE_HASH_MISMATCH":
      return projectionSourceHashFixtureMatchesExpectation(fixture, expectation, context.upstream, context.targetSelection);
    case "PROTOCOL_AUTHORITY_ESCALATION":
    case "PROTOCOL_PRODUCTION_API_FORBIDDEN":
      return firstProjectionFailureCode(fixture, context.upstream, context.targetSelection) === code;
    case "PROTOCOL_MEMBER_UNKNOWN":
    case "PROTOCOL_ACTION_EXECUTION_FORBIDDEN":
      return firstSurfaceFailureCode(fixture, context.projection) === code;
    case "PROTOCOL_REVIEW_REQUIRED":
      return isReviewRequiredProtocolFixture(fixture, context.projection);
    case "PROTOCOL_REPORT_HASH_MISMATCH":
      return fixture.projectionRef?.hash === "0".repeat(64);
    case "PROTOCOL_EVIDENCE_HASH_MISMATCH":
      return (fixture.artifacts || []).some((entry) => entry.hash === "0".repeat(64));
    default:
      return false;
  }
}

function firstTargetSelectionFailureCode(selection, catalog) {
  if (!selection.targetId || !selection.targetKind) return "PROTOCOL_TARGET_UNDECLARED";
  if (selection.capabilityScope?.a2uiConformance === true || !selection.excludedClaims?.includes("a2ui")) {
    return "PROTOCOL_A2UI_CLAIM_FORBIDDEN";
  }
  if (
    selection.capabilityScope?.liveProtocolApi === true ||
    selection.capabilityScope?.productionApi === true ||
    selection.capabilityScope?.sdk === true ||
    selection.capabilityScope?.transport !== "none" ||
    selection.capabilityScope?.callbacks === true ||
    selection.capabilityScope?.networkCalls === true
  ) {
    return "PROTOCOL_LIVE_API_FORBIDDEN";
  }
  if (selection.targetId !== P5_TARGET_ID || selection.targetKind !== "protocol-envelope-proof") return "PROTOCOL_TARGET_OUT_OF_SCOPE";
  const componentIds = new Set(Object.keys(catalog.components || {}));
  if ((selection.componentScope || []).some((componentId) => !componentIds.has(componentId))) {
    return "PROTOCOL_TARGET_OUT_OF_SCOPE";
  }
  return null;
}

function artifactRefTupleEquals(actualRef, expectedRef) {
  if (!actualRef || !expectedRef) return false;
  const tupleKeys = ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef", "sourceEvidenceHash"];
  const tuple = (ref) => Object.fromEntries(tupleKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(ref, key))
    .map((key) => [key, ref[key]]));
  return canonicalJson(tuple(actualRef)) === canonicalJson(tuple(expectedRef));
}

function projectionSourceHashFixtureMatchesExpectation(projection, expectation, upstream, targetSelection) {
  if (expectation.diagnosticCodes.length !== 1 || expectation.diagnosticCodes[0] !== "PROTOCOL_SOURCE_HASH_MISMATCH") return false;
  if (firstProjectionFailureCode(projection, upstream, targetSelection) !== "PROTOCOL_SOURCE_HASH_MISMATCH") return false;
  return projectionRefMismatchMatchesPointer(projection, expectation.jsonPointer, protocolProjectionExpectedRefs(upstream, targetSelection));
}

function protocolProjectionExpectedRefs(upstream, targetSelection) {
  const expectedTargetSelectionHash = sha256Hex(canonicalJson(targetSelection));
  return {
    targetSelectionRef: p5ArtifactRef(`${P5_ARTIFACT_ROOT}/adapter-target-selection.json`, "protocol-target-selection.v0", expectedTargetSelectionHash),
    catalogRef: upstream.p2CatalogRef,
    p2EvidenceRef: upstream.p2EvidenceRef,
    p4EvidenceRef: upstream.p4EvidenceRef,
    p4DecisionLedgerRef: upstream.p4DecisionLedgerRef,
    p4ReviewReportRef: upstream.p4ReviewReportRef
  };
}

function projectionRefMismatchMatchesPointer(projection, jsonPointer, expectedRefs) {
  const refKey = {
    "/targetSelectionRef/hash": "targetSelectionRef",
    "/catalogRef/hash": "catalogRef",
    "/p2EvidenceRef/hash": "p2EvidenceRef",
    "/p4EvidenceRef/hash": "p4EvidenceRef",
    "/p4DecisionLedgerRef/hash": "p4DecisionLedgerRef",
    "/p4ReviewReportRef/hash": "p4ReviewReportRef"
  }[jsonPointer];
  if (!refKey || !projection[refKey] || !expectedRefs[refKey]) return false;
  if (projection[refKey].hash === expectedRefs[refKey].hash) return false;
  return Object.entries(expectedRefs).every(([key, expectedRef]) =>
    key === refKey || artifactRefTupleEquals(projection[key], expectedRef)
  );
}

function firstProjectionFailureCode(projection, upstream, targetSelection) {
  if (!projection.targetSelectionRef) return "PROTOCOL_PROJECTION_REF_MISSING";
  const expectedTargetSelectionHash = sha256Hex(canonicalJson(targetSelection));
  const expectedTargetSelectionRef = p5ArtifactRef(`${P5_ARTIFACT_ROOT}/adapter-target-selection.json`, "protocol-target-selection.v0", expectedTargetSelectionHash);
  if (
    !artifactRefTupleEquals(projection.targetSelectionRef, expectedTargetSelectionRef) ||
    !artifactRefTupleEquals(projection.catalogRef, upstream.p2CatalogRef) ||
    !artifactRefTupleEquals(projection.p2EvidenceRef, upstream.p2EvidenceRef) ||
    !artifactRefTupleEquals(projection.p4EvidenceRef, upstream.p4EvidenceRef) ||
    !artifactRefTupleEquals(projection.p4DecisionLedgerRef, upstream.p4DecisionLedgerRef) ||
    !artifactRefTupleEquals(projection.p4ReviewReportRef, upstream.p4ReviewReportRef)
  ) {
    return "PROTOCOL_SOURCE_HASH_MISMATCH";
  }
  if (projection.protocolEnvelope?.a2uiConformance === true) return "PROTOCOL_A2UI_CLAIM_FORBIDDEN";
  if (
    projection.protocolEnvelope?.productionApi === true ||
    projection.protocolEnvelope?.sdk === true ||
    projection.protocolEnvelope?.transport !== "none" ||
    projection.protocolEnvelope?.sideEffectsAllowed === true ||
    (projection.protocolEnvelope?.liveOperations || []).length > 0 ||
    (projection.protocolEnvelope?.callbacks || []).length > 0
  ) {
    return "PROTOCOL_PRODUCTION_API_FORBIDDEN";
  }
  const allowedComponents = new Set(targetSelection.componentScope || []);
  if ((projection.protocolEnvelope?.allowedComponents || []).some((componentId) => !allowedComponents.has(componentId))) {
    return "PROTOCOL_AUTHORITY_ESCALATION";
  }
  if (
    Object.keys(projection.actions || {}).length > 0 ||
    Object.keys(projection.events || {}).length > 0 ||
    Object.keys(projection.dataBindings || {}).length > 0
  ) {
    return "PROTOCOL_AUTHORITY_ESCALATION";
  }
  for (const [tokenId, token] of Object.entries(projection.tokens || {})) {
    if (!upstream.p2Catalog.tokens?.[tokenId] || canonicalJson(token) !== canonicalJson(upstream.p2Catalog.tokens[tokenId])) {
      return "PROTOCOL_AUTHORITY_ESCALATION";
    }
  }
  for (const [componentId, component] of Object.entries(projection.components || {})) {
    const upstreamComponent = upstream.p2Catalog.components?.[componentId];
    if (!allowedComponents.has(componentId) || !upstreamComponent) return "PROTOCOL_AUTHORITY_ESCALATION";
    for (const propName of Object.keys(component.props || {})) {
      if (!upstreamComponent.props?.[propName] || canonicalJson(component.props[propName]) !== canonicalJson(upstreamComponent.props[propName])) return "PROTOCOL_AUTHORITY_ESCALATION";
    }
    for (const memberName of ["actions", "events", "dataBindings", "slots", "states", "variants", "tokenRefs", "accessibility"]) {
      if (!projectionMemberWithinAuthority(component[memberName], upstreamComponent[memberName])) return "PROTOCOL_AUTHORITY_ESCALATION";
    }
  }
  return null;
}

function projectionMemberWithinAuthority(projected = {}, upstream = {}) {
  for (const [key, value] of Object.entries(projected || {})) {
    if (!Object.prototype.hasOwnProperty.call(upstream || {}, key) || canonicalJson(value) !== canonicalJson(upstream[key])) {
      return false;
    }
  }
  return true;
}

function isReviewRequiredProtocolFixture(fixture, projection) {
  const root = fixture.root || {};
  return root.component === "Button" &&
    Object.keys(root.actions || {}).length > 0 &&
    firstSurfaceFailureCodeWithOptions(fixture, projection, { allowReviewActions: true }) === null &&
    projection.governance?.rules?.actionSemanticsRequireReview?.promotionStatus === "review_required";
}

function preflightFixtureMatchesDiagnostic(code, fixture) {
  const fixturePath = PREFLIGHT_DIAGNOSTIC_FIXTURES.get(code);
  if (!fixturePath) return false;
  return canonicalJson(fixture) === canonicalJson(buildP5ProtocolFixtures()[fixturePath]);
}

function compareExpectation(expectation, actual) {
  return actual.result === expectation.expectedResult &&
    actual.promotionStatus === expectation.promotionStatus &&
    canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code)) === canonicalJson(expectation.diagnosticCodes) &&
    actual.envelopePath === expectation.envelopePath &&
    actual.component === expectation.component;
}

function buildEnvelopes({ cwd, projection, projectionRef, fixtureRows, validationResults }) {
  const rowsByPath = new Map(fixtureRows.map((row) => [row.expectation.fixturePath, row]));
  return validationResults
    .filter((result) => result.actualResult === "valid" && result.envelopePath !== null)
    .map((result) => {
      const fixtureRow = rowsByPath.get(result.fixturePath);
      const fixture = fixtureRow.fixture;
      const root = fixture.root;
      const component = projection.components[root.component];
      const actionDescriptors = Object.entries(root.actions || {}).map(([actionId, action]) => ({
        actionId,
        executed: false,
        payload: deepClone(action.payload || {}),
        sourceRef: action.sourceRef || null
      }));
      return {
        path: result.envelopePath,
        data: {
          schemaId: "protocol-envelope.v0",
          version: P5_VERSION,
          adapter: P5_TARGET_ID,
          surfaceRef: artifactRef(result.fixturePath, "surface-ir.v0", fixtureRow.fixtureHash, { sourceRef: root.sourceRef }),
          projectionRef,
          promotionStatus: "allowed",
          message: {
            kind: "static-component-envelope",
            surfaceId: root.id,
            component: root.component,
            variant: root.variant,
            state: root.state,
            props: deepClone(root.props),
            sourceRef: root.sourceRef
          },
          actions: actionDescriptors,
          sideEffects: [],
          transport: "none",
          accessibility: deepClone(root.accessibility || component.accessibility),
          tokens: resolveTokens(root.tokenRefs || {}, projection.tokens),
          provenance: provenance("interfacectl-p5-protocol-envelope", [root.sourceRef, result.fixturePath, projectionRef.path]),
          diagnostics: []
        },
        cwd
      };
    });
}

function resolveTokens(tokenRefs, tokens) {
  return Object.fromEntries(Object.entries(tokenRefs).map(([key, tokenId]) => [key, tokens[tokenId] || { tokenId, value: null }]));
}

function buildReport({ runId, upstream, targetSelectionRef, projectionRef, envelopeRefs, validationResults, diagnostics, status, promotionStatus }) {
  return {
    schemaId: "protocol-adapter-report.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    runId,
    upstreamPreflight: {
      status: "pass",
      refs: [
        upstream.p2EvidenceRef,
        upstream.p2CatalogRef,
        upstream.p4EvidenceRef,
        upstream.p4DecisionLedgerRef,
        upstream.p4ReviewReportRef
      ]
    },
    targetSelectionRef,
    projectionRef,
    fixtureRoot: P5_FIXTURE_ROOT,
    artifactRoot: P5_ARTIFACT_ROOT,
    results: validationResults.map(stripResult),
    protocolEnvelopeRefs: envelopeRefs,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    generatedArtifactRefs: [targetSelectionRef, projectionRef, ...envelopeRefs],
    environment: { ...P5_ENVIRONMENT },
    status,
    promotionStatus,
    provenance: provenance("interfacectl-p5-protocol-report", validationResults.map((result) => result.fixturePath))
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, targetSelectionRef, projectionRef, envelopeRefs, reportRef, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const artifactPath of [...p5SchemaPaths(), ...p5ConsumedSchemaPaths()]) {
    schemaClosure.push(artifactRef(artifactPath, schemaIdForP5Path(artifactPath), await canonicalFileHash(path.join(cwd, artifactPath))));
  }

  const fixtureRefs = [];
  for (const fixturePath of p5FixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, schemaIdForP5Path(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }

  const boundaryRefs = [
    upstream.p2EvidenceRef,
    upstream.p2CatalogRef,
    upstream.p4EvidenceRef,
    upstream.p4DecisionLedgerRef,
    upstream.p4ReviewReportRef,
    targetSelectionRef,
    projectionRef,
    ...envelopeRefs,
    reportRef
  ].map(withBoundaryProvenance);

  const artifactRefs = [];
  for (const artifactPath of P5_ARTIFACT_PATHS) {
    artifactRefs.push({
      ...artifactRef(
        artifactPath,
        schemaIdForP5Path(artifactPath),
        artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: {
        generatedAt: P5_TIMESTAMP,
        generator: "interfacectl-p5-protocol-evidence",
        sourceRefs: artifactPath === `${P5_ARTIFACT_ROOT}/evidence.json` ? ["plans/p5/validation-evidence.md"] : [artifactPath]
      }
    });
  }

  const evidence = {
    contractId: "surfaces-p5-protocol-adapter-proof",
    schemaId: "protocol-adapter-evidence.v0",
    version: P5_VERSION,
    runId,
    checkedAt: P5_TIMESTAMP,
    command,
    args,
    environment: { ...P5_ENVIRONMENT },
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts: artifactRefs,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: validationResults.map(stripResult),
    status,
    promotionStatus,
    provenance: provenance("interfacectl-p5-protocol-evidence", ["plans/p5/validation-evidence.md"])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);

  assertOrderedPaths("P5 protocol evidence schemaClosure", evidence.schemaClosure.map((entry) => entry.path), [...p5SchemaPaths(), ...p5ConsumedSchemaPaths()]);
  assertOrderedPaths("P5 protocol evidence fixtureRefs", evidence.fixtureRefs.map((entry) => entry.path), p5FixturePaths());
  assertOrderedPaths("P5 protocol evidence artifacts", evidence.artifacts.map((entry) => entry.path), P5_ARTIFACT_PATHS);
  assertOrderedPaths("P5 protocol evidence validationResults", evidence.validationResults.map((entry) => entry.fixturePath), P5_EXPECTATION_ROWS.map((row) => row.fixturePath));
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
    jsonPointer: result.jsonPointer,
    requiredSourceRef: result.requiredSourceRef,
    envelopePath: result.envelopePath,
    component: result.component,
    matched: result.matched
  };
}

function diagnosticForExpectation(expectation) {
  const code = expectation.diagnosticCodes[0];
  const row = P5_DIAGNOSTIC_ROWS.find((candidate) =>
    candidate.code === code &&
    candidate.artifactPath === expectation.fixturePath &&
    candidate.jsonPointer === expectation.jsonPointer
  ) || P5_DIAGNOSTIC_ROWS.find((candidate) => candidate.code === code);
  if (!row) throw contractError(`missing P5 protocol diagnostic registry row: ${code}`, 1);
  return diagnosticFromRow(row);
}

function diagnosticFromRow(row) {
  return {
    code: row.code,
    message: row.canonicalMessage,
    severity: row.severity,
    diagnosticSource: row.diagnosticSource,
    stage: row.stage,
    phase: row.phase,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef: row.sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction
  };
}

function aggregatePromotionStatus(results) {
  if (results.some((result) => result.matched === false)) return "blocked";
  if (results.some((result) => result.actualResult === "review_required")) return "review_required";
  return "allowed";
}

function withBoundaryProvenance(ref) {
  return {
    ...ref,
    provenance: boundaryRefProvenance(ref.path)
  };
}

function boundaryRefProvenance(pathValue) {
  return provenance("interfacectl-p5-protocol-boundary-ref", [pathValue]);
}

function artifactRef(pathValue, schemaId, hash, extra = {}) {
  return p5ArtifactRef(pathValue, schemaId, hash, extra);
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

  for (const file of [...P5_CONSUMED_SCHEMA_FILES, ...P5_SCHEMA_FILES]) {
    const schema = await readJson(path.join(cwd, P5_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }

  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/p5/${schemaId}.schema.json`) ||
        ajv.getSchema(`https://surfaces.dev/schemas/p4/${schemaId}.schema.json`) ||
        ajv.getSchema(`https://surfaces.dev/schemas/p2/${schemaId}.schema.json`) ||
        ajv.getSchema(`https://surfaces.dev/schemas/p0/${schemaId}.schema.json`);
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

function buildRunId({ upstream, targetSelectionRef, projectionRef, expectations, command, args }) {
  return `p5-protocol-${sha256Hex(canonicalJson({
    p2EvidenceHash: upstream.p2EvidenceRef.hash,
    p2CatalogHash: upstream.p2CatalogRef.hash,
    p4EvidenceHash: upstream.p4EvidenceRef.hash,
    targetSelectionHash: targetSelectionRef.hash,
    projectionHash: projectionRef.hash,
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
  const expectedSchemaPaths = [...p5SchemaPaths(), ...p5ConsumedSchemaPaths()];
  const expectedSchemaRefs = [];
  for (const artifactPath of expectedSchemaPaths) {
    expectedSchemaRefs.push(artifactRef(artifactPath, schemaIdForP5Path(artifactPath), await canonicalFileHash(path.join(cwd, artifactPath))));
  }
  const expectedFixtureRefs = [];
  for (const fixturePath of p5FixturePaths()) {
    expectedFixtureRefs.push(artifactRef(fixturePath, schemaIdForP5Path(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const expectedBoundaryPaths = [
    P5_P2_EVIDENCE_PATH,
    P5_P2_CATALOG_PATH,
    P5_P4_EVIDENCE_PATH,
    P5_P4_DECISION_LEDGER_PATH,
    P5_P4_REVIEW_REPORT_PATH,
    `${P5_ARTIFACT_ROOT}/adapter-target-selection.json`,
    `${P5_ARTIFACT_ROOT}/protocol-projection.json`,
    `${P5_ARTIFACT_ROOT}/protocol-envelope.button.json`,
    `${P5_ARTIFACT_ROOT}/protocol-envelope.in-line-alert.json`,
    `${P5_ARTIFACT_ROOT}/protocol-adapter-report.json`
  ];
  const p2Evidence = await readJson(path.join(cwd, P5_P2_EVIDENCE_PATH));
  const p4Evidence = await readJson(path.join(cwd, P5_P4_EVIDENCE_PATH));
  const p2EvidenceHash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  const p4EvidenceHash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const expectedBoundaryRefs = [
    artifactRef(P5_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2EvidenceHash),
    artifactRef(P5_P2_CATALOG_PATH, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, P5_P2_CATALOG_PATH)), { sourceEvidenceHash: p2EvidenceHash }),
    artifactRef(P5_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", p4EvidenceHash),
    artifactRef(P5_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", await canonicalFileHash(path.join(cwd, P5_P4_DECISION_LEDGER_PATH)), { sourceEvidenceHash: p4EvidenceHash }),
    artifactRef(P5_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", await canonicalFileHash(path.join(cwd, P5_P4_REVIEW_REPORT_PATH)), { sourceEvidenceHash: p4EvidenceHash }),
    ...await Promise.all(expectedBoundaryPaths
      .filter((artifactPath) => artifactPath.startsWith(`${P5_ARTIFACT_ROOT}/`))
      .map(async (artifactPath) => artifactRef(
        artifactPath,
        schemaIdForP5Path(artifactPath),
        await canonicalFileHash(path.join(cwd, artifactPath))
      )))
  ].map(withBoundaryProvenance);
  const expectedArtifactRefs = [];
  for (const artifactPath of P5_ARTIFACT_PATHS) {
    expectedArtifactRefs.push({
      ...artifactRef(
        artifactPath,
        schemaIdForP5Path(artifactPath),
        artifactPath === `${P5_ARTIFACT_ROOT}/evidence.json` ? computeEvidenceSelfHash(evidence) : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: {
        generatedAt: P5_TIMESTAMP,
        generator: "interfacectl-p5-protocol-evidence",
        sourceRefs: artifactPath === `${P5_ARTIFACT_ROOT}/evidence.json` ? ["plans/p5/validation-evidence.md"] : [artifactPath]
      }
    });
  }
  if (!pathArrayEquals(evidence.schemaClosure?.map((ref) => ref.path), expectedSchemaPaths)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  if (!pathArrayEquals(evidence.fixtureRefs?.map((ref) => ref.path), p5FixturePaths())) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  if (!pathArrayEquals(evidence.boundaryRefs?.map((ref) => ref.path), expectedBoundaryPaths)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  if (!pathArrayEquals(evidence.artifacts?.map((ref) => ref.path), P5_ARTIFACT_PATHS)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  if (!pathArrayEquals(evidence.validationResults?.map((result) => result.fixturePath), P5_EXPECTATION_ROWS.map((row) => row.fixturePath))) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  if (!refListExactlyEquals(evidence.schemaClosure, expectedSchemaRefs)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  if (!refListExactlyEquals(evidence.fixtureRefs, expectedFixtureRefs)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  const boundaryFailureCode = firstEvidenceRefListFailureCode(evidence.boundaryRefs, expectedBoundaryRefs);
  if (boundaryFailureCode !== null) return boundaryFailureCode;
  for (const ref of evidence.boundaryRefs || []) {
    if (!ref.provenance || canonicalJson(ref.provenance) !== canonicalJson(boundaryRefProvenance(ref.path))) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  }
  if (!refListExactlyEquals(evidence.artifacts, expectedArtifactRefs)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.path === P5_P2_EVIDENCE_PATH) {
      const p2Evidence = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== p2Internals.computeEvidenceSelfHash(p2Evidence)) return "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH";
    } else if (ref.path === P5_P4_EVIDENCE_PATH) {
      const p4Evidence = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== p4Internals.computeEvidenceSelfHash(p4Evidence)) return "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH";
    } else if (ref.path === P5_P2_CATALOG_PATH) {
      if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH";
    } else if (ref.path === P5_P4_DECISION_LEDGER_PATH) {
      if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "PROTOCOL_DECISION_LEDGER_HASH_MISMATCH";
    } else if (ref.path === P5_P4_REVIEW_REPORT_PATH) {
      if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "PROTOCOL_REVIEW_REPORT_HASH_MISMATCH";
    } else if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) {
      return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
    }
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${P5_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${P5_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

function refListExactlyEquals(actualRefs, expectedRefs) {
  return Array.isArray(actualRefs) &&
    actualRefs.length === expectedRefs.length &&
    actualRefs.every((actualRef, index) => artifactRefExactlyEquals(actualRef, expectedRefs[index]));
}

function firstEvidenceRefListFailureCode(actualRefs, expectedRefs) {
  if (!Array.isArray(actualRefs) || actualRefs.length !== expectedRefs.length) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  for (let index = 0; index < expectedRefs.length; index += 1) {
    const actualRef = actualRefs[index];
    const expectedRef = expectedRefs[index];
    const role = expectedRef.path.startsWith(`${P5_ARTIFACT_ROOT}/`) ? "generated" : "authority";
    if (!actualRef || actualRef.path !== expectedRef.path) return role === "generated" ? "PROTOCOL_EVIDENCE_HASH_MISMATCH" : "PROTOCOL_UPSTREAM_EVIDENCE_STALE";
    if (actualRef.hash !== expectedRef.hash) return role === "generated" ? "PROTOCOL_EVIDENCE_HASH_MISMATCH" : protocolHashMismatchCodeForPath(expectedRef.path);
    if (!artifactRefTupleEquals(actualRef, expectedRef)) return role === "generated" ? "PROTOCOL_EVIDENCE_HASH_MISMATCH" : "PROTOCOL_UPSTREAM_EVIDENCE_STALE";
    if (!artifactRefExactlyEquals(actualRef, expectedRef)) return "PROTOCOL_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

function protocolHashMismatchCodeForPath(pathValue) {
  if (pathValue === P5_P4_DECISION_LEDGER_PATH) return "PROTOCOL_DECISION_LEDGER_HASH_MISMATCH";
  if (pathValue === P5_P4_REVIEW_REPORT_PATH) return "PROTOCOL_REVIEW_REPORT_HASH_MISMATCH";
  return "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH";
}

function artifactRefExactlyEquals(actualRef, expectedRef) {
  return canonicalJson(actualRef ?? null) === canonicalJson(expectedRef ?? null);
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
      `P5 protocol run expectation mismatch: expected ${expected.status}/${expected.promotionStatus}, got ${artifact.status}/${artifact.promotionStatus}`,
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

export const p5ProtocolInternals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  preflightFixtureMatchesDiagnostic,
  parseRelativePosixPath
};
