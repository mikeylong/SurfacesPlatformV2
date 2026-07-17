import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { canonicalJson } from "./p0.js";
import {
  canonicalFileHash,
  deepClone,
  rawFileHash,
  readJson,
  writeCanonicalJson
} from "./p2-contract.js";
import {
  SC_ARTIFACT_ROOT,
  SC_CONSUMED_SCHEMA_FILES,
  SC_SCHEMA_FILES,
  SC_SOURCE_ROOT
} from "./source-conformance-contract.js";
import {
  SFLM_ARTIFACT_ROOT,
  SFLM_CAPTURED_ARTIFACTS,
  SFLM_COMPILER_IMPLEMENTATION_PATHS,
  SFLM_LAYOUT_ENTRIES,
  SFLM_PHYSICAL_SOURCE_ROOT,
  SFLM_RUNTIME_DEPENDENCY_PATHS,
  SFLM_SCHEMA_FILES,
  SFLM_CONSUMED_SCHEMA_FILES
} from "./source-family-layout-mapping-contract.js";

export const SFNM_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SFNM_VERSION = "0.0.0";
export const SFNM_SCHEMA_ROOT = "schemas";
export const SFNM_FIXTURE_ROOT = "fixtures/source-family-namespace-mapping";
export const SFNM_NAMESPACE_PACKAGE_PATH = `${SFNM_FIXTURE_ROOT}/namespace-package.fixture.json`;
export const SFNM_SOURCE_ROOT = "sources/source-family-namespace-mapping/team-owned-namespaced-bundle";
export const SFNM_MAPPING_PATH = "sources/source-family-namespace-mapping/namespace-mapping.json";
export const SFNM_ARTIFACT_ROOT = "artifacts/source-family-namespace-mapping";
export const SFNM_COMMAND = "interfacectl surfaces source-family-namespace-mapping proof";
export const SFNM_CONTRACT_ID = "surfaces-source-family-namespace-mapping-proof";
export const SFNM_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SFNM_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const SFNM_LAYOUT_EVIDENCE_PATH = `${SFLM_ARTIFACT_ROOT}/evidence.json`;
export const SFNM_ALTERNATE_NAMESPACE = "declared-source://product-team-authority/";
export const SFNM_CANONICAL_NAMESPACE = "declared-source://source-conformance/";
export const SFNM_EXPECTED_SUBSTITUTION_COUNT = 78;
export const SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT = 11;

const SFNM_FORBIDDEN_MAPPING_KEYS = new Set([
  "regex", "replacement", "replacements", "parser", "parsers", "selector", "selectors",
  "plugin", "plugins", "merge", "merges", "default", "defaults", "transform", "transforms",
  "jsonPath", "jsonPaths", "callback", "callbacks", "components", "componentIds",
  "requestedComponentIds", "facts", "requestedFacts", "policies", "requestedPolicies",
  "reviewRoutes", "requestedReviewRoutes", "authorityScopes", "actions"
]);
const SFNM_REFERENCE_SUFFIX_PATTERN = "(?:(?:components|policies|governance)/[a-z0-9-]+\\.json#/(?:(?:[A-Za-z0-9._-]|~[01])+(?:/(?:[A-Za-z0-9._-]|~[01])+)*)?|<posix-path>#<rfc6901-json-pointer>)";
const SFNM_REFERENCE_SUFFIX_REGEX = new RegExp(`^${SFNM_REFERENCE_SUFFIX_PATTERN}$`);

export const SFNM_ENVIRONMENT = Object.freeze({ generatedAt: SFNM_TIMESTAMP, host: null });

export const SFNM_SCHEMA_FILES = [
  "source-family-namespace-mapping.v0.schema.json",
  "source-family-namespace-package.v0.schema.json",
  "source-family-namespace-mapping-receipt.v0.schema.json",
  "source-family-namespace-mapping-fixture.v0.schema.json",
  "source-family-namespace-mapping-preflight-mutation.v0.schema.json",
  "source-family-namespace-mapping-expectations.v0.schema.json",
  "source-family-namespace-mapping-diagnostics.v0.schema.json",
  "source-family-namespace-mapping-report.v0.schema.json",
  "source-family-namespace-mapping-evidence.v0.schema.json"
];

export const SFNM_CONSUMED_SCHEMA_FILES = [
  ...new Set([
    ...SFLM_SCHEMA_FILES,
    ...SFLM_CONSUMED_SCHEMA_FILES,
    ...SC_SCHEMA_FILES,
    ...SC_CONSUMED_SCHEMA_FILES
  ])
];

export const SFNM_COMPILER_IMPLEMENTATION_PATHS = [...SFLM_COMPILER_IMPLEMENTATION_PATHS];
export const SFNM_RUNTIME_DEPENDENCY_PATHS = [...SFLM_RUNTIME_DEPENDENCY_PATHS];
export const SFNM_PROOF_IMPLEMENTATION_PATHS = [
  "scripts/materialize-source-family-namespace-mapping.mjs",
  "src/source-family-namespace-mapping-contract.js",
  "src/source-family-namespace-mapping-proof.js"
];

export const SFNM_SOURCE_ENTRIES = SFLM_LAYOUT_ENTRIES.map((entry) => ({
  physicalPath: entry.physicalPath,
  logicalPath: entry.logicalPath,
  normalizedSha256: entry.sha256
}));

export const SFNM_CAPTURED_ARTIFACTS = SFLM_CAPTURED_ARTIFACTS.map(([, schemaId, innerFile]) => [
  innerFile === "evidence.json" ? "normalized-source-conformance-evidence.json" : `normalized-${innerFile}`,
  schemaId,
  innerFile
]);

export const SFNM_GENERATED_ARTIFACTS = [
  "namespace-mapping-receipt.json",
  ...SFNM_CAPTURED_ARTIFACTS.map(([file]) => file),
  "source-family-namespace-mapping-report.json",
  "evidence.json"
];

export const SFNM_ARTIFACT_PATHS = SFNM_GENERATED_ARTIFACTS.map((file) => `${SFNM_ARTIFACT_ROOT}/${file}`);

export const SFNM_DIAGNOSTIC_ROWS = [
  diagnosticRow("SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING", "Required accepted upstream evidence is missing or non-passing.", "preflight", "source-namespace-upstream", "error", "blocked", "invalid", "mutations/missing-upstream-evidence.source-family-namespace-mapping-preflight.json", "/upstreamRefs", "Restore passing accepted P2 and fixed-layout evidence before namespace normalization."),
  diagnosticRow("SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH", "Accepted upstream evidence or catalog bytes do not match their bound hashes.", "preflight", "source-namespace-upstream", "error", "blocked", "invalid", "mutations/upstream-hash-mismatch.source-family-namespace-mapping-preflight.json", "/upstreamRefs/0/hash", "Restore the accepted upstream artifact closure or review the upstream change separately."),
  diagnosticRow("SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH", "Namespace mapping bytes do not match the immutable namespace-package fixture.", "preflight", "source-namespace-mapping-integrity", "error", "blocked", "invalid", "mutations/mapping-hash-mismatch.source-family-namespace-mapping.json", "/mappingRef/hash", "Restore the checked namespace descriptor or review a new namespace-package trust anchor."),
  diagnosticRow("SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH", "Namespaced source bytes do not match the immutable namespace-package fixture.", "source-inventory", "source-namespace-input", "error", "blocked", "invalid", "mutations/source-hash-mismatch.source-family-namespace-mapping.json", "/sourceRef/hash", "Restore the checked namespaced source byte or review the source change separately."),
  diagnosticRow("SOURCE_NAMESPACE_UNSUPPORTED", "The source or target namespace is outside the single fixed namespace alias.", "namespace", "source-namespace-mapping", "error", "blocked", "invalid", "invalid/from-namespace-unsupported.source-family-namespace-mapping.json", "/fromNamespace", "Use only the review-controlled product-team-authority to source-conformance namespace alias."),
  diagnosticRow("SOURCE_NAMESPACE_MAPPING_INCOMPLETE", "A declared-source reference is not covered by the exact namespace mapping.", "namespace", "source-namespace-coverage", "error", "blocked", "invalid", "invalid/namespace-incomplete.source-family-namespace-mapping.json", "/sourceRef", "Normalize every declared-source reference through the fixed alias."),
  diagnosticRow("SOURCE_NAMESPACE_REF_UNSAFE", "A declared-source reference contains a traversal, backslash, query, encoded separator, or unsupported suffix.", "namespace", "source-namespace-ref-safety", "error", "blocked", "invalid", "invalid/ref-traversal.source-family-namespace-mapping.json", "/sourceRef", "Use the fixed POSIX-path and RFC 6901 declared-source reference grammar."),
  diagnosticRow("SOURCE_NAMESPACE_COLLISION", "The namespace alias is identity-bearing, overlapping, or otherwise non-bijective.", "namespace", "source-namespace-mapping", "error", "blocked", "invalid", "invalid/namespace-collision.source-family-namespace-mapping.json", "/fromNamespace", "Use distinct, non-overlapping source and target namespace prefixes."),
  diagnosticRow("SOURCE_NAMESPACE_SUFFIX_MISMATCH", "Namespace normalization changed a source-ref path or JSON Pointer suffix.", "normalization", "source-namespace-preservation", "error", "blocked", "invalid", "invalid/suffix-mismatch.source-family-namespace-mapping.json", "/sourceRef", "Preserve the complete path and fragment suffix while replacing only the namespace prefix."),
  diagnosticRow("SOURCE_NAMESPACE_BASELINE_MISMATCH", "Normalized source content differs from the accepted fixed-layout baseline.", "normalization", "source-namespace-baseline", "error", "blocked", "invalid", "invalid/baseline-drift.source-family-namespace-mapping.json", "/normalizedSource", "Restore the source so namespace refs and resulting manifest hashes are the only differences."),
  diagnosticRow("SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN", "Namespace mapping requests a regex, selector, parser, plugin, or content transform.", "namespace", "source-namespace-policy", "error", "blocked", "invalid", "invalid/transform-forbidden.source-family-namespace-mapping.json", "/descriptorMutation/key", "Keep the descriptor limited to exact-prefix JSON-string substitution and manifest hash refresh."),
  diagnosticRow("SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH", "Checked source-conformance compiler or runtime bytes do not match the namespace package.", "preflight", "source-namespace-compiler", "error", "blocked", "invalid", "mutations/compiler-hash-mismatch.source-family-namespace-mapping.json", "/compilerRef/hash", "Restore the accepted compiler and runtime closure before running the namespace proof."),
  diagnosticRow("SOURCE_NAMESPACE_COMPILER_RUN_FAILED", "The unchanged source-conformance compiler did not produce the expected normalized-bundle result.", "compile", "source-namespace-compiler-run", "error", "blocked", "invalid", "mutations/compiler-run-failed.source-family-namespace-mapping.json", "/probe/compilerExitCode", "Inspect the isolated compiler result without adding namespace-specific compiler logic."),
  diagnosticRow("SOURCE_NAMESPACE_REVIEW_REQUIRED", "Normalized output preserves the accepted non-executable owner review requirement.", "review", "source-namespace-review", "review", "review_required", "review_required", "review/team-exception.source-family-namespace-mapping.json", "/review", "Keep the exception non-executable until its declared owner completes review."),
  diagnosticRow("SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID", "Persisted normalized compiler artifacts fail integrity after temporary workspace removal.", "evidence", "source-namespace-inner-evidence", "error", "blocked", "invalid", "mutations/inner-evidence-invalid.source-family-namespace-mapping.json", "/artifactRef/hash", "Regenerate and re-verify the complete eight-artifact normalized closure."),
  diagnosticRow("SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", "Source-family namespace mapping evidence does not match its checked closure.", "evidence", "source-namespace-evidence", "error", "blocked", "invalid", "mutations/evidence-hash-mismatch.source-family-namespace-mapping.json", "/artifactRef/hash", "Regenerate final evidence from the checked immutable and generated closure.")
];

export const SFNM_EXPECTATION_ROWS = [
  expectationRow("valid/fixed-namespace.source-family-namespace-mapping.json", "valid", "namespace", "source-namespace-package", "valid", "allowed", []),
  ...[
    ["SOURCE_NAMESPACE_REVIEW_REQUIRED", null],
    ["SOURCE_NAMESPACE_UPSTREAM_EVIDENCE_MISSING", null],
    ["SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH", null],
    ["SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH", null],
    ["SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH", "mutations/namespace-package-hash-mismatch.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH", null],
    ["SOURCE_NAMESPACE_UNSUPPORTED", null],
    ["SOURCE_NAMESPACE_UNSUPPORTED", "invalid/to-namespace-unsupported.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_MAPPING_INCOMPLETE", null],
    ["SOURCE_NAMESPACE_REF_UNSAFE", null],
    ["SOURCE_NAMESPACE_REF_UNSAFE", "invalid/ref-backslash.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_REF_UNSAFE", "invalid/ref-query.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_REF_UNSAFE", "invalid/ref-encoded-separator.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_REF_UNSAFE", "invalid/ref-invalid-escape.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_REF_UNSAFE", "invalid/ref-dangling-escape.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_COLLISION", null],
    ["SOURCE_NAMESPACE_SUFFIX_MISMATCH", null],
    ["SOURCE_NAMESPACE_BASELINE_MISMATCH", null],
    ["SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN", null],
    ["SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN", "invalid/nested-transform-forbidden.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN", "invalid/nested-authority-forbidden.source-family-namespace-mapping.json"],
    ["SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH", null],
    ["SOURCE_NAMESPACE_COMPILER_RUN_FAILED", null],
    ["SOURCE_NAMESPACE_INNER_EVIDENCE_INVALID", null],
    ["SOURCE_NAMESPACE_EVIDENCE_HASH_MISMATCH", null]
  ].map(([code, fixtureOverride]) => {
    const row = SFNM_DIAGNOSTIC_ROWS.find((entry) => entry.code === code);
    return expectationRow(
      fixtureOverride || row.fixtureCoverage,
      code === "SOURCE_NAMESPACE_REVIEW_REQUIRED" ? "review" : code === "SOURCE_NAMESPACE_COMPILER_RUN_FAILED" ? "probe" : row.fixtureCoverage.startsWith("mutations/") ? "mutation" : "invalid",
      row.stage,
      row.phase,
      row.validationResult,
      row.promotionStatus,
      [row.code]
    );
  })
];

export function sfnmSchemaPaths() {
  return [...SFNM_SCHEMA_FILES, ...SFNM_CONSUMED_SCHEMA_FILES].map((file) => `${SFNM_SCHEMA_ROOT}/${file}`);
}

export function sfnmSourcePaths() {
  return [SFNM_MAPPING_PATH, ...SFNM_SOURCE_ENTRIES.map((entry) => `${SFNM_SOURCE_ROOT}/${entry.physicalPath}`)];
}

export function sfnmFixturePaths() {
  return [
    SFNM_NAMESPACE_PACKAGE_PATH,
    `${SFNM_FIXTURE_ROOT}/expectations.manifest.json`,
    ...SFNM_EXPECTATION_ROWS.map((row) => row.fixturePath)
  ];
}

export function sfnmArtifactOrder() {
  return [
    ...sfnmSchemaPaths(),
    ...sfnmSourcePaths(),
    ...sfnmFixturePaths(),
    ...SFNM_COMPILER_IMPLEMENTATION_PATHS,
    ...SFNM_RUNTIME_DEPENDENCY_PATHS,
    ...SFNM_PROOF_IMPLEMENTATION_PATHS,
    SFNM_P2_EVIDENCE_PATH,
    SFNM_P2_CATALOG_PATH,
    SFNM_LAYOUT_EVIDENCE_PATH,
    ...SFNM_ARTIFACT_PATHS
  ];
}

export function sfnmSchemaIdForPath(artifactPath) {
  const file = path.posix.basename(artifactPath);
  if (SFNM_SCHEMA_FILES.includes(file) || SFNM_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath === SFNM_MAPPING_PATH) return "source-family-namespace-mapping.v0";
  if (artifactPath === SFNM_NAMESPACE_PACKAGE_PATH) return "source-family-namespace-package.v0";
  if (artifactPath === SFNM_P2_EVIDENCE_PATH) return "design-system-ingestion-evidence.v0";
  if (artifactPath === SFNM_P2_CATALOG_PATH) return "runtime-catalog.v0";
  if (artifactPath === SFNM_LAYOUT_EVIDENCE_PATH) return "source-family-layout-mapping-evidence.v0";
  if (file === "expectations.manifest.json") return "source-family-namespace-mapping-expectations.v0";
  if (file.endsWith(".source-family-namespace-mapping-preflight.json")) return "source-family-namespace-mapping-preflight-mutation.v0";
  if (file.endsWith(".source-family-namespace-mapping.json")) return "source-family-namespace-mapping-fixture.v0";
  if (file === "namespace-mapping-receipt.json") return "source-family-namespace-mapping-receipt.v0";
  const captured = SFNM_CAPTURED_ARTIFACTS.find(([capturedFile]) => capturedFile === file);
  if (captured) return captured[1];
  if (file === "source-family-namespace-mapping-report.json") return "source-family-namespace-mapping-report.v0";
  if (artifactPath === `${SFNM_ARTIFACT_ROOT}/evidence.json`) return "source-family-namespace-mapping-evidence.v0";
  if (file === "bundle-index.json") return "declared-source-manifest.v0";
  if (file === "authority-map.json") return "source-authority-profile.v0";
  if (artifactPath.startsWith(`${SFNM_SOURCE_ROOT}/`)) return "declared-source-document.v0";
  return null;
}

export function defaultNamespaceMappingArgs() {
  return {
    source: SFNM_SOURCE_ROOT,
    mapping: SFNM_MAPPING_PATH,
    namespacePackage: SFNM_NAMESPACE_PACKAGE_PATH,
    ingestionEvidence: SFNM_P2_EVIDENCE_PATH,
    catalog: SFNM_P2_CATALOG_PATH,
    sourceFamilyLayoutMappingEvidence: SFNM_LAYOUT_EVIDENCE_PATH,
    fixture: SFNM_FIXTURE_ROOT,
    out: SFNM_ARTIFACT_ROOT
  };
}

export function sfnmNormalizedEvidenceRemap(mappingRef) {
  return {
    logicalSourceRoot: SC_SOURCE_ROOT,
    physicalSourceRoot: SFNM_SOURCE_ROOT,
    mappingRef,
    artifactMappings: sfnmNormalizedArtifactMappings(),
    verifiedAfterTemporaryWorkspaceRemoval: true
  };
}

export function sfnmNormalizedArtifactMappings() {
  return SFNM_CAPTURED_ARTIFACTS.map(([capturedFile, , innerFile]) => ({
    logicalPath: `${SC_ARTIFACT_ROOT}/${innerFile}`,
    persistedPath: `${SFNM_ARTIFACT_ROOT}/${capturedFile}`
  }));
}

export async function materializeSourceFamilyNamespaceMappingContract(cwd) {
  const immutable = await verifyImmutableNamespaceInputs(cwd);
  const mappingRef = artifactRef(
    SFNM_MAPPING_PATH,
    "source-family-namespace-mapping.v0",
    immutable.namespacePackage.mappingSha256
  );
  for (const [file, schema] of Object.entries(buildSourceFamilyNamespaceMappingSchemas(immutable.normalization.entries, mappingRef))) {
    await writeCanonicalJson(path.join(cwd, SFNM_SCHEMA_ROOT, file), schema);
  }
  for (const [relativePath, fixture] of Object.entries(buildSourceFamilyNamespaceMappingFixtures(immutable.namespacePackage))) {
    await writeCanonicalJson(path.join(cwd, SFNM_FIXTURE_ROOT, relativePath), fixture);
  }
  await verifyImmutableNamespaceInputs(cwd);
}

export async function verifyImmutableNamespaceInputs(cwd) {
  await assertIndependentRegularFile(path.join(cwd, SFNM_NAMESPACE_PACKAGE_PATH), SFNM_NAMESPACE_PACKAGE_PATH);
  await assertIndependentRegularFile(path.join(cwd, SFNM_MAPPING_PATH), SFNM_MAPPING_PATH);
  await assertDirectory(path.join(cwd, SFNM_SOURCE_ROOT), SFNM_SOURCE_ROOT);
  const actualFiles = await listIndependentRegularFiles(path.join(cwd, SFNM_SOURCE_ROOT));
  const expectedFiles = SFNM_SOURCE_ENTRIES.map((entry) => entry.physicalPath).sort(comparePosix);
  assertCanonicalEqual(actualFiles, expectedFiles, "namespaced source file closure");

  const mapping = await readJson(path.join(cwd, SFNM_MAPPING_PATH));
  assertNamespaceMapping(mapping);
  const namespacePackage = await readJson(path.join(cwd, SFNM_NAMESPACE_PACKAGE_PATH));
  const mappingHash = await rawFileHash(path.join(cwd, SFNM_MAPPING_PATH));
  const normalization = await normalizeNamespacedBundle(cwd);
  await assertNamespacePackage(cwd, namespacePackage, mappingHash, normalization);
  return { mapping, namespacePackage, normalization };
}

export async function normalizeNamespacedBundle(cwd, sourceRoot = SFNM_SOURCE_ROOT) {
  const byLogicalPath = new Map();
  const entries = [];
  for (const expected of SFNM_SOURCE_ENTRIES.filter((entry) => entry.logicalPath !== "manifest.json")) {
    const artifactPath = `${sourceRoot}/${expected.physicalPath}`;
    const input = await readCanonicalInput(path.join(cwd, artifactPath), artifactPath);
    const inputText = await fs.readFile(path.join(cwd, artifactPath), "utf8");
    const substitutions = [];
    const normalized = rewriteNamespaceValue(input, "", substitutions);
    const normalizedText = `${canonicalJson(normalized)}${inputText.endsWith("\n") ? "\n" : ""}`;
    const normalizedHash = sha256Text(normalizedText);
    const baselinePath = `${SFLM_PHYSICAL_SOURCE_ROOT}/${expected.physicalPath}`;
    const baselineText = await fs.readFile(path.join(cwd, baselinePath), "utf8");
    if (normalizedText !== baselineText || normalizedHash !== expected.normalizedSha256) {
      throw new Error(`SOURCE_NAMESPACE_BASELINE_MISMATCH: normalized source differs from ${baselinePath}`);
    }
    const row = {
      physicalPath: expected.physicalPath,
      logicalPath: expected.logicalPath,
      inputSha256: await rawFileHash(path.join(cwd, artifactPath)),
      normalizedSha256: normalizedHash,
      substitutionCount: substitutions.length,
      substitutions: substitutions.sort((left, right) => left.pointer.localeCompare(right.pointer)),
      manifestHashRefreshes: []
    };
    entries.push(row);
    byLogicalPath.set(expected.logicalPath, { document: normalized, text: normalizedText, row });
  }

  const manifestExpected = SFNM_SOURCE_ENTRIES.find((entry) => entry.logicalPath === "manifest.json");
  const manifestPath = `${sourceRoot}/${manifestExpected.physicalPath}`;
  const manifestInput = await readCanonicalInput(path.join(cwd, manifestPath), manifestPath);
  const manifestInputText = await fs.readFile(path.join(cwd, manifestPath), "utf8");
  const manifestSubstitutions = [];
  const manifestNormalized = rewriteNamespaceValue(manifestInput, "", manifestSubstitutions);
  const manifestHashRefreshes = [];
  for (let index = 0; index < manifestNormalized.sourceFiles.length; index += 1) {
    const sourceFile = manifestNormalized.sourceFiles[index];
    const normalizedSource = byLogicalPath.get(sourceFile.path);
    if (!normalizedSource) throw new Error(`SOURCE_NAMESPACE_MAPPING_INCOMPLETE: manifest path is not covered: ${sourceFile.path}`);
    if (sourceFile.sha256 !== normalizedSource.row.inputSha256) {
      throw new Error(`SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: manifest hash does not bind namespaced input: ${sourceFile.path}`);
    }
    manifestHashRefreshes.push({
      pointer: `/sourceFiles/${index}/sha256`,
      inputHash: sourceFile.sha256,
      normalizedHash: normalizedSource.row.normalizedSha256
    });
    sourceFile.sha256 = normalizedSource.row.normalizedSha256;
  }
  const manifestNormalizedText = `${canonicalJson(manifestNormalized)}${manifestInputText.endsWith("\n") ? "\n" : ""}`;
  const manifestNormalizedHash = sha256Text(manifestNormalizedText);
  const manifestBaselinePath = `${SFLM_PHYSICAL_SOURCE_ROOT}/${manifestExpected.physicalPath}`;
  const manifestBaselineText = await fs.readFile(path.join(cwd, manifestBaselinePath), "utf8");
  if (manifestNormalizedText !== manifestBaselineText || manifestNormalizedHash !== manifestExpected.normalizedSha256) {
    throw new Error(`SOURCE_NAMESPACE_BASELINE_MISMATCH: normalized manifest differs from ${manifestBaselinePath}`);
  }
  entries.unshift({
    physicalPath: manifestExpected.physicalPath,
    logicalPath: manifestExpected.logicalPath,
    inputSha256: await rawFileHash(path.join(cwd, manifestPath)),
    normalizedSha256: manifestNormalizedHash,
    substitutionCount: manifestSubstitutions.length,
    substitutions: manifestSubstitutions.sort((left, right) => left.pointer.localeCompare(right.pointer)),
    manifestHashRefreshes
  });
  byLogicalPath.set("manifest.json", { document: manifestNormalized, text: manifestNormalizedText, row: entries[0] });

  const totalSubstitutionCount = entries.reduce((sum, entry) => sum + entry.substitutionCount, 0);
  const totalManifestHashRefreshCount = entries.reduce((sum, entry) => sum + entry.manifestHashRefreshes.length, 0);
  if (
    totalSubstitutionCount !== SFNM_EXPECTED_SUBSTITUTION_COUNT ||
    totalManifestHashRefreshCount !== SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT
  ) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_INCOMPLETE: namespace substitutions or manifest hash refreshes are incomplete");
  }
  return {
    entries,
    documentsByLogicalPath: byLogicalPath,
    totalSubstitutionCount,
    totalManifestHashRefreshCount
  };
}

export function buildSourceFamilyNamespaceMappingSchemas(normalizationEntries, mappingRef) {
  if (!Array.isArray(normalizationEntries)) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_INCOMPLETE: schema entry closure is missing");
  }
  if (!mappingRef || mappingRef.path !== SFNM_MAPPING_PATH || mappingRef.schemaId !== "source-family-namespace-mapping.v0") {
    throw new Error("SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH: schema mapping ref is invalid");
  }
  const exactNormalizationEntries = deepClone(normalizationEntries);
  const exactPathPairs = exactNormalizationEntries.map(({ physicalPath, logicalPath }) => ({ physicalPath, logicalPath }));
  const expectedPathPairs = SFNM_SOURCE_ENTRIES.map(({ physicalPath, logicalPath }) => ({ physicalPath, logicalPath }));
  if (canonicalJson(exactPathPairs) !== canonicalJson(expectedPathPairs)) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_INCOMPLETE: schema entry closure is incomplete");
  }
  return {
    "source-family-namespace-mapping.v0.schema.json": mappingSchema(),
    "source-family-namespace-package.v0.schema.json": namespacePackageSchema(exactNormalizationEntries),
    "source-family-namespace-mapping-receipt.v0.schema.json": receiptSchema(exactNormalizationEntries),
    "source-family-namespace-mapping-fixture.v0.schema.json": fixtureSchema(),
    "source-family-namespace-mapping-preflight-mutation.v0.schema.json": preflightMutationSchema(),
    "source-family-namespace-mapping-expectations.v0.schema.json": expectationsSchema(),
    "source-family-namespace-mapping-diagnostics.v0.schema.json": diagnosticsSchema(),
    "source-family-namespace-mapping-report.v0.schema.json": reportSchema(mappingRef),
    "source-family-namespace-mapping-evidence.v0.schema.json": evidenceSchema(mappingRef)
  };
}

export function buildSourceFamilyNamespaceMappingFixtures(namespacePackage) {
  const sourceRef = [SFNM_NAMESPACE_PACKAGE_PATH];
  const fixtures = {
    "expectations.manifest.json": expectationsManifest(),
    "valid/fixed-namespace.source-family-namespace-mapping.json": fixture("fixed-namespace", "valid-namespace", null, null, sourceRef),
    "review/team-exception.source-family-namespace-mapping.json": fixture("team-exception", "review-required", null, {
      exceptionId: "product-team-button-forked-variant",
      executable: false,
      owner: "product-design-system-owners",
      rationale: "Product-team source exceptions require design-system owner review before catalog promotion.",
      expiresAt: "1970-02-15T00:00:00.000Z",
      requiredRefs: [
        `${SFNM_CANONICAL_NAMESPACE}components/button-forked-variant.json#/`,
        `${SFNM_CANONICAL_NAMESPACE}governance/exception-policy.json#/`,
        `${SFNM_CANONICAL_NAMESPACE}governance/review-policy.json#/`
      ]
    }, sourceRef),
    "mutations/missing-upstream-evidence.source-family-namespace-mapping-preflight.json": preflightFixture("missing-upstream-evidence", "upstream-evidence-missing", "remove", SFNM_LAYOUT_EVIDENCE_PATH, "source-family-layout-mapping-evidence", null),
    "mutations/upstream-hash-mismatch.source-family-namespace-mapping-preflight.json": preflightFixture("upstream-hash-mismatch", "upstream-hash-mismatch", "replace-hash", SFNM_P2_CATALOG_PATH, "p2-catalog", "0".repeat(64)),
    "mutations/mapping-hash-mismatch.source-family-namespace-mapping.json": fixture("mapping-hash-mismatch", "mapping-hash-mismatch", mutation("mapping-descriptor", "replace-value", "/mappingId", "product-team-authority-fixed-namespace-drift"), null, sourceRef),
    "mutations/namespace-package-hash-mismatch.source-family-namespace-mapping.json": fixture("namespace-package-hash-mismatch", "namespace-package-hash-mismatch", mutation("namespace-package", "replace-hash", "/mappingSha256", "0".repeat(64)), null, sourceRef),
    "mutations/source-hash-mismatch.source-family-namespace-mapping.json": fixture("source-hash-mismatch", "source-hash-mismatch", mutation("physical-source", "replace-byte", "ui/button-definition.json", "00"), null, sourceRef),
    "invalid/from-namespace-unsupported.source-family-namespace-mapping.json": fixture("from-namespace-unsupported", "namespace-unsupported", mutation("mapping-descriptor", "replace-value", "/fromNamespace", "declared-source://unreviewed-authority/"), null, sourceRef),
    "invalid/to-namespace-unsupported.source-family-namespace-mapping.json": fixture("to-namespace-unsupported", "namespace-unsupported", mutation("mapping-descriptor", "replace-value", "/toNamespace", "declared-source://unreviewed-canonical/"), null, sourceRef),
    "invalid/namespace-incomplete.source-family-namespace-mapping.json": fixture("namespace-incomplete", "namespace-incomplete", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_CANONICAL_NAMESPACE}components/button.json#/`), null, sourceRef),
    "invalid/ref-traversal.source-family-namespace-mapping.json": fixture("ref-traversal", "ref-unsafe", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_ALTERNATE_NAMESPACE}components/../button.json#/`), null, sourceRef),
    "invalid/ref-backslash.source-family-namespace-mapping.json": fixture("ref-backslash", "ref-unsafe", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_ALTERNATE_NAMESPACE}components\\button.json#/`), null, sourceRef),
    "invalid/ref-query.source-family-namespace-mapping.json": fixture("ref-query", "ref-unsafe", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_ALTERNATE_NAMESPACE}components/button.json?raw=1#/`), null, sourceRef),
    "invalid/ref-encoded-separator.source-family-namespace-mapping.json": fixture("ref-encoded-separator", "ref-unsafe", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_ALTERNATE_NAMESPACE}components%2Fbutton.json#/`), null, sourceRef),
    "invalid/ref-invalid-escape.source-family-namespace-mapping.json": fixture("ref-invalid-escape", "ref-unsafe", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_ALTERNATE_NAMESPACE}components/button.json#/facts/~2invalid`), null, sourceRef),
    "invalid/ref-dangling-escape.source-family-namespace-mapping.json": fixture("ref-dangling-escape", "ref-unsafe", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/sourceRef", `${SFNM_ALTERNATE_NAMESPACE}components/button.json#/facts/~`), null, sourceRef),
    "invalid/namespace-collision.source-family-namespace-mapping.json": fixture("namespace-collision", "namespace-collision", mutation("mapping-descriptor", "replace-value", "/fromNamespace", SFNM_CANONICAL_NAMESPACE), null, sourceRef),
    "invalid/suffix-mismatch.source-family-namespace-mapping.json": fixture("suffix-mismatch", "suffix-mismatch", mutation("normalization-result", "replace-value", "components/button.json#/sourceRef", `${SFNM_CANONICAL_NAMESPACE}components/in-line-alert.json#/`), null, sourceRef),
    "invalid/baseline-drift.source-family-namespace-mapping.json": fixture("baseline-drift", "baseline-drift", mutation("physical-source-json", "replace-value", "ui/button-definition.json#/facts/0/value", "expressive"), null, sourceRef),
    "invalid/transform-forbidden.source-family-namespace-mapping.json": fixture("transform-forbidden", "transform-forbidden", mutation("mapping-descriptor", "add-field", "/regex", "declared-source://(.+)"), null, sourceRef),
    "invalid/nested-transform-forbidden.source-family-namespace-mapping.json": fixture("nested-transform-forbidden", "transform-forbidden", mutation("mapping-descriptor", "add-field", "/entries/0/regex", "declared-source://(.+)"), null, sourceRef),
    "invalid/nested-authority-forbidden.source-family-namespace-mapping.json": fixture("nested-authority-forbidden", "transform-forbidden", mutation("mapping-descriptor", "add-field", "/provenance/actions", ["connect-live-source"]), null, sourceRef),
    "mutations/compiler-hash-mismatch.source-family-namespace-mapping.json": fixture("compiler-hash-mismatch", "compiler-hash-mismatch", mutation("compiler-ref", "replace-hash", "src/source-conformance-proof.js", "0".repeat(64)), null, sourceRef),
    "mutations/compiler-run-failed.source-family-namespace-mapping.json": fixture("compiler-run-failed", "compiler-run-failed", mutation("probe-workspace", "remove-file", "manifest.json", null), null, sourceRef),
    "mutations/inner-evidence-invalid.source-family-namespace-mapping.json": fixture("inner-evidence-invalid", "inner-evidence-invalid", mutation("captured-inner-evidence", "replace-hash", "normalized-source-inventory.json", "0".repeat(64)), null, sourceRef),
    "mutations/evidence-hash-mismatch.source-family-namespace-mapping.json": fixture("evidence-hash-mismatch", "evidence-hash-mismatch", mutation("final-evidence", "replace-hash", "artifacts/10/hash", "0".repeat(64)), null, sourceRef)
  };
  if (!namespacePackage || namespacePackage.packageId !== "product-team-authority-fixed-namespace-package") {
    throw new Error("SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH: namespace package identity drift");
  }
  return fixtures;
}

export function diagnosticsRegistry() {
  return deepClone(SFNM_DIAGNOSTIC_ROWS);
}

export function artifactRef(pathValue, schemaId, hash, sourceRef = null, extra = {}) {
  return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash, sourceRef, ...extra };
}

export function provenance(generator, sourceRefs) {
  return { generatedAt: SFNM_TIMESTAMP, generator, sourceRefs };
}

function expectedNamespaceMapping() {
  return {
    schemaId: "source-family-namespace-mapping.v0",
    version: SFNM_VERSION,
    mappingId: "product-team-authority-fixed-namespace",
    physicalSourceRoot: SFNM_SOURCE_ROOT,
    logicalSourceRoot: SC_SOURCE_ROOT,
    fromNamespace: SFNM_ALTERNATE_NAMESPACE,
    toNamespace: SFNM_CANONICAL_NAMESPACE,
    rewriteMode: "exact-prefix-json-string",
    preservePathAndFragment: true,
    manifestHashRefresh: true,
    expectedSubstitutionCount: SFNM_EXPECTED_SUBSTITUTION_COUNT,
    expectedManifestHashRefreshCount: SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT,
    familySpecificModule: null,
    entries: SFNM_SOURCE_ENTRIES.map(({ physicalPath, logicalPath }) => ({ physicalPath, logicalPath })),
    provenance: provenance("review-controlled-source-family-namespace-mapping", [SFNM_NAMESPACE_PACKAGE_PATH])
  };
}

export function assertNamespaceMapping(mapping) {
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH: namespace mapping must be an object");
  }
  const forbiddenPointer = firstForbiddenMappingKeyPointer(mapping);
  if (forbiddenPointer !== null) {
    throw new Error(`SOURCE_NAMESPACE_TRANSFORM_FORBIDDEN: namespace mapping includes a forbidden transform or authority key at ${forbiddenPointer}`);
  }
  if (
    typeof mapping.fromNamespace === "string" && mapping.fromNamespace.length > 0 &&
    typeof mapping.toNamespace === "string" && mapping.toNamespace.length > 0 &&
    (mapping.fromNamespace === mapping.toNamespace || mapping.fromNamespace.startsWith(mapping.toNamespace) || mapping.toNamespace.startsWith(mapping.fromNamespace))
  ) {
    throw new Error("SOURCE_NAMESPACE_COLLISION: namespace prefixes overlap");
  }
  if (mapping.fromNamespace !== SFNM_ALTERNATE_NAMESPACE || mapping.toNamespace !== SFNM_CANONICAL_NAMESPACE) {
    throw new Error("SOURCE_NAMESPACE_UNSUPPORTED: namespace mapping uses an unsupported prefix");
  }
  const expectedEntries = SFNM_SOURCE_ENTRIES.map(({ physicalPath, logicalPath }) => ({ physicalPath, logicalPath }));
  if (!Array.isArray(mapping.entries) || canonicalJson(mapping.entries) !== canonicalJson(expectedEntries)) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_INCOMPLETE: namespace mapping entries are incomplete");
  }
  if (canonicalJson(mapping) !== canonicalJson(expectedNamespaceMapping())) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH: namespace mapping bytes drifted from the fixed descriptor");
  }
}

function firstForbiddenMappingKeyPointer(mapping) {
  const queue = [{ value: mapping, pointer: "" }];
  const visited = new WeakSet();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current.value || typeof current.value !== "object" || visited.has(current.value)) continue;
    visited.add(current.value);
    const keys = Object.keys(current.value).sort(comparePosix);
    for (const key of keys) {
      if (SFNM_FORBIDDEN_MAPPING_KEYS.has(key)) {
        return `${current.pointer}/${escapePointerSegment(key)}`;
      }
    }
    for (const key of keys) {
      const nested = current.value[key];
      if (nested && typeof nested === "object") {
        queue.push({ value: nested, pointer: `${current.pointer}/${escapePointerSegment(key)}` });
      }
    }
  }
  return null;
}

export async function assertNamespacePackage(cwd, namespacePackage, mappingHash, normalization) {
  const expectedKeys = [
    "schemaId", "version", "packageId", "physicalSourceRoot", "logicalSourceRoot", "mappingPath", "mappingHashAlgorithm",
    "mappingSha256", "fromNamespace", "toNamespace", "rewriteMode", "preservePathAndFragment", "manifestHashRefresh",
    "expectedSubstitutionCount", "expectedManifestHashRefreshCount", "familySpecificModule", "entries", "totalSubstitutionCount", "totalManifestHashRefreshCount", "compiler",
    "upstreamBaselineRefs", "provenance"
  ];
  assertExactKeys(namespacePackage, expectedKeys, "namespace package");
  if (
    namespacePackage.schemaId !== "source-family-namespace-package.v0" || namespacePackage.version !== SFNM_VERSION ||
    namespacePackage.packageId !== "product-team-authority-fixed-namespace-package" ||
    namespacePackage.physicalSourceRoot !== SFNM_SOURCE_ROOT || namespacePackage.logicalSourceRoot !== SC_SOURCE_ROOT ||
    namespacePackage.mappingPath !== SFNM_MAPPING_PATH || namespacePackage.mappingHashAlgorithm !== "sha256" ||
    namespacePackage.mappingSha256 !== mappingHash || namespacePackage.fromNamespace !== SFNM_ALTERNATE_NAMESPACE ||
    namespacePackage.toNamespace !== SFNM_CANONICAL_NAMESPACE || namespacePackage.rewriteMode !== "exact-prefix-json-string" ||
    namespacePackage.preservePathAndFragment !== true || namespacePackage.manifestHashRefresh !== true ||
    namespacePackage.expectedSubstitutionCount !== SFNM_EXPECTED_SUBSTITUTION_COUNT ||
    namespacePackage.expectedManifestHashRefreshCount !== SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT ||
    namespacePackage.familySpecificModule !== null
  ) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_HASH_MISMATCH: namespace package contract drift");
  }
  assertCanonicalEqual(namespacePackage.entries, normalization.entries, "namespace package entries");
  if (
    namespacePackage.totalSubstitutionCount !== SFNM_EXPECTED_SUBSTITUTION_COUNT ||
    namespacePackage.totalManifestHashRefreshCount !== SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT ||
    namespacePackage.totalSubstitutionCount !== normalization.totalSubstitutionCount ||
    namespacePackage.totalManifestHashRefreshCount !== normalization.totalManifestHashRefreshCount
  ) {
    throw new Error("SOURCE_NAMESPACE_MAPPING_INCOMPLETE: namespace package count drift");
  }
  const expectedCompilerPaths = SFNM_COMPILER_IMPLEMENTATION_PATHS;
  const actualCompilerPaths = namespacePackage.compiler?.implementationRefs?.map((entry) => entry.path);
  assertCanonicalEqual(actualCompilerPaths, expectedCompilerPaths, "namespace compiler paths");
  if (namespacePackage.compiler?.runtime?.name !== "node" || namespacePackage.compiler.runtime.major !== 22) {
    throw new Error("SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH: Node 22 runtime is required");
  }
  assertCanonicalEqual(namespacePackage.compiler.runtime.dependencyRefs.map((entry) => entry.path), SFNM_RUNTIME_DEPENDENCY_PATHS, "namespace runtime dependency paths");
  for (const ref of [...namespacePackage.compiler.implementationRefs, ...namespacePackage.compiler.runtime.dependencyRefs]) {
    if (ref.hashAlgorithm !== "sha256" || ref.hash !== await rawFileHash(path.join(cwd, ref.path))) {
      throw new Error(`SOURCE_NAMESPACE_COMPILER_HASH_MISMATCH: checked input drift: ${ref.path}`);
    }
  }
  const baselineSpec = [
    [SFNM_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", "authority"],
    [SFNM_P2_CATALOG_PATH, "runtime-catalog.v0", "authority"],
    [SFNM_LAYOUT_EVIDENCE_PATH, "source-family-layout-mapping-evidence.v0", "comparison-baseline"]
  ];
  assertCanonicalEqual(namespacePackage.upstreamBaselineRefs.map((entry) => [entry.path, entry.schemaId, entry.role]), baselineSpec, "namespace upstream baseline refs");
  for (const ref of namespacePackage.upstreamBaselineRefs) {
    if (ref.hashAlgorithm !== "sha256" || ref.hash !== await rawFileHash(path.join(cwd, ref.path))) {
      throw new Error(`SOURCE_NAMESPACE_UPSTREAM_HASH_MISMATCH: checked baseline drift: ${ref.path}`);
    }
  }
  assertCanonicalEqual(namespacePackage.provenance, provenance("review-controlled-source-family-namespace-package", [SFNM_MAPPING_PATH, SFNM_LAYOUT_EVIDENCE_PATH]), "namespace package provenance");
}

function rewriteNamespaceValue(value, pointer, substitutions) {
  if (typeof value === "string") {
    if (value.startsWith(SFNM_ALTERNATE_NAMESPACE)) {
      if (!isSafeNamespaceReference(value, SFNM_ALTERNATE_NAMESPACE)) {
        throw new Error(`SOURCE_NAMESPACE_REF_UNSAFE: unsafe declared-source reference at ${pointer || "/"}`);
      }
      const suffix = value.slice(SFNM_ALTERNATE_NAMESPACE.length);
      const rewritten = `${SFNM_CANONICAL_NAMESPACE}${suffix}`;
      substitutions.push({ pointer: pointer || "/", from: value, to: rewritten });
      return rewritten;
    }
    if (value.startsWith("declared-source://")) {
      throw new Error(`SOURCE_NAMESPACE_MAPPING_INCOMPLETE: uncovered declared-source reference at ${pointer || "/"}`);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => rewriteNamespaceValue(entry, `${pointer}/${index}`, substitutions));
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = rewriteNamespaceValue(nested, `${pointer}/${escapePointerSegment(key)}`, substitutions);
    }
    return result;
  }
  return value;
}

function isSafeNamespaceReference(value, namespace) {
  if (typeof value !== "string" || !value.startsWith(namespace)) return false;
  const suffix = value.slice(namespace.length);
  return SFNM_REFERENCE_SUFFIX_REGEX.test(suffix);
}

async function readCanonicalInput(filePath, label) {
  const text = await fs.readFile(filePath, "utf8");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: source is not valid JSON: ${label}`);
  }
  if (text !== canonicalJson(value) && text !== `${canonicalJson(value)}\n`) {
    throw new Error(`SOURCE_NAMESPACE_SOURCE_HASH_MISMATCH: source is not canonical JSON with at most one terminal newline: ${label}`);
  }
  return value;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function expectationRow(relativePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes) {
  return {
    fixturePath: `${SFNM_FIXTURE_ROOT}/${relativePath}`,
    artifactPath: `${SFNM_FIXTURE_ROOT}/${relativePath}`,
    kind,
    stage,
    phase,
    expectedResult,
    promotionStatus,
    diagnosticCodes,
    jsonPointer: "/"
  };
}

function diagnosticRow(code, canonicalMessage, stage, phase, severity, promotionStatus, validationResult, fixtureCoverage, jsonPointer, suggestedAction) {
  return {
    code,
    canonicalMessage,
    stage,
    phase,
    severity,
    promotionStatus,
    validationResult,
    artifactPath: `${SFNM_FIXTURE_ROOT}/${fixtureCoverage}`,
    jsonPointer,
    suggestedAction,
    diagnosticSource: "source-family-namespace-mapping-validator",
    sourceRef: null,
    fixtureCoverage
  };
}

function fixture(fixtureId, caseType, mutationValue, review, sourceRefs) {
  return {
    schemaId: "source-family-namespace-mapping-fixture.v0",
    version: SFNM_VERSION,
    fixtureId,
    caseType,
    mutation: mutationValue,
    review,
    provenance: provenance("interfacectl-source-family-namespace-mapping-materialize", sourceRefs)
  };
}

function mutation(target, operation, pathValue, value, secondaryPath = null) {
  return { target, operation, path: pathValue, secondaryPath, value };
}

function preflightFixture(fixtureId, caseType, operation, artifactPath, boundary, value) {
  return {
    schemaId: "source-family-namespace-mapping-preflight-mutation.v0",
    version: SFNM_VERSION,
    fixtureId,
    caseType,
    operation,
    artifactPath,
    boundary,
    value,
    provenance: provenance("interfacectl-source-family-namespace-mapping-materialize", [SFNM_NAMESPACE_PACKAGE_PATH])
  };
}

function expectationsManifest() {
  return {
    schemaId: "source-family-namespace-mapping-expectations.v0",
    version: SFNM_VERSION,
    fixtureRoot: SFNM_FIXTURE_ROOT,
    artifactRoot: SFNM_ARTIFACT_ROOT,
    schemaRoot: SFNM_SCHEMA_ROOT,
    sourceRoot: SFNM_SOURCE_ROOT,
    mappingPath: SFNM_MAPPING_PATH,
    namespacePackagePath: SFNM_NAMESPACE_PACKAGE_PATH,
    inputs: sfnmFixturePaths().filter((entry) => !entry.endsWith("expectations.manifest.json")),
    artifactOrder: sfnmArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: deepClone(SFNM_EXPECTATION_ROWS),
    runExpectation: { status: "pass", promotionStatus: "review_required" }
  };
}

function mappingSchema() {
  return objectSchema("source-family-namespace-mapping.v0", {
    schemaId: { const: "source-family-namespace-mapping.v0" }, version: { const: SFNM_VERSION },
    mappingId: { const: "product-team-authority-fixed-namespace" }, physicalSourceRoot: { const: SFNM_SOURCE_ROOT },
    logicalSourceRoot: { const: SC_SOURCE_ROOT }, fromNamespace: { const: SFNM_ALTERNATE_NAMESPACE },
    toNamespace: { const: SFNM_CANONICAL_NAMESPACE }, rewriteMode: { const: "exact-prefix-json-string" },
    preservePathAndFragment: { const: true }, manifestHashRefresh: { const: true }, familySpecificModule: { type: "null" },
    expectedSubstitutionCount: { const: SFNM_EXPECTED_SUBSTITUTION_COUNT },
    expectedManifestHashRefreshCount: { const: SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT },
    entries: { const: deepClone(expectedNamespaceMapping().entries) }, provenance: provenanceSchema()
  });
}

function namespacePackageSchema(normalizationEntries) {
  return objectSchema("source-family-namespace-package.v0", {
    schemaId: { const: "source-family-namespace-package.v0" }, version: { const: SFNM_VERSION },
    packageId: { const: "product-team-authority-fixed-namespace-package" }, physicalSourceRoot: { const: SFNM_SOURCE_ROOT },
    logicalSourceRoot: { const: SC_SOURCE_ROOT }, mappingPath: { const: SFNM_MAPPING_PATH }, mappingHashAlgorithm: { const: "sha256" },
    mappingSha256: hashSchema(), fromNamespace: { const: SFNM_ALTERNATE_NAMESPACE }, toNamespace: { const: SFNM_CANONICAL_NAMESPACE },
    rewriteMode: { const: "exact-prefix-json-string" }, preservePathAndFragment: { const: true }, manifestHashRefresh: { const: true },
    expectedSubstitutionCount: { const: SFNM_EXPECTED_SUBSTITUTION_COUNT },
    expectedManifestHashRefreshCount: { const: SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT },
    familySpecificModule: { type: "null" }, entries: exactNormalizationEntriesSchema(normalizationEntries),
    totalSubstitutionCount: { const: SFNM_EXPECTED_SUBSTITUTION_COUNT }, totalManifestHashRefreshCount: { const: SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT },
    compiler: compilerSchema(), upstreamBaselineRefs: { type: "array", minItems: 3, maxItems: 3, items: baselineRefSchema() },
    provenance: provenanceSchema()
  });
}

function receiptSchema(normalizationEntries) {
  return objectSchema("source-family-namespace-mapping-receipt.v0", {
    schemaId: { const: "source-family-namespace-mapping-receipt.v0" }, version: { const: SFNM_VERSION },
    namespacePackageRef: artifactRefSchema(), mappingRef: artifactRefSchema(), physicalSourceRoot: { const: SFNM_SOURCE_ROOT },
    logicalSourceRoot: { const: SC_SOURCE_ROOT }, fromNamespace: { const: SFNM_ALTERNATE_NAMESPACE }, toNamespace: { const: SFNM_CANONICAL_NAMESPACE },
    rewriteMode: { const: "exact-prefix-json-string" }, preservePathAndFragment: { const: true }, manifestHashRefresh: { const: true },
    entryCount: { const: 12 }, entries: exactNormalizationEntriesSchema(normalizationEntries),
    totalSubstitutionCount: { const: SFNM_EXPECTED_SUBSTITUTION_COUNT }, totalManifestHashRefreshCount: { const: SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT },
    normalizedBaselineMatched: { const: true }, onlyNamespaceAndManifestHashesChanged: { const: true }, status: { const: "pass" },
    provenance: provenanceSchema()
  });
}

function fixtureSchema() {
  return objectSchema("source-family-namespace-mapping-fixture.v0", {
    schemaId: { const: "source-family-namespace-mapping-fixture.v0" }, version: { const: SFNM_VERSION },
    fixtureId: idSchema(), caseType: { enum: ["valid-namespace", "review-required", "mapping-hash-mismatch", "namespace-package-hash-mismatch", "source-hash-mismatch", "namespace-unsupported", "namespace-incomplete", "ref-unsafe", "namespace-collision", "suffix-mismatch", "baseline-drift", "transform-forbidden", "compiler-hash-mismatch", "compiler-run-failed", "inner-evidence-invalid", "evidence-hash-mismatch"] },
    mutation: nullable(mutationSchema()), review: nullable(reviewSchema()), provenance: provenanceSchema()
  });
}

function preflightMutationSchema() {
  return objectSchema("source-family-namespace-mapping-preflight-mutation.v0", {
    schemaId: { const: "source-family-namespace-mapping-preflight-mutation.v0" }, version: { const: SFNM_VERSION }, fixtureId: idSchema(),
    caseType: { enum: ["upstream-evidence-missing", "upstream-hash-mismatch"] }, operation: { enum: ["remove", "replace-hash"] },
    artifactPath: pathSchema(), boundary: idSchema(), value: nullable({ type: "string" }), provenance: provenanceSchema()
  });
}

function expectationsSchema() {
  return objectSchema("source-family-namespace-mapping-expectations.v0", {
    schemaId: { const: "source-family-namespace-mapping-expectations.v0" }, version: { const: SFNM_VERSION }, fixtureRoot: { const: SFNM_FIXTURE_ROOT },
    artifactRoot: { const: SFNM_ARTIFACT_ROOT }, schemaRoot: { const: SFNM_SCHEMA_ROOT }, sourceRoot: { const: SFNM_SOURCE_ROOT },
    mappingPath: { const: SFNM_MAPPING_PATH }, namespacePackagePath: { const: SFNM_NAMESPACE_PACKAGE_PATH },
    inputs: { const: sfnmFixturePaths().filter((entry) => !entry.endsWith("expectations.manifest.json")) },
    artifactOrder: { const: sfnmArtifactOrder() }, diagnosticsRegistry: { const: diagnosticsRegistry() },
    expectations: { const: deepClone(SFNM_EXPECTATION_ROWS) },
    runExpectation: objectSchema(null, { status: { const: "pass" }, promotionStatus: { const: "review_required" } })
  });
}

function diagnosticsSchema() {
  return objectSchema("source-family-namespace-mapping-diagnostics.v0", {
    schemaId: { const: "source-family-namespace-mapping-diagnostics.v0" }, version: { const: SFNM_VERSION },
    diagnostics: { type: "array", items: diagnosticSchema() }, provenance: provenanceSchema()
  });
}

function reportSchema(mappingRef) {
  return objectSchema("source-family-namespace-mapping-report.v0", {
    schemaId: { const: "source-family-namespace-mapping-report.v0" }, version: { const: SFNM_VERSION }, runId: idSchema(),
    namespacePackageRef: artifactRefSchema({ path: SFNM_NAMESPACE_PACKAGE_PATH }), mappingRef: artifactRefSchema({ path: SFNM_MAPPING_PATH }), compilerRefs: artifactRefArraySchema(SFNM_COMPILER_IMPLEMENTATION_PATHS),
    proofImplementationRefs: artifactRefArraySchema(SFNM_PROOF_IMPLEMENTATION_PATHS),
    runtimeRefs: artifactRefArraySchema(SFNM_RUNTIME_DEPENDENCY_PATHS), namespaceMappingReceiptRef: artifactRefSchema({ path: `${SFNM_ARTIFACT_ROOT}/namespace-mapping-receipt.json` }),
    normalizedEvidenceRemap: normalizedEvidenceRemapSchema(mappingRef), normalizationVerification: normalizationVerificationSchema(),
    baselineComparison: baselineComparisonSchema(), authorityExpansionProbe: authorityExpansionProbeSchema(),
    results: exactArraySchema(SFNM_EXPECTATION_ROWS.length, validationResultSchema()),
    diagnostics: exactArraySchema(SFNM_DIAGNOSTIC_ROWS.length, diagnosticSchema()),
    compilerExecutions: objectSchema(null, { acceptedBundlePasses: { const: 1 }, causalProbeFailures: { const: 2 }, total: { const: 3 } }),
    diagnosticsRegistry: { const: diagnosticsRegistry() }, status: { const: "pass" }, promotionStatus: { const: "review_required" },
    nonAuthorityStatement: { type: "string", minLength: 1 }, provenance: provenanceSchema()
  });
}

function evidenceSchema(mappingRef) {
  return objectSchema("source-family-namespace-mapping-evidence.v0", {
    contractId: { const: SFNM_CONTRACT_ID }, schemaId: { const: "source-family-namespace-mapping-evidence.v0" }, version: { const: SFNM_VERSION },
    runId: idSchema(), checkedAt: { const: SFNM_TIMESTAMP }, command: { const: SFNM_COMMAND }, args: commandArgsSchema(), environment: environmentSchema(),
    schemaClosure: artifactRefArraySchema(sfnmSchemaPaths()), namespacePackageRef: artifactRefSchema({ path: SFNM_NAMESPACE_PACKAGE_PATH }), mappingRef: artifactRefSchema({ path: SFNM_MAPPING_PATH }),
    sourceFileRefs: artifactRefArraySchema(sfnmSourcePaths().slice(1)),
    compilerRefs: artifactRefArraySchema(SFNM_COMPILER_IMPLEMENTATION_PATHS),
    proofImplementationRefs: artifactRefArraySchema(SFNM_PROOF_IMPLEMENTATION_PATHS),
    runtimeRefs: artifactRefArraySchema(SFNM_RUNTIME_DEPENDENCY_PATHS), fixtureRefs: artifactRefArraySchema(sfnmFixturePaths()),
    boundaryRefs: artifactRefArraySchema([SFNM_P2_EVIDENCE_PATH, SFNM_P2_CATALOG_PATH, SFNM_LAYOUT_EVIDENCE_PATH], { provenance: true }), artifacts: artifactRefArraySchema(SFNM_ARTIFACT_PATHS),
    normalizedEvidenceRemap: normalizedEvidenceRemapSchema(mappingRef), normalizedEvidenceClosureVerified: { const: true },
    diagnostics: exactArraySchema(SFNM_DIAGNOSTIC_ROWS.length, diagnosticSchema()), diagnosticsRegistry: { const: diagnosticsRegistry() },
    validationResults: exactArraySchema(SFNM_EXPECTATION_ROWS.length, validationResultSchema()), status: { const: "pass" },
    promotionStatus: { const: "review_required" }, provenance: provenanceSchema()
  });
}

function exactNormalizationEntriesSchema(normalizationEntries) {
  return {
    type: "array",
    minItems: normalizationEntries.length,
    maxItems: normalizationEntries.length,
    uniqueItems: true,
    prefixItems: normalizationEntries.map((entry) => ({ const: deepClone(entry) })),
    items: false
  };
}

function compilerSchema() {
  return objectSchema(null, {
    implementationRefs: { type: "array", minItems: 7, maxItems: 7, items: hashOnlyRefSchema() },
    runtime: objectSchema(null, { name: { const: "node" }, major: { const: 22 }, dependencyRefs: { type: "array", minItems: 2, maxItems: 2, items: hashOnlyRefSchema() } })
  });
}

function baselineRefSchema() {
  return objectSchema(null, { path: pathSchema(), schemaId: schemaIdSchema(), hashAlgorithm: { const: "sha256" }, hash: hashSchema(), role: { enum: ["authority", "comparison-baseline"] } });
}

function artifactRefSchema(options = {}) {
  const properties = { path: options.path ? { const: options.path } : pathSchema(), schemaId: schemaIdSchema(), hashAlgorithm: { const: "sha256" }, hash: hashSchema(), sourceRef: { type: ["string", "null"] } };
  if (options.provenance) properties.provenance = provenanceSchema();
  return objectSchema(null, properties);
}

function hashOnlyRefSchema() {
  return objectSchema(null, { path: pathSchema(), hashAlgorithm: { const: "sha256" }, hash: hashSchema() });
}

function provenanceSchema() {
  return objectSchema(null, { generatedAt: { const: SFNM_TIMESTAMP }, generator: { type: "string", minLength: 1 }, sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } } });
}

function reviewSchema() {
  return objectSchema(null, {
    exceptionId: idSchema(), executable: { const: false }, owner: idSchema(), rationale: { type: "string", minLength: 1 },
    expiresAt: { type: "string", format: "date-time" }, requiredRefs: { type: "array", minItems: 3, uniqueItems: true, items: { type: "string", pattern: "^declared-source://source-conformance/" } }
  });
}

function mutationSchema() {
  return objectSchema(null, {
    target: { enum: ["mapping-descriptor", "namespace-package", "physical-source", "physical-source-json", "normalization-result", "compiler-ref", "probe-workspace", "captured-inner-evidence", "final-evidence"] },
    operation: { enum: ["replace-value", "replace-byte", "replace-hash", "add-field", "remove-file"] }, path: { type: "string", minLength: 1 },
    secondaryPath: { type: ["string", "null"] }, value: {}
  });
}

function expectationSchema() {
  return objectSchema(null, {
    fixturePath: pathSchema(), artifactPath: pathSchema(), kind: { enum: ["valid", "review", "invalid", "mutation", "probe"] },
    stage: { type: "string", minLength: 1 }, phase: { type: "string", minLength: 1 }, expectedResult: { enum: ["valid", "review_required", "invalid"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] }, diagnosticCodes: { type: "array", uniqueItems: true, items: idSchema() }, jsonPointer: { type: "string" }
  });
}

function diagnosticRowSchema() {
  return objectSchema(null, {
    code: idSchema(), canonicalMessage: { type: "string", minLength: 1 }, stage: { type: "string" }, phase: { type: "string" },
    severity: { enum: ["error", "review"] }, promotionStatus: { enum: ["blocked", "review_required"] }, validationResult: { enum: ["invalid", "review_required"] },
    artifactPath: pathSchema(), jsonPointer: { type: "string" }, suggestedAction: { type: "string" }, diagnosticSource: { type: "string" },
    sourceRef: { type: ["string", "null"] }, fixtureCoverage: { type: "string" }
  });
}

function diagnosticSchema() {
  return objectSchema(null, {
    code: idSchema(), message: { type: "string", minLength: 1 }, stage: { type: "string" }, phase: { type: "string" }, severity: { enum: ["error", "review"] },
    artifactPath: pathSchema(), jsonPointer: { type: "string" }, sourceRef: { type: ["string", "null"] }
  });
}

function validationResultSchema() {
  return objectSchema(null, {
    fixturePath: pathSchema(), stage: { type: "string" }, phase: { type: "string" }, expectedResult: { enum: ["valid", "review_required", "invalid"] },
    actualResult: { enum: ["valid", "review_required", "invalid"] }, promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnosticCodes: { type: "array", uniqueItems: true, items: idSchema() }, matched: { type: "boolean" }
  });
}

function normalizedEvidenceRemapSchema(mappingRef) {
  return { const: sfnmNormalizedEvidenceRemap(mappingRef) };
}

function normalizationVerificationSchema() {
  return objectSchema(null, {
    entryCount: { const: 12 }, totalSubstitutionCount: { const: SFNM_EXPECTED_SUBSTITUTION_COUNT }, totalManifestHashRefreshCount: { const: SFNM_EXPECTED_MANIFEST_HASH_REFRESH_COUNT },
    inputClosureMatched: { const: true }, normalizedBaselineMatched: { const: true }, suffixesPreserved: { const: true },
    onlyNamespaceAndManifestHashesChanged: { const: true }, foreignNamespaceRefsRemaining: { const: 0 }, canonicalNamespaceRefsBeforeNormalization: { const: 0 }
  });
}

function baselineComparisonSchema() {
  return objectSchema(null, {
    artifactClosureMatched: { const: true }, factTuplesMatched: { const: true }, immutableFieldsMatched: { const: true },
    sourceRefsCanonicalized: { const: true }, reviewSemanticsMatched: { const: true }, compilerImplementationReused: { const: true },
    familySpecificModule: { type: "null" }
  });
}

function authorityExpansionProbeSchema() {
  return objectSchema(null, {
    baselineVerified: { const: true }, mutationIsolated: { const: true }, innerDiagnosticCode: { const: "SOURCE_FACT_AUTHORITY_ESCALATION" },
    compilerExitCode: { const: 1 }, checkedInputsUnchanged: { const: true }, baselineArtifactsUnchanged: { const: true }
  });
}

function commandArgsSchema() {
  const args = defaultNamespaceMappingArgs();
  return objectSchema(null, Object.fromEntries(Object.entries(args).map(([key, value]) => [key, { const: value }])));
}

function environmentSchema() {
  return objectSchema(null, { generatedAt: { const: SFNM_TIMESTAMP }, host: { type: "null" } });
}

function artifactRefArraySchema(paths, options = {}) {
  return {
    type: "array",
    minItems: paths.length,
    maxItems: paths.length,
    uniqueItems: true,
    prefixItems: paths.map((pathValue) => artifactRefSchema({ ...options, path: pathValue })),
    items: false
  };
}

function exactArraySchema(count, items) {
  return { type: "array", minItems: count, maxItems: count, uniqueItems: true, items };
}

function objectSchema(schemaId, properties, required = Object.keys(properties)) {
  return {
    ...(schemaId ? { $schema: "https://json-schema.org/draft/2020-12/schema", $id: schemaId } : {}),
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

function nullable(schema) {
  return { anyOf: [{ type: "null" }, schema] };
}

function hashSchema() {
  return { type: "string", pattern: "^[a-f0-9]{64}$" };
}

function pathSchema() {
  return { type: "string", pattern: "^[A-Za-z0-9@+_~-][A-Za-z0-9@+._~-]*(?:/[A-Za-z0-9@+_~-][A-Za-z0-9@+._~-]*)*$" };
}

function idSchema() {
  return { type: "string", pattern: "^[A-Z_a-z0-9][A-Z_a-z0-9-]*$" };
}

function schemaIdSchema() {
  return { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9._-]*$" };
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value || {}).sort(comparePosix);
  const sortedExpected = [...expected].sort(comparePosix);
  assertCanonicalEqual(actual, sortedExpected, `${label} keys`);
}

function assertCanonicalEqual(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} drift`);
}

async function assertIndependentRegularFile(filePath, label) {
  const stat = await fs.lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error(`${label} must be an independent regular file`);
}

async function assertDirectory(dirPath, label) {
  const stat = await fs.lstat(dirPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a real directory`);
}

async function listIndependentRegularFiles(root, relative = "") {
  const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    const full = path.join(root, next);
    if (entry.isDirectory() && !entry.isSymbolicLink()) files.push(...await listIndependentRegularFiles(root, next));
    else if (entry.isFile() && !entry.isSymbolicLink()) {
      const stat = await fs.lstat(full);
      if (stat.nlink !== 1) throw new Error(`${next} must not have a hardlink alias`);
      files.push(next);
    } else throw new Error(`unsupported namespaced source entry: ${next}`);
  }
  return files.sort(comparePosix);
}

function escapePointerSegment(value) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function comparePosix(left, right) {
  return left.localeCompare(right);
}

export const sourceFamilyNamespaceMappingInternals = {
  expectedNamespaceMapping,
  assertNamespaceMapping,
  firstForbiddenMappingKeyPointer,
  assertNamespacePackage,
  rewriteNamespaceValue,
  isSafeNamespaceReference,
  readCanonicalInput,
  sha256Text,
  listIndependentRegularFiles
};
