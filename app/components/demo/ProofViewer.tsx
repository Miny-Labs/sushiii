'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/common/Badge'
import HashShort from '@/components/common/HashShort'
import CopyButton from '@/components/common/CopyButton'
import TimeAgo from '@/components/common/TimeAgo'
import JsonViewer from '../common/JsonViewer'
import QRCodeGenerator from '@/components/common/QRCodeGenerator'
import { ChevronDown, ChevronRight, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProofViewerProps {
  proofBundle: any
  isGenerating: boolean
}

export default function ProofViewer({ proofBundle, isGenerating }: ProofViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['events']))
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCopyBundleId = () => {
    if (proofBundle?.bundle_id) {
      navigator.clipboard.writeText(proofBundle.bundle_id)
      toast.success('Bundle ID copied to clipboard')
    }
  }

  const handleCopyVerifyCommand = () => {
    if (proofBundle?.bundle_id) {
      const command = `scripts/verify-proof.sh ${proofBundle.bundle_id}`
      navigator.clipboard.writeText(command)
      toast.success('Verify command copied to clipboard')
    }
  }

  if (isGenerating) {
    return (
      <Card className="border border-black">
        <CardHeader>
          <CardTitle className="font-sansation font-bold text-xl">
            Proof Bundle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
            <div className="font-zalando-semi text-lg mb-2">Resolving snapshot...</div>
            <div className="font-zalando-semi text-sm text-black/60">
              Verifying blockchain state and generating cryptographic proof
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!proofBundle) {
    return (
      <Card className="border border-black">
        <CardHeader>
          <CardTitle className="font-sansation font-bold text-xl">
            Proof Bundle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="font-zalando-semi text-black/60 mb-4">
              Provide subject and policy to generate a proof.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isVerified = proofBundle.verification_status === 'verified'

  return (
    <Card className={isVerified ? "border-2 border-black" : "border border-black"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sansation font-bold text-xl">
            Proof Bundle
          </CardTitle>
          <Badge variant={isVerified ? 'verified' : 'unverified'}>
            {isVerified ? 'Verified ✓' : 'Unverified'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bundle ID */}
          <div className="space-y-2">
            <div className="font-zalando-expanded font-medium text-sm">Bundle ID</div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">{proofBundle.bundle_id}</span>
              <CopyButton text={proofBundle.bundle_id} />
            </div>
          </div>

          {/* Subject ID Hash */}
          <div className="space-y-2">
            <div className="font-zalando-expanded font-medium text-sm">Subject ID Hash</div>
            <HashShort hash={proofBundle.subject_id_hash} startChars={8} endChars={8} />
          </div>

          {/* Policy Reference */}
          <div className="space-y-2">
            <div className="font-zalando-expanded font-medium text-sm">Policy Reference</div>
            <div className="border border-black p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{proofBundle.policy_ref.policy_id}@{proofBundle.policy_ref.version}</span>
                <CopyButton text={`${proofBundle.policy_ref.policy_id}@${proofBundle.policy_ref.version}`} />
              </div>
              <div>
                <div className="font-zalando-expanded font-medium text-xs mb-1">Content Hash</div>
                <HashShort hash={proofBundle.policy_ref.content_hash} startChars={6} endChars={6} />
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('events')}
              className="flex items-center space-x-2 font-zalando-expanded font-medium text-sm hover:text-black/80"
            >
              {expandedSections.has('events') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Events ({proofBundle.events.length})</span>
            </button>
            
            {expandedSections.has('events') && (
              <div className="border border-black p-3 space-y-3">
                {proofBundle.events.slice(-3).map((event: any, index: number) => (
                  <div key={index} className="border-b border-black/20 pb-2 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={event.event_type === 'accept' ? 'verified' : 'default'}>
                        {event.event_type.toUpperCase()}
                      </Badge>
                      <TimeAgo timestamp={event.timestamp} />
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-mono">{event.tx_ref}</span>
                      <CopyButton text={event.tx_ref} />
                      <span className="font-mono">#{event.snapshot_ordinal}</span>
                    </div>
                  </div>
                ))}
                {proofBundle.events.length > 3 && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs border border-black hover:bg-black hover:text-white"
                    >
                      Show All {proofBundle.events.length} Events
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('signature')}
              className="flex items-center space-x-2 font-zalando-expanded font-medium text-sm hover:text-black/80"
            >
              {expandedSections.has('signature') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Signature</span>
            </button>
            
            {expandedSections.has('signature') && (
              <div className="border border-black p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-zalando-expanded font-medium text-xs">Algorithm</span>
                  <span className="font-mono text-sm">{proofBundle.signature.algorithm}</span>
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Value</div>
                  <HashShort hash={proofBundle.signature.value} startChars={8} endChars={8} />
                </div>
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Public Key</div>
                  <HashShort hash={proofBundle.signature.public_key} startChars={8} endChars={8} />
                </div>
              </div>
            )}
          </div>

          {/* Finalization References */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('finalization')}
              className="flex items-center space-x-2 font-zalando-expanded font-medium text-sm hover:text-black/80"
            >
              {expandedSections.has('finalization') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Finalization References</span>
            </button>
            
            {expandedSections.has('finalization') && (
              <div className="border border-black p-3 space-y-2">
                <div>
                  <div className="font-zalando-expanded font-medium text-xs mb-1">Snapshot Ordinals</div>
                  <div className="flex items-center space-x-2">
                    {proofBundle.finalization_refs.snapshot_ordinals.map((ordinal: number, index: number) => (
                      <span key={index} className="font-mono text-sm">#{ordinal}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-zalando-expanded font-medium text-xs">L0 Endpoint</span>
                  <span className="font-mono text-xs">{proofBundle.finalization_refs.l0_endpoint}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-black">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCopyBundleId}
                variant="outline"
                className="border-black hover:bg-black hover:text-white font-zalando-expanded"
              >
                Copy Bundle ID
              </Button>
              <Button
                onClick={handleCopyVerifyCommand}
                variant="outline"
                className="border-black hover:bg-black hover:text-white font-zalando-expanded"
              >
                Copy Verify Command
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setQrModalOpen(true)}
                variant="outline"
                className="border-black hover:bg-black hover:text-white font-zalando-expanded"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Download
              </Button>
              <Button
                onClick={() => {
                  const jsonString = JSON.stringify(proofBundle, null, 2)
                  const blob = new Blob([jsonString], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `proof-bundle-${proofBundle.bundle_id}.json`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
                variant="outline"
                className="border-black hover:bg-black hover:text-white font-zalando-expanded"
              >
                Download JSON
              </Button>
            </div>
          </div>

          {/* Raw JSON Viewer */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('json')}
              className="flex items-center space-x-2 font-zalando-expanded font-medium text-sm hover:text-black/80"
            >
              {expandedSections.has('json') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Raw JSON</span>
            </button>
            
            {expandedSections.has('json') && (
              <div className="border border-black">
                <JsonViewer data={proofBundle} />
              </div>
            )}
          </div>
        </div>

        {/* QR Code Modal */}
        <QRCodeGenerator
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          data={proofBundle}
          title="Proof Bundle QR Code"
          downloadFilename={`proof-bundle-${proofBundle?.bundle_id || 'unknown'}.json`}
        />
      </CardContent>
    </Card>
  )
}