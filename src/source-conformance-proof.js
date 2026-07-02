import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  rawFileHash,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  SC_ARTIFACT_PATHS,
  SC_ARTIFACT_ROOT,
  SC_COMMAND,
  SC_CONTRACT_ID,
  SC_CONSUMED_SCHEMA_FILES,
  SC_ENVIRONMENT,
  SC_EXPECTATION_ROWS,
  SC_FORBIDDEN_CLAIM_KEYS,
  SC_FIXTURE_ROOT,
  SC_GENERATED_ARTIFACTS,
  SC_P2_CATALOG_PATH,
  SC_P2_EVIDENCE_PATH,
  SC_REVIEW_POLICY_SOURCE_REF,
  SC_SCHEMA_FILES,
  SC_SCHEMA_ROOT,
  SC_SOURCE_ROOT,
  SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF,
  SC_TIMESTAMP,
  SC_VERSION,
  artifactRef,
  diagnosticsRegistry,
  provenance,
  scArtifactOrder,
  scFixturePaths,
  scSchemaPaths,
  scSourcePaths,
  schemaIdForSourceConformancePath,
  sourceFileRefs,
  sourceManifestRef
} from "./source-conformance-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;
const BUTTON_PRIMARY_SOURCE_REF = "declared-source://source-conformance/components/button.json#/";
const BUTTON_SUPPORTING_SOURCE_REFS = [
  "declared-source://source-conformance/components/button-acquired-a.json#/",
  "declared-source://source-conformance/components/button-acquired-b.json#/"
];

export async function runSourceConformanceInterfacectl(argv, io) {
  const parsed = parseSourceConformanceProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runSourceConformanceProof({
      cwd: io.cwd,
      sourceRoot: parsed.source,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: SC_COMMAND,
      args: {
        source: parsed.source,
        ingestionEvidence: parsed.ingestionEvidence,
        catalog: parsed.catalog,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces source-conformance proof: ${result.status}`,
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

function parseSourceConformanceProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--source") {
      result.source = argv[i + 1];
      i += 1;
    } else if (current === "--ingestion-evidence") {
      result.ingestionEvidence = argv[i + 1];
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
  if (!result.source || !result.ingestionEvidence || !result.catalog || !result.fixture || !result.out) {
    return {
      ok: false,
      error: `usage: ${SC_COMMAND} --source ${SC_SOURCE_ROOT} --ingestion-evidence ${SC_P2_EVIDENCE_PATH} --catalog ${SC_P2_CATALOG_PATH} --fixture ${SC_FIXTURE_ROOT} --out ${SC_ARTIFACT_ROOT}`
    };
  }
  for (const [flagName, value] of [
    ["--source", result.source],
    ["--ingestion-evidence", result.ingestionEvidence],
    ["--catalog", result.catalog],
    ["--fixture", result.fixture],
    ["--out", result.out]
  ]) {
    const parsed = p2Internals.parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    const key = flagName.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = parsed.path;
  }
  return { ok: true, ...result };
}

export async function runSourceConformanceProof({
  cwd,
  sourceRoot,
  ingestionEvidencePath,
  catalogPath,
  fixtureRoot,
  outRoot,
  command,
  args
}) {
  assertCommandRoots(sourceRoot, ingestionEvidencePath, catalogPath, fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, SC_SCHEMA_ROOT), `unreadable schema path: ${SC_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  const validators = await loadValidators(cwd);
  const upstream = await strictUpstreamPreflight(cwd, { ingestionEvidencePath, catalogPath }, validators);

  await assertReadableDir(path.join(cwd, sourceRoot), `missing source path: ${sourceRoot}`);
  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredFiles(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const manifest = await readJson(path.join(cwd, sourceRoot, "manifest.json"));
  assertSchema(validators, "declared-source-manifest.v0", manifest, `${sourceRoot}/manifest.json`);
  await assertSourceManifest(cwd, manifest);

  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "source-conformance-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  await assertExpectations(cwd, expectations, sourceRoot, fixtureRoot, outRoot);

  const manifestRef = await sourceManifestRef(cwd);
  const declaredSourceRefs = await sourceFileRefs(cwd, manifest);
  const inventory = buildSourceInventory({ manifestRef, declaredSourceRefs });
  assertSchema(validators, "declared-source-inventory.v0", inventory, `${outRoot}/source-inventory.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-inventory.json"), inventory);
  const inventoryRef = artifactRef(`${outRoot}/source-inventory.json`, "declared-source-inventory.v0", await canonicalFileHash(path.join(cwd, outRoot, "source-inventory.json")));

  const authorityMap = buildAuthorityMap({ upstream });
  assertSchema(validators, "source-authority-map.v0", authorityMap, `${outRoot}/source-authority-map.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-authority-map.json"), authorityMap);
  const authorityMapRef = artifactRef(`${outRoot}/source-authority-map.json`, "source-authority-map.v0", await canonicalFileHash(path.join(cwd, outRoot, "source-authority-map.json")));

  const fixtureRows = await loadFixtureRows(cwd, expectations, validators);
  const componentSourceRoots = await componentSourceRootsForManifest(cwd, manifest);
  const validationResults = evaluateExpectations(fixtureRows, {
    declaredSourceRoots: new Set(manifest.sourceFiles.map((entry) => entry.sourceRefRoot)),
    catalogComponentIds: new Set(Object.keys(upstream.p2Catalog.components || {})),
    componentSourceRoots,
    primaryComponentSourceRoots: primaryComponentSourceRoots()
  });
  const diagnostics = sortDiagnostics(validationResults.flatMap((row) => row.diagnostics));
  const status = validationResults.every((row) => row.matched) ? "pass" : "fail";
  if (status === "fail") {
    const mismatches = validationResults
      .filter((row) => !row.matched)
      .map((row) => `${row.fixturePath}: expected ${row.expectedResult}/${row.promotionStatus}/${row.expectedDiagnosticCodes.join(",") || "none"} got ${row.actualResult}/${row.promotionStatus}/${row.diagnosticCodes.join(",") || "none"}`);
    throw contractError(`source conformance validation expectation mismatch: ${mismatches.join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults);

  const reviewQueue = buildReviewQueue({ validationResults, diagnostics });
  assertSchema(validators, "source-review-queue.v0", reviewQueue, `${outRoot}/source-review-queue.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-review-queue.json"), reviewQueue);
  const reviewQueueRef = artifactRef(`${outRoot}/source-review-queue.json`, "source-review-queue.v0", await canonicalFileHash(path.join(cwd, outRoot, "source-review-queue.json")));

  const runId = buildRunId({ manifest, expectations, command, args, upstream });
  const report = buildReport({
    runId,
    upstream,
    inventoryRef,
    authorityMapRef,
    reviewQueueRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "source-conformance-report.v0", report, `${outRoot}/source-conformance-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "source-conformance-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/source-conformance-report.json`, "source-conformance-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "source-conformance-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    manifestRef,
    declaredSourceRefs,
    upstream,
    inventoryRef,
    authorityMapRef,
    reviewQueueRef,
    reportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "source-conformance-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("source conformance evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`source conformance evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((row) => row.matched).length,
    totalCount: validationResults.length,
    artifacts: SC_ARTIFACT_PATHS
  };
}

function assertCommandRoots(sourceRoot, ingestionEvidencePath, catalogPath, fixtureRoot, outRoot) {
  if (
    sourceRoot !== SC_SOURCE_ROOT ||
    ingestionEvidencePath !== SC_P2_EVIDENCE_PATH ||
    catalogPath !== SC_P2_CATALOG_PATH ||
    fixtureRoot !== SC_FIXTURE_ROOT ||
    outRoot !== SC_ARTIFACT_ROOT
  ) {
    throw contractError(
      `source conformance proof requires --source ${SC_SOURCE_ROOT} --ingestion-evidence ${SC_P2_EVIDENCE_PATH} --catalog ${SC_P2_CATALOG_PATH} --fixture ${SC_FIXTURE_ROOT} --out ${SC_ARTIFACT_ROOT}`,
      2
    );
  }
}

async function strictUpstreamPreflight(cwd, paths, validators) {
  for (const [artifactPath, label] of [
    [paths.ingestionEvidencePath, "P2 ingestion evidence"],
    [paths.catalogPath, "P2 governed catalog"]
  ]) {
    await assertRegularLocalFile(path.join(cwd, artifactPath), label);
  }
  const p2Evidence = await readJson(path.join(cwd, paths.ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, paths.catalogPath));
  assertSchema(validators, "design-system-ingestion-evidence.v0", p2Evidence, paths.ingestionEvidencePath);
  assertSchema(validators, "runtime-catalog.v0", p2Catalog, paths.catalogPath);
  const p2EvidenceRef = findSingleP2ArtifactRef(p2Evidence, paths.ingestionEvidencePath);
  const p2CatalogRef = findSingleP2ArtifactRef(p2Evidence, paths.catalogPath);
  const p2EvidenceSelfHash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  const currentCatalogHash = await canonicalFileHash(path.join(cwd, paths.catalogPath));
  if (p2Evidence.schemaId !== "design-system-ingestion-evidence.v0" || p2EvidenceRef.hash !== p2EvidenceSelfHash) {
    throw contractError("source conformance upstream P2 evidence self-hash validation failed", 1);
  }
  if (p2Evidence.status !== "pass" || p2Evidence.promotionStatus === "blocked") {
    throw contractError("source conformance upstream P2 evidence is not passing", 1);
  }
  if (p2CatalogRef.hash !== currentCatalogHash) {
    throw contractError("source conformance upstream P2 catalog hash does not match accepted evidence", 1);
  }
  return {
    p2Evidence,
    p2Catalog,
    p2EvidenceRef: artifactRef(paths.ingestionEvidencePath, "design-system-ingestion-evidence.v0", p2EvidenceSelfHash),
    p2CatalogRef: artifactRef(paths.catalogPath, "runtime-catalog.v0", currentCatalogHash, { sourceEvidenceHash: p2EvidenceSelfHash })
  };
}

function findSingleP2ArtifactRef(evidence, artifactPath) {
  const refs = (evidence.artifactRefs || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) {
    throw contractError(`source conformance upstream P2 evidence must contain exactly one ref for ${artifactPath}`, 1);
  }
  return refs[0];
}

async function assertRegularLocalFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`source conformance input is missing: ${label}`, 1);
  }
  if (!stat.isFile()) {
    throw contractError(`source conformance input is not a regular file: ${label}`, 1);
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
  const required = new Set(scSchemaPaths());
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, SC_SCHEMA_ROOT), SC_SCHEMA_ROOT)).sort();
  const missing = [...required].filter((entry) => !actualSchemaEntries.includes(entry)).sort();
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (required.has(entry)) return false;
    const fileName = entry.slice(`${SC_SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
  }
}

async function assertRequiredFiles(cwd) {
  for (const relativePath of [...scSchemaPaths(), ...scSourcePaths(), ...scFixturePaths()]) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing source conformance required file: ${relativePath}`, 2);
    }
  }
}

async function rejectStaleOutput(cwd, outRoot) {
  const outDir = await ensureSafeOutputDirectory(cwd, outRoot);
  const entries = await fs.readdir(outDir, { withFileTypes: true });
  const allowed = new Set(SC_GENERATED_ARTIFACTS);
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

async function assertSourceManifest(cwd, manifest) {
  const expectedPaths = scSourcePaths().slice(1).map((entry) => entry.slice(`${SC_SOURCE_ROOT}/`.length)).sort();
  const manifestPaths = manifest.sourceFiles.map((entry) => entry.path).sort();
  assertPathSet("source conformance manifest source files", manifestPaths, expectedPaths);
  for (const sourceFile of manifest.sourceFiles) {
    const actualHash = await rawFileHash(path.join(cwd, SC_SOURCE_ROOT, sourceFile.path));
    if (sourceFile.sha256 !== actualHash) {
      throw contractError("Declared source file hash does not match the manifest.", 1);
    }
  }
}

async function assertExpectations(cwd, manifest, sourceRoot, fixtureRoot, outRoot) {
  if (manifest.sourceRoot !== sourceRoot || manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== SC_SCHEMA_ROOT) {
    throw contractError("source conformance expectations manifest roots do not match proof command paths", 1);
  }
  assertOrderedPaths("source conformance expectations manifest inputs", manifest.inputs, scFixturePaths());
  assertOrderedPaths("source conformance expectations manifest artifactOrder", manifest.artifactOrder, scArtifactOrder());
  assertOrderedPaths("source conformance expectations fixture order", manifest.expectations.map((row) => row.fixturePath), SC_EXPECTATION_ROWS.map((row) => row.fixturePath));
  const expectedFixtureEntries = [
    ...scFixturePaths(),
    ...expectedDirectoryEntries(scFixturePaths(), fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("source conformance fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
  const expectedSourceEntries = [
    ...scSourcePaths(),
    ...expectedDirectoryEntries(scSourcePaths(), sourceRoot)
  ].sort();
  const actualSourceEntries = (await listTreeEntries(path.join(cwd, sourceRoot), sourceRoot)).sort();
  assertPathSet("source conformance source directory contents", actualSourceEntries, expectedSourceEntries);
}

async function loadFixtureRows(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectations) {
    const fixtureAbsolutePath = path.join(cwd, expectation.fixturePath);
    const fixture = await readJson(fixtureAbsolutePath);
    if (expectation.fixturePath.endsWith(".source-conformance.json")) {
      assertSchema(validators, "source-conformance-fixture.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".source-conformance-preflight.json")) {
      assertSchema(validators, "source-conformance-preflight-mutation.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".declared-source-manifest.json")) {
      assertSchema(validators, "declared-source-manifest.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".source-conformance-evidence.json")) {
      assertSchema(validators, "source-conformance-evidence.v0", fixture, expectation.fixturePath);
    }
    rows.push({ expectation, fixture, fixtureHash: await canonicalFileHash(fixtureAbsolutePath) });
  }
  return rows;
}

function buildSourceInventory({ manifestRef, declaredSourceRefs }) {
  return {
    schemaId: "declared-source-inventory.v0",
    version: SC_VERSION,
    sourceRoot: SC_SOURCE_ROOT,
    sourceManifestRef: manifestRef,
    sourceFileRefs: declaredSourceRefs,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-source-conformance-inventory", declaredSourceRefs.map((ref) => ref.sourceRef))
  };
}

function buildAuthorityMap({ upstream }) {
  return {
    schemaId: "source-authority-map.v0",
    version: SC_VERSION,
    catalogRef: upstream.p2CatalogRef,
    ingestionEvidenceRef: upstream.p2EvidenceRef,
    componentAuthority: [
      {
        componentId: "Button",
        catalogRef: "catalog://p2/components/Button",
        declaredSourceRef: BUTTON_PRIMARY_SOURCE_REF,
        additionalDeclaredSourceRefs: BUTTON_SUPPORTING_SOURCE_REFS,
        precedencePolicyRef: SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF,
        conformanceRole: "primary-source-wins-when-explicit-precedence-policy-is-declared"
      },
      {
        componentId: "InLineAlert",
        catalogRef: "catalog://p2/components/InLineAlert",
        declaredSourceRef: "declared-source://source-conformance/components/in-line-alert.json#/",
        additionalDeclaredSourceRefs: [],
        precedencePolicyRef: null,
        conformanceRole: "must-match-declared-source-and-accepted-p2-catalog"
      }
    ],
    policyAuthority: [
      {
        policyId: "accessibility-policy",
        sourceRef: "declared-source://source-conformance/policies/accessibility.json#/",
        conformanceRole: "blocks missing accessibility semantics"
      },
      {
        policyId: "source-precedence-policy",
        sourceRef: SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF,
        conformanceRole: "resolves declared Button source conflicts or routes ambiguity to review"
      },
      {
        policyId: "review-policy",
        sourceRef: "declared-source://source-conformance/governance/review-policy.json#/",
        conformanceRole: "preserves review-required rows without promotion"
      }
    ],
    nonAuthorityStatement: "This proof emits conformance evidence only. It does not create live ingestion, runtime, adapter, API, SDK, A2UI, SurfaceOps, JudgmentKit, or production behavior.",
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-source-conformance-authority-map", [upstream.p2CatalogRef.path, upstream.p2EvidenceRef.path])
  };
}

function evaluateExpectations(fixtureRows, context) {
  return fixtureRows.map(({ expectation, fixture }) => {
    const actual = evaluateFixture(expectation, fixture, context);
    const matched = actual.result === expectation.expectedResult &&
      actual.promotionStatus === expectation.promotionStatus &&
      canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code)) === canonicalJson(expectation.diagnosticCodes);
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
      diagnostics: actual.diagnostics,
      artifactPath: expectation.artifactPath,
      jsonPointer: expectation.jsonPointer,
      componentId: fixture.componentId || null,
      authorityConflict: fixture.authorityConflict || null,
      reviewQueueItemId: actual.reviewQueueItemId,
      review: actual.review || null,
      requiredSourceRefs: fixture.requiredSourceRefs || [],
      matched
    };
  });
}

function evaluateFixture(expectation, fixture, context) {
  if (expectation.kind === "mutation") {
    return evaluateMutationFixture(expectation, fixture);
  }
  if (!isDeclaredSourceRef(fixture.sourceRef)) {
    return invalidResult("DECLARED_SOURCE_REF_INVALID");
  }
  if (!context.declaredSourceRoots.has(declaredSourceRootForRef(fixture.sourceRef))) {
    return invalidResult("DECLARED_SOURCE_REF_UNDECLARED");
  }
  if ((fixture.requiredSourceRefs || []).some((sourceRef) => !isDeclaredSourceRef(sourceRef))) {
    return invalidResult("DECLARED_SOURCE_REF_INVALID");
  }
  if ((fixture.requiredSourceRefs || []).some((sourceRef) => !context.declaredSourceRoots.has(declaredSourceRootForRef(sourceRef)))) {
    return invalidResult("DECLARED_SOURCE_REF_UNDECLARED");
  }
  if (!context.catalogComponentIds.has(fixture.componentId)) {
    return invalidResult("SOURCE_CATALOG_COMPONENT_UNKNOWN");
  }
  if (!context.componentSourceRoots.get(fixture.componentId)?.has(declaredSourceRootForRef(fixture.sourceRef))) {
    return invalidResult("SOURCE_COMPONENT_SOURCE_MISMATCH");
  }
  if (context.primaryComponentSourceRoots.get(fixture.componentId) !== declaredSourceRootForRef(fixture.sourceRef)) {
    return invalidResult("SOURCE_COMPONENT_SOURCE_MISMATCH");
  }
  const authorityConflictResult = evaluateAuthorityConflict(fixture, context);
  if (authorityConflictResult.result !== "valid") {
    return authorityConflictResult;
  }
  if (hasForbiddenProductionClaim(fixture.claims)) {
    return invalidResult("SOURCE_PRODUCTION_CLAIM_FORBIDDEN");
  }
  if (fixture.review?.required === true) {
    if (!(fixture.requiredSourceRefs || []).includes(SC_REVIEW_POLICY_SOURCE_REF)) {
      return invalidResult("SOURCE_REVIEW_POLICY_REF_MISSING");
    }
    if (!fixture.review.owner || !fixture.review.rationale || !fixture.review.expiresAt) {
      return invalidResult("SOURCE_REVIEW_OWNER_MISSING");
    }
    if (!isFutureCanonicalUtcTimestamp(fixture.review.expiresAt, SC_TIMESTAMP)) {
      return invalidResult("SOURCE_REVIEW_EXPIRED", {
        review: {
          owner: fixture.review.owner,
          rationale: fixture.review.rationale,
          expiresAt: fixture.review.expiresAt
        }
      });
    }
    const diagnosticCode = authorityConflictResult.reviewDiagnosticCode || "SOURCE_REVIEW_REQUIRED";
    return {
      result: "review_required",
      promotionStatus: "review_required",
      diagnostics: [diagnosticForCode(diagnosticCode)],
      reviewQueueItemId: `source-review-${fixture.fixtureId}`,
      review: {
        owner: fixture.review.owner,
        rationale: fixture.review.rationale,
        expiresAt: fixture.review.expiresAt
      }
    };
  }
  return { result: "valid", promotionStatus: "allowed", diagnostics: [], reviewQueueItemId: null };
}

function evaluateAuthorityConflict(fixture, context) {
  const conflict = fixture.authorityConflict;
  if (!conflict) return { result: "valid" };
  const conflictingRefs = Array.isArray(conflict.conflictingRefs) ? conflict.conflictingRefs : [];
  const conflictRefs = [
    ...conflictingRefs,
    conflict.resolvedBy,
    conflict.selectedSourceRef
  ].filter((sourceRef) => sourceRef !== null && sourceRef !== undefined);
  if (conflictRefs.some((sourceRef) => !isDeclaredSourceRef(sourceRef))) {
    return invalidResult("DECLARED_SOURCE_REF_INVALID");
  }
  if (conflictRefs.some((sourceRef) => !context.declaredSourceRoots.has(declaredSourceRootForRef(sourceRef)))) {
    return invalidResult("DECLARED_SOURCE_REF_UNDECLARED");
  }
  if (conflict.resolutionRule === null) {
    return invalidResult("SOURCE_AUTHORITY_CONFLICT");
  }
  if (conflict.resolutionRule === "declared-source-precedence") {
    if (
      conflict.resolvedBy !== SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF ||
      !fixture.requiredSourceRefs.includes(SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF) ||
      conflict.selectedSourceRef !== context.primaryComponentSourceRoots.get(fixture.componentId) ||
      !fixture.requiredSourceRefs.includes(conflict.selectedSourceRef) ||
      !isExpectedButtonSupportingConflict(fixture.componentId, conflictingRefs)
    ) {
      return invalidResult("SOURCE_AUTHORITY_CONFLICT");
    }
    return { result: "valid" };
  }
  if (conflict.resolutionRule === "review-required") {
    if (
      conflict.resolvedBy !== SC_REVIEW_POLICY_SOURCE_REF ||
      conflict.selectedSourceRef !== null
    ) {
      return invalidResult("SOURCE_AUTHORITY_CONFLICT");
    }
    if (
      !fixture.requiredSourceRefs.includes(SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF) ||
      !fixture.requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF)
    ) {
      return invalidResult("SOURCE_REVIEW_POLICY_REF_MISSING");
    }
    if (fixture.review?.required !== true) {
      return invalidResult("SOURCE_REVIEW_OWNER_MISSING");
    }
    return { result: "valid", reviewDiagnosticCode: "SOURCE_MAPPING_AMBIGUOUS" };
  }
  return invalidResult("SOURCE_AUTHORITY_CONFLICT");
}

function isExpectedButtonSupportingConflict(componentId, conflictingRefs) {
  if (componentId !== "Button") return false;
  return canonicalJson([...conflictingRefs].sort()) === canonicalJson([...BUTTON_SUPPORTING_SOURCE_REFS].sort());
}

function evaluateMutationFixture(expectation, fixture) {
  const code = expectation.diagnosticCodes[0];
  if (code === "SOURCE_UPSTREAM_EVIDENCE_MISSING" && Array.isArray(fixture.upstreamRefs) && fixture.upstreamRefs.length === 0) {
    return invalidResult(code);
  }
  if (code === "DECLARED_SOURCE_PATH_UNDECLARED" && fixture.sourceFiles?.some((entry) => entry.path === "components/private-card.json")) {
    return invalidResult(code);
  }
  if (code === "DECLARED_SOURCE_HASH_MISMATCH" && fixture.sourceFiles?.[0]?.sha256 === "0".repeat(64)) {
    return invalidResult(code);
  }
  if (code === "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH") {
    return invalidResult(code);
  }
  return { result: "valid", promotionStatus: "allowed", diagnostics: [], reviewQueueItemId: null };
}

function invalidResult(code, options = {}) {
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForCode(code)],
    reviewQueueItemId: null,
    review: options.review || null
  };
}

function isDeclaredSourceRef(sourceRef) {
  return typeof sourceRef === "string" &&
    /^declared-source:\/\/source-conformance\/(components|policies|governance)\/[a-z0-9-]+\.json#\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*)?$/.test(sourceRef);
}

function declaredSourceRootForRef(sourceRef) {
  if (!isDeclaredSourceRef(sourceRef)) return null;
  return sourceRef.replace(/#\/.*$/, "#/");
}

function hasForbiddenProductionClaim(claims = {}) {
  return SC_FORBIDDEN_CLAIM_KEYS.some((key) => claims[key] === true);
}

function isFutureCanonicalUtcTimestamp(value, minimumExclusive) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  const minimum = Date.parse(minimumExclusive);
  if (!Number.isFinite(timestamp) || !Number.isFinite(minimum)) return false;
  return timestamp > minimum && new Date(timestamp).toISOString() === value;
}

async function componentSourceRootsForManifest(cwd, manifest) {
  const componentSourceRoots = new Map();
  for (const sourceFile of manifest.sourceFiles) {
    const document = await readJson(path.join(cwd, SC_SOURCE_ROOT, sourceFile.path));
    if (document.sourceType === "component" && document.componentId) {
      const roots = componentSourceRoots.get(document.componentId) || new Set();
      roots.add(sourceFile.sourceRefRoot);
      componentSourceRoots.set(document.componentId, roots);
    }
  }
  return componentSourceRoots;
}

function buildReviewQueue({ validationResults, diagnostics }) {
  const queueItems = validationResults
    .filter((row) => row.actualResult === "review_required")
    .map((row) => ({
      reviewQueueItemId: row.reviewQueueItemId,
      fixturePath: row.fixturePath,
      componentId: row.componentId,
      owner: row.review.owner,
      rationale: row.review.rationale,
      expiresAt: row.review.expiresAt,
      requiredSourceRefs: row.requiredSourceRefs,
      evidencePath: `${SC_ARTIFACT_ROOT}/evidence.json`,
      executable: false,
      promotionStatus: "review_required"
    }));
  const reviewCodes = new Set(validationResults
    .filter((row) => row.actualResult === "review_required")
    .flatMap((row) => row.diagnosticCodes));
  return {
    schemaId: "source-review-queue.v0",
    version: SC_VERSION,
    queueItems,
    promotionStatus: queueItems.length > 0 ? "review_required" : "allowed",
    diagnostics: sortDiagnostics(diagnostics.filter((diagnostic) => reviewCodes.has(diagnostic.code))),
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-source-conformance-review-queue", queueItems.map((item) => item.fixturePath))
  };
}

function primaryComponentSourceRoots() {
  return new Map([
    ["Button", BUTTON_PRIMARY_SOURCE_REF],
    ["InLineAlert", "declared-source://source-conformance/components/in-line-alert.json#/"]
  ]);
}

function buildReport({ runId, upstream, inventoryRef, authorityMapRef, reviewQueueRef, validationResults, diagnostics, status, promotionStatus }) {
  return {
    schemaId: "source-conformance-report.v0",
    version: SC_VERSION,
    runId,
    sourceRoot: SC_SOURCE_ROOT,
    fixtureRoot: SC_FIXTURE_ROOT,
    artifactRoot: SC_ARTIFACT_ROOT,
    upstreamPreflight: {
      status: "pass",
      refs: [upstream.p2EvidenceRef, upstream.p2CatalogRef]
    },
    sourceInventoryRef: inventoryRef,
    sourceAuthorityMapRef: authorityMapRef,
    sourceReviewQueueRef: reviewQueueRef,
    results: validationResults.map(stripResult),
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    status,
    promotionStatus,
    provenance: provenance("interfacectl-source-conformance-report", validationResults.map((row) => row.fixturePath))
  };
}

async function buildEvidence({ cwd, runId, command, args, manifestRef, declaredSourceRefs, upstream, inventoryRef, authorityMapRef, reviewQueueRef, reportRef, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const artifactPath of scSchemaPaths()) {
    schemaClosure.push(artifactRef(artifactPath, schemaIdForSourceConformancePath(artifactPath), await canonicalFileHash(path.join(cwd, artifactPath))));
  }
  const fixtureRefs = [];
  for (const fixturePath of scFixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, schemaIdForSourceConformancePath(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }
  const boundaryRefs = [
    upstream.p2EvidenceRef,
    upstream.p2CatalogRef
  ].map(withBoundaryProvenance);
  const artifactRefs = [];
  for (const artifactPath of SC_ARTIFACT_PATHS) {
    artifactRefs.push({
      ...artifactRef(
        artifactPath,
        schemaIdForSourceConformancePath(artifactPath),
        artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: {
        generatedAt: SC_TIMESTAMP,
        generator: "interfacectl-source-conformance-evidence",
        sourceRefs: artifactPath === `${SC_ARTIFACT_ROOT}/evidence.json` ? ["plans/source-conformance/validation-evidence.md"] : [artifactPath]
      }
    });
  }
  const evidence = {
    contractId: SC_CONTRACT_ID,
    schemaId: "source-conformance-evidence.v0",
    version: SC_VERSION,
    runId,
    checkedAt: SC_TIMESTAMP,
    command,
    args,
    environment: { ...SC_ENVIRONMENT },
    schemaClosure,
    sourceManifestRef: manifestRef,
    sourceFileRefs: declaredSourceRefs,
    fixtureRefs,
    boundaryRefs,
    artifacts: artifactRefs,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: validationResults.map(stripResult),
    status,
    promotionStatus,
    provenance: provenance("interfacectl-source-conformance-evidence", ["plans/source-conformance/validation-evidence.md"])
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);
  assertOrderedPaths("source conformance evidence schemaClosure", evidence.schemaClosure.map((entry) => entry.path), scSchemaPaths());
  assertOrderedPaths("source conformance evidence fixtureRefs", evidence.fixtureRefs.map((entry) => entry.path), scFixturePaths());
  assertOrderedPaths("source conformance evidence artifacts", evidence.artifacts.map((entry) => entry.path), SC_ARTIFACT_PATHS);
  assertOrderedPaths("source conformance evidence validationResults", evidence.validationResults.map((entry) => entry.fixturePath), SC_EXPECTATION_ROWS.map((row) => row.fixturePath));
  return evidence;
}

function withBoundaryProvenance(ref) {
  return {
    ...ref,
    provenance: {
      generatedAt: SC_TIMESTAMP,
      generator: "interfacectl-source-conformance-boundary",
      sourceRefs: [ref.path]
    }
  };
}

function stripResult(row) {
  return {
    fixturePath: row.fixturePath,
    kind: row.kind,
    stage: row.stage,
    phase: row.phase,
    expectedResult: row.expectedResult,
    actualResult: row.actualResult,
    promotionStatus: row.promotionStatus,
    diagnosticCodes: row.diagnosticCodes,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    componentId: row.componentId,
    authorityConflict: row.authorityConflict || null,
    reviewQueueItemId: row.reviewQueueItemId,
    review: row.review || null,
    requiredSourceRefs: row.requiredSourceRefs,
    matched: row.matched
  };
}

function diagnosticForCode(code) {
  const row = diagnosticsRegistry().find((candidate) => candidate.code === code);
  if (!row) throw contractError(`missing source conformance diagnostic registry row: ${code}`, 1);
  return { ...row };
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    `${a.stage}:${a.code}:${a.artifactPath}:${a.jsonPointer}`.localeCompare(`${b.stage}:${b.code}:${b.artifactPath}:${b.jsonPointer}`)
  );
}

function aggregatePromotionStatus(validationResults) {
  if (validationResults.some((row) => row.promotionStatus === "review_required")) return "review_required";
  return "allowed";
}

function assertRunExpectation(expectations, data) {
  if (data.status !== expectations.runExpectation.status || data.promotionStatus !== expectations.runExpectation.promotionStatus) {
    throw contractError(`source conformance run expectation mismatch: expected ${expectations.runExpectation.status}/${expectations.runExpectation.promotionStatus} got ${data.status}/${data.promotionStatus}`, 1);
  }
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });
  for (const file of SC_CONSUMED_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, SC_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  for (const file of SC_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, SC_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const scopes = ["source-conformance", "p2", "p0"];
      for (const scope of scopes) {
        const validate = ajv.getSchema(`https://surfaces.dev/schemas/${scope}/${schemaId}.schema.json`);
        if (validate) {
          const valid = validate(data);
          return { valid, errors: validate.errors || [] };
        }
      }
      throw new Error(`schema not loaded: ${schemaId}`);
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

function buildRunId({ manifest, expectations, command, args, upstream }) {
  return `source-conformance-${sha256Hex(canonicalJson({
    manifestHash: sha256Hex(canonicalJson(manifest)),
    expectationsHash: sha256Hex(canonicalJson(expectations)),
    upstreamEvidence: upstream.p2EvidenceRef.hash,
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
  for (const ref of evidence.schemaClosure || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  if (evidence.sourceManifestRef?.hash !== await canonicalFileHash(path.join(cwd, evidence.sourceManifestRef.path))) {
    return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.sourceFileRefs || []) {
    if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  const boundaryFailureCode = await firstBoundaryRefIntegrityFailureCode(cwd, evidence.boundaryRefs || []);
  if (boundaryFailureCode !== null) return boundaryFailureCode;
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${SC_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${SC_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

async function firstBoundaryRefIntegrityFailureCode(cwd, boundaryRefs) {
  const expectedPaths = [SC_P2_EVIDENCE_PATH, SC_P2_CATALOG_PATH];
  if (canonicalJson(boundaryRefs.map((ref) => ref.path)) !== canonicalJson(expectedPaths)) {
    return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
  }
  const p2Evidence = await readJson(path.join(cwd, SC_P2_EVIDENCE_PATH));
  const p2EvidenceHash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  const expectedBoundaryRefs = [
    withBoundaryProvenance(artifactRef(SC_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2EvidenceHash)),
    withBoundaryProvenance(artifactRef(SC_P2_CATALOG_PATH, "runtime-catalog.v0", await canonicalFileHash(path.join(cwd, SC_P2_CATALOG_PATH)), {
      sourceEvidenceHash: p2EvidenceHash
    }))
  ];
  for (let index = 0; index < expectedBoundaryRefs.length; index += 1) {
    if (canonicalJson(boundaryRefs[index]) !== canonicalJson(expectedBoundaryRefs[index])) {
      return "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH";
    }
  }
  return null;
}

function assertOrderedPaths(label, actual, expected) {
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    throw contractError(`${label} order drift`, 1);
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

export const sourceConformanceInternals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode
};
