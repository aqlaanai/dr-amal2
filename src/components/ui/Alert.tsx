import React from 'react'
import clsx from 'clsx'

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'danger'
  message: string
  className?: string
}

export const Alert: React.FC<AlertProps> = ({ type, message, className }) => {
  const styles = {
    info: 'bg-clinical-blue-50 text-clinical-blue-700 border-clinical-blue-100',
    success: 'bg-green-50 text-green-700 border-green-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
  }

  return (
    <div className={clsx(
      'px-4 py-3 rounded-lg border',
      styles[type],
      className
    )}>
      <p className="text-sm">{message}</p>
    </div>
  )
}
