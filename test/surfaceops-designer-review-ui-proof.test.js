import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import { designerWorkflowTraceInternals } from "../src/designer-workflow-trace-proof.js";
import {
  buildSurfaceopsDesignerReviewUiFixtures,
  DRUI_EXPECTATION_ROWS,
  DRUI_FIXTURE_CASES,
  DRUI_PROOF_FOCUS_VALUES
} from "../src/surfaceops-designer-review-ui-contract.js";
import {
  computeSurfaceopsDesignerReviewUiEvidenceSelfHash,
  verifySurfaceopsDesignerReviewUiEvidenceClosure
} from "../src/surfaceops-designer-review-ui-evidence.js";
import { surfaceopsDesignerReviewUiInternals } from "../src/surfaceops-designer-review-ui-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const designerEvidencePath = path.join(root, "artifacts/designer-workflow-trace/evidence.json");

test("SurfaceOps designer review UI proof emits passing self-hashed evidence", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-designer-review-ui/evidence.json");
  const report = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "blocked");
  assert.equal(evidence.validationResults.length, 15);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/surfaceops-designer-review-ui/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, surfaceopsDesignerReviewUiInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-target-selection.json",
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-workbench.json",
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-decision-receipt.json",
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json",
    "artifacts/surfaceops-designer-review-ui/evidence.json"
  ]);
  assert.ok(evidence.boundaryRefs.some((ref) => ref.path === "artifacts/surfaceops-kanban-live/evidence.json"));
  assert.equal(report.upstreamPreflight.exactHashBoundary, true);
  assert.equal(report.upstreamPreflight.governanceOutcome.targetHandoffAllowed, false);
  assert.deepEqual(report.governanceOutcome.blockingDiagnosticCodes, ["SOURCE_REVIEW_EXPIRED"]);
});

test("SurfaceOps designer review UI workbench records a real review loop boundary", async () => {
  await runProof();
  const targetSelection = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-target-selection.json");
  const workbench = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-workbench.json");
  const receipt = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-decision-receipt.json");

  assert.equal(targetSelection.targetId, "surfaceops-designer-review-ui");
  assert.equal(targetSelection.claimStatus, "local_live_review_ui_proof");
  assert.deepEqual(targetSelection.outcomeStates, ["blocked"]);

  assert.equal(workbench.workItem.kanbanCardTitle, "Button primary blocked review");
  assert.equal(workbench.dag.nodes.length, 6);
  assert.ok(workbench.dag.nodes.some((node) => node.nodeId === "inspector"));
  assert.equal(workbench.decisionPanel.controlsEnabled, true);
  assert.equal(workbench.decisionPanel.rationaleRequired, true);
  assert.deepEqual(workbench.decisionPanel.actionControls, {
    approveForHandoff: false,
    requestRefinement: false,
    recordBlocked: true
  });
  assert.deepEqual(workbench.decisionPanel.allowedActions, ["block"]);
  assert.deepEqual(workbench.decisionPanel.sequentialReplayClaims, {
    identicalSequentialReplayReusesReceipt: true,
    conflictingSequentialReplayRejected: true
  });
  assert.equal("oneReceiptPerReviewItemAndEvidenceHash" in workbench.decisionPanel, false);
  assert.equal(workbench.kanbanMirror.afterStatus, "blocked");
  assert.equal(workbench.kanbanMirror.mirrorOnly, true);
  assert.equal(workbench.kanbanMirror.laneMovementCommitsDecision, false);
  assert.equal(workbench.authority.surfacesEvidenceRemainsProofAuthority, true);
  assert.equal(workbench.authority.productionAdapterImplemented, false);

  assert.equal(receipt.decisionState, "blocked");
  assert.equal(receipt.mirroredKanbanStatus, "blocked");
  assert.equal(receipt.selectedVariantId, null);
  assert.equal(receipt.variantOfRecord, null);
  assert.equal(receipt.handoffEligibility.eligible, false);
  assert.equal(receipt.handoffEligibility.targetHandoffAllowed, false);
  assert.deepEqual(receipt.handoffEligibility.blockingDiagnosticCodes, ["SOURCE_REVIEW_EXPIRED"]);
  assert.equal(receipt.handoffEligibility.localLiveReviewUi, true);
  assert.equal(receipt.handoffEligibility.productionAdapter, false);
  assert.equal(receipt.authority.kanbanLaneMovementCommitsDecision, false);
});

test("SurfaceOps designer review UI fixtures cover decision, mirror, and production boundaries", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-designer-review-ui/evidence.json");
  const resultByFixture = new Map(evidence.validationResults.map((row) => [row.fixturePath, row]));

  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/missing-evidence-ref.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_EVIDENCE_REF_MISSING"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/hidden-decision.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_HIDDEN_DECISION"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/mirror-status-override.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_MIRROR_STATUS_INVALID"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/handoff-while-blocked.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_HANDOFF_WHILE_BLOCKED"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/refinement-while-blocked.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_REFINEMENT_WHILE_BLOCKED"));
  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/production-adapter-claim.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN"));
  assert.equal(resultByFixture.get("fixtures/surfaceops-designer-review-ui/review/live-kanban-required.surfaceops-designer-review-ui.json").actualResult, "review_required");
});

test("SurfaceOps designer review UI fixture stimuli are one-to-one, independent, and focus-distinct", () => {
  const fixturePaths = DRUI_FIXTURE_CASES.map((fixture) => fixture.fixturePath);
  const expectationPaths = DRUI_EXPECTATION_ROWS.map((row) => row.fixturePath);
  assert.deepEqual(fixturePaths, expectationPaths);
  assert.equal(new Set(fixturePaths).size, DRUI_EXPECTATION_ROWS.length);
  assert.equal(new Set(DRUI_PROOF_FOCUS_VALUES).size, DRUI_EXPECTATION_ROWS.length);
  for (const fixtureCase of DRUI_FIXTURE_CASES) {
    assert.deepEqual(Object.keys(fixtureCase).sort(), ["fixturePath", "proofFocus", "stimulus"]);
    assert.doesNotMatch(canonicalJson(fixtureCase.stimulus), /SURFACEOPS_DESIGNER_REVIEW_/);
  }

  const changedExpectations = DRUI_EXPECTATION_ROWS.map((row) => row.fixturePath.endsWith("invalid/target-undeclared.surfaceops-designer-review-ui.json")
    ? { ...row, expectedDiagnosticCodes: ["SURFACEOPS_DESIGNER_REVIEW_AUTHORITY_OVERRIDE"] }
    : row);
  const baseline = buildSurfaceopsDesignerReviewUiFixtures();
  const changed = buildSurfaceopsDesignerReviewUiFixtures({ expectationRows: changedExpectations });
  assert.notDeepEqual(baseline.get("expectations.manifest.json"), changed.get("expectations.manifest.json"));
  for (const fixtureCase of DRUI_FIXTURE_CASES) {
    const relativePath = fixtureCase.fixturePath.replace("fixtures/surfaceops-designer-review-ui/", "");
    assert.deepEqual(baseline.get(relativePath), changed.get(relativePath), relativePath);
  }

  const validSemantics = fixturePaths.slice(0, 3).map((fixturePath) => {
    const fixture = baseline.get(fixturePath.replace("fixtures/surfaceops-designer-review-ui/", ""));
    return canonicalJson({
      proofFocus: fixture.proofFocus,
      candidate: fixture.candidate,
      mutationOperations: fixture.mutationOperations
    });
  });
  assert.equal(new Set(validSemantics).size, 3);
});

test("SurfaceOps designer review UI fixtures are semantic inputs, not embedded result oracles", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-designer-review-ui/evidence.json");
  const caseRefs = evidence.fixtureRefs.filter((ref) => ref.path.includes(".surfaceops-designer-review-ui"));
  for (const ref of caseRefs) {
    const fixture = await readJson(ref.path);
    assert.equal("expectedResult" in fixture, false, ref.path);
    assert.equal("expectedPromotionStatus" in fixture, false, ref.path);
    assert.equal("diagnosticCodes" in fixture, false, ref.path);
    assert.equal("mutation" in fixture, false, ref.path);
    for (const operation of fixture.mutationOperations) {
      assert.equal(Object.values(operation).some((value) => typeof value === "string" && value.startsWith("SURFACEOPS_DESIGNER_REVIEW_")), false, ref.path);
    }
  }
});

test("SurfaceOps designer review UI evidence self-hash cannot conceal closure drift", async () => {
  await runProof();
  const original = await readJson("artifacts/surfaceops-designer-review-ui/evidence.json");
  for (const [label, mutate, errorPattern] of [
    ["missing ref", (evidence) => evidence.fixtureRefs.pop(), /fixture closure is incomplete/],
    ["reordered refs", (evidence) => evidence.fixtureRefs.reverse(), /fixture closure paths are not exact and ordered/],
    ["schema drift", (evidence) => { evidence.fixtureRefs[0].schemaId = "wrong.v0"; }, /fixture closure schemas are not exact and ordered/],
    ["self-ref metadata drift", (evidence) => { evidence.artifacts.at(-1).sourceRef = "unexpected"; }, /artifact closure contains an invalid persisted ref/],
    ["missing validation result", (evidence) => evidence.validationResults.pop(), /evidence validation results must contain exactly 15 rows/],
    ["unmatched validation result", (evidence) => { evidence.validationResults[0].matched = false; }, /evidence validation results must all match/],
    ["run id drift", (evidence) => { evidence.runId = "contradictory-run"; }, /report and evidence run ids do not match/],
    ["diagnostics drift", (evidence) => { evidence.diagnostics[0].message = "drift"; }, /report and evidence diagnostics does not match/],
    ["registry drift", (evidence) => { evidence.diagnosticsRegistry[0].message = "drift"; }, /report and evidence diagnostics registry does not match/]
  ]) {
    const evidence = JSON.parse(JSON.stringify(original));
    mutate(evidence);
    evidence.artifacts.at(-1).hash = computeSurfaceopsDesignerReviewUiEvidenceSelfHash(evidence);
    await assert.rejects(
      verifySurfaceopsDesignerReviewUiEvidenceClosure({
        cwd: root,
        evidence,
        evidencePath: "artifacts/surfaceops-designer-review-ui/evidence.json"
      }),
      errorPattern,
      label
    );
  }
});

test("SurfaceOps designer review UI mutation fixtures fail if their mechanical operation becomes a no-op", async () => {
  await runProof();
  for (const relativePath of [
    "fixtures/surfaceops-designer-review-ui/mutations/missing-upstream-evidence.surfaceops-designer-review-ui.json",
    "fixtures/surfaceops-designer-review-ui/mutations/upstream-hash-mismatch.surfaceops-designer-review-ui.json",
    "fixtures/surfaceops-designer-review-ui/mutations/hash-mismatch.surfaceops-designer-review-ui-evidence.json"
  ]) {
    const snapshots = await snapshotArtifacts();
    await withJsonFileMutations([{
      absolutePath: path.join(root, relativePath),
      mutate(fixture) {
        fixture.mutationOperations = [];
      }
    }], async () => {
      const result = await runProofExpectFailure();
      assert.equal(result.code, 1, relativePath);
      assert.match(result.stderr, /validation expectation mismatch/, relativePath);
      await assertArtifactsUnchanged(snapshots);
    });
  }
});

test("SurfaceOps designer review UI preflight rejects failing upstream designer evidence", async () => {
  await runProof();
  const snapshots = await snapshotArtifacts();

  await withJsonFileMutations([
    {
      absolutePath: designerEvidencePath,
      mutate(evidence) {
        evidence.status = "fail";
        evidence.artifacts[evidence.artifacts.length - 1].hash = designerWorkflowTraceInternals.computeEvidenceSelfHash(evidence);
      }
    }
  ], async () => {
    const result = await runProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /designer trace evidence is missing or not passing/);
    await assertArtifactsUnchanged(snapshots);
  });
});

test("SurfaceOps designer review UI schema ids and package wiring are present", async () => {
  await runProof();
  const selectionSchema = await readJson("schemas/surfaceops-designer-review-ui-target-selection.v0.schema.json");
  const workbenchSchema = await readJson("schemas/surfaceops-designer-review-workbench.v0.schema.json");
  const receiptSchema = await readJson("schemas/surfaceops-designer-review-decision-receipt.v0.schema.json");
  const fixtureSchema = await readJson("schemas/surfaceops-designer-review-ui-fixture.v0.schema.json");
  const reportSchema = await readJson("schemas/surfaceops-designer-review-ui-report.v0.schema.json");
  const evidenceSchema = await readJson("schemas/surfaceops-designer-review-ui-evidence.v0.schema.json");
  const expectationsSchema = await readJson("schemas/surfaceops-designer-review-ui-expectations.v0.schema.json");
  const browserEvidenceSchema = await readJson("schemas/surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json");
  const browserTranscriptSchema = await readJson("schemas/surfaceops-designer-review-ui-browser-functional-transcript.v0.schema.json");
  const apiExchangeSchema = await readJson("schemas/surfaceops-designer-review-ui-redacted-api-exchange-log.v0.schema.json");
  const runtimeBindingSchema = await readJson("schemas/surfaceops-designer-review-ui-kanban-binding-runtime.v0.schema.json");
  const runtimeReceiptSchema = await readJson("schemas/surfaceops-designer-review-decision-receipt-runtime.v0.schema.json");
  const runtimeMirrorSchema = await readJson("schemas/surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0.schema.json");
  const pkg = await readJson("package.json");

  assert.equal(selectionSchema.properties.schemaId.const, "surfaceops-designer-review-ui-target-selection.v0");
  assert.equal(workbenchSchema.properties.schemaId.const, "surfaceops-designer-review-workbench.v0");
  assert.equal(workbenchSchema.properties.workItem.additionalProperties, false);
  assert.equal(workbenchSchema.properties.inspector.additionalProperties, false);
  assert.equal(workbenchSchema.properties.decisionPanel.additionalProperties, false);
  assert.equal(workbenchSchema.properties.decisionPanel.properties.oneReceiptPerReviewItemAndEvidenceHash, undefined);
  assert.equal(workbenchSchema.properties.decisionPanel.properties.sequentialReplayClaims.additionalProperties, false);
  assert.equal(workbenchSchema.properties.kanbanMirror.additionalProperties, false);
  assert.equal(receiptSchema.properties.decisionState.const, "blocked");
  assert.equal(receiptSchema.properties.selectedVariantId.type, "null");
  assert.equal(fixtureSchema.properties.candidate.additionalProperties, false);
  assert.equal(fixtureSchema.properties.proofFocus.enum.length, 15);
  assert.equal(fixtureSchema.properties.expectedResult, undefined);
  assert.equal(reportSchema.properties.validationResults.minItems, 15);
  assert.equal(reportSchema.properties.validationResults.maxItems, 15);
  assert.equal(reportSchema.properties.validationResults.items.properties.matched.const, true);
  assert.equal(evidenceSchema.properties.validationResults.minItems, 15);
  assert.equal(evidenceSchema.properties.validationResults.maxItems, 15);
  assert.equal(evidenceSchema.properties.validationResults.items.properties.matched.const, true);
  assert.equal(expectationsSchema.properties.expectedResults.minItems, 15);
  assert.equal(expectationsSchema.properties.expectedResults.maxItems, 15);
  assert.equal(browserEvidenceSchema.properties.schemaId.const, "surfaceops-designer-review-ui-browser-functional-evidence.v0");
  assert.equal(browserTranscriptSchema.properties.schemaId.const, "surfaceops-designer-review-ui-browser-functional-transcript.v0");
  assert.equal(browserTranscriptSchema.properties.version.const, "0.0.0");
  assert.equal(browserTranscriptSchema.properties.scenarioId.const, "button-variants-live-review");
  assert.equal(browserTranscriptSchema.properties.targetId.const, "surfaceops-designer-review-ui");
  assert.equal(browserTranscriptSchema.properties.steps.type, "array");
  assert.equal(browserTranscriptSchema.properties.assertions.type, "array");
  assert.equal(browserTranscriptSchema.additionalProperties, false);
  assert.equal(browserTranscriptSchema.properties.tokensRedacted.const, true);
  assert.deepEqual(browserTranscriptSchema.required, ["schemaId", "version", "scenarioId", "targetId", "steps", "assertions", "tokensRedacted"]);
  assert.equal(browserEvidenceSchema.properties.mirrorResult.properties.commentKind.const, "change_request");
  assert.equal(browserEvidenceSchema.properties.mirrorResult.properties.commentStatus.const, "open");
  assert.match(apiExchangeSchema.$id, /surfaceops-designer-review-ui-redacted-api-exchange-log\.v0\.schema\.json$/);
  assert.equal(apiExchangeSchema.items.oneOf.length, 3);
  assert.ok(apiExchangeSchema.items.oneOf.every((rowSchema) => rowSchema.additionalProperties === false));
  assert.match(runtimeBindingSchema.$id, /surfaceops-designer-review-ui-kanban-binding-runtime\.v0\.schema\.json$/);
  assert.equal(runtimeBindingSchema.additionalProperties, false);
  assert.match(runtimeReceiptSchema.$id, /surfaceops-designer-review-decision-receipt-runtime\.v0\.schema\.json$/);
  assert.equal(runtimeReceiptSchema.additionalProperties, false);
  assert.equal(runtimeReceiptSchema.properties.schemaId.const, "surfaceops-designer-review-decision-receipt-runtime.v0");
  assert.equal(runtimeReceiptSchema.properties.governanceOutcome.additionalProperties, false);
  assert.equal(runtimeReceiptSchema.properties.evidenceRefs.minItems, 3);
  assert.equal(runtimeReceiptSchema.properties.evidenceRefs.maxItems, 3);
  assert.match(runtimeMirrorSchema.$id, /surfaceops-designer-review-ui-kanban-mirror-result-runtime\.v0\.schema\.json$/);
  assert.equal(runtimeMirrorSchema.additionalProperties, false);
  assert.equal(runtimeMirrorSchema.properties.commentKind.const, "change_request");
  assert.equal(runtimeMirrorSchema.properties.commentStatus.const, "open");
  assert.match(pkg.scripts["proof:surfaceops-designer-review-ui"], /surfaceops-designer-review-ui proof/);
  assert.match(pkg.scripts["proof:surfaceops-designer-review-ui:browser"], /prove-surfaceops-designer-review-ui-browser/);
  assert.match(pkg.scripts["check:surfaceops-designer-review-ui:ci"], /check:surfaceops-kanban-live:ci/);
  for (const schemaName of [
    "surfaceops-designer-review-ui-redacted-api-exchange-log.v0.schema.json",
    "surfaceops-designer-review-ui-kanban-binding-runtime.v0.schema.json",
    "surfaceops-designer-review-decision-receipt-runtime.v0.schema.json",
    "surfaceops-designer-review-ui-kanban-mirror-result-runtime.v0.schema.json"
  ]) {
    assert.match(pkg.scripts["check:surfaceops-designer-review-ui:untracked"], new RegExp(schemaName.replaceAll(".", "\\.")));
  }

  const browserProofScript = await fs.readFile("scripts/prove-surfaceops-designer-review-ui-browser.mjs", "utf8");
  assert.doesNotMatch(browserProofScript, /upstreamWorkspace: "\/Users\/mike\/kanban\.cards"/);
  assert.match(browserProofScript, /browserReceivesKanbanBearerTokens: false/);
  assert.match(browserProofScript, /KL_KANBAN_CARDS_COMMIT/);
  assert.match(browserProofScript, /verifySurfaceopsDesignerReviewUiEvidenceClosure/);
});

async function runProof() {
  await execFileAsync("node", [
    "bin/interfacectl.js",
    "surfaces",
    "surfaceops-designer-review-ui",
    "proof",
    "--designer-evidence",
    "artifacts/designer-workflow-trace/evidence.json",
    "--designer-report",
    "artifacts/designer-workflow-trace/designer-workflow-trace-report.json",
    "--review-evidence",
    "artifacts/p4/evidence.json",
    "--decision-ledger",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "--kanban-live-evidence",
    "artifacts/surfaceops-kanban-live/evidence.json",
    "--kanban-live-operation-plan",
    "artifacts/surfaceops-kanban-live/surfaceops-kanban-live-operation-plan.json",
    "--fixture",
    "fixtures/surfaceops-designer-review-ui",
    "--out",
    "artifacts/surfaceops-designer-review-ui"
  ], { cwd: root });
}

async function runProofExpectFailure() {
  try {
    await runProof();
    return { code: 0, stdout: "", stderr: "" };
  } catch (error) {
    return {
      code: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? String(error)
    };
  }
}

async function snapshotArtifacts() {
  const paths = [
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-target-selection.json",
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-workbench.json",
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-decision-receipt.json",
    "artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json",
    "artifacts/surfaceops-designer-review-ui/evidence.json"
  ];
  const snapshot = new Map();
  for (const relativePath of paths) {
    snapshot.set(relativePath, await fs.readFile(path.join(root, relativePath), "utf8"));
  }
  return snapshot;
}

async function assertArtifactsUnchanged(snapshot) {
  for (const [relativePath, expected] of snapshot.entries()) {
    assert.equal(await fs.readFile(path.join(root, relativePath), "utf8"), expected);
  }
}

async function withJsonFileMutations(mutations, fn) {
  const originals = [];
  for (const mutation of mutations) {
    const raw = await fs.readFile(mutation.absolutePath, "utf8");
    originals.push({ path: mutation.absolutePath, raw });
    const data = JSON.parse(raw);
    mutation.mutate(data);
    await fs.writeFile(mutation.absolutePath, canonicalJson(data));
  }
  try {
    await fn();
  } finally {
    for (const original of originals.reverse()) {
      await fs.writeFile(original.path, original.raw);
    }
  }
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}
