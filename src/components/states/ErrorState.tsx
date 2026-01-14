import React from 'react'
import { Alert } from '@/components/ui/Alert'

interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  retry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Alert type="danger" message={message} />
        {retry && (
          <div className="text-center mt-4">
            <button
              onClick={retry}
              className="text-sm font-medium text-clinical-blue-600 hover:text-clinical-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
