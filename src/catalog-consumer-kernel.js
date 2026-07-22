import { canonicalJson, NORMALIZED_TIMESTAMP, sha256Hex } from "./proof-runtime.js";
import { collectSourceRefs, findCatalogAuthorityEscalation } from "./catalog-authority.js";
import { firstCatalogReleaseFailure } from "./catalog-release-boundary.js";

export const CATALOG_CONSUMER = Object.freeze({
  name: "surfaces-portable-catalog-consumer",
  version: "0.0.0",
  adapter: "web-static-portable"
});

const MESSAGES = Object.freeze({
  CATALOG_BOUNDARY_INVALID: "The catalog boundary receipt is missing, stale, nonpassing, or hash-drifted.",
  CONSUMER_UNKNOWN_COMPONENT: "The consumer fixture references a component absent from the governed catalog.",
  CONSUMER_UNKNOWN_MEMBER: "The consumer fixture references component authority absent from the governed catalog.",
  CONSUMER_INVALID_VALUE: "The consumer fixture supplies a value outside the governed catalog contract.",
  CONSUMER_SOURCE_REF_UNRESOLVED: "The consumer fixture source reference is outside the governed catalog closure.",
  CONSUMER_CONSTRAINT_VIOLATION: "The consumer fixture violates a governed component, variant, or state constraint.",
  CONSUMER_REVIEW_REQUIRED: "The requested catalog promotion remains owner-review required."
});

export class CatalogConsumerError extends Error {
  constructor(code, details = {}) {
    super(MESSAGES[code] || code);
    this.name = "CatalogConsumerError";
    this.code = code;
    this.path = details.path || "/";
    this.sourceRef = details.sourceRef ?? null;
    this.stage = details.stage || "consumer";
  }
}

export function assertCatalogBoundary({ adapterId, receipt, receiptRef, governedCatalog, governedCatalogRef, validators }) {
  const failurePath = firstCatalogReleaseFailure({
    adapterId,
    receipt,
    receiptRef,
    governedCatalog,
    governedCatalogRef,
    validators
  });
  if (failurePath !== null) {
    throw new CatalogConsumerError("CATALOG_BOUNDARY_INVALID", {
      stage: "catalog-boundary",
      path: failurePath,
      sourceRef: receipt?.governedCatalogRef?.path || null
    });
  }
}

export const assertCatalogReleaseReceipt = assertCatalogBoundary;

export function buildPortableProjection({
  adapterId,
  receipt,
  receiptRef,
  governedCatalogRef,
  governedCatalog,
  validators,
  consumerImplementationHash
}) {
  assertCatalogBoundary({
    adapterId,
    receipt,
    receiptRef,
    governedCatalog,
    governedCatalogRef,
    validators
  });
  const projection = {
    schemaId: "catalog-runtime-projection.v0",
    version: "0.0.0",
    adapter: CATALOG_CONSUMER.adapter,
    adapterId,
    receiptRef: structuredClone(receiptRef),
    catalogRef: structuredClone(governedCatalogRef),
    components: structuredClone(governedCatalog.components),
    tokens: structuredClone(governedCatalog.tokens),
    runtimeCapabilities: structuredClone(governedCatalog.runtimeCapabilities),
    governance: structuredClone(governedCatalog.governance),
    diagnostics: [],
    provenance: {
      sourceUri: governedCatalogRef.path,
      sourceHash: governedCatalogRef.hash,
      generator: { ...CATALOG_CONSUMER },
      implementationHash: consumerImplementationHash,
      generatedAt: NORMALIZED_TIMESTAMP,
      host: null
    }
  };
  const escalation = findCatalogAuthorityEscalation(projection, governedCatalog);
  if (escalation) {
    throw new CatalogConsumerError("CONSUMER_UNKNOWN_MEMBER", {
      path: escalation,
      sourceRef: governedCatalogRef.path
    });
  }
  return projection;
}

export function evaluateConsumerFixture({ fixture, fixturePath, projection }) {
  if (!collectSourceRefs(projection).has(fixture.sourceRef)) {
    return blockedResult(diagnostic({
      code: "CONSUMER_SOURCE_REF_UNRESOLVED",
      path: "/sourceRef",
      sourceRef: fixture.sourceRef,
      artifactPath: fixturePath
    }));
  }
  const component = projection.components[fixture.component];
  if (!component) {
    return blockedResult(diagnostic({
      code: "CONSUMER_UNKNOWN_COMPONENT",
      path: "/component",
      sourceRef: fixture.sourceRef,
      artifactPath: fixturePath
    }));
  }

  for (const propId of Object.keys(fixture.props).sort()) {
    const prop = component.props?.[propId];
    if (!prop) {
      return blockedResult(diagnostic({
        code: "CONSUMER_UNKNOWN_MEMBER",
        path: `/props/${escapePointer(propId)}`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
    if (!validPropValue(prop, fixture.props[propId])) {
      return blockedResult(diagnostic({
        code: "CONSUMER_INVALID_VALUE",
        path: `/props/${escapePointer(propId)}`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
  }

  for (const [propId, prop] of Object.entries(component.props || {})) {
    if (prop.required === true && !Object.prototype.hasOwnProperty.call(fixture.props, propId)) {
      return blockedResult(diagnostic({
        code: "CONSUMER_INVALID_VALUE",
        path: `/props/${escapePointer(propId)}`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
  }

  for (const [variantId, value] of Object.entries(fixture.variants)) {
    const variant = component.variants?.[variantId];
    if (!variant || !variant.allowedValues.includes(value)) {
      return blockedResult(diagnostic({
        code: variant ? "CONSUMER_INVALID_VALUE" : "CONSUMER_UNKNOWN_MEMBER",
        path: `/variants/${escapePointer(variantId)}`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
    if (Object.prototype.hasOwnProperty.call(component.props || {}, variantId) &&
        Object.prototype.hasOwnProperty.call(fixture.props, variantId) &&
        canonicalJson(fixture.props[variantId]) !== canonicalJson(value)) {
      return blockedResult(diagnostic({
        code: "CONSUMER_CONSTRAINT_VIOLATION",
        path: `/variants/${escapePointer(variantId)}`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
    for (const requiredProp of variant.requiredProps || []) {
      if (!Object.prototype.hasOwnProperty.call(fixture.props, requiredProp)) {
        return blockedResult(diagnostic({
          code: "CONSUMER_CONSTRAINT_VIOLATION",
          path: `/variants/${escapePointer(variantId)}/requiredProps/${escapePointer(requiredProp)}`,
          sourceRef: fixture.sourceRef,
          artifactPath: fixturePath
        }));
      }
    }
    if ((variant.stateConstraints || []).length > 0 && !variant.stateConstraints.includes(fixture.state)) {
      return blockedResult(diagnostic({
        code: "CONSUMER_CONSTRAINT_VIOLATION",
        path: `/variants/${escapePointer(variantId)}/stateConstraints`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
  }

  if (fixture.state !== null) {
    const state = component.states?.[fixture.state];
    if (!state) {
      return blockedResult(diagnostic({
        code: "CONSUMER_UNKNOWN_MEMBER",
        path: "/state",
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
    const disallowedProp = Object.keys(fixture.props).sort().find((propId) => !state.allowedProps.includes(propId));
    if (disallowedProp) {
      return blockedResult(diagnostic({
        code: "CONSUMER_CONSTRAINT_VIOLATION",
        path: `/state/allowedProps/${escapePointer(disallowedProp)}`,
        sourceRef: fixture.sourceRef,
        artifactPath: fixturePath
      }));
    }
  }

  if (fixture.intent === "promote" && projection.governance.promotionStatus !== "allowed") {
    const reviewDiagnostic = diagnostic({
      code: "CONSUMER_REVIEW_REQUIRED",
      path: "/intent",
      sourceRef: fixture.sourceRef,
      artifactPath: fixturePath,
      review: true
    });
    return {
      outcome: "review_required",
      renderable: false,
      diagnostics: [reviewDiagnostic]
    };
  }

  return { outcome: "allowed", renderable: true, diagnostics: [] };
}

export function buildPortableRenderPlan({ adapterId, fixture, fixturePath, projectionRef, projection }) {
  const component = projection.components[fixture.component];
  const props = {};
  for (const [propId, prop] of Object.entries(component.props || {})) {
    if (Object.prototype.hasOwnProperty.call(fixture.props, propId)) props[propId] = fixture.props[propId];
    else if (Object.prototype.hasOwnProperty.call(prop, "default")) props[propId] = prop.default;
  }
  return {
    schemaId: "catalog-render-plan.v0",
    version: "0.0.0",
    adapter: CATALOG_CONSUMER.adapter,
    adapterId,
    fixtureRef: {
      path: fixturePath,
      schemaId: "catalog-consumer-fixture.v0",
      hashAlgorithm: "sha256",
      hash: sha256Hex(canonicalJson(fixture))
    },
    projectionRef: structuredClone(projectionRef),
    promotionStatus: "allowed",
    tree: {
      component: fixture.component,
      props,
      variants: structuredClone(fixture.variants),
      state: fixture.state,
      role: component.accessibility?.role || null,
      sourceRef: component.sourceRef
    },
    sideEffects: [],
    executed: false,
    diagnostics: [],
    provenance: {
      sourceUri: fixturePath,
      sourceHash: sha256Hex(canonicalJson(fixture)),
      sourceRef: fixture.sourceRef,
      generator: { ...CATALOG_CONSUMER },
      generatedAt: NORMALIZED_TIMESTAMP,
      host: null
    }
  };
}

export function diagnosticFromConsumerError(error, artifactPath) {
  const known = error instanceof CatalogConsumerError;
  return diagnostic({
    code: known ? error.code : "CATALOG_BOUNDARY_INVALID",
    path: known ? error.path : "/",
    sourceRef: known ? error.sourceRef : null,
    artifactPath
  });
}

function validPropValue(prop, value) {
  if (prop.type === "string" && typeof value !== "string") return false;
  if (prop.type === "boolean" && typeof value !== "boolean") return false;
  if (prop.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) return false;
  if (Array.isArray(prop.allowedValues) && prop.allowedValues.length > 0 &&
      !prop.allowedValues.some((allowed) => canonicalJson(allowed) === canonicalJson(value))) return false;
  if (typeof value === "string" && prop.allowMarkup === false && /<[^>]+>/.test(value)) return false;
  if (typeof value === "string" && Number.isInteger(prop.minLength) && value.length < prop.minLength) return false;
  if (typeof value === "string" && Number.isInteger(prop.maxLength) && value.length > prop.maxLength) return false;
  return true;
}

function blockedResult(blockedDiagnostic) {
  return { outcome: "blocked", renderable: false, diagnostics: [blockedDiagnostic] };
}

function diagnostic({ code, path, sourceRef, artifactPath, review = false }) {
  return {
    code,
    severity: review ? "review" : "error",
    message: MESSAGES[code],
    stage: code === "CATALOG_BOUNDARY_INVALID" ? "catalog-boundary" : "consumer",
    path,
    sourceRef,
    artifactPath,
    promotionStatus: review ? "review_required" : "blocked",
    suggestedAction: review
      ? "Preserve owner review and do not emit a promoted render plan."
      : "Reject the request without rendering, executing actions, or producing side effects."
  };
}

function escapePointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}
