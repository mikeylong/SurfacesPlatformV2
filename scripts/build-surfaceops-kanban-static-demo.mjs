#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  SK_ARTIFACT_ROOT,
  SK_SCHEMA_FILES,
  SK_SCHEMA_ROOT
} from "../src/surfaceops-kanban-static-contract.js";
import { surfaceopsKanbanStaticInternals } from "../src/surfaceops-kanban-static-proof.js";
import {
  canonicalFileHash,
  readJson
} from "../src/p2-contract.js";

const ROOT = process.cwd();
const DEFAULT_EVIDENCE_PATH = "artifacts/surfaceops-kanban-static/evidence.json";
const DEFAULT_OUT_DIR = "demo/surfaceops-kanban-static";

main().catch((error) => {
  const prefix = error.exitCode === 2 ? "build:surfaceops-kanban-static-demo usage error" : "build:surfaceops-kanban-static-demo failed";
  console.error(`${prefix}: ${error.message}`);
  process.exit(error.exitCode || 1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidencePath = workspacePath(args.evidence, "--evidence");
  const outDir = workspacePath(args.out, "--out");
  if (evidencePath.posixPath !== DEFAULT_EVIDENCE_PATH || path.posix.dirname(evidencePath.posixPath) !== SK_ARTIFACT_ROOT) {
    throw contractError(`SurfaceOps kanban static demo evidence must be ${DEFAULT_EVIDENCE_PATH}`);
  }

  const validators = await loadValidators();
  const evidence = await readJson(evidencePath.fsPath);
  assertSchema(validators, "surfaceops-kanban-evidence.v0", evidence, "SurfaceOps kanban evidence");
  await verifyEvidence(evidence, evidencePath);

  const [targetSelection, projection, viewModel, reviewPacket, decisionsPacket, report] = await Promise.all([
    readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-target-selection.json")),
    readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-board-projection.json")),
    readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-designer-view-model.json")),
    readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-board-packet.review-work.json")),
    readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-board-packet.decisions.json")),
    readJson(path.join(ROOT, SK_ARTIFACT_ROOT, "surfaceops-kanban-adapter-report.json"))
  ]);

  await writeDemo(outDir, {
    evidence,
    targetSelection,
    projection,
    viewModel,
    reviewPacket,
    decisionsPacket,
    report
  });
  console.log(`SurfaceOps kanban static demo generated: ${outDir.posixPath}/index.html`);
}

function parseArgs(argv) {
  const args = {
    evidence: DEFAULT_EVIDENCE_PATH,
    out: DEFAULT_OUT_DIR
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/build-surfaceops-kanban-static-demo.mjs [--evidence artifacts/surfaceops-kanban-static/evidence.json] [--out demo/surfaceops-kanban-static]");
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
  for (const file of SK_SCHEMA_FILES) {
    const schema = await readJson(path.join(ROOT, SK_SCHEMA_ROOT, file));
    ajv.addSchema(schema);
  }
  return {
    validate(schemaId, data) {
      const validate = ajv.getSchema(`https://surfaces.dev/schemas/surfaceops-kanban-static/${schemaId}.schema.json`);
      if (!validate) throw contractError(`schema not loaded: surfaceops-kanban-static/${schemaId}`);
      const valid = validate(data);
      return { valid, errors: validate.errors || [] };
    }
  };
}

async function verifyEvidence(evidence, evidencePath) {
  if (evidence.status !== "pass") {
    throw contractError("SurfaceOps kanban static demo requires passing evidence");
  }
  const finalRef = evidence.artifacts[evidence.artifacts.length - 1];
  if (finalRef.path !== evidencePath.posixPath || finalRef.hash !== surfaceopsKanbanStaticInternals.computeEvidenceSelfHash(evidence)) {
    throw contractError("SurfaceOps kanban static evidence self-hash is invalid");
  }
  const integrityCode = await surfaceopsKanbanStaticInternals.firstEvidenceIntegrityFailureCode(ROOT, evidence);
  if (integrityCode !== null) {
    throw contractError(`SurfaceOps kanban static evidence integrity verification failed: ${integrityCode}`);
  }
  for (const ref of evidence.artifacts) {
    if (ref.path === evidencePath.posixPath) continue;
    const actualHash = await canonicalFileHash(path.join(ROOT, ref.path));
    if (actualHash !== ref.hash) {
      throw contractError(`SurfaceOps kanban static artifact hash mismatch for ${ref.path}`);
    }
  }
}

async function writeDemo(outDir, data) {
  await fs.mkdir(outDir.fsPath, { recursive: true });
  await fs.writeFile(path.join(outDir.fsPath, "README.md"), [
    "# SurfaceOps Kanban Static Demo",
    "",
    "Generated presentation output derived from passing `surfaceops-kanban-static` evidence.",
    "Proof authority remains `artifacts/surfaceops-kanban-static/evidence.json`.",
    "Browser-functional recordings are generated separately under `output/playwright/surfaceops-kanban-static/`."
  ].join("\n") + "\n");
  await fs.writeFile(path.join(outDir.fsPath, "index.html"), buildHtml(data));
}

function buildHtml({ evidence, targetSelection, projection, viewModel, reviewPacket, decisionsPacket, report }) {
  const cards = projection.cards;
  const firstCard = cards[0] || null;
  const lanes = projection.lanes.map((lane) => ({
    ...lane,
    cards: cards.filter((card) => card.laneId === lane.laneId)
  }));
  const packets = [reviewPacket, decisionsPacket];
  const payload = {
    evidence,
    targetSelection,
    projection,
    viewModel,
    packets,
    report,
    firstCardId: firstCard?.cardId ?? null
  };
  const laneHtml = lanes.map((lane) => `
      <section class="lane" data-testid="lane-${escapeAttribute(lane.laneId)}" data-lane-id="${escapeAttribute(lane.laneId)}">
        <div class="lane-head">
          <h2>${escapeHtml(lane.title)}</h2>
          <span class="count" data-testid="lane-count-${escapeAttribute(lane.laneId)}">${lane.cards.length}</span>
        </div>
        <div class="lane-body">
          ${lane.cards.map((card) => cardHtml(card)).join("") || `<p class="empty">No cards</p>`}
        </div>
      </section>`).join("");
  const boundaryRefs = evidence.boundaryRefs.map((ref) => refRow(ref)).join("");
  const artifactRefs = evidence.artifacts.map((ref) => refRow(ref)).join("");
  const packetRows = packets.map((packet) => `
      <tr>
        <td><code>${escapeHtml(packet.packetId)}</code></td>
        <td>${escapeHtml(packet.packetKind)}</td>
        <td data-testid="packet-execution-authorized">${escapeHtml(String(packet.execution.authorized))}</td>
        <td>${escapeHtml(packet.records.length)}</td>
      </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SurfaceOps kanban static proof</title>
  <link rel="icon" href="data:,">
  <style>
    :root {
      color-scheme: light;
      --canvas: #f4f6f8;
      --surface: #ffffff;
      --surface-alt: #eef3f2;
      --text: #17202a;
      --muted: #586678;
      --border: #d4dce5;
      --teal: #0f6b72;
      --green: #2f6c49;
      --amber: #8b5c15;
      --red: #a23b35;
      --blue: #295f9f;
      --shadow: 0 12px 32px rgb(23 32 42 / 8%);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--canvas);
    }
    * { box-sizing: border-box; }
    body { margin: 0; }
    button { font: inherit; letter-spacing: 0; }
    button:focus-visible, [tabindex]:focus-visible { outline: 3px solid rgb(15 107 114 / 32%); outline-offset: 2px; }
    .app { min-height: 100dvh; display: grid; grid-template-rows: auto auto 1fr; }
    header { border-bottom: 1px solid var(--border); background: var(--surface); }
    .topbar { max-width: 1440px; margin: 0 auto; padding: 18px 20px 16px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: end; }
    h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); line-height: 1.5; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .pill { border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--muted); padding: 6px 10px; font-size: 12px; font-weight: 700; }
    .pill strong { color: var(--text); }
    .tabs { border-bottom: 1px solid var(--border); background: #fbfcfd; }
    .tab-inner { max-width: 1440px; margin: 0 auto; padding: 10px 20px; display: flex; flex-wrap: wrap; gap: 8px; }
    .tab { border: 1px solid var(--border); background: var(--surface); border-radius: 6px; padding: 8px 12px; color: var(--text); cursor: pointer; }
    .tab[aria-selected="true"] { border-color: var(--teal); color: var(--teal); box-shadow: inset 0 0 0 1px var(--teal); }
    main { max-width: 1440px; width: 100%; margin: 0 auto; padding: 16px 20px 34px; }
    .view[hidden] { display: none; }
    .board-shell { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 14px; align-items: start; }
    .board { display: grid; grid-template-columns: repeat(3, minmax(230px, 1fr)); gap: 12px; align-items: start; overflow-x: auto; padding-bottom: 4px; }
    .lane { min-height: 460px; border: 1px solid var(--border); border-radius: 8px; background: #fbfcfd; overflow: hidden; }
    .lane-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--border); background: var(--surface); padding: 12px; }
    h2 { margin: 0; font-size: 15px; letter-spacing: 0; }
    .count { min-width: 28px; border-radius: 999px; background: var(--surface-alt); color: var(--teal); text-align: center; padding: 3px 8px; font-size: 12px; font-weight: 750; }
    .lane-body { display: grid; gap: 10px; padding: 10px; }
    .empty { min-height: 68px; display: grid; place-items: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--muted); font-size: 13px; }
    .card { width: 100%; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); box-shadow: var(--shadow); padding: 12px; text-align: left; cursor: pointer; }
    .card[aria-selected="true"] { border-color: var(--teal); box-shadow: inset 0 0 0 1px var(--teal), var(--shadow); }
    .card-title { margin: 0 0 10px; font-weight: 750; }
    .card-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .mini { border: 1px solid var(--border); border-radius: 6px; padding: 7px; background: #fbfcfd; min-width: 0; }
    .mini span { display: block; color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .mini strong { display: block; margin-top: 3px; overflow-wrap: break-word; }
    .detail { border: 1px solid var(--border); border-radius: 8px; background: var(--surface); box-shadow: var(--shadow); padding: 16px; position: sticky; top: 12px; }
    .detail h2 { font-size: 18px; margin-bottom: 8px; }
    .detail-list { display: grid; gap: 10px; margin-top: 14px; }
    .detail-row { border-top: 1px solid var(--border); padding-top: 10px; }
    .detail-row span { display: block; color: var(--muted); font-size: 12px; font-weight: 750; text-transform: uppercase; }
    .detail-row strong, .detail-row code { display: block; margin-top: 3px; overflow-wrap: anywhere; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
    .table-wrap { border: 1px solid var(--border); border-radius: 8px; background: var(--surface); overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 760px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e6ebf1; vertical-align: top; }
    th { background: #edf1f5; font-size: 13px; }
    .stack { display: grid; gap: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 12px; margin-bottom: 14px; }
    .summary { border: 1px solid var(--border); border-radius: 8px; background: var(--surface); padding: 12px; }
    .summary span { display: block; color: var(--muted); font-size: 12px; font-weight: 750; text-transform: uppercase; }
    .summary strong { display: block; margin-top: 4px; overflow-wrap: anywhere; }
    .boundary { border-left: 4px solid var(--teal); background: #eef7f6; }
    @media (max-width: 980px) {
      .topbar { grid-template-columns: 1fr; }
      .meta { justify-content: flex-start; }
      .board-shell { grid-template-columns: 1fr; }
      .detail { position: static; }
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      main, .topbar, .tab-inner { padding-left: 12px; padding-right: 12px; }
      .board { grid-template-columns: minmax(250px, 1fr); }
      .summary-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="app">
  <header>
    <div class="topbar">
      <div>
        <h1>SurfaceOps kanban static proof</h1>
        <p>Generated board projection for accepted P3/P4 review evidence and a manifest-declared kanban.cards substrate contract.</p>
      </div>
      <div class="meta">
        <span class="pill" data-testid="proof-status">Proof <strong>${escapeHtml(evidence.status)}</strong></span>
        <span class="pill" data-testid="promotion-status">Promotion <strong>${escapeHtml(evidence.promotionStatus)}</strong></span>
        <span class="pill">Target <strong>${escapeHtml(targetSelection.targetId)}</strong></span>
      </div>
    </div>
  </header>
  <nav class="tabs" aria-label="SurfaceOps kanban views">
    <div class="tab-inner">
      <button class="tab" data-view-target="board-view" data-testid="view-board" aria-selected="true">Board</button>
      <button class="tab" data-view-target="evidence-view" data-testid="view-evidence" aria-selected="false">Evidence</button>
      <button class="tab" data-view-target="packets-view" data-testid="view-packets" aria-selected="false">Packets</button>
    </div>
  </nav>
  <main>
    <section class="view" id="board-view" data-testid="board-view">
      <div class="summary-grid">
        <div class="summary"><span>Allowed cards</span><strong data-testid="allowed-count">${escapeHtml(viewModel.promotionStatus.boardCards.allowed.length)}</strong></div>
        <div class="summary"><span>Review required</span><strong>${escapeHtml(viewModel.promotionStatus.boardCards.reviewRequired.length)}</strong></div>
        <div class="summary"><span>Blocked</span><strong>${escapeHtml(viewModel.promotionStatus.boardCards.blocked.length)}</strong></div>
        <div class="summary boundary"><span>Execution authorized</span><strong data-testid="execution-authorized">false</strong></div>
      </div>
      <div class="board-shell">
        <section class="board" aria-label="Static board projection">${laneHtml}</section>
        <aside class="detail" data-testid="detail-panel" aria-live="polite">
          <h2 data-testid="detail-card-title"></h2>
          <p data-testid="detail-summary"></p>
          <div class="detail-list">
            <div class="detail-row"><span>Decision</span><strong data-testid="detail-decision"></strong></div>
            <div class="detail-row"><span>Next owner</span><strong data-testid="detail-owner"></strong></div>
            <div class="detail-row"><span>Evidence refs</span><strong data-testid="detail-evidence-count"></strong></div>
            <div class="detail-row"><span>Decision ref</span><code data-testid="detail-decision-ref"></code></div>
            <div class="detail-row"><span>Source refs</span><code data-testid="detail-source-refs"></code></div>
          </div>
        </aside>
      </div>
    </section>
    <section class="view stack" id="evidence-view" data-testid="evidence-view" hidden>
      <div class="summary-grid">
        <div class="summary"><span>Run</span><strong>${escapeHtml(evidence.runId)}</strong></div>
        <div class="summary"><span>Validation results</span><strong>${escapeHtml(evidence.validationResults.length)}</strong></div>
        <div class="summary"><span>Diagnostics</span><strong>${escapeHtml(evidence.diagnostics.length)}</strong></div>
        <div class="summary boundary"><span>Authority</span><strong>${escapeHtml("evidence.json")}</strong></div>
      </div>
      <div class="table-wrap">
        <table data-testid="evidence-table">
          <thead><tr><th>Boundary ref</th><th>Schema</th><th>Hash</th></tr></thead>
          <tbody>${boundaryRefs}</tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Generated artifact</th><th>Schema</th><th>Hash</th></tr></thead>
          <tbody>${artifactRefs}</tbody>
        </table>
      </div>
    </section>
    <section class="view stack" id="packets-view" data-testid="packets-view" hidden>
      <div class="summary-grid">
        <div class="summary"><span>Packet handoff</span><strong>${escapeHtml(String(viewModel.handoffEligibility.staticBoardPacket))}</strong></div>
        <div class="summary"><span>Forbidden claims</span><strong>${escapeHtml(viewModel.handoffEligibility.forbiddenClaims.length)}</strong></div>
        <div class="summary boundary"><span>Live writes</span><strong data-testid="live-writes">false</strong></div>
        <div class="summary boundary"><span>Network transport</span><strong data-testid="network-transport">false</strong></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Packet</th><th>Kind</th><th>Execution authorized</th><th>Records</th></tr></thead>
          <tbody>${packetRows}</tbody>
        </table>
      </div>
    </section>
  </main>
</div>
<script id="surfaceops-data" type="application/json">${escapeScriptJson(JSON.stringify(payload))}</script>
<script>
const data = JSON.parse(document.getElementById("surfaceops-data").textContent);
const cards = new Map(data.projection.cards.map((card) => [card.cardId, card]));
const viewModelCards = new Map(data.viewModel.boardSummary.cards.map((card) => [card.cardId, card]));
let selectedCardId = data.firstCardId;

function selectCard(cardId) {
  selectedCardId = cardId;
  document.querySelectorAll("[data-card-id]").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.cardId === cardId));
  });
  const card = cards.get(cardId);
  const viewCard = viewModelCards.get(cardId);
  if (!card || !viewCard) return;
  document.querySelector("[data-testid='detail-card-title']").textContent = card.title;
  document.querySelector("[data-testid='detail-summary']").textContent = viewCard.whyThisLane;
  document.querySelector("[data-testid='detail-decision']").textContent = card.decisionPromotionStatus + " / " + card.decisionStatus;
  document.querySelector("[data-testid='detail-owner']").textContent = card.nextActionOwner.ownerRole + " -> " + card.nextActionOwner.nextAction;
  document.querySelector("[data-testid='detail-evidence-count']").textContent = String(card.evidenceRefs.length);
  document.querySelector("[data-testid='detail-decision-ref']").textContent = viewCard.decisionRef.decisionId;
  document.querySelector("[data-testid='detail-source-refs']").textContent = viewCard.sourceRefs.join(", ");
}

document.querySelectorAll("[data-card-id]").forEach((button) => {
  button.addEventListener("click", () => selectCard(button.dataset.cardId));
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view-target]").forEach((tab) => tab.setAttribute("aria-selected", "false"));
    button.setAttribute("aria-selected", "true");
    document.querySelectorAll(".view").forEach((view) => {
      view.hidden = view.id !== button.dataset.viewTarget;
    });
  });
});

if (selectedCardId) selectCard(selectedCardId);
</script>
</body>
</html>
`;
}

function cardHtml(card) {
  return `<button class="card" data-card-id="${escapeAttribute(card.cardId)}" data-lane-id="${escapeAttribute(card.laneId)}" data-testid="card-${escapeAttribute(slug(card.cardId))}" aria-selected="false">
    <p class="card-title">${escapeHtml(card.title)}</p>
    <div class="card-grid">
      <div class="mini"><span>Queue</span><strong>${escapeHtml(card.queuePromotionStatus)}</strong></div>
      <div class="mini"><span>Decision</span><strong>${escapeHtml(card.decisionPromotionStatus ?? "none")}</strong></div>
      <div class="mini"><span>Owner</span><strong>${escapeHtml(card.nextActionOwner.ownerRole)}</strong></div>
      <div class="mini"><span>Evidence</span><strong>${escapeHtml(card.evidenceRefs.length)}</strong></div>
    </div>
  </button>`;
}

function refRow(ref) {
  return `<tr><td><code>${escapeHtml(ref.path)}</code></td><td>${escapeHtml(ref.schemaId)}</td><td><code>${escapeHtml(ref.hash ?? "self")}</code></td></tr>`;
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

function slug(value) {
  return String(value).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function escapeScriptJson(value) {
  return value.replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function escapeAttribute(value) {
  return escapeHtml(value);
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
