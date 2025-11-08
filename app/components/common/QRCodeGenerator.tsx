'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CopyButton from './CopyButton'
import { QrCode, Download, X } from 'lucide-react'

interface QRCodeGeneratorProps {
  isOpen: boolean
  onClose: () => void
  data: any
  title: string
  downloadFilename: string
}

export default function QRCodeGenerator({ 
  isOpen, 
  onClose, 
  data, 
  title, 
  downloadFilename 
}: QRCodeGeneratorProps) {
  const [qrCodeSvg, setQrCodeSvg] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  useEffect(() => {
    if (isOpen && data) {
      // Create download URL for JSON data
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      // Generate simple QR code using a text-based approach for demo
      // In production, you'd use a proper QR code library like qrcode
      generateSimpleQR(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [isOpen, data])

  const generateSimpleQR = (url: string) => {
    // Simple QR code representation for demo
    // In production, use a library like 'qrcode' or 'qr-code-generator'
    const size = 200
    const modules = 25
    const moduleSize = size / modules
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
    
    // Generate a pattern based on the URL hash for demo purposes
    const hash = url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        const shouldFill = (hash + row * modules + col) % 3 === 0
        if (shouldFill) {
          const x = col * moduleSize
          const y = row * moduleSize
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`
        }
      }
    }
    
    // Add corner markers
    const cornerSize = moduleSize * 7
    svg += `<rect x="0" y="0" width="${cornerSize}" height="${cornerSize}" fill="none" stroke="black" stroke-width="2"/>`
    svg += `<rect x="${size - cornerSize}" y="0" width="${cornerSize}" height="${cornerSize}" fill="none" stroke="black" stroke-width="2"/>`
    svg += `<rect x="0" y="${size - cornerSize}" width="${cornerSize}" height="${cornerSize}" fill="none" stroke="black" stroke-width="2"/>`
    
    svg += '</svg>'
    setQrCodeSvg(svg)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = downloadFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border border-black">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-sansation font-bold text-xl">
              {title}
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

        <div className="space-y-6">
          {/* QR Code Display */}
          <Card className="border border-black">
            <CardContent className="p-6">
              <div className="flex justify-center">
                {qrCodeSvg ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                    className="border border-black/20"
                  />
                ) : (
                  <div className="w-48 h-48 border border-black/20 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-black/40" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Download Info */}
          <div className="space-y-3">
            <div className="text-center">
              <div className="font-zalando-expanded font-medium text-sm mb-2">
                Download Link
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-black/5 border border-black/20 p-2 font-mono text-xs truncate">
                  {downloadUrl.slice(0, 50)}...
                </div>
                <CopyButton text={downloadUrl} />
              </div>
            </div>

            <div className="text-center text-xs text-black/60 font-zalando-semi">
              Scan QR code or use download button to get JSON file
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              className="bg-black text-white hover:bg-black/80"
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
            <Button
              onClick={() => navigator.clipboard.writeText(downloadUrl)}
              variant="outline"
              className="border-black hover:bg-black hover:text-white"
            >
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}