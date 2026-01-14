import React from 'react'
import clsx from 'clsx'

interface DataTableProps {
  columns: Array<{
    key: string
    label: string
    width?: string
  }>
  data: Array<Record<string, any>>
  emptyMessage?: string
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  emptyMessage = 'No data available',
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-card border border-clinical-border">
        <div className="p-8 text-center text-clinical-text-secondary">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card border border-clinical-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-clinical-border">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-clinical-text-secondary uppercase tracking-wider',
                    column.width && `w-${column.width}`
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-clinical-border">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-clinical-text-primary"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
