import fs from "node:fs/promises";
import path from "node:path";
import { canonicalJson } from "./p0.js";
import {
  canonicalFileHash,
  deepClone,
  rawFileHash,
  readJson,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";

export const SCC_VERSION = "0.0.0";
export const SCC_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SCC_COMMAND = "interfacectl surfaces spectrum-checkbox-catalog proof";
export const SCC_CONTRACT_ID = "surfaces-spectrum-checkbox-catalog-proof";
export const SCC_SCHEMA_ROOT = "schemas";
export const SCC_SOURCE_ROOT = "sources/spectrum-checkbox-catalog";
export const SCC_FIXTURE_ROOT = "fixtures/spectrum-checkbox-catalog";
export const SCC_ARTIFACT_ROOT = "artifacts/spectrum-checkbox-catalog";
export const SCC_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SCC_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const SCC_P2_REGISTRY_PATH = "sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/registry/components.json";
export const SCC_P2_TOKEN_PATH = "sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/tokens/layout-component.tokens.json";
export const SCC_LOCK_PATH = `${SCC_SOURCE_ROOT}/source-addendum.lock.json`;
export const SCC_MANIFEST_PATH = `${SCC_SOURCE_ROOT}/manifest.json`;
export const SCC_COMPONENT_RELATIVE_PATH = "npm/@adobe/spectrum-design-data/0.7.0/package/components/checkbox.json";
export const SCC_COMPONENT_PATH = `${SCC_SOURCE_ROOT}/${SCC_COMPONENT_RELATIVE_PATH}`;
export const SCC_PACKAGE_ROOT = "npm/@adobe/spectrum-design-data/0.7.0/package";
export const SCC_COMPONENT_RAW_SHA256 = "8476863b7164c8cf6a5e8ea0b274b6a706fb9ec20e401e212373129fb5bce488";
export const SCC_PACKAGE_TARBALL_SHA256 = "12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0";
export const SCC_PACKAGE_INTEGRITY = "sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==";
export const SCC_PACKAGE_TARBALL = "https://registry.npmjs.org/@adobe/spectrum-design-data/-/spectrum-design-data-0.7.0.tgz";
export const SCC_ENVIRONMENT = Object.freeze({
  generatedAt: SCC_TIMESTAMP,
  host: null,
  pathStyle: "posix-relative"
});

export const SCC_SCHEMA_FILES = [
  "spectrum-source-addendum-lock.v0.schema.json",
  "spectrum-checkbox-source-manifest.v0.schema.json",
  "spectrum-checkbox-source-mapping.v0.schema.json",
  "spectrum-checkbox-source-inventory.v0.schema.json",
  "spectrum-checkbox-catalog-fixture.v0.schema.json",
  "spectrum-checkbox-catalog-preflight-mutation.v0.schema.json",
  "spectrum-checkbox-catalog-expectations.v0.schema.json",
  "spectrum-checkbox-catalog-diagnostics.v0.schema.json",
  "spectrum-checkbox-catalog-report.v0.schema.json",
  "spectrum-checkbox-catalog-evidence.v0.schema.json"
];

export const SCC_SHARED_SCHEMA_FILES = [
  "runtime-catalog.v0.schema.json",
  "diagnostics.v0.schema.json",
  "design-system-ingestion-diagnostics.v0.schema.json",
  "design-system-ingestion-evidence.v0.schema.json"
];

export const SCC_IMPLEMENTATION_FILES = [
  ".github/workflows/surfaces-proof.yml",
  "README.md",
  "VISION.md",
  "PLAN.md",
  "PROGRESS.md",
  "plans/README.md",
  "plans/capability-index.md",
  "plans/design-system-readiness.md",
  "plans/product-designer-workflow.md",
  "plans/source-family-component-identity-mapping.md",
  "plans/spectrum-checkbox-catalog.md",
  "plans/surfaces-dev.md",
  "bin/interfacectl.js",
  "package.json",
  "package-lock.json",
  "sources/spectrum-checkbox-catalog/README.md",
  "src/p0.js",
  "src/capability-index-contract.js",
  "src/capability-index-proof.js",
  "src/p2-contract.js",
  "src/p2-proof.js",
  "src/spectrum-checkbox-catalog-contract.js",
  "src/spectrum-checkbox-catalog-proof.js",
  "scripts/materialize-spectrum-checkbox-catalog.mjs",
  "test/capability-index-proof.test.js",
  "test/spectrum-checkbox-catalog-proof.test.js"
];

export const SCC_MAPPING_PATHS = [
  `${SCC_SOURCE_ROOT}/mappings/component-map.json`,
  `${SCC_SOURCE_ROOT}/mappings/policy-map.json`
];

export const SCC_GENERATED_ARTIFACTS = [
  "source-inventory.json",
  "source-mapping.json",
  "governed-catalog.json",
  "spectrum-checkbox-catalog-report.json",
  "evidence.json"
];

export const SCC_ARTIFACT_PATHS = SCC_GENERATED_ARTIFACTS.map((file) => `${SCC_ARTIFACT_ROOT}/${file}`);

const CHECKBOX_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/checkbox.json#";
const REGISTRY_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/registry/components.json#/values/13";
const TOKEN_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/layout-component.tokens.json#/320";

const string = { type: "string" };
const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const status = { enum: ["allowed", "review_required", "blocked"] };
const artifactRefSchema = {
  type: "object",
  additionalProperties: false,
  required: ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"],
  properties: {
    path: { type: "string", pattern: "^(?!.*(?:^|/)\\.{1,2}(?:/|$))[A-Za-z0-9@+._~-]+(?:/[A-Za-z0-9@+._~-]+)*$" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    sourceRef: nullableString
  }
};
const provenanceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "generator", "sourceRefs"],
  properties: {
    generatedAt: { const: SCC_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } }
  }
};
const environmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "host", "pathStyle"],
  properties: {
    generatedAt: { const: SCC_TIMESTAMP },
    host: { type: "null" },
    pathStyle: { const: "posix-relative" }
  }
};
const commandArgsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["source", "ingestionEvidence", "catalog", "fixture", "out"],
  properties: {
    source: { const: SCC_SOURCE_ROOT },
    ingestionEvidence: { const: SCC_P2_EVIDENCE_PATH },
    catalog: { const: SCC_P2_CATALOG_PATH },
    fixture: { const: SCC_FIXTURE_ROOT },
    out: { const: SCC_ARTIFACT_ROOT }
  }
};
const diagnosticSchema = {
  type: "object",
  additionalProperties: false,
  required: ["code", "canonicalMessage", "severity", "stage", "phase", "promotionStatus", "artifactPath", "jsonPointer", "sourceRef", "fixtureCoverage", "diagnosticSource"],
  properties: {
    code: string,
    canonicalMessage: string,
    severity: { enum: ["error", "review"] },
    stage: string,
    phase: string,
    promotionStatus: status,
    artifactPath: string,
    jsonPointer: string,
    sourceRef: nullableString,
    fixtureCoverage: string,
    diagnosticSource: string
  }
};
const validationResultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fixturePath", "kind", "expectedResult", "actualResult", "expectedPromotionStatus", "actualPromotionStatus", "expectedDiagnosticCodes", "actualDiagnosticCodes", "matched"],
  properties: {
    fixturePath: string,
    kind: { enum: ["valid", "review", "invalid", "mutation"] },
    expectedResult: { enum: ["valid", "review_required", "invalid"] },
    actualResult: { enum: ["valid", "review_required", "invalid"] },
    expectedPromotionStatus: status,
    actualPromotionStatus: status,
    expectedDiagnosticCodes: { type: "array", items: string },
    actualDiagnosticCodes: { type: "array", items: string },
    matched: { const: true }
  }
};

export const SCC_DIAGNOSTIC_ROWS = [
  diagnostic("SPECTRUM_CHECKBOX_UPSTREAM_EVIDENCE_MISSING", "Accepted P2 evidence or catalog is missing.", "error", "preflight", "upstream", "blocked", "mutations/missing-p2-evidence.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_UPSTREAM_EVIDENCE_NONPASS", "Accepted P2 evidence is not passing.", "error", "preflight", "upstream", "blocked", "mutations/nonpass-p2-evidence.spectrum-checkbox-catalog-preflight.json", "/mutation"),
  diagnostic("SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH", "Accepted P2 evidence or catalog bytes do not match the evidence closure.", "error", "preflight", "upstream", "blocked", "mutations/upstream-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_SOURCE_LOCK_MISMATCH", "The Checkbox source addendum does not match its immutable review-time lock.", "error", "source-inventory", "source-lock", "blocked", "mutations/source-lock-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_SOURCE_PATH_UNDECLARED", "The Checkbox source addendum contains an undeclared or unsafe package path.", "error", "source-inventory", "source-path", "blocked", "mutations/extra-source-path.spectrum-checkbox-catalog-preflight.json", "/mutation"),
  diagnostic("SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH", "The Checkbox source byte or source manifest hash does not match its checked boundary.", "error", "source-inventory", "source-hash", "blocked", "mutations/source-byte-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_SOURCE_REF_MISSING", "A governed Checkbox fact is missing a declared source reference.", "error", "mapping", "source-ref", "blocked", "invalid/source-ref-missing.spectrum-checkbox-catalog.json", "/sourceRef"),
  diagnostic("SPECTRUM_CHECKBOX_SOURCE_REF_UNDECLARED", "A governed Checkbox fact uses an undeclared or unresolved source reference.", "error", "mapping", "source-ref", "blocked", "invalid/source-ref-undeclared.spectrum-checkbox-catalog.json", "/sourceRef"),
  diagnostic("SPECTRUM_CHECKBOX_MAPPING_HASH_MISMATCH", "A Checkbox mapping file does not match the source manifest.", "error", "mapping", "mapping-hash", "blocked", "mutations/mapping-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_MAPPING_UNSUPPORTED", "The requested component or property is outside the declared Checkbox source mapping.", "error", "mapping", "mapping", "blocked", "invalid/unknown-component.spectrum-checkbox-catalog.json", "/componentId"),
  diagnostic("SPECTRUM_CHECKBOX_MAPPING_AUTHORITY_ESCALATION", "The requested Checkbox mapping would add behavior absent from declared source authority.", "error", "mapping", "authority", "blocked", "invalid/invented-action.spectrum-checkbox-catalog.json", "/requestedAddition"),
  diagnostic("SPECTRUM_CHECKBOX_STATE_MAPPING_INVALID", "The keyboard-focus state must use the one declared keyboardFocus normalization.", "error", "mapping", "state", "blocked", "invalid/keyboard-state-unmapped.spectrum-checkbox-catalog.json", "/stateMapping"),
  diagnostic("SPECTRUM_CHECKBOX_TOKEN_MODE_AMBIGUOUS", "The Checkbox token binding requires an explicit declared scale mapping.", "review", "mapping", "token", "review_required", "review/token-mode-unspecified.spectrum-checkbox-catalog.json", "/tokenMode"),
  diagnostic("SPECTRUM_CHECKBOX_SELECTION_PRECEDENCE_MISSING", "Indeterminate Checkbox selection requires the declared indeterminate-over-selected precedence.", "error", "govern", "selection", "blocked", "invalid/selection-precedence-missing.spectrum-checkbox-catalog.json", "/selection/precedence"),
  diagnostic("SPECTRUM_CHECKBOX_POLICY_PROSE_FORBIDDEN", "Free-form Checkbox guidance cannot become executable catalog policy.", "error", "govern", "policy", "blocked", "invalid/policy-prose-executable.spectrum-checkbox-catalog.json", "/policyText"),
  diagnostic("SPECTRUM_CHECKBOX_REVIEW_REQUIRED", "Checkbox source intent requires owner review and remains non-executable.", "review", "govern", "review", "review_required", "review/standalone-label.spectrum-checkbox-catalog.json", "/reviewScenario"),
  diagnostic("SPECTRUM_CHECKBOX_ACTIVATION_REVIEW_REQUIRED", "Checkbox activation intent requires owner review and remains non-executable.", "review", "govern", "review", "review_required", "review/activation-intent.spectrum-checkbox-catalog.json", "/reviewScenario"),
  diagnostic("SPECTRUM_CHECKBOX_REVIEW_PROMOTION_FORBIDDEN", "Review-required Checkbox output cannot be promoted unattended.", "error", "govern", "review", "blocked", "invalid/review-promoted.spectrum-checkbox-catalog.json", "/promotionRequest"),
  diagnostic("SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH", "A Checkbox proof schema differs from the evidence closure.", "error", "evidence", "schema", "blocked", "mutations/schema-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_MANIFEST_HASH_MISMATCH", "The Checkbox source manifest differs from its deterministic checked boundary.", "error", "source-inventory", "source-manifest", "blocked", "mutations/manifest-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH", "A Checkbox proof artifact or final evidence hash differs from the evidence closure.", "error", "evidence", "evidence", "blocked", "mutations/evidence-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "/targetPath")
];

export const SCC_EXPECTATION_ROWS = [
  expectation("valid/checkbox-complete.spectrum-checkbox-catalog.json", "valid", "valid", "allowed", []),
  expectation("valid/indeterminate-precedence.spectrum-checkbox-catalog.json", "valid", "valid", "allowed", []),
  expectation("valid/desktop-token.spectrum-checkbox-catalog.json", "valid", "valid", "allowed", []),
  expectation("review/standalone-label.spectrum-checkbox-catalog.json", "review", "review_required", "review_required", ["SPECTRUM_CHECKBOX_REVIEW_REQUIRED"]),
  expectation("review/token-mode-unspecified.spectrum-checkbox-catalog.json", "review", "review_required", "review_required", ["SPECTRUM_CHECKBOX_TOKEN_MODE_AMBIGUOUS"]),
  expectation("review/activation-intent.spectrum-checkbox-catalog.json", "review", "review_required", "review_required", ["SPECTRUM_CHECKBOX_ACTIVATION_REVIEW_REQUIRED"]),
  expectation("invalid/unknown-component.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_MAPPING_UNSUPPORTED"]),
  expectation("invalid/invented-action.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/keyboard-state-unmapped.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_STATE_MAPPING_INVALID"]),
  expectation("invalid/selection-precedence-missing.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SELECTION_PRECEDENCE_MISSING"]),
  expectation("invalid/source-ref-missing.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SOURCE_REF_MISSING"]),
  expectation("invalid/source-ref-undeclared.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SOURCE_REF_UNDECLARED"]),
  expectation("invalid/policy-prose-executable.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_POLICY_PROSE_FORBIDDEN"]),
  expectation("invalid/review-promoted.spectrum-checkbox-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_CHECKBOX_REVIEW_PROMOTION_FORBIDDEN"]),
  expectation("mutations/missing-p2-evidence.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_UPSTREAM_EVIDENCE_MISSING"]),
  expectation("mutations/nonpass-p2-evidence.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_UPSTREAM_EVIDENCE_NONPASS"]),
  expectation("mutations/tampered-p2-evidence.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/upstream-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_UPSTREAM_HASH_MISMATCH"]),
  expectation("mutations/source-byte-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SOURCE_HASH_MISMATCH"]),
  expectation("mutations/extra-source-path.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SOURCE_PATH_UNDECLARED"]),
  expectation("mutations/source-lock-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SOURCE_LOCK_MISMATCH"]),
  expectation("mutations/manifest-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_MANIFEST_HASH_MISMATCH"]),
  expectation("mutations/mapping-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_MAPPING_HASH_MISMATCH"]),
  expectation("mutations/schema-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_SCHEMA_HASH_MISMATCH"]),
  expectation("mutations/evidence-hash-mismatch.spectrum-checkbox-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_CHECKBOX_EVIDENCE_HASH_MISMATCH"])
];

export const SCC_SCHEMAS = buildSchemas();
export const SCC_FIXTURES = buildFixtures();

export async function materializeSpectrumCheckboxCatalogContract(cwd) {
  await assertImmutableSpectrumCheckboxSource(cwd);
  for (const [file, value] of Object.entries(SCC_SCHEMAS)) {
    const relative = `${SCC_SCHEMA_ROOT}/${file}`;
    await assertSafeOutputPath(cwd, relative);
    await writeCanonicalJson(path.join(cwd, relative), value);
  }
  const mappings = buildExpectedSpectrumCheckboxSourceMappings();
  for (const [relative, value] of Object.entries(mappings)) {
    const outputPath = `${SCC_SOURCE_ROOT}/mappings/${relative}`;
    await assertSafeOutputPath(cwd, outputPath);
    await writeCanonicalJson(path.join(cwd, outputPath), value);
  }
  const manifest = await buildExpectedSpectrumCheckboxSourceManifest(cwd);
  await assertSafeOutputPath(cwd, SCC_MANIFEST_PATH);
  await writeCanonicalJson(path.join(cwd, SCC_SOURCE_ROOT, "manifest.json"), manifest);
  for (const [relative, value] of Object.entries(SCC_FIXTURES)) {
    const outputPath = `${SCC_FIXTURE_ROOT}/${relative}`;
    await assertSafeOutputPath(cwd, outputPath);
    await writeCanonicalJson(path.join(cwd, outputPath), value);
  }
}

export async function assertImmutableSpectrumCheckboxSource(cwd) {
  await assertSafeDirectoryPath(cwd, SCC_SOURCE_ROOT);
  await assertSafeDirectoryPath(cwd, `${SCC_SOURCE_ROOT}/${SCC_PACKAGE_ROOT}`);
  await assertSafeRegularFilePath(cwd, SCC_LOCK_PATH);
  await assertSafeRegularFilePath(cwd, SCC_COMPONENT_PATH);
  const lockPath = path.join(cwd, SCC_LOCK_PATH);
  const lock = await readJson(lockPath);
  const expected = {
    schemaId: "spectrum-source-addendum-lock.v0",
    version: SCC_VERSION,
    packageName: "@adobe/spectrum-design-data",
    packageVersion: "0.7.0",
    packageTarball: SCC_PACKAGE_TARBALL,
    packageIntegrity: SCC_PACKAGE_INTEGRITY,
    tarballHashAlgorithm: "sha256",
    tarballSha256: SCC_PACKAGE_TARBALL_SHA256,
    packageRoot: SCC_PACKAGE_ROOT,
    selectedFiles: [{ packagePath: "components/checkbox.json", hashAlgorithm: "sha256", sha256: SCC_COMPONENT_RAW_SHA256 }],
    reviewVerification: {
      method: "review-time-tarball-verification",
      verifiedAt: "2026-07-18T00:00:00.000Z",
      checks: ["npm-sha512-sri", "tarball-sha256", "selected-file-raw-sha256"],
      ordinaryMaterialization: "local-lock-conformance-only"
    },
    provenance: {
      generator: "surfaces-spectrum-source-addendum-review",
      sourceRefs: [SCC_PACKAGE_TARBALL, CHECKBOX_SOURCE_REF]
    }
  };
  if (canonicalJson(lock) !== canonicalJson(expected)) throw new Error("The Checkbox source addendum does not match its immutable review-time lock.");
  const packageRoot = path.join(cwd, SCC_SOURCE_ROOT, SCC_PACKAGE_ROOT);
  const actualPaths = await collectRegularFiles(packageRoot);
  if (JSON.stringify(actualPaths) !== JSON.stringify(["components/checkbox.json"])) {
    throw new Error("The Checkbox source addendum contains an undeclared or unsafe package path.");
  }
  const componentStat = await fs.lstat(path.join(cwd, SCC_COMPONENT_PATH));
  if (!componentStat.isFile() || componentStat.isSymbolicLink() || componentStat.nlink !== 1) {
    throw new Error("The Checkbox source addendum contains an undeclared or unsafe package path.");
  }
  if (await rawFileHash(path.join(cwd, SCC_COMPONENT_PATH)) !== SCC_COMPONENT_RAW_SHA256) {
    throw new Error("The Checkbox source byte or source manifest hash does not match its checked boundary.");
  }
  return lock;
}

export function sccSchemaPaths() {
  return [...SCC_SCHEMA_FILES, ...SCC_SHARED_SCHEMA_FILES].map((file) => `${SCC_SCHEMA_ROOT}/${file}`);
}

export function sccFixturePaths() {
  return [
    `${SCC_FIXTURE_ROOT}/expectations.manifest.json`,
    ...Object.keys(SCC_FIXTURES)
      .filter((file) => file !== "expectations.manifest.json")
      .sort()
      .map((file) => `${SCC_FIXTURE_ROOT}/${file}`)
  ];
}

export function sccSourcePaths() {
  return [SCC_LOCK_PATH, SCC_MANIFEST_PATH, SCC_COMPONENT_PATH, ...SCC_MAPPING_PATHS];
}

export function sccSchemaIdForPath(relativePath) {
  const file = path.posix.basename(relativePath);
  const ids = {
    "source-addendum.lock.json": "spectrum-source-addendum-lock.v0",
    "manifest.json": "spectrum-checkbox-source-manifest.v0",
    "component-map.json": "spectrum-checkbox-source-mapping.v0",
    "policy-map.json": "spectrum-checkbox-source-mapping.v0",
    "source-inventory.json": "spectrum-checkbox-source-inventory.v0",
    "source-mapping.json": "spectrum-checkbox-source-mapping.v0",
    "governed-catalog.json": "runtime-catalog.v0",
    "spectrum-checkbox-catalog-report.json": "spectrum-checkbox-catalog-report.v0",
    "evidence.json": "spectrum-checkbox-catalog-evidence.v0",
    "expectations.manifest.json": "spectrum-checkbox-catalog-expectations.v0"
  };
  if (ids[file]) return ids[file];
  if (file.includes("preflight")) return "spectrum-checkbox-catalog-preflight-mutation.v0";
  if (relativePath.startsWith(`${SCC_FIXTURE_ROOT}/`)) return "spectrum-checkbox-catalog-fixture.v0";
  if (relativePath.startsWith(`${SCC_SCHEMA_ROOT}/`)) return file.replace(/\.schema\.json$/, "");
  return "raw-source";
}

export function artifactRef(pathValue, schemaId, hash, sourceRef = null) {
  return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash, sourceRef };
}

export function provenance(generator, sourceRefs) {
  return { generatedAt: SCC_TIMESTAMP, generator, sourceRefs: [...new Set(sourceRefs)].sort() };
}

export function diagnosticsRegistry() {
  return SCC_DIAGNOSTIC_ROWS.map((row) => deepClone(row));
}

export async function buildExpectedSpectrumCheckboxSourceManifest(cwd) {
  const p2Evidence = await readJson(path.join(cwd, SCC_P2_EVIDENCE_PATH));
  const [p2EvidenceHash, p2CatalogHash, registryHash, tokenHash, lockHash, checkboxHash] = await Promise.all([
    Promise.resolve(computeEvidenceSelfHash(p2Evidence)),
    canonicalFileHash(path.join(cwd, SCC_P2_CATALOG_PATH)),
    rawFileHash(path.join(cwd, SCC_P2_REGISTRY_PATH)),
    rawFileHash(path.join(cwd, SCC_P2_TOKEN_PATH)),
    rawFileHash(path.join(cwd, SCC_LOCK_PATH)),
    rawFileHash(path.join(cwd, SCC_COMPONENT_PATH))
  ]);
  const requiredMappings = [];
  for (const mappingPath of SCC_MAPPING_PATHS) {
    requiredMappings.push({
      path: path.posix.relative(SCC_SOURCE_ROOT, mappingPath),
      schemaId: "spectrum-checkbox-source-mapping.v0",
      hashAlgorithm: "sha256",
      sha256: await canonicalFileHash(path.join(cwd, mappingPath)),
      mappingRefRoot: `mapping://spectrum-checkbox-catalog/${path.posix.basename(mappingPath)}#`
    });
  }
  return {
    schemaId: "spectrum-checkbox-source-manifest.v0",
    version: SCC_VERSION,
    targetId: "spectrum-checkbox-catalog",
    designSystemId: "adobe-spectrum",
    packageName: "@adobe/spectrum-design-data",
    packageVersion: "0.7.0",
    componentSubset: ["checkbox"],
    sourceRefGrammar: "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/<posix-package-path>#<rfc6901-json-pointer>",
    baseP2Boundary: {
      evidenceRef: artifactRef(SCC_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2EvidenceHash),
      catalogRef: artifactRef(SCC_P2_CATALOG_PATH, "runtime-catalog.v0", p2CatalogHash)
    },
    sourceAddendumLock: {
      path: SCC_LOCK_PATH,
      schemaId: "spectrum-source-addendum-lock.v0",
      hashAlgorithm: "sha256",
      sha256: lockHash
    },
    sourceFiles: [{
      path: SCC_COMPONENT_PATH,
      packagePath: "components/checkbox.json",
      sourceType: "component",
      hashAlgorithm: "sha256",
      sha256: checkboxHash,
      sourceRefRoot: CHECKBOX_SOURCE_REF
    }],
    reusedP2SourceFiles: [
      { path: SCC_P2_REGISTRY_PATH, hashAlgorithm: "sha256", sha256: registryHash, sourceRef: REGISTRY_SOURCE_REF },
      { path: SCC_P2_TOKEN_PATH, hashAlgorithm: "sha256", sha256: tokenHash, sourceRef: TOKEN_SOURCE_REF }
    ],
    includedPointers: [
      "",
      "/accessibility",
      "/documentBlocks/0",
      "/options/isDisabled",
      "/options/isEmphasized",
      "/options/isError",
      "/options/isIndeterminate",
      "/options/isSelected",
      "/options/label",
      "/options/size",
      "/states/0",
      "/states/1",
      "/states/2",
      "/tokenBindings/1"
    ],
    requiredMappings,
    policyRefs: [
      `${CHECKBOX_SOURCE_REF}/accessibility`,
      `${CHECKBOX_SOURCE_REF}/options/label`,
      `${CHECKBOX_SOURCE_REF}/options/isIndeterminate`
    ],
    environment: SCC_ENVIRONMENT,
    provenance: provenance("interfacectl-spectrum-checkbox-source-manifest", [CHECKBOX_SOURCE_REF, REGISTRY_SOURCE_REF, TOKEN_SOURCE_REF])
  };
}

export function buildExpectedSpectrumCheckboxSourceMappings() {
  const componentRows = {};
  const put = (mappingId, mappingKind, normalizedId, sourceRefs, targetRefs, extras = {}) => {
    componentRows[mappingId] = {
      mappingId,
      mappingKind,
      normalizedId,
      authorityScope: "mapping-narrows-source",
      reviewStatus: "accepted",
      sourceRefs,
      mappingRefs: [`mapping://spectrum-checkbox-catalog/component-map.json#/mappingRows/${mappingId}`],
      targetRefs,
      ...extras
    };
  };
  put("checkbox-component", "component", "Checkbox", [CHECKBOX_SOURCE_REF, REGISTRY_SOURCE_REF], ["catalog://spectrum-checkbox-catalog/components/Checkbox"]);
  for (const prop of ["isDisabled", "isEmphasized", "isError", "isIndeterminate", "isSelected", "label", "size"]) {
    put(`checkbox-prop-${toKebab(prop)}`, "prop", `Checkbox.props.${prop}`, [`${CHECKBOX_SOURCE_REF}/options/${prop}`], [`catalog://spectrum-checkbox-catalog/components/Checkbox/props/${prop}`]);
  }
  put("checkbox-state-hover", "state", "Checkbox.states.hover", [`${CHECKBOX_SOURCE_REF}/states/0`], ["catalog://spectrum-checkbox-catalog/components/Checkbox/states/hover"]);
  put("checkbox-state-down", "state", "Checkbox.states.down", [`${CHECKBOX_SOURCE_REF}/states/1`], ["catalog://spectrum-checkbox-catalog/components/Checkbox/states/down"]);
  put("checkbox-state-keyboard-focus", "state", "Checkbox.states.keyboardFocus", [`${CHECKBOX_SOURCE_REF}/states/2`], ["catalog://spectrum-checkbox-catalog/components/Checkbox/states/keyboardFocus"], { sourceValue: "keyboard-focus", targetValue: "keyboardFocus" });
  put("checkbox-accessibility", "accessibility", "Checkbox.accessibility", [`${CHECKBOX_SOURCE_REF}/accessibility`], ["catalog://spectrum-checkbox-catalog/components/Checkbox/accessibility"]);
  put("checkbox-selection-precedence", "constraint", "Checkbox.selectionPrecedence", [`${CHECKBOX_SOURCE_REF}/options/isIndeterminate`], ["catalog://spectrum-checkbox-catalog/governance/rules/checkboxSelectionPrecedence"], { sourceValue: "overrides the selection state", targetValue: "indeterminate-over-selected" });
  put("checkbox-purpose-example", "example", "Checkbox.examples.purpose", [`${CHECKBOX_SOURCE_REF}/documentBlocks/0`], ["catalog://spectrum-checkbox-catalog/components/Checkbox/examples/0"]);
  put("checkbox-control-size-medium-desktop", "token", "tokens.checkbox-control-size-medium-desktop", [`${CHECKBOX_SOURCE_REF}/tokenBindings/1`, TOKEN_SOURCE_REF], ["catalog://spectrum-checkbox-catalog/tokens/checkbox-control-size-medium-desktop"], { sourceValue: "checkbox-control-size-medium", targetValue: "checkbox-control-size-medium-desktop" });

  const componentMap = {
    schemaId: "spectrum-checkbox-source-mapping.v0",
    version: SCC_VERSION,
    mappingSetId: "spectrum-checkbox-component-map",
    sourceManifestRef: null,
    mappingRows: componentRows,
    reviewRequired: {},
    provenance: provenance("interfacectl-spectrum-checkbox-component-map", [CHECKBOX_SOURCE_REF, REGISTRY_SOURCE_REF, TOKEN_SOURCE_REF])
  };
  const reviewRequired = {
    "checkbox-activation-intent-review": {
      mappingId: "checkbox-activation-intent-review",
      condition: "source accessibility intent activate is requested as executable behavior",
      promotionStatus: "review_required",
      executable: false,
      reviewOwner: "design-systems-governance",
      rationale: "Source intent does not authorize an action, event, exact key binding, or runtime execution.",
      sourceRefs: [`${CHECKBOX_SOURCE_REF}/accessibility`],
      mappingRefs: ["mapping://spectrum-checkbox-catalog/policy-map.json#/reviewRequired/checkbox-activation-intent-review"]
    },
    "checkbox-standalone-label-review": {
      mappingId: "checkbox-standalone-label-review",
      condition: "label is absent and explicit accessible-name authority is not supplied",
      promotionStatus: "review_required",
      executable: false,
      reviewOwner: "design-systems-governance",
      rationale: "Standalone Checkbox context requires owner review; accessible-name behavior is not inferred.",
      sourceRefs: [`${CHECKBOX_SOURCE_REF}/options/label`, `${CHECKBOX_SOURCE_REF}/accessibility`],
      mappingRefs: ["mapping://spectrum-checkbox-catalog/policy-map.json#/reviewRequired/checkbox-standalone-label-review"]
    }
  };
  const policyMap = {
    schemaId: "spectrum-checkbox-source-mapping.v0",
    version: SCC_VERSION,
    mappingSetId: "spectrum-checkbox-policy-map",
    sourceManifestRef: null,
    mappingRows: {},
    reviewRequired,
    provenance: provenance("interfacectl-spectrum-checkbox-policy-map", Object.values(reviewRequired).flatMap((row) => row.sourceRefs))
  };
  return { "component-map.json": componentMap, "policy-map.json": policyMap };
}

function buildFixtures() {
  const fixtures = {};
  const put = (relative, value) => { fixtures[relative] = value; };
  put("valid/checkbox-complete.spectrum-checkbox-catalog.json", baseFixture("checkbox-complete"));
  put("valid/indeterminate-precedence.spectrum-checkbox-catalog.json", { ...baseFixture("indeterminate-precedence"), selection: { isSelected: true, isIndeterminate: true, precedence: "indeterminate-over-selected" } });
  put("valid/desktop-token.spectrum-checkbox-catalog.json", { ...baseFixture("desktop-token"), tokenMode: "desktop" });
  put("review/standalone-label.spectrum-checkbox-catalog.json", { ...baseFixture("standalone-label"), reviewScenario: "standalone-label" });
  put("review/token-mode-unspecified.spectrum-checkbox-catalog.json", { ...baseFixture("token-mode-unspecified"), tokenMode: "unspecified" });
  put("review/activation-intent.spectrum-checkbox-catalog.json", { ...baseFixture("activation-intent"), reviewScenario: "activation-intent" });
  put("invalid/unknown-component.spectrum-checkbox-catalog.json", { ...baseFixture("unknown-component"), componentId: "Switch" });
  put("invalid/invented-action.spectrum-checkbox-catalog.json", { ...baseFixture("invented-action"), requestedAddition: "action" });
  put("invalid/keyboard-state-unmapped.spectrum-checkbox-catalog.json", { ...baseFixture("keyboard-state-unmapped"), stateMapping: { source: "keyboard-focus", target: "keyboard-focus" } });
  put("invalid/selection-precedence-missing.spectrum-checkbox-catalog.json", { ...baseFixture("selection-precedence-missing"), selection: { isSelected: true, isIndeterminate: true, precedence: null } });
  put("invalid/source-ref-missing.spectrum-checkbox-catalog.json", { ...baseFixture("source-ref-missing"), sourceRef: null });
  put("invalid/source-ref-undeclared.spectrum-checkbox-catalog.json", { ...baseFixture("source-ref-undeclared"), sourceRef: "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/switch.json#/" });
  put("invalid/policy-prose-executable.spectrum-checkbox-catalog.json", { ...baseFixture("policy-prose-executable"), policyText: "Checkboxes should always have a label.", requestedAddition: "executable-policy" });
  put("invalid/review-promoted.spectrum-checkbox-catalog.json", { ...baseFixture("review-promoted"), reviewScenario: "standalone-label", promotionRequest: "allowed" });
  const mutation = (mutationId, targetPath, mutationValue) => ({ schemaId: "spectrum-checkbox-catalog-preflight-mutation.v0", version: SCC_VERSION, mutationId, targetPath, mutation: mutationValue });
  put("mutations/missing-p2-evidence.spectrum-checkbox-catalog-preflight.json", mutation("missing-p2-evidence", SCC_P2_EVIDENCE_PATH, "missing"));
  put("mutations/nonpass-p2-evidence.spectrum-checkbox-catalog-preflight.json", mutation("nonpass-p2-evidence", SCC_P2_EVIDENCE_PATH, "nonpass"));
  put("mutations/tampered-p2-evidence.spectrum-checkbox-catalog-preflight.json", mutation("tampered-p2-evidence", SCC_P2_EVIDENCE_PATH, "hash-mismatch"));
  put("mutations/upstream-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("upstream-hash-mismatch", SCC_P2_CATALOG_PATH, "hash-mismatch"));
  put("mutations/source-byte-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("source-byte-hash-mismatch", SCC_COMPONENT_PATH, "hash-mismatch"));
  put("mutations/extra-source-path.spectrum-checkbox-catalog-preflight.json", mutation("extra-source-path", `${SCC_SOURCE_ROOT}/${SCC_PACKAGE_ROOT}/components/extra.json`, "extra-path"));
  put("mutations/source-lock-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("source-lock-hash-mismatch", SCC_LOCK_PATH, "hash-mismatch"));
  put("mutations/manifest-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("manifest-hash-mismatch", SCC_MANIFEST_PATH, "hash-mismatch"));
  put("mutations/mapping-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("mapping-hash-mismatch", SCC_MAPPING_PATHS[0], "hash-mismatch"));
  put("mutations/schema-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("schema-hash-mismatch", `${SCC_SCHEMA_ROOT}/spectrum-checkbox-catalog-fixture.v0.schema.json`, "hash-mismatch"));
  put("mutations/evidence-hash-mismatch.spectrum-checkbox-catalog-preflight.json", mutation("evidence-hash-mismatch", `${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json`, "hash-mismatch"));
  fixtures["expectations.manifest.json"] = {
    schemaId: "spectrum-checkbox-catalog-expectations.v0",
    version: SCC_VERSION,
    schemaRoot: SCC_SCHEMA_ROOT,
    sourceRoot: SCC_SOURCE_ROOT,
    fixtureRoot: SCC_FIXTURE_ROOT,
    inputs: [`${SCC_FIXTURE_ROOT}/expectations.manifest.json`, ...SCC_EXPECTATION_ROWS.map((row) => row.fixturePath)],
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: SCC_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required",
      componentIds: ["Button", "Checkbox", "InLineAlert"],
      addedComponentIds: ["Checkbox"],
      addedTokenIds: ["checkbox-control-size-medium-desktop"],
      matchedFixtureCount: SCC_EXPECTATION_ROWS.length
    }
  };
  return fixtures;
}

function buildSchemas() {
  const mappingRowSchema = {
    type: "object",
    additionalProperties: false,
    required: ["mappingId", "mappingKind", "normalizedId", "authorityScope", "reviewStatus", "sourceRefs", "mappingRefs", "targetRefs"],
    properties: {
      mappingId: string,
      mappingKind: { enum: ["component", "prop", "state", "accessibility", "constraint", "example", "token"] },
      normalizedId: string,
      authorityScope: { const: "mapping-narrows-source" },
      reviewStatus: { const: "accepted" },
      sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: string },
      mappingRefs: { type: "array", minItems: 1, uniqueItems: true, items: string },
      targetRefs: { type: "array", minItems: 1, uniqueItems: true, items: string },
      sourceValue: string,
      targetValue: string
    }
  };
  const reviewRowSchema = {
    type: "object",
    additionalProperties: false,
    required: ["mappingId", "condition", "promotionStatus", "executable", "reviewOwner", "rationale", "sourceRefs", "mappingRefs"],
    properties: {
      mappingId: string,
      condition: string,
      promotionStatus: { const: "review_required" },
      executable: { const: false },
      reviewOwner: { const: "design-systems-governance" },
      rationale: string,
      sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: string },
      mappingRefs: { type: "array", minItems: 1, uniqueItems: true, items: string }
    }
  };
  const sourceMappingProperties = {
    schemaId: { const: "spectrum-checkbox-source-mapping.v0" },
    version: { const: SCC_VERSION },
    mappingSetId: string,
    sourceManifestRef: { anyOf: [artifactRefSchema, { type: "null" }] },
    mappingRows: { type: "object", additionalProperties: mappingRowSchema },
    reviewRequired: { type: "object", additionalProperties: reviewRowSchema },
    provenance: provenanceSchema
  };
  const fixtureProperties = {
    schemaId: { const: "spectrum-checkbox-catalog-fixture.v0" }, version: { const: SCC_VERSION }, fixtureId: string,
    componentId: { anyOf: [{ const: "Checkbox" }, { type: "string" }] },
    sourceRef: nullableString,
    stateMapping: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["source", "target"], properties: { source: string, target: string } }] },
    tokenMode: { anyOf: [{ type: "null" }, { enum: ["desktop", "mobile", "unspecified"] }] },
    selection: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["isSelected", "isIndeterminate", "precedence"], properties: { isSelected: { type: "boolean" }, isIndeterminate: { type: "boolean" }, precedence: { anyOf: [{ const: "indeterminate-over-selected" }, { type: "null" }] } } }] },
    requestedAddition: { anyOf: [{ type: "null" }, { enum: ["action", "event", "slot", "data-binding", "variant", "prop", "token", "executable-policy"] }] },
    policyText: nullableString,
    reviewScenario: { anyOf: [{ type: "null" }, { enum: ["standalone-label", "activation-intent"] }] },
    promotionRequest: { anyOf: [{ type: "null" }, { enum: ["allowed", "review_required"] }] }
  };
  const reportEvidenceCore = {
    contractId: { const: SCC_CONTRACT_ID }, schemaId: string, version: { const: SCC_VERSION }, runId: string,
    checkedAt: { const: SCC_TIMESTAMP }, command: { const: SCC_COMMAND }, args: commandArgsSchema, environment: environmentSchema,
    boundaryRefs: { type: "array", minItems: 2, maxItems: 2, uniqueItems: true, items: artifactRefSchema },
    sourceInventoryRef: artifactRefSchema, sourceMappingRef: artifactRefSchema, catalogRef: artifactRefSchema,
    validationResults: { type: "array", minItems: SCC_EXPECTATION_ROWS.length, maxItems: SCC_EXPECTATION_ROWS.length, uniqueItems: true, items: validationResultSchema }, diagnostics: { type: "array", minItems: 1, uniqueItems: true, items: diagnosticSchema }, diagnosticsRegistry: { type: "array", minItems: SCC_DIAGNOSTIC_ROWS.length, maxItems: SCC_DIAGNOSTIC_ROWS.length, uniqueItems: true, items: diagnosticSchema },
    summary: {
      type: "object", additionalProperties: false,
      required: ["fixtureCount", "matchedFixtureCount", "baseComponentCount", "expandedComponentCount", "basePreservedCount", "addedComponentCount", "addedTokenCount", "reviewRequiredMappingCount"],
      properties: {
        fixtureCount: { const: SCC_EXPECTATION_ROWS.length }, matchedFixtureCount: { const: SCC_EXPECTATION_ROWS.length }, baseComponentCount: { const: 2 }, expandedComponentCount: { const: 3 }, basePreservedCount: { const: 11 }, addedComponentCount: { const: 1 }, addedTokenCount: { const: 1 }, reviewRequiredMappingCount: { const: 2 }
      }
    },
    catalogExpansion: {
      type: "object", additionalProperties: false,
      required: ["baseCatalogId", "expandedCatalogId", "catalogIdChanged", "baseCatalogHash", "expandedCatalogHash", "basePreservation", "addedComponentIds", "addedTokenIds", "runtimeCapabilitiesPreserved", "compatibilityPreserved"],
      properties: {
        baseCatalogId: { const: "surfaces-p2-governed-spectrum" }, expandedCatalogId: { const: "surfaces-spectrum-checkbox-catalog-governed" }, catalogIdChanged: { const: true },
        baseCatalogHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, expandedCatalogHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
        basePreservation: { type: "array", minItems: 11, maxItems: 11, uniqueItems: true, items: { type: "object", additionalProperties: false, required: ["pointer", "baseHash", "expandedHash", "matched"], properties: { pointer: string, baseHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, expandedHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, matched: { const: true } } } },
        addedComponentIds: { type: "array", const: ["Checkbox"] }, addedTokenIds: { type: "array", const: ["checkbox-control-size-medium-desktop"] }, runtimeCapabilitiesPreserved: { const: true }, compatibilityPreserved: { const: true }
      }
    },
    status: { const: "pass" }, promotionStatus: { const: "review_required" }, provenance: provenanceSchema
  };
  const schemas = {};
  schemas["spectrum-source-addendum-lock.v0.schema.json"] = schema("spectrum-source-addendum-lock.v0", {
    required: ["schemaId", "version", "packageName", "packageVersion", "packageTarball", "packageIntegrity", "tarballHashAlgorithm", "tarballSha256", "packageRoot", "selectedFiles", "reviewVerification", "provenance"],
    properties: {
      schemaId: { const: "spectrum-source-addendum-lock.v0" }, version: { const: SCC_VERSION }, packageName: { const: "@adobe/spectrum-design-data" }, packageVersion: { const: "0.7.0" },
      packageTarball: { const: SCC_PACKAGE_TARBALL }, packageIntegrity: { const: SCC_PACKAGE_INTEGRITY }, tarballHashAlgorithm: { const: "sha256" }, tarballSha256: { const: SCC_PACKAGE_TARBALL_SHA256 }, packageRoot: { const: SCC_PACKAGE_ROOT },
      selectedFiles: { type: "array", minItems: 1, maxItems: 1, prefixItems: [{ type: "object", additionalProperties: false, required: ["packagePath", "hashAlgorithm", "sha256"], properties: { packagePath: { const: "components/checkbox.json" }, hashAlgorithm: { const: "sha256" }, sha256: { const: SCC_COMPONENT_RAW_SHA256 } } }], items: false },
      reviewVerification: { type: "object", additionalProperties: false, required: ["method", "verifiedAt", "checks", "ordinaryMaterialization"], properties: { method: { const: "review-time-tarball-verification" }, verifiedAt: { const: "2026-07-18T00:00:00.000Z" }, checks: { const: ["npm-sha512-sri", "tarball-sha256", "selected-file-raw-sha256"] }, ordinaryMaterialization: { const: "local-lock-conformance-only" } } },
      provenance: { type: "object", additionalProperties: false, required: ["generator", "sourceRefs"], properties: { generator: { const: "surfaces-spectrum-source-addendum-review" }, sourceRefs: { const: [SCC_PACKAGE_TARBALL, CHECKBOX_SOURCE_REF] } } }
    }
  });
  schemas["spectrum-checkbox-source-manifest.v0.schema.json"] = schema("spectrum-checkbox-source-manifest.v0", {
    required: ["schemaId", "version", "targetId", "designSystemId", "packageName", "packageVersion", "componentSubset", "sourceRefGrammar", "baseP2Boundary", "sourceAddendumLock", "sourceFiles", "reusedP2SourceFiles", "includedPointers", "requiredMappings", "policyRefs", "environment", "provenance"],
    properties: {
      schemaId: { const: "spectrum-checkbox-source-manifest.v0" }, version: { const: SCC_VERSION }, targetId: { const: "spectrum-checkbox-catalog" }, designSystemId: { const: "adobe-spectrum" }, packageName: { const: "@adobe/spectrum-design-data" }, packageVersion: { const: "0.7.0" }, componentSubset: { const: ["checkbox"] }, sourceRefGrammar: string,
      baseP2Boundary: { type: "object", additionalProperties: false, required: ["evidenceRef", "catalogRef"], properties: { evidenceRef: artifactRefSchema, catalogRef: artifactRefSchema } },
      sourceAddendumLock: { type: "object", additionalProperties: false, required: ["path", "schemaId", "hashAlgorithm", "sha256"], properties: { path: { const: SCC_LOCK_PATH }, schemaId: { const: "spectrum-source-addendum-lock.v0" }, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" } } },
      sourceFiles: { type: "array", minItems: 1, maxItems: 1, items: { type: "object", additionalProperties: false, required: ["path", "packagePath", "sourceType", "hashAlgorithm", "sha256", "sourceRefRoot"], properties: { path: { const: SCC_COMPONENT_PATH }, packagePath: { const: "components/checkbox.json" }, sourceType: { const: "component" }, hashAlgorithm: { const: "sha256" }, sha256: { const: SCC_COMPONENT_RAW_SHA256 }, sourceRefRoot: { const: CHECKBOX_SOURCE_REF } } } },
      reusedP2SourceFiles: { type: "array", minItems: 2, maxItems: 2, items: { type: "object", additionalProperties: false, required: ["path", "hashAlgorithm", "sha256", "sourceRef"], properties: { path: string, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" }, sourceRef: string } } },
      includedPointers: { type: "array", minItems: 14, uniqueItems: true, items: string },
      requiredMappings: { type: "array", minItems: 2, maxItems: 2, items: { type: "object", additionalProperties: false, required: ["path", "schemaId", "hashAlgorithm", "sha256", "mappingRefRoot"], properties: { path: string, schemaId: { const: "spectrum-checkbox-source-mapping.v0" }, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" }, mappingRefRoot: string } } },
      policyRefs: { type: "array", minItems: 3, uniqueItems: true, items: string }, environment: environmentSchema, provenance: provenanceSchema
    }
  });
  schemas["spectrum-checkbox-source-mapping.v0.schema.json"] = schema("spectrum-checkbox-source-mapping.v0", { required: Object.keys(sourceMappingProperties), properties: sourceMappingProperties });
  schemas["spectrum-checkbox-source-inventory.v0.schema.json"] = schema("spectrum-checkbox-source-inventory.v0", {
    required: ["schemaId", "version", "sourceManifestRef", "upstreamBoundaryRefs", "sourceFiles", "reusedSourceFiles", "coverage", "provenance"],
    properties: {
      schemaId: { const: "spectrum-checkbox-source-inventory.v0" }, version: { const: SCC_VERSION }, sourceManifestRef: artifactRefSchema, upstreamBoundaryRefs: { type: "array", minItems: 2, items: artifactRefSchema }, sourceFiles: { type: "array", minItems: 2, items: artifactRefSchema }, reusedSourceFiles: { type: "array", minItems: 2, items: artifactRefSchema },
      coverage: { type: "object", additionalProperties: false, required: ["componentIds", "propIds", "stateIds", "accessibilityFactCount", "exampleCount", "mappedTokenIds", "outOfScopeTokenBindingCount", "guidanceBlockCount"], properties: { componentIds: { const: ["Checkbox"] }, propIds: { type: "array", minItems: 7, items: string }, stateIds: { const: ["down", "hover", "keyboardFocus"] }, accessibilityFactCount: { const: 5 }, exampleCount: { const: 1 }, mappedTokenIds: { const: ["checkbox-control-size-medium-desktop"] }, outOfScopeTokenBindingCount: { const: 59 }, guidanceBlockCount: { const: 17 } } }, provenance: provenanceSchema
    }
  });
  schemas["spectrum-checkbox-catalog-fixture.v0.schema.json"] = schema("spectrum-checkbox-catalog-fixture.v0", { required: Object.keys(fixtureProperties), properties: fixtureProperties });
  schemas["spectrum-checkbox-catalog-preflight-mutation.v0.schema.json"] = schema("spectrum-checkbox-catalog-preflight-mutation.v0", { required: ["schemaId", "version", "mutationId", "targetPath", "mutation"], properties: { schemaId: { const: "spectrum-checkbox-catalog-preflight-mutation.v0" }, version: { const: SCC_VERSION }, mutationId: string, targetPath: string, mutation: { enum: ["missing", "nonpass", "hash-mismatch", "extra-path"] } } });
  schemas["spectrum-checkbox-catalog-expectations.v0.schema.json"] = schema("spectrum-checkbox-catalog-expectations.v0", {
    required: ["schemaId", "version", "schemaRoot", "sourceRoot", "fixtureRoot", "inputs", "diagnosticsRegistry", "expectations", "runExpectation"],
    properties: {
      schemaId: { const: "spectrum-checkbox-catalog-expectations.v0" }, version: { const: SCC_VERSION }, schemaRoot: { const: SCC_SCHEMA_ROOT }, sourceRoot: { const: SCC_SOURCE_ROOT }, fixtureRoot: { const: SCC_FIXTURE_ROOT }, inputs: { type: "array", minItems: SCC_EXPECTATION_ROWS.length + 1, uniqueItems: true, items: string }, diagnosticsRegistry: { type: "array", minItems: SCC_DIAGNOSTIC_ROWS.length, items: diagnosticSchema },
      expectations: { type: "array", minItems: SCC_EXPECTATION_ROWS.length, items: { type: "object", additionalProperties: false, required: ["fixturePath", "kind", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"], properties: { fixturePath: string, kind: { enum: ["valid", "review", "invalid", "mutation"] }, expectedResult: { enum: ["valid", "review_required", "invalid"] }, promotionStatus: status, diagnosticCodes: { type: "array", items: string }, artifactPath: string, jsonPointer: string } } },
      runExpectation: { type: "object", additionalProperties: false, required: ["status", "promotionStatus", "componentIds", "addedComponentIds", "addedTokenIds", "matchedFixtureCount"], properties: { status: { const: "pass" }, promotionStatus: { const: "review_required" }, componentIds: { const: ["Button", "Checkbox", "InLineAlert"] }, addedComponentIds: { const: ["Checkbox"] }, addedTokenIds: { const: ["checkbox-control-size-medium-desktop"] }, matchedFixtureCount: { const: SCC_EXPECTATION_ROWS.length } } }
    }
  });
  schemas["spectrum-checkbox-catalog-diagnostics.v0.schema.json"] = schema("spectrum-checkbox-catalog-diagnostics.v0", { required: ["schemaId", "version", "diagnostics"], properties: { schemaId: { const: "spectrum-checkbox-catalog-diagnostics.v0" }, version: { const: SCC_VERSION }, diagnostics: { type: "array", items: diagnosticSchema } } });
  schemas["spectrum-checkbox-catalog-report.v0.schema.json"] = schema("spectrum-checkbox-catalog-report.v0", { required: [...Object.keys(reportEvidenceCore)], properties: { ...reportEvidenceCore, schemaId: { const: "spectrum-checkbox-catalog-report.v0" } } });
  schemas["spectrum-checkbox-catalog-evidence.v0.schema.json"] = schema("spectrum-checkbox-catalog-evidence.v0", {
    required: [...Object.keys(reportEvidenceCore), "schemaClosure", "sourceFileRefs", "fixtureRefs", "implementationRefs", "artifactRefs", "reportRef"],
    properties: { ...reportEvidenceCore, schemaId: { const: "spectrum-checkbox-catalog-evidence.v0" }, schemaClosure: { type: "array", minItems: SCC_SCHEMA_FILES.length + SCC_SHARED_SCHEMA_FILES.length, maxItems: SCC_SCHEMA_FILES.length + SCC_SHARED_SCHEMA_FILES.length, uniqueItems: true, items: artifactRefSchema }, sourceFileRefs: { type: "array", minItems: 7, maxItems: 7, uniqueItems: true, items: artifactRefSchema }, fixtureRefs: { type: "array", minItems: SCC_EXPECTATION_ROWS.length + 1, maxItems: SCC_EXPECTATION_ROWS.length + 1, uniqueItems: true, items: artifactRefSchema }, implementationRefs: { type: "array", minItems: SCC_IMPLEMENTATION_FILES.length, maxItems: SCC_IMPLEMENTATION_FILES.length, uniqueItems: true, items: artifactRefSchema }, artifactRefs: { type: "array", minItems: SCC_GENERATED_ARTIFACTS.length, maxItems: SCC_GENERATED_ARTIFACTS.length, uniqueItems: true, items: artifactRefSchema }, reportRef: artifactRefSchema }
  });
  return schemas;
}

function baseFixture(fixtureId) {
  return {
    schemaId: "spectrum-checkbox-catalog-fixture.v0",
    version: SCC_VERSION,
    fixtureId,
    componentId: "Checkbox",
    sourceRef: CHECKBOX_SOURCE_REF,
    stateMapping: { source: "keyboard-focus", target: "keyboardFocus" },
    tokenMode: "desktop",
    selection: { isSelected: false, isIndeterminate: false, precedence: "indeterminate-over-selected" },
    requestedAddition: null,
    policyText: null,
    reviewScenario: null,
    promotionRequest: null
  };
}

function schema(id, body) {
  return { $schema: "https://json-schema.org/draft/2020-12/schema", $id: `https://surfaces.dev/schemas/spectrum-checkbox-catalog/${id}.schema.json`, type: "object", additionalProperties: false, ...body };
}

function diagnostic(code, canonicalMessage, severity, stage, phase, promotionStatus, fixtureCoverage, jsonPointer) {
  return { code, canonicalMessage, severity, stage, phase, promotionStatus, artifactPath: `${SCC_FIXTURE_ROOT}/${fixtureCoverage}`, jsonPointer, sourceRef: fixtureCoverage.includes("source-ref") ? null : CHECKBOX_SOURCE_REF, fixtureCoverage, diagnosticSource: `spectrum-checkbox-catalog-${stage}` };
}

function expectation(relative, kind, expectedResult, promotionStatus, diagnosticCodes) {
  return { fixturePath: `${SCC_FIXTURE_ROOT}/${relative}`, kind, expectedResult, promotionStatus, diagnosticCodes, artifactPath: kind === "valid" ? `${SCC_ARTIFACT_ROOT}/governed-catalog.json` : kind === "review" ? `${SCC_ARTIFACT_ROOT}/spectrum-checkbox-catalog-report.json` : `${SCC_FIXTURE_ROOT}/${relative}`, jsonPointer: "/" };
}

async function collectRegularFiles(root) {
  const result = [];
  async function walk(current, relative) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const nextPath = path.join(current, entry.name);
      const stat = await fs.lstat(nextPath);
      if (stat.isSymbolicLink()) throw new Error("The Checkbox source addendum contains an undeclared or unsafe package path.");
      if (stat.isDirectory()) await walk(nextPath, nextRelative);
      else if (stat.isFile()) result.push(nextRelative);
      else throw new Error("The Checkbox source addendum contains an undeclared or unsafe package path.");
    }
  }
  await walk(root, "");
  return result;
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifactRefs?.find((ref) => ref.path === SCC_P2_EVIDENCE_PATH);
  if (!finalRef) throw new Error("Accepted P2 evidence is missing its final self-hash reference.");
  finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function assertSafeDirectoryPath(cwd, relativePath) {
  let current = cwd;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("The Checkbox source addendum contains an undeclared or unsafe package path.");
  }
}

async function assertSafeRegularFilePath(cwd, relativePath) {
  const segments = relativePath.split("/");
  await assertSafeDirectoryPath(cwd, segments.slice(0, -1).join("/"));
  const stat = await fs.lstat(path.join(cwd, relativePath));
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("The Checkbox source addendum contains an undeclared or unsafe package path.");
}

async function assertSafeOutputPath(cwd, relativePath) {
  const segments = relativePath.split("/");
  let current = cwd;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    try {
      const stat = await fs.lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe Checkbox materialization path: ${relativePath}`);
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
  try {
    const stat = await fs.lstat(path.join(cwd, relativePath));
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error(`Unsafe Checkbox materialization path: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
