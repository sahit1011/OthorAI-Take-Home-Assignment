"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  XMarkIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  LightBulbIcon
} from "@heroicons/react/24/outline"

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  summary: string
  insights?: string[]
  dataQualityScore?: number
  type: 'dataset' | 'model'
}

export function SummaryModal({ 
  isOpen, 
  onClose, 
  title, 
  summary, 
  insights = [], 
  dataQualityScore,
  type 
}: SummaryModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-purple-400/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-400/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                {type === 'dataset' ? (
                  <ChartBarIcon className="w-5 h-5 text-white" />
                ) : (
                  <SparklesIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-purple-200 text-sm">
                  {type === 'dataset' ? 'Dataset Analysis Summary' : 'Model Training Summary'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-purple-300 hover:text-white hover:bg-purple-500/20"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {/* Data Quality Score (for dataset summaries) */}
              {type === 'dataset' && dataQualityScore !== undefined && (
                <Card className="glass border-purple-400/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-2" />
                      Data Quality Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              dataQualityScore >= 0.8 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              dataQualityScore >= 0.6 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${dataQualityScore * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`font-bold text-lg ${
                        dataQualityScore >= 0.8 ? 'text-green-400' :
                        dataQualityScore >= 0.6 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {(dataQualityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Summary */}
              <Card className="glass border-purple-400/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    AI-Generated Summary
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Comprehensive analysis powered by OpenRouter + DeepSeek
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {summary}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              {insights.length > 0 && (
                <Card className="glass border-purple-400/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center">
                      <LightBulbIcon className="w-5 h-5 mr-2" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-200 text-sm">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-purple-400/30">
            <p className="text-purple-300 text-sm">
              Generated with AI • Powered by OpenRouter + DeepSeek
            </p>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
