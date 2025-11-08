# Sushiii Metagraph - Constellation Network Data Application

This is the Constellation Network metagraph implementation for Sushiii's blockchain-based policy and consent management.

## Architecture

```
┌─────────────────┐
│  TypeScript API │  (Existing - /api directory)
│  (Port 3001)    │  - Authentication, validation, rate limiting
└────────┬────────┘  - Business logic and database
         │
         │ HTTP POST with dag4.js signed data
         ▼
┌─────────────────┐
│   Data L1       │  (This project - Scala)
│   (Port 9400)   │  - Custom endpoints: /data-application/policy, /consent
└────────┬────────┘  - Initial validation, signature verification
         │
         │ Consensus protocol
         ▼
┌─────────────────┐
│  Metagraph L0   │  (This project - Scala)
│  (Port 9200)    │  - State management and consensus
└────────┬────────┘  - Snapshot generation
         │
         │ Submit snapshots
         ▼
┌─────────────────┐
│   Global L0     │  (Constellation Network)
│                 │  - Network-wide consensus and finality
└─────────────────┘  - IntegrationNet or MainNet
```

## Features

- **Custom Data Types**: PolicyVersion and ConsentEvent
- **Signature Verification**: Ed25519 cryptographic verification
- **Immutable State**: Event-sourced state management
- **Snapshot System**: Regular state snapshots to Global L0
- **Query API**: Read policies and consents from L0

## Prerequisites

- Java 11+
- Scala 2.13
- Docker (for local testing)
- sbt 1.9+
- Node.js 18+ (for TypeScript API integration)

## Quick Start

### 1. Build the Metagraph

```bash
cd metagraph
sbt assembly
```

This creates JARs for:
- `modules/l0/target/scala-2.13/sushiii-metagraph-l0.jar`
- `modules/l1/target/scala-2.13/sushiii-metagraph-l1.jar`

### 2. Run Locally (Development)

```bash
# Terminal 1: Start L0
java -jar modules/l0/target/scala-2.13/sushiii-metagraph-l0.jar \
  --port 9200 \
  --genesis

# Terminal 2: Start L1
java -jar modules/l1/target/scala-2.13/sushiii-metagraph-l1.jar \
  --port 9400 \
  --l0-url http://localhost:9200

# Terminal 3: Start TypeScript API
cd ../api
npm run dev
```

### 3. Test Integration

```bash
# Submit a policy version
curl -X POST http://localhost:9400/data-application/policy \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "policyId": "policy-123",
      "version": "1.0.0",
      "contentHash": "abc123...",
      "uri": "https://example.com/policy-123",
      "jurisdiction": "GDPR",
      "effectiveFrom": "2025-01-01T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "proofs": [{
      "id": "your-public-key",
      "signature": "your-signature"
    }]
  }'

# Query latest state
curl http://localhost:9200/snapshots/latest
```

## Deployment to IntegrationNet

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
metagraph/
├── modules/
│   ├── l0/                          # Metagraph L0 (Consensus Layer)
│   │   └── src/main/scala/
│   │       └── com/sushiii/l0/
│   │           ├── Main.scala       # L0 entry point
│   │           └── StateChannel.scala  # State management
│   │
│   ├── l1/                          # Data L1 (Application Layer)
│   │   └── src/main/scala/
│   │       └── com/sushiii/l1/
│   │           ├── Main.scala       # L1 entry point
│   │           ├── DataApplication.scala  # Custom endpoints
│   │           └── validation/
│   │               ├── PolicyValidator.scala
│   │               └── ConsentValidator.scala
│   │
│   └── shared-data/                 # Shared types
│       └── src/main/scala/
│           └── com/sushiii/shared/
│               ├── types/
│               │   ├── PolicyVersion.scala
│               │   ├── ConsentEvent.scala
│               │   └── Updates.scala
│               └── state/
│                   └── SushiiiState.scala
│
├── project/
│   ├── build.properties
│   └── plugins.sbt
│
├── build.sbt                        # Main build configuration
└── README.md
```

## Configuration

### Environment Variables

```bash
# IntegrationNet (testnet)
export GLOBAL_L0_URL=https://be-integrationnet.constellationnetwork.io
export METAGRAPH_ID=your-metagraph-id
export NODE_ENV=integrationnet

# MainNet (production)
# export GLOBAL_L0_URL=https://be-mainnet.constellationnetwork.io
# export METAGRAPH_ID=your-metagraph-id
# export NODE_ENV=mainnet
```

### Node Configuration

Edit `application.conf` for custom settings:
- Snapshot interval
- Consensus parameters
- Network ports
- Logging levels

## API Endpoints

### Data L1 Endpoints (Port 9400)

**Submit Policy Version:**
```
POST /data-application/policy
Content-Type: application/json

Body: Signed<PolicyVersionUpdate>
Response: { "hash": "transaction-hash" }
```

**Submit Consent Event:**
```
POST /data-application/consent
Content-Type: application/json

Body: Signed<ConsentEventUpdate>
Response: { "hash": "transaction-hash" }
```

**Health Check:**
```
GET /data-application/health
Response: { "status": "healthy", "policies": 10, "consents": 25 }
```

### Metagraph L0 Endpoints (Port 9200)

**Latest Snapshot:**
```
GET /snapshots/latest
Response: Complete metagraph state with all policies and consents
```

**Specific Snapshot:**
```
GET /snapshots/{ordinal}
Response: Historical state at specific ordinal
```

**Cluster Info:**
```
GET /cluster/info
Response: Node and cluster status
```

## Integration with TypeScript API

The TypeScript API in `/api` directory integrates with this metagraph:

1. **Submission Flow**:
   - API receives policy/consent from user
   - Validates and stores in PostgreSQL
   - Signs data with dag4.js
   - POSTs to Data L1 endpoint
   - Returns blockchain hash to user

2. **Verification Flow**:
   - API queries L0 for latest snapshot
   - Verifies policy/consent exists on-chain
   - Returns verification status

3. **Configuration**:
   ```typescript
   // api/.env
   METAGRAPH_L0_URL=http://localhost:9200
   METAGRAPH_L1_URL=http://localhost:9400
   METAGRAPH_ID=your-metagraph-id
   PRIVATE_KEY=your-dag4-private-key
   SIGNING_PRIVATE_KEY=your-ed25519-private-key
   SIGNING_PUBLIC_KEY=your-ed25519-public-key
   ```

## Development Workflow

1. **Make Changes**:
   - Edit Scala files in `modules/l0/`, `modules/l1/`, or `modules/shared-data/`
   - Update data types or validation logic

2. **Build**:
   ```bash
   sbt assembly
   ```

3. **Test Locally**:
   ```bash
   # Start local cluster
   ./scripts/start-local.sh

   # Run tests
   sbt test

   # Stop cluster
   ./scripts/stop-local.sh
   ```

4. **Deploy to IntegrationNet**:
   ```bash
   ./scripts/deploy-integrationnet.sh
   ```

## Monitoring

**Logs**:
```bash
# L0 logs
tail -f modules/l0/logs/app.log

# L1 logs
tail -f modules/l1/logs/app.log
```

**Metrics**:
```bash
# Prometheus metrics
curl http://localhost:9200/metrics
curl http://localhost:9400/metrics
```

**Health Checks**:
```bash
# Check if nodes are healthy
curl http://localhost:9200/cluster/info
curl http://localhost:9400/cluster/info
```

## Troubleshooting

### L1 Can't Connect to L0
- Verify L0 is running: `curl http://localhost:9200/cluster/info`
- Check L1 configuration has correct L0 URL
- Check firewall rules

### Signatures Invalid
- Verify SIGNING_PUBLIC_KEY matches SIGNING_PRIVATE_KEY
- Ensure data is properly normalized before signing
- Check Brotli compression is working

### State Not Updating
- Check L1 logs for validation errors
- Verify updates are reaching L1: check L1 logs
- Check L0 logs for consensus issues

### Can't Query State
- Ensure L0 has produced at least one snapshot
- Check snapshot endpoint: `curl http://localhost:9200/snapshots/latest`
- Verify state is being serialized correctly

## Support

- **Constellation Docs**: https://docs.constellationnetwork.io
- **Euclid SDK**: https://github.com/Constellation-Labs/euclid-development-environment
- **Discord**: https://discord.gg/constellationnetwork

## License

MIT License - See LICENSE file for details
