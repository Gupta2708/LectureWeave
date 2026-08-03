# Assets

This directory holds intentionally-retained project assets: sample course
material safe to distribute, and fixtures used by document-processing tests.

It does **not** hold application runtime data. User uploads live under
`backend/storage/uploads/` and are gitignored.

## Manifest

For every retained asset, record: filename, original location, purpose (sample /
fixture / application asset), licensing or ownership status if known, and whether
it contains synthetic or real data.

| Filename | Original location | Purpose | Licensing / ownership | Real or synthetic |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |

## Status

No assets have been classified into this directory yet. The repository currently
contains committed runtime uploads under `backend/storage/uploads/` (machine-
learning lecture PDFs). These are pending classification during the asset
step of the [migration plan](../docs/migration-plan.md):

- **Keep as sample/fixture** → move a small, license-safe subset here or to
  `backend/tests/fixtures/documents/` (one file per supported format:
  PDF, PPTX, DOCX, TXT), de-duplicated and with user-specific identifiers
  removed.
- **Runtime data** → remove from the repository (a backup and inventory are made
  first); it should not ship with source.
- **Private / unclear licensing** → move out of the repository and flag for
  manual review.

Until that classification is done, no sample material is published here.
