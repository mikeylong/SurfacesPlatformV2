import fs from "node:fs/promises";
import os from "node:os";
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
import { spectrumCheckboxCatalogInternals } from "./spectrum-checkbox-catalog-proof.js";
import {
  SSC_ARTIFACT_PATHS,
  SSC_ARTIFACT_ROOT,
  SSC_COMMAND,
  SSC_COMPONENT_PATH,
  SSC_COMPONENT_RAW_SHA256,
  SSC_CONTRACT_ID,
  SSC_ENVIRONMENT,
  SSC_EXPECTATION_ROWS,
  SSC_FIXTURES,
  SSC_FIXTURE_ROOT,
  SSC_GENERATED_ARTIFACTS,
  SSC_IMPLEMENTATION_FILES,
  SSC_LOCK_PATH,
  SSC_MANIFEST_PATH,
  SSC_MAPPING_PATHS,
  SSC_CHECKBOX_CATALOG_PATH,
  SSC_CHECKBOX_EVIDENCE_PATH,
  SSC_INCLUDED_POINTERS,
  SSC_P2_EVIDENCE_PATH,
  SSC_P2_REGISTRY_PATH,
  SSC_P2_TOKEN_PATH,
  SSC_SCHEMA_FILES,
  SSC_SCHEMAS,
  SSC_SCHEMA_ROOT,
  SSC_SHARED_SCHEMA_FILES,
  SSC_SOURCE_ROOT,
  SSC_TIMESTAMP,
  SSC_VERSION,
  artifactRef,
  assertImmutableSpectrumSwitchSource,
  buildExpectedSpectrumSwitchSourceManifest,
  buildExpectedSpectrumSwitchSourceMappings,
  diagnosticsRegistry,
  provenance,
  sscFixturePaths,
  sscSchemaIdForPath,
  sscSchemaPaths,
  sscSourcePaths
} from "./spectrum-switch-catalog-contract.js";

const SWITCH_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/switch.json#";
const REGISTRY_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/registry/components.json#/values/44";
const TOKEN_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/layout-component.tokens.json#/1066";
const EXPECTED_ARGS = Object.freeze({
  source: SSC_SOURCE_ROOT,
  ingestionEvidence: SSC_P2_EVIDENCE_PATH,
  checkboxEvidence: SSC_CHECKBOX_EVIDENCE_PATH,
  catalog: SSC_CHECKBOX_CATALOG_PATH,
  fixture: SSC_FIXTURE_ROOT,
  out: SSC_ARTIFACT_ROOT
});
const REQUIRED_FLAGS = [
  ["--source", "source"],
  ["--ingestion-evidence", "ingestionEvidence"],
  ["--checkbox-evidence", "checkboxEvidence"],
  ["--catalog", "catalog"],
  ["--fixture", "fixture"],
  ["--out", "out"]
];
const DIAGNOSTIC_BY_CODE = new Map(diagnosticsRegistry().map((row) => [row.code, row]));

export async function runSpectrumSwitchCatalogInterfacectl(argv, io) {
  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSpectrumSwitchCatalogProof({ cwd: io.cwd, ...parsed.args });
    io.stdout.write([
      `surfaces spectrum-switch-catalog proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `addedComponents: ${result.addedComponentIds.join(", ")}`,
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

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const match = REQUIRED_FLAGS.find(([flag]) => flag === argv[index]);
    if (!match || index + 1 >= argv.length || argv[index + 1].startsWith("--")) {
      return { ok: false, error: usage() };
    }
    if (parsed[match[1]] !== undefined) return { ok: false, error: usage() };
    const pathResult = p2Internals.parseRelativePosixPath(argv[index + 1], match[0]);
    if (!pathResult.ok) return { ok: false, error: `${pathResult.error}\n${usage()}` };
    parsed[match[1]] = pathResult.path;
    index += 1;
  }
  if (REQUIRED_FLAGS.some(([, key]) => parsed[key] === undefined)) return { ok: false, error: usage() };
  if (Object.entries(EXPECTED_ARGS).some(([key, value]) => parsed[key] !== value)) return { ok: false, error: usage() };
  return { ok: true, args: parsed };
}

function usage() {
  return `usage: ${SSC_COMMAND} --source ${SSC_SOURCE_ROOT} --ingestion-evidence ${SSC_P2_EVIDENCE_PATH} --checkbox-evidence ${SSC_CHECKBOX_EVIDENCE_PATH} --catalog ${SSC_CHECKBOX_CATALOG_PATH} --fixture ${SSC_FIXTURE_ROOT} --out ${SSC_ARTIFACT_ROOT}`;
}

export async function runSpectrumSwitchCatalogProof({ cwd, source, ingestionEvidence, checkboxEvidence, catalog, fixture, out }) {
  assertExpectedArgs({ source, ingestionEvidence, checkboxEvidence, catalog, fixture, out });
  await assertRequiredInputs(cwd);
  await assertNoStaleOutput(cwd);
  const validators = await loadValidators(cwd);
  const inputIntegrityCode = await firstInputIntegrityFailureCode(cwd);
  if (inputIntegrityCode !== null) throw contractError(`spectrum Switch catalog input integrity verification failed: ${inputIntegrityCode}`, 1);
  const context = await loadAndVerifyContext(cwd, validators);

  const sourceInventory = await buildSourceInventory(cwd, context);
  assertSchema(validators, "spectrum-switch-source-inventory.v0", sourceInventory, `${out}/source-inventory.json`);
  await writeCanonicalJson(path.join(cwd, out, "source-inventory.json"), sourceInventory);
  const sourceInventoryRef = artifactRef(`${out}/source-inventory.json`, "spectrum-switch-source-inventory.v0", await canonicalFileHash(path.join(cwd, out, "source-inventory.json")), SWITCH_SOURCE_REF);

  const sourceMapping = await buildCombinedSourceMapping(cwd, context);
  assertSchema(validators, "spectrum-switch-source-mapping.v0", sourceMapping, `${out}/source-mapping.json`);
  assertMappingClosure(context, sourceMapping);
  await writeCanonicalJson(path.join(cwd, out, "source-mapping.json"), sourceMapping);
  const sourceMappingRef = artifactRef(`${out}/source-mapping.json`, "spectrum-switch-source-mapping.v0", await canonicalFileHash(path.join(cwd, out, "source-mapping.json")), SWITCH_SOURCE_REF);

  const expandedCatalog = buildExpandedCatalog(context);
  assertSchema(validators, "runtime-catalog.v0", expandedCatalog, `${out}/governed-catalog.json`);
  assertMappingTargetsResolve(sourceMapping, expandedCatalog);
  const basePreservation = buildBasePreservation(context.checkboxCatalog, expandedCatalog);
  assertBaseCatalogPreserved(context.checkboxCatalog, expandedCatalog, basePreservation);
  await writeCanonicalJson(path.join(cwd, out, "governed-catalog.json"), expandedCatalog);
  const expandedCatalogRef = artifactRef(`${out}/governed-catalog.json`, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, out, "governed-catalog.json")), SWITCH_SOURCE_REF);

  const expectations = context.expectations;
  const validationResults = await evaluateExpectations(cwd, expectations, { ...context, sourceMapping, expandedCatalog });
  const mismatches = validationResults.filter((row) => !row.matched);
  if (mismatches.length > 0) {
    throw contractError(`spectrum Switch catalog validation expectation mismatch: ${mismatches.map((row) => row.fixturePath).join(", ")}`, 1);
  }
  const common = buildCommonProofRecord({
    context,
    sourceInventoryRef,
    sourceMappingRef,
    expandedCatalogRef,
    sourceMapping,
    expandedCatalog,
    validationResults,
    basePreservation,
    args: { source, ingestionEvidence, checkboxEvidence, catalog, fixture, out }
  });

  const report = {
    ...common,
    schemaId: "spectrum-switch-catalog-report.v0",
    provenance: provenance("interfacectl-spectrum-switch-catalog-report", [SSC_MANIFEST_PATH, SSC_P2_EVIDENCE_PATH, SSC_CHECKBOX_EVIDENCE_PATH, SSC_CHECKBOX_CATALOG_PATH])
  };
  assertSchema(validators, "spectrum-switch-catalog-report.v0", report, `${out}/spectrum-switch-catalog-report.json`);
  await writeCanonicalJson(path.join(cwd, out, "spectrum-switch-catalog-report.json"), report);
  const reportRef = artifactRef(`${out}/spectrum-switch-catalog-report.json`, "spectrum-switch-catalog-report.v0", await canonicalFileHash(path.join(cwd, out, "spectrum-switch-catalog-report.json")), SWITCH_SOURCE_REF);

  const evidence = await buildEvidence(cwd, common, reportRef);
  evidence.artifactRefs[evidence.artifactRefs.length - 1].hash = computeEvidenceSelfHash(evidence);
  assertSchema(validators, "spectrum-switch-catalog-evidence.v0", evidence, `${out}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, out, "evidence.json"), evidence);
  await assertFinalMutationFixturesCausal(cwd, evidence);
  const persisted = await readJson(path.join(cwd, out, "evidence.json"));
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persisted);
  if (integrityCode !== null) throw contractError(`spectrum Switch catalog evidence integrity verification failed: ${integrityCode}`, 1);
  await assertExactArtifactClosure(cwd);

  return {
    status: "pass",
    promotionStatus: "review_required",
    matchedCount: validationResults.length,
    totalCount: validationResults.length,
    addedComponentIds: ["Switch"],
    artifacts: SSC_ARTIFACT_PATHS
  };
}

function buildCommonProofRecord({ context, sourceInventoryRef, sourceMappingRef, expandedCatalogRef, sourceMapping, expandedCatalog, validationResults, basePreservation, args }) {
  const diagnosticCodes = [...new Set(validationResults.flatMap((row) => row.actualDiagnosticCodes))].sort();
  const diagnostics = diagnosticCodes.map((code) => deepClone(DIAGNOSTIC_BY_CODE.get(code)));
  const boundaryRefs = [context.p2EvidenceRef, context.checkboxEvidenceRef, context.checkboxCatalogRef];
  return {
    contractId: SSC_CONTRACT_ID,
    version: SSC_VERSION,
    runId: buildRunId(context.manifest, context.expectations, args, boundaryRefs),
    checkedAt: SSC_TIMESTAMP,
    command: SSC_COMMAND,
    args,
    environment: SSC_ENVIRONMENT,
    boundaryRefs,
    sourceInventoryRef,
    sourceMappingRef,
    catalogRef: expandedCatalogRef,
    validationResults,
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistry(),
    summary: {
      fixtureCount: validationResults.length,
      matchedFixtureCount: validationResults.length,
      baseComponentCount: Object.keys(context.checkboxCatalog.components).length,
      expandedComponentCount: Object.keys(expandedCatalog.components).length,
      basePreservedCount: basePreservation.length,
      addedComponentCount: 1,
      addedTokenCount: 1,
      reviewRequiredMappingCount: Object.keys(sourceMapping.reviewRequired).length
    },
    catalogExpansion: {
      baseCatalogId: context.checkboxCatalog.catalogId,
      expandedCatalogId: expandedCatalog.catalogId,
      catalogIdChanged: context.checkboxCatalog.catalogId !== expandedCatalog.catalogId,
      baseCatalogHash: context.checkboxCatalogRef.hash,
      expandedCatalogHash: expandedCatalogRef.hash,
      basePreservation,
      addedComponentIds: ["Switch"],
      addedTokenIds: ["switch-control-width-medium-desktop"],
      runtimeCapabilitiesPreserved: true,
      compatibilityPreserved: true
    },
    status: "pass",
    promotionStatus: "review_required"
  };
}

function assertExpectedArgs(args) {
  if (Object.entries(EXPECTED_ARGS).some(([key, value]) => args[key] !== value)) throw contractError(usage(), 2);
}

async function assertRequiredInputs(cwd) {
  const requiredFiles = [
    ...sscSchemaPaths(),
    ...sscFixturePaths(),
    ...sscSourcePaths(),
    ...SSC_IMPLEMENTATION_FILES,
    SSC_P2_EVIDENCE_PATH,
    SSC_CHECKBOX_EVIDENCE_PATH,
    SSC_CHECKBOX_CATALOG_PATH,
    SSC_P2_REGISTRY_PATH,
    SSC_P2_TOKEN_PATH
  ];
  for (const relative of requiredFiles) await assertRegularFile(cwd, relative);
  await assertExactFixtureClosure(cwd);
  await assertExactTargetSchemaClosure(cwd);
  await assertExactSourceClosure(cwd);
  for (const relative of [
    ...SSC_SCHEMA_FILES.map((file) => `${SSC_SCHEMA_ROOT}/${file}`),
    ...sscFixturePaths(),
    SSC_MANIFEST_PATH,
    ...SSC_MAPPING_PATHS
  ]) await assertCanonicalJsonFile(cwd, relative);
}

async function assertRegularFile(cwd, relative) {
  await assertSafeAncestorDirectories(cwd, relative);
  let stat;
  try {
    stat = await fs.lstat(path.join(cwd, relative));
  } catch {
    throw contractError(`missing required spectrum Switch catalog input: ${relative}`, 1);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    throw contractError(`spectrum Switch catalog input is not an independent regular file: ${relative}`, 1);
  }
}

async function assertSafeAncestorDirectories(cwd, relative) {
  const segments = relative.split("/");
  const workspace = path.resolve(cwd);
  const resolved = path.resolve(cwd, ...segments);
  if (!resolved.startsWith(`${workspace}${path.sep}`)) throw contractError(`unsafe spectrum Switch catalog path: ${relative}`, 1);
  const workspaceStat = await fs.lstat(cwd);
  if (!workspaceStat.isDirectory() || workspaceStat.isSymbolicLink()) throw contractError("spectrum Switch catalog workspace root is unsafe", 1);
  let current = cwd;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch {
      throw contractError(`missing required spectrum Switch catalog input ancestor: ${relative}`, 1);
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError(`unsafe spectrum Switch catalog input ancestor: ${relative}`, 1);
  }
}

async function assertSafeOutputDirectoryChain(cwd, relative) {
  const segments = relative.split("/");
  const workspace = path.resolve(cwd);
  const resolved = path.resolve(cwd, ...segments);
  if (!resolved.startsWith(`${workspace}${path.sep}`)) throw contractError("spectrum Switch catalog output root is unsafe", 1);
  const workspaceStat = await fs.lstat(cwd);
  if (!workspaceStat.isDirectory() || workspaceStat.isSymbolicLink()) throw contractError("spectrum Switch catalog workspace root is unsafe", 1);
  let current = cwd;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError("spectrum Switch catalog output root is unsafe", 1);
  }
}

async function assertCanonicalJsonFile(cwd, relative) {
  const raw = await fs.readFile(path.join(cwd, relative), "utf8");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw contractError(`spectrum Switch catalog JSON is invalid: ${relative}`, 1);
  }
  if (raw !== canonicalJson(value)) throw contractError(`spectrum Switch catalog JSON is not JCS canonical: ${relative}`, 1);
}

async function assertExactFixtureClosure(cwd) {
  const expected = sscFixturePaths().map((relative) => path.posix.relative(SSC_FIXTURE_ROOT, relative)).sort();
  const actual = await collectTree(path.join(cwd, SSC_FIXTURE_ROOT));
  if (canonicalJson(actual) !== canonicalJson(expected)) throw contractError("spectrum Switch catalog fixture tree closure drift", 1);
}

async function assertExactTargetSchemaClosure(cwd) {
  const entries = await fs.readdir(path.join(cwd, SSC_SCHEMA_ROOT), { withFileTypes: true });
  const actual = entries
    .filter((entry) => entry.name.startsWith("spectrum-switch-"))
    .map((entry) => entry.isFile() ? entry.name : `${entry.name}!`)
    .sort();
  if (canonicalJson(actual) !== canonicalJson([...SSC_SCHEMA_FILES].sort())) throw contractError("spectrum Switch catalog target schema closure drift", 1);
}

async function assertExactSourceClosure(cwd) {
  const expected = [
    "README.md",
    "manifest.json",
    "mappings/component-map.json",
    "mappings/policy-map.json",
    "npm/@adobe/spectrum-design-data/0.7.0/package/components/switch.json",
    "source-addendum.lock.json"
  ].sort();
  const actual = await collectTree(path.join(cwd, SSC_SOURCE_ROOT));
  if (canonicalJson(actual) !== canonicalJson(expected)) throw contractError("spectrum Switch catalog source tree closure drift", 1);
}

async function assertNoStaleOutput(cwd) {
  await assertSafeOutputDirectoryChain(cwd, SSC_ARTIFACT_ROOT);
  const root = path.join(cwd, SSC_ARTIFACT_ROOT);
  try {
    const stat = await fs.lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError("spectrum Switch catalog output root is unsafe", 1);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    if (error?.exitCode) throw error;
    throw error;
  }
  const actual = await collectTree(root);
  const allowed = [...SSC_GENERATED_ARTIFACTS].sort();
  if (actual.some((relative) => !allowed.includes(relative))) throw contractError("spectrum Switch catalog output contains stale or undeclared artifacts", 1);
  for (const relative of actual) await fs.unlink(path.join(root, relative));
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true, validateFormats: false });
  const idBySchemaId = new Map();
  for (const relative of sscSchemaPaths()) {
    const schema = await readJson(path.join(cwd, relative));
    ajv.addSchema(schema);
    idBySchemaId.set(schema.schemaId || relative.replace(/^schemas\//, "").replace(/\.schema\.json$/, ""), schema.$id);
  }
  return { ajv, idBySchemaId };
}

function assertSchema(validators, schemaId, data, artifactPath) {
  const id = validators.idBySchemaId.get(schemaId);
  const validate = id ? validators.ajv.getSchema(id) : null;
  if (!validate) throw contractError(`schema not loaded: ${schemaId}`, 1);
  if (!validate(data)) throw contractError(`schema validation failed for ${artifactPath}: ${formatAjvErrors(validate.errors)}`, 1);
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
}

async function loadAndVerifyContext(cwd, validators) {
  const p2Evidence = await readJson(path.join(cwd, SSC_P2_EVIDENCE_PATH));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, SSC_P2_EVIDENCE_PATH);
  if (p2Evidence.status !== "pass") throw contractError("Accepted P2 evidence is not passing.", 1);
  const p2IntegrityCode = await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence);
  if (p2IntegrityCode !== null) throw contractError(`Accepted P2 evidence is not intact: ${p2IntegrityCode}`, 1);

  const checkboxEvidence = await readJson(path.join(cwd, SSC_CHECKBOX_EVIDENCE_PATH));
  if (checkboxEvidence.schemaId !== "spectrum-checkbox-catalog-evidence.v0" || checkboxEvidence.status !== "pass") {
    throw contractError("Accepted Checkbox evidence is not passing.", 1);
  }
  const checkboxCatalog = await readJson(path.join(cwd, SSC_CHECKBOX_CATALOG_PATH));
  assertSchema(validators, "runtime-catalog.v0", checkboxCatalog, SSC_CHECKBOX_CATALOG_PATH);
  const checkboxCatalogHash = await canonicalFileHash(path.join(cwd, SSC_CHECKBOX_CATALOG_PATH));
  const checkboxCatalogEvidenceRef = checkboxEvidence.artifactRefs?.find((ref) => ref.path === SSC_CHECKBOX_CATALOG_PATH);
  if (!checkboxCatalogEvidenceRef || checkboxCatalogEvidenceRef.hash !== checkboxCatalogHash) {
    throw contractError("The Checkbox baseline catalog does not match accepted Checkbox evidence.", 1);
  }
  const checkboxIntegrityCode = await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(cwd, checkboxEvidence);
  if (checkboxIntegrityCode !== null) throw contractError(`Accepted Checkbox evidence is not intact: ${checkboxIntegrityCode}`, 1);

  await assertImmutableSpectrumSwitchSource(cwd);
  const lock = await readJson(path.join(cwd, SSC_LOCK_PATH));
  const manifest = await readJson(path.join(cwd, SSC_MANIFEST_PATH));
  const componentMap = await readJson(path.join(cwd, SSC_MAPPING_PATHS[0]));
  const policyMap = await readJson(path.join(cwd, SSC_MAPPING_PATHS[1]));
  const switchSource = await readJson(path.join(cwd, SSC_COMPONENT_PATH));
  const registry = await readJson(path.join(cwd, SSC_P2_REGISTRY_PATH));
  const tokens = await readJson(path.join(cwd, SSC_P2_TOKEN_PATH));
  const expectations = await readJson(path.join(cwd, `${SSC_FIXTURE_ROOT}/expectations.manifest.json`));

  assertSchema(validators, "spectrum-switch-source-addendum-lock.v0", lock, SSC_LOCK_PATH);
  assertSchema(validators, "spectrum-switch-source-manifest.v0", manifest, SSC_MANIFEST_PATH);
  assertSchema(validators, "spectrum-switch-source-mapping.v0", componentMap, SSC_MAPPING_PATHS[0]);
  assertSchema(validators, "spectrum-switch-source-mapping.v0", policyMap, SSC_MAPPING_PATHS[1]);
  const expectedMappings = buildExpectedSpectrumSwitchSourceMappings();
  if (canonicalJson(componentMap) !== canonicalJson(expectedMappings["component-map.json"]) || canonicalJson(policyMap) !== canonicalJson(expectedMappings["policy-map.json"])) throw contractError("A Switch mapping file does not match the declared mapping contract.", 1);
  assertSchema(validators, "spectrum-switch-catalog-expectations.v0", expectations, `${SSC_FIXTURE_ROOT}/expectations.manifest.json`);
  const expectedManifest = await buildExpectedSpectrumSwitchSourceManifest(cwd);
  if (canonicalJson(manifest) !== canonicalJson(expectedManifest)) throw contractError("The Switch source byte or source manifest hash does not match its checked boundary.", 1);
  await assertManifestHashes(cwd, manifest, { p2Evidence, checkboxEvidence, checkboxCatalogHash });
  if (canonicalJson(manifest.includedPointers) !== canonicalJson(SSC_INCLUDED_POINTERS)) throw contractError("The Switch source manifest pointer allowlist drifted.", 1);
  assertExactSourceFacts(switchSource, registry, tokens, componentMap);
  assertExpectationManifest(expectations);

  const p2EvidenceRef = artifactRef(SSC_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2Internals.computeEvidenceSelfHash(p2Evidence));
  const checkboxEvidenceRef = artifactRef(SSC_CHECKBOX_EVIDENCE_PATH, "spectrum-checkbox-catalog-evidence.v0", spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(checkboxEvidence));
  const checkboxCatalogRef = artifactRef(SSC_CHECKBOX_CATALOG_PATH, "runtime-catalog.v0", checkboxCatalogHash);
  const manifestRef = artifactRef(SSC_MANIFEST_PATH, "spectrum-switch-source-manifest.v0", await canonicalFileHash(path.join(cwd, SSC_MANIFEST_PATH)), SWITCH_SOURCE_REF);
  const implementationHashes = {};
  for (const relative of SSC_IMPLEMENTATION_FILES) implementationHashes[relative] = await rawFileHash(path.join(cwd, relative));
  const context = { p2Evidence, checkboxEvidence, checkboxCatalog, p2EvidenceRef, checkboxEvidenceRef, checkboxCatalogRef, lock, manifest, manifestRef, componentMap, policyMap, switch: switchSource, registry, tokens, expectations, implementationHashes, assertFixtureSchema: (schemaId, value, artifactPath) => assertSchema(validators, schemaId, value, artifactPath) };
  assertManifestRefsResolve(context);
  return context;
}

async function assertManifestHashes(cwd, manifest, { p2Evidence, checkboxEvidence, checkboxCatalogHash }) {
  const expected = [
    [manifest.upstreamBoundaries.p2EvidenceRef.hash, p2Internals.computeEvidenceSelfHash(p2Evidence), "Accepted P2 evidence does not match the evidence closure."],
    [manifest.upstreamBoundaries.checkboxEvidenceRef.hash, spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(checkboxEvidence), "Accepted Checkbox evidence does not match the evidence closure."],
    [manifest.upstreamBoundaries.checkboxCatalogRef.hash, checkboxCatalogHash, "The Checkbox baseline catalog does not match accepted Checkbox evidence."],
    [manifest.sourceAddendumLock.sha256, await rawFileHash(path.join(cwd, SSC_LOCK_PATH)), "The Switch source addendum does not match its immutable review-time lock."],
    [manifest.sourceFiles[0].sha256, await rawFileHash(path.join(cwd, SSC_COMPONENT_PATH)), "The Switch source byte or source manifest hash does not match its checked boundary."],
    [manifest.reusedP2SourceFiles[0].sha256, await rawFileHash(path.join(cwd, manifest.reusedP2SourceFiles[0].path)), "Accepted P2 evidence or catalog bytes do not match the evidence closure."],
    [manifest.reusedP2SourceFiles[1].sha256, await rawFileHash(path.join(cwd, manifest.reusedP2SourceFiles[1].path)), "Accepted P2 evidence or catalog bytes do not match the evidence closure."]
  ];
  for (const [actual, wanted, message] of expected) if (actual !== wanted) throw contractError(message, 1);
  for (const mapping of manifest.requiredMappings) {
    const relative = `${SSC_SOURCE_ROOT}/${mapping.path}`;
    if (mapping.sha256 !== await canonicalFileHash(path.join(cwd, relative))) throw contractError("A Switch mapping file does not match the source manifest.", 1);
  }
}

function assertExactSourceFacts(switchSource, registry, tokens, componentMap) {
  const optionIds = Object.keys(switchSource.options || {}).sort();
  const expectedOptionIds = ["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"];
  if (switchSource.name !== "switch" || canonicalJson(optionIds) !== canonicalJson(expectedOptionIds)) throw contractError("The requested component or property is outside the declared Switch source mapping.", 1);
  const expectedOptionShape = {
    label: { type: "string", default: undefined },
    isSelected: { type: "boolean", default: false },
    size: { type: "string", default: "m" },
    isEmphasized: { type: "boolean", default: false },
    isDisabled: { type: "boolean", default: false },
    isReadOnly: { type: "boolean", default: false }
  };
  for (const [id, expected] of Object.entries(expectedOptionShape)) {
    if (switchSource.options[id]?.type !== expected.type || switchSource.options[id]?.default !== expected.default) throw contractError("The requested component or property is outside the declared Switch source mapping.", 1);
  }
  if (componentMap.mappingRows?.["switch-selection-precedence"] || componentMap.mappingRows?.["switch-prop-is-indeterminate"]) throw contractError("The Switch mapping invents unsupported selection authority.", 1);
  if (canonicalJson(switchSource.options.size.values?.map((row) => row.value)) !== canonicalJson(["s", "m", "l", "xl"])) throw contractError("The requested component or property is outside the declared Switch source mapping.", 1);
  if (canonicalJson(switchSource.states?.map((row) => row.name)) !== canonicalJson(["hover", "down", "keyboard-focus"])) throw contractError("The keyboard-focus state must use the one declared keyboardFocus normalization.", 1);
  const expectedWcag = [
    { criterion: "2.1.1", level: "A", title: "Keyboard" },
    { criterion: "4.1.2", level: "A", title: "Name, Role, Value" }
  ];
  if (switchSource.accessibility?.role !== "switch" || canonicalJson(switchSource.accessibility.intents) !== canonicalJson(["choose"]) || switchSource.accessibility.focusable !== true || canonicalJson(switchSource.accessibility.keyboardIntents) !== canonicalJson(["activate"]) || canonicalJson(switchSource.accessibility.wcag) !== canonicalJson(expectedWcag)) throw contractError("The requested component or property is outside the declared Switch source mapping.", 1);
  if (switchSource.documentBlocks?.length !== 17 || switchSource.documentBlocks[0]?.type !== "purpose" || switchSource.documentBlocks.slice(1).some((row) => row.type !== "guideline")) throw contractError("The requested component or property is outside the declared Switch source mapping.", 1);
  if (switchSource.tokenBindings?.length !== 62 || canonicalJson(switchSource.tokenBindings[6]) !== canonicalJson({ token: "switch-control-width-medium", context: "Track (size)" })) throw contractError("The Switch token binding requires an explicit declared scale mapping.", 1);
  if (canonicalJson(registry.values?.[44]) !== canonicalJson({ id: "switch", label: "Switch", documentationUrl: "https://spectrum.adobe.com/page/switch/" })) throw contractError("The requested component or property is outside the declared Switch source mapping.", 1);
  const token = tokens[1066];
  if (token?.name?.component !== "switch" || token.name.property !== "control-width-medium" || token.name.scale !== "desktop" || token.value !== "26px") throw contractError("The Switch token binding requires an explicit declared scale mapping.", 1);
}

function assertExpectationManifest(expectations) {
  const projection = expectations.expectations.map(({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }) => ({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }));
  const expected = SSC_EXPECTATION_ROWS.map(({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }) => ({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }));
  if (canonicalJson(projection) !== canonicalJson(expected)) throw contractError("spectrum Switch catalog expectations manifest drift", 1);
  if (canonicalJson(expectations.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry())) throw contractError("spectrum Switch catalog diagnostics registry drift", 1);
  if (canonicalJson(expectations) !== canonicalJson(SSC_FIXTURES["expectations.manifest.json"])) throw contractError("spectrum Switch catalog expectations manifest drift", 1);
}

function assertManifestRefsResolve(context) {
  const sourceRefs = [
    ...context.manifest.sourceFiles.map((row) => row.sourceRefRoot),
    ...context.manifest.reusedP2SourceFiles.map((row) => row.sourceRef),
    ...context.manifest.policyRefs,
    ...Object.values(context.componentMap.mappingRows).flatMap((row) => row.sourceRefs),
    ...Object.values(context.policyMap.reviewRequired).flatMap((row) => row.sourceRefs)
  ];
  for (const sourceRef of sourceRefs) {
    if (resolveSourceRef(context, sourceRef) === undefined) throw contractError(`unresolved Switch source reference: ${sourceRef}`, 1);
  }
  for (const row of Object.values(context.componentMap.mappingRows)) {
    if (row.authorityScope !== "mapping-narrows-source" || row.reviewStatus !== "accepted") throw contractError("A Switch mapping would broaden source authority.", 1);
    for (const mappingRef of row.mappingRefs) assertMappingRef(context, mappingRef);
    for (const targetRef of row.targetRefs) assertDeclaredTargetRef(targetRef);
  }
  for (const row of Object.values(context.policyMap.reviewRequired)) {
    if (row.promotionStatus !== "review_required" || row.executable !== false) throw contractError("Switch source intent requires owner review and remains non-executable.", 1);
    for (const mappingRef of row.mappingRefs) assertMappingRef(context, mappingRef);
  }
}

function resolveSourceRef(context, sourceRef) {
  const prefix = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/";
  if (!sourceRef.startsWith(prefix)) return undefined;
  const fragmentIndex = sourceRef.indexOf("#", prefix.length);
  if (fragmentIndex < 0) return undefined;
  const packagePath = sourceRef.slice(prefix.length, fragmentIndex);
  const pointer = sourceRef.slice(fragmentIndex + 1);
  let root;
  if (packagePath === "components/switch.json") {
    if (!context.manifest.includedPointers.includes(pointer)) return undefined;
    root = context.switch;
  } else if (packagePath === "registry/components.json") {
    if (sourceRef !== REGISTRY_SOURCE_REF) return undefined;
    root = context.registry;
  } else if (packagePath === "tokens/layout-component.tokens.json") {
    if (sourceRef !== TOKEN_SOURCE_REF) return undefined;
    root = context.tokens;
  }
  else return undefined;
  return resolveJsonPointer(root, pointer);
}

function resolveJsonPointer(root, pointer) {
  if (pointer === "") return root;
  if (!pointer.startsWith("/")) return undefined;
  let current = root;
  for (const encoded of pointer.slice(1).split("/")) {
    const key = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    if (current === null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return undefined;
    current = current[key];
  }
  return current;
}

function assertMappingRef(context, mappingRef) {
  const prefix = "mapping://spectrum-switch-catalog/";
  if (!mappingRef.startsWith(prefix)) throw contractError(`unresolved Switch mapping reference: ${mappingRef}`, 1);
  const [file, fragment = ""] = mappingRef.slice(prefix.length).split("#");
  const root = file === "component-map.json" ? context.componentMap : file === "policy-map.json" ? context.policyMap : undefined;
  if (!root || resolveJsonPointer(root, fragment) === undefined) throw contractError(`unresolved Switch mapping reference: ${mappingRef}`, 1);
}

function assertDeclaredTargetRef(targetRef) {
  const allowed = new Set([
    "catalog://spectrum-switch-catalog/components/Switch",
    "catalog://spectrum-switch-catalog/components/Switch/accessibility",
    "catalog://spectrum-switch-catalog/components/Switch/examples/0",
    "catalog://spectrum-switch-catalog/tokens/switch-control-width-medium-desktop",
    ...["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"].map((id) => `catalog://spectrum-switch-catalog/components/Switch/props/${id}`),
    ...["down", "hover", "keyboardFocus"].map((id) => `catalog://spectrum-switch-catalog/components/Switch/states/${id}`)
  ]);
  if (!allowed.has(targetRef)) throw contractError(`undeclared Switch mapping target: ${targetRef}`, 1);
}

async function buildSourceInventory(cwd, context) {
  return {
    schemaId: "spectrum-switch-source-inventory.v0",
    version: SSC_VERSION,
    sourceManifestRef: context.manifestRef,
    upstreamBoundaryRefs: [context.p2EvidenceRef, context.checkboxEvidenceRef, context.checkboxCatalogRef],
    sourceFiles: [
      artifactRef(SSC_LOCK_PATH, "spectrum-switch-source-addendum-lock.v0", await rawFileHash(path.join(cwd, SSC_LOCK_PATH)), SWITCH_SOURCE_REF),
      artifactRef(SSC_COMPONENT_PATH, "raw-source", await rawFileHash(path.join(cwd, SSC_COMPONENT_PATH)), SWITCH_SOURCE_REF)
    ],
    reusedSourceFiles: [
      artifactRef(SSC_P2_REGISTRY_PATH, "raw-source", await rawFileHash(path.join(cwd, SSC_P2_REGISTRY_PATH)), REGISTRY_SOURCE_REF),
      artifactRef(SSC_P2_TOKEN_PATH, "raw-source", await rawFileHash(path.join(cwd, SSC_P2_TOKEN_PATH)), TOKEN_SOURCE_REF)
    ],
    coverage: {
      componentIds: ["Switch"],
      propIds: ["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"],
      stateIds: ["down", "hover", "keyboardFocus"],
      accessibilityFactCount: 5,
      exampleCount: 1,
      mappedTokenIds: ["switch-control-width-medium-desktop"],
      outOfScopeTokenBindingCount: 61,
      guidanceBlockCount: 16
    },
    provenance: provenance("interfacectl-spectrum-switch-source-inventory", [SSC_MANIFEST_PATH, SWITCH_SOURCE_REF, REGISTRY_SOURCE_REF, TOKEN_SOURCE_REF])
  };
}

async function buildCombinedSourceMapping(cwd, context) {
  return {
    schemaId: "spectrum-switch-source-mapping.v0",
    version: SSC_VERSION,
    mappingSetId: "spectrum-switch-combined-source-mapping",
    sourceManifestRef: artifactRef(SSC_MANIFEST_PATH, "spectrum-switch-source-manifest.v0", await canonicalFileHash(path.join(cwd, SSC_MANIFEST_PATH)), SWITCH_SOURCE_REF),
    mappingRows: deepClone(context.componentMap.mappingRows),
    reviewRequired: deepClone(context.policyMap.reviewRequired),
    provenance: provenance("interfacectl-spectrum-switch-source-mapping", [SSC_MAPPING_PATHS[0], SSC_MAPPING_PATHS[1], SWITCH_SOURCE_REF])
  };
}

function assertMappingClosure(context, sourceMapping) {
  const expectedMappingIds = [
    "switch-accessibility",
    "switch-component",
    "switch-control-width-medium-desktop",
    "switch-prop-is-disabled",
    "switch-prop-is-emphasized",
    "switch-prop-is-read-only",
    "switch-prop-is-selected",
    "switch-prop-label",
    "switch-prop-size",
    "switch-purpose-example",
    "switch-state-down",
    "switch-state-hover",
    "switch-state-keyboard-focus"
  ];
  if (canonicalJson(Object.keys(sourceMapping.mappingRows).sort()) !== canonicalJson(expectedMappingIds)) throw contractError("Switch mapping closure drift", 1);
  if (canonicalJson(Object.keys(sourceMapping.reviewRequired).sort()) !== canonicalJson(["switch-activation-intent-review", "switch-standalone-label-review"])) throw contractError("Switch review mapping closure drift", 1);
  assertManifestRefsResolve({ ...context, componentMap: { ...context.componentMap, mappingRows: sourceMapping.mappingRows }, policyMap: { ...context.policyMap, reviewRequired: sourceMapping.reviewRequired } });
}

function assertMappingTargetsResolve(sourceMapping, catalog) {
  const prefix = "catalog://spectrum-switch-catalog/";
  for (const row of Object.values(sourceMapping.mappingRows)) {
    for (const targetRef of row.targetRefs) {
      if (!targetRef.startsWith(prefix)) throw contractError(`undeclared Switch mapping target: ${targetRef}`, 1);
      const pointer = `/${targetRef.slice(prefix.length).split("/").map(escapeJsonPointer).join("/")}`;
      if (resolveJsonPointer(catalog, pointer) === undefined) throw contractError(`unresolved Switch mapping target: ${targetRef}`, 1);
    }
  }
}

function escapeJsonPointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function buildExpandedCatalog(context) {
  const catalog = deepClone(context.checkboxCatalog);
  const allowedProps = ["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"];
  const prop = (id, type, defaultValue, allowedValues = [], tokenRefs = []) => ({
    id,
    type,
    required: false,
    default: defaultValue,
    allowedValues,
    tokenRefs,
    sourceRef: `${SWITCH_SOURCE_REF}/options/${id}`,
    diagnostics: [],
    minLength: null,
    maxLength: null,
    allowMarkup: false
  });
  const state = (id, sourceIndex) => ({
    id,
    allowedProps,
    accessibilityExpectations: {},
    sourceRef: `${SWITCH_SOURCE_REF}/states/${sourceIndex}`
  });
  catalog.catalogId = "surfaces-spectrum-switch-catalog-governed";
  catalog.sourceRefs = {
    ...catalog.sourceRefs,
    switch: SWITCH_SOURCE_REF,
    switchRegistry: REGISTRY_SOURCE_REF,
    switchToken: TOKEN_SOURCE_REF,
    spectrumSwitchCatalogManifest: SSC_MANIFEST_PATH
  };
  catalog.tokens["switch-control-width-medium-desktop"] = {
    type: "dimension",
    value: "26px",
    sourceRef: TOKEN_SOURCE_REF
  };
  catalog.components.Switch = {
    sourceRef: SWITCH_SOURCE_REF,
    props: {
      isDisabled: prop("isDisabled", "boolean", false),
      isEmphasized: prop("isEmphasized", "boolean", false),
      isReadOnly: prop("isReadOnly", "boolean", false),
      isSelected: prop("isSelected", "boolean", false),
      label: prop("label", "string", null),
      size: prop("size", "string", "m", ["s", "m", "l", "xl"], ["switch-control-width-medium-desktop"])
    },
    variants: {},
    states: {
      down: state("down", 1),
      hover: state("hover", 0),
      keyboardFocus: state("keyboardFocus", 2)
    },
    slots: {},
    actions: {},
    events: {},
    dataBindings: {},
    tokenRefs: { "switch-control-width-medium-desktop": "switch-control-width-medium-desktop" },
    accessibility: {
      role: "switch",
      intents: ["choose"],
      focusable: true,
      keyboardIntents: ["activate"],
      wcag: deepClone(context.switch.accessibility.wcag),
      runtimeAccessibilityCompliance: "not-proven",
      sourceRef: `${SWITCH_SOURCE_REF}/accessibility`
    },
    examples: [{
      id: "purpose",
      content: context.switch.documentBlocks[0].content,
      sourceRef: `${SWITCH_SOURCE_REF}/documentBlocks/0`
    }]
  };
  catalog.governance = {
    rules: {
      ...catalog.governance.rules,
      spectrumSwitchSourceReview: {
        promotionStatus: "review_required",
        executable: false,
        sourceRef: "mapping://spectrum-switch-catalog/policy-map.json#/reviewRequired"
      }
    },
    results: {
      ...catalog.governance.results,
      spectrumSwitchCatalog: {
        acceptedMappingCount: 13,
        reviewRequiredMappings: ["switch-activation-intent-review", "switch-standalone-label-review"]
      }
    },
    promotionStatus: "review_required"
  };
  catalog.provenance = {
    ...catalog.provenance,
    spectrumSwitchCatalog: {
      generatedAt: SSC_TIMESTAMP,
      generator: "interfacectl-spectrum-switch-catalog",
      baseCatalogHash: sha256Hex(canonicalJson(context.checkboxCatalog)),
      sourceManifestHash: sha256Hex(canonicalJson(context.manifest))
    }
  };
  return catalog;
}

function buildBasePreservation(baseCatalog, expandedCatalog) {
  return buildBasePreservationPointers(baseCatalog).map((pointer) => {
    const baseValue = resolveJsonPointer(baseCatalog, pointer);
    const expandedValue = resolveJsonPointer(expandedCatalog, pointer);
    const baseHash = sha256Hex(canonicalJson(baseValue));
    const expandedHash = sha256Hex(canonicalJson(expandedValue));
    return { pointer, baseHash, expandedHash, matched: baseHash === expandedHash };
  });
}

function buildBasePreservationPointers(baseCatalog) {
  const pointers = ["/schemaId", "/version", "/artifactKind", "/diagnostics"];
  for (const id of Object.keys(baseCatalog.components).sort()) pointers.push(`/components/${escapeJsonPointer(id)}`);
  for (const id of Object.keys(baseCatalog.tokens).sort()) pointers.push(`/tokens/${escapeJsonPointer(id)}`);
  for (const id of Object.keys(baseCatalog.sourceRefs).sort()) pointers.push(`/sourceRefs/${escapeJsonPointer(id)}`);
  for (const id of Object.keys(baseCatalog.governance.rules).sort()) pointers.push(`/governance/rules/${escapeJsonPointer(id)}`);
  for (const id of Object.keys(baseCatalog.governance.results).sort()) pointers.push(`/governance/results/${escapeJsonPointer(id)}`);
  pointers.push("/governance/promotionStatus");
  for (const id of Object.keys(baseCatalog.provenance).sort()) pointers.push(`/provenance/${escapeJsonPointer(id)}`);
  pointers.push("/runtimeCapabilities", "/compatibility");
  if (pointers.length !== 36) throw contractError(`Checkbox baseline preservation pointer count drift: ${pointers.length}`, 1);
  return pointers;
}

function assertBaseCatalogPreserved(baseCatalog, expandedCatalog, basePreservation) {
  if (basePreservation.length !== 36 || basePreservation.some((row) => !row.matched)) throw contractError("Accepted Checkbox catalog content changed while adding Switch authority.", 1);
  if (baseCatalog.catalogId !== "surfaces-spectrum-checkbox-catalog-governed" || expandedCatalog.catalogId !== "surfaces-spectrum-switch-catalog-governed" || baseCatalog.catalogId === expandedCatalog.catalogId) throw contractError("Switch catalog identity delta drift", 1);
  const baseComponents = Object.keys(baseCatalog.components).sort();
  const expandedComponents = Object.keys(expandedCatalog.components).sort();
  if (canonicalJson(baseComponents) !== canonicalJson(["Button", "Checkbox", "InLineAlert"]) || canonicalJson(expandedComponents) !== canonicalJson(["Button", "Checkbox", "InLineAlert", "Switch"])) throw contractError("Switch catalog component closure drift", 1);
  const addedTokens = Object.keys(expandedCatalog.tokens).filter((id) => !Object.hasOwn(baseCatalog.tokens, id)).sort();
  if (canonicalJson(addedTokens) !== canonicalJson(["switch-control-width-medium-desktop"])) throw contractError("Switch catalog token closure drift", 1);
  for (const [key, value] of Object.entries(baseCatalog.sourceRefs)) if (canonicalJson(expandedCatalog.sourceRefs[key]) !== canonicalJson(value)) throw contractError("Accepted Checkbox source reference changed while adding Switch authority.", 1);
  if (canonicalJson(Object.keys(expandedCatalog.sourceRefs).filter((key) => !Object.hasOwn(baseCatalog.sourceRefs, key)).sort()) !== canonicalJson(["spectrumSwitchCatalogManifest", "switch", "switchRegistry", "switchToken"])) throw contractError("Switch catalog source-reference delta drift", 1);
  for (const [key, value] of Object.entries(baseCatalog.governance.rules)) if (canonicalJson(expandedCatalog.governance.rules[key]) !== canonicalJson(value)) throw contractError("Accepted Checkbox governance rule changed while adding Switch authority.", 1);
  for (const [key, value] of Object.entries(baseCatalog.governance.results)) if (canonicalJson(expandedCatalog.governance.results[key]) !== canonicalJson(value)) throw contractError("Accepted Checkbox governance result changed while adding Switch authority.", 1);
  if (canonicalJson(Object.keys(expandedCatalog.governance.rules).filter((key) => !Object.hasOwn(baseCatalog.governance.rules, key)).sort()) !== canonicalJson(["spectrumSwitchSourceReview"])) throw contractError("Switch catalog governance-rule delta drift", 1);
  if (canonicalJson(Object.keys(expandedCatalog.governance.results).filter((key) => !Object.hasOwn(baseCatalog.governance.results, key)).sort()) !== canonicalJson(["spectrumSwitchCatalog"])) throw contractError("Switch catalog governance-result delta drift", 1);
  for (const [key, value] of Object.entries(baseCatalog.provenance)) if (canonicalJson(expandedCatalog.provenance[key]) !== canonicalJson(value)) throw contractError("Accepted Checkbox provenance changed while adding Switch authority.", 1);
  if (canonicalJson(Object.keys(expandedCatalog.provenance).filter((key) => !Object.hasOwn(baseCatalog.provenance, key)).sort()) !== canonicalJson(["spectrumSwitchCatalog"])) throw contractError("Switch catalog provenance delta drift", 1);
  if (expandedCatalog.governance.promotionStatus !== "review_required") throw contractError("Switch catalog unattended promotion drift", 1);
}

async function evaluateExpectations(cwd, expectations, context) {
  assertPositiveOutput(context);
  const results = [];
  for (const expected of expectations.expectations) {
    const fixtureValue = await readJson(path.join(cwd, expected.fixturePath));
    const fixtureSchemaId = expected.kind === "mutation" ? "spectrum-switch-catalog-preflight-mutation.v0" : "spectrum-switch-catalog-fixture.v0";
    context.assertFixtureSchema(fixtureSchemaId, fixtureValue, expected.fixturePath);
    const fixtureRelative = path.posix.relative(SSC_FIXTURE_ROOT, expected.fixturePath);
    if (canonicalJson(fixtureValue) !== canonicalJson(SSC_FIXTURES[fixtureRelative])) throw contractError(`spectrum Switch catalog fixture content drift: ${expected.fixturePath}`, 1);
    const actual = expected.kind === "mutation"
      ? await evaluateMutationFixture(cwd, fixtureValue, context)
      : evaluateCatalogFixture(fixtureValue, context);
    const expectedCodes = [...expected.diagnosticCodes].sort();
    const actualCodes = [...actual.diagnosticCodes].sort();
    results.push({
      fixturePath: expected.fixturePath,
      kind: expected.kind,
      expectedResult: expected.expectedResult,
      actualResult: actual.result,
      expectedPromotionStatus: expected.promotionStatus,
      actualPromotionStatus: actual.promotionStatus,
      expectedDiagnosticCodes: expectedCodes,
      actualDiagnosticCodes: actualCodes,
      matched: expected.expectedResult === actual.result && expected.promotionStatus === actual.promotionStatus && canonicalJson(expectedCodes) === canonicalJson(actualCodes)
    });
  }
  return results;
}

function evaluateCatalogFixture(fixture, context) {
  if (fixture.componentId !== "Switch") return invalid("SPECTRUM_SWITCH_MAPPING_UNSUPPORTED");
  if (fixture.sourceRef === null) return invalid("SPECTRUM_SWITCH_SOURCE_REF_MISSING");
  if (fixture.sourceRef !== SWITCH_SOURCE_REF) return invalid("SPECTRUM_SWITCH_SOURCE_REF_UNDECLARED");
  if (["action", "event", "slot", "data-binding", "runtime-key-binding", "variant", "prop", "isIndeterminate", "token"].includes(fixture.requestedAddition)) return invalid("SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION");
  if (["toggle-execution", "group-propagation"].includes(fixture.behaviorClaim)) return invalid("SPECTRUM_SWITCH_TOGGLE_BEHAVIOR_FORBIDDEN");
  if (fixture.behaviorClaim === "read-only-interaction") return invalid("SPECTRUM_SWITCH_READ_ONLY_BEHAVIOR_FORBIDDEN");
  if (fixture.runtimeAccessibilityClaim !== null) return invalid("SPECTRUM_SWITCH_RUNTIME_ACCESSIBILITY_FORBIDDEN");
  if (fixture.requestedAddition === "executable-policy" || fixture.policyText !== null) return invalid("SPECTRUM_SWITCH_POLICY_PROSE_FORBIDDEN");
  if (fixture.stateMapping?.source !== "keyboard-focus" || fixture.stateMapping.target !== "keyboardFocus") return invalid("SPECTRUM_SWITCH_STATE_MAPPING_INVALID");
  if (fixture.reviewScenario !== null && fixture.promotionRequest === "allowed") return invalid("SPECTRUM_SWITCH_REVIEW_PROMOTION_FORBIDDEN");
  if (fixture.tokenMode !== "desktop") return review("SPECTRUM_SWITCH_TOKEN_MODE_AMBIGUOUS");
  if (fixture.reviewScenario === "activation-intent") return review("SPECTRUM_SWITCH_ACTIVATION_REVIEW_REQUIRED");
  if (fixture.reviewScenario !== null) return review("SPECTRUM_SWITCH_REVIEW_REQUIRED");
  return { result: "valid", promotionStatus: "allowed", diagnosticCodes: [] };
}

function assertPositiveOutput(context) {
  const switchComponent = context.expandedCatalog?.components?.Switch;
  const reviews = context.sourceMapping?.reviewRequired;
  if (!switchComponent || canonicalJson(Object.keys(switchComponent.props).sort()) !== canonicalJson(["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"]) || canonicalJson(Object.keys(switchComponent.states).sort()) !== canonicalJson(["down", "hover", "keyboardFocus"])) throw contractError("Switch valid fixtures do not resolve to the governed catalog.", 1);
  for (const field of ["actions", "events", "slots", "dataBindings", "variants"]) {
    if (canonicalJson(switchComponent[field]) !== canonicalJson({})) throw contractError(`Switch catalog invented ${field} authority.`, 1);
  }
  if (Object.hasOwn(switchComponent, "runtimeKeyBindings") || Object.hasOwn(switchComponent, "toggleBehavior") || Object.hasOwn(switchComponent, "readOnlyBehavior")) throw contractError("Switch catalog invented runtime behavior authority.", 1);
  if (switchComponent.accessibility?.runtimeAccessibilityCompliance !== "not-proven") throw contractError("Switch catalog invented runtime accessibility compliance.", 1);
  if (context.expandedCatalog.tokens?.["switch-control-width-medium-desktop"]?.value !== "26px") throw contractError("Switch desktop token mapping is absent from the governed catalog.", 1);
  if (context.expandedCatalog.governance?.rules?.switchSelectionPrecedence || context.expandedCatalog.governance?.rules?.switchToggleBehavior) throw contractError("Switch catalog invented executable selection behavior.", 1);
  for (const id of ["switch-activation-intent-review", "switch-standalone-label-review"]) {
    if (reviews?.[id]?.promotionStatus !== "review_required" || reviews[id].executable !== false || !reviews[id].reviewOwner) throw contractError("Switch review fixture lacks an owner-bound non-executable mapping.", 1);
  }
}

function invalid(code) {
  return { result: "invalid", promotionStatus: "blocked", diagnosticCodes: [code] };
}

function review(code) {
  return { result: "review_required", promotionStatus: "review_required", diagnosticCodes: [code] };
}

async function evaluateMutationFixture(cwd, fixture, context) {
  const deferredFinalCodes = {
    "report-hash-mismatch": "SPECTRUM_SWITCH_REPORT_HASH_MISMATCH",
    "evidence-self-hash-mismatch": "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH"
  };
  if (deferredFinalCodes[fixture.mutationId]) return invalid(deferredFinalCodes[fixture.mutationId]);
  const code = await withInputMutationWorkspace(cwd, async (mutationCwd) => {
    const target = path.join(mutationCwd, fixture.targetPath);
    if (fixture.mutationId === "missing-p2-evidence") {
      await fs.unlink(target);
    } else if (fixture.mutationId === "nonpass-p2-evidence") {
      const value = await readJson(target);
      value.status = "fail";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "tampered-p2-evidence") {
      const value = await readJson(target);
      const fixtureRef = value.fixtureRefs[0];
      fixtureRef.hash = flippedHash(fixtureRef.hash);
      fixtureRef.provenance.artifactHash = fixtureRef.hash;
      value.artifactRefs.at(-1).hash = p2Internals.computeEvidenceSelfHash(value);
      context.assertFixtureSchema("design-system-ingestion-evidence.v0", value, fixture.targetPath);
      if (value.status !== "pass") throw contractError("tampered P2 evidence fixture escaped its bounded still-pass closure", 1);
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "missing-checkbox-evidence") {
      await fs.unlink(target);
    } else if (fixture.mutationId === "nonpass-checkbox-evidence") {
      const value = await readJson(target);
      value.status = "fail";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "tampered-checkbox-evidence") {
      const value = await readJson(target);
      value.fixtureRefs[0].hash = flippedHash(value.fixtureRefs[0].hash);
      value.artifactRefs.at(-1).hash = spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(value);
      if (value.status !== "pass") throw contractError("tampered Checkbox evidence fixture escaped its bounded still-pass closure", 1);
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "baseline-catalog-drift") {
      const value = await readJson(target);
      value.catalogId = `${value.catalogId}-mutated`;
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "source-byte-hash-mismatch") {
      const value = await readJson(target);
      value.name = "switch-mutated";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "extra-source-path") {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await writeCanonicalJson(target, { mutation: true });
    } else if (fixture.mutationId === "source-lock-hash-mismatch") {
      const value = await readJson(target);
      value.tarballSha256 = flippedHash(value.tarballSha256);
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "manifest-hash-mismatch") {
      const value = await readJson(target);
      value.includedPointers = [...value.includedPointers].reverse();
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "mapping-hash-mismatch") {
      const value = await readJson(target);
      value.mappingRows["switch-component"].normalizedId = "SwitchMutated";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "mapping-source-ref-undeclared") {
      const value = await readJson(target);
      value.mappingRows["switch-component"].sourceRefs[0] = `${SWITCH_SOURCE_REF}/documentBlocks/16`;
      await writeCanonicalJson(target, value);
      const manifestPath = path.join(mutationCwd, SSC_MANIFEST_PATH);
      const manifest = await readJson(manifestPath);
      const mappingRef = manifest.requiredMappings.find((row) => row.path === "mappings/component-map.json");
      mappingRef.sha256 = await canonicalFileHash(target);
      await writeCanonicalJson(manifestPath, manifest);
    } else if (fixture.mutationId === "schema-hash-mismatch") {
      const value = await readJson(target);
      value.title = "mutated-spectrum-switch-catalog-fixture";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "implementation-hash-mismatch") {
      await fs.appendFile(target, "\n");
    } else if (fixture.mutationId === "output-inventory-hash-mismatch") {
      const value = await readJson(target);
      value.coverage.guidanceBlockCount = 15;
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "output-mapping-hash-mismatch") {
      const value = await readJson(target);
      value.mappingSetId = `${value.mappingSetId}-mutated`;
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "governed-catalog-hash-mismatch") {
      const value = await readJson(target);
      value.catalogId = `${value.catalogId}-mutated`;
      await writeCanonicalJson(target, value);
    } else {
      throw contractError(`unknown spectrum Switch mutation: ${fixture.mutationId}`, 1);
    }
    if (["output-inventory-hash-mismatch", "output-mapping-hash-mismatch", "governed-catalog-hash-mismatch"].includes(fixture.mutationId)) {
      return firstGeneratedArtifactIntegrityFailureCode(mutationCwd, context.implementationHashes);
    }
    return firstInputIntegrityFailureCode(mutationCwd, { implementationHashes: context.implementationHashes });
  });
  if (!code) throw contractError(`mutation fixture did not fail through its production inspector: ${fixture.mutationId}`, 1);
  return invalid(code);
}

function flippedHash(hash) {
  return `${hash[0] === "0" ? "1" : "0"}${hash.slice(1)}`;
}

async function firstInputIntegrityFailureCode(cwd, { implementationHashes = null } = {}) {
  let p2Evidence;
  try {
    p2Evidence = await readJson(path.join(cwd, SSC_P2_EVIDENCE_PATH));
  } catch {
    return "SPECTRUM_SWITCH_P2_EVIDENCE_MISSING";
  }
  if (p2Evidence.status !== "pass") return "SPECTRUM_SWITCH_P2_EVIDENCE_NONPASS";
  try {
    if (await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence) !== null) return "SPECTRUM_SWITCH_P2_EVIDENCE_HASH_MISMATCH";
  } catch {
    return "SPECTRUM_SWITCH_P2_EVIDENCE_HASH_MISMATCH";
  }

  let checkboxEvidence;
  try {
    checkboxEvidence = await readJson(path.join(cwd, SSC_CHECKBOX_EVIDENCE_PATH));
  } catch {
    return "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_MISSING";
  }
  if (checkboxEvidence.status !== "pass") return "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_NONPASS";
  try {
    const checkboxCatalogHash = await canonicalFileHash(path.join(cwd, SSC_CHECKBOX_CATALOG_PATH));
    const checkboxCatalogRef = checkboxEvidence.artifactRefs?.find((ref) => ref.path === SSC_CHECKBOX_CATALOG_PATH);
    if (!checkboxCatalogRef || checkboxCatalogRef.hash !== checkboxCatalogHash) return "SPECTRUM_SWITCH_BASELINE_CATALOG_HASH_MISMATCH";
  } catch {
    return "SPECTRUM_SWITCH_BASELINE_CATALOG_HASH_MISMATCH";
  }
  try {
    if (await spectrumCheckboxCatalogInternals.firstEvidenceIntegrityFailureCode(cwd, checkboxEvidence) !== null) return "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH";
  } catch {
    return "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH";
  }

  try {
    await assertExactSourceClosure(cwd);
    await assertImmutableSpectrumSwitchSource(cwd);
  } catch (error) {
    if (error?.message === "The Switch source addendum does not match its immutable review-time lock.") return "SPECTRUM_SWITCH_SOURCE_LOCK_MISMATCH";
    if (error?.message === "The Switch source addendum contains an undeclared or unsafe package path." || error?.message?.includes("source tree closure drift")) return "SPECTRUM_SWITCH_SOURCE_PATH_UNDECLARED";
    return "SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH";
  }

  for (const [file, expected] of Object.entries(SSC_SCHEMAS)) {
    try {
      const actual = await readJson(path.join(cwd, SSC_SCHEMA_ROOT, file));
      if (canonicalJson(actual) !== canonicalJson(expected)) return "SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH";
    } catch {
      return "SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH";
    }
  }

  if (implementationHashes !== null) {
    for (const relative of SSC_IMPLEMENTATION_FILES) {
      try {
        if (implementationHashes[relative] !== await rawFileHash(path.join(cwd, relative))) return "SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH";
      } catch {
        return "SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH";
      }
    }
  }

  let manifest;
  let componentMap;
  let policyMap;
  let switchSource;
  let registry;
  let tokens;
  try {
    manifest = await readJson(path.join(cwd, SSC_MANIFEST_PATH));
    componentMap = await readJson(path.join(cwd, SSC_MAPPING_PATHS[0]));
    policyMap = await readJson(path.join(cwd, SSC_MAPPING_PATHS[1]));
    switchSource = await readJson(path.join(cwd, SSC_COMPONENT_PATH));
    registry = await readJson(path.join(cwd, SSC_P2_REGISTRY_PATH));
    tokens = await readJson(path.join(cwd, SSC_P2_TOKEN_PATH));
  } catch {
    return "SPECTRUM_SWITCH_MANIFEST_HASH_MISMATCH";
  }
  try {
    assertManifestRefsResolve({ manifest, componentMap, policyMap, switch: switchSource, registry, tokens });
  } catch (error) {
    if (error?.message?.includes("source reference")) return "SPECTRUM_SWITCH_SOURCE_REF_UNDECLARED";
    return "SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH";
  }
  let expectedManifest;
  try {
    expectedManifest = await buildExpectedSpectrumSwitchSourceManifest(cwd);
  } catch {
    return "SPECTRUM_SWITCH_MANIFEST_HASH_MISMATCH";
  }
  if (canonicalJson(manifest.sourceAddendumLock) !== canonicalJson(expectedManifest.sourceAddendumLock)) return "SPECTRUM_SWITCH_SOURCE_LOCK_MISMATCH";
  if (canonicalJson(manifest.sourceFiles) !== canonicalJson(expectedManifest.sourceFiles) || canonicalJson(manifest.reusedP2SourceFiles) !== canonicalJson(expectedManifest.reusedP2SourceFiles)) return "SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH";
  if (canonicalJson(manifest.requiredMappings) !== canonicalJson(expectedManifest.requiredMappings)) return "SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH";
  if (canonicalJson(manifest) !== canonicalJson(expectedManifest)) return "SPECTRUM_SWITCH_MANIFEST_HASH_MISMATCH";

  try {
    const expectedMappings = buildExpectedSpectrumSwitchSourceMappings();
    for (const [file, expected] of Object.entries(expectedMappings)) {
      const actual = file === "component-map.json" ? componentMap : policyMap;
      if (canonicalJson(actual) !== canonicalJson(expected)) return "SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH";
    }
  } catch {
    return "SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH";
  }
  return null;
}

async function firstGeneratedArtifactIntegrityFailureCode(cwd, implementationHashes) {
  const inputCode = await firstInputIntegrityFailureCode(cwd, { implementationHashes });
  if (inputCode !== null) return inputCode;
  try {
    const validators = await loadValidators(cwd);
    const context = await loadAndVerifyContext(cwd, validators);
    const actualInventory = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/source-inventory.json`));
    if (canonicalJson(actualInventory) !== canonicalJson(await buildSourceInventory(cwd, context))) return "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH";
    const actualMapping = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/source-mapping.json`));
    if (canonicalJson(actualMapping) !== canonicalJson(await buildCombinedSourceMapping(cwd, context))) return "SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH";
    const actualCatalog = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/governed-catalog.json`));
    if (canonicalJson(actualCatalog) !== canonicalJson(buildExpandedCatalog(context))) return "SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH";
    return null;
  } catch {
    return "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH";
  }
}

async function withInputMutationWorkspace(cwd, callback) {
  const mutationCwd = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-spectrum-switch-mutation-"));
  try {
    const p2Evidence = await readJson(path.join(cwd, SSC_P2_EVIDENCE_PATH));
    const p2Paths = [
      SSC_P2_EVIDENCE_PATH,
      p2Evidence.sourceManifestRef.path,
      ...p2Evidence.schemaClosure.map((ref) => ref.path),
      ...p2Evidence.sourceFileRefs.map((ref) => ref.path),
      ...p2Evidence.fixtureRefs.map((ref) => ref.path),
      ...p2Evidence.artifactRefs.map((ref) => ref.path)
    ];
    const checkboxEvidence = await readJson(path.join(cwd, SSC_CHECKBOX_EVIDENCE_PATH));
    const checkboxPaths = evidenceClosurePaths(checkboxEvidence);
    const targetPaths = [
      ...p2Paths,
      ...checkboxPaths,
      ...sscSchemaPaths(),
      ...sscFixturePaths(),
      ...sscSourcePaths(),
      ...SSC_IMPLEMENTATION_FILES,
      SSC_P2_REGISTRY_PATH,
      SSC_P2_TOKEN_PATH,
      `${SSC_ARTIFACT_ROOT}/source-inventory.json`,
      `${SSC_ARTIFACT_ROOT}/source-mapping.json`,
      `${SSC_ARTIFACT_ROOT}/governed-catalog.json`
    ];
    await copyFiles(cwd, mutationCwd, targetPaths);
    return await callback(mutationCwd);
  } finally {
    await fs.rm(mutationCwd, { recursive: true, force: true });
  }
}

function evidenceClosurePaths(evidence) {
  return [
    evidence.sourceManifestRef?.path,
    ...(evidence.schemaClosure || []).map((ref) => ref.path),
    ...(evidence.sourceFileRefs || []).map((ref) => ref.path),
    ...(evidence.fixtureRefs || []).map((ref) => ref.path),
    ...(evidence.implementationRefs || []).map((ref) => ref.path),
    ...(evidence.artifactRefs || []).map((ref) => ref.path),
    evidence.reportRef?.path
  ].filter(Boolean);
}

async function assertFinalMutationFixturesCausal(cwd, evidence) {
  const cases = [
    ["implementation-hash-mismatch", "SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH"],
    ["output-inventory-hash-mismatch", "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH"],
    ["output-mapping-hash-mismatch", "SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH"],
    ["governed-catalog-hash-mismatch", "SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH"],
    ["report-hash-mismatch", "SPECTRUM_SWITCH_REPORT_HASH_MISMATCH"],
    ["evidence-self-hash-mismatch", "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH"]
  ];
  const p2Evidence = await readJson(path.join(cwd, SSC_P2_EVIDENCE_PATH));
  const checkboxEvidence = await readJson(path.join(cwd, SSC_CHECKBOX_EVIDENCE_PATH));
  const allPaths = [...evidenceClosurePaths(p2Evidence), ...evidenceClosurePaths(checkboxEvidence), ...evidenceClosurePaths(evidence)];
  for (const [mutationId, expectedCode] of cases) {
    const fixture = Object.values(SSC_FIXTURES).find((value) => value.mutationId === mutationId);
    const mutationCwd = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-spectrum-switch-final-mutation-"));
    try {
      await copyFiles(cwd, mutationCwd, allPaths);
      const target = path.join(mutationCwd, fixture.targetPath);
      if (mutationId === "implementation-hash-mismatch") {
        await fs.appendFile(target, "\n");
      } else {
        const value = await readJson(target);
        if (mutationId === "output-inventory-hash-mismatch") value.coverage.guidanceBlockCount = 15;
        else if (mutationId === "output-mapping-hash-mismatch") value.mappingSetId = `${value.mappingSetId}-mutated`;
        else if (mutationId === "governed-catalog-hash-mismatch") value.catalogId = `${value.catalogId}-mutated`;
        else value.runId = `${value.runId}-mutated`;
        await writeCanonicalJson(target, value);
      }
      const copiedEvidence = await readJson(path.join(mutationCwd, `${SSC_ARTIFACT_ROOT}/evidence.json`));
      const code = await firstEvidenceIntegrityFailureCode(mutationCwd, copiedEvidence);
      if (code !== expectedCode) throw contractError(`spectrum Switch final mutation ${mutationId} returned ${code || "no failure"}; expected ${expectedCode}`, 1);
    } finally {
      await fs.rm(mutationCwd, { recursive: true, force: true });
    }
  }
}

async function copyFiles(sourceCwd, targetCwd, relativePaths) {
  for (const relative of [...new Set(relativePaths)].sort()) {
    const source = path.join(sourceCwd, relative);
    const target = path.join(targetCwd, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
  }
}

function buildRunId(manifest, expectations, args, boundaryRefs) {
  return `spectrum-switch-catalog-${sha256Hex(canonicalJson({
    manifestHash: sha256Hex(canonicalJson(manifest)),
    expectationsHash: sha256Hex(canonicalJson(expectations)),
    command: SSC_COMMAND,
    args,
    boundaryRefs
  })).slice(0, 32)}`;
}

async function buildEvidence(cwd, common, reportRef) {
  const schemaClosure = [];
  for (const relative of sscSchemaPaths()) {
    schemaClosure.push(artifactRef(relative, sscSchemaIdForPath(relative), await canonicalFileHash(path.join(cwd, relative))));
  }
  const sourceFileRefs = [];
  for (const relative of sscSourcePaths()) {
    sourceFileRefs.push(artifactRef(relative, sscSchemaIdForPath(relative), await rawFileHash(path.join(cwd, relative)), relative === SSC_COMPONENT_PATH ? SWITCH_SOURCE_REF : null));
  }
  for (const [relative, sourceRef] of [[SSC_P2_REGISTRY_PATH, REGISTRY_SOURCE_REF], [SSC_P2_TOKEN_PATH, TOKEN_SOURCE_REF]]) {
    sourceFileRefs.push(artifactRef(relative, "raw-source", await rawFileHash(path.join(cwd, relative)), sourceRef));
  }
  const fixtureRefs = [];
  for (const relative of sscFixturePaths()) fixtureRefs.push(artifactRef(relative, sscSchemaIdForPath(relative), await canonicalFileHash(path.join(cwd, relative))));
  const implementationRefs = [];
  for (const relative of SSC_IMPLEMENTATION_FILES) implementationRefs.push(artifactRef(relative, "implementation", await rawFileHash(path.join(cwd, relative))));
  const artifactRefs = [];
  for (const relative of SSC_ARTIFACT_PATHS) {
    if (relative.endsWith("/evidence.json")) artifactRefs.push(artifactRef(relative, "spectrum-switch-catalog-evidence.v0", null, SWITCH_SOURCE_REF));
    else artifactRefs.push(artifactRef(relative, sscSchemaIdForPath(relative), await canonicalFileHash(path.join(cwd, relative)), SWITCH_SOURCE_REF));
  }
  return {
    ...common,
    schemaId: "spectrum-switch-catalog-evidence.v0",
    schemaClosure,
    sourceFileRefs,
    fixtureRefs,
    implementationRefs,
    artifactRefs,
    reportRef,
    provenance: provenance("interfacectl-spectrum-switch-catalog-evidence", [SSC_MANIFEST_PATH, SSC_P2_EVIDENCE_PATH, SSC_CHECKBOX_EVIDENCE_PATH, SSC_CHECKBOX_CATALOG_PATH, "plans/spectrum-switch-catalog.md"])
  };
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifactRefs.find((ref) => ref.path === `${SSC_ARTIFACT_ROOT}/evidence.json`);
  if (!finalRef) return null;
  finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  try {
    if (!evidence || evidence.schemaId !== "spectrum-switch-catalog-evidence.v0" || evidence.contractId !== SSC_CONTRACT_ID || evidence.version !== SSC_VERSION || evidence.command !== SSC_COMMAND || evidence.checkedAt !== SSC_TIMESTAMP || canonicalJson(evidence.args) !== canonicalJson(EXPECTED_ARGS) || canonicalJson(evidence.environment) !== canonicalJson(SSC_ENVIRONMENT) || evidence.status !== "pass" || evidence.promotionStatus !== "review_required") return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    await assertRequiredInputs(cwd);
    const inputIntegrityCode = await firstInputIntegrityFailureCode(cwd);
    if (inputIntegrityCode !== null) return inputIntegrityCode;
    const validators = await loadValidators(cwd);
    assertSchema(validators, "spectrum-switch-catalog-evidence.v0", evidence, `${SSC_ARTIFACT_ROOT}/evidence.json`);

    const expectedSchemaPaths = sscSchemaPaths();
    const expectedSourcePaths = [...sscSourcePaths(), SSC_P2_REGISTRY_PATH, SSC_P2_TOKEN_PATH];
    const expectedFixturePaths = sscFixturePaths();
    if (canonicalJson(evidence.schemaClosure?.map((ref) => ref.path)) !== canonicalJson(expectedSchemaPaths)) return "SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH";
    if (canonicalJson(evidence.sourceFileRefs?.map((ref) => ref.path)) !== canonicalJson(expectedSourcePaths)) return "SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH";
    if (canonicalJson(evidence.fixtureRefs?.map((ref) => ref.path)) !== canonicalJson(expectedFixturePaths)) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(evidence.implementationRefs?.map((ref) => ref.path)) !== canonicalJson(SSC_IMPLEMENTATION_FILES)) return "SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH";
    if (canonicalJson(evidence.artifactRefs?.map((ref) => ref.path)) !== canonicalJson(SSC_ARTIFACT_PATHS)) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(evidence.boundaryRefs?.map((ref) => ref.path)) !== canonicalJson([SSC_P2_EVIDENCE_PATH, SSC_CHECKBOX_EVIDENCE_PATH, SSC_CHECKBOX_CATALOG_PATH])) return "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH";

    for (const ref of evidence.schemaClosure) if (!ref.hash || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH";
    for (const ref of evidence.sourceFileRefs) {
      const current = await rawFileHash(path.join(cwd, ref.path));
      if (!ref.hash || ref.hash !== current) return ref.path === SSC_LOCK_PATH ? "SPECTRUM_SWITCH_SOURCE_LOCK_MISMATCH" : ref.path === SSC_MANIFEST_PATH ? "SPECTRUM_SWITCH_MANIFEST_HASH_MISMATCH" : ref.path.includes("/mappings/") ? "SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH" : "SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH";
    }
    for (const ref of evidence.fixtureRefs) if (!ref.hash || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    for (const ref of evidence.implementationRefs) if (!ref.hash || ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH";
    for (const ref of evidence.artifactRefs) {
      if (ref.path === `${SSC_ARTIFACT_ROOT}/evidence.json`) continue;
      if (!ref.hash || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return artifactIntegrityCode(ref.path);
    }
    const finalRef = evidence.artifactRefs.at(-1);
    if (finalRef?.path !== `${SSC_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";

    const p2Evidence = await readJson(path.join(cwd, SSC_P2_EVIDENCE_PATH));
    const checkboxEvidence = await readJson(path.join(cwd, SSC_CHECKBOX_EVIDENCE_PATH));
    const checkboxCatalogHash = await canonicalFileHash(path.join(cwd, SSC_CHECKBOX_CATALOG_PATH));
    if (evidence.boundaryRefs[0].hash !== p2Internals.computeEvidenceSelfHash(p2Evidence)) return "SPECTRUM_SWITCH_P2_EVIDENCE_HASH_MISMATCH";
    if (evidence.boundaryRefs[1].hash !== spectrumCheckboxCatalogInternals.computeEvidenceSelfHash(checkboxEvidence)) return "SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    if (evidence.boundaryRefs[2].hash !== checkboxCatalogHash) return "SPECTRUM_SWITCH_BASELINE_CATALOG_HASH_MISMATCH";

    await assertImmutableSpectrumSwitchSource(cwd);
    const context = await loadAndVerifyContext(cwd, validators);
    const sourceInventory = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/source-inventory.json`));
    const sourceMapping = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/source-mapping.json`));
    const expandedCatalog = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/governed-catalog.json`));
    const report = await readJson(path.join(cwd, `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json`));
    assertSchema(validators, "spectrum-switch-source-inventory.v0", sourceInventory, `${SSC_ARTIFACT_ROOT}/source-inventory.json`);
    assertSchema(validators, "spectrum-switch-source-mapping.v0", sourceMapping, `${SSC_ARTIFACT_ROOT}/source-mapping.json`);
    assertSchema(validators, "runtime-catalog.v0", expandedCatalog, `${SSC_ARTIFACT_ROOT}/governed-catalog.json`);
    assertSchema(validators, "spectrum-switch-catalog-report.v0", report, `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json`);
    if (evidence.reportRef?.path !== `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json` || evidence.reportRef.hash !== await canonicalFileHash(path.join(cwd, evidence.reportRef.path))) return "SPECTRUM_SWITCH_REPORT_HASH_MISMATCH";

    const expectedInventory = await buildSourceInventory(cwd, context);
    const expectedMapping = await buildCombinedSourceMapping(cwd, context);
    const expectedCatalog = buildExpandedCatalog(context);
    if (canonicalJson(sourceInventory) !== canonicalJson(expectedInventory)) return "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH";
    if (canonicalJson(sourceMapping) !== canonicalJson(expectedMapping)) return "SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH";
    if (canonicalJson(expandedCatalog) !== canonicalJson(expectedCatalog)) return "SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH";
    assertMappingClosure(context, sourceMapping);
    assertMappingTargetsResolve(sourceMapping, expandedCatalog);
    const basePreservation = buildBasePreservation(context.checkboxCatalog, expandedCatalog);
    assertBaseCatalogPreserved(context.checkboxCatalog, expandedCatalog, basePreservation);
    const validationResults = await evaluateExpectations(cwd, context.expectations, { ...context, sourceMapping, expandedCatalog });
    if (canonicalJson(evidence.validationResults) !== canonicalJson(validationResults)) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    const expectedDiagnostics = [...new Set(validationResults.flatMap((row) => row.actualDiagnosticCodes))].sort().map((code) => deepClone(DIAGNOSTIC_BY_CODE.get(code)));
    if (canonicalJson(evidence.diagnostics) !== canonicalJson(expectedDiagnostics) || canonicalJson(evidence.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry())) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    const sourceInventoryRef = artifactRef(`${SSC_ARTIFACT_ROOT}/source-inventory.json`, "spectrum-switch-source-inventory.v0", await canonicalFileHash(path.join(cwd, SSC_ARTIFACT_ROOT, "source-inventory.json")), SWITCH_SOURCE_REF);
    const sourceMappingRef = artifactRef(`${SSC_ARTIFACT_ROOT}/source-mapping.json`, "spectrum-switch-source-mapping.v0", await canonicalFileHash(path.join(cwd, SSC_ARTIFACT_ROOT, "source-mapping.json")), SWITCH_SOURCE_REF);
    const expandedCatalogRef = artifactRef(`${SSC_ARTIFACT_ROOT}/governed-catalog.json`, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, SSC_ARTIFACT_ROOT, "governed-catalog.json")), SWITCH_SOURCE_REF);
    const expectedCommon = buildCommonProofRecord({
      context,
      sourceInventoryRef,
      sourceMappingRef,
      expandedCatalogRef,
      sourceMapping,
      expandedCatalog,
      validationResults,
      basePreservation,
      args: EXPECTED_ARGS
    });
    const expectedReport = {
      ...expectedCommon,
      schemaId: "spectrum-switch-catalog-report.v0",
      provenance: provenance("interfacectl-spectrum-switch-catalog-report", [SSC_MANIFEST_PATH, SSC_P2_EVIDENCE_PATH, SSC_CHECKBOX_EVIDENCE_PATH, SSC_CHECKBOX_CATALOG_PATH])
    };
    if (canonicalJson(report) !== canonicalJson(expectedReport)) return "SPECTRUM_SWITCH_REPORT_HASH_MISMATCH";
    const expectedReportRef = artifactRef(`${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json`, "spectrum-switch-catalog-report.v0", await canonicalFileHash(path.join(cwd, SSC_ARTIFACT_ROOT, "spectrum-switch-catalog-report.json")), SWITCH_SOURCE_REF);
    const expectedEvidence = await buildEvidence(cwd, expectedCommon, expectedReportRef);
    expectedEvidence.artifactRefs[expectedEvidence.artifactRefs.length - 1].hash = computeEvidenceSelfHash(expectedEvidence);
    if (canonicalJson(evidence) !== canonicalJson(expectedEvidence)) return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
    await assertExactArtifactClosure(cwd);
    return null;
  } catch (error) {
    if (error?.message?.includes("schema")) return "SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH";
    if (error?.message?.includes("source tree")) return "SPECTRUM_SWITCH_SOURCE_PATH_UNDECLARED";
    if (error?.message?.includes("source addendum") || error?.message?.includes("source byte")) return "SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH";
    return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
  }
}

function artifactIntegrityCode(artifactPath) {
  if (artifactPath.endsWith("/source-inventory.json")) return "SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH";
  if (artifactPath.endsWith("/source-mapping.json")) return "SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH";
  if (artifactPath.endsWith("/governed-catalog.json")) return "SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH";
  if (artifactPath.endsWith("/spectrum-switch-catalog-report.json")) return "SPECTRUM_SWITCH_REPORT_HASH_MISMATCH";
  return "SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH";
}

async function assertExactArtifactClosure(cwd) {
  await assertSafeOutputDirectoryChain(cwd, SSC_ARTIFACT_ROOT);
  const artifactRoot = path.join(cwd, SSC_ARTIFACT_ROOT);
  const entries = await fs.readdir(artifactRoot, { withFileTypes: true });
  const actual = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const stat = await fs.lstat(path.join(artifactRoot, entry.name));
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw contractError(`unsafe entry in spectrum Switch catalog artifact closure: ${entry.name}`, 1);
    actual.push(entry.name);
  }
  if (canonicalJson(actual) !== canonicalJson([...SSC_GENERATED_ARTIFACTS].sort())) throw contractError("spectrum Switch catalog artifact closure drift", 1);
  for (const relative of SSC_GENERATED_ARTIFACTS) {
    const artifactPath = `${SSC_ARTIFACT_ROOT}/${relative}`;
    await assertRegularFile(cwd, artifactPath);
    await assertCanonicalJsonFile(cwd, artifactPath);
  }
}

async function collectTree(root) {
  const result = [];
  async function walk(current, relative) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = path.join(current, entry.name);
      const stat = await fs.lstat(absolute);
      if (stat.isSymbolicLink()) throw contractError(`unsafe symlink in spectrum Switch catalog closure: ${nextRelative}`, 1);
      if (stat.isDirectory()) await walk(absolute, nextRelative);
      else if (stat.isFile() && stat.nlink === 1) result.push(nextRelative);
      else throw contractError(`unsafe entry in spectrum Switch catalog closure: ${nextRelative}`, 1);
    }
  }
  await walk(root, "");
  return result.sort();
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const spectrumSwitchCatalogInternals = {
  buildExpandedCatalog,
  computeEvidenceSelfHash,
  evaluateCatalogFixture,
  firstEvidenceIntegrityFailureCode,
  firstInputIntegrityFailureCode,
  parseArgs
};
