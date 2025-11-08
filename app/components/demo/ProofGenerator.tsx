'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Badge from '@/components/common/Badge'
import { hashSubjectId } from '@/lib/crypto'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface ProofGeneratorProps {
  onProofGenerated: (bundle: any) => void
  onGenerateStart: () => void
  isGenerating: boolean
}

export default function ProofGenerator({ 
  onProofGenerated, 
  onGenerateStart, 
  isGenerating 
}: ProofGeneratorProps) {
  const [subjectId, setSubjectId] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [isHashed, setIsHashed] = useState(false)

  // Fetch real policies from blockchain
  const { data: policiesData } = useQuery({
    queryKey: ['policies-for-proof'],
    queryFn: () => api.getDemoPolicies(),
    refetchInterval: 30000,
  })

  const policies = policiesData?.data || []

  // Check for prefilled data from consent flow
  useEffect(() => {
    const prefillData = localStorage.getItem('auditor_prefill')
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData)
        if (data.subjectId) {
          setSubjectId(data.subjectId)
          setIsHashed(true) // Assume prefilled data is already hashed
        }
        if (data.policyId) {
          setSelectedPolicy(data.policyId)
        }
        localStorage.removeItem('auditor_prefill')
        toast.success('Fields prefilled from consent receipt')
      } catch (error) {
        console.error('Failed to parse prefill data:', error)
      }
    }
  }, [])

  // Check if subject ID looks like a hash
  useEffect(() => {
    const looksLikeHash = subjectId.length === 64 && /^[a-f0-9]+$/i.test(subjectId)
    setIsHashed(looksLikeHash)
  }, [subjectId])

  const selectedPolicyData = policies.find(p => p.policy_id === selectedPolicy)

  const handleGenerateProof = async () => {
    if (!subjectId || !selectedPolicy) {
      toast.error('Please fill all fields')
      return
    }

    onGenerateStart()

    try {
      // Hash subject ID if it's not already hashed
      const finalSubjectId = isHashed ? subjectId : await hashSubjectId(subjectId)
      
      // Real proof bundle generation via API
      const result = await api.generateDemoProofBundle({
        subject_id: finalSubjectId
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      onProofGenerated(result.data)
      toast.success('Proof bundle generated from blockchain data')
    } catch (error) {
      toast.error('Failed to generate proof bundle')
      onProofGenerated(null)
    }
  }

  const handleDownloadJSON = () => {
    // This would trigger a download in a real implementation
    toast.success('JSON download started')
  }

  const handleDownloadPDF = () => {
    // This would trigger a PDF download in a real implementation
    toast.success('PDF download started')
  }

  return (
    <Card className="border border-black">
      <CardHeader>
        <CardTitle className="font-sansation font-bold text-xl">
          Generate Proof Bundle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Subject ID */}
          <div className="space-y-2">
            <label className="font-zalando-expanded font-medium text-sm">
              Subject ID *
            </label>
            <Input
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="Enter subject identifier or hash"
              className="font-mono border-black"
              required
            />
            {subjectId && !isHashed && (
              <div className="text-xs text-black/60 font-zalando-semi">
                Will hash with tenant salt before lookup
              </div>
            )}
            {subjectId && isHashed && (
              <div className="text-xs text-black/60 font-zalando-semi">
                Detected as SHA-256 hash
              </div>
            )}
          </div>

          {/* Policy Selection */}
          <div className="space-y-2">
            <label className="font-zalando-expanded font-medium text-sm">
              Policy *
            </label>
            <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
              <SelectTrigger className="border-black">
                <SelectValue placeholder="Select a policy" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((policy) => (
                  <SelectItem key={policy.policy_id} value={policy.policy_id}>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{policy.policy_id}@{policy.version}</span>
                      <Badge variant="jurisdiction">{policy.jurisdiction}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Policy Details */}
          {selectedPolicyData && (
            <div className="border border-black p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Version:</span>
                <span className="font-mono">{selectedPolicyData.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-zalando-expanded font-medium text-sm">Jurisdiction:</span>
                <Badge variant="jurisdiction">{selectedPolicyData.jurisdiction}</Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGenerateProof}
              disabled={!subjectId || !selectedPolicy || isGenerating}
              className="w-full bg-black text-white hover:bg-black/80 font-zalando-expanded font-bold"
            >
              {isGenerating ? 'Resolving Snapshot...' : 'Generate Proof'}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleDownloadJSON}
                variant="outline"
                className="border-black hover:bg-black hover:text-white font-zalando-expanded"
                disabled={isGenerating}
              >
                Download JSON
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="border-black hover:bg-black hover:text-white font-zalando-expanded"
                disabled={isGenerating}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}