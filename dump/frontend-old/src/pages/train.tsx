/**
 * Model Training page - Interface for training ML models
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { apiService, handleApiError, TrainRequest } from '../services/api';
import ClientOnly from '../components/ClientOnly';
import toast from 'react-hot-toast';

interface TrainingState {
  isTraining: boolean;
  progress: number;
  currentStep: string;
  modelId?: string;
  results?: any;
}

export default function TrainPage() {
  const router = useRouter();
  const { session } = router.query;
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('random_forest');
  const [testSize, setTestSize] = useState<number>(0.2);
  const [trainingState, setTrainingState] = useState<TrainingState>({
    isTraining: false,
    progress: 0,
    currentStep: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const algorithms = [
    { value: 'random_forest', label: 'Random Forest', description: 'Robust ensemble method' },
    { value: 'logistic_regression', label: 'Logistic Regression', description: 'Linear classification' },
    { value: 'xgboost', label: 'XGBoost', description: 'Gradient boosting' },
    { value: 'svm', label: 'Support Vector Machine', description: 'Kernel-based method' }
  ];

  useEffect(() => {
    if (session && typeof session === 'string') {
      loadProfileData(session);
    }
  }, [session]);

  const loadProfileData = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDataProfile(sessionId);
      setProfileData(data);
      
      // Auto-select first numerical column as target
      const numericalColumns = Object.entries(data.column_profiles)
        .filter(([_, profile]: [string, any]) => profile.type === 'numerical')
        .map(([column, _]) => column);
      
      if (numericalColumns.length > 0) {
        setSelectedTarget(numericalColumns[0]);
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      toast.error(`Failed to load data: ${errorInfo.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startTraining = async () => {
    if (!selectedTarget || !session) {
      toast.error('Please select a target column');
      return;
    }

    try {
      setTrainingState({
        isTraining: true,
        progress: 0,
        currentStep: 'Preparing data...'
      });

      // Simulate training progress
      const progressSteps = [
        'Preparing data...',
        'Splitting dataset...',
        'Training model...',
        'Evaluating performance...',
        'Finalizing results...'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setTrainingState(prev => ({
          ...prev,
          progress: (i + 1) * 20,
          currentStep: progressSteps[i]
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const trainRequest: TrainRequest = {
        session_id: session as string,
        target_column: selectedTarget,
        algorithm: selectedAlgorithm,
        test_size: testSize,
        random_state: 42
      };

      const result = await apiService.trainModel(trainRequest);
      
      setTrainingState({
        isTraining: false,
        progress: 100,
        currentStep: 'Training completed!',
        modelId: result.model_id,
        results: result
      });

      toast.success('Model trained successfully!');
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      setTrainingState({
        isTraining: false,
        progress: 0,
        currentStep: ''
      });
      toast.error(`Training failed: ${errorInfo.message}`);
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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Training Interface</h2>
          <p className="text-purple-200">Preparing your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Training Setup Failed</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Link
            href={`/profile?session=${session}`}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all duration-300"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  const columnOptions = profileData ? Object.entries(profileData.column_profiles)
    .map(([column, profile]: [string, any]) => ({
      value: column,
      label: column,
      type: profile.type
    })) : [];

  return (
    <>
      <Head>
        <title>Train Model - Othor AI</title>
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
            <Link href={`/profile?session=${session}`} className="flex items-center space-x-3 group">
              <ArrowLeftIcon className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">Othor AI</h1>
                  <p className="text-purple-200 text-xs">Model Training</p>
                </div>
              </div>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {!trainingState.isTraining && !trainingState.results ? (
              /* Training Configuration */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Header */}
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Train Your Model
                  </h1>
                  <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                    Configure and train a machine learning model on your dataset
                  </p>
                </div>

                {/* Configuration Form */}
                <div className="space-y-8">
                  {/* Target Column Selection */}
                  <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Select Target Column</h3>
                    <p className="text-purple-200 mb-4">Choose the column you want to predict</p>
                    <select
                      value={selectedTarget}
                      onChange={(e) => setSelectedTarget(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select target column...</option>
                      {columnOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-slate-800">
                          {option.label} ({option.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Algorithm Selection */}
                  <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Choose Algorithm</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {algorithms.map(algo => (
                        <label
                          key={algo.value}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            selectedAlgorithm === algo.value
                              ? 'border-purple-400 bg-purple-500/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name="algorithm"
                            value={algo.value}
                            checked={selectedAlgorithm === algo.value}
                            onChange={(e) => setSelectedAlgorithm(e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-white font-semibold mb-1">{algo.label}</div>
                          <div className="text-purple-200 text-sm">{algo.description}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Training Parameters */}
                  <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Training Parameters</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Test Size: {Math.round(testSize * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.4"
                          step="0.05"
                          value={testSize}
                          onChange={(e) => setTestSize(parseFloat(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-sm text-purple-200 mt-1">
                          <span>10%</span>
                          <span>40%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Start Training Button */}
                  <div className="text-center">
                    <button
                      onClick={startTraining}
                      disabled={!selectedTarget}
                      className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center">
                        <CpuChipIcon className="w-5 h-5 mr-2" />
                        Start Training
                        <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : trainingState.isTraining ? (
              /* Training Progress */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <CpuChipIcon className="w-12 h-12 text-white" />
                  </motion.div>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Training in Progress</h1>
                <p className="text-xl text-purple-200 mb-8">{trainingState.currentStep}</p>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="w-full bg-white/20 rounded-full h-4 mb-2">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${trainingState.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-purple-300 text-sm">{trainingState.progress}% complete</p>
                </div>
              </motion.div>
            ) : (
              /* Training Results */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Training Complete! 🎉</h1>
                <p className="text-xl text-purple-200 mb-8">Your model has been successfully trained</p>

                {/* Results Summary */}
                {trainingState.results && (
                  <div className="max-w-2xl mx-auto mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Training Results</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div>
                        <span className="text-purple-200">Model ID:</span>
                        <div className="text-white font-mono text-sm">{trainingState.modelId}</div>
                      </div>
                      <div>
                        <span className="text-purple-200">Algorithm:</span>
                        <div className="text-white">{selectedAlgorithm}</div>
                      </div>
                      <div>
                        <span className="text-purple-200">Target Column:</span>
                        <div className="text-white">{selectedTarget}</div>
                      </div>
                      <div>
                        <span className="text-purple-200">Test Size:</span>
                        <div className="text-white">{Math.round(testSize * 100)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href={`/predict?model=${trainingState.modelId}`}
                    className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center">
                      Make Predictions
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      setTrainingState({ isTraining: false, progress: 0, currentStep: '' });
                      setSelectedTarget('');
                    }}
                    className="px-8 py-4 border-2 border-purple-400 text-purple-300 rounded-2xl font-semibold hover:bg-purple-400 hover:text-white transition-all duration-300"
                  >
                    Train Another Model
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
