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
import {
  SFP_ARTIFACT_PATHS,
  SFP_ARTIFACT_ROOT,
  SFP_CANDIDATE_SOURCE_ROOT,
  SFP_CAPTURED_ARTIFACTS,
  SFP_COMMAND,
  SFP_CONTRACT_ID,
  SFP_ENVIRONMENT,
  SFP_EXPECTATION_ROWS,
  SFP_FIXTURE_ROOT,
  SFP_PACKAGE_PATH,
  SFP_P2_CATALOG_PATH,
  SFP_P2_EVIDENCE_PATH,
  SFP_PRIMARY_CATALOG_PATH,
  SFP_PRIMARY_EVIDENCE_PATH,
  SFP_SCHEMA_ROOT,
  SFP_TIMESTAMP,
  SFP_VERSION,
  artifactRef,
  diagnosticsRegistry,
  provenance,
  sfpArtifactOrder,
  sfpCandidateEvidenceRemap,
  sfpFixturePaths,
  sfpReferencedReviewRoutes,
  sfpSchemaIdForPath,
  sfpSchemaPaths,
  sfpSourcePaths
} from "./source-family-packaging-contract.js";

const execFileAsync = promisify(execFile);
const COMPILER_IMPLEMENTATION_PATHS = [
  "bin/interfacectl.js",
  "scripts/materialize-source-conformance.mjs",
  "src/p0.js",
  "src/p2-contract.js",
  "src/p2-proof.js",
  "src/source-conformance-contract.js",
  "src/source-conformance-proof.js"
];
const RUNTIME_DEPENDENCY_PATHS = ["package.json", "package-lock.json"];
const IMMUTABLE_CATALOG_FIELDS = [
  "catalogId",
  "artifactKind",
  "schemaId",
  "version",
  "tokens",
  "components",
  "runtimeCapabilities",
  "diagnostics",
  "compatibility"
];
const BOUNDARY_PATHS = [
  SFP_P2_EVIDENCE_PATH,
  SFP_P2_CATALOG_PATH,
  SFP_PRIMARY_EVIDENCE_PATH,
  SFP_PRIMARY_CATALOG_PATH
];

// Kept as a function export so the contract module remains the single owner of
// generated artifact ordering while the proof can use the value without
// duplicating it.
function generatedArtifactPaths() {
  return SFP_ARTIFACT_PATHS;
}

export async function runSourceFamilyPackagingInterfacectl(argv, io) {
  const parsed = parseSourceFamilyPackagingArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSourceFamilyPackagingProof({
      cwd: io.cwd,
      packagePath: parsed.package,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      primaryEvidencePath: parsed.sourceConformanceEvidence,
      primaryCatalogPath: parsed.sourceConformanceCatalog,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: SFP_COMMAND,
      args: {
        package: parsed.package,
        ingestionEvidence: parsed.ingestionEvidence,
        catalog: parsed.catalog,
        sourceConformanceEvidence: parsed.sourceConformanceEvidence,
        sourceConformanceCatalog: parsed.sourceConformanceCatalog,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces source-family-packaging proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `acceptedCompilerRuns: ${result.acceptedCompilerRuns}`,
      `causalProbeRuns: ${result.causalProbeRuns}`,
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

function parseSourceFamilyPackagingArgs(argv) {
  const result = {};
  const flags = new Map([
    ["--package", "package"],
    ["--ingestion-evidence", "ingestionEvidence"],
    ["--catalog", "catalog"],
    ["--source-conformance-evidence", "sourceConformanceEvidence"],
    ["--source-conformance-catalog", "sourceConformanceCatalog"],
    ["--fixture", "fixture"],
    ["--out", "out"]
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const key = flags.get(argv[index]);
    if (!key) return { ok: false, error: `unexpected argument: ${argv[index]}` };
    if (index + 1 >= argv.length) return { ok: false, error: `missing value for ${argv[index]}` };
    const parsed = p2Internals.parseRelativePosixPath(argv[index + 1], argv[index]);
    if (!parsed.ok) return parsed;
    result[key] = parsed.path;
    index += 1;
  }
  if ([...flags.values()].some((key) => !result[key])) {
    return { ok: false, error: usage() };
  }
  return { ok: true, ...result };
}

function usage() {
  return `usage: ${SFP_COMMAND} --package ${SFP_PACKAGE_PATH} --ingestion-evidence ${SFP_P2_EVIDENCE_PATH} --catalog ${SFP_P2_CATALOG_PATH} --source-conformance-evidence ${SFP_PRIMARY_EVIDENCE_PATH} --source-conformance-catalog ${SFP_PRIMARY_CATALOG_PATH} --fixture ${SFP_FIXTURE_ROOT} --out ${SFP_ARTIFACT_ROOT}`;
}

export async function runSourceFamilyPackagingProof({
  cwd,
  packagePath,
  ingestionEvidencePath,
  catalogPath,
  primaryEvidencePath,
  primaryCatalogPath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({ packagePath, ingestionEvidencePath, catalogPath, primaryEvidencePath, primaryCatalogPath, fixtureRoot, outRoot });
  const validators = await loadValidators(cwd);
  const packageFixture = await readJson(path.join(cwd, packagePath));
  assertSchema(validators, "source-family-package.v0", packageFixture, packagePath);
  assertPackageContract(packageFixture);
  const compilerRefs = await buildCompilerRefs(cwd, packageFixture);
  const runtimeRefs = await buildRuntimeRefs(cwd, packageFixture);

  const manifest = await readJson(path.join(cwd, packageFixture.candidateBundle.manifestPath));
  const profilePath = `${packageFixture.candidateBundle.sourceRoot}/${packageFixture.candidateBundle.authorityProfilePath}`;
  const profile = await readJson(path.join(cwd, profilePath));
  assertSchema(validators, "declared-source-manifest.v0", manifest, packageFixture.candidateBundle.manifestPath);
  assertSchema(validators, "source-authority-profile.v0", profile, profilePath);
  await assertCandidateBundle(cwd, packageFixture, manifest, profile, validators);

  const expectationsPath = `${fixtureRoot}/expectations.manifest.json`;
  const expectations = await readJson(path.join(cwd, expectationsPath));
  assertSchema(validators, "source-family-packaging-expectations.v0", expectations, expectationsPath);
  assertExpectations(expectations, packageFixture, manifest);
  const fixtures = new Map();
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    assertSchema(validators, "source-family-packaging-fixture.v0", fixture, expectation.fixturePath);
    fixtures.set(expectation.fixturePath, fixture);
  }

  const p2Evidence = await readJson(path.join(cwd, ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, catalogPath));
  const primaryEvidence = await readJson(path.join(cwd, primaryEvidencePath));
  const primaryCatalog = await readJson(path.join(cwd, primaryCatalogPath));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, ingestionEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, catalogPath);
  assertSchema(validators, "source-conformance-evidence.v0", primaryEvidence, primaryEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", primaryCatalog, primaryCatalogPath);
  await assertUpstreamIntegrity(cwd, p2Evidence, p2Catalog, primaryEvidence, primaryCatalog);

  const primaryManifest = await readJson(path.join(cwd, primaryEvidence.sourceManifestRef.path));
  const primaryProfile = await readJson(path.join(cwd, primaryEvidence.authorityProfileRef.path));
  const primaryCoverage = await readJson(path.join(cwd, `${SC_ARTIFACT_ROOT}/source-fact-coverage.json`));
  assertSchema(validators, "declared-source-manifest.v0", primaryManifest, primaryEvidence.sourceManifestRef.path);
  assertSchema(validators, "source-authority-profile.v0", primaryProfile, primaryEvidence.authorityProfileRef.path);
  assertSchema(validators, "source-fact-coverage.v0", primaryCoverage, `${SC_ARTIFACT_ROOT}/source-fact-coverage.json`);

  const primaryExecution = await runAcceptedCompilerBundle({
    cwd,
    sourceRoot: SC_SOURCE_ROOT,
    manifest: primaryManifest,
    validators,
    workspacePrefix: "surfaces-source-family-primary-"
  });
  await assertTrackedPrimaryArtifacts(cwd, primaryExecution.artifacts);

  const candidateExecution = await runAcceptedCompilerBundle({
    cwd,
    sourceRoot: packageFixture.candidateBundle.sourceRoot,
    manifest,
    validators,
    workspacePrefix: "surfaces-source-family-candidate-"
  });
  const candidateArtifacts = candidateExecution.artifacts;
  const candidateEvidence = candidateExecution.evidence;
  const sourceBytesPreserved = primaryExecution.sourceBytesPreserved && candidateExecution.sourceBytesPreserved;

  const candidateCatalog = candidateArtifacts.get("governed-catalog.json");
  const candidateCoverage = candidateArtifacts.get("source-fact-coverage.json");
  const candidateReport = candidateArtifacts.get("source-conformance-report.json");
  assertAcceptedCompilerRun(primaryExecution.evidence, primaryExecution.artifacts.get("source-conformance-report.json"), packageFixture);
  assertAcceptedCompilerRun(candidateEvidence, candidateReport, packageFixture);
  const primaryFactValueIndex = await buildSourceFactValueIndex(cwd, SC_SOURCE_ROOT, primaryManifest);
  const candidateFactValueIndex = await buildSourceFactValueIndex(cwd, packageFixture.candidateBundle.sourceRoot, manifest);
  const capabilityComparison = compareCapabilities({
    p2Catalog,
    primaryCatalog,
    candidateCatalog,
    primaryCoverage,
    candidateCoverage,
    primaryFactValueIndex,
    candidateFactValueIndex,
    primaryEvidence,
    candidateEvidence,
    packageFixture
  });
  const distinctness = await compareBundleIdentity(cwd, primaryEvidence, primaryManifest, primaryProfile, packageFixture, manifest, profile);
  const authorityExpansionProbe = await runAuthorityExpansionProbe(cwd, packageFixture);

  await prepareOutputRoot(cwd, outRoot);
  for (const [capturedFile, , innerFile] of SFP_CAPTURED_ARTIFACTS) {
    await writeCanonicalJson(path.join(cwd, outRoot, capturedFile), candidateArtifacts.get(innerFile));
  }
  const candidateEvidenceRemap = sfpCandidateEvidenceRemap();
  const candidateClosureCode = await firstPersistedCandidateEvidenceIntegrityFailureCode(cwd, candidateEvidenceRemap);
  if (candidateClosureCode !== null) {
    throw contractError(`SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH: persisted candidate compiler closure failed integrity: ${candidateClosureCode}`, 1);
  }

  const results = await evaluateFixtures({
    cwd,
    expectations,
    fixtures,
    packageFixture,
    manifest,
    profile,
    candidateReportPath: `${outRoot}/candidate-source-conformance-report.json`
  });
  if (results.some((row) => !row.matched)) {
    const mismatches = results.filter((row) => !row.matched).map((row) => `${row.fixturePath}: expected ${row.expectedResult}/${row.promotionStatus}/${row.diagnosticCodes.join(",") || "none"} got ${row.actualResult}/${row.promotionStatus}`).join("; ");
    throw contractError(`source-family packaging validation expectation mismatch: ${mismatches}`, 1);
  }

  const packageRef = artifactRef(packagePath, "source-family-package.v0", await canonicalFileHash(path.join(cwd, packagePath)));
  const candidateManifestRef = artifactRef(packageFixture.candidateBundle.manifestPath, "declared-source-manifest.v0", await canonicalFileHash(path.join(cwd, packageFixture.candidateBundle.manifestPath)));
  const candidateAuthorityProfileRef = artifactRef(profilePath, "source-authority-profile.v0", await rawFileHash(path.join(cwd, profilePath)), profile.sourceRef);
  const finalCompilerRefs = await buildCompilerRefs(cwd, packageFixture);
  const finalRuntimeRefs = await buildRuntimeRefs(cwd, packageFixture);
  if (canonicalJson(finalCompilerRefs) !== canonicalJson(compilerRefs) || canonicalJson(finalRuntimeRefs) !== canonicalJson(runtimeRefs)) {
    throw contractError("SOURCE_FAMILY_COMPILER_HASH_MISMATCH: compiler or runtime closure changed during proof execution", 1);
  }
  const runId = buildRunId({ packageFixture, manifest, expectations, compilerRefs, runtimeRefs, capabilityComparison, authorityExpansionProbe, candidateEvidenceRemap });
  const diagnostics = diagnosticsForResults(results);
  const primaryRun = await runSummary({
    cwd,
    role: "accepted-primary",
    evidencePath: primaryEvidencePath,
    catalogPath: primaryCatalogPath,
    manifest: primaryManifest,
    profile: primaryProfile,
    coverage: primaryCoverage,
    command: primaryEvidence.command
  });
  const candidateRun = await runSummary({
    cwd,
    role: "packaged-candidate",
    evidencePath: `${outRoot}/candidate-source-conformance-evidence.json`,
    catalogPath: `${outRoot}/candidate-governed-catalog.json`,
    manifest,
    profile,
    coverage: candidateCoverage,
    command: candidateEvidence.command
  });

  const report = {
    schemaId: "source-family-packaging-report.v0",
    version: SFP_VERSION,
    runId,
    packageRef,
    candidateManifestRef,
    candidateAuthorityProfileRef,
    compilerRefs,
    runtimeRefs,
    primaryRun,
    candidateRun,
    candidateEvidenceRemap,
    candidateEvidenceClosureVerified: true,
    distinctness,
    capabilityComparison,
    authorityExpansionProbe,
    results,
    diagnostics,
    compilerExecutions: { acceptedBundlePasses: 2, causalProbeFailures: 1, total: 3 },
    sourceBytesPreserved,
    diagnosticsRegistry: diagnosticsRegistry(),
    status: "pass",
    promotionStatus: "review_required",
    nonAuthorityStatement: "This proof covers a second compatible instance of the fixed declared-local-source-bundle.v0 package for Button and InLineAlert. It does not prove broader P2 coverage, arbitrary layouts, live connectors, self-serve connection, production adapters, or live JudgmentKit.",
    provenance: provenance("interfacectl-source-family-packaging-report", [packagePath, primaryEvidencePath])
  };
  assertSchema(validators, "source-family-packaging-report.v0", report, `${outRoot}/source-family-packaging-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-family-packaging-report.json"), report);

  const evidence = await buildEvidence({
    cwd,
    command,
    args,
    runId,
    packageFixture,
    manifest,
    profile,
    packageRef,
    candidateManifestRef,
    candidateAuthorityProfileRef,
    compilerRefs,
    runtimeRefs,
    candidateEvidenceRemap,
    results,
    diagnostics
  });
  assertSchema(validators, "source-family-packaging-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`source-family packaging evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status: "pass",
    promotionStatus: "review_required",
    matchedCount: results.length,
    totalCount: results.length,
    acceptedCompilerRuns: 2,
    causalProbeRuns: 1,
    sourceBytesPreserved,
    artifacts: generatedArtifactPaths()
  };
}

function assertCommandRoots(paths) {
  if (
    paths.packagePath !== SFP_PACKAGE_PATH ||
    paths.ingestionEvidencePath !== SFP_P2_EVIDENCE_PATH ||
    paths.catalogPath !== SFP_P2_CATALOG_PATH ||
    paths.primaryEvidencePath !== SFP_PRIMARY_EVIDENCE_PATH ||
    paths.primaryCatalogPath !== SFP_PRIMARY_CATALOG_PATH ||
    paths.fixtureRoot !== SFP_FIXTURE_ROOT ||
    paths.outRoot !== SFP_ARTIFACT_ROOT
  ) {
    throw contractError(usage(), 2);
  }
}

function assertPackageContract(packageFixture) {
  if (
    packageFixture.candidateBundle.sourceRoot !== SFP_CANDIDATE_SOURCE_ROOT ||
    packageFixture.candidateBundle.manifestPath !== `${SFP_CANDIDATE_SOURCE_ROOT}/manifest.json` ||
    packageFixture.compiler.familySpecificModule !== null ||
    packageFixture.compiler.virtualLayout.sourceRoot !== SC_SOURCE_ROOT ||
    packageFixture.compiler.virtualLayout.fixtureRoot !== SC_FIXTURE_ROOT ||
    packageFixture.compiler.virtualLayout.artifactRoot !== SC_ARTIFACT_ROOT
  ) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: package descriptor is outside the checked source-family package boundary", 1);
  }
  const implementationPaths = packageFixture.compiler.implementationRefs.map((ref) => ref.path);
  const runtimePaths = packageFixture.compiler.runtime.dependencyRefs.map((ref) => ref.path);
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (
    canonicalJson(implementationPaths) !== canonicalJson(COMPILER_IMPLEMENTATION_PATHS) ||
    canonicalJson(runtimePaths) !== canonicalJson(RUNTIME_DEPENDENCY_PATHS) ||
    packageFixture.compiler.runtime.nodeMajor !== 22 ||
    nodeMajor !== packageFixture.compiler.runtime.nodeMajor
  ) {
    throw contractError("SOURCE_FAMILY_COMPILER_HASH_MISMATCH: compiler implementation closure drift", 1);
  }
}

async function assertCandidateBundle(cwd, packageFixture, manifest, profile, validators) {
  const root = packageFixture.candidateBundle.sourceRoot;
  if (await rawFileHash(path.join(cwd, packageFixture.candidateBundle.manifestPath)) !== packageFixture.candidateBundle.manifestHash) {
    throw contractError("SOURCE_FAMILY_BUNDLE_HASH_MISMATCH: candidate manifest bytes do not match the package descriptor", 1);
  }
  const expectedRelativeFiles = ["manifest.json", ...manifest.sourceFiles.map((entry) => entry.path)].sort();
  const actualRelativeFiles = await listRegularFiles(path.join(cwd, root));
  if (canonicalJson(actualRelativeFiles) !== canonicalJson(expectedRelativeFiles)) {
    throw contractError("SOURCE_FAMILY_BUNDLE_HASH_MISMATCH: candidate bundle file closure drift", 1);
  }
  if (canonicalJson(manifest.sourceFiles.map((entry) => entry.path)) !== canonicalJson(SC_SOURCE_FILES)) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: candidate bundle does not implement the fixed source-family file ABI", 1);
  }
  for (const entry of manifest.sourceFiles) {
    const filePath = `${root}/${entry.path}`;
    await assertRegularFile(path.join(cwd, filePath), filePath);
    const actualHash = await rawFileHash(path.join(cwd, filePath));
    if (actualHash !== entry.sha256) {
      throw contractError(`SOURCE_FAMILY_BUNDLE_HASH_MISMATCH: ${filePath} does not match its manifest hash`, 1);
    }
    const expectedRef = `${packageFixture.compiler.virtualLayout.sourceRefNamespace}${entry.path}#/`;
    if (entry.sourceRefRoot !== expectedRef) {
      throw contractError(`SOURCE_FAMILY_SCOPE_EXPANSION: source ref namespace drift for ${entry.path}`, 1);
    }
    const data = await readJson(path.join(cwd, filePath));
    assertSchema(validators, entry.path === packageFixture.candidateBundle.authorityProfilePath ? "source-authority-profile.v0" : "declared-source-document.v0", data, filePath);
  }
  const componentIds = [...new Set(profile.componentBindings.map((entry) => entry.componentId))].sort();
  const reviewResolution = sfpReferencedReviewRoutes(profile);
  if (
    manifest.sourceBundleId !== packageFixture.candidateBundle.expectedSourceBundleId ||
    profile.profileId !== packageFixture.candidateBundle.expectedProfileId ||
    reviewResolution.valid !== true ||
    canonicalJson(reviewResolution.owners) !== canonicalJson([packageFixture.candidateBundle.expectedOwner]) ||
    canonicalJson(componentIds) !== canonicalJson([...packageFixture.candidateBundle.expectedComponentIds].sort())
  ) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: candidate bundle identity or component scope drift", 1);
  }
}

function assertExpectations(expectations, packageFixture, manifest) {
  if (
    canonicalJson(expectations.inputs) !== canonicalJson(sfpFixturePaths()) ||
    canonicalJson(expectations.artifactOrder) !== canonicalJson(sfpArtifactOrder(packageFixture, manifest)) ||
    canonicalJson(expectations.expectations) !== canonicalJson(SFP_EXPECTATION_ROWS) ||
    canonicalJson(expectations.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry())
  ) {
    throw contractError("source-family packaging expectations manifest drift", 1);
  }
}

async function assertUpstreamIntegrity(cwd, p2Evidence, p2Catalog, primaryEvidence, primaryCatalog) {
  const p2Code = await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence);
  if (p2Code !== null || p2Evidence.status !== "pass") {
    throw contractError(`source-family packaging P2 boundary is not passing: ${p2Code || p2Evidence.status}`, 1);
  }
  const primaryCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(cwd, primaryEvidence);
  if (primaryCode !== null || primaryEvidence.status !== "pass" || primaryEvidence.promotionStatus !== "review_required") {
    throw contractError(`source-family packaging accepted compiler run is not passing: ${primaryCode || primaryEvidence.status}`, 1);
  }
  const p2CatalogRef = p2Evidence.artifactRefs.find((entry) => entry.path === SFP_P2_CATALOG_PATH);
  if (!p2CatalogRef || p2CatalogRef.hash !== await canonicalFileHash(path.join(cwd, SFP_P2_CATALOG_PATH))) {
    throw contractError("source-family packaging P2 catalog boundary hash mismatch", 1);
  }
  const primaryCatalogRef = primaryEvidence.artifacts.find((entry) => entry.path === SFP_PRIMARY_CATALOG_PATH);
  if (!primaryCatalogRef || primaryCatalogRef.hash !== await canonicalFileHash(path.join(cwd, SFP_PRIMARY_CATALOG_PATH))) {
    throw contractError("source-family packaging accepted catalog boundary hash mismatch", 1);
  }
  if (canonicalJson(Object.keys(primaryCatalog.components).sort()) !== canonicalJson(Object.keys(p2Catalog.components).sort())) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: accepted source-conformance catalog changed P2 component scope", 1);
  }
}

async function runAcceptedCompilerBundle({ cwd, sourceRoot, manifest, validators, workspacePrefix }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), workspacePrefix));
  try {
    await stageCompilerWorkspace(cwd, workspace, sourceRoot);
    const before = await sourceByteSnapshot(workspace, SC_SOURCE_ROOT, manifest);
    const compilerResult = await executeCompiler(cwd, workspace);
    if (compilerResult.exitCode !== 0) {
      throw contractError(`SOURCE_FAMILY_COMPILER_RUN_FAILED: ${stableChildFailure(compilerResult)}`, 1);
    }
    const after = await sourceByteSnapshot(workspace, SC_SOURCE_ROOT, manifest);
    const sourceBytesPreserved = canonicalJson(before) === canonicalJson(after);
    if (!sourceBytesPreserved) {
      throw contractError("SOURCE_FAMILY_BUNDLE_HASH_MISMATCH: source materialization or compilation changed team-owned bytes", 1);
    }
    const artifacts = await readCandidateArtifacts(workspace, validators);
    const evidence = artifacts.get("evidence.json");
    const integrityCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    if (integrityCode !== null) {
      throw contractError(`SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH: packaged compiler evidence failed integrity: ${integrityCode}`, 1);
    }
    return { artifacts, evidence, sourceBytesPreserved };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function stageCompilerWorkspace(cwd, workspace, sourceRoot) {
  await fs.cp(path.join(cwd, SFP_SCHEMA_ROOT), path.join(workspace, SFP_SCHEMA_ROOT), { recursive: true, dereference: false });
  await fs.mkdir(path.join(workspace, "fixtures"), { recursive: true });
  await fs.cp(path.join(cwd, SC_FIXTURE_ROOT), path.join(workspace, SC_FIXTURE_ROOT), { recursive: true, dereference: false });
  await fs.mkdir(path.join(workspace, path.dirname(SC_SOURCE_ROOT)), { recursive: true });
  await fs.cp(path.join(cwd, sourceRoot), path.join(workspace, SC_SOURCE_ROOT), { recursive: true, dereference: false });
  for (const artifactPath of [SFP_P2_EVIDENCE_PATH, SFP_P2_CATALOG_PATH]) {
    await fs.mkdir(path.join(workspace, path.dirname(artifactPath)), { recursive: true });
    await fs.copyFile(path.join(cwd, artifactPath), path.join(workspace, artifactPath));
  }
}

async function assertTrackedPrimaryArtifacts(cwd, executedArtifacts) {
  for (const [, , innerFile] of SFP_CAPTURED_ARTIFACTS) {
    const tracked = await readJson(path.join(cwd, SC_ARTIFACT_ROOT, innerFile));
    if (canonicalJson(tracked) !== canonicalJson(executedArtifacts.get(innerFile))) {
      throw contractError(`SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH: accepted primary compiler execution differs from tracked ${SC_ARTIFACT_ROOT}/${innerFile}`, 1);
    }
  }
}

async function firstPersistedCandidateEvidenceIntegrityFailureCode(cwd, remap) {
  if (canonicalJson(remap) !== canonicalJson(sfpCandidateEvidenceRemap())) {
    return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-family-persisted-verify-"));
  try {
    await stageCompilerWorkspace(cwd, workspace, remap.physicalSourceRoot);
    const materializer = await executeMaterializer(cwd, workspace);
    if (materializer.exitCode !== 0) return "SOURCE_FAMILY_COMPILER_RUN_FAILED";
    for (const mapping of remap.artifactMappings) {
      await fs.mkdir(path.join(workspace, path.dirname(mapping.logicalPath)), { recursive: true });
      await fs.copyFile(path.join(cwd, mapping.persistedPath), path.join(workspace, mapping.logicalPath));
    }
    const evidenceMapping = remap.artifactMappings.find((mapping) => mapping.logicalPath === `${SC_ARTIFACT_ROOT}/evidence.json`);
    if (!evidenceMapping) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
    const evidence = await readJson(path.join(workspace, evidenceMapping.logicalPath));
    const innerCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    return innerCode === null ? null : "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  } catch {
    return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function executeCompiler(cwd, workspace) {
  const materializer = await executeMaterializer(cwd, workspace);
  if (materializer.exitCode !== 0) return materializer;
  return executeChild(process.execPath, [
    path.join(cwd, "bin/interfacectl.js"),
    "surfaces", "source-conformance", "proof",
    "--source", SC_SOURCE_ROOT,
    "--ingestion-evidence", SFP_P2_EVIDENCE_PATH,
    "--catalog", SFP_P2_CATALOG_PATH,
    "--fixture", SC_FIXTURE_ROOT,
    "--out", SC_ARTIFACT_ROOT
  ], workspace);
}

async function executeMaterializer(cwd, workspace) {
  return executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
}

async function executeChild(file, argv, cwd) {
  try {
    const result = await execFileAsync(file, argv, {
      cwd,
      env: { ...process.env, TZ: "UTC", LC_ALL: "C", LANG: "C" },
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
  const message = `${result.stderr}\n${result.stdout}`.trim().split(/\r?\n/).filter(Boolean).at(-1);
  return message || `compiler exited ${result.exitCode}`;
}

async function sourceByteSnapshot(cwd, root, manifest) {
  const rows = [{ path: `${root}/manifest.json`, hash: await rawFileHash(path.join(cwd, root, "manifest.json")) }];
  for (const entry of manifest.sourceFiles) {
    rows.push({ path: `${root}/${entry.path}`, hash: await rawFileHash(path.join(cwd, root, entry.path)) });
  }
  return rows;
}

async function readCandidateArtifacts(workspace, validators) {
  const artifacts = new Map();
  for (const [, schemaId, innerFile] of SFP_CAPTURED_ARTIFACTS) {
    const artifactPath = `${SC_ARTIFACT_ROOT}/${innerFile}`;
    const data = await readJson(path.join(workspace, artifactPath));
    assertSchema(validators, schemaId, data, artifactPath);
    artifacts.set(innerFile, data);
  }
  return artifacts;
}

function assertAcceptedCompilerRun(evidence, report, packageFixture) {
  if (
    evidence.contractId !== "surfaces-source-conformance-proof" ||
    evidence.command !== packageFixture.compiler.command ||
    evidence.status !== "pass" ||
    evidence.promotionStatus !== packageFixture.candidateBundle.expectedPromotionStatus ||
    report.status !== "pass" ||
    report.promotionStatus !== packageFixture.candidateBundle.expectedPromotionStatus ||
    report.results.length !== 23 ||
    report.results.some((row) => !row.matched)
  ) {
    throw contractError("SOURCE_FAMILY_COMPILER_RUN_FAILED: accepted compiler result did not preserve the proof contract", 1);
  }
}

function compareCapabilities({ p2Catalog, primaryCatalog, candidateCatalog, primaryCoverage, candidateCoverage, primaryFactValueIndex, candidateFactValueIndex, primaryEvidence, candidateEvidence, packageFixture }) {
  const immutableFields = IMMUTABLE_CATALOG_FIELDS.map((field) => {
    const p2Hash = sha256Hex(canonicalJson(p2Catalog[field]));
    const primaryHash = sha256Hex(canonicalJson(primaryCatalog[field]));
    const candidateHash = sha256Hex(canonicalJson(candidateCatalog[field]));
    if (p2Hash !== primaryHash || p2Hash !== candidateHash) {
      throw contractError(`SOURCE_FAMILY_SCOPE_EXPANSION: immutable catalog field changed: ${field}`, 1);
    }
    return { field, p2Hash, primaryHash, candidateHash, matched: true };
  });
  const componentIds = Object.keys(candidateCatalog.components).sort();
  if (canonicalJson(componentIds) !== canonicalJson([...packageFixture.candidateBundle.expectedComponentIds].sort())) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: packaged catalog component scope drift", 1);
  }
  const primaryTuples = factTuples(primaryCoverage, primaryFactValueIndex);
  const candidateTuples = factTuples(candidateCoverage, candidateFactValueIndex);
  assertMatchingFactTuples(primaryTuples, candidateTuples);
  const schemaClosureMatched = canonicalJson(primaryEvidence.schemaClosure) === canonicalJson(candidateEvidence.schemaClosure);
  const p2BoundaryMatched = canonicalJson(primaryEvidence.boundaryRefs) === canonicalJson(candidateEvidence.boundaryRefs);
  if (!schemaClosureMatched || !p2BoundaryMatched) {
    throw contractError("SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH: packaged compiler closure or P2 boundary drift", 1);
  }
  const projection = Object.fromEntries(IMMUTABLE_CATALOG_FIELDS.map((field) => [field, p2Catalog[field]]));
  return {
    componentIds,
    factTuples: primaryTuples,
    immutableFields,
    immutableProjectionHash: sha256Hex(canonicalJson(projection)),
    schemaClosureMatched: true,
    factTuplesMatched: true,
    p2BoundaryMatched: true,
    authorityExpanded: false,
    compilerImplementationReused: true,
    familySpecificModule: null
  };
}

async function buildSourceFactValueIndex(cwd, sourceRoot, manifest) {
  const index = new Map();
  for (const entry of manifest.sourceFiles) {
    const document = await readJson(path.join(cwd, sourceRoot, entry.path));
    if (!Array.isArray(document.facts)) continue;
    for (const fact of document.facts) {
      if (index.has(fact.sourceRef)) {
        throw contractError(`SOURCE_FAMILY_SCOPE_EXPANSION: duplicate declared source fact reference: ${fact.sourceRef}`, 1);
      }
      index.set(fact.sourceRef, sha256Hex(canonicalJson(fact.value)));
    }
  }
  return index;
}

function factTuples(coverage, sourceFactValueIndex) {
  return coverage.componentCoverage.flatMap((component) => component.facts.map((fact) => ({
    componentId: component.componentId,
    catalogPointer: fact.catalogPointer,
    catalogValueHash: fact.catalogValueHash,
    primaryFact: sourceFactValueTuple(fact.primaryFactRef, sourceFactValueIndex),
    supportingFacts: fact.supportingFactRefs.map((sourceRef) => sourceFactValueTuple(sourceRef, sourceFactValueIndex))
      .sort((left, right) => left.sourceRef.localeCompare(right.sourceRef)),
    conflict: fact.conflict,
    resolution: fact.resolution,
    status: fact.status
  }))).sort((left, right) => `${left.componentId}\0${left.catalogPointer}`.localeCompare(`${right.componentId}\0${right.catalogPointer}`));
}

function sourceFactValueTuple(sourceRef, sourceFactValueIndex) {
  if (sourceRef === null) return null;
  if (!sourceFactValueIndex.has(sourceRef)) {
    throw contractError(`SOURCE_FAMILY_SCOPE_EXPANSION: coverage references an undeclared source fact: ${sourceRef}`, 1);
  }
  return { sourceRef, valueHash: sourceFactValueIndex.get(sourceRef) };
}

function assertMatchingFactTuples(primaryTuples, candidateTuples) {
  if (canonicalJson(primaryTuples) !== canonicalJson(candidateTuples)) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: packaged source facts differ from accepted source facts", 1);
  }
}

async function compareBundleIdentity(cwd, primaryEvidence, primaryManifest, primaryProfile, packageFixture, manifest, profile) {
  const primaryProfileHash = await rawFileHash(path.join(cwd, primaryEvidence.authorityProfileRef.path));
  const candidateProfileHash = await rawFileHash(path.join(cwd, packageFixture.candidateBundle.sourceRoot, packageFixture.candidateBundle.authorityProfilePath));
  const primaryFamilies = new Set(primaryProfile.sourceFamilies.map((entry) => entry.sourceFamilyId));
  const candidateFamilies = new Set(profile.sourceFamilies.map((entry) => entry.sourceFamilyId));
  const primaryReview = sfpReferencedReviewRoutes(primaryProfile);
  const candidateReview = sfpReferencedReviewRoutes(profile);
  if (!primaryReview.valid || !candidateReview.valid || candidateReview.owners[0] !== packageFixture.candidateBundle.expectedOwner) {
    throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: referenced review owner closure drift", 1);
  }
  const distinctness = {
    bundleIdsDistinct: primaryManifest.sourceBundleId !== manifest.sourceBundleId,
    profileIdsDistinct: primaryProfile.profileId !== profile.profileId,
    manifestHashesDistinct: primaryEvidence.sourceManifestRef.hash !== await canonicalFileHash(path.join(cwd, packageFixture.candidateBundle.manifestPath)),
    profileHashesDistinct: primaryProfileHash !== candidateProfileHash,
    ownersDistinct: primaryReview.owners.every((owner) => !candidateReview.owners.includes(owner)),
    sourceFamilyIdsDistinct: [...candidateFamilies].every((id) => !primaryFamilies.has(id))
  };
  if (Object.values(distinctness).some((value) => value !== true)) {
    throw contractError("source-family packaging candidate is not a distinct team-owned bundle instance", 1);
  }
  return distinctness;
}

async function runAuthorityExpansionProbe(cwd, packageFixture) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-family-expansion-"));
  try {
    await stageCompilerWorkspace(cwd, workspace, packageFixture.candidateBundle.sourceRoot);
    const buttonPath = path.join(workspace, SC_SOURCE_ROOT, "components/button.json");
    const manifestPath = path.join(workspace, SC_SOURCE_ROOT, "manifest.json");
    const button = await readJson(buttonPath);
    const fact = button.facts.find((entry) => entry.catalogPointer === "/components/Button/props/variant/allowedValues");
    fact.value = [...new Set([...fact.value, "expressive"])].sort();
    await writeCanonicalJson(buttonPath, button);
    const mutatedManifest = await readJson(manifestPath);
    mutatedManifest.sourceFiles.find((entry) => entry.path === "components/button.json").sha256 = await rawFileHash(buttonPath);
    await writeCanonicalJson(manifestPath, mutatedManifest);
    const result = await executeCompiler(cwd, workspace);
    const coveragePath = path.join(workspace, SC_ARTIFACT_ROOT, "source-fact-coverage.json");
    let diagnosticCode = null;
    try {
      const coverage = await readJson(coveragePath);
      diagnosticCode = coverage.findings.find((entry) => entry.diagnosticCode === "SOURCE_FACT_AUTHORITY_ESCALATION")?.diagnosticCode || null;
    } catch {
      diagnosticCode = null;
    }
    if (result.exitCode !== 1 || diagnosticCode !== "SOURCE_FACT_AUTHORITY_ESCALATION") {
      throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: unchanged compiler did not reject the causal expressive-variant probe", 1);
    }
    return {
      componentId: "Button",
      catalogPointer: "/components/Button/props/variant/allowedValues",
      addedValue: "expressive",
      compilerExitCode: 1,
      diagnosticCode,
      blocked: true
    };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function prepareOutputRoot(cwd, outRoot) {
  const absolute = path.join(cwd, outRoot);
  await fs.mkdir(absolute, { recursive: true });
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const allowed = new Set(SFP_ARTIFACT_PATHS.map((entry) => path.basename(entry)));
  const stale = entries.filter((entry) => !entry.isFile() || !allowed.has(entry.name)).map((entry) => entry.name).sort();
  if (stale.length > 0) {
    throw contractError(`source-family packaging output contains stale or unsupported entries: ${stale.join(", ")}`, 1);
  }
  await Promise.all([...allowed].map((file) => fs.rm(path.join(absolute, file), { force: true })));
}

async function evaluateFixtures({ cwd, expectations, fixtures, packageFixture, manifest, profile, candidateReportPath }) {
  const compilerHashes = new Map((await buildCompilerRefs(cwd, packageFixture)).map((entry) => [entry.path, entry.hash]));
  const results = [];
  for (const expectation of expectations.expectations) {
    const fixture = fixtures.get(expectation.fixturePath);
    let actualResult = "valid";
    let promotionStatus = "allowed";
    let diagnosticCodes = [];
    if (fixture.caseType === "review-required" && fixture.review?.executable === false && sfpReferencedReviewRoutes(profile).owners.includes(fixture.review.owner)) {
      actualResult = "review_required";
      promotionStatus = "review_required";
      diagnosticCodes = ["SOURCE_FAMILY_REVIEW_REQUIRED"];
    } else if (fixture.caseType === "authority-expansion" && canonicalJson([...fixture.requestedComponentIds].sort()) !== canonicalJson([...packageFixture.candidateBundle.expectedComponentIds].sort())) {
      actualResult = "invalid";
      promotionStatus = "blocked";
      diagnosticCodes = ["SOURCE_FAMILY_SCOPE_EXPANSION"];
    } else if (fixture.caseType === "compiler-hash-mismatch" && fixture.compilerRef.hash !== compilerHashes.get(fixture.compilerRef.path)) {
      actualResult = "invalid";
      promotionStatus = "blocked";
      diagnosticCodes = ["SOURCE_FAMILY_COMPILER_HASH_MISMATCH"];
    } else if (fixture.caseType === "source-hash-mismatch") {
      const relative = fixture.sourceRef.path.slice(`${packageFixture.candidateBundle.sourceRoot}/`.length);
      const declared = manifest.sourceFiles.find((entry) => entry.path === relative);
      const actualHash = await rawFileHash(path.join(cwd, fixture.sourceRef.path));
      if (!declared || fixture.sourceRef.hash !== actualHash) {
        actualResult = "invalid";
        promotionStatus = "blocked";
        diagnosticCodes = ["SOURCE_FAMILY_BUNDLE_HASH_MISMATCH"];
      }
    } else if (fixture.caseType === "evidence-hash-mismatch" && fixture.artifactRef.hash !== await canonicalFileHash(path.join(cwd, candidateReportPath))) {
      actualResult = "invalid";
      promotionStatus = "blocked";
      diagnosticCodes = ["SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH"];
    }
    results.push({
      fixturePath: expectation.fixturePath,
      kind: expectation.kind,
      stage: expectation.stage,
      phase: expectation.phase,
      expectedResult: expectation.expectedResult,
      actualResult,
      promotionStatus,
      diagnosticCodes,
      matched: actualResult === expectation.expectedResult && promotionStatus === expectation.promotionStatus && canonicalJson(diagnosticCodes) === canonicalJson(expectation.diagnosticCodes)
    });
  }
  return results;
}

function diagnosticsForResults(results) {
  const codes = new Set(results.flatMap((entry) => entry.diagnosticCodes));
  return diagnosticsRegistry().filter((entry) => codes.has(entry.code));
}

async function buildCompilerRefs(cwd, packageFixture) {
  const refs = [];
  for (const checked of packageFixture.compiler.implementationRefs) {
    const actualHash = await rawFileHash(path.join(cwd, checked.path));
    if (actualHash !== checked.hash) {
      throw contractError(`SOURCE_FAMILY_COMPILER_HASH_MISMATCH: ${checked.path} expected ${checked.hash} but received ${actualHash}`, 1);
    }
    refs.push(artifactRef(checked.path, "javascript-source", actualHash));
  }
  return refs;
}

async function buildRuntimeRefs(cwd, packageFixture) {
  const refs = [];
  for (const checked of packageFixture.compiler.runtime.dependencyRefs) {
    const actualHash = await rawFileHash(path.join(cwd, checked.path));
    if (actualHash !== checked.hash) {
      throw contractError(`SOURCE_FAMILY_COMPILER_HASH_MISMATCH: ${checked.path} expected ${checked.hash} but received ${actualHash}`, 1);
    }
    refs.push(artifactRef(checked.path, "node-package-input", actualHash));
  }
  return refs;
}

function buildRunId({ packageFixture, manifest, expectations, compilerRefs, runtimeRefs, capabilityComparison, authorityExpansionProbe, candidateEvidenceRemap }) {
  return `source-family-packaging-${sha256Hex(canonicalJson({ packageFixture, manifest, expectations, compilerRefs, runtimeRefs, capabilityComparison, authorityExpansionProbe, candidateEvidenceRemap })).slice(0, 32)}`;
}

async function runSummary({ cwd, role, evidencePath, catalogPath, manifest, profile, coverage, command }) {
  const sourceEvidence = await readJson(path.join(cwd, evidencePath));
  const reviewResolution = sfpReferencedReviewRoutes(profile);
  if (!reviewResolution.valid) throw contractError("SOURCE_FAMILY_SCOPE_EXPANSION: run summary referenced review route closure drift", 1);
  return {
    role,
    evidenceRef: artifactRef(evidencePath, "source-conformance-evidence.v0", sourceConformanceInternals.computeEvidenceSelfHash(sourceEvidence)),
    governedCatalogRef: artifactRef(catalogPath, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, catalogPath))),
    sourceBundleId: manifest.sourceBundleId,
    profileId: profile.profileId,
    owner: reviewResolution.owners[0],
    activeReviewRouteIds: reviewResolution.routeIds,
    componentIds: coverage.componentCoverage.map((entry) => entry.componentId).sort(),
    command,
    compilerExecuted: true,
    compilerExitCode: 0,
    evidenceIntegrityVerified: true,
    artifactClosureVerified: true,
    sourceBytesPreserved: true,
    status: "pass",
    promotionStatus: "review_required"
  };
}

async function buildEvidence({ cwd, command, args, runId, packageFixture, manifest, profile, packageRef, candidateManifestRef, candidateAuthorityProfileRef, compilerRefs, runtimeRefs, candidateEvidenceRemap, results, diagnostics }) {
  const schemaClosure = [];
  for (const schemaPath of sfpSchemaPaths()) {
    schemaClosure.push(artifactRef(schemaPath, sfpSchemaIdForPath(schemaPath), await canonicalFileHash(path.join(cwd, schemaPath))));
  }
  const candidateSourceRefs = [];
  for (const entry of manifest.sourceFiles) {
    const sourcePath = `${packageFixture.candidateBundle.sourceRoot}/${entry.path}`;
    candidateSourceRefs.push(artifactRef(sourcePath, sfpSchemaIdForPath(sourcePath), await rawFileHash(path.join(cwd, sourcePath)), entry.sourceRefRoot));
  }
  const fixtureRefs = [];
  for (const fixturePath of sfpFixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, sfpSchemaIdForPath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const boundaryRefs = [];
  for (const boundaryPath of BOUNDARY_PATHS) {
    boundaryRefs.push(withProvenance(artifactRef(boundaryPath, sfpSchemaIdForPath(boundaryPath), await boundaryHash(cwd, boundaryPath)), "interfacectl-source-family-packaging-boundary"));
  }
  const artifacts = [];
  for (const artifactPath of SFP_ARTIFACT_PATHS) {
    artifacts.push(withProvenance(artifactRef(
      artifactPath,
      sfpSchemaIdForPath(artifactPath),
      artifactPath === `${SFP_ARTIFACT_ROOT}/evidence.json` ? null : await canonicalFileHash(path.join(cwd, artifactPath))
    ), "interfacectl-source-family-packaging-evidence"));
  }
  const evidence = {
    contractId: SFP_CONTRACT_ID,
    schemaId: "source-family-packaging-evidence.v0",
    version: SFP_VERSION,
    runId,
    checkedAt: SFP_TIMESTAMP,
    command,
    args,
    environment: { ...SFP_ENVIRONMENT },
    schemaClosure,
    packageRef,
    candidateManifestRef,
    candidateAuthorityProfileRef,
    candidateSourceRefs,
    compilerRefs,
    runtimeRefs,
    fixtureRefs,
    boundaryRefs,
    artifacts,
    candidateEvidenceRemap,
    candidateEvidenceClosureVerified: true,
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: results,
    status: "pass",
    promotionStatus: "review_required",
    provenance: provenance("interfacectl-source-family-packaging-evidence", [SFP_PACKAGE_PATH, "plans/source-conformance/validation-evidence.md"])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

function withProvenance(ref, generator) {
  return { ...ref, provenance: provenance(generator, [ref.path]) };
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifacts?.[clone.artifacts.length - 1];
  if (finalRef?.path === `${SFP_ARTIFACT_ROOT}/evidence.json`) finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  if (evidence.contractId !== SFP_CONTRACT_ID) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  if (evidence.packageRef?.hash !== await canonicalFileHash(path.join(cwd, evidence.packageRef.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  const packageFixture = await readJson(path.join(cwd, evidence.packageRef.path));
  const expectedCompilerRefs = packageFixture.compiler.implementationRefs.map((ref) => artifactRef(ref.path, "javascript-source", ref.hash));
  const expectedRuntimeRefs = packageFixture.compiler.runtime.dependencyRefs.map((ref) => artifactRef(ref.path, "node-package-input", ref.hash));
  if (canonicalJson(evidence.compilerRefs) !== canonicalJson(expectedCompilerRefs)) return "SOURCE_FAMILY_COMPILER_HASH_MISMATCH";
  if (canonicalJson(evidence.runtimeRefs) !== canonicalJson(expectedRuntimeRefs)) return "SOURCE_FAMILY_COMPILER_HASH_MISMATCH";
  if (evidence.candidateManifestRef?.hash !== await canonicalFileHash(path.join(cwd, evidence.candidateManifestRef.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  if (evidence.candidateAuthorityProfileRef?.hash !== await rawFileHash(path.join(cwd, evidence.candidateAuthorityProfileRef.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  for (const ref of evidence.candidateSourceRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.compilerRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_FAMILY_COMPILER_HASH_MISMATCH";
  }
  for (const ref of evidence.runtimeRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_FAMILY_COMPILER_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.boundaryRefs || []).map((ref) => ref.path)) !== canonicalJson(BOUNDARY_PATHS)) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.hash !== await boundaryHash(cwd, ref.path)) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${SFP_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${SFP_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  const report = await readJson(path.join(cwd, `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`));
  if (
    report.runId !== evidence.runId ||
    canonicalJson(report.packageRef) !== canonicalJson(evidence.packageRef) ||
    canonicalJson(report.candidateManifestRef) !== canonicalJson(evidence.candidateManifestRef) ||
    canonicalJson(report.candidateAuthorityProfileRef) !== canonicalJson(evidence.candidateAuthorityProfileRef) ||
    canonicalJson(report.compilerRefs) !== canonicalJson(evidence.compilerRefs) ||
    canonicalJson(report.runtimeRefs) !== canonicalJson(evidence.runtimeRefs) ||
    canonicalJson(report.candidateEvidenceRemap) !== canonicalJson(evidence.candidateEvidenceRemap) ||
    report.candidateEvidenceClosureVerified !== evidence.candidateEvidenceClosureVerified ||
    canonicalJson(report.compilerExecutions) !== canonicalJson({ acceptedBundlePasses: 2, causalProbeFailures: 1, total: 3 }) ||
    report.status !== "pass" ||
    report.promotionStatus !== "review_required"
  ) {
    return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  if (
    evidence.candidateEvidenceClosureVerified !== true ||
    canonicalJson(evidence.candidateEvidenceRemap) !== canonicalJson(sfpCandidateEvidenceRemap()) ||
    await firstPersistedCandidateEvidenceIntegrityFailureCode(cwd, evidence.candidateEvidenceRemap) !== null
  ) {
    return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  }
  if (canonicalJson(evidence.schemaClosure.map((entry) => entry.path)) !== canonicalJson(sfpSchemaPaths())) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  if (canonicalJson(evidence.candidateSourceRefs.map((entry) => entry.path)) !== canonicalJson(sfpSourcePaths(await readJson(path.join(cwd, SFP_PACKAGE_PATH)), await readJson(path.join(cwd, SFP_CANDIDATE_SOURCE_ROOT, "manifest.json"))).slice(1))) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  if (canonicalJson(evidence.fixtureRefs.map((entry) => entry.path)) !== canonicalJson(sfpFixturePaths())) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  if (canonicalJson(evidence.artifacts.map((entry) => entry.path)) !== canonicalJson(SFP_ARTIFACT_PATHS)) return "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH";
  return null;
}

async function boundaryHash(cwd, artifactPath) {
  if (artifactPath === SFP_P2_EVIDENCE_PATH) {
    return p2Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  }
  if (artifactPath === SFP_PRIMARY_EVIDENCE_PATH) {
    return sourceConformanceInternals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  }
  return canonicalFileHash(path.join(cwd, artifactPath));
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validators = new Map();
  const schemas = [];
  for (const schemaPath of sfpSchemaPaths()) schemas.push([schemaPath, await readJson(path.join(cwd, schemaPath))]);
  for (const [, schema] of schemas) ajv.addSchema(schema);
  for (const [schemaPath, schema] of schemas) {
    const schemaId = path.basename(schemaPath).replace(/\.schema\.json$/, "");
    validators.set(schemaId, ajv.getSchema(schema.$id));
  }
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

async function assertRegularFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`missing source-family packaging input: ${label}`, 1);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw contractError(`source-family packaging input is not a regular file: ${label}`, 1);
}

async function listRegularFiles(root, relative = "") {
  const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listRegularFiles(root, next));
    else if (entry.isFile() && !entry.isSymbolicLink()) files.push(next);
    else throw contractError(`source-family bundle contains unsupported entry: ${next}`, 1);
  }
  return files.sort();
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const sourceFamilyPackagingInternals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  firstPersistedCandidateEvidenceIntegrityFailureCode,
  buildSourceFactValueIndex,
  factTuples,
  assertMatchingFactTuples
};
