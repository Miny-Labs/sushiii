'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'

interface Policy {
  policy_id: string
  version: string
  jurisdiction: string
  content_hash: string
  effective_from: string
  text?: string
}

interface PolicyDiffViewerProps {
  isOpen: boolean
  onClose: () => void
  policies: Policy[]
  currentPolicyId: string
}

export default function PolicyDiffViewer({ 
  isOpen, 
  onClose, 
  policies, 
  currentPolicyId 
}: PolicyDiffViewerProps) {
  const policyVersions = policies
    .filter(p => p.policy_id === currentPolicyId)
    .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())

  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([0, 1])

  if (policyVersions.length < 2) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl border border-black">
          <DialogHeader>
            <DialogTitle className="font-sansation font-bold text-xl">
              Policy Diff - {currentPolicyId}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="font-zalando-semi text-black/60">
              Need at least 2 versions to show differences
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const [olderVersion, newerVersion] = [
    policyVersions[selectedVersions[1]],
    policyVersions[selectedVersions[0]]
  ]

  // Simple diff algorithm for demo purposes
  const generateDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLines = Math.max(oldLines.length, newLines.length)
    
    const diff = []
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || ''
      const newLine = newLines[i] || ''
      
      if (oldLine === newLine) {
        diff.push({ type: 'unchanged', content: oldLine, lineNumber: i + 1 })
      } else if (!oldLine) {
        diff.push({ type: 'added', content: newLine, lineNumber: i + 1 })
      } else if (!newLine) {
        diff.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
      } else {
        diff.push({ type: 'removed', content: oldLine, lineNumber: i + 1 })
        diff.push({ type: 'added', content: newLine, lineNumber: i + 1 })
      }
    }
    
    return diff
  }

  const mockOldText = `We collect and process your personal data in accordance with applicable privacy laws.

Your data is used for:
- Service provision
- Communication
- Analytics

We retain data for 2 years after account closure.`

  const mockNewText = `We collect and process your personal data in accordance with GDPR and applicable privacy laws.

Your data is used for:
- Service provision and improvement
- Communication
- Analytics and performance monitoring
- Legal compliance

We retain data for 1 year after account closure unless legally required otherwise.`

  const diff = generateDiff(mockOldText, mockNewText)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl border border-black max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-sansation font-bold text-xl">
              Policy Diff - {currentPolicyId}
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="border border-black hover:bg-black hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Version Selector */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-black">
              <CardHeader className="pb-2">
                <CardTitle className="font-zalando-expanded text-sm font-medium">
                  Older Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="font-mono text-sm font-bold">
                    v{olderVersion.version}
                  </div>
                  <div className="font-mono text-xs text-black/60">
                    {new Date(olderVersion.effective_from).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black">
              <CardHeader className="pb-2">
                <CardTitle className="font-zalando-expanded text-sm font-medium">
                  Newer Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="font-mono text-sm font-bold">
                    v{newerVersion.version}
                  </div>
                  <div className="font-mono text-xs text-black/60">
                    {new Date(newerVersion.effective_from).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diff Display */}
          <Card className="border border-black">
            <CardHeader>
              <CardTitle className="font-zalando-expanded text-sm font-medium">
                Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/5 border border-black/20 p-4 max-h-96 overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {diff.map((line, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        line.type === 'added'
                          ? 'bg-green-100 text-green-800'
                          : line.type === 'removed'
                          ? 'bg-red-100 text-red-800'
                          : 'text-black/80'
                      }`}
                    >
                      <span className="w-8 text-black/40 text-right mr-4">
                        {line.lineNumber}
                      </span>
                      <span className="w-4 mr-2">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      <span className="flex-1">{line.content || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
              <span className="font-zalando-expanded">Added</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
              <span className="font-zalando-expanded">Removed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border border-black/20"></div>
              <span className="font-zalando-expanded">Unchanged</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}