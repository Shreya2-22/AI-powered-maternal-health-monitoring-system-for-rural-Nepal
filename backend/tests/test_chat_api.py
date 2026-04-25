import importlib
import sys
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient


def get_test_client():
    # Re-import main with mocked Mongo client so API tests do not depend on network/database.
    if "main" in sys.modules:
        del sys.modules["main"]

    fake_client = MagicMock()
    fake_client.admin.command.side_effect = Exception("mocked offline db")

    with patch("pymongo.MongoClient", return_value=fake_client):
        module = importlib.import_module("main")

    return TestClient(module.app)


def test_chat_endpoint_emergency_red_flag():
    client = get_test_client()
    payload = {
        "message": "I am pregnant and baby not moving since morning",
        "language": "en",
        "session_id": "api-u1",
        "memory_turns": 6,
    }

    response = client.post("/api/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "emergency"
    assert data["emergency"] is True
    assert isinstance(data.get("confidence"), float)


def test_chat_endpoint_topic_restriction():
    client = get_test_client()
    payload = {
        "message": "tell me latest football match scores",
        "language": "en",
        "session_id": "api-u2",
        "memory_turns": 6,
    }

    response = client.post("/api/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "restricted"
    assert data["restricted"] is True


def test_chat_endpoint_memory_followup_context():
    client = get_test_client()

    first = client.post(
        "/api/chat",
        json={
            "message": "I have nausea in pregnancy",
            "language": "en",
            "session_id": "api-u3",
            "memory_turns": 4,
        },
    )
    assert first.status_code == 200
    assert first.json()["intent"] == "nausea"

    follow = client.post(
        "/api/chat",
        json={
            "message": "and now?",
            "language": "en",
            "session_id": "api-u3",
            "memory_turns": 4,
        },
    )
    assert follow.status_code == 200
    follow_data = follow.json()
    assert follow_data["context_used"] is True
    assert follow_data["intent"] == "nausea"


def test_chat_endpoint_requires_non_empty_message():
    client = get_test_client()

    response = client.post(
        "/api/chat",
        json={
            "message": "   ",
            "language": "en",
            "session_id": "api-u4",
            "memory_turns": 6,
        },
    )

    assert response.status_code == 400
    assert "Message is required" in response.text
