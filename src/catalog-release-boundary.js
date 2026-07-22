import { canonicalJson, sha256Hex } from "./proof-runtime.js";

export const CATALOG_RELEASE_BOUNDARY = Object.freeze({
  name: "surfaces-catalog-release-boundary",
  version: "0.0.0"
});

export const CATALOG_RELEASE_INVALID = "CATALOG_BOUNDARY_INVALID";

const RECEIPT_SCHEMA_ID = "https://surfaces.dev/schemas/design-system-compiler/catalog-boundary-receipt.v0.schema.json";
const RUNTIME_CATALOG_SCHEMA_ID = "https://surfaces.dev/schemas/p0/runtime-catalog.v0.schema.json";

export function firstCatalogReleaseFailure({
  adapterId,
  receipt,
  receiptRef,
  governedCatalog,
  governedCatalogRef,
  validators
}) {
  const receiptValidationFailure = firstSynchronousValidationFailure(
    validators?.receipt,
    RECEIPT_SCHEMA_ID,
    receipt,
    "/validators/receipt",
    "/receipt"
  );
  if (receiptValidationFailure !== null) return receiptValidationFailure;

  const catalogValidationFailure = firstSynchronousValidationFailure(
    validators?.governedCatalog,
    RUNTIME_CATALOG_SCHEMA_ID,
    governedCatalog,
    "/validators/governedCatalog",
    "/governedCatalog"
  );
  if (catalogValidationFailure !== null) return catalogValidationFailure;

  if (typeof adapterId !== "string" || adapterId !== receipt.adapterId) return "/adapterId";
  if (receipt.status !== "pass") return "/status";
  if (receipt.promotionStatus !== "review_required") return "/promotionStatus";

  const receiptRefFailure = firstRefFailure(receiptRef, "/receiptRef", "catalog-boundary-receipt.v0");
  if (receiptRefFailure !== null) return receiptRefFailure;
  if (!canonicalHashMatches(receiptRef.hash, receipt)) return "/receiptRef/hash";

  for (const [field, schemaId] of [
    ["sourceLockRef", "portable-design-source-lock.v0"],
    ["adapterRef", "design-system-adapter.v0"],
    ["extractRef", "extract.v0"],
    ["catalogRef", "runtime-catalog.v0"]
  ]) {
    const failure = firstRefFailure(receipt[field], `/${field}`, schemaId);
    if (failure !== null) return failure;
  }

  const embeddedCatalogRefFailure = firstRefFailure(receipt.governedCatalogRef, "/governedCatalogRef", "runtime-catalog.v0");
  if (embeddedCatalogRefFailure !== null) return embeddedCatalogRefFailure;
  const suppliedCatalogRefFailure = firstRefFailure(governedCatalogRef, "/suppliedGovernedCatalogRef", "runtime-catalog.v0");
  if (suppliedCatalogRefFailure !== null) return suppliedCatalogRefFailure;

  if (governedCatalog.artifactKind !== "governed-catalog") return "/governedCatalog/artifactKind";
  if (governedCatalog.provenance?.adapterId !== adapterId) return "/governedCatalog/provenance/adapterId";
  if (governedCatalog.provenance?.adapterHash !== receipt.adapterRef.hash) return "/governedCatalog/provenance/adapterHash";
  if (governedCatalog.provenance?.generator?.name !== receipt.compiler.name) return "/governedCatalog/provenance/generator/name";
  if (governedCatalog.provenance?.generator?.version !== receipt.compiler.version) return "/governedCatalog/provenance/generator/version";
  if (governedCatalog.governance?.promotionStatus !== receipt.promotionStatus) return "/promotionStatus";
  if (canonicalJson(receipt.governedCatalogRef) !== canonicalJson(governedCatalogRef)) return "/governedCatalogRef";
  if (!canonicalHashMatches(governedCatalogRef.hash, governedCatalog)) return "/governedCatalogRef/hash";

  const expectedSourceRefs = [
    receipt.sourceLockRef.path,
    receipt.adapterRef.path,
    receipt.extractRef.path,
    receipt.governedCatalogRef.path
  ].sort();
  if (canonicalJson(receipt.provenance.sourceRefs) !== canonicalJson(expectedSourceRefs)) {
    return "/provenance/sourceRefs";
  }
  return null;
}

function firstSynchronousValidationFailure(validator, expectedSchemaId, value, validatorPointer, valuePointer) {
  if (typeof validator !== "function" || validator.schema?.$id !== expectedSchemaId) return validatorPointer;
  try {
    const valid = validator(value);
    if (valid && typeof valid.then === "function") return validatorPointer;
    return valid === true ? null : valuePointer;
  } catch {
    return valuePointer;
  }
}

function firstRefFailure(ref, pointer, schemaId) {
  if (!ref || typeof ref !== "object" || Array.isArray(ref)) return pointer;
  if (!isRelativePosixPath(ref.path)) return `${pointer}/path`;
  if (ref.schemaId !== schemaId) return `${pointer}/schemaId`;
  if (ref.hashAlgorithm !== "sha256") return `${pointer}/hashAlgorithm`;
  if (typeof ref.hash !== "string" || !/^[a-f0-9]{64}$/.test(ref.hash)) return `${pointer}/hash`;
  return null;
}

function canonicalHashMatches(expectedHash, value) {
  try {
    return expectedHash === sha256Hex(canonicalJson(value));
  } catch {
    return false;
  }
}

function isRelativePosixPath(value) {
  return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.includes("\\") &&
    value.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}
