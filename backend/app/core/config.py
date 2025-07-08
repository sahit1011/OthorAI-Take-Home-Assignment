"""
Application configuration settings
"""
import os
from pathlib import Path
from typing import Optional

class Settings:
    """Application settings"""
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "52428800"))  # 50MB
    ALLOWED_FILE_TYPES: list = [".csv"]
    
    # Directory Configuration
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    MODEL_DIR: Path = DATA_DIR / "models"
    LOG_DIR: Path = BASE_DIR / "logs"
    
    # Session Configuration
    SESSION_TIMEOUT: int = int(os.getenv("SESSION_TIMEOUT", "86400"))  # 24 hours
    
    # ML Configuration
    DEFAULT_TEST_SIZE: float = 0.2
    DEFAULT_RANDOM_STATE: int = 42
    MAX_FEATURES: int = 1000
    MAX_ROWS: int = 1000000
    
    # Optional Database Configuration (for bonus features)
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    
    # Optional Cloud Storage Configuration (for bonus features)
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    S3_BUCKET_NAME: Optional[str] = os.getenv("S3_BUCKET_NAME")
    
    def __init__(self):
        """Initialize settings and create required directories"""
        self.create_directories()
    
    def create_directories(self):
        """Create required directories if they don't exist"""
        directories = [
            self.DATA_DIR,
            self.UPLOAD_DIR,
            self.MODEL_DIR,
            self.LOG_DIR
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

# Global settings instance
settings = Settings()
