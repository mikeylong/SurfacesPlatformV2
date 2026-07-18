import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { canonicalJson } from "./p0.js";
import { deepClone, rawFileHash, readJson, writeCanonicalJson } from "./p2-contract.js";
import { SC_ARTIFACT_ROOT, SC_SOURCE_ROOT } from "./source-conformance-contract.js";
import {
  SFNM_ARTIFACT_ROOT,
  SFNM_CAPTURED_ARTIFACTS,
  SFNM_COMPILER_IMPLEMENTATION_PATHS,
  SFNM_CONSUMED_SCHEMA_FILES,
  SFNM_LAYOUT_EVIDENCE_PATH,
  SFNM_MAPPING_PATH,
  SFNM_NAMESPACE_PACKAGE_PATH,
  SFNM_P2_CATALOG_PATH,
  SFNM_P2_EVIDENCE_PATH,
  SFNM_RUNTIME_DEPENDENCY_PATHS,
  SFNM_SCHEMA_FILES,
  SFNM_SOURCE_ENTRIES,
  SFNM_SOURCE_ROOT
} from "./source-family-namespace-mapping-contract.js";

export const SFCIM_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SFCIM_VERSION = "0.0.0";
export const SFCIM_ENVIRONMENT = Object.freeze({ generatedAt: SFCIM_TIMESTAMP, host: null });
export const SFCIM_SCHEMA_ROOT = "schemas";
export const SFCIM_SOURCE_ROOT = "sources/source-family-component-identity-mapping/team-owned-identity-bundle";
export const SFCIM_AUTHORITY_MANIFEST_PATH = "sources/source-family-component-identity-mapping/authority/component-identity-authority-manifest.json";
export const SFCIM_AUTHORITY_DECLARATION_PATH = "sources/source-family-component-identity-mapping/authority/component-identity-declaration.json";
export const SFCIM_MAPPING_PATH = "sources/source-family-component-identity-mapping/component-identity-mapping.json";
export const SFCIM_FIXTURE_ROOT = "fixtures/source-family-component-identity-mapping";
export const SFCIM_IDENTITY_PACKAGE_PATH = `${SFCIM_FIXTURE_ROOT}/component-identity-package.fixture.json`;
export const SFCIM_ARTIFACT_ROOT = "artifacts/source-family-component-identity-mapping";
export const SFCIM_COMMAND = "interfacectl surfaces source-family-component-identity-mapping proof";
export const SFCIM_CONTRACT_ID = "surfaces-source-family-component-identity-mapping-proof";
export const SFCIM_P2_EVIDENCE_PATH = SFNM_P2_EVIDENCE_PATH;
export const SFCIM_P2_CATALOG_PATH = SFNM_P2_CATALOG_PATH;
export const SFCIM_NAMESPACE_EVIDENCE_PATH = `${SFNM_ARTIFACT_ROOT}/evidence.json`;
export const SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT = 22;
export const SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT = 5;
export const SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT = 4;
export const SFCIM_EXPECTED_MANIFEST_REFRESH_POINTERS = [
  "/sourceFiles/0/sha256", "/sourceFiles/1/sha256", "/sourceFiles/2/sha256", "/sourceFiles/3/sha256", "/sourceFiles/10/sha256"
];
export const SFCIM_EXPECTED_IDENTITY_PHYSICAL_PATHS = [
  "review/authority-map.json", "ui/button-definition.json", "ui/button-fork.json", "ui/button-source-a.json", "ui/button-source-b.json"
];
export const SFCIM_EXPECTED_SUBSTITUTION_CLOSURE_HASH = "6623b37cf6240c1888a6ca230982ba43b8944f6d7f659dcf699f7e283a656df7";
export const SFCIM_EXPECTED_SUBSTITUTION_KEY_HASH = "2742f6618bbdc752c3104c36a438a70fdf74d7cf61b81b219e6553f2e9e735e9";
export const SFCIM_EXPECTED_NARRATIVE_CLOSURE_HASH = "ad3c52256ffc9c4fa4a092786da7d1815de6ae77b36f40a0759a34e74d4bb54d";
export const SFCIM_EXPECTED_NARRATIVE_KEY_HASH = "692b1c4428d406c1a19485e12d3f753be395711eb300305bc59c52c29b52c32a";
export const SFCIM_AUTHORITY_MANIFEST_KEY_SHAPE_HASH = "274276be3756efb8eeae5cd3b6cff23fa345b209dbb2a866e67304092b957cd3";
export const SFCIM_AUTHORITY_DECLARATION_KEY_SHAPE_HASH = "ae7fcec7006328997c2440c3c2f0380664f57759963f3e0fe1e3791b8c93cdf9";
export const SFCIM_IDENTITY_PACKAGE_KEY_SHAPE_HASH = "62bfebeca0a54905db4d92bab895c673189608373fb7ab5d6eb29eae7d2d0b99";

export const SFCIM_SCHEMA_FILES = [
  "source-family-component-identity-authority-manifest.v0.schema.json",
  "source-family-component-identity-authority-declaration.v0.schema.json",
  "source-family-component-identity-mapping.v0.schema.json",
  "source-family-component-identity-package.v0.schema.json",
  "source-family-component-identity-mapping-receipt.v0.schema.json",
  "source-family-component-identity-mapping-fixture.v0.schema.json",
  "source-family-component-identity-mapping-preflight-mutation.v0.schema.json",
  "source-family-component-identity-mapping-expectations.v0.schema.json",
  "source-family-component-identity-mapping-diagnostics.v0.schema.json",
  "source-family-component-identity-mapping-report.v0.schema.json",
  "source-family-component-identity-mapping-evidence.v0.schema.json"
];

export const SFCIM_CONSUMED_SCHEMA_FILES = [...new Set([...SFNM_SCHEMA_FILES, ...SFNM_CONSUMED_SCHEMA_FILES])];
export const SFCIM_COMPILER_IMPLEMENTATION_PATHS = [...SFNM_COMPILER_IMPLEMENTATION_PATHS];
export const SFCIM_NAMESPACE_NORMALIZER_PATHS = [
  "src/source-family-namespace-mapping-contract.js",
  "src/source-family-namespace-mapping-proof.js"
];
export const SFCIM_RUNTIME_DEPENDENCY_PATHS = [...SFNM_RUNTIME_DEPENDENCY_PATHS];
export const SFCIM_PROOF_IMPLEMENTATION_PATHS = [
  "scripts/materialize-source-family-component-identity-mapping.mjs",
  "src/source-family-component-identity-mapping-contract.js",
  "src/source-family-component-identity-mapping-proof.js"
];

export const SFCIM_SOURCE_ENTRIES = SFNM_SOURCE_ENTRIES.map((entry) => ({
  physicalPath: entry.physicalPath,
  logicalPath: entry.logicalPath
}));

export const SFCIM_CAPTURED_ARTIFACTS = SFNM_CAPTURED_ARTIFACTS.map(([, schemaId, innerFile]) => [
  innerFile === "evidence.json" ? "identity-mapped-source-conformance-evidence.json" : `identity-mapped-${innerFile}`,
  schemaId,
  innerFile
]);

export const SFCIM_GENERATED_ARTIFACTS = [
  "component-identity-mapping-receipt.json",
  "namespace-mapping-receipt.json",
  ...SFCIM_CAPTURED_ARTIFACTS.map(([file]) => file),
  "source-family-component-identity-mapping-report.json",
  "evidence.json"
];
export const SFCIM_ARTIFACT_PATHS = SFCIM_GENERATED_ARTIFACTS.map((file) => `${SFCIM_ARTIFACT_ROOT}/${file}`);

export const SFCIM_DIAGNOSTIC_ROWS = [
  diagnostic("SOURCE_IDENTITY_UPSTREAM_EVIDENCE_MISSING", "Required accepted P2 or namespace evidence is missing.", "preflight", "source-identity-upstream", "error", "blocked", "invalid", "mutations/missing-p2-evidence.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_UPSTREAM_EVIDENCE_NONPASS", "Required upstream evidence is not passing.", "preflight", "source-identity-upstream", "error", "blocked", "invalid", "mutations/nonpass-p2-evidence.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_UPSTREAM_HASH_MISMATCH", "Required upstream evidence bytes do not match the immutable package.", "preflight", "source-identity-upstream", "error", "blocked", "invalid", "mutations/tampered-p2-evidence.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_EVIDENCE_MISSING", "Accepted fixed-namespace evidence is missing.", "preflight", "source-identity-namespace", "error", "blocked", "invalid", "mutations/missing-namespace-evidence.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_EVIDENCE_NONPASS", "Accepted fixed-namespace evidence is not passing.", "preflight", "source-identity-namespace", "error", "blocked", "invalid", "mutations/nonpass-namespace-evidence.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_HASH_MISMATCH", "Accepted fixed-namespace evidence bytes do not match the immutable package.", "preflight", "source-identity-namespace", "error", "blocked", "invalid", "mutations/tampered-namespace-evidence.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH", "The authority manifest or declaration does not match its checked hash closure.", "preflight", "source-identity-authority", "error", "blocked", "invalid", "mutations/authority-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_AUTHORITY_REVIEW_REQUIRED", "The same identity declaration is review-required, so no normalization occurs.", "authority", "source-identity-authority", "review", "review_required", "review_required", "review/declaration-review-required.source-family-component-identity-mapping.json"),
  diagnostic("SOURCE_IDENTITY_MAPPING_HASH_MISMATCH", "The identity mapping does not match the immutable package.", "preflight", "source-identity-mapping", "error", "blocked", "invalid", "mutations/mapping-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_PACKAGE_HASH_MISMATCH", "The immutable component-identity package is inconsistent with its checked closure.", "preflight", "source-identity-package", "error", "blocked", "invalid", "mutations/identity-package-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_SOURCE_HASH_MISMATCH", "A candidate source byte differs from the immutable package.", "source-inventory", "source-identity-input", "error", "blocked", "invalid", "mutations/source-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_MAPPING_INCOMPLETE", "The exact 22 checked identity substitutions were not all applied.", "identity", "source-identity-mapping", "error", "blocked", "invalid", "mutations/skipped-substitution.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_MAPPING_REVERSED", "The fixed TeamButton to Button identity mapping was reversed.", "identity", "source-identity-mapping", "error", "blocked", "invalid", "mutations/reversed-mapping.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_BASELINE_MISMATCH", "Identity output differs from the accepted fixed-namespace input baseline.", "identity", "source-identity-baseline", "error", "blocked", "invalid", "mutations/baseline-bypass.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_INTERMEDIATE_TAMPER", "The Stage-2 namespace input hashes differ from the Stage-1 identity output hashes.", "namespace", "source-identity-causal-chain", "error", "blocked", "invalid", "mutations/intermediate-output-tamper.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_STAGE_SKIPPED", "The fixed identity stage was skipped before namespace normalization.", "namespace", "source-identity-causal-chain", "error", "blocked", "invalid", "mutations/identity-stage-skipped.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_STAGE_SKIPPED", "The accepted fixed-namespace stage was skipped before compilation.", "compile", "source-identity-causal-chain", "error", "blocked", "invalid", "mutations/namespace-stage-skipped.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_STAGE_REVERSED", "Namespace normalization was run before the fixed identity stage.", "namespace", "source-identity-causal-chain", "error", "blocked", "invalid", "mutations/stage-order-reversed.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_WRONG_VALUE", "A checked identity pointer contains a value outside the one accepted TeamButton relation.", "identity", "source-identity-mapping", "error", "blocked", "invalid", "mutations/wrong-value.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_EXTRA_POINTER", "The mapping requests an additional pointer outside the exact 22 substitutions.", "identity", "source-identity-boundary", "error", "blocked", "invalid", "mutations/extra-pointer.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NARRATIVE_MUTATION", "Identity normalization changed a narrative Button mention.", "identity", "source-identity-preservation", "error", "blocked", "invalid", "mutations/narrative-field.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_SIXTH_FILE_EXPANSION", "Identity normalization touched a sixth file outside the five-file authority closure.", "identity", "source-identity-boundary", "error", "blocked", "invalid", "mutations/sixth-file.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_DESCRIPTOR_HASH_MISMATCH", "The accepted namespace descriptor bytes differ from the identity package.", "preflight", "source-identity-namespace", "error", "blocked", "invalid", "mutations/namespace-descriptor-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_PACKAGE_HASH_MISMATCH", "The accepted namespace package bytes differ from the identity package.", "preflight", "source-identity-namespace", "error", "blocked", "invalid", "mutations/namespace-package-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_NAMESPACE_NORMALIZER_HASH_MISMATCH", "The exported namespace normalizer implementation bytes differ from the identity package.", "preflight", "source-identity-namespace", "error", "blocked", "invalid", "mutations/namespace-normalizer-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_IMPLEMENTATION_HASH_MISMATCH", "Checked compiler, normalizer, proof, or runtime bytes differ from the immutable package.", "preflight", "source-identity-implementation", "error", "blocked", "invalid", "mutations/implementation-hash-mismatch.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_BOUNDARY_EXPANSION", "The descriptor requests an arbitrary identity, namespace, layout, component, fact, policy, or executable action.", "identity", "source-identity-boundary", "error", "blocked", "invalid", "mutations/boundary-expansion.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_COMPILER_RUN_FAILED", "The unchanged source-conformance compiler failed in the isolated chained workspace.", "compile", "source-identity-compiler", "error", "blocked", "invalid", "mutations/compiler-run-failed.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_INNER_EVIDENCE_INVALID", "Persisted chained compiler artifacts fail exact baseline or post-temporary-workspace integrity.", "evidence", "source-identity-inner-evidence", "error", "blocked", "invalid", "mutations/inner-evidence-invalid.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_FACT_AUTHORITY_ESCALATION", "The unchanged compiler rejects a source fact that expands accepted P2 authority.", "compile", "source-fact-authority", "error", "blocked", "invalid", "mutations/source-fact-authority-escalation.source-family-component-identity-mapping-preflight.json"),
  diagnostic("SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH", "Final component-identity evidence does not match its complete checked closure.", "evidence", "source-identity-evidence", "error", "blocked", "invalid", "mutations/evidence-hash-mismatch.source-family-component-identity-mapping-preflight.json")
];

export const SFCIM_EXPECTATION_ROWS = [
  expectation("valid/accepted-team-button.source-family-component-identity-mapping.json", "valid", "identity", "source-identity-mapping", "valid", "allowed", []),
  expectation("review/declaration-review-required.source-family-component-identity-mapping.json", "review", "authority", "source-identity-authority", "review_required", "review_required", ["SOURCE_IDENTITY_AUTHORITY_REVIEW_REQUIRED"]),
  expectation("mutations/authority-boundary-expansion.source-family-component-identity-mapping-preflight.json", "mutation", "identity", "source-identity-boundary", "invalid", "blocked", ["SOURCE_IDENTITY_BOUNDARY_EXPANSION"]),
  expectation("mutations/nested-authority-boundary-expansion.source-family-component-identity-mapping-preflight.json", "mutation", "identity", "source-identity-boundary", "invalid", "blocked", ["SOURCE_IDENTITY_BOUNDARY_EXPANSION"]),
  expectation("mutations/package-boundary-expansion.source-family-component-identity-mapping-preflight.json", "mutation", "identity", "source-identity-boundary", "invalid", "blocked", ["SOURCE_IDENTITY_BOUNDARY_EXPANSION"]),
  ...SFCIM_DIAGNOSTIC_ROWS.filter((row) => !["SOURCE_IDENTITY_AUTHORITY_REVIEW_REQUIRED"].includes(row.code)).map((row) =>
    expectation(row.fixtureCoverage, "mutation", row.stage, row.phase, "invalid", "blocked", [row.code])
  )
];

export function defaultComponentIdentityMappingArgs() {
  return {
    source: SFCIM_SOURCE_ROOT,
    authorityManifest: SFCIM_AUTHORITY_MANIFEST_PATH,
    authorityDeclaration: SFCIM_AUTHORITY_DECLARATION_PATH,
    mapping: SFCIM_MAPPING_PATH,
    identityPackage: SFCIM_IDENTITY_PACKAGE_PATH,
    ingestionEvidence: SFCIM_P2_EVIDENCE_PATH,
    catalog: SFCIM_P2_CATALOG_PATH,
    sourceFamilyNamespaceMappingEvidence: SFCIM_NAMESPACE_EVIDENCE_PATH,
    fixture: SFCIM_FIXTURE_ROOT,
    out: SFCIM_ARTIFACT_ROOT
  };
}

export function componentIdentityArgumentVector(args = defaultComponentIdentityMappingArgs()) {
  return [
    "--source", args.source,
    "--authority-manifest", args.authorityManifest,
    "--authority-declaration", args.authorityDeclaration,
    "--mapping", args.mapping,
    "--identity-package", args.identityPackage,
    "--ingestion-evidence", args.ingestionEvidence,
    "--catalog", args.catalog,
    "--source-family-namespace-mapping-evidence", args.sourceFamilyNamespaceMappingEvidence,
    "--fixture", args.fixture,
    "--out", args.out
  ];
}

export function sfcimSourcePaths() {
  return [
    SFCIM_AUTHORITY_MANIFEST_PATH,
    SFCIM_AUTHORITY_DECLARATION_PATH,
    SFCIM_MAPPING_PATH,
    ...SFCIM_SOURCE_ENTRIES.map((entry) => `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`)
  ];
}

export function sfcimFixturePaths() {
  return [
    SFCIM_IDENTITY_PACKAGE_PATH,
    `${SFCIM_FIXTURE_ROOT}/expectations.manifest.json`,
    ...SFCIM_EXPECTATION_ROWS.map((row) => `${SFCIM_FIXTURE_ROOT}/${row.fixturePath}`)
  ];
}

export function sfcimSchemaPaths() {
  return [...SFCIM_SCHEMA_FILES, ...SFCIM_CONSUMED_SCHEMA_FILES].map((file) => `${SFCIM_SCHEMA_ROOT}/${file}`);
}

export function sfcimArtifactOrder() {
  return [
    ...sfcimSchemaPaths(),
    ...sfcimSourcePaths(),
    ...sfcimFixturePaths(),
    ...SFCIM_NAMESPACE_NORMALIZER_PATHS,
    ...SFCIM_COMPILER_IMPLEMENTATION_PATHS,
    ...SFCIM_RUNTIME_DEPENDENCY_PATHS,
    ...SFCIM_PROOF_IMPLEMENTATION_PATHS,
    SFCIM_P2_EVIDENCE_PATH,
    SFCIM_P2_CATALOG_PATH,
    SFCIM_NAMESPACE_EVIDENCE_PATH,
    ...SFCIM_ARTIFACT_PATHS
  ];
}

export function sfcimSchemaIdForPath(artifactPath) {
  const file = path.posix.basename(artifactPath);
  if (SFCIM_SCHEMA_FILES.includes(file) || SFCIM_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath === SFCIM_AUTHORITY_MANIFEST_PATH) return "source-family-component-identity-authority-manifest.v0";
  if (artifactPath === SFCIM_AUTHORITY_DECLARATION_PATH) return "source-family-component-identity-authority-declaration.v0";
  if (artifactPath === SFCIM_MAPPING_PATH) return "source-family-component-identity-mapping.v0";
  if (artifactPath === SFCIM_IDENTITY_PACKAGE_PATH) return "source-family-component-identity-package.v0";
  if (file === "expectations.manifest.json") return "source-family-component-identity-mapping-expectations.v0";
  if (file.endsWith(".source-family-component-identity-mapping-preflight.json")) return "source-family-component-identity-mapping-preflight-mutation.v0";
  if (file.endsWith(".source-family-component-identity-mapping.json")) return "source-family-component-identity-mapping-fixture.v0";
  if (file === "component-identity-mapping-receipt.json") return "source-family-component-identity-mapping-receipt.v0";
  if (file === "namespace-mapping-receipt.json") return "source-family-namespace-mapping-receipt.v0";
  const captured = SFCIM_CAPTURED_ARTIFACTS.find(([capturedFile]) => capturedFile === file);
  if (captured) return captured[1];
  if (file === "source-family-component-identity-mapping-report.json") return "source-family-component-identity-mapping-report.v0";
  if (artifactPath === `${SFCIM_ARTIFACT_ROOT}/evidence.json`) return "source-family-component-identity-mapping-evidence.v0";
  if (file === "bundle-index.json") return "declared-source-manifest.v0";
  if (file === "authority-map.json") return "source-authority-profile.v0";
  if (artifactPath.startsWith(`${SFCIM_SOURCE_ROOT}/`)) return "declared-source-document.v0";
  return null;
}

export async function materializeSourceFamilyComponentIdentityMappingContract(cwd) {
  const immutable = await verifyImmutableComponentIdentityInputs(cwd);
  const schemas = buildSourceFamilyComponentIdentityMappingSchemas(immutable);
  for (const [file, schema] of Object.entries(schemas)) await writeCanonicalJson(path.join(cwd, SFCIM_SCHEMA_ROOT, file), schema);
  const fixtures = buildSourceFamilyComponentIdentityMappingFixtures(immutable.identityPackage);
  for (const [relativePath, fixture] of Object.entries(fixtures)) await writeCanonicalJson(path.join(cwd, SFCIM_FIXTURE_ROOT, relativePath), fixture);
  await verifyImmutableComponentIdentityInputs(cwd);
}

export async function verifyImmutableComponentIdentityInputs(cwd) {
  const [authorityManifest, authorityDeclaration, mapping, identityPackage] = await Promise.all([
    readJson(path.join(cwd, SFCIM_AUTHORITY_MANIFEST_PATH)),
    readJson(path.join(cwd, SFCIM_AUTHORITY_DECLARATION_PATH)),
    readJson(path.join(cwd, SFCIM_MAPPING_PATH)),
    readJson(path.join(cwd, SFCIM_IDENTITY_PACKAGE_PATH))
  ]);
  await assertAuthorityClosure(cwd, authorityManifest, authorityDeclaration);
  await assertIdentityMapping(cwd, mapping, authorityManifest, authorityDeclaration);
  const normalization = await normalizeComponentIdentityBundle(cwd, SFCIM_SOURCE_ROOT, mapping);
  await assertIdentityPackage(cwd, identityPackage, authorityManifest, authorityDeclaration, mapping, normalization);
  return { authorityManifest, authorityDeclaration, mapping, identityPackage, normalization };
}

export async function normalizeComponentIdentityBundle(cwd, sourceRoot = SFCIM_SOURCE_ROOT, mappingOverride = null) {
  const mapping = mappingOverride || await readJson(path.join(cwd, SFCIM_MAPPING_PATH));
  const authorityManifest = await readJson(path.join(cwd, SFCIM_AUTHORITY_MANIFEST_PATH));
  const authorityDeclaration = await readJson(path.join(cwd, SFCIM_AUTHORITY_DECLARATION_PATH));
  await assertIdentityMapping(cwd, mapping, authorityManifest, authorityDeclaration);
  const actual = await listRegularFiles(path.join(cwd, sourceRoot));
  const expected = SFCIM_SOURCE_ENTRIES.map((entry) => entry.physicalPath).sort(comparePosix);
  if (canonicalJson(actual) !== canonicalJson(expected)) throw contractError("SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: candidate source closure drift");

  const rows = [];
  const documentsByLogicalPath = new Map();
  const outputHashByLogicalPath = new Map();
  for (const entry of SFCIM_SOURCE_ENTRIES.filter((row) => row.logicalPath !== "manifest.json")) {
    const inputPath = path.join(cwd, sourceRoot, entry.physicalPath);
    const inputText = await fs.readFile(inputPath, "utf8");
    const document = JSON.parse(inputText);
    const substitutions = mapping.substitutions.filter((row) => row.physicalPath === entry.physicalPath);
    for (const substitution of substitutions) {
      const current = getJsonPointer(document, substitution.pointer);
      if (current !== substitution.from) throw contractError(`SOURCE_IDENTITY_MAPPING_INCOMPLETE: ${entry.physicalPath}${substitution.pointer}`);
      setJsonPointer(document, substitution.pointer, substitution.to);
    }
    const acceptedPath = path.join(cwd, SFNM_SOURCE_ROOT, entry.physicalPath);
    const acceptedText = await fs.readFile(acceptedPath, "utf8");
    const outputText = `${canonicalJson(document)}${acceptedText.endsWith("\n") ? "\n" : ""}`;
    const outputHash = sha256Text(outputText);
    if (outputText !== acceptedText) throw contractError(`SOURCE_IDENTITY_BASELINE_MISMATCH: ${entry.physicalPath}`);
    rows.push({
      physicalPath: entry.physicalPath,
      logicalPath: entry.logicalPath,
      inputSha256: await rawFileHash(inputPath),
      normalizedSha256: outputHash,
      substitutionCount: substitutions.length,
      substitutions: deepClone(substitutions),
      manifestHashRefreshes: []
    });
    documentsByLogicalPath.set(entry.logicalPath, { document, text: outputText });
    outputHashByLogicalPath.set(entry.logicalPath, outputHash);
  }

  const manifestEntry = SFCIM_SOURCE_ENTRIES.find((entry) => entry.logicalPath === "manifest.json");
  const manifestPath = path.join(cwd, sourceRoot, manifestEntry.physicalPath);
  const manifestText = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  const refreshes = [];
  for (let index = 0; index < manifest.sourceFiles.length; index += 1) {
    const sourceFile = manifest.sourceFiles[index];
    const inputEntry = SFCIM_SOURCE_ENTRIES.find((entry) => entry.logicalPath === sourceFile.path);
    if (!inputEntry) throw contractError(`SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: undeclared manifest path ${sourceFile.path}`);
    const inputHash = await rawFileHash(path.join(cwd, sourceRoot, inputEntry.physicalPath));
    if (sourceFile.sha256 !== inputHash) throw contractError(`SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: manifest hash drift ${sourceFile.path}`);
    const normalizedHash = outputHashByLogicalPath.get(sourceFile.path);
    if (inputHash !== normalizedHash) {
      refreshes.push({ pointer: `/sourceFiles/${index}/sha256`, inputHash, normalizedHash });
      sourceFile.sha256 = normalizedHash;
    }
  }
  const acceptedManifestText = await fs.readFile(path.join(cwd, SFNM_SOURCE_ROOT, manifestEntry.physicalPath), "utf8");
  const manifestOutputText = `${canonicalJson(manifest)}${acceptedManifestText.endsWith("\n") ? "\n" : ""}`;
  if (manifestOutputText !== acceptedManifestText) {
    throw contractError("SOURCE_IDENTITY_BASELINE_MISMATCH: bundle-index.json");
  }
  rows.unshift({
    physicalPath: manifestEntry.physicalPath,
    logicalPath: manifestEntry.logicalPath,
    inputSha256: await rawFileHash(manifestPath),
    normalizedSha256: sha256Text(manifestOutputText),
    substitutionCount: 0,
    substitutions: [],
    manifestHashRefreshes: refreshes
  });
  documentsByLogicalPath.set("manifest.json", { document: manifest, text: manifestOutputText });

  for (const mention of mapping.narrativeMentions) {
    const input = JSON.parse(await fs.readFile(path.join(cwd, sourceRoot, mention.physicalPath), "utf8"));
    const outputEntry = SFCIM_SOURCE_ENTRIES.find((entry) => entry.physicalPath === mention.physicalPath);
    const output = documentsByLogicalPath.get(outputEntry.logicalPath).document;
    if (getJsonPointer(input, mention.pointer) !== mention.value || getJsonPointer(output, mention.pointer) !== mention.value) {
      throw contractError(`SOURCE_IDENTITY_BASELINE_MISMATCH: narrative mention drift ${mention.physicalPath}${mention.pointer}`);
    }
  }
  const totalIdentitySubstitutionCount = rows.reduce((sum, row) => sum + row.substitutionCount, 0);
  const totalManifestHashRefreshCount = refreshes.length;
  if (totalIdentitySubstitutionCount !== SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT) throw contractError("SOURCE_IDENTITY_MAPPING_INCOMPLETE: substitution count drift");
  if (totalManifestHashRefreshCount !== SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT) throw contractError("SOURCE_IDENTITY_MAPPING_INCOMPLETE: manifest refresh count drift");
  return {
    entries: rows,
    documentsByLogicalPath,
    totalIdentitySubstitutionCount,
    totalManifestHashRefreshCount,
    totalNarrativeMentionCount: mapping.narrativeMentions.length,
    acceptedNamespaceBaselineMatched: true
  };
}

export async function assertAuthorityClosure(cwd, manifest, declaration) {
  assertClosedAuthorityKeys(manifest, declaration);
  if (
    manifest?.schemaId !== "source-family-component-identity-authority-manifest.v0" ||
    manifest.version !== SFCIM_VERSION || manifest.owner !== "product-design-system-owners" || manifest.sourceBundleRoot !== SFCIM_SOURCE_ROOT ||
    manifest.sourceRef !== "authority-manifest://product-design-system-owners/component-identity/team-button-to-button" ||
    manifest.acceptedDeclarationId !== "team-button-to-button" ||
    manifest.expectedIdentitySubstitutionCount !== SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT ||
    manifest.expectedManifestHashRefreshCount !== SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT ||
    manifest.expectedNarrativeMentionCount !== SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT ||
    manifest.review?.owner !== "product-design-system-owners" || manifest.review?.status !== "accepted" || manifest.review?.executable !== false ||
    manifest.provenance?.declaredAt !== SFCIM_TIMESTAMP || manifest.provenance?.environment?.generatedAt !== SFCIM_TIMESTAMP ||
    manifest.provenance?.environment?.host !== null || manifest.provenance?.producer !== "product-design-system-owners" ||
    manifest.provenance?.role !== "review-controlled-component-identity-authority-manifest" ||
    !Array.isArray(manifest.declarationRefs) || manifest.declarationRefs.length !== 1 ||
    declaration?.schemaId !== "source-family-component-identity-authority-declaration.v0" ||
    declaration.version !== SFCIM_VERSION || declaration.owner !== "product-design-system-owners" ||
    declaration.declarationId !== "team-button-to-button" || declaration.fromComponentId !== "TeamButton" ||
    declaration.toComponentId !== "Button" || declaration.status !== "accepted" ||
    declaration.normalizationAllowed !== true || declaration.executable !== false || declaration.canAddAuthority !== false ||
    declaration.provenance?.declaredAt !== SFCIM_TIMESTAMP || declaration.provenance?.environment?.generatedAt !== SFCIM_TIMESTAMP ||
    declaration.provenance?.environment?.host !== null || declaration.provenance?.producer !== "product-design-system-owners" ||
    declaration.provenance?.role !== "review-controlled-component-identity-authority" ||
    declaration.relationKind !== "component-identity" || declaration.scope !== "component-identity-only" ||
    declaration.sourceRef !== "authority-declaration://product-design-system-owners/component-identity/team-button-to-button" ||
    declaration.validity?.effectiveAt !== SFCIM_TIMESTAMP || declaration.validity?.expiresAt !== null ||
    manifest.relationKind !== "component-identity" || manifest.scope !== "component-identity-only" ||
    manifest.validity?.effectiveAt !== SFCIM_TIMESTAMP || manifest.validity?.expiresAt !== null
  ) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: authority declaration boundary drift");
  const declarationRef = manifest.declarationRefs[0];
  if (declarationRef.path !== SFCIM_AUTHORITY_DECLARATION_PATH || declarationRef.schemaId !== "source-family-component-identity-authority-declaration.v0" || declarationRef.hashAlgorithm !== "sha256" || declarationRef.sha256 !== await rawFileHash(path.join(cwd, SFCIM_AUTHORITY_DECLARATION_PATH))) {
    throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: declaration ref drift");
  }
  const refs = [declaration.bundleManifestRef, ...declaration.coveredSourceRefs, ...declaration.policyRefs, ...declaration.reviewRefs,
    declaration.acceptedTarget?.governedCatalogRef, declaration.acceptedTarget?.ingestionEvidenceRef, manifest.sourceBundleManifestRef];
  for (const ref of refs) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH");
  const expectedSourceRefs = declaration.coveredSourceRefs.map((ref) => ref.sourceRef);
  const expectedCoveredPaths = [
    `${SFCIM_SOURCE_ROOT}/ui/button-definition.json`, `${SFCIM_SOURCE_ROOT}/ui/button-source-a.json`, `${SFCIM_SOURCE_ROOT}/ui/button-source-b.json`,
    `${SFCIM_SOURCE_ROOT}/ui/button-fork.json`, `${SFCIM_SOURCE_ROOT}/review/authority-map.json`
  ];
  const expectedProvenanceRefs = [
    declaration.sourceRef,
    declaration.bundleManifestRef.sourceRef,
    ...expectedSourceRefs,
    ...declaration.policyRefs.map((ref) => ref.sourceRef),
    ...declaration.reviewRefs.map((ref) => ref.sourceRef),
    declaration.acceptedTarget.catalogRef
  ];
  if (
    declaration.coveredSourceRefs.length !== 5 || declaration.policyRefs.length !== 1 || declaration.reviewRefs.length !== 1 ||
    canonicalJson(declaration.coveredSourceRefs.map((ref) => ref.path)) !== canonicalJson(expectedCoveredPaths) ||
    declaration.coveredSourceRefs.some((ref, index) => ref.hashAlgorithm !== "sha256" || ref.schemaId !== (index === 4 ? "source-authority-profile.v0" : "declared-source-document.v0")) ||
    declaration.bundleManifestRef.path !== `${SFCIM_SOURCE_ROOT}/bundle-index.json` || declaration.bundleManifestRef.schemaId !== "declared-source-manifest.v0" || declaration.bundleManifestRef.hashAlgorithm !== "sha256" ||
    manifest.sourceBundleManifestRef.path !== `${SFCIM_SOURCE_ROOT}/bundle-index.json` || manifest.sourceBundleManifestRef.schemaId !== "declared-source-manifest.v0" || manifest.sourceBundleManifestRef.hashAlgorithm !== "sha256" ||
    declaration.policyRefs[0].path !== `${SFCIM_SOURCE_ROOT}/review/exception-rules.json` || declaration.policyRefs[0].schemaId !== "declared-source-document.v0" ||
    declaration.reviewRefs[0].path !== `${SFCIM_SOURCE_ROOT}/review/review-rules.json` || declaration.reviewRefs[0].schemaId !== "declared-source-document.v0" ||
    expectedSourceRefs.some((sourceRef) => typeof sourceRef !== "string" || !sourceRef.startsWith("declared-source://product-team-authority/")) ||
    canonicalJson(declaration.sourceRefClosure) !== canonicalJson(expectedSourceRefs) ||
    canonicalJson(declaration.provenance?.sourceRefs) !== canonicalJson(expectedProvenanceRefs) ||
    canonicalJson(manifest.provenance?.sourceRefs) !== canonicalJson([manifest.sourceRef, declaration.sourceRef, manifest.sourceBundleManifestRef.sourceRef]) ||
    declaration.review?.owner !== declaration.owner || declaration.review?.status !== "accepted" || declaration.review?.executable !== false ||
    declaration.acceptedTarget?.componentId !== "Button" || declaration.acceptedTarget?.catalogRef !== "catalog://p2/components/Button" ||
    declaration.acceptedTarget?.authorityStatus !== "accepted" || declaration.acceptedTarget?.evidenceStatus !== "pass" ||
    declaration.acceptedTarget?.governedCatalogRef?.path !== SFCIM_P2_CATALOG_PATH || declaration.acceptedTarget.governedCatalogRef.schemaId !== "runtime-catalog.v0" ||
    declaration.acceptedTarget?.ingestionEvidenceRef?.path !== SFCIM_P2_EVIDENCE_PATH || declaration.acceptedTarget.ingestionEvidenceRef.schemaId !== "design-system-ingestion-evidence.v0"
  ) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: authority provenance or target drift");
  const p2Evidence = await readJson(path.join(cwd, SFCIM_P2_EVIDENCE_PATH));
  const p2Catalog = await readJson(path.join(cwd, SFCIM_P2_CATALOG_PATH));
  if (p2Evidence.status !== "pass" || !p2Catalog.components?.Button) throw contractError("SOURCE_IDENTITY_UPSTREAM_EVIDENCE_NONPASS: accepted P2 Button is unavailable");
  if (
    declaration.acceptedTarget.componentRecordHash?.canonicalization !== "RFC8785" ||
    declaration.acceptedTarget.componentRecordHash?.hashAlgorithm !== "sha256" ||
    declaration.acceptedTarget.componentRecordHash?.sha256 !== sha256Text(canonicalJson(p2Catalog.components.Button))
  ) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: accepted Button component record drift");
}

export async function assertIdentityMapping(cwd, mapping, manifest, declaration) {
  if (mapping?.schemaId !== "source-family-component-identity-mapping.v0" || mapping.version !== SFCIM_VERSION || mapping.mappingId !== "team-button-to-button-fixed-identity") {
    throw contractError("SOURCE_IDENTITY_MAPPING_HASH_MISMATCH: descriptor identity drift");
  }
  if (mapping.fromComponentId === "Button" && mapping.toComponentId === "TeamButton") throw contractError("SOURCE_IDENTITY_MAPPING_REVERSED: fixed mapping reversed");
  if (
    mapping.fromComponentId !== "TeamButton" || mapping.toComponentId !== "Button" || mapping.authorityDeclarationId !== "team-button-to-button" ||
    mapping.rewriteMode !== "exact-authority-declared-component-identity" || mapping.canAddAuthority !== false || mapping.familySpecificModule !== null ||
    mapping.manifestHashRefresh !== true || mapping.expectedIdentitySubstitutionCount !== SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT ||
    mapping.expectedManifestHashRefreshCount !== SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT || mapping.expectedNarrativeMentionCount !== SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT ||
    !Array.isArray(mapping.substitutions) || !Array.isArray(mapping.narrativeMentions)
  ) throw contractError("SOURCE_IDENTITY_MAPPING_INCOMPLETE: fixed descriptor drift");
  if (mapping.substitutions.length < SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT) throw contractError("SOURCE_IDENTITY_MAPPING_INCOMPLETE: substitution closure is incomplete");
  if (mapping.substitutions.length > SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT) throw contractError("SOURCE_IDENTITY_EXTRA_POINTER: substitution closure expanded");
  const physicalPaths = [...new Set(mapping.substitutions.map((row) => row.physicalPath))].sort(comparePosix);
  if (canonicalJson(physicalPaths) !== canonicalJson(SFCIM_EXPECTED_IDENTITY_PHYSICAL_PATHS)) throw contractError("SOURCE_IDENTITY_SIXTH_FILE_EXPANSION: five-file boundary drift");
  const substitutionKeys = mapping.substitutions.map(({ physicalPath, logicalPath, pointer }) => ({ physicalPath, logicalPath, pointer }));
  if (sha256Text(canonicalJson(substitutionKeys)) !== SFCIM_EXPECTED_SUBSTITUTION_KEY_HASH) throw contractError("SOURCE_IDENTITY_EXTRA_POINTER: exact pointer closure drift");
  if (sha256Text(canonicalJson(mapping.substitutions)) !== SFCIM_EXPECTED_SUBSTITUTION_CLOSURE_HASH) throw contractError("SOURCE_IDENTITY_WRONG_VALUE: exact identity value closure drift");
  if (mapping.narrativeMentions.length !== SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT || sha256Text(canonicalJson(mapping.narrativeMentions.map(({ physicalPath, pointer }) => ({ physicalPath, pointer })))) !== SFCIM_EXPECTED_NARRATIVE_KEY_HASH || sha256Text(canonicalJson(mapping.narrativeMentions)) !== SFCIM_EXPECTED_NARRATIVE_CLOSURE_HASH) {
    throw contractError("SOURCE_IDENTITY_NARRATIVE_MUTATION: narrative preservation closure drift");
  }
  if (manifest && declaration && (manifest.acceptedDeclarationId !== mapping.authorityDeclarationId || declaration.declarationId !== mapping.authorityDeclarationId)) {
    throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: mapping declaration id drift");
  }
  if (
    mapping.authorityDeclarationRef?.path !== SFCIM_AUTHORITY_DECLARATION_PATH ||
    mapping.authorityDeclarationRef?.schemaId !== "source-family-component-identity-authority-declaration.v0" || mapping.authorityDeclarationRef?.hashAlgorithm !== "sha256" ||
    mapping.authorityDeclarationRef?.sha256 !== await rawFileHash(path.join(cwd, SFCIM_AUTHORITY_DECLARATION_PATH)) ||
    mapping.authorityManifestRef?.path !== SFCIM_AUTHORITY_MANIFEST_PATH ||
    mapping.authorityManifestRef?.schemaId !== "source-family-component-identity-authority-manifest.v0" || mapping.authorityManifestRef?.hashAlgorithm !== "sha256" ||
    mapping.authorityManifestRef?.sha256 !== await rawFileHash(path.join(cwd, SFCIM_AUTHORITY_MANIFEST_PATH))
  ) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: mapping authority ref drift");
  const forbidden = firstForbiddenKey(mapping);
  if (forbidden) throw contractError(`SOURCE_IDENTITY_BOUNDARY_EXPANSION: forbidden descriptor field ${forbidden}`);
}

export async function assertIdentityPackage(cwd, identityPackage, manifest, declaration, mapping, normalization) {
  const forbiddenPackageKey = firstForbiddenKey(identityPackage);
  if (forbiddenPackageKey) throw contractError(`SOURCE_IDENTITY_BOUNDARY_EXPANSION: forbidden identity-package field ${forbiddenPackageKey}`);
  assertExactKeys(identityPackage, [
    "authorityDeclarationRef", "authorityManifestRef", "canAddAuthority", "compiler", "compilerRefs",
    "expectedIdentitySubstitutionCount", "expectedManifestHashRefreshCount", "expectedNarrativeMentionCount", "familySpecificModule",
    "identityPhysicalPaths", "manifestRefreshPointers", "mappingRef", "namespaceBaselineRefs", "namespaceEvidenceRef",
    "namespaceMappingRef", "namespaceNormalizer", "namespaceNormalizerRefs", "namespacePackageRef", "narrativeClosureHash",
    "p2CatalogRef", "p2EvidenceRef", "packageId", "proofImplementationRefs", "provenance", "runtimeRefs", "schemaId",
    "sourceRefs", "substitutionClosureHash", "substitutionKinds", "version"
  ], "identity package");
  assertExactKeyShape(identityPackage, SFCIM_IDENTITY_PACKAGE_KEY_SHAPE_HASH, "identity package");
  if (identityPackage?.schemaId !== "source-family-component-identity-package.v0" || identityPackage.version !== SFCIM_VERSION || identityPackage.packageId !== "team-button-to-button-fixed-identity-package") {
    throw contractError("SOURCE_IDENTITY_PACKAGE_HASH_MISMATCH: package identity drift");
  }
  for (const ref of [identityPackage.authorityManifestRef, identityPackage.authorityDeclarationRef]) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH");
  await assertRawRef(cwd, identityPackage.mappingRef, "SOURCE_IDENTITY_MAPPING_HASH_MISMATCH");
  for (const ref of [identityPackage.p2EvidenceRef, identityPackage.p2CatalogRef, identityPackage.namespaceEvidenceRef]) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_PACKAGE_HASH_MISMATCH");
  await assertRawRef(cwd, identityPackage.namespaceMappingRef, "SOURCE_IDENTITY_NAMESPACE_DESCRIPTOR_HASH_MISMATCH");
  await assertRawRef(cwd, identityPackage.namespacePackageRef, "SOURCE_IDENTITY_NAMESPACE_PACKAGE_HASH_MISMATCH");
  for (const ref of identityPackage.sourceRefs) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_SOURCE_HASH_MISMATCH");
  for (const ref of identityPackage.namespaceBaselineRefs) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_BASELINE_MISMATCH");
  for (const ref of identityPackage.namespaceNormalizerRefs) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_NAMESPACE_NORMALIZER_HASH_MISMATCH");
  for (const ref of [...identityPackage.compilerRefs, ...identityPackage.runtimeRefs, ...identityPackage.proofImplementationRefs]) await assertRawRef(cwd, ref, "SOURCE_IDENTITY_IMPLEMENTATION_HASH_MISMATCH");
  if (
    identityPackage.authorityManifestRef.path !== SFCIM_AUTHORITY_MANIFEST_PATH ||
    identityPackage.authorityManifestRef.schemaId !== "source-family-component-identity-authority-manifest.v0" ||
    identityPackage.authorityDeclarationRef.path !== SFCIM_AUTHORITY_DECLARATION_PATH ||
    identityPackage.authorityDeclarationRef.schemaId !== "source-family-component-identity-authority-declaration.v0" ||
    identityPackage.mappingRef.path !== SFCIM_MAPPING_PATH ||
    identityPackage.mappingRef.schemaId !== "source-family-component-identity-mapping.v0" ||
    identityPackage.namespaceMappingRef.path !== SFNM_MAPPING_PATH || identityPackage.namespacePackageRef.path !== SFNM_NAMESPACE_PACKAGE_PATH ||
    identityPackage.namespaceMappingRef.schemaId !== "source-family-namespace-mapping.v0" || identityPackage.namespacePackageRef.schemaId !== "source-family-namespace-package.v0" ||
    identityPackage.p2EvidenceRef.path !== SFCIM_P2_EVIDENCE_PATH || identityPackage.p2EvidenceRef.schemaId !== "design-system-ingestion-evidence.v0" ||
    identityPackage.p2CatalogRef.path !== SFCIM_P2_CATALOG_PATH || identityPackage.p2CatalogRef.schemaId !== "runtime-catalog.v0" ||
    identityPackage.namespaceEvidenceRef.path !== SFCIM_NAMESPACE_EVIDENCE_PATH || identityPackage.namespaceEvidenceRef.schemaId !== "source-family-namespace-mapping-evidence.v0" ||
    identityPackage.sourceRefs.length !== SFCIM_SOURCE_ENTRIES.length || identityPackage.namespaceBaselineRefs.length !== SFCIM_SOURCE_ENTRIES.length ||
    canonicalJson(identityPackage.sourceRefs.map((ref) => ref.path)) !== canonicalJson(SFCIM_SOURCE_ENTRIES.map((entry) => `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`)) ||
    canonicalJson(identityPackage.namespaceBaselineRefs.map((ref) => ref.path)) !== canonicalJson(SFCIM_SOURCE_ENTRIES.map((entry) => `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`)) ||
    canonicalJson(identityPackage.namespaceNormalizerRefs.map((ref) => ref.path)) !== canonicalJson(SFCIM_NAMESPACE_NORMALIZER_PATHS) ||
    canonicalJson(identityPackage.compilerRefs.map((ref) => ref.path)) !== canonicalJson(SFCIM_COMPILER_IMPLEMENTATION_PATHS) ||
    canonicalJson(identityPackage.runtimeRefs.map((ref) => ref.path)) !== canonicalJson(SFCIM_RUNTIME_DEPENDENCY_PATHS) ||
    canonicalJson(identityPackage.proofImplementationRefs.map((ref) => ref.path)) !== canonicalJson(SFCIM_PROOF_IMPLEMENTATION_PATHS) ||
    identityPackage.sourceRefs.some((ref, index) => ref.schemaId !== (index === 0 ? "declared-source-manifest.v0" : index === 11 ? "source-authority-profile.v0" : "declared-source-document.v0")) ||
    identityPackage.namespaceBaselineRefs.some((ref, index) => ref.schemaId !== (index === 0 ? "declared-source-manifest.v0" : index === 11 ? "source-authority-profile.v0" : "declared-source-document.v0")) ||
    [...identityPackage.namespaceNormalizerRefs, ...identityPackage.compilerRefs, ...identityPackage.runtimeRefs, ...identityPackage.proofImplementationRefs].some((ref) => ref.schemaId !== null) ||
    identityPackage.expectedIdentitySubstitutionCount !== normalization.totalIdentitySubstitutionCount ||
    identityPackage.expectedManifestHashRefreshCount !== normalization.totalManifestHashRefreshCount ||
    identityPackage.expectedNarrativeMentionCount !== normalization.totalNarrativeMentionCount ||
    identityPackage.expectedIdentitySubstitutionCount !== SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT ||
    identityPackage.expectedManifestHashRefreshCount !== SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT ||
    identityPackage.expectedNarrativeMentionCount !== SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT ||
    identityPackage.compiler?.runtime?.engine !== "node" || identityPackage.compiler?.runtime?.major !== 22 || identityPackage.compiler?.unchanged !== true ||
    identityPackage.namespaceNormalizer?.exportedFunction !== "normalizeNamespacedBundle" || identityPackage.namespaceNormalizer?.unchanged !== true ||
    identityPackage.provenance?.generatedAt !== SFCIM_TIMESTAMP || identityPackage.provenance?.environment?.generatedAt !== SFCIM_TIMESTAMP ||
    identityPackage.provenance?.environment?.host !== null || identityPackage.provenance?.producer !== "product-design-system-owners" ||
    identityPackage.provenance?.role !== "immutable-component-identity-proof-input" ||
    identityPackage.canAddAuthority !== false || identityPackage.familySpecificModule !== null
  ) throw contractError("SOURCE_IDENTITY_PACKAGE_HASH_MISMATCH: package closure drift");
  const refreshPointers = normalization.entries.flatMap((entry) => entry.manifestHashRefreshes.map((refresh) => refresh.pointer));
  const identityPhysicalPaths = [...new Set(mapping.substitutions.map((row) => row.physicalPath))].sort(comparePosix);
  const bareIdentityCount = mapping.substitutions.filter((row) => row.from === "TeamButton").length;
  const catalogUriCount = mapping.substitutions.filter((row) => row.from === "catalog://p2/components/TeamButton").length;
  const catalogPointerCount = mapping.substitutions.length - bareIdentityCount - catalogUriCount;
  if (
    canonicalJson(identityPackage.manifestRefreshPointers) !== canonicalJson(SFCIM_EXPECTED_MANIFEST_REFRESH_POINTERS) ||
    canonicalJson(refreshPointers) !== canonicalJson(SFCIM_EXPECTED_MANIFEST_REFRESH_POINTERS) ||
    canonicalJson(identityPackage.identityPhysicalPaths) !== canonicalJson(SFCIM_EXPECTED_IDENTITY_PHYSICAL_PATHS) ||
    canonicalJson(identityPhysicalPaths) !== canonicalJson(SFCIM_EXPECTED_IDENTITY_PHYSICAL_PATHS) ||
    identityPackage.substitutionKinds?.bareComponentIds !== 6 || identityPackage.substitutionKinds?.catalogPointers !== 15 || identityPackage.substitutionKinds?.catalogUris !== 1 ||
    bareIdentityCount !== 6 || catalogPointerCount !== 15 || catalogUriCount !== 1 ||
    identityPackage.substitutionClosureHash !== sha256Text(canonicalJson(mapping.substitutions)) ||
    identityPackage.narrativeClosureHash !== sha256Text(canonicalJson(mapping.narrativeMentions))
  ) throw contractError("SOURCE_IDENTITY_PACKAGE_HASH_MISMATCH: identity row closure drift");
  if (identityPackage.mappingRef.hash !== sha256Text(`${canonicalJson(mapping)}\n`) && identityPackage.mappingRef.hash !== sha256Text(canonicalJson(mapping))) {
    throw contractError("SOURCE_IDENTITY_MAPPING_HASH_MISMATCH: package mapping ref drift");
  }
  if (manifest.acceptedDeclarationId !== declaration.declarationId) throw contractError("SOURCE_IDENTITY_AUTHORITY_HASH_MISMATCH: package authority drift");
}

export function buildSourceFamilyComponentIdentityMappingSchemas(immutable) {
  return {
    "source-family-component-identity-authority-manifest.v0.schema.json": constSchema("source-family-component-identity-authority-manifest.v0", immutable.authorityManifest),
    "source-family-component-identity-authority-declaration.v0.schema.json": constSchema("source-family-component-identity-authority-declaration.v0", immutable.authorityDeclaration),
    "source-family-component-identity-mapping.v0.schema.json": constSchema("source-family-component-identity-mapping.v0", immutable.mapping),
    "source-family-component-identity-package.v0.schema.json": constSchema("source-family-component-identity-package.v0", immutable.identityPackage),
    "source-family-component-identity-mapping-receipt.v0.schema.json": receiptSchema(immutable.normalization),
    "source-family-component-identity-mapping-fixture.v0.schema.json": fixtureSchema("source-family-component-identity-mapping-fixture.v0"),
    "source-family-component-identity-mapping-preflight-mutation.v0.schema.json": fixtureSchema("source-family-component-identity-mapping-preflight-mutation.v0"),
    "source-family-component-identity-mapping-expectations.v0.schema.json": expectationsSchema(),
    "source-family-component-identity-mapping-diagnostics.v0.schema.json": diagnosticsSchema(),
    "source-family-component-identity-mapping-report.v0.schema.json": reportSchema(),
    "source-family-component-identity-mapping-evidence.v0.schema.json": evidenceSchema()
  };
}

export function buildSourceFamilyComponentIdentityMappingFixtures(identityPackage) {
  const fixtures = {
    "expectations.manifest.json": {
      schemaId: "source-family-component-identity-mapping-expectations.v0",
      version: SFCIM_VERSION,
      identityPackageRef: artifactRef(SFCIM_IDENTITY_PACKAGE_PATH, "source-family-component-identity-package.v0", null),
      expectations: deepClone(SFCIM_EXPECTATION_ROWS)
    }
  };
  for (const row of SFCIM_EXPECTATION_ROWS) {
    fixtures[row.fixturePath] = {
      schemaId: row.fixturePath.includes("preflight") ? "source-family-component-identity-mapping-preflight-mutation.v0" : "source-family-component-identity-mapping-fixture.v0",
      version: SFCIM_VERSION,
      fixtureId: path.posix.basename(row.fixturePath, ".json"),
      kind: row.kind,
      mutation: fixtureMutation(row.fixturePath),
      expectedDiagnosticCodes: deepClone(row.diagnosticCodes),
      identityPackageId: identityPackage.packageId
    };
  }
  return fixtures;
}

export function identityMappedArtifactMappings() {
  return SFCIM_CAPTURED_ARTIFACTS.map(([persistedFile, , innerFile]) => ({
    logicalPath: `${SC_ARTIFACT_ROOT}/${innerFile}`,
    persistedPath: `${SFCIM_ARTIFACT_ROOT}/${persistedFile}`
  }));
}

export function identityMappedEvidenceRemap(mappingRef) {
  return {
    logicalSourceRoot: SC_SOURCE_ROOT,
    physicalSourceRoot: SFCIM_SOURCE_ROOT,
    mappingRef,
    artifactMappings: identityMappedArtifactMappings(),
    verifiedAfterTemporaryWorkspaceRemoval: true
  };
}

export function artifactRef(artifactPath, schemaId, hash) {
  return { path: artifactPath, schemaId, hashAlgorithm: "sha256", hash };
}

export function provenance(name, inputRefs) {
  return {
    generatedAt: SFCIM_TIMESTAMP,
    environment: { ...SFCIM_ENVIRONMENT, pathStyle: "posix-relative" },
    generator: { name, version: SFCIM_VERSION },
    role: "generated-artifact",
    inputRefs: [...inputRefs]
  };
}

function diagnostic(code, message, stage, phase, severity, promotionStatus, validationResult, fixtureCoverage) {
  return { code, message, stage, phase, severity, promotionStatus, validationResult, fixtureCoverage };
}

function expectation(fixturePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes) {
  return { fixturePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes };
}

function fixtureMutation(fixturePath) {
  const id = path.posix.basename(fixturePath).replace(".source-family-component-identity-mapping-preflight.json", "").replace(".source-family-component-identity-mapping.json", "");
  const simple = (target, operation, mutationPath, value) => ({ target, operation, path: mutationPath, value, changes: [] });
  const ordered = (target, changes) => ({ target, operation: "ordered-changes", path: null, value: null, changes });
  const change = (caseId, operation, mutationPath, value, expectedDiagnosticCode = null) => ({ caseId, operation, path: mutationPath, value, expectedDiagnosticCode });
  switch (id) {
    case "accepted-team-button": return null;
    case "declaration-review-required": return ordered("authority-declaration", [
      change("status", "replace-json", "/status", "review_required"),
      change("normalization", "replace-json", "/normalizationAllowed", false),
      change("review-status", "replace-json", "/review/status", "review_required")
    ]);
    case "authority-boundary-expansion": return simple("authority-declaration", "add-json", "/requestedComponentIds", ["OtherComponent"]);
    case "nested-authority-boundary-expansion": return simple("authority-declaration", "add-json", "/acceptedTarget/capabilities", ["OtherComponent"]);
    case "package-boundary-expansion": return simple("identity-package", "add-json", "/actions", ["execute"]);
    case "missing-p2-evidence": return simple("p2-evidence", "remove-file", SFCIM_P2_EVIDENCE_PATH, null);
    case "nonpass-p2-evidence": return simple("p2-evidence", "replace-json", "/status", "fail");
    case "tampered-p2-evidence": return simple("p2-evidence", "replace-json", "/command", "tampered-p2-command");
    case "missing-namespace-evidence": return simple("namespace-evidence", "remove-file", SFCIM_NAMESPACE_EVIDENCE_PATH, null);
    case "nonpass-namespace-evidence": return simple("namespace-evidence", "replace-json", "/status", "fail");
    case "tampered-namespace-evidence": return simple("namespace-evidence", "replace-json", "/command", "tampered-namespace-command");
    case "authority-hash-mismatch": return simple("component-identity-mapping", "replace-json", "/authorityDeclarationRef/sha256", "0".repeat(64));
    case "mapping-hash-mismatch": return simple("identity-package", "replace-json", "/mappingRef/hash", "0".repeat(64));
    case "identity-package-hash-mismatch": return simple("identity-package", "replace-json", "/packageId", "team-button-to-button-tampered-package");
    case "source-hash-mismatch": return simple("identity-package", "replace-json", "/sourceRefs/0/hash", "0".repeat(64));
    case "skipped-substitution": return simple("component-identity-mapping", "remove-json", "/substitutions/21", null);
    case "reversed-mapping": return ordered("component-identity-mapping", [
      change("from", "replace-json", "/fromComponentId", "Button"), change("to", "replace-json", "/toComponentId", "TeamButton")
    ]);
    case "baseline-bypass": return simple("stage-workspace", "prepopulate-root", SFNM_SOURCE_ROOT, "accepted-namespace-baseline");
    case "intermediate-output-tamper": return simple("stage-workspace", "append-text", `${SFNM_SOURCE_ROOT}/ui/button-source-a.json`, " ");
    case "identity-stage-skipped": return simple("stage-chain", "remove-json", "/orderedStages/0", null);
    case "namespace-stage-skipped": return simple("stage-chain", "remove-json", "/orderedStages/1", null);
    case "stage-order-reversed": return simple("stage-chain", "replace-json", "/orderedStages", ["source-conformance-compile", "namespace-normalization", "component-identity"]);
    case "wrong-value": return simple("component-identity-mapping", "replace-json", "/substitutions/0/from", "/components/WrongTeamButton/accessibility/role");
    case "extra-pointer": return simple("component-identity-mapping", "add-json", "/substitutions/-", { from: "TeamButton", logicalPath: "components/in-line-alert.json", physicalPath: "ui/inline-notice.json", pointer: "/notes", to: "Button" });
    case "narrative-field": return simple("component-identity-mapping", "replace-json", "/narrativeMentions/0/value", "Changed narrative text is forbidden.");
    case "sixth-file": return simple("component-identity-mapping", "replace-json", "/substitutions/0/physicalPath", "ui/inline-notice.json");
    case "namespace-descriptor-hash-mismatch": return simple("namespace-mapping", "replace-json", "/mappingId", "tampered-namespace-mapping");
    case "namespace-package-hash-mismatch": return simple("namespace-package", "replace-json", "/expectedSubstitutionCount", 77);
    case "namespace-normalizer-hash-mismatch": return simple("identity-package", "replace-json", "/namespaceNormalizerRefs/0/hash", "0".repeat(64));
    case "implementation-hash-mismatch": return simple("identity-package", "replace-json", "/proofImplementationRefs/0/hash", "0".repeat(64));
    case "boundary-expansion": return simple("component-identity-mapping", "add-json", "/actions", ["execute"]);
    case "compiler-run-failed": return simple("stage-workspace", "remove-file", `${SC_SOURCE_ROOT}/components/button.json`, null);
    case "inner-evidence-invalid": return simple("persisted-inner-artifact", "replace-json", "identity-mapped-source-inventory.json#/sourceFileRefs/0/hash", "0".repeat(64));
    case "source-fact-authority-escalation": return simple("compiler-source", "append-array-value", "components/button.json#/facts/0/value", "expressive");
    case "evidence-hash-mismatch": return ordered("final-evidence", [
      change("artifact-ref", "replace-json", "/artifacts/0/hash", "0".repeat(64), "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH"),
      change("ordered-remap", "replace-json", "/identityMappedEvidenceRemap/artifactMappings/0/persistedPath", `${SFCIM_ARTIFACT_ROOT}/substituted.json`, "SOURCE_IDENTITY_INNER_EVIDENCE_INVALID"),
      change("self-hash", "replace-json", "/runId", "0".repeat(64), "SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH")
    ]);
    default: throw new Error(`SOURCE_IDENTITY_EVIDENCE_HASH_MISMATCH: missing fixture mutation payload for ${fixturePath}`);
  }
}

function constSchema(id, value) {
  return { $schema: "https://json-schema.org/draft/2020-12/schema", $id: `https://surfaces.local/schemas/${id}.schema.json`, title: id, const: deepClone(value) };
}

function receiptSchema(normalization) {
  return closedSchema("source-family-component-identity-mapping-receipt.v0", {
    schemaId: { const: "source-family-component-identity-mapping-receipt.v0" }, version: { const: SFCIM_VERSION }, status: { const: "pass" },
    authorityManifestRef: strictRef(), authorityDeclarationRef: strictRef(), identityPackageRef: strictRef(), mappingRef: strictRef(), namespaceReceiptRef: strictRef(),
    physicalSourceRoot: { const: SFCIM_SOURCE_ROOT }, namespaceSourceRoot: { const: SFNM_SOURCE_ROOT },
    fromComponentId: { const: "TeamButton" }, toComponentId: { const: "Button" }, relationKind: { const: "component-identity" }, scope: { const: "component-identity-only" },
    entryCount: { const: 12 }, entries: { const: deepClone(normalization.entries) },
    totalIdentitySubstitutionCount: { const: SFCIM_EXPECTED_IDENTITY_SUBSTITUTION_COUNT }, totalManifestHashRefreshCount: { const: SFCIM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT },
    totalNarrativeMentionCount: { const: SFCIM_EXPECTED_NARRATIVE_MENTION_COUNT }, narrativeMentionsPreserved: { const: true }, acceptedNamespaceBaselineMatched: { const: true }, canAddAuthority: { const: false },
    stageChain: stageChainSchema(normalization), provenance: strictProvenance()
  });
}

function fixtureSchema(id) {
  return closedSchema(id, {
    schemaId: { const: id }, version: { const: SFCIM_VERSION }, fixtureId: { type: "string", minLength: 1 },
    kind: { enum: ["valid", "review", "mutation"] }, mutation: mutationPayloadSchema(),
    expectedDiagnosticCodes: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
    identityPackageId: { const: "team-button-to-button-fixed-identity-package" }
  });
}

function mutationPayloadSchema() {
  const operations = ["replace-json", "add-json", "remove-json", "remove-file", "prepopulate-root", "append-text", "append-array-value", "ordered-changes"];
  const targets = ["authority-declaration", "p2-evidence", "namespace-evidence", "component-identity-mapping", "identity-package", "stage-workspace", "stage-chain", "namespace-mapping", "namespace-package", "persisted-inner-artifact", "compiler-source", "final-evidence"];
  const change = { type: "object", additionalProperties: false, required: ["caseId", "operation", "path", "value", "expectedDiagnosticCode"], properties: {
    caseId: { type: "string", minLength: 1 }, operation: { enum: operations.filter((entry) => entry !== "ordered-changes") }, path: { type: "string", minLength: 1 }, value: {}, expectedDiagnosticCode: { type: ["string", "null"] }
  } };
  return { oneOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["target", "operation", "path", "value", "changes"], properties: {
    target: { enum: targets }, operation: { enum: operations }, path: { type: ["string", "null"] }, value: {}, changes: { type: "array", items: change }
  } }] };
}

function expectationsSchema() {
  return closedSchema("source-family-component-identity-mapping-expectations.v0", {
    schemaId: { const: "source-family-component-identity-mapping-expectations.v0" }, version: { const: SFCIM_VERSION },
    identityPackageRef: strictRef(true), expectations: { const: deepClone(SFCIM_EXPECTATION_ROWS) }
  });
}

function diagnosticsSchema() {
  return closedSchema("source-family-component-identity-mapping-diagnostics.v0", {
    schemaId: { const: "source-family-component-identity-mapping-diagnostics.v0" }, version: { const: SFCIM_VERSION }, diagnostics: { const: deepClone(SFCIM_DIAGNOSTIC_ROWS) }
  });
}

function stageChainSchema(normalization = null) {
  if (normalization) {
    const rows = normalization.entries.map((entry) => ({ physicalPath: `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`, logicalPath: `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`, hash: entry.normalizedSha256 }));
    return { const: { orderedStages: ["component-identity", "namespace-normalization", "source-conformance-compile"], namespaceInputRoot: SFNM_SOURCE_ROOT, namespaceInputMaterializedByIdentityStage: true, acceptedNamespaceBaselineCopiedAsInput: false, identityOutputHashes: rows, namespaceInputHashes: deepClone(rows), hashCausalityVerified: true, namespaceNormalizerReused: true, compilerReused: true } };
  }
  const hashRows = { type: "array", minItems: 12, maxItems: 12, prefixItems: SFCIM_SOURCE_ENTRIES.map((entry) => ({
    type: "object", additionalProperties: false, required: ["physicalPath", "logicalPath", "hash"],
    properties: { physicalPath: { const: `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}` }, logicalPath: { const: `${SFNM_SOURCE_ROOT}/${entry.physicalPath}` }, hash: { type: "string", pattern: "^[a-f0-9]{64}$" } }
  })), items: false };
  return { type: "object", additionalProperties: false, required: ["orderedStages", "namespaceInputRoot", "namespaceInputMaterializedByIdentityStage", "acceptedNamespaceBaselineCopiedAsInput", "identityOutputHashes", "namespaceInputHashes", "hashCausalityVerified", "namespaceNormalizerReused", "compilerReused"], properties: {
    orderedStages: { const: ["component-identity", "namespace-normalization", "source-conformance-compile"] }, identityOutputHashes: hashRows, namespaceInputHashes: deepClone(hashRows),
    namespaceInputRoot: { const: SFNM_SOURCE_ROOT }, namespaceInputMaterializedByIdentityStage: { const: true }, acceptedNamespaceBaselineCopiedAsInput: { const: false },
    hashCausalityVerified: { const: true }, namespaceNormalizerReused: { const: true }, compilerReused: { const: true }
  } };
}

function remapSchema() {
  return { type: "object", additionalProperties: false, required: ["logicalSourceRoot", "physicalSourceRoot", "mappingRef", "artifactMappings", "verifiedAfterTemporaryWorkspaceRemoval"], properties: {
    logicalSourceRoot: { const: SC_SOURCE_ROOT }, physicalSourceRoot: { const: SFCIM_SOURCE_ROOT }, mappingRef: strictRef(),
    artifactMappings: { const: identityMappedArtifactMappings() }, verifiedAfterTemporaryWorkspaceRemoval: { const: true }
  } };
}

function reportSchema() {
  return closedSchema("source-family-component-identity-mapping-report.v0", {
    schemaId: { const: "source-family-component-identity-mapping-report.v0" }, version: { const: SFCIM_VERSION }, runId: { type: "string", pattern: "^[a-f0-9]{64}$" }, command: { const: SFCIM_COMMAND },
    status: { const: "pass" }, promotionStatus: { const: "review_required" },
    refs: { type: "object", additionalProperties: false, required: ["authorityManifestRef", "authorityDeclarationRef", "identityPackageRef", "mappingRef", "namespaceMappingRef", "namespacePackageRef", "namespaceEvidenceRef"], properties: { authorityManifestRef: strictRef(), authorityDeclarationRef: strictRef(), identityPackageRef: strictRef(), mappingRef: strictRef(), namespaceMappingRef: strictRef(), namespacePackageRef: strictRef(), namespaceEvidenceRef: strictRef() } },
    stageChain: stageChainSchema(),
    authorityDecision: { type: "object", additionalProperties: false, required: ["declarationId", "status", "owner", "normalizationAllowed", "canAddAuthority"], properties: { declarationId: { const: "team-button-to-button" }, status: { const: "accepted" }, owner: { const: "product-design-system-owners" }, normalizationAllowed: { const: true }, canAddAuthority: { const: false } } },
    baselineComparison: { type: "object", additionalProperties: false, required: ["acceptedNamespaceInputsMatched", "capturedArtifactsExact", "narrativeMentionsPreserved", "reviewSemanticsPreserved"], properties: { acceptedNamespaceInputsMatched: { const: true }, capturedArtifactsExact: { const: true }, narrativeMentionsPreserved: { const: true }, reviewSemanticsPreserved: { const: true } } },
    authorityExpansionProbe: { type: "object", additionalProperties: false, required: ["baselineVerified", "mutationIsolated", "innerDiagnosticCode", "compilerExitCode", "checkedInputsUnchanged", "baselineArtifactsUnchanged"], properties: { baselineVerified: { const: true }, mutationIsolated: { const: true }, innerDiagnosticCode: { const: "SOURCE_FACT_AUTHORITY_ESCALATION" }, compilerExitCode: { const: 1 }, checkedInputsUnchanged: { const: true }, baselineArtifactsUnchanged: { const: true } } },
    validationResults: validationResultsSchema(), diagnostics: diagnosticsArraySchema(), provenance: strictProvenance()
  });
}

function evidenceSchema() {
  return closedSchema("source-family-component-identity-mapping-evidence.v0", {
    schemaId: { const: "source-family-component-identity-mapping-evidence.v0" }, contractId: { const: SFCIM_CONTRACT_ID }, version: { const: SFCIM_VERSION }, runId: { type: "string", pattern: "^[a-f0-9]{64}$" },
    command: { const: SFCIM_COMMAND }, arguments: { const: componentIdentityArgumentVector() }, checkedAt: { const: SFCIM_TIMESTAMP }, status: { const: "pass" }, promotionStatus: { const: "review_required" }, environment: { const: SFCIM_ENVIRONMENT },
    authorityManifestRef: strictRef(), authorityDeclarationRef: strictRef(), identityPackageRef: strictRef(), mappingRef: strictRef(), namespaceMappingRef: strictRef(), namespacePackageRef: strictRef(),
    sourceFileRefs: orderedRefsSchema(SFCIM_SOURCE_ENTRIES.map((entry) => `${SFCIM_SOURCE_ROOT}/${entry.physicalPath}`)),
    namespaceNormalizerRefs: orderedRefsSchema(SFCIM_NAMESPACE_NORMALIZER_PATHS), compilerRefs: orderedRefsSchema(SFCIM_COMPILER_IMPLEMENTATION_PATHS),
    proofImplementationRefs: orderedRefsSchema(SFCIM_PROOF_IMPLEMENTATION_PATHS), runtimeRefs: orderedRefsSchema(SFCIM_RUNTIME_DEPENDENCY_PATHS),
    fixtureRefs: orderedRefsSchema(sfcimFixturePaths()), boundaryRefs: orderedRefsSchema([SFCIM_P2_EVIDENCE_PATH, SFCIM_P2_CATALOG_PATH, SFCIM_NAMESPACE_EVIDENCE_PATH]),
    schemaClosure: orderedRefsSchema(sfcimSchemaPaths()), artifacts: orderedRefsSchema(SFCIM_ARTIFACT_PATHS), stageChain: stageChainSchema(), diagnostics: diagnosticsArraySchema(), validationResults: validationResultsSchema(),
    identityMappedEvidenceRemap: remapSchema(), identityMappedEvidenceClosureVerified: { const: true }, provenance: strictProvenance()
  });
}

function closedSchema(id, properties) {
  return { $schema: "https://json-schema.org/draft/2020-12/schema", $id: `https://surfaces.local/schemas/${id}.schema.json`, title: id, type: "object", additionalProperties: false, required: Object.keys(properties), properties };
}

function strictRef(allowNullHash = false) {
  return { type: "object", additionalProperties: false, required: ["path", "schemaId", "hashAlgorithm", "hash"], properties: {
    path: { type: "string", minLength: 1 }, schemaId: { type: ["string", "null"] }, hashAlgorithm: { const: "sha256" }, hash: allowNullHash ? { type: ["string", "null"], pattern: "^[a-f0-9]{64}$" } : { type: "string", pattern: "^[a-f0-9]{64}$" }
  } };
}

function refArray(minItems, maxItems) { return { type: "array", minItems, ...(maxItems ? { maxItems } : {}), items: strictRef() }; }
function orderedRefsSchema(paths) {
  return { type: "array", minItems: paths.length, maxItems: paths.length, prefixItems: paths.map((artifactPath) => ({
    type: "object", additionalProperties: false, required: ["path", "schemaId", "hashAlgorithm", "hash"], properties: {
      path: { const: artifactPath }, schemaId: { const: sfcimSchemaIdForPath(artifactPath) }, hashAlgorithm: { const: "sha256" }, hash: { type: "string", pattern: "^[a-f0-9]{64}$" }
    }
  })), items: false };
}
function diagnosticsArraySchema() { return { type: "array", items: { type: "object", additionalProperties: false, required: ["code", "message", "stage", "phase", "severity", "promotionStatus", "validationResult", "fixtureCoverage"], properties: { code: { type: "string" }, message: { type: "string" }, stage: { type: "string" }, phase: { type: "string" }, severity: { enum: ["error", "review"] }, promotionStatus: { enum: ["blocked", "review_required"] }, validationResult: { enum: ["invalid", "review_required"] }, fixtureCoverage: { type: "string" } } } }; }
function validationResultsSchema() { return { type: "array", minItems: SFCIM_EXPECTATION_ROWS.length, maxItems: SFCIM_EXPECTATION_ROWS.length, items: { type: "object", additionalProperties: false, required: ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "matched"], properties: { fixturePath: { type: "string" }, kind: { enum: ["valid", "review", "mutation"] }, stage: { type: "string" }, phase: { type: "string" }, expectedResult: { enum: ["valid", "review_required", "invalid"] }, actualResult: { enum: ["valid", "review_required", "invalid"] }, promotionStatus: { enum: ["allowed", "review_required", "blocked"] }, diagnosticCodes: { type: "array", items: { type: "string" } }, matched: { const: true } } } }; }
function strictProvenance() { return { type: "object", additionalProperties: false, required: ["generatedAt", "environment", "generator", "role", "inputRefs"], properties: { generatedAt: { const: SFCIM_TIMESTAMP }, environment: { type: "object", additionalProperties: false, required: ["generatedAt", "host", "pathStyle"], properties: { generatedAt: { const: SFCIM_TIMESTAMP }, host: { const: null }, pathStyle: { const: "posix-relative" } } }, generator: { type: "object", additionalProperties: false, required: ["name", "version"], properties: { name: { type: "string" }, version: { const: SFCIM_VERSION } } }, role: { const: "generated-artifact" }, inputRefs: { type: "array", items: { type: "string" } } } }; }

function firstForbiddenKey(value, pointer = "") {
  const forbidden = new Set(["regex", "replacement", "parser", "selector", "plugin", "merge", "default", "transform", "jsonPath", "callback", "requestedComponentIds", "requestedFacts", "requestedPolicies", "requestedReviewRoutes", "authorityScopes", "actions", "arbitraryNamespace", "arbitraryLayout", "allowBaselineBypass"]);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = firstForbiddenKey(value[index], `${pointer}/${index}`);
      if (found) return found;
    }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (forbidden.has(key)) return `${pointer}/${key}`;
      const found = firstForbiddenKey(child, `${pointer}/${key}`);
      if (found) return found;
    }
  }
  return null;
}

function assertClosedAuthorityKeys(manifest, declaration) {
  const forbiddenManifestKey = firstForbiddenKey(manifest);
  const forbiddenDeclarationKey = firstForbiddenKey(declaration);
  if (forbiddenManifestKey || forbiddenDeclarationKey) {
    throw contractError(`SOURCE_IDENTITY_BOUNDARY_EXPANSION: forbidden authority field ${forbiddenManifestKey || forbiddenDeclarationKey}`);
  }
  assertExactKeys(manifest, [
    "acceptedDeclarationId", "authorityId", "declarationRefs", "expectedIdentitySubstitutionCount",
    "expectedManifestHashRefreshCount", "expectedNarrativeMentionCount", "owner", "provenance", "relationKind", "review",
    "schemaId", "scope", "sourceBundleManifestRef", "sourceBundleRoot", "sourceRef", "validity", "version"
  ], "authority manifest");
  assertExactKeys(declaration, [
    "acceptedTarget", "bundleManifestRef", "canAddAuthority", "coveredSourceRefs", "declarationId", "executable",
    "fromComponentId", "normalizationAllowed", "owner", "policyRefs", "provenance", "rationale", "relationKind", "review",
    "reviewRefs", "schemaId", "scope", "sourceRef", "sourceRefClosure", "status", "toComponentId", "validity", "version"
  ], "authority declaration");
  assertExactKeyShape(manifest, SFCIM_AUTHORITY_MANIFEST_KEY_SHAPE_HASH, "authority manifest");
  assertExactKeyShape(declaration, SFCIM_AUTHORITY_DECLARATION_KEY_SHAPE_HASH, "authority declaration");
}

function assertExactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || canonicalJson(Object.keys(value).sort(comparePosix)) !== canonicalJson([...expectedKeys].sort(comparePosix))) {
    throw contractError(`SOURCE_IDENTITY_BOUNDARY_EXPANSION: ${label} key closure drift`);
  }
}

function assertExactKeyShape(value, expectedHash, label) {
  if (sha256Text(canonicalJson(keyShapeRows(value))) !== expectedHash) {
    throw contractError(`SOURCE_IDENTITY_BOUNDARY_EXPANSION: ${label} nested key closure drift`);
  }
}

function keyShapeRows(value, pointer = "") {
  const rows = [];
  if (Array.isArray(value)) {
    rows.push({ pointer, kind: "array", length: value.length });
    for (let index = 0; index < value.length; index += 1) rows.push(...keyShapeRows(value[index], `${pointer}/${index}`));
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value).sort(comparePosix);
    rows.push({ pointer, kind: "object", keys });
    for (const key of keys) rows.push(...keyShapeRows(value[key], `${pointer}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`));
  }
  return rows;
}

async function assertRawRef(cwd, ref, code) {
  const expectedHash = ref?.sha256 ?? ref?.hash;
  if (!ref || typeof ref.path !== "string" || ref.hashAlgorithm !== "sha256" || typeof expectedHash !== "string") throw contractError(`${code}: malformed artifact ref`);
  let actual;
  try { actual = await rawFileHash(path.join(cwd, ref.path)); } catch { throw contractError(`${code}: missing ${ref.path}`); }
  if (actual !== expectedHash) throw contractError(`${code}: ${ref.path}`);
}

async function listRegularFiles(root) {
  const output = [];
  async function walk(current, prefix) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw contractError(`SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: symlink ${prefix}${entry.name}`);
      const child = path.join(current, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(child, relative);
      else if (entry.isFile()) {
        const stat = await fs.stat(child);
        if (stat.nlink !== 1) throw contractError(`SOURCE_IDENTITY_SOURCE_HASH_MISMATCH: hardlink ${relative}`);
        output.push(relative);
      }
    }
  }
  await walk(root, "");
  return output.sort(comparePosix);
}

function getJsonPointer(value, pointer) {
  if (pointer === "") return value;
  return pointer.slice(1).split("/").map(unescapePointer).reduce((current, segment) => current?.[segment], value);
}

export function setJsonPointer(value, pointer, replacement) {
  const segments = pointer.slice(1).split("/").map(unescapePointer);
  const key = segments.pop();
  const parent = segments.reduce((current, segment) => current?.[segment], value);
  if (!parent || !(key in parent)) throw contractError(`SOURCE_IDENTITY_MAPPING_INCOMPLETE: invalid pointer ${pointer}`);
  parent[key] = replacement;
}

function unescapePointer(value) { return value.replaceAll("~1", "/").replaceAll("~0", "~"); }
function sha256Text(value) { return createHash("sha256").update(value).digest("hex"); }
function comparePosix(left, right) { return left.localeCompare(right, "en", { sensitivity: "variant" }); }
function contractError(message) { const error = new Error(message); error.exitCode = 1; return error; }
