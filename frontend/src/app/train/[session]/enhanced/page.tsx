"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  StarIcon,
  LightBulbIcon,
  RocketLaunchIcon
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

interface ModelRecommendation {
  model_name: string
  score: number
  reasons: string[]
  suitability_factors: Record<string, any>
  recommended_params: Record<string, any>
  model_info: {
    best_for: string
    complexity: string
    training_time: string
  }
}

interface TargetRecommendation {
  column: string
  score: number
  reasons: string[]
  problem_type: string
  suitability_score: number
}

export default function EnhancedTrainPage({ params }: { params: Promise<{ session: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [profileData, setProfileData] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [problemType, setProblemType] = useState<string>('auto')
  const [modelRecommendations, setModelRecommendations] = useState<ModelRecommendation[]>([])
  const [targetRecommendations, setTargetRecommendations] = useState<TargetRecommendation[]>([])
  const [intelligentAnalysis, setIntelligentAnalysis] = useState<any>(null)
  const [trainingState, setTrainingState] = useState<TrainingState>({
    isTraining: false,
    progress: 0,
    currentStep: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
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
    loadEnhancedData(resolvedParams.session)
  }, [resolvedParams.session])

  const loadEnhancedData = async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load profile data
      const profileData = await apiService.getDataProfile(sessionId)

      setProfileData({
        session_id: sessionId,
        column_profiles: profileData.column_profiles || {},
        dataset_info: profileData.dataset_info
      })

      // Load intelligent analysis
      try {
        const analysisData = await apiService.getIntelligentAnalysis(sessionId)
        setIntelligentAnalysis(analysisData.analysis)
      } catch (err) {
        console.warn('Intelligent analysis not available:', err)
      }

      // Load target recommendations
      try {
        const targetResponse = await apiService.getTargetRecommendations(sessionId)
        const targetData = targetResponse.target_recommendations?.recommended_targets || []

        // Ensure targetData is an array
        const targetRecs = Array.isArray(targetData) ? targetData : []
        setTargetRecommendations(targetRecs)

        // Auto-select best target
        if (targetRecs.length > 0) {
          setSelectedTarget(targetRecs[0].column)
        }
      } catch (err) {
        console.warn('Target recommendations not available:', err)
        setTargetRecommendations([]) // Ensure it's an empty array

        // Fallback to basic target detection
        const columns = Object.keys(profileData.column_profiles || {})
        const potentialTargets = columns.filter(col =>
          col.toLowerCase().includes('target') ||
          col.toLowerCase().includes('label') ||
          col.toLowerCase().includes('class')
        )
        if (potentialTargets.length > 0) {
          setSelectedTarget(potentialTargets[0])
        }
      }

      toast.success('Enhanced training interface loaded!')
    } catch (err: any) {
      console.error('Error loading enhanced data:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Failed to load enhanced training data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadModelRecommendations = async () => {
    if (!selectedTarget) return

    try {
      setLoadingRecommendations(true)
      const response = await axios.get(
        `${API_BASE_URL}/train/${resolvedParams.session}/model-recommendations?target_column=${selectedTarget}&problem_type=${problemType}`
      )

      const recommendations = response.data.model_recommendations || []
      // Ensure recommendations is an array
      const validRecommendations = Array.isArray(recommendations) ? recommendations : []
      setModelRecommendations(validRecommendations)

      // Auto-select best model
      if (validRecommendations.length > 0) {
        setSelectedModel(validRecommendations[0].model_name)
      }

      // Update problem type if auto-detected
      if (response.data.problem_type && response.data.problem_type !== 'auto') {
        setProblemType(response.data.problem_type)
      }

      toast.success(`Found ${validRecommendations.length} model recommendations!`)
    } catch (err: any) {
      console.error('Error loading model recommendations:', err)
      toast.error('Failed to load model recommendations')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  useEffect(() => {
    if (selectedTarget && !loadingRecommendations) {
      loadModelRecommendations()
    }
  }, [selectedTarget, problemType])

  const startEnhancedTraining = async () => {
    if (!selectedTarget || !selectedModel) {
      toast.error('Please select both target column and model')
      return
    }

    try {
      setTrainingState({
        isTraining: true,
        progress: 10,
        currentStep: 'Initializing enhanced training pipeline...'
      })

      const trainingRequest = {
        target_column: selectedTarget,
        model_name: selectedModel,
        problem_type: problemType === 'auto' ? undefined : problemType
      }

      setTrainingState(prev => ({
        ...prev,
        progress: 30,
        currentStep: 'Training with enhanced pipeline...'
      }))

      // Use enhanced training endpoint
      const result = await apiService.trainEnhancedModel(resolvedParams.session, trainingRequest)

      setTrainingState(prev => ({
        ...prev,
        progress: 90,
        currentStep: 'Finalizing enhanced results...'
      }))

      await new Promise(resolve => setTimeout(resolve, 1000))

      setTrainingState({
        isTraining: false,
        progress: 100,
        currentStep: 'Enhanced training completed!',
        modelId: result.model_id,
        results: result
      })

      toast.success('Enhanced model trained successfully!')

    } catch (err: any) {
      console.error('Enhanced training error:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Enhanced training failed. Please try again.'
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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Enhanced Training</h2>
          <p className="text-purple-200">Preparing intelligent recommendations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Enhanced Training Setup Failed</h2>
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
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {!trainingState.isTraining && !trainingState.results ? (
              /* Enhanced Training Configuration */
              <motion.div
                key="enhanced-config"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Header */}
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center mb-4">
                    <RocketLaunchIcon className="w-12 h-12 text-purple-400 mr-3" />
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                      Enhanced Training
                    </h1>
                  </div>
                  <p className="text-xl text-purple-200 max-w-3xl mx-auto">
                    Leverage AI-powered recommendations and intelligent analysis for optimal model performance
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Intelligent Analysis Summary */}
                  {intelligentAnalysis && (
                    <Card className="glass border-purple-400/50">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <LightBulbIcon className="w-5 h-5 mr-2" />
                          AI Dataset Analysis
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Intelligent insights about your dataset
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-semibold mb-3">Dataset Characteristics</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-purple-200">Complexity:</span>
                                <Badge variant="outline" className="border-purple-400 text-purple-300">
                                  {intelligentAnalysis.dataset_complexity || 'Medium'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Quality Score:</span>
                                <span className="text-green-400 font-semibold">
                                  {intelligentAnalysis.quality_score || 'Good'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold mb-3">Recommendations</h4>
                            <div className="space-y-1 text-sm">
                              {intelligentAnalysis.recommendations?.slice(0, 3).map((rec: string, idx: number) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <StarIcon className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-purple-200">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Smart Target Selection */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        Smart Target Selection
                        <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300 border-green-400">
                          AI Recommended
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        AI-powered target column recommendations based on dataset analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Array.isArray(targetRecommendations) && targetRecommendations.length > 0 ? (
                          targetRecommendations.slice(0, 3).map((target, idx) => (
                            <label
                              key={target.column}
                              className={cn(
                                "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                                selectedTarget === target.column
                                  ? "border-purple-400 bg-purple-500/20"
                                  : "border-white/20 bg-white/5 hover:bg-white/10"
                              )}
                            >
                              <input
                                type="radio"
                                name="target"
                                value={target.column}
                                checked={selectedTarget === target.column}
                                onChange={(e) => setSelectedTarget(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="text-white font-semibold">{target.column}</div>
                                  <Badge variant="outline" className="border-blue-400 text-blue-300">
                                    {target.problem_type}
                                  </Badge>
                                  <div className="flex items-center space-x-1">
                                    <StarIcon className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-400 font-semibold">{target.score}</span>
                                  </div>
                                </div>
                                <div className="text-purple-200 text-sm">
                                  {target.reasons.slice(0, 2).join(' • ')}
                                </div>
                              </div>
                              {selectedTarget === target.column && (
                                <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                              )}
                            </label>
                          ))
                        ) : (
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
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Model Recommendations */}
                  {selectedTarget && (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <CpuChipIcon className="w-5 h-5 mr-2" />
                          AI Model Recommendations
                          <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-300 border-blue-400">
                            Intelligent Selection
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Optimized model suggestions based on your data characteristics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingRecommendations ? (
                          <div className="text-center py-8">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-8 h-8 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center"
                            >
                              <SparklesIcon className="w-4 h-4 text-white" />
                            </motion.div>
                            <p className="text-purple-200">Analyzing your data for optimal model recommendations...</p>
                          </div>
                        ) : Array.isArray(modelRecommendations) && modelRecommendations.length > 0 ? (
                          <div className="space-y-4">
                            {modelRecommendations.slice(0, 4).map((model, idx) => (
                              <label
                                key={model.model_name}
                                className={cn(
                                  "block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover-lift",
                                  selectedModel === model.model_name
                                    ? "border-purple-400 bg-purple-500/20"
                                    : "border-white/20 bg-white/5 hover:bg-white/10"
                                )}
                              >
                                <input
                                  type="radio"
                                  name="model"
                                  value={model.model_name}
                                  checked={selectedModel === model.model_name}
                                  onChange={(e) => setSelectedModel(e.target.value)}
                                  className="sr-only"
                                />
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <div className="text-white font-semibold capitalize">
                                        {model.model_name.replace(/_/g, ' ')}
                                      </div>
                                      {idx === 0 && (
                                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-400">
                                          <StarIcon className="w-3 h-3 mr-1" />
                                          Best Match
                                        </Badge>
                                      )}
                                      <div className="flex items-center space-x-1">
                                        <span className="text-green-400 font-bold">{model.score}</span>
                                        <span className="text-purple-200 text-sm">score</span>
                                      </div>
                                    </div>
                                    <div className="text-purple-200 text-sm mb-3">
                                      {model.model_info.best_for}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <Badge variant="outline" className="border-green-400 text-green-300 text-xs">
                                        {model.model_info.complexity} complexity
                                      </Badge>
                                      <Badge variant="outline" className="border-blue-400 text-blue-300 text-xs">
                                        {model.model_info.training_time} training
                                      </Badge>
                                    </div>
                                    <div className="text-purple-300 text-xs">
                                      <strong>Why recommended:</strong> {model.reasons.slice(0, 2).join(' • ')}
                                    </div>
                                  </div>
                                  {selectedModel === model.model_name && (
                                    <CheckCircleIcon className="w-5 h-5 text-purple-400 ml-4" />
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CpuChipIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            <p className="text-purple-200">Select a target column to see model recommendations</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Problem Type Detection */}
                  {selectedTarget && (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Cog6ToothIcon className="w-5 h-5 mr-2" />
                          Problem Type Detection
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Automatically detected based on target column analysis
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-200">Detected Type:</span>
                            <Badge variant="outline" className="border-purple-400 text-purple-300 capitalize">
                              {problemType === 'auto' ? 'Auto-detecting...' : problemType}
                            </Badge>
                          </div>
                          {problemType !== 'auto' && (
                            <div className="flex items-center space-x-2">
                              <CheckCircleIcon className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm">Automatically optimized</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Training Button */}
                  <div className="text-center">
                    <Button
                      onClick={startEnhancedTraining}
                      disabled={!selectedTarget || !selectedModel || loadingRecommendations}
                      size="xl"
                      className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <RocketLaunchIcon className="w-5 h-5 mr-2" />
                      Start Enhanced Training
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-purple-300 text-sm mt-2">
                      Powered by intelligent model selection and optimization
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : trainingState.isTraining ? (
              /* Enhanced Training Progress */
              <motion.div
                key="enhanced-training"
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
                    <RocketLaunchIcon className="w-12 h-12 text-white" />
                  </motion.div>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Enhanced Training in Progress</h1>
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

                {/* Enhanced Training Info */}
                <Card className="max-w-md mx-auto glass">
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-200">Model:</span>
                        <span className="text-white capitalize">{selectedModel?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Target:</span>
                        <span className="text-white">{selectedTarget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Type:</span>
                        <span className="text-white capitalize">{problemType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Pipeline:</span>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">Enhanced</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* Enhanced Training Results */
              <motion.div
                key="enhanced-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">Enhanced Training Complete! 🚀</h1>
                <p className="text-xl text-purple-200 mb-8">
                  Your model has been trained with our enhanced pipeline and intelligent optimizations
                </p>

                {/* Enhanced Results Summary */}
                {trainingState.results && (
                  <div className="space-y-6 mb-8">
                    {/* Main Metrics Card */}
                    <Card className="max-w-5xl mx-auto glass">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <ChartBarIcon className="w-5 h-5 mr-2" />
                          Enhanced Training Results & Performance
                          <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300 border-green-400">
                            Optimized
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Comprehensive evaluation metrics from your enhanced training pipeline
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Model Info */}
                          <div className="space-y-4">
                            <h4 className="text-white font-semibold mb-3">Enhanced Model Info</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-purple-200">Model ID:</span>
                                <span className="text-white font-mono text-xs">{trainingState.modelId?.slice(-8)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Algorithm:</span>
                                <span className="text-white capitalize">{selectedModel?.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Target:</span>
                                <span className="text-white">{selectedTarget}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-200">Pipeline:</span>
                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">Enhanced</Badge>
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

                          {/* Enhanced Features */}
                          <div className="space-y-4">
                            <h4 className="text-white font-semibold mb-3">Enhanced Features</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm">AI Model Selection</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm">Intelligent Preprocessing</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm">Auto Hyperparameters</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm">Enhanced Validation</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Summary Generation */}
                    <Card className="max-w-5xl mx-auto glass border-purple-400/50">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <SparklesIcon className="w-5 h-5 mr-2" />
                          AI Enhanced Training Summary
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Get AI-powered insights about your enhanced model's performance and recommendations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <Button
                            onClick={async () => {
                              const loadingToast = toast.loading('Generating enhanced training summary...')
                              try {
                                const response = await axios.get(`${API_BASE_URL}/summary/${trainingState.modelId}`)
                                const data = response.data

                                setSummaryModal({
                                  isOpen: true,
                                  title: 'Enhanced Model Training Summary',
                                  summary: data.summary,
                                  insights: data.insights?.recommendations || [],
                                  type: 'model'
                                })

                                toast.dismiss(loadingToast)
                                toast.success('Enhanced training summary generated!')
                              } catch (err: any) {
                                console.error('Summary generation error:', err)
                                const errorMessage = err.response?.data?.detail?.message || 'Failed to generate enhanced training summary'
                                toast.dismiss(loadingToast)
                                toast.error(errorMessage)
                              }
                            }}
                            size="lg"
                            className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <SparklesIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Generate Enhanced Summary
                          </Button>
                          <p className="text-purple-300 text-sm mt-2">
                            Powered by OpenRouter + DeepSeek with enhanced insights
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="xl" className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
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

                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => {
                      setTrainingState({ isTraining: false, progress: 0, currentStep: '' })
                      setSelectedTarget('')
                      setSelectedModel('')
                      setModelRecommendations([])
                    }}
                    className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
                  >
                    Train Another Enhanced Model
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