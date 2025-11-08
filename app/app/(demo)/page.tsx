'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import ConsentModal from '@/components/demo/ConsentModal'
import NetworkStatus from '@/components/blockchain/NetworkStatus'
import api from '@/lib/api'

export default function HomePage() {
  const [consentModalOpen, setConsentModalOpen] = useState(false)
  
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 30000,
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="font-sansation font-bold text-6xl mb-6 tracking-tight">
          Privacy Compliance
        </h1>
        <h2 className="font-zalando-expanded text-xl mb-8 tracking-wide">
          Blockchain-verified consent management with cryptographic proof generation
        </h2>
        
        {/* What is Sushiii */}
        <div className="max-w-2xl mx-auto mb-12 text-left">
          <h3 className="font-sansation font-bold text-2xl mb-4">What is Sushiii?</h3>
          <p className="font-zalando-semi text-lg leading-relaxed mb-4">
            A privacy compliance platform that records consent events on Constellation Network, 
            providing cryptographic proof of GDPR and regulatory compliance.
          </p>
          <p className="font-zalando-semi text-lg leading-relaxed">
            Every consent decision is immutably stored with Ed25519 signatures, 
            enabling auditable proof bundles for compliance verification.
          </p>
        </div>

        {/* Network Status */}
        <div className="mb-12">
          <NetworkStatus />
        </div>

        {/* CTA */}
        <Button 
          onClick={() => setConsentModalOpen(true)}
          className="font-zalando-expanded font-bold text-lg px-8 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
        >
          Grant Consent Demo
        </Button>
      </div>

      {/* Consent Modal */}
      <ConsentModal 
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
      />
    </div>
  )
}