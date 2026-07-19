# Spectrum Checkbox Catalog Source Boundary

This directory contains the separately reviewed source addendum for the
`spectrum-checkbox-catalog` proof target. It does not modify or broaden the
numbered P2 snapshot lock.

At review time, the exact `@adobe/spectrum-design-data@0.7.0` tarball was
checked against both the npm SHA-512 integrity value and tarball SHA-256
already recorded by P2. The raw `package/components/checkbox.json` byte was
then selected and hashed into `source-addendum.lock.json`.

Verified values:

- tarball SHA-256: `12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0`
- npm SHA-512 payload: `mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`
- `components/checkbox.json` raw SHA-256: `8476863b7164c8cf6a5e8ea0b274b6a706fb9ec20e401e212373129fb5bce488`

Ordinary materialization is offline and fail-closed. It verifies the one-file
package tree against the immutable addendum lock before generating companion
schemas, manifest, mappings, fixtures, or artifacts. It never fetches the
tarball and never rewrites the lock or selected source byte.

The target also consumes the already accepted P2 registry and
`layout-component.tokens.json` bytes through passing P2 evidence. Those bytes
remain owned by the P2 boundary and are not duplicated here.
