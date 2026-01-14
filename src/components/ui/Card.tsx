import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx(
      'bg-clinical-card rounded-card shadow-card border border-clinical-border',
      className
    )}>
      {children}
    </div>
  )
}
