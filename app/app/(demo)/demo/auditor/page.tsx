'use client'

import { useState } from 'react'
import ProofGenerator from '@/components/demo/ProofGenerator'
import ProofViewer from '@/components/demo/ProofViewer'

export default function AuditorPage() {
  const [proofBundle, setProofBundle] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateStart = () => {
    setIsGenerating(true)
  }

  const handleProofGenerated = (bundle: any) => {
    setProofBundle(bundle)
    setIsGenerating(false)
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-sansation text-3xl font-bold tracking-tight">
            Compliance Auditor
          </h1>
          <p className="text-muted-foreground font-semi-expanded">
            Generate and verify cryptographic proof bundles for compliance audits
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Proof Generator */}
          <ProofGenerator 
            onProofGenerated={handleProofGenerated}
            onGenerateStart={handleGenerateStart}
            isGenerating={isGenerating}
          />

          {/* Right Column - Proof Viewer */}
          <ProofViewer proofBundle={proofBundle} isGenerating={isGenerating} />
        </div>
      </div>
    </div>
  )
}