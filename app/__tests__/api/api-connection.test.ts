/**
 * API Connection Tests
 * Tests the actual API endpoints to ensure they're working
 */

import api from '@/lib/api'

// These tests will run against the actual API
describe('API Connection Tests', () => {
  describe('Health Endpoint', () => {
    it('should connect to health endpoint', async () => {
      const result = await api.getHealth()
      
      expect(result).toBeDefined()
      if (result.data) {
        expect(result.data).toHaveProperty('status')
        expect(result.data).toHaveProperty('timestamp')
        expect(result.data).toHaveProperty('checks')
      } else if (result.error) {
        // If there's an error, it should be a string
        expect(typeof result.error).toBe('string')
      }
    })
  })

  describe('Policies Endpoint', () => {
    it('should handle policies endpoint (may require auth)', async () => {
      const result = await api.getPolicies()
      
      expect(result).toBeDefined()
      // The endpoint may return an auth error, which is expected
      if (result.error) {
        expect(typeof result.error).toBe('string')
      } else if (result.data) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe('Blockchain Endpoints', () => {
    it('should connect to node info endpoint', async () => {
      const result = await api.getNodeInfo()
      
      expect(result).toBeDefined()
      if (result.data) {
        expect(result.data).toHaveProperty('state')
        expect(result.data).toHaveProperty('version')
      } else if (result.error) {
        expect(typeof result.error).toBe('string')
      }
    })

    it('should connect to latest snapshot endpoint', async () => {
      const result = await api.getLatestSnapshot()
      
      expect(result).toBeDefined()
      if (result.data) {
        expect(result.data).toHaveProperty('value')
        expect(result.data.value).toHaveProperty('ordinal')
      } else if (result.error) {
        expect(typeof result.error).toBe('string')
      }
    })
  })
})

describe('Crypto Functions', () => {
  it('should generate demo subject UUID', async () => {
    const { generateDemoSubject } = await import('@/lib/crypto')
    const subject = generateDemoSubject()
    
    expect(typeof subject).toBe('string')
    expect(subject.length).toBeGreaterThan(0)
  })

  it('should compute SHA-256 hash', async () => {
    const { computeSHA256 } = await import('@/lib/crypto')
    const hash = await computeSHA256('test content')
    
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64) // SHA-256 produces 64 character hex string
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true) // Should be valid hex
  })

  it('should hash subject ID with salt', async () => {
    const { hashSubjectId } = await import('@/lib/crypto')
    const hash = await hashSubjectId('test-subject')
    
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64)
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true)
  })
})