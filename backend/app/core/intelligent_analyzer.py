"""
Intelligent Data Analysis Engine for AI Analyst as a Service

This module provides advanced data analysis capabilities including:
- Smart target column detection and recommendation
- Problem type identification (classification vs regression)
- Data quality assessment and recommendations
- Feature engineering suggestions
- Model selection recommendations
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import logging
from datetime import datetime
import re
from scipy import stats
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.preprocessing import LabelEncoder
import warnings
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    try:
        # Handle pandas NA values first
        if pd.isna(obj):
            return None

        # Handle numpy types
        if isinstance(obj, np.generic):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.dtype):
            return str(obj)
        elif hasattr(obj, 'dtype'):
            # This catches pandas Series, numpy arrays, etc.
            if hasattr(obj, 'item'):
                return obj.item()
            elif hasattr(obj, 'tolist'):
                return obj.tolist()
            else:
                return str(obj)
        elif isinstance(obj, dict):
            return {key: convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_numpy_types(item) for item in obj]
        else:
            return obj
    except Exception:
        # If all else fails, convert to string
        return str(obj)

class IntelligentDataAnalyzer:
    """
    Advanced data analyzer that provides intelligent recommendations
    for target columns, problem types, and preprocessing strategies
    """

    def __init__(self):
        self.target_keywords = {
            'classification': [
                'target', 'label', 'class', 'category', 'type', 'status', 'outcome',
                'result', 'decision', 'classification', 'predict', 'churn', 'fraud',
                'spam', 'sentiment', 'approved', 'rejected', 'success', 'failure',
                'positive', 'negative', 'yes', 'no', 'true', 'false', 'win', 'lose'
            ],
            'regression': [
                'price', 'cost', 'amount', 'value', 'score', 'rating', 'revenue',
                'sales', 'profit', 'income', 'salary', 'age', 'weight', 'height',
                'temperature', 'distance', 'time', 'duration', 'count', 'quantity',
                'percentage', 'rate', 'ratio', 'index', 'measure', 'metric'
            ]
        }

        self.suspicious_features = [
            'id', 'index', 'key', 'identifier', 'uuid', 'guid', 'timestamp',
            'created_at', 'updated_at', 'date_created', 'date_modified'
        ]

    def analyze_dataset(self, df: pd.DataFrame, session_id: str) -> Dict[str, Any]:
        """
        Perform comprehensive intelligent analysis of the dataset

        Args:
            df: The pandas DataFrame to analyze
            session_id: Session identifier for tracking

        Returns:
            Comprehensive analysis results with recommendations
        """
        logger.info(f"Starting intelligent analysis for session {session_id}")

        analysis = {
            'session_id': session_id,
            'dataset_overview': self._get_dataset_overview(df),
            'column_analysis': self._analyze_columns(df),
            'target_recommendations': self._recommend_target_columns(df),
            'data_quality': self._assess_data_quality(df),
            'feature_engineering_suggestions': self._suggest_feature_engineering(df),
            'preprocessing_recommendations': self._recommend_preprocessing(df),
            'model_recommendations': self._recommend_models(df),
            'analysis_timestamp': datetime.now().isoformat()
        }

        logger.info(f"Intelligent analysis completed for session {session_id}")
        return convert_numpy_types(analysis)

    def _get_dataset_overview(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get comprehensive dataset overview"""
        return {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
            'duplicate_rows': df.duplicated().sum(),
            'duplicate_percentage': (df.duplicated().sum() / len(df)) * 100,
            'missing_values_total': df.isnull().sum().sum(),
            'missing_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
            'data_types': df.dtypes.value_counts().to_dict(),
            'dataset_size_category': self._categorize_dataset_size(len(df), len(df.columns))
        }

    def _analyze_columns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform detailed analysis of each column"""
        column_analysis = {}

        for col in df.columns:
            col_data = df[col]
            analysis = {
                'data_type': str(col_data.dtype),
                'missing_count': col_data.isnull().sum(),
                'missing_percentage': (col_data.isnull().sum() / len(col_data)) * 100,
                'unique_count': col_data.nunique(),
                'unique_percentage': (col_data.nunique() / len(col_data)) * 100,
                'is_constant': col_data.nunique() <= 1,
                'is_binary': col_data.nunique() == 2,
                'is_high_cardinality': col_data.nunique() > len(col_data) * 0.9,
                'is_suspicious_feature': any(keyword in col.lower() for keyword in self.suspicious_features)
            }

            # Type-specific analysis
            if pd.api.types.is_numeric_dtype(col_data):
                analysis.update(self._analyze_numeric_column(col_data))
            elif pd.api.types.is_categorical_dtype(col_data) or col_data.dtype == 'object':
                analysis.update(self._analyze_categorical_column(col_data))
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                analysis.update(self._analyze_datetime_column(col_data))

            # Target suitability analysis
            analysis['target_suitability'] = self._assess_target_suitability(col, col_data, df)

            column_analysis[col] = analysis

        return column_analysis

    def _analyze_numeric_column(self, col_data: pd.Series) -> Dict[str, Any]:
        """Analyze numeric column characteristics"""
        non_null_data = col_data.dropna()
        if len(non_null_data) == 0:
            return {'analysis_type': 'numeric', 'has_data': False}

        return {
            'analysis_type': 'numeric',
            'has_data': True,
            'min_value': float(non_null_data.min()),
            'max_value': float(non_null_data.max()),
            'mean': float(non_null_data.mean()),
            'median': float(non_null_data.median()),
            'std': float(non_null_data.std()),
            'skewness': float(stats.skew(non_null_data)),
            'kurtosis': float(stats.kurtosis(non_null_data)),
            'is_integer_like': all(non_null_data == non_null_data.astype(int)),
            'has_outliers': self._detect_outliers(non_null_data),
            'distribution_type': self._identify_distribution(non_null_data),
            'zero_count': (non_null_data == 0).sum(),
            'negative_count': (non_null_data < 0).sum(),
            'positive_count': (non_null_data > 0).sum()
        }

    def _analyze_categorical_column(self, col_data: pd.Series) -> Dict[str, Any]:
        """Analyze categorical column characteristics"""
        non_null_data = col_data.dropna()
        if len(non_null_data) == 0:
            return {'analysis_type': 'categorical', 'has_data': False}

        value_counts = non_null_data.value_counts()

        return {
            'analysis_type': 'categorical',
            'has_data': True,
            'most_frequent_value': value_counts.index[0] if len(value_counts) > 0 else None,
            'most_frequent_count': int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
            'least_frequent_value': value_counts.index[-1] if len(value_counts) > 0 else None,
            'least_frequent_count': int(value_counts.iloc[-1]) if len(value_counts) > 0 else 0,
            'is_imbalanced': self._check_class_imbalance(value_counts),
            'imbalance_ratio': float(value_counts.iloc[0] / value_counts.iloc[-1]) if len(value_counts) > 1 else 1.0,
            'entropy': self._calculate_entropy(value_counts),
            'has_numeric_strings': self._has_numeric_strings(non_null_data),
            'has_boolean_like': self._has_boolean_like_values(non_null_data),
            'average_string_length': non_null_data.astype(str).str.len().mean() if len(non_null_data) > 0 else 0
        }

    def _analyze_datetime_column(self, col_data: pd.Series) -> Dict[str, Any]:
        """Analyze datetime column characteristics"""
        non_null_data = col_data.dropna()
        if len(non_null_data) == 0:
            return {'analysis_type': 'datetime', 'has_data': False}

        return {
            'analysis_type': 'datetime',
            'has_data': True,
            'min_date': non_null_data.min().isoformat() if len(non_null_data) > 0 else None,
            'max_date': non_null_data.max().isoformat() if len(non_null_data) > 0 else None,
            'date_range_days': (non_null_data.max() - non_null_data.min()).days if len(non_null_data) > 0 else 0,
            'is_sorted': non_null_data.is_monotonic_increasing,
            'has_time_component': any(non_null_data.dt.time != pd.Timestamp('00:00:00').time()),
            'unique_years': non_null_data.dt.year.nunique(),
            'unique_months': non_null_data.dt.month.nunique(),
            'unique_days': non_null_data.dt.day.nunique()
        }

    def _assess_target_suitability(self, col_name: str, col_data: pd.Series, df: pd.DataFrame) -> Dict[str, Any]:
        """Assess how suitable a column is as a target variable"""
        suitability_score = 0
        reasons = []
        problem_type = None
        confidence = 0

        # Check for target-related keywords in column name
        col_name_lower = col_name.lower()
        for prob_type, keywords in self.target_keywords.items():
            if any(keyword in col_name_lower for keyword in keywords):
                suitability_score += 30
                reasons.append(f"Column name suggests {prob_type} problem")
                problem_type = prob_type
                confidence += 0.3
                break

        # Check if it's a suspicious feature (likely not a target)
        if any(keyword in col_name_lower for keyword in self.suspicious_features):
            suitability_score -= 50
            reasons.append("Column appears to be an identifier or metadata")
            return {
                'suitability_score': max(0, suitability_score),
                'is_suitable': False,
                'problem_type': None,
                'confidence': 0,
                'reasons': reasons
            }

        # Analyze data characteristics
        non_null_data = col_data.dropna()
        if len(non_null_data) == 0:
            return {
                'suitability_score': 0,
                'is_suitable': False,
                'problem_type': None,
                'confidence': 0,
                'reasons': ['Column has no data']
            }

        unique_ratio = col_data.nunique() / len(col_data)

        # Numeric column analysis
        if pd.api.types.is_numeric_dtype(col_data):
            if unique_ratio > 0.9:  # High cardinality numeric - likely regression
                suitability_score += 25
                reasons.append("High cardinality numeric suggests regression target")
                if not problem_type:
                    problem_type = 'regression'
                    confidence += 0.25
            elif col_data.nunique() <= 10:  # Low cardinality numeric - could be classification
                suitability_score += 20
                reasons.append("Low cardinality numeric could be classification target")
                if not problem_type:
                    problem_type = 'classification'
                    confidence += 0.2
            else:  # Medium cardinality - likely regression
                suitability_score += 15
                reasons.append("Medium cardinality numeric suggests regression target")
                if not problem_type:
                    problem_type = 'regression'
                    confidence += 0.15

        # Categorical column analysis
        elif pd.api.types.is_categorical_dtype(col_data) or col_data.dtype == 'object':
            if col_data.nunique() <= 20:  # Reasonable number of classes
                suitability_score += 20
                reasons.append("Categorical with reasonable number of classes")
                if not problem_type:
                    problem_type = 'classification'
                    confidence += 0.2
            else:  # Too many classes
                suitability_score -= 10
                reasons.append("Too many categories for typical classification")

        # Check for binary target
        if col_data.nunique() == 2:
            suitability_score += 15
            reasons.append("Binary target is ideal for classification")
            problem_type = 'classification'
            confidence += 0.15

        # Check missing values
        missing_ratio = col_data.isnull().sum() / len(col_data)
        if missing_ratio > 0.5:
            suitability_score -= 30
            reasons.append("Too many missing values for target variable")
        elif missing_ratio > 0.1:
            suitability_score -= 10
            reasons.append("Some missing values in target")

        # Check if column is constant
        if col_data.nunique() <= 1:
            suitability_score = 0
            reasons = ["Column has constant values"]
            return {
                'suitability_score': 0,
                'is_suitable': False,
                'problem_type': None,
                'confidence': 0,
                'reasons': reasons
            }

        return {
            'suitability_score': max(0, min(100, suitability_score)),
            'is_suitable': suitability_score >= 20,
            'problem_type': problem_type,
            'confidence': min(1.0, confidence),
            'reasons': reasons
        }

    def _recommend_target_columns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate intelligent target column recommendations"""
        recommendations = []

        for col in df.columns:
            suitability = self._assess_target_suitability(col, df[col], df)
            if suitability['is_suitable']:
                recommendations.append({
                    'column_name': col,
                    'suitability_score': suitability['suitability_score'],
                    'problem_type': suitability['problem_type'],
                    'confidence': suitability['confidence'],
                    'reasons': suitability['reasons'],
                    'data_type': str(df[col].dtype),
                    'unique_values': df[col].nunique(),
                    'missing_percentage': (df[col].isnull().sum() / len(df)) * 100
                })

        # Sort by suitability score
        recommendations.sort(key=lambda x: x['suitability_score'], reverse=True)

        return {
            'recommended_targets': recommendations[:5],  # Top 5 recommendations
            'total_candidates': len(recommendations),
            'has_clear_target': len(recommendations) > 0 and recommendations[0]['suitability_score'] > 70,
            'best_recommendation': recommendations[0] if recommendations else None
        }

    def _assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data quality assessment"""
        quality_issues = []
        quality_score = 100

        # Check for missing values
        missing_cols = df.columns[df.isnull().any()].tolist()
        if missing_cols:
            missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            quality_issues.append({
                'type': 'missing_values',
                'severity': 'high' if missing_percentage > 20 else 'medium' if missing_percentage > 5 else 'low',
                'description': f"Missing values in {len(missing_cols)} columns ({missing_percentage:.1f}% total)",
                'affected_columns': missing_cols[:10],  # Limit to first 10
                'recommendation': 'Consider imputation strategies or removal of high-missing columns'
            })
            quality_score -= min(30, missing_percentage)

        # Check for duplicate rows
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            duplicate_percentage = (duplicate_count / len(df)) * 100
            quality_issues.append({
                'type': 'duplicate_rows',
                'severity': 'high' if duplicate_percentage > 10 else 'medium' if duplicate_percentage > 2 else 'low',
                'description': f"{duplicate_count} duplicate rows ({duplicate_percentage:.1f}%)",
                'recommendation': 'Remove duplicate rows before training'
            })
            quality_score -= min(20, duplicate_percentage)

        # Check for constant columns
        constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
        if constant_cols:
            quality_issues.append({
                'type': 'constant_columns',
                'severity': 'medium',
                'description': f"{len(constant_cols)} columns with constant values",
                'affected_columns': constant_cols,
                'recommendation': 'Remove constant columns as they provide no information'
            })
            quality_score -= len(constant_cols) * 2

        # Check for high cardinality categorical columns
        high_cardinality_cols = []
        for col in df.select_dtypes(include=['object']).columns:
            if df[col].nunique() > len(df) * 0.8:
                high_cardinality_cols.append(col)

        if high_cardinality_cols:
            quality_issues.append({
                'type': 'high_cardinality_categorical',
                'severity': 'medium',
                'description': f"{len(high_cardinality_cols)} categorical columns with very high cardinality",
                'affected_columns': high_cardinality_cols,
                'recommendation': 'Consider feature engineering or removal of high-cardinality categorical features'
            })
            quality_score -= len(high_cardinality_cols) * 3

        # Check for potential outliers in numeric columns
        outlier_cols = []
        for col in df.select_dtypes(include=[np.number]).columns:
            if self._detect_outliers(df[col].dropna()):
                outlier_cols.append(col)

        if outlier_cols:
            quality_issues.append({
                'type': 'outliers',
                'severity': 'low',
                'description': f"Potential outliers detected in {len(outlier_cols)} numeric columns",
                'affected_columns': outlier_cols[:10],
                'recommendation': 'Review outliers and consider outlier treatment methods'
            })
            quality_score -= len(outlier_cols) * 1

        return {
            'overall_quality_score': max(0, min(100, quality_score)),
            'quality_level': self._categorize_quality_level(quality_score),
            'issues': quality_issues,
            'total_issues': len(quality_issues),
            'recommendations': self._generate_quality_recommendations(quality_issues)
        }

    def _suggest_feature_engineering(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Suggest feature engineering opportunities"""
        suggestions = []

        # Date/time feature engineering
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        for col in datetime_cols:
            suggestions.append({
                'type': 'datetime_features',
                'column': col,
                'suggestion': 'Extract date components (year, month, day, weekday, hour)',
                'potential_features': ['year', 'month', 'day', 'weekday', 'hour', 'is_weekend'],
                'priority': 'high'
            })

        # Numeric feature combinations
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) >= 2:
            suggestions.append({
                'type': 'numeric_combinations',
                'columns': numeric_cols[:5],  # Limit to first 5
                'suggestion': 'Create ratio, difference, and interaction features',
                'potential_features': ['ratios', 'differences', 'products', 'polynomial_features'],
                'priority': 'medium'
            })

        # Categorical encoding suggestions
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        for col in categorical_cols:
            cardinality = df[col].nunique()
            if cardinality <= 10:
                encoding_type = 'one_hot'
                priority = 'high'
            elif cardinality <= 50:
                encoding_type = 'target_encoding'
                priority = 'medium'
            else:
                encoding_type = 'frequency_encoding'
                priority = 'low'

            suggestions.append({
                'type': 'categorical_encoding',
                'column': col,
                'suggestion': f'Apply {encoding_type} encoding',
                'cardinality': cardinality,
                'priority': priority
            })

        # Text feature engineering (if any text columns detected)
        text_cols = [col for col in df.select_dtypes(include=['object']).columns
                    if df[col].astype(str).str.len().mean() > 20]
        for col in text_cols:
            suggestions.append({
                'type': 'text_features',
                'column': col,
                'suggestion': 'Extract text features (length, word count, sentiment)',
                'potential_features': ['text_length', 'word_count', 'char_count', 'sentiment_score'],
                'priority': 'medium'
            })

        return {
            'suggestions': suggestions,
            'total_suggestions': len(suggestions),
            'high_priority': [s for s in suggestions if s['priority'] == 'high'],
            'medium_priority': [s for s in suggestions if s['priority'] == 'medium'],
            'low_priority': [s for s in suggestions if s['priority'] == 'low']
        }

    def _recommend_preprocessing(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Recommend preprocessing strategies based on data characteristics"""
        recommendations = []

        # Missing value handling
        missing_cols = df.columns[df.isnull().any()].tolist()
        if missing_cols:
            for col in missing_cols:
                missing_pct = (df[col].isnull().sum() / len(df)) * 100
                if missing_pct > 50:
                    strategy = 'remove_column'
                elif pd.api.types.is_numeric_dtype(df[col]):
                    strategy = 'median_imputation' if missing_pct > 10 else 'mean_imputation'
                else:
                    strategy = 'mode_imputation'

                recommendations.append({
                    'type': 'missing_values',
                    'column': col,
                    'strategy': strategy,
                    'missing_percentage': missing_pct,
                    'priority': 'high' if missing_pct > 20 else 'medium'
                })

        # Scaling recommendations
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) > 1:
            # Check if scaling is needed
            scales_vary = False
            for col in numeric_cols:
                col_range = df[col].max() - df[col].min()
                if col_range > 1000 or col_range < 0.01:
                    scales_vary = True
                    break

            if scales_vary:
                recommendations.append({
                    'type': 'scaling',
                    'columns': numeric_cols,
                    'strategy': 'standard_scaling',
                    'reason': 'Features have different scales',
                    'priority': 'high'
                })

        # Outlier handling
        for col in numeric_cols:
            if self._detect_outliers(df[col].dropna()):
                recommendations.append({
                    'type': 'outliers',
                    'column': col,
                    'strategy': 'iqr_capping',
                    'reason': 'Outliers detected',
                    'priority': 'medium'
                })

        return {
            'recommendations': recommendations,
            'total_recommendations': len(recommendations),
            'preprocessing_complexity': self._assess_preprocessing_complexity(recommendations)
        }

    def _recommend_models(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Recommend suitable models based on dataset characteristics"""
        dataset_size = len(df)
        feature_count = len(df.columns)

        # Categorize dataset
        if dataset_size < 1000:
            size_category = 'small'
        elif dataset_size < 10000:
            size_category = 'medium'
        else:
            size_category = 'large'

        # Model recommendations based on size and characteristics
        classification_models = []
        regression_models = []

        if size_category == 'small':
            classification_models = [
                {'name': 'Logistic Regression', 'priority': 'high', 'reason': 'Works well with small datasets'},
                {'name': 'Random Forest', 'priority': 'high', 'reason': 'Robust and handles overfitting'},
                {'name': 'SVM', 'priority': 'medium', 'reason': 'Good for small datasets with clear margins'}
            ]
            regression_models = [
                {'name': 'Linear Regression', 'priority': 'high', 'reason': 'Simple and interpretable'},
                {'name': 'Random Forest', 'priority': 'high', 'reason': 'Handles non-linearity well'},
                {'name': 'Ridge Regression', 'priority': 'medium', 'reason': 'Regularization helps with small data'}
            ]
        elif size_category == 'medium':
            classification_models = [
                {'name': 'Random Forest', 'priority': 'high', 'reason': 'Excellent balance of performance and interpretability'},
                {'name': 'XGBoost', 'priority': 'high', 'reason': 'High performance gradient boosting'},
                {'name': 'Logistic Regression', 'priority': 'medium', 'reason': 'Fast and interpretable baseline'}
            ]
            regression_models = [
                {'name': 'Random Forest', 'priority': 'high', 'reason': 'Handles non-linearity and interactions'},
                {'name': 'XGBoost', 'priority': 'high', 'reason': 'Often achieves best performance'},
                {'name': 'Linear Regression', 'priority': 'medium', 'reason': 'Good interpretable baseline'}
            ]
        else:  # large
            classification_models = [
                {'name': 'XGBoost', 'priority': 'high', 'reason': 'Scales well and high performance'},
                {'name': 'Random Forest', 'priority': 'high', 'reason': 'Parallelizable and robust'},
                {'name': 'Neural Network', 'priority': 'medium', 'reason': 'Can capture complex patterns'}
            ]
            regression_models = [
                {'name': 'XGBoost', 'priority': 'high', 'reason': 'Excellent for large datasets'},
                {'name': 'Random Forest', 'priority': 'high', 'reason': 'Handles large feature spaces well'},
                {'name': 'Neural Network', 'priority': 'medium', 'reason': 'Can model complex relationships'}
            ]

        return {
            'dataset_size_category': size_category,
            'feature_count': feature_count,
            'classification_models': classification_models,
            'regression_models': regression_models,
            'recommended_validation': 'cross_validation' if dataset_size > 1000 else 'train_test_split',
            'hyperparameter_tuning': dataset_size > 5000
        }

    # Helper methods
    def _categorize_dataset_size(self, rows: int, cols: int) -> str:
        """Categorize dataset size"""
        if rows < 1000 or cols < 5:
            return 'small'
        elif rows < 10000 or cols < 20:
            return 'medium'
        else:
            return 'large'

    def _detect_outliers(self, data: pd.Series) -> bool:
        """Detect outliers using IQR method"""
        if len(data) < 4:
            return False

        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        outliers = ((data < lower_bound) | (data > upper_bound)).sum()
        return outliers > len(data) * 0.05  # More than 5% outliers

    def _identify_distribution(self, data: pd.Series) -> str:
        """Identify the likely distribution of numeric data"""
        if len(data) < 10:
            return 'unknown'

        # Simple distribution identification
        skewness = abs(stats.skew(data))
        if skewness < 0.5:
            return 'normal'
        elif skewness < 1:
            return 'moderately_skewed'
        else:
            return 'highly_skewed'

    def _check_class_imbalance(self, value_counts: pd.Series) -> bool:
        """Check if categorical data is imbalanced"""
        if len(value_counts) < 2:
            return False

        ratio = value_counts.iloc[0] / value_counts.iloc[-1]
        return ratio > 5  # Consider imbalanced if ratio > 5:1

    def _calculate_entropy(self, value_counts: pd.Series) -> float:
        """Calculate entropy of categorical distribution"""
        if len(value_counts) == 0:
            return 0

        probabilities = value_counts / value_counts.sum()
        entropy = -np.sum(probabilities * np.log2(probabilities + 1e-10))
        return float(entropy)

    def _has_numeric_strings(self, data: pd.Series) -> bool:
        """Check if categorical data contains numeric strings"""
        try:
            sample = data.dropna().head(100)
            numeric_count = 0
            for val in sample:
                try:
                    float(str(val))
                    numeric_count += 1
                except:
                    pass
            return numeric_count > len(sample) * 0.8
        except:
            return False

    def _has_boolean_like_values(self, data: pd.Series) -> bool:
        """Check if categorical data has boolean-like values"""
        unique_vals = set(str(val).lower() for val in data.dropna().unique())
        boolean_patterns = {
            'true', 'false', 'yes', 'no', '1', '0', 'y', 'n',
            'on', 'off', 'active', 'inactive', 'enabled', 'disabled'
        }
        return len(unique_vals.intersection(boolean_patterns)) >= len(unique_vals) * 0.5

    def _categorize_quality_level(self, score: float) -> str:
        """Categorize data quality level"""
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'fair'
        else:
            return 'poor'

    def _generate_quality_recommendations(self, issues: List[Dict]) -> List[str]:
        """Generate actionable quality improvement recommendations"""
        recommendations = []

        for issue in issues:
            if issue['type'] == 'missing_values':
                recommendations.append("Handle missing values through imputation or removal")
            elif issue['type'] == 'duplicate_rows':
                recommendations.append("Remove duplicate rows to avoid data leakage")
            elif issue['type'] == 'constant_columns':
                recommendations.append("Remove constant columns as they provide no predictive value")
            elif issue['type'] == 'high_cardinality_categorical':
                recommendations.append("Apply feature engineering to high-cardinality categorical variables")
            elif issue['type'] == 'outliers':
                recommendations.append("Review and treat outliers appropriately")

        return recommendations

    def _assess_preprocessing_complexity(self, recommendations: List[Dict]) -> str:
        """Assess the complexity of required preprocessing"""
        high_priority_count = sum(1 for r in recommendations if r.get('priority') == 'high')
        total_count = len(recommendations)

        if total_count == 0:
            return 'minimal'
        elif high_priority_count == 0 and total_count <= 3:
            return 'low'
        elif high_priority_count <= 2 and total_count <= 6:
            return 'moderate'
        else:
            return 'high'


# Create global instance
intelligent_analyzer = IntelligentDataAnalyzer()