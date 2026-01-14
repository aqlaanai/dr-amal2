import React from 'react'

interface ReadOnlyBannerProps {
  message?: string
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({
  message = 'This view is read-only. Changes cannot be made.',
}) => {
  return (
    <div className="bg-clinical-blue-50 border-l-4 border-clinical-blue-500 px-4 py-3">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-clinical-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-clinical-blue-700">{message}</p>
      </div>
    </div>
  )
}
