/**
 * Animated Homepage Component - Client-side only
 */
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  CpuChipIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: CloudArrowUpIcon,
    title: 'Smart Upload',
    description: 'Drag & drop CSV files with intelligent validation and preview',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: ChartBarIcon,
    title: 'Data Profiling',
    description: 'Automatic schema inference, quality analysis, and correlation detection',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: CpuChipIcon,
    title: 'AutoML Pipeline',
    description: 'Train models with RandomForest, XGBoost, and neural networks',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: SparklesIcon,
    title: 'AI Insights',
    description: 'LLM-powered summaries and business recommendations',
    color: 'from-orange-500 to-red-500'
  }
]

const stats = [
  { label: 'Models Trained', value: '1,200+', icon: '🤖' },
  { label: 'Data Processed', value: '50TB+', icon: '📊' },
  { label: 'Accuracy Rate', value: '94%', icon: '🎯' },
  { label: 'Users Active', value: '10K+', icon: '👥' }
]

export default function AnimatedHomepage() {
  const [currentStat, setCurrentStat] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Othor AI</h1>
              <p className="text-purple-200 text-xs">Mini AI Analyst</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center space-x-6"
          >
            <Link href="/upload" className="text-purple-200 hover:text-white transition-colors">Upload</Link>
            <Link href="/models" className="text-purple-200 hover:text-white transition-colors">Models</Link>
            <Link href="/docs" className="text-purple-200 hover:text-white transition-colors">Docs</Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              Data Analysis
            </h1>
            <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto">
              Transform your CSV data into actionable insights with our automated machine learning pipeline. 
              No coding required.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              href="/upload"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                Get Started Free
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <button className="px-8 py-4 border-2 border-purple-400 text-purple-300 rounded-2xl font-semibold text-lg hover:bg-purple-400 hover:text-white transition-all duration-300">
              Watch Demo
            </button>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className={`text-center p-6 rounded-2xl backdrop-blur-sm ${
                  currentStat === index 
                    ? 'bg-white/20 border border-purple-400/50 shadow-lg' 
                    : 'bg-white/10 border border-white/20'
                }`}
                animate={{
                  scale: currentStat === index ? 1.05 : 1,
                  y: currentStat === index ? -5 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-purple-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-6 py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Everything you need to turn raw data into actionable insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-purple-200 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Three simple steps to unlock your data's potential
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Your Data',
                description: 'Drag and drop your CSV file. Our system automatically validates and previews your data.',
                icon: CloudArrowUpIcon
              },
              {
                step: '02', 
                title: 'AI Analysis',
                description: 'Advanced algorithms analyze data quality, detect patterns, and suggest optimal ML approaches.',
                icon: ChartBarIcon
              },
              {
                step: '03',
                title: 'Get Insights',
                description: 'Receive actionable insights, trained models, and predictions ready for business use.',
                icon: SparklesIcon
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent z-0"></div>
                )}
                
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <item.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-purple-400 font-bold text-sm mb-2">STEP {item.step}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-purple-200 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 px-6 py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Data?
            </h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Join thousands of data scientists and analysts who trust Othor AI for their machine learning needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/upload"
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Start Free Analysis
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-purple-300">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                <span>Free forever plan</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
