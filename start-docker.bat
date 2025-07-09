@echo off
REM Othor AI - Docker Startup Script for Windows
REM This script makes it easy for recruiters to start the application

echo 🚀 Starting Othor AI - Mini AI Analyst as a Service
echo ==================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo    Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available. Please install Docker Compose.
        pause
        exit /b 1
    )
)

REM Create required directories
echo 📁 Creating required directories...
if not exist "data\uploads" mkdir "data\uploads"
if not exist "data\models" mkdir "data\models"
if not exist "logs" mkdir "logs"

REM Stop any existing containers
echo 🛑 Stopping any existing containers...
docker-compose down --remove-orphans

REM Build and start the services
echo 🔨 Building and starting services...
echo    This may take a few minutes on first run...

REM Try docker-compose first, then docker compose
docker-compose up --build -d
if %errorlevel% neq 0 (
    docker compose up --build -d
)

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo 🔍 Checking service status...

REM Check if curl is available, if not skip health checks
curl --version >nul 2>&1
if %errorlevel% equ 0 (
    REM Check backend health
    curl -s -o nul -w "%%{http_code}" http://localhost:8001/health >temp_status.txt 2>nul
    set /p backend_status=<temp_status.txt
    del temp_status.txt >nul 2>&1
    
    if "%backend_status%"=="200" (
        echo ✅ Backend is healthy (Port 8001)
    ) else (
        echo ⚠️  Backend is starting up... (Port 8001)
    )
    
    REM Check frontend health
    curl -s -o nul -w "%%{http_code}" http://localhost:3000 >temp_status.txt 2>nul
    set /p frontend_status=<temp_status.txt
    del temp_status.txt >nul 2>&1
    
    if "%frontend_status%"=="200" (
        echo ✅ Frontend is healthy (Port 3000)
    ) else (
        echo ⚠️  Frontend is starting up... (Port 3000)
    )
) else (
    echo ⚠️  Health check skipped (curl not available)
)

echo.
echo 🎉 Othor AI is starting up!
echo.
echo 📱 Access the application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8001
echo    API Docs:  http://localhost:8001/docs
echo.
echo 📋 Useful commands:
echo    View logs:     docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart:       docker-compose restart
echo.
echo ⏳ Services may take 1-2 minutes to fully start up.
echo    If you see errors, wait a moment and refresh the page.
echo.
pause
