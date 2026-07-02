import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import {
  SC_FORBIDDEN_CLAIM_KEYS,
  SC_REVIEW_POLICY_SOURCE_REF,
  SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF
} from "../src/source-conformance-contract.js";
import { sourceConformanceInternals } from "../src/source-conformance-proof.js";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const stalePath = path.join(root, "artifacts/source-conformance/stale.tmp");

test("source conformance proof emits passing evidence with final self-hash", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const report = await readJson("artifacts/source-conformance/source-conformance-report.json");

  assert.equal(evidence.status, "pass");
  assert.equal(evidence.promotionStatus, "review_required");
  assert.equal(evidence.validationResults.length, 18);
  assert.deepEqual(evidence.boundaryRefs.map((entry) => entry.path), [
    "artifacts/p2/evidence.json",
    "artifacts/p2/governed-catalog.json"
  ]);
  assert.deepEqual(
    evidence.fixtureRefs
      .filter((entry) => entry.path.endsWith(".declared-source-manifest.json"))
      .map((entry) => entry.schemaId),
    ["declared-source-manifest.v0", "declared-source-manifest.v0"]
  );
  assert.equal(evidence.artifacts.at(-1).path, "artifacts/source-conformance/evidence.json");
  assert.equal(evidence.artifacts.at(-1).hash, sourceConformanceInternals.computeEvidenceSelfHash(evidence));
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/source-conformance/source-inventory.json",
    "artifacts/source-conformance/source-authority-map.json",
    "artifacts/source-conformance/source-review-queue.json",
    "artifacts/source-conformance/source-conformance-report.json",
    "artifacts/source-conformance/evidence.json"
  ]);
  assert.equal(report.status, evidence.status);
  assert.equal(report.promotionStatus, evidence.promotionStatus);
});

test("source conformance proof preserves review-required rows without execution", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const reviewQueue = await readJson("artifacts/source-conformance/source-review-queue.json");
  const schema = await readJson("schemas/source-review-queue.v0.schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validate = ajv.compile(schema);

  assert.equal(reviewQueue.promotionStatus, "review_required");
  assert.equal(reviewQueue.queueItems.length, 2);
  assert.equal(reviewQueue.queueItems[0].executable, false);
  assert.equal(reviewQueue.queueItems[0].owner, "design-systems-governance");
  assert.equal(reviewQueue.queueItems[0].rationale, "Brand exception changes action emphasis and requires source-owner review.");
  assert.equal(reviewQueue.queueItems[0].expiresAt, "1970-01-31T00:00:00.000Z");
  assert.equal(reviewQueue.queueItems[0].requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);
  assert.equal(reviewQueue.queueItems[1].executable, false);
  assert.equal(reviewQueue.queueItems[1].reviewQueueItemId, "source-review-source-mapping-ambiguous");
  assert.equal(reviewQueue.queueItems[1].owner, "design-systems-governance");
  assert.equal(reviewQueue.queueItems[1].rationale, "Button source mapping is ambiguous across declared sources and requires source-owner review.");
  assert.equal(reviewQueue.queueItems[1].expiresAt, "1970-01-31T00:00:00.000Z");
  assert.equal(reviewQueue.queueItems[1].requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);
  assert.equal(reviewQueue.queueItems[1].requiredSourceRefs.includes(SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF), true);
  assert.deepEqual(reviewQueue.diagnostics.map((diagnostic) => diagnostic.code), [
    "SOURCE_MAPPING_AMBIGUOUS",
    "SOURCE_REVIEW_REQUIRED"
  ]);
  const reviewRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/review/brand-exception.source-conformance.json"
  );
  assert.equal(reviewRow.actualResult, "review_required");
  assert.equal(reviewRow.reviewQueueItemId, "source-review-brand-exception");
  assert.deepEqual(reviewRow.diagnosticCodes, ["SOURCE_REVIEW_REQUIRED"]);
  assert.equal(reviewRow.requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);
  const ambiguousRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/review/source-mapping-ambiguous.source-conformance.json"
  );
  assert.equal(ambiguousRow.actualResult, "review_required");
  assert.equal(ambiguousRow.reviewQueueItemId, "source-review-source-mapping-ambiguous");
  assert.deepEqual(ambiguousRow.diagnosticCodes, ["SOURCE_MAPPING_AMBIGUOUS"]);
  assert.equal(ambiguousRow.requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);
  assert.equal(ambiguousRow.requiredSourceRefs.includes(SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF), true);
  assert.equal(ambiguousRow.authorityConflict.resolutionRule, "review-required");
  assert.equal(ambiguousRow.authorityConflict.selectedSourceRef, null);
  assert.equal(validate(reviewQueue), true);
  assert.equal(validate({
    ...reviewQueue,
    queueItems: reviewQueue.queueItems.map((item) => ({ ...item, expiresAt: "1969-12-31T00:00:00.000Z" }))
  }), false);
  assert.equal(validate({
    ...reviewQueue,
    queueItems: reviewQueue.queueItems.map((item) => ({
      ...item,
      requiredSourceRefs: item.requiredSourceRefs.filter((ref) => ref !== SC_REVIEW_POLICY_SOURCE_REF)
    }))
  }), false);
});

test("source conformance proof blocks expired review metadata", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const policyRefMissingRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/invalid/review-policy-ref-missing.source-conformance.json"
  );
  assert.equal(policyRefMissingRow.actualResult, "invalid");
  assert.equal(policyRefMissingRow.promotionStatus, "blocked");
  assert.deepEqual(policyRefMissingRow.diagnosticCodes, ["SOURCE_REVIEW_POLICY_REF_MISSING"]);

  const expiredRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/invalid/review-expired.source-conformance.json"
  );
  assert.equal(expiredRow.actualResult, "invalid");
  assert.equal(expiredRow.promotionStatus, "blocked");
  assert.deepEqual(expiredRow.diagnosticCodes, ["SOURCE_REVIEW_EXPIRED"]);
  assert.equal(expiredRow.review.owner, "design-systems-governance");
  assert.equal(expiredRow.review.rationale, "Expired brand exception must block until source-owner review metadata is renewed.");
  assert.equal(expiredRow.review.expiresAt, "1969-12-31T00:00:00.000Z");
  assert.equal(expiredRow.reviewQueueItemId, null);

  const fixturePath = path.join(root, "fixtures/source-conformance/review/brand-exception.source-conformance.json");
  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.review.required = "true";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredSourceRefs = fixture.requiredSourceRefs.filter((ref) =>
      ref !== "declared-source://source-conformance/governance/review-policy.json#/"
    );
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_REVIEW_POLICY_REF_MISSING/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.review.expiresAt = "1969-12-31T00:00:00.000Z";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_REVIEW_EXPIRED/);
  });

  for (const expiresAt of ["1970-01-31T00:00:00Z", "1970-01-01T00:00:00.000Z"]) {
    await withJsonFileMutation(fixturePath, (fixture) => {
      fixture.review.expiresAt = expiresAt;
    }, async () => {
      const result = await runSourceConformanceProofExpectFailure();
      assert.equal(result.code, 1);
      assert.match(result.stderr, /SOURCE_REVIEW_EXPIRED/);
    });
  }
});

test("source conformance proof requires ambiguous source mappings to stay review-required", async () => {
  await runSourceConformanceProof();
  const fixturePath = path.join(root, "fixtures/source-conformance/review/source-mapping-ambiguous.source-conformance.json");

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.review.required = false;
    fixture.review.owner = null;
    fixture.review.rationale = null;
    fixture.review.expiresAt = null;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_REVIEW_OWNER_MISSING/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.selectedSourceRef = "declared-source://source-conformance/components/button.json#/";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.resolvedBy = "declared-source://source-conformance/policies/source-precedence.json#/";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });
});

test("source conformance proof rejects stale output and non-normalized command paths", async () => {
  await fs.writeFile(stalePath, "stale");
  try {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /stale unexpected output/);
  } finally {
    await fs.rm(stalePath, { force: true });
  }

  const result = await runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "source-conformance",
    "proof",
    "--source",
    "sources/source-conformance/../source-conformance/declared-source-bundle",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--fixture",
    "fixtures/source-conformance",
    "--out",
    "artifacts/source-conformance"
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /without \. or \.\. segments/);
});

test("source conformance proof fails closed on forbidden production claims", async () => {
  await runSourceConformanceProof();
  const fixturePath = path.join(root, "fixtures/source-conformance/valid/button-allowed.source-conformance.json");

  for (const claimKey of SC_FORBIDDEN_CLAIM_KEYS) {
    await withJsonFileMutation(fixturePath, (fixture) => {
      fixture.claims[claimKey] = true;
    }, async () => {
      const result = await runSourceConformanceProofExpectFailure();
      assert.equal(result.code, 1);
      assert.match(result.stderr, /source conformance validation expectation mismatch/);
      assert.match(result.stderr, /SOURCE_PRODUCTION_CLAIM_FORBIDDEN/);
    });
  }
});

test("source conformance proof binds fixtures to declared source refs and accepted P2 components", async () => {
  await runSourceConformanceProof();
  const fixturePath = path.join(root, "fixtures/source-conformance/valid/button-allowed.source-conformance.json");

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.sourceRef = "declared-source://source-conformance/components/private-card.json#/";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /DECLARED_SOURCE_REF_UNDECLARED/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredSourceRefs = ["declared-source://source-conformance/components/private-card.json#/"];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /DECLARED_SOURCE_REF_UNDECLARED/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.componentId = "UnknownCard";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_CATALOG_COMPONENT_UNKNOWN/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.sourceRef = "declared-source://source-conformance/components/in-line-alert.json#/";
    fixture.requiredSourceRefs = ["declared-source://source-conformance/components/in-line-alert.json#/"];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_COMPONENT_SOURCE_MISMATCH/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.sourceRef = "declared-source://source-conformance/components/button-acquired-a.json#/";
    fixture.requiredSourceRefs = [
      "declared-source://source-conformance/components/button-acquired-a.json#/",
      "declared-source://source-conformance/policies/accessibility.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_COMPONENT_SOURCE_MISMATCH/);
  });
});

test("source conformance proof accepts explicit Button source precedence", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const report = await readJson("artifacts/source-conformance/source-conformance-report.json");
  const authorityMap = await readJson("artifacts/source-conformance/source-authority-map.json");

  const precedenceRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/valid/button-source-precedence-accepted.source-conformance.json"
  );
  assert.equal(precedenceRow.actualResult, "valid");
  assert.equal(precedenceRow.promotionStatus, "allowed");
  assert.deepEqual(precedenceRow.diagnosticCodes, []);
  assert.equal(precedenceRow.authorityConflict.resolutionRule, "declared-source-precedence");
  assert.equal(precedenceRow.authorityConflict.resolvedBy, SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF);
  assert.equal(precedenceRow.authorityConflict.selectedSourceRef, "declared-source://source-conformance/components/button.json#/");
  assert.equal(precedenceRow.requiredSourceRefs.includes("declared-source://source-conformance/components/button-acquired-a.json#/"), true);
  assert.equal(precedenceRow.requiredSourceRefs.includes("declared-source://source-conformance/components/button-acquired-b.json#/"), true);
  assert.equal(precedenceRow.requiredSourceRefs.includes(SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF), true);

  const reportRow = report.results.find((row) => row.fixturePath === precedenceRow.fixturePath);
  assert.deepEqual(reportRow.authorityConflict, precedenceRow.authorityConflict);

  const buttonAuthority = authorityMap.componentAuthority.find((row) => row.componentId === "Button");
  assert.equal(buttonAuthority.declaredSourceRef, "declared-source://source-conformance/components/button.json#/");
  assert.deepEqual(buttonAuthority.additionalDeclaredSourceRefs, [
    "declared-source://source-conformance/components/button-acquired-a.json#/",
    "declared-source://source-conformance/components/button-acquired-b.json#/"
  ]);
  assert.equal(buttonAuthority.precedencePolicyRef, SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF);

  const fixturePath = path.join(root, "fixtures/source-conformance/valid/button-source-precedence-accepted.source-conformance.json");
  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.conflictingRefs = [
      "declared-source://source-conformance/components/button-acquired-a.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.conflictingRefs = [
      "declared-source://source-conformance/components/button-acquired-a.json#/",
      "declared-source://source-conformance/policies/accessibility.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });
});

test("source conformance evidence integrity check detects artifact tampering", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const code = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(root, {
    ...evidence,
    artifacts: evidence.artifacts.map((entry) =>
      entry.path === "artifacts/source-conformance/source-conformance-report.json"
        ? { ...entry, hash: "0".repeat(64) }
        : entry
    )
  });
  assert.equal(code, "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH");

  const boundaryCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(root, {
    ...evidence,
    boundaryRefs: evidence.boundaryRefs.map((entry) =>
      entry.path === "artifacts/p2/governed-catalog.json"
        ? { ...entry, sourceEvidenceHash: "0".repeat(64) }
        : entry
    )
  });
  assert.equal(boundaryCode, "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH");
});

async function runSourceConformanceProof() {
  await execFileAsync(process.execPath, [
    "bin/interfacectl.js",
    "surfaces",
    "source-conformance",
    "proof",
    "--source",
    "sources/source-conformance/declared-source-bundle",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--fixture",
    "fixtures/source-conformance",
    "--out",
    "artifacts/source-conformance"
  ], { cwd: root });
}

async function runSourceConformanceProofExpectFailure() {
  return runCommandExpectFailure([
    "bin/interfacectl.js",
    "surfaces",
    "source-conformance",
    "proof",
    "--source",
    "sources/source-conformance/declared-source-bundle",
    "--ingestion-evidence",
    "artifacts/p2/evidence.json",
    "--catalog",
    "artifacts/p2/governed-catalog.json",
    "--fixture",
    "fixtures/source-conformance",
    "--out",
    "artifacts/source-conformance"
  ]);
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
