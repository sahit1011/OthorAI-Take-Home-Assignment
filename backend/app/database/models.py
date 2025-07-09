"""
Database models for the authentication system and file/model metadata storage.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    """
    User model for authentication system.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    uploaded_files = relationship("FileMetadata", back_populates="user", cascade="all, delete-orphan")
    trained_models = relationship("ModelMetadata", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class FileMetadata(Base):
    """
    Model for storing uploaded file metadata.
    """
    __tablename__ = "file_metadata"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)  # UUID for file session
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_path = Column(String, nullable=False)  # Path to stored file
    content_type = Column(String, nullable=False)  # MIME type

    # Dataset information
    num_rows = Column(Integer, nullable=True)
    num_columns = Column(Integer, nullable=True)
    column_names = Column(JSON, nullable=True)  # List of column names
    column_types = Column(JSON, nullable=True)  # Dict of column types

    # User association
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(String, default="uploaded")  # uploaded, processed, error
    error_message = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="uploaded_files")
    trained_models = relationship("ModelMetadata", back_populates="file", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FileMetadata(id={self.id}, session_id='{self.session_id}', filename='{self.filename}')>"


class ModelMetadata(Base):
    """
    Model for storing trained model metadata.
    """
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, unique=True, index=True, nullable=False)  # UUID for model
    model_name = Column(String, nullable=True)  # User-defined name

    # Model configuration
    algorithm = Column(String, nullable=False)  # random_forest, logistic_regression, xgboost
    model_type = Column(String, nullable=False)  # classification, regression
    target_column = Column(String, nullable=False)

    # Training configuration
    test_size = Column(Float, nullable=False)
    random_state = Column(Integer, nullable=False)
    training_parameters = Column(JSON, nullable=True)  # Additional hyperparameters

    # Model performance metrics
    evaluation_metrics = Column(JSON, nullable=False)  # Dict of metrics (accuracy, precision, etc.)
    feature_importance = Column(JSON, nullable=True)  # Dict of feature importance scores

    # Model artifacts
    model_path = Column(String, nullable=False)  # Path to saved model file
    model_size = Column(Integer, nullable=True)  # Size of model file in bytes

    # Training information
    training_duration = Column(Float, nullable=True)  # Training time in seconds
    num_features = Column(Integer, nullable=True)
    num_training_samples = Column(Integer, nullable=True)
    num_test_samples = Column(Integer, nullable=True)

    # Associations
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("file_metadata.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    trained_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(String, default="training")  # training, completed, failed
    error_message = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="trained_models")
    file = relationship("FileMetadata", back_populates="trained_models")

    def __repr__(self):
        return f"<ModelMetadata(id={self.id}, model_id='{self.model_id}', algorithm='{self.algorithm}')>"
