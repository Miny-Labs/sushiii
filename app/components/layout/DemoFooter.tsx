'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function DemoFooter() {
  const { data: health } = useQuery({
    queryKey: ['health-status'],
    queryFn: () => api.getHealth(),
    refetchInterval: 10000,
  })

  const buildCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT || 'dev-build'
  const metagraphId = process.env.NEXT_PUBLIC_METAGRAPH_ID || 'DAG8PFmtdgiUei2TaZ2NemkNnVBFwkAV6y5kyd2n'
  const networkType = process.env.NEXT_PUBLIC_NETWORK_TYPE || 'Local'
  
  const shortMetagraphId = `${metagraphId.slice(0, 6)}...${metagraphId.slice(-6)}`
  const apiStatus = health?.data ? '●' : '○'

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-6">
            <span>Build: {buildCommit.slice(0, 7)}</span>
            <span className="px-2 py-1 border border-border">
              {networkType}
            </span>
            <span>ID: {shortMetagraphId}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>API</span>
            <span className={health?.data ? 'text-foreground' : 'text-muted-foreground'}>
              {apiStatus}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}