'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  FileCheck,
  Send,
  CheckCircle,
  XCircle,
  Archive,
  Clock,
  User,
  MessageSquare
} from 'lucide-react'

interface PolicyApprovalWorkflowProps {
  policyId: string
  currentStatus: 'draft' | 'review' | 'approved' | 'published' | 'archived'
  approvalHistory?: Array<{
    from_status: string
    to_status: string
    approver_name: string
    approval_notes: string
    timestamp: string
  }>
  onStatusUpdate?: () => void
  className?: string
}

// Status configuration with colors and next actions
const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: FileCheck,
    nextActions: [
      { status: 'review', label: 'Submit for Review', icon: Send, variant: 'default' as const }
    ]
  },
  review: {
    label: 'In Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
    nextActions: [
      { status: 'approved', label: 'Approve', icon: CheckCircle, variant: 'default' as const },
      { status: 'draft', label: 'Reject', icon: XCircle, variant: 'destructive' as const }
    ]
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
    nextActions: [
      { status: 'published', label: 'Publish', icon: Send, variant: 'default' as const }
    ]
  },
  published: {
    label: 'Published',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: CheckCircle,
    nextActions: [
      { status: 'archived', label: 'Archive', icon: Archive, variant: 'outline' as const }
    ]
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: Archive,
    nextActions: []
  }
}

export default function PolicyApprovalWorkflow({
  policyId,
  currentStatus,
  approvalHistory = [],
  onStatusUpdate,
  className
}: PolicyApprovalWorkflowProps) {
  const [approverName, setApproverName] = useState('')
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const config = STATUS_CONFIG[currentStatus]
  const StatusIcon = config.icon

  const handleStatusUpdate = async (newStatus: string) => {
    if (!approverName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setIsUpdating(true)
    try {
      const result = await api.updatePolicyStatus({
        policyId,
        status: newStatus as any,
        approver_name: approverName,
        approval_notes: notes
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success(`Policy status updated to ${newStatus}`)
      setNotes('')

      if (onStatusUpdate) {
        onStatusUpdate()
      }
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-expanded text-base font-semibold flex items-center gap-2">
          <StatusIcon className="w-4 h-4" />
          Policy Approval Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium font-expanded">Current Status</label>
          <div>
            <Badge className={`${config.color} border font-expanded text-sm px-3 py-1`}>
              <StatusIcon className="w-3 h-3 mr-1.5" />
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Action Section - Only show if there are available actions */}
        {config.nextActions.length > 0 && (
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
            <h3 className="font-expanded text-sm font-semibold">Update Status</h3>

            {/* Approver Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium font-expanded flex items-center gap-2">
                <User className="w-3 h-3" />
                Your Name
              </label>
              <Input
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Enter your name"
                className="text-sm"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium font-expanded flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any comments or notes about this status change..."
                className="text-sm min-h-[80px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {config.nextActions.map((action) => {
                const ActionIcon = action.icon
                return (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={isUpdating || !approverName.trim()}
                    className="flex-1"
                  >
                    <ActionIcon className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Updating...' : action.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Approval History */}
        {approvalHistory.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-expanded text-sm font-semibold">Approval History</h3>
            <div className="space-y-3 border-l-2 border-border pl-4">
              {approvalHistory.map((entry, index) => (
                <div key={index} className="relative space-y-1">
                  {/* Timeline dot */}
                  <div className="absolute -left-[1.3rem] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                  {/* Status change */}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs font-mono">
                      {entry.from_status}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {entry.to_status}
                    </Badge>
                  </div>

                  {/* Approver and timestamp */}
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {entry.approver_name}
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(entry.timestamp)}
                  </div>

                  {/* Notes */}
                  {entry.approval_notes && (
                    <div className="text-sm bg-muted/50 p-2 rounded-md border border-border">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3 h-3 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{entry.approval_notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
