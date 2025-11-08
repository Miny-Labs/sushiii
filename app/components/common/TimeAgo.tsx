'use client'

import { useEffect, useState } from 'react'

interface TimeAgoProps {
  timestamp: string | Date
  className?: string
}

export default function TimeAgo({ timestamp, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date()
      const time = new Date(timestamp)
      const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds}s ago`)
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        setTimeAgo(`${minutes}m ago`)
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        setTimeAgo(`${hours}h ago`)
      } else {
        const days = Math.floor(diffInSeconds / 86400)
        setTimeAgo(`${days}d ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <time 
      className={`font-mono text-xs text-muted-foreground ${className}`}
      dateTime={new Date(timestamp).toISOString()}
    >
      {timeAgo}
    </time>
  )
}