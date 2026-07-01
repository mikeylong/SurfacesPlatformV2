import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import {
  DWT_ARTIFACT_PATHS,
  DWT_FORBIDDEN_CLAIM_KEYS,
  DWT_WORKFLOW_STEPS
} from "../src/designer-workflow-trace-contract.js";
import { designerWorkflowTraceInternals } from "../src/designer-workflow-trace-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const stalePath = path.join(root, "artifacts/designer-workflow-trace/stale.tmp");

test("designer workflow trace proof emits passing evidence with blocked promotion status", async () => {
  await runDesignerWorkflowTraceProof();
  const evidence = await readJson("artifacts/designer-workflow-trace/evidence.json");
  const report = await readJson("artifacts/designer-workflow-trace/designer-workflow-trace-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "blocked");
  assert.equal(evidence.validationResults.length, 8);
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/designer-workflow-trace/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, designerWorkflowTraceInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/designer-workflow-trace/trace-selection.json",
    "artifacts/designer-workflow-trace/designer-workflow-trace-report.json",
    "artifacts/designer-workflow-trace/evidence.json"
  ]);
  assert.equal(evidence.args.ingestionReport, "artifacts/p2/ingestion-report.json");
  assert.equal(evidence.args.sourceReviewQueue, "artifacts/source-conformance/source-review-queue.json");
  assert.equal(evidence.boundaryRefs.some((entry) => entry.path === "artifacts/p2/ingestion-report.json"), true);
  assert.equal(evidence.boundaryRefs.some((entry) => entry.path === "artifacts/source-conformance/source-review-queue.json"), true);
  assert.equal(report.workflowTrace, undefined);
  assert.deepEqual(report.designerWorkflowSteps.map((entry) => entry.stepId), DWT_WORKFLOW_STEPS);
  assert.deepEqual(report.designerWorkflowSteps.map((entry) => entry.visionStepNumber), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.visionSourceRef.startsWith("VISION.md#product-designer-workflow-step-")), true);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.refs.length > 0), true);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.reportAuthority === "index-only"), true);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.proofAuthority === false), true);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.productAuthority === false), true);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.productWorkflowImplementation === false), true);
  assert.equal(report.designerWorkflowSteps.every((entry) => entry.liveSurfaceOps === false && entry.liveJudgmentKit === false), true);
  assert.equal(report.boundaryClaims.liveAgentExecution, false);
  assert.equal(report.boundaryClaims.workOrderExecution, false);
  const generationStep = report.designerWorkflowSteps.find((entry) => entry.stepId === "generate-inside-catalog-boundary");
  assert.equal(generationStep.refs.some((ref) => ref.path === "artifacts/p5/protocol/protocol-projection.json"), true);
  assert.equal(generationStep.refs.some((ref) => ref.path === "artifacts/p5/native/surfaces-native-projection.json"), true);
  assert.equal(report.designerWorkflowSteps.find((entry) => entry.stepId === "decide-or-revise-authority-layer").promotionStatus, "blocked");
  const governanceStep = report.designerWorkflowSteps.find((entry) => entry.stepId === "govern-changes-over-time");
  assert.equal(governanceStep.refs.length, report.upstreamPreflight.refs.length + 1);
  assert.deepEqual(governanceStep.traceArtifactPaths, DWT_ARTIFACT_PATHS);
  assert.match(report.nonAuthorityStatement, /index over accepted evidence/);
});

test("designer workflow trace preserves P4 blocked status and target handoff refs", async () => {
  await runDesignerWorkflowTraceProof();
  const report = await readJson("artifacts/designer-workflow-trace/designer-workflow-trace-report.json");

  const p4Status = report.evidenceStatus.find((row) => row.path === "artifacts/p4/evidence.json");
  assert.equal(p4Status.status, "pass");
  assert.equal(p4Status.promotionStatus, "blocked");
  assert.deepEqual(report.targetHandoffArtifacts.map((row) => row.targetId), [
    "surfaces-protocol-static",
    "surfaces-native-static"
  ]);
  assert.equal(report.targetHandoffArtifacts[0].artifactRefs.some((ref) => ref.path === "artifacts/p5/protocol/protocol-envelope.button.json"), true);
  assert.equal(report.targetHandoffArtifacts[1].artifactRefs.some((ref) => ref.path === "artifacts/p5/native/surfaces-native-packet.button.json"), true);
});

test("designer workflow trace proof rejects stale output and non-normalized command paths", async () => {
  await fs.writeFile(stalePath, "stale");
  try {
    const result = await runDesignerWorkflowTraceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(stalePath, { force: true });
  }

  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "designer-workflow-trace",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--ingestion-report",
    "artifacts/p2/ingestion-report.json",
    "--source-conformance-evidence",
    "artifacts/source-conformance/evidence.json",
    "--source-authority-map",
    "artifacts/source-conformance/source-authority-map.json",
    "--source-conformance-report",
    "artifacts/source-conformance/source-conformance-report.json",
    "--source-review-queue",
    "artifacts/source-conformance/source-review-queue.json",
    "--orchestration-evidence",
    "artifacts/p3/evidence.json",
    "--review-queue",
    "artifacts/p3/../p3/review-queue.json",
    "--review-evidence",
    "artifacts/p4/evidence.json",
    "--decision-ledger",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "--review-report",
    "artifacts/p4/review-judgment-report.json",
    "--evaluation-report",
    "artifacts/p4/judgmentkit-evaluation-report.json",
    "--protocol-evidence",
    "artifacts/p5/protocol/evidence.json",
    "--native-evidence",
    "artifacts/p5/native/evidence.json",
    "--fixture",
    "fixtures/designer-workflow-trace",
    "--out",
    "artifacts/designer-workflow-trace"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("designer workflow trace proof requires every consumed boundary command input", async () => {
  const missingSourceQueue = await runCommandExpectFailure(withoutFlag(designerWorkflowTraceArgs(), "--source-review-queue"));
  assert.equal(missingSourceQueue.code, 2);
  assert.match(missingSourceQueue.stderr, /usage: interfacectl surfaces designer-workflow-trace proof/);

  const missingIngestionReport = await runCommandExpectFailure(withoutFlag(designerWorkflowTraceArgs(), "--ingestion-report"));
  assert.equal(missingIngestionReport.code, 2);
  assert.match(missingIngestionReport.stderr, /usage: interfacectl surfaces designer-workflow-trace proof/);
});

test("designer workflow trace proof fails closed on forbidden claims", async () => {
  await runDesignerWorkflowTraceProof();
  const fixturePath = path.join(root, "fixtures/designer-workflow-trace/valid/button-authority-to-handoff.designer-workflow-trace.json");

  for (const claimKey of DWT_FORBIDDEN_CLAIM_KEYS) {
    await withJsonFileMutation(fixturePath, (fixture) => {
      fixture.claims[claimKey] = true;
    }, async () => {
      const result = await runDesignerWorkflowTraceProofExpectFailure();
      assert.equal(result.code, 1);
      assert.match(result.stderr, /designer workflow trace validation expectation mismatch/);
      assert.match(result.stderr, /TRACE_FORBIDDEN_CLAIM/);
    });
  }
});

test("designer workflow trace proof fails closed on trace selection and required path drift", async () => {
  await runDesignerWorkflowTraceProof();
  const selectionPath = path.join(root, "fixtures/designer-workflow-trace/trace-selection.fixture.json");
  await withJsonFileMutation(selectionPath, (fixture) => {
    fixture.targetIds.push("a2ui");
  }, async () => {
    const result = await runDesignerWorkflowTraceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });

  await withJsonFileMutation(selectionPath, (fixture) => {
    fixture.workflowSteps = fixture.workflowSteps.filter((step) => step !== "govern-changes-over-time");
  }, async () => {
    const result = await runDesignerWorkflowTraceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });

  const fixturePath = path.join(root, "fixtures/designer-workflow-trace/valid/button-authority-to-handoff.designer-workflow-trace.json");
  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredArtifactPaths = fixture.requiredArtifactPaths.filter((entry) => entry !== "artifacts/p5/native/surfaces-native-packet.button.json");
  }, async () => {
    const result = await runDesignerWorkflowTraceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });
});

test("designer workflow trace proof verifies indexed upstream report files", async () => {
  await runDesignerWorkflowTraceProof();

  await withJsonFileMutation(path.join(root, "artifacts/p2/ingestion-report.json"), (report) => {
    report.version = "tampered";
  }, async () => {
    const result = await runDesignerWorkflowTraceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /P2 ingestion report hash does not match accepted evidence/);
  });

  await withJsonFileMutation(path.join(root, "artifacts/source-conformance/source-review-queue.json"), (queue) => {
    queue.version = "tampered";
  }, async () => {
    const result = await runDesignerWorkflowTraceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /source review queue hash does not match accepted evidence/);
  });
});

test("designer workflow trace report schema rejects live or authority overclaims", async () => {
  await runDesignerWorkflowTraceProof();
  const schema = await readJson("schemas/designer-workflow-trace-report.v0.schema.json");
  const report = await readJson("artifacts/designer-workflow-trace/designer-workflow-trace-report.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validate = ajv.compile(schema);

  assert.equal(validate(report), true);
  const liveClaim = {
    ...report,
    boundaryClaims: {
      ...report.boundaryClaims,
      liveBehavior: true
    }
  };
  assert.equal(validate(liveClaim), false);

  const presentationAuthority = {
    ...report,
    presentationLinks: report.presentationLinks.map((link, index) => index === 0 ? { ...link, proofAuthority: true } : link)
  };
  assert.equal(validate(presentationAuthority), false);

  const authorityClaim = {
    ...report,
    boundaryClaims: {
      ...report.boundaryClaims,
      catalogAuthority: true
    }
  };
  assert.equal(validate(authorityClaim), false);

  const liveAgentClaim = {
    ...report,
    boundaryClaims: {
      ...report.boundaryClaims,
      liveAgentExecution: true
    }
  };
  assert.equal(validate(liveAgentClaim), false);

  const workOrderClaim = {
    ...report,
    boundaryClaims: {
      ...report.boundaryClaims,
      workOrderExecution: true
    }
  };
  assert.equal(validate(workOrderClaim), false);

  const workflowAuthorityClaim = {
    ...report,
    designerWorkflowSteps: report.designerWorkflowSteps.map((step, index) => index === 0 ? { ...step, liveSurfaceOps: true } : step)
  };
  assert.equal(validate(workflowAuthorityClaim), false);

  const productAuthorityClaim = {
    ...report,
    designerWorkflowSteps: report.designerWorkflowSteps.map((step, index) => index === 1 ? { ...step, productAuthority: true } : step)
  };
  assert.equal(validate(productAuthorityClaim), false);

  const productWorkflowClaim = {
    ...report,
    designerWorkflowSteps: report.designerWorkflowSteps.map((step, index) => index === 2 ? { ...step, productWorkflowImplementation: true } : step)
  };
  assert.equal(validate(productWorkflowClaim), false);

  const emptyWorkflowRefs = {
    ...report,
    designerWorkflowSteps: report.designerWorkflowSteps.map((step, index) => index === 0 ? { ...step, refs: [] } : step)
  };
  assert.equal(validate(emptyWorkflowRefs), false);

  const nullableWorkflowRefHash = {
    ...report,
    designerWorkflowSteps: report.designerWorkflowSteps.map((step, index) => index === 0
      ? { ...step, refs: step.refs.map((ref, refIndex) => refIndex === 0 ? { ...ref, hash: null } : ref) }
      : step)
  };
  assert.equal(validate(nullableWorkflowRefHash), false);

  const reorderedDesignerWorkflow = {
    ...report,
    designerWorkflowSteps: [
      report.designerWorkflowSteps[1],
      report.designerWorkflowSteps[0],
      ...report.designerWorkflowSteps.slice(2)
    ]
  };
  assert.equal(validate(reorderedDesignerWorkflow), false);

  const missingWorkflowStep = {
    ...report,
    designerWorkflowSteps: report.designerWorkflowSteps.filter((step) => step.stepId !== "govern-changes-over-time")
  };
  assert.equal(validate(missingWorkflowStep), false);
});

test("designer workflow trace evidence integrity detects artifact and boundary tampering", async () => {
  await runDesignerWorkflowTraceProof();
  const evidence = await readJson("artifacts/designer-workflow-trace/evidence.json");

  const artifactCode = await designerWorkflowTraceInternals.firstEvidenceIntegrityFailureCode(root, {
    ...evidence,
    artifacts: evidence.artifacts.map((entry) =>
      entry.path === "artifacts/designer-workflow-trace/designer-workflow-trace-report.json"
        ? { ...entry, hash: "0".repeat(64) }
        : entry
    )
  });
  assert.equal(artifactCode, "TRACE_EVIDENCE_HASH_MISMATCH");

  const boundaryCode = await designerWorkflowTraceInternals.firstEvidenceIntegrityFailureCode(root, {
    ...evidence,
    boundaryRefs: evidence.boundaryRefs.map((entry) =>
      entry.path === "artifacts/p4/evidence.json"
        ? { ...entry, hash: "0".repeat(64) }
        : entry
    )
  });
  assert.equal(boundaryCode, "TRACE_EVIDENCE_HASH_MISMATCH");
});

async function runDesignerWorkflowTraceProof() {
  await execFileAsync(process.execPath, designerWorkflowTraceArgs(), { cwd: root });
}

async function runDesignerWorkflowTraceProofExpectFailure() {
  return runCommandExpectFailure(designerWorkflowTraceArgs());
}

function designerWorkflowTraceArgs() {
  return [
    "bin/interfacectl.js",
    "surfaces",
    "designer-workflow-trace",
    "proof",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--ingestion-report",
    "artifacts/p2/ingestion-report.json",
    "--source-conformance-evidence",
    "artifacts/source-conformance/evidence.json",
    "--source-authority-map",
    "artifacts/source-conformance/source-authority-map.json",
    "--source-conformance-report",
    "artifacts/source-conformance/source-conformance-report.json",
    "--source-review-queue",
    "artifacts/source-conformance/source-review-queue.json",
    "--orchestration-evidence",
    "artifacts/p3/evidence.json",
    "--review-queue",
    "artifacts/p3/review-queue.json",
    "--review-evidence",
    "artifacts/p4/evidence.json",
    "--decision-ledger",
    "artifacts/p4/surfaceops-decision-ledger.json",
    "--review-report",
    "artifacts/p4/review-judgment-report.json",
    "--evaluation-report",
    "artifacts/p4/judgmentkit-evaluation-report.json",
    "--protocol-evidence",
    "artifacts/p5/protocol/evidence.json",
    "--native-evidence",
    "artifacts/p5/native/evidence.json",
    "--fixture",
    "fixtures/designer-workflow-trace",
    "--out",
    "artifacts/designer-workflow-trace"
  ];
}

function withoutFlag(args, flag) {
  const index = args.indexOf(flag);
  assert.notEqual(index, -1);
  return args.toSpliced(index, 2);
}

async function runCommandExpectFailure(args) {
  try {
    await execFileAsync(process.execPath, args, { cwd: root });
    assert.fail("expected command to fail");
  } catch (error) {
    return {
      code: error.code,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    };
  }
}

async function withJsonFileMutation(absolutePath, mutate, fn) {
  const original = await fs.readFile(absolutePath, "utf8");
  try {
    const data = JSON.parse(original);
    mutate(data);
    await fs.writeFile(absolutePath, canonicalJson(data));
    await fn();
  } finally {
    await fs.writeFile(absolutePath, original);
  }
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}
