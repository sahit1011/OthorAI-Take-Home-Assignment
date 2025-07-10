#!/usr/bin/env python3
"""
Test script to verify model prediction endpoints are working correctly
"""
import requests
import json
import sys
from typing import Dict, Any

# API Configuration
API_BASE_URL = "http://localhost:8001"

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API Health Check: PASSED")
            return True
        else:
            print(f"❌ API Health Check: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ API Health Check: FAILED (Error: {e})")
        return False

def test_list_models():
    """Test listing available models (without auth)"""
    try:
        response = requests.get(f"{API_BASE_URL}/predict/models", timeout=10)
        if response.status_code == 200:
            data = response.json()
            model_count = data.get('count', 0)
            print(f"✅ List Models: PASSED ({model_count} models found)")
            return data.get('models', [])
        elif response.status_code == 401:
            print("⚠️  List Models: Requires Authentication")
            return None
        else:
            print(f"❌ List Models: FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ List Models: FAILED (Error: {e})")
        return None

def authenticate_user(username: str = "testuser", password: str = "testpass123"):
    """Authenticate user and return token"""
    try:
        payload = {
            "username": username,
            "password": password
        }
        response = requests.post(f"{API_BASE_URL}/auth/login", json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Authentication: PASSED (User: {username})")
            return token
        else:
            print(f"❌ Authentication: FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Authentication: FAILED (Error: {e})")
        return None

def test_model_info(model_id: str, token: str = None):
    """Test getting model info (with optional auth)"""
    try:
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        response = requests.get(f"{API_BASE_URL}/predict/model/{model_id}/info", headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"✅ Model Info ({model_id}): PASSED")
            return response.json()
        elif response.status_code == 401 or response.status_code == 403:
            print(f"⚠️  Model Info ({model_id}): Requires Authentication")
            return None
        elif response.status_code == 404:
            print(f"❌ Model Info ({model_id}): Model Not Found")
            return None
        else:
            print(f"❌ Model Info ({model_id}): FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Model Info ({model_id}): FAILED (Error: {e})")
        return None

def test_prediction(model_id: str, sample_data: Dict[str, Any], token: str = None):
    """Test making a prediction (requires auth)"""
    try:
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        payload = {
            "model_id": model_id,
            "data": [sample_data]
        }
        response = requests.post(
            f"{API_BASE_URL}/predict/",
            json=payload,
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            print(f"✅ Prediction ({model_id}): PASSED")
            return response.json()
        elif response.status_code == 401 or response.status_code == 403:
            print(f"⚠️  Prediction ({model_id}): Requires Authentication")
            return None
        elif response.status_code == 404:
            print(f"❌ Prediction ({model_id}): Model Not Found")
            return None
        else:
            print(f"❌ Prediction ({model_id}): FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Prediction ({model_id}): FAILED (Error: {e})")
        return None

def main():
    """Run all tests"""
    print("🧪 Testing Model Prediction Endpoints")
    print("=" * 50)
    
    # Test 1: Health Check
    if not test_health_check():
        print("❌ API is not running. Please start the backend server.")
        sys.exit(1)
    
    print()
    
    # Test 2: List Models
    models = test_list_models()
    if models is None:
        print("⚠️  Cannot test further without model list")
        return
    
    if not models:
        print("⚠️  No models available for testing")
        return
    
    print()

    # Test 3: Try to authenticate (optional - will use default test user)
    print("🔐 Testing Authentication...")
    token = authenticate_user()

    print()

    # Test 4: Model Info for first available model (with auth if available)
    first_model = models[0]
    model_id = first_model.get('model_id')
    if model_id:
        model_info = test_model_info(model_id, token)

        print()

        # Test 5: Sample Prediction (if we have model info and auth)
        if model_info and 'features' in model_info and token:
            features = model_info['features'].get('all_features', [])
            if features:
                # Create sample data with dummy values
                sample_data = {feature: 1.0 for feature in features[:5]}  # Use first 5 features
                test_prediction(model_id, sample_data, token)
            else:
                print("⚠️  No feature information available for prediction test")
        else:
            if not token:
                print("⚠️  Cannot test prediction without authentication")
            else:
                print("⚠️  Cannot test prediction without model info")
    
    print()
    print("🏁 Testing Complete")

if __name__ == "__main__":
    main()
