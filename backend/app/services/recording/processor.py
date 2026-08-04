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

from app.services.transcribe_whisper import transcribe_local
from app.services.document_processor_mongodb import query_documents
from app.services.agentic_synthesizer import (
    synthesize_structured_notes,
    detect_topic_shift,
)
from app.services.importance_scorer import score_importance
from app.services.rag_generator import generate_raw_notes
from app.services.final_synthesizer import synthesize_final_notes

from database.mongodb_connection import (
    save_transcription,
    save_structured_notes,
    save_final_notes,
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

        # Processing queues + background tasks
        self.audio_queues: Dict[str, asyncio.Queue] = defaultdict(asyncio.Queue)
        self.processing_tasks: Dict[str, asyncio.Task] = {}

        logger.info("Audio processor initialised")

    async def process_audio_chunk(
        self, lecture_id: str, audio_file: UploadFile, websocket: WebSocket
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

            await self.audio_queues[lecture_id].put(
                {"file_path": file_path, "timestamp": timestamp, "websocket": websocket}
            )
            queue_size = self.audio_queues[lecture_id].qsize()

            return {"status": "queued", "size": file_size, "queue_size": queue_size}

        except Exception as e:
            logger.error("Error receiving audio chunk: %s", e)
            return {"error": str(e)}

    async def process_lecture_audio(self, lecture_id: str) -> None:
        """Background task that drains the audio queue for one lecture."""
        logger.info("Started audio processing task for %s", lecture_id)
        try:
            while True:
                chunk_data = await self.audio_queues[lecture_id].get()
                file_path: Path = chunk_data["file_path"]
                websocket: WebSocket = chunk_data["websocket"]

                # Transcribe
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
                rag_context = await query_documents(transcription_text, lecture_id, top_k=5)
                enhanced_notes = await generate_raw_notes(
                    transcription_text=transcription_text,
                    context_chunks=rag_context,
                    lecture_id=lecture_id,
                    previous_notes=[],
                )

                chunk_index = len(self.transcription_buffers[lecture_id]) - 1
                importance_result = score_importance(
                    {
                        "text": transcription_text,
                        "segments": transcription_result.get("segments", []),
                    }
                )
                importance = importance_result.get("importance", 0.5)

                try:
                    await save_transcription(
                        lecture_id=lecture_id,
                        chunk_index=chunk_index,
                        text=transcription_text,
                        enhanced_notes=enhanced_notes,
                        timestamp=chunk_data["timestamp"],
                        importance=importance,
                    )
                except Exception as db_error:
                    logger.error("Failed to save transcription: %s", db_error)

                await websocket.send_json(
                    {
                        "type": "transcription",
                        "content": transcription_text,
                        "enhanced_notes": enhanced_notes,
                        "timestamp": chunk_data["timestamp"],
                        "chunk_number": len(self.transcription_buffers[lecture_id]),
                    }
                )

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
            rag_context = await query_documents(combined_text, lecture_id, top_k=5)
            previous_notes = (
                self.structured_notes_history[lecture_id][-1]
                if self.structured_notes_history[lecture_id]
                else None
            )

            await websocket.send_json(
                {"type": "synthesis_started", "message": "Generating structured notes..."}
            )

            synthesis_result = await synthesize_structured_notes(
                transcriptions=transcriptions,
                rag_context=rag_context,
                lecture_id=lecture_id,
                previous_structured_notes=previous_notes,
            )

            if synthesis_result["success"]:
                structured_notes = synthesis_result["structured_notes"]
                self.structured_notes_history[lecture_id].append(structured_notes)

                try:
                    await save_structured_notes(
                        lecture_id=lecture_id,
                        content=structured_notes,
                        transcription_count=len(transcriptions),
                    )
                except Exception as db_error:
                    logger.error("Failed to save structured notes: %s", db_error)

                await websocket.send_json(
                    {
                        "type": "structured_notes",
                        "content": structured_notes,
                        "timestamp": int(time.time() * 1000),
                        "transcription_count": len(transcriptions),
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
            rag_context = await query_documents(all_transcriptions, lecture_id, top_k=15)

            final_result = await synthesize_final_notes(
                lecture_id=lecture_id,
                structured_notes_list=all_structured_notes,
                rag_context=rag_context,
            )

            if final_result["success"]:
                try:
                    await save_final_notes(
                        lecture_id=lecture_id,
                        title=final_result["title"],
                        markdown=final_result["markdown"],
                        sections=final_result["sections"],
                        glossary=final_result["glossary"],
                        key_takeaways=final_result["key_takeaways"],
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
                        "timestamp": int(time.time() * 1000),
                    }
                )
            else:
                logger.warning("Final synthesis returned no results")

        except Exception as e:
            logger.error("Error in final synthesis: %s", e, exc_info=True)
            await websocket.send_json({"type": "final_synthesis_error", "error": str(e)})


processor = AudioProcessor()
