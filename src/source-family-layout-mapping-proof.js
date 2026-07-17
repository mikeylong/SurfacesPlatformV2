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
  SFP_ARTIFACT_ROOT,
  SFP_CANDIDATE_SOURCE_ROOT,
  SFP_CAPTURED_ARTIFACTS,
  SFP_PACKAGE_PATH,
  sfpReferencedReviewRoutes
} from "./source-family-packaging-contract.js";
import { sourceFamilyPackagingInternals } from "./source-family-packaging-proof.js";
import {
  SFLM_ARTIFACT_PATHS,
  SFLM_ARTIFACT_ROOT,
  SFLM_CAPTURED_ARTIFACTS,
  SFLM_COMMAND,
  SFLM_CONTRACT_ID,
  SFLM_ENVIRONMENT,
  SFLM_EXPECTATION_ROWS,
  SFLM_FIXTURE_ROOT,
  SFLM_LAYOUT_PACKAGE_PATH,
  SFLM_MAPPING_PATH,
  SFLM_P2_CATALOG_PATH,
  SFLM_P2_EVIDENCE_PATH,
  SFLM_PHYSICAL_SOURCE_ROOT,
  SFLM_SCHEMA_FILES,
  SFLM_SCHEMA_ROOT,
  SFLM_SFP_EVIDENCE_PATH,
  SFLM_TIMESTAMP,
  SFLM_VERSION,
  artifactRef,
  diagnosticsRegistry,
  provenance,
  sflmArtifactOrder,
  sflmFixturePaths,
  sflmMappedEvidenceRemap,
  sflmSchemaIdForPath,
  sflmSchemaPaths,
  sflmSourcePaths,
  verifyImmutableLayoutInputs
} from "./source-family-layout-mapping-contract.js";

const execFileAsync = promisify(execFile);
const LOGICAL_PATHS = ["manifest.json", ...SC_SOURCE_FILES];
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
const FORBIDDEN_TRANSFORM_KEYS = new Set([
  "parser",
  "parsers",
  "selector",
  "selectors",
  "merge",
  "merges",
  "transform",
  "transforms",
  "defaults",
  "jsonPointer",
  "jsonPointers",
  "plugin",
  "plugins"
]);
const FORBIDDEN_AUTHORITY_KEYS = new Set([
  "components",
  "componentIds",
  "requestedComponentIds",
  "facts",
  "requestedFacts",
  "policies",
  "requestedPolicies",
  "reviewRoutes",
  "requestedReviewRoutes",
  "namespace",
  "namespaceAliases",
  "sourceRefNamespace"
]);
const BOUNDARY_PATHS = [
  SFLM_P2_EVIDENCE_PATH,
  SFLM_P2_CATALOG_PATH,
  SFLM_SFP_EVIDENCE_PATH
];

export async function runSourceFamilyLayoutMappingInterfacectl(argv, io) {
  const parsed = parseSourceFamilyLayoutMappingArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSourceFamilyLayoutMappingProof({
      cwd: io.cwd,
      sourceRoot: parsed.source,
      mappingPath: parsed.mapping,
      layoutPackagePath: parsed.layoutPackage,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      sourceFamilyPackagingEvidencePath: parsed.sourceFamilyPackagingEvidence,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: SFLM_COMMAND,
      args: {
        source: parsed.source,
        mapping: parsed.mapping,
        layoutPackage: parsed.layoutPackage,
        ingestionEvidence: parsed.ingestionEvidence,
        catalog: parsed.catalog,
        sourceFamilyPackagingEvidence: parsed.sourceFamilyPackagingEvidence,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces source-family-layout-mapping proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `mappedEntries: ${result.mappedEntries}`,
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

function parseSourceFamilyLayoutMappingArgs(argv) {
  const result = {};
  const seen = new Set();
  const flags = new Map([
    ["--source", "source"],
    ["--mapping", "mapping"],
    ["--layout-package", "layoutPackage"],
    ["--ingestion-evidence", "ingestionEvidence"],
    ["--catalog", "catalog"],
    ["--source-family-packaging-evidence", "sourceFamilyPackagingEvidence"],
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
    if (parsed.path.split("/").some((segment) => segment.startsWith("."))) {
      return { ok: false, error: `${flag} must not contain hidden path segments` };
    }
    result[key] = parsed.path;
    index += 1;
  }
  if ([...flags.values()].some((key) => !result[key])) return { ok: false, error: usage() };
  return { ok: true, ...result };
}

function usage() {
  return `usage: ${SFLM_COMMAND} --source ${SFLM_PHYSICAL_SOURCE_ROOT} --mapping ${SFLM_MAPPING_PATH} --layout-package ${SFLM_LAYOUT_PACKAGE_PATH} --ingestion-evidence ${SFLM_P2_EVIDENCE_PATH} --catalog ${SFLM_P2_CATALOG_PATH} --source-family-packaging-evidence ${SFLM_SFP_EVIDENCE_PATH} --fixture ${SFLM_FIXTURE_ROOT} --out ${SFLM_ARTIFACT_ROOT}`;
}

function expectedCommandArgs() {
  return {
    source: SFLM_PHYSICAL_SOURCE_ROOT,
    mapping: SFLM_MAPPING_PATH,
    layoutPackage: SFLM_LAYOUT_PACKAGE_PATH,
    ingestionEvidence: SFLM_P2_EVIDENCE_PATH,
    catalog: SFLM_P2_CATALOG_PATH,
    sourceFamilyPackagingEvidence: SFLM_SFP_EVIDENCE_PATH,
    fixture: SFLM_FIXTURE_ROOT,
    out: SFLM_ARTIFACT_ROOT
  };
}

export async function runSourceFamilyLayoutMappingProof({
  cwd,
  sourceRoot,
  mappingPath,
  layoutPackagePath,
  ingestionEvidencePath,
  catalogPath,
  sourceFamilyPackagingEvidencePath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots({
    sourceRoot,
    mappingPath,
    layoutPackagePath,
    ingestionEvidencePath,
    catalogPath,
    sourceFamilyPackagingEvidencePath,
    fixtureRoot,
    outRoot
  });
  await assertSafeCommandInputs(cwd, [
    sourceRoot,
    mappingPath,
    layoutPackagePath,
    ingestionEvidencePath,
    catalogPath,
    sourceFamilyPackagingEvidencePath,
    fixtureRoot
  ], outRoot);
  await assertFixedInputClosures(cwd);

  const validators = await loadValidators(cwd);
  const layoutPackage = await readJson(path.join(cwd, layoutPackagePath));
  const rawMapping = await readJson(path.join(cwd, mappingPath));
  classifyForbiddenDescriptorKeys(rawMapping);
  assertSchema(validators, "source-family-layout-mapping-package.v0", layoutPackage, layoutPackagePath);
  assertSchema(validators, "source-family-layout-mapping.v0", rawMapping, mappingPath);
  await verifyImmutableLayoutInputs(cwd, layoutPackage, rawMapping);
  const mappingVerification = await verifyPhysicalMapping({ cwd, layoutPackage, mapping: rawMapping });

  const expectationsPath = `${fixtureRoot}/expectations.manifest.json`;
  const expectations = await readJson(path.join(cwd, expectationsPath));
  assertSchema(validators, "source-family-layout-mapping-expectations.v0", expectations, expectationsPath);
  assertExpectations(expectations, layoutPackage, rawMapping);
  const fixtures = new Map();
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    const schemaId = expectation.fixturePath.endsWith("source-family-layout-mapping-preflight.json")
      ? "source-family-layout-mapping-preflight-mutation.v0"
      : "source-family-layout-mapping-fixture.v0";
    assertSchema(validators, schemaId, fixture, expectation.fixturePath);
    fixtures.set(expectation.fixturePath, fixture);
  }

  const p2Evidence = await readJson(path.join(cwd, ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, catalogPath));
  const packagingEvidence = await readJson(path.join(cwd, sourceFamilyPackagingEvidencePath));
  const packagingReport = await readJson(path.join(cwd, `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`));
  const packagingFixture = await readJson(path.join(cwd, SFP_PACKAGE_PATH));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, ingestionEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, catalogPath);
  assertSchema(validators, "source-family-packaging-evidence.v0", packagingEvidence, sourceFamilyPackagingEvidencePath);
  assertSchema(validators, "source-family-packaging-report.v0", packagingReport, `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`);
  await assertUpstreamIntegrity({ cwd, p2Evidence, p2Catalog, packagingEvidence, packagingReport });
  const compilerRefs = await buildCheckedRefs(cwd, packagingFixture.compiler.implementationRefs, "javascript-source", "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH");
  const runtimeRefs = await buildCheckedRefs(cwd, packagingFixture.compiler.runtime.dependencyRefs, "node-package-input", "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH");

  const mappingRef = artifactRef(mappingPath, "source-family-layout-mapping.v0", await rawFileHash(path.join(cwd, mappingPath)));
  const layoutPackageRef = artifactRef(layoutPackagePath, "source-family-layout-mapping-package.v0", await rawFileHash(path.join(cwd, layoutPackagePath)));
  const mappedRun = await runMappedCompilerBundle({
    cwd,
    mapping: rawMapping,
    layoutPackage,
    validators,
    mappingRef
  });
  const comparison = await compareMappedRun({
    cwd,
    mappedRun,
    packagingReport,
    p2Catalog,
    layoutPackage
  });

  await prepareOutputRoot(cwd, outRoot);
  const receipt = buildMappingReceipt({
    mappingRef,
    layoutPackageRef,
    mapping: rawMapping,
    mappingVerification,
    stagedEntries: mappedRun.stagedEntries
  });
  assertSchema(validators, "source-family-layout-mapping-receipt.v0", receipt, `${outRoot}/layout-mapping-receipt.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "layout-mapping-receipt.json"), receipt);
  for (const [mappedFile, , innerFile] of SFLM_CAPTURED_ARTIFACTS) {
    await writeCanonicalJson(path.join(cwd, outRoot, mappedFile), mappedRun.artifacts.get(innerFile));
  }
  const mappedEvidenceRemap = sflmMappedEvidenceRemap(mappingRef);
  const innerIntegrityCode = await firstPersistedMappedEvidenceIntegrityFailureCode(cwd, mappedEvidenceRemap, rawMapping, layoutPackage, validators);
  if (innerIntegrityCode !== null) {
    throw contractError(`SOURCE_LAYOUT_INNER_EVIDENCE_INVALID: persisted mapped compiler closure failed integrity: ${innerIntegrityCode}`, 1);
  }

  const authorityExpansionProbe = await runAuthorityExpansionProbe({
    cwd,
    mapping: rawMapping,
    layoutPackage,
    mappingRef,
    baselineArtifactHashes: await artifactHashSnapshot(cwd, SFLM_CAPTURED_ARTIFACTS.map(([file]) => `${outRoot}/${file}`))
  });
  const results = await evaluateFixtures({
    cwd,
    expectations,
    fixtures,
    mapping: rawMapping,
    layoutPackage,
    mappingVerification,
    p2Evidence,
    packagingEvidence,
    compilerRefs,
    receipt,
    mappedEvidenceRemap,
    validators
  });
  const mismatches = results.filter((row) => !row.matched);
  if (mismatches.length > 0) {
    throw contractError(`source-family layout mapping validation expectation mismatch: ${mismatches.map((row) => row.fixturePath).join(", ")}`, 1);
  }
  const diagnostics = diagnosticsForResults(results);
  const receiptRef = artifactRef(`${outRoot}/layout-mapping-receipt.json`, "source-family-layout-mapping-receipt.v0", await canonicalFileHash(path.join(cwd, outRoot, "layout-mapping-receipt.json")));
  const runId = buildRunId({
    layoutPackage,
    mapping: rawMapping,
    expectations,
    compilerRefs,
    runtimeRefs,
    comparison,
    authorityExpansionProbe,
    mappedEvidenceRemap
  });
  const report = buildReport({
    runId,
    mappingRef,
    layoutPackageRef,
    receiptRef,
    compilerRefs,
    runtimeRefs,
    mappedEvidenceRemap,
    mappingVerification,
    comparison,
    authorityExpansionProbe,
    results,
    diagnostics
  });
  assertSchema(validators, "source-family-layout-mapping-report.v0", report, `${outRoot}/source-family-layout-mapping-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-family-layout-mapping-report.json"), report);

  const evidence = await buildEvidence({
    cwd,
    command,
    args,
    runId,
    mapping: rawMapping,
    layoutPackage,
    mappingRef,
    layoutPackageRef,
    receiptRef,
    compilerRefs,
    runtimeRefs,
    mappedEvidenceRemap,
    results,
    diagnostics
  });
  assertSchema(validators, "source-family-layout-mapping-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const finalEvidenceResult = results.find((row) => row.diagnosticCodes.includes("SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH"));
  const finalEvidenceFixture = finalEvidenceResult ? fixtures.get(finalEvidenceResult.fixturePath) : null;
  const causalFinalEvidenceOutcome = await evaluateFinalEvidenceFixture({ cwd, fixture: finalEvidenceFixture, evidence });
  if (
    !finalEvidenceResult ||
    causalFinalEvidenceOutcome.actualResult !== finalEvidenceResult.actualResult ||
    causalFinalEvidenceOutcome.promotionStatus !== finalEvidenceResult.promotionStatus ||
    canonicalJson(causalFinalEvidenceOutcome.diagnosticCode ? [causalFinalEvidenceOutcome.diagnosticCode] : []) !== canonicalJson(finalEvidenceResult.diagnosticCodes)
  ) {
    throw contractError("source-family layout mapping final-evidence fixture did not fail through the production integrity inspector", 1);
  }
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) throw contractError(`source-family layout mapping evidence integrity verification failed: ${integrityCode}`, 1);

  return {
    status: "pass",
    promotionStatus: "review_required",
    matchedCount: results.length,
    totalCount: results.length,
    mappedEntries: rawMapping.mappings.length,
    innerArtifacts: SFLM_CAPTURED_ARTIFACTS.length,
    artifacts: [...SFLM_ARTIFACT_PATHS]
  };
}

function assertCommandRoots(paths) {
  if (
    paths.sourceRoot !== SFLM_PHYSICAL_SOURCE_ROOT ||
    paths.mappingPath !== SFLM_MAPPING_PATH ||
    paths.layoutPackagePath !== SFLM_LAYOUT_PACKAGE_PATH ||
    paths.ingestionEvidencePath !== SFLM_P2_EVIDENCE_PATH ||
    paths.catalogPath !== SFLM_P2_CATALOG_PATH ||
    paths.sourceFamilyPackagingEvidencePath !== SFLM_SFP_EVIDENCE_PATH ||
    paths.fixtureRoot !== SFLM_FIXTURE_ROOT ||
    paths.outRoot !== SFLM_ARTIFACT_ROOT
  ) {
    throw contractError(usage(), 2);
  }
}

async function assertSafeCommandInputs(cwd, inputs, outRoot) {
  for (const input of inputs) {
    await assertNoSymlinkPath(cwd, input, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, input));
    const expectedDirectory = input === SFLM_PHYSICAL_SOURCE_ROOT || input === SFLM_FIXTURE_ROOT;
    if ((expectedDirectory && !stat.isDirectory()) || (!expectedDirectory && !stat.isFile())) {
      throw contractError(`command input has unsupported type: ${input}`, 2);
    }
  }
  await assertNoSymlinkPath(cwd, outRoot, { allowMissingLeaf: true });
  try {
    const outputStat = await fs.lstat(path.join(cwd, outRoot));
    if (!outputStat.isDirectory()) throw contractError(`command output root must be a directory: ${outRoot}`, 2);
  } catch (error) {
    if (error?.exitCode === 2) throw error;
    if (error?.code !== "ENOENT") throw error;
  }
  for (const input of inputs) {
    const stat = await fs.lstat(path.join(cwd, input));
    if (stat.isFile() && stat.nlink !== 1) {
      throw contractError(`unsafe hardlink-aliased command input: ${input}`, 2);
    }
  }
}

async function assertNoSymlinkPath(cwd, relativePath, { allowMissingLeaf }) {
  const segments = relativePath.split("/");
  let current = cwd;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (allowMissingLeaf && index === segments.length - 1 && error?.code === "ENOENT") return;
      throw contractError(`missing command path: ${relativePath}`, 2);
    }
    if (stat.isSymbolicLink()) throw contractError(`symlinked command path is forbidden: ${relativePath}`, 2);
    if (index < segments.length - 1 && !stat.isDirectory()) {
      throw contractError(`command path ancestor is not a directory: ${relativePath}`, 2);
    }
  }
}

async function assertFixedInputClosures(cwd) {
  const expectedFixturePaths = sflmFixturePaths()
    .map((entry) => entry.slice(`${SFLM_FIXTURE_ROOT}/`.length))
    .sort();
  const fixtureTree = await listIndependentRegularFiles(cwd, SFLM_FIXTURE_ROOT);
  if (canonicalJson(fixtureTree.files.map((entry) => entry.path).sort()) !== canonicalJson(expectedFixturePaths)) {
    throw contractError("source-family layout mapping fixture tree closure drift", 1);
  }
  const targetSchemaEntries = (await fs.readdir(path.join(cwd, SFLM_SCHEMA_ROOT), { withFileTypes: true }))
    .filter((entry) => entry.name.startsWith("source-family-layout-mapping"))
    .map((entry) => ({ name: entry.name, isFile: entry.isFile() }))
    .sort((left, right) => left.name.localeCompare(right.name));
  if (
    targetSchemaEntries.some((entry) => !entry.isFile) ||
    canonicalJson(targetSchemaEntries.map((entry) => entry.name)) !== canonicalJson([...SFLM_SCHEMA_FILES].sort())
  ) {
    throw contractError("source-family layout mapping target schema closure drift", 1);
  }
  const identities = new Set();
  for (const inputPath of sflmSchemaPaths()) {
    await assertNoSymlinkPath(cwd, inputPath, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, inputPath));
    const identity = `${stat.dev}:${stat.ino}`;
    if (!stat.isFile() || stat.nlink !== 1 || identities.has(identity)) {
      throw contractError(`source-family layout mapping schema input is not an independent regular file: ${inputPath}`, 1);
    }
    identities.add(identity);
  }
}

function classifyForbiddenDescriptorKeys(descriptor) {
  const keys = new Set(Object.keys(descriptor));
  for (const key of FORBIDDEN_TRANSFORM_KEYS) {
    if (keys.has(key)) throw contractError(`SOURCE_LAYOUT_TRANSFORM_FORBIDDEN: descriptor key ${key} is not allowed`, 1);
  }
  for (const key of FORBIDDEN_AUTHORITY_KEYS) {
    if (keys.has(key)) throw contractError(`SOURCE_LAYOUT_AUTHORITY_EXPANSION: descriptor key ${key} is not allowed`, 1);
  }
}

async function verifyPhysicalMapping({ cwd, layoutPackage, mapping }) {
  if (
    mapping.physicalSourceRoot !== SFLM_PHYSICAL_SOURCE_ROOT ||
    mapping.logicalSourceRoot !== SC_SOURCE_ROOT ||
    mapping.copyMode !== "raw-bytes" ||
    mapping.sourceRefRewrite !== false ||
    mapping.familySpecificModule !== null ||
    layoutPackage.physicalSourceRoot !== SFLM_PHYSICAL_SOURCE_ROOT ||
    layoutPackage.logicalSourceRoot !== SC_SOURCE_ROOT ||
    layoutPackage.copyMode !== "raw-bytes" ||
    layoutPackage.sourceRefRewrite !== false ||
    layoutPackage.familySpecificModule !== null
  ) {
    throw contractError("SOURCE_LAYOUT_TRANSFORM_FORBIDDEN: layout contract requests behavior outside raw byte copying", 1);
  }
  if (layoutPackage.mappingPath !== SFLM_MAPPING_PATH) {
    throw contractError("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH: layout package mapping path drift", 1);
  }
  const mappingHash = await rawFileHash(path.join(cwd, SFLM_MAPPING_PATH));
  if (mappingHash !== layoutPackage.mappingSha256) {
    throw contractError("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH: raw mapping descriptor does not match the immutable layout package", 1);
  }
  if (!Array.isArray(mapping.mappings) || mapping.mappings.length !== LOGICAL_PATHS.length) {
    throw contractError("SOURCE_LAYOUT_MAPPING_INCOMPLETE: mapping must contain exactly 12 entries", 1);
  }
  const logicalPaths = mapping.mappings.map((entry) => entry.logicalPath);
  if (canonicalJson(logicalPaths) !== canonicalJson(LOGICAL_PATHS)) {
    if (new Set(logicalPaths).size !== logicalPaths.length) {
      throw contractError("SOURCE_LAYOUT_MAPPING_COLLISION: multiple physical rows select the same logical path", 1);
    }
    if (logicalPaths.some((entry) => !LOGICAL_PATHS.includes(entry))) {
      throw contractError("SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED: mapping selects a logical path outside the fixed ABI", 1);
    }
    throw contractError("SOURCE_LAYOUT_MAPPING_INCOMPLETE: mapping does not cover the ordered logical ABI", 1);
  }
  const physicalPaths = mapping.mappings.map((entry) => entry.physicalPath);
  if (new Set(physicalPaths).size !== physicalPaths.length) {
    throw contractError("SOURCE_LAYOUT_MAPPING_COLLISION: one physical path is mapped more than once", 1);
  }
  for (const entry of mapping.mappings) assertSafeMappingPath(entry.physicalPath, "SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE");
  if (canonicalJson(layoutPackage.entries.map(({ physicalPath, logicalPath, sha256 }) => ({ physicalPath, logicalPath, sha256 }))) !== canonicalJson(mapping.mappings)) {
    throw contractError("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH: layout package entry closure differs from the mapping descriptor", 1);
  }
  const tree = await listIndependentRegularFiles(cwd, SFLM_PHYSICAL_SOURCE_ROOT);
  if (canonicalJson(tree.files.map((entry) => entry.path).sort()) !== canonicalJson([...physicalPaths].sort())) {
    throw contractError("SOURCE_LAYOUT_FILE_UNDECLARED: physical source tree differs from the descriptor closure", 1);
  }
  const rows = [];
  for (const entry of mapping.mappings) {
    const physicalPath = `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`;
    const packageEntry = layoutPackage.entries.find((candidate) => candidate.logicalPath === entry.logicalPath);
    if (!packageEntry) throw contractError("SOURCE_LAYOUT_MAPPING_INCOMPLETE: immutable package entry is missing", 1);
    const physicalHash = await rawFileHash(path.join(cwd, physicalPath));
    const baselineHash = await rawFileHash(path.join(cwd, packageEntry.baselinePath));
    if (physicalHash !== entry.sha256 || physicalHash !== packageEntry.sha256 || physicalHash !== baselineHash) {
      throw contractError(`SOURCE_LAYOUT_SOURCE_HASH_MISMATCH: ${entry.physicalPath} differs from the accepted packaged candidate`, 1);
    }
    rows.push({
      physicalPath: entry.physicalPath,
      logicalPath: entry.logicalPath,
      baselinePath: packageEntry.baselinePath,
      physicalHash,
      baselineHash,
      matched: true
    });
  }
  const directoryPathChanged = mapping.mappings.some((entry) => path.posix.dirname(entry.physicalPath) !== path.posix.dirname(entry.logicalPath));
  const fileNameChanged = mapping.mappings.some((entry) => path.posix.basename(entry.physicalPath) !== path.posix.basename(entry.logicalPath));
  if (!directoryPathChanged || !fileNameChanged) {
    throw contractError("SOURCE_LAYOUT_MAPPING_INCOMPLETE: alternate layout must change at least one directory and filename", 1);
  }
  await assertCanonicalSourceRefs(cwd, mapping);
  return {
    entryCount: rows.length,
    logicalPaths,
    physicalPaths,
    rows,
    mappingHash,
    mappingVerifiedBeforeStaging: true,
    fileClosureVerified: true,
    independentRegularFilesVerified: tree.independentRegularFilesVerified,
    physicalLayoutDistinct: { directoryPathChanged, fileNameChanged }
  };
}

function assertSafeMappingPath(relativePath, code) {
  const parsed = p2Internals.parseRelativePosixPath(relativePath, "mapping path");
  if (!parsed.ok || parsed.path !== relativePath || relativePath.split("/").some((segment) => segment.startsWith("."))) {
    throw contractError(`${code}: unsafe mapping path ${relativePath}`, 1);
  }
}

async function listIndependentRegularFiles(cwd, relativeRoot) {
  const files = [];
  const identities = new Set();
  async function visit(relative) {
    const absolute = path.join(cwd, relativeRoot, relative);
    const entries = await fs.readdir(absolute);
    for (const name of entries.sort()) {
      if (name.startsWith(".")) throw contractError(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: hidden entry ${name}`, 1);
      const next = relative ? `${relative}/${name}` : name;
      const stat = await fs.lstat(path.join(cwd, relativeRoot, next));
      if (stat.isSymbolicLink()) throw contractError(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: symlink ${next}`, 1);
      if (stat.isDirectory()) {
        await visit(next);
        continue;
      }
      if (!stat.isFile()) throw contractError(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: non-regular entry ${next}`, 1);
      const identity = `${stat.dev}:${stat.ino}`;
      if (stat.nlink !== 1 || identities.has(identity)) {
        throw contractError(`SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN: hardlink alias ${next}`, 1);
      }
      identities.add(identity);
      files.push({ path: next, identity, nlink: stat.nlink });
    }
  }
  await visit("");
  return { files: files.sort((left, right) => left.path.localeCompare(right.path)), independentRegularFilesVerified: true };
}

async function assertCanonicalSourceRefs(cwd, mapping) {
  const manifestRow = mapping.mappings.find((entry) => entry.logicalPath === "manifest.json");
  const manifest = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, manifestRow.physicalPath));
  if (canonicalJson(manifest.sourceFiles.map((entry) => entry.path)) !== canonicalJson(SC_SOURCE_FILES)) {
    throw contractError("SOURCE_LAYOUT_CANONICAL_REF_MISMATCH: mapped manifest source-file order changed", 1);
  }
  for (const entry of manifest.sourceFiles) {
    if (entry.sourceRefRoot !== `declared-source://source-conformance/${entry.path}#/`) {
      throw contractError(`SOURCE_LAYOUT_CANONICAL_REF_MISMATCH: source ref drift for ${entry.path}`, 1);
    }
  }
  for (const row of mapping.mappings.filter((entry) => entry.logicalPath !== "manifest.json")) {
    const document = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, row.physicalPath));
    const refs = collectDeclaredSourceRefs(document);
    if (refs.some((ref) => !ref.startsWith("declared-source://source-conformance/"))) {
      throw contractError(`SOURCE_LAYOUT_CANONICAL_REF_MISMATCH: embedded source ref drift in ${row.logicalPath}`, 1);
    }
  }
}

function collectDeclaredSourceRefs(value, refs = []) {
  if (typeof value === "string" && value.startsWith("declared-source://")) refs.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectDeclaredSourceRefs(entry, refs));
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => collectDeclaredSourceRefs(entry, refs));
  return refs;
}

function assertExpectations(expectations, layoutPackage, mapping) {
  if (
    canonicalJson(expectations.inputs) !== canonicalJson(sflmFixturePaths()) ||
    canonicalJson(expectations.artifactOrder) !== canonicalJson(sflmArtifactOrder(layoutPackage, mapping)) ||
    canonicalJson(expectations.expectations) !== canonicalJson(SFLM_EXPECTATION_ROWS) ||
    canonicalJson(expectations.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry())
  ) {
    throw contractError("source-family layout mapping expectations manifest drift", 1);
  }
}

async function assertUpstreamIntegrity({ cwd, p2Evidence, p2Catalog, packagingEvidence, packagingReport }) {
  const code = await firstUpstreamIntegrityFailureCode({ cwd, p2Evidence, p2Catalog, packagingEvidence, packagingReport });
  if (code !== null) throw contractError(`${code}: accepted upstream boundary validation failed`, 1);
}

async function firstUpstreamIntegrityFailureCode({ cwd, p2Evidence, p2Catalog, packagingEvidence, packagingReport }) {
  if (!p2Evidence || p2Evidence.status !== "pass") return "SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING";
  if (!packagingEvidence || packagingEvidence.status !== "pass" || packagingEvidence.promotionStatus !== "review_required") {
    return "SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING";
  }
  const p2Code = await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence);
  if (p2Code !== null) return "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH";
  const packagingCode = await sourceFamilyPackagingInternals.firstEvidenceIntegrityFailureCode(cwd, packagingEvidence);
  if (packagingCode !== null) return "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH";
  const catalogRef = p2Evidence.artifactRefs.find((entry) => entry.path === SFLM_P2_CATALOG_PATH);
  if (!catalogRef || catalogRef.hash !== await canonicalFileHash(path.join(cwd, SFLM_P2_CATALOG_PATH))) {
    return "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH";
  }
  const reportRef = packagingEvidence.artifacts.find((entry) => entry.path === `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`);
  if (!reportRef || reportRef.hash !== await canonicalFileHash(path.join(cwd, reportRef.path)) || reportRef.hash !== await canonicalFileHash(path.join(cwd, `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`))) {
    return "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH";
  }
  if (!packagingReport || packagingReport.status !== "pass" || packagingReport.promotionStatus !== "review_required" || Object.keys(p2Catalog?.components || {}).sort().join("\0") !== "Button\0InLineAlert") {
    return "SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING";
  }
  return null;
}

async function buildCheckedRefs(cwd, checkedRefs, schemaId, code) {
  const refs = [];
  for (const checked of checkedRefs) {
    await assertNoSymlinkPath(cwd, checked.path, { allowMissingLeaf: false });
    const stat = await fs.lstat(path.join(cwd, checked.path));
    if (!stat.isFile() || stat.nlink !== 1) {
      throw contractError(`${code}: ${checked.path} is not an independent regular file`, 1);
    }
    const actualHash = await rawFileHash(path.join(cwd, checked.path));
    if (actualHash !== checked.hash) throw contractError(`${code}: ${checked.path} does not match the checked closure`, 1);
    refs.push(artifactRef(checked.path, schemaId, actualHash));
  }
  return refs;
}

async function runMappedCompilerBundle({ cwd, mapping, layoutPackage, validators, mappingRef }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-mapped-"));
  try {
    const stagedEntries = await stageMappedCompilerWorkspace({ cwd, workspace, mapping, layoutPackage });
    const before = await logicalSourceSnapshot(workspace, mapping);
    const compilerResult = await executeCompiler(cwd, workspace);
    if (compilerResult.exitCode !== 0) {
      throw contractError(`SOURCE_LAYOUT_COMPILER_RUN_FAILED: ${stableChildFailure(compilerResult)}`, 1);
    }
    const after = await logicalSourceSnapshot(workspace, mapping);
    if (canonicalJson(before) !== canonicalJson(after)) {
      throw contractError("SOURCE_LAYOUT_BYTE_MISMATCH: source-conformance compiler changed staged logical bytes", 1);
    }
    const artifacts = await readMappedArtifacts(workspace, validators);
    const evidence = artifacts.get("evidence.json");
    const integrityCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    if (integrityCode !== null || evidence.status !== "pass" || evidence.promotionStatus !== "review_required") {
      throw contractError(`SOURCE_LAYOUT_INNER_EVIDENCE_INVALID: mapped compiler evidence failed integrity: ${integrityCode || evidence.status}`, 1);
    }
    const manifest = await readJson(path.join(workspace, SC_SOURCE_ROOT, "manifest.json"));
    const factValueIndex = await sourceFamilyPackagingInternals.buildSourceFactValueIndex(workspace, SC_SOURCE_ROOT, manifest);
    return { artifacts, evidence, stagedEntries, factValueIndex, mappingRef };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function stageMappedCompilerWorkspace({ cwd, workspace, mapping, layoutPackage }) {
  await copyClosedTree({ cwd, sourceRoot: SFLM_SCHEMA_ROOT, destinationRoot: workspace, code: "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH" });
  await copyClosedTree({ cwd, sourceRoot: SC_FIXTURE_ROOT, destinationRoot: workspace, code: "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH" });
  for (const artifactPath of [SFLM_P2_EVIDENCE_PATH, SFLM_P2_CATALOG_PATH]) {
    await fs.mkdir(path.join(workspace, path.dirname(artifactPath)), { recursive: true });
    await fs.copyFile(path.join(cwd, artifactPath), path.join(workspace, artifactPath));
  }
  const stagedEntries = [];
  for (const entry of mapping.mappings) {
    const physicalPath = `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`;
    const logicalPath = `${SC_SOURCE_ROOT}/${entry.logicalPath}`;
    const packageEntry = layoutPackage.entries.find((candidate) => candidate.logicalPath === entry.logicalPath);
    await fs.mkdir(path.join(workspace, path.dirname(logicalPath)), { recursive: true });
    await fs.copyFile(path.join(cwd, physicalPath), path.join(workspace, logicalPath));
    const physicalHash = await rawFileHash(path.join(cwd, physicalPath));
    const logicalHash = await rawFileHash(path.join(workspace, logicalPath));
    const baselineHash = await rawFileHash(path.join(cwd, packageEntry.baselinePath));
    if (physicalHash !== entry.sha256 || physicalHash !== logicalHash || physicalHash !== baselineHash) {
      throw contractError(`SOURCE_LAYOUT_BYTE_MISMATCH: raw staging changed ${entry.logicalPath}`, 1);
    }
    stagedEntries.push({
      physicalPath,
      logicalPath,
      baselinePath: packageEntry.baselinePath,
      physicalHash,
      logicalHash,
      baselineHash,
      bytesPreserved: true
    });
  }
  return stagedEntries;
}

async function copyClosedTree({ cwd, sourceRoot, destinationRoot, code }) {
  const sourceAbsolute = path.join(cwd, sourceRoot);
  const identities = new Set();
  async function visit(relative) {
    const entries = await fs.readdir(path.join(sourceAbsolute, relative));
    for (const name of entries.sort()) {
      if (name.startsWith(".")) throw contractError(`${code}: hidden entry in checked closure: ${sourceRoot}/${name}`, 1);
      const next = relative ? `${relative}/${name}` : name;
      const sourcePath = path.join(sourceAbsolute, next);
      const stat = await fs.lstat(sourcePath);
      if (stat.isSymbolicLink()) throw contractError(`${code}: symlink in checked closure: ${sourceRoot}/${next}`, 1);
      if (stat.isDirectory()) {
        await visit(next);
        continue;
      }
      if (!stat.isFile() || stat.nlink !== 1) throw contractError(`${code}: non-independent regular file in checked closure: ${sourceRoot}/${next}`, 1);
      const identity = `${stat.dev}:${stat.ino}`;
      if (identities.has(identity)) throw contractError(`${code}: hardlink alias in checked closure: ${sourceRoot}/${next}`, 1);
      identities.add(identity);
      const destination = path.join(destinationRoot, sourceRoot, next);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(sourcePath, destination);
    }
  }
  await visit("");
}

async function logicalSourceSnapshot(workspace, mapping) {
  const rows = [];
  for (const entry of mapping.mappings) {
    rows.push({
      logicalPath: entry.logicalPath,
      hash: await rawFileHash(path.join(workspace, SC_SOURCE_ROOT, entry.logicalPath))
    });
  }
  return rows;
}

async function executeCompiler(cwd, workspace) {
  const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
  if (materializer.exitCode !== 0) return materializer;
  return executeChild(process.execPath, [
    path.join(cwd, "bin/interfacectl.js"),
    "surfaces",
    "source-conformance",
    "proof",
    "--source",
    SC_SOURCE_ROOT,
    "--ingestion-evidence",
    SFLM_P2_EVIDENCE_PATH,
    "--catalog",
    SFLM_P2_CATALOG_PATH,
    "--fixture",
    SC_FIXTURE_ROOT,
    "--out",
    SC_ARTIFACT_ROOT
  ], workspace);
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
  return `${result.stderr}\n${result.stdout}`.trim().split(/\r?\n/).filter(Boolean).at(-1) || `compiler exited ${result.exitCode}`;
}

async function readMappedArtifacts(workspace, validators) {
  const artifacts = new Map();
  for (const [, schemaId, innerFile] of SFLM_CAPTURED_ARTIFACTS) {
    const artifactPath = `${SC_ARTIFACT_ROOT}/${innerFile}`;
    const data = await readJson(path.join(workspace, artifactPath));
    assertSchema(validators, schemaId, data, artifactPath);
    artifacts.set(innerFile, data);
  }
  return artifacts;
}

async function compareMappedRun({ cwd, mappedRun, packagingReport, p2Catalog, layoutPackage }) {
  const artifactComparisons = [];
  for (const [mappedFile, , innerFile] of SFLM_CAPTURED_ARTIFACTS) {
    const baselineTuple = SFP_CAPTURED_ARTIFACTS.find(([, , candidateInnerFile]) => candidateInnerFile === innerFile);
    if (!baselineTuple) throw contractError(`SOURCE_LAYOUT_INNER_EVIDENCE_INVALID: missing baseline mapping for ${innerFile}`, 1);
    const baselinePath = `${SFP_ARTIFACT_ROOT}/${baselineTuple[0]}`;
    const baseline = await readJson(path.join(cwd, baselinePath));
    const mapped = mappedRun.artifacts.get(innerFile);
    if (canonicalJson(mapped) !== canonicalJson(baseline)) {
      throw contractError(`SOURCE_LAYOUT_INNER_EVIDENCE_INVALID: mapped ${innerFile} differs from the accepted packaged candidate`, 1);
    }
    artifactComparisons.push({
      logicalPath: `${SC_ARTIFACT_ROOT}/${innerFile}`,
      mappedPath: `${SFLM_ARTIFACT_ROOT}/${mappedFile}`,
      baselinePath,
      canonicalHash: sha256Hex(canonicalJson(mapped)),
      matched: true
    });
  }
  const mappedCoverage = mappedRun.artifacts.get("source-fact-coverage.json");
  const factTuples = sourceFamilyPackagingInternals.factTuples(mappedCoverage, mappedRun.factValueIndex);
  sourceFamilyPackagingInternals.assertMatchingFactTuples(packagingReport.capabilityComparison.factTuples, factTuples);
  if (factTuples.length !== 6) throw contractError("SOURCE_LAYOUT_AUTHORITY_EXPANSION: mapped fact tuple count drift", 1);
  const mappedCatalog = mappedRun.artifacts.get("governed-catalog.json");
  const immutableFields = IMMUTABLE_CATALOG_FIELDS.map((field) => {
    const p2Hash = sha256Hex(canonicalJson(p2Catalog[field]));
    const mappedHash = sha256Hex(canonicalJson(mappedCatalog[field]));
    const baselineField = packagingReport.capabilityComparison.immutableFields.find((entry) => entry.field === field);
    if (!baselineField || baselineField.p2Hash !== p2Hash || baselineField.candidateHash !== mappedHash) {
      throw contractError(`SOURCE_LAYOUT_AUTHORITY_EXPANSION: immutable catalog field changed: ${field}`, 1);
    }
    return { field, p2Hash, baselineHash: baselineField.candidateHash, mappedHash, matched: true };
  });
  const profileEntry = layoutPackage.entries.find((entry) => entry.logicalPath === "governance/authority-profile.json");
  const manifestEntry = layoutPackage.entries.find((entry) => entry.logicalPath === "manifest.json");
  const profile = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, profileEntry.physicalPath));
  const manifest = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, manifestEntry.physicalPath));
  const baselineProfile = await readJson(path.join(cwd, profileEntry.baselinePath));
  const baselineManifest = await readJson(path.join(cwd, manifestEntry.baselinePath));
  const reviewResolution = sfpReferencedReviewRoutes(profile);
  const reviewQueue = mappedRun.artifacts.get("source-review-queue.json");
  if (
    !reviewResolution.valid ||
    reviewResolution.owners.length !== 1 ||
    reviewQueue.queueItems.some((item) => item.executable !== false) ||
    canonicalJson(profile) !== canonicalJson(baselineProfile) ||
    canonicalJson(manifest) !== canonicalJson(baselineManifest)
  ) {
    throw contractError("SOURCE_LAYOUT_AUTHORITY_EXPANSION: mapped review ownership or executable state drift", 1);
  }
  return {
    artifactComparisons,
    artifactClosureMatched: true,
    factTuples,
    factTupleCount: factTuples.length,
    factTuplesMatched: true,
    immutableFields,
    immutableFieldCount: immutableFields.length,
    immutableFieldsMatched: true,
    componentIds: Object.keys(mappedCatalog.components).sort(),
    sourceBundleId: manifest.sourceBundleId,
    sourceBundleIdMatched: manifest.sourceBundleId === packagingReport.candidateRun.sourceBundleId,
    sourceManifestMatched: true,
    authorityProfileMatched: true,
    sourceRefsMatched: true,
    owner: reviewResolution.owners[0],
    activeOwnerMatched: reviewResolution.owners[0] === packagingReport.candidateRun.owner,
    activeReviewRouteIds: reviewResolution.routeIds,
    reviewItemCount: reviewQueue.queueItems.length,
    reviewItemsNonExecutable: true,
    reviewSemanticsMatched: reviewQueue.promotionStatus === "review_required",
    sourceRefsPreserved: true,
    authorityExpanded: false,
    catalogAuthorityExpanded: false,
    compilerImplementationReused: true,
    familySpecificModule: null
  };
}

function buildMappingReceipt({ mappingRef, layoutPackageRef, mapping, mappingVerification, stagedEntries }) {
  return {
    schemaId: "source-family-layout-mapping-receipt.v0",
    version: SFLM_VERSION,
    layoutPackageRef,
    mappingRef,
    physicalSourceRoot: SFLM_PHYSICAL_SOURCE_ROOT,
    logicalSourceRoot: SC_SOURCE_ROOT,
    copyMode: "raw-bytes",
    sourceRefRewrite: false,
    familySpecificModule: null,
    entries: stagedEntries,
    mappingVerifiedBeforeStaging: mappingVerification.mappingVerifiedBeforeStaging,
    fileClosureVerified: mappingVerification.fileClosureVerified,
    independentRegularFilesVerified: mappingVerification.independentRegularFilesVerified,
    physicalLayoutDistinct: mappingVerification.physicalLayoutDistinct,
    entryCount: mapping.mappings.length,
    sourceBytesPreserved: stagedEntries.every((entry) => entry.bytesPreserved),
    status: "pass",
    provenance: provenance("interfacectl-source-family-layout-mapping-receipt", [layoutPackageRef.path, mappingRef.path])
  };
}

async function prepareOutputRoot(cwd, outRoot) {
  const absolute = path.join(cwd, outRoot);
  await fs.mkdir(absolute, { recursive: true });
  const allowed = new Set(SFLM_ARTIFACT_PATHS.map((entry) => path.posix.basename(entry)));
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const stale = [];
  for (const entry of entries) {
    const entryPath = path.join(absolute, entry.name);
    const stat = await fs.lstat(entryPath);
    if (stat.isSymbolicLink()) throw contractError(`symlinked command output is forbidden: ${outRoot}/${entry.name}`, 2);
    if (stat.isFile() && stat.nlink !== 1) throw contractError(`hardlink-aliased command output is forbidden: ${outRoot}/${entry.name}`, 2);
    if (!entry.isFile() || !allowed.has(entry.name)) stale.push(entry.name);
  }
  if (stale.length > 0) {
    throw contractError(`source-family layout mapping output contains stale or unsupported entries: ${stale.sort().join(", ")}`, 1);
  }
  for (const file of allowed) await fs.rm(path.join(absolute, file), { force: true });
}

async function firstPersistedMappedEvidenceIntegrityFailureCode(cwd, remap, mapping, layoutPackage, validators) {
  if (canonicalJson(remap) !== canonicalJson(sflmMappedEvidenceRemap())) return "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID";
  mapping ||= await readJson(path.join(cwd, SFLM_MAPPING_PATH));
  layoutPackage ||= await readJson(path.join(cwd, SFLM_LAYOUT_PACKAGE_PATH));
  validators ||= await loadValidators(cwd);
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-persisted-verify-"));
  try {
    await stageMappedCompilerWorkspace({ cwd, workspace, mapping, layoutPackage });
    const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
    if (materializer.exitCode !== 0) return "SOURCE_LAYOUT_COMPILER_RUN_FAILED";
    for (const mappingRow of remap.artifactMappings) {
      await fs.mkdir(path.join(workspace, path.dirname(mappingRow.logicalPath)), { recursive: true });
      await fs.copyFile(path.join(cwd, mappingRow.persistedPath), path.join(workspace, mappingRow.logicalPath));
      const schemaId = sflmSchemaIdForPath(mappingRow.persistedPath);
      const value = await readJson(path.join(workspace, mappingRow.logicalPath));
      assertSchema(validators, schemaId, value, mappingRow.persistedPath);
    }
    const evidenceMapping = remap.artifactMappings.find((entry) => entry.logicalPath === `${SC_ARTIFACT_ROOT}/evidence.json`);
    if (!evidenceMapping) return "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID";
    const evidence = await readJson(path.join(workspace, evidenceMapping.logicalPath));
    const innerCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    return innerCode === null ? null : "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID";
  } catch {
    return "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID";
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function artifactHashSnapshot(cwd, artifactPaths) {
  const rows = [];
  for (const artifactPath of artifactPaths) {
    rows.push({ path: artifactPath, hash: await canonicalFileHash(path.join(cwd, artifactPath)) });
  }
  return rows;
}

async function sourceInputHashSnapshot(cwd) {
  const rows = [
    { path: SFLM_LAYOUT_PACKAGE_PATH, hash: await rawFileHash(path.join(cwd, SFLM_LAYOUT_PACKAGE_PATH)) },
    { path: SFLM_MAPPING_PATH, hash: await rawFileHash(path.join(cwd, SFLM_MAPPING_PATH)) }
  ];
  for (const sourcePath of sflmSourcePaths().slice(1)) {
    rows.push({ path: sourcePath, hash: await rawFileHash(path.join(cwd, sourcePath)) });
  }
  return rows;
}

async function runAuthorityExpansionProbe({ cwd, mapping, layoutPackage, baselineArtifactHashes }) {
  const verifiedWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-verified-"));
  const probeWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-authority-expansion-"));
  const checkedSourceInputsBefore = await sourceInputHashSnapshot(cwd);
  try {
    await stageMappedCompilerWorkspace({ cwd, workspace: verifiedWorkspace, mapping, layoutPackage });
    await copyIndependentWorkspaceTree(verifiedWorkspace, probeWorkspace);
    const before = await logicalSourceSnapshot(probeWorkspace, mapping);
    const buttonPath = path.join(probeWorkspace, SC_SOURCE_ROOT, "components/button.json");
    const manifestPath = path.join(probeWorkspace, SC_SOURCE_ROOT, "manifest.json");
    const button = await readJson(buttonPath);
    const fact = button.facts.find((entry) => entry.catalogPointer === "/components/Button/props/variant/allowedValues");
    if (!fact) throw contractError("SOURCE_LAYOUT_AUTHORITY_EXPANSION: Button variant fact is missing from the verified logical workspace", 1);
    fact.value = [...new Set([...fact.value, "expressive"])].sort();
    await writeCanonicalJson(buttonPath, button);
    const manifest = await readJson(manifestPath);
    const buttonEntry = manifest.sourceFiles.find((entry) => entry.path === "components/button.json");
    if (!buttonEntry) throw contractError("SOURCE_LAYOUT_AUTHORITY_EXPANSION: Button manifest entry is missing", 1);
    buttonEntry.sha256 = await rawFileHash(buttonPath);
    await writeCanonicalJson(manifestPath, manifest);
    const after = await logicalSourceSnapshot(probeWorkspace, mapping);
    const changed = after.filter((entry, index) => entry.hash !== before[index].hash).map((entry) => entry.logicalPath);
    if (canonicalJson(changed) !== canonicalJson(["manifest.json", "components/button.json"])) {
      throw contractError(`SOURCE_LAYOUT_AUTHORITY_EXPANSION: probe changed unexpected logical inputs: ${changed.join(", ")}`, 1);
    }
    const result = await executeCompiler(cwd, probeWorkspace);
    let innerFinding = null;
    try {
      const coverage = await readJson(path.join(probeWorkspace, SC_ARTIFACT_ROOT, "source-fact-coverage.json"));
      innerFinding = coverage.findings.find((entry) => entry.diagnosticCode === "SOURCE_FACT_AUTHORITY_ESCALATION") || null;
    } catch {
      innerFinding = null;
    }
    if (result.exitCode !== 1 || innerFinding?.diagnosticCode !== "SOURCE_FACT_AUTHORITY_ESCALATION") {
      throw contractError("SOURCE_LAYOUT_AUTHORITY_EXPANSION: unchanged compiler did not preserve the causal source authority rejection", 1);
    }
    const checkedSourceInputsAfter = await sourceInputHashSnapshot(cwd);
    const baselineArtifactsAfter = await artifactHashSnapshot(cwd, baselineArtifactHashes.map((entry) => entry.path));
    if (canonicalJson(checkedSourceInputsBefore) !== canonicalJson(checkedSourceInputsAfter)) {
      throw contractError("SOURCE_LAYOUT_SOURCE_HASH_MISMATCH: authority probe changed checked source inputs", 1);
    }
    if (canonicalJson(baselineArtifactHashes) !== canonicalJson(baselineArtifactsAfter)) {
      throw contractError("SOURCE_LAYOUT_INNER_EVIDENCE_INVALID: authority probe changed persisted baseline artifacts", 1);
    }
    return {
      baselineMappingVerified: true,
      baselineIntegrityVerified: true,
      probeWorkspace: "temporary:source-family-layout-authority-expansion",
      probeWorkspaceIsolated: true,
      mutatedLogicalPaths: ["components/button.json", "manifest.json"],
      componentId: "Button",
      catalogPointer: "/components/Button/props/variant/allowedValues",
      addedValue: "expressive",
      innerCompilerExitCode: 1,
      innerDiagnostic: {
        code: innerFinding.diagnosticCode,
        finding: innerFinding
      },
      blocked: true,
      checkedSourceInputsChanged: false,
      baselineArtifactsChanged: false,
      probeWorkspaceRemoved: true
    };
  } finally {
    await fs.rm(verifiedWorkspace, { recursive: true, force: true });
    await fs.rm(probeWorkspace, { recursive: true, force: true });
  }
}

async function copyIndependentWorkspaceTree(sourceRoot, destinationRoot) {
  const identities = new Set();
  async function visit(relative = "") {
    const entries = await fs.readdir(path.join(sourceRoot, relative), { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name.startsWith(".")) throw contractError(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: hidden temporary workspace entry ${entry.name}`, 1);
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      const sourcePath = path.join(sourceRoot, next);
      const stat = await fs.lstat(sourcePath);
      if (stat.isSymbolicLink()) throw contractError(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: symlinked temporary workspace entry ${next}`, 1);
      if (stat.isDirectory()) {
        await fs.mkdir(path.join(destinationRoot, next), { recursive: true });
        await visit(next);
        continue;
      }
      const identity = `${stat.dev}:${stat.ino}`;
      if (!stat.isFile() || stat.nlink !== 1 || identities.has(identity)) {
        throw contractError(`SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN: non-independent temporary workspace entry ${next}`, 1);
      }
      identities.add(identity);
      await fs.mkdir(path.dirname(path.join(destinationRoot, next)), { recursive: true });
      await fs.copyFile(sourcePath, path.join(destinationRoot, next));
    }
  }
  await visit();
}

async function evaluateFixtures({
  cwd,
  expectations,
  fixtures,
  mapping,
  layoutPackage,
  mappingVerification,
  p2Evidence,
  packagingEvidence,
  compilerRefs,
  receipt,
  mappedEvidenceRemap,
  validators
}) {
  const results = [];
  for (const expectation of expectations.expectations) {
    const fixture = fixtures.get(expectation.fixturePath);
    const outcome = await evaluateFixture({
      cwd,
      fixture,
      mapping,
      layoutPackage,
      mappingVerification,
      p2Evidence,
      packagingEvidence,
      compilerRefs,
      receipt,
      mappedEvidenceRemap,
      validators
    });
    const diagnosticCodes = outcome.diagnosticCode ? [outcome.diagnosticCode] : [];
    results.push({
      fixturePath: expectation.fixturePath,
      kind: expectation.kind,
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
  if (fixture.schemaId === "source-family-layout-mapping-preflight-mutation.v0") {
    return evaluatePreflightFixture(context);
  }
  if (fixture.caseType === "valid-layout") {
    const valid =
      context.mappingVerification.entryCount === LOGICAL_PATHS.length &&
      context.mappingVerification.fileClosureVerified === true &&
      context.receipt.sourceBytesPreserved === true &&
      canonicalJson(context.mappedEvidenceRemap) === canonicalJson(sflmMappedEvidenceRemap());
    return valid ? allowedOutcome() : blockedOutcome("SOURCE_LAYOUT_MAPPING_INCOMPLETE");
  }
  if (fixture.caseType === "review-required") return evaluateReviewFixture(context);
  if ([
    "mapping-hash-mismatch",
    "mapping-incomplete",
    "mapping-collision",
    "physical-path-unsafe",
    "logical-path-unsupported",
    "transform-forbidden",
    "authority-expansion"
  ].includes(fixture.caseType)) {
    return evaluateDescriptorFixture(context);
  }
  if (["source-hash-mismatch", "physical-hardlink-forbidden", "physical-file-undeclared", "file-undeclared"].includes(fixture.caseType)) {
    return evaluatePhysicalFixture(context);
  }
  if (["staged-byte-mismatch", "canonical-ref-mismatch"].includes(fixture.caseType)) {
    return evaluateStagedFixture(context);
  }
  if (fixture.caseType === "compiler-hash-mismatch") return evaluateCompilerHashFixture(context);
  if (fixture.caseType === "compiler-run-failed") return evaluateCompilerFailureFixture(context);
  if (fixture.caseType === "inner-evidence-invalid") return evaluateInnerEvidenceFixture(context);
  if (fixture.caseType === "evidence-hash-mismatch") return provisionalFinalEvidenceOutcome(fixture);
  return allowedOutcome();
}

async function evaluatePreflightFixture({ cwd, fixture, p2Evidence, packagingEvidence }) {
  let mutatedP2Evidence = deepClone(p2Evidence);
  let mutatedPackagingEvidence = deepClone(packagingEvidence);
  const p2Catalog = await readJson(path.join(cwd, SFLM_P2_CATALOG_PATH));
  const packagingReport = await readJson(path.join(cwd, `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`));
  if (fixture.operation === "remove") {
    if (fixture.artifactPath === SFLM_P2_EVIDENCE_PATH) mutatedP2Evidence = null;
    if (fixture.artifactPath === SFLM_SFP_EVIDENCE_PATH) mutatedPackagingEvidence = null;
  } else if (fixture.operation === "set-non-passing") {
    if (fixture.artifactPath === SFLM_P2_EVIDENCE_PATH) mutatedP2Evidence.status = "fail";
    if (fixture.artifactPath === SFLM_SFP_EVIDENCE_PATH) mutatedPackagingEvidence.status = "fail";
  } else if (fixture.operation === "replace-hash") {
    if (fixture.artifactPath === SFLM_P2_CATALOG_PATH) {
      const ref = mutatedP2Evidence.artifactRefs.find((entry) => entry.path === SFLM_P2_CATALOG_PATH);
      if (ref) ref.hash = fixture.value;
    } else {
      const ref = mutatedPackagingEvidence.artifacts.find((entry) => entry.path === fixture.artifactPath);
      if (ref) ref.hash = fixture.value;
    }
  }
  const code = await firstUpstreamIntegrityFailureCode({
    cwd,
    p2Evidence: mutatedP2Evidence,
    p2Catalog,
    packagingEvidence: mutatedPackagingEvidence,
    packagingReport
  });
  if (fixture.caseType === "upstream-evidence-missing" && code === "SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING") {
    return blockedOutcome(code);
  }
  if (fixture.caseType === "upstream-hash-mismatch" && code === "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH") {
    return blockedOutcome(code);
  }
  return allowedOutcome();
}

async function evaluateReviewFixture({ cwd, fixture, layoutPackage }) {
  const profileEntry = layoutPackage.entries.find((entry) => entry.logicalPath === "governance/authority-profile.json");
  const profile = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, profileEntry.physicalPath));
  const resolution = sfpReferencedReviewRoutes(profile);
  const queue = await readJson(path.join(cwd, SFLM_ARTIFACT_ROOT, "mapped-source-review-queue.json"));
  const requiredRefs = fixture.review?.requiredRefs || [];
  const matchedQueueItem = queue.queueItems.find((item) =>
    item.owner === fixture.review?.owner &&
    item.executable === false &&
    item.rationale === fixture.review?.rationale &&
    item.expiresAt === fixture.review?.expiresAt &&
    requiredRefs.every((ref) => item.requiredSourceRefs.includes(ref))
  );
  if (
    resolution.valid &&
    resolution.owners.includes(fixture.review?.owner) &&
    fixture.review?.executable === false &&
    matchedQueueItem
  ) {
    return reviewOutcome("SOURCE_LAYOUT_REVIEW_REQUIRED");
  }
  return allowedOutcome();
}

function evaluateDescriptorFixture({ fixture, mapping, layoutPackage }) {
  if (fixture.mutation?.target !== "mapping-descriptor") return allowedOutcome();
  const mutated = deepClone(mapping);
  applyDescriptorMutation(mutated, fixture.mutation);
  const code = classifyMutatedDescriptor(mutated, layoutPackage);
  return code ? blockedOutcome(code) : allowedOutcome();
}

function applyDescriptorMutation(descriptor, mutation) {
  if (mutation.operation === "remove-row") {
    const index = Number(mutation.path?.split("/").at(-1));
    if (Number.isInteger(index)) descriptor.mappings.splice(index, 1);
    return;
  }
  if (mutation.operation === "replace-value" || mutation.operation === "add-field") {
    setJsonPointer(descriptor, mutation.path, deepClone(mutation.value));
  }
}

function classifyMutatedDescriptor(descriptor, layoutPackage) {
  try {
    classifyForbiddenDescriptorKeys(descriptor);
    if (!Array.isArray(descriptor.mappings) || descriptor.mappings.length !== LOGICAL_PATHS.length) {
      return "SOURCE_LAYOUT_MAPPING_INCOMPLETE";
    }
    const logicalPaths = descriptor.mappings.map((entry) => entry.logicalPath);
    const physicalPaths = descriptor.mappings.map((entry) => entry.physicalPath);
    if (new Set(logicalPaths).size !== logicalPaths.length || new Set(physicalPaths).size !== physicalPaths.length) {
      return "SOURCE_LAYOUT_MAPPING_COLLISION";
    }
    for (const physicalPath of physicalPaths) {
      try {
        assertSafeMappingPath(physicalPath, "SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE");
      } catch {
        return "SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE";
      }
    }
    if (logicalPaths.some((logicalPath) => !LOGICAL_PATHS.includes(logicalPath))) {
      return "SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED";
    }
    if (canonicalJson(logicalPaths) !== canonicalJson(LOGICAL_PATHS)) return "SOURCE_LAYOUT_MAPPING_INCOMPLETE";
    const rawHash = sha256Hex(`${canonicalJson(descriptor)}\n`);
    if (rawHash !== layoutPackage.mappingSha256) return "SOURCE_LAYOUT_MAPPING_HASH_MISMATCH";
    return null;
  } catch (error) {
    return diagnosticCodeFromError(error);
  }
}

async function evaluatePhysicalFixture({ cwd, fixture, mapping }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-physical-fixture-"));
  try {
    await copyPhysicalTree(cwd, workspace);
    const mutation = fixture.mutation;
    if (mutation?.target !== "physical-source") return allowedOutcome();
    const physicalRoot = path.join(workspace, SFLM_PHYSICAL_SOURCE_ROOT);
    const relativePath = stripPhysicalRoot(mutation.path);
    if (mutation.operation === "add-hardlink") {
      const aliasPath = stripPhysicalRoot(mutation.secondaryPath);
      await fs.mkdir(path.dirname(path.join(physicalRoot, aliasPath)), { recursive: true });
      await fs.link(path.join(physicalRoot, relativePath), path.join(physicalRoot, aliasPath));
      try {
        await listIndependentRegularFiles(workspace, SFLM_PHYSICAL_SOURCE_ROOT);
      } catch (error) {
        return blockedOutcome(diagnosticCodeFromError(error));
      }
    }
    if (mutation.operation === "add-file") {
      await fs.mkdir(path.dirname(path.join(physicalRoot, relativePath)), { recursive: true });
      await fs.writeFile(path.join(physicalRoot, relativePath), String(mutation.value));
      const tree = await listIndependentRegularFiles(workspace, SFLM_PHYSICAL_SOURCE_ROOT);
      const expected = mapping.mappings.map((entry) => entry.physicalPath).sort();
      if (canonicalJson(tree.files.map((entry) => entry.path).sort()) !== canonicalJson(expected)) {
        return blockedOutcome("SOURCE_LAYOUT_FILE_UNDECLARED");
      }
    }
    if (mutation.operation === "replace-byte") {
      await fs.appendFile(path.join(physicalRoot, relativePath), Buffer.from(String(mutation.value)));
      const row = mapping.mappings.find((entry) => entry.physicalPath === relativePath);
      if (!row || await rawFileHash(path.join(physicalRoot, relativePath)) !== row.sha256) {
        return blockedOutcome("SOURCE_LAYOUT_SOURCE_HASH_MISMATCH");
      }
    }
    return allowedOutcome();
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function copyPhysicalTree(cwd, workspace) {
  const tree = await listIndependentRegularFiles(cwd, SFLM_PHYSICAL_SOURCE_ROOT);
  for (const entry of tree.files) {
    const destination = path.join(workspace, SFLM_PHYSICAL_SOURCE_ROOT, entry.path);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, entry.path), destination);
  }
}

function stripPhysicalRoot(value) {
  if (typeof value !== "string") return "";
  return value.startsWith(`${SFLM_PHYSICAL_SOURCE_ROOT}/`) ? value.slice(SFLM_PHYSICAL_SOURCE_ROOT.length + 1) : value;
}

async function evaluateStagedFixture({ cwd, fixture, mapping, layoutPackage }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-staged-fixture-"));
  try {
    await stageMappedCompilerWorkspace({ cwd, workspace, mapping, layoutPackage });
    const mutation = fixture.mutation;
    if (mutation?.target !== "staged-logical-source") return allowedOutcome();
    if (mutation.operation === "replace-byte") {
      const logicalPath = `${SC_SOURCE_ROOT}/${mutation.path}`;
      await fs.appendFile(path.join(workspace, logicalPath), Buffer.from(String(mutation.value)));
      const row = mapping.mappings.find((entry) => entry.logicalPath === mutation.path);
      const physicalHash = await rawFileHash(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, row.physicalPath));
      const logicalHash = await rawFileHash(path.join(workspace, logicalPath));
      if (physicalHash !== logicalHash) return blockedOutcome("SOURCE_LAYOUT_BYTE_MISMATCH");
    }
    if (mutation.operation === "replace-value") {
      const [logicalFile, pointer = ""] = mutation.path.split("#");
      const absolute = path.join(workspace, SC_SOURCE_ROOT, logicalFile);
      const document = await readJson(absolute);
      setJsonPointer(document, pointer, deepClone(mutation.value));
      await writeCanonicalJson(absolute, document);
      const refs = collectDeclaredSourceRefs(document);
      if (refs.some((ref) => !ref.startsWith("declared-source://source-conformance/"))) {
        return blockedOutcome("SOURCE_LAYOUT_CANONICAL_REF_MISMATCH");
      }
    }
    return allowedOutcome();
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function evaluateCompilerHashFixture({ cwd, fixture, compilerRefs }) {
  const mutation = fixture.mutation;
  if (mutation?.target !== "compiler-ref" || mutation.operation !== "replace-hash") return allowedOutcome();
  const mutatedRefs = deepClone(compilerRefs);
  const checked = mutatedRefs.find((entry) => entry.path === mutation.path);
  if (!checked) return allowedOutcome();
  checked.hash = mutation.value;
  try {
    await buildCheckedRefs(cwd, mutatedRefs, "javascript-source", "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH");
  } catch (error) {
    if (diagnosticCodeFromError(error) === "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH") {
      return blockedOutcome("SOURCE_LAYOUT_COMPILER_HASH_MISMATCH");
    }
  }
  return allowedOutcome();
}

async function evaluateCompilerFailureFixture({ cwd, fixture, mapping, layoutPackage }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-compiler-fixture-"));
  try {
    await stageMappedCompilerWorkspace({ cwd, workspace, mapping, layoutPackage });
    const mutation = fixture.mutation;
    if (mutation?.target !== "probe-workspace" || mutation.operation !== "remove-file") return allowedOutcome();
    await fs.rm(path.join(workspace, SC_SOURCE_ROOT, mutation.path));
    const result = await executeCompiler(cwd, workspace);
    return result.exitCode !== 0 ? blockedOutcome("SOURCE_LAYOUT_COMPILER_RUN_FAILED") : allowedOutcome();
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function evaluateInnerEvidenceFixture({ cwd, fixture, mapping, layoutPackage, mappedEvidenceRemap }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-layout-inner-fixture-"));
  try {
    await stageMappedCompilerWorkspace({ cwd, workspace, mapping, layoutPackage });
    const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
    if (materializer.exitCode !== 0) return allowedOutcome();
    for (const row of mappedEvidenceRemap.artifactMappings) {
      await fs.mkdir(path.dirname(path.join(workspace, row.logicalPath)), { recursive: true });
      await fs.copyFile(path.join(cwd, row.persistedPath), path.join(workspace, row.logicalPath));
    }
    const mutation = fixture.mutation;
    if (mutation?.target !== "captured-inner-evidence" || mutation.operation !== "replace-hash") return allowedOutcome();
    const target = mappedEvidenceRemap.artifactMappings.find((entry) => path.posix.basename(entry.persistedPath) === path.posix.basename(mutation.path));
    const evidenceMapping = mappedEvidenceRemap.artifactMappings.find((entry) => entry.logicalPath === `${SC_ARTIFACT_ROOT}/evidence.json`);
    if (!target || !evidenceMapping) return allowedOutcome();
    const evidence = await readJson(path.join(workspace, evidenceMapping.logicalPath));
    const ref = evidence.artifacts.find((entry) => entry.path === target.logicalPath);
    if (!ref) return allowedOutcome();
    ref.hash = mutation.value;
    await writeCanonicalJson(path.join(workspace, evidenceMapping.logicalPath), evidence);
    const innerCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    return innerCode !== null ? blockedOutcome("SOURCE_LAYOUT_INNER_EVIDENCE_INVALID") : allowedOutcome();
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

function provisionalFinalEvidenceOutcome(fixture) {
  const mutation = fixture.mutation;
  if (mutation?.target !== "final-evidence" || mutation.operation !== "replace-hash") return allowedOutcome();
  return blockedOutcome("SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH");
}

async function evaluateFinalEvidenceFixture({ cwd, fixture, evidence }) {
  const mutation = fixture?.mutation;
  if (mutation?.target !== "final-evidence" || mutation.operation !== "replace-hash") return allowedOutcome();
  const mutated = deepClone(evidence);
  setJsonPointer(mutated, mutation.path.startsWith("/") ? mutation.path : `/${mutation.path}`, mutation.value);
  return await firstEvidenceIntegrityFailureCode(cwd, mutated) === "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH"
    ? blockedOutcome("SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH")
    : allowedOutcome();
}

function setJsonPointer(target, pointer, value) {
  const segments = String(pointer || "").split("/").slice(1).map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (segments.length === 0) throw contractError("invalid empty JSON pointer mutation", 1);
  let current = target;
  for (const segment of segments.slice(0, -1)) {
    if (current[segment] === undefined) current[segment] = {};
    current = current[segment];
  }
  current[segments.at(-1)] = value;
}

function diagnosticCodeFromError(error) {
  return String(error?.message || error).match(/SOURCE_LAYOUT_[A-Z_]+/)?.[0] || null;
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
  return diagnosticsRegistry().filter((entry) => codes.has(entry.code));
}

function buildRunId({ layoutPackage, mapping, expectations, compilerRefs, runtimeRefs, comparison, authorityExpansionProbe, mappedEvidenceRemap }) {
  return `source-family-layout-mapping-${sha256Hex(canonicalJson({
    layoutPackage,
    mapping,
    expectations,
    compilerRefs,
    runtimeRefs,
    comparison,
    authorityExpansionProbe,
    mappedEvidenceRemap
  })).slice(0, 32)}`;
}

function buildReport({
  runId,
  mappingRef,
  layoutPackageRef,
  receiptRef,
  compilerRefs,
  runtimeRefs,
  mappedEvidenceRemap,
  mappingVerification,
  comparison,
  authorityExpansionProbe,
  results,
  diagnostics
}) {
  return {
    schemaId: "source-family-layout-mapping-report.v0",
    version: SFLM_VERSION,
    runId,
    layoutPackageRef,
    mappingRef,
    compilerRefs,
    runtimeRefs,
    layoutMappingReceiptRef: receiptRef,
    mappedEvidenceRemap,
    mappingVerification,
    baselineComparison: comparison,
    authorityExpansionProbe,
    results,
    diagnostics,
    compilerExecutions: {
      acceptedMappedBundlePasses: 1,
      causalProbeFailures: 2,
      total: 3
    },
    diagnosticsRegistry: diagnosticsRegistry(),
    status: "pass",
    promotionStatus: "review_required",
    nonAuthorityStatement: "This proof establishes one fixed physical-to-logical layout mapping for the accepted team-owned source bundle. It adds no source authority, arbitrary layout support, namespace mapping, live connector, self-serve UI, runtime accessibility claim, production adapter, SurfaceOps expansion, or JudgmentKit capability.",
    provenance: provenance("interfacectl-source-family-layout-mapping-report", [SFLM_LAYOUT_PACKAGE_PATH, SFLM_MAPPING_PATH])
  };
}

async function buildEvidence({
  cwd,
  command,
  args,
  runId,
  mapping,
  layoutPackage,
  mappingRef,
  layoutPackageRef,
  compilerRefs,
  runtimeRefs,
  mappedEvidenceRemap,
  results,
  diagnostics
}) {
  const schemaClosure = [];
  for (const schemaPath of sflmSchemaPaths()) {
    schemaClosure.push(artifactRef(schemaPath, sflmSchemaIdForPath(schemaPath), await canonicalFileHash(path.join(cwd, schemaPath))));
  }
  const physicalSourceRefs = await buildPhysicalSourceRefs(cwd, mapping, layoutPackage);
  const fixtureRefs = [];
  for (const fixturePath of sflmFixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, sflmSchemaIdForPath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const boundaryRefs = [];
  for (const boundaryPath of BOUNDARY_PATHS) {
    boundaryRefs.push(withProvenance(
      artifactRef(boundaryPath, sflmSchemaIdForPath(boundaryPath), await boundaryHash(cwd, boundaryPath)),
      "interfacectl-source-family-layout-mapping-boundary"
    ));
  }
  const artifacts = [];
  for (const artifactPath of SFLM_ARTIFACT_PATHS) {
    artifacts.push(withProvenance(artifactRef(
      artifactPath,
      sflmSchemaIdForPath(artifactPath),
      artifactPath === `${SFLM_ARTIFACT_ROOT}/evidence.json` ? null : await canonicalFileHash(path.join(cwd, artifactPath))
    ), "interfacectl-source-family-layout-mapping-evidence"));
  }
  const evidence = {
    contractId: SFLM_CONTRACT_ID,
    schemaId: "source-family-layout-mapping-evidence.v0",
    version: SFLM_VERSION,
    runId,
    checkedAt: SFLM_TIMESTAMP,
    command,
    args,
    environment: { ...SFLM_ENVIRONMENT },
    schemaClosure,
    layoutPackageRef,
    mappingRef,
    physicalSourceRefs,
    compilerRefs,
    runtimeRefs,
    fixtureRefs,
    boundaryRefs,
    artifacts,
    mappedEvidenceRemap,
    mappedEvidenceClosureVerified: true,
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: results,
    status: "pass",
    promotionStatus: "review_required",
    provenance: provenance("interfacectl-source-family-layout-mapping-evidence", [
      SFLM_LAYOUT_PACKAGE_PATH,
      SFLM_MAPPING_PATH,
      "plans/source-family-layout-mapping.md"
    ])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

async function buildPhysicalSourceRefs(cwd, mapping, layoutPackage) {
  const manifestEntry = layoutPackage.entries.find((entry) => entry.logicalPath === "manifest.json");
  const manifest = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, manifestEntry.physicalPath));
  const refs = [];
  for (const mappingRow of mapping.mappings) {
    const sourcePath = `${SFLM_PHYSICAL_SOURCE_ROOT}/${mappingRow.physicalPath}`;
    const manifestRow = manifest.sourceFiles.find((entry) => entry.path === mappingRow.logicalPath);
    refs.push(artifactRef(
      sourcePath,
      sflmSchemaIdForPath(sourcePath),
      await rawFileHash(path.join(cwd, sourcePath)),
      manifestRow?.sourceRefRoot || null
    ));
  }
  return refs;
}

function withProvenance(ref, generator) {
  return { ...ref, provenance: provenance(generator, [ref.path]) };
}

async function boundaryHash(cwd, artifactPath) {
  if (artifactPath === SFLM_P2_EVIDENCE_PATH) {
    return p2Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  }
  if (artifactPath === SFLM_SFP_EVIDENCE_PATH) {
    return sourceFamilyPackagingInternals.computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath)));
  }
  return canonicalFileHash(path.join(cwd, artifactPath));
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifacts?.[clone.artifacts.length - 1];
  if (finalRef?.path === `${SFLM_ARTIFACT_ROOT}/evidence.json`) finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  try {
    return await inspectEvidenceIntegrity(cwd, evidence);
  } catch (error) {
    return diagnosticCodeFromError(error) || "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
}

async function inspectEvidenceIntegrity(cwd, evidence) {
  const validators = await loadValidators(cwd);
  const evidenceValidator = validators.get("source-family-layout-mapping-evidence.v0");
  if (
    evidence.contractId !== SFLM_CONTRACT_ID ||
    evidence.schemaId !== "source-family-layout-mapping-evidence.v0" ||
    evidence.version !== SFLM_VERSION ||
    evidence.checkedAt !== SFLM_TIMESTAMP ||
    evidence.command !== SFLM_COMMAND ||
    canonicalJson(evidence.args) !== canonicalJson(expectedCommandArgs()) ||
    canonicalJson(evidence.environment) !== canonicalJson(SFLM_ENVIRONMENT)
  ) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.schemaClosure || []).map((entry) => entry.path)) !== canonicalJson(sflmSchemaPaths())) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  if (
    evidence.layoutPackageRef?.path !== SFLM_LAYOUT_PACKAGE_PATH ||
    evidence.layoutPackageRef.hash !== await rawFileHash(path.join(cwd, SFLM_LAYOUT_PACKAGE_PATH))
  ) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  if (
    evidence.mappingRef?.path !== SFLM_MAPPING_PATH ||
    evidence.mappingRef.hash !== await rawFileHash(path.join(cwd, SFLM_MAPPING_PATH))
  ) {
    return "SOURCE_LAYOUT_MAPPING_HASH_MISMATCH";
  }
  const { layoutPackage, mapping } = await verifyImmutableLayoutInputs(cwd);
  const expectedPhysicalRefs = await buildPhysicalSourceRefs(cwd, mapping, layoutPackage);
  if (canonicalJson(evidence.physicalSourceRefs) !== canonicalJson(expectedPhysicalRefs)) {
    return "SOURCE_LAYOUT_SOURCE_HASH_MISMATCH";
  }
  for (const ref of evidence.physicalSourceRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_LAYOUT_SOURCE_HASH_MISMATCH";
  }
  const packagingFixture = await readJson(path.join(cwd, SFP_PACKAGE_PATH));
  const expectedCompilerRefs = packagingFixture.compiler.implementationRefs.map((ref) => artifactRef(ref.path, "javascript-source", ref.hash));
  const expectedRuntimeRefs = packagingFixture.compiler.runtime.dependencyRefs.map((ref) => artifactRef(ref.path, "node-package-input", ref.hash));
  if (canonicalJson(evidence.compilerRefs) !== canonicalJson(expectedCompilerRefs)) return "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH";
  if (canonicalJson(evidence.runtimeRefs) !== canonicalJson(expectedRuntimeRefs)) return "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH";
  for (const ref of [...(evidence.compilerRefs || []), ...(evidence.runtimeRefs || [])]) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.fixtureRefs || []).map((entry) => entry.path)) !== canonicalJson(sflmFixturePaths())) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.boundaryRefs || []).map((entry) => entry.path)) !== canonicalJson(BOUNDARY_PATHS)) {
    return "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH";
  }
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.hash !== await boundaryHash(cwd, ref.path)) return "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH";
  }
  if (canonicalJson((evidence.artifacts || []).map((entry) => entry.path)) !== canonicalJson(SFLM_ARTIFACT_PATHS)) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${SFLM_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (
    !finalRef ||
    finalRef.path !== `${SFLM_ARTIFACT_ROOT}/evidence.json` ||
    finalRef.hash !== computeEvidenceSelfHash(evidence)
  ) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  if (
    evidence.mappedEvidenceClosureVerified !== true ||
    canonicalJson(evidence.mappedEvidenceRemap) !== canonicalJson(sflmMappedEvidenceRemap())
  ) {
    return "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID";
  }
  if (!evidenceValidator || !evidenceValidator(evidence)) return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  if (await firstPersistedMappedEvidenceIntegrityFailureCode(cwd, evidence.mappedEvidenceRemap, mapping, layoutPackage, validators) !== null) {
    return "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID";
  }
  const report = await readJson(path.join(cwd, `${SFLM_ARTIFACT_ROOT}/source-family-layout-mapping-report.json`));
  if (
    report.runId !== evidence.runId ||
    canonicalJson(report.layoutPackageRef) !== canonicalJson(evidence.layoutPackageRef) ||
    canonicalJson(report.mappingRef) !== canonicalJson(evidence.mappingRef) ||
    canonicalJson(report.compilerRefs) !== canonicalJson(evidence.compilerRefs) ||
    canonicalJson(report.runtimeRefs) !== canonicalJson(evidence.runtimeRefs) ||
    canonicalJson(report.mappedEvidenceRemap) !== canonicalJson(evidence.mappedEvidenceRemap) ||
    canonicalJson(report.results) !== canonicalJson(evidence.validationResults) ||
    canonicalJson(report.diagnostics) !== canonicalJson(evidence.diagnostics) ||
    canonicalJson(report.compilerExecutions) !== canonicalJson({ acceptedMappedBundlePasses: 1, causalProbeFailures: 2, total: 3 }) ||
    report.status !== "pass" ||
    report.promotionStatus !== "review_required" ||
    evidence.status !== "pass" ||
    evidence.promotionStatus !== "review_required"
  ) {
    return "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validators = new Map();
  const schemas = [];
  for (const schemaPath of sflmSchemaPaths()) schemas.push([schemaPath, await readJson(path.join(cwd, schemaPath))]);
  for (const [, schema] of schemas) ajv.addSchema(schema);
  for (const [schemaPath, schema] of schemas) {
    const schemaId = path.posix.basename(schemaPath).replace(/\.schema\.json$/, "");
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

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const sourceFamilyLayoutMappingInternals = {
  parseSourceFamilyLayoutMappingArgs,
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  firstPersistedMappedEvidenceIntegrityFailureCode,
  verifyPhysicalMapping,
  listIndependentRegularFiles,
  prepareOutputRoot,
  classifyMutatedDescriptor,
  setJsonPointer
};
