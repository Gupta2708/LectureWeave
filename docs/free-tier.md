# Free-tier operating guide

MongoDB M0 and a single small Railway service work well for demos and small
classes, provided workloads remain bounded. Retrieval is intentionally scoped
to one owned lecture and the M0-safe vector fallback is best kept to a few
thousand chunks per lecture.

Use short, structure-aware chunks (the defaults are 1,200 characters with 150
characters of overlap), cap document size at the upload boundary, and avoid
processing many long recordings simultaneously. One backend replica is required
today because recording queues and WebSocket state are in memory.

For a rough storage budget, a 384-dimension float embedding plus MongoDB
metadata commonly consumes several kilobytes per chunk. A lecture with 1,000
chunks can therefore consume several megabytes before original uploads. Track
database use in Atlas and archive or remove course material deliberately; this
is an estimate, not a quota guarantee.

Keep `RETRIEVAL_FINAL_LIMIT`, `CHAT_MAX_CONTEXT_CHUNKS`, flashcard and quiz
counts modest. These limits control embedding, database, and LLM spend without
reducing ownership or citation checks.
