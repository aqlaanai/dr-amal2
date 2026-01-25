'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, Bell, User, LogOut, Search, Settings, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'info' | 'warning' | 'success'
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Lab Results',
      message: 'Lab results for John Doe are now available',
      timestamp: '2 minutes ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Appointment Reminder',
      message: 'You have an appointment with Jane Smith in 30 minutes',
      timestamp: '1 hour ago',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Note Finalized',
      message: 'Clinical note for patient #123 has been finalized',
      timestamp: '3 hours ago',
      read: true,
      type: 'success'
    }
  ])

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  return (
    <header className="bg-white border-b border-clinical-border px-4 py-3 lg:px-6 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Menu button, logo, and search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-clinical-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-primary focus:ring-offset-2"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-clinical-text-secondary" />
          </button>

          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-clinical-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-clinical-text-primary">
                Drama Healthcare
              </h1>
              <p className="text-xs text-clinical-text-secondary">Clinical Management System</p>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile, visible on tablet+ */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-clinical-text-secondary" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, notes, prescriptions..."
                className="block w-full pl-10 pr-3 py-2 border border-clinical-border rounded-lg bg-clinical-bg focus:ring-2 focus:ring-clinical-primary focus:border-transparent text-sm placeholder-clinical-text-secondary"
              />
            </form>
          </div>
        </div>

        {/* Right: Notifications and user menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button
            className="md:hidden p-2 hover:bg-clinical-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-primary"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-clinical-text-secondary" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
              className="relative p-2 hover:bg-clinical-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-primary"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5 text-clinical-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-clinical-border z-50">
                <div className="p-4 border-b border-clinical-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-clinical-text-primary">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-clinical-hover rounded"
                    >
                      <X className="w-4 h-4 text-clinical-text-secondary" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-clinical-text-secondary text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-clinical-border hover:bg-clinical-hover cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.type === 'warning' ? 'bg-yellow-400' :
                            notification.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-clinical-text-primary truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-clinical-text-secondary mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-clinical-text-secondary mt-1">
                              {notification.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-clinical-border">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Notifications
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2 p-2 hover:bg-clinical-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-primary"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-clinical-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-clinical-text-primary">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-clinical-text-secondary capitalize">
                  {user?.role || 'provider'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-clinical-text-secondary" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-clinical-border z-50">
                <div className="p-4 border-b border-clinical-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-clinical-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-clinical-text-primary">
                        {user?.email || 'user@example.com'}
                      </p>
                      <p className="text-xs text-clinical-text-secondary capitalize">
                        {user?.role || 'provider'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-sm text-clinical-text-primary hover:bg-clinical-hover flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-clinical-text-primary hover:bg-clinical-hover flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <div className="border-t border-clinical-border my-1" />
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
