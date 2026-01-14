import React from 'react'

interface NoPermissionProps {
  message?: string
}

export const NoPermission: React.FC<NoPermissionProps> = ({
  message = 'You do not have permission to access this resource.',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 text-clinical-text-muted flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-clinical-text-primary mb-2">
        Access Restricted
      </h3>
      <p className="text-sm text-clinical-text-secondary text-center max-w-md">
        {message}
      </p>
    </div>
  )
}
