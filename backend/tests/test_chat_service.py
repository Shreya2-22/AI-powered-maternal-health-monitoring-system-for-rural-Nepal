from chat_service import PregnancyChatService
import time


def test_greeting_response():
    service = PregnancyChatService()
    result = service.answer("hi", "en", session_id="u1")
    assert result.intent == "greeting"
    assert result.restricted is False
    assert result.confidence >= 0.9


def test_emergency_guardrail_escalates():
    service = PregnancyChatService()
    result = service.answer("I have heavy bleeding and severe pain", "en", session_id="u2")
    assert result.intent == "emergency"
    assert result.emergency is True
    assert "hospital" in result.reply.lower() or "doctor" in result.reply.lower()


def test_red_flag_classifier_escalates_before_intent_scoring():
    service = PregnancyChatService()
    result = service.answer("I am 8 months and baby not moving since morning", "en", session_id="u2b")
    assert result.intent == "emergency"
    assert result.emergency is True


def test_topic_restriction_blocks_offtopic():
    service = PregnancyChatService()
    result = service.answer("who will win football world cup", "en", session_id="u3")
    assert result.intent == "restricted"
    assert result.restricted is True


def test_low_confidence_returns_safer_fallback():
    service = PregnancyChatService()
    result = service.answer("pregnancy maybe something", "en", session_id="u4")
    assert result.intent == "low_confidence"
    assert result.restricted is False
    assert result.confidence < service.confidence_threshold


def test_memory_followup_uses_recent_context():
    service = PregnancyChatService()
    first = service.answer("I have nausea in pregnancy", "en", session_id="u5", memory_turns=4)
    assert first.intent == "nausea"

    follow_up = service.answer("and now?", "en", session_id="u5", memory_turns=4)
    assert follow_up.context_used is True
    assert follow_up.intent == "nausea"


def test_memory_window_limits_old_context():
    service = PregnancyChatService()
    service.answer("I have nausea in pregnancy", "en", session_id="u6", memory_turns=1)
    service.answer("Thanks", "en", session_id="u6", memory_turns=1)

    # Old intent falls outside the 1-turn context window, so it should not reuse nausea context.
    result = service.answer("and now?", "en", session_id="u6", memory_turns=1)
    assert result.context_used is False
    assert result.intent in {"low_confidence", "fallback", "restricted", "thanks"}


def test_inactive_sessions_auto_expire():
    service = PregnancyChatService()
    service.session_ttl_seconds = 0.01
    expiring_key = service._session_key("expiring-session")

    service.answer("I have nausea in pregnancy", "en", session_id="expiring-session")
    assert expiring_key in service.sessions

    time.sleep(0.03)
    # Any new call triggers cleanup.
    service.answer("hello", "en", session_id="another-session")

    assert expiring_key not in service.sessions
