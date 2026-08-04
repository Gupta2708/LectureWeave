"""Regression tests for canonical MongoDB helper definitions."""
from __future__ import annotations

import ast
from pathlib import Path


def test_save_helpers_are_defined_once():
    source = Path(__file__).parents[2] / "database" / "mongodb_connection.py"
    tree = ast.parse(source.read_text(encoding="utf-8"))
    names = [node.name for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
    for helper in ("save_transcription", "save_structured_notes", "save_final_notes"):
        assert names.count(helper) == 1, f"{helper} must have one canonical definition"
