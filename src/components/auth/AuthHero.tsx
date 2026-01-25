'use client'

import React from 'react'

export const AuthHero: React.FC = () => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-clinical-blue-500 to-clinical-green-500 rounded-2xl p-12 text-white">
      <div className="space-y-8 max-w-md">
        {/* Illustration */}
        <svg className="w-full h-auto" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle cx="150" cy="150" r="140" fill="rgba(255, 255, 255, 0.1)" />
          
          {/* Doctor/Provider illustration */}
          <g>
            {/* Head */}
            <circle cx="150" cy="80" r="25" fill="white" />
            
            {/* Stethoscope */}
            <path d="M 130 110 Q 120 120 125 140" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 170 110 Q 180 120 175 140" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="125" cy="150" r="8" fill="white" />
            <circle cx="175" cy="150" r="8" fill="white" />
            
            {/* Body */}
            <rect x="135" y="110" width="30" height="40" fill="white" rx="5" />
            
            {/* Arms with checkmark */}
            <rect x="110" y="125" width="25" height="8" fill="white" rx="4" />
            <rect x="165" y="125" width="25" height="8" fill="white" rx="4" />
            
            {/* Legs */}
            <rect x="138" y="155" width="8" height="35" fill="white" rx="4" />
            <rect x="154" y="155" width="8" height="35" fill="white" rx="4" />
          </g>

          {/* Checkmark icon */}
          <g className="animate-pulse">
            <circle cx="220" cy="100" r="20" fill="rgba(34, 197, 94, 0.8)" />
            <path d="M 215 100 L 218 103 L 225 96" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Shield icon */}
          <g className="animate-pulse" style={{ animationDelay: '0.2s' }}>
            <path d="M 80 120 L 80 160 Q 80 180 100 190 Q 120 180 120 160 L 120 120 Z" stroke="white" strokeWidth="2" fill="rgba(255, 255, 255, 0.2)" />
            <path d="M 90 160 L 95 167 L 110 155" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Data/Records icon */}
          <g className="animate-pulse" style={{ animationDelay: '0.4s' }}>
            <rect x="200" y="180" width="35" height="45" fill="none" stroke="white" strokeWidth="2" rx="3" />
            <line x1="205" y1="190" x2="230" y2="190" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="205" y1="200" x2="230" y2="200" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="205" y1="210" x2="220" y2="210" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>

        {/* Text content */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Comprehensive Care at Your Fingertips</h2>
          <p className="text-lg text-blue-100">
            Manage patient records, clinical notes, prescriptions, and appointments all in one secure platform.
          </p>
          
          {/* Features list */}
          <div className="space-y-3 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm">Secure patient data management</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm">Real-time clinical workflows</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm">HIPAA-compliant infrastructure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
