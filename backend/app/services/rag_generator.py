"""
RAG-based note generation service for LectureWeave backend.
Based on your existing rag_raw_notes_with_history.py
"""
import os
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Try to import Groq, otherwise fallback to a simple stub
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except Exception:
    GROQ_AVAILABLE = False

# Initialize Groq client if available
groq_client = None
if GROQ_AVAILABLE and settings.GROQ_API_KEY:
    groq_client = Groq(api_key=settings.GROQ_API_KEY)

async def generate_raw_notes(
    transcription_text: str,
    context_chunks: List[str],
    lecture_id: str,
    previous_notes: List[str] = None
) -> str:
    """
    Generate raw notes from transcription text using RAG context.
    
    Args:
        transcription_text: The transcribed speech text
        context_chunks: Relevant document chunks from FAISS
        lecture_id: ID of the current lecture
        previous_notes: Recent notes for context (to avoid repetition)
    
    Generated raw notes as string
    """
    if previous_notes is None:
        previous_notes = []
    
    # Build the prompt with error correction focus
    prompt_system = (
        "You are an intelligent educational assistant creating concise lecture notes from spoken transcription. "
        "IMPORTANT: The transcription may contain speech recognition errors (misheard words, grammar issues). "
        "Your job is to UNDERSTAND the intended meaning and create accurate, well-written notes that capture "
        "what the speaker actually meant to say. Use the supporting context from documents to help correct errors "
        "and provide accurate terminology. Avoid repeating content from recent notes."
    )
    
    # Limit previous notes to avoid token overflow
    recent_notes_text = "\n".join(previous_notes[-settings.HISTORY_CHUNKS:])
    context_text = "\n".join(context_chunks[:3])  # Limit context chunks
    
    prompt_user = (
        f"SPOKEN TRANSCRIPTION (may contain errors):\n\"\"\"\n{transcription_text}\n\"\"\"\n\n"
        f"SUPPORTING CONTEXT FROM DOCUMENTS (use this to correct errors and add accuracy):\n\"\"\"\n{context_text}\n\"\"\"\n\n"
        f"RECENT NOTES (do NOT repeat):\n\"\"\"\n{recent_notes_text}\n\"\"\"\n\n"
        "YOUR TASK:\n"
        "1. Read the transcription and UNDERSTAND what the speaker meant (even if words are wrong)\n"
        "2. Use the document context to identify correct terminology and concepts\n"
        "3. Create 3-5 clear, accurate bullet points that capture the intended meaning\n"
        "4. Fix any obvious transcription errors (wrong words, grammar issues)\n"
        "5. Use proper technical terms from the context when applicable\n\n"
        "OUTPUT FORMAT:\n"
        "- Write in clear, correct English\n"
        "- Each bullet should be 8-15 words\n"
        "- Focus on key concepts and ideas\n"
        "- Return only bullet points (one per line, starting with '-')\n"
        "- Do NOT copy transcription errors into notes"
    )
    
    try:
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        generated_text = await loop.run_in_executor(
            None, 
            _call_llm_for_raw_notes, 
            prompt_system, 
            prompt_user
        )
        return generated_text
    except Exception as e:
        print(f"Error generating raw notes: {e}")
        return f"- Error generating notes: {str(e)}"

def _call_llm_for_raw_notes(prompt_system: str, prompt_user: str) -> str:
    """Call Groq chat completion; fallback to naive stub if not available."""
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": prompt_user},
                ],
                temperature=0.2,  # Slightly higher for better understanding/correction
                max_tokens=250,  # More tokens for better explanations
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API error: {e}")
            return _fallback_note_generation(prompt_user)
    else:
        return _fallback_note_generation(prompt_user)

def _fallback_note_generation(prompt_user: str) -> str:
    """Simple stub: take first meaningful phrases as bullets."""
    lines = []
    
    # Extract transcript section
    transcript_start = prompt_user.find("Transcript chunk:")
    transcript_end = prompt_user.find('"""', transcript_start + 20)
    
    if transcript_start != -1 and transcript_end != -1:
        transcript_section = prompt_user[transcript_start:transcript_end]
        
        for line in transcript_section.split("\n"):
            line = line.strip()
            if not line or line.startswith("Transcript"):
                continue
            
            # Split into sentences and create bullets
            sentences = line.split(".")
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 10:  # Skip very short fragments
                    # Take first 80 characters and add as bullet
                    bullet = "- " + sentence[:80].strip()
                    if not bullet.endswith("."):
                        bullet += "..."
                    lines.append(bullet)
                    
                if len(lines) >= 5:  # Limit to 5 bullets
                    break
            
            if len(lines) >= 5:
                break
    
    return "\n".join(lines) if lines else "- No content generated (fallback mode)"

async def generate_structured_notes(
    raw_notes_list: List[str],
    lecture_id: str,
    previous_structured: List[Dict] = None
) -> Dict[str, Any]:
    """
    Generate structured notes from raw notes.
    
    Args:
        raw_notes_list: List of raw note strings
        lecture_id: ID of the current lecture
        previous_structured: Previous structured notes for context
    
    Returns:
        Structured notes as dict with title, summary, subtopics, etc.
    """
    if previous_structured is None:
        previous_structured = []
    
    # Combine raw notes
    raw_text = "\n\n".join(raw_notes_list)
    
    # Build context from previous structured notes
    prev_text = ""
    if previous_structured:
        import json
        prev_text = "\n\n".join([
            json.dumps(note, ensure_ascii=False) 
            for note in previous_structured[-3:]  # Last 3 entries
        ])
    
    prompt_system = (
        "You are an expert note-maker. Your job is to convert raw micro-notes into a well-structured study "
        "section. Output MUST be valid JSON object (no surrounding commentary). Follow the JSON schema exactly."
    )
    
    schema_instructions = """
Return a single JSON object with these fields (use these exact keys):

{
  "title": "<short title for this section>",
  "summary": "<one-sentence summary of the section (<= 25 words)>",
  "subtopics": [
     {
       "title": "<subtopic title>",
       "bullets": ["short bullet 1", "short bullet 2", ...]
     }
  ],
  "key_terms": ["term1", "term2", ...],
  "key_takeaways": ["one-sentence takeaway 1", "one-sentence takeaway 2"]
}

Rules:
- Prefer to create a subtopic heading only when there is a clear thematic break.
- If the raw notes are already succinct, group them into a single subtopic called 'Key points'.
- Keep bullets short (<= 12 words).
- Key terms should be nouns or short technical phrases.
- Key takeaways should be high-level 'what the student should remember' items.
- Do NOT fabricate facts beyond what's in raw notes.
"""
    
    context_hint = ""
    if prev_text:
        context_hint = f"\n\nPrevious structured notes (short memory):\n{prev_text}\n\n"
    
    prompt_user = f"Raw notes (batch):\n\"\"\"\n{raw_text}\n\"\"\"\n\n{context_hint}{schema_instructions}\nReturn only JSON."
    
    try:
        loop = asyncio.get_event_loop()
        generated = await loop.run_in_executor(
            None,
            _call_llm_for_structured,
            prompt_system,
            prompt_user
        )
        
        # Parse JSON
        import json
        parsed = json.loads(generated)
        return parsed
        
    except Exception as e:
        print(f"Error generating structured notes: {e}")
        # Fallback structured format
        return {
            "title": "Lecture Notes",
            "summary": "Auto-generated summary from raw notes",
            "subtopics": [
                {
                    "title": "Key Points",
                    "bullets": raw_notes_list[:5]  # First 5 raw notes
                }
            ],
            "key_terms": [],
            "key_takeaways": []
        }

def _call_llm_for_structured(prompt_system: str, prompt_user: str) -> str:
    """Call LLM for structured note generation."""
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": prompt_user},
                ],
                temperature=0.2,
                max_tokens=600,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API error in structured generation: {e}")
            raise e
    else:
        # Simple fallback JSON
        import json
        fallback = {
            "title": "Lecture Notes",
            "summary": "Generated from transcription",
            "subtopics": [{"title": "Key Points", "bullets": ["Content from transcription"]}],
            "key_terms": [],
            "key_takeaways": []
        }
        return json.dumps(fallback)
