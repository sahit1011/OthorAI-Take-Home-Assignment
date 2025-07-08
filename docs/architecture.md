# 🏗️ System Architecture - Othor AI Assignment

## 📊 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│   (React/Next)  │◄──►│   (FastAPI)     │◄──►│   (File System) │
│                 │    │                 │    │   + Models      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **ML Libraries:** Scikit-learn, XGBoost, Pandas, NumPy
- **File Processing:** Pandas, CSV streaming
- **Model Persistence:** Joblib/Pickle
- **API Documentation:** OpenAPI/Swagger (auto-generated)

### Frontend
- **Framework:** React with Next.js (or plain React)
- **Styling:** CSS Modules / Tailwind CSS
- **Charts:** Chart.js / Recharts
- **HTTP Client:** Axios / Fetch API
- **State Management:** React Context / Redux (if needed)

### DevOps & Deployment
- **Containerization:** Docker + Docker Compose
- **Testing:** Pytest (Backend), Jest (Frontend)
- **Documentation:** Markdown files

### Optional (Bonus Features)
- **Database:** PostgreSQL / MongoDB
- **Message Queue:** Redis + Celery
- **Cloud Storage:** AWS S3 / MinIO
- **Authentication:** JWT

---

## 📁 Project Structure

```
othor-ai-assignment/
├── docs/                          # Documentation
│   ├── tasks.md                   # Task breakdown
│   ├── architecture.md            # This file
│   ├── api-docs.md               # API documentation
│   └── setup.md                  # Setup instructions
├── backend/                       # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── api/                  # API routes
│   │   │   ├── __init__.py
│   │   │   ├── upload.py         # File upload endpoints
│   │   │   ├── profile.py        # Data profiling endpoints
│   │   │   ├── train.py          # Model training endpoints
│   │   │   └── predict.py        # Prediction endpoints
│   │   ├── core/                 # Core business logic
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # Configuration
│   │   │   ├── data_processor.py # Data processing logic
│   │   │   ├── ml_pipeline.py    # ML pipeline
│   │   │   └── file_handler.py   # File operations
│   │   ├── models/               # Pydantic models
│   │   │   ├── __init__.py
│   │   │   ├── upload.py         # Upload models
│   │   │   ├── profile.py        # Profile models
│   │   │   └── prediction.py     # Prediction models
│   │   └── utils/                # Utility functions
│   │       ├── __init__.py
│   │       ├── validators.py     # Input validation
│   │       └── helpers.py        # Helper functions
│   ├── tests/                    # Backend tests
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile               # Backend Docker config
├── frontend/                     # React frontend
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Upload/
│   │   │   ├── Profile/
│   │   │   ├── Training/
│   │   │   └── Prediction/
│   │   ├── pages/                # Next.js pages (if using Next.js)
│   │   ├── services/             # API client services
│   │   ├── utils/                # Frontend utilities
│   │   └── styles/               # CSS/styling files
│   ├── package.json              # Node dependencies
│   └── Dockerfile               # Frontend Docker config
├── data/                         # Sample data and uploads
│   ├── samples/                  # Sample CSV files
│   ├── uploads/                  # Uploaded files (temp)
│   └── models/                   # Saved ML models
├── docker-compose.yml            # Multi-container setup
├── README.md                     # Main project documentation
└── .gitignore                   # Git ignore rules
```

---

## 🔄 Data Flow

### 1. File Upload Flow
```
User → Frontend → POST /upload → Backend → File Validation → 
Schema Inference → Session Token → Response to Frontend
```

### 2. Data Profiling Flow
```
Frontend → GET /profile/{session_id} → Backend → Load Data → 
Statistical Analysis → Profiling Report → Response to Frontend
```

### 3. Model Training Flow
```
Frontend → POST /train → Backend → Data Preprocessing → 
Model Training → Model Persistence → Evaluation Metrics → Response
```

### 4. Prediction Flow
```
Frontend → POST /predict → Backend → Load Model → 
Data Preprocessing → Prediction → Confidence Scores → Response
```

---

## 🔌 API Design

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload CSV file |
| GET | `/profile/{session_id}` | Get data profile |
| POST | `/train` | Train ML model |
| POST | `/predict` | Make predictions |
| GET | `/summary/{model_id}` | Get model summary |
| GET | `/health` | Health check |

### Request/Response Flow
- **Authentication:** Session-based (UUID tokens)
- **Content-Type:** `application/json` for API, `multipart/form-data` for uploads
- **Error Handling:** Consistent error response format
- **Validation:** Pydantic models for request/response validation

---

## 🗄️ Data Management

### File Storage
- **Uploaded Files:** Temporary storage in `/data/uploads/`
- **Processed Data:** In-memory processing with Pandas
- **Model Artifacts:** Persistent storage in `/data/models/`

### Session Management
- **Session Tokens:** UUID4 for file tracking
- **Session Duration:** Configurable (default: 24 hours)
- **Cleanup:** Automatic cleanup of expired sessions

### Model Management
- **Model Serialization:** Joblib for scikit-learn models
- **Model Versioning:** Timestamp-based naming
- **Model Metadata:** JSON files with model info

---

## 🔒 Security Considerations

### Input Validation
- File type validation (CSV only)
- File size limits (50MB max)
- Content validation (proper CSV format)
- SQL injection prevention (parameterized queries if DB used)

### Error Handling
- Graceful error responses
- No sensitive information in error messages
- Proper HTTP status codes
- Request rate limiting (if needed)

---

## 📈 Scalability Considerations

### Performance Optimization
- **Streaming:** Large file processing without full memory load
- **Async Processing:** FastAPI async endpoints where beneficial
- **Caching:** Model caching for repeated predictions
- **Pagination:** Large result sets pagination

### Future Enhancements
- **Horizontal Scaling:** Multiple backend instances
- **Database Integration:** Persistent data storage
- **Message Queues:** Background job processing
- **CDN:** Static asset delivery
- **Load Balancing:** Traffic distribution

---

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests:** Individual function testing
- **Integration Tests:** API endpoint testing
- **Performance Tests:** Large file handling
- **Error Handling Tests:** Edge case validation

### Frontend Testing
- **Component Tests:** React component testing
- **Integration Tests:** API integration testing
- **E2E Tests:** Full workflow testing
- **UI Tests:** User interaction testing

---

## 🚀 Deployment Strategy

### Development Environment
- Local development with hot reload
- Docker Compose for full stack
- Environment variables for configuration

### Production Considerations
- **Containerization:** Docker images
- **Environment Config:** Production settings
- **Health Checks:** Service monitoring
- **Logging:** Structured logging
- **Monitoring:** Performance metrics

---

## 📋 Success Metrics

### Functional Requirements
- ✅ File upload and processing
- ✅ Data profiling and analysis
- ✅ Model training and evaluation
- ✅ Prediction generation
- ✅ User-friendly interface

### Non-Functional Requirements
- **Performance:** < 2s response time for small files
- **Reliability:** 99% uptime
- **Usability:** Intuitive user interface
- **Maintainability:** Clean, documented code
- **Scalability:** Handle multiple concurrent users
