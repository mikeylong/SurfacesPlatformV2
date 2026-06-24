import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const ROOT = process.cwd();
const P1_CONTRACT_ID = "surfaces-p1-runtime-adapter-proof";
const P1_SCHEMA_ROOT = "schemas";
const P1_FIXTURE_ROOT = "fixtures/p1";
const P1_ARTIFACT_ROOT = "artifacts/p1";
const P0_ARTIFACT_ROOT = "artifacts/p0";
const EXPECTED_COMMAND = "interfacectl surfaces adapter proof";
const EXPECTED_ARGS = Object.freeze({
  catalog: `${P0_ARTIFACT_ROOT}/governed-catalog.json`,
  fixture: P1_FIXTURE_ROOT,
  out: P1_ARTIFACT_ROOT
});
const DEFAULT_EVIDENCE_PATH = "artifacts/p1/evidence.json";
const DEFAULT_OUT_DIR = "demo/p1";
const P1_SCHEMA_FILES = [
  "runtime-projection.v0.schema.json",
  "render-plan.v0.schema.json",
  "runtime-adapter-report.v0.schema.json",
  "runtime-adapter-evidence.v0.schema.json",
  "runtime-adapter-expectations.v0.schema.json",
  "runtime-adapter-diagnostics.v0.schema.json"
];
const P1_SCHEMA_IDS_BY_FILE = new Map([
  ["runtime-projection.v0.schema.json", "runtime-projection.v0"],
  ["render-plan.v0.schema.json", "render-plan.v0"],
  ["runtime-adapter-report.v0.schema.json", "runtime-adapter-report.v0"],
  ["runtime-adapter-evidence.v0.schema.json", "runtime-adapter-evidence.v0"],
  ["runtime-adapter-expectations.v0.schema.json", "runtime-adapter-expectations.v0"],
  ["runtime-adapter-diagnostics.v0.schema.json", "runtime-adapter-diagnostics.v0"]
]);
const P1_MUTATION_FILES = [
  ["missing-catalog-ref.runtime-projection.json", "runtime-projection.v0"],
  ["catalog-hash-mismatch.runtime-projection.json", "runtime-projection.v0"],
  ["projection-authority-escalation.runtime-projection.json", "runtime-projection.v0"],
  ["missing-render-plan-provenance.render-plan.json", "render-plan.v0"],
  ["runtime-projection-hash-mismatch.runtime-adapter-report.json", "runtime-adapter-report.v0"],
  ["hash-mismatch.runtime-adapter-evidence.json", "runtime-adapter-evidence.v0"]
];
const P1_VALID_FILES = [
  "confirm-panel.surface-ir.json",
  "status-callout.surface-ir.json",
  "button-defaults.surface-ir.json"
];
const P1_INVALID_FILES = [
  "unknown-component.surface-ir.json",
  "unknown-prop.surface-ir.json",
  "unsafe-markup.surface-ir.json",
  "disabled-action-execution.surface-ir.json",
  "unknown-action.surface-ir.json",
  "unknown-event.surface-ir.json",
  "unknown-slot.surface-ir.json",
  "unknown-token-key.surface-ir.json",
  "unknown-token-ref.surface-ir.json",
  "unknown-data-binding.surface-ir.json",
  "unknown-variant.surface-ir.json",
  "unknown-state.surface-ir.json",
  "modal-role-not-supported.surface-ir.json"
];
const P1_REVIEW_FILES = ["review-required-action.surface-ir.json"];
const EXPECTED_P1_ARTIFACT_FILES = [
  "runtime-projection.json",
  "render-plan.confirm-panel.json",
  "render-plan.status-callout.json",
  "render-plan.button-defaults.json",
  "runtime-adapter-report.json",
  "evidence.json"
];
const EXPECTED_RENDER_PLAN_PATHS = [
  `${P1_ARTIFACT_ROOT}/render-plan.confirm-panel.json`,
  `${P1_ARTIFACT_ROOT}/render-plan.status-callout.json`,
  `${P1_ARTIFACT_ROOT}/render-plan.button-defaults.json`
];
const EXPECTED_UPSTREAM_REFS = [
  { path: `${P0_ARTIFACT_ROOT}/evidence.json`, schemaId: "evidence.v0" },
  { path: `${P0_ARTIFACT_ROOT}/governed-catalog.json`, schemaId: "runtime-catalog.v0" },
  { path: `${P0_ARTIFACT_ROOT}/adapter-diagnostics.json`, schemaId: "adapter-diagnostics.v0" }
];
const EXPECTED_BOUNDARY_SPECS = [
  ...EXPECTED_UPSTREAM_REFS,
  { path: `${P1_ARTIFACT_ROOT}/runtime-projection.json`, schemaId: "runtime-projection.v0" },
  ...EXPECTED_RENDER_PLAN_PATHS.map((refPath) => ({ path: refPath, schemaId: "render-plan.v0" })),
  { path: `${P1_ARTIFACT_ROOT}/runtime-adapter-report.json`, schemaId: "runtime-adapter-report.v0" }
];
const EXPECTED_ARTIFACT_SPECS = [
  ...P1_SCHEMA_FILES.map((file) => ({
    role: "schema",
    path: `${P1_SCHEMA_ROOT}/${file}`,
    schemaId: "json-schema"
  })),
  { role: "upstream-boundary", path: `${P0_ARTIFACT_ROOT}/evidence.json`, schemaId: "evidence.v0" },
  { role: "upstream-boundary", path: `${P0_ARTIFACT_ROOT}/governed-catalog.json`, schemaId: "runtime-catalog.v0" },
  { role: "upstream-boundary", path: `${P0_ARTIFACT_ROOT}/adapter-diagnostics.json`, schemaId: "adapter-diagnostics.v0" },
  { role: "expectations-manifest", path: `${P1_FIXTURE_ROOT}/expectations.manifest.json`, schemaId: "runtime-adapter-expectations.v0" },
  ...P1_VALID_FILES.map((file) => ({
    role: "valid-fixture",
    path: `${P1_FIXTURE_ROOT}/valid/${file}`,
    schemaId: "surface-ir.v0"
  })),
  ...P1_REVIEW_FILES.map((file) => ({
    role: "review-fixture",
    path: `${P1_FIXTURE_ROOT}/review/${file}`,
    schemaId: "surface-ir.v0"
  })),
  ...P1_INVALID_FILES.map((file) => ({
    role: "invalid-fixture",
    path: `${P1_FIXTURE_ROOT}/invalid/${file}`,
    schemaId: "surface-ir.v0"
  })),
  ...P1_MUTATION_FILES.map(([file, schemaId]) => ({
    role: "mutation-fixture",
    path: `${P1_FIXTURE_ROOT}/mutations/${file}`,
    schemaId
  })),
  { role: "runtime-projection", path: `${P1_ARTIFACT_ROOT}/runtime-projection.json`, schemaId: "runtime-projection.v0" },
  ...EXPECTED_RENDER_PLAN_PATHS.map((refPath) => ({ role: "render-plan", path: refPath, schemaId: "render-plan.v0" })),
  { role: "runtime-adapter-report", path: `${P1_ARTIFACT_ROOT}/runtime-adapter-report.json`, schemaId: "runtime-adapter-report.v0" },
  { role: "evidence", path: `${P1_ARTIFACT_ROOT}/evidence.json`, schemaId: "runtime-adapter-evidence.v0" }
];

const STATUS_ORDER = ["allowed", "review_required", "blocked"];

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:p1-demo usage error" : "build:p1-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  const artifactRoot = {
    fsPath: path.dirname(evidencePath.fsPath),
    posixPath: path.posix.dirname(evidencePath.posixPath)
  };
  const expectedArtifactPaths = EXPECTED_ARTIFACT_SPECS.map((spec) => spec.path);

  assertDefaultP1EvidenceLocation(evidencePath, artifactRoot);
  await rejectStaleArtifactOutput(artifactRoot);
  const schemaContext = await loadP1Schemas();
  const evidence = await readJsonFile(evidencePath, "P1 evidence");
  validateWithLoadedSchema(schemaContext, "runtime-adapter-evidence.v0", evidence, "P1 evidence");
  const loaded = await loadVerifiedArtifacts(artifactRoot, evidencePath);
  validateLoadedArtifacts(schemaContext, loaded);
  const verification = await verifyEvidence({ evidence, evidencePath, artifactRoot, loaded });
  await verifyLoadedArtifactGraph({ evidence, verification, loaded });
  const demoData = buildDemoData({ evidence, verification, loaded, evidencePath, outDir, expectedArtifactPaths });

  await writeDemo(outDir, demoData);
  console.log(`P1 demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = {
    evidence: DEFAULT_EVIDENCE_PATH,
    out: DEFAULT_OUT_DIR
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build-p1-demo.mjs [--evidence artifacts/p1/evidence.json] [--out demo/p1]");
      process.exit(0);
    }
    if (arg !== "--evidence" && arg !== "--out") {
      throw usageError(`unknown argument ${arg}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw usageError(`${arg} requires a value`);
    }
    args[arg.slice(2)] = value;
    index += 1;
  }

  return args;
}

function workspacePath(input, flag) {
  if (typeof input !== "string" || input.length === 0) {
    throw usageError(`${flag} must be a non-empty path`);
  }
  if (input.includes("\0")) {
    throw usageError(`${flag} must not contain null bytes`);
  }

  const fsPath = path.resolve(ROOT, input);
  const relative = path.relative(ROOT, fsPath);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw usageError(`${flag} must stay inside the workspace`);
  }

  return {
    fsPath,
    posixPath: toPosixPath(relative)
  };
}

function assertDefaultP1EvidenceLocation(evidencePath, artifactRoot) {
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || artifactRoot.posixPath !== P1_ARTIFACT_ROOT) {
    throw contractError(`P1 demo evidence must be ${DEFAULT_EVIDENCE_PATH}`);
  }
}

async function loadP1Schemas() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  const schemas = new Map();
  for (const file of P1_SCHEMA_FILES) {
    const schemaPath = {
      fsPath: path.join(ROOT, P1_SCHEMA_ROOT, file),
      posixPath: `${P1_SCHEMA_ROOT}/${file}`
    };
    const schema = await readJsonFile(schemaPath, `P1 schema ${schemaPath.posixPath}`);
    assertLoadedSchemaContract(file, schema);
    if (!ajv.validateSchema(schema)) {
      throw contractError(`P1 schema ${schemaPath.posixPath} is not a valid JSON Schema: ${formatAjvErrors(ajv.errors)}`);
    }
    ajv.addSchema(schema);
    schemas.set(schema.schemaId, schema);
  }
  return { ajv, schemas };
}

function assertLoadedSchemaContract(file, schema) {
  const schemaId = P1_SCHEMA_IDS_BY_FILE.get(file);
  if (!schemaId) {
    throw contractError(`unexpected P1 schema file loaded: ${file}`);
  }
  if (schema?.schemaId !== schemaId) {
    throw contractError(`P1 schema ${file} must declare schemaId ${schemaId}, got ${formatValue(schema?.schemaId)}`);
  }
  const expectedId = `https://surfaces.dev/schemas/p1/${schemaId}.schema.json`;
  if (schema.$id !== expectedId) {
    throw contractError(`P1 schema ${file} must declare $id ${expectedId}`);
  }
  if (schema.type !== "object") {
    throw contractError(`P1 schema ${file} must be an object schema`);
  }
}

function validateWithLoadedSchema(schemaContext, schemaId, data, label) {
  const validate = schemaContext.ajv.getSchema(`https://surfaces.dev/schemas/p1/${schemaId}.schema.json`);
  if (!validate) {
    throw contractError(`P1 schema is not loaded for ${schemaId}`);
  }
  if (!validate(data)) {
    throw contractError(`${label} failed ${schemaId}: ${formatAjvErrors(validate.errors)}`);
  }
}

async function rejectStaleArtifactOutput(artifactRoot) {
  const expected = new Set(EXPECTED_P1_ARTIFACT_FILES);
  let rootStat;
  try {
    rootStat = await fs.lstat(artifactRoot.fsPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw contractError(`P1 artifact root is missing: ${artifactRoot.posixPath}`);
    }
    throw error;
  }
  if (!rootStat.isDirectory()) {
    throw contractError(`P1 artifact root must be a directory: ${artifactRoot.posixPath}`);
  }
  if (rootStat.isSymbolicLink()) {
    throw contractError(`P1 artifact root must not be a symlink: ${artifactRoot.posixPath}`);
  }

  const entries = (await fs.readdir(artifactRoot.fsPath, { withFileTypes: true }))
    .sort((a, b) => compareText(a.name, b.name));
  const stale = [];
  for (const entry of entries) {
    const entryPath = path.join(artifactRoot.fsPath, entry.name);
    const entryRef = `${artifactRoot.posixPath}/${entry.name}`;
    const entryStat = await fs.lstat(entryPath);
    if (!expected.has(entry.name)) {
      stale.push(entryRef);
      continue;
    }
    if (!entryStat.isFile()) {
      stale.push(entryRef);
    }
  }

  if (stale.length > 0) {
    throw contractError(`unexpected stale P1 artifact output under ${artifactRoot.posixPath}: ${stale.join(", ")}`);
  }
}

async function verifyEvidence({ evidence, evidencePath, artifactRoot, loaded }) {
  assertP1EvidenceEnvelope(evidence, loaded.manifest);

  const artifactRefs = collectRefs(evidence.artifacts, "artifacts");
  const boundaryRefs = collectRefs(evidence.boundaryRefs, "boundaryRefs");
  assertExactRefSpecs(artifactRefs, EXPECTED_ARTIFACT_SPECS, "artifacts", { requireRole: true });
  assertExactRefSpecs(boundaryRefs, EXPECTED_BOUNDARY_SPECS, "boundaryRefs");
  assertRenderPlanRefs(evidence.renderPlanRefs, "renderPlanRefs");

  const p1ArtifactRefs = artifactRefs.filter((ref) => isUnderArtifactRoot(ref.path, artifactRoot.posixPath));
  const selfRef = artifactRefs.find((ref) => ref.path === evidencePath.posixPath);
  if (!selfRef) {
    throw contractError(`P1 evidence is missing self artifact ref for ${evidencePath.posixPath}`);
  }
  const selfHash = verifyEvidenceSelfHash(evidence, selfRef);

  const verified = new Map();
  for (const ref of [...artifactRefs, ...boundaryRefs, ...collectRefs(evidence.renderPlanRefs, "renderPlanRefs")]) {
    if (verified.has(ref.path)) {
      const previous = verified.get(ref.path);
      if (previous.expectedHash !== ref.hash) {
        throw contractError(`P1 evidence has conflicting hashes for ${ref.path}`);
      }
      continue;
    }
    const expectedHash = ref.path === evidencePath.posixPath ? selfHash : await expectedHashForRef(ref.path);
    if (ref.hash !== expectedHash) {
      throw contractError(`P1 evidence hash mismatch for ${ref.path}: expected ${ref.hash}, got ${expectedHash}`);
    }
    verified.set(ref.path, { expectedHash, schemaId: ref.schemaId });
  }

  assertRefEqual(evidence.upstream?.p0EvidenceRef, boundaryRefs[0].entry, "upstream.p0EvidenceRef");
  assertRefEqual(evidence.upstream?.governedCatalogRef, boundaryRefs[1].entry, "upstream.governedCatalogRef");
  assertRefEqual(evidence.upstream?.adapterDiagnosticsRef, boundaryRefs[2].entry, "upstream.adapterDiagnosticsRef");
  assertRefEqual(evidence.runtimeProjectionRef, boundaryRefs[3].entry, "runtimeProjectionRef");
  assertRefEqual(evidence.runtimeAdapterReportRef, boundaryRefs[7].entry, "runtimeAdapterReportRef");

  return {
    selfHash,
    artifactRefs,
    outputArtifactRefs: p1ArtifactRefs,
    boundaryRefs,
    verified
  };
}

function assertP1EvidenceEnvelope(evidence, manifest) {
  assertEqual("P1 evidence contractId", evidence.contractId, P1_CONTRACT_ID);
  assertEqual("P1 evidence schemaId", evidence.schemaId, "runtime-adapter-evidence.v0");
  assertEqual("P1 evidence adapter", evidence.adapter, "web-static");
  assertEqual("P1 evidence command", evidence.command, EXPECTED_COMMAND);
  assertJsonEqual("P1 evidence args", evidence.args, EXPECTED_ARGS);
  assertEqual("P1 evidence status", evidence.status, manifest.runExpectation.status);
  assertEqual("P1 evidence promotionStatus", evidence.promotionStatus, manifest.runExpectation.promotionStatus);
  assertJsonEqual("P1 evidence provenance.stageChain", evidence.provenance?.stageChain, ["projection", "runtime-boundary", "evidence"]);
  if (!Array.isArray(evidence.validationResults) || evidence.validationResults.length !== manifest.expectations.length) {
    throw contractError("P1 evidence validationResults must match the expectations manifest length");
  }
  for (const [index, result] of evidence.validationResults.entries()) {
    assertValidationResultMatchesExpectation(result, manifest.expectations[index], index);
  }
}

function assertValidationResultMatchesExpectation(result, expectation, index) {
  const label = `validationResults[${index}]`;
  assertEqual(`${label}.fixturePath`, result.fixturePath, expectation.fixturePath);
  assertEqual(`${label}.fixtureKind`, result.fixtureKind, expectation.fixtureKind);
  assertEqual(`${label}.expectedStage`, result.expectedStage, expectation.expectedStage);
  assertEqual(`${label}.expectedPhase`, result.expectedPhase, expectation.expectedPhase);
  assertEqual(`${label}.expectedValidationResult`, result.expectedValidationResult, expectation.validationResult);
  assertEqual(`${label}.expectedPromotionStatus`, result.expectedPromotionStatus, expectation.promotionStatus);
  assertJsonEqual(`${label}.expectedDiagnosticCodes`, result.expectedDiagnosticCodes, expectation.expectedDiagnosticCodes);
  assertEqual(`${label}.artifactPath`, result.artifactPath, expectation.expectedArtifactPath);
  assertEqual(`${label}.jsonPointer`, result.jsonPointer, expectation.expectedJsonPointer);
  assertEqual(`${label}.sourceRef`, result.sourceRef, expectation.requiredSourceRef);
  assertEqual(`${label}.renderPlanPath`, result.renderPlanPath, expectation.renderPlanPath);
  if (result.matched !== true) {
    throw contractError(`P1 evidence ${label} must be matched`);
  }
}

function collectRefs(value, label, options = {}) {
  if (value === undefined && options.optional) return [];
  if (!Array.isArray(value)) {
    throw contractError(`P1 evidence ${label} must be an array`);
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw contractError(`P1 evidence ${label}[${index}] must be an object`);
    }
    const refPath = refPathFor(entry);
    const hash = entry.hash;
    if (!refPath) {
      throw contractError(`P1 evidence ${label}[${index}] is missing path`);
    }
    assertSafePosixRef(refPath, `${label}[${index}].path`);
    if (entry.hashAlgorithm !== "sha256") {
      throw contractError(`P1 evidence ${label}[${index}] must use sha256`);
    }
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw contractError(`P1 evidence ${label}[${index}] has an invalid sha256 hash`);
    }
    return {
      entry,
      index,
      label,
      path: refPath,
      hash,
      schemaId: entry.schemaId ?? null
    };
  });
}

function refPathFor(entry) {
  return typeof entry.path === "string" ? entry.path : typeof entry.artifactPath === "string" ? entry.artifactPath : null;
}

function assertExactRefSpecs(refs, specs, label, options = {}) {
  if (refs.length !== specs.length) {
    throw contractError(`P1 evidence ${label} must contain exactly ${specs.length} refs, got ${refs.length}`);
  }
  for (const [index, spec] of specs.entries()) {
    const ref = refs[index];
    assertEqual(`P1 evidence ${label}[${index}].path`, ref.path, spec.path);
    assertEqual(`P1 evidence ${label}[${index}].schemaId`, ref.schemaId, spec.schemaId);
    if (options.requireRole) {
      assertEqual(`P1 evidence ${label}[${index}].role`, ref.entry.role, spec.role);
    }
  }
}

function assertRenderPlanRefs(value, label) {
  const refs = collectRefs(value, label);
  assertExactRefSpecs(refs, EXPECTED_RENDER_PLAN_PATHS.map((refPath) => ({ path: refPath, schemaId: "render-plan.v0" })), label);
  for (const [index, ref] of refs.entries()) {
    assertEqual(`P1 evidence ${label}[${index}].promotionStatus`, ref.entry.promotionStatus, "allowed");
    const surfaceRef = ref.entry.surfaceRef;
    if (!surfaceRef || typeof surfaceRef !== "object" || Array.isArray(surfaceRef)) {
      throw contractError(`P1 evidence ${label}[${index}].surfaceRef must be an object`);
    }
    assertEqual(`P1 evidence ${label}[${index}].surfaceRef.schemaId`, surfaceRef.schemaId, "surface-ir.v0");
    if (surfaceRef.hashAlgorithm !== "sha256" || !/^[a-f0-9]{64}$/.test(surfaceRef.hash)) {
      throw contractError(`P1 evidence ${label}[${index}].surfaceRef must carry a sha256 hash`);
    }
    assertSafePosixRef(surfaceRef.path, `${label}[${index}].surfaceRef.path`);
    if (!surfaceRef.path.startsWith(`${P1_FIXTURE_ROOT}/valid/`)) {
      throw contractError(`P1 evidence ${label}[${index}].surfaceRef must point at a P1 valid fixture`);
    }
  }
}

function assertSafePosixRef(refPath, label) {
  if (typeof refPath !== "string" || refPath.includes("\\") || refPath.startsWith("/") || refPath.split("/").includes("..") || refPath.includes("\0")) {
    throw contractError(`P1 evidence ${label} must be a POSIX-relative workspace path`);
  }
}

function assertNoDuplicateRefs(refs, label) {
  const seen = new Set();
  const duplicates = [];
  for (const ref of refs) {
    if (seen.has(ref.path)) duplicates.push(ref.path);
    seen.add(ref.path);
  }
  if (duplicates.length > 0) {
    throw contractError(`P1 evidence ${label} has duplicate output refs: ${dedupe(duplicates).join(", ")}`);
  }
}

function verifyEvidenceSelfHash(evidence, selfRef) {
  const clone = deepClone(evidence);
  const cloneRefs = clone.artifacts;
  if (!Array.isArray(cloneRefs) || !cloneRefs[selfRef.index]) {
    throw contractError("P1 evidence self-hash cannot be computed from artifacts[]");
  }
  cloneRefs[selfRef.index].hash = null;
  const actual = sha256Hex(canonicalJson(clone));
  if (selfRef.hash !== actual) {
    throw contractError(`P1 evidence self-hash mismatch for ${selfRef.path}: expected ${selfRef.hash}, got ${actual}`);
  }
  return actual;
}

async function expectedHashForRef(refPath) {
  if (refPath === `${P0_ARTIFACT_ROOT}/evidence.json`) {
    const p0Evidence = await readJsonArtifact(refPath, "P0 evidence");
    return computeEvidenceSelfHashForPath(p0Evidence, refPath);
  }
  return hashJsonArtifact(refPath);
}

async function hashJsonArtifact(refPath) {
  const filePath = path.join(ROOT, refPath);
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw contractError(`P1 evidence references missing artifact ${refPath}`);
    }
    throw error;
  }
  if (!stat.isFile()) {
    throw contractError(`P1 evidence artifact ref must resolve to a regular file: ${refPath}`);
  }
  const data = await readJsonFile({ fsPath: filePath, posixPath: refPath }, `P1 artifact ${refPath}`);
  return sha256Hex(canonicalJson(data));
}

async function readJsonArtifact(refPath, label) {
  assertSafePosixRef(refPath, `${label}.path`);
  return readJsonFile({ fsPath: path.join(ROOT, refPath), posixPath: refPath }, label);
}

function computeEvidenceSelfHashForPath(evidence, evidenceRefPath) {
  const clone = deepClone(evidence);
  if (!Array.isArray(clone.artifacts)) {
    throw contractError(`evidence ${evidenceRefPath} cannot be self-hashed without artifacts[]`);
  }
  const matches = clone.artifacts.filter((entry) => entry?.path === evidenceRefPath);
  if (matches.length !== 1) {
    throw contractError(`evidence ${evidenceRefPath} must contain exactly one self artifact ref`);
  }
  matches[0].hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function loadVerifiedArtifacts(artifactRoot, evidencePath) {
  const files = Object.fromEntries(EXPECTED_P1_ARTIFACT_FILES.map((file) => [file, `${artifactRoot.posixPath}/${file}`]));
  const [projection, confirmPanel, statusCallout, buttonDefaults, report, manifest, p0Evidence, governedCatalog, adapterDiagnostics] = await Promise.all([
    readJsonFile({ fsPath: path.join(artifactRoot.fsPath, "runtime-projection.json"), posixPath: files["runtime-projection.json"] }, "runtime projection"),
    readJsonFile({ fsPath: path.join(artifactRoot.fsPath, "render-plan.confirm-panel.json"), posixPath: files["render-plan.confirm-panel.json"] }, "confirm panel render plan"),
    readJsonFile({ fsPath: path.join(artifactRoot.fsPath, "render-plan.status-callout.json"), posixPath: files["render-plan.status-callout.json"] }, "status callout render plan"),
    readJsonFile({ fsPath: path.join(artifactRoot.fsPath, "render-plan.button-defaults.json"), posixPath: files["render-plan.button-defaults.json"] }, "button defaults render plan"),
    readJsonFile({ fsPath: path.join(artifactRoot.fsPath, "runtime-adapter-report.json"), posixPath: files["runtime-adapter-report.json"] }, "runtime adapter report"),
    readJsonArtifact(`${P1_FIXTURE_ROOT}/expectations.manifest.json`, "P1 expectations manifest"),
    readJsonArtifact(`${P0_ARTIFACT_ROOT}/evidence.json`, "P0 evidence"),
    readJsonArtifact(`${P0_ARTIFACT_ROOT}/governed-catalog.json`, "P0 governed catalog"),
    readJsonArtifact(`${P0_ARTIFACT_ROOT}/adapter-diagnostics.json`, "P0 adapter diagnostics")
  ]);

  return {
    files,
    manifest,
    p0Evidence,
    governedCatalog,
    adapterDiagnostics,
    projection,
    report,
    renderPlans: [
      { path: files["render-plan.confirm-panel.json"], plan: confirmPanel },
      { path: files["render-plan.status-callout.json"], plan: statusCallout },
      { path: files["render-plan.button-defaults.json"], plan: buttonDefaults }
    ],
    evidencePath: evidencePath.posixPath
  };
}

function validateLoadedArtifacts(schemaContext, loaded) {
  validateWithLoadedSchema(schemaContext, "runtime-adapter-expectations.v0", loaded.manifest, "P1 expectations manifest");
  validateWithLoadedSchema(schemaContext, "runtime-projection.v0", loaded.projection, "runtime projection");
  for (const { path: artifactPath, plan } of loaded.renderPlans) {
    validateWithLoadedSchema(schemaContext, "render-plan.v0", plan, `render plan ${artifactPath}`);
  }
  validateWithLoadedSchema(schemaContext, "runtime-adapter-report.v0", loaded.report, "runtime adapter report");
}

async function verifyLoadedArtifactGraph({ evidence, verification, loaded }) {
  verifyManifestContract(loaded.manifest);
  verifyP0Boundary({ evidence, loaded });
  verifyRuntimeProjection({ evidence, loaded });
  await verifyRuntimeReportAndRenderPlans({ evidence, loaded });

  const report = loaded.report;
  assertEqual("P1 report runId", report.runId, evidence.runId);
  assertEqual("P1 report status", report.status, evidence.status);
  assertEqual("P1 report promotionStatus", report.promotionStatus, evidence.promotionStatus);
  assertEqual("P1 report adapter", report.adapter, evidence.adapter);
  assertEqual("P1 report fixtureRoot", report.fixtureRoot, P1_FIXTURE_ROOT);
  assertEqual("P1 report artifactRoot", report.artifactRoot, P1_ARTIFACT_ROOT);
  assertJsonEqual("P1 report results", report.results, evidence.validationResults);
  assertJsonEqual("P1 report diagnostics", report.diagnostics, evidence.diagnostics);
  assertJsonEqual("P1 report diagnosticsRegistry", report.diagnosticsRegistry, evidence.diagnosticsRegistry);
  assertJsonEqual("P1 report environment", report.environment, evidence.environment);
  assertEqual("P1 report provenance.command", report.provenance?.command, evidence.command);
  assertJsonEqual("P1 report provenance.args", report.provenance?.args, evidence.args);

  for (const spec of EXPECTED_ARTIFACT_SPECS) {
    if (!verification.verified.has(spec.path)) {
      throw contractError(`P1 evidence did not verify required artifact ref ${spec.path}`);
    }
  }
}

function verifyManifestContract(manifest) {
  assertEqual("P1 manifest fixtureRoot", manifest.fixtureRoot, P1_FIXTURE_ROOT);
  assertEqual("P1 manifest artifactRoot", manifest.artifactRoot, P1_ARTIFACT_ROOT);
  assertEqual("P1 manifest schemaRoot", manifest.schemaRoot, P1_SCHEMA_ROOT);
  assertJsonEqual("P1 manifest runExpectation", manifest.runExpectation, {
    status: "pass",
    promotionStatus: "review_required"
  });
  assertJsonEqual("P1 manifest inputs", manifest.inputs, manifest.expectations.map((expectation) => expectation.fixturePath));
  assertJsonEqual("P1 manifest artifactOrder", manifest.artifactOrder, EXPECTED_ARTIFACT_SPECS.map((spec) => spec.path));
}

function verifyP0Boundary({ evidence, loaded }) {
  assertEqual("P0 evidence schemaId", loaded.p0Evidence.schemaId, "evidence.v0");
  assertEqual("P0 evidence status", loaded.p0Evidence.status, "pass");
  if (loaded.p0Evidence.promotionStatus === "blocked") {
    throw contractError("P0 evidence promotionStatus must not be blocked");
  }
  assertEqual("P0 adapter diagnostics schemaId", loaded.adapterDiagnostics.schemaId, "adapter-diagnostics.v0");
  assertEqual("P0 adapter diagnostics status", loaded.adapterDiagnostics.status, "pass");
  assertEqual("P0 governed catalog schemaId", loaded.governedCatalog.schemaId, "runtime-catalog.v0");
  assertEqual("P0 adapter diagnostics runId", loaded.adapterDiagnostics.runId, loaded.p0Evidence.runId);

  const p0EvidenceEntry = findSingleArtifactEntry(loaded.p0Evidence.artifacts, `${P0_ARTIFACT_ROOT}/evidence.json`, "P0 evidence artifacts");
  const p0CatalogEntry = findSingleArtifactEntry(loaded.p0Evidence.artifacts, EXPECTED_ARGS.catalog, "P0 evidence artifacts");
  const p0AdapterEntry = findSingleArtifactEntry(loaded.p0Evidence.artifacts, `${P0_ARTIFACT_ROOT}/adapter-diagnostics.json`, "P0 evidence artifacts");
  assertRefEqual(evidence.upstream.p0EvidenceRef, p0EvidenceEntry, "P1 upstream.p0EvidenceRef");
  assertRefEqual(evidence.upstream.governedCatalogRef, p0CatalogEntry, "P1 upstream.governedCatalogRef");
  assertRefEqual(evidence.upstream.adapterDiagnosticsRef, p0AdapterEntry, "P1 upstream.adapterDiagnosticsRef");
  assertRefEqual(loaded.adapterDiagnostics.catalogRef, evidence.upstream.governedCatalogRef, "P0 adapter diagnostics catalogRef");
}

function verifyRuntimeProjection({ evidence, loaded }) {
  const projection = loaded.projection;
  assertEqual("P1 runtime projection adapter", projection.adapter, evidence.adapter);
  assertRefEqual(projection.p0EvidenceRef, evidence.upstream.p0EvidenceRef, "runtime projection p0EvidenceRef");
  assertRefEqual(projection.adapterDiagnosticsRef, evidence.upstream.adapterDiagnosticsRef, "runtime projection adapterDiagnosticsRef");
  assertJsonEqual("runtime projection catalogRef", projection.catalogRef, {
    ...evidence.upstream.governedCatalogRef,
    sourceEvidenceHash: evidence.upstream.p0EvidenceRef.hash
  });
  assertEqual("runtime projection provenance.runId", projection.provenance?.runId, evidence.runId);
  assertEqual("runtime projection provenance.sourceHash", projection.provenance?.sourceHash, evidence.upstream.governedCatalogRef.hash);
}

async function verifyRuntimeReportAndRenderPlans({ evidence, loaded }) {
  const report = loaded.report;
  assertRefEqual(report.runtimeProjectionRef, evidence.runtimeProjectionRef, "P1 report runtimeProjectionRef");
  assertRefEqual(report.projectionRef, evidence.runtimeProjectionRef, "P1 report projectionRef");
  if (!Array.isArray(report.renderPlans) || report.renderPlans.length !== EXPECTED_RENDER_PLAN_PATHS.length) {
    throw contractError("P1 report renderPlans must match expected render plan refs");
  }
  if (!Array.isArray(evidence.renderPlanRefs) || evidence.renderPlanRefs.length !== EXPECTED_RENDER_PLAN_PATHS.length) {
    throw contractError("P1 evidence renderPlanRefs must match expected render plan refs");
  }

  for (const [index, expectedPath] of EXPECTED_RENDER_PLAN_PATHS.entries()) {
    const evidenceRef = evidence.renderPlanRefs[index];
    const reportRef = report.renderPlans[index];
    const loadedPlan = loaded.renderPlans[index];
    assertEqual(`renderPlanRefs[${index}].path`, evidenceRef.path, expectedPath);
    assertEqual(`report.renderPlans[${index}].artifactPath`, reportRef.artifactPath, expectedPath);
    assertEqual(`loaded render plan path ${index}`, loadedPlan.path, expectedPath);
    assertEqual(`renderPlanRefs[${index}].promotionStatus`, evidenceRef.promotionStatus, "allowed");
    assertEqual(`report.renderPlans[${index}].promotionStatus`, reportRef.promotionStatus, "allowed");
    assertEqual(`report.renderPlans[${index}].hashAlgorithm`, reportRef.hashAlgorithm, "sha256");
    assertEqual(`report.renderPlans[${index}].hash`, reportRef.hash, evidenceRef.hash);
    assertJsonEqual(`report.renderPlans[${index}].surfaceRef`, reportRef.surfaceRef, evidenceRef.surfaceRef);

    const plan = loadedPlan.plan;
    assertEqual(`render plan ${expectedPath} adapter`, plan.adapter, evidence.adapter);
    assertEqual(`render plan ${expectedPath} promotionStatus`, plan.promotionStatus, "allowed");
    assertRefEqual(plan.projectionRef, evidence.runtimeProjectionRef, `render plan ${expectedPath} projectionRef`);
    assertJsonEqual(`render plan ${expectedPath} surfaceRef`, plan.surfaceRef, evidenceRef.surfaceRef);
    assertEqual(`render plan ${expectedPath} provenance.runId`, plan.provenance?.runId, evidence.runId);
    assertEqual(`render plan ${expectedPath} provenance.artifactPath`, plan.provenance?.artifactPath, expectedPath);
    if (!Array.isArray(plan.sideEffects) || plan.sideEffects.length !== 0) {
      throw contractError(`render plan ${expectedPath} must not record executable side effects`);
    }
    const surfaceHash = await hashJsonArtifact(evidenceRef.surfaceRef.path);
    assertEqual(`render plan ${expectedPath} surfaceRef.hash`, evidenceRef.surfaceRef.hash, surfaceHash);
  }
}

function buildDemoData({ evidence, verification, loaded, evidencePath, outDir, expectedArtifactPaths }) {
  const results = evidence.validationResults || loaded.report.results || [];
  const diagnostics = evidence.diagnostics || loaded.report.diagnostics || [];
  const renderPlans = loaded.renderPlans.map(({ path: artifactPath, plan }) => ({
    artifactPath,
    surfacePath: refPathFor(plan.surfaceRef || {}) || plan.surfaceRef?.fixturePath || null,
    promotionStatus: plan.promotionStatus || "allowed",
    schemaId: plan.schemaId || null,
    actions: Array.isArray(plan.actions) ? plan.actions : [],
    sideEffects: Array.isArray(plan.sideEffects) ? plan.sideEffects : [],
    tree: plan.tree || null,
    diagnostics: Array.isArray(plan.diagnostics) ? plan.diagnostics : [],
    raw: plan
  }));

  return {
    title: "Surfaces P1 Demo",
    generatedFrom: evidencePath.posixPath,
    outputPath: outDir.posixPath,
    expectedArtifactPaths,
    summary: {
      schemaId: evidence.schemaId || null,
      contractId: evidence.contractId || null,
      runId: evidence.runId || loaded.report.runId || null,
      status: evidence.status,
      promotionStatus: evidence.promotionStatus,
      adapter: loaded.projection.adapter || loaded.report.adapter || "web-static",
      checkedAt: evidence.checkedAt || evidence.generatedAt || null,
      selfHash: verification.selfHash,
      resultCount: results.length,
      diagnosticCount: diagnostics.length,
      renderPlanCount: renderPlans.length,
      sideEffectCount: renderPlans.reduce((count, plan) => count + plan.sideEffects.length, 0)
    },
    projection: loaded.projection,
    report: loaded.report,
    renderPlans,
    results: sortResults(results),
    diagnostics: sortDiagnostics(diagnostics),
    artifacts: verification.artifactRefs.map((ref) => ({
      path: ref.path,
      schemaId: ref.schemaId,
      hash: ref.hash
    })),
    boundaryRefs: verification.boundaryRefs.map((ref) => ({
      path: ref.path,
      schemaId: ref.schemaId,
      hash: ref.hash
    }))
  };
}

async function writeDemo(outDir, data) {
  await ensureDirectory(outDir);
  await writeRegularFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
  await writeRegularFile(path.join(outDir.fsPath, "README.md"), buildReadme(data));
}

function buildHtml(data) {
  const statusClass = statusToken(data.summary.promotionStatus);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'">
  <title>${escapeHtml(data.title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fa;
      --ink: #1f2328;
      --muted: #59636e;
      --panel: #ffffff;
      --line: #d8dee4;
      --line-strong: #afb8c1;
      --green: #0f7a5f;
      --green-bg: #e7f6ef;
      --amber: #9a6700;
      --amber-bg: #fff4d6;
      --red: #b42318;
      --red-bg: #fde8e4;
      --blue: #0b5cad;
      --blue-bg: #eaf2ff;
      --shadow: 0 1px 2px rgba(31, 35, 40, 0.08);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      background: var(--bg);
      color: var(--ink);
      letter-spacing: 0;
    }
    .shell {
      width: min(1280px, 100%);
      margin: 0 auto;
      padding: 24px;
    }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 20px;
      align-items: start;
      border-bottom: 1px solid var(--line);
      padding-bottom: 18px;
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 {
      margin-bottom: 8px;
      font-size: 32px;
      line-height: 1.1;
    }
    h2 {
      margin-bottom: 12px;
      font-size: 20px;
      line-height: 1.2;
    }
    h3 {
      margin-bottom: 8px;
      font-size: 16px;
      line-height: 1.25;
    }
    .meta {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }
    .status-strip {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 4px 9px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .pill.allowed, .pill.pass {
      border-color: #94d3bd;
      background: var(--green-bg);
      color: var(--green);
    }
    .pill.review_required, .pill.review {
      border-color: #f0cc75;
      background: var(--amber-bg);
      color: var(--amber);
    }
    .pill.blocked, .pill.fail, .pill.invalid {
      border-color: #f0aaa0;
      background: var(--red-bg);
      color: var(--red);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin: 18px 0;
    }
    .metric, .panel, .surface {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }
    .metric {
      min-height: 92px;
      padding: 14px;
    }
    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .metric strong {
      display: block;
      margin-top: 8px;
      font-size: 24px;
      line-height: 1.1;
      word-break: break-word;
    }
    .section {
      margin: 22px 0;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      border-bottom: 1px solid var(--line);
      padding: 13px 14px;
    }
    .panel-header h2, .panel-header h3 {
      margin: 0;
    }
    .panel-body {
      padding: 14px;
    }
    .surfaces {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .surface-preview {
      display: grid;
      gap: 10px;
      min-height: 220px;
      padding: 16px;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #fbfcfd;
    }
    .surface-node {
      display: grid;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: #ffffff;
    }
    .node-kicker {
      color: var(--blue);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .prop-list, .detail-list {
      display: grid;
      gap: 6px;
      margin: 0;
    }
    .prop-list div, .detail-list div {
      display: grid;
      grid-template-columns: minmax(96px, 0.35fr) minmax(0, 1fr);
      gap: 8px;
      align-items: start;
    }
    dt {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }
    dd {
      margin: 0;
      word-break: break-word;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .inert-action {
      display: inline-flex;
      min-height: 34px;
      align-items: center;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      padding: 6px 10px;
      background: var(--blue-bg);
      color: var(--blue);
      font-size: 13px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 9px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    pre {
      max-height: 420px;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      margin: 0;
      padding: 12px;
      background: #f6f8fa;
      font-size: 12px;
      line-height: 1.45;
    }
    .two-col {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
    }
    @media (max-width: 980px) {
      header, .two-col, .surfaces { grid-template-columns: 1fr; }
      .status-strip { justify-content: flex-start; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .shell { padding: 16px; }
      .grid { grid-template-columns: 1fr; }
      .prop-list div, .detail-list div { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div>
        <h1>${escapeHtml(data.title)}</h1>
        <p class="meta">Generated from <code>${escapeHtml(data.generatedFrom)}</code>. Demo output is presentation-only and is checked by deterministic rebuild drift.</p>
      </div>
      <div class="status-strip">
        ${pill(data.summary.status)}
        <span class="pill ${statusClass}">${escapeHtml(data.summary.promotionStatus)}</span>
        <span class="pill">${escapeHtml(data.summary.adapter)}</span>
      </div>
    </header>

    <section class="grid" aria-label="P1 proof summary">
      ${metric("Run", data.summary.runId || "unrecorded")}
      ${metric("Render plans", String(data.summary.renderPlanCount))}
      ${metric("Results", String(data.summary.resultCount))}
      ${metric("Diagnostics", String(data.summary.diagnosticCount))}
    </section>

    <section class="section">
      <div class="surfaces">
        ${data.renderPlans.map(renderPlanPanel).join("\n")}
      </div>
    </section>

    <section class="section two-col">
      <article class="panel">
        <div class="panel-header"><h2>Outcomes</h2><span class="pill">${escapeHtml(String(data.results.length))}</span></div>
        <div class="panel-body">${resultsTable(data.results)}</div>
      </article>
      <article class="panel">
        <div class="panel-header"><h2>Diagnostics</h2><span class="pill">${escapeHtml(String(data.diagnostics.length))}</span></div>
        <div class="panel-body">${diagnosticsTable(data.diagnostics)}</div>
      </article>
    </section>

    <section class="section two-col">
      <article class="panel">
        <div class="panel-header"><h2>Evidence</h2>${pill(data.summary.promotionStatus)}</div>
        <div class="panel-body">
          <dl class="detail-list">
            ${detail("Schema", data.summary.schemaId)}
            ${detail("Contract", data.summary.contractId)}
            ${detail("Checked", data.summary.checkedAt)}
            ${detail("Self hash", data.summary.selfHash)}
            ${detail("Output", data.outputPath)}
          </dl>
        </div>
      </article>
      <article class="panel">
        <div class="panel-header"><h2>Artifacts</h2><span class="pill">${escapeHtml(String(data.artifacts.length))}</span></div>
        <div class="panel-body">${artifactsTable(data.artifacts)}</div>
      </article>
    </section>

    <section class="section two-col">
      <article class="panel">
        <div class="panel-header"><h2>Projection</h2><span class="pill">${escapeHtml(data.summary.adapter)}</span></div>
        <div class="panel-body"><pre>${escapeHtml(stableJson(data.projection))}</pre></div>
      </article>
      <article class="panel">
        <div class="panel-header"><h2>Adapter Report</h2>${pill(data.report.promotionStatus || data.summary.promotionStatus)}</div>
        <div class="panel-body"><pre>${escapeHtml(stableJson(data.report))}</pre></div>
      </article>
    </section>
  </main>
</body>
</html>
`;
}

function buildReadme(data) {
  const artifactRows = data.artifacts
    .map((artifact) => `- \`${artifact.path}\` (${artifact.schemaId || "schema unknown"}): \`${artifact.hash}\``)
    .join("\n");
  const boundaryRows = data.boundaryRefs.length > 0 ?
    data.boundaryRefs.map((ref) => `- \`${ref.path}\` (${ref.schemaId || "schema unknown"}): \`${ref.hash}\``).join("\n") :
    "- No P1 boundary refs were recorded beyond artifact refs.";

  return `# Surfaces P1 Demo

Generated by \`npm run build:p1-demo\` from \`${data.generatedFrom}\`.

## Status

- Evidence status: \`${data.summary.status}\`
- Promotion status: \`${data.summary.promotionStatus}\`
- Adapter: \`${data.summary.adapter}\`
- Run ID: \`${data.summary.runId || "unrecorded"}\`
- Evidence self hash: \`${data.summary.selfHash}\`

## P1 Artifacts

${artifactRows}

## P1 Boundary Refs

${boundaryRows}

This demo contains deterministic static HTML only. It has no external assets, network fetches, scripts, forms, or executable actions. Demo output is not included in P1 evidence hashes; CI governs it through deterministic rebuild drift checks.
`;
}

function renderPlanPanel(renderPlan) {
  const previewSections = [
    renderTree(renderPlan.tree),
    renderActions(renderPlan.actions),
    renderSideEffects(renderPlan.sideEffects)
  ].filter(Boolean).join("\n");
  return `<article class="surface">
  <div class="panel-header">
    <h2>${escapeHtml(labelForRenderPlan(renderPlan))}</h2>
    ${pill(renderPlan.promotionStatus)}
  </div>
  <div class="panel-body">
    <div class="surface-preview">
      ${previewSections}
    </div>
    <dl class="detail-list">
      ${detail("Artifact", renderPlan.artifactPath)}
      ${detail("Surface", renderPlan.surfacePath)}
      ${detail("Schema", renderPlan.schemaId)}
    </dl>
  </div>
</article>`;
}

function renderTree(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return `<pre>${escapeHtml(stableJson(node))}</pre>`;
  }
  const component = stringOrNull(node.component) || stringOrNull(node.type) || stringOrNull(node.nodeId) || "SurfaceNode";
  const role = stringOrNull(node.role);
  const name = stringOrNull(node.name) || stringOrNull(node.props?.heading) || stringOrNull(node.props?.title) || stringOrNull(node.props?.label);
  const description = stringOrNull(node.description);
  const props = node.props && typeof node.props === "object" && !Array.isArray(node.props) ? node.props : {};
  const children = Array.isArray(node.children) ? node.children : [];
  const roleAttribute = role ? ` role="${escapeAttribute(role)}"` : "";
  const labelAttribute = name ? ` aria-label="${escapeAttribute(name)}"` : "";
  const nodeSections = [
    `<div class="node-kicker">${escapeHtml(component)}</div>`,
    name ? `<h3>${escapeHtml(name)}</h3>` : "",
    description ? `<p>${escapeHtml(description)}</p>` : "",
    propsList(props),
    children.map(renderTree).join("\n")
  ].filter(Boolean).join("\n  ");

  return `<section class="surface-node"${roleAttribute}${labelAttribute}>
  ${nodeSections}
</section>`;
}

function propsList(props) {
  const entries = Object.entries(props)
    .filter(([, value]) => value !== null && value !== undefined)
    .sort(([a], [b]) => compareText(a, b));
  if (entries.length === 0) return "";
  return `<dl class="prop-list">${entries.map(([key, value]) => detail(key, primitiveSummary(value))).join("")}</dl>`;
}

function renderActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return "";
  const items = actions.map((action) => {
    const label = stringOrNull(action.label) || stringOrNull(action.actionId) || "action";
    const suffix = action.reviewRequired ? " review required" : action.disabled ? " disabled" : " inert";
    return `<span class="inert-action" aria-disabled="true">${escapeHtml(`${label} (${suffix.trim()})`)}</span>`;
  }).join("");
  return `<div class="actions">${items}</div>`;
}

function renderSideEffects(sideEffects) {
  if (!Array.isArray(sideEffects) || sideEffects.length === 0) return "";
  return `<p class="meta">Side effects recorded: ${escapeHtml(String(sideEffects.length))}</p>`;
}

function resultsTable(results) {
  if (!Array.isArray(results) || results.length === 0) return `<p class="meta">No validation results recorded.</p>`;
  return table(["Fixture", "Result", "Promotion", "Matched"], results.map((result) => [
    result.fixturePath || result.artifactPath || "unrecorded",
    result.actualValidationResult || result.validationResult || "unrecorded",
    result.actualPromotionStatus || result.promotionStatus || "unrecorded",
    result.matched === false ? "false" : "true"
  ]));
}

function diagnosticsTable(diagnostics) {
  if (!Array.isArray(diagnostics) || diagnostics.length === 0) return `<p class="meta">No diagnostics recorded.</p>`;
  return table(["Code", "Severity", "Stage", "Artifact"], diagnostics.map((diagnostic) => [
    diagnostic.code || "unrecorded",
    diagnostic.severity || "unrecorded",
    diagnostic.stage || "unrecorded",
    diagnostic.artifactPath || "unrecorded"
  ]));
}

function artifactsTable(artifacts) {
  return table(["Path", "Schema", "Hash"], artifacts.map((artifact) => [
    artifact.path,
    artifact.schemaId || "unrecorded",
    artifact.hash
  ]));
}

function table(headers, rows) {
  return `<table>
  <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cellHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
</table>`;
}

function metric(label, value) {
  return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function detail(label, value) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${cellHtml(value ?? "unrecorded")}</dd></div>`;
}

function pill(value) {
  return `<span class="pill ${statusToken(value)}">${escapeHtml(String(value ?? "unrecorded"))}</span>`;
}

function cellHtml(value) {
  if (typeof value === "string" && (value.includes("/") || /^[a-f0-9]{32,}$/.test(value))) {
    return `<code>${escapeHtml(shortenHash(value))}</code>`;
  }
  return escapeHtml(String(value));
}

function labelForRenderPlan(renderPlan) {
  const file = renderPlan.artifactPath.split("/").pop() || renderPlan.artifactPath;
  return file.replace(/^render-plan\./, "").replace(/\.json$/, "").replace(/-/g, " ");
}

function statusToken(value) {
  const token = String(value || "").toLowerCase();
  return STATUS_ORDER.includes(token) || token === "pass" || token === "fail" || token === "invalid" ? token : "";
}

function sortResults(results) {
  if (!Array.isArray(results)) return [];
  return [...results].sort((a, b) => compareText(a.fixturePath || a.artifactPath || "", b.fixturePath || b.artifactPath || ""));
}

function sortDiagnostics(diagnostics) {
  if (!Array.isArray(diagnostics)) return [];
  return [...diagnostics].sort((a, b) =>
    compareText(a.artifactPath || "", b.artifactPath || "") ||
    compareText(a.stage || "", b.stage || "") ||
    compareText(a.code || "", b.code || "") ||
    compareText(a.path || a.instanceLocation || "", b.path || b.instanceLocation || "")
  );
}

function findSingleArtifactEntry(entries, artifactPath, label) {
  if (!Array.isArray(entries)) {
    throw contractError(`${label} must be an array`);
  }
  const matches = entries.filter((entry) => refPathFor(entry) === artifactPath);
  if (matches.length !== 1) {
    throw contractError(`${label} must contain exactly one ref for ${artifactPath}`);
  }
  return matches[0];
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw contractError(`${label} mismatch: expected ${formatValue(expected)}, got ${formatValue(actual)}`);
  }
}

function assertJsonEqual(label, actual, expected) {
  if (actual === undefined || expected === undefined) {
    if (actual !== expected) {
      throw contractError(`${label} mismatch: expected ${formatValue(expected)}, got ${formatValue(actual)}`);
    }
    return;
  }
  const actualJson = canonicalJson(actual);
  const expectedJson = canonicalJson(expected);
  if (actualJson !== expectedJson) {
    throw contractError(`${label} mismatch: expected ${expectedJson}, got ${actualJson}`);
  }
}

function assertRefEqual(actual, expected, label) {
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) {
    throw contractError(`${label} must be an object ref`);
  }
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) {
    throw contractError(`${label} expected ref must be an object`);
  }
  assertEqual(`${label}.path`, refPathFor(actual), refPathFor(expected));
  assertEqual(`${label}.schemaId`, actual.schemaId, expected.schemaId);
  assertEqual(`${label}.hashAlgorithm`, actual.hashAlgorithm, expected.hashAlgorithm);
  assertEqual(`${label}.hash`, actual.hash, expected.hash);
}

async function ensureDirectory(dir) {
  try {
    const stat = await fs.lstat(dir.fsPath);
    if (!stat.isDirectory()) {
      throw contractError(`demo output path must be a directory: ${dir.posixPath}`);
    }
    if (stat.isSymbolicLink()) {
      throw contractError(`demo output path must not be a symlink: ${dir.posixPath}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.mkdir(dir.fsPath, { recursive: true });
  }
}

async function writeRegularFile(filePath, content) {
  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile()) {
      throw contractError(`refusing to overwrite non-regular demo output: ${toPosixPath(path.relative(ROOT, filePath))}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.writeFile(filePath, content, "utf8");
}

async function readJsonFile(file, label) {
  let stat;
  try {
    stat = await fs.lstat(file.fsPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw contractError(`${label} is missing: ${file.posixPath}`);
    }
    throw error;
  }
  if (!stat.isFile()) {
    throw contractError(`${label} must be a regular file: ${file.posixPath}`);
  }
  try {
    return JSON.parse(await fs.readFile(file.fsPath, "utf8"));
  } catch (error) {
    throw contractError(`${label} is not valid JSON: ${error.message}`);
  }
}

function isUnderArtifactRoot(refPath, artifactRoot) {
  return refPath === artifactRoot || refPath.startsWith(`${artifactRoot}/`);
}

function canonicalJson(value) {
  assertIJson(value);
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const keys = Object.keys(value).sort((a, b) => compareText(a, b));
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function assertIJson(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw contractError("canonical JSON requires finite JSON numbers");
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw contractError("canonical JSON requires integer numbers to be IEEE-754 safe integers");
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertIJson(item);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (nested === undefined) {
      throw contractError(`canonical JSON cannot serialize undefined at ${key}`);
    }
    assertIJson(nested);
  }
}

function stableJson(value) {
  return JSON.stringify(stabilize(value), null, 2);
}

function stabilize(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stabilize);
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stabilize(value[key])]));
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function dedupe(values) {
  return [...new Set(values)];
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function toPosixPath(value) {
  return value.split(path.sep).join(path.posix.sep);
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function primitiveSummary(value) {
  if (value === null) return "null";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  return stableJson(value);
}

function shortenHash(value) {
  return /^[a-f0-9]{64}$/.test(value) ? `${value.slice(0, 18)}...` : value;
}

function formatValue(value) {
  return value === undefined ? "undefined" : JSON.stringify(value);
}

function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) return "no error details";
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message || "validation error"}`)
    .join("; ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function contractError(message) {
  const error = new Error(message);
  error.exitCode = 1;
  return error;
}

function usageError(message) {
  const error = new Error(message);
  error.exitCode = 2;
  return error;
}
