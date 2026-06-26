import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";

const TIMESTAMP = "1970-01-01T00:00:00.000Z";
const VERSION = "0.0.0";
const CONTRACT_ID = "surfaces-p0-proof";
const CATALOG_ID = "surfaces-p0";
const SCHEMA_ROOT = "schemas";
const FIXTURE_ROOT = "fixtures/p0";
const ARTIFACT_ROOT = "artifacts/p0";
const P0_PATH_ROOTS = [SCHEMA_ROOT, FIXTURE_ROOT, ARTIFACT_ROOT];
const GENERATED_ARTIFACTS = [
  "extract.json",
  "catalog.json",
  "governed-catalog.json",
  "adapter-diagnostics.json",
  "evidence.json"
];
const STAGE_ORDER = new Map([
  ["extract", 0],
  ["compile", 1],
  ["govern", 2],
  ["validate", 3],
  ["adapter-conformance", 4],
  ["evidence", 5]
]);

const SOURCE_MUTATIONS = [
  "missing-required-field.source.fixture.json",
  "missing-source-ref.source.fixture.json",
  "unresolved-token-alias.source.fixture.json",
  "unresolved-json-pointer-ref.source.fixture.json",
  "unresolved-extends-target.source.fixture.json",
  "circular-token-alias.source.fixture.json",
  "circular-json-pointer-ref.source.fixture.json",
  "circular-extends.source.fixture.json",
  "invalid-extends-target-type.source.fixture.json",
  "composite-missing-subvalue.source.fixture.json",
  "composite-extra-subvalue.source.fixture.json",
  "composite-incompatible-subvalue.source.fixture.json",
  "duplicate-component-id.source.fixture.json",
  "missing-provenance.extract.json",
  "hash-mismatch.evidence.json"
];

const INVALID_FIXTURES = [
  "unknown-component.json",
  "unknown-prop.json",
  "unknown-variant.json",
  "unknown-state.json",
  "unknown-slot.json",
  "unknown-action.json",
  "unknown-event.json",
  "unknown-data-binding.json",
  "unknown-token-ref.json",
  "extra-property.json",
  "invalid-prop-type.json",
  "invalid-enum-value.json",
  "invalid-string-bounds.json",
  "missing-required-prop.json",
  "unsafe-markup.json",
  "illegal-slot-child.json",
  "slot-max-items.json",
  "disabled-action-execution.json",
  "invalid-a11y.json",
  "invalid-keyboard-contract.json",
  "invalid-focus-contract.json",
  "invalid-live-region.json",
  "modal-role-not-supported.json"
];

const SCHEMA_FILES = [
  "runtime-catalog.v0.schema.json",
  "surface-ir.v0.schema.json",
  "fixture-expectations.v0.schema.json",
  "extract.v0.schema.json",
  "adapter-diagnostics.v0.schema.json",
  "evidence.v0.schema.json",
  "diagnostics.v0.schema.json"
];

const SCHEMA_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*\.v[0-9]+\.schema\.json$/;

const SCHEMA_IDS = {
  "runtime-catalog.v0.schema.json": "runtime-catalog.v0",
  "surface-ir.v0.schema.json": "surface-ir.v0",
  "fixture-expectations.v0.schema.json": "fixture-expectations.v0",
  "extract.v0.schema.json": "extract.v0",
  "adapter-diagnostics.v0.schema.json": "adapter-diagnostics.v0",
  "evidence.v0.schema.json": "evidence.v0",
  "diagnostics.v0.schema.json": "diagnostics.v0"
};

const ENVIRONMENT = Object.freeze({
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
});

const REGISTRY_ROWS = [
  row({
    code: "SCHEMA_VALIDATION_FAILED",
    trigger: "JSON Schema validation fails for any checked artifact",
    message: "Schema validation failed for the checked artifact.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "checked artifact",
    pointer: "/",
    sourceRef: null,
    coverage: "manifest-wide"
  }),
  row({
    code: "EXTRACT_REQUIRED_FIELD_MISSING",
    trigger: "Required source fixture field is absent",
    message: "Required source fixture field is missing.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/missing-required-field.source.fixture.json",
    pointer: "/fixtureId",
    sourceRef: "fixture://p0/source#/fixtureId",
    coverage: "mutations/missing-required-field.source.fixture.json"
  }),
  row({
    code: "EXTRACT_SOURCE_REF_MISSING",
    trigger: "Source ref is absent or invalid",
    message: "Source reference is missing or invalid.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/missing-source-ref.source.fixture.json",
    pointer: "/components/0/sourceRef",
    sourceRef: null,
    coverage: "mutations/missing-source-ref.source.fixture.json"
  }),
  row({
    code: "TOKEN_REFERENCE_UNRESOLVED",
    trigger: "Token alias target cannot be resolved",
    message: "Token alias target cannot be resolved.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/unresolved-token-alias.source.fixture.json",
    pointer: "/tokens/color/action/brokenAlias/$value",
    sourceRef: "fixture://p0/source#/tokens/color/action/brokenAlias",
    coverage: "mutations/unresolved-token-alias.source.fixture.json"
  }),
  row({
    code: "TOKEN_REFERENCE_UNRESOLVED",
    trigger: "JSON Pointer $ref target cannot be resolved",
    message: "JSON Pointer reference target cannot be resolved.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/unresolved-json-pointer-ref.source.fixture.json",
    pointer: "/tokens/color/action/brokenPointer/$ref",
    sourceRef: "fixture://p0/source#/tokens/color/action/brokenPointer",
    coverage: "mutations/unresolved-json-pointer-ref.source.fixture.json"
  }),
  row({
    code: "TOKEN_REFERENCE_UNRESOLVED",
    trigger: "$extends target cannot be resolved",
    message: "Token group extends target cannot be resolved.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/unresolved-extends-target.source.fixture.json",
    pointer: "/tokens/spacing/compact/$extends",
    sourceRef: "fixture://p0/source#/tokens/spacing/compact",
    coverage: "mutations/unresolved-extends-target.source.fixture.json"
  }),
  row({
    code: "TOKEN_REFERENCE_CIRCULAR",
    trigger: "Token alias resolution creates a cycle",
    message: "Token alias resolution contains a cycle.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/circular-token-alias.source.fixture.json",
    pointer: "/tokens/color/cycle/a/$value",
    sourceRef: "fixture://p0/source#/tokens/color/cycle/a",
    coverage: "mutations/circular-token-alias.source.fixture.json"
  }),
  row({
    code: "TOKEN_REFERENCE_CIRCULAR",
    trigger: "JSON Pointer $ref resolution creates a cycle",
    message: "JSON Pointer reference resolution contains a cycle.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/circular-json-pointer-ref.source.fixture.json",
    pointer: "/tokens/color/pointerCycle/a/$ref",
    sourceRef: "fixture://p0/source#/tokens/color/pointerCycle/a",
    coverage: "mutations/circular-json-pointer-ref.source.fixture.json"
  }),
  row({
    code: "TOKEN_REFERENCE_CIRCULAR",
    trigger: "$extends resolution creates a cycle",
    message: "Token group extends resolution contains a cycle.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/circular-extends.source.fixture.json",
    pointer: "/tokens/spacing/cycleA/$extends",
    sourceRef: "fixture://p0/source#/tokens/spacing/cycleA",
    coverage: "mutations/circular-extends.source.fixture.json"
  }),
  row({
    code: "TOKEN_EXTENDS_INVALID",
    trigger: "$extends resolves to a token, non-group, or non-object target",
    message: "Token group extends target must resolve to a group object.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/invalid-extends-target-type.source.fixture.json",
    pointer: "/tokens/spacing/compact/$extends",
    sourceRef: "fixture://p0/source#/tokens/spacing/compact",
    coverage: "mutations/invalid-extends-target-type.source.fixture.json"
  }),
  row({
    code: "TOKEN_COMPOSITE_INVALID",
    trigger: "Composite token is missing a required sub-value",
    message: "Composite token is missing a required sub-value.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/composite-missing-subvalue.source.fixture.json",
    pointer: "/tokens/typography/heading/$value/lineHeight",
    sourceRef: "fixture://p0/source#/tokens/typography/heading",
    coverage: "mutations/composite-missing-subvalue.source.fixture.json"
  }),
  row({
    code: "TOKEN_COMPOSITE_INVALID",
    trigger: "Composite token contains an extra sub-value not allowed by its token type",
    message: "Composite token contains an unsupported extra sub-value.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/composite-extra-subvalue.source.fixture.json",
    pointer: "/tokens/shadow/raised/$value/opacity",
    sourceRef: "fixture://p0/source#/tokens/shadow/raised",
    coverage: "mutations/composite-extra-subvalue.source.fixture.json"
  }),
  row({
    code: "TOKEN_COMPOSITE_INVALID",
    trigger: "Composite token contains an incompatible typed sub-value",
    message: "Composite token contains an incompatible sub-value type.",
    stage: "extract",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/composite-incompatible-subvalue.source.fixture.json",
    pointer: "/tokens/shadow/raised/$value/blur",
    sourceRef: "fixture://p0/source#/tokens/shadow/raised",
    coverage: "mutations/composite-incompatible-subvalue.source.fixture.json"
  }),
  row({
    code: "CATALOG_DUPLICATE_ID",
    trigger: "Duplicate component id",
    message: "Catalog contains a duplicate component id.",
    stage: "compile",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/duplicate-component-id.source.fixture.json",
    pointer: "/components/3/id",
    sourceRef: "fixture://p0/source#/components/3",
    coverage: "mutations/duplicate-component-id.source.fixture.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_COMPONENT",
    trigger: "Surface IR references an unknown component",
    message: "Surface IR references an unknown component.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-component.json",
    pointer: "/root/component",
    sourceRef: "fixture://p0/invalid/unknown-component#/root",
    coverage: "invalid/unknown-component.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_PROP",
    trigger: "Surface IR references an unknown prop",
    message: "Surface IR references an unknown prop.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-prop.json",
    pointer: "/root/props/eyebrow",
    sourceRef: "fixture://p0/invalid/unknown-prop#/root/props/eyebrow",
    coverage: "invalid/unknown-prop.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_VARIANT",
    trigger: "Surface IR references an unknown variant",
    message: "Surface IR references an unknown variant.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-variant.json",
    pointer: "/root/variant",
    sourceRef: "fixture://p0/invalid/unknown-variant#/root/variant",
    coverage: "invalid/unknown-variant.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_STATE",
    trigger: "Surface IR references an unknown state",
    message: "Surface IR references an unknown state.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-state.json",
    pointer: "/root/state",
    sourceRef: "fixture://p0/invalid/unknown-state#/root/state",
    coverage: "invalid/unknown-state.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_SLOT",
    trigger: "Surface IR references an unknown slot",
    message: "Surface IR references an unknown slot.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-slot.json",
    pointer: "/root/slots/footer",
    sourceRef: "fixture://p0/invalid/unknown-slot#/root/slots/footer",
    coverage: "invalid/unknown-slot.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_ACTION",
    trigger: "Surface IR references an unknown action",
    message: "Surface IR references an unknown action.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-action.json",
    pointer: "/root/actions/escalate",
    sourceRef: "fixture://p0/invalid/unknown-action#/root/actions/escalate",
    coverage: "invalid/unknown-action.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_TOKEN_REF",
    trigger: "Surface IR references an unknown token",
    message: "Surface IR references an unknown token.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-token-ref.json",
    pointer: "/root/tokenRefs/surface",
    sourceRef: "fixture://p0/invalid/unknown-token-ref#/root/tokenRefs/surface",
    coverage: "invalid/unknown-token-ref.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_EVENT",
    trigger: "Surface IR references an unknown event",
    message: "Surface IR references an unknown event.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-event.json",
    pointer: "/root/events/escalated",
    sourceRef: "fixture://p0/invalid/unknown-event#/root/events/escalated",
    coverage: "invalid/unknown-event.json"
  }),
  row({
    code: "CATALOG_UNKNOWN_DATA_BINDING",
    trigger: "Surface IR references an unknown data binding",
    message: "Surface IR references an unknown data binding.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unknown-data-binding.json",
    pointer: "/root/dataBindings/userId",
    sourceRef: "fixture://p0/invalid/unknown-data-binding#/root/dataBindings/userId",
    coverage: "invalid/unknown-data-binding.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "Prop value has the wrong JSON type",
    message: "Prop value has the wrong JSON type.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-prop-type.json",
    pointer: "/root/props/heading",
    sourceRef: "fixture://p0/invalid/invalid-prop-type#/root/props/heading",
    coverage: "invalid/invalid-prop-type.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "Value is outside an allowed enum",
    message: "Value is outside an allowed enum.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-enum-value.json",
    pointer: "/instances/callout1/props/status",
    sourceRef: "fixture://p0/invalid/invalid-enum-value#/instances/callout1/props/status",
    coverage: "invalid/invalid-enum-value.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "String value violates catalog bounds",
    message: "String value violates catalog bounds.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-string-bounds.json",
    pointer: "/root/props/heading",
    sourceRef: "fixture://p0/invalid/invalid-string-bounds#/root/props/heading",
    coverage: "invalid/invalid-string-bounds.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "Required prop is missing for the selected component, variant, or state",
    message: "Required prop is missing.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/missing-required-prop.json",
    pointer: "/root/props/heading",
    sourceRef: "fixture://p0/invalid/missing-required-prop#/root",
    coverage: "invalid/missing-required-prop.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "String prop contains unsafe markup or unsanitized text",
    message: "String prop contains unsafe markup or unsanitized text.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/unsafe-markup.json",
    pointer: "/instances/secondaryAction/props/label",
    sourceRef: "fixture://p0/invalid/unsafe-markup#/instances/secondaryAction/props/label",
    coverage: "invalid/unsafe-markup.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "Slot contains an illegal child component type",
    message: "Slot contains an illegal child component.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/illegal-slot-child.json",
    pointer: "/root/slots/primaryAction/0",
    sourceRef: "fixture://p0/invalid/illegal-slot-child#/root/slots/primaryAction/0",
    coverage: "invalid/illegal-slot-child.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "Slot exceeds its max item rule",
    message: "Slot exceeds its maximum item count.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/slot-max-items.json",
    pointer: "/root/slots/primaryAction",
    sourceRef: "fixture://p0/invalid/slot-max-items#/root/slots/primaryAction",
    coverage: "invalid/slot-max-items.json"
  }),
  row({
    code: "CATALOG_INVALID_VALUE",
    trigger: "Surface IR requests execution of a disabled action",
    message: "Surface IR requests execution of a disabled action.",
    stage: "adapter-conformance",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/disabled-action-execution.json",
    pointer: "/instances/secondaryAction/actions/dismiss/execute",
    sourceRef: "fixture://p0/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss",
    coverage: "invalid/disabled-action-execution.json"
  }),
  row({
    code: "CATALOG_EXTRA_PROPERTY",
    trigger: "Surface IR contains a property disallowed by schema/catalog",
    message: "Surface IR contains an unsupported property.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/extra-property.json",
    pointer: "/root/renderHtml",
    sourceRef: "fixture://p0/invalid/extra-property#/root/renderHtml",
    coverage: "invalid/extra-property.json"
  }),
  row({
    code: "ACCESSIBILITY_LABEL_MISSING",
    trigger: "Required accessible-name source is absent",
    message: "Required accessible name source is missing.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-a11y.json",
    pointer: "/root/accessibility/nameFrom",
    sourceRef: "fixture://p0/invalid/invalid-a11y#/root/accessibility",
    coverage: "invalid/invalid-a11y.json"
  }),
  row({
    code: "ACCESSIBILITY_CONTRACT_UNMET",
    trigger: "Keyboard contract is unmet",
    message: "Keyboard contract is unmet.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-keyboard-contract.json",
    pointer: "/instances/primaryAction/accessibility/activationKeys",
    sourceRef: "fixture://p0/invalid/invalid-keyboard-contract#/instances/primaryAction/accessibility",
    coverage: "invalid/invalid-keyboard-contract.json"
  }),
  row({
    code: "ACCESSIBILITY_CONTRACT_UNMET",
    trigger: "Focus contract is unmet",
    message: "Focus contract is unmet.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-focus-contract.json",
    pointer: "/instances/primaryAction/accessibility/focusableWhenDisabled",
    sourceRef: "fixture://p0/invalid/invalid-focus-contract#/instances/primaryAction/accessibility",
    coverage: "invalid/invalid-focus-contract.json"
  }),
  row({
    code: "ACCESSIBILITY_CONTRACT_UNMET",
    trigger: "Live-region contract is unmet",
    message: "Live-region contract is unmet.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/invalid-live-region.json",
    pointer: "/instances/callout1/accessibility/liveRegion",
    sourceRef: "fixture://p0/invalid/invalid-live-region#/instances/callout1/accessibility",
    coverage: "invalid/invalid-live-region.json"
  }),
  row({
    code: "ACCESSIBILITY_MODAL_UNSUPPORTED",
    trigger: "Surface IR attempts modal dialog or alertdialog semantics through unsupported modal fields",
    message: "Modal dialog and alertdialog semantics are deferred beyond P1 and unsupported in P0/P1.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/invalid/modal-role-not-supported.json",
    pointer: "/root/accessibility/role",
    sourceRef: "fixture://p0/invalid/modal-role-not-supported#/root/accessibility",
    coverage: "invalid/modal-role-not-supported.json"
  }),
  row({
    code: "GOVERNANCE_REVIEW_REQUIRED",
    trigger: "Structurally valid usage requires review",
    message: "Usage requires review before unattended promotion.",
    stage: "govern",
    severity: "review",
    promotionStatus: "review_required",
    artifactPath: "fixtures/p0/review/review-required-action.json",
    pointer: "/root/actions/confirm/execute",
    sourceRef: "fixture://p0/review/review-required-action#/root/actions/confirm",
    coverage: "review/review-required-action.json"
  }),
  row({
    code: "PROVENANCE_MISSING",
    trigger: "Required provenance is absent",
    message: "Required generated artifact provenance is missing.",
    stage: "compile",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/missing-provenance.extract.json",
    pointer: "/provenance",
    sourceRef: "fixture://p0/source#/provenance",
    coverage: "mutations/missing-provenance.extract.json"
  }),
  row({
    code: "ARTIFACT_HASH_MISMATCH",
    trigger: "Artifact hash differs from evidence manifest",
    message: "Artifact hash does not match the evidence manifest.",
    stage: "validate",
    severity: "error",
    promotionStatus: "blocked",
    artifactPath: "fixtures/p0/mutations/hash-mismatch.evidence.json",
    pointer: "/artifacts/0/hash",
    sourceRef: null,
    coverage: "mutations/hash-mismatch.evidence.json"
  })
];

function row(input) {
  return {
    ...input,
    validationResult:
      input.severity === "review" ? "valid" :
      input.promotionStatus === "blocked" ? "invalid" :
      "valid"
  };
}

const REGISTRY_BY_COVERAGE = new Map(REGISTRY_ROWS.map((entry) => [entry.coverage, entry]));
const REGISTRY_BY_ARTIFACT = new Map(REGISTRY_ROWS.map((entry) => [entry.artifactPath, entry]));

export async function runInterfacectl(argv, io) {
  if (argv[0] === "surfaces" && argv[1] === "review" && argv[2] === "proof") {
    const { runP4Interfacectl } = await import("./p4-proof.js");
    return runP4Interfacectl(argv.slice(3), io);
  }
  if (argv[0] === "surfaces" && argv[1] === "agents" && argv[2] === "proof") {
    const { runP3Interfacectl } = await import("./p3-proof.js");
    return runP3Interfacectl(argv.slice(3), io);
  }
  if (argv[0] === "surfaces" && argv[1] === "ingest" && argv[2] === "proof") {
    const { runP2Interfacectl } = await import("./p2-proof.js");
    return runP2Interfacectl(argv.slice(3), io);
  }
  if (argv[0] === "surfaces" && argv[1] === "adapter" && argv[2] === "proof") {
    const { runP1Interfacectl } = await import("./p1-proof.js");
    return runP1Interfacectl(argv.slice(3), io);
  }

  if (argv[0] !== "surfaces" || argv[1] !== "proof") {
    io.stderr.write("usage: interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0\nusage: interfacectl surfaces adapter proof --catalog artifacts/p0/governed-catalog.json --fixture fixtures/p1 --out artifacts/p1\nusage: interfacectl surfaces ingest proof --source sources/p2/design-system-source --fixture fixtures/p2 --out artifacts/p2\nusage: interfacectl surfaces agents proof --ingestion-evidence artifacts/p2/evidence.json --catalog artifacts/p2/governed-catalog.json --fixture fixtures/p3 --out artifacts/p3\nusage: interfacectl surfaces review proof --orchestration-evidence artifacts/p3/evidence.json --review-queue artifacts/p3/review-queue.json --fixture fixtures/p4 --out artifacts/p4\n");
    return 2;
  }

  const parsed = parseProofArgs(argv.slice(2));
  if (!parsed.ok) {
    io.stderr.write(`${parsed.error}\n`);
    return 2;
  }

  try {
    const result = await runProof({
      cwd: io.cwd,
      fixtureRoot: parsed.fixture,
      outRoot: parsed.out,
      command: "interfacectl surfaces proof",
      args: { fixture: parsed.fixture, out: parsed.out }
    });
    io.stdout.write([
      `surfaces proof: ${result.status}`,
      `promotionStatus: ${result.promotionStatus}`,
      `validationResults: ${result.matchedCount}/${result.totalCount} matched`,
      `artifacts: ${result.artifacts.join(", ")}`
    ].join("\n") + "\n");
    return result.status === "pass" ? 0 : 1;
  } catch (error) {
    if (error && error.exitCode === 1) {
      io.stderr.write(`${error.message}\n`);
      return 1;
    }
    if (error && error.exitCode === 2) {
      io.stderr.write(`${error.message}\n`);
      return 2;
    }
    throw error;
  }
}

function parseProofArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--fixture") {
      result.fixture = argv[i + 1];
      i += 1;
    } else if (current === "--out") {
      result.out = argv[i + 1];
      i += 1;
    } else {
      return { ok: false, error: `unexpected argument: ${current}` };
    }
  }
  if (!result.fixture || !result.out) {
    return { ok: false, error: "usage: interfacectl surfaces proof --fixture fixtures/p0 --out artifacts/p0" };
  }
  const fixturePath = parseRelativePosixPath(result.fixture, "--fixture");
  if (!fixturePath.ok) return fixturePath;
  const outPath = parseRelativePosixPath(result.out, "--out");
  if (!outPath.ok) return outPath;
  return { ok: true, fixture: fixturePath.path, out: outPath.path };
}

function parseRelativePosixPath(value, flagName) {
  if (typeof value !== "string" || value.length === 0) {
    return { ok: false, error: `${flagName} must be a POSIX-style relative path` };
  }
  if (value.includes("\\") || path.isAbsolute(value) || value.startsWith("/")) {
    return { ok: false, error: `${flagName} must be a POSIX-style relative path` };
  }
  const trimmed = value.replace(/\/+$/, "");
  const segments = trimmed.split("/");
  if (trimmed.length === 0 || segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return { ok: false, error: `${flagName} must be a POSIX-style relative path without . or .. segments` };
  }
  return { ok: true, path: trimmed };
}

export async function runProof({ cwd, fixtureRoot, outRoot, command, args }) {
  assertP0CommandRoots(fixtureRoot, outRoot);
  await assertReadableDir(path.join(cwd, fixtureRoot), `missing fixture path: ${fixtureRoot}`);
  await assertReadableDir(path.join(cwd, SCHEMA_ROOT), `unreadable schema path: ${SCHEMA_ROOT}`);
  await assertSchemaDirectoryCompleteness(cwd);
  await rejectStaleOutput(cwd, outRoot);

  const validators = await loadValidators(cwd);
  const manifestPath = `${fixtureRoot}/expectations.manifest.json`;
  const manifest = await readJson(path.join(cwd, manifestPath));
  assertSchema(validators, "fixture-expectations.v0", manifest, manifestPath);
  await assertManifestCompleteness(cwd, fixtureRoot, outRoot, manifest);

  const sourcePath = `${fixtureRoot}/source.fixture.json`;
  const sourceFixture = await readJson(path.join(cwd, sourcePath));
  const schemaIds = SCHEMA_FILES.map((file) => SCHEMA_IDS[file]);
  const runId = buildRunId(sourceFixture, schemaIds, command, args);

  const extractResult = extractSourceFixture(sourceFixture, sourcePath);
  if (!extractResult.ok) {
    throw contractError(`golden extraction failed: ${extractResult.diagnostics.map((diag) => diag.code).join(", ")}`, 1);
  }

  const extractArtifact = extractResult.extract;
  assertSchema(validators, "extract.v0", extractArtifact, `${outRoot}/extract.json`);
  await writeJson(path.join(cwd, outRoot, "extract.json"), extractArtifact);

  const catalogResult = compileCatalog(extractArtifact, `${outRoot}/extract.json`);
  if (!catalogResult.ok) {
    throw contractError(`golden catalog compile failed: ${catalogResult.diagnostics.map((diag) => diag.code).join(", ")}`, 1);
  }
  assertSchema(validators, "runtime-catalog.v0", catalogResult.catalog, `${outRoot}/catalog.json`);
  await writeJson(path.join(cwd, outRoot, "catalog.json"), catalogResult.catalog);

  const governedCatalog = governCatalog(catalogResult.catalog);
  assertSchema(validators, "runtime-catalog.v0", governedCatalog, `${outRoot}/governed-catalog.json`);
  await writeJson(path.join(cwd, outRoot, "governed-catalog.json"), governedCatalog);

  const validationResults = await evaluateManifestExpectations({
    cwd,
    fixtureRoot,
    outRoot,
    manifest,
    governedCatalog,
    validators
  });

  const allDiagnostics = sortDiagnostics(
    validationResults.flatMap((result) => result.diagnostics)
  );

  const adapterResults = validationResults.filter((result) =>
    ["surface-ir-validation", "adapter-conformance", "review"].includes(result.expectedPhase)
  );
  const generatedArtifactHashes = await artifactHashes(cwd, [
    `${outRoot}/extract.json`,
    `${outRoot}/catalog.json`,
    `${outRoot}/governed-catalog.json`
  ]);
  const governedCatalogHash = generatedArtifactHashes.get(`${outRoot}/governed-catalog.json`);
  const manifestHash = await canonicalFileHash(path.join(cwd, manifestPath));
  const adapterDiagnostics = {
    schemaId: "adapter-diagnostics.v0",
    version: VERSION,
    runId,
    status: adapterResults.every((result) => result.matched) ? "pass" : "fail",
    promotionStatus: aggregatePromotionStatus(adapterResults),
    fixtureRoot,
    catalogRef: {
      path: `${outRoot}/governed-catalog.json`,
      schemaId: "runtime-catalog.v0",
      hashAlgorithm: "sha256",
      hash: governedCatalogHash
    },
    manifestRef: {
      path: manifestPath,
      schemaId: "fixture-expectations.v0",
      hashAlgorithm: "sha256",
      hash: manifestHash
    },
    results: adapterResults.map(stripResultDiagnostics),
    diagnostics: sortDiagnostics(adapterResults.flatMap((result) => result.diagnostics)),
    environment: { ...ENVIRONMENT },
    provenance: {
      evaluator: { name: "interfacectl-p0-proof", version: VERSION },
      command,
      args,
      checkedAt: TIMESTAMP
    }
  };
  assertSchema(validators, "adapter-diagnostics.v0", adapterDiagnostics, `${outRoot}/adapter-diagnostics.json`);
  await writeJson(path.join(cwd, outRoot, "adapter-diagnostics.json"), adapterDiagnostics);

  const evidence = await buildEvidence({
    cwd,
    fixtureRoot,
    outRoot,
    command,
    args,
    runId,
    manifest,
    sourceFixture,
    validationResults,
    diagnostics: allDiagnostics,
    status: validationResults.every((result) => result.matched) && adapterDiagnostics.status === "pass" ? "pass" : "fail"
  });
  assertRunExpectation(manifest, evidence);
  assertSchema(validators, "evidence.v0", evidence, `${outRoot}/evidence.json`);
  await writeJson(path.join(cwd, outRoot, "evidence.json"), evidence);

  const persistedEvidence = await readJson(path.join(cwd, outRoot, "evidence.json"));
  const persistedSelfHash = computeEvidenceSelfHash(persistedEvidence);
  const evidenceEntry = persistedEvidence.artifacts[persistedEvidence.artifacts.length - 1];
  if (evidenceEntry.path !== `${outRoot}/evidence.json` || evidenceEntry.hash !== persistedSelfHash) {
    throw contractError("evidence self-hash verification failed", 1);
  }

  return {
    status: evidence.status,
    promotionStatus: evidence.promotionStatus,
    matchedCount: validationResults.filter((result) => result.matched).length,
    totalCount: validationResults.length,
    artifacts: GENERATED_ARTIFACTS.map((file) => `${outRoot}/${file}`)
  };
}

function assertP0CommandRoots(fixtureRoot, outRoot) {
  if (fixtureRoot !== FIXTURE_ROOT || outRoot !== ARTIFACT_ROOT) {
    throw contractError(`P0 proof requires --fixture ${FIXTURE_ROOT} --out ${ARTIFACT_ROOT}`, 2);
  }
}

async function assertReadableDir(dir, message) {
  try {
    const stat = await fs.lstat(dir);
    if (!stat.isDirectory()) {
      throw new Error(message);
    }
  } catch {
    throw contractError(message, 2);
  }
}

async function rejectStaleOutput(cwd, outRoot) {
  const outDir = await ensureSafeOutputDirectory(cwd, outRoot);
  let entries;
  try {
    entries = await fs.readdir(outDir, { withFileTypes: true });
  } catch (error) {
    throw contractError(`output path error for --out ${outRoot}: ${error.code || error.message}`, 2);
  }
  const allowed = new Set(GENERATED_ARTIFACTS);
  const stale = [];
  const unsafeExpected = [];
  for (const entry of entries) {
    const entryPath = `${outRoot}/${entry.name}${entry.isDirectory() ? "/" : ""}`;
    if (!allowed.has(entry.name)) {
      stale.push(entryPath);
    } else if (!entry.isFile()) {
      unsafeExpected.push(entryPath);
    }
  }
  unsafeExpected.sort();
  if (unsafeExpected.length > 0) {
    throw contractError(`unsafe expected output entry under --out: ${unsafeExpected.join(", ")}`, 1);
  }
  stale.sort();
  if (stale.length > 0) {
    throw contractError(`stale unexpected output under --out: ${stale.join(", ")}`, 1);
  }
}

async function ensureSafeOutputDirectory(cwd, outRoot) {
  const segments = outRoot.split("/");
  let current = cwd;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw contractError(`output path error for --out ${outRoot}: ${error.code || error.message}`, 2);
      }
      await fs.mkdir(current);
      stat = await fs.lstat(current);
    }
    if (!stat.isDirectory()) {
      throw contractError(`output path error for --out ${outRoot}: ${path.relative(cwd, current)} is not a directory`, 2);
    }
  }
  return current;
}

async function assertManifestCompleteness(cwd, fixtureRoot, outRoot, manifest) {
  if (manifest.fixtureRoot !== fixtureRoot || manifest.artifactRoot !== outRoot || manifest.schemaRoot !== SCHEMA_ROOT) {
    throw contractError("expectations manifest roots do not match proof command paths", 1);
  }

  const expectedInputs = manifest.expectations.map((expectation) => expectation.fixturePath);
  assertOrderedPaths("expectations manifest inputs", manifest.inputs, expectedInputs);
  assertNoDuplicatePaths("expectations manifest inputs", manifest.inputs);
  assertNoDuplicatePaths("expectations manifest expectations", expectedInputs);

  for (const inputPath of manifest.inputs) {
    assertPathUnderRoot(inputPath, fixtureRoot, "expectations manifest input");
  }
  for (const expectation of manifest.expectations) {
    assertP0RelativePath(expectation.expectedArtifactPath, "expectations manifest expectedArtifactPath");
    const expectedArtifactPath = expectedArtifactPathForExpectation(expectation);
    if (expectation.expectedArtifactPath !== expectedArtifactPath) {
      throw contractError(
        `expectations manifest expectedArtifactPath does not match P0 row for ${expectation.fixturePath}: expected ${expectedArtifactPath}, got ${expectation.expectedArtifactPath}`,
        1
      );
    }
    const expectedJsonPointer = expectedJsonPointerForExpectation(expectation);
    if (expectation.expectedJsonPointer !== expectedJsonPointer) {
      throw contractError(
        `expectations manifest expectedJsonPointer does not match P0 row for ${expectation.fixturePath}: expected ${expectedJsonPointer}, got ${expectation.expectedJsonPointer}`,
        1
      );
    }
  }

  const expectedArtifactOrder = artifactOrderFor(fixtureRoot, outRoot);
  assertOrderedPaths("expectations manifest artifactOrder", manifest.artifactOrder, expectedArtifactOrder);

  const expectedFixtureFiles = [
    `${fixtureRoot}/source.fixture.json`,
    `${fixtureRoot}/expectations.manifest.json`,
    ...manifest.inputs
  ].sort();
  const expectedFixtureEntries = [
    ...expectedFixtureFiles,
    ...expectedDirectoryEntries(expectedFixtureFiles, fixtureRoot)
  ].sort();
  const actualFixtureEntries = (await listTreeEntries(path.join(cwd, fixtureRoot), fixtureRoot)).sort();
  assertPathSet("fixture directory contents", actualFixtureEntries, expectedFixtureEntries);
}

async function assertSchemaDirectoryCompleteness(cwd) {
  const expectedSchemaFiles = SCHEMA_FILES.map((file) => `${SCHEMA_ROOT}/${file}`).sort();
  const actualSchemaEntries = (await listTreeEntries(path.join(cwd, SCHEMA_ROOT), SCHEMA_ROOT)).sort();
  const missing = expectedSchemaFiles.filter((entry) => !actualSchemaEntries.includes(entry));
  const unsupported = actualSchemaEntries.filter((entry) => {
    if (expectedSchemaFiles.includes(entry)) return false;
    const fileName = entry.slice(`${SCHEMA_ROOT}/`.length);
    return !SCHEMA_FILE_NAME_PATTERN.test(fileName);
  });
  if (missing.length > 0 || unsupported.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (unsupported.length > 0) parts.push(`unsupported ${unsupported.join(", ")}`);
    throw contractError(`schema directory contents drift: ${parts.join("; ")}`, 1);
  }
}

function assertRunExpectation(manifest, evidence) {
  const expected = manifest.runExpectation;
  if (evidence.status !== expected.status || evidence.promotionStatus !== expected.promotionStatus) {
    throw contractError(
      `run expectation mismatch: expected ${expected.status}/${expected.promotionStatus}, got ${evidence.status}/${evidence.promotionStatus}`,
      1
    );
  }
}

function assertOrderedPaths(label, actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    throw contractError(`${label} does not match the P0 contract`, 1);
  }
}

function assertNoDuplicatePaths(label, paths) {
  const duplicates = paths.filter((entry, index) => paths.indexOf(entry) !== index);
  if (duplicates.length > 0) {
    throw contractError(`${label} contains duplicate paths: ${[...new Set(duplicates)].join(", ")}`, 1);
  }
}

function assertPathUnderRoot(value, root, label) {
  if (value.includes("\\") || value.startsWith("/") || value.split("/").some((segment) => segment === "" || segment === "." || segment === "..") || !value.startsWith(`${root}/`)) {
    throw contractError(`${label} must stay under ${root}: ${value}`, 1);
  }
}

function assertP0RelativePath(value, label) {
  if (
    typeof value !== "string" ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw contractError(`${label} must be a POSIX-style relative P0 path without . or .. segments: ${value}`, 1);
  }
  if (!P0_PATH_ROOTS.some((root) => value.startsWith(`${root}/`))) {
    throw contractError(`${label} must stay under a P0 root (${P0_PATH_ROOTS.join(", ")}): ${value}`, 1);
  }
}

function assertPathSet(label, actual, expected) {
  const missing = expected.filter((entry) => !actual.includes(entry));
  const extra = actual.filter((entry) => !expected.includes(entry));
  if (missing.length > 0 || extra.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing ${missing.join(", ")}`);
    if (extra.length > 0) parts.push(`extra ${extra.join(", ")}`);
    throw contractError(`${label} drift: ${parts.join("; ")}`, 1);
  }
}

function expectedDirectoryEntries(files, root) {
  const dirs = new Set();
  for (const file of files) {
    let current = path.posix.dirname(file);
    while (current !== "." && current !== root) {
      dirs.add(`${current}/`);
      current = path.posix.dirname(current);
    }
  }
  return [...dirs];
}

async function listTreeEntries(dir, relativeRoot) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = `${relativeRoot}/${entry.name}`;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(`${relativePath}/`);
      files.push(...await listTreeEntries(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      files.push(`${relativePath}${entry.isSymbolicLink() ? "@" : "!"}`);
    }
  }
  return files;
}

function contractError(message, exitCode) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

async function loadValidators(cwd) {
  const schemas = new Map();
  for (const file of SCHEMA_FILES) {
    const schema = await readJson(path.join(cwd, SCHEMA_ROOT, file));
    schemas.set(SCHEMA_IDS[file], schema);
  }
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true
  });
  for (const schema of schemas.values()) {
    ajv.addSchema(schema);
  }
  return {
    ajv,
    schemas,
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/p0/${schemaId}.schema.json`);
      if (!validate) {
        throw new Error(`schema not loaded: ${schemaId}`);
      }
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

function assertSchema(validators, schemaId, data, artifactPath) {
  const result = validators.validate(schemaId, data);
  if (!result.valid) {
    const detail = result.errors.map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
    throw contractError(`schema validation failed for ${artifactPath}: ${detail}`, 1);
  }
}

async function evaluateManifestExpectations({ cwd, fixtureRoot, outRoot, manifest, governedCatalog, validators }) {
  const results = [];
  for (const expectation of manifest.expectations) {
    const artifactPath = expectation.fixturePath;
    const expectedArtifactPath = expectedArtifactPathForExpectation(expectation);
    const expectedJsonPointer = expectedJsonPointerForExpectation(expectation);
    const absolute = path.join(cwd, artifactPath);
    const fixture = await readJson(absolute);
    let actual;

    if (expectation.fixtureKind === "mutation") {
      actual = await evaluateMutationFixture(fixture, expectation, artifactPath, cwd);
    } else {
      actual = evaluateSurfaceFixture({
        fixture,
        expectation,
        artifactPath,
        governedCatalog,
        validators
      });
    }

    const matched = compareExpectation(expectation, actual, expectedArtifactPath, expectedJsonPointer);
    results.push({
      fixturePath: expectation.fixturePath,
      fixtureKind: expectation.fixtureKind,
      expectedStage: expectation.expectedStage,
      actualStage: actual.stage,
      expectedPhase: expectation.expectedPhase,
      actualPhase: actual.phase,
      expectedValidationResult: expectation.validationResult,
      actualValidationResult: actual.validationResult,
      expectedPromotionStatus: expectation.promotionStatus,
      actualPromotionStatus: actual.promotionStatus,
      expectedDiagnosticCodes: expectation.expectedDiagnosticCodes,
      actualDiagnosticCodes: actual.diagnostics.map((diagnostic) => diagnostic.code),
      artifactPath: expectedArtifactPath,
      jsonPointer: expectedJsonPointer,
      sourceRef: actual.sourceRef,
      matched,
      diagnostics: actual.diagnostics
    });
  }
  return results;
}

async function evaluateMutationFixture(fixture, expectation, artifactPath, cwd) {
  if (artifactPath.endsWith(".source.fixture.json")) {
    const extractResult = extractSourceFixture(fixture, artifactPath);
    if (!extractResult.ok) {
      return resultFromDiagnostics(expectation, extractResult.diagnostics);
    }
    const compileResult = compileCatalog(extractResult.extract, artifactPath);
    return compileResult.ok ?
      passResult(expectation) :
      resultFromDiagnostics(expectation, compileResult.diagnostics);
  }

  if (artifactPath.endsWith("missing-provenance.extract.json")) {
    const compileResult = compileCatalog(fixture, artifactPath);
    return compileResult.ok ?
      passResult(expectation) :
      resultFromDiagnostics(expectation, compileResult.diagnostics);
  }

  if (artifactPath.endsWith("hash-mismatch.evidence.json")) {
    const diagnostics = await validateEvidenceMutation(fixture, cwd);
    return resultFromDiagnostics(expectation, diagnostics);
  }

  return resultFromDiagnostics(expectation, [diagnosticForRow(REGISTRY_ROWS[0], artifactPath)]);
}

function evaluateSurfaceFixture({ fixture, expectation, artifactPath, governedCatalog, validators }) {
  const schemaResult = validators.validate("surface-ir.v0", fixture);
  if (!schemaResult.valid && expectation.expectedDiagnosticCodes.includes("CATALOG_EXTRA_PROPERTY")) {
    return resultFromDiagnostics(expectation, [
      diagnosticForCoverage("invalid/extra-property.json", { diagnosticSource: "json-schema", schemaOutputFormat: "basic" })
    ]);
  }
  if (!schemaResult.valid) {
    return resultFromDiagnostics(expectation, [
      diagnosticForRow(REGISTRY_ROWS[0], artifactPath, { diagnosticSource: "json-schema", schemaOutputFormat: "basic" })
    ]);
  }

  const sourceRefDiagnostic = validateSurfaceIrSourceRefs(fixture, artifactPath);
  if (sourceRefDiagnostic) {
    return resultFromDiagnostics(expectation, [sourceRefDiagnostic]);
  }

  const diagnostics = validateSurfaceIr(fixture, governedCatalog, artifactPath);
  if (diagnostics.length === 0) {
    return passResult(expectation, fixture.root.sourceRef);
  }
  return resultFromDiagnostics(expectation, diagnostics);
}

function compareExpectation(expectation, actual, expectedArtifactPath, expectedJsonPointer) {
  return expectation.expectedStage === actual.stage &&
    expectation.expectedPhase === actual.phase &&
    expectation.validationResult === actual.validationResult &&
    expectation.promotionStatus === actual.promotionStatus &&
    expectation.expectedDiagnosticCodes.length === actual.diagnostics.length &&
    expectation.expectedDiagnosticCodes.every((code, index) => actual.diagnostics[index]?.code === code) &&
    expectedArtifactPath === (actual.diagnostics[0]?.artifactPath ?? expectedArtifactPath) &&
    expectedJsonPointer === (actual.diagnostics[0]?.path ?? expectedJsonPointer) &&
    expectation.requiredSourceRef === actual.sourceRef;
}

function expectedArtifactPathForExpectation(expectation) {
  if (expectation.expectedDiagnosticCodes.length === 0) {
    if (
      expectation.fixtureKind === "valid" &&
      expectation.fixturePath === `${FIXTURE_ROOT}/valid.surface-ir.json` &&
      expectation.expectedStage === "validate" &&
      expectation.expectedPhase === "surface-ir-validation"
    ) {
      return expectation.fixturePath;
    }
    throw contractError(`expectations manifest has no P0 row for no-diagnostic expectation ${expectation.fixturePath}`, 1);
  }

  const row = REGISTRY_BY_ARTIFACT.get(expectation.fixturePath);
  if (!row) {
    throw contractError(`expectations manifest has no P0 diagnostic row for ${expectation.fixturePath}`, 1);
  }
  return row.artifactPath;
}

function expectedJsonPointerForExpectation(expectation) {
  if (expectation.expectedDiagnosticCodes.length === 0) {
    if (
      expectation.fixtureKind === "valid" &&
      expectation.fixturePath === `${FIXTURE_ROOT}/valid.surface-ir.json` &&
      expectation.expectedStage === "validate" &&
      expectation.expectedPhase === "surface-ir-validation"
    ) {
      return "/root";
    }
    throw contractError(`expectations manifest has no P0 row for no-diagnostic expectation ${expectation.fixturePath}`, 1);
  }

  const row = REGISTRY_BY_ARTIFACT.get(expectation.fixturePath);
  if (!row) {
    throw contractError(`expectations manifest has no P0 diagnostic row for ${expectation.fixturePath}`, 1);
  }
  return row.pointer;
}

function passResult(expectation, sourceRef = expectation.requiredSourceRef) {
  return {
    stage: expectation.expectedStage,
    phase: expectation.expectedPhase,
    validationResult: "valid",
    promotionStatus: "allowed",
    diagnostics: [],
    sourceRef
  };
}

function resultFromDiagnostics(expectation, diagnostics) {
  const first = diagnostics[0];
  return {
    stage: first?.stage ?? expectation.expectedStage,
    phase: expectation.expectedPhase,
    validationResult: first?.validationResult ?? expectation.validationResult,
    promotionStatus: first?.promotionStatus ?? expectation.promotionStatus,
    diagnostics: sortDiagnostics(diagnostics),
    sourceRef: first?.sourceRef ?? null
  };
}

function extractSourceFixture(source, artifactPath) {
  const required = ["fixtureId", "version", "sourceUri", "sourceHash", "generatedAt", "tokens", "components", "sourceRefs", "provenance"];
  for (const field of required) {
    if (!Object.prototype.hasOwnProperty.call(source, field)) {
      return failed([diagnosticForCoverage("mutations/missing-required-field.source.fixture.json")]);
    }
  }
  if (!isValidSourceRef(source.provenance?.sourceRef)) {
    return failed([diagnosticForCoverage("mutations/missing-source-ref.source.fixture.json")]);
  }
  const missingSourceRef = findMissingSourceRef(source);
  if (missingSourceRef) {
    return failed([diagnosticForCoverage("mutations/missing-source-ref.source.fixture.json")]);
  }
  if (!sourceRefsMapMatchesInlineRefs(source)) {
    return failed([diagnosticForCoverage("mutations/missing-source-ref.source.fixture.json")]);
  }

  const tokenDiagnostic = validateSourceTokens(source.tokens, artifactPath);
  if (tokenDiagnostic) {
    return failed([tokenDiagnostic]);
  }

  const normalizedTokens = normalizeTokens(source.tokens);
  const normalizedSourceRefs = {
    ...source.sourceRefs,
    ...collectCompositeSubvalueSourceRefs(normalizedTokens)
  };
  const extract = {
    schemaId: "extract.v0",
    version: VERSION,
    fixtureId: source.fixtureId,
    generatedAt: TIMESTAMP,
    sourceUri: source.sourceUri,
    sourceHash: source.sourceHash,
    tokens: normalizedTokens,
    components: source.components,
    sourceRefs: normalizedSourceRefs,
    provenance: {
      sourceUri: source.sourceUri,
      sourceHash: source.sourceHash,
      extractor: "interfacectl-p0-extractor",
      extractorVersion: VERSION,
      generatedAt: TIMESTAMP,
      fixtureLabel: source.fixtureId,
      schemaIds: ["extract.v0", "runtime-catalog.v0", "diagnostics.v0"],
      command: "interfacectl surfaces proof",
      commandArgs: { fixture: FIXTURE_ROOT, out: ARTIFACT_ROOT },
      sourceRef: source.provenance.sourceRef
    },
    diagnostics: []
  };
  return { ok: true, extract, diagnostics: [] };
}

function failed(diagnostics) {
  return { ok: false, diagnostics };
}

function findMissingSourceRef(source) {
  const tokenRefMissing = findMissingTokenSourceRef(source.tokens);
  if (tokenRefMissing) return tokenRefMissing;

  for (const component of source.components) {
    if (!hasSourceRef(component)) return component;
    if (component.accessibility && !hasSourceRef(component.accessibility)) return component.accessibility;
    for (const collectionName of ["props", "variants", "states", "slots", "actions", "events", "dataBindings", "governance"]) {
      const collection = component[collectionName] || {};
      for (const entry of Object.values(collection)) {
        if (entry && typeof entry === "object" && !hasSourceRef(entry)) return entry;
      }
    }
    for (const example of component.examples || []) {
      if (!hasSourceRef(example)) return example;
    }
  }

  return null;
}

function findMissingTokenSourceRef(tokens) {
  const stack = [tokens];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object" || Array.isArray(current)) continue;
    if (isTokenNode(current) && !hasSourceRef(current)) return current;
    for (const [key, value] of Object.entries(current)) {
      if (!key.startsWith("$") && value && typeof value === "object") stack.push(value);
    }
  }
  return null;
}

function hasSourceRef(value) {
  return isValidSourceRef(value?.sourceRef);
}

function isValidSourceRef(value) {
  return typeof value === "string" && /^fixture:\/\/p0\/(?:source|valid|invalid\/[A-Za-z0-9-]+|review\/[A-Za-z0-9-]+)#\/(?:[^/~#]|~0|~1|\/)*$/.test(value);
}

function sourceRefsMapMatchesInlineRefs(source) {
  const expected = collectSourceRefs(source);
  return Object.values(expected).every((sourceRef) => isValidSourceRef(sourceRef)) &&
    canonicalJson(source.sourceRefs) === canonicalJson(expected);
}

function validateSourceTokens(tokens, artifactPath) {
  const extendsDiagnostic = validateExtends(tokens, artifactPath);
  if (extendsDiagnostic) return extendsDiagnostic;

  const flat = flattenTokens(tokens);
  for (const [tokenPath, token] of flat.entries()) {
    const compositeDiagnostic = validateCompositeToken(tokenPath, token, artifactPath);
    if (compositeDiagnostic) return compositeDiagnostic;
  }
  for (const [tokenPath, token] of flat.entries()) {
    const diagnostic = resolveToken(tokenPath, token, flat, [], artifactPath);
    if (diagnostic) return diagnostic;
  }
  return null;
}

function normalizeTokens(tokens) {
  const inherited = applyTokenGroupExtends(tokens, tokens, "/tokens", []);
  const flat = flattenTokens(inherited);

  const normalizeNode = (node, parts) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return deepClone(node);
    if (isTokenNode(node)) {
      const normalized = deepClone(node);
      const resolvedValue = resolveTokenValue(parts.join("."), node, flat, []);
      normalized.resolvedValue = resolvedValue;
      if (resolvedValue && typeof resolvedValue === "object" && !Array.isArray(resolvedValue)) {
        normalized.resolvedSubvalues = compositeSubvalues(resolvedValue, normalized.sourceRef);
      }
      return normalized;
    }

    const normalized = {};
    for (const [key, value] of Object.entries(node)) {
      normalized[key] = key.startsWith("$") ? deepClone(value) : normalizeNode(value, [...parts, key]);
    }
    return normalized;
  };

  return normalizeNode(inherited, []);
}

function catalogTokensFromExtract(tokens) {
  const walk = (node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return deepClone(node);
    if (isTokenNode(node)) {
      const normalized = deepClone(node);
      if (Object.prototype.hasOwnProperty.call(normalized, "resolvedValue")) {
        normalized.$value = deepClone(normalized.resolvedValue);
      }
      delete normalized.$ref;
      delete normalized.resolvedValue;
      return normalized;
    }
    const output = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === "$extends") continue;
      output[key] = walk(value);
    }
    return output;
  };
  return walk(tokens);
}

function compositeSubvalues(resolvedValue, tokenSourceRef) {
  const subvalues = {};
  for (const [key, value] of Object.entries(resolvedValue)) {
    subvalues[key] = {
      value: deepClone(value),
      sourceRef: `${tokenSourceRef}/$value/${escapePointerSegment(key)}`
    };
  }
  return subvalues;
}

function collectCompositeSubvalueSourceRefs(tokens) {
  const refs = {};
  const walk = (node, pointer) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (isTokenNode(node)) {
      for (const [key, subvalue] of Object.entries(node.resolvedSubvalues || {})) {
        refs[`${pointer}/$value/${escapePointerSegment(key)}`] = subvalue.sourceRef;
      }
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (!key.startsWith("$")) {
        walk(value, `${pointer}/${escapePointerSegment(key)}`);
      }
    }
  };
  walk(tokens, "/tokens");
  return refs;
}

function applyTokenGroupExtends(group, rootTokens, groupPointer, stack) {
  if (!group || typeof group !== "object" || Array.isArray(group) || isTokenNode(group)) {
    return deepClone(group);
  }

  let inherited = {};
  if (typeof group.$extends === "string" && !stack.includes(groupPointer)) {
    const target = getByPointer({ tokens: rootTokens }, group.$extends);
    inherited = applyTokenGroupExtends(target, rootTokens, group.$extends, [...stack, groupPointer]);
  }

  const own = {};
  for (const [key, value] of Object.entries(group)) {
    own[key] = key.startsWith("$") ? deepClone(value) : applyTokenGroupExtends(value, rootTokens, `${groupPointer}/${escapePointerSegment(key)}`, stack);
  }

  return mergeTokenGroups(inherited, own);
}

function mergeTokenGroups(base, override) {
  const result = deepClone(base || {});
  for (const [key, value] of Object.entries(override || {})) {
    const existing = result[key];
    if (isMergeableTokenGroup(existing) && isMergeableTokenGroup(value)) {
      result[key] = mergeTokenGroups(existing, value);
    } else {
      result[key] = deepClone(value);
    }
  }
  return result;
}

function isMergeableTokenGroup(value) {
  return value && typeof value === "object" && !Array.isArray(value) && !isTokenNode(value);
}

function isTokenNode(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    (Object.prototype.hasOwnProperty.call(value, "$value") || Object.prototype.hasOwnProperty.call(value, "$ref")));
}

function resolveTokenValue(tokenPath, token, flat, stack) {
  if (stack.includes(tokenPath)) return deepClone(token.$value);
  if (typeof token.$ref === "string") {
    const targetPath = token.$ref.replace(/^\/tokens\/?/, "").replaceAll("/", ".");
    const target = flat.get(targetPath);
    return target ? resolveTokenValue(targetPath, target, flat, [...stack, tokenPath]) : deepClone(token.$value);
  }
  return resolveTokenValueNode(token.$value, flat, [...stack, tokenPath]);
}

function resolveTokenValueNode(value, flat, stack) {
  if (typeof value === "string") {
    const match = value.match(/^\{([A-Za-z0-9_.-]+)\}$/);
    if (match) {
      const targetPath = match[1];
      const target = flat.get(targetPath);
      return target ? resolveTokenValue(targetPath, target, flat, stack) : value;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveTokenValueNode(item, flat, stack));
  }
  if (value && typeof value === "object") {
    const resolved = {};
    for (const [key, nested] of Object.entries(value)) {
      resolved[key] = resolveTokenValueNode(nested, flat, stack);
    }
    return resolved;
  }
  return value;
}

function validateExtends(tokens, artifactPath) {
  const groups = flattenGroups(tokens);
  const visiting = new Set();
  const visited = new Set();

  const visit = (groupPath, group) => {
    if (!group || typeof group !== "object") return null;
    if (visited.has(groupPath)) return null;
    if (visiting.has(groupPath)) {
      return diagnosticForCoverage("mutations/circular-extends.source.fixture.json");
    }
    visiting.add(groupPath);
    if (typeof group.$extends === "string") {
      const pointer = group.$extends;
      const target = getByPointer({ tokens }, pointer);
      if (!target) {
        return diagnosticForCoverage("mutations/unresolved-extends-target.source.fixture.json");
      }
      if (typeof target !== "object" || Array.isArray(target) || Object.prototype.hasOwnProperty.call(target, "$value") || Object.prototype.hasOwnProperty.call(target, "$ref")) {
        return diagnosticForCoverage("mutations/invalid-extends-target-type.source.fixture.json");
      }
      const targetPath = pointer.replace(/^\/tokens\/?/, "").replaceAll("/", ".");
      const nested = visit(targetPath, target);
      if (nested) return nested;
    }
    visiting.delete(groupPath);
    visited.add(groupPath);
    return null;
  };

  for (const [groupPath, group] of groups.entries()) {
    const diagnostic = visit(groupPath, group);
    if (diagnostic) return diagnostic;
  }
  return null;
}

function flattenGroups(tokens) {
  const groups = new Map();
  const walk = (node, parts) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (!Object.prototype.hasOwnProperty.call(node, "$value") && !Object.prototype.hasOwnProperty.call(node, "$ref")) {
      if (parts.length > 0) groups.set(parts.join("."), node);
      for (const [key, value] of Object.entries(node)) {
        if (!key.startsWith("$")) walk(value, [...parts, key]);
      }
    }
  };
  walk(tokens, []);
  return groups;
}

function flattenTokens(tokens) {
  const flat = new Map();
  const walk = (node, parts) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (Object.prototype.hasOwnProperty.call(node, "$value") || Object.prototype.hasOwnProperty.call(node, "$ref")) {
      flat.set(parts.join("."), node);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (!key.startsWith("$")) walk(value, [...parts, key]);
    }
  };
  walk(tokens, []);
  return flat;
}

function resolveToken(tokenPath, token, flat, stack, artifactPath) {
  if (stack.includes(tokenPath)) {
    if (artifactPath.includes("circular-json-pointer-ref")) {
      return diagnosticForCoverage("mutations/circular-json-pointer-ref.source.fixture.json");
    }
    return diagnosticForCoverage("mutations/circular-token-alias.source.fixture.json");
  }

  if (typeof token.$ref === "string") {
    const pointerPath = token.$ref.replace(/^\/tokens\/?/, "").replaceAll("/", ".");
    const target = flat.get(pointerPath);
    if (!target) {
      return diagnosticForCoverage("mutations/unresolved-json-pointer-ref.source.fixture.json");
    }
    return resolveToken(pointerPath, target, flat, [...stack, tokenPath], artifactPath);
  }

  if (typeof token.$value === "string") {
    const match = token.$value.match(/^\{([A-Za-z0-9_.-]+)\}$/);
    if (match) {
      const targetPath = match[1];
      const target = flat.get(targetPath);
      if (!target) {
        return diagnosticForCoverage("mutations/unresolved-token-alias.source.fixture.json");
      }
      return resolveToken(targetPath, target, flat, [...stack, tokenPath], artifactPath);
    }
  }
  return null;
}

function validateCompositeToken(tokenPath, token, artifactPath) {
  if (token.$type === "typography") {
    const value = token.$value || {};
    const required = ["fontFamily", "fontSize", "fontWeight", "lineHeight"];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        return diagnosticForCoverage("mutations/composite-missing-subvalue.source.fixture.json");
      }
    }
    const allowed = new Set(required);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) {
        return diagnosticForCoverage("mutations/composite-extra-subvalue.source.fixture.json");
      }
    }
  }
  if (token.$type === "shadow") {
    const value = token.$value || {};
    const required = ["color", "offsetX", "offsetY", "blur", "spread"];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        return diagnosticForCoverage("mutations/composite-missing-subvalue.source.fixture.json");
      }
    }
    const allowed = new Set(required);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) {
        return diagnosticForCoverage("mutations/composite-extra-subvalue.source.fixture.json");
      }
    }
    for (const key of ["offsetX", "offsetY", "blur", "spread"]) {
      if (typeof value[key] !== "number" || !Number.isFinite(value[key])) {
        return diagnosticForCoverage("mutations/composite-incompatible-subvalue.source.fixture.json");
      }
    }
  }
  return null;
}

function compileCatalog(extract, artifactPath) {
  if (!extract.provenance) {
    return failed([diagnosticForCoverage("mutations/missing-provenance.extract.json")]);
  }
  const components = {};
  for (const [index, component] of extract.components.entries()) {
    if (components[component.id]) {
      return failed([diagnosticForCoverage("mutations/duplicate-component-id.source.fixture.json")]);
    }
    components[component.id] = {
      sourceRef: component.sourceRef,
      props: component.props,
      variants: component.variants,
      states: component.states,
      slots: component.slots,
      actions: component.actions,
      events: component.events,
      dataBindings: component.dataBindings,
      tokenRefs: component.tokenRefs,
      accessibility: component.accessibility,
      examples: component.examples
    };
  }

  const catalog = {
    catalogId: CATALOG_ID,
    schemaId: "runtime-catalog.v0",
    artifactKind: "catalog",
    version: VERSION,
    sourceRefs: extract.sourceRefs,
      tokens: catalogTokensFromExtract(extract.tokens),
    components,
    runtimeCapabilities: {
      unknownComponent: "blocked",
      unknownProp: "blocked",
      unknownVariant: "blocked",
      unknownState: "blocked",
      unknownSlot: "blocked",
      unknownAction: "blocked",
      unknownEvent: "blocked",
      unknownTokenRef: "blocked",
      unknownDataBinding: "blocked",
      actionExecution: "fail-closed"
    },
    governance: {
      rules: {},
      results: {},
      promotionStatus: null
    },
    provenance: {
      sourceUri: extract.sourceUri,
      sourceHash: extract.sourceHash,
      compilerName: "interfacectl-p0-compiler",
      compilerVersion: VERSION,
      generatedAt: TIMESTAMP,
      fixtureLabel: extract.fixtureId,
      schemaIds: ["runtime-catalog.v0", "diagnostics.v0"],
      command: "interfacectl surfaces proof",
      commandArgs: { fixture: FIXTURE_ROOT, out: ARTIFACT_ROOT }
    },
    diagnostics: [],
    compatibility: {
      a2ui: "reference-only"
    }
  };
  return { ok: true, catalog, diagnostics: [] };
}

function governCatalog(catalog) {
  return {
    ...deepClone(catalog),
    artifactKind: "governed-catalog",
    governance: {
      rules: {
        unknownUsage: {
          result: "blocked",
          appliesTo: ["component", "prop", "variant", "state", "slot", "action", "event", "tokenRef", "dataBinding"]
        },
        destructiveAction: {
          result: "review_required",
          appliesTo: ["ConfirmPanel.actions.confirm"]
        },
        disabledActionExecution: {
          result: "blocked",
          appliesTo: ["Button.actions.dismiss"]
        }
      },
      results: {
        validSurfaceIr: "allowed",
        reviewRequiredAction: "review_required",
        invalidUsage: "blocked"
      },
      promotionStatus: "review_required"
    },
    provenance: {
      ...catalog.provenance,
      governanceName: "interfacectl-p0-governance",
      governanceVersion: VERSION,
      generatedAt: TIMESTAMP
    }
  };
}

function validateSurfaceIr(surfaceIr, catalog, artifactPath) {
  const allInstances = new Map([[surfaceIr.root.id, surfaceIr.root]]);
  for (const [id, instance] of Object.entries(surfaceIr.instances)) {
    allInstances.set(id, instance);
  }
  const tokenPaths = flattenTokens(catalog.tokens);

  for (const [instanceId, instance] of allInstances.entries()) {
    const component = catalog.components[instance.component];
    if (!component) {
      return [diagnosticForCoverage("invalid/unknown-component.json")];
    }

    const extraKey = Object.keys(instance).find((key) => ![
      "id", "component", "props", "variant", "state", "slots", "actions", "events", "tokenRefs", "dataBindings", "accessibility", "sourceRef"
    ].includes(key));
    if (extraKey) {
      return [diagnosticForCoverage("invalid/extra-property.json", { diagnosticSource: "json-schema", schemaOutputFormat: "basic" })];
    }

    for (const propId of Object.keys(instance.props)) {
      if (!component.props[propId]) {
        return [diagnosticForCoverage("invalid/unknown-prop.json")];
      }
    }
    for (const [propId, prop] of Object.entries(component.props)) {
      const value = instance.props[propId];
      if (prop.required && value === undefined) {
        return [diagnosticForCoverage("invalid/missing-required-prop.json")];
      }
      if (value !== undefined) {
        const wrongType = prop.type === "string" ? typeof value !== "string" :
          prop.type === "boolean" ? typeof value !== "boolean" :
          prop.type === "number" ? typeof value !== "number" :
          false;
        if (wrongType) {
          return [diagnosticForCoverage("invalid/invalid-prop-type.json")];
        }
        if (prop.allowedValues.length > 0 && !prop.allowedValues.includes(value)) {
          return [diagnosticForCoverage("invalid/invalid-enum-value.json")];
        }
        if (typeof value === "string") {
          if (prop.minLength !== null && value.length < prop.minLength) {
            return [diagnosticForCoverage("invalid/invalid-string-bounds.json")];
          }
          if (prop.maxLength !== null && value.length > prop.maxLength) {
            return [diagnosticForCoverage("invalid/invalid-string-bounds.json")];
          }
          if (prop.allowMarkup === false && /<[^>]+>/.test(value)) {
            return [diagnosticForCoverage("invalid/unsafe-markup.json")];
          }
        }
      }
    }

    if (!component.variants[instance.variant]) {
      return [diagnosticForCoverage("invalid/unknown-variant.json")];
    }
    if (!component.states[instance.state]) {
      return [diagnosticForCoverage("invalid/unknown-state.json")];
    }

    for (const [slotId, children] of Object.entries(instance.slots)) {
      const slot = component.slots[slotId];
      if (!slot) {
        return [diagnosticForCoverage("invalid/unknown-slot.json")];
      }
      if (slot.maxItems !== null && children.length > slot.maxItems) {
        return [diagnosticForCoverage("invalid/slot-max-items.json")];
      }
      for (const childId of children) {
        const child = allInstances.get(childId);
        if (!child || !slot.allowedComponents.includes(child.component)) {
          return [diagnosticForCoverage("invalid/illegal-slot-child.json")];
        }
      }
    }

    for (const [actionId, actionUsage] of Object.entries(instance.actions)) {
      const action = component.actions[actionId];
      if (!action) {
        return [diagnosticForCoverage("invalid/unknown-action.json")];
      }
      if (actionUsage.execute === true && action.disabledUntilImplemented) {
        return [diagnosticForCoverage("invalid/disabled-action-execution.json")];
      }
      if (actionUsage.execute === true && action.requiresReview) {
        return [diagnosticForCoverage("review/review-required-action.json")];
      }
    }

    for (const eventId of Object.keys(instance.events)) {
      if (!component.events[eventId]) {
        return [diagnosticForCoverage("invalid/unknown-event.json")];
      }
    }

    for (const bindingId of Object.keys(instance.dataBindings)) {
      if (!component.dataBindings[bindingId]) {
        return [diagnosticForCoverage("invalid/unknown-data-binding.json")];
      }
    }

    for (const tokenRef of Object.values(instance.tokenRefs)) {
      if (!tokenPaths.has(tokenRef)) {
        return [diagnosticForCoverage("invalid/unknown-token-ref.json")];
      }
    }

    const accessibilityDiagnostic = validateAccessibility(instance, component);
    if (accessibilityDiagnostic) {
      return [accessibilityDiagnostic];
    }
  }

  return [];
}

function validateSurfaceIrSourceRefs(surfaceIr, artifactPath) {
  let invalid = null;
  const walk = (value) => {
    if (invalid || !value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(value, "sourceRef") && !isValidSourceRef(value.sourceRef)) {
      invalid = value.sourceRef;
      return;
    }
    for (const nested of Object.values(value)) walk(nested);
  };
  walk(surfaceIr);
  return invalid === null ? null : diagnosticForRow(REGISTRY_ROWS[0], artifactPath, {
    diagnosticSource: "json-schema",
    schemaOutputFormat: "basic"
  });
}

function validateAccessibility(instance, component) {
  const accessibility = instance.accessibility || {};
  if (["dialog", "alertdialog"].includes(accessibility.role) || accessibility["aria-modal"] === true ||
    accessibility.modal === true || accessibility.focusTrap === true ||
    accessibility.initialFocus || accessibility.returnFocus || accessibility.inertOutside === true) {
    return diagnosticForCoverage("invalid/modal-role-not-supported.json");
  }
  if (!accessibility.nameFrom) {
    return diagnosticForCoverage("invalid/invalid-a11y.json");
  }
  if (component.accessibility.role === "button") {
    const keys = accessibility.activationKeys || [];
    if (!keys.includes("Enter") || !keys.includes("Space") || accessibility.disabledBlocksActivation !== true) {
      return diagnosticForCoverage("invalid/invalid-keyboard-contract.json");
    }
    if (accessibility.focusableWhenDisabled === true) {
      return diagnosticForCoverage("invalid/invalid-focus-contract.json");
    }
  }
  if (instance.component === "StatusCallout") {
    const status = instance.props.status;
    const expectedRole = ["warning", "critical"].includes(status) ? "alert" : "status";
    const expectedPoliteness = ["warning", "critical"].includes(status) ? "assertive" : "polite";
    if (accessibility.role !== expectedRole || accessibility.liveRegion !== expectedPoliteness) {
      return diagnosticForCoverage("invalid/invalid-live-region.json");
    }
  }
  if (instance.component === "ConfirmPanel" && accessibility.role !== "group") {
    return diagnosticForCoverage("invalid/modal-role-not-supported.json");
  }
  return null;
}

async function validateEvidenceMutation(evidence, cwd) {
  if (!Array.isArray(evidence.artifacts) || evidence.artifacts.length === 0) {
    return [diagnosticForCoverage("mutations/hash-mismatch.evidence.json")];
  }

  const expectedPaths = artifactOrderFor(FIXTURE_ROOT, ARTIFACT_ROOT);
  const actualPaths = evidence.artifacts.map((entry) => entry.path);
  if (actualPaths.length !== expectedPaths.length || actualPaths.some((entryPath, index) => entryPath !== expectedPaths[index])) {
    return [diagnosticForCoverage("mutations/hash-mismatch.evidence.json")];
  }

  for (const entry of evidence.artifacts) {
    if (entry.hashAlgorithm !== "sha256" || typeof entry.path !== "string" || typeof entry.hash !== "string") {
      return [diagnosticForCoverage("mutations/hash-mismatch.evidence.json")];
    }
    if (entry.role !== roleForPath(entry.path) || entry.schemaId !== schemaIdForPath(entry.path)) {
      return [diagnosticForCoverage("mutations/hash-mismatch.evidence.json")];
    }

    let actualHash;
    try {
      actualHash = entry.path === `${ARTIFACT_ROOT}/evidence.json` ?
        computeEvidenceSelfHash(evidence) :
        await canonicalFileHash(path.join(cwd, entry.path));
    } catch {
      return [diagnosticForCoverage("mutations/hash-mismatch.evidence.json")];
    }

    if (entry.hash !== actualHash) {
      return [diagnosticForCoverage("mutations/hash-mismatch.evidence.json")];
    }
  }

  return [];
}

async function buildEvidence({ cwd, fixtureRoot, outRoot, command, args, runId, manifest, sourceFixture, validationResults, diagnostics, status }) {
  const promotionStatus = status === "pass" ? aggregatePromotionStatus(validationResults) : "blocked";
  const artifactEntries = await buildEvidenceArtifactEntries(cwd, fixtureRoot, outRoot);
  const evidence = {
    contractId: CONTRACT_ID,
    schemaId: "evidence.v0",
    version: VERSION,
    runId,
    checkedAt: TIMESTAMP,
    fixtureLabel: sourceFixture.fixtureId,
    command,
    args,
    status,
    promotionStatus,
    validationResults: validationResults.map(stripResultDiagnostics),
    evaluator: {
      name: "interfacectl-p0-proof",
      version: VERSION
    },
    environment: { ...ENVIRONMENT },
    artifacts: artifactEntries,
    provenance: {
      sourceUri: sourceFixture.sourceUri,
      sourceHash: sourceFixture.sourceHash,
      compilerVersion: VERSION,
      schemaIds: SCHEMA_FILES.map((file) => SCHEMA_IDS[file]),
      stageChain: ["extract", "compile", "govern", "validate", "adapter-conformance", "evidence"]
    },
    diagnostics: sortDiagnostics(diagnostics),
    adapterDiagnosticsPath: `${outRoot}/adapter-diagnostics.json`
  };
  const selfHash = computeEvidenceSelfHash(evidence);
  evidence.artifacts[evidence.artifacts.length - 1].hash = selfHash;
  return evidence;
}

async function buildEvidenceArtifactEntries(cwd, fixtureRoot, outRoot) {
  const paths = artifactOrderFor(fixtureRoot, outRoot);
  const entries = [];
  for (const artifactPath of paths) {
    const schemaId = schemaIdForPath(artifactPath);
    entries.push({
      role: roleForPath(artifactPath),
      path: artifactPath,
      schemaId,
      hashAlgorithm: "sha256",
      hash: artifactPath.endsWith("/evidence.json") ? null : await canonicalFileHash(path.join(cwd, artifactPath))
    });
  }
  return entries;
}

function artifactOrderFor(fixtureRoot, outRoot) {
  return [
    ...SCHEMA_FILES.map((file) => `${SCHEMA_ROOT}/${file}`),
    `${fixtureRoot}/source.fixture.json`,
    `${fixtureRoot}/expectations.manifest.json`,
    ...SOURCE_MUTATIONS.map((file) => `${fixtureRoot}/mutations/${file}`),
    `${fixtureRoot}/valid.surface-ir.json`,
    ...INVALID_FIXTURES.map((file) => `${fixtureRoot}/invalid/${file}`),
    `${fixtureRoot}/review/review-required-action.json`,
    `${outRoot}/extract.json`,
    `${outRoot}/catalog.json`,
    `${outRoot}/governed-catalog.json`,
    `${outRoot}/adapter-diagnostics.json`,
    `${outRoot}/evidence.json`
  ];
}

function schemaIdForPath(artifactPath) {
  const file = artifactPath.split("/").pop();
  if (SCHEMA_IDS[file]) return "json-schema";
  if (file === "source.fixture.json" || file?.endsWith(".source.fixture.json")) return "source.fixture.v0";
  if (file === "expectations.manifest.json") return "fixture-expectations.v0";
  if (file === "valid.surface-ir.json" || artifactPath.includes("/invalid/") || artifactPath.includes("/review/")) return "surface-ir.v0";
  if (file === "extract.json" || file === "missing-provenance.extract.json") return "extract.v0";
  if (file === "catalog.json" || file === "governed-catalog.json") return "runtime-catalog.v0";
  if (file === "adapter-diagnostics.json") return "adapter-diagnostics.v0";
  if (file === "evidence.json" || file === "hash-mismatch.evidence.json") return "evidence.v0";
  return null;
}

function roleForPath(artifactPath) {
  if (artifactPath.startsWith("schemas/")) return "schema";
  if (artifactPath.endsWith("source.fixture.json")) return "source-fixture";
  if (artifactPath.endsWith("expectations.manifest.json")) return "expectations-manifest";
  if (artifactPath.includes("/mutations/")) return "mutation-fixture";
  if (artifactPath.endsWith("valid.surface-ir.json")) return "valid-fixture";
  if (artifactPath.includes("/invalid/")) return "invalid-fixture";
  if (artifactPath.includes("/review/")) return "review-fixture";
  if (artifactPath.endsWith("adapter-diagnostics.json")) return "adapter-diagnostics";
  if (artifactPath.endsWith("evidence.json")) return "evidence";
  return "generated-artifact";
}

function computeEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  const finalEntry = clone.artifacts[clone.artifacts.length - 1];
  finalEntry.hash = null;
  return sha256Hex(canonicalJson(clone));
}

function aggregatePromotionStatus(results) {
  const matched = results.every((result) => result.matched !== false);
  if (!matched) return "blocked";
  if (results.some((result) => result.actualPromotionStatus === "review_required")) {
    return "review_required";
  }
  return "allowed";
}

function stripResultDiagnostics(result) {
  return {
    fixturePath: result.fixturePath,
    fixtureKind: result.fixtureKind,
    expectedStage: result.expectedStage,
    actualStage: result.actualStage,
    expectedPhase: result.expectedPhase,
    actualPhase: result.actualPhase,
    expectedValidationResult: result.expectedValidationResult,
    actualValidationResult: result.actualValidationResult,
    expectedPromotionStatus: result.expectedPromotionStatus,
    actualPromotionStatus: result.actualPromotionStatus,
    expectedDiagnosticCodes: result.expectedDiagnosticCodes,
    actualDiagnosticCodes: result.actualDiagnosticCodes,
    matched: result.matched,
    artifactPath: result.artifactPath,
    jsonPointer: result.jsonPointer,
    sourceRef: result.sourceRef
  };
}

function diagnosticForCoverage(coverage, overrides = {}) {
  const row = REGISTRY_BY_COVERAGE.get(coverage);
  if (!row) throw new Error(`unknown diagnostic coverage: ${coverage}`);
  return diagnosticForRow(row, row.artifactPath, overrides);
}

function diagnosticForRow(rowData, artifactPath = rowData.artifactPath, overrides = {}) {
  const diagnosticSource = overrides.diagnosticSource || diagnosticSourceFor(rowData.stage);
  const schemaOutputFormat = overrides.schemaOutputFormat ?? (diagnosticSource === "json-schema" ? "basic" : null);
  return {
    code: rowData.code,
    diagnosticSource,
    schemaOutputFormat,
    severity: rowData.severity,
    message: rowData.message,
    stage: rowData.stage,
    path: rowData.pointer,
    instanceLocation: rowData.pointer,
    keywordLocation: schemaOutputFormat === "basic" ? "/unevaluatedProperties" : null,
    absoluteKeywordLocation: schemaOutputFormat === "basic" ? "https://surfaces.dev/schemas/p0/surface-ir.v0.schema.json#/unevaluatedProperties" : null,
    sourceRef: rowData.sourceRef,
    artifactPath,
    validationResult: rowData.validationResult,
    promotionStatus: rowData.promotionStatus,
    suggestedAction: suggestedActionFor(rowData)
  };
}

function diagnosticSourceFor(stage) {
  if (stage === "extract") return "extractor";
  if (stage === "compile") return "catalog-validator";
  if (stage === "govern") return "governance";
  if (stage === "adapter-conformance") return "adapter";
  if (stage === "evidence") return "evidence";
  return "catalog-validator";
}

function suggestedActionFor(rowData) {
  if (rowData.severity === "review") return "Send structurally valid usage to human review before unattended promotion.";
  if (rowData.stage === "extract") return "Correct the source fixture so extraction can produce deterministic normalized input.";
  if (rowData.stage === "compile") return "Correct generated artifact provenance or catalog source identity before compilation.";
  if (rowData.stage === "adapter-conformance") return "Reject this runtime usage without rendering or executing actions.";
  if (rowData.code === "ARTIFACT_HASH_MISMATCH") return "Regenerate evidence from canonical artifact hashes.";
  return "Reject the Surface IR and keep the fixture expectation blocked.";
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) =>
    compareNullable(a.artifactPath, b.artifactPath) ||
    ((STAGE_ORDER.get(a.stage) ?? 999) - (STAGE_ORDER.get(b.stage) ?? 999)) ||
    compareNullable(a.path, b.path) ||
    compareNullable(a.keywordLocation, b.keywordLocation) ||
    compareNullable(a.code, b.code) ||
    compareNullable(a.sourceRef, b.sourceRef) ||
    compareNullable(a.message, b.message)
  );
}

function compareNullable(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return a < b ? -1 : 1;
}

async function artifactHashes(cwd, artifactPaths) {
  const hashes = new Map();
  for (const artifactPath of artifactPaths) {
    hashes.set(artifactPath, await canonicalFileHash(path.join(cwd, artifactPath)));
  }
  return hashes;
}

async function canonicalFileHash(filePath) {
  const data = await readJson(filePath);
  return sha256Hex(canonicalJson(data));
}

function buildRunId(sourceFixture, schemaIds, command, args) {
  const input = {
    sourceHash: sha256Hex(canonicalJson(sourceFixture)),
    schemaIds,
    command,
    args
  };
  return `p0-${sha256Hex(canonicalJson(input)).slice(0, 32)}`;
}

export function canonicalJson(value) {
  assertIJson(value);
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function assertIJson(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("P0 canonical JSON requires finite JSON numbers");
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw new Error("P0 canonical JSON requires integer numbers to be IEEE-754 safe integers");
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertIJson(item);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (nested === undefined) {
      throw new Error(`P0 canonical JSON cannot serialize undefined at ${key}`);
    }
    assertIJson(nested);
  }
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile()) {
      throw contractError(`refusing to overwrite non-regular file: ${filePath}`, 1);
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

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getByPointer(root, pointer) {
  if (pointer === "") return root;
  if (!pointer.startsWith("/")) return undefined;
  let current = root;
  for (const rawPart of pointer.slice(1).split("/")) {
    const part = rawPart.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, part)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function escapePointerSegment(segment) {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

export async function materializeP0Contract(cwd) {
  const schemas = buildSchemas();
  for (const [file, schema] of Object.entries(schemas)) {
    await writeJson(path.join(cwd, SCHEMA_ROOT, file), schema);
  }

  const source = buildSourceFixture();
  await writeJson(path.join(cwd, FIXTURE_ROOT, "source.fixture.json"), source);

  const surfaceFixtures = buildSurfaceFixtures();
  await writeJson(path.join(cwd, FIXTURE_ROOT, "valid.surface-ir.json"), surfaceFixtures.valid);
  for (const [file, fixture] of Object.entries(surfaceFixtures.invalid)) {
    await writeJson(path.join(cwd, FIXTURE_ROOT, "invalid", file), fixture);
  }
  await writeJson(path.join(cwd, FIXTURE_ROOT, "review", "review-required-action.json"), surfaceFixtures.review);

  const mutations = buildMutationFixtures(source);
  for (const [file, fixture] of Object.entries(mutations)) {
    await writeJson(path.join(cwd, FIXTURE_ROOT, "mutations", file), fixture);
  }

  const manifest = buildExpectationsManifest();
  await writeJson(path.join(cwd, FIXTURE_ROOT, "expectations.manifest.json"), manifest);
}

function buildSchemas() {
  return {
    "diagnostics.v0.schema.json": diagnosticsSchema(),
    "surface-ir.v0.schema.json": surfaceIrSchema(),
    "runtime-catalog.v0.schema.json": runtimeCatalogSchema(),
    "fixture-expectations.v0.schema.json": fixtureExpectationsSchema(),
    "extract.v0.schema.json": extractSchema(),
    "adapter-diagnostics.v0.schema.json": adapterDiagnosticsSchema(),
    "evidence.v0.schema.json": evidenceSchema()
  };
}

function schemaBase(schemaId) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://surfaces.dev/schemas/p0/${schemaId}.schema.json`,
    title: schemaId,
    type: "object"
  };
}

function diagnosticsSchema() {
  const codes = [...new Set(REGISTRY_ROWS.map((entry) => entry.code))].sort();
  return {
    ...schemaBase("diagnostics.v0"),
    schemaId: "diagnostics.v0",
    version: VERSION,
    xDiagnosticsRegistry: REGISTRY_ROWS.map((entry) => ({
      code: entry.code,
      trigger: entry.trigger,
      canonicalMessage: entry.message,
      stage: entry.stage,
      severity: entry.severity,
      promotionStatus: entry.promotionStatus,
      artifactPath: entry.artifactPath,
      jsonPointer: entry.pointer,
      sourceRef: entry.sourceRef,
      fixtureCoverage: entry.coverage
    })),
    required: [
      "code",
      "diagnosticSource",
      "schemaOutputFormat",
      "severity",
      "message",
      "stage",
      "path",
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
      code: { enum: codes },
      diagnosticSource: { enum: ["json-schema", "extractor", "catalog-validator", "governance", "adapter", "evidence"] },
      schemaOutputFormat: { anyOf: [{ const: "basic" }, { type: "null" }] },
      severity: { enum: ["info", "warning", "review", "error"] },
      message: { enum: [...new Set(REGISTRY_ROWS.map((entry) => entry.message))] },
      validatorMessage: { type: "string" },
      stage: { enum: ["extract", "compile", "govern", "validate", "adapter-conformance", "evidence"] },
      path: { type: "string", pattern: "^(/([^/~]|~0|~1)*)*$" },
      instanceLocation: { type: "string" },
      keywordLocation: { anyOf: [{ type: "string" }, { type: "null" }] },
      absoluteKeywordLocation: { anyOf: [{ type: "string" }, { type: "null" }] },
      sourceRef: { anyOf: [{ type: "string" }, { type: "null" }] },
      artifactPath: { type: "string" },
      validationResult: { enum: ["valid", "invalid", "not_applicable"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      suggestedAction: { type: "string" }
    },
    allOf: REGISTRY_ROWS
      .filter((entry) => entry.artifactPath !== "checked artifact")
      .map((entry) => ({
        if: {
          properties: {
            code: { const: entry.code },
            artifactPath: { const: entry.artifactPath },
            path: { const: entry.pointer }
          },
          required: ["code", "artifactPath", "path"]
        },
        then: {
          properties: {
            message: { const: entry.message },
            stage: { const: entry.stage },
            severity: { const: entry.severity },
            promotionStatus: { const: entry.promotionStatus }
          }
        }
      })),
    oneOf: REGISTRY_ROWS.map((entry) => diagnosticRegistryRowSchema(entry)),
    unevaluatedProperties: false
  };
}

function diagnosticRegistryRowSchema(entry) {
  const schemaProperties = {
    code: { const: entry.code },
    message: { const: entry.message },
    stage: { const: entry.stage },
    severity: { const: entry.severity },
    promotionStatus: { const: entry.promotionStatus },
    validationResult: { const: entry.validationResult },
    sourceRef: { const: entry.sourceRef }
  };

  if (entry.artifactPath !== "checked artifact") {
    schemaProperties.artifactPath = { const: entry.artifactPath };
    schemaProperties.path = { const: entry.pointer };
    schemaProperties.instanceLocation = { const: entry.pointer };
  } else {
    schemaProperties.artifactPath = { enum: artifactOrderFor(FIXTURE_ROOT, ARTIFACT_ROOT) };
    schemaProperties.path = { const: entry.pointer };
    schemaProperties.instanceLocation = { const: entry.pointer };
  }

  return {
    properties: schemaProperties,
    required: Object.keys(schemaProperties)
  };
}

function surfaceIrSchema() {
  const instanceSchema = {
    type: "object",
    required: ["id", "component", "props", "variant", "state", "slots", "actions", "events", "tokenRefs", "dataBindings", "accessibility", "sourceRef"],
    properties: {
      id: asciiIdSchema(),
      component: asciiIdSchema(),
      props: { type: "object", additionalProperties: true },
      variant: asciiIdSchema(),
      state: asciiIdSchema(),
      slots: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: asciiIdSchema()
        }
      },
      actions: {
        type: "object",
        additionalProperties: {
          type: "object",
          required: ["execute", "sourceRef"],
          properties: {
            execute: { type: "boolean" },
            payload: { type: "object", additionalProperties: true },
            sourceRef: { type: "string" }
          },
          unevaluatedProperties: false
        }
      },
      events: {
        type: "object",
        additionalProperties: {
          type: "object",
          required: ["sourceRef"],
          properties: {
            payload: { type: "object", additionalProperties: true },
            sourceRef: { type: "string" }
          },
          unevaluatedProperties: false
        }
      },
      tokenRefs: { type: "object", additionalProperties: { type: "string" } },
      dataBindings: { type: "object", additionalProperties: { type: "string" } },
      accessibility: {
        type: "object",
        properties: {
          role: { type: "string" },
          nameFrom: { type: "string" },
          descriptionFrom: { type: "string" },
          activationKeys: { type: "array", items: { type: "string" } },
          disabledBlocksActivation: { type: "boolean" },
          focusable: { type: "boolean" },
          focusableWhenDisabled: { type: "boolean" },
          liveRegion: { type: "string" },
          modal: { type: "boolean" },
          "aria-modal": { type: "boolean" },
          focusTrap: { type: "boolean" },
          initialFocus: { type: "string" },
          returnFocus: { type: "string" },
          inertOutside: { type: "boolean" }
        },
        unevaluatedProperties: false
      },
      sourceRef: { type: "string" }
    },
    unevaluatedProperties: false
  };

  return {
    ...schemaBase("surface-ir.v0"),
    schemaId: "surface-ir.v0",
    version: VERSION,
    required: ["schemaId", "version", "root", "instances", "provenance"],
    properties: {
      schemaId: { const: "surface-ir.v0" },
      version: semverSchema(),
      root: instanceSchema,
      instances: { type: "object", additionalProperties: instanceSchema },
      bindings: { type: "object", additionalProperties: true },
      provenance: provenanceSchema()
    },
    unevaluatedProperties: false
  };
}

function runtimeCatalogSchema() {
  const propSchema = {
    type: "object",
    required: ["id", "type", "required", "default", "allowedValues", "tokenRefs", "sourceRef", "diagnostics", "minLength", "maxLength", "allowMarkup"],
    properties: {
      id: asciiIdSchema(),
      type: { enum: ["string", "boolean", "number"] },
      required: { type: "boolean" },
      default: true,
      allowedValues: { type: "array", items: true },
      tokenRefs: { type: "array", items: { type: "string" } },
      sourceRef: { type: "string" },
      diagnostics: { type: "array", items: diagnosticRef() },
      minLength: { anyOf: [{ type: "integer" }, { type: "null" }] },
      maxLength: { anyOf: [{ type: "integer" }, { type: "null" }] },
      allowMarkup: { type: "boolean" }
    },
    unevaluatedProperties: false
  };
  const actionSchema = {
    type: "object",
    required: ["id", "kind", "allowedTargets", "destructive", "requiresReview", "disabledUntilImplemented", "dataBindingConstraints", "sourceRef"],
    properties: {
      id: asciiIdSchema(),
      kind: { type: "string" },
      allowedTargets: { type: "array", items: { type: "string" } },
      destructive: { type: "boolean" },
      requiresReview: { type: "boolean" },
      disabledUntilImplemented: { type: "boolean" },
      dataBindingConstraints: { type: "object", additionalProperties: true },
      sourceRef: { type: "string" }
    },
    unevaluatedProperties: false
  };
  const componentSchema = {
    type: "object",
    required: ["sourceRef", "props", "variants", "states", "slots", "actions", "events", "dataBindings", "tokenRefs", "accessibility", "examples"],
    properties: {
      sourceRef: { type: "string" },
      props: { type: "object", additionalProperties: propSchema },
      variants: { type: "object", additionalProperties: mapEntrySchema(["id", "allowedValues", "requiredProps", "stateConstraints", "sourceRef"]) },
      states: { type: "object", additionalProperties: mapEntrySchema(["id", "allowedProps", "accessibilityExpectations", "sourceRef"]) },
      slots: {
        type: "object",
        additionalProperties: {
          type: "object",
          required: ["id", "kind", "required", "allowedComponents", "maxItems", "sourceRef"],
          properties: {
            id: asciiIdSchema(),
            kind: { type: "string" },
            required: { type: "boolean" },
            allowedComponents: { type: "array", items: asciiIdSchema() },
            maxItems: { anyOf: [{ type: "integer" }, { type: "null" }] },
            sourceRef: { type: "string" }
          },
          unevaluatedProperties: false
        }
      },
      actions: { type: "object", additionalProperties: actionSchema },
      events: { type: "object", additionalProperties: mapEntrySchema(["id", "payloadShape", "allowedActionBindings", "sourceRef"]) },
      dataBindings: { type: "object", additionalProperties: mapEntrySchema(["id", "type", "constraints", "sourceRef"]) },
      tokenRefs: { type: "object", additionalProperties: { type: "string" } },
      accessibility: { type: "object", additionalProperties: true },
      examples: { type: "array", items: { type: "object", additionalProperties: true } }
    },
    unevaluatedProperties: false
  };

  return {
    ...schemaBase("runtime-catalog.v0"),
    schemaId: "runtime-catalog.v0",
    version: VERSION,
    required: ["catalogId", "schemaId", "artifactKind", "version", "sourceRefs", "tokens", "components", "runtimeCapabilities", "governance", "provenance", "diagnostics", "compatibility"],
    properties: {
      catalogId: { type: "string" },
      schemaId: { const: "runtime-catalog.v0" },
      artifactKind: { enum: ["catalog", "governed-catalog"] },
      version: semverSchema(),
      sourceRefs: { type: "object", additionalProperties: { type: "string" } },
      tokens: { type: "object", additionalProperties: true },
      components: { type: "object", additionalProperties: componentSchema },
      runtimeCapabilities: { type: "object", additionalProperties: { type: "string" } },
      governance: {
        type: "object",
        required: ["rules", "results", "promotionStatus"],
        properties: {
          rules: { type: "object", additionalProperties: true },
          results: { type: "object", additionalProperties: true },
          promotionStatus: { anyOf: [{ enum: ["allowed", "review_required", "blocked"] }, { type: "null" }] }
        },
        unevaluatedProperties: false
      },
      provenance: { type: "object", additionalProperties: true },
      diagnostics: { type: "array", items: diagnosticRef() },
      compatibility: {
        type: "object",
        required: ["a2ui"],
        properties: { a2ui: { const: "reference-only" } },
        unevaluatedProperties: false
      }
    },
    allOf: [
      {
        if: { properties: { artifactKind: { const: "catalog" } } },
        then: {
          properties: {
            governance: {
              properties: {
                rules: { maxProperties: 0 },
                results: { maxProperties: 0 },
                promotionStatus: { type: "null" }
              }
            }
          }
        }
      },
      {
        if: { properties: { artifactKind: { const: "governed-catalog" } } },
        then: {
          properties: {
            governance: {
              properties: {
                rules: { minProperties: 1 },
                results: { minProperties: 1 },
                promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
              }
            }
          }
        }
      }
    ],
    unevaluatedProperties: false
  };
}

function fixtureExpectationsSchema() {
  const expectationSchema = {
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
      "requiredSourceRef"
    ],
    properties: {
      fixturePath: { type: "string" },
      fixtureKind: { enum: ["mutation", "valid", "invalid", "review"] },
      expectedStage: stageSchema(),
      expectedPhase: { enum: ["source-mutation", "artifact-mutation", "surface-ir-validation", "adapter-conformance", "review"] },
      validationResult: { enum: ["valid", "invalid", "not_applicable"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
      expectedArtifactPath: p0ExpectationArtifactPathSchema(),
      expectedJsonPointer: p0ExpectationJsonPointerSchema(),
      requiredSourceRef: { anyOf: [{ type: "string" }, { type: "null" }] }
    },
    unevaluatedProperties: false
  };
  return {
    ...schemaBase("fixture-expectations.v0"),
    schemaId: "fixture-expectations.v0",
    version: VERSION,
    required: ["schemaId", "version", "fixtureRoot", "schemaRoot", "artifactRoot", "runExpectation", "inputs", "expectations", "artifactOrder"],
    properties: {
      schemaId: { const: "fixture-expectations.v0" },
      version: semverSchema(),
      fixtureRoot: { const: FIXTURE_ROOT },
      schemaRoot: { const: SCHEMA_ROOT },
      artifactRoot: { const: ARTIFACT_ROOT },
      runExpectation: {
        type: "object",
        required: ["status", "promotionStatus"],
        properties: {
          status: { enum: ["pass", "fail"] },
          promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
        },
        unevaluatedProperties: false
      },
      inputs: { type: "array", items: { type: "string" } },
      expectations: { type: "array", items: expectationSchema },
      artifactOrder: { type: "array", items: { type: "string" } }
    },
    unevaluatedProperties: false
  };
}

function extractSchema() {
  return {
    ...schemaBase("extract.v0"),
    schemaId: "extract.v0",
    version: VERSION,
    required: ["schemaId", "version", "fixtureId", "generatedAt", "sourceUri", "sourceHash", "tokens", "components", "sourceRefs", "provenance", "diagnostics"],
    properties: {
      schemaId: { const: "extract.v0" },
      version: semverSchema(),
      fixtureId: { type: "string" },
      generatedAt: { const: TIMESTAMP },
      sourceUri: { type: "string" },
      sourceHash: { type: "string" },
      tokens: { type: "object", additionalProperties: true },
      components: { type: "array", items: { type: "object", additionalProperties: true } },
      sourceRefs: { type: "object", additionalProperties: { type: "string" } },
      provenance: { type: "object", additionalProperties: true },
      diagnostics: { type: "array", items: diagnosticRef() }
    },
    unevaluatedProperties: false
  };
}

function adapterDiagnosticsSchema() {
  return {
    ...schemaBase("adapter-diagnostics.v0"),
    schemaId: "adapter-diagnostics.v0",
    version: VERSION,
    required: ["schemaId", "version", "runId", "status", "promotionStatus", "fixtureRoot", "catalogRef", "manifestRef", "results", "diagnostics", "environment", "provenance"],
    properties: {
      schemaId: { const: "adapter-diagnostics.v0" },
      version: semverSchema(),
      runId: { type: "string" },
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      fixtureRoot: { const: FIXTURE_ROOT },
      catalogRef: artifactRefSchema(),
      manifestRef: artifactRefSchema(),
      results: { type: "array", items: validationResultSchema() },
      diagnostics: { type: "array", items: diagnosticRef() },
      environment: environmentSchema(),
      provenance: {
        type: "object",
        required: ["evaluator", "command", "args", "checkedAt"],
        properties: {
          evaluator: evaluatorSchema(),
          command: { type: "string" },
          args: argsSchema(),
          checkedAt: { const: TIMESTAMP }
        },
        unevaluatedProperties: false
      }
    },
    unevaluatedProperties: false
  };
}

function evidenceSchema() {
  return {
    ...schemaBase("evidence.v0"),
    schemaId: "evidence.v0",
    version: VERSION,
    required: [
      "contractId",
      "schemaId",
      "version",
      "runId",
      "checkedAt",
      "fixtureLabel",
      "command",
      "args",
      "status",
      "promotionStatus",
      "validationResults",
      "evaluator",
      "environment",
      "artifacts",
      "provenance",
      "diagnostics",
      "adapterDiagnosticsPath"
    ],
    properties: {
      contractId: { const: CONTRACT_ID },
      schemaId: { const: "evidence.v0" },
      version: semverSchema(),
      runId: { type: "string" },
      checkedAt: { const: TIMESTAMP },
      fixtureLabel: { type: "string" },
      command: { type: "string" },
      args: argsSchema(),
      status: { enum: ["pass", "fail"] },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      validationResults: { type: "array", items: validationResultSchema() },
      evaluator: evaluatorSchema(),
      environment: environmentSchema(),
      artifacts: {
        type: "array",
        items: {
          type: "object",
          required: ["role", "path", "schemaId", "hashAlgorithm", "hash"],
          properties: {
            role: { type: "string" },
            path: { type: "string" },
            schemaId: { anyOf: [{ type: "string" }, { type: "null" }] },
            hashAlgorithm: { const: "sha256" },
            hash: { type: "string", pattern: "^[a-f0-9]{64}$" }
          },
          unevaluatedProperties: false
        }
      },
      provenance: {
        type: "object",
        required: ["sourceUri", "sourceHash", "compilerVersion", "schemaIds", "stageChain"],
        properties: {
          sourceUri: { type: "string" },
          sourceHash: { type: "string" },
          compilerVersion: semverSchema(),
          schemaIds: { type: "array", items: { type: "string" } },
          stageChain: { type: "array", items: stageSchema() }
        },
        unevaluatedProperties: false
      },
      diagnostics: { type: "array", items: diagnosticRef() },
      adapterDiagnosticsPath: { type: "string" }
    },
    unevaluatedProperties: false
  };
}

function validationResultSchema() {
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
      "sourceRef"
    ],
    properties: {
      fixturePath: { type: "string" },
      fixtureKind: { enum: ["mutation", "valid", "invalid", "review"] },
      expectedStage: stageSchema(),
      actualStage: stageSchema(),
      expectedPhase: { enum: ["source-mutation", "artifact-mutation", "surface-ir-validation", "adapter-conformance", "review"] },
      actualPhase: { enum: ["source-mutation", "artifact-mutation", "surface-ir-validation", "adapter-conformance", "review"] },
      expectedValidationResult: { enum: ["valid", "invalid", "not_applicable"] },
      actualValidationResult: { enum: ["valid", "invalid", "not_applicable"] },
      expectedPromotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      actualPromotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      expectedDiagnosticCodes: { type: "array", items: { type: "string" } },
      actualDiagnosticCodes: { type: "array", items: { type: "string" } },
      matched: { type: "boolean" },
      artifactPath: p0ExpectationArtifactPathSchema(),
      jsonPointer: p0ExpectationJsonPointerSchema(),
      sourceRef: { anyOf: [{ type: "string" }, { type: "null" }] }
    },
    unevaluatedProperties: false
  };
}

function p0ExpectationArtifactPathSchema() {
  return { enum: p0ExpectationArtifactPaths() };
}

function p0ExpectationArtifactPaths() {
  return [
    ...SOURCE_MUTATIONS.map((file) => `${FIXTURE_ROOT}/mutations/${file}`),
    `${FIXTURE_ROOT}/valid.surface-ir.json`,
    ...INVALID_FIXTURES.map((file) => `${FIXTURE_ROOT}/invalid/${file}`),
    `${FIXTURE_ROOT}/review/review-required-action.json`
  ];
}

function p0ExpectationJsonPointerSchema() {
  return { enum: p0ExpectationJsonPointers() };
}

function p0ExpectationJsonPointers() {
  return [...new Set([
    ...SOURCE_MUTATIONS.map((file) => REGISTRY_BY_COVERAGE.get(`mutations/${file}`)?.pointer),
    "/root",
    ...INVALID_FIXTURES.map((file) => REGISTRY_BY_COVERAGE.get(`invalid/${file}`)?.pointer),
    REGISTRY_BY_COVERAGE.get("review/review-required-action.json")?.pointer
  ])].filter(Boolean);
}

function environmentSchema() {
  return {
    type: "object",
    required: Object.keys(ENVIRONMENT),
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

function artifactRefSchema() {
  return {
    type: "object",
    required: ["path", "schemaId", "hashAlgorithm", "hash"],
    properties: {
      path: { type: "string" },
      schemaId: { type: "string" },
      hashAlgorithm: { const: "sha256" },
      hash: { type: "string", pattern: "^[a-f0-9]{64}$" }
    },
    unevaluatedProperties: false
  };
}

function evaluatorSchema() {
  return {
    type: "object",
    required: ["name", "version"],
    properties: {
      name: { type: "string" },
      version: semverSchema()
    },
    unevaluatedProperties: false
  };
}

function argsSchema() {
  return {
    type: "object",
    required: ["fixture", "out"],
    properties: {
      fixture: { type: "string" },
      out: { type: "string" }
    },
    unevaluatedProperties: false
  };
}

function provenanceSchema() {
  return {
    type: "object",
    required: ["sourceUri", "sourceHash", "generatedAt", "sourceRef"],
    properties: {
      sourceUri: { type: "string" },
      sourceHash: { type: "string" },
      generatedAt: { const: TIMESTAMP },
      sourceRef: { type: "string" }
    },
    additionalProperties: true
  };
}

function diagnosticRef() {
  return { $ref: "https://surfaces.dev/schemas/p0/diagnostics.v0.schema.json" };
}

function stageSchema() {
  return { enum: ["extract", "compile", "govern", "validate", "adapter-conformance", "evidence"] };
}

function semverSchema() {
  return { type: "string", pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" };
}

function asciiIdSchema() {
  return { type: "string", pattern: "^[A-Za-z_][A-Za-z0-9_]*$" };
}

function mapEntrySchema(required) {
  const properties = {};
  for (const key of required) {
    properties[key] = key === "id" ? asciiIdSchema() :
      key === "allowedValues" || key === "requiredProps" || key === "stateConstraints" || key === "allowedActionBindings" || key === "allowedProps" ? { type: "array", items: { type: "string" } } :
      key === "payloadShape" || key === "constraints" || key === "accessibilityExpectations" ? { type: "object", additionalProperties: true } :
      { type: "string" };
  }
  return {
    type: "object",
    required,
    properties,
    unevaluatedProperties: false
  };
}

function buildExpectationsManifest() {
  const expectations = [];
  for (const file of SOURCE_MUTATIONS) {
    const coverage = `mutations/${file}`;
    const registry = REGISTRY_BY_COVERAGE.get(coverage);
    expectations.push(expectationFromRegistry({
      fixturePath: `${FIXTURE_ROOT}/mutations/${file}`,
      fixtureKind: "mutation",
      expectedPhase: file.endsWith(".source.fixture.json") ? "source-mutation" : "artifact-mutation",
      registry
    }));
  }

  expectations.push({
    fixturePath: `${FIXTURE_ROOT}/valid.surface-ir.json`,
    fixtureKind: "valid",
    expectedStage: "validate",
    expectedPhase: "surface-ir-validation",
    validationResult: "valid",
    promotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: `${FIXTURE_ROOT}/valid.surface-ir.json`,
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p0/valid#/root"
  });

  for (const file of INVALID_FIXTURES) {
    const registry = REGISTRY_BY_COVERAGE.get(`invalid/${file}`);
    expectations.push(expectationFromRegistry({
      fixturePath: `${FIXTURE_ROOT}/invalid/${file}`,
      fixtureKind: "invalid",
      expectedPhase: file === "disabled-action-execution.json" ? "adapter-conformance" : "surface-ir-validation",
      registry
    }));
  }

  expectations.push(expectationFromRegistry({
    fixturePath: `${FIXTURE_ROOT}/review/review-required-action.json`,
    fixtureKind: "review",
    expectedPhase: "review",
    registry: REGISTRY_BY_COVERAGE.get("review/review-required-action.json")
  }));

  return {
    schemaId: "fixture-expectations.v0",
    version: VERSION,
    fixtureRoot: FIXTURE_ROOT,
    schemaRoot: SCHEMA_ROOT,
    artifactRoot: ARTIFACT_ROOT,
    runExpectation: {
      status: "pass",
      promotionStatus: "review_required"
    },
    inputs: expectations.map((expectation) => expectation.fixturePath),
    expectations,
    artifactOrder: artifactOrderFor(FIXTURE_ROOT, ARTIFACT_ROOT)
  };
}

function expectationFromRegistry({ fixturePath, fixtureKind, expectedPhase, registry }) {
  return {
    fixturePath,
    fixtureKind,
    expectedStage: registry.stage,
    expectedPhase,
    validationResult: registry.validationResult,
    promotionStatus: registry.promotionStatus,
    expectedDiagnosticCodes: [registry.code],
    expectedArtifactPath: registry.artifactPath,
    expectedJsonPointer: registry.pointer,
    requiredSourceRef: registry.sourceRef
  };
}

function buildSourceFixture() {
  const source = {
    schemaId: "source.fixture.v0",
    fixtureId: "surfaces-p0",
    version: VERSION,
    sourceUri: "fixture://surfaces/p0/source",
    sourceHash: "sha256:surfaces-p0-source",
    generatedAt: TIMESTAMP,
    sourceRefs: {},
    provenance: {
      sourceUri: "fixture://surfaces/p0/source",
      sourceHash: "sha256:surfaces-p0-source",
      generatedAt: TIMESTAMP,
      sourceRef: "fixture://p0/source#/provenance"
    },
    tokens: buildTokens(),
    components: [buttonComponent(), statusCalloutComponent(), confirmPanelComponent()]
  };
  source.sourceRefs = collectSourceRefs(source);
  return source;
}

function buildTokens() {
  return {
    color: {
      brand: {
        primary: token("#0B5FFF", "color", "Primary brand action color.", "/tokens/color/brand/primary"),
        danger: token("#C1121F", "color", "Destructive action color.", "/tokens/color/brand/danger")
      },
      surface: {
        panel: token("#FFFFFF", "color", "Panel surface.", "/tokens/color/surface/panel"),
        calloutInfo: token("#E8F2FF", "color", "Info callout background.", "/tokens/color/surface/calloutInfo")
      },
      text: {
        primary: token("#101828", "color", "Primary text.", "/tokens/color/text/primary"),
        inverse: token("#FFFFFF", "color", "Inverse text.", "/tokens/color/text/inverse")
      },
      action: {
        primaryBg: token("{color.brand.primary}", "color", "Primary button background alias.", "/tokens/color/action/primaryBg"),
        dangerBg: { ...token(null, "color", "Danger button background pointer.", "/tokens/color/action/dangerBg"), $ref: "/tokens/color/brand/danger" }
      }
    },
    spacing: {
      base: {
        sm: token(8, "spacing", "Small spacing.", "/tokens/spacing/base/sm"),
        md: token(12, "spacing", "Medium spacing.", "/tokens/spacing/base/md"),
        lg: token(16, "spacing", "Large spacing.", "/tokens/spacing/base/lg")
      },
      compact: {
        $extends: "/tokens/spacing/base",
        xs: token(4, "spacing", "Extra small compact spacing.", "/tokens/spacing/compact/xs"),
        sourceRef: "fixture://p0/source#/tokens/spacing/compact"
      }
    },
    radius: {
      sm: token(4, "radius", "Small radius.", "/tokens/radius/sm"),
      md: token(8, "radius", "Medium radius.", "/tokens/radius/md")
    },
    typography: {
      heading: token({
        fontFamily: "Inter",
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 28
      }, "typography", "Heading text style.", "/tokens/typography/heading"),
      body: token({
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 20
      }, "typography", "Body text style.", "/tokens/typography/body")
    },
    shadow: {
      raised: token({
        color: "rgba(16,24,40,0.18)",
        offsetX: 0,
        offsetY: 6,
        blur: 18,
        spread: 0
      }, "shadow", "Raised panel shadow.", "/tokens/shadow/raised")
    },
    motion: {
      fast: token("120ms", "motion", "Fast transition duration.", "/tokens/motion/fast")
    }
  };
}

function token(value, type, description, pointer) {
  return {
    $value: value,
    $type: type,
    $description: description,
    $extensions: {
      surfaces: {
        sourceRef: `fixture://p0/source#${pointer}`
      }
    },
    sourceRef: `fixture://p0/source#${pointer}`
  };
}

function buttonComponent() {
  return {
    id: "Button",
    sourceRef: "fixture://p0/source#/components/Button",
    props: {
      label: prop("label", "string", true, "", [], ["typography.body"], "/components/Button/props/label", { minLength: 1, maxLength: 80 }),
      variant: prop("variant", "string", true, "primary", ["primary", "secondary", "danger"], ["color.action.primaryBg", "color.action.dangerBg"], "/components/Button/props/variant"),
      size: prop("size", "string", false, "md", ["sm", "md", "lg"], ["spacing.base.sm", "spacing.base.md", "spacing.base.lg"], "/components/Button/props/size"),
      disabled: prop("disabled", "boolean", false, false, [], [], "/components/Button/props/disabled"),
      icon: prop("icon", "string", false, "", [], [], "/components/Button/props/icon", { minLength: 0, maxLength: 40 }),
      loading: prop("loading", "boolean", false, false, [], [], "/components/Button/props/loading")
    },
    variants: variants(["primary", "secondary", "danger"], "/components/Button/variants"),
    states: states(["default", "hover", "focus", "disabled", "loading"], "/components/Button/states"),
    slots: {},
    actions: {
      submit: action("submit", "event", false, false, false, "/components/Button/actions/submit"),
      dismiss: action("dismiss", "event", false, false, true, "/components/Button/actions/dismiss")
    },
    events: {
      click: event("click", "/components/Button/events/click")
    },
    dataBindings: {
      label: dataBinding("label", "string", "/components/Button/dataBindings/label")
    },
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
      descriptionFrom: "props.label",
      sourceRef: "fixture://p0/source#/components/Button/accessibility"
    },
    examples: [
      { id: "button-primary", sourceRef: "fixture://p0/source#/components/Button/examples/0" }
    ]
  };
}

function statusCalloutComponent() {
  return {
    id: "StatusCallout",
    sourceRef: "fixture://p0/source#/components/StatusCallout",
    props: {
      title: prop("title", "string", true, "", [], ["typography.heading"], "/components/StatusCallout/props/title", { minLength: 1, maxLength: 80 }),
      body: prop("body", "string", true, "", [], ["typography.body"], "/components/StatusCallout/props/body", { minLength: 1, maxLength: 240 }),
      status: prop("status", "string", true, "info", ["info", "success", "warning", "critical"], ["color.surface.calloutInfo"], "/components/StatusCallout/props/status"),
      dismissible: prop("dismissible", "boolean", false, false, [], [], "/components/StatusCallout/props/dismissible")
    },
    variants: variants(["info", "success", "warning", "critical"], "/components/StatusCallout/variants"),
    states: states(["default"], "/components/StatusCallout/states"),
    slots: {
      action: slot("action", "action", false, ["Button"], 1, "/components/StatusCallout/slots/action")
    },
    actions: {
      dismiss: action("dismiss", "event", false, false, false, "/components/StatusCallout/actions/dismiss")
    },
    events: {
      dismiss: event("dismiss", "/components/StatusCallout/events/dismiss")
    },
    dataBindings: {
      message: dataBinding("message", "string", "/components/StatusCallout/dataBindings/message")
    },
    tokenRefs: {
      background: "color.surface.calloutInfo",
      text: "color.text.primary",
      spacing: "spacing.base.md"
    },
    accessibility: {
      roleByStatus: { info: "status", success: "status", warning: "alert", critical: "alert" },
      nameFrom: "props.title",
      descriptionFrom: "props.body",
      liveRegionByStatus: { info: "polite", success: "polite", warning: "assertive", critical: "assertive" },
      dismissActionNameFrom: "props.title",
      sourceRef: "fixture://p0/source#/components/StatusCallout/accessibility"
    },
    examples: [
      { id: "callout-warning", sourceRef: "fixture://p0/source#/components/StatusCallout/examples/0" }
    ]
  };
}

function confirmPanelComponent() {
  return {
    id: "ConfirmPanel",
    sourceRef: "fixture://p0/source#/components/ConfirmPanel",
    props: {
      heading: prop("heading", "string", true, "", [], ["typography.heading"], "/components/ConfirmPanel/props/heading", { minLength: 1, maxLength: 100 }),
      body: prop("body", "string", true, "", [], ["typography.body"], "/components/ConfirmPanel/props/body", { minLength: 1, maxLength: 320 })
    },
    variants: variants(["standard"], "/components/ConfirmPanel/variants"),
    states: states(["default"], "/components/ConfirmPanel/states"),
    slots: {
      heading: slot("heading", "text", false, [], 0, "/components/ConfirmPanel/slots/heading"),
      body: slot("body", "text", false, [], 0, "/components/ConfirmPanel/slots/body"),
      primaryAction: slot("primaryAction", "action", true, ["Button"], 1, "/components/ConfirmPanel/slots/primaryAction"),
      secondaryAction: slot("secondaryAction", "action", true, ["Button"], 1, "/components/ConfirmPanel/slots/secondaryAction"),
      supportingContent: slot("supportingContent", "content", false, ["StatusCallout"], 1, "/components/ConfirmPanel/slots/supportingContent")
    },
    actions: {
      confirm: action("confirm", "event", true, true, false, "/components/ConfirmPanel/actions/confirm"),
      cancel: action("cancel", "event", false, false, false, "/components/ConfirmPanel/actions/cancel")
    },
    events: {
      confirm: event("confirm", "/components/ConfirmPanel/events/confirm"),
      cancel: event("cancel", "/components/ConfirmPanel/events/cancel")
    },
    dataBindings: {
      itemName: dataBinding("itemName", "string", "/components/ConfirmPanel/dataBindings/itemName")
    },
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
      primaryActionNameFrom: "slots.primaryAction.props.label",
      secondaryActionNameFrom: "slots.secondaryAction.props.label",
      modalSupported: false,
      sourceRef: "fixture://p0/source#/components/ConfirmPanel/accessibility"
    },
    governance: {
      destructivePrimaryAction: {
        action: "confirm",
        promotionStatus: "review_required",
        sourceRef: "fixture://p0/source#/components/ConfirmPanel/governance/destructivePrimaryAction"
      }
    },
    examples: [
      { id: "confirm-panel-valid", sourceRef: "fixture://p0/source#/components/ConfirmPanel/examples/0" }
    ]
  };
}

function prop(id, type, required, defaultValue, allowedValues, tokenRefs, pointer, options = {}) {
  return {
    id,
    type,
    required,
    default: defaultValue,
    allowedValues,
    tokenRefs,
    sourceRef: `fixture://p0/source#${pointer}`,
    diagnostics: [],
    minLength: options.minLength ?? null,
    maxLength: options.maxLength ?? null,
    allowMarkup: options.allowMarkup ?? false
  };
}

function variants(ids, pointer) {
  return Object.fromEntries(ids.map((id) => [id, {
    id,
    allowedValues: [id],
    requiredProps: [],
    stateConstraints: [],
    sourceRef: `fixture://p0/source#${pointer}/${id}`
  }]));
}

function states(ids, pointer) {
  return Object.fromEntries(ids.map((id) => [id, {
    id,
    allowedProps: [],
    accessibilityExpectations: {},
    sourceRef: `fixture://p0/source#${pointer}/${id}`
  }]));
}

function slot(id, kind, required, allowedComponents, maxItems, pointer) {
  return {
    id,
    kind,
    required,
    allowedComponents,
    maxItems,
    sourceRef: `fixture://p0/source#${pointer}`
  };
}

function action(id, kind, destructive, requiresReview, disabledUntilImplemented, pointer) {
  return {
    id,
    kind,
    allowedTargets: [],
    destructive,
    requiresReview,
    disabledUntilImplemented,
    dataBindingConstraints: {},
    sourceRef: `fixture://p0/source#${pointer}`
  };
}

function event(id, pointer) {
  return {
    id,
    payloadShape: {},
    allowedActionBindings: [],
    sourceRef: `fixture://p0/source#${pointer}`
  };
}

function dataBinding(id, type, pointer) {
  return {
    id,
    type,
    constraints: {},
    sourceRef: `fixture://p0/source#${pointer}`
  };
}

function collectSourceRefs(root) {
  const refs = {};
  const walk = (value, pointer) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.sourceRef === "string") {
      refs[pointer || "/"] = value.sourceRef;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${pointer}/${index}`));
      return;
    }
    for (const [key, nested] of Object.entries(value)) {
      walk(nested, `${pointer}/${key}`);
    }
  };
  walk(root, "");
  return refs;
}

function buildSurfaceFixtures() {
  const valid = validSurfaceIr("fixture://p0/valid");
  const invalid = Object.fromEntries(INVALID_FIXTURES.map((file) => [file, invalidFixture(file, valid)]));
  const review = validSurfaceIr("fixture://p0/review/review-required-action");
  review.root.actions.confirm.execute = true;
  review.root.actions.confirm.sourceRef = "fixture://p0/review/review-required-action#/root/actions/confirm";
  return { valid, invalid, review };
}

function validSurfaceIr(sourceBase) {
  return {
    schemaId: "surface-ir.v0",
    version: VERSION,
    root: {
      id: "confirm1",
      component: "ConfirmPanel",
      props: {
        heading: "Delete archive item?",
        body: "This removes the archived item from the workspace."
      },
      variant: "standard",
      state: "default",
      slots: {
        heading: [],
        body: [],
        primaryAction: ["primaryAction"],
        secondaryAction: ["secondaryAction"],
        supportingContent: ["callout1"]
      },
      actions: {
        confirm: { execute: false, payload: {}, sourceRef: `${sourceBase}#/root/actions/confirm` },
        cancel: { execute: false, payload: {}, sourceRef: `${sourceBase}#/root/actions/cancel` }
      },
      events: {
        confirm: { payload: {}, sourceRef: `${sourceBase}#/root/events/confirm` },
        cancel: { payload: {}, sourceRef: `${sourceBase}#/root/events/cancel` }
      },
      tokenRefs: {
        surface: "color.surface.panel",
        shadow: "shadow.raised",
        radius: "radius.md",
        spacing: "spacing.base.lg"
      },
      dataBindings: {
        itemName: "selectedItem.name"
      },
      accessibility: {
        role: "group",
        nameFrom: "heading",
        descriptionFrom: "body",
        modal: false
      },
      sourceRef: `${sourceBase}#/root`
    },
    instances: {
      primaryAction: buttonInstance("primaryAction", "Delete", "danger", `${sourceBase}#/instances/primaryAction`),
      secondaryAction: buttonInstance("secondaryAction", "Cancel", "secondary", `${sourceBase}#/instances/secondaryAction`),
      callout1: {
        id: "callout1",
        component: "StatusCallout",
        props: {
          title: "Review the impact",
          body: "This action affects archived workspace data.",
          status: "warning",
          dismissible: false
        },
        variant: "warning",
        state: "default",
        slots: { action: [] },
        actions: { dismiss: { execute: false, payload: {}, sourceRef: `${sourceBase}#/instances/callout1/actions/dismiss` } },
        events: { dismiss: { payload: {}, sourceRef: `${sourceBase}#/instances/callout1/events/dismiss` } },
        tokenRefs: { background: "color.surface.calloutInfo", text: "color.text.primary", spacing: "spacing.base.md" },
        dataBindings: { message: "selectedItem.warning" },
        accessibility: {
          role: "alert",
          nameFrom: "title",
          descriptionFrom: "body",
          liveRegion: "assertive"
        },
        sourceRef: `${sourceBase}#/instances/callout1`
      }
    },
    bindings: {
      selectedItem: { source: "fixture-data", sourceRef: `${sourceBase}#/bindings/selectedItem` }
    },
    provenance: {
      sourceUri: sourceBase,
      sourceHash: "sha256:surface-ir-fixture",
      generatedAt: TIMESTAMP,
      sourceRef: `${sourceBase}#/provenance`
    }
  };
}

function buttonInstance(id, label, variant, sourceBase) {
  return {
    id,
    component: "Button",
    props: {
      label,
      variant,
      size: "md",
      disabled: false,
      icon: "",
      loading: false
    },
    variant,
    state: "default",
    slots: {},
    actions: {
      submit: { execute: false, payload: {}, sourceRef: `${sourceBase}/actions/submit` },
      dismiss: { execute: false, payload: {}, sourceRef: `${sourceBase}/actions/dismiss` }
    },
    events: {
      click: { payload: {}, sourceRef: `${sourceBase}/events/click` }
    },
    tokenRefs: {
      background: variant === "danger" ? "color.action.dangerBg" : "color.action.primaryBg",
      text: "color.text.inverse",
      radius: "radius.sm",
      spacing: "spacing.base.md"
    },
    dataBindings: {
      label: `${id}.label`
    },
    accessibility: {
      role: "button",
      nameFrom: "label",
      activationKeys: ["Enter", "Space"],
      disabledBlocksActivation: true,
      focusable: true,
      focusableWhenDisabled: false
    },
    sourceRef: sourceBase
  };
}

function invalidFixture(file, valid) {
  const fixture = deepClone(valid);
  const sourceBase = `fixture://p0/invalid/${file.replace(/\.json$/, "")}`;
  rewriteSurfaceSourceRefs(fixture, sourceBase);
  switch (file) {
    case "unknown-component.json":
      fixture.root.component = "GhostPanel";
      break;
    case "unknown-prop.json":
      fixture.root.props.eyebrow = "Unsupported";
      break;
    case "unknown-variant.json":
      fixture.root.variant = "marketing";
      break;
    case "unknown-state.json":
      fixture.root.state = "expanded";
      break;
    case "unknown-slot.json":
      fixture.root.slots.footer = [];
      break;
    case "unknown-action.json":
      fixture.root.actions.escalate = { execute: false, payload: {}, sourceRef: `${sourceBase}#/root/actions/escalate` };
      break;
    case "unknown-event.json":
      fixture.root.events.escalated = { payload: {}, sourceRef: `${sourceBase}#/root/events/escalated` };
      break;
    case "unknown-data-binding.json":
      fixture.root.dataBindings.userId = "selectedItem.userId";
      break;
    case "unknown-token-ref.json":
      fixture.root.tokenRefs.surface = "color.surface.missing";
      break;
    case "extra-property.json":
      fixture.root.renderHtml = "<div>no renderer in P0</div>";
      break;
    case "invalid-prop-type.json":
      fixture.root.props.heading = 42;
      break;
    case "invalid-enum-value.json":
      fixture.instances.callout1.props.status = "neutral";
      fixture.instances.callout1.variant = "info";
      break;
    case "invalid-string-bounds.json":
      fixture.root.props.heading = "";
      break;
    case "missing-required-prop.json":
      delete fixture.root.props.heading;
      break;
    case "unsafe-markup.json":
      fixture.instances.secondaryAction.props.label = "<script>alert(1)</script>";
      break;
    case "illegal-slot-child.json":
      fixture.root.slots.primaryAction = ["callout1"];
      break;
    case "slot-max-items.json":
      fixture.root.slots.primaryAction = ["primaryAction", "secondaryAction"];
      break;
    case "disabled-action-execution.json":
      fixture.instances.secondaryAction.actions.dismiss.execute = true;
      break;
    case "invalid-a11y.json":
      delete fixture.root.accessibility.nameFrom;
      break;
    case "invalid-keyboard-contract.json":
      fixture.instances.primaryAction.accessibility.activationKeys = ["Enter"];
      break;
    case "invalid-focus-contract.json":
      fixture.instances.primaryAction.accessibility.focusableWhenDisabled = true;
      break;
    case "invalid-live-region.json":
      fixture.instances.callout1.accessibility.liveRegion = "polite";
      break;
    case "modal-role-not-supported.json":
      fixture.root.accessibility.role = "dialog";
      fixture.root.accessibility.modal = true;
      break;
    default:
      throw new Error(`unknown invalid fixture ${file}`);
  }
  return fixture;
}

function rewriteSurfaceSourceRefs(fixture, sourceBase) {
  fixture.provenance.sourceUri = sourceBase;
  fixture.provenance.sourceRef = `${sourceBase}#/provenance`;
  const walk = (value, pointer) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.sourceRef === "string") {
      value.sourceRef = `${sourceBase}#${pointer || "/"}`;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${pointer}/${index}`));
      return;
    }
    for (const [key, nested] of Object.entries(value)) {
      walk(nested, `${pointer}/${key}`);
    }
  };
  walk(fixture.root, "/root");
  walk(fixture.instances, "/instances");
  walk(fixture.bindings, "/bindings");
}

function buildMutationFixtures(source) {
  const fixtures = {};
  for (const file of SOURCE_MUTATIONS) {
    if (file.endsWith(".source.fixture.json")) {
      fixtures[file] = mutateSourceFixture(file, source);
    }
  }

  const extract = extractSourceFixture(source, `${FIXTURE_ROOT}/source.fixture.json`).extract;
  const missingProvenance = deepClone(extract);
  delete missingProvenance.provenance;
  fixtures["missing-provenance.extract.json"] = missingProvenance;
  fixtures["hash-mismatch.evidence.json"] = {
    contractId: CONTRACT_ID,
    schemaId: "evidence.v0",
    version: VERSION,
    runId: "p0-hash-mismatch-fixture",
    checkedAt: TIMESTAMP,
    fixtureLabel: "surfaces-p0",
    command: "interfacectl surfaces proof",
    args: { fixture: FIXTURE_ROOT, out: ARTIFACT_ROOT },
    status: "fail",
    promotionStatus: "blocked",
    validationResults: [],
    evaluator: { name: "interfacectl-p0-proof", version: VERSION },
    environment: { ...ENVIRONMENT },
    artifacts: [{
      role: "generated-artifact",
      path: `${ARTIFACT_ROOT}/catalog.json`,
      schemaId: "runtime-catalog.v0",
      hashAlgorithm: "sha256",
      hash: "0000000000000000000000000000000000000000000000000000000000000000"
    }],
    provenance: {
      sourceUri: source.sourceUri,
      sourceHash: source.sourceHash,
      compilerVersion: VERSION,
      schemaIds: SCHEMA_FILES.map((file) => SCHEMA_IDS[file]),
      stageChain: ["evidence"]
    },
    diagnostics: [],
    adapterDiagnosticsPath: `${ARTIFACT_ROOT}/adapter-diagnostics.json`
  };
  return fixtures;
}

function mutateSourceFixture(file, source) {
  const fixture = deepClone(source);
  fixture.sourceUri = `fixture://surfaces/p0/mutations/${file}`;
  fixture.provenance.sourceUri = fixture.sourceUri;
  switch (file) {
    case "missing-required-field.source.fixture.json":
      delete fixture.fixtureId;
      break;
    case "missing-source-ref.source.fixture.json":
      delete fixture.components[0].sourceRef;
      break;
    case "unresolved-token-alias.source.fixture.json":
      fixture.tokens.color.action.brokenAlias = token("{color.missing.token}", "color", "Broken alias.", "/tokens/color/action/brokenAlias");
      break;
    case "unresolved-json-pointer-ref.source.fixture.json":
      fixture.tokens.color.action.brokenPointer = {
        ...token(null, "color", "Broken JSON Pointer.", "/tokens/color/action/brokenPointer"),
        $ref: "/tokens/color/missing/pointer"
      };
      break;
    case "unresolved-extends-target.source.fixture.json":
      fixture.tokens.spacing.compact.$extends = "/tokens/spacing/missing";
      break;
    case "circular-token-alias.source.fixture.json":
      fixture.tokens.color.cycle = {
        a: token("{color.cycle.b}", "color", "Alias cycle A.", "/tokens/color/cycle/a"),
        b: token("{color.cycle.a}", "color", "Alias cycle B.", "/tokens/color/cycle/b")
      };
      break;
    case "circular-json-pointer-ref.source.fixture.json":
      fixture.tokens.color.pointerCycle = {
        a: { ...token(null, "color", "Pointer cycle A.", "/tokens/color/pointerCycle/a"), $ref: "/tokens/color/pointerCycle/b" },
        b: { ...token(null, "color", "Pointer cycle B.", "/tokens/color/pointerCycle/b"), $ref: "/tokens/color/pointerCycle/a" }
      };
      break;
    case "circular-extends.source.fixture.json":
      fixture.tokens.spacing.cycleA = {
        $extends: "/tokens/spacing/cycleB",
        sourceRef: "fixture://p0/source#/tokens/spacing/cycleA"
      };
      fixture.tokens.spacing.cycleB = {
        $extends: "/tokens/spacing/cycleA",
        sourceRef: "fixture://p0/source#/tokens/spacing/cycleB"
      };
      break;
    case "invalid-extends-target-type.source.fixture.json":
      fixture.tokens.spacing.compact.$extends = "/tokens/spacing/base/sm";
      break;
    case "composite-missing-subvalue.source.fixture.json":
      delete fixture.tokens.typography.heading.$value.lineHeight;
      break;
    case "composite-extra-subvalue.source.fixture.json":
      fixture.tokens.shadow.raised.$value.opacity = 0.4;
      break;
    case "composite-incompatible-subvalue.source.fixture.json":
      fixture.tokens.shadow.raised.$value.blur = "18px";
      break;
    case "duplicate-component-id.source.fixture.json":
      fixture.components.push({
        ...deepClone(fixture.components[0]),
        sourceRef: "fixture://p0/source#/components/3"
      });
      break;
    default:
      throw new Error(`unknown source mutation ${file}`);
  }
  fixture.sourceRefs = collectSourceRefs(fixture);
  return fixture;
}
