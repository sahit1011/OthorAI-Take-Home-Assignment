import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <>
      <Head>
        <title>Othor AI - Mini AI Analyst as a Service</title>
        <meta name="description" content="Upload CSV files, analyze data, and train ML models" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Othor AI
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Mini AI Analyst as a Service
            </p>
            <p className="text-gray-500">
              Upload CSV files, analyze data, and train ML models instantly
            </p>
          </header>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Get Started
                  </h2>
                  <p className="text-gray-600">
                    Upload your CSV file to begin data analysis and model training
                  </p>
                </div>

                {/* Quick Start Steps */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                      1
                    </div>
                    <h3 className="font-semibold mb-2">Upload CSV</h3>
                    <p className="text-sm text-gray-600">Upload your dataset (up to 50MB)</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                      2
                    </div>
                    <h3 className="font-semibold mb-2">Analyze Data</h3>
                    <p className="text-sm text-gray-600">Get insights and data profiling</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                      3
                    </div>
                    <h3 className="font-semibold mb-2">Train Model</h3>
                    <p className="text-sm text-gray-600">Build and evaluate ML models</p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setIsLoading(true)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? 'Loading...' : 'Start Analysis'}
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">🔍 Data Profiling</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic schema inference</li>
                  <li>• Statistical analysis</li>
                  <li>• Correlation detection</li>
                  <li>• Data quality assessment</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">🤖 AutoML Pipeline</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic preprocessing</li>
                  <li>• Model selection</li>
                  <li>• Performance evaluation</li>
                  <li>• Feature importance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
