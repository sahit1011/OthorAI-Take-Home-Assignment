#!/usr/bin/env python3
"""
Comprehensive test script for Othor AI workflow
Tests all phases from upload to prediction
"""

import requests
import json
import time
import os
import pandas as pd
from pathlib import Path

# Configuration
API_BASE_URL = "http://127.0.0.1:8001"
FRONTEND_URL = "http://localhost:3001"

def create_test_csv():
    """Create a test CSV file for testing"""
    # Create a larger dataset with more balanced classes
    import random
    random.seed(42)

    categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports']
    targets = ['High', 'Medium', 'Low']

    data = {
        'customer_id': [f'CUST_{i:03d}' for i in range(1, 26)],  # 25 customers
        'age': [random.randint(18, 70) for _ in range(25)],
        'income': [random.randint(25000, 120000) for _ in range(25)],
        'category': [random.choice(categories) for _ in range(25)],
        'purchase_amount': [round(random.uniform(10, 2000), 2) for _ in range(25)],
        'days_since_last_purchase': [random.randint(1, 90) for _ in range(25)],
        'total_purchases': [random.randint(1, 50) for _ in range(25)],
        'target_variable': []
    }

    # Create balanced target variable based on some logic
    for i in range(25):
        if data['income'][i] > 80000 and data['total_purchases'][i] > 20:
            target = 'High'
        elif data['income'][i] > 50000 and data['total_purchases'][i] > 10:
            target = 'Medium'
        else:
            target = 'Low'
        data['target_variable'].append(target)

    # Ensure we have at least 3 samples of each class
    target_counts = pd.Series(data['target_variable']).value_counts()
    for target in targets:
        if target_counts.get(target, 0) < 3:
            # Add more samples of this target
            for i in range(3 - target_counts.get(target, 0)):
                data['target_variable'][i] = target

    df = pd.DataFrame(data)
    test_file = "test_data.csv"
    df.to_csv(test_file, index=False)
    return test_file

def test_backend_health():
    """Test backend health endpoint"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_file_upload():
    """Test file upload endpoint"""
    print("\n📤 Testing file upload...")
    
    # Create test CSV
    test_file = create_test_csv()
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': (test_file, f, 'text/csv')}
            response = requests.post(f"{API_BASE_URL}/upload/", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ File upload successful")
            print(f"   Session ID: {result['session_id']}")
            print(f"   Rows: {result['rows']}, Columns: {result['columns']}")
            
            # Clean up test file
            os.remove(test_file)
            return result['session_id']
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ File upload failed: {e}")
        return None

def test_data_profiling(session_id):
    """Test data profiling endpoint"""
    print(f"\n📊 Testing data profiling for session {session_id}...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/profile/{session_id}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Data profiling successful")
            print(f"   Columns analyzed: {len(result.get('column_profiles', {}))}")
            return True
        else:
            print(f"❌ Data profiling failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Data profiling failed: {e}")
        return False

def test_model_training(session_id):
    """Test model training endpoint"""
    print(f"\n🤖 Testing model training for session {session_id}...")
    
    try:
        train_request = {
            "session_id": session_id,
            "target_column": "target_variable",
            "algorithm": "random_forest"
        }
        
        response = requests.post(f"{API_BASE_URL}/train/", json=train_request)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Model training successful")
            print(f"   Model ID: {result['model_id']}")
            print(f"   Algorithm: {result['algorithm']}")
            print(f"   Accuracy: {result.get('accuracy', 'N/A')}")
            return result['model_id']
        else:
            print(f"❌ Model training failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Model training failed: {e}")
        return None

def test_predictions(model_id):
    """Test prediction endpoint"""
    print(f"\n🔮 Testing predictions with model {model_id}...")
    
    try:
        predict_request = {
            "model_id": model_id,
            "data": [
                {
                    "customer_id": "CUST_TEST",
                    "age": 30,
                    "income": 50000,
                    "category": "Electronics",
                    "purchase_amount": 299.99,
                    "days_since_last_purchase": 10,
                    "total_purchases": 5
                }
            ]
        }
        
        response = requests.post(f"{API_BASE_URL}/predict/", json=predict_request)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Predictions successful")
            print(f"   Predictions: {len(result['predictions'])}")
            for i, pred in enumerate(result['predictions']):
                print(f"   Prediction {i+1}: {pred['prediction']} (confidence: {pred['confidence']:.2f})")
            return True
        else:
            print(f"❌ Predictions failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Predictions failed: {e}")
        return False

def test_summary_generation(session_id):
    """Test summary generation endpoint"""
    print(f"\n📝 Testing summary generation for session {session_id}...")

    try:
        response = requests.get(f"{API_BASE_URL}/summary/session/{session_id}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Summary generation successful")
            print(f"   Dataset summary length: {len(result.get('dataset_summary', ''))}")
            return True
        else:
            print(f"❌ Summary generation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Summary generation failed: {e}")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print(f"\n🌐 Testing frontend accessibility at {FRONTEND_URL}...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

def main():
    """Run comprehensive workflow test"""
    print("🚀 Starting Comprehensive Othor AI Workflow Test")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'backend_health': False,
        'frontend_access': False,
        'file_upload': False,
        'data_profiling': False,
        'model_training': False,
        'predictions': False,
        'summary_generation': False
    }
    
    # Test backend health
    results['backend_health'] = test_backend_health()
    
    # Test frontend accessibility
    results['frontend_access'] = test_frontend_accessibility()
    
    if not results['backend_health']:
        print("\n❌ Backend is not healthy. Stopping tests.")
        return results
    
    # Test file upload
    session_id = test_file_upload()
    if session_id:
        results['file_upload'] = True
        
        # Test data profiling
        if test_data_profiling(session_id):
            results['data_profiling'] = True
            
            # Test model training
            model_id = test_model_training(session_id)
            if model_id:
                results['model_training'] = True
                
                # Test predictions
                if test_predictions(model_id):
                    results['predictions'] = True
            
            # Test summary generation
            if test_summary_generation(session_id):
                results['summary_generation'] = True
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title():<25} {status}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Your implementation is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the issues above for debugging.")
    
    return results

if __name__ == "__main__":
    main()
