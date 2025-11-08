'use client'

import { useState, useEffect } from 'react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import HashShort from '@/components/common/HashShort'
import AdvancedPolicyEditor from '@/components/common/AdvancedPolicyEditor'
import TemplateVariableEditor from '@/components/common/TemplateVariableEditor'
import { Badge } from '@/components/ui/badge'
import { computeSHA256 } from '@/lib/crypto'
import { POLICY_TEMPLATES, extractVariables } from '@/lib/policy-templates'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { FileText, Sparkles } from 'lucide-react'

interface PolicyCreatorProps {
  onPolicyCreated: () => void
}

const jurisdictions = [
  { code: 'US', name: 'United States' },
  { code: 'EU', name: 'European Union' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' },
]

export default function PolicyCreator({ onPolicyCreated }: PolicyCreatorProps) {
  const [policyText, setPolicyText] = useState('')
  const [policyId, setPolicyId] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [jurisdiction, setJurisdiction] = useState('')
  const [contentHash, setContentHash] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [templateContent, setTemplateContent] = useState('')
  const [showVariableEditor, setShowVariableEditor] = useState(false)

  const handleLoadTemplate = (templateId: string) => {
    const template = POLICY_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setTemplateContent(template.content)
      setPolicyId(template.id)
      setJurisdiction(template.jurisdiction)
      setShowTemplates(false)

      // Check if template has variables
      const variables = extractVariables(template.content)
      if (variables.length > 0) {
        setShowVariableEditor(true)
        toast.success(`Loaded template: ${template.name}. Fill in ${variables.length} variables.`)
      } else {
        setPolicyText(template.content)
        toast.success(`Loaded template: ${template.name}`)
      }
    }
  }

  const handleApplyVariables = (substitutedContent: string) => {
    setPolicyText(substitutedContent)
    setShowVariableEditor(false)
    toast.success('Template variables applied successfully')
  }

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => {
        if (!isSubmitting && policyText.length >= 10 && policyId && version && jurisdiction) {
          handleSubmit(new Event('submit') as any)
        }
      },
      description: 'Submit policy (Ctrl+Enter)'
    },
    {
      key: 'Escape',
      action: () => {
        // Reset form
        setPolicyText('')
        setPolicyId('')
        setVersion('')
        setJurisdiction('')
        setContentHash('')
      },
      description: 'Clear form (Escape)'
    }
  ])

  // Compute hash in real-time
  useEffect(() => {
    if (policyText.length >= 10) {
      computeSHA256(policyText).then(setContentHash)
    } else {
      setContentHash('')
    }
  }, [policyText])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (policyText.length < 10) {
      toast.error('Policy text must be at least 10 characters')
      return
    }

    if (!policyId || !version || !jurisdiction) {
      toast.error('Please fill all fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Real blockchain submission via API
      const policyData = {
        policy_id: policyId,
        version,
        text: policyText,
        content_hash: contentHash,
        uri: `https://demo.sushiii.com/policies/${policyId}/${version}`,
        jurisdiction,
        effective_from: new Date().toISOString(),
        status: 'draft'
      }
      
      const result = await api.createDemoPolicy(policyData)
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast.success(`Policy published to blockchain: ${result.data?.transaction_hash || 'pending'}`)
      
      // Reset form
      setPolicyText('')
      setPolicyId('')
      setVersion('')
      setJurisdiction('')
      setContentHash('')
      
      onPolicyCreated()
    } catch (error: any) {
      toast.error(`Failed to create policy: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="minimal-card">
      <CardHeader>
        <CardTitle className="font-expanded text-lg font-semibold tracking-wide">
          Create Policy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selector */}
          {showTemplates && !policyText && (
            <div className="space-y-4 p-6 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-expanded text-base font-semibold">
                  Start with a Professional Template
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {POLICY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleLoadTemplate(template.id)}
                    className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <div className="font-expanded font-semibold text-sm">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {template.description}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {template.jurisdiction}
                          </Badge>
                          {template.framework.map((fw) => (
                            <Badge key={fw} variant="secondary" className="text-xs">
                              {fw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowTemplates(false)}
                  className="text-sm"
                >
                  Or start from scratch
                </Button>
              </div>
            </div>
          )}

          {/* Template Variable Editor */}
          {showVariableEditor && templateContent && (
            <TemplateVariableEditor
              content={templateContent}
              onApply={handleApplyVariables}
            />
          )}

          {/* Policy Text - Rich Text Editor */}
          {(!showTemplates || policyText) && !showVariableEditor && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-expanded text-sm font-medium">
                  Policy Text
                </label>
                {!showTemplates && !policyText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    className="text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Use Template
                  </Button>
                )}
              </div>
              <AdvancedPolicyEditor
                content={policyText}
                onChange={setPolicyText}
                placeholder="Enter privacy policy content... Use the toolbar to format your document with headings, tables, lists, and custom fonts."
                minHeight="600px"
              />
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>💡 Use tables for data processing categories</span>
                  <span>📝 Multiple fonts and colors available</span>
                  <span>📊 Import from HTML files</span>
                </div>
              </div>
            </div>
          )}

          {/* Policy ID */}
          <div className="space-y-2">
            <label className="font-expanded text-sm font-medium">
              Policy ID
            </label>
            <Input
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g., privacy, cookies, data-retention"
              className="minimal-input font-mono"
              required
            />
          </div>

          {/* Version */}
          <div className="space-y-2">
            <label className="font-expanded text-sm font-medium">
              Version
            </label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0, 2.1.0"
              className="minimal-input font-mono"
              required
            />
          </div>

          {/* Jurisdiction */}
          <div className="space-y-2">
            <label className="font-expanded text-sm font-medium">
              Jurisdiction
            </label>
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger className="minimal-input">
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                {jurisdictions.map((j) => (
                  <SelectItem key={j.code} value={j.code}>
                    {j.code} - {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Hash Preview */}
          {contentHash && (
            <div className="space-y-2">
              <label className="font-expanded text-sm font-medium">
                Content Hash (SHA-256)
              </label>
              <div className="p-3 border border-border bg-muted/20">
                <HashShort hash={contentHash} startChars={8} endChars={8} />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || policyText.length < 10 || !policyId || !version || !jurisdiction}
            className="minimal-button w-full"
          >
            {isSubmitting ? 'Publishing to Blockchain...' : 'Create Policy'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}