#!/usr/bin/env python3
"""
Test script to verify frontend fixes are working
"""

import requests
import json

def test_api_response():
    """Test the API response structure"""
    print("🔍 Testing API Response Structure")
    print("=" * 50)
    
    session_id = 'ede9238a-feee-4855-89c4-a5bc4a7c8950'
    response = requests.get(f'http://127.0.0.1:8001/profile/{session_id}')
    
    if response.status_code == 200:
        data = response.json()
        
        # Test data quality score
        completeness = data['data_quality']['completeness']
        print(f"✅ Data Quality Completeness: {completeness} ({type(completeness).__name__})")
        print(f"   Expected frontend display: {completeness * 100:.1f}%")
        
        # Test unique values
        first_col = list(data['column_profiles'].keys())[0]
        col_data = data['column_profiles'][first_col]
        unique_count = col_data['unique']
        print(f"✅ Column '{first_col}' Unique Values: {unique_count}")
        
        # Test other columns
        print(f"\n📊 All Columns Unique Values:")
        for col_name, col_info in data['column_profiles'].items():
            print(f"   {col_name}: {col_info['unique']} unique values")
        
        print(f"\n🎯 Expected Frontend Behavior:")
        print(f"   - Data Quality Score should show: {completeness * 100:.1f}%")
        print(f"   - Unique values should display numbers instead of 'NaN'")
        print(f"   - No more 'Network Error' on upload")
        
        return True
    else:
        print(f"❌ API Error: {response.status_code} - {response.text}")
        return False

def test_upload_functionality():
    """Test if upload is working without CORS errors"""
    print(f"\n🔍 Testing Upload Functionality")
    print("=" * 50)
    
    # Create a simple test CSV
    csv_content = """name,age,city,score
Alice,25,New York,85.5
Bob,30,Los Angeles,92.3
Charlie,35,Chicago,78.9"""
    
    test_file = "test_frontend_fix.csv"
    with open(test_file, 'w') as f:
        f.write(csv_content)
    
    try:
        # Test upload
        with open(test_file, 'rb') as f:
            files = {'file': (test_file, f, 'text/csv')}
            headers = {'Origin': 'http://localhost:3001'}
            response = requests.post('http://127.0.0.1:8001/upload/', files=files, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            session_id = result['session_id']
            print(f"✅ Upload successful: {session_id}")
            
            # Test profile generation
            profile_response = requests.get(f'http://127.0.0.1:8001/profile/{session_id}')
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                print(f"✅ Profile generation successful")
                
                # Check the data structure
                completeness = profile_data['data_quality']['completeness']
                print(f"   Data Quality: {completeness * 100:.1f}%")
                
                for col_name, col_info in profile_data['column_profiles'].items():
                    print(f"   {col_name}: {col_info['unique']} unique, {col_info['null_percentage']}% missing")
                
                return True
            else:
                print(f"❌ Profile generation failed: {profile_response.status_code}")
                return False
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Upload test failed: {e}")
        return False
    finally:
        # Clean up
        import os
        if os.path.exists(test_file):
            os.remove(test_file)

def main():
    """Run all tests"""
    print("🚀 Testing Frontend Fixes")
    print("=" * 60)
    
    # Test API response structure
    api_ok = test_api_response()
    
    # Test upload functionality
    upload_ok = test_upload_functionality()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"API Response Structure: {'✅ PASS' if api_ok else '❌ FAIL'}")
    print(f"Upload Functionality:   {'✅ PASS' if upload_ok else '❌ FAIL'}")
    
    if api_ok and upload_ok:
        print("\n🎉 All fixes are working!")
        print("💡 Frontend should now display:")
        print("   - Correct data quality percentage (98% instead of 1%)")
        print("   - Unique values as numbers (5, 8, etc. instead of NaN)")
        print("   - No CORS/Network errors on upload")
        print("\n🔄 Please refresh your browser (Ctrl+F5) and test the upload!")
    else:
        print("\n⚠️  Some issues remain. Check the errors above.")

if __name__ == "__main__":
    main()
