import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import {
  capabilityIndexInternals,
  runCapabilityIndexInterfacectl,
  runCapabilityIndexProof,
  verifyCapabilityIndex
} from "../src/capability-index-proof.js";
import * as capabilityContract from "../src/capability-index-contract.js";

const root = process.cwd();
const fixtureRoot = "fixtures/capability-index";
const artifactRoot = "artifacts/capability-index";
const indexPath = `${artifactRoot}/capability-index.json`;
const reportPath = `${artifactRoot}/capability-index-report.json`;
const evidencePath = `${artifactRoot}/evidence.json`;

test("capability index package and CI surfaces are wired", async () => {
  const packageJson = await readJson("package.json");
  assert.equal(packageJson.scripts["materialize:capability-index"], "node scripts/materialize-capability-index.mjs");
  assert.equal(packageJson.scripts["proof:capability-index"], "node bin/interfacectl.js surfaces capabilities proof --fixture fixtures/capability-index --out artifacts/capability-index");
  assert.equal(packageJson.scripts.status, "node bin/interfacectl.js surfaces capabilities verify --index artifacts/capability-index/capability-index.json --evidence artifacts/capability-index/evidence.json");
  assert.match(packageJson.scripts["check:capability-index:ci:phase"], /check:capability-index:untracked/);
  assert.match(packageJson.scripts["check:capability-index:untracked"], /artifacts\/capability-index/);
  const workflow = await fs.readFile(path.join(root, ".github/workflows/surfaces-proof.yml"), "utf8");
  assert.match(workflow, /capability-index-proof:/);
  assert.match(workflow, /npm run check:capability-index:ci:phase/);
});

test("capability commands reject invalid usage and verifier has no output flag", async () => {
  for (const argv of [
    ["verify", "--index", indexPath, "--evidence", evidencePath, "--out", artifactRoot],
    ["verify", "--index", "../capability-index.json", "--evidence", evidencePath],
    ["verify", "--index", "/tmp/capability-index.json", "--evidence", evidencePath],
    ["verify", "--index", "artifacts\\capability-index\\capability-index.json", "--evidence", evidencePath],
    ["proof", "--fixture", "./fixtures/capability-index", "--out", artifactRoot],
    ["unknown"]
  ]) {
    const result = await invoke(argv);
    assert.equal(result.exitCode, 2, argv.join(" "));
    assert.match(result.stderr, /usage:|unexpected argument|POSIX-style relative path/);
  }
});

test("capability proof is deterministic and emits exactly three artifacts", async () => {
  await capabilityContract.materializeCapabilityIndexContract(root);
  const first = await runCapabilityIndexProof({
    cwd: root,
    fixtureRoot,
    outRoot: artifactRoot,
    command: proofCommand(),
    args: { fixture: fixtureRoot, out: artifactRoot }
  });
  assert.equal(first.status, "pass");
  assert.equal(first.promotionStatus, "allowed");
  assert.equal(first.implementedCount, 16);
  const firstBytes = await artifactBytes();
  const second = await runCapabilityIndexProof({
    cwd: root,
    fixtureRoot,
    outRoot: artifactRoot,
    command: proofCommand(),
    args: { fixture: fixtureRoot, out: artifactRoot }
  });
  assert.equal(second.status, "pass");
  assert.deepEqual(await artifactBytes(), firstBytes);
  assert.deepEqual((await fs.readdir(path.join(root, artifactRoot))).sort(), [
    "capability-index-report.json",
    "capability-index.json",
    "evidence.json"
  ]);
});

test("capability index exposes the bounded authority compiler without authority escalation", async () => {
  const index = await readJson(indexPath);
  const row = index.implementedCapabilities.find((candidate) => candidate.capabilityId === "declared-source-conformance");
  assert.equal(row.canAddAuthority, false);
  assert.match(row.userValue, /checked source facts/);
  assert.match(row.scopeStatement, /exactly two manifest-declared local authority bundles/);
  assert.match(row.scopeStatement, /without expanding catalog capability/);
  assert.deepEqual(row.nonCapabilities, ["arbitrary source connector", "broader P2 component coverage", "live source crawling", "self-serve connection UI"]);
  assert.equal(row.proofCommand, "interfacectl surfaces source-family-packaging proof");
  assert.equal(row.packageProofScript, "proof:source-conformance");
  assert.equal(row.ciGate, "npm run check:source-family-packaging:ci");
  assert.equal(row.evidencePath, "artifacts/source-family-packaging/evidence.json");
  assert.equal(row.evidenceSchemaId, "source-family-packaging-evidence.v0");
  assert.equal(row.outputPaths.length, 18);
  for (const requiredPath of [
    "artifacts/source-conformance/evidence.json",
    "artifacts/source-conformance/governed-catalog.json",
    "artifacts/source-family-packaging/candidate-source-conformance-evidence.json",
    "artifacts/source-family-packaging/candidate-governed-catalog.json",
    "artifacts/source-family-packaging/source-family-packaging-report.json",
    "artifacts/source-family-packaging/evidence.json"
  ]) assert.equal(row.outputPaths.includes(requiredPath), true, requiredPath);
  assert.deepEqual(row.reportPaths, [
    "artifacts/source-conformance/authority-connection-report.json",
    "artifacts/source-conformance/source-conformance-report.json",
    "artifacts/source-family-packaging/candidate-authority-connection-report.json",
    "artifacts/source-family-packaging/candidate-source-conformance-report.json",
    "artifacts/source-family-packaging/source-family-packaging-report.json"
  ].sort());
});

test("capability index exposes fixed source-family layout mapping without broadening authority", async () => {
  const index = await readJson(indexPath);
  const row = index.implementedCapabilities.find((candidate) => candidate.capabilityId === "source-family-layout-mapping");
  assert.equal(row.canAddAuthority, false);
  assert.equal(row.implementationStatus, "implemented");
  assert.equal(row.proofMode, "report-only");
  assert.match(row.scopeStatement, /one checked alternate physical-layout instance/);
  assert.match(row.scopeStatement, /exact 12-entry declared-source logical ABI/);
  assert.match(row.scopeStatement, /unchanged source-conformance compiler/);
  assert.equal(row.proofCommand, "interfacectl surfaces source-family-layout-mapping proof");
  assert.equal(row.packageProofScript, "proof:source-family-layout-mapping");
  assert.equal(row.ciGate, "npm run check:source-family-layout-mapping:ci");
  assert.equal(row.evidencePath, "artifacts/source-family-layout-mapping/evidence.json");
  assert.equal(row.evidenceSchemaId, "source-family-layout-mapping-evidence.v0");
  assert.equal(row.expectedPromotionStatus, "review_required");
  assert.equal(row.promotionStatus, "review_required");
  assert.deepEqual(row.nonCapabilities, [
    "arbitrary source layouts",
    "source-ref namespace rewriting",
    "broader P2 component coverage",
    "live source connectors",
    "self-serve connection UI",
    "runtime accessibility compliance",
    "production adapters",
    "SurfaceOps expansion",
    "JudgmentKit invocation"
  ]);
  assert.deepEqual(row.dependencies.evidence, ["p2-spectrum-ingestion", "declared-source-conformance"]);
  assert.deepEqual(row.outputPaths, [
    "artifacts/source-family-layout-mapping/evidence.json",
    "artifacts/source-family-layout-mapping/layout-mapping-receipt.json",
    "artifacts/source-family-layout-mapping/mapped-authority-connection-report.json",
    "artifacts/source-family-layout-mapping/mapped-governed-catalog.json",
    "artifacts/source-family-layout-mapping/mapped-source-authority-map.json",
    "artifacts/source-family-layout-mapping/mapped-source-conformance-evidence.json",
    "artifacts/source-family-layout-mapping/mapped-source-conformance-report.json",
    "artifacts/source-family-layout-mapping/mapped-source-fact-coverage.json",
    "artifacts/source-family-layout-mapping/mapped-source-inventory.json",
    "artifacts/source-family-layout-mapping/mapped-source-review-queue.json",
    "artifacts/source-family-layout-mapping/source-family-layout-mapping-report.json"
  ]);
  assert.deepEqual(row.reportPaths, ["artifacts/source-family-layout-mapping/source-family-layout-mapping-report.json"]);
  assert.deepEqual(row.demoPaths, []);
  assert.deepEqual(row.runtimeEvidencePaths, []);
});

test("capability index exposes fixed source-family namespace mapping without broadening authority", async () => {
  const index = await readJson(indexPath);
  const row = index.implementedCapabilities.find((candidate) => candidate.capabilityId === "source-family-namespace-mapping");
  assert.equal(row.canAddAuthority, false);
  assert.equal(row.implementationStatus, "implemented");
  assert.equal(row.proofMode, "report-only");
  assert.match(row.scopeStatement, /one checked alternate source-ref prefix/);
  assert.match(row.scopeStatement, /exact accepted 12-file Button and InLineAlert bundle/);
  assert.match(row.scopeStatement, /unchanged source-conformance compiler/);
  assert.equal(row.proofCommand, "interfacectl surfaces source-family-namespace-mapping proof");
  assert.equal(row.packageProofScript, "proof:source-family-namespace-mapping");
  assert.equal(row.ciGate, "npm run check:source-family-namespace-mapping:ci");
  assert.equal(row.evidencePath, "artifacts/source-family-namespace-mapping/evidence.json");
  assert.equal(row.evidenceSchemaId, "source-family-namespace-mapping-evidence.v0");
  assert.equal(row.expectedPromotionStatus, "review_required");
  assert.equal(row.promotionStatus, "review_required");
  assert.deepEqual(row.nonCapabilities, [
    "arbitrary source namespaces",
    "additional source layouts",
    "broader P2 component coverage",
    "live source connectors",
    "self-serve connection UI",
    "runtime accessibility compliance",
    "production adapters",
    "SurfaceOps expansion",
    "JudgmentKit invocation"
  ]);
  assert.deepEqual(row.dependencies.evidence, ["p2-spectrum-ingestion", "declared-source-conformance", "source-family-layout-mapping"]);
  assert.deepEqual(row.outputPaths, [
    "artifacts/source-family-namespace-mapping/evidence.json",
    "artifacts/source-family-namespace-mapping/namespace-mapping-receipt.json",
    "artifacts/source-family-namespace-mapping/normalized-authority-connection-report.json",
    "artifacts/source-family-namespace-mapping/normalized-governed-catalog.json",
    "artifacts/source-family-namespace-mapping/normalized-source-authority-map.json",
    "artifacts/source-family-namespace-mapping/normalized-source-conformance-evidence.json",
    "artifacts/source-family-namespace-mapping/normalized-source-conformance-report.json",
    "artifacts/source-family-namespace-mapping/normalized-source-fact-coverage.json",
    "artifacts/source-family-namespace-mapping/normalized-source-inventory.json",
    "artifacts/source-family-namespace-mapping/normalized-source-review-queue.json",
    "artifacts/source-family-namespace-mapping/source-family-namespace-mapping-report.json"
  ]);
  assert.deepEqual(row.reportPaths, ["artifacts/source-family-namespace-mapping/source-family-namespace-mapping-report.json"]);
  assert.deepEqual(row.demoPaths, []);
  assert.deepEqual(row.runtimeEvidencePaths, []);
});

test("capability index exposes fixed source-family component identity mapping without broadening authority", async () => {
  const index = await readJson(indexPath);
  const row = index.implementedCapabilities.find((candidate) => candidate.capabilityId === "source-family-component-identity-mapping");
  assert.equal(row.canAddAuthority, false);
  assert.equal(row.implementationStatus, "implemented");
  assert.equal(row.proofMode, "report-only");
  assert.match(row.scopeStatement, /one checked TeamButton to Button declaration/);
  assert.match(row.scopeStatement, /exactly 22 declared identity values in five files/);
  assert.match(row.scopeStatement, /refreshes five manifest hashes/);
  assert.match(row.scopeStatement, /preserves four narrative Button fields/);
  assert.match(row.scopeStatement, /unchanged source-conformance compiler/);
  assert.equal(row.proofCommand, "interfacectl surfaces source-family-component-identity-mapping proof");
  assert.equal(row.packageProofScript, "proof:source-family-component-identity-mapping");
  assert.equal(row.ciGate, "npm run check:source-family-component-identity-mapping:ci");
  assert.equal(row.evidencePath, "artifacts/source-family-component-identity-mapping/evidence.json");
  assert.equal(row.evidenceSchemaId, "source-family-component-identity-mapping-evidence.v0");
  assert.equal(row.expectedPromotionStatus, "review_required");
  assert.equal(row.promotionStatus, "review_required");
  assert.deepEqual(row.nonCapabilities, [
    "arbitrary component identities",
    "alias registries",
    "semantic inference or equivalence",
    "new components or facts",
    "additional source layouts or namespaces",
    "broader P2 component coverage",
    "live source connectors",
    "self-serve connection UI",
    "runtime accessibility compliance",
    "production adapters",
    "SurfaceOps expansion",
    "JudgmentKit invocation"
  ]);
  assert.deepEqual(row.dependencies.evidence, [
    "p2-spectrum-ingestion",
    "declared-source-conformance",
    "source-family-layout-mapping",
    "source-family-namespace-mapping"
  ]);
  assert.deepEqual(row.inputPaths, [
    "artifacts/p2/evidence.json",
    "artifacts/p2/governed-catalog.json",
    "artifacts/source-family-namespace-mapping/evidence.json",
    "fixtures/source-family-component-identity-mapping",
    "fixtures/source-family-component-identity-mapping/component-identity-package.fixture.json",
    "sources/source-family-component-identity-mapping/authority/component-identity-authority-manifest.json",
    "sources/source-family-component-identity-mapping/authority/component-identity-declaration.json",
    "sources/source-family-component-identity-mapping/component-identity-mapping.json",
    "sources/source-family-component-identity-mapping/team-owned-identity-bundle"
  ]);
  assert.deepEqual(row.outputPaths, [
    "artifacts/source-family-component-identity-mapping/component-identity-mapping-receipt.json",
    "artifacts/source-family-component-identity-mapping/evidence.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-authority-connection-report.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-governed-catalog.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-source-authority-map.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-source-conformance-evidence.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-source-conformance-report.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-source-fact-coverage.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-source-inventory.json",
    "artifacts/source-family-component-identity-mapping/identity-mapped-source-review-queue.json",
    "artifacts/source-family-component-identity-mapping/namespace-mapping-receipt.json",
    "artifacts/source-family-component-identity-mapping/source-family-component-identity-mapping-report.json"
  ]);
  assert.deepEqual(row.reportPaths, ["artifacts/source-family-component-identity-mapping/source-family-component-identity-mapping-report.json"]);
  assert.deepEqual(row.demoPaths, []);
  assert.deepEqual(row.runtimeEvidencePaths, []);
});

test("capability index exposes structured accessibility reconciliation without policy or runtime escalation", async () => {
  const index = await readJson(indexPath);
  const row = index.implementedCapabilities.find((candidate) => candidate.capabilityId === "source-accessibility-policy");
  assert.equal(row.canAddAuthority, false);
  assert.equal(row.evidencePath, "artifacts/source-accessibility-policy/evidence.json");
  assert.equal(row.evidenceSchemaId, "source-accessibility-policy-evidence.v0");
  assert.equal(row.proofCommand, "interfacectl surfaces source-accessibility-policy proof");
  assert.equal(row.packageProofScript, "proof:source-accessibility-policy");
  assert.deepEqual(row.nonCapabilities, [
    "free-form policy interpretation",
    "runtime accessibility compliance",
    "broader P2 component coverage",
    "arbitrary source packaging",
    "live source connectors",
    "self-serve connection UI",
    "production adapters",
    "JudgmentKit invocation"
  ]);
  assert.deepEqual(row.dependencies.evidence, ["p2-spectrum-ingestion", "declared-source-conformance"]);
});

test("read-only verification preserves every repository byte, type, size, and mtime", async () => {
  const before = await workspaceSnapshot(root);
  const result = await verifyCapabilityIndex({ cwd: root, indexPath, evidencePath });
  assert.equal(result.implemented.length, 16);
  assert.deepEqual(await workspaceSnapshot(root), before);

  const cli = await invoke(["verify", "--index", indexPath, "--evidence", evidencePath]);
  assert.equal(cli.exitCode, 0);
  assert.match(cli.stdout, /implemented: 16\/16 verified/);
  assert.match(cli.stdout, /planned:/);
  assert.equal(cli.stderr, "");
  assert.deepEqual(await workspaceSnapshot(root), before);
});

test("verifier rejects a missing target evidence file and restores it", async () => {
  const index = await readJson(indexPath);
  const targetPath = index.implementedCapabilities[0].evidencePath;
  const original = await fs.readFile(path.join(root, targetPath));
  try {
    await fs.rm(path.join(root, targetPath));
    await assertDiagnostic("CAPABILITY_EVIDENCE_MISSING");
  } finally {
    await fs.mkdir(path.dirname(path.join(root, targetPath)), { recursive: true });
    await fs.writeFile(path.join(root, targetPath), original);
  }
});

test("verifier rejects tampered target evidence", async () => {
  const index = await readJson(indexPath);
  const targetPath = index.implementedCapabilities[0].evidencePath;
  await withRestoredFiles([targetPath], async () => {
    const target = await readJson(targetPath);
    target.status = target.status === "pass" ? "fail" : "pass";
    await writeJson(targetPath, target);
    await assertDiagnostic("CAPABILITY_EVIDENCE_HASH_MISMATCH");
  });
});

test("verifier rechecks the source-family layout-mapping physical source closure", async () => {
  const targetEvidencePath = "artifacts/source-family-layout-mapping/evidence.json";
  const targetEvidence = await readJson(targetEvidencePath);
  const physicalPath = targetEvidence.physicalSourceRefs[0].path;
  await withRestoredFiles([physicalPath], async () => {
    const bytes = await fs.readFile(path.join(root, physicalPath));
    await fs.writeFile(path.join(root, physicalPath), Buffer.concat([bytes, Buffer.from("\n")]));
    await assertDiagnostic("CAPABILITY_EVIDENCE_HASH_MISMATCH");
  });
});

test("verifier rechecks the source-family component-identity physical source closure", async () => {
  const targetEvidencePath = "artifacts/source-family-component-identity-mapping/evidence.json";
  const targetEvidence = await readJson(targetEvidencePath);
  const physicalPath = targetEvidence.sourceFileRefs[0].path;
  await withRestoredFiles([physicalPath], async () => {
    const bytes = await fs.readFile(path.join(root, physicalPath));
    await fs.writeFile(path.join(root, physicalPath), Buffer.concat([bytes, Buffer.from("\n")]));
    await assertDiagnostic("CAPABILITY_EVIDENCE_HASH_MISMATCH");
  });
});

test("verifier rechecks component-identity authority, mapping, and package bindings", async () => {
  const targetEvidencePath = "artifacts/source-family-component-identity-mapping/evidence.json";
  const targetEvidence = await readJson(targetEvidencePath);
  for (const field of ["authorityManifestRef", "authorityDeclarationRef", "mappingRef", "identityPackageRef"]) {
    const boundPath = targetEvidence[field].path;
    await withRestoredFiles([boundPath], async () => {
      const bytes = await fs.readFile(path.join(root, boundPath));
      await fs.writeFile(path.join(root, boundPath), Buffer.concat([bytes, Buffer.from("\n")]));
      await assertDiagnostic("CAPABILITY_EVIDENCE_HASH_MISMATCH");
    });
  }
});

test("verifier rejects a stale index hash", async () => {
  await withRestoredFiles([indexPath], async () => {
    const index = await readJson(indexPath);
    index.summary.allowedCount += 1;
    await writeJson(indexPath, index);
    await assertDiagnostic("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  });
});

test("verifier rejects status, command, authority, and duplicate-id mutations", async () => {
  const mutations = [
    ["CAPABILITY_STATUS_MISMATCH", (index) => { index.implementedCapabilities[0].promotionStatus = "blocked"; }],
    ["CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN", (index) => { index.implementedCapabilities[0].proofCommand = "interfacectl surfaces unsupported proof"; }],
    ["CAPABILITY_AUTHORITY_ESCALATION", (index) => { index.implementedCapabilities[0].canAddAuthority = true; }],
    ["CAPABILITY_TARGET_MISSING", (index) => { index.implementedCapabilities[1].capabilityId = index.implementedCapabilities[0].capabilityId; }],
    ["CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH", (index) => { index.summary.allowedCount += 1; }]
  ];
  for (const [code, mutate] of mutations) {
    await withRestoredFiles([indexPath, evidencePath], async () => {
      const index = await readJson(indexPath);
      mutate(index);
      await writeJson(indexPath, index);
      await rebindCapabilityEvidence();
      await assertDiagnostic(code);
    });
  }
});

test("verifier rejects planned claim escalation and invalid dependency", async () => {
  for (const [code, mutate] of [
    ["CAPABILITY_PLANNED_CLAIM_ESCALATION", (index) => { index.plannedCapabilities[0].proofCommand = "interfacectl surfaces planned proof"; }],
    ["CAPABILITY_DEPENDENCY_INVALID", (index) => { index.implementedCapabilities[1].dependencies = ["missing-capability"]; }]
  ]) {
    await withRestoredFiles([indexPath, evidencePath], async () => {
      const index = await readJson(indexPath);
      mutate(index);
      await writeJson(indexPath, index);
      await rebindCapabilityEvidence();
      await assertDiagnostic(code);
    });
  }
});

test("fixture outcomes are caused by fixture content rather than directory names", async () => {
  await capabilityContract.materializeCapabilityIndexContract(root);
  const cases = [
    [
      `${fixtureRoot}/invalid/status-mismatch.capability-declaration.json`,
      (fixture) => { fixture.implementedCapabilities[4].expectedPromotionStatus = "blocked"; }
    ],
    [
      `${fixtureRoot}/review/blocked-promotion-indexed.capability-declaration.json`,
      (fixture) => {
        for (const row of fixture.implementedCapabilities) {
          if (row.expectedPromotionStatus === "blocked") row.expectedPromotionStatus = "review_required";
        }
      }
    ],
    [
      `${fixtureRoot}/mutations/upstream-hash-mismatch.capability-index-preflight-mutation.json`,
      async (fixture) => {
        const upstream = await readJson(fixture.evidencePath);
        fixture.expectedHash = capabilityIndexInternals.computeEvidenceSelfHash(upstream, fixture.evidencePath);
      }
    ],
    [
      `${fixtureRoot}/mutations/hash-mismatch.capability-index-evidence.json`,
      (fixture, relativePath) => {
        fixture.artifacts.at(-1).hash = capabilityIndexInternals.computeEvidenceSelfHash(fixture, relativePath);
      }
    ]
  ];
  for (const [relativePath, repair] of cases) {
    await withRestoredFiles([relativePath], async () => {
      const fixture = await readJson(relativePath);
      await repair(fixture, relativePath);
      await writeJson(relativePath, fixture);
      await assertProofDiagnostic("CAPABILITY_IMPLEMENTATION_CLAIM_UNPROVEN");
    });
  }
});

test("proof rejects stale schema and fixture files outside the declared closure", async () => {
  for (const relativePath of [
    `${fixtureRoot}/invalid/stale.capability-declaration.json`,
    "schemas/capability-index-stale.v0.schema.json"
  ]) {
    try {
      await fs.writeFile(path.join(root, relativePath), "{}\n");
      await assertProofDiagnostic("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
    } finally {
      await fs.rm(path.join(root, relativePath), { force: true });
    }
  }
});

test("verifier rejects an implemented package proof target omitted from the index", async () => {
  await withRestoredFiles(["package.json"], async () => {
    const packageJson = await readJson("package.json");
    packageJson.scripts["proof:unindexed-target"] = "node bin/interfacectl.js surfaces unindexed proof";
    await writeJson("package.json", packageJson);
    await assertDiagnostic("CAPABILITY_TARGET_MISSING");
  });
});

test("verifier rejects coordinated report and evidence rehashing", async () => {
  await withRestoredFiles([reportPath, evidencePath], async () => {
    const report = await readJson(reportPath);
    report.summary.allowedCount += 1;
    await writeJson(reportPath, report);
    const evidence = await readJson(evidencePath);
    evidence.artifacts.find((ref) => ref.path === reportPath).hash = hashCanonical(report);
    evidence.artifacts.at(-1).hash = null;
    evidence.artifacts.at(-1).hash = capabilityIndexInternals.computeEvidenceSelfHash(evidence, evidencePath);
    await writeJson(evidencePath, evidence);
    await assertDiagnostic("CAPABILITY_INDEX_EVIDENCE_HASH_MISMATCH");
  });
});

test("verifier rejects a symlinked indexed evidence path", async (t) => {
  if (process.platform === "win32") {
    t.skip("symlink semantics are platform-specific on Windows");
    return;
  }
  const index = await readJson(indexPath);
  const targetPath = index.implementedCapabilities[0].evidencePath;
  const absolute = path.join(root, targetPath);
  const backup = `${absolute}.capability-index-backup`;
  try {
    await fs.rename(absolute, backup);
    await fs.symlink(path.basename(backup), absolute);
    await assertDiagnostic("CAPABILITY_AUTHORITY_ESCALATION");
  } finally {
    await fs.rm(absolute, { force: true });
    await fs.rename(backup, absolute).catch(() => {});
  }
});

async function assertDiagnostic(code) {
  await assert.rejects(
    verifyCapabilityIndex({ cwd: root, indexPath, evidencePath }),
    (error) => {
      assert.equal(error.exitCode, 1);
      assert.match(error.message, new RegExp(`^${code}:`));
      return true;
    }
  );
}

async function assertProofDiagnostic(code) {
  await assert.rejects(
    runCapabilityIndexProof({
      cwd: root,
      fixtureRoot,
      outRoot: artifactRoot,
      command: proofCommand(),
      args: { fixture: fixtureRoot, out: artifactRoot }
    }),
    (error) => {
      assert.equal(error.exitCode, 1);
      assert.match(error.message, new RegExp(`^${code}:`));
      return true;
    }
  );
}

async function rebindCapabilityEvidence() {
  const index = await readJson(indexPath);
  const evidence = await readJson(evidencePath);
  const indexRef = evidence.artifacts.find((ref) => ref.path === indexPath);
  indexRef.hash = hashCanonical(index);
  evidence.artifacts[evidence.artifacts.length - 1].hash = null;
  evidence.artifacts[evidence.artifacts.length - 1].hash = capabilityIndexInternals.computeEvidenceSelfHash(evidence, evidencePath);
  await writeJson(evidencePath, evidence);
}

async function withRestoredFiles(relativePaths, callback) {
  const originals = new Map();
  for (const relativePath of relativePaths) originals.set(relativePath, await fs.readFile(path.join(root, relativePath)));
  try {
    await callback();
  } finally {
    for (const [relativePath, bytes] of originals) await fs.writeFile(path.join(root, relativePath), bytes);
  }
}

async function invoke(argv) {
  let stdout = "";
  let stderr = "";
  const exitCode = await runCapabilityIndexInterfacectl(argv, {
    cwd: root,
    stdout: { write: (value) => { stdout += value; } },
    stderr: { write: (value) => { stderr += value; } }
  });
  return { exitCode, stdout, stderr };
}

async function artifactBytes() {
  const result = {};
  for (const file of ["capability-index.json", "capability-index-report.json", "evidence.json"]) {
    result[file] = await fs.readFile(path.join(root, artifactRoot, file), "utf8");
  }
  return result;
}

async function workspaceSnapshot(workspaceRoot) {
  const result = [];
  await walk(workspaceRoot, "", result);
  return result;
}

async function walk(directory, relativeRoot, result) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (relativeRoot === "" && [".git", "node_modules", "output"].includes(entry.name)) continue;
    const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);
    const stat = await fs.lstat(absolutePath);
    if (entry.isDirectory()) {
      result.push({ path: `${relativePath}/`, type: "directory", size: stat.size, mtimeMs: stat.mtimeMs });
      await walk(absolutePath, relativePath, result);
    } else if (entry.isSymbolicLink()) {
      result.push({ path: relativePath, type: "symlink", size: stat.size, mtimeMs: stat.mtimeMs, target: await fs.readlink(absolutePath) });
    } else {
      const bytes = await fs.readFile(absolutePath);
      result.push({ path: relativePath, type: "file", size: stat.size, mtimeMs: stat.mtimeMs, hash: crypto.createHash("sha256").update(bytes).digest("hex") });
    }
  }
}

function proofCommand() {
  return capabilityContract.CI_COMMAND ?? capabilityContract.CAPABILITY_INDEX_COMMAND ?? "interfacectl surfaces capabilities proof";
}

function hashCanonical(value) {
  return crypto.createHash("sha256").update(canonicalJson(value)).digest("hex");
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  await fs.writeFile(path.join(root, relativePath), canonicalJson(value));
}
