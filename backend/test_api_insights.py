"""
Test the personalized insights API endpoint
"""
import asyncio
import json
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_personalized_insights():
    """Test the /api/personalized-insights endpoint"""
    
    # Test case 1: Standard request
    response = client.post('/api/personalized-insights', json={
        'user_id': 'test_user',
        'user_age': 28,
        'weeks_pregnant': 20,
        'health_records': [
            {'weight': 65, 'symptoms': 'nausea'},
            {'weight': 65.5, 'systolic': 120, 'diastolic': 80}
        ],
        'language': 'en',
        'limit': 3
    })
    
    print(f"Test 1 - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - Insights count: {data.get('count', 0)}")
        print(f"  - Summary: {data.get('summary', 'N/A')}")
        print("  PASS")
    else:
        print(f"  ERROR: {response.text}")
        return False
    
    # Test case 2: Nepali request
    response = client.post('/api/personalized-insights', json={
        'user_id': 'test_user_2',
        'user_age': 16,
        'weeks_pregnant': 12,
        'health_records': [],
        'language': 'ne',
        'limit': 2
    })
    
    print(f"\nTest 2 - Nepali - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - Insights count: {data.get('count', 0)}")
        print("  PASS")
    else:
        print(f"  ERROR: {response.text}")
        return False
    
    # Test case 3: Edge case - no health records
    response = client.post('/api/personalized-insights', json={
        'user_id': 'test_user_3',
        'user_age': 35,
        'weeks_pregnant': 30,
        'health_records': [],
        'language': 'en',
        'limit': 1
    })
    
    print(f"\nTest 3 - No records - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - Insights count: {data.get('count', 0)}")
        print("  PASS")
    else:
        print(f"  ERROR: {response.text}")
        return False
    
    return True

if __name__ == '__main__':
    print("Testing /api/personalized-insights endpoint...")
    if test_personalized_insights():
        print("\nAll endpoint tests: PASS")
    else:
        print("\nSome tests failed")
