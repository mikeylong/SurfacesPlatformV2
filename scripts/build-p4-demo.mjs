#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import {
  P4_ARTIFACT_ROOT,
  P4_SCHEMA_FILES,
  P4_SCHEMA_ROOT
} from "../src/p4-contract.js";
import { p4Internals } from "../src/p4-proof.js";
import {
  canonicalFileHash,
  readJson
} from "../src/p2-contract.js";

const ROOT = process.cwd();
const DEFAULT_EVIDENCE_PATH = "artifacts/p4/evidence.json";
const DEFAULT_OUT_DIR = "demo/p4";

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:p4-demo usage error" : "build:p4-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || path.posix.dirname(evidencePath.posixPath) !== P4_ARTIFACT_ROOT) {
    throw contractError(`P4 demo evidence must be ${DEFAULT_EVIDENCE_PATH}`);
  }

  const validators = await loadValidators();
  const evidence = await readJson(evidencePath.fsPath);
  assertSchema(validators, "review-judgment-evidence.v0", evidence, "P4 evidence");
  await verifyEvidence(evidence, evidencePath);
  const [ledger, evaluationReport, reviewReport] = await Promise.all([
    readJson(path.join(ROOT, P4_ARTIFACT_ROOT, "surfaceops-decision-ledger.json")),
    readJson(path.join(ROOT, P4_ARTIFACT_ROOT, "judgmentkit-evaluation-report.json")),
    readJson(path.join(ROOT, P4_ARTIFACT_ROOT, "review-judgment-report.json"))
  ]);

  await writeDemo(outDir, {
    evidence,
    ledger,
    evaluationReport,
    reviewReport
  });
  console.log(`P4 demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = {
    evidence: DEFAULT_EVIDENCE_PATH,
    out: DEFAULT_OUT_DIR
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build-p4-demo.mjs [--evidence artifacts/p4/evidence.json] [--out demo/p4]");
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
  for (const file of P4_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, P4_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/p4/${schemaId}.schema.json`);
      if (!validate) throw contractError(`schema not loaded: p4/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

async function verifyEvidence(evidence, evidencePath) {
  if (evidence.status !== "pass") {
    throw contractError("P4 demo requires passing evidence");
  }
  const finalRef = evidence.artifacts[evidence.artifacts.length - 1];
  if (finalRef.path !== evidencePath.posixPath || finalRef.hash !== p4Internals.computeEvidenceSelfHash(evidence)) {
    throw contractError("P4 evidence self-hash is invalid");
  }
  for (const ref of evidence.artifacts) {
    if (ref.path === evidencePath.posixPath) continue;
    const actualHash = await canonicalFileHash(path.join(ROOT, ref.path));
    if (actualHash !== ref.hash) {
      throw contractError(`P4 artifact hash mismatch for ${ref.path}`);
    }
  }
}

async function writeDemo(outDir, data) {
  await fs.mkdir(outDir.fsPath, { recursive: true });
  await fs.writeFile(path.join(outDir.fsPath, "README.md"), [
    "# P4 Review And Judgment Demo",
    "",
    "Generated presentation output derived from passing P4 evidence.",
    "Proof authority remains `artifacts/p4/evidence.json`."
  ].join("\n") + "\n");
  await fs.writeFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
}

function buildHtml({ evidence, ledger, evaluationReport, reviewReport }) {
  const decisionRows = ledger.decisions.map((decision) =>
    `<tr><td><code>${escapeHtml(decision.decisionKey)}</code></td><td>${escapeHtml(decision.status)}</td><td>${escapeHtml(decision.promotionStatus)}</td><td>${escapeHtml(decision.secondReviewRequired)}</td><td>${escapeHtml(decision.rationale)}</td></tr>`
  ).join("");
  const findingRows = evaluationReport.findings.map((finding) =>
    `<tr><td><code>${escapeHtml(finding.findingId)}</code></td><td>${escapeHtml(finding.dimension)}</td><td>${escapeHtml(finding.severity)}</td><td>${escapeHtml(finding.result)}</td><td>${escapeHtml(finding.rationale)}</td></tr>`
  ).join("");
  const resultRows = reviewReport.results.map((result) =>
    `<tr><td><code>${escapeHtml(result.fixturePath)}</code></td><td>${escapeHtml(result.stage)}</td><td>${escapeHtml(result.actualResult)}</td><td>${escapeHtml(result.promotionStatus)}</td><td>${escapeHtml(result.diagnosticCodes.join(", ") || "none")}</td></tr>`
  ).join("");
  const diagnostics = evidence.diagnostics.map((diagnostic) =>
    `<li><code>${escapeHtml(diagnostic.code)}</code> ${escapeHtml(diagnostic.message)}</li>`
  ).join("");
  const boundaryHashes = evidence.boundaryRefs.map((artifact) =>
    `<li><code>${escapeHtml(artifact.path)}</code> ${escapeHtml(artifact.hash || "self")}</li>`
  ).join("");
  const artifactHashes = evidence.artifacts.map((artifact) =>
    `<li><code>${escapeHtml(artifact.path)}</code> ${escapeHtml(artifact.hash || "self")}</li>`
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P4 Review And Judgment Proof</title>
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
  <h1>P4 Review And Judgment Proof</h1>
  <p>Generated view of P3 review queue intake, deterministic SurfaceOps ledger rows, JudgmentKit-shaped findings, diagnostics, and evidence hashes.</p>
  <section class="meta">
    <div class="tile"><div class="label">Evidence</div><div class="value">${escapeHtml(evidence.status)} / ${escapeHtml(evidence.promotionStatus)}</div></div>
    <div class="tile"><div class="label">Run</div><div class="value">${escapeHtml(evidence.runId)}</div></div>
    <div class="tile"><div class="label">Decisions</div><div class="value">${ledger.decisions.length}</div></div>
    <div class="tile"><div class="label">Findings</div><div class="value">${evaluationReport.findings.length}</div></div>
  </section>
  <h2>SurfaceOps Decision Ledger</h2>
  <table><thead><tr><th>Decision Key</th><th>Status</th><th>Promotion</th><th>Second Review</th><th>Rationale</th></tr></thead><tbody>${decisionRows}</tbody></table>
  <h2>JudgmentKit-Shaped Findings</h2>
  <table><thead><tr><th>Finding</th><th>Dimension</th><th>Severity</th><th>Result</th><th>Rationale</th></tr></thead><tbody>${findingRows}</tbody></table>
  <h2>Manifest Results</h2>
  <table><thead><tr><th>Fixture</th><th>Stage</th><th>Actual</th><th>Promotion</th><th>Diagnostics</th></tr></thead><tbody>${resultRows}</tbody></table>
  <h2>Diagnostics</h2>
  <ul>${diagnostics}</ul>
  <h2>Boundary Hashes</h2>
  <ul>${boundaryHashes}</ul>
  <h2>P4 Artifact Hashes</h2>
  <ul>${artifactHashes}</ul>
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
