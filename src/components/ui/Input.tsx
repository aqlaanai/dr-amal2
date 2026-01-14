import React, { useState } from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  type = 'text',
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-clinical-text-primary mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          className={clsx(
            'w-full px-4 py-3 rounded-lg border bg-white',
            'text-clinical-text-primary placeholder:text-clinical-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-clinical-blue-500 focus:border-transparent',
            'transition-all duration-200',
            error ? 'border-clinical-danger' : 'border-clinical-border',
            isPassword && 'pr-12',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-clinical-text-secondary hover:text-clinical-text-primary transition-colors"
          >
            {showPassword ? (
              <EyeOffIcon />
            ) : (
              <EyeIcon />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-clinical-danger">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-clinical-text-secondary">{helperText}</p>
      )}
    </div>
  )
}

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
)
