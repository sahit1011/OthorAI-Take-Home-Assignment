"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterPlot,
  Scatter,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import {
  ChartBarIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ColumnProfile {
  type: string
  unique: number
  null_percentage: number
  mean?: number
  std?: number
  min?: number
  max?: number
  top_values?: Array<{ value: string; count: number }>
  outliers?: number[]
  skewness?: number
}

interface DataVisualizationProps {
  columnProfiles: Record<string, ColumnProfile>
  correlations: Array<{
    column1: string
    column2: string
    correlation: number
  }>
  datasetInfo: {
    rows: number
    columns: number
    missing_values_total: number
    duplicate_rows: number
  }
}

// Enhanced color palettes for professional visualizations
const COLORS = {
  primary: ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
  quality: ['#10b981', '#f59e0b', '#ef4444'],
  distribution: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
  correlation: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'],
  gradient: {
    excellent: '#10b981',
    good: '#22c55e',
    fair: '#f59e0b',
    poor: '#ef4444'
  }
}

const getQualityColor = (score: number) => {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

const getQualityBadge = (score: number) => {
  if (score >= 90) return { label: 'Excellent', color: 'bg-green-500' }
  if (score >= 70) return { label: 'Good', color: 'bg-yellow-500' }
  if (score >= 50) return { label: 'Fair', color: 'bg-orange-500' }
  return { label: 'Poor', color: 'bg-red-500' }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function DataVisualization({ columnProfiles, correlations, datasetInfo }: DataVisualizationProps) {
  // Prepare data for column type distribution
  const columnTypeData = Object.values(columnProfiles).reduce((acc, profile) => {
    const type = profile.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeChartData = Object.entries(columnTypeData).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
    percentage: ((count / Object.keys(columnProfiles).length) * 100).toFixed(1)
  }))

  // Enhanced data quality analysis
  const numericalColumns = Object.entries(columnProfiles)
    .filter(([_, profile]) => profile.type === 'numeric' && profile.mean !== undefined)
    .map(([column, profile]) => ({
      column,
      mean: profile.mean!,
      std: profile.std!,
      min: profile.min!,
      max: profile.max!,
      skewness: profile.skewness || 0,
      outliers: profile.outliers?.length || 0,
      nullPercentage: profile.null_percentage,
      unique: profile.unique
    }))

  // Calculate overall data quality score
  const qualityMetrics = {
    completeness: 100 - (datasetInfo.missing_values_total / (datasetInfo.rows * datasetInfo.columns)) * 100,
    uniqueness: 100 - (datasetInfo.duplicate_rows / datasetInfo.rows) * 100,
    consistency: Object.values(columnProfiles).reduce((acc, profile) =>
      acc + (100 - profile.null_percentage), 0) / Object.keys(columnProfiles).length,
    validity: numericalColumns.length > 0 ?
      numericalColumns.reduce((acc, col) => acc + Math.max(0, 100 - col.outliers * 2), 0) / numericalColumns.length : 100
  }

  const overallQualityScore = Math.round(
    (qualityMetrics.completeness * 0.3 +
     qualityMetrics.uniqueness * 0.2 +
     qualityMetrics.consistency * 0.3 +
     qualityMetrics.validity * 0.2)
  )

  // Strong correlations (|r| > 0.5)
  const strongCorrelations = correlations
    .filter(corr => Math.abs(corr.correlation) > 0.5)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 8)

  // Prepare data for missing values chart
  const missingValuesData = Object.entries(columnProfiles)
    .filter(([_, profile]) => profile.null_percentage > 0)
    .map(([column, profile]) => ({
      column: column.length > 15 ? column.substring(0, 15) + '...' : column,
      fullColumn: column,
      missing_percentage: profile.null_percentage,
      completeness: 100 - profile.null_percentage
    }))
    .sort((a, b) => b.missing_percentage - a.missing_percentage)
    .slice(0, 10) // Top 10 columns with missing values

  // Prepare data for correlation heatmap (simplified) - using existing strongCorrelations

  // Data quality overview
  const qualityData = [
    {
      metric: 'Complete Data',
      value: ((datasetInfo.rows * Object.keys(columnProfiles).length - datasetInfo.missing_values_total) / 
              (datasetInfo.rows * Object.keys(columnProfiles).length) * 100),
      color: '#10b981'
    },
    {
      metric: 'Missing Data',
      value: (datasetInfo.missing_values_total / 
              (datasetInfo.rows * Object.keys(columnProfiles).length) * 100),
      color: '#ef4444'
    },
    {
      metric: 'Unique Rows',
      value: ((datasetInfo.rows - datasetInfo.duplicate_rows) / datasetInfo.rows * 100),
      color: '#06b6d4'
    },
    {
      metric: 'Duplicate Rows',
      value: (datasetInfo.duplicate_rows / datasetInfo.rows * 100),
      color: '#f59e0b'
    }
  ]

  // Numerical columns for chart display (using existing numericalColumns)
  const numericalColumnsChart = numericalColumns.map(col => ({
    column: col.column.length > 12 ? col.column.substring(0, 12) + '...' : col.column,
    fullColumn: col.column,
    mean: col.mean,
    std: col.std,
    skewness: Math.abs(col.skewness)
  })).slice(0, 8)

  return (
    <div className="space-y-8">
      {/* Data Quality Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <SparklesIcon className="w-6 h-6 mr-3 text-purple-400" />
              Data Quality Assessment
              <Badge className={`ml-3 ${getQualityBadge(overallQualityScore).color}`}>
                {getQualityBadge(overallQualityScore).label}
              </Badge>
            </CardTitle>
            <CardDescription className="text-purple-200">
              Comprehensive analysis of your dataset's quality and characteristics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[
                { metric: 'Completeness', value: qualityMetrics.completeness, color: COLORS.quality[0] },
                { metric: 'Uniqueness', value: qualityMetrics.uniqueness, color: COLORS.quality[1] },
                { metric: 'Consistency', value: qualityMetrics.consistency, color: COLORS.quality[2] },
                { metric: 'Validity', value: qualityMetrics.validity, color: COLORS.quality[0] }
              ].map((metric, index) => (
                <motion.div
                  key={metric.metric}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="mb-2">
                    <div className={`text-2xl font-bold ${getQualityColor(metric.value)}`}>
                      {metric.value.toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-300">{metric.metric}</div>
                  </div>
                  <Progress
                    value={metric.value}
                    className="h-2 bg-white/10"
                  />
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getQualityColor(overallQualityScore)}`}>
                {overallQualityScore}%
              </div>
              <div className="text-purple-200">Overall Data Quality Score</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid - 2 per row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Column Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ChartPieIcon className="w-5 h-5 mr-2" />
                Feature Type Analysis
              </CardTitle>
              <CardDescription className="text-purple-200">
                Distribution and characteristics of data types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid #8b5cf6',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} columns (${typeChartData.find(d => d.count === value)?.percentage}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {typeChartData.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: COLORS.primary[index % COLORS.primary.length] }}
                      />
                      <span className="text-white font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-300">{item.count} columns</div>
                      <div className="text-xs text-purple-400">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Quality Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Data Quality
              </CardTitle>
              <CardDescription className="text-purple-200">
                Completeness metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="metric"
                      stroke="#9ca3af"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid #8b5cf6',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row - Missing Values and Numerical Stats */}
      {(missingValuesData.length > 0 || numericalColumns.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Missing Values Analysis */}
          {missingValuesData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass border-yellow-400/50 h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
                    Missing Values
                  </CardTitle>
                  <CardDescription className="text-yellow-200">
                    Columns needing attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={missingValuesData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="column"
                          stroke="#9ca3af"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke="#9ca3af" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                          formatter={(value: number, name: string) => [
                            `${value.toFixed(1)}%`,
                            name === 'missing_percentage' ? 'Missing' : 'Complete'
                          ]}
                          labelFormatter={(label) => {
                            const item = missingValuesData.find(d => d.column === label)
                            return item ? item.fullColumn : label
                          }}
                        />
                        <Bar dataKey="missing_percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Numerical Columns Statistics */}
          {numericalColumns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Numerical Stats
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Statistical distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={numericalColumnsChart} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="column"
                          stroke="#9ca3af"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke="#9ca3af" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid #8b5cf6',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                          formatter={(value: number, name: string) => [
                            value.toLocaleString(),
                            name === 'mean' ? 'Mean' : name === 'std' ? 'Std Dev' : 'Skewness'
                          ]}
                          labelFormatter={(label) => {
                            const item = numericalColumns.find(d => d.column === label)
                            return item ? item.fullColumn : label
                          }}
                        />
                        <Bar dataKey="mean" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Strong Correlations */}
      {strongCorrelations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ChartPieIcon className="w-5 h-5 mr-2" />
                Strong Feature Correlations
              </CardTitle>
              <CardDescription className="text-purple-200">
                Significant correlations between features (|r| > 0.5)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strongCorrelations.map((corr, index) => {
                  const absCorr = Math.abs(corr.correlation)
                  const getColor = () => {
                    if (absCorr >= 0.8) return '#ef4444' // Strong - Red
                    if (absCorr >= 0.7) return '#f59e0b' // Moderate-Strong - Orange
                    return '#06b6d4' // Moderate - Blue
                  }

                  const getIntensity = () => {
                    return `${Math.max(20, absCorr * 100)}%`
                  }

                  return (
                    <motion.div
                      key={`${corr.column1}-${corr.column2}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-6 h-6 rounded"
                          style={{
                            backgroundColor: getColor(),
                            opacity: getIntensity()
                          }}
                        ></div>
                        <div>
                          <div className="text-white font-medium">
                            {corr.column1} ↔ {corr.column2}
                          </div>
                          <div className="text-purple-300 text-sm">
                            {absCorr >= 0.8 ? 'Very Strong' :
                             absCorr >= 0.7 ? 'Strong' :
                             absCorr >= 0.5 ? 'Moderate' : 'Weak'} correlation
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          absCorr >= 0.8 ? 'text-red-400' :
                          absCorr >= 0.7 ? 'text-orange-400' :
                          'text-blue-400'
                        }`}>
                          {corr.correlation.toFixed(3)}
                        </div>
                        <div className="text-purple-300 text-xs">
                          {corr.correlation > 0 ? 'Positive' : 'Negative'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Science Insights and Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Data Science Insights
            </CardTitle>
            <CardDescription className="text-purple-200">
              Professional analysis and recommendations for your dataset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Dataset Overview */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-3">Dataset Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-300">Sample Size</span>
                    <span className="text-white font-medium">{formatNumber(datasetInfo.rows)} rows</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-300">Feature Count</span>
                    <span className="text-white font-medium">{datasetInfo.columns} columns</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-300">Memory Usage</span>
                    <span className="text-white font-medium">{datasetInfo.memory_usage}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-300">Missing Values</span>
                    <span className={`font-medium ${datasetInfo.missing_values_total > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {formatNumber(datasetInfo.missing_values_total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white mb-3">Recommendations</h4>
                <div className="space-y-3">
                  {overallQualityScore < 70 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center mb-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 mr-2" />
                        <span className="text-yellow-400 font-medium">Data Quality</span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        Consider data cleaning and preprocessing to improve quality score.
                      </p>
                    </div>
                  )}

                  {datasetInfo.missing_values_total > 0 && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center mb-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-blue-400 font-medium">Missing Data</span>
                      </div>
                      <p className="text-blue-200 text-sm">
                        Handle missing values using imputation or removal strategies.
                      </p>
                    </div>
                  )}

                  {numericalColumns.some(col => col.outliers > 0) && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center mb-2">
                        <EyeIcon className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-purple-400 font-medium">Outliers Detected</span>
                      </div>
                      <p className="text-purple-200 text-sm">
                        Review outliers for data entry errors or genuine extreme values.
                      </p>
                    </div>
                  )}

                  {strongCorrelations.length > 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center mb-2">
                        <SparklesIcon className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-green-400 font-medium">Feature Engineering</span>
                      </div>
                      <p className="text-green-200 text-sm">
                        Strong correlations found - consider feature selection or dimensionality reduction.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
