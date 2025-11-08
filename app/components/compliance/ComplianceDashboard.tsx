'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import api from '@/lib/api'
import {
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Globe,
  Lock
} from 'lucide-react'

interface ComplianceMetric {
  category: string
  score: number
  maxScore: number
  weight: number
  trend: 'improving' | 'stable' | 'declining'
}

export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    setIsLoading(true)
    try {
      // Load compliance metrics
      const metricsResponse = await api.getComplianceMetrics('30d')
      if (!metricsResponse.error && metricsResponse.data?.scores) {
        setMetrics(metricsResponse.data.scores)
      }

      // Load policies
      const policiesResponse = await api.getDemoPolicies()
      if (!policiesResponse.error) {
        setPolicies(policiesResponse.data || [])
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateOverallCompliance = () => {
    if (metrics.length === 0) return 0
    const weightedScore = metrics.reduce((acc, m) => acc + (m.score / m.maxScore) * m.weight * 100, 0)
    const totalWeight = metrics.reduce((acc, m) => acc + m.weight, 0)
    return totalWeight > 0 ? weightedScore / totalWeight : 0
  }

  const getPolicyStats = () => {
    const total = policies.length
    const published = policies.filter(p => p.status === 'published').length
    const review = policies.filter(p => p.status === 'review').length
    const draft = policies.filter(p => p.status === 'draft').length

    return { total, published, review, draft }
  }

  const overallCompliance = calculateOverallCompliance()
  const policyStats = getPolicyStats()

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 60) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const complianceLevel = getComplianceLevel(overallCompliance)

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-expanded">
            <Shield className="w-6 h-6 text-primary" />
            Overall Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-5xl font-bold font-expanded">
                {Math.round(overallCompliance)}%
              </div>
              <Badge className={`${complianceLevel.bgColor} ${complianceLevel.color} mt-2`}>
                {complianceLevel.label}
              </Badge>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-semibold">+5.2% this month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on policy coverage and GDPR requirements
              </p>
            </div>
          </div>
          <Progress value={overallCompliance} className="h-4" />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Policies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policyStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {policyStats.published} published, {policyStats.review} in review
            </p>
          </CardContent>
        </Card>

        {/* Published Policies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policyStats.published}</div>
            <Progress value={(policyStats.published / Math.max(policyStats.total, 1)) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policyStats.review}</div>
            <p className="text-xs text-muted-foreground">
              Requires legal team approval
            </p>
          </CardContent>
        </Card>

        {/* Draft Policies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policyStats.draft}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="font-expanded">Compliance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const percentage = Math.round((metric.score / metric.maxScore) * 100)
              const TrendIcon = metric.trend === 'improving' ? TrendingUp :
                metric.trend === 'declining' ? TrendingDown : Activity

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{metric.category}</div>
                      <Badge variant="outline" className="text-xs">
                        Weight: {Math.round(metric.weight * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{percentage}%</span>
                      <TrendIcon
                        className={`w-4 h-4 ${
                          metric.trend === 'improving' ? 'text-green-600' :
                            metric.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                        }`}
                      />
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}

            {metrics.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No compliance metrics available</p>
                <p className="text-xs mt-1">Create policies to start tracking compliance</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="font-expanded">Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {policyStats.review > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Review Pending Policies</div>
                  <p className="text-xs text-muted-foreground">
                    {policyStats.review} {policyStats.review === 1 ? 'policy' : 'policies'} waiting for approval
                  </p>
                </div>
              </div>
            )}

            {overallCompliance < 75 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Improve Compliance Score</div>
                  <p className="text-xs text-muted-foreground">
                    Review GDPR checklist to identify missing requirements
                  </p>
                </div>
              </div>
            )}

            {policyStats.total === 0 && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md">
                <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Create Your First Policy</div>
                  <p className="text-xs text-muted-foreground">
                    Start by creating a privacy policy using our templates
                  </p>
                </div>
              </div>
            )}

            {policyStats.published === policyStats.total && policyStats.total > 0 && overallCompliance >= 90 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Excellent Compliance Status</div>
                  <p className="text-xs text-muted-foreground">
                    All policies are published and compliance score is high
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
