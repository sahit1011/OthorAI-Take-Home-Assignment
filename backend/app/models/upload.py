"""
Pydantic models for file upload endpoints
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ColumnSchema(BaseModel):
    """Schema information for a single column"""
    type: str = Field(..., description="Column data type (numerical, categorical, datetime, boolean)")
    unique_values: int = Field(..., description="Number of unique values")
    null_percentage: float = Field(..., description="Percentage of null values")
    is_high_cardinality: bool = Field(..., description="Whether column has high cardinality")
    is_constant: bool = Field(..., description="Whether column has constant values")
    sample_values: Optional[list] = Field(None, description="Sample values from the column")


class UploadResponse(BaseModel):
    """Response model for file upload endpoint"""
    session_id: str = Field(..., description="Unique session identifier")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    rows: int = Field(..., description="Number of rows in the dataset")
    columns: int = Field(..., description="Number of columns in the dataset")
    upload_timestamp: datetime = Field(..., description="When the file was uploaded")
    data_schema: Dict[str, ColumnSchema] = Field(..., description="Schema information for each column")
    message: str = Field(default="File uploaded and processed successfully")


class UploadError(BaseModel):
    """Error response model for upload failures"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now)


class FileValidationError(BaseModel):
    """Specific error model for file validation failures"""
    error: str = Field(default="FILE_VALIDATION_ERROR")
    message: str = Field(..., description="Validation error message")
    file_info: Optional[Dict[str, Any]] = Field(None, description="Information about the uploaded file")
    allowed_types: list = Field(default=[".csv"], description="Allowed file types")
    max_size_mb: float = Field(..., description="Maximum allowed file size in MB")
    timestamp: datetime = Field(default_factory=datetime.now)
