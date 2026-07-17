import fs from "node:fs/promises";
import path from "node:path";
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
  SC_FIXTURE_ROOT,
  SC_SCHEMA_FILES,
  SC_SOURCE_FILES,
  SC_SOURCE_ROOT
} from "./source-conformance-contract.js";
import {
  SFP_CANDIDATE_SOURCE_ROOT,
  SFP_CAPTURED_ARTIFACTS,
  SFP_CONSUMED_SCHEMA_FILES,
  SFP_SCHEMA_FILES,
  sfpReferencedReviewRoutes
} from "./source-family-packaging-contract.js";

export const SFLM_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SFLM_VERSION = "0.0.0";
export const SFLM_SCHEMA_ROOT = "schemas";
export const SFLM_FIXTURE_ROOT = "fixtures/source-family-layout-mapping";
export const SFLM_LAYOUT_PACKAGE_PATH = `${SFLM_FIXTURE_ROOT}/layout-package.fixture.json`;
export const SFLM_PHYSICAL_SOURCE_ROOT = "sources/source-family-layout-mapping/team-owned-physical-bundle";
export const SFLM_MAPPING_PATH = "sources/source-family-layout-mapping/layout-mapping.json";
export const SFLM_ARTIFACT_ROOT = "artifacts/source-family-layout-mapping";
export const SFLM_COMMAND = "interfacectl surfaces source-family-layout-mapping proof";
export const SFLM_CONTRACT_ID = "surfaces-source-family-layout-mapping-proof";
export const SFLM_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SFLM_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const SFLM_SFP_EVIDENCE_PATH = "artifacts/source-family-packaging/evidence.json";
export const SFLM_MAPPING_SHA256 = "429a4df236cc3b2af3f02daa6f573d4cbb84c115e5060a99d56af75fedb66195";

export const SFLM_ENVIRONMENT = Object.freeze({ generatedAt: SFLM_TIMESTAMP, host: null });

export const SFLM_SCHEMA_FILES = [
  "source-family-layout-mapping.v0.schema.json",
  "source-family-layout-mapping-package.v0.schema.json",
  "source-family-layout-mapping-receipt.v0.schema.json",
  "source-family-layout-mapping-fixture.v0.schema.json",
  "source-family-layout-mapping-preflight-mutation.v0.schema.json",
  "source-family-layout-mapping-expectations.v0.schema.json",
  "source-family-layout-mapping-diagnostics.v0.schema.json",
  "source-family-layout-mapping-report.v0.schema.json",
  "source-family-layout-mapping-evidence.v0.schema.json"
];

export const SFLM_CONSUMED_SCHEMA_FILES = [
  ...new Set([...SFP_SCHEMA_FILES, ...SFP_CONSUMED_SCHEMA_FILES, ...SC_SCHEMA_FILES, ...SC_CONSUMED_SCHEMA_FILES])
];

export const SFLM_COMPILER_IMPLEMENTATION_PATHS = [
  "bin/interfacectl.js",
  "scripts/materialize-source-conformance.mjs",
  "src/p0.js",
  "src/p2-contract.js",
  "src/p2-proof.js",
  "src/source-conformance-contract.js",
  "src/source-conformance-proof.js"
];

export const SFLM_RUNTIME_DEPENDENCY_PATHS = ["package.json", "package-lock.json"];

export const SFLM_IMMUTABLE_CATALOG_FIELDS = [
  "catalogId",
  "artifactKind",
  "schemaId",
  "version",
  "tokens",
  "components",
  "runtimeCapabilities",
  "diagnostics",
  "compatibility"
];

export const SFLM_LAYOUT_ENTRIES = [
  layoutEntry("bundle-index.json", "manifest.json", "08e75bc12d7a997bf0f7709706ac1b7da702918079eabbe07b69a5a1af2d08ee"),
  layoutEntry("ui/button-definition.json", "components/button.json", "a2d06f4d65c9329e5bde6c4f86fb40b9b5f532f84afbb3372bcee273e4c84293"),
  layoutEntry("ui/button-source-a.json", "components/button-acquired-a.json", "5f7a5e3a7bb97eb1833ed968e8ef4acaa2f60f349a2de858c2a1480316ed41c6"),
  layoutEntry("ui/button-source-b.json", "components/button-acquired-b.json", "fe452386ac2f019e9ec02db3f2e87d52a886092b6189638babf74819128984bf"),
  layoutEntry("ui/button-fork.json", "components/button-forked-variant.json", "53b7c17f0f7dbbcc18cd95824820cb8f2dbd5d9cb32f5bb11ae81dc50c1f60eb"),
  layoutEntry("ui/inline-notice.json", "components/in-line-alert.json", "3643239fb7c11815826ab6eecd025128ee2ae8467c690e40d80e92dc341e9cc6"),
  layoutEntry("rules/a11y-rules.json", "policies/accessibility.json", "b5397021c487d15dd0576e5fcd875732e1da8768cf5139b296fb971ce38ce98b"),
  layoutEntry("rules/content-rules.json", "policies/content.json", "b0b52717e6820c1fc962f492d77ceeab0dd6b2ae3d7a5e6a14c0229bd578d38d"),
  layoutEntry("rules/source-order.json", "policies/source-precedence.json", "e8ee7e0c5cb35d6e377c1144aa10d7f40199a41158bef6d6ede024c62973ce0a"),
  layoutEntry("review/exception-rules.json", "governance/exception-policy.json", "5089431f68e7ffbaeb1f2dadd206de67b4ad345aefbe521803798ee4028a63fb"),
  layoutEntry("review/review-rules.json", "governance/review-policy.json", "bb8de9c2f79e61c59a367f65347e962f9026681388f63abb06be54aaa48daaad"),
  layoutEntry("review/authority-map.json", "governance/authority-profile.json", "1e88fb70a05cb828ee790ddbeb5df851b24c3b0aa82c39b8488ea9d34e4c3ff4")
];

export const SFLM_CAPTURED_ARTIFACTS = [
  ["mapped-source-inventory.json", "declared-source-inventory.v0", "source-inventory.json"],
  ["mapped-source-fact-coverage.json", "source-fact-coverage.v0", "source-fact-coverage.json"],
  ["mapped-source-authority-map.json", "source-authority-map.v0", "source-authority-map.json"],
  ["mapped-source-review-queue.json", "source-review-queue.v0", "source-review-queue.json"],
  ["mapped-governed-catalog.json", "runtime-catalog.v0", "governed-catalog.json"],
  ["mapped-authority-connection-report.json", "authority-connection-report.v0", "authority-connection-report.json"],
  ["mapped-source-conformance-report.json", "source-conformance-report.v0", "source-conformance-report.json"],
  ["mapped-source-conformance-evidence.json", "source-conformance-evidence.v0", "evidence.json"]
];

export const SFLM_GENERATED_ARTIFACTS = [
  "layout-mapping-receipt.json",
  ...SFLM_CAPTURED_ARTIFACTS.map(([file]) => file),
  "source-family-layout-mapping-report.json",
  "evidence.json"
];

export const SFLM_ARTIFACT_PATHS = SFLM_GENERATED_ARTIFACTS.map((file) => `${SFLM_ARTIFACT_ROOT}/${file}`);

export const SFLM_DIAGNOSTIC_ROWS = [
  diagnosticRow("SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING", "Required accepted upstream evidence is missing or non-passing.", "preflight", "source-layout-upstream", "error", "blocked", "invalid", "mutations/missing-upstream-evidence.source-family-layout-mapping-preflight.json", "/upstreamRefs", "Restore passing accepted P2 and source-family packaging evidence before mapping."),
  diagnosticRow("SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH", "Accepted upstream evidence or catalog bytes do not match their bound hashes.", "preflight", "source-layout-upstream", "error", "blocked", "invalid", "mutations/upstream-hash-mismatch.source-family-layout-mapping-preflight.json", "/upstreamRefs/0/hash", "Restore the accepted upstream artifact closure or review the upstream change separately."),
  diagnosticRow("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH", "Layout mapping bytes do not match the immutable layout-package fixture.", "preflight", "source-layout-mapping-integrity", "error", "blocked", "invalid", "mutations/mapping-hash-mismatch.source-family-layout-mapping.json", "/mappingRef/hash", "Restore the checked mapping descriptor or review a new layout-package trust anchor."),
  diagnosticRow("SOURCE_LAYOUT_SOURCE_HASH_MISMATCH", "Physical source bytes do not match the accepted packaged-candidate counterpart.", "source-inventory", "source-layout-physical", "error", "blocked", "invalid", "mutations/source-hash-mismatch.source-family-layout-mapping.json", "/sourceRef/hash", "Restore the checked physical source byte or review the authority change outside this layout-only proof."),
  diagnosticRow("SOURCE_LAYOUT_MAPPING_INCOMPLETE", "Layout mapping does not cover the complete fixed logical source ABI.", "mapping", "source-layout-mapping", "error", "blocked", "invalid", "invalid/mapping-incomplete.source-family-layout-mapping.json", "/mappingRows", "Map every required logical entry exactly once."),
  diagnosticRow("SOURCE_LAYOUT_MAPPING_COLLISION", "Multiple physical source rows select the same logical target.", "mapping", "source-layout-mapping", "error", "blocked", "invalid", "invalid/mapping-collision.source-family-layout-mapping.json", "/mappingRows/1/logicalPath", "Use a bijective physical-to-logical mapping."),
  diagnosticRow("SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE", "Physical source path is hidden, traversal-bearing, symlinked, or not a regular file.", "source-inventory", "source-layout-physical", "error", "blocked", "invalid", "invalid/physical-path-unsafe.source-family-layout-mapping.json", "/mappingRows/0/physicalPath", "Use a normalized visible POSIX path to an independent regular file."),
  diagnosticRow("SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN", "Physical source entry has a hardlink alias.", "source-inventory", "source-layout-physical", "error", "blocked", "invalid", "invalid/physical-hardlink-forbidden.source-family-layout-mapping.json", "/physicalPath", "Replace hardlinked inputs with independent regular files."),
  diagnosticRow("SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED", "Logical source path is outside the exact fixed source-conformance ABI.", "mapping", "source-layout-mapping", "error", "blocked", "invalid", "invalid/logical-path-unsupported.source-family-layout-mapping.json", "/mappingRows/0/logicalPath", "Select only manifest.json and the ordered SC_SOURCE_FILES closure."),
  diagnosticRow("SOURCE_LAYOUT_FILE_UNDECLARED", "Physical source tree contains a regular file absent from the mapping descriptor.", "source-inventory", "source-layout-physical", "error", "blocked", "invalid", "invalid/physical-file-undeclared.source-family-layout-mapping.json", "/physicalPath", "Remove the extra file or review a replacement fixed mapping separately."),
  diagnosticRow("SOURCE_LAYOUT_BYTE_MISMATCH", "Staged logical source bytes differ from their verified physical input.", "staging", "source-layout-byte-preservation", "error", "blocked", "invalid", "mutations/staged-byte-mismatch.source-family-layout-mapping.json", "/stagedRef/hash", "Stage raw source bytes without parsing, normalization, or rewriting."),
  diagnosticRow("SOURCE_LAYOUT_TRANSFORM_FORBIDDEN", "Layout mapping requests a parser, merge, selector, transform, or other content-aware behavior.", "mapping", "source-layout-mapping-policy", "error", "blocked", "invalid", "invalid/transform-forbidden.source-family-layout-mapping.json", "/descriptorMutation/key", "Keep the descriptor path-only and copy raw bytes."),
  diagnosticRow("SOURCE_LAYOUT_CANONICAL_REF_MISMATCH", "Mapped source content changes the canonical declared-source reference namespace.", "conformance", "source-layout-canonical-refs", "error", "blocked", "invalid", "invalid/canonical-ref-mismatch.source-family-layout-mapping.json", "/stagedSourceRef", "Preserve every declared-source://source-conformance/ reference unchanged."),
  diagnosticRow("SOURCE_LAYOUT_COMPILER_HASH_MISMATCH", "Checked source-conformance compiler or runtime bytes do not match the accepted closure.", "preflight", "source-layout-compiler", "error", "blocked", "invalid", "mutations/compiler-hash-mismatch.source-family-layout-mapping.json", "/compilerRef/hash", "Restore the accepted compiler and runtime closure before running the layout proof."),
  diagnosticRow("SOURCE_LAYOUT_COMPILER_RUN_FAILED", "The unchanged source-conformance compiler did not produce the expected mapped-bundle result.", "compile", "source-layout-compiler-run", "error", "blocked", "invalid", "mutations/compiler-run-failed.source-family-layout-mapping.json", "/probe/compilerExitCode", "Inspect the isolated compiler result without adding layout-specific compiler logic."),
  diagnosticRow("SOURCE_LAYOUT_AUTHORITY_EXPANSION", "Layout descriptor requests new component, fact, policy, review, or namespace authority.", "mapping", "source-layout-mapping-policy", "error", "blocked", "invalid", "invalid/authority-expansion.source-family-layout-mapping.json", "/descriptorMutation/key", "Remove authority-bearing descriptor fields and preserve the accepted bundle unchanged."),
  diagnosticRow("SOURCE_LAYOUT_REVIEW_REQUIRED", "Mapped bundle preserves the accepted non-executable owner review requirement.", "review", "source-layout-review", "review", "review_required", "review_required", "review/team-exception.source-family-layout-mapping.json", "/review", "Keep the exception non-executable until its declared owner completes review."),
  diagnosticRow("SOURCE_LAYOUT_INNER_EVIDENCE_INVALID", "Persisted mapped compiler artifacts fail integrity after temporary workspace removal.", "evidence", "source-layout-inner-evidence", "error", "blocked", "invalid", "mutations/inner-evidence-invalid.source-family-layout-mapping.json", "/artifactRef/hash", "Regenerate and re-verify the complete eight-artifact inner closure."),
  diagnosticRow("SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH", "Source-family layout mapping evidence hash does not match its checked closure.", "evidence", "source-layout-evidence", "error", "blocked", "invalid", "mutations/evidence-hash-mismatch.source-family-layout-mapping.json", "/artifactRef/hash", "Regenerate final evidence from the checked immutable and generated closure.")
];

export const SFLM_EXPECTATION_ROWS = [
  expectationRow("valid/alternate-layout.source-family-layout-mapping.json", "valid", "package", "source-layout-package", "valid", "allowed", []),
  ...[
    "SOURCE_LAYOUT_REVIEW_REQUIRED",
    "SOURCE_LAYOUT_UPSTREAM_EVIDENCE_MISSING",
    "SOURCE_LAYOUT_UPSTREAM_HASH_MISMATCH",
    "SOURCE_LAYOUT_MAPPING_INCOMPLETE",
    "SOURCE_LAYOUT_MAPPING_COLLISION",
    "SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE",
    "SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN",
    "SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED",
    "SOURCE_LAYOUT_FILE_UNDECLARED",
    "SOURCE_LAYOUT_BYTE_MISMATCH",
    "SOURCE_LAYOUT_TRANSFORM_FORBIDDEN",
    "SOURCE_LAYOUT_CANONICAL_REF_MISMATCH",
    "SOURCE_LAYOUT_AUTHORITY_EXPANSION",
    "SOURCE_LAYOUT_SOURCE_HASH_MISMATCH",
    "SOURCE_LAYOUT_MAPPING_HASH_MISMATCH",
    "SOURCE_LAYOUT_COMPILER_HASH_MISMATCH",
    "SOURCE_LAYOUT_COMPILER_RUN_FAILED",
    "SOURCE_LAYOUT_INNER_EVIDENCE_INVALID",
    "SOURCE_LAYOUT_EVIDENCE_HASH_MISMATCH"
  ].map((code) => SFLM_DIAGNOSTIC_ROWS.find((row) => row.code === code)).map((row) => expectationRow(
    row.fixtureCoverage,
    row.code === "SOURCE_LAYOUT_REVIEW_REQUIRED" ? "review" : row.code === "SOURCE_LAYOUT_COMPILER_RUN_FAILED" ? "probe" : row.fixtureCoverage.startsWith("mutations/") ? "mutation" : "invalid",
    row.stage,
    row.phase,
    row.validationResult,
    row.promotionStatus,
    [row.code]
  ))
];

export function sflmSchemaPaths() {
  return [...SFLM_SCHEMA_FILES, ...SFLM_CONSUMED_SCHEMA_FILES].map((file) => `${SFLM_SCHEMA_ROOT}/${file}`);
}

export function sflmSourcePaths() {
  return [
    SFLM_MAPPING_PATH,
    ...SFLM_LAYOUT_ENTRIES.map((entry) => `${SFLM_PHYSICAL_SOURCE_ROOT}/${entry.physicalPath}`)
  ];
}

export function sflmFixturePaths() {
  return [
    SFLM_LAYOUT_PACKAGE_PATH,
    `${SFLM_FIXTURE_ROOT}/expectations.manifest.json`,
    ...SFLM_EXPECTATION_ROWS.map((row) => row.fixturePath)
  ];
}

export function sflmArtifactOrder() {
  return [
    ...sflmSchemaPaths(),
    ...sflmSourcePaths(),
    ...sflmFixturePaths(),
    ...SFLM_COMPILER_IMPLEMENTATION_PATHS,
    ...SFLM_RUNTIME_DEPENDENCY_PATHS,
    SFLM_P2_EVIDENCE_PATH,
    SFLM_P2_CATALOG_PATH,
    SFLM_SFP_EVIDENCE_PATH,
    ...SFLM_ARTIFACT_PATHS
  ];
}

export function sflmSchemaIdForPath(artifactPath) {
  const file = path.posix.basename(artifactPath);
  if (SFLM_SCHEMA_FILES.includes(file) || SFLM_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath === SFLM_MAPPING_PATH) return "source-family-layout-mapping.v0";
  if (artifactPath === SFLM_LAYOUT_PACKAGE_PATH) return "source-family-layout-mapping-package.v0";
  if (artifactPath === SFLM_P2_EVIDENCE_PATH) return "design-system-ingestion-evidence.v0";
  if (artifactPath === SFLM_P2_CATALOG_PATH) return "runtime-catalog.v0";
  if (artifactPath === SFLM_SFP_EVIDENCE_PATH) return "source-family-packaging-evidence.v0";
  if (file === "expectations.manifest.json") return "source-family-layout-mapping-expectations.v0";
  if (file.endsWith(".source-family-layout-mapping-preflight.json")) return "source-family-layout-mapping-preflight-mutation.v0";
  if (file.endsWith(".source-family-layout-mapping.json")) return "source-family-layout-mapping-fixture.v0";
  if (file === "layout-mapping-receipt.json") return "source-family-layout-mapping-receipt.v0";
  const captured = SFLM_CAPTURED_ARTIFACTS.find(([capturedFile]) => capturedFile === file);
  if (captured) return captured[1];
  if (file === "source-family-layout-mapping-report.json") return "source-family-layout-mapping-report.v0";
  if (artifactPath === `${SFLM_ARTIFACT_ROOT}/evidence.json`) return "source-family-layout-mapping-evidence.v0";
  if (file === "bundle-index.json") return "declared-source-manifest.v0";
  if (file === "authority-map.json") return "source-authority-profile.v0";
  if (artifactPath.startsWith(`${SFLM_PHYSICAL_SOURCE_ROOT}/`)) return "declared-source-document.v0";
  return null;
}

export function sflmMappedEvidenceRemap() {
  return {
    logicalSourceRoot: SC_SOURCE_ROOT,
    physicalSourceRoot: SFLM_PHYSICAL_SOURCE_ROOT,
    mappingRef: artifactRef(SFLM_MAPPING_PATH, "source-family-layout-mapping.v0", SFLM_MAPPING_SHA256),
    artifactMappings: SFLM_CAPTURED_ARTIFACTS.map(([capturedFile, , innerFile]) => ({
      logicalPath: `${SC_ARTIFACT_ROOT}/${innerFile}`,
      persistedPath: `${SFLM_ARTIFACT_ROOT}/${capturedFile}`
    })),
    verifiedAfterTemporaryWorkspaceRemoval: true
  };
}

export const mappedEvidenceRemap = sflmMappedEvidenceRemap;

export async function materializeSourceFamilyLayoutMappingContract(cwd) {
  const immutable = await verifyImmutableLayoutInputs(cwd);
  for (const [file, schema] of Object.entries(buildSourceFamilyLayoutMappingSchemas())) {
    await writeCanonicalJson(path.join(cwd, SFLM_SCHEMA_ROOT, file), schema);
  }
  const profileEntry = immutable.layoutPackage.entries.find((entry) => entry.logicalPath === "governance/authority-profile.json");
  const profile = await readJson(path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, profileEntry.physicalPath));
  for (const [relativePath, fixture] of Object.entries(buildSourceFamilyLayoutMappingFixtures(immutable.layoutPackage, immutable.mapping, profile))) {
    await writeCanonicalJson(path.join(cwd, SFLM_FIXTURE_ROOT, relativePath), fixture);
  }
  await verifyImmutableLayoutInputs(cwd);
}

export async function verifyImmutableLayoutInputs(cwd) {
  await assertNoSymlinkPath(cwd, SFLM_LAYOUT_PACKAGE_PATH, "file");
  await assertNoSymlinkPath(cwd, SFLM_MAPPING_PATH, "file");
  await assertNoSymlinkPath(cwd, SFLM_PHYSICAL_SOURCE_ROOT, "directory");
  const layoutPackage = await readJson(path.join(cwd, SFLM_LAYOUT_PACKAGE_PATH));
  const mapping = await readJson(path.join(cwd, SFLM_MAPPING_PATH));
  assertLayoutPackage(layoutPackage);
  assertMapping(mapping);
  const mappingHash = await rawFileHash(path.join(cwd, SFLM_MAPPING_PATH));
  if (mappingHash !== SFLM_MAPPING_SHA256 || mappingHash !== layoutPackage.mappingSha256) {
    throw new Error("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH: immutable layout mapping hash drift");
  }
  const descriptorRows = mapping.mappings.map((entry) => ({
    physicalPath: entry.physicalPath,
    logicalPath: entry.logicalPath,
    sha256: entry.sha256
  }));
  const packageRows = layoutPackage.entries.map(({ physicalPath, logicalPath, sha256 }) => ({ physicalPath, logicalPath, sha256 }));
  if (canonicalJson(descriptorRows) !== canonicalJson(packageRows)) {
    throw new Error("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH: descriptor rows differ from the immutable layout package");
  }
  const actualTree = await listIndependentRegularTree(cwd, SFLM_PHYSICAL_SOURCE_ROOT);
  const expectedFiles = SFLM_LAYOUT_ENTRIES.map((entry) => entry.physicalPath).sort(comparePosix);
  const expectedDirectories = expectedDirectorySet(expectedFiles);
  if (canonicalJson(actualTree.files) !== canonicalJson(expectedFiles)) {
    throw new Error("SOURCE_LAYOUT_FILE_UNDECLARED: physical source file closure drift");
  }
  if (canonicalJson(actualTree.directories) !== canonicalJson(expectedDirectories)) {
    throw new Error("SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: physical source directory closure drift");
  }
  const physicalRows = [];
  for (const entry of layoutPackage.entries) {
    const physicalAbsolute = path.join(cwd, SFLM_PHYSICAL_SOURCE_ROOT, entry.physicalPath);
    const baselineAbsolute = path.join(cwd, entry.baselinePath);
    await assertNoSymlinkPath(cwd, entry.baselinePath, "file");
    const physicalBytes = await fs.readFile(physicalAbsolute);
    const baselineBytes = await fs.readFile(baselineAbsolute);
    const physicalHash = await rawFileHash(physicalAbsolute);
    const baselineHash = await rawFileHash(baselineAbsolute);
    if (physicalHash !== entry.sha256 || baselineHash !== entry.sha256 || !physicalBytes.equals(baselineBytes)) {
      throw new Error(`SOURCE_LAYOUT_SOURCE_HASH_MISMATCH: ${entry.physicalPath}`);
    }
    physicalRows.push({ ...entry, physicalHash, baselineHash, bytesMatched: true });
  }
  return { layoutPackage, mapping, mappingHash, physicalRows };
}

export function buildSourceFamilyLayoutMappingSchemas() {
  return {
    "source-family-layout-mapping.v0.schema.json": layoutMappingSchema(),
    "source-family-layout-mapping-package.v0.schema.json": layoutPackageSchema(),
    "source-family-layout-mapping-receipt.v0.schema.json": layoutMappingReceiptSchema(),
    "source-family-layout-mapping-fixture.v0.schema.json": layoutMappingFixtureSchema(),
    "source-family-layout-mapping-preflight-mutation.v0.schema.json": preflightMutationSchema(),
    "source-family-layout-mapping-expectations.v0.schema.json": expectationsSchema(),
    "source-family-layout-mapping-diagnostics.v0.schema.json": diagnosticsSchema(),
    "source-family-layout-mapping-report.v0.schema.json": reportSchema(),
    "source-family-layout-mapping-evidence.v0.schema.json": evidenceSchema()
  };
}

export function buildSourceFamilyLayoutMappingFixtures(layoutPackage, mapping, profile) {
  const reviewResolution = sfpReferencedReviewRoutes(profile);
  if (!reviewResolution.valid) throw new Error("source-family layout mapping review route closure is invalid");
  const reviewRoute = reviewResolution.routes[0];
  const exception = profile.exceptions[0];
  const fixtures = {
    "expectations.manifest.json": expectationsManifest(),
    "valid/alternate-layout.source-family-layout-mapping.json": generalFixture("alternate-layout", "valid-layout"),
    "review/team-exception.source-family-layout-mapping.json": generalFixture("team-exception", "review-required", null, {
      exceptionId: exception.exceptionId,
      owner: reviewRoute.owner,
      rationale: reviewRoute.rationale,
      expiresAt: reviewRoute.expiresAt,
      requiredRefs: [exception.sourceRef, exception.policyRef, reviewRoute.policyRef].sort(comparePosix),
      executable: false
    })
  };
  fixtures["mutations/missing-upstream-evidence.source-family-layout-mapping-preflight.json"] = preflightFixture(
    "missing-upstream-evidence", "upstream-evidence-missing", "source-family-packaging-evidence", "remove", SFLM_SFP_EVIDENCE_PATH, null
  );
  fixtures["mutations/upstream-hash-mismatch.source-family-layout-mapping-preflight.json"] = preflightFixture(
    "upstream-hash-mismatch", "upstream-hash-mismatch", "p2-catalog", "replace-hash", SFLM_P2_CATALOG_PATH, "0".repeat(64)
  );
  const mutations = [
    ["mutations/mapping-hash-mismatch.source-family-layout-mapping.json", "mapping-hash-mismatch", "mapping-hash-mismatch", "mapping-descriptor", "replace-value", "/mappingId", null, `${mapping.mappingId}-drift`],
    ["mutations/source-hash-mismatch.source-family-layout-mapping.json", "source-hash-mismatch", "source-hash-mismatch", "physical-source", "replace-byte", layoutPackage.entries[1].physicalPath, null, "00"],
    ["invalid/mapping-incomplete.source-family-layout-mapping.json", "mapping-incomplete", "mapping-incomplete", "mapping-descriptor", "remove-row", "/mappings/11", null, null],
    ["invalid/mapping-collision.source-family-layout-mapping.json", "mapping-collision", "mapping-collision", "mapping-descriptor", "replace-value", "/mappings/11/logicalPath", null, layoutPackage.entries[10].logicalPath],
    ["invalid/physical-path-unsafe.source-family-layout-mapping.json", "physical-path-unsafe", "physical-path-unsafe", "mapping-descriptor", "replace-value", "/mappings/0/physicalPath", null, "../bundle-index.json"],
    ["invalid/physical-hardlink-forbidden.source-family-layout-mapping.json", "physical-hardlink-forbidden", "physical-hardlink-forbidden", "physical-source", "add-hardlink", layoutPackage.entries[1].physicalPath, "ui/button-alias.json", null],
    ["invalid/logical-path-unsupported.source-family-layout-mapping.json", "logical-path-unsupported", "logical-path-unsupported", "mapping-descriptor", "replace-value", "/mappings/0/logicalPath", null, "components/card.json"],
    ["invalid/physical-file-undeclared.source-family-layout-mapping.json", "physical-file-undeclared", "physical-file-undeclared", "physical-source", "add-file", "extra/undeclared.json", null, "{}"],
    ["mutations/staged-byte-mismatch.source-family-layout-mapping.json", "staged-byte-mismatch", "staged-byte-mismatch", "staged-logical-source", "replace-byte", "components/button.json", null, "00"],
    ["invalid/transform-forbidden.source-family-layout-mapping.json", "transform-forbidden", "transform-forbidden", "mapping-descriptor", "add-field", "/parser", null, "json"],
    ["invalid/canonical-ref-mismatch.source-family-layout-mapping.json", "canonical-ref-mismatch", "canonical-ref-mismatch", "staged-logical-source", "replace-value", "components/button.json#/sourceRef", null, "declared-source://alternate/components/button.json#/"],
    ["mutations/compiler-hash-mismatch.source-family-layout-mapping.json", "compiler-hash-mismatch", "compiler-hash-mismatch", "compiler-ref", "replace-hash", SFLM_COMPILER_IMPLEMENTATION_PATHS.at(-1), null, "0".repeat(64)],
    ["mutations/compiler-run-failed.source-family-layout-mapping.json", "compiler-run-failed", "compiler-run-failed", "probe-workspace", "remove-file", "manifest.json", null, null],
    ["invalid/authority-expansion.source-family-layout-mapping.json", "authority-expansion", "authority-expansion", "mapping-descriptor", "add-field", "/requestedComponentIds", null, ["Button", "InLineAlert", "Card"]],
    ["mutations/inner-evidence-invalid.source-family-layout-mapping.json", "inner-evidence-invalid", "inner-evidence-invalid", "captured-inner-evidence", "replace-hash", "mapped-source-inventory.json", null, "0".repeat(64)],
    ["mutations/evidence-hash-mismatch.source-family-layout-mapping.json", "evidence-hash-mismatch", "evidence-hash-mismatch", "final-evidence", "replace-hash", "artifacts/10/hash", null, "0".repeat(64)]
  ];
  for (const [file, id, caseType, target, operation, mutationPath, secondaryPath, value] of mutations) {
    fixtures[file] = generalFixture(id, caseType, { target, operation, path: mutationPath, secondaryPath, value });
  }
  return fixtures;
}

export function diagnosticsRegistry() {
  return deepClone(SFLM_DIAGNOSTIC_ROWS);
}

export function artifactRef(pathValue, schemaId, hash, sourceRef = null, extra = {}) {
  return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash, sourceRef, ...extra };
}

export function provenance(generator, sourceRefs) {
  return { generatedAt: SFLM_TIMESTAMP, generator, sourceRefs };
}

function layoutEntry(physicalPath, logicalPath, sha256) {
  return Object.freeze({
    physicalPath,
    logicalPath,
    baselinePath: `${SFP_CANDIDATE_SOURCE_ROOT}/${logicalPath}`,
    sha256
  });
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
    artifactPath: `${SFLM_FIXTURE_ROOT}/${fixtureCoverage}`,
    jsonPointer,
    suggestedAction,
    diagnosticSource: "source-family-layout-mapping-validator",
    sourceRef: null,
    fixtureCoverage
  };
}

function expectationRow(relativePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes) {
  const fixturePath = `${SFLM_FIXTURE_ROOT}/${relativePath}`;
  return { fixturePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes, artifactPath: fixturePath, jsonPointer: "/" };
}

function expectationsManifest() {
  return {
    schemaId: "source-family-layout-mapping-expectations.v0",
    version: SFLM_VERSION,
    sourceRoot: SFLM_PHYSICAL_SOURCE_ROOT,
    mappingPath: SFLM_MAPPING_PATH,
    layoutPackagePath: SFLM_LAYOUT_PACKAGE_PATH,
    fixtureRoot: SFLM_FIXTURE_ROOT,
    artifactRoot: SFLM_ARTIFACT_ROOT,
    schemaRoot: SFLM_SCHEMA_ROOT,
    inputs: sflmFixturePaths(),
    artifactOrder: sflmArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: SFLM_EXPECTATION_ROWS,
    runExpectation: { status: "pass", promotionStatus: "review_required" }
  };
}

function generalFixture(fixtureId, caseType, mutation = null, review = null) {
  return {
    schemaId: "source-family-layout-mapping-fixture.v0",
    version: SFLM_VERSION,
    fixtureId,
    caseType,
    mutation,
    review,
    provenance: provenance("interfacectl-source-family-layout-mapping-materialize", [SFLM_LAYOUT_PACKAGE_PATH])
  };
}

function preflightFixture(fixtureId, caseType, boundary, operation, artifactPath, value) {
  return {
    schemaId: "source-family-layout-mapping-preflight-mutation.v0",
    version: SFLM_VERSION,
    fixtureId,
    caseType,
    boundary,
    operation,
    artifactPath,
    value,
    provenance: provenance("interfacectl-source-family-layout-mapping-materialize", [SFLM_LAYOUT_PACKAGE_PATH])
  };
}

function objectSchema(schemaId, properties, required, options = {}) {
  const schema = { type: "object", additionalProperties: false, properties, required, ...options };
  if (schemaId) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/source-family-layout-mapping/${schemaId}.schema.json`;
  }
  return schema;
}

function nullable(schema) {
  return { anyOf: [schema, { type: "null" }] };
}

function hashSchema() {
  return { type: "string", pattern: "^[0-9a-f]{64}$" };
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: SFLM_TIMESTAMP },
    generator: { type: "string", minLength: 1 },
    sourceRefs: { type: "array", items: { type: "string", minLength: 1 } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function environmentSchema() {
  return objectSchema(null, { generatedAt: { const: SFLM_TIMESTAMP }, host: { type: "null" } }, ["generatedAt", "host"]);
}

function artifactRefSchema(options = {}) {
  const properties = {
    path: { type: "string", minLength: 1 },
    schemaId: { type: "string", minLength: 1 },
    hashAlgorithm: { const: "sha256" },
    hash: options.nullableHash ? { anyOf: [hashSchema(), { type: "null" }] } : hashSchema(),
    sourceRef: { type: ["string", "null"] }
  };
  if (options.provenance) properties.provenance = provenanceSchema();
  if (options.sourceEvidenceHash) properties.sourceEvidenceHash = hashSchema();
  return objectSchema(null, properties, ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef", ...(options.provenance ? ["provenance"] : [])]);
}

function mappingRowSchema() {
  return objectSchema(null, {
    physicalPath: { type: "string", minLength: 1 },
    logicalPath: { enum: ["manifest.json", ...SC_SOURCE_FILES] },
    sha256: hashSchema()
  }, ["physicalPath", "logicalPath", "sha256"]);
}

function packageEntrySchema() {
  return objectSchema(null, {
    physicalPath: { type: "string", minLength: 1 },
    logicalPath: { enum: ["manifest.json", ...SC_SOURCE_FILES] },
    baselinePath: { type: "string", minLength: 1 },
    sha256: hashSchema()
  }, ["physicalPath", "logicalPath", "baselinePath", "sha256"]);
}

function layoutMappingSchema() {
  return objectSchema("source-family-layout-mapping.v0", {
    schemaId: { const: "source-family-layout-mapping.v0" },
    version: { const: SFLM_VERSION },
    mappingId: { const: "product-team-authority-fixed-layout" },
    physicalSourceRoot: { const: SFLM_PHYSICAL_SOURCE_ROOT },
    logicalSourceRoot: { const: SC_SOURCE_ROOT },
    copyMode: { const: "raw-bytes" },
    sourceRefRewrite: { const: false },
    familySpecificModule: { type: "null" },
    mappings: { type: "array", minItems: 12, maxItems: 12, items: mappingRowSchema() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "mappingId", "physicalSourceRoot", "logicalSourceRoot", "copyMode", "sourceRefRewrite", "familySpecificModule", "mappings", "provenance"]);
}

function layoutPackageSchema() {
  return objectSchema("source-family-layout-mapping-package.v0", {
    schemaId: { const: "source-family-layout-mapping-package.v0" },
    version: { const: SFLM_VERSION },
    packageId: { const: "product-team-authority-fixed-layout-package" },
    physicalSourceRoot: { const: SFLM_PHYSICAL_SOURCE_ROOT },
    mappingPath: { const: SFLM_MAPPING_PATH },
    mappingHashAlgorithm: { const: "sha256" },
    mappingSha256: { const: SFLM_MAPPING_SHA256 },
    logicalSourceRoot: { const: SC_SOURCE_ROOT },
    copyMode: { const: "raw-bytes" },
    sourceRefRewrite: { const: false },
    familySpecificModule: { type: "null" },
    entries: { const: SFLM_LAYOUT_ENTRIES },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "packageId", "physicalSourceRoot", "mappingPath", "mappingHashAlgorithm", "mappingSha256", "logicalSourceRoot", "copyMode", "sourceRefRewrite", "familySpecificModule", "entries", "provenance"]);
}

function receiptEntrySchema() {
  return objectSchema(null, {
    physicalPath: { type: "string" },
    logicalPath: { type: "string" },
    baselinePath: { type: "string" },
    physicalHash: hashSchema(),
    logicalHash: hashSchema(),
    baselineHash: hashSchema(),
    bytesPreserved: { const: true }
  }, ["physicalPath", "logicalPath", "baselinePath", "physicalHash", "logicalHash", "baselineHash", "bytesPreserved"]);
}

function layoutMappingReceiptSchema() {
  return objectSchema("source-family-layout-mapping-receipt.v0", {
    schemaId: { const: "source-family-layout-mapping-receipt.v0" },
    version: { const: SFLM_VERSION },
    layoutPackageRef: artifactRefSchema(),
    mappingRef: artifactRefSchema(),
    physicalSourceRoot: { const: SFLM_PHYSICAL_SOURCE_ROOT },
    logicalSourceRoot: { const: SC_SOURCE_ROOT },
    copyMode: { const: "raw-bytes" },
    sourceRefRewrite: { const: false },
    familySpecificModule: { type: "null" },
    mappingVerifiedBeforeStaging: { const: true },
    fileClosureVerified: { const: true },
    independentRegularFilesVerified: { const: true },
    physicalLayoutDistinct: objectSchema(null, {
      directoryPathChanged: { const: true },
      fileNameChanged: { const: true }
    }, ["directoryPathChanged", "fileNameChanged"]),
    entryCount: { const: 12 },
    entries: { type: "array", minItems: 12, maxItems: 12, items: receiptEntrySchema() },
    sourceBytesPreserved: { const: true },
    status: { const: "pass" },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "layoutPackageRef", "mappingRef", "physicalSourceRoot", "logicalSourceRoot", "copyMode", "sourceRefRewrite", "familySpecificModule", "mappingVerifiedBeforeStaging", "fileClosureVerified", "independentRegularFilesVerified", "physicalLayoutDistinct", "entryCount", "entries", "sourceBytesPreserved", "status", "provenance"]);
}

function mutationSchema() {
  return objectSchema(null, {
    target: { enum: ["mapping-descriptor", "physical-source", "staged-logical-source", "compiler-ref", "probe-workspace", "captured-inner-evidence", "final-evidence"] },
    operation: { enum: ["replace-value", "replace-byte", "remove-row", "add-hardlink", "add-file", "add-field", "replace-hash", "remove-file"] },
    path: { type: ["string", "null"] },
    secondaryPath: { type: ["string", "null"] },
    value: {}
  }, ["target", "operation", "path", "secondaryPath", "value"]);
}

function reviewSchema() {
  return objectSchema(null, {
    exceptionId: { type: "string" },
    owner: { type: "string" },
    rationale: { type: "string" },
    expiresAt: { type: "string" },
    requiredRefs: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } },
    executable: { const: false }
  }, ["exceptionId", "owner", "rationale", "expiresAt", "requiredRefs", "executable"]);
}

function layoutMappingFixtureSchema() {
  return objectSchema("source-family-layout-mapping-fixture.v0", {
    schemaId: { const: "source-family-layout-mapping-fixture.v0" },
    version: { const: SFLM_VERSION },
    fixtureId: { type: "string" },
    caseType: { enum: [
      "valid-layout", "review-required", "mapping-hash-mismatch", "source-hash-mismatch", "mapping-incomplete", "mapping-collision",
      "physical-path-unsafe", "physical-hardlink-forbidden", "logical-path-unsupported", "physical-file-undeclared", "staged-byte-mismatch",
      "transform-forbidden", "canonical-ref-mismatch", "compiler-hash-mismatch", "compiler-run-failed", "authority-expansion",
      "inner-evidence-invalid", "evidence-hash-mismatch"
    ] },
    mutation: nullable(mutationSchema()),
    review: nullable(reviewSchema()),
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "caseType", "mutation", "review", "provenance"]);
}

function preflightMutationSchema() {
  return objectSchema("source-family-layout-mapping-preflight-mutation.v0", {
    schemaId: { const: "source-family-layout-mapping-preflight-mutation.v0" },
    version: { const: SFLM_VERSION },
    fixtureId: { type: "string" },
    caseType: { enum: ["upstream-evidence-missing", "upstream-hash-mismatch"] },
    boundary: { enum: ["p2-evidence", "p2-catalog", "source-family-packaging-evidence"] },
    operation: { enum: ["remove", "replace-hash", "set-non-passing"] },
    artifactPath: { type: "string" },
    value: {},
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "caseType", "boundary", "operation", "artifactPath", "value", "provenance"]);
}

function diagnosticSchema() {
  return objectSchema(null, {
    code: { type: "string" }, canonicalMessage: { type: "string" }, stage: { type: "string" }, phase: { type: "string" },
    severity: { enum: ["error", "review"] }, promotionStatus: { enum: ["blocked", "review_required"] },
    validationResult: { enum: ["invalid", "review_required"] }, artifactPath: { type: "string" }, jsonPointer: { type: "string" },
    suggestedAction: { type: "string" }, diagnosticSource: { const: "source-family-layout-mapping-validator" },
    sourceRef: { type: ["string", "null"] }, fixtureCoverage: { type: "string" }
  }, ["code", "canonicalMessage", "stage", "phase", "severity", "promotionStatus", "validationResult", "artifactPath", "jsonPointer", "suggestedAction", "diagnosticSource", "sourceRef", "fixtureCoverage"]);
}

function expectationRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" }, kind: { enum: ["valid", "review", "invalid", "mutation", "probe"] }, stage: { type: "string" }, phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] }, promotionStatus: { enum: ["allowed", "blocked", "review_required"] },
    diagnosticCodes: { type: "array", items: { type: "string" } }, artifactPath: { type: "string" }, jsonPointer: { type: "string" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"]);
}

function resultRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" }, kind: { enum: ["valid", "review", "invalid", "mutation", "probe"] }, stage: { type: "string" }, phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] }, actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "blocked", "review_required"] }, diagnosticCodes: { type: "array", items: { type: "string" } }, matched: { type: "boolean" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "matched"]);
}

function expectationsSchema() {
  return objectSchema("source-family-layout-mapping-expectations.v0", {
    schemaId: { const: "source-family-layout-mapping-expectations.v0" }, version: { const: SFLM_VERSION },
    sourceRoot: { const: SFLM_PHYSICAL_SOURCE_ROOT }, mappingPath: { const: SFLM_MAPPING_PATH }, layoutPackagePath: { const: SFLM_LAYOUT_PACKAGE_PATH },
    fixtureRoot: { const: SFLM_FIXTURE_ROOT }, artifactRoot: { const: SFLM_ARTIFACT_ROOT }, schemaRoot: { const: SFLM_SCHEMA_ROOT },
    inputs: { const: sflmFixturePaths() }, artifactOrder: { const: sflmArtifactOrder() }, diagnosticsRegistry: { const: diagnosticsRegistry() },
    expectations: { const: SFLM_EXPECTATION_ROWS },
    runExpectation: objectSchema(null, { status: { const: "pass" }, promotionStatus: { const: "review_required" } }, ["status", "promotionStatus"])
  }, ["schemaId", "version", "sourceRoot", "mappingPath", "layoutPackagePath", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"]);
}

function diagnosticsSchema() {
  return objectSchema("source-family-layout-mapping-diagnostics.v0", {
    schemaId: { const: "source-family-layout-mapping-diagnostics.v0" },
    version: { const: SFLM_VERSION },
    diagnosticsRegistry: { const: diagnosticsRegistry() }
  }, ["schemaId", "version", "diagnosticsRegistry"]);
}

function mappedEvidenceRemapSchema() {
  return { const: sflmMappedEvidenceRemap() };
}

function mappingVerificationSchema() {
  return objectSchema(null, {
    entryCount: { const: 12 },
    logicalPaths: { const: ["manifest.json", ...SC_SOURCE_FILES] },
    physicalPaths: { const: SFLM_LAYOUT_ENTRIES.map((entry) => entry.physicalPath) },
    rows: { type: "array", minItems: 12, maxItems: 12, items: objectSchema(null, {
      physicalPath: { type: "string" }, logicalPath: { enum: ["manifest.json", ...SC_SOURCE_FILES] }, baselinePath: { type: "string" },
      physicalHash: hashSchema(), baselineHash: hashSchema(), matched: { const: true }
    }, ["physicalPath", "logicalPath", "baselinePath", "physicalHash", "baselineHash", "matched"]) },
    mappingHash: { const: SFLM_MAPPING_SHA256 },
    mappingVerifiedBeforeStaging: { const: true },
    fileClosureVerified: { const: true },
    independentRegularFilesVerified: { const: true },
    physicalLayoutDistinct: objectSchema(null, {
      directoryPathChanged: { const: true }, fileNameChanged: { const: true }
    }, ["directoryPathChanged", "fileNameChanged"])
  }, ["entryCount", "logicalPaths", "physicalPaths", "rows", "mappingHash", "mappingVerifiedBeforeStaging", "fileClosureVerified", "independentRegularFilesVerified", "physicalLayoutDistinct"]);
}

function factTupleSchema() {
  const sourceFact = objectSchema(null, { sourceRef: { type: "string" }, valueHash: hashSchema() }, ["sourceRef", "valueHash"]);
  return objectSchema(null, {
    componentId: { type: "string" }, catalogPointer: { type: "string" }, catalogValueHash: hashSchema(), primaryFact: nullable(sourceFact),
    supportingFacts: { type: "array", items: sourceFact }, conflict: { type: "boolean" },
    resolution: { enum: ["exact-match", "narrower-than-catalog", "primary-precedence", "review-required", "missing-primary-fact", "outside-catalog"] },
    status: { enum: ["allowed", "review_required", "blocked"] }
  }, ["componentId", "catalogPointer", "catalogValueHash", "primaryFact", "supportingFacts", "conflict", "resolution", "status"]);
}

function baselineComparisonSchema() {
  return objectSchema(null, {
    artifactComparisons: { type: "array", minItems: 8, maxItems: 8, items: objectSchema(null, {
      logicalPath: { type: "string" }, mappedPath: { type: "string" }, baselinePath: { type: "string" },
      canonicalHash: hashSchema(), matched: { const: true }
    }, ["logicalPath", "mappedPath", "baselinePath", "canonicalHash", "matched"]) },
    artifactClosureMatched: { const: true },
    factTuples: { type: "array", minItems: 6, maxItems: 6, items: factTupleSchema() },
    factTupleCount: { const: 6 },
    factTuplesMatched: { const: true },
    immutableFields: { type: "array", minItems: 9, maxItems: 9, items: objectSchema(null, {
      field: { enum: SFLM_IMMUTABLE_CATALOG_FIELDS }, p2Hash: hashSchema(), baselineHash: hashSchema(), mappedHash: hashSchema(), matched: { const: true }
    }, ["field", "p2Hash", "baselineHash", "mappedHash", "matched"]) },
    immutableFieldCount: { const: 9 },
    immutableFieldsMatched: { const: true },
    componentIds: { const: ["Button", "InLineAlert"] },
    sourceBundleId: { type: "string", minLength: 1 },
    sourceBundleIdMatched: { const: true },
    sourceManifestMatched: { const: true },
    authorityProfileMatched: { const: true },
    sourceRefsMatched: { const: true },
    owner: { type: "string", minLength: 1 },
    activeOwnerMatched: { const: true },
    activeReviewRouteIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } },
    reviewItemCount: { type: "integer", minimum: 0 },
    reviewItemsNonExecutable: { const: true },
    reviewSemanticsMatched: { const: true },
    sourceRefsPreserved: { const: true },
    authorityExpanded: { const: false },
    catalogAuthorityExpanded: { const: false },
    compilerImplementationReused: { const: true },
    familySpecificModule: { type: "null" }
  }, ["artifactComparisons", "artifactClosureMatched", "factTuples", "factTupleCount", "factTuplesMatched", "immutableFields", "immutableFieldCount", "immutableFieldsMatched", "componentIds", "sourceBundleId", "sourceBundleIdMatched", "sourceManifestMatched", "authorityProfileMatched", "sourceRefsMatched", "owner", "activeOwnerMatched", "activeReviewRouteIds", "reviewItemCount", "reviewItemsNonExecutable", "reviewSemanticsMatched", "sourceRefsPreserved", "authorityExpanded", "catalogAuthorityExpanded", "compilerImplementationReused", "familySpecificModule"]);
}

function authorityExpansionProbeSchema() {
  const innerFinding = objectSchema(null, {
    findingId: { type: "string", minLength: 1 },
    diagnosticCode: { const: "SOURCE_FACT_AUTHORITY_ESCALATION" },
    componentId: { const: "Button" },
    status: { const: "blocked" },
    message: { type: "string", minLength: 1 },
    actionType: { const: "edit-source-fact" },
    editPath: { type: "string", minLength: 1 },
    jsonPointer: { const: "/components/Button/props/variant/allowedValues" },
    sourceRefs: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
    candidateSourceRefs: { type: "array", items: { type: "string", minLength: 1 } },
    owner: { type: ["string", "null"] }
  }, ["findingId", "diagnosticCode", "componentId", "status", "message", "actionType", "editPath", "jsonPointer", "sourceRefs", "candidateSourceRefs", "owner"]);
  return objectSchema(null, {
    baselineMappingVerified: { const: true }, baselineIntegrityVerified: { const: true },
    probeWorkspace: { const: "temporary:source-family-layout-authority-expansion" }, probeWorkspaceIsolated: { const: true },
    mutatedLogicalPaths: { const: ["components/button.json", "manifest.json"] }, componentId: { const: "Button" },
    catalogPointer: { const: "/components/Button/props/variant/allowedValues" }, addedValue: { const: "expressive" },
    innerCompilerExitCode: { const: 1 },
    innerDiagnostic: objectSchema(null, {
      code: { const: "SOURCE_FACT_AUTHORITY_ESCALATION" },
      finding: innerFinding
    }, ["code", "finding"]),
    blocked: { const: true },
    checkedSourceInputsChanged: { const: false }, baselineArtifactsChanged: { const: false }, probeWorkspaceRemoved: { const: true }
  }, ["baselineMappingVerified", "baselineIntegrityVerified", "probeWorkspace", "probeWorkspaceIsolated", "mutatedLogicalPaths", "componentId", "catalogPointer", "addedValue", "innerCompilerExitCode", "innerDiagnostic", "blocked", "checkedSourceInputsChanged", "baselineArtifactsChanged", "probeWorkspaceRemoved"]);
}

function reportSchema() {
  return objectSchema("source-family-layout-mapping-report.v0", {
    schemaId: { const: "source-family-layout-mapping-report.v0" }, version: { const: SFLM_VERSION }, runId: { type: "string" },
    layoutPackageRef: artifactRefSchema(), mappingRef: artifactRefSchema(), compilerRefs: { type: "array", minItems: 7, maxItems: 7, items: artifactRefSchema() },
    runtimeRefs: { type: "array", minItems: 2, maxItems: 2, items: artifactRefSchema() }, layoutMappingReceiptRef: artifactRefSchema(),
    mappedEvidenceRemap: mappedEvidenceRemapSchema(), mappingVerification: mappingVerificationSchema(), baselineComparison: baselineComparisonSchema(),
    authorityExpansionProbe: authorityExpansionProbeSchema(), results: { type: "array", minItems: 20, maxItems: 20, items: resultRowSchema() },
    diagnostics: { type: "array", items: diagnosticSchema() }, compilerExecutions: objectSchema(null, {
      acceptedMappedBundlePasses: { const: 1 }, causalProbeFailures: { const: 2 }, total: { const: 3 }
    }, ["acceptedMappedBundlePasses", "causalProbeFailures", "total"]),
    diagnosticsRegistry: { const: diagnosticsRegistry() }, status: { const: "pass" }, promotionStatus: { const: "review_required" },
    nonAuthorityStatement: { type: "string", minLength: 1 }, provenance: provenanceSchema()
  }, ["schemaId", "version", "runId", "layoutPackageRef", "mappingRef", "compilerRefs", "runtimeRefs", "layoutMappingReceiptRef", "mappedEvidenceRemap", "mappingVerification", "baselineComparison", "authorityExpansionProbe", "results", "diagnostics", "compilerExecutions", "diagnosticsRegistry", "status", "promotionStatus", "nonAuthorityStatement", "provenance"]);
}

function commandArgsSchema() {
  return objectSchema(null, {
    source: { const: SFLM_PHYSICAL_SOURCE_ROOT }, mapping: { const: SFLM_MAPPING_PATH }, layoutPackage: { const: SFLM_LAYOUT_PACKAGE_PATH },
    ingestionEvidence: { const: SFLM_P2_EVIDENCE_PATH }, catalog: { const: SFLM_P2_CATALOG_PATH },
    sourceFamilyPackagingEvidence: { const: SFLM_SFP_EVIDENCE_PATH }, fixture: { const: SFLM_FIXTURE_ROOT }, out: { const: SFLM_ARTIFACT_ROOT }
  }, ["source", "mapping", "layoutPackage", "ingestionEvidence", "catalog", "sourceFamilyPackagingEvidence", "fixture", "out"]);
}

function evidenceSchema() {
  return objectSchema("source-family-layout-mapping-evidence.v0", {
    contractId: { const: SFLM_CONTRACT_ID }, schemaId: { const: "source-family-layout-mapping-evidence.v0" }, version: { const: SFLM_VERSION },
    runId: { type: "string" }, checkedAt: { const: SFLM_TIMESTAMP }, command: { const: SFLM_COMMAND }, args: commandArgsSchema(), environment: environmentSchema(),
    schemaClosure: { type: "array", items: artifactRefSchema() }, layoutPackageRef: artifactRefSchema(), mappingRef: artifactRefSchema(),
    physicalSourceRefs: { type: "array", minItems: 12, maxItems: 12, items: artifactRefSchema() },
    compilerRefs: { type: "array", minItems: 7, maxItems: 7, items: artifactRefSchema() }, runtimeRefs: { type: "array", minItems: 2, maxItems: 2, items: artifactRefSchema() },
    fixtureRefs: { type: "array", items: artifactRefSchema() }, boundaryRefs: { type: "array", minItems: 3, maxItems: 3, items: artifactRefSchema({ provenance: true }) },
    artifacts: { type: "array", minItems: 11, maxItems: 11, items: artifactRefSchema({ nullableHash: true, provenance: true }) },
    mappedEvidenceRemap: mappedEvidenceRemapSchema(), mappedEvidenceClosureVerified: { const: true },
    diagnostics: { type: "array", items: diagnosticSchema() }, diagnosticsRegistry: { const: diagnosticsRegistry() },
    validationResults: { type: "array", minItems: 20, maxItems: 20, items: resultRowSchema() }, status: { const: "pass" }, promotionStatus: { const: "review_required" },
    provenance: provenanceSchema()
  }, ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "layoutPackageRef", "mappingRef", "physicalSourceRefs", "compilerRefs", "runtimeRefs", "fixtureRefs", "boundaryRefs", "artifacts", "mappedEvidenceRemap", "mappedEvidenceClosureVerified", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"]);
}

function assertLayoutPackage(layoutPackage) {
  assertExactKeys(layoutPackage, ["schemaId", "version", "packageId", "physicalSourceRoot", "mappingPath", "mappingHashAlgorithm", "mappingSha256", "logicalSourceRoot", "copyMode", "sourceRefRewrite", "familySpecificModule", "entries", "provenance"], "layout package");
  if (
    layoutPackage.schemaId !== "source-family-layout-mapping-package.v0" ||
    layoutPackage.version !== SFLM_VERSION ||
    layoutPackage.packageId !== "product-team-authority-fixed-layout-package" ||
    layoutPackage.physicalSourceRoot !== SFLM_PHYSICAL_SOURCE_ROOT ||
    layoutPackage.mappingPath !== SFLM_MAPPING_PATH ||
    layoutPackage.mappingHashAlgorithm !== "sha256" ||
    layoutPackage.mappingSha256 !== SFLM_MAPPING_SHA256 ||
    layoutPackage.logicalSourceRoot !== SC_SOURCE_ROOT ||
    layoutPackage.copyMode !== "raw-bytes" ||
    layoutPackage.sourceRefRewrite !== false ||
    layoutPackage.familySpecificModule !== null ||
    canonicalJson(layoutPackage.entries) !== canonicalJson(SFLM_LAYOUT_ENTRIES)
  ) {
    throw new Error("SOURCE_LAYOUT_MAPPING_HASH_MISMATCH: immutable layout package drift");
  }
  assertProvenance(layoutPackage.provenance, "layout package provenance");
}

function assertMapping(mapping) {
  assertExactKeys(mapping, ["schemaId", "version", "mappingId", "physicalSourceRoot", "logicalSourceRoot", "copyMode", "sourceRefRewrite", "familySpecificModule", "mappings", "provenance"], "layout mapping");
  const expectedLogicalPaths = ["manifest.json", ...SC_SOURCE_FILES];
  if (
    mapping.schemaId !== "source-family-layout-mapping.v0" || mapping.version !== SFLM_VERSION ||
    mapping.mappingId !== "product-team-authority-fixed-layout" || mapping.physicalSourceRoot !== SFLM_PHYSICAL_SOURCE_ROOT ||
    mapping.logicalSourceRoot !== SC_SOURCE_ROOT || mapping.copyMode !== "raw-bytes" || mapping.sourceRefRewrite !== false ||
    mapping.familySpecificModule !== null || !Array.isArray(mapping.mappings) || mapping.mappings.length !== 12
  ) {
    throw new Error("SOURCE_LAYOUT_MAPPING_INCOMPLETE: fixed descriptor contract drift");
  }
  for (const [index, entry] of mapping.mappings.entries()) {
    assertExactKeys(entry, ["physicalPath", "logicalPath", "sha256"], `layout mapping row ${index}`);
    assertSafeVisibleRelativePath(entry.physicalPath, `layout mapping row ${index} physicalPath`);
    if (entry.logicalPath !== expectedLogicalPaths[index]) throw new Error("SOURCE_LAYOUT_LOGICAL_PATH_UNSUPPORTED: logical ABI order drift");
    if (!/^[0-9a-f]{64}$/.test(entry.sha256)) throw new Error("SOURCE_LAYOUT_SOURCE_HASH_MISMATCH: invalid mapping source hash");
  }
  if (new Set(mapping.mappings.map((entry) => entry.physicalPath)).size !== 12) throw new Error("SOURCE_LAYOUT_MAPPING_COLLISION: duplicate physical path");
  if (new Set(mapping.mappings.map((entry) => entry.logicalPath)).size !== 12) throw new Error("SOURCE_LAYOUT_MAPPING_COLLISION: duplicate logical path");
  const directoryChanged = mapping.mappings.some((entry) => path.posix.dirname(entry.physicalPath) !== path.posix.dirname(entry.logicalPath));
  const filenameChanged = mapping.mappings.some((entry) => path.posix.basename(entry.physicalPath) !== path.posix.basename(entry.logicalPath));
  if (!directoryChanged || !filenameChanged) throw new Error("SOURCE_LAYOUT_MAPPING_INCOMPLETE: physical layout is not independently different");
  assertProvenance(mapping.provenance, "layout mapping provenance");
}

function assertExactKeys(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort(comparePosix);
  const sortedExpected = [...expected].sort(comparePosix);
  if (canonicalJson(actual) !== canonicalJson(sortedExpected)) throw new Error(`${label} key closure drift`);
}

function assertProvenance(value, label) {
  assertExactKeys(value, ["generatedAt", "generator", "sourceRefs"], label);
  if (value.generatedAt !== SFLM_TIMESTAMP || typeof value.generator !== "string" || !Array.isArray(value.sourceRefs)) throw new Error(`${label} drift`);
}

function assertSafeVisibleRelativePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\") || path.posix.isAbsolute(value) || path.posix.normalize(value) !== value) {
    throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: ${label}`);
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || segment.startsWith("."))) {
    throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: ${label}`);
  }
}

async function assertNoSymlinkPath(cwd, relativePath, expectedType) {
  assertSafeVisibleRelativePath(relativePath, relativePath);
  let current = cwd;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch {
      throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: missing ${relativePath}`);
    }
    if (stat.isSymbolicLink()) throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: symlink ${relativePath}`);
  }
  const stat = await fs.lstat(current);
  if ((expectedType === "file" && !stat.isFile()) || (expectedType === "directory" && !stat.isDirectory())) {
    throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: unsupported ${relativePath}`);
  }
  if (expectedType === "file" && stat.nlink !== 1) {
    throw new Error(`SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN: ${relativePath}`);
  }
}

async function listIndependentRegularTree(cwd, relativeRoot) {
  const files = [];
  const directories = [];
  const inodeKeys = new Set();
  async function walk(relativeDirectory, innerDirectory = "") {
    const absoluteDirectory = path.join(cwd, relativeDirectory);
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => comparePosix(left.name, right.name))) {
      const innerPath = innerDirectory ? `${innerDirectory}/${entry.name}` : entry.name;
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const stat = await fs.lstat(absolutePath, { bigint: true });
      if (stat.isSymbolicLink()) throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: symlink ${innerPath}`);
      if (stat.isDirectory()) {
        directories.push(innerPath);
        await walk(`${relativeDirectory}/${entry.name}`, innerPath);
      } else if (stat.isFile()) {
        if (stat.nlink !== 1n) throw new Error(`SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN: ${innerPath}`);
        const inodeKey = `${stat.dev}:${stat.ino}`;
        if (inodeKeys.has(inodeKey)) throw new Error(`SOURCE_LAYOUT_PHYSICAL_HARDLINK_FORBIDDEN: ${innerPath}`);
        inodeKeys.add(inodeKey);
        files.push(innerPath);
      } else {
        throw new Error(`SOURCE_LAYOUT_PHYSICAL_PATH_UNSAFE: non-regular ${innerPath}`);
      }
    }
  }
  await walk(relativeRoot);
  return { files: files.sort(comparePosix), directories: directories.sort(comparePosix) };
}

function expectedDirectorySet(files) {
  const directories = new Set();
  for (const file of files) {
    let current = path.posix.dirname(file);
    while (current !== ".") {
      directories.add(current);
      current = path.posix.dirname(current);
    }
  }
  return [...directories].sort(comparePosix);
}

function comparePosix(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export const sourceFamilyLayoutMappingContractInternals = {
  assertMapping,
  assertLayoutPackage,
  assertSafeVisibleRelativePath,
  listIndependentRegularTree,
  expectedDirectorySet,
  expectationsManifest,
  canonicalFileHash
};
