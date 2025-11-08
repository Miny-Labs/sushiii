'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import AdminLayout from '@/components/layout/AdminLayout'
import api from '@/lib/api'
import { formatDate, formatBytes } from '@/lib/utils'
import { Tenant } from '@/lib/types'
import toast from 'react-hot-toast'

function TenantCard({ tenant }: { tenant: Tenant }) {
  const queryClient = useQueryClient()
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tenant')
    }
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'warning'
      case 'suspended': return 'danger'
      default: return 'default'
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{tenant.name}</CardTitle>
            <CardDescription>{tenant.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant(tenant.status)}>
              {tenant.status}
            </Badge>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Policies</div>
            <div className="text-lg font-semibold">
              {tenant.usage.policies}/{tenant.quotas.policies}
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(tenant.usage.policies / tenant.quotas.policies) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Consents</div>
            <div className="text-lg font-semibold">
              {tenant.usage.consents}/{tenant.quotas.consents}
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(tenant.usage.consents / tenant.quotas.consents) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Storage</div>
          <div className="text-sm">
            {formatBytes(tenant.usage.storageMB * 1024 * 1024)} / {formatBytes(tenant.quotas.storageMB * 1024 * 1024)}
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${(tenant.usage.storageMB / tenant.quotas.storageMB) * 100}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Created {formatDate(tenant.createdAt)}
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => deleteMutation.mutate(tenant.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateTenantDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) => api.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant created successfully')
      setOpen(false)
      setName('')
      setDescription('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tenant')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      name,
      description,
      status: 'active'
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Tenant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>
            Add a new organization to the privacy compliance platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: tenantsResponse, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.getTenants(),
  })

  const tenants = tenantsResponse?.data?.data || []
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Tenants</h1>
              <p className="text-muted-foreground">
                Manage organizations and their privacy compliance settings
              </p>
            </div>
            <CreateTenantDialog />
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{filteredTenants.length} tenants</span>
            </div>
          </div>

          {/* Tenants Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTenants.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filteredTenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <TenantCard tenant={tenant} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No tenants match your search criteria.' : 'Get started by creating your first tenant.'}
                </p>
                <CreateTenantDialog />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}