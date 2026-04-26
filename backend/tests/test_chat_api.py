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


def test_chat_endpoint_emergency_variant_with_greeting():
    client = get_test_client()
    payload = {
        "message": "Hi my baby is not moving since the morning",
        "language": "en",
        "session_id": "api-u1b",
        "memory_turns": 6,
    }

    response = client.post("/api/chat", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "emergency"
    assert data["emergency"] is True


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


def test_chat_endpoint_short_followup_word_uses_context():
    client = get_test_client()

    first = client.post(
        "/api/chat",
        json={
            "message": "I have nausea in pregnancy",
            "language": "en",
            "session_id": "api-u3b",
            "memory_turns": 4,
        },
    )
    assert first.status_code == 200
    assert first.json()["intent"] == "nausea"

    follow = client.post(
        "/api/chat",
        json={
            "message": "what",
            "language": "en",
            "session_id": "api-u3b",
            "memory_turns": 4,
        },
    )
    assert follow.status_code == 200
    follow_data = follow.json()
    assert follow_data["context_used"] is True
    assert follow_data["intent"] == "nausea"


def test_chat_endpoint_greeting_prefixed_nausea_question_not_small_talk():
    client = get_test_client()

    response = client.post(
        "/api/chat",
        json={
            "message": "hi is nausea normal?",
            "language": "en",
            "session_id": "api-u3c",
            "memory_turns": 4,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] != "greeting"
    assert data["restricted"] is False


def test_chat_endpoint_headache_pregnancy_question_not_restricted():
    client = get_test_client()

    response = client.post(
        "/api/chat",
        json={
            "message": "i have been having headache since last 2 days in pregnancy what should I do",
            "language": "en",
            "session_id": "api-u3d",
            "memory_turns": 4,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["intent"] != "restricted"
    assert data["restricted"] is False


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


def test_chat_endpoint_headache_first_trimester():
    """Test API endpoint returns appropriate headache response."""
    client = get_test_client()
    response = client.post(
        "/api/chat",
        json={
            "message": "headache during my pregnancy",
            "language": "en",
            "session_id": "api-u5",
            "memory_turns": 6,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["restricted"] is False
    # Should provide helpful pregnancy-related guidance
    assert len(data["reply"]) > 0


def test_chat_endpoint_headache_with_severity():
    """Test API endpoint handles severe headache appropriately."""
    client = get_test_client()
    response = client.post(
        "/api/chat",
        json={
            "message": "severe headache during pregnancy what to do",
            "language": "en",
            "session_id": "api-u6",
            "memory_turns": 6,
        },
    )

    assert response.status_code == 200
    data = response.json()
    # Should provide appropriate guidance
    assert data["restricted"] is False
    assert "doctor" in data["reply"].lower() or "severe" in data["reply"].lower()


def test_chat_endpoint_swelling_question():
    """Test API endpoint handles swelling symptom."""
    client = get_test_client()
    response = client.post(
        "/api/chat",
        json={
            "message": "I have swelling in pregnancy",
            "language": "en",
            "session_id": "api-u7",
            "memory_turns": 6,
        },
    )

    assert response.status_code == 200
    data = response.json()
    # Should recognize pregnancy-related concern
    assert data["restricted"] is False


def test_chat_endpoint_dizziness_question():
    """Test API endpoint handles dizziness during pregnancy."""
    client = get_test_client()
    response = client.post(
        "/api/chat",
        json={
            "message": "dizzy during pregnancy what should I do",
            "language": "en",
            "session_id": "api-u8",
            "memory_turns": 6,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["restricted"] is False


def test_chat_endpoint_constipation_question():
    """Test API endpoint handles constipation in pregnancy."""
    client = get_test_client()
    response = client.post(
        "/api/chat",
        json={
            "message": "constipation during pregnancy",
            "language": "en",
            "session_id": "api-u9",
            "memory_turns": 6,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["restricted"] is False
