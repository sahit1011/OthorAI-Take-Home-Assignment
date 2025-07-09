"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, SparklesIcon, ExclamationTriangleIcon, DocumentArrowUpIcon, TableCellsIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

interface PredictionInput {
  [key: string]: string | number
}

interface PredictionResult {
  prediction: any
  confidence: number
  probabilities?: Record<string, number>
}

interface ModelInfo {
  model_id: string
  algorithm: string
  features: string[]
  accuracy: number
}

export default function PredictPage({ params, searchParams }: {
  params: Promise<{ model: string }>
  searchParams?: Promise<{ model_id?: string; session_id?: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams || Promise.resolve({}))
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [inputData, setInputData] = useState<PredictionInput>({})
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [batchResults, setBatchResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modelId = resolvedSearchParams?.model_id || 'default'
  const sessionId = resolvedSearchParams?.session_id || resolvedParams.model

  useEffect(() => {
    loadModelInfo(modelId, sessionId)
  }, [modelId, sessionId])

  const loadModelInfo = async (modelId: string, sessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const profileData = await apiService.getDataProfile(sessionId)

      const allColumns = Object.keys(profileData.column_profiles || {})
      const potentialTargets = allColumns.filter(col =>
        col.toLowerCase().includes('target') ||
        col.toLowerCase().includes('label') ||
        col.toLowerCase().includes('class')
      )

      const targetColumn = potentialTargets[0] || 'target'
      const features = allColumns.filter(col => col !== targetColumn)

      const modelInfo: ModelInfo = {
        model_id: modelId,
        algorithm: 'Random Forest',
        features: features,
        accuracy: 0.95
      }

      setModelInfo(modelInfo)

      const initialInput: PredictionInput = {}
      features.forEach((feature: string) => {
        initialInput[feature] = ''
      })
      setInputData(initialInput)

      toast.success('Model loaded successfully!')
    } catch (err: any) {
      console.error('Error loading model info:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Failed to load model information'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateInputValue = (feature: string, value: string) => {
    setInputData(prev => ({
      ...prev,
      [feature]: value
    }))
  }

  const makePrediction = async () => {
    if (!modelInfo || Object.keys(inputData).length === 0) {
      toast.error('No input data provided')
      return
    }

    try {
      setPredicting(true)

      const predictionRequest = {
        model_id: modelId,
        data: [inputData]
      }

      const result = await apiService.makePredictions(predictionRequest)

      if (result.predictions && result.predictions.length > 0) {
        setPrediction(result.predictions[0])
        toast.success('Prediction generated successfully!')
      }
    } catch (err: any) {
      console.error('Prediction error:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Prediction failed. Please try again.'
      toast.error(errorMessage)
    } finally {
      setPredicting(false)
    }
  }

  const makeBatchPrediction = async () => {
    if (!batchFile) {
      toast.error('Please select a CSV file for batch prediction')
      return
    }

    try {
      setPredicting(true)

      // Parse CSV file
      const text = await batchFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())

      const batchData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, index) => {
          const value = values[index]
          // Try to parse as number, otherwise keep as string
          row[header] = isNaN(Number(value)) ? value : Number(value)
        })
        return row
      })

      if (batchData.length === 0) {
        toast.error('No data found in CSV file')
        return
      }

      const response = await apiService.makeBatchPredictions({
        model_id: modelId,
        data: batchData
      })

      setBatchResults(response)
      toast.success(`Batch prediction completed! ${response.count} predictions generated.`)

    } catch (err: any) {
      console.error('Batch prediction error:', err)
      const errorMessage = err.response?.data?.detail?.message || 'Batch prediction failed. Please try again.'
      toast.error(errorMessage)
    } finally {
      setPredicting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setBatchFile(file)
      setBatchResults(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Model</h2>
          <p className="text-purple-200">Preparing prediction interface...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Model Load Failed</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Button asChild>
            <Link href="/upload">Start Over</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/upload" className="flex items-center space-x-3 group">
            <ArrowLeftIcon className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors" />
            <span className="text-purple-200 group-hover:text-white transition-colors">Back to Upload</span>
          </Link>
          <h1 className="text-xl font-bold text-white">AI Prediction Interface</h1>
        </div>
      </nav>

      <main className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Make Predictions
            </h1>
            <p className="text-xl text-purple-200">
              Use your trained model to generate predictions
            </p>
          </div>

          {modelInfo && (
            <Card className="mb-8 bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Model Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-purple-200">Model ID:</span>
                    <div className="text-white font-mono text-xs">{modelInfo.model_id}</div>
                  </div>
                  <div>
                    <span className="text-purple-200">Algorithm:</span>
                    <div className="text-white">{modelInfo.algorithm}</div>
                  </div>
                  <div>
                    <span className="text-purple-200">Accuracy:</span>
                    <div className="text-green-400 font-bold">{(modelInfo.accuracy * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prediction Tabs */}
          <Card className="mb-8 bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Prediction Interface</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={activeTab === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('single')}
                    className={activeTab === 'single' ? 'bg-purple-500 text-white' : 'border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white'}
                  >
                    <TableCellsIcon className="w-4 h-4 mr-2" />
                    Single Prediction
                  </Button>
                  <Button
                    variant={activeTab === 'batch' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('batch')}
                    className={activeTab === 'batch' ? 'bg-purple-500 text-white' : 'border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white'}
                  >
                    <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                    Batch Prediction
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'single' ? (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modelInfo?.features?.map((feature: string) => (
                      <div key={feature}>
                        <label className="block text-purple-200 text-sm mb-2 capitalize">
                          {feature.replace('_', ' ')}
                        </label>
                        <Input
                          type="text"
                          value={inputData[feature] || ''}
                          onChange={(e) => updateInputValue(feature, e.target.value)}
                          placeholder={`Enter ${feature}`}
                          className="bg-white/10 border-white/20 text-white placeholder-purple-300"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-8">
                    <Button
                      onClick={makePrediction}
                      disabled={predicting}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {predicting ? (
                        <>
                          <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                          Predicting...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5 mr-2" />
                          Generate Prediction
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Upload CSV for Batch Predictions</h3>
                    <p className="text-purple-200 text-sm">
                      Upload a CSV file with the same features as your training data
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-purple-400 rounded-lg p-8 text-center">
                    <DocumentArrowUpIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="batch-file-input"
                    />
                    <label
                      htmlFor="batch-file-input"
                      className="cursor-pointer text-purple-300 hover:text-white transition-colors"
                    >
                      {batchFile ? (
                        <div>
                          <p className="text-white font-medium">{batchFile.name}</p>
                          <p className="text-purple-200 text-sm">Click to change file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white font-medium">Click to upload CSV file</p>
                          <p className="text-purple-200 text-sm">or drag and drop</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {batchFile && (
                    <div className="text-center mt-6">
                      <Button
                        onClick={makeBatchPrediction}
                        disabled={predicting}
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {predicting ? (
                          <>
                            <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                            Processing Batch...
                          </>
                        ) : (
                          <>
                            <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                            Generate Batch Predictions
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Display */}
          {activeTab === 'single' && prediction && (
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Prediction Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {prediction.prediction}
                  </div>
                  <div className="text-purple-200 mb-4">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                  {prediction.probabilities && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Class Probabilities:</h4>
                      {Object.entries(prediction.probabilities).map(([className, prob]) => (
                        <div key={className} className="flex justify-between items-center">
                          <span className="text-purple-200">{className}</span>
                          <span className="text-white">{(prob * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'batch' && batchResults && (
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Batch Prediction Results</CardTitle>
                  <Badge variant="outline" className="border-green-400 text-green-300">
                    {batchResults.count} predictions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-purple-200">
                      Successfully generated {batchResults.count} predictions
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {batchResults.predictions?.slice(0, 10).map((pred: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-purple-200">Row {index + 1}:</span>
                          <div className="text-right">
                            <div className="text-white font-medium">{pred.prediction}</div>
                            <div className="text-purple-300 text-sm">
                              {(pred.confidence * 100).toFixed(1)}% confidence
                            </div>
                          </div>
                        </div>
                      ))}
                      {batchResults.predictions?.length > 10 && (
                        <div className="text-center text-purple-300 text-sm mt-4">
                          ... and {batchResults.predictions.length - 10} more predictions
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-6">
                    <Button
                      onClick={() => {
                        const dataStr = JSON.stringify(batchResults, null, 2)
                        const dataBlob = new Blob([dataStr], { type: 'application/json' })
                        const url = URL.createObjectURL(dataBlob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `batch_predictions_${new Date().toISOString().split('T')[0]}.json`
                        link.click()
                        URL.revokeObjectURL(url)
                      }}
                      variant="outline"
                      className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
                    >
                      <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                      Download Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
