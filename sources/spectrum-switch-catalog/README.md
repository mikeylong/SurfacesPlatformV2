# Spectrum Switch Catalog Source Boundary

This directory contains the separately reviewed, one-file source addendum for
the non-numbered `spectrum-switch-catalog` proof target. It does not alter the
numbered P2 source bundle or the Checkbox addendum.

The review-time source ceremony downloaded the exact
`@adobe/spectrum-design-data@0.7.0` tarball and independently verified:

- npm SRI: `sha512-mSdmQn6fNEzKVo6W5xS4gO1EXCpC4ojiEm3GqTlSjhh26lC9siMgQSWi33ODvWe8ssfrxXX0unzVnL5VBt4+CA==`
- tarball SHA-256: `12db4dd64e7ad0c0c6cadec7c2f8e24a8d819d1f3badb7d871fbfbfc99ffdff0`
- exact unique tar path: `package/components/switch.json`
- selected byte SHA-256: `f71fca208251775638f52f9b6dfefc19104b17119512f6c3ae491da3c684b512`

`source-addendum.lock.json` is the immutable Switch-specific record of that
ceremony. Ordinary materialization is offline and fail-closed: it verifies the
lock, exact independent one-file package tree, and raw selected byte before it
writes generated schemas, mappings, manifest, or fixtures. It never fetches a
package and never rewrites the P2, Checkbox, or Switch locks.

The target reuses the P2-locked registry and layout-token bytes for the exact
`Switch` registry record and `switch-control-width-medium-desktop` token. Those
files remain owned by P2 and are not duplicated here. Registry and token
mentions establish eligibility only; the selected Switch component byte is the
component authority.
