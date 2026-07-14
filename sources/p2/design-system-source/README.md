# P2 Spectrum Source Bundle

This directory contains the local, manifest-declared P2 source bundle for the deterministic ingestion proof. Proof authority still lives in `artifacts/p2/evidence.json`; source files here are bounded proof inputs, not runtime state or a live connector.

The selected pilot target is Adobe Spectrum Design Data:

- npm package: `@adobe/spectrum-design-data`
- version: `0.7.0`
- tarball: `https://registry.npmjs.org/@adobe/spectrum-design-data/-/spectrum-design-data-0.7.0.tgz`
- npm integrity: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`
- tarball SHA-256: `12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0`
- first components: `button`, `in-line-alert`

The source snapshot root is:

```text
sources/p2/design-system-source/npm/@adobe/spectrum-design-data/0.7.0/package/
```

`package-snapshot.lock.json` is the review-controlled package-byte trust anchor. It pins the npm identity, SRI, tarball SHA-256, ordered 31-file package inventory, and per-file SHA-256 hashes established during a separate review-time tarball verification. Materialization compares the exact local package-file set and bytes to this lock before writing anything; it never fetches the tarball or creates or refreshes the lock. Passing proof therefore establishes local lock conformance, not the external download ceremony.

`manifest.json` declares the component files, token files, registry files, mode/field files, mapping files, and policy refs named in `plans/p2/source-strategy.md`, with per-file SHA-256 hashes. Its `packageSnapshotLock` reference binds the manifest to the exact raw lock bytes.

`manifest.template.json` remains a non-proof template for path and ref review. The proof command consumes `manifest.json` and the declared local files only; it does not fetch npm, call source APIs, crawl docs, or expand beyond the declared `button` and `in-line-alert` subset.
