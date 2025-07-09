"""
Data processing utilities for CSV analysis and schema inference
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import warnings
import logging
from scipy import stats
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

from ..models.upload import ColumnSchema


class DataProcessor:
    """Handles CSV data processing and schema inference"""
    
    def __init__(self):
        self.high_cardinality_threshold = 0.8  # 80% unique values
        self.constant_threshold = 0.95  # 95% same values
        self.sample_size = 5  # Number of sample values to return
    
    def load_data(self, file_path: Path) -> pd.DataFrame:
        """Load the complete CSV file for analysis"""
        try:
            df = pd.read_csv(file_path)
            return df
        except Exception as e:
            logger.error(f"Error loading CSV file {file_path}: {str(e)}")
            raise ValueError(f"Failed to load CSV file: {str(e)}")

    def load_csv_sample(self, file_path: Path, sample_rows: int = 1000) -> pd.DataFrame:
        """Load a sample of the CSV file for analysis"""
        try:
            # First, try to read a small sample to infer structure
            df_sample = pd.read_csv(file_path, nrows=sample_rows)
            return df_sample
        except Exception as e:
            raise ValueError(f"Failed to read CSV file: {str(e)}")

    def _analyze_missing_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze missing data patterns"""
        missing_patterns = {}

        # Columns with no missing values
        complete_columns = df.columns[df.isnull().sum() == 0].tolist()

        # Columns with all missing values
        empty_columns = df.columns[df.isnull().sum() == len(df)].tolist()

        # Missing value patterns
        missing_combinations = df.isnull().value_counts().head(10).to_dict()

        return {
            'complete_columns': complete_columns,
            'empty_columns': empty_columns,
            'missing_combinations': {str(k): v for k, v in missing_combinations.items()}
        }

    def _detect_outliers(self, numeric_df: pd.DataFrame) -> Dict[str, Any]:
        """Detect outliers using IQR method"""
        outliers = {}

        for col in numeric_df.columns:
            Q1 = numeric_df[col].quantile(0.25)
            Q3 = numeric_df[col].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outlier_mask = (numeric_df[col] < lower_bound) | (numeric_df[col] > upper_bound)
            outlier_values = numeric_df[col][outlier_mask].tolist()

            outliers[col] = {
                'count': len(outlier_values),
                'percentage': (len(outlier_values) / len(numeric_df)) * 100,
                'lower_bound': lower_bound,
                'upper_bound': upper_bound,
                'outlier_values': outlier_values[:20]  # Limit to first 20 outliers
            }

        return outliers

    def _assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Assess overall data quality"""

        # Completeness score
        completeness = ((df.shape[0] * df.shape[1] - df.isnull().sum().sum()) /
                       (df.shape[0] * df.shape[1])) * 100

        # Uniqueness score (based on duplicate rows)
        uniqueness = ((len(df) - df.duplicated().sum()) / len(df)) * 100

        # Consistency score (based on data types and formats)
        consistency_issues = 0
        for col in df.columns:
            if df[col].dtype == 'object':
                # Check for mixed types or inconsistent formats
                sample_values = df[col].dropna().head(100)
                if len(sample_values) > 0:
                    # Simple check for mixed numeric/text
                    numeric_count = sum(1 for val in sample_values if str(val).replace('.', '').replace('-', '').isdigit())
                    if 0 < numeric_count < len(sample_values):
                        consistency_issues += 1

        consistency = max(0, 100 - (consistency_issues / len(df.columns)) * 100)

        # Validity score (based on outliers and data ranges)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        validity_issues = 0

        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = df[(df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)]
            if len(outliers) > len(df) * 0.1:  # More than 10% outliers
                validity_issues += 1

        validity = max(0, 100 - (validity_issues / max(1, len(numeric_cols))) * 50)

        # Overall quality score
        overall_quality = (completeness * 0.3 + uniqueness * 0.2 +
                          consistency * 0.3 + validity * 0.2)

        return {
            'completeness': completeness,
            'uniqueness': uniqueness,
            'consistency': consistency,
            'validity': validity,
            'overall_quality': overall_quality,
            'quality_grade': self._get_quality_grade(overall_quality)
        }

    def _get_quality_grade(self, score: float) -> str:
        """Get quality grade based on score"""
        if score >= 90:
            return 'Excellent'
        elif score >= 75:
            return 'Good'
        elif score >= 60:
            return 'Fair'
        else:
            return 'Poor'

    def _analyze_distributions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze data distributions"""
        distributions = {}

        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            col_data = df[col].dropna()
            if len(col_data) > 0:
                # Basic distribution stats
                distributions[col] = {
                    'mean': float(col_data.mean()),
                    'median': float(col_data.median()),
                    'std': float(col_data.std()),
                    'min': float(col_data.min()),
                    'max': float(col_data.max()),
                    'skewness': float(col_data.skew()),
                    'kurtosis': float(col_data.kurtosis()),
                    'quartiles': {
                        'q1': float(col_data.quantile(0.25)),
                        'q2': float(col_data.quantile(0.5)),
                        'q3': float(col_data.quantile(0.75))
                    },
                    'histogram_data': self._get_histogram_data(col_data),
                    'normality_test': self._test_normality(col_data)
                }

        return distributions

    def _get_histogram_data(self, data: pd.Series, bins: int = 20) -> Dict[str, Any]:
        """Get histogram data for visualization"""
        counts, bin_edges = np.histogram(data, bins=bins)

        return {
            'counts': counts.tolist(),
            'bin_edges': bin_edges.tolist(),
            'bin_centers': [(bin_edges[i] + bin_edges[i+1]) / 2 for i in range(len(bin_edges)-1)]
        }

    def _test_normality(self, data: pd.Series) -> Dict[str, Any]:
        """Test for normality using Shapiro-Wilk test"""
        if len(data) < 3:
            return {'is_normal': False, 'p_value': None, 'test': 'insufficient_data'}

        # Use sample for large datasets
        sample_data = data.sample(min(5000, len(data))) if len(data) > 5000 else data

        try:
            statistic, p_value = stats.shapiro(sample_data)
            return {
                'is_normal': p_value > 0.05,
                'p_value': float(p_value),
                'statistic': float(statistic),
                'test': 'shapiro_wilk'
            }
        except:
            return {'is_normal': False, 'p_value': None, 'test': 'failed'}
    
    def get_comprehensive_analysis(self, file_path: Path) -> Dict[str, Any]:
        """Get comprehensive statistical analysis of the dataset"""
        try:
            # Read the full dataset
            df = pd.read_csv(file_path)

            # Basic dataset info
            dataset_info = {
                'shape': [int(df.shape[0]), int(df.shape[1])],
                'rows': int(len(df)),
                'columns': int(len(df.columns)),
                'memory_usage': f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB",
                'file_size': f"{file_path.stat().st_size / 1024 / 1024:.2f} MB"
            }

            # Data types analysis
            dtypes_info = {
                'numeric_columns': df.select_dtypes(include=[np.number]).columns.tolist(),
                'categorical_columns': df.select_dtypes(include=['object']).columns.tolist(),
                'datetime_columns': df.select_dtypes(include=['datetime64']).columns.tolist(),
                'boolean_columns': df.select_dtypes(include=['bool']).columns.tolist()
            }

            # Missing values analysis
            missing_cols_dict = df.isnull().sum()[df.isnull().sum() > 0].to_dict()
            missing_cols_converted = {}
            for col, count in missing_cols_dict.items():
                missing_cols_converted[str(col)] = int(count)

            missing_analysis = {
                'total_missing': int(df.isnull().sum().sum()),
                'missing_percentage': float((df.isnull().sum().sum() / (df.shape[0] * df.shape[1])) * 100),
                'columns_with_missing': missing_cols_converted,
                'missing_patterns': self._analyze_missing_patterns(df)
            }

            # Duplicate analysis
            duplicate_analysis = {
                'duplicate_rows': int(df.duplicated().sum()),
                'duplicate_percentage': float((df.duplicated().sum() / len(df)) * 100),
                'unique_rows': int(len(df.drop_duplicates()))
            }

            # Statistical summary for numeric columns
            numeric_summary = {}
            if dtypes_info['numeric_columns']:
                numeric_df = df[dtypes_info['numeric_columns']]
                # Convert numpy types to native Python types for JSON serialization
                describe_dict = numeric_df.describe().to_dict()
                for col in describe_dict:
                    for stat in describe_dict[col]:
                        describe_dict[col][stat] = float(describe_dict[col][stat])

                corr_dict = numeric_df.corr().to_dict()
                for col in corr_dict:
                    for col2 in corr_dict[col]:
                        if pd.notna(corr_dict[col][col2]):
                            corr_dict[col][col2] = float(corr_dict[col][col2])
                        else:
                            corr_dict[col][col2] = None

                skew_dict = numeric_df.skew().to_dict()
                for col in skew_dict:
                    skew_dict[col] = float(skew_dict[col])

                kurt_dict = numeric_df.kurtosis().to_dict()
                for col in kurt_dict:
                    kurt_dict[col] = float(kurt_dict[col])

                numeric_summary = {
                    'describe': describe_dict,
                    'correlation_matrix': corr_dict,
                    'skewness': skew_dict,
                    'kurtosis': kurt_dict,
                    'outliers': self._detect_outliers(numeric_df)
                }

            # Categorical analysis
            categorical_summary = {}
            if dtypes_info['categorical_columns']:
                for col in dtypes_info['categorical_columns']:
                    top_values_dict = df[col].value_counts().head(10).to_dict()
                    # Convert numpy types to native Python types
                    top_values_converted = {}
                    for key, value in top_values_dict.items():
                        top_values_converted[str(key)] = int(value)

                    categorical_summary[col] = {
                        'unique_count': int(df[col].nunique()),
                        'unique_percentage': float((df[col].nunique() / len(df)) * 100),
                        'top_values': top_values_converted,
                        'mode': str(df[col].mode().iloc[0]) if not df[col].mode().empty else None
                    }

            # Data quality assessment
            quality_assessment = self._assess_data_quality(df)

            # Distribution analysis
            distribution_analysis = self._analyze_distributions(df)

            return {
                'dataset_info': dataset_info,
                'dtypes_info': dtypes_info,
                'missing_analysis': missing_analysis,
                'duplicate_analysis': duplicate_analysis,
                'numeric_summary': numeric_summary,
                'categorical_summary': categorical_summary,
                'quality_assessment': quality_assessment,
                'distribution_analysis': distribution_analysis
            }

        except Exception as e:
            raise ValueError(f"Failed to analyze dataset: {str(e)}")

    def get_dataset_info(self, file_path: Path) -> Dict[str, Any]:
        """Get basic dataset information"""
        try:
            # Read the full dataset to get accurate counts
            df = pd.read_csv(file_path)
            
            return {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.1f}KB",
                "column_names": df.columns.tolist()
            }
        except Exception as e:
            raise ValueError(f"Failed to analyze dataset: {str(e)}")
    
    def infer_column_type(self, series: pd.Series) -> str:
        """Infer the data type of a column"""
        # Remove null values for type inference
        non_null_series = series.dropna()

        if len(non_null_series) == 0:
            return "unknown"

        # Check for boolean first (pandas boolean columns)
        if series.dtype == bool:
            return "boolean"

        # Check for boolean strings
        boolean_values = {'True', 'False', 'true', 'false', 'TRUE', 'FALSE', 'yes', 'no', 'YES', 'NO'}
        if non_null_series.astype(str).isin(boolean_values).all():
            return "boolean"

        # Check for numerical
        if pd.api.types.is_numeric_dtype(series):
            return "numerical"

        # Try to convert to numeric
        try:
            pd.to_numeric(non_null_series, errors='raise')
            return "numerical"
        except:
            pass



        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"

        # Try to convert to datetime (only for string-like data)
        if not pd.api.types.is_numeric_dtype(series):
            try:
                # Only try datetime conversion on a sample to avoid false positives
                sample = non_null_series.head(min(10, len(non_null_series)))
                pd.to_datetime(sample, errors='raise')
                # Additional check: ensure it looks like a date format
                sample_str = sample.astype(str).iloc[0]
                if any(char in sample_str for char in ['-', '/', ':', ' ']) and len(sample_str) > 6:
                    return "datetime"
            except:
                pass

        # Default to categorical
        return "categorical"
    
    def analyze_column(self, series: pd.Series, column_name: str) -> ColumnSchema:
        """Analyze a single column and return schema information"""
        total_count = len(series)
        null_count = series.isnull().sum()
        non_null_series = series.dropna()
        
        # Basic statistics
        unique_values = series.nunique()
        null_percentage = (null_count / total_count) * 100 if total_count > 0 else 0
        
        # Type inference
        column_type = self.infer_column_type(series)
        
        # High cardinality check
        is_high_cardinality = (unique_values / total_count) > self.high_cardinality_threshold if total_count > 0 else False
        
        # Constant values check
        if len(non_null_series) > 0:
            most_common_count = non_null_series.value_counts().iloc[0] if len(non_null_series) > 0 else 0
            is_constant = (most_common_count / len(non_null_series)) > self.constant_threshold
        else:
            is_constant = True
        
        # Sample values
        sample_values = []
        if len(non_null_series) > 0:
            sample_values = non_null_series.head(self.sample_size).tolist()
            # Convert numpy types to Python types for JSON serialization
            sample_values = [self._convert_numpy_type(val) for val in sample_values]
        
        return ColumnSchema(
            type=column_type,
            unique_values=unique_values,
            null_percentage=round(null_percentage, 2),
            is_high_cardinality=is_high_cardinality,
            is_constant=is_constant,
            sample_values=sample_values
        )
    
    def _convert_numpy_type(self, value):
        """Convert numpy types to Python types for JSON serialization"""
        if pd.isna(value):
            return None
        elif isinstance(value, (np.integer, np.int64, np.int32)):
            return int(value)
        elif isinstance(value, (np.floating, np.float64, np.float32)):
            return float(value)
        elif isinstance(value, np.bool_):
            return bool(value)
        elif isinstance(value, (np.str_, np.unicode_)):
            return str(value)
        else:
            return str(value)
    
    def infer_schema(self, file_path: Path) -> Dict[str, ColumnSchema]:
        """Infer schema for all columns in the dataset"""
        try:
            # Load the dataset
            df = pd.read_csv(file_path)
            
            schema = {}
            for column in df.columns:
                schema[column] = self.analyze_column(df[column], column)
            
            return schema
            
        except Exception as e:
            raise ValueError(f"Failed to infer schema: {str(e)}")
    
    def validate_csv_structure(self, file_path: Path) -> Dict[str, Any]:
        """Validate CSV structure and return any issues"""
        issues = []
        
        try:
            # Try to read the file
            df = pd.read_csv(file_path)
            
            # Check for empty dataset
            if len(df) == 0:
                issues.append("Dataset is empty")
            
            # Check for columns with no name
            unnamed_cols = [col for col in df.columns if 'Unnamed:' in str(col)]
            if unnamed_cols:
                issues.append(f"Found unnamed columns: {unnamed_cols}")
            
            # Check for duplicate column names
            duplicate_cols = df.columns[df.columns.duplicated()].tolist()
            if duplicate_cols:
                issues.append(f"Found duplicate column names: {duplicate_cols}")
            
            # Check for very wide datasets
            if len(df.columns) > 1000:
                issues.append(f"Dataset has {len(df.columns)} columns, which may cause performance issues")
            
            return {
                "is_valid": len(issues) == 0,
                "issues": issues,
                "rows": len(df),
                "columns": len(df.columns)
            }
            
        except Exception as e:
            return {
                "is_valid": False,
                "issues": [f"Failed to parse CSV: {str(e)}"],
                "rows": 0,
                "columns": 0
            }


    def detect_outliers(self, series: pd.Series, method: str = "iqr") -> List[int]:
        """Detect outliers in a numerical series"""
        if not pd.api.types.is_numeric_dtype(series):
            return []

        clean_series = series.dropna()
        if len(clean_series) < 4:  # Need at least 4 values for meaningful outlier detection
            return []

        outlier_indices = []

        if method == "iqr":
            Q1 = clean_series.quantile(0.25)
            Q3 = clean_series.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outlier_mask = (series < lower_bound) | (series > upper_bound)
            outlier_indices = series[outlier_mask].index.tolist()

        elif method == "zscore":
            z_scores = np.abs(stats.zscore(clean_series))
            outlier_mask = z_scores > 3
            outlier_indices = clean_series[outlier_mask].index.tolist()

        return outlier_indices[:10]  # Return max 10 outlier indices

    def calculate_skewness(self, series: pd.Series) -> Optional[float]:
        """Calculate skewness for numerical columns"""
        if not pd.api.types.is_numeric_dtype(series):
            return None

        clean_series = series.dropna()
        if len(clean_series) < 3:
            return None

        try:
            return float(stats.skew(clean_series))
        except:
            return None

    def calculate_correlations(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate pairwise correlations between numerical columns"""
        numerical_cols = df.select_dtypes(include=[np.number]).columns

        if len(numerical_cols) < 2:
            return {}

        correlations = {}
        corr_matrix = df[numerical_cols].corr()

        # Get significant correlations (> 0.3 or < -0.3)
        for i, col1 in enumerate(numerical_cols):
            for j, col2 in enumerate(numerical_cols):
                if i < j:  # Avoid duplicates and self-correlation
                    corr_value = corr_matrix.loc[col1, col2]
                    if not pd.isna(corr_value) and abs(corr_value) > 0.3:
                        key = f"{col1}_{col2}"
                        correlations[key] = round(float(corr_value), 3)

        return correlations

    def detect_data_leakage(self, df: pd.DataFrame, target_column: Optional[str] = None) -> List[str]:
        """Detect potential data leakage issues"""
        leakage_issues = []

        if target_column and target_column in df.columns:
            target_series = df[target_column]

            for col in df.columns:
                if col == target_column:
                    continue

                # Check for perfect correlation
                if pd.api.types.is_numeric_dtype(df[col]) and pd.api.types.is_numeric_dtype(target_series):
                    try:
                        corr = df[col].corr(target_series)
                        if not pd.isna(corr) and abs(corr) > 0.95:
                            leakage_issues.append(f"High correlation between {col} and {target_column}: {corr:.3f}")
                    except:
                        pass

                # Check for identical values
                if df[col].equals(target_series):
                    leakage_issues.append(f"Column {col} is identical to target {target_column}")

        return leakage_issues

    def assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Assess overall data quality"""
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isnull().sum().sum()

        # Calculate completeness
        completeness = (total_cells - missing_cells) / total_cells if total_cells > 0 else 0

        # Check for duplicate rows
        duplicate_rows = df.duplicated().sum()

        # Check for columns with all missing values
        empty_columns = df.columns[df.isnull().all()].tolist()

        # Check for columns with single unique value
        constant_columns = []
        for col in df.columns:
            if df[col].nunique() <= 1:
                constant_columns.append(col)

        # Calculate consistency score (simplified)
        consistency_issues = len(empty_columns) + len(constant_columns)
        max_possible_issues = len(df.columns)
        consistency = 1 - (consistency_issues / max_possible_issues) if max_possible_issues > 0 else 1

        return {
            "completeness": round(completeness, 3),
            "consistency": round(consistency, 3),
            "duplicate_rows": int(duplicate_rows),
            "empty_columns": empty_columns,
            "constant_columns": constant_columns,
            "missing_cells": int(missing_cells),
            "total_cells": int(total_cells)
        }

    def generate_comprehensive_profile(self, file_path: Path, target_column: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive data profile"""
        try:
            # Load the dataset
            df = pd.read_csv(file_path)

            # Basic dataset info
            dataset_info = {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.1f}KB",
                "missing_values_total": int(df.isnull().sum().sum()),
                "duplicate_rows": int(df.duplicated().sum())
            }

            # Detailed column profiles
            column_profiles = {}
            for column in df.columns:
                series = df[column]

                # Basic schema info
                schema = self.analyze_column(series, column)

                # Additional profiling for numerical columns
                profile = {
                    "type": schema.type,
                    "count": int(series.count()),
                    "unique": int(series.nunique()),
                    "null_count": int(series.isnull().sum()),
                    "null_percentage": schema.null_percentage,
                    "is_high_cardinality": schema.is_high_cardinality,
                    "is_constant": schema.is_constant,
                    "sample_values": schema.sample_values
                }

                if schema.type == "numerical":
                    profile.update({
                        "mean": float(series.mean()) if not series.empty else None,
                        "std": float(series.std()) if not series.empty else None,
                        "min": float(series.min()) if not series.empty else None,
                        "max": float(series.max()) if not series.empty else None,
                        "quartiles": [float(q) for q in series.quantile([0.25, 0.5, 0.75]).tolist()] if not series.empty else [],
                        "skewness": self.calculate_skewness(series),
                        "outliers": self.detect_outliers(series)[:5]  # First 5 outlier indices
                    })

                elif schema.type == "categorical":
                    value_counts = series.value_counts().head(10)
                    profile.update({
                        "top_values": {str(k): int(v) for k, v in value_counts.items()},
                        "most_frequent": str(series.mode().iloc[0]) if not series.mode().empty else None,
                        "frequency_of_top": int(value_counts.iloc[0]) if not value_counts.empty else 0
                    })

                column_profiles[column] = profile

            # Correlations
            correlations = self.calculate_correlations(df)

            # Data quality assessment
            data_quality = self.assess_data_quality(df)

            # Data leakage detection
            potential_leakage = self.detect_data_leakage(df, target_column)
            data_quality["potential_leakage"] = potential_leakage

            return {
                "dataset_info": dataset_info,
                "column_profiles": column_profiles,
                "correlations": correlations,
                "data_quality": data_quality
            }

        except Exception as e:
            raise ValueError(f"Failed to generate comprehensive profile: {str(e)}")

    def detect_target_column(self, df: pd.DataFrame, target_hint: Optional[str] = None) -> Optional[str]:
        """Detect the target column in the dataset"""
        if target_hint and target_hint in df.columns:
            return target_hint

        # Common target column names
        target_names = ['target', 'label', 'class', 'y', 'output', 'prediction', 'result']

        for col in df.columns:
            if col.lower() in target_names:
                return col

        # If no obvious target found, return None
        return None

    def infer_problem_type(self, target_series: pd.Series) -> str:
        """Infer whether this is a classification or regression problem"""
        # Remove null values
        clean_target = target_series.dropna()

        if len(clean_target) == 0:
            return "unknown"

        # Check if target is numeric
        if pd.api.types.is_numeric_dtype(clean_target):
            # Check if all values are integers and limited unique values
            unique_values = clean_target.nunique()
            total_values = len(clean_target)

            # If less than 10 unique values or less than 5% unique values, likely classification
            if unique_values <= 10 or (unique_values / total_values) < 0.05:
                return "classification"
            else:
                return "regression"
        else:
            # Non-numeric target is classification
            return "classification"

    def prepare_features_and_target(self, df: pd.DataFrame, target_column: str) -> Tuple[pd.DataFrame, pd.Series]:
        """Separate features and target"""
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")

        # Separate features and target
        X = df.drop(columns=[target_column])
        y = df[target_column]

        return X, y

    def create_preprocessing_pipeline(self, X: pd.DataFrame) -> ColumnTransformer:
        """Create preprocessing pipeline based on column types"""
        # Identify column types
        numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()

        # Remove high cardinality categorical columns (>50 unique values)
        filtered_categorical_cols = []
        for col in categorical_cols:
            if X[col].nunique() <= 50:  # Reasonable threshold for one-hot encoding
                filtered_categorical_cols.append(col)

        # Create preprocessing steps
        preprocessors = []

        # Numerical preprocessing
        if numerical_cols:
            numerical_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            preprocessors.append(('num', numerical_pipeline, numerical_cols))

        # Categorical preprocessing
        if filtered_categorical_cols:
            categorical_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            preprocessors.append(('cat', categorical_pipeline, filtered_categorical_cols))

        # Create column transformer
        if preprocessors:
            return ColumnTransformer(
                transformers=preprocessors,
                remainder='drop'  # Drop columns not specified
            )
        else:
            # If no valid columns, return a simple transformer
            return ColumnTransformer(
                transformers=[('passthrough', 'passthrough', [])],
                remainder='drop'
            )

    def get_feature_names_after_preprocessing(self, preprocessor: ColumnTransformer, X: pd.DataFrame) -> List[str]:
        """Get feature names after preprocessing"""
        feature_names = []

        for name, transformer, columns in preprocessor.transformers_:
            if name == 'num':
                feature_names.extend(columns)
            elif name == 'cat':
                if hasattr(transformer.named_steps['onehot'], 'get_feature_names_out'):
                    # For newer sklearn versions
                    cat_features = transformer.named_steps['onehot'].get_feature_names_out(columns)
                    feature_names.extend(cat_features)
                else:
                    # Fallback for older versions
                    for col in columns:
                        unique_values = X[col].unique()
                        for val in unique_values:
                            feature_names.append(f"{col}_{val}")

        return feature_names


# Global data processor instance
data_processor = DataProcessor()
