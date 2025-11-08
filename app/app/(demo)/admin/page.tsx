'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/professional/DataTable/DataTable'
// Note: Using console.log instead of toast for now
// import { toast } from 'sonner'
import { 
  Settings, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  Users,
  Shield,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Activity
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
import PolicyApprovalWorkflow from '@/components/common/PolicyApprovalWorkflow'
import PolicyExportDialog from '@/components/common/PolicyExportDialog'
import AdvancedPolicyEditor from '@/components/common/AdvancedPolicyEditor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import api from '@/lib/api'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)
  const [policyToExport, setPolicyToExport] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // Real API queries
  const { data: policies, isLoading: policiesLoading, error: policiesError } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: async () => {
      const response = await api.getDemoPolicies()
      if (response.error) throw new Error(response.error)
      return response.data || []
    },
    refetchInterval: 30000,
  })

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await api.getHealth()
      if (response.error) throw new Error(response.error)
      return response.data
    },
    refetchInterval: 10000,
  })

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.getDashboardStats()
      if (response.error) throw new Error(response.error)
      return response.data
    },
    refetchInterval: 30000,
  })

  const { data: complianceMetrics, isLoading: complianceLoading } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async () => {
      const response = await api.getComplianceMetrics('30d')
      if (response.error) throw new Error(response.error)
      return response.data
    },
    refetchInterval: 60000, // Refresh every minute
  })

  const { data: activityFeed, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const response = await api.getActivityFeed(10)
      if (response.error) throw new Error(response.error)
      return response.data || []
    },
    refetchInterval: 30000,
  })

  // Mutations for policy operations
  const createPolicyMutation = useMutation({
    mutationFn: async (policyData: any) => {
      const response = await api.createDemoPolicy(policyData)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] })
      console.log('Policy created successfully')
      setIsCreateDialogOpen(false)
    },
    onError: (error: Error) => {
      console.error('Failed to create policy:', error.message)
    },
  })

  // Calculate real-time metrics from actual data
  const calculateMetrics = () => {
    const policiesArray = Array.isArray(policies) ? policies : []
    // Active policies are those that are approved or published
    const activePolicies = policiesArray.filter(p =>
      p.status === 'approved' || p.status === 'published'
    )
    const totalPolicies = policiesArray.length

    return {
      activePolicies: activePolicies.length,
      totalPolicies,
      systemHealth: healthData?.status === 'healthy' ? 'Operational' : 'Issues Detected',
      apiConnections: healthData?.checks ? Object.keys(healthData.checks).length : 0
    }
  }

  const metrics = calculateMetrics()

  // Transform policies for display
  const transformedPolicies = Array.isArray(policies) ? policies.map(policy => ({
    id: policy.policy_id || policy.id,
    name: policy.policy_id || 'Unnamed Policy',
    version: policy.version || '1.0.0',
    status: policy.status || 'draft',
    jurisdiction: policy.jurisdiction || 'Global',
    lastUpdated: policy.updated_at || policy.created_at || new Date().toISOString(),
    contentHash: policy.content_hash,
    uri: policy.uri,
    text: policy.text,
    approval_history: policy.approval_history || []
  })) : []

  const policyColumns = [
    {
      id: 'name',
      header: 'Policy ID',
      cell: (row: any) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium font-mono text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      id: 'version',
      header: 'Version',
      cell: (row: any) => (
        <Badge variant="outline" className="font-mono text-xs">
          v{row.version}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row: any) => {
        const status = row.status
        const statusConfig = {
          draft: { variant: 'secondary' as const, icon: FileText, color: 'bg-gray-100 text-gray-800' },
          review: { variant: 'outline' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
          approved: { variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
          published: { variant: 'default' as const, icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
          archived: { variant: 'secondary' as const, icon: FileText, color: 'bg-gray-100 text-gray-600' }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
        const Icon = config.icon

        return (
          <Badge className={`${config.color} border font-expanded`}>
            <Icon className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'jurisdiction',
      header: 'Jurisdiction',
      cell: (row: any) => <span>{row.jurisdiction}</span>,
    },
    {
      id: 'lastUpdated',
      header: 'Last Updated',
      cell: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.lastUpdated).toLocaleDateString()}
        </span>
      ),
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
            <DropdownMenuItem onClick={() => setSelectedPolicy(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPolicyToExport(row)}>
              <Download className="mr-2 h-4 w-4" />
              Export to HTML
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Policy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
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
          <h1 className="text-3xl font-bold font-expanded">Privacy Administration</h1>
          <p className="text-muted-foreground font-semi-expanded">
            Comprehensive policy management and compliance oversight
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {
            // Generate and download compliance report
            const reportData = {
              timestamp: new Date().toISOString(),
              metrics: calculateMetrics(),
              policies: transformedPolicies,
              systemHealth: healthData
            }
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            // Note: Using console.log instead of toast for now
            console.log('Compliance report exported successfully')
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => {
            console.log('New Policy button clicked')
            setIsCreateDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <Badge variant={healthData?.status === 'healthy' ? 'default' : 'destructive'}>
                  {metrics.systemHealth}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.apiConnections} services monitored
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <Badge variant={healthData?.checks?.api?.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthData?.checks?.api?.status || 'Unknown'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Response time: {healthData?.checks?.api?.latency || 'N/A'}ms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <Badge variant={healthData?.checks?.storage?.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthData?.checks?.storage?.status || 'Unknown'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Latency: {healthData?.checks?.storage?.latency || 'N/A'}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {complianceLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-muted animate-pulse rounded-full h-2" />
                          <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : complianceMetrics?.scores ? (
                  <div className="space-y-4">
                    {complianceMetrics.scores.map((score: any) => {
                      const percentage = Math.round((score.score / score.maxScore) * 100);
                      const getColor = (pct: number) => {
                        if (pct >= 90) return 'bg-green-500';
                        if (pct >= 75) return 'bg-yellow-500';
                        return 'bg-red-500';
                      };
                      
                      return (
                        <div key={score.category} className="flex items-center justify-between">
                          <span className="text-sm">{score.category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getColor(percentage)}`} 
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>No compliance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-muted animate-pulse rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
                          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : activityFeed && activityFeed.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeed.slice(0, 5).map((activity: any) => {
                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'policy_created': return 'bg-green-500';
                          case 'policy_updated': return 'bg-blue-500';
                          case 'system_check': return 'bg-yellow-500';
                          case 'user_action': return 'bg-purple-500';
                          default: return 'bg-gray-500';
                        }
                      };

                      const timeAgo = (timestamp: string) => {
                        const now = new Date();
                        const time = new Date(timestamp);
                        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
                        
                        if (diffInHours < 1) return 'Just now';
                        if (diffInHours === 1) return '1h ago';
                        if (diffInHours < 24) return `${diffInHours}h ago`;
                        const diffInDays = Math.floor(diffInHours / 24);
                        return diffInDays === 1 ? '1d ago' : `${diffInDays}d ago`;
                      };

                      return (
                        <div key={activity.id} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{activity.title}</div>
                            <div className="text-xs text-muted-foreground">{activity.description}</div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(activity.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Policy Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search policies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Policy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {policiesError ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to load policies</p>
                    <p className="text-sm">{policiesError.message}</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  data={transformedPolicies}
                  columns={policyColumns}
                  loading={policiesLoading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : healthData?.checks ? (
                  <div className="space-y-4">
                    {Object.entries(healthData.checks).map(([service, status]: [string, any]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'}>
                          {status.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>No service data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-2 w-full bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>API Response Time</span>
                        <span>{healthData?.checks?.api?.latency || 0}ms</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((healthData?.checks?.api?.latency || 0) / 1000 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage Latency</span>
                        <span>{healthData?.checks?.storage?.latency || 0}ms</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((healthData?.checks?.storage?.latency || 0) / 100 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active Policies</span>
                        <span>{metrics.activePolicies}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(metrics.activePolicies / 50 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Jurisdiction</label>
                  <Input defaultValue="Global" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Compliance Threshold</label>
                  <Input defaultValue="85%" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audit Retention (days)</label>
                  <Input defaultValue="365" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Timeout</span>
                  <span className="text-sm text-muted-foreground">30 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Policy</span>
                  <Badge variant="default">Strong</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Policy Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Policy</DialogTitle>
            <DialogDescription>
              Create a new privacy policy that will be stored on the blockchain
            </DialogDescription>
          </DialogHeader>
          <PolicyCreationForm
            onSubmit={(data) => createPolicyMutation.mutate(data)}
            isLoading={createPolicyMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Policy Details Dialog */}
      <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Policy Details & Approval</DialogTitle>
            <DialogDescription>
              Comprehensive view of policy information, blockchain data, and approval workflow
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="space-y-6">
              {/* Policy Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Policy ID</label>
                  <div className="font-mono text-sm">{selectedPolicy.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <div className="font-mono text-sm">v{selectedPolicy.version}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Jurisdiction</label>
                  <div className="text-sm">{selectedPolicy.jurisdiction}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <div className="text-sm">{new Date(selectedPolicy.lastUpdated).toLocaleString()}</div>
                </div>
              </div>
              {selectedPolicy.contentHash && (
                <div>
                  <label className="text-sm font-medium">Content Hash</label>
                  <div className="font-mono text-xs bg-muted p-2 rounded">
                    {selectedPolicy.contentHash}
                  </div>
                </div>
              )}
              {selectedPolicy.uri && (
                <div>
                  <label className="text-sm font-medium">URI</label>
                  <div className="text-sm text-blue-600 hover:underline">
                    <a href={selectedPolicy.uri} target="_blank" rel="noopener noreferrer">
                      {selectedPolicy.uri}
                    </a>
                  </div>
                </div>
              )}

              {/* Approval Workflow */}
              <PolicyApprovalWorkflow
                policyId={selectedPolicy.id}
                currentStatus={selectedPolicy.status}
                approvalHistory={selectedPolicy.approval_history || []}
                onStatusUpdate={() => {
                  // Refresh policies and close dialog
                  queryClient.invalidateQueries({ queryKey: ['admin-policies'] })
                  setSelectedPolicy(null)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Policy Export Dialog */}
      <PolicyExportDialog
        isOpen={!!policyToExport}
        onClose={() => setPolicyToExport(null)}
        policy={policyToExport ? {
          policy_id: policyToExport.id,
          version: policyToExport.version,
          text: policyToExport.text || '<p>Policy content not available</p>',
          content_hash: policyToExport.contentHash || '',
          jurisdiction: policyToExport.jurisdiction,
          effective_from: new Date().toISOString(),
          status: policyToExport.status,
          created_at: policyToExport.lastUpdated,
          updated_at: policyToExport.lastUpdated,
          approval_history: policyToExport.approval_history || []
        } : null}
      />
    </div>
  )
}

// Policy Creation Form Component
function PolicyCreationForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState({
    policy_id: '',
    version: '1.0.0',
    text: '',
    jurisdiction: 'US',
    effective_from: new Date().toISOString()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Generate SHA-256 hash of policy text (64 hex characters)
    const encoder = new TextEncoder()
    const data = encoder.encode(formData.text + formData.policy_id + formData.version)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const content_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const uri = `https://policies.example.com/${formData.policy_id}/v${formData.version}`

    onSubmit({
      ...formData,
      content_hash,
      uri
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Policy ID</label>
          <Input
            value={formData.policy_id}
            onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
            placeholder="e.g., gdpr-privacy-policy"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Version</label>
          <Input
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="1.0.0"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Jurisdiction (2-letter code)</label>
        <Input
          value={formData.jurisdiction}
          onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value.toUpperCase() })}
          placeholder="US, EU, CA, etc."
          maxLength={2}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Effective From</label>
        <Input
          type="datetime-local"
          value={formData.effective_from.slice(0, 16)}
          onChange={(e) => setFormData({ ...formData, effective_from: new Date(e.target.value).toISOString() })}
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Policy Text</label>
        <AdvancedPolicyEditor
          content={formData.text}
          onChange={(html) => setFormData({ ...formData, text: html })}
          placeholder="Enter the full policy text here... Use the toolbar for professional formatting"
          minHeight="calc(95vh - 500px)"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setFormData({
          policy_id: '',
          version: '1.0.0',
          text: '',
          jurisdiction: 'US',
          effective_from: new Date().toISOString()
        })}>
          Reset
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Policy
            </>
          )}
        </Button>
      </div>
    </form>
  )
}