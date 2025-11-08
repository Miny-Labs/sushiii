'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Shield,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info
} from 'lucide-react'

export interface ConsentWidgetConfig {
  // Branding
  primaryColor?: string
  accentColor?: string
  borderRadius?: string
  fontFamily?: string

  // Behavior
  policies?: string[] // Array of policy IDs to display
  requireAllConsent?: boolean // Require all policies to be accepted
  showPolicyDetails?: boolean // Allow expanding policy text
  allowIndividualRevoke?: boolean // Allow revoking individual policies

  // Callbacks
  onConsentGranted?: (policyIds: string[]) => void
  onConsentRevoked?: (policyIds: string[]) => void

  // Subject identification
  subjectId?: string // Optional pre-filled subject ID
}

interface Policy {
  policy_id: string
  version: string
  text: string
  jurisdiction: string
  status: string
  created_at: string
}

export default function ConsentWidget({
  primaryColor = '#000000',
  accentColor = '#22c55e',
  borderRadius = '8px',
  fontFamily = 'system-ui, sans-serif',
  policies: policyFilter,
  requireAllConsent = false,
  showPolicyDetails = true,
  allowIndividualRevoke = true,
  onConsentGranted,
  onConsentRevoked,
  subjectId: externalSubjectId
}: ConsentWidgetConfig) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjectId, setSubjectId] = useState(externalSubjectId || '')

  // Load policies on mount
  useEffect(() => {
    loadPolicies()
  }, [])

  const loadPolicies = async () => {
    setIsLoading(true)
    try {
      const result = await api.getDemoPolicies()
      if (result.error) {
        throw new Error(result.error)
      }

      let loadedPolicies = result.data || []

      // Filter by policy IDs if specified
      if (policyFilter && policyFilter.length > 0) {
        loadedPolicies = loadedPolicies.filter((p: Policy) =>
          policyFilter.includes(p.policy_id)
        )
      }

      // Only show published policies
      loadedPolicies = loadedPolicies.filter((p: Policy) =>
        p.status === 'published'
      )

      setPolicies(loadedPolicies)

      // Initialize consent state
      const initialConsents: Record<string, boolean> = {}
      loadedPolicies.forEach((p: Policy) => {
        initialConsents[p.policy_id] = false
      })
      setConsents(initialConsents)
    } catch (error: any) {
      toast.error(`Failed to load policies: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConsentChange = (policyId: string, granted: boolean) => {
    setConsents(prev => ({
      ...prev,
      [policyId]: granted
    }))
  }

  const handleGrantAll = async () => {
    if (!subjectId.trim()) {
      toast.error('Please enter a user identifier')
      return
    }

    setIsSubmitting(true)
    try {
      const grantedPolicies: string[] = []

      // Submit consent for each policy
      for (const policy of policies) {
        const result = await api.submitConsent({
          subject_id: subjectId,
          policy_ref: {
            policy_id: policy.policy_id,
            version: policy.version
          },
          event_type: 'granted',
          timestamp: new Date().toISOString()
        })

        if (result.error) {
          throw new Error(`Failed to grant consent for ${policy.policy_id}`)
        }

        grantedPolicies.push(policy.policy_id)
        handleConsentChange(policy.policy_id, true)
      }

      toast.success(`Consent granted for ${grantedPolicies.length} policies`)

      if (onConsentGranted) {
        onConsentGranted(grantedPolicies)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevokeAll = async () => {
    if (!subjectId.trim()) {
      toast.error('Please enter a user identifier')
      return
    }

    setIsSubmitting(true)
    try {
      const revokedPolicies: string[] = []

      // Submit revocation for each policy
      for (const policy of policies) {
        const result = await api.submitConsent({
          subject_id: subjectId,
          policy_ref: {
            policy_id: policy.policy_id,
            version: policy.version
          },
          event_type: 'revoked',
          timestamp: new Date().toISOString()
        })

        if (result.error) {
          throw new Error(`Failed to revoke consent for ${policy.policy_id}`)
        }

        revokedPolicies.push(policy.policy_id)
        handleConsentChange(policy.policy_id, false)
      }

      toast.success(`Consent revoked for ${revokedPolicies.length} policies`)

      if (onConsentRevoked) {
        onConsentRevoked(revokedPolicies)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIndividualConsent = async (policy: Policy, granted: boolean) => {
    if (!subjectId.trim()) {
      toast.error('Please enter a user identifier')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await api.submitConsent({
        subject_id: subjectId,
        policy_ref: {
          policy_id: policy.policy_id,
          version: policy.version
        },
        event_type: granted ? 'granted' : 'revoked',
        timestamp: new Date().toISOString()
      })

      if (result.error) {
        throw new Error(result.error)
      }

      handleConsentChange(policy.policy_id, granted)
      toast.success(`Consent ${granted ? 'granted' : 'revoked'} for ${policy.policy_id}`)

      if (granted && onConsentGranted) {
        onConsentGranted([policy.policy_id])
      } else if (!granted && onConsentRevoked) {
        onConsentRevoked([policy.policy_id])
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePolicyExpand = (policyId: string) => {
    setExpandedPolicies(prev => ({
      ...prev,
      [policyId]: !prev[policyId]
    }))
  }

  const allConsented = Object.values(consents).every(c => c === true)
  const someConsented = Object.values(consents).some(c => c === true)

  return (
    <Card
      className="shadow-lg"
      style={{
        borderRadius,
        fontFamily,
        borderColor: primaryColor,
        borderWidth: '2px'
      }}
    >
      <CardHeader
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: primaryColor }} />
          <span style={{ color: primaryColor }}>Privacy Consent</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Review and manage your privacy preferences
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Subject ID Input - only show if not pre-filled */}
        {!externalSubjectId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Identifier</label>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="Enter your email or user ID"
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderRadius, borderColor: primaryColor }}
            />
            <p className="text-xs text-muted-foreground">
              <Info className="inline w-3 h-3 mr-1" />
              This identifier is hashed before being stored on the blockchain
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: primaryColor }} />
            <p className="text-sm text-muted-foreground mt-2">Loading policies...</p>
          </div>
        )}

        {/* No Policies */}
        {!isLoading && policies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No published policies available</p>
          </div>
        )}

        {/* Policy List */}
        {!isLoading && policies.length > 0 && (
          <div className="space-y-4">
            {policies.map((policy) => (
              <div
                key={policy.policy_id}
                className="border rounded-lg p-4 space-y-3"
                style={{ borderRadius, borderColor: consents[policy.policy_id] ? accentColor : '#e5e7eb' }}
              >
                {/* Policy Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{policy.policy_id}</h3>
                      <Badge variant="outline" className="text-xs">
                        v{policy.version}
                      </Badge>
                      {policy.jurisdiction && (
                        <Badge variant="secondary" className="text-xs">
                          {policy.jurisdiction}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Effective: {new Date(policy.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Consent Status */}
                  <div className="flex items-center gap-2">
                    {consents[policy.policy_id] ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Consented
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Consented
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Policy Text - Expandable */}
                {showPolicyDetails && (
                  <div>
                    <button
                      onClick={() => togglePolicyExpand(policy.policy_id)}
                      className="flex items-center gap-1 text-sm hover:underline"
                      style={{ color: primaryColor }}
                    >
                      {expandedPolicies[policy.policy_id] ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View Details
                        </>
                      )}
                    </button>

                    {expandedPolicies[policy.policy_id] && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: policy.text }}
                      />
                    )}
                  </div>
                )}

                {/* Individual Consent Actions */}
                {allowIndividualRevoke && (
                  <div className="flex gap-2">
                    {!consents[policy.policy_id] ? (
                      <Button
                        size="sm"
                        onClick={() => handleIndividualConsent(policy, true)}
                        disabled={isSubmitting || !subjectId.trim()}
                        style={{ backgroundColor: accentColor, borderRadius }}
                        className="flex-1 text-white hover:opacity-90"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIndividualConsent(policy, false)}
                        disabled={isSubmitting || !subjectId.trim()}
                        style={{ borderRadius }}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions */}
        {!isLoading && policies.length > 0 && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleGrantAll}
              disabled={isSubmitting || allConsented || !subjectId.trim()}
              style={{ backgroundColor: accentColor, borderRadius }}
              className="flex-1 text-white hover:opacity-90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Processing...' : 'Accept All'}
            </Button>

            {someConsented && (
              <Button
                onClick={handleRevokeAll}
                disabled={isSubmitting || !subjectId.trim()}
                variant="outline"
                style={{ borderRadius }}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Processing...' : 'Revoke All'}
              </Button>
            )}
          </div>
        )}

        {/* Blockchain Info */}
        <div className="text-xs text-center text-muted-foreground pt-2 border-t">
          <Shield className="inline w-3 h-3 mr-1" />
          All consent records are secured on the blockchain
        </div>
      </CardContent>
    </Card>
  )
}
