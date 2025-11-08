'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ComplianceDashboard from '@/components/compliance/ComplianceDashboard'
import GDPRComplianceChecklist from '@/components/compliance/GDPRComplianceChecklist'
import { BarChart3, CheckSquare } from 'lucide-react'

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-expanded">Compliance Center</h1>
        <p className="text-muted-foreground font-semi-expanded mt-2">
          Monitor compliance metrics and ensure your privacy policies meet regulatory requirements
        </p>
      </div>

      {/* Tabs for Dashboard and Checklist */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            GDPR Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ComplianceDashboard />
        </TabsContent>

        <TabsContent value="checklist">
          <GDPRComplianceChecklist />
        </TabsContent>
      </Tabs>
    </div>
  )
}
