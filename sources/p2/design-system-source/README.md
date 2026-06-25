# P2 Spectrum Source Bundle

This directory contains the local, manifest-declared P2 source bundle for the deterministic ingestion proof. Proof authority still lives in `artifacts/p2/evidence.json`; source files here are bounded proof inputs, not runtime state or a live connector.

The selected pilot target is Adobe Spectrum Design Data:

- npm package: `@adobe/spectrum-design-data`
- version: `0.7.0`
- tarball: `https://registry.npmjs.org/@adobe/spectrum-design-data/-/spectrum-design-data-0.7.0.tgz`
- npm integrity: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`
- first components: `button`, `in-line-alert`

The source snapshot root is:

```text
sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/
```

`manifest.json` declares the component files, token files, registry files, mode/field files, mapping files, and policy refs named in `plans/p2/source-strategy.md`, with per-file SHA-256 hashes.

`manifest.template.json` remains a non-proof template for path and ref review. The proof command consumes `manifest.json` and the declared local files only; it does not fetch npm, call source APIs, crawl docs, or expand beyond the declared `button` and `in-line-alert` subset.
