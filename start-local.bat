@echo off
REM Othor AI - Local Development Startup Script for Windows
REM This script starts both frontend and backend servers locally

echo 🚀 Starting Othor AI - Local Development Mode
echo ===============================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install Node.js (includes npm).
    pause
    exit /b 1
)

REM Create required directories
echo 📁 Creating required directories...
if not exist "data\uploads" mkdir "data\uploads"
if not exist "data\models" mkdir "data\models"
if not exist "logs" mkdir "logs"

REM Check if backend virtual environment exists
if not exist "backend\venv" (
    echo 📦 Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo 🔧 Starting services...
echo.

REM Start backend server in background
echo 🐍 Starting Backend Server (Port 8001)...
start "Backend Server" cmd /c "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in background
echo ⚛️  Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /c "cd frontend && npm run dev"

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 Othor AI Local Development is starting up!
echo.
echo 📱 Access the application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8001
echo    API Docs:  http://localhost:8001/docs
echo.
echo 📋 Two terminal windows have opened:
echo    - Backend Server (Python/FastAPI)
echo    - Frontend Server (Next.js)
echo.
echo ⚠️  To stop the servers:
echo    - Close both terminal windows, or
echo    - Press Ctrl+C in each terminal window
echo.
echo ⏳ Services may take 1-2 minutes to fully start up.
echo    If you see errors, wait a moment and refresh the page.
echo.
pause
