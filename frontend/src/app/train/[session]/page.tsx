"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SummaryModal } from "@/components/SummaryModal"
import { apiService } from "@/lib/api"

interface TrainingState {
  isTraining: boolean
  progress: number
  currentStep: string
  modelId?: string
  results?: any
}

interface Algorithm {
  value: string
  label: string
  description: string
  icon: string
  color: string
}

const algorithms: Algorithm[] = [
  { 
    value: 'random_forest', 
    label: 'Random Forest', 
    description: 'Robust ensemble method with high accuracy',
    icon: '🌳',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    value: 'xgboost', 
    label: 'XGBoost', 
    description: 'Gradient boosting for superior performance',
    icon: '🚀',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    value: 'logistic_regression', 
    label: 'Logistic Regression', 
    description: 'Fast linear classification method',
    icon: '📈',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    value: 'svm', 
    label: 'Support Vector Machine', 
    description: 'Powerful kernel-based classifier',
    icon: '🎯',
    color: 'from-orange-500 to-red-500'
  }
]

export default function TrainPage({ params }: { params: Promise<{ session: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [profileData, setProfileData] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('random_forest')
  const [testSize, setTestSize] = useState<number>(0.2)
  const [randomState, setRandomState] = useState<number>(42)
  const [trainingState, setTrainingState] = useState<TrainingState>({
    isTraining: false,
    progress: 0,
    currentStep: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaryModal, setSummaryModal] = useState<{
    isOpen: boolean
    title: string
    summary: string
    insights: string[]
    type: 'dataset' | 'model'
  }>({
    isOpen: false,
    title: '',
    summary: '',
    insights: [],
    type: 'model'
  })

  useEffect(() => {
    loadProfileData(resolvedParams.session)
  }, [resolvedParams.session])

  const loadProfileData = async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Load profile data from backend API
      const data = await apiService.getDataProfile(sessionId)

      // Transform data for training interface
      const transformedData = {
        session_id: sessionId,
        column_profiles: data.column_profiles || {},
        dataset_info: data.dataset_info
      }

      setProfileData(transformedData)

      // Auto-detect target column
      const columns = Object.keys(data.column_profiles || {})
      const potentialTargets = columns.filter(col =>
        col.toLowerCase().includes('target') ||
        col.toLowerCase().includes('label') ||
        col.toLowerCase().includes('class') ||
        col.toLowerCase().includes('outcome') ||
        col.toLowerCase().includes('result')
      )

      // If no obvious target, suggest categorical columns with reasonable cardinality
      if (potentialTargets.length === 0) {
        const suitableTargets = Object.entries(data.column_profiles || {})
          .filter(([_, profile]: [string, any]) =>
            profile.type === 'categorical' &&
            profile.unique_values > 1 &&
            profile.unique_values <= 20
          )
          .map(([column, _]) => column)

        if (suitableTargets.length > 0) {
          setSelectedTarget(suitableTargets[0])
        }
      } else {
        setSelectedTarget(potentialTargets[0])
      }

      toast.success('Training interface loaded!')
    } catch (err: any) {
      console.error('Error loading profile data:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Failed to load training data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const startTraining = async () => {
    if (!selectedTarget) {
      toast.error('Please select a target column')
      return
    }

    try {
      setTrainingState({
        isTraining: true,
        progress: 10,
        currentStep: 'Preparing data...'
      })

      // Prepare training request
      const trainingRequest = {
        session_id: resolvedParams.session,
        target_column: selectedTarget,
        algorithm: selectedAlgorithm,
        model_type: 'auto', // Let backend auto-detect classification vs regression
        test_size: testSize,
        random_state: randomState
      }

      setTrainingState(prev => ({
        ...prev,
        progress: 30,
        currentStep: 'Training model...'
      }))

      // Call backend training API
      const result = await apiService.trainModel(trainingRequest)

      setTrainingState(prev => ({
        ...prev,
        progress: 90,
        currentStep: 'Finalizing results...'
      }))

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Training result received:', result)
      console.log('Evaluation metrics:', result.evaluation_metrics)
      console.log('Training info:', result.training_info)

      setTrainingState({
        isTraining: false,
        progress: 100,
        currentStep: 'Training completed!',
        modelId: result.model_id,
        results: result  // Store the full result object, not just evaluation_metrics
      })

      toast.success('Model trained successfully!')

      // Don't auto-redirect, let user choose next action

    } catch (err: any) {
      console.error('Training error:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Training failed. Please try again.'
      setError(errorMessage)
      setTrainingState({
        isTraining: false,
        progress: 0,
        currentStep: ''
      })
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Training Setup Failed</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Button asChild>
            <Link href={`/profile/${resolvedParams.session}`}>Back to Profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  const columnOptions = profileData ? Object.entries(profileData.column_profiles)
    .map(([column, profile]: [string, any]) => ({
      value: column,
      label: column,
      type: profile.type,
      unique_values: profile.unique_values
    })) : []

  return (
    <div className="min-h-screen pt-20">
      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {!trainingState.isTraining && !trainingState.results ? (
              /* Training Configuration */
              <motion.div
                key="config"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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

                <div className="space-y-8">
                  {/* Target Column Selection */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        Select Target Column
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Choose the column you want to predict
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {columnOptions.map(option => (
                          <label
                            key={option.value}
                            className={cn(
                              "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                              selectedTarget === option.value
                                ? "border-purple-400 bg-purple-500/20"
                                : "border-white/20 bg-white/5 hover:bg-white/10"
                            )}
                          >
                            <input
                              type="radio"
                              name="target"
                              value={option.value}
                              checked={selectedTarget === option.value}
                              onChange={(e) => setSelectedTarget(e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <div className="text-white font-semibold">{option.label}</div>
                              <div className="text-purple-200 text-sm">
                                {option.type} • {option.unique_values} unique values
                              </div>
                            </div>
                            {selectedTarget === option.value && (
                              <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                            )}
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Algorithm Selection */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <CpuChipIcon className="w-5 h-5 mr-2" />
                        Choose Algorithm
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Select the machine learning algorithm for training
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {algorithms.map(algo => (
                          <label
                            key={algo.value}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover-lift",
                              selectedAlgorithm === algo.value
                                ? "border-purple-400 bg-purple-500/20"
                                : "border-white/20 bg-white/5 hover:bg-white/10"
                            )}
                          >
                            <input
                              type="radio"
                              name="algorithm"
                              value={algo.value}
                              checked={selectedAlgorithm === algo.value}
                              onChange={(e) => setSelectedAlgorithm(e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${algo.color} flex items-center justify-center text-lg`}>
                                {algo.icon}
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-semibold mb-1">{algo.label}</div>
                                <div className="text-purple-200 text-sm">{algo.description}</div>
                              </div>
                              {selectedAlgorithm === algo.value && (
                                <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Training Parameters */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Cog6ToothIcon className="w-5 h-5 mr-2" />
                        Training Parameters
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Fine-tune your model training settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
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
                        <div>
                          <label className="block text-white font-medium mb-2">
                            Random State
                          </label>
                          <Input
                            type="number"
                            value={randomState}
                            onChange={(e) => setRandomState(parseInt(e.target.value))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <p className="text-purple-200 text-xs mt-1">For reproducible results</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Start Training Button */}
                  <div className="text-center">
                    <Button
                      onClick={startTraining}
                      disabled={!selectedTarget}
                      size="xl"
                      className="group"
                    >
                      <CpuChipIcon className="w-5 h-5 mr-2" />
                      Start Training
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : trainingState.isTraining ? (
              /* Training Progress */
              <motion.div
                key="training"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
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
                  <Progress 
                    value={trainingState.progress} 
                    variant="gradient" 
                    className="h-4 mb-2"
                  />
                  <p className="text-purple-300 text-sm">{trainingState.progress}% complete</p>
                </div>

                {/* Training Info */}
                <Card className="max-w-md mx-auto glass">
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-200">Algorithm:</span>
                        <span className="text-white">{algorithms.find(a => a.value === selectedAlgorithm)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Target:</span>
                        <span className="text-white">{selectedTarget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Test Size:</span>
                        <span className="text-white">{Math.round(testSize * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* Training Results */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Training Complete! 🎉</h1>
                <p className="text-xl text-purple-200 mb-8">Your model has been successfully trained and is ready for predictions</p>

                {/* Results Summary */}
                {trainingState.results && (
                  <div className="space-y-6 mb-8">
                    {/* Main Metrics Card */}
                    <Card className="max-w-4xl mx-auto glass">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <ChartBarIcon className="w-5 h-5 mr-2" />
                          Training Results & Performance
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Comprehensive evaluation metrics for your trained model
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Model Info */}
                          <div className="space-y-4">
                            <h4 className="text-white font-semibold mb-3">Model Information</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-purple-200">Model ID:</span>
                                <span className="text-white font-mono text-xs">{trainingState.modelId?.slice(-8)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Algorithm:</span>
                                <span className="text-white">{algorithms.find(a => a.value === selectedAlgorithm)?.label}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Target:</span>
                                <span className="text-white">{selectedTarget}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Test Size:</span>
                                <span className="text-white">{Math.round(testSize * 100)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="space-y-4">
                            <h4 className="text-white font-semibold mb-3">Performance Metrics</h4>
                            <div className="space-y-2">
                              {/* Classification Metrics */}
                              {trainingState.results.model_type === 'classification' ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">Accuracy:</span>
                                    <span className="text-green-400 font-bold">
                                      {trainingState.results.evaluation_metrics?.accuracy
                                        ? (trainingState.results.evaluation_metrics.accuracy * 100).toFixed(1) + '%'
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">Precision:</span>
                                    <span className="text-blue-400 font-semibold">
                                      {trainingState.results.evaluation_metrics?.precision
                                        ? (trainingState.results.evaluation_metrics.precision * 100).toFixed(1) + '%'
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">Recall:</span>
                                    <span className="text-cyan-400 font-semibold">
                                      {trainingState.results.evaluation_metrics?.recall
                                        ? (trainingState.results.evaluation_metrics.recall * 100).toFixed(1) + '%'
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">F1-Score:</span>
                                    <span className="text-purple-400 font-semibold">
                                      {trainingState.results.evaluation_metrics?.f1_score
                                        ? (trainingState.results.evaluation_metrics.f1_score * 100).toFixed(1) + '%'
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                /* Regression Metrics */
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">R² Score:</span>
                                    <span className="text-green-400 font-bold">
                                      {trainingState.results.evaluation_metrics?.r2_score
                                        ? trainingState.results.evaluation_metrics.r2_score.toFixed(3)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">RMSE:</span>
                                    <span className="text-blue-400 font-semibold">
                                      {trainingState.results.evaluation_metrics?.rmse
                                        ? trainingState.results.evaluation_metrics.rmse.toFixed(3)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-200">MAE:</span>
                                    <span className="text-cyan-400 font-semibold">
                                      {trainingState.results.evaluation_metrics?.mae
                                        ? trainingState.results.evaluation_metrics.mae.toFixed(3)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Training Details */}
                          <div className="space-y-4">
                            <h4 className="text-white font-semibold mb-3">Training Details</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-purple-200">Training Time:</span>
                                <span className="text-white">{'< 1s'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Training Samples:</span>
                                <span className="text-white">
                                  {trainingState.results.training_info?.training_samples || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Test Samples:</span>
                                <span className="text-white">
                                  {trainingState.results.training_info?.test_samples || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Features Used:</span>
                                <span className="text-white">
                                  {trainingState.results.training_info?.features_count || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Summary Generation */}
                    <Card className="max-w-4xl mx-auto glass border-purple-400/50">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <SparklesIcon className="w-5 h-5 mr-2" />
                          AI Training Summary
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Get AI-powered insights about your model's performance and recommendations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <Button
                            onClick={async () => {
                              const loadingToast = toast.loading('Generating training summary...')
                              try {
                                const data = await apiService.getModelSummary(trainingState.modelId!)

                                setSummaryModal({
                                  isOpen: true,
                                  title: 'Model Training Summary',
                                  summary: data.summary,
                                  insights: data.insights?.recommendations || [],
                                  type: 'model'
                                })

                                toast.dismiss(loadingToast)
                                toast.success('Training summary generated!')
                              } catch (err: any) {
                                console.error('Summary generation error:', err)
                                const errorMessage = err.response?.data?.detail?.message || 'Failed to generate training summary'
                                toast.dismiss(loadingToast)
                                toast.error(errorMessage)
                              }
                            }}
                            size="lg"
                            className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <SparklesIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Generate Training Summary
                          </Button>
                          <p className="text-purple-300 text-sm mt-2">
                            Powered by OpenRouter + DeepSeek
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="xl" className="group">
                    <Link href={`/predict/${trainingState.modelId}`}>
                      Start Making Predictions
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>

                  <Button asChild size="xl" variant="outline" className="group border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white">
                    <Link href={`/summary/${trainingState.modelId}`}>
                      View Detailed Summary
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>

                  <Button asChild size="xl" variant="outline" className="group border-green-400 text-green-300 hover:bg-green-400 hover:text-white">
                    <Link href="/history">
                      View Training History
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => {
                      setTrainingState({ isTraining: false, progress: 0, currentStep: '' })
                      setSelectedTarget('')
                    }}
                    className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
                  >
                    Train Another Model
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal(prev => ({ ...prev, isOpen: false }))}
        title={summaryModal.title}
        summary={summaryModal.summary}
        insights={summaryModal.insights}
        type={summaryModal.type}
      />
    </div>
  )
}
