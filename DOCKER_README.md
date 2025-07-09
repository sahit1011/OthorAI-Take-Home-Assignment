# OthorAI Assessment - Docker Setup

This document provides instructions for running the OthorAI Assessment application using Docker containers.

## 🐳 Docker Overview

The application is containerized using Docker with the following services:
- **Backend**: FastAPI application running on port 8001
- **Frontend**: Next.js application running on port 3000

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0 or higher
- At least 4GB of available RAM
- Ports 3000 and 8001 available on your system

## 🚀 Quick Start

### 1. Clone and Navigate to Project
```bash
git clone <repository-url>
cd OthorAI-assesment
```

### 2. Build and Start Services
```bash
docker-compose up --build -d
```

This command will:
- Build both frontend and backend Docker images
- Create a custom network for inter-service communication
- Start both services in detached mode
- Set up health checks for both services

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health

## 🔧 Docker Configuration

### Backend Configuration
- **Base Image**: python:3.9-slim
- **Port**: 8001
- **Health Check**: GET /health endpoint
- **Environment**: Production-ready with SQLite database
- **Features**:
  - Automatic dependency installation
  - File upload support
  - Model storage directory
  - Logging configuration

### Frontend Configuration
- **Base Image**: node:18-alpine
- **Port**: 3000
- **Build**: Optimized production build
- **Features**:
  - Next.js standalone output
  - Tailwind CSS support
  - TypeScript compilation
  - ESLint disabled for Docker builds

## 📁 Directory Structure
```
OthorAI-assesment/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── docker-compose.yml
└── DOCKER_README.md
```

## 🛠️ Available Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with build
docker-compose up --build -d

# Start with logs
docker-compose up
```

### Stop Services
```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs
docker-compose logs -f
```

### Check Status
```bash
# Service status
docker-compose ps

# Container details
docker ps
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000
   netstat -ano | findstr :8001
   ```

2. **Build Failures**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

3. **Health Check Failures**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Test health endpoint manually
   curl http://localhost:8001/health
   ```

### Performance Optimization

1. **Build Cache**: Docker uses layer caching for faster rebuilds
2. **Multi-stage Builds**: Frontend uses multi-stage build for smaller images
3. **Health Checks**: Configured for proper service startup ordering

## 🌐 Network Configuration

- **Network Name**: `othor-ai-network`
- **Type**: Bridge network
- **Inter-service Communication**: Services can communicate using service names
- **External Access**: Frontend (3000) and Backend (8001) exposed to host

## 💾 Data Persistence

- **Backend Data**: Stored in `/app/data` directory within container
- **Database**: SQLite file persisted in container
- **Uploads**: File uploads stored in `/app/data/uploads`
- **Models**: ML models stored in `/app/data/models`

## 🔒 Security Features

- **Non-root User**: Frontend runs as non-root user (nextjs:nodejs)
- **Health Checks**: Proper health monitoring for both services
- **Network Isolation**: Services communicate through internal network
- **Environment Variables**: Secure configuration management

## 📊 Monitoring

### Health Checks
- **Backend**: GET /health every 30s
- **Frontend**: HTTP check on port 3000
- **Startup Time**: 60s grace period for backend
- **Retries**: 5 attempts before marking unhealthy

### Resource Usage
- **Backend**: ~200MB RAM, minimal CPU
- **Frontend**: ~100MB RAM, minimal CPU
- **Total**: ~300MB RAM for both services

## 🚀 Production Considerations

1. **Environment Variables**: Configure for production environment
2. **SSL/TLS**: Add reverse proxy (nginx) for HTTPS
3. **Database**: Consider PostgreSQL for production
4. **Logging**: Implement centralized logging
5. **Monitoring**: Add application monitoring tools
6. **Scaling**: Use Docker Swarm or Kubernetes for scaling

## 📝 Development Workflow

1. **Code Changes**: Make changes to source code
2. **Rebuild**: `docker-compose up --build`
3. **Test**: Access application at localhost:3000
4. **Debug**: Use `docker-compose logs` for troubleshooting

## 🤝 Contributing

When contributing to the Docker setup:
1. Test changes locally with `docker-compose up --build`
2. Ensure health checks pass
3. Update this README if configuration changes
4. Test on different platforms (Windows/Mac/Linux)

---

For more information about the application features and API documentation, visit http://localhost:8001/docs after starting the services.
