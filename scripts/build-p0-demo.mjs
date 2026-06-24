import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const demoDir = path.join(root, "demo/p0");
const demoPath = path.join(demoDir, "index.html");

const files = {
  evidence: "artifacts/p0/evidence.json",
  adapterDiagnostics: "artifacts/p0/adapter-diagnostics.json",
  governedCatalog: "artifacts/p0/governed-catalog.json",
  sourceFixture: "fixtures/p0/source.fixture.json",
  expectationsManifest: "fixtures/p0/expectations.manifest.json"
};

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

function countObject(value) {
  return value && typeof value === "object" ? Object.keys(value).length : 0;
}

function buildDemoData(loaded) {
  const components = Object.entries(loaded.governedCatalog.components || {}).map(([id, component]) => ({
    id,
    props: Object.keys(component.props || {}),
    variants: Object.keys(component.variants || {}),
    states: Object.keys(component.states || {}),
    slots: Object.keys(component.slots || {}),
    actions: Object.values(component.actions || {}).map((action) => ({
      id: action.id,
      destructive: Boolean(action.destructive),
      disabledUntilImplemented: Boolean(action.disabledUntilImplemented),
      requiresReview: Boolean(action.requiresReview)
    })),
    events: Object.keys(component.events || {}),
    role: component.accessibility?.role || null,
    sourceRef: component.sourceRef
  }));

  const matchedResults = loaded.evidence.validationResults.filter((result) => result.matched).length;
  const invalidResults = loaded.evidence.validationResults.filter((result) => result.actualValidationResult === "invalid").length;
  const reviewResults = loaded.evidence.validationResults.filter((result) => result.actualPromotionStatus === "review_required").length;
  const blockedResults = loaded.evidence.validationResults.filter((result) => result.actualPromotionStatus === "blocked").length;

  return {
    generatedAt: loaded.evidence.checkedAt,
    files,
    summary: {
      contractId: loaded.evidence.contractId,
      runId: loaded.evidence.runId,
      status: loaded.evidence.status,
      promotionStatus: loaded.evidence.promotionStatus,
      validationMatched: matchedResults,
      validationTotal: loaded.evidence.validationResults.length,
      invalidResults,
      blockedResults,
      reviewResults,
      adapterResults: loaded.adapterDiagnostics.results.length,
      adapterStatus: loaded.adapterDiagnostics.status,
      componentCount: components.length,
      tokenGroupCount: countObject(loaded.governedCatalog.tokens),
      artifactCount: loaded.evidence.artifacts.length,
      expectationCount: loaded.expectationsManifest.expectations.length
    },
    components,
    flow: [
      ["Source", "fixtures/p0/source.fixture.json"],
      ["Extract", "artifacts/p0/extract.json"],
      ["Catalog", "artifacts/p0/catalog.json"],
      ["Govern", "artifacts/p0/governed-catalog.json"],
      ["Adapter", "artifacts/p0/adapter-diagnostics.json"],
      ["Evidence", "artifacts/p0/evidence.json"]
    ],
    governance: loaded.governedCatalog.governance,
    runtimeCapabilities: loaded.governedCatalog.runtimeCapabilities,
    validationResults: loaded.evidence.validationResults,
    diagnostics: loaded.evidence.diagnostics,
    adapterResults: loaded.adapterDiagnostics.results,
    artifacts: loaded.evidence.artifacts,
    raw: loaded
  };
}

function escapeScriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function buildHtml(data) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Surfaces P0 Proof Viewer</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231d2027'/%3E%3Cpath d='M8 10h16v3H8zM8 15h12v3H8zM8 20h16v3H8z' fill='%23ffffff'/%3E%3C/svg%3E">
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-2: #eef1f4;
      --ink: #1d2027;
      --muted: #626a76;
      --line: #d9dee6;
      --line-strong: #b8c0cc;
      --green: #0f7a5f;
      --green-soft: #e8f5ef;
      --amber: #9a6400;
      --amber-soft: #fff3d6;
      --red: #b42318;
      --red-soft: #fde8e4;
      --blue: #0b5fff;
      --blue-soft: #e8efff;
      --shadow: 0 1px 2px rgba(29, 32, 39, 0.08), 0 10px 28px rgba(29, 32, 39, 0.06);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-width: 320px;
      background: var(--bg);
      color: var(--ink);
      letter-spacing: 0;
    }

    button, input, select {
      font: inherit;
      letter-spacing: 0;
    }

    .shell {
      width: min(1440px, 100%);
      margin: 0 auto;
      padding: 24px;
    }

    .topbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 20px;
      align-items: start;
      padding: 20px 0 18px;
      border-bottom: 1px solid var(--line);
    }

    .eyebrow {
      margin: 0 0 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 34px;
      line-height: 1.08;
      font-weight: 760;
    }

    .run-meta {
      min-width: min(420px, 100%);
      display: grid;
      gap: 8px;
      justify-items: end;
      color: var(--muted);
      font-size: 13px;
    }

    .status-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 5px 9px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .pill.pass,
    .pill.allowed {
      border-color: #9bd5c0;
      background: var(--green-soft);
      color: var(--green);
    }

    .pill.review_required,
    .pill.review {
      border-color: #f3ce7d;
      background: var(--amber-soft);
      color: var(--amber);
    }

    .pill.blocked,
    .pill.invalid {
      border-color: #f3aaa0;
      background: var(--red-soft);
      color: var(--red);
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(150px, 1fr));
      gap: 12px;
      margin: 18px 0;
    }

    .metric,
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .metric {
      padding: 14px;
      min-height: 96px;
    }

    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .metric strong {
      display: block;
      margin-top: 8px;
      font-size: 28px;
      line-height: 1;
    }

    .metric small {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .proof-flow {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 18px;
      padding: 0;
      list-style: none;
    }

    .flow-step {
      position: relative;
      min-height: 86px;
      padding: 13px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
    }

    .flow-step::after {
      content: "";
      position: absolute;
      top: 50%;
      right: -10px;
      width: 10px;
      height: 1px;
      background: var(--line-strong);
    }

    .flow-step:last-child::after {
      display: none;
    }

    .flow-step span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .flow-step strong {
      display: block;
      margin-top: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .tabs {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 4px;
      padding: 10px 0;
      background: rgba(246, 247, 249, 0.96);
      border-bottom: 1px solid var(--line);
      overflow-x: auto;
    }

    .tab-button,
    .filter-button {
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--muted);
      cursor: pointer;
      font-weight: 700;
      white-space: nowrap;
    }

    .tab-button {
      padding: 0 13px;
    }

    .filter-button {
      padding: 0 10px;
      font-size: 13px;
    }

    .tab-button[aria-selected="true"],
    .filter-button[aria-pressed="true"] {
      border-color: #9ab6ff;
      background: var(--blue-soft);
      color: var(--blue);
    }

    .tab-panel {
      display: none;
      padding: 18px 0 40px;
    }

    .tab-panel.active {
      display: block;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 16px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .panel {
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      background: #fbfcfd;
    }

    .panel-title {
      margin: 0;
      font-size: 15px;
      font-weight: 760;
    }

    .panel-body {
      padding: 16px;
    }

    .component-list {
      display: grid;
      gap: 12px;
    }

    .component {
      display: grid;
      grid-template-columns: minmax(180px, 0.6fr) minmax(0, 1.4fr);
      gap: 12px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
    }

    .component h3 {
      margin: 0 0 8px;
      font-size: 17px;
    }

    .component-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 3px 7px;
      border-radius: 6px;
      background: var(--surface-2);
      color: var(--ink);
      font-size: 12px;
      font-weight: 650;
      white-space: nowrap;
    }

    .chip.warning {
      background: var(--amber-soft);
      color: var(--amber);
    }

    .kv {
      display: grid;
      gap: 10px;
      margin: 0;
    }

    .kv div {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr);
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--line);
    }

    .kv div:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .kv dt {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .kv dd {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
    }

    .search {
      flex: 1 1 260px;
      min-height: 38px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--ink);
    }

    .filter-group {
      display: flex;
      gap: 4px;
      overflow-x: auto;
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
    }

    table {
      width: 100%;
      min-width: 980px;
      border-collapse: collapse;
      font-size: 13px;
    }

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }

    th {
      position: sticky;
      top: 57px;
      z-index: 1;
      background: #fbfcfd;
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    code,
    pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }

    code {
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    pre {
      margin: 0;
      max-height: 620px;
      overflow: auto;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #171a21;
      color: #f5f7fb;
      font-size: 12px;
      line-height: 1.5;
    }

    select {
      min-height: 38px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--ink);
    }

    .empty {
      padding: 28px;
      color: var(--muted);
      text-align: center;
    }

    @media (max-width: 1080px) {
      .metrics,
      .proof-flow,
      .grid-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .flow-step::after {
        display: none;
      }

      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .shell {
        padding: 16px;
      }

      .topbar {
        grid-template-columns: 1fr;
      }

      .run-meta,
      .status-row {
        justify-items: start;
        justify-content: flex-start;
      }

      h1 {
        font-size: 28px;
      }

      .metrics,
      .proof-flow,
      .grid-3 {
        grid-template-columns: 1fr;
      }

      .component {
        grid-template-columns: 1fr;
      }

      .kv div {
        grid-template-columns: 1fr;
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Surfaces Platform V2</p>
        <h1>P0 Proof Viewer</h1>
      </div>
      <div class="run-meta">
        <div class="status-row">
          <span id="statusPill" class="pill"></span>
          <span id="promotionPill" class="pill"></span>
        </div>
        <code id="runId"></code>
      </div>
    </header>

    <section id="metrics" class="metrics" aria-label="Proof metrics"></section>
    <ol id="proofFlow" class="proof-flow"></ol>

    <nav class="tabs" aria-label="P0 proof views">
      <button class="tab-button" type="button" data-tab="overview" aria-selected="true">Overview</button>
      <button class="tab-button" type="button" data-tab="catalog" aria-selected="false">Catalog</button>
      <button class="tab-button" type="button" data-tab="fixtures" aria-selected="false">Fixtures</button>
      <button class="tab-button" type="button" data-tab="diagnostics" aria-selected="false">Diagnostics</button>
      <button class="tab-button" type="button" data-tab="evidence" aria-selected="false">Evidence</button>
      <button class="tab-button" type="button" data-tab="json" aria-selected="false">JSON</button>
    </nav>

    <main>
      <section id="overview" class="tab-panel active"></section>
      <section id="catalog" class="tab-panel"></section>
      <section id="fixtures" class="tab-panel"></section>
      <section id="diagnostics" class="tab-panel"></section>
      <section id="evidence" class="tab-panel"></section>
      <section id="json" class="tab-panel"></section>
    </main>
  </div>

  <script id="demo-data" type="application/json">${escapeScriptJson(data)}</script>
  <script>
    const data = JSON.parse(document.getElementById("demo-data").textContent);
    let fixtureFilter = "all";
    let fixtureSearch = "";
    let diagnosticSearch = "";

    const panels = [...document.querySelectorAll(".tab-panel")];
    const tabButtons = [...document.querySelectorAll(".tab-button")];

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function statusClass(value) {
      return String(value || "").replace(/[^a-z0-9_-]/gi, "_");
    }

    function pill(value) {
      return '<span class="pill ' + statusClass(value) + '">' + escapeHtml(value) + '</span>';
    }

    function code(value) {
      return '<code>' + escapeHtml(value) + '</code>';
    }

    function metric(label, value, detail) {
      return '<article class="metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><small>' + escapeHtml(detail || "") + '</small></article>';
    }

    function countBy(rows, key) {
      return rows.reduce((acc, row) => {
        const value = row[key] ?? "none";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});
    }

    function renderShell() {
      document.getElementById("statusPill").className = "pill " + statusClass(data.summary.status);
      document.getElementById("statusPill").textContent = data.summary.status;
      document.getElementById("promotionPill").className = "pill " + statusClass(data.summary.promotionStatus);
      document.getElementById("promotionPill").textContent = data.summary.promotionStatus;
      document.getElementById("runId").textContent = data.summary.runId;

      document.getElementById("metrics").innerHTML = [
        metric("Validation", data.summary.validationMatched + "/" + data.summary.validationTotal, "matched expectations"),
        metric("Catalog", data.summary.componentCount, "governed components"),
        metric("Adapter", data.summary.adapterResults, "conformance results"),
        metric("Evidence", data.summary.artifactCount, "hashed files"),
        metric("Outcome", data.summary.promotionStatus, data.summary.status)
      ].join("");

      document.getElementById("proofFlow").innerHTML = data.flow.map(([label, file]) =>
        '<li class="flow-step"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(file) + '</strong></li>'
      ).join("");
    }

    function renderOverview() {
      const promotionCounts = countBy(data.validationResults, "actualPromotionStatus");
      const kindCounts = countBy(data.validationResults, "fixtureKind");
      const stageCounts = countBy(data.validationResults, "actualStage");
      document.getElementById("overview").innerHTML = [
        '<div class="grid-2">',
          '<article class="panel"><div class="panel-header"><h2 class="panel-title">Run</h2>' + pill(data.summary.status) + '</div><div class="panel-body"><dl class="kv">',
            '<div><dt>Contract</dt><dd>' + code(data.summary.contractId) + '</dd></div>',
            '<div><dt>Run ID</dt><dd>' + code(data.summary.runId) + '</dd></div>',
            '<div><dt>Promotion</dt><dd>' + pill(data.summary.promotionStatus) + '</dd></div>',
            '<div><dt>Fixture source</dt><dd>' + code(data.files.sourceFixture) + '</dd></div>',
            '<div><dt>Generated</dt><dd>' + code(data.generatedAt) + '</dd></div>',
          '</dl></div></article>',
          '<article class="panel"><div class="panel-header"><h2 class="panel-title">Result Matrix</h2><span class="pill pass">' + escapeHtml(data.summary.validationMatched + "/" + data.summary.validationTotal) + '</span></div><div class="panel-body"><div class="grid-3">',
            metric("Allowed", promotionCounts.allowed || 0, "valid fixture"),
            metric("Blocked", promotionCounts.blocked || 0, "invalid/mutation"),
            metric("Review", promotionCounts.review_required || 0, "human gate"),
            metric("Mutation", kindCounts.mutation || 0, "source/artifact"),
            metric("Invalid", kindCounts.invalid || 0, "Surface IR"),
            metric("Stages", Object.keys(stageCounts).length, Object.keys(stageCounts).join(", ")),
          '</div></div></article>',
        '</div>'
      ].join("");
    }

    function renderCatalog() {
      const componentHtml = data.components.map((component) => {
        const actionChips = component.actions.map((action) => {
          const flags = [
            action.destructive ? "destructive" : null,
            action.requiresReview ? "review" : null,
            action.disabledUntilImplemented ? "disabled" : null
          ].filter(Boolean);
          return '<span class="chip ' + (action.requiresReview ? "warning" : "") + '">' + escapeHtml(action.id + (flags.length ? " · " + flags.join(", ") : "")) + '</span>';
        }).join("");
        return '<article class="component">' +
          '<div><h3>' + escapeHtml(component.id) + '</h3>' + pill(component.role || "role unspecified") + '<div class="component-meta">' + actionChips + '</div></div>' +
          '<dl class="kv">' +
            '<div><dt>Props</dt><dd>' + escapeHtml(component.props.join(", ") || "none") + '</dd></div>' +
            '<div><dt>Variants</dt><dd>' + escapeHtml(component.variants.join(", ") || "none") + '</dd></div>' +
            '<div><dt>States</dt><dd>' + escapeHtml(component.states.join(", ") || "none") + '</dd></div>' +
            '<div><dt>Slots</dt><dd>' + escapeHtml(component.slots.join(", ") || "none") + '</dd></div>' +
            '<div><dt>Events</dt><dd>' + escapeHtml(component.events.join(", ") || "none") + '</dd></div>' +
            '<div><dt>Source</dt><dd>' + code(component.sourceRef) + '</dd></div>' +
          '</dl>' +
        '</article>';
      }).join("");

      document.getElementById("catalog").innerHTML = [
        '<div class="grid-2">',
          '<section class="component-list">' + componentHtml + '</section>',
          '<aside class="panel"><div class="panel-header"><h2 class="panel-title">Governance</h2>' + pill(data.governance.promotionStatus) + '</div><div class="panel-body"><pre>' + escapeHtml(JSON.stringify(data.governance, null, 2)) + '</pre></div></aside>',
        '</div>'
      ].join("");
    }

    function resultMatchesSearch(result, search) {
      if (!search) return true;
      const haystack = [
        result.fixturePath,
        result.fixtureKind,
        result.actualStage,
        result.actualPhase,
        result.actualPromotionStatus,
        result.actualDiagnosticCodes?.join(" "),
        result.jsonPointer,
        result.sourceRef
      ].join(" ").toLowerCase();
      return haystack.includes(search.toLowerCase());
    }

    function renderFixtures() {
      const rows = data.validationResults.filter((result) =>
        (fixtureFilter === "all" || result.fixtureKind === fixtureFilter || result.actualPromotionStatus === fixtureFilter) &&
        resultMatchesSearch(result, fixtureSearch)
      );
      document.getElementById("fixtures").innerHTML = [
        '<div class="toolbar">',
          '<input id="fixtureSearch" class="search" type="search" value="' + escapeHtml(fixtureSearch) + '" placeholder="Filter fixtures">',
          '<div class="filter-group" role="group" aria-label="Fixture filter">',
            filterButton("all", "All", fixtureFilter),
            filterButton("mutation", "Mutation", fixtureFilter),
            filterButton("invalid", "Invalid", fixtureFilter),
            filterButton("review_required", "Review", fixtureFilter),
            filterButton("valid", "Valid", fixtureFilter),
          '</div>',
        '</div>',
        table(["Fixture", "Kind", "Stage", "Phase", "Outcome", "Codes", "Pointer"], rows.map((result) => [
          code(result.fixturePath),
          escapeHtml(result.fixtureKind),
          escapeHtml(result.actualStage),
          escapeHtml(result.actualPhase),
          pill(result.actualPromotionStatus),
          escapeHtml((result.actualDiagnosticCodes || []).join(", ") || "none"),
          code(result.jsonPointer)
        ]))
      ].join("");

      document.getElementById("fixtureSearch").addEventListener("input", (event) => {
        fixtureSearch = event.target.value;
        renderFixtures();
      });
      document.querySelectorAll("[data-fixture-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          fixtureFilter = button.dataset.fixtureFilter;
          renderFixtures();
        });
      });
    }

    function renderDiagnostics() {
      const rows = data.diagnostics.filter((diagnostic) => {
        if (!diagnosticSearch) return true;
        return [
          diagnostic.code,
          diagnostic.message,
          diagnostic.artifactPath,
          diagnostic.path,
          diagnostic.stage,
          diagnostic.diagnosticSource,
          diagnostic.sourceRef
        ].join(" ").toLowerCase().includes(diagnosticSearch.toLowerCase());
      });
      document.getElementById("diagnostics").innerHTML = [
        '<div class="toolbar"><input id="diagnosticSearch" class="search" type="search" value="' + escapeHtml(diagnosticSearch) + '" placeholder="Filter diagnostics"></div>',
        table(["Code", "Stage", "Source", "Outcome", "Message", "Artifact", "Pointer"], rows.map((diagnostic) => [
          code(diagnostic.code),
          escapeHtml(diagnostic.stage),
          escapeHtml(diagnostic.diagnosticSource),
          pill(diagnostic.promotionStatus),
          escapeHtml(diagnostic.message),
          code(diagnostic.artifactPath),
          code(diagnostic.path)
        ]))
      ].join("");
      document.getElementById("diagnosticSearch").addEventListener("input", (event) => {
        diagnosticSearch = event.target.value;
        renderDiagnostics();
      });
    }

    function renderEvidence() {
      document.getElementById("evidence").innerHTML = [
        '<div class="grid-2">',
          '<article class="panel"><div class="panel-header"><h2 class="panel-title">Artifacts</h2><span class="pill">' + escapeHtml(data.artifacts.length) + '</span></div><div class="panel-body">',
            table(["Path", "Role", "Schema", "Hash"], data.artifacts.map((artifact) => [
              code(artifact.path),
              escapeHtml(artifact.role),
              escapeHtml(artifact.schemaId),
              code(String(artifact.hash).slice(0, 18) + "...")
            ])),
          '</div></article>',
          '<article class="panel"><div class="panel-header"><h2 class="panel-title">Adapter Results</h2>' + pill(data.summary.adapterStatus) + '</div><div class="panel-body">',
            table(["Fixture", "Outcome", "Codes"], data.adapterResults.map((result) => [
              code(result.fixturePath),
              pill(result.actualPromotionStatus),
              escapeHtml((result.actualDiagnosticCodes || []).join(", ") || "none")
            ])),
          '</div></article>',
        '</div>'
      ].join("");
    }

    function renderJson() {
      const options = Object.keys(data.raw).map((key) => '<option value="' + escapeHtml(key) + '">' + escapeHtml(key) + '</option>').join("");
      document.getElementById("json").innerHTML = [
        '<div class="toolbar"><select id="jsonSelect" aria-label="Artifact JSON">' + options + '</select></div>',
        '<pre id="jsonOutput"></pre>'
      ].join("");
      const select = document.getElementById("jsonSelect");
      const output = document.getElementById("jsonOutput");
      const sync = () => {
        output.textContent = JSON.stringify(data.raw[select.value], null, 2);
      };
      select.addEventListener("change", sync);
      sync();
    }

    function filterButton(value, label, current) {
      return '<button class="filter-button" type="button" data-fixture-filter="' + escapeHtml(value) + '" aria-pressed="' + String(value === current) + '">' + escapeHtml(label) + '</button>';
    }

    function table(headers, rows) {
      if (!rows.length) return '<div class="empty">No matching rows</div>';
      return '<div class="table-wrap"><table><thead><tr>' +
        headers.map((header) => '<th>' + escapeHtml(header) + '</th>').join("") +
        '</tr></thead><tbody>' +
        rows.map((row) => '<tr>' + row.map((cell) => '<td>' + cell + '</td>').join("") + '</tr>').join("") +
        '</tbody></table></div>';
    }

    function activateTab(tabId) {
      tabButtons.forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === tabId)));
      panels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });

    renderShell();
    renderOverview();
    renderCatalog();
    renderFixtures();
    renderDiagnostics();
    renderEvidence();
    renderJson();
  </script>
</body>
</html>
`;
}

const loaded = {};
for (const [key, relativePath] of Object.entries(files)) {
  loaded[key] = await readJson(relativePath);
}

await fs.mkdir(demoDir, { recursive: true });
await fs.writeFile(demoPath, buildHtml(buildDemoData(loaded)));
console.log(`wrote ${path.relative(root, demoPath)}`);
