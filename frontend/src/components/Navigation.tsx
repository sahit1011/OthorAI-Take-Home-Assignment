"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Upload, 
  BarChart3, 
  Brain, 
  Zap, 
  History, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  requiresAuth?: boolean
}

const navigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    description: 'Dashboard overview'
  },
  {
    name: 'Upload',
    href: '/upload',
    icon: Upload,
    description: 'Upload CSV files for analysis'
  },
  {
    name: 'History',
    href: '/history',
    icon: History,
    description: 'View your files and models',
    requiresAuth: true
  }
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isCurrentPath = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const filteredNavigation = navigation.filter(item =>
    !item.requiresAuth || isAuthenticated
  )

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-20">
            {/* Logo with enhanced styling */}
            <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:rotate-3">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <div className="transition-all duration-300">
                <h1 className="text-xl font-bold text-white group-hover:text-purple-200">Othor AI</h1>
                <p className="text-sm text-gray-300 group-hover:text-purple-300">Mini AI Analyst</p>
              </div>
            </Link>

            {/* Navigation Links with enhanced card effects */}
            <div className="flex items-center space-x-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = isCurrentPath(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-lg shadow-purple-500/25 border border-purple-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/10'
                    }`}
                  >
                    {/* Background glow effect */}
                    <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-100'
                        : 'bg-white/5 opacity-0 group-hover:opacity-100'
                    }`}></div>

                    {/* Content */}
                    <div className="relative flex items-center space-x-2">
                      <Icon className={`h-4 w-4 transition-all duration-300 ${
                        isActive ? 'text-purple-300' : 'group-hover:text-purple-300'
                      }`} />
                      <span className="transition-all duration-300">{item.name}</span>
                    </div>

                    {/* Expanding underline effect */}
                    <div className={`absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ${
                      isActive
                        ? 'w-full -translate-x-1/2'
                        : 'w-0 group-hover:w-full -translate-x-1/2'
                    }`}></div>
                  </Link>
                )
              })}
            </div>

            {/* User Menu with enhanced styling */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium text-white">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-purple-300">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="group relative px-4 py-2 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:scale-105"
                  >
                    <LogOut className="h-4 w-4 group-hover:text-red-300 transition-colors duration-300" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group relative px-6 py-2 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:scale-105 hover:border-white/40"
                    >
                      <span className="relative z-10">Login</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="group relative px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transform"
                    >
                      <span className="relative z-10 font-medium">Sign Up</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="group flex items-center space-x-3 transition-all duration-300">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <span className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors duration-300">Othor AI</span>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="group relative p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
            >
              <div className="relative z-10">
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 group-hover:text-purple-300 transition-colors duration-300" />
                ) : (
                  <Menu className="h-6 w-6 group-hover:text-purple-300 transition-colors duration-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="pb-6 border-t border-white/10 mt-4 bg-black/20 backdrop-blur-sm rounded-b-2xl">
              <div className="space-y-3 pt-6 px-2">
                {filteredNavigation.map((item, index) => {
                  const Icon = item.icon
                  const isActive = isCurrentPath(item.href)

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group relative flex items-center space-x-4 px-4 py-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-lg shadow-purple-500/25 border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/10'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Background glow effect */}
                      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-100'
                          : 'bg-white/5 opacity-0 group-hover:opacity-100'
                      }`}></div>

                      {/* Content */}
                      <div className="relative flex items-center space-x-4 w-full">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isActive
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-white/10 text-gray-400 group-hover:bg-purple-500/20 group-hover:text-purple-300'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-400 group-hover:text-purple-300 transition-colors duration-300">{item.description}</div>
                        </div>
                      </div>

                      {/* Expanding border effect */}
                      <div className={`absolute left-0 top-1/2 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full transition-all duration-300 ${
                        isActive
                          ? 'h-full -translate-y-1/2'
                          : 'h-0 group-hover:h-full -translate-y-1/2'
                      }`}></div>
                    </Link>
                  )
                })}
              </div>

              {/* Mobile User Menu */}
              <div className="mt-6 pt-6 border-t border-white/10 px-2">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-sm font-medium text-white">
                        {user?.full_name || user?.username}
                      </p>
                      <p className="text-xs text-purple-300">{user?.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="group relative w-full justify-start px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
                    >
                      <LogOut className="h-4 w-4 mr-3 group-hover:text-red-300 transition-colors duration-300" />
                      <span className="font-medium">Logout</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group relative w-full justify-start px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:border-white/40"
                      >
                        <User className="h-4 w-4 mr-3 group-hover:text-purple-300 transition-colors duration-300" />
                        <span className="font-medium">Login</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        size="sm"
                        className="group relative w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02]"
                      >
                        <span className="relative z-10 font-medium">Sign Up</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-20"></div>
    </>
  )
}
