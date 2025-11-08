#!/usr/bin/env node

/**
 * Generate cryptographic keypairs for Sushiii
 *
 * This script generates:
 * 1. Ed25519 keypair for signing proof bundles
 * 2. dag4.js compatible private key for HGTP submissions
 *
 * Usage: node scripts/generate-keys.js
 */

import { randomBytes } from 'crypto';
import * as ed from '@noble/ed25519';

console.log('\n=== Sushiii Keypair Generator ===\n');

// Generate Ed25519 keypair for proof bundle signing
const generateEd25519Keys = async () => {
  console.log('Generating Ed25519 keypair for proof bundle signing...');

  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKey(privateKey);

  const privateKeyHex = Buffer.from(privateKey).toString('hex');
  const publicKeyHex = Buffer.from(publicKey).toString('hex');

  console.log('✓ Ed25519 keypair generated\n');

  return { privateKeyHex, publicKeyHex };
};

// Generate dag4.js compatible private key
const generateDag4Key = () => {
  console.log('Generating dag4.js private key for HGTP...');

  // dag4.js uses 32-byte private keys
  const privateKey = randomBytes(32).toString('hex');

  console.log('✓ dag4.js private key generated\n');

  return privateKey;
};

// Main execution
(async () => {
  try {
    // Generate Ed25519 keys
    const { privateKeyHex: ed25519PrivateKey, publicKeyHex: ed25519PublicKey } = await generateEd25519Keys();

    // Generate dag4.js key
    const dag4PrivateKey = generateDag4Key();

    // Display results
    console.log('='.repeat(80));
    console.log('GENERATED KEYS - ADD THESE TO YOUR .env FILES');
    console.log('='.repeat(80));
    console.log('\n# Ed25519 Keys (for Proof Bundle Signing)\n');
    console.log(`SIGNING_PRIVATE_KEY=${ed25519PrivateKey}`);
    console.log(`SIGNING_PUBLIC_KEY=${ed25519PublicKey}`);
    console.log('\n# dag4.js Key (for HGTP Submissions)\n');
    console.log(`PRIVATE_KEY=${dag4PrivateKey}`);
    console.log('\n' + '='.repeat(80));
    console.log('\nIMPORTANT SECURITY NOTES:');
    console.log('- Store these keys securely (use a password manager or secret vault)');
    console.log('- Never commit these keys to version control');
    console.log('- Use different keys for development, staging, and production');
    console.log('- Rotate keys regularly in production environments');
    console.log('\nTo use these keys:');
    console.log('1. Copy the keys above');
    console.log('2. Add them to your .env file in the api/ directory');
    console.log('3. Restart your API server');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\nError generating keys:', error);
    process.exit(1);
  }
})();
