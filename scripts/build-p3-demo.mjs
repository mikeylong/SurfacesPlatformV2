#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import {
  P3_ARTIFACT_ROOT,
  P3_SCHEMA_FILES,
  P3_SCHEMA_ROOT
} from "../src/p3-contract.js";
import { p3Internals } from "../src/p3-proof.js";
import {
  readJson
} from "../src/p2-contract.js";

const ROOT = process.cwd();
const DEFAULT_EVIDENCE_PATH = "artifacts/p3/evidence.json";
const DEFAULT_OUT_DIR = "demo/p3";

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:p3-demo usage error" : "build:p3-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || path.posix.dirname(evidencePath.posixPath) !== P3_ARTIFACT_ROOT) {
    throw contractError(`P3 demo evidence must be ${DEFAULT_EVIDENCE_PATH}`);
  }

  const validators = await loadValidators();
  const evidence = await readJson(evidencePath.fsPath);
  assertSchema(validators, "agent-orchestration-evidence.v0", evidence, "P3 evidence");
  await verifyEvidence(evidence, evidencePath);
  const [registry, plan, contractArchitect, fixtureAuthor, evidenceReviewer, reviewQueue, report] = await Promise.all([
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "agent-capability-registry.json")),
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "orchestration-plan.json")),
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "work-order.contract-architect.json")),
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "work-order.fixture-author.json")),
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "work-order.evidence-reviewer.json")),
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "review-queue.json")),
    readJson(path.join(ROOT, P3_ARTIFACT_ROOT, "agent-orchestration-report.json"))
  ]);

  await writeDemo(outDir, {
    evidence,
    registry,
    plan,
    workOrders: [contractArchitect, fixtureAuthor, evidenceReviewer],
    reviewQueue,
    report
  });
  console.log(`P3 demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = {
    evidence: DEFAULT_EVIDENCE_PATH,
    out: DEFAULT_OUT_DIR
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build-p3-demo.mjs [--evidence artifacts/p3/evidence.json] [--out demo/p3]");
      process.exit(0);
    }
    if (arg !== "--evidence" && arg !== "--out") {
      throw usageError(`unknown argument ${arg}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw usageError(`${arg} requires a value`);
    }
    args[arg.slice(2)] = value;
    index += 1;
  }
  return args;
}

function workspacePath(input, flag) {
  if (typeof input !== "string" || input.length === 0 || input.includes("\0")) {
    throw usageError(`${flag} must be a non-empty workspace path`);
  }
  const fsPath = path.resolve(ROOT, input);
  const relative = path.relative(ROOT, fsPath);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw usageError(`${flag} must stay inside the workspace`);
  }
  return { fsPath, posixPath: relative.split(path.sep).join("/") };
}

async function loadValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true, validateFormats: false });
  for (const file of P3_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, P3_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/p3/${schemaId}.schema.json`);
      if (!validate) throw contractError(`schema not loaded: p3/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

async function verifyEvidence(evidence, evidencePath) {
  if (evidence.status !== "pass") {
    throw contractError("P3 demo requires passing evidence");
  }
  const finalRef = evidence.artifacts[evidence.artifacts.length - 1];
  if (finalRef.path !== evidencePath.posixPath || finalRef.hash !== p3Internals.computeEvidenceSelfHash(evidence)) {
    throw contractError("P3 evidence self-hash is invalid");
  }
  const integrityCode = await p3Internals.firstEvidenceIntegrityFailureCode(ROOT, evidence);
  if (integrityCode !== null) {
    throw contractError(`P3 evidence integrity verification failed: ${integrityCode}`);
  }
}

async function writeDemo(outDir, data) {
  await fs.mkdir(outDir.fsPath, { recursive: true });
  await fs.writeFile(path.join(outDir.fsPath, "README.md"), [
    "# P3 Agent Orchestration Demo",
    "",
    "Generated presentation output derived from passing P3 evidence.",
    "Proof authority remains `artifacts/p3/evidence.json`."
  ].join("\n") + "\n");
  await fs.writeFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
}

function buildHtml({ evidence, registry, plan, workOrders, reviewQueue, report }) {
  const agentRows = Object.values(registry.agents).map((agent) =>
    `<tr><td><code>${escapeHtml(agent.agentId)}</code></td><td>${escapeHtml(agent.role)}</td><td>${escapeHtml(agent.capabilityIds.join(", "))}</td></tr>`
  ).join("");
  const taskRows = plan.tasks.map((task) =>
    `<tr><td><code>${escapeHtml(task.taskId)}</code></td><td>${escapeHtml(task.selectedAgentIds.join(", "))}</td><td>${escapeHtml(task.promotionStatus)}</td><td>${escapeHtml(task.dependencies.map((dep) => dep.ref).join(", ") || "none")}</td></tr>`
  ).join("");
  const workOrderRows = workOrders.map((workOrder) =>
    `<tr><td><code>${escapeHtml(workOrder.workOrderId)}</code></td><td>${escapeHtml(workOrder.agentId)}</td><td>${escapeHtml(workOrder.allowedOutputs.map((out) => out.path).join(", "))}</td><td>${escapeHtml(String(workOrder.execution.authorized))}</td></tr>`
  ).join("");
  const reviewRows = reviewQueue.items.map((item) =>
    `<tr><td><code>${escapeHtml(item.reviewItemId)}</code></td><td>${escapeHtml(item.taskId)}</td><td>${escapeHtml(item.requiredReviewerRole)}</td><td>${escapeHtml(item.diagnosticCode)}</td></tr>`
  ).join("");
  const diagnostics = evidence.diagnostics.map((diagnostic) =>
    `<li><code>${escapeHtml(diagnostic.code)}</code> ${escapeHtml(diagnostic.message)}</li>`
  ).join("");
  const hashes = evidence.artifacts.map((artifact) =>
    `<li><code>${escapeHtml(artifact.path)}</code> ${escapeHtml(artifact.hash || "self")}</li>`
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P3 Agent Orchestration Proof</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1c2430; background: #f6f7f9; }
    body { margin: 0; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { font-size: 28px; margin: 0 0 8px; letter-spacing: 0; }
    h2 { font-size: 18px; margin: 28px 0 12px; letter-spacing: 0; }
    p { color: #526070; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 20px 0; }
    .tile { border: 1px solid #d6dce5; border-radius: 8px; background: white; padding: 14px; }
    .label { color: #596675; font-size: 12px; text-transform: uppercase; }
    .value { font-weight: 650; margin-top: 4px; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #d6dce5; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e6ebf1; vertical-align: top; }
    th { background: #edf1f5; font-size: 13px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    ul { background: white; border: 1px solid #d6dce5; border-radius: 8px; margin: 0; padding: 14px 14px 14px 30px; }
    li { margin: 6px 0; overflow-wrap: anywhere; }
  </style>
</head>
<body>
<main>
  <h1>P3 Agent Orchestration Proof</h1>
  <p>Generated view of the inert capability registry, task DAG, work orders, review queue, diagnostics, and evidence hashes.</p>
  <section class="meta">
    <div class="tile"><div class="label">Evidence</div><div class="value">${escapeHtml(evidence.status)} / ${escapeHtml(evidence.promotionStatus)}</div></div>
    <div class="tile"><div class="label">Run</div><div class="value">${escapeHtml(evidence.runId)}</div></div>
    <div class="tile"><div class="label">Work Orders</div><div class="value">${workOrders.length}</div></div>
    <div class="tile"><div class="label">Review Items</div><div class="value">${reviewQueue.items.length}</div></div>
  </section>
  <h2>Registered Agents</h2>
  <table><thead><tr><th>Agent</th><th>Role</th><th>Capabilities</th></tr></thead><tbody>${agentRows}</tbody></table>
  <h2>Task DAG</h2>
  <table><thead><tr><th>Task</th><th>Selected Agents</th><th>Promotion</th><th>Dependencies</th></tr></thead><tbody>${taskRows}</tbody></table>
  <h2>Inert Work Orders</h2>
  <table><thead><tr><th>Work Order</th><th>Agent</th><th>Candidate Output</th><th>Execution Authorized</th></tr></thead><tbody>${workOrderRows}</tbody></table>
  <h2>Review Queue</h2>
  <table><thead><tr><th>Item</th><th>Task</th><th>Reviewer Role</th><th>Diagnostic</th></tr></thead><tbody>${reviewRows}</tbody></table>
  <h2>Diagnostics</h2>
  <ul>${diagnostics}</ul>
  <h2>Evidence Hashes</h2>
  <ul>${hashes}</ul>
  <h2>Report</h2>
  <div class="tile"><div class="label">Report Status</div><div class="value">${escapeHtml(report.status)} / ${escapeHtml(report.promotionStatus)}</div></div>
</main>
</body>
</html>
`;
}

function assertSchema(validators, schemaId, data, label) {
  const result = validators.validate(schemaId, data);
  if (!result.valid) {
    throw contractError(`${label} failed ${schemaId}: ${formatAjvErrors(result.errors)}`);
  }
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function usageError(message) {
  const error = new Error(message);
  error.exitCode = 2;
  return error;
}

function contractError(message) {
  const error = new Error(message);
  error.exitCode = 1;
  return error;
}
