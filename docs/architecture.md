# Architecture

LectureWeave is a React 18/Vite client backed by FastAPI (`app.main:app`) and
MongoDB. It records browser WAV chunks, transcribes them with Faster Whisper,
retrieves owned course material, and creates grounded notes through Groq.

```text
React client --HTTP/WebSocket--> FastAPI
                                  |-- Faster Whisper
                                  |-- Sentence Transformers
                                  |-- MongoDB + $text / vector fallback
                                  `-- Groq synthesis
```

## Processing flow

1. A learner creates an owned subject and lecture, optionally uploading reference documents.
2. Documents are structure-chunked with page/slide/heading metadata and embedded.
3. Audio chunks enter a per-lecture queue. The client receives `job_status`,
   transcript, structured-note, and final-note WebSocket messages.
4. Hybrid retrieval applies an ownership-derived lecture filter before vector and
   keyword recall. Reciprocal Rank Fusion combines the two lists.
5. Synthesis receives stable source IDs (`[C1]`, `[C2]`). Stored notes retain
   validated citations; the UI opens their source excerpt.

## Learning features

- Editable, timestamped transcript segments and author markers.
- Topic segmentation from overlapping transcript embedding windows.
- Subject-scoped grounded chat, flashcards, and quizzes. These decline or omit
  output when course material cannot support it.

## Deployment boundary

Processing queues and active WebSockets are process-local. Railway must run one
backend replica; horizontal scaling requires shared queue/session state.
