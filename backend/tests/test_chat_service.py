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


def test_fetal_movement_variant_with_greeting_still_escalates():
    service = PregnancyChatService()
    result = service.answer("Hi my baby is not moving since the morning", "en", session_id="u2c")
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


def test_short_followup_word_uses_context_when_available():
    service = PregnancyChatService()
    first = service.answer("I have nausea in pregnancy", "en", session_id="u5b", memory_turns=4)
    assert first.intent == "nausea"

    follow_up = service.answer("what", "en", session_id="u5b", memory_turns=4)
    assert follow_up.context_used is True
    assert follow_up.intent == "nausea"


def test_greeting_prefixed_nausea_question_not_treated_as_small_talk():
    service = PregnancyChatService()
    result = service.answer("hi is nausea normal?", "en", session_id="u5c")
    assert result.intent != "greeting"
    assert result.restricted is False


def test_headache_pregnancy_question_is_not_restricted():
    service = PregnancyChatService()
    result = service.answer(
        "i have been having headache since last 2 days in pregnancy what should I do",
        "en",
        session_id="u5d",
    )
    assert result.intent != "restricted"
    assert result.restricted is False


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


def test_headache_first_trimester_mild():
    """Test that headache during pregnancy is recognized and handled."""
    service = PregnancyChatService()
    result = service.answer(
        "I have a headache during my pregnancy",
        "en",
        session_id="u7",
    )
    # Should not be restricted and should provide guidance
    assert result.restricted is False
    assert "doctor" in result.reply.lower() or "hydration" in result.reply.lower() or "pain" in result.reply.lower()


def test_headache_with_severity_level():
    """Test that severity keywords influence response."""
    service = PregnancyChatService()
    result = service.answer(
        "I have severe headache during pregnancy",
        "en",
        session_id="u8",
    )
    assert result.restricted is False
    # Should recognize this is serious
    assert "severe" in result.reply.lower() or "urgent" in result.reply.lower() or "doctor" in result.reply.lower()


def test_headache_with_red_flag_symptoms():
    """Test that red flags are recognized in headache context."""
    service = PregnancyChatService()
    result = service.answer(
        "I have headache with vision changes during pregnancy",
        "en",
        session_id="u9",
    )
    # Should not be restricted and should address the concern
    assert result.restricted is False
    assert "doctor" in result.reply.lower() or "urgent" in result.reply.lower() or "vision" in result.reply.lower()


def test_swelling_symptom_basic():
    """Test that swelling in pregnancy is recognized as pregnancy-related."""
    service = PregnancyChatService()
    result = service.answer(
        "I have swelling in pregnancy",
        "en",
        session_id="u10",
    )
    # Should not be restricted - it's pregnancy-related
    assert result.restricted is False


def test_dizziness_symptom_basic():
    """Test that dizziness in pregnancy context is not restricted."""
    service = PregnancyChatService()
    result = service.answer(
        "I feel dizzy during my pregnancy what should I do",
        "en",
        session_id="u11",
    )
    # Should not be restricted - includes pregnancy context
    assert result.restricted is False


def test_constipation_symptom_basic():
    """Test that constipation in pregnancy context is handled."""
    service = PregnancyChatService()
    result = service.answer(
        "I have constipation problems in pregnancy",
        "en",
        session_id="u12",
    )
    # Should not be restricted - includes pregnancy context
    assert result.restricted is False


def test_nepali_headache_response():
    """Test that Nepali headache responses work correctly."""
    service = PregnancyChatService()
    result = service.answer(
        "गर्भावस्थामा टाउको दुखाइ",
        "ne",
        session_id="u13",
    )
    assert result.restricted is False
    # Check for helpful response in Nepali
    assert len(result.reply) > 0  # Should return a response
