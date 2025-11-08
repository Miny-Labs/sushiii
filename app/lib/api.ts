import { ApiResponse, PaginatedResponse, Tenant, Policy, Consent, ProofBundle, HealthCheck, DashboardStats } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/v1'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': 'test-key', // Demo API key for testing
      ...options.headers as Record<string, string>,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const responseJson = await response.json()
      // Backend consistently returns { data: ... }, so unwrap it
      return { data: responseJson.data !== undefined ? responseJson.data : responseJson }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Health endpoints
  async getHealth(): Promise<ApiResponse<HealthCheck>> {
    // Health endpoint is at root level, not under /api/v1
    const healthUrl = this.baseUrl.replace('/api/v1', '/health')
    
    try {
      const response = await fetch(healthUrl)
      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }
      const data = await response.json()
      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats')
  }

  // Professional/Admin endpoints (using demo routes for now)
  async getComplianceMetrics(timeRange: string = '30d'): Promise<ApiResponse<any>> {
    // For demo, create mock compliance data based on real policies
    const policiesResponse = await this.getDemoPolicies();
    if (policiesResponse.error) {
      return { error: policiesResponse.error };
    }

    const policies = policiesResponse.data || [];
    // Active policies are those that are approved or published
    const activePolicies = policies.filter((p: any) =>
      p.status === 'approved' || p.status === 'published'
    );
    
    // Generate compliance scores based on real data
    const scores = [
      {
        category: 'Data Protection',
        score: Math.min(100, 70 + (activePolicies.length * 5)),
        maxScore: 100,
        weight: 0.3,
        trend: 'improving'
      },
      {
        category: 'Consent Management', 
        score: Math.min(100, 65 + (policies.length * 4)),
        maxScore: 100,
        weight: 0.25,
        trend: 'stable'
      },
      {
        category: 'Policy Coverage',
        score: Math.min(100, 80 + (policies.length * 3)),
        maxScore: 100,
        weight: 0.2,
        trend: 'improving'
      }
    ];
    
    return { data: { scores } };
  }

  async getActivityFeed(limit: number = 20): Promise<ApiResponse<any[]>> {
    return this.request(`/activity-feed?limit=${limit}`)
  }

  async getKPIs(timeRange: string = '30d'): Promise<ApiResponse<any[]>> {
    return this.request(`/professional/metrics/kpis?timeRange=${timeRange}`)
  }

  // Tenant endpoints
  async getTenants(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
    // For now, return mock data since this endpoint might not be implemented yet
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            data: [
              {
                id: '1',
                name: 'Acme Corporation',
                description: 'Global technology company',
                status: 'active' as const,
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
                quotas: { policies: 100, consents: 10000, proofs: 1000, storageMB: 5120 },
                usage: { policies: 23, consents: 1247, proofs: 89, storageMB: 1024 }
              },
              {
                id: '2',
                name: 'TechStart Inc',
                description: 'Innovative startup',
                status: 'active' as const,
                createdAt: '2024-02-01T14:30:00Z',
                updatedAt: '2024-02-01T14:30:00Z',
                quotas: { policies: 50, consents: 5000, proofs: 500, storageMB: 2048 },
                usage: { policies: 12, consents: 456, proofs: 34, storageMB: 512 }
              },
              {
                id: '3',
                name: 'Enterprise Solutions',
                description: 'B2B software provider',
                status: 'active' as const,
                createdAt: '2024-01-20T09:15:00Z',
                updatedAt: '2024-01-20T09:15:00Z',
                quotas: { policies: 200, consents: 20000, proofs: 2000, storageMB: 10240 },
                usage: { policies: 67, consents: 3421, proofs: 156, storageMB: 2048 }
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 3,
              totalPages: 1
            }
          }
        })
      }, 300)
    })
  }

  async getTenant(id: string): Promise<ApiResponse<Tenant>> {
    return this.request(`/tenants/${id}`)
  }

  async createTenant(data: Partial<Tenant>): Promise<ApiResponse<Tenant>> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id: Math.random().toString(36).substr(2, 9),
            name: data.name || 'New Tenant',
            description: data.description,
            status: data.status || 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            quotas: { policies: 50, consents: 5000, proofs: 500, storageMB: 2048 },
            usage: { policies: 0, consents: 0, proofs: 0, storageMB: 0 }
          } as Tenant
        })
      }, 500)
    })
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<ApiResponse<Tenant>> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id,
            ...data,
            updatedAt: new Date().toISOString()
          } as Tenant
        })
      }, 300)
    })
  }

  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: undefined })
      }, 300)
    })
  }

  // Demo Policy endpoints - real blockchain integration
  async getDemoPolicies(): Promise<ApiResponse<any[]>> {
    return this.request('/policies')
  }

  async createDemoPolicy(data: {
    policy_id: string
    version: string
    text: string
    content_hash: string
    uri: string
    jurisdiction: string
    effective_from: string
  }): Promise<ApiResponse<any>> {
    return this.request('/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async submitConsent(data: {
    subject_id: string
    policy_ref: {
      policy_id: string
      version: string
    }
    event_type: 'granted' | 'revoked' | 'updated'
    timestamp: string
  }): Promise<ApiResponse<any>> {
    return this.request('/consents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async generateDemoProofBundle(data: {
    subject_id: string
  }): Promise<ApiResponse<any>> {
    return this.request('/proof-bundles/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getDemoProofBundle(bundleId: string): Promise<ApiResponse<any>> {
    return this.request(`/proof-bundles/${bundleId}`)
  }

  async getAllConsents(limit: number = 50): Promise<ApiResponse<any[]>> {
    return this.request(`/consents?limit=${limit}`)
  }

  async getConsentsBySubject(subjectId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/consents/subject/${subjectId}`)
  }

  async updatePolicyStatus(data: {
    policyId: string
    status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
    approver_name?: string
    approval_notes?: string
  }): Promise<ApiResponse<any>> {
    return this.request(`/policies/${data.policyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: data.status,
        approver_name: data.approver_name,
        approval_notes: data.approval_notes,
      }),
    })
  }

  // Blockchain data endpoints
  async getLatestSnapshot(): Promise<ApiResponse<any>> {
    // Connect directly to metagraph L0 endpoint
    const l0Url = process.env.NEXT_PUBLIC_METAGRAPH_L0_URL || 'http://localhost:9200'
    try {
      const response = await fetch(`${l0Url}/snapshots/latest`)
      if (!response.ok) {
        return { error: `Failed to fetch snapshot: ${response.statusText}` }
      }
      const snapshotData = await response.json()

      // Transform to expected format: { height, hash, timestamp, lastSnapshotHash }
      if (snapshotData.value) {
        return {
          data: {
            height: snapshotData.value.ordinal || 0,
            hash: snapshotData.value.lastSnapshotHash || 'unknown',
            timestamp: Date.now(), // Current time as snapshot doesn't include timestamp
            lastSnapshotHash: snapshotData.value.lastSnapshotHash || 'unknown',
            ordinal: snapshotData.value.ordinal || 0
          }
        }
      }

      return { data: snapshotData }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' }
    }
  }

  async getNodeInfo(): Promise<ApiResponse<any>> {
    // Connect directly to metagraph L0 endpoint
    const l0Url = process.env.NEXT_PUBLIC_METAGRAPH_L0_URL || 'http://localhost:9200'
    try {
      const response = await fetch(`${l0Url}/node/info`)
      if (!response.ok) {
        return { error: `Failed to fetch node info: ${response.statusText}` }
      }
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' }
    }
  }

  // Policy endpoints
  async getPolicies(tenantId: string, page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Policy>>> {
    return this.request(`/tenants/${tenantId}/policies?page=${page}&limit=${limit}`)
  }

  async getPolicy(tenantId: string, id: string): Promise<ApiResponse<Policy>> {
    return this.request(`/tenants/${tenantId}/policies/${id}`)
  }

  async createPolicy(tenantId: string, data: Partial<Policy>): Promise<ApiResponse<Policy>> {
    return this.request(`/tenants/${tenantId}/policies`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePolicy(tenantId: string, id: string, data: Partial<Policy>): Promise<ApiResponse<Policy>> {
    return this.request(`/tenants/${tenantId}/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePolicy(tenantId: string, id: string): Promise<ApiResponse<void>> {
    return this.request(`/tenants/${tenantId}/policies/${id}`, {
      method: 'DELETE',
    })
  }

  // Consent endpoints
  async getConsents(tenantId: string, page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Consent>>> {
    return this.request(`/tenants/${tenantId}/consents?page=${page}&limit=${limit}`)
  }

  async getConsent(tenantId: string, id: string): Promise<ApiResponse<Consent>> {
    return this.request(`/tenants/${tenantId}/consents/${id}`)
  }

  async grantConsent(tenantId: string, data: Partial<Consent>): Promise<ApiResponse<Consent>> {
    return this.request(`/tenants/${tenantId}/consents`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async revokeConsent(tenantId: string, id: string): Promise<ApiResponse<Consent>> {
    return this.request(`/tenants/${tenantId}/consents/${id}/revoke`, {
      method: 'POST',
    })
  }

  // Proof Bundle endpoints
  async getProofBundles(tenantId: string, page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<ProofBundle>>> {
    return this.request(`/tenants/${tenantId}/proof-bundles?page=${page}&limit=${limit}`)
  }

  async getProofBundle(tenantId: string, id: string): Promise<ApiResponse<ProofBundle>> {
    return this.request(`/tenants/${tenantId}/proof-bundles/${id}`)
  }

  async generateProofBundle(tenantId: string, subjectId: string): Promise<ApiResponse<ProofBundle>> {
    return this.request(`/tenants/${tenantId}/proof-bundles`, {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    })
  }

  async verifyProofBundle(tenantId: string, id: string): Promise<ApiResponse<ProofBundle>> {
    return this.request(`/tenants/${tenantId}/proof-bundles/${id}/verify`, {
      method: 'POST',
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api