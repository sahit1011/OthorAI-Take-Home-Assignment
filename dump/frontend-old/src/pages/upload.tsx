/**
 * Upload page - Modern file upload with drag & drop
 */
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import ClientOnly from '../components/ClientOnly';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiService, handleApiError } from '../services/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const router = useRouter();
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);

    // Validate file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      setError('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Start upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Make real API call
      const result = await apiService.uploadFile(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success result
      setTimeout(() => {
        setUploadResult({
          filename: result.filename,
          size: result.file_size,
          rows: result.rows,
          columns: result.columns,
          session_id: result.session_id,
          upload_timestamp: result.upload_timestamp,
          data_schema: result.data_schema
        });
        setUploading(false);
        setUploadProgress(0);
        toast.success('File uploaded successfully!');
      }, 500);

    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      setUploading(false);
      setUploadProgress(0);
      toast.error(`Upload failed: ${errorInfo.message}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024
  });

  return (
    <>
      <Head>
        <title>Upload Dataset - Othor AI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeftIcon className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">Othor AI</h1>
                  <p className="text-purple-200 text-xs">Upload Dataset</p>
                </div>
              </div>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 px-6 py-12">
          <div className="max-w-4xl mx-auto">

            <ClientOnly>
              <AnimatePresence mode="wait">
                {!uploadResult ? (
                  /* Upload Interface */
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                  {/* Header */}
                  <div className="text-center mb-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Upload Your Dataset
                      </h1>
                      <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                        Drop your CSV file and let our AI analyze your data instantly
                      </p>
                    </motion.div>
                  </div>

                  {/* Upload Area */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <div
                      {...getRootProps()}
                      className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                        isDragActive && !isDragReject
                          ? 'border-purple-400 bg-purple-500/20 scale-105'
                          : isDragReject
                          ? 'border-red-400 bg-red-500/20'
                          : 'border-purple-400/50 bg-white/5 hover:bg-white/10 hover:border-purple-400'
                      }`}
                    >
                      <input {...getInputProps()} />

                      <ClientOnly>
                        <AnimatePresence mode="wait">
                          {uploading ? (
                          <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                          >
                            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <SparklesIcon className="w-10 h-10 text-white" />
                              </motion.div>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">Processing Your Data</h3>
                              <p className="text-purple-200 mb-4">Analyzing structure and quality...</p>

                              {/* Progress Bar */}
                              <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                                <motion.div
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                              <p className="text-purple-300 text-sm">{Math.round(uploadProgress)}% complete</p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="upload-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                            >
                              <CloudArrowUpIcon className="w-10 h-10 text-white" />
                            </motion.div>

                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">
                                {isDragActive
                                  ? isDragReject
                                    ? 'File type not supported'
                                    : 'Drop your CSV file here'
                                  : 'Drag & drop your CSV file'}
                              </h3>
                              <p className="text-purple-200 mb-4">
                                or click to browse files
                              </p>

                              <div className="inline-flex items-center px-6 py-3 bg-white/10 rounded-xl text-purple-200 text-sm">
                                <DocumentTextIcon className="w-4 h-4 mr-2" />
                                Supports CSV files up to 50MB
                              </div>
                            </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </ClientOnly>
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  <ClientOnly>
                    <AnimatePresence>
                      {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-8 p-4 bg-red-500/20 border border-red-400/50 rounded-2xl flex items-center"
                      >
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3" />
                          <span className="text-red-300">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </ClientOnly>

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid md:grid-cols-3 gap-6"
                  >
                    {[
                      { icon: CheckCircleIcon, title: 'Instant Analysis', desc: 'Get insights in seconds' },
                      { icon: SparklesIcon, title: 'AI-Powered', desc: 'Advanced ML algorithms' },
                      { icon: DocumentTextIcon, title: 'Secure Upload', desc: 'Your data stays private' }
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                      >
                        <feature.icon className="w-8 h-8 text-purple-400 mb-3" />
                        <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                        <p className="text-purple-200 text-sm">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                /* Success State */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  {/* Success Animation */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center"
                  >
                    <CheckCircleIcon className="w-12 h-12 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h1 className="text-4xl font-bold text-white mb-4">
                      Upload Successful! 🎉
                    </h1>
                    <p className="text-xl text-purple-200 mb-8">
                      Your dataset has been processed and is ready for analysis
                    </p>
                  </motion.div>

                  {/* File Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid md:grid-cols-2 gap-6 mb-8"
                  >
                    <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <h3 className="text-white font-semibold mb-4">File Information</h3>
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between">
                          <span className="text-purple-200">Filename:</span>
                          <span className="text-white font-medium">{uploadResult.filename}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-200">Size:</span>
                          <span className="text-white font-medium">
                            {(uploadResult.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-200">Session:</span>
                          <span className="text-white font-mono text-sm">
                            {uploadResult.session_id.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <h3 className="text-white font-semibold mb-4">Dataset Overview</h3>
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between">
                          <span className="text-purple-200">Rows:</span>
                          <span className="text-white font-medium">{uploadResult.rows.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-200">Columns:</span>
                          <span className="text-white font-medium">{uploadResult.columns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-200">Status:</span>
                          <span className="text-green-400 font-medium">✓ Ready</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Schema Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                  >
                    <h3 className="text-white font-semibold mb-4">Column Schema Preview</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {Object.entries(uploadResult.data_schema).map(([column, schema]: [string, any]) => (
                        <div key={column} className="p-4 bg-white/10 rounded-xl">
                          <div className="font-medium text-white mb-2 truncate">{column}</div>
                          <div className="text-sm space-y-1">
                            <div className="text-purple-200">Type: {schema.type}</div>
                            <div className="text-purple-200">Unique: {schema.unique_values}</div>
                            <div className="text-purple-200">Nulls: {schema.null_percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                  >
                    <Link
                      href={`/profile?session=${uploadResult.session_id}`}
                      className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                    >
                      <span className="flex items-center justify-center">
                        Continue to Data Profiling
                        <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>

                    <button
                      onClick={() => setUploadResult(null)}
                      className="px-8 py-4 border-2 border-purple-400 text-purple-300 rounded-2xl font-semibold hover:bg-purple-400 hover:text-white transition-all duration-300"
                    >
                      Upload Another File
                    </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ClientOnly>
          </div>
        </main>
      </div>
    </>
  );
}
