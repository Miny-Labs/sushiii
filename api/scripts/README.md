# Sushiii API Scripts

Utility scripts for setting up and managing the Sushiii API.

## Available Scripts

### 1. Setup Database (`setup-database.ts`)

Creates the initial database schema, seed data, and test tenant.

**Usage:**
```bash
npm run setup-db
```

**What it does:**
- Creates test tenant with API key
- Creates admin user (admin@test.com / admin123)
- Seeds sample policies and templates
- Sets up role-based permissions

**Output:**
- Tenant ID and API key (save these!)
- Sample data for development and testing

---

### 2. Generate DAG4 Wallet (`generate-dag4-wallet.ts`)

Generates a new DAG4 wallet for blockchain integration with Constellation Network.

**Usage:**
```bash
npm run generate-wallet
```

**What it does:**
- Generates new cryptographic key pair
- Creates DAG wallet address
- Saves configuration to `.env.blockchain`
- Provides next steps for deployment

**Output:**
- Private key (keep this secret!)
- Public key
- DAG address (for receiving tokens)
- `.env.blockchain` file with configuration

**⚠️ Security Warning:**
- **Never commit `.env.blockchain` to git**
- **Never share your private key**
- Use a secrets manager in production
- The `.env.blockchain` file is already in `.gitignore`

---

## Blockchain Integration Setup

Complete guide to enable blockchain functionality:

### Step 1: Generate Wallet

```bash
cd api
npm run generate-wallet
```

This creates a `.env.blockchain` file with your wallet credentials.

### Step 2: Fund Your Wallet (IntegrationNet)

1. Visit the Constellation Network faucet: https://faucet.constellationnetwork.io
2. Enter your DAG address (printed by the wallet generator)
3. Request test DAG tokens
4. Wait for confirmation

### Step 3: Build and Deploy Metagraph

```bash
# Build the metagraph
cd ../metagraph
sbt assembly

# This creates:
# - modules/l0/target/scala-2.13/sushiii-metagraph-l0.jar
# - modules/l1/target/scala-2.13/sushiii-metagraph-l1.jar
```

For deployment instructions, see `metagraph/DEPLOYMENT.md` (to be created).

### Step 4: Update Configuration

After deploying your metagraph, update `.env.blockchain`:

```bash
# Edit .env.blockchain
nano .env.blockchain

# Update these values:
METAGRAPH_ID=<your-deployed-metagraph-id>
METAGRAPH_L0_URL=<your-l0-url>
METAGRAPH_L1_URL=<your-l1-url>
```

### Step 5: Merge Configuration

Add blockchain configuration to your main `.env`:

```bash
cat .env.blockchain >> .env
```

Or manually copy the values you need.

### Step 6: Test Integration

Start your API with blockchain configuration:

```bash
npm run dev
```

Test blockchain submission:

```bash
# Create a policy (will submit to blockchain)
curl -X POST http://localhost:3001/api/v1/policies \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Policy",
    "description": "Testing blockchain integration",
    "jurisdiction": "GDPR",
    "effectiveDate": "2025-01-01T00:00:00Z"
  }'

# Check the response for blockchain hash
```

---

## Development vs Production

### Local Development

For local development without blockchain:
- Don't run `generate-wallet`
- API works in graceful degradation mode
- Returns `{ hash: 'pending' }` for blockchain operations
- All CRUD operations work normally

### Production Deployment

For production with blockchain:
1. ✅ Generate production wallet with `npm run generate-wallet`
2. ✅ Fund wallet on MainNet
3. ✅ Deploy metagraph to MainNet
4. ✅ Use secrets manager for `PRIVATE_KEY` (not .env files)
5. ✅ Update `GLOBAL_L0_URL` to MainNet: `https://be-mainnet.constellationnetwork.io`

---

## Troubleshooting

### "PRIVATE_KEY environment variable not set"

**Solution:**
1. Run `npm run generate-wallet`
2. Copy `PRIVATE_KEY` from `.env.blockchain` to your `.env`
3. Restart the API

### "Failed to initialize HGTP client"

**Causes:**
- Invalid private key format
- Network connectivity issues
- Incorrect GLOBAL_L0_URL

**Solution:**
1. Verify `PRIVATE_KEY` is a valid DAG4 private key
2. Check network connectivity to `GLOBAL_L0_URL`
3. For IntegrationNet: `https://be-integrationnet.constellationnetwork.io`
4. For MainNet: `https://be-mainnet.constellationnetwork.io`

### "HGTP submission failed: Connection refused"

**Causes:**
- Metagraph not running
- Wrong L0/L1 URLs

**Solution:**
1. Verify metagraph is deployed and running
2. Check `METAGRAPH_L0_URL` and `METAGRAPH_L1_URL` in `.env`
3. For local development:
   - L0: `http://localhost:9200`
   - L1: `http://localhost:9400`

### Insufficient Funds

**Solution:**
1. Check wallet balance:
   ```bash
   curl https://be-integrationnet.constellationnetwork.io/addresses/<your-dag-address>/balance
   ```
2. Request more tokens from faucet (IntegrationNet)
3. For MainNet: Purchase DAG tokens

---

## Script Reference

All scripts are TypeScript files that can be run with:
- `npm run <script-name>` (recommended)
- `npx tsx scripts/<script-name>.ts` (direct)
- `tsx scripts/<script-name>.ts` (if tsx installed globally)

**Available npm commands:**
- `npm run setup-db` - Setup database
- `npm run generate-wallet` - Generate DAG4 wallet
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database (alias for setup-db)

---

## Security Best Practices

### Private Key Management

**Development:**
- ✅ Use `.env.blockchain` locally
- ✅ Never commit to version control
- ✅ Add to `.gitignore`

**Production:**
- ✅ Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Rotate keys regularly
- ✅ Use separate keys per environment
- ✅ Enable key access logging
- ❌ Never use `.env` files in production
- ❌ Never hardcode keys in code

### Network Configuration

**IntegrationNet (Testnet):**
- Use for development and testing
- Free test tokens from faucet
- Reset/wipe data periodically
- No real value at risk

**MainNet (Production):**
- Use only for production
- Real DAG tokens required
- Permanent, immutable data
- Financial implications

---

## Additional Resources

- **Constellation Network Docs**: https://docs.constellationnetwork.io
- **DAG4.js Documentation**: https://github.com/StardustCollective/dag4.js
- **Tessellation SDK**: https://github.com/Constellation-Labs/tessellation
- **Sushiii Metagraph**: See `../metagraph/README.md`

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review API logs: Check console output for error messages
3. Check metagraph logs: `tail -f ../metagraph/modules/l0/logs/app.log`
4. Verify configuration: Ensure all environment variables are set correctly
