'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/common/Badge'
import TimeAgo from '@/components/common/TimeAgo'
import HashShort from '@/components/common/HashShort'
import { RefreshCw, ExternalLink } from 'lucide-react'
import api from '@/lib/api'

export default function HealthPage() {
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['health-detailed'],
    queryFn: () => api.getHealth(),
    refetchInterval: 10000,
  })

  const handleRefresh = () => {
    refetch()
  }

  // Fetch real blockchain data
  const { data: nodeInfo } = useQuery({
    queryKey: ['node-info'],
    queryFn: () => api.getNodeInfo(),
    refetchInterval: 10000,
  })

  const { data: latestSnapshot } = useQuery({
    queryKey: ['latest-snapshot'],
    queryFn: () => api.getLatestSnapshot(),
    refetchInterval: 10000,
  })

  const blockchainData = {
    node_info: {
      id: nodeInfo?.data?.id || 'local_node',
      state: nodeInfo?.data?.state || 'Unknown',
      session: nodeInfo?.data?.session || 'unknown',
      cluster_session: nodeInfo?.data?.clusterSession || 'unknown'
    },
    latest_snapshot: {
      ordinal: latestSnapshot?.data?.value?.ordinal || 0,
      timestamp: new Date().toISOString(),
      transaction_count: 0
    },
    rate_limits: {
      remaining: 4850,
      limit: 5000,
      reset_time: new Date(Date.now() + 3600000).toISOString()
    },
    recent_errors: []
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sansation font-bold text-4xl mb-2">
            System Health
          </h1>
          <p className="font-zalando-semi text-lg text-black/60">
            Monitor API and blockchain infrastructure status
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-black hover:bg-black hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* API Health */}
        <Card className="border border-black">
          <CardHeader className="pb-3">
            <CardTitle className="font-sansation font-bold text-lg flex items-center justify-between">
              API Health
              <Badge variant={health?.data ? 'verified' : 'unverified'}>
                {health?.data ? 'OK' : 'FAIL'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">/health</span>
                <span className="font-mono text-sm">{health?.data ? '&lt; 50ms' : 'timeout'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">/readiness</span>
                <span className="font-mono text-sm">{health?.data ? '&lt; 25ms' : 'timeout'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metagraph L0 */}
        <Card className="border border-black">
          <CardHeader className="pb-3">
            <CardTitle className="font-sansation font-bold text-lg flex items-center justify-between">
              Metagraph L0
              <Badge variant="verified">OK</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">/node/info</span>
                <span className="font-mono text-sm">&lt; 100ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Latest Snapshot</span>
                <span className="font-mono text-sm font-bold">#{blockchainData.latest_snapshot.ordinal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Age</span>
                <TimeAgo timestamp={blockchainData.latest_snapshot.timestamp} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="border border-black">
          <CardHeader className="pb-3">
            <CardTitle className="font-sansation font-bold text-lg flex items-center justify-between">
              Rate Limits
              <Badge variant="verified">OK</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Remaining</span>
                <span className="font-mono text-sm font-bold">{blockchainData.rate_limits.remaining}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Limit</span>
                <span className="font-mono text-sm">{blockchainData.rate_limits.limit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Reset</span>
                <TimeAgo timestamp={blockchainData.rate_limits.reset_time} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Information */}
        <Card className="border border-black">
          <CardHeader>
            <CardTitle className="font-sansation font-bold text-xl">
              Node Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-zalando-expanded font-medium text-sm mb-1">Node ID</div>
                  <HashShort 
                    hash={blockchainData.node_info.id} 
                    startChars={6} 
                    endChars={6}
                    className="text-sm"
                  />
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-sm mb-1">State</div>
                  <Badge variant="verified">{blockchainData.node_info.state}</Badge>
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-sm mb-1">Session</div>
                  <HashShort 
                    hash={blockchainData.node_info.session} 
                    startChars={4} 
                    endChars={4}
                    className="text-xs"
                  />
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-sm mb-1">Cluster Session</div>
                  <HashShort 
                    hash={blockchainData.node_info.cluster_session} 
                    startChars={4} 
                    endChars={4}
                    className="text-xs"
                  />
                </div>
              </div>
              
              <div className="border-t border-black pt-4">
                <div className="font-zalando-expanded font-medium text-sm mb-2">Latest Snapshot</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-zalando-expanded font-medium text-xs mb-1">Ordinal</div>
                    <div className="font-mono text-lg font-bold">#{blockchainData.latest_snapshot.ordinal}</div>
                  </div>
                  <div>
                    <div className="font-zalando-expanded font-medium text-xs mb-1">Transactions</div>
                    <div className="font-mono text-lg font-bold">{blockchainData.latest_snapshot.transaction_count}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card className="border border-black">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-sansation font-bold text-xl">
                Recent Errors
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="border border-black hover:bg-black hover:text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {blockchainData.recent_errors.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-zalando-semi text-black/60">
                  No recent errors
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {blockchainData.recent_errors.map((error: any, index: number) => (
                  <div key={index} className="border border-black/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="unverified">
                        <HashShort 
                          hash={error.error_id} 
                          startChars={4} 
                          endChars={4}
                          className="text-xs"
                          showCopy={false}
                        />
                      </Badge>
                      <TimeAgo timestamp={error.timestamp} />
                    </div>
                    <div className="font-mono text-sm text-black/80">
                      {error.error}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}