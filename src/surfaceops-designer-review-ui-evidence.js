import path from "node:path";
import { canonicalJson } from "./p0.js";
import { designerWorkflowTraceInternals } from "./designer-workflow-trace-proof.js";
import { p4Internals } from "./p4-proof.js";
import { surfaceopsKanbanLiveInternals } from "./surfaceops-kanban-live-proof.js";
import {
  canonicalFileHash,
  deepClone,
  readJson,
  sha256Hex
} from "./p2-contract.js";
import {
  DRUI_ACCEPTED_DWT_EVIDENCE_HASH,
  DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH,
  DRUI_ACCEPTED_P4_EVIDENCE_HASH,
  DRUI_ARTIFACT_PATHS,
  DRUI_CONTRACT_ID,
  DRUI_DWT_EVIDENCE_PATH,
  DRUI_DWT_REPORT_PATH,
  DRUI_EXPECTATION_ROWS,
  DRUI_KANBAN_LIVE_EVIDENCE_PATH,
  DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH,
  DRUI_P4_DECISION_LEDGER_PATH,
  DRUI_P4_EVIDENCE_PATH,
  DRUI_TARGET_ID,
  druiConsumedSchemaPaths,
  druiFixturePaths,
  druiSchemaPaths,
  diagnosticsRegistry,
  governanceOutcome,
  schemaIdForDesignerReviewUiPath
} from "./surfaceops-designer-review-ui-contract.js";

const HASH_PATTERN = /^[0-9a-f]{64}$/;

export const DRUI_BLOCKED_GOVERNANCE_OUTCOME = Object.freeze(governanceOutcome());

export function deriveSurfaceopsDesignerReviewGovernanceOutcome(designerEvidence, designerReport) {
  const governance = designerReport?.sourceConformanceGovernance;
  const lifecycle = governance?.exceptionLifecycle;
  if (
    designerEvidence?.status !== "pass" ||
    designerEvidence?.promotionStatus !== "blocked" ||
    designerReport?.status !== "pass" ||
    designerReport?.promotionStatus !== "blocked" ||
    governance?.targetHandoffAllowed !== false ||
    governance?.diagnosticCode !== "SOURCE_REVIEW_EXPIRED" ||
    lifecycle?.status !== "expired-blocked" ||
    lifecycle?.expiredDiagnosticCode !== "SOURCE_REVIEW_EXPIRED" ||
    lifecycle?.renewalRequiredBeforeHandoff !== true
  ) {
    throw contractError("SurfaceOps designer review UI requires the accepted expired source-review governance boundary");
  }
  return deepClone(DRUI_BLOCKED_GOVERNANCE_OUTCOME);
}

export function computeSurfaceopsDesignerReviewUiEvidenceSelfHash(evidence) {
  const clone = deepClone(evidence);
  if (!Array.isArray(clone.artifacts) || clone.artifacts.length === 0) {
    throw contractError("SurfaceOps designer review UI evidence has no final self reference");
  }
  clone.artifacts[clone.artifacts.length - 1].hash = null;
  return sha256Hex(canonicalJson(clone));
}

export async function verifySurfaceopsDesignerReviewUiEvidenceClosure({
  cwd,
  evidence,
  evidencePath,
  assertSchema
}) {
  if (
    evidence?.schemaId !== "surfaceops-designer-review-ui-evidence.v0" ||
    evidence?.contractId !== DRUI_CONTRACT_ID ||
    evidence?.targetId !== DRUI_TARGET_ID ||
    evidence?.status !== "pass" ||
    evidence?.promotionStatus !== "blocked"
  ) {
    throw contractError("SurfaceOps designer review UI requires pass/blocked deterministic evidence");
  }
  if (typeof assertSchema === "function") {
    assertSchema("surfaceops-designer-review-ui-evidence.v0", evidence, evidencePath);
  }

  const expectedSchemaPaths = [...druiSchemaPaths(), ...druiConsumedSchemaPaths()];
  assertExactRefPaths("schema closure", evidence.schemaClosure, expectedSchemaPaths);
  assertExactRefPaths("fixture closure", evidence.fixtureRefs, druiFixturePaths());
  assertExactRefPaths("boundary closure", evidence.boundaryRefs, boundaryPaths());
  assertExactRefPaths("artifact closure", evidence.artifacts, DRUI_ARTIFACT_PATHS);
  assertExactRefSchemas("schema closure", evidence.schemaClosure, expectedSchemaPaths.map(schemaIdForDesignerReviewUiPath));
  assertExactRefSchemas("fixture closure", evidence.fixtureRefs, druiFixturePaths().map(schemaIdForDesignerReviewUiPath));
  assertExactRefSchemas("boundary closure", evidence.boundaryRefs, [
    "designer-workflow-trace-evidence.v0",
    "designer-workflow-trace-report.v0",
    "review-judgment-evidence.v0",
    "surfaceops-decision-ledger.v0",
    "surfaceops-kanban-live-evidence.v0",
    "surfaceops-kanban-live-operation-plan.v0"
  ]);
  assertExactRefSchemas("artifact closure", evidence.artifacts, DRUI_ARTIFACT_PATHS.map(schemaIdForDesignerReviewUiPath));

  await verifyCanonicalRefs(cwd, evidence.schemaClosure, "schema closure");
  await verifyCanonicalRefs(cwd, evidence.fixtureRefs, "fixture closure");

  const upstream = await verifyBoundaryRefs(cwd, evidence.boundaryRefs);
  const governanceOutcome = deriveSurfaceopsDesignerReviewGovernanceOutcome(upstream.designerEvidence, upstream.designerReport);
  assertCanonicalEqual("evidence governance outcome", evidence.governanceOutcome, governanceOutcome);

  const finalRef = evidence.artifacts[evidence.artifacts.length - 1];
  assertPersistedRef(finalRef, "artifact closure");
  if (finalRef.path !== evidencePath || finalRef.hash !== computeSurfaceopsDesignerReviewUiEvidenceSelfHash(evidence)) {
    throw contractError("SurfaceOps designer review UI evidence self-hash is invalid");
  }

  const generated = {};
  for (const ref of evidence.artifacts.slice(0, -1)) {
    assertPersistedRef(ref, "artifact closure");
    const absolutePath = path.join(cwd, ref.path);
    const actualHash = await canonicalFileHash(absolutePath);
    if (actualHash !== ref.hash) {
      throw contractError(`SurfaceOps designer review UI artifact hash mismatch for ${ref.path}`);
    }
    const artifact = await readJson(absolutePath);
    const expectedSchemaId = schemaIdForDesignerReviewUiPath(ref.path);
    if (expectedSchemaId !== ref.schemaId || artifact.schemaId !== expectedSchemaId) {
      throw contractError(`SurfaceOps designer review UI artifact schema mismatch for ${ref.path}`);
    }
    if (typeof assertSchema === "function") assertSchema(expectedSchemaId, artifact, ref.path);
    generated[expectedSchemaId] = artifact;
  }

  verifyGeneratedSemantics(generated, governanceOutcome, {
    evidence,
    artifactRefs: evidence.artifacts,
    boundaryRefs: evidence.boundaryRefs
  });
  return { upstream, generated, governanceOutcome };
}

async function verifyBoundaryRefs(cwd, refs) {
  for (const ref of refs) assertPersistedRef(ref, "boundary closure");
  const [
    designerEvidenceRef,
    designerReportRef,
    p4EvidenceRef,
    p4DecisionLedgerRef,
    kanbanLiveEvidenceRef,
    kanbanLiveOperationPlanRef
  ] = refs;
  const [
    designerEvidence,
    designerReport,
    p4Evidence,
    p4DecisionLedger,
    kanbanLiveEvidence,
    kanbanLiveOperationPlan
  ] = await Promise.all(boundaryPaths().map((artifactPath) => readJson(path.join(cwd, artifactPath))));

  const designerHash = designerWorkflowTraceInternals.computeEvidenceSelfHash(designerEvidence);
  const p4Hash = p4Internals.computeEvidenceSelfHash(p4Evidence);
  const kanbanHash = surfaceopsKanbanLiveInternals.computeEvidenceSelfHash(kanbanLiveEvidence);
  if (
    designerEvidence.schemaId !== "designer-workflow-trace-evidence.v0" ||
    designerEvidence.status !== "pass" ||
    designerHash !== DRUI_ACCEPTED_DWT_EVIDENCE_HASH ||
    designerEvidenceRef.hash !== designerHash
  ) {
    throw contractError("SurfaceOps designer review UI designer evidence boundary is invalid");
  }
  if (
    p4Evidence.schemaId !== "review-judgment-evidence.v0" ||
    p4Evidence.status !== "pass" ||
    p4Hash !== DRUI_ACCEPTED_P4_EVIDENCE_HASH ||
    p4EvidenceRef.hash !== p4Hash
  ) {
    throw contractError("SurfaceOps designer review UI P4 evidence boundary is invalid");
  }
  if (
    kanbanLiveEvidence.schemaId !== "surfaceops-kanban-live-evidence.v0" ||
    kanbanLiveEvidence.status !== "pass" ||
    kanbanHash !== DRUI_ACCEPTED_KANBAN_LIVE_EVIDENCE_HASH ||
    kanbanLiveEvidenceRef.hash !== kanbanHash
  ) {
    throw contractError("SurfaceOps designer review UI kanban-live evidence boundary is invalid");
  }

  for (const [ref, artifact] of [
    [designerReportRef, designerReport],
    [p4DecisionLedgerRef, p4DecisionLedger],
    [kanbanLiveOperationPlanRef, kanbanLiveOperationPlan]
  ]) {
    const actualHash = sha256Hex(canonicalJson(artifact));
    if (actualHash !== ref.hash) throw contractError(`SurfaceOps designer review UI boundary hash mismatch for ${ref.path}`);
  }

  deriveSurfaceopsDesignerReviewGovernanceOutcome(designerEvidence, designerReport);
  if (kanbanLiveOperationPlan.mappingStore?.owner !== "SurfaceOps" || kanbanLiveOperationPlan.conflictPolicy?.silentOverwriteAllowed !== false) {
    throw contractError("SurfaceOps designer review UI kanban-live authority boundary is invalid");
  }

  return {
    designerEvidence,
    designerReport,
    p4Evidence,
    p4DecisionLedger,
    kanbanLiveEvidence,
    kanbanLiveOperationPlan
  };
}

function verifyGeneratedSemantics(generated, governanceOutcome, { evidence, artifactRefs, boundaryRefs }) {
  const targetSelection = generated["surfaceops-designer-review-ui-target-selection.v0"];
  const workbench = generated["surfaceops-designer-review-workbench.v0"];
  const receipt = generated["surfaceops-designer-review-decision-receipt.v0"];
  const report = generated["surfaceops-designer-review-ui-report.v0"];
  const upstreamEvidenceRefs = [boundaryRefs[0], boundaryRefs[2], boundaryRefs[4]];
  const generatedArtifactRefs = artifactRefs.slice(0, 3);

  assertCanonicalEqual("target selection upstream refs", targetSelection?.upstreamRefs, upstreamEvidenceRefs);
  assertCanonicalEqual("workbench target-selection ref", workbench?.targetSelectionRef, generatedArtifactRefs[0]);
  assertCanonicalEqual("workbench evidence refs", workbench?.evidenceRefs, upstreamEvidenceRefs);
  assertCanonicalEqual("workbench primary evidence ref", workbench?.workItem?.primaryEvidenceRef, upstreamEvidenceRefs[0]);
  assertCanonicalEqual("workbench review-context evidence ref", workbench?.workItem?.reviewContextEvidenceRef, upstreamEvidenceRefs[1]);
  assertCanonicalEqual("workbench kanban-adapter evidence ref", workbench?.workItem?.kanbanAdapterEvidenceRef, upstreamEvidenceRefs[2]);
  assertCanonicalEqual("decision receipt workbench ref", receipt?.workbenchRef, generatedArtifactRefs[1]);
  assertCanonicalEqual("decision receipt evidence refs", receipt?.evidenceRefs, upstreamEvidenceRefs);
  assertCanonicalEqual("report artifact refs", report?.artifactRefs, generatedArtifactRefs);
  assertCanonicalEqual("report designer evidence ref", report?.upstreamPreflight?.designerEvidenceRef, upstreamEvidenceRefs[0]);
  assertCanonicalEqual("report P4 evidence ref", report?.upstreamPreflight?.p4EvidenceRef, upstreamEvidenceRefs[1]);
  assertCanonicalEqual("report kanban-live evidence ref", report?.upstreamPreflight?.kanbanLiveEvidenceRef, upstreamEvidenceRefs[2]);
  assertExactValidationResults("report", report?.validationResults);
  assertExactValidationResults("evidence", evidence?.validationResults);
  if (report?.runId !== evidence?.runId) {
    throw contractError("SurfaceOps designer review UI report and evidence run ids do not match");
  }
  assertCanonicalEqual("report and evidence validation results", report?.validationResults, evidence?.validationResults);
  assertCanonicalEqual("report and evidence diagnostics", report?.diagnostics, evidence?.diagnostics);
  assertCanonicalEqual("report and evidence diagnostics registry", report?.diagnosticsRegistry, evidence?.diagnosticsRegistry);
  const expectedRegistry = diagnosticsRegistry();
  const expectedDiagnostics = [...expectedRegistry].sort((left, right) => `${left.code}:${left.artifactPath}`.localeCompare(`${right.code}:${right.artifactPath}`));
  for (const [label, registry] of [
    ["target selection", targetSelection?.diagnosticsRegistry],
    ["workbench", workbench?.diagnosticsRegistry],
    ["report", report?.diagnosticsRegistry],
    ["evidence", evidence?.diagnosticsRegistry]
  ]) {
    assertCanonicalEqual(`${label} diagnostics registry`, registry, expectedRegistry);
  }
  assertCanonicalEqual("report diagnostics", report?.diagnostics, expectedDiagnostics);
  assertCanonicalEqual("evidence diagnostics", evidence?.diagnostics, expectedDiagnostics);
  for (const [label, value] of [
    ["target selection", targetSelection?.governanceOutcome],
    ["workbench", workbench?.governanceOutcome],
    ["decision receipt", receipt?.governanceOutcome],
    ["report", report?.governanceOutcome]
  ]) {
    assertCanonicalEqual(`${label} governance outcome`, value, governanceOutcome);
  }
  if (
    workbench?.decisionPanel?.actionControls?.approveForHandoff !== false ||
    workbench?.decisionPanel?.actionControls?.requestRefinement !== false ||
    workbench?.decisionPanel?.actionControls?.recordBlocked !== true ||
    canonicalJson(workbench?.decisionPanel?.allowedActions) !== canonicalJson(["block"]) ||
    workbench?.decisionPanel?.sequentialReplayClaims?.identicalSequentialReplayReusesReceipt !== true ||
    workbench?.decisionPanel?.sequentialReplayClaims?.conflictingSequentialReplayRejected !== true ||
    workbench?.kanbanMirror?.afterStatus !== "blocked"
  ) {
    throw contractError("SurfaceOps designer review workbench does not preserve blocked controls and mirror state");
  }
  if (
    receipt?.decisionState !== "blocked" ||
    receipt?.mirroredKanbanStatus !== "blocked" ||
    receipt?.selectedVariantId !== null ||
    receipt?.variantOfRecord !== null ||
    receipt?.handoffEligibility?.eligible !== false ||
    canonicalJson(receipt?.handoffEligibility?.blockingDiagnosticCodes) !== canonicalJson(["SOURCE_REVIEW_EXPIRED"])
  ) {
    throw contractError("SurfaceOps designer review receipt does not preserve the blocked governance outcome");
  }
  if (report?.status !== "pass" || report?.promotionStatus !== "blocked") {
    throw contractError("SurfaceOps designer review report must remain pass/blocked");
  }
}

function assertExactValidationResults(label, results) {
  if (!Array.isArray(results) || results.length !== DRUI_EXPECTATION_ROWS.length) {
    throw contractError(`SurfaceOps designer review UI ${label} validation results must contain exactly ${DRUI_EXPECTATION_ROWS.length} rows`);
  }
  if (results.some((result) => result?.matched !== true)) {
    throw contractError(`SurfaceOps designer review UI ${label} validation results must all match`);
  }
  const expected = DRUI_EXPECTATION_ROWS.map((row) => ({
    fixturePath: row.fixturePath,
    expectedResult: row.expectedResult,
    actualResult: row.expectedResult,
    promotionStatus: row.promotionStatus,
    expectedDiagnosticCodes: row.expectedDiagnosticCodes,
    diagnosticCodes: row.expectedDiagnosticCodes,
    matched: true
  }));
  assertCanonicalEqual(`${label} validation result semantics`, results, expected);
}

async function verifyCanonicalRefs(cwd, refs, label) {
  for (const ref of refs) {
    assertPersistedRef(ref, label);
    const actualHash = await canonicalFileHash(path.join(cwd, ref.path));
    if (actualHash !== ref.hash) throw contractError(`SurfaceOps designer review UI ${label} hash mismatch for ${ref.path}`);
  }
}

function assertExactRefPaths(label, refs, expectedPaths) {
  if (!Array.isArray(refs) || refs.length !== expectedPaths.length) {
    throw contractError(`SurfaceOps designer review UI ${label} is incomplete`);
  }
  const actualPaths = refs.map((ref) => ref?.path);
  if (canonicalJson(actualPaths) !== canonicalJson(expectedPaths)) {
    throw contractError(`SurfaceOps designer review UI ${label} paths are not exact and ordered`);
  }
  if (new Set(actualPaths).size !== actualPaths.length) {
    throw contractError(`SurfaceOps designer review UI ${label} contains duplicate refs`);
  }
}

function assertExactRefSchemas(label, refs, expectedSchemaIds) {
  const actualSchemaIds = refs.map((ref) => ref?.schemaId);
  if (canonicalJson(actualSchemaIds) !== canonicalJson(expectedSchemaIds)) {
    throw contractError(`SurfaceOps designer review UI ${label} schemas are not exact and ordered`);
  }
}

function assertPersistedRef(ref, label) {
  if (
    !ref ||
    !isSafeRelativePosixPath(ref.path) ||
    typeof ref.schemaId !== "string" ||
    ref.hashAlgorithm !== "sha256" ||
    !HASH_PATTERN.test(ref.hash || "") ||
    ref.sourceRef !== null
  ) {
    throw contractError(`SurfaceOps designer review UI ${label} contains an invalid persisted ref`);
  }
}

function isSafeRelativePosixPath(value) {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/") || value.includes("\\")) return false;
  const segments = value.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== ".." && !segment.startsWith("."));
}

function assertCanonicalEqual(label, actual, expected) {
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    throw contractError(`SurfaceOps designer review UI ${label} does not match the accepted contract`);
  }
}

function boundaryPaths() {
  return [
    DRUI_DWT_EVIDENCE_PATH,
    DRUI_DWT_REPORT_PATH,
    DRUI_P4_EVIDENCE_PATH,
    DRUI_P4_DECISION_LEDGER_PATH,
    DRUI_KANBAN_LIVE_EVIDENCE_PATH,
    DRUI_KANBAN_LIVE_OPERATION_PLAN_PATH
  ];
}

function contractError(message) {
  const error = new Error(message);
  error.exitCode = 1;
  return error;
}
