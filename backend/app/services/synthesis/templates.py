"""Small prompt overlays for the supported note styles."""
from __future__ import annotations

TEMPLATE_INSTRUCTIONS = {
    "concise": "Use only the essential concepts and keep each section compact.",
    "detailed": "Explain key concepts thoroughly with clear hierarchy and examples where supported.",
    "bullet": "Prefer concise bullets over prose; organise them under descriptive headings.",
    "revision": "Optimise for exam revision: definitions, formulas, pitfalls, and quick recall points.",
    "summary": "Produce a short high-level summary focused on the main learning outcomes.",
}


def template_instruction(template: str | None) -> str:
    return TEMPLATE_INSTRUCTIONS.get(template or "detailed", TEMPLATE_INSTRUCTIONS["detailed"])
