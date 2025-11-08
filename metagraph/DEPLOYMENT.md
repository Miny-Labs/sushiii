# Sushiii Metagraph - Deployment Guide

Complete guide to deploying the Sushiii metagraph to Constellation Network.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [IntegrationNet Deployment](#integrationnet-deployment)
4. [MainNet Deployment](#mainnet-deployment)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Java 11+** (OpenJDK or Oracle JDK)
  ```bash
  java -version
  # Should show: java version "11" or higher
  ```

- **Scala 2.13** and **sbt 1.9+**
  ```bash
  sbt --version
  # Should show: sbt version 1.9.x
  ```

- **Docker** (for containerized deployment)
  ```bash
  docker --version
  ```

### Required Accounts and Access

- **DAG4 Wallet**: Generate using the API script
  ```bash
  cd ../api
  npm run generate-wallet
  ```

- **Funded Wallet**:
  - IntegrationNet: Get test tokens from https://faucet.constellationnetwork.io
  - MainNet: Purchase DAG tokens

- **Server/VPS**: For production deployment
  - Minimum: 2 vCPUs, 4GB RAM, 50GB SSD
  - Recommended: 4 vCPUs, 8GB RAM, 100GB SSD
  - Ports: 9000 (L0), 9400 (L1), open to internet

---

## Local Development

### 1. Build the Metagraph

```bash
cd metagraph
sbt assembly
```

This creates:
- `modules/l0/target/scala-2.13/sushiii-metagraph-l0-assembly-0.1.0.jar`
- `modules/data_l1/target/scala-2.13/sushiii-metagraph-l1-assembly-0.1.0.jar`

**Build time**: 5-10 minutes (first time), 1-2 minutes (subsequent builds)

### 2. Run Metagraph L0 (Consensus Layer)

```bash
# Terminal 1: Start L0 in genesis mode
java -jar modules/l0/target/scala-2.13/sushiii-metagraph-l0-assembly-0.1.0.jar \
  --http-port 9200 \
  --public-port 9201 \
  --p2p-port 9202 \
  --cli-port 9203 \
  run-genesis
```

**What this does:**
- Starts L0 on port 9200 (HTTP API)
- Initializes genesis state
- Creates first snapshot (ordinal 0)
- Waits for data from L1

**Success indicators:**
- `Genesis snapshot created with ordinal 0`
- `Node is ready to accept requests`
- HTTP endpoint responds: `curl http://localhost:9200/cluster/info`

### 3. Run Data L1 (Application Layer)

```bash
# Terminal 2: Start L1 connected to L0
java -jar modules/data_l1/target/scala-2.13/sushiii-metagraph-l1-assembly-0.1.0.jar \
  --http-port 9400 \
  --public-port 9401 \
  --p2p-port 9402 \
  --cli-port 9403 \
  --l0-peer-http-host localhost \
  --l0-peer-http-port 9200 \
  run-validator
```

**What this does:**
- Starts L1 on port 9400 (HTTP API)
- Connects to L0 at localhost:9200
- Exposes custom endpoints: `/data-application/policy`, `/data-application/consent`
- Validates and forwards data to L0

**Success indicators:**
- `Connected to L0 at localhost:9200`
- `Custom data application endpoints registered`
- HTTP endpoint responds: `curl http://localhost:9400/cluster/info`

### 4. Test Local Deployment

```bash
# Submit a policy version
curl -X POST http://localhost:9400/data-application/policy \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "test-policy-001",
    "version": "1.0.0",
    "content_hash": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "uri": "https://example.com/policies/test-policy-001",
    "jurisdiction": "GDPR",
    "effective_from": "2025-01-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }'

# Should return: {"status": "accepted", "policy_id": "test-policy-001"}

# Query latest snapshot
curl http://localhost:9200/snapshots/latest

# Should include your policy in the state
```

---

## IntegrationNet Deployment

IntegrationNet is Constellation's testnet for development and testing.

### Architecture Overview

```
┌──────────────────────┐
│  Global L0 (Existing)│  IntegrationNet
│  be-integrationnet   │  Port 443 (HTTPS)
└──────────┬───────────┘
           │
           │ Submit snapshots
           ▼
┌──────────────────────┐
│  Metagraph L0 (You)  │  Your VPS
│  Port 9200           │  Public endpoint
└──────────┬───────────┘
           │
           │ Data flow
           ▼
┌──────────────────────┐
│  Data L1 (You)       │  Your VPS
│  Port 9400           │  Public endpoint
└──────────────────────┘
           ▲
           │
           │ HTTP POST from API
┌──────────┴───────────┐
│  TypeScript API      │  Your infrastructure
│  Port 3001           │
└──────────────────────┘
```

### Step 1: Prepare Server

**Option A: VPS/Cloud Server**

Provision a server with:
- Ubuntu 22.04 LTS
- 2+ vCPUs, 4+ GB RAM, 50+ GB SSD
- Public IP address
- Ports 9200 and 9400 open

**Option B: Docker**

Use Docker Compose for easier deployment (see `docker-compose.integrationnet.yml`).

### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 11
sudo apt install -y openjdk-11-jdk

# Verify installation
java -version

# Install Docker (optional, for containerized deployment)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Step 3: Deploy JARs to Server

```bash
# On your local machine: Build JARs
cd metagraph
sbt assembly

# Upload to server
scp modules/l0/target/scala-2.13/sushiii-metagraph-l0-assembly-0.1.0.jar \
    user@your-server-ip:/opt/sushiii/metagraph-l0.jar

scp modules/data_l1/target/scala-2.13/sushiii-metagraph-l1-assembly-0.1.0.jar \
    user@your-server-ip:/opt/sushiii/metagraph-l1.jar
```

### Step 4: Configure Environment

Create configuration file on server:

```bash
# On server: Create environment config
sudo mkdir -p /opt/sushiii
sudo nano /opt/sushiii/integrationnet.conf
```

Add configuration:

```conf
# IntegrationNet Configuration
NETWORK_VERSION=2.0
GLOBAL_L0_URL=https://be-integrationnet.constellationnetwork.io
GLOBAL_L0_PEER_ID=<integration-l0-peer-id>

# Your wallet
WALLET_PRIVATE_KEY=<your-dag4-private-key>
WALLET_ADDRESS=<your-dag-address>

# L0 Configuration
L0_HTTP_PORT=9200
L0_PUBLIC_PORT=9201
L0_P2P_PORT=9202
L0_CLI_PORT=9203

# L1 Configuration
L1_HTTP_PORT=9400
L1_PUBLIC_PORT=9401
L1_P2P_PORT=9402
L1_CLI_PORT=9403

# Network
PUBLIC_HOST=<your-server-public-ip>
```

⚠️ **Security**: Never commit this file to git. Use proper secrets management.

### Step 5: Create Systemd Services

**L0 Service:**

```bash
sudo nano /etc/systemd/system/sushiii-l0.service
```

```ini
[Unit]
Description=Sushiii Metagraph L0
After=network.target

[Service]
Type=simple
User=sushiii
WorkingDirectory=/opt/sushiii
EnvironmentFile=/opt/sushiii/integrationnet.conf
ExecStart=/usr/bin/java -Xmx3g -Xms3g \
  -jar /opt/sushiii/metagraph-l0.jar \
  --http-port ${L0_HTTP_PORT} \
  --public-port ${L0_PUBLIC_PORT} \
  --p2p-port ${L0_P2P_PORT} \
  --cli-port ${L0_CLI_PORT} \
  --global-l0-peer-http-host ${GLOBAL_L0_URL} \
  --global-l0-peer-http-port 443 \
  run-genesis
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**L1 Service:**

```bash
sudo nano /etc/systemd/system/sushiii-l1.service
```

```ini
[Unit]
Description=Sushiii Metagraph Data L1
After=sushiii-l0.service
Requires=sushiii-l0.service

[Service]
Type=simple
User=sushiii
WorkingDirectory=/opt/sushiii
EnvironmentFile=/opt/sushiii/integrationnet.conf
ExecStart=/usr/bin/java -Xmx2g -Xms2g \
  -jar /opt/sushiii/metagraph-l1.jar \
  --http-port ${L1_HTTP_PORT} \
  --public-port ${L1_PUBLIC_PORT} \
  --p2p-port ${L1_P2P_PORT} \
  --cli-port ${L1_CLI_PORT} \
  --l0-peer-http-host localhost \
  --l0-peer-http-port ${L0_HTTP_PORT} \
  run-validator
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Step 6: Start Services

```bash
# Create service user
sudo useradd -r -s /bin/false sushiii
sudo chown -R sushiii:sushiii /opt/sushiii

# Reload systemd
sudo systemctl daemon-reload

# Start L0 first
sudo systemctl start sushiii-l0
sudo systemctl status sushiii-l0

# Wait for L0 to initialize (check logs)
sudo journalctl -u sushiii-l0 -f

# Once L0 is ready, start L1
sudo systemctl start sushiii-l1
sudo systemctl status sushiii-l1

# Enable auto-start on boot
sudo systemctl enable sushiii-l0
sudo systemctl enable sushiii-l1
```

### Step 7: Verify Deployment

```bash
# Check L0 is responding
curl http://your-server-ip:9200/cluster/info

# Check L1 is responding
curl http://your-server-ip:9400/cluster/info

# Submit test policy
curl -X POST http://your-server-ip:9400/data-application/policy \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "test-001",
    "version": "1.0.0",
    "content_hash": "abc123...",
    "uri": "https://example.com/policy",
    "jurisdiction": "GDPR",
    "effective_from": "2025-01-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }'

# Query snapshot
curl http://your-server-ip:9200/snapshots/latest
```

### Step 8: Register Metagraph with Global L0

**Note**: This step requires coordination with Constellation Network team.

```bash
# Get your metagraph ID
curl http://your-server-ip:9200/cluster/info | jq -r '.id'

# Submit registration request to Constellation
# (Process varies - see Constellation documentation)
```

### Step 9: Update API Configuration

Update your TypeScript API to use the deployed metagraph:

```bash
# In api/.env
METAGRAPH_L0_URL=http://your-server-ip:9200
METAGRAPH_L1_URL=http://your-server-ip:9400
METAGRAPH_ID=<your-metagraph-id-from-step-8>
GLOBAL_L0_URL=https://be-integrationnet.constellationnetwork.io
```

---

## MainNet Deployment

⚠️ **Production Deployment**: Only deploy to MainNet when thoroughly tested on IntegrationNet.

### Key Differences from IntegrationNet

1. **Network URL**:
   - IntegrationNet: `https://be-integrationnet.constellationnetwork.io`
   - MainNet: `https://be-mainnet.constellationnetwork.io`

2. **Cost**: Real DAG tokens required for transactions

3. **Data Permanence**: All data is permanent and immutable

4. **Security Requirements**:
   - Use hardware security modules (HSM) for key storage
   - Implement proper backup and disaster recovery
   - Set up monitoring and alerting
   - Use SSL/TLS for all endpoints

### MainNet Deployment Steps

Follow the same steps as IntegrationNet, but:

1. Update `integrationnet.conf` to `mainnet.conf` with MainNet URLs
2. Use production-grade infrastructure (load balancers, CDN, etc.)
3. Implement proper monitoring (Prometheus, Grafana)
4. Set up SSL/TLS certificates for public endpoints
5. Configure firewall rules properly
6. Implement backup strategies for node data

---

## Monitoring and Maintenance

### Health Checks

```bash
# L0 health
curl http://your-server:9200/cluster/info

# L1 health
curl http://your-server:9400/cluster/info

# Check latest snapshot
curl http://your-server:9200/snapshots/latest
```

### Logs

```bash
# View L0 logs
sudo journalctl -u sushiii-l0 -f

# View L1 logs
sudo journalctl -u sushiii-l1 -f

# View recent errors
sudo journalctl -u sushiii-l0 --since "1 hour ago" | grep ERROR
sudo journalctl -u sushiii-l1 --since "1 hour ago" | grep ERROR
```

### Metrics

Expose Prometheus metrics:

```bash
# L0 metrics
curl http://your-server:9200/metrics

# L1 metrics
curl http://your-server:9400/metrics
```

Set up Grafana dashboards to monitor:
- Snapshot production rate
- Transaction throughput
- Memory usage
- CPU usage
- Network latency

### Backup

```bash
# Backup node data (if using file-based storage)
sudo tar -czf sushiii-backup-$(date +%Y%m%d).tar.gz /opt/sushiii/data/

# Backup to remote storage
# (Implement based on your infrastructure)
```

### Updates

To update the metagraph:

```bash
# 1. Build new version locally
sbt assembly

# 2. Upload new JARs
scp modules/l0/target/scala-2.13/*.jar user@server:/opt/sushiii/metagraph-l0-new.jar

# 3. Stop services
sudo systemctl stop sushiii-l1
sudo systemctl stop sushiii-l0

# 4. Replace JARs
sudo mv /opt/sushiii/metagraph-l0-new.jar /opt/sushiii/metagraph-l0.jar

# 5. Start services
sudo systemctl start sushiii-l0
sudo systemctl start sushiii-l1

# 6. Verify
curl http://your-server:9200/cluster/info
```

---

## Troubleshooting

### L0 Won't Start

**Symptoms**: Service fails immediately after starting

**Common Causes**:
- Port already in use
- Insufficient memory
- Invalid configuration

**Solutions**:
```bash
# Check if port is in use
sudo netstat -tulpn | grep 9200

# Check memory
free -h

# Check logs for specific error
sudo journalctl -u sushiii-l0 --no-pager | tail -50

# Verify Java version
java -version  # Should be 11+
```

### L1 Can't Connect to L0

**Symptoms**: L1 logs show connection errors to L0

**Solutions**:
```bash
# Verify L0 is running
curl http://localhost:9200/cluster/info

# Check L1 configuration
cat /opt/sushiii/integrationnet.conf | grep L0

# Verify network connectivity
telnet localhost 9200
```

### Data Not Appearing in Snapshots

**Symptoms**: POST to L1 succeeds but data not in L0 snapshot

**Solutions**:
```bash
# Check L1 logs for validation errors
sudo journalctl -u sushiii-l1 | grep ERROR

# Verify L1 is connected to L0
curl http://localhost:9400/cluster/info

# Check if snapshots are being created
curl http://localhost:9200/snapshots/latest | jq '.ordinal'
# Run again after 60 seconds - ordinal should increase
```

### High Memory Usage

**Symptoms**: JVM using excessive memory

**Solutions**:
```bash
# Adjust heap size in systemd service
# Edit: /etc/systemd/system/sushiii-l0.service
# Change: -Xmx3g -Xms3g to smaller values like -Xmx2g -Xms2g

sudo systemctl daemon-reload
sudo systemctl restart sushiii-l0
```

### Snapshots Not Submitting to Global L0

**Symptoms**: L0 running but not submitting to Global L0

**Causes**:
- Network connectivity issues
- Invalid Global L0 URL
- Insufficient DAG balance

**Solutions**:
```bash
# Verify Global L0 connectivity
curl https://be-integrationnet.constellationnetwork.io/cluster/info

# Check wallet balance
curl https://be-integrationnet.constellationnetwork.io/addresses/<your-address>/balance

# Check L0 logs for specific errors
sudo journalctl -u sushiii-l0 | grep "Global L0"
```

---

## Security Best Practices

1. **Never expose private keys**
   - Use environment variables or secrets manager
   - Never commit to git
   - Rotate keys regularly

2. **Firewall configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 9200/tcp  # L0 HTTP
   sudo ufw allow 9400/tcp  # L1 HTTP
   sudo ufw enable
   ```

3. **SSL/TLS for production**
   - Use Let's Encrypt for free certificates
   - Terminate SSL at load balancer or nginx reverse proxy

4. **Monitoring and alerting**
   - Set up alerts for service failures
   - Monitor resource usage
   - Alert on unusual transaction patterns

5. **Regular updates**
   - Keep JVM updated
   - Update Tessellation SDK when new versions release
   - Monitor Constellation Network announcements

---

## Additional Resources

- **Constellation Network Docs**: https://docs.constellationnetwork.io
- **Tessellation SDK**: https://github.com/Constellation-Labs/tessellation
- **Euclid Dev Environment**: https://github.com/Constellation-Labs/euclid-development-environment
- **Discord Community**: https://discord.gg/constellationnetwork
- **Sushiii API Docs**: See `../api/DEPLOYMENT_GUIDE.md`

---

## Support

For deployment assistance:
1. Check troubleshooting section above
2. Review Constellation Network documentation
3. Ask in Constellation Discord #dev-support channel
4. Check GitHub issues: https://github.com/Constellation-Labs/tessellation/issues
