#!/usr/bin/env python3
"""
Test script to simulate frontend upload and identify CORS issues
"""

import requests
import json
import os

# Configuration
API_BASE_URL = "http://127.0.0.1:8001"
FRONTEND_ORIGIN = "http://localhost:3001"

def test_cors_preflight():
    """Test CORS preflight request"""
    print("🔍 Testing CORS preflight request...")
    
    try:
        headers = {
            'Origin': FRONTEND_ORIGIN,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(f"{API_BASE_URL}/upload/", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ CORS preflight successful")
            return True
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS preflight failed: {e}")
        return False

def test_upload_with_cors():
    """Test file upload with CORS headers"""
    print("\n📤 Testing file upload with CORS headers...")
    
    # Create a simple test CSV
    csv_content = """customer_id,age,income,target
CUST_001,25,45000,High
CUST_002,34,62000,Medium
CUST_003,28,38000,Low"""
    
    test_file = "test_cors_upload.csv"
    with open(test_file, 'w') as f:
        f.write(csv_content)
    
    try:
        headers = {
            'Origin': FRONTEND_ORIGIN
        }
        
        with open(test_file, 'rb') as f:
            files = {'file': (test_file, f, 'text/csv')}
            response = requests.post(f"{API_BASE_URL}/upload/", files=files, headers=headers)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload with CORS successful")
            print(f"   Session ID: {result['session_id']}")
            return True
        else:
            print(f"❌ Upload with CORS failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Upload with CORS failed: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)

def test_backend_health():
    """Test backend health"""
    print("🔍 Testing backend health...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def main():
    """Run CORS and upload tests"""
    print("🚀 Testing Frontend Upload Issues")
    print("=" * 50)
    
    # Test backend health
    if not test_backend_health():
        print("\n❌ Backend is not healthy. Please check if it's running on port 8001.")
        return
    
    # Test CORS preflight
    cors_ok = test_cors_preflight()
    
    # Test upload with CORS
    upload_ok = test_upload_with_cors()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Backend Health:     {'✅ PASS' if True else '❌ FAIL'}")
    print(f"CORS Preflight:     {'✅ PASS' if cors_ok else '❌ FAIL'}")
    print(f"Upload with CORS:   {'✅ PASS' if upload_ok else '❌ FAIL'}")
    
    if cors_ok and upload_ok:
        print("\n🎉 All tests passed! The upload should work from the frontend.")
        print("💡 If you're still getting Network Error, try:")
        print("   1. Refresh the frontend page (Ctrl+F5)")
        print("   2. Clear browser cache")
        print("   3. Check browser console for more details")
    else:
        print("\n⚠️  Issues found. Check the CORS configuration.")

if __name__ == "__main__":
    main()
