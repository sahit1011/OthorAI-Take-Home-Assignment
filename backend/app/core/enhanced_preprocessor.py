"""
Enhanced Data Preprocessing Pipeline for AI Analyst as a Service

This module provides advanced preprocessing capabilities including:
- Intelligent missing value handling
- Advanced feature engineering
- Outlier detection and treatment
- Smart categorical encoding
- Feature scaling and normalization
- Data quality improvements
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional, Union
import logging
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder, 
    OneHotEncoder, TargetEncoder
)
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.feature_selection import SelectKBest, f_classif, f_regression, mutual_info_classif, mutual_info_regression
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedDataPreprocessor:
    """
    Advanced data preprocessor that applies intelligent preprocessing
    based on data characteristics and problem type
    """
    
    def __init__(self):
        self.preprocessor = None
        self.feature_names = None
        self.target_encoder = None
        self.preprocessing_steps = []
        self.feature_importance_scores = {}
        
    def create_preprocessing_pipeline(
        self, 
        df: pd.DataFrame, 
        target_column: str,
        problem_type: str,
        preprocessing_config: Optional[Dict[str, Any]] = None
    ) -> Tuple[ColumnTransformer, List[str], Dict[str, Any]]:
        """
        Create an intelligent preprocessing pipeline based on data characteristics
        
        Args:
            df: Input DataFrame
            target_column: Name of target column
            problem_type: 'classification' or 'regression'
            preprocessing_config: Optional configuration overrides
            
        Returns:
            Tuple of (preprocessor, feature_names, preprocessing_info)
        """
        logger.info(f"Creating enhanced preprocessing pipeline for {problem_type} problem")
        
        # Separate features and target
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Initialize config with defaults
        config = self._get_default_config()
        if preprocessing_config:
            config.update(preprocessing_config)
        
        # Analyze data characteristics
        data_analysis = self._analyze_data_characteristics(X, y, problem_type)
        
        # Create column-specific transformers
        transformers = []
        feature_names = []
        
        # Numeric features preprocessing
        numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_features:
            numeric_transformer, numeric_feature_names = self._create_numeric_transformer(
                X[numeric_features], data_analysis, config
            )
            transformers.append(('numeric', numeric_transformer, numeric_features))
            feature_names.extend(numeric_feature_names)
        
        # Categorical features preprocessing
        categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
        if categorical_features:
            categorical_transformer, categorical_feature_names = self._create_categorical_transformer(
                X[categorical_features], y, problem_type, data_analysis, config
            )
            transformers.append(('categorical', categorical_transformer, categorical_features))
            feature_names.extend(categorical_feature_names)
        
        # DateTime features preprocessing
        datetime_features = X.select_dtypes(include=['datetime64']).columns.tolist()
        if datetime_features:
            datetime_transformer, datetime_feature_names = self._create_datetime_transformer(
                X[datetime_features], config
            )
            transformers.append(('datetime', datetime_transformer, datetime_features))
            feature_names.extend(datetime_feature_names)
        
        # Create the final preprocessor
        preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='drop',  # Drop any remaining columns
            sparse_threshold=0  # Return dense arrays
        )
        
        # Store preprocessing information
        preprocessing_info = {
            'numeric_features': numeric_features,
            'categorical_features': categorical_features,
            'datetime_features': datetime_features,
            'total_features_before': len(X.columns),
            'total_features_after': len(feature_names),
            'data_analysis': data_analysis,
            'preprocessing_steps': self.preprocessing_steps,
            'config_used': config
        }
        
        self.preprocessor = preprocessor
        self.feature_names = feature_names
        
        logger.info(f"Preprocessing pipeline created: {len(X.columns)} -> {len(feature_names)} features")
        
        return preprocessor, feature_names, preprocessing_info
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default preprocessing configuration"""
        return {
            'missing_strategy_numeric': 'auto',  # 'auto', 'mean', 'median', 'knn'
            'missing_strategy_categorical': 'auto',  # 'auto', 'mode', 'constant'
            'scaling_method': 'auto',  # 'auto', 'standard', 'minmax', 'robust'
            'categorical_encoding': 'auto',  # 'auto', 'onehot', 'target', 'frequency'
            'outlier_treatment': 'auto',  # 'auto', 'iqr', 'zscore', 'none'
            'feature_selection': True,
            'feature_engineering': True,
            'max_categorical_cardinality': 50,
            'outlier_threshold': 0.05
        }
    
    def _analyze_data_characteristics(self, X: pd.DataFrame, y: pd.Series, problem_type: str) -> Dict[str, Any]:
        """Analyze data characteristics to inform preprocessing decisions"""
        analysis = {
            'dataset_size': len(X),
            'feature_count': len(X.columns),
            'missing_data': {},
            'outliers': {},
            'cardinality': {},
            'data_types': {},
            'correlations': {}
        }
        
        # Missing data analysis
        for col in X.columns:
            missing_pct = (X[col].isnull().sum() / len(X)) * 100
            analysis['missing_data'][col] = missing_pct
        
        # Outlier analysis for numeric columns
        for col in X.select_dtypes(include=[np.number]).columns:
            analysis['outliers'][col] = self._detect_outliers_percentage(X[col])
        
        # Cardinality analysis for categorical columns
        for col in X.select_dtypes(include=['object', 'category']).columns:
            analysis['cardinality'][col] = X[col].nunique()
        
        # Data type analysis
        analysis['data_types'] = X.dtypes.to_dict()
        
        # Target correlation for numeric features (if applicable)
        if problem_type == 'regression' and pd.api.types.is_numeric_dtype(y):
            numeric_cols = X.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if not X[col].isnull().all():
                    corr = X[col].corr(y)
                    analysis['correlations'][col] = corr if not pd.isna(corr) else 0
        
        return analysis
    
    def _create_numeric_transformer(
        self, 
        numeric_data: pd.DataFrame, 
        data_analysis: Dict[str, Any], 
        config: Dict[str, Any]
    ) -> Tuple[Pipeline, List[str]]:
        """Create transformer for numeric features"""
        steps = []
        feature_names = numeric_data.columns.tolist()
        
        # Missing value imputation
        missing_strategy = self._determine_missing_strategy_numeric(numeric_data, data_analysis, config)
        if missing_strategy == 'knn':
            imputer = KNNImputer(n_neighbors=5)
        else:
            imputer = SimpleImputer(strategy=missing_strategy)
        
        steps.append(('imputer', imputer))
        self.preprocessing_steps.append(f"Numeric imputation: {missing_strategy}")
        
        # Outlier treatment
        outlier_method = self._determine_outlier_treatment(numeric_data, data_analysis, config)
        if outlier_method != 'none':
            outlier_transformer = OutlierTransformer(method=outlier_method)
            steps.append(('outlier_treatment', outlier_transformer))
            self.preprocessing_steps.append(f"Outlier treatment: {outlier_method}")
        
        # Feature engineering
        if config['feature_engineering']:
            feature_engineer = NumericFeatureEngineer()
            steps.append(('feature_engineering', feature_engineer))
            # Update feature names to include engineered features
            feature_names = feature_engineer.get_feature_names(feature_names)
            self.preprocessing_steps.append("Numeric feature engineering applied")
        
        # Scaling
        scaling_method = self._determine_scaling_method(numeric_data, data_analysis, config)
        if scaling_method == 'standard':
            scaler = StandardScaler()
        elif scaling_method == 'minmax':
            scaler = MinMaxScaler()
        elif scaling_method == 'robust':
            scaler = RobustScaler()
        else:
            scaler = StandardScaler()  # Default
        
        steps.append(('scaler', scaler))
        self.preprocessing_steps.append(f"Scaling: {scaling_method}")
        
        return Pipeline(steps), feature_names
    
    def _create_categorical_transformer(
        self, 
        categorical_data: pd.DataFrame, 
        y: pd.Series,
        problem_type: str,
        data_analysis: Dict[str, Any], 
        config: Dict[str, Any]
    ) -> Tuple[Pipeline, List[str]]:
        """Create transformer for categorical features"""
        steps = []
        feature_names = []
        
        # Missing value imputation
        missing_strategy = self._determine_missing_strategy_categorical(categorical_data, config)
        if missing_strategy == 'constant':
            imputer = SimpleImputer(strategy='constant', fill_value='missing')
        else:
            imputer = SimpleImputer(strategy='most_frequent')
        
        steps.append(('imputer', imputer))
        self.preprocessing_steps.append(f"Categorical imputation: {missing_strategy}")
        
        # Categorical encoding
        encoding_method = self._determine_categorical_encoding(categorical_data, data_analysis, config)
        
        if encoding_method == 'onehot':
            encoder = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')
            # Feature names will be generated by OneHot encoder
            for col in categorical_data.columns:
                unique_vals = categorical_data[col].dropna().unique()
                feature_names.extend([f"{col}_{val}" for val in unique_vals[1:]])  # Drop first
        elif encoding_method == 'target':
            encoder = TargetEncoder()
            feature_names = categorical_data.columns.tolist()
        else:  # frequency or label encoding
            encoder = FrequencyEncoder() if encoding_method == 'frequency' else LabelEncoder()
            feature_names = categorical_data.columns.tolist()
        
        steps.append(('encoder', encoder))
        self.preprocessing_steps.append(f"Categorical encoding: {encoding_method}")
        
        return Pipeline(steps), feature_names

    def _create_datetime_transformer(
        self,
        datetime_data: pd.DataFrame,
        config: Dict[str, Any]
    ) -> Tuple[Pipeline, List[str]]:
        """Create transformer for datetime features"""
        steps = []
        feature_names = []

        # DateTime feature extraction
        datetime_engineer = DateTimeFeatureEngineer()
        steps.append(('datetime_features', datetime_engineer))

        # Generate feature names for datetime components
        for col in datetime_data.columns:
            base_features = ['year', 'month', 'day', 'weekday', 'hour', 'is_weekend']
            feature_names.extend([f"{col}_{feat}" for feat in base_features])

        self.preprocessing_steps.append("DateTime feature engineering applied")

        return Pipeline(steps), feature_names

    def _determine_missing_strategy_numeric(
        self,
        data: pd.DataFrame,
        analysis: Dict[str, Any],
        config: Dict[str, Any]
    ) -> str:
        """Determine the best missing value strategy for numeric data"""
        if config['missing_strategy_numeric'] != 'auto':
            return config['missing_strategy_numeric']

        # Auto-determine based on data characteristics
        total_missing = sum(analysis['missing_data'][col] for col in data.columns if col in analysis['missing_data'])
        avg_missing = total_missing / len(data.columns) if len(data.columns) > 0 else 0

        if avg_missing > 20:
            return 'median'  # More robust for high missing data
        elif analysis['dataset_size'] > 1000 and avg_missing > 5:
            return 'knn'  # KNN imputation for larger datasets with moderate missing data
        else:
            return 'mean'  # Default for small missing percentages

    def _determine_missing_strategy_categorical(
        self,
        data: pd.DataFrame,
        config: Dict[str, Any]
    ) -> str:
        """Determine the best missing value strategy for categorical data"""
        if config['missing_strategy_categorical'] != 'auto':
            return config['missing_strategy_categorical']

        # For categorical, usually mode or constant
        return 'most_frequent'

    def _determine_scaling_method(
        self,
        data: pd.DataFrame,
        analysis: Dict[str, Any],
        config: Dict[str, Any]
    ) -> str:
        """Determine the best scaling method"""
        if config['scaling_method'] != 'auto':
            return config['scaling_method']

        # Check for outliers
        outlier_cols = [col for col, pct in analysis['outliers'].items() if pct > 5]

        if len(outlier_cols) > len(data.columns) * 0.5:
            return 'robust'  # Robust scaling for data with many outliers
        else:
            return 'standard'  # Standard scaling for normal data

    def _determine_categorical_encoding(
        self,
        data: pd.DataFrame,
        analysis: Dict[str, Any],
        config: Dict[str, Any]
    ) -> str:
        """Determine the best categorical encoding method"""
        if config['categorical_encoding'] != 'auto':
            return config['categorical_encoding']

        # Auto-determine based on cardinality
        high_cardinality_cols = [
            col for col, card in analysis['cardinality'].items()
            if card > config['max_categorical_cardinality']
        ]

        if len(high_cardinality_cols) > 0:
            return 'frequency'  # Frequency encoding for high cardinality
        elif max(analysis['cardinality'].values()) <= 10:
            return 'onehot'  # One-hot for low cardinality
        else:
            return 'target'  # Target encoding for medium cardinality

    def _determine_outlier_treatment(
        self,
        data: pd.DataFrame,
        analysis: Dict[str, Any],
        config: Dict[str, Any]
    ) -> str:
        """Determine outlier treatment method"""
        if config['outlier_treatment'] != 'auto':
            return config['outlier_treatment']

        # Check outlier percentage
        avg_outliers = np.mean(list(analysis['outliers'].values()))

        if avg_outliers > config['outlier_threshold'] * 100:
            return 'iqr'  # IQR capping for significant outliers
        else:
            return 'none'  # No treatment for minimal outliers

    def _detect_outliers_percentage(self, data: pd.Series) -> float:
        """Calculate percentage of outliers in numeric data"""
        if len(data.dropna()) < 4:
            return 0.0

        clean_data = data.dropna()
        Q1 = clean_data.quantile(0.25)
        Q3 = clean_data.quantile(0.75)
        IQR = Q3 - Q1

        if IQR == 0:
            return 0.0

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        outliers = ((clean_data < lower_bound) | (clean_data > upper_bound)).sum()
        return (outliers / len(clean_data)) * 100


# Custom Transformers
class OutlierTransformer:
    """Custom transformer for outlier treatment"""

    def __init__(self, method='iqr'):
        self.method = method
        self.bounds_ = {}

    def fit(self, X, y=None):
        if self.method == 'iqr':
            for i, col in enumerate(X.T):
                Q1 = np.percentile(col, 25)
                Q3 = np.percentile(col, 75)
                IQR = Q3 - Q1
                self.bounds_[i] = {
                    'lower': Q1 - 1.5 * IQR,
                    'upper': Q3 + 1.5 * IQR
                }
        return self

    def transform(self, X):
        X_transformed = X.copy()
        for i, bounds in self.bounds_.items():
            X_transformed[:, i] = np.clip(
                X_transformed[:, i],
                bounds['lower'],
                bounds['upper']
            )
        return X_transformed


class NumericFeatureEngineer:
    """Custom transformer for numeric feature engineering"""

    def __init__(self):
        self.feature_names_ = None

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        # Add polynomial features (squares) for numeric features
        X_transformed = X.copy()

        # Add squared features for the first few columns (to avoid explosion)
        n_features = min(X.shape[1], 5)
        for i in range(n_features):
            squared_feature = X[:, i] ** 2
            X_transformed = np.column_stack([X_transformed, squared_feature])

        return X_transformed

    def get_feature_names(self, input_features):
        """Generate feature names including engineered features"""
        feature_names = input_features.copy()

        # Add squared feature names
        n_features = min(len(input_features), 5)
        for i in range(n_features):
            feature_names.append(f"{input_features[i]}_squared")

        return feature_names


class DateTimeFeatureEngineer:
    """Custom transformer for datetime feature engineering"""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = []

        for col_idx in range(X.shape[1]):
            # Convert to datetime if not already
            datetime_col = pd.to_datetime(X[:, col_idx])

            # Extract features
            features.append(datetime_col.year.values)
            features.append(datetime_col.month.values)
            features.append(datetime_col.day.values)
            features.append(datetime_col.weekday.values)
            features.append(datetime_col.hour.values)
            features.append((datetime_col.weekday >= 5).astype(int).values)  # is_weekend

        return np.column_stack(features)


class FrequencyEncoder:
    """Custom frequency encoder for categorical variables"""

    def __init__(self):
        self.frequency_maps_ = {}

    def fit(self, X, y=None):
        for col_idx in range(X.shape[1]):
            unique, counts = np.unique(X[:, col_idx], return_counts=True)
            self.frequency_maps_[col_idx] = dict(zip(unique, counts))
        return self

    def transform(self, X):
        X_transformed = X.copy()
        for col_idx, freq_map in self.frequency_maps_.items():
            X_transformed[:, col_idx] = [
                freq_map.get(val, 0) for val in X[:, col_idx]
            ]
        return X_transformed.astype(float)


# Create global instance
enhanced_preprocessor = EnhancedDataPreprocessor()
