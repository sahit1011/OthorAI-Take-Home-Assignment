"""
Test cases for file upload functionality
"""
import pytest
import tempfile
import pandas as pd
from fastapi.testclient import TestClient
from pathlib import Path
import io

from app.main import app
from app.core.file_handler import file_handler
from app.core.data_processor import data_processor

client = TestClient(app)


@pytest.fixture
def sample_csv_content():
    """Create sample CSV content for testing"""
    return """name,age,salary,department,is_active
John Doe,30,50000,Engineering,true
Jane Smith,25,45000,Marketing,true
Bob Johnson,35,60000,Engineering,false
Alice Brown,28,52000,Sales,true
Charlie Wilson,32,55000,Marketing,true"""


@pytest.fixture
def sample_csv_file(sample_csv_content):
    """Create a temporary CSV file for testing"""
    csv_bytes = sample_csv_content.encode('utf-8')
    return io.BytesIO(csv_bytes)


def test_upload_valid_csv(sample_csv_file):
    """Test uploading a valid CSV file"""
    response = client.post(
        "/upload/",
        files={"file": ("test.csv", sample_csv_file, "text/csv")}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "session_id" in data
    assert "filename" in data
    assert "file_size" in data
    assert "rows" in data
    assert "columns" in data
    assert "data_schema" in data
    assert "upload_timestamp" in data

    # Check data values
    assert data["filename"] == "test.csv"
    assert data["rows"] == 5
    assert data["columns"] == 5
    assert len(data["data_schema"]) == 5

    # Check schema inference
    schema = data["data_schema"]
    assert schema["name"]["type"] == "categorical"
    assert schema["age"]["type"] == "numerical"
    assert schema["salary"]["type"] == "numerical"
    assert schema["department"]["type"] == "categorical"
    assert schema["is_active"]["type"] == "boolean"
    
    # Clean up
    file_handler.cleanup_file(data["session_id"])


def test_upload_invalid_file_type():
    """Test uploading a non-CSV file"""
    txt_content = b"This is not a CSV file"
    txt_file = io.BytesIO(txt_content)
    
    response = client.post(
        "/upload/",
        files={"file": ("test.txt", txt_file, "text/plain")}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data["detail"]
    assert data["detail"]["error"] == "INVALID_FILE_TYPE"


def test_upload_empty_csv():
    """Test uploading an empty CSV file"""
    empty_csv = io.BytesIO(b"")
    
    response = client.post(
        "/upload/",
        files={"file": ("empty.csv", empty_csv, "text/csv")}
    )
    
    assert response.status_code == 400


def test_upload_csv_with_headers_only():
    """Test uploading a CSV with headers but no data"""
    headers_only = b"name,age,salary\n"
    csv_file = io.BytesIO(headers_only)
    
    response = client.post(
        "/upload/",
        files={"file": ("headers_only.csv", csv_file, "text/csv")}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "INVALID_CSV_STRUCTURE" in data["detail"]["error"]


def test_get_upload_info(sample_csv_file):
    """Test getting upload information"""
    # First upload a file
    upload_response = client.post(
        "/upload/",
        files={"file": ("test.csv", sample_csv_file, "text/csv")}
    )
    
    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]
    
    # Get upload info
    info_response = client.get(f"/upload/session/{session_id}/info")
    
    assert info_response.status_code == 200
    data = info_response.json()
    
    assert data["session_id"] == session_id
    assert "file_info" in data
    assert "dataset_info" in data
    assert data["status"] == "active"
    
    # Clean up
    file_handler.cleanup_file(session_id)


def test_get_upload_info_nonexistent_session():
    """Test getting info for non-existent session"""
    fake_session_id = "nonexistent-session-id"
    
    response = client.get(f"/upload/session/{fake_session_id}/info")
    
    assert response.status_code == 404
    data = response.json()
    assert data["detail"]["error"] == "SESSION_NOT_FOUND"


def test_cleanup_upload_session(sample_csv_file):
    """Test cleaning up an upload session"""
    # First upload a file
    upload_response = client.post(
        "/upload/",
        files={"file": ("test.csv", sample_csv_file, "text/csv")}
    )
    
    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]
    
    # Clean up the session
    cleanup_response = client.delete(f"/upload/session/{session_id}")
    
    assert cleanup_response.status_code == 200
    data = cleanup_response.json()
    assert session_id in data["message"]
    
    # Verify file is gone
    file_path = file_handler.get_file_path(session_id)
    assert file_path is None


def test_cleanup_nonexistent_session():
    """Test cleaning up non-existent session"""
    fake_session_id = "nonexistent-session-id"
    
    response = client.delete(f"/upload/session/{fake_session_id}")
    
    assert response.status_code == 404
    data = response.json()
    assert data["detail"]["error"] == "SESSION_NOT_FOUND"


def test_data_processor_column_analysis():
    """Test data processor column analysis"""
    # Create test data
    data = {
        'numerical': [1, 2, 3, 4, 5],
        'categorical': ['A', 'B', 'A', 'C', 'B'],
        'boolean': [True, False, True, True, False],
        'constant': ['same', 'same', 'same', 'same', 'same'],
        'high_cardinality': ['val1', 'val2', 'val3', 'val4', 'val5']
    }
    df = pd.DataFrame(data)
    
    # Test numerical column
    num_schema = data_processor.analyze_column(df['numerical'], 'numerical')
    assert num_schema.type == 'numerical'
    assert num_schema.unique_values == 5
    assert num_schema.null_percentage == 0.0
    assert not num_schema.is_constant
    
    # Test categorical column
    cat_schema = data_processor.analyze_column(df['categorical'], 'categorical')
    assert cat_schema.type == 'categorical'
    assert cat_schema.unique_values == 3
    
    # Test boolean column
    bool_schema = data_processor.analyze_column(df['boolean'], 'boolean')
    assert bool_schema.type == 'boolean'
    
    # Test constant column
    const_schema = data_processor.analyze_column(df['constant'], 'constant')
    assert const_schema.is_constant
    
    # Test high cardinality column
    hc_schema = data_processor.analyze_column(df['high_cardinality'], 'high_cardinality')
    assert hc_schema.is_high_cardinality


def test_comprehensive_profiling(sample_csv_file):
    """Test comprehensive data profiling"""
    # First upload a file
    upload_response = client.post(
        "/upload/",
        files={"file": ("test.csv", sample_csv_file, "text/csv")}
    )

    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]

    # Get comprehensive profile
    profile_response = client.get(f"/profile/{session_id}")

    assert profile_response.status_code == 200
    data = profile_response.json()

    # Check response structure
    assert "session_id" in data
    assert "dataset_info" in data
    assert "column_profiles" in data
    assert "correlations" in data
    assert "data_quality" in data
    assert "timestamp" in data

    # Check dataset info
    dataset_info = data["dataset_info"]
    assert dataset_info["rows"] == 5
    assert dataset_info["columns"] == 5

    # Check column profiles
    column_profiles = data["column_profiles"]
    assert len(column_profiles) == 5

    # Check numerical column profile
    age_profile = column_profiles["age"]
    assert age_profile["type"] == "numerical"
    assert "mean" in age_profile
    assert "std" in age_profile
    assert "quartiles" in age_profile

    # Check categorical column profile
    dept_profile = column_profiles["department"]
    assert dept_profile["type"] == "categorical"
    assert "top_values" in dept_profile

    # Check data quality
    data_quality = data["data_quality"]
    assert "completeness" in data_quality
    assert "consistency" in data_quality

    # Clean up
    file_handler.cleanup_file(session_id)


def test_correlations_endpoint(sample_csv_file):
    """Test correlations endpoint"""
    # First upload a file
    upload_response = client.post(
        "/upload/",
        files={"file": ("test.csv", sample_csv_file, "text/csv")}
    )

    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]

    # Get correlations
    corr_response = client.get(f"/profile/{session_id}/correlations")

    assert corr_response.status_code == 200
    data = corr_response.json()

    assert "session_id" in data
    assert "significant_correlations" in data
    assert "correlation_matrix" in data
    assert "numerical_columns" in data

    # Clean up
    file_handler.cleanup_file(session_id)


def test_data_quality_endpoint(sample_csv_file):
    """Test data quality endpoint"""
    # First upload a file
    upload_response = client.post(
        "/upload/",
        files={"file": ("test.csv", sample_csv_file, "text/csv")}
    )

    assert upload_response.status_code == 200
    session_id = upload_response.json()["session_id"]

    # Get data quality
    quality_response = client.get(f"/profile/{session_id}/quality")

    assert quality_response.status_code == 200
    data = quality_response.json()

    assert "session_id" in data
    assert "data_quality" in data
    assert "recommendations" in data

    # Clean up
    file_handler.cleanup_file(session_id)


def test_profile_nonexistent_session():
    """Test profiling with non-existent session"""
    fake_session_id = "nonexistent-session-id"

    response = client.get(f"/profile/{fake_session_id}")

    assert response.status_code == 404
    data = response.json()
    assert data["detail"]["error"] == "SESSION_NOT_FOUND"
