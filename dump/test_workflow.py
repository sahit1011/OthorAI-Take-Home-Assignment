#!/usr/bin/env python3
"""
Complete workflow testing script for Othor AI
Tests the entire pipeline: Upload -> Profile -> Train -> Predict
"""

import requests
import json
import time
import os

# Configuration
API_BASE_URL = "http://127.0.0.1:8001"
SAMPLE_CSV_PATH = "data/samples/customer_churn_sample.csv"

def test_health():
    """Test API health"""
    print("🔍 Testing API Health...")
    response = requests.get(f"{API_BASE_URL}/health")
    if response.status_code == 200:
        print("✅ API is healthy!")
        print(f"   Response: {response.json()}")
        return True
    else:
        print(f"❌ API health check failed: {response.status_code}")
        return False

def test_upload():
    """Test file upload"""
    print("\n📤 Testing File Upload...")
    
    if not os.path.exists(SAMPLE_CSV_PATH):
        print(f"❌ Sample CSV file not found: {SAMPLE_CSV_PATH}")
        return None
    
    with open(SAMPLE_CSV_PATH, 'rb') as file:
        files = {'file': ('customer_churn_sample.csv', file, 'text/csv')}
        response = requests.post(f"{API_BASE_URL}/upload/", files=files)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ File uploaded successfully!")
        print(f"   Session ID: {data['session_id']}")
        print(f"   Rows: {data['rows']}, Columns: {data['columns']}")
        print(f"   File size: {data['file_size']} bytes")
        return data['session_id']
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_profile(session_id):
    """Test data profiling"""
    print(f"\n📊 Testing Data Profiling for session: {session_id}")
    
    response = requests.get(f"{API_BASE_URL}/profile/{session_id}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Data profiling successful!")
        print(f"   Dataset: {data['dataset_info']['rows']} rows, {data['dataset_info']['columns']} columns")
        print(f"   Data quality: {data['data_quality']['completeness']:.1f}% complete")
        print(f"   Columns analyzed: {len(data['column_profiles'])}")
        
        # Show some column details
        for col_name, col_info in list(data['column_profiles'].items())[:3]:
            unique_count = col_info.get('unique_values', 'N/A')
            col_type = col_info.get('type', 'unknown')
            print(f"   - {col_name}: {col_type}, {unique_count} unique values")
        
        return data
    else:
        print(f"❌ Profiling failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_training(session_id, profile_data):
    """Test model training"""
    print(f"\n🤖 Testing Model Training for session: {session_id}")
    
    # Find a suitable target column (should be 'churn' in our sample)
    target_column = None
    for col_name, col_info in profile_data['column_profiles'].items():
        if 'churn' in col_name.lower() or 'target' in col_name.lower():
            target_column = col_name
            break
    
    if not target_column:
        # Fallback to first categorical column with reasonable cardinality
        for col_name, col_info in profile_data['column_profiles'].items():
            unique_count = col_info.get('unique_values', 0)
            if col_info.get('type') == 'categorical' and 2 <= unique_count <= 10:
                target_column = col_name
                break
    
    if not target_column:
        print("❌ No suitable target column found")
        return None
    
    print(f"   Using target column: {target_column}")
    
    training_request = {
        "session_id": session_id,
        "target_column": target_column,
        "algorithm": "random_forest",
        "model_type": "auto",
        "test_size": 0.2,
        "random_state": 42
    }
    
    response = requests.post(f"{API_BASE_URL}/train/", json=training_request)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Model training successful!")
        print(f"   Model ID: {data['model_id']}")
        print(f"   Algorithm: {data['algorithm']}")
        print(f"   Model type: {data['model_type']}")
        
        # Show evaluation metrics
        metrics = data['evaluation_metrics']
        print("   Evaluation metrics:")
        for metric, value in metrics.items():
            if isinstance(value, float):
                print(f"     - {metric}: {value:.3f}")
            else:
                print(f"     - {metric}: {value}")
        
        return data
    else:
        print(f"❌ Training failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_prediction(model_data, profile_data):
    """Test model prediction"""
    print(f"\n🔮 Testing Model Prediction...")
    
    model_id = model_data['model_id']
    target_column = model_data.get('target_column', 'churn')  # Default to 'churn' if not in response
    
    # Create sample prediction data (exclude target column)
    features = [col for col in profile_data['column_profiles'].keys() if col != target_column]
    
    # Create a sample prediction row based on the first row of our CSV
    sample_data = {
        "customer_id": "TEST_001",
        "age": 30,
        "income": 50000,
        "tenure_months": 24,
        "monthly_charges": 75.50,
        "total_charges": 1812.00,
        "contract_type": "One year",
        "payment_method": "Credit card",
        "internet_service": "Fiber optic",
        "phone_service": "Yes",
        "multiple_lines": "No",
        "online_security": "Yes",
        "online_backup": "No",
        "device_protection": "Yes",
        "tech_support": "Yes",
        "streaming_tv": "No",
        "streaming_movies": "Yes",
        "paperless_billing": "No"
    }
    
    # Filter to only include features that exist in the model
    filtered_data = {k: v for k, v in sample_data.items() if k in features}
    
    prediction_request = {
        "model_id": model_id,
        "data": [filtered_data]
    }
    
    response = requests.post(f"{API_BASE_URL}/predict/", json=prediction_request)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Prediction successful!")
        
        predictions = data['predictions']
        for i, pred in enumerate(predictions):
            print(f"   Prediction {i+1}:")
            print(f"     - Result: {pred['prediction']}")
            print(f"     - Confidence: {pred.get('confidence', 'N/A')}")
            if 'probabilities' in pred and pred['probabilities']:
                print("     - Probabilities:")
                for class_name, prob in pred['probabilities'].items():
                    print(f"       * {class_name}: {prob:.3f}")
        
        return data
    else:
        print(f"❌ Prediction failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def main():
    """Run complete workflow test"""
    print("🚀 Starting Complete Workflow Test for Othor AI")
    print("=" * 60)
    
    # Test 1: Health Check
    if not test_health():
        print("❌ Stopping tests - API is not healthy")
        return
    
    # Test 2: File Upload
    session_id = test_upload()
    if not session_id:
        print("❌ Stopping tests - Upload failed")
        return
    
    # Test 3: Data Profiling
    profile_data = test_profile(session_id)
    if not profile_data:
        print("❌ Stopping tests - Profiling failed")
        return
    
    # Test 4: Model Training
    model_data = test_training(session_id, profile_data)
    if not model_data:
        print("❌ Stopping tests - Training failed")
        return
    
    # Test 5: Prediction
    prediction_data = test_prediction(model_data, profile_data)
    if not prediction_data:
        print("❌ Stopping tests - Prediction failed")
        return
    
    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED! Complete workflow is working!")
    print(f"📋 Summary:")
    print(f"   - Session ID: {session_id}")
    print(f"   - Model ID: {model_data['model_id']}")
    print(f"   - Target Column: {model_data.get('target_column', 'churn')}")
    print(f"   - Algorithm: {model_data['algorithm']}")
    print(f"   - Frontend URL: http://localhost:3001")
    print(f"   - Profile URL: http://localhost:3001/profile/{session_id}")
    print(f"   - Training URL: http://localhost:3001/train/{session_id}")
    print(f"   - Prediction URL: http://localhost:3001/predict/{session_id}?model_id={model_data['model_id']}")

if __name__ == "__main__":
    main()
