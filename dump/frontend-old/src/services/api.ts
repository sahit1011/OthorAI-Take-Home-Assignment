/**
 * API service for communicating with the Othor AI backend
 */
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Type definitions
export interface UploadResponse {
  session_id: string;
  filename: string;
  file_size: number;
  rows: number;
  columns: number;
  upload_timestamp: string;
  data_schema: Record<string, any>;
  message: string;
}

export interface ProfileResponse {
  session_id: string;
  dataset_info: {
    rows: number;
    columns: number;
    memory_usage: string;
    missing_values_total: number;
    duplicate_rows: number;
  };
  column_profiles: Record<string, any>;
  correlations: Record<string, number>;
  data_quality: {
    completeness: number;
    duplicate_rows: number;
    empty_columns: string[];
    constant_columns: string[];
  };
  timestamp: string;
}

export interface TrainRequest {
  session_id: string;
  target_column: string;
  model_type?: string;
  algorithm?: string;
  test_size?: number;
  random_state?: number;
}

export interface TrainResponse {
  model_id: string;
  session_id: string;
  model_type: string;
  algorithm: string;
  training_info: Record<string, any>;
  evaluation_metrics: Record<string, any>;
  feature_importance: Record<string, number>;
  model_path: string;
  timestamp: string;
}

export interface PredictRequest {
  model_id: string;
  data: Record<string, any>[];
}

export interface PredictResponse {
  model_id: string;
  predictions: {
    prediction: any;
    confidence: number;
    probabilities?: Record<string, number>;
  }[];
  prediction_timestamp: string;
}

export interface ModelSummaryResponse {
  model_id: string;
  dataset_summary: Record<string, any>;
  model_summary: Record<string, any>;
  insights: Record<string, any>;
  natural_language_summary: string;
  timestamp: string;
}

// API Service Class
class ApiService {
  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  }

  // File upload
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Get upload info
  async getUploadInfo(sessionId: string) {
    const response = await api.get(`/upload/session/${sessionId}/info`);
    return response.data;
  }

  // Data profiling
  async getDataProfile(sessionId: string, targetColumn?: string): Promise<ProfileResponse> {
    const params = targetColumn ? { target_column: targetColumn } : {};
    const response = await api.get(`/profile/${sessionId}`, { params });
    return response.data;
  }

  // Get correlations
  async getCorrelations(sessionId: string) {
    const response = await api.get(`/profile/${sessionId}/correlations`);
    return response.data;
  }

  // Get data quality
  async getDataQuality(sessionId: string) {
    const response = await api.get(`/profile/${sessionId}/quality`);
    return response.data;
  }

  // Train model
  async trainModel(request: TrainRequest): Promise<TrainResponse> {
    const response = await api.post('/train/', request);
    return response.data;
  }

  // Get supported algorithms
  async getSupportedAlgorithms() {
    const response = await api.get('/train/algorithms');
    return response.data;
  }

  // Get training status
  async getTrainingStatus(modelId: string) {
    const response = await api.get(`/train/status/${modelId}`);
    return response.data;
  }

  // Make predictions
  async makePredictions(request: PredictRequest): Promise<PredictResponse> {
    const response = await api.post('/predict/', request);
    return response.data;
  }

  // Get available models
  async getAvailableModels() {
    const response = await api.get('/predict/models');
    return response.data;
  }

  // Get model info
  async getModelInfo(modelId: string) {
    const response = await api.get(`/predict/model/${modelId}/info`);
    return response.data;
  }

  // Get model summary
  async getModelSummary(modelId: string): Promise<ModelSummaryResponse> {
    const response = await api.get(`/summary/${modelId}`);
    return response.data;
  }

  // Get LLM-enhanced summary
  async getLLMEnhancedSummary(modelId: string) {
    const response = await api.get(`/summary/${modelId}/llm-enhanced`);
    return response.data;
  }

  // Get model insights
  async getModelInsights(modelId: string) {
    const response = await api.get(`/summary/${modelId}/insights`);
    return response.data;
  }

  // Cleanup session
  async cleanupSession(sessionId: string) {
    const response = await api.delete(`/upload/session/${sessionId}`);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export API instance for custom requests
export { api };

// Utility functions
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data.detail?.message || data.message || 'An error occurred',
      details: data.detail?.details || data.details,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error - please check your connection',
      details: 'No response from server',
    };
  } else {
    // Something else happened
    return {
      status: -1,
      message: error.message || 'An unexpected error occurred',
      details: error.toString(),
    };
  }
};

export default apiService;
