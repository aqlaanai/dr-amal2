import React from 'react'
import clsx from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-clinical-text-primary mb-2">
        {label}
      </label>
      <select
        className={clsx(
          'w-full px-4 py-3 rounded-lg border bg-white',
          'text-clinical-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-clinical-blue-500 focus:border-transparent',
          'transition-all duration-200 cursor-pointer',
          error ? 'border-clinical-danger' : 'border-clinical-border',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-clinical-danger">{error}</p>
      )}
    </div>
  )
}
