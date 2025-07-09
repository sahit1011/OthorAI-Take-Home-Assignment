# 🚀 Othor AI - Mini AI Analyst as a Service

A full-stack application that allows users to upload CSV files, automatically analyze data, train machine learning models, and generate predictions through an intuitive web interface.

## 📋 Features

### Core Features
- 📊 **CSV Upload & Processing** - Upload files up to 50MB with streaming processing
- 🔍 **Data Profiling** - Automatic schema inference, statistical analysis, and data quality assessment
- 🤖 **AutoML Pipeline** - Automated preprocessing, model training, and evaluation
- 📈 **Predictions** - Generate predictions with confidence scores
- 📝 **Natural Language Summaries** - Human-readable insights and recommendations

### Technical Features
- ⚡ **FastAPI Backend** - High-performance API with automatic documentation
- 🎨 **React/Next.js Frontend** - Modern, responsive user interface
- 🐳 **Docker Support** - Containerized deployment
- 🧪 **Comprehensive Testing** - Unit and integration tests
- 📚 **API Documentation** - Interactive Swagger/OpenAPI docs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (File System) │
│   Port: 3000    │    │   Port: 8000    │    │   + ML Models   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Git** (for cloning the repository)
- **Docker & Docker Compose** (for containerized deployment)

### 🐳 Docker Deployment (Recommended for Recruiters)

**The easiest way to run the application - no need to install Python, Node.js, or manage dependencies!**

#### For Windows Users:
```bash
# Clone the repository
git clone https://github.com/sahit1011/OthorAI-Take-Home-Assignment.git
cd OthorAI-Take-Home-Assignment

# Run the startup script
start-docker.bat
```

#### For Mac/Linux Users:
```bash
# Clone the repository
git clone https://github.com/sahit1011/OthorAI-Take-Home-Assignment.git
cd OthorAI-Take-Home-Assignment

# Make the script executable and run it
chmod +x start-docker.sh
./start-docker.sh
```

#### Manual Docker Commands:
```bash
# Clone the repository
git clone https://github.com/sahit1011/OthorAI-Take-Home-Assignment.git
cd OthorAI-Take-Home-Assignment

# Create required directories
mkdir -p data/uploads data/models logs

# Start all services with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### 💻 Local Development Setup (For Developers)

**Prerequisites:** Python 3.9+, Node.js 16+

```bash
# Clone the repository
git clone https://github.com/sahit1011/OthorAI-Take-Home-Assignment.git
cd OthorAI-Take-Home-Assignment

# Backend setup
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies and run
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

## 📖 Usage

### 1. Upload CSV File
- Navigate to http://localhost:3000
- Upload a CSV file (max 50MB)
- Get instant schema analysis and data profiling

### 2. Analyze Data
- View statistical summaries
- Explore correlations and data quality metrics
- Identify potential issues and patterns

### 3. Train Model
- Select target column
- Choose algorithm (Random Forest, XGBoost, Logistic Regression)
- Get evaluation metrics and feature importance

### 4. Make Predictions
- Input new data points
- Get predictions with confidence scores
- Download results

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload CSV file |
| GET | `/profile/{session_id}` | Get data profile |
| POST | `/train` | Train ML model |
| POST | `/predict` | Make predictions |
| GET | `/summary/{model_id}` | Get model summary |

Full API documentation: http://localhost:8000/docs

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
othor-ai-assignment/
├── docs/                    # Documentation
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core business logic
│   │   ├── models/         # Pydantic models
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API services
│   │   └── styles/         # CSS styles
│   └── package.json        # Node dependencies
├── data/                   # Data storage
│   ├── uploads/            # Uploaded files
│   ├── models/             # Trained models
│   └── samples/            # Sample datasets
└── docker-compose.yml      # Multi-container setup
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./data/uploads
MODEL_DIR=./data/models
SESSION_TIMEOUT=86400
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
```

## 🎯 Sample Datasets

The `data/samples/` directory contains example CSV files for testing:
- `sales_data.csv` - Sales regression example
- `customer_churn.csv` - Classification example
- `product_analysis.csv` - General analysis example

## 🚀 Deployment

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build

# Or deploy to cloud platforms
# (AWS, GCP, Azure, Heroku, etc.)
```

## 🔒 Security Features

- File type validation (CSV only)
- File size limits (50MB max)
- Input sanitization and validation
- Session-based authentication
- Error handling without information leakage

## 📊 Performance

- Streaming file processing for large datasets
- Async API endpoints for better concurrency
- Optimized ML pipelines
- Caching for repeated operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the documentation in `docs/`
- Review API docs at `/docs` endpoint
- Open an issue for bugs or feature requests

---

**Built with ❤️ for the Othor AI Take-Home Assignment**
