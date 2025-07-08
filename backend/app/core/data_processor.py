"""
Data processing utilities for CSV analysis and schema inference
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import warnings
from scipy import stats
from sklearn.preprocessing import LabelEncoder
warnings.filterwarnings('ignore')

from ..models.upload import ColumnSchema


class DataProcessor:
    """Handles CSV data processing and schema inference"""
    
    def __init__(self):
        self.high_cardinality_threshold = 0.8  # 80% unique values
        self.constant_threshold = 0.95  # 95% same values
        self.sample_size = 5  # Number of sample values to return
    
    def load_csv_sample(self, file_path: Path, sample_rows: int = 1000) -> pd.DataFrame:
        """Load a sample of the CSV file for analysis"""
        try:
            # First, try to read a small sample to infer structure
            df_sample = pd.read_csv(file_path, nrows=sample_rows)
            return df_sample
        except Exception as e:
            raise ValueError(f"Failed to read CSV file: {str(e)}")
    
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


# Global data processor instance
data_processor = DataProcessor()
