"""
Model training API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Dict, Any
import logging
import os
import time
from sqlalchemy.orm import Session

from ..models.prediction import TrainRequest, TrainResponse
from ..core.file_handler import file_handler
from ..core.ml_processor import ml_processor
from ..core.smart_model_selector import smart_model_selector
from pydantic import BaseModel, Field
from typing import Optional
from ..core.intelligent_analyzer import intelligent_analyzer
from ..core.smart_model_selector import smart_model_selector
from ..core.enhanced_preprocessor import enhanced_preprocessor
from ..auth.dependencies import get_current_user
from ..database.models import User, FileMetadata, ModelMetadata
from ..database.database import get_db

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/train", tags=["Model Training"])


class EnhancedTrainRequest(BaseModel):
    """Request model for enhanced training"""
    target_column: str = Field(..., description="Target column name")
    model_name: str = Field(..., description="Model name/algorithm")
    problem_type: Optional[str] = Field(None, description="Problem type: classification, regression, or auto")


@router.post("/", response_model=TrainResponse)
async def train_model(
    request: TrainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TrainResponse:
    """
    Train a machine learning model on uploaded data.
    
    This endpoint:
    1. Loads the uploaded CSV file using the session ID
    2. Validates the target column
    3. Automatically detects problem type (classification/regression) if not specified
    4. Preprocesses the data (encoding, scaling, missing value handling)
    5. Trains the specified model algorithm
    6. Evaluates the model performance
    7. Saves the model to disk for future predictions
    8. Returns training results and evaluation metrics
    
    **Supported Algorithms:**
    - random_forest: Random Forest (default)
    - logistic_regression: Logistic Regression (classification) / Linear Regression (regression)
    - xgboost: XGBoost
    
    **Model Types:**
    - auto: Automatically detect classification vs regression (default)
    - classification: Force classification
    - regression: Force regression
    
    **Parameters:**
    - session_id: Session ID from file upload
    - target_column: Name of the target column to predict
    - model_type: Type of ML problem (auto, classification, regression)
    - algorithm: ML algorithm to use
    - test_size: Fraction of data to use for testing (0.1-0.5)
    - random_state: Random seed for reproducibility
    
    **Returns:**
    - model_id: Unique identifier for the trained model
    - Training information and dataset statistics
    - Evaluation metrics (accuracy, precision, recall, F1 for classification; RMSE, MAE, R² for regression)
    - Feature importance scores
    - Model file path for persistence
    """
    try:
        logger.info(f"Starting model training for session {request.session_id}")

        # Validate session and check user ownership
        file_metadata = db.query(FileMetadata).filter(
            FileMetadata.session_id == request.session_id,
            FileMetadata.user_id == current_user.id
        ).first()

        if not file_metadata:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "SESSION_NOT_FOUND",
                    "message": f"No file found for session ID: {request.session_id} or access denied",
                    "session_id": request.session_id
                }
            )

        # Get file path
        file_path = file_handler.get_file_path(request.session_id)
        if not file_path:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "FILE_NOT_FOUND",
                    "message": f"Physical file not found for session ID: {request.session_id}",
                    "session_id": request.session_id
                }
            )

        logger.info(f"File found for session {request.session_id}: {file_path}")
        
        # Validate request parameters
        if request.test_size < 0.1 or request.test_size > 0.5:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_TEST_SIZE",
                    "message": "Test size must be between 0.1 and 0.5",
                    "provided_value": request.test_size
                }
            )
        
        if request.algorithm not in ["random_forest", "logistic_regression", "xgboost"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "UNSUPPORTED_ALGORITHM",
                    "message": f"Algorithm '{request.algorithm}' is not supported",
                    "supported_algorithms": ["random_forest", "logistic_regression", "xgboost"]
                }
            )
        
        if request.model_type not in ["auto", "classification", "regression"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_MODEL_TYPE",
                    "message": f"Model type '{request.model_type}' is not valid",
                    "valid_types": ["auto", "classification", "regression"]
                }
            )
        
        logger.info(f"Training model with algorithm: {request.algorithm}, type: {request.model_type}")

        # Record training start time
        training_start_time = time.time()

        # Train the model
        training_result = ml_processor.train_model(
            file_path=file_path,
            target_column=request.target_column,
            session_id=request.session_id,
            model_type=request.model_type,
            algorithm=request.algorithm,
            test_size=request.test_size,
            random_state=request.random_state
        )

        # Calculate training duration
        training_duration = time.time() - training_start_time

        logger.info(f"Model training completed successfully. Model ID: {training_result['model_id']}")

        # Save model metadata to database
        try:
            # Get model file size
            model_file_size = None
            if os.path.exists(training_result["model_path"]):
                model_file_size = os.path.getsize(training_result["model_path"])

            model_metadata = ModelMetadata(
                model_id=training_result["model_id"],
                model_name=f"{request.algorithm}_{request.target_column}",
                algorithm=training_result["algorithm"],
                model_type=training_result["model_type"],
                target_column=request.target_column,
                test_size=request.test_size,
                random_state=request.random_state,
                training_parameters={
                    "algorithm": request.algorithm,
                    "model_type": request.model_type,
                    "test_size": request.test_size,
                    "random_state": request.random_state
                },
                evaluation_metrics=training_result["evaluation_metrics"],
                feature_importance=training_result["feature_importance"],
                model_path=training_result["model_path"],
                model_size=model_file_size,
                training_duration=training_duration,
                num_features=len(training_result.get("feature_importance", {})),
                num_training_samples=training_result["training_info"].get("train_samples"),
                num_test_samples=training_result["training_info"].get("test_samples"),
                user_id=current_user.id,
                file_id=file_metadata.id,
                trained_at=datetime.now(),
                status="completed"
            )

            db.add(model_metadata)
            db.commit()
            db.refresh(model_metadata)
            logger.info(f"Model metadata saved to database for model {training_result['model_id']}")

        except Exception as db_error:
            logger.error(f"Failed to save model metadata for model {training_result['model_id']}: {str(db_error)}")
            db.rollback()
            # Continue with response even if database save fails

        # Create response
        response = TrainResponse(
            model_id=training_result["model_id"],
            session_id=training_result["session_id"],
            model_type=training_result["model_type"],
            algorithm=training_result["algorithm"],
            training_info=training_result["training_info"],
            evaluation_metrics=training_result["evaluation_metrics"],
            feature_importance=training_result["feature_importance"],
            model_path=training_result["model_path"],
            timestamp=training_result["timestamp"]
        )

        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except ValueError as e:
        logger.error(f"Validation error during model training: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "TRAINING_VALIDATION_ERROR",
                "message": str(e),
                "session_id": request.session_id
            }
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during model training for session {request.session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "TRAINING_ERROR",
                "message": "An error occurred while training the model",
                "session_id": request.session_id,
                "details": str(e)
            }
        )


@router.post("/{session_id}/enhanced-train", response_model=TrainResponse)
async def enhanced_train_model(
    session_id: str,
    request: EnhancedTrainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TrainResponse:
    """
    Enhanced training endpoint with intelligent model selection and optimization.

    This endpoint provides advanced training capabilities:
    1. Uses intelligent model recommendations
    2. Applies enhanced preprocessing
    3. Optimizes hyperparameters
    4. Provides detailed performance insights

    **Parameters:**
    - session_id: Session ID from file upload (in URL path)
    - target_column: Name of the target column to predict
    - model_name: Recommended model algorithm
    - problem_type: Type of ML problem (optional, will auto-detect if not provided)

    **Returns:**
    - Enhanced training results with optimized model performance
    """
    try:
        logger.info(f"Starting enhanced model training for session {session_id}")

        # Validate session and get file path
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

        # Map model names to algorithms
        model_algorithm_map = {
            "random_forest": "random_forest",
            "logistic_regression": "logistic_regression",
            "xgboost": "xgboost",
            "linear_regression": "logistic_regression",  # Use logistic for linear
            "decision_tree": "random_forest",  # Use RF for decision tree
            "svm": "logistic_regression",  # Use logistic for SVM
            "naive_bayes": "logistic_regression"  # Use logistic for naive bayes
        }

        algorithm = model_algorithm_map.get(request.model_name.lower(), "random_forest")

        # Determine problem type
        problem_type = request.problem_type or "auto"

        logger.info(f"Enhanced training with algorithm: {algorithm}, type: {problem_type}")

        # Use the regular training method with enhanced parameters
        training_result = ml_processor.train_model(
            file_path=file_path,
            target_column=request.target_column,
            session_id=session_id,
            model_type=problem_type,
            algorithm=algorithm,
            test_size=0.2,  # Standard test size for enhanced training
            random_state=42
        )

        logger.info(f"Enhanced model training completed successfully. Model ID: {training_result['model_id']}")

        # Create response
        response = TrainResponse(
            model_id=training_result["model_id"],
            session_id=training_result["session_id"],
            model_type=training_result["model_type"],
            algorithm=training_result["algorithm"],
            training_info=training_result["training_info"],
            evaluation_metrics=training_result["evaluation_metrics"],
            feature_importance=training_result["feature_importance"],
            model_path=training_result["model_path"],
            timestamp=training_result["timestamp"]
        )

        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except ValueError as e:
        logger.error(f"Validation error during enhanced training: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "ENHANCED_TRAINING_VALIDATION_ERROR",
                "message": str(e),
                "session_id": session_id
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error during enhanced training for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "ENHANCED_TRAINING_ERROR",
                "message": "An error occurred while training the enhanced model",
                "session_id": session_id,
                "details": str(e)
            }
        )


@router.get("/algorithms")
async def get_supported_algorithms() -> Dict[str, Any]:
    """
    Get list of supported ML algorithms and their descriptions.
    
    **Returns:**
    - Dictionary of supported algorithms with descriptions and use cases
    """
    return {
        "algorithms": {
            "random_forest": {
                "name": "Random Forest",
                "description": "Ensemble method using multiple decision trees",
                "use_cases": ["Classification", "Regression"],
                "pros": ["Handles missing values", "Feature importance", "Robust to overfitting"],
                "cons": ["Can be slow on large datasets", "Less interpretable than single trees"]
            },
            "logistic_regression": {
                "name": "Logistic/Linear Regression",
                "description": "Linear model for classification and regression",
                "use_cases": ["Binary/Multi-class Classification", "Linear Regression"],
                "pros": ["Fast training", "Interpretable", "Probabilistic output"],
                "cons": ["Assumes linear relationships", "Sensitive to outliers"]
            },
            "xgboost": {
                "name": "XGBoost",
                "description": "Gradient boosting framework",
                "use_cases": ["Classification", "Regression"],
                "pros": ["High performance", "Feature importance", "Handles missing values"],
                "cons": ["More complex hyperparameters", "Can overfit with small datasets"]
            }
        },
        "model_types": {
            "auto": "Automatically detect classification vs regression based on target column",
            "classification": "Predict discrete categories or classes",
            "regression": "Predict continuous numerical values"
        },
        "default_algorithm": "random_forest",
        "default_model_type": "auto"
    }


@router.get("/status/{model_id}")
async def get_training_status(model_id: str) -> Dict[str, Any]:
    """
    Get training status and basic information for a model.
    
    **Parameters:**
    - model_id: The model ID returned from training
    
    **Returns:**
    - Model status and basic information
    """
    try:
        # Try to load model to check if it exists
        pipeline, metadata = ml_processor.load_model(model_id)
        
        return {
            "model_id": model_id,
            "status": "completed",
            "algorithm": metadata.get("algorithm", "unknown"),
            "problem_type": metadata.get("problem_type", "unknown"),
            "target_column": metadata.get("target_column", "unknown"),
            "session_id": metadata.get("session_id", "unknown"),
            "feature_count": len(metadata.get("feature_names", [])),
            "created_timestamp": metadata.get("timestamp", "unknown")
        }
        
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "MODEL_NOT_FOUND",
                "message": f"Model {model_id} not found",
                "model_id": model_id
            }
        )
    except Exception as e:
        logger.error(f"Error getting training status for model {model_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "STATUS_ERROR",
                "message": "Failed to get training status",
                "model_id": model_id,
                "details": str(e)
            }
        )


@router.get("/{session_id}/model-recommendations")
async def get_model_recommendations(
    session_id: str,
    target_column: str,
    problem_type: str = "auto"
) -> Dict[str, Any]:
    """
    Get intelligent model recommendations based on dataset characteristics.

    This endpoint analyzes the dataset and provides smart recommendations for:
    - Best ML algorithms for the specific dataset
    - Hyperparameter suggestions
    - Expected performance estimates
    - Training time estimates
    - Model complexity analysis

    **Parameters:**
    - session_id: Session ID from file upload
    - target_column: Name of the target column
    - problem_type: 'auto', 'classification', or 'regression'

    **Returns:**
    - Ranked list of recommended models with detailed analysis
    """
    try:
        logger.info(f"Getting model recommendations for session {session_id}")

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

        # Load and analyze data
        df = ml_processor.load_data(file_path)

        # Validate target column
        if target_column not in df.columns:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_TARGET_COLUMN",
                    "message": f"Target column '{target_column}' not found in dataset",
                    "available_columns": df.columns.tolist()
                }
            )

        # Detect problem type if auto
        if problem_type == "auto":
            detected_type = ml_processor.detect_problem_type(df, target_column)
            problem_type = detected_type

        # Get dataset characteristics
        dataset_characteristics = {
            'dataset_size': len(df),
            'feature_count': len(df.columns) - 1,
            'target_column': target_column,
            'problem_type': problem_type,
            'missing_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
            'duplicate_percentage': (df.duplicated().sum() / len(df)) * 100,
            'data_quality': {
                'missing_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
                'outlier_percentage': 0  # Will be calculated by smart selector
            }
        }

        # Get model recommendations
        recommendations = smart_model_selector.recommend_models(
            dataset_characteristics,
            problem_type
        )

        # Filter out non-serializable data from recommendations
        serializable_recommendations = []
        for rec in recommendations:
            serializable_rec = {
                'model_name': rec['model_name'],
                'score': rec['score'],
                'reasons': rec['reasons'],
                'suitability_factors': rec['suitability_factors'],
                'recommended_params': rec['recommended_params'],
                'model_info': {
                    'best_for': rec['model_info']['best_for'],
                    'complexity': rec['model_info']['complexity'],
                    'training_time': rec['model_info']['training_time']
                }
            }
            serializable_recommendations.append(serializable_rec)

        logger.info(f"Model recommendations generated for session {session_id}")

        return {
            "session_id": session_id,
            "target_column": target_column,
            "problem_type": problem_type,
            "dataset_characteristics": dataset_characteristics,
            "model_recommendations": serializable_recommendations,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error getting model recommendations for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "RECOMMENDATION_ERROR",
                "message": "An error occurred while generating model recommendations",
                "session_id": session_id,
                "details": str(e)
            }
        )


@router.post("/{session_id}/enhanced-train")
async def enhanced_train_model_v2(
    session_id: str,
    target_column: str,
    model_name: str = "auto",
    problem_type: str = "auto",
    optimization_level: str = "medium",
    preprocessing_config: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Enhanced model training with intelligent preprocessing and optimization.

    This endpoint provides advanced training capabilities:
    - Intelligent preprocessing based on data characteristics
    - Smart model selection if model_name is 'auto'
    - Hyperparameter optimization
    - Advanced feature engineering
    - Comprehensive model evaluation

    **Parameters:**
    - session_id: Session ID from file upload
    - target_column: Name of the target column
    - model_name: Model to train ('auto' for smart selection)
    - problem_type: 'auto', 'classification', or 'regression'
    - optimization_level: 'basic', 'medium', 'advanced'
    - preprocessing_config: Optional preprocessing configuration

    **Returns:**
    - Enhanced training results with detailed analysis
    """
    try:
        logger.info(f"Starting enhanced training for session {session_id}")

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

        # Load data
        df = ml_processor.load_data(file_path)

        # Validate target column
        if target_column not in df.columns:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_TARGET_COLUMN",
                    "message": f"Target column '{target_column}' not found in dataset",
                    "available_columns": df.columns.tolist()
                }
            )

        # Detect problem type if auto
        if problem_type == "auto":
            detected_type = ml_processor.detect_problem_type(df, target_column)
            problem_type = detected_type

        # Get intelligent analysis
        analysis = intelligent_analyzer.analyze_dataset(df, session_id)

        # Smart model selection if requested
        if model_name == "auto":
            dataset_characteristics = {
                'dataset_size': len(df),
                'feature_count': len(df.columns) - 1,
                'data_quality': analysis.get('data_quality', {})
            }

            recommendations = smart_model_selector.recommend_models(
                dataset_characteristics,
                problem_type
            )

            if recommendations:
                model_name = recommendations[0]['model_name']
                logger.info(f"Auto-selected model: {model_name}")
            else:
                model_name = "random_forest"  # Fallback

        # Enhanced preprocessing
        preprocessor, feature_names, preprocessing_info = enhanced_preprocessor.create_preprocessing_pipeline(
            df, target_column, problem_type, preprocessing_config
        )

        # Train model with enhanced pipeline
        training_result = ml_processor.train_model_enhanced(
            df, target_column, model_name, problem_type,
            preprocessor, feature_names, optimization_level
        )

        # Combine all results
        enhanced_result = {
            "session_id": session_id,
            "target_column": target_column,
            "problem_type": problem_type,
            "selected_model": model_name,
            "intelligent_analysis": analysis,
            "preprocessing_info": preprocessing_info,
            "training_result": training_result,
            "optimization_level": optimization_level,
            "timestamp": datetime.now().isoformat()
        }

        logger.info(f"Enhanced training completed for session {session_id}")

        return enhanced_result

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error during enhanced training for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "ENHANCED_TRAINING_ERROR",
                "message": "An error occurred during enhanced model training",
                "session_id": session_id,
                "details": str(e)
            }
        )
