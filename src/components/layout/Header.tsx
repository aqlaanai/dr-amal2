'use client'

import React from 'react'
import { useRole } from '@/contexts/RoleContext'

export const Header: React.FC = () => {
  const { role } = useRole()

  return (
    <header className="h-16 bg-white border-b border-clinical-border flex items-center justify-between px-6">
      {/* Left side - conditional based on role */}
      <div className="flex items-center gap-4">
        {role === 'provider' && (
          <div className="relative">
            <input
              type="search"
              placeholder="Search patients, sessions..."
              className="w-80 h-10 pl-10 pr-4 rounded-lg border border-clinical-border focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:border-transparent text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Right side - all roles show profile, providers also show notifications */}
      <div className="flex items-center gap-4">
        {role === 'provider' && (
          <button className="relative p-2 text-clinical-text-muted hover:text-clinical-text-primary transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-clinical-blue rounded-full"></span>
          </button>
        )}

        {role === 'admin' && (
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-clinical-text-secondary hover:text-clinical-text-primary transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Admin Menu</span>
          </button>
        )}

        {/* Profile - shown for all roles */}
        <div className="flex items-center gap-3 pl-4 border-l border-clinical-border">
          <div className="text-right">
            <p className="text-sm font-medium text-clinical-text-primary">
              {role === 'provider' && 'Dr. Sarah Williams'}
              {role === 'admin' && 'System Admin'}
              {role === 'parent' && 'John Smith'}
            </p>
            <p className="text-xs text-clinical-text-muted capitalize">
              {role === 'provider' ? 'Healthcare Provider' : role}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-clinical-blue to-clinical-purple flex items-center justify-center text-white text-sm font-medium">
            {role === 'provider' && 'SW'}
            {role === 'admin' && 'SA'}
            {role === 'parent' && 'JS'}
          </div>
        </div>
      </div>
    </header>
  )
}
