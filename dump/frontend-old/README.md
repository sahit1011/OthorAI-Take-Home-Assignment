# Othor AI Frontend

Modern React/Next.js frontend for the Othor AI - Mini AI Analyst as a Service platform.

## Features

### Phase 5.1 - Data Profiling Interface ✅
- **Upload Page** (`/upload`) - Drag & drop CSV file upload with real-time validation
- **Profile Page** (`/profile`) - Comprehensive dataset analysis and quality metrics
  - Dataset overview (rows, columns, memory usage, data quality score)
  - Column-by-column analysis with type detection
  - Data quality issues detection (duplicates, empty columns, constant columns)
  - Interactive column profiling

### Phase 5.2 - Model Training Interface ✅
- **Training Page** (`/train`) - Complete model training workflow
  - Target column selection with type-aware filtering
  - Algorithm selection (Random Forest, XGBoost, Logistic Regression, SVM)
  - Training parameter configuration (test size, random state)
  - Real-time training progress with animated UI
  - Training results display with model metrics

### Phase 5.3 - Prediction Interface ✅
- **Prediction Page** (`/predict`) - Interactive prediction interface
  - Model information display
  - Dynamic input form based on model features
  - Multiple row prediction support
  - Real-time prediction results with confidence scores
  - Probability distributions for classification models

## Technology Stack

- **Framework**: Next.js 14.0.3 with TypeScript
- **Styling**: Tailwind CSS with custom gradients and animations
- **Animations**: Framer Motion with SSR-safe ClientOnly wrapper
- **UI Components**: Heroicons, Headless UI
- **Charts**: Recharts for data visualization
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios with interceptors

## Architecture

### Component Structure
```
src/
├── components/
│   ├── ClientOnly.tsx          # SSR-safe animation wrapper
│   ├── ErrorBoundary.tsx       # Global error handling
│   ├── Layout/                 # Layout components
│   ├── UI/                     # Reusable UI components
│   └── Upload/                 # Upload-specific components
├── pages/
│   ├── _app.tsx               # App wrapper with error boundary
│   ├── index.tsx              # Landing page
│   ├── upload.tsx             # File upload interface
│   ├── profile.tsx            # Data profiling page
│   ├── train.tsx              # Model training page
│   └── predict.tsx            # Prediction interface
├── services/
│   └── api.ts                 # API service layer
└── styles/
    └── globals.css            # Global styles
```

### API Integration
- Centralized API service with error handling
- Type-safe interfaces for all API responses
- Automatic request/response logging
- Comprehensive error handling with user-friendly messages

### State Management
- React hooks for local component state
- URL-based state for navigation between pages
- Session-based data flow (upload → profile → train → predict)

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm 8+

### Installation
```bash
cd frontend
npm install
```

### Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:3000` (or next available port).

### Build
```bash
npm run build
npm start
```

### Testing
```bash
npm test
npm run test:coverage
```

## API Configuration

The frontend expects the backend API to be running on `http://localhost:8002` by default. Update the `NEXT_PUBLIC_API_URL` environment variable to point to your backend.

### Required API Endpoints
- `POST /upload/` - File upload
- `GET /profile/{session_id}` - Data profiling
- `POST /train/` - Model training
- `GET /predict/model/{model_id}/info` - Model information
- `POST /predict/` - Make predictions

## Features Implemented

### ✅ Modern UI/UX
- Responsive design with mobile support
- Dark theme with purple/pink gradient aesthetics
- Smooth animations and transitions
- Loading states and progress indicators
- Error handling with user-friendly messages

### ✅ File Upload
- Drag & drop interface with visual feedback
- File validation (CSV only, 50MB limit)
- Real-time upload progress
- Success/error states with detailed feedback

### ✅ Data Profiling
- Comprehensive dataset analysis
- Column type detection and statistics
- Data quality assessment
- Visual indicators for issues
- Interactive column exploration

### ✅ Model Training
- Algorithm selection with descriptions
- Parameter configuration
- Real-time training progress
- Results visualization
- Model persistence and retrieval

### ✅ Predictions
- Dynamic input forms
- Batch prediction support
- Confidence scores and probabilities
- Results visualization
- Model information display

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Code splitting with Next.js
- Optimized bundle size
- Lazy loading of components
- Efficient re-renders with React hooks
- SSR-safe animations

## Security

- Environment-based configuration
- Input validation and sanitization
- Error boundary for graceful failure handling
- Secure API communication
