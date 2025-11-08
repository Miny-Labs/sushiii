/**
 * Client-side cryptography utilities for demo
 */

// Generate a demo subject UUID
export function generateDemoSubject(): string {
  return crypto.randomUUID()
}

// Hash subject ID (simulated with tenant salt)
export async function hashSubjectId(subjectId: string, tenantSalt = 'demo-tenant-salt'): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(subjectId + tenantSalt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Compute SHA-256 hash of text
export async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify hash matches text
export async function verifyHash(text: string, expectedHash: string): Promise<boolean> {
  const computedHash = await computeSHA256(text)
  return computedHash === expectedHash
}

// Generate a mock transaction reference
export function generateTxRef(): string {
  const chars = 'abcdef0123456789'
  let result = 'tx_'
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a mock Ed25519 signature
export function generateMockSignature(): {
  algorithm: string
  value: string
  publicKey: string
} {
  const chars = 'abcdef0123456789'
  const generateHex = (length: number) => {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  return {
    algorithm: 'Ed25519',
    value: generateHex(128),
    publicKey: generateHex(64)
  }
}