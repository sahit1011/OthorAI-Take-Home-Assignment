"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import {
  CloudArrowUpIcon,
  ChartBarIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline"

const features = [
  {
    icon: CloudArrowUpIcon,
    title: "Smart Upload",
    description: "Drag & drop CSV files with intelligent validation and preview",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: ChartBarIcon,
    title: "Data Profiling",
    description: "Automatic schema inference, quality analysis, and correlation detection",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: CpuChipIcon,
    title: "AutoML Pipeline",
    description: "Train models with RandomForest, XGBoost, and neural networks",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: SparklesIcon,
    title: "AI Insights",
    description: "LLM-powered summaries and business recommendations",
    color: "from-orange-500 to-red-500"
  }
]


// Sample recent activity data (in a real app, this would come from an API)
const recentActivity = [
  {
    id: 1,
    type: 'upload',
    title: 'Customer Data Analysis',
    description: 'Uploaded customer_data.csv (2.3MB)',
    timestamp: '2 hours ago',
    status: 'completed',
    sessionId: 'sample-session-1'
  },
  {
    id: 2,
    type: 'model',
    title: 'Sales Prediction Model',
    description: 'Random Forest trained with 94.2% accuracy',
    timestamp: '5 hours ago',
    status: 'completed',
    modelId: 'sample-model-1'
  },
  {
    id: 3,
    type: 'analysis',
    title: 'Product Performance Dataset',
    description: 'Data profiling completed - 15 features analyzed',
    timestamp: '1 day ago',
    status: 'completed',
    sessionId: 'sample-session-2'
  }
]

const quickActions = [
  {
    title: 'Upload New Dataset',
    description: 'Start with CSV file upload and analysis',
    icon: CloudArrowUpIcon,
    href: '/upload',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'View Your Models',
    description: 'Manage and explore trained models',
    icon: CpuChipIcon,
    href: '/models',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Try Sample Model',
    description: 'Test predictions with a trained model',
    icon: PlayIcon,
    href: '/predict/sample-model',
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Documentation',
    description: 'Learn how to use Othor AI',
    icon: DocumentTextIcon,
    href: '/docs',
    color: 'from-orange-500 to-red-500'
  }
]

export default function Home() {
  const [showRecentActivity, setShowRecentActivity] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()

  useEffect(() => {
    // Show recent activity after initial animations
    const timer = setTimeout(() => setShowRecentActivity(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    logout()
  }
  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              <span className="gradient-text animate-gradient-x">
                AI-Powered
              </span>
              <br />
              Data Analysis
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-purple-200 mb-8 max-w-4xl mx-auto px-8 leading-relaxed">
              Transform your CSV data into actionable insights with our automated machine learning pipeline.<br />
              No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="xl" className="group">
                <Link href="/upload">
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Link href={action.href}>
                  <div className="text-center p-6 rounded-2xl glass hover-glow cursor-pointer transition-all duration-300">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-lg font-bold text-white mb-1">{action.title}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Everything you need to turn raw data into intelligent insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
              >
                <Card className="h-full hover-glow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-purple-200">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>



      {/* Recent Activity */}
      {showRecentActivity && (
        <div className="relative z-10 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Recent Activity
              </h2>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Your latest data analysis and model training sessions
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-6">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ x: 10 }}
                >
                  <Card className="glass hover-glow cursor-pointer transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            activity.type === 'upload' ? 'bg-blue-500/20' :
                            activity.type === 'model' ? 'bg-green-500/20' :
                            'bg-purple-500/20'
                          }`}>
                            {activity.type === 'upload' && <CloudArrowUpIcon className="w-6 h-6 text-blue-400" />}
                            {activity.type === 'model' && <CpuChipIcon className="w-6 h-6 text-green-400" />}
                            {activity.type === 'analysis' && <ChartBarIcon className="w-6 h-6 text-purple-400" />}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{activity.title}</h3>
                            <p className="text-purple-200 text-sm">{activity.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <ClockIcon className="w-4 h-4 text-purple-300" />
                              <span className="text-purple-300 text-xs">{activity.timestamp}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-400" />
                          <ArrowRightIcon className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Demo */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              See It In Action
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Experience the power of automated data analysis with our interactive demo
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Demo Steps */}
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Upload & Analyze",
                  description: "Drop your CSV file and watch our AI instantly analyze data types, quality, and patterns",
                  features: ["Schema inference", "Quality assessment", "Missing value detection"]
                },
                {
                  step: "02",
                  title: "Train & Optimize",
                  description: "Our AutoML pipeline automatically selects the best algorithms and hyperparameters",
                  features: ["Algorithm selection", "Feature engineering", "Model evaluation"]
                },
                {
                  step: "03",
                  title: "Predict & Insights",
                  description: "Get predictions with confidence scores and AI-powered business recommendations",
                  features: ["Real-time predictions", "LLM-generated insights", "Actionable recommendations"]
                }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className="flex space-x-6"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{item.step}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-purple-200 mb-4">{item.description}</p>
                    <div className="space-y-2">
                      {item.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          <span className="text-purple-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Demo Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <Card className="glass-strong p-8">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-white mb-2">Live Demo</h4>
                  <p className="text-purple-200">Try our sample dataset analysis</p>
                </div>

                {/* Mock Dashboard Preview */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-3 rounded-lg text-center">
                      <div className="text-white font-bold">1,250</div>
                      <div className="text-blue-300 text-xs">Rows</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-lg text-center">
                      <div className="text-white font-bold">15</div>
                      <div className="text-green-300 text-xs">Features</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 rounded-lg text-center">
                      <div className="text-white font-bold">94.2%</div>
                      <div className="text-purple-300 text-xs">Accuracy</div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">Data Quality</span>
                      <span className="text-green-400 text-sm font-bold">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>

                  <Button asChild className="w-full group">
                    <Link href="/upload">
                      Try With Your Data
                      <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Data?
            </h2>
            <p className="text-xl text-purple-200 mb-8">
              Join thousands of data professionals who trust Othor AI for their analytics needs
            </p>
            <Button asChild size="xl" className="group">
              <Link href="/upload">
                Start Your Free Analysis
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
