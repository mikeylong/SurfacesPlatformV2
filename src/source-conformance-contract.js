import path from "node:path";
import {
  P2_SCHEMA_FILES,
  P2_SHARED_SCHEMA_FILES,
  canonicalFileHash,
  deepClone,
  rawFileHash,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";
import { canonicalJson } from "./p0.js";

export const SC_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const SC_VERSION = "0.0.0";
export const SC_SCHEMA_ROOT = "schemas";
export const SC_SOURCE_ROOT = "sources/source-conformance/declared-source-bundle";
export const SC_FIXTURE_ROOT = "fixtures/source-conformance";
export const SC_ARTIFACT_ROOT = "artifacts/source-conformance";
export const SC_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const SC_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const SC_COMMAND = "interfacectl surfaces source-conformance proof";
export const SC_CONTRACT_ID = "surfaces-source-conformance-proof";

export const SC_ENVIRONMENT = Object.freeze({
  generatedAt: SC_TIMESTAMP,
  host: null
});

export const SC_SCHEMA_FILES = [
  "declared-source-manifest.v0.schema.json",
  "declared-source-document.v0.schema.json",
  "declared-source-inventory.v0.schema.json",
  "source-authority-map.v0.schema.json",
  "source-review-queue.v0.schema.json",
  "source-conformance-report.v0.schema.json",
  "source-conformance-evidence.v0.schema.json",
  "source-conformance-expectations.v0.schema.json",
  "source-conformance-diagnostics.v0.schema.json",
  "source-conformance-fixture.v0.schema.json",
  "source-conformance-preflight-mutation.v0.schema.json"
];

export const SC_CONSUMED_SCHEMA_FILES = [...P2_SCHEMA_FILES, ...P2_SHARED_SCHEMA_FILES];

export const SC_GENERATED_ARTIFACTS = [
  "source-inventory.json",
  "source-authority-map.json",
  "source-review-queue.json",
  "source-conformance-report.json",
  "evidence.json"
];

export const SC_ARTIFACT_PATHS = SC_GENERATED_ARTIFACTS.map((file) => `${SC_ARTIFACT_ROOT}/${file}`);

export const SC_FORBIDDEN_CLAIM_KEYS = [
  "customerValidation",
  "productionReadiness",
  "pilotReadiness",
  "selfServeSupport",
  "liveIntegration",
  "liveIngestion",
  "productionApi",
  "api",
  "sdk",
  "a2ui",
  "productionAdapter",
  "nativeRuntime",
  "nativeSdk",
  "actionExecution",
  "liveRuntime",
  "liveSurfaceOps",
  "liveJudgmentKit"
];

export const SC_SOURCE_DOCUMENTS = {
  "components/button.json": {
    schemaId: "declared-source-document.v0",
    version: SC_VERSION,
    documentId: "button",
    sourceType: "component",
    componentId: "Button",
    sourceRef: "declared-source://source-conformance/components/button.json#/",
    authoritativeFields: ["props", "variants", "states", "actions", "accessibility", "tokens"],
    policyRefs: [
      "declared-source://source-conformance/policies/accessibility.json#/",
      "declared-source://source-conformance/governance/review-policy.json#/"
    ],
    notes: "Button may be emitted only with declared variants, token refs, accessibility, and inert action policy."
  },
  "components/in-line-alert.json": {
    schemaId: "declared-source-document.v0",
    version: SC_VERSION,
    documentId: "in-line-alert",
    sourceType: "component",
    componentId: "InLineAlert",
    sourceRef: "declared-source://source-conformance/components/in-line-alert.json#/",
    authoritativeFields: ["props", "variants", "states", "accessibility", "tokens"],
    policyRefs: [
      "declared-source://source-conformance/policies/accessibility.json#/",
      "declared-source://source-conformance/policies/content.json#/"
    ],
    notes: "In-line alert output must preserve status semantics, accessible announcement policy, and content rules."
  },
  "policies/accessibility.json": {
    schemaId: "declared-source-document.v0",
    version: SC_VERSION,
    documentId: "accessibility-policy",
    sourceType: "accessibility-policy",
    sourceRef: "declared-source://source-conformance/policies/accessibility.json#/",
    requirements: [
      "accessible-name-required",
      "keyboard-activation-required",
      "focus-visible-required",
      "status-announcement-required",
      "contrast-token-required"
    ]
  },
  "policies/content.json": {
    schemaId: "declared-source-document.v0",
    version: SC_VERSION,
    documentId: "content-policy",
    sourceType: "content-policy",
    sourceRef: "declared-source://source-conformance/policies/content.json#/",
    requirements: ["plain-language", "no-unsafe-markup", "status-copy-matches-severity"]
  },
  "governance/review-policy.json": {
    schemaId: "declared-source-document.v0",
    version: SC_VERSION,
    documentId: "review-policy",
    sourceType: "review-policy",
    sourceRef: "declared-source://source-conformance/governance/review-policy.json#/",
    reviewRequiredWhen: [
      "source-precedence-ambiguous",
      "brand-exception-requested",
      "new-action-semantics-requested",
      "accessibility-judgment-required"
    ],
    requiredReviewMetadata: ["owner", "rationale", "expiresAt"]
  }
};

export const SC_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "SOURCE_UPSTREAM_EVIDENCE_MISSING",
    canonicalMessage: "Source conformance upstream P2 evidence is missing.",
    stage: "preflight",
    phase: "source-conformance-preflight",
    artifactPath: "fixtures/source-conformance/mutations/missing-upstream-evidence.source-conformance-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-upstream-evidence.source-conformance-preflight.json"
  }),
  diagnosticRow({
    code: "DECLARED_SOURCE_PATH_UNDECLARED",
    canonicalMessage: "Declared source file path is not listed in the manifest.",
    stage: "source-inventory",
    phase: "declared-source-manifest",
    artifactPath: "fixtures/source-conformance/mutations/source-path-undeclared.declared-source-manifest.json",
    jsonPointer: "/sourceFiles",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/source-path-undeclared.declared-source-manifest.json"
  }),
  diagnosticRow({
    code: "DECLARED_SOURCE_HASH_MISMATCH",
    canonicalMessage: "Declared source file hash does not match the manifest.",
    stage: "source-inventory",
    phase: "declared-source-manifest",
    artifactPath: "fixtures/source-conformance/mutations/source-hash-mismatch.declared-source-manifest.json",
    jsonPointer: "/sourceFiles/0/sha256",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/source-hash-mismatch.declared-source-manifest.json"
  }),
  diagnosticRow({
    code: "DECLARED_SOURCE_REF_INVALID",
    canonicalMessage: "Declared source reference is missing, malformed, or outside the source bundle.",
    stage: "conformance",
    phase: "source-fixture-validation",
    artifactPath: "fixtures/source-conformance/invalid/missing-source-ref.source-conformance.json",
    jsonPointer: "/sourceRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/missing-source-ref.source-conformance.json"
  }),
  diagnosticRow({
    code: "DECLARED_SOURCE_REF_UNDECLARED",
    canonicalMessage: "Declared source reference is not listed in the manifest.",
    stage: "conformance",
    phase: "source-fixture-validation",
    artifactPath: "fixtures/source-conformance/invalid/undeclared-source-ref.source-conformance.json",
    jsonPointer: "/requiredSourceRefs/0",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/undeclared-source-ref.source-conformance.json"
  }),
  diagnosticRow({
    code: "SOURCE_CATALOG_COMPONENT_UNKNOWN",
    canonicalMessage: "Declared source fixture component is absent from accepted P2 catalog.",
    stage: "conformance",
    phase: "source-catalog-authority",
    artifactPath: "fixtures/source-conformance/invalid/unknown-component.source-conformance.json",
    jsonPointer: "/componentId",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unknown-component.source-conformance.json"
  }),
  diagnosticRow({
    code: "SOURCE_COMPONENT_SOURCE_MISMATCH",
    canonicalMessage: "Declared source fixture component does not match its declared component source.",
    stage: "conformance",
    phase: "source-component-authority",
    artifactPath: "fixtures/source-conformance/invalid/component-source-mismatch.source-conformance.json",
    jsonPointer: "/sourceRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/component-source-mismatch.source-conformance.json"
  }),
  diagnosticRow({
    code: "SOURCE_AUTHORITY_CONFLICT",
    canonicalMessage: "Declared sources conflict without an authority rule that resolves the conflict.",
    stage: "conformance",
    phase: "source-authority",
    artifactPath: "fixtures/source-conformance/invalid/source-authority-conflict.source-conformance.json",
    jsonPointer: "/authorityConflict",
    sourceRef: "declared-source://source-conformance/components/button.json#/",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/source-authority-conflict.source-conformance.json"
  }),
  diagnosticRow({
    code: "SOURCE_REVIEW_REQUIRED",
    canonicalMessage: "Declared source material requires human review before unattended promotion.",
    stage: "review",
    phase: "source-review-routing",
    artifactPath: "fixtures/source-conformance/review/brand-exception.source-conformance.json",
    jsonPointer: "/review",
    sourceRef: "declared-source://source-conformance/governance/review-policy.json#/",
    validationResult: "review_required",
    promotionStatus: "review_required",
    fixtureCoverage: "review/brand-exception.source-conformance.json",
    severity: "review"
  }),
  diagnosticRow({
    code: "SOURCE_REVIEW_OWNER_MISSING",
    canonicalMessage: "Review-required source output must include owner, rationale, and expiry metadata.",
    stage: "review",
    phase: "source-review-routing",
    artifactPath: "fixtures/source-conformance/invalid/review-owner-missing.source-conformance.json",
    jsonPointer: "/review",
    sourceRef: "declared-source://source-conformance/governance/review-policy.json#/",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/review-owner-missing.source-conformance.json"
  }),
  diagnosticRow({
    code: "SOURCE_PRODUCTION_CLAIM_FORBIDDEN",
    canonicalMessage: "Customer validation, production readiness, pilot readiness, self-serve, live integration, API, SDK, A2UI, native runtime, action execution, live SurfaceOps, or live JudgmentKit claims are forbidden in this proof.",
    stage: "conformance",
    phase: "source-claim-boundary",
    artifactPath: "fixtures/source-conformance/invalid/production-claim.source-conformance.json",
    jsonPointer: "/claims",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/production-claim.source-conformance.json"
  }),
  diagnosticRow({
    code: "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH",
    canonicalMessage: "Source conformance evidence hash does not match generated artifacts.",
    stage: "evidence",
    phase: "source-conformance-evidence",
    artifactPath: "fixtures/source-conformance/mutations/hash-mismatch.source-conformance-evidence.json",
    jsonPointer: "/artifacts/0/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hash-mismatch.source-conformance-evidence.json"
  })
];

export const SC_EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: "fixtures/source-conformance/valid/button-allowed.source-conformance.json",
    kind: "valid",
    stage: "conformance",
    phase: "source-fixture-validation",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/source-conformance/source-conformance-report.json",
    jsonPointer: "/"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/valid/in-line-alert-allowed.source-conformance.json",
    kind: "valid",
    stage: "conformance",
    phase: "source-fixture-validation",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: "artifacts/source-conformance/source-conformance-report.json",
    jsonPointer: "/"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/review/brand-exception.source-conformance.json",
    kind: "review",
    stage: "review",
    phase: "source-review-routing",
    expectedResult: "review_required",
    promotionStatus: "review_required",
    diagnosticCodes: ["SOURCE_REVIEW_REQUIRED"],
    artifactPath: "artifacts/source-conformance/source-review-queue.json",
    jsonPointer: "/review"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/missing-source-ref.source-conformance.json",
    kind: "invalid",
    stage: "conformance",
    phase: "source-fixture-validation",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["DECLARED_SOURCE_REF_INVALID"],
    artifactPath: "fixtures/source-conformance/invalid/missing-source-ref.source-conformance.json",
    jsonPointer: "/sourceRef"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/undeclared-source-ref.source-conformance.json",
    kind: "invalid",
    stage: "conformance",
    phase: "source-fixture-validation",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["DECLARED_SOURCE_REF_UNDECLARED"],
    artifactPath: "fixtures/source-conformance/invalid/undeclared-source-ref.source-conformance.json",
    jsonPointer: "/requiredSourceRefs/0"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/unknown-component.source-conformance.json",
    kind: "invalid",
    stage: "conformance",
    phase: "source-catalog-authority",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_CATALOG_COMPONENT_UNKNOWN"],
    artifactPath: "fixtures/source-conformance/invalid/unknown-component.source-conformance.json",
    jsonPointer: "/componentId"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/component-source-mismatch.source-conformance.json",
    kind: "invalid",
    stage: "conformance",
    phase: "source-component-authority",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_COMPONENT_SOURCE_MISMATCH"],
    artifactPath: "fixtures/source-conformance/invalid/component-source-mismatch.source-conformance.json",
    jsonPointer: "/sourceRef"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/source-authority-conflict.source-conformance.json",
    kind: "invalid",
    stage: "conformance",
    phase: "source-authority",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_AUTHORITY_CONFLICT"],
    artifactPath: "fixtures/source-conformance/invalid/source-authority-conflict.source-conformance.json",
    jsonPointer: "/authorityConflict"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/review-owner-missing.source-conformance.json",
    kind: "invalid",
    stage: "review",
    phase: "source-review-routing",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_REVIEW_OWNER_MISSING"],
    artifactPath: "fixtures/source-conformance/invalid/review-owner-missing.source-conformance.json",
    jsonPointer: "/review"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/invalid/production-claim.source-conformance.json",
    kind: "invalid",
    stage: "conformance",
    phase: "source-claim-boundary",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_PRODUCTION_CLAIM_FORBIDDEN"],
    artifactPath: "fixtures/source-conformance/invalid/production-claim.source-conformance.json",
    jsonPointer: "/claims"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/mutations/missing-upstream-evidence.source-conformance-preflight.json",
    kind: "mutation",
    stage: "preflight",
    phase: "source-conformance-preflight",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_UPSTREAM_EVIDENCE_MISSING"],
    artifactPath: "fixtures/source-conformance/mutations/missing-upstream-evidence.source-conformance-preflight.json",
    jsonPointer: "/upstreamRefs"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/mutations/source-path-undeclared.declared-source-manifest.json",
    kind: "mutation",
    stage: "source-inventory",
    phase: "declared-source-manifest",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["DECLARED_SOURCE_PATH_UNDECLARED"],
    artifactPath: "fixtures/source-conformance/mutations/source-path-undeclared.declared-source-manifest.json",
    jsonPointer: "/sourceFiles"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/mutations/source-hash-mismatch.declared-source-manifest.json",
    kind: "mutation",
    stage: "source-inventory",
    phase: "declared-source-manifest",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["DECLARED_SOURCE_HASH_MISMATCH"],
    artifactPath: "fixtures/source-conformance/mutations/source-hash-mismatch.declared-source-manifest.json",
    jsonPointer: "/sourceFiles/0/sha256"
  }),
  expectationRow({
    fixturePath: "fixtures/source-conformance/mutations/hash-mismatch.source-conformance-evidence.json",
    kind: "mutation",
    stage: "evidence",
    phase: "source-conformance-evidence",
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: ["SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH"],
    artifactPath: "fixtures/source-conformance/mutations/hash-mismatch.source-conformance-evidence.json",
    jsonPointer: "/artifacts/0/hash"
  })
];

export function scSchemaPaths() {
  return [...SC_SCHEMA_FILES, ...SC_CONSUMED_SCHEMA_FILES].map((file) => `${SC_SCHEMA_ROOT}/${file}`);
}

export function scSourcePaths() {
  return [
    `${SC_SOURCE_ROOT}/manifest.json`,
    ...Object.keys(SC_SOURCE_DOCUMENTS).map((file) => `${SC_SOURCE_ROOT}/${file}`)
  ];
}

export function scFixturePaths() {
  return [`${SC_FIXTURE_ROOT}/expectations.manifest.json`, ...SC_EXPECTATION_ROWS.map((row) => row.fixturePath)];
}

export function scArtifactOrder() {
  return [
    ...scSchemaPaths(),
    ...scSourcePaths(),
    ...scFixturePaths(),
    ...SC_ARTIFACT_PATHS
  ];
}

export function schemaIdForSourceConformancePath(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (SC_SCHEMA_FILES.includes(file) || SC_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath.endsWith("/manifest.json")) return "declared-source-manifest.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "source-conformance-expectations.v0";
  if (artifactPath.endsWith(".declared-source-manifest.json")) return "declared-source-manifest.v0";
  if (artifactPath.endsWith(".source-conformance.json")) return "source-conformance-fixture.v0";
  if (artifactPath.endsWith(".source-conformance-preflight.json")) return "source-conformance-preflight-mutation.v0";
  if (artifactPath.endsWith("source-inventory.json")) return "declared-source-inventory.v0";
  if (artifactPath.endsWith("source-authority-map.json")) return "source-authority-map.v0";
  if (artifactPath.endsWith("source-review-queue.json")) return "source-review-queue.v0";
  if (artifactPath.endsWith("source-conformance-report.json")) return "source-conformance-report.v0";
  if (artifactPath.endsWith("evidence.json")) return "source-conformance-evidence.v0";
  return "declared-source-document.v0";
}

export async function materializeSourceConformanceContract(cwd) {
  const schemas = buildSourceConformanceSchemas();
  for (const [file, schema] of Object.entries(schemas)) {
    await writeCanonicalJson(path.join(cwd, SC_SCHEMA_ROOT, file), schema);
  }
  for (const [file, data] of Object.entries(SC_SOURCE_DOCUMENTS)) {
    await writeCanonicalJson(path.join(cwd, SC_SOURCE_ROOT, file), data);
  }
  await writeCanonicalJson(path.join(cwd, SC_SOURCE_ROOT, "manifest.json"), sourceManifest());
  const fixtures = buildSourceConformanceFixtures();
  await writeCanonicalJson(path.join(cwd, SC_FIXTURE_ROOT, "expectations.manifest.json"), expectationsManifest());
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, SC_FIXTURE_ROOT, file), fixture);
  }
}

export function buildSourceConformanceSchemas() {
  return {
    "declared-source-manifest.v0.schema.json": declaredSourceManifestSchema(),
    "declared-source-document.v0.schema.json": declaredSourceDocumentSchema(),
    "declared-source-inventory.v0.schema.json": declaredSourceInventorySchema(),
    "source-authority-map.v0.schema.json": sourceAuthorityMapSchema(),
    "source-review-queue.v0.schema.json": sourceReviewQueueSchema(),
    "source-conformance-report.v0.schema.json": sourceConformanceReportSchema(),
    "source-conformance-evidence.v0.schema.json": sourceConformanceEvidenceSchema(),
    "source-conformance-expectations.v0.schema.json": sourceConformanceExpectationsSchema(),
    "source-conformance-diagnostics.v0.schema.json": sourceConformanceDiagnosticsSchema(),
    "source-conformance-fixture.v0.schema.json": sourceConformanceFixtureSchema(),
    "source-conformance-preflight-mutation.v0.schema.json": sourceConformancePreflightMutationSchema()
  };
}

export function buildSourceConformanceFixtures() {
  const button = sourceConformanceFixture({
    fixtureId: "button-allowed",
    componentId: "Button",
    sourceRef: "declared-source://source-conformance/components/button.json#/",
    requiredSourceRefs: [
      "declared-source://source-conformance/components/button.json#/",
      "declared-source://source-conformance/policies/accessibility.json#/"
    ]
  });
  const alert = sourceConformanceFixture({
    fixtureId: "in-line-alert-allowed",
    componentId: "InLineAlert",
    sourceRef: "declared-source://source-conformance/components/in-line-alert.json#/",
    requiredSourceRefs: [
      "declared-source://source-conformance/components/in-line-alert.json#/",
      "declared-source://source-conformance/policies/content.json#/"
    ]
  });
  const review = sourceConformanceFixture({
    fixtureId: "brand-exception",
    componentId: "Button",
    sourceRef: "declared-source://source-conformance/components/button.json#/",
    requiredSourceRefs: [
      "declared-source://source-conformance/components/button.json#/",
      "declared-source://source-conformance/governance/review-policy.json#/"
    ],
    review: {
      required: true,
      owner: "design-systems-governance",
      rationale: "Brand exception changes action emphasis and requires source-owner review.",
      expiresAt: "1970-01-31T00:00:00.000Z"
    }
  });
  return {
    "valid/button-allowed.source-conformance.json": button,
    "valid/in-line-alert-allowed.source-conformance.json": alert,
    "review/brand-exception.source-conformance.json": review,
    "invalid/missing-source-ref.source-conformance.json": {
      ...deepClone(button),
      fixtureId: "missing-source-ref",
      sourceRef: null
    },
    "invalid/undeclared-source-ref.source-conformance.json": {
      ...deepClone(button),
      fixtureId: "undeclared-source-ref",
      sourceRef: "declared-source://source-conformance/components/private-card.json#/",
      requiredSourceRefs: [
        "declared-source://source-conformance/components/private-card.json#/",
        "declared-source://source-conformance/policies/accessibility.json#/"
      ]
    },
    "invalid/unknown-component.source-conformance.json": {
      ...deepClone(button),
      fixtureId: "unknown-component",
      componentId: "UnknownCard"
    },
    "invalid/component-source-mismatch.source-conformance.json": {
      ...deepClone(button),
      fixtureId: "component-source-mismatch",
      sourceRef: "declared-source://source-conformance/components/in-line-alert.json#/",
      requiredSourceRefs: [
        "declared-source://source-conformance/components/in-line-alert.json#/",
        "declared-source://source-conformance/policies/accessibility.json#/"
      ]
    },
    "invalid/source-authority-conflict.source-conformance.json": {
      ...deepClone(button),
      fixtureId: "source-authority-conflict",
      authorityConflict: {
        conflictingRefs: [
          "declared-source://source-conformance/components/button.json#/",
          "declared-source://source-conformance/policies/content.json#/"
        ],
        resolutionRule: null
      }
    },
    "invalid/review-owner-missing.source-conformance.json": {
      ...deepClone(review),
      fixtureId: "review-owner-missing",
      review: {
        required: true,
        owner: null,
        rationale: null,
        expiresAt: null
      }
    },
    "invalid/production-claim.source-conformance.json": {
      ...deepClone(button),
      fixtureId: "production-claim",
      claims: Object.fromEntries(SC_FORBIDDEN_CLAIM_KEYS.map((key) => [key, true]))
    },
    "mutations/missing-upstream-evidence.source-conformance-preflight.json": {
      schemaId: "source-conformance-preflight-mutation.v0",
      version: SC_VERSION,
      command: SC_COMMAND,
      mutation: "missing-upstream-evidence",
      upstreamRefs: [],
      provenance: provenance("interfacectl-source-conformance-materialize", ["plans/source-conformance/README.md"])
    },
    "mutations/source-path-undeclared.declared-source-manifest.json": {
      ...sourceManifest(),
      sourceFiles: [
        ...sourceManifest().sourceFiles,
        {
          path: "components/private-card.json",
          sourceType: "component",
          sourceRefRoot: "declared-source://source-conformance/components/private-card.json#/",
          hashAlgorithm: "sha256",
          sha256: "0".repeat(64)
        }
      ]
    },
    "mutations/source-hash-mismatch.declared-source-manifest.json": {
      ...sourceManifest(),
      sourceFiles: sourceManifest().sourceFiles.map((entry, index) => index === 0 ? { ...entry, sha256: "0".repeat(64) } : entry)
    },
    "mutations/hash-mismatch.source-conformance-evidence.json": {
      contractId: SC_CONTRACT_ID,
      schemaId: "source-conformance-evidence.v0",
      version: SC_VERSION,
      runId: "source-conformance-mutation",
      checkedAt: SC_TIMESTAMP,
      command: SC_COMMAND,
      args: {
        source: SC_SOURCE_ROOT,
        catalog: SC_P2_CATALOG_PATH,
        ingestionEvidence: SC_P2_EVIDENCE_PATH,
        fixture: SC_FIXTURE_ROOT,
        out: SC_ARTIFACT_ROOT
      },
      environment: { ...SC_ENVIRONMENT },
      schemaClosure: [],
      sourceManifestRef: artifactRef(`${SC_SOURCE_ROOT}/manifest.json`, "declared-source-manifest.v0", "0".repeat(64)),
      sourceFileRefs: [],
      fixtureRefs: [],
      boundaryRefs: [],
      artifacts: [
        artifactRef(`${SC_ARTIFACT_ROOT}/source-conformance-report.json`, "source-conformance-report.v0", "0".repeat(64), {
          provenance: provenance("interfacectl-source-conformance-materialize", ["fixture://source-conformance/mutations/hash-mismatch"])
        })
      ],
      diagnostics: [],
      diagnosticsRegistry: diagnosticsRegistry(),
      validationResults: [],
      status: "pass",
      promotionStatus: "allowed",
      provenance: provenance("interfacectl-source-conformance-materialize", ["fixture://source-conformance/mutations/hash-mismatch"])
    }
  };
}

export function diagnosticsRegistry() {
  return SC_DIAGNOSTIC_ROWS.map((row) => ({ ...row }));
}

export function artifactRef(pathValue, schemaId, hash, extra = {}) {
  return {
    path: pathValue,
    schemaId,
    hashAlgorithm: "sha256",
    hash,
    sourceRef: null,
    ...extra
  };
}

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: SC_TIMESTAMP,
    generator,
    sourceRefs
  };
}

export function sourceManifest() {
  return {
    schemaId: "declared-source-manifest.v0",
    version: SC_VERSION,
    sourceBundleId: "source-conformance-demo",
    sourceFamily: "declared-local-source-bundle.v0",
    sourceRefGrammar: "declared-source://source-conformance/<posix-path>#<rfc6901-json-pointer>",
    generatedAt: SC_TIMESTAMP,
    environment: { ...SC_ENVIRONMENT },
    sourceFiles: Object.entries(SC_SOURCE_DOCUMENTS).map(([file, data]) => ({
      path: file,
      sourceType: data.sourceType,
      sourceRefRoot: `declared-source://source-conformance/${file}#/`,
      hashAlgorithm: "sha256",
      sha256: sha256Hex(canonicalJson(data))
    }))
  };
}

export async function sourceFileRefs(cwd, manifest) {
  const refs = [];
  for (const sourceFile of manifest.sourceFiles) {
    refs.push(artifactRef(`${SC_SOURCE_ROOT}/${sourceFile.path}`, "declared-source-document.v0", await rawFileHash(path.join(cwd, SC_SOURCE_ROOT, sourceFile.path)), {
      sourceRef: sourceFile.sourceRefRoot
    }));
  }
  return refs;
}

export async function sourceManifestRef(cwd) {
  return artifactRef(`${SC_SOURCE_ROOT}/manifest.json`, "declared-source-manifest.v0", await canonicalFileHash(path.join(cwd, SC_SOURCE_ROOT, "manifest.json")));
}

function expectationsManifest() {
  return {
    schemaId: "source-conformance-expectations.v0",
    version: SC_VERSION,
    sourceRoot: SC_SOURCE_ROOT,
    fixtureRoot: SC_FIXTURE_ROOT,
    artifactRoot: SC_ARTIFACT_ROOT,
    schemaRoot: SC_SCHEMA_ROOT,
    inputs: scFixturePaths(),
    artifactOrder: scArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: SC_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required"
    }
  };
}

function sourceConformanceFixture(overrides = {}) {
  return {
    schemaId: "source-conformance-fixture.v0",
    version: SC_VERSION,
    fixtureId: overrides.fixtureId,
    componentId: overrides.componentId,
    sourceRef: overrides.sourceRef,
    requiredSourceRefs: overrides.requiredSourceRefs || [],
    proposedUsage: {
      tokens: ["color.accent", "color.semantic.negative", "spacing.component.sm"],
      accessibility: ["accessible-name-required", "keyboard-activation-required", "focus-visible-required"],
      behavior: ["inert-action-descriptor-only"]
    },
    review: overrides.review || {
      required: false,
      owner: null,
      rationale: null,
      expiresAt: null
    },
    claims: overrides.claims || Object.fromEntries(SC_FORBIDDEN_CLAIM_KEYS.map((key) => [key, false])),
    authorityConflict: overrides.authorityConflict || null,
    provenance: provenance("interfacectl-source-conformance-materialize", [overrides.sourceRef].filter(Boolean))
  };
}

function diagnosticRow(row) {
  return {
    severity: row.severity ?? "error",
    diagnosticSource: diagnosticSourceForStage(row.stage),
    suggestedAction: suggestedActionForCode(row.code),
    ...row
  };
}

function expectationRow(row) {
  return deepClone(row);
}

function diagnosticSourceForStage(stage) {
  if (stage === "preflight") return "source-conformance-preflight-validator";
  if (stage === "source-inventory") return "declared-source-inventory-validator";
  if (stage === "review") return "source-review-router";
  if (stage === "evidence") return "source-conformance-evidence-validator";
  return "source-conformance-validator";
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM")) return "Restore accepted P2 catalog and evidence before source conformance proof continues.";
  if (code.includes("EVIDENCE")) return "Regenerate source conformance artifacts and evidence from checked-in schemas, source files, and fixtures.";
  if (code.includes("PATH") || code.includes("HASH")) return "Regenerate the declared source manifest from checked-in source files.";
  if (code.includes("CATALOG")) return "Use a component that exists in accepted P2 governed catalog evidence.";
  if (code.includes("REF")) return "Add a declared source ref under the manifest-declared source bundle.";
  if (code.includes("AUTHORITY")) return "Add an explicit authority rule or route the conflict to review.";
  if (code.includes("REVIEW")) return "Preserve review-required output with owner, rationale, and expiry metadata.";
  if (code.includes("PRODUCTION")) return "Keep this proof limited to inert conformance evidence; add a future target proof before claiming production behavior.";
  return "Correct the declared source fixture and rerun the proof.";
}

function objectSchema(schemaId, properties, required, options = {}) {
  const schema = {
    type: "object",
    additionalProperties: options.additionalProperties ?? false,
    properties,
    required
  };
  if (schemaId !== null) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/source-conformance/${schemaId}.schema.json`;
  }
  return schema;
}

function artifactRefSchema(withProvenance = false) {
  const properties = {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" },
    sourceRef: { type: ["string", "null"] },
    sourceEvidenceHash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  };
  const required = ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"];
  if (withProvenance) {
    properties.provenance = provenanceSchema();
    required.push("provenance");
  }
  return objectSchema(null, properties, required);
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: SC_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function diagnosticObjectSchema() {
  return { oneOf: diagnosticsRegistry().map((diagnostic) => ({ const: diagnostic })) };
}

function resultRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    kind: { type: "string" },
    stage: { type: "string" },
    phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    actualResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" },
    componentId: { type: ["string", "null"] },
    reviewQueueItemId: { type: ["string", "null"] },
    matched: { type: "boolean" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "componentId", "reviewQueueItemId", "matched"]);
}

function expectationRowSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string" },
    kind: { type: "string" },
    stage: { type: "string" },
    phase: { type: "string" },
    expectedResult: { enum: ["valid", "invalid", "review_required"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnosticCodes: { type: "array", items: { type: "string" } },
    artifactPath: { type: "string" },
    jsonPointer: { type: "string" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer"]);
}

function declaredSourceManifestSchema() {
  return objectSchema("declared-source-manifest.v0", {
    schemaId: { const: "declared-source-manifest.v0" },
    version: { type: "string" },
    sourceBundleId: { const: "source-conformance-demo" },
    sourceFamily: { const: "declared-local-source-bundle.v0" },
    sourceRefGrammar: { type: "string" },
    generatedAt: { const: SC_TIMESTAMP },
    environment: { type: "object", additionalProperties: true },
    sourceFiles: {
      type: "array",
      minItems: Object.keys(SC_SOURCE_DOCUMENTS).length,
      items: objectSchema(null, {
        path: { type: "string", pattern: "^(components|policies|governance)/[a-z0-9-]+\\.json$" },
        sourceType: { type: "string" },
        sourceRefRoot: { type: "string", pattern: "^declared-source://source-conformance/.+#/$" },
        hashAlgorithm: { const: "sha256" },
        sha256: { type: "string", pattern: "^[0-9a-f]{64}$" }
      }, ["path", "sourceType", "sourceRefRoot", "hashAlgorithm", "sha256"])
    }
  }, ["schemaId", "version", "sourceBundleId", "sourceFamily", "sourceRefGrammar", "generatedAt", "environment", "sourceFiles"]);
}

function declaredSourceDocumentSchema() {
  return objectSchema("declared-source-document.v0", {
    schemaId: { const: "declared-source-document.v0" },
    version: { type: "string" },
    documentId: { type: "string" },
    sourceType: { type: "string" },
    sourceRef: { type: "string", pattern: "^declared-source://source-conformance/.+#/$" },
    componentId: { type: "string" },
    authoritativeFields: { type: "array", items: { type: "string" } },
    policyRefs: { type: "array", items: { type: "string" } },
    requirements: { type: "array", items: { type: "string" } },
    reviewRequiredWhen: { type: "array", items: { type: "string" } },
    requiredReviewMetadata: { type: "array", items: { type: "string" } },
    notes: { type: "string" }
  }, ["schemaId", "version", "documentId", "sourceType", "sourceRef"]);
}

function declaredSourceInventorySchema() {
  return objectSchema("declared-source-inventory.v0", {
    schemaId: { const: "declared-source-inventory.v0" },
    version: { type: "string" },
    sourceRoot: { const: SC_SOURCE_ROOT },
    sourceManifestRef: artifactRefSchema(),
    sourceFileRefs: { type: "array", items: artifactRefSchema() },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "sourceRoot", "sourceManifestRef", "sourceFileRefs", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function sourceAuthorityMapSchema() {
  return objectSchema("source-authority-map.v0", {
    schemaId: { const: "source-authority-map.v0" },
    version: { type: "string" },
    catalogRef: artifactRefSchema(),
    ingestionEvidenceRef: artifactRefSchema(),
    componentAuthority: { type: "array", items: { type: "object", additionalProperties: true } },
    policyAuthority: { type: "array", items: { type: "object", additionalProperties: true } },
    nonAuthorityStatement: { type: "string" },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "catalogRef", "ingestionEvidenceRef", "componentAuthority", "policyAuthority", "nonAuthorityStatement", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function sourceReviewQueueSchema() {
  return objectSchema("source-review-queue.v0", {
    schemaId: { const: "source-review-queue.v0" },
    version: { type: "string" },
    queueItems: { type: "array", items: { type: "object", additionalProperties: true } },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "queueItems", "promotionStatus", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function sourceConformanceReportSchema() {
  return objectSchema("source-conformance-report.v0", {
    schemaId: { const: "source-conformance-report.v0" },
    version: { type: "string" },
    runId: { type: "string" },
    sourceRoot: { const: SC_SOURCE_ROOT },
    fixtureRoot: { const: SC_FIXTURE_ROOT },
    artifactRoot: { const: SC_ARTIFACT_ROOT },
    upstreamPreflight: { type: "object", additionalProperties: true },
    sourceInventoryRef: artifactRefSchema(),
    sourceAuthorityMapRef: artifactRefSchema(),
    sourceReviewQueueRef: artifactRefSchema(),
    results: { type: "array", items: resultRowSchema() },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "runId", "sourceRoot", "fixtureRoot", "artifactRoot", "upstreamPreflight", "sourceInventoryRef", "sourceAuthorityMapRef", "sourceReviewQueueRef", "results", "diagnostics", "diagnosticsRegistry", "status", "promotionStatus", "provenance"]);
}

function sourceConformanceEvidenceSchema() {
  return objectSchema("source-conformance-evidence.v0", {
    contractId: { const: SC_CONTRACT_ID },
    schemaId: { const: "source-conformance-evidence.v0" },
    version: { type: "string" },
    runId: { type: "string" },
    checkedAt: { const: SC_TIMESTAMP },
    command: { const: SC_COMMAND },
    args: { type: "object", additionalProperties: { type: "string" } },
    environment: { type: "object", additionalProperties: true },
    schemaClosure: { type: "array", items: artifactRefSchema() },
    sourceManifestRef: artifactRefSchema(),
    sourceFileRefs: { type: "array", items: artifactRefSchema() },
    fixtureRefs: { type: "array", items: artifactRefSchema() },
    boundaryRefs: { type: "array", items: artifactRefSchema(true) },
    artifacts: { type: "array", items: artifactRefSchema(true) },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    validationResults: { type: "array", items: resultRowSchema() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "sourceManifestRef", "sourceFileRefs", "fixtureRefs", "boundaryRefs", "artifacts", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"]);
}

function sourceConformanceExpectationsSchema() {
  return objectSchema("source-conformance-expectations.v0", {
    schemaId: { const: "source-conformance-expectations.v0" },
    version: { type: "string" },
    sourceRoot: { const: SC_SOURCE_ROOT },
    fixtureRoot: { const: SC_FIXTURE_ROOT },
    artifactRoot: { const: SC_ARTIFACT_ROOT },
    schemaRoot: { const: SC_SCHEMA_ROOT },
    inputs: { type: "array", items: { type: "string" } },
    artifactOrder: { type: "array", items: { type: "string" } },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    expectations: { type: "array", items: expectationRowSchema() },
    runExpectation: objectSchema(null, {
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
    }, ["status", "promotionStatus"])
  }, ["schemaId", "version", "sourceRoot", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"]);
}

function sourceConformanceDiagnosticsSchema() {
  return objectSchema("source-conformance-diagnostics.v0", {
    schemaId: { const: "source-conformance-diagnostics.v0" },
    version: { type: "string" },
    diagnosticsRegistry: { const: diagnosticsRegistry() }
  }, ["schemaId", "version", "diagnosticsRegistry"]);
}

function sourceConformanceFixtureSchema() {
  return objectSchema("source-conformance-fixture.v0", {
    schemaId: { const: "source-conformance-fixture.v0" },
    version: { type: "string" },
    fixtureId: { type: "string" },
    componentId: { type: "string" },
    sourceRef: sourceRefSchema(true),
    requiredSourceRefs: { type: "array", items: sourceRefSchema(false) },
    proposedUsage: { type: "object", additionalProperties: true },
    review: { type: "object", additionalProperties: true },
    claims: claimsSchema(),
    authorityConflict: { type: ["object", "null"], additionalProperties: true },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "fixtureId", "componentId", "sourceRef", "requiredSourceRefs", "proposedUsage", "review", "claims", "authorityConflict", "provenance"]);
}

function sourceRefSchema(nullable) {
  const sourceRef = {
    type: "string",
    pattern: "^declared-source://source-conformance/(components|policies|governance)/[a-z0-9-]+\\.json#/(?:[A-Za-z0-9._~-]+(?:/[A-Za-z0-9._~-]+)*)?$"
  };
  return nullable ? { oneOf: [sourceRef, { type: "null" }] } : sourceRef;
}

function claimsSchema() {
  return objectSchema(null, Object.fromEntries(SC_FORBIDDEN_CLAIM_KEYS.map((key) => [key, { type: "boolean" }])), []);
}

function sourceConformancePreflightMutationSchema() {
  return objectSchema("source-conformance-preflight-mutation.v0", {
    schemaId: { const: "source-conformance-preflight-mutation.v0" },
    version: { type: "string" },
    command: { const: SC_COMMAND },
    mutation: { type: "string" },
    upstreamRefs: { type: "array", items: artifactRefSchema() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "command", "mutation", "upstreamRefs", "provenance"]);
}
