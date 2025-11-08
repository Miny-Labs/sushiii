'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PolicyCreator from '@/components/demo/PolicyCreator'
import PolicyVersions from '@/components/demo/PolicyVersions'
import api from '@/lib/api'

export default function AdminPage() {
  const queryClient = useQueryClient()
  
  const { data: policies, isLoading } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: () => api.getDemoPolicies(),
  })

  const handlePolicyCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-policies'] })
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-sansation text-3xl font-bold tracking-tight">
            Policy Administration
          </h1>
          <p className="text-muted-foreground font-semi-expanded">
            Create and manage privacy policies with blockchain verification
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Policy Creator */}
          <PolicyCreator onPolicyCreated={handlePolicyCreated} />

          {/* Right Column - Policy Versions */}
          <PolicyVersions 
            policies={policies?.data || []} 
            isLoading={isLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-policies'] })}
          />
        </div>
      </div>
    </div>
  )
}