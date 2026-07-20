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

export const SSC_VERSION = "0.0.0";
export const SSC_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SSC_COMMAND = "interfacectl surfaces spectrum-switch-catalog proof";
export const SSC_CONTRACT_ID = "surfaces-spectrum-switch-catalog-proof";
export const SSC_SCHEMA_ROOT = "schemas";
export const SSC_SOURCE_ROOT = "sources/spectrum-switch-catalog";
export const SSC_FIXTURE_ROOT = "fixtures/spectrum-switch-catalog";
export const SSC_ARTIFACT_ROOT = "artifacts/spectrum-switch-catalog";
export const SSC_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SSC_CHECKBOX_EVIDENCE_PATH = "artifacts/spectrum-checkbox-catalog/evidence.json";
export const SSC_CHECKBOX_CATALOG_PATH = "artifacts/spectrum-checkbox-catalog/governed-catalog.json";
export const SSC_P2_REGISTRY_PATH = "sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/registry/components.json";
export const SSC_P2_TOKEN_PATH = "sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/tokens/layout-component.tokens.json";
export const SSC_LOCK_PATH = `${SSC_SOURCE_ROOT}/source-addendum.lock.json`;
export const SSC_MANIFEST_PATH = `${SSC_SOURCE_ROOT}/manifest.json`;
export const SSC_COMPONENT_RELATIVE_PATH = "npm/@adobe/spectrum-design-data/0.7.0/package/components/switch.json";
export const SSC_COMPONENT_PATH = `${SSC_SOURCE_ROOT}/${SSC_COMPONENT_RELATIVE_PATH}`;
export const SSC_PACKAGE_ROOT = "npm/@adobe/spectrum-design-data/0.7.0/package";
export const SSC_COMPONENT_RAW_SHA256 = "f71fca208251775638f52f9b6dfefc19104b17119512f6c3ae491da3c684b512";
export const SSC_PACKAGE_TARBALL_SHA256 = "12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0";
export const SSC_PACKAGE_INTEGRITY = "sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==";
export const SSC_PACKAGE_TARBALL = "https://registry.npmjs.org/@adobe/spectrum-design-data/-/spectrum-design-data-0.7.0.tgz";
export const SSC_ENVIRONMENT = Object.freeze({
  generatedAt: SSC_TIMESTAMP,
  host: null,
  pathStyle: "posix-relative"
});

export const SSC_SCHEMA_FILES = [
  "spectrum-switch-source-addendum-lock.v0.schema.json",
  "spectrum-switch-source-manifest.v0.schema.json",
  "spectrum-switch-source-mapping.v0.schema.json",
  "spectrum-switch-source-inventory.v0.schema.json",
  "spectrum-switch-catalog-fixture.v0.schema.json",
  "spectrum-switch-catalog-preflight-mutation.v0.schema.json",
  "spectrum-switch-catalog-expectations.v0.schema.json",
  "spectrum-switch-catalog-diagnostics.v0.schema.json",
  "spectrum-switch-catalog-report.v0.schema.json",
  "spectrum-switch-catalog-evidence.v0.schema.json"
];

export const SSC_SHARED_SCHEMA_FILES = [
  "runtime-catalog.v0.schema.json",
  "diagnostics.v0.schema.json",
  "design-system-ingestion-diagnostics.v0.schema.json",
  "design-system-ingestion-evidence.v0.schema.json"
];

export const SSC_IMPLEMENTATION_FILES = [
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
  "plans/spectrum-switch-catalog.md",
  "plans/surfaces-dev.md",
  "bin/interfacectl.js",
  "package.json",
  "package-lock.json",
  "sources/spectrum-switch-catalog/README.md",
  "src/p0.js",
  "src/capability-index-contract.js",
  "src/capability-index-proof.js",
  "src/p2-contract.js",
  "src/p2-proof.js",
  "src/spectrum-checkbox-catalog-contract.js",
  "src/spectrum-checkbox-catalog-proof.js",
  "src/spectrum-switch-catalog-contract.js",
  "src/spectrum-switch-catalog-proof.js",
  "scripts/materialize-spectrum-switch-catalog.mjs",
  "test/capability-index-proof.test.js",
  "test/spectrum-switch-catalog-proof.test.js"
];

export const SSC_MAPPING_PATHS = [
  `${SSC_SOURCE_ROOT}/mappings/component-map.json`,
  `${SSC_SOURCE_ROOT}/mappings/policy-map.json`
];

export const SSC_GENERATED_ARTIFACTS = [
  "source-inventory.json",
  "source-mapping.json",
  "governed-catalog.json",
  "spectrum-switch-catalog-report.json",
  "evidence.json"
];

export const SSC_ARTIFACT_PATHS = SSC_GENERATED_ARTIFACTS.map((file) => `${SSC_ARTIFACT_ROOT}/${file}`);

const SWITCH_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/switch.json#";
const REGISTRY_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/registry/components.json#/values/44";
const TOKEN_SOURCE_REF = "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/tokens/layout-component.tokens.json#/1066";
export const SSC_INCLUDED_POINTERS = [
  "",
  "/accessibility",
  "/documentBlocks/0",
  "/documentBlocks/2",
  "/options/isDisabled",
  "/options/isEmphasized",
  "/options/isReadOnly",
  "/options/isSelected",
  "/options/label",
  "/options/size",
  "/states/0",
  "/states/1",
  "/states/2",
  "/tokenBindings/6"
];

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
    generatedAt: { const: SSC_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string" } }
  }
};
const environmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "host", "pathStyle"],
  properties: {
    generatedAt: { const: SSC_TIMESTAMP },
    host: { type: "null" },
    pathStyle: { const: "posix-relative" }
  }
};
const commandArgsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["source", "ingestionEvidence", "checkboxEvidence", "catalog", "fixture", "out"],
  properties: {
    source: { const: SSC_SOURCE_ROOT },
    ingestionEvidence: { const: SSC_P2_EVIDENCE_PATH },
    checkboxEvidence: { const: SSC_CHECKBOX_EVIDENCE_PATH },
    catalog: { const: SSC_CHECKBOX_CATALOG_PATH },
    fixture: { const: SSC_FIXTURE_ROOT },
    out: { const: SSC_ARTIFACT_ROOT }
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

export const SSC_DIAGNOSTIC_ROWS = [
  diagnostic("SPECTRUM_SWITCH_P2_EVIDENCE_MISSING", "Accepted P2 evidence is missing.", "error", "preflight", "p2-upstream", "blocked", "mutations/missing-p2-evidence.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_P2_EVIDENCE_NONPASS", "Accepted P2 evidence is not passing.", "error", "preflight", "p2-upstream", "blocked", "mutations/nonpass-p2-evidence.spectrum-switch-catalog-preflight.json", "/mutation"),
  diagnostic("SPECTRUM_SWITCH_P2_EVIDENCE_HASH_MISMATCH", "Accepted P2 evidence does not match its complete evidence closure.", "error", "preflight", "p2-upstream", "blocked", "mutations/tampered-p2-evidence.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_MISSING", "Accepted Checkbox evidence is missing.", "error", "preflight", "checkbox-upstream", "blocked", "mutations/missing-checkbox-evidence.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_NONPASS", "Accepted Checkbox evidence is not passing.", "error", "preflight", "checkbox-upstream", "blocked", "mutations/nonpass-checkbox-evidence.spectrum-switch-catalog-preflight.json", "/mutation"),
  diagnostic("SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH", "Accepted Checkbox evidence does not match its complete evidence closure.", "error", "preflight", "checkbox-upstream", "blocked", "mutations/tampered-checkbox-evidence.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_BASELINE_CATALOG_HASH_MISMATCH", "The Checkbox baseline catalog does not match accepted Checkbox evidence.", "error", "preflight", "checkbox-catalog", "blocked", "mutations/baseline-catalog-drift.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_SOURCE_LOCK_MISMATCH", "The Switch source addendum does not match its immutable review-time lock.", "error", "source-inventory", "source-lock", "blocked", "mutations/source-lock-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_SOURCE_PATH_UNDECLARED", "The Switch source addendum contains an undeclared or unsafe source path.", "error", "source-inventory", "source-path", "blocked", "mutations/extra-source-path.spectrum-switch-catalog-preflight.json", "/mutation"),
  diagnostic("SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH", "The Switch source byte or source manifest hash does not match its checked boundary.", "error", "source-inventory", "source-hash", "blocked", "mutations/source-byte-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_SOURCE_REF_MISSING", "A governed Switch fact is missing a declared source reference.", "error", "mapping", "source-ref", "blocked", "invalid/source-ref-missing.spectrum-switch-catalog.json", "/sourceRef"),
  diagnostic("SPECTRUM_SWITCH_SOURCE_REF_UNDECLARED", "A governed Switch fact uses a source pointer outside the manifest allowlist.", "error", "mapping", "source-ref", "blocked", "invalid/source-ref-undeclared.spectrum-switch-catalog.json", "/sourceRef"),
  diagnostic("SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH", "A Switch mapping file does not match the source manifest.", "error", "mapping", "mapping-hash", "blocked", "mutations/mapping-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_MAPPING_UNSUPPORTED", "The requested component or property is outside the declared Switch source mapping.", "error", "mapping", "mapping", "blocked", "invalid/unknown-component.spectrum-switch-catalog.json", "/componentId"),
  diagnostic("SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION", "The requested Switch mapping would add behavior absent from declared source authority.", "error", "mapping", "authority", "blocked", "invalid/invented-action.spectrum-switch-catalog.json", "/requestedAddition"),
  diagnostic("SPECTRUM_SWITCH_STATE_MAPPING_INVALID", "The keyboard-focus state must use the one declared keyboardFocus normalization.", "error", "mapping", "state", "blocked", "invalid/keyboard-state-unmapped.spectrum-switch-catalog.json", "/stateMapping"),
  diagnostic("SPECTRUM_SWITCH_TOKEN_MODE_AMBIGUOUS", "The Switch token binding requires an explicit declared scale mapping.", "review", "mapping", "token", "review_required", "review/token-mode-unspecified.spectrum-switch-catalog.json", "/tokenMode"),
  diagnostic("SPECTRUM_SWITCH_TOGGLE_BEHAVIOR_FORBIDDEN", "Switch source descriptions do not authorize inferred toggle or group-propagation behavior.", "error", "govern", "behavior", "blocked", "invalid/inferred-toggle-behavior.spectrum-switch-catalog.json", "/behaviorClaim"),
  diagnostic("SPECTRUM_SWITCH_READ_ONLY_BEHAVIOR_FORBIDDEN", "The isReadOnly prop does not authorize inferred runtime interaction behavior.", "error", "govern", "behavior", "blocked", "invalid/inferred-read-only-behavior.spectrum-switch-catalog.json", "/behaviorClaim"),
  diagnostic("SPECTRUM_SWITCH_RUNTIME_ACCESSIBILITY_FORBIDDEN", "Switch accessibility metadata does not prove runtime accessibility compliance.", "error", "govern", "accessibility", "blocked", "invalid/runtime-accessibility-claim.spectrum-switch-catalog.json", "/runtimeAccessibilityClaim"),
  diagnostic("SPECTRUM_SWITCH_POLICY_PROSE_FORBIDDEN", "Free-form Switch guidance cannot become executable catalog policy.", "error", "govern", "policy", "blocked", "invalid/policy-prose-executable.spectrum-switch-catalog.json", "/policyText"),
  diagnostic("SPECTRUM_SWITCH_REVIEW_REQUIRED", "Standalone Switch labeling requires owner review and remains non-executable.", "review", "govern", "review", "review_required", "review/standalone-label.spectrum-switch-catalog.json", "/reviewScenario"),
  diagnostic("SPECTRUM_SWITCH_ACTIVATION_REVIEW_REQUIRED", "Switch activation intent requires owner review and remains non-executable.", "review", "govern", "review", "review_required", "review/activation-intent.spectrum-switch-catalog.json", "/reviewScenario"),
  diagnostic("SPECTRUM_SWITCH_REVIEW_PROMOTION_FORBIDDEN", "Review-required Switch output cannot be promoted unattended.", "error", "govern", "review", "blocked", "invalid/review-promoted.spectrum-switch-catalog.json", "/promotionRequest"),
  diagnostic("SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH", "A Switch proof schema differs from the evidence closure.", "error", "evidence", "schema", "blocked", "mutations/schema-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH", "A Switch proof implementation file differs from the evidence closure.", "error", "evidence", "implementation", "blocked", "mutations/implementation-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH", "The generated Switch source inventory differs from its deterministic reconstruction.", "error", "evidence", "inventory", "blocked", "mutations/output-inventory-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH", "The generated Switch source mapping differs from its deterministic reconstruction.", "error", "evidence", "generated-mapping", "blocked", "mutations/output-mapping-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH", "The generated Switch governed catalog differs from its deterministic reconstruction.", "error", "evidence", "catalog", "blocked", "mutations/governed-catalog-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_MANIFEST_HASH_MISMATCH", "The Switch source manifest differs from its deterministic checked boundary.", "error", "source-inventory", "source-manifest", "blocked", "mutations/manifest-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_REPORT_HASH_MISMATCH", "The Switch report differs from the evidence closure.", "error", "evidence", "report", "blocked", "mutations/report-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath"),
  diagnostic("SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH", "The Switch final evidence self-hash or reconstructed closure is invalid.", "error", "evidence", "evidence", "blocked", "mutations/evidence-self-hash-mismatch.spectrum-switch-catalog-preflight.json", "/targetPath")
];

export const SSC_EXPECTATION_ROWS = [
  expectation("valid/switch-complete.spectrum-switch-catalog.json", "valid", "valid", "allowed", []),
  expectation("valid/read-only-prop.spectrum-switch-catalog.json", "valid", "valid", "allowed", []),
  expectation("valid/keyboard-state-normalization.spectrum-switch-catalog.json", "valid", "valid", "allowed", []),
  expectation("valid/desktop-token.spectrum-switch-catalog.json", "valid", "valid", "allowed", []),
  expectation("review/standalone-label.spectrum-switch-catalog.json", "review", "review_required", "review_required", ["SPECTRUM_SWITCH_REVIEW_REQUIRED"]),
  expectation("review/token-mode-unspecified.spectrum-switch-catalog.json", "review", "review_required", "review_required", ["SPECTRUM_SWITCH_TOKEN_MODE_AMBIGUOUS"]),
  expectation("review/activation-intent.spectrum-switch-catalog.json", "review", "review_required", "review_required", ["SPECTRUM_SWITCH_ACTIVATION_REVIEW_REQUIRED"]),
  expectation("invalid/unknown-component.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_UNSUPPORTED"]),
  expectation("invalid/unsupported-indeterminate-prop.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/invented-action.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/invented-event.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/invented-slot.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/invented-data-binding.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/invented-runtime-key-binding.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_AUTHORITY_ESCALATION"]),
  expectation("invalid/inferred-toggle-behavior.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_TOGGLE_BEHAVIOR_FORBIDDEN"]),
  expectation("invalid/inferred-read-only-behavior.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_READ_ONLY_BEHAVIOR_FORBIDDEN"]),
  expectation("invalid/runtime-accessibility-claim.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_RUNTIME_ACCESSIBILITY_FORBIDDEN"]),
  expectation("invalid/keyboard-state-unmapped.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_STATE_MAPPING_INVALID"]),
  expectation("invalid/source-ref-missing.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_SOURCE_REF_MISSING"]),
  expectation("invalid/source-ref-undeclared.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_SOURCE_REF_UNDECLARED"]),
  expectation("invalid/policy-prose-executable.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_POLICY_PROSE_FORBIDDEN"]),
  expectation("invalid/review-promoted.spectrum-switch-catalog.json", "invalid", "invalid", "blocked", ["SPECTRUM_SWITCH_REVIEW_PROMOTION_FORBIDDEN"]),
  expectation("mutations/missing-p2-evidence.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_P2_EVIDENCE_MISSING"]),
  expectation("mutations/nonpass-p2-evidence.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_P2_EVIDENCE_NONPASS"]),
  expectation("mutations/tampered-p2-evidence.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_P2_EVIDENCE_HASH_MISMATCH"]),
  expectation("mutations/missing-checkbox-evidence.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_MISSING"]),
  expectation("mutations/nonpass-checkbox-evidence.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_NONPASS"]),
  expectation("mutations/tampered-checkbox-evidence.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_CHECKBOX_EVIDENCE_HASH_MISMATCH"]),
  expectation("mutations/baseline-catalog-drift.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_BASELINE_CATALOG_HASH_MISMATCH"]),
  expectation("mutations/source-byte-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_SOURCE_HASH_MISMATCH"]),
  expectation("mutations/extra-source-path.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_SOURCE_PATH_UNDECLARED"]),
  expectation("mutations/source-lock-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_SOURCE_LOCK_MISMATCH"]),
  expectation("mutations/manifest-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_MANIFEST_HASH_MISMATCH"]),
  expectation("mutations/mapping-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_MAPPING_HASH_MISMATCH"]),
  expectation("mutations/mapping-source-ref-undeclared.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_SOURCE_REF_UNDECLARED"]),
  expectation("mutations/schema-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_SCHEMA_HASH_MISMATCH"]),
  expectation("mutations/implementation-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_IMPLEMENTATION_HASH_MISMATCH"]),
  expectation("mutations/output-inventory-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_INVENTORY_HASH_MISMATCH"]),
  expectation("mutations/output-mapping-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_GENERATED_MAPPING_HASH_MISMATCH"]),
  expectation("mutations/governed-catalog-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_CATALOG_HASH_MISMATCH"]),
  expectation("mutations/report-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_REPORT_HASH_MISMATCH"]),
  expectation("mutations/evidence-self-hash-mismatch.spectrum-switch-catalog-preflight.json", "mutation", "invalid", "blocked", ["SPECTRUM_SWITCH_EVIDENCE_HASH_MISMATCH"])
];

export const SSC_SCHEMAS = buildSchemas();
export const SSC_FIXTURES = buildFixtures();

export async function materializeSpectrumSwitchCatalogContract(cwd) {
  await assertImmutableSpectrumSwitchSource(cwd);
  for (const [file, value] of Object.entries(SSC_SCHEMAS)) {
    const relative = `${SSC_SCHEMA_ROOT}/${file}`;
    await assertSafeOutputPath(cwd, relative);
    await writeCanonicalJson(path.join(cwd, relative), value);
  }
  const mappings = buildExpectedSpectrumSwitchSourceMappings();
  for (const [relative, value] of Object.entries(mappings)) {
    const outputPath = `${SSC_SOURCE_ROOT}/mappings/${relative}`;
    await assertSafeOutputPath(cwd, outputPath);
    await writeCanonicalJson(path.join(cwd, outputPath), value);
  }
  const manifest = await buildExpectedSpectrumSwitchSourceManifest(cwd);
  await assertSafeOutputPath(cwd, SSC_MANIFEST_PATH);
  await writeCanonicalJson(path.join(cwd, SSC_SOURCE_ROOT, "manifest.json"), manifest);
  for (const [relative, value] of Object.entries(SSC_FIXTURES)) {
    const outputPath = `${SSC_FIXTURE_ROOT}/${relative}`;
    await assertSafeOutputPath(cwd, outputPath);
    await writeCanonicalJson(path.join(cwd, outputPath), value);
  }
}

export async function assertImmutableSpectrumSwitchSource(cwd) {
  await assertSafeDirectoryPath(cwd, SSC_SOURCE_ROOT);
  await assertSafeDirectoryPath(cwd, `${SSC_SOURCE_ROOT}/${SSC_PACKAGE_ROOT}`);
  await assertSafeRegularFilePath(cwd, SSC_LOCK_PATH);
  await assertSafeRegularFilePath(cwd, SSC_COMPONENT_PATH);
  const lockPath = path.join(cwd, SSC_LOCK_PATH);
  const lock = await readJson(lockPath);
  const expected = {
    schemaId: "spectrum-switch-source-addendum-lock.v0",
    version: SSC_VERSION,
    packageName: "@adobe/spectrum-design-data",
    packageVersion: "0.7.0",
    packageTarball: SSC_PACKAGE_TARBALL,
    packageIntegrity: SSC_PACKAGE_INTEGRITY,
    tarballHashAlgorithm: "sha256",
    tarballSha256: SSC_PACKAGE_TARBALL_SHA256,
    packageRoot: SSC_PACKAGE_ROOT,
    selectedFiles: [{ packagePath: "components/switch.json", hashAlgorithm: "sha256", sha256: SSC_COMPONENT_RAW_SHA256 }],
    reviewVerification: {
      method: "review-time-tarball-verification",
      verifiedAt: "2026-07-19T00:00:00.000Z",
      checks: ["npm-sha512-sri", "tarball-sha256", "selected-file-raw-sha256"],
      ordinaryMaterialization: "local-lock-conformance-only"
    },
    provenance: {
      generator: "surfaces-spectrum-switch-source-addendum-review",
      sourceRefs: [SSC_PACKAGE_TARBALL, SWITCH_SOURCE_REF]
    }
  };
  if (canonicalJson(lock) !== canonicalJson(expected)) throw new Error("The Switch source addendum does not match its immutable review-time lock.");
  const packageRoot = path.join(cwd, SSC_SOURCE_ROOT, SSC_PACKAGE_ROOT);
  const actualPaths = await collectRegularFiles(packageRoot);
  if (JSON.stringify(actualPaths) !== JSON.stringify(["components/switch.json"])) {
    throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
  }
  const allowedSourceFiles = [
    "README.md",
    "manifest.json",
    "mappings/component-map.json",
    "mappings/policy-map.json",
    SSC_COMPONENT_RELATIVE_PATH,
    "source-addendum.lock.json"
  ].sort();
  const actualSourceFiles = await collectRegularFiles(path.join(cwd, SSC_SOURCE_ROOT));
  if (actualSourceFiles.some((relative) => !allowedSourceFiles.includes(relative))) {
    throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
  }
  const componentStat = await fs.lstat(path.join(cwd, SSC_COMPONENT_PATH));
  if (!componentStat.isFile() || componentStat.isSymbolicLink() || componentStat.nlink !== 1) {
    throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
  }
  if (await rawFileHash(path.join(cwd, SSC_COMPONENT_PATH)) !== SSC_COMPONENT_RAW_SHA256) {
    throw new Error("The Switch source byte or source manifest hash does not match its checked boundary.");
  }
  return lock;
}

export function sscSchemaPaths() {
  return [...SSC_SCHEMA_FILES, ...SSC_SHARED_SCHEMA_FILES].map((file) => `${SSC_SCHEMA_ROOT}/${file}`);
}

export function sscFixturePaths() {
  return [
    `${SSC_FIXTURE_ROOT}/expectations.manifest.json`,
    ...Object.keys(SSC_FIXTURES)
      .filter((file) => file !== "expectations.manifest.json")
      .sort()
      .map((file) => `${SSC_FIXTURE_ROOT}/${file}`)
  ];
}

export function sscSourcePaths() {
  return [SSC_LOCK_PATH, SSC_MANIFEST_PATH, SSC_COMPONENT_PATH, ...SSC_MAPPING_PATHS];
}

export function sscSchemaIdForPath(relativePath) {
  const file = path.posix.basename(relativePath);
  const ids = {
    "source-addendum.lock.json": "spectrum-switch-source-addendum-lock.v0",
    "manifest.json": "spectrum-switch-source-manifest.v0",
    "component-map.json": "spectrum-switch-source-mapping.v0",
    "policy-map.json": "spectrum-switch-source-mapping.v0",
    "source-inventory.json": "spectrum-switch-source-inventory.v0",
    "source-mapping.json": "spectrum-switch-source-mapping.v0",
    "governed-catalog.json": "runtime-catalog.v0",
    "spectrum-switch-catalog-report.json": "spectrum-switch-catalog-report.v0",
    "evidence.json": "spectrum-switch-catalog-evidence.v0",
    "expectations.manifest.json": "spectrum-switch-catalog-expectations.v0"
  };
  if (ids[file]) return ids[file];
  if (file.includes("preflight")) return "spectrum-switch-catalog-preflight-mutation.v0";
  if (relativePath.startsWith(`${SSC_FIXTURE_ROOT}/`)) return "spectrum-switch-catalog-fixture.v0";
  if (relativePath.startsWith(`${SSC_SCHEMA_ROOT}/`)) return file.replace(/\.schema\.json$/, "");
  return "raw-source";
}

export function artifactRef(pathValue, schemaId, hash, sourceRef = null) {
  return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash, sourceRef };
}

export function provenance(generator, sourceRefs) {
  return { generatedAt: SSC_TIMESTAMP, generator, sourceRefs: [...new Set(sourceRefs)].sort() };
}

export function diagnosticsRegistry() {
  return SSC_DIAGNOSTIC_ROWS.map((row) => deepClone(row));
}

export async function buildExpectedSpectrumSwitchSourceManifest(cwd) {
  const p2Evidence = await readJson(path.join(cwd, SSC_P2_EVIDENCE_PATH));
  const checkboxEvidence = await readJson(path.join(cwd, SSC_CHECKBOX_EVIDENCE_PATH));
  const [p2EvidenceHash, checkboxEvidenceHash, checkboxCatalogHash, registryHash, tokenHash, lockHash, switchHash] = await Promise.all([
    Promise.resolve(computeEvidenceSelfHash(p2Evidence, SSC_P2_EVIDENCE_PATH)),
    Promise.resolve(computeEvidenceSelfHash(checkboxEvidence, SSC_CHECKBOX_EVIDENCE_PATH)),
    canonicalFileHash(path.join(cwd, SSC_CHECKBOX_CATALOG_PATH)),
    rawFileHash(path.join(cwd, SSC_P2_REGISTRY_PATH)),
    rawFileHash(path.join(cwd, SSC_P2_TOKEN_PATH)),
    rawFileHash(path.join(cwd, SSC_LOCK_PATH)),
    rawFileHash(path.join(cwd, SSC_COMPONENT_PATH))
  ]);
  const requiredMappings = [];
  for (const mappingPath of SSC_MAPPING_PATHS) {
    requiredMappings.push({
      path: path.posix.relative(SSC_SOURCE_ROOT, mappingPath),
      schemaId: "spectrum-switch-source-mapping.v0",
      hashAlgorithm: "sha256",
      sha256: await canonicalFileHash(path.join(cwd, mappingPath)),
      mappingRefRoot: `mapping://spectrum-switch-catalog/${path.posix.basename(mappingPath)}#`
    });
  }
  return {
    schemaId: "spectrum-switch-source-manifest.v0",
    version: SSC_VERSION,
    targetId: "spectrum-switch-catalog",
    designSystemId: "adobe-spectrum",
    packageName: "@adobe/spectrum-design-data",
    packageVersion: "0.7.0",
    componentSubset: ["switch"],
    sourceRefGrammar: "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/<posix-package-path>#<rfc6901-json-pointer>",
    upstreamBoundaries: {
      p2EvidenceRef: artifactRef(SSC_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", p2EvidenceHash),
      checkboxEvidenceRef: artifactRef(SSC_CHECKBOX_EVIDENCE_PATH, "spectrum-checkbox-catalog-evidence.v0", checkboxEvidenceHash),
      checkboxCatalogRef: artifactRef(SSC_CHECKBOX_CATALOG_PATH, "runtime-catalog.v0", checkboxCatalogHash)
    },
    sourceAddendumLock: {
      path: SSC_LOCK_PATH,
      schemaId: "spectrum-switch-source-addendum-lock.v0",
      hashAlgorithm: "sha256",
      sha256: lockHash
    },
    sourceFiles: [{
      path: SSC_COMPONENT_PATH,
      packagePath: "components/switch.json",
      sourceType: "component",
      hashAlgorithm: "sha256",
      sha256: switchHash,
      sourceRefRoot: SWITCH_SOURCE_REF
    }],
    reusedP2SourceFiles: [
      { path: SSC_P2_REGISTRY_PATH, hashAlgorithm: "sha256", sha256: registryHash, sourceRef: REGISTRY_SOURCE_REF },
      { path: SSC_P2_TOKEN_PATH, hashAlgorithm: "sha256", sha256: tokenHash, sourceRef: TOKEN_SOURCE_REF }
    ],
    includedPointers: SSC_INCLUDED_POINTERS,
    requiredMappings,
    policyRefs: [
      `${SWITCH_SOURCE_REF}/accessibility`,
      `${SWITCH_SOURCE_REF}/options/label`,
      `${SWITCH_SOURCE_REF}/documentBlocks/2`
    ],
    environment: SSC_ENVIRONMENT,
    provenance: provenance("interfacectl-spectrum-switch-source-manifest", [SWITCH_SOURCE_REF, REGISTRY_SOURCE_REF, TOKEN_SOURCE_REF])
  };
}

export function buildExpectedSpectrumSwitchSourceMappings() {
  const componentRows = {};
  const put = (mappingId, mappingKind, normalizedId, sourceRefs, targetRefs, extras = {}) => {
    componentRows[mappingId] = {
      mappingId,
      mappingKind,
      normalizedId,
      authorityScope: "mapping-narrows-source",
      reviewStatus: "accepted",
      sourceRefs,
      mappingRefs: [`mapping://spectrum-switch-catalog/component-map.json#/mappingRows/${mappingId}`],
      targetRefs,
      ...extras
    };
  };
  put("switch-component", "component", "Switch", [SWITCH_SOURCE_REF, REGISTRY_SOURCE_REF], ["catalog://spectrum-switch-catalog/components/Switch"]);
  for (const prop of ["isDisabled", "isEmphasized", "isReadOnly", "isSelected", "label", "size"]) {
    put(`switch-prop-${toKebab(prop)}`, "prop", `Switch.props.${prop}`, [`${SWITCH_SOURCE_REF}/options/${prop}`], [`catalog://spectrum-switch-catalog/components/Switch/props/${prop}`]);
  }
  put("switch-state-hover", "state", "Switch.states.hover", [`${SWITCH_SOURCE_REF}/states/0`], ["catalog://spectrum-switch-catalog/components/Switch/states/hover"]);
  put("switch-state-down", "state", "Switch.states.down", [`${SWITCH_SOURCE_REF}/states/1`], ["catalog://spectrum-switch-catalog/components/Switch/states/down"]);
  put("switch-state-keyboard-focus", "state", "Switch.states.keyboardFocus", [`${SWITCH_SOURCE_REF}/states/2`], ["catalog://spectrum-switch-catalog/components/Switch/states/keyboardFocus"], { sourceValue: "keyboard-focus", targetValue: "keyboardFocus" });
  put("switch-accessibility", "accessibility", "Switch.accessibility", [`${SWITCH_SOURCE_REF}/accessibility`], ["catalog://spectrum-switch-catalog/components/Switch/accessibility"]);
  put("switch-purpose-example", "example", "Switch.examples.purpose", [`${SWITCH_SOURCE_REF}/documentBlocks/0`], ["catalog://spectrum-switch-catalog/components/Switch/examples/0"]);
  put("switch-control-width-medium-desktop", "token", "tokens.switch-control-width-medium-desktop", [`${SWITCH_SOURCE_REF}/tokenBindings/6`, TOKEN_SOURCE_REF], ["catalog://spectrum-switch-catalog/tokens/switch-control-width-medium-desktop"], { sourceValue: "switch-control-width-medium", targetValue: "switch-control-width-medium-desktop" });

  const componentMap = {
    schemaId: "spectrum-switch-source-mapping.v0",
    version: SSC_VERSION,
    mappingSetId: "spectrum-switch-component-map",
    sourceManifestRef: null,
    mappingRows: componentRows,
    reviewRequired: {},
    provenance: provenance("interfacectl-spectrum-switch-component-map", [SWITCH_SOURCE_REF, REGISTRY_SOURCE_REF, TOKEN_SOURCE_REF])
  };
  const reviewRequired = {
    "switch-activation-intent-review": {
      mappingId: "switch-activation-intent-review",
      condition: "source accessibility intent activate is requested as executable behavior",
      promotionStatus: "review_required",
      executable: false,
      reviewOwner: "design-systems-governance",
      rationale: "Source intent does not authorize an action, event, exact key binding, or runtime execution.",
      sourceRefs: [`${SWITCH_SOURCE_REF}/accessibility`],
      mappingRefs: ["mapping://spectrum-switch-catalog/policy-map.json#/reviewRequired/switch-activation-intent-review"]
    },
    "switch-standalone-label-review": {
      mappingId: "switch-standalone-label-review",
      condition: "label is absent and explicit accessible-name authority is not supplied",
      promotionStatus: "review_required",
      executable: false,
      reviewOwner: "design-systems-governance",
      rationale: "Standalone Switch context requires owner review; accessible-name behavior is not inferred.",
      sourceRefs: [`${SWITCH_SOURCE_REF}/options/label`, `${SWITCH_SOURCE_REF}/documentBlocks/2`, `${SWITCH_SOURCE_REF}/accessibility`],
      mappingRefs: ["mapping://spectrum-switch-catalog/policy-map.json#/reviewRequired/switch-standalone-label-review"]
    }
  };
  const policyMap = {
    schemaId: "spectrum-switch-source-mapping.v0",
    version: SSC_VERSION,
    mappingSetId: "spectrum-switch-policy-map",
    sourceManifestRef: null,
    mappingRows: {},
    reviewRequired,
    provenance: provenance("interfacectl-spectrum-switch-policy-map", Object.values(reviewRequired).flatMap((row) => row.sourceRefs))
  };
  return { "component-map.json": componentMap, "policy-map.json": policyMap };
}

function buildFixtures() {
  const fixtures = {};
  const put = (relative, value) => { fixtures[relative] = value; };
  put("valid/switch-complete.spectrum-switch-catalog.json", baseFixture("switch-complete"));
  put("valid/read-only-prop.spectrum-switch-catalog.json", { ...baseFixture("read-only-prop"), propProbe: "isReadOnly" });
  put("valid/keyboard-state-normalization.spectrum-switch-catalog.json", { ...baseFixture("keyboard-state-normalization"), stateMapping: { source: "keyboard-focus", target: "keyboardFocus" } });
  put("valid/desktop-token.spectrum-switch-catalog.json", { ...baseFixture("desktop-token"), tokenMode: "desktop" });
  put("review/standalone-label.spectrum-switch-catalog.json", { ...baseFixture("standalone-label"), reviewScenario: "standalone-label" });
  put("review/token-mode-unspecified.spectrum-switch-catalog.json", { ...baseFixture("token-mode-unspecified"), tokenMode: "unspecified" });
  put("review/activation-intent.spectrum-switch-catalog.json", { ...baseFixture("activation-intent"), reviewScenario: "activation-intent" });
  put("invalid/unknown-component.spectrum-switch-catalog.json", { ...baseFixture("unknown-component"), componentId: "Checkbox" });
  put("invalid/unsupported-indeterminate-prop.spectrum-switch-catalog.json", { ...baseFixture("unsupported-indeterminate-prop"), requestedAddition: "isIndeterminate" });
  put("invalid/invented-action.spectrum-switch-catalog.json", { ...baseFixture("invented-action"), requestedAddition: "action" });
  put("invalid/invented-event.spectrum-switch-catalog.json", { ...baseFixture("invented-event"), requestedAddition: "event" });
  put("invalid/invented-slot.spectrum-switch-catalog.json", { ...baseFixture("invented-slot"), requestedAddition: "slot" });
  put("invalid/invented-data-binding.spectrum-switch-catalog.json", { ...baseFixture("invented-data-binding"), requestedAddition: "data-binding" });
  put("invalid/invented-runtime-key-binding.spectrum-switch-catalog.json", { ...baseFixture("invented-runtime-key-binding"), requestedAddition: "runtime-key-binding" });
  put("invalid/inferred-toggle-behavior.spectrum-switch-catalog.json", { ...baseFixture("inferred-toggle-behavior"), behaviorClaim: "toggle-execution" });
  put("invalid/inferred-read-only-behavior.spectrum-switch-catalog.json", { ...baseFixture("inferred-read-only-behavior"), behaviorClaim: "read-only-interaction" });
  put("invalid/runtime-accessibility-claim.spectrum-switch-catalog.json", { ...baseFixture("runtime-accessibility-claim"), runtimeAccessibilityClaim: "compliant" });
  put("invalid/keyboard-state-unmapped.spectrum-switch-catalog.json", { ...baseFixture("keyboard-state-unmapped"), stateMapping: { source: "keyboard-focus", target: "keyboard-focus" } });
  put("invalid/source-ref-missing.spectrum-switch-catalog.json", { ...baseFixture("source-ref-missing"), sourceRef: null });
  put("invalid/source-ref-undeclared.spectrum-switch-catalog.json", { ...baseFixture("source-ref-undeclared"), sourceRef: `${SWITCH_SOURCE_REF}/documentBlocks/16` });
  put("invalid/policy-prose-executable.spectrum-switch-catalog.json", { ...baseFixture("policy-prose-executable"), policyText: "Switches should always have a label.", requestedAddition: "executable-policy" });
  put("invalid/review-promoted.spectrum-switch-catalog.json", { ...baseFixture("review-promoted"), reviewScenario: "standalone-label", promotionRequest: "allowed" });
  const mutation = (mutationId, targetPath, mutationValue) => ({ schemaId: "spectrum-switch-catalog-preflight-mutation.v0", version: SSC_VERSION, mutationId, targetPath, mutation: mutationValue });
  put("mutations/missing-p2-evidence.spectrum-switch-catalog-preflight.json", mutation("missing-p2-evidence", SSC_P2_EVIDENCE_PATH, "missing"));
  put("mutations/nonpass-p2-evidence.spectrum-switch-catalog-preflight.json", mutation("nonpass-p2-evidence", SSC_P2_EVIDENCE_PATH, "nonpass"));
  put("mutations/tampered-p2-evidence.spectrum-switch-catalog-preflight.json", mutation("tampered-p2-evidence", SSC_P2_EVIDENCE_PATH, "hash-mismatch"));
  put("mutations/missing-checkbox-evidence.spectrum-switch-catalog-preflight.json", mutation("missing-checkbox-evidence", SSC_CHECKBOX_EVIDENCE_PATH, "missing"));
  put("mutations/nonpass-checkbox-evidence.spectrum-switch-catalog-preflight.json", mutation("nonpass-checkbox-evidence", SSC_CHECKBOX_EVIDENCE_PATH, "nonpass"));
  put("mutations/tampered-checkbox-evidence.spectrum-switch-catalog-preflight.json", mutation("tampered-checkbox-evidence", SSC_CHECKBOX_EVIDENCE_PATH, "hash-mismatch"));
  put("mutations/baseline-catalog-drift.spectrum-switch-catalog-preflight.json", mutation("baseline-catalog-drift", SSC_CHECKBOX_CATALOG_PATH, "hash-mismatch"));
  put("mutations/source-byte-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("source-byte-hash-mismatch", SSC_COMPONENT_PATH, "hash-mismatch"));
  put("mutations/extra-source-path.spectrum-switch-catalog-preflight.json", mutation("extra-source-path", `${SSC_SOURCE_ROOT}/${SSC_PACKAGE_ROOT}/components/extra.json`, "extra-path"));
  put("mutations/source-lock-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("source-lock-hash-mismatch", SSC_LOCK_PATH, "hash-mismatch"));
  put("mutations/manifest-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("manifest-hash-mismatch", SSC_MANIFEST_PATH, "hash-mismatch"));
  put("mutations/mapping-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("mapping-hash-mismatch", SSC_MAPPING_PATHS[0], "hash-mismatch"));
  put("mutations/mapping-source-ref-undeclared.spectrum-switch-catalog-preflight.json", mutation("mapping-source-ref-undeclared", SSC_MAPPING_PATHS[0], "source-ref-undeclared"));
  put("mutations/schema-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("schema-hash-mismatch", `${SSC_SCHEMA_ROOT}/spectrum-switch-catalog-fixture.v0.schema.json`, "hash-mismatch"));
  put("mutations/implementation-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("implementation-hash-mismatch", "src/spectrum-switch-catalog-proof.js", "implementation-drift"));
  put("mutations/output-inventory-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("output-inventory-hash-mismatch", `${SSC_ARTIFACT_ROOT}/source-inventory.json`, "artifact-drift"));
  put("mutations/output-mapping-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("output-mapping-hash-mismatch", `${SSC_ARTIFACT_ROOT}/source-mapping.json`, "artifact-drift"));
  put("mutations/governed-catalog-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("governed-catalog-hash-mismatch", `${SSC_ARTIFACT_ROOT}/governed-catalog.json`, "artifact-drift"));
  put("mutations/report-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("report-hash-mismatch", `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json`, "report-drift"));
  put("mutations/evidence-self-hash-mismatch.spectrum-switch-catalog-preflight.json", mutation("evidence-self-hash-mismatch", `${SSC_ARTIFACT_ROOT}/evidence.json`, "evidence-self-hash-drift"));
  fixtures["expectations.manifest.json"] = {
    schemaId: "spectrum-switch-catalog-expectations.v0",
    version: SSC_VERSION,
    schemaRoot: SSC_SCHEMA_ROOT,
    sourceRoot: SSC_SOURCE_ROOT,
    fixtureRoot: SSC_FIXTURE_ROOT,
    inputs: [`${SSC_FIXTURE_ROOT}/expectations.manifest.json`, ...SSC_EXPECTATION_ROWS.map((row) => row.fixturePath)],
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: SSC_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required",
      componentIds: ["Button", "Checkbox", "InLineAlert", "Switch"],
      addedComponentIds: ["Switch"],
      addedTokenIds: ["switch-control-width-medium-desktop"],
      matchedFixtureCount: SSC_EXPECTATION_ROWS.length
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
      mappingKind: { enum: ["component", "prop", "state", "accessibility", "example", "token"] },
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
    schemaId: { const: "spectrum-switch-source-mapping.v0" },
    version: { const: SSC_VERSION },
    mappingSetId: string,
    sourceManifestRef: { anyOf: [artifactRefSchema, { type: "null" }] },
    mappingRows: { type: "object", additionalProperties: mappingRowSchema },
    reviewRequired: { type: "object", additionalProperties: reviewRowSchema },
    provenance: provenanceSchema
  };
  const fixtureProperties = {
    schemaId: { const: "spectrum-switch-catalog-fixture.v0" }, version: { const: SSC_VERSION }, fixtureId: string,
    componentId: { anyOf: [{ const: "Switch" }, { type: "string" }] },
    sourceRef: nullableString,
    stateMapping: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["source", "target"], properties: { source: string, target: string } }] },
    tokenMode: { anyOf: [{ type: "null" }, { enum: ["desktop", "mobile", "unspecified"] }] },
    propProbe: { anyOf: [{ type: "null" }, { const: "isReadOnly" }] },
    requestedAddition: { anyOf: [{ type: "null" }, { enum: ["action", "event", "slot", "data-binding", "runtime-key-binding", "variant", "prop", "isIndeterminate", "token", "executable-policy"] }] },
    behaviorClaim: { anyOf: [{ type: "null" }, { enum: ["toggle-execution", "group-propagation", "read-only-interaction"] }] },
    runtimeAccessibilityClaim: { anyOf: [{ type: "null" }, { const: "compliant" }] },
    policyText: nullableString,
    reviewScenario: { anyOf: [{ type: "null" }, { enum: ["standalone-label", "activation-intent"] }] },
    promotionRequest: { anyOf: [{ type: "null" }, { enum: ["allowed", "review_required"] }] }
  };
  const reportEvidenceCore = {
    contractId: { const: SSC_CONTRACT_ID }, schemaId: string, version: { const: SSC_VERSION }, runId: string,
    checkedAt: { const: SSC_TIMESTAMP }, command: { const: SSC_COMMAND }, args: commandArgsSchema, environment: environmentSchema,
    boundaryRefs: { type: "array", minItems: 3, maxItems: 3, uniqueItems: true, items: artifactRefSchema },
    sourceInventoryRef: artifactRefSchema, sourceMappingRef: artifactRefSchema, catalogRef: artifactRefSchema,
    validationResults: { type: "array", minItems: SSC_EXPECTATION_ROWS.length, maxItems: SSC_EXPECTATION_ROWS.length, uniqueItems: true, items: validationResultSchema }, diagnostics: { type: "array", minItems: 1, uniqueItems: true, items: diagnosticSchema }, diagnosticsRegistry: { type: "array", minItems: SSC_DIAGNOSTIC_ROWS.length, maxItems: SSC_DIAGNOSTIC_ROWS.length, uniqueItems: true, items: diagnosticSchema },
    summary: {
      type: "object", additionalProperties: false,
      required: ["fixtureCount", "matchedFixtureCount", "baseComponentCount", "expandedComponentCount", "basePreservedCount", "addedComponentCount", "addedTokenCount", "reviewRequiredMappingCount"],
      properties: {
        fixtureCount: { const: SSC_EXPECTATION_ROWS.length }, matchedFixtureCount: { const: SSC_EXPECTATION_ROWS.length }, baseComponentCount: { const: 3 }, expandedComponentCount: { const: 4 }, basePreservedCount: { const: 36 }, addedComponentCount: { const: 1 }, addedTokenCount: { const: 1 }, reviewRequiredMappingCount: { const: 2 }
      }
    },
    catalogExpansion: {
      type: "object", additionalProperties: false,
      required: ["baseCatalogId", "expandedCatalogId", "catalogIdChanged", "baseCatalogHash", "expandedCatalogHash", "basePreservation", "addedComponentIds", "addedTokenIds", "runtimeCapabilitiesPreserved", "compatibilityPreserved"],
      properties: {
        baseCatalogId: { const: "surfaces-spectrum-checkbox-catalog-governed" }, expandedCatalogId: { const: "surfaces-spectrum-switch-catalog-governed" }, catalogIdChanged: { const: true },
        baseCatalogHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, expandedCatalogHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
        basePreservation: { type: "array", minItems: 36, maxItems: 36, uniqueItems: true, items: { type: "object", additionalProperties: false, required: ["pointer", "baseHash", "expandedHash", "matched"], properties: { pointer: string, baseHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, expandedHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, matched: { const: true } } } },
        addedComponentIds: { type: "array", const: ["Switch"] }, addedTokenIds: { type: "array", const: ["switch-control-width-medium-desktop"] }, runtimeCapabilitiesPreserved: { const: true }, compatibilityPreserved: { const: true }
      }
    },
    status: { const: "pass" }, promotionStatus: { const: "review_required" }, provenance: provenanceSchema
  };
  const schemas = {};
  schemas["spectrum-switch-source-addendum-lock.v0.schema.json"] = schema("spectrum-switch-source-addendum-lock.v0", {
    required: ["schemaId", "version", "packageName", "packageVersion", "packageTarball", "packageIntegrity", "tarballHashAlgorithm", "tarballSha256", "packageRoot", "selectedFiles", "reviewVerification", "provenance"],
    properties: {
      schemaId: { const: "spectrum-switch-source-addendum-lock.v0" }, version: { const: SSC_VERSION }, packageName: { const: "@adobe/spectrum-design-data" }, packageVersion: { const: "0.7.0" },
      packageTarball: { const: SSC_PACKAGE_TARBALL }, packageIntegrity: { const: SSC_PACKAGE_INTEGRITY }, tarballHashAlgorithm: { const: "sha256" }, tarballSha256: { const: SSC_PACKAGE_TARBALL_SHA256 }, packageRoot: { const: SSC_PACKAGE_ROOT },
      selectedFiles: { type: "array", minItems: 1, maxItems: 1, prefixItems: [{ type: "object", additionalProperties: false, required: ["packagePath", "hashAlgorithm", "sha256"], properties: { packagePath: { const: "components/switch.json" }, hashAlgorithm: { const: "sha256" }, sha256: { const: SSC_COMPONENT_RAW_SHA256 } } }], items: false },
      reviewVerification: { type: "object", additionalProperties: false, required: ["method", "verifiedAt", "checks", "ordinaryMaterialization"], properties: { method: { const: "review-time-tarball-verification" }, verifiedAt: { const: "2026-07-19T00:00:00.000Z" }, checks: { const: ["npm-sha512-sri", "tarball-sha256", "selected-file-raw-sha256"] }, ordinaryMaterialization: { const: "local-lock-conformance-only" } } },
      provenance: { type: "object", additionalProperties: false, required: ["generator", "sourceRefs"], properties: { generator: { const: "surfaces-spectrum-switch-source-addendum-review" }, sourceRefs: { const: [SSC_PACKAGE_TARBALL, SWITCH_SOURCE_REF] } } }
    }
  });
  schemas["spectrum-switch-source-manifest.v0.schema.json"] = schema("spectrum-switch-source-manifest.v0", {
    required: ["schemaId", "version", "targetId", "designSystemId", "packageName", "packageVersion", "componentSubset", "sourceRefGrammar", "upstreamBoundaries", "sourceAddendumLock", "sourceFiles", "reusedP2SourceFiles", "includedPointers", "requiredMappings", "policyRefs", "environment", "provenance"],
    properties: {
      schemaId: { const: "spectrum-switch-source-manifest.v0" }, version: { const: SSC_VERSION }, targetId: { const: "spectrum-switch-catalog" }, designSystemId: { const: "adobe-spectrum" }, packageName: { const: "@adobe/spectrum-design-data" }, packageVersion: { const: "0.7.0" }, componentSubset: { const: ["switch"] }, sourceRefGrammar: string,
      upstreamBoundaries: { type: "object", additionalProperties: false, required: ["p2EvidenceRef", "checkboxEvidenceRef", "checkboxCatalogRef"], properties: { p2EvidenceRef: artifactRefSchema, checkboxEvidenceRef: artifactRefSchema, checkboxCatalogRef: artifactRefSchema } },
      sourceAddendumLock: { type: "object", additionalProperties: false, required: ["path", "schemaId", "hashAlgorithm", "sha256"], properties: { path: { const: SSC_LOCK_PATH }, schemaId: { const: "spectrum-switch-source-addendum-lock.v0" }, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" } } },
      sourceFiles: { type: "array", minItems: 1, maxItems: 1, items: { type: "object", additionalProperties: false, required: ["path", "packagePath", "sourceType", "hashAlgorithm", "sha256", "sourceRefRoot"], properties: { path: { const: SSC_COMPONENT_PATH }, packagePath: { const: "components/switch.json" }, sourceType: { const: "component" }, hashAlgorithm: { const: "sha256" }, sha256: { const: SSC_COMPONENT_RAW_SHA256 }, sourceRefRoot: { const: SWITCH_SOURCE_REF } } } },
      reusedP2SourceFiles: { type: "array", minItems: 2, maxItems: 2, items: { type: "object", additionalProperties: false, required: ["path", "hashAlgorithm", "sha256", "sourceRef"], properties: { path: string, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" }, sourceRef: string } } },
      includedPointers: { const: SSC_INCLUDED_POINTERS },
      requiredMappings: { type: "array", minItems: 2, maxItems: 2, items: { type: "object", additionalProperties: false, required: ["path", "schemaId", "hashAlgorithm", "sha256", "mappingRefRoot"], properties: { path: string, schemaId: { const: "spectrum-switch-source-mapping.v0" }, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" }, mappingRefRoot: string } } },
      policyRefs: { type: "array", minItems: 3, uniqueItems: true, items: string }, environment: environmentSchema, provenance: provenanceSchema
    }
  });
  schemas["spectrum-switch-source-mapping.v0.schema.json"] = schema("spectrum-switch-source-mapping.v0", { required: Object.keys(sourceMappingProperties), properties: sourceMappingProperties });
  schemas["spectrum-switch-source-inventory.v0.schema.json"] = schema("spectrum-switch-source-inventory.v0", {
    required: ["schemaId", "version", "sourceManifestRef", "upstreamBoundaryRefs", "sourceFiles", "reusedSourceFiles", "coverage", "provenance"],
    properties: {
      schemaId: { const: "spectrum-switch-source-inventory.v0" }, version: { const: SSC_VERSION }, sourceManifestRef: artifactRefSchema, upstreamBoundaryRefs: { type: "array", minItems: 3, maxItems: 3, items: artifactRefSchema }, sourceFiles: { type: "array", minItems: 2, maxItems: 2, items: artifactRefSchema }, reusedSourceFiles: { type: "array", minItems: 2, maxItems: 2, items: artifactRefSchema },
      coverage: { type: "object", additionalProperties: false, required: ["componentIds", "propIds", "stateIds", "accessibilityFactCount", "exampleCount", "mappedTokenIds", "outOfScopeTokenBindingCount", "guidanceBlockCount"], properties: { componentIds: { const: ["Switch"] }, propIds: { type: "array", minItems: 6, maxItems: 6, items: string }, stateIds: { const: ["down", "hover", "keyboardFocus"] }, accessibilityFactCount: { const: 5 }, exampleCount: { const: 1 }, mappedTokenIds: { const: ["switch-control-width-medium-desktop"] }, outOfScopeTokenBindingCount: { const: 61 }, guidanceBlockCount: { const: 16 } } }, provenance: provenanceSchema
    }
  });
  schemas["spectrum-switch-catalog-fixture.v0.schema.json"] = schema("spectrum-switch-catalog-fixture.v0", { required: Object.keys(fixtureProperties), properties: fixtureProperties });
  schemas["spectrum-switch-catalog-preflight-mutation.v0.schema.json"] = schema("spectrum-switch-catalog-preflight-mutation.v0", { required: ["schemaId", "version", "mutationId", "targetPath", "mutation"], properties: { schemaId: { const: "spectrum-switch-catalog-preflight-mutation.v0" }, version: { const: SSC_VERSION }, mutationId: string, targetPath: string, mutation: { enum: ["missing", "nonpass", "hash-mismatch", "extra-path", "source-ref-undeclared", "implementation-drift", "artifact-drift", "report-drift", "evidence-self-hash-drift"] } } });
  schemas["spectrum-switch-catalog-expectations.v0.schema.json"] = schema("spectrum-switch-catalog-expectations.v0", {
    required: ["schemaId", "version", "schemaRoot", "sourceRoot", "fixtureRoot", "inputs", "diagnosticsRegistry", "expectations", "runExpectation"],
    properties: {
      schemaId: { const: "spectrum-switch-catalog-expectations.v0" }, version: { const: SSC_VERSION }, schemaRoot: { const: SSC_SCHEMA_ROOT }, sourceRoot: { const: SSC_SOURCE_ROOT }, fixtureRoot: { const: SSC_FIXTURE_ROOT }, inputs: { type: "array", minItems: SSC_EXPECTATION_ROWS.length + 1, uniqueItems: true, items: string }, diagnosticsRegistry: { type: "array", minItems: SSC_DIAGNOSTIC_ROWS.length, items: diagnosticSchema },
      expectations: { type: "array", minItems: SSC_EXPECTATION_ROWS.length, items: { type: "object", additionalProperties: false, required: ["fixturePath", "kind", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"], properties: { fixturePath: string, kind: { enum: ["valid", "review", "invalid", "mutation"] }, expectedResult: { enum: ["valid", "review_required", "invalid"] }, promotionStatus: status, diagnosticCodes: { type: "array", items: string }, artifactPath: string, jsonPointer: string } } },
      runExpectation: { type: "object", additionalProperties: false, required: ["status", "promotionStatus", "componentIds", "addedComponentIds", "addedTokenIds", "matchedFixtureCount"], properties: { status: { const: "pass" }, promotionStatus: { const: "review_required" }, componentIds: { const: ["Button", "Checkbox", "InLineAlert", "Switch"] }, addedComponentIds: { const: ["Switch"] }, addedTokenIds: { const: ["switch-control-width-medium-desktop"] }, matchedFixtureCount: { const: SSC_EXPECTATION_ROWS.length } } }
    }
  });
  schemas["spectrum-switch-catalog-diagnostics.v0.schema.json"] = schema("spectrum-switch-catalog-diagnostics.v0", { required: ["schemaId", "version", "diagnostics"], properties: { schemaId: { const: "spectrum-switch-catalog-diagnostics.v0" }, version: { const: SSC_VERSION }, diagnostics: { type: "array", items: diagnosticSchema } } });
  schemas["spectrum-switch-catalog-report.v0.schema.json"] = schema("spectrum-switch-catalog-report.v0", { required: [...Object.keys(reportEvidenceCore)], properties: { ...reportEvidenceCore, schemaId: { const: "spectrum-switch-catalog-report.v0" } } });
  schemas["spectrum-switch-catalog-evidence.v0.schema.json"] = schema("spectrum-switch-catalog-evidence.v0", {
    required: [...Object.keys(reportEvidenceCore), "schemaClosure", "sourceFileRefs", "fixtureRefs", "implementationRefs", "artifactRefs", "reportRef"],
    properties: { ...reportEvidenceCore, schemaId: { const: "spectrum-switch-catalog-evidence.v0" }, schemaClosure: { type: "array", minItems: SSC_SCHEMA_FILES.length + SSC_SHARED_SCHEMA_FILES.length, maxItems: SSC_SCHEMA_FILES.length + SSC_SHARED_SCHEMA_FILES.length, uniqueItems: true, items: artifactRefSchema }, sourceFileRefs: { type: "array", minItems: 7, maxItems: 7, uniqueItems: true, items: artifactRefSchema }, fixtureRefs: { type: "array", minItems: SSC_EXPECTATION_ROWS.length + 1, maxItems: SSC_EXPECTATION_ROWS.length + 1, uniqueItems: true, items: artifactRefSchema }, implementationRefs: { type: "array", minItems: SSC_IMPLEMENTATION_FILES.length, maxItems: SSC_IMPLEMENTATION_FILES.length, uniqueItems: true, items: artifactRefSchema }, artifactRefs: { type: "array", minItems: SSC_GENERATED_ARTIFACTS.length, maxItems: SSC_GENERATED_ARTIFACTS.length, uniqueItems: true, items: artifactRefSchema }, reportRef: artifactRefSchema }
  });
  return schemas;
}

function baseFixture(fixtureId) {
  return {
    schemaId: "spectrum-switch-catalog-fixture.v0",
    version: SSC_VERSION,
    fixtureId,
    componentId: "Switch",
    sourceRef: SWITCH_SOURCE_REF,
    stateMapping: { source: "keyboard-focus", target: "keyboardFocus" },
    tokenMode: "desktop",
    propProbe: null,
    requestedAddition: null,
    behaviorClaim: null,
    runtimeAccessibilityClaim: null,
    policyText: null,
    reviewScenario: null,
    promotionRequest: null
  };
}

function schema(id, body) {
  return { $schema: "https://json-schema.org/draft/2020-12/schema", $id: `https://surfaces.dev/schemas/spectrum-switch-catalog/${id}.schema.json`, type: "object", additionalProperties: false, ...body };
}

function diagnostic(code, canonicalMessage, severity, stage, phase, promotionStatus, fixtureCoverage, jsonPointer) {
  return { code, canonicalMessage, severity, stage, phase, promotionStatus, artifactPath: `${SSC_FIXTURE_ROOT}/${fixtureCoverage}`, jsonPointer, sourceRef: fixtureCoverage.includes("source-ref") ? null : SWITCH_SOURCE_REF, fixtureCoverage, diagnosticSource: `spectrum-switch-catalog-${stage}` };
}

function expectation(relative, kind, expectedResult, promotionStatus, diagnosticCodes) {
  return { fixturePath: `${SSC_FIXTURE_ROOT}/${relative}`, kind, expectedResult, promotionStatus, diagnosticCodes, artifactPath: kind === "valid" ? `${SSC_ARTIFACT_ROOT}/governed-catalog.json` : kind === "review" ? `${SSC_ARTIFACT_ROOT}/spectrum-switch-catalog-report.json` : `${SSC_FIXTURE_ROOT}/${relative}`, jsonPointer: "/" };
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
      if (stat.isSymbolicLink()) throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
      if (stat.isDirectory()) await walk(nextPath, nextRelative);
      else if (stat.isFile() && stat.nlink === 1) result.push(nextRelative);
      else throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
    }
  }
  await walk(root, "");
  return result;
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function computeEvidenceSelfHash(evidence, evidencePath) {
  const clone = deepClone(evidence);
  const finalRef = clone.artifactRefs?.find((ref) => ref.path === evidencePath);
  if (!finalRef) throw new Error(`Accepted upstream evidence is missing its final self-hash reference: ${evidencePath}`);
  finalRef.hash = null;
  return sha256Hex(canonicalJson(clone));
}

async function assertSafeDirectoryPath(cwd, relativePath) {
  let current = cwd;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
  }
}

async function assertSafeRegularFilePath(cwd, relativePath) {
  const segments = relativePath.split("/");
  await assertSafeDirectoryPath(cwd, segments.slice(0, -1).join("/"));
  const stat = await fs.lstat(path.join(cwd, relativePath));
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("The Switch source addendum contains an undeclared or unsafe package path.");
}

async function assertSafeOutputPath(cwd, relativePath) {
  const segments = relativePath.split("/");
  let current = cwd;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    try {
      const stat = await fs.lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe Switch materialization path: ${relativePath}`);
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
  try {
    const stat = await fs.lstat(path.join(cwd, relativePath));
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error(`Unsafe Switch materialization path: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
