'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractVariables, substituteVariables } from '@/lib/policy-templates'
import { AlertCircle, Check, Wand2 } from 'lucide-react'

interface TemplateVariableEditorProps {
  content: string
  onApply: (content: string) => void
  className?: string
}

// Default values for common variables
const DEFAULT_VALUES: Record<string, string> = {
  company_name: 'Your Company Name',
  company_address: '123 Main Street, City, State, ZIP',
  contact_email: 'contact@example.com',
  contact_phone: '+1 (555) 123-4567',
  privacy_email: 'privacy@example.com',
  dpo_email: 'dpo@example.com',
  dpo_name: 'Data Protection Officer',
  effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  retention_period_account: '7',
  retention_period_transactions: '10',
  notice_period: '30',
  supervisory_authority: 'Your Local Data Protection Authority',
  supervisory_authority_url: 'https://example.com/dpa',
  eu_representative: 'N/A',
  uses_automated_decisions: 'do not',
  automated_decision_details: '',
  sells_personal_info: 'do not',
  collects_sensitive_info: 'do not',
  sensitive_info_details: '',
  honors_dnt: 'do',
  dnt_details: 'We honor Do Not Track signals from your browser.',
  request_portal_url: 'https://example.com/privacy/requests',
  toll_free_number: '1-800-555-0123',
  do_not_sell_url: 'https://example.com/do-not-sell',
  privacy_officer_name: 'Chief Privacy Officer',
  retention_period: '7 years',
  cookie_preferences_url: 'https://example.com/cookie-preferences',
}

// User-friendly labels for variables
const VARIABLE_LABELS: Record<string, string> = {
  company_name: 'Company Name',
  company_address: 'Company Address',
  contact_email: 'Contact Email',
  contact_phone: 'Contact Phone',
  privacy_email: 'Privacy Email',
  dpo_email: 'DPO Email',
  dpo_name: 'DPO Name',
  effective_date: 'Effective Date',
  retention_period_account: 'Account Retention (years)',
  retention_period_transactions: 'Transaction Retention (years)',
  notice_period: 'Notice Period (days)',
  supervisory_authority: 'Supervisory Authority Name',
  supervisory_authority_url: 'Supervisory Authority URL',
  eu_representative: 'EU Representative',
  uses_automated_decisions: 'Uses Automated Decisions (do/do not)',
  automated_decision_details: 'Automated Decision Details',
  sells_personal_info: 'Sells Personal Info (do/do not)',
  collects_sensitive_info: 'Collects Sensitive Info (do/do not)',
  sensitive_info_details: 'Sensitive Info Details',
  honors_dnt: 'Honors Do Not Track (do/do not)',
  dnt_details: 'Do Not Track Details',
  request_portal_url: 'Privacy Request Portal URL',
  toll_free_number: 'Toll-Free Number',
  do_not_sell_url: 'Do Not Sell URL',
  privacy_officer_name: 'Privacy Officer Name',
  retention_period: 'Retention Period',
  cookie_preferences_url: 'Cookie Preferences URL',
}

export default function TemplateVariableEditor({ content, onApply, className }: TemplateVariableEditorProps) {
  const [variables, setVariables] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [filledCount, setFilledCount] = useState(0)

  useEffect(() => {
    const extractedVars = extractVariables(content)
    setVariables(extractedVars)

    // Initialize with default values
    const initialValues: Record<string, string> = {}
    extractedVars.forEach(v => {
      initialValues[v] = DEFAULT_VALUES[v] || ''
    })
    setValues(initialValues)
  }, [content])

  useEffect(() => {
    // Count filled variables
    const filled = Object.values(values).filter(v => v.trim().length > 0).length
    setFilledCount(filled)
  }, [values])

  const handleApply = () => {
    const substituted = substituteVariables(content, values)
    onApply(substituted)
  }

  const handleUseDefaults = () => {
    const defaultValues: Record<string, string> = {}
    variables.forEach(v => {
      defaultValues[v] = DEFAULT_VALUES[v] || ''
    })
    setValues(defaultValues)
  }

  if (variables.length === 0) {
    return null
  }

  const isComplete = filledCount === variables.length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-expanded text-base font-semibold flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Template Variables
            <Badge variant={isComplete ? "default" : "secondary"} className="ml-2">
              {filledCount}/{variables.length}
            </Badge>
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseDefaults}
            className="text-xs"
          >
            Use Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isComplete && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              Fill in all template variables to customize this policy for your organization.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
          {variables.map((variable) => (
            <div key={variable} className="space-y-1.5">
              <label className="text-sm font-medium font-expanded flex items-center gap-2">
                {VARIABLE_LABELS[variable] || variable}
                {values[variable]?.trim() && (
                  <Check className="w-3 h-3 text-green-600" />
                )}
              </label>
              <Input
                value={values[variable] || ''}
                onChange={(e) => setValues({ ...values, [variable]: e.target.value })}
                placeholder={`Enter ${VARIABLE_LABELS[variable] || variable}`}
                className="text-sm"
              />
              <div className="text-xs text-muted-foreground font-mono">
                {`{{${variable}}}`}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            type="button"
            onClick={handleApply}
            disabled={!isComplete}
            className="flex-1"
          >
            {isComplete ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply Variables
              </>
            ) : (
              <>Fill All Variables ({filledCount}/{variables.length})</>
            )}
          </Button>
          {isComplete && (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Ready
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
