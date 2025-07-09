"""
Test script to verify authentication is working after bcrypt fix.
"""
import requests
import json
import time
import random

# API base URL
BASE_URL = "http://localhost:8001"

def test_authentication_flow():
    """Test user creation and authentication flow."""
    
    print("🔐 Testing Authentication Flow After bcrypt Fix")
    print("=" * 60)
    
    # Generate a unique username to avoid conflicts
    timestamp = int(time.time())
    random_num = random.randint(1000, 9999)
    username = f"testuser_{timestamp}_{random_num}"
    email = f"test_{timestamp}_{random_num}@example.com"
    password = "testpassword123"
    
    print(f"Creating user: {username}")
    print(f"Email: {email}")
    
    # Step 1: Create a new user
    print("\n1. Creating new test user...")
    signup_data = {
        "email": email,
        "username": username,
        "full_name": "Test User",
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
        print(f"Signup response status: {response.status_code}")
        
        if response.status_code == 201:
            user_data = response.json()
            print("✅ User created successfully!")
            print(f"   User ID: {user_data['id']}")
            print(f"   Username: {user_data['username']}")
            print(f"   Email: {user_data['email']}")
        else:
            print(f"❌ User creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False
    
    # Step 2: Login with the new user
    print("\n2. Testing login...")
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data["access_token"]
            print("✅ Login successful!")
            print(f"   Token type: {token_data['token_type']}")
            print(f"   Token (first 20 chars): {token[:20]}...")
            
            # Step 3: Test authenticated endpoint
            print("\n3. Testing authenticated endpoint...")
            headers = {"Authorization": f"Bearer {token}"}
            
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            if response.status_code == 200:
                user_profile = response.json()
                print("✅ Authenticated endpoint working!")
                print(f"   Profile username: {user_profile['username']}")
                print(f"   Profile email: {user_profile['email']}")
            else:
                print(f"❌ Authenticated endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
            # Step 4: Test file history endpoint (should be empty)
            print("\n4. Testing file history endpoint...")
            response = requests.get(f"{BASE_URL}/history/files", headers=headers)
            if response.status_code == 200:
                file_history = response.json()
                print(f"✅ File history endpoint working! Found {len(file_history)} files")
            else:
                print(f"❌ File history endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
            # Step 5: Test model history endpoint (should be empty)
            print("\n5. Testing model history endpoint...")
            response = requests.get(f"{BASE_URL}/history/models", headers=headers)
            if response.status_code == 200:
                model_history = response.json()
                print(f"✅ Model history endpoint working! Found {len(model_history)} models")
            else:
                print(f"❌ Model history endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
            # Step 6: Test user stats endpoint
            print("\n6. Testing user stats endpoint...")
            response = requests.get(f"{BASE_URL}/history/stats", headers=headers)
            if response.status_code == 200:
                stats = response.json()
                print("✅ User stats endpoint working!")
                print(f"   Total files: {stats['file_statistics']['total_files']}")
                print(f"   Total models: {stats['model_statistics']['total_models']}")
            else:
                print(f"❌ User stats endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
            
            return True
            
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return False

def test_password_hashing():
    """Test password hashing directly."""
    print("\n🔧 Testing Password Hashing Directly...")
    
    try:
        from app.auth.security import get_password_hash, verify_password
        
        test_password = "testpassword123"
        print(f"Testing password: {test_password}")
        
        # Test hashing
        hashed = get_password_hash(test_password)
        print(f"✅ Password hashed successfully")
        print(f"   Hash (first 20 chars): {hashed[:20]}...")
        
        # Test verification
        is_valid = verify_password(test_password, hashed)
        if is_valid:
            print("✅ Password verification successful")
        else:
            print("❌ Password verification failed")
            return False
            
        # Test wrong password
        is_invalid = verify_password("wrongpassword", hashed)
        if not is_invalid:
            print("✅ Wrong password correctly rejected")
        else:
            print("❌ Wrong password incorrectly accepted")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Password hashing test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing bcrypt Fix and Authentication")
    print("=" * 60)
    
    # Test password hashing directly
    hash_test = test_password_hashing()
    
    if hash_test:
        print("\n" + "=" * 60)
        # Test full authentication flow
        auth_test = test_authentication_flow()
        
        if auth_test:
            print("\n" + "=" * 60)
            print("🎉 ALL TESTS PASSED!")
            print("✅ bcrypt issue has been resolved")
            print("✅ User creation working")
            print("✅ Authentication working")
            print("✅ Database integration working")
            print("✅ All history endpoints working")
            print("\n🚀 Task 8.2 is fully functional!")
        else:
            print("\n❌ Authentication flow test failed")
    else:
        print("\n❌ Password hashing test failed")
