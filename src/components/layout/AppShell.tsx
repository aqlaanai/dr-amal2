'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { LoadingState } from '@/components/states/LoadingState'

interface AppShellProps {
  children: React.ReactNode
  loading?: boolean
}

export const AppShell: React.FC<AppShellProps> = ({ children, loading = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <div className="flex h-screen bg-clinical-bg overflow-hidden">
      {/* Sidebar - Hidden on mobile, overlay on tablet, fixed on desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingState message="Loading application..." />
            </div>
          ) : (
            <div className="min-h-full">
              {children}
            </div>
          )}
        </main>

        {/* Mobile overlay with improved animation */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ease-in-out"
            onClick={() => setSidebarOpen(false)}
            style={{ backdropFilter: 'blur(2px)' }}
          />
        )}
      </div>
    </div>
  )
}
