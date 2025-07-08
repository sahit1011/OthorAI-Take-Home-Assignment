"""
File upload API endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Dict, Any
import logging

from ..models.upload import UploadResponse, UploadError, FileValidationError
from ..core.file_handler import file_handler
from ..core.data_processor import data_processor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["File Upload"])


@router.post("/", response_model=UploadResponse)
async def upload_csv_file(
    file: UploadFile = File(..., description="CSV file to upload (max 50MB)")
) -> UploadResponse:
    """
    Upload a CSV file for analysis and processing.
    
    This endpoint:
    1. Validates the uploaded file (type, size)
    2. Saves the file with streaming to handle large files
    3. Performs basic schema inference
    4. Returns a session ID for subsequent operations
    
    **File Requirements:**
    - Format: CSV only
    - Size: Maximum 50MB
    - Structure: Valid CSV with headers
    
    **Returns:**
    - session_id: Unique identifier for this upload session
    - Basic dataset information (rows, columns, file size)
    - Schema information for each column
    """
    session_id = None
    
    try:
        # Generate session ID
        session_id = file_handler.generate_session_id()
        logger.info(f"Starting file upload for session {session_id}: {file.filename}")
        
        # Validate file
        file_handler.validate_file(file)
        logger.info(f"File validation passed for session {session_id}")
        
        # Save file with streaming
        file_path = await file_handler.save_uploaded_file(file, session_id)
        logger.info(f"File saved successfully for session {session_id}: {file_path}")
        
        # Get file information
        file_info = file_handler.get_file_info(file_path)
        
        # Validate CSV structure
        validation_result = data_processor.validate_csv_structure(file_path)
        if not validation_result["is_valid"]:
            # Clean up file on validation failure
            file_handler.cleanup_file(session_id)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_CSV_STRUCTURE",
                    "message": "CSV file has structural issues",
                    "issues": validation_result["issues"]
                }
            )
        
        # Get dataset information
        dataset_info = data_processor.get_dataset_info(file_path)
        logger.info(f"Dataset info extracted for session {session_id}: {dataset_info['rows']} rows, {dataset_info['columns']} columns")
        
        # Infer schema
        schema = data_processor.infer_schema(file_path)
        logger.info(f"Schema inference completed for session {session_id}")
        
        # Create response
        response = UploadResponse(
            session_id=session_id,
            filename=file.filename,
            file_size=file_info["file_size"],
            rows=dataset_info["rows"],
            columns=dataset_info["columns"],
            upload_timestamp=datetime.now(),
            data_schema=schema,
            message="File uploaded and processed successfully"
        )
        
        logger.info(f"Upload completed successfully for session {session_id}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors)
        if session_id:
            file_handler.cleanup_file(session_id)
        raise
        
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error during upload for session {session_id}: {str(e)}")
        
        # Clean up file if it was created
        if session_id:
            file_handler.cleanup_file(session_id)
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "UPLOAD_PROCESSING_ERROR",
                "message": "An error occurred while processing the uploaded file",
                "details": str(e)
            }
        )


@router.get("/session/{session_id}/info")
async def get_upload_info(session_id: str) -> Dict[str, Any]:
    """
    Get information about an uploaded file by session ID.
    
    **Parameters:**
    - session_id: The session ID returned from the upload endpoint
    
    **Returns:**
    - Basic file and dataset information
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
        
        # Get file and dataset information
        file_info = file_handler.get_file_info(file_path)
        dataset_info = data_processor.get_dataset_info(file_path)
        
        return {
            "session_id": session_id,
            "file_info": file_info,
            "dataset_info": dataset_info,
            "status": "active"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting upload info for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "INFO_RETRIEVAL_ERROR",
                "message": "Failed to retrieve upload information",
                "details": str(e)
            }
        )


@router.delete("/session/{session_id}")
async def cleanup_upload_session(session_id: str) -> Dict[str, str]:
    """
    Clean up an upload session and delete associated files.
    
    **Parameters:**
    - session_id: The session ID to clean up
    
    **Returns:**
    - Confirmation message
    """
    try:
        success = file_handler.cleanup_file(session_id)
        
        if success:
            logger.info(f"Session {session_id} cleaned up successfully")
            return {
                "message": f"Session {session_id} cleaned up successfully",
                "session_id": session_id
            }
        else:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "SESSION_NOT_FOUND",
                    "message": f"No file found for session ID: {session_id}"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cleaning up session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "CLEANUP_ERROR",
                "message": "Failed to clean up session",
                "details": str(e)
            }
        )
