import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import test from "node:test";
import { canonicalJson } from "../src/p0.js";
import {
  SC_FORBIDDEN_CLAIM_KEYS,
  SC_EXCEPTION_POLICY_SOURCE_REF,
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
  assert.equal(evidence.validationResults.length, 23);
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
  assert.equal(evidence.authorityProfileRef.path, "sources/source-conformance/declared-source-bundle/governance/authority-profile.json");
  assert.equal(evidence.authorityProfileRef.schemaId, "source-authority-profile.v0");
  assert.deepEqual(
    evidence.authorityProfileRef,
    evidence.sourceFileRefs.find((entry) => entry.path === evidence.authorityProfileRef.path)
  );
  assert.deepEqual(evidence.artifacts.map((entry) => entry.path), [
    "artifacts/source-conformance/source-inventory.json",
    "artifacts/source-conformance/source-fact-coverage.json",
    "artifacts/source-conformance/source-authority-map.json",
    "artifacts/source-conformance/source-review-queue.json",
    "artifacts/source-conformance/governed-catalog.json",
    "artifacts/source-conformance/authority-connection-report.json",
    "artifacts/source-conformance/source-conformance-report.json",
    "artifacts/source-conformance/evidence.json"
  ]);
  assert.equal(report.status, evidence.status);
  assert.equal(report.promotionStatus, evidence.promotionStatus);
  assert.equal(report.sourceFactCoverageRef.path, "artifacts/source-conformance/source-fact-coverage.json");
  assert.equal(report.governedCatalogRef.path, "artifacts/source-conformance/governed-catalog.json");
  assert.equal(report.authorityConnectionReportRef.path, "artifacts/source-conformance/authority-connection-report.json");
});

test("source conformance compiles checked facts into an actionable non-expanding authority result", async () => {
  await runSourceConformanceProof();
  const p2Catalog = await readJson("artifacts/p2/governed-catalog.json");
  const governedCatalog = await readJson("artifacts/source-conformance/governed-catalog.json");
  const coverage = await readJson("artifacts/source-conformance/source-fact-coverage.json");
  const connection = await readJson("artifacts/source-conformance/authority-connection-report.json");
  const authorityMap = await readJson("artifacts/source-conformance/source-authority-map.json");
  const evidence = await readJson("artifacts/source-conformance/evidence.json");

  assert.deepEqual(coverage.summary, {
    allowedCount: 6,
    blockedCount: 0,
    componentCount: 2,
    exceptionCount: 1,
    factCount: 6,
    reviewRequiredCount: 1
  });
  assert.equal(coverage.promotionStatus, "review_required");
  assert.deepEqual(coverage.componentCoverage.map((row) => row.componentId), ["Button", "InLineAlert"]);
  const button = coverage.componentCoverage.find((row) => row.componentId === "Button");
  const variant = button.facts.find((fact) => fact.catalogPointer === "/components/Button/props/variant/allowedValues");
  assert.equal(variant.conflict, true);
  assert.equal(variant.resolution, "primary-precedence");
  assert.equal(variant.status, "allowed");
  assert.equal(variant.supportingFactRefs.length, 2);
  const role = button.facts.find((fact) => fact.catalogPointer === "/components/Button/accessibility/role");
  assert.equal(role.conflict, true);
  assert.equal(role.resolution, "primary-precedence");
  assert.equal(role.status, "allowed");
  assert.equal(role.supportingFactRefs.length, 2);
  const alert = coverage.componentCoverage.find((row) => row.componentId === "InLineAlert");
  assert.equal(alert.facts.length, 3);
  assert.equal(alert.facts.every((fact) => fact.conflict === false && fact.resolution === "exact-match"), true);
  assert.equal(coverage.policyCoverage.length, 5);
  assert.equal(coverage.exceptionCoverage.length, 1);

  assert.equal(connection.status, "pass");
  assert.equal(connection.promotionStatus, "review_required");
  assert.equal(connection.components.find((row) => row.componentId === "Button").conflictCount, 2);
  assert.equal(connection.components.reduce((count, row) => count + row.understoodFactCount, 0), 6);
  assert.equal(connection.findings.filter((finding) => finding.status !== "allowed").every((finding) =>
    finding.actionType !== "none" &&
    (finding.editPath !== null || finding.jsonPointer !== null) &&
    finding.sourceRefs.length > 0 &&
    finding.owner !== null
  ), true);
  assert.match(connection.nonAuthorityStatement, /cannot add catalog capability/);
  assert.match(connection.nonAuthorityStatement, /connect live sources/);

  for (const field of ["components", "tokens", "runtimeCapabilities", "compatibility"]) {
    assert.equal(canonicalJson(governedCatalog[field]), canonicalJson(p2Catalog[field]));
  }
  assert.equal(canonicalJson(governedCatalog).includes("expressive"), false);
  assert.equal(governedCatalog.governance.rules.authorityConnection.canAddAuthority, false);
  assert.equal(governedCatalog.governance.promotionStatus, "review_required");
  assert.deepEqual(authorityMap.authorityProfileRef, evidence.authorityProfileRef);
  assert.equal(authorityMap.sourceFactCoverageRef.path, "artifacts/source-conformance/source-fact-coverage.json");
  assert.equal(authorityMap.componentAuthority.every((row) => row.bindingId && row.authoritativePointers.length > 0), true);
  assert.equal(authorityMap.policyAuthority.some((row) => row.policyId === "content-policy"), true);

  const escalation = evidence.validationResults.find((row) =>
    row.fixturePath.endsWith("source-fact-authority-escalation.source-conformance.json")
  );
  assert.deepEqual(escalation.diagnosticCodes, ["SOURCE_FACT_AUTHORITY_ESCALATION"]);
  const drift = evidence.validationResults.find((row) =>
    row.fixturePath.endsWith("governed-catalog-drift.source-conformance.json")
  );
  assert.deepEqual(drift.diagnosticCodes, ["SOURCE_GOVERNED_CATALOG_DRIFT"]);
});

test("source conformance proof preserves review-required rows without execution", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const reviewQueue = await readJson("artifacts/source-conformance/source-review-queue.json");
  const schema = await readJson("schemas/source-review-queue.v0.schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validate = ajv.compile(schema);

  assert.equal(reviewQueue.promotionStatus, "review_required");
  assert.equal(reviewQueue.queueItems.length, 4);
  assert.equal(reviewQueue.queueItems.every((item) => item.executable === false), true);
  const profileItem = reviewQueue.queueItems.find((item) => item.origin === "authority-profile");
  assert.equal(profileItem.reviewQueueItemId, "source-review-authority-exception-button-forked-variant");
  assert.equal(profileItem.subjectRef, "declared-source://source-conformance/components/button-forked-variant.json#/");
  assert.equal(profileItem.owner, "design-systems-governance");
  assert.equal(profileItem.rationale, "Declared source exceptions require design-system owner review before catalog promotion.");
  assert.equal(profileItem.requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);
  assert.equal(profileItem.requiredSourceRefs.includes(SC_EXCEPTION_POLICY_SOURCE_REF), true);
  const brandItem = reviewQueue.queueItems.find((item) => item.reviewQueueItemId === "source-review-brand-exception");
  assert.equal(brandItem.origin, "fixture-proof");
  assert.equal(brandItem.rationale, "Brand exception changes action emphasis and requires source-owner review.");
  const forkedItem = reviewQueue.queueItems.find((item) => item.reviewQueueItemId === "source-review-button-forked-exception");
  assert.equal(forkedItem.requiredSourceRefs.includes(SC_EXCEPTION_POLICY_SOURCE_REF), true);
  const ambiguousItem = reviewQueue.queueItems.find((item) => item.reviewQueueItemId === "source-review-source-mapping-ambiguous");
  assert.equal(ambiguousItem.requiredSourceRefs.includes(SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF), true);
  assert.deepEqual(reviewQueue.diagnostics.map((diagnostic) => diagnostic.code), [
    "SOURCE_FORKED_VARIANT_REVIEW_REQUIRED",
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
  const forkedRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/review/button-forked-exception.source-conformance.json"
  );
  assert.equal(forkedRow.actualResult, "review_required");
  assert.equal(forkedRow.reviewQueueItemId, "source-review-button-forked-exception");
  assert.deepEqual(forkedRow.diagnosticCodes, ["SOURCE_FORKED_VARIANT_REVIEW_REQUIRED"]);
  assert.equal(forkedRow.requiredSourceRefs.includes(SC_EXCEPTION_POLICY_SOURCE_REF), true);
  assert.equal(forkedRow.requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);
  assert.deepEqual(forkedRow.exception, {
    exceptionType: "forked-button-variant",
    governanceState: "declared-exception",
    policyRef: SC_EXCEPTION_POLICY_SOURCE_REF,
    variantSourceRef: "declared-source://source-conformance/components/button-forked-variant.json#/"
  });
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
  assert.equal(ambiguousRow.authorityConflict.conflictingRefs.length >= 2, true);
  assert.equal(ambiguousRow.authorityConflict.conflictingRefs.every((sourceRef) =>
    sourceRef.startsWith("declared-source://source-conformance/components/button")
  ), true);
  assert.equal(ambiguousRow.authorityConflict.conflictingRefs.every((sourceRef) =>
    ambiguousRow.requiredSourceRefs.includes(sourceRef)
  ), true);
  const ambiguousDiagnostic = reviewQueue.diagnostics.find((diagnostic) => diagnostic.code === "SOURCE_MAPPING_AMBIGUOUS");
  assert.match(ambiguousDiagnostic.suggestedAction, /Route the ambiguous source mapping to non-executable review/);
  assert.equal(validate(reviewQueue), true);
  assert.equal(validate({
    ...reviewQueue,
    queueItems: reviewQueue.queueItems.map((item) => ({ ...item, expiresAt: "1970-01-31T00:00:00Z" }))
  }), false);
});

test("source conformance proof routes declared fork exceptions and blocks undocumented fork drift", async () => {
  await runSourceConformanceProof();
  const evidence = await readJson("artifacts/source-conformance/evidence.json");
  const authorityMap = await readJson("artifacts/source-conformance/source-authority-map.json");

  const forkedReviewRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/review/button-forked-exception.source-conformance.json"
  );
  assert.equal(forkedReviewRow.actualResult, "review_required");
  assert.equal(forkedReviewRow.promotionStatus, "review_required");
  assert.deepEqual(forkedReviewRow.diagnosticCodes, ["SOURCE_FORKED_VARIANT_REVIEW_REQUIRED"]);
  assert.equal(forkedReviewRow.exception.policyRef, SC_EXCEPTION_POLICY_SOURCE_REF);
  assert.equal(forkedReviewRow.requiredSourceRefs.includes("declared-source://source-conformance/components/button-forked-variant.json#/"), true);
  assert.equal(forkedReviewRow.requiredSourceRefs.includes(SC_EXCEPTION_POLICY_SOURCE_REF), true);
  assert.equal(forkedReviewRow.requiredSourceRefs.includes(SC_REVIEW_POLICY_SOURCE_REF), true);

  const undocumentedDriftRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/invalid/button-undocumented-fork-drift.source-conformance.json"
  );
  assert.equal(undocumentedDriftRow.actualResult, "invalid");
  assert.equal(undocumentedDriftRow.promotionStatus, "blocked");
  assert.deepEqual(undocumentedDriftRow.diagnosticCodes, ["SOURCE_EXCEPTION_UNDECLARED"]);
  assert.equal(undocumentedDriftRow.reviewQueueItemId, null);

  const missingExceptionRow = evidence.validationResults.find((row) =>
    row.fixturePath === "fixtures/source-conformance/invalid/button-forked-exception-missing.source-conformance.json"
  );
  assert.equal(missingExceptionRow.actualResult, "invalid");
  assert.equal(missingExceptionRow.promotionStatus, "blocked");
  assert.deepEqual(missingExceptionRow.diagnosticCodes, ["SOURCE_EXCEPTION_METADATA_MISSING"]);
  assert.equal(missingExceptionRow.exception, null);
  assert.equal(missingExceptionRow.requiredSourceRefs.includes("declared-source://source-conformance/components/button-forked-variant.json#/"), true);
  assert.equal(missingExceptionRow.reviewQueueItemId, null);

  const buttonAuthority = authorityMap.componentAuthority.find((row) => row.componentId === "Button");
  assert.equal(buttonAuthority.additionalDeclaredSourceRefs.includes("declared-source://source-conformance/components/button-forked-variant.json#/"), true);
  const exceptionPolicy = authorityMap.policyAuthority.find((row) => row.policyId === "exception-policy");
  assert.equal(exceptionPolicy.sourceRef, SC_EXCEPTION_POLICY_SOURCE_REF);

  const fixturePath = path.join(root, "fixtures/source-conformance/review/button-forked-exception.source-conformance.json");
  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredSourceRefs = fixture.requiredSourceRefs.filter((sourceRef) =>
      sourceRef !== SC_EXCEPTION_POLICY_SOURCE_REF
    );
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_EXCEPTION_UNDECLARED/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.exception.policyRef = null;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_EXCEPTION_UNDECLARED/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.exception.variantSourceRef = "declared-source://source-conformance/components/button-acquired-a.json#/";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_EXCEPTION_UNDECLARED/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.exception = null;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_EXCEPTION_METADATA_MISSING/);
  });

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
    assert.match(result.stderr, /schema validation failed/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.resolvedBy = "declared-source://source-conformance/policies/source-precedence.json#/";
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredSourceRefs = fixture.requiredSourceRefs.filter((sourceRef) =>
      sourceRef !== "declared-source://source-conformance/components/button-acquired-a.json#/"
    );
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredSourceRefs = fixture.requiredSourceRefs.filter((sourceRef) =>
      sourceRef !== SC_SOURCE_PRECEDENCE_POLICY_SOURCE_REF
    );
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.conflictingRefs = [
      "declared-source://source-conformance/components/button.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.conflictingRefs = [
      "declared-source://source-conformance/components/button-acquired-a.json#/",
      "declared-source://source-conformance/components/button-acquired-b.json#/"
    ];
    fixture.requiredSourceRefs = [
      ...fixture.requiredSourceRefs,
      "declared-source://source-conformance/components/button-acquired-b.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.conflictingRefs = [
      "declared-source://source-conformance/components/button.json#/",
      "declared-source://source-conformance/components/in-line-alert.json#/"
    ];
    fixture.requiredSourceRefs = [
      ...fixture.requiredSourceRefs,
      "declared-source://source-conformance/components/in-line-alert.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.authorityConflict.conflictingRefs = [
      "declared-source://source-conformance/components/button.json#/",
      "declared-source://source-conformance/policies/accessibility.json#/"
    ];
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    delete fixture.authorityConflict.resolvedBy;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    delete fixture.authorityConflict.selectedSourceRef;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
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
    "declared-source://source-conformance/components/button-acquired-b.json#/",
    "declared-source://source-conformance/components/button-forked-variant.json#/"
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

  await withJsonFileMutation(fixturePath, (fixture) => {
    fixture.requiredSourceRefs = fixture.requiredSourceRefs.filter((sourceRef) =>
      sourceRef !== "declared-source://source-conformance/components/button-acquired-b.json#/"
    );
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SOURCE_AUTHORITY_CONFLICT/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    delete fixture.authorityConflict.resolvedBy;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });

  await withJsonFileMutation(fixturePath, (fixture) => {
    delete fixture.authorityConflict.selectedSourceRef;
  }, async () => {
    const result = await runSourceConformanceProofExpectFailure();
    assert.equal(result.code, 1);
    assert.match(result.stderr, /schema validation failed/);
  });
});

test("source conformance materialization preserves checked source authority bytes", async () => {
  const sourceRoot = path.join(root, "sources/source-conformance/declared-source-bundle");
  const before = await snapshotTree(sourceRoot);
  await execFileAsync(process.execPath, ["scripts/materialize-source-conformance.mjs"], { cwd: root });
  const after = await snapshotTree(sourceRoot);
  assert.deepEqual(after, before);
});

test("source conformance output follows profile ownership changes without implementation edits", async () => {
  await withAuthorityInputMutation(
    "governance/authority-profile.json",
    (profile) => {
      profile.reviewRoutes[0].owner = "spectrum-source-owners";
    },
    async () => {
      await runSourceConformanceProof();
      const queue = await readJson("artifacts/source-conformance/source-review-queue.json");
      const connection = await readJson("artifacts/source-conformance/authority-connection-report.json");
      const profileItem = queue.queueItems.find((item) => item.origin === "authority-profile");
      assert.equal(profileItem.owner, "spectrum-source-owners");
      assert.equal(connection.findings.find((finding) => finding.findingId.startsWith("source-exception-")).owner, "spectrum-source-owners");
    }
  );
});

test("source conformance blocks authoritative source facts that exceed accepted P2", async () => {
  await withAuthorityInputMutation(
    "components/button.json",
    (button) => {
      button.facts.find((fact) => fact.factId === "button-variant-values").value.push("expressive");
    },
    async () => {
      const result = await runSourceConformanceProofExpectFailure();
      assert.equal(result.code, 1);
      assert.match(result.stderr, /SOURCE_FACT_AUTHORITY_ESCALATION/);
    }
  );
});

test("source conformance rejects profile bindings that contradict declared source families", async () => {
  await withAuthorityInputMutation(
    "governance/authority-profile.json",
    (profile) => {
      profile.componentBindings[0].primarySourceRef = "declared-source://source-conformance/components/button-acquired-a.json#/";
    },
    async () => {
      const result = await runSourceConformanceProofExpectFailure();
      assert.equal(result.code, 1);
      assert.match(result.stderr, /outside the primary source family/);
    }
  );
});

test("source conformance artifacts are byte deterministic across repeated proof runs", async () => {
  await runSourceConformanceProof();
  const artifactPaths = [
    "source-inventory.json",
    "source-fact-coverage.json",
    "source-authority-map.json",
    "source-review-queue.json",
    "governed-catalog.json",
    "authority-connection-report.json",
    "source-conformance-report.json",
    "evidence.json"
  ].map((file) => path.join(root, "artifacts/source-conformance", file));
  const first = await Promise.all(artifactPaths.map((file) => fs.readFile(file, "utf8")));
  await runSourceConformanceProof();
  const second = await Promise.all(artifactPaths.map((file) => fs.readFile(file, "utf8")));
  assert.deepEqual(second, first);
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

  const connectionCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(root, {
    ...evidence,
    artifacts: evidence.artifacts.map((entry) =>
      entry.path === "artifacts/source-conformance/authority-connection-report.json"
        ? { ...entry, hash: "0".repeat(64) }
        : entry
    )
  });
  assert.equal(connectionCode, "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH");

  const profileCode = await sourceConformanceInternals.firstEvidenceIntegrityFailureCode(root, {
    ...evidence,
    authorityProfileRef: { ...evidence.authorityProfileRef, hash: "0".repeat(64) }
  });
  assert.equal(profileCode, "SOURCE_CONFORMANCE_EVIDENCE_HASH_MISMATCH");
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

async function withAuthorityInputMutation(sourceRelativePath, mutate, fn) {
  const sourcePath = path.join(root, "sources/source-conformance/declared-source-bundle", sourceRelativePath);
  const manifestPath = path.join(root, "sources/source-conformance/declared-source-bundle/manifest.json");
  const originalSource = await fs.readFile(sourcePath, "utf8");
  const originalManifest = await fs.readFile(manifestPath, "utf8");
  try {
    const source = JSON.parse(originalSource);
    mutate(source);
    const nextSource = canonicalJson(source);
    await fs.writeFile(sourcePath, nextSource);
    const manifest = JSON.parse(originalManifest);
    const manifestEntry = manifest.sourceFiles.find((entry) => entry.path === sourceRelativePath);
    assert.ok(manifestEntry, `missing manifest entry for ${sourceRelativePath}`);
    manifestEntry.sha256 = createHash("sha256").update(nextSource).digest("hex");
    await fs.writeFile(manifestPath, canonicalJson(manifest));
    await fn();
  } finally {
    await fs.writeFile(sourcePath, originalSource);
    await fs.writeFile(manifestPath, originalManifest);
    await runSourceConformanceProof();
  }
}

async function snapshotTree(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const snapshot = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await snapshotTree(absolutePath);
      for (const [relativePath, contents] of Object.entries(nested)) {
        snapshot[`${entry.name}/${relativePath}`] = contents;
      }
    } else if (entry.isFile()) {
      snapshot[entry.name] = await fs.readFile(absolutePath, "utf8");
    }
  }
  return snapshot;
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}
