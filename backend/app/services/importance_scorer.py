"""
Importance scoring service for LectureWeave backend.
Based on your existing importance_scoring.py
"""
import math
import nltk
from typing import Dict, Any, List

# Download required NLTK data
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

# Keywords that indicate importance (tuneable)
KEYWORDS = set([
    "important", "definition", "remember", "note", "exam", "formula", "must", "key",
    "significant", "critical", "essential", "concept", "principle", "theory",
    "algorithm", "method", "approach", "technique", "strategy", "solution"
])

def keyword_bonus(text: str) -> float:
    """Basic keyword check - counts how many keywords present / normalized."""
    words = nltk.word_tokenize(text.lower())
    hits = sum(1 for w in words if w in KEYWORDS)
    return min(1.0, hits / 2.0)  # normalize (0..1)

def calculate_speaking_rate(text: str, duration: float) -> float:
    """Calculate words per second."""
    if duration <= 0:
        return 0.0
    words = nltk.word_tokenize(text)
    return len(words) / duration

def score_importance(transcription_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Score the importance of a transcription segment.
    
    Args:
        transcription_data: Dict containing 'text', 'segments', etc.
    
    Returns:
        Dict with importance score and component scores
    """
    text = transcription_data.get("text", "")
    segments = transcription_data.get("segments", [])
    
    if not text.strip():
        return {
            "importance": 0.0,
            "keyword_score": 0.0,
            "speaking_rate_score": 0.0,
            "length_score": 0.0
        }
    
    # Calculate duration from segments
    duration = 0.0
    if segments:
        start_time = segments[0].get("start", 0)
        end_time = segments[-1].get("end", 0)
        duration = max(0.001, end_time - start_time)
    else:
        # Fallback: estimate duration (rough estimate: 150 words per minute)
        words = nltk.word_tokenize(text)
        duration = max(0.001, len(words) / 2.5)  # 150 wpm = 2.5 wps
    
    # Component scores
    keyword_score = keyword_bonus(text)
    
    # Speaking rate (words per second)
    words_per_sec = calculate_speaking_rate(text, duration)
    # Normalize speaking rate (optimal around 2-3 wps)
    speaking_rate_score = 1 / (1 + math.exp(-(words_per_sec - 2)))
    
    # Length score (longer segments might be more important)
    words = nltk.word_tokenize(text)
    word_count = len(words)
    length_score = min(1.0, word_count / 20.0)  # Normalize to 20 words
    
    # Sentence structure score (complete sentences are better)
    sentences = nltk.sent_tokenize(text)
    sentence_score = min(1.0, len(sentences) / 3.0)  # Normalize to 3 sentences
    
    # Final weighted importance (tunable weights)
    importance = (
        0.3 * keyword_score +
        0.2 * speaking_rate_score +
        0.2 * length_score +
        0.3 * sentence_score
    )
    
    # Ensure importance is between 0 and 1
    importance = max(0.0, min(1.0, importance))
    
    return {
        "importance": importance,
        "keyword_score": keyword_score,
        "speaking_rate_score": speaking_rate_score,
        "length_score": length_score,
        "sentence_score": sentence_score,
        "words_per_sec": words_per_sec,
        "word_count": word_count,
        "duration": duration
    }

def score_segments(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Score importance for multiple segments.
    
    Args:
        segments: List of segment dicts with 'start', 'end', 'text'
    
    Returns:
        List of segments with added importance scores
    """
    scored_segments = []
    
    for segment in segments:
        # Create transcription data for this segment
        segment_data = {
            "text": segment.get("text", ""),
            "segments": [segment]
        }
        
        # Score this segment
        scores = score_importance(segment_data)
        
        # Add scores to segment
        enhanced_segment = segment.copy()
        enhanced_segment.update(scores)
        
        scored_segments.append(enhanced_segment)
    
    return scored_segments
