#!/usr/bin/env python3
"""
Test enhanced training endpoint
"""

import requests
import json
import pandas as pd
import io

# Configuration
BACKEND_URL = "http://127.0.0.1:8001"

def test_enhanced_training():
    """Test enhanced training endpoint"""
    print("🧪 Testing Enhanced Training Endpoint...")
    
    # Create test data
    sample_data = pd.DataFrame({
        'age': [25, 30, 35, 40, 45, 28, 32, 38, 42, 48],
        'income': [50000, 60000, 70000, 80000, 90000, 55000, 65000, 75000, 85000, 95000],
        'education': ['Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'Master', 'PhD', 'Bachelor', 'Master'],
        'target': [0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
    })
    
    csv_buffer = io.StringIO()
    sample_data.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    try:
        # 1. Upload file
        files = {'file': ('test_enhanced_data.csv', csv_content, 'text/csv')}
        response = requests.post(f"{BACKEND_URL}/upload/", files=files)
        
        if response.status_code == 200:
            upload_data = response.json()
            session_id = upload_data['session_id']
            print(f"✅ File upload successful: {session_id}")
            
            # 2. Test enhanced training with different request formats
            test_cases = [
                {
                    "name": "Frontend format (what frontend sends)",
                    "data": {
                        "target_column": "target",
                        "model_name": "random_forest",
                        "problem_type": "auto"
                    }
                },
                {
                    "name": "Alternative format 1",
                    "data": {
                        "target_column": "target",
                        "model_name": "random_forest"
                    }
                },
                {
                    "name": "Alternative format 2", 
                    "data": {
                        "target_column": "target",
                        "model_name": "logistic_regression",
                        "problem_type": "classification"
                    }
                }
            ]
            
            for test_case in test_cases:
                print(f"\n🔍 Testing: {test_case['name']}")
                print(f"   Request data: {test_case['data']}")
                
                response = requests.post(
                    f"{BACKEND_URL}/train/{session_id}/enhanced-train",
                    json=test_case['data']
                )
                
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ SUCCESS: Model ID = {result['model_id']}")
                    return True
                else:
                    print(f"   ❌ FAILED: {response.text}")
            
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Enhanced training test failed: {e}")
    
    return False

def main():
    """Main test function"""
    print("🚀 Testing Enhanced Training Endpoint\n")
    
    success = test_enhanced_training()
    
    print(f"\n📊 Test Result: {'✅ SUCCESS' if success else '❌ FAILED'}")
    
    if not success:
        print("\n🔧 Debugging Info:")
        print("   • Check if the request body format matches the backend expectation")
        print("   • Verify the Pydantic model validation in EnhancedTrainRequest")
        print("   • Check backend logs for detailed error messages")

if __name__ == "__main__":
    main()
