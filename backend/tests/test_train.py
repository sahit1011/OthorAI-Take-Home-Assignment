"""
Test cases for model training functionality
"""
import pytest
import tempfile
import pandas as pd
from fastapi.testclient import TestClient
from pathlib import Path
import io
import json

from app.main import app
from app.core.file_handler import file_handler
from app.core.ml_processor import ml_processor

client = TestClient(app)


@pytest.fixture
def classification_csv_content():
    """Create sample classification CSV content for testing"""
    return """age,income,education,experience,target
30,50000,Bachelor,5,1
25,35000,High School,2,0
35,75000,Master,10,1
28,45000,Bachelor,3,0
40,90000,PhD,15,1
22,30000,High School,1,0
33,65000,Master,8,1
27,42000,Bachelor,4,0
38,80000,PhD,12,1
24,38000,High School,2,0"""


@pytest.fixture
def regression_csv_content():
    """Create sample regression CSV content for testing"""
    return """size,bedrooms,bathrooms,age,price
1200,2,1,10,250000
1800,3,2,5,350000
2200,4,3,2,450000
1000,1,1,15,200000
2500,4,3,1,500000
1500,3,2,8,300000
1100,2,1,12,220000
2000,3,2,3,400000
1300,2,1,7,280000
1700,3,2,6,320000"""


@pytest.fixture
def uploaded_classification_session(classification_csv_content):
    """Upload a classification dataset and return session ID"""
    csv_bytes = classification_csv_content.encode('utf-8')
    csv_file = io.BytesIO(csv_bytes)
    
    response = client.post(
        "/upload/",
        files={"file": ("classification_test.csv", csv_file, "text/csv")}
    )
    
    assert response.status_code == 200
    session_id = response.json()["session_id"]
    
    yield session_id
    
    # Cleanup
    file_handler.cleanup_file(session_id)


@pytest.fixture
def uploaded_regression_session(regression_csv_content):
    """Upload a regression dataset and return session ID"""
    csv_bytes = regression_csv_content.encode('utf-8')
    csv_file = io.BytesIO(csv_bytes)
    
    response = client.post(
        "/upload/",
        files={"file": ("regression_test.csv", csv_file, "text/csv")}
    )
    
    assert response.status_code == 200
    session_id = response.json()["session_id"]
    
    yield session_id
    
    # Cleanup
    file_handler.cleanup_file(session_id)


def test_train_classification_model(uploaded_classification_session):
    """Test training a classification model"""
    session_id = uploaded_classification_session
    
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "model_type": "classification",
        "algorithm": "random_forest",
        "test_size": 0.3,
        "random_state": 42
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "model_type" in data
    assert "algorithm" in data
    assert "evaluation_metrics" in data
    assert "feature_importance" in data
    assert "model_path" in data
    
    # Check model details
    assert data["model_type"] == "classification"
    assert data["algorithm"] == "random_forest"
    
    # Check evaluation metrics for classification
    metrics = data["evaluation_metrics"]
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    
    # Check feature importance
    assert len(data["feature_importance"]) > 0


def test_train_regression_model(uploaded_regression_session):
    """Test training a regression model"""
    session_id = uploaded_regression_session
    
    train_request = {
        "session_id": session_id,
        "target_column": "price",
        "model_type": "regression",
        "algorithm": "random_forest",
        "test_size": 0.3,
        "random_state": 42
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "model_type" in data
    assert "algorithm" in data
    assert "evaluation_metrics" in data
    assert "feature_importance" in data
    
    # Check model details
    assert data["model_type"] == "regression"
    assert data["algorithm"] == "random_forest"
    
    # Check evaluation metrics for regression
    metrics = data["evaluation_metrics"]
    assert "rmse" in metrics
    assert "r2_score" in metrics
    assert "mae" in metrics


def test_train_auto_detection(uploaded_classification_session):
    """Test automatic model type detection"""
    session_id = uploaded_classification_session
    
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "model_type": "auto",  # Should auto-detect as classification
        "algorithm": "random_forest"
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Should auto-detect as classification
    assert data["model_type"] == "classification"


def test_train_different_algorithms(uploaded_classification_session):
    """Test training with different algorithms"""
    session_id = uploaded_classification_session
    
    algorithms = ["random_forest", "logistic_regression", "xgboost"]
    
    for algorithm in algorithms:
        train_request = {
            "session_id": session_id,
            "target_column": "target",
            "model_type": "classification",
            "algorithm": algorithm
        }
        
        response = client.post("/train/", json=train_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["algorithm"] == algorithm


def test_train_invalid_session():
    """Test training with invalid session ID"""
    train_request = {
        "session_id": "invalid-session-id",
        "target_column": "target",
        "algorithm": "random_forest"
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 404
    data = response.json()
    assert "error" in data["detail"]


def test_train_invalid_target_column(uploaded_classification_session):
    """Test training with invalid target column"""
    session_id = uploaded_classification_session
    
    train_request = {
        "session_id": session_id,
        "target_column": "nonexistent_column",
        "algorithm": "random_forest"
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data["detail"]


def test_train_invalid_algorithm(uploaded_classification_session):
    """Test training with invalid algorithm"""
    session_id = uploaded_classification_session
    
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "algorithm": "invalid_algorithm"
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data["detail"]


def test_get_supported_algorithms():
    """Test getting supported algorithms"""
    response = client.get("/train/algorithms")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "algorithms" in data
    algorithms = data["algorithms"]
    
    # Check that expected algorithms are present
    assert "random_forest" in algorithms
    assert "logistic_regression" in algorithms
    assert "xgboost" in algorithms
    
    # Check algorithm details
    for alg_name, alg_info in algorithms.items():
        assert "name" in alg_info
        assert "description" in alg_info
        assert "use_cases" in alg_info


def test_train_with_custom_parameters(uploaded_classification_session):
    """Test training with custom parameters"""
    session_id = uploaded_classification_session
    
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "algorithm": "random_forest",
        "test_size": 0.2,
        "random_state": 123,
        "cross_validation": True,
        "cv_folds": 3
    }
    
    response = client.post("/train/", json=train_request)
    
    assert response.status_code == 200
    data = response.json()

    # Check that model was trained successfully
    assert "model_id" in data
    assert "evaluation_metrics" in data
    assert "feature_importance" in data
