"""
Ownership regression tests.

Exercise the two recently-fixed helpers directly rather than through the API,
so these tests do not need MongoDB or Torch. They lock in:

1. `mongodb_connection.get_lecture_data` uses the ObjectId/str tolerant filter
   (regression for the raw-string `_id` lookup bug).
2. `db.repositories.jobs.create_job` refuses `target_type="document"` when the
   caller does not own the document's parent lecture.
"""
from __future__ import annotations

import pytest

from app.db.repositories import jobs
from database import mongodb_connection


class _FakeCursor:
    def __init__(self, items):
        self._items = items

    def to_list(self, length=None):  # matches motor's async interface
        async def _run():
            return list(self._items)

        return _run()


class _FakeCollection:
    def __init__(self, docs=None):
        self._docs = list(docs or [])
        self.inserted = []

    async def find_one(self, query, projection=None):  # noqa: ARG002 (projection unused)
        for doc in self._docs:
            if _matches(doc, query):
                return doc
        return None

    def find(self, query):
        return _FakeCursor([doc for doc in self._docs if _matches(doc, query)])

    async def insert_one(self, doc):
        self._docs.append(doc)
        self.inserted.append(doc)

        class _Result:
            inserted_id = doc.get("_id", "inserted-id")

        return _Result()


def _matches(doc, query):
    for key, value in query.items():
        if isinstance(value, dict) and "$in" in value:
            if doc.get(key) not in value["$in"]:
                return False
        elif doc.get(key) != value:
            return False
    return True


class _FakeDb:
    def __init__(self):
        self.lectures = _FakeCollection()
        self.documents = _FakeCollection()
        self.processing_jobs = _FakeCollection()
        self.transcriptions = _FakeCollection()
        self.structured_notes = _FakeCollection()
        self.final_notes = _FakeCollection()


@pytest.fixture
def fake_db(monkeypatch):
    db = _FakeDb()
    monkeypatch.setattr(mongodb_connection, "get_db", lambda: db)
    monkeypatch.setattr(jobs, "get_db", lambda: db)
    return db


@pytest.mark.asyncio
async def test_get_lecture_data_matches_string_and_objectid_shaped_ids(fake_db):
    """Regression: raw `find_one({"_id": lecture_id})` missed real ObjectIds."""
    fake_db.lectures._docs.append({"_id": "lecture-123", "title": "seed"})
    fake_db.transcriptions._docs.append({"lecture_id": "lecture-123", "text": "hi"})

    lecture = await mongodb_connection.get_lecture_data("lecture-123")

    assert lecture is not None
    assert lecture["title"] == "seed"
    # Related data still comes through so callers keep the shape they expect.
    assert len(lecture["transcriptions"]) == 1


@pytest.mark.asyncio
async def test_create_job_refuses_document_target_the_user_does_not_own(fake_db, monkeypatch):
    """A document target must be verified through its owning lecture."""
    fake_db.documents._docs.append({"_id": "doc-1", "lecture_id": "lecture-other"})

    async def deny(_lecture_id, _user_id):
        return False

    monkeypatch.setattr(jobs, "user_owns_lecture", deny)

    result = await jobs.create_job("attacker", "document", "doc-1")

    assert result is None
    assert fake_db.processing_jobs.inserted == []


@pytest.mark.asyncio
async def test_create_job_allows_document_target_when_user_owns_the_lecture(fake_db, monkeypatch):
    fake_db.documents._docs.append({"_id": "doc-1", "lecture_id": "lecture-mine"})

    async def allow(_lecture_id, _user_id):
        return True

    monkeypatch.setattr(jobs, "user_owns_lecture", allow)

    result = await jobs.create_job("owner", "document", "doc-1")

    assert result == "inserted-id"
    assert fake_db.processing_jobs.inserted[0]["target_id"] == "doc-1"
