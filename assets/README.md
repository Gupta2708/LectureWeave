# Assets

This directory holds intentionally-retained project assets: sample course
material safe to distribute, and fixtures used by document-processing tests.

It does **not** hold application runtime data. User uploads live under
`backend/storage/uploads/` and are gitignored (`.gitkeep` only, empty on disk).

## Current status

No sample assets or test fixtures are currently checked in. Historical runtime
uploads (machine-learning lecture PDFs) that used to live under
`backend/storage/uploads/` are **not present** in this repository — the current
`main` branch's base commit only contained empty `.gitkeep` placeholders — and
the `.gitignore` prevents any future user upload from being committed.

## Adding an asset

Before adding a file here, confirm:

- It is legally safe to redistribute (or synthesised for LectureWeave).
- It contains no personal or private user information.
- It is genuinely useful as a sample or as a document-processing fixture — one
  small file per supported format (PDF, PPTX, DOCX, TXT) is sufficient.

Test fixtures used only by automated tests belong under
`backend/tests/fixtures/documents/`, not here.

## Manifest

For every retained asset, record: filename, original location, new location,
purpose (sample / fixture), licensing or ownership status, and whether it
contains synthetic or real data. If ownership is unclear, do not commit the
file — leave it out for manual review instead.

| Filename | Original location | New location | Purpose | Licensing / ownership | Real or synthetic |
| --- | --- | --- | --- | --- | --- |
| _(none)_ | | | | | |
