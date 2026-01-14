import React from 'react'
import clsx from 'clsx'

interface TabsProps {
  tabs: Array<{ id: string; label: string }>
  activeTab: string
  onChange: (tabId: string) => void
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-pill">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-6 py-2 rounded-pill font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-white text-clinical-text-primary shadow-soft'
              : 'text-clinical-text-secondary hover:text-clinical-text-primary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
