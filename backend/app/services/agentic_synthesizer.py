"""
Agentic Note Synthesizer for LectureWeave
Combines multiple transcription chunks into structured, coherent notes
"""
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except Exception:
    GROQ_AVAILABLE = False

# Initialize Groq client
groq_client = None
if GROQ_AVAILABLE and settings.GROQ_API_KEY:
    groq_client = Groq(api_key=settings.GROQ_API_KEY)


async def synthesize_structured_notes(
    transcriptions: List[Dict[str, Any]],
    rag_context: List[str],
    lecture_id: str,
    previous_structured_notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Synthesize multiple transcription chunks into structured, coherent notes.
    
    Args:
        transcriptions: List of transcription dicts with 'text', 'timestamp', etc.
        rag_context: Relevant document chunks from FAISS
        lecture_id: Current lecture ID
        previous_structured_notes: Previously generated structured notes
    
    Returns:
        Dict with structured notes and metadata
    """
    # Combine all transcriptions
    full_transcription = "\n".join([t.get("text", "") for t in transcriptions])
    
    if not full_transcription.strip():
        return {
            "success": False,
            "error": "No transcription content to synthesize"
        }
    
    # Run synthesis in executor to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        _synthesize_sync,
        full_transcription,
        rag_context,
        previous_structured_notes
    )
    
    return {
        "success": True,
        "structured_notes": result,
        "transcription_count": len(transcriptions),
        "lecture_id": lecture_id
    }


def _synthesize_sync(
    full_transcription: str,
    rag_context: List[str],
    previous_notes: Optional[str]
) -> str:
    """Synchronous synthesis function."""
    
    if not groq_client:
        print("⚠️  WARNING: GROQ client not available! Using fallback (will copy transcription errors)")
        print("⚠️  Please set GROQ_API_KEY in .env file!")
        return _fallback_synthesis(full_transcription)
    
    # Build context
    context_text = "\n\n".join(rag_context[:5]) if rag_context else "No additional context available."
    previous_text = previous_notes if previous_notes else "This is the first set of notes for this lecture."
    
    # Concise system prompt to avoid token limits
    system_prompt = """You are an expert note-taker. Fix transcription errors and create clear, accurate lecture notes.

Rules:
1. Fix speech recognition errors (wrong words, grammar mistakes)
2. Use document context for correct terminology
3. Write clear, educational notes
4. Use ## for topics, ### for subtopics, bullets for details
5. Use **bold** for key terms"""

    # Concise user prompt to avoid token limits
    # Limit context to avoid payload too large errors
    limited_context = "\n".join(rag_context[:2]) if rag_context else "No context"
    limited_previous = previous_notes[:300] if previous_notes else "First notes"
    
    user_prompt = f"""Fix transcription errors and create clear lecture notes.

TRANSCRIPTION (has errors):
{full_transcription}

REFERENCE MATERIAL:
{limited_context}

PREVIOUS NOTES:
{limited_previous}

Create organized notes with ## headers, ### subheaders, and bullet points. Fix all errors."""

    try:
        print(f"🤖 Calling GROQ API for synthesis...")
        response = groq_client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=800,  # Reduced to avoid rate limits
        )
        
        result = response.choices[0].message.content.strip()
        print(f"✅ GROQ API synthesis successful! Generated {len(result)} characters")
        return result
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error in agentic synthesis: {error_msg}")
        
        # Check if it's a rate limit or payload error
        if "413" in error_msg or "Payload Too Large" in error_msg:
            print(f"⚠️  Payload too large - using simpler synthesis")
        elif "429" in error_msg or "rate_limit" in error_msg:
            print(f"⚠️  Rate limit hit - using fallback")
        
        print(f"⚠️  Falling back to simple synthesis")
        return _fallback_synthesis(full_transcription)


def _fallback_synthesis(transcription: str) -> str:
    """Simple fallback if Groq is unavailable - creates basic formatted notes."""
    # Split into sentences and clean
    sentences = [s.strip() for s in transcription.split('.') if s.strip()]
    
    notes = "## Lecture Notes\n\n"
    notes += "### Key Points\n\n"
    
    # Add sentences as bullet points (limit to avoid too long)
    for sentence in sentences[:10]:  # Limit to 10 sentences
        if len(sentence) > 20:  # Skip very short fragments
            notes += f"- {sentence.capitalize()}\n"
    
    return notes


async def detect_topic_shift(
    current_transcription: str,
    previous_transcriptions: List[str]
) -> bool:
    """
    Detect if there's a significant topic shift in the lecture.
    This can trigger early synthesis even before 60 seconds.
    
    Args:
        current_transcription: Latest transcription text
        previous_transcriptions: Previous transcription texts
    
    Returns:
        True if topic shift detected, False otherwise
    """
    # Simple keyword-based detection for now
    # Can be enhanced with embeddings similarity
    
    if not previous_transcriptions:
        return False
    
    # Keywords that indicate topic transitions
    transition_keywords = [
        "now let's move on",
        "next topic",
        "moving on to",
        "let's discuss",
        "now we'll talk about",
        "switching to",
        "another important topic"
    ]
    
    current_lower = current_transcription.lower()
    
    for keyword in transition_keywords:
        if keyword in current_lower:
            return True
    
    return False
