"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  ArrowLeftIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CpuChipIcon,
  EyeIcon
} from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

interface ModelSummaryData {
  model_id: string
  dataset_summary: {
    total_rows: number
    total_columns: number
    missing_values: number
    duplicate_rows: number
    data_quality_score: number
  }
  model_summary: {
    algorithm: string
    problem_type: string
    target_column: string
    feature_count: number
    training_date: string
    model_file_size: string
    evaluation_metrics: Record<string, number>
  }
  insights: {
    model_insights: string[]
    data_insights: string[]
    performance_insights: string[]
    recommendations: string[]
  }
  natural_language_summary: string
  timestamp: string
}

interface LLMEnhancedSummary {
  model_id: string
  llm_enhanced_summaries: {
    dataset_summary: string
    model_summary: string
    combined_summary: string
  }
  llm_insights: {
    key_findings: string[]
    business_insights: string[]
    recommendations: string[]
    next_steps: string[]
  }
  technical_details: {
    algorithm: string
    problem_type: string
    feature_count: number
    target_column: string
    dataset_shape: number[]
    data_quality_score: number
  }
  api_info: {
    llm_model: string
    api_provider: string
    generation_timestamp: string
  }
}

export default function SummaryPage({ params }: { params: Promise<{ model: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [summaryData, setSummaryData] = useState<ModelSummaryData | null>(null)
  const [llmSummary, setLlmSummary] = useState<LLMEnhancedSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [llmLoading, setLlmLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLLMSummary, setShowLLMSummary] = useState(false)

  useEffect(() => {
    loadSummaryData(resolvedParams.model)
  }, [resolvedParams.model])

  const loadSummaryData = async (modelId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load basic summary first
      const data = await apiService.getModelSummary(modelId)
      setSummaryData(data)
      toast.success('Model summary loaded successfully!')
    } catch (err: any) {
      console.error('Error loading summary:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Failed to load model summary'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadLLMSummary = async () => {
    try {
      setLlmLoading(true)
      const data = await apiService.getLLMEnhancedSummary(resolvedParams.model)
      setLlmSummary(data)
      setShowLLMSummary(true)
      toast.success('AI-enhanced summary generated!')
    } catch (err: any) {
      console.error('Error loading LLM summary:', err)
      toast.error('Failed to generate AI-enhanced summary')
    } finally {
      setLlmLoading(false)
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
            <DocumentTextIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Summary</h2>
          <p className="text-purple-200">Generating comprehensive insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Summary Not Available</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Button asChild>
            <Link href="/upload">Upload New File</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!summaryData) return null

  const qualityScore = Math.round(summaryData.dataset_summary.data_quality_score * 100)
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Model Analysis Summary
              </h1>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Comprehensive insights and performance analysis for your trained model
              </p>
              <div className="mt-4 px-3 py-1 border border-purple-400 text-purple-300 rounded-full text-sm inline-block">
                Model ID: {summaryData.model_id}
              </div>
            </motion.div>
          </div>

          {/* AI Summary Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <Button
              onClick={loadLLMSummary}
              disabled={llmLoading}
              size="lg"
              className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {llmLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 mr-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                  </motion.div>
                  Generating AI Summary...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Generate AI-Enhanced Summary
                </>
              )}
            </Button>
            <p className="text-purple-300 text-sm mt-2">
              Powered by OpenRouter + DeepSeek for advanced insights
            </p>
          </motion.div>

          {/* LLM Enhanced Summary */}
          {showLLMSummary && llmSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <Card className="glass border-purple-400/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <SparklesIcon className="w-6 h-6 text-purple-400 mr-2" />
                    AI-Enhanced Analysis
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Generated by {llmSummary.api_info.llm_model} via {llmSummary.api_info.api_provider}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Combined Summary */}
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/30">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <DocumentTextIcon className="w-5 h-5 mr-2" />
                      Executive Summary
                    </h4>
                    <p className="text-purple-100 leading-relaxed whitespace-pre-line">
                      {llmSummary.llm_enhanced_summaries.combined_summary}
                    </p>
                  </div>

                  {/* LLM Insights Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Key Findings */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <EyeIcon className="w-5 h-5 mr-2" />
                        Key Findings
                      </h4>
                      <div className="space-y-2">
                        {llmSummary.llm_insights.key_findings?.map((finding, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-purple-200 text-sm">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Business Insights */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        Business Insights
                      </h4>
                      <div className="space-y-2">
                        {llmSummary.llm_insights.business_insights?.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <InformationCircleIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-purple-200 text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <LightBulbIcon className="w-5 h-5 mr-2" />
                        Recommendations
                      </h4>
                      <div className="space-y-2">
                        {llmSummary.llm_insights.recommendations?.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <LightBulbIcon className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-purple-200 text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <ArrowLeftIcon className="w-5 h-5 mr-2 rotate-180" />
                        Next Steps
                      </h4>
                      <div className="space-y-2">
                        {llmSummary.llm_insights.next_steps?.map((step, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-purple-200 text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Traditional Summary (Always Shown) */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Dataset Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Dataset Overview
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Key statistics about your training data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {summaryData.dataset_summary.total_rows.toLocaleString()}
                      </div>
                      <div className="text-purple-200 text-sm">Rows</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {summaryData.dataset_summary.total_columns}
                      </div>
                      <div className="text-purple-200 text-sm">Columns</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Data Quality</span>
                      <span className={`font-bold ${getQualityColor(qualityScore)}`}>
                        {qualityScore}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Missing Values</span>
                      <span className="text-white">{summaryData.dataset_summary.missing_values}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Duplicate Rows</span>
                      <span className="text-white">{summaryData.dataset_summary.duplicate_rows}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Model Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CpuChipIcon className="w-5 h-5 mr-2" />
                    Model Overview
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Details about your trained model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Algorithm</span>
                      <span className="text-white font-medium">
                        {summaryData.model_summary.algorithm.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Problem Type</span>
                      <span className="text-white font-medium capitalize">
                        {summaryData.model_summary.problem_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Target Column</span>
                      <span className="text-white font-medium">
                        {summaryData.model_summary.target_column}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Features Used</span>
                      <span className="text-white font-medium">
                        {summaryData.model_summary.feature_count}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Model Size</span>
                      <span className="text-white font-medium">
                        {summaryData.model_summary.model_file_size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Metrics */}
          {summaryData.model_summary.evaluation_metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Model evaluation results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(summaryData.model_summary.evaluation_metrics).map(([metric, value]) => (
                      <div key={metric} className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {typeof value === 'number' ? value.toFixed(3) : value}
                        </div>
                        <div className="text-purple-200 text-sm capitalize">
                          {metric.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Natural Language Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Summary
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Human-readable analysis of your model and data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 leading-relaxed">
                  {summaryData.natural_language_summary}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights and Recommendations */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Insights */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="glass h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <EyeIcon className="w-5 h-5 mr-2" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Model Insights */}
                  {summaryData.insights.model_insights.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Model</h4>
                      <div className="space-y-2">
                        {summaryData.insights.model_insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-purple-200 text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Insights */}
                  {summaryData.insights.data_insights.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Data</h4>
                      <div className="space-y-2">
                        {summaryData.insights.data_insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <InformationCircleIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-purple-200 text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="glass h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summaryData.insights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <LightBulbIcon className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-purple-200 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="xl" className="group">
              <Link href={`/predict/${resolvedParams.model}`}>
                Make Predictions
                <ArrowLeftIcon className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="xl"
              onClick={() => router.back()}
              className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
            >
              Back to Training
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
