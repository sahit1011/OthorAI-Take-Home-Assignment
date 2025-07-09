"""
Test script for the complete ML pipeline
"""
import requests
import json
import time

# API base URL
BASE_URL = "http://127.0.0.1:8001"

def test_complete_pipeline():
    """Test the complete ML pipeline from upload to prediction"""
    
    print("🚀 Testing Complete ML Pipeline")
    print("=" * 50)
    
    # Step 1: Upload CSV file
    print("\n1. Uploading CSV file...")
    
    with open("data/samples/test_classification.csv", "rb") as f:
        files = {"file": ("test_classification.csv", f, "text/csv")}
        response = requests.post(f"{BASE_URL}/upload/", files=files)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)
        return
    
    upload_data = response.json()
    session_id = upload_data["session_id"]
    print(f"✅ Upload successful! Session ID: {session_id}")
    print(f"   Dataset: {upload_data['rows']} rows, {upload_data['columns']} columns")
    
    # Step 2: Get data profile
    print("\n2. Getting data profile...")
    
    response = requests.get(f"{BASE_URL}/profile/{session_id}")
    if response.status_code != 200:
        print(f"❌ Profile failed: {response.status_code}")
        print(response.text)
        return
    
    profile_data = response.json()
    print("✅ Data profiling successful!")
    print(f"   Correlations found: {len(profile_data['correlations'])}")
    print(f"   Data quality score: {profile_data['data_quality']['completeness']:.2f}")
    
    # Step 3: Train model
    print("\n3. Training ML model...")
    
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "model_type": "auto",
        "algorithm": "random_forest",
        "test_size": 0.2,
        "random_state": 42
    }
    
    response = requests.post(f"{BASE_URL}/train/", json=train_request)
    if response.status_code != 200:
        print(f"❌ Training failed: {response.status_code}")
        print(response.text)
        return
    
    train_data = response.json()
    model_id = train_data["model_id"]
    print(f"✅ Training successful! Model ID: {model_id}")
    print(f"   Model type: {train_data['model_type']}")
    print(f"   Algorithm: {train_data['algorithm']}")
    print(f"   Accuracy: {train_data['evaluation_metrics'].get('accuracy', 'N/A'):.3f}")
    
    # Step 4: Make predictions
    print("\n4. Making predictions...")
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "age": 35,
                "income": 60000,
                "education": "Master",
                "experience": 10
            },
            {
                "age": 25,
                "income": 35000,
                "education": "Bachelor",
                "experience": 2
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/predict/", json=predict_request)
    if response.status_code != 200:
        print(f"❌ Prediction failed: {response.status_code}")
        print(response.text)
        return
    
    predict_data = response.json()
    print("✅ Predictions successful!")
    
    for i, pred in enumerate(predict_data["predictions"]):
        print(f"   Sample {i+1}: Prediction = {pred['prediction']}, Confidence = {pred['confidence']:.3f}")
        if pred.get('probabilities'):
            print(f"              Probabilities: {pred['probabilities']}")
    
    # Step 5: Get model summary
    print("\n5. Getting model summary...")
    
    response = requests.get(f"{BASE_URL}/summary/{model_id}")
    if response.status_code != 200:
        print(f"❌ Summary failed: {response.status_code}")
        print(response.text)
        return
    
    summary_data = response.json()
    print("✅ Summary generated successfully!")
    print(f"   Natural Language Summary:")
    print(f"   {summary_data['natural_language_summary']}")
    
    # Step 6: List available models
    print("\n6. Listing available models...")
    
    response = requests.get(f"{BASE_URL}/predict/models")
    if response.status_code == 200:
        models_data = response.json()
        print(f"✅ Found {models_data['count']} available models")
        for model in models_data['models'][:3]:  # Show first 3
            print(f"   - {model['model_id']}: {model['algorithm']} ({model['problem_type']})")
    
    print("\n🎉 Complete ML Pipeline Test Successful!")
    print("=" * 50)
    
    return {
        "session_id": session_id,
        "model_id": model_id,
        "upload_data": upload_data,
        "train_data": train_data,
        "predict_data": predict_data,
        "summary_data": summary_data
    }

def test_api_endpoints():
    """Test individual API endpoints"""
    
    print("\n🔍 Testing Individual API Endpoints")
    print("=" * 50)
    
    # Test health check
    print("\n1. Health check...")
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        print("✅ Health check passed")
    else:
        print(f"❌ Health check failed: {response.status_code}")
    
    # Test supported algorithms
    print("\n2. Getting supported algorithms...")
    response = requests.get(f"{BASE_URL}/train/algorithms")
    if response.status_code == 200:
        algorithms = response.json()
        print(f"✅ Found {len(algorithms['algorithms'])} supported algorithms")
        for alg_name in algorithms['algorithms'].keys():
            print(f"   - {alg_name}")
    else:
        print(f"❌ Failed to get algorithms: {response.status_code}")

if __name__ == "__main__":
    try:
        # Test individual endpoints first
        test_api_endpoints()
        
        # Test complete pipeline
        result = test_complete_pipeline()
        
        print(f"\n📊 Test Results Summary:")
        print(f"Session ID: {result['session_id']}")
        print(f"Model ID: {result['model_id']}")
        print(f"Dataset: {result['upload_data']['rows']} rows")
        print(f"Model Accuracy: {result['train_data']['evaluation_metrics'].get('accuracy', 'N/A')}")
        print(f"Predictions Made: {len(result['predict_data']['predictions'])}")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
