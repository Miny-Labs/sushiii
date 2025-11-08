# Local Development Guide

This guide walks you through setting up Sushiii for local development with the Euclid SDK.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Java JDK** >= 11 (for Scala/SBT)
- **SBT** >= 1.9.8
- **Docker** (for Euclid containers)
- **Git**

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd sushiii
pnpm install
```

### 2. Generate Cryptographic Keys

Sushiii requires two sets of cryptographic keys:

1. **dag4.js private key**: For signing HGTP transactions
2. **Ed25519 keypair**: For signing proof bundles

Generate them using the provided script:

```bash
node scripts/generate-keys.js
```

**Output will look like:**

```
================================================================================
GENERATED KEYS - ADD THESE TO YOUR .env FILES
================================================================================

# Ed25519 Keys (for Proof Bundle Signing)

SIGNING_PRIVATE_KEY=a1b2c3d4...
SIGNING_PUBLIC_KEY=e5f6g7h8...

# dag4.js Key (for HGTP Submissions)

PRIVATE_KEY=i9j0k1l2...
================================================================================
```

**IMPORTANT**: Save these keys securely. You'll need them in the next step.

### 3. Configure Environment Variables

Copy the example environment files:

```bash
cp .env.example .env
cp api/.env.example api/.env
cp app/.env.local.example app/.env.local
```

Edit `api/.env` and add your generated keys:

```env
# API Server Configuration
PORT=3001
NODE_ENV=development

# Constellation Network Endpoints
GLOBAL_L0_URL=http://localhost:9000
METAGRAPH_L0_URL=http://localhost:9200
METAGRAPH_L1_URL=http://localhost:9400
METAGRAPH_ID=

# Cryptographic Keys (from step 2)
PRIVATE_KEY=your-dag4-private-key-here
SIGNING_PRIVATE_KEY=your-ed25519-private-key-here
SIGNING_PUBLIC_KEY=your-ed25519-public-key-here

# Tenant API Keys
TENANT_test-key=test-tenant
TENANT_dev-key=dev-tenant

# Logging
LOG_LEVEL=info
```

Edit `app/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_METAGRAPH_L0_URL=http://localhost:9200
NEXT_PUBLIC_API_KEY=test-key
```

### 4. Set Up Euclid Development Environment

Euclid provides a local 3-node Constellation Network for testing metagraphs.

#### 4.1 Clone Euclid

```bash
cd ..
git clone https://github.com/Constellation-Labs/euclid-development-environment.git
cd euclid-development-environment
```

#### 4.2 Install Euclid

```bash
./scripts/hydra install
```

This downloads Docker images and sets up the environment.

#### 4.3 Copy Your Metagraph

```bash
mkdir -p source/project
cp -r ../sushiii/metagraph ./source/project/sushiii
```

#### 4.4 Build the Metagraph

```bash
./scripts/hydra build
```

This compiles your Scala metagraph code.

#### 4.5 Start the Network

```bash
./scripts/hydra start-genesis
```

This starts a 3-node local Constellation network with your metagraph.

### 5. Verify Euclid is Running

Check cluster status:

```bash
curl http://localhost:9200/cluster/info
```

Expected response:

```json
{
  "nodes": [
    { "id": "...", "state": "Ready" },
    { "id": "...", "state": "Ready" },
    { "id": "...", "state": "Ready" }
  ]
}
```

Check Data L1 health:

```bash
curl http://localhost:9400/node/info
```

Expected: `{ "state": "Ready", ... }`

### 6. Start Sushiii Services

In a new terminal, navigate to your sushiii directory:

```bash
cd ../sushiii
pnpm dev
```

This starts:
- API server on http://localhost:3001
- Next.js UI on http://localhost:3000

### 7. Verify Everything Works

#### Test API Health

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

#### Test Policy Creation

```bash
curl -X POST http://localhost:3001/api/policies \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "policy_id": "test-policy",
    "version": "1.0.0",
    "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "uri": "https://example.com/test",
    "jurisdiction": "US",
    "effective_from": "2024-01-01T00:00:00Z"
  }'
```

Expected: `{"success":true,"data":{...},"transaction_hash":"..."}`

#### Test UI

Open http://localhost:3000 in your browser and try:
1. Navigate to Admin Portal
2. Create a new policy
3. Navigate to Auditor Portal
4. Generate a proof bundle

## Troubleshooting

### Euclid Issues

**Problem**: `curl http://localhost:9200/cluster/info` returns connection refused

**Solution**:
```bash
cd euclid-development-environment
./scripts/hydra status
```

If containers aren't running:
```bash
./scripts/hydra stop
./scripts/hydra start-genesis
```

**Problem**: Data L1 state is "Observing" not "Ready"

**Solution**: Wait 30 seconds for nodes to sync. Check again:
```bash
curl http://localhost:9400/node/info
```

### API Issues

**Problem**: `Error: PRIVATE_KEY environment variable not set`

**Solution**: Make sure you added keys to `api/.env` and restarted the API server.

### Metagraph Build Issues

**Problem**: SBT compilation errors

**Solution**:
```bash
cd metagraph
sbt clean
sbt compile
```

If errors persist, check Scala version compatibility in `build.sbt`.

### HGTP Submission Failures

**Problem**: `HGTP submission failed: 400 Bad Request`

**Solution**: Check that:
1. Data L1 is in "Ready" state
2. Your private key is correctly configured
3. The Data L1 endpoint is accessible: `curl http://localhost:9400/data-application/info`

## Development Workflow

### Making Metagraph Changes

1. Edit Scala files in `metagraph/`
2. Rebuild:
   ```bash
   cd euclid-development-environment
   ./scripts/hydra build
   ```
3. Restart network:
   ```bash
   ./scripts/hydra stop
   ./scripts/hydra start-genesis
   ```

### Making API Changes

The API server automatically reloads with tsx watch mode. Just save your changes.

### Making UI Changes

Next.js automatically reloads. Save your changes and refresh the browser.

## Useful Commands

### Euclid Management

```bash
# Check status
./scripts/hydra status

# View logs
./scripts/hydra logs metagraph-l0-1
./scripts/hydra logs metagraph-l1-data-1

# Stop network
./scripts/hydra stop

# Clean environment
./scripts/hydra clean
```

### Debugging

View API logs:
```bash
cd sushiii
pnpm --filter @sushiii/api dev
```

View metagraph logs:
```bash
docker logs -f metagraph-l1-data-1
```

Query metagraph state:
```bash
curl http://localhost:9200/snapshots/latest | jq
```

## Next Steps

- See [architecture.md](./architecture.md) for system design
- See [hgtp-guide.md](./hgtp-guide.md) for HGTP integration details
- See [verification.md](./verification.md) for proof bundle verification
