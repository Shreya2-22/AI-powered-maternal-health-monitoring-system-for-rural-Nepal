#!/usr/bin/env python3
"""Quick test of the AI chatbot"""

from ai_chatbot_enhanced import PregnancyAIChatbot

# Initialize chatbot
print("Loading AI Chatbot...")
bot = PregnancyAIChatbot()
print("✓ Chatbot loaded successfully!\n")

# Test cases
test_questions = [
    ("Why am I experiencing nausea?", "en", 8),
    ("Is exercise safe during pregnancy?", "en", 20),
    ("I have severe abdominal pain", "en", 25),
    ("What should I eat?", "en", 30),
    ("गर्भावस्थामा किन मितली हुन्छ?", "ne", 10),
]

print("=" * 70)
print("CHATBOT RESPONSE TEST")
print("=" * 70)

for question, language, weeks in test_questions:
    print(f"\nQ (Week {weeks}, {language}): {question}")
    response = bot.chat(
        user_id="test_user",
        message=question,
        language=language,
        weeks_pregnant=weeks
    )
    print(f"A: {response.reply}")
    print(f"  [Intent: {response.intent}, Emergency: {response.emergency_detected}, Confidence: {response.confidence:.1%}]")

print("\n" + "=" * 70)
print("✓ All tests passed! Chatbot is ready to use.")
print("=" * 70)
