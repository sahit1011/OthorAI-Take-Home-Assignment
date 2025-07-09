/**
 * File upload component with drag & drop functionality
 */
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiService, handleApiError, UploadResponse } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import Card from '../UI/Card';

interface FileUploadProps {
  onUploadSuccess: (response: UploadResponse) => void;
  onUploadError: (error: any) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onUploadError({
        message: 'Please upload a CSV file',
        details: 'Only .csv files are supported'
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      onUploadError({
        message: 'File too large',
        details: 'Maximum file size is 50MB'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        onUploadSuccess(response);
      }, 500);

    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      onUploadError(handleApiError(error));
    }
  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <Card title="Upload CSV File" subtitle="Upload your dataset to begin analysis">
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive && !isDragReject
              ? 'border-blue-400 bg-blue-50'
              : isDragReject
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <LoadingSpinner size="lg" />
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📁</div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? isDragReject
                      ? 'File type not supported'
                      : 'Drop your CSV file here'
                    : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  or click to browse files
                </p>
              </div>
            </div>
          )}
        </div>

        {/* File Requirements */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">File Requirements:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              CSV format only (.csv)
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Maximum size: 50MB
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Must include column headers
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Supports numerical and categorical data
            </li>
          </ul>
        </div>

        {/* Sample Data Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Sample Data Available</h4>
          <p className="text-sm text-blue-800">
            Don't have a CSV file? You can use our sample classification dataset to test the system.
          </p>
          <button
            onClick={() => {
              // Create a sample CSV file
              const sampleData = `age,income,education,experience,target
25,35000,Bachelor,2,0
30,45000,Master,5,1
35,55000,Bachelor,8,1
28,40000,PhD,3,0
45,75000,Master,15,1`;
              
              const blob = new Blob([sampleData], { type: 'text/csv' });
              const file = new File([blob], 'sample_data.csv', { type: 'text/csv' });
              onDrop([file]);
            }}
            className="mt-2 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
          >
            Use Sample Data
          </button>
        </div>
      </div>
    </Card>
  );
}
