export interface Tenant {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
  quotas: {
    policies: number
    consents: number
    proofs: number
    storageMB: number
  }
  usage: {
    policies: number
    consents: number
    proofs: number
    storageMB: number
  }
}

export interface Policy {
  id: string
  tenantId: string
  name: string
  description?: string
  jurisdiction: string
  status: 'draft' | 'active' | 'deprecated' | 'archived'
  createdAt: string
  updatedAt: string
  versions: PolicyVersion[]
  currentVersion?: PolicyVersion
}

export interface PolicyVersion {
  id: string
  policyId: string
  versionNumber: string
  contentHash: string
  uri: string
  effectiveFrom: string
  effectiveTo?: string
  status: 'draft' | 'active' | 'deprecated'
  createdAt: string
}

export interface Consent {
  id: string
  tenantId: string
  subjectId: string
  policyVersionId: string
  status: 'granted' | 'revoked' | 'expired'
  grantedAt: string
  revokedAt?: string
  expiryDate?: string
  purposes: string[]
  conditions?: Record<string, any>
  metadata?: Record<string, any>
}

export interface ProofBundle {
  id: string
  tenantId: string
  subjectId: string
  status: 'generating' | 'ready' | 'verified' | 'failed'
  consentCount: number
  generatedAt: string
  verifiedAt?: string
  encryptionKeyId?: string
  merkleRoot?: string
  blockchainTxId?: string
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    api: HealthCheckItem
    metagraphL0: HealthCheckItem
    metagraphL1: HealthCheckItem
    storage: HealthCheckItem
  }
}

export interface HealthCheckItem {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  message: string
  lastChecked: string
}

export interface MetagraphNode {
  id: string
  state: string
  session: number
  clusterSession: number
  version: string
  host: string
  publicPort: number
  p2pPort: number
}

export interface MetagraphCluster {
  nodes: MetagraphNode[]
  totalNodes: number
  readyNodes: number
}

export interface DashboardStats {
  tenants: {
    total: number
    active: number
    growth: number
  }
  policies: {
    total: number
    active: number
    growth: number
  }
  consents: {
    total: number
    granted: number
    growth: number
  }
  proofs: {
    total: number
    verified: number
    growth: number
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}