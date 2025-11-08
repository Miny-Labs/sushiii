import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminPage from '@/app/(demo)/admin/page'
import AuditorPage from '@/app/(demo)/auditor/page'

// Mock the API
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getPolicies: jest.fn(() => Promise.resolve({ 
      data: [
        {
          policy_id: 'test-policy-1',
          version: '1.0.0',
          status: 'active',
          jurisdiction: 'Global',
          created_at: '2024-01-15T10:00:00Z',
          content_hash: 'hash123',
          uri: 'https://example.com/policy'
        }
      ]
    })),
    getHealth: jest.fn(() => Promise.resolve({
      data: {
        status: 'healthy',
        timestamp: '2024-01-15T10:00:00Z',
        uptime: 3600,
        checks: {
          api: { status: 'healthy', latency: 50, message: 'OK', lastChecked: '2024-01-15T10:00:00Z' },
          metagraphL0: { status: 'healthy', latency: 100, message: 'OK', lastChecked: '2024-01-15T10:00:00Z' },
          metagraphL1: { status: 'healthy', latency: 75, message: 'OK', lastChecked: '2024-01-15T10:00:00Z' },
          storage: { status: 'healthy', latency: 25, message: 'OK', lastChecked: '2024-01-15T10:00:00Z' }
        }
      }
    })),
    getDashboardStats: jest.fn(() => Promise.resolve({
      data: {
        tenants: { total: 3, active: 3, growth: 15.2 },
        policies: { total: 5, active: 4, growth: 8.7 },
        consents: { total: 100, granted: 95, growth: 23.1 },
        proofs: { total: 20, verified: 18, growth: 12.4 }
      }
    })),
    getLatestSnapshot: jest.fn(() => Promise.resolve({
      data: {
        height: 12345,
        hash: 'snapshot_hash_123456789',
        timestamp: '2024-01-15T10:00:00Z',
        lastSnapshotHash: 'prev_hash_987654321'
      }
    })),
    getNodeInfo: jest.fn(() => Promise.resolve({
      data: {
        id: 'node_id_123456789',
        state: 'Ready',
        version: '2.0.0'
      }
    })),
    getConsentsBySubject: jest.fn(() => Promise.resolve({
      data: [
        {
          id: 'consent_1',
          timestamp: '2024-01-15T10:00:00Z',
          event_type: 'granted',
          subject_id: 'user_123',
          policy_ref: { policy_id: 'test-policy-1' },
          transaction_hash: 'tx_hash_123'
        }
      ]
    })),
    createDemoPolicy: jest.fn(() => Promise.resolve({
      data: { id: 'new-policy', status: 'created' }
    })),
    generateProofBundle: jest.fn(() => Promise.resolve({
      data: { id: 'proof-bundle-1', status: 'generated' }
    }))
  }
}))

// Mock HashShort component
jest.mock('@/components/common/HashShort', () => {
  return function MockHashShort({ hash, startChars = 6, endChars = 4 }: any) {
    return <span className="font-mono">{hash.slice(0, startChars)}...{hash.slice(-endChars)}</span>
  }
})

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

describe('Admin and Auditor Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Admin Page', () => {
    it('renders admin interface with real data', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminPage />
        </QueryClientProvider>
      )

      // Check header
      expect(screen.getByText('Privacy Administration')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive policy management and compliance oversight')).toBeInTheDocument()

      // Wait for data to load and check metrics
      await waitFor(() => {
        expect(screen.getAllByText('Active Policies')).toHaveLength(1)
        expect(screen.getAllByText('System Health')).toHaveLength(2) // Card title and tab
      })

      // Check tabs
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Policies')).toBeInTheDocument()
      expect(screen.getByText('System Health')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('displays policy data correctly', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminPage />
        </QueryClientProvider>
      )

      // Click on policies tab first
      const policiesTab = screen.getByRole('tab', { name: 'Policies' })
      policiesTab.click()

      // Wait for policies to load
      await waitFor(() => {
        expect(screen.getByText('test-policy-1')).toBeInTheDocument()
      })
    })
  })

  describe('Auditor Page', () => {
    it('renders auditor interface with real data', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AuditorPage />
        </QueryClientProvider>
      )

      // Check header
      expect(screen.getByText('Compliance Auditor')).toBeInTheDocument()
      expect(screen.getByText('Advanced audit trail analysis and proof verification')).toBeInTheDocument()

      // Wait for data to load and check metrics
      await waitFor(() => {
        expect(screen.getAllByText('Active Policies')).toHaveLength(2) // Card title and system status
        expect(screen.getByText('Blockchain Height')).toBeInTheDocument()
      })

      // Check tabs
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Consent Audit')).toBeInTheDocument()
      expect(screen.getByText('Blockchain Data')).toBeInTheDocument()
      expect(screen.getByText('Proof Generation')).toBeInTheDocument()
    })

    it('displays blockchain data correctly', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AuditorPage />
        </QueryClientProvider>
      )

      // Wait for blockchain data to load
      await waitFor(() => {
        expect(screen.getByText('12,345')).toBeInTheDocument() // snapshot height
      })
    })
  })

  describe('Integration Flow', () => {
    it('both interfaces connect to the same backend APIs', async () => {
      const api = require('@/lib/api').default

      // Render both components
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <AdminPage />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(api.getPolicies).toHaveBeenCalled()
        expect(api.getHealth).toHaveBeenCalled()
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <AuditorPage />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(api.getLatestSnapshot).toHaveBeenCalled()
        expect(api.getNodeInfo).toHaveBeenCalled()
      })
    })
  })
})