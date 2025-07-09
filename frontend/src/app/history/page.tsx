"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService, FileHistoryItem, ModelHistoryItem, UserStats } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Brain,
  TrendingUp,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Users,
  HardDrive,
  Download,
  Sparkles,
  Target,
  Zap,
  Activity,
  Calendar,
  Award,
  Cpu
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function HistoryPage() {
  const { user, isAuthenticated } = useAuth()
  const [files, setFiles] = useState<FileHistoryItem[]>([])
  const [models, setModels] = useState<ModelHistoryItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isAuthenticated) {
      loadHistoryData()
    }
  }, [isAuthenticated])

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      const [filesData, modelsData, statsData] = await Promise.all([
        apiService.getFileHistory({ limit: 50 }),
        apiService.getModelHistory({ limit: 50 }),
        apiService.getUserStats()
      ])
      
      setFiles(filesData)
      setModels(modelsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading history:', error)
      toast.error('Failed to load history data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'training':
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status.toLowerCase() === 'completed' || status.toLowerCase() === 'processed' 
      ? 'default' 
      : status.toLowerCase() === 'failed' || status.toLowerCase() === 'error'
      ? 'destructive'
      : 'secondary'
    
    return <Badge variant={variant}>{status}</Badge>
  }

  const handleDownloadModel = async (modelId: string, modelName: string) => {
    try {
      setDownloadingModels(prev => new Set(prev).add(modelId))
      await apiService.downloadModel(modelId)
      toast.success(`Model "${modelName}" downloaded successfully! 🎉`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download model. Please try again.')
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(modelId)
        return newSet
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to view your history.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6"
              >
                <Sparkles className="w-16 h-16 text-purple-400" />
              </motion.div>
              <p className="text-xl text-purple-200">Loading your AI journey...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-20">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{user?.full_name || user?.username}</span>! 👋
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Your AI-powered data science journey continues. Explore your models, analyze your progress, and unlock new insights.
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-900 text-white rounded-xl transition-all duration-300"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-900 text-white rounded-xl transition-all duration-300"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Files ({files.length})
                </TabsTrigger>
                <TabsTrigger
                  value="models"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-900 text-white rounded-xl transition-all duration-300"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Models ({models.length})
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-900 text-white rounded-xl transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="overview" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <Card className="glass border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Total Files</CardTitle>
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.file_statistics.total_files || 0}</div>
                    <p className="text-sm text-purple-200">
                      {formatFileSize(stats?.file_statistics.total_size_bytes || 0)} total
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Trained Models</CardTitle>
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Brain className="h-5 w-5 text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{stats?.model_statistics.total_models || 0}</div>
                    <p className="text-sm text-purple-200">
                      Across {Object.keys(stats?.model_statistics.by_algorithm || {}).length} algorithms
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats ? Math.round(
                        ((stats.file_statistics.by_status?.processed || 0) /
                         Math.max(stats.file_statistics.total_files, 1)) * 100
                      ) : 0}%
                    </div>
                    <p className="text-sm text-purple-200">
                      Files processed successfully
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{file.original_filename}</p>
                        <p className="text-xs text-gray-500">
                          {file.num_rows} rows × {file.num_columns} columns
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No files uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Recent Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {models.slice(0, 5).map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{model.algorithm}</p>
                        <p className="text-xs text-gray-500">
                          {model.target_column} • {model.model_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(model.status)}
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(model.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {models.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No models trained yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Upload History</CardTitle>
              <CardDescription>
                All files you've uploaded for analysis and model training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{file.original_filename}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)} • {file.num_rows} rows × {file.num_columns} columns
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(file.status)}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No files uploaded yet</p>
                    <Button className="mt-4" onClick={() => window.location.href = '/upload'}>
                      Upload Your First File
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

            <TabsContent value="models" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="glass border-white/20 bg-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-6 w-6 text-purple-400" />
                      Your AI Models Collection
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Download, analyze, and manage your trained machine learning models
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <AnimatePresence>
                        {models.map((model, index) => (
                          <motion.div
                            key={model.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="group relative p-6 border border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                                  <Cpu className="h-8 w-8 text-purple-400" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white mb-1">{model.algorithm}</h3>
                                  <div className="flex items-center gap-4 text-sm text-purple-200 mb-2">
                                    <span className="flex items-center gap-1">
                                      <Target className="h-4 w-4" />
                                      {model.target_column}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Award className="h-4 w-4" />
                                      {model.model_type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-purple-300">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(model.created_at), { addSuffix: true })}
                                    </span>
                                    {model.training_duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {model.training_duration.toFixed(2)}s
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(model.status)}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadModel(model.model_id, model.algorithm)}
                                  disabled={downloadingModels.has(model.model_id)}
                                  className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white transition-all duration-300"
                                >
                                  {downloadingModels.has(model.model_id) ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 mr-2"
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </motion.div>
                                  ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                  )}
                                  {downloadingModels.has(model.model_id) ? 'Downloading...' : 'Download'}
                                </Button>
                                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                  <Zap className="w-4 h-4 mr-2" />
                                  Predict
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {models.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12"
                        >
                          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                            <Brain className="h-12 w-12 text-purple-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">No models trained yet</h3>
                          <p className="text-purple-200 mb-6">Start your AI journey by training your first model</p>
                          <Button
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            onClick={() => window.location.href = '/train'}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Train Your First Model
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      File Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Files:</span>
                      <span className="font-medium">{stats.file_statistics.total_files}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span className="font-medium">{formatFileSize(stats.file_statistics.total_size_bytes)}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">By Status:</p>
                      {Object.entries(stats.file_statistics.by_status).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-sm">
                          <span className="capitalize">{status}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Model Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Models:</span>
                      <span className="font-medium">{stats.model_statistics.total_models}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">By Algorithm:</p>
                      {Object.entries(stats.model_statistics.by_algorithm).map(([algorithm, count]) => (
                        <div key={algorithm} className="flex justify-between text-sm">
                          <span className="capitalize">{algorithm.replace('_', ' ')}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">By Status:</p>
                      {Object.entries(stats.model_statistics.by_status).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-sm">
                          <span className="capitalize">{status}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
