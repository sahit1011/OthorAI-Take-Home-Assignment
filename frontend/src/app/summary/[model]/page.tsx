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
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(156, 146, 172, 0.1) 0%, transparent 50%)',
          backgroundSize: '60px 60px'
        }}></div>
      </div>

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
              <Card className="glass-card border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-xl font-semibold">
                    <SparklesIcon className="w-6 h-6 text-purple-400 mr-2" />
                    AI-Enhanced Analysis
                  </CardTitle>
                  <CardDescription className="text-purple-100 text-base">
                    Generated by {llmSummary.api_info.llm_model} via {llmSummary.api_info.api_provider}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Combined Summary */}
                  <div className="p-6 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-xl border border-purple-400/40 shadow-lg">
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <DocumentTextIcon className="w-6 h-6 mr-3 text-purple-300" />
                      Executive Summary
                    </h4>
                    <p className="text-gray-100 leading-relaxed whitespace-pre-line text-base">
                      {llmSummary.llm_enhanced_summaries.combined_summary}
                    </p>
                  </div>

                  {/* LLM Insights Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Key Findings */}
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <EyeIcon className="w-5 h-5 mr-2 text-green-400" />
                        Key Findings
                      </h4>
                      <div className="space-y-3">
                        {llmSummary.llm_insights.key_findings?.map((finding, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                            <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-100 text-sm leading-relaxed">{finding}</span>
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
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-400" />
                        Recommendations
                      </h4>
                      <div className="space-y-3">
                        {llmSummary.llm_insights.recommendations?.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                            <LightBulbIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-100 text-sm leading-relaxed">{rec}</span>
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
              <Card className="glass-card h-full border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg font-semibold">
                    <ChartBarIcon className="w-6 h-6 mr-3 text-blue-400" />
                    Dataset Overview
                  </CardTitle>
                  <CardDescription className="text-gray-200 text-base">
                    Key statistics about your training data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-colors">
                      <div className="text-3xl font-bold text-white mb-1">
                        {summaryData.dataset_summary.total_rows.toLocaleString()}
                      </div>
                      <div className="text-gray-200 text-sm font-medium">Rows</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-400/20 hover:border-green-400/40 transition-colors">
                      <div className="text-3xl font-bold text-white mb-1">
                        {summaryData.dataset_summary.total_columns}
                      </div>
                      <div className="text-gray-200 text-sm font-medium">Columns</div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Data Quality</span>
                      <span className={`font-bold text-lg ${getQualityColor(qualityScore)}`}>
                        {qualityScore}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Missing Values</span>
                      <span className="text-white font-semibold">{summaryData.dataset_summary.missing_values.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Duplicate Rows</span>
                      <span className="text-white font-semibold">{summaryData.dataset_summary.duplicate_rows.toLocaleString()}</span>
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
              <Card className="glass-card h-full border-green-400/30 hover:border-green-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg font-semibold">
                    <CpuChipIcon className="w-6 h-6 mr-3 text-green-400" />
                    Model Overview
                  </CardTitle>
                  <CardDescription className="text-gray-200 text-base">
                    Details about your trained model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Algorithm</span>
                      <span className="text-white font-semibold">
                        {summaryData.model_summary.algorithm.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Problem Type</span>
                      <span className="text-white font-semibold capitalize">
                        {summaryData.model_summary.problem_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Target Column</span>
                      <span className="text-white font-semibold">
                        {summaryData.model_summary.target_column}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Features Used</span>
                      <span className="text-white font-semibold">
                        {summaryData.model_summary.feature_count}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="text-gray-200 font-medium">Model Size</span>
                      <span className="text-white font-semibold">
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
              <Card className="glass-card border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg font-semibold">
                    <ChartBarIcon className="w-6 h-6 mr-3 text-yellow-400" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription className="text-gray-200 text-base">
                    Model evaluation results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(summaryData.model_summary.evaluation_metrics).map(([metric, value], index) => (
                      <div key={metric} className={`text-center p-4 rounded-xl border transition-colors hover:scale-105 transform duration-200 ${
                        index % 4 === 0 ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20 hover:border-blue-400/40' :
                        index % 4 === 1 ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/20 hover:border-green-400/40' :
                        index % 4 === 2 ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/20 hover:border-purple-400/40' :
                        'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/20 hover:border-orange-400/40'
                      }`}>
                        <div className="text-3xl font-bold text-white mb-1">
                          {typeof value === 'number' ? value.toFixed(3) : value}
                        </div>
                        <div className="text-gray-200 text-sm capitalize font-medium">
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
            <Card className="glass-card border-indigo-400/30 hover:border-indigo-400/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl font-semibold">
                  <DocumentTextIcon className="w-6 h-6 mr-3 text-indigo-400" />
                  Summary
                </CardTitle>
                <CardDescription className="text-gray-200 text-base">
                  Human-readable analysis of your model and data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
                  <p className="text-gray-100 leading-relaxed text-base">
                    {summaryData.natural_language_summary}
                  </p>
                </div>
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
              <Card className="glass-card h-full border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg font-semibold">
                    <EyeIcon className="w-6 h-6 mr-3 text-cyan-400" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Model Insights */}
                  {summaryData.insights.model_insights.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <CpuChipIcon className="w-5 h-5 mr-2 text-green-400" />
                        Model
                      </h4>
                      <div className="space-y-3">
                        {summaryData.insights.model_insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-white/5 transition-colors">
                            <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-100 text-sm leading-relaxed">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Insights */}
                  {summaryData.insights.data_insights.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2 text-blue-400" />
                        Data
                      </h4>
                      <div className="space-y-3">
                        {summaryData.insights.data_insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-white/5 transition-colors">
                            <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-100 text-sm leading-relaxed">{insight}</span>
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
              <Card className="glass-card h-full border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg font-semibold">
                    <LightBulbIcon className="w-6 h-6 mr-3 text-yellow-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="space-y-3">
                      {summaryData.insights.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-white/5 transition-colors">
                          <LightBulbIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-100 text-sm leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
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
            <Button asChild size="xl" className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105">
              <Link href={`/predict/${resolvedParams.model}`}>
                Make Predictions
                <ArrowLeftIcon className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="xl"
              onClick={() => router.back()}
              className="border-purple-400/50 text-purple-200 hover:bg-purple-400/20 hover:text-white hover:border-purple-400 backdrop-blur-sm bg-white/5"
            >
              Back to Training
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
