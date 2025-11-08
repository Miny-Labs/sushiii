'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import NetworkStatus from '@/components/blockchain/NetworkStatus'
// import TransactionFeed from '@/components/blockchain/TransactionFeed'
// import NodeTopology from '@/components/blockchain/NodeTopology'
import api from '@/lib/api'

export default function HealthPage() {
  const { data: health } = useQuery({
    queryKey: ['health-detailed'],
    queryFn: () => api.getHealth(),
    refetchInterval: 5000,
  })

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-sansation text-3xl font-bold tracking-tight">
            System Health
          </h1>
          <p className="text-muted-foreground font-semi-expanded">
            Real-time monitoring of blockchain infrastructure and system components
          </p>
        </div>

        {/* Network Status */}
        <NetworkStatus />

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Node Topology - Temporarily disabled */}
          {/* <NodeTopology /> */}

          {/* Transaction Feed - Temporarily disabled */}
          {/* <TransactionFeed /> */}
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="minimal-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-expanded text-base font-semibold">
                API Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs">Response Time</span>
                <span className="font-mono text-sm">
                  {health?.data?.checks?.api?.latency || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs">Status</span>
                <Badge variant={health?.data?.checks?.api?.status === 'healthy' ? 'default' : 'destructive'}>
                  {health?.data?.checks?.api?.status || 'unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="minimal-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-expanded text-base font-semibold">
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs">Response Time</span>
                <span className="font-mono text-sm">
                  {health?.data?.checks?.storage?.latency || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs">Status</span>
                <Badge variant={health?.data?.checks?.storage?.status === 'healthy' ? 'default' : 'destructive'}>
                  {health?.data?.checks?.storage?.status || 'unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="minimal-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-expanded text-base font-semibold">
                Blockchain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs">L0 Latency</span>
                <span className="font-mono text-sm">
                  {health?.data?.checks?.metagraphL0?.latency || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs">L1 Status</span>
                <Badge variant={
                  health?.data?.checks?.metagraphL1?.status === 'healthy' ? 'default' :
                    health?.data?.checks?.metagraphL1?.status === 'degraded' ? 'secondary' : 'destructive'
                }>
                  {health?.data?.checks?.metagraphL1?.status || 'unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}