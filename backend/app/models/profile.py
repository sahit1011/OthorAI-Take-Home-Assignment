"""
Pydantic models for data profiling endpoints
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ProfileResponse(BaseModel):
    """Response model for data profiling endpoint"""
    session_id: str = Field(..., description="Session identifier")
    dataset_info: Dict[str, Any] = Field(..., description="Basic dataset information")
    column_profiles: Dict[str, Any] = Field(..., description="Detailed column analysis")
    correlations: Dict[str, float] = Field(..., description="Pairwise correlations")
    data_quality: Dict[str, Any] = Field(..., description="Data quality metrics")
    timestamp: datetime = Field(default_factory=datetime.now)


class ProfileError(BaseModel):
    """Error response for profiling failures"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    session_id: Optional[str] = Field(None, description="Session ID if available")
    timestamp: datetime = Field(default_factory=datetime.now)
