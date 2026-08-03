# Database

LectureWeave uses **MongoDB** as its single persistence layer (via Motor / PyMongo).
Document retrieval uses **MongoDB Atlas Vector Search**, with an in-memory cosine
similarity fallback when Atlas Vector Search is unavailable.

> A legacy PostgreSQL / SQLAlchemy / FAISS implementation still exists in the
> tree but is **not** used by the active application and is scheduled for
> removal. See [migration-plan.md](migration-plan.md) and [decisions.md](decisions.md).

## Connection

Set `MONGODB_URL`:

- Local: `mongodb://localhost:27017`
- Atlas: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

Connection and data-access helpers live in
`backend/database/mongodb_connection.py` and
`backend/database/subject_functions.py`.

## Collections

| Collection | Main contents |
| --- | --- |
| `users` | `email` (unique), `username`, bcrypt `password`, `created_at`, `last_login` |
| `subjects` | `user_id`, `name`, `code`, `description` |
| `lectures` | `user_id`, `subject_id`, `title`, `status`, `duration`, timestamps |
| `documents` | uploaded-file metadata and extracted source text |
| `document_embeddings` | `lecture_id`, `document_id`, `chunk_text`, `chunk_index`, `embedding` (384-dim) |
| `transcriptions` | per-chunk transcript, `enhanced_notes`, `timestamp`, `importance` |
| `structured_notes` | periodic synthesised Markdown |
| `final_notes` | `lecture_id`, `title`, `markdown`, `sections[]`, `glossary{}`, `key_takeaways[]` |

## Atlas Vector Search index

Create a search index on `document_embeddings` (Atlas UI → cluster → Search →
Create Search Index → JSON Editor):

- **Index name**: `vector_search`
- **Collection**: `document_embeddings`
- **Vector field**: `embedding` — `knnVector`, `384` dimensions, `cosine` similarity

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": { "type": "knnVector", "dimensions": 384, "similarity": "cosine" },
      "lecture_id": { "type": "string" },
      "document_id": { "type": "string" }
    }
  }
}
```

The 384 dimensions correspond to the `all-MiniLM-L6-v2` embedding model. If the
model changes, the dimension count must change to match.

## Retrieval

At query time the backend embeds the transcript text and retrieves the top-k
matching chunks scoped to the current `lecture_id`, joining their `chunk_text`
as RAG context for note generation. If Atlas Vector Search is not available, the
code fetches the lecture's embeddings and computes cosine similarity in memory.

## Local option

For local development you can run MongoDB directly (`mongodb://localhost:27017`).
Atlas Vector Search is a hosted feature; when running purely locally without it,
retrieval uses the in-memory cosine fallback.

## Data safety

Existing data must not be silently destroyed during restructuring. Any schema
change (for example, repairing lectures with `user_id: null`) must go through a
reviewed migration with a backup and a dry run — see [migration-plan.md](migration-plan.md).
The database name is currently fixed; parameterising it via `MONGODB_DATABASE`
is planned so branding can change without a data migration.
