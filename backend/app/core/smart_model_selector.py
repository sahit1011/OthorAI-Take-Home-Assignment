"""
Smart Model Selection Engine for AI Analyst as a Service

This module provides intelligent model selection and hyperparameter optimization
based on dataset characteristics, problem type, and performance requirements.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import logging
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartModelSelector:
    """
    Intelligent model selector that recommends and optimizes models
    based on dataset characteristics and problem requirements
    """
    
    def __init__(self):
        self.classification_models = {
            'logistic_regression': {
                'model': LogisticRegression,
                'params': {
                    'C': [0.1, 1, 10, 100],
                    'solver': ['liblinear', 'lbfgs'],
                    'max_iter': [1000]
                },
                'best_for': ['small_data', 'interpretable', 'linear_relationships'],
                'complexity': 'low',
                'training_time': 'fast'
            },
            'random_forest': {
                'model': RandomForestClassifier,
                'params': {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [None, 10, 20, 30],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                },
                'best_for': ['medium_data', 'non_linear', 'feature_importance'],
                'complexity': 'medium',
                'training_time': 'medium'
            },
            'xgboost': {
                'model': xgb.XGBClassifier,
                'params': {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [3, 6, 9],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.8, 0.9, 1.0]
                },
                'best_for': ['large_data', 'high_performance', 'competitions'],
                'complexity': 'high',
                'training_time': 'slow'
            },
            'svm': {
                'model': SVC,
                'params': {
                    'C': [0.1, 1, 10],
                    'kernel': ['linear', 'rbf'],
                    'gamma': ['scale', 'auto']
                },
                'best_for': ['small_data', 'high_dimensional', 'clear_margins'],
                'complexity': 'medium',
                'training_time': 'slow'
            },
            'knn': {
                'model': KNeighborsClassifier,
                'params': {
                    'n_neighbors': [3, 5, 7, 9],
                    'weights': ['uniform', 'distance'],
                    'metric': ['euclidean', 'manhattan']
                },
                'best_for': ['small_data', 'local_patterns', 'simple_baseline'],
                'complexity': 'low',
                'training_time': 'fast'
            },
            'naive_bayes': {
                'model': GaussianNB,
                'params': {},
                'best_for': ['small_data', 'text_classification', 'baseline'],
                'complexity': 'low',
                'training_time': 'very_fast'
            },
            'decision_tree': {
                'model': DecisionTreeClassifier,
                'params': {
                    'max_depth': [None, 5, 10, 20],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                },
                'best_for': ['interpretable', 'rule_based', 'baseline'],
                'complexity': 'low',
                'training_time': 'fast'
            }
        }
        
        self.regression_models = {
            'linear_regression': {
                'model': LinearRegression,
                'params': {},
                'best_for': ['small_data', 'interpretable', 'linear_relationships'],
                'complexity': 'low',
                'training_time': 'very_fast'
            },
            'ridge_regression': {
                'model': Ridge,
                'params': {
                    'alpha': [0.1, 1, 10, 100]
                },
                'best_for': ['small_data', 'regularization', 'multicollinearity'],
                'complexity': 'low',
                'training_time': 'fast'
            },
            'lasso_regression': {
                'model': Lasso,
                'params': {
                    'alpha': [0.1, 1, 10, 100]
                },
                'best_for': ['feature_selection', 'sparse_data', 'regularization'],
                'complexity': 'low',
                'training_time': 'fast'
            },
            'random_forest': {
                'model': RandomForestRegressor,
                'params': {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [None, 10, 20, 30],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                },
                'best_for': ['medium_data', 'non_linear', 'feature_importance'],
                'complexity': 'medium',
                'training_time': 'medium'
            },
            'xgboost': {
                'model': xgb.XGBRegressor,
                'params': {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [3, 6, 9],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.8, 0.9, 1.0]
                },
                'best_for': ['large_data', 'high_performance', 'competitions'],
                'complexity': 'high',
                'training_time': 'slow'
            },
            'svm': {
                'model': SVR,
                'params': {
                    'C': [0.1, 1, 10],
                    'kernel': ['linear', 'rbf'],
                    'gamma': ['scale', 'auto']
                },
                'best_for': ['small_data', 'high_dimensional', 'non_linear'],
                'complexity': 'medium',
                'training_time': 'slow'
            },
            'knn': {
                'model': KNeighborsRegressor,
                'params': {
                    'n_neighbors': [3, 5, 7, 9],
                    'weights': ['uniform', 'distance'],
                    'metric': ['euclidean', 'manhattan']
                },
                'best_for': ['small_data', 'local_patterns', 'simple_baseline'],
                'complexity': 'low',
                'training_time': 'fast'
            },
            'decision_tree': {
                'model': DecisionTreeRegressor,
                'params': {
                    'max_depth': [None, 5, 10, 20],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                },
                'best_for': ['interpretable', 'rule_based', 'baseline'],
                'complexity': 'low',
                'training_time': 'fast'
            }
        }
    
    def recommend_models(
        self, 
        dataset_characteristics: Dict[str, Any], 
        problem_type: str,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Recommend the best models based on dataset characteristics and user preferences
        
        Args:
            dataset_characteristics: Information about the dataset
            problem_type: 'classification' or 'regression'
            user_preferences: User preferences for model selection
            
        Returns:
            List of recommended models with scores and reasons
        """
        logger.info(f"Recommending models for {problem_type} problem")
        
        # Get available models for the problem type
        available_models = (
            self.classification_models if problem_type == 'classification' 
            else self.regression_models
        )
        
        # Initialize user preferences
        preferences = {
            'interpretability': 'medium',  # 'low', 'medium', 'high'
            'training_time': 'medium',     # 'fast', 'medium', 'slow'
            'performance': 'high',         # 'low', 'medium', 'high'
            'complexity': 'medium'         # 'low', 'medium', 'high'
        }
        if user_preferences:
            preferences.update(user_preferences)
        
        # Score each model
        model_scores = []
        for model_name, model_info in available_models.items():
            score = self._score_model(model_name, model_info, dataset_characteristics, preferences)
            model_scores.append({
                'model_name': model_name,
                'score': score['total_score'],
                'reasons': score['reasons'],
                'suitability_factors': score['factors'],
                'model_info': model_info,
                'recommended_params': self._get_recommended_params(
                    model_name, model_info, dataset_characteristics
                )
            })
        
        # Sort by score and return top recommendations
        model_scores.sort(key=lambda x: x['score'], reverse=True)
        
        return model_scores[:5]  # Return top 5 recommendations
    
    def _score_model(
        self, 
        model_name: str, 
        model_info: Dict[str, Any], 
        dataset_chars: Dict[str, Any], 
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score a model based on dataset characteristics and preferences"""
        score = 0
        reasons = []
        factors = {}
        
        # Dataset size factor
        dataset_size = dataset_chars.get('dataset_size', 1000)
        if dataset_size < 1000:
            size_category = 'small'
        elif dataset_size < 10000:
            size_category = 'medium'
        else:
            size_category = 'large'
        
        # Score based on dataset size suitability
        if f"{size_category}_data" in model_info['best_for']:
            score += 25
            reasons.append(f"Well-suited for {size_category} datasets")
            factors['dataset_size'] = 'excellent'
        elif size_category == 'small' and model_info['complexity'] == 'low':
            score += 15
            reasons.append("Simple model appropriate for small dataset")
            factors['dataset_size'] = 'good'
        elif size_category == 'large' and model_info['complexity'] == 'high':
            score += 15
            reasons.append("Complex model can leverage large dataset")
            factors['dataset_size'] = 'good'
        else:
            factors['dataset_size'] = 'fair'
        
        # Feature count factor
        feature_count = dataset_chars.get('feature_count', 10)
        if feature_count > 50 and 'high_dimensional' in model_info['best_for']:
            score += 20
            reasons.append("Handles high-dimensional data well")
            factors['feature_dimensionality'] = 'excellent'
        elif feature_count < 10 and model_info['complexity'] == 'low':
            score += 10
            reasons.append("Appropriate for low-dimensional data")
            factors['feature_dimensionality'] = 'good'
        else:
            factors['feature_dimensionality'] = 'fair'
        
        # Performance preference
        if preferences['performance'] == 'high' and 'high_performance' in model_info['best_for']:
            score += 20
            reasons.append("High-performance model")
            factors['performance_potential'] = 'excellent'
        elif preferences['performance'] == 'medium' and model_info['complexity'] == 'medium':
            score += 10
            factors['performance_potential'] = 'good'
        else:
            factors['performance_potential'] = 'fair'
        
        # Interpretability preference
        interpretability_score = self._get_interpretability_score(model_name)
        if preferences['interpretability'] == 'high' and interpretability_score >= 8:
            score += 15
            reasons.append("Highly interpretable model")
            factors['interpretability'] = 'excellent'
        elif preferences['interpretability'] == 'medium' and interpretability_score >= 5:
            score += 10
            factors['interpretability'] = 'good'
        elif preferences['interpretability'] == 'low':
            score += 5  # No penalty for low interpretability preference
            factors['interpretability'] = 'not_prioritized'
        else:
            factors['interpretability'] = 'poor'
        
        # Training time preference
        training_time_match = self._match_training_time_preference(
            model_info['training_time'], preferences['training_time']
        )
        score += training_time_match['score']
        if training_time_match['score'] > 0:
            reasons.append(training_time_match['reason'])
        factors['training_time'] = training_time_match['rating']
        
        # Data characteristics bonus
        data_quality = dataset_chars.get('data_quality', {})
        if data_quality.get('missing_percentage', 0) > 20:
            if model_name in ['random_forest', 'xgboost']:
                score += 10
                reasons.append("Handles missing values well")
                factors['missing_data_handling'] = 'excellent'
        
        if data_quality.get('outlier_percentage', 0) > 10:
            if model_name in ['random_forest', 'xgboost'] or 'robust' in model_name:
                score += 10
                reasons.append("Robust to outliers")
                factors['outlier_robustness'] = 'excellent'
        
        return {
            'total_score': max(0, min(100, score)),
            'reasons': reasons,
            'factors': factors
        }

    def _get_interpretability_score(self, model_name: str) -> int:
        """Get interpretability score for a model (1-10 scale)"""
        interpretability_scores = {
            'linear_regression': 10,
            'ridge_regression': 9,
            'lasso_regression': 9,
            'logistic_regression': 9,
            'decision_tree': 8,
            'naive_bayes': 7,
            'knn': 6,
            'svm': 4,
            'random_forest': 3,
            'xgboost': 2
        }
        return interpretability_scores.get(model_name, 5)

    def _match_training_time_preference(self, model_time: str, preferred_time: str) -> Dict[str, Any]:
        """Match model training time with user preference"""
        time_hierarchy = {
            'very_fast': 1,
            'fast': 2,
            'medium': 3,
            'slow': 4
        }

        model_time_score = time_hierarchy.get(model_time, 3)
        preferred_time_score = time_hierarchy.get(preferred_time, 3)

        if model_time_score <= preferred_time_score:
            score = 15 - abs(model_time_score - preferred_time_score) * 3
            return {
                'score': score,
                'reason': f"Training time ({model_time}) matches preference",
                'rating': 'excellent' if score >= 12 else 'good'
            }
        else:
            return {
                'score': 0,
                'reason': f"Training time ({model_time}) slower than preferred",
                'rating': 'poor'
            }

    def _get_recommended_params(
        self,
        model_name: str,
        model_info: Dict[str, Any],
        dataset_chars: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get recommended hyperparameters based on dataset characteristics"""
        base_params = model_info['params'].copy()
        dataset_size = dataset_chars.get('dataset_size', 1000)
        feature_count = dataset_chars.get('feature_count', 10)

        # Adjust parameters based on dataset size
        if model_name == 'random_forest':
            if dataset_size < 1000:
                base_params['n_estimators'] = [50, 100]
                base_params['max_depth'] = [5, 10, None]
            elif dataset_size > 10000:
                base_params['n_estimators'] = [100, 200, 300]
                base_params['max_depth'] = [10, 20, 30, None]

        elif model_name == 'xgboost':
            if dataset_size < 1000:
                base_params['n_estimators'] = [50, 100]
                base_params['learning_rate'] = [0.1, 0.2]
            elif dataset_size > 10000:
                base_params['n_estimators'] = [200, 300, 500]
                base_params['learning_rate'] = [0.01, 0.05, 0.1]

        elif model_name == 'knn':
            # Adjust k based on dataset size
            if dataset_size < 100:
                base_params['n_neighbors'] = [3, 5]
            elif dataset_size > 1000:
                base_params['n_neighbors'] = [5, 7, 9, 11]

        return base_params

    def optimize_hyperparameters(
        self,
        model_name: str,
        model_class: Any,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: np.ndarray,
        y_test: np.ndarray,
        param_grid: Dict[str, List],
        problem_type: str,
        optimization_method: str = 'grid_search',
        cv_folds: int = 5,
        n_iter: int = 50
    ) -> Dict[str, Any]:
        """
        Optimize hyperparameters for a given model

        Args:
            model_name: Name of the model
            model_class: Model class to optimize
            X_train, X_test, y_train, y_test: Training and test data
            param_grid: Parameter grid for optimization
            problem_type: 'classification' or 'regression'
            optimization_method: 'grid_search' or 'random_search'
            cv_folds: Number of cross-validation folds
            n_iter: Number of iterations for random search

        Returns:
            Dictionary with optimization results
        """
        logger.info(f"Optimizing hyperparameters for {model_name}")

        # Choose scoring metric
        if problem_type == 'classification':
            scoring = 'accuracy'
        else:
            scoring = 'neg_mean_squared_error'

        # Initialize base model
        base_model = model_class(random_state=42)

        # Choose optimization method
        if optimization_method == 'random_search' and len(param_grid) > 0:
            search = RandomizedSearchCV(
                base_model,
                param_grid,
                n_iter=n_iter,
                cv=cv_folds,
                scoring=scoring,
                random_state=42,
                n_jobs=-1
            )
        else:
            search = GridSearchCV(
                base_model,
                param_grid,
                cv=cv_folds,
                scoring=scoring,
                n_jobs=-1
            )

        # Fit the search
        search.fit(X_train, y_train)

        # Get best model and evaluate
        best_model = search.best_estimator_

        # Evaluate on test set
        if problem_type == 'classification':
            y_pred = best_model.predict(X_test)
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
                'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
                'f1_score': f1_score(y_test, y_pred, average='weighted', zero_division=0)
            }
        else:
            y_pred = best_model.predict(X_test)
            metrics = {
                'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                'r2_score': r2_score(y_test, y_pred),
                'mae': mean_absolute_error(y_test, y_pred)
            }

        # Cross-validation scores
        cv_scores = cross_val_score(best_model, X_train, y_train, cv=cv_folds, scoring=scoring)

        return {
            'best_model': best_model,
            'best_params': search.best_params_,
            'best_cv_score': search.best_score_,
            'test_metrics': metrics,
            'cv_scores': cv_scores.tolist(),
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'optimization_method': optimization_method,
            'total_fits': len(search.cv_results_['params'])
        }

    def compare_models(
        self,
        models_results: List[Dict[str, Any]],
        problem_type: str
    ) -> Dict[str, Any]:
        """
        Compare multiple model results and provide recommendations

        Args:
            models_results: List of model optimization results
            problem_type: 'classification' or 'regression'

        Returns:
            Comparison results with recommendations
        """
        if not models_results:
            return {'error': 'No models to compare'}

        # Determine primary metric for comparison
        if problem_type == 'classification':
            primary_metric = 'accuracy'
            higher_is_better = True
        else:
            primary_metric = 'r2_score'
            higher_is_better = True

        # Extract performance data
        comparison_data = []
        for result in models_results:
            model_name = result.get('model_name', 'unknown')
            test_metrics = result.get('test_metrics', {})
            cv_mean = result.get('cv_mean', 0)
            cv_std = result.get('cv_std', 0)

            comparison_data.append({
                'model_name': model_name,
                'primary_metric': test_metrics.get(primary_metric, 0),
                'cv_mean': cv_mean,
                'cv_std': cv_std,
                'test_metrics': test_metrics,
                'stability': 1 / (cv_std + 1e-6),  # Higher is more stable
                'best_params': result.get('best_params', {})
            })

        # Sort by primary metric
        comparison_data.sort(
            key=lambda x: x['primary_metric'],
            reverse=higher_is_better
        )

        # Generate recommendations
        best_model = comparison_data[0]
        recommendations = []

        if len(comparison_data) > 1:
            second_best = comparison_data[1]
            performance_gap = abs(best_model['primary_metric'] - second_best['primary_metric'])

            if performance_gap < 0.02:  # Very close performance
                if best_model['stability'] > second_best['stability']:
                    recommendations.append(f"Choose {best_model['model_name']} for better stability")
                else:
                    recommendations.append(f"Consider {second_best['model_name']} for better stability")
            else:
                recommendations.append(f"{best_model['model_name']} shows clear performance advantage")

        # Stability analysis
        stable_models = [m for m in comparison_data if m['cv_std'] < 0.05]
        if stable_models:
            recommendations.append(f"Most stable models: {', '.join([m['model_name'] for m in stable_models[:3]])}")

        return {
            'best_model': best_model,
            'ranking': comparison_data,
            'recommendations': recommendations,
            'performance_summary': {
                'best_score': best_model['primary_metric'],
                'score_range': comparison_data[-1]['primary_metric'] - best_model['primary_metric'],
                'most_stable': min(comparison_data, key=lambda x: x['cv_std'])['model_name']
            }
        }


# Create global instance
smart_model_selector = SmartModelSelector()
