import path from "node:path";
import { canonicalJson } from "./p0.js";
import {
  deepClone,
  sha256Hex,
  writeCanonicalJson
} from "./p2-contract.js";

export const P5_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const P5_VERSION = "0.0.0";
export const P5_SCHEMA_ROOT = "schemas";
export const P5_FIXTURE_ROOT = "fixtures/p5/protocol";
export const P5_ARTIFACT_ROOT = "artifacts/p5/protocol";
export const P5_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const P5_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const P5_P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
export const P5_P4_DECISION_LEDGER_PATH = "artifacts/p4/surfaceops-decision-ledger.json";
export const P5_P4_REVIEW_REPORT_PATH = "artifacts/p4/review-judgment-report.json";
export const P5_TARGET_ID = "surfaces-protocol-static";

export const P5_ACCEPTED_P2_EVIDENCE_HASH = "d469eb7027a724c87e237b6b0e92d7526bb9a9dfee58dd47e4830bf64352a0f4";
export const P5_ACCEPTED_P2_CATALOG_HASH = "2ba1d418bc51051bb642a0c675efbc7e16f4f315dae62674a6b6e363461c9d29";
export const P5_ACCEPTED_P4_EVIDENCE_HASH = "a9de1573bc5c4dcd9e0d509d8b60885470a4d6cb2bfcbc0eff5ed451997d71f3";
export const P5_ACCEPTED_P4_DECISION_LEDGER_HASH = "91dd2b08dc7c99f2ff28c6dca2862379269f0f89c7feb63a073bd51fc5f1ebb8";
export const P5_ACCEPTED_P4_REVIEW_REPORT_HASH = "ca31dcd66c7037e0b8eff4e24ad5a41ae99497d7a44bc7a558f85bd981f32add";

export const P5_ENVIRONMENT = Object.freeze({
  generatedAt: P5_TIMESTAMP,
  host: null
});

export const P5_CONSUMED_SCHEMA_FILES = [
  "design-system-ingestion-evidence.v0.schema.json",
  "design-system-ingestion-diagnostics.v0.schema.json",
  "runtime-catalog.v0.schema.json",
  "diagnostics.v0.schema.json",
  "surface-ir.v0.schema.json",
  "review-judgment-evidence.v0.schema.json",
  "surfaceops-decision-ledger.v0.schema.json",
  "review-judgment-report.v0.schema.json"
];

export const P5_SCHEMA_FILES = [
  "protocol-target-selection.v0.schema.json",
  "protocol-projection.v0.schema.json",
  "protocol-envelope.v0.schema.json",
  "protocol-adapter-report.v0.schema.json",
  "protocol-adapter-evidence.v0.schema.json",
  "protocol-adapter-expectations.v0.schema.json",
  "protocol-adapter-diagnostics.v0.schema.json",
  "protocol-preflight-mutation.v0.schema.json"
];

export const P5_FIXTURE_FILES = [
  "adapter-target-selection.fixture.json",
  "valid/button-protocol-envelope.surface-ir.json",
  "valid/in-line-alert-protocol-envelope.surface-ir.json",
  "review/review-required-protocol-action.surface-ir.json",
  "invalid/unknown-component.surface-ir.json",
  "invalid/unknown-prop.surface-ir.json",
  "invalid/protocol-authority-escalation.protocol-projection.json",
  "invalid/live-action-callback.surface-ir.json",
  "invalid/production-api-claim.protocol-projection.json",
  "invalid/a2ui-claim-without-conformance.protocol-projection.json",
  "invalid/target-undeclared.protocol-target-selection.json",
  "invalid/target-out-of-scope.protocol-target-selection.json",
  "invalid/target-selection-a2ui-claim.protocol-target-selection.json",
  "invalid/target-selection-live-api-claim.protocol-target-selection.json",
  "mutations/missing-upstream-evidence.protocol-preflight.json",
  "mutations/missing-decision-ledger.protocol-preflight.json",
  "mutations/missing-review-report.protocol-preflight.json",
  "mutations/failing-upstream-evidence.protocol-preflight.json",
  "mutations/upstream-evidence-hash-mismatch.protocol-preflight.json",
  "mutations/decision-ledger-hash-mismatch.protocol-preflight.json",
  "mutations/review-report-hash-mismatch.protocol-preflight.json",
  "mutations/stale-upstream-evidence.protocol-preflight.json",
  "mutations/target-selection-hash-mismatch.protocol-target-selection.json",
  "mutations/missing-projection-ref.protocol-projection.json",
  "mutations/projection-hash-mismatch.protocol-projection.json",
  "mutations/projection-target-selection-hash-mismatch.protocol-projection.json",
  "mutations/projection-token-extra-property.protocol-projection.json",
  "mutations/projection-token-missing-source-ref.protocol-projection.json",
  "mutations/envelope-token-extra-property.protocol-envelope.json",
  "mutations/report-projection-hash-mismatch.protocol-adapter-report.json",
  "mutations/hash-mismatch.protocol-adapter-evidence.json"
].map((file) => `${P5_FIXTURE_ROOT}/${file}`);

export const P5_GENERATED_ARTIFACTS = [
  "adapter-target-selection.json",
  "protocol-projection.json",
  "protocol-envelope.button.json",
  "protocol-envelope.in-line-alert.json",
  "protocol-adapter-report.json",
  "evidence.json"
];

export const P5_ARTIFACT_PATHS = P5_GENERATED_ARTIFACTS.map((file) => `${P5_ARTIFACT_ROOT}/${file}`);

export const P5_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "PROTOCOL_UPSTREAM_EVIDENCE_MISSING",
    trigger: "Protocol upstream P2 or P4 evidence input is missing",
    canonicalMessage: "Protocol upstream evidence is missing.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/missing-upstream-evidence.protocol-preflight.json",
    jsonPointer: "/",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-upstream-evidence.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_DECISION_LEDGER_MISSING",
    trigger: "Protocol decision ledger input is missing",
    canonicalMessage: "Protocol decision ledger input is missing.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/missing-decision-ledger.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-decision-ledger.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_REVIEW_REPORT_MISSING",
    trigger: "Protocol review report input is missing",
    canonicalMessage: "Protocol review report input is missing.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/missing-review-report.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-review-report.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_UPSTREAM_EVIDENCE_FAILED",
    trigger: "Protocol upstream evidence is not passing",
    canonicalMessage: "Protocol upstream evidence is not passing.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/failing-upstream-evidence.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/failing-upstream-evidence.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH",
    trigger: "Protocol upstream evidence or catalog hash does not match the accepted boundary",
    canonicalMessage: "Protocol upstream evidence or catalog hash does not match the accepted boundary.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/upstream-evidence-hash-mismatch.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/upstream-evidence-hash-mismatch.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_DECISION_LEDGER_HASH_MISMATCH",
    trigger: "Protocol decision ledger hash does not match accepted P4 evidence",
    canonicalMessage: "Protocol decision ledger hash does not match accepted P4 evidence.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/decision-ledger-hash-mismatch.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/decision-ledger-hash-mismatch.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_REVIEW_REPORT_HASH_MISMATCH",
    trigger: "Protocol review report hash does not match accepted P4 evidence",
    canonicalMessage: "Protocol review report hash does not match accepted P4 evidence.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/review-report-hash-mismatch.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/review-report-hash-mismatch.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_UPSTREAM_EVIDENCE_STALE",
    trigger: "Protocol upstream evidence or catalog ref is stale or not the exact declared input",
    canonicalMessage: "Protocol upstream evidence or catalog ref is stale or not the exact declared input.",
    stage: "preflight",
    phase: "protocol-upstream-preflight",
    artifactPath: "fixtures/p5/protocol/mutations/stale-upstream-evidence.protocol-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/stale-upstream-evidence.protocol-preflight.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_TARGET_UNDECLARED",
    trigger: "Target selection fixture omits the target id or target kind",
    canonicalMessage: "Protocol adapter target is not declared.",
    stage: "target-selection",
    phase: "protocol-target-selection",
    artifactPath: "fixtures/p5/protocol/invalid/target-undeclared.protocol-target-selection.json",
    jsonPointer: "/targetId",
    sourceRef: "fixture://p5/protocol/invalid/target-undeclared#/targetId",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-undeclared.protocol-target-selection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_TARGET_OUT_OF_SCOPE",
    trigger: "Target selection names unsupported catalog, component, capability, transport, or API scope",
    canonicalMessage: "Protocol adapter target exceeds accepted upstream scope.",
    stage: "target-selection",
    phase: "protocol-target-selection",
    artifactPath: "fixtures/p5/protocol/invalid/target-out-of-scope.protocol-target-selection.json",
    jsonPointer: "/componentScope",
    sourceRef: "fixture://p5/protocol/invalid/target-out-of-scope#/componentScope",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-out-of-scope.protocol-target-selection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_A2UI_CLAIM_FORBIDDEN",
    trigger: "Target selection claims A2UI support without a separate A2UI proof contract",
    canonicalMessage: "A2UI support requires a separate P5 conformance proof.",
    stage: "target-selection",
    phase: "protocol-target-selection",
    artifactPath: "fixtures/p5/protocol/invalid/target-selection-a2ui-claim.protocol-target-selection.json",
    jsonPointer: "/excludedClaims",
    sourceRef: "fixture://p5/protocol/invalid/target-selection-a2ui-claim#/excludedClaims",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-selection-a2ui-claim.protocol-target-selection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_LIVE_API_FORBIDDEN",
    trigger: "Target selection claims live production API, transport, SDK, callback, or network behavior",
    canonicalMessage: "Live protocol API behavior is forbidden in this proof.",
    stage: "target-selection",
    phase: "protocol-target-selection",
    artifactPath: "fixtures/p5/protocol/invalid/target-selection-live-api-claim.protocol-target-selection.json",
    jsonPointer: "/capabilityScope",
    sourceRef: "fixture://p5/protocol/invalid/target-selection-live-api-claim#/capabilityScope",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-selection-live-api-claim.protocol-target-selection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_TARGET_SELECTION_HASH_MISMATCH",
    trigger: "Target selection artifact hash differs from accepted evidence or report refs",
    canonicalMessage: "Protocol target selection hash does not match generated artifacts.",
    stage: "target-selection",
    phase: "protocol-target-selection",
    artifactPath: "fixtures/p5/protocol/mutations/target-selection-hash-mismatch.protocol-target-selection.json",
    jsonPointer: "/targetSelectionRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/target-selection-hash-mismatch.protocol-target-selection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_PROJECTION_REF_MISSING",
    trigger: "Projection omits target, catalog, P2 evidence, or P4 evidence refs",
    canonicalMessage: "Protocol projection required boundary reference is missing.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/mutations/missing-projection-ref.protocol-projection.json",
    jsonPointer: "/targetSelectionRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-projection-ref.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_SOURCE_HASH_MISMATCH",
    trigger: "Projection upstream hash differs from accepted evidence",
    canonicalMessage: "Protocol projection source hash does not match generated target selection or accepted evidence.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/mutations/projection-hash-mismatch.protocol-projection.json",
    jsonPointer: "/catalogRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/projection-hash-mismatch.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_SOURCE_HASH_MISMATCH",
    trigger: "Projection target selection hash differs from generated target selection",
    canonicalMessage: "Protocol projection source hash does not match generated target selection or accepted evidence.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/mutations/projection-target-selection-hash-mismatch.protocol-projection.json",
    jsonPointer: "/targetSelectionRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/projection-target-selection-hash-mismatch.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_TOKEN_RECORD_INVALID",
    trigger: "Protocol projection token record is missing source refs or contains implementation metadata",
    canonicalMessage: "Protocol token records must stay closed over type, value, and sourceRef.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/mutations/projection-token-extra-property.protocol-projection.json",
    jsonPointer: "/tokens/component-height-75/cssVariable",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/projection-token-extra-property.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_TOKEN_RECORD_INVALID",
    trigger: "Protocol projection token record is missing source refs or contains implementation metadata",
    canonicalMessage: "Protocol token records must stay closed over type, value, and sourceRef.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/mutations/projection-token-missing-source-ref.protocol-projection.json",
    jsonPointer: "/tokens/component-height-75/sourceRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/projection-token-missing-source-ref.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_TOKEN_RECORD_INVALID",
    trigger: "Protocol envelope token record contains implementation metadata",
    canonicalMessage: "Protocol token records must stay closed over type, value, and sourceRef.",
    stage: "protocol-boundary",
    phase: "protocol-invalid",
    artifactPath: "fixtures/p5/protocol/mutations/envelope-token-extra-property.protocol-envelope.json",
    jsonPointer: "/tokens/height/cssProperty",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/envelope-token-extra-property.protocol-envelope.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_AUTHORITY_ESCALATION",
    trigger: "Projection grants authority absent from governed catalog or target selection",
    canonicalMessage: "Protocol projection grants authority absent from the governed catalog.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/invalid/protocol-authority-escalation.protocol-projection.json",
    jsonPointer: "/components",
    sourceRef: "fixture://p5/protocol/invalid/protocol-authority-escalation#/components",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/protocol-authority-escalation.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_PRODUCTION_API_FORBIDDEN",
    trigger: "Projection claims live API, SDK, transport, callback, webhook, queue, or network behavior",
    canonicalMessage: "Production API, SDK, transport, callback, or network behavior is forbidden in this proof.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/invalid/production-api-claim.protocol-projection.json",
    jsonPointer: "/protocolEnvelope",
    sourceRef: "fixture://p5/protocol/invalid/production-api-claim#/protocolEnvelope",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/production-api-claim.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_A2UI_CLAIM_FORBIDDEN",
    trigger: "Projection claims A2UI support without separate A2UI conformance proof",
    canonicalMessage: "A2UI support requires a separate P5 conformance proof.",
    stage: "projection",
    phase: "protocol-projection",
    artifactPath: "fixtures/p5/protocol/invalid/a2ui-claim-without-conformance.protocol-projection.json",
    jsonPointer: "/protocolEnvelope",
    sourceRef: "fixture://p5/protocol/invalid/a2ui-claim-without-conformance#/protocolEnvelope",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/a2ui-claim-without-conformance.protocol-projection.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_MEMBER_UNKNOWN",
    trigger: "Protocol fixture references authority absent from the protocol projection",
    canonicalMessage: "Protocol fixture references authority absent from the protocol projection.",
    stage: "protocol-boundary",
    phase: "protocol-invalid",
    artifactPath: "fixtures/p5/protocol/invalid/unknown-component.surface-ir.json",
    jsonPointer: "/root/component",
    sourceRef: "fixture://p5/protocol/invalid/unknown-component#/root",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unknown-component.surface-ir.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_MEMBER_UNKNOWN",
    trigger: "Protocol fixture references authority absent from the protocol projection",
    canonicalMessage: "Protocol fixture references authority absent from the protocol projection.",
    stage: "protocol-boundary",
    phase: "protocol-invalid",
    artifactPath: "fixtures/p5/protocol/invalid/unknown-prop.surface-ir.json",
    jsonPointer: "/root/props",
    sourceRef: "fixture://p5/protocol/invalid/unknown-prop#/root/props",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unknown-prop.surface-ir.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_ACTION_EXECUTION_FORBIDDEN",
    trigger: "Protocol fixture attempts action execution, callback, or transport behavior",
    canonicalMessage: "Protocol action execution is forbidden.",
    stage: "protocol-boundary",
    phase: "protocol-invalid",
    artifactPath: "fixtures/p5/protocol/invalid/live-action-callback.surface-ir.json",
    jsonPointer: "/root/actions",
    sourceRef: "fixture://p5/protocol/invalid/live-action-callback#/root/actions",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/live-action-callback.surface-ir.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_REVIEW_REQUIRED",
    trigger: "Structurally valid protocol usage requires review",
    canonicalMessage: "Protocol usage requires review before unattended promotion.",
    severity: "review",
    stage: "protocol-boundary",
    phase: "protocol-review",
    artifactPath: "fixtures/p5/protocol/review/review-required-protocol-action.surface-ir.json",
    jsonPointer: "/root/actions",
    sourceRef: "fixture://p5/protocol/review/review-required-protocol-action#/root/actions",
    validationResult: "review_required",
    promotionStatus: "review_required",
    fixtureCoverage: "review/review-required-protocol-action.surface-ir.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_REPORT_HASH_MISMATCH",
    trigger: "Protocol adapter report hash does not match generated artifacts",
    canonicalMessage: "Protocol adapter report hash does not match generated artifacts.",
    stage: "report",
    phase: "protocol-adapter-report",
    artifactPath: "fixtures/p5/protocol/mutations/report-projection-hash-mismatch.protocol-adapter-report.json",
    jsonPointer: "/projectionRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/report-projection-hash-mismatch.protocol-adapter-report.json"
  }),
  diagnosticRow({
    code: "PROTOCOL_EVIDENCE_HASH_MISMATCH",
    trigger: "Protocol adapter evidence hash differs from manifest or self-hash rule",
    canonicalMessage: "Protocol adapter evidence hash does not match the manifest or self-hash rule.",
    stage: "evidence",
    phase: "protocol-adapter-evidence",
    artifactPath: "fixtures/p5/protocol/mutations/hash-mismatch.protocol-adapter-evidence.json",
    jsonPointer: "/artifacts",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hash-mismatch.protocol-adapter-evidence.json"
  })
];

export const P5_EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/valid/button-protocol-envelope.surface-ir.json`,
    kind: "valid",
    stage: "protocol-boundary",
    phase: "protocol-valid",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: `${P5_ARTIFACT_ROOT}/protocol-envelope.button.json`,
    jsonPointer: "/root/component",
    requiredSourceRef: "fixture://p5/protocol/valid/button-protocol-envelope#/root/component",
    envelopePath: `${P5_ARTIFACT_ROOT}/protocol-envelope.button.json`,
    component: "Button"
  }),
  expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/valid/in-line-alert-protocol-envelope.surface-ir.json`,
    kind: "valid",
    stage: "protocol-boundary",
    phase: "protocol-valid",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: `${P5_ARTIFACT_ROOT}/protocol-envelope.in-line-alert.json`,
    jsonPointer: "/root/component",
    requiredSourceRef: "fixture://p5/protocol/valid/in-line-alert-protocol-envelope#/root/component",
    envelopePath: `${P5_ARTIFACT_ROOT}/protocol-envelope.in-line-alert.json`,
    component: "InLineAlert"
  }),
  expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/review/review-required-protocol-action.surface-ir.json`,
    kind: "review",
    stage: "protocol-boundary",
    phase: "protocol-review",
    expectedResult: "review_required",
    promotionStatus: "review_required",
    diagnosticCodes: ["PROTOCOL_REVIEW_REQUIRED"],
    artifactPath: `${P5_ARTIFACT_ROOT}/protocol-adapter-report.json`,
    jsonPointer: "/root/actions",
    requiredSourceRef: "fixture://p5/protocol/review/review-required-protocol-action#/root/actions",
    envelopePath: null,
    component: "Button"
  }),
  ...[
    ["invalid/unknown-component.surface-ir.json", "protocol-boundary", "protocol-invalid", "PROTOCOL_MEMBER_UNKNOWN", "/root/component"],
    ["invalid/unknown-prop.surface-ir.json", "protocol-boundary", "protocol-invalid", "PROTOCOL_MEMBER_UNKNOWN", "/root/props"],
    ["invalid/protocol-authority-escalation.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_AUTHORITY_ESCALATION", "/components"],
    ["invalid/live-action-callback.surface-ir.json", "protocol-boundary", "protocol-invalid", "PROTOCOL_ACTION_EXECUTION_FORBIDDEN", "/root/actions"],
    ["invalid/production-api-claim.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_PRODUCTION_API_FORBIDDEN", "/protocolEnvelope"],
    ["invalid/a2ui-claim-without-conformance.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_A2UI_CLAIM_FORBIDDEN", "/protocolEnvelope"],
    ["invalid/target-undeclared.protocol-target-selection.json", "target-selection", "protocol-target-selection", "PROTOCOL_TARGET_UNDECLARED", "/targetId"],
    ["invalid/target-out-of-scope.protocol-target-selection.json", "target-selection", "protocol-target-selection", "PROTOCOL_TARGET_OUT_OF_SCOPE", "/componentScope"],
    ["invalid/target-selection-a2ui-claim.protocol-target-selection.json", "target-selection", "protocol-target-selection", "PROTOCOL_A2UI_CLAIM_FORBIDDEN", "/excludedClaims"],
    ["invalid/target-selection-live-api-claim.protocol-target-selection.json", "target-selection", "protocol-target-selection", "PROTOCOL_LIVE_API_FORBIDDEN", "/capabilityScope"],
    ["mutations/missing-upstream-evidence.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_UPSTREAM_EVIDENCE_MISSING", "/"],
    ["mutations/missing-decision-ledger.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_DECISION_LEDGER_MISSING", "/upstreamRefs"],
    ["mutations/missing-review-report.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_REVIEW_REPORT_MISSING", "/upstreamRefs"],
    ["mutations/failing-upstream-evidence.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_UPSTREAM_EVIDENCE_FAILED", "/upstreamRefs"],
    ["mutations/upstream-evidence-hash-mismatch.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_UPSTREAM_EVIDENCE_HASH_MISMATCH", "/upstreamRefs"],
    ["mutations/decision-ledger-hash-mismatch.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_DECISION_LEDGER_HASH_MISMATCH", "/upstreamRefs"],
    ["mutations/review-report-hash-mismatch.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_REVIEW_REPORT_HASH_MISMATCH", "/upstreamRefs"],
    ["mutations/stale-upstream-evidence.protocol-preflight.json", "preflight", "protocol-upstream-preflight", "PROTOCOL_UPSTREAM_EVIDENCE_STALE", "/upstreamRefs"],
    ["mutations/target-selection-hash-mismatch.protocol-target-selection.json", "target-selection", "protocol-target-selection", "PROTOCOL_TARGET_SELECTION_HASH_MISMATCH", "/targetSelectionRef/hash"],
    ["mutations/missing-projection-ref.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_PROJECTION_REF_MISSING", "/targetSelectionRef"],
    ["mutations/projection-hash-mismatch.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_SOURCE_HASH_MISMATCH", "/catalogRef/hash"],
    ["mutations/projection-target-selection-hash-mismatch.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_SOURCE_HASH_MISMATCH", "/targetSelectionRef/hash"],
    ["mutations/projection-token-extra-property.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_TOKEN_RECORD_INVALID", "/tokens/component-height-75/cssVariable"],
    ["mutations/projection-token-missing-source-ref.protocol-projection.json", "projection", "protocol-projection", "PROTOCOL_TOKEN_RECORD_INVALID", "/tokens/component-height-75/sourceRef"],
    ["mutations/envelope-token-extra-property.protocol-envelope.json", "protocol-boundary", "protocol-invalid", "PROTOCOL_TOKEN_RECORD_INVALID", "/tokens/height/cssProperty"],
    ["mutations/report-projection-hash-mismatch.protocol-adapter-report.json", "report", "protocol-adapter-report", "PROTOCOL_REPORT_HASH_MISMATCH", "/projectionRef/hash"],
    ["mutations/hash-mismatch.protocol-adapter-evidence.json", "evidence", "protocol-adapter-evidence", "PROTOCOL_EVIDENCE_HASH_MISMATCH", "/artifacts"]
  ].map(([file, stage, phase, code, jsonPointer]) => expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/${file}`,
    kind: path.posix.dirname(file) === "mutations" ? "mutation" : path.posix.dirname(file),
    stage,
    phase,
    expectedResult: "invalid",
    promotionStatus: "blocked",
    diagnosticCodes: [code],
    artifactPath: `${P5_FIXTURE_ROOT}/${file}`,
    jsonPointer,
    requiredSourceRef: sourceRefForFixture(file, jsonPointer),
    envelopePath: null,
    component: null
  }))
];

export function p5SchemaPaths() {
  return P5_SCHEMA_FILES.map((file) => `${P5_SCHEMA_ROOT}/${file}`);
}

export function p5ConsumedSchemaPaths() {
  return P5_CONSUMED_SCHEMA_FILES.map((file) => `${P5_SCHEMA_ROOT}/${file}`);
}

export function p5FixturePaths() {
  return [
    `${P5_FIXTURE_ROOT}/expectations.manifest.json`,
    ...P5_FIXTURE_FILES
  ];
}

export function p5ArtifactOrder() {
  return [
    ...p5SchemaPaths(),
    ...p5ConsumedSchemaPaths(),
    P5_P2_EVIDENCE_PATH,
    P5_P2_CATALOG_PATH,
    P5_P4_EVIDENCE_PATH,
    P5_P4_DECISION_LEDGER_PATH,
    P5_P4_REVIEW_REPORT_PATH,
    ...p5FixturePaths(),
    ...P5_ARTIFACT_PATHS
  ];
}

export function schemaIdForP5Path(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (P5_SCHEMA_FILES.includes(file) || P5_CONSUMED_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (artifactPath === P5_P2_EVIDENCE_PATH) return "design-system-ingestion-evidence.v0";
  if (artifactPath === P5_P2_CATALOG_PATH) return "runtime-catalog.v0";
  if (artifactPath === P5_P4_EVIDENCE_PATH) return "review-judgment-evidence.v0";
  if (artifactPath === P5_P4_DECISION_LEDGER_PATH) return "surfaceops-decision-ledger.v0";
  if (artifactPath === P5_P4_REVIEW_REPORT_PATH) return "review-judgment-report.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "protocol-adapter-expectations.v0";
  if (artifactPath.endsWith(".protocol-target-selection.json") || artifactPath.endsWith("adapter-target-selection.fixture.json") || artifactPath.endsWith("adapter-target-selection.json")) return "protocol-target-selection.v0";
  if (artifactPath.endsWith(".protocol-projection.json") || artifactPath.endsWith("protocol-projection.json")) return "protocol-projection.v0";
  if (artifactPath.endsWith(".surface-ir.json")) return "surface-ir.v0";
  if (artifactPath.endsWith(".protocol-preflight.json")) return "protocol-preflight-mutation.v0";
  if (artifactPath.endsWith(".protocol-adapter-report.json") || artifactPath.endsWith("protocol-adapter-report.json")) return "protocol-adapter-report.v0";
  if (artifactPath.endsWith(".protocol-adapter-evidence.json") || artifactPath.endsWith("evidence.json")) return "protocol-adapter-evidence.v0";
  if (artifactPath.includes("protocol-envelope.")) return "protocol-envelope.v0";
  return null;
}

export async function materializeP5ProtocolContract(cwd) {
  const schemas = buildP5ProtocolSchemas();
  for (const file of P5_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, P5_SCHEMA_ROOT, file), schemas[file]);
  }

  const fixtures = buildP5ProtocolFixtures();
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, P5_FIXTURE_ROOT, file), fixture);
  }
  console.log("P5 protocol materialize: pass");
}

export function buildP5ProtocolSchemas() {
  return {
    "protocol-target-selection.v0.schema.json": protocolTargetSelectionSchema(),
    "protocol-projection.v0.schema.json": protocolProjectionSchema(),
    "protocol-envelope.v0.schema.json": protocolEnvelopeSchema(),
    "protocol-adapter-report.v0.schema.json": protocolAdapterReportSchema(),
    "protocol-adapter-evidence.v0.schema.json": protocolAdapterEvidenceSchema(),
    "protocol-adapter-expectations.v0.schema.json": protocolAdapterExpectationsSchema(),
    "protocol-adapter-diagnostics.v0.schema.json": protocolAdapterDiagnosticsSchema(),
    "protocol-preflight-mutation.v0.schema.json": protocolPreflightMutationSchema()
  };
}

export function buildP5ProtocolFixtures() {
  return {
    "expectations.manifest.json": expectationsManifest(),
    "adapter-target-selection.fixture.json": targetSelectionFixture(),
    "valid/button-protocol-envelope.surface-ir.json": surfaceFixture({
      fixtureId: "button-protocol-envelope",
      folder: "valid",
      component: "Button",
      props: { size: "m", style: "fill", variant: "accent" },
      accessibility: { role: "button", nameFrom: "content", focusable: true, activationKeys: ["Enter", "Space"] },
      tokenRefs: { height: "component-height-75", widthMultiplier: "button-minimum-width-multiplier" }
    }),
    "valid/in-line-alert-protocol-envelope.surface-ir.json": surfaceFixture({
      fixtureId: "in-line-alert-protocol-envelope",
      folder: "valid",
      component: "InLineAlert",
      props: { heading: "Static protocol boundary", style: "outline", variant: "neutral" },
      accessibility: { role: "status", nameFrom: "content", focusable: false, liveRegion: "polite" },
      tokenRefs: { border: "border-width-200" }
    }),
    "review/review-required-protocol-action.surface-ir.json": surfaceFixture({
      fixtureId: "review-required-protocol-action",
      folder: "review",
      component: "Button",
      props: { size: "m", style: "fill", variant: "negative" },
      actions: {
        reviewIntent: {
          execute: false,
          payload: { intent: "sensitive-action" },
          sourceRef: "fixture://p5/protocol/review/review-required-protocol-action#/root/actions/reviewIntent"
        }
      },
      accessibility: { role: "button", nameFrom: "content", focusable: true, activationKeys: ["Enter", "Space"] },
      tokenRefs: { height: "component-height-75" }
    }),
    "invalid/unknown-component.surface-ir.json": surfaceFixture({
      fixtureId: "unknown-component",
      folder: "invalid",
      component: "UnsupportedCard",
      props: { tone: "info" }
    }),
    "invalid/unknown-prop.surface-ir.json": surfaceFixture({
      fixtureId: "unknown-prop",
      folder: "invalid",
      component: "Button",
      props: { size: "m", tone: "loud" }
    }),
    "invalid/live-action-callback.surface-ir.json": surfaceFixture({
      fixtureId: "live-action-callback",
      folder: "invalid",
      component: "Button",
      props: { size: "m", style: "fill", variant: "accent" },
      actions: {
        submit: {
          execute: true,
          payload: {},
          sourceRef: "fixture://p5/protocol/invalid/live-action-callback#/root/actions/submit"
        }
      }
    }),
    "invalid/protocol-authority-escalation.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/invalid/protocol-authority-escalation#/components",
      components: { UnsupportedCard: { props: {}, sourceRef: "fixture://p5/protocol/invalid/protocol-authority-escalation#/components/UnsupportedCard" } }
    }),
    "invalid/production-api-claim.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/invalid/production-api-claim#/protocolEnvelope",
      protocolEnvelope: {
        transport: "http",
        sideEffectsAllowed: true,
        liveOperations: ["POST /surfaces/protocol"],
        productionApi: true,
        sdk: true,
        callbacks: ["https://example.invalid/protocol-callback"]
      }
    }),
    "invalid/a2ui-claim-without-conformance.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/invalid/a2ui-claim-without-conformance#/protocolEnvelope",
      protocolEnvelope: { a2uiConformance: true }
    }),
    "invalid/target-undeclared.protocol-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/protocol/invalid/target-undeclared#/targetId",
      targetId: null,
      targetKind: null
    }),
    "invalid/target-out-of-scope.protocol-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/protocol/invalid/target-out-of-scope#/componentScope",
      componentScope: ["Button", "InLineAlert", "UnsupportedCard"]
    }),
    "invalid/target-selection-a2ui-claim.protocol-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/protocol/invalid/target-selection-a2ui-claim#/excludedClaims",
      capabilityScope: { ...defaultCapabilityScope(), a2uiConformance: true },
      excludedClaims: defaultExcludedClaims().filter((claim) => claim !== "a2ui")
    }),
    "invalid/target-selection-live-api-claim.protocol-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/protocol/invalid/target-selection-live-api-claim#/capabilityScope",
      capabilityScope: { ...defaultCapabilityScope(), transport: "http", liveProtocolApi: true }
    }),
    "mutations/missing-upstream-evidence.protocol-preflight.json": preflightMutation({ mutation: "missing-upstream-evidence", upstreamRefs: [] }),
    "mutations/missing-decision-ledger.protocol-preflight.json": preflightMutation({ mutation: "missing-decision-ledger", upstreamRefs: defaultUpstreamRefs().filter((ref) => ref.path !== P5_P4_DECISION_LEDGER_PATH) }),
    "mutations/missing-review-report.protocol-preflight.json": preflightMutation({ mutation: "missing-review-report", upstreamRefs: defaultUpstreamRefs().filter((ref) => ref.path !== P5_P4_REVIEW_REPORT_PATH) }),
    "mutations/failing-upstream-evidence.protocol-preflight.json": preflightMutation({ mutation: "failing-upstream-evidence", status: "fail", upstreamRefs: defaultUpstreamRefs() }),
    "mutations/upstream-evidence-hash-mismatch.protocol-preflight.json": preflightMutation({ mutation: "upstream-evidence-hash-mismatch", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P2_CATALOG_PATH ? { ...ref, hash: "0".repeat(64) } : ref) }),
    "mutations/decision-ledger-hash-mismatch.protocol-preflight.json": preflightMutation({ mutation: "decision-ledger-hash-mismatch", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P4_DECISION_LEDGER_PATH ? { ...ref, hash: "0".repeat(64) } : ref) }),
    "mutations/review-report-hash-mismatch.protocol-preflight.json": preflightMutation({ mutation: "review-report-hash-mismatch", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P4_REVIEW_REPORT_PATH ? { ...ref, hash: "0".repeat(64) } : ref) }),
    "mutations/stale-upstream-evidence.protocol-preflight.json": preflightMutation({ mutation: "stale-upstream-evidence", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P2_CATALOG_PATH ? { ...ref, path: "artifacts/p2/stale-governed-catalog.json" } : ref) }),
    "mutations/target-selection-hash-mismatch.protocol-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/protocol/mutations/target-selection-hash-mismatch#/targetSelectionRef/hash",
      targetSelectionRef: artifactRef(`${P5_ARTIFACT_ROOT}/adapter-target-selection.json`, "protocol-target-selection.v0", "0".repeat(64))
    }),
    "mutations/missing-projection-ref.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/mutations/missing-projection-ref#/targetSelectionRef",
      targetSelectionRef: null
    }),
    "mutations/projection-hash-mismatch.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/mutations/projection-hash-mismatch#/catalogRef/hash",
      catalogRef: artifactRef(P5_P2_CATALOG_PATH, "runtime-catalog.v0", "0".repeat(64))
    }),
    "mutations/projection-target-selection-hash-mismatch.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/mutations/projection-target-selection-hash-mismatch#/targetSelectionRef/hash",
      targetSelectionRef: targetSelectionArtifactRef("0".repeat(64))
    }),
    "mutations/projection-token-extra-property.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/mutations/projection-token-extra-property#/tokens/component-height-75/cssVariable",
      tokens: {
        "component-height-75": {
          type: "dimension",
          value: "32px",
          sourceRef: "fixture://p2/spectrum/button#/tokens/component-height-75",
          cssVariable: "--spectrum-component-height-75"
        }
      }
    }),
    "mutations/projection-token-missing-source-ref.protocol-projection.json": projectionMutation({
      sourceRef: "fixture://p5/protocol/mutations/projection-token-missing-source-ref#/tokens/component-height-75/sourceRef",
      tokens: {
        "component-height-75": {
          type: "dimension",
          value: "32px"
        }
      }
    }),
    "mutations/envelope-token-extra-property.protocol-envelope.json": protocolEnvelopeMutation({
      sourceRef: "fixture://p5/protocol/mutations/envelope-token-extra-property#/tokens/height/cssProperty",
      tokens: {
        height: {
          type: "dimension",
          value: "32px",
          sourceRef: "fixture://p2/spectrum/button#/tokens/component-height-75",
          cssProperty: "height"
        }
      }
    }),
    "mutations/report-projection-hash-mismatch.protocol-adapter-report.json": reportMutation(),
    "mutations/hash-mismatch.protocol-adapter-evidence.json": evidenceMutation()
  };
}

function protocolTargetSelectionSchema() {
  return objectSchema("protocol-target-selection.v0", {
    schemaId: { const: "protocol-target-selection.v0" },
    version: { type: "string" },
    targetId: { type: ["string", "null"] },
    targetKind: { type: ["string", "null"] },
    claimStatus: { enum: ["proof_only"] },
    upstreamRefs: { type: "array", items: artifactRefSchema(), minItems: 0 },
    componentScope: { type: "array", items: { type: "string" } },
    capabilityScope: { type: "object", additionalProperties: true },
    excludedClaims: { type: "array", items: { type: "string" } },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    targetSelectionRef: { anyOf: [artifactRefSchema(), { type: "null" }] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "targetKind", "claimStatus", "upstreamRefs", "componentScope", "capabilityScope", "excludedClaims", "diagnostics", "diagnosticsRegistry", "targetSelectionRef", "provenance"]);
}

function protocolProjectionSchema() {
  return objectSchema("protocol-projection.v0", {
    schemaId: { const: "protocol-projection.v0" },
    version: { type: "string" },
    adapter: { const: P5_TARGET_ID },
    targetSelectionRef: { anyOf: [artifactRefSchema(), { type: "null" }] },
    catalogRef: artifactRefSchema(),
    p2EvidenceRef: artifactRefSchema(),
    p4EvidenceRef: artifactRefSchema(),
    p4DecisionLedgerRef: artifactRefSchema(),
    p4ReviewReportRef: artifactRefSchema(),
    components: { type: "object", additionalProperties: true },
    tokens: tokenRecordMapSchema(),
    actions: { type: "object", additionalProperties: true },
    events: { type: "object", additionalProperties: true },
    dataBindings: { type: "object", additionalProperties: true },
    governance: { type: "object", additionalProperties: true },
    accessibility: { type: "object", additionalProperties: true },
    protocolEnvelope: { type: "object", additionalProperties: true },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "adapter", "targetSelectionRef", "catalogRef", "p2EvidenceRef", "p4EvidenceRef", "p4DecisionLedgerRef", "p4ReviewReportRef", "components", "tokens", "actions", "events", "dataBindings", "governance", "accessibility", "protocolEnvelope", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function protocolEnvelopeSchema() {
  return objectSchema("protocol-envelope.v0", {
    schemaId: { const: "protocol-envelope.v0" },
    version: { type: "string" },
    adapter: { const: P5_TARGET_ID },
    surfaceRef: artifactRefSchema(false, { allowNullHash: false }),
    projectionRef: artifactRefSchema(),
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    message: { type: "object", additionalProperties: true },
    actions: {
      type: "array",
      items: objectSchema(null, {
        actionId: { type: "string" },
        executed: { const: false },
        payload: { type: "object", additionalProperties: true },
        sourceRef: { type: ["string", "null"] }
      }, ["actionId", "executed", "payload", "sourceRef"])
    },
    sideEffects: { type: "array", maxItems: 0 },
    transport: { const: "none" },
    accessibility: { type: "object", additionalProperties: true },
    tokens: tokenRecordMapSchema(),
    provenance: provenanceSchema(),
    diagnostics: { type: "array", items: diagnosticObjectSchema() }
  }, ["schemaId", "version", "adapter", "surfaceRef", "projectionRef", "promotionStatus", "message", "actions", "sideEffects", "transport", "accessibility", "tokens", "provenance", "diagnostics"]);
}

function protocolAdapterReportSchema() {
  return objectSchema("protocol-adapter-report.v0", {
    schemaId: { const: "protocol-adapter-report.v0" },
    version: { type: "string" },
    adapter: { const: P5_TARGET_ID },
    runId: { type: "string" },
    upstreamPreflight: { type: "object", additionalProperties: true },
    targetSelectionRef: artifactRefSchema(),
    projectionRef: artifactRefSchema(),
    fixtureRoot: { const: P5_FIXTURE_ROOT },
    artifactRoot: { const: P5_ARTIFACT_ROOT },
    results: { type: "array", items: resultRowSchema() },
    protocolEnvelopeRefs: { type: "array", items: artifactRefSchema() },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    generatedArtifactRefs: { type: "array", items: artifactRefSchema() },
    environment: { type: "object", additionalProperties: true },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "adapter", "runId", "upstreamPreflight", "targetSelectionRef", "projectionRef", "fixtureRoot", "artifactRoot", "results", "protocolEnvelopeRefs", "diagnostics", "diagnosticsRegistry", "generatedArtifactRefs", "environment", "status", "promotionStatus", "provenance"]);
}

function protocolAdapterEvidenceSchema() {
  return objectSchema("protocol-adapter-evidence.v0", {
    contractId: { const: "surfaces-p5-protocol-adapter-proof" },
    schemaId: { const: "protocol-adapter-evidence.v0" },
    version: { type: "string" },
    runId: { type: "string" },
    checkedAt: { const: P5_TIMESTAMP },
    command: { const: "interfacectl surfaces protocol proof" },
    args: { type: "object", additionalProperties: { type: "string" } },
    environment: { type: "object", additionalProperties: true },
    schemaClosure: { type: "array", items: artifactRefSchema() },
    fixtureRefs: { type: "array", items: artifactRefSchema() },
    boundaryRefs: { type: "array", items: artifactRefSchema(true) },
    artifacts: { type: "array", items: artifactRefSchema(true) },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    validationResults: { type: "array", items: resultRowSchema() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "artifacts", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"]);
}

function protocolAdapterExpectationsSchema() {
  return objectSchema("protocol-adapter-expectations.v0", {
    schemaId: { const: "protocol-adapter-expectations.v0" },
    version: { type: "string" },
    fixtureRoot: { const: P5_FIXTURE_ROOT },
    artifactRoot: { const: P5_ARTIFACT_ROOT },
    schemaRoot: { const: P5_SCHEMA_ROOT },
    inputs: { type: "array", items: { type: "string" } },
    artifactOrder: { type: "array", items: { type: "string" } },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    expectations: { type: "array", items: expectationRowSchema() },
    runExpectation: objectSchema(null, {
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
    }, ["status", "promotionStatus"])
  }, ["schemaId", "version", "fixtureRoot", "artifactRoot", "schemaRoot", "inputs", "artifactOrder", "diagnosticsRegistry", "expectations", "runExpectation"]);
}

function protocolAdapterDiagnosticsSchema() {
  return objectSchema("protocol-adapter-diagnostics.v0", {
    schemaId: { const: "protocol-adapter-diagnostics.v0" },
    version: { type: "string" },
    diagnosticsRegistry: { const: diagnosticsRegistry() }
  }, ["schemaId", "version", "diagnosticsRegistry"]);
}

function protocolPreflightMutationSchema() {
  return objectSchema("protocol-preflight-mutation.v0", {
    schemaId: { const: "protocol-preflight-mutation.v0" },
    version: { type: "string" },
    command: { const: "interfacectl surfaces protocol proof" },
    mutation: { type: "string" },
    status: { enum: ["pass", "fail", null] },
    upstreamRefs: { type: "array", items: artifactRefSchema() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "command", "mutation", "status", "upstreamRefs", "provenance"]);
}

function expectationsManifest() {
  return {
    schemaId: "protocol-adapter-expectations.v0",
    version: P5_VERSION,
    fixtureRoot: P5_FIXTURE_ROOT,
    artifactRoot: P5_ARTIFACT_ROOT,
    schemaRoot: P5_SCHEMA_ROOT,
    inputs: p5FixturePaths(),
    artifactOrder: p5ArtifactOrder(),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: P5_EXPECTATION_ROWS,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required"
    }
  };
}

export function diagnosticsRegistry() {
  return P5_DIAGNOSTIC_ROWS.map((row) => ({ ...row }));
}

export function defaultUpstreamRefs() {
  return [
    artifactRef(P5_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", P5_ACCEPTED_P2_EVIDENCE_HASH),
    artifactRef(P5_P2_CATALOG_PATH, "runtime-catalog.v0", P5_ACCEPTED_P2_CATALOG_HASH, { sourceEvidenceHash: P5_ACCEPTED_P2_EVIDENCE_HASH }),
    artifactRef(P5_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", P5_ACCEPTED_P4_EVIDENCE_HASH),
    artifactRef(P5_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", P5_ACCEPTED_P4_DECISION_LEDGER_HASH, { sourceEvidenceHash: P5_ACCEPTED_P4_EVIDENCE_HASH }),
    artifactRef(P5_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", P5_ACCEPTED_P4_REVIEW_REPORT_HASH, { sourceEvidenceHash: P5_ACCEPTED_P4_EVIDENCE_HASH })
  ];
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

export function targetSelectionArtifactHash() {
  return sha256Hex(canonicalJson(targetSelectionArtifact()));
}

export function targetSelectionArtifactRef(hash = targetSelectionArtifactHash()) {
  return artifactRef(`${P5_ARTIFACT_ROOT}/adapter-target-selection.json`, "protocol-target-selection.v0", hash);
}

export function targetSelectionArtifact() {
  const fixture = targetSelectionFixture();
  return {
    ...deepClone(fixture),
    targetSelectionRef: null,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-p5-protocol-target-selection", [fixture.provenance.sourceRefs[0]])
  };
}

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: P5_TIMESTAMP,
    generator,
    sourceRefs
  };
}

function targetSelectionFixture(overrides = {}) {
  const { sourceRef: overrideSourceRef, ...rest } = overrides;
  const sourceRef = overrideSourceRef ?? "fixture://p5/protocol/adapter-target-selection#/targetId";
  return {
    schemaId: "protocol-target-selection.v0",
    version: P5_VERSION,
    targetId: P5_TARGET_ID,
    targetKind: "protocol-envelope-proof",
    claimStatus: "proof_only",
    upstreamRefs: defaultUpstreamRefs(),
    componentScope: ["Button", "InLineAlert"],
    capabilityScope: defaultCapabilityScope(),
    excludedClaims: defaultExcludedClaims(),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    targetSelectionRef: null,
    provenance: provenance("interfacectl-p5-protocol-materialize", [sourceRef]),
    ...rest
  };
}

function defaultCapabilityScope() {
  return {
    protocolEnvelopeGeneration: "static-inert-only",
    actionExecution: false,
    callbacks: false,
    connectorCalls: false,
    networkCalls: false,
    liveProtocolApi: false,
    productionApi: false,
    sdk: false,
    renderer: false,
    transport: "none",
    sideEffects: false,
    a2uiConformance: false,
    liveSurfaceOps: false,
    liveJudgmentKit: false
  };
}

function defaultExcludedClaims() {
  return [
    "production-api",
    "live-transport",
    "sdk",
    "a2ui",
    "renderer",
    "live-actions",
    "live-surfaceops",
    "live-judgmentkit"
  ];
}

function surfaceFixture({ fixtureId, folder, component, props, actions = {}, accessibility = {}, tokenRefs = {} }) {
  const fixtureRoot = `fixture://p5/protocol/${folder}/${fixtureId}`;
  return {
    schemaId: "surface-ir.v0",
    version: P5_VERSION,
    root: {
      id: fixtureId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
      component,
      variant: props.variant ?? "default",
      state: "default",
      props,
      slots: {},
      actions,
      events: {},
      dataBindings: {},
      tokenRefs,
      accessibility,
      sourceRef: `${fixtureRoot}#/root`
    },
    instances: {},
    bindings: {},
    provenance: {
      generatedAt: P5_TIMESTAMP,
      sourceHash: "sha256:protocol-fixture",
      sourceRef: `${fixtureRoot}#/provenance`,
      sourceUri: fixtureRoot
    }
  };
}

function projectionMutation(overrides = {}) {
  const { sourceRef: overrideSourceRef, ...rest } = overrides;
  const sourceRef = overrideSourceRef ?? "fixture://p5/protocol/mutations/projection#/targetSelectionRef";
  const base = {
    schemaId: "protocol-projection.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    targetSelectionRef: targetSelectionArtifactRef(),
    catalogRef: artifactRef(P5_P2_CATALOG_PATH, "runtime-catalog.v0", P5_ACCEPTED_P2_CATALOG_HASH, { sourceEvidenceHash: P5_ACCEPTED_P2_EVIDENCE_HASH }),
    p2EvidenceRef: artifactRef(P5_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", P5_ACCEPTED_P2_EVIDENCE_HASH),
    p4EvidenceRef: artifactRef(P5_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", P5_ACCEPTED_P4_EVIDENCE_HASH),
    p4DecisionLedgerRef: artifactRef(P5_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", P5_ACCEPTED_P4_DECISION_LEDGER_HASH, { sourceEvidenceHash: P5_ACCEPTED_P4_EVIDENCE_HASH }),
    p4ReviewReportRef: artifactRef(P5_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", P5_ACCEPTED_P4_REVIEW_REPORT_HASH, { sourceEvidenceHash: P5_ACCEPTED_P4_EVIDENCE_HASH }),
    components: {},
    tokens: {},
    actions: {},
    events: {},
    dataBindings: {},
    governance: {},
    accessibility: {},
    protocolEnvelope: { transport: "none", sideEffectsAllowed: false, liveOperations: [], productionApi: false, sdk: false, callbacks: [], a2uiConformance: false },
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-p5-protocol-materialize", [sourceRef])
  };
  return {
    ...base,
    ...rest,
    protocolEnvelope: {
      ...base.protocolEnvelope,
      ...(rest.protocolEnvelope || {})
    }
  };
}

function protocolEnvelopeMutation(overrides = {}) {
  const { sourceRef: overrideSourceRef, ...rest } = overrides;
  const sourceRef = overrideSourceRef ?? "fixture://p5/protocol/mutations/envelope#/tokens";
  return {
    schemaId: "protocol-envelope.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    surfaceRef: artifactRef("fixtures/p5/protocol/valid/button-protocol-envelope.surface-ir.json", "surface-ir.v0", "0".repeat(64), {
      sourceRef: "fixture://p5/protocol/valid/button-protocol-envelope#/root"
    }),
    projectionRef: artifactRef(`${P5_ARTIFACT_ROOT}/protocol-projection.json`, "protocol-projection.v0", "0".repeat(64)),
    promotionStatus: "allowed",
    message: {
      kind: "static-component-envelope",
      surfaceId: "buttonProtocolEnvelope",
      component: "Button",
      variant: "accent",
      state: "default",
      props: { size: "m", style: "fill", variant: "accent" },
      sourceRef: "fixture://p5/protocol/valid/button-protocol-envelope#/root"
    },
    actions: [],
    sideEffects: [],
    transport: "none",
    accessibility: { role: "button", nameFrom: "content", focusable: true, activationKeys: ["Enter", "Space"] },
    tokens: {},
    provenance: provenance("interfacectl-p5-protocol-materialize", [sourceRef]),
    diagnostics: [],
    ...rest
  };
}

function preflightMutation(overrides) {
  return {
    schemaId: "protocol-preflight-mutation.v0",
    version: P5_VERSION,
    command: "interfacectl surfaces protocol proof",
    mutation: "unknown",
    status: null,
    upstreamRefs: defaultUpstreamRefs(),
    ...overrides,
    provenance: provenance("interfacectl-p5-protocol-materialize", ["plans/p5/validation-evidence.md#planned-upstream-preflight"])
  };
}

function reportMutation() {
  return {
    schemaId: "protocol-adapter-report.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    runId: "p5-protocol-mutation",
    upstreamPreflight: { status: "pass", refs: defaultUpstreamRefs() },
    targetSelectionRef: targetSelectionArtifactRef(),
    projectionRef: artifactRef(`${P5_ARTIFACT_ROOT}/protocol-projection.json`, "protocol-projection.v0", "0".repeat(64)),
    fixtureRoot: P5_FIXTURE_ROOT,
    artifactRoot: P5_ARTIFACT_ROOT,
    results: [],
    protocolEnvelopeRefs: [],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    generatedArtifactRefs: [],
    environment: { ...P5_ENVIRONMENT },
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p5-protocol-materialize", ["fixture://p5/protocol/mutations/report-projection-hash-mismatch#/projectionRef/hash"])
  };
}

function evidenceMutation() {
  return {
    contractId: "surfaces-p5-protocol-adapter-proof",
    schemaId: "protocol-adapter-evidence.v0",
    version: P5_VERSION,
    runId: "p5-protocol-mutation",
    checkedAt: P5_TIMESTAMP,
    command: "interfacectl surfaces protocol proof",
    args: {
      ingestionEvidence: P5_P2_EVIDENCE_PATH,
      reviewEvidence: P5_P4_EVIDENCE_PATH,
      decisionLedger: P5_P4_DECISION_LEDGER_PATH,
      reviewReport: P5_P4_REVIEW_REPORT_PATH,
      catalog: P5_P2_CATALOG_PATH,
      fixture: P5_FIXTURE_ROOT,
      out: P5_ARTIFACT_ROOT
    },
    environment: { ...P5_ENVIRONMENT },
    schemaClosure: [],
    fixtureRefs: [],
    boundaryRefs: [],
    artifacts: [{
      path: `${P5_ARTIFACT_ROOT}/adapter-target-selection.json`,
      schemaId: "protocol-target-selection.v0",
      hashAlgorithm: "sha256",
      hash: "0".repeat(64),
      sourceRef: null,
      provenance: provenance("interfacectl-p5-protocol-materialize", ["fixture://p5/protocol/mutations/hash-mismatch#/artifacts"])
    }],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: [],
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p5-protocol-materialize", ["fixture://p5/protocol/mutations/hash-mismatch#/artifacts"])
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

function sourceRefForFixture(file, jsonPointer) {
  if (file.startsWith("mutations/")) return null;
  const withoutSuffix = file
    .replace(/\.surface-ir\.json$/, "")
    .replace(/\.protocol-target-selection\.json$/, "")
    .replace(/\.protocol-projection\.json$/, "");
  return `fixture://p5/protocol/${withoutSuffix}#${jsonPointer}`;
}

function diagnosticSourceForStage(stage) {
  if (stage === "preflight") return "protocol-preflight-validator";
  if (stage === "target-selection") return "protocol-target-selection-validator";
  if (stage === "projection") return "protocol-projection-validator";
  if (stage === "protocol-boundary") return "protocol-boundary-validator";
  if (stage === "report") return "protocol-report-validator";
  return "protocol-evidence-validator";
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM") || code.includes("LEDGER") || code.includes("REVIEW_REPORT")) return "Restore accepted P2 and P4 evidence boundaries before P5 protocol proof continues.";
  if (code.includes("TARGET")) return "Keep P5 protocol target selection explicit and within accepted upstream scope.";
  if (code.includes("A2UI")) return "Add a separate P5 A2UI conformance proof before making A2UI claims.";
  if (code.includes("LIVE") || code.includes("PRODUCTION") || code.includes("ACTION")) return "Keep protocol envelopes inert with no live API, transport, callbacks, network calls, or action execution.";
  if (code.includes("HASH") || code.includes("EVIDENCE") || code.includes("REPORT")) return "Regenerate P5 protocol proof artifacts from current accepted inputs.";
  return "Correct the P5 protocol fixture or generated artifact and rerun the proof.";
}

function objectSchema(schemaId, properties, required) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
  if (schemaId !== null) {
    schema.$schema = "https://json-schema.org/draft/2020-12/schema";
    schema.$id = `https://surfaces.dev/schemas/p5/${schemaId}.schema.json`;
  }
  return schema;
}

function tokenRecordMapSchema() {
  return {
    type: "object",
    propertyNames: { type: "string", pattern: "^[A-Za-z0-9._-]+$" },
    additionalProperties: tokenRecordSchema()
  };
}

function tokenRecordSchema() {
  return objectSchema(null, {
    type: { type: "string", minLength: 1 },
    value: true,
    sourceRef: { type: "string" }
  }, ["type", "value", "sourceRef"]);
}

function artifactRefSchema(withProvenance = false, options = {}) {
  const hashSchema = options.allowNullHash === false
    ? { type: "string", pattern: "^[0-9a-f]{64}$" }
    : { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" };
  const properties = {
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: hashSchema,
    sourceRef: { type: ["string", "null"] },
    sourceEvidenceHash: { type: "string", pattern: "^[0-9a-f]{64}$" }
  };
  const required = ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"];
  if (withProvenance) {
    properties.provenance = provenanceSchema();
    required.push("provenance");
  }
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

function provenanceSchema() {
  return objectSchema(null, {
    generatedAt: { const: P5_TIMESTAMP },
    generator: { type: "string" },
    sourceRefs: { type: "array", items: { type: "string" } }
  }, ["generatedAt", "generator", "sourceRefs"]);
}

function diagnosticObjectSchema() {
  const allowedDiagnostics = P5_DIAGNOSTIC_ROWS.map((row) => ({
    code: row.code,
    message: row.canonicalMessage,
    severity: row.severity,
    diagnosticSource: row.diagnosticSource,
    stage: row.stage,
    phase: row.phase,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef: row.sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction
  }));
  return { oneOf: allowedDiagnostics.map((diagnostic) => ({ const: diagnostic })) };
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
    requiredSourceRef: { type: ["string", "null"] },
    envelopePath: { type: ["string", "null"] },
    component: { type: ["string", "null"] },
    matched: { type: "boolean" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "requiredSourceRef", "envelopePath", "component", "matched"]);
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
    jsonPointer: { type: "string" },
    requiredSourceRef: { type: ["string", "null"] },
    envelopePath: { type: ["string", "null"] },
    component: { type: ["string", "null"] }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "requiredSourceRef", "envelopePath", "component"]);
}
