#!/usr/bin/env python3
"""Quick test of the live API chatbot endpoint"""
import requests
import json
import time

time.sleep(2)  # Wait for server to fully start

BASE_URL = "http://localhost:8001/api"

print("Testing Live API Chatbot Endpoint")
print("=" * 60)

# Test 1: Basic pregnancy question
print("\n1️⃣  Testing pregnancy question...")
response = requests.post(
    f"{BASE_URL}/chat",
    json={
        "message": "Why do I feel nauseous?",
        "language": "en",
        "session_id": "test_session_1"
    },
    headers={"Authorization": "Bearer test_token"}
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Status: {response.status_code}")
    print(f"Response: {data.get('reply', 'No reply')[:100]}...")
else:
    print(f"❌ Status: {response.status_code}")
    print(f"Error: {response.text}")

# Test 2: Greeting
print("\n2️⃣  Testing greeting...")
response = requests.post(
    f"{BASE_URL}/chat",
    json={
        "message": "Hello! How are you?",
        "language": "en",
        "session_id": "test_session_2"
    },
    headers={"Authorization": "Bearer test_token"}
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Status: {response.status_code}")
    print(f"Response: {data.get('reply', 'No reply')[:100]}...")
else:
    print(f"❌ Status: {response.status_code}")

# Test 3: Non-pregnancy question
print("\n3️⃣  Testing non-pregnancy question...")
response = requests.post(
    f"{BASE_URL}/chat",
    json={
        "message": "What is the weather like?",
        "language": "en",
        "session_id": "test_session_3"
    },
    headers={"Authorization": "Bearer test_token"}
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Status: {response.status_code}")
    print(f"Response: {data.get('reply', 'No reply')[:100]}...")
else:
    print(f"❌ Status: {response.status_code}")

print("\n" + "=" * 60)
print("✅ API Test Complete!")
