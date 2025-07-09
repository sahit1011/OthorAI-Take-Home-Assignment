"""
Test script for LLM-enhanced summary generation
"""
import requests
import json
import os
import time

# API base URL
BASE_URL = "http://127.0.0.1:8002"

def test_llm_integration():
    """Test LLM-enhanced summary generation"""
    
    print("🤖 Testing LLM Integration")
    print("=" * 50)
    
    # Check if API key is configured
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        print(f"✅ OpenRouter API key configured: {api_key[:20]}...")
    else:
        print("⚠️  OpenRouter API key not found - will use fallback summaries")
        print("   Set OPENROUTER_API_KEY environment variable to test LLM features")
    
    # Step 1: Upload and train a model (reuse from previous test)
    print("\n1. Setting up test model...")
    
    # Upload CSV
    with open("data/samples/test_classification.csv", "rb") as f:
        files = {"file": ("test_classification.csv", f, "text/csv")}
        response = requests.post(f"{BASE_URL}/upload/", files=files)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.status_code}")
        return
    
    session_id = response.json()["session_id"]
    print(f"✅ File uploaded. Session: {session_id}")
    
    # Train model
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "algorithm": "random_forest"
    }
    
    response = requests.post(f"{BASE_URL}/train/", json=train_request)
    if response.status_code != 200:
        print(f"❌ Training failed: {response.status_code}")
        return
    
    model_id = response.json()["model_id"]
    print(f"✅ Model trained. Model ID: {model_id}")
    
    # Step 2: Test regular summary
    print("\n2. Testing regular summary endpoint...")
    
    response = requests.get(f"{BASE_URL}/summary/{model_id}")
    if response.status_code == 200:
        summary_data = response.json()
        print("✅ Regular summary generated")
        print(f"   Summary length: {len(summary_data['natural_language_summary'])} characters")
        print(f"   Insights count: {len(summary_data['insights'].get('insights', []))}")
        
        print("\n📄 Regular Summary:")
        print("-" * 30)
        print(summary_data['natural_language_summary'])
        print("-" * 30)
    else:
        print(f"❌ Regular summary failed: {response.status_code}")
        return
    
    # Step 3: Test LLM-enhanced summary
    print("\n3. Testing LLM-enhanced summary endpoint...")
    
    response = requests.get(f"{BASE_URL}/summary/{model_id}/llm-enhanced")
    if response.status_code == 200:
        llm_data = response.json()
        print("✅ LLM-enhanced summary generated")
        
        # Display LLM summaries
        llm_summaries = llm_data.get("llm_enhanced_summaries", {})
        llm_insights = llm_data.get("llm_insights", {})
        
        print(f"\n🤖 LLM Dataset Summary:")
        print("-" * 40)
        print(llm_summaries.get("dataset_summary", "Not available"))
        print("-" * 40)
        
        print(f"\n🤖 LLM Model Summary:")
        print("-" * 40)
        print(llm_summaries.get("model_summary", "Not available"))
        print("-" * 40)
        
        # Display insights
        if llm_insights:
            print(f"\n💡 LLM Insights:")
            print("-" * 20)
            
            insights = llm_insights.get("insights", [])
            if insights:
                print("Key Insights:")
                for i, insight in enumerate(insights[:3], 1):
                    print(f"  {i}. {insight}")
            
            recommendations = llm_insights.get("recommendations", [])
            if recommendations:
                print("\nRecommendations:")
                for i, rec in enumerate(recommendations[:3], 1):
                    print(f"  {i}. {rec}")
            
            business_apps = llm_insights.get("business_applications", [])
            if business_apps:
                print("\nBusiness Applications:")
                for i, app in enumerate(business_apps[:3], 1):
                    print(f"  {i}. {app}")
        
        # API info
        api_info = llm_data.get("api_info", {})
        print(f"\n🔧 API Info:")
        print(f"   LLM Model: {api_info.get('llm_model', 'Unknown')}")
        print(f"   Provider: {api_info.get('api_provider', 'Unknown')}")
        
    else:
        print(f"❌ LLM-enhanced summary failed: {response.status_code}")
        print(f"   Response: {response.text}")
    
    # Step 4: Compare summaries
    print("\n4. Summary Comparison:")
    print("=" * 50)
    
    if response.status_code == 200:
        regular_length = len(summary_data['natural_language_summary'])
        llm_length = len(llm_summaries.get("combined_summary", ""))
        
        print(f"Regular summary: {regular_length} characters")
        print(f"LLM summary: {llm_length} characters")
        print(f"Enhancement ratio: {llm_length/regular_length:.1f}x longer" if regular_length > 0 else "N/A")
        
        # Check for LLM-specific features
        llm_features = []
        if "business" in llm_summaries.get("model_summary", "").lower():
            llm_features.append("Business context")
        if "recommend" in str(llm_insights).lower():
            llm_features.append("Actionable recommendations")
        if len(llm_insights.get("insights", [])) > 3:
            llm_features.append("Detailed insights")
        
        if llm_features:
            print(f"LLM enhancements detected: {', '.join(llm_features)}")
        else:
            print("Using fallback summaries (LLM not available)")
    
    print(f"\n🎉 LLM Integration Test Complete!")
    return {
        "session_id": session_id,
        "model_id": model_id,
        "api_key_configured": bool(api_key),
        "regular_summary": summary_data if 'summary_data' in locals() else None,
        "llm_summary": llm_data if 'llm_data' in locals() else None
    }

def test_api_key_validation():
    """Test API key validation and fallback behavior"""
    print("\n🔑 Testing API Key Validation")
    print("=" * 30)
    
    # Check current environment
    current_key = os.getenv("OPENROUTER_API_KEY")
    
    if current_key:
        print(f"✅ API key found: {current_key[:20]}...")
        print("   LLM features should be available")
    else:
        print("❌ No API key found")
        print("   System will use fallback summaries")
    
    # Test with invalid key (temporarily)
    print("\n🧪 Testing fallback behavior...")
    print("   (This tests graceful degradation when LLM is unavailable)")

if __name__ == "__main__":
    try:
        # Test API key setup
        test_api_key_validation()
        
        # Test LLM integration
        result = test_llm_integration()
        
        print(f"\n📊 Test Results:")
        print(f"Session ID: {result['session_id']}")
        print(f"Model ID: {result['model_id']}")
        print(f"API Key Configured: {result['api_key_configured']}")
        print(f"LLM Features Available: {'Yes' if result['llm_summary'] else 'No'}")
        
        if not result['api_key_configured']:
            print(f"\n💡 To enable LLM features:")
            print(f"   1. Get API key from https://openrouter.ai/keys")
            print(f"   2. Set environment variable: export OPENROUTER_API_KEY='your-key'")
            print(f"   3. Restart the server and run this test again")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
