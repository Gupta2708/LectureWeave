# Citations

Retrieved chunks receive temporary prompt IDs in order (`C1`, `C2`, and so on).
Only those IDs are accepted in generated content. The citation validator removes
unknown tags and stores the durable source metadata: chunk ID, excerpt, and its
page, slide, or transcript range.

If a model omits tags, LectureWeave attaches a lexical nearest-source citation
with `mode: "auto"`. The client displays these separately in the citation
drawer so readers can distinguish generated tags from automatic matches.

Prompt IDs are request-local. API consumers should use `chunk_id` as the stable
source identity and always enforce access through the parent lecture ownership.
