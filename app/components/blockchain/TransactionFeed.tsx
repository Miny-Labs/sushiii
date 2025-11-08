'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/common/Badge'
import TimeAgo from '@/components/common/TimeAgo'
import CopyButton from '@/components/common/CopyButton'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface Transaction {
  tx_ref: string
  type: 'policy_creation' | 'consent_event' | 'proof_generation'
  timestamp: string
  snapshot_ordinal: number
  status: 'confirmed' | 'pending'
}

export default function TransactionFeed() {
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transaction-feed'],
    queryFn: async () => {
      // Fetch real blockchain data from latest snapshot
      const snapshotResult = await api.getLatestSnapshot()
      if (snapshotResult.error) {
        console.error('Failed to fetch snapshot:', snapshotResult.error)
        return { data: [] }
      }

      const snapshot = snapshotResult.data
      const transactions: Transaction[] = []

      // Extract policy creation transactions
      if (snapshot.data?.policyVersions) {
        Object.values(snapshot.data.policyVersions).forEach((policy: any) => {
          transactions.push({
            tx_ref: policy.policy_id || `policy_${Date.now()}`,
            type: 'policy_creation',
            timestamp: policy.created_at || policy.effective_from,
            snapshot_ordinal: snapshot.ordinal || 0,
            status: 'confirmed'
          })
        })
      }

      // Extract consent event transactions
      if (snapshot.data?.consentEvents) {
        snapshot.data.consentEvents.forEach((consent: any) => {
          transactions.push({
            tx_ref: consent.consent_id || `consent_${Date.now()}`,
            type: 'consent_event',
            timestamp: consent.timestamp || consent.captured_at,
            snapshot_ordinal: snapshot.ordinal || 0,
            status: 'confirmed'
          })
        })
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      return { data: transactions.slice(0, 10) } // Show latest 10 transactions
    },
    refetchInterval: 10000,
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'policy_creation': return 'Policy Created'
      case 'consent_event': return 'Consent Event'
      case 'proof_generation': return 'Proof Generated'
      default: return type
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'policy_creation': return 'jurisdiction'
      case 'consent_event': return 'verified'
      case 'proof_generation': return 'default'
      default: return 'default'
    }
  }

  return (
    <Card className="border border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sansation font-bold text-xl">
            Live Transaction Feed
          </CardTitle>
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            className="border border-black hover:bg-black hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-black/20 p-3 animate-pulse">
                <div className="h-4 bg-black/10 w-1/3 mb-2"></div>
                <div className="h-3 bg-black/10 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions?.data.map((tx) => (
              <div key={tx.tx_ref} className="border border-black p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getTypeBadge(tx.type) as any}>
                      {getTypeLabel(tx.type)}
                    </Badge>
                    <Badge variant={tx.status === 'confirmed' ? 'verified' : 'unverified'}>
                      {tx.status.toUpperCase()}
                    </Badge>
                  </div>
                  <TimeAgo timestamp={tx.timestamp} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-zalando-expanded font-medium text-xs mb-1">TX Reference</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs">{tx.tx_ref}</span>
                      <CopyButton text={tx.tx_ref} />
                    </div>
                  </div>
                  <div>
                    <div className="font-zalando-expanded font-medium text-xs mb-1">Snapshot</div>
                    <span className="font-mono text-sm font-bold">#{tx.snapshot_ordinal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}