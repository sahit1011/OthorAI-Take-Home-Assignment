"use client"

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Custom hook to handle authentication-based redirects
 * Returns a function that checks auth status and redirects accordingly
 */
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const handleAuthRedirect = (targetPath: string) => {
    // If still loading, don't do anything
    if (isLoading) {
      return
    }

    // If authenticated, go to target path
    if (isAuthenticated) {
      router.push(targetPath)
    } else {
      // If not authenticated, redirect to login immediately
      router.push('/login')
    }
  }

  return {
    handleAuthRedirect,
    isAuthenticated,
    isLoading
  }
}
