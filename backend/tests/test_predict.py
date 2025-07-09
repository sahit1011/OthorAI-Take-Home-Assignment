"""
Test cases for prediction functionality
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
24,38000,High School,2,0
32,58000,Bachelor,6,1
26,40000,High School,3,0
36,70000,Master,9,1
29,48000,Bachelor,4,0
41,85000,PhD,14,1"""


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
1700,3,2,6,320000
1400,2,2,9,270000
1900,3,2,4,380000
2100,4,3,3,420000
1600,3,2,7,310000
2300,4,3,2,460000"""


@pytest.fixture
def trained_classification_model(classification_csv_content):
    """Upload data, train a classification model, and return model ID"""
    # Upload data
    csv_bytes = classification_csv_content.encode('utf-8')
    csv_file = io.BytesIO(csv_bytes)
    
    upload_response = client.post(
        "/upload/",
        files={"file": ("classification_test.csv", csv_file, "text/csv")}
    )
    
    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]
    
    # Train model
    train_request = {
        "session_id": session_id,
        "target_column": "target",
        "model_type": "classification",
        "algorithm": "random_forest",
        "test_size": 0.3,
        "random_state": 42
    }
    
    train_response = client.post("/train/", json=train_request)
    assert train_response.status_code == 200
    model_id = train_response.json()["model_id"]
    
    yield model_id
    
    # Cleanup
    file_handler.cleanup_file(session_id)


@pytest.fixture
def trained_regression_model(regression_csv_content):
    """Upload data, train a regression model, and return model ID"""
    # Upload data
    csv_bytes = regression_csv_content.encode('utf-8')
    csv_file = io.BytesIO(csv_bytes)
    
    upload_response = client.post(
        "/upload/",
        files={"file": ("regression_test.csv", csv_file, "text/csv")}
    )
    
    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]
    
    # Train model
    train_request = {
        "session_id": session_id,
        "target_column": "price",
        "model_type": "regression",
        "algorithm": "random_forest",
        "test_size": 0.3,
        "random_state": 42
    }
    
    train_response = client.post("/train/", json=train_request)
    assert train_response.status_code == 200
    model_id = train_response.json()["model_id"]
    
    yield model_id
    
    # Cleanup
    file_handler.cleanup_file(session_id)


def test_predict_classification_single(trained_classification_model):
    """Test single prediction for classification model"""
    model_id = trained_classification_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "age": 35,
                "income": 60000,
                "education": "Master",
                "experience": 8
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "predictions" in data
    assert "prediction_timestamp" in data
    
    # Check predictions
    predictions = data["predictions"]
    assert len(predictions) == 1
    
    prediction = predictions[0]
    assert "prediction" in prediction
    assert "confidence" in prediction
    assert "probabilities" in prediction
    
    # Check confidence is between 0 and 1
    assert 0 <= prediction["confidence"] <= 1
    
    # Check probabilities sum to 1 (for classification)
    probs = prediction["probabilities"]
    assert abs(sum(probs.values()) - 1.0) < 0.01


def test_predict_classification_multiple(trained_classification_model):
    """Test multiple predictions for classification model"""
    model_id = trained_classification_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "age": 35,
                "income": 60000,
                "education": "Master",
                "experience": 8
            },
            {
                "age": 25,
                "income": 35000,
                "education": "High School",
                "experience": 2
            },
            {
                "age": 40,
                "income": 85000,
                "education": "PhD",
                "experience": 15
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check predictions
    predictions = data["predictions"]
    assert len(predictions) == 3
    
    # Check each prediction
    for prediction in predictions:
        assert "prediction" in prediction
        assert "confidence" in prediction
        assert "probabilities" in prediction
        assert 0 <= prediction["confidence"] <= 1


def test_predict_regression_single(trained_regression_model):
    """Test single prediction for regression model"""
    model_id = trained_regression_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "size": 1800,
                "bedrooms": 3,
                "bathrooms": 2,
                "age": 5
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "predictions" in data
    assert "prediction_timestamp" in data
    
    # Check predictions
    predictions = data["predictions"]
    assert len(predictions) == 1
    
    prediction = predictions[0]
    assert "prediction" in prediction
    assert "confidence" in prediction
    
    # For regression, prediction should be a number
    assert isinstance(prediction["prediction"], (int, float))
    
    # Confidence should be between 0 and 1
    assert 0 <= prediction["confidence"] <= 1


def test_predict_regression_multiple(trained_regression_model):
    """Test multiple predictions for regression model"""
    model_id = trained_regression_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "size": 1800,
                "bedrooms": 3,
                "bathrooms": 2,
                "age": 5
            },
            {
                "size": 1200,
                "bedrooms": 2,
                "bathrooms": 1,
                "age": 10
            },
            {
                "size": 2200,
                "bedrooms": 4,
                "bathrooms": 3,
                "age": 2
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check predictions
    predictions = data["predictions"]
    assert len(predictions) == 3
    
    # Check each prediction
    for prediction in predictions:
        assert "prediction" in prediction
        assert "confidence" in prediction
        assert isinstance(prediction["prediction"], (int, float))
        assert 0 <= prediction["confidence"] <= 1


def test_predict_invalid_model_id():
    """Test prediction with invalid model ID"""
    predict_request = {
        "model_id": "invalid-model-id",
        "data": [
            {
                "age": 35,
                "income": 60000,
                "education": "Master",
                "experience": 8
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 404
    data = response.json()
    assert "error" in data["detail"]


def test_predict_missing_features(trained_classification_model):
    """Test prediction with missing required features"""
    model_id = trained_classification_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "age": 35,
                "income": 60000
                # Missing education and experience
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data["detail"]


def test_predict_extra_features(trained_classification_model):
    """Test prediction with extra features (should be ignored)"""
    model_id = trained_classification_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "age": 35,
                "income": 60000,
                "education": "Master",
                "experience": 8,
                "extra_feature": "should_be_ignored"
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    # Should succeed and ignore extra features
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 1


def test_predict_empty_data(trained_classification_model):
    """Test prediction with empty data array"""
    model_id = trained_classification_model
    
    predict_request = {
        "model_id": model_id,
        "data": []
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data["detail"]


def test_predict_invalid_feature_types(trained_classification_model):
    """Test prediction with invalid feature types"""
    model_id = trained_classification_model
    
    predict_request = {
        "model_id": model_id,
        "data": [
            {
                "age": "not_a_number",  # Should be numeric
                "income": 60000,
                "education": "Master",
                "experience": 8
            }
        ]
    }
    
    response = client.post("/predict/", json=predict_request)
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data["detail"]


def test_get_model_info(trained_classification_model):
    """Test getting model information"""
    model_id = trained_classification_model
    
    response = client.get(f"/predict/model/{model_id}/info")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "model_id" in data
    assert "problem_type" in data
    assert "algorithm" in data
    assert "features" in data
    assert "target_column" in data
    assert "timestamp" in data


def test_get_model_info_invalid_id():
    """Test getting model information with invalid ID"""
    response = client.get("/predict/model/invalid-model-id/info")
    
    assert response.status_code == 404
    data = response.json()
    assert "error" in data["detail"]
