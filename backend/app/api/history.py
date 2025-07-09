"""
History API endpoints for retrieving user's file upload and model training history.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ..database.models import User, FileMetadata, ModelMetadata
from ..database.database import get_db
from ..auth.dependencies import get_current_user
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["History"])


class FileHistoryResponse(BaseModel):
    """Response model for file upload history"""
    id: int
    session_id: str
    filename: str
    original_filename: str
    file_size: int
    num_rows: Optional[int]
    num_columns: Optional[int]
    status: str
    uploaded_at: datetime
    processed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ModelHistoryResponse(BaseModel):
    """Response model for model training history"""
    id: int
    model_id: str
    model_name: Optional[str]
    algorithm: str
    model_type: str
    target_column: str
    evaluation_metrics: Dict[str, Any]
    training_duration: Optional[float]
    num_features: Optional[int]
    status: str
    created_at: datetime
    trained_at: Optional[datetime]
    last_used_at: Optional[datetime]
    file_session_id: str
    file_original_name: str
    
    class Config:
        from_attributes = True


@router.get("/files", response_model=List[FileHistoryResponse])
async def get_file_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status (uploaded, processed, error)")
) -> List[FileHistoryResponse]:
    """
    Get user's file upload history.
    
    **Parameters:**
    - skip: Number of records to skip (for pagination)
    - limit: Maximum number of records to return (1-1000)
    - status: Optional filter by file status
    
    **Returns:**
    - List of user's uploaded files with metadata
    """
    try:
        query = db.query(FileMetadata).filter(FileMetadata.user_id == current_user.id)
        
        # Apply status filter if provided
        if status:
            query = query.filter(FileMetadata.status == status)
        
        # Order by upload date (newest first) and apply pagination
        files = query.order_by(FileMetadata.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"Retrieved {len(files)} file records for user {current_user.username}")
        return files
        
    except Exception as e:
        logger.error(f"Error retrieving file history for user {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "HISTORY_RETRIEVAL_ERROR",
                "message": "Failed to retrieve file history",
                "details": str(e)
            }
        )


@router.get("/models", response_model=List[ModelHistoryResponse])
async def get_model_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    algorithm: Optional[str] = Query(None, description="Filter by algorithm"),
    model_type: Optional[str] = Query(None, description="Filter by model type (classification/regression)"),
    status: Optional[str] = Query(None, description="Filter by status (training, completed, failed)")
) -> List[ModelHistoryResponse]:
    """
    Get user's model training history.
    
    **Parameters:**
    - skip: Number of records to skip (for pagination)
    - limit: Maximum number of records to return (1-1000)
    - algorithm: Optional filter by algorithm (random_forest, logistic_regression, xgboost)
    - model_type: Optional filter by model type (classification, regression)
    - status: Optional filter by training status
    
    **Returns:**
    - List of user's trained models with metadata
    """
    try:
        query = db.query(ModelMetadata, FileMetadata.session_id, FileMetadata.original_filename).join(
            FileMetadata, ModelMetadata.file_id == FileMetadata.id
        ).filter(ModelMetadata.user_id == current_user.id)
        
        # Apply filters if provided
        if algorithm:
            query = query.filter(ModelMetadata.algorithm == algorithm)
        if model_type:
            query = query.filter(ModelMetadata.model_type == model_type)
        if status:
            query = query.filter(ModelMetadata.status == status)
        
        # Order by creation date (newest first) and apply pagination
        results = query.order_by(ModelMetadata.created_at.desc()).offset(skip).limit(limit).all()
        
        # Transform results to include file information
        models = []
        for model, file_session_id, file_original_name in results:
            model_dict = {
                "id": model.id,
                "model_id": model.model_id,
                "model_name": model.model_name,
                "algorithm": model.algorithm,
                "model_type": model.model_type,
                "target_column": model.target_column,
                "evaluation_metrics": model.evaluation_metrics,
                "training_duration": model.training_duration,
                "num_features": model.num_features,
                "status": model.status,
                "created_at": model.created_at,
                "trained_at": model.trained_at,
                "last_used_at": model.last_used_at,
                "file_session_id": file_session_id,
                "file_original_name": file_original_name
            }
            models.append(ModelHistoryResponse(**model_dict))
        
        logger.info(f"Retrieved {len(models)} model records for user {current_user.username}")
        return models
        
    except Exception as e:
        logger.error(f"Error retrieving model history for user {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "HISTORY_RETRIEVAL_ERROR",
                "message": "Failed to retrieve model history",
                "details": str(e)
            }
        )


@router.get("/files/{session_id}", response_model=FileHistoryResponse)
async def get_file_details(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> FileHistoryResponse:
    """
    Get detailed information about a specific uploaded file.
    
    **Parameters:**
    - session_id: Session ID of the uploaded file
    
    **Returns:**
    - Detailed file metadata
    """
    try:
        file_metadata = db.query(FileMetadata).filter(
            FileMetadata.session_id == session_id,
            FileMetadata.user_id == current_user.id
        ).first()
        
        if not file_metadata:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "FILE_NOT_FOUND",
                    "message": f"File with session ID {session_id} not found or access denied"
                }
            )
        
        return file_metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving file details for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "FILE_DETAILS_ERROR",
                "message": "Failed to retrieve file details",
                "details": str(e)
            }
        )


@router.get("/models/{model_id}", response_model=ModelHistoryResponse)
async def get_model_details(
    model_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ModelHistoryResponse:
    """
    Get detailed information about a specific trained model.
    
    **Parameters:**
    - model_id: ID of the trained model
    
    **Returns:**
    - Detailed model metadata
    """
    try:
        result = db.query(ModelMetadata, FileMetadata.session_id, FileMetadata.original_filename).join(
            FileMetadata, ModelMetadata.file_id == FileMetadata.id
        ).filter(
            ModelMetadata.model_id == model_id,
            ModelMetadata.user_id == current_user.id
        ).first()
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "MODEL_NOT_FOUND",
                    "message": f"Model with ID {model_id} not found or access denied"
                }
            )
        
        model, file_session_id, file_original_name = result
        
        # Update last_used_at timestamp
        try:
            model.last_used_at = datetime.now()
            db.commit()
        except Exception:
            db.rollback()
            # Continue even if timestamp update fails
        
        model_dict = {
            "id": model.id,
            "model_id": model.model_id,
            "model_name": model.model_name,
            "algorithm": model.algorithm,
            "model_type": model.model_type,
            "target_column": model.target_column,
            "evaluation_metrics": model.evaluation_metrics,
            "training_duration": model.training_duration,
            "num_features": model.num_features,
            "status": model.status,
            "created_at": model.created_at,
            "trained_at": model.trained_at,
            "last_used_at": model.last_used_at,
            "file_session_id": file_session_id,
            "file_original_name": file_original_name
        }
        
        return ModelHistoryResponse(**model_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving model details for model {model_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "MODEL_DETAILS_ERROR",
                "message": "Failed to retrieve model details",
                "details": str(e)
            }
        )


@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get user's usage statistics.
    
    **Returns:**
    - Summary statistics about user's files and models
    """
    try:
        # Count files by status
        file_stats = db.query(FileMetadata.status, func.count(FileMetadata.id)).filter(
            FileMetadata.user_id == current_user.id
        ).group_by(FileMetadata.status).all()

        # Count models by status
        model_stats = db.query(ModelMetadata.status, func.count(ModelMetadata.id)).filter(
            ModelMetadata.user_id == current_user.id
        ).group_by(ModelMetadata.status).all()

        # Count models by algorithm
        algorithm_stats = db.query(ModelMetadata.algorithm, func.count(ModelMetadata.id)).filter(
            ModelMetadata.user_id == current_user.id
        ).group_by(ModelMetadata.algorithm).all()

        # Total file size
        total_file_size = db.query(func.sum(FileMetadata.file_size)).filter(
            FileMetadata.user_id == current_user.id
        ).scalar() or 0
        
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "file_statistics": {
                "total_files": sum(count for _, count in file_stats),
                "by_status": {status: count for status, count in file_stats},
                "total_size_bytes": total_file_size
            },
            "model_statistics": {
                "total_models": sum(count for _, count in model_stats),
                "by_status": {status: count for status, count in model_stats},
                "by_algorithm": {algorithm: count for algorithm, count in algorithm_stats}
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user stats for user {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "STATS_ERROR",
                "message": "Failed to retrieve user statistics",
                "details": str(e)
            }
        )
