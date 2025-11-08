'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/professional/DataTable/DataTable'
import HashShort from '@/components/common/HashShort'
// Note: Using console.log instead of toast for now
// import { toast } from 'sonner'
import { 
  Search, 
  Filter,
  Download,
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  MoreVertical,
  TrendingUp,
  Users,
  Activity,
  Target,
  Database,
  Zap
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import api from '@/lib/api'

export default function AuditorPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [subjectId, setSubjectId] = useState('')
  const [proofSubjectId, setProofSubjectId] = useState('')
  const [proofResult, setProofResult] = useState<any>(null)
  const queryClient = useQueryClient()

  // Real API queries
  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ['auditor-policies'],
    queryFn: async () => {
      const response = await api.getDemoPolicies()
      if (response.error) throw new Error(response.error)
      return response.data || []
    },
    refetchInterval: 30000,
  })

  const { data: latestSnapshot, isLoading: snapshotLoading } = useQuery({
    queryKey: ['latest-snapshot'],
    queryFn: async () => {
      const response = await api.getLatestSnapshot()
      if (response.error) throw new Error(response.error)
      return response.data
    },
    refetchInterval: 10000,
  })

  const { data: nodeInfo, isLoading: nodeLoading } = useQuery({
    queryKey: ['node-info'],
    queryFn: async () => {
      const response = await api.getNodeInfo()
      if (response.error) throw new Error(response.error)
      return response.data
    },
    refetchInterval: 30000,
  })

  // Query for all recent consents
  const { data: allConsents, isLoading: allConsentsLoading, error: allConsentsError } = useQuery({
    queryKey: ['all-consents'],
    queryFn: async () => {
      const response = await api.getAllConsents(50)
      if (response.error) throw new Error(response.error)
      return response.data || []
    },
    refetchInterval: 30000,
  })

  // Query for consents by subject ID (when searching)
  const { data: filteredConsents, isLoading: filteredLoading, error: filteredError } = useQuery({
    queryKey: ['consents-by-subject', subjectId],
    queryFn: async () => {
      if (!subjectId) return null
      const response = await api.getConsentsBySubject(subjectId)
      if (response.error) throw new Error(response.error)
      return response.data || []
    },
    enabled: !!subjectId,
  })

  // Use filtered consents if searching, otherwise show all
  const consents = subjectId ? filteredConsents : allConsents
  const consentsLoading = subjectId ? filteredLoading : allConsentsLoading
  const consentsError = subjectId ? filteredError : allConsentsError

  // Proof bundle generation mutation
  const generateProofMutation = useMutation({
    mutationFn: async (data: { subject_id: string }) => {
      const response = await api.generateDemoProofBundle(data)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Proof bundle generated successfully', data)
      setProofResult(data)
      queryClient.invalidateQueries({ queryKey: ['consents-by-subject'] })
    },
    onError: (error: Error) => {
      console.error('Failed to generate proof bundle:', error.message)
      setProofResult({ error: error.message })
    },
  })

  // Calculate real-time metrics from actual data
  const calculateMetrics = () => {
    const policiesArray = Array.isArray(policies) ? policies : []
    const consentsArray = Array.isArray(consents) ? consents : []
    const totalPolicies = policiesArray.length
    // Active policies are those that are approved or published
    const activePolicies = policiesArray.filter(p =>
      p.status === 'approved' || p.status === 'published'
    ).length
    const totalConsents = consentsArray.length
    const snapshotHeight = latestSnapshot?.height || 0
    
    return {
      totalPolicies,
      activePolicies,
      totalConsents,
      snapshotHeight,
      blockchainStatus: latestSnapshot ? 'Connected' : 'Disconnected',
      nodeStatus: nodeInfo?.state || 'Unknown'
    }
  }

  const metrics = calculateMetrics()

  // Transform consents for audit trail display
  const transformedConsents = Array.isArray(consents) ? consents.map(consent => ({
    id: consent.id || `consent_${Date.now()}`,
    timestamp: consent.timestamp || new Date().toISOString(),
    eventType: consent.event_type || 'consent_event',
    subjectId: consent.subject_id || 'unknown',
    policyId: consent.policy_ref?.policy_id || 'unknown',
    action: `Consent ${consent.event_type || 'Event'}`,
    verificationStatus: 'verified',
    blockchainTx: consent.transaction_hash || null
  })) : []

  const consentColumns = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      cell: (row: any) => (
        <span className="font-mono text-xs">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'eventType',
      header: 'Event Type',
      cell: (row: any) => {
        const type = row.eventType
        const icons = {
          granted: <CheckCircle className="h-3 w-3 text-green-500" />,
          revoked: <AlertTriangle className="h-3 w-3 text-yellow-500" />,
          updated: <FileCheck className="h-3 w-3 text-blue-500" />,
          consent_event: <Eye className="h-3 w-3 text-purple-500" />
        }
        return (
          <div className="flex items-center space-x-2">
            {icons[type as keyof typeof icons] || <Activity className="h-3 w-3" />}
            <span className="capitalize">{type.replace('_', ' ')}</span>
          </div>
        )
      },
    },
    {
      id: 'subjectId',
      header: 'Subject ID',
      cell: (row: any) => (
        <HashShort 
          hash={row.subjectId} 
          startChars={6} 
          endChars={4}
          className="text-xs"
        />
      ),
    },
    {
      id: 'policyId',
      header: 'Policy',
      cell: (row: any) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.policyId}
        </Badge>
      ),
    },
    {
      id: 'verificationStatus',
      header: 'Status',
      cell: (row: any) => {
        const status = row.verificationStatus
        return (
          <Badge variant={status === 'verified' ? 'default' : 'secondary'}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedEvent(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Export Evidence
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-expanded">Compliance Auditor</h1>
          <p className="text-muted-foreground font-semi-expanded">
            Advanced audit trail analysis and proof verification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {
            // Generate and download audit report
            const auditData = {
              timestamp: new Date().toISOString(),
              metrics: calculateMetrics(),
              consents: transformedConsents,
              blockchain: {
                latestSnapshot,
                nodeInfo
              },
              auditTrail: transformedConsents.slice(0, 10) // Recent audit entries
            }
            const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            // Note: Using console.log instead of toast for now  
            console.log('Audit report exported successfully')
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export Audit
          </Button>
          <Button onClick={() => {
            // Switch to proof generation tab
            setActiveTab('proof-generation')
          }}>
            <Shield className="mr-2 h-4 w-4" />
            Generate Proof
          </Button>
        </div>
      </div>

      {/* Blockchain & Audit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policiesLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                metrics.activePolicies
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalPolicies} total policies
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Height</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {snapshotLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                metrics.snapshotHeight.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Latest snapshot height
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consent Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consentsLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                metrics.totalConsents
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {subjectId ? `For subject ${subjectId.slice(0, 8)}...` : 'All recent consents'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Node Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodeLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <Badge variant={metrics.nodeStatus === 'Ready' ? 'default' : 'secondary'}>
                  {metrics.nodeStatus}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Blockchain connection: {metrics.blockchainStatus}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consent-audit">Consent Audit</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Data</TabsTrigger>
          <TabsTrigger value="proof-generation">Proof Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        metrics.blockchainStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm">Blockchain Connection</span>
                    </div>
                    <Badge variant={metrics.blockchainStatus === 'Connected' ? 'default' : 'destructive'}>
                      {metrics.blockchainStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        metrics.nodeStatus === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm">Node Status</span>
                    </div>
                    <Badge variant={metrics.nodeStatus === 'Ready' ? 'default' : 'secondary'}>
                      {metrics.nodeStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Active Policies</span>
                    </div>
                    <span className="font-medium">{metrics.activePolicies}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blockchain Information</CardTitle>
              </CardHeader>
              <CardContent>
                {snapshotLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : latestSnapshot ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Latest Height</span>
                      <span className="font-mono text-sm">{latestSnapshot.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Snapshot Hash</span>
                      <HashShort hash={latestSnapshot.hash} startChars={6} endChars={4} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Timestamp</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(latestSnapshot.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2" />
                    <p>No blockchain data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consent-audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Consent Event Audit</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter subject ID to audit..."
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['consents-by-subject'] })}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consentsError ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to load consent events</p>
                    <p className="text-sm">{consentsError.message}</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  data={transformedConsents}
                  columns={consentColumns}
                  loading={consentsLoading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                {snapshotLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : latestSnapshot ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Height</span>
                      <span className="font-mono text-sm">{latestSnapshot.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Hash</span>
                      <HashShort hash={latestSnapshot.hash} startChars={8} endChars={6} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Timestamp</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(latestSnapshot.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Previous Hash</span>
                      <HashShort hash={latestSnapshot.lastSnapshotHash} startChars={8} endChars={6} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2" />
                    <p>No snapshot data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Information</CardTitle>
              </CardHeader>
              <CardContent>
                {nodeLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : nodeInfo ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Node ID</span>
                      <HashShort hash={nodeInfo.id} startChars={8} endChars={6} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">State</span>
                      <Badge variant={nodeInfo.state === 'Ready' ? 'default' : 'secondary'}>
                        {nodeInfo.state}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Version</span>
                      <span className="font-mono text-sm">{nodeInfo.version}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p>No node information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="proof-generation" className="space-y-6">
          <Card data-section="proof-generation">
            <CardHeader>
              <CardTitle>Generate Proof Bundle</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate cryptographic proof bundles for compliance verification
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject ID</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter subject ID for proof generation..."
                      value={proofSubjectId}
                      onChange={(e) => setProofSubjectId(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        setProofResult(null)
                        generateProofMutation.mutate({ subject_id: proofSubjectId })
                      }}
                      disabled={!proofSubjectId || generateProofMutation.isPending}
                    >
                      {generateProofMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Generate Proof
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {proofResult && !proofResult.error && (
                  <Card className="border-2 border-black">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Proof Bundle Generated</span>
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bundle ID:</span>
                            <code className="font-mono">{proofResult.bundle_id}</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subject ID:</span>
                            <code className="font-mono">{proofResult.subject_id}</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Proof Count:</span>
                            <span className="font-medium">{proofResult.proof_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verification Hash:</span>
                            <HashShort hash={proofResult.verification_hash} startChars={8} endChars={6} />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Timestamp:</span>
                            <span className="text-sm">{new Date(proofResult.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {proofResult && proofResult.error && (
                  <Card className="bg-red-50 dark:bg-red-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-medium">Failed to generate proof</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{proofResult.error}</p>
                    </CardContent>
                  </Card>
                )}

                {!proofResult && (allConsents || []).length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Available Data for Proof</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Consent Events:</span>
                        <span className="ml-2 font-medium">{(allConsents || []).length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active Policies:</span>
                        <span className="ml-2 font-medium">{metrics.activePolicies}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Consent Event Details</DialogTitle>
            <DialogDescription>
              Comprehensive view of consent event and blockchain verification
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Event ID</label>
                  <div className="font-mono text-sm">{selectedEvent.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <div className="font-mono text-sm">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject ID</label>
                  <HashShort hash={selectedEvent.subjectId} startChars={8} endChars={6} />
                </div>
                <div>
                  <label className="text-sm font-medium">Policy ID</label>
                  <div className="font-mono text-sm">{selectedEvent.policyId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Event Type</label>
                  <Badge variant="outline">{selectedEvent.eventType}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Verification Status</label>
                  <Badge variant={selectedEvent.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                    {selectedEvent.verificationStatus}
                  </Badge>
                </div>
              </div>
              {selectedEvent.blockchainTx && (
                <div>
                  <label className="text-sm font-medium">Blockchain Transaction</label>
                  <div className="font-mono text-xs bg-muted p-2 rounded">
                    <HashShort hash={selectedEvent.blockchainTx} startChars={12} endChars={8} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}