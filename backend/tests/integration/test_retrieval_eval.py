"""Small deterministic retrieval evaluation fixture for CI's in-memory tier."""
from __future__ import annotations

from app.services.retrieval.keyword import score_text


def _recall_at(expected: str, ranked: list[str], limit: int) -> float:
    return float(expected in ranked[:limit])


def test_keyword_fixture_reports_recall_at_k():
    corpus = {
        "gradient": "Gradient descent uses the learning rate to minimise loss.",
        "regularization": "L2 regularization penalises large weights.",
        "optimizer": "Adam combines momentum and adaptive learning rates.",
        **{f"noise-{index}": f"Unrelated lecture material {index}." for index in range(12)},
    }
    query = "learning rate gradient descent"
    ranked = sorted(corpus, key=lambda key: score_text(corpus[key], query.split()), reverse=True)

    metrics = {f"recall@{limit}": _recall_at("gradient", ranked, limit) for limit in (1, 3, 5)}
    assert metrics == {"recall@1": 1.0, "recall@3": 1.0, "recall@5": 1.0}
