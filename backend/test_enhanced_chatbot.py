import requests

test_cases = [
    ('Hi, I cannot sleep and I feel very tired', 'Sleep/Fatigue'),
    ('I have heartburn, what can I eat?', 'Heartburn'),
    ('Why am I so anxious and worried?', 'Mental Health'),
    ('Is it safe to have sex during pregnancy?', 'Intimacy'),
    ('Tell me about postpartum recovery', 'Postpartum'),
    ('I am constipated, what to do?', 'Constipation'),
    ('My skin has changed with rash and marks', 'Skin Changes'),
]

print("=" * 70)
print("TESTING ENHANCED CHATBOT WITH NEW COMPREHENSIVE CATEGORIES")
print("=" * 70)

for msg, category in test_cases:
    try:
        resp = requests.post('http://localhost:8001/api/chat', json={
            'message': msg,
            'language': 'en',
            'session_id': 'test_enhanced'
        }, timeout=5)
        
        if resp.status_code == 200:
            result = resp.json()
            print(f'\n✓ {category}')
            print(f'  Confidence: {result.get("confidence")}')
            print(f'  Intent: {result.get("intent")}')
            reply = result.get("reply", "")
            print(f'  Response: {reply[:140]}...\n')
        else:
            print(f'\n✗ {category} - Status {resp.status_code}')
    except Exception as e:
        print(f'\n✗ {category} - Error: {e}')

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
