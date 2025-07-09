"""
Database configuration and session management for SQLite database.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Database configuration
# For PostgreSQL (production)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/othor_ai")

# Fallback to SQLite for development if PostgreSQL not available
SQLITE_URL = "sqlite:///./data/othor_ai.db"

# Ensure data directory exists for SQLite fallback
os.makedirs("./data", exist_ok=True)

# Try PostgreSQL first, fallback to SQLite
try:
    # Create PostgreSQL engine
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True for SQL query logging
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,  # Recycle connections every 5 minutes
    )
    # Test connection
    with engine.connect() as conn:
        conn.execute("SELECT 1")
    print("✅ Connected to PostgreSQL database")

except Exception as e:
    print(f"⚠️  PostgreSQL connection failed: {e}")
    print("🔄 Falling back to SQLite for development")

    # Create SQLite engine as fallback
    engine = create_engine(
        SQLITE_URL,
        connect_args={
            "check_same_thread": False,  # Allow multiple threads for SQLite
        },
        poolclass=StaticPool,  # Use static pool for SQLite
        echo=False,  # Set to True for SQL query logging
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency to get database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Create all database tables.
    """
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """
    Drop all database tables (for testing/development).
    """
    Base.metadata.drop_all(bind=engine)
