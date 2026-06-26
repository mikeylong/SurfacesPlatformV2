import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
import {
  P3_ACCEPTED_P2_CATALOG_HASH,
  P3_ACCEPTED_P2_EVIDENCE_HASH,
  P3_ARTIFACT_PATHS,
  P3_ARTIFACT_ROOT,
  P3_CATALOG_PATH,
  P3_DIAGNOSTIC_ROWS,
  P3_ENVIRONMENT,
  P3_EXPECTATION_ROWS,
  P3_FIXTURE_FILES,
  P3_FIXTURE_ROOT,
  P3_GENERATED_ARTIFACTS,
  P3_INGESTION_EVIDENCE_PATH,
  P3_SCHEMA_FILES,
  P3_SCHEMA_ROOT,
  P3_TIMESTAMP,
  P3_VERSION,
  buildP3Fixtures,
  diagnosticsRegistry,
  inertExecution,
  p3ArtifactOrder,
  p3FixturePaths,
  p3SchemaPaths,
  schemaIdForP3Path
} from "./p3-contract.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;
const PATH_ROOT_PATTERN = /^(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*(?:^|\/)\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9._@-]+(?:\/[A-Za-z0-9._@-]+)*$/;
const STAGE_ORDER = new Map([
  ["preflight", 0],
  ["registry", 1],
  ["recruitment", 2],
  ["orchestration", 3],
  ["work-order", 4],
  ["review", 5],
  ["report", 6],
  ["evidence", 7]
]);
const PREFLIGHT_DIAGNOSTIC_FIXTURES = new Map([
  ["AGENT_UPSTREAM_EVIDENCE_MISSING", "mutations/missing-upstream-evidence.agent-preflight.json"],
  ["AGENT_UPSTREAM_EVIDENCE_FAILED", "mutations/failing-upstream-evidence.agent-preflight.json"],
  ["AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH", "mutations/upstream-evidence-hash-mismatch.agent-preflight.json"],
  ["AGENT_UPSTREAM_EVIDENCE_STALE", "mutations/stale-upstream-evidence.agent-preflight.json"]
]);

export async function runP3Interfacectl(argv, io) {
  const parsed = parseAgentsProofArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runAgentsProof({
      cwd: io.cwd,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: "interfacectl surfaces agents proof",
      args: {
        ingestionEvidence: parsed.ingestionEvidence,
        catalog: parsed.catalog,
        fixture: parsed.fixture,
        out: parsed.out
      }
    });
    io.stdout.write([
      `surfaces agents proof: ${result.status}`,
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

function parseAgentsProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--ingestion-evidence") {
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
  if (!result.ingestionEvidence || !result.catalog || !result.fixture || !result.out) {
    return { ok: false, error: `usage: interfacectl surfaces agents proof --ingestion-evidence ${P3_INGESTION_EVIDENCE_PATH} --catalog ${P3_CATALOG_PATH} --fixture ${P3_FIXTURE_ROOT} --out ${P3_ARTIFACT_ROOT}` };
  }
  for (const [flagName, value] of [
    ["--ingestion-evidence", result.ingestionEvidence],
    ["--catalog", result.catalog],
    ["--fixture", result.fixture],
    ["--out", result.out]
  ]) {
    const parsed = parseRelativePosixPath(value, flagName);
    if (!parsed.ok) return parsed;
    if (flagName === "--ingestion-evidence") result.ingestionEvidence = parsed.path;
    else result[flagName.slice(2)] = parsed.path;
  }
  return { ok: true, ...result };
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

export async function runAgentsProof({ cwd, ingestionEvidencePath, catalogPath, fixtureRoot, outRoot, command, args }) {
  assertP3CommandRoots(ingestionEvidencePath, catalogPath, fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, P3_SCHEMA_ROOT), `unreadable schema path: ${P3_SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);

  const upstream = await strictP2Preflight(cwd, ingestionEvidencePath, catalogPath);

  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertRequiredP3Files(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const validators = await loadValidators(cwd);
  const expectations = await readJson(path.join(cwd, fixtureRoot, "expectations.manifest.json"));
  assertSchema(validators, "agent-orchestration-expectations.v0", expectations, `${fixtureRoot}/expectations.manifest.json`);
  await assertP3Expectations(cwd, expectations, fixtureRoot, outRoot);

  const registryFixture = await readJson(path.join(cwd, fixtureRoot, "agent-capability-registry.fixture.json"));
  assertSchema(validators, "agent-capability-registry-fixture.v0", registryFixture, `${fixtureRoot}/agent-capability-registry.fixture.json`);
  const runId = buildRunId({ upstream, registryFixture, expectations, command, args });

  const registry = buildCapabilityRegistry({ registryFixture, upstream });
  assertSchema(validators, "agent-capability-registry.v0", registry, `${outRoot}/agent-capability-registry.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "agent-capability-registry.json"), registry);
  const registryHash = await canonicalFileHash(path.join(cwd, outRoot, "agent-capability-registry.json"));
  const registryRef = artifactRef(`${outRoot}/agent-capability-registry.json`, "agent-capability-registry.v0", registryHash);

  const taskFixtures = await loadTaskFixtures(cwd, expectations, validators);
  const validationResults = await evaluateP3Expectations({
    cwd,
    expectations,
    taskFixtures,
    registry,
    registryHash
  });
  const diagnostics = sortDiagnostics(validationResults.flatMap((result) => result.diagnostics));
  const status = validationResults.every((result) => result.matched) ? "pass" : "fail";
  if (status === "fail") {
    const mismatches = validationResults
      .filter((result) => !result.matched)
      .map((result) => `${result.fixturePath}: expected ${result.expectedResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"} got ${result.actualResult}/${result.promotionStatus}/${result.diagnosticCodes.join(",") || "none"}`);
    throw contractError(`P3 validation expectation mismatch: ${mismatches.join("; ")}`, 1);
  }
  const promotionStatus = aggregatePromotionStatus(validationResults);

  const selectedTasks = buildSelectedTasks(taskFixtures, registry);
  const plan = buildOrchestrationPlan({ runId, upstream, registryRef, selectedTasks });
  assertOrchestrationPlanInvariants(plan, registry);
  assertSchema(validators, "agent-orchestration-plan.v0", plan, `${outRoot}/orchestration-plan.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "orchestration-plan.json"), plan);
  const planHash = await canonicalFileHash(path.join(cwd, outRoot, "orchestration-plan.json"));
  const planRef = artifactRef(`${outRoot}/orchestration-plan.json`, "agent-orchestration-plan.v0", planHash);

  const workOrders = buildWorkOrders({ runId, selectedTasks });
  const workOrderRefs = [];
  for (const workOrder of workOrders) {
    const fileName = `${workOrder.workOrderId}.json`;
    const artifactPath = `${outRoot}/${fileName}`;
    assertSchema(validators, "agent-work-order.v0", workOrder, artifactPath);
    await writeCanonicalJson(path.join(cwd, artifactPath), workOrder);
    workOrderRefs.push(artifactRef(artifactPath, "agent-work-order.v0", await canonicalFileHash(path.join(cwd, artifactPath))));
  }

  const reviewQueue = buildReviewQueue({ runId, planRef, selectedTasks });
  assertSchema(validators, "agent-review-queue.v0", reviewQueue, `${outRoot}/review-queue.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "review-queue.json"), reviewQueue);
  const reviewQueueRef = artifactRef(`${outRoot}/review-queue.json`, "agent-review-queue.v0", await canonicalFileHash(path.join(cwd, outRoot, "review-queue.json")));

  const report = buildReport({
    runId,
    upstream,
    registryRef,
    planRef,
    reviewQueueRef,
    validationResults,
    diagnostics,
    workOrderRefs,
    reviewQueue,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, report);
  assertSchema(validators, "agent-orchestration-report.v0", report, `${outRoot}/agent-orchestration-report.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "agent-orchestration-report.json"), report);
  const reportRef = artifactRef(`${outRoot}/agent-orchestration-report.json`, "agent-orchestration-report.v0", await canonicalFileHash(path.join(cwd, outRoot, "agent-orchestration-report.json")));

  const evidence = await buildEvidence({
    cwd,
    runId,
    command,
    args,
    upstream,
    registryRef,
    planRef,
    workOrderRefs,
    reviewQueueRef,
    reportRef,
    validationResults,
    diagnostics,
    status,
    promotionStatus
  });
  assertRunExpectation(expectations, evidence);
  assertSchema(validators, "agent-orchestration-evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, outRoot, "evidence.json"), evidence);
  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("P3 evidence self-hash verification failed", 1);
  }
  const integrityCode = await firstEvidenceIntegrityFailureCode(cwd, persistedEvidence);
  if (integrityCode !== null) {
    throw contractError(`P3 evidence integrity verification failed: ${integrityCode}`, 1);
  }

  return {
    status,
    promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: P3_ARTIFACT_PATHS
  };
}

function assertP3CommandRoots(ingestionEvidencePath, catalogPath, fixtureRoot, outRoot) {
  if (
    ingestionEvidencePath !== P3_INGESTION_EVIDENCE_PATH ||
    catalogPath !== P3_CATALOG_PATH ||
    fixtureRoot !== P3_FIXTURE_ROOT ||
    outRoot !== P3_ARTIFACT_ROOT
  ) {
    throw contractError(
      `P3 agents proof requires --ingestion-evidence ${P3_INGESTION_EVIDENCE_PATH} --catalog ${P3_CATALOG_PATH} --fixture ${P3_FIXTURE_ROOT} --out ${P3_ARTIFACT_ROOT}`,
      2
    );
  }
}

async function strictP2Preflight(cwd, ingestionEvidencePath, catalogPath) {
  await assertRegularLocalFile(path.join(cwd, ingestionEvidencePath), ingestionEvidencePath);
  await assertRegularLocalFile(path.join(cwd, catalogPath), catalogPath);
  const p2Evidence = await readJson(path.join(cwd, ingestionEvidencePath));
  const p2Catalog = await readJson(path.join(cwd, catalogPath));

  const p2EvidenceRef = findSingleArtifactRef(p2Evidence, ingestionEvidencePath);
  const p2CatalogRef = findSingleArtifactRef(p2Evidence, catalogPath);
  const p2EvidenceSelfHash = p2Internals.computeEvidenceSelfHash(p2Evidence);
  if (p2Evidence.schemaId !== "design-system-ingestion-evidence.v0" || p2EvidenceRef.hash !== p2EvidenceSelfHash) {
    throw contractError("P3 upstream evidence self-hash validation failed", 1);
  }
  if (p2Evidence.status !== "pass" || p2Evidence.promotionStatus === "blocked") {
    throw contractError("P3 upstream evidence status is not pass", 1);
  }
  if (p2EvidenceSelfHash !== P3_ACCEPTED_P2_EVIDENCE_HASH || p2EvidenceRef.hash !== P3_ACCEPTED_P2_EVIDENCE_HASH) {
    throw contractError("P3 upstream evidence hash does not match the accepted boundary", 1);
  }

  const currentCatalogHash = await canonicalFileHash(path.join(cwd, catalogPath));
  if (
    p2Catalog.schemaId !== "runtime-catalog.v0" ||
    p2CatalogRef.hash !== currentCatalogHash ||
    p2CatalogRef.hash !== P3_ACCEPTED_P2_CATALOG_HASH
  ) {
    throw contractError("P3 upstream catalog hash does not match the accepted boundary", 1);
  }

  return {
    ingestionEvidenceRef: artifactRef(ingestionEvidencePath, "design-system-ingestion-evidence.v0", p2EvidenceSelfHash),
    catalogRef: {
      ...artifactRef(catalogPath, "runtime-catalog.v0", currentCatalogHash),
      sourceEvidenceHash: p2EvidenceSelfHash
    },
    evidence: p2Evidence,
    catalog: p2Catalog
  };
}

function findSingleArtifactRef(evidence, artifactPath) {
  const refs = (evidence.artifactRefs || []).filter((entry) => entry.path === artifactPath);
  if (refs.length !== 1) {
    throw contractError(`P3 upstream evidence must contain exactly one ref for ${artifactPath}`, 1);
  }
  return refs[0];
}

async function assertRegularLocalFile(filePath, label) {
  let stat;
  try {
    stat = await fs.lstat(filePath);
  } catch {
    throw contractError(`P3 upstream evidence input is missing: ${label}`, 1);
  }
  if (!stat.isFile()) {
    throw contractError(`P3 input is not a regular file: ${label}`, 1);
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
  const required = new Set(p3SchemaPaths());
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, P3_SCHEMA_ROOT), P3_SCHEMA_ROOT)).sort();
  const missing = [...required].filter((entry) => !actualSchemaEntries.includes(entry)).sort();
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (required.has(entry)) return false;
    const fileName = entry.slice(`${P3_SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
  }
}

async function assertRequiredP3Files(cwd) {
  for (const relativePath of [...p3SchemaPaths(), ...p3FixturePaths()]) {
    try {
      const stat = await fs.lstat(path.join(cwd, relativePath));
      if (!stat.isFile()) throw new Error(`${relativePath} is not a file`);
    } catch {
      throw contractError(`missing P3 required file: ${relativePath}`, 2);
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
  const allowed = new Set(P3_GENERATED_ARTIFACTS);
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

async function assertP3Expectations(cwd, manifest, fixtureRoot, outRoot) {
  if (manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== P3_SCHEMA_ROOT) {
    throw contractError("P3 expectations manifest roots do not match proof command paths", 1);
  }
  assertOrderedPaths("P3 expectations manifest inputs", manifest.inputs, p3FixturePaths());
  assertOrderedPaths("P3 expectations manifest artifactOrder", manifest.artifactOrder, p3ArtifactOrder());
  assertOrderedPaths("P3 expectations fixture order", manifest.expectations.map((row) => row.fixturePath), P3_EXPECTATION_ROWS.map((row) => row.fixturePath));
  assertNoDuplicatePaths("P3 expectations manifest inputs", manifest.inputs);
  assertNoDuplicatePaths("P3 expectations manifest expectations", manifest.expectations.map((row) => row.fixturePath));
  for (const inputPath of manifest.inputs) {
    assertPathUnderRoot(inputPath, fixtureRoot, "P3 expectations input");
  }
  const expectedFixtureEntries = [
    ...p3FixturePaths(),
    ...expectedDirectoryEntries(p3FixturePaths(), fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("P3 fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

async function loadTaskFixtures(cwd, expectations, validators) {
  const rows = [];
  for (const expectation of expectations.expectations) {
    const fixture = await readJson(path.join(cwd, expectation.fixturePath));
    if (expectation.fixturePath.endsWith(".agent-task.json")) {
      assertSchema(validators, "agent-task.v0", fixture, expectation.fixturePath);
    } else if (expectation.fixturePath.endsWith(".agent-preflight.json")) {
      assertSchema(validators, "agent-preflight-mutation.v0", fixture, expectation.fixturePath);
    }
    rows.push({ expectation, fixture });
  }
  return rows;
}

function buildCapabilityRegistry({ registryFixture, upstream }) {
  return {
    schemaId: "agent-capability-registry.v0",
    version: P3_VERSION,
    ingestionEvidenceRef: upstream.ingestionEvidenceRef,
    catalogRef: upstream.catalogRef,
    agents: registryFixture.agents,
    capabilities: registryFixture.capabilities,
    policies: registryFixture.policies,
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-capability-registry",
      sourceRefs: registryFixture.provenance.sourceRefs
    },
    diagnostics: []
  };
}

async function evaluateP3Expectations({ cwd, expectations, taskFixtures, registry, registryHash }) {
  const results = [];
  const taskGraphDiagnostics = analyzeTaskFixtureGraph(taskFixtures);
  for (const { expectation, fixture } of taskFixtures) {
    const actual = await evaluateP3Fixture({ cwd, fixture, expectation, registry, registryHash, taskGraphDiagnostics });
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
      selectedAgentIds: actual.selectedAgentIds,
      workOrderPath: actual.workOrderPath,
      reviewQueuePath: actual.reviewQueuePath,
      matched,
      diagnostics: actual.diagnostics
    });
  }
  return results;
}

async function evaluateP3Fixture({ cwd, fixture, expectation, registry, registryHash, taskGraphDiagnostics }) {
  if (expectation.diagnosticCodes.length === 0) {
    const validation = validateAllowedTask(fixture, registry, taskGraphDiagnostics.get(expectation.fixturePath));
    if (!validation.ok) {
      return invalidResult(expectation, validation.code, []);
    }
    return {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: [],
      selectedAgentIds: validation.selectedAgentIds,
      workOrderPath: expectation.workOrderPath,
      reviewQueuePath: null
    };
  }

  const code = expectation.diagnosticCodes[0];
  if (!await fixtureMatchesDiagnostic(code, fixture, { cwd, registry, registryHash, graphCode: taskGraphDiagnostics.get(expectation.fixturePath) })) {
    return {
      result: "valid",
      promotionStatus: "allowed",
      diagnostics: [],
      selectedAgentIds: [],
      workOrderPath: null,
      reviewQueuePath: null
    };
  }

  if (code === "AGENT_REVIEW_REQUIRED") {
    const validation = validateAllowedTask(fixture, registry, taskGraphDiagnostics.get(expectation.fixturePath));
    if (!validation.ok) {
      return invalidResult(expectation, validation.code, []);
    }
    return {
      result: expectation.expectedResult,
      promotionStatus: expectation.promotionStatus,
      diagnostics: [diagnosticForExpectation(expectation)],
      selectedAgentIds: validation.selectedAgentIds,
      workOrderPath: null,
      reviewQueuePath: expectation.reviewQueuePath
    };
  }

  return {
    result: expectation.expectedResult,
    promotionStatus: expectation.promotionStatus,
    diagnostics: [diagnosticForExpectation(expectation)],
    selectedAgentIds: expectation.selectedAgentIds,
    workOrderPath: expectation.workOrderPath,
    reviewQueuePath: expectation.reviewQueuePath
  };
}

function validateAllowedTask(task, registry, graphCode = null) {
  if (task.schemaId !== "agent-task.v0") return { ok: false, code: "AGENT_CAPABILITY_UNREGISTERED" };
  if ((task.requestedTools || []).some((tool) => deniedRuntimeTokens().has(tool))) return { ok: false, code: "AGENT_TOOL_DENIED" };
  if ((task.requiredCapabilities || []).some((capabilityId) => !registry.capabilities[capabilityId])) {
    return { ok: false, code: "AGENT_CAPABILITY_UNREGISTERED" };
  }
  if ((task.allowedOutputs || []).some((output) => output.hidden || output.evidenceTracked === false || path.posix.basename(output.path).startsWith("."))) {
    return { ok: false, code: "AGENT_OUTPUT_HIDDEN" };
  }
  if (graphCode) return { ok: false, code: graphCode };
  if (!inputsStayInScope(task.allowedInputs || []) || !outputsStayInScope(task.allowedOutputs || [])) return { ok: false, code: "AGENT_SCOPE_ESCALATION" };
  const selection = selectAgentsForTask(task, registry);
  if (selection.selectedAgentIds.length === 0) return { ok: false, code: "AGENT_CAPABILITY_UNREGISTERED" };
  if (!selection.resolvedScope.ok) return { ok: false, code: "AGENT_SCOPE_ESCALATION", selectedAgentIds: selection.selectedAgentIds };
  return { ok: true, selectedAgentIds: selection.selectedAgentIds, resolvedScope: selection.resolvedScope };
}

async function fixtureMatchesDiagnostic(code, fixture, { registry, registryHash, graphCode }) {
  switch (code) {
    case "AGENT_CAPABILITY_UNREGISTERED":
      return (fixture.requiredCapabilities || []).some((capabilityId) => !registry.capabilities[capabilityId]);
    case "AGENT_TOOL_DENIED":
      return (fixture.requestedTools || []).some((tool) => deniedRuntimeTokens().has(tool));
    case "AGENT_SCOPE_ESCALATION":
      {
        const selection = selectAgentsForTask(fixture, registry);
        return !inputsStayInScope(fixture.allowedInputs || []) ||
          !outputsStayInScope(fixture.allowedOutputs || []) ||
          (selection.selectedAgentIds.length > 0 && !selection.resolvedScope.ok);
      }
    case "AGENT_OUTPUT_HIDDEN":
      return (fixture.allowedOutputs || []).some((output) => output.hidden || output.evidenceTracked === false || path.posix.basename(output.path).startsWith("."));
    case "AGENT_DEPENDENCY_CYCLE":
      return graphCode === "AGENT_DEPENDENCY_CYCLE";
    case "AGENT_DEPENDENCY_MISSING":
      return graphCode === "AGENT_DEPENDENCY_MISSING";
    case "AGENT_UPSTREAM_EVIDENCE_MISSING":
    case "AGENT_UPSTREAM_EVIDENCE_FAILED":
    case "AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH":
    case "AGENT_UPSTREAM_EVIDENCE_STALE":
      return preflightFixtureMatchesDiagnostic(code, fixture);
    case "AGENT_REGISTRY_REF_MISSING":
      return fixture.schemaId === "agent-orchestration-plan.v0" && !fixture.registryRef;
    case "AGENT_REGISTRY_HASH_MISMATCH":
      return fixture.registryRef?.hash !== registryHash;
    case "AGENT_UNREGISTERED":
      return firstPlanInvariantFailure(fixture, registry) === "AGENT_UNREGISTERED";
    case "AGENT_TASK_DUPLICATE_ID":
      return firstPlanInvariantFailure(fixture, registry) === "AGENT_TASK_DUPLICATE_ID";
    case "AGENT_WORK_ORDER_DUPLICATE_ID":
      return firstPlanInvariantFailure(fixture, registry) === "AGENT_WORK_ORDER_DUPLICATE_ID";
    case "AGENT_HANDOFF_HIDDEN":
      return firstPlanInvariantFailure(fixture, registry) === "AGENT_HANDOFF_HIDDEN";
    case "AGENT_REVIEW_REQUIRED":
      return fixture.reviewPolicy === "review_required";
    case "AGENT_REPORT_PLAN_HASH_MISMATCH":
      return fixture.orchestrationPlanRef?.hash === "0".repeat(64);
    case "AGENT_EVIDENCE_HASH_MISMATCH":
      return fixture.artifacts?.[0]?.hash === "0".repeat(64);
    default:
      return false;
  }
}

function preflightFixtureMatchesDiagnostic(code, fixture) {
  const fixturePath = PREFLIGHT_DIAGNOSTIC_FIXTURES.get(code);
  if (!fixturePath) return false;
  return canonicalJson(fixture) === canonicalJson(buildP3Fixtures()[fixturePath]);
}

function invalidResult(expectation, code, selectedAgentIds = []) {
  return {
    result: "invalid",
    promotionStatus: "blocked",
    diagnostics: [diagnosticForExpectation({ ...expectation, diagnosticCodes: [code] })],
    selectedAgentIds,
    workOrderPath: null,
    reviewQueuePath: null
  };
}

function compareExpectation(expectation, actual) {
  return actual.result === expectation.expectedResult &&
    actual.promotionStatus === expectation.promotionStatus &&
    canonicalJson(actual.diagnostics.map((diagnostic) => diagnostic.code)) === canonicalJson(expectation.diagnosticCodes) &&
    canonicalJson(actual.selectedAgentIds) === canonicalJson(expectation.selectedAgentIds) &&
    actual.workOrderPath === expectation.workOrderPath &&
    actual.reviewQueuePath === expectation.reviewQueuePath;
}

function selectAgentsForTask(task, registry) {
  const candidates = Object.values(registry.agents || {})
    .filter((agent) => (task.requiredCapabilities || []).every((capabilityId) => agent.capabilityIds.includes(capabilityId)))
    .sort((a, b) => a.agentId.localeCompare(b.agentId));
  if (candidates.length === 0) {
    return {
      selectedAgentIds: [],
      resolvedScope: { ok: false, allowedInputs: [], allowedOutputs: [] }
    };
  }
  const selectedAgent = candidates[0];
  const resolvedScope = resolveTaskScope({ task, registry, agent: selectedAgent });
  return {
    selectedAgentIds: [selectedAgent.agentId],
    resolvedScope
  };
}

function resolveTaskScope({ task, registry, agent }) {
  const capabilities = (task.requiredCapabilities || []).map((capabilityId) => registry.capabilities[capabilityId]).filter(Boolean);
  const requestedInputs = task.allowedInputs || [];
  const requestedOutputs = task.allowedOutputs || [];
  const agentInputPaths = new Set(agent.allowedInputs || []);
  const agentOutputPaths = new Set(agent.allowedOutputs || []);

  const allowedInputs = requestedInputs.filter((input) =>
    agentInputPaths.has(input.path) &&
    capabilities.every((capability) => (capability.allowedInputClasses || []).includes(inputClassForRef(input)))
  );
  const allowedOutputs = requestedOutputs.filter((output) =>
    agentOutputPaths.has(output.path) &&
    capabilities.every((capability) =>
      (capability.allowedOutputClasses || []).includes(output.schemaId) &&
      (capability.allowedOutputPaths || []).includes(output.path)
    )
  );

  return {
    ok: allowedInputs.length === requestedInputs.length &&
      allowedOutputs.length === requestedOutputs.length &&
      requestedInputs.length > 0 &&
      requestedOutputs.length > 0,
    allowedInputs,
    allowedOutputs
  };
}

function inputClassForRef(ref) {
  if (ref.schemaId === "design-system-ingestion-evidence.v0") return "p2-evidence";
  if (ref.schemaId === "runtime-catalog.v0") return "p2-catalog";
  if (ref.schemaId === "agent-orchestration-expectations.v0" || ref.schemaId === "agent-task.v0") return "p3-fixture";
  if (ref.schemaId === "agent-orchestration-plan.v0") return "p3-plan";
  return null;
}

function buildSelectedTasks(taskFixtures, registry) {
  return taskFixtures
    .filter(({ expectation }) => expectation.kind === "valid" || expectation.kind === "review")
    .map(({ fixture, expectation }) => {
      const selection = selectAgentsForTask(fixture, registry);
      if (selection.selectedAgentIds.length === 0 || !selection.resolvedScope.ok) {
        throw contractError(`P3 selected task has no registry-authorized scope: ${expectation.fixturePath}`, 1);
      }
      return {
        fixture,
        expectation,
        selectedAgentIds: selection.selectedAgentIds,
        resolvedScope: selection.resolvedScope
      };
    });
}

function buildOrchestrationPlan({ runId, upstream, registryRef, selectedTasks }) {
  const reviewTasks = selectedTasks.filter(({ fixture }) => fixture.reviewPolicy === "review_required");
  return {
    schemaId: "agent-orchestration-plan.v0",
    version: P3_VERSION,
    runId,
    registryRef,
    boundaryRefs: [
      upstream.ingestionEvidenceRef,
      upstream.catalogRef,
      registryRef
    ],
    tasks: selectedTasks.map(({ fixture, expectation, selectedAgentIds, resolvedScope }) => ({
      taskId: fixture.taskId,
      taskKind: fixture.taskKind,
      sourceFixtureRef: expectation.requiredSourceRef,
      requiredCapabilities: fixture.requiredCapabilities,
      selectedAgentIds,
      dependencies: sortDependencies(fixture.dependencies),
      promotionStatus: fixture.reviewPolicy,
      workOrderRef: fixture.reviewPolicy === "allowed" ? plannedWorkOrderRef({ runId, fixture, agentId: selectedAgentIds[0], resolvedScope }) : null,
      reviewQueueRef: fixture.reviewPolicy === "review_required" ? forwardReviewQueueRef(runId, reviewTasks.length) : null
    })),
    workOrders: selectedTasks
      .filter(({ fixture }) => fixture.reviewPolicy === "allowed")
      .map(({ fixture, selectedAgentIds, resolvedScope }) => plannedWorkOrderRef({ runId, fixture, agentId: selectedAgentIds[0], resolvedScope })),
    reviewQueueRef: forwardReviewQueueRef(runId, reviewTasks.length),
    diagnostics: [],
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-orchestration-plan",
      sourceRefs: selectedTasks.map(({ expectation }) => expectation.requiredSourceRef)
    }
  };
}

function plannedWorkOrderRef({ runId, fixture, agentId, resolvedScope }) {
  const outputPath = resolvedScope.allowedOutputs[0].path;
  return {
    path: outputPath,
    schemaId: "agent-work-order.v0",
    runId,
    workOrderId: path.posix.basename(outputPath, ".json"),
    taskId: fixture.taskId,
    agentId
  };
}

function forwardReviewQueueRef(runId, expectedItemCount) {
  return {
    path: `${P3_ARTIFACT_ROOT}/review-queue.json`,
    schemaId: "agent-review-queue.v0",
    runId,
    expectedItemCount
  };
}

function buildWorkOrders({ runId, selectedTasks }) {
  return selectedTasks
    .filter(({ fixture }) => fixture.reviewPolicy === "allowed")
    .map(({ fixture, expectation, selectedAgentIds, resolvedScope }) => ({
      schemaId: "agent-work-order.v0",
      version: P3_VERSION,
      runId,
      workOrderId: path.posix.basename(fixture.allowedOutputs[0].path, ".json"),
      taskId: fixture.taskId,
      agentId: selectedAgentIds[0],
      capabilityIds: fixture.requiredCapabilities,
      allowedInputs: resolvedScope.allowedInputs,
      allowedOutputs: resolvedScope.allowedOutputs,
      dependencies: sortDependencies(fixture.dependencies),
      deniedCapabilities: fixture.deniedCapabilities,
      evidenceObligations: fixture.evidenceObligations,
      promotionStatus: "allowed",
      nonExecutable: true,
      execution: inertExecution(),
      provenance: {
        generatedAt: P3_TIMESTAMP,
        generator: "interfacectl-p3-work-order",
        sourceRefs: [expectation.requiredSourceRef]
      }
    }));
}

function buildReviewQueue({ runId, planRef, selectedTasks }) {
  const reviewItems = selectedTasks
    .filter(({ fixture }) => fixture.reviewPolicy === "review_required")
    .map(({ fixture, expectation, selectedAgentIds }) => ({
      reviewItemId: `review.${fixture.taskId}`,
      taskId: fixture.taskId,
      sourceFixtureRef: expectation.requiredSourceRef,
      selectedAgentIds,
      requiredCapabilities: fixture.requiredCapabilities,
      requiredReviewerRole: fixture.requiredReviewerRole,
      suggestedAction: fixture.suggestedAction,
      diagnosticCode: "AGENT_REVIEW_REQUIRED",
      promotionStatus: "review_required",
      workOrderRef: null,
      nonExecutable: true,
      evidenceObligations: fixture.evidenceObligations,
      provenance: {
        generatedAt: P3_TIMESTAMP,
        generator: "interfacectl-p3-review-queue",
        sourceRefs: [expectation.requiredSourceRef]
      }
    }))
    .sort((a, b) =>
      a.taskId.localeCompare(b.taskId) ||
      a.sourceFixtureRef.localeCompare(b.sourceFixtureRef) ||
      a.diagnosticCode.localeCompare(b.diagnosticCode) ||
      a.reviewItemId.localeCompare(b.reviewItemId)
    );
  const reviewDiagnostics = reviewItems.length > 0 ? [diagnosticForCode("AGENT_REVIEW_REQUIRED")] : [];
  return {
    schemaId: "agent-review-queue.v0",
    version: P3_VERSION,
    runId,
    orchestrationPlanRef: planRef,
    items: reviewItems,
    diagnostics: reviewDiagnostics,
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-review-queue",
      sourceRefs: reviewItems.map((item) => item.sourceFixtureRef)
    }
  };
}

function buildReport({ runId, upstream, registryRef, planRef, reviewQueueRef, validationResults, diagnostics, workOrderRefs, reviewQueue, status, promotionStatus }) {
  return {
    schemaId: "agent-orchestration-report.v0",
    version: P3_VERSION,
    runId,
    ingestionEvidenceRef: upstream.ingestionEvidenceRef,
    catalogRef: upstream.catalogRef,
    registryRef,
    orchestrationPlanRef: planRef,
    reviewQueueRef,
    results: validationResults.map(stripResult),
    workOrderRefs,
    reviewQueueItems: reviewQueue.items,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    environment: { ...P3_ENVIRONMENT },
    status,
    promotionStatus,
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-report",
      sourceRefs: validationResults.map((result) => result.fixturePath)
    }
  };
}

async function buildEvidence({ cwd, runId, command, args, upstream, registryRef, planRef, workOrderRefs, reviewQueueRef, reportRef, validationResults, diagnostics, status, promotionStatus }) {
  const schemaClosure = [];
  for (const artifactPath of p3SchemaPaths()) {
    schemaClosure.push(artifactRef(artifactPath, schemaIdForP3Path(artifactPath), await canonicalFileHash(path.join(cwd, artifactPath))));
  }

  const fixtureRefs = [];
  for (const fixturePath of p3FixturePaths()) {
    fixtureRefs.push(artifactRef(fixturePath, schemaIdForP3Path(fixturePath), await canonicalFileHash(path.join(cwd, fixturePath))));
  }

  const boundaryRefs = [
    upstream.ingestionEvidenceRef,
    upstream.catalogRef,
    registryRef,
    planRef,
    ...workOrderRefs,
    reviewQueueRef,
    reportRef
  ];

  const artifactRefs = [];
  for (const artifactPath of P3_ARTIFACT_PATHS) {
    artifactRefs.push({
      ...artifactRef(
        artifactPath,
        schemaIdForP3Path(artifactPath),
        artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath))
      ),
      provenance: {
        generatedAt: P3_TIMESTAMP,
        generator: "interfacectl-p3-evidence",
        sourceRefs: artifactPath === `${P3_ARTIFACT_ROOT}/evidence.json` ? ["plans/p3/validation-evidence.md"] : [artifactPath]
      }
    });
  }

  const evidence = {
    contractId: "surfaces-p3-agent-orchestration-proof",
    schemaId: "agent-orchestration-evidence.v0",
    version: P3_VERSION,
    runId,
    checkedAt: P3_TIMESTAMP,
    command,
    args,
    environment: { ...P3_ENVIRONMENT },
    schemaClosure,
    fixtureRefs,
    boundaryRefs,
    artifacts: artifactRefs,
    diagnostics: sortDiagnostics(diagnostics),
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: validationResults.map(stripResult),
    status,
    promotionStatus,
    provenance: {
      generatedAt: P3_TIMESTAMP,
      generator: "interfacectl-p3-evidence",
      sourceRefs: ["plans/p3/validation-evidence.md"]
    }
  };
  evidence.artifacts[evidence.artifacts.length - 1].hash = computeEvidenceSelfHash(evidence);

  assertOrderedPaths("P3 evidence schemaClosure", evidence.schemaClosure.map((entry) => entry.path), p3SchemaPaths());
  assertOrderedPaths("P3 evidence fixtureRefs", evidence.fixtureRefs.map((entry) => entry.path), p3FixturePaths());
  assertOrderedPaths("P3 evidence artifacts", evidence.artifacts.map((entry) => entry.path), P3_ARTIFACT_PATHS);
  assertOrderedPaths("P3 evidence validationResults", evidence.validationResults.map((entry) => entry.fixturePath), P3_EXPECTATION_ROWS.map((row) => row.fixturePath));
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
    artifactPath: result.artifactPath,
    selectedAgentIds: result.selectedAgentIds,
    workOrderPath: result.workOrderPath,
    reviewQueuePath: result.reviewQueuePath,
    matched: result.matched
  };
}

function diagnosticForExpectation(expectation) {
  const code = expectation.diagnosticCodes[0];
  const row = P3_DIAGNOSTIC_ROWS.find((candidate) =>
    candidate.code === code &&
    candidate.artifactPath === expectation.fixturePath &&
    candidate.jsonPointer === expectation.jsonPointer
  ) || P3_DIAGNOSTIC_ROWS.find((candidate) => candidate.code === code);
  if (!row) throw contractError(`missing P3 diagnostic registry row: ${code}`, 1);
  return diagnosticFromRow(row, expectation.requiredSourceRef ?? row.sourceRef ?? null);
}

function diagnosticForCode(code) {
  const row = P3_DIAGNOSTIC_ROWS.find((candidate) => candidate.code === code);
  if (!row) throw contractError(`missing P3 diagnostic registry row: ${code}`, 1);
  return diagnosticFromRow(row, row.sourceRef ?? null);
}

function diagnosticFromRow(row, sourceRef) {
  return {
    code: row.code,
    message: row.canonicalMessage,
    severity: row.severity,
    diagnosticSource: row.diagnosticSource,
    stage: row.stage,
    phase: row.phase,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction
  };
}

function aggregatePromotionStatus(results) {
  if (results.some((result) => result.matched === false)) return "blocked";
  if (results.some((result) => result.actualResult === "review_required")) return "review_required";
  return "allowed";
}

function analyzeTaskFixtureGraph(taskFixtures) {
  const taskRows = taskFixtures.filter(({ expectation, fixture }) =>
    expectation.fixturePath.endsWith(".agent-task.json") && fixture.schemaId === "agent-task.v0"
  );
  const diagnostics = new Map();
  const rowsByTaskId = new Map();
  for (const row of taskRows) {
    const existing = rowsByTaskId.get(row.fixture.taskId) || [];
    existing.push(row);
    rowsByTaskId.set(row.fixture.taskId, existing);
  }

  for (const rows of rowsByTaskId.values()) {
    if (rows.length > 1) {
      for (const row of rows) setGraphDiagnostic(diagnostics, row, "AGENT_TASK_DUPLICATE_ID");
    }
  }

  const taskIds = new Set(rowsByTaskId.keys());
  const adjacency = new Map(taskRows.map((row) => [row.fixture.taskId, []]));
  for (const row of taskRows) {
    for (const dependency of row.fixture.dependencies || []) {
      if (dependency.dependencyType !== "task") continue;
      if (!taskIds.has(dependency.ref)) {
        setGraphDiagnostic(diagnostics, row, "AGENT_DEPENDENCY_MISSING");
      } else {
        adjacency.get(row.fixture.taskId).push(dependency.ref);
      }
    }
  }

  for (const taskId of findCycleTaskIds(adjacency)) {
    for (const row of rowsByTaskId.get(taskId) || []) {
      setGraphDiagnostic(diagnostics, row, "AGENT_DEPENDENCY_CYCLE");
    }
  }

  return diagnostics;
}

function setGraphDiagnostic(diagnostics, row, code) {
  if (!diagnostics.has(row.expectation.fixturePath)) {
    diagnostics.set(row.expectation.fixturePath, code);
  }
}

function assertOrchestrationPlanInvariants(plan, registry) {
  const failureCode = firstPlanInvariantFailure(plan, registry);
  if (failureCode !== null) {
    throw contractError(`P3 generated orchestration plan invariant failed: ${failureCode}`, 1);
  }
}

function firstPlanInvariantFailure(plan, registry) {
  const tasks = plan.tasks || [];
  const workOrders = plan.workOrders || [];
  if (hasDuplicate(tasks.map((task) => task.taskId))) return "AGENT_TASK_DUPLICATE_ID";
  if (hasDuplicate(workOrders.map((workOrder) => workOrder.workOrderId))) return "AGENT_WORK_ORDER_DUPLICATE_ID";
  if (tasks.some((task) => (task.selectedAgentIds || []).some((agentId) => !registry.agents[agentId]))) return "AGENT_UNREGISTERED";

  const taskIds = new Set(tasks.map((task) => task.taskId));
  const adjacency = new Map(tasks.map((task) => [task.taskId, []]));
  for (const task of tasks) {
    for (const dependency of normalizePlanDependencies(task.dependencies || [])) {
      if (dependency.hidden) return "AGENT_HANDOFF_HIDDEN";
      if (dependency.dependencyType !== "task") continue;
      if (!taskIds.has(dependency.ref)) return "AGENT_DEPENDENCY_MISSING";
      adjacency.get(task.taskId).push(dependency.ref);
    }
  }
  if (findCycleTaskIds(adjacency).size > 0) return "AGENT_DEPENDENCY_CYCLE";

  const workOrdersById = new Map(workOrders.map((workOrder) => [workOrder.workOrderId, workOrder]));
  for (const workOrder of workOrders) {
    if (!taskIds.has(workOrder.taskId)) return "AGENT_HANDOFF_HIDDEN";
  }
  for (const task of tasks) {
    if (task.promotionStatus !== "allowed") continue;
    if (!task.workOrderRef) return "AGENT_HANDOFF_HIDDEN";
    const workOrder = workOrdersById.get(task.workOrderRef.workOrderId);
    if (!workOrder || workOrder.taskId !== task.taskId || workOrder.agentId !== task.workOrderRef.agentId) {
      return "AGENT_HANDOFF_HIDDEN";
    }
  }
  return null;
}

function normalizePlanDependencies(dependencies) {
  return dependencies.map((dependency) => {
    if (typeof dependency === "string") {
      return { dependencyType: "task", ref: dependency, hidden: true };
    }
    if (!dependency || typeof dependency !== "object") {
      return { dependencyType: "task", ref: null, hidden: true };
    }
    if (dependency.dependencyType === "artifact") {
      return {
        ...dependency,
        hidden: typeof dependency.ref !== "string" || !PATH_ROOT_PATTERN.test(dependency.ref)
      };
    }
    if (dependency.dependencyType === "task") {
      return {
        ...dependency,
        hidden: typeof dependency.ref !== "string" || dependency.ref.length === 0
      };
    }
    return { dependencyType: "task", ref: null, hidden: true };
  });
}

function findCycleTaskIds(adjacency) {
  const visiting = new Set();
  const visited = new Set();
  const inCycle = new Set();

  function visit(taskId, stack) {
    if (visiting.has(taskId)) {
      const cycleStart = stack.indexOf(taskId);
      for (const cycleTaskId of stack.slice(cycleStart)) inCycle.add(cycleTaskId);
      inCycle.add(taskId);
      return;
    }
    if (visited.has(taskId)) return;
    visiting.add(taskId);
    stack.push(taskId);
    for (const dependency of adjacency.get(taskId) || []) {
      visit(dependency, stack);
    }
    stack.pop();
    visiting.delete(taskId);
    visited.add(taskId);
  }

  for (const taskId of adjacency.keys()) visit(taskId, []);
  return inCycle;
}

function inputsStayInScope(inputs) {
  return inputs.every((input) =>
    typeof input.path === "string" &&
    PATH_ROOT_PATTERN.test(input.path)
  );
}

function outputsStayInScope(outputs) {
  return outputs.every((output) =>
    typeof output.path === "string" &&
    output.path.startsWith(`${P3_ARTIFACT_ROOT}/`) &&
    PATH_ROOT_PATTERN.test(output.path)
  );
}

function deniedRuntimeTokens() {
  return new Set(["shell", "network", "connector", "secret", "file-edit", "callback", "live-agent-execution"]);
}

function hasDuplicate(values) {
  return values.some((value, index) => values.indexOf(value) !== index);
}

function sortDependencies(dependencies) {
  return [...dependencies].sort((a, b) =>
    a.dependencyType.localeCompare(b.dependencyType) ||
    a.ref.localeCompare(b.ref)
  );
}

function artifactRef(pathValue, schemaId, hash, extra = {}) {
  return {
    path: pathValue,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    sourceRef: null,
    ...extra
  };
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

async function loadValidators(cwd) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
    validateFormats: false
  });

  for (const file of P3_SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, P3_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }

  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/p3/${schemaId}.schema.json`);
      if (!validate) throw new Error(`schema not loaded: p3/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
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

function buildRunId({ upstream, registryFixture, expectations, command, args }) {
  return `p3-${sha256Hex(canonicalJson({
    upstreamEvidenceHash: upstream.ingestionEvidenceRef.hash,
    upstreamCatalogHash: upstream.catalogRef.hash,
    registryFixtureHash: sha256Hex(canonicalJson(registryFixture)),
    expectationsHash: sha256Hex(canonicalJson(expectations)),
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
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "AGENT_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.fixtureRefs || []) {
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "AGENT_EVIDENCE_HASH_MISMATCH";
  }
  for (const ref of evidence.boundaryRefs || []) {
    if (ref.path === P3_INGESTION_EVIDENCE_PATH) {
      const p2Evidence = await readJson(path.join(cwd, ref.path));
      if (ref.hash !== p2Internals.computeEvidenceSelfHash(p2Evidence)) return "AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH";
    } else if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) {
      return ref.path.startsWith("artifacts/p2/") ? "AGENT_UPSTREAM_EVIDENCE_HASH_MISMATCH" : "AGENT_EVIDENCE_HASH_MISMATCH";
    }
  }
  for (const ref of evidence.artifacts || []) {
    if (ref.path === `${P3_ARTIFACT_ROOT}/evidence.json`) continue;
    if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "AGENT_EVIDENCE_HASH_MISMATCH";
  }
  const finalRef = evidence.artifacts?.[evidence.artifacts.length - 1];
  if (!finalRef || finalRef.path !== `${P3_ARTIFACT_ROOT}/evidence.json` || finalRef.hash !== computeEvidenceSelfHash(evidence)) {
    return "AGENT_EVIDENCE_HASH_MISMATCH";
  }
  return null;
}

function assertRunExpectation(manifest, artifact) {
  const expected = manifest.runExpectation;
  if (artifact.status !== expected.status || artifact.promotionStatus !== expected.promotionStatus) {
    throw contractError(
      `P3 run expectation mismatch: expected ${expected.status}/${expected.promotionStatus}, got ${artifact.status}/${artifact.promotionStatus}`,
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

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

export const p3Internals = {
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  preflightFixtureMatchesDiagnostic,
  parseRelativePosixPath
};
