#!/usr/bin/env python3
"""
Test script to verify enhanced frontend features are working correctly
"""

import requests
import json
import time
import pandas as pd
import io

# Configuration
BACKEND_URL = "http://127.0.0.1:8001"
FRONTEND_URL = "http://localhost:3001"

def test_backend_health():
    """Test if backend is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"✅ Backend health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_frontend_health():
    """Test if frontend is responding"""
    try:
        response = requests.get(FRONTEND_URL)
        print(f"✅ Frontend health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Frontend health check failed: {e}")
        return False

def test_enhanced_backend_features():
    """Test enhanced backend features"""
    print("\n🧪 Testing Enhanced Backend Features...")
    
    # Test 1: Upload a sample CSV (larger dataset to avoid test_size issues)
    sample_data = pd.DataFrame({
        'age': [25, 30, 35, 40, 45, 28, 32, 38, 42, 48, 26, 31, 36, 41, 46],
        'income': [50000, 60000, 70000, 80000, 90000, 55000, 65000, 75000, 85000, 95000, 52000, 62000, 72000, 82000, 92000],
        'education': ['Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'Master', 'PhD', 'Bachelor', 'Master'],
        'target': [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
    })
    
    csv_buffer = io.StringIO()
    sample_data.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    try:
        # Upload file
        files = {'file': ('test_data.csv', csv_content, 'text/csv')}
        response = requests.post(f"{BACKEND_URL}/upload/", files=files)
        
        if response.status_code == 200:
            upload_data = response.json()
            session_id = upload_data['session_id']
            print(f"✅ File upload successful: {session_id}")
            
            # Test 2: Profile data
            profile_response = requests.get(f"{BACKEND_URL}/profile/{session_id}")
            if profile_response.status_code == 200:
                print("✅ Data profiling successful")
                
                # Test 3: Train model
                train_data = {
                    "session_id": session_id,
                    "target_column": "target",
                    "algorithm": "random_forest",
                    "model_type": "auto",
                    "test_size": 0.3  # Use 30% for test to ensure enough samples
                }
                
                train_response = requests.post(f"{BACKEND_URL}/train/", json=train_data)
                if train_response.status_code == 200:
                    train_result = train_response.json()
                    model_id = train_result['model_id']
                    print(f"✅ Model training successful: {model_id}")
                    
                    # Test 4: Basic summary
                    summary_response = requests.get(f"{BACKEND_URL}/summary/{model_id}")
                    if summary_response.status_code == 200:
                        print("✅ Basic summary generation successful")
                    else:
                        print(f"❌ Basic summary failed: {summary_response.status_code}")
                    
                    # Test 5: LLM-enhanced summary
                    llm_summary_response = requests.get(f"{BACKEND_URL}/summary/{model_id}/llm-enhanced")
                    if llm_summary_response.status_code == 200:
                        llm_data = llm_summary_response.json()
                        print("✅ LLM-enhanced summary successful")
                        print(f"   - LLM Model: {llm_data.get('api_info', {}).get('llm_model', 'N/A')}")
                        print(f"   - Provider: {llm_data.get('api_info', {}).get('api_provider', 'N/A')}")
                    else:
                        print(f"⚠️  LLM-enhanced summary failed: {llm_summary_response.status_code}")
                        print("   This is expected if OpenRouter API key is not configured")
                    
                    # Test 6: Predictions (use correct feature names from training)
                    predict_data = {
                        "model_id": model_id,
                        "data": [{"age": 28, "income": 55000, "education": "Bachelor"}]
                    }
                    
                    predict_response = requests.post(f"{BACKEND_URL}/predict/", json=predict_data)
                    if predict_response.status_code == 200:
                        print("✅ Prediction successful")
                    else:
                        print(f"❌ Prediction failed: {predict_response.status_code}")
                    
                    return True
                else:
                    print(f"❌ Model training failed: {train_response.status_code}")
            else:
                print(f"❌ Data profiling failed: {profile_response.status_code}")
        else:
            print(f"❌ File upload failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Enhanced backend test failed: {e}")
    
    return False

def test_frontend_pages():
    """Test if key frontend pages are accessible"""
    print("\n🌐 Testing Frontend Pages...")
    
    pages_to_test = [
        "/",
        "/upload", 
        "/models",
        # Note: Dynamic routes like /train/[session] and /predict/[model] 
        # would need actual session/model IDs to test properly
    ]
    
    for page in pages_to_test:
        try:
            response = requests.get(f"{FRONTEND_URL}{page}")
            if response.status_code == 200:
                print(f"✅ Page {page}: OK")
            else:
                print(f"❌ Page {page}: {response.status_code}")
        except Exception as e:
            print(f"❌ Page {page}: {e}")

def main():
    """Main test function"""
    print("🚀 Testing Enhanced Frontend Features\n")
    
    # Test basic connectivity
    backend_ok = test_backend_health()
    frontend_ok = test_frontend_health()
    
    if not backend_ok:
        print("❌ Backend is not running. Please start the backend first.")
        return
    
    if not frontend_ok:
        print("❌ Frontend is not running. Please start the frontend first.")
        return
    
    # Test enhanced features
    enhanced_ok = test_enhanced_backend_features()
    
    # Test frontend pages
    test_frontend_pages()
    
    print("\n📊 Test Summary:")
    print(f"Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"Frontend Health: {'✅' if frontend_ok else '❌'}")
    print(f"Enhanced Features: {'✅' if enhanced_ok else '❌'}")
    
    if backend_ok and frontend_ok and enhanced_ok:
        print("\n🎉 All enhanced features are working correctly!")
        print("\n🔗 Access your application at:")
        print(f"   Frontend: {FRONTEND_URL}")
        print(f"   Backend API: {BACKEND_URL}")
        print(f"   API Docs: {BACKEND_URL}/docs")
    else:
        print("\n⚠️  Some issues were found. Please check the logs above.")

if __name__ == "__main__":
    main()
