"""
Simple database setup script for Othor AI.
This script provides an easy way to set up PostgreSQL using Docker.
"""
import os
import subprocess
import time
import sys

def check_docker():
    """Check if Docker is installed and running."""
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Docker found: {result.stdout.strip()}")
            
            # Check if Docker is running
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Docker is running")
                return True
            else:
                print("❌ Docker is not running. Please start Docker Desktop.")
                return False
        else:
            print("❌ Docker not found")
            return False
    except FileNotFoundError:
        print("❌ Docker not installed")
        return False

def setup_postgresql_docker():
    """Set up PostgreSQL using Docker Compose."""
    print("\n🐘 Setting up PostgreSQL with Docker...")
    
    try:
        # Start PostgreSQL container
        print("Starting PostgreSQL container...")
        result = subprocess.run([
            'docker-compose', 
            '-f', 'docker-compose.postgresql.yml', 
            'up', '-d', 'postgres'
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Failed to start PostgreSQL: {result.stderr}")
            return False
        
        print("✅ PostgreSQL container started")
        
        # Wait for PostgreSQL to be ready
        print("Waiting for PostgreSQL to be ready...")
        max_attempts = 30
        for attempt in range(max_attempts):
            result = subprocess.run([
                'docker', 'exec', 'othor_ai_postgres', 
                'pg_isready', '-U', 'othor_user', '-d', 'othor_ai'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ PostgreSQL is ready!")
                break
            
            if attempt < max_attempts - 1:
                print(f"   Waiting... ({attempt + 1}/{max_attempts})")
                time.sleep(2)
            else:
                print("❌ PostgreSQL failed to start within timeout")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up PostgreSQL: {e}")
        return False

def create_env_file():
    """Create .env file with PostgreSQL configuration."""
    print("\n📝 Creating .env file...")
    
    database_url = "postgresql://othor_user:othor_secure_pass_2024@localhost:5432/othor_ai"
    
    env_content = f"""# Environment Configuration for Othor AI Backend

# Database Configuration (PostgreSQL)
DATABASE_URL={database_url}

# API Configuration
API_HOST=0.0.0.0
API_PORT=8001
DEBUG=True

# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB
SESSION_TIMEOUT=86400   # 24 hours

# JWT Configuration
SECRET_KEY=othor-ai-super-secret-jwt-key-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=deepseek/deepseek-chat

# Application Configuration
APP_NAME=Othor AI - Mini AI Analyst
APP_VERSION=1.0.0

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ .env file created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

def test_connection():
    """Test the database connection."""
    print("\n🔍 Testing database connection...")
    
    try:
        # Import here to avoid issues if dependencies aren't installed
        from sqlalchemy import create_engine, text
        
        database_url = "postgresql://othor_user:othor_secure_pass_2024@localhost:5432/othor_ai"
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connection successful!")
            print(f"   PostgreSQL version: {version}")
            
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        print("   This might be normal if SQLAlchemy dependencies aren't installed yet")
        return False

def main():
    """Main setup function."""
    print("🚀 Othor AI Database Setup")
    print("=" * 40)
    
    print("\nThis script will:")
    print("1. Set up PostgreSQL using Docker")
    print("2. Create environment configuration")
    print("3. Test the database connection")
    
    # Check Docker
    if not check_docker():
        print("\n❌ Docker is required for this setup method.")
        print("Please install Docker Desktop and try again.")
        print("Alternative: Use setup_postgresql.py for manual PostgreSQL setup")
        return False
    
    # Setup PostgreSQL
    if not setup_postgresql_docker():
        return False
    
    # Create .env file
    if not create_env_file():
        return False
    
    # Test connection
    test_connection()
    
    print("\n" + "=" * 40)
    print("🎉 Database setup completed!")
    print("\n📋 Next steps:")
    print("1. Install Python dependencies: pip install -r requirements.txt")
    print("2. Start the backend server: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
    print("3. The application will automatically create tables on first startup")
    
    print("\n💡 Database access:")
    print("   PostgreSQL: localhost:5432")
    print("   Database: othor_ai")
    print("   Username: othor_user")
    print("   Password: othor_secure_pass_2024")
    
    print("\n🔧 Management:")
    print("   Stop database: docker-compose -f docker-compose.postgresql.yml down")
    print("   Start database: docker-compose -f docker-compose.postgresql.yml up -d postgres")
    print("   View logs: docker-compose -f docker-compose.postgresql.yml logs postgres")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
