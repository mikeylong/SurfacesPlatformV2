import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalJson } from "./p0.js";

const TIMESTAMP = "1970-01-01T00:00:00.000Z";
const VERSION = "0.0.0";
const SCHEMA_ROOT = "schemas";
const FIXTURE_ROOT = "fixtures/p1";
const ARTIFACT_ROOT = "artifacts/p1";
const ADAPTER = "web-static";
const ZERO_HASH = "0".repeat(64);
const ONE_HASH = "1".repeat(64);
const BAD_HASH = "f".repeat(64);

const P1_SCHEMA_FILES = [
  "runtime-projection.v0.schema.json",
  "render-plan.v0.schema.json",
  "runtime-adapter-report.v0.schema.json",
  "runtime-adapter-evidence.v0.schema.json",
  "runtime-adapter-expectations.v0.schema.json",
  "runtime-adapter-diagnostics.v0.schema.json"
];

const P1_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "PROJECTION_CATALOG_REF_MISSING",
    trigger: "Runtime projection omits its governed catalog reference",
    canonicalMessage: "Runtime projection governed catalog reference is missing.",
    severity: "error",
    diagnosticSource: "runtime-projection-validator",
    stage: "projection",
    phase: "projection-mutation",
    artifactPath: "fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json",
    jsonPointer: "/catalogRef",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the projection and regenerate it from the governed P0 catalog.",
    fixtureCoverage: "mutations/missing-catalog-ref.runtime-projection.json"
  }),
  diagnosticRow({
    code: "PROJECTION_SOURCE_HASH_MISMATCH",
    trigger: "Runtime projection catalog hash differs from P0 evidence",
    canonicalMessage: "Runtime projection governed catalog hash does not match P0 evidence.",
    severity: "error",
    diagnosticSource: "runtime-projection-validator",
    stage: "projection",
    phase: "projection-mutation",
    artifactPath: "fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json",
    jsonPointer: "/catalogRef/hash",
    sourceRef: "fixture://p1/mutations/catalog-hash-mismatch.runtime-projection#/catalogRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the projection and regenerate it from the accepted P0 catalog ref.",
    fixtureCoverage: "mutations/catalog-hash-mismatch.runtime-projection.json"
  }),
  diagnosticRow({
    code: "PROJECTION_AUTHORITY_ESCALATION",
    trigger: "Runtime projection grants component, prop, action, token, data-binding, or governance authority absent from the governed catalog",
    canonicalMessage: "Runtime projection grants authority absent from the governed catalog.",
    severity: "error",
    diagnosticSource: "runtime-projection-validator",
    stage: "projection",
    phase: "projection-mutation",
    artifactPath: "fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json",
    jsonPointer: "/components/ConfirmPanel/actions/escalate",
    sourceRef: "fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the projection and remove non-catalog authority before proof continues.",
    fixtureCoverage: "mutations/projection-authority-escalation.runtime-projection.json"
  }),
  diagnosticRow({
    code: "RUNTIME_PROJECTION_HASH_MISMATCH",
    trigger: "Adapter proof consumes runtime projection metadata whose hash differs from the current projection artifact",
    canonicalMessage: "Runtime projection hash does not match adapter proof metadata.",
    severity: "error",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-adapter",
    artifactPath: "fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json",
    jsonPointer: "/runtimeProjectionRef/hash",
    sourceRef: "fixture://p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report#/runtimeProjectionRef",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the adapter report and regenerate proof artifacts from the current runtime projection.",
    fixtureCoverage: "mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json"
  }),
  diagnosticRow({
    code: "RUNTIME_RENDER_PLAN_PROVENANCE_MISSING",
    trigger: "Render plan omits required provenance",
    canonicalMessage: "Render plan provenance is missing.",
    severity: "error",
    diagnosticSource: "render-plan-validator",
    stage: "runtime-boundary",
    phase: "runtime-adapter",
    artifactPath: "fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json",
    jsonPointer: "/provenance",
    sourceRef: "fixture://p1/valid/confirm-panel#/root",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the render plan and regenerate it with required provenance.",
    fixtureCoverage: "mutations/missing-render-plan-provenance.render-plan.json"
  }),
  diagnosticRow({
    code: "RUNTIME_ACTION_EXECUTION_BLOCKED",
    trigger: "Runtime proof encounters disabled or unsupported action execution",
    canonicalMessage: "Runtime action execution is blocked by the governed catalog.",
    severity: "error",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "fixtures/p1/invalid/disabled-action-execution.surface-ir.json",
    jsonPointer: "/instances/secondaryAction/actions/dismiss/execute",
    sourceRef: "fixture://p1/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions.",
    fixtureCoverage: "invalid/disabled-action-execution.surface-ir.json"
  }),
  diagnosticRow({
    code: "RUNTIME_PROJECTION_MEMBER_UNKNOWN",
    trigger: "Runtime Surface IR references a component member or token absent from the runtime projection",
    canonicalMessage: "Runtime Surface IR references authority absent from the runtime projection.",
    severity: "error",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "runtime-surface-fixture",
    jsonPointer: "/",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage and correct the Surface IR against the runtime projection.",
    fixtureCoverage: "manifest-wide",
    dynamicLocation: true
  }),
  diagnosticRow({
    code: "RUNTIME_REVIEW_REQUIRED",
    trigger: "Runtime proof encounters structurally valid usage that requires review",
    canonicalMessage: "Runtime usage requires review before unattended promotion.",
    severity: "review",
    diagnosticSource: "runtime-boundary-validator",
    stage: "runtime-boundary",
    phase: "runtime-review",
    artifactPath: "fixtures/p1/review/review-required-action.surface-ir.json",
    jsonPointer: "/root/actions/confirm/execute",
    sourceRef: "fixture://p1/review/review-required-action#/root/actions/confirm",
    validationResult: "review_required",
    promotionStatus: "review_required",
    suggestedAction: "Preserve review status in report and evidence, and do not emit executable output for the action.",
    fixtureCoverage: "review/review-required-action.surface-ir.json"
  }),
  diagnosticRow({
    code: "RUNTIME_EVIDENCE_HASH_MISMATCH",
    trigger: "Runtime adapter evidence hash differs from manifest or self-hash rule",
    canonicalMessage: "Runtime adapter evidence hash does not match the manifest or self-hash rule.",
    severity: "error",
    diagnosticSource: "evidence-validator",
    stage: "evidence",
    phase: "runtime-evidence",
    artifactPath: "fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json",
    jsonPointer: "/artifacts/0/hash",
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject the evidence and regenerate it from current proof artifacts.",
    fixtureCoverage: "mutations/hash-mismatch.runtime-adapter-evidence.json"
  })
];

const INHERITED_P0_DIAGNOSTIC_CODES = [
  "ACCESSIBILITY_MODAL_UNSUPPORTED",
  "CATALOG_INVALID_VALUE",
  "CATALOG_UNKNOWN_COMPONENT",
  "CATALOG_UNKNOWN_PROP"
];

const INHERITED_P0_DIAGNOSTIC_ROWS = [
  diagnosticRow({
    code: "ACCESSIBILITY_MODAL_UNSUPPORTED",
    trigger: "Surface IR attempts modal dialog or alertdialog semantics through unsupported modal fields",
    canonicalMessage: "Modal dialog and alertdialog semantics are deferred beyond P1 and unsupported in P0/P1.",
    severity: "error",
    diagnosticSource: "catalog-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "fixtures/p1/invalid/modal-role-not-supported.surface-ir.json",
    jsonPointer: "/root/accessibility/role",
    sourceRef: "fixture://p1/invalid/modal-role-not-supported#/root/accessibility",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions.",
    fixtureCoverage: "invalid/modal-role-not-supported.surface-ir.json"
  }),
  diagnosticRow({
    code: "CATALOG_INVALID_VALUE",
    trigger: "String prop contains unsafe markup or unsanitized text",
    canonicalMessage: "String prop contains unsafe markup or unsanitized text.",
    severity: "error",
    diagnosticSource: "catalog-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "fixtures/p1/invalid/unsafe-markup.surface-ir.json",
    jsonPointer: "/instances/secondaryAction/props/label",
    sourceRef: "fixture://p1/invalid/unsafe-markup#/instances/secondaryAction/props/label",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions.",
    fixtureCoverage: "invalid/unsafe-markup.surface-ir.json"
  }),
  diagnosticRow({
    code: "CATALOG_UNKNOWN_COMPONENT",
    trigger: "Surface IR references an unknown component",
    canonicalMessage: "Surface IR references an unknown component.",
    severity: "error",
    diagnosticSource: "catalog-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "fixtures/p1/invalid/unknown-component.surface-ir.json",
    jsonPointer: "/root/component",
    sourceRef: "fixture://p1/invalid/unknown-component#/root",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions.",
    fixtureCoverage: "invalid/unknown-component.surface-ir.json"
  }),
  diagnosticRow({
    code: "CATALOG_UNKNOWN_PROP",
    trigger: "Surface IR references an unknown prop",
    canonicalMessage: "Surface IR references an unknown prop.",
    severity: "error",
    diagnosticSource: "catalog-validator",
    stage: "runtime-boundary",
    phase: "runtime-invalid",
    artifactPath: "fixtures/p1/invalid/unknown-prop.surface-ir.json",
    jsonPointer: "/root/props/eyebrow",
    sourceRef: "fixture://p1/invalid/unknown-prop#/root/props/eyebrow",
    validationResult: "invalid",
    promotionStatus: "blocked",
    suggestedAction: "Reject runtime usage without rendering or executing actions.",
    fixtureCoverage: "invalid/unknown-prop.surface-ir.json"
  })
];

const ALL_DIAGNOSTIC_ROWS = [...P1_DIAGNOSTIC_ROWS, ...INHERITED_P0_DIAGNOSTIC_ROWS];

const EXPECTATION_ROWS = [
  expectationRow({
    fixturePath: "fixtures/p1/valid/confirm-panel.surface-ir.json",
    fixtureKind: "valid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    validationResult: "valid",
    promotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: "artifacts/p1/render-plan.confirm-panel.json",
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p1/valid/confirm-panel#/root",
    renderPlanPath: "artifacts/p1/render-plan.confirm-panel.json"
  }),
  expectationRow({
    fixturePath: "fixtures/p1/valid/status-callout.surface-ir.json",
    fixtureKind: "valid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    validationResult: "valid",
    promotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: "artifacts/p1/render-plan.status-callout.json",
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p1/valid/status-callout#/root",
    renderPlanPath: "artifacts/p1/render-plan.status-callout.json"
  }),
  expectationRow({
    fixturePath: "fixtures/p1/valid/button-defaults.surface-ir.json",
    fixtureKind: "valid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    validationResult: "valid",
    promotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: "artifacts/p1/render-plan.button-defaults.json",
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p1/valid/button-defaults#/root",
    renderPlanPath: "artifacts/p1/render-plan.button-defaults.json"
  }),
  expectationRow({
    fixturePath: "fixtures/p1/review/review-required-action.surface-ir.json",
    fixtureKind: "review",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-review",
    validationResult: "review_required",
    promotionStatus: "review_required",
    expectedDiagnosticCodes: ["RUNTIME_REVIEW_REQUIRED"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/actions/confirm/execute",
    requiredSourceRef: "fixture://p1/review/review-required-action#/root/actions/confirm",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/invalid/unknown-component.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["CATALOG_UNKNOWN_COMPONENT"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/component",
    requiredSourceRef: "fixture://p1/invalid/unknown-component#/root",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/invalid/unknown-prop.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["CATALOG_UNKNOWN_PROP"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/props/eyebrow",
    requiredSourceRef: "fixture://p1/invalid/unknown-prop#/root/props/eyebrow",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/invalid/unsafe-markup.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["CATALOG_INVALID_VALUE"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/instances/secondaryAction/props/label",
    requiredSourceRef: "fixture://p1/invalid/unsafe-markup#/instances/secondaryAction/props/label",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/invalid/disabled-action-execution.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_ACTION_EXECUTION_BLOCKED"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/instances/secondaryAction/actions/dismiss/execute",
    requiredSourceRef: "fixture://p1/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss",
    renderPlanPath: null
  }),
  projectionMemberExpectation({
    slug: "unknown-action",
    pointer: "/root/actions/escalate"
  }),
  projectionMemberExpectation({
    slug: "unknown-event",
    pointer: "/root/events/escalated"
  }),
  projectionMemberExpectation({
    slug: "unknown-slot",
    pointer: "/root/slots/footer"
  }),
  projectionMemberExpectation({
    slug: "unknown-token-key",
    pointer: "/root/tokenRefs/accent"
  }),
  projectionMemberExpectation({
    slug: "unknown-token-ref",
    pointer: "/root/tokenRefs/surface"
  }),
  projectionMemberExpectation({
    slug: "unknown-data-binding",
    pointer: "/root/dataBindings/userId"
  }),
  projectionMemberExpectation({
    slug: "unknown-variant",
    pointer: "/root/variant"
  }),
  projectionMemberExpectation({
    slug: "unknown-state",
    pointer: "/root/state"
  }),
  expectationRow({
    fixturePath: "fixtures/p1/invalid/modal-role-not-supported.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["ACCESSIBILITY_MODAL_UNSUPPORTED"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/accessibility/role",
    requiredSourceRef: "fixture://p1/invalid/modal-role-not-supported#/root/accessibility",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json",
    fixtureKind: "mutation",
    expectedStage: "projection",
    expectedPhase: "projection-mutation",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["PROJECTION_CATALOG_REF_MISSING"],
    expectedArtifactPath: "fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json",
    expectedJsonPointer: "/catalogRef",
    requiredSourceRef: null,
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json",
    fixtureKind: "mutation",
    expectedStage: "projection",
    expectedPhase: "projection-mutation",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["PROJECTION_SOURCE_HASH_MISMATCH"],
    expectedArtifactPath: "fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json",
    expectedJsonPointer: "/catalogRef/hash",
    requiredSourceRef: "fixture://p1/mutations/catalog-hash-mismatch.runtime-projection#/catalogRef",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json",
    fixtureKind: "mutation",
    expectedStage: "projection",
    expectedPhase: "projection-mutation",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["PROJECTION_AUTHORITY_ESCALATION"],
    expectedArtifactPath: "fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json",
    expectedJsonPointer: "/components/ConfirmPanel/actions/escalate",
    requiredSourceRef: "fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json",
    fixtureKind: "mutation",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_RENDER_PLAN_PROVENANCE_MISSING"],
    expectedArtifactPath: "fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json",
    expectedJsonPointer: "/provenance",
    requiredSourceRef: "fixture://p1/valid/confirm-panel#/root",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json",
    fixtureKind: "mutation",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_PROJECTION_HASH_MISMATCH"],
    expectedArtifactPath: "fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json",
    expectedJsonPointer: "/runtimeProjectionRef/hash",
    requiredSourceRef: "fixture://p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report#/runtimeProjectionRef",
    renderPlanPath: null
  }),
  expectationRow({
    fixturePath: "fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json",
    fixtureKind: "mutation",
    expectedStage: "evidence",
    expectedPhase: "runtime-evidence",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_EVIDENCE_HASH_MISMATCH"],
    expectedArtifactPath: "fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json",
    expectedJsonPointer: "/artifacts/0/hash",
    requiredSourceRef: null,
    renderPlanPath: null
  })
];

function projectionMemberExpectation({ slug, pointer }) {
  return expectationRow({
    fixturePath: `fixtures/p1/invalid/${slug}.surface-ir.json`,
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    validationResult: "invalid",
    promotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_PROJECTION_MEMBER_UNKNOWN"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: pointer,
    requiredSourceRef: `fixture://p1/invalid/${slug}#${pointer}`,
    renderPlanPath: null
  });
}

const P1_STAGE_ORDER = ["projection", "runtime-boundary", "evidence"];
const P1_PHASES = ["projection-mutation", "runtime-adapter", "runtime-review", "runtime-invalid", "runtime-evidence"];
const PROMOTION_STATUSES = ["allowed", "review_required", "blocked"];
const VALIDATION_RESULTS = ["valid", "invalid", "review_required", "not_applicable"];
const GENERATED_P1_ARTIFACTS = [
  "artifacts/p1/runtime-projection.json",
  "artifacts/p1/render-plan.confirm-panel.json",
  "artifacts/p1/render-plan.status-callout.json",
  "artifacts/p1/render-plan.button-defaults.json",
  "artifacts/p1/runtime-adapter-report.json",
  "artifacts/p1/evidence.json"
];

export async function materializeP1Contract(cwd) {
  const schemas = buildSchemas();
  for (const file of P1_SCHEMA_FILES) {
    await writeJson(path.join(cwd, SCHEMA_ROOT, file), schemas[file]);
  }

  const fixtures = buildFixtures();
  for (const [file, fixture] of Object.entries(fixtures)) {
    await writeJson(path.join(cwd, FIXTURE_ROOT, file), fixture);
  }
}

export function buildP1Schemas() {
  return buildSchemas();
}

function buildSchemas() {
  return {
    "runtime-projection.v0.schema.json": runtimeProjectionSchema(),
    "render-plan.v0.schema.json": renderPlanSchema(),
    "runtime-adapter-report.v0.schema.json": runtimeAdapterReportSchema(),
    "runtime-adapter-evidence.v0.schema.json": runtimeAdapterEvidenceSchema(),
    "runtime-adapter-expectations.v0.schema.json": runtimeAdapterExpectationsSchema(),
    "runtime-adapter-diagnostics.v0.schema.json": runtimeAdapterDiagnosticsSchema()
  };
}

function buildFixtures() {
  return {
    "expectations.manifest.json": buildExpectationsManifest(),
    "valid/confirm-panel.surface-ir.json": confirmPanelSurface("valid", "confirm-panel"),
    "valid/status-callout.surface-ir.json": statusCalloutSurface("valid", "status-callout"),
    "valid/button-defaults.surface-ir.json": buttonDefaultsSurface("valid", "button-defaults"),
    "review/review-required-action.surface-ir.json": confirmPanelSurface("review", "review-required-action", {
      rootConfirmExecute: true
    }),
    "invalid/unknown-component.surface-ir.json": confirmPanelSurface("invalid", "unknown-component", {
      rootComponent: "GhostPanel"
    }),
    "invalid/unknown-prop.surface-ir.json": confirmPanelSurface("invalid", "unknown-prop", {
      rootProps: { eyebrow: "Archived item policy" }
    }),
    "invalid/unsafe-markup.surface-ir.json": confirmPanelSurface("invalid", "unsafe-markup", {
      secondaryActionProps: { label: "<script>alert(1)</script>" }
    }),
    "invalid/disabled-action-execution.surface-ir.json": confirmPanelSurface("invalid", "disabled-action-execution", {
      secondaryDismissExecute: true
    }),
    "invalid/unknown-action.surface-ir.json": unknownActionSurface(),
    "invalid/unknown-event.surface-ir.json": unknownEventSurface(),
    "invalid/unknown-slot.surface-ir.json": unknownSlotSurface(),
    "invalid/unknown-token-key.surface-ir.json": unknownTokenKeySurface(),
    "invalid/unknown-token-ref.surface-ir.json": unknownTokenRefSurface(),
    "invalid/unknown-data-binding.surface-ir.json": unknownDataBindingSurface(),
    "invalid/unknown-variant.surface-ir.json": unknownVariantSurface(),
    "invalid/unknown-state.surface-ir.json": unknownStateSurface(),
    "invalid/modal-role-not-supported.surface-ir.json": confirmPanelSurface("invalid", "modal-role-not-supported", {
      rootAccessibility: {
        focusTrap: true,
        modal: true,
        role: "alertdialog"
      }
    }),
    "mutations/missing-catalog-ref.runtime-projection.json": mutationMissingCatalogRef(),
    "mutations/catalog-hash-mismatch.runtime-projection.json": mutationCatalogHashMismatch(),
    "mutations/projection-authority-escalation.runtime-projection.json": mutationProjectionAuthorityEscalation(),
    "mutations/missing-render-plan-provenance.render-plan.json": mutationMissingRenderPlanProvenance(),
    "mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json": mutationRuntimeProjectionHashMismatch(),
    "mutations/hash-mismatch.runtime-adapter-evidence.json": mutationHashMismatchEvidence()
  };
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile()) {
      throw new Error(`refusing to overwrite non-regular file: ${filePath}`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`
  );
  try {
    await fs.writeFile(tempPath, canonicalJson(data), { flag: "wx" });
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

function buildExpectationsManifest() {
  return {
    schemaId: "runtime-adapter-expectations.v0",
    version: VERSION,
    fixtureRoot: FIXTURE_ROOT,
    schemaRoot: SCHEMA_ROOT,
    artifactRoot: ARTIFACT_ROOT,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required"
    },
    diagnosticsRegistry: diagnosticsRegistry(),
    inheritedDiagnosticCodes: [...INHERITED_P0_DIAGNOSTIC_CODES],
    inputs: EXPECTATION_ROWS.map((row) => row.fixturePath),
    expectations: EXPECTATION_ROWS.map((row) => ({ ...row })),
    artifactOrder: artifactOrder()
  };
}

function artifactOrder() {
  return [
    ...P1_SCHEMA_FILES.map((file) => `${SCHEMA_ROOT}/${file}`),
    "artifacts/p0/evidence.json",
    "artifacts/p0/governed-catalog.json",
    "artifacts/p0/adapter-diagnostics.json",
    `${FIXTURE_ROOT}/expectations.manifest.json`,
    ...EXPECTATION_ROWS.map((row) => row.fixturePath),
    ...GENERATED_P1_ARTIFACTS
  ];
}

function schemaBase(schemaId) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://surfaces.dev/schemas/p1/${schemaId}.schema.json`,
    title: schemaId,
    schemaId,
    version: VERSION,
    type: "object"
  };
}

function runtimeProjectionSchema() {
  return {
    ...schemaBase("runtime-projection.v0"),
    required: [
      "schemaId",
      "version",
      "adapter",
      "catalogRef",
      "p0EvidenceRef",
      "adapterDiagnosticsRef",
      "components",
      "tokens",
      "runtimeCapabilities",
      "governance",
      "accessibility",
      "provenance",
      "diagnostics"
    ],
    properties: {
      schemaId: { const: "runtime-projection.v0" },
      version: semverSchema(),
      adapter: { const: ADAPTER },
      catalogRef: artifactRefSchema({ sourceEvidenceHash: true }),
      p0EvidenceRef: artifactRefSchema(),
      adapterDiagnosticsRef: artifactRefSchema(),
      components: {
        type: "object",
        required: ["Button", "ConfirmPanel", "StatusCallout"],
        properties: {
          Button: componentProjectionSchema("Button"),
          ConfirmPanel: componentProjectionSchema("ConfirmPanel"),
          StatusCallout: componentProjectionSchema("StatusCallout")
        },
        additionalProperties: false
      },
      tokens: tokenProjectionMapSchema(),
      runtimeCapabilities: { type: "object", additionalProperties: true },
      governance: { type: "object", additionalProperties: true },
      accessibility: { type: "object", additionalProperties: true },
      provenance: provenanceSchema(),
      diagnostics: { type: "array", items: diagnosticObjectSchema() }
    },
    unevaluatedProperties: false
  };
}

function renderPlanSchema() {
  return {
    ...schemaBase("render-plan.v0"),
    required: [
      "schemaId",
      "version",
      "adapter",
      "surfaceRef",
      "projectionRef",
      "promotionStatus",
      "tree",
      "actions",
      "sideEffects",
      "accessibility",
      "tokens",
      "provenance",
      "diagnostics"
    ],
    properties: {
      schemaId: { const: "render-plan.v0" },
      version: semverSchema(),
      adapter: { const: ADAPTER },
      surfaceRef: surfaceRefSchema(),
      projectionRef: artifactRefSchema(),
      promotionStatus: { enum: PROMOTION_STATUSES },
      tree: { $ref: "#/$defs/renderTreeNode" },
      actions: { type: "array", items: renderActionSchema() },
      sideEffects: { type: "array", maxItems: 0 },
      accessibility: { type: "object", additionalProperties: true },
      tokens: tokenProjectionMapSchema(),
      provenance: provenanceSchema(),
      diagnostics: { type: "array", items: diagnosticObjectSchema() }
    },
    $defs: {
      renderTreeNode: renderTreeNodeSchema()
    },
    unevaluatedProperties: false
  };
}

function runtimeAdapterReportSchema() {
  return {
    ...schemaBase("runtime-adapter-report.v0"),
    required: [
      "schemaId",
      "version",
      "adapter",
      "runId",
      "projectionRef",
      "runtimeProjectionRef",
      "fixtureRoot",
      "artifactRoot",
      "results",
      "renderPlans",
      "diagnostics",
      "diagnosticsRegistry",
      "environment",
      "status",
      "promotionStatus"
    ],
    properties: {
      schemaId: { const: "runtime-adapter-report.v0" },
      version: semverSchema(),
      adapter: { const: ADAPTER },
      runId: { type: "string" },
      projectionRef: artifactRefSchema(),
      runtimeProjectionRef: artifactRefSchema(),
      fixtureRoot: { const: FIXTURE_ROOT },
      artifactRoot: { const: ARTIFACT_ROOT },
      results: { type: "array", items: adapterResultSchema() },
      renderPlans: { type: "array", items: renderPlanRefSchema() },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      environment: environmentSchema(),
      provenance: { type: "object", additionalProperties: true },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: PROMOTION_STATUSES }
    },
    unevaluatedProperties: false
  };
}

function runtimeAdapterEvidenceSchema() {
  return {
    ...schemaBase("runtime-adapter-evidence.v0"),
    required: [
      "contractId",
      "schemaId",
      "version",
      "adapter",
      "runId",
      "checkedAt",
      "command",
      "args",
      "environment",
      "boundaryRefs",
      "artifacts",
      "diagnostics",
      "diagnosticsRegistry",
      "validationResults",
      "status",
      "promotionStatus"
    ],
    properties: {
      contractId: { const: "surfaces-p1-runtime-adapter-proof" },
      schemaId: { const: "runtime-adapter-evidence.v0" },
      version: semverSchema(),
      adapter: { const: ADAPTER },
      runId: { type: "string" },
      checkedAt: { const: TIMESTAMP },
      command: { const: "interfacectl surfaces adapter proof" },
      args: {
        type: "object",
        required: ["catalog", "fixture", "out"],
        properties: {
          catalog: { const: "artifacts/p0/governed-catalog.json" },
          fixture: { const: FIXTURE_ROOT },
          out: { const: ARTIFACT_ROOT }
        },
        unevaluatedProperties: false
      },
      environment: environmentSchema(),
      upstream: { type: "object", additionalProperties: true },
      boundaryRefs: { type: "array", items: boundaryRefSchema() },
      artifacts: { type: "array", items: artifactRefSchema({ nullableHash: true, provenance: true }) },
      diagnostics: { type: "array", items: diagnosticObjectSchema() },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      validationResults: { type: "array", items: adapterResultSchema() },
      renderPlanRefs: { type: "array", items: { type: "object", additionalProperties: true } },
      runtimeProjectionRef: artifactRefSchema(),
      runtimeAdapterReportRef: artifactRefSchema(),
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: PROMOTION_STATUSES },
      provenance: { type: "object", additionalProperties: true }
    },
    unevaluatedProperties: false
  };
}

function runtimeAdapterExpectationsSchema() {
  const order = artifactOrder();
  return {
    ...schemaBase("runtime-adapter-expectations.v0"),
    required: [
      "schemaId",
      "version",
      "fixtureRoot",
      "schemaRoot",
      "artifactRoot",
      "runExpectation",
      "diagnosticsRegistry",
      "inheritedDiagnosticCodes",
      "inputs",
      "expectations",
      "artifactOrder"
    ],
    properties: {
      schemaId: { const: "runtime-adapter-expectations.v0" },
      version: semverSchema(),
      fixtureRoot: { const: FIXTURE_ROOT },
      schemaRoot: { const: SCHEMA_ROOT },
      artifactRoot: { const: ARTIFACT_ROOT },
      runExpectation: {
        type: "object",
        required: ["status", "promotionStatus"],
        properties: {
          status: { const: "pass" },
          promotionStatus: { const: "review_required" }
        },
        unevaluatedProperties: false
      },
      diagnosticsRegistry: diagnosticsRegistrySchema(),
      inheritedDiagnosticCodes: {
        type: "array",
        prefixItems: INHERITED_P0_DIAGNOSTIC_CODES.map((code) => ({ const: code })),
        minItems: INHERITED_P0_DIAGNOSTIC_CODES.length,
        maxItems: INHERITED_P0_DIAGNOSTIC_CODES.length
      },
      inputs: {
        type: "array",
        prefixItems: EXPECTATION_ROWS.map((row) => ({ const: row.fixturePath })),
        minItems: EXPECTATION_ROWS.length,
        maxItems: EXPECTATION_ROWS.length
      },
      expectations: {
        type: "array",
        prefixItems: EXPECTATION_ROWS.map(expectationRowSchema),
        minItems: EXPECTATION_ROWS.length,
        maxItems: EXPECTATION_ROWS.length
      },
      artifactOrder: {
        type: "array",
        prefixItems: order.map((artifactPath) => ({ const: artifactPath })),
        minItems: order.length,
        maxItems: order.length
      }
    },
    unevaluatedProperties: false
  };
}

function runtimeAdapterDiagnosticsSchema() {
  return {
    ...schemaBase("runtime-adapter-diagnostics.v0"),
    xDiagnosticsRegistry: diagnosticsRegistry(),
    xInheritedP0DiagnosticCodes: [...INHERITED_P0_DIAGNOSTIC_CODES],
    ...diagnosticObjectSchema()
  };
}

function componentProjectionSchema(id) {
  return {
    type: "object",
    required: ["id", "sourceRef", "props", "variants", "states", "slots", "actions", "events", "dataBindings", "tokenRefs", "accessibility"],
    properties: {
      id: { const: id },
      sourceRef: { type: "string" },
      props: { type: "object", additionalProperties: true },
      variants: { type: "object", additionalProperties: true },
      states: { type: "object", additionalProperties: true },
      slots: { type: "object", additionalProperties: true },
      actions: { type: "object", additionalProperties: true },
      events: { type: "object", additionalProperties: true },
      dataBindings: { type: "object", additionalProperties: true },
      tokenRefs: { type: "object", additionalProperties: { type: "string" } },
      accessibility: { type: "object", additionalProperties: true },
      governance: { type: "object", additionalProperties: true }
    },
    unevaluatedProperties: false
  };
}

function renderTreeNodeSchema() {
  return {
    type: "object",
    required: ["nodeId", "component", "role", "name", "description", "props", "tokens", "children"],
    properties: {
      nodeId: { type: "string" },
      component: { enum: ["Button", "ConfirmPanel", "StatusCallout"] },
      role: { type: "string" },
      name: { anyOf: [{ type: "string" }, { type: "null" }] },
      description: { anyOf: [{ type: "string" }, { type: "null" }] },
      props: { type: "object", additionalProperties: true },
      tokens: tokenProjectionMapSchema(),
      children: { type: "array", items: { $ref: "#/$defs/renderTreeNode" } }
    },
    unevaluatedProperties: false
  };
}

function renderActionSchema() {
  return {
    type: "object",
    required: ["actionId", "kind", "target", "label", "reviewRequired", "disabled", "executed", "sourceRef"],
    properties: {
      actionId: { type: "string" },
      kind: { type: "string" },
      target: { anyOf: [{ type: "string" }, { type: "null" }] },
      label: { type: "string" },
      reviewRequired: { type: "boolean" },
      disabled: { type: "boolean" },
      executed: { const: false },
      sourceRef: { type: "string" }
    },
    unevaluatedProperties: false
  };
}

function tokenProjectionMapSchema() {
  return {
    type: "object",
    additionalProperties: tokenProjectionSchema()
  };
}

function tokenProjectionSchema() {
  return {
    type: "object",
    required: ["value", "cssVariable", "sourceRef"],
    properties: {
      value: true,
      cssVariable: { type: "string", pattern: "^--surfaces-[a-z0-9-]+$" },
      sourceRef: { type: "string" }
    },
    unevaluatedProperties: false
  };
}

function adapterResultSchema() {
  const diagnosticCodes = ALL_DIAGNOSTIC_ROWS.map((row) => row.code).sort();
  return {
    type: "object",
    required: [
      "fixturePath",
      "fixtureKind",
      "expectedStage",
      "actualStage",
      "expectedPhase",
      "actualPhase",
      "expectedValidationResult",
      "actualValidationResult",
      "expectedPromotionStatus",
      "actualPromotionStatus",
      "expectedDiagnosticCodes",
      "actualDiagnosticCodes",
      "matched",
      "artifactPath",
      "jsonPointer",
      "sourceRef",
      "renderPlanPath"
    ],
    properties: {
      fixturePath: { type: "string" },
      fixtureKind: { enum: ["valid", "review", "invalid", "mutation"] },
      expectedStage: { enum: P1_STAGE_ORDER },
      actualStage: { enum: P1_STAGE_ORDER },
      expectedPhase: { enum: P1_PHASES },
      actualPhase: { enum: P1_PHASES },
      expectedValidationResult: { enum: VALIDATION_RESULTS },
      actualValidationResult: { enum: VALIDATION_RESULTS },
      expectedPromotionStatus: { enum: PROMOTION_STATUSES },
      actualPromotionStatus: { enum: PROMOTION_STATUSES },
      expectedDiagnosticCodes: { type: "array", items: { enum: diagnosticCodes } },
      actualDiagnosticCodes: { type: "array", items: { enum: diagnosticCodes } },
      matched: { type: "boolean" },
      artifactPath: { type: "string" },
      jsonPointer: jsonPointerSchema(),
      sourceRef: nullableStringSchema(),
      renderPlanPath: nullableStringSchema()
    },
    unevaluatedProperties: false
  };
}

function renderPlanRefSchema() {
  return {
    type: "object",
    required: ["artifactPath", "surfaceRef", "promotionStatus", "hash", "provenance"],
    properties: {
      artifactPath: { enum: [
        "artifacts/p1/render-plan.confirm-panel.json",
        "artifacts/p1/render-plan.status-callout.json",
        "artifacts/p1/render-plan.button-defaults.json"
      ] },
      surfaceRef: surfaceRefSchema(),
      promotionStatus: { const: "allowed" },
      hashAlgorithm: { const: "sha256" },
      hash: hashSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function surfaceRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "hashAlgorithm", "hash", "sourceRef"],
    properties: {
      path: { type: "string" },
      schemaId: { const: "surface-ir.v0" },
      hashAlgorithm: { const: "sha256" },
      hash: hashSchema(),
      sourceRef: { type: "string" }
    },
    unevaluatedProperties: false
  };
}

function boundaryRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "hashAlgorithm", "hash", "provenance"],
    properties: {
      path: { type: "string" },
      schemaId: { type: "string" },
      hashAlgorithm: { const: "sha256" },
      hash: hashSchema(),
      sourceArtifactHash: hashSchema(),
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function artifactRefSchema(options = {}) {
  const hashValueSchema = options.nullableHash ? { anyOf: [hashSchema(), { type: "null" }] } : hashSchema();
  const properties = {
    role: { type: "string" },
    path: { type: "string" },
    schemaId: { type: "string" },
    hashAlgorithm: { const: "sha256" },
    hash: hashValueSchema
  };
  if (options.sourceEvidenceHash) properties.sourceEvidenceHash = hashSchema();
  if (options.provenance) properties.provenance = provenanceSchema();
  if (options.sourceArtifactHash) properties.sourceArtifactHash = hashSchema();
  const required = ["path", "schemaId", "hashAlgorithm", "hash"];
  if (options.provenance) required.push("provenance");
  return {
    type: "object",
    required: options.sourceEvidenceHash ? [...required, "sourceEvidenceHash"] : required,
    properties,
    unevaluatedProperties: false
  };
}

function diagnosticObjectSchema() {
  return {
    type: "object",
    required: [
      "code",
      "diagnosticSource",
      "severity",
      "message",
      "stage",
      "phase",
      "path",
      "jsonPointer",
      "instanceLocation",
      "keywordLocation",
      "absoluteKeywordLocation",
      "sourceRef",
      "artifactPath",
      "validationResult",
      "promotionStatus",
      "suggestedAction"
    ],
    properties: {
      code: { enum: ALL_DIAGNOSTIC_ROWS.map((row) => row.code).sort() },
      diagnosticSource: { type: "string" },
      schemaOutputFormat: nullableStringSchema(),
      severity: { enum: ["info", "warning", "review", "error"] },
      message: { type: "string" },
      stage: { enum: P1_STAGE_ORDER },
      phase: { enum: P1_PHASES },
      path: jsonPointerSchema(),
      jsonPointer: jsonPointerSchema(),
      instanceLocation: { type: "string" },
      keywordLocation: nullableStringSchema(),
      absoluteKeywordLocation: nullableStringSchema(),
      sourceRef: nullableStringSchema(),
      artifactPath: { type: "string" },
      validationResult: { enum: VALIDATION_RESULTS },
      promotionStatus: { enum: PROMOTION_STATUSES },
      suggestedAction: { type: "string" }
    },
    allOf: ALL_DIAGNOSTIC_ROWS.map((row) => diagnosticRegistryRowConstraint(row)),
    unevaluatedProperties: false
  };
}

function diagnosticRegistryRowConstraint(row) {
  const properties = {
    diagnosticSource: { const: row.diagnosticSource },
    severity: { const: row.severity },
    message: { const: row.canonicalMessage },
    stage: { const: row.stage },
    phase: { const: row.phase },
    validationResult: { const: row.validationResult },
    promotionStatus: { const: row.promotionStatus },
    suggestedAction: { const: row.suggestedAction }
  };
  if (row.dynamicLocation !== true) {
    properties.path = { const: row.jsonPointer };
    properties.jsonPointer = { const: row.jsonPointer };
    properties.sourceRef = row.sourceRef === null ? { type: "null" } : { const: row.sourceRef };
    properties.artifactPath = { const: row.artifactPath };
  }
  return {
    if: {
      properties: { code: { const: row.code } },
      required: ["code"]
    },
    then: { properties }
  };
}

function diagnosticsRegistrySchema() {
  return {
    type: "array",
    prefixItems: ALL_DIAGNOSTIC_ROWS.map(diagnosticRegistryRowSchema),
    minItems: ALL_DIAGNOSTIC_ROWS.length,
    maxItems: ALL_DIAGNOSTIC_ROWS.length
  };
}

function diagnosticRegistryRowSchema(row) {
  return {
    type: "object",
    required: [
      "code",
      "trigger",
      "canonicalMessage",
      "severity",
      "diagnosticSource",
      "stage",
      "phase",
      "artifactPath",
      "jsonPointer",
      "sourceRef",
      "validationResult",
      "promotionStatus",
      "suggestedAction",
      "fixtureCoverage"
    ],
    properties: {
      code: { const: row.code },
      trigger: { const: row.trigger },
      canonicalMessage: { const: row.canonicalMessage },
      severity: { const: row.severity },
      diagnosticSource: { const: row.diagnosticSource },
      stage: { const: row.stage },
      phase: { const: row.phase },
      artifactPath: { const: row.artifactPath },
      jsonPointer: { const: row.jsonPointer },
      sourceRef: row.sourceRef === null ? { type: "null" } : { const: row.sourceRef },
      validationResult: { const: row.validationResult },
      promotionStatus: { const: row.promotionStatus },
      suggestedAction: { const: row.suggestedAction },
      fixtureCoverage: { const: row.fixtureCoverage }
    },
    unevaluatedProperties: false
  };
}

function expectationRowSchema(row) {
  return {
    type: "object",
    required: [
      "fixturePath",
      "fixtureKind",
      "expectedStage",
      "expectedPhase",
      "validationResult",
      "promotionStatus",
      "expectedDiagnosticCodes",
      "expectedArtifactPath",
      "expectedJsonPointer",
      "requiredSourceRef",
      "renderPlanPath"
    ],
    properties: {
      fixturePath: { const: row.fixturePath },
      fixtureKind: { const: row.fixtureKind },
      expectedStage: { const: row.expectedStage },
      expectedPhase: { const: row.expectedPhase },
      validationResult: { const: row.validationResult },
      promotionStatus: { const: row.promotionStatus },
      expectedDiagnosticCodes: exactConstArraySchema(row.expectedDiagnosticCodes),
      expectedArtifactPath: { const: row.expectedArtifactPath },
      expectedJsonPointer: { const: row.expectedJsonPointer },
      requiredSourceRef: row.requiredSourceRef === null ? { type: "null" } : { const: row.requiredSourceRef },
      renderPlanPath: row.renderPlanPath === null ? { type: "null" } : { const: row.renderPlanPath }
    },
    unevaluatedProperties: false
  };
}

function environmentSchema() {
  return {
    type: "object",
    required: Object.keys(environment()),
    properties: {
      golden: { const: true },
      timestampMode: { const: "normalized" },
      timestampOverride: { type: "null" },
      timezone: { const: "UTC" },
      locale: { const: "en-US-POSIX" },
      pathStyle: { const: "posix-relative" },
      jsonCanonicalization: { const: "rfc8785" },
      numberSerialization: { const: "rfc8785" },
      schemaOutputFormat: { const: "basic" },
      host: { type: "null" }
    },
    unevaluatedProperties: false
  };
}

function exactConstArraySchema(values) {
  const schema = {
    type: "array",
    minItems: values.length,
    maxItems: values.length
  };
  if (values.length > 0) {
    schema.prefixItems = values.map((value) => ({ const: value }));
  }
  return schema;
}

function provenanceSchema() {
  return {
    type: "object",
    required: ["sourceUri", "sourceHash", "generatedAt", "sourceRef"],
    properties: {
      sourceUri: { type: "string" },
      sourceHash: { type: "string" },
      generatedAt: { const: TIMESTAMP },
      sourceRef: { type: "string" },
      generator: {
        type: "object",
        required: ["name", "version"],
        properties: {
          name: { type: "string" },
          version: semverSchema()
        },
        unevaluatedProperties: false
      },
      environment: environmentSchema()
    },
    additionalProperties: true
  };
}

function jsonPointerSchema() {
  return { type: "string", pattern: "^(/([^/~]|~0|~1)*)*$" };
}

function nullableStringSchema() {
  return { anyOf: [{ type: "string" }, { type: "null" }] };
}

function hashSchema() {
  return { type: "string", pattern: "^[a-f0-9]{64}$" };
}

function semverSchema() {
  return { type: "string", pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" };
}

function diagnosticRow(row) {
  return Object.freeze({ ...row });
}

function expectationRow(row) {
  return Object.freeze({ ...row });
}

function diagnosticsRegistry() {
  return ALL_DIAGNOSTIC_ROWS.map((row) => ({
    code: row.code,
    trigger: row.trigger,
    canonicalMessage: row.canonicalMessage,
    severity: row.severity,
    diagnosticSource: row.diagnosticSource,
    stage: row.stage,
    phase: row.phase,
    artifactPath: row.artifactPath,
    jsonPointer: row.jsonPointer,
    sourceRef: row.sourceRef,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction,
    fixtureCoverage: row.fixtureCoverage
  }));
}

function environment() {
  return {
    golden: true,
    timestampMode: "normalized",
    timestampOverride: null,
    timezone: "UTC",
    locale: "en-US-POSIX",
    pathStyle: "posix-relative",
    jsonCanonicalization: "rfc8785",
    numberSerialization: "rfc8785",
    schemaOutputFormat: "basic",
    host: null
  };
}

function confirmPanelSurface(kind, slug, options = {}) {
  const uri = `fixture://p1/${kind}/${slug}`;
  const rootProps = {
    body: "This removes the archived item from the workspace.",
    heading: "Delete archive item?",
    ...(options.rootProps ?? {})
  };
  const rootAccessibility = {
    descriptionFrom: "body",
    modal: false,
    nameFrom: "heading",
    role: "group",
    ...(options.rootAccessibility ?? {})
  };
  return surfaceFixture({
    uri,
    root: {
      accessibility: rootAccessibility,
      actions: {
        cancel: actionUse(`${uri}#/root/actions/cancel`, false),
        confirm: actionUse(`${uri}#/root/actions/confirm`, options.rootConfirmExecute === true)
      },
      component: options.rootComponent ?? "ConfirmPanel",
      dataBindings: { itemName: "selectedItem.name" },
      events: {
        cancel: eventUse(`${uri}#/root/events/cancel`),
        confirm: eventUse(`${uri}#/root/events/confirm`)
      },
      id: "confirm1",
      props: rootProps,
      slots: {
        body: [],
        heading: [],
        primaryAction: ["primaryAction"],
        secondaryAction: ["secondaryAction"],
        supportingContent: ["callout1"]
      },
      sourceRef: `${uri}#/root`,
      state: "default",
      tokenRefs: {
        radius: "radius.md",
        shadow: "shadow.raised",
        spacing: "spacing.base.lg",
        surface: "color.surface.panel"
      },
      variant: "standard"
    },
    instances: {
      callout1: statusCalloutNode("callout1", uri, "instances/callout1", {
        props: {
          body: "This action affects archived workspace data.",
          dismissible: false,
          status: "warning",
          title: "Review the impact"
        },
        variant: "warning",
        accessibility: {
          descriptionFrom: "body",
          liveRegion: "assertive",
          nameFrom: "title",
          role: "alert"
        }
      }),
      primaryAction: buttonNode("primaryAction", uri, "instances/primaryAction", {
        props: {
          disabled: false,
          icon: "",
          label: "Delete",
          loading: false,
          size: "md",
          variant: "danger"
        },
        variant: "danger"
      }),
      secondaryAction: buttonNode("secondaryAction", uri, "instances/secondaryAction", {
        dismissExecute: options.secondaryDismissExecute === true,
        props: {
          disabled: false,
          icon: "",
          label: "Cancel",
          loading: false,
          size: "md",
          variant: "secondary",
          ...(options.secondaryActionProps ?? {})
        },
        variant: "secondary"
      })
    },
    bindings: {
      selectedItem: {
        source: "fixture-data",
        sourceRef: `${uri}#/bindings/selectedItem`
      }
    }
  });
}

function statusCalloutSurface(kind, slug) {
  const uri = `fixture://p1/${kind}/${slug}`;
  return surfaceFixture({
    uri,
    root: statusCalloutNode("statusCallout", uri, "root", {
      props: {
        body: "P1 runtime projection is current and evidence-bound.",
        dismissible: false,
        status: "info",
        title: "Projection ready"
      },
      variant: "info",
      accessibility: {
        descriptionFrom: "body",
        liveRegion: "polite",
        nameFrom: "title",
        role: "status"
      }
    }),
    instances: {},
    bindings: {}
  });
}

function buttonDefaultsSurface(kind, slug) {
  const uri = `fixture://p1/${kind}/${slug}`;
  return surfaceFixture({
    uri,
    root: buttonNode("buttonDefaults", uri, "root", {
      props: {
        label: "Continue",
        variant: "primary"
      },
      variant: "primary"
    }),
    instances: {},
    bindings: {}
  });
}

function unknownActionSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-action");
  surface.root.actions.escalate = actionUse("fixture://p1/invalid/unknown-action#/root/actions/escalate", false);
  return surface;
}

function unknownEventSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-event");
  surface.root.events.escalated = eventUse("fixture://p1/invalid/unknown-event#/root/events/escalated");
  return surface;
}

function unknownSlotSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-slot");
  surface.root.slots.footer = [];
  return surface;
}

function unknownTokenKeySurface() {
  const surface = confirmPanelSurface("invalid", "unknown-token-key");
  surface.root.tokenRefs.accent = "color.brand.primary";
  return surface;
}

function unknownTokenRefSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-token-ref");
  surface.root.tokenRefs.surface = "color.surface.missing";
  return surface;
}

function unknownDataBindingSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-data-binding");
  surface.root.dataBindings.userId = "selectedItem.userId";
  return surface;
}

function unknownVariantSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-variant");
  surface.root.variant = "expanded";
  return surface;
}

function unknownStateSurface() {
  const surface = confirmPanelSurface("invalid", "unknown-state");
  surface.root.state = "expanded";
  return surface;
}

function surfaceFixture({ uri, root, instances, bindings }) {
  return {
    schemaId: "surface-ir.v0",
    version: VERSION,
    bindings,
    root,
    instances,
    provenance: {
      sourceUri: uri,
      sourceHash: "sha256:surface-ir-fixture",
      generatedAt: TIMESTAMP,
      sourceRef: `${uri}#/provenance`
    }
  };
}

function buttonNode(id, uri, pointer, options = {}) {
  return {
    accessibility: {
      activationKeys: ["Enter", "Space"],
      disabledBlocksActivation: true,
      focusable: true,
      focusableWhenDisabled: false,
      nameFrom: "label",
      role: "button"
    },
    actions: {
      dismiss: actionUse(`${uri}#/${pointer}/actions/dismiss`, options.dismissExecute === true),
      submit: actionUse(`${uri}#/${pointer}/actions/submit`, false)
    },
    component: "Button",
    dataBindings: { label: `${id}.label` },
    events: {
      click: eventUse(`${uri}#/${pointer}/events/click`)
    },
    id,
    props: options.props ?? {
      disabled: false,
      icon: "",
      label: "Continue",
      loading: false,
      size: "md",
      variant: "primary"
    },
    slots: {},
    sourceRef: `${uri}#/${pointer}`,
    state: "default",
    tokenRefs: {
      background: options.variant === "danger" ? "color.action.dangerBg" : "color.action.primaryBg",
      radius: "radius.sm",
      spacing: "spacing.base.md",
      text: "color.text.inverse"
    },
    variant: options.variant ?? "primary"
  };
}

function statusCalloutNode(id, uri, pointer, options) {
  return {
    accessibility: options.accessibility,
    actions: {
      dismiss: actionUse(`${uri}#/${pointer}/actions/dismiss`, false)
    },
    component: "StatusCallout",
    dataBindings: { message: `${id}.message` },
    events: {
      dismiss: eventUse(`${uri}#/${pointer}/events/dismiss`)
    },
    id,
    props: options.props,
    slots: { action: [] },
    sourceRef: `${uri}#/${pointer}`,
    state: "default",
    tokenRefs: {
      background: "color.surface.calloutInfo",
      spacing: "spacing.base.md",
      text: "color.text.primary"
    },
    variant: options.variant
  };
}

function actionUse(sourceRef, execute) {
  return {
    execute,
    payload: {},
    sourceRef
  };
}

function eventUse(sourceRef) {
  return {
    payload: {},
    sourceRef
  };
}

function mutationMissingCatalogRef() {
  const projection = runtimeProjectionFixture();
  delete projection.catalogRef;
  return projection;
}

function mutationCatalogHashMismatch() {
  const projection = runtimeProjectionFixture();
  projection.catalogRef = {
    ...projection.catalogRef,
    hash: ONE_HASH
  };
  return projection;
}

function mutationProjectionAuthorityEscalation() {
  const projection = runtimeProjectionFixture();
  projection.components.ConfirmPanel.actions.escalate = {
    id: "escalate",
    kind: "event",
    allowedTargets: ["external-workflow"],
    destructive: true,
    requiresReview: false,
    disabledUntilImplemented: false,
    sourceRef: "fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate"
  };
  return projection;
}

function mutationMissingRenderPlanProvenance() {
  const plan = renderPlanFixture();
  delete plan.provenance;
  return plan;
}

function mutationRuntimeProjectionHashMismatch() {
  const runtimeProjectionRef = ref("artifacts/p1/runtime-projection.json", "runtime-projection.v0", BAD_HASH);
  return {
    schemaId: "runtime-adapter-report.v0",
    version: VERSION,
    adapter: ADAPTER,
    runId: "p1-runtime-projection-hash-mismatch",
    projectionRef: runtimeProjectionRef,
    runtimeProjectionRef,
    fixtureRoot: FIXTURE_ROOT,
    artifactRoot: ARTIFACT_ROOT,
    results: [],
    renderPlans: [],
    diagnostics: [
      diagnosticForRow(P1_DIAGNOSTIC_ROWS.find((row) => row.code === "RUNTIME_PROJECTION_HASH_MISMATCH"))
    ],
    diagnosticsRegistry: diagnosticsRegistry(),
    environment: environment(),
    status: "fail",
    promotionStatus: "blocked"
  };
}

function mutationHashMismatchEvidence() {
  return {
    schemaId: "runtime-adapter-evidence.v0",
    version: VERSION,
    adapter: ADAPTER,
    runId: "p1-evidence-hash-mismatch",
    generatedAt: TIMESTAMP,
    command: "interfacectl surfaces adapter proof",
    args: {
      catalog: "artifacts/p0/governed-catalog.json",
      fixture: FIXTURE_ROOT,
      out: ARTIFACT_ROOT
    },
    environment: environment(),
    boundaryRefs: [],
    schemaRefs: [],
    fixtureRefs: [],
    artifacts: [
      ref("artifacts/p1/runtime-projection.json", "runtime-projection.v0", BAD_HASH)
    ],
    diagnostics: [
      diagnosticForRow(P1_DIAGNOSTIC_ROWS.find((row) => row.code === "RUNTIME_EVIDENCE_HASH_MISMATCH"))
    ],
    diagnosticsRegistry: diagnosticsRegistry(),
    results: [],
    status: "fail",
    promotionStatus: "blocked",
    selfHash: ZERO_HASH
  };
}

function runtimeProjectionFixture() {
  return {
    schemaId: "runtime-projection.v0",
    version: VERSION,
    adapter: ADAPTER,
    catalogRef: {
      ...ref("artifacts/p0/governed-catalog.json", "runtime-catalog.v0", ZERO_HASH),
      sourceEvidenceHash: ZERO_HASH
    },
    p0EvidenceRef: ref("artifacts/p0/evidence.json", "evidence.v0", ZERO_HASH),
    adapterDiagnosticsRef: ref("artifacts/p0/adapter-diagnostics.json", "adapter-diagnostics.v0", ZERO_HASH),
    components: {
      Button: projectedButton(),
      ConfirmPanel: projectedConfirmPanel(),
      StatusCallout: projectedStatusCallout()
    },
    tokens: projectedTokens(),
    runtimeCapabilities: {
      adapter: ADAPTER,
      actionExecution: false,
      sideEffects: false,
      supportsModal: false,
      cssProperties: [
        "display",
        "box-sizing",
        "margin",
        "padding",
        "border",
        "border-radius",
        "background",
        "color",
        "font",
        "font-size",
        "font-weight",
        "line-height",
        "gap",
        "width",
        "max-width",
        "min-height",
        "align-items",
        "justify-content",
        "outline"
      ]
    },
    governance: {
      sourceRef: "fixture://p0/source#/components/ConfirmPanel/governance",
      promotionStatuses: PROMOTION_STATUSES,
      reviewRequiredActions: ["ConfirmPanel.confirm"],
      blockedCapabilities: ["action-execution", "modal"]
    },
    accessibility: {
      roles: ["alert", "button", "group", "status"],
      modalSupported: false,
      liveRegions: ["polite", "assertive"]
    },
    provenance: {
      sourceUri: "artifacts/p0/governed-catalog.json",
      sourceHash: ZERO_HASH,
      generatedAt: TIMESTAMP,
      sourceRef: "artifact://p0/governed-catalog",
      generator: {
        name: "materialize-p1",
        version: VERSION
      },
      environment: environment()
    },
    diagnostics: []
  };
}

function renderPlanFixture() {
  const tokens = projectedTokens();
  return {
    schemaId: "render-plan.v0",
    version: VERSION,
    adapter: ADAPTER,
    surfaceRef: {
      ...ref("fixtures/p1/valid/confirm-panel.surface-ir.json", "surface-ir.v0", ZERO_HASH),
      sourceRef: "fixture://p1/valid/confirm-panel#/root"
    },
    projectionRef: ref("artifacts/p1/runtime-projection.json", "runtime-projection.v0", ZERO_HASH),
    promotionStatus: "allowed",
    tree: {
      nodeId: "confirm1",
      component: "ConfirmPanel",
      role: "group",
      name: "Delete archive item?",
      description: "This removes the archived item from the workspace.",
      props: {
        body: "This removes the archived item from the workspace.",
        heading: "Delete archive item?"
      },
      tokens: {
        radius: tokens["radius.md"],
        shadow: tokens["shadow.raised"],
        spacing: tokens["spacing.base.lg"],
        surface: tokens["color.surface.panel"]
      },
      children: []
    },
    actions: [
      {
        actionId: "confirm",
        kind: "event",
        target: null,
        label: "Delete",
        reviewRequired: true,
        disabled: false,
        executed: false,
        sourceRef: "fixture://p1/valid/confirm-panel#/root/actions/confirm"
      }
    ],
    sideEffects: [],
    accessibility: {
      role: "group",
      name: "Delete archive item?",
      description: "This removes the archived item from the workspace."
    },
    tokens: {
      "color.surface.panel": tokens["color.surface.panel"],
      "radius.md": tokens["radius.md"],
      "shadow.raised": tokens["shadow.raised"],
      "spacing.base.lg": tokens["spacing.base.lg"]
    },
    provenance: {
      sourceUri: "fixtures/p1/valid/confirm-panel.surface-ir.json",
      sourceHash: ZERO_HASH,
      generatedAt: TIMESTAMP,
      sourceRef: "fixture://p1/valid/confirm-panel#/root",
      generator: {
        name: "materialize-p1",
        version: VERSION
      },
      environment: environment()
    },
    diagnostics: []
  };
}

function projectedButton() {
  return {
    id: "Button",
    sourceRef: "fixture://p0/source#/components/Button",
    props: {
      label: { type: "string", required: true, minLength: 1, maxLength: 80 },
      variant: { type: "string", required: true, default: "primary", allowedValues: ["primary", "secondary", "danger"] },
      size: { type: "string", required: false, default: "md", allowedValues: ["sm", "md", "lg"] },
      disabled: { type: "boolean", required: false, default: false },
      icon: { type: "string", required: false, default: "", maxLength: 40 },
      loading: { type: "boolean", required: false, default: false }
    },
    variants: { primary: {}, secondary: {}, danger: {} },
    states: { default: {}, hover: {}, focus: {}, disabled: {}, loading: {} },
    slots: {},
    actions: {
      submit: projectedAction("submit", false, false, false, "fixture://p0/source#/components/Button/actions/submit"),
      dismiss: projectedAction("dismiss", false, false, true, "fixture://p0/source#/components/Button/actions/dismiss")
    },
    events: { click: { id: "click", sourceRef: "fixture://p0/source#/components/Button/events/click" } },
    dataBindings: { label: { type: "string", sourceRef: "fixture://p0/source#/components/Button/dataBindings/label" } },
    tokenRefs: {
      background: "color.action.primaryBg",
      text: "color.text.inverse",
      radius: "radius.sm",
      spacing: "spacing.base.md"
    },
    accessibility: {
      role: "button",
      nameFrom: ["props.label", "props.icon"],
      activationKeys: ["Enter", "Space"],
      disabledBlocksActivation: true,
      focusableUnlessDisabled: true,
      sourceRef: "fixture://p0/source#/components/Button/accessibility"
    }
  };
}

function projectedStatusCallout() {
  return {
    id: "StatusCallout",
    sourceRef: "fixture://p0/source#/components/StatusCallout",
    props: {
      title: { type: "string", required: true, minLength: 1, maxLength: 80 },
      body: { type: "string", required: true, minLength: 1, maxLength: 240 },
      status: { type: "string", required: true, default: "info", allowedValues: ["info", "success", "warning", "critical"] },
      dismissible: { type: "boolean", required: false, default: false }
    },
    variants: { info: {}, success: {}, warning: {}, critical: {} },
    states: { default: {} },
    slots: {
      action: { kind: "action", required: false, allowedComponents: ["Button"], maxItems: 1 }
    },
    actions: {
      dismiss: projectedAction("dismiss", false, false, false, "fixture://p0/source#/components/StatusCallout/actions/dismiss")
    },
    events: { dismiss: { id: "dismiss", sourceRef: "fixture://p0/source#/components/StatusCallout/events/dismiss" } },
    dataBindings: { message: { type: "string", sourceRef: "fixture://p0/source#/components/StatusCallout/dataBindings/message" } },
    tokenRefs: {
      background: "color.surface.calloutInfo",
      text: "color.text.primary",
      spacing: "spacing.base.md"
    },
    accessibility: {
      roleByStatus: { info: "status", success: "status", warning: "alert", critical: "alert" },
      liveRegionByStatus: { info: "polite", success: "polite", warning: "assertive", critical: "assertive" },
      sourceRef: "fixture://p0/source#/components/StatusCallout/accessibility"
    }
  };
}

function projectedConfirmPanel() {
  return {
    id: "ConfirmPanel",
    sourceRef: "fixture://p0/source#/components/ConfirmPanel",
    props: {
      heading: { type: "string", required: true, minLength: 1, maxLength: 100 },
      body: { type: "string", required: true, minLength: 1, maxLength: 320 }
    },
    variants: { standard: {} },
    states: { default: {} },
    slots: {
      heading: { kind: "text", required: false, allowedComponents: [], maxItems: 0 },
      body: { kind: "text", required: false, allowedComponents: [], maxItems: 0 },
      primaryAction: { kind: "action", required: true, allowedComponents: ["Button"], maxItems: 1 },
      secondaryAction: { kind: "action", required: true, allowedComponents: ["Button"], maxItems: 1 },
      supportingContent: { kind: "content", required: false, allowedComponents: ["StatusCallout"], maxItems: 1 }
    },
    actions: {
      confirm: projectedAction("confirm", true, true, false, "fixture://p0/source#/components/ConfirmPanel/actions/confirm"),
      cancel: projectedAction("cancel", false, false, false, "fixture://p0/source#/components/ConfirmPanel/actions/cancel")
    },
    events: {
      confirm: { id: "confirm", sourceRef: "fixture://p0/source#/components/ConfirmPanel/events/confirm" },
      cancel: { id: "cancel", sourceRef: "fixture://p0/source#/components/ConfirmPanel/events/cancel" }
    },
    dataBindings: { itemName: { type: "string", sourceRef: "fixture://p0/source#/components/ConfirmPanel/dataBindings/itemName" } },
    tokenRefs: {
      surface: "color.surface.panel",
      shadow: "shadow.raised",
      radius: "radius.md",
      spacing: "spacing.base.lg"
    },
    accessibility: {
      role: "group",
      nameFrom: "props.heading",
      descriptionFrom: "props.body",
      modalSupported: false,
      sourceRef: "fixture://p0/source#/components/ConfirmPanel/accessibility"
    },
    governance: {
      destructivePrimaryAction: {
        action: "confirm",
        promotionStatus: "review_required",
        sourceRef: "fixture://p0/source#/components/ConfirmPanel/governance/destructivePrimaryAction"
      }
    }
  };
}

function projectedAction(id, destructive, requiresReview, disabledUntilImplemented, sourceRef) {
  return {
    id,
    kind: "event",
    allowedTargets: [],
    destructive,
    requiresReview,
    disabledUntilImplemented,
    sourceRef
  };
}

function projectedTokens() {
  return {
    "color.action.dangerBg": { value: "#C1121F", cssVariable: "--surfaces-color-action-danger-bg", sourceRef: "fixture://p0/source#/tokens/color/action/dangerBg" },
    "color.action.primaryBg": { value: "#0B5FFF", cssVariable: "--surfaces-color-action-primary-bg", sourceRef: "fixture://p0/source#/tokens/color/action/primaryBg" },
    "color.brand.danger": { value: "#C1121F", cssVariable: "--surfaces-color-brand-danger", sourceRef: "fixture://p0/source#/tokens/color/brand/danger" },
    "color.brand.primary": { value: "#0B5FFF", cssVariable: "--surfaces-color-brand-primary", sourceRef: "fixture://p0/source#/tokens/color/brand/primary" },
    "color.surface.calloutInfo": { value: "#E8F2FF", cssVariable: "--surfaces-color-surface-callout-info", sourceRef: "fixture://p0/source#/tokens/color/surface/calloutInfo" },
    "color.surface.panel": { value: "#FFFFFF", cssVariable: "--surfaces-color-surface-panel", sourceRef: "fixture://p0/source#/tokens/color/surface/panel" },
    "color.text.inverse": { value: "#FFFFFF", cssVariable: "--surfaces-color-text-inverse", sourceRef: "fixture://p0/source#/tokens/color/text/inverse" },
    "color.text.primary": { value: "#101828", cssVariable: "--surfaces-color-text-primary", sourceRef: "fixture://p0/source#/tokens/color/text/primary" },
    "motion.fast": { value: "120ms", cssVariable: "--surfaces-motion-fast", sourceRef: "fixture://p0/source#/tokens/motion/fast" },
    "radius.md": { value: 8, cssVariable: "--surfaces-radius-md", sourceRef: "fixture://p0/source#/tokens/radius/md" },
    "radius.sm": { value: 4, cssVariable: "--surfaces-radius-sm", sourceRef: "fixture://p0/source#/tokens/radius/sm" },
    "shadow.raised": {
      value: { blur: 18, color: "rgba(16,24,40,0.18)", offsetX: 0, offsetY: 6, spread: 0 },
      cssVariable: "--surfaces-shadow-raised",
      sourceRef: "fixture://p0/source#/tokens/shadow/raised"
    },
    "spacing.base.lg": { value: 16, cssVariable: "--surfaces-spacing-base-lg", sourceRef: "fixture://p0/source#/tokens/spacing/base/lg" },
    "spacing.base.md": { value: 12, cssVariable: "--surfaces-spacing-base-md", sourceRef: "fixture://p0/source#/tokens/spacing/base/md" },
    "spacing.base.sm": { value: 8, cssVariable: "--surfaces-spacing-base-sm", sourceRef: "fixture://p0/source#/tokens/spacing/base/sm" },
    "spacing.compact.lg": { value: 16, cssVariable: "--surfaces-spacing-compact-lg", sourceRef: "fixture://p0/source#/tokens/spacing/base/lg" },
    "spacing.compact.md": { value: 12, cssVariable: "--surfaces-spacing-compact-md", sourceRef: "fixture://p0/source#/tokens/spacing/base/md" },
    "spacing.compact.sm": { value: 8, cssVariable: "--surfaces-spacing-compact-sm", sourceRef: "fixture://p0/source#/tokens/spacing/base/sm" },
    "spacing.compact.xs": { value: 4, cssVariable: "--surfaces-spacing-compact-xs", sourceRef: "fixture://p0/source#/tokens/spacing/compact/xs" },
    "typography.body": {
      value: { fontFamily: "Inter", fontSize: 14, fontWeight: 400, lineHeight: 20 },
      cssVariable: "--surfaces-typography-body",
      sourceRef: "fixture://p0/source#/tokens/typography/body"
    },
    "typography.heading": {
      value: { fontFamily: "Inter", fontSize: 20, fontWeight: 700, lineHeight: 28 },
      cssVariable: "--surfaces-typography-heading",
      sourceRef: "fixture://p0/source#/tokens/typography/heading"
    }
  };
}

function diagnosticForRow(row) {
  return {
    code: row.code,
    diagnosticSource: row.diagnosticSource,
    severity: row.severity,
    message: row.canonicalMessage,
    stage: row.stage,
    phase: row.phase,
    path: row.jsonPointer,
    jsonPointer: row.jsonPointer,
    instanceLocation: row.jsonPointer,
    keywordLocation: null,
    absoluteKeywordLocation: null,
    sourceRef: row.sourceRef,
    artifactPath: row.artifactPath,
    validationResult: row.validationResult,
    promotionStatus: row.promotionStatus,
    suggestedAction: row.suggestedAction
  };
}

function ref(artifactPath, schemaId, hash = ZERO_HASH) {
  return {
    path: artifactPath,
    schemaId,
    hashAlgorithm: "sha256",
    hash
  };
}
