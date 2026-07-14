import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import { designerWorkflowTraceInternals } from "../src/designer-workflow-trace-proof.js";
import { surfaceopsDesignerReviewUiInternals } from "../src/surfaceops-designer-review-ui-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const designerEvidencePath = path.join(root, "artifacts/designer-workflow-trace/evidence.json");

test("SurfaceOps designer review UI proof emits passing self-hashed evidence", async () => {
  await runProof();
  const evidence = await readJson("artifacts/surfaceops-designer-review-ui/evidence.json");
  const report = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 13);
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
});

test("SurfaceOps designer review UI workbench records a real review loop boundary", async () => {
  await runProof();
  const targetSelection = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-ui-target-selection.json");
  const workbench = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-workbench.json");
  const receipt = await readJson("artifacts/surfaceops-designer-review-ui/surfaceops-designer-review-decision-receipt.json");

  assert.equal(targetSelection.targetId, "surfaceops-designer-review-ui");
  assert.equal(targetSelection.claimStatus, "local_live_review_ui_proof");
  assert.deepEqual(targetSelection.outcomeStates, ["needs review", "needs refinement", "approved for handoff", "blocked"]);

  assert.equal(workbench.workItem.kanbanCardTitle, "Button primary approval review");
  assert.equal(workbench.dag.nodes.length, 6);
  assert.ok(workbench.dag.nodes.some((node) => node.nodeId === "inspector"));
  assert.equal(workbench.decisionPanel.controlsEnabled, true);
  assert.equal(workbench.decisionPanel.rationaleRequired, true);
  assert.equal(workbench.kanbanMirror.mirrorOnly, true);
  assert.equal(workbench.kanbanMirror.laneMovementCommitsDecision, false);
  assert.equal(workbench.authority.surfacesEvidenceRemainsProofAuthority, true);
  assert.equal(workbench.authority.productionAdapterImplemented, false);

  assert.equal(receipt.decisionState, "approved for handoff");
  assert.equal(receipt.mirroredKanbanStatus, "approved for handoff");
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
  assert.ok(resultByFixture.get("fixtures/surfaceops-designer-review-ui/invalid/production-adapter-claim.surfaceops-designer-review-ui.json").diagnosticCodes.includes("SURFACEOPS_DESIGNER_REVIEW_PRODUCTION_ADAPTER_FORBIDDEN"));
  assert.equal(resultByFixture.get("fixtures/surfaceops-designer-review-ui/review/live-kanban-required.surfaceops-designer-review-ui.json").actualResult, "review_required");
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
  const browserEvidenceSchema = await readJson("schemas/surfaceops-designer-review-ui-browser-functional-evidence.v0.schema.json");
  const pkg = await readJson("package.json");

  assert.equal(selectionSchema.properties.schemaId.const, "surfaceops-designer-review-ui-target-selection.v0");
  assert.equal(workbenchSchema.properties.schemaId.const, "surfaceops-designer-review-workbench.v0");
  assert.equal(browserEvidenceSchema.properties.schemaId.const, "surfaceops-designer-review-ui-browser-functional-evidence.v0");
  assert.match(pkg.scripts["proof:surfaceops-designer-review-ui"], /surfaceops-designer-review-ui proof/);
  assert.match(pkg.scripts["proof:surfaceops-designer-review-ui:browser"], /prove-surfaceops-designer-review-ui-browser/);
  assert.match(pkg.scripts["check:surfaceops-designer-review-ui:ci"], /check:surfaceops-kanban-live:ci/);

  const browserProofScript = await fs.readFile("scripts/prove-surfaceops-designer-review-ui-browser.mjs", "utf8");
  assert.doesNotMatch(browserProofScript, /upstreamWorkspace: "\/Users\/mike\/kanban\.cards"/);
  assert.match(browserProofScript, /browserReceivesKanbanBearerTokens: false/);
  assert.match(browserProofScript, /KL_KANBAN_CARDS_COMMIT/);
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
