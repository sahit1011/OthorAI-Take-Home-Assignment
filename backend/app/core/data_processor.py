"""
Data processing utilities for CSV analysis and schema inference
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import warnings
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


# Global data processor instance
data_processor = DataProcessor()
