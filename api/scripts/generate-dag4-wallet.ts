#!/usr/bin/env tsx

/**
 * Generate DAG4 Wallet for Constellation Network
 *
 * This script generates a new DAG4 wallet with:
 * - Private key (for signing transactions)
 * - Public key (for verification)
 * - DAG address (for receiving funds)
 *
 * Usage:
 *   npm run generate-wallet
 *   # or
 *   npx tsx scripts/generate-dag4-wallet.ts
 *
 * ⚠️ SECURITY WARNING:
 * - Store the private key securely (use secrets manager in production)
 * - Never commit private keys to version control
 * - Never share private keys
 */

import { dag4 } from '@stardust-collective/dag4';
import * as fs from 'fs';
import * as path from 'path';

async function generateWallet() {
  console.log('🔐 Generating new DAG4 wallet for Constellation Network...\n');

  try {
    // Generate new wallet
    const wallet = dag4.keyStore.generatePrivateKey();

    // Derive public key and address
    const publicKey = dag4.keyStore.getPublicKeyFromPrivate(wallet);
    const address = dag4.keyStore.getDagAddressFromPrivateKey(wallet);

    console.log('✅ Wallet generated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 WALLET DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔑 Private Key (PRIVATE_KEY):');
    console.log(`   ${wallet}\n`);

    console.log('🔓 Public Key:');
    console.log(`   ${publicKey}\n`);

    console.log('💰 DAG Address:');
    console.log(`   ${address}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Save to .env.blockchain file
    const envContent = `# Constellation Network Configuration
# Generated: ${new Date().toISOString()}
#
# ⚠️ SECURITY WARNING:
# - This file contains sensitive credentials
# - Do NOT commit this file to version control
# - Add .env.blockchain to your .gitignore
# - Use a secrets manager in production

# DAG4 Wallet Private Key
# Used to sign transactions on Constellation Network
PRIVATE_KEY=${wallet}

# Constellation Network URLs
# IntegrationNet (testnet)
METAGRAPH_L0_URL=http://localhost:9200
METAGRAPH_L1_URL=http://localhost:9400
GLOBAL_L0_URL=https://be-integrationnet.constellationnetwork.io

# Metagraph ID (will be assigned when you deploy the metagraph)
# Leave empty for local development
METAGRAPH_ID=

# For MainNet deployment, use these URLs instead:
# GLOBAL_L0_URL=https://be-mainnet.constellationnetwork.io
# METAGRAPH_L0_URL=<your-metagraph-l0-url>
# METAGRAPH_L1_URL=<your-metagraph-l1-url>
`;

    const envFilePath = path.join(process.cwd(), '.env.blockchain');
    fs.writeFileSync(envFilePath, envContent);

    console.log(`💾 Wallet configuration saved to: ${envFilePath}\n`);

    console.log('📝 NEXT STEPS:\n');
    console.log('1. Add .env.blockchain to your .gitignore:');
    console.log('   echo ".env.blockchain" >> .gitignore\n');

    console.log('2. Fund your wallet (for IntegrationNet):');
    console.log('   - Visit: https://faucet.constellationnetwork.io');
    console.log(`   - Enter address: ${address}`);
    console.log('   - Request test DAG tokens\n');

    console.log('3. Deploy your metagraph:');
    console.log('   - Build: cd ../metagraph && sbt assembly');
    console.log('   - Deploy to IntegrationNet (see metagraph/DEPLOYMENT.md)');
    console.log('   - Get your METAGRAPH_ID from the deployment\n');

    console.log('4. Update .env.blockchain:');
    console.log('   - Set METAGRAPH_ID to your deployed metagraph ID');
    console.log('   - Set METAGRAPH_L0_URL and METAGRAPH_L1_URL to your deployment URLs\n');

    console.log('5. Merge blockchain config into your main .env:');
    console.log('   cat .env.blockchain >> .env\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  REMEMBER: Keep your private key secure!');
    console.log('   - Never share it');
    console.log('   - Never commit it to git');
    console.log('   - Use environment variables or secrets manager');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error generating wallet:', error);
    process.exit(1);
  }
}

export { generateWallet };

// Run if executed directly (ES module compatible)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  generateWallet();
}
