'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/common/Badge'
import HashShort from '@/components/common/HashShort'
import TimeAgo from '@/components/common/TimeAgo'
import { History, Eye, Trash2 } from 'lucide-react'

interface RecentProof {
  id: string
  bundle_id: string
  subject_id_hash: string
  policy_id: string
  generated_at: string
  verification_status: 'verified' | 'unverified'
}

interface RecentProofsListProps {
  onLoadProof: (bundleId: string) => void
}

export default function RecentProofsList({ onLoadProof }: RecentProofsListProps) {
  const [recentProofs, setRecentProofs] = useState<RecentProof[]>([])

  useEffect(() => {
    // Load recent proofs from localStorage
    const stored = localStorage.getItem('recent_proofs')
    if (stored) {
      try {
        setRecentProofs(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse recent proofs:', error)
      }
    }
  }, [])

  const addRecentProof = (proof: Omit<RecentProof, 'id'>) => {
    const newProof: RecentProof = {
      ...proof,
      id: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const updated = [newProof, ...recentProofs.filter(p => p.bundle_id !== proof.bundle_id)].slice(0, 5)
    setRecentProofs(updated)
    localStorage.setItem('recent_proofs', JSON.stringify(updated))
  }

  const removeProof = (id: string) => {
    const updated = recentProofs.filter(p => p.id !== id)
    setRecentProofs(updated)
    localStorage.setItem('recent_proofs', JSON.stringify(updated))
  }

  const clearAll = () => {
    setRecentProofs([])
    localStorage.removeItem('recent_proofs')
  }

  // Expose addRecentProof function globally for other components to use
  useEffect(() => {
    ;(window as any).addRecentProof = addRecentProof
    return () => {
      delete (window as any).addRecentProof
    }
  }, [recentProofs])

  if (recentProofs.length === 0) {
    return (
      <Card className="border border-black">
        <CardHeader>
          <CardTitle className="font-sansation font-bold text-xl flex items-center">
            <History className="w-5 h-5 mr-2" />
            Recent Proofs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="font-zalando-semi text-black/60">
              No recent proof lookups
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sansation font-bold text-xl flex items-center">
            <History className="w-5 h-5 mr-2" />
            Recent Proofs
          </CardTitle>
          <Button
            onClick={clearAll}
            variant="ghost"
            size="sm"
            className="border border-black hover:bg-black hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentProofs.map((proof) => (
            <div key={proof.id} className="border border-black/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={proof.verification_status === 'verified' ? 'verified' : 'unverified'}>
                    {proof.verification_status === 'verified' ? 'Verified ✓' : 'Unverified'}
                  </Badge>
                  <TimeAgo timestamp={proof.generated_at} />
                </div>
                <Button
                  onClick={() => onLoadProof(proof.bundle_id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs border border-black hover:bg-black hover:text-white"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Bundle ID</div>
                  <div className="font-mono text-xs">{proof.bundle_id.slice(0, 12)}...</div>
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Policy</div>
                  <div className="font-mono text-xs">{proof.policy_id}</div>
                </div>
              </div>

              <div className="mt-2">
                <div className="font-zalando-expanded font-medium text-xs mb-1">Subject Hash</div>
                <HashShort hash={proof.subject_id_hash} startChars={6} endChars={6} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}