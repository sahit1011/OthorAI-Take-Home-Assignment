#!/usr/bin/env python3
"""
Test script for authentication system
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_signup():
    """Test user signup"""
    print("Testing user signup...")
    
    signup_data = {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
    
    if response.status_code == 201:
        print("✅ Signup successful!")
        print(f"User created: {response.json()}")
        return True
    else:
        print(f"❌ Signup failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def test_login():
    """Test user login"""
    print("\nTesting user login...")
    
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        print("✅ Login successful!")
        token_data = response.json()
        print(f"Token received: {token_data['access_token'][:20]}...")
        return token_data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Error: {response.text}")
        return None

def test_protected_endpoint(token):
    """Test accessing protected endpoint"""
    print("\nTesting protected endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if response.status_code == 200:
        print("✅ Protected endpoint access successful!")
        user_data = response.json()
        print(f"User profile: {user_data}")
        return True
    else:
        print(f"❌ Protected endpoint access failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def test_upload_endpoint(token):
    """Test accessing protected upload endpoint"""
    print("\nTesting protected upload endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Create a simple test file
    files = {
        'file': ('test.csv', 'name,age\nJohn,25\nJane,30', 'text/csv')
    }
    
    response = requests.post(f"{BASE_URL}/upload/", headers=headers, files=files)
    
    if response.status_code in [200, 201]:
        print("✅ Protected upload endpoint access successful!")
        print(f"Upload response: {response.json()}")
        return True
    else:
        print(f"❌ Protected upload endpoint access failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def main():
    """Run all authentication tests"""
    print("🧪 Starting Authentication System Tests\n")
    
    # Test signup
    signup_success = test_signup()
    
    # Test login
    token = test_login()
    
    if token:
        # Test protected endpoints
        test_protected_endpoint(token)
        test_upload_endpoint(token)
    
    print("\n🏁 Authentication tests completed!")

if __name__ == "__main__":
    main()
