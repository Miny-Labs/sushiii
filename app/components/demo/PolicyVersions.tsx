'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Badge from '../common/Badge'
import HashShort from '@/components/common/HashShort'
import CopyButton from '@/components/common/CopyButton'
import TimeAgo from '@/components/common/TimeAgo'
import PolicyDiffViewer from './PolicyDiffViewer'
import { RefreshCw, GitCompare, Filter } from 'lucide-react'

interface Policy {
  policy_id: string
  version: string
  jurisdiction: string
  content_hash: string
  effective_from: string
  tx_ref?: string
  snapshot_ordinal?: number
}

interface PolicyVersionsProps {
  policies: Policy[]
  isLoading: boolean
  error?: Error | null
  onRefresh: () => void
}

export default function PolicyVersions({ policies, isLoading, error, onRefresh }: PolicyVersionsProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffPolicyId, setDiffPolicyId] = useState('')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all')

  // Get unique jurisdictions for filter
  const jurisdictions = Array.from(new Set(policies.map(p => p.jurisdiction)))
  
  // Filter policies by jurisdiction
  const filteredPolicies = jurisdictionFilter === 'all' 
    ? policies 
    : policies.filter(p => p.jurisdiction === jurisdictionFilter)

  const handleShowDiff = (policyId: string) => {
    setDiffPolicyId(policyId)
    setDiffModalOpen(true)
  }

  if (isLoading) {
    return (
      <Card className="border border-black">
        <CardHeader>
          <CardTitle className="font-sansation font-bold text-xl">
            Policy Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-black/20 p-4 animate-pulse">
                <div className="h-4 bg-black/10 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-black/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-red-500">
        <CardHeader>
          <CardTitle className="font-sansation font-bold text-xl text-red-600">
            Policy Versions - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="font-zalando-semi text-red-600 mb-4">
              Failed to load policies: {error.message}
            </div>
            <Button 
              onClick={onRefresh}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (policies.length === 0 && !isLoading) {
    return (
      <Card className="border border-black">
        <CardHeader>
          <CardTitle className="font-sansation font-bold text-xl">
            Policy Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="font-zalando-semi text-black/60 mb-4">
              No policies yet—create your first policy on the left.
            </div>
            <Button 
              onClick={onRefresh}
              variant="outline"
              className="border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sansation font-bold text-xl">
            Policy Versions
          </CardTitle>
          <div className="flex items-center space-x-2">
            {jurisdictions.length > 1 && (
              <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                <SelectTrigger className="w-24 h-8 border border-black">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {jurisdictions.map(jurisdiction => (
                    <SelectItem key={jurisdiction} value={jurisdiction}>
                      {jurisdiction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredPolicies.map((policy, index) => (
            <div key={`${policy.policy_id}-${policy.version}`} className="border border-black p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-lg">
                    {policy.policy_id}@{policy.version}
                  </span>
                  <Badge variant="jurisdiction">{policy.jurisdiction}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {policy.tx_ref && (
                    <Badge variant="verified">On Chain</Badge>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Content Hash</div>
                  <HashShort hash={policy.content_hash} startChars={6} endChars={6} />
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Effective From</div>
                  <TimeAgo timestamp={policy.effective_from} />
                </div>
                {policy.tx_ref && (
                  <div>
                    <div className="font-zalando-expanded font-medium text-xs mb-1">TX Reference</div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs">{policy.tx_ref}</span>
                      <CopyButton text={policy.tx_ref} />
                    </div>
                  </div>
                )}
                {policy.snapshot_ordinal && (
                  <div>
                    <div className="font-zalando-expanded font-medium text-xs mb-1">Snapshot</div>
                    <span className="font-mono text-sm font-bold">#{policy.snapshot_ordinal}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-xs border border-black hover:bg-black hover:text-white"
                  onClick={() => navigator.clipboard.writeText(policy.policy_id)}
                >
                  Copy ID
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-xs border border-black hover:bg-black hover:text-white"
                  onClick={() => navigator.clipboard.writeText(`${policy.policy_id}@${policy.version}`)}
                >
                  Copy Ref
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-xs border border-black hover:bg-black hover:text-white"
                  onClick={() => handleShowDiff(policy.policy_id)}
                  disabled={filteredPolicies.filter(p => p.policy_id === policy.policy_id).length < 2}
                >
                  <GitCompare className="w-3 h-3 mr-1" />
                  Diff
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Policy Diff Modal */}
        <PolicyDiffViewer
          isOpen={diffModalOpen}
          onClose={() => setDiffModalOpen(false)}
          policies={policies}
          currentPolicyId={diffPolicyId}
        />
      </CardContent>
    </Card>
  )
}