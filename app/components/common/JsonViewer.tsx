'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import CopyButton from './CopyButton'

interface JsonViewerProps {
  data: any
  maxDepth?: number
  currentDepth?: number
}

export default function JsonViewer({ data, maxDepth = 3, currentDepth = 0 }: JsonViewerProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const toggleKey = (key: string) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedKeys(newExpanded)
  }

  const renderValue = (value: any, key: string, path: string = '') => {
    const fullPath = path ? `${path}.${key}` : key

    if (value === null) {
      return <span className="text-gray-500">null</span>
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-600">{value.toString()}</span>
    }

    if (typeof value === 'number') {
      return <span className="text-green-600">{value}</span>
    }

    if (typeof value === 'string') {
      return <span className="text-red-600">"{value}"</span>
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(fullPath)
      const shouldCollapse = currentDepth >= maxDepth && value.length > 0

      return (
        <div>
          <button
            onClick={() => toggleKey(fullPath)}
            className="flex items-center space-x-1 hover:bg-gray-100 px-1 rounded"
          >
            {value.length > 0 && (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </>
            )}
            <span className="text-gray-700">[{value.length}]</span>
          </button>
          {isExpanded && !shouldCollapse && (
            <div className="ml-4 border-l border-gray-200 pl-2">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500 text-sm">{index}: </span>
                  {renderValue(item, index.toString(), fullPath)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value)
      const isExpanded = expandedKeys.has(fullPath)
      const shouldCollapse = currentDepth >= maxDepth && keys.length > 0

      return (
        <div>
          <button
            onClick={() => toggleKey(fullPath)}
            className="flex items-center space-x-1 hover:bg-gray-100 px-1 rounded"
          >
            {keys.length > 0 && (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </>
            )}
            <span className="text-gray-700">{`{${keys.length}}`}</span>
          </button>
          {isExpanded && !shouldCollapse && (
            <div className="ml-4 border-l border-gray-200 pl-2">
              {keys.map((objKey) => (
                <div key={objKey} className="py-1">
                  <span className="text-blue-800 font-medium text-sm">"{objKey}": </span>
                  {renderValue(value[objKey], objKey, fullPath)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return <span className="text-gray-600">{String(value)}</span>
  }

  return (
    <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-auto max-h-96">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-sans">JSON Data</span>
        <CopyButton 
          text={JSON.stringify(data, null, 2)} 
          size="sm"
          className="text-xs"
        />
      </div>
      <div className="space-y-1">
        {typeof data === 'object' && data !== null ? (
          Object.keys(data).map((key) => (
            <div key={key} className="flex items-start space-x-2">
              <span className="text-blue-800 font-medium">"{key}":</span>
              <div className="flex-1">
                {renderValue(data[key], key)}
              </div>
            </div>
          ))
        ) : (
          renderValue(data, 'root')
        )}
      </div>
    </div>
  )
}