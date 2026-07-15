import path from "node:path";
import { deepClone, readJson, writeCanonicalJson } from "./p2-contract.js";
import {
  SC_ARTIFACT_ROOT,
  SC_CONSUMED_SCHEMA_FILES,
  SC_SCHEMA_FILES,
  SC_SOURCE_ROOT
} from "./source-conformance-contract.js";

export const SFP_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SFP_VERSION = "0.0.0";
export const SFP_SCHEMA_ROOT = "schemas";
export const SFP_FIXTURE_ROOT = "fixtures/source-family-packaging";
export const SFP_PACKAGE_PATH = `${SFP_FIXTURE_ROOT}/package.fixture.json`;
export const SFP_ARTIFACT_ROOT = "artifacts/source-family-packaging";
export const SFP_COMMAND = "interfacectl surfaces source-family-packaging proof";
export const SFP_CONTRACT_ID = "surfaces-source-family-packaging-proof";
export const SFP_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SFP_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const SFP_PRIMARY_EVIDENCE_PATH = "artifacts/source-conformance/evidence.json";
export const SFP_PRIMARY_CATALOG_PATH = "artifacts/source-conformance/governed-catalog.json";
export const SFP_CANDIDATE_SOURCE_ROOT = "sources/source-family-packaging/team-owned-authority-bundle";

export const SFP_ENVIRONMENT = Object.freeze({ generatedAt: SFP_TIMESTAMP, host: null });

export const SFP_SCHEMA_FILES = [
  "source-family-package.v0.schema.json",
  "source-family-packaging-fixture.v0.schema.json",
  "source-family-packaging-expectations.v0.schema.json",
  "source-family-packaging-diagnostics.v0.schema.json",
  "source-family-packaging-report.v0.schema.json",
  "source-family-packaging-evidence.v0.schema.json"
];

export const SFP_CONSUMED_SCHEMA_FILES = [...SC_SCHEMA_FILES, ...SC_CONSUMED_SCHEMA_FILES];

export const SFP_CAPTURED_ARTIFACTS = [
  ["candidate-source-inventory.json", "declared-source-inventory.v0", "source-inventory.json"],
  ["candidate-source-fact-coverage.json", "source-fact-coverage.v0", "source-fact-coverage.json"],
  ["candidate-source-authority-map.json", "source-authority-map.v0", "source-authority-map.json"],
  ["candidate-source-review-queue.json", "source-review-queue.v0", "source-review-queue.json"],
  ["candidate-governed-catalog.json", "runtime-catalog.v0", "governed-catalog.json"],
  ["candidate-authority-connection-report.json", "authority-connection-report.v0", "authority-connection-report.json"],
  ["candidate-source-conformance-report.json", "source-conformance-report.v0", "source-conformance-report.json"],
  ["candidate-source-conformance-evidence.json", "source-conformance-evidence.v0", "evidence.json"]
];

export const SFP_GENERATED_ARTIFACTS = [
  ...SFP_CAPTURED_ARTIFACTS.map(([file]) => file),
  "source-family-packaging-report.json",
  "evidence.json"
];

export const SFP_ARTIFACT_PATHS = SFP_GENERATED_ARTIFACTS.map((file) => `${SFP_ARTIFACT_ROOT}/${file}`);

export const SFP_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "SOURCE_FAMILY_COMPILER_HASH_MISMATCH",
    canonicalMessage: "Source-family package compiler hash does not match the checked implementation.",
    stage: "preflight",
    phase: "source-family-compiler",
    severity: "error",
    promotionStatus: "blocked",
    validationResult: "invalid",
    artifactPath: `${SFP_FIXTURE_ROOT}/mutations/compiler-hash-mismatch.source-family-packaging.json`,
    jsonPointer: "/compilerRef/hash",
    suggestedAction: "Review compiler changes explicitly or restore the checked compiler implementation before packaging proof continues."
  }),
  diagnosticRow({
    code: "SOURCE_FAMILY_BUNDLE_HASH_MISMATCH",
    canonicalMessage: "Source-family package manifest or source bytes do not match the checked bundle.",
    stage: "source-inventory",
    phase: "source-family-bundle",
    severity: "error",
    promotionStatus: "blocked",
    validationResult: "invalid",
    artifactPath: `${SFP_FIXTURE_ROOT}/mutations/source-hash-mismatch.source-family-packaging.json`,
    jsonPointer: "/sourceRef/hash",
    suggestedAction: "Restore the checked bundle bytes or update the manifest through explicit review."
  }),
  diagnosticRow({
    code: "SOURCE_FAMILY_SCOPE_EXPANSION",
    canonicalMessage: "Source-family package attempts to expand the accepted P2 component or capability boundary.",
    stage: "conformance",
    phase: "source-family-authority",
    severity: "error",
    promotionStatus: "blocked",
    validationResult: "invalid",
    artifactPath: `${SFP_FIXTURE_ROOT}/invalid/authority-expansion.source-family-packaging.json`,
    jsonPointer: "/requestedComponentIds",
    suggestedAction: "Limit the package to Button and InLineAlert or add a separate ingestion proof before expanding authority."
  }),
  diagnosticRow({
    code: "SOURCE_FAMILY_REVIEW_REQUIRED",
    canonicalMessage: "Source-family package preserves a non-executable team-owned exception for owner review.",
    stage: "review",
    phase: "source-family-review",
    severity: "review",
    promotionStatus: "review_required",
    validationResult: "review_required",
    artifactPath: `${SFP_FIXTURE_ROOT}/review/team-exception.source-family-packaging.json`,
    jsonPointer: "/review",
    suggestedAction: "Keep the exception outside the catalog until the declared owner completes review."
  }),
  diagnosticRow({
    code: "SOURCE_FAMILY_COMPILER_RUN_FAILED",
    canonicalMessage: "The unchanged source-conformance compiler did not produce a passing packaged-bundle result.",
    stage: "compile",
    phase: "source-family-compiler-run",
    severity: "error",
    promotionStatus: "blocked",
    validationResult: "invalid",
    artifactPath: `${SFP_ARTIFACT_ROOT}/source-family-packaging-report.json`,
    jsonPointer: "/candidateRun/status",
    suggestedAction: "Inspect the captured compiler diagnostics and correct the checked bundle without adding family-specific compiler logic."
  }),
  diagnosticRow({
    code: "SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH",
    canonicalMessage: "Source-family packaging evidence hash does not match its checked inputs or generated artifacts.",
    stage: "evidence",
    phase: "source-family-evidence",
    severity: "error",
    promotionStatus: "blocked",
    validationResult: "invalid",
    artifactPath: `${SFP_FIXTURE_ROOT}/mutations/evidence-hash-mismatch.source-family-packaging.json`,
    jsonPointer: "/artifactRef/hash",
    suggestedAction: "Regenerate the packaging proof from checked compiler, bundle, fixture, and upstream bytes."
  })
];

export const SFP_EXPECTATION_ROWS = [
  expectationRow("valid/candidate-bundle.source-family-packaging.json", "valid", "package", "source-family-package", "valid", "allowed", []),
  expectationRow("review/team-exception.source-family-packaging.json", "review", "review", "source-family-review", "review_required", "review_required", ["SOURCE_FAMILY_REVIEW_REQUIRED"]),
  expectationRow("invalid/authority-expansion.source-family-packaging.json", "invalid", "conformance", "source-family-authority", "invalid", "blocked", ["SOURCE_FAMILY_SCOPE_EXPANSION"]),
  expectationRow("mutations/compiler-hash-mismatch.source-family-packaging.json", "mutation", "preflight", "source-family-compiler", "invalid", "blocked", ["SOURCE_FAMILY_COMPILER_HASH_MISMATCH"]),
  expectationRow("mutations/source-hash-mismatch.source-family-packaging.json", "mutation", "source-inventory", "source-family-bundle", "invalid", "blocked", ["SOURCE_FAMILY_BUNDLE_HASH_MISMATCH"]),
  expectationRow("mutations/evidence-hash-mismatch.source-family-packaging.json", "mutation", "evidence", "source-family-evidence", "invalid", "blocked", ["SOURCE_FAMILY_EVIDENCE_HASH_MISMATCH"])
];

export function sfpSchemaPaths() {
  return [...SFP_SCHEMA_FILES, ...SFP_CONSUMED_SCHEMA_FILES].map((file) => `${SFP_SCHEMA_ROOT}/${file}`);
}

export function sfpFixturePaths() {
  return [
    SFP_PACKAGE_PATH,
    `${SFP_FIXTURE_ROOT}/expectations.manifest.json`,
    ...SFP_EXPECTATION_ROWS.map((row) => row.fixturePath)
  ];
}

export function sfpSourcePaths(packageFixture, manifest) {
  return [
    packageFixture.candidateBundle.manifestPath,
    ...manifest.sourceFiles.map((entry) => `${packageFixture.candidateBundle.sourceRoot}/${entry.path}`)
  ];
}

export function sfpArtifactOrder(packageFixture, manifest) {
  return [
    ...sfpSchemaPaths(),
    ...sfpSourcePaths(packageFixture, manifest),
    ...sfpFixturePaths(),
    ...packageFixture.compiler.implementationRefs.map((ref) => ref.path),
    ...packageFixture.compiler.runtime.dependencyRefs.map((ref) => ref.path),
    packageFixture.upstream.ingestionEvidencePath,
    packageFixture.upstream.catalogPath,
    packageFixture.acceptedPrimary.evidencePath,
    packageFixture.acceptedPrimary.governedCatalogPath,
    ...SFP_ARTIFACT_PATHS
  ];
}

export function sfpSchemaIdForPath(artifactPath) {
  const file = artifactPath.split("/").at(-1);
  if (SFP_SCHEMA_FILES.includes(file) || SFP_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath === SFP_P2_EVIDENCE_PATH) return "design-system-ingestion-evidence.v0";
  if (artifactPath === SFP_P2_CATALOG_PATH || artifactPath === SFP_PRIMARY_CATALOG_PATH) return "runtime-catalog.v0";
  if (artifactPath === SFP_PRIMARY_EVIDENCE_PATH) return "source-conformance-evidence.v0";
  if (artifactPath === SFP_PACKAGE_PATH) return "source-family-package.v0";
  if (file === "expectations.manifest.json") return "source-family-packaging-expectations.v0";
  if (file?.endsWith(".source-family-packaging.json")) return "source-family-packaging-fixture.v0";
  const captured = SFP_CAPTURED_ARTIFACTS.find(([capturedFile]) => capturedFile === file);
  if (captured) return captured[1];
  if (file === "source-family-packaging-report.json") return "source-family-packaging-report.v0";
  if (artifactPath === `${SFP_ARTIFACT_ROOT}/evidence.json`) return "source-family-packaging-evidence.v0";
  if (file === "manifest.json") return "declared-source-manifest.v0";
  if (file === "authority-profile.json") return "source-authority-profile.v0";
  return "declared-source-document.v0";
}

export async function materializeSourceFamilyPackagingContract(cwd) {
  const packageFixture = await readJson(path.join(cwd, SFP_PACKAGE_PATH));
  const manifest = await readJson(path.join(cwd, packageFixture.candidateBundle.manifestPath));
  const profile = await readJson(path.join(cwd, packageFixture.candidateBundle.sourceRoot, packageFixture.candidateBundle.authorityProfilePath));
  for (const [file, schema] of Object.entries(buildSourceFamilyPackagingSchemas())) {
    await writeCanonicalJson(path.join(cwd, SFP_SCHEMA_ROOT, file), schema);
  }
  const fixtures = buildSourceFamilyPackagingFixtures(packageFixture, manifest, profile);
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, SFP_FIXTURE_ROOT, file), fixture);
  }
}

export function sfpCandidateEvidenceRemap() {
  return {
    logicalSourceRoot: SC_SOURCE_ROOT,
    physicalSourceRoot: SFP_CANDIDATE_SOURCE_ROOT,
    artifactMappings: SFP_CAPTURED_ARTIFACTS.map(([capturedFile, , innerFile]) => ({
      logicalPath: `${SC_ARTIFACT_ROOT}/${innerFile}`,
      persistedPath: `${SFP_ARTIFACT_ROOT}/${capturedFile}`
    })),
    verifiedAfterTemporaryWorkspaceRemoval: true
  };
}

export function sfpReferencedReviewRoutes(profile) {
  const routeIds = [...new Set([
    ...profile.componentBindings.map((binding) => binding.reviewRouteId),
    ...profile.exceptions.map((exception) => exception.reviewRouteId)
  ].filter((routeId) => routeId !== null))].sort();
  const routesById = new Map(profile.reviewRoutes.map((route) => [route.routeId, route]));
  const routes = routeIds.map((routeId) => routesById.get(routeId)).filter(Boolean);
  const owners = [...new Set(routes.map((route) => route.owner))].sort();
  return {
    routeIds,
    routes,
    owners,
    valid: routes.length === routeIds.length && routes.every((route) => route.executable === false) && owners.length === 1
  };
}

export function buildSourceFamilyPackagingSchemas() {
  return {
    "source-family-package.v0.schema.json": sourceFamilyPackageSchema(),
    "source-family-packaging-fixture.v0.schema.json": sourceFamilyPackagingFixtureSchema(),
    "source-family-packaging-expectations.v0.schema.json": sourceFamilyPackagingExpectationsSchema(),
    "source-family-packaging-diagnostics.v0.schema.json": sourceFamilyPackagingDiagnosticsSchema(),
    "source-family-packaging-report.v0.schema.json": sourceFamilyPackagingReportSchema(),
    "source-family-packaging-evidence.v0.schema.json": sourceFamilyPackagingEvidenceSchema()
  };
}

export function buildSourceFamilyPackagingFixtures(packageFixture, manifest, profile) {
  const compilerRef = packageFixture.compiler.implementationRefs.find((ref) => ref.path.endsWith("source-conformance-proof.js"));
  const sourceEntry = manifest.sourceFiles.find((entry) => entry.path === "components/button.json");
  const reviewResolution = sfpReferencedReviewRoutes(profile);
  if (!reviewResolution.valid) throw new Error("source-family package referenced review route closure is invalid");
  const route = reviewResolution.routes[0];
  const exception = profile.exceptions[0];
  const expectedComponentIds = packageFixture.candidateBundle.expectedComponentIds;
  const base = (fixtureId, caseType) => ({
    schemaId: "source-family-packaging-fixture.v0",
    version: SFP_VERSION,
    fixtureId,
    caseType,
    packageId: packageFixture.packageId,
    requestedComponentIds: [...expectedComponentIds],
    compilerRef: null,
    sourceRef: null,
    artifactRef: null,
    review: null,
    provenance: provenance("interfacectl-source-family-packaging-materialize", [SFP_PACKAGE_PATH])
  });
  const valid = base("candidate-bundle", "valid-package");
  const review = base("team-exception", "review-required");
  review.review = {
    exceptionId: exception.exceptionId,
    owner: route.owner,
    rationale: route.rationale,
    expiresAt: route.expiresAt,
    executable: false
  };
  const expansion = base("authority-expansion", "authority-expansion");
  expansion.requestedComponentIds = [...expectedComponentIds, "Card"];
  const compilerMutation = base("compiler-hash-mismatch", "compiler-hash-mismatch");
  compilerMutation.compilerRef = { ...compilerRef, hash: "0".repeat(64) };
  const sourceMutation = base("source-hash-mismatch", "source-hash-mismatch");
  sourceMutation.sourceRef = artifactRef(
    `${packageFixture.candidateBundle.sourceRoot}/${sourceEntry.path}`,
    "declared-source-document.v0",
    "0".repeat(64),
    sourceEntry.sourceRefRoot
  );
  const evidenceMutation = base("evidence-hash-mismatch", "evidence-hash-mismatch");
  evidenceMutation.artifactRef = artifactRef(
    `${SFP_ARTIFACT_ROOT}/candidate-source-conformance-report.json`,
    "source-conformance-report.v0",
    "0".repeat(64)
  );
  return {
    "expectations.manifest.json": expectationsManifest(packageFixture, manifest),
    "valid/candidate-bundle.source-family-packaging.json": valid,
    "review/team-exception.source-family-packaging.json": review,
    "invalid/authority-expansion.source-family-packaging.json": expansion,
    "mutations/compiler-hash-mismatch.source-family-packaging.json": compilerMutation,
    "mutations/source-hash-mismatch.source-family-packaging.json": sourceMutation,
    "mutations/evidence-hash-mismatch.source-family-packaging.json": evidenceMutation
  };
}

export function diagnosticsRegistry() {
  return deepClone(SFP_DIAGNOSTIC_ROWS);
}

export function artifactRef(pathValue, schemaId, hash, sourceRef = null, extra = {}) {
  return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash, sourceRef, ...extra };
}

export function provenance(generator, sourceRefs) {
  return { generatedAt: SFP_TIMESTAMP, generator, sourceRefs };
}

function expectationsManifest(packageFixture, manifest) {
  return {
    schemaId: "source-family-packaging-expectations.v0",
    version: SFP_VERSION,
    packagePath: SFP_PACKAGE_PATH,
    fixtureRoot: SFP_FIXTURE_ROOT,
    artifactRoot: SFP_ARTIFACT_ROOT,
    schemaRoot: SFP_SCHEMA_ROOT,
    inputs: sfpFixturePaths(),
    artifactOrder: sfpArtifactOrder(packageFixture, manifest),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: SFP_EXPECTATION_ROWS,
    runExpectation: { status: "pass", promotionStatus: "review_required" }
  };
}

function diagnosticRow(row) {
  return {
    ...row,
    diagnosticSource: "source-family-packaging-validator",
    sourceRef: null,
    fixtureCoverage: row.artifactPath.startsWith(`${SFP_FIXTURE_ROOT}/`)
      ? row.artifactPath.slice(`${SFP_FIXTURE_ROOT}/`.length)
      : null
  };
}

function expectationRow(relativePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes) {
  const fixturePath = `${SFP_FIXTURE_ROOT}/${relativePath}`;
  return { fixturePath, kind, stage, phase, expectedResult, promotionStatus, diagnosticCodes, artifactPath: fixturePath, jsonPointer: "/" };
}

function objectSchema(schemaId, properties, required, options = {}) {
  const schema = { type: "object", additionalProperties: false, properties, required, ...options };
  if (schemaId) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/source-family-packaging/${schemaId}.schema.json`;
  }
  return schema;
}

function nullable(schema) {
  return { anyOf: [schema, { type: "null" }] };
}

function artifactRefSchema(options = {}) {
  const properties = {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: options.nullableHash ? { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" } : { type: "string", pattern: "^[0-9a-f]{64}$" },
    sourceRef: { type: ["string", "null"] }
  };
  if (options.provenance) properties.provenance = provenanceSchema();
  if (options.sourceEvidenceHash) properties.sourceEvidenceHash = { type: "string", pattern: "^[0-9a-f]{64}$" };
  return objectSchema(null, properties, ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef", ...(options.provenance ? ["provenance"] : [])]);
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: SFP_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function environmentSchema() {
  return objectSchema(null, { generatedAt: { const: SFP_TIMESTAMP }, host: { type: "null" } }, ["generatedAt", "host"]);
}

function sourceFamilyPackageSchema() {
  const compilerRef = objectSchema(null, {
    path: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  }, ["path", "hashAlgorithm", "hash"]);
  return objectSchema("source-family-package.v0", {
    schemaId: { const: "source-family-package.v0" },
    version: { type: "string" },
    packageId: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
    candidateBundle: objectSchema(null, {
      sourceRoot: { type: "string" }, manifestPath: { type: "string" }, manifestHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
      authorityProfilePath: { const: "governance/authority-profile.json" }, expectedSourceBundleId: { type: "string" }, expectedProfileId: { type: "string" },
      expectedOwner: { type: "string" }, expectedComponentIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } },
      expectedPromotionStatus: { const: "review_required" }
    }, ["sourceRoot", "manifestPath", "manifestHash", "authorityProfilePath", "expectedSourceBundleId", "expectedProfileId", "expectedOwner", "expectedComponentIds", "expectedPromotionStatus"]),
    compiler: objectSchema(null, {
      command: { const: "interfacectl surfaces source-conformance proof" },
      implementationRefs: { type: "array", minItems: 7, maxItems: 7, uniqueItems: true, items: compilerRef },
      runtime: objectSchema(null, {
        nodeMajor: { const: 22 },
        dependencyRefs: { type: "array", minItems: 2, maxItems: 2, uniqueItems: true, items: compilerRef }
      }, ["nodeMajor", "dependencyRefs"]),
      familySpecificModule: { type: "null" },
      virtualLayout: objectSchema(null, {
        sourceRoot: { const: "sources/source-conformance/declared-source-bundle" },
        fixtureRoot: { const: "fixtures/source-conformance" },
        artifactRoot: { const: "artifacts/source-conformance" },
        sourceRefNamespace: { const: "declared-source://source-conformance/" }
      }, ["sourceRoot", "fixtureRoot", "artifactRoot", "sourceRefNamespace"])
    }, ["command", "implementationRefs", "runtime", "familySpecificModule", "virtualLayout"]),
    upstream: objectSchema(null, {
      ingestionEvidencePath: { const: SFP_P2_EVIDENCE_PATH }, catalogPath: { const: SFP_P2_CATALOG_PATH }
    }, ["ingestionEvidencePath", "catalogPath"]),
    acceptedPrimary: objectSchema(null, {
      evidencePath: { const: SFP_PRIMARY_EVIDENCE_PATH }, governedCatalogPath: { const: SFP_PRIMARY_CATALOG_PATH }
    }, ["evidencePath", "governedCatalogPath"]),
    environment: environmentSchema(),
    provenance: provenanceSchema()
  }, ["schemaId", "version", "packageId", "candidateBundle", "compiler", "upstream", "acceptedPrimary", "environment", "provenance"]);
}

function sourceFamilyPackagingFixtureSchema() {
  return objectSchema("source-family-packaging-fixture.v0", {
    schemaId: { const: "source-family-packaging-fixture.v0" }, version: { type: "string" }, fixtureId: { type: "string" },
    caseType: { enum: ["valid-package", "review-required", "authority-expansion", "compiler-hash-mismatch", "source-hash-mismatch", "evidence-hash-mismatch"] },
    packageId: { type: "string" }, requestedComponentIds: { type: "array", uniqueItems: true, items: { type: "string" } },
    compilerRef: nullable(objectSchema(null, { path: { type: "string" }, hashAlgorithm: { const: "sha256" }, hash: { type: "string", pattern: "^[0-9a-f]{64}$" } }, ["path", "hashAlgorithm", "hash"])),
    sourceRef: nullable(artifactRefSchema()), artifactRef: nullable(artifactRefSchema()),
    review: nullable(objectSchema(null, {
      exceptionId: { type: "string" }, owner: { type: "string" }, rationale: { type: "string" }, expiresAt: { type: "string" }, executable: { const: false }
    }, ["exceptionId", "owner", "rationale", "expiresAt", "executable"])),
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "caseType", "packageId", "requestedComponentIds", "compilerRef", "sourceRef", "artifactRef", "review", "provenance"]);
}

function expectationRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" }, kind: { type: "string" }, stage: { type: "string" }, phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] }, promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnosticCodes: { type: "array", items: { type: "string" } }, artifactPath: { type: "string" }, jsonPointer: { type: "string" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"]);
}

function diagnosticSchema() {
  return objectSchema(null, {
    code: { type: "string" }, canonicalMessage: { type: "string" }, stage: { type: "string" }, phase: { type: "string" }, severity: { enum: ["error", "review"] },
    promotionStatus: { enum: ["blocked", "review_required"] }, validationResult: { enum: ["invalid", "review_required"] }, artifactPath: { type: "string" },
    jsonPointer: { type: "string" }, suggestedAction: { type: "string" }, diagnosticSource: { type: "string" }, sourceRef: { type: ["string", "null"] }, fixtureCoverage: { type: ["string", "null"] }
  }, ["code", "canonicalMessage", "stage", "phase", "severity", "promotionStatus", "validationResult", "artifactPath", "jsonPointer", "suggestedAction", "diagnosticSource", "sourceRef", "fixtureCoverage"]);
}

function resultRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" }, kind: { type: "string" }, stage: { type: "string" }, phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] }, actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] }, diagnosticCodes: { type: "array", items: { type: "string" } }, matched: { type: "boolean" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "matched"]);
}

function sourceFamilyPackagingExpectationsSchema() {
  return objectSchema("source-family-packaging-expectations.v0", {
    schemaId: { const: "source-family-packaging-expectations.v0" }, version: { type: "string" }, packagePath: { const: SFP_PACKAGE_PATH },
    fixtureRoot: { const: SFP_FIXTURE_ROOT }, artifactRoot: { const: SFP_ARTIFACT_ROOT }, schemaRoot: { const: SFP_SCHEMA_ROOT },
    inputs: { type: "array", items: { type: "string" } }, artifactOrder: { type: "array", items: { type: "string" } },
    diagnosticsRegistry: { const: diagnosticsRegistry() }, expectations: { type: "array", items: expectationRowSchema() },
    runExpectation: objectSchema(null, { status: { const: "pass" }, promotionStatus: { const: "review_required" } }, ["status", "promotionStatus"])
  }, ["schemaId", "version", "packagePath", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"]);
}

function sourceFamilyPackagingDiagnosticsSchema() {
  return objectSchema("source-family-packaging-diagnostics.v0", {
    schemaId: { const: "source-family-packaging-diagnostics.v0" }, version: { type: "string" }, diagnosticsRegistry: { const: diagnosticsRegistry() }
  }, ["schemaId", "version", "diagnosticsRegistry"]);
}

function runSummarySchema() {
  return objectSchema(null, {
    role: { enum: ["accepted-primary", "packaged-candidate"] }, evidenceRef: artifactRefSchema(), governedCatalogRef: artifactRefSchema(),
    sourceBundleId: { type: "string" }, profileId: { type: "string" }, owner: { type: "string" }, activeReviewRouteIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } }, componentIds: { type: "array", uniqueItems: true, items: { type: "string" } },
    command: { type: "string" }, compilerExecuted: { const: true }, compilerExitCode: { const: 0 }, evidenceIntegrityVerified: { const: true }, artifactClosureVerified: { const: true }, sourceBytesPreserved: { const: true },
    status: { const: "pass" }, promotionStatus: { const: "review_required" }
  }, ["role", "evidenceRef", "governedCatalogRef", "sourceBundleId", "profileId", "owner", "activeReviewRouteIds", "componentIds", "command", "compilerExecuted", "compilerExitCode", "evidenceIntegrityVerified", "artifactClosureVerified", "sourceBytesPreserved", "status", "promotionStatus"]);
}

function compilerExecutionsSchema() {
  return objectSchema(null, {
    acceptedBundlePasses: { const: 2 }, causalProbeFailures: { const: 1 }, total: { const: 3 }
  }, ["acceptedBundlePasses", "causalProbeFailures", "total"]);
}

function comparisonSchema() {
  const sourceFactValueSchema = objectSchema(null, {
    sourceRef: { type: "string" }, valueHash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  }, ["sourceRef", "valueHash"]);
  return objectSchema(null, {
    componentIds: { type: "array", uniqueItems: true, items: { type: "string" } },
    factTuples: { type: "array", items: objectSchema(null, {
      componentId: { type: "string" }, catalogPointer: { type: "string" }, catalogValueHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
      primaryFact: nullable(sourceFactValueSchema), supportingFacts: { type: "array", items: sourceFactValueSchema }, conflict: { type: "boolean" },
      resolution: { enum: ["exact-match", "narrower-than-catalog", "primary-precedence", "review-required", "missing-primary-fact", "outside-catalog"] },
      status: { enum: ["allowed", "review_required", "blocked"] }
    }, ["componentId", "catalogPointer", "catalogValueHash", "primaryFact", "supportingFacts", "conflict", "resolution", "status"]) },
    immutableFields: { type: "array", items: objectSchema(null, {
      field: { type: "string" }, p2Hash: { type: "string", pattern: "^[0-9a-f]{64}$" }, primaryHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
      candidateHash: { type: "string", pattern: "^[0-9a-f]{64}$" }, matched: { const: true }
    }, ["field", "p2Hash", "primaryHash", "candidateHash", "matched"]) },
    immutableProjectionHash: { type: "string", pattern: "^[0-9a-f]{64}$" }, schemaClosureMatched: { const: true }, factTuplesMatched: { const: true },
    p2BoundaryMatched: { const: true }, authorityExpanded: { const: false }, compilerImplementationReused: { const: true }, familySpecificModule: { type: "null" }
  }, ["componentIds", "factTuples", "immutableFields", "immutableProjectionHash", "schemaClosureMatched", "factTuplesMatched", "p2BoundaryMatched", "authorityExpanded", "compilerImplementationReused", "familySpecificModule"]);
}

function authorityExpansionProbeSchema() {
  return objectSchema(null, {
    componentId: { const: "Button" },
    catalogPointer: { const: "/components/Button/props/variant/allowedValues" },
    addedValue: { const: "expressive" },
    compilerExitCode: { const: 1 },
    diagnosticCode: { const: "SOURCE_FACT_AUTHORITY_ESCALATION" },
    blocked: { const: true }
  }, ["componentId", "catalogPointer", "addedValue", "compilerExitCode", "diagnosticCode", "blocked"]);
}

function distinctnessSchema() {
  return objectSchema(null, {
    bundleIdsDistinct: { const: true }, profileIdsDistinct: { const: true }, manifestHashesDistinct: { const: true },
    profileHashesDistinct: { const: true }, ownersDistinct: { const: true }, sourceFamilyIdsDistinct: { const: true }
  }, ["bundleIdsDistinct", "profileIdsDistinct", "manifestHashesDistinct", "profileHashesDistinct", "ownersDistinct", "sourceFamilyIdsDistinct"]);
}

function sourceFamilyPackagingReportSchema() {
  return objectSchema("source-family-packaging-report.v0", {
    schemaId: { const: "source-family-packaging-report.v0" }, version: { type: "string" }, runId: { type: "string" },
    packageRef: artifactRefSchema(), candidateManifestRef: artifactRefSchema(), candidateAuthorityProfileRef: artifactRefSchema(),
    compilerRefs: { type: "array", minItems: 7, maxItems: 7, uniqueItems: true, items: artifactRefSchema() }, runtimeRefs: { type: "array", minItems: 2, maxItems: 2, uniqueItems: true, items: artifactRefSchema() },
    primaryRun: runSummarySchema(), candidateRun: runSummarySchema(), candidateEvidenceRemap: { const: sfpCandidateEvidenceRemap() }, candidateEvidenceClosureVerified: { const: true },
    distinctness: distinctnessSchema(), capabilityComparison: comparisonSchema(), authorityExpansionProbe: authorityExpansionProbeSchema(), results: { type: "array", items: resultRowSchema() }, diagnostics: { type: "array", items: diagnosticSchema() },
    compilerExecutions: compilerExecutionsSchema(), sourceBytesPreserved: { const: true },
    diagnosticsRegistry: { const: diagnosticsRegistry() }, status: { const: "pass" }, promotionStatus: { const: "review_required" },
    nonAuthorityStatement: { type: "string" }, provenance: provenanceSchema()
  }, ["schemaId", "version", "runId", "packageRef", "candidateManifestRef", "candidateAuthorityProfileRef", "compilerRefs", "runtimeRefs", "primaryRun", "candidateRun", "candidateEvidenceRemap", "candidateEvidenceClosureVerified", "distinctness", "capabilityComparison", "authorityExpansionProbe", "results", "diagnostics", "compilerExecutions", "sourceBytesPreserved", "diagnosticsRegistry", "status", "promotionStatus", "nonAuthorityStatement", "provenance"]);
}

function sourceFamilyPackagingEvidenceSchema() {
  return objectSchema("source-family-packaging-evidence.v0", {
    contractId: { const: SFP_CONTRACT_ID }, schemaId: { const: "source-family-packaging-evidence.v0" }, version: { type: "string" }, runId: { type: "string" },
    checkedAt: { const: SFP_TIMESTAMP }, command: { const: SFP_COMMAND }, args: { type: "object", additionalProperties: { type: "string" } }, environment: environmentSchema(),
    schemaClosure: { type: "array", items: artifactRefSchema() }, packageRef: artifactRefSchema(), candidateManifestRef: artifactRefSchema(), candidateAuthorityProfileRef: artifactRefSchema(),
    candidateSourceRefs: { type: "array", items: artifactRefSchema() }, compilerRefs: { type: "array", minItems: 7, maxItems: 7, uniqueItems: true, items: artifactRefSchema() }, runtimeRefs: { type: "array", minItems: 2, maxItems: 2, uniqueItems: true, items: artifactRefSchema() }, fixtureRefs: { type: "array", items: artifactRefSchema() },
    boundaryRefs: { type: "array", items: artifactRefSchema({ provenance: true }) }, artifacts: { type: "array", items: artifactRefSchema({ nullableHash: true, provenance: true }) },
    candidateEvidenceRemap: { const: sfpCandidateEvidenceRemap() }, candidateEvidenceClosureVerified: { const: true },
    diagnostics: { type: "array", items: diagnosticSchema() }, diagnosticsRegistry: { const: diagnosticsRegistry() }, validationResults: { type: "array", items: resultRowSchema() },
    status: { const: "pass" }, promotionStatus: { const: "review_required" }, provenance: provenanceSchema()
  }, ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "packageRef", "candidateManifestRef", "candidateAuthorityProfileRef", "candidateSourceRefs", "compilerRefs", "runtimeRefs", "fixtureRefs", "boundaryRefs", "artifacts", "candidateEvidenceRemap", "candidateEvidenceClosureVerified", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"]);
}
