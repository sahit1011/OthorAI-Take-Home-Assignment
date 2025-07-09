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
  HardDrive
} from 'lucide-react'

export default function HistoryPage() {
  const { user, isAuthenticated } = useAuth()
  const [files, setFiles] = useState<FileHistoryItem[]>([])
  const [models, setModels] = useState<ModelHistoryItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name || user?.username}!
        </h1>
        <p className="text-gray-600">
          Here's your complete activity history and statistics.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="models">Models ({models.length})</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.file_statistics.total_files || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(stats?.file_statistics.total_size_bytes || 0)} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trained Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.model_statistics.total_models || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across {Object.keys(stats?.model_statistics.by_algorithm || {}).length} algorithms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? Math.round(
                    ((stats.file_statistics.by_status?.processed || 0) / 
                     Math.max(stats.file_statistics.total_files, 1)) * 100
                  ) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Files processed successfully
                </p>
              </CardContent>
            </Card>
          </div>

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

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Training History</CardTitle>
              <CardDescription>
                All machine learning models you've trained
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Brain className="h-8 w-8 text-purple-500" />
                      <div>
                        <h3 className="font-medium">{model.algorithm}</h3>
                        <p className="text-sm text-gray-500">
                          Target: {model.target_column} • Type: {model.model_type}
                        </p>
                        <p className="text-xs text-gray-400">
                          Trained {formatDistanceToNow(new Date(model.created_at), { addSuffix: true })}
                          {model.training_duration && ` • ${model.training_duration.toFixed(2)}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(model.status)}
                      <Button variant="outline" size="sm">
                        View Model
                      </Button>
                    </div>
                  </div>
                ))}
                {models.length === 0 && (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No models trained yet</p>
                    <Button className="mt-4" onClick={() => window.location.href = '/train'}>
                      Train Your First Model
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
  )
}
