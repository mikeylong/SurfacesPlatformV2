import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
import {
  canonicalFileHash,
  deepClone,
  rawFileHash,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  SC_ARTIFACT_ROOT,
  SC_FIXTURE_ROOT,
  SC_SOURCE_FILES,
  SC_SOURCE_ROOT
} from "./source-conformance-contract.js";
import { sourceConformanceInternals } from "./source-conformance-proof.js";
import { sfpReferencedReviewRoutes } from "./source-family-packaging-contract.js";
import { sourceFamilyPackagingInternals } from "./source-family-packaging-proof.js";
import {
  SFLM_ARTIFACT_ROOT,
  SFLM_CAPTURED_ARTIFACTS,
  SFLM_IMMUTABLE_CATALOG_FIELDS,
  SFLM_PHYSICAL_SOURCE_ROOT
} from "./source-family-layout-mapping-contract.js";
import { sourceFamilyLayoutMappingInternals } from "./source-family-layout-mapping-proof.js";
import {
  SFNM_ALTERNATE_NAMESPACE,
  SFNM_ARTIFACT_PATHS,
  SFNM_ARTIFACT_ROOT,
  SFNM_CANONICAL_NAMESPACE,
  SFNM_CAPTURED_ARTIFACTS,
  SFNM_COMMAND,
  SFNM_COMPILER_IMPLEMENTATION_PATHS,
  SFNM_CONTRACT_ID,
  SFNM_ENVIRONMENT,
  SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT,
  SFNM_EXPECTED_SUBSTITUTION_COUNT,
  SFNM_EXPECTATION_ROWS,
  SFNM_FIXTURE_ROOT,
  SFNM_LAYOUT_EVIDENCE_PATH,
  SFNM_MAPPING_PATH,
  SFNM_NAMESPACE_PACKAGE_PATH,
  SFNM_P2_CATALOG_PATH,
  SFNM_P2_EVIDENCE_PATH,
  SFNM_PROOF_IMPLEMENTATION_PATHS,
  SFNM_RUNTIME_DEPENDENCY_PATHS,
  SFNM_SCHEMA_FILES,
  SFNM_SCHEMA_ROOT,
  SFNM_SOURCE_ENTRIES,
  SFNM_SOURCE_ROOT,
  SFNM_TIMESTAMP,
  SFNM_VERSION,
  artifactRef,
  assertNamespaceMapping,
  assertNamespacePackage,
  buildSourceFamilyNamespaceMappingFixtures,
  defaultNamespaceMappingArgs,
  diagnosticsRegistry,
  normalizeNamespacedBundle,
  provenance,
  sfnmArtifactOrder,
  sfnmFixturePaths,
  sfnmNormalizedEvidenceRemap,
  sfnmSchemaIdForPath,
  sfnmSchemaPaths,
  sfnmSourcePaths,
  verifyImmutableNamespaceInputs
} from "./source-family-namespace-mapping-contract.js";

const execFileAsync = promisify(execFile);
const LOGICAL_PATHS = ["manifest.json", ...SC_SOURCE_FILES];
const LAYOUT_REPORT_PATH = `${SFLM_ARTIFACT_ROOT}/source-family-layout-mapping-report.json`;
const BOUNDARY_PATHS = [SFNM_P2_EVIDENCE_PATH, SFNM_P2_CATALOG_PATH, SFNM_LAYOUT_EVIDENCE_PATH];

export async function runSourceFamilyNamespaceMappingInterfacectl(argv, io) {
  const parsed = parseSourceFamilyNamespaceMappingArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSourceFamilyNamespaceMappingProof({
      cwd: io.cwd,
      sourceRoot: parsed.source,
      mappingPath: parsed.mapping,
      namespacePackagePath: parsed.namespacePackage,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      sourceFamilyLayoutMappingEvidencePath: parsed.sourceFamilyLayoutMappingEvidence,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: SFNM_COMMAND,
      args: {
        source: parsed.source,
        mapping: parsed.mapping,
        namespacePackage: parsed.namespacePackage,
        ingestionEvidence: parsed.ingestionEvidence,
        catalog: parsed.catalog,
        sourceFamilyLayoutMappingEvidence: parsed.sourceFamilyLayoutMappingEvidence,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces source-family-namespace-mapping proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `substitutions: ${result.substitutionCount}`,
      `manifestHashRefreshes: ${result.manifestHashRefreshCount}`,
      `innerArtifacts: ${result.innerArtifacts}`,
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

function parseSourceFamilyNamespaceMappingArgs(argv) {
  const result = {};
  const seen = new Set();
  const flags = new Map([
    ["--source", "source"],
    ["--mapping", "mapping"],
    ["--namespace-package", "namespacePackage"],
    ["--ingestion-evidence", "ingestionEvidence"],
    ["--catalog", "catalog"],
    ["--source-family-layout-mapping-evidence", "sourceFamilyLayoutMappingEvidence"],
    ["--fixture", "fixture"],
    ["--out", "out"]
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const key = flags.get(flag);
    if (!key) return { ok: false, error: `unexpected argument: ${flag}` };
    if (seen.has(flag)) return { ok: false, error: `duplicate argument: ${flag}` };
    seen.add(flag);
    if (index + 1 >= argv.length) return { ok: false, error: `missing value for ${flag}` };
    const rawValue = argv[index + 1];
    const parsed = p2Internals.parseRelativePosixPath(rawValue, flag);
    if (!parsed.ok) return parsed;
    if (parsed.path !== rawValue) return { ok: false, error: `${flag} must be a normalized POSIX-style relative path` };
    if (rawValue.split("/").some((segment) => segment.startsWith("."))) {
      return { ok: false, error: `${flag} must not contain hidden path segments` };
    }
    result[key] = parsed.path;
    index += 1;
  }
  if ([...flags.values()].some((key) => !result[key])) return { ok: false, error: usage() };
  return { ok: true, ...result };
}

function usage() {
  const args = defaultNamespaceMappingArgs();
  return `usage: ${SFNM_COMMAND} --source ${args.source} --mapping ${args.mapping} --namespace-package ${args.namespacePackage} --ingestion-evidence ${args.ingestionEvidence} --catalog ${args.catalog} --source-family-layout-mapping-evidence ${args.sourceFamilyLayoutMappingEvidence} --fixture ${args.fixture} --out ${args.out}`;
}

export async function runSourceFamilyNamespaceMappingProof({
  cwd,
  sourceRoot,
  mappingPath,
  namespacePackagePath,
  ingestionEvidencePath,
  catalogPath,
  sourceFamilyLayoutMappingEvidencePath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({
    sourceRoot,
    mappingPath,
    namespacePackagePath,
    ingestionEvidencePath,
    catalogPath,
    sourceFamilyLayoutMappingEvidencePath,
    fixtureRoot,
    outRoot
  });
  await assertSafeCommandInputs(cwd, [
    sourceRoot,
    mappingPath,
    namespacePackagePath,
    ingestionEvidencePath,
    catalogPath,
    sourceFamilyLayoutMappingEvidencePath,
    fixtureRoot
  ], outRoot);
  await assertFixedInputClosures(cwd);

  const validators = await loadValidators(cwd);
  const immutable = await verifyImmutableNamespaceInputs(cwd);
  const { mapping, namespacePackage, normalization } = immutable;
  assertSchema(validators, "source-family-namespace-mapping.v0", mapping, mappingPath);
  assertSchema(validators, "source-family-namespace-package.v0", namespacePackage, namespacePackagePath);
  assertNormalizationCounts(normalization, namespacePackage);

  const { expectations, fixtures } = await loadFixtureContract({
    cwd,
    fixtureRoot,
    validators,
    namespacePackage
  });

  const p2Evidence = await readJson(path.join(cwd, ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, catalogPath));
  const layoutEvidence = await readJson(path.join(cwd, sourceFamilyLayoutMappingEvidencePath));
  const layoutReport = await readJson(path.join(cwd, LAYOUT_REPORT_PATH));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, ingestionEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, catalogPath);
  assertSchema(validators, "source-family-layout-mapping-evidence.v0", layoutEvidence, sourceFamilyLayoutMappingEvidencePath);
  assertSchema(validators, "source-family-layout-mapping-report.v0", layoutReport, LAYOUT_REPORT_PATH);
  await assertUpstreamIntegrity({ cwd, p2Evidence, p2Catalog, layoutEvidence, layoutReport });
  assertCompilerRuntime(namespacePackage, Number(process.versions.node.split(".")[0]));
  const compilerRefs = await buildCheckedRefs(cwd, namespacePackage.compiler.implementationRefs, "javascript-source", "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH");
  const runtimeRefs = await buildCheckedRefs(cwd, namespacePackage.compiler.runtime.dependencyRefs, "node-package-input", "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH");
  const proofImplementationRefs = await buildCurrentRefs(cwd, SFNM_PROOF_IMPLEMENTATION_PATHS, "proof-implementation", "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH");

  const mappingRef = artifactRef(mappingPath, "source-family-namespace-mapping.v0", await rawFileHash(path.join(cwd, mappingPath)));
  const namespacePackageRef = artifactRef(namespacePackagePath, "source-family-namespace-package.v0", await rawFileHash(path.join(cwd, namespacePackagePath)));
  const normalizedRun = await runNormalizedCompilerBundle({ cwd, normalization, validators, mappingRef });
  const baselineComparison = await compareNormalizedRun({ cwd, normalizedRun, layoutReport, p2Catalog, normalization });

  await prepareOutputRoot(cwd, outRoot);
  const receipt = buildNamespaceReceipt({ namespacePackageRef, mappingRef, mapping, normalization });
  const receiptPath = `${outRoot}/namespace-mapping-receipt.json`;
  assertSchema(validators, "source-family-namespace-mapping-receipt.v0", receipt, receiptPath);
  await writeCanonicalJson(path.join(cwd, receiptPath), receipt);
  for (const [normalizedFile, , innerFile] of SFNM_CAPTURED_ARTIFACTS) {
    await writeCanonicalJson(path.join(cwd, outRoot, normalizedFile), normalizedRun.artifacts.get(innerFile));
  }
  const normalizedEvidenceRemap = sfnmNormalizedEvidenceRemap(mappingRef);
  const persistedInnerCode = await firstPersistedNormalizedEvidenceIntegrityFailureCode(cwd, normalizedEvidenceRemap, normalization, validators);
  if (persistedInnerCode !== null) {
    throw contractError(`SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID: persisted normalized compiler closure failed integrity: ${persistedInnerCode}`, 1);
  }

  const authorityExpansionProbe = await runAuthorityExpansionProbe({
    cwd,
    normalization,
    baselineArtifactHashes: await artifactHashSnapshot(cwd, SFNM_CAPTURED_ARTIFACTS.map(([file]) => `${outRoot}/${file}`))
  });
  const results = await evaluateFixtures({
    cwd,
    expectations,
    fixtures,
    mapping,
    namespacePackage,
    normalization,
    p2Evidence,
    p2Catalog,
    layoutEvidence,
    layoutReport,
    compilerRefs,
    receipt,
    baselineComparison,
    normalizedEvidenceRemap,
    validators
  });
  const mismatches = results.filter((row) => !row.matched);
  if (mismatches.length > 0) {
    throw contractError(`source-family namespace mapping validation expectation mismatch: ${mismatches.map((row) => row.fixturePath).join(", ")}`, 1);
  }
  const diagnostics = diagnosticsForResults(results);
  const receiptRef = artifactRef(receiptPath, "source-family-namespace-mapping-receipt.v0", await canonicalFileHash(path.join(cwd, receiptPath)));
  const normalizationVerification = buildNormalizationVerification(normalization);
  const runId = buildRunId({ namespacePackage, mapping, expectations, compilerRefs, proofImplementationRefs, runtimeRefs, baselineComparison, authorityExpansionProbe, normalizedEvidenceRemap });
  const report = buildReport({
    runId,
    namespacePackageRef,
    mappingRef,
    compilerRefs,
    proofImplementationRefs,
    runtimeRefs,
    receiptRef,
    normalizedEvidenceRemap,
    normalizationVerification,
    baselineComparison,
    authorityExpansionProbe,
    results,
    diagnostics
  });
  const reportPath = `${outRoot}/source-family-namespace-mapping-report.json`;
  assertSchema(validators, "source-family-namespace-mapping-report.v0", report, reportPath);
  await writeCanonicalJson(path.join(cwd, reportPath), report);

  const evidence = await buildEvidence({
    cwd,
    command,
    args,
    runId,
    namespacePackageRef,
    mappingRef,
    compilerRefs,
    proofImplementationRefs,
    runtimeRefs,
    normalizedEvidenceRemap,
    results,
    diagnostics
  });
  const evidencePath = `${outRoot}/evidence.json`;
  assertSchema(validators, "source-family-namespace-mapping-evidence.v0", evidence, evidencePath);
  await writeCanonicalJson(path.join(cwd, evidencePath), evidence);
  const evidenceFixtureResult = results.find((row) => row.diagnosticCodes.includes("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH"));
  const evidenceFixture = evidenceFixtureResult ? fixtures.get(evidenceFixtureResult.fixturePath) : null;
  const causalEvidenceOutcome = await evaluateFinalEvidenceFixture({ cwd, fixture: evidenceFixture, evidence });
  if (
    !evidenceFixtureResult ||
    causalEvidenceOutcome.actualResult !== evidenceFixtureResult.actualResult ||
    causalEvidenceOutcome.promotionStatus !== evidenceFixtureResult.promotionStatus ||
    canonicalJson(causalEvidenceOutcome.diagnosticCode ? [causalEvidenceOutcome.diagnosticCode] : []) !== canonicalJson(evidenceFixtureResult.diagnosticCodes)
  ) {
    throw contractError("source-family namespace mapping final-evidence fixture did not fail through the production integrity inspector", 1);
  }
  const persistedEvidence = await readJson(path.join(cwd, evidencePath));
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) throw contractError(`source-family namespace mapping evidence integrity verification failed: ${integrityCode}`, 1);

  return {
    status: "pass",
    promotionStatus: "review_required",
    matchedCount: results.length,
    totalCount: results.length,
    substitutionCount: normalization.totalSubstitutionCount,
    manifestHashRefreshCount: normalization.totalManifestHashRefreshCount,
    innerArtifacts: SFNM_CAPTURED_ARTIFACTS.length,
    artifacts: [...SFNM_ARTIFACT_PATHS]
  };
}

function assertCommandRoots(paths) {
  const expected = defaultNamespaceMappingArgs();
  if (
    paths.sourceRoot !== expected.source ||
    paths.mappingPath !== expected.mapping ||
    paths.namespacePackagePath !== expected.namespacePackage ||
    paths.ingestionEvidencePath !== expected.ingestionEvidence ||
    paths.catalogPath !== expected.catalog ||
    paths.sourceFamilyLayoutMappingEvidencePath !== expected.sourceFamilyLayoutMappingEvidence ||
    paths.fixtureRoot !== expected.fixture ||
    paths.outRoot !== expected.out
  ) {
    throw contractError(usage(), 2);
  }
}

async function assertSafeCommandInputs(cwd, inputs, outRoot) {
  for (const input of inputs) {
    await assertNoSymlinkPath(cwd, input, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, input));
    const expectedDirectory = input === SFNM_SOURCE_ROOT || input === SFNM_FIXTURE_ROOT;
    if ((expectedDirectory && !stat.isDirectory()) || (!expectedDirectory && !stat.isFile())) {
      throw contractError(`command input has unsupported type: ${input}`, 2);
    }
    if (stat.isFile() && stat.nlink !== 1) throw contractError(`unsafe hardlink-aliased command input: ${input}`, 2);
  }
  await assertNoSymlinkPath(cwd, outRoot, { allowMissingLeaf: true });
  try {
    const stat = await fs.lstat(path.join(cwd, outRoot));
    if (!stat.isDirectory()) throw contractError(`command output root must be a directory: ${outRoot}`, 2);
  } catch (error) {
    if (error?.exitCode === 2) throw error;
    if (error?.code !== "ENOENT") throw error;
  }
}

async function assertNoSymlinkPath(cwd, relativePath, { allowMissingLeaf }) {
  assertSafeRelativePath(relativePath, "command path", 2);
  const segments = relativePath.split("/");
  let current = cwd;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) throw contractError(`symlinked command path is forbidden: ${relativePath}`, 2);
      if (index < segments.length - 1 && !stat.isDirectory()) throw contractError(`command path ancestor is not a directory: ${relativePath}`, 2);
    } catch (error) {
      if (error?.exitCode === 2) throw error;
      if (allowMissingLeaf && index === segments.length - 1 && error?.code === "ENOENT") return;
      throw contractError(`missing command path: ${relativePath}`, 2);
    }
  }
}

async function assertFixedInputClosures(cwd) {
  const expectedFixturePaths = sfnmFixturePaths().map((entry) => entry.slice(`${SFNM_FIXTURE_ROOT}/`.length)).sort();
  const fixtureTree = await listIndependentRegularFiles(cwd, SFNM_FIXTURE_ROOT, "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH");
  if (canonicalJson(fixtureTree.files.map((entry) => entry.path).sort()) !== canonicalJson(expectedFixturePaths)) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: fixture tree closure drift", 1);
  }
  const targetSchemas = (await fs.readdir(path.join(cwd, SFNM_SCHEMA_ROOT), { withFileTypes: true }))
    .filter((entry) => entry.name.startsWith("source-family-namespace-"))
    .map((entry) => ({ name: entry.name, isFile: entry.isFile() }))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (
    targetSchemas.some((entry) => !entry.isFile) ||
    canonicalJson(targetSchemas.map((entry) => entry.name)) !== canonicalJson([...SFNM_SCHEMA_FILES].sort())
  ) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: target schema closure drift", 1);
  }
  const identities = new Set();
  for (const inputPath of sfnmSchemaPaths()) {
    await assertNoSymlinkPath(cwd, inputPath, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, inputPath));
    const identity = `${stat.dev}:${stat.ino}`;
    if (!stat.isFile() || stat.nlink !== 1 || identities.has(identity)) {
      throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: schema input is not an independent regular file: ${inputPath}`, 1);
    }
    identities.add(identity);
  }
}

function assertNormalizationCounts(normalization, namespacePackage) {
  if (
    normalization.entries.length !== 12 ||
    normalization.totalSubstitutionCount !== SFNM_EXPECTED_SUBSTITUTION_COUNT ||
    normalization.totalManifestHashRefreshCount !== SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT ||
    namespacePackage.totalSubstitutionCount !== SFNM_EXPECTED_SUBSTITUTION_COUNT ||
    namespacePackage.totalManifestHashRefreshCount !== SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT
  ) {
    throw contractError("SOURCE_NAMESPACE_MAPPING_INCOMPLETE: expected exactly 78 namespace substitutions and 11 manifest hash refreshes", 1);
  }
}

async function loadFixtureContract({ cwd, fixtureRoot, validators, namespacePackage }) {
  const expectationsPath = `${fixtureRoot}/expectations.manifest.json`;
  const expectations = await readJson(path.join(cwd, expectationsPath));
  assertSchema(validators, "source-family-namespace-mapping-expectations.v0", expectations, expectationsPath);
  const generated = buildSourceFamilyNamespaceMappingFixtures(namespacePackage);
  assertExactFixtureDocument(expectationsPath, expectations, generated, fixtureRoot);
  if (
    canonicalJson(expectations.expectations) !== canonicalJson(SFNM_EXPECTATION_ROWS) ||
    canonicalJson(expectations.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry()) ||
    canonicalJson(expectations.artifactOrder) !== canonicalJson(sfnmArtifactOrder())
  ) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: expectations manifest drift", 1);
  }
  const fixtures = new Map();
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    const schemaId = fixture.schemaId;
    assertSchema(validators, schemaId, fixture, expectation.fixturePath);
    assertExactFixtureDocument(expectation.fixturePath, fixture, generated, fixtureRoot);
    assertFixtureMutationSafety(fixture);
    fixtures.set(expectation.fixturePath, fixture);
  }
  return { expectations, fixtures };
}

function assertExactFixtureDocument(fixturePath, actual, generated, fixtureRoot = SFNM_FIXTURE_ROOT) {
  const prefix = `${fixtureRoot}/`;
  if (!fixturePath.startsWith(prefix)) {
    throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: fixture path is outside the fixed root: ${fixturePath}`, 1);
  }
  const relativePath = fixturePath.slice(prefix.length);
  if (!generated[relativePath] || canonicalJson(actual) !== canonicalJson(generated[relativePath])) {
    throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: generated fixture body drift: ${fixturePath}`, 1);
  }
}

function assertFixtureMutationSafety(fixture) {
  if (fixture?.schemaId === "source-family-namespace-mapping-preflight-mutation.v0") {
    if (!BOUNDARY_PATHS.includes(fixture.artifactPath)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: preflight mutation is outside the upstream boundary", 1);
    }
    return;
  }
  const mutation = fixture?.mutation;
  if (mutation === null || mutation === undefined) return;
  if (["mapping-descriptor", "namespace-package", "final-evidence"].includes(mutation.target)) {
    jsonPointerSegments(mutation.path.startsWith("/") ? mutation.path : `/${mutation.path}`);
    return;
  }
  if (mutation.target === "physical-source") {
    assertSafeRelativePath(mutation.path, "physical source mutation", 1);
    if (!SFNM_SOURCE_ENTRIES.some((entry) => entry.physicalPath === mutation.path)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: physical mutation is outside the fixed source closure", 1);
    }
    return;
  }
  if (mutation.target === "physical-source-json") {
    const parsed = splitFilePointer(mutation.path);
    if (!SFNM_SOURCE_ENTRIES.some((entry) => entry.physicalPath === parsed.file)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: source JSON mutation is outside the fixed source closure", 1);
    }
    jsonPointerSegments(parsed.pointer);
    return;
  }
  if (mutation.target === "normalization-result") {
    const parsed = splitFilePointer(mutation.path);
    if (!LOGICAL_PATHS.includes(parsed.file)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: normalized mutation is outside the fixed logical ABI", 1);
    }
    jsonPointerSegments(parsed.pointer);
    return;
  }
  if (mutation.target === "compiler-ref") {
    assertSafeRelativePath(mutation.path, "compiler mutation", 1);
    if (!SFNM_COMPILER_IMPLEMENTATION_PATHS.includes(mutation.path) && !SFNM_RUNTIME_DEPENDENCY_PATHS.includes(mutation.path)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: compiler mutation is outside the checked closure", 1);
    }
    return;
  }
  if (mutation.target === "probe-workspace") {
    assertSafeRelativePath(mutation.path, "probe mutation", 1);
    if (!LOGICAL_PATHS.includes(mutation.path)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: probe mutation is outside the fixed logical ABI", 1);
    }
    return;
  }
  if (mutation.target === "captured-inner-evidence") {
    assertSafeRelativePath(mutation.path, "captured evidence mutation", 1);
    if (mutation.path.includes("/") || !SFNM_CAPTURED_ARTIFACTS.some(([file]) => file === mutation.path)) {
      throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: captured evidence mutation is outside the persisted closure", 1);
    }
    return;
  }
  throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: unsupported fixture mutation target", 1);
}

function splitFilePointer(value) {
  const parts = String(value || "").split("#");
  if (parts.length !== 2 || !parts[1].startsWith("/")) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: mutation must contain one file and RFC 6901 pointer", 1);
  }
  assertSafeRelativePath(parts[0], "mutation file", 1);
  return { file: parts[0], pointer: parts[1] };
}

function assertCompilerRuntime(namespacePackage, actualNodeMajor) {
  if (
    namespacePackage?.compiler?.runtime?.name !== "node" ||
    namespacePackage?.compiler?.runtime?.major !== 22 ||
    !Number.isInteger(actualNodeMajor) ||
    actualNodeMajor !== namespacePackage.compiler.runtime.major
  ) {
    throw contractError("SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH: compiler runtime Node major drift", 1);
  }
}

async function assertUpstreamIntegrity(context) {
  const code = await firstUpstreamIntegrityFailureCode(context);
  if (code !== null) throw contractError(`${code}: accepted upstream boundary validation failed`, 1);
}

async function firstUpstreamIntegrityFailureCode({ cwd, p2Evidence, p2Catalog, layoutEvidence, layoutReport }) {
  if (!p2Evidence || p2Evidence.status !== "pass") return "SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING";
  if (!layoutEvidence || layoutEvidence.status !== "pass" || layoutEvidence.promotionStatus !== "review_required") {
    return "SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING";
  }
  if (!layoutReport || layoutReport.status !== "pass" || layoutReport.promotionStatus !== "review_required") {
    return "SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING";
  }
  try {
    if (await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence) !== null) {
      return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
    }
    if (await sourceFamilyLayoutMappingInternals.firstEvidenceIntegrityFailureCode(cwd, layoutEvidence) !== null) {
      return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
    }
    const catalogRef = p2Evidence.artifactRefs?.find((entry) => entry.path === SFNM_P2_CATALOG_PATH);
    if (!catalogRef || catalogRef.hash !== await canonicalFileHash(path.join(cwd, SFNM_P2_CATALOG_PATH))) {
      return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
    }
    const reportRef = layoutEvidence.artifacts?.find((entry) => entry.path === LAYOUT_REPORT_PATH);
    if (!reportRef || reportRef.hash !== await canonicalFileHash(path.join(cwd, LAYOUT_REPORT_PATH))) {
      return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
    }
    if (Object.keys(p2Catalog?.components || {}).sort().join("\0") !== "Button\0InLineAlert") {
      return "SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING";
    }
    return null;
  } catch {
    return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
  }
}

async function buildCheckedRefs(cwd, checkedRefs, schemaId, code) {
  const refs = [];
  for (const checked of checkedRefs || []) {
    await assertNoSymlinkPath(cwd, checked.path, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, checked.path));
    if (!stat.isFile() || stat.nlink !== 1) throw contractError(`${code}: ${checked.path} is not an independent regular file`, 1);
    const actualHash = await rawFileHash(path.join(cwd, checked.path));
    if (actualHash !== checked.hash) throw contractError(`${code}: ${checked.path} does not match the checked closure`, 1);
    refs.push(artifactRef(checked.path, schemaId, actualHash));
  }
  return refs;
}

async function buildCurrentRefs(cwd, paths, schemaId, code) {
  const refs = [];
  for (const implementationPath of paths) {
    await assertNoSymlinkPath(cwd, implementationPath, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, implementationPath));
    if (!stat.isFile() || stat.nlink !== 1) {
      throw contractError(`${code}: ${implementationPath} is not an independent regular file`, 1);
    }
    refs.push(artifactRef(implementationPath, schemaId, await rawFileHash(path.join(cwd, implementationPath))));
  }
  return refs;
}

async function runNormalizedCompilerBundle({ cwd, normalization, validators, mappingRef }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-normalized-"));
  try {
    const stagedEntries = await stageNormalizedCompilerWorkspace({ cwd, workspace, normalization });
    const before = await logicalSourceSnapshot(workspace);
    const compilerResult = await executeCompiler(cwd, workspace);
    if (compilerResult.exitCode !== 0) {
      throw contractError(`SOURCE_NAMESPACE_COMPILER_RUN_FAILED: ${stableChildFailure(compilerResult)}`, 1);
    }
    const after = await logicalSourceSnapshot(workspace);
    if (canonicalJson(before) !== canonicalJson(after)) {
      throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: source-conformance compiler changed normalized source bytes", 1);
    }
    const artifacts = await readNormalizedArtifacts(workspace, validators);
    const evidence = artifacts.get("evidence.json");
    const integrityCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    if (integrityCode !== null || evidence.status !== "pass" || evidence.promotionStatus !== "review_required") {
      throw contractError(`SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID: normalized compiler evidence failed integrity: ${integrityCode || evidence.status}`, 1);
    }
    const manifest = await readJson(path.join(workspace, SC_SOURCE_ROOT, "manifest.json"));
    const factValueIndex = await sourceFamilyPackagingInternals.buildSourceFactValueIndex(workspace, SC_SOURCE_ROOT, manifest);
    return { artifacts, evidence, stagedEntries, factValueIndex, mappingRef };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function stageNormalizedCompilerWorkspace({ cwd, workspace, normalization }) {
  await copyClosedTree({ cwd, sourceRoot: SFNM_SCHEMA_ROOT, destinationRoot: workspace, code: "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH" });
  await copyClosedTree({ cwd, sourceRoot: SC_FIXTURE_ROOT, destinationRoot: workspace, code: "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH" });
  for (const artifactPath of [SFNM_P2_EVIDENCE_PATH, SFNM_P2_CATALOG_PATH]) {
    await fs.mkdir(path.join(workspace, path.dirname(artifactPath)), { recursive: true });
    await fs.copyFile(path.join(cwd, artifactPath), path.join(workspace, artifactPath));
  }
  const stagedEntries = [];
  for (const entry of normalization.entries) {
    const normalized = normalization.documentsByLogicalPath.get(entry.logicalPath);
    if (!normalized?.document || typeof normalized.text !== "string") {
      throw contractError(`SOURCE_NAMESPACE_MAPPING_INCOMPLETE: missing normalized document bytes for ${entry.logicalPath}`, 1);
    }
    const destination = path.join(workspace, SC_SOURCE_ROOT, entry.logicalPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, normalized.text, "utf8");
    const logicalHash = await rawFileHash(destination);
    const baselinePath = `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`;
    const baselineHash = await rawFileHash(path.join(cwd, baselinePath));
    if (logicalHash !== entry.normalizedSha256 || logicalHash !== baselineHash) {
      throw contractError(`SOURCE_NAMESPACE_BASELINE_MISMATCH: normalized staging drift for ${entry.logicalPath}`, 1);
    }
    stagedEntries.push({
      ...deepClone(entry),
      physicalPath: `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`,
      logicalPath: `${SC_SOURCE_ROOT}/${entry.logicalPath}`,
      baselinePath,
      logicalSha256: logicalHash,
      baselineSha256: baselineHash
    });
  }
  return stagedEntries;
}

async function copyClosedTree({ cwd, sourceRoot, destinationRoot, code }) {
  const tree = await listIndependentRegularFiles(cwd, sourceRoot, code);
  for (const entry of tree.files) {
    const sourcePath = path.join(cwd, sourceRoot, entry.path);
    const destination = path.join(destinationRoot, sourceRoot, entry.path);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(sourcePath, destination);
  }
}

async function logicalSourceSnapshot(workspace) {
  const rows = [];
  for (const logicalPath of LOGICAL_PATHS) {
    rows.push({ logicalPath, hash: await rawFileHash(path.join(workspace, SC_SOURCE_ROOT, logicalPath)) });
  }
  return rows;
}

async function executeCompiler(cwd, workspace) {
  const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
  if (materializer.exitCode !== 0) return materializer;
  return executeChild(process.execPath, [
    path.join(cwd, "bin/interfacectl.js"),
    "surfaces", "source-conformance", "proof",
    "--source", SC_SOURCE_ROOT,
    "--ingestion-evidence", SFNM_P2_EVIDENCE_PATH,
    "--catalog", SFNM_P2_CATALOG_PATH,
    "--fixture", SC_FIXTURE_ROOT,
    "--out", SC_ARTIFACT_ROOT
  ], workspace);
}

async function executeChild(file, argv, cwd) {
  try {
    const result = await execFileAsync(file, argv, {
      cwd,
      env: { TZ: "UTC", LC_ALL: "C", LANG: "C" },
      maxBuffer: 10 * 1024 * 1024
    });
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      exitCode: Number.isInteger(error.code) ? error.code : 1,
      stdout: typeof error.stdout === "string" ? error.stdout : "",
      stderr: typeof error.stderr === "string" ? error.stderr : ""
    };
  }
}

function stableChildFailure(result) {
  return `${result.stderr}\n${result.stdout}`.trim().split(/\r?\n/).filter(Boolean).at(-1) || `compiler exited ${result.exitCode}`;
}

async function readNormalizedArtifacts(workspace, validators) {
  const artifacts = new Map();
  for (const [, schemaId, innerFile] of SFNM_CAPTURED_ARTIFACTS) {
    const artifactPath = `${SC_ARTIFACT_ROOT}/${innerFile}`;
    const value = await readJson(path.join(workspace, artifactPath));
    assertSchema(validators, schemaId, value, artifactPath);
    artifacts.set(innerFile, value);
  }
  return artifacts;
}

async function readPersistedNormalizedArtifacts(cwd, validators) {
  const artifacts = new Map();
  for (const [normalizedFile, schemaId, innerFile] of SFNM_CAPTURED_ARTIFACTS) {
    const artifactPath = `${SFNM_ARTIFACT_ROOT}/${normalizedFile}`;
    const value = await readJson(path.join(cwd, artifactPath));
    assertSchema(validators, schemaId, value, artifactPath);
    artifacts.set(innerFile, value);
  }
  return artifacts;
}

async function compareNormalizedRun({ cwd, normalizedRun, layoutReport, p2Catalog, normalization }) {
  for (const [, , innerFile] of SFNM_CAPTURED_ARTIFACTS) {
    const baselineTuple = SFLM_CAPTURED_ARTIFACTS.find(([, , candidateInnerFile]) => candidateInnerFile === innerFile);
    if (!baselineTuple) throw contractError(`SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID: missing layout baseline for ${innerFile}`, 1);
    const baseline = await readJson(path.join(cwd, SFLM_ARTIFACT_ROOT, baselineTuple[0]));
    if (canonicalJson(normalizedRun.artifacts.get(innerFile)) !== canonicalJson(baseline)) {
      throw contractError(`SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID: normalized ${innerFile} differs from the accepted layout-mapping artifact`, 1);
    }
  }
  const factTuples = sourceFamilyPackagingInternals.factTuples(
    normalizedRun.artifacts.get("source-fact-coverage.json"),
    normalizedRun.factValueIndex
  );
  sourceFamilyPackagingInternals.assertMatchingFactTuples(layoutReport.baselineComparison.factTuples, factTuples);
  if (factTuples.length !== 6) throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: normalized fact tuple count drift", 1);
  const normalizedCatalog = normalizedRun.artifacts.get("governed-catalog.json");
  for (const field of SFLM_IMMUTABLE_CATALOG_FIELDS) {
    const p2Hash = sha256Hex(canonicalJson(p2Catalog[field]));
    const normalizedHash = sha256Hex(canonicalJson(normalizedCatalog[field]));
    const baseline = layoutReport.baselineComparison.immutableFields.find((entry) => entry.field === field);
    if (!baseline || baseline.p2Hash !== p2Hash || baseline.mappedHash !== normalizedHash) {
      throw contractError(`SOURCE_NAMESPACE_BASELINE_MISMATCH: immutable catalog field changed: ${field}`, 1);
    }
  }
  if (canonicalJson(Object.keys(normalizedCatalog.components).sort()) !== canonicalJson(["Button", "InLineAlert"])) {
    throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: normalized component boundary drift", 1);
  }
  const profile = normalization.documentsByLogicalPath.get("governance/authority-profile.json")?.document;
  const reviewResolution = sfpReferencedReviewRoutes(profile);
  const queue = normalizedRun.artifacts.get("source-review-queue.json");
  if (
    !reviewResolution.valid ||
    reviewResolution.owners.length !== 1 ||
    reviewResolution.owners[0] !== layoutReport.baselineComparison.owner ||
    canonicalJson(reviewResolution.routeIds) !== canonicalJson(layoutReport.baselineComparison.activeReviewRouteIds) ||
    queue.queueItems.some((item) => item.executable !== false) ||
    queue.promotionStatus !== "review_required"
  ) {
    throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: owner-bound non-executable review semantics drift", 1);
  }
  if (!allDeclaredSourceRefs(normalization).every((ref) => ref.startsWith(SFNM_CANONICAL_NAMESPACE))) {
    throw contractError("SOURCE_NAMESPACE_SUFFIX_MISMATCH: normalized source ref is outside the canonical namespace", 1);
  }
  return {
    artifactClosureMatched: true,
    factTuplesMatched: true,
    immutableFieldsMatched: true,
    sourceRefsCanonicalized: true,
    reviewSemanticsMatched: true,
    compilerImplementationReused: true,
    familySpecificModule: null
  };
}

function allDeclaredSourceRefs(normalization) {
  const refs = [];
  const visit = (value) => {
    if (typeof value === "string" && value.startsWith("declared-source://")) refs.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  for (const { document } of normalization.documentsByLogicalPath.values()) visit(document);
  return refs;
}

function buildNamespaceReceipt({ namespacePackageRef, mappingRef, mapping, normalization }) {
  return {
    schemaId: "source-family-namespace-mapping-receipt.v0",
    version: SFNM_VERSION,
    namespacePackageRef,
    mappingRef,
    physicalSourceRoot: SFNM_SOURCE_ROOT,
    logicalSourceRoot: SC_SOURCE_ROOT,
    fromNamespace: mapping.fromNamespace,
    toNamespace: mapping.toNamespace,
    rewriteMode: "exact-prefix-json-string",
    preservePathAndFragment: true,
    manifestHashRefresh: true,
    entryCount: normalization.entries.length,
    entries: deepClone(normalization.entries),
    totalSubstitutionCount: normalization.totalSubstitutionCount,
    totalManifestHashRefreshCount: normalization.totalManifestHashRefreshCount,
    normalizedBaselineMatched: true,
    onlyNamespaceAndManifestHashesChanged: true,
    status: "pass",
    provenance: provenance("interfacectl-source-family-namespace-mapping-receipt", [namespacePackageRef.path, mappingRef.path])
  };
}

function buildNormalizationVerification(normalization) {
  return {
    entryCount: normalization.entries.length,
    totalSubstitutionCount: normalization.totalSubstitutionCount,
    totalManifestHashRefreshCount: normalization.totalManifestHashRefreshCount,
    inputClosureMatched: true,
    normalizedBaselineMatched: true,
    suffixesPreserved: normalization.entries.every((entry) => entry.substitutions.every((substitution) => namespaceSuffix(substitution.from, SFNM_ALTERNATE_NAMESPACE) === namespaceSuffix(substitution.to, SFNM_CANONICAL_NAMESPACE))),
    onlyNamespaceAndManifestHashesChanged: true,
    foreignNamespaceRefsRemaining: 0,
    canonicalNamespaceRefsBeforeNormalization: 0
  };
}

function namespaceSuffix(value, namespace) {
  return typeof value === "string" && value.startsWith(namespace) ? value.slice(namespace.length) : null;
}

async function prepareOutputRoot(cwd, outRoot) {
  const absolute = path.join(cwd, outRoot);
  await fs.mkdir(absolute, { recursive: true });
  const allowed = new Set(SFNM_ARTIFACT_PATHS.map((entry) => path.posix.basename(entry)));
  const stale = [];
  for (const entry of await fs.readdir(absolute, { withFileTypes: true })) {
    const stat = await fs.lstat(path.join(absolute, entry.name));
    if (stat.isSymbolicLink()) throw contractError(`symlinked command output is forbidden: ${outRoot}/${entry.name}`, 2);
    if (stat.isFile() && stat.nlink !== 1) throw contractError(`hardlink-aliased command output is forbidden: ${outRoot}/${entry.name}`, 2);
    if (!entry.isFile() || !allowed.has(entry.name)) stale.push(entry.name);
  }
  if (stale.length > 0) throw contractError(`source-family namespace mapping output contains stale or unsupported entries: ${stale.sort().join(", ")}`, 1);
  for (const file of allowed) await fs.rm(path.join(absolute, file), { force: true });
}

async function assertPersistedOutputClosure(cwd) {
  await assertNoSymlinkPath(cwd, SFNM_ARTIFACT_ROOT, { allowMissingLeaf: false });
  const tree = await listIndependentRegularFiles(cwd, SFNM_ARTIFACT_ROOT, "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH");
  const expected = SFNM_ARTIFACT_PATHS.map((entry) => path.posix.basename(entry)).sort();
  if (canonicalJson(tree.files.map((entry) => entry.path).sort()) !== canonicalJson(expected)) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: persisted output tree closure drift", 1);
  }
}

async function firstPersistedNormalizedEvidenceIntegrityFailureCode(cwd, remap, normalization, validators) {
  const mappingRef = remap?.mappingRef;
  if (!mappingRef || canonicalJson(remap) !== canonicalJson(sfnmNormalizedEvidenceRemap(mappingRef))) {
    return "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID";
  }
  try {
    normalization ||= (await verifyImmutableNamespaceInputs(cwd)).normalization;
    validators ||= await loadValidators(cwd);
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-persisted-verify-"));
    try {
      await stageNormalizedCompilerWorkspace({ cwd, workspace, normalization });
      const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
      if (materializer.exitCode !== 0) return "SOURCE_NAMESPACE_COMPILER_RUN_FAILED";
      for (const row of remap.artifactMappings) {
        await fs.mkdir(path.join(workspace, path.dirname(row.logicalPath)), { recursive: true });
        await fs.copyFile(path.join(cwd, row.persistedPath), path.join(workspace, row.logicalPath));
        const schemaId = sfnmSchemaIdForPath(row.persistedPath);
        const value = await readJson(path.join(workspace, row.logicalPath));
        assertSchema(validators, schemaId, value, row.persistedPath);
      }
      const evidenceRow = remap.artifactMappings.find((entry) => entry.logicalPath === `${SC_ARTIFACT_ROOT}/evidence.json`);
      if (!evidenceRow) return "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID";
      const evidence = await readJson(path.join(workspace, evidenceRow.logicalPath));
      return await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence) === null
        ? null
        : "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID";
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  } catch {
    return "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID";
  }
}

async function artifactHashSnapshot(cwd, artifactPaths) {
  const rows = [];
  for (const artifactPath of artifactPaths) rows.push({ path: artifactPath, hash: await canonicalFileHash(path.join(cwd, artifactPath)) });
  return rows;
}

async function checkedInputHashSnapshot(cwd) {
  const paths = [SFNM_NAMESPACE_PACKAGE_PATH, ...sfnmSourcePaths()];
  const rows = [];
  for (const inputPath of paths) rows.push({ path: inputPath, hash: await rawFileHash(path.join(cwd, inputPath)) });
  return rows;
}

async function runAuthorityExpansionProbe({ cwd, normalization, baselineArtifactHashes }) {
  const verifiedWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-verified-"));
  const probeWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-authority-expansion-"));
  const inputsBefore = await checkedInputHashSnapshot(cwd);
  try {
    await stageNormalizedCompilerWorkspace({ cwd, workspace: verifiedWorkspace, normalization });
    await copyIndependentWorkspaceTree(verifiedWorkspace, probeWorkspace);
    const buttonPath = path.join(probeWorkspace, SC_SOURCE_ROOT, "components/button.json");
    const manifestPath = path.join(probeWorkspace, SC_SOURCE_ROOT, "manifest.json");
    const button = await readJson(buttonPath);
    const fact = button.facts.find((entry) => entry.catalogPointer === "/components/Button/props/variant/allowedValues");
    if (!fact) throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: Button variant fact is missing from the verified workspace", 1);
    fact.value = [...new Set([...fact.value, "expressive"])].sort();
    await writeCanonicalJson(buttonPath, button);
    const manifest = await readJson(manifestPath);
    const sourceFile = manifest.sourceFiles.find((entry) => entry.path === "components/button.json");
    if (!sourceFile) throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: Button manifest entry is missing", 1);
    sourceFile.sha256 = await rawFileHash(buttonPath);
    await writeCanonicalJson(manifestPath, manifest);
    const acceptedInnerEvidence = await readJson(path.join(cwd, SFNM_ARTIFACT_ROOT, "normalized-source-conformance-evidence.json"));
    const expectedFailureDiagnosticCodes = acceptedInnerEvidence.diagnostics.map((entry) => entry.code);
    const result = await executeCompiler(cwd, probeWorkspace);
    let innerFinding = null;
    try {
      const coverage = await readJson(path.join(probeWorkspace, SC_ARTIFACT_ROOT, "source-fact-coverage.json"));
      innerFinding = exactAuthorityExpansionFinding(coverage);
    } catch {
      innerFinding = null;
    }
    if (!hasExactAuthorityExpansionFailure(result, expectedFailureDiagnosticCodes) || innerFinding?.diagnosticCode !== "SOURCE_FACT_AUTHORITY_ESCALATION") {
      throw contractError("SOURCE_NAMESPACE_BASELINE_MISMATCH: unchanged compiler did not preserve causal authority rejection", 1);
    }
    const inputsAfter = await checkedInputHashSnapshot(cwd);
    const artifactsAfter = await artifactHashSnapshot(cwd, baselineArtifactHashes.map((entry) => entry.path));
    if (canonicalJson(inputsBefore) !== canonicalJson(inputsAfter)) {
      throw contractError("SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: authority probe changed checked inputs", 1);
    }
    if (canonicalJson(baselineArtifactHashes) !== canonicalJson(artifactsAfter)) {
      throw contractError("SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID: authority probe changed persisted baseline artifacts", 1);
    }
    return {
      baselineVerified: true,
      mutationIsolated: true,
      innerDiagnosticCode: innerFinding.diagnosticCode,
      compilerExitCode: 1,
      checkedInputsUnchanged: true,
      baselineArtifactsUnchanged: true
    };
  } finally {
    await fs.rm(verifiedWorkspace, { recursive: true, force: true });
    await fs.rm(probeWorkspace, { recursive: true, force: true });
  }
}

function exactAuthorityExpansionFinding(coverage) {
  if (coverage?.promotionStatus !== "blocked" || !Array.isArray(coverage.findings)) return null;
  const blockedFindings = coverage.findings.filter((entry) => entry.status === "blocked");
  if (
    blockedFindings.length !== 1 ||
    blockedFindings[0].diagnosticCode !== "SOURCE_FACT_AUTHORITY_ESCALATION"
  ) return null;
  return blockedFindings[0];
}

function hasExactAuthorityExpansionFailure(result, diagnosticCodes) {
  if (
    result?.exitCode !== 1 ||
    !Array.isArray(diagnosticCodes) ||
    diagnosticCodes.filter((code) => code === "SOURCE_FACT_AUTHORITY_ESCALATION").length !== 1
  ) return false;
  const expected = `source conformance run expectation mismatch: expected pass/review_required got fail/blocked; diagnostics ${diagnosticCodes.join(",")}`;
  return stableChildFailure(result) === expected;
}

async function copyIndependentWorkspaceTree(sourceRoot, destinationRoot) {
  async function visit(relative = "") {
    for (const entry of (await fs.readdir(path.join(sourceRoot, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith(".")) throw contractError(`SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: hidden temporary entry ${entry.name}`, 1);
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      const sourcePath = path.join(sourceRoot, next);
      const stat = await fs.lstat(sourcePath);
      if (stat.isSymbolicLink()) throw contractError(`SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: symlinked temporary entry ${next}`, 1);
      if (stat.isDirectory()) {
        await fs.mkdir(path.join(destinationRoot, next), { recursive: true });
        await visit(next);
      } else {
        if (!stat.isFile() || stat.nlink !== 1) throw contractError(`SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: non-independent temporary entry ${next}`, 1);
        await fs.mkdir(path.dirname(path.join(destinationRoot, next)), { recursive: true });
        await fs.copyFile(sourcePath, path.join(destinationRoot, next));
      }
    }
  }
  await visit();
}

async function evaluateFixtures({
  cwd,
  expectations,
  fixtures,
  mapping,
  namespacePackage,
  normalization,
  p2Evidence,
  p2Catalog,
  layoutEvidence,
  layoutReport,
  compilerRefs,
  receipt,
  baselineComparison,
  normalizedEvidenceRemap,
  validators
}) {
  const results = [];
  for (const expectation of expectations.expectations) {
    const fixture = fixtures.get(expectation.fixturePath);
    if (!fixture) throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: fixture missing: ${expectation.fixturePath}`, 1);
    const outcome = await evaluateFixture({
      cwd,
      fixture,
      mapping,
      namespacePackage,
      normalization,
      p2Evidence,
      p2Catalog,
      layoutEvidence,
      layoutReport,
      compilerRefs,
      receipt,
      baselineComparison,
      normalizedEvidenceRemap,
      validators
    });
    const diagnosticCodes = outcome.diagnosticCode ? [outcome.diagnosticCode] : [];
    results.push({
      fixturePath: expectation.fixturePath,
      stage: expectation.stage,
      phase: expectation.phase,
      expectedResult: expectation.expectedResult,
      actualResult: outcome.actualResult,
      promotionStatus: outcome.promotionStatus,
      diagnosticCodes,
      matched:
        outcome.actualResult === expectation.expectedResult &&
        outcome.promotionStatus === expectation.promotionStatus &&
        canonicalJson(diagnosticCodes) === canonicalJson(expectation.diagnosticCodes)
    });
  }
  return results;
}

async function evaluateFixture(context) {
  const { fixture } = context;
  if (fixture.schemaId === "source-family-namespace-mapping-preflight-mutation.v0") return evaluatePreflightFixture(context);
  if (fixture.caseType === "valid-namespace") {
    const valid =
      context.normalization.totalSubstitutionCount === SFNM_EXPECTED_SUBSTITUTION_COUNT &&
      context.normalization.totalManifestHashRefreshCount === SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT &&
      context.receipt.normalizedBaselineMatched === true &&
      context.baselineComparison.artifactClosureMatched === true;
    return valid ? allowedOutcome() : blockedOutcome("SOURCE_NAMESPACE_MAPPING_INCOMPLETE");
  }
  if (fixture.caseType === "review-required") return evaluateReviewFixture(context);
  if (fixture.caseType === "namespace-package-hash-mismatch") return evaluateNamespacePackageFixture(context);
  if (["mapping-hash-mismatch", "namespace-unsupported", "namespace-collision", "transform-forbidden"].includes(fixture.caseType)) {
    return evaluateMappingFixture(context);
  }
  if (fixture.caseType === "source-hash-mismatch") return evaluatePhysicalSourceFixture(context);
  if (["namespace-incomplete", "ref-unsafe", "baseline-drift"].includes(fixture.caseType)) return evaluateSourceJsonFixture(context);
  if (fixture.caseType === "suffix-mismatch") return evaluateNormalizedSuffixFixture(context);
  if (fixture.caseType === "compiler-hash-mismatch") return evaluateCompilerHashFixture(context);
  if (fixture.caseType === "compiler-run-failed") return evaluateCompilerFailureFixture(context);
  if (fixture.caseType === "inner-evidence-invalid") return evaluateInnerEvidenceFixture(context);
  if (fixture.caseType === "evidence-hash-mismatch") return provisionalFinalEvidenceOutcome(fixture);
  throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: unsupported fixture case ${fixture.caseType}`, 1);
}

async function evaluatePreflightFixture({ cwd, fixture, p2Evidence, p2Catalog, layoutEvidence, layoutReport }) {
  let candidateP2 = deepClone(p2Evidence);
  let candidateLayout = deepClone(layoutEvidence);
  if (fixture.operation === "remove") {
    if (fixture.artifactPath === SFNM_P2_EVIDENCE_PATH) candidateP2 = null;
    if (fixture.artifactPath === SFNM_LAYOUT_EVIDENCE_PATH) candidateLayout = null;
  } else if (fixture.operation === "replace-hash") {
    if (fixture.artifactPath === SFNM_P2_CATALOG_PATH) {
      const ref = candidateP2.artifactRefs.find((entry) => entry.path === SFNM_P2_CATALOG_PATH);
      if (ref) ref.hash = fixture.value;
    } else if (fixture.artifactPath === SFNM_LAYOUT_EVIDENCE_PATH) {
      candidateLayout.artifacts.at(-1).hash = fixture.value;
    }
  }
  const code = await firstUpstreamIntegrityFailureCode({
    cwd,
    p2Evidence: candidateP2,
    p2Catalog,
    layoutEvidence: candidateLayout,
    layoutReport
  });
  if (fixture.caseType === "upstream-evidence-missing" && code === "SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING") return blockedOutcome(code);
  if (fixture.caseType === "upstream-hash-mismatch" && code === "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH") return blockedOutcome(code);
  return allowedOutcome();
}

async function evaluateReviewFixture({ cwd, fixture }) {
  const queue = await readJson(path.join(cwd, SFNM_ARTIFACT_ROOT, "normalized-source-review-queue.json"));
  const item = queue.queueItems.find((candidate) =>
    candidate.owner === fixture.review?.owner &&
    candidate.executable === false &&
    candidate.rationale === fixture.review?.rationale &&
    candidate.expiresAt === fixture.review?.expiresAt &&
    (fixture.review?.requiredRefs || []).every((ref) => candidate.requiredSourceRefs.includes(ref))
  );
  return item ? reviewOutcome("SOURCE_NAMESPACE_REVIEW_REQUIRED") : allowedOutcome();
}

function evaluateMappingFixture({ fixture, mapping }) {
  const mutated = deepClone(mapping);
  applyMutation(mutated, fixture.mutation);
  try {
    assertNamespaceMapping(mutated);
    return allowedOutcome();
  } catch (error) {
    const code = diagnosticCodeFromError(error);
    return code ? blockedOutcome(code) : allowedOutcome();
  }
}

async function evaluateNamespacePackageFixture({ cwd, fixture, namespacePackage, normalization }) {
  const mutated = deepClone(namespacePackage);
  applyMutation(mutated, fixture.mutation);
  try {
    const mappingHash = await rawFileHash(path.join(cwd, SFNM_MAPPING_PATH));
    await assertNamespacePackage(cwd, mutated, mappingHash, normalization);
    return allowedOutcome();
  } catch (error) {
    const code = diagnosticCodeFromError(error);
    return code === "SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH" ? blockedOutcome(code) : allowedOutcome();
  }
}

async function evaluatePhysicalSourceFixture({ cwd, fixture }) {
  return withFixtureSourceWorkspace(cwd, async (workspace) => {
    const target = resolveContainedPath(path.join(workspace, SFNM_SOURCE_ROOT), fixture.mutation.path);
    await fs.appendFile(target, Buffer.from(String(fixture.mutation.value)));
    try {
      await normalizeNamespacedBundle(workspace);
      return allowedOutcome();
    } catch (error) {
      const code = diagnosticCodeFromError(error);
      return code === "SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH" ? blockedOutcome(code) : allowedOutcome();
    }
  });
}

async function evaluateSourceJsonFixture({ cwd, fixture }) {
  return withFixtureSourceWorkspace(cwd, async (workspace) => {
    const parsed = splitFilePointer(fixture.mutation.path);
    const target = resolveContainedPath(path.join(workspace, SFNM_SOURCE_ROOT), parsed.file);
    const document = await readJson(target);
    setJsonPointer(document, parsed.pointer, deepClone(fixture.mutation.value));
    await writeCanonicalJson(target, document);
    try {
      await normalizeNamespacedBundle(workspace);
      return allowedOutcome();
    } catch (error) {
      const code = diagnosticCodeFromError(error);
      if (fixture.caseType === "namespace-incomplete" && code === "SOURCE_NAMESPACE_MAPPING_INCOMPLETE") return blockedOutcome(code);
      if (fixture.caseType === "ref-unsafe" && code === "SOURCE_NAMESPACE_REF_UNSAFE") return blockedOutcome(code);
      if (fixture.caseType === "baseline-drift" && code === "SOURCE_NAMESPACE_BASELINE_MISMATCH") return blockedOutcome(code);
      return allowedOutcome();
    }
  });
}

async function evaluateNormalizedSuffixFixture({ cwd, fixture, normalization }) {
  const parsed = splitFilePointer(fixture.mutation.path);
  const normalized = deepClone(normalization.documentsByLogicalPath.get(parsed.file)?.document);
  if (!normalized) return allowedOutcome();
  setJsonPointer(normalized, parsed.pointer, deepClone(fixture.mutation.value));
  const baselineEntry = SFNM_SOURCE_ENTRIES.find((entry) => entry.logicalPath === parsed.file);
  const baseline = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, baselineEntry.physicalPath));
  const actualValue = valueAtJsonPointer(normalized, parsed.pointer);
  const expectedValue = valueAtJsonPointer(baseline, parsed.pointer);
  return actualValue !== expectedValue ? blockedOutcome("SOURCE_NAMESPACE_SUFFIX_MISMATCH") : allowedOutcome();
}

async function evaluateCompilerHashFixture({ cwd, fixture, compilerRefs }) {
  const refs = deepClone(compilerRefs);
  const ref = refs.find((entry) => entry.path === fixture.mutation.path);
  if (!ref) return allowedOutcome();
  ref.hash = fixture.mutation.value;
  try {
    await buildCheckedRefs(cwd, refs, "javascript-source", "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH");
    return allowedOutcome();
  } catch (error) {
    return diagnosticCodeFromError(error) === "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH"
      ? blockedOutcome("SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH")
      : allowedOutcome();
  }
}

async function evaluateCompilerFailureFixture({ cwd, fixture, normalization }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-compiler-fixture-"));
  try {
    await stageNormalizedCompilerWorkspace({ cwd, workspace, normalization });
    await fs.rm(resolveContainedPath(path.join(workspace, SC_SOURCE_ROOT), fixture.mutation.path));
    const result = await executeCompiler(cwd, workspace);
    return result.exitCode !== 0 ? blockedOutcome("SOURCE_NAMESPACE_COMPILER_RUN_FAILED") : allowedOutcome();
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function evaluateInnerEvidenceFixture({ cwd, fixture, normalization, normalizedEvidenceRemap, validators }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-inner-fixture-"));
  try {
    await stageNormalizedCompilerWorkspace({ cwd, workspace, normalization });
    const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
    if (materializer.exitCode !== 0) return allowedOutcome();
    for (const row of normalizedEvidenceRemap.artifactMappings) {
      await fs.mkdir(path.join(workspace, path.dirname(row.logicalPath)), { recursive: true });
      await fs.copyFile(path.join(cwd, row.persistedPath), path.join(workspace, row.logicalPath));
    }
    const target = normalizedEvidenceRemap.artifactMappings.find((entry) => path.posix.basename(entry.persistedPath) === fixture.mutation.path);
    const evidenceRow = normalizedEvidenceRemap.artifactMappings.find((entry) => entry.logicalPath === `${SC_ARTIFACT_ROOT}/evidence.json`);
    if (!target || !evidenceRow) return allowedOutcome();
    const evidence = await readJson(path.join(workspace, evidenceRow.logicalPath));
    const ref = evidence.artifacts.find((entry) => entry.path === target.logicalPath);
    if (!ref) return allowedOutcome();
    ref.hash = fixture.mutation.value;
    await writeCanonicalJson(path.join(workspace, evidenceRow.logicalPath), evidence);
    const code = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    return code !== null ? blockedOutcome("SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID") : allowedOutcome();
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

function provisionalFinalEvidenceOutcome(fixture) {
  return fixture.mutation?.target === "final-evidence" && fixture.mutation.operation === "replace-hash"
    ? blockedOutcome("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH")
    : allowedOutcome();
}

async function evaluateFinalEvidenceFixture({ cwd, fixture, evidence }) {
  if (!fixture || fixture.mutation?.target !== "final-evidence") return allowedOutcome();
  const mutated = deepClone(evidence);
  setJsonPointer(mutated, fixture.mutation.path.startsWith("/") ? fixture.mutation.path : `/${fixture.mutation.path}`, fixture.mutation.value);
  return await firstEvidenceIntegrityFailureCode(cwd, mutated) === "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH"
    ? blockedOutcome("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH")
    : allowedOutcome();
}

async function withFixtureSourceWorkspace(cwd, fn) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-namespace-fixture-"));
  try {
    await copyClosedTree({ cwd, sourceRoot: SFNM_SOURCE_ROOT, destinationRoot: workspace, code: "SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH" });
    await copyClosedTree({ cwd, sourceRoot: SFLM_PHYSICAL_SOURCE_ROOT, destinationRoot: workspace, code: "SOURCE_NAMESPACE_BASELINE_MISMATCH" });
    return await fn(workspace);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

function applyMutation(target, mutation) {
  if (!mutation) return;
  if (["replace-value", "add-field", "replace-hash"].includes(mutation.operation)) {
    setJsonPointer(target, mutation.path.startsWith("/") ? mutation.path : `/${mutation.path}`, deepClone(mutation.value));
  }
}

function allowedOutcome() {
  return { actualResult: "valid", promotionStatus: "allowed", diagnosticCode: null };
}

function reviewOutcome(diagnosticCode) {
  return { actualResult: "review_required", promotionStatus: "review_required", diagnosticCode };
}

function blockedOutcome(diagnosticCode) {
  return { actualResult: "invalid", promotionStatus: "blocked", diagnosticCode };
}

function diagnosticsForResults(results) {
  const codes = new Set(results.flatMap((entry) => entry.diagnosticCodes));
  return diagnosticsRegistry().filter((entry) => codes.has(entry.code)).map((entry) => ({
    code: entry.code,
    message: entry.canonicalMessage,
    stage: entry.stage,
    phase: entry.phase,
    severity: entry.severity,
    artifactPath: entry.artifactPath,
    jsonPointer: entry.jsonPointer,
    sourceRef: entry.sourceRef
  }));
}

function buildRunId({ namespacePackage, mapping, expectations, compilerRefs, proofImplementationRefs, runtimeRefs, baselineComparison, authorityExpansionProbe, normalizedEvidenceRemap }) {
  return `source-family-namespace-mapping-${sha256Hex(canonicalJson({
    namespacePackage,
    mapping,
    expectations,
    compilerRefs,
    proofImplementationRefs,
    runtimeRefs,
    baselineComparison,
    authorityExpansionProbe,
    normalizedEvidenceRemap
  })).slice(0, 32)}`;
}

function buildReport({
  runId,
  namespacePackageRef,
  mappingRef,
  compilerRefs,
  proofImplementationRefs,
  runtimeRefs,
  receiptRef,
  normalizedEvidenceRemap,
  normalizationVerification,
  baselineComparison,
  authorityExpansionProbe,
  results,
  diagnostics
}) {
  return {
    schemaId: "source-family-namespace-mapping-report.v0",
    version: SFNM_VERSION,
    runId,
    namespacePackageRef,
    mappingRef,
    compilerRefs,
    proofImplementationRefs,
    runtimeRefs,
    namespaceMappingReceiptRef: receiptRef,
    normalizedEvidenceRemap,
    normalizationVerification,
    baselineComparison,
    authorityExpansionProbe,
    results,
    diagnostics,
    compilerExecutions: { acceptedBundlePasses: 1, causalProbeFailures: 2, total: 3 },
    diagnosticsRegistry: diagnosticsRegistry(),
    status: "pass",
    promotionStatus: "review_required",
    nonAuthorityStatement: "This proof covers one fixed alternate source-ref namespace for the accepted Button and InLineAlert bundle. It does not prove arbitrary namespaces, broader P2 coverage, live connectors, self-serve connection, production adapters, SurfaceOps expansion, or JudgmentKit.",
    provenance: provenance("interfacectl-source-family-namespace-mapping-report", [namespacePackageRef.path, mappingRef.path, SFNM_LAYOUT_EVIDENCE_PATH])
  };
}

async function buildEvidence({
  cwd,
  command,
  args,
  runId,
  namespacePackageRef,
  mappingRef,
  compilerRefs,
  proofImplementationRefs,
  runtimeRefs,
  normalizedEvidenceRemap,
  results,
  diagnostics
}) {
  const schemaClosure = [];
  for (const schemaPath of sfnmSchemaPaths()) {
    schemaClosure.push(artifactRef(schemaPath, sfnmSchemaIdForPath(schemaPath), await canonicalFileHash(path.join(cwd, schemaPath))));
  }
  const sourceFileRefs = [];
  for (const sourcePath of sfnmSourcePaths().slice(1)) {
    sourceFileRefs.push(artifactRef(sourcePath, sfnmSchemaIdForPath(sourcePath) || "declared-source-document.v0", await rawFileHash(path.join(cwd, sourcePath))));
  }
  const fixtureRefs = [];
  for (const fixturePath of sfnmFixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, sfnmSchemaIdForPath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const boundaryRefs = [];
  for (const boundaryPath of BOUNDARY_PATHS) {
    boundaryRefs.push(withBoundaryProvenance(artifactRef(boundaryPath, sfnmSchemaIdForPath(boundaryPath), await boundaryHash(cwd, boundaryPath))));
  }
  const artifacts = [];
  for (const artifactPath of SFNM_ARTIFACT_PATHS) {
    const hash = artifactPath === `${SFNM_ARTIFACT_ROOT}/evidence.json`
      ? null
      : await canonicalFileHash(path.join(cwd, artifactPath));
    artifacts.push(artifactRef(artifactPath, sfnmSchemaIdForPath(artifactPath), hash));
  }
  const evidence = {
    contractId: SFNM_CONTRACT_ID,
    schemaId: "source-family-namespace-mapping-evidence.v0",
    version: SFNM_VERSION,
    runId,
    checkedAt: SFNM_TIMESTAMP,
    command,
    args,
    environment: SFNM_ENVIRONMENT,
    schemaClosure,
    namespacePackageRef,
    mappingRef,
    sourceFileRefs,
    compilerRefs,
    proofImplementationRefs,
    runtimeRefs,
    fixtureRefs,
    boundaryRefs,
    artifacts,
    normalizedEvidenceRemap,
    normalizedEvidenceClosureVerified: true,
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: results,
    status: "pass",
    promotionStatus: "review_required",
    provenance: provenance("interfacectl-source-family-namespace-mapping-evidence", [
      namespacePackageRef.path,
      mappingRef.path,
      ...BOUNDARY_PATHS
    ])
  };
  evidence.artifacts.at(-1).hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

function withBoundaryProvenance(ref) {
  return {
    ...ref,
    provenance: provenance("interfacectl-source-family-namespace-mapping-boundary", [ref.path])
  };
}

async function boundaryHash(cwd, artifactPath) {
  if (artifactPath === SFNM_P2_EVIDENCE_PATH) {
    return p2Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  }
  if (artifactPath === SFNM_LAYOUT_EVIDENCE_PATH) {
    return sourceFamilyLayoutMappingInternals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  }
  return canonicalFileHash(path.join(cwd, artifactPath));
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifacts?.at(-1);
  if (finalRef?.path === `${SFNM_ARTIFACT_ROOT}/evidence.json`) finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  try {
    return await inspectEvidenceIntegrity(cwd, evidence);
  } catch (error) {
    return diagnosticCodeFromError(error) || "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
}

async function inspectEvidenceIntegrity(cwd, evidence) {
  await assertSafeCommandInputs(cwd, [
    SFNM_SOURCE_ROOT,
    SFNM_MAPPING_PATH,
    SFNM_NAMESPACE_PACKAGE_PATH,
    SFNM_P2_EVIDENCE_PATH,
    SFNM_P2_CATALOG_PATH,
    SFNM_LAYOUT_EVIDENCE_PATH,
    SFNM_FIXTURE_ROOT
  ], SFNM_ARTIFACT_ROOT);
  await assertFixedInputClosures(cwd);
  await assertPersistedOutputClosure(cwd);
  const validators = await loadValidators(cwd);
  if (
    evidence?.contractId !== SFNM_CONTRACT_ID ||
    evidence.schemaId !== "source-family-namespace-mapping-evidence.v0" ||
    evidence.version !== SFNM_VERSION ||
    evidence.checkedAt !== SFNM_TIMESTAMP ||
    evidence.command !== SFNM_COMMAND ||
    canonicalJson(evidence.args) !== canonicalJson(defaultNamespaceMappingArgs()) ||
    canonicalJson(evidence.environment) !== canonicalJson(SFNM_ENVIRONMENT)
  ) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";

  if (canonicalJson((evidence.schemaClosure || []).map((entry) => entry.path)) !== canonicalJson(sfnmSchemaPaths())) {
    return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
  if (
    evidence.namespacePackageRef?.path !== SFNM_NAMESPACE_PACKAGE_PATH ||
    evidence.namespacePackageRef.hash !== await rawFileHash(path.join(cwd, SFNM_NAMESPACE_PACKAGE_PATH))
  ) return "SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH";
  if (
    evidence.mappingRef?.path !== SFNM_MAPPING_PATH ||
    evidence.mappingRef.hash !== await rawFileHash(path.join(cwd, SFNM_MAPPING_PATH))
  ) return "SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH";

  const immutable = await verifyImmutableNamespaceInputs(cwd);
  assertNormalizationCounts(immutable.normalization, immutable.namespacePackage);
  const expectedSourcePaths = sfnmSourcePaths().slice(1);
  if (canonicalJson((evidence.sourceFileRefs || []).map((entry) => entry.path)) !== canonicalJson(expectedSourcePaths)) {
    return "SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH";
  }
  for (const ref of evidence.sourceFileRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH";
  }

  assertCompilerRuntime(immutable.namespacePackage, Number(process.versions.node.split(".")[0]));
  const expectedCompilerRefs = await buildCheckedRefs(cwd, immutable.namespacePackage.compiler.implementationRefs, "javascript-source", "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH");
  const expectedRuntimeRefs = await buildCheckedRefs(cwd, immutable.namespacePackage.compiler.runtime.dependencyRefs, "node-package-input", "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH");
  const expectedProofImplementationRefs = await buildCurrentRefs(cwd, SFNM_PROOF_IMPLEMENTATION_PATHS, "proof-implementation", "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH");
  if (canonicalJson(evidence.compilerRefs) !== canonicalJson(expectedCompilerRefs)) return "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH";
  if (canonicalJson(evidence.proofImplementationRefs) !== canonicalJson(expectedProofImplementationRefs)) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  if (canonicalJson(evidence.runtimeRefs) !== canonicalJson(expectedRuntimeRefs)) return "SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH";

  if (canonicalJson((evidence.fixtureRefs || []).map((entry) => entry.path)) !== canonicalJson(sfnmFixturePaths())) {
    return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.boundaryRefs || []).map((entry) => entry.path)) !== canonicalJson(BOUNDARY_PATHS)) {
    return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
  }
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.hash !== await boundaryHash(cwd, ref.path)) return "SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.artifacts || []).map((entry) => entry.path)) !== canonicalJson(SFNM_ARTIFACT_PATHS)) {
    return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${SFNM_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.at(-1);
  if (
    !finalRef ||
    finalRef.path !== `${SFNM_ARTIFACT_ROOT}/evidence.json` ||
    finalRef.hash !== computeEvidenceSelfHash(evidence)
  ) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";

  const mappingRef = artifactRef(SFNM_MAPPING_PATH, "source-family-namespace-mapping.v0", await rawFileHash(path.join(cwd, SFNM_MAPPING_PATH)));
  const expectedRemap = sfnmNormalizedEvidenceRemap(mappingRef);
  if (
    evidence.normalizedEvidenceClosureVerified !== true ||
    canonicalJson(evidence.normalizedEvidenceRemap) !== canonicalJson(expectedRemap) ||
    await firstPersistedNormalizedEvidenceIntegrityFailureCode(cwd, evidence.normalizedEvidenceRemap, immutable.normalization, validators) !== null
  ) return "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID";

  const p2Evidence = await readJson(path.join(cwd, SFNM_P2_EVIDENCE_PATH));
  const p2Catalog = await readJson(path.join(cwd, SFNM_P2_CATALOG_PATH));
  const layoutEvidence = await readJson(path.join(cwd, SFNM_LAYOUT_EVIDENCE_PATH));
  const layoutReport = await readJson(path.join(cwd, LAYOUT_REPORT_PATH));
  await assertUpstreamIntegrity({ cwd, p2Evidence, p2Catalog, layoutEvidence, layoutReport });
  const normalizedRun = await runNormalizedCompilerBundle({ cwd, normalization: immutable.normalization, validators, mappingRef });
  const persisted = await readPersistedNormalizedArtifacts(cwd, validators);
  for (const [, , innerFile] of SFNM_CAPTURED_ARTIFACTS) {
    if (canonicalJson(persisted.get(innerFile)) !== canonicalJson(normalizedRun.artifacts.get(innerFile))) {
      return "SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID";
    }
  }
  const baselineComparison = await compareNormalizedRun({ cwd, normalizedRun, layoutReport, p2Catalog, normalization: immutable.normalization });
  const namespacePackageRef = artifactRef(SFNM_NAMESPACE_PACKAGE_PATH, "source-family-namespace-package.v0", await rawFileHash(path.join(cwd, SFNM_NAMESPACE_PACKAGE_PATH)));
  const expectedReceipt = buildNamespaceReceipt({
    namespacePackageRef,
    mappingRef,
    mapping: immutable.mapping,
    normalization: immutable.normalization
  });
  const receiptPath = `${SFNM_ARTIFACT_ROOT}/namespace-mapping-receipt.json`;
  const receipt = await readJson(path.join(cwd, receiptPath));
  assertSchema(validators, "source-family-namespace-mapping-receipt.v0", receipt, receiptPath);
  if (canonicalJson(receipt) !== canonicalJson(expectedReceipt)) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  const receiptRef = artifactRef(receiptPath, "source-family-namespace-mapping-receipt.v0", await canonicalFileHash(path.join(cwd, receiptPath)));

  const { expectations, fixtures } = await loadFixtureContract({ cwd, fixtureRoot: SFNM_FIXTURE_ROOT, validators, namespacePackage: immutable.namespacePackage });
  const authorityExpansionProbe = await runAuthorityExpansionProbe({
    cwd,
    normalization: immutable.normalization,
    baselineArtifactHashes: await artifactHashSnapshot(cwd, SFNM_CAPTURED_ARTIFACTS.map(([file]) => `${SFNM_ARTIFACT_ROOT}/${file}`))
  });
  const results = await evaluateFixtures({
    cwd,
    expectations,
    fixtures,
    mapping: immutable.mapping,
    namespacePackage: immutable.namespacePackage,
    normalization: immutable.normalization,
    p2Evidence,
    p2Catalog,
    layoutEvidence,
    layoutReport,
    compilerRefs: expectedCompilerRefs,
    receipt: expectedReceipt,
    baselineComparison,
    normalizedEvidenceRemap: expectedRemap,
    validators
  });
  if (results.some((row) => !row.matched)) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  const diagnostics = diagnosticsForResults(results);
  const runId = buildRunId({
    namespacePackage: immutable.namespacePackage,
    mapping: immutable.mapping,
    expectations,
    compilerRefs: expectedCompilerRefs,
    proofImplementationRefs: expectedProofImplementationRefs,
    runtimeRefs: expectedRuntimeRefs,
    baselineComparison,
    authorityExpansionProbe,
    normalizedEvidenceRemap: expectedRemap
  });
  const expectedReport = buildReport({
    runId,
    namespacePackageRef,
    mappingRef,
    compilerRefs: expectedCompilerRefs,
    proofImplementationRefs: expectedProofImplementationRefs,
    runtimeRefs: expectedRuntimeRefs,
    receiptRef,
    normalizedEvidenceRemap: expectedRemap,
    normalizationVerification: buildNormalizationVerification(immutable.normalization),
    baselineComparison,
    authorityExpansionProbe,
    results,
    diagnostics
  });
  const reportPath = `${SFNM_ARTIFACT_ROOT}/source-family-namespace-mapping-report.json`;
  const report = await readJson(path.join(cwd, reportPath));
  assertSchema(validators, "source-family-namespace-mapping-report.v0", report, reportPath);
  if (canonicalJson(report) !== canonicalJson(expectedReport)) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  const expectedEvidence = await buildEvidence({
    cwd,
    command: SFNM_COMMAND,
    args: defaultNamespaceMappingArgs(),
    runId,
    namespacePackageRef,
    mappingRef,
    compilerRefs: expectedCompilerRefs,
    proofImplementationRefs: expectedProofImplementationRefs,
    runtimeRefs: expectedRuntimeRefs,
    normalizedEvidenceRemap: expectedRemap,
    results,
    diagnostics
  });
  const evidenceResult = results.find((row) => row.diagnosticCodes.includes("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH"));
  const evidenceFixture = evidenceResult ? fixtures.get(evidenceResult.fixturePath) : null;
  const causalOutcome = await evaluateFinalEvidenceFixture({ cwd, fixture: evidenceFixture, evidence: expectedEvidence });
  if (
    !evidenceResult ||
    causalOutcome.actualResult !== evidenceResult.actualResult ||
    causalOutcome.promotionStatus !== evidenceResult.promotionStatus ||
    canonicalJson(causalOutcome.diagnosticCode ? [causalOutcome.diagnosticCode] : []) !== canonicalJson(evidenceResult.diagnosticCodes)
  ) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  if (canonicalJson(evidence) !== canonicalJson(expectedEvidence)) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  const validate = validators.get("source-family-namespace-mapping-evidence.v0");
  if (!validate || !validate(evidence)) return "SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH";
  return null;
}

async function listIndependentRegularFiles(cwd, relativeRoot, code) {
  const files = [];
  const identities = new Set();
  async function visit(relative = "") {
    const absolute = path.join(cwd, relativeRoot, relative);
    for (const name of (await fs.readdir(absolute)).sort()) {
      if (name.startsWith(".")) throw contractError(`${code}: hidden entry ${name}`, 1);
      const next = relative ? `${relative}/${name}` : name;
      const stat = await fs.lstat(path.join(cwd, relativeRoot, next));
      if (stat.isSymbolicLink()) throw contractError(`${code}: symlink ${next}`, 1);
      if (stat.isDirectory()) {
        await visit(next);
        continue;
      }
      if (!stat.isFile()) throw contractError(`${code}: non-regular entry ${next}`, 1);
      const identity = `${stat.dev}:${stat.ino}`;
      if (stat.nlink !== 1 || identities.has(identity)) throw contractError(`${code}: hardlink alias ${next}`, 1);
      identities.add(identity);
      files.push({ path: next, identity });
    }
  }
  await visit();
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), independentRegularFilesVerified: true };
}

function assertSafeRelativePath(relativePath, label, exitCode) {
  const parsed = p2Internals.parseRelativePosixPath(relativePath, label);
  if (!parsed.ok || parsed.path !== relativePath || relativePath.split("/").some((segment) => segment.startsWith("."))) {
    throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: unsafe ${label}: ${relativePath}`, exitCode);
  }
}

function resolveContainedPath(root, relativePath) {
  assertSafeRelativePath(relativePath, "contained path", 1);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...relativePath.split("/"));
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw contractError(`SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: path escapes temporary root: ${relativePath}`, 1);
  }
  return resolved;
}

function jsonPointerSegments(pointer) {
  if (typeof pointer !== "string" || pointer.length < 2 || !pointer.startsWith("/")) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: invalid JSON pointer", 1);
  }
  const segments = pointer.slice(1).split("/").map((segment) => {
    if (/~(?![01])/u.test(segment)) throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: invalid JSON pointer escape", 1);
    return segment.replace(/~1/g, "/").replace(/~0/g, "~");
  });
  if (segments.some((segment) => segment.length === 0 || ["__proto__", "prototype", "constructor"].includes(segment))) {
    throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: unsafe JSON pointer", 1);
  }
  return segments;
}

function setJsonPointer(target, pointer, value) {
  const segments = jsonPointerSegments(pointer);
  let current = target;
  for (const segment of segments.slice(0, -1)) {
    if (current === null || typeof current !== "object") throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: JSON pointer traverses a non-container", 1);
    if (!Object.prototype.hasOwnProperty.call(current, segment)) current[segment] = {};
    current = current[segment];
  }
  if (current === null || typeof current !== "object") throw contractError("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH: JSON pointer target is not a container", 1);
  current[segments.at(-1)] = value;
}

function valueAtJsonPointer(target, pointer) {
  let current = target;
  for (const segment of jsonPointerSegments(pointer)) {
    if (current === null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function diagnosticCodeFromError(error) {
  return String(error?.message || error).match(/SOURCE_NAMESPACE_[A-Z_]+/)?.[0] || null;
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validators = new Map();
  const schemas = [];
  for (const schemaPath of sfnmSchemaPaths()) schemas.push([schemaPath, await readJson(path.join(cwd, schemaPath))]);
  for (const [, schema] of schemas) ajv.addSchema(schema);
  for (const [schemaPath, schema] of schemas) validators.set(path.posix.basename(schemaPath).replace(/\.schema\.json$/, ""), ajv.getSchema(schema.$id));
  return validators;
}

function assertSchema(validators, schemaId, value, label) {
  const validate = validators.get(schemaId);
  if (!validate) throw contractError(`missing validator for ${schemaId}`, 1);
  if (!validate(value)) {
    const detail = (validate.errors || []).map((entry) => `${entry.instancePath || "/"} ${entry.message}`).join("; ");
    throw contractError(`${label} failed ${schemaId}: ${detail}`, 1);
  }
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const sourceFamilyNamespaceMappingInternals = {
  parseSourceFamilyNamespaceMappingArgs,
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  firstPersistedNormalizedEvidenceIntegrityFailureCode,
  firstUpstreamIntegrityFailureCode,
  assertCompilerRuntime,
  assertExactFixtureDocument,
  assertFixtureMutationSafety,
  assertPersistedOutputClosure,
  resolveContainedPath,
  listIndependentRegularFiles,
  prepareOutputRoot,
  exactAuthorityExpansionFinding,
  hasExactAuthorityExpansionFailure,
  setJsonPointer
};
