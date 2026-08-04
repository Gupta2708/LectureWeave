"""
Audio processing orchestrator.

Per-lecture in-memory queues + background task that:
  1. transcribes each 20-second WAV chunk (Faster Whisper),
  2. retrieves document context (Atlas Vector Search),
  3. generates enhanced chunk notes,
  4. periodically synthesises structured notes,
  5. on stop, generates the final comprehensive notes.

State (queues, transcription buffers, task handles) is process-local, matching
the current single-instance deployment. Horizontal scaling would require moving
this to shared storage — tracked in docs/migration-plan.md.
"""
from __future__ import annotations

import asyncio
import logging
import tempfile
import time
from collections import defaultdict
from pathlib import Path
from typing import Dict

from fastapi import UploadFile, WebSocket

from app.core.config import settings
from app.services.transcribe_whisper import transcribe_local
from app.services.retrieval import retrieve
from app.services.agentic_synthesizer import (
    synthesize_structured_notes,
    detect_topic_shift,
)
from app.services.importance_scorer import score_importance
from app.services.rag_generator import generate_raw_notes
from app.services.final_synthesizer import synthesize_final_notes
from app.services.synthesis.citations import attach_auto_citations, citation_sources, validate_citations

from database.mongodb_connection import (
    save_transcription,
    save_structured_notes,
    save_final_notes,
    get_lecture_template,
    get_db,
)

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Handles optimized audio processing with agentic synthesis."""

    def __init__(self) -> None:
        self.temp_dir = Path(tempfile.gettempdir()) / "lectureweave_audio"
        self.temp_dir.mkdir(exist_ok=True)

        # Per-lecture buffers and state
        self.transcription_buffers = defaultdict(list)
        self.last_synthesis_time = defaultdict(float)
        self.structured_notes_history = defaultdict(list)
        self.lecture_users: Dict[str, str] = {}
        self.lecture_templates: Dict[str, str] = {}

        # Processing queues + background tasks
        self.audio_queues: Dict[str, asyncio.Queue] = defaultdict(asyncio.Queue)
        self.processing_tasks: Dict[str, asyncio.Task] = {}

        logger.info("Audio processor initialised")

    async def process_audio_chunk(
        self, lecture_id: str, audio_file: UploadFile, websocket: WebSocket, user_id: str
    ) -> dict:
        """Save a chunk to disk and queue it for background processing."""
        try:
            timestamp = int(time.time() * 1000)
            filename = f"chunk_{lecture_id}_{timestamp}.wav"
            file_path = self.temp_dir / filename

            content = await audio_file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            file_size = len(content)
            logger.info("Received audio chunk for %s: %d bytes", lecture_id, file_size)

            self.lecture_users[lecture_id] = user_id
            await self.audio_queues[lecture_id].put(
                {"file_path": file_path, "timestamp": timestamp, "websocket": websocket}
            )
            queue_size = self.audio_queues[lecture_id].qsize()

            return {"status": "queued", "size": file_size, "queue_size": queue_size}

        except Exception as e:
            logger.error("Error receiving audio chunk: %s", e)
            return {"error": str(e)}

    async def process_lecture_audio(self, lecture_id: str, user_id: str) -> None:
        """Background task that drains the audio queue for one lecture."""
        logger.info("Started audio processing task for %s", lecture_id)
        self.lecture_users[lecture_id] = user_id
        self.lecture_templates[lecture_id] = await get_lecture_template(lecture_id)
        try:
            while True:
                chunk_data = await self.audio_queues[lecture_id].get()
                file_path: Path = chunk_data["file_path"]
                websocket: WebSocket = chunk_data["websocket"]

                # Transcribe
                await websocket.send_json({"type": "job_status", "stage": "transcribe", "ratio": 0.2, "retries": 0})
                try:
                    transcription_result = transcribe_local(str(file_path))
                    transcription_text = transcription_result.get("text", "").strip()
                except Exception as trans_error:
                    logger.error("Transcription error: %s", trans_error, exc_info=True)
                    continue

                if not transcription_text:
                    logger.warning("No speech detected in chunk")
                    continue

                transcription_data = {
                    "text": transcription_text,
                    "timestamp": chunk_data["timestamp"],
                    "language": transcription_result.get("language"),
                    "duration": transcription_result.get("duration"),
                }
                self.transcription_buffers[lecture_id].append(transcription_data)

                # RAG-enhanced per-chunk notes
                await websocket.send_json({"type": "job_status", "stage": "retrieve", "ratio": 0.45, "retries": 0})
                retrieved_chunks = await retrieve(
                    transcription_text,
                    user_id=user_id,
                    lecture_ids=[lecture_id],
                    limit=5,
                )
                source_rows, source_context = citation_sources(retrieved_chunks)
                rag_context = source_context.splitlines()
                enhanced_notes = await generate_raw_notes(
                    transcription_text=transcription_text,
                    context_chunks=rag_context,
                    lecture_id=lecture_id,
                    previous_notes=[],
                )
                await websocket.send_json({"type": "job_status", "stage": "enhanced_notes", "ratio": 0.75, "retries": 0})

                chunk_index = len(self.transcription_buffers[lecture_id]) - 1
                importance_result = score_importance(
                    {
                        "text": transcription_text,
                        "segments": transcription_result.get("segments", []),
                    }
                )
                importance = importance_result.get("importance", 0.5)
                duration_ms = int((transcription_result.get("duration") or settings.CHUNK_DURATION) * 1000)
                start_ms = chunk_index * duration_ms
                end_ms = start_ms + duration_ms
                segment_id = None

                try:
                    segment_id = await save_transcription(
                        lecture_id=lecture_id,
                        chunk_index=chunk_index,
                        text=transcription_text,
                        enhanced_notes=enhanced_notes,
                        timestamp=chunk_data["timestamp"],
                        importance=importance,
                        start_ms=start_ms,
                        end_ms=end_ms,
                        seq=chunk_index,
                        citation_ids=[source["id"] for source in source_rows],
                    )
                except Exception as db_error:
                    logger.error("Failed to save transcription: %s", db_error)

                await websocket.send_json(
                    {
                        "type": "transcription",
                        "content": transcription_text,
                        "enhanced_notes": enhanced_notes,
                        "timestamp": chunk_data["timestamp"],
                        "segment_id": segment_id,
                        "start_ms": start_ms,
                        "end_ms": end_ms,
                        "chunk_number": len(self.transcription_buffers[lecture_id]),
                    }
                )
                await websocket.send_json({"type": "job_status", "stage": "complete", "ratio": 1.0, "retries": 0})

                # Periodic structured-note synthesis
                buffer_size = len(self.transcription_buffers[lecture_id])
                current_time = time.time()
                last_synthesis = self.last_synthesis_time[lecture_id]
                should_synthesize = False
                if buffer_size >= 3:
                    time_since_last = current_time - last_synthesis
                    if time_since_last >= 60 or last_synthesis == 0:
                        should_synthesize = True
                    else:
                        recent = [t["text"] for t in self.transcription_buffers[lecture_id][-3:]]
                        if await detect_topic_shift(recent[-1], recent[:-1]):
                            should_synthesize = True
                if should_synthesize:
                    await self.synthesize_notes(lecture_id, websocket)

                # Cleanup
                try:
                    file_path.unlink()
                except Exception:
                    pass

        except asyncio.CancelledError:
            logger.info("Task cancelled for %s", lecture_id)
            raise
        except Exception as e:
            logger.error("Fatal error in processing task: %s", e, exc_info=True)

    async def synthesize_notes(self, lecture_id: str, websocket: WebSocket) -> None:
        """Synthesise structured notes from accumulated transcriptions."""
        try:
            transcriptions = self.transcription_buffers[lecture_id][-3:]
            if not transcriptions:
                return

            combined_text = " ".join(t["text"] for t in transcriptions)
            retrieved_chunks = await retrieve(
                combined_text,
                user_id=self.lecture_users.get(lecture_id, ""),
                lecture_ids=[lecture_id],
                limit=5,
            )
            source_rows, source_context = citation_sources(retrieved_chunks)
            rag_context = source_context.splitlines()
            previous_notes = (
                self.structured_notes_history[lecture_id][-1]
                if self.structured_notes_history[lecture_id]
                else None
            )

            await websocket.send_json(
                {"type": "synthesis_started", "message": "Generating structured notes..."}
            )
            await websocket.send_json({"type": "job_status", "stage": "periodic_synthesis", "ratio": 0.8, "retries": 0})

            synthesis_result = await synthesize_structured_notes(
                transcriptions=transcriptions,
                rag_context=rag_context,
                lecture_id=lecture_id,
                previous_structured_notes=previous_notes,
                template=self.lecture_templates.get(lecture_id, "detailed"),
            )

            if synthesis_result["success"]:
                structured_notes = synthesis_result["structured_notes"]
                structured_notes, citations = validate_citations(structured_notes, [], source_rows)
                if not citations:
                    structured_notes, citations = attach_auto_citations(structured_notes, source_rows)
                self.structured_notes_history[lecture_id].append(structured_notes)

                try:
                    await save_structured_notes(
                        lecture_id=lecture_id,
                        content=structured_notes,
                        transcription_count=len(transcriptions),
                        citations=citations,
                    )
                except Exception as db_error:
                    logger.error("Failed to save structured notes: %s", db_error)

                await websocket.send_json(
                    {
                        "type": "structured_notes",
                        "content": structured_notes,
                        "timestamp": int(time.time() * 1000),
                        "transcription_count": len(transcriptions),
                        "citations": citations,
                    }
                )

                self.last_synthesis_time[lecture_id] = time.time()
                # Keep last one for continuity context
                self.transcription_buffers[lecture_id] = self.transcription_buffers[lecture_id][-1:]

        except Exception as e:
            logger.error("Error synthesizing notes: %s", e, exc_info=True)
            await websocket.send_json({"type": "synthesis_error", "error": str(e)})

    async def final_synthesis(self, lecture_id: str, websocket: WebSocket) -> None:
        """Generate final comprehensive notes from all accumulated structured notes."""
        try:
            all_structured_notes = self.structured_notes_history[lecture_id]
            if not all_structured_notes:
                logger.warning("No structured notes to synthesize for %s", lecture_id)
                return

            await websocket.send_json(
                {"type": "final_synthesis_started", "message": "Creating comprehensive final notes..."}
            )

            all_transcriptions = " ".join(
                t["text"] for t in self.transcription_buffers[lecture_id]
            )
            retrieved_chunks = await retrieve(
                all_transcriptions,
                user_id=self.lecture_users.get(lecture_id, ""),
                lecture_ids=[lecture_id],
                limit=15,
            )
            source_rows, source_context = citation_sources(retrieved_chunks)
            rag_context = source_context.splitlines()

            final_result = await synthesize_final_notes(
                lecture_id=lecture_id,
                structured_notes_list=all_structured_notes,
                rag_context=rag_context,
                template=self.lecture_templates.get(lecture_id, "detailed"),
                author_markers=await get_db().lecture_markers.find({"lecture_id": lecture_id}).sort("start_ms", 1).to_list(None),
            )

            if final_result["success"]:
                markdown, citations = validate_citations(final_result["markdown"], [], source_rows)
                if not citations:
                    markdown, citations = attach_auto_citations(markdown, source_rows)
                final_result["markdown"] = markdown
                try:
                    await save_final_notes(
                        lecture_id=lecture_id,
                        title=final_result["title"],
                        markdown=final_result["markdown"],
                        sections=final_result["sections"],
                        glossary=final_result["glossary"],
                        key_takeaways=final_result["key_takeaways"],
                        citations=citations,
                    )
                except Exception as db_error:
                    logger.error("Failed to save final notes: %s", db_error)

                await websocket.send_json(
                    {
                        "type": "final_notes",
                        "title": final_result["title"],
                        "markdown": final_result["markdown"],
                        "sections": final_result["sections"],
                        "glossary": final_result["glossary"],
                        "key_takeaways": final_result["key_takeaways"],
                        "citations": citations,
                        "timestamp": int(time.time() * 1000),
                    }
                )
            else:
                logger.warning("Final synthesis returned no results")

        except Exception as e:
            logger.error("Error in final synthesis: %s", e, exc_info=True)
            await websocket.send_json({"type": "final_synthesis_error", "error": str(e)})


processor = AudioProcessor()
