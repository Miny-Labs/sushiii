'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import HashShort from '@/components/common/HashShort'
import api from '@/lib/api'

export default function NetworkStatus() {
  const { data: health } = useQuery({
    queryKey: ['network-health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 5000,
  })

  const metagraphId = process.env.NEXT_PUBLIC_METAGRAPH_ID || 'DAG8PFmtdgiUei2TaZ2NemkNnVBFwkAV6y5kyd2n'
  const networkType = process.env.NEXT_PUBLIC_NETWORK_TYPE || 'Local'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-foreground text-background">●</Badge>
      case 'degraded':
        return <Badge variant="outline" className="border-foreground">◐</Badge>
      default:
        return <Badge variant="outline" className="border-muted-foreground">○</Badge>
    }
  }

  return (
    <Card className="minimal-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-expanded text-lg font-semibold tracking-wide">
          Constellation Network Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="font-mono text-xs text-muted-foreground">NETWORK</div>
            <div className="font-expanded font-medium">{networkType}</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-xs text-muted-foreground">METAGRAPH ID</div>
            <HashShort hash={metagraphId} startChars={8} endChars={8} />
          </div>
          <div className="space-y-1">
            <div className="font-mono text-xs text-muted-foreground">NODES</div>
            <div className="font-expanded font-medium">3 Active</div>
          </div>
        </div>

        {/* Service Status */}
        {health?.data && (
          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">API</span>
                {getStatusBadge(health.data.checks?.api?.status || 'unknown')}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">STORAGE</span>
                {getStatusBadge(health.data.checks?.storage?.status || 'unknown')}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">L0</span>
                {getStatusBadge(health.data.checks?.metagraphL0?.status || 'unknown')}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">L1</span>
                {getStatusBadge(health.data.checks?.metagraphL1?.status || 'unknown')}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}