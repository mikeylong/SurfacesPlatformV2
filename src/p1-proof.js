import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { buildP1Schemas } from "./p1-contract.js";

const TIMESTAMP = "1970-01-01T00:00:00.000Z";
const VERSION = "0.0.0";
const ADAPTER = "web-static";
const SCHEMA_ROOT = "schemas";
const FIXTURE_ROOT = "fixtures/p1";
const ARTIFACT_ROOT = "artifacts/p1";
const P0_FIXTURE_ROOT = "fixtures/p0";
const P0_ARTIFACT_ROOT = "artifacts/p0";
const EXPECTED_OUT = [
  "runtime-projection.json",
  "render-plan.confirm-panel.json",
  "render-plan.status-callout.json",
  "render-plan.button-defaults.json",
  "runtime-adapter-report.json",
  "evidence.json"
];
const P1_SCHEMA_FILES = [
  "runtime-projection.v0.schema.json",
  "render-plan.v0.schema.json",
  "runtime-adapter-report.v0.schema.json",
  "runtime-adapter-evidence.v0.schema.json",
  "runtime-adapter-expectations.v0.schema.json",
  "runtime-adapter-diagnostics.v0.schema.json"
];
const P0_SCHEMA_FILES = [
  "runtime-catalog.v0.schema.json",
  "surface-ir.v0.schema.json",
  "fixture-expectations.v0.schema.json",
  "extract.v0.schema.json",
  "adapter-diagnostics.v0.schema.json",
  "evidence.v0.schema.json",
  "diagnostics.v0.schema.json"
];
const P1_SCHEMA_IDS = Object.freeze(Object.fromEntries(
  P1_SCHEMA_FILES.map((file) => [file, file.replace(/\.schema\.json$/, "")])
));
const P0_SCHEMA_IDS = Object.freeze(Object.fromEntries(
  P0_SCHEMA_FILES.map((file) => [file, file.replace(/\.schema\.json$/, "")])
));
const P1_MUTATION_FILES = [
  "missing-catalog-ref.runtime-projection.json",
  "catalog-hash-mismatch.runtime-projection.json",
  "projection-authority-escalation.runtime-projection.json",
  "missing-render-plan-provenance.render-plan.json",
  "runtime-projection-hash-mismatch.runtime-adapter-report.json",
  "hash-mismatch.runtime-adapter-evidence.json"
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
const INHERITED_P0_DIAGNOSTIC_CODES = new Set([
  "ACCESSIBILITY_MODAL_UNSUPPORTED",
  "CATALOG_INVALID_VALUE",
  "CATALOG_UNKNOWN_COMPONENT",
  "CATALOG_UNKNOWN_PROP"
]);
const STAGE_ORDER = new Map([
  ["projection", 0],
  ["runtime-boundary", 1],
  ["evidence", 2]
]);

const ENVIRONMENT = Object.freeze({
  golden: true,
  timestampMode: "normalized",
  timestampOverride: null,
  timezone: "UTC",
  locale: "en-US-POSIX",
  pathStyle: "posix-relative",
  jsonCanonicalization: "rfc8785",
  numberSerialization: "rfc8785",
  schemaOutputFormat: "basic",
  host: null
});

const P1_REGISTRY_ROWS = [
  row({
    code: "PROJECTION_CATALOG_REF_MISSING",
    trigger: "Runtime projection omits its governed catalog reference",
    message: "Runtime projection governed catalog reference is missing.",
    severity: "error",
    diagnosticSource: "runtime-projection-validator",
    stage: "projection",
    phase: "projection-mutation",
    artifactPath: "fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json",
    pointer: "/catalogRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the projection and regenerate it from the governed P0 catalog.",
    coverage: "mutations/missing-catalog-ref.runtime-projection.json"
  }),
  row({
    code: "PROJECTION_SOURCE_HASH_MISMATCH",
    trigger: "Runtime projection catalog hash differs from P0 evidence",
    message: "Runtime projection governed catalog hash does not match P0 evidence.",
    severity: "error",
    diagnosticSource: "runtime-projection-validator",
    stage: "projection",
    phase: "projection-mutation",
    artifactPath: "fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json",
    pointer: "/catalogRef/hash",
    sourceRef: "fixture://p1/mutations/catalog-hash-mismatch.runtime-projection#/catalogRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the projection and regenerate it from the accepted P0 catalog ref.",
    coverage: "mutations/catalog-hash-mismatch.runtime-projection.json"
  }),
  row({
    code: "PROJECTION_AUTHORITY_ESCALATION",
    trigger: "Runtime projection grants component, prop, action, token, data-binding, or governance authority absent from the governed catalog",
    message: "Runtime projection grants authority absent from the governed catalog.",
    severity: "error",
    diagnosticSource: "runtime-projection-validator",
    stage: "projection",
    phase: "projection-mutation",
    artifactPath: "fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json",
    pointer: "/components/ConfirmPanel/actions/escalate",
    sourceRef: "fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the projection and remove non-catalog authority before proof continues.",
    coverage: "mutations/projection-authority-escalation.runtime-projection.json"
  }),
  row({
    code: "RUNTIME_PROJECTION_HASH_MISMATCH",
    trigger: "Adapter proof consumes runtime projection metadata whose hash differs from the current projection artifact",
    message: "Runtime projection hash does not match adapter proof metadata.",
    severity: "error",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-adapter",
    artifactPath: "fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json",
    pointer: "/runtimeProjectionRef/hash",
    sourceRef: "fixture://p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report#/runtimeProjectionRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the adapter report and regenerate proof artifacts from the current runtime projection.",
    coverage: "mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json"
  }),
  row({
    code: "RUNTIME_RENDER_PLAN_PROVENANCE_MISSING",
    trigger: "Render plan omits required provenance",
    message: "Render plan provenance is missing.",
    severity: "error",
    diagnosticSource: "render-plan-validator",
    stage: "runtime-boundary",
    phase: "runtime-adapter",
    artifactPath: "fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json",
    pointer: "/provenance",
    sourceRef: "fixture://p1/valid/confirm-panel#/root",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the render plan and regenerate it with required provenance.",
    coverage: "mutations/missing-render-plan-provenance.render-plan.json"
  }),
  row({
    code: "RUNTIME_ACTION_EXECUTION_BLOCKED",
    trigger: "Runtime proof encounters disabled or unsupported action execution",
    message: "Runtime action execution is blocked by the governed catalog.",
    severity: "error",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "fixtures/p1/invalid/disabled-action-execution.surface-ir.json",
    pointer: "/instances/secondaryAction/actions/dismiss/execute",
    sourceRef: "fixture://p1/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions.",
    coverage: "invalid/disabled-action-execution.surface-ir.json"
  }),
  row({
    code: "RUNTIME_PROJECTION_MEMBER_UNKNOWN",
    trigger: "Runtime Surface IR references a component member or token absent from the runtime projection",
    message: "Runtime Surface IR references authority absent from the runtime projection.",
    severity: "error",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "runtime-surface-fixture",
    pointer: "/",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage and correct the Surface IR against the runtime projection.",
    coverage: "manifest-wide",
    dynamicLocation: true
  }),
  row({
    code: "RUNTIME_REVIEW_REQUIRED",
    trigger: "Runtime proof encounters structurally valid usage that requires review",
    message: "Runtime usage requires review before unattended promotion.",
    severity: "review",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-review",
    artifactPath: "fixtures/p1/review/review-required-action.surface-ir.json",
    pointer: "/root/actions/confirm/execute",
    sourceRef: "fixture://p1/review/review-required-action#/root/actions/confirm",
    validationResult: "review_required",
    promotionStatus: "review_required",
    suggestedAction: "Preserve review status in report and evidence, and do not emit executable output for the action.",
    coverage: "review/review-required-action.surface-ir.json"
  }),
  row({
    code: "RUNTIME_EVIDENCE_HASH_MISMATCH",
    trigger: "Runtime adapter evidence hash differs from manifest or self-hash rule",
    message: "Runtime adapter evidence hash does not match the manifest or self-hash rule.",
    severity: "error",
    diagnosticSource: "evidence-validator",
    stage: "evidence",
    phase: "runtime-evidence",
    artifactPath: "fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json",
    pointer: "/artifacts/0/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the evidence and regenerate it from current proof artifacts.",
    coverage: "mutations/hash-mismatch.runtime-adapter-evidence.json"
  })
];

const P1_REGISTRY_BY_COVERAGE = new Map(P1_REGISTRY_ROWS.map((entry) => [entry.coverage, entry]));
const P1_REGISTRY_BY_ARTIFACT = new Map(P1_REGISTRY_ROWS.map((entry) => [entry.artifactPath, entry]));

function row(input) {
  return input;
}

export async function runP1Interfacectl(argv, io) {
  const parsed = parseAdapterProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runAdapterProof({
      cwd: io.cwd,
      catalogPath: parsed.catalog,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: "interfacectl surfaces adapter proof",
      args: { catalog: parsed.catalog, fixture: parsed.fixture, out: parsed.out }
    });
    io.stdout.write([
      `surfaces adapter proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `renderPlans: ${result.renderPlans.join(", ")}`,
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

function parseAdapterProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--catalog") {
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
  if (!result.catalog || !result.fixture || !result.out) {
    return { ok: false, error: "usage: interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1" };
  }
  for (const [flagName, value] of [["--catalog", result.catalog], ["--fixture", result.fixture], ["--out", result.out]]) {
    const parsed = parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    if (flagName === "--catalog") result.catalog = parsed.path;
    if (flagName === "--fixture") result.fixture = parsed.path;
    if (flagName === "--out") result.out = parsed.path;
  }
  return { ok: true, catalog: result.catalog, fixture: result.fixture, out: result.out };
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

export async function runAdapterProof({ cwd, catalogPath, fixtureRoot, outRoot, command, args }) {
  assertP1CommandRoots(catalogPath, fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertReadableDir(path.join(cwd, SCHEMA_ROOT), `unreadable schema path: ${SCHEMA_ROOT}`);
  await assertRequiredP1Files(cwd, fixtureRoot);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const p0 = await p0Preflight(cwd, catalogPath, validators);
  const manifestPath = `${fixtureRoot}/expectations.manifest.json`;
  const manifest = await readJson(path.join(cwd, manifestPath));
  assertSchema(validators, "p1", "runtime-adapter-expectations.v0", manifest, manifestPath);
  await assertP1Manifest(cwd, manifest, fixtureRoot, outRoot);

  const runId = buildRunId(p0, command, args, manifest);
  let projection = buildRuntimeProjection(p0, runId);
  assertSchema(validators, "p1", "runtime-projection.v0", projection, `${outRoot}/runtime-projection.json`);
  await writeJson(path.join(cwd, outRoot, "runtime-projection.json"), projection);
  const persistedProjection = await readJson(path.join(cwd, outRoot, "runtime-projection.json"));
  assertSchema(validators, "p1", "runtime-projection.v0", persistedProjection, `${outRoot}/runtime-projection.json`);
  if (canonicalJson(persistedProjection) !== canonicalJson(projection)) {
    throw contractError("P1 runtime projection persisted artifact does not match generated projection", 1);
  }
  projection = persistedProjection;
  const projectionHash = await canonicalFileHash(path.join(cwd, outRoot, "runtime-projection.json"));
  const projectionRef = {
    path: `${outRoot}/runtime-projection.json`,
    schemaId: "runtime-projection.v0",
    hashAlgorithm: "sha256",
    hash: projectionHash
  };

  const validationResults = [];
  const renderPlans = [];
  const fixtureByPath = new Map();
  for (const inputPath of manifest.inputs) {
    fixtureByPath.set(inputPath, await readJson(path.join(cwd, inputPath)));
  }

  for (const expectation of manifest.expectations) {
    let actual;
    const fixture = fixtureByPath.get(expectation.fixturePath);
    if (expectation.fixtureKind === "mutation") {
      actual = await evaluateP1Mutation({
        fixture,
        expectation,
        p0,
        projectionRef
      });
    } else {
      assertSchema(validators, "p0", "surface-ir.v0", fixture, expectation.fixturePath);
      actual = evaluateP1SurfaceFixture(fixture, expectation, projection);
    }
    const matched = compareP1Expectation(expectation, actual);
    validationResults.push({
      fixturePath: expectation.fixturePath,
      fixtureKind: expectation.fixtureKind,
      expectedStage: expectation.expectedStage,
      actualStage: actual.stage,
      expectedPhase: expectation.expectedPhase,
      actualPhase: actual.phase,
      expectedValidationResult: expectation.validationResult,
      actualValidationResult: actual.validationResult,
      expectedPromotionStatus: expectation.promotionStatus,
      actualPromotionStatus: actual.promotionStatus,
      expectedDiagnosticCodes: expectation.expectedDiagnosticCodes,
      actualDiagnosticCodes: actual.diagnostics.map((diagnostic) => diagnostic.code),
      matched,
      artifactPath: expectation.expectedArtifactPath,
      jsonPointer: expectation.expectedJsonPointer,
      sourceRef: actual.sourceRef,
      renderPlanPath: expectation.renderPlanPath,
      diagnostics: actual.diagnostics
    });

    if (matched && expectation.fixtureKind === "valid" && expectation.renderPlanPath) {
      const plan = buildRenderPlan({
        runId,
        fixture,
        fixturePath: expectation.fixturePath,
        projectionRef,
        projection,
        outputPath: expectation.renderPlanPath
      });
      assertSchema(validators, "p1", "render-plan.v0", plan, expectation.renderPlanPath);
      await writeJson(path.join(cwd, expectation.renderPlanPath), plan);
      const hash = await canonicalFileHash(path.join(cwd, expectation.renderPlanPath));
      renderPlans.push({
        artifactPath: expectation.renderPlanPath,
        surfaceRef: plan.surfaceRef,
        promotionStatus: plan.promotionStatus,
        hashAlgorithm: "sha256",
        hash,
        provenance: plan.provenance
      });
    }
  }

  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const reportStatus = validationResults.every((result) => result.matched) ? "pass" : "fail";
  const reportPromotionStatus = reportStatus === "pass" ? aggregatePromotionStatus(validationResults) : "blocked";
  const report = {
    schemaId: "runtime-adapter-report.v0",
    version: VERSION,
    adapter: ADAPTER,
    runId,
    status: reportStatus,
    promotionStatus: reportPromotionStatus,
    runtimeProjectionRef: projectionRef,
    projectionRef,
    fixtureRoot,
    artifactRoot: outRoot,
    results: validationResults.map(stripP1ResultDiagnostics),
    renderPlans,
    diagnostics,
    diagnosticsRegistry: diagnosticsRegistryRows(),
    environment: { ...ENVIRONMENT },
    provenance: {
      evaluator: { name: "interfacectl-p1-adapter-proof", version: VERSION },
      command,
      args,
      checkedAt: TIMESTAMP
    }
  };
  assertRunExpectation(manifest, report);
  assertSchema(validators, "p1", "runtime-adapter-report.v0", report, `${outRoot}/runtime-adapter-report.json`);
  await writeJson(path.join(cwd, outRoot, "runtime-adapter-report.json"), report);

  const evidence = await buildP1Evidence({
    cwd,
    fixtureRoot,
    outRoot,
    command,
    args,
    runId,
    manifest,
    p0,
    projectionRef,
    renderPlans,
    report,
    validationResults,
    diagnostics,
    status: reportStatus
  });
  assertRunExpectation(manifest, evidence);
  assertSchema(validators, "p1", "runtime-adapter-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeJson(path.join(cwd, outRoot, "evidence.json"), evidence);

  const persisted = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persisted);
  const evidenceEntry = persisted.artifacts[persisted.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("P1 evidence self-hash verification failed", 1);
  }

  return {
    status: evidence.status,
    promotionStatus: evidence.promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    renderPlans: renderPlans.map((plan) => plan.artifactPath),
    artifacts: EXPECTED_OUT.map((file) => `${outRoot}/${file}`)
  };
}

function assertP1CommandRoots(catalogPath, fixtureRoot, outRoot) {
  if (catalogPath !== `${P0_ARTIFACT_ROOT}/governed-catalog.json` || fixtureRoot !== FIXTURE_ROOT || outRoot !== ARTIFACT_ROOT) {
    throw contractError(`P1 adapter proof requires --catalog ${P0_ARTIFACT_ROOT}/governed-catalog.json --fixture ${FIXTURE_ROOT} --out ${ARTIFACT_ROOT}`, 2);
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

async function assertRequiredP1Files(cwd, fixtureRoot) {
  const required = [
    ...P1_SCHEMA_FILES.map((file) => `${SCHEMA_ROOT}/${file}`),
    `${fixtureRoot}/expectations.manifest.json`,
    ...P1_VALID_FILES.map((file) => `${fixtureRoot}/valid/${file}`),
    ...P1_REVIEW_FILES.map((file) => `${fixtureRoot}/review/${file}`),
    ...P1_INVALID_FILES.map((file) => `${fixtureRoot}/invalid/${file}`),
    ...P1_MUTATION_FILES.map((file) => `${fixtureRoot}/mutations/${file}`)
  ];
  for (const relativePath of required) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing P1 required file: ${relativePath}`, 2);
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
  const allowed = new Set(EXPECTED_OUT);
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

async function p0Preflight(cwd, catalogPath, validators) {
  const evidencePath = `${P0_ARTIFACT_ROOT}/evidence.json`;
  const adapterDiagnosticsPath = `${P0_ARTIFACT_ROOT}/adapter-diagnostics.json`;
  const governedCatalogPath = `${P0_ARTIFACT_ROOT}/governed-catalog.json`;
  let evidence;
  let adapterDiagnostics;
  let governedCatalog;
  try {
    evidence = await readJson(path.join(cwd, evidencePath));
    adapterDiagnostics = await readJson(path.join(cwd, adapterDiagnosticsPath));
    governedCatalog = await readJson(path.join(cwd, governedCatalogPath));
  } catch {
    throw contractError("P0 preflight failed: required P0 artifacts are missing", 1);
  }

  assertSchema(validators, "p0", "evidence.v0", evidence, evidencePath);
  assertSchema(validators, "p0", "adapter-diagnostics.v0", adapterDiagnostics, adapterDiagnosticsPath);
  assertSchema(validators, "p0", "runtime-catalog.v0", governedCatalog, governedCatalogPath);
  assertNoDuplicateArtifactRefs("P0 evidence artifacts", evidence.artifacts);
  assertNoDuplicateResultFixtures("P0 evidence validationResults", evidence.validationResults);
  assertNoDuplicateResultFixtures("P0 adapter diagnostics results", adapterDiagnostics.results);
  assertNoDuplicateDiagnostics("P0 evidence diagnostics", evidence.diagnostics);
  assertNoDuplicateDiagnostics("P0 adapter diagnostics diagnostics", adapterDiagnostics.diagnostics);

  const evidenceEntry = findSingleArtifactRef(evidence, evidencePath);
  const catalogEntry = findSingleArtifactRef(evidence, governedCatalogPath);
  const adapterEntry = findSingleArtifactRef(evidence, adapterDiagnosticsPath);
  if (!evidenceEntry || !catalogEntry || !adapterEntry) {
    throw contractError("P0 preflight failed: evidence artifact refs are incomplete or duplicated", 1);
  }
  if (evidenceEntry.hash !== computeEvidenceSelfHash(evidence)) {
    throw contractError("P0 preflight failed: evidence self-hash is invalid", 1);
  }
  if (evidence.status !== "pass" || evidence.promotionStatus === "blocked") {
    throw contractError("P0 preflight failed: P0 evidence is not passing", 1);
  }
  if (adapterDiagnostics.status !== "pass") {
    throw contractError("P0 preflight failed: adapter diagnostics are not passing", 1);
  }
  if (evidence.runId !== adapterDiagnostics.runId) {
    throw contractError("P0 preflight failed: P0 run ids do not match", 1);
  }
  const catalogHash = await canonicalFileHash(path.join(cwd, governedCatalogPath));
  const adapterHash = await canonicalFileHash(path.join(cwd, adapterDiagnosticsPath));
  if (catalogEntry.hash !== catalogHash || adapterEntry.hash !== adapterHash) {
    throw contractError("P0 preflight failed: P0 artifact hashes do not match current files", 1);
  }
  if (catalogPath !== catalogEntry.path || catalogPath !== adapterDiagnostics.catalogRef?.path) {
    throw contractError("P0 preflight failed: catalog refs do not match command input", 1);
  }
  if (canonicalJson(adapterDiagnostics.catalogRef) !== canonicalJson({
    path: catalogEntry.path,
    schemaId: catalogEntry.schemaId,
    hashAlgorithm: catalogEntry.hashAlgorithm,
    hash: catalogEntry.hash
  })) {
    throw contractError("P0 preflight failed: adapter diagnostics catalogRef does not match P0 evidence", 1);
  }
  if (evidence.adapterDiagnosticsPath !== adapterDiagnosticsPath) {
    throw contractError("P0 preflight failed: adapter diagnostics path mismatch", 1);
  }

  return {
    evidence,
    adapterDiagnostics,
    governedCatalog,
    evidenceRef: refFromArtifactEntry(evidenceEntry),
    catalogRef: refFromArtifactEntry(catalogEntry),
    adapterDiagnosticsRef: refFromArtifactEntry(adapterEntry)
  };
}

function findSingleArtifactRef(evidence, artifactPath) {
  const matches = (evidence.artifacts || []).filter((entry) => entry.path === artifactPath);
  return matches.length === 1 ? matches[0] : null;
}

function refFromArtifactEntry(entry) {
  return {
    path: entry.path,
    schemaId: entry.schemaId,
    hashAlgorithm: entry.hashAlgorithm,
    hash: entry.hash
  };
}

async function assertP1Manifest(cwd, manifest, fixtureRoot, outRoot) {
  if (manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== SCHEMA_ROOT) {
    throw contractError("P1 expectations manifest roots do not match proof command paths", 1);
  }
  const expectedInputs = manifest.expectations.map((expectation) => expectation.fixturePath);
  assertOrderedPaths("P1 expectations manifest inputs", manifest.inputs, expectedInputs);
  assertNoDuplicatePaths("P1 expectations manifest inputs", manifest.inputs);
  assertNoDuplicatePaths("P1 expectations manifest expectations", expectedInputs);
  for (const inputPath of manifest.inputs) {
    assertPathUnderRoot(inputPath, fixtureRoot, "P1 expectations manifest input");
  }
  for (const expectation of manifest.expectations) {
    assertP1Expectation(expectation);
  }
  assertOrderedPaths("P1 expectations manifest artifactOrder", manifest.artifactOrder, artifactOrderFor(fixtureRoot, outRoot, manifest.inputs));

  const expectedFixtureFiles = [
    `${fixtureRoot}/expectations.manifest.json`,
    ...manifest.inputs
  ].sort();
  const expectedFixtureEntries = [
    ...expectedFixtureFiles,
    ...expectedDirectoryEntries(expectedFixtureFiles, fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("P1 fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

function assertP1Expectation(expectation) {
  const validKinds = new Set(["valid", "invalid", "review", "mutation"]);
  if (!validKinds.has(expectation.fixtureKind)) {
    throw contractError(`P1 expectation has invalid fixture kind for ${expectation.fixturePath}`, 1);
  }
  assertPathUnderRoot(expectation.fixturePath, FIXTURE_ROOT, "P1 expectation fixturePath");
  assertP1RelativePath(expectation.expectedArtifactPath, "P1 expectation expectedArtifactPath");
  if (expectation.expectedDiagnosticCodes.length === 0) {
    if (expectation.fixtureKind !== "valid" || expectation.promotionStatus !== "allowed" || expectation.validationResult !== "valid") {
      throw contractError(`P1 no-diagnostic expectation must be allowed valid fixture: ${expectation.fixturePath}`, 1);
    }
    if (expectation.renderPlanPath !== expectation.expectedArtifactPath) {
      throw contractError(`P1 valid expectation renderPlanPath must match expectedArtifactPath: ${expectation.fixturePath}`, 1);
    }
    assertPathUnderRoot(expectation.renderPlanPath, ARTIFACT_ROOT, "P1 expectation renderPlanPath");
    if (!EXPECTED_OUT.slice(1, 4).map((file) => `${ARTIFACT_ROOT}/${file}`).includes(expectation.renderPlanPath)) {
      throw contractError(`P1 valid expectation renderPlanPath is not a declared render-plan output: ${expectation.fixturePath}`, 1);
    }
    return;
  }
  if (expectation.renderPlanPath !== null) {
    throw contractError(`P1 diagnostic expectation must not declare renderPlanPath: ${expectation.fixturePath}`, 1);
  }
  const row = P1_REGISTRY_BY_ARTIFACT.get(expectation.expectedArtifactPath) || P1_REGISTRY_BY_ARTIFACT.get(expectation.fixturePath);
  if (!row && expectation.fixtureKind === "invalid" && expectation.expectedDiagnosticCodes[0] === "RUNTIME_PROJECTION_MEMBER_UNKNOWN") {
    if (expectation.expectedArtifactPath !== `${ARTIFACT_ROOT}/runtime-adapter-report.json`) {
      throw contractError(`P1 projection-member expectation must point at runtime-adapter-report: ${expectation.fixturePath}`, 1);
    }
    return;
  }
  if (!row && expectation.fixtureKind === "invalid" && INHERITED_P0_DIAGNOSTIC_CODES.has(expectation.expectedDiagnosticCodes[0])) {
    if (expectation.expectedArtifactPath !== `${ARTIFACT_ROOT}/runtime-adapter-report.json`) {
      throw contractError(`P1 inherited diagnostic expectation must point at runtime-adapter-report: ${expectation.fixturePath}`, 1);
    }
    return;
  }
  if (!row || row.code !== expectation.expectedDiagnosticCodes[0]) {
    throw contractError(`P1 expectation does not match diagnostics registry: ${expectation.fixturePath}`, 1);
  }
  if (expectation.expectedArtifactPath !== row.artifactPath && expectation.expectedArtifactPath !== `${ARTIFACT_ROOT}/runtime-adapter-report.json`) {
    throw contractError(`P1 expectation expectedArtifactPath does not match diagnostics registry: ${expectation.fixturePath}`, 1);
  }
  if (expectation.expectedJsonPointer !== row.pointer || expectation.requiredSourceRef !== row.sourceRef) {
    throw contractError(`P1 expectation pointer/sourceRef does not match diagnostics registry: ${expectation.fixturePath}`, 1);
  }
}

function buildRuntimeProjection(p0, runId) {
  const componentIds = ["Button", "ConfirmPanel", "StatusCallout"];
  const components = {};
  for (const id of componentIds) {
    const component = p0.governedCatalog.components[id];
    components[id] = {
      id,
      sourceRef: component.sourceRef,
      props: component.props,
      variants: component.variants,
      states: component.states,
      slots: component.slots,
      actions: component.actions,
      events: component.events,
      dataBindings: component.dataBindings,
      tokenRefs: component.tokenRefs,
      accessibility: component.accessibility
    };
  }
  return {
    schemaId: "runtime-projection.v0",
    version: VERSION,
    adapter: ADAPTER,
    catalogRef: {
      ...p0.catalogRef,
      sourceEvidenceHash: p0.evidenceRef.hash
    },
    p0EvidenceRef: p0.evidenceRef,
    adapterDiagnosticsRef: p0.adapterDiagnosticsRef,
    components,
    tokens: buildProjectedTokens(p0.governedCatalog.tokens),
    runtimeCapabilities: p0.governedCatalog.runtimeCapabilities,
    governance: p0.governedCatalog.governance,
    accessibility: Object.fromEntries(componentIds.map((id) => [id, components[id].accessibility])),
    diagnostics: [],
    provenance: {
      runId,
      sourceUri: p0.evidence.provenance?.sourceUri || p0.catalogRef.path,
      sourceHash: p0.catalogRef.hash,
      sourceRef: p0.catalogRef.path,
      sourceRefs: componentIds.map((id) => components[id].sourceRef),
      generator: { name: "interfacectl-p1-runtime-projection", version: VERSION },
      generatedAt: TIMESTAMP,
      environment: { ...ENVIRONMENT }
    }
  };
}

async function evaluateP1Mutation({ fixture, expectation, p0, projectionRef }) {
  const relative = expectation.fixturePath.replace(`${FIXTURE_ROOT}/`, "");
  const row = P1_REGISTRY_BY_COVERAGE.get(relative);
  if (!row) {
    return mutationContentMismatch(expectation);
  }
  const matched = await p1MutationMatchesFixtureContent(row.code, fixture, { p0, projectionRef });
  if (!matched) {
    return mutationContentMismatch(expectation);
  }
  return resultFromDiagnostics(expectation, [diagnosticForRegistryRow(row)]);
}

async function p1MutationMatchesFixtureContent(code, fixture, { p0, projectionRef }) {
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) {
    return false;
  }

  switch (code) {
    case "PROJECTION_CATALOG_REF_MISSING":
      return fixture.schemaId === "runtime-projection.v0" &&
        !Object.prototype.hasOwnProperty.call(fixture, "catalogRef");
    case "PROJECTION_SOURCE_HASH_MISMATCH":
      return fixture.schemaId === "runtime-projection.v0" &&
        isArtifactRef(fixture.catalogRef, p0.catalogRef.path, p0.catalogRef.schemaId) &&
        fixture.catalogRef.hash !== p0.catalogRef.hash;
    case "PROJECTION_AUTHORITY_ESCALATION":
      return fixture.schemaId === "runtime-projection.v0" &&
        Object.prototype.hasOwnProperty.call(fixture.components?.ConfirmPanel?.actions || {}, "escalate") &&
        !Object.prototype.hasOwnProperty.call(p0.governedCatalog.components?.ConfirmPanel?.actions || {}, "escalate") &&
        fixture.components.ConfirmPanel.actions.escalate?.sourceRef ===
          "fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate";
    case "RUNTIME_RENDER_PLAN_PROVENANCE_MISSING":
      return fixture.schemaId === "render-plan.v0" &&
        !Object.prototype.hasOwnProperty.call(fixture, "provenance") &&
        fixture.surfaceRef?.sourceRef === "fixture://p1/valid/confirm-panel#/root";
    case "RUNTIME_PROJECTION_HASH_MISMATCH":
      return fixture.schemaId === "runtime-adapter-report.v0" &&
        isArtifactRef(fixture.runtimeProjectionRef, projectionRef.path, projectionRef.schemaId) &&
        fixture.runtimeProjectionRef.hash !== projectionRef.hash;
    case "RUNTIME_EVIDENCE_HASH_MISMATCH": {
      if (fixture.schemaId !== "runtime-adapter-evidence.v0" || !Array.isArray(fixture.artifacts)) {
        return false;
      }
      const projectionArtifact = fixture.artifacts.find((entry) =>
        isArtifactRef(entry, projectionRef.path, projectionRef.schemaId)
      );
      return Boolean(projectionArtifact && projectionArtifact.hash !== projectionRef.hash);
    }
    default:
      return false;
  }
}

function isArtifactRef(value, artifactPath, schemaId) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.path === artifactPath &&
    value.schemaId === schemaId &&
    value.hashAlgorithm === "sha256" &&
    /^[a-f0-9]{64}$/.test(value.hash);
}

function mutationContentMismatch(expectation) {
  return {
    stage: expectation.expectedStage,
    phase: expectation.expectedPhase,
    validationResult: "valid",
    promotionStatus: "allowed",
    diagnostics: [],
    sourceRef: null
  };
}

function evaluateP1SurfaceFixture(fixture, expectation, projection) {
  const diagnostics = validateP1Surface(fixture, projection, expectation.fixturePath);
  if (diagnostics.length === 0) {
    return {
      stage: expectation.expectedStage,
      phase: expectation.expectedPhase,
      validationResult: "valid",
      promotionStatus: "allowed",
      diagnostics: [],
      sourceRef: fixture.root.sourceRef
    };
  }
  return resultFromDiagnostics(expectation, diagnostics);
}

function validateP1Surface(surfaceIr, projection, artifactPath) {
  const allInstances = surfaceInstances(surfaceIr);
  for (const { instance, pointer } of allInstances) {
    const component = projection.components[instance.component];
    if (!component) {
      return [catalogDiagnostic("CATALOG_UNKNOWN_COMPONENT", artifactPath, `${pointer}/component`, instance.sourceRef ?? sourceRefFromPointer(surfaceIr, pointer))];
    }
    for (const [propId, value] of Object.entries(instance.props || {})) {
      const propPointer = `${pointer}/props/${escapeJsonPointer(propId)}`;
      const prop = component.props[propId];
      if (!prop) {
        return [catalogDiagnostic("CATALOG_UNKNOWN_PROP", artifactPath, propPointer, sourceRefFromPointer(surfaceIr, propPointer))];
      }
      if (typeof value === "string" && prop.allowMarkup === false && /<[^>]+>/.test(value)) {
        return [catalogDiagnostic("CATALOG_INVALID_VALUE", artifactPath, propPointer, sourceRefFromPointer(surfaceIr, propPointer))];
      }
    }
    if (!Object.prototype.hasOwnProperty.call(component.variants || {}, instance.variant)) {
      const memberPointer = `${pointer}/variant`;
      return [projectionMemberDiagnostic(artifactPath, memberPointer, sourceRefFromPointer(surfaceIr, memberPointer))];
    }
    if (!Object.prototype.hasOwnProperty.call(component.states || {}, instance.state)) {
      const memberPointer = `${pointer}/state`;
      return [projectionMemberDiagnostic(artifactPath, memberPointer, sourceRefFromPointer(surfaceIr, memberPointer))];
    }
    for (const [slotId, childIds] of Object.entries(instance.slots || {})) {
      const slotPointer = `${pointer}/slots/${escapeJsonPointer(slotId)}`;
      const slot = component.slots?.[slotId];
      if (!slot) {
        return [projectionMemberDiagnostic(artifactPath, slotPointer, sourceRefFromPointer(surfaceIr, slotPointer))];
      }
      for (const [index, childId] of childIds.entries()) {
        const child = surfaceIr.instances?.[childId];
        if (!child) {
          return [projectionMemberDiagnostic(artifactPath, `${slotPointer}/${index}`, sourceRefFromPointer(surfaceIr, `${slotPointer}/${index}`))];
        }
        if (Array.isArray(slot.allowedComponents) && slot.allowedComponents.length > 0 && !slot.allowedComponents.includes(child.component)) {
          return [projectionMemberDiagnostic(artifactPath, `${slotPointer}/${index}`, child.sourceRef ?? sourceRefFromPointer(surfaceIr, `${slotPointer}/${index}`))];
        }
      }
    }
    for (const [eventId, eventUsage] of Object.entries(instance.events || {})) {
      if (!Object.prototype.hasOwnProperty.call(component.events || {}, eventId)) {
        const memberPointer = `${pointer}/events/${escapeJsonPointer(eventId)}`;
        return [projectionMemberDiagnostic(artifactPath, memberPointer, eventUsage.sourceRef ?? sourceRefFromPointer(surfaceIr, memberPointer))];
      }
    }
    for (const [bindingId] of Object.entries(instance.dataBindings || {})) {
      if (!Object.prototype.hasOwnProperty.call(component.dataBindings || {}, bindingId)) {
        const memberPointer = `${pointer}/dataBindings/${escapeJsonPointer(bindingId)}`;
        return [projectionMemberDiagnostic(artifactPath, memberPointer, sourceRefFromPointer(surfaceIr, memberPointer))];
      }
    }
    for (const [tokenId, tokenRef] of Object.entries(instance.tokenRefs || {})) {
      const knownTokenKey = Object.prototype.hasOwnProperty.call(component.tokenRefs || {}, tokenId);
      const allowedTokenRefs = componentAllowedTokenRefs(component);
      if (!knownTokenKey || !allowedTokenRefs.has(tokenRef) || !Object.prototype.hasOwnProperty.call(projection.tokens || {}, tokenRef)) {
        const memberPointer = `${pointer}/tokenRefs/${escapeJsonPointer(tokenId)}`;
        return [projectionMemberDiagnostic(artifactPath, memberPointer, sourceRefFromPointer(surfaceIr, memberPointer))];
      }
    }
    const accessibility = instance.accessibility || {};
    if (["dialog", "alertdialog"].includes(accessibility.role) || accessibility["aria-modal"] === true ||
      accessibility.modal === true || accessibility.focusTrap === true ||
      accessibility.initialFocus || accessibility.returnFocus || accessibility.inertOutside === true) {
      return [catalogDiagnostic("ACCESSIBILITY_MODAL_UNSUPPORTED", artifactPath, `${pointer}/accessibility/role`, sourceRefFromPointer(surfaceIr, `${pointer}/accessibility`))];
    }
    for (const [actionId, actionUsage] of Object.entries(instance.actions || {})) {
      const action = component.actions[actionId];
      if (!action) {
        const memberPointer = `${pointer}/actions/${escapeJsonPointer(actionId)}`;
        return [projectionMemberDiagnostic(artifactPath, memberPointer, actionUsage.sourceRef ?? sourceRefFromPointer(surfaceIr, memberPointer))];
      }
      if (actionUsage.execute === true && action.disabledUntilImplemented) {
        return [diagnosticForRegistryRow(P1_REGISTRY_BY_COVERAGE.get("invalid/disabled-action-execution.surface-ir.json"))];
      }
      if (actionUsage.execute === true && action.requiresReview) {
        return [diagnosticForRegistryRow(P1_REGISTRY_BY_COVERAGE.get("review/review-required-action.surface-ir.json"))];
      }
    }
  }
  return [];
}

function componentAllowedTokenRefs(component) {
  const refs = new Set(Object.values(component.tokenRefs || {}));
  for (const prop of Object.values(component.props || {})) {
    for (const tokenRef of prop.tokenRefs || []) refs.add(tokenRef);
  }
  return refs;
}

function surfaceInstances(surfaceIr) {
  const entries = [{ id: surfaceIr.root.id, instance: surfaceIr.root, pointer: "/root" }];
  for (const [id, instance] of Object.entries(surfaceIr.instances || {})) {
    entries.push({ id, instance, pointer: `/instances/${escapeJsonPointer(id)}` });
  }
  return entries;
}

function escapeJsonPointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function sourceRefFromPointer(surfaceIr, pointer) {
  const sourceUri = surfaceIr.provenance?.sourceUri || surfaceIr.root?.sourceRef?.split("#")[0] || "fixture://p1/unknown";
  return `${sourceUri}#${pointer}`;
}

function catalogDiagnostic(code, artifactPath, pointer, sourceRef) {
  const messages = {
    CATALOG_UNKNOWN_COMPONENT: "Surface IR references an unknown component.",
    CATALOG_UNKNOWN_PROP: "Surface IR references an unknown prop.",
    CATALOG_INVALID_VALUE: "String prop contains unsafe markup or unsanitized text.",
    ACCESSIBILITY_MODAL_UNSUPPORTED: "Modal dialog and alertdialog semantics are deferred beyond P1 and unsupported in P0/P1."
  };
  return {
    code,
    diagnosticSource: "catalog-validator",
    schemaOutputFormat: null,
    severity: "error",
    message: messages[code],
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    path: pointer,
    jsonPointer: pointer,
    instanceLocation: pointer,
    keywordLocation: null,
    absoluteKeywordLocation: null,
    sourceRef,
    artifactPath,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions."
  };
}

function projectionMemberDiagnostic(artifactPath, pointer, sourceRef) {
  const rowData = P1_REGISTRY_ROWS.find((entry) => entry.code === "RUNTIME_PROJECTION_MEMBER_UNKNOWN");
  return {
    code: rowData.code,
    diagnosticSource: rowData.diagnosticSource,
    schemaOutputFormat: null,
    severity: rowData.severity,
    message: rowData.message,
    stage: rowData.stage,
    phase: rowData.phase,
    path: pointer,
    jsonPointer: pointer,
    instanceLocation: pointer,
    keywordLocation: null,
    absoluteKeywordLocation: null,
    sourceRef,
    artifactPath,
    validationResult: rowData.validationResult,
    promotionStatus: rowData.promotionStatus,
    suggestedAction: rowData.suggestedAction
  };
}

function resultFromDiagnostics(expectation, diagnostics) {
  const sorted = sortDiagnostics(diagnostics);
  const first = sorted[0];
  return {
    stage: first?.stage ?? expectation.expectedStage,
    phase: first?.phase ?? expectation.expectedPhase,
    validationResult: first?.validationResult ?? expectation.validationResult,
    promotionStatus: first?.promotionStatus ?? expectation.promotionStatus,
    diagnostics: sorted,
    sourceRef: first?.sourceRef ?? null
  };
}

function compareP1Expectation(expectation, actual) {
  return expectation.expectedStage === actual.stage &&
    expectation.expectedPhase === actual.phase &&
    expectation.validationResult === actual.validationResult &&
    expectation.promotionStatus === actual.promotionStatus &&
    expectation.expectedDiagnosticCodes.length === actual.diagnostics.length &&
    expectation.expectedDiagnosticCodes.every((code, index) => actual.diagnostics[index]?.code === code) &&
    expectation.expectedJsonPointer === (actual.diagnostics[0]?.path ?? expectation.expectedJsonPointer) &&
    expectation.requiredSourceRef === actual.sourceRef;
}

function buildRenderPlan({ runId, fixture, fixturePath, projectionRef, projection, outputPath }) {
  const tree = renderNode(fixture.root, fixture, projection);
  const actions = collectActionDescriptors(fixture.root, fixture, projection);
  return {
    schemaId: "render-plan.v0",
    version: VERSION,
    adapter: ADAPTER,
    surfaceRef: {
      path: fixturePath,
      schemaId: "surface-ir.v0",
      sourceRef: fixture.root.sourceRef,
      hashAlgorithm: "sha256",
      hash: sha256Hex(canonicalJson(fixture))
    },
    projectionRef,
    promotionStatus: "allowed",
    tree,
    actions,
    sideEffects: [],
    accessibility: fixture.root.accessibility || {},
    tokens: collectTokensForFixture(fixture, projection),
    diagnostics: [],
    provenance: {
      runId,
      artifactPath: outputPath,
      sourceUri: fixturePath,
      sourceHash: sha256Hex(canonicalJson(fixture)),
      sourceRef: fixture.root.sourceRef,
      generator: { name: "interfacectl-p1-render-plan", version: VERSION },
      generatedAt: TIMESTAMP,
      sourceRefs: collectSurfaceSourceRefs(fixture),
      environment: { ...ENVIRONMENT }
    }
  };
}

function renderNode(instance, fixture, projection) {
  const component = projection.components[instance.component];
  const props = {};
  for (const [propId, prop] of Object.entries(component.props || {})) {
    if (Object.prototype.hasOwnProperty.call(instance.props || {}, propId)) {
      props[propId] = instance.props[propId];
    } else if (Object.prototype.hasOwnProperty.call(prop, "default")) {
      props[propId] = prop.default;
    }
  }
  const children = [];
  for (const childIds of Object.values(instance.slots || {})) {
    for (const childId of childIds) {
      const child = fixture.instances[childId];
      if (child) children.push(renderNode(child, fixture, projection));
    }
  }
  return {
    nodeId: instance.id,
    component: instance.component,
    role: instance.accessibility?.role || component.accessibility?.role || null,
    name: accessibleName(instance, props),
    description: accessibleDescription(instance, props),
    props,
    tokens: resolveInstanceTokenRefs(instance, projection),
    children
  };
}

function accessibleName(instance, props) {
  if (instance.accessibility?.nameFrom === "props.label") return props.label || null;
  if (instance.accessibility?.nameFrom === "props.title") return props.title || null;
  if (instance.accessibility?.nameFrom === "props.heading") return props.heading || null;
  return props.label || props.title || props.heading || null;
}

function accessibleDescription(instance, props) {
  if (instance.accessibility?.descriptionFrom === "props.body") return props.body || null;
  if (instance.accessibility?.descriptionFrom === "props.label") return props.label || null;
  return props.body || null;
}

function collectActionDescriptors(root, fixture, projection) {
  const descriptors = [];
  const allInstances = [root, ...Object.values(fixture.instances || {})];
  for (const instance of allInstances) {
    const component = projection.components[instance.component];
    for (const [actionId, actionUsage] of Object.entries(instance.actions || {})) {
      const action = component?.actions?.[actionId];
      if (!action) {
        throw contractError(`P1 render plan encountered action absent from runtime projection: ${instance.component}.${actionId}`, 1);
      }
      descriptors.push({
        actionId,
        kind: action.kind,
        target: action.allowedTargets?.[0] || null,
        label: instance.props?.label || instance.props?.heading || actionId,
        reviewRequired: Boolean(action.requiresReview),
        disabled: Boolean(instance.props?.disabled || action.disabledUntilImplemented),
        executed: false,
        sourceRef: actionUsage.sourceRef
      });
    }
  }
  return descriptors;
}

function resolveInstanceTokenRefs(instance, projection) {
  const tokens = {};
  for (const [tokenId, tokenRef] of Object.entries(instance.tokenRefs || {})) {
    const token = projection.tokens?.[tokenRef];
    if (!token) {
      throw contractError(`P1 render plan encountered token absent from runtime projection: ${tokenRef}`, 1);
    }
    tokens[tokenId] = token;
  }
  return tokens;
}

function collectTokensForFixture(fixture, projection) {
  const refs = new Set();
  for (const instance of [fixture.root, ...Object.values(fixture.instances || {})]) {
    for (const tokenRef of Object.values(instance.tokenRefs || {})) refs.add(tokenRef);
  }
  const tokens = {};
  for (const tokenRef of refs) {
    const token = projection.tokens?.[tokenRef];
    if (!token) {
      throw contractError(`P1 render plan encountered token absent from runtime projection: ${tokenRef}`, 1);
    }
    tokens[tokenRef] = token;
  }
  return tokens;
}

function buildProjectedTokens(tokens) {
  const projected = {};
  const walk = (node, parts) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (Object.prototype.hasOwnProperty.call(node, "$value")) {
      const tokenRef = parts.join(".");
      projected[tokenRef] = {
        value: deepClone(node.$value),
        cssVariable: cssVariableForToken(tokenRef),
        sourceRef: node.sourceRef
      };
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("$") || key === "sourceRef" || key === "resolvedSubvalues") continue;
      walk(value, [...parts, key]);
    }
  };
  walk(tokens, []);
  return projected;
}

function cssVariableForToken(tokenRef) {
  const name = tokenRef
    .split(".")
    .map((segment) => segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    .join("-");
  return `--surfaces-${name}`;
}

function collectSurfaceSourceRefs(fixture) {
  const refs = [];
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value.sourceRef === "string") refs.push(value.sourceRef);
    for (const nested of Object.values(value)) walk(nested);
  };
  walk(fixture);
  return [...new Set(refs)].sort();
}

async function buildP1Evidence({ cwd, fixtureRoot, outRoot, command, args, runId, manifest, p0, projectionRef, renderPlans, report, validationResults, diagnostics, status }) {
  const promotionStatus = status === "pass" ? aggregatePromotionStatus(validationResults) : "blocked";
  const reportRef = {
    path: `${outRoot}/runtime-adapter-report.json`,
    schemaId: "runtime-adapter-report.v0",
    hashAlgorithm: "sha256",
    hash: await canonicalFileHash(path.join(cwd, outRoot, "runtime-adapter-report.json"))
  };
  const boundaryRefs = [
    boundaryRef(p0.evidenceRef, "upstream-boundary"),
    boundaryRef(p0.catalogRef, "upstream-boundary"),
    boundaryRef(p0.adapterDiagnosticsRef, "upstream-boundary"),
    boundaryRef(projectionRef, "runtime-projection"),
    ...renderPlans.map((plan) => boundaryRef({
      path: plan.artifactPath,
      schemaId: "render-plan.v0",
      hashAlgorithm: "sha256",
      hash: plan.hash
    }, "render-plan")),
    boundaryRef(reportRef, "runtime-adapter-report")
  ];
  const artifacts = await buildEvidenceArtifactEntries(cwd, fixtureRoot, outRoot, manifest.inputs);
  const evidence = {
    contractId: "surfaces-p1-runtime-adapter-proof",
    schemaId: "runtime-adapter-evidence.v0",
    version: VERSION,
    runId,
    checkedAt: TIMESTAMP,
    adapter: ADAPTER,
    command,
    args,
    status,
    promotionStatus,
    upstream: {
      p0EvidenceRef: p0.evidenceRef,
      governedCatalogRef: p0.catalogRef,
      adapterDiagnosticsRef: p0.adapterDiagnosticsRef
    },
    boundaryRefs,
    validationResults: validationResults.map(stripP1ResultDiagnostics),
    renderPlanRefs: renderPlans.map((plan) => ({
      path: plan.artifactPath,
      schemaId: "render-plan.v0",
      hashAlgorithm: "sha256",
      hash: plan.hash,
      promotionStatus: plan.promotionStatus,
      surfaceRef: plan.surfaceRef,
      provenance: plan.provenance
    })),
    runtimeProjectionRef: projectionRef,
    runtimeAdapterReportRef: reportRef,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistryRows(),
    environment: { ...ENVIRONMENT },
    artifacts,
    provenance: {
      evaluator: { name: "interfacectl-p1-adapter-proof", version: VERSION },
      schemaIds: P1_SCHEMA_FILES.map((file) => schemaIdForPath(`${SCHEMA_ROOT}/${file}`)),
      stageChain: ["projection", "runtime-boundary", "evidence"],
      generatedAt: TIMESTAMP
    }
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

function boundaryRef(ref, role) {
  return {
    ...ref,
    sourceArtifactHash: ref.hash,
    provenance: artifactProvenance(ref.path, ref.hash, role)
  };
}

async function buildEvidenceArtifactEntries(cwd, fixtureRoot, outRoot, inputs) {
  const entries = [];
  for (const artifactPath of artifactOrderFor(fixtureRoot, outRoot, inputs)) {
    const hash = artifactPath === `${outRoot}/evidence.json` ? null :
      artifactPath === `${P0_ARTIFACT_ROOT}/evidence.json` ? computeEvidenceSelfHash(await readJson(path.join(cwd, artifactPath))) :
      await canonicalFileHash(path.join(cwd, artifactPath));
    const role = roleForPath(artifactPath);
    entries.push({
      role,
      path: artifactPath,
      schemaId: schemaIdForPath(artifactPath),
      hashAlgorithm: "sha256",
      hash,
      provenance: artifactProvenance(artifactPath, hash, role)
    });
  }
  return entries;
}

function artifactProvenance(artifactPath, hash, role) {
  return {
    sourceUri: artifactPath,
    sourceHash: hash ?? "sha256:self-hash-null-placeholder",
    sourceRef: `artifact://${artifactPath}`,
    generatedAt: TIMESTAMP,
    generator: { name: `interfacectl-p1-${role}`, version: VERSION },
    environment: { ...ENVIRONMENT }
  };
}

function artifactOrderFor(fixtureRoot, outRoot, inputs) {
  return [
    ...P1_SCHEMA_FILES.map((file) => `${SCHEMA_ROOT}/${file}`),
    `${P0_ARTIFACT_ROOT}/evidence.json`,
    `${P0_ARTIFACT_ROOT}/governed-catalog.json`,
    `${P0_ARTIFACT_ROOT}/adapter-diagnostics.json`,
    `${fixtureRoot}/expectations.manifest.json`,
    ...inputs,
    `${outRoot}/runtime-projection.json`,
    `${outRoot}/render-plan.confirm-panel.json`,
    `${outRoot}/render-plan.status-callout.json`,
    `${outRoot}/render-plan.button-defaults.json`,
    `${outRoot}/runtime-adapter-report.json`,
    `${outRoot}/evidence.json`
  ];
}

function schemaIdForPath(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (P1_SCHEMA_FILES.includes(file)) return "json-schema";
  if (artifactPath.endsWith("artifacts/p0/evidence.json")) return "evidence.v0";
  if (artifactPath.endsWith("artifacts/p0/governed-catalog.json")) return "runtime-catalog.v0";
  if (artifactPath.endsWith("artifacts/p0/adapter-diagnostics.json")) return "adapter-diagnostics.v0";
  if (file === "expectations.manifest.json") return "runtime-adapter-expectations.v0";
  if (file?.endsWith(".surface-ir.json")) return "surface-ir.v0";
  if (file?.endsWith(".runtime-projection.json") || file === "runtime-projection.json") return "runtime-projection.v0";
  if (file?.endsWith(".render-plan.json") || file?.startsWith("render-plan.")) return "render-plan.v0";
  if (file?.endsWith(".runtime-adapter-report.json") || file === "runtime-adapter-report.json") return "runtime-adapter-report.v0";
  if (file?.endsWith(".runtime-adapter-evidence.json") || file === "evidence.json") return "runtime-adapter-evidence.v0";
  return null;
}

function roleForPath(artifactPath) {
  if (artifactPath.startsWith("schemas/")) return "schema";
  if (artifactPath.startsWith(`${P0_ARTIFACT_ROOT}/`)) return "upstream-boundary";
  if (artifactPath.endsWith("expectations.manifest.json")) return "expectations-manifest";
  if (artifactPath.includes("/mutations/")) return "mutation-fixture";
  if (artifactPath.includes("/valid/")) return "valid-fixture";
  if (artifactPath.includes("/invalid/")) return "invalid-fixture";
  if (artifactPath.includes("/review/")) return "review-fixture";
  if (artifactPath.endsWith("runtime-projection.json")) return "runtime-projection";
  if (artifactPath.includes("/render-plan.")) return "render-plan";
  if (artifactPath.endsWith("runtime-adapter-report.json")) return "runtime-adapter-report";
  if (artifactPath.endsWith("evidence.json")) return "evidence";
  return "generated-artifact";
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalEntry = clone.artifacts[clone.artifacts.length - 1];
  finalEntry.hash = null;
  return sha256Hex(canonicalJson(clone));
}

function aggregatePromotionStatus(results) {
  const matched = results.every((result) => result.matched !== false);
  if (!matched) return "blocked";
  if (results.some((result) => result.actualPromotionStatus === "review_required")) {
    return "review_required";
  }
  return "allowed";
}

function stripP1ResultDiagnostics(result) {
  return {
    fixturePath: result.fixturePath,
    fixtureKind: result.fixtureKind,
    expectedStage: result.expectedStage,
    actualStage: result.actualStage,
    expectedPhase: result.expectedPhase,
    actualPhase: result.actualPhase,
    expectedValidationResult: result.expectedValidationResult,
    actualValidationResult: result.actualValidationResult,
    expectedPromotionStatus: result.expectedPromotionStatus,
    actualPromotionStatus: result.actualPromotionStatus,
    expectedDiagnosticCodes: result.expectedDiagnosticCodes,
    actualDiagnosticCodes: result.actualDiagnosticCodes,
    matched: result.matched,
    artifactPath: result.artifactPath,
    jsonPointer: result.jsonPointer,
    sourceRef: result.sourceRef,
    renderPlanPath: result.renderPlanPath
  };
}

function diagnosticForRegistryRow(rowData) {
  return {
    code: rowData.code,
    diagnosticSource: rowData.diagnosticSource,
    schemaOutputFormat: null,
    severity: rowData.severity,
    message: rowData.message,
    stage: rowData.stage,
    phase: rowData.phase,
    path: rowData.pointer,
    jsonPointer: rowData.pointer,
    instanceLocation: rowData.pointer,
    keywordLocation: null,
    absoluteKeywordLocation: null,
    sourceRef: rowData.sourceRef,
    artifactPath: rowData.artifactPath,
    validationResult: rowData.validationResult,
    promotionStatus: rowData.promotionStatus,
    suggestedAction: rowData.suggestedAction
  };
}

function diagnosticsRegistryRows() {
  return [...P1_REGISTRY_ROWS, ...inheritedP0RegistryRows()].map((rowData) => ({
    code: rowData.code,
    trigger: rowData.trigger,
    canonicalMessage: rowData.message,
    severity: rowData.severity,
    diagnosticSource: rowData.diagnosticSource,
    stage: rowData.stage,
    phase: rowData.phase,
    artifactPath: rowData.artifactPath,
    jsonPointer: rowData.pointer,
    sourceRef: rowData.sourceRef,
    validationResult: rowData.validationResult,
    promotionStatus: rowData.promotionStatus,
    suggestedAction: rowData.suggestedAction,
    fixtureCoverage: rowData.coverage
  }));
}

function inheritedP0RegistryRows() {
  return [
    {
      code: "ACCESSIBILITY_MODAL_UNSUPPORTED",
      trigger: "Surface IR attempts modal dialog or alertdialog semantics through unsupported modal fields",
      message: "Modal dialog and alertdialog semantics are deferred beyond P1 and unsupported in P0/P1.",
      severity: "error",
      diagnosticSource: "catalog-validator",
      stage: "runtime-boundary",
      phase: "runtime-invalid",
      artifactPath: "fixtures/p1/invalid/modal-role-not-supported.surface-ir.json",
      pointer: "/root/accessibility/role",
      sourceRef: "fixture://p1/invalid/modal-role-not-supported#/root/accessibility",
      validationResult: "invalid",
      promotionStatus: "blocked",
      suggestedAction: "Reject runtime usage without rendering or executing actions.",
      coverage: "invalid/modal-role-not-supported.surface-ir.json"
    },
    {
      code: "CATALOG_INVALID_VALUE",
      trigger: "String prop contains unsafe markup or unsanitized text",
      message: "String prop contains unsafe markup or unsanitized text.",
      severity: "error",
      diagnosticSource: "catalog-validator",
      stage: "runtime-boundary",
      phase: "runtime-invalid",
      artifactPath: "fixtures/p1/invalid/unsafe-markup.surface-ir.json",
      pointer: "/instances/secondaryAction/props/label",
      sourceRef: "fixture://p1/invalid/unsafe-markup#/instances/secondaryAction/props/label",
      validationResult: "invalid",
      promotionStatus: "blocked",
      suggestedAction: "Reject runtime usage without rendering or executing actions.",
      coverage: "invalid/unsafe-markup.surface-ir.json"
    },
    {
      code: "CATALOG_UNKNOWN_COMPONENT",
      trigger: "Surface IR references an unknown component",
      message: "Surface IR references an unknown component.",
      severity: "error",
      diagnosticSource: "catalog-validator",
      stage: "runtime-boundary",
      phase: "runtime-invalid",
      artifactPath: "fixtures/p1/invalid/unknown-component.surface-ir.json",
      pointer: "/root/component",
      sourceRef: "fixture://p1/invalid/unknown-component#/root",
      validationResult: "invalid",
      promotionStatus: "blocked",
      suggestedAction: "Reject runtime usage without rendering or executing actions.",
      coverage: "invalid/unknown-component.surface-ir.json"
    },
    {
      code: "CATALOG_UNKNOWN_PROP",
      trigger: "Surface IR references an unknown prop",
      message: "Surface IR references an unknown prop.",
      severity: "error",
      diagnosticSource: "catalog-validator",
      stage: "runtime-boundary",
      phase: "runtime-invalid",
      artifactPath: "fixtures/p1/invalid/unknown-prop.surface-ir.json",
      pointer: "/root/props/eyebrow",
      sourceRef: "fixture://p1/invalid/unknown-prop#/root/props/eyebrow",
      validationResult: "invalid",
      promotionStatus: "blocked",
      suggestedAction: "Reject runtime usage without rendering or executing actions.",
      coverage: "invalid/unknown-prop.surface-ir.json"
    }
  ];
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    compareNullable(a.artifactPath, b.artifactPath) ||
    ((STAGE_ORDER.get(a.stage) ?? 999) - (STAGE_ORDER.get(b.stage) ?? 999)) ||
    compareNullable(a.phase, b.phase) ||
    compareNullable(a.path, b.path) ||
    compareNullable(a.keywordLocation, b.keywordLocation) ||
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

function assertOrderedPaths(label, actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    throw contractError(`${label} does not match the P1 contract`, 1);
  }
}

function assertNoDuplicatePaths(label, paths) {
  const duplicates = paths.filter((entry, index) => paths.indexOf(entry) !== index);
  if (duplicates.length > 0) {
    throw contractError(`${label} contains duplicate paths: ${[...new Set(duplicates)].join(", ")}`, 1);
  }
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const expectedSchemaFiles = [...P0_SCHEMA_FILES, ...P1_SCHEMA_FILES]
    .map((file) => `${SCHEMA_ROOT}/${file}`)
    .sort();
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, SCHEMA_ROOT), SCHEMA_ROOT)).sort();
  assertPathSet("schema directory contents", actualSchemaEntries, expectedSchemaFiles);
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

function assertP1RelativePath(value, label) {
  if (
    typeof value !== "string" ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw contractError(`${label} must be a POSIX-style relative P1 path without . or .. segments: ${value}`, 1);
  }
  const allowedRoots = [SCHEMA_ROOT, FIXTURE_ROOT, ARTIFACT_ROOT];
  if (!allowedRoots.some((root) => value.startsWith(`${root}/`))) {
    throw contractError(`${label} must stay under a P1 root (${allowedRoots.join(", ")}): ${value}`, 1);
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
    validateSchema: true
  });

  const expectedP1Schemas = buildP1Schemas();
  for (const file of P0_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, SCHEMA_ROOT, file));
    assertSchemaIdentity(schema, "p0", P0_SCHEMA_IDS[file], `${SCHEMA_ROOT}/${file}`);
    if (!ajv.validateSchema(schema)) {
      throw contractError(`schema validation failed for ${SCHEMA_ROOT}/${file}: ${formatAjvErrors(ajv.errors)}`, 1);
    }
    ajv.addSchema(schema);
  }
  for (const file of P1_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, SCHEMA_ROOT, file));
    const expected = expectedP1Schemas[file];
    if (canonicalJson(schema) !== canonicalJson(expected)) {
      throw contractError(`P1 schema does not match generated contract: ${SCHEMA_ROOT}/${file}`, 1);
    }
    assertSchemaIdentity(schema, "p1", P1_SCHEMA_IDS[file], `${SCHEMA_ROOT}/${file}`);
    if (!ajv.validateSchema(schema)) {
      throw contractError(`schema validation failed for ${SCHEMA_ROOT}/${file}: ${formatAjvErrors(ajv.errors)}`, 1);
    }
    ajv.addSchema(schema);
  }

  return {
    validate(scope, schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/${scope}/${schemaId}.schema.json`);
      if (!validate) {
        throw new Error(`schema not loaded: ${scope}/${schemaId}`);
      }
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

function assertSchemaIdentity(schema, scope, schemaId, artifactPath) {
  if (
    schema?.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
    schema?.$id !== `https://surfaces.dev/schemas/${scope}/${schemaId}.schema.json` ||
    schema?.schemaId !== schemaId ||
    schema?.type !== "object"
  ) {
    throw contractError(`schema identity mismatch for ${artifactPath}`, 1);
  }
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

function assertRunExpectation(manifest, artifact) {
  const expected = manifest.runExpectation;
  if (artifact.status !== expected.status || artifact.promotionStatus !== expected.promotionStatus) {
    throw contractError(
      `P1 run expectation mismatch: expected ${expected.status}/${expected.promotionStatus}, got ${artifact.status}/${artifact.promotionStatus}`,
      1
    );
  }
}

function assertNoDuplicateArtifactRefs(label, refs) {
  if (!Array.isArray(refs)) {
    throw contractError(`${label} must be an array`, 1);
  }
  const paths = refs.map((entry) => entry?.path).filter((entry) => typeof entry === "string");
  assertNoDuplicatePaths(label, paths);
  if (paths.length !== refs.length) {
    throw contractError(`${label} contains an artifact ref without a path`, 1);
  }
}

function assertNoDuplicateResultFixtures(label, results) {
  if (!Array.isArray(results)) {
    throw contractError(`${label} must be an array`, 1);
  }
  const paths = results.map((entry) => entry?.fixturePath).filter((entry) => typeof entry === "string");
  assertNoDuplicatePaths(label, paths);
  if (paths.length !== results.length) {
    throw contractError(`${label} contains a result without fixturePath`, 1);
  }
}

function assertNoDuplicateDiagnostics(label, diagnostics) {
  if (!Array.isArray(diagnostics)) {
    throw contractError(`${label} must be an array`, 1);
  }
  const identities = diagnostics.map((entry) => [
    entry?.code,
    entry?.artifactPath,
    entry?.path ?? entry?.jsonPointer,
    entry?.sourceRef ?? null
  ].join("\u0000"));
  assertNoDuplicatePaths(label, identities);
}

function buildRunId(p0, command, args, manifest) {
  return `p1-${sha256Hex(canonicalJson({
    p0RunId: p0.evidence.runId,
    catalogHash: p0.catalogRef.hash,
    manifestHash: sha256Hex(canonicalJson(manifest)),
    command,
    args
  })).slice(0, 32)}`;
}

async function canonicalFileHash(filePath) {
  const data = await readJson(filePath);
  return sha256Hex(canonicalJson(data));
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`);
  try {
    await fs.writeFile(tempPath, canonicalJson(data), { flag: "wx" });
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const p1Internals = {
  P1_REGISTRY_ROWS,
  artifactOrderFor,
  computeEvidenceSelfHash
};
