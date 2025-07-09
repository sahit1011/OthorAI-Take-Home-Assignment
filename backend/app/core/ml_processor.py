"""
Machine Learning processing utilities for model training and prediction
"""
import pandas as pd
import numpy as np
import joblib
import uuid
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Set up logger
logger = logging.getLogger(__name__)

# ML imports
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    mean_squared_error, r2_score, mean_absolute_error,
    classification_report, confusion_matrix
)
from sklearn.pipeline import Pipeline
import xgboost as xgb

from .data_processor import data_processor


class MLProcessor:
    """Handles machine learning model training and prediction"""
    
    def __init__(self):
        self.models_dir = Path("data/models")
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Model configurations
        self.model_configs = {
            "random_forest": {
                "classification": RandomForestClassifier(n_estimators=100, random_state=42),
                "regression": RandomForestRegressor(n_estimators=100, random_state=42)
            },
            "logistic_regression": {
                "classification": LogisticRegression(random_state=42, max_iter=1000),
                "regression": LinearRegression()
            },
            "xgboost": {
                "classification": xgb.XGBClassifier(random_state=42, eval_metric='logloss'),
                "regression": xgb.XGBRegressor(random_state=42)
            }
        }
    
    def generate_model_id(self, session_id: str) -> str:
        """Generate unique model ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"model_{session_id[:8]}_{timestamp}"
    
    def train_model(
        self,
        file_path: Path = None,
        target_column: str = None,
        session_id: str = None,
        model_type: str = "auto",
        algorithm: str = "random_forest",
        test_size: float = 0.2,
        random_state: int = 42,
        X_train: Any = None,
        X_test: Any = None,
        y_train: Any = None,
        y_test: Any = None
    ) -> Dict[str, Any]:
        """Train a machine learning model"""
        try:
            # Check if pre-processed data is provided
            if X_train is not None and X_test is not None and y_train is not None and y_test is not None:
                # Use provided pre-processed data
                logger.info("Using pre-processed data for training")
                X_train_processed = X_train
                X_test_processed = X_test
                y_train_processed = y_train
                y_test_processed = y_test

                # Infer problem type from target
                if model_type == "auto":
                    problem_type = self.detect_problem_type(pd.DataFrame({'target': y_train}), 'target')
                else:
                    problem_type = model_type
            else:
                # Load data from file
                if file_path is None:
                    raise ValueError("Either file_path or pre-processed data must be provided")

                df = pd.read_csv(file_path)

                # Validate target column
                if target_column not in df.columns:
                    raise ValueError(f"Target column '{target_column}' not found in dataset")

                # Prepare features and target
                X, y = data_processor.prepare_features_and_target(df, target_column)

                # Infer problem type if auto
                if model_type == "auto":
                    problem_type = data_processor.infer_problem_type(y)
                else:
                    problem_type = model_type

                # Create preprocessing pipeline
                preprocessor = data_processor.create_preprocessing_pipeline(X)

                # Split and preprocess data
                from sklearn.model_selection import train_test_split
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=random_state,
                    stratify=y if problem_type == "classification" else None
                )

                X_train_processed = preprocessor.fit_transform(X_train)
                X_test_processed = preprocessor.transform(X_test)
                y_train_processed = y_train
                y_test_processed = y_test

            if problem_type not in ["classification", "regression"]:
                raise ValueError(f"Invalid problem type: {problem_type}")

            # Get model
            if algorithm not in self.model_configs:
                raise ValueError(f"Unsupported algorithm: {algorithm}")

            model = self.model_configs[algorithm][problem_type]

            # Create pipeline with preprocessing and model
            from sklearn.pipeline import Pipeline
            pipeline = Pipeline([
                ('preprocessor', preprocessor),
                ('model', model)
            ])

            # Train pipeline on original data (it will handle preprocessing internally)
            pipeline.fit(X_train, y_train_processed)

            # Make predictions using the pipeline
            y_pred = pipeline.predict(X_test)

            # Calculate metrics
            metrics = self._calculate_metrics(y_test_processed, y_pred, problem_type)
            logger.info(f"Calculated metrics: {metrics}")

            # Get feature importance
            try:
                feature_importance = self._get_feature_importance(pipeline.named_steps['model'], X)
            except:
                feature_importance = {}

            # Generate model ID and save
            model_id = self.generate_model_id(session_id or "enhanced")

            # Store original feature names (before preprocessing) for prediction
            original_feature_names = X.columns.tolist() if hasattr(X, 'columns') else [f'feature_{i}' for i in range(X.shape[1])]

            model_path = self._save_model(pipeline, model_id, {
                'session_id': session_id or "enhanced",
                'target_column': target_column or "target",
                'problem_type': problem_type,
                'algorithm': algorithm,
                'feature_names': original_feature_names,  # Store original feature names
                'evaluation_metrics': metrics,  # Include evaluation metrics
                'feature_importance': feature_importance,  # Include feature importance
                'timestamp': datetime.now(),  # Include timestamp
                'preprocessing_info': {
                    'enhanced_preprocessing': False,  # This is the regular training method
                    'original_feature_names': original_feature_names,
                    'numerical_cols': X.select_dtypes(include=['int64', 'float64']).columns.tolist(),
                    'categorical_cols': X.select_dtypes(include=['object', 'category']).columns.tolist()
                }
            })

            # Training info
            training_info = {
                "features_count": X_train_processed.shape[1] if hasattr(X_train_processed, 'shape') else len(X_train_processed[0]),
                "target_column": target_column or "target",
                "problem_type": problem_type,
                "algorithm": algorithm,
                "test_size": test_size,
                "training_samples": len(X_train_processed),
                "test_samples": len(X_test_processed)
            }
            
            result = {
                "model_id": model_id,
                "session_id": session_id or "enhanced",
                "model_type": problem_type,
                "algorithm": algorithm,
                "training_info": training_info,
                "evaluation_metrics": metrics,
                "feature_importance": feature_importance,
                "model_path": str(model_path),
                "timestamp": datetime.now()
            }

            logger.info(f"Training result structure: {result}")
            return result
            
        except Exception as e:
            raise ValueError(f"Model training failed: {str(e)}")
    
    def _calculate_metrics(self, y_true, y_pred, problem_type: str) -> Dict[str, Any]:
        """Calculate evaluation metrics based on problem type"""
        metrics = {}
        
        if problem_type == "classification":
            metrics.update({
                "accuracy": float(accuracy_score(y_true, y_pred)),
                "precision": float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
                "recall": float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
                "f1_score": float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
            })
            
            # Add confusion matrix for binary classification
            if len(np.unique(y_true)) == 2:
                cm = confusion_matrix(y_true, y_pred)
                metrics["confusion_matrix"] = cm.tolist()
        
        else:  # regression
            metrics.update({
                "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
                "mae": float(mean_absolute_error(y_true, y_pred)),
                "r2_score": float(r2_score(y_true, y_pred))
            })
        
        return metrics
    
    def _get_feature_importance(self, pipeline, X: pd.DataFrame) -> Dict[str, float]:
        """Extract feature importance from trained model"""
        try:
            model = pipeline.named_steps['model']
            
            # Get feature importance if available
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                
                # Get feature names after preprocessing
                feature_names = data_processor.get_feature_names_after_preprocessing(
                    pipeline.named_steps['preprocessor'], X
                )
                
                # Create importance dictionary
                if len(feature_names) == len(importances):
                    importance_dict = dict(zip(feature_names, importances))
                    # Sort by importance and return top features
                    sorted_importance = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
                    return {k: float(v) for k, v in list(sorted_importance.items())[:10]}  # Top 10 features
                else:
                    # Fallback to original column names
                    return dict(zip(X.columns[:len(importances)], importances))
            
            elif hasattr(model, 'coef_'):
                # For linear models
                coefficients = np.abs(model.coef_).flatten() if model.coef_.ndim > 1 else np.abs(model.coef_)
                feature_names = data_processor.get_feature_names_after_preprocessing(
                    pipeline.named_steps['preprocessor'], X
                )
                
                if len(feature_names) == len(coefficients):
                    importance_dict = dict(zip(feature_names, coefficients))
                    sorted_importance = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
                    return {k: float(v) for k, v in list(sorted_importance.items())[:10]}
                else:
                    return dict(zip(X.columns[:len(coefficients)], coefficients))
            
            else:
                return {}
                
        except Exception as e:
            print(f"Warning: Could not extract feature importance: {e}")
            return {}
    
    def _save_model(self, pipeline, model_id: str, metadata: Dict[str, Any]) -> Path:
        """Save trained model and metadata to disk"""
        model_path = self.models_dir / f"{model_id}.joblib"
        metadata_path = self.models_dir / f"{model_id}_metadata.joblib"
        
        # Save model
        joblib.dump(pipeline, model_path)
        
        # Save metadata
        joblib.dump(metadata, metadata_path)
        
        return model_path

    def load_model(self, model_id: str) -> Tuple[Pipeline, Dict[str, Any]]:
        """Load trained model and metadata from disk"""
        model_path = self.models_dir / f"{model_id}.joblib"
        metadata_path = self.models_dir / f"{model_id}_metadata.joblib"

        if not model_path.exists():
            raise ValueError(f"Model {model_id} not found")

        if not metadata_path.exists():
            raise ValueError(f"Model metadata for {model_id} not found")

        # Load model and metadata
        pipeline = joblib.load(model_path)
        metadata = joblib.load(metadata_path)

        return pipeline, metadata

    def load_data(self, file_path: Path) -> pd.DataFrame:
        """Load CSV data for processing"""
        try:
            df = pd.read_csv(file_path)
            return df
        except Exception as e:
            logger.error(f"Error loading CSV file {file_path}: {str(e)}")
            raise ValueError(f"Failed to load CSV file: {str(e)}")

    def detect_problem_type(self, df: pd.DataFrame, target_column: str) -> str:
        """Detect whether the problem is classification or regression"""
        try:
            target_data = df[target_column].dropna()

            # Check if target is numeric
            if pd.api.types.is_numeric_dtype(target_data):
                # Check cardinality
                unique_ratio = target_data.nunique() / len(target_data)

                # If low cardinality (< 10 unique values or < 5% unique), likely classification
                if target_data.nunique() <= 10 or unique_ratio < 0.05:
                    return "classification"
                else:
                    return "regression"
            else:
                # Non-numeric target is classification
                return "classification"

        except Exception as e:
            logger.error(f"Error detecting problem type: {str(e)}")
            # Default to classification if detection fails
            return "classification"

    def train_model_enhanced(
        self,
        df: pd.DataFrame,
        target_column: str,
        model_name: str,
        problem_type: str,
        preprocessor: Any,
        feature_names: List[str],
        optimization_level: str = "medium"
    ) -> Dict[str, Any]:
        """Enhanced model training with preprocessing pipeline"""
        try:
            logger.info(f"Starting enhanced training for {model_name} ({problem_type})")

            # Prepare data
            X = df.drop(columns=[target_column])
            y = df[target_column]

            # Split data
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y if problem_type == "classification" else None
            )

            # Apply preprocessing
            X_train_processed = preprocessor.fit_transform(X_train)
            X_test_processed = preprocessor.transform(X_test)

            # Train model using existing method
            training_result = self.train_model(
                file_path=None,  # We already have the data
                target_column=target_column,
                session_id=f"enhanced_{model_name}",
                model_type=problem_type,
                algorithm=model_name,
                test_size=0.2,
                random_state=42,
                X_train=X_train_processed,
                X_test=X_test_processed,
                y_train=y_train,
                y_test=y_test
            )

            # Add enhanced information
            training_result.update({
                "preprocessing_applied": True,
                "feature_names": feature_names,
                "optimization_level": optimization_level,
                "enhanced_training": True
            })

            return training_result

        except Exception as e:
            logger.error(f"Error in enhanced training: {str(e)}")
            raise ValueError(f"Enhanced training failed: {str(e)}")

    def predict(self, model_id: str, input_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Make predictions using a trained model"""
        try:
            # Load model and metadata
            pipeline, metadata = self.load_model(model_id)

            # Convert input data to DataFrame
            df = pd.DataFrame(input_data)

            # Validate input features
            expected_features = metadata['feature_names']
            missing_features = set(expected_features) - set(df.columns)
            if missing_features:
                raise ValueError(f"Missing required features: {list(missing_features)}")

            # Select only expected features in correct order
            df = df[expected_features]

            # Make predictions
            predictions = pipeline.predict(df)

            # Get prediction probabilities for classification
            probabilities = None
            if hasattr(pipeline.named_steps['model'], 'predict_proba'):
                try:
                    proba = pipeline.predict_proba(df)
                    if proba is not None:
                        classes = pipeline.named_steps['model'].classes_
                        probabilities = []
                        for prob_row in proba:
                            prob_dict = {f"class_{cls}": float(prob) for cls, prob in zip(classes, prob_row)}
                            probabilities.append(prob_dict)
                except:
                    probabilities = None

            # Calculate confidence scores
            confidence_scores = self._calculate_confidence_scores(pipeline, df, metadata['problem_type'])

            # Format results
            results = []
            for i, pred in enumerate(predictions):
                result = {
                    "prediction": self._convert_prediction_type(pred),
                    "confidence": float(confidence_scores[i]) if confidence_scores is not None else 0.5
                }

                if probabilities and i < len(probabilities):
                    result["probabilities"] = probabilities[i]

                results.append(result)

            return {
                "model_id": model_id,
                "predictions": results,
                "prediction_timestamp": datetime.now()
            }

        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")

    def _calculate_confidence_scores(self, pipeline, X: pd.DataFrame, problem_type: str) -> Optional[List[float]]:
        """Calculate confidence scores for predictions"""
        try:
            if problem_type == "classification" and hasattr(pipeline.named_steps['model'], 'predict_proba'):
                # For classification, use max probability as confidence
                proba = pipeline.predict_proba(X)
                return [float(np.max(prob)) for prob in proba]

            elif problem_type == "regression":
                # For regression, use a simple confidence based on prediction variance
                # This is a simplified approach - in practice, you might use prediction intervals
                predictions = pipeline.predict(X)
                std_pred = np.std(predictions)
                if std_pred > 0:
                    # Normalize confidence between 0.1 and 0.9
                    normalized_conf = 1.0 / (1.0 + std_pred)
                    return [float(max(0.1, min(0.9, normalized_conf))) for _ in predictions]
                else:
                    return [0.8 for _ in predictions]  # Default confidence

            else:
                return None

        except Exception:
            return None

    def _convert_prediction_type(self, prediction):
        """Convert prediction to JSON-serializable type"""
        if isinstance(prediction, (np.integer, np.int64, np.int32)):
            return int(prediction)
        elif isinstance(prediction, (np.floating, np.float64, np.float32)):
            return float(prediction)
        elif isinstance(prediction, np.bool_):
            return bool(prediction)
        else:
            return str(prediction)

    def get_model_summary(self, model_id: str) -> Dict[str, Any]:
        """Get comprehensive model summary"""
        try:
            # Load model and metadata
            pipeline, metadata = self.load_model(model_id)

            # Basic model info with safe access
            model_summary = {
                "model_id": model_id,
                "algorithm": metadata.get('algorithm', 'unknown'),
                "problem_type": metadata.get('problem_type', 'unknown'),
                "target_column": metadata.get('target_column', 'unknown'),
                "feature_count": len(metadata.get('feature_names', [])),
                "created_timestamp": metadata.get('timestamp', 'Unknown'),
                "evaluation_metrics": metadata.get('evaluation_metrics', {})
            }

            # Dataset summary with safe access
            preprocessing_info = metadata.get('preprocessing_info', {})
            dataset_summary = {
                "session_id": metadata.get('session_id', 'unknown'),
                "features": metadata.get('feature_names', []),
                "numerical_features": preprocessing_info.get('numerical_cols', []),
                "categorical_features": preprocessing_info.get('categorical_cols', [])
            }

            return {
                "model_id": model_id,
                "dataset_summary": dataset_summary,
                "model_summary": model_summary,
                "timestamp": datetime.now()
            }

        except Exception as e:
            raise ValueError(f"Failed to get model summary: {str(e)}")


# Global ML processor instance
ml_processor = MLProcessor()
