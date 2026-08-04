"""
Final Synthesizer for LectureWeave - Integrated Version

Takes all accumulated structured notes from a lecture and creates
comprehensive, humanized final notes with:
- Clean outline and sections
- Formulas extraction
- Glossary of key terms
- Key takeaways
- Further reading from documents
"""

import json
import re
import textwrap
from typing import Any, Dict, List, Optional, Tuple
from collections import Counter
import os

# Import from existing services
from app.core.config import settings
from app.services.synthesis.templates import template_instruction

# Try to import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except Exception:
    GROQ_AVAILABLE = False

# Try to import FAISS
try:
    import faiss
    FAISS_AVAILABLE = True
except Exception:
    FAISS_AVAILABLE = False

# Try to import SentenceTransformer
try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except Exception:
    ST_AVAILABLE = False


class FinalSynthesizer:
    """Synthesizes final comprehensive notes from accumulated structured notes"""
    
    def __init__(self, lecture_id: str, template: str = "detailed"):
        self.lecture_id = lecture_id
        self.template = template
        self.groq_client = None
        
        if GROQ_AVAILABLE and settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"Failed to initialize Groq: {e}")
    
    def synthesize(
        self,
        structured_notes_list: List[str],
        rag_context: Optional[List[str]] = None,
        author_markers: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesize final comprehensive notes
        
        Args:
            structured_notes_list: List of structured note strings (markdown)
            rag_context: Optional document context from FAISS
            
        Returns:
            Dict with final notes, glossary, takeaways, etc.
        """
        if not structured_notes_list:
            return self._empty_result()
        
        # Author markers are user-authored context, not model inferences.
        if author_markers:
            marker_lines = [f"- {item.get('type', 'marker')} at {item.get('start_ms', 0)}ms: {item.get('note', '')}" for item in author_markers]
            structured_notes_list = [*structured_notes_list, "## Author-flagged moments\n" + "\n".join(marker_lines)]
        # Combine all structured notes
        combined_notes = "\n\n---\n\n".join(structured_notes_list)
        
        # Build outline
        outline = self._build_outline(combined_notes)
        
        # Extract sections
        sections = self._extract_sections(combined_notes, outline, rag_context)
        
        # Build glossary
        glossary = self._build_glossary(combined_notes, rag_context)
        
        # Extract key takeaways
        takeaways = self._extract_takeaways(sections)
        
        # Generate final markdown
        final_markdown = self._assemble_markdown(
            outline["title"],
            sections,
            glossary,
            takeaways
        )
        
        return {
            "success": True,
            "title": outline["title"],
            "markdown": final_markdown,
            "sections": sections,
            "glossary": glossary,
            "key_takeaways": takeaways,
            "lecture_id": self.lecture_id
        }
    
    def _build_outline(self, combined_notes: str) -> Dict[str, Any]:
        """Build clean outline from messy structured notes"""
        
        if not self.groq_client:
            return {"title": "Lecture Notes", "sections": ["Introduction", "Main Content"]}
        
        # Extract headings from markdown
        headings = re.findall(r'^##\s+(.+)$', combined_notes, re.MULTILINE)
        # Remove duplicates while preserving order
        seen = set()
        unique_headings = []
        for h in headings:
            h_clean = h.strip().lower()
            if h_clean not in seen and h_clean != "lecture notes":
                seen.add(h_clean)
                unique_headings.append(h.strip())
        
        system_prompt = """You are an expert at organizing educational content. 
Create a clean, concise outline. Merge similar topics. NO repetition."""

        user_prompt = f"""Lecture headings (may have duplicates):

{chr(10).join(unique_headings[:15])}

Create outline with:
1. ONE concise title (4-6 words, topic-focused)
2. 2-4 main sections (NO duplicates, NO "Lecture Notes")

Return ONLY JSON:
{{"title": "Topic Name", "sections": ["Section 1", "Section 2"]}}

Example:
{{"title": "Machine Learning Fundamentals", "sections": ["Core Concepts", "Learning Types", "Neural Networks"]}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.15,
                max_tokens=150
            )
            
            result = response.choices[0].message.content.strip()
            result = self._strip_code_fences(result)
            outline = json.loads(result)
            
            if "title" in outline and "sections" in outline:
                # Limit to max 4 sections
                outline["sections"] = outline["sections"][:4]
                return outline
        except Exception as e:
            print(f"Outline generation failed: {e}")
        
        # Fallback
        return {
            "title": unique_headings[0] if unique_headings else "Lecture Notes",
            "sections": unique_headings[1:4] if len(unique_headings) > 1 else ["Main Content"]
        }
    
    def _extract_sections(
        self,
        combined_notes: str,
        outline: Dict[str, Any],
        rag_context: Optional[List[str]]
    ) -> List[Dict[str, Any]]:
        """Extract and enhance sections with RAG context"""
        
        sections = []
        section_names = outline.get("sections", ["Main Content"])
        
        # Split combined notes into chunks
        note_chunks = combined_notes.split("---")
        
        for section_name in section_names:
            # Find relevant content for this section
            relevant_content = self._find_relevant_content(section_name, note_chunks)
            
            # Enhance with RAG if available
            enhanced_text = self._enhance_section(
                section_name,
                relevant_content,
                rag_context
            )
            
            # Extract formulas
            formulas = self._extract_formulas(enhanced_text)
            
            sections.append({
                "title": section_name,
                "content": enhanced_text,
                "formulas": formulas
            })
        
        return sections
    
    def _find_relevant_content(self, section_name: str, note_chunks: List[str]) -> str:
        """Find content relevant to a section"""
        # Simple keyword matching
        keywords = section_name.lower().split()
        relevant = []
        
        for chunk in note_chunks:
            chunk_lower = chunk.lower()
            if any(kw in chunk_lower for kw in keywords):
                relevant.append(chunk)
        
        if not relevant:
            # Take first few chunks as fallback
            relevant = note_chunks[:2]
        
        return "\n\n".join(relevant)
    
    def _enhance_section(
        self,
        section_name: str,
        content: str,
        rag_context: Optional[List[str]]
    ) -> str:
        """Enhance section with RAG context - CONCISE bullet points with PDF integration"""
        
        if not self.groq_client:
            return content[:800]
        
        # Use MORE context from PDF
        context_text = "\n\n".join(rag_context[:5]) if rag_context else "No document context"
        
        system_prompt = """You are creating CONCISE, STRUCTURED lecture notes.

CRITICAL RULES:
1. Use BOTH transcription AND document content (50/50 mix)
2. Write in BULLET POINTS, not long paragraphs
3. Each bullet: 10-20 words maximum
4. Include formulas from documents in proper LaTeX: $$formula$$
5. Add definitions from documents
6. NO repetition, NO fluff
7. Focus on KEY concepts only

FORMAT:
- Main point (brief)
- Sub-point with detail
- Formula: $$LaTeX$$
- Example if relevant

Style instruction: """ + template_instruction(self.template)

        user_prompt = f"""Topic: {section_name}

TRANSCRIPTION NOTES (what teacher said):
{content[:1000]}

DOCUMENT CONTENT (PDF/PPT - USE THIS HEAVILY):
{context_text[:2000]}

Create CONCISE notes:
1. Extract KEY points from BOTH sources
2. Use definitions/formulas from documents
3. Write in bullet points (10-20 words each)
4. Include formulas in $$LaTeX$$ format
5. Max 8-10 bullets total
6. End every factual claim with a valid source tag such as [C1]; use only source IDs in DOCUMENT CONTENT.

Output format:
- Point 1
- Point 2
  - Sub-point with detail
- Formula: $$x = y$$
- Point 3"""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=500  # Shorter output
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Section enhancement failed: {e}")
            return content[:800]
    
    def _extract_formulas(self, text: str) -> List[str]:
        """Extract LaTeX formulas from text - properly formatted"""
        formulas = []
        
        # Find $$ blocks (display math)
        display_math = re.findall(r'\$\$(.*?)\$\$', text, re.DOTALL)
        for f in display_math:
            f = f.strip()
            if f and len(f) > 2:  # Avoid empty or tiny formulas
                formulas.append(f"$$\n{f}\n$$")
        
        # Find inline \( \) blocks
        inline_math = re.findall(r'\\\((.*?)\\\)', text, re.DOTALL)
        for f in inline_math:
            f = f.strip()
            if f and len(f) > 2:
                formulas.append(f"$$\n{f}\n$$")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_formulas = []
        for f in formulas:
            if f not in seen:
                seen.add(f)
                unique_formulas.append(f)
        
        return unique_formulas[:5]  # Max 5 formulas per section
    
    def _build_glossary(
        self,
        combined_notes: str,
        rag_context: Optional[List[str]]
    ) -> Dict[str, str]:
        """Build glossary of key terms - concise definitions from PDF"""
        
        # Extract potential terms (capitalized words, technical terms)
        terms = re.findall(r'\*\*([A-Z][a-zA-Z\s]{2,20})\*\*', combined_notes)
        
        # Count frequency
        term_counts = Counter(terms)
        top_terms = [term for term, _ in term_counts.most_common(6)]  # Reduced to 6
        
        if not top_terms or not self.groq_client:
            return {}
        
        # Use MORE context from PDF
        context_text = "\n\n".join(rag_context[:5]) if rag_context else ""
        
        system_prompt = "Create SHORT, PRECISE definitions using document content."
        
        user_prompt = f"""Define these terms:
{json.dumps(top_terms)}

DOCUMENT CONTEXT (use this for definitions):
{context_text[:1500]}

Return JSON: {{"definitions": {{"Term": "One sentence definition (15-20 words max)", ...}}}}

Rules:
- Use definitions from documents
- Max 20 words per definition
- Focus on key concept only"""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.15,
                max_tokens=250
            )
            
            result = response.choices[0].message.content.strip()
            result = self._strip_code_fences(result)
            data = json.loads(result)
            return data.get("definitions", {})
        except Exception as e:
            print(f"Glossary generation failed: {e}")
            return {}
    
    def _extract_takeaways(self, sections: List[Dict[str, Any]]) -> List[str]:
        """Extract key takeaways - CONCISE, actionable points"""
        
        all_content = "\n\n".join([s["content"] for s in sections])
        
        if not self.groq_client:
            # Simple fallback: extract bullet points
            bullets = re.findall(r'^[-•]\s*(.+)$', all_content, re.MULTILINE)
            return bullets[:4]
        
        system_prompt = "Extract 4 CONCISE key takeaways. Each: 12-18 words max."
        
        user_prompt = f"""LECTURE CONTENT:
{all_content[:1500]}

Extract 4 key takeaways:
- Most important concepts
- 12-18 words each
- Actionable/memorable
- NO fluff

Return JSON: {{"takeaways": ["Concise point 1", "Concise point 2", ...]}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.15,
                max_tokens=200
            )
            
            result = response.choices[0].message.content.strip()
            result = self._strip_code_fences(result)
            data = json.loads(result)
            return data.get("takeaways", [])[:4]  # Max 4
        except Exception as e:
            print(f"Takeaways extraction failed: {e}")
            return []
    
    def _assemble_markdown(
        self,
        title: str,
        sections: List[Dict[str, Any]],
        glossary: Dict[str, str],
        takeaways: List[str]
    ) -> str:
        """Assemble final markdown document"""
        
        lines = []
        
        # Title
        lines.append(f"# {title}\n")
        
        # Table of Contents
        lines.append("## Table of Contents\n")
        for i, sec in enumerate(sections, 1):
            lines.append(f"{i}. [{sec['title']}](#{self._slugify(sec['title'])})")
        lines.append("")
        
        # Sections
        for i, sec in enumerate(sections, 1):
            lines.append(f"## {i}. {sec['title']}\n")
            lines.append(sec['content'])
            lines.append("")
            
            # Formulas
            if sec.get('formulas'):
                lines.append("### Key Formulas\n")
                for formula in sec['formulas']:
                    lines.append(f"$$\n{formula}\n$$\n")
                lines.append("")
        
        # Glossary
        if glossary:
            lines.append("## Glossary\n")
            for term, definition in sorted(glossary.items()):
                lines.append(f"**{term}**: {definition}\n")
            lines.append("")
        
        # Key Takeaways
        if takeaways:
            lines.append("## Key Takeaways\n")
            for takeaway in takeaways:
                lines.append(f"- {takeaway}")
            lines.append("")
        
        return "\n".join(lines)
    
    def _strip_code_fences(self, text: str) -> str:
        """Remove markdown code fences"""
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```", 1)[1]
            if "```" in text:
                text = text.rsplit("```", 1)[0]
        return text.strip()
    
    def _slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower().strip()
        text = re.sub(r'[^a-z0-9]+', '-', text)
        return text.strip('-')
    
    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            "success": False,
            "title": "No Notes",
            "markdown": "No notes were generated during this lecture.",
            "sections": [],
            "glossary": {},
            "key_takeaways": [],
            "lecture_id": self.lecture_id
        }


async def synthesize_final_notes(
    lecture_id: str,
    structured_notes_list: List[str],
    rag_context: Optional[List[str]] = None,
    template: str = "detailed",
    author_markers: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Async wrapper for final synthesis
    
    Args:
        lecture_id: ID of the lecture
        structured_notes_list: List of structured note strings
        rag_context: Optional document context
        
    Returns:
        Dict with final notes and metadata
    """
    import asyncio
    
    synthesizer = FinalSynthesizer(lecture_id, template)
    
    # Run in executor to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        synthesizer.synthesize,
        structured_notes_list,
        rag_context,
        author_markers,
    )
    
    return result
