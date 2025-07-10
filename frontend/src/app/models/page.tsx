"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeftIcon,
  CpuChipIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  SparklesIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { apiService } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"

interface ModelInfo {
  model_id: string
  algorithm: string
  problem_type: string
  target_column: string
  session_id: string
  created_timestamp: string
  feature_count: number
}

function ModelsPageContent() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiService.getAvailableModels()
      
      setModels(data.models || [])
      toast.success(`Found ${data.count} trained models`)
    } catch (err: any) {
      console.error('Error loading models:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Failed to load models'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm.toLowerCase()) {
      case 'random_forest': return '🌳'
      case 'xgboost': return '🚀'
      case 'logistic_regression': return '📈'
      case 'svm': return '🎯'
      case 'ridge_regression': return '📊'
      case 'linear_regression': return '📉'
      default: return '🤖'
    }
  }

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm.toLowerCase()) {
      case 'random_forest': return 'from-green-500 to-emerald-500'
      case 'xgboost': return 'from-blue-500 to-cyan-500'
      case 'logistic_regression': return 'from-purple-500 to-pink-500'
      case 'svm': return 'from-orange-500 to-red-500'
      case 'ridge_regression': return 'from-indigo-500 to-purple-500'
      case 'linear_regression': return 'from-gray-500 to-slate-500'
      default: return 'from-gray-500 to-gray-600'
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
            <CpuChipIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Models</h2>
          <p className="text-purple-200">Fetching your trained models...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <CpuChipIcon className="w-12 h-12 text-purple-400 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Your Models
              </h1>
            </div>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Manage and explore all your trained machine learning models
            </p>
          </div>

          {error ? (
            <div className="text-center">
              <Card className="glass border-red-400/50 max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="text-red-400 mb-4">⚠️ Error Loading Models</div>
                  <p className="text-red-300 mb-4">{error}</p>
                  <Button onClick={loadModels} variant="outline" className="border-red-400 text-red-300 hover:bg-red-400 hover:text-white">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center">
              <Card className="glass max-w-md mx-auto">
                <CardContent className="p-8">
                  <RocketLaunchIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Models Yet</h3>
                  <p className="text-purple-200 mb-6">
                    Start by uploading a dataset and training your first model
                  </p>
                  <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Link href="/upload">
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model, index) => (
                <motion.div
                  key={model.model_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass hover-lift h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getAlgorithmColor(model.algorithm)} flex items-center justify-center text-xl mb-3`}>
                          {getAlgorithmIcon(model.algorithm)}
                        </div>
                        <Badge variant="outline" className="border-purple-400 text-purple-300 capitalize">
                          {model.problem_type}
                        </Badge>
                      </div>
                      <CardTitle className="text-white capitalize">
                        {model.algorithm.replace(/_/g, ' ')}
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Target: {model.target_column}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200">Features:</span>
                          <span className="text-white">{model.feature_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200">Model ID:</span>
                          <span className="text-white font-mono text-xs">{model.model_id.slice(-8)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200">Created:</span>
                          <span className="text-white text-xs">
                            {model.created_timestamp ? formatDistanceToNow(new Date(model.created_timestamp), { addSuffix: true }) : 'Unknown'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" className="group">
                          <Link href={`/predict/${model.model_id}`}>
                            <ChartBarIcon className="w-4 h-4 mr-2" />
                            Make Predictions
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white">
                          <Link href={`/summary/${model.model_id}`}>
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            View Summary
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ModelsPage() {
  return (
    <ProtectedRoute>
      <ModelsPageContent />
    </ProtectedRoute>
  )
}
