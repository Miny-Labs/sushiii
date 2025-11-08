'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import CopyButton from '@/components/common/CopyButton'
import HashShort from '@/components/common/HashShort'
import TimeAgo from '@/components/common/TimeAgo'
import { generateDemoSubject, hashSubjectId } from '@/lib/crypto'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface ConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ConsentReceipt {
  txRef: string
  timestamp: string
  policyRef: string
  contentHash: string
  snapshotOrdinal?: number
}

export default function ConsentModal({ isOpen, onClose }: ConsentModalProps) {
  const router = useRouter()
  const [subjectId, setSubjectId] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [receipt, setReceipt] = useState<ConsentReceipt | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: policies } = useQuery({
    queryKey: ['demo-policies'],
    queryFn: () => api.getDemoPolicies(),
    enabled: isOpen,
  })

  const handleDemoSubject = () => {
    const demoId = generateDemoSubject()
    setSubjectId(demoId)
    toast.success('Demo subject ID generated')
  }

  const selectedPolicyData = policies?.data?.find(p => p.policy_id === selectedPolicy)

  useEffect(() => {
    if (selectedPolicyData) {
      setSelectedVersion(selectedPolicyData.version)
    }
  }, [selectedPolicyData])

  const handleConsent = async (eventType: 'accept' | 'withdraw') => {
    if (!subjectId || !selectedPolicy || !selectedVersion) {
      toast.error('Please fill all fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Real blockchain submission via API
      const hashedSubjectId = await hashSubjectId(subjectId)

      // Map UI action to API event type
      const apiEventType = eventType === 'accept' ? 'granted' : 'revoked'

      const consentData = {
        subject_id: hashedSubjectId,
        policy_ref: {
          policy_id: selectedPolicy,
          version: selectedVersion
        },
        event_type: apiEventType,
        timestamp: new Date().toISOString()
      }
      
      const result = await api.submitConsent(consentData)
      if (result.error) {
        throw new Error(result.error)
      }
      
      const receipt: ConsentReceipt = {
        txRef: result.data?.transaction_hash || 'pending',
        timestamp: consentData.timestamp,
        policyRef: `${selectedPolicy}@${selectedVersion}`,
        contentHash: selectedPolicyData?.content_hash || 'hash_placeholder',
        snapshotOrdinal: 0 // Will be updated when confirmed on blockchain
      }

      setReceipt(receipt)
      toast.success(`Consent ${eventType}ed and recorded on blockchain`)
    } catch (error: any) {
      toast.error(`Failed to process consent: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubjectId('')
    setSelectedPolicy('')
    setSelectedVersion('')
    setReceipt(null)
    onClose()
  }

  const openInAuditor = async () => {
    // Navigate to auditor with prefilled data
    try {
      const hashedSubjectId = await hashSubjectId(subjectId)
      // Store prefill data in localStorage for the auditor page
      localStorage.setItem('auditor_prefill', JSON.stringify({
        subjectId: hashedSubjectId,
        policyId: selectedPolicy
      }))
      toast.success('Opening in Auditor...')
      handleClose()
      // Navigate to the auditor page
      router.push('/auditor')
    } catch (error) {
      toast.error('Failed to open auditor')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="minimal-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-sansation text-xl font-bold">
            Privacy Consent
          </DialogTitle>
        </DialogHeader>

        {!receipt ? (
          <div className="space-y-6">
            {/* Subject ID */}
            <div className="space-y-2">
              <label className="font-expanded text-sm font-medium">Subject ID</label>
              <div className="flex space-x-2">
                <Input
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  placeholder="Enter subject identifier"
                  className="minimal-input font-mono"
                />
                <Button 
                  onClick={handleDemoSubject}
                  variant="outline"
                  className="minimal-button whitespace-nowrap"
                >
                  Use Demo Subject
                </Button>
              </div>
            </div>

            {/* Policy Selection */}
            <div className="space-y-2">
              <label className="font-expanded text-sm font-medium">Policy</label>
              <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                <SelectTrigger className="minimal-input">
                  <SelectValue placeholder="Select a policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies?.data?.map((policy) => (
                    <SelectItem key={policy.policy_id} value={policy.policy_id}>
                      <div className="flex items-center space-x-2">
                        <span>{policy.policy_id}</span>
                        <Badge variant="outline" className="text-xs">
                          {policy.jurisdiction}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Policy Details */}
            {selectedPolicyData && (
              <div className="space-y-3 p-4 border border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">VERSION</div>
                    <div className="font-mono">{selectedPolicyData.version}</div>
                  </div>
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">JURISDICTION</div>
                    <Badge variant="outline">{selectedPolicyData.jurisdiction}</Badge>
                  </div>
                </div>
                <div>
                  <div className="font-mono text-xs text-muted-foreground">CONTENT HASH</div>
                  <HashShort hash={selectedPolicyData.content_hash} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={() => handleConsent('accept')}
                disabled={!subjectId || !selectedPolicy || isSubmitting}
                className="minimal-button flex-1"
              >
                {isSubmitting ? 'Processing...' : 'Accept'}
              </Button>
              <Button
                onClick={() => handleConsent('withdraw')}
                disabled={!subjectId || !selectedPolicy || isSubmitting}
                variant="outline"
                className="minimal-button flex-1"
              >
                {isSubmitting ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </div>
        ) : (
          /* Receipt Panel */
          <Card className="minimal-card">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="font-sansation text-lg font-bold">Consent Recorded</div>
                <div className="text-sm text-muted-foreground">
                  Transaction confirmed on Constellation Network
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-muted-foreground">TX REF</span>
                  <div className="flex items-center space-x-2">
                    <code className="font-mono">{receipt.txRef}</code>
                    <CopyButton text={receipt.txRef} size="sm" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-muted-foreground">TIMESTAMP</span>
                  <TimeAgo timestamp={receipt.timestamp} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-muted-foreground">POLICY REF</span>
                  <div className="flex items-center space-x-2">
                    <code className="font-mono">{receipt.policyRef}</code>
                    <CopyButton text={receipt.policyRef} size="sm" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-muted-foreground">CONTENT HASH</span>
                  <HashShort hash={receipt.contentHash} startChars={4} endChars={4} />
                </div>

                {receipt.snapshotOrdinal && (
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-muted-foreground">SNAPSHOT</span>
                    <code className="font-mono">#{receipt.snapshotOrdinal}</code>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={openInAuditor}
                  className="minimal-button flex-1"
                >
                  Open in Auditor
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="minimal-button flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}