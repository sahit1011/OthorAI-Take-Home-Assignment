"use client"

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

export default function ConditionalNavigation() {
  const pathname = usePathname()
  
  // Hide navigation on authentication pages
  const hideNavigation = pathname === '/login' || pathname === '/signup'
  
  if (hideNavigation) {
    return null
  }
  
  return <Navigation />
}
