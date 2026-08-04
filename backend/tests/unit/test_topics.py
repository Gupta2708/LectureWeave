import numpy as np

from app.services.topics.segmenter import segment_transcripts


class FakeEmbedder:
    def encode(self, values, show_progress_bar=False):
        return np.array([[1.0, 0.0], [1.0, 0.0], [0.0, 1.0]][:len(values)])


def test_topic_segmenter_splits_semantic_windows():
    segments = [
        {"_id": "1", "text": "calculus derivative limit", "start_ms": 0, "end_ms": 100000},
        {"_id": "2", "text": "calculus integral", "start_ms": 100000, "end_ms": 200000},
        {"_id": "3", "text": "history revolution", "start_ms": 200000, "end_ms": 300000},
    ]
    groups = segment_transcripts(segments, FakeEmbedder(), threshold=0.2, min_duration_seconds=0)
    assert len(groups) >= 2
    assert groups[0][0]["_id"] == "1"
