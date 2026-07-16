import path from "node:path";
import { rawFileHash, writeCanonicalJson } from "./p2-contract.js";

export const SAP_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SAP_VERSION = "0.0.0";
export const SAP_SCHEMA_ROOT = "schemas";
export const SAP_SOURCE_ROOT = "sources/source-accessibility-policy";
export const SAP_FIXTURE_ROOT = "fixtures/source-accessibility-policy";
export const SAP_ARTIFACT_ROOT = "artifacts/source-accessibility-policy";
export const SAP_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SAP_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH = "artifacts/source-conformance/evidence.json";
export const SAP_SOURCE_CONFORMANCE_CATALOG_PATH = "artifacts/source-conformance/governed-catalog.json";
export const SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH = "artifacts/source-family-packaging/evidence.json";
export const SAP_COMMAND = "interfacectl surfaces source-accessibility-policy proof";
export const SAP_CONTRACT_ID = "surfaces-source-accessibility-policy-proof";
export const SAP_ENVIRONMENT = Object.freeze({ generatedAt: SAP_TIMESTAMP, host: null });
export const SAP_EXPECTED_BEHAVIOR_STATUSES = Object.freeze([
  Object.freeze({ behaviorId: "button-accessible-name", status: "allowed" }),
  Object.freeze({ behaviorId: "button-keyboard-activation", status: "allowed" }),
  Object.freeze({ behaviorId: "button-focus-visible", status: "review_required" }),
  Object.freeze({ behaviorId: "inline-alert-status-announcement", status: "allowed" }),
  Object.freeze({ behaviorId: "button-contrast-token", status: "review_required" })
]);
export const SAP_EXPECTED_SUMMARY = Object.freeze({ behaviorCount: 5, allowedCount: 3, reviewRequiredCount: 2, blockedCount: 0 });

export const SAP_SCHEMA_FILES = [
  "source-accessibility-policy-manifest.v0.schema.json",
  "source-accessibility-behavior-declarations.v0.schema.json",
  "source-accessibility-policy-coverage.v0.schema.json",
  "source-accessibility-policy-authority-map.v0.schema.json",
  "source-accessibility-policy-review-queue.v0.schema.json",
  "source-accessibility-policy-report.v0.schema.json",
  "source-accessibility-policy-evidence.v0.schema.json",
  "source-accessibility-policy-expectations.v0.schema.json",
  "source-accessibility-policy-fixture.v0.schema.json",
  "source-accessibility-policy-diagnostics.v0.schema.json",
  "source-accessibility-policy-preflight-mutation.v0.schema.json"
];

export const SAP_GENERATED_ARTIFACTS = [
  "accessibility-policy-coverage.json",
  "accessibility-policy-authority-map.json",
  "accessibility-policy-review-queue.json",
  "accessibility-policy-conformance-report.json",
  "evidence.json"
];
export const SAP_ARTIFACT_PATHS = SAP_GENERATED_ARTIFACTS.map((file) => `${SAP_ARTIFACT_ROOT}/${file}`);

const string = { type: "string", minLength: 1 };
const nullableString = { anyOf: [string, { type: "null" }] };
const status = { enum: ["allowed", "review_required", "blocked"] };
const result = { enum: ["valid", "review_required", "invalid"] };
const behaviorKind = { enum: ["accessible-name", "keyboard-activation", "focus-visible", "status-announcement", "contrast-token", "semantic-role"] };
const componentId = { enum: ["Button", "InLineAlert"] };
const jsonValue = {};
const commandArgsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["source", "ingestionEvidence", "catalog", "sourceConformanceEvidence", "sourceConformanceCatalog", "sourceFamilyPackagingEvidence", "fixture", "out"],
  properties: {
    source: { const: SAP_SOURCE_ROOT },
    ingestionEvidence: { const: SAP_P2_EVIDENCE_PATH },
    catalog: { const: SAP_P2_CATALOG_PATH },
    sourceConformanceEvidence: { const: SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH },
    sourceConformanceCatalog: { const: SAP_SOURCE_CONFORMANCE_CATALOG_PATH },
    sourceFamilyPackagingEvidence: { const: SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH },
    fixture: { const: SAP_FIXTURE_ROOT },
    out: { const: SAP_ARTIFACT_ROOT }
  }
};
const environmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "host"],
  properties: { generatedAt: { const: SAP_TIMESTAMP }, host: { type: "null" } }
};
const provenanceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "generator", "sourceRefs"],
  properties: {
    generatedAt: { const: SAP_TIMESTAMP },
    generator: string,
    sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: string }
  }
};
const artifactRefSchema = {
  type: "object",
  additionalProperties: false,
  required: ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"],
  properties: {
    path: string,
    schemaId: string,
    hashAlgorithm: { const: "sha256" },
    hash: { anyOf: [{ type: "string", pattern: "^[a-f0-9]{64}$" }, { type: "null" }] },
    sourceRef: nullableString,
    sourceEvidenceHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    provenance: provenanceSchema
  }
};
const reviewRouteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["routeId", "owner", "rationale", "expiresAt", "policyRef", "executable"],
  properties: {
    routeId: string,
    owner: string,
    rationale: string,
    expiresAt: { type: "string", pattern: "^1970-01-[0-9]{2}T00:00:00\\.000Z$" },
    policyRef: string,
    executable: { const: false }
  }
};
const assertionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["assertionId", "catalogPointer", "operator", "expectedValue", "sourceRefs"],
  properties: {
    assertionId: string,
    catalogPointer: { type: "string", pattern: "^/components/(Button|InLineAlert)/(accessibility|tokenRefs)/" },
    operator: { enum: ["equals", "exists"] },
    expectedValue: jsonValue,
    sourceRefs: { type: "array", minItems: 1, uniqueItems: true, items: string }
  },
  allOf: [
    {
      if: { properties: { operator: { const: "exists" } }, required: ["operator"] },
      then: { properties: { expectedValue: { const: true } } }
    }
  ]
};
const declarationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["behaviorId", "behaviorKind", "componentId", "policyRef", "policyRequirementValueHash", "assertions", "resolution"],
  properties: {
    behaviorId: string,
    behaviorKind,
    componentId,
    policyRef: { type: "string", pattern: "^declared-source://source-conformance/policies/accessibility\\.json#/requirements/[0-9]+$" },
    policyRequirementValueHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    assertions: { type: "array", minItems: 1, items: assertionSchema },
    resolution: {
      type: "object",
      additionalProperties: false,
      required: ["onMissing", "onConflict", "reviewRouteId"],
      properties: {
        onMissing: { enum: ["blocked", "review_required"] },
        onConflict: { const: "blocked" },
        reviewRouteId: nullableString
      },
      allOf: [
        {
          if: { properties: { onMissing: { const: "review_required" } }, required: ["onMissing"] },
          then: { properties: { reviewRouteId: string } },
          else: { properties: { reviewRouteId: { type: "null" } } }
        }
      ]
    }
  }
};
const diagnosticSchema = {
  type: "object",
  additionalProperties: false,
  required: ["code", "canonicalMessage", "severity", "stage", "phase", "promotionStatus", "artifactPath", "jsonPointer", "sourceRef", "suggestedAction", "fixtureCoverage", "diagnosticSource"],
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
    suggestedAction: string,
    fixtureCoverage: string,
    diagnosticSource: string
  }
};
const validationResultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fixturePath", "kind", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "behaviorId", "matched"],
  properties: {
    fixturePath: string,
    kind: { enum: ["valid", "review", "invalid", "mutation"] },
    expectedResult: result,
    actualResult: result,
    promotionStatus: status,
    diagnosticCodes: { type: "array", uniqueItems: true, items: string },
    artifactPath: string,
    jsonPointer: string,
    behaviorId: nullableString,
    matched: { type: "boolean" }
  }
};

export const SAP_SCHEMAS = {
  "source-accessibility-policy-manifest.v0.schema.json": schema("source-accessibility-policy-manifest.v0", {
    required: ["schemaId", "version", "manifestId", "sourceRef", "sourceFiles"],
    properties: {
      schemaId: { const: "source-accessibility-policy-manifest.v0" }, version: { const: SAP_VERSION }, manifestId: { const: "source-accessibility-policy" }, sourceRef: { const: "source-accessibility-policy://manifest.json#/" },
      sourceFiles: { type: "array", minItems: 1, maxItems: 1, items: { type: "object", additionalProperties: false, required: ["path", "schemaId", "sourceRefRoot", "hashAlgorithm", "sha256"], properties: { path: { const: "accessibility-behavior-declarations.json" }, schemaId: { const: "source-accessibility-behavior-declarations.v0" }, sourceRefRoot: { const: "source-accessibility-policy://accessibility-behavior-declarations.json#/" }, hashAlgorithm: { const: "sha256" }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" } } } }
    }
  }),
  "source-accessibility-behavior-declarations.v0.schema.json": schema("source-accessibility-behavior-declarations.v0", {
    required: ["schemaId", "version", "declarationSetId", "authorityMode", "sourceRef", "policyRef", "evaluationTime", "reviewRoutes", "declarations", "provenance"],
    properties: {
      schemaId: { const: "source-accessibility-behavior-declarations.v0" }, version: { const: SAP_VERSION }, declarationSetId: string, authorityMode: { const: "structured-assertions-only" }, sourceRef: { const: "source-accessibility-policy://accessibility-behavior-declarations.json#/" }, policyRef: { const: "declared-source://source-conformance/policies/accessibility.json#/" }, evaluationTime: { const: SAP_TIMESTAMP }, reviewRoutes: { type: "array", minItems: 1, maxItems: 1, items: reviewRouteSchema }, declarations: { type: "array", minItems: 5, maxItems: 5, items: declarationSchema }, provenance: provenanceSchema
    }
  }),
  "source-accessibility-policy-coverage.v0.schema.json": schema("source-accessibility-policy-coverage.v0", {
    required: ["schemaId", "version", "declarationSetRef", "catalogRef", "behaviors", "summary", "promotionStatus", "provenance"],
    properties: {
      schemaId: { const: "source-accessibility-policy-coverage.v0" }, version: { const: SAP_VERSION }, declarationSetRef: artifactRefSchema, catalogRef: artifactRefSchema,
      behaviors: { type: "array", minItems: 5, maxItems: 5, items: { type: "object", additionalProperties: false, required: ["behaviorId", "behaviorKind", "componentId", "policyRef", "policyRequirementValueHash", "assertions", "status", "reviewRouteId"], properties: { behaviorId: string, behaviorKind, componentId, policyRef: string, policyRequirementValueHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, assertions: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["assertionId", "catalogPointer", "operator", "expectedValueHash", "actualValueHash", "matched", "sourceRefs"], properties: { assertionId: string, catalogPointer: { type: "string", pattern: "^/components/(Button|InLineAlert)/(accessibility|tokenRefs)/" }, operator: { enum: ["equals", "exists"] }, expectedValueHash: { type: "string", pattern: "^[a-f0-9]{64}$" }, actualValueHash: { anyOf: [{ type: "string", pattern: "^[a-f0-9]{64}$" }, { type: "null" }] }, matched: { type: "boolean" }, sourceRefs: { type: "array", minItems: 2, uniqueItems: true, items: string } } } }, status, reviewRouteId: nullableString } } },
      summary: countSummary(), promotionStatus: status, provenance: provenanceSchema
    }
  }),
  "source-accessibility-policy-authority-map.v0.schema.json": schema("source-accessibility-policy-authority-map.v0", {
    required: ["schemaId", "version", "declarationSetRef", "coverageRef", "catalogRef", "bindings", "catalogCapabilityAdded", "provenance"],
    properties: { schemaId: { const: "source-accessibility-policy-authority-map.v0" }, version: { const: SAP_VERSION }, declarationSetRef: artifactRefSchema, coverageRef: artifactRefSchema, catalogRef: artifactRefSchema, bindings: { type: "array", items: { type: "object", additionalProperties: false, required: ["behaviorId", "componentId", "catalogPointers", "policyRef", "sourceRefs", "status"], properties: { behaviorId: string, componentId: string, catalogPointers: { type: "array", minItems: 1, items: string }, policyRef: string, sourceRefs: { type: "array", minItems: 2, items: string }, status } } }, catalogCapabilityAdded: { const: false }, provenance: provenanceSchema }
  }),
  "source-accessibility-policy-review-queue.v0.schema.json": schema("source-accessibility-policy-review-queue.v0", {
    required: ["schemaId", "version", "items", "summary", "provenance"],
    properties: { schemaId: { const: "source-accessibility-policy-review-queue.v0" }, version: { const: SAP_VERSION }, items: { type: "array", items: { type: "object", additionalProperties: false, required: ["itemId", "behaviorId", "componentId", "diagnosticCode", "owner", "rationale", "expiresAt", "policyRef", "requiredSourceRefs", "executable", "status"], properties: { itemId: string, behaviorId: string, componentId: string, diagnosticCode: string, owner: string, rationale: string, expiresAt: string, policyRef: string, requiredSourceRefs: { type: "array", minItems: 2, items: string }, executable: { const: false }, status: { const: "review_required" } } } }, summary: { type: "object", additionalProperties: false, required: ["itemCount", "executableCount"], properties: { itemCount: { type: "integer", minimum: 0 }, executableCount: { const: 0 } } }, provenance: provenanceSchema }
  }),
  "source-accessibility-policy-report.v0.schema.json": schema("source-accessibility-policy-report.v0", reportEvidenceProperties("source-accessibility-policy-report.v0", false)),
  "source-accessibility-policy-evidence.v0.schema.json": schema("source-accessibility-policy-evidence.v0", reportEvidenceProperties("source-accessibility-policy-evidence.v0", true)),
  "source-accessibility-policy-expectations.v0.schema.json": schema("source-accessibility-policy-expectations.v0", {
    required: ["schemaId", "version", "schemaRoot", "sourceRoot", "fixtureRoot", "inputs", "diagnosticsRegistry", "expectations", "runExpectation"],
    properties: { schemaId: { const: "source-accessibility-policy-expectations.v0" }, version: { const: SAP_VERSION }, schemaRoot: { const: SAP_SCHEMA_ROOT }, sourceRoot: { const: SAP_SOURCE_ROOT }, fixtureRoot: { const: SAP_FIXTURE_ROOT }, inputs: { type: "array", minItems: 1, uniqueItems: true, items: string }, diagnosticsRegistry: { type: "array", minItems: 1, items: diagnosticSchema }, expectations: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["fixturePath", "kind", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"], properties: { fixturePath: string, kind: { enum: ["valid", "review", "invalid", "mutation"] }, expectedResult: result, promotionStatus: status, diagnosticCodes: { type: "array", uniqueItems: true, items: string }, artifactPath: string, jsonPointer: string } } }, runExpectation: { type: "object", additionalProperties: false, required: ["status", "promotionStatus", "summary", "behaviorStatuses"], properties: { status: { const: "pass" }, promotionStatus: { const: "review_required" }, summary: { const: SAP_EXPECTED_SUMMARY }, behaviorStatuses: { const: SAP_EXPECTED_BEHAVIOR_STATUSES } } } }
  }),
  "source-accessibility-policy-fixture.v0.schema.json": schema("source-accessibility-policy-fixture.v0", {
    required: ["schemaId", "version", "fixtureId", "behaviorId", "declarationOverride", "authorityConflict", "ambiguity", "reviewRouteMutation", "freeFormPolicyText", "catalogMutation"],
    properties: { schemaId: { const: "source-accessibility-policy-fixture.v0" }, version: { const: SAP_VERSION }, fixtureId: string, behaviorId: nullableString, declarationOverride: { anyOf: [declarationSchema, { type: "null" }] }, authorityConflict: { anyOf: [{ type: "object", additionalProperties: false, required: ["catalogPointer", "primaryValue", "supportingValues", "selectedValue", "resolutionMode", "policyRef"], properties: { catalogPointer: string, primaryValue: jsonValue, supportingValues: { type: "array", minItems: 1, items: jsonValue }, selectedValue: jsonValue, resolutionMode: { enum: ["primary-precedence", "unresolved"] }, policyRef: string } }, { type: "null" }] }, ambiguity: { anyOf: [{ type: "object", additionalProperties: false, required: ["candidatePointers", "reviewRouteId"], properties: { candidatePointers: { type: "array", minItems: 2, uniqueItems: true, items: string }, reviewRouteId: string } }, { type: "null" }] }, reviewRouteMutation: { anyOf: [{ type: "object", additionalProperties: false, required: ["routeId", "owner"], properties: { routeId: string, owner: nullableString } }, { type: "null" }] }, freeFormPolicyText: nullableString, catalogMutation: { anyOf: [{ type: "object", additionalProperties: false, required: ["catalogPointer", "value"], properties: { catalogPointer: string, value: jsonValue } }, { type: "null" }] } }
  }),
  "source-accessibility-policy-diagnostics.v0.schema.json": schema("source-accessibility-policy-diagnostics.v0", { required: ["schemaId", "version", "diagnosticsRegistry"], properties: { schemaId: { const: "source-accessibility-policy-diagnostics.v0" }, version: { const: SAP_VERSION }, diagnosticsRegistry: { type: "array", minItems: 1, items: diagnosticSchema } } }),
  "source-accessibility-policy-preflight-mutation.v0.schema.json": schema("source-accessibility-policy-preflight-mutation.v0", { required: ["schemaId", "version", "mutationId", "upstreamPath", "mutation"], properties: { schemaId: { const: "source-accessibility-policy-preflight-mutation.v0" }, version: { const: SAP_VERSION }, mutationId: string, upstreamPath: string, mutation: { enum: ["missing", "hash-mismatch", "status-fail"] } } })
};

export const SAP_DIAGNOSTIC_ROWS = [
  diagnostic("SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING", "Required upstream accessibility authority evidence is missing or not passing.", "error", "preflight", "source-accessibility-policy-preflight", "blocked", "mutations/missing-upstream-evidence.source-accessibility-policy-preflight.json", "/upstreamPath", null, "Restore accepted P2, source-conformance, and source-family packaging evidence."),
  diagnostic("SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH", "Upstream accessibility authority evidence does not match the accepted artifact hash.", "error", "preflight", "source-accessibility-policy-preflight", "blocked", "mutations/upstream-hash-mismatch.source-accessibility-policy-preflight.json", "/upstreamPath", null, "Regenerate accepted upstream proof evidence before accessibility policy reconciliation."),
  diagnostic("SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH", "Structured accessibility behavior source bytes do not match the manifest.", "error", "source", "source-accessibility-policy-source", "blocked", "mutations/source-hash-mismatch.source-accessibility-policy.json", "/sourceFiles/0/sha256", "source-accessibility-policy://manifest.json#/", "Review and rebind the checked structured declaration source."),
  diagnostic("SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN", "Free-form policy text cannot define accessibility behavior authority.", "error", "conformance", "source-accessibility-policy-structure", "blocked", "invalid/free-form-policy-text.source-accessibility-policy.json", "/freeFormPolicyText", null, "Replace policy prose with closed structured assertions, operators, values, and source refs."),
  diagnostic("SOURCE_ACCESSIBILITY_POLICY_CATALOG_CONFLICT", "Structured accessibility behavior contradicts the accepted catalog.", "error", "conformance", "source-accessibility-policy-conflict", "blocked", "invalid/policy-catalog-conflict.source-accessibility-policy.json", "/declarationOverride/assertions/0", null, "Correct the structured declaration or update source authority through a separate proven ingestion boundary."),
  diagnostic("SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED", "Structured accessibility behavior is unsupported by the accepted catalog.", "error", "conformance", "source-accessibility-policy-coverage", "blocked", "invalid/unsupported-behavior.source-accessibility-policy.json", "/declarationOverride/assertions/0/catalogPointer", null, "Add an authoritative catalog fact through a separate proof or route the unresolved declaration to review."),
  diagnostic("SOURCE_ACCESSIBILITY_MAPPING_AMBIGUOUS", "Structured accessibility behavior mapping is ambiguous and requires owner review.", "review", "review", "source-accessibility-policy-review", "review_required", "review/ambiguous-mapping.source-accessibility-policy.json", "/ambiguity", null, "Resolve the catalog pointer mapping or preserve a non-executable owner-bound review item."),
  diagnostic("SOURCE_ACCESSIBILITY_REVIEW_REQUIRED", "Structured accessibility behavior lacks an authoritative catalog fact and requires owner review.", "review", "review", "source-accessibility-policy-review", "review_required", "review/focus-visible-unproven.source-accessibility-policy.json", "/behaviorId", null, "Add the missing structured fact through authority or complete the declared review route."),
  diagnostic("SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING", "Accessibility review-required output must include a declared owner.", "error", "review", "source-accessibility-policy-review", "blocked", "invalid/review-owner-missing.source-accessibility-policy.json", "/reviewRouteMutation/owner", null, "Restore the owner on the structured non-executable review route."),
  diagnostic("SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION", "Accessibility policy reconciliation attempted to add catalog capability.", "error", "conformance", "source-accessibility-policy-authority", "blocked", "invalid/authority-escalation.source-accessibility-policy.json", "/catalogMutation/catalogPointer", null, "Keep assertions under the existing Button or InLineAlert accessibility and token-ref boundary."),
  diagnostic("SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING", "Structured accessibility behavior must include declared policy and fact source refs.", "error", "conformance", "source-accessibility-policy-source-refs", "blocked", "invalid/source-ref-missing.source-accessibility-policy.json", "/declarationOverride/assertions/0/sourceRefs", null, "Bind the assertion to the checked declaration, policy requirement, and catalog fact source refs."),
  diagnostic("SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED", "Accessibility behavior source conflict lacks an explicit policy-authorized resolution.", "error", "conformance", "source-accessibility-policy-precedence", "blocked", "invalid/precedence-unresolved.source-accessibility-policy.json", "/authorityConflict/resolutionMode", null, "Declare primary precedence with the checked source-precedence policy or route the conflict to review."),
  diagnostic("SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH", "Accessibility policy report or evidence hash does not match the generated proof closure.", "error", "evidence", "source-accessibility-policy-evidence", "blocked", "mutations/evidence-hash-mismatch.source-accessibility-policy.json", "/artifacts/0/hash", null, "Regenerate accessibility policy artifacts and evidence from checked inputs.")
];

export const SAP_EXPECTATION_ROWS = [
  expectation("valid/button-accessible-name.source-accessibility-policy.json", "valid", "valid", "allowed", [], "/behaviorId"),
  expectation("valid/button-keyboard-activation.source-accessibility-policy.json", "valid", "valid", "allowed", [], "/behaviorId"),
  expectation("valid/inline-alert-status-announcement.source-accessibility-policy.json", "valid", "valid", "allowed", [], "/behaviorId"),
  expectation("valid/policy-authorized-precedence.source-accessibility-policy.json", "valid", "valid", "allowed", [], "/authorityConflict"),
  expectation("review/focus-visible-unproven.source-accessibility-policy.json", "review", "review_required", "review_required", ["SOURCE_ACCESSIBILITY_REVIEW_REQUIRED"], "/behaviorId"),
  expectation("review/contrast-token-unproven.source-accessibility-policy.json", "review", "review_required", "review_required", ["SOURCE_ACCESSIBILITY_REVIEW_REQUIRED"], "/behaviorId"),
  expectation("review/ambiguous-mapping.source-accessibility-policy.json", "review", "review_required", "review_required", ["SOURCE_ACCESSIBILITY_MAPPING_AMBIGUOUS"], "/ambiguity"),
  expectation("invalid/free-form-policy-text.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_FREE_FORM_POLICY_FORBIDDEN"], "/freeFormPolicyText"),
  expectation("invalid/policy-catalog-conflict.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_POLICY_CATALOG_CONFLICT"], "/declarationOverride/assertions/0"),
  expectation("invalid/unsupported-behavior.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_REQUIREMENT_UNSUPPORTED"], "/declarationOverride/assertions/0/catalogPointer"),
  expectation("invalid/review-owner-missing.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_REVIEW_OWNER_MISSING"], "/reviewRouteMutation/owner"),
  expectation("invalid/authority-escalation.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_AUTHORITY_ESCALATION"], "/catalogMutation/catalogPointer"),
  expectation("invalid/source-ref-missing.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_SOURCE_REF_MISSING"], "/declarationOverride/assertions/0/sourceRefs"),
  expectation("invalid/precedence-unresolved.source-accessibility-policy.json", "invalid", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_PRECEDENCE_UNRESOLVED"], "/authorityConflict/resolutionMode"),
  expectation("mutations/missing-upstream-evidence.source-accessibility-policy-preflight.json", "mutation", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_UPSTREAM_EVIDENCE_MISSING"], "/upstreamPath"),
  expectation("mutations/upstream-hash-mismatch.source-accessibility-policy-preflight.json", "mutation", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_UPSTREAM_HASH_MISMATCH"], "/upstreamPath"),
  expectation("mutations/source-hash-mismatch.source-accessibility-policy.json", "mutation", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_SOURCE_HASH_MISMATCH"], "/sourceFiles/0/sha256"),
  expectation("mutations/evidence-hash-mismatch.source-accessibility-policy.json", "mutation", "invalid", "blocked", ["SOURCE_ACCESSIBILITY_EVIDENCE_HASH_MISMATCH"], "/artifacts/0/hash")
];

export const SAP_FIXTURES = buildFixtures();

export async function materializeSourceAccessibilityPolicyContract(cwd) {
  for (const [file, value] of Object.entries(SAP_SCHEMAS)) await writeCanonicalJson(path.join(cwd, SAP_SCHEMA_ROOT, file), value);
  for (const [relative, value] of Object.entries(SAP_FIXTURES)) await writeCanonicalJson(path.join(cwd, SAP_FIXTURE_ROOT, relative), value);
}

export function sapSchemaPaths() { return SAP_SCHEMA_FILES.map((file) => `${SAP_SCHEMA_ROOT}/${file}`); }
export function sapFixturePaths() {
  return [
    `${SAP_FIXTURE_ROOT}/expectations.manifest.json`,
    ...Object.keys(SAP_FIXTURES).filter((file) => file !== "expectations.manifest.json").map((file) => `${SAP_FIXTURE_ROOT}/${file}`)
  ];
}
export function sapSourcePaths() { return [`${SAP_SOURCE_ROOT}/manifest.json`, `${SAP_SOURCE_ROOT}/accessibility-behavior-declarations.json`]; }
export function sapSchemaIdForPath(relativePath) {
  if (relativePath.endsWith("/manifest.json")) return "source-accessibility-policy-manifest.v0";
  if (relativePath.endsWith("/accessibility-behavior-declarations.json")) return "source-accessibility-behavior-declarations.v0";
  const file = path.posix.basename(relativePath);
  const map = {
    "accessibility-policy-coverage.json": "source-accessibility-policy-coverage.v0",
    "accessibility-policy-authority-map.json": "source-accessibility-policy-authority-map.v0",
    "accessibility-policy-review-queue.json": "source-accessibility-policy-review-queue.v0",
    "accessibility-policy-conformance-report.json": "source-accessibility-policy-report.v0",
    "evidence.json": "source-accessibility-policy-evidence.v0",
    "expectations.manifest.json": "source-accessibility-policy-expectations.v0"
  };
  if (map[file]) return map[file];
  if (relativePath.includes("source-accessibility-policy-preflight")) return "source-accessibility-policy-preflight-mutation.v0";
  if (relativePath.startsWith(`${SAP_FIXTURE_ROOT}/`)) return "source-accessibility-policy-fixture.v0";
  if (relativePath.startsWith(`${SAP_SCHEMA_ROOT}/`)) return file.replace(/\.schema\.json$/, "");
  return "json-input";
}
export async function sapSourceRefs(cwd) {
  return [
    artifactRef(`${SAP_SOURCE_ROOT}/manifest.json`, "source-accessibility-policy-manifest.v0", await rawFileHash(path.join(cwd, SAP_SOURCE_ROOT, "manifest.json")), "source-accessibility-policy://manifest.json#/"),
    artifactRef(`${SAP_SOURCE_ROOT}/accessibility-behavior-declarations.json`, "source-accessibility-behavior-declarations.v0", await rawFileHash(path.join(cwd, SAP_SOURCE_ROOT, "accessibility-behavior-declarations.json")), "source-accessibility-policy://accessibility-behavior-declarations.json#/")
  ];
}
export function artifactRef(pathValue, schemaId, hash, sourceRef = null, extras = {}) { return { path: pathValue, schemaId, hashAlgorithm: "sha256", hash, sourceRef, ...extras }; }
export function provenance(generator, sourceRefs) { return { generatedAt: SAP_TIMESTAMP, generator, sourceRefs: [...new Set(sourceRefs)].sort() }; }
export function diagnosticsRegistry() { return SAP_DIAGNOSTIC_ROWS.map((row) => ({ ...row })); }

function schema(id, body) { return { $schema: "https://json-schema.org/draft/2020-12/schema", $id: `https://surfaces.dev/schemas/source-accessibility-policy/${id}.schema.json`, type: "object", additionalProperties: false, ...body }; }
function countSummary() { return { type: "object", additionalProperties: false, required: ["behaviorCount", "allowedCount", "reviewRequiredCount", "blockedCount"], properties: { behaviorCount: { type: "integer", minimum: 0 }, allowedCount: { type: "integer", minimum: 0 }, reviewRequiredCount: { type: "integer", minimum: 0 }, blockedCount: { type: "integer", minimum: 0 } } }; }
function reportEvidenceProperties(schemaId, evidence) {
  const properties = { contractId: { const: SAP_CONTRACT_ID }, schemaId: { const: schemaId }, version: { const: SAP_VERSION }, runId: string, checkedAt: { const: SAP_TIMESTAMP }, command: { const: SAP_COMMAND }, args: commandArgsSchema, environment: environmentSchema, schemaClosure: { type: "array", items: artifactRefSchema }, sourceFileRefs: { type: "array", items: artifactRefSchema }, fixtureRefs: { type: "array", items: artifactRefSchema }, boundaryRefs: { type: "array", items: artifactRefSchema }, artifacts: { type: "array", items: artifactRefSchema }, coverageRef: artifactRefSchema, authorityMapRef: artifactRefSchema, reviewQueueRef: artifactRefSchema, validationResults: { type: "array", items: validationResultSchema }, diagnostics: { type: "array", items: diagnosticSchema }, diagnosticsRegistry: { type: "array", items: diagnosticSchema }, summary: countSummary(), structuredDeclarationsOnly: { const: true }, catalogCapabilityAdded: { const: false }, status: { enum: ["pass", "fail"] }, promotionStatus: status, provenance: provenanceSchema };
  const required = ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "boundaryRefs", "coverageRef", "authorityMapRef", "reviewQueueRef", "validationResults", "diagnostics", "diagnosticsRegistry", "summary", "structuredDeclarationsOnly", "catalogCapabilityAdded", "status", "promotionStatus", "provenance"];
  if (evidence) required.push("schemaClosure", "sourceFileRefs", "fixtureRefs", "artifacts");
  return { required, properties };
}
function diagnostic(code, canonicalMessage, severity, stage, phase, promotionStatus, fixtureCoverage, jsonPointer, sourceRef, suggestedAction) { return { code, canonicalMessage, severity, stage, phase, promotionStatus, artifactPath: `${SAP_FIXTURE_ROOT}/${fixtureCoverage}`, jsonPointer, sourceRef, suggestedAction, fixtureCoverage, diagnosticSource: `source-accessibility-policy-${stage}` }; }
function expectation(relative, kind, expectedResult, promotionStatus, diagnosticCodes, jsonPointer) { return { fixturePath: `${SAP_FIXTURE_ROOT}/${relative}`, kind, expectedResult, promotionStatus, diagnosticCodes, artifactPath: kind === "review" ? `${SAP_ARTIFACT_ROOT}/accessibility-policy-review-queue.json` : kind === "valid" ? `${SAP_ARTIFACT_ROOT}/accessibility-policy-conformance-report.json` : `${SAP_FIXTURE_ROOT}/${relative}`, jsonPointer }; }
function baseFixture(fixtureId, behaviorId = null) { return { schemaId: "source-accessibility-policy-fixture.v0", version: SAP_VERSION, fixtureId, behaviorId, declarationOverride: null, authorityConflict: null, ambiguity: null, reviewRouteMutation: null, freeFormPolicyText: null, catalogMutation: null }; }
function buildFixtures() {
  const result = {};
  const put = (pathValue, value) => { result[pathValue] = value; };
  put("valid/button-accessible-name.source-accessibility-policy.json", baseFixture("button-accessible-name", "button-accessible-name"));
  put("valid/button-keyboard-activation.source-accessibility-policy.json", baseFixture("button-keyboard-activation", "button-keyboard-activation"));
  put("valid/inline-alert-status-announcement.source-accessibility-policy.json", baseFixture("inline-alert-status-announcement", "inline-alert-status-announcement"));
  put("valid/policy-authorized-precedence.source-accessibility-policy.json", { ...baseFixture("policy-authorized-precedence", "button-accessible-name"), authorityConflict: { catalogPointer: "/components/Button/accessibility/role", primaryValue: "button", supportingValues: ["link"], selectedValue: "button", resolutionMode: "primary-precedence", policyRef: "declared-source://source-conformance/policies/source-precedence.json#/" } });
  put("review/focus-visible-unproven.source-accessibility-policy.json", baseFixture("focus-visible-unproven", "button-focus-visible"));
  put("review/contrast-token-unproven.source-accessibility-policy.json", baseFixture("contrast-token-unproven", "button-contrast-token"));
  put("review/ambiguous-mapping.source-accessibility-policy.json", { ...baseFixture("ambiguous-mapping", "button-focus-visible"), ambiguity: { candidatePointers: ["/components/Button/accessibility/focusVisible", "/components/Button/states/focus"], reviewRouteId: "design-systems-governance" } });
  put("invalid/free-form-policy-text.source-accessibility-policy.json", { ...baseFixture("free-form-policy-text", "button-accessible-name"), freeFormPolicyText: "Buttons should have a useful accessible name." });
  const conflict = structuredOverride("button-role-conflict", "semantic-role", "Button", "/components/Button/accessibility/role", "equals", "link", "blocked");
  put("invalid/policy-catalog-conflict.source-accessibility-policy.json", { ...baseFixture("policy-catalog-conflict", "button-accessible-name"), declarationOverride: conflict });
  const unsupported = structuredOverride("button-focus-visible-blocked", "focus-visible", "Button", "/components/Button/accessibility/focusVisible", "equals", true, "blocked");
  put("invalid/unsupported-behavior.source-accessibility-policy.json", { ...baseFixture("unsupported-behavior", "button-focus-visible"), declarationOverride: unsupported });
  put("invalid/review-owner-missing.source-accessibility-policy.json", { ...baseFixture("review-owner-missing", "button-focus-visible"), reviewRouteMutation: { routeId: "design-systems-governance", owner: null } });
  put("invalid/authority-escalation.source-accessibility-policy.json", { ...baseFixture("authority-escalation", "button-accessible-name"), catalogMutation: { catalogPointer: "/components/Button/actions/press", value: { enabled: true } } });
  const missingRef = structuredOverride("button-source-ref-missing", "accessible-name", "Button", "/components/Button/accessibility/nameFrom", "equals", "content", "blocked");
  missingRef.assertions[0].sourceRefs = [
    "source-accessibility-policy://accessibility-behavior-declarations.json#/declarations/0/assertions/0",
    "declared-source://source-conformance/policies/accessibility.json#/requirements/0",
    "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/not-button.json#/accessibility"
  ];
  put("invalid/source-ref-missing.source-accessibility-policy.json", { ...baseFixture("source-ref-missing", "button-accessible-name"), declarationOverride: missingRef });
  put("invalid/precedence-unresolved.source-accessibility-policy.json", { ...baseFixture("precedence-unresolved", "button-accessible-name"), authorityConflict: { catalogPointer: "/components/Button/accessibility/role", primaryValue: "button", supportingValues: ["link"], selectedValue: "button", resolutionMode: "unresolved", policyRef: "declared-source://source-conformance/policies/source-precedence.json#/" } });
  put("mutations/missing-upstream-evidence.source-accessibility-policy-preflight.json", { schemaId: "source-accessibility-policy-preflight-mutation.v0", version: SAP_VERSION, mutationId: "missing-upstream-evidence", upstreamPath: SAP_SOURCE_FAMILY_PACKAGING_EVIDENCE_PATH, mutation: "missing" });
  put("mutations/upstream-hash-mismatch.source-accessibility-policy-preflight.json", { schemaId: "source-accessibility-policy-preflight-mutation.v0", version: SAP_VERSION, mutationId: "upstream-hash-mismatch", upstreamPath: SAP_SOURCE_CONFORMANCE_EVIDENCE_PATH, mutation: "hash-mismatch" });
  put("mutations/source-hash-mismatch.source-accessibility-policy.json", baseFixture("source-hash-mismatch", null));
  put("mutations/evidence-hash-mismatch.source-accessibility-policy.json", baseFixture("evidence-hash-mismatch", null));
  const inputs = [
    `${SAP_FIXTURE_ROOT}/expectations.manifest.json`,
    ...SAP_EXPECTATION_ROWS.map((entry) => entry.fixturePath)
  ];
  result["expectations.manifest.json"] = { schemaId: "source-accessibility-policy-expectations.v0", version: SAP_VERSION, schemaRoot: SAP_SCHEMA_ROOT, sourceRoot: SAP_SOURCE_ROOT, fixtureRoot: SAP_FIXTURE_ROOT, inputs, diagnosticsRegistry: diagnosticsRegistry(), expectations: SAP_EXPECTATION_ROWS, runExpectation: { status: "pass", promotionStatus: "review_required", summary: SAP_EXPECTED_SUMMARY, behaviorStatuses: SAP_EXPECTED_BEHAVIOR_STATUSES } };
  return result;
}
function structuredOverride(behaviorId, behaviorKind, componentId, catalogPointer, operator, expectedValue, onMissing) { return { behaviorId, behaviorKind, componentId, policyRef: "declared-source://source-conformance/policies/accessibility.json#/requirements/0", policyRequirementValueHash: "fab4144702ff54ce666df0759fe1a5ce933795c774d01801c9e91c2f5bcb1da1", assertions: [{ assertionId: `${behaviorId}-assertion`, catalogPointer, operator, expectedValue, sourceRefs: ["source-accessibility-policy://accessibility-behavior-declarations.json#/declarations/0/assertions/0", "declared-source://source-conformance/policies/accessibility.json#/requirements/0", "spectrum-design-data://npm/@adobe/spectrum-design-data@0.7.0/package/components/button.json#/accessibility"] }], resolution: { onMissing, onConflict: "blocked", reviewRouteId: onMissing === "review_required" ? "design-systems-governance" : null } }; }
