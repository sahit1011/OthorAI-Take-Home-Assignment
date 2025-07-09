"""
Comprehensive Data Analysis API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any, List
import logging
import pandas as pd
from pathlib import Path

from ..auth.dependencies import get_current_user
from ..database.models import User
from ..core.data_processor import DataProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.get("/{session_id}/comprehensive")
async def get_comprehensive_analysis(
    session_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get comprehensive statistical analysis of uploaded CSV data.
    
    This endpoint provides detailed exploratory data analysis including:
    
    **Dataset Overview:**
    - Shape, size, memory usage
    - Data types distribution
    - Missing values analysis
    - Duplicate detection
    
    **Statistical Analysis:**
    - Descriptive statistics for numeric columns
    - Distribution analysis and normality tests
    - Correlation matrix
    - Outlier detection using IQR method
    
    **Categorical Analysis:**
    - Unique value counts and percentages
    - Top value frequencies
    - Mode detection
    
    **Data Quality Assessment:**
    - Completeness, uniqueness, consistency, validity scores
    - Overall quality grade
    - Quality recommendations
    
    **Visualization Data:**
    - Histogram data for numeric columns
    - Distribution parameters
    - Missing value patterns
    """
    try:
        logger.info(f"Starting comprehensive analysis for session {session_id}")
        
        # Initialize data processor
        data_processor = DataProcessor()
        
        # Construct file path
        uploads_dir = Path("data/uploads")
        file_path = uploads_dir / f"{session_id}.csv"
        
        if not file_path.exists():
            logger.error(f"File not found for session {session_id}: {file_path}")
            raise HTTPException(
                status_code=404,
                detail={
                    "message": "File not found",
                    "session_id": session_id,
                    "error_type": "file_not_found"
                }
            )
        
        logger.info(f"File found for session {session_id}: {file_path}")
        
        # Get comprehensive analysis
        analysis_result = data_processor.get_comprehensive_analysis(file_path)
        
        # Add session metadata
        analysis_result['session_id'] = session_id
        analysis_result['analysis_timestamp'] = pd.Timestamp.now().isoformat()
        
        logger.info(f"Comprehensive analysis completed for session {session_id}")
        
        return {
            "success": True,
            "session_id": session_id,
            "analysis": analysis_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in comprehensive analysis for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Analysis failed",
                "error": str(e),
                "session_id": session_id,
                "error_type": "analysis_error"
            }
        )

@router.get("/{session_id}/summary")
async def get_analysis_summary(
    session_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get a quick summary of the data analysis.
    """
    try:
        logger.info(f"Getting analysis summary for session {session_id}")
        
        # Get comprehensive analysis
        comprehensive_result = await get_comprehensive_analysis(session_id, current_user)
        analysis = comprehensive_result['analysis']
        
        # Extract key insights
        dataset_info = analysis['dataset_info']
        quality = analysis['quality_assessment']
        missing = analysis['missing_analysis']
        duplicates = analysis['duplicate_analysis']
        
        summary = {
            'dataset_overview': {
                'rows': dataset_info['rows'],
                'columns': dataset_info['columns'],
                'memory_usage': dataset_info['memory_usage'],
                'file_size': dataset_info['file_size']
            },
            'data_quality': {
                'overall_score': quality['overall_quality'],
                'grade': quality['quality_grade'],
                'completeness': quality['completeness'],
                'uniqueness': quality['uniqueness']
            },
            'data_issues': {
                'missing_values': missing['total_missing'],
                'missing_percentage': missing['missing_percentage'],
                'duplicate_rows': duplicates['duplicate_rows'],
                'duplicate_percentage': duplicates['duplicate_percentage']
            },
            'column_types': analysis['dtypes_info'],
            'key_insights': _generate_key_insights(analysis)
        }
        
        return {
            "success": True,
            "session_id": session_id,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis summary for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Summary generation failed",
                "error": str(e),
                "session_id": session_id
            }
        )

def _generate_key_insights(analysis: Dict[str, Any]) -> List[str]:
    """Generate key insights from the analysis"""
    insights = []
    
    dataset_info = analysis['dataset_info']
    quality = analysis['quality_assessment']
    missing = analysis['missing_analysis']
    duplicates = analysis['duplicate_analysis']
    dtypes = analysis['dtypes_info']
    
    # Dataset size insights
    if dataset_info['rows'] > 100000:
        insights.append(f"Large dataset with {dataset_info['rows']:,} rows - suitable for robust analysis")
    elif dataset_info['rows'] < 1000:
        insights.append(f"Small dataset with {dataset_info['rows']} rows - consider collecting more data")
    
    # Quality insights
    if quality['overall_quality'] >= 90:
        insights.append("Excellent data quality - ready for analysis and modeling")
    elif quality['overall_quality'] < 60:
        insights.append("Data quality issues detected - cleaning recommended before analysis")
    
    # Missing data insights
    if missing['missing_percentage'] > 20:
        insights.append(f"High missing data rate ({missing['missing_percentage']:.1f}%) - imputation strategy needed")
    elif missing['missing_percentage'] == 0:
        insights.append("Complete dataset with no missing values")
    
    # Duplicate insights
    if duplicates['duplicate_percentage'] > 10:
        insights.append(f"High duplicate rate ({duplicates['duplicate_percentage']:.1f}%) - deduplication recommended")
    
    # Column type insights
    if len(dtypes['numeric_columns']) > len(dtypes['categorical_columns']):
        insights.append("Numeric-heavy dataset - suitable for statistical analysis and regression")
    elif len(dtypes['categorical_columns']) > len(dtypes['numeric_columns']):
        insights.append("Categorical-heavy dataset - consider encoding for machine learning")
    
    return insights
