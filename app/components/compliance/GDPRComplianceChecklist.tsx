'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'

interface ComplianceItem {
  id: string
  article: string
  title: string
  description: string
  required: boolean
  category: 'transparency' | 'rights' | 'security' | 'processing' | 'transfers'
  checkpoints: string[]
}

const GDPR_REQUIREMENTS: ComplianceItem[] = [
  {
    id: 'art-13-14',
    article: 'Articles 13 & 14',
    title: 'Information to be Provided',
    description: 'Provide clear information about data processing at collection',
    required: true,
    category: 'transparency',
    checkpoints: [
      'Controller identity and contact details',
      'Data Protection Officer contact details (if applicable)',
      'Purposes and legal basis for processing',
      'Legitimate interests (if applicable)',
      'Recipients or categories of recipients',
      'Information about international transfers',
      'Retention periods or criteria',
      'Rights of the data subject (access, rectification, erasure, etc.)',
      'Right to withdraw consent',
      'Right to lodge a complaint with supervisory authority',
      'Whether providing data is statutory/contractual requirement',
      'Information about automated decision-making and profiling'
    ]
  },
  {
    id: 'art-15',
    article: 'Article 15',
    title: 'Right of Access',
    description: 'Enable data subjects to access their personal data',
    required: true,
    category: 'rights',
    checkpoints: [
      'Mechanism for data subjects to request access',
      'Process to provide copy of personal data',
      'Information about ongoing processing',
      'Response within one month timeframe',
      'Free of charge for first request'
    ]
  },
  {
    id: 'art-16',
    article: 'Article 16',
    title: 'Right to Rectification',
    description: 'Allow correction of inaccurate personal data',
    required: true,
    category: 'rights',
    checkpoints: [
      'Process for requesting data rectification',
      'Procedure to complete inaccurate data',
      'Response timeframe (one month)',
      'Notification to recipients of rectifications'
    ]
  },
  {
    id: 'art-17',
    article: 'Article 17',
    title: 'Right to Erasure ("Right to be Forgotten")',
    description: 'Delete personal data when requested under certain conditions',
    required: true,
    category: 'rights',
    checkpoints: [
      'Deletion request mechanism',
      'Grounds for erasure clearly stated',
      'Exceptions to erasure documented',
      'Process to inform third parties of erasure',
      'Response within one month'
    ]
  },
  {
    id: 'art-18',
    article: 'Article 18',
    title: 'Right to Restriction of Processing',
    description: 'Restrict processing under certain circumstances',
    required: true,
    category: 'rights',
    checkpoints: [
      'Process to request restriction',
      'Conditions for restriction documented',
      'Notification of lifting restriction',
      'Information to data subject before lifting restriction'
    ]
  },
  {
    id: 'art-20',
    article: 'Article 20',
    title: 'Right to Data Portability',
    description: 'Receive and transmit personal data in structured format',
    required: true,
    category: 'rights',
    checkpoints: [
      'Mechanism to export data in machine-readable format',
      'Ability to transmit data to another controller',
      'Common format (JSON, CSV, XML)',
      'Applies to automated processing based on consent or contract'
    ]
  },
  {
    id: 'art-21',
    article: 'Article 21',
    title: 'Right to Object',
    description: 'Object to processing for certain purposes',
    required: true,
    category: 'rights',
    checkpoints: [
      'Right to object to processing clearly stated',
      'Object to direct marketing',
      'Object to automated decision-making and profiling',
      'Stop processing unless compelling legitimate grounds'
    ]
  },
  {
    id: 'art-25',
    article: 'Article 25',
    title: 'Data Protection by Design and Default',
    description: 'Implement privacy-protective measures',
    required: true,
    category: 'security',
    checkpoints: [
      'Privacy by design principles applied',
      'Data minimization implemented',
      'Pseudonymization where appropriate',
      'Default settings protect privacy'
    ]
  },
  {
    id: 'art-30',
    article: 'Article 30',
    title: 'Records of Processing Activities',
    description: 'Maintain records of all data processing',
    required: true,
    category: 'processing',
    checkpoints: [
      'Controller and DPO contact details recorded',
      'Purposes of processing documented',
      'Categories of data subjects and personal data',
      'Categories of recipients',
      'International transfers documented',
      'Retention periods specified',
      'Security measures described'
    ]
  },
  {
    id: 'art-32',
    article: 'Article 32',
    title: 'Security of Processing',
    description: 'Implement appropriate technical and organizational measures',
    required: true,
    category: 'security',
    checkpoints: [
      'Pseudonymization and encryption',
      'Confidentiality, integrity, availability assured',
      'Ability to restore access after incident',
      'Regular testing and assessment',
      'State of the art security measures'
    ]
  },
  {
    id: 'art-33-34',
    article: 'Articles 33 & 34',
    title: 'Data Breach Notification',
    description: 'Notify breaches to authority and data subjects',
    required: true,
    category: 'security',
    checkpoints: [
      'Process to detect breaches',
      'Notification to supervisory authority within 72 hours',
      'Notification to data subjects when high risk',
      'Documentation of breaches maintained'
    ]
  },
  {
    id: 'art-37',
    article: 'Article 37',
    title: 'Data Protection Officer',
    description: 'Designate DPO when required',
    required: false,
    category: 'processing',
    checkpoints: [
      'Assessment whether DPO required',
      'DPO designated if core activities involve systematic monitoring',
      'DPO designated if processing special categories at large scale',
      'DPO contact details published',
      'DPO reported to supervisory authority'
    ]
  },
  {
    id: 'art-44-50',
    article: 'Articles 44-50',
    title: 'International Data Transfers',
    description: 'Ensure adequate protection for data transfers outside EEA',
    required: false,
    category: 'transfers',
    checkpoints: [
      'Adequacy decision exists for destination country',
      'Standard Contractual Clauses in place',
      'Binding Corporate Rules adopted',
      'Transfer Impact Assessment conducted',
      'Supplementary measures implemented if needed'
    ]
  }
]

export default function GDPRComplianceChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean[]>>({})
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  // Initialize checked items
  useEffect(() => {
    const initialChecked: Record<string, boolean[]> = {}
    GDPR_REQUIREMENTS.forEach(req => {
      initialChecked[req.id] = new Array(req.checkpoints.length).fill(false)
    })
    setCheckedItems(initialChecked)
  }, [])

  const toggleCheckpoint = (reqId: string, checkpointIndex: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [reqId]: prev[reqId].map((checked, idx) =>
        idx === checkpointIndex ? !checked : checked
      )
    }))
  }

  const toggleExpanded = (reqId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [reqId]: !prev[reqId]
    }))
  }

  const getRequirementProgress = (reqId: string) => {
    const total = checkedItems[reqId]?.length || 0
    const checked = checkedItems[reqId]?.filter(Boolean).length || 0
    return total > 0 ? (checked / total) * 100 : 0
  }

  const getOverallProgress = () => {
    let totalCheckpoints = 0
    let checkedCheckpoints = 0

    GDPR_REQUIREMENTS.forEach(req => {
      totalCheckpoints += req.checkpoints.length
      checkedCheckpoints += checkedItems[req.id]?.filter(Boolean).length || 0
    })

    return totalCheckpoints > 0 ? (checkedCheckpoints / totalCheckpoints) * 100 : 0
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      transparency: 'bg-blue-100 text-blue-800 border-blue-300',
      rights: 'bg-green-100 text-green-800 border-green-300',
      security: 'bg-red-100 text-red-800 border-red-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      transfers: 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return colors[category as keyof typeof colors] || colors.processing
  }

  const overallProgress = getOverallProgress()
  const filteredRequirements = filterCategory
    ? GDPR_REQUIREMENTS.filter(req => req.category === filterCategory)
    : GDPR_REQUIREMENTS

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-expanded text-xl">GDPR Compliance Checklist</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ensure your privacy policy meets GDPR requirements
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-expanded">
                {Math.round(overallProgress)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {GDPR_REQUIREMENTS.reduce((acc, req) => acc + (checkedItems[req.id]?.filter(Boolean).length || 0), 0)} of{' '}
              {GDPR_REQUIREMENTS.reduce((acc, req) => acc + req.checkpoints.length, 0)} checkpoints completed
            </span>
            <span>
              {GDPR_REQUIREMENTS.filter(req => getRequirementProgress(req.id) === 100).length} of{' '}
              {GDPR_REQUIREMENTS.length} articles complete
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory(null)}
        >
          All ({GDPR_REQUIREMENTS.length})
        </Button>
        <Button
          variant={filterCategory === 'transparency' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('transparency')}
          className={filterCategory === 'transparency' ? '' : getCategoryColor('transparency')}
        >
          Transparency ({GDPR_REQUIREMENTS.filter(r => r.category === 'transparency').length})
        </Button>
        <Button
          variant={filterCategory === 'rights' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('rights')}
          className={filterCategory === 'rights' ? '' : getCategoryColor('rights')}
        >
          Rights ({GDPR_REQUIREMENTS.filter(r => r.category === 'rights').length})
        </Button>
        <Button
          variant={filterCategory === 'security' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('security')}
          className={filterCategory === 'security' ? '' : getCategoryColor('security')}
        >
          Security ({GDPR_REQUIREMENTS.filter(r => r.category === 'security').length})
        </Button>
        <Button
          variant={filterCategory === 'processing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('processing')}
          className={filterCategory === 'processing' ? '' : getCategoryColor('processing')}
        >
          Processing ({GDPR_REQUIREMENTS.filter(r => r.category === 'processing').length})
        </Button>
        <Button
          variant={filterCategory === 'transfers' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('transfers')}
          className={filterCategory === 'transfers' ? '' : getCategoryColor('transfers')}
        >
          Transfers ({GDPR_REQUIREMENTS.filter(r => r.category === 'transfers').length})
        </Button>
      </div>

      {/* Requirements List */}
      <div className="space-y-4">
        {filteredRequirements.map(requirement => {
          const progress = getRequirementProgress(requirement.id)
          const isComplete = progress === 100
          const isExpanded = expandedItems[requirement.id]

          return (
            <Card key={requirement.id} className={isComplete ? 'border-green-500' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => toggleExpanded(requirement.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {requirement.article}
                      </Badge>
                      <Badge className={`${getCategoryColor(requirement.category)} text-xs`}>
                        {requirement.category}
                      </Badge>
                      {requirement.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {isComplete && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-base font-expanded">{requirement.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{requirement.description}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">{Math.round(progress)}%</div>
                      <Progress value={progress} className="w-16 h-2" />
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="space-y-3">
                    {requirement.checkpoints.map((checkpoint, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`${requirement.id}-${index}`}
                          checked={checkedItems[requirement.id]?.[index] || false}
                          onCheckedChange={() => toggleCheckpoint(requirement.id, index)}
                          className="mt-1"
                        />
                        <label
                          htmlFor={`${requirement.id}-${index}`}
                          className={`text-sm cursor-pointer flex-1 ${
                            checkedItems[requirement.id]?.[index]
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {checkpoint}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
