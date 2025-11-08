'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ConsentModal from '@/components/demo/ConsentModal'
import NetworkStatus from '@/components/blockchain/NetworkStatus'

export default function HomePage() {
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="font-sansation text-4xl font-bold tracking-tight">
            What is Sushiii?
          </h1>
          <div className="space-y-4 text-lg font-semi-expanded max-w-2xl mx-auto">
            <p>
              A blockchain-backed privacy compliance platform that provides cryptographic proof 
              of consent management and policy adherence.
            </p>
            <p>
              Built on Constellation Network, every consent event and policy update is 
              immutably recorded with Ed25519 signatures for complete audit transparency.
            </p>
          </div>
        </div>

        {/* Network Status */}
        <NetworkStatus />

        {/* Consent Demo */}
        <div className="text-center space-y-6">
          <h2 className="font-expanded text-2xl font-semibold tracking-wide">
            Try the Consent Demo
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Experience how user consent is recorded on the blockchain with real-time 
            transaction confirmation and cryptographic verification.
          </p>
          <Button 
            onClick={() => setIsConsentModalOpen(true)}
            className="minimal-button px-8 py-3 text-base font-expanded font-medium tracking-wide"
          >
            Grant Consent
          </Button>
        </div>

        <ConsentModal 
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
        />
      </div>
    </div>
  )
}