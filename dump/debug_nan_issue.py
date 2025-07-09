#!/usr/bin/env python3
"""
Debug script to identify NaN issues in the preprocessing pipeline
"""

import requests
import pandas as pd
import numpy as np
import json

# Configuration
API_BASE_URL = "http://127.0.0.1:8001"

def create_test_csv():
    """Create a test CSV that might cause NaN issues"""
    data = {
        'customer_id': ['CUST_001', 'CUST_002', 'CUST_003', 'CUST_004', 'CUST_005'],
        'age': [25, 34, 28, 45, 31],
        'income': [45000, 62000, 38000, 85000, 55000],
        'category': ['Electronics', 'Clothing', 'Books', 'Electronics', 'Home'],
        'purchase_amount': [299.99, 89.50, 24.99, 1299.99, 199.99],
        'days_since_last_purchase': [15, 7, 45, 3, 12],
        'total_purchases': [8, 12, 3, 25, 15],
        'target_variable': ['High', 'Medium', 'Low', 'High', 'Medium']
    }
    
    df = pd.DataFrame(data)
    test_file = "debug_test.csv"
    df.to_csv(test_file, index=False)
    print(f"Created test CSV: {test_file}")
    print("Data preview:")
    print(df.head())
    print("\nData types:")
    print(df.dtypes)
    print("\nNaN check:")
    print(df.isnull().sum())
    return test_file

def test_upload_and_profile():
    """Test the upload and profiling workflow"""
    print("\n" + "="*60)
    print("🔍 DEBUGGING NaN ISSUES IN PREPROCESSING")
    print("="*60)
    
    # Create test CSV
    test_file = create_test_csv()
    
    try:
        # Step 1: Upload file
        print("\n📤 Step 1: Uploading file...")
        with open(test_file, 'rb') as f:
            files = {'file': (test_file, f, 'text/csv')}
            response = requests.post(f"{API_BASE_URL}/upload/", files=files)
        
        if response.status_code != 200:
            print(f"❌ Upload failed: {response.status_code}")
            print(response.text)
            return
        
        upload_result = response.json()
        session_id = upload_result['session_id']
        print(f"✅ Upload successful. Session ID: {session_id}")
        print(f"   Rows: {upload_result['rows']}, Columns: {upload_result['columns']}")
        
        # Step 2: Get profile data
        print(f"\n📊 Step 2: Getting profile data...")
        response = requests.get(f"{API_BASE_URL}/profile/{session_id}")
        
        if response.status_code != 200:
            print(f"❌ Profile failed: {response.status_code}")
            print(response.text)
            return
        
        profile_result = response.json()
        print("✅ Profile successful")
        
        # Analyze the profile data for NaN issues
        print("\n🔍 Step 3: Analyzing profile data for NaN issues...")
        
        column_profiles = profile_result.get('column_profiles', {})
        for col_name, col_data in column_profiles.items():
            print(f"\n📋 Column: {col_name}")
            print(f"   Type: {col_data.get('type', 'unknown')}")
            print(f"   Count: {col_data.get('count', 'N/A')}")
            print(f"   Null count: {col_data.get('null_count', 'N/A')}")
            print(f"   Unique values: {col_data.get('unique_values', 'N/A')}")
            
            # Check for NaN in statistics
            stats = col_data.get('statistics', {})
            if stats:
                print(f"   Statistics:")
                for stat_name, stat_value in stats.items():
                    if pd.isna(stat_value) or (isinstance(stat_value, float) and np.isnan(stat_value)):
                        print(f"     ⚠️  {stat_name}: NaN (ISSUE FOUND!)")
                    else:
                        print(f"     ✅ {stat_name}: {stat_value}")
        
        # Step 4: Test model training to see where NaN might be introduced
        print(f"\n🤖 Step 4: Testing model training...")
        train_request = {
            "session_id": session_id,
            "target_column": "target_variable",
            "algorithm": "random_forest"
        }
        
        response = requests.post(f"{API_BASE_URL}/train/", json=train_request)
        
        if response.status_code == 200:
            train_result = response.json()
            print("✅ Training successful")
            print(f"   Model ID: {train_result['model_id']}")
            
            # Check training metrics for NaN
            metrics = train_result.get('evaluation_metrics', {})
            print("   Training metrics:")
            for metric_name, metric_value in metrics.items():
                if pd.isna(metric_value) or (isinstance(metric_value, float) and np.isnan(metric_value)):
                    print(f"     ⚠️  {metric_name}: NaN (ISSUE FOUND!)")
                else:
                    print(f"     ✅ {metric_name}: {metric_value}")
        else:
            print(f"❌ Training failed: {response.status_code}")
            print(response.text)
        
        print("\n" + "="*60)
        print("🎯 DEBUGGING SUMMARY")
        print("="*60)
        print("If you see any '⚠️ NaN (ISSUE FOUND!)' messages above,")
        print("those indicate where NaN values are being introduced.")
        print("Common causes:")
        print("1. Division by zero in statistical calculations")
        print("2. Empty or invalid data in columns")
        print("3. Type conversion issues")
        print("4. Preprocessing pipeline problems")
        
    except Exception as e:
        print(f"❌ Error during debugging: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up
        import os
        if os.path.exists(test_file):
            os.remove(test_file)

if __name__ == "__main__":
    test_upload_and_profile()
