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
export const P5_FIXTURE_ROOT = "fixtures/p5/native";
export const P5_ARTIFACT_ROOT = "artifacts/p5/native";
export const P5_P2_EVIDENCE_PATH = "artifacts/p2/evidence.json";
export const P5_P2_CATALOG_PATH = "artifacts/p2/governed-catalog.json";
export const P5_P4_EVIDENCE_PATH = "artifacts/p4/evidence.json";
export const P5_P4_DECISION_LEDGER_PATH = "artifacts/p4/surfaceops-decision-ledger.json";
export const P5_P4_REVIEW_REPORT_PATH = "artifacts/p4/review-judgment-report.json";
export const P5_PROTOCOL_EVIDENCE_PATH = "artifacts/p5/protocol/evidence.json";
export const P5_TARGET_ID = "surfaces-native-static";

export const P5_ACCEPTED_P2_EVIDENCE_HASH = "e9f1e26db4cc05efe3f8cb3807c2cacc72930b66ce10afba779d68788a412bf8";
export const P5_ACCEPTED_P2_CATALOG_HASH = "2ba1d418bc51051bb642a0c675efbc7e16f4f315dae62674a6b6e363461c9d29";
export const P5_ACCEPTED_P4_EVIDENCE_HASH = "bbc6b4538438896eb68add346308b3edde3831d32e675a7a35d96a9869937e69";
export const P5_ACCEPTED_P4_DECISION_LEDGER_HASH = "5cad7aca09a0d21cf3b18bbdba8c8e22c0ca23eb6d83a56e51d3b7c31b2c9631";
export const P5_ACCEPTED_P4_REVIEW_REPORT_HASH = "814650d1903905fef73ecb131280fa88211ac2c7477d76692b13ccae803c98fa";
export const P5_ACCEPTED_PROTOCOL_EVIDENCE_HASH = "a4e1f335cc8c9697fcd77114fa2217535db20c089d4a1009344c856a50ee79bb";

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
  "review-judgment-report.v0.schema.json",
  "protocol-adapter-evidence.v0.schema.json"
];

export const P5_SCHEMA_FILES = [
  "surfaces-native-target-selection.v0.schema.json",
  "surfaces-native-projection.v0.schema.json",
  "surfaces-native-packet.v0.schema.json",
  "surfaces-native-report.v0.schema.json",
  "surfaces-native-evidence.v0.schema.json",
  "surfaces-native-expectations.v0.schema.json",
  "surfaces-native-diagnostics.v0.schema.json",
  "surfaces-native-preflight-mutation.v0.schema.json"
];

export const P5_FIXTURE_FILES = [
  "adapter-target-selection.fixture.json",
  "valid/button-surfaces-native-packet.surface-ir.json",
  "valid/in-line-alert-surfaces-native-packet.surface-ir.json",
  "review/review-required-native-action.surface-ir.json",
  "invalid/unknown-component.surface-ir.json",
  "invalid/unknown-prop.surface-ir.json",
  "invalid/native-authority-escalation.surfaces-native-projection.json",
  "invalid/live-action-callback.surface-ir.json",
  "invalid/production-api-claim.surfaces-native-projection.json",
  "invalid/a2ui-claim-without-conformance.surfaces-native-projection.json",
  "invalid/target-undeclared.surfaces-native-target-selection.json",
  "invalid/target-out-of-scope.surfaces-native-target-selection.json",
  "invalid/target-selection-a2ui-claim.surfaces-native-target-selection.json",
  "invalid/target-selection-live-api-claim.surfaces-native-target-selection.json",
  "mutations/missing-upstream-evidence.native-preflight.json",
  "mutations/missing-decision-ledger.native-preflight.json",
  "mutations/missing-review-report.native-preflight.json",
  "mutations/missing-protocol-evidence.native-preflight.json",
  "mutations/failing-upstream-evidence.native-preflight.json",
  "mutations/failing-protocol-evidence.native-preflight.json",
  "mutations/upstream-evidence-hash-mismatch.native-preflight.json",
  "mutations/decision-ledger-hash-mismatch.native-preflight.json",
  "mutations/review-report-hash-mismatch.native-preflight.json",
  "mutations/protocol-evidence-hash-mismatch.native-preflight.json",
  "mutations/stale-upstream-evidence.native-preflight.json",
  "mutations/stale-protocol-evidence.native-preflight.json",
  "mutations/target-selection-hash-mismatch.surfaces-native-target-selection.json",
  "mutations/missing-projection-ref.surfaces-native-projection.json",
  "mutations/projection-hash-mismatch.surfaces-native-projection.json",
  "mutations/report-projection-hash-mismatch.surfaces-native-report.json",
  "mutations/hash-mismatch.surfaces-native-evidence.json"
].map((file) => `${P5_FIXTURE_ROOT}/${file}`);

export const P5_GENERATED_ARTIFACTS = [
  "adapter-target-selection.json",
  "surfaces-native-projection.json",
  "surfaces-native-packet.button.json",
  "surfaces-native-packet.in-line-alert.json",
  "surfaces-native-report.json",
  "evidence.json"
];

export const P5_ARTIFACT_PATHS = P5_GENERATED_ARTIFACTS.map((file) => `${P5_ARTIFACT_ROOT}/${file}`);

export const P5_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "NATIVE_UPSTREAM_EVIDENCE_MISSING",
    trigger: "Native upstream P2 or P4 evidence input is missing",
    canonicalMessage: "Native upstream evidence is missing.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/missing-upstream-evidence.native-preflight.json",
    jsonPointer: "/",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-upstream-evidence.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_DECISION_LEDGER_MISSING",
    trigger: "Native decision ledger input is missing",
    canonicalMessage: "Native decision ledger input is missing.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/missing-decision-ledger.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-decision-ledger.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_REVIEW_REPORT_MISSING",
    trigger: "Native review report input is missing",
    canonicalMessage: "Native review report input is missing.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/missing-review-report.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-review-report.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_PROTOCOL_EVIDENCE_MISSING",
    trigger: "Native protocol compatibility evidence input is missing",
    canonicalMessage: "Native protocol compatibility evidence is missing.",
    stage: "preflight",
    phase: "native-protocol-compatibility-preflight",
    artifactPath: "fixtures/p5/native/mutations/missing-protocol-evidence.native-preflight.json",
    jsonPointer: "/compatibilityPreflightRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-protocol-evidence.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_UPSTREAM_EVIDENCE_FAILED",
    trigger: "Native upstream evidence is not passing",
    canonicalMessage: "Native upstream evidence is not passing.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/failing-upstream-evidence.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/failing-upstream-evidence.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_PROTOCOL_EVIDENCE_FAILED",
    trigger: "Native protocol compatibility evidence is not passing",
    canonicalMessage: "Native protocol compatibility evidence is not passing.",
    stage: "preflight",
    phase: "native-protocol-compatibility-preflight",
    artifactPath: "fixtures/p5/native/mutations/failing-protocol-evidence.native-preflight.json",
    jsonPointer: "/compatibilityPreflightRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/failing-protocol-evidence.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_UPSTREAM_EVIDENCE_HASH_MISMATCH",
    trigger: "Native upstream evidence or catalog hash does not match the accepted boundary",
    canonicalMessage: "Native upstream evidence or catalog hash does not match the accepted boundary.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/upstream-evidence-hash-mismatch.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/upstream-evidence-hash-mismatch.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_DECISION_LEDGER_HASH_MISMATCH",
    trigger: "Native decision ledger hash does not match accepted P4 evidence",
    canonicalMessage: "Native decision ledger hash does not match accepted P4 evidence.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/decision-ledger-hash-mismatch.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/decision-ledger-hash-mismatch.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_REVIEW_REPORT_HASH_MISMATCH",
    trigger: "Native review report hash does not match accepted P4 evidence",
    canonicalMessage: "Native review report hash does not match accepted P4 evidence.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/review-report-hash-mismatch.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/review-report-hash-mismatch.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_PROTOCOL_EVIDENCE_HASH_MISMATCH",
    trigger: "Native protocol compatibility evidence hash does not match accepted protocol proof",
    canonicalMessage: "Native protocol compatibility evidence does not match the accepted protocol proof.",
    stage: "preflight",
    phase: "native-protocol-compatibility-preflight",
    artifactPath: "fixtures/p5/native/mutations/protocol-evidence-hash-mismatch.native-preflight.json",
    jsonPointer: "/compatibilityPreflightRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/protocol-evidence-hash-mismatch.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_UPSTREAM_EVIDENCE_STALE",
    trigger: "Native upstream evidence or catalog ref is stale or not the exact declared input",
    canonicalMessage: "Native upstream evidence or catalog ref is stale or not the exact declared input.",
    stage: "preflight",
    phase: "native-upstream-preflight",
    artifactPath: "fixtures/p5/native/mutations/stale-upstream-evidence.native-preflight.json",
    jsonPointer: "/upstreamRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/stale-upstream-evidence.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_PROTOCOL_EVIDENCE_STALE",
    trigger: "Native protocol compatibility evidence ref is stale or not the exact declared input",
    canonicalMessage: "Native protocol compatibility evidence ref is stale or not the exact declared input.",
    stage: "preflight",
    phase: "native-protocol-compatibility-preflight",
    artifactPath: "fixtures/p5/native/mutations/stale-protocol-evidence.native-preflight.json",
    jsonPointer: "/compatibilityPreflightRefs",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/stale-protocol-evidence.native-preflight.json"
  }),
  diagnosticRow({
    code: "NATIVE_TARGET_UNDECLARED",
    trigger: "Target selection fixture omits the target id or target kind",
    canonicalMessage: "Native adapter target is not declared.",
    stage: "target-selection",
    phase: "surfaces-native-target-selection",
    artifactPath: "fixtures/p5/native/invalid/target-undeclared.surfaces-native-target-selection.json",
    jsonPointer: "/targetId",
    sourceRef: "fixture://p5/native/invalid/target-undeclared#/targetId",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-undeclared.surfaces-native-target-selection.json"
  }),
  diagnosticRow({
    code: "NATIVE_TARGET_OUT_OF_SCOPE",
    trigger: "Target selection names unsupported catalog, component, capability, transport, or API scope",
    canonicalMessage: "Native adapter target exceeds accepted upstream scope.",
    stage: "target-selection",
    phase: "surfaces-native-target-selection",
    artifactPath: "fixtures/p5/native/invalid/target-out-of-scope.surfaces-native-target-selection.json",
    jsonPointer: "/componentScope",
    sourceRef: "fixture://p5/native/invalid/target-out-of-scope#/componentScope",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-out-of-scope.surfaces-native-target-selection.json"
  }),
  diagnosticRow({
    code: "NATIVE_A2UI_CLAIM_FORBIDDEN",
    trigger: "Target selection claims A2UI support without a separate A2UI proof contract",
    canonicalMessage: "A2UI support requires a separate P5 conformance proof.",
    stage: "target-selection",
    phase: "surfaces-native-target-selection",
    artifactPath: "fixtures/p5/native/invalid/target-selection-a2ui-claim.surfaces-native-target-selection.json",
    jsonPointer: "/excludedClaims",
    sourceRef: "fixture://p5/native/invalid/target-selection-a2ui-claim#/excludedClaims",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-selection-a2ui-claim.surfaces-native-target-selection.json"
  }),
  diagnosticRow({
    code: "NATIVE_LIVE_API_FORBIDDEN",
    trigger: "Target selection claims live production API, transport, SDK, callback, or network behavior",
    canonicalMessage: "Live native API behavior is forbidden in this proof.",
    stage: "target-selection",
    phase: "surfaces-native-target-selection",
    artifactPath: "fixtures/p5/native/invalid/target-selection-live-api-claim.surfaces-native-target-selection.json",
    jsonPointer: "/capabilityScope",
    sourceRef: "fixture://p5/native/invalid/target-selection-live-api-claim#/capabilityScope",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/target-selection-live-api-claim.surfaces-native-target-selection.json"
  }),
  diagnosticRow({
    code: "NATIVE_TARGET_SELECTION_HASH_MISMATCH",
    trigger: "Target selection artifact hash differs from accepted evidence or report refs",
    canonicalMessage: "Native target selection hash does not match generated artifacts.",
    stage: "target-selection",
    phase: "surfaces-native-target-selection",
    artifactPath: "fixtures/p5/native/mutations/target-selection-hash-mismatch.surfaces-native-target-selection.json",
    jsonPointer: "/targetSelectionRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/target-selection-hash-mismatch.surfaces-native-target-selection.json"
  }),
  diagnosticRow({
    code: "NATIVE_PROJECTION_REF_MISSING",
    trigger: "Projection omits target, catalog, P2 evidence, or P4 evidence refs",
    canonicalMessage: "Native projection required boundary reference is missing.",
    stage: "projection",
    phase: "surfaces-native-projection",
    artifactPath: "fixtures/p5/native/mutations/missing-projection-ref.surfaces-native-projection.json",
    jsonPointer: "/targetSelectionRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/missing-projection-ref.surfaces-native-projection.json"
  }),
  diagnosticRow({
    code: "NATIVE_SOURCE_HASH_MISMATCH",
    trigger: "Projection source hash differs from generated target selection or accepted evidence",
    canonicalMessage: "Native projection source hash does not match generated target selection or accepted evidence.",
    stage: "projection",
    phase: "surfaces-native-projection",
    artifactPath: "fixtures/p5/native/mutations/projection-hash-mismatch.surfaces-native-projection.json",
    jsonPointer: "/targetSelectionRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/projection-hash-mismatch.surfaces-native-projection.json"
  }),
  diagnosticRow({
    code: "NATIVE_AUTHORITY_ESCALATION",
    trigger: "Projection grants authority absent from governed catalog or target selection",
    canonicalMessage: "Native projection grants authority absent from the governed catalog.",
    stage: "projection",
    phase: "surfaces-native-projection",
    artifactPath: "fixtures/p5/native/invalid/native-authority-escalation.surfaces-native-projection.json",
    jsonPointer: "/components",
    sourceRef: "fixture://p5/native/invalid/native-authority-escalation#/components",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/native-authority-escalation.surfaces-native-projection.json"
  }),
  diagnosticRow({
    code: "NATIVE_PRODUCTION_API_FORBIDDEN",
    trigger: "Projection claims live API, SDK, transport, callback, webhook, queue, or network behavior",
    canonicalMessage: "Production API, SDK, transport, callback, or network behavior is forbidden in this proof.",
    stage: "projection",
    phase: "surfaces-native-projection",
    artifactPath: "fixtures/p5/native/invalid/production-api-claim.surfaces-native-projection.json",
    jsonPointer: "/nativePacket",
    sourceRef: "fixture://p5/native/invalid/production-api-claim#/nativePacket",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/production-api-claim.surfaces-native-projection.json"
  }),
  diagnosticRow({
    code: "NATIVE_A2UI_CLAIM_FORBIDDEN",
    trigger: "Projection claims A2UI support without separate A2UI conformance proof",
    canonicalMessage: "A2UI support requires a separate P5 conformance proof.",
    stage: "projection",
    phase: "surfaces-native-projection",
    artifactPath: "fixtures/p5/native/invalid/a2ui-claim-without-conformance.surfaces-native-projection.json",
    jsonPointer: "/nativePacket",
    sourceRef: "fixture://p5/native/invalid/a2ui-claim-without-conformance#/nativePacket",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/a2ui-claim-without-conformance.surfaces-native-projection.json"
  }),
  diagnosticRow({
    code: "NATIVE_MEMBER_UNKNOWN",
    trigger: "Native fixture references authority absent from the native projection",
    canonicalMessage: "Native fixture references authority absent from the native projection.",
    stage: "native-boundary",
    phase: "native-invalid",
    artifactPath: "fixtures/p5/native/invalid/unknown-component.surface-ir.json",
    jsonPointer: "/root/component",
    sourceRef: "fixture://p5/native/invalid/unknown-component#/root",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unknown-component.surface-ir.json"
  }),
  diagnosticRow({
    code: "NATIVE_MEMBER_UNKNOWN",
    trigger: "Native fixture references authority absent from the native projection",
    canonicalMessage: "Native fixture references authority absent from the native projection.",
    stage: "native-boundary",
    phase: "native-invalid",
    artifactPath: "fixtures/p5/native/invalid/unknown-prop.surface-ir.json",
    jsonPointer: "/root/props",
    sourceRef: "fixture://p5/native/invalid/unknown-prop#/root/props",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/unknown-prop.surface-ir.json"
  }),
  diagnosticRow({
    code: "NATIVE_ACTION_EXECUTION_FORBIDDEN",
    trigger: "Native fixture attempts action execution, callback, or transport behavior",
    canonicalMessage: "Native action execution is forbidden.",
    stage: "native-boundary",
    phase: "native-invalid",
    artifactPath: "fixtures/p5/native/invalid/live-action-callback.surface-ir.json",
    jsonPointer: "/root/actions",
    sourceRef: "fixture://p5/native/invalid/live-action-callback#/root/actions",
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "invalid/live-action-callback.surface-ir.json"
  }),
  diagnosticRow({
    code: "NATIVE_REVIEW_REQUIRED",
    trigger: "Structurally valid native usage requires review",
    canonicalMessage: "Native usage requires review before unattended promotion.",
    severity: "review",
    stage: "native-boundary",
    phase: "native-review",
    artifactPath: "fixtures/p5/native/review/review-required-native-action.surface-ir.json",
    jsonPointer: "/root/actions",
    sourceRef: "fixture://p5/native/review/review-required-native-action#/root/actions",
    validationResult: "review_required",
    promotionStatus: "review_required",
    fixtureCoverage: "review/review-required-native-action.surface-ir.json"
  }),
  diagnosticRow({
    code: "NATIVE_REPORT_HASH_MISMATCH",
    trigger: "Native adapter report hash does not match generated artifacts",
    canonicalMessage: "Native adapter report hash does not match generated artifacts.",
    stage: "report",
    phase: "surfaces-native-report",
    artifactPath: "fixtures/p5/native/mutations/report-projection-hash-mismatch.surfaces-native-report.json",
    jsonPointer: "/projectionRef/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/report-projection-hash-mismatch.surfaces-native-report.json"
  }),
  diagnosticRow({
    code: "NATIVE_EVIDENCE_HASH_MISMATCH",
    trigger: "Native adapter evidence hash differs from manifest or self-hash rule",
    canonicalMessage: "Native adapter evidence hash does not match the manifest or self-hash rule.",
    stage: "evidence",
    phase: "surfaces-native-evidence",
    artifactPath: "fixtures/p5/native/mutations/hash-mismatch.surfaces-native-evidence.json",
    jsonPointer: "/artifacts",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage: "mutations/hash-mismatch.surfaces-native-evidence.json"
  })
];

export const P5_EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/valid/button-surfaces-native-packet.surface-ir.json`,
    kind: "valid",
    stage: "native-boundary",
    phase: "native-valid",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: `${P5_ARTIFACT_ROOT}/surfaces-native-packet.button.json`,
    jsonPointer: "/root/component",
    requiredSourceRef: "fixture://p5/native/valid/button-surfaces-native-packet#/root/component",
    packetPath: `${P5_ARTIFACT_ROOT}/surfaces-native-packet.button.json`,
    component: "Button"
  }),
  expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/valid/in-line-alert-surfaces-native-packet.surface-ir.json`,
    kind: "valid",
    stage: "native-boundary",
    phase: "native-valid",
    expectedResult: "valid",
    promotionStatus: "allowed",
    diagnosticCodes: [],
    artifactPath: `${P5_ARTIFACT_ROOT}/surfaces-native-packet.in-line-alert.json`,
    jsonPointer: "/root/component",
    requiredSourceRef: "fixture://p5/native/valid/in-line-alert-surfaces-native-packet#/root/component",
    packetPath: `${P5_ARTIFACT_ROOT}/surfaces-native-packet.in-line-alert.json`,
    component: "InLineAlert"
  }),
  expectationRow({
    fixturePath: `${P5_FIXTURE_ROOT}/review/review-required-native-action.surface-ir.json`,
    kind: "review",
    stage: "native-boundary",
    phase: "native-review",
    expectedResult: "review_required",
    promotionStatus: "review_required",
    diagnosticCodes: ["NATIVE_REVIEW_REQUIRED"],
    artifactPath: `${P5_ARTIFACT_ROOT}/surfaces-native-report.json`,
    jsonPointer: "/root/actions",
    requiredSourceRef: "fixture://p5/native/review/review-required-native-action#/root/actions",
    packetPath: null,
    component: "Button"
  }),
  ...[
    ["invalid/unknown-component.surface-ir.json", "native-boundary", "native-invalid", "NATIVE_MEMBER_UNKNOWN", "/root/component"],
    ["invalid/unknown-prop.surface-ir.json", "native-boundary", "native-invalid", "NATIVE_MEMBER_UNKNOWN", "/root/props"],
    ["invalid/native-authority-escalation.surfaces-native-projection.json", "projection", "surfaces-native-projection", "NATIVE_AUTHORITY_ESCALATION", "/components"],
    ["invalid/live-action-callback.surface-ir.json", "native-boundary", "native-invalid", "NATIVE_ACTION_EXECUTION_FORBIDDEN", "/root/actions"],
    ["invalid/production-api-claim.surfaces-native-projection.json", "projection", "surfaces-native-projection", "NATIVE_PRODUCTION_API_FORBIDDEN", "/nativePacket"],
    ["invalid/a2ui-claim-without-conformance.surfaces-native-projection.json", "projection", "surfaces-native-projection", "NATIVE_A2UI_CLAIM_FORBIDDEN", "/nativePacket"],
    ["invalid/target-undeclared.surfaces-native-target-selection.json", "target-selection", "surfaces-native-target-selection", "NATIVE_TARGET_UNDECLARED", "/targetId"],
    ["invalid/target-out-of-scope.surfaces-native-target-selection.json", "target-selection", "surfaces-native-target-selection", "NATIVE_TARGET_OUT_OF_SCOPE", "/componentScope"],
    ["invalid/target-selection-a2ui-claim.surfaces-native-target-selection.json", "target-selection", "surfaces-native-target-selection", "NATIVE_A2UI_CLAIM_FORBIDDEN", "/excludedClaims"],
    ["invalid/target-selection-live-api-claim.surfaces-native-target-selection.json", "target-selection", "surfaces-native-target-selection", "NATIVE_LIVE_API_FORBIDDEN", "/capabilityScope"],
    ["mutations/missing-upstream-evidence.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_UPSTREAM_EVIDENCE_MISSING", "/"],
    ["mutations/missing-decision-ledger.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_DECISION_LEDGER_MISSING", "/upstreamRefs"],
    ["mutations/missing-review-report.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_REVIEW_REPORT_MISSING", "/upstreamRefs"],
    ["mutations/missing-protocol-evidence.native-preflight.json", "preflight", "native-protocol-compatibility-preflight", "NATIVE_PROTOCOL_EVIDENCE_MISSING", "/compatibilityPreflightRefs"],
    ["mutations/failing-upstream-evidence.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_UPSTREAM_EVIDENCE_FAILED", "/upstreamRefs"],
    ["mutations/failing-protocol-evidence.native-preflight.json", "preflight", "native-protocol-compatibility-preflight", "NATIVE_PROTOCOL_EVIDENCE_FAILED", "/compatibilityPreflightRefs"],
    ["mutations/upstream-evidence-hash-mismatch.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_UPSTREAM_EVIDENCE_HASH_MISMATCH", "/upstreamRefs"],
    ["mutations/decision-ledger-hash-mismatch.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_DECISION_LEDGER_HASH_MISMATCH", "/upstreamRefs"],
    ["mutations/review-report-hash-mismatch.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_REVIEW_REPORT_HASH_MISMATCH", "/upstreamRefs"],
    ["mutations/protocol-evidence-hash-mismatch.native-preflight.json", "preflight", "native-protocol-compatibility-preflight", "NATIVE_PROTOCOL_EVIDENCE_HASH_MISMATCH", "/compatibilityPreflightRefs"],
    ["mutations/stale-upstream-evidence.native-preflight.json", "preflight", "native-upstream-preflight", "NATIVE_UPSTREAM_EVIDENCE_STALE", "/upstreamRefs"],
    ["mutations/stale-protocol-evidence.native-preflight.json", "preflight", "native-protocol-compatibility-preflight", "NATIVE_PROTOCOL_EVIDENCE_STALE", "/compatibilityPreflightRefs"],
    ["mutations/target-selection-hash-mismatch.surfaces-native-target-selection.json", "target-selection", "surfaces-native-target-selection", "NATIVE_TARGET_SELECTION_HASH_MISMATCH", "/targetSelectionRef/hash"],
    ["mutations/missing-projection-ref.surfaces-native-projection.json", "projection", "surfaces-native-projection", "NATIVE_PROJECTION_REF_MISSING", "/targetSelectionRef"],
    ["mutations/projection-hash-mismatch.surfaces-native-projection.json", "projection", "surfaces-native-projection", "NATIVE_SOURCE_HASH_MISMATCH", "/targetSelectionRef/hash"],
    ["mutations/report-projection-hash-mismatch.surfaces-native-report.json", "report", "surfaces-native-report", "NATIVE_REPORT_HASH_MISMATCH", "/projectionRef/hash"],
    ["mutations/hash-mismatch.surfaces-native-evidence.json", "evidence", "surfaces-native-evidence", "NATIVE_EVIDENCE_HASH_MISMATCH", "/artifacts"]
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
    packetPath: null,
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
    P5_PROTOCOL_EVIDENCE_PATH,
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
  if (artifactPath === P5_PROTOCOL_EVIDENCE_PATH) return "protocol-adapter-evidence.v0";
  if (artifactPath.endsWith("expectations.manifest.json")) return "surfaces-native-expectations.v0";
  if (artifactPath.endsWith(".surfaces-native-target-selection.json") || artifactPath.endsWith("adapter-target-selection.fixture.json") || artifactPath.endsWith("adapter-target-selection.json")) return "surfaces-native-target-selection.v0";
  if (artifactPath.endsWith(".surfaces-native-projection.json") || artifactPath.endsWith("surfaces-native-projection.json")) return "surfaces-native-projection.v0";
  if (artifactPath.endsWith(".surface-ir.json")) return "surface-ir.v0";
  if (artifactPath.endsWith(".native-preflight.json")) return "surfaces-native-preflight-mutation.v0";
  if (artifactPath.endsWith(".surfaces-native-report.json") || artifactPath.endsWith("surfaces-native-report.json")) return "surfaces-native-report.v0";
  if (artifactPath.endsWith(".surfaces-native-evidence.json") || artifactPath.endsWith("evidence.json")) return "surfaces-native-evidence.v0";
  if (artifactPath.includes("surfaces-native-packet.")) return "surfaces-native-packet.v0";
  return null;
}

export async function materializeP5NativeContract(cwd) {
  const schemas = buildP5NativeSchemas();
  for (const file of P5_SCHEMA_FILES) {
    await writeCanonicalJson(path.join(cwd, P5_SCHEMA_ROOT, file), schemas[file]);
  }

  const fixtures = buildP5NativeFixtures();
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeCanonicalJson(path.join(cwd, P5_FIXTURE_ROOT, file), fixture);
  }
  console.log("P5 native materialize: pass");
}

export function buildP5NativeSchemas() {
  return {
    "surfaces-native-target-selection.v0.schema.json": nativeTargetSelectionSchema(),
    "surfaces-native-projection.v0.schema.json": nativeProjectionSchema(),
    "surfaces-native-packet.v0.schema.json": nativePacketSchema(),
    "surfaces-native-report.v0.schema.json": nativeAdapterReportSchema(),
    "surfaces-native-evidence.v0.schema.json": nativeAdapterEvidenceSchema(),
    "surfaces-native-expectations.v0.schema.json": nativeAdapterExpectationsSchema(),
    "surfaces-native-diagnostics.v0.schema.json": nativeAdapterDiagnosticsSchema(),
    "surfaces-native-preflight-mutation.v0.schema.json": nativePreflightMutationSchema()
  };
}

export function buildP5NativeFixtures() {
  return {
    "expectations.manifest.json": expectationsManifest(),
    "adapter-target-selection.fixture.json": targetSelectionFixture(),
    "valid/button-surfaces-native-packet.surface-ir.json": surfaceFixture({
      fixtureId: "button-surfaces-native-packet",
      folder: "valid",
      component: "Button",
      props: { size: "m", style: "fill", variant: "accent" },
      accessibility: { role: "button", nameFrom: "content", focusable: true, activationKeys: ["Enter", "Space"] },
      tokenRefs: { height: "component-height-75", widthMultiplier: "button-minimum-width-multiplier" }
    }),
    "valid/in-line-alert-surfaces-native-packet.surface-ir.json": surfaceFixture({
      fixtureId: "in-line-alert-surfaces-native-packet",
      folder: "valid",
      component: "InLineAlert",
      props: { heading: "Static native boundary", style: "outline", variant: "neutral" },
      accessibility: { role: "status", nameFrom: "content", focusable: false, liveRegion: "polite" },
      tokenRefs: { border: "border-width-200" }
    }),
    "review/review-required-native-action.surface-ir.json": surfaceFixture({
      fixtureId: "review-required-native-action",
      folder: "review",
      component: "Button",
      props: { size: "m", style: "fill", variant: "negative" },
      actions: {
        reviewIntent: {
          execute: false,
          payload: { intent: "sensitive-action" },
          sourceRef: "fixture://p5/native/review/review-required-native-action#/root/actions/reviewIntent"
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
          sourceRef: "fixture://p5/native/invalid/live-action-callback#/root/actions/submit"
        }
      }
    }),
    "invalid/native-authority-escalation.surfaces-native-projection.json": projectionMutation({
      sourceRef: "fixture://p5/native/invalid/native-authority-escalation#/components",
      components: { UnsupportedCard: { props: {}, sourceRef: "fixture://p5/native/invalid/native-authority-escalation#/components/UnsupportedCard" } }
    }),
    "invalid/production-api-claim.surfaces-native-projection.json": projectionMutation({
      sourceRef: "fixture://p5/native/invalid/production-api-claim#/nativePacket",
      nativePacket: {
        transport: "http",
        sideEffectsAllowed: true,
        liveOperations: ["POST /surfaces/native"],
        productionApi: true,
        sdk: true,
        callbacks: ["https://example.invalid/native-callback"]
      }
    }),
    "invalid/a2ui-claim-without-conformance.surfaces-native-projection.json": projectionMutation({
      sourceRef: "fixture://p5/native/invalid/a2ui-claim-without-conformance#/nativePacket",
      nativePacket: { a2uiConformance: true }
    }),
    "invalid/target-undeclared.surfaces-native-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/native/invalid/target-undeclared#/targetId",
      targetId: null,
      targetKind: null
    }),
    "invalid/target-out-of-scope.surfaces-native-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/native/invalid/target-out-of-scope#/componentScope",
      componentScope: ["Button", "InLineAlert", "UnsupportedCard"]
    }),
    "invalid/target-selection-a2ui-claim.surfaces-native-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/native/invalid/target-selection-a2ui-claim#/excludedClaims",
      capabilityScope: { ...defaultCapabilityScope(), a2uiConformance: true },
      excludedClaims: defaultExcludedClaims().filter((claim) => claim !== "a2ui")
    }),
    "invalid/target-selection-live-api-claim.surfaces-native-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/native/invalid/target-selection-live-api-claim#/capabilityScope",
      capabilityScope: { ...defaultCapabilityScope(), transport: "http", liveNativeApi: true }
    }),
    "mutations/missing-upstream-evidence.native-preflight.json": preflightMutation({ mutation: "missing-upstream-evidence", upstreamRefs: [] }),
    "mutations/missing-decision-ledger.native-preflight.json": preflightMutation({ mutation: "missing-decision-ledger", upstreamRefs: defaultUpstreamRefs().filter((ref) => ref.path !== P5_P4_DECISION_LEDGER_PATH) }),
    "mutations/missing-review-report.native-preflight.json": preflightMutation({ mutation: "missing-review-report", upstreamRefs: defaultUpstreamRefs().filter((ref) => ref.path !== P5_P4_REVIEW_REPORT_PATH) }),
    "mutations/missing-protocol-evidence.native-preflight.json": preflightMutation({ mutation: "missing-protocol-evidence", compatibilityPreflightRefs: [] }),
    "mutations/failing-upstream-evidence.native-preflight.json": preflightMutation({ mutation: "failing-upstream-evidence", status: "fail", upstreamRefs: defaultUpstreamRefs() }),
    "mutations/failing-protocol-evidence.native-preflight.json": preflightMutation({ mutation: "failing-protocol-evidence", status: "fail", upstreamRefs: defaultUpstreamRefs() }),
    "mutations/upstream-evidence-hash-mismatch.native-preflight.json": preflightMutation({ mutation: "upstream-evidence-hash-mismatch", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P2_CATALOG_PATH ? { ...ref, hash: "0".repeat(64) } : ref) }),
    "mutations/decision-ledger-hash-mismatch.native-preflight.json": preflightMutation({ mutation: "decision-ledger-hash-mismatch", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P4_DECISION_LEDGER_PATH ? { ...ref, hash: "0".repeat(64) } : ref) }),
    "mutations/review-report-hash-mismatch.native-preflight.json": preflightMutation({ mutation: "review-report-hash-mismatch", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P4_REVIEW_REPORT_PATH ? { ...ref, hash: "0".repeat(64) } : ref) }),
    "mutations/protocol-evidence-hash-mismatch.native-preflight.json": preflightMutation({ mutation: "protocol-evidence-hash-mismatch", compatibilityPreflightRefs: defaultCompatibilityPreflightRefs().map((ref) => ({ ...ref, hash: "0".repeat(64) })) }),
    "mutations/stale-upstream-evidence.native-preflight.json": preflightMutation({ mutation: "stale-upstream-evidence", upstreamRefs: defaultUpstreamRefs().map((ref) => ref.path === P5_P2_CATALOG_PATH ? { ...ref, path: "artifacts/p2/stale-governed-catalog.json" } : ref) }),
    "mutations/stale-protocol-evidence.native-preflight.json": preflightMutation({ mutation: "stale-protocol-evidence", compatibilityPreflightRefs: defaultCompatibilityPreflightRefs().map((ref) => ({ ...ref, path: "artifacts/p5/protocol/stale-evidence.json" })) }),
    "mutations/target-selection-hash-mismatch.surfaces-native-target-selection.json": targetSelectionFixture({
      sourceRef: "fixture://p5/native/mutations/target-selection-hash-mismatch#/targetSelectionRef/hash",
      targetSelectionRef: artifactRef(`${P5_ARTIFACT_ROOT}/adapter-target-selection.json`, "surfaces-native-target-selection.v0", "0".repeat(64))
    }),
    "mutations/missing-projection-ref.surfaces-native-projection.json": projectionMutation({
      sourceRef: "fixture://p5/native/mutations/missing-projection-ref#/targetSelectionRef",
      targetSelectionRef: null
    }),
    "mutations/projection-hash-mismatch.surfaces-native-projection.json": projectionMutation({
      sourceRef: "fixture://p5/native/mutations/projection-hash-mismatch#/targetSelectionRef/hash",
      targetSelectionRef: targetSelectionArtifactRef("0".repeat(64))
    }),
    "mutations/report-projection-hash-mismatch.surfaces-native-report.json": reportMutation(),
    "mutations/hash-mismatch.surfaces-native-evidence.json": evidenceMutation()
  };
}

function nativeTargetSelectionSchema() {
  return objectSchema("surfaces-native-target-selection.v0", {
    schemaId: { const: "surfaces-native-target-selection.v0" },
    version: { type: "string" },
    targetId: { type: ["string", "null"] },
    targetKind: { type: ["string", "null"] },
    claimStatus: { enum: ["proof_only"] },
    upstreamRefs: { type: "array", items: artifactRefSchema(), minItems: 0 },
    compatibilityPreflightRefs: { type: "array", items: artifactRefSchema(), minItems: 0 },
    componentScope: { type: "array", items: { type: "string" } },
    capabilityScope: { type: "object", additionalProperties: true },
    excludedClaims: { type: "array", items: { type: "string" } },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    targetSelectionRef: { anyOf: [artifactRefSchema(), { type: "null" }] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "targetId", "targetKind", "claimStatus", "upstreamRefs", "compatibilityPreflightRefs", "componentScope", "capabilityScope", "excludedClaims", "diagnostics", "diagnosticsRegistry", "targetSelectionRef", "provenance"]);
}

function nativeProjectionSchema() {
  return objectSchema("surfaces-native-projection.v0", {
    schemaId: { const: "surfaces-native-projection.v0" },
    version: { type: "string" },
    adapter: { const: P5_TARGET_ID },
    targetSelectionRef: { anyOf: [artifactRefSchema(), { type: "null" }] },
    catalogRef: artifactRefSchema(),
    p2EvidenceRef: artifactRefSchema(),
    p4EvidenceRef: artifactRefSchema(),
    p4DecisionLedgerRef: artifactRefSchema(),
    p4ReviewReportRef: artifactRefSchema(),
    compatibilityPreflightRef: artifactRefSchema(),
    components: { type: "object", additionalProperties: true },
    tokens: tokenRecordMapSchema(),
    actions: { type: "object", additionalProperties: true },
    events: { type: "object", additionalProperties: true },
    dataBindings: { type: "object", additionalProperties: true },
    governance: { type: "object", additionalProperties: true },
    accessibility: { type: "object", additionalProperties: true },
    nativePacket: { type: "object", additionalProperties: true },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "adapter", "targetSelectionRef", "catalogRef", "p2EvidenceRef", "p4EvidenceRef", "p4DecisionLedgerRef", "p4ReviewReportRef", "compatibilityPreflightRef", "components", "tokens", "actions", "events", "dataBindings", "governance", "accessibility", "nativePacket", "diagnostics", "diagnosticsRegistry", "provenance"]);
}

function nativePacketSchema() {
  return objectSchema("surfaces-native-packet.v0", {
    schemaId: { const: "surfaces-native-packet.v0" },
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

function nativeAdapterReportSchema() {
  return objectSchema("surfaces-native-report.v0", {
    schemaId: { const: "surfaces-native-report.v0" },
    version: { type: "string" },
    adapter: { const: P5_TARGET_ID },
    runId: { type: "string" },
    upstreamPreflight: { type: "object", additionalProperties: true },
    targetSelectionRef: artifactRefSchema(),
    projectionRef: artifactRefSchema(),
    fixtureRoot: { const: P5_FIXTURE_ROOT },
    artifactRoot: { const: P5_ARTIFACT_ROOT },
    results: { type: "array", items: resultRowSchema() },
    nativePacketRefs: { type: "array", items: artifactRefSchema() },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    generatedArtifactRefs: { type: "array", items: artifactRefSchema() },
    environment: { type: "object", additionalProperties: true },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "adapter", "runId", "upstreamPreflight", "targetSelectionRef", "projectionRef", "fixtureRoot", "artifactRoot", "results", "nativePacketRefs", "diagnostics", "diagnosticsRegistry", "generatedArtifactRefs", "environment", "status", "promotionStatus", "provenance"]);
}

function nativeAdapterEvidenceSchema() {
  return objectSchema("surfaces-native-evidence.v0", {
    contractId: { const: "surfaces-p5-native-adapter-proof" },
    schemaId: { const: "surfaces-native-evidence.v0" },
    version: { type: "string" },
    runId: { type: "string" },
    checkedAt: { const: P5_TIMESTAMP },
    command: { const: "interfacectl surfaces native proof" },
    args: { type: "object", additionalProperties: { type: "string" } },
    environment: { type: "object", additionalProperties: true },
    schemaClosure: { type: "array", items: artifactRefSchema() },
    fixtureRefs: { type: "array", items: artifactRefSchema() },
    boundaryRefs: { type: "array", items: artifactRefSchema(true) },
    compatibilityPreflightRefs: { type: "array", items: artifactRefSchema(true) },
    artifacts: { type: "array", items: artifactRefSchema(true) },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: diagnosticsRegistry() },
    validationResults: { type: "array", items: resultRowSchema() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  }, ["contractId", "schemaId", "version", "runId", "checkedAt", "command", "args", "environment", "schemaClosure", "fixtureRefs", "boundaryRefs", "compatibilityPreflightRefs", "artifacts", "diagnostics", "diagnosticsRegistry", "validationResults", "status", "promotionStatus", "provenance"]);
}

function nativeAdapterExpectationsSchema() {
  return objectSchema("surfaces-native-expectations.v0", {
    schemaId: { const: "surfaces-native-expectations.v0" },
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

function nativeAdapterDiagnosticsSchema() {
  return objectSchema("surfaces-native-diagnostics.v0", {
    schemaId: { const: "surfaces-native-diagnostics.v0" },
    version: { type: "string" },
    diagnosticsRegistry: { const: diagnosticsRegistry() }
  }, ["schemaId", "version", "diagnosticsRegistry"]);
}

function nativePreflightMutationSchema() {
  return objectSchema("surfaces-native-preflight-mutation.v0", {
    schemaId: { const: "surfaces-native-preflight-mutation.v0" },
    version: { type: "string" },
    command: { const: "interfacectl surfaces native proof" },
    mutation: { type: "string" },
    status: { enum: ["pass", "fail", null] },
    upstreamRefs: { type: "array", items: artifactRefSchema() },
    compatibilityPreflightRefs: { type: "array", items: artifactRefSchema() },
    provenance: provenanceSchema()
  }, ["schemaId", "version", "command", "mutation", "status", "upstreamRefs", "compatibilityPreflightRefs", "provenance"]);
}

function expectationsManifest() {
  return {
    schemaId: "surfaces-native-expectations.v0",
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

export function defaultCompatibilityPreflightRefs() {
  return [
    artifactRef(P5_PROTOCOL_EVIDENCE_PATH, "protocol-adapter-evidence.v0", P5_ACCEPTED_PROTOCOL_EVIDENCE_HASH)
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

export function provenance(generator, sourceRefs) {
  return {
    generatedAt: P5_TIMESTAMP,
    generator,
    sourceRefs
  };
}

export function targetSelectionArtifactHash() {
  return sha256Hex(canonicalJson(targetSelectionArtifact()));
}

export function targetSelectionArtifactRef(hash = targetSelectionArtifactHash()) {
  return artifactRef(`${P5_ARTIFACT_ROOT}/adapter-target-selection.json`, "surfaces-native-target-selection.v0", hash);
}

export function targetSelectionArtifact() {
  const fixture = targetSelectionFixture();
  return {
    ...deepClone(fixture),
    upstreamRefs: defaultUpstreamRefs(),
    compatibilityPreflightRefs: defaultCompatibilityPreflightRefs(),
    targetSelectionRef: null,
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-p5-surfaces-native-target-selection", [fixture.provenance.sourceRefs[0]])
  };
}

function targetSelectionFixture(overrides = {}) {
  const { sourceRef: overrideSourceRef, ...rest } = overrides;
  const sourceRef = overrideSourceRef ?? "fixture://p5/native/adapter-target-selection#/targetId";
  return {
    schemaId: "surfaces-native-target-selection.v0",
    version: P5_VERSION,
    targetId: P5_TARGET_ID,
    targetKind: "native-static-packet-proof",
    claimStatus: "proof_only",
    upstreamRefs: defaultUpstreamRefs(),
    compatibilityPreflightRefs: defaultCompatibilityPreflightRefs(),
    componentScope: ["Button", "InLineAlert"],
    capabilityScope: defaultCapabilityScope(),
    excludedClaims: defaultExcludedClaims(),
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    targetSelectionRef: null,
    provenance: provenance("interfacectl-p5-native-materialize", [sourceRef]),
    ...rest
  };
}

function defaultCapabilityScope() {
  return {
    nativePacketGeneration: "static-inert-only",
    protocolCompatibility: "preflight-only",
    actionExecution: false,
    callbacks: false,
    connectorCalls: false,
    networkCalls: false,
    liveNativeApi: false,
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
  const fixtureRoot = `fixture://p5/native/${folder}/${fixtureId}`;
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
      sourceHash: "sha256:native-fixture",
      sourceRef: `${fixtureRoot}#/provenance`,
      sourceUri: fixtureRoot
    }
  };
}

function projectionMutation(overrides = {}) {
  const { sourceRef: overrideSourceRef, ...rest } = overrides;
  const sourceRef = overrideSourceRef ?? "fixture://p5/native/mutations/projection#/targetSelectionRef";
  const base = {
    schemaId: "surfaces-native-projection.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    targetSelectionRef: targetSelectionArtifactRef(),
    catalogRef: artifactRef(P5_P2_CATALOG_PATH, "runtime-catalog.v0", P5_ACCEPTED_P2_CATALOG_HASH, { sourceEvidenceHash: P5_ACCEPTED_P2_EVIDENCE_HASH }),
    p2EvidenceRef: artifactRef(P5_P2_EVIDENCE_PATH, "design-system-ingestion-evidence.v0", P5_ACCEPTED_P2_EVIDENCE_HASH),
    p4EvidenceRef: artifactRef(P5_P4_EVIDENCE_PATH, "review-judgment-evidence.v0", P5_ACCEPTED_P4_EVIDENCE_HASH),
    p4DecisionLedgerRef: artifactRef(P5_P4_DECISION_LEDGER_PATH, "surfaceops-decision-ledger.v0", P5_ACCEPTED_P4_DECISION_LEDGER_HASH, { sourceEvidenceHash: P5_ACCEPTED_P4_EVIDENCE_HASH }),
    p4ReviewReportRef: artifactRef(P5_P4_REVIEW_REPORT_PATH, "review-judgment-report.v0", P5_ACCEPTED_P4_REVIEW_REPORT_HASH, { sourceEvidenceHash: P5_ACCEPTED_P4_EVIDENCE_HASH }),
    compatibilityPreflightRef: artifactRef(P5_PROTOCOL_EVIDENCE_PATH, "protocol-adapter-evidence.v0", P5_ACCEPTED_PROTOCOL_EVIDENCE_HASH),
    components: {},
    tokens: {},
    actions: {},
    events: {},
    dataBindings: {},
    governance: {},
    accessibility: {},
    nativePacket: { transport: "none", sideEffectsAllowed: false, liveOperations: [], productionApi: false, sdk: false, callbacks: [], a2uiConformance: false },
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    provenance: provenance("interfacectl-p5-native-materialize", [sourceRef])
  };
  return {
    ...base,
    ...rest,
    nativePacket: {
      ...base.nativePacket,
      ...(rest.nativePacket || {})
    }
  };
}

function preflightMutation(overrides) {
  return {
    schemaId: "surfaces-native-preflight-mutation.v0",
    version: P5_VERSION,
    command: "interfacectl surfaces native proof",
    mutation: "unknown",
    status: null,
    upstreamRefs: defaultUpstreamRefs(),
    compatibilityPreflightRefs: defaultCompatibilityPreflightRefs(),
    ...overrides,
    provenance: provenance("interfacectl-p5-native-materialize", ["plans/p5/native-static-proof.md#proof-command"])
  };
}

function reportMutation() {
  return {
    schemaId: "surfaces-native-report.v0",
    version: P5_VERSION,
    adapter: P5_TARGET_ID,
    runId: "p5-native-mutation",
    upstreamPreflight: {
      status: "pass",
      authorityRefs: defaultUpstreamRefs(),
      compatibilityPreflightRefs: defaultCompatibilityPreflightRefs()
    },
    targetSelectionRef: targetSelectionArtifactRef(),
    projectionRef: artifactRef(`${P5_ARTIFACT_ROOT}/surfaces-native-projection.json`, "surfaces-native-projection.v0", "0".repeat(64)),
    fixtureRoot: P5_FIXTURE_ROOT,
    artifactRoot: P5_ARTIFACT_ROOT,
    results: [],
    nativePacketRefs: [],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    generatedArtifactRefs: [],
    environment: { ...P5_ENVIRONMENT },
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p5-native-materialize", ["fixture://p5/native/mutations/report-projection-hash-mismatch#/projectionRef/hash"])
  };
}

function evidenceMutation() {
  return {
    contractId: "surfaces-p5-native-adapter-proof",
    schemaId: "surfaces-native-evidence.v0",
    version: P5_VERSION,
    runId: "p5-native-mutation",
    checkedAt: P5_TIMESTAMP,
    command: "interfacectl surfaces native proof",
    args: {
      ingestionEvidence: P5_P2_EVIDENCE_PATH,
      reviewEvidence: P5_P4_EVIDENCE_PATH,
      decisionLedger: P5_P4_DECISION_LEDGER_PATH,
      reviewReport: P5_P4_REVIEW_REPORT_PATH,
      catalog: P5_P2_CATALOG_PATH,
      protocolEvidence: P5_PROTOCOL_EVIDENCE_PATH,
      fixture: P5_FIXTURE_ROOT,
      out: P5_ARTIFACT_ROOT
    },
    environment: { ...P5_ENVIRONMENT },
    schemaClosure: [],
    fixtureRefs: [],
    boundaryRefs: [],
    compatibilityPreflightRefs: [],
    artifacts: [{
      path: `${P5_ARTIFACT_ROOT}/adapter-target-selection.json`,
      schemaId: "surfaces-native-target-selection.v0",
      hashAlgorithm: "sha256",
      hash: "0".repeat(64),
      sourceRef: null,
      provenance: provenance("interfacectl-p5-native-materialize", ["fixture://p5/native/mutations/hash-mismatch#/artifacts"])
    }],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: [],
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance("interfacectl-p5-native-materialize", ["fixture://p5/native/mutations/hash-mismatch#/artifacts"])
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
    .replace(/\.surfaces-native-target-selection\.json$/, "")
    .replace(/\.surfaces-native-projection\.json$/, "");
  return `fixture://p5/native/${withoutSuffix}#${jsonPointer}`;
}

function diagnosticSourceForStage(stage) {
  if (stage === "preflight") return "native-preflight-validator";
  if (stage === "target-selection") return "surfaces-native-target-selection-validator";
  if (stage === "projection") return "surfaces-native-projection-validator";
  if (stage === "native-boundary") return "native-boundary-validator";
  if (stage === "report") return "native-report-validator";
  return "native-evidence-validator";
}

function suggestedActionForCode(code) {
  if (code.includes("UPSTREAM") || code.includes("LEDGER") || code.includes("REVIEW_REPORT")) return "Restore accepted P2 and P4 evidence boundaries before P5 native proof continues.";
  if (code.includes("TARGET")) return "Keep P5 native target selection explicit and within accepted upstream scope.";
  if (code.includes("A2UI")) return "Add a separate P5 A2UI conformance proof before making A2UI claims.";
  if (code.includes("LIVE") || code.includes("PRODUCTION") || code.includes("ACTION")) return "Keep native packets inert with no live API, transport, callbacks, network calls, or action execution.";
  if (code.includes("HASH") || code.includes("EVIDENCE") || code.includes("REPORT")) return "Regenerate P5 native proof artifacts from current accepted inputs.";
  return "Correct the P5 native fixture or generated artifact and rerun the proof.";
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
    packetPath: { type: ["string", "null"] },
    component: { type: ["string", "null"] },
    matched: { type: "boolean" }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "actualResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "requiredSourceRef", "packetPath", "component", "matched"]);
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
    packetPath: { type: ["string", "null"] },
    component: { type: ["string", "null"] }
  }, ["fixturePath", "kind", "stage", "phase", "expectedResult", "promotionStatus", "diagnosticCodes", "artifactPath", "jsonPointer", "requiredSourceRef", "packetPath", "component"]);
}
