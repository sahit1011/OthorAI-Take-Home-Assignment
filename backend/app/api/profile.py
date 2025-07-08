"""
Data profiling API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging

from ..models.profile import ProfileResponse, ProfileError
from ..core.file_handler import file_handler
from ..core.data_processor import data_processor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["Data Profiling"])


@router.get("/{session_id}", response_model=ProfileResponse)
async def get_data_profile(
    session_id: str,
    target_column: Optional[str] = Query(None, description="Optional target column for leakage detection")
) -> ProfileResponse:
    """
    Get comprehensive data profiling for an uploaded CSV file.
    
    This endpoint provides detailed statistical analysis including:
    
    **Dataset Information:**
    - Row and column counts
    - Memory usage
    - Missing values and duplicates
    
    **Column Profiles:**
    - Detailed statistics for each column
    - Type-specific analysis (numerical, categorical, etc.)
    - Outlier detection for numerical columns
    - Top values for categorical columns
    
    **Data Quality Assessment:**
    - Completeness and consistency scores
    - Empty and constant columns detection
    - Duplicate row identification
    
    **Correlation Analysis:**
    - Pairwise correlations between numerical columns
    - Significant correlations (|r| > 0.3)
    
    **Data Leakage Detection:**
    - Potential leakage issues if target column specified
    - High correlation warnings
    - Identical column detection
    
    **Parameters:**
    - session_id: The session ID from file upload
    - target_column: Optional target column name for leakage detection
    
    **Returns:**
    - Comprehensive data profile with all analysis results
    """
    try:
        logger.info(f"Starting data profiling for session {session_id}")
        
        # Check if file exists
        file_path = file_handler.get_file_path(session_id)
        if not file_path:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "SESSION_NOT_FOUND",
                    "message": f"No file found for session ID: {session_id}",
                    "session_id": session_id
                }
            )
        
        logger.info(f"File found for session {session_id}: {file_path}")
        
        # Generate comprehensive profile
        profile_data = data_processor.generate_comprehensive_profile(file_path, target_column)
        logger.info(f"Profile generation completed for session {session_id}")
        
        # Create response
        response = ProfileResponse(
            session_id=session_id,
            dataset_info=profile_data["dataset_info"],
            column_profiles=profile_data["column_profiles"],
            correlations=profile_data["correlations"],
            data_quality=profile_data["data_quality"],
            timestamp=datetime.now()
        )
        
        logger.info(f"Data profiling completed successfully for session {session_id}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        logger.error(f"Error during data profiling for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "PROFILING_ERROR",
                "message": "An error occurred while profiling the data",
                "session_id": session_id,
                "details": str(e)
            }
        )


@router.get("/{session_id}/correlations")
async def get_correlations(session_id: str) -> Dict[str, Any]:
    """
    Get correlation analysis for numerical columns.
    
    **Parameters:**
    - session_id: The session ID from file upload
    
    **Returns:**
    - Correlation matrix and significant correlations
    """
    try:
        # Check if file exists
        file_path = file_handler.get_file_path(session_id)
        if not file_path:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "SESSION_NOT_FOUND",
                    "message": f"No file found for session ID: {session_id}"
                }
            )
        
        # Load data and calculate correlations
        import pandas as pd
        df = pd.read_csv(file_path)
        correlations = data_processor.calculate_correlations(df)
        
        # Get full correlation matrix for numerical columns
        numerical_cols = df.select_dtypes(include=['number']).columns.tolist()
        correlation_matrix = {}
        
        if len(numerical_cols) > 1:
            corr_df = df[numerical_cols].corr()
            correlation_matrix = corr_df.round(3).to_dict()
        
        return {
            "session_id": session_id,
            "significant_correlations": correlations,
            "correlation_matrix": correlation_matrix,
            "numerical_columns": numerical_cols,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting correlations for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "CORRELATION_ERROR",
                "message": "Failed to calculate correlations",
                "details": str(e)
            }
        )


@router.get("/{session_id}/quality")
async def get_data_quality(session_id: str) -> Dict[str, Any]:
    """
    Get data quality assessment.
    
    **Parameters:**
    - session_id: The session ID from file upload
    
    **Returns:**
    - Comprehensive data quality metrics
    """
    try:
        # Check if file exists
        file_path = file_handler.get_file_path(session_id)
        if not file_path:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "SESSION_NOT_FOUND",
                    "message": f"No file found for session ID: {session_id}"
                }
            )
        
        # Load data and assess quality
        import pandas as pd
        df = pd.read_csv(file_path)
        quality_assessment = data_processor.assess_data_quality(df)
        
        return {
            "session_id": session_id,
            "data_quality": quality_assessment,
            "recommendations": _generate_quality_recommendations(quality_assessment),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assessing data quality for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "QUALITY_ASSESSMENT_ERROR",
                "message": "Failed to assess data quality",
                "details": str(e)
            }
        )


def _generate_quality_recommendations(quality_assessment: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on data quality assessment"""
    recommendations = []
    
    # Completeness recommendations
    if quality_assessment["completeness"] < 0.8:
        recommendations.append("Consider handling missing values - completeness is below 80%")
    
    # Duplicate rows
    if quality_assessment["duplicate_rows"] > 0:
        recommendations.append(f"Remove {quality_assessment['duplicate_rows']} duplicate rows")
    
    # Empty columns
    if quality_assessment["empty_columns"]:
        recommendations.append(f"Consider removing empty columns: {', '.join(quality_assessment['empty_columns'])}")
    
    # Constant columns
    if quality_assessment["constant_columns"]:
        recommendations.append(f"Consider removing constant columns: {', '.join(quality_assessment['constant_columns'])}")
    
    # Data leakage
    if quality_assessment.get("potential_leakage"):
        recommendations.append("Review potential data leakage issues identified")
    
    if not recommendations:
        recommendations.append("Data quality looks good - no major issues detected")
    
    return recommendations
