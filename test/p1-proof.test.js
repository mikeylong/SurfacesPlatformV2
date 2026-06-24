import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { canonicalJson } from "../src/p0.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();

const requiredScripts = [
  "materialize:p1",
  "proof:p1",
  "build:p1-demo"
];

const requiredP1Schemas = [
  "schemas/runtime-projection.v0.schema.json",
  "schemas/render-plan.v0.schema.json",
  "schemas/runtime-adapter-report.v0.schema.json",
  "schemas/runtime-adapter-evidence.v0.schema.json",
  "schemas/runtime-adapter-expectations.v0.schema.json",
  "schemas/runtime-adapter-diagnostics.v0.schema.json"
];

const expectedP1Rows = [
  {
    fixturePath: "fixtures/p1/valid/confirm-panel.surface-ir.json",
    fixtureKind: "valid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    expectedValidationResult: "valid",
    expectedPromotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: "artifacts/p1/render-plan.confirm-panel.json",
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p1/valid/confirm-panel#/root",
    renderPlanPath: "artifacts/p1/render-plan.confirm-panel.json"
  },
  {
    fixturePath: "fixtures/p1/valid/status-callout.surface-ir.json",
    fixtureKind: "valid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    expectedValidationResult: "valid",
    expectedPromotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: "artifacts/p1/render-plan.status-callout.json",
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p1/valid/status-callout#/root",
    renderPlanPath: "artifacts/p1/render-plan.status-callout.json"
  },
  {
    fixturePath: "fixtures/p1/valid/button-defaults.surface-ir.json",
    fixtureKind: "valid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    expectedValidationResult: "valid",
    expectedPromotionStatus: "allowed",
    expectedDiagnosticCodes: [],
    expectedArtifactPath: "artifacts/p1/render-plan.button-defaults.json",
    expectedJsonPointer: "/root",
    requiredSourceRef: "fixture://p1/valid/button-defaults#/root",
    renderPlanPath: "artifacts/p1/render-plan.button-defaults.json"
  },
  {
    fixturePath: "fixtures/p1/review/review-required-action.surface-ir.json",
    fixtureKind: "review",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-review",
    expectedValidationResult: "review_required",
    expectedPromotionStatus: "review_required",
    expectedDiagnosticCodes: ["RUNTIME_REVIEW_REQUIRED"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/actions/confirm/execute",
    requiredSourceRef: "fixture://p1/review/review-required-action#/root/actions/confirm",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/invalid/unknown-component.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["CATALOG_UNKNOWN_COMPONENT"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/component",
    requiredSourceRef: "fixture://p1/invalid/unknown-component#/root",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/invalid/unknown-prop.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["CATALOG_UNKNOWN_PROP"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/props/eyebrow",
    requiredSourceRef: "fixture://p1/invalid/unknown-prop#/root/props/eyebrow",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/invalid/unsafe-markup.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["CATALOG_INVALID_VALUE"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/instances/secondaryAction/props/label",
    requiredSourceRef: "fixture://p1/invalid/unsafe-markup#/instances/secondaryAction/props/label",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/invalid/disabled-action-execution.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_ACTION_EXECUTION_BLOCKED"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/instances/secondaryAction/actions/dismiss/execute",
    requiredSourceRef: "fixture://p1/invalid/disabled-action-execution#/instances/secondaryAction/actions/dismiss",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/invalid/modal-role-not-supported.surface-ir.json",
    fixtureKind: "invalid",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-invalid",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["ACCESSIBILITY_MODAL_UNSUPPORTED"],
    expectedArtifactPath: "artifacts/p1/runtime-adapter-report.json",
    expectedJsonPointer: "/root/accessibility/role",
    requiredSourceRef: "fixture://p1/invalid/modal-role-not-supported#/root/accessibility",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json",
    fixtureKind: "mutation",
    expectedStage: "projection",
    expectedPhase: "projection-mutation",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["PROJECTION_CATALOG_REF_MISSING"],
    expectedArtifactPath: "fixtures/p1/mutations/missing-catalog-ref.runtime-projection.json",
    expectedJsonPointer: "/catalogRef",
    requiredSourceRef: null,
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json",
    fixtureKind: "mutation",
    expectedStage: "projection",
    expectedPhase: "projection-mutation",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["PROJECTION_SOURCE_HASH_MISMATCH"],
    expectedArtifactPath: "fixtures/p1/mutations/catalog-hash-mismatch.runtime-projection.json",
    expectedJsonPointer: "/catalogRef/hash",
    requiredSourceRef: "fixture://p1/mutations/catalog-hash-mismatch.runtime-projection#/catalogRef",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json",
    fixtureKind: "mutation",
    expectedStage: "projection",
    expectedPhase: "projection-mutation",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["PROJECTION_AUTHORITY_ESCALATION"],
    expectedArtifactPath: "fixtures/p1/mutations/projection-authority-escalation.runtime-projection.json",
    expectedJsonPointer: "/components/ConfirmPanel/actions/escalate",
    requiredSourceRef: "fixture://p1/mutations/projection-authority-escalation.runtime-projection#/components/ConfirmPanel/actions/escalate",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json",
    fixtureKind: "mutation",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_RENDER_PLAN_PROVENANCE_MISSING"],
    expectedArtifactPath: "fixtures/p1/mutations/missing-render-plan-provenance.render-plan.json",
    expectedJsonPointer: "/provenance",
    requiredSourceRef: "fixture://p1/valid/confirm-panel#/root",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json",
    fixtureKind: "mutation",
    expectedStage: "runtime-boundary",
    expectedPhase: "runtime-adapter",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_PROJECTION_HASH_MISMATCH"],
    expectedArtifactPath: "fixtures/p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report.json",
    expectedJsonPointer: "/runtimeProjectionRef/hash",
    requiredSourceRef: "fixture://p1/mutations/runtime-projection-hash-mismatch.runtime-adapter-report#/runtimeProjectionRef",
    renderPlanPath: null
  },
  {
    fixturePath: "fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json",
    fixtureKind: "mutation",
    expectedStage: "evidence",
    expectedPhase: "runtime-evidence",
    expectedValidationResult: "invalid",
    expectedPromotionStatus: "blocked",
    expectedDiagnosticCodes: ["RUNTIME_EVIDENCE_HASH_MISMATCH"],
    expectedArtifactPath: "fixtures/p1/mutations/hash-mismatch.runtime-adapter-evidence.json",
    expectedJsonPointer: "/artifacts/0/hash",
    requiredSourceRef: null,
    renderPlanPath: null
  }
];

const expectedP1Fixtures = [
  "fixtures/p1/expectations.manifest.json",
  ...expectedP1Rows.map((row) => row.fixturePath)
];

const allowedRenderPlans = [
  "artifacts/p1/render-plan.confirm-panel.json",
  "artifacts/p1/render-plan.status-callout.json",
  "artifacts/p1/render-plan.button-defaults.json"
];

const expectedP1Artifacts = [
  "artifacts/p1/runtime-projection.json",
  ...allowedRenderPlans,
  "artifacts/p1/runtime-adapter-report.json",
  "artifacts/p1/evidence.json"
];

const requiredBoundaryRefs = [
  "artifacts/p0/evidence.json",
  "artifacts/p0/governed-catalog.json",
  "artifacts/p0/adapter-diagnostics.json",
  "artifacts/p1/runtime-projection.json",
  ...allowedRenderPlans,
  "artifacts/p1/runtime-adapter-report.json"
];

const requiredP1DiagnosticCodes = [
  "PROJECTION_CATALOG_REF_MISSING",
  "PROJECTION_SOURCE_HASH_MISMATCH",
  "PROJECTION_AUTHORITY_ESCALATION",
  "RUNTIME_PROJECTION_HASH_MISMATCH",
  "RUNTIME_RENDER_PLAN_PROVENANCE_MISSING",
  "RUNTIME_ACTION_EXECUTION_BLOCKED",
  "RUNTIME_PROJECTION_MEMBER_UNKNOWN",
  "RUNTIME_REVIEW_REQUIRED",
  "RUNTIME_EVIDENCE_HASH_MISMATCH"
];

test("P1 command scripts are exposed", async () => {
  const packageJson = await readJson(root, "package.json");
  for (const script of requiredScripts) {
    assert.equal(typeof packageJson.scripts?.[script], "string", `${script} script must exist`);
  }
});

test("materialize:p1 creates required P1 schemas and fixtures", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);

  await assertFilesExist(workspace, requiredP1Schemas);
  await assertFilesExist(workspace, expectedP1Fixtures);

  const manifest = await readJson(workspace, "fixtures/p1/expectations.manifest.json");
  assert.equal(manifest.fixtureRoot, "fixtures/p1");
  assert.equal(manifest.artifactRoot, "artifacts/p1");
  assert.equal(manifest.schemaRoot, "schemas");
  assert.equal(manifest.runExpectation?.status, "pass");
  assert.equal(manifest.runExpectation?.promotionStatus, "review_required");
  assert.deepEqual(new Set(manifest.inputs), new Set(expectedP1Rows.map((row) => row.fixturePath)));
  assertExpectedRows(manifest.expectations, "manifest expectations");
});

test("proof:p1 emits bounded runtime adapter artifacts and evidence", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);
  await fs.rm(path.join(workspace, "artifacts/p1"), { recursive: true, force: true });

  const proof = await runNpm(workspace, ["run", "proof:p1"]);
  assert.match(`${proof.stdout}\n${proof.stderr}`, /pass/);
  await assertP1ArtifactSet(workspace);
  await assertP1ArtifactsValidate(workspace);

  const report = await readJson(workspace, "artifacts/p1/runtime-adapter-report.json");
  const evidence = await readJson(workspace, "artifacts/p1/evidence.json");
  const manifest = await readJson(workspace, "fixtures/p1/expectations.manifest.json");
  const projection = await readJson(workspace, "artifacts/p1/runtime-projection.json");
  const confirmPlan = await readJson(workspace, "artifacts/p1/render-plan.confirm-panel.json");

  assert.equal(report.status, "pass");
  assert.equal(report.promotionStatus, "review_required");
  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assertProjectedTokens(projection, confirmPlan);
  assertExpectedRows(manifest.expectations, "manifest expectations");
  assertExpectedRows(evidence.validationResults, "evidence validationResults");
  assertExpectedRows(report.results, "runtime adapter report results");
  await assertEvidenceBoundaryAndArtifactRefs(workspace, evidence, report);
  await assertDiagnosticsRegistryBehavior(workspace, manifest, report, evidence);
});

test("direct adapter proof command exits 0 after materialization and P0 proof", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);
  await runNpm(workspace, ["run", "proof:p0"]);
  await fs.rm(path.join(workspace, "artifacts/p1"), { recursive: true, force: true });

  const proof = await runNode(workspace, [
    "bin/interfacectl.js",
    "surfaces",
    "adapter",
    "proof",
    "--catalog",
    "artifacts/p0/governed-catalog.json",
    "--fixture",
    "fixtures/p1",
    "--out",
    "artifacts/p1"
  ]);

  assert.match(`${proof.stdout}\n${proof.stderr}`, /pass/);
  await assertP1ArtifactSet(workspace);
});

test("P1 proof rejects stale unexpected output before rewriting artifacts", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);
  await fs.rm(path.join(workspace, "artifacts/p1"), { recursive: true, force: true });
  await runNpm(workspace, ["run", "proof:p1"]);

  const before = await readArtifactBytes(workspace, expectedP1Artifacts);
  const stalePath = path.join(workspace, "artifacts/p1/unexpected.tmp");
  try {
    await fs.writeFile(stalePath, "stale");
    await assert.rejects(
      runNpm(workspace, ["run", "proof:p1"]),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(`${error.stdout || ""}\n${error.stderr || ""}`, /stale unexpected output/);
        return true;
      }
    );

    const after = await readArtifactBytes(workspace, expectedP1Artifacts);
    assert.deepEqual(after, before, "stale-output failure must not rewrite expected P1 artifacts");
  } finally {
    await fs.rm(stalePath, { force: true });
  }
});

test("P1 proof rejects manifest renderPlanPath traversal before outside writes", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);

  const manifest = await readJson(workspace, "fixtures/p1/expectations.manifest.json");
  const validExpectation = manifest.expectations.find((entry) => entry.fixturePath === "fixtures/p1/valid/confirm-panel.surface-ir.json");
  assert.ok(validExpectation, "valid P1 expectation must exist");
  validExpectation.renderPlanPath = "../outside-render-plans/render-plan.confirm-panel.json";
  await writeJson(workspace, "fixtures/p1/expectations.manifest.json", manifest);

  const outsideDir = path.join(path.dirname(workspace), "outside-render-plans");
  await fs.rm(outsideDir, { recursive: true, force: true });

  await assertProofP1Rejects(workspace, /renderPlanPath|manifest|path|outside|traversal|unsafe|artifactRoot|schema validation failed/);
  assert.equal(await pathExists(outsideDir), false, "renderPlanPath traversal must fail before creating outside directories");
});

test("P1 proof rejects manifest path traversal across path-bearing fields", async (t) => {
  const scenarios = [
    {
      name: "inputs",
      mutate: (manifest) => {
        manifest.inputs[0] = "../outside/confirm-panel.surface-ir.json";
      }
    },
    {
      name: "expectation fixturePath",
      mutate: (manifest) => {
        manifest.expectations[0].fixturePath = "../outside/confirm-panel.surface-ir.json";
      }
    },
    {
      name: "expectedArtifactPath",
      mutate: (manifest) => {
        manifest.expectations[0].expectedArtifactPath = "../outside/render-plan.confirm-panel.json";
      }
    },
    {
      name: "artifactOrder",
      mutate: (manifest) => {
        manifest.artifactOrder[0] = "../outside/runtime-projection.v0.schema.json";
      }
    }
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async (t) => {
      const workspace = await createWorkspace(t);
      await runNpm(workspace, ["run", "materialize:p1"]);

      const manifest = await readJson(workspace, "fixtures/p1/expectations.manifest.json");
      scenario.mutate(manifest);
      await writeJson(workspace, "fixtures/p1/expectations.manifest.json", manifest);

      await assertProofP1Rejects(workspace, /manifest|path|traversal|artifactOrder|schema validation failed|P1/);
    });
  }
});

test("P1 proof rejects each mutation fixture replaced with irrelevant JSON", async (t) => {
  for (const row of expectedP1Rows.filter((entry) => entry.fixtureKind === "mutation")) {
    await t.test(row.fixturePath, async (t) => {
      const workspace = await createWorkspace(t);
      await runNpm(workspace, ["run", "materialize:p1"]);

      await writeJson(workspace, row.fixturePath, {
        schemaId: "irrelevant-json.v0",
        note: "This is intentionally unrelated to the declared mutation fixture."
      });

      await assertProofP1Rejects(workspace, /surfaces adapter proof: fail|mutation fixture|schema validation failed|P1 .*mutation|run expectation mismatch/);
    });
  }
});

test("P1 proof rejects runtime fixture members absent from the projection", async (t) => {
  const scenarios = [
    {
      name: "unknown action",
      mutate: (fixture) => {
        fixture.root.actions.escalate = {
          execute: false,
          payload: {},
          sourceRef: "fixture://p1/valid/confirm-panel#/root/actions/escalate"
        };
      }
    },
    {
      name: "unknown event",
      mutate: (fixture) => {
        fixture.root.events.escalated = {
          payload: {},
          sourceRef: "fixture://p1/valid/confirm-panel#/root/events/escalated"
        };
      }
    },
    {
      name: "unknown slot",
      mutate: (fixture) => {
        fixture.root.slots.footer = [];
      }
    },
    {
      name: "unknown token ref",
      mutate: (fixture) => {
        fixture.root.tokenRefs.surface = "color.surface.missing";
      }
    },
    {
      name: "unknown data binding",
      mutate: (fixture) => {
        fixture.root.dataBindings.userId = "selectedItem.userId";
      }
    },
    {
      name: "unknown variant",
      mutate: (fixture) => {
        fixture.root.variant = "expanded";
      }
    },
    {
      name: "unknown state",
      mutate: (fixture) => {
        fixture.root.state = "expanded";
      }
    }
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async (t) => {
      const workspace = await createWorkspace(t);
      await runNpm(workspace, ["run", "materialize:p1"]);
      const fixturePath = "fixtures/p1/valid/confirm-panel.surface-ir.json";
      const fixture = await readJson(workspace, fixturePath);
      scenario.mutate(fixture);
      await writeJson(workspace, fixturePath, fixture);

      await assertProofP1Rejects(workspace, /run expectation mismatch|RUNTIME_PROJECTION_MEMBER_UNKNOWN|surfaces adapter proof: fail/);
    });
  }
});

test("P1 proof rejects tampered P1 schema files", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);

  await writeJson(workspace, "schemas/render-plan.v0.schema.json", {});

  await assertProofP1Rejects(workspace, /schema validation failed|schema directory|schema.*render-plan|render-plan.*schema|tampered P1 schema/);
});

test("P1 proof rejects tampered manifest runExpectation", async (t) => {
  const scenarios = [
    {
      name: "status",
      mutate: (manifest) => {
        manifest.runExpectation = {
          ...manifest.runExpectation,
          status: "fail"
        };
      }
    },
    {
      name: "promotionStatus",
      mutate: (manifest) => {
        manifest.runExpectation = {
          ...manifest.runExpectation,
          promotionStatus: "allowed"
        };
      }
    }
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async (t) => {
      const workspace = await createWorkspace(t);
      await runNpm(workspace, ["run", "materialize:p1"]);

      const manifest = await readJson(workspace, "fixtures/p1/expectations.manifest.json");
      scenario.mutate(manifest);
      await writeJson(workspace, "fixtures/p1/expectations.manifest.json", manifest);

      await assertProofP1Rejects(workspace, /runExpectation|run expectation|manifest|status|promotionStatus|fail|allowed/);
    });
  }
});

test("P1 P0 preflight rejects corrupted P0 boundary artifacts", async (t) => {
  const scenarios = [
    {
      name: "duplicate artifact paths",
      pattern: /P0 preflight|duplicated|duplicate|artifact refs/,
      mutate: async (workspace) => {
        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        const catalogEntry = findRef(evidence.artifacts, "artifacts/p0/governed-catalog.json");
        assert.ok(catalogEntry, "P0 evidence must include governed catalog ref");
        evidence.artifacts.splice(evidence.artifacts.length - 1, 0, JSON.parse(JSON.stringify(catalogEntry)));
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "schema-invalid P0 evidence",
      pattern: /P0 preflight|schema|evidence/,
      mutate: async (workspace) => {
        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        evidence.schemaId = "not-evidence.v0";
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "schema-invalid P0 adapter diagnostics",
      pattern: /P0 preflight|schema|adapter diagnostics/,
      mutate: async (workspace) => {
        const adapterDiagnostics = await readJson(workspace, "artifacts/p0/adapter-diagnostics.json");
        adapterDiagnostics.schemaId = "not-adapter-diagnostics.v0";
        await writeJson(workspace, "artifacts/p0/adapter-diagnostics.json", adapterDiagnostics);

        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        const adapterEntry = findRef(evidence.artifacts, "artifacts/p0/adapter-diagnostics.json");
        assert.ok(adapterEntry, "P0 evidence must include adapter diagnostics ref");
        adapterEntry.hash = sha256Hex(canonicalJson(adapterDiagnostics));
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "invalid P0 evidence self hash",
      pattern: /P0 preflight|self-hash|evidence/,
      mutate: async (workspace) => {
        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        const selfEntry = findRef(evidence.artifacts, "artifacts/p0/evidence.json");
        assert.ok(selfEntry, "P0 evidence must include self ref");
        selfEntry.hash = "0".repeat(64);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "failing P0 evidence status",
      pattern: /P0 preflight|not passing|evidence/,
      mutate: async (workspace) => {
        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        evidence.status = "fail";
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "failing P0 adapter diagnostics status",
      pattern: /P0 preflight|adapter diagnostics are not passing/,
      mutate: async (workspace) => {
        const adapterDiagnostics = await readJson(workspace, "artifacts/p0/adapter-diagnostics.json");
        adapterDiagnostics.status = "fail";
        await writeJson(workspace, "artifacts/p0/adapter-diagnostics.json", adapterDiagnostics);
      }
    },
    {
      name: "P0 run id mismatch",
      pattern: /P0 preflight|run ids do not match/,
      mutate: async (workspace) => {
        const adapterDiagnostics = await readJson(workspace, "artifacts/p0/adapter-diagnostics.json");
        adapterDiagnostics.runId = "mismatched-p0-run-id";
        await writeJson(workspace, "artifacts/p0/adapter-diagnostics.json", adapterDiagnostics);
      }
    },
    {
      name: "P0 governed catalog hash mismatch",
      pattern: /P0 preflight|artifact hashes do not match/,
      mutate: async (workspace) => {
        const catalog = await readJson(workspace, "artifacts/p0/governed-catalog.json");
        catalog.provenance.fixtureLabel = "tampered";
        await writeJson(workspace, "artifacts/p0/governed-catalog.json", catalog);
      }
    },
    {
      name: "P0 adapter diagnostics catalog path mismatch",
      pattern: /P0 preflight|catalog refs do not match command input/,
      mutate: async (workspace) => {
        const adapterDiagnostics = await readJson(workspace, "artifacts/p0/adapter-diagnostics.json");
        adapterDiagnostics.catalogRef.path = "artifacts/p0/catalog.json";
        await writeJson(workspace, "artifacts/p0/adapter-diagnostics.json", adapterDiagnostics);

        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        const adapterEntry = findRef(evidence.artifacts, "artifacts/p0/adapter-diagnostics.json");
        adapterEntry.hash = sha256Hex(canonicalJson(adapterDiagnostics));
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "P0 adapter diagnostics catalog ref mismatch",
      pattern: /P0 preflight|adapter diagnostics catalogRef does not match P0 evidence/,
      mutate: async (workspace) => {
        const adapterDiagnostics = await readJson(workspace, "artifacts/p0/adapter-diagnostics.json");
        adapterDiagnostics.catalogRef.hash = "0".repeat(64);
        await writeJson(workspace, "artifacts/p0/adapter-diagnostics.json", adapterDiagnostics);

        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        const adapterEntry = findRef(evidence.artifacts, "artifacts/p0/adapter-diagnostics.json");
        adapterEntry.hash = sha256Hex(canonicalJson(adapterDiagnostics));
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    },
    {
      name: "P0 adapter diagnostics path mismatch",
      pattern: /P0 preflight|adapter diagnostics path mismatch/,
      mutate: async (workspace) => {
        const evidence = await readJson(workspace, "artifacts/p0/evidence.json");
        evidence.adapterDiagnosticsPath = "artifacts/p0/adapter-diagnostics-copy.json";
        setEvidenceSelfHash(evidence);
        await writeJson(workspace, "artifacts/p0/evidence.json", evidence);
      }
    }
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async (t) => {
      const workspace = await createWorkspace(t);
      await runNpm(workspace, ["run", "materialize:p1"]);
      await runNpm(workspace, ["run", "proof:p0"]);
      await fs.rm(path.join(workspace, "artifacts/p1"), { recursive: true, force: true });

      await scenario.mutate(workspace);

      await assertDirectP1ProofRejects(workspace, scenario.pattern);
    });
  }
});

test("build:p1-demo writes demo HTML from passing evidence", async (t) => {
  const workspace = await createWorkspace(t);
  await runNpm(workspace, ["run", "materialize:p1"]);
  await fs.rm(path.join(workspace, "artifacts/p1"), { recursive: true, force: true });
  await fs.rm(path.join(workspace, "demo/p1"), { recursive: true, force: true });
  await runNpm(workspace, ["run", "proof:p1"]);

  await runNpm(workspace, ["run", "build:p1-demo"]);

  const html = await fs.readFile(path.join(workspace, "demo/p1/index.html"), "utf8");
  assert.match(html, /artifacts\/p1\/evidence\.json|evidence\.json/);
  assert.match(html, /review_required/);
  assert.match(html, /render-plan\.confirm-panel\.json|ConfirmPanel/);
  assert.doesNotMatch(html, /<script\b/i);
});

async function createWorkspace(t) {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "surfaces-p1-proof-"));
  t.after(async () => {
    await fs.rm(parent, { recursive: true, force: true });
  });

  const workspace = path.join(parent, "repo");
  await fs.cp(root, workspace, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(root, source);
      if (relative === "") return true;
      const [topLevel] = relative.split(path.sep);
      return topLevel !== ".git" && topLevel !== "node_modules";
    }
  });

  const rootNodeModules = path.join(root, "node_modules");
  if (await pathExists(rootNodeModules)) {
    await fs.symlink(rootNodeModules, path.join(workspace, "node_modules"), "dir");
  }

  return workspace;
}

async function runNpm(workspace, args) {
  return execFileAsync("npm", args, commandOptions(workspace));
}

async function runNode(workspace, args) {
  return execFileAsync("node", args, commandOptions(workspace));
}

function commandOptions(workspace) {
  return {
    cwd: workspace,
    env: {
      ...process.env,
      NO_COLOR: "1",
      npm_config_update_notifier: "false"
    },
    maxBuffer: 20 * 1024 * 1024
  };
}

async function assertFilesExist(workspace, relativePaths) {
  for (const relativePath of relativePaths) {
    const stats = await fs.stat(path.join(workspace, relativePath));
    assert.equal(stats.isFile(), true, `${relativePath} must be a file`);
  }
}

async function assertP1ArtifactSet(workspace) {
  const entries = await fs.readdir(path.join(workspace, "artifacts/p1"), { withFileTypes: true });
  const fileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  assert.deepEqual(
    fileNames,
    expectedP1Artifacts.map((artifactPath) => path.posix.basename(artifactPath)).sort(),
    "artifacts/p1 must contain only the declared P1 proof artifacts"
  );
  assert.deepEqual(entries.filter((entry) => !entry.isFile()).map((entry) => entry.name), []);
  assert.equal(await pathExists(path.join(workspace, "artifacts/p1/render-plan.review-required-action.json")), false);
}

async function assertP1ArtifactsValidate(workspace) {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
  const schemaEntries = await fs.readdir(path.join(workspace, "schemas"));
  for (const schemaFile of schemaEntries.sort()) {
    if (!schemaFile.endsWith(".json")) continue;
    const schema = await readJson(workspace, `schemas/${schemaFile}`);
    assert.equal(ajv.validateSchema(schema), true, `${schemaFile} must be a valid JSON Schema`);
    ajv.addSchema(schema);
  }

  await validateJsonArtifact(ajv, workspace, "schemas/runtime-projection.v0.schema.json", "artifacts/p1/runtime-projection.json");
  for (const renderPlanPath of allowedRenderPlans) {
    await validateJsonArtifact(ajv, workspace, "schemas/render-plan.v0.schema.json", renderPlanPath);
  }
  await validateJsonArtifact(ajv, workspace, "schemas/runtime-adapter-report.v0.schema.json", "artifacts/p1/runtime-adapter-report.json");
  await validateJsonArtifact(ajv, workspace, "schemas/runtime-adapter-evidence.v0.schema.json", "artifacts/p1/evidence.json");
}

async function validateJsonArtifact(ajv, workspace, schemaPath, dataPath) {
  const schema = await readJson(workspace, schemaPath);
  const validate = schema.$id ? ajv.getSchema(schema.$id) : ajv.compile(schema);
  assert.ok(validate, `schema must be registered for ${schemaPath}`);
  const data = await readJson(workspace, dataPath);
  assert.equal(validate(data), true, `${dataPath} failed ${schemaPath}: ${JSON.stringify(validate.errors)}`);
}

function assertExpectedRows(rows, label) {
  assert.ok(Array.isArray(rows), `${label} must be an array`);
  const rowsByFixture = new Map(rows.map((row) => [row.fixturePath, row]));
  assert.deepEqual(
    new Set(rowsByFixture.keys()),
    new Set(expectedP1Rows.map((row) => row.fixturePath)),
    `${label} must cover every declared P1 expectation exactly once`
  );

  for (const expected of expectedP1Rows) {
    const row = rowsByFixture.get(expected.fixturePath);
    assert.equal(row.fixtureKind, expected.fixtureKind, `${label} ${expected.fixturePath} fixture kind`);
    assertOptionalField(row, "expectedStage", expected.expectedStage, label, expected.fixturePath);
    assertOptionalField(row, "actualStage", expected.expectedStage, label, expected.fixturePath);
    assertOptionalField(row, "expectedPhase", expected.expectedPhase, label, expected.fixturePath);
    assertOptionalField(row, "actualPhase", expected.expectedPhase, label, expected.fixturePath);
    assertOptionalField(row, "expectedValidationResult", expected.expectedValidationResult, label, expected.fixturePath);
    assertOptionalField(row, "actualValidationResult", expected.expectedValidationResult, label, expected.fixturePath);
    assertOptionalField(row, "expectedPromotionStatus", expected.expectedPromotionStatus, label, expected.fixturePath);
    assertOptionalField(row, "actualPromotionStatus", expected.expectedPromotionStatus, label, expected.fixturePath);
    assertOptionalField(row, "expectedDiagnosticCodes", expected.expectedDiagnosticCodes, label, expected.fixturePath);
    assertOptionalField(row, "actualDiagnosticCodes", expected.expectedDiagnosticCodes, label, expected.fixturePath);
    assertOptionalField(row, "expectedArtifactPath", expected.expectedArtifactPath, label, expected.fixturePath);
    assertOptionalField(row, "artifactPath", expected.expectedArtifactPath, label, expected.fixturePath);
    assertOptionalField(row, "expectedJsonPointer", expected.expectedJsonPointer, label, expected.fixturePath);
    assertOptionalField(row, "jsonPointer", expected.expectedJsonPointer, label, expected.fixturePath);
    assertOptionalField(row, "requiredSourceRef", expected.requiredSourceRef, label, expected.fixturePath);
    assertOptionalField(row, "sourceRef", expected.requiredSourceRef, label, expected.fixturePath);
    assertOptionalField(row, "renderPlanPath", expected.renderPlanPath, label, expected.fixturePath);
    if ("matched" in row) {
      assert.equal(row.matched, true, `${label} ${expected.fixturePath} must be matched`);
    }
  }
}

function assertOptionalField(row, field, expected, label, fixturePath) {
  if (Object.prototype.hasOwnProperty.call(row, field)) {
    assert.deepEqual(row[field], expected, `${label} ${fixturePath} ${field}`);
  }
}

function assertProjectedTokens(projection, renderPlan) {
  assert.equal(projection.tokens["color.action.primaryBg"].value, "#0B5FFF");
  assert.equal(projection.tokens["color.action.primaryBg"].cssVariable, "--surfaces-color-action-primary-bg");
  assert.equal(projection.tokens["color.action.primaryBg"].sourceRef, "fixture://p0/source#/tokens/color/action/primaryBg");
  assert.equal(projection.tokens["shadow.raised"].cssVariable, "--surfaces-shadow-raised");
  assert.equal(projection.tokens["shadow.raised"].value.blur, 18);
  assert.equal(renderPlan.tokens["shadow.raised"].cssVariable, "--surfaces-shadow-raised");
  assert.deepEqual(renderPlan.tree.tokens.surface, projection.tokens["color.surface.panel"]);
  for (const [tokenRef, token] of Object.entries(projection.tokens)) {
    assert.match(tokenRef, /^[A-Za-z0-9.]+$/);
    assert.match(token.cssVariable, /^--surfaces-[a-z0-9-]+$/);
    assert.equal(typeof token.sourceRef, "string");
    assert.ok(Object.prototype.hasOwnProperty.call(token, "value"), `${tokenRef} must carry a resolved value`);
  }
}

async function assertEvidenceBoundaryAndArtifactRefs(workspace, evidence, report) {
  assert.ok(Array.isArray(evidence.boundaryRefs), "P1 evidence must include boundaryRefs");
  assert.ok(Array.isArray(evidence.artifacts), "P1 evidence must include artifacts");

  for (const artifactPath of requiredBoundaryRefs) {
    const ref = findRef(evidence.boundaryRefs, artifactPath);
    assert.ok(ref, `boundaryRefs must include ${artifactPath}`);
    assert.equal(ref.sourceArtifactHash, ref.hash, `boundaryRefs must preserve sourceArtifactHash for ${artifactPath}`);
    assertArtifactProvenance(ref, artifactPath);
  }
  for (const artifactPath of [...requiredBoundaryRefs, "artifacts/p1/evidence.json"]) {
    const ref = findRef(evidence.artifacts, artifactPath);
    assert.ok(ref, `artifacts must include ${artifactPath}`);
    assertArtifactProvenance(ref, artifactPath);
  }
  const p0EvidenceArtifact = findRef(evidence.artifacts, "artifacts/p0/evidence.json");
  assert.equal(p0EvidenceArtifact.schemaId, "evidence.v0", "P1 evidence must classify P0 evidence with the P0 evidence schema id");
  assert.notEqual(p0EvidenceArtifact.schemaId, "runtime-adapter-evidence.v0", "P0 evidence must not be classified as P1 runtime adapter evidence");

  const boundaryRenderPlanPaths = pathsMatching(evidence.boundaryRefs, /^artifacts\/p1\/render-plan\..+\.json$/);
  const artifactRenderPlanPaths = pathsMatching(evidence.artifacts, /^artifacts\/p1\/render-plan\..+\.json$/);
  const reportRenderPlanPaths = pathsMatching(report.renderPlans, /^artifacts\/p1\/render-plan\..+\.json$/);
  assert.deepEqual(boundaryRenderPlanPaths, [...allowedRenderPlans].sort());
  assert.deepEqual(artifactRenderPlanPaths, [...allowedRenderPlans].sort());
  assert.deepEqual(reportRenderPlanPaths, [...allowedRenderPlans].sort());

  for (const refPath of requiredBoundaryRefs) {
    await assertRefMatchesFile(workspace, findRef(evidence.boundaryRefs, refPath), refPath);
  }
  for (const refPath of requiredBoundaryRefs) {
    await assertRefMatchesFile(workspace, findRef(evidence.artifacts, refPath), refPath);
  }

  const finalEntry = evidence.artifacts[evidence.artifacts.length - 1];
  assert.equal(finalEntry.path, "artifacts/p1/evidence.json", "P1 evidence self artifact must be ordered last");
  const clone = JSON.parse(JSON.stringify(evidence));
  const cloneSelf = findRef(clone.artifacts, "artifacts/p1/evidence.json");
  cloneSelf.hash = null;
  assert.equal(finalEntry.hash, sha256Hex(canonicalJson(clone)));
}

function assertArtifactProvenance(ref, artifactPath) {
  assert.equal(ref.provenance?.sourceUri, artifactPath, `${artifactPath} provenance.sourceUri`);
  assert.equal(ref.provenance?.sourceRef, `artifact://${artifactPath}`, `${artifactPath} provenance.sourceRef`);
  assert.equal(ref.provenance?.generatedAt, "1970-01-01T00:00:00.000Z", `${artifactPath} provenance.generatedAt`);
  assert.equal(ref.provenance?.environment?.pathStyle, "posix-relative", `${artifactPath} provenance.environment.pathStyle`);
  assert.equal(typeof ref.provenance?.sourceHash, "string", `${artifactPath} provenance.sourceHash`);
}

async function assertDiagnosticsRegistryBehavior(workspace, manifest, report, evidence) {
  const diagnosticsSchema = await readJson(workspace, "schemas/runtime-adapter-diagnostics.v0.schema.json");
  const registry = diagnosticsSchema.xDiagnosticsRegistry;
  assert.ok(Array.isArray(registry), "runtime adapter diagnostics schema must expose xDiagnosticsRegistry");
  const registryCodes = new Set(registry.map((row) => row.code));

  for (const code of requiredP1DiagnosticCodes) {
    assert.ok(registryCodes.has(code), `P1 diagnostics registry must include ${code}`);
  }

  for (const expectation of manifest.expectations) {
    for (const code of expectation.expectedDiagnosticCodes) {
      assert.ok(registryCodes.has(code), `manifest diagnostic code must be registry-backed: ${code}`);
    }
  }

  const emittedDiagnostics = [...(report.diagnostics || []), ...(evidence.diagnostics || [])];
  assert.ok(emittedDiagnostics.length > 0, "P1 report or evidence must emit diagnostics for rejected/review rows");
  for (const diagnostic of emittedDiagnostics) {
    const registryRow = registry.find((row) => {
      if (row.code !== diagnostic.code) return false;
      return row.artifactPath === diagnostic.artifactPath ||
        (row.fixtureCoverage && diagnostic.artifactPath?.endsWith(row.fixtureCoverage));
    }) ?? registry.find((row) => row.code === diagnostic.code);

    assert.ok(registryRow, `diagnostic code must be registry-backed: ${diagnostic.code}`);
    assert.equal(diagnostic.message, registryRow.canonicalMessage, `${diagnostic.code} must use the canonical registry message`);
  }
}

async function assertRefMatchesFile(workspace, ref, relativePath) {
  assert.equal(ref.hashAlgorithm, "sha256", `${relativePath} must use sha256`);
  assert.equal(ref.hash, await expectedHashForArtifact(workspace, relativePath), `${relativePath} hash must match evidence ref`);
}

async function expectedHashForArtifact(workspace, relativePath) {
  if (relativePath === "artifacts/p0/evidence.json") {
    const upstreamEvidence = await readJson(workspace, relativePath);
    const upstreamSelfRef = findRef(upstreamEvidence.artifacts, relativePath);
    assert.ok(upstreamSelfRef, "upstream P0 evidence must include its self artifact ref");
    return upstreamSelfRef.hash;
  }

  const fileBytes = await fs.readFile(path.join(workspace, relativePath), "utf8");
  return sha256Hex(fileBytes);
}

function findRef(refs, artifactPath) {
  return refs.find((ref) => ref.path === artifactPath || ref.artifactPath === artifactPath);
}

function pathsMatching(refs, pattern) {
  assert.ok(Array.isArray(refs), "expected refs array");
  return refs.map((ref) => ref.path ?? ref.artifactPath).filter((artifactPath) => pattern.test(artifactPath)).sort();
}

async function readArtifactBytes(workspace, artifactPaths) {
  const entries = {};
  for (const artifactPath of artifactPaths) {
    entries[artifactPath] = await fs.readFile(path.join(workspace, artifactPath), "utf8");
  }
  return entries;
}

async function readJson(workspace, relativePath) {
  return JSON.parse(await fs.readFile(path.join(workspace, relativePath), "utf8"));
}

async function writeJson(workspace, relativePath, data) {
  await fs.writeFile(path.join(workspace, relativePath), canonicalJson(data));
}

async function assertProofP1Rejects(workspace, pattern) {
  await assert.rejects(
    runNpm(workspace, ["run", "proof:p1"]),
    (error) => {
      assert.ok([1, 2].includes(error.code), `proof:p1 must fail with exit 1 or 2, got ${error.code}`);
      const output = commandOutput(error);
      assert.doesNotMatch(output, /ReferenceError|TypeError|SyntaxError/, "proof:p1 must fail through proof validation, not a raw runtime error");
      assert.match(output, pattern);
      return true;
    }
  );
}

async function assertDirectP1ProofRejects(workspace, pattern) {
  await assert.rejects(
    runNode(workspace, [
      "bin/interfacectl.js",
      "surfaces",
      "adapter",
      "proof",
      "--catalog",
      "artifacts/p0/governed-catalog.json",
      "--fixture",
      "fixtures/p1",
      "--out",
      "artifacts/p1"
    ]),
    (error) => {
      assert.ok([1, 2].includes(error.code), `direct P1 proof must fail with exit 1 or 2, got ${error.code}`);
      const output = commandOutput(error);
      assert.doesNotMatch(output, /ReferenceError|TypeError|SyntaxError/, "direct P1 proof must fail through proof validation, not a raw runtime error");
      assert.match(output, pattern);
      return true;
    }
  );
}

function commandOutput(error) {
  return `${error.stdout || ""}\n${error.stderr || ""}`;
}

function setEvidenceSelfHash(evidence) {
  const selfEntry = evidence.artifacts[evidence.artifacts.length - 1];
  assert.equal(selfEntry.path, "artifacts/p0/evidence.json", "P0 evidence self-ref must be the final artifact entry");
  selfEntry.hash = null;
  selfEntry.hash = sha256Hex(canonicalJson(evidence));
}

async function pathExists(absolutePath) {
  try {
    await fs.stat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}
