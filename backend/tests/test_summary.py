"""
Test cases for summary functionality
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


def test_get_basic_summary_classification(trained_classification_model):
    """Test getting basic summary for classification model"""
    model_id = trained_classification_model
    
    response = client.get(f"/summary/{model_id}")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "dataset_summary" in data
    assert "model_summary" in data
    assert "insights" in data
    assert "natural_language_summary" in data
    assert "timestamp" in data
    
    # Check model summary
    model_summary = data["model_summary"]
    assert model_summary["algorithm"] == "random_forest"
    
    # Check dataset summary
    dataset_summary = data["dataset_summary"]
    assert "features" in dataset_summary
    
    # Check insights
    insights = data["insights"]
    assert "model_insights" in insights or "insights" in insights
    assert "recommendations" in insights
    
    # Check natural language summary
    assert isinstance(data["natural_language_summary"], str)
    assert len(data["natural_language_summary"]) > 0


def test_get_basic_summary_regression(trained_regression_model):
    """Test getting basic summary for regression model"""
    model_id = trained_regression_model
    
    response = client.get(f"/summary/{model_id}")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "dataset_summary" in data
    assert "model_summary" in data
    assert "insights" in data
    assert "natural_language_summary" in data
    assert "timestamp" in data

    # Check model summary
    model_summary = data["model_summary"]
    assert model_summary["algorithm"] == "random_forest"
    
    # Check natural language summary
    assert isinstance(data["natural_language_summary"], str)
    assert len(data["natural_language_summary"]) > 0


def test_get_llm_enhanced_summary_classification(trained_classification_model):
    """Test getting LLM-enhanced summary for classification model"""
    model_id = trained_classification_model
    
    response = client.get(f"/summary/{model_id}/llm-enhanced")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "llm_enhanced_summaries" in data
    assert "llm_insights" in data
    
    # Check LLM enhanced summaries
    llm_summaries = data["llm_enhanced_summaries"]
    assert "dataset_summary" in llm_summaries
    assert "model_summary" in llm_summaries
    
    # Check LLM insights
    llm_insights = data["llm_insights"]
    assert "business_applications" in llm_insights or "business_insights" in llm_insights
    assert "recommendations" in llm_insights
    assert "next_steps" in llm_insights
    
    # Check that LLM summaries are strings and not empty
    assert isinstance(llm_summaries["dataset_summary"], str)
    assert isinstance(llm_summaries["model_summary"], str)
    assert len(llm_summaries["dataset_summary"]) > 0
    assert len(llm_summaries["model_summary"]) > 0


def test_get_llm_enhanced_summary_regression(trained_regression_model):
    """Test getting LLM-enhanced summary for regression model"""
    model_id = trained_regression_model
    
    response = client.get(f"/summary/{model_id}/llm-enhanced")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "model_id" in data
    assert "llm_enhanced_summaries" in data
    assert "llm_insights" in data
    
    # Check LLM enhanced summaries
    llm_summaries = data["llm_enhanced_summaries"]
    assert "dataset_summary" in llm_summaries
    assert "model_summary" in llm_summaries
    
    # Check that LLM summaries are strings and not empty
    assert isinstance(llm_summaries["dataset_summary"], str)
    assert isinstance(llm_summaries["model_summary"], str)
    assert len(llm_summaries["dataset_summary"]) > 0
    assert len(llm_summaries["model_summary"]) > 0


def test_get_summary_invalid_model_id():
    """Test getting summary with invalid model ID"""
    response = client.get("/summary/invalid-model-id")
    
    assert response.status_code == 404
    data = response.json()
    assert "error" in data["detail"]


def test_get_llm_enhanced_summary_invalid_model_id():
    """Test getting LLM-enhanced summary with invalid model ID"""
    response = client.get("/summary/invalid-model-id/llm-enhanced")

    # Should return either 404 or 500 depending on error handling
    assert response.status_code in [404, 500]
    data = response.json()
    assert "error" in data["detail"] or "message" in data["detail"]


def test_summary_content_quality_classification(trained_classification_model):
    """Test the quality and content of summary for classification"""
    model_id = trained_classification_model
    
    response = client.get(f"/summary/{model_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Check that summary contains key information
    summary_text = data["natural_language_summary"].lower()
    
    # Should mention classification
    assert "classification" in summary_text or "classify" in summary_text

    # Should mention features
    assert "feature" in summary_text

    # Check that summary is meaningful
    assert len(summary_text) > 50  # Should be a substantial summary


def test_summary_content_quality_regression(trained_regression_model):
    """Test the quality and content of summary for regression"""
    model_id = trained_regression_model
    
    response = client.get(f"/summary/{model_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Check that summary contains key information
    summary_text = data["natural_language_summary"].lower()
    
    # Should mention regression or prediction
    assert "regression" in summary_text or "predict" in summary_text

    # Should mention features
    assert "feature" in summary_text

    # Check that summary is meaningful
    assert len(summary_text) > 50  # Should be a substantial summary


def test_summary_insights_quality(trained_classification_model):
    """Test the quality of insights in summary"""
    model_id = trained_classification_model
    
    response = client.get(f"/summary/{model_id}")
    assert response.status_code == 200
    data = response.json()
    
    insights = data["insights"]
    
    # Check insights structure
    assert "insights" in insights
    assert "recommendations" in insights
    
    # Check that insights are meaningful
    insight_list = insights["insights"]
    assert isinstance(insight_list, list)
    assert len(insight_list) > 0
    
    # Check that recommendations are meaningful
    recommendations = insights["recommendations"]
    assert isinstance(recommendations, list)
    assert len(recommendations) > 0
    
    # Each insight and recommendation should be a non-empty string
    for insight in insight_list:
        assert isinstance(insight, str)
        assert len(insight.strip()) > 0
    
    for recommendation in recommendations:
        assert isinstance(recommendation, str)
        assert len(recommendation.strip()) > 0


def test_llm_summary_fallback_handling(trained_classification_model):
    """Test that LLM summary handles fallback gracefully when LLM is unavailable"""
    model_id = trained_classification_model
    
    # This test should pass even if LLM service is unavailable
    response = client.get(f"/summary/{model_id}/llm-enhanced")
    
    # Should either succeed with LLM content or fallback gracefully
    assert response.status_code in [200, 503]  # 503 if LLM service unavailable
    
    if response.status_code == 200:
        data = response.json()
        assert "llm_enhanced_summaries" in data
        
        # Check that fallback messages are provided if LLM fails
        llm_summaries = data["llm_enhanced_summaries"]
        assert "dataset_summary" in llm_summaries
        assert "model_summary" in llm_summaries
        
        # Should have some content (either LLM-generated or fallback)
        assert len(llm_summaries["dataset_summary"]) > 0
        assert len(llm_summaries["model_summary"]) > 0
