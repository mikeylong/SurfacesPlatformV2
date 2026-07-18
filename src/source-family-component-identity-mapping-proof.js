import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "./p0.js";
import { p2Internals } from "./p2-proof.js";
import { canonicalFileHash, deepClone, rawFileHash, readJson, sha256Hex, writeCanonicalJson } from "./p2-contract.js";
import { SC_ARTIFACT_ROOT, SC_FIXTURE_ROOT, SC_SOURCE_ROOT } from "./source-conformance-contract.js";
import { sourceConformanceInternals } from "./source-conformance-proof.js";
import { SFLM_PHYSICAL_SOURCE_ROOT } from "./source-family-layout-mapping-contract.js";
import {
  SFNM_ARTIFACT_ROOT,
  SFNM_CAPTURED_ARTIFACTS,
  SFNM_MAPPING_PATH,
  SFNM_NAMESPACE_PACKAGE_PATH,
  SFNM_SOURCE_ROOT,
  normalizeNamespacedBundle,
  verifyImmutableNamespaceInputs
} from "./source-family-namespace-mapping-contract.js";
import { sourceFamilyNamespaceMappingInternals } from "./source-family-namespace-mapping-proof.js";
import {
  SFCIM_ARTIFACT_PATHS,
  SFCIM_ARTIFACT_ROOT,
  SFCIM_AUTHORITY_DECLARATION_PATH,
  SFCIM_AUTHORITY_MANIFEST_PATH,
  SFCIM_CAPTURED_ARTIFACTS,
  SFCIM_COMMAND,
  SFCIM_COMPILER_IMPLEMENTATION_PATHS,
  SFCIM_CONTRACT_ID,
  SFCIM_DIAGNOSTIC_ROWS,
  SFCIM_ENVIRONMENT,
  SFCIM_EXPECTATION_ROWS,
  SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT,
  SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT,
  SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT,
  SFCIM_FIXTURE_ROOT,
  SFCIM_IDENTITY_PACKAGE_PATH,
  SFCIM_MAPPING_PATH,
  SFCIM_NAMESPACE_EVIDENCE_PATH,
  SFCIM_NAMESPACE_NORMALIZER_PATHS,
  SFCIM_P2_CATALOG_PATH,
  SFCIM_P2_EVIDENCE_PATH,
  SFCIM_PROOF_IMPLEMENTATION_PATHS,
  SFCIM_RUNTIME_DEPENDENCY_PATHS,
  SFCIM_SCHEMA_FILES,
  SFCIM_SCHEMA_ROOT,
  SFCIM_SOURCE_ENTRIES,
  SFCIM_SOURCE_ROOT,
  SFCIM_TIMESTAMP,
  SFCIM_VERSION,
  artifactRef,
  assertAuthorityClosure,
  assertIdentityPackage,
  assertIdentityMapping,
  buildSourceFamilyComponentIdentityMappingFixtures,
  componentIdentityArgumentVector,
  defaultComponentIdentityMappingArgs,
  identityMappedEvidenceRemap,
  normalizeComponentIdentityBundle,
  provenance,
  sfcimFixturePaths,
  sfcimSchemaIdForPath,
  sfcimSchemaPaths,
  setJsonPointer,
  verifyImmutableComponentIdentityInputs
} from "./source-family-component-identity-mapping-contract.js";

const execFileAsync = promisify(execFile);
const BOUNDARY_PATHS = [SFCIM_P2_EVIDENCE_PATH, SFCIM_P2_CATALOG_PATH, SFCIM_NAMESPACE_EVIDENCE_PATH];

export async function runSourceFamilyComponentIdentityMappingInterfacectl(argv, io) {
  const parsed = parseSourceFamilyComponentIdentityMappingArgs(argv);
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }
  try {
    const result = await runSourceFamilyComponentIdentityMappingProof({
      cwd: io.cwd,
      sourceRoot: parsed.source,
      authorityManifestPath: parsed.authorityManifest,
      authorityDeclarationPath: parsed.authorityDeclaration,
      mappingPath: parsed.mapping,
      identityPackagePath: parsed.identityPackage,
      ingestionEvidencePath: parsed.ingestionEvidence,
      catalogPath: parsed.catalog,
      sourceFamilyNamespaceMappingEvidencePath: parsed.sourceFamilyNamespaceMappingEvidence,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: SFCIM_COMMAND,
      args: parsed
    });
    io.stdout.write([
      `surfaces source-family-component-identity-mapping proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `identitySubstitutions: ${result.identitySubstitutionCount}`,
      `manifestHashRefreshes: ${result.manifestHashRefreshCount}`,
      `narrativeMentionsPreserved: ${result.narrativeMentionCount}`,
      `stage2InputHashesMatched: ${result.stage2InputHashCount}`,
      `innerArtifacts: ${result.innerArtifacts}`,
      `artifacts: ${result.artifacts.join(", ")}`
    ].join("\n") + "\n");
    return result.status === "pass" ? 0 : 1;
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return Number.isInteger(error.exitCode) ? error.exitCode : 1;
  }
}

export function parseSourceFamilyComponentIdentityMappingArgs(argv) {
  const flags = new Map([
    ["--source", "source"], ["--authority-manifest", "authorityManifest"], ["--authority-declaration", "authorityDeclaration"],
    ["--mapping", "mapping"], ["--identity-package", "identityPackage"], ["--ingestion-evidence", "ingestionEvidence"],
    ["--catalog", "catalog"], ["--source-family-namespace-mapping-evidence", "sourceFamilyNamespaceMappingEvidence"],
    ["--fixture", "fixture"], ["--out", "out"]
  ]);
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = flags.get(argv[index]);
    const value = argv[index + 1];
    if (!key || typeof value !== "string" || value.startsWith("--")) return { ok: false, error: usage() };
    if (Object.hasOwn(parsed, key)) return { ok: false, error: `duplicate option: ${argv[index]}\n${usage()}` };
    parsed[key] = value;
  }
  const expected = defaultComponentIdentityMappingArgs();
  for (const [key, value] of Object.entries(expected)) {
    if (parsed[key] !== value) return { ok: false, error: `fixed proof input required for ${key}: ${value}\n${usage()}` };
  }
  return { ok: true, ...parsed };
}

function usage() {
  return `usage: ${SFCIM_COMMAND} ${componentIdentityArgumentVector().join(" ")}`;
}

export async function runSourceFamilyComponentIdentityMappingProof({
  cwd,
  sourceRoot,
  authorityManifestPath,
  authorityDeclarationPath,
  mappingPath,
  identityPackagePath,
  ingestionEvidencePath,
  catalogPath,
  sourceFamilyNamespaceMappingEvidencePath,
  fixtureRoot,
  outRoot,
  command = SFCIM_COMMAND,
  args = defaultComponentIdentityMappingArgs()
}) {
  assertFixedInputs({ sourceRoot, authorityManifestPath, authorityDeclarationPath, mappingPath, identityPackagePath, ingestionEvidencePath, catalogPath, sourceFamilyNamespaceMappingEvidencePath, fixtureRoot, outRoot, command });
  await assertSafeCommandInputs(cwd);
  const immutable = await verifyImmutableComponentIdentityInputs(cwd);
  const fixtureHashesBeforeAuthority = await rawHashSnapshot(cwd, sfcimFixturePaths());
  let acceptedCallbackCount = 0;
  let reviewCallbackCount = 0;
  const authorityGate = await runAuthorityDecisionGate(immutable.authorityDeclaration, {
    onAccepted: async () => {
      acceptedCallbackCount += 1;
      return normalizeComponentIdentityBundle(cwd, SFCIM_SOURCE_ROOT, immutable.mapping);
    },
    onReview: async () => {
      reviewCallbackCount += 1;
      throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: production review callback was invoked", 1);
    }
  });
  if (
    authorityGate.decision.status !== "accepted" || authorityGate.decision.normalizationAllowed !== true ||
    acceptedCallbackCount !== 1 || reviewCallbackCount !== 0
  ) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: accepted authority decision failed", 1);
  assertNormalizationEquivalent(authorityGate.value, immutable.normalization);
  immutable.normalization = authorityGate.value;
  if (canonicalJson(fixtureHashesBeforeAuthority) !== canonicalJson(await rawHashSnapshot(cwd, sfcimFixturePaths()))) {
    throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: accepted authority callback changed fixture bytes", 1);
  }
  const namespaceImmutable = await verifyImmutableNamespaceInputs(cwd);
  const upstreamCode = await firstUpstreamIntegrityFailureCode(cwd, immutable.identityPackage);
  if (upstreamCode) throw contractError(`${upstreamCode}: accepted upstream closure failed`, 1);
  const validators = await loadValidators(cwd);
  const refs = await buildCheckedRefs(cwd, immutable.identityPackage);
  await prepareOutputRoot(cwd);

  const compilerRun = await runChainedCompiler({ cwd, normalization: immutable.normalization, validators });
  const namespaceMappingReceiptRef = namespaceArtifactRef(SFNM_MAPPING_PATH, "source-family-namespace-mapping.v0", await rawFileHash(path.join(cwd, SFNM_MAPPING_PATH)));
  const namespacePackageReceiptRef = namespaceArtifactRef(SFNM_NAMESPACE_PACKAGE_PATH, "source-family-namespace-package.v0", await rawFileHash(path.join(cwd, SFNM_NAMESPACE_PACKAGE_PATH)));
  const namespaceReceipt = buildNamespaceReceiptFromRun(compilerRun.namespaceNormalization, namespaceImmutable.mapping, namespaceMappingReceiptRef, namespacePackageReceiptRef);
  assertSchema(validators, "source-family-namespace-mapping-receipt.v0", namespaceReceipt, `${SFCIM_ARTIFACT_ROOT}/namespace-mapping-receipt.json`);
  const acceptedNamespaceReceipt = await readJson(path.join(cwd, SFNM_ARTIFACT_ROOT, "namespace-mapping-receipt.json"));
  if (canonicalJson(namespaceReceipt) !== canonicalJson(acceptedNamespaceReceipt)) throw contractError("SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH: causal Stage-2 receipt differs from accepted namespace semantics", 1);
  await writeCanonicalJson(path.join(cwd, SFCIM_ARTIFACT_ROOT, "namespace-mapping-receipt.json"), namespaceReceipt);
  for (const [persistedFile, , innerFile] of SFCIM_CAPTURED_ARTIFACTS) {
    await fs.writeFile(path.join(cwd, SFCIM_ARTIFACT_ROOT, persistedFile), compilerRun.artifactBytes.get(innerFile), "utf8");
  }

  const namespaceReceiptRef = await rawArtifactRef(cwd, `${SFCIM_ARTIFACT_ROOT}/namespace-mapping-receipt.json`, "source-family-namespace-mapping-receipt.v0");
  const stageChain = buildStageChain(immutable.normalization, compilerRun.namespaceNormalization);
  const identityPackageRef = await rawArtifactRef(cwd, SFCIM_IDENTITY_PACKAGE_PATH, "source-family-component-identity-package.v0");
  const authorityManifestRef = await rawArtifactRef(cwd, SFCIM_AUTHORITY_MANIFEST_PATH, "source-family-component-identity-authority-manifest.v0");
  const authorityDeclarationRef = await rawArtifactRef(cwd, SFCIM_AUTHORITY_DECLARATION_PATH, "source-family-component-identity-authority-declaration.v0");
  const mappingRef = await rawArtifactRef(cwd, SFCIM_MAPPING_PATH, "source-family-component-identity-mapping.v0");
  const namespaceMappingRef = await rawArtifactRef(cwd, SFNM_MAPPING_PATH, "source-family-namespace-mapping.v0");
  const namespacePackageRef = await rawArtifactRef(cwd, SFNM_NAMESPACE_PACKAGE_PATH, "source-family-namespace-package.v0");

  const receipt = buildIdentityReceipt({ immutable, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceReceiptRef, stageChain });
  const receiptPath = `${SFCIM_ARTIFACT_ROOT}/component-identity-mapping-receipt.json`;
  assertSchema(validators, "source-family-component-identity-mapping-receipt.v0", receipt, receiptPath);
  await writeCanonicalJson(path.join(cwd, receiptPath), receipt);
  await verifyPersistedInnerClosure({ cwd, normalization: immutable.normalization, validators });

  const baselineHashes = await rawHashSnapshot(cwd, SFCIM_ARTIFACT_PATHS.filter((entry) => entry !== `${SFCIM_ARTIFACT_ROOT}/source-family-component-identity-mapping-report.json` && entry !== `${SFCIM_ARTIFACT_ROOT}/evidence.json`));
  const sourceFactFixture = await readFixtureForDiagnostic(cwd, immutable, validators, "SOURCE_FACT_AUTHORITY_ESCALATION");
  const authorityExpansionProbe = await runAuthorityExpansionProbe({ cwd, normalization: immutable.normalization, baselineHashes, mutation: sourceFactFixture.mutation });
  const validationResults = await evaluateFixtures({ cwd, immutable, stageChain, compilerRun, authorityExpansionProbe, validators });
  if (validationResults.some((row) => !row.matched)) throw contractError("SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: fixture expectation mismatch", 1);
  const diagnostics = SFCIM_DIAGNOSTIC_ROWS.map((row) => deepClone(row));
  const runId = sha256Hex(canonicalJson({ authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef, stageChain, validationResults, authorityExpansionProbe }));
  const report = buildReport({ runId, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef, namespaceEvidenceRef: refs.boundaryRefs[2], stageChain, authorityExpansionProbe, validationResults, diagnostics });
  const reportPath = `${SFCIM_ARTIFACT_ROOT}/source-family-component-identity-mapping-report.json`;
  assertSchema(validators, "source-family-component-identity-mapping-report.v0", report, reportPath);
  await writeCanonicalJson(path.join(cwd, reportPath), report);

  const evidence = await buildEvidence({ cwd, args, runId, refs, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef, stageChain, validationResults, diagnostics });
  assertSchema(validators, "source-family-component-identity-mapping-evidence.v0", evidence, `${SFCIM_ARTIFACT_ROOT}/evidence.json`);
  await writeCanonicalJson(path.join(cwd, SFCIM_ARTIFACT_ROOT, "evidence.json"), evidence);
  await assertPersistedOutputClosure(cwd);
  const finalEvidenceFixture = await readFixtureForDiagnostic(cwd, immutable, validators, "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH");
  if (await runFinalEvidenceMutationProbe(cwd, evidence, finalEvidenceFixture.mutation) !== "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH") throw contractError("SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: final evidence mutation probe failed", 1);
  const integrity = await firstEvidenceIntegrityFailureCode(cwd, evidence);
  if (integrity) throw contractError(`${integrity}: persisted final evidence failed integrity`, 1);

  return {
    status: "pass", promotionStatus: "review_required", matchedCount: validationResults.length, totalCount: validationResults.length,
    identitySubstitutionCount: immutable.normalization.totalIdentitySubstitutionCount,
    manifestHashRefreshCount: immutable.normalization.totalManifestHashRefreshCount,
    narrativeMentionCount: immutable.normalization.totalNarrativeMentionCount,
    stage2InputHashCount: stageChain.namespaceInputHashes.length,
    innerArtifacts: SFCIM_CAPTURED_ARTIFACTS.length,
    artifacts: [...SFCIM_ARTIFACT_PATHS]
  };
}

function assertFixedInputs(actual) {
  const expected = defaultComponentIdentityMappingArgs();
  const pairs = {
    sourceRoot: expected.source, authorityManifestPath: expected.authorityManifest, authorityDeclarationPath: expected.authorityDeclaration,
    mappingPath: expected.mapping, identityPackagePath: expected.identityPackage, ingestionEvidencePath: expected.ingestionEvidence,
    catalogPath: expected.catalog, sourceFamilyNamespaceMappingEvidencePath: expected.sourceFamilyNamespaceMappingEvidence,
    fixtureRoot: expected.fixture, outRoot: expected.out, command: SFCIM_COMMAND
  };
  for (const [key, value] of Object.entries(pairs)) if (actual[key] !== value) throw contractError(`fixed component-identity proof input required: ${key}`, 2);
}

async function assertSafeCommandInputs(cwd) {
  const roots = [...Object.values(defaultComponentIdentityMappingArgs()), SFCIM_SCHEMA_ROOT];
  for (const relative of roots) {
    if (!isSafeRelativePath(relative)) throw contractError(`unsafe component-identity path: ${relative}`, 2);
    const absolute = path.join(cwd, relative);
    try {
      const stat = await fs.lstat(absolute);
      if (stat.isSymbolicLink()) throw contractError(`symlinked component-identity input is forbidden: ${relative}`, 2);
    } catch (error) {
      if (error.code !== "ENOENT" || relative !== SFCIM_ARTIFACT_ROOT) throw error;
    }
  }
}

function isSafeRelativePath(value) {
  return typeof value === "string" && value.length > 0 && value === value.replaceAll("\\", "/") && !value.startsWith("/") && !value.split("/").some((segment) => segment === "" || segment === "." || segment === ".." || segment.startsWith("."));
}

async function firstUpstreamIntegrityFailureCode(cwd, identityPackage) {
  const p2Evidence = await readJsonOrNull(path.join(cwd, SFCIM_P2_EVIDENCE_PATH));
  const namespaceEvidence = await readJsonOrNull(path.join(cwd, SFCIM_NAMESPACE_EVIDENCE_PATH));
  if (!p2Evidence) return "SOURCE_IDENTITY_UPSTREAM_EVIDENCE_MISSING";
  if (!namespaceEvidence) return "SOURCE_IDENTITY_NAMESPACE_EVIDENCE_MISSING";
  if (p2Evidence.status !== "pass") return "SOURCE_IDENTITY_UPSTREAM_EVIDENCE_NONPASS";
  if (namespaceEvidence.status !== "pass") return "SOURCE_IDENTITY_NAMESPACE_EVIDENCE_NONPASS";
  if (identityPackage.p2EvidenceRef.hash !== await rawFileHash(path.join(cwd, SFCIM_P2_EVIDENCE_PATH))) return "SOURCE_IDENTITY_UPSTREAM_HASH_MISMATCH";
  if (identityPackage.namespaceEvidenceRef.hash !== await rawFileHash(path.join(cwd, SFCIM_NAMESPACE_EVIDENCE_PATH))) return "SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH";
  if (await p2Internals.firstEvidenceIntegrityFailureCode(cwd, p2Evidence) !== null) return "SOURCE_IDENTITY_UPSTREAM_HASH_MISMATCH";
  if (await sourceFamilyNamespaceMappingInternals.firstEvidenceIntegrityFailureCode(cwd, namespaceEvidence) !== null) return "SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH";
  return null;
}

async function runUpstreamEvidenceMutationProbe(cwd, identityPackage, mutation) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-upstream-mutation-"));
  try {
    await copyUpstreamEvidenceClosure(cwd, workspace);
    const evidencePath = mutation.target === "p2-evidence" ? SFCIM_P2_EVIDENCE_PATH : SFCIM_NAMESPACE_EVIDENCE_PATH;
    const target = path.join(workspace, evidencePath);
    if (mutation.operation === "remove-file") {
      if (mutation.path !== evidencePath) throw probeFailure(mutation.target);
      await fs.rm(target);
    } else {
      const evidence = await readJson(target);
      applyDocumentMutation(evidence, mutation);
      await writeCanonicalJson(target, evidence);
    }
    return await firstUpstreamIntegrityFailureCode(workspace, identityPackage);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function copyUpstreamEvidenceClosure(cwd, workspace) {
  const pending = [SFCIM_P2_EVIDENCE_PATH, SFCIM_NAMESPACE_EVIDENCE_PATH];
  const copied = new Set();
  while (pending.length > 0) {
    const artifactPath = pending.shift();
    if (copied.has(artifactPath) || !isSafeRelativePath(artifactPath)) continue;
    let bytes;
    try { bytes = await fs.readFile(path.join(cwd, artifactPath)); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    const destination = path.join(workspace, artifactPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, bytes);
    copied.add(artifactPath);
    try { collectReferencedPaths(JSON.parse(bytes.toString("utf8")), pending); } catch {}
  }
}

function collectReferencedPaths(value, pending) {
  if (Array.isArray(value)) {
    for (const child of value) collectReferencedPaths(child, pending);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.path === "string" && isSafeRelativePath(value.path)) pending.push(value.path);
  for (const child of Object.values(value)) collectReferencedPaths(child, pending);
}

async function buildCheckedRefs(cwd, identityPackage) {
  return {
    sourceFileRefs: await buildRawRefs(cwd, SFCIM_SOURCE_ENTRIES.map((entry) => `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`)),
    namespaceNormalizerRefs: await buildRawRefs(cwd, SFCIM_NAMESPACE_NORMALIZER_PATHS),
    compilerRefs: await buildRawRefs(cwd, SFCIM_COMPILER_IMPLEMENTATION_PATHS),
    proofImplementationRefs: await buildRawRefs(cwd, SFCIM_PROOF_IMPLEMENTATION_PATHS),
    runtimeRefs: await buildRawRefs(cwd, SFCIM_RUNTIME_DEPENDENCY_PATHS),
    fixtureRefs: await buildCanonicalRefs(cwd, sfcimFixturePaths()),
    boundaryRefs: await buildBoundaryRefs(cwd),
    schemaClosure: await buildCanonicalRefs(cwd, sfcimSchemaPaths()),
    identityPackage
  };
}

async function buildRawRefs(cwd, paths) {
  const refs = [];
  for (const artifactPath of paths) refs.push(await rawArtifactRef(cwd, artifactPath, sfcimSchemaIdForPath(artifactPath)));
  return refs;
}

async function rawArtifactRef(cwd, artifactPath, schemaId) {
  return artifactRef(artifactPath, schemaId, await rawFileHash(path.join(cwd, artifactPath)));
}

async function buildCanonicalRefs(cwd, paths) {
  const refs = [];
  for (const artifactPath of paths) refs.push(await canonicalArtifactRef(cwd, artifactPath, sfcimSchemaIdForPath(artifactPath)));
  return refs;
}

async function canonicalArtifactRef(cwd, artifactPath, schemaId) {
  return artifactRef(artifactPath, schemaId, await canonicalFileHash(path.join(cwd, artifactPath)));
}

async function buildBoundaryRefs(cwd) {
  const p2Evidence = await readJson(path.join(cwd, SFCIM_P2_EVIDENCE_PATH));
  const namespaceEvidence = await readJson(path.join(cwd, SFCIM_NAMESPACE_EVIDENCE_PATH));
  return [
    artifactRef(SFCIM_P2_EVIDENCE_PATH, sfcimSchemaIdForPath(SFCIM_P2_EVIDENCE_PATH), p2Internals.computeEvidenceSelfHash(p2Evidence)),
    await canonicalArtifactRef(cwd, SFCIM_P2_CATALOG_PATH, sfcimSchemaIdForPath(SFCIM_P2_CATALOG_PATH)),
    artifactRef(SFCIM_NAMESPACE_EVIDENCE_PATH, sfcimSchemaIdForPath(SFCIM_NAMESPACE_EVIDENCE_PATH), sourceFamilyNamespaceMappingInternals.computeEvidenceSelfHash(namespaceEvidence))
  ];
}

async function runChainedCompiler({ cwd, normalization, validators }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-chain-"));
  try {
    const namespaceNormalization = await stageChainedCompilerWorkspace({ cwd, workspace, normalization });
    const sourceBefore = await rawHashSnapshot(workspace, SFCIM_SOURCE_ENTRIES.map((entry) => `${SC_SOURCE_ROOT}/${entry.logicalPath}`));
    const result = await executeCompiler(cwd, workspace);
    const compilerDiagnostic = mapCompilerResult(result);
    if (compilerDiagnostic.status !== "pass") throw contractError(`${compilerDiagnostic.diagnosticCode}: ${compilerDiagnostic.detail}`, 1);
    const sourceAfter = await rawHashSnapshot(workspace, SFCIM_SOURCE_ENTRIES.map((entry) => `${SC_SOURCE_ROOT}/${entry.logicalPath}`));
    if (canonicalJson(sourceBefore) !== canonicalJson(sourceAfter)) throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: unchanged compiler changed source bytes", 1);
    const artifacts = new Map();
    const artifactBytes = new Map();
    for (const [, schemaId, innerFile] of SFCIM_CAPTURED_ARTIFACTS) {
      const innerPath = path.join(workspace, SC_ARTIFACT_ROOT, innerFile);
      const value = await readJson(innerPath);
      assertSchema(validators, schemaId, value, innerPath);
      const bytes = await fs.readFile(innerPath, "utf8");
      const acceptedTuple = SFNM_CAPTURED_ARTIFACTS.find(([, , acceptedInnerFile]) => acceptedInnerFile === innerFile);
      const acceptedBytes = await fs.readFile(path.join(cwd, SFNM_ARTIFACT_ROOT, acceptedTuple[0]), "utf8");
      if (bytes !== acceptedBytes) throw contractError(`SOURCE_IDENTITY_INNER_EVIDENCE_INVALID: ${innerFile} differs from accepted namespace artifact`, 1);
      artifacts.set(innerFile, value);
      artifactBytes.set(innerFile, bytes);
    }
    const innerEvidence = artifacts.get("evidence.json");
    if (await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, innerEvidence) !== null || innerEvidence.status !== "pass") {
      throw contractError("SOURCE_IDENTITY_INNER_EVIDENCE_INVALID: chained compiler evidence failed integrity", 1);
    }
    return { namespaceNormalization, artifacts, artifactBytes };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function stageChainedCompilerWorkspace({ cwd, workspace, normalization }) {
  await prepareIdentityStageWorkspace({ cwd, workspace });
  await materializeIdentityStage({ workspace, normalization });
  const namespaceNormalization = await runNamespaceStage({ workspace, normalization });
  await copyClosedTree(cwd, SFCIM_SCHEMA_ROOT, workspace);
  await copyClosedTree(cwd, SC_FIXTURE_ROOT, workspace);
  for (const artifactPath of [SFCIM_P2_EVIDENCE_PATH, SFCIM_P2_CATALOG_PATH]) {
    const destination = path.join(workspace, artifactPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(cwd, artifactPath), destination);
  }
  for (const entry of namespaceNormalization.entries) {
    const normalized = namespaceNormalization.documentsByLogicalPath.get(entry.logicalPath);
    const destination = path.join(workspace, SC_SOURCE_ROOT, entry.logicalPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, normalized.text, "utf8");
  }
  return namespaceNormalization;
}

async function prepareIdentityStageWorkspace({ cwd, workspace }) {
  await copyClosedTree(cwd, SFLM_PHYSICAL_SOURCE_ROOT, workspace);
}

async function materializeIdentityStage({ workspace, normalization }) {
  try {
    await fs.lstat(path.join(workspace, SFNM_SOURCE_ROOT));
    throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: Stage-2 input root existed before identity materialization", 1);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (const entry of normalization.entries) {
    const output = normalization.documentsByLogicalPath.get(entry.logicalPath);
    const destination = path.join(workspace, SFNM_SOURCE_ROOT, entry.physicalPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, output.text, "utf8");
    if (await rawFileHash(destination) !== entry.normalizedSha256) throw contractError("SOURCE_IDENTITY_INTERMEDIATE_TAMPER: Stage-1 write hash drift", 1);
  }
}

async function runNamespaceStage({ workspace, normalization }) {
  const actualFiles = await listIndependentRegularFiles(workspace, SFNM_SOURCE_ROOT);
  const expectedFiles = normalization.entries.map((entry) => entry.physicalPath).sort((left, right) => left.localeCompare(right));
  if (canonicalJson(actualFiles) !== canonicalJson(expectedFiles)) throw contractError("SOURCE_IDENTITY_INTERMEDIATE_TAMPER: Stage-1 output closure drift", 1);
  for (const entry of normalization.entries) {
    if (await rawFileHash(path.join(workspace, SFNM_SOURCE_ROOT, entry.physicalPath)) !== entry.normalizedSha256) {
      throw contractError(`SOURCE_IDENTITY_INTERMEDIATE_TAMPER: Stage-2 input hash drift ${entry.physicalPath}`, 1);
    }
  }
  const namespaceNormalization = await normalizeNamespacedBundle(workspace);
  assertStageHashCausality(normalization, namespaceNormalization);
  return namespaceNormalization;
}

function assertStageHashCausality(identityNormalization, namespaceNormalization) {
  if (identityNormalization.entries.length !== 12 || namespaceNormalization.entries.length !== 12) throw contractError("SOURCE_IDENTITY_INTERMEDIATE_TAMPER: stage closure count drift", 1);
  for (let index = 0; index < identityNormalization.entries.length; index += 1) {
    const identity = identityNormalization.entries[index];
    const namespace = namespaceNormalization.entries[index];
    if (identity.physicalPath !== namespace.physicalPath || identity.normalizedSha256 !== namespace.inputSha256) {
      throw contractError(`SOURCE_IDENTITY_INTERMEDIATE_TAMPER: Stage-2 input mismatch ${identity.physicalPath}`, 1);
    }
  }
}

function buildStageChain(identityNormalization, namespaceNormalization) {
  assertStageHashCausality(identityNormalization, namespaceNormalization);
  const rows = identityNormalization.entries.map((entry) => ({
    physicalPath: `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`,
    logicalPath: `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`,
    hash: entry.normalizedSha256
  }));
  const inputs = namespaceNormalization.entries.map((entry) => ({
    physicalPath: `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`,
    logicalPath: `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`,
    hash: entry.inputSha256
  }));
  const stageChain = { orderedStages: ["component-identity", "namespace-normalization", "source-conformance-compile"], namespaceInputRoot: SFNM_SOURCE_ROOT, namespaceInputMaterializedByIdentityStage: true, acceptedNamespaceBaselineCopiedAsInput: false, identityOutputHashes: rows, namespaceInputHashes: inputs, hashCausalityVerified: true, namespaceNormalizerReused: true, compilerReused: true };
  assertStageChainDocument(stageChain, rows);
  return stageChain;
}

function assertStageChainDocument(stageChain, expectedRows) {
  const expectedStages = ["component-identity", "namespace-normalization", "source-conformance-compile"];
  if (!Array.isArray(stageChain?.orderedStages)) throw contractError("SOURCE_IDENTITY_STAGE_SKIPPED: ordered stage closure missing", 1);
  if (!stageChain.orderedStages.includes("component-identity")) throw contractError("SOURCE_IDENTITY_STAGE_SKIPPED: component identity stage missing", 1);
  if (!stageChain.orderedStages.includes("namespace-normalization")) throw contractError("SOURCE_IDENTITY_NAMESPACE_STAGE_SKIPPED: namespace stage missing", 1);
  if (canonicalJson(stageChain.orderedStages) !== canonicalJson(expectedStages)) throw contractError("SOURCE_IDENTITY_STAGE_REVERSED: ordered stages drift", 1);
  if (stageChain.namespaceInputRoot !== SFNM_SOURCE_ROOT || stageChain.namespaceInputMaterializedByIdentityStage !== true || stageChain.acceptedNamespaceBaselineCopiedAsInput !== false) throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: Stage-2 input provenance bypassed identity output", 1);
  if (
    canonicalJson(stageChain.identityOutputHashes) !== canonicalJson(expectedRows) ||
    canonicalJson(stageChain.namespaceInputHashes) !== canonicalJson(expectedRows) ||
    stageChain.hashCausalityVerified !== true || stageChain.namespaceNormalizerReused !== true || stageChain.compilerReused !== true
  ) throw contractError("SOURCE_IDENTITY_INTERMEDIATE_TAMPER: Stage-1 and Stage-2 hashes differ", 1);
}

async function executeCompiler(cwd, workspace) {
  const materializer = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
  if (materializer.exitCode !== 0) return materializer;
  return executeChild(process.execPath, [
    path.join(cwd, "bin/interfacectl.js"), "surfaces", "source-conformance", "proof",
    "--source", SC_SOURCE_ROOT, "--ingestion-evidence", SFCIM_P2_EVIDENCE_PATH, "--catalog", SFCIM_P2_CATALOG_PATH,
    "--fixture", SC_FIXTURE_ROOT, "--out", SC_ARTIFACT_ROOT
  ], workspace);
}

async function executeChild(file, argv, cwd) {
  try {
    const result = await execFileAsync(file, argv, { cwd, env: { TZ: "UTC", LC_ALL: "C", LANG: "C" }, maxBuffer: 10 * 1024 * 1024 });
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { exitCode: Number.isInteger(error.code) ? error.code : 1, stdout: typeof error.stdout === "string" ? error.stdout : "", stderr: typeof error.stderr === "string" ? error.stderr : "" };
  }
}

function stableChildFailure(result) { return `${result.stderr}\n${result.stdout}`.trim().split(/\r?\n/).filter(Boolean).at(-1) || `compiler exited ${result.exitCode}`; }

function mapCompilerResult(result) {
  if (result.exitCode === 0) return { status: "pass", diagnosticCode: null, detail: null };
  return { status: "fail", diagnosticCode: "SOURCE_IDENTITY_COMPILER_RUN_FAILED", detail: stableChildFailure(result) };
}

async function copyClosedTree(cwd, sourceRoot, workspace) {
  const files = await listIndependentRegularFiles(cwd, sourceRoot);
  for (const relative of files) {
    const destination = path.join(workspace, sourceRoot, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(cwd, sourceRoot, relative), destination);
  }
}

async function listIndependentRegularFiles(cwd, root) {
  const base = path.join(cwd, root);
  const files = [];
  async function walk(current, prefix) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(current, entry.name);
      const stat = await fs.lstat(absolute);
      if (stat.isSymbolicLink()) throw contractError(`SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: symlink ${root}/${relative}`, 1);
      if (entry.isDirectory()) await walk(absolute, relative);
      else if (entry.isFile()) {
        if (stat.nlink !== 1) throw contractError(`SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: hardlink ${root}/${relative}`, 1);
        files.push(relative);
      }
    }
  }
  await walk(base, "");
  return files.sort((left, right) => left.localeCompare(right));
}

function namespaceArtifactRef(artifactPath, schemaId, hash) {
  return { path: artifactPath, schemaId, hashAlgorithm: "sha256", hash, sourceRef: null };
}

function buildNamespaceReceiptFromRun(normalization, mapping, mappingRef, namespacePackageRef) {
  if (normalization.entries.length !== 12 || normalization.totalSubstitutionCount !== 78 || normalization.totalManifestHashRefreshCount !== 11) {
    throw contractError("SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH: Stage-2 namespace closure drift", 1);
  }
  return {
    schemaId: "source-family-namespace-mapping-receipt.v0",
    version: SFCIM_VERSION,
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
    provenance: {
      generatedAt: SFCIM_TIMESTAMP,
      generator: "interfacectl-source-family-namespace-mapping-receipt",
      sourceRefs: [namespacePackageRef.path, mappingRef.path]
    }
  };
}

function buildIdentityReceipt({ immutable, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceReceiptRef, stageChain }) {
  return {
    schemaId: "source-family-component-identity-mapping-receipt.v0",
    version: SFCIM_VERSION,
    status: "pass",
    authorityManifestRef,
    authorityDeclarationRef,
    identityPackageRef,
    mappingRef,
    namespaceReceiptRef,
    physicalSourceRoot: SFCIM_SOURCE_ROOT,
    namespaceSourceRoot: SFNM_SOURCE_ROOT,
    fromComponentId: "TeamButton",
    toComponentId: "Button",
    relationKind: "component-identity",
    scope: "component-identity-only",
    entryCount: immutable.normalization.entries.length,
    entries: deepClone(immutable.normalization.entries),
    totalIdentitySubstitutionCount: immutable.normalization.totalIdentitySubstitutionCount,
    totalManifestHashRefreshCount: immutable.normalization.totalManifestHashRefreshCount,
    totalNarrativeMentionCount: immutable.normalization.totalNarrativeMentionCount,
    narrativeMentionsPreserved: true,
    acceptedNamespaceBaselineMatched: true,
    canAddAuthority: false,
    stageChain,
    provenance: provenance("interfacectl-source-family-component-identity-mapping-receipt", [identityPackageRef.path, authorityManifestRef.path, authorityDeclarationRef.path, mappingRef.path, namespaceReceiptRef.path])
  };
}

async function verifyPersistedInnerClosure({ cwd, normalization, validators }) {
  validators ||= await loadValidators(cwd);
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-persisted-"));
  try {
    await stageChainedCompilerWorkspace({ cwd, workspace, normalization });
    const materializerResult = await executeChild(process.execPath, [path.join(cwd, "scripts/materialize-source-conformance.mjs")], workspace);
    const materializerDiagnostic = mapCompilerResult(materializerResult);
    if (materializerDiagnostic.status !== "pass") {
      throw contractError(`${materializerDiagnostic.diagnosticCode}: ${materializerDiagnostic.detail}`, 1);
    }
    for (const [persistedFile, schemaId, innerFile] of SFCIM_CAPTURED_ARTIFACTS) {
      const source = path.join(cwd, SFCIM_ARTIFACT_ROOT, persistedFile);
      const destination = path.join(workspace, SC_ARTIFACT_ROOT, innerFile);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
      const value = await readJson(destination);
      assertSchema(validators, schemaId, value, persistedFile);
      const acceptedTuple = SFNM_CAPTURED_ARTIFACTS.find(([, , candidate]) => candidate === innerFile);
      if (await fs.readFile(source, "utf8") !== await fs.readFile(path.join(cwd, SFNM_ARTIFACT_ROOT, acceptedTuple[0]), "utf8")) {
        throw contractError(`SOURCE_IDENTITY_INNER_EVIDENCE_INVALID: persisted ${innerFile} differs from accepted namespace artifact`, 1);
      }
    }
    const evidence = await readJson(path.join(workspace, SC_ARTIFACT_ROOT, "evidence.json"));
    const integrityCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence);
    if (integrityCode !== null) {
      throw contractError(`SOURCE_IDENTITY_INNER_EVIDENCE_INVALID: persisted inner evidence failed after temporary workspace removal: ${integrityCode}`, 1);
    }
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function buildCurrentNamespaceNormalization(cwd, normalization) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-namespace-rebuild-"));
  try {
    await prepareIdentityStageWorkspace({ cwd, workspace });
    await materializeIdentityStage({ workspace, normalization });
    return await runNamespaceStage({ workspace, normalization });
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function runAuthorityExpansionProbe({ cwd, normalization, baselineHashes, mutation }) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-authority-probe-"));
  const inputsBefore = await rawHashSnapshot(cwd, [SFCIM_IDENTITY_PACKAGE_PATH, SFCIM_AUTHORITY_MANIFEST_PATH, SFCIM_AUTHORITY_DECLARATION_PATH, SFCIM_MAPPING_PATH, ...SFCIM_SOURCE_ENTRIES.map((entry) => `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`)]);
  try {
    if (mutation?.target !== "compiler-source" || mutation.operation !== "append-array-value") throw probeFailure("compiler-source");
    await stageChainedCompilerWorkspace({ cwd, workspace, normalization });
    const [relativePath, pointer] = splitDocumentMutationPath(mutation.path);
    const buttonPath = path.join(workspace, SC_SOURCE_ROOT, relativePath);
    const manifestPath = path.join(workspace, SC_SOURCE_ROOT, "manifest.json");
    const button = await readJson(buttonPath);
    applyDocumentMutation(button, { ...mutation, path: pointer });
    await writeCanonicalJson(buttonPath, button);
    const manifest = await readJson(manifestPath);
    const sourceFile = manifest.sourceFiles.find((entry) => entry.path === relativePath);
    if (!sourceFile) throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: mutated source is not declared", 1);
    sourceFile.sha256 = await rawFileHash(buttonPath);
    await writeCanonicalJson(manifestPath, manifest);
    const result = await executeCompiler(cwd, workspace);
    let finding = null;
    try {
      const coverage = await readJson(path.join(workspace, SC_ARTIFACT_ROOT, "source-fact-coverage.json"));
      const blocked = coverage.findings?.filter((entry) => entry.status === "blocked") || [];
      if (coverage.promotionStatus === "blocked" && blocked.length === 1 && blocked[0].diagnosticCode === "SOURCE_FACT_AUTHORITY_ESCALATION") finding = blocked[0];
    } catch {
      finding = null;
    }
    if (result.exitCode !== 1 || !finding) throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: unchanged compiler did not preserve causal authority rejection", 1);
    if (canonicalJson(inputsBefore) !== canonicalJson(await rawHashSnapshot(cwd, inputsBefore.map((row) => row.path)))) throw contractError("SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: authority probe changed checked inputs", 1);
    if (canonicalJson(baselineHashes) !== canonicalJson(await rawHashSnapshot(cwd, baselineHashes.map((row) => row.path)))) throw contractError("SOURCE_IDENTITY_INNER_EVIDENCE_INVALID: authority probe changed persisted baseline", 1);
    return { baselineVerified: true, mutationIsolated: true, innerDiagnosticCode: "SOURCE_FACT_AUTHORITY_ESCALATION", compilerExitCode: 1, checkedInputsUnchanged: true, baselineArtifactsUnchanged: true };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function evaluateFixtures({ cwd, immutable, stageChain, compilerRun, authorityExpansionProbe, validators }) {
  const expectedFixtures = buildSourceFamilyComponentIdentityMappingFixtures(immutable.identityPackage);
  const expectedManifest = await readJson(path.join(cwd, SFCIM_FIXTURE_ROOT, "expectations.manifest.json"));
  if (canonicalJson(expectedManifest) !== canonicalJson(expectedFixtures["expectations.manifest.json"])) throw contractError("SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: expectation manifest drift", 1);
  assertSchema(validators, expectedManifest.schemaId, expectedManifest, "expectations.manifest.json");
  const results = [];
  for (const expectation of SFCIM_EXPECTATION_ROWS) {
    const fixture = await readFixtureForExpectation(cwd, immutable, validators, expectation, expectedFixtures);
    const actual = await runFixtureProbe({ cwd, fixture, expectation, immutable, stageChain, compilerRun, authorityExpansionProbe });
    const matched = actual.result === expectation.expectedResult && canonicalJson(actual.codes) === canonicalJson(expectation.diagnosticCodes);
    results.push({ ...deepClone(expectation), actualResult: actual.result, diagnosticCodes: actual.codes, matched });
  }
  return results;
}

async function readFixtureForDiagnostic(cwd, immutable, validators, diagnosticCode) {
  const expectation = SFCIM_EXPECTATION_ROWS.find((row) => row.diagnosticCodes.includes(diagnosticCode));
  if (!expectation) throw contractError(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: missing fixture for ${diagnosticCode}`, 1);
  return readFixtureForExpectation(cwd, immutable, validators, expectation);
}

async function readFixtureForExpectation(cwd, immutable, validators, expectation, fixtureDocuments = null) {
  const expectedFixtures = fixtureDocuments || buildSourceFamilyComponentIdentityMappingFixtures(immutable.identityPackage);
  const fixture = await readJson(path.join(cwd, SFCIM_FIXTURE_ROOT, expectation.fixturePath));
  if (
    canonicalJson(fixture) !== canonicalJson(expectedFixtures[expectation.fixturePath]) ||
    canonicalJson(fixture.expectedDiagnosticCodes) !== canonicalJson(expectation.diagnosticCodes) ||
    fixture.kind !== expectation.kind ||
    (expectation.kind === "valid") !== (fixture.mutation === null)
  ) throw contractError(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: fixture drift ${expectation.fixturePath}`, 1);
  assertSchema(validators, fixture.schemaId, fixture, expectation.fixturePath);
  return fixture;
}

async function runFixtureProbe({ cwd, fixture, expectation, immutable, stageChain, compilerRun, authorityExpansionProbe }) {
  if (expectation.kind === "valid") {
    if (
      fixture.mutation !== null || immutable.normalization.totalIdentitySubstitutionCount !== SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT ||
      immutable.normalization.totalManifestHashRefreshCount !== SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT ||
      compilerRun.artifacts.size !== SFCIM_CAPTURED_ARTIFACTS.length
    ) throw contractError("SOURCE_IDENTITY_MAPPING_INCOMPLETE: valid fixture baseline drift", 1);
    return { result: "valid", codes: [] };
  }
  const mutation = fixture.mutation;
  if (expectation.kind === "review") {
    const declaration = deepClone(immutable.authorityDeclaration);
    applyDocumentMutation(declaration, mutation);
    const fixtureHashesBefore = await rawHashSnapshot(cwd, sfcimFixturePaths());
    let acceptedCallbackCount = 0;
    let reviewCallbackCount = 0;
    const gate = await runAuthorityDecisionGate(declaration, {
      onAccepted: async () => { acceptedCallbackCount += 1; throw probeFailure("review-accepted-callback"); },
      onReview: async () => { reviewCallbackCount += 1; return { normalization: null }; }
    });
    if (
      gate.decision.normalizationAllowed || gate.decision.status !== "review_required" || gate.value.normalization !== null ||
      acceptedCallbackCount !== 0 || reviewCallbackCount !== 1 ||
      canonicalJson(fixtureHashesBefore) !== canonicalJson(await rawHashSnapshot(cwd, sfcimFixturePaths()))
    ) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: review declaration normalized or changed fixture bytes", 1);
    return { result: "review_required", codes: ["SOURCE_IDENTITY_AUTHORITY_REVIEW_REQUIRED"] };
  }
  const code = expectation.diagnosticCodes[0];
  if (!mutation) throw probeFailure(expectation.fixturePath);
  switch (mutation.target) {
    case "p2-evidence":
    case "namespace-evidence":
      if (await runUpstreamEvidenceMutationProbe(cwd, immutable.identityPackage, mutation) !== code) throw probeFailure(mutation.target);
      break;
    case "component-identity-mapping": {
      const mapping = deepClone(immutable.mapping);
      const before = deepClone(mapping);
      applyDocumentMutation(mapping, mutation);
      assertChanged(before, mapping, mutation.target);
      await expectContractCode(() => assertIdentityMapping(cwd, mapping, immutable.authorityManifest, immutable.authorityDeclaration), code);
      break;
    }
    case "authority-declaration": {
      const declaration = deepClone(immutable.authorityDeclaration);
      const before = deepClone(declaration);
      applyDocumentMutation(declaration, mutation);
      assertChanged(before, declaration, mutation.target);
      await expectContractCode(() => assertAuthorityClosure(cwd, immutable.authorityManifest, declaration), code);
      break;
    }
    case "identity-package": {
      const identityPackage = deepClone(immutable.identityPackage);
      const before = deepClone(identityPackage);
      applyDocumentMutation(identityPackage, mutation);
      assertChanged(before, identityPackage, mutation.target);
      await expectContractCode(() => assertIdentityPackage(cwd, identityPackage, immutable.authorityManifest, immutable.authorityDeclaration, immutable.mapping, immutable.normalization), code);
      break;
    }
    case "stage-chain": {
      const candidate = deepClone(stageChain);
      applyDocumentMutation(candidate, mutation);
      await expectContractCode(() => assertStageChainDocument(candidate, stageChain.identityOutputHashes), code);
      break;
    }
    case "stage-workspace": {
      const actual = mutation.operation === "remove-file"
        ? await runCompilerFailureProbe(cwd, immutable.normalization, mutation)
        : await runStageWorkspaceMutationProbe(cwd, immutable.normalization, mutation);
      if (actual !== code) throw probeFailure(mutation.target);
      break;
    }
    case "namespace-mapping":
    case "namespace-package":
      if (await runNamespaceImmutableMutationProbe(cwd, mutation) !== code) throw probeFailure(mutation.target);
      break;
    case "persisted-inner-artifact":
      if (await runInnerEvidenceMutationProbe(cwd, immutable.normalization, mutation) !== code) throw probeFailure(mutation.target);
      break;
    case "compiler-source":
      if (authorityExpansionProbe.innerDiagnosticCode !== code) throw probeFailure(mutation.target);
      break;
    case "final-evidence":
      if (
        mutation.operation !== "ordered-changes" || mutation.changes.length !== 3 ||
        mutation.changes.some((change) => typeof change.expectedDiagnosticCode !== "string")
      ) throw probeFailure(mutation.target);
      break;
    default:
      throw contractError(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: unsupported fixture mutation target ${mutation.target}`, 1);
  }
  return { result: "invalid", codes: [code] };
}

export async function runAuthorityDecisionGate(declaration, { onAccepted, onReview }) {
  const decision = evaluateAuthorityDeclaration(declaration);
  if (decision.status === "accepted") return { decision, value: await onAccepted(decision) };
  if (decision.status === "review_required") return { decision, value: await onReview(decision) };
  throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: authority declaration is invalid", 1);
}

export function evaluateAuthorityDeclaration(declaration) {
  if (declaration?.status === "review_required" || declaration?.normalizationAllowed !== true) return { status: "review_required", normalizationAllowed: false, promotionStatus: "review_required" };
  if (declaration.status === "accepted" && declaration.normalizationAllowed === true && declaration.executable === false && declaration.canAddAuthority === false) return { status: "accepted", normalizationAllowed: true, promotionStatus: "allowed" };
  return { status: "invalid", normalizationAllowed: false, promotionStatus: "blocked" };
}

function assertNormalizationEquivalent(actual, expected) {
  const publicShape = (value) => ({
    entries: value.entries,
    totalIdentitySubstitutionCount: value.totalIdentitySubstitutionCount,
    totalManifestHashRefreshCount: value.totalManifestHashRefreshCount,
    totalNarrativeMentionCount: value.totalNarrativeMentionCount,
    documents: value.entries.map((entry) => value.documentsByLogicalPath.get(entry.logicalPath)?.text)
  });
  if (canonicalJson(publicShape(actual)) !== canonicalJson(publicShape(expected))) {
    throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: accepted authority callback normalization drift", 1);
  }
}

function applyDocumentMutation(document, mutation) {
  const changes = mutation.operation === "ordered-changes" ? mutation.changes : [mutation];
  for (const change of changes) {
    if (change.operation === "replace-json") setJsonPointer(document, change.path, deepClone(change.value));
    else if (change.operation === "add-json") addJsonPointer(document, change.path, deepClone(change.value));
    else if (change.operation === "remove-json") removeJsonPointer(document, change.path);
    else if (change.operation === "append-array-value") {
      const target = valueAtJsonPointer(document, change.path);
      if (!Array.isArray(target)) throw probeFailure(change.path);
      target.push(deepClone(change.value));
    } else throw probeFailure(change.operation);
  }
  return document;
}

function addJsonPointer(document, pointer, value) {
  const { parent, key } = jsonPointerParent(document, pointer);
  if (Array.isArray(parent) && key === "-") parent.push(value);
  else {
    if (Object.hasOwn(parent, key)) throw probeFailure(pointer);
    parent[key] = value;
  }
}

function removeJsonPointer(document, pointer) {
  const { parent, key } = jsonPointerParent(document, pointer);
  if (Array.isArray(parent)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= parent.length) throw probeFailure(pointer);
    parent.splice(index, 1);
  } else {
    if (!Object.hasOwn(parent, key)) throw probeFailure(pointer);
    delete parent[key];
  }
}

function valueAtJsonPointer(document, pointer) {
  if (pointer === "") return document;
  return pointerSegments(pointer).reduce((value, segment) => value?.[segment], document);
}

function jsonPointerParent(document, pointer) {
  const segments = pointerSegments(pointer);
  const key = segments.pop();
  const parent = segments.reduce((value, segment) => value?.[segment], document);
  if (!parent || typeof parent !== "object" || key === undefined) throw probeFailure(pointer);
  return { parent, key };
}

function pointerSegments(pointer) {
  if (typeof pointer !== "string" || !pointer.startsWith("/")) throw probeFailure(pointer);
  return pointer.slice(1).split("/").map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function splitDocumentMutationPath(mutationPath) {
  const marker = mutationPath.indexOf("#");
  if (marker <= 0 || mutationPath.indexOf("#", marker + 1) !== -1) throw probeFailure(mutationPath);
  return [mutationPath.slice(0, marker), mutationPath.slice(marker + 1)];
}

function assertChanged(before, after, probe) { if (canonicalJson(before) === canonicalJson(after)) throw probeFailure(probe); }
function probeFailure(probe) { return contractError(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: mutation probe was a no-op: ${probe}`, 1); }
async function expectContractCode(action, expected) { try { await action(); } catch (error) { if (error.message.startsWith(expected)) return; throw error; } throw probeFailure(expected); }

async function runNamespaceImmutableMutationProbe(cwd, mutation) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), `surfaces-source-identity-${mutation.target}-`));
  try {
    await copyClosedTree(cwd, SFNM_SOURCE_ROOT, workspace);
    await copyClosedTree(cwd, SFLM_PHYSICAL_SOURCE_ROOT, workspace);
    for (const artifactPath of [SFNM_MAPPING_PATH, SFNM_NAMESPACE_PACKAGE_PATH]) {
      const destination = path.join(workspace, artifactPath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(path.join(cwd, artifactPath), destination);
    }
    const target = path.join(workspace, mutation.target === "namespace-mapping" ? SFNM_MAPPING_PATH : SFNM_NAMESPACE_PACKAGE_PATH);
    const value = await readJson(target);
    applyDocumentMutation(value, mutation);
    await writeCanonicalJson(target, value);
    try {
      await verifyImmutableNamespaceInputs(workspace);
    } catch (error) {
      if (String(error.message).match(/SOURCE_NAMESPACE_[A-Z0-9_]+/)?.[0] === "SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH") {
        return mutation.target === "namespace-mapping" ? "SOURCE_IDENTITY_NAMESPACE_DESCRIPTOR_HASH_MISMATCH" : "SOURCE_IDENTITY_NAMESPACE_PACKAGE_HASH_MISMATCH";
      }
      throw error;
    }
    throw probeFailure(mutation.target);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function runInnerEvidenceMutationProbe(cwd, normalization, mutation) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-inner-mutation-"));
  try {
    await stageChainedCompilerWorkspace({ cwd, workspace, normalization });
    for (const [persistedFile, , innerFile] of SFCIM_CAPTURED_ARTIFACTS) {
      const destination = path.join(workspace, SC_ARTIFACT_ROOT, innerFile);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(path.join(cwd, SFCIM_ARTIFACT_ROOT, persistedFile), destination);
    }
    const [persistedFile, pointer] = splitDocumentMutationPath(mutation.path);
    const tuple = SFCIM_CAPTURED_ARTIFACTS.find(([candidate]) => candidate === persistedFile);
    if (!tuple || mutation.operation !== "replace-json") throw probeFailure(mutation.target);
    const target = path.join(workspace, SC_ARTIFACT_ROOT, tuple[2]);
    const value = await readJson(target);
    applyDocumentMutation(value, { ...mutation, path: pointer });
    await writeCanonicalJson(target, value);
    const evidence = await readJson(path.join(workspace, SC_ARTIFACT_ROOT, "evidence.json"));
    return await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(workspace, evidence) === null ? null : "SOURCE_IDENTITY_INNER_EVIDENCE_INVALID";
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function runStageWorkspaceMutationProbe(cwd, normalization, mutation) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-stage-mutation-"));
  try {
    await prepareIdentityStageWorkspace({ cwd, workspace });
    if (mutation.operation === "prepopulate-root") {
      if (mutation.path !== SFNM_SOURCE_ROOT) throw probeFailure(mutation.path);
      const target = path.join(workspace, mutation.path);
      await fs.mkdir(target, { recursive: true });
      await fs.writeFile(path.join(target, "preexisting-baseline.txt"), `${mutation.value}\n`, "utf8");
      try { await materializeIdentityStage({ workspace, normalization }); }
      catch (error) { return diagnosticCodeFromError(error); }
      return null;
    }
    if (mutation.operation === "append-text") {
      await materializeIdentityStage({ workspace, normalization });
      await fs.appendFile(path.join(workspace, mutation.path), mutation.value, "utf8");
      try { await runNamespaceStage({ workspace, normalization }); }
      catch (error) { return diagnosticCodeFromError(error); }
      return null;
    }
    throw probeFailure(mutation.operation);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

function assertEvidenceSelfHash(evidence) {
  const final = evidence?.artifacts?.find((entry) => entry.path === `${SFCIM_ARTIFACT_ROOT}/evidence.json`);
  if (!final || final.hash !== computeEvidenceSelfHash(evidence)) throw contractError("SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: final self-hash drift", 1);
}

async function runCompilerFailureProbe(cwd, normalization, mutation) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-source-identity-compiler-failure-"));
  try {
    await stageChainedCompilerWorkspace({ cwd, workspace, normalization });
    if (mutation?.target !== "stage-workspace" || mutation.operation !== "remove-file") throw probeFailure("compiler-run-failed");
    await fs.rm(path.join(workspace, mutation.path));
    const result = await executeCompiler(cwd, workspace);
    return mapCompilerResult(result).diagnosticCode;
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

async function runFinalEvidenceMutationProbe(cwd, evidence, mutation) {
  if (mutation?.target !== "final-evidence" || mutation.operation !== "ordered-changes" || mutation.changes.length === 0) throw probeFailure("final-evidence");
  let finalCode = null;
  for (const change of mutation.changes) {
    const candidate = deepClone(evidence);
    applyDocumentMutation(candidate, change);
    if (change.caseId !== "self-hash") candidate.artifacts.at(-1).hash = computeEvidenceSelfHash(candidate);
    finalCode = await firstEvidenceIntegrityFailureCode(cwd, candidate);
    if (finalCode !== change.expectedDiagnosticCode) throw probeFailure(`final-evidence:${change.caseId}`);
  }
  return finalCode;
}

function buildReport({ runId, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef, namespaceEvidenceRef, stageChain, authorityExpansionProbe, validationResults, diagnostics }) {
  return {
    schemaId: "source-family-component-identity-mapping-report.v0", version: SFCIM_VERSION, runId, command: SFCIM_COMMAND,
    status: "pass", promotionStatus: "review_required",
    refs: { authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef, namespaceEvidenceRef },
    stageChain,
    authorityDecision: { declarationId: "team-button-to-button", status: "accepted", owner: "product-design-system-owners", normalizationAllowed: true, canAddAuthority: false },
    baselineComparison: { acceptedNamespaceInputsMatched: true, capturedArtifactsExact: true, narrativeMentionsPreserved: true, reviewSemanticsPreserved: true },
    authorityExpansionProbe, validationResults, diagnostics,
    provenance: provenance("interfacectl-source-family-component-identity-mapping-report", [identityPackageRef.path, authorityManifestRef.path, authorityDeclarationRef.path, mappingRef.path, SFCIM_NAMESPACE_EVIDENCE_PATH])
  };
}

async function buildEvidence({ cwd, args, runId, refs, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef, stageChain, validationResults, diagnostics }) {
  const artifacts = [];
  for (const artifactPath of SFCIM_ARTIFACT_PATHS) {
    const schemaId = sfcimSchemaIdForPath(artifactPath);
    artifacts.push(artifactPath === `${SFCIM_ARTIFACT_ROOT}/evidence.json` ? artifactRef(artifactPath, schemaId, null) : await canonicalArtifactRef(cwd, artifactPath, schemaId));
  }
  const evidence = {
    schemaId: "source-family-component-identity-mapping-evidence.v0", contractId: SFCIM_CONTRACT_ID, version: SFCIM_VERSION, runId,
    command: SFCIM_COMMAND, arguments: componentIdentityArgumentVector(args), checkedAt: SFCIM_TIMESTAMP, status: "pass", promotionStatus: "review_required", environment: SFCIM_ENVIRONMENT,
    authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef, namespaceMappingRef, namespacePackageRef,
    sourceFileRefs: refs.sourceFileRefs, namespaceNormalizerRefs: refs.namespaceNormalizerRefs, compilerRefs: refs.compilerRefs,
    proofImplementationRefs: refs.proofImplementationRefs, runtimeRefs: refs.runtimeRefs, fixtureRefs: refs.fixtureRefs, boundaryRefs: refs.boundaryRefs,
    schemaClosure: refs.schemaClosure, artifacts, stageChain, diagnostics, validationResults,
    identityMappedEvidenceRemap: identityMappedEvidenceRemap(mappingRef), identityMappedEvidenceClosureVerified: true,
    provenance: provenance("interfacectl-source-family-component-identity-mapping-evidence", [identityPackageRef.path, authorityManifestRef.path, authorityDeclarationRef.path, mappingRef.path, namespaceMappingRef.path, namespacePackageRef.path])
  };
  evidence.artifacts.at(-1).hash = computeEvidenceSelfHash(evidence);
  return evidence;
}

export function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const final = clone.artifacts?.find((entry) => entry.path === `${SFCIM_ARTIFACT_ROOT}/evidence.json`);
  if (final) final.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function firstEvidenceIntegrityFailureCode(cwd, evidence) {
  try {
    if (
      evidence?.schemaId !== "source-family-component-identity-mapping-evidence.v0" || evidence.contractId !== SFCIM_CONTRACT_ID ||
      evidence.version !== SFCIM_VERSION || evidence.command !== SFCIM_COMMAND || evidence.checkedAt !== SFCIM_TIMESTAMP ||
      evidence.status !== "pass" || evidence.promotionStatus !== "review_required" || canonicalJson(evidence.environment) !== canonicalJson(SFCIM_ENVIRONMENT) ||
      canonicalJson(evidence.arguments) !== canonicalJson(componentIdentityArgumentVector())
    ) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    const immutable = await verifyImmutableComponentIdentityInputs(cwd);
    const namespaceImmutable = await verifyImmutableNamespaceInputs(cwd);
    const upstreamCode = await firstUpstreamIntegrityFailureCode(cwd, immutable.identityPackage);
    if (upstreamCode) return upstreamCode;
    const topRefs = [
      [evidence.authorityManifestRef, SFCIM_AUTHORITY_MANIFEST_PATH, "source-family-component-identity-authority-manifest.v0"],
      [evidence.authorityDeclarationRef, SFCIM_AUTHORITY_DECLARATION_PATH, "source-family-component-identity-authority-declaration.v0"],
      [evidence.identityPackageRef, SFCIM_IDENTITY_PACKAGE_PATH, "source-family-component-identity-package.v0"],
      [evidence.mappingRef, SFCIM_MAPPING_PATH, "source-family-component-identity-mapping.v0"],
      [evidence.namespaceMappingRef, SFNM_MAPPING_PATH, "source-family-namespace-mapping.v0"],
      [evidence.namespacePackageRef, SFNM_NAMESPACE_PACKAGE_PATH, "source-family-namespace-package.v0"]
    ];
    for (const [ref, artifactPath, schemaId] of topRefs) {
      if (ref?.path !== artifactPath || ref.schemaId !== schemaId || ref.hashAlgorithm !== "sha256" || ref.hash !== await rawFileHash(path.join(cwd, artifactPath))) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    }
    const expectedArrays = [
      [evidence.sourceFileRefs, SFCIM_SOURCE_ENTRIES.map((entry) => `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`)],
      [evidence.namespaceNormalizerRefs, SFCIM_NAMESPACE_NORMALIZER_PATHS], [evidence.compilerRefs, SFCIM_COMPILER_IMPLEMENTATION_PATHS],
      [evidence.proofImplementationRefs, SFCIM_PROOF_IMPLEMENTATION_PATHS], [evidence.runtimeRefs, SFCIM_RUNTIME_DEPENDENCY_PATHS],
      [evidence.fixtureRefs, sfcimFixturePaths()], [evidence.boundaryRefs, BOUNDARY_PATHS], [evidence.schemaClosure, sfcimSchemaPaths()], [evidence.artifacts, SFCIM_ARTIFACT_PATHS]
    ];
    for (const [actual, paths] of expectedArrays) if (canonicalJson((actual || []).map((entry) => entry.path)) !== canonicalJson(paths)) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    for (const refs of [evidence.sourceFileRefs, evidence.namespaceNormalizerRefs, evidence.compilerRefs, evidence.proofImplementationRefs, evidence.runtimeRefs]) {
      for (const ref of refs) if (ref.hash !== await rawFileHash(path.join(cwd, ref.path))) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    }
    for (const refs of [evidence.fixtureRefs, evidence.schemaClosure]) {
      for (const ref of refs) if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    }
    const expectedBoundaryRefs = await buildBoundaryRefs(cwd);
    if (canonicalJson(evidence.boundaryRefs) !== canonicalJson(expectedBoundaryRefs)) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    for (const ref of evidence.artifacts.slice(0, -1)) if (ref.hash !== await canonicalFileHash(path.join(cwd, ref.path))) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    assertEvidenceSelfHash(evidence);
    const immutableMappingRef = await rawArtifactRef(cwd, SFCIM_MAPPING_PATH, "source-family-component-identity-mapping.v0");
    if (canonicalJson(evidence.identityMappedEvidenceRemap) !== canonicalJson(identityMappedEvidenceRemap(immutableMappingRef)) || evidence.identityMappedEvidenceClosureVerified !== true) return "SOURCE_IDENTITY_INNER_EVIDENCE_INVALID";
    const validators = await loadValidators(cwd);
    assertSchema(validators, "source-family-component-identity-mapping-evidence.v0", evidence, `${SFCIM_ARTIFACT_ROOT}/evidence.json`);
    const namespaceNormalization = await buildCurrentNamespaceNormalization(cwd, immutable.normalization);
    const expectedStageChain = buildStageChain(immutable.normalization, namespaceNormalization);
    assertStageChainDocument(evidence.stageChain, expectedStageChain.identityOutputHashes);
    await assertPersistedOutputClosure(cwd);

    const namespaceMappingReceiptRef = namespaceArtifactRef(SFNM_MAPPING_PATH, "source-family-namespace-mapping.v0", await rawFileHash(path.join(cwd, SFNM_MAPPING_PATH)));
    const namespacePackageReceiptRef = namespaceArtifactRef(SFNM_NAMESPACE_PACKAGE_PATH, "source-family-namespace-package.v0", await rawFileHash(path.join(cwd, SFNM_NAMESPACE_PACKAGE_PATH)));
    const expectedNamespaceReceipt = buildNamespaceReceiptFromRun(namespaceNormalization, namespaceImmutable.mapping, namespaceMappingReceiptRef, namespacePackageReceiptRef);
    const persistedNamespaceReceiptPath = `${SFCIM_ARTIFACT_ROOT}/namespace-mapping-receipt.json`;
    const persistedNamespaceReceipt = await readJson(path.join(cwd, persistedNamespaceReceiptPath));
    assertSchema(validators, "source-family-namespace-mapping-receipt.v0", persistedNamespaceReceipt, persistedNamespaceReceiptPath);
    if (canonicalJson(persistedNamespaceReceipt) !== canonicalJson(expectedNamespaceReceipt)) return "SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH";
    const acceptedNamespaceReceipt = await readJson(path.join(cwd, SFNM_ARTIFACT_ROOT, "namespace-mapping-receipt.json"));
    if (canonicalJson(persistedNamespaceReceipt) !== canonicalJson(acceptedNamespaceReceipt)) return "SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH";

    const authorityManifestRef = await rawArtifactRef(cwd, SFCIM_AUTHORITY_MANIFEST_PATH, "source-family-component-identity-authority-manifest.v0");
    const authorityDeclarationRef = await rawArtifactRef(cwd, SFCIM_AUTHORITY_DECLARATION_PATH, "source-family-component-identity-authority-declaration.v0");
    const identityPackageRef = await rawArtifactRef(cwd, SFCIM_IDENTITY_PACKAGE_PATH, "source-family-component-identity-package.v0");
    const namespaceReceiptRef = await rawArtifactRef(cwd, persistedNamespaceReceiptPath, "source-family-namespace-mapping-receipt.v0");
    const expectedIdentityReceipt = buildIdentityReceipt({ immutable, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef: immutableMappingRef, namespaceReceiptRef, stageChain: expectedStageChain });
    const identityReceiptPath = `${SFCIM_ARTIFACT_ROOT}/component-identity-mapping-receipt.json`;
    const persistedIdentityReceipt = await readJson(path.join(cwd, identityReceiptPath));
    assertSchema(validators, "source-family-component-identity-mapping-receipt.v0", persistedIdentityReceipt, identityReceiptPath);
    if (canonicalJson(persistedIdentityReceipt) !== canonicalJson(expectedIdentityReceipt)) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";

    if (canonicalJson(evidence.diagnostics) !== canonicalJson(SFCIM_DIAGNOSTIC_ROWS) || evidence.validationResults.length !== SFCIM_EXPECTATION_ROWS.length) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    for (let index = 0; index < SFCIM_EXPECTATION_ROWS.length; index += 1) {
      const expected = SFCIM_EXPECTATION_ROWS[index];
      const actual = evidence.validationResults[index];
      if (!actual?.matched || actual.actualResult !== expected.expectedResult || canonicalJson(actual.diagnosticCodes) !== canonicalJson(expected.diagnosticCodes) || !Object.entries(expected).every(([key, value]) => canonicalJson(actual[key]) === canonicalJson(value))) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    }
    const reportPath = `${SFCIM_ARTIFACT_ROOT}/source-family-component-identity-mapping-report.json`;
    const report = await readJson(path.join(cwd, reportPath));
    assertSchema(validators, "source-family-component-identity-mapping-report.v0", report, reportPath);
    const namespaceMappingRef = await rawArtifactRef(cwd, SFNM_MAPPING_PATH, "source-family-namespace-mapping.v0");
    const namespacePackageRef = await rawArtifactRef(cwd, SFNM_NAMESPACE_PACKAGE_PATH, "source-family-namespace-package.v0");
    const namespaceEvidenceRef = evidence.boundaryRefs[2];
    const expectedRunId = sha256Hex(canonicalJson({ authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef: immutableMappingRef, namespaceMappingRef, namespacePackageRef, stageChain: expectedStageChain, validationResults: evidence.validationResults, authorityExpansionProbe: report.authorityExpansionProbe }));
    if (evidence.runId !== expectedRunId || report.runId !== expectedRunId) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    const expectedReport = buildReport({ runId: expectedRunId, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef: immutableMappingRef, namespaceMappingRef, namespacePackageRef, namespaceEvidenceRef, stageChain: expectedStageChain, authorityExpansionProbe: report.authorityExpansionProbe, validationResults: evidence.validationResults, diagnostics: evidence.diagnostics });
    if (canonicalJson(report) !== canonicalJson(expectedReport) || canonicalJson(report.validationResults) !== canonicalJson(evidence.validationResults) || canonicalJson(report.diagnostics) !== canonicalJson(evidence.diagnostics)) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    const expectedRefs = await buildCheckedRefs(cwd, immutable.identityPackage);
    const expectedEvidence = await buildEvidence({ cwd, args: defaultComponentIdentityMappingArgs(), runId: expectedRunId, refs: expectedRefs, authorityManifestRef, authorityDeclarationRef, identityPackageRef, mappingRef: immutableMappingRef, namespaceMappingRef, namespacePackageRef, stageChain: expectedStageChain, validationResults: evidence.validationResults, diagnostics: evidence.diagnostics });
    if (canonicalJson(evidence) !== canonicalJson(expectedEvidence)) return "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
    await verifyPersistedInnerClosure({ cwd, normalization: immutable.normalization, validators });
    return null;
  } catch (error) {
    return diagnosticCodeFromError(error) || "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH";
  }
}

async function prepareOutputRoot(cwd) {
  const root = path.join(cwd, SFCIM_ARTIFACT_ROOT);
  await fs.mkdir(root, { recursive: true });
  const allowed = new Set(SFCIM_ARTIFACT_PATHS.map((entry) => path.posix.basename(entry)));
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const stat = await fs.lstat(path.join(root, entry.name));
    if (stat.isSymbolicLink() || !entry.isFile() || stat.nlink !== 1 || !allowed.has(entry.name)) throw contractError(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: stale or unsafe output ${entry.name}`, 1);
  }
  for (const file of allowed) await fs.rm(path.join(root, file), { force: true });
}

async function assertPersistedOutputClosure(cwd) {
  const actual = await listIndependentRegularFiles(cwd, SFCIM_ARTIFACT_ROOT);
  const expected = SFCIM_ARTIFACT_PATHS.map((entry) => path.posix.basename(entry)).sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) throw contractError("SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: output closure drift", 1);
}

async function rawHashSnapshot(cwd, paths) {
  const rows = [];
  for (const artifactPath of paths) rows.push({ path: artifactPath, hash: await rawFileHash(path.join(cwd, artifactPath)) });
  return rows;
}

async function readJsonOrNull(absolutePath) {
  try { return await readJson(absolutePath); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function loadValidators(cwd) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validators = new Map();
  const schemas = [];
  for (const artifactPath of sfcimSchemaPaths()) {
    const schema = await readJson(path.join(cwd, artifactPath));
    schemas.push([artifactPath, schema]);
  }
  for (const [, schema] of schemas) if (!ajv.getSchema(schema.$id)) ajv.addSchema(schema);
  for (const [artifactPath, schema] of schemas) validators.set(path.posix.basename(artifactPath).replace(/\.schema\.json$/, ""), ajv.getSchema(schema.$id));
  return validators;
}

function assertSchema(validators, schemaId, value, label) {
  const validate = validators.get(schemaId);
  if (!validate || !validate(value)) throw contractError(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: schema validation failed for ${label}: ${JSON.stringify(validate?.errors || [])}`, 1);
}

function diagnosticCodeFromError(error) {
  return typeof error?.message === "string" ? error.message.match(/\b(?:SOURCE_IDENTITY|SOURCE_FACT)_[A-Z0-9_]+\b/)?.[0] || null : null;
}

function contractError(message, exitCode = 1) { const error = new Error(message); error.exitCode = exitCode; return error; }

export const sourceFamilyComponentIdentityMappingInternals = {
  parseSourceFamilyComponentIdentityMappingArgs,
  computeEvidenceSelfHash,
  firstEvidenceIntegrityFailureCode,
  firstUpstreamIntegrityFailureCode,
  assertStageHashCausality,
  assertStageChainDocument,
  buildStageChain,
  buildNamespaceReceiptFromRun,
  mapCompilerResult,
  verifyPersistedInnerClosure,
  runAuthorityExpansionProbe,
  evaluateAuthorityDeclaration,
  prepareOutputRoot,
  assertPersistedOutputClosure,
  listIndependentRegularFiles,
  setJsonPointer
};
