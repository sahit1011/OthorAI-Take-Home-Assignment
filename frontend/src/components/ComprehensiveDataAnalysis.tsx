"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  ScatterPlot,
  Scatter,
  Histogram,
  BoxPlot
} from "recharts"
import {
  ChartBarIcon,
  ChartPieIcon,
  BeakerIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  DocumentTextIcon,
  CalculatorIcon
} from "@heroicons/react/24/outline"
import React, { useState, useEffect } from "react"
import { apiService } from "@/lib/api"

interface ComprehensiveAnalysisProps {
  sessionId: string
}

interface AnalysisData {
  dataset_info: {
    shape: [number, number]
    rows: number
    columns: number
    memory_usage: string
    file_size: string
  }
  dtypes_info: {
    numeric_columns: string[]
    categorical_columns: string[]
    datetime_columns: string[]
    boolean_columns: string[]
  }
  missing_analysis: {
    total_missing: number
    missing_percentage: number
    columns_with_missing: Record<string, number>
    missing_patterns: any
  }
  duplicate_analysis: {
    duplicate_rows: number
    duplicate_percentage: number
    unique_rows: number
  }
  numeric_summary: {
    describe: Record<string, Record<string, number>>
    correlation_matrix: Record<string, Record<string, number>>
    skewness: Record<string, number>
    kurtosis: Record<string, number>
    outliers: Record<string, any>
  }
  categorical_summary: Record<string, {
    unique_count: number
    unique_percentage: number
    top_values: Record<string, number>
    mode: string
  }>
  quality_assessment: {
    completeness: number
    uniqueness: number
    consistency: number
    validity: number
    overall_quality: number
    quality_grade: string
  }
  distribution_analysis: Record<string, {
    mean: number
    median: number
    std: number
    min: number
    max: number
    skewness: number
    kurtosis: number
    quartiles: {
      q1: number
      q2: number
      q3: number
    }
    histogram_data: {
      counts: number[]
      bin_edges: number[]
      bin_centers: number[]
    }
    normality_test: {
      is_normal: boolean
      p_value: number
      test: string
    }
  }>
}

// Enhanced color palettes
const COLORS = {
  primary: ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
  quality: {
    excellent: '#10b981',
    good: '#22c55e',
    fair: '#f59e0b',
    poor: '#ef4444'
  },
  charts: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'],
  gradient: {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500'
  }
}

const getQualityColor = (grade: string) => {
  switch (grade.toLowerCase()) {
    case 'excellent': return 'text-green-400'
    case 'good': return 'text-green-300'
    case 'fair': return 'text-yellow-400'
    case 'poor': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

const getQualityBadgeColor = (grade: string) => {
  switch (grade.toLowerCase()) {
    case 'excellent': return 'bg-green-500'
    case 'good': return 'bg-green-400'
    case 'fair': return 'bg-yellow-500'
    case 'poor': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

export function ComprehensiveDataAnalysis({ sessionId }: ComprehensiveAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadAnalysisData()
  }, [sessionId])

  const loadAnalysisData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.getComprehensiveAnalysis(sessionId)
      setAnalysisData(response.analysis)
    } catch (err: any) {
      console.error('Error loading analysis data:', err)
      setError(err.response?.data?.detail?.message || 'Failed to load analysis data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200">Analyzing your data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="glass border-red-500/30">
        <CardContent className="p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Analysis Error</h3>
          <p className="text-red-300">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!analysisData) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header with Overall Quality Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center text-2xl">
                  <SparklesIcon className="w-8 h-8 mr-3 text-purple-400" />
                  Data Analysis Report
                </CardTitle>
                <CardDescription className="text-purple-200 text-lg">
                  Comprehensive statistical analysis of your dataset
                </CardDescription>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getQualityColor(analysisData.quality_assessment.quality_grade)}`}>
                  {Math.round(analysisData.quality_assessment.overall_quality)}%
                </div>
                <Badge className={`${getQualityBadgeColor(analysisData.quality_assessment.quality_grade)} text-white px-4 py-1`}>
                  {analysisData.quality_assessment.quality_grade}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(analysisData.dataset_info.rows)}
                </div>
                <div className="text-purple-300 text-sm">Rows</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {analysisData.dataset_info.columns}
                </div>
                <div className="text-purple-300 text-sm">Columns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {analysisData.dataset_info.memory_usage}
                </div>
                <div className="text-purple-300 text-sm">Memory</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {analysisData.dataset_info.file_size}
                </div>
                <div className="text-purple-300 text-sm">File Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabbed Analysis Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black/20 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500">Overview</TabsTrigger>
            <TabsTrigger value="quality" className="data-[state=active]:bg-purple-500">Quality</TabsTrigger>
            <TabsTrigger value="distributions" className="data-[state=active]:bg-purple-500">Distributions</TabsTrigger>
            <TabsTrigger value="correlations" className="data-[state=active]:bg-purple-500">Correlations</TabsTrigger>
            <TabsTrigger value="categorical" className="data-[state=active]:bg-purple-500">Categorical</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-purple-500">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Data Types Distribution */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ChartPieIcon className="w-5 h-5 mr-2" />
                    Data Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Numeric', value: analysisData.dtypes_info.numeric_columns.length, color: COLORS.charts[0] },
                            { name: 'Categorical', value: analysisData.dtypes_info.categorical_columns.length, color: COLORS.charts[1] },
                            { name: 'DateTime', value: analysisData.dtypes_info.datetime_columns.length, color: COLORS.charts[2] },
                            { name: 'Boolean', value: analysisData.dtypes_info.boolean_columns.length, color: COLORS.charts[3] }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: 'Numeric', value: analysisData.dtypes_info.numeric_columns.length, color: COLORS.charts[0] },
                            { name: 'Categorical', value: analysisData.dtypes_info.categorical_columns.length, color: COLORS.charts[1] },
                            { name: 'DateTime', value: analysisData.dtypes_info.datetime_columns.length, color: COLORS.charts[2] },
                            { name: 'Boolean', value: analysisData.dtypes_info.boolean_columns.length, color: COLORS.charts[3] }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            border: '1px solid #8b5cf6',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{analysisData.dtypes_info.numeric_columns.length}</div>
                      <div className="text-sm text-blue-300">Numeric</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-400">{analysisData.dtypes_info.categorical_columns.length}</div>
                      <div className="text-sm text-cyan-300">Categorical</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Missing Values Analysis */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    Missing Values Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-400 mb-2">
                        {analysisData.missing_analysis.missing_percentage.toFixed(1)}%
                      </div>
                      <div className="text-yellow-300">Missing Data</div>
                      <div className="text-sm text-purple-300 mt-1">
                        {formatNumber(analysisData.missing_analysis.total_missing)} missing values
                      </div>
                    </div>

                    {Object.keys(analysisData.missing_analysis.columns_with_missing).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white font-medium">Columns with Missing Values:</h4>
                        {Object.entries(analysisData.missing_analysis.columns_with_missing)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([column, count]) => (
                            <div key={column} className="flex justify-between items-center p-2 bg-white/5 rounded">
                              <span className="text-purple-200 text-sm truncate">{column}</span>
                              <span className="text-yellow-400 font-medium">{count}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dataset Summary Stats */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Dataset Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Data Integrity</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">Total Records</span>
                        <span className="text-white font-medium">{formatNumber(analysisData.dataset_info.rows)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">Unique Records</span>
                        <span className="text-white font-medium">{formatNumber(analysisData.duplicate_analysis.unique_rows)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">Duplicates</span>
                        <span className={`font-medium ${analysisData.duplicate_analysis.duplicate_rows > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {formatNumber(analysisData.duplicate_analysis.duplicate_rows)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Column Types</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">Numeric Columns</span>
                        <span className="text-blue-400 font-medium">{analysisData.dtypes_info.numeric_columns.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">Categorical Columns</span>
                        <span className="text-cyan-400 font-medium">{analysisData.dtypes_info.categorical_columns.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">DateTime Columns</span>
                        <span className="text-purple-400 font-medium">{analysisData.dtypes_info.datetime_columns.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Storage Info</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">Memory Usage</span>
                        <span className="text-white font-medium">{analysisData.dataset_info.memory_usage}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-purple-300">File Size</span>
                        <span className="text-white font-medium">{analysisData.dataset_info.file_size}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Completeness', value: analysisData.quality_assessment.completeness, color: 'text-green-400' },
                      { label: 'Uniqueness', value: analysisData.quality_assessment.uniqueness, color: 'text-blue-400' },
                      { label: 'Consistency', value: analysisData.quality_assessment.consistency, color: 'text-purple-400' },
                      { label: 'Validity', value: analysisData.quality_assessment.validity, color: 'text-orange-400' }
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-200">{metric.label}</span>
                          <span className={`font-bold ${metric.color}`}>{metric.value.toFixed(1)}%</span>
                        </div>
                        <Progress value={metric.value} className="h-2 bg-white/10" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    Quality Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className={`text-6xl font-bold mb-2 ${getQualityColor(analysisData.quality_assessment.quality_grade)}`}>
                      {Math.round(analysisData.quality_assessment.overall_quality)}%
                    </div>
                    <Badge className={`${getQualityBadgeColor(analysisData.quality_assessment.quality_grade)} text-white px-4 py-2`}>
                      {analysisData.quality_assessment.quality_grade} Quality
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {analysisData.quality_assessment.overall_quality >= 90 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center mb-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-medium">Excellent Quality</span>
                        </div>
                        <p className="text-green-200 text-sm">Your data is ready for analysis and modeling!</p>
                      </div>
                    )}

                    {analysisData.missing_analysis.missing_percentage > 10 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 mr-2" />
                          <span className="text-yellow-400 font-medium">Missing Data Alert</span>
                        </div>
                        <p className="text-yellow-200 text-sm">
                          {analysisData.missing_analysis.missing_percentage.toFixed(1)}% missing values detected. Consider imputation strategies.
                        </p>
                      </div>
                    )}

                    {analysisData.duplicate_analysis.duplicate_percentage > 5 && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-orange-400 mr-2" />
                          <span className="text-orange-400 font-medium">Duplicate Records</span>
                        </div>
                        <p className="text-orange-200 text-sm">
                          {analysisData.duplicate_analysis.duplicate_percentage.toFixed(1)}% duplicate rows found. Consider deduplication.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribution Analysis Tab */}
          <TabsContent value="distributions" className="space-y-6">
            {Object.keys(analysisData.distribution_analysis).length > 0 ? (
              <div className="grid gap-6">
                {Object.entries(analysisData.distribution_analysis).map(([column, distData]) => (
                  <Card key={column} className="glass">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        {column} - Distribution Analysis
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Statistical distribution and normality analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Histogram */}
                        <div>
                          <h4 className="text-white font-medium mb-3">Distribution Histogram</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={distData.histogram_data.bin_centers.map((center, idx) => ({
                                bin: center.toFixed(2),
                                count: distData.histogram_data.counts[idx],
                                frequency: ((distData.histogram_data.counts[idx] / distData.histogram_data.counts.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                  dataKey="bin"
                                  stroke="#e2e8f0"
                                  fontSize={12}
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                />
                                <YAxis stroke="#e2e8f0" fontSize={12} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    borderRadius: '8px',
                                    color: 'white'
                                  }}
                                  formatter={(value, name) => [
                                    name === 'count' ? `${value} values` : `${value}%`,
                                    name === 'count' ? 'Count' : 'Frequency'
                                  ]}
                                />
                                <Bar dataKey="count" fill={COLORS.charts[0]} radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Statistical Summary */}
                        <div>
                          <h4 className="text-white font-medium mb-3">Statistical Summary</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-purple-300 text-sm">Mean</div>
                                <div className="text-white font-semibold">{distData.mean.toFixed(3)}</div>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-purple-300 text-sm">Median</div>
                                <div className="text-white font-semibold">{distData.median.toFixed(3)}</div>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-purple-300 text-sm">Std Dev</div>
                                <div className="text-white font-semibold">{distData.std.toFixed(3)}</div>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-purple-300 text-sm">Range</div>
                                <div className="text-white font-semibold">{(distData.max - distData.min).toFixed(3)}</div>
                              </div>
                            </div>

                            {/* Quartiles */}
                            <div className="bg-white/5 p-3 rounded-lg">
                              <div className="text-purple-300 text-sm mb-2">Quartiles</div>
                              <div className="flex justify-between text-xs text-white">
                                <span>Q1: {distData.quartiles.q1.toFixed(2)}</span>
                                <span>Q2: {distData.quartiles.q2.toFixed(2)}</span>
                                <span>Q3: {distData.quartiles.q3.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Shape Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-purple-300 text-sm">Skewness</div>
                                <div className="text-white font-semibold">
                                  {distData.skewness.toFixed(3)}
                                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                    Math.abs(distData.skewness) < 0.5 ? 'bg-green-500/20 text-green-300' :
                                    Math.abs(distData.skewness) < 1 ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    {Math.abs(distData.skewness) < 0.5 ? 'Normal' :
                                     Math.abs(distData.skewness) < 1 ? 'Moderate' : 'High'}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-purple-300 text-sm">Kurtosis</div>
                                <div className="text-white font-semibold">
                                  {distData.kurtosis.toFixed(3)}
                                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                    Math.abs(distData.kurtosis) < 3 ? 'bg-green-500/20 text-green-300' :
                                    'bg-yellow-500/20 text-yellow-300'
                                  }`}>
                                    {Math.abs(distData.kurtosis) < 3 ? 'Normal' : 'Heavy-tailed'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Normality Test */}
                            <div className="bg-white/5 p-3 rounded-lg">
                              <div className="text-purple-300 text-sm">Normality Test</div>
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">
                                  {distData.normality_test.test === 'shapiro_wilk' ? 'Shapiro-Wilk' : 'Test Failed'}
                                </span>
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    distData.normality_test.is_normal
                                      ? 'bg-green-500/20 text-green-300'
                                      : 'bg-red-500/20 text-red-300'
                                  }`}>
                                    {distData.normality_test.is_normal ? 'Normal' : 'Non-normal'}
                                  </span>
                                  {distData.normality_test.p_value && (
                                    <span className="ml-2 text-xs text-purple-300">
                                      p = {distData.normality_test.p_value.toFixed(4)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <CalculatorIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Numeric Columns</h3>
                  <p className="text-purple-200">No numeric columns found for distribution analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Correlation Analysis Tab */}
          <TabsContent value="correlations" className="space-y-6">
            {analysisData.numeric_summary.correlation_matrix && Object.keys(analysisData.numeric_summary.correlation_matrix).length > 1 ? (
              <div className="space-y-6">
                {/* Correlation Heatmap */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CpuChipIcon className="w-5 h-5 mr-2" />
                      Correlation Matrix Heatmap
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Pairwise correlations between numeric features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        {(() => {
                          const corrMatrix = analysisData.numeric_summary.correlation_matrix;
                          const columns = Object.keys(corrMatrix);
                          return (
                            <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${columns.length}, 80px)` }}>
                              {/* Header row */}
                              <div></div>
                              {columns.map(col => (
                                <div key={col} className="text-xs text-purple-300 p-2 text-center transform -rotate-45 origin-bottom-left">
                                  {col.length > 8 ? col.substring(0, 8) + '...' : col}
                                </div>
                              ))}

                              {/* Data rows */}
                              {columns.map(row => (
                                <React.Fragment key={row}>
                                  <div className="text-xs text-purple-300 p-2 text-right pr-3">
                                    {row.length > 15 ? row.substring(0, 15) + '...' : row}
                                  </div>
                                  {columns.map(col => {
                                    const value = corrMatrix[row]?.[col] ?? 0;
                                    const absValue = Math.abs(value);
                                    const getColor = () => {
                                      if (row === col) return 'bg-purple-500';
                                      if (absValue >= 0.8) return value > 0 ? 'bg-red-500' : 'bg-blue-500';
                                      if (absValue >= 0.6) return value > 0 ? 'bg-red-400' : 'bg-blue-400';
                                      if (absValue >= 0.4) return value > 0 ? 'bg-red-300' : 'bg-blue-300';
                                      if (absValue >= 0.2) return value > 0 ? 'bg-red-200' : 'bg-blue-200';
                                      return 'bg-gray-600';
                                    };

                                    return (
                                      <div
                                        key={`${row}-${col}`}
                                        className={`h-12 w-full ${getColor()} flex items-center justify-center text-xs font-medium text-white rounded`}
                                        title={`${row} vs ${col}: ${value.toFixed(3)}`}
                                      >
                                        {value.toFixed(2)}
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-purple-300">Strong Positive</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-300 rounded"></div>
                        <span className="text-purple-300">Moderate Positive</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-600 rounded"></div>
                        <span className="text-purple-300">Weak</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-300 rounded"></div>
                        <span className="text-purple-300">Moderate Negative</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-purple-300">Strong Negative</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Strong Correlations List */}
                {(() => {
                  const corrMatrix = analysisData.numeric_summary.correlation_matrix;
                  const strongCorrelations = [];
                  const columns = Object.keys(corrMatrix);

                  for (let i = 0; i < columns.length; i++) {
                    for (let j = i + 1; j < columns.length; j++) {
                      const col1 = columns[i];
                      const col2 = columns[j];
                      const value = corrMatrix[col1]?.[col2];
                      if (value && Math.abs(value) > 0.5) {
                        strongCorrelations.push({
                          col1,
                          col2,
                          correlation: value,
                          strength: Math.abs(value) >= 0.8 ? 'Very Strong' :
                                   Math.abs(value) >= 0.6 ? 'Strong' : 'Moderate'
                        });
                      }
                    }
                  }

                  strongCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

                  return strongCorrelations.length > 0 ? (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <ChartPieIcon className="w-5 h-5 mr-2" />
                          Strong Correlations (|r| > 0.5)
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          Feature pairs with significant correlations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {strongCorrelations.slice(0, 10).map((corr, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex-1">
                                <div className="text-white font-medium">
                                  {corr.col1} ↔ {corr.col2}
                                </div>
                                <div className="text-purple-300 text-sm">{corr.strength} correlation</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  corr.correlation > 0 ? 'text-red-400' : 'text-blue-400'
                                }`}>
                                  {corr.correlation.toFixed(3)}
                                </div>
                                <div className="w-20 bg-gray-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      corr.correlation > 0 ? 'bg-red-400' : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <CpuChipIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Insufficient Numeric Data</h3>
                  <p className="text-purple-200">Need at least 2 numeric columns for correlation analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Categorical Analysis Tab */}
          <TabsContent value="categorical" className="space-y-6">
            {Object.keys(analysisData.categorical_summary).length > 0 ? (
              <div className="grid gap-6">
                {Object.entries(analysisData.categorical_summary).map(([column, catData]) => (
                  <Card key={column} className="glass">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        {column} - Categorical Analysis
                      </CardTitle>
                      <CardDescription className="text-purple-200">
                        Value distribution and frequency analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Value Distribution Chart */}
                        <div>
                          <h4 className="text-white font-medium mb-3">Top Values Distribution</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={Object.entries(catData.top_values).map(([value, count]) => ({
                                  value: value.length > 15 ? value.substring(0, 15) + '...' : value,
                                  fullValue: value,
                                  count: count,
                                  percentage: ((count / Object.values(catData.top_values).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
                                }))}
                                layout="horizontal"
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                  type="number"
                                  stroke="#e2e8f0"
                                  fontSize={12}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="value"
                                  stroke="#e2e8f0"
                                  fontSize={12}
                                  width={100}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    borderRadius: '8px',
                                    color: 'white'
                                  }}
                                  formatter={(value, name, props) => [
                                    `${value} occurrences (${props.payload.percentage}%)`,
                                    props.payload.fullValue
                                  ]}
                                />
                                <Bar dataKey="count" fill={COLORS.charts[1]} radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Statistics Summary */}
                        <div>
                          <h4 className="text-white font-medium mb-3">Category Statistics</h4>
                          <div className="space-y-4">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 p-4 rounded-lg">
                                <div className="text-purple-300 text-sm">Unique Values</div>
                                <div className="text-white text-2xl font-bold">{catData.unique_count}</div>
                                <div className="text-purple-400 text-xs">
                                  {catData.unique_percentage.toFixed(1)}% of total
                                </div>
                              </div>
                              <div className="bg-white/5 p-4 rounded-lg">
                                <div className="text-purple-300 text-sm">Most Frequent</div>
                                <div className="text-white text-lg font-semibold truncate" title={catData.mode}>
                                  {catData.mode || 'N/A'}
                                </div>
                                <div className="text-purple-400 text-xs">Mode value</div>
                              </div>
                            </div>

                            {/* Cardinality Assessment */}
                            <div className="bg-white/5 p-4 rounded-lg">
                              <div className="text-purple-300 text-sm mb-2">Cardinality Assessment</div>
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">
                                  {catData.unique_percentage > 90 ? 'Very High' :
                                   catData.unique_percentage > 50 ? 'High' :
                                   catData.unique_percentage > 20 ? 'Medium' : 'Low'}
                                </span>
                                <span className={`px-3 py-1 rounded text-xs ${
                                  catData.unique_percentage > 90 ? 'bg-red-500/20 text-red-300' :
                                  catData.unique_percentage > 50 ? 'bg-yellow-500/20 text-yellow-300' :
                                  catData.unique_percentage > 20 ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-green-500/20 text-green-300'
                                }`}>
                                  {catData.unique_percentage > 90 ? 'Consider ID column' :
                                   catData.unique_percentage > 50 ? 'High diversity' :
                                   catData.unique_percentage > 20 ? 'Good for analysis' : 'Low diversity'}
                                </span>
                              </div>
                            </div>

                            {/* Top Values List */}
                            <div className="bg-white/5 p-4 rounded-lg">
                              <div className="text-purple-300 text-sm mb-3">Top Values Breakdown</div>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {Object.entries(catData.top_values).slice(0, 5).map(([value, count]) => {
                                  const total = Object.values(catData.top_values).reduce((a, b) => a + b, 0);
                                  const percentage = ((count / total) * 100).toFixed(1);
                                  return (
                                    <div key={value} className="flex items-center justify-between text-sm">
                                      <span className="text-white truncate flex-1 mr-2" title={value}>
                                        {value.length > 20 ? value.substring(0, 20) + '...' : value}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-purple-300">{count}</span>
                                        <span className="text-purple-400 text-xs">({percentage}%)</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <ChartBarIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Categorical Columns</h3>
                  <p className="text-purple-200">No categorical columns found for analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights">
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
                <p className="text-purple-200">Coming soon - AI-powered data insights</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
