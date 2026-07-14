import path from "node:path";
import { deepClone, writeCanonicalJson } from "./p2-contract.js";

export const CI_TIMESTAMP = "1970-01-01T00:00:00.000Z";
export const CI_VERSION = "0.0.0";
export const CI_SCHEMA_ROOT = "schemas";
export const CI_FIXTURE_ROOT = "fixtures/capability-index";
export const CI_ARTIFACT_ROOT = "artifacts/capability-index";
export const CI_COMMAND = "interfacectl surfaces capabilities proof";
export const CI_VERIFY_COMMAND = "interfacectl surfaces capabilities verify";
export const CI_CONTRACT_ID = "surfaces-capability-index-proof";
export const CI_TARGET_ID = "capability-index";
export const CI_ENVIRONMENT = Object.freeze({ generatedAt: CI_TIMESTAMP, host: null });

export const CI_SCHEMA_FILES = [
  "capability-declaration.v0.schema.json",
  "capability-index.v0.schema.json",
  "capability-index-report.v0.schema.json",
  "capability-index-evidence.v0.schema.json",
  "capability-index-expectations.v0.schema.json",
  "capability-index-diagnostics.v0.schema.json",
  "capability-index-preflight-mutation.v0.schema.json"
];

export const CI_GENERATED_ARTIFACTS = [
  "capability-index.json",
  "capability-index-report.json",
  "evidence.json"
];
export const CI_ARTIFACT_PATHS = CI_GENERATED_ARTIFACTS.map((file) => `${CI_ARTIFACT_ROOT}/${file}`);

const IMPLEMENTED_CAPABILITIES = [
  implemented({
    capabilityId: "p0-catalog-contract",
    displayName: "P0 synthetic catalog contract",
    roadmapPhase: "P0",
    proofMode: "synthetic",
    userValue: "Defines the governed generation boundary for Surface IR.",
    scopeStatement: "Synthetic source material compiles into a governed catalog with deterministic diagnostics and evidence.",
    authorityRole: "catalog-contract-proof",
    nonCapabilities: ["real design-system ingestion", "production rendering"],
    lifecycleRoles: ["generate-within-bounds", "govern-change"],
    proofCommand: "interfacectl surfaces proof",
    packageProofScript: "proof:p0",
    ciGate: "npm run check:p0:ci",
    evidencePath: "artifacts/p0/evidence.json",
    evidenceSchemaId: "evidence.v0",
    inputPaths: ["fixtures/p0"],
    outputPaths: ["artifacts/p0/adapter-diagnostics.json", "artifacts/p0/governed-catalog.json", "artifacts/p0/evidence.json"],
    diagnosticSchemaPath: "schemas/diagnostics.v0.schema.json",
    demoPaths: ["demo/p0/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/runtime-catalog-v0.md"]
  }),
  implemented({
    capabilityId: "p1-web-static",
    displayName: "P1 web-static runtime projection",
    roadmapPhase: "P1",
    proofMode: "static",
    userValue: "Projects governed catalog records into inert runtime-facing plans.",
    scopeStatement: "A web-static projection and render plans are derived from accepted P0 catalog evidence without becoming authority.",
    authorityRole: "derived-runtime-consumer",
    nonCapabilities: ["general renderer", "runtime authority"],
    lifecycleRoles: ["generate-within-bounds", "ship-proven-output"],
    proofCommand: "interfacectl surfaces adapter proof",
    packageProofScript: "proof:p1",
    ciGate: "npm run check:p1:ci",
    evidencePath: "artifacts/p1/evidence.json",
    evidenceSchemaId: "runtime-adapter-evidence.v0",
    inputPaths: ["artifacts/p0/governed-catalog.json", "fixtures/p1"],
    outputPaths: ["artifacts/p1/runtime-projection.json", "artifacts/p1/runtime-adapter-report.json", "artifacts/p1/evidence.json"],
    diagnosticSchemaPath: "schemas/runtime-adapter-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/p1/runtime-adapter-report.json"],
    demoPaths: ["demo/p1/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/p1/README.md"],
    dependencies: { evidence: ["p0-catalog-contract"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "p2-spectrum-ingestion",
    displayName: "P2 bounded Spectrum ingestion",
    roadmapPhase: "P2",
    proofMode: "bounded-local",
    userValue: "Compiles a bounded real design-system source into governed catalog records with source refs.",
    scopeStatement: "Ingests the locked Adobe Spectrum Design Data package only for button and in-line-alert from a manifest-declared local bundle.",
    authorityRole: "declared-source-ingestion-proof",
    nonCapabilities: ["full Spectrum support", "live source APIs"],
    lifecycleRoles: ["connect-authority", "govern-change"],
    proofCommand: "interfacectl surfaces ingest proof",
    packageProofScript: "proof:p2",
    ciGate: "npm run check:p2:ci",
    evidencePath: "artifacts/p2/evidence.json",
    evidenceSchemaId: "design-system-ingestion-evidence.v0",
    inputPaths: ["sources/p2/design-system-source", "fixtures/p2"],
    outputPaths: ["artifacts/p2/governed-catalog.json", "artifacts/p2/ingestion-report.json", "artifacts/p2/evidence.json"],
    diagnosticSchemaPath: "schemas/design-system-ingestion-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/p2/ingestion-report.json"],
    demoPaths: ["demo/p2/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/p2/README.md"],
    dependencies: { evidence: [], phaseGate: ["p1-web-static"], compatibility: [] }
  }),
  implemented({
    capabilityId: "p3-agent-orchestration",
    displayName: "P3 inert agent orchestration",
    roadmapPhase: "P3",
    proofMode: "static",
    userValue: "Describes bounded agent work without authorizing execution.",
    scopeStatement: "Produces an inert registry, task DAG, work orders, review queue, report, and evidence from accepted P2 evidence.",
    authorityRole: "inert-orchestration-consumer",
    nonCapabilities: ["live agents", "tool or connector execution"],
    lifecycleRoles: ["generate-within-bounds", "review-with-confidence"],
    proofCommand: "interfacectl surfaces agents proof",
    packageProofScript: "proof:p3",
    ciGate: "npm run check:p3:ci",
    evidencePath: "artifacts/p3/evidence.json",
    evidenceSchemaId: "agent-orchestration-evidence.v0",
    inputPaths: ["artifacts/p2/evidence.json", "artifacts/p2/governed-catalog.json", "fixtures/p3"],
    outputPaths: ["artifacts/p3/agent-orchestration-report.json", "artifacts/p3/review-queue.json", "artifacts/p3/evidence.json"],
    diagnosticSchemaPath: "schemas/agent-orchestration-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/p3/agent-orchestration-report.json"],
    demoPaths: ["demo/p3/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/p3/README.md"],
    dependencies: { evidence: ["p2-spectrum-ingestion"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "p4-review-judgment",
    displayName: "P4 deterministic review and judgment",
    roadmapPhase: "P4",
    proofMode: "report-only",
    userValue: "Preserves review decisions and evaluation findings as deterministic evidence.",
    scopeStatement: "Produces SurfaceOps-shaped decisions and JudgmentKit-shaped findings without live persistence or invocation.",
    authorityRole: "review-and-evaluation-consumer",
    nonCapabilities: ["live SurfaceOps", "live JudgmentKit"],
    lifecycleRoles: ["review-with-confidence", "govern-change"],
    proofCommand: "interfacectl surfaces review proof",
    packageProofScript: "proof:p4",
    ciGate: "npm run check:p4:ci",
    evidencePath: "artifacts/p4/evidence.json",
    evidenceSchemaId: "review-judgment-evidence.v0",
    expectedPromotionStatus: "blocked",
    inputPaths: ["artifacts/p3/evidence.json", "artifacts/p3/review-queue.json", "fixtures/p4"],
    outputPaths: ["artifacts/p4/review-judgment-report.json", "artifacts/p4/judgmentkit-evaluation-report.json", "artifacts/p4/evidence.json"],
    diagnosticSchemaPath: "schemas/review-judgment-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/p4/review-judgment-report.json", "artifacts/p4/judgmentkit-evaluation-report.json"],
    demoPaths: ["demo/p4/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/p4/README.md"],
    dependencies: { evidence: ["p3-agent-orchestration"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "p5-protocol-static",
    displayName: "P5 surfaces-protocol-static",
    roadmapPhase: "P5",
    proofMode: "static",
    userValue: "Creates an inert protocol-boundary handoff from accepted authority.",
    scopeStatement: "Emits deterministic protocol projections and envelopes for the bounded static target.",
    authorityRole: "derived-protocol-consumer",
    nonCapabilities: ["public protocol API", "A2UI conformance"],
    lifecycleRoles: ["ship-proven-output", "govern-change"],
    proofCommand: "interfacectl surfaces protocol proof",
    packageProofScript: "proof:p5:protocol",
    ciGate: "npm run check:p5:protocol:ci",
    evidencePath: "artifacts/p5/protocol/evidence.json",
    evidenceSchemaId: "protocol-adapter-evidence.v0",
    inputPaths: ["artifacts/p2/evidence.json", "artifacts/p4/evidence.json", "fixtures/p5/protocol"],
    outputPaths: ["artifacts/p5/protocol/protocol-adapter-report.json", "artifacts/p5/protocol/evidence.json"],
    diagnosticSchemaPath: "schemas/protocol-adapter-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/p5/protocol/protocol-adapter-report.json"],
    demoPaths: ["demo/p5/protocol/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/p5/README.md"],
    dependencies: { evidence: ["p2-spectrum-ingestion", "p4-review-judgment"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "p5-native-static",
    displayName: "P5 surfaces-native-static",
    roadmapPhase: "P5",
    proofMode: "static",
    userValue: "Creates an inert Surfaces-native handoff with protocol compatibility preflight.",
    scopeStatement: "Emits deterministic native projections and packets for the bounded static target.",
    authorityRole: "derived-native-consumer",
    nonCapabilities: ["native SDK", "live native runtime"],
    lifecycleRoles: ["ship-proven-output", "govern-change"],
    proofCommand: "interfacectl surfaces native proof",
    packageProofScript: "proof:p5:native",
    ciGate: "npm run check:p5:native:ci",
    evidencePath: "artifacts/p5/native/evidence.json",
    evidenceSchemaId: "surfaces-native-evidence.v0",
    inputPaths: ["artifacts/p2/evidence.json", "artifacts/p4/evidence.json", "artifacts/p5/protocol/evidence.json", "fixtures/p5/native"],
    outputPaths: ["artifacts/p5/native/surfaces-native-report.json", "artifacts/p5/native/evidence.json"],
    diagnosticSchemaPath: "schemas/surfaces-native-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/p5/native/surfaces-native-report.json"],
    demoPaths: ["demo/p5/native/index.html"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/p5/README.md"],
    dependencies: { evidence: ["p2-spectrum-ingestion", "p4-review-judgment"], phaseGate: [], compatibility: ["p5-protocol-static"] }
  }),
  implemented({
    capabilityId: "declared-source-conformance",
    displayName: "Declared source conformance",
    roadmapPhase: "Target",
    proofMode: "report-only",
    userValue: "Makes source precedence, conflicts, exceptions, review, and expiry inspectable.",
    scopeStatement: "Checks one manifest-declared local source bundle against accepted P2 catalog and evidence.",
    authorityRole: "declared-source-policy-consumer",
    nonCapabilities: ["arbitrary source connector", "live source crawling"],
    lifecycleRoles: ["connect-authority", "govern-change"],
    proofCommand: "interfacectl surfaces source-conformance proof",
    packageProofScript: "proof:source-conformance",
    ciGate: "npm run check:source-conformance:ci",
    evidencePath: "artifacts/source-conformance/evidence.json",
    evidenceSchemaId: "source-conformance-evidence.v0",
    inputPaths: ["artifacts/p2/evidence.json", "artifacts/p2/governed-catalog.json", "sources/source-conformance", "fixtures/source-conformance"],
    outputPaths: ["artifacts/source-conformance/source-conformance-report.json", "artifacts/source-conformance/source-review-queue.json", "artifacts/source-conformance/evidence.json"],
    diagnosticSchemaPath: "schemas/source-conformance-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/source-conformance/source-conformance-report.json"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/source-conformance/README.md"],
    dependencies: { evidence: ["p2-spectrum-ingestion"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "designer-workflow-trace",
    displayName: "Designer workflow trace",
    roadmapPhase: "Target",
    proofMode: "report-only",
    userValue: "Traces one designer scenario across accepted authority, review, and target handoff evidence.",
    scopeStatement: "Indexes a bounded Button workflow trace without becoming upstream or product authority.",
    authorityRole: "evidence-index-consumer",
    nonCapabilities: ["product workflow implementation", "customer validation"],
    lifecycleRoles: ["know-whats-proven", "govern-change"],
    proofCommand: "interfacectl surfaces designer-workflow-trace proof",
    packageProofScript: "proof:designer-workflow-trace",
    ciGate: "npm run check:designer-workflow-trace:ci",
    evidencePath: "artifacts/designer-workflow-trace/evidence.json",
    evidenceSchemaId: "designer-workflow-trace-evidence.v0",
    expectedPromotionStatus: "blocked",
    inputPaths: ["artifacts/p2/evidence.json", "artifacts/source-conformance/evidence.json", "artifacts/p3/evidence.json", "artifacts/p4/evidence.json", "artifacts/p5/protocol/evidence.json", "artifacts/p5/native/evidence.json", "fixtures/designer-workflow-trace"],
    outputPaths: ["artifacts/designer-workflow-trace/designer-workflow-trace-report.json", "artifacts/designer-workflow-trace/evidence.json"],
    diagnosticSchemaPath: "schemas/designer-workflow-trace-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/designer-workflow-trace/designer-workflow-trace-report.json"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/product-designer-workflow-trace.md"],
    dependencies: { evidence: ["p2-spectrum-ingestion", "p3-agent-orchestration", "p4-review-judgment", "p5-protocol-static", "p5-native-static", "declared-source-conformance"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "surfaceops-kanban-static",
    displayName: "SurfaceOps kanban static",
    roadmapPhase: "Target",
    proofMode: "static",
    userValue: "Projects accepted review evidence into an inspectable inert board model.",
    scopeStatement: "Produces a hash-bound static SurfaceOps board projection over a local kanban substrate contract.",
    authorityRole: "derived-review-board-consumer",
    nonCapabilities: ["live kanban writes", "production SurfaceOps"],
    lifecycleRoles: ["review-with-confidence", "ship-proven-output"],
    proofCommand: "interfacectl surfaces surfaceops-kanban-static proof",
    packageProofScript: "proof:surfaceops-kanban-static",
    ciGate: "npm run check:surfaceops-kanban-static:ci",
    evidencePath: "artifacts/surfaceops-kanban-static/evidence.json",
    evidenceSchemaId: "surfaceops-kanban-evidence.v0",
    inputPaths: ["artifacts/p3/evidence.json", "artifacts/p4/evidence.json", "sources/surfaceops-kanban-static", "fixtures/surfaceops-kanban-static"],
    outputPaths: ["artifacts/surfaceops-kanban-static/surfaceops-kanban-adapter-report.json", "artifacts/surfaceops-kanban-static/evidence.json"],
    diagnosticSchemaPath: "schemas/surfaceops-kanban-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/surfaceops-kanban-static/surfaceops-kanban-adapter-report.json"],
    runtimeEvidencePaths: ["output/playwright/surfaceops-kanban-static"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/surfaceops-kanban-static.md"],
    dependencies: { evidence: ["p3-agent-orchestration", "p4-review-judgment"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "surfaceops-kanban-live",
    displayName: "SurfaceOps kanban live",
    roadmapPhase: "Target",
    proofMode: "local-loopback",
    userValue: "Proves a bounded local-live kanban read, write, event, and restart path.",
    scopeStatement: "Exercises a hash-bound local kanban API/browser boundary without production claims.",
    authorityRole: "local-loopback-adapter-consumer",
    nonCapabilities: ["production kanban sync", "production authentication"],
    lifecycleRoles: ["review-with-confidence", "ship-proven-output"],
    proofCommand: "interfacectl surfaces surfaceops-kanban-live proof",
    packageProofScript: "proof:surfaceops-kanban-live",
    ciGate: "npm run check:surfaceops-kanban-live:ci",
    evidencePath: "artifacts/surfaceops-kanban-live/evidence.json",
    evidenceSchemaId: "surfaceops-kanban-live-evidence.v0",
    inputPaths: ["artifacts/p3/evidence.json", "artifacts/p4/evidence.json", "sources/surfaceops-kanban-live", "fixtures/surfaceops-kanban-live"],
    outputPaths: ["artifacts/surfaceops-kanban-live/surfaceops-kanban-live-adapter-report.json", "artifacts/surfaceops-kanban-live/evidence.json"],
    diagnosticSchemaPath: "schemas/surfaceops-kanban-live-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/surfaceops-kanban-live/surfaceops-kanban-live-adapter-report.json"],
    runtimeEvidencePaths: ["output/playwright/surfaceops-kanban-live"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/surfaceops-kanban-live.md"],
    dependencies: { evidence: ["p3-agent-orchestration", "p4-review-judgment"], phaseGate: [], compatibility: [] }
  }),
  implemented({
    capabilityId: "surfaceops-designer-review-ui",
    displayName: "SurfaceOps designer review UI",
    roadmapPhase: "Target",
    proofMode: "local-loopback",
    userValue: "Lets a designer inspect a blocked scenario and record the allowed rationale-bound outcome.",
    scopeStatement: "Proves a local-loopback inspection workbench and blocked receipt mirror for Button variants.",
    authorityRole: "local-loopback-review-consumer",
    nonCapabilities: ["production SurfaceOps", "approved variant handoff"],
    lifecycleRoles: ["review-with-confidence", "ship-proven-output"],
    proofCommand: "interfacectl surfaces surfaceops-designer-review-ui proof",
    packageProofScript: "proof:surfaceops-designer-review-ui",
    ciGate: "npm run check:surfaceops-designer-review-ui:ci",
    evidencePath: "artifacts/surfaceops-designer-review-ui/evidence.json",
    evidenceSchemaId: "surfaceops-designer-review-ui-evidence.v0",
    expectedPromotionStatus: "blocked",
    inputPaths: ["artifacts/designer-workflow-trace/evidence.json", "artifacts/p4/evidence.json", "artifacts/surfaceops-kanban-live/evidence.json", "fixtures/surfaceops-designer-review-ui"],
    outputPaths: ["artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json", "artifacts/surfaceops-designer-review-ui/evidence.json"],
    diagnosticSchemaPath: "schemas/surfaceops-designer-review-ui-diagnostics.v0.schema.json",
    reportPaths: ["artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json"],
    demoPaths: ["demo/surfaceops-designer-review-ui/index.html"],
    runtimeEvidencePaths: ["output/playwright/surfaceops-designer-review-ui"],
    documentationRefs: ["PLAN.md", "VISION.md", "plans/surfaceops-designer-review-ui.md"],
    dependencies: { evidence: ["p4-review-judgment", "designer-workflow-trace", "surfaceops-kanban-live"], phaseGate: [], compatibility: [] }
  })
];

const PLANNED_CAPABILITIES = [
  planned("self-serve-designer-product", "Self-serve designer product", "Let teams connect authority and complete the governed workflow without repository-specific implementation work."),
  planned("production-surfaceops", "Production SurfaceOps", "Operate governed review with production storage, permissions, deployment, and workflow boundaries."),
  planned("production-kanban-sync", "Production kanban sync, auth, and persistence", "Connect SurfaceOps to a production collaboration substrate with explicit identity and conflict handling."),
  planned("live-judgmentkit", "Live JudgmentKit", "Run live evaluation only inside a separately proved authority and persistence boundary."),
  planned("production-adapters-apis-sdks", "Production adapters, APIs, and SDKs", "Deliver accepted contracts through target-specific production integration surfaces."),
  planned("live-protocol-native-runtimes", "Live protocol and native runtimes", "Consume proven envelopes or packets in separately governed live runtimes."),
  planned("a2ui-export-conformance", "A2UI export or conformance", "Add A2UI only through its own schema, fixtures, diagnostics, command, report, evidence, and CI proof.")
];

export const CI_DIAGNOSTIC_ROWS = [
  diagnostic("CAPABILITY_TARGET_MISSING", "A required implemented target is absent", "A required implemented target is missing from the capability index.", "inventory", "invalid/missing-target.capability-declaration.json", "/implementedCapabilities"),
  diagnostic("CAPABILITY_EVIDENCE_MISSING", "Implemented target evidence cannot be read", "Implemented capability evidence is missing.", "preflight", "mutations/missing-evidence.capability-index-preflight-mutation.json", "/evidencePath"),
  diagnostic("CAPABILITY_EVIDENCE_HASH_MISMATCH", "Target evidence or its closure does not match", "Capability evidence or a referenced artifact does not match the current repository bytes.", "integrity", "mutations/upstream-hash-mismatch.capability-index-preflight-mutation.json", "/expectedHash"),
  diagnostic("CAPABILITY_STATUS_MISMATCH", "Declared proof or promotion status differs from evidence", "Indexed proof or promotion status does not match accepted evidence.", "status", "invalid/status-mismatch.capability-declaration.json", "/implementedCapabilities/4/expectedPromotionStatus"),
  diagnostic("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", "An implemented row lacks a complete proof shape", "An implemented capability claim lacks a complete passing proof shape.", "declaration", "invalid/implemented-without-evidence.capability-declaration.json", "/implementedCapabilities/0/evidencePath"),
  diagnostic("CAPABILITY_PLANNED_CLAIM_ESCALATION", "A planned row declares runnable or proven behavior", "A planned capability cannot declare proof, availability, or production behavior.", "declaration", "invalid/planned-claim-escalation.capability-declaration.json", "/plannedCapabilities/0/proofCommand"),
  diagnostic("CAPABILITY_DEPENDENCY_INVALID", "A dependency is missing, cyclic, unknown, or out of order", "Capability dependencies are missing, unknown, cyclic, or out of deterministic order.", "dependency", "invalid/dependency-invalid.capability-declaration.json", "/implementedCapabilities/1/dependencies/evidence/0"),
  diagnostic("CAPABILITY_AUTHORITY_ESCALATION", "An index row claims authority", "The capability index cannot add or override product, catalog, proof, policy, or review authority.", "authority", "invalid/authority-escalation.capability-declaration.json", "/implementedCapabilities/0/canAddAuthority"),
  diagnostic("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", "Capability-index evidence self hash does not match", "Capability-index evidence does not match the declared inputs and generated artifacts.", "evidence", "mutations/hash-mismatch.capability-index-evidence.json", "/hash"),
];

export function capabilityDeclarations() {
  return deepClone(IMPLEMENTED_CAPABILITIES);
}

export function plannedCapabilityGroups() {
  return deepClone(PLANNED_CAPABILITIES);
}

export function diagnosticsRegistry() {
  return deepClone(CI_DIAGNOSTIC_ROWS);
}

export function defaultProofArgs() {
  return { fixture: CI_FIXTURE_ROOT, out: CI_ARTIFACT_ROOT };
}

export function defaultVerifyArgs() {
  return {
    index: `${CI_ARTIFACT_ROOT}/capability-index.json`,
    evidence: `${CI_ARTIFACT_ROOT}/evidence.json`
  };
}

export function capabilitySchemaPaths() {
  return CI_SCHEMA_FILES.map((file) => `${CI_SCHEMA_ROOT}/${file}`);
}

export function capabilityFixturePaths() {
  return [
    `${CI_FIXTURE_ROOT}/capabilities.fixture.json`,
    `${CI_FIXTURE_ROOT}/expectations.manifest.json`,
    ...expectationRows().map((row) => row.fixturePath)
  ];
}

export function schemaIdForCapabilityPath(artifactPath) {
  const file = artifactPath.split("/").at(-1);
  if (CI_SCHEMA_FILES.includes(file)) return file.replace(/\.schema\.json$/, "");
  if (file === "capabilities.fixture.json" || file?.endsWith(".capability-declaration.json")) return "capability-declaration.v0";
  if (file === "expectations.manifest.json") return "capability-index-expectations.v0";
  if (file?.endsWith(".capability-index-preflight-mutation.json")) return "capability-index-preflight-mutation.v0";
  if (file === "capability-index.json") return "capability-index.v0";
  if (file === "capability-index-report.json") return "capability-index-report.v0";
  if (file === "evidence.json" || file?.endsWith(".capability-index-evidence.json")) return "capability-index-evidence.v0";
  return null;
}

export async function materializeCapabilityIndexContract(cwd) {
  for (const [file, schema] of Object.entries(buildCapabilityIndexSchemas())) {
    await writeCanonicalJson(path.join(cwd, CI_SCHEMA_ROOT, file), schema);
  }
  for (const [file, fixture] of Object.entries(buildCapabilityIndexFixtures())) {
    await writeCanonicalJson(path.join(cwd, CI_FIXTURE_ROOT, file), fixture);
  }
}

export function buildCapabilityIndexSchemas() {
  return {
    "capability-declaration.v0.schema.json": declarationSchema(),
    "capability-index.v0.schema.json": indexSchema(),
    "capability-index-report.v0.schema.json": reportSchema(),
    "capability-index-evidence.v0.schema.json": evidenceSchema(),
    "capability-index-expectations.v0.schema.json": expectationsSchema(),
    "capability-index-diagnostics.v0.schema.json": diagnosticsSchema(),
    "capability-index-preflight-mutation.v0.schema.json": preflightMutationSchema()
  };
}

export function buildCapabilityIndexFixtures() {
  const current = declarationFixture("current-capability-inventory");
  const fixtures = {
    "capabilities.fixture.json": current,
    "expectations.manifest.json": expectationsManifest(),
    "valid/complete-current-inventory.capability-declaration.json": declarationFixture("complete-current-inventory"),
    "review/blocked-promotion-indexed.capability-declaration.json": declarationFixture("blocked-promotion-indexed"),
    "invalid/missing-target.capability-declaration.json": declarationFixture("missing-target"),
    "invalid/implemented-without-evidence.capability-declaration.json": declarationFixture("implemented-without-evidence"),
    "invalid/planned-claim-escalation.capability-declaration.json": declarationFixture("planned-claim-escalation"),
    "invalid/status-mismatch.capability-declaration.json": declarationFixture("status-mismatch"),
    "invalid/dependency-invalid.capability-declaration.json": declarationFixture("dependency-invalid"),
    "invalid/authority-escalation.capability-declaration.json": declarationFixture("authority-escalation"),
    "mutations/missing-evidence.capability-index-preflight-mutation.json": preflightMutation("missing-evidence"),
    "mutations/upstream-hash-mismatch.capability-index-preflight-mutation.json": preflightMutation("upstream-hash-mismatch"),
    "mutations/hash-mismatch.capability-index-evidence.json": mutatedEvidenceFixture()
  };
  fixtures["invalid/missing-target.capability-declaration.json"].implementedCapabilities.pop();
  delete fixtures["invalid/implemented-without-evidence.capability-declaration.json"].implementedCapabilities[0].evidencePath;
  fixtures["invalid/planned-claim-escalation.capability-declaration.json"].plannedCapabilities[0].proofCommand = "interfacectl surfaces product proof";
  fixtures["invalid/status-mismatch.capability-declaration.json"].implementedCapabilities[4].expectedPromotionStatus = "allowed";
  fixtures["invalid/dependency-invalid.capability-declaration.json"].implementedCapabilities[1].dependencies.evidence = ["unknown-target"];
  fixtures["invalid/authority-escalation.capability-declaration.json"].implementedCapabilities[0].canAddAuthority = true;
  return fixtures;
}

function implemented(input) {
  return {
    capabilityId: input.capabilityId,
    displayName: input.displayName,
    kind: "proof-target",
    roadmapPhase: input.roadmapPhase,
    implementationStatus: "implemented",
    proofMode: input.proofMode,
    userValue: input.userValue,
    scopeStatement: input.scopeStatement,
    authorityRole: input.authorityRole,
    canAddAuthority: false,
    nonCapabilities: input.nonCapabilities,
    lifecycleRoles: input.lifecycleRoles,
    proofCommand: input.proofCommand,
    packageProofScript: input.packageProofScript,
    ciGate: input.ciGate,
    evidencePath: input.evidencePath,
    evidenceSchemaId: input.evidenceSchemaId,
    expectedEvidenceStatus: "pass",
    expectedPromotionStatus: input.expectedPromotionStatus || "review_required",
    inputPaths: sorted(input.inputPaths),
    outputPaths: sorted(input.outputPaths),
    diagnosticSchemaPath: input.diagnosticSchemaPath,
    reportPaths: sorted(input.reportPaths || []),
    demoPaths: sorted(input.demoPaths || []),
    runtimeEvidencePaths: sorted(input.runtimeEvidencePaths || []),
    documentationRefs: sorted(input.documentationRefs),
    dependencies: input.dependencies || { evidence: [], phaseGate: [], compatibility: [] },
    provenance: provenance(["VISION.md", "PLAN.md", ...input.documentationRefs])
  };
}

function planned(capabilityId, displayName, userValue) {
  return {
    capabilityId,
    displayName,
    kind: "planned-group",
    roadmapPhase: "Horizon",
    implementationStatus: "planned",
    proofMode: "planned",
    evidenceStatus: "not_applicable",
    promotionStatus: "not_applicable",
    userValue,
    scopeStatement: `${displayName} remains planned until a target-specific proof shape and passing evidence exist.`,
    authorityRole: "roadmap-visibility-only",
    canAddAuthority: false,
    nonCapabilities: ["implemented behavior", "current availability"],
    lifecycleRoles: ["roadmap-visibility"],
    documentationRefs: ["VISION.md"],
    dependencies: { evidence: [], phaseGate: [], compatibility: [] },
    provenance: provenance(["VISION.md"])
  };
}

function declarationFixture(fixtureId) {
  return {
    schemaId: "capability-declaration.v0",
    version: CI_VERSION,
    fixtureId,
    targetId: CI_TARGET_ID,
    implementedCapabilities: capabilityDeclarations(),
    plannedCapabilities: plannedCapabilityGroups(),
    provenance: provenance(["VISION.md", "PLAN.md", "plans/capability-index.md"])
  };
}

function preflightMutation(mutation) {
  const value = {
    schemaId: "capability-index-preflight-mutation.v0",
    version: CI_VERSION,
    command: CI_COMMAND,
    mutation,
    status: "invalid",
    evidencePath: IMPLEMENTED_CAPABILITIES[0].evidencePath,
    expectedHash: "0".repeat(64),
    provenance: provenance([`${CI_FIXTURE_ROOT}/capabilities.fixture.json`])
  };
  if (mutation === "missing-evidence") value.evidencePath = "artifacts/missing/evidence.json";
  return value;
}

function mutatedEvidenceFixture() {
  const fixturePath = `${CI_FIXTURE_ROOT}/mutations/hash-mismatch.capability-index-evidence.json`;
  return {
    contractId: CI_CONTRACT_ID,
    schemaId: "capability-index-evidence.v0",
    version: CI_VERSION,
    runId: "capability-index-mutation-hash-mismatch",
    checkedAt: CI_TIMESTAMP,
    command: CI_COMMAND,
    args: defaultProofArgs(),
    environment: CI_ENVIRONMENT,
    schemaClosure: [],
    fixtureRefs: [],
    boundaryRefs: IMPLEMENTED_CAPABILITIES.map((row) => fixtureArtifactRef(row.evidencePath, row.evidenceSchemaId)),
    artifacts: [
      fixtureArtifactRef(`${CI_ARTIFACT_ROOT}/capability-index.json`, "capability-index.v0"),
      fixtureArtifactRef(`${CI_ARTIFACT_ROOT}/capability-index-report.json`, "capability-index-report.v0"),
      fixtureArtifactRef(fixturePath, "capability-index-evidence.v0")
    ],
    diagnostics: [],
    diagnosticsRegistry: diagnosticsRegistry(),
    validationResults: [],
    status: "pass",
    promotionStatus: "allowed",
    provenance: provenance([`${CI_FIXTURE_ROOT}/capabilities.fixture.json`])
  };
}

function fixtureArtifactRef(artifactPath, schemaId) {
  return {
    path: artifactPath,
    schemaId,
    hashAlgorithm: "sha256",
    hash: "0".repeat(64),
    provenance: provenance([artifactPath])
  };
}

function expectationsManifest() {
  return {
    schemaId: "capability-index-expectations.v0",
    version: CI_VERSION,
    fixtureRoot: CI_FIXTURE_ROOT,
    artifactRoot: CI_ARTIFACT_ROOT,
    schemaRoot: CI_SCHEMA_ROOT,
    inputs: capabilityFixturePaths().filter((entry) => !entry.endsWith("expectations.manifest.json")),
    artifactOrder: CI_GENERATED_ARTIFACTS.map((file) => `${CI_ARTIFACT_ROOT}/${file}`),
    diagnosticsRegistry: diagnosticsRegistry(),
    expectations: expectationRows(),
    runExpectation: { status: "pass", promotionStatus: "allowed" }
  };
}

function expectationRows() {
  return [
    expectation("valid/complete-current-inventory.capability-declaration.json", "declaration", "valid", [], "allowed"),
    expectation("review/blocked-promotion-indexed.capability-declaration.json", "status", "review_required", [], "review_required"),
    expectation("invalid/missing-target.capability-declaration.json", "inventory", "invalid", ["CAPABILITY_TARGET_MISSING"], "blocked"),
    expectation("invalid/implemented-without-evidence.capability-declaration.json", "declaration", "invalid", ["CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN"], "blocked"),
    expectation("invalid/planned-claim-escalation.capability-declaration.json", "declaration", "invalid", ["CAPABILITY_PLANNED_CLAIM_ESCALATION"], "blocked"),
    expectation("invalid/status-mismatch.capability-declaration.json", "status", "invalid", ["CAPABILITY_STATUS_MISMATCH"], "blocked"),
    expectation("invalid/dependency-invalid.capability-declaration.json", "dependency", "invalid", ["CAPABILITY_DEPENDENCY_INVALID"], "blocked"),
    expectation("invalid/authority-escalation.capability-declaration.json", "authority", "invalid", ["CAPABILITY_AUTHORITY_ESCALATION"], "blocked"),
    expectation("mutations/missing-evidence.capability-index-preflight-mutation.json", "preflight", "invalid", ["CAPABILITY_EVIDENCE_MISSING"], "blocked"),
    expectation("mutations/upstream-hash-mismatch.capability-index-preflight-mutation.json", "integrity", "invalid", ["CAPABILITY_EVIDENCE_HASH_MISMATCH"], "blocked"),
    expectation("mutations/hash-mismatch.capability-index-evidence.json", "evidence", "invalid", ["CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH"], "blocked")
  ];
}

function expectation(relativePath, stage, expectedResult, diagnosticCodes, promotionStatus) {
  return {
    fixturePath: `${CI_FIXTURE_ROOT}/${relativePath}`,
    stage,
    expectedResult,
    diagnosticCodes,
    promotionStatus
  };
}

function diagnostic(code, trigger, canonicalMessage, stage, fixtureCoverage, jsonPointer) {
  return {
    code,
    trigger,
    canonicalMessage,
    stage,
    severity: "error",
    artifactPath: `${CI_FIXTURE_ROOT}/${fixtureCoverage}`,
    jsonPointer,
    sourceRef: null,
    validationResult: "invalid",
    promotionStatus: "blocked",
    fixtureCoverage
  };
}

function provenance(sourceRefs) {
  return {
    method: "deterministic-materialization",
    sourceRefs: [...new Set(sourceRefs)].sort(),
    generatedAt: CI_TIMESTAMP,
    host: null
  };
}

function sorted(values) {
  return [...values].sort();
}

const PATH_PATTERN = "^[A-Za-z0-9@+_~-][A-Za-z0-9@+._~-]*(?:/[A-Za-z0-9@+_~-][A-Za-z0-9@+._~-]*)*$";
const ID_PATTERN = "^[a-z0-9][a-z0-9-]*$";
const HASH_PATTERN = "^[a-f0-9]{64}$";

function objectSchema(schemaId, properties, required = Object.keys(properties)) {
  return {
    ...(schemaId ? { $schema: "https://json-schema.org/draft/2020-12/schema", $id: schemaId } : {}),
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

function stringArray({ minItems = 0, pathItems = false } = {}) {
  return {
    type: "array",
    minItems,
    uniqueItems: true,
    items: pathItems ? { type: "string", pattern: PATH_PATTERN } : { type: "string", minLength: 1 }
  };
}

function provenanceSchema() {
  return objectSchema(null, {
    method: { const: "deterministic-materialization" },
    sourceRefs: stringArray({ minItems: 1, pathItems: true }),
    generatedAt: { const: CI_TIMESTAMP },
    host: { type: "null" }
  });
}

function dependencySchema() {
  return objectSchema(null, {
    evidence: stringArray(),
    phaseGate: stringArray(),
    compatibility: stringArray()
  });
}

function implementedDeclarationSchema({ indexed = false } = {}) {
  const properties = {
    capabilityId: { type: "string", pattern: ID_PATTERN },
    displayName: { type: "string", minLength: 1 },
    kind: { const: "proof-target" },
    roadmapPhase: { enum: ["P0", "P1", "P2", "P3", "P4", "P5", "Target"] },
    implementationStatus: { const: "implemented" },
    proofMode: { enum: ["synthetic", "bounded-local", "static", "report-only", "local-loopback"] },
    userValue: { type: "string", minLength: 1 },
    scopeStatement: { type: "string", minLength: 1 },
    authorityRole: { type: "string", minLength: 1 },
    canAddAuthority: { const: false },
    nonCapabilities: stringArray({ minItems: 1 }),
    lifecycleRoles: stringArray({ minItems: 1 }),
    proofCommand: { type: "string", pattern: "^interfacectl surfaces " },
    packageProofScript: { type: "string", pattern: "^proof:" },
    ciGate: { type: "string", pattern: "^npm run check:" },
    evidencePath: { type: "string", pattern: PATH_PATTERN },
    evidenceSchemaId: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*\\.v[0-9]+$" },
    expectedEvidenceStatus: { const: "pass" },
    expectedPromotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    inputPaths: stringArray({ minItems: 1, pathItems: true }),
    outputPaths: stringArray({ minItems: 1, pathItems: true }),
    diagnosticSchemaPath: { type: "string", pattern: PATH_PATTERN },
    reportPaths: stringArray({ pathItems: true }),
    demoPaths: stringArray({ pathItems: true }),
    runtimeEvidencePaths: stringArray({ pathItems: true }),
    documentationRefs: stringArray({ minItems: 1, pathItems: true }),
    dependencies: dependencySchema(),
    provenance: provenanceSchema()
  };
  if (indexed) {
    Object.assign(properties, {
      evidenceStatus: { const: "pass" },
      promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
      evidenceHashAlgorithm: { const: "sha256" },
      evidenceHash: { type: "string", pattern: HASH_PATTERN },
      evidenceRunId: { type: "string", minLength: 1 }
    });
  }
  return objectSchema(null, properties);
}

function plannedDeclarationSchema() {
  return objectSchema(null, {
    capabilityId: { type: "string", pattern: ID_PATTERN },
    displayName: { type: "string", minLength: 1 },
    kind: { const: "planned-group" },
    roadmapPhase: { const: "Horizon" },
    implementationStatus: { const: "planned" },
    proofMode: { const: "planned" },
    evidenceStatus: { const: "not_applicable" },
    promotionStatus: { const: "not_applicable" },
    userValue: { type: "string", minLength: 1 },
    scopeStatement: { type: "string", minLength: 1 },
    authorityRole: { const: "roadmap-visibility-only" },
    canAddAuthority: { const: false },
    nonCapabilities: stringArray({ minItems: 1 }),
    lifecycleRoles: stringArray({ minItems: 1 }),
    documentationRefs: stringArray({ minItems: 1, pathItems: true }),
    dependencies: dependencySchema(),
    provenance: provenanceSchema()
  });
}

function declarationSchema() {
  return objectSchema("capability-declaration.v0", {
    schemaId: { const: "capability-declaration.v0" },
    version: { type: "string" },
    fixtureId: { type: "string", pattern: ID_PATTERN },
    targetId: { const: CI_TARGET_ID },
    implementedCapabilities: { type: "array", minItems: 1, uniqueItems: true, items: implementedDeclarationSchema() },
    plannedCapabilities: { type: "array", minItems: 1, uniqueItems: true, items: plannedDeclarationSchema() },
    provenance: provenanceSchema()
  });
}

function indexSchema() {
  return objectSchema("capability-index.v0", {
    schemaId: { const: "capability-index.v0" },
    version: { type: "string" },
    generatedAt: { const: CI_TIMESTAMP },
    environment: objectSchema(null, { generatedAt: { const: CI_TIMESTAMP }, host: { type: "null" } }),
    targetId: { const: CI_TARGET_ID },
    summary: objectSchema(null, {
      implementedCount: { const: IMPLEMENTED_CAPABILITIES.length },
      passingCount: { const: IMPLEMENTED_CAPABILITIES.length },
      plannedCount: { const: PLANNED_CAPABILITIES.length },
      allowedCount: { type: "integer", minimum: 0 },
      reviewRequiredCount: { type: "integer", minimum: 0 },
      blockedCount: { type: "integer", minimum: 0 }
    }),
    authority: objectSchema(null, {
      role: { const: "derived-discovery-only" },
      canAddAuthority: { const: false },
      selfIndexed: { const: false },
      targetEvidenceRemainsAuthority: { const: true }
    }),
    implementedCapabilities: { type: "array", minItems: IMPLEMENTED_CAPABILITIES.length, maxItems: IMPLEMENTED_CAPABILITIES.length, items: implementedDeclarationSchema({ indexed: true }) },
    plannedCapabilities: { type: "array", minItems: PLANNED_CAPABILITIES.length, maxItems: PLANNED_CAPABILITIES.length, items: plannedDeclarationSchema() },
    provenance: provenanceSchema()
  });
}

function artifactRefSchema({ nullableHash = false } = {}) {
  return objectSchema(null, {
    path: { type: "string", pattern: PATH_PATTERN },
    schemaId: { type: "string", minLength: 1 },
    hashAlgorithm: { const: "sha256" },
    hash: nullableHash ? { type: ["string", "null"], pattern: HASH_PATTERN } : { type: "string", pattern: HASH_PATTERN },
    provenance: provenanceSchema()
  });
}

function diagnosticObjectSchema() {
  return objectSchema(null, {
    code: { type: "string", pattern: "^CAPABILITY_[A-Z0-9_]+$" },
    message: { type: "string", minLength: 1 },
    stage: { type: "string", minLength: 1 },
    severity: { enum: ["error", "review"] },
    artifactPath: { type: "string", pattern: PATH_PATTERN },
    jsonPointer: { type: "string" },
    sourceRef: { type: ["string", "null"] }
  });
}

function validationResultSchema() {
  return objectSchema(null, {
    fixturePath: { type: "string", pattern: PATH_PATTERN },
    stage: { type: "string" },
    expectedResult: { enum: ["valid", "review_required", "invalid"] },
    actualResult: { enum: ["valid", "review_required", "invalid"] },
    diagnosticCodes: stringArray(),
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
  });
}

function reportSchema() {
  return objectSchema("capability-index-report.v0", {
    schemaId: { const: "capability-index-report.v0" },
    version: { type: "string" },
    runId: { type: "string", minLength: 1 },
    targetId: { const: CI_TARGET_ID },
    scopeStatement: { type: "string", minLength: 1 },
    nonAuthorityStatement: { type: "string", minLength: 1 },
    indexRef: artifactRefSchema(),
    summary: { type: "object", additionalProperties: true },
    implementedTargetResults: { type: "array", minItems: IMPLEMENTED_CAPABILITIES.length, maxItems: IMPLEMENTED_CAPABILITIES.length, items: { type: "object", additionalProperties: true } },
    plannedCapabilityResults: { type: "array", minItems: PLANNED_CAPABILITIES.length, maxItems: PLANNED_CAPABILITIES.length, items: { type: "object", additionalProperties: true } },
    validationResults: { type: "array", items: validationResultSchema() },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: CI_DIAGNOSTIC_ROWS },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  });
}

function evidenceSchema() {
  return objectSchema("capability-index-evidence.v0", {
    contractId: { const: CI_CONTRACT_ID },
    schemaId: { const: "capability-index-evidence.v0" },
    version: { type: "string" },
    runId: { type: "string", minLength: 1 },
    checkedAt: { const: CI_TIMESTAMP },
    command: { const: CI_COMMAND },
    args: { const: defaultProofArgs() },
    environment: objectSchema(null, { generatedAt: { const: CI_TIMESTAMP }, host: { type: "null" } }),
    schemaClosure: { type: "array", items: artifactRefSchema() },
    fixtureRefs: { type: "array", items: artifactRefSchema() },
    boundaryRefs: { type: "array", minItems: IMPLEMENTED_CAPABILITIES.length, maxItems: IMPLEMENTED_CAPABILITIES.length, items: artifactRefSchema() },
    artifacts: { type: "array", minItems: CI_GENERATED_ARTIFACTS.length, maxItems: CI_GENERATED_ARTIFACTS.length, prefixItems: [artifactRefSchema(), artifactRefSchema(), artifactRefSchema()], items: false },
    diagnostics: { type: "array", items: diagnosticObjectSchema() },
    diagnosticsRegistry: { const: CI_DIAGNOSTIC_ROWS },
    validationResults: { type: "array", items: validationResultSchema() },
    status: { enum: ["pass", "fail"] },
    promotionStatus: { enum: ["allowed", "review_required", "blocked"] },
    provenance: provenanceSchema()
  });
}

function expectationsSchema() {
  return objectSchema("capability-index-expectations.v0", {
    schemaId: { const: "capability-index-expectations.v0" },
    version: { type: "string" },
    fixtureRoot: { const: CI_FIXTURE_ROOT },
    artifactRoot: { const: CI_ARTIFACT_ROOT },
    schemaRoot: { const: CI_SCHEMA_ROOT },
    inputs: stringArray({ minItems: 1, pathItems: true }),
    artifactOrder: { const: CI_GENERATED_ARTIFACTS.map((file) => `${CI_ARTIFACT_ROOT}/${file}`) },
    diagnosticsRegistry: { const: CI_DIAGNOSTIC_ROWS },
    expectations: {
      type: "array",
      items: objectSchema(null, {
        fixturePath: { type: "string", pattern: PATH_PATTERN },
        stage: { type: "string" },
        expectedResult: { enum: ["valid", "review_required", "invalid"] },
        diagnosticCodes: stringArray(),
        promotionStatus: { enum: ["allowed", "review_required", "blocked"] }
      })
    },
    runExpectation: objectSchema(null, { status: { const: "pass" }, promotionStatus: { const: "allowed" } })
  });
}

function diagnosticsSchema() {
  return objectSchema("capability-index-diagnostics.v0", {
    schemaId: { const: "capability-index-diagnostics.v0" },
    version: { type: "string" },
    diagnosticsRegistry: { const: CI_DIAGNOSTIC_ROWS }
  });
}

function preflightMutationSchema() {
  return objectSchema("capability-index-preflight-mutation.v0", {
    schemaId: { const: "capability-index-preflight-mutation.v0" },
    version: { type: "string" },
    command: { const: CI_COMMAND },
    mutation: { enum: ["missing-evidence", "upstream-hash-mismatch"] },
    status: { const: "invalid" },
    evidencePath: { type: "string", pattern: PATH_PATTERN },
    expectedHash: { type: "string", pattern: HASH_PATTERN },
    provenance: provenanceSchema()
  });
}
