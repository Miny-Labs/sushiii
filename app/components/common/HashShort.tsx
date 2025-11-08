'use client'

import { useState } from 'react'
import CopyButton from './CopyButton'
import { cn } from '@/lib/utils'

interface HashShortProps {
  hash: string
  startChars?: number
  endChars?: number
  showTooltip?: boolean
  className?: string
  showCopy?: boolean
}

export default function HashShort({ 
  hash, 
  startChars = 6, 
  endChars = 6, 
  showTooltip = true,
  className,
  showCopy = true
}: HashShortProps) {
  const [showFull, setShowFull] = useState(false)
  
  if (!hash) return null

  const shortHash = hash.length > startChars + endChars + 3 
    ? `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
    : hash

  return (
    <div className="flex items-center space-x-2">
      <code 
        className={cn(
          'font-mono text-sm cursor-pointer hover:text-foreground transition-colors',
          showTooltip && 'underline decoration-dotted',
          className
        )}
        onClick={() => showTooltip && setShowFull(!showFull)}
        title={showTooltip ? (showFull ? 'Click to collapse' : hash) : undefined}
      >
        {showFull ? hash : shortHash}
      </code>
      {showCopy && (
        <CopyButton 
          text={hash} 
          size="sm" 
          className="w-4 h-4 p-0"
        />
      )}
    </div>
  )
}