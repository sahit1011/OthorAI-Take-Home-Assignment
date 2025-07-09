/**
 * Data Profiling page - Shows dataset analysis, correlations, and quality metrics
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiService, handleApiError } from '../services/api';
import ClientOnly from '../components/ClientOnly';
import toast from 'react-hot-toast';

interface ProfileData {
  session_id: string;
  dataset_info: {
    rows: number;
    columns: number;
    memory_usage: string;
    missing_values_total: number;
    duplicate_rows: number;
  };
  column_profiles: Record<string, any>;
  correlations: Record<string, number>;
  data_quality: {
    completeness: number;
    duplicate_rows: number;
    empty_columns: string[];
    constant_columns: string[];
  };
  timestamp: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { session } = router.query;
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  useEffect(() => {
    if (session && typeof session === 'string') {
      loadProfileData(session);
    }
  }, [session]);

  const loadProfileData = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDataProfile(sessionId);
      setProfileData(data);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      toast.error(`Failed to load profile: ${errorInfo.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
          >
            <SparklesIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Data</h2>
          <p className="text-purple-200">Generating comprehensive profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Analysis Failed</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Link
            href="/upload"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all duration-300"
          >
            Upload New File
          </Link>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const qualityScore = Math.round(profileData.data_quality.completeness);
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <Head>
        <title>Data Profile - Othor AI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/upload" className="flex items-center space-x-3 group">
              <ArrowLeftIcon className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">Othor AI</h1>
                  <p className="text-purple-200 text-xs">Data Profile</p>
                </div>
              </div>
            </Link>
          </div>
        </nav>

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
                  Dataset Analysis
                </h1>
                <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                  Comprehensive profiling and quality assessment of your data
                </p>
              </motion.div>
            </div>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Rows', value: profileData.dataset_info.rows.toLocaleString(), icon: '📊' },
                { label: 'Columns', value: profileData.dataset_info.columns.toString(), icon: '📋' },
                { label: 'Memory Usage', value: profileData.dataset_info.memory_usage, icon: '💾' },
                { label: 'Data Quality', value: `${qualityScore}%`, icon: '✅', color: getQualityColor(qualityScore) }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className={`text-2xl font-bold mb-1 ${item.color || 'text-white'}`}>
                    {item.value}
                  </div>
                  <div className="text-purple-200 text-sm">{item.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Data Quality Issues */}
            {(profileData.data_quality.empty_columns.length > 0 || 
              profileData.data_quality.constant_columns.length > 0 || 
              profileData.dataset_info.duplicate_rows > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8 p-6 bg-yellow-500/20 border border-yellow-400/50 rounded-2xl"
              >
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mr-3" />
                  <h3 className="text-xl font-bold text-white">Data Quality Issues</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {profileData.dataset_info.duplicate_rows > 0 && (
                    <div className="text-yellow-200">
                      <strong>{profileData.dataset_info.duplicate_rows}</strong> duplicate rows found
                    </div>
                  )}
                  {profileData.data_quality.empty_columns.length > 0 && (
                    <div className="text-yellow-200">
                      <strong>{profileData.data_quality.empty_columns.length}</strong> empty columns detected
                    </div>
                  )}
                  {profileData.data_quality.constant_columns.length > 0 && (
                    <div className="text-yellow-200">
                      <strong>{profileData.data_quality.constant_columns.length}</strong> constant columns found
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Column Profiles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Column Analysis</h3>
              <div className="grid gap-4">
                {Object.entries(profileData.column_profiles).map(([column, profile]: [string, any]) => (
                  <div
                    key={column}
                    className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">{column}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        profile.type === 'numerical' ? 'bg-blue-500/20 text-blue-300' :
                        profile.type === 'categorical' ? 'bg-green-500/20 text-green-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {profile.type}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div className="text-purple-200">
                        <span className="text-white font-medium">Unique Values:</span> {profile.unique_values}
                      </div>
                      <div className="text-purple-200">
                        <span className="text-white font-medium">Missing:</span> {profile.null_percentage}%
                      </div>
                      {profile.mean && (
                        <div className="text-purple-200">
                          <span className="text-white font-medium">Mean:</span> {profile.mean.toFixed(2)}
                        </div>
                      )}
                      {profile.std && (
                        <div className="text-purple-200">
                          <span className="text-white font-medium">Std Dev:</span> {profile.std.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href={`/train?session=${session}`}
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Continue to Model Training
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <button
                onClick={() => router.back()}
                className="px-8 py-4 border-2 border-purple-400 text-purple-300 rounded-2xl font-semibold hover:bg-purple-400 hover:text-white transition-all duration-300"
              >
                Back to Upload
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
