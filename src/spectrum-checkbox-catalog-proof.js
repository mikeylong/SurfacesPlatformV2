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
import {
  SCC_ARTIFACT_PATHS,
  SCC_ARTIFACT_ROOT,
  SCC_COMMAND,
  SCC_COMPONENT_PATH,
  SCC_COMPONENT_RAW_SHA256,
  SCC_CONTRACT_ID,
  SCC_ENVIRONMENT,
  SCC_EXPECTATION_ROWS,
  SCC_FIXTURES,
  SCC_FIXTURE_ROOT,
  SCC_GENERATED_ARTIFACTS,
  SCC_IMPLEMENTATION_FILES,
  SCC_LOCK_PATH,
  SCC_MANIFEST_PATH,
  SCC_MAPPING_PATHS,
  SCC_P2_CATALOG_PATH,
  SCC_P2_EVIDENCE_PATH,
  SCC_P2_REGISTRY_PATH,
  SCC_P2_TOKEN_PATH,
  SCC_SCHEMA_FILES,
  SCC_SCHEMAS,
  SCC_SCHEMA_ROOT,
  SCC_SHARED_SCHEMA_FILES,
  SCC_SOURCE_ROOT,
  SCC_TIMESTAMP,
  SCC_VERSION,
  artifactRef,
  assertImmutableSpectrumCheckboxSource,
  buildExpectedSpectrumCheckboxSourceManifest,
  buildExpectedSpectrumCheckboxSourceMappings,
  diagnosticsRegistry,
  provenance,
  sccFixturePaths,
  sccSchemaIdForPath,
  sccSchemaPaths,
  sccSourcePaths
} from "./spectrum-checkbox-catalog-contract.js";

const CHECKBOX_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/checkbox.json#";
const REGISTRY_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/registry/components.json#/values/13";
const TOKEN_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/layout-component.tokens.json#/320";
const EXPECTED_ARGS = Object.freeze({
  source: SCC_SOURCE_ROOT,
  ingestionEvidence: SCC_P2_EVIDENCE_PATH,
  catalog: SCC_P2_CATALOG_PATH,
  fixture: SCC_FIXTURE_ROOT,
  out: SCC_ARTIFACT_ROOT
});
const REQUIRED_FLAGS = [
  ["--source", "source"],
  ["--ingestion-evidence", "ingestionEvidence"],
  ["--catalog", "catalog"],
  ["--fixture", "fixture"],
  ["--out", "out"]
];
const DIAGNOSTIC_BY_CODE = new Map(diagnosticsRegistry().map((row) => [row.code, row]));
const BASE_PRESERVATION_POINTERS = [
  "/schemaId",
  "/version",
  "/artifactKind",
  "/components/Button",
  "/components/InLineAlert",
  "/tokens/border-width-200",
  "/tokens/button-minimum-width-multiplier",
  "/tokens/component-height-75",
  "/runtimeCapabilities",
  "/compatibility",
  "/diagnostics"
];

export async function runSpectrumCheckboxCatalogInterfacectl(argv, io) {
  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSpectrumCheckboxCatalogProof({ cwd: io.cwd, ...parsed.args });
    io.stdout.write([
      `surfaces spectrum-checkbox-catalog proof: ${result.status}`,
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
  return `usage: ${SCC_COMMAND} --source ${SCC_SOURCE_ROOT} --ingestion-evidence ${SCC_P2_EVIDENCE_PATH} --catalog ${SCC_P2_CATALOG_PATH} --fixture ${SCC_FIXTURE_ROOT} --out ${SCC_ARTIFACT_ROOT}`;
}

export async function runSpectrumCheckboxCatalogProof({ cwd, source, ingestionEvidence, catalog, fixture, out }) {
  assertExpectedArgs({ source, ingestionEvidence, catalog, fixture, out });
  await assertRequiredInputs(cwd);
  await assertNoStaleOutput(cwd);
  const validators = await loadValidators(cwd);
  const inputIntegrityCode = await firstInputIntegrityFailureCode(cwd);
  if (inputIntegrityCode !== null) throw contractError(`spectrum Checkbox catalog input integrity verification failed: ${inputIntegrityCode}`, 1);
  const context = await loadAndVerifyContext(cwd, validators);

  const sourceInventory = await buildSourceInventory(cwd, context);
  assertSchema(validators, "spectrum-checkbox-source-inventory.v0", sourceInventory, `${out}/source-inventory.json`);
  await writeCanonicalJson(path.join(cwd, out, "source-inventory.json"), sourceInventory);
  const sourceInventoryRef = artifactRef(`${out}/source-inventory.json`, "spectrum-checkbox-source-inventory.v0", await canonicalFileHash(path.join(cwd, out, "source-inventory.json")), CHECKBOX_SOURCE_REF);

  const sourceMapping = await buildCombinedSourceMapping(cwd, context);
  assertSchema(validators, "spectrum-checkbox-source-mapping.v0", sourceMapping, `${out}/source-mapping.json`);
  assertMappingClosure(context, sourceMapping);
  await writeCanonicalJson(path.join(cwd, out, "source-mapping.json"), sourceMapping);
  const sourceMappingRef = artifactRef(`${out}/source-mapping.json`, "spectrum-checkbox-source-mapping.v0", await canonicalFileHash(path.join(cwd, out, "source-mapping.json")), CHECKBOX_SOURCE_REF);

  const expandedCatalog = buildExpandedCatalog(context);
  assertSchema(validators, "runtime-catalog.v0", expandedCatalog, `${out}/governed-catalog.json`);
  assertMappingTargetsResolve(sourceMapping, expandedCatalog);
  const basePreservation = buildBasePreservation(context.p2Catalog, expandedCatalog);
  assertBaseCatalogPreserved(context.p2Catalog, expandedCatalog, basePreservation);
  await writeCanonicalJson(path.join(cwd, out, "governed-catalog.json"), expandedCatalog);
  const expandedCatalogRef = artifactRef(`${out}/governed-catalog.json`, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, out, "governed-catalog.json")), CHECKBOX_SOURCE_REF);

  const expectations = context.expectations;
  const validationResults = await evaluateExpectations(cwd, expectations, { ...context, sourceMapping, expandedCatalog });
  const mismatches = validationResults.filter((row) => !row.matched);
  if (mismatches.length > 0) {
    throw contractError(`spectrum Checkbox catalog validation expectation mismatch: ${mismatches.map((row) => row.fixturePath).join(", ")}`, 1);
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
    args: { source, ingestionEvidence, catalog, fixture, out }
  });

  const report = {
    ...common,
    schemaId: "spectrum-checkbox-catalog-report.v0",
    provenance: provenance("interfacectl-spectrum-checkbox-catalog-report", [SCC_MANIFEST_PATH, SCC_P2_EVIDENCE_PATH, SCC_P2_CATALOG_PATH])
  };
  assertSchema(validators, "spectrum-checkbox-catalog-report.v0", report, `${out}/spectrum-checkbox-catalog-report.json`);
  await writeCanonicalJson(path.join(cwd, out, "spectrum-checkbox-catalog-report.json"), report);
  const reportRef = artifactRef(`${out}/spectrum-checkbox-catalog-report.json`, "spectrum-checkbox-catalog-report.v0", await canonicalFileHash(path.join(cwd, out, "spectrum-checkbox-catalog-report.json")), CHECKBOX_SOURCE_REF);

  const evidence = await buildEvidence(cwd, common, reportRef);
  evidence.artifactRefs[evidence.artifactRefs.length - 1].hash = computeEvidenceSelfHash(evidence);
  assertSchema(validators, "spectrum-checkbox-catalog-evidence.v0", evidence, `${out}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, out, "evidence.json"), evidence);
  await assertEvidenceMutationFixtureCausal(cwd, evidence);
  const persisted = await readJson(path.join(cwd, out, "evidence.json"));
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persisted);
  if (integrityCode !== null) throw contractError(`spectrum Checkbox catalog evidence integrity verification failed: ${integrityCode}`, 1);
  await assertExactArtifactClosure(cwd);

  return {
    status: "pass",
    promotionStatus: "review_required",
    matchedCount: validationResults.length,
    totalCount: validationResults.length,
    addedComponentIds: ["Checkbox"],
    artifacts: SCC_ARTIFACT_PATHS
  };
}

function buildCommonProofRecord({ context, sourceInventoryRef, sourceMappingRef, expandedCatalogRef, sourceMapping, expandedCatalog, validationResults, basePreservation, args }) {
  const diagnosticCodes = [...new Set(validationResults.flatMap((row) => row.actualDiagnosticCodes))].sort();
  const diagnostics = diagnosticCodes.map((code) => deepClone(DIAGNOSTIC_BY_CODE.get(code)));
  const boundaryRefs = [context.p2EvidenceRef, context.p2CatalogRef];
  return {
    contractId: SCC_CONTRACT_ID,
    version: SCC_VERSION,
    runId: buildRunId(context.manifest, context.expectations, args, boundaryRefs),
    checkedAt: SCC_TIMESTAMP,
    command: SCC_COMMAND,
    args,
    environment: SCC_ENVIRONMENT,
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
      baseComponentCount: Object.keys(context.p2Catalog.components).length,
      expandedComponentCount: Object.keys(expandedCatalog.components).length,
      basePreservedCount: basePreservation.length,
      addedComponentCount: 1,
      addedTokenCount: 1,
      reviewRequiredMappingCount: Object.keys(sourceMapping.reviewRequired).length
    },
    catalogExpansion: {
      baseCatalogId: context.p2Catalog.catalogId,
      expandedCatalogId: expandedCatalog.catalogId,
      catalogIdChanged: context.p2Catalog.catalogId !== expandedCatalog.catalogId,
      baseCatalogHash: context.p2CatalogRef.hash,
      expandedCatalogHash: expandedCatalogRef.hash,
      basePreservation,
      addedComponentIds: ["Checkbox"],
      addedTokenIds: ["checkbox-control-size-medium-desktop"],
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
    ...sccSchemaPaths(),
    ...sccFixturePaths(),
    ...sccSourcePaths(),
    ...SCC_IMPLEMENTATION_FILES,
    SCC_P2_EVIDENCE_PATH,
    SCC_P2_CATALOG_PATH,
    SCC_P2_REGISTRY_PATH,
    SCC_P2_TOKEN_PATH
  ];
  for (const relative of requiredFiles) await assertRegularFile(cwd, relative);
  await assertExactFixtureClosure(cwd);
  await assertExactTargetSchemaClosure(cwd);
  for (const relative of [
    ...SCC_SCHEMA_FILES.map((file) => `${SCC_SCHEMA_ROOT}/${file}`),
    ...sccFixturePaths(),
    SCC_MANIFEST_PATH,
    ...SCC_MAPPING_PATHS
  ]) await assertCanonicalJsonFile(cwd, relative);
}

async function assertRegularFile(cwd, relative) {
  await assertSafeAncestorDirectories(cwd, relative);
  let stat;
  try {
    stat = await fs.lstat(path.join(cwd, relative));
  } catch {
    throw contractError(`missing required spectrum Checkbox catalog input: ${relative}`, 1);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    throw contractError(`spectrum Checkbox catalog input is not an independent regular file: ${relative}`, 1);
  }
}

async function assertSafeAncestorDirectories(cwd, relative) {
  const segments = relative.split("/");
  const workspace = path.resolve(cwd);
  const resolved = path.resolve(cwd, ...segments);
  if (!resolved.startsWith(`${workspace}${path.sep}`)) throw contractError(`unsafe spectrum Checkbox catalog path: ${relative}`, 1);
  const workspaceStat = await fs.lstat(cwd);
  if (!workspaceStat.isDirectory() || workspaceStat.isSymbolicLink()) throw contractError("spectrum Checkbox catalog workspace root is unsafe", 1);
  let current = cwd;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch {
      throw contractError(`missing required spectrum Checkbox catalog input ancestor: ${relative}`, 1);
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError(`unsafe spectrum Checkbox catalog input ancestor: ${relative}`, 1);
  }
}

async function assertSafeOutputDirectoryChain(cwd, relative) {
  const segments = relative.split("/");
  const workspace = path.resolve(cwd);
  const resolved = path.resolve(cwd, ...segments);
  if (!resolved.startsWith(`${workspace}${path.sep}`)) throw contractError("spectrum Checkbox catalog output root is unsafe", 1);
  const workspaceStat = await fs.lstat(cwd);
  if (!workspaceStat.isDirectory() || workspaceStat.isSymbolicLink()) throw contractError("spectrum Checkbox catalog workspace root is unsafe", 1);
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
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError("spectrum Checkbox catalog output root is unsafe", 1);
  }
}

async function assertCanonicalJsonFile(cwd, relative) {
  const raw = await fs.readFile(path.join(cwd, relative), "utf8");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw contractError(`spectrum Checkbox catalog JSON is invalid: ${relative}`, 1);
  }
  if (raw !== canonicalJson(value)) throw contractError(`spectrum Checkbox catalog JSON is not JCS canonical: ${relative}`, 1);
}

async function assertExactFixtureClosure(cwd) {
  const expected = sccFixturePaths().map((relative) => path.posix.relative(SCC_FIXTURE_ROOT, relative)).sort();
  const actual = await collectTree(path.join(cwd, SCC_FIXTURE_ROOT));
  if (canonicalJson(actual) !== canonicalJson(expected)) throw contractError("spectrum Checkbox catalog fixture tree closure drift", 1);
}

async function assertExactTargetSchemaClosure(cwd) {
  const entries = await fs.readdir(path.join(cwd, SCC_SCHEMA_ROOT), { withFileTypes: true });
  const actual = entries
    .filter((entry) => entry.name.startsWith("spectrum-checkbox-") || entry.name === "spectrum-source-addendum-lock.v0.schema.json")
    .map((entry) => entry.isFile() ? entry.name : `${entry.name}!`)
    .sort();
  if (canonicalJson(actual) !== canonicalJson([...SCC_SCHEMA_FILES].sort())) throw contractError("spectrum Checkbox catalog target schema closure drift", 1);
}

async function assertNoStaleOutput(cwd) {
  await assertSafeOutputDirectoryChain(cwd, SCC_ARTIFACT_ROOT);
  const root = path.join(cwd, SCC_ARTIFACT_ROOT);
  try {
    const stat = await fs.lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw contractError("spectrum Checkbox catalog output root is unsafe", 1);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    if (error?.exitCode) throw error;
    throw error;
  }
  const actual = await collectTree(root);
  const allowed = [...SCC_GENERATED_ARTIFACTS].sort();
  if (actual.some((relative) => !allowed.includes(relative))) throw contractError("spectrum Checkbox catalog output contains stale or undeclared artifacts", 1);
  for (const relative of actual) await fs.unlink(path.join(root, relative));
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true, validateFormats: false });
  const idBySchemaId = new Map();
  for (const relative of sccSchemaPaths()) {
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
  const p2Evidence = await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, SCC_P2_EVIDENCE_PATH);
  if (p2Evidence.status !== "pass") throw contractError("Accepted P2 evidence is not passing.", 1);
  const p2IntegrityCode = await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence);
  if (p2IntegrityCode !== null) throw contractError(`Accepted P2 evidence is not intact: ${p2IntegrityCode}`, 1);
  const p2Catalog = await readJson(path.join(cwd, SCC_P2_CATALOG_PATH));
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, SCC_P2_CATALOG_PATH);
  const p2CatalogHash = await canonicalFileHash(path.join(cwd, SCC_P2_CATALOG_PATH));
  const p2CatalogEvidenceRef = p2Evidence.artifactRefs.find((ref) => ref.path === SCC_P2_CATALOG_PATH);
  if (!p2CatalogEvidenceRef || p2CatalogEvidenceRef.hash !== p2CatalogHash) {
    throw contractError("Accepted P2 evidence or catalog bytes do not match the evidence closure.", 1);
  }

  await assertImmutableSpectrumCheckboxSource(cwd);
  const lock = await readJson(path.join(cwd, SCC_LOCK_PATH));
  const manifest = await readJson(path.join(cwd, SCC_MANIFEST_PATH));
  const componentMap = await readJson(path.join(cwd, SCC_MAPPING_PATHS[0]));
  const policyMap = await readJson(path.join(cwd, SCC_MAPPING_PATHS[1]));
  const checkbox = await readJson(path.join(cwd, SCC_COMPONENT_PATH));
  const registry = await readJson(path.join(cwd, SCC_P2_REGISTRY_PATH));
  const tokens = await readJson(path.join(cwd, SCC_P2_TOKEN_PATH));
  const expectations = await readJson(path.join(cwd, `${SCC_FIXTURE_ROOT}/expectations.manifest.json`));

  assertSchema(validators, "spectrum-source-addendum-lock.v0", lock, SCC_LOCK_PATH);
  assertSchema(validators, "spectrum-checkbox-source-manifest.v0", manifest, SCC_MANIFEST_PATH);
  assertSchema(validators, "spectrum-checkbox-source-mapping.v0", componentMap, SCC_MAPPING_PATHS[0]);
  assertSchema(validators, "spectrum-checkbox-source-mapping.v0", policyMap, SCC_MAPPING_PATHS[1]);
  const expectedMappings = buildExpectedSpectrumCheckboxSourceMappings();
  if (canonicalJson(componentMap) !== canonicalJson(expectedMappings["component-map.json"]) || canonicalJson(policyMap) !== canonicalJson(expectedMappings["policy-map.json"])) throw contractError("A Checkbox mapping file does not match the declared mapping contract.", 1);
  assertSchema(validators, "spectrum-checkbox-catalog-expectations.v0", expectations, `${SCC_FIXTURE_ROOT}/expectations.manifest.json`);
  const expectedManifest = await buildExpectedSpectrumCheckboxSourceManifest(cwd);
  if (canonicalJson(manifest) !== canonicalJson(expectedManifest)) throw contractError("The Checkbox source byte or source manifest hash does not match its checked boundary.", 1);
  await assertManifestHashes(cwd, manifest, p2CatalogHash);
  assertExactSourceFacts(checkbox, registry, tokens, componentMap);
  assertExpectationManifest(expectations);

  const p2EvidenceRef = artifactRef(SCC_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2Internals.computeEvidenceSelfHash(p2Evidence));
  const p2CatalogRef = artifactRef(SCC_P2_CATALOG_PATH, "runtime-catalog.v0", p2CatalogHash);
  const manifestRef = artifactRef(SCC_MANIFEST_PATH, "spectrum-checkbox-source-manifest.v0", await canonicalFileHash(path.join(cwd, SCC_MANIFEST_PATH)), CHECKBOX_SOURCE_REF);
  const context = { p2Evidence, p2Catalog, p2EvidenceRef, p2CatalogRef, lock, manifest, manifestRef, componentMap, policyMap, checkbox, registry, tokens, expectations, assertFixtureSchema: (schemaId, value, artifactPath) => assertSchema(validators, schemaId, value, artifactPath) };
  assertManifestRefsResolve(context);
  return context;
}

async function assertManifestHashes(cwd, manifest, p2CatalogHash) {
  const expected = [
    [manifest.baseP2Boundary.evidenceRef.hash, p2Internals.computeEvidenceSelfHash(await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH))), "Accepted P2 evidence or catalog bytes do not match the evidence closure."],
    [manifest.baseP2Boundary.catalogRef.hash, p2CatalogHash, "Accepted P2 evidence or catalog bytes do not match the evidence closure."],
    [manifest.sourceAddendumLock.sha256, await rawFileHash(path.join(cwd, SCC_LOCK_PATH)), "The Checkbox source addendum does not match its immutable review-time lock."],
    [manifest.sourceFiles[0].sha256, await rawFileHash(path.join(cwd, SCC_COMPONENT_PATH)), "The Checkbox source byte or source manifest hash does not match its checked boundary."],
    [manifest.reusedP2SourceFiles[0].sha256, await rawFileHash(path.join(cwd, manifest.reusedP2SourceFiles[0].path)), "Accepted P2 evidence or catalog bytes do not match the evidence closure."],
    [manifest.reusedP2SourceFiles[1].sha256, await rawFileHash(path.join(cwd, manifest.reusedP2SourceFiles[1].path)), "Accepted P2 evidence or catalog bytes do not match the evidence closure."]
  ];
  for (const [actual, wanted, message] of expected) if (actual !== wanted) throw contractError(message, 1);
  for (const mapping of manifest.requiredMappings) {
    const relative = `${SCC_SOURCE_ROOT}/${mapping.path}`;
    if (mapping.sha256 !== await canonicalFileHash(path.join(cwd, relative))) throw contractError("A Checkbox mapping file does not match the source manifest.", 1);
  }
}

function assertExactSourceFacts(checkbox, registry, tokens, componentMap) {
  const optionIds = Object.keys(checkbox.options || {}).sort();
  const expectedOptionIds = ["isDisabled", "isEmphasized", "isError", "isIndeterminate", "isSelected", "label", "size"];
  if (checkbox.name !== "checkbox" || canonicalJson(optionIds) !== canonicalJson(expectedOptionIds)) throw contractError("The requested component or property is outside the declared Checkbox source mapping.", 1);
  const expectedOptionShape = {
    label: { type: "string", default: undefined },
    isSelected: { type: "boolean", default: false },
    isIndeterminate: { type: "boolean", default: false },
    size: { type: "string", default: "m" },
    isEmphasized: { type: "boolean", default: false },
    isDisabled: { type: "boolean", default: false },
    isError: { type: "boolean", default: false }
  };
  for (const [id, expected] of Object.entries(expectedOptionShape)) {
    if (checkbox.options[id]?.type !== expected.type || checkbox.options[id]?.default !== expected.default) throw contractError("The requested component or property is outside the declared Checkbox source mapping.", 1);
  }
  const indeterminateDescription = "When a checkbox is indeterminate, it overrides the selection state.";
  if (
    checkbox.options.isIndeterminate.description !== indeterminateDescription ||
    componentMap.mappingRows?.["checkbox-selection-precedence"]?.sourceValue !== "overrides the selection state"
  ) throw contractError("The Checkbox selection precedence is not causally bound to its declared source description.", 1);
  if (canonicalJson(checkbox.options.size.values?.map((row) => row.value)) !== canonicalJson(["s", "m", "l", "xl"])) throw contractError("The requested component or property is outside the declared Checkbox source mapping.", 1);
  if (canonicalJson(checkbox.states?.map((row) => row.name)) !== canonicalJson(["hover", "down", "keyboard-focus"])) throw contractError("The keyboard-focus state must use the one declared keyboardFocus normalization.", 1);
  if (checkbox.accessibility?.role !== "checkbox" || canonicalJson(checkbox.accessibility.intents) !== canonicalJson(["choose"]) || checkbox.accessibility.focusable !== true || canonicalJson(checkbox.accessibility.keyboardIntents) !== canonicalJson(["activate"]) || checkbox.accessibility.wcag?.length !== 3) throw contractError("The requested component or property is outside the declared Checkbox source mapping.", 1);
  if (checkbox.documentBlocks?.length !== 18 || checkbox.documentBlocks[0]?.type !== "purpose" || checkbox.documentBlocks.slice(1).some((row) => row.type !== "guideline")) throw contractError("The requested component or property is outside the declared Checkbox source mapping.", 1);
  if (checkbox.tokenBindings?.length !== 60 || checkbox.tokenBindings[1]?.token !== "checkbox-control-size-medium") throw contractError("The Checkbox token binding requires an explicit declared scale mapping.", 1);
  if (registry.values?.[13]?.id !== "checkbox" || registry.values[13].label !== "Checkbox") throw contractError("The requested component or property is outside the declared Checkbox source mapping.", 1);
  const token = tokens[320];
  if (token?.name?.component !== "checkbox" || token.name.property !== "control-size-medium" || token.name.scale !== "desktop" || token.value !== "16px") throw contractError("The Checkbox token binding requires an explicit declared scale mapping.", 1);
}

function assertExpectationManifest(expectations) {
  const projection = expectations.expectations.map(({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }) => ({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }));
  const expected = SCC_EXPECTATION_ROWS.map(({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }) => ({ fixturePath, kind, expectedResult, promotionStatus, diagnosticCodes }));
  if (canonicalJson(projection) !== canonicalJson(expected)) throw contractError("spectrum Checkbox catalog expectations manifest drift", 1);
  if (canonicalJson(expectations.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry())) throw contractError("spectrum Checkbox catalog diagnostics registry drift", 1);
  if (canonicalJson(expectations) !== canonicalJson(SCC_FIXTURES["expectations.manifest.json"])) throw contractError("spectrum Checkbox catalog expectations manifest drift", 1);
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
    if (resolveSourceRef(context, sourceRef) === undefined) throw contractError(`unresolved Checkbox source reference: ${sourceRef}`, 1);
  }
  for (const row of Object.values(context.componentMap.mappingRows)) {
    if (row.authorityScope !== "mapping-narrows-source" || row.reviewStatus !== "accepted") throw contractError("A Checkbox mapping would broaden source authority.", 1);
    for (const mappingRef of row.mappingRefs) assertMappingRef(context, mappingRef);
    for (const targetRef of row.targetRefs) assertDeclaredTargetRef(targetRef);
  }
  for (const row of Object.values(context.policyMap.reviewRequired)) {
    if (row.promotionStatus !== "review_required" || row.executable !== false) throw contractError("Checkbox source intent requires owner review and remains non-executable.", 1);
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
  if (packagePath === "components/checkbox.json") root = context.checkbox;
  else if (packagePath === "registry/components.json") root = context.registry;
  else if (packagePath === "tokens/layout-component.tokens.json") root = context.tokens;
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
  const prefix = "mapping://spectrum-checkbox-catalog/";
  if (!mappingRef.startsWith(prefix)) throw contractError(`unresolved Checkbox mapping reference: ${mappingRef}`, 1);
  const [file, fragment = ""] = mappingRef.slice(prefix.length).split("#");
  const root = file === "component-map.json" ? context.componentMap : file === "policy-map.json" ? context.policyMap : undefined;
  if (!root || resolveJsonPointer(root, fragment) === undefined) throw contractError(`unresolved Checkbox mapping reference: ${mappingRef}`, 1);
}

function assertDeclaredTargetRef(targetRef) {
  const allowed = /^catalog:\/\/spectrum-checkbox-catalog\/(?:components\/Checkbox(?:\/(?:props|states|examples|accessibility)\/[A-Za-z0-9_-]+|\/accessibility)?|tokens\/checkbox-control-size-medium-desktop|governance\/rules\/checkboxSelectionPrecedence)$/;
  if (!allowed.test(targetRef)) throw contractError(`undeclared Checkbox mapping target: ${targetRef}`, 1);
}

async function buildSourceInventory(cwd, context) {
  return {
    schemaId: "spectrum-checkbox-source-inventory.v0",
    version: SCC_VERSION,
    sourceManifestRef: context.manifestRef,
    upstreamBoundaryRefs: [context.p2EvidenceRef, context.p2CatalogRef],
    sourceFiles: [
      artifactRef(SCC_LOCK_PATH, "spectrum-source-addendum-lock.v0", await rawFileHash(path.join(cwd, SCC_LOCK_PATH)), CHECKBOX_SOURCE_REF),
      artifactRef(SCC_COMPONENT_PATH, "raw-source", await rawFileHash(path.join(cwd, SCC_COMPONENT_PATH)), CHECKBOX_SOURCE_REF)
    ],
    reusedSourceFiles: [
      artifactRef(SCC_P2_REGISTRY_PATH, "raw-source", await rawFileHash(path.join(cwd, SCC_P2_REGISTRY_PATH)), REGISTRY_SOURCE_REF),
      artifactRef(SCC_P2_TOKEN_PATH, "raw-source", await rawFileHash(path.join(cwd, SCC_P2_TOKEN_PATH)), TOKEN_SOURCE_REF)
    ],
    coverage: {
      componentIds: ["Checkbox"],
      propIds: ["isDisabled", "isEmphasized", "isError", "isIndeterminate", "isSelected", "label", "size"],
      stateIds: ["down", "hover", "keyboardFocus"],
      accessibilityFactCount: 5,
      exampleCount: 1,
      mappedTokenIds: ["checkbox-control-size-medium-desktop"],
      outOfScopeTokenBindingCount: 59,
      guidanceBlockCount: 17
    },
    provenance: provenance("interfacectl-spectrum-checkbox-source-inventory", [SCC_MANIFEST_PATH, CHECKBOX_SOURCE_REF, REGISTRY_SOURCE_REF, TOKEN_SOURCE_REF])
  };
}

async function buildCombinedSourceMapping(cwd, context) {
  return {
    schemaId: "spectrum-checkbox-source-mapping.v0",
    version: SCC_VERSION,
    mappingSetId: "spectrum-checkbox-combined-source-mapping",
    sourceManifestRef: artifactRef(SCC_MANIFEST_PATH, "spectrum-checkbox-source-manifest.v0", await canonicalFileHash(path.join(cwd, SCC_MANIFEST_PATH)), CHECKBOX_SOURCE_REF),
    mappingRows: deepClone(context.componentMap.mappingRows),
    reviewRequired: deepClone(context.policyMap.reviewRequired),
    provenance: provenance("interfacectl-spectrum-checkbox-source-mapping", [SCC_MAPPING_PATHS[0], SCC_MAPPING_PATHS[1], CHECKBOX_SOURCE_REF])
  };
}

function assertMappingClosure(context, sourceMapping) {
  const expectedMappingIds = [
    "checkbox-accessibility",
    "checkbox-component",
    "checkbox-control-size-medium-desktop",
    "checkbox-prop-is-disabled",
    "checkbox-prop-is-emphasized",
    "checkbox-prop-is-error",
    "checkbox-prop-is-indeterminate",
    "checkbox-prop-is-selected",
    "checkbox-prop-label",
    "checkbox-prop-size",
    "checkbox-purpose-example",
    "checkbox-selection-precedence",
    "checkbox-state-down",
    "checkbox-state-hover",
    "checkbox-state-keyboard-focus"
  ];
  if (canonicalJson(Object.keys(sourceMapping.mappingRows).sort()) !== canonicalJson(expectedMappingIds)) throw contractError("Checkbox mapping closure drift", 1);
  if (canonicalJson(Object.keys(sourceMapping.reviewRequired).sort()) !== canonicalJson(["checkbox-activation-intent-review", "checkbox-standalone-label-review"])) throw contractError("Checkbox review mapping closure drift", 1);
  assertManifestRefsResolve({ ...context, componentMap: { ...context.componentMap, mappingRows: sourceMapping.mappingRows }, policyMap: { ...context.policyMap, reviewRequired: sourceMapping.reviewRequired } });
}

function assertMappingTargetsResolve(sourceMapping, catalog) {
  const prefix = "catalog://spectrum-checkbox-catalog/";
  for (const row of Object.values(sourceMapping.mappingRows)) {
    for (const targetRef of row.targetRefs) {
      if (!targetRef.startsWith(prefix)) throw contractError(`undeclared Checkbox mapping target: ${targetRef}`, 1);
      const pointer = `/${targetRef.slice(prefix.length).split("/").map(escapeJsonPointer).join("/")}`;
      if (resolveJsonPointer(catalog, pointer) === undefined) throw contractError(`unresolved Checkbox mapping target: ${targetRef}`, 1);
    }
  }
}

function escapeJsonPointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function buildExpandedCatalog(context) {
  const catalog = deepClone(context.p2Catalog);
  const allowedProps = ["isDisabled", "isEmphasized", "isError", "isIndeterminate", "isSelected", "label", "size"];
  const prop = (id, type, defaultValue, allowedValues = [], tokenRefs = []) => ({
    id,
    type,
    required: false,
    default: defaultValue,
    allowedValues,
    tokenRefs,
    sourceRef: `${CHECKBOX_SOURCE_REF}/options/${id}`,
    diagnostics: [],
    minLength: null,
    maxLength: null,
    allowMarkup: false
  });
  const state = (id, sourceIndex) => ({
    id,
    allowedProps,
    accessibilityExpectations: {},
    sourceRef: `${CHECKBOX_SOURCE_REF}/states/${sourceIndex}`
  });
  catalog.catalogId = "surfaces-spectrum-checkbox-catalog-governed";
  catalog.sourceRefs = {
    ...catalog.sourceRefs,
    checkbox: CHECKBOX_SOURCE_REF,
    checkboxRegistry: REGISTRY_SOURCE_REF,
    checkboxToken: TOKEN_SOURCE_REF,
    spectrumCheckboxCatalogManifest: SCC_MANIFEST_PATH
  };
  catalog.tokens["checkbox-control-size-medium-desktop"] = {
    type: "dimension",
    value: "16px",
    sourceRef: TOKEN_SOURCE_REF
  };
  catalog.components.Checkbox = {
    sourceRef: CHECKBOX_SOURCE_REF,
    props: {
      isDisabled: prop("isDisabled", "boolean", false),
      isEmphasized: prop("isEmphasized", "boolean", false),
      isError: prop("isError", "boolean", false),
      isIndeterminate: prop("isIndeterminate", "boolean", false),
      isSelected: prop("isSelected", "boolean", false),
      label: prop("label", "string", null),
      size: prop("size", "string", "m", ["s", "m", "l", "xl"], ["checkbox-control-size-medium-desktop"])
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
    tokenRefs: { "checkbox-control-size-medium-desktop": "checkbox-control-size-medium-desktop" },
    accessibility: {
      role: "checkbox",
      intents: ["choose"],
      focusable: true,
      keyboardIntents: ["activate"],
      wcag: deepClone(context.checkbox.accessibility.wcag),
      runtimeAccessibilityCompliance: "not-proven",
      sourceRef: `${CHECKBOX_SOURCE_REF}/accessibility`
    },
    examples: [{
      id: "purpose",
      content: context.checkbox.documentBlocks[0].content,
      sourceRef: `${CHECKBOX_SOURCE_REF}/documentBlocks/0`
    }]
  };
  catalog.governance = {
    rules: {
      ...catalog.governance.rules,
      spectrumCheckboxSourceReview: {
        promotionStatus: "review_required",
        executable: false,
        sourceRef: "mapping://spectrum-checkbox-catalog/policy-map.json#/reviewRequired"
      },
      checkboxSelectionPrecedence: {
        when: "isIndeterminate=true",
        precedence: "indeterminate-over-selected",
        executable: false,
        sourceRef: `${CHECKBOX_SOURCE_REF}/options/isIndeterminate`
      }
    },
    results: {
      ...catalog.governance.results,
      spectrumCheckboxCatalog: {
        acceptedMappingCount: 15,
        reviewRequiredMappings: ["checkbox-activation-intent-review", "checkbox-standalone-label-review"]
      }
    },
    promotionStatus: "review_required"
  };
  catalog.provenance = {
    ...catalog.provenance,
    spectrumCheckboxCatalog: {
      generatedAt: SCC_TIMESTAMP,
      generator: "interfacectl-spectrum-checkbox-catalog",
      baseCatalogHash: sha256Hex(canonicalJson(context.p2Catalog)),
      sourceManifestHash: sha256Hex(canonicalJson(context.manifest))
    }
  };
  return catalog;
}

function buildBasePreservation(baseCatalog, expandedCatalog) {
  return BASE_PRESERVATION_POINTERS.map((pointer) => {
    const baseValue = resolveJsonPointer(baseCatalog, pointer);
    const expandedValue = resolveJsonPointer(expandedCatalog, pointer);
    const baseHash = sha256Hex(canonicalJson(baseValue));
    const expandedHash = sha256Hex(canonicalJson(expandedValue));
    return { pointer, baseHash, expandedHash, matched: baseHash === expandedHash };
  });
}

function assertBaseCatalogPreserved(baseCatalog, expandedCatalog, basePreservation) {
  if (basePreservation.some((row) => !row.matched)) throw contractError("Accepted P2 catalog content changed while adding Checkbox authority.", 1);
  if (baseCatalog.catalogId !== "surfaces-p2-governed-spectrum" || expandedCatalog.catalogId !== "surfaces-spectrum-checkbox-catalog-governed" || baseCatalog.catalogId === expandedCatalog.catalogId) throw contractError("Checkbox catalog identity delta drift", 1);
  const baseComponents = Object.keys(baseCatalog.components).sort();
  const expandedComponents = Object.keys(expandedCatalog.components).sort();
  if (canonicalJson(baseComponents) !== canonicalJson(["Button", "InLineAlert"]) || canonicalJson(expandedComponents) !== canonicalJson(["Button", "Checkbox", "InLineAlert"])) throw contractError("Checkbox catalog component closure drift", 1);
  const addedTokens = Object.keys(expandedCatalog.tokens).filter((id) => !Object.hasOwn(baseCatalog.tokens, id)).sort();
  if (canonicalJson(addedTokens) !== canonicalJson(["checkbox-control-size-medium-desktop"])) throw contractError("Checkbox catalog token closure drift", 1);
  for (const [key, value] of Object.entries(baseCatalog.sourceRefs)) if (canonicalJson(expandedCatalog.sourceRefs[key]) !== canonicalJson(value)) throw contractError("Accepted P2 source reference changed while adding Checkbox authority.", 1);
  if (canonicalJson(Object.keys(expandedCatalog.sourceRefs).filter((key) => !Object.hasOwn(baseCatalog.sourceRefs, key)).sort()) !== canonicalJson(["checkbox", "checkboxRegistry", "checkboxToken", "spectrumCheckboxCatalogManifest"])) throw contractError("Checkbox catalog source-reference delta drift", 1);
  for (const [key, value] of Object.entries(baseCatalog.governance.rules)) if (canonicalJson(expandedCatalog.governance.rules[key]) !== canonicalJson(value)) throw contractError("Accepted P2 governance rule changed while adding Checkbox authority.", 1);
  for (const [key, value] of Object.entries(baseCatalog.governance.results)) if (canonicalJson(expandedCatalog.governance.results[key]) !== canonicalJson(value)) throw contractError("Accepted P2 governance result changed while adding Checkbox authority.", 1);
  if (canonicalJson(Object.keys(expandedCatalog.governance.rules).filter((key) => !Object.hasOwn(baseCatalog.governance.rules, key)).sort()) !== canonicalJson(["checkboxSelectionPrecedence", "spectrumCheckboxSourceReview"])) throw contractError("Checkbox catalog governance-rule delta drift", 1);
  if (canonicalJson(Object.keys(expandedCatalog.governance.results).filter((key) => !Object.hasOwn(baseCatalog.governance.results, key)).sort()) !== canonicalJson(["spectrumCheckboxCatalog"])) throw contractError("Checkbox catalog governance-result delta drift", 1);
  for (const [key, value] of Object.entries(baseCatalog.provenance)) if (canonicalJson(expandedCatalog.provenance[key]) !== canonicalJson(value)) throw contractError("Accepted P2 provenance changed while adding Checkbox authority.", 1);
  if (canonicalJson(Object.keys(expandedCatalog.provenance).filter((key) => !Object.hasOwn(baseCatalog.provenance, key)).sort()) !== canonicalJson(["spectrumCheckboxCatalog"])) throw contractError("Checkbox catalog provenance delta drift", 1);
}

async function evaluateExpectations(cwd, expectations, context) {
  assertPositiveOutput(context);
  const results = [];
  for (const expected of expectations.expectations) {
    const fixtureValue = await readJson(path.join(cwd, expected.fixturePath));
    const fixtureSchemaId = expected.kind === "mutation" ? "spectrum-checkbox-catalog-preflight-mutation.v0" : "spectrum-checkbox-catalog-fixture.v0";
    context.assertFixtureSchema(fixtureSchemaId, fixtureValue, expected.fixturePath);
    const fixtureRelative = path.posix.relative(SCC_FIXTURE_ROOT, expected.fixturePath);
    if (canonicalJson(fixtureValue) !== canonicalJson(SCC_FIXTURES[fixtureRelative])) throw contractError(`spectrum Checkbox catalog fixture content drift: ${expected.fixturePath}`, 1);
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
  if (fixture.componentId !== "Checkbox") return invalid("SPECTRUM_CHECKBOX_MAPPING_UNSUPPORTED");
  if (fixture.sourceRef === null) return invalid("SPECTRUM_CHECKBOX_SOURCE_REF_MISSING");
  if (fixture.sourceRef !== CHECKBOX_SOURCE_REF) return invalid("SPECTRUM_CHECKBOX_SOURCE_REF_UNDECLARED");
  if (["action", "event", "slot", "data-binding", "variant", "prop", "token"].includes(fixture.requestedAddition)) return invalid("SPECTRUM_CHECKBOX_MAPPING_AUTHORITY_ESCALATION");
  if (fixture.requestedAddition === "executable-policy" || fixture.policyText !== null) return invalid("SPECTRUM_CHECKBOX_POLICY_PROSE_FORBIDDEN");
  if (fixture.stateMapping?.source !== "keyboard-focus" || fixture.stateMapping.target !== "keyboardFocus") return invalid("SPECTRUM_CHECKBOX_STATE_MAPPING_INVALID");
  if (fixture.selection?.isIndeterminate && fixture.selection.precedence !== "indeterminate-over-selected") return invalid("SPECTRUM_CHECKBOX_SELECTION_PRECEDENCE_MISSING");
  if (fixture.reviewScenario !== null && fixture.promotionRequest === "allowed") return invalid("SPECTRUM_CHECKBOX_REVIEW_PROMOTION_FORBIDDEN");
  if (fixture.tokenMode !== "desktop") return review("SPECTRUM_CHECKBOX_TOKEN_MODE_AMBIGUOUS");
  if (fixture.reviewScenario === "activation-intent") return review("SPECTRUM_CHECKBOX_ACTIVATION_REVIEW_REQUIRED");
  if (fixture.reviewScenario !== null) return review("SPECTRUM_CHECKBOX_REVIEW_REQUIRED");
  return { result: "valid", promotionStatus: "allowed", diagnosticCodes: [] };
}

function assertPositiveOutput(context) {
  const checkbox = context.expandedCatalog?.components?.Checkbox;
  const precedence = context.expandedCatalog?.governance?.rules?.checkboxSelectionPrecedence;
  const reviews = context.sourceMapping?.reviewRequired;
  if (!checkbox || Object.keys(checkbox.props).length !== 7 || Object.keys(checkbox.states).length !== 3) throw contractError("Checkbox valid fixtures do not resolve to the governed catalog.", 1);
  if (checkbox.actions && Object.keys(checkbox.actions).length > 0) throw contractError("Checkbox catalog invented executable action authority.", 1);
  if (context.expandedCatalog.tokens?.["checkbox-control-size-medium-desktop"]?.value !== "16px") throw contractError("Checkbox desktop token mapping is absent from the governed catalog.", 1);
  if (precedence?.precedence !== "indeterminate-over-selected" || precedence?.executable !== false || precedence?.sourceRef !== `${CHECKBOX_SOURCE_REF}/options/isIndeterminate`) throw contractError("Checkbox selection precedence is absent from governed catalog authority.", 1);
  for (const id of ["checkbox-activation-intent-review", "checkbox-standalone-label-review"]) {
    if (reviews?.[id]?.promotionStatus !== "review_required" || reviews[id].executable !== false || !reviews[id].reviewOwner) throw contractError("Checkbox review fixture lacks an owner-bound non-executable mapping.", 1);
  }
}

function invalid(code) {
  return { result: "invalid", promotionStatus: "blocked", diagnosticCodes: [code] };
}

function review(code) {
  return { result: "review_required", promotionStatus: "review_required", diagnosticCodes: [code] };
}

async function evaluateMutationFixture(cwd, fixture, context) {
  if (fixture.mutationId === "evidence-hash-mismatch") return invalid("SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH");
  const code = await withInputMutationWorkspace(cwd, async (mutationCwd) => {
    const target = path.join(mutationCwd, fixture.targetPath);
    if (fixture.mutationId === "missing-p2-evidence") {
      await fs.unlink(target);
    } else if (fixture.mutationId === "nonpass-p2-evidence") {
      const value = await readJson(target);
      value.status = "fail";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "upstream-hash-mismatch") {
      const value = await readJson(target);
      value.catalogId = `${value.catalogId}-mutated`;
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "source-byte-hash-mismatch") {
      const value = await readJson(target);
      value.description = `${value.description} Mutated.`;
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
      value.mappingRows["checkbox-component"].normalizedId = "CheckboxMutated";
      await writeCanonicalJson(target, value);
    } else if (fixture.mutationId === "schema-hash-mismatch") {
      const value = await readJson(target);
      value.title = "mutated-spectrum-checkbox-catalog-fixture";
      await writeCanonicalJson(target, value);
    } else {
      throw contractError(`unknown spectrum Checkbox mutation: ${fixture.mutationId}`, 1);
    }
    return firstInputIntegrityFailureCode(mutationCwd);
  });
  if (!code) throw contractError(`mutation fixture did not fail through its production inspector: ${fixture.mutationId}`, 1);
  return invalid(code);
}

function flippedHash(hash) {
  return `${hash[0] === "0" ? "1" : "0"}${hash.slice(1)}`;
}

async function firstInputIntegrityFailureCode(cwd) {
  let p2Evidence;
  try {
    p2Evidence = await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH));
  } catch {
    return "SPECTRUM_CHECKBOX_UPSTREAM_EVIDENCE_MISSING";
  }
  if (p2Evidence.status !== "pass") return "SPECTRUM_CHECKBOX_UPSTREAM_EVIDENCE_NONPASS";
  try {
    if (await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence) !== null) return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";
    const catalogRef = p2Evidence.artifactRefs.find((ref) => ref.path === SCC_P2_CATALOG_PATH);
    if (!catalogRef || catalogRef.hash !== await canonicalFileHash(path.join(cwd, SCC_P2_CATALOG_PATH))) return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";
  } catch {
    return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";
  }

  try {
    await assertImmutableSpectrumCheckboxSource(cwd);
  } catch (error) {
    if (error?.message === "The Checkbox source addendum does not match its immutable review-time lock.") return "SPECTRUM_CHECKBOX_SOURCE_LOCK_MISMATCH";
    if (error?.message === "The Checkbox source addendum contains an undeclared or unsafe package path.") return "SPECTRUM_CHECKBOX_SOURCE_PATH_UNDECLARED";
    return "SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH";
  }

  for (const [file, expected] of Object.entries(SCC_SCHEMAS)) {
    try {
      const actual = await readJson(path.join(cwd, SCC_SCHEMA_ROOT, file));
      if (canonicalJson(actual) !== canonicalJson(expected)) return "SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH";
    } catch {
      return "SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH";
    }
  }

  let manifest;
  let expectedManifest;
  try {
    manifest = await readJson(path.join(cwd, SCC_MANIFEST_PATH));
    expectedManifest = await buildExpectedSpectrumCheckboxSourceManifest(cwd);
  } catch {
    return "SPECTRUM_CHECKBOX_MANIFEST_HASH_MISMATCH";
  }
  if (canonicalJson(manifest.sourceAddendumLock) !== canonicalJson(expectedManifest.sourceAddendumLock)) return "SPECTRUM_CHECKBOX_SOURCE_LOCK_MISMATCH";
  if (canonicalJson(manifest.sourceFiles) !== canonicalJson(expectedManifest.sourceFiles) || canonicalJson(manifest.reusedP2SourceFiles) !== canonicalJson(expectedManifest.reusedP2SourceFiles)) return "SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH";
  if (canonicalJson(manifest.requiredMappings) !== canonicalJson(expectedManifest.requiredMappings)) return "SPECTRUM_CHECKBOX_MAPPING_HASH_MISMATCH";
  if (canonicalJson(manifest) !== canonicalJson(expectedManifest)) return "SPECTRUM_CHECKBOX_MANIFEST_HASH_MISMATCH";

  try {
    const expectedMappings = buildExpectedSpectrumCheckboxSourceMappings();
    for (const [file, expected] of Object.entries(expectedMappings)) {
      const actual = await readJson(path.join(cwd, SCC_SOURCE_ROOT, "mappings", file));
      if (canonicalJson(actual) !== canonicalJson(expected)) return "SPECTRUM_CHECKBOX_MAPPING_HASH_MISMATCH";
    }
  } catch {
    return "SPECTRUM_CHECKBOX_MAPPING_HASH_MISMATCH";
  }
  return null;
}

async function withInputMutationWorkspace(cwd, callback) {
  const mutationCwd = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-spectrum-checkbox-mutation-"));
  try {
    const p2Evidence = await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH));
    const p2Paths = [
      SCC_P2_EVIDENCE_PATH,
      p2Evidence.sourceManifestRef.path,
      ...p2Evidence.schemaClosure.map((ref) => ref.path),
      ...p2Evidence.sourceFileRefs.map((ref) => ref.path),
      ...p2Evidence.fixtureRefs.map((ref) => ref.path),
      ...p2Evidence.artifactRefs.map((ref) => ref.path)
    ];
    const targetPaths = [
      ...p2Paths,
      ...sccSchemaPaths(),
      ...sccSourcePaths(),
      SCC_P2_REGISTRY_PATH,
      SCC_P2_TOKEN_PATH
    ];
    await copyFiles(cwd, mutationCwd, targetPaths);
    return await callback(mutationCwd);
  } finally {
    await fs.rm(mutationCwd, { recursive: true, force: true });
  }
}

async function assertEvidenceMutationFixtureCausal(cwd, evidence) {
  const fixture = SCC_FIXTURES["mutations/evidence-hash-mismatch.spectrum-checkbox-catalog-preflight.json"];
  const mutationCwd = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-spectrum-checkbox-evidence-mutation-"));
  try {
    const p2Evidence = await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH));
    const allPaths = [
      SCC_P2_EVIDENCE_PATH,
      p2Evidence.sourceManifestRef.path,
      ...p2Evidence.schemaClosure.map((ref) => ref.path),
      ...p2Evidence.sourceFileRefs.map((ref) => ref.path),
      ...p2Evidence.fixtureRefs.map((ref) => ref.path),
      ...p2Evidence.artifactRefs.map((ref) => ref.path),
      ...evidence.schemaClosure.map((ref) => ref.path),
      ...evidence.sourceFileRefs.map((ref) => ref.path),
      ...evidence.fixtureRefs.map((ref) => ref.path),
      ...evidence.implementationRefs.map((ref) => ref.path),
      ...evidence.artifactRefs.map((ref) => ref.path),
      evidence.reportRef.path
    ];
    await copyFiles(cwd, mutationCwd, allPaths);
    const reportPath = path.join(mutationCwd, fixture.targetPath);
    const report = await readJson(reportPath);
    report.runId = `${report.runId}-mutated`;
    await writeCanonicalJson(reportPath, report);
    const copiedEvidence = await readJson(path.join(mutationCwd, `${SCC_ARTIFACT_ROOT}/evidence.json`));
    const code = await firstEvidenceIntegrityFailureCode(mutationCwd, copiedEvidence);
    if (code !== "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH") throw contractError("spectrum Checkbox final-evidence fixture did not fail through the production integrity inspector", 1);
  } finally {
    await fs.rm(mutationCwd, { recursive: true, force: true });
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
  return `spectrum-checkbox-catalog-${sha256Hex(canonicalJson({
    manifestHash: sha256Hex(canonicalJson(manifest)),
    expectationsHash: sha256Hex(canonicalJson(expectations)),
    command: SCC_COMMAND,
    args,
    boundaryRefs
  })).slice(0, 32)}`;
}

async function buildEvidence(cwd, common, reportRef) {
  const schemaClosure = [];
  for (const relative of sccSchemaPaths()) {
    schemaClosure.push(artifactRef(relative, sccSchemaIdForPath(relative), await canonicalFileHash(path.join(cwd, relative))));
  }
  const sourceFileRefs = [];
  for (const relative of sccSourcePaths()) {
    sourceFileRefs.push(artifactRef(relative, sccSchemaIdForPath(relative), await rawFileHash(path.join(cwd, relative)), relative === SCC_COMPONENT_PATH ? CHECKBOX_SOURCE_REF : null));
  }
  for (const [relative, sourceRef] of [[SCC_P2_REGISTRY_PATH, REGISTRY_SOURCE_REF], [SCC_P2_TOKEN_PATH, TOKEN_SOURCE_REF]]) {
    sourceFileRefs.push(artifactRef(relative, "raw-source", await rawFileHash(path.join(cwd, relative)), sourceRef));
  }
  const fixtureRefs = [];
  for (const relative of sccFixturePaths()) fixtureRefs.push(artifactRef(relative, sccSchemaIdForPath(relative), await canonicalFileHash(path.join(cwd, relative))));
  const implementationRefs = [];
  for (const relative of SCC_IMPLEMENTATION_FILES) implementationRefs.push(artifactRef(relative, "implementation", await rawFileHash(path.join(cwd, relative))));
  const artifactRefs = [];
  for (const relative of SCC_ARTIFACT_PATHS) {
    if (relative.endsWith("/evidence.json")) artifactRefs.push(artifactRef(relative, "spectrum-checkbox-catalog-evidence.v0", null, CHECKBOX_SOURCE_REF));
    else artifactRefs.push(artifactRef(relative, sccSchemaIdForPath(relative), await canonicalFileHash(path.join(cwd, relative)), CHECKBOX_SOURCE_REF));
  }
  return {
    ...common,
    schemaId: "spectrum-checkbox-catalog-evidence.v0",
    schemaClosure,
    sourceFileRefs,
    fixtureRefs,
    implementationRefs,
    artifactRefs,
    reportRef,
    provenance: provenance("interfacectl-spectrum-checkbox-catalog-evidence", [SCC_MANIFEST_PATH, SCC_P2_EVIDENCE_PATH, SCC_P2_CATALOG_PATH, "plans/spectrum-checkbox-catalog.md"])
  };
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifactRefs.find((ref) => ref.path === `${SCC_ARTIFACT_ROOT}/evidence.json`);
  if (!finalRef) return null;
  finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  try {
    if (!evidence || evidence.schemaId !== "spectrum-checkbox-catalog-evidence.v0" || evidence.contractId !== SCC_CONTRACT_ID || evidence.version !== SCC_VERSION || evidence.command !== SCC_COMMAND || evidence.checkedAt !== SCC_TIMESTAMP || canonicalJson(evidence.args) !== canonicalJson(EXPECTED_ARGS) || canonicalJson(evidence.environment) !== canonicalJson(SCC_ENVIRONMENT) || evidence.status !== "pass" || evidence.promotionStatus !== "review_required") return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    await assertRequiredInputs(cwd);
    const inputIntegrityCode = await firstInputIntegrityFailureCode(cwd);
    if (inputIntegrityCode !== null) return inputIntegrityCode;
    const validators = await loadValidators(cwd);
    assertSchema(validators, "spectrum-checkbox-catalog-evidence.v0", evidence, `${SCC_ARTIFACT_ROOT}/evidence.json`);

    const expectedSchemaPaths = sccSchemaPaths();
    const expectedSourcePaths = [...sccSourcePaths(), SCC_P2_REGISTRY_PATH, SCC_P2_TOKEN_PATH];
    const expectedFixturePaths = sccFixturePaths();
    if (canonicalJson(evidence.schemaClosure?.map((ref) => ref.path)) !== canonicalJson(expectedSchemaPaths)) return "SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH";
    if (canonicalJson(evidence.sourceFileRefs?.map((ref) => ref.path)) !== canonicalJson(expectedSourcePaths)) return "SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH";
    if (canonicalJson(evidence.fixtureRefs?.map((ref) => ref.path)) !== canonicalJson(expectedFixturePaths)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(evidence.implementationRefs?.map((ref) => ref.path)) !== canonicalJson(SCC_IMPLEMENTATION_FILES)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(evidence.artifactRefs?.map((ref) => ref.path)) !== canonicalJson(SCC_ARTIFACT_PATHS)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    if (canonicalJson(evidence.boundaryRefs?.map((ref) => ref.path)) !== canonicalJson([SCC_P2_EVIDENCE_PATH, SCC_P2_CATALOG_PATH])) return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";

    for (const ref of evidence.schemaClosure) if (!ref.hash || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH";
    for (const ref of evidence.sourceFileRefs) {
      const current = await rawFileHash(path.join(cwd, ref.path));
      if (!ref.hash || ref.hash !== current) return ref.path === SCC_LOCK_PATH ? "SPECTRUM_CHECKBOX_SOURCE_LOCK_MISMATCH" : ref.path.includes("/mappings/") ? "SPECTRUM_CHECKBOX_MAPPING_HASH_MISMATCH" : "SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH";
    }
    for (const ref of evidence.fixtureRefs) if (!ref.hash || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    for (const ref of evidence.implementationRefs) if (!ref.hash || ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    for (const ref of evidence.artifactRefs) {
      if (ref.path === `${SCC_ARTIFACT_ROOT}/evidence.json`) continue;
      if (!ref.hash || ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    }
    const finalRef = evidence.artifactRefs.at(-1);
    if (finalRef?.path !== `${SCC_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";

    const p2Evidence = await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH));
    if (await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence) !== null || p2Evidence.status !== "pass") return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";
    if (evidence.boundaryRefs[0].hash !== p2Internals.computeEvidenceSelfHash(p2Evidence)) return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";
    if (evidence.boundaryRefs[1].hash !== await canonicalFileHash(path.join(cwd, SCC_P2_CATALOG_PATH))) return "SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH";

    await assertImmutableSpectrumCheckboxSource(cwd);
    const context = await loadAndVerifyContext(cwd, validators);
    const sourceInventory = await readJson(path.join(cwd, `${SCC_ARTIFACT_ROOT}/source-inventory.json`));
    const sourceMapping = await readJson(path.join(cwd, `${SCC_ARTIFACT_ROOT}/source-mapping.json`));
    const expandedCatalog = await readJson(path.join(cwd, `${SCC_ARTIFACT_ROOT}/governed-catalog.json`));
    const report = await readJson(path.join(cwd, `${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json`));
    assertSchema(validators, "spectrum-checkbox-source-inventory.v0", sourceInventory, `${SCC_ARTIFACT_ROOT}/source-inventory.json`);
    assertSchema(validators, "spectrum-checkbox-source-mapping.v0", sourceMapping, `${SCC_ARTIFACT_ROOT}/source-mapping.json`);
    assertSchema(validators, "runtime-catalog.v0", expandedCatalog, `${SCC_ARTIFACT_ROOT}/governed-catalog.json`);
    assertSchema(validators, "spectrum-checkbox-catalog-report.v0", report, `${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json`);
    if (evidence.reportRef?.path !== `${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json` || evidence.reportRef.hash !== await canonicalFileHash(path.join(cwd, evidence.reportRef.path))) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";

    const expectedInventory = await buildSourceInventory(cwd, context);
    const expectedMapping = await buildCombinedSourceMapping(cwd, context);
    const expectedCatalog = buildExpandedCatalog(context);
    if (canonicalJson(sourceInventory) !== canonicalJson(expectedInventory) || canonicalJson(sourceMapping) !== canonicalJson(expectedMapping) || canonicalJson(expandedCatalog) !== canonicalJson(expectedCatalog)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    assertMappingClosure(context, sourceMapping);
    assertMappingTargetsResolve(sourceMapping, expandedCatalog);
    const basePreservation = buildBasePreservation(context.p2Catalog, expandedCatalog);
    assertBaseCatalogPreserved(context.p2Catalog, expandedCatalog, basePreservation);
    const validationResults = await evaluateExpectations(cwd, context.expectations, { ...context, sourceMapping, expandedCatalog });
    if (canonicalJson(evidence.validationResults) !== canonicalJson(validationResults)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    const expectedDiagnostics = [...new Set(validationResults.flatMap((row) => row.actualDiagnosticCodes))].sort().map((code) => deepClone(DIAGNOSTIC_BY_CODE.get(code)));
    if (canonicalJson(evidence.diagnostics) !== canonicalJson(expectedDiagnostics) || canonicalJson(evidence.diagnosticsRegistry) !== canonicalJson(diagnosticsRegistry())) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    const sourceInventoryRef = artifactRef(`${SCC_ARTIFACT_ROOT}/source-inventory.json`, "spectrum-checkbox-source-inventory.v0", await canonicalFileHash(path.join(cwd, SCC_ARTIFACT_ROOT, "source-inventory.json")), CHECKBOX_SOURCE_REF);
    const sourceMappingRef = artifactRef(`${SCC_ARTIFACT_ROOT}/source-mapping.json`, "spectrum-checkbox-source-mapping.v0", await canonicalFileHash(path.join(cwd, SCC_ARTIFACT_ROOT, "source-mapping.json")), CHECKBOX_SOURCE_REF);
    const expandedCatalogRef = artifactRef(`${SCC_ARTIFACT_ROOT}/governed-catalog.json`, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, SCC_ARTIFACT_ROOT, "governed-catalog.json")), CHECKBOX_SOURCE_REF);
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
      schemaId: "spectrum-checkbox-catalog-report.v0",
      provenance: provenance("interfacectl-spectrum-checkbox-catalog-report", [SCC_MANIFEST_PATH, SCC_P2_EVIDENCE_PATH, SCC_P2_CATALOG_PATH])
    };
    if (canonicalJson(report) !== canonicalJson(expectedReport)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    const expectedReportRef = artifactRef(`${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json`, "spectrum-checkbox-catalog-report.v0", await canonicalFileHash(path.join(cwd, SCC_ARTIFACT_ROOT, "spectrum-checkbox-catalog-report.json")), CHECKBOX_SOURCE_REF);
    const expectedEvidence = await buildEvidence(cwd, expectedCommon, expectedReportRef);
    expectedEvidence.artifactRefs[expectedEvidence.artifactRefs.length - 1].hash = computeEvidenceSelfHash(expectedEvidence);
    if (canonicalJson(evidence) !== canonicalJson(expectedEvidence)) return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
    await assertExactArtifactClosure(cwd);
    return null;
  } catch (error) {
    if (error?.message?.includes("schema")) return "SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH";
    if (error?.message?.includes("source addendum") || error?.message?.includes("source byte")) return "SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH";
    return "SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH";
  }
}

async function assertExactArtifactClosure(cwd) {
  await assertSafeOutputDirectoryChain(cwd, SCC_ARTIFACT_ROOT);
  const artifactRoot = path.join(cwd, SCC_ARTIFACT_ROOT);
  const entries = await fs.readdir(artifactRoot, { withFileTypes: true });
  const actual = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const stat = await fs.lstat(path.join(artifactRoot, entry.name));
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw contractError(`unsafe entry in spectrum Checkbox catalog artifact closure: ${entry.name}`, 1);
    actual.push(entry.name);
  }
  if (canonicalJson(actual) !== canonicalJson([...SCC_GENERATED_ARTIFACTS].sort())) throw contractError("spectrum Checkbox catalog artifact closure drift", 1);
  for (const relative of SCC_GENERATED_ARTIFACTS) {
    const artifactPath = `${SCC_ARTIFACT_ROOT}/${relative}`;
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
      if (stat.isSymbolicLink()) throw contractError(`unsafe symlink in spectrum Checkbox catalog closure: ${nextRelative}`, 1);
      if (stat.isDirectory()) await walk(absolute, nextRelative);
      else if (stat.isFile() && stat.nlink === 1) result.push(nextRelative);
      else throw contractError(`unsafe entry in spectrum Checkbox catalog closure: ${nextRelative}`, 1);
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

export const spectrumCheckboxCatalogInternals = {
  buildExpandedCatalog,
  computeEvidenceSelfHash,
  evaluateCatalogFixture,
  firstEvidenceIntegrityFailureCode,
  firstInputIntegrityFailureCode,
  parseArgs
};
