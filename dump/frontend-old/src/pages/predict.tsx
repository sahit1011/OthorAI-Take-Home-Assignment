/**
 * Prediction page - Interface for making predictions with trained models
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { apiService, handleApiError, PredictRequest } from '../services/api';
import ClientOnly from '../components/ClientOnly';
import toast from 'react-hot-toast';

interface PredictionInput {
  [key: string]: string | number;
}

interface PredictionResult {
  prediction: any;
  confidence: number;
  probabilities?: Record<string, number>;
}

export default function PredictPage() {
  const router = useRouter();
  const { model } = router.query;
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [inputData, setInputData] = useState<PredictionInput[]>([{}]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model && typeof model === 'string') {
      loadModelInfo(model);
    }
  }, [model]);

  const loadModelInfo = async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);
      const info = await apiService.getModelInfo(modelId);
      setModelInfo(info);
      
      // Initialize input data with model features
      if (info.features) {
        const initialInput: PredictionInput = {};
        info.features.forEach((feature: string) => {
          initialInput[feature] = '';
        });
        setInputData([initialInput]);
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      toast.error(`Failed to load model: ${errorInfo.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addInputRow = () => {
    if (modelInfo?.features) {
      const newInput: PredictionInput = {};
      modelInfo.features.forEach((feature: string) => {
        newInput[feature] = '';
      });
      setInputData([...inputData, newInput]);
    }
  };

  const removeInputRow = (index: number) => {
    if (inputData.length > 1) {
      const newInputData = inputData.filter((_, i) => i !== index);
      setInputData(newInputData);
    }
  };

  const updateInputValue = (rowIndex: number, feature: string, value: string) => {
    const newInputData = [...inputData];
    newInputData[rowIndex][feature] = value;
    setInputData(newInputData);
  };

  const makePredictions = async () => {
    if (!model || inputData.length === 0) {
      toast.error('No input data provided');
      return;
    }

    // Validate input data
    const validData = inputData.filter(row => 
      Object.values(row).some(value => value !== '')
    );

    if (validData.length === 0) {
      toast.error('Please provide at least one complete row of data');
      return;
    }

    try {
      setPredicting(true);
      const request: PredictRequest = {
        model_id: model as string,
        data: validData.map(row => {
          const processedRow: Record<string, any> = {};
          Object.entries(row).forEach(([key, value]) => {
            // Try to convert to number if possible
            const numValue = parseFloat(value as string);
            processedRow[key] = isNaN(numValue) ? value : numValue;
          });
          return processedRow;
        })
      };

      const result = await apiService.makePredictions(request);
      setPredictions(result.predictions);
      toast.success('Predictions generated successfully!');
    } catch (err) {
      const errorInfo = handleApiError(err);
      toast.error(`Prediction failed: ${errorInfo.message}`);
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
          >
            <SparklesIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Model</h2>
          <p className="text-purple-200">Preparing prediction interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Model Load Failed</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Link
            href="/upload"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all duration-300"
          >
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Make Predictions - Othor AI</title>
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
            <Link href="/upload" className="flex items-center space-x-3 group">
              <ArrowLeftIcon className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">Othor AI</h1>
                  <p className="text-purple-200 text-xs">Make Predictions</p>
                </div>
              </div>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Make Predictions
                </h1>
                <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                  Use your trained model to make predictions on new data
                </p>
              </motion.div>
            </div>

            {/* Model Info */}
            {modelInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
              >
                <h3 className="text-xl font-bold text-white mb-4">Model Information</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-purple-200">Model ID:</span>
                    <div className="text-white font-mono text-xs">{model}</div>
                  </div>
                  <div>
                    <span className="text-purple-200">Algorithm:</span>
                    <div className="text-white">{modelInfo.algorithm || 'Unknown'}</div>
                  </div>
                  <div>
                    <span className="text-purple-200">Features:</span>
                    <div className="text-white">{modelInfo.features?.length || 0} columns</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Input Data Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Input Data</h3>
                <button
                  onClick={addInputRow}
                  className="flex items-center px-4 py-2 bg-purple-500/20 border border-purple-400/50 rounded-xl text-purple-300 hover:bg-purple-500/30 transition-all duration-300"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Row
                </button>
              </div>

              <div className="space-y-4">
                {inputData.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">Row {rowIndex + 1}</span>
                      {inputData.length > 1 && (
                        <button
                          onClick={() => removeInputRow(rowIndex)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {modelInfo?.features?.map((feature: string) => (
                        <div key={feature}>
                          <label className="block text-purple-200 text-sm mb-2">
                            {feature}
                          </label>
                          <input
                            type="text"
                            value={row[feature] || ''}
                            onChange={(e) => updateInputValue(rowIndex, feature, e.target.value)}
                            placeholder={`Enter ${feature}`}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Predict Button */}
              <div className="text-center mt-8">
                <button
                  onClick={makePredictions}
                  disabled={predicting}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center">
                    {predicting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 mr-2"
                        >
                          <SparklesIcon className="w-5 h-5" />
                        </motion.div>
                        Predicting...
                      </>
                    ) : (
                      <>
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        Generate Predictions
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Predictions Results */}
            {predictions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Prediction Results</h3>
                
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Prediction {index + 1}</span>
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 text-sm">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-2xl font-bold text-white mb-2">
                        {prediction.prediction}
                      </div>

                      {prediction.probabilities && (
                        <div className="space-y-2">
                          <span className="text-purple-200 text-sm">Class Probabilities:</span>
                          {Object.entries(prediction.probabilities).map(([className, prob]) => (
                            <div key={className} className="flex items-center justify-between">
                              <span className="text-purple-200">{className}</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-white/20 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                    style={{ width: `${prob * 100}%` }}
                                  />
                                </div>
                                <span className="text-white text-sm">{Math.round(prob * 100)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
