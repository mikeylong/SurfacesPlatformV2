import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import {
  canonicalFileHash,
  deepClone,
  rawFileHash,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import { p2Internals } from "./p2-proof.js";
import * as capabilityContract from "./capability-index-contract.js";

const IMPLEMENTED_COUNT = 14;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const CI_TIMESTAMP = capabilityContract.CI_TIMESTAMP ?? capabilityContract.CAPABILITY_INDEX_TIMESTAMP;
const CI_VERSION = capabilityContract.CI_VERSION ?? capabilityContract.CAPABILITY_INDEX_VERSION;
const CI_SCHEMA_ROOT = capabilityContract.CI_SCHEMA_ROOT ?? capabilityContract.CAPABILITY_INDEX_SCHEMA_ROOT ?? "schemas";
const CI_FIXTURE_ROOT = capabilityContract.CI_FIXTURE_ROOT ?? capabilityContract.CAPABILITY_INDEX_FIXTURE_ROOT ?? "fixtures/capability-index";
const CI_ARTIFACT_ROOT = capabilityContract.CI_ARTIFACT_ROOT ?? capabilityContract.CAPABILITY_INDEX_ARTIFACT_ROOT ?? "artifacts/capability-index";
const CI_COMMAND = capabilityContract.CI_COMMAND ?? capabilityContract.CAPABILITY_INDEX_COMMAND ?? "interfacectl surfaces capabilities proof";
const CI_VERIFY_COMMAND = capabilityContract.CI_VERIFY_COMMAND ?? capabilityContract.CAPABILITY_INDEX_VERIFY_COMMAND ?? "interfacectl surfaces capabilities verify";
const CI_CONTRACT_ID = capabilityContract.CI_CONTRACT_ID ?? capabilityContract.CAPABILITY_INDEX_CONTRACT_ID ?? "surfaces-capability-index-proof";
const CI_TARGET_ID = capabilityContract.CI_TARGET_ID ?? capabilityContract.CAPABILITY_INDEX_TARGET_ID ?? "capability-index";
const CI_ENVIRONMENT = capabilityContract.CI_ENVIRONMENT ?? capabilityContract.CAPABILITY_INDEX_ENVIRONMENT ?? { generatedAt: CI_TIMESTAMP, host: null };

function declaredCapabilities() {
  return (capabilityContract.capabilityDeclarations ?? capabilityContract.implementedCapabilityDeclarations)();
}

function declaredPlannedCapabilities() {
  return (capabilityContract.plannedCapabilityGroups ?? (() => []))();
}

function schemaPaths() {
  return (capabilityContract.capabilitySchemaPaths ?? capabilityContract.capabilityIndexSchemaPaths)();
}

function fixturePaths() {
  return (capabilityContract.capabilityFixturePaths ?? capabilityContract.capabilityIndexFixturePaths)();
}

function artifactPaths() {
  return capabilityContract.CI_ARTIFACT_PATHS ?? capabilityContract.CAPABILITY_INDEX_ARTIFACT_PATHS ?? [
    `${CI_ARTIFACT_ROOT}/capability-index.json`,
    `${CI_ARTIFACT_ROOT}/capability-index-report.json`,
    `${CI_ARTIFACT_ROOT}/evidence.json`
  ];
}

function schemaIdForPath(artifactPath) {
  return (capabilityContract.schemaIdForCapabilityPath ?? capabilityContract.schemaIdForCapabilityIndexPath)(artifactPath);
}

function defaultVerifyArgs() {
  return (capabilityContract.defaultVerifyArgs ?? capabilityContract.defaultCapabilityIndexVerifyArgs)();
}

function diagnosticRows() {
  return capabilityContract.CI_DIAGNOSTIC_ROWS ?? capabilityContract.DIAGNOSTIC_ROWS ?? capabilityContract.diagnosticsRegistry();
}

function artifactRef(artifactPath, schemaId, hash) {
  return {
    path: artifactPath,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    provenance: provenance("interfacectl-capability-index-ref", [artifactPath])
  };
}

function provenance(_generator, sourceRefs) {
  return {
    method: "deterministic-materialization",
    sourceRefs: [...new Set(sourceRefs)].sort(),
    generatedAt: CI_TIMESTAMP,
    host: null
  };
}

export async function runCapabilityIndexInterfacectl(argv, io) {
  const subcommand = argv[0];
  if (subcommand === "proof") return runProofCommand(argv.slice(1), io);
  if (subcommand === "verify") return runVerifyCommand(argv.slice(1), io);
  io.stderr.write(`${capabilityUsage()}\n${verifyUsage()}\n`);
  return 2;
}

async function runProofCommand(argv, io) {
  const parsed = parseProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runCapabilityIndexProof({
      cwd: io.cwd,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: CI_COMMAND,
      args: { fixture: parsed.fixture, out: parsed.out }
    });
    io.stdout.write([
      `surfaces capabilities proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `implemented: ${result.implementedCount}/${IMPLEMENTED_COUNT} indexed`,
      `plannedGroups: ${result.plannedCount}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `artifacts: ${result.artifacts.join(", ")}`
    ].join("\n") + "\n");
    return result.status === "pass" ? 0 : 1;
  } catch (error) {
    if (error?.exitCode === 1 || error?.exitCode === 2) {
      io.stderr.write(`${error.message}\n`);
      return error.exitCode;
    }
    throw error;
  }
}

async function runVerifyCommand(argv, io) {
  const parsed = parseVerifyArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await verifyCapabilityIndex({
      cwd: io.cwd,
      indexPath: parsed.index,
      evidencePath: parsed.evidence
    });
    io.stdout.write(formatStatusTable(result));
    return 0;
  } catch (error) {
    if (error?.exitCode === 1 || error?.exitCode === 2) {
      io.stderr.write(`${error.message}\n`);
      return error.exitCode;
    }
    throw error;
  }
}

function parseProofArgs(argv) {
  const parsed = parseFlags(argv, new Map([
    ["--fixture", "fixture"],
    ["--out", "out"]
  ]));
  if (!parsed.ok) return parsed;
  if (!parsed.fixture || !parsed.out) return { ok: false, error: capabilityUsage() };
  if (parsed.fixture !== CI_FIXTURE_ROOT || parsed.out !== CI_ARTIFACT_ROOT) {
    return { ok: false, error: capabilityUsage() };
  }
  return parsed;
}

function parseVerifyArgs(argv) {
  const parsed = parseFlags(argv, new Map([
    ["--index", "index"],
    ["--evidence", "evidence"]
  ]));
  if (!parsed.ok) return parsed;
  if (!parsed.index || !parsed.evidence) return { ok: false, error: verifyUsage() };
  const expected = defaultVerifyArgs();
  if (parsed.index !== expected.index || parsed.evidence !== expected.evidence) {
    return { ok: false, error: verifyUsage() };
  }
  return parsed;
}

function parseFlags(argv, allowed) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const key = allowed.get(flag);
    if (!key || Object.hasOwn(result, key)) return { ok: false, error: `unexpected argument: ${flag}` };
    const value = argv[index + 1];
    if (typeof value !== "string" || value.startsWith("--")) return { ok: false, error: `missing value for ${flag}` };
    const relative = p2Internals.parseRelativePosixPath(value, flag);
    if (!relative.ok) return relative;
    result[key] = relative.path;
    index += 1;
  }
  return { ok: true, ...result };
}

function capabilityUsage() {
  return `usage: interfacectl surfaces capabilities proof --fixture ${CI_FIXTURE_ROOT} --out ${CI_ARTIFACT_ROOT}`;
}

function verifyUsage() {
  const args = defaultVerifyArgs();
  return `usage: interfacectl surfaces capabilities verify --index ${args.index} --evidence ${args.evidence}`;
}

export async function runCapabilityIndexProof({ cwd, fixtureRoot, outRoot, command, args }) {
  if (fixtureRoot !== CI_FIXTURE_ROOT || outRoot !== CI_ARTIFACT_ROOT) {
    throw contractError(capabilityUsage(), 2);
  }
  await assertRegularDirectory(cwd, CI_SCHEMA_ROOT, "capability schema root");
  await assertRegularDirectory(cwd, fixtureRoot, "capability fixture root");
  await assertCapabilityContractCompleteness(cwd);
  await assertSafeOutputRoot(cwd, outRoot);

  const validators = await loadValidators(cwd);
  const fixturePath = `${fixtureRoot}/capabilities.fixture.json`;
  const fixture = await readRegularJson(cwd, fixturePath, "CAPABILITY_TARGET_MISSING");
  validateBySchemaId(validators, fixture.schemaId, fixture, fixturePath, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");

  const declarations = implementedRows(fixture);
  const planned = plannedRows(fixture);
  assertDeclarationInventory(declarations, planned);
  const packageJson = await readRegularJson(cwd, "package.json", "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  assertProofRegistryCompleteness(declarations, packageJson);
  const derivedRows = [];
  for (const declaration of declarations) {
    derivedRows.push(await deriveImplementedRow({ cwd, declaration, validators, packageJson }));
  }
  assertDependencies(derivedRows);
  assertPlannedRows(planned);

  const expectations = await readRegularJson(cwd, `${fixtureRoot}/expectations.manifest.json`, "CAPABILITY_TARGET_MISSING");
  validateBySchemaId(validators, expectations.schemaId, expectations, `${fixtureRoot}/expectations.manifest.json`, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  const validationResults = await evaluateExpectations({ cwd, expectations, validators, declarations, planned });
  const mismatches = validationResults.filter((row) => !row.matched);
  if (mismatches.length > 0) {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", `validation expectation mismatch: ${mismatches.map((row) => row.fixturePath).join(", ")}`);
  }

  const diagnostics = sortDiagnostics(validationResults.flatMap((row) => row.diagnostics || [])).map(publicDiagnostic);
  const index = buildIndex({ fixture, implemented: derivedRows, planned });
  validateBySchemaId(validators, "capability-index.v0", index, `${outRoot}/capability-index.json`, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  await writeCanonicalJson(path.join(cwd, outRoot, "capability-index.json"), index);
  const indexRef = artifactRef(
    `${outRoot}/capability-index.json`,
    "capability-index.v0",
    await canonicalFileHash(path.join(cwd, outRoot, "capability-index.json"))
  );

  const runId = buildRunId({ indexRef, validationResults, command, args });
  const report = buildReport({ runId, indexRef, implemented: derivedRows, planned, validationResults, diagnostics });
  validateBySchemaId(validators, "capability-index-report.v0", report, `${outRoot}/capability-index-report.json`, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  await writeCanonicalJson(path.join(cwd, outRoot, "capability-index-report.json"), report);
  const reportRef = artifactRef(
    `${outRoot}/capability-index-report.json`,
    "capability-index-report.v0",
    await canonicalFileHash(path.join(cwd, outRoot, "capability-index-report.json"))
  );

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    implemented: derivedRows,
    indexRef,
    reportRef,
    validationResults,
    diagnostics
  });
  validateBySchemaId(validators, "capability-index-evidence.v0", evidence, `${outRoot}/evidence.json`, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  await verifyCapabilityIndex({
    cwd,
    indexPath: `${outRoot}/capability-index.json`,
    evidencePath: `${outRoot}/evidence.json`,
    validators
  });

  return {
    status: "pass",
    promotionStatus: "allowed",
    implementedCount: derivedRows.length,
    plannedCount: planned.length,
    matchedCount: validationResults.length,
    totalCount: validationResults.length,
    artifacts: artifactPaths()
  };
}

export async function verifyCapabilityIndex({ cwd, indexPath, evidencePath, validators = null }) {
  const expected = defaultVerifyArgs();
  if (indexPath !== expected.index || evidencePath !== expected.evidence) throw contractError(verifyUsage(), 2);
  await assertCapabilityContractCompleteness(cwd);
  const activeValidators = validators || await loadValidators(cwd);
  const index = await readRegularJson(cwd, indexPath, "CAPABILITY_TARGET_MISSING");
  const evidence = await readRegularJson(cwd, evidencePath, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  const rows = implementedRows(index);
  const planned = plannedRows(index);
  assertDeclarationInventory(rows, planned);
  assertDependencies(rows);
  assertPlannedRows(planned);
  for (const row of rows) {
    if (row.canAddAuthority !== false) throw diagnosticError("CAPABILITY_AUTHORITY_ESCALATION", capabilityId(row));
  }
  validateBySchemaId(activeValidators, "capability-index.v0", index, indexPath, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  validateBySchemaId(activeValidators, "capability-index-evidence.v0", evidence, evidencePath, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");

  if (evidence.status !== "pass" || evidence.promotionStatus !== "allowed") {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", "capability-index evidence is not pass/allowed");
  }
  const declarations = declaredCapabilities();
  const plannedDeclarations = declaredPlannedCapabilities();
  const packageJson = await readRegularJson(cwd, "package.json", "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  assertProofRegistryCompleteness(declarations, packageJson);
  const verifiedRows = [];
  for (let position = 0; position < rows.length; position += 1) {
    const row = rows[position];
    const declaration = declarations[position];
    if (capabilityId(row) !== capabilityId(declaration)) throw diagnosticError("CAPABILITY_TARGET_MISSING", capabilityId(declaration));
    const verified = await verifyImplementedRow({ cwd, row, declaration, validators: activeValidators, packageJson });
    verifiedRows.push(verified);
  }
  if (canonicalJson(planned) !== canonicalJson(plannedDeclarations)) {
    throw diagnosticError("CAPABILITY_PLANNED_CLAIM_ESCALATION", "planned capability groups differ from the declared registry");
  }
  const expectedIndex = buildIndex({ fixture: null, implemented: verifiedRows, planned: plannedDeclarations });
  if (canonicalJson(index) !== canonicalJson(expectedIndex)) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", indexPath);
  }
  await verifyGeneratedCapabilityArtifacts({
    cwd,
    validators: activeValidators,
    index,
    evidence,
    indexPath,
    evidencePath,
    implemented: verifiedRows,
    planned: plannedDeclarations
  });
  await verifyCapabilityEvidenceClosure({ cwd, evidence, evidencePath, indexPath });
  const ownIndexRef = findSingleRef(evidence, indexPath);
  if (!ownIndexRef || ownIndexRef.hash !== await canonicalFileHash(path.join(cwd, indexPath))) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", indexPath);
  }
  return { index, evidence, implemented: verifiedRows, planned };
}

async function verifyGeneratedCapabilityArtifacts({
  cwd,
  validators,
  index,
  evidence,
  indexPath,
  evidencePath,
  implemented,
  planned
}) {
  const expectationsPath = `${CI_FIXTURE_ROOT}/expectations.manifest.json`;
  const expectations = await readRegularJson(cwd, expectationsPath, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  validateBySchemaId(
    validators,
    expectations.schemaId,
    expectations,
    expectationsPath,
    "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH"
  );
  const validationResults = await evaluateExpectations({
    cwd,
    expectations,
    validators,
    declarations: declaredCapabilities(),
    planned
  });
  if (validationResults.some((row) => !row.matched)) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", "validation results drift");
  }
  const diagnostics = sortDiagnostics(validationResults.flatMap((row) => row.diagnostics || [])).map(publicDiagnostic);
  const indexRef = artifactRef(indexPath, "capability-index.v0", sha256Hex(canonicalJson(index)));
  const args = capabilityContract.defaultProofArgs();
  const runId = buildRunId({ indexRef, validationResults, command: CI_COMMAND, args });
  const expectedReport = buildReport({
    runId,
    indexRef,
    implemented,
    planned,
    validationResults,
    diagnostics
  });
  const reportPath = `${CI_ARTIFACT_ROOT}/capability-index-report.json`;
  const report = await readRegularJson(cwd, reportPath, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  validateBySchemaId(
    validators,
    "capability-index-report.v0",
    report,
    reportPath,
    "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH"
  );
  if (canonicalJson(report) !== canonicalJson(expectedReport)) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", reportPath);
  }
  const reportRef = artifactRef(reportPath, "capability-index-report.v0", sha256Hex(canonicalJson(report)));
  const expectedEvidence = await buildEvidence({
    cwd,
    runId,
    command: CI_COMMAND,
    args,
    implemented,
    indexRef,
    reportRef,
    validationResults,
    diagnostics
  });
  if (canonicalJson(evidence) !== canonicalJson(expectedEvidence)) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", evidencePath);
  }
}

async function deriveImplementedRow({ cwd, declaration, validators, packageJson }) {
  if (declaration.implementationStatus !== "implemented" || !declaration.evidencePath || !declaration.evidenceSchemaId) {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", capabilityId(declaration));
  }
  const evidence = await readRegularJson(cwd, declaration.evidencePath, "CAPABILITY_EVIDENCE_MISSING");
  validateBySchemaId(validators, declaration.evidenceSchemaId, evidence, declaration.evidencePath, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  if (
    evidence.status !== "pass" ||
    evidence.status !== declaration.expectedEvidenceStatus ||
    evidence.promotionStatus !== declaration.expectedPromotionStatus
  ) {
    throw diagnosticError("CAPABILITY_STATUS_MISMATCH", capabilityId(declaration));
  }
  await verifyEvidenceClosure({ cwd, evidence, evidencePath: declaration.evidencePath });
  assertProofScriptFidelity(declaration, evidence, packageJson);
  return deriveRow(declaration, evidence);
}

async function verifyImplementedRow({ cwd, row, declaration, validators, packageJson }) {
  if (row.implementationStatus !== "implemented") throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", capabilityId(row));
  if (
    row.proofCommand !== declaration.proofCommand ||
    row.packageProofScript !== declaration.packageProofScript ||
    row.ciGate !== declaration.ciGate ||
    row.evidenceSchemaId !== declaration.evidenceSchemaId
  ) {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", `${capabilityId(row)} proof shape`);
  }
  const expectedPath = declaration.evidencePath;
  if (!expectedPath || row.evidencePath !== expectedPath) {
    throw diagnosticError("CAPABILITY_AUTHORITY_ESCALATION", `${capabilityId(row)} evidence path`);
  }
  const targetEvidence = await readRegularJson(cwd, expectedPath, "CAPABILITY_EVIDENCE_MISSING");
  validateBySchemaId(validators, declaration.evidenceSchemaId, targetEvidence, expectedPath, "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  const evidenceHash = computeEvidenceSelfHash(targetEvidence, expectedPath);
  if (row.evidenceHash !== evidenceHash) throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", expectedPath);
  if (
    targetEvidence.status !== "pass" ||
    targetEvidence.status !== declaration.expectedEvidenceStatus ||
    targetEvidence.promotionStatus !== declaration.expectedPromotionStatus
  ) {
    throw diagnosticError("CAPABILITY_STATUS_MISMATCH", capabilityId(row));
  }
  const expectedRow = deriveRow(declaration, targetEvidence);
  if (row.evidenceStatus !== targetEvidence.status || row.promotionStatus !== targetEvidence.promotionStatus) {
    throw diagnosticError("CAPABILITY_STATUS_MISMATCH", capabilityId(row));
  }
  if (canonicalJson(row) !== canonicalJson(expectedRow)) {
    const code = authorityEscalated(row, declaration)
      ? "CAPABILITY_AUTHORITY_ESCALATION"
      : "CAPABILITY_STATUS_MISMATCH";
    throw diagnosticError(code, capabilityId(row));
  }
  await verifyEvidenceClosure({ cwd, evidence: targetEvidence, evidencePath: expectedPath });
  assertProofScriptFidelity(row, targetEvidence, packageJson);
  return row;
}

function deriveRow(declaration, evidence) {
  return {
    ...deepClone(declaration),
    evidenceStatus: evidence.status,
    promotionStatus: evidence.promotionStatus,
    evidenceHashAlgorithm: "sha256",
    evidenceHash: computeEvidenceSelfHash(evidence, declaration.evidencePath),
    evidenceRunId: evidence.runId
  };
}

function buildIndex({ fixture, implemented, planned }) {
  const allowed = implemented.filter((row) => row.promotionStatus === "allowed").length;
  const reviewRequired = implemented.filter((row) => row.promotionStatus === "review_required").length;
  const blocked = implemented.filter((row) => row.promotionStatus === "blocked").length;
  return {
    schemaId: "capability-index.v0",
    version: CI_VERSION,
    generatedAt: CI_TIMESTAMP,
    environment: { ...CI_ENVIRONMENT },
    targetId: CI_TARGET_ID,
    authority: {
      role: "derived-discovery-only",
      canAddAuthority: false,
      selfIndexed: false,
      targetEvidenceRemainsAuthority: true
    },
    implementedCapabilities: implemented,
    plannedCapabilities: deepClone(planned),
    summary: {
      implementedCount: implemented.length,
      passingCount: implemented.filter((row) => row.evidenceStatus === "pass").length,
      plannedCount: planned.length,
      allowedCount: allowed,
      reviewRequiredCount: reviewRequired,
      blockedCount: blocked
    },
    provenance: provenance("interfacectl-capability-index", [
      `${CI_FIXTURE_ROOT}/capabilities.fixture.json`,
      ...implemented.map((row) => row.evidencePath)
    ])
  };
}

function buildReport({ runId, indexRef, implemented, planned, validationResults, diagnostics }) {
  const summary = {
    implementedCount: implemented.length,
    passingCount: implemented.filter((row) => row.evidenceStatus === "pass").length,
    plannedCount: planned.length,
    allowedCount: implemented.filter((row) => row.promotionStatus === "allowed").length,
    reviewRequiredCount: implemented.filter((row) => row.promotionStatus === "review_required").length,
    blockedCount: implemented.filter((row) => row.promotionStatus === "blocked").length
  };
  return {
    schemaId: "capability-index-report.v0",
    version: CI_VERSION,
    runId,
    targetId: CI_TARGET_ID,
    scopeStatement: "Reports the current proof and governance status of the 14 declared implemented targets plus planned capability groups.",
    nonAuthorityStatement: "This report is a derived discovery consumer; each target evidence file remains proof authority.",
    indexRef,
    summary,
    implementedTargetResults: implemented.map((row) => ({
      capabilityId: row.capabilityId,
      evidenceStatus: row.evidenceStatus,
      promotionStatus: row.promotionStatus,
      evidencePath: row.evidencePath,
      evidenceHash: row.evidenceHash
    })),
    plannedCapabilityResults: planned.map((row) => ({
      capabilityId: row.capabilityId,
      implementationStatus: row.implementationStatus,
      evidenceStatus: row.evidenceStatus,
      promotionStatus: row.promotionStatus
    })),
    validationResults: validationResults.map(publicValidationResult),
    diagnostics,
    diagnosticsRegistry: capabilityContract.diagnosticsRegistry(),
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-capability-index-report", [indexRef.path])
  };
}

async function buildEvidence({ cwd, runId, command, args, implemented, indexRef, reportRef, validationResults, diagnostics }) {
  const schemaClosure = [];
  for (const schemaPath of schemaPaths()) {
    schemaClosure.push(artifactRef(
      schemaPath,
      schemaIdForPath(schemaPath),
      await canonicalFileHash(path.join(cwd, schemaPath))
    ));
  }
  const fixtureRefs = [];
  for (const fixturePath of fixturePaths()) {
    fixtureRefs.push(artifactRef(
      fixturePath,
      schemaIdForPath(fixturePath),
      await canonicalFileHash(path.join(cwd, fixturePath))
    ));
  }
  const boundaryRefs = implemented.map((row) => artifactRef(
    row.evidencePath,
    row.evidenceSchemaId,
    row.evidenceHash
  ));
  const evidencePath = `${CI_ARTIFACT_ROOT}/evidence.json`;
  const artifacts = [
    indexRef,
    reportRef,
    artifactRef(evidencePath, "capability-index-evidence.v0", null)
  ];
  const evidence = {
    contractId: CI_CONTRACT_ID,
    schemaId: "capability-index-evidence.v0",
    version: CI_VERSION,
    runId,
    checkedAt: CI_TIMESTAMP,
    command,
    args,
    environment: { ...CI_ENVIRONMENT },
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts,
    validationResults: validationResults.map(publicValidationResult),
    diagnostics,
    diagnosticsRegistry: capabilityContract.diagnosticsRegistry(),
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-capability-index-evidence", [
      ...schemaClosure.map((ref) => ref.path),
      ...fixtureRefs.map((ref) => ref.path),
      ...boundaryRefs.map((ref) => ref.path),
      indexRef.path,
      reportRef.path
    ])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence, evidencePath);
  return evidence;
}

async function evaluateExpectations({ cwd, expectations, validators, declarations, planned }) {
  const rows = [];
  for (const expectation of expectations.expectations || []) {
    const fixturePath = expectation.fixturePath;
    const fixture = await readRegularJson(cwd, fixturePath, "CAPABILITY_TARGET_MISSING");
    const actual = await evaluateFixture({ cwd, fixturePath, fixture, validators, declarations, planned });
    const expectedCodes = expectation.expectedDiagnosticCodes || expectation.diagnosticCodes || [];
    const expectedResult = expectation.expectedResult || expectation.expectedValidationResult;
    const expectedPromotion = expectation.expectedPromotionStatus || expectation.promotionStatus;
    rows.push({
      fixturePath,
      stage: expectation.stage,
      expectedResult,
      actualResult: actual.result,
      expectedPromotionStatus: expectedPromotion,
      actualPromotionStatus: actual.promotionStatus,
      expectedDiagnosticCodes: expectedCodes,
      actualDiagnosticCodes: actual.diagnostics.map((diagnostic) => diagnostic.code),
      diagnostics: actual.diagnostics,
      matched: expectedResult === actual.result &&
        expectedPromotion === actual.promotionStatus &&
        canonicalJson(expectedCodes) === canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code))
    });
  }
  return rows;
}

async function evaluateFixture({ cwd, fixturePath, fixture, validators, declarations, planned }) {
  const registryRow = diagnosticRows().find((row) => row.artifactPath === fixturePath);
  try {
    if (fixture.schemaId) validateBySchemaId(validators, fixture.schemaId, fixture, fixturePath, registryRow?.code || "CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
  } catch {
    if (registryRow) return fixtureDiagnostic(registryRow);
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", fixturePath);
  }
  if (fixture.schemaId === "capability-index-evidence.v0") {
    const finalRef = fixture.artifacts?.at(-1);
    if (!finalRef || finalRef.hash !== computeEvidenceSelfHash(fixture, fixturePath)) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH"));
    }
  }
  if (fixture.schemaId === "capability-index-preflight-mutation.v0" && fixture.mutation === "missing-evidence") {
    try {
      await assertRegularLocalFile(cwd, fixture.evidencePath);
    } catch {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_EVIDENCE_MISSING"));
    }
  }
  if (fixture.schemaId === "capability-index-preflight-mutation.v0" && fixture.mutation === "upstream-hash-mismatch") {
    const upstream = await readRegularJson(cwd, fixture.evidencePath, "CAPABILITY_EVIDENCE_MISSING");
    if (fixture.expectedHash !== computeEvidenceSelfHash(upstream, fixture.evidencePath)) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_EVIDENCE_HASH_MISMATCH"));
    }
  }
  const candidates = implementedRows(fixture);
  const plannedCandidates = plannedRows(fixture);
  const allImplemented = candidates.length > 0 ? candidates : (fixture.implementationStatus === "implemented" ? [fixture] : []);
  const allPlanned = plannedCandidates.length > 0 ? plannedCandidates : (fixture.implementationStatus === "planned" ? [fixture] : []);
  if (allImplemented.length > 0) {
    const actualIds = allImplemented.map(capabilityId);
    const expectedIds = declarations.map(capabilityId);
    if (canonicalJson(actualIds) !== canonicalJson(expectedIds)) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_TARGET_MISSING"));
    }
  }
  for (const row of allImplemented) {
    if (!row.evidencePath || !row.evidenceSchemaId || !row.proofCommand || !row.packageProofScript || !row.ciGate) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN"));
    }
    if (row.canAddAuthority !== false) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_AUTHORITY_ESCALATION"));
    }
    if (dependencyIds(row).some((dependency) => !declarations.some((declared) => capabilityId(declared) === dependencyId(dependency)))) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_DEPENDENCY_INVALID"));
    }
    const declared = declarations.find((candidate) => capabilityId(candidate) === capabilityId(row));
    if (
      declared &&
      (row.expectedEvidenceStatus !== declared.expectedEvidenceStatus ||
        row.expectedPromotionStatus !== declared.expectedPromotionStatus)
    ) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_STATUS_MISMATCH"));
    }
  }
  for (const row of allPlanned) {
    if (
      row.evidenceStatus !== "not_applicable" ||
      row.promotionStatus !== "not_applicable" ||
      row.proofCommand != null ||
      row.packageProofScript != null ||
      row.ciGate != null ||
      row.evidencePath != null
    ) {
      return fixtureDiagnostic(registryRow || diagnosticRegistryRow("CAPABILITY_PLANNED_CLAIM_ESCALATION"));
    }
  }
  const isReview = fixturePath.includes("/review/");
  if (isReview && !allImplemented.some((row) => row.expectedPromotionStatus === "blocked")) {
    return { result: "valid", promotionStatus: "allowed", diagnostics: [] };
  }
  return { result: isReview ? "review_required" : "valid", promotionStatus: isReview ? "review_required" : "allowed", diagnostics: [] };
}

function fixtureDiagnostic(row) {
  return {
    result: row.validationResult || "invalid",
    promotionStatus: row.promotionStatus || "blocked",
    diagnostics: [deepClone(row)]
  };
}

function diagnosticRegistryRow(code) {
  return diagnosticRows().find((row) => row.code === code) || {
    code,
    canonicalMessage: code,
    message: code,
    validationResult: "invalid",
    promotionStatus: "blocked"
  };
}

function publicValidationResult(row) {
  return {
    fixturePath: row.fixturePath,
    stage: row.stage,
    expectedResult: row.expectedResult,
    actualResult: row.actualResult,
    diagnosticCodes: row.actualDiagnosticCodes,
    promotionStatus: row.actualPromotionStatus
  };
}

function publicDiagnostic(row) {
  return {
    code: row.code,
    message: row.canonicalMessage || row.message,
    stage: row.stage,
    severity: row.severity,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef: row.sourceRef ?? null
  };
}

async function verifyCapabilityEvidenceClosure({ cwd, evidence, evidencePath, indexPath }) {
  const expectedSchemas = schemaPaths();
  const expectedFixtures = fixturePaths();
  const expectedBoundaries = declaredCapabilities().map((row) => row.evidencePath);
  const expectedArtifacts = artifactPaths();
  assertExactPaths("schema closure", evidence.schemaClosure, expectedSchemas, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  assertExactPaths("fixture closure", evidence.fixtureRefs, expectedFixtures, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  assertExactPaths("boundary closure", evidence.boundaryRefs, expectedBoundaries, "CAPABILITY_TARGET_MISSING");
  assertExactPaths("artifact closure", evidence.artifacts, expectedArtifacts, "CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  if (evidence.artifacts[0]?.path !== indexPath) throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", indexPath);
  try {
    await verifyEvidenceClosure({ cwd, evidence, evidencePath });
  } catch (error) {
    if (error?.exitCode === 1) {
      throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", evidencePath);
    }
    throw error;
  }
}

async function verifyEvidenceClosure({ cwd, evidence, evidencePath }) {
  const refs = collectHashRefs(evidence);
  const byPath = new Map();
  for (const entry of refs) {
    const ref = entry.ref;
    assertArtifactRef(ref, entry.group);
    const existing = byPath.get(ref.path);
    if (existing && existing.hash !== ref.hash) throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", ref.path);
    byPath.set(ref.path, ref);
  }
  const finalCollection = Array.isArray(evidence.artifactRefs) ? evidence.artifactRefs : evidence.artifacts;
  const finalRef = finalCollection?.[finalCollection.length - 1];
  if (!finalRef || finalRef.path !== evidencePath || finalRef.hash !== computeEvidenceSelfHash(evidence, evidencePath)) {
    throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", evidencePath);
  }
  for (const { ref, group } of refs) {
    try {
      await assertRegularLocalFile(cwd, ref.path);
    } catch (error) {
      if (error?.exitCode) throw error;
      throw diagnosticError("CAPABILITY_EVIDENCE_MISSING", ref.path);
    }
    let actualHash;
    if (ref.path === evidencePath) {
      actualHash = computeEvidenceSelfHash(evidence, evidencePath);
    } else if (["sourceFileRefs", "candidateSourceRefs", "compilerRefs", "runtimeRefs", "candidateAuthorityProfileRef"].includes(group)) {
      actualHash = await rawFileHash(path.join(cwd, ref.path));
    } else if (ref.path.endsWith("/evidence.json")) {
      const upstream = await readRegularJson(cwd, ref.path, "CAPABILITY_EVIDENCE_MISSING");
      actualHash = computeEvidenceSelfHash(upstream, ref.path);
    } else {
      try {
        actualHash = await canonicalFileHash(path.join(cwd, ref.path));
      } catch {
        throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", ref.path);
      }
    }
    if (actualHash !== ref.hash) throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", ref.path);
  }
  if (evidence.contractId === "surfaces-source-family-packaging-proof") {
    const { sourceFamilyPackagingInternals } = await import("./source-family-packaging-proof.js");
    if (await sourceFamilyPackagingInternals.firstEvidenceIntegrityFailureCode(cwd, evidence) !== null) {
      throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", evidencePath);
    }
  }
  if (evidence.contractId === "surfaces-source-family-layout-mapping-proof") {
    const { sourceFamilyLayoutMappingInternals } = await import("./source-family-layout-mapping-proof.js");
    if (await sourceFamilyLayoutMappingInternals.firstEvidenceIntegrityFailureCode(cwd, evidence) !== null) {
      throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", evidencePath);
    }
  }
  if (evidence.contractId === "surfaces-source-accessibility-policy-proof") {
    const { sourceAccessibilityPolicyInternals } = await import("./source-accessibility-policy-proof.js");
    if (await sourceAccessibilityPolicyInternals.firstEvidenceIntegrityFailureCode(cwd, evidence) !== null) {
      throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", evidencePath);
    }
  }
}

function collectHashRefs(evidence) {
  const refs = [];
  for (const group of [
    "artifacts",
    "artifactRefs",
    "boundaryRefs",
    "renderPlanRefs",
    "schemaClosure",
    "fixtureRefs",
    "sourceFileRefs",
    "candidateSourceRefs",
    "compilerRefs",
    "runtimeRefs",
    "compatibilityPreflightRefs"
  ]) {
    for (const ref of evidence[group] || []) refs.push({ group, ref });
  }
  for (const group of ["sourceManifestRef", "packageRef", "candidateManifestRef", "candidateAuthorityProfileRef", "runtimeAdapterReportRef", "runtimeProjectionRef"]) {
    if (evidence[group]) refs.push({ group, ref: evidence[group] });
  }
  return refs;
}

function computeEvidenceSelfHash(evidence, evidencePath) {
  const clone = deepClone(evidence);
  const refs = Array.isArray(clone.artifactRefs) ? clone.artifactRefs : clone.artifacts;
  if (!Array.isArray(refs) || refs.length === 0) throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", evidencePath);
  const finalRef = refs[refs.length - 1];
  if (finalRef.path !== evidencePath) throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", evidencePath);
  finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

function assertProofScriptFidelity(row, evidence, packageJson) {
  if (!row.proofCommand || evidence.command !== row.proofCommand) {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", `${capabilityId(row)} proof command`);
  }
  const proofScriptName = npmScriptName(row.packageProofScript);
  const ciScriptName = npmScriptName(row.ciGate);
  if (!proofScriptName || typeof packageJson.scripts?.[proofScriptName] !== "string") {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", `${capabilityId(row)} package proof script`);
  }
  if (!ciScriptName || typeof packageJson.scripts?.[ciScriptName] !== "string") {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", `${capabilityId(row)} CI gate`);
  }
  const proofInvocation = row.proofCommand.replace(/^interfacectl\s+/, "");
  if (!packageJson.scripts[proofScriptName].includes(proofInvocation)) {
    throw diagnosticError("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", `${capabilityId(row)} package proof command mismatch`);
  }
}

function assertProofRegistryCompleteness(rows, packageJson) {
  const declared = rows.map((row) => row.packageProofScript).sort();
  const registered = Object.keys(packageJson.scripts || {})
    .filter((name) => name.startsWith("proof:") && name !== "proof:capability-index" && !name.endsWith(":browser"))
    .sort();
  if (canonicalJson(registered) !== canonicalJson(declared)) {
    throw diagnosticError("CAPABILITY_TARGET_MISSING", "package proof registry differs from the capability declaration");
  }
}

function npmScriptName(command) {
  const match = /^npm run ([a-z0-9:-]+)$/.exec(command || "");
  if (match) return match[1];
  return /^[a-z0-9:-]+$/.test(command || "") ? command : null;
}

function assertDeclarationInventory(implemented, planned) {
  const expectedImplemented = declaredCapabilities();
  const expectedPlanned = declaredPlannedCapabilities();
  if (implemented.length !== IMPLEMENTED_COUNT || expectedImplemented.length !== IMPLEMENTED_COUNT) {
    throw diagnosticError("CAPABILITY_TARGET_MISSING", `expected ${IMPLEMENTED_COUNT} implemented capabilities`);
  }
  assertUniqueIds(implemented, "CAPABILITY_TARGET_MISSING");
  assertUniqueIds(planned, "CAPABILITY_PLANNED_CLAIM_ESCALATION");
  const actualIds = implemented.map(capabilityId);
  const expectedIds = expectedImplemented.map(capabilityId);
  if (canonicalJson(actualIds) !== canonicalJson(expectedIds)) throw diagnosticError("CAPABILITY_TARGET_MISSING", "implemented inventory order");
  if (planned.length !== expectedPlanned.length) throw diagnosticError("CAPABILITY_PLANNED_CLAIM_ESCALATION", "planned inventory count");
}

function assertUniqueIds(rows, code) {
  const ids = rows.map(capabilityId);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) throw diagnosticError(code, "duplicate or missing capability id");
}

function assertDependencies(rows) {
  const positions = new Map(rows.map((row, index) => [capabilityId(row), index]));
  for (let index = 0; index < rows.length; index += 1) {
    for (const dependency of dependencyIds(rows[index])) {
      const id = dependencyId(dependency);
      const dependencyPosition = positions.get(id);
      if (dependencyPosition === undefined || dependencyPosition >= index) {
        throw diagnosticError("CAPABILITY_DEPENDENCY_INVALID", `${capabilityId(rows[index])} -> ${id}`);
      }
    }
  }
}

function assertPlannedRows(rows) {
  for (const row of rows) {
    if (
      row.implementationStatus !== "planned" ||
      row.evidenceStatus !== "not_applicable" ||
      row.promotionStatus !== "not_applicable" ||
      row.proofCommand != null ||
      row.packageProofScript != null ||
      row.ciGate != null ||
      row.evidencePath != null ||
      dependencyIds(row).length !== 0
    ) {
      throw diagnosticError("CAPABILITY_PLANNED_CLAIM_ESCALATION", capabilityId(row));
    }
    if (row.canAddAuthority !== false) throw diagnosticError("CAPABILITY_AUTHORITY_ESCALATION", capabilityId(row));
  }
}

function authorityEscalated(actual, expected) {
  return actual.canAddAuthority !== false ||
    canonicalJson(actual.nonCapabilities || []) !== canonicalJson(expected.nonCapabilities || []) ||
    actual.scopeStatement !== expected.scopeStatement;
}

function implementedRows(value) {
  if (Array.isArray(value?.implementedCapabilities)) return value.implementedCapabilities;
  if (Array.isArray(value?.implementedTargets)) return value.implementedTargets;
  return [];
}

function plannedRows(value) {
  if (Array.isArray(value?.plannedCapabilities)) return value.plannedCapabilities;
  if (Array.isArray(value?.plannedCapabilityGroups)) return value.plannedCapabilityGroups;
  if (Array.isArray(value?.plannedGroups)) return value.plannedGroups;
  return [];
}

function capabilityId(row) {
  return row?.capabilityId || row?.targetId || row?.id || null;
}

function dependencyId(dependency) {
  return typeof dependency === "string" ? dependency : dependency?.capabilityId;
}

function dependencyIds(row) {
  const dependencies = row?.dependencies;
  if (Array.isArray(dependencies)) return dependencies;
  if (!dependencies || typeof dependencies !== "object") return [];
  return ["evidence", "phaseGate", "compatibility"].flatMap((category) => dependencies[category] || []);
}

function assertExactPaths(label, refs, expectedPaths, code) {
  const actualPaths = (refs || []).map((ref) => ref.path);
  if (canonicalJson(actualPaths) !== canonicalJson(expectedPaths)) throw diagnosticError(code, `${label} path drift`);
}

function findSingleRef(evidence, artifactPath) {
  const refs = collectHashRefs(evidence).map((entry) => entry.ref).filter((ref) => ref.path === artifactPath);
  const unique = [...new Map(refs.map((ref) => [canonicalJson({ path: ref.path, schemaId: ref.schemaId, hashAlgorithm: ref.hashAlgorithm, hash: ref.hash }), ref])).values()];
  return unique.length === 1 ? unique[0] : null;
}

function assertArtifactRef(ref, label) {
  if (!ref || typeof ref.path !== "string" || ref.hashAlgorithm !== "sha256" || !HASH_PATTERN.test(ref.hash || "")) {
    throw diagnosticError("CAPABILITY_EVIDENCE_HASH_MISMATCH", `${label} artifact ref`);
  }
  const parsed = p2Internals.parseRelativePosixPath(ref.path, `${label}.path`);
  if (!parsed.ok || parsed.path !== ref.path) throw diagnosticError("CAPABILITY_AUTHORITY_ESCALATION", ref.path);
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true, logger: false });
  const bySchemaId = new Map();
  const entries = await fs.readdir(path.join(cwd, CI_SCHEMA_ROOT), { withFileTypes: true });
  const schemas = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile() || !entry.name.endsWith(".schema.json")) continue;
    const schema = await readJson(path.join(cwd, CI_SCHEMA_ROOT, entry.name));
    schemas.push(schema);
    const schemaId = schema.schemaId || entry.name.replace(/\.schema\.json$/, "");
    bySchemaId.set(schemaId, schema);
  }
  for (const schema of schemas) ajv.addSchema(schema);
  return { ajv, bySchemaId };
}

function validateBySchemaId(validators, schemaId, value, label, code) {
  const schema = validators.bySchemaId.get(schemaId);
  if (!schema) throw diagnosticError(code, `${label}: missing schema ${schemaId}`);
  const valid = validators.ajv.validate(schema.$id, value);
  if (!valid) {
    const detail = validators.ajv.errorsText(validators.ajv.errors, { separator: "; " });
    throw diagnosticError(code, `${label}: ${detail}`);
  }
}

async function readRegularJson(cwd, relativePath, code) {
  try {
    await assertRegularLocalFile(cwd, relativePath);
    return await readJson(path.join(cwd, relativePath));
  } catch (error) {
    if (error?.exitCode) throw error;
    throw diagnosticError(code, relativePath);
  }
}

async function assertRegularLocalFile(cwd, relativePath) {
  const parsed = p2Internals.parseRelativePosixPath(relativePath, "artifact path");
  if (!parsed.ok || parsed.path !== relativePath) throw diagnosticError("CAPABILITY_AUTHORITY_ESCALATION", relativePath);
  let current = cwd;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink()) throw diagnosticError("CAPABILITY_AUTHORITY_ESCALATION", relativePath);
  }
  const stat = await fs.lstat(current);
  if (!stat.isFile()) throw diagnosticError("CAPABILITY_EVIDENCE_MISSING", relativePath);
}

async function assertRegularDirectory(cwd, relativePath, label) {
  try {
    const stat = await fs.lstat(path.join(cwd, relativePath));
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("not directory");
  } catch {
    throw diagnosticError("CAPABILITY_TARGET_MISSING", label);
  }
}

async function assertCapabilityContractCompleteness(cwd) {
  const expectedSchemas = schemaPaths().map((entry) => path.posix.basename(entry)).sort();
  const schemaEntries = await fs.readdir(path.join(cwd, CI_SCHEMA_ROOT), { withFileTypes: true });
  const actualSchemas = schemaEntries
    .filter((entry) => entry.name === "capability-declaration.v0.schema.json" || entry.name.startsWith("capability-index"))
    .map((entry) => {
      if (!entry.isFile() || entry.isSymbolicLink()) {
        throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", `${CI_SCHEMA_ROOT}/${entry.name}`);
      }
      return entry.name;
    })
    .sort();
  if (canonicalJson(actualSchemas) !== canonicalJson(expectedSchemas)) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", "capability schema closure is incomplete or stale");
  }

  const actualFixtures = await listRegularFiles(cwd, CI_FIXTURE_ROOT);
  const expectedFixtures = fixturePaths().sort();
  if (canonicalJson(actualFixtures) !== canonicalJson(expectedFixtures)) {
    throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", "capability fixture closure is incomplete or stale");
  }
}

async function listRegularFiles(cwd, relativeRoot) {
  const files = [];
  async function walk(relativeDirectory) {
    const absoluteDirectory = path.join(cwd, relativeDirectory);
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const relativePath = `${relativeDirectory}/${entry.name}`;
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (stat.isSymbolicLink()) {
        throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", relativePath);
      }
      if (stat.isDirectory()) await walk(relativePath);
      else if (stat.isFile()) files.push(relativePath);
      else throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", relativePath);
    }
  }
  await walk(relativeRoot);
  return files.sort();
}

async function assertSafeOutputRoot(cwd, outRoot) {
  const parsed = p2Internals.parseRelativePosixPath(outRoot, "--out");
  if (!parsed.ok || parsed.path !== outRoot || outRoot !== CI_ARTIFACT_ROOT) throw contractError(capabilityUsage(), 2);
  const parent = path.dirname(path.join(cwd, outRoot));
  const parentStat = await fs.lstat(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()) throw contractError(capabilityUsage(), 2);
  try {
    const stat = await fs.lstat(path.join(cwd, outRoot));
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError(capabilityUsage(), 2);
    const expected = new Set(artifactPaths().map((artifactPath) => path.posix.basename(artifactPath)));
    const entries = await fs.readdir(path.join(cwd, outRoot), { withFileTypes: true });
    const stale = entries.filter((entry) => !entry.isFile() || !expected.has(entry.name));
    if (stale.length > 0) {
      throw diagnosticError("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", `stale output: ${stale.map((entry) => entry.name).sort().join(", ")}`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function buildRunId({ indexRef, validationResults, command, args }) {
  return `capability-index-${sha256Hex(canonicalJson({
    indexHash: indexRef.hash,
    validationResults: validationResults.map(publicValidationResult),
    command,
    args
  })).slice(0, 32)}`;
}

function formatStatusTable(result) {
  const rows = result.implemented;
  const idWidth = Math.max("capability".length, ...rows.map((row) => capabilityId(row).length));
  const statusWidth = Math.max("status".length, ...rows.map((row) => row.evidenceStatus.length));
  const promotionWidth = Math.max("promotion".length, ...rows.map((row) => row.promotionStatus.length));
  const lines = [
    `${"capability".padEnd(idWidth)}  ${"status".padEnd(statusWidth)}  ${"promotion".padEnd(promotionWidth)}  evidence`,
    ...rows.map((row) => `${capabilityId(row).padEnd(idWidth)}  ${row.evidenceStatus.padEnd(statusWidth)}  ${row.promotionStatus.padEnd(promotionWidth)}  ${row.evidencePath}`),
    `implemented: ${rows.length}/${IMPLEMENTED_COUNT} verified`,
    `planned: ${result.planned.length} (${result.planned.map(capabilityId).join(", ")})`
  ];
  return `${lines.join("\n")}\n`;
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((left, right) => {
    return String(left.artifactPath || "").localeCompare(String(right.artifactPath || "")) ||
      String(left.code || "").localeCompare(String(right.code || ""));
  });
}

function diagnosticError(code, detail = "") {
  const row = diagnosticRegistryRow(code);
  const canonicalMessage = row.canonicalMessage || row.message || code;
  return contractError(`${code}: ${canonicalMessage}${detail ? ` (${detail})` : ""}`, 1);
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const capabilityIndexInternals = {
  collectHashRefs,
  computeEvidenceSelfHash,
  formatStatusTable,
  parseProofArgs,
  parseVerifyArgs,
  verifyEvidenceClosure
};
