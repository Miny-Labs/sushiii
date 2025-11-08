'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  exportPolicyToHTML,
  downloadHTMLFile,
  previewHTML,
  PolicyExportData,
  HTMLExportOptions
} from '@/lib/exporters/html-exporter'
import {
  exportPolicyToPDF,
  downloadPDFFile,
  previewPDF,
  PDFExportOptions
} from '@/lib/exporters/pdf-exporter'
import toast from 'react-hot-toast'
import { Download, Eye, FileText, Settings, FileDown } from 'lucide-react'

interface PolicyExportDialogProps {
  isOpen: boolean
  onClose: () => void
  policy: PolicyExportData | null
}

export default function PolicyExportDialog({
  isOpen,
  onClose,
  policy
}: PolicyExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf'>('pdf')
  const [options, setOptions] = useState<HTMLExportOptions>({
    includeMetadata: true,
    includeApprovalHistory: true,
    includeTableOfContents: true,
    theme: 'light',
    branding: {
      companyName: 'Your Company',
      colors: {
        primary: '#000000',
        secondary: '#666666'
      }
    }
  })

  const handleOptionChange = (key: keyof HTMLExportOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleBrandingChange = (key: string, value: any) => {
    setOptions(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [key]: value
      }
    }))
  }

  const handleColorChange = (key: string, value: string) => {
    setOptions(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        colors: {
          ...prev.branding?.colors,
          [key]: value
        }
      }
    }))
  }

  const handleExport = async () => {
    if (!policy) return

    try {
      if (exportFormat === 'html') {
        const html = exportPolicyToHTML(policy, options)
        const filename = `${policy.policy_id}-v${policy.version}.html`
        downloadHTMLFile(html, filename)
        toast.success(`Exported ${filename}`)
      } else {
        const pdfOptions: PDFExportOptions = {
          includeMetadata: options.includeMetadata,
          includeApprovalHistory: options.includeApprovalHistory,
          includeTableOfContents: options.includeTableOfContents,
          branding: options.branding
        }
        const blob = await exportPolicyToPDF(policy, pdfOptions)
        const filename = `${policy.policy_id}-v${policy.version}.pdf`
        downloadPDFFile(blob, filename)
        toast.success(`Exported ${filename}`)
      }
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`)
    }
  }

  const handlePreview = async () => {
    if (!policy) return

    try {
      if (exportFormat === 'html') {
        const html = exportPolicyToHTML(policy, options)
        previewHTML(html)
      } else {
        const pdfOptions: PDFExportOptions = {
          includeMetadata: options.includeMetadata,
          includeApprovalHistory: options.includeApprovalHistory,
          includeTableOfContents: options.includeTableOfContents,
          branding: options.branding
        }
        const blob = await exportPolicyToPDF(policy, pdfOptions)
        previewPDF(blob)
      }
    } catch (error: any) {
      toast.error(`Preview failed: ${error.message}`)
    }
  }

  if (!policy) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Policy
          </DialogTitle>
          <DialogDescription>
            Export {policy.policy_id} v{policy.version} as HTML or PDF
          </DialogDescription>
        </DialogHeader>

        {/* Format Selection */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={exportFormat === 'pdf' ? 'default' : 'outline'}
              onClick={() => setExportFormat('pdf')}
              className="w-full"
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant={exportFormat === 'html' ? 'default' : 'outline'}
              onClick={() => setExportFormat('html')}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              HTML
            </Button>
          </div>
        </div>

        <Tabs defaultValue="options" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="options">Export Options</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-6 mt-6">
            {/* Content Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Content Options</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => handleOptionChange('includeMetadata', checked)}
                />
                <Label htmlFor="metadata" className="cursor-pointer">
                  Include policy metadata (jurisdiction, dates, hash)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toc"
                  checked={options.includeTableOfContents}
                  onCheckedChange={(checked) => handleOptionChange('includeTableOfContents', checked)}
                />
                <Label htmlFor="toc" className="cursor-pointer">
                  Include table of contents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="approval"
                  checked={options.includeApprovalHistory}
                  onCheckedChange={(checked) => handleOptionChange('includeApprovalHistory', checked)}
                />
                <Label htmlFor="approval" className="cursor-pointer">
                  Include approval history
                </Label>
              </div>
            </div>

            {/* Theme Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Theme</h3>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={options.theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleOptionChange('theme', 'light')}
                  className="w-full"
                >
                  Light
                </Button>
                <Button
                  variant={options.theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleOptionChange('theme', 'dark')}
                  className="w-full"
                >
                  Dark
                </Button>
                <Button
                  variant={options.theme === 'print' ? 'default' : 'outline'}
                  onClick={() => handleOptionChange('theme', 'print')}
                  className="w-full"
                >
                  Print
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 mt-6">
            {/* Company Branding */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Company Information</h3>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={options.branding?.companyName || ''}
                  onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                  placeholder="Your Company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input
                  id="logo"
                  value={options.branding?.logo || ''}
                  onChange={(e) => handleBrandingChange('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  URL to your company logo (max height: 60px)
                </p>
              </div>
            </div>

            {/* Color Customization */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Brand Colors</h3>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="primaryColor"
                    value={options.branding?.colors?.primary || '#000000'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={options.branding?.colors?.primary || '#000000'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="secondaryColor"
                    value={options.branding?.colors?.secondary || '#666666'}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={options.branding?.colors?.secondary || '#666666'}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button
            onClick={handlePreview}
            variant="outline"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleExport}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download {exportFormat.toUpperCase()}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {exportFormat === 'html'
            ? 'The exported HTML file is self-contained and can be hosted on any web server'
            : 'The exported PDF file is print-ready and includes all formatting and metadata'}
        </div>
      </DialogContent>
    </Dialog>
  )
}
