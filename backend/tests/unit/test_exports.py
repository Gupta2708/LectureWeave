from app.services.exports import safe_filename
from app.services.synthesis.templates import template_instruction


def test_export_filename_is_sanitised():
    assert safe_filename('../../lecture notes') == 'lecture-notes'


def test_unknown_note_template_uses_detailed_default():
    assert template_instruction('unknown') == template_instruction('detailed')
