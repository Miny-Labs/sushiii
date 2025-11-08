/**
 * Integration tests for the complete demo flow
 * Tests all major components and their interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import PolicyCreator from '@/components/demo/PolicyCreator'
import ConsentModal from '@/components/demo/ConsentModal'
import ProofGenerator from '@/components/demo/ProofGenerator'
import ProofViewer from '@/components/demo/ProofViewer'
import api from '@/lib/api'

// Mock the API
jest.mock('@/lib/api', () => ({
  createDemoPolicy: jest.fn(),
  getPolicies: jest.fn(),
  submitConsent: jest.fn(),
  generateProofBundle: jest.fn(),
  getProofBundle: jest.fn(),
}))

// Mock crypto functions
jest.mock('@/lib/crypto', () => ({
  computeSHA256: jest.fn().mockResolvedValue('abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234'),
  generateDemoSubject: jest.fn().mockReturnValue('demo-subject-uuid'),
  hashSubjectId: jest.fn().mockResolvedValue('hashed-subject-id'),
}))

// Mock keyboard shortcuts hook
jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}

describe('Demo Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PolicyCreator Component', () => {
    it('should render policy creation form', () => {
      const mockOnPolicyCreated = jest.fn()
      
      render(
        <TestWrapper>
          <PolicyCreator onPolicyCreated={mockOnPolicyCreated} />
        </TestWrapper>
      )

      expect(screen.getByText('Create Policy')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter privacy policy content...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., privacy, cookies, data-retention')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., 1.0.0, 2.1.0')).toBeInTheDocument()
      expect(screen.getByText('Select jurisdiction')).toBeInTheDocument()
    })

    it('should validate form inputs', async () => {
      const mockOnPolicyCreated = jest.fn()
      
      render(
        <TestWrapper>
          <PolicyCreator onPolicyCreated={mockOnPolicyCreated} />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Create Policy')
      expect(submitButton).toBeDisabled()

      // Fill in minimum required text
      const policyTextArea = screen.getByPlaceholderText('Enter privacy policy content...')
      fireEvent.change(policyTextArea, { target: { value: 'Short text' } })

      // Should still be disabled without other fields
      expect(submitButton).toBeDisabled()
    })

    it('should create policy when form is valid', async () => {
      const mockOnPolicyCreated = jest.fn()
      const mockApiResponse = {
        data: { transaction_hash: 'tx_123456789' }
      }
      
      ;(api.createDemoPolicy as jest.Mock).mockResolvedValue(mockApiResponse)

      render(
        <TestWrapper>
          <PolicyCreator onPolicyCreated={mockOnPolicyCreated} />
        </TestWrapper>
      )

      // Fill in all required fields
      fireEvent.change(screen.getByPlaceholderText('Enter privacy policy content...'), {
        target: { value: 'This is a comprehensive privacy policy with sufficient content.' }
      })
      fireEvent.change(screen.getByPlaceholderText('e.g., privacy, cookies, data-retention'), {
        target: { value: 'privacy' }
      })
      fireEvent.change(screen.getByPlaceholderText('e.g., 1.0.0, 2.1.0'), {
        target: { value: '1.0.0' }
      })

      // Select jurisdiction
      const jurisdictionSelect = screen.getByText('Select jurisdiction')
      fireEvent.click(jurisdictionSelect)
      fireEvent.click(screen.getByText('US - United States'))

      // Submit form
      const submitButton = screen.getByText('Create Policy')
      expect(submitButton).not.toBeDisabled()
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.createDemoPolicy).toHaveBeenCalledWith({
          policy_id: 'privacy',
          version: '1.0.0',
          content_hash: 'abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
          uri: 'https://demo.sushiii.com/policies/privacy/1.0.0',
          jurisdiction: 'US',
          effective_from: expect.any(String)
        })
      })

      expect(mockOnPolicyCreated).toHaveBeenCalled()
    })
  })

  describe('ConsentModal Component', () => {
    it('should render consent modal when open', () => {
      const mockOnClose = jest.fn()
      
      render(
        <TestWrapper>
          <ConsentModal isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      )

      expect(screen.getByText('Privacy Consent')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter subject identifier')).toBeInTheDocument()
      expect(screen.getByText('Use Demo Subject')).toBeInTheDocument()
    })

    it('should generate demo subject ID', () => {
      const mockOnClose = jest.fn()
      
      render(
        <TestWrapper>
          <ConsentModal isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      )

      const demoButton = screen.getByText('Use Demo Subject')
      fireEvent.click(demoButton)

      const subjectInput = screen.getByPlaceholderText('Enter subject identifier')
      expect(subjectInput).toHaveValue('demo-subject-uuid')
    })
  })

  describe('ProofGenerator Component', () => {
    it('should render proof generator form', () => {
      const mockOnProofGenerated = jest.fn()
      const mockOnGenerateStart = jest.fn()
      
      render(
        <TestWrapper>
          <ProofGenerator 
            onProofGenerated={mockOnProofGenerated}
            onGenerateStart={mockOnGenerateStart}
            isGenerating={false}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Generate Proof Bundle')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter subject identifier or hash')).toBeInTheDocument()
      expect(screen.getByText('Generate Proof')).toBeInTheDocument()
    })

    it('should show loading state when generating', () => {
      const mockOnProofGenerated = jest.fn()
      const mockOnGenerateStart = jest.fn()
      
      render(
        <TestWrapper>
          <ProofGenerator 
            onProofGenerated={mockOnProofGenerated}
            onGenerateStart={mockOnGenerateStart}
            isGenerating={true}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Resolving Snapshot...')).toBeInTheDocument()
    })
  })

  describe('ProofViewer Component', () => {
    it('should show empty state when no proof bundle', () => {
      render(
        <TestWrapper>
          <ProofViewer proofBundle={null} isGenerating={false} />
        </TestWrapper>
      )

      expect(screen.getByText('Provide subject and policy to generate a proof.')).toBeInTheDocument()
    })

    it('should show loading state when generating', () => {
      render(
        <TestWrapper>
          <ProofViewer proofBundle={null} isGenerating={true} />
        </TestWrapper>
      )

      expect(screen.getByText('Resolving snapshot...')).toBeInTheDocument()
    })

    it('should display proof bundle when provided', () => {
      const mockProofBundle = {
        bundle_id: 'bundle_123',
        subject_id_hash: 'hash_456',
        policy_ref: {
          policy_id: 'privacy',
          version: '1.0.0',
          content_hash: 'content_hash_789'
        },
        events: [
          {
            event_type: 'accept',
            timestamp: '2024-01-01T00:00:00Z',
            tx_ref: 'tx_abc123',
            snapshot_ordinal: 100
          }
        ],
        signature: {
          algorithm: 'Ed25519',
          value: 'signature_value',
          public_key: 'public_key_value'
        },
        finalization_refs: {
          snapshot_ordinals: [100, 101],
          l0_endpoint: 'http://localhost:9200'
        },
        verification_status: 'verified'
      }

      render(
        <TestWrapper>
          <ProofViewer proofBundle={mockProofBundle} isGenerating={false} />
        </TestWrapper>
      )

      expect(screen.getByText('Verified ✓')).toBeInTheDocument()
      expect(screen.getByText('bundle_123')).toBeInTheDocument()
      expect(screen.getByText('privacy@1.0.0')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should handle API errors gracefully', async () => {
      const mockOnPolicyCreated = jest.fn()
      const mockError = { error: 'Network error' }
      
      ;(api.createDemoPolicy as jest.Mock).mockResolvedValue(mockError)

      render(
        <TestWrapper>
          <PolicyCreator onPolicyCreated={mockOnPolicyCreated} />
        </TestWrapper>
      )

      // Fill form and submit
      fireEvent.change(screen.getByPlaceholderText('Enter privacy policy content...'), {
        target: { value: 'Valid policy content for testing error handling.' }
      })
      fireEvent.change(screen.getByPlaceholderText('e.g., privacy, cookies, data-retention'), {
        target: { value: 'privacy' }
      })
      fireEvent.change(screen.getByPlaceholderText('e.g., 1.0.0, 2.1.0'), {
        target: { value: '1.0.0' }
      })

      const jurisdictionSelect = screen.getByText('Select jurisdiction')
      fireEvent.click(jurisdictionSelect)
      fireEvent.click(screen.getByText('US - United States'))

      const submitButton = screen.getByText('Create Policy')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.createDemoPolicy).toHaveBeenCalled()
      })

      // Should not call onPolicyCreated on error
      expect(mockOnPolicyCreated).not.toHaveBeenCalled()
    })
  })
})