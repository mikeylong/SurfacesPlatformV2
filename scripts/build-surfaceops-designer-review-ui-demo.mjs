#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  DRUI_ARTIFACT_ROOT,
  DRUI_DEMO_ROOT,
  DRUI_SCHEMA_FILES,
  DRUI_SCHEMA_ROOT
} from "../src/surfaceops-designer-review-ui-contract.js";
import { verifySurfaceopsDesignerReviewUiEvidenceClosure } from "../src/surfaceops-designer-review-ui-evidence.js";
import { readJson } from "../src/p2-contract.js";

const ROOT = process.cwd();
const DEFAULT_EVIDENCE_PATH = `${DRUI_ARTIFACT_ROOT}/evidence.json`;
const DEFAULT_OUT_DIR = DRUI_DEMO_ROOT;

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:surfaceops-designer-review-ui-demo usage error" : "build:surfaceops-designer-review-ui-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || outDir.posixPath !== DEFAULT_OUT_DIR) {
    throw contractError(`SurfaceOps designer review UI demo requires --evidence ${DEFAULT_EVIDENCE_PATH} --out ${DEFAULT_OUT_DIR}`, 2);
  }

  const validators = await loadValidators();
  const evidence = await readJson(evidencePath.fsPath);
  assertSchema(validators, "surfaceops-designer-review-ui-evidence.v0", evidence, "SurfaceOps designer review UI evidence");
  const closure = await verifySurfaceopsDesignerReviewUiEvidenceClosure({
    cwd: ROOT,
    evidence,
    evidencePath: evidencePath.posixPath,
    assertSchema: (schemaId, data, label) => assertSchema(validators, schemaId, data, label)
  });
  const targetSelection = closure.generated["surfaceops-designer-review-ui-target-selection.v0"];
  const workbench = closure.generated["surfaceops-designer-review-workbench.v0"];
  const decisionReceipt = closure.generated["surfaceops-designer-review-decision-receipt.v0"];
  const report = closure.generated["surfaceops-designer-review-ui-report.v0"];

  await writeDemo(outDir, { evidence, targetSelection, workbench, decisionReceipt, report });
  console.log(`SurfaceOps designer review UI demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = { evidence: DEFAULT_EVIDENCE_PATH, out: DEFAULT_OUT_DIR };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/build-surfaceops-designer-review-ui-demo.mjs [--evidence ${DEFAULT_EVIDENCE_PATH}] [--out ${DEFAULT_OUT_DIR}]`);
      process.exit(0);
    }
    if (arg !== "--evidence" && arg !== "--out") throw usageError(`unknown argument ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw usageError(`${arg} requires a value`);
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
  for (const file of DRUI_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, DRUI_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-designer-review-ui/${schemaId}.schema.json`);
      if (!validate) throw contractError(`schema not loaded: surfaceops-designer-review-ui/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

function assertSchema(validators, schemaId, data, label) {
  const result = validators.validate(schemaId, data);
  if (!result.valid) throw contractError(`schema validation failed for ${label}: ${JSON.stringify(result.errors)}`);
}

async function writeDemo(outDir, data) {
  await fs.mkdir(outDir.fsPath, { recursive: true });
  await fs.writeFile(path.join(outDir.fsPath, "README.md"), [
    "# SurfaceOps Designer Review UI Demo",
    "",
    "Generated presentation output derived from pass/blocked `surfaceops-designer-review-ui` evidence.",
    "Proof authority remains `artifacts/surfaceops-designer-review-ui/evidence.json`.",
    "The accepted source review is expired, so inspection remains available while handoff stays blocked.",
    "Local-live browser evidence is generated separately under `output/playwright/surfaceops-designer-review-ui/`."
  ].join("\n") + "\n");
  await fs.writeFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
}

function buildHtml({ evidence, targetSelection, workbench, decisionReceipt, report }) {
  const payload = { evidence, targetSelection, workbench, decisionReceipt, report };
  const nodes = workbench.dag.nodes.map((node, index) => `
        <button class="dag-node${index === 3 ? " selected" : ""}" type="button" data-node-id="${escapeAttribute(node.nodeId)}" data-testid="dag-node-${escapeAttribute(node.nodeId)}">
          <span>${escapeHtml(node.label)}</span>
          <small>${escapeHtml(node.status)}</small>
        </button>`).join("");
  const edges = workbench.dag.edges.map((edge) => `<li><code>${escapeHtml(edge.from)}</code> to <code>${escapeHtml(edge.to)}</code> ${escapeHtml(edge.label)}</li>`).join("");
  const evidenceRows = evidence.boundaryRefs.map((ref) => refRow(ref)).join("");
  const artifactRows = evidence.artifacts.map((ref) => refRow(ref)).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SurfaceOps designer review UI proof</title>
  <link rel="icon" href="data:,">
  <style>
    :root {
      color-scheme: light;
      --canvas: #f6f7f9;
      --surface: #ffffff;
      --ink: #18202a;
      --muted: #5b6675;
      --border: #d7dde5;
      --teal: #0c7478;
      --green: #287046;
      --amber: #915e17;
      --red: #a13734;
      --blue: #295f9f;
      --focus: rgb(12 116 120 / 28%);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--canvas);
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100dvh; }
    button, textarea, select { font: inherit; letter-spacing: 0; }
    button:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
    header { background: var(--surface); border-bottom: 1px solid var(--border); }
    .topbar { max-width: 1500px; margin: 0 auto; padding: 16px 20px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: end; }
    h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); line-height: 1.45; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .pill { border: 1px solid var(--border); border-radius: 999px; padding: 6px 10px; background: #fbfcfd; color: var(--muted); font-size: 12px; font-weight: 700; }
    main { max-width: 1500px; margin: 0 auto; padding: 18px 20px 28px; display: grid; grid-template-columns: minmax(360px, 0.95fr) minmax(430px, 1.05fr) minmax(360px, 0.85fr); gap: 14px; align-items: start; }
    section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; min-width: 0; }
    .section-head { padding: 14px 14px 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    h2 { margin: 0; font-size: 16px; letter-spacing: 0; }
    h3 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0; }
    .body { padding: 14px; }
    .dag { display: grid; gap: 9px; }
    .dag-node { width: 100%; border: 1px solid var(--border); background: #fbfcfd; border-radius: 8px; padding: 10px 12px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; text-align: left; cursor: pointer; min-height: 48px; }
    .dag-node:hover, .dag-node.selected { border-color: var(--teal); background: #eef8f8; }
    .dag-node span { font-weight: 800; overflow-wrap: anywhere; }
    .dag-node small { color: var(--muted); font-weight: 700; }
    .edge-list { margin: 12px 0 0; padding-left: 18px; color: var(--muted); font-size: 13px; line-height: 1.55; }
    .workbench-grid { display: grid; gap: 12px; }
    .specimen { border: 1px solid var(--border); border-radius: 8px; padding: 16px; background: linear-gradient(180deg, #ffffff 0%, #f8fafb 100%); }
    .button-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 14px; }
    .sample-button { border: 0; border-radius: 6px; padding: 10px 16px; color: #fff; background: var(--teal); font-weight: 800; min-width: 112px; }
    .sample-button.secondary { background: var(--blue); }
    .sample-button.warning { background: var(--amber); }
    .delta-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .delta-list li { border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px; color: var(--muted); background: #fbfcfd; }
    label { display: grid; gap: 6px; color: var(--muted); font-size: 13px; font-weight: 700; }
    select, textarea { width: 100%; border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 9px 10px; color: var(--ink); }
    textarea { min-height: 92px; resize: vertical; }
    .governance-block { border: 1px solid #e5bd75; border-radius: 8px; padding: 10px 12px; background: #fff7e8; color: var(--amber); font-weight: 800; }
    .disabled-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .disabled-actions button { border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px; color: #788491; background: #eef1f4; font-weight: 800; }
    .primary-action { border: 0; border-radius: 8px; background: var(--amber); color: #fff; padding: 10px 14px; font-weight: 900; cursor: pointer; }
    .primary-action:disabled { background: #94a3ad; cursor: not-allowed; }
    .receipt { display: grid; gap: 10px; }
    .receipt-row { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .receipt-row strong { font-size: 13px; color: var(--muted); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid var(--border); padding: 8px; text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 11px; text-transform: uppercase; }
    .status { color: var(--green); font-weight: 900; }
    .mirror { display: grid; gap: 8px; }
    .mirror-step { border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: #fbfcfd; }
    .mirror-step strong { display: block; margin-bottom: 4px; }
    .tabs { display: flex; gap: 6px; padding: 10px 14px 0; border-bottom: 1px solid var(--border); }
    .tab { border: 1px solid var(--border); border-bottom: 0; border-radius: 8px 8px 0 0; background: #eef2f5; padding: 8px 10px; font-weight: 800; cursor: pointer; }
    .tab.active { background: #fff; color: var(--teal); }
    .tab-panel { display: none; padding: 14px; }
    .tab-panel.active { display: block; }
    @media (max-width: 1100px) {
      main { grid-template-columns: 1fr; }
      .topbar { grid-template-columns: 1fr; }
      .meta { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <div>
        <h1>SurfaceOps Designer Review UI</h1>
        <p>Local-live inspection workbench for Button variants, preserving the expired source-review block and mirroring it to kanban.cards.</p>
      </div>
      <div class="meta">
        <span class="pill">status <strong>${escapeHtml(evidence.status)}</strong></span>
        <span class="pill">promotion <strong>${escapeHtml(evidence.promotionStatus)}</strong></span>
        <span class="pill">target <strong>${escapeHtml(targetSelection.targetId)}</strong></span>
      </div>
    </div>
  </header>
  <main>
    <section>
      <div class="section-head"><h2>SurfaceOps DAG</h2><span class="pill">card to receipt</span></div>
      <div class="body">
        <div class="dag">${nodes}</div>
        <ol class="edge-list">${edges}</ol>
      </div>
    </section>
    <section>
      <div class="section-head"><h2>Inspector</h2><span class="pill">${escapeHtml(workbench.inspector.selectedVariantId)}</span></div>
      <div class="body workbench-grid">
        <div class="governance-block"><code>SOURCE_REVIEW_EXPIRED</code> · renewal required before handoff. Approval and refinement are unavailable.</div>
        <div class="specimen">
          <h3>Button variants</h3>
          <p>Evidence-bound visual review for the selected DAG node.</p>
          <div class="button-row">
            <button class="sample-button" type="button">Primary</button>
            <button class="sample-button secondary" type="button">Secondary</button>
            <button class="sample-button warning" type="button">Needs review</button>
          </div>
        </div>
        <ul class="delta-list">${workbench.inspector.interpretedDeltas.map((delta) => `<li>${escapeHtml(delta)}</li>`).join("")}</ul>
        <label>Inspected variant (not a variant of record)
          <select id="variant" data-testid="variant-select" disabled>
            <option value="${escapeAttribute(workbench.inspector.selectedVariantId)}" selected>${escapeHtml(workbench.inspector.selectedVariantId)}</option>
          </select>
        </label>
        <div class="disabled-actions">
          <button type="button" disabled>Approve for handoff unavailable</button>
          <button type="button" disabled>Request refinement unavailable</button>
        </div>
        <label>Rationale
          <textarea id="rationale" data-testid="decision-rationale" placeholder="Explain why the outcome remains blocked">${escapeHtml(decisionReceipt.rationale)}</textarea>
        </label>
        <button id="submitDecision" class="primary-action" type="button" data-testid="submit-decision" disabled>Record blocked outcome</button>
      </div>
    </section>
    <section>
      <div class="section-head"><h2>Receipt And Mirror</h2><span class="pill status">${escapeHtml(decisionReceipt.decisionState)}</span></div>
      <div class="body receipt" id="receipt" data-testid="decision-receipt">
        <div class="receipt-row"><strong>Decision</strong><code>${escapeHtml(decisionReceipt.decisionId)}</code></div>
        <div class="receipt-row"><strong>Variant of record</strong><code>none</code></div>
        <div class="receipt-row"><strong>Blocking code</strong><code>${escapeHtml(decisionReceipt.governanceOutcome.blockingDiagnosticCodes.join(", "))}</code></div>
        <div class="receipt-row"><strong>Kanban</strong><code>${escapeHtml(decisionReceipt.mirroredKanbanStatus)}</code></div>
        <div class="mirror">
          <div class="mirror-step"><strong>Before</strong>${escapeHtml(workbench.kanbanMirror.beforeStatus)}</div>
          <div class="mirror-step"><strong>After</strong>${escapeHtml(workbench.kanbanMirror.afterStatus)}</div>
          <div class="mirror-step"><strong>Authority</strong>Lane movement is mirror-only; SurfaceOps owns the decision receipt.</div>
        </div>
      </div>
    </section>
    <section style="grid-column: 1 / -1;">
      <div class="tabs">
        <button class="tab active" type="button" data-tab="evidence">Evidence</button>
        <button class="tab" type="button" data-tab="artifacts">Artifacts</button>
        <button class="tab" type="button" data-tab="diagnostics">Diagnostics</button>
      </div>
      <div class="tab-panel active" data-panel="evidence">
        <table><thead><tr><th>Path</th><th>Schema</th><th>Hash</th></tr></thead><tbody>${evidenceRows}</tbody></table>
      </div>
      <div class="tab-panel" data-panel="artifacts">
        <table><thead><tr><th>Path</th><th>Schema</th><th>Hash</th></tr></thead><tbody>${artifactRows}</tbody></table>
      </div>
      <div class="tab-panel" data-panel="diagnostics">
        <table><thead><tr><th>Fixture</th><th>Actual</th><th>Diagnostics</th></tr></thead><tbody>${report.validationResults.map((row) => `<tr><td><code>${escapeHtml(row.fixturePath)}</code></td><td>${escapeHtml(row.actualResult)}</td><td><code>${escapeHtml(row.diagnosticCodes.join(", ") || "none")}</code></td></tr>`).join("")}</tbody></table>
      </div>
    </section>
  </main>
  <script type="application/json" id="proof-data">${escapeHtml(JSON.stringify(payload))}</script>
  <script>
    const rationale = document.querySelector("#rationale");
    const submit = document.querySelector("#submitDecision");
    function refreshSubmit() {
      submit.disabled = rationale.value.trim().length === 0;
    }
    rationale.addEventListener("input", refreshSubmit);
    submit.addEventListener("click", () => {
      document.querySelector("#receipt").dataset.receiptRecorded = "true";
      submit.textContent = "Blocked outcome recorded";
      submit.disabled = true;
    });
    document.querySelectorAll(".dag-node").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".dag-node").forEach((node) => node.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
    document.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
        document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.tab));
      });
    });
    refreshSubmit();
  </script>
</body>
</html>`;
}

function refRow(ref) {
  return `<tr><td><code>${escapeHtml(ref.path)}</code></td><td>${escapeHtml(ref.schemaId)}</td><td><code>${escapeHtml(ref.hash || "pending")}</code></td></tr>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function usageError(message) {
  const error = new Error(message);
  error.exitCode = 2;
  return error;
}

function contractError(message, exitCode = 1) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}
