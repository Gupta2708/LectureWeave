"""Safe export rendering for final lecture notes."""
from __future__ import annotations

from io import BytesIO
import re

from fastapi.responses import StreamingResponse


def safe_filename(value: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip(".-")
    return clean[:100] or "lecture-notes"


def export_notes(title: str, markdown: str, export_format: str) -> StreamingResponse:
    filename = safe_filename(title)
    if export_format == "md":
        return StreamingResponse(iter([markdown.encode()]), media_type="text/markdown", headers={"Content-Disposition": f'attachment; filename="{filename}.md"'})
    if export_format == "txt":
        text = re.sub(r"[*_#>`]", "", markdown)
        return StreamingResponse(iter([text.encode()]), media_type="text/plain", headers={"Content-Disposition": f'attachment; filename="{filename}.txt"'})
    if export_format == "docx":
        from docx import Document
        document = Document()
        document.add_heading(title, 0)
        for line in markdown.splitlines():
            if line.startswith("# "): document.add_heading(line[2:], 1)
            elif line.startswith("## "): document.add_heading(line[3:], 2)
            elif line.startswith("- "): document.add_paragraph(line[2:], style="List Bullet")
            elif line.strip(): document.add_paragraph(line)
        output = BytesIO(); document.save(output); output.seek(0)
        return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": f'attachment; filename="{filename}.docx"'})
    if export_format == "pdf":
        try:
            from weasyprint import HTML
        except ImportError as exc:
            raise RuntimeError("PDF export is not installed") from exc
        html = f"<h1>{title}</h1><pre>{markdown}</pre>"
        return StreamingResponse(iter([HTML(string=html).write_pdf()]), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'})
    raise ValueError("Unsupported export format")
