import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { assertCatalogReleaseReceipt, buildPortableProjection } from "../src/catalog-consumer-kernel.js";
import { canonicalArtifactRef } from "../src/proof-runtime.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("catalog release boundary accepts the current governed compiler artifacts", async () => {
  const inputs = await currentBoundaryInputs();
  assert.doesNotThrow(() => assertCatalogReleaseReceipt(inputs));
  const projection = buildPortableProjection({
    ...inputs,
    consumerImplementationHash: "0".repeat(64)
  });
  assert.equal(projection.adapterId, inputs.adapterId);
  assert.deepEqual(projection.receiptRef, inputs.receiptRef);
  assert.deepEqual(projection.catalogRef, inputs.governedCatalogRef);
});

test("catalog release boundary requires complete compiled synchronous validators", async () => {
  const inputs = await currentBoundaryInputs();
  for (const validators of [
    undefined,
    {},
    { receipt: () => true, governedCatalog: inputs.validators.governedCatalog },
    { receipt: async () => true, governedCatalog: inputs.validators.governedCatalog }
  ]) {
    assert.throws(
      () => assertCatalogReleaseReceipt({ ...inputs, validators }),
      (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.path === "/validators/receipt"
    );
  }
});

test("catalog release boundary rejects schema-invalid minimal objects", async () => {
  const inputs = await currentBoundaryInputs();
  const minimalReceipt = { schemaId: "catalog-boundary-receipt.v0" };
  assert.throws(
    () => assertCatalogReleaseReceipt({
      ...inputs,
      receipt: minimalReceipt,
      receiptRef: canonicalArtifactRef(inputs.receiptRef.path, "catalog-boundary-receipt.v0", minimalReceipt)
    }),
    (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.path === "/receipt"
  );

  const minimalCatalog = { schemaId: "runtime-catalog.v0" };
  assert.throws(
    () => assertCatalogReleaseReceipt({
      ...inputs,
      governedCatalog: minimalCatalog,
      governedCatalogRef: canonicalArtifactRef(inputs.governedCatalogRef.path, "runtime-catalog.v0", minimalCatalog)
    }),
    (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.path === "/governedCatalog"
  );
});

test("portable projection cannot relabel a governed catalog with an arbitrary adapter id", async () => {
  const inputs = await currentBoundaryInputs();
  assert.throws(
    () => buildPortableProjection({
      ...inputs,
      adapterId: "arbitrary-adapter",
      consumerImplementationHash: "0".repeat(64)
    }),
    (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.path === "/adapterId"
  );
});

test("catalog release boundary binds adapter, compiler, references, and canonical provenance", async () => {
  const base = await currentBoundaryInputs();
  const cases = [
    ["adapter hash", ({ governedCatalog }) => { governedCatalog.provenance.adapterHash = "0".repeat(64); }, "/governedCatalog/provenance/adapterHash"],
    ["compiler generator", ({ governedCatalog }) => { governedCatalog.provenance.generator.name = "other-kernel"; }, "/governedCatalog/provenance/generator/name"],
    ["canonical source refs", ({ receipt }) => { receipt.provenance.sourceRefs.reverse(); }, "/provenance/sourceRefs"],
    ["identical governed ref", ({ governedCatalogRef }) => { governedCatalogRef.path = "artifacts/design-system-compiler/other/governed-catalog.json"; }, "/governedCatalogRef"]
  ];

  for (const [name, mutate, expectedPath] of cases) {
    const inputs = structuredCloneWithoutValidators(base);
    inputs.validators = base.validators;
    mutate(inputs);
    if (name === "adapter hash" || name === "compiler generator") {
      inputs.governedCatalogRef = canonicalArtifactRef(
        inputs.governedCatalogRef.path,
        "runtime-catalog.v0",
        inputs.governedCatalog
      );
      inputs.receipt.governedCatalogRef = structuredClone(inputs.governedCatalogRef);
    }
    inputs.receiptRef = canonicalArtifactRef(inputs.receiptRef.path, "catalog-boundary-receipt.v0", inputs.receipt);
    assert.throws(
      () => assertCatalogReleaseReceipt(inputs),
      (error) => error.code === "CATALOG_BOUNDARY_INVALID" && error.path === expectedPath,
      name
    );
  }
});

async function currentBoundaryInputs() {
  const report = await readJson("artifacts/design-system-compiler/design-system-compiler-report.json");
  const run = report.adapterRuns[0];
  return {
    adapterId: run.adapterId,
    receipt: await readJson(run.receiptRef.path),
    receiptRef: structuredClone(run.receiptRef),
    governedCatalog: await readJson(run.governedCatalogRef.path),
    governedCatalogRef: structuredClone(run.governedCatalogRef),
    validators: await compileBoundaryValidators()
  };
}

async function compileBoundaryValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const relativePath of [
    "schemas/diagnostics.v0.schema.json",
    "schemas/design-system-compiler-diagnostics.v0.schema.json",
    "schemas/runtime-catalog.v0.schema.json",
    "schemas/catalog-boundary-receipt.v0.schema.json"
  ]) {
    ajv.addSchema(await readJson(relativePath));
  }
  return {
    receipt: ajv.getSchema("https://surfaces.dev/schemas/design-system-compiler/catalog-boundary-receipt.v0.schema.json"),
    governedCatalog: ajv.getSchema("https://surfaces.dev/schemas/p0/runtime-catalog.v0.schema.json")
  };
}

function structuredCloneWithoutValidators(value) {
  const { validators: _validators, ...cloneable } = value;
  return structuredClone(cloneable);
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}
