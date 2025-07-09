#!/usr/bin/env python3
"""
Comprehensive End-to-End Testing Suite for Othor AI
Tests multiple scenarios, edge cases, and error handling
"""

import requests
import json
import time
import os
import pandas as pd
import numpy as np
from typing import Dict, List, Optional

# Configuration
API_BASE_URL = "http://127.0.0.1:8001"
FRONTEND_BASE_URL = "http://localhost:3001"

class OthorAITester:
    def __init__(self):
        self.session_ids = []
        self.model_ids = []
        self.test_results = []
    
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   {details}")
    
    def create_test_csv(self, filename: str, scenario: str) -> str:
        """Create different test CSV files for various scenarios"""
        filepath = f"data/samples/{filename}"
        
        if scenario == "normal":
            # Normal customer churn dataset
            data = {
                'customer_id': [f'CUST_{i:03d}' for i in range(1, 101)],
                'age': np.random.randint(18, 80, 100),
                'income': np.random.randint(20000, 120000, 100),
                'tenure_months': np.random.randint(1, 60, 100),
                'monthly_charges': np.random.uniform(20, 150, 100).round(2),
                'contract_type': np.random.choice(['Month-to-month', 'One year', 'Two year'], 100),
                'churn': np.random.choice(['Yes', 'No'], 100, p=[0.3, 0.7])
            }
        
        elif scenario == "missing_values":
            # Dataset with missing values
            data = {
                'customer_id': [f'CUST_{i:03d}' for i in range(1, 51)],
                'age': [np.random.randint(18, 80) if np.random.random() > 0.1 else None for _ in range(50)],
                'income': [np.random.randint(20000, 120000) if np.random.random() > 0.15 else None for _ in range(50)],
                'category': [np.random.choice(['A', 'B', 'C']) if np.random.random() > 0.05 else None for _ in range(50)],
                'target': np.random.choice(['Yes', 'No'], 50)
            }
        
        elif scenario == "regression":
            # Regression dataset
            data = {
                'feature1': np.random.uniform(0, 100, 80),
                'feature2': np.random.uniform(-50, 50, 80),
                'feature3': np.random.choice(['A', 'B', 'C'], 80),
                'price': np.random.uniform(10, 1000, 80).round(2)
            }
        
        elif scenario == "small":
            # Very small dataset
            data = {
                'x1': [1, 2, 3, 4, 5],
                'x2': ['A', 'B', 'A', 'B', 'A'],
                'y': [0, 1, 0, 1, 0]
            }
        
        else:
            raise ValueError(f"Unknown scenario: {scenario}")
        
        df = pd.DataFrame(data)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        df.to_csv(filepath, index=False)
        return filepath
    
    def test_api_health(self) -> bool:
        """Test API health endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("API Health Check", "PASS", f"API version: {response.json().get('version')}")
                return True
            else:
                self.log_test("API Health Check", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", "FAIL", f"Exception: {str(e)}")
            return False
    
    def test_file_upload(self, filepath: str, expected_status: int = 200) -> Optional[str]:
        """Test file upload with different scenarios"""
        try:
            with open(filepath, 'rb') as file:
                files = {'file': (os.path.basename(filepath), file, 'text/csv')}
                response = requests.post(f"{API_BASE_URL}/upload/", files=files, timeout=30)
            
            if response.status_code == expected_status:
                if expected_status == 200:
                    data = response.json()
                    session_id = data['session_id']
                    self.session_ids.append(session_id)
                    self.log_test(f"File Upload ({os.path.basename(filepath)})", "PASS", 
                                f"Session: {session_id}, Rows: {data['rows']}, Cols: {data['columns']}")
                    return session_id
                else:
                    self.log_test(f"File Upload ({os.path.basename(filepath)})", "PASS", 
                                f"Expected error status {expected_status}")
                    return None
            else:
                self.log_test(f"File Upload ({os.path.basename(filepath)})", "FAIL", 
                            f"Expected {expected_status}, got {response.status_code}")
                return None
        except Exception as e:
            self.log_test(f"File Upload ({os.path.basename(filepath)})", "FAIL", f"Exception: {str(e)}")
            return None
    
    def test_data_profiling(self, session_id: str) -> Optional[Dict]:
        """Test data profiling endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/profile/{session_id}", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                rows = data['dataset_info']['rows']
                cols = data['dataset_info']['columns']
                quality = data['data_quality']['completeness']
                
                self.log_test(f"Data Profiling ({session_id[:8]}...)", "PASS", 
                            f"{rows} rows, {cols} cols, {quality:.1f}% complete")
                return data
            else:
                self.log_test(f"Data Profiling ({session_id[:8]}...)", "FAIL", 
                            f"Status code: {response.status_code}")
                return None
        except Exception as e:
            self.log_test(f"Data Profiling ({session_id[:8]}...)", "FAIL", f"Exception: {str(e)}")
            return None
    
    def test_model_training(self, session_id: str, target_column: str, algorithm: str = "random_forest") -> Optional[Dict]:
        """Test model training with different algorithms"""
        try:
            training_request = {
                "session_id": session_id,
                "target_column": target_column,
                "algorithm": algorithm,
                "model_type": "auto",
                "test_size": 0.2,
                "random_state": 42
            }
            
            response = requests.post(f"{API_BASE_URL}/train/", json=training_request, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                model_id = data['model_id']
                self.model_ids.append(model_id)
                
                metrics = data['evaluation_metrics']
                accuracy = metrics.get('accuracy', metrics.get('r2_score', 'N/A'))
                
                self.log_test(f"Model Training ({algorithm})", "PASS", 
                            f"Model: {model_id}, Accuracy/R²: {accuracy}")
                return data
            else:
                self.log_test(f"Model Training ({algorithm})", "FAIL", 
                            f"Status code: {response.status_code}")
                return None
        except Exception as e:
            self.log_test(f"Model Training ({algorithm})", "FAIL", f"Exception: {str(e)}")
            return None
    
    def test_prediction(self, model_id: str, test_data: List[Dict]) -> Optional[Dict]:
        """Test model prediction"""
        try:
            prediction_request = {
                "model_id": model_id,
                "data": test_data
            }
            
            response = requests.post(f"{API_BASE_URL}/predict/", json=prediction_request, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                predictions = data['predictions']
                
                self.log_test(f"Prediction ({model_id[:12]}...)", "PASS", 
                            f"{len(predictions)} predictions generated")
                return data
            else:
                self.log_test(f"Prediction ({model_id[:12]}...)", "FAIL", 
                            f"Status code: {response.status_code}")
                return None
        except Exception as e:
            self.log_test(f"Prediction ({model_id[:12]}...)", "FAIL", f"Exception: {str(e)}")
            return None
    
    def test_error_scenarios(self):
        """Test various error scenarios"""
        print("\n🔍 Testing Error Scenarios...")
        
        # Test invalid file upload
        try:
            files = {'file': ('test.txt', b'not a csv file', 'text/plain')}
            response = requests.post(f"{API_BASE_URL}/upload/", files=files, timeout=10)
            if response.status_code != 200:
                self.log_test("Invalid File Upload", "PASS", "Correctly rejected non-CSV file")
            else:
                self.log_test("Invalid File Upload", "FAIL", "Should have rejected non-CSV file")
        except Exception as e:
            self.log_test("Invalid File Upload", "FAIL", f"Exception: {str(e)}")
        
        # Test non-existent session
        response = requests.get(f"{API_BASE_URL}/profile/invalid-session-id", timeout=10)
        if response.status_code == 404:
            self.log_test("Invalid Session ID", "PASS", "Correctly returned 404 for invalid session")
        else:
            self.log_test("Invalid Session ID", "FAIL", f"Expected 404, got {response.status_code}")
    
    def run_comprehensive_tests(self):
        """Run all comprehensive tests"""
        print("🚀 Starting Comprehensive End-to-End Testing")
        print("=" * 70)
        
        # Test 1: API Health
        if not self.test_api_health():
            print("❌ API is not healthy. Stopping tests.")
            return
        
        # Test 2: Normal workflow
        print("\n📊 Testing Normal Workflow...")
        normal_csv = self.create_test_csv("normal_test.csv", "normal")
        session_id = self.test_file_upload(normal_csv)
        
        if session_id:
            profile_data = self.test_data_profiling(session_id)
            if profile_data:
                # Test different algorithms
                for algorithm in ["random_forest", "xgboost", "logistic_regression"]:
                    model_data = self.test_model_training(session_id, "churn", algorithm)
                    if model_data:
                        # Test prediction
                        test_data = [{
                            "age": 35,
                            "income": 50000,
                            "tenure_months": 24,
                            "monthly_charges": 75.0,
                            "contract_type": "One year"
                        }]
                        self.test_prediction(model_data['model_id'], test_data)
        
        # Test 3: Missing values scenario
        print("\n🔍 Testing Missing Values Scenario...")
        missing_csv = self.create_test_csv("missing_values_test.csv", "missing_values")
        session_id = self.test_file_upload(missing_csv)
        if session_id:
            profile_data = self.test_data_profiling(session_id)
            if profile_data:
                model_data = self.test_model_training(session_id, "target")
        
        # Test 4: Regression scenario
        print("\n📈 Testing Regression Scenario...")
        regression_csv = self.create_test_csv("regression_test.csv", "regression")
        session_id = self.test_file_upload(regression_csv)
        if session_id:
            profile_data = self.test_data_profiling(session_id)
            if profile_data:
                model_data = self.test_model_training(session_id, "price")
        
        # Test 5: Small dataset
        print("\n📏 Testing Small Dataset...")
        small_csv = self.create_test_csv("small_test.csv", "small")
        session_id = self.test_file_upload(small_csv)
        if session_id:
            profile_data = self.test_data_profiling(session_id)
            if profile_data:
                model_data = self.test_model_training(session_id, "y")
        
        # Test 6: Error scenarios
        self.test_error_scenarios()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📋 TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"\n🔗 Generated Sessions: {len(self.session_ids)}")
        print(f"🤖 Generated Models: {len(self.model_ids)}")
        
        if self.session_ids:
            print(f"\n🌐 Frontend URLs to test manually:")
            for session_id in self.session_ids[:3]:  # Show first 3
                print(f"   - Profile: {FRONTEND_BASE_URL}/profile/{session_id}")
                print(f"   - Training: {FRONTEND_BASE_URL}/train/{session_id}")
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! System is fully functional!")
        else:
            print(f"\n⚠️  {failed} tests failed. Please review and fix issues.")

if __name__ == "__main__":
    tester = OthorAITester()
    tester.run_comprehensive_tests()
