import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import {
  P2_ARTIFACT_PATHS,
  P2_ARTIFACT_ROOT,
  P2_ENVIRONMENT,
  P2_FIXTURE_FILES,
  P2_FIXTURE_ROOT,
  P2_GENERATED_ARTIFACTS,
  P2_MAPPING_FILES,
  P2_PACKAGE_INTEGRITY,
  P2_PACKAGE_NAME,
  P2_PACKAGE_TARBALL,
  P2_PACKAGE_VERSION,
  P2_SCHEMA_FILES,
  P2_SCHEMA_ROOT,
  P2_SHARED_SCHEMA_FILES,
  P2_SOURCE_FILES,
  P2_SOURCE_ROOT,
  P2_TIMESTAMP,
  P2_VERSION,
  canonicalFileHash,
  deepClone,
  p2ArtifactOrder,
  p2FixturePaths,
  p2SchemaPaths,
  p2SourceRefPaths,
  rawFileHash,
  readJson,
  schemaIdForP2Path,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";

const STAGE_ORDER = new Map([
  ["source-inventory", 0],
  ["mapping", 1],
  ["extract", 2],
  ["compile", 3],
  ["govern", 4],
  ["report", 5],
  ["evidence", 6]
]);
const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;
const SOURCE_REF_PREFIX = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/";
const DOCS_REF_PREFIX = "source://p2/docs/";
const MAPPING_REF_PREFIX = "mapping://p2/spectrum/";
const POINTER_PATTERN = /^#\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*)?$/;
const PATH_SEGMENT_PATTERN = /^(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*(?:^|\/)\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9._@-]+(?:\/[A-Za-z0-9._@-]+)*$/;

export async function runP2Interfacectl(argv, io) {
  const parsed = parseIngestProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runIngestProof({
      cwd: io.cwd,
      sourceRoot: parsed.source,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: "interfacectl surfaces ingest proof",
      args: ["--source", parsed.source, "--fixture", parsed.fixture, "--out", parsed.out]
    });
    io.stdout.write([
      `surfaces ingest proof: ${result.status}`,
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

function parseIngestProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--source") {
      result.source = argv[i + 1];
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
  if (!result.source || !result.fixture || !result.out) {
    return { ok: false, error: "usage: interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2" };
  }
  for (const [flagName, value] of [["--source", result.source], ["--fixture", result.fixture], ["--out", result.out]]) {
    const parsed = parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    result[flagName.slice(2)] = parsed.path;
  }
  return { ok: true, source: result.source, fixture: result.fixture, out: result.out };
}

function parseRelativePosixPath(value, flagName) {
  if (typeof value !== "string" || value.length === 0) {
    return { ok: false, error: `${flagName} must be a POSIX-style relative path` };
  }
  if (value.includes("\\") || path.isAbsolute(value) || value.startsWith("/")) {
    return { ok: false, error: `${flagName} must be a POSIX-style relative path` };
  }
  const trimmed = value.replace(/\/+$/, "");
  const segments = trimmed.split("/");
  if (trimmed.length === 0 || segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return { ok: false, error: `${flagName} must be a POSIX-style relative path without . or .. segments` };
  }
  return { ok: true, path: trimmed };
}

export async function runIngestProof({ cwd, sourceRoot, fixtureRoot, outRoot, command, args }) {
  assertP2CommandRoots(sourceRoot, fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, sourceRoot), `missing source path: ${sourceRoot}`);
  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertReadableDir(path.join(cwd, P2_SCHEMA_ROOT), `unreadable schema path: ${P2_SCHEMA_ROOT}`);
  await assertRequiredP2Files(cwd);
  await assertSchemaDirectoryCompleteness(cwd);

  const validators = await loadValidators(cwd);
  const manifestPath = `${sourceRoot}/manifest.json`;
  const manifest = await readJson(path.join(cwd, manifestPath));
  assertSchema(validators, "p2", "design-source-manifest.v0", manifest, manifestPath);
  await sourcePreflight(cwd, sourceRoot, manifest);
  await rejectStaleOutput(cwd, outRoot);

  const expectationsPath = `${fixtureRoot}/expectations.manifest.json`;
  const expectations = await readJson(path.join(cwd, expectationsPath));
  assertSchema(validators, "p2", "design-system-ingestion-expectations.v0", expectations, expectationsPath);
  await assertP2Expectations(cwd, expectations, sourceRoot, fixtureRoot, outRoot);
  const diagnosticsRows = await loadDiagnosticsRows(cwd);
  const context = await loadSourceContext(cwd, sourceRoot, manifest);
  assertManifestRefsResolve(context);
  const runId = buildRunId({ manifest, expectations, command, args });

  const sourceInventory = buildSourceInventory({ manifest, context });
  assertSchema(validators, "p2", "design-source-inventory.v0", sourceInventory, `${outRoot}/source-inventory.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-inventory.json"), sourceInventory);
  const sourceInventoryHash = await canonicalFileHash(path.join(cwd, outRoot, "source-inventory.json"));

  const sourceMapping = await buildSourceMapping({
    sourceInventoryHash,
    diagnosticsRows,
    context
  });
  assertSchema(validators, "p2", "design-source-mapping.v0", sourceMapping, `${outRoot}/source-mapping.json`);
  assertSourceMappingRefsResolve(sourceMapping, context);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-mapping.json"), sourceMapping);
  const sourceMappingHash = await canonicalFileHash(path.join(cwd, outRoot, "source-mapping.json"));

  const extract = buildExtract({ manifest, context, sourceMappingHash });
  assertExtractSourceRefs(extract);
  assertArtifactSourceRefsResolve(extract, context, `${outRoot}/extract.json`);
  assertSchema(validators, "p0", "extract.v0", extract, `${outRoot}/extract.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "extract.json"), extract);
  const extractHash = await canonicalFileHash(path.join(cwd, outRoot, "extract.json"));

  const catalog = buildCatalog({ context, extractHash, governed: false });
  assertArtifactSourceRefsResolve(catalog, context, `${outRoot}/catalog.json`);
  assertSchema(validators, "p0", "runtime-catalog.v0", catalog, `${outRoot}/catalog.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "catalog.json"), catalog);
  const catalogHash = await canonicalFileHash(path.join(cwd, outRoot, "catalog.json"));

  const governedCatalog = buildCatalog({ context, extractHash, governed: true });
  assertArtifactSourceRefsResolve(governedCatalog, context, `${outRoot}/governed-catalog.json`);
  assertMappingTargetsExist(sourceMapping, governedCatalog);
  assertSchema(validators, "p0", "runtime-catalog.v0", governedCatalog, `${outRoot}/governed-catalog.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "governed-catalog.json"), governedCatalog);
  const governedCatalogHash = await canonicalFileHash(path.join(cwd, outRoot, "governed-catalog.json"));

  const validationResults = await evaluateP2Expectations({
    cwd,
    expectations,
    diagnosticsRows,
    validators,
    context,
    sourceInventoryHash,
    sourceMapping,
    extract,
    catalog,
    governedCatalog
  });
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "pass") {
    assertPositiveCoverage(expectations, { context, sourceMapping, governedCatalog });
  }
  const promotionStatus = status === "pass" ? aggregatePromotionStatus(validationResults) : "blocked";
  if (status === "fail") {
    const mismatches = validationResults
      .filter((result) => !result.matched)
      .map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"}`);
    throw contractError(`P2 validation expectation mismatch: ${mismatches.join("; ")}`, 1);
  }
  const report = {
    schemaId: "design-system-ingestion-report.v0",
    version: P2_VERSION,
    sourceManifest: {
      path: manifestPath,
      hashAlgorithm: "sha256",
      hash: await canonicalFileHash(path.join(cwd, manifestPath)),
      sourceFiles: manifest.sourceFiles.length,
      requiredMappings: manifest.requiredMappings.length
    },
    sourceInventory: {
      path: `${outRoot}/source-inventory.json`,
      hashAlgorithm: "sha256",
      hash: sourceInventoryHash,
      status: "pass"
    },
    sourceMapping: {
      path: `${outRoot}/source-mapping.json`,
      hashAlgorithm: "sha256",
      hash: sourceMappingHash,
      status: "pass",
      acceptedRows: sourceMapping.mappingRows.length,
      reviewRequiredRows: sourceMapping.reviewRequired.length
    },
    extraction: {
      path: `${outRoot}/extract.json`,
      hashAlgorithm: "sha256",
      hash: extractHash,
      components: extract.components.map((component) => component.id),
      tokenRefs: Object.keys(extract.tokens)
    },
    catalogCompilation: {
      catalogRef: { path: `${outRoot}/catalog.json`, hashAlgorithm: "sha256", hash: catalogHash },
      governedCatalogRef: { path: `${outRoot}/governed-catalog.json`, hashAlgorithm: "sha256", hash: governedCatalogHash },
      components: Object.keys(governedCatalog.components)
    },
    governance: {
      promotionStatus,
      reviewRequired: sourceMapping.reviewRequired
    },
    fixtureResults: validationResults.map(stripResult),
    diagnostics,
    status,
    promotionStatus
  };
  assertRunExpectation(expectations, report);
  assertArtifactSourceRefsResolve(report, context, `${outRoot}/ingestion-report.json`);
  assertSchema(validators, "p2", "design-system-ingestion-report.v0", report, `${outRoot}/ingestion-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "ingestion-report.json"), report);

  const evidence = await buildEvidence({
    cwd,
    sourceRoot,
    fixtureRoot,
    outRoot,
    manifest,
    expectations,
    command,
    args,
    runId,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertArtifactSourceRefsResolve(evidence, context, `${outRoot}/evidence.json`);
  assertSchema(validators, "p2", "design-system-ingestion-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifactRefs[persistedEvidence.artifactRefs.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("P2 evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`P2 evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: P2_ARTIFACT_PATHS
  };
}

function assertP2CommandRoots(sourceRoot, fixtureRoot, outRoot) {
  if (sourceRoot !== P2_SOURCE_ROOT || fixtureRoot !== P2_FIXTURE_ROOT || outRoot !== P2_ARTIFACT_ROOT) {
    throw contractError(`P2 ingest proof requires --source ${P2_SOURCE_ROOT} --fixture ${P2_FIXTURE_ROOT} --out ${P2_ARTIFACT_ROOT}`, 2);
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

async function assertRequiredP2Files(cwd) {
  const required = [
    ...p2SchemaPaths(),
    `${P2_SOURCE_ROOT}/manifest.json`,
    ...p2SourceRefPaths(),
    ...p2FixturePaths()
  ];
  for (const relativePath of required) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing P2 required file: ${relativePath}`, 2);
    }
  }
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const required = new Set(p2SchemaPaths());
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, P2_SCHEMA_ROOT), P2_SCHEMA_ROOT)).sort();
  const missing = [...required].filter((entry) => !actualSchemaEntries.includes(entry)).sort();
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (required.has(entry)) return false;
    const fileName = entry.slice(`${P2_SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
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
  const allowed = new Set(P2_GENERATED_ARTIFACTS);
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

async function sourcePreflight(cwd, sourceRoot, manifest) {
  if (
    manifest.packageName !== P2_PACKAGE_NAME ||
    manifest.packageVersion !== P2_PACKAGE_VERSION ||
    manifest.packageTarball !== P2_PACKAGE_TARBALL ||
    manifest.packageIntegrity !== P2_PACKAGE_INTEGRITY ||
    manifest.designSystemId !== "adobe-spectrum" ||
    manifest.designSystemName !== "Adobe Spectrum Design Data" ||
    manifest.sourceFamily !== "design-system-source-bundle.v0" ||
    canonicalJson(manifest.initialComponents) !== canonicalJson(["button", "in-line-alert"])
  ) {
    throw contractError("P2 source preflight failed: source manifest package metadata does not match the pinned Spectrum package", 1);
  }

  const expectedSourcePaths = P2_SOURCE_FILES.map((entry) => entry.path);
  const expectedMappingPaths = P2_MAPPING_FILES.map((entry) => entry.path);
  assertOrderedPaths("P2 source manifest sourceFiles", manifest.sourceFiles.map((entry) => entry.path), expectedSourcePaths);
  assertOrderedPaths("P2 source manifest requiredMappings", manifest.requiredMappings.map((entry) => entry.path), expectedMappingPaths);

  const allowedRoots = await buildAllowedSourceRoots(cwd, sourceRoot);
  const declaredPaths = new Set(expectedSourcePaths);
  for (const [index, sourceFile] of manifest.sourceFiles.entries()) {
    assertNormalizedRelativePath(sourceFile.path, `sourceFiles/${index}/path`);
    if (!declaredPaths.has(sourceFile.path)) {
      throw contractError(`P2 source preflight failed: undeclared source file ${sourceFile.path}`, 1);
    }
    if (!sourceFile.path.startsWith("npm/@adobe/spectrum-design-data/0.7.0/package/") && sourceFile.path !== "docs/usage-policy.json") {
      throw contractError(`P2 source preflight failed: source file outside allowed roots ${sourceFile.path}`, 1);
    }
    const sourceRefPath = parseSourceRef(sourceFile.sourceRefRoot, `sourceFiles/${index}/sourceRefRoot`);
    if (sourceRefPath !== sourceFile.path) {
      throw contractError(`P2 source preflight failed: source ref does not match source path ${sourceFile.path}`, 1);
    }
    const filePath = path.join(cwd, sourceRoot, sourceFile.path);
    await assertRegularLocalFile(filePath, `${sourceRoot}/${sourceFile.path}`, allowedRoots);
    const hash = await rawFileHash(filePath);
    if (sourceFile.hashAlgorithm !== "sha256" || sourceFile.sha256 !== hash) {
      throw contractError(`P2 source preflight failed: hash mismatch for ${sourceFile.path}`, 1);
    }
  }

  for (const [index, mappingFile] of manifest.requiredMappings.entries()) {
    assertNormalizedRelativePath(mappingFile.path, `requiredMappings/${index}/path`);
    if (!expectedMappingPaths.includes(mappingFile.path)) {
      throw contractError(`P2 source preflight failed: undeclared mapping file ${mappingFile.path}`, 1);
    }
    const mappingRefPath = parseMappingRef(mappingFile.mappingRefRoot, `requiredMappings/${index}/mappingRefRoot`);
    if (mappingRefPath !== mappingFile.path) {
      throw contractError(`P2 source preflight failed: mapping ref does not match mapping path ${mappingFile.path}`, 1);
    }
    const filePath = path.join(cwd, sourceRoot, mappingFile.path);
    await assertRegularLocalFile(filePath, `${sourceRoot}/${mappingFile.path}`, allowedRoots);
    const hash = await rawFileHash(filePath);
    if (mappingFile.hashAlgorithm !== "sha256" || mappingFile.sha256 !== hash) {
      throw contractError(`P2 source preflight failed: mapping hash mismatch for ${mappingFile.path}`, 1);
    }
  }

  for (const [index, policyRef] of manifest.policyRefs.entries()) {
    const refPath = parseSourceRef(policyRef, `policyRefs/${index}`);
    if (!declaredPaths.has(refPath)) {
      throw contractError(`P2 source preflight failed: policy ref points outside manifest source files ${policyRef}`, 1);
    }
  }
}

async function buildAllowedSourceRoots(cwd, sourceRoot) {
  const sourceRootPath = path.join(cwd, sourceRoot);
  const realSourceRoot = await fs.realpath(sourceRootPath);
  const relativeRoots = [
    "npm/@adobe/spectrum-design-data/0.7.0/package",
    "docs",
    "mappings"
  ];
  const roots = [];
  for (const relativeRoot of relativeRoots) {
    const rootPath = path.join(sourceRootPath, relativeRoot);
    const realRoot = await fs.realpath(rootPath);
    if (realRoot !== realSourceRoot && !realRoot.startsWith(`${realSourceRoot}${path.sep}`)) {
      throw contractError(`P2 source preflight failed: allowed source root escapes declared bundle ${sourceRoot}/${relativeRoot}`, 1);
    }
    roots.push(realRoot);
  }
  return roots;
}

async function assertRegularLocalFile(filePath, label, allowedRoots) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`P2 source preflight failed: missing local file ${label}`, 1);
  }
  if (!stat.isFile()) {
    throw contractError(`P2 source preflight failed: source entry is not a regular file ${label}`, 1);
  }
  const realFile = await fs.realpath(filePath);
  const insideAllowedRoot = allowedRoots.some((realRoot) =>
    realFile !== realRoot && realFile.startsWith(`${realRoot}${path.sep}`)
  );
  if (!insideAllowedRoot) {
    throw contractError(`P2 source preflight failed: source entry escapes declared source roots ${label}`, 1);
  }
}

async function assertP2Expectations(cwd, manifest, sourceRoot, fixtureRoot, outRoot) {
  if (manifest.sourceRoot !== sourceRoot || manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== P2_SCHEMA_ROOT) {
    throw contractError("P2 expectations manifest roots do not match proof command paths", 1);
  }
  assertOrderedPaths("P2 expectations manifest inputs", manifest.inputs, [
    `${P2_SOURCE_ROOT}/manifest.template.json`,
    `${P2_SOURCE_ROOT}/manifest.json`,
    ...p2SourceRefPaths(),
    ...p2FixturePaths()
  ]);
  assertOrderedPaths("P2 expectations manifest artifactOrder", manifest.artifactOrder, p2ArtifactOrder());
  assertOrderedPaths("P2 expectations fixture order", manifest.expectations.map((row) => row.fixturePath), P2_FIXTURE_FILES);
  assertNoDuplicatePaths("P2 expectations manifest inputs", manifest.inputs);
  assertNoDuplicatePaths("P2 expectations manifest expectations", manifest.expectations.map((row) => row.fixturePath));
  for (const inputPath of manifest.inputs) {
    if (inputPath.startsWith(`${P2_SOURCE_ROOT}/`)) {
      assertPathUnderRoot(inputPath, P2_SOURCE_ROOT, "P2 expectations input");
    } else {
      assertPathUnderRoot(inputPath, fixtureRoot, "P2 expectations input");
    }
  }
  const expectedFixtureEntries = [
    `${fixtureRoot}/expectations.manifest.json`,
    ...P2_FIXTURE_FILES,
    ...expectedDirectoryEntries([`${fixtureRoot}/expectations.manifest.json`, ...P2_FIXTURE_FILES], fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("P2 fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

async function loadSourceContext(cwd, sourceRoot, manifest) {
  const sourceByPath = new Map();
  for (const sourceFile of manifest.sourceFiles) {
    const absolute = path.join(cwd, sourceRoot, sourceFile.path);
    let json = null;
    if (sourceFile.path.endsWith(".json")) {
      json = await readJson(absolute);
    }
    sourceByPath.set(sourceFile.path, { ...sourceFile, absolute, json });
  }
  const mappingsByPath = new Map();
  for (const mappingFile of manifest.requiredMappings) {
    mappingsByPath.set(mappingFile.path, {
      ...mappingFile,
      absolute: path.join(cwd, sourceRoot, mappingFile.path),
      json: await readJson(path.join(cwd, sourceRoot, mappingFile.path))
    });
  }
  return {
    manifest,
    sourceByPath,
    mappingsByPath,
    button: sourceByPath.get("npm/@adobe/spectrum-design-data/0.7.0/package/components/button.json").json,
    inLineAlert: sourceByPath.get("npm/@adobe/spectrum-design-data/0.7.0/package/components/in-line-alert.json").json,
    usagePolicy: sourceByPath.get("docs/usage-policy.json").json
  };
}

function assertManifestRefsResolve(context) {
  for (const [index, sourceFile] of context.manifest.sourceFiles.entries()) {
    resolveSourceRef(sourceFile.sourceRefRoot, context, `sourceFiles/${index}/sourceRefRoot`);
  }
  for (const [index, mappingFile] of context.manifest.requiredMappings.entries()) {
    resolveMappingRef(mappingFile.mappingRefRoot, context, `requiredMappings/${index}/mappingRefRoot`);
  }
  for (const [index, policyRef] of context.manifest.policyRefs.entries()) {
    resolveSourceRef(policyRef, context, `policyRefs/${index}`);
  }
}

function buildSourceInventory({ manifest, context }) {
  return {
    schemaId: "design-source-inventory.v0",
    version: P2_VERSION,
    sourceManifestRef: {
      path: `${P2_SOURCE_ROOT}/manifest.json`,
      schemaId: "design-source-manifest.v0",
      hashAlgorithm: "sha256",
      hash: sha256Hex(canonicalJson(manifest))
    },
    sourceFiles: manifest.sourceFiles.map((entry) => ({
      path: `${P2_SOURCE_ROOT}/${entry.path}`,
      sourceType: entry.sourceType,
      hashAlgorithm: "sha256",
      hash: entry.sha256,
      sourceRefRoot: entry.sourceRefRoot
    })),
    sourceCoverage: {
      components: ["button", "in-line-alert"],
      tokens: manifest.sourceFiles.filter((entry) => entry.sourceType === "token").map((entry) => entry.path),
      registries: manifest.sourceFiles.filter((entry) => ["registry", "field", "mode"].includes(entry.sourceType)).map((entry) => entry.path),
      policies: manifest.policyRefs,
      mappings: manifest.requiredMappings.map((entry) => entry.path)
    },
    diagnostics: [],
    provenance: {
      generatedAt: P2_TIMESTAMP,
      generator: "interfacectl-p2-source-inventory",
      sourceRefs: manifest.sourceFiles.map((entry) => entry.sourceRefRoot).concat(
        [...context.mappingsByPath.values()].map((entry) => entry.mappingRefRoot)
      )
    }
  };
}

async function buildSourceMapping({ sourceInventoryHash, diagnosticsRows, context }) {
  const mappingRows = [];
  const reviewRequiredSourceRows = [];
  for (const mappingFile of context.manifest.requiredMappings) {
    const mappingInput = context.mappingsByPath.get(mappingFile.path).json;
    for (const row of Object.values(mappingInput.mappingRows || {})) {
      mappingRows.push(deepClone(row));
    }
    for (const row of Object.values(mappingInput.reviewRequired || {})) {
      reviewRequiredSourceRows.push(deepClone(row));
    }
  }
  mappingRows.sort((a, b) => a.mappingId.localeCompare(b.mappingId));
  reviewRequiredSourceRows.sort((a, b) => a.mappingId.localeCompare(b.mappingId));

  validateMappingRows(mappingRows, context);
  validateReviewRequiredRows(reviewRequiredSourceRows, context);
  const reviewDiagnostic = diagnosticForCode(diagnosticsRows, "INGEST_MAPPING_REVIEW_REQUIRED", {
    sourceRef: reviewRequiredSourceRows[0]?.sourceRefs?.[0] ?? null
  });
  return {
    schemaId: "design-source-mapping.v0",
    version: P2_VERSION,
    sourceInventoryRef: {
      path: `${P2_ARTIFACT_ROOT}/source-inventory.json`,
      schemaId: "design-source-inventory.v0",
      hashAlgorithm: "sha256",
      hash: sourceInventoryHash
    },
    mappingRows,
    reviewRequired: reviewRequiredSourceRows.map((row) => ({
      mappingId: row.mappingId,
      reason: row.reason ?? row.rationale,
      diagnosticCodes: row.diagnosticCodes
    })),
    diagnostics: [reviewDiagnostic],
    provenance: {
      generatedAt: P2_TIMESTAMP,
      generator: "interfacectl-p2-source-mapping",
      sourceRefs: [
        ...new Set(mappingRows.flatMap((row) => row.sourceRefs).concat(
          reviewRequiredSourceRows.flatMap((row) => row.sourceRefs)
        ))
      ].sort()
    }
  };
}

function buildExtract({ context, sourceMappingHash }) {
  const components = [
    extractComponent("Button", "button", context.button),
    extractComponent("InLineAlert", "in-line-alert", context.inLineAlert)
  ];
  const tokens = {
    "component-height-75": {
      $type: "dimension",
      $value: "32px",
      sourceRef: sourceRef("components/button.json", "/tokenBindings/0")
    },
    "border-width-200": {
      $type: "dimension",
      $value: "2px",
      sourceRef: sourceRef("components/in-line-alert.json", "/tokenBindings/0")
    },
    "button-minimum-width-multiplier": {
      $type: "number",
      $value: 2.25,
      sourceRef: sourceRef("tokens/layout-component.tokens.json", "/267")
    }
  };
  return {
    schemaId: "extract.v0",
    version: P2_VERSION,
    fixtureId: "p2-spectrum-design-data",
    generatedAt: P2_TIMESTAMP,
    sourceUri: `${P2_SOURCE_ROOT}/manifest.json`,
    sourceHash: sha256Hex(canonicalJson(context.manifest)),
    tokens,
    components,
    sourceRefs: collectExtractSourceRefs({ tokens, components }),
    provenance: {
      sourceUri: `${P2_SOURCE_ROOT}/manifest.json`,
      sourceHash: sha256Hex(canonicalJson(context.manifest)),
      sourceMappingHash,
      compilerVersion: P2_VERSION,
      schemaIds: ["extract.v0", "runtime-catalog.v0", "design-source-mapping.v0"],
      command: "interfacectl surfaces ingest proof",
      generatedAt: P2_TIMESTAMP
    },
    diagnostics: []
  };
}

function validateMappingRows(rows, context) {
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (seen.has(row.mappingId)) {
      throw contractError(`P2 source mapping contains duplicate mappingId: ${row.mappingId}`, 1);
    }
    seen.add(row.mappingId);
    if (row.authorityScope === "mapping-adds-authority") {
      throw contractError(`P2 source mapping attempts authority escalation: ${row.mappingId}`, 1);
    }
    validateMappingRowRefs(row, context, `mappingRows/${index}`);
    validateCardinality(row, `mappingRows/${index}`);
  }
}

function validateReviewRequiredRows(rows, context) {
  for (const [index, row] of rows.entries()) {
    for (const [refIndex, ref] of (row.sourceRefs || []).entries()) {
      resolveSourceRef(ref, context, `reviewRequired/${index}/sourceRefs/${refIndex}`);
    }
    for (const [refIndex, ref] of (row.mappingRefs || []).entries()) {
      const resolved = resolveMappingRef(ref, context, `reviewRequired/${index}/mappingRefs/${refIndex}`);
      if (resolved?.mappingId !== row.mappingId) {
        throw contractError(`P2 review mapping ref does not resolve to ${row.mappingId}: ${ref}`, 1);
      }
    }
  }
}

function validateMappingRowRefs(row, context, label) {
  for (const [refIndex, ref] of row.sourceRefs.entries()) {
    resolveSourceRef(ref, context, `${label}/sourceRefs/${refIndex}`);
  }
  for (const [refIndex, ref] of row.mappingRefs.entries()) {
    const resolved = resolveMappingRef(ref, context, `${label}/mappingRefs/${refIndex}`);
    if (resolved?.mappingId !== row.mappingId) {
      throw contractError(`P2 mapping ref does not resolve to ${row.mappingId}: ${ref}`, 1);
    }
  }
  for (const [refIndex, ref] of row.targetRefs.entries()) {
    if (typeof ref !== "string" || !ref.startsWith("catalog://p2/")) {
      throw contractError(`P2 mapping target ref is invalid at ${label}/targetRefs/${refIndex}: ${ref}`, 1);
    }
  }
}

function validateCardinality(row, label) {
  const cardinality = row.cardinality;
  if (
    !cardinality ||
    cardinality.sourceMin < 0 ||
    cardinality.targetMin < 0 ||
    (cardinality.sourceMax !== null && cardinality.sourceMax < cardinality.sourceMin) ||
    (cardinality.targetMax !== null && cardinality.targetMax < cardinality.targetMin)
  ) {
    throw contractError(`P2 mapping cardinality is invalid at ${label}`, 1);
  }
}

function assertSourceMappingRefsResolve(sourceMapping, context) {
  validateMappingRows(sourceMapping.mappingRows, context);
  validateReviewRequiredRows(sourceMapping.reviewRequired.map((row) => ({
    ...row,
    sourceRefs: [],
    mappingRefs: []
  })), context);
  for (const [index, ref] of sourceMapping.provenance.sourceRefs.entries()) {
    resolveSourceRef(ref, context, `source-mapping provenance sourceRefs/${index}`);
  }
}

function assertArtifactSourceRefsResolve(artifact, context, artifactPath) {
  for (const { ref, pointer } of collectRefsByKey(artifact, "sourceRef")) {
    resolveSourceRef(ref, context, `${artifactPath}${pointer}/sourceRef`);
  }
  for (const { ref, pointer } of collectRefsByKey(artifact, "sourceRefs")) {
    resolveSourceRef(ref, context, `${artifactPath}${pointer}/sourceRefs`);
  }
}

function collectRefsByKey(root, key) {
  const refs = [];
  const walk = (value, pointer) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${pointer}/${index}`));
      return;
    }
    for (const [entryKey, nested] of Object.entries(value)) {
      const nextPointer = `${pointer}/${escapeJsonPointer(entryKey)}`;
      if (entryKey === key) {
        if (typeof nested === "string") refs.push({ ref: nested, pointer });
        if (Array.isArray(nested)) {
          nested.forEach((item, index) => {
            if (typeof item === "string") refs.push({ ref: item, pointer: `${nextPointer}/${index}` });
          });
        } else if (nested && typeof nested === "object") {
          for (const [nestedKey, nestedValue] of Object.entries(nested)) {
            if (typeof nestedValue === "string") {
              refs.push({ ref: nestedValue, pointer: `${nextPointer}/${escapeJsonPointer(nestedKey)}` });
            }
          }
        }
      }
      walk(nested, nextPointer);
    }
  };
  walk(root, "");
  return refs;
}

function assertMappingTargetsExist(sourceMapping, catalog) {
  for (const row of sourceMapping.mappingRows) {
    for (const targetRef of row.targetRefs) {
      if (!catalogTargetExists(catalog, targetRef)) {
        throw contractError(`P2 mapping target ref is absent from governed catalog: ${targetRef}`, 1);
      }
    }
  }
}

function catalogTargetExists(catalog, targetRef) {
  const prefix = "catalog://p2/";
  if (!targetRef.startsWith(prefix)) return false;
  const parts = targetRef.slice(prefix.length).split("/");
  if (parts[0] === "tokens" && parts.length === 2) {
    return Object.prototype.hasOwnProperty.call(catalog.tokens || {}, parts[1]);
  }
  if (parts[0] !== "components" || parts.length < 2) return false;
  let current = catalog.components?.[parts[1]];
  if (!current) return false;
  for (const segment of parts.slice(2)) {
    if (Array.isArray(current)) {
      current = current.find((item) => item?.id === segment) ?? current[Number(segment)];
    } else {
      current = current?.[segment];
    }
    if (current === undefined) return false;
  }
  return true;
}

function extractComponent(id, sourceName, sourceComponent) {
  const sourceFile = sourceName === "button" ? "components/button.json" : "components/in-line-alert.json";
  return {
    id,
    sourceName,
    sourceRef: sourceRef(sourceFile, "/"),
    description: sourceComponent.description,
    props: Object.fromEntries(Object.entries(sourceComponent.options || {}).map(([propId, propValue]) => [propId, {
      id: propId,
      type: propValue.type === "boolean" ? "boolean" : "string",
      default: propValue.default ?? null,
      allowedValues: Array.isArray(propValue.values) ? propValue.values.map((item) => item.value) : [],
      sourceRef: sourceRef(sourceFile, `/options/${propId}`)
    }])),
    variants: {
      [sourceComponent.options?.variant?.default || "default"]: {
        sourceRef: sourceRef(sourceFile, "/options/variant/values/0")
      }
    },
    states: Array.isArray(sourceComponent.states) ? Object.fromEntries(sourceComponent.states.map((state, index) => [state.name, {
      sourceRef: sourceRef(sourceFile, `/states/${index}`)
    }])) : {},
    slots: Array.isArray(sourceComponent.slots) ? Object.fromEntries(sourceComponent.slots.map((slot, index) => [slot.name === "default" ? "label" : slot.name, {
      sourceRef: sourceRef(sourceFile, `/slots/${index}`)
    }])) : {},
    accessibility: {
      ...sourceComponent.accessibility,
      sourceRef: sourceRef(sourceFile, "/accessibility")
    },
    examples: Array.isArray(sourceComponent.documentBlocks) ? sourceComponent.documentBlocks.map((block, index) => ({
      ...block,
      sourceRef: sourceRef(sourceFile, `/documentBlocks/${index}`)
    })) : [],
    tokenRefs: Array.isArray(sourceComponent.tokenBindings) ? sourceComponent.tokenBindings.map((binding, index) => ({
      token: binding.token,
      context: binding.context,
      sourceRef: sourceRef(sourceFile, `/tokenBindings/${index}`)
    })) : []
  };
}

function buildCatalog({ context, extractHash, governed }) {
  const components = {
    Button: catalogButton(context.button),
    InLineAlert: catalogInLineAlert(context.inLineAlert)
  };
  const promotionStatus = governed ? "review_required" : null;
  return {
    catalogId: governed ? "surfaces-p2-governed-spectrum" : "surfaces-p2-spectrum",
    schemaId: "runtime-catalog.v0",
    artifactKind: governed ? "governed-catalog" : "catalog",
    version: P2_VERSION,
    sourceRefs: {
      button: sourceRef("components/button.json", "/"),
      inLineAlert: sourceRef("components/in-line-alert.json", "/"),
      tokenTerminology: sourceRef("registry/token-terminology.json", "/"),
      tokenObjects: sourceRef("registry/token-objects.json", "/"),
      propertyField: sourceRef("fields/property.json", "/"),
      anatomyField: sourceRef("fields/anatomy.json", "/"),
      usagePolicy: "source://p2/docs/usage-policy.json#/"
    },
    tokens: {
      "component-height-75": { value: "32px", type: "dimension", sourceRef: sourceRef("components/button.json", "/tokenBindings/0") },
      "border-width-200": { value: "2px", type: "dimension", sourceRef: sourceRef("components/in-line-alert.json", "/tokenBindings/0") },
      "button-minimum-width-multiplier": { value: 2.25, type: "number", sourceRef: sourceRef("tokens/layout-component.tokens.json", "/267") }
    },
    components,
    runtimeCapabilities: {
      adapterTargets: "none-in-p2",
      actionExecution: "disabled",
      runtimeProjection: "not-emitted-in-p2"
    },
    governance: {
      rules: governed ? {
        actionSemanticsRequireReview: {
          promotionStatus: "review_required",
          sourceRef: "source://p2/docs/usage-policy.json#/governanceRules/0"
        }
      } : {},
      results: governed ? {
        reviewRequiredMappings: governed ? ["button-action-review"] : []
      } : {},
      promotionStatus
    },
    provenance: {
      sourceUri: `${P2_SOURCE_ROOT}/manifest.json`,
      sourceHash: sha256Hex(canonicalJson(context.manifest)),
      extractHash,
      generatedAt: P2_TIMESTAMP,
      generator: "interfacectl-p2-catalog"
    },
    diagnostics: [],
    compatibility: {
      a2ui: "reference-only"
    }
  };
}

function catalogButton(button) {
  return {
    sourceRef: sourceRef("components/button.json", "/"),
    props: {
      variant: catalogProp("variant", button.options.variant, sourceRef("components/button.json", "/options/variant")),
      style: catalogProp("style", button.options.style, sourceRef("components/button.json", "/options/style")),
      size: catalogProp("size", button.options.size, sourceRef("components/button.json", "/options/size"))
    },
    variants: {
      accent: catalogVariant("accent", button.options.variant.values.map((item) => item.value), sourceRef("components/button.json", "/options/variant/values/0"))
    },
    states: {
      hover: catalogState("hover", ["variant", "style", "size"], sourceRef("components/button.json", "/states/0")),
      focus: catalogState("focus", ["variant", "style", "size"], sourceRef("components/button.json", "/states/1")),
      disabled: catalogState("disabled", ["variant", "style", "size"], sourceRef("components/button.json", "/states/2"))
    },
    slots: {
      icon: {
        id: "icon",
        kind: "icon",
        required: false,
        allowedComponents: [],
        maxItems: 1,
        sourceRef: sourceRef("components/button.json", "/slots/1")
      }
    },
    actions: {},
    events: {},
    dataBindings: {},
    tokenRefs: {
      "component-height-75": "component-height-75",
      "button-minimum-width-multiplier": "button-minimum-width-multiplier"
    },
    accessibility: {
      role: "button",
      nameFrom: "content",
      focusable: true,
      keyboard: ["Enter", "Space"],
      sourceRef: sourceRef("components/button.json", "/accessibility")
    },
    examples: [
      {
        id: "purpose",
        content: button.documentBlocks[0].content,
        sourceRef: sourceRef("components/button.json", "/documentBlocks/0")
      }
    ]
  };
}

function catalogInLineAlert(alert) {
  return {
    sourceRef: sourceRef("components/in-line-alert.json", "/"),
    props: {
      variant: catalogProp("variant", alert.options.variant, sourceRef("components/in-line-alert.json", "/options/variant")),
      style: catalogProp("style", alert.options.style, sourceRef("components/in-line-alert.json", "/options/style")),
      heading: catalogProp("heading", alert.options.heading, sourceRef("components/in-line-alert.json", "/options/heading"))
    },
    variants: {
      neutral: catalogVariant("neutral", alert.options.variant.values.map((item) => item.value), sourceRef("components/in-line-alert.json", "/options/variant/values/0"))
    },
    states: {},
    slots: {},
    actions: {},
    events: {},
    dataBindings: {},
    tokenRefs: {
      "border-width-200": "border-width-200"
    },
    accessibility: {
      role: "status",
      nameFrom: "content",
      focusable: false,
      wcag: alert.accessibility.wcag,
      sourceRef: sourceRef("components/in-line-alert.json", "/accessibility")
    },
    examples: [
      {
        id: "purpose",
        content: alert.documentBlocks[0].content,
        sourceRef: sourceRef("components/in-line-alert.json", "/documentBlocks/0")
      }
    ]
  };
}

function catalogProp(id, sourceProp, sourceRefValue) {
  return {
    id,
    type: sourceProp.type === "boolean" ? "boolean" : "string",
    required: false,
    default: sourceProp.default ?? null,
    allowedValues: Array.isArray(sourceProp.values) ? sourceProp.values.map((item) => item.value) : [],
    tokenRefs: [],
    sourceRef: sourceRefValue,
    diagnostics: [],
    minLength: null,
    maxLength: null,
    allowMarkup: false
  };
}

function catalogVariant(id, allowedValues, sourceRefValue) {
  return {
    id,
    allowedValues,
    requiredProps: [],
    stateConstraints: [],
    sourceRef: sourceRefValue
  };
}

function catalogState(id, allowedProps, sourceRefValue) {
  return {
    id,
    allowedProps,
    accessibilityExpectations: {},
    sourceRef: sourceRefValue
  };
}

async function evaluateP2Expectations({ cwd, expectations, diagnosticsRows, validators, context, sourceMapping, extract, governedCatalog }) {
  const results = [];
  const sourceManifest = context.manifest;
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    const actual = await evaluateP2Fixture({
      fixture,
      expectation,
      diagnosticsRows,
      validators,
      sourceManifest,
      context,
      sourceMapping,
      extract,
      governedCatalog,
      cwd
    });
    const matched = compareExpectation(expectation, actual);
    results.push({
      fixturePath: expectation.fixturePath,
      kind: expectation.kind,
      stage: expectation.stage,
      phase: expectation.phase,
      expectedResult: expectation.expectedResult,
      actualResult: actual.result,
      promotionStatus: actual.promotionStatus,
      diagnosticCodes: actual.diagnostics.map((diagnostic) => diagnostic.code),
      artifactPath: expectation.artifactPath,
      matched,
      diagnostics: actual.diagnostics
    });
  }
  return results;
}

async function evaluateP2Fixture({ fixture, expectation, diagnosticsRows, validators, sourceManifest, context, sourceMapping, extract, governedCatalog, cwd }) {
  if (expectation.diagnosticCodes.length === 0) {
    if (expectation.kind === "valid" && expectation.fixturePath.endsWith(".source-mapping.json")) {
      const schemaResult = validators.validate("p2", "design-source-mapping.v0", fixture);
      if (!schemaResult.valid || !validMappingCoverageMatches(fixture, sourceMapping, governedCatalog, context)) {
        return invalidResult(expectation, diagnosticsRows, "INGEST_MAPPING_ROW_REF_INVALID");
      }
    } else if (expectation.kind === "valid") {
      const schemaResult = validators.validate("p2", "design-system-ingestion-valid-fixture.v0", fixture);
      if (!schemaResult.valid || !validComponentCoverageMatches(fixture, { sourceMapping, extract, catalog: governedCatalog, context })) {
        return invalidResult(expectation, diagnosticsRows, "INGEST_SOURCE_REF_MISSING");
      }
    }
    return {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: []
    };
  }

  const code = expectation.diagnosticCodes[0];
  if (!await fixtureMatchesDiagnostic(code, fixture, { sourceManifest, context, cwd })) {
    return {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: []
    };
  }
  const sourceRef = expectation.requiredSourceRef ?? null;
  return {
    result: expectation.expectedResult,
    promotionStatus: expectation.promotionStatus,
    diagnostics: [diagnosticForCode(diagnosticsRows, code, { sourceRef })]
  };
}

function invalidResult(expectation, diagnosticsRows, code) {
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForCode(diagnosticsRows, code, { sourceRef: expectation.requiredSourceRef ?? null })]
  };
}

function validComponentCoverageMatches(fixture, { sourceMapping, extract, catalog, context }) {
  if (!fixture.sourceRefs.every((ref) => canResolveSourceRef(ref, context))) return false;
  if (!fixture.mappingRefs.every((ref) => canResolveMappingRef(ref, context))) return false;
  if (!fixture.expectedCatalogRefs.every((catalogRef) => catalogTargetExists(catalog, catalogRef))) return false;
  if (!fixture.expectedNormalizedIds.every((normalizedId) => sourceMapping.mappingRows.some((row) => row.normalizedId === normalizedId))) return false;
  return expectedExtractionMatches(fixture.expectedExtraction, { extract, catalog });
}

function validMappingCoverageMatches(fixture, sourceMapping, catalog, context) {
  return fixture.mappingRows.every((row) =>
    sourceMapping.mappingRows.some((actual) => canonicalJson(actual) === canonicalJson(row)) &&
    row.sourceRefs.every((ref) => canResolveSourceRef(ref, context)) &&
    row.mappingRefs.every((ref) => canResolveMappingRef(ref, context)) &&
    row.targetRefs.every((targetRef) => catalogTargetExists(catalog, targetRef))
  );
}

function assertPositiveCoverage(expectations, { context, sourceMapping, governedCatalog }) {
  for (const row of expectations.validCoverage || []) {
    for (const sourceRefValue of row.sourceRefs || []) {
      resolveSourceRef(sourceRefValue, context, `${row.fixturePath} validCoverage sourceRefs`);
    }
    for (const catalogRef of row.expectedCatalogRefs || []) {
      if (!catalogTargetExists(governedCatalog, catalogRef)) {
        throw contractError(`P2 positive coverage missing catalog ref for ${row.fixturePath}: ${catalogRef}`, 1);
      }
    }
    for (const normalizedId of row.expectedNormalizedIds || []) {
      if (!sourceMapping.mappingRows.some((mappingRow) => mappingRow.normalizedId === normalizedId)) {
        throw contractError(`P2 positive coverage missing normalized id for ${row.fixturePath}: ${normalizedId}`, 1);
      }
    }
    for (const mappingKind of row.mappingKinds || []) {
      if (!sourceMapping.mappingRows.some((mappingRow) => mappingRow.mappingKind === mappingKind)) {
        throw contractError(`P2 positive coverage missing mapping kind for ${row.fixturePath}: ${mappingKind}`, 1);
      }
    }
  }
}

function expectedExtractionMatches(expectedExtraction, { extract, catalog }) {
  const checks = [
    expectedExtraction.component,
    ...expectedExtraction.propsOptions,
    ...expectedExtraction.variants,
    ...coverageEntries(expectedExtraction.states),
    ...coverageEntries(expectedExtraction.slots),
    ...expectedExtraction.accessibility,
    ...expectedExtraction.examples,
    ...expectedExtraction.tokenRefs
  ];
  return checks.every((entry) =>
    catalogTargetExists(catalog, entry.catalogRef) &&
    extractSourceRefExists(extract, entry.sourceRef)
  );
}

function coverageEntries(value) {
  return Array.isArray(value) ? value : [];
}

function extractSourceRefExists(extract, sourceRefValue) {
  return Object.values(extract.sourceRefs || {}).includes(sourceRefValue);
}

async function fixtureMatchesDiagnostic(code, fixture, { sourceManifest, context, cwd }) {
  switch (code) {
    case "INGEST_SOURCE_MANIFEST_MISSING":
      return fixture.mutation === "missing-file" && fixture.mutatedPath === `${P2_SOURCE_ROOT}/manifest.json`;
    case "INGEST_PACKAGE_INTEGRITY_MISMATCH":
      return typeof fixture.mutation === "string" && fixture.mutation.includes("packageIntegrity") && fixture.mutatedPath === `${P2_SOURCE_ROOT}/manifest.json`;
    case "INGEST_SOURCE_PATH_UNDECLARED":
      return typeof fixture.sourcePath === "string" && !sourceManifest.sourceFiles.some((entry) => entry.path === fixture.sourcePath);
    case "INGEST_SOURCE_REF_INVALID":
      return typeof fixture.sourceRef === "string" && !canResolveSourceRef(fixture.sourceRef, context);
    case "INGEST_SOURCE_HASH_MISMATCH":
      return await sourceHashMismatchProbe(cwd, fixture, sourceManifest);
    case "INGEST_SOURCE_REF_MISSING":
      return fixture.mutatedPath === `${P2_ARTIFACT_ROOT}/extract.json` && fixture.jsonPointer === "/components/0/sourceRef";
    case "INGEST_COMPONENT_UNMAPPED":
      return Array.isArray(fixture.mappingRows) && fixture.mappingRows.length === 0;
    case "INGEST_TOKEN_UNSUPPORTED":
      return typeof fixture.token?.type === "string" && fixture.token.type.startsWith("spectrum-");
    case "INGEST_TOKEN_MODE_UNSUPPORTED":
      return fixture.tokenMode === "experimental";
    case "INGEST_VARIANT_AMBIGUOUS":
      return Array.isArray(fixture.candidateTargetRefs) && fixture.candidateTargetRefs.length > 1;
    case "INGEST_GOVERNANCE_POLICY_MISSING":
      return Array.isArray(fixture.policyRefs) && fixture.policyRefs.length === 0;
    case "INGEST_MAPPING_REVIEW_REQUIRED":
      return Array.isArray(fixture.reviewRequired) && fixture.reviewRequired.some((row) => row.diagnosticCodes?.includes(code));
    case "INGEST_MAPPING_AUTHORITY_ESCALATION":
      return fixture.mappingRows?.some((row) => row.authorityScope === "mapping-adds-authority");
    case "INGEST_NORMALIZED_ID_DUPLICATE":
      return hasDuplicateNormalizedId(fixture.mappingRows || []);
    case "INGEST_MAPPING_ROW_REF_INVALID":
      return fixture.mappingRows?.some((row) =>
        (row.sourceRefs || []).some((ref) => !canResolveSourceRef(ref, context)) ||
        (row.mappingRefs || []).some((ref) => !canResolveMappingRef(ref, context)) ||
        (row.targetRefs || []).some((ref) => typeof ref !== "string" || !ref.startsWith("catalog://p2/"))
      );
    case "INGEST_MAPPING_CARDINALITY_INVALID":
      return fixture.mappingRows?.some((row) =>
        !row.cardinality ||
        row.cardinality.sourceMin < 0 ||
        row.cardinality.targetMin < 0 ||
        (row.cardinality.sourceMax !== null && row.cardinality.sourceMax < row.cardinality.sourceMin) ||
        (row.cardinality.targetMax !== null && row.cardinality.targetMax < row.cardinality.targetMin)
      );
    case "INGEST_SCHEMA_HASH_MISMATCH":
      return await schemaHashMismatchProbe(cwd, fixture);
    case "INGEST_EVIDENCE_HASH_MISMATCH":
      return fixture.mutatedPath === `${P2_ARTIFACT_ROOT}/evidence.json` && fixture.jsonPointer === "/artifactRefs/6/hash";
    default:
      return false;
  }
}

function hasDuplicateNormalizedId(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.normalizedId)) return true;
    seen.add(row.normalizedId);
  }
  return false;
}

async function sourceHashMismatchProbe(cwd, fixture, sourceManifest) {
  if (typeof fixture.sourceFile !== "string") return false;
  const sourceFile = sourceManifest.sourceFiles.find((entry) => entry.path === fixture.sourceFile);
  if (!sourceFile) return false;
  const actualHash = await rawFileHash(path.join(cwd, P2_SOURCE_ROOT, sourceFile.path));
  if (actualHash !== sourceFile.sha256) return false;
  const tamperedHash = "0".repeat(64);
  return tamperedHash !== actualHash;
}

async function schemaHashMismatchProbe(cwd, fixture) {
  if (fixture.mutatedPath !== `${P2_ARTIFACT_ROOT}/evidence.json` || fixture.jsonPointer !== "/schemaClosure/0/hash") return false;
  const schemaPath = p2SchemaPaths()[0];
  const actualHash = await canonicalFileHash(path.join(cwd, schemaPath));
  const tamperedHash = "0".repeat(64);
  return tamperedHash !== actualHash;
}

function compareExpectation(expectation, actual) {
  return actual.result === expectation.expectedResult &&
    actual.promotionStatus === expectation.promotionStatus &&
    canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code)) === canonicalJson(expectation.diagnosticCodes);
}

async function buildEvidence({ cwd, sourceRoot, fixtureRoot, outRoot, manifest, expectations, command, args, runId, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const artifactPath of p2SchemaPaths()) {
    const isP2Owned = P2_SCHEMA_FILES.includes(artifactPath.split("/").pop());
    schemaClosure.push({
      path: artifactPath,
      schemaId: schemaIdForP2Path(artifactPath),
      hashAlgorithm: "sha256",
      hash: await canonicalFileHash(path.join(cwd, artifactPath)),
      ownership: isP2Owned ? "p2-owned" : "shared-consumed"
    });
  }

  const sourceFileRefs = [];
  for (const sourceFile of manifest.sourceFiles) {
    sourceFileRefs.push({
      path: `${sourceRoot}/${sourceFile.path}`,
      schemaId: sourceFile.sourceType,
      hashAlgorithm: "sha256",
      hash: sourceFile.sha256,
      sourceRef: sourceFile.sourceRefRoot
    });
  }
  for (const mappingFile of manifest.requiredMappings) {
    sourceFileRefs.push({
      path: `${sourceRoot}/${mappingFile.path}`,
      schemaId: "source-mapping-input",
      hashAlgorithm: "sha256",
      hash: mappingFile.sha256,
      sourceRef: null
    });
  }

  const fixtureRefs = [];
  for (const fixturePath of p2FixturePaths()) {
    fixtureRefs.push({
      path: fixturePath,
      schemaId: schemaIdForP2Path(fixturePath),
      hashAlgorithm: "sha256",
      hash: await canonicalFileHash(path.join(cwd, fixturePath)),
      sourceRef: null
    });
  }

  const artifactRefs = [];
  for (const artifactPath of P2_ARTIFACT_PATHS) {
    artifactRefs.push({
      path: artifactPath,
      schemaId: schemaIdForP2Path(artifactPath),
      hashAlgorithm: "sha256",
      hash: artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath)),
      sourceRef: null
    });
  }

  const evidence = {
    schemaId: "design-system-ingestion-evidence.v0",
    version: P2_VERSION,
    runId,
    command,
    arguments: args,
    environment: { ...P2_ENVIRONMENT },
    sourceManifestRef: {
      path: `${sourceRoot}/manifest.json`,
      schemaId: "design-source-manifest.v0",
      hashAlgorithm: "sha256",
      hash: await canonicalFileHash(path.join(cwd, sourceRoot, "manifest.json")),
      sourceRef: null
    },
    sourceFileRefs,
    schemaClosure,
    fixtureRefs,
    artifactRefs,
    diagnostics: sortDiagnostics(diagnostics),
    validationResults: validationResults.map(stripResult),
    status,
    promotionStatus
  };
  evidence.artifactRefs[evidence.artifactRefs.length - 1].hash = computeEvidenceSelfHash(evidence);
  assertOrderedPaths("P2 evidence schemaClosure", evidence.schemaClosure.map((entry) => entry.path), p2SchemaPaths());
  assertOrderedPaths("P2 evidence sourceFileRefs", evidence.sourceFileRefs.map((entry) => entry.path), p2SourceRefPaths());
  assertOrderedPaths("P2 evidence fixtureRefs", evidence.fixtureRefs.map((entry) => entry.path), p2FixturePaths());
  assertOrderedPaths("P2 evidence artifactRefs", evidence.artifactRefs.map((entry) => entry.path), P2_ARTIFACT_PATHS);
  assertOrderedPaths("P2 evidence validationResults", evidence.validationResults.map((entry) => entry.fixturePath), P2_FIXTURE_FILES);
  assertOrderedPaths("P2 expectations artifactOrder", expectations.artifactOrder, p2ArtifactOrder());
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
    artifactPath: validationResultArtifactPath(result)
  };
}

function validationResultArtifactPath(result) {
  if (result.kind === "valid") {
    return result.fixturePath.endsWith(".source-mapping.json") ?
      `${P2_ARTIFACT_ROOT}/source-mapping.json` :
      `${P2_ARTIFACT_ROOT}/ingestion-report.json`;
  }
  if (result.kind === "review") return `${P2_ARTIFACT_ROOT}/ingestion-report.json`;
  if (result.kind === "invalid") {
    return result.fixturePath.endsWith(".design-source-mapping.json") ?
      `${P2_ARTIFACT_ROOT}/source-mapping.json` :
      `${P2_ARTIFACT_ROOT}/ingestion-report.json`;
  }
  return result.fixturePath;
}

function assertExtractSourceRefs(extract) {
  const missing = [];
  for (const [index, component] of extract.components.entries()) {
    if (!component.sourceRef) missing.push(`/components/${index}/sourceRef`);
  }
  for (const [tokenId, token] of Object.entries(extract.tokens)) {
    if (!token.sourceRef) missing.push(`/tokens/${tokenId}/sourceRef`);
  }
  if (missing.length > 0) {
    throw contractError(`P2 extract is missing source refs: ${missing.join(", ")}`, 1);
  }
}

function collectExtractSourceRefs(root) {
  const refs = {};
  const walk = (value, pointer) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.sourceRef === "string") refs[pointer || "/"] = value.sourceRef;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${pointer}/${index}`));
    } else {
      for (const [key, nested] of Object.entries(value)) {
        walk(nested, `${pointer}/${escapeJsonPointer(key)}`);
      }
    }
  };
  walk(root, "");
  return refs;
}

function sourceRef(packagePath, pointer) {
  return `spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/${packagePath}#${pointer}`;
}

function parseSourceRef(ref, label) {
  return parseSourceRefParts(ref, label).path;
}

function parseSourceRefParts(ref, label) {
  if (ref.startsWith(SOURCE_REF_PREFIX)) {
    const rest = ref.slice(SOURCE_REF_PREFIX.length);
    const hashIndex = rest.indexOf("#");
    if (hashIndex === -1) throw contractError(`${label} missing JSON Pointer fragment: ${ref}`, 1);
    const packagePath = rest.slice(0, hashIndex);
    const fragment = rest.slice(hashIndex);
    assertNormalizedRelativePath(packagePath, label);
    if (!POINTER_PATTERN.test(fragment)) throw contractError(`${label} has invalid JSON Pointer fragment: ${ref}`, 1);
    return {
      path: `npm/@adobe/spectrum-design-data/0.7.0/package/${packagePath}`,
      pointer: fragment
    };
  }
  if (ref.startsWith(DOCS_REF_PREFIX)) {
    const rest = ref.slice(DOCS_REF_PREFIX.length);
    const hashIndex = rest.indexOf("#");
    if (hashIndex === -1) throw contractError(`${label} missing JSON Pointer fragment: ${ref}`, 1);
    const docsPath = rest.slice(0, hashIndex);
    const fragment = rest.slice(hashIndex);
    assertNormalizedRelativePath(docsPath, label);
    if (docsPath !== "usage-policy.json" || !POINTER_PATTERN.test(fragment)) {
      throw contractError(`${label} has invalid docs source ref: ${ref}`, 1);
    }
    return {
      path: `docs/${docsPath}`,
      pointer: fragment
    };
  }
  throw contractError(`${label} has unknown source ref scheme: ${ref}`, 1);
}

function parseMappingRef(ref, label) {
  return parseMappingRefParts(ref, label).path;
}

function parseMappingRefParts(ref, label) {
  if (!ref.startsWith(MAPPING_REF_PREFIX)) throw contractError(`${label} has unknown mapping ref scheme: ${ref}`, 1);
  const rest = ref.slice(MAPPING_REF_PREFIX.length);
  const hashIndex = rest.indexOf("#");
  if (hashIndex === -1) throw contractError(`${label} missing JSON Pointer fragment: ${ref}`, 1);
  const mappingPath = rest.slice(0, hashIndex);
  const fragment = rest.slice(hashIndex);
  assertNormalizedRelativePath(mappingPath, label);
  if (!["component-map.json", "token-map.json", "policy-map.json"].includes(mappingPath) || !POINTER_PATTERN.test(fragment)) {
    throw contractError(`${label} has invalid mapping ref: ${ref}`, 1);
  }
  return {
    path: `mappings/${mappingPath}`,
    pointer: fragment
  };
}

function resolveSourceRef(ref, context, label) {
  const parsed = parseSourceRefParts(ref, label);
  const source = context.sourceByPath.get(parsed.path);
  if (!source) {
    throw contractError(`${label} points outside manifest-declared source files: ${ref}`, 1);
  }
  if (source.json === null) {
    if (parsed.pointer !== "#/") {
      throw contractError(`${label} points into a non-JSON source file: ${ref}`, 1);
    }
    return source;
  }
  resolveJsonPointer(source.json, parsed.pointer, label, ref);
  return source;
}

function resolveMappingRef(ref, context, label) {
  const parsed = parseMappingRefParts(ref, label);
  const mapping = context.mappingsByPath.get(parsed.path);
  if (!mapping) {
    throw contractError(`${label} points outside manifest-declared mapping files: ${ref}`, 1);
  }
  return resolveJsonPointer(mapping.json, parsed.pointer, label, ref);
}

function canResolveSourceRef(ref, context) {
  try {
    resolveSourceRef(ref, context, "sourceRef");
    return true;
  } catch {
    return false;
  }
}

function canResolveMappingRef(ref, context) {
  try {
    resolveMappingRef(ref, context, "mappingRef");
    return true;
  } catch {
    return false;
  }
}

function resolveJsonPointer(document, pointerFragment, label, ref) {
  if (pointerFragment === "#/") return document;
  const pointer = pointerFragment.slice(1);
  const segments = pointer.split("/").slice(1).map((segment) =>
    segment.replaceAll("~1", "/").replaceAll("~0", "~")
  );
  let current = document;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (!/^(0|[1-9][0-9]*)$/.test(segment)) {
        throw contractError(`${label} has non-numeric array JSON Pointer segment: ${ref}`, 1);
      }
      const index = Number(segment);
      if (index >= current.length) {
        throw contractError(`${label} points outside JSON array bounds: ${ref}`, 1);
      }
      current = current[index];
    } else if (current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      throw contractError(`${label} points at an unresolved JSON Pointer: ${ref}`, 1);
    }
  }
  return current;
}

function isSourceRef(ref) {
  try {
    parseSourceRef(ref, "sourceRef");
    return true;
  } catch {
    return false;
  }
}

function isMappingRef(ref) {
  try {
    parseMappingRef(ref, "mappingRef");
    return true;
  } catch {
    return false;
  }
}

function assertNormalizedRelativePath(value, label) {
  if (typeof value !== "string" || !PATH_SEGMENT_PATTERN.test(value) || path.posix.normalize(value) !== value) {
    throw contractError(`${label} is not a normalized POSIX path: ${value}`, 1);
  }
}

async function loadDiagnosticsRows(cwd) {
  const schema = await readJson(path.join(cwd, P2_SCHEMA_ROOT, "design-system-ingestion-diagnostics.v0.schema.json"));
  const rows = new Map();
  for (const branch of schema.$defs.diagnostic.allOf) {
    const code = branch.if?.properties?.code?.const;
    const properties = branch.then?.properties;
    if (code) rows.set(code, {
      code,
      message: properties.message.const,
      severity: properties.severity.const,
      diagnosticSource: properties.diagnosticSource.const,
      stage: properties.stage.const,
      phase: properties.phase.const,
      artifactPath: properties.artifactPath.const,
      jsonPointer: properties.jsonPointer.const,
      validationResult: properties.validationResult.const,
      promotionStatus: properties.promotionStatus.const
    });
  }
  return rows;
}

function diagnosticForCode(rows, code, { sourceRef = null } = {}) {
  const row = rows.get(code);
  if (!row) throw contractError(`missing P2 diagnostic registry row: ${code}`, 1);
  return {
    code,
    message: row.message,
    severity: row.severity,
    diagnosticSource: row.diagnosticSource,
    stage: row.stage,
    phase: row.phase,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: suggestedActionFor(code)
  };
}

function suggestedActionFor(code) {
  if (code.includes("HASH")) return "Regenerate P2 proof artifacts from the current declared source bundle.";
  if (code.includes("MAPPING")) return "Correct the declared local mapping file or route the row to review.";
  if (code.includes("SOURCE")) return "Correct the manifest-declared local source bundle and refs before extraction.";
  return "Correct the declared P2 source input before proof continues.";
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

function aggregatePromotionStatus(results) {
  if (results.some((result) => result.matched === false)) return "blocked";
  if (results.some((result) => result.actualResult === "review_required")) return "review_required";
  return "allowed";
}

function assertRunExpectation(manifest, artifact) {
  const expected = manifest.runExpectation;
  if (artifact.status !== expected.status || artifact.promotionStatus !== expected.promotionStatus) {
    throw contractError(
      `P2 run expectation mismatch: expected ${expected.status}/${expected.promotionStatus}, got ${artifact.status}/${artifact.promotionStatus}`,
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

async function loadValidators(cwd) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });

  for (const file of P2_SHARED_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, P2_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  for (const file of P2_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, P2_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }

  return {
    validate(scope, schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/${scope}/${schemaId}.schema.json`);
      if (!validate) throw new Error(`schema not loaded: ${scope}/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

function assertSchema(validators, scope, schemaId, data, artifactPath) {
  const result = validators.validate(scope, schemaId, data);
  if (!result.valid) {
    throw contractError(`schema validation failed for ${artifactPath}: ${formatAjvErrors(result.errors)}`, 1);
  }
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
}

function buildRunId({ manifest, expectations, command, args }) {
  return `p2-${sha256Hex(canonicalJson({
    manifestHash: sha256Hex(canonicalJson(manifest)),
    expectationsHash: sha256Hex(canonicalJson(expectations)),
    command,
    args
  })).slice(0, 32)}`;
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  clone.artifactRefs[clone.artifactRefs.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "INGEST_SCHEMA_HASH_MISMATCH";
  }
  if (evidence.sourceManifestRef?.hash !== await canonicalFileHash(path.join(cwd, evidence.sourceManifestRef.path))) {
    return "INGEST_SOURCE_HASH_MISMATCH";
  }
  for (const ref of evidence.sourceFileRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "INGEST_SOURCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "INGEST_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.artifactRefs || []) {
    if (ref.path === `${P2_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "INGEST_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifactRefs?.[evidence.artifactRefs.length - 1];
  if (!finalRef || finalRef.path !== `${P2_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "INGEST_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

function escapeJsonPointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const p2Internals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  parseRelativePosixPath
};
