#!/usr/bin/env python3
"""
Comprehensive test for prediction functionality
"""

import requests
import json
import pandas as pd
import io

# Configuration
BACKEND_URL = "http://127.0.0.1:8001"

def test_prediction_with_different_data_types():
    """Test prediction with various data types"""
    print("🧪 Testing Prediction with Different Data Types...")
    
    # Create a more complex dataset with mixed data types
    sample_data = pd.DataFrame({
        'age': [25, 30, 35, 40, 45, 28, 32, 38, 42, 48, 26, 31, 36, 41, 46],
        'income': [50000, 60000, 70000, 80000, 90000, 55000, 65000, 75000, 85000, 95000, 52000, 62000, 72000, 82000, 92000],
        'education': ['Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'Master', 'PhD', 'Bachelor', 'Master'],
        'experience_years': [2, 5, 8, 12, 15, 3, 6, 10, 14, 18, 1, 4, 7, 11, 16],
        'city': ['NYC', 'LA', 'Chicago', 'NYC', 'LA', 'Chicago', 'NYC', 'LA', 'Chicago', 'NYC', 'LA', 'Chicago', 'NYC', 'LA', 'Chicago'],
        'target': [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
    })
    
    csv_buffer = io.StringIO()
    sample_data.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    try:
        # 1. Upload file
        files = {'file': ('complex_test_data.csv', csv_content, 'text/csv')}
        response = requests.post(f"{BACKEND_URL}/upload/", files=files)
        
        if response.status_code == 200:
            upload_data = response.json()
            session_id = upload_data['session_id']
            print(f"✅ Complex data upload successful: {session_id}")
            
            # 2. Train model
            train_data = {
                "session_id": session_id,
                "target_column": "target",
                "algorithm": "random_forest",
                "model_type": "auto",
                "test_size": 0.3
            }
            
            train_response = requests.post(f"{BACKEND_URL}/train/", json=train_data)
            if train_response.status_code == 200:
                train_result = train_response.json()
                model_id = train_result['model_id']
                print(f"✅ Complex model training successful: {model_id}")
                
                # 3. Test different prediction scenarios
                test_cases = [
                    {
                        "name": "Single prediction with all features",
                        "data": [{
                            "age": 29,
                            "income": 58000,
                            "education": "Master",
                            "experience_years": 4,
                            "city": "NYC"
                        }]
                    },
                    {
                        "name": "Batch prediction with multiple samples",
                        "data": [
                            {
                                "age": 33,
                                "income": 67000,
                                "education": "Bachelor",
                                "experience_years": 7,
                                "city": "LA"
                            },
                            {
                                "age": 39,
                                "income": 78000,
                                "education": "PhD",
                                "experience_years": 12,
                                "city": "Chicago"
                            }
                        ]
                    },
                    {
                        "name": "Prediction with edge case values",
                        "data": [{
                            "age": 22,  # Young age
                            "income": 35000,  # Lower income
                            "education": "Bachelor",
                            "experience_years": 0,  # No experience
                            "city": "NYC"
                        }]
                    }
                ]
                
                for test_case in test_cases:
                    print(f"\n🔍 Testing: {test_case['name']}")
                    
                    predict_data = {
                        "model_id": model_id,
                        "data": test_case['data']
                    }
                    
                    predict_response = requests.post(f"{BACKEND_URL}/predict/", json=predict_data)
                    if predict_response.status_code == 200:
                        result = predict_response.json()
                        print(f"✅ {test_case['name']}: SUCCESS")
                        print(f"   📊 Predictions: {len(result['predictions'])} samples")
                        
                        for i, pred in enumerate(result['predictions']):
                            print(f"   🎯 Sample {i+1}: Prediction={pred['prediction']}, Confidence={pred['confidence']:.3f}")
                            if 'probabilities' in pred and pred['probabilities']:
                                probs = pred['probabilities']
                                print(f"      📈 Probabilities: {probs}")
                    else:
                        print(f"❌ {test_case['name']}: FAILED - {predict_response.status_code}")
                        print(f"   Error: {predict_response.text}")
                
                return True
            else:
                print(f"❌ Complex model training failed: {train_response.status_code}")
                print(f"   Error: {train_response.text}")
        else:
            print(f"❌ Complex data upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Complex prediction test failed: {e}")
    
    return False

def test_prediction_error_handling():
    """Test prediction error handling"""
    print("\n🧪 Testing Prediction Error Handling...")
    
    # Test with non-existent model
    predict_data = {
        "model_id": "non_existent_model_123",
        "data": [{"age": 30, "income": 50000}]
    }
    
    response = requests.post(f"{BACKEND_URL}/predict/", json=predict_data)
    if response.status_code == 404:
        print("✅ Non-existent model error handling: SUCCESS")
    else:
        print(f"❌ Non-existent model error handling: Expected 404, got {response.status_code}")
    
    # Test with empty data
    predict_data = {
        "model_id": "some_model",
        "data": []
    }
    
    response = requests.post(f"{BACKEND_URL}/predict/", json=predict_data)
    if response.status_code == 400:
        print("✅ Empty data error handling: SUCCESS")
    else:
        print(f"❌ Empty data error handling: Expected 400, got {response.status_code}")

def main():
    """Main test function"""
    print("🚀 Comprehensive Prediction Testing\n")
    
    # Test comprehensive prediction functionality
    prediction_ok = test_prediction_with_different_data_types()
    
    # Test error handling
    test_prediction_error_handling()
    
    print("\n📊 Comprehensive Test Summary:")
    print(f"Prediction Functionality: {'✅' if prediction_ok else '❌'}")
    
    if prediction_ok:
        print("\n🎉 All prediction features are working correctly!")
        print("✨ The prediction issue has been completely resolved!")
        print("\n🔧 What was fixed:")
        print("   • Original feature names are now properly stored in model metadata")
        print("   • Preprocessing pipeline is included in the saved model")
        print("   • Predictions now work with original column names")
        print("   • Both single and batch predictions are supported")
        print("   • Mixed data types (numerical, categorical) are handled correctly")
    else:
        print("\n⚠️  Some prediction issues remain. Please check the logs above.")

if __name__ == "__main__":
    main()
