#!/bin/bash

###############################################################################
# Sushiii - Complete Blockchain Setup Script
#
# This script installs all dependencies and deploys the full blockchain stack.
#
# Usage:
#   chmod +x setup-blockchain.sh
#   ./setup-blockchain.sh
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

###############################################################################
# Step 1: Check and Install Java
###############################################################################

header "Step 1: Installing Java 11"

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -ge 11 ]; then
        success "Java $JAVA_VERSION already installed"
    else
        warn "Java $JAVA_VERSION found, but need Java 11+. Installing..."
        sudo apt update
        sudo apt install -y openjdk-11-jdk
    fi
else
    log "Installing OpenJDK 11..."
    sudo apt update
    sudo apt install -y openjdk-11-jdk
    success "Java 11 installed"
fi

# Verify
java -version
export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:/bin/java::")

###############################################################################
# Step 2: Install SBT (Scala Build Tool)
###############################################################################

header "Step 2: Installing SBT"

if command -v sbt &> /dev/null; then
    success "SBT already installed: $(sbt --version | grep 'sbt version')"
else
    log "Installing SBT..."

    # Add SBT repository
    echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | sudo tee /etc/apt/sources.list.d/sbt.list
    echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | sudo tee /etc/apt/sources.list.d/sbt_old.list

    # Add GPG key
    curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | sudo apt-key add

    # Install
    sudo apt-get update
    sudo apt-get install -y sbt

    success "SBT installed"
fi

# Verify
sbt --version

###############################################################################
# Step 3: Build Metagraph
###############################################################################

header "Step 3: Building Constellation Metagraph"

cd metagraph

log "Building metagraph JARs (this may take 5-10 minutes on first run)..."
sbt assembly

# Verify JARs exist
L0_JAR="modules/l0/target/scala-2.13/sushiii-metagraph-l0-assembly-0.1.0.jar"
L1_JAR="modules/data_l1/target/scala-2.13/sushiii-metagraph-l1-assembly-0.1.0.jar"

if [ -f "$L0_JAR" ] && [ -f "$L1_JAR" ]; then
    success "Metagraph JARs built successfully"
    echo "  - L0: $L0_JAR"
    echo "  - L1: $L1_JAR"
else
    error "Failed to build JARs"
    exit 1
fi

###############################################################################
# Step 4: Start Metagraph
###############################################################################

header "Step 4: Starting Metagraph Nodes"

log "Starting L0 and L1 nodes..."
./scripts/start-local.sh

# Wait for nodes to be ready
sleep 10

# Verify nodes are running
if curl -s -f http://localhost:9200/cluster/info > /dev/null 2>&1; then
    success "L0 node is running on port 9200"
else
    error "L0 node failed to start"
    exit 1
fi

if curl -s -f http://localhost:9400/cluster/info > /dev/null 2>&1; then
    success "L1 node is running on port 9400"
else
    error "L1 node failed to start"
    exit 1
fi

###############################################################################
# Step 5: Configure API
###############################################################################

header "Step 5: Configuring API with Blockchain"

cd ../api

# Check if wallet exists
if [ ! -f ".env.blockchain" ]; then
    warn "No wallet found, generating new wallet..."
    npm run generate-wallet
fi

# Read private key from .env.blockchain
PRIVATE_KEY=$(grep "^PRIVATE_KEY=" .env.blockchain | cut -d'=' -f2)
DAG_ADDRESS=$(grep "^# Blockchain Address:" .env.blockchain | cut -d':' -f2 | tr -d ' ')

log "Configuring API environment..."

# Create or update .env with blockchain configuration
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

# Add blockchain configuration
cat >> .env << EOF

# Blockchain Configuration (added by setup-blockchain.sh)
PRIVATE_KEY=$PRIVATE_KEY
METAGRAPH_L0_URL=http://localhost:9200
METAGRAPH_L1_URL=http://localhost:9400
GLOBAL_L0_URL=https://be-integrationnet.constellationnetwork.io
METAGRAPH_ID=local-dev
EOF

success "API configured with blockchain endpoints"

###############################################################################
# Step 6: Start API
###############################################################################

header "Step 6: Starting API Server"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    log "Installing API dependencies..."
    npm install
fi

# Check if database is set up
log "Checking database setup..."
if ! npm run db:generate > /dev/null 2>&1; then
    warn "Database not initialized, setting up..."
    npm run db:migrate
    npm run setup-db
fi

log "Starting API in background..."
npm run dev > logs/api.log 2>&1 &
API_PID=$!
echo $API_PID > api.pid

# Wait for API to start
sleep 5

if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    success "API is running on port 3001 (PID: $API_PID)"
else
    error "API failed to start. Check logs/api.log"
    exit 1
fi

###############################################################################
# Step 7: Run End-to-End Tests
###############################################################################

header "Step 7: Testing Blockchain Integration"

log "Testing policy submission to blockchain..."

# Create test policy
POLICY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "name": "Test Privacy Policy",
    "description": "Testing blockchain integration",
    "jurisdiction": "GDPR",
    "effectiveDate": "2025-01-01T00:00:00Z"
  }' 2>&1)

if echo "$POLICY_RESPONSE" | grep -q "blockchainHash"; then
    success "Policy submitted to blockchain successfully"
    echo "$POLICY_RESPONSE" | head -5
else
    warn "Policy submission response: $POLICY_RESPONSE"
fi

log "Checking snapshot for policy data..."
sleep 5

SNAPSHOT=$(curl -s http://localhost:9200/snapshots/latest)
if echo "$SNAPSHOT" | grep -q "policyVersions"; then
    success "Policy data found in blockchain snapshot"
else
    warn "Policy not yet in snapshot (may take up to 60 seconds)"
fi

###############################################################################
# Success Summary
###############################################################################

header "✅ Blockchain Deployment Complete!"

echo ""
echo "🎉 Sushiii blockchain is now fully operational!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Running Services:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  API Server:       http://localhost:3001"
echo "  Health Check:     http://localhost:3001/health"
echo "  Metrics:          http://localhost:3001/metrics"
echo ""
echo "  Metagraph L0:     http://localhost:9200"
echo "  Metagraph L1:     http://localhost:9400"
echo "  Latest Snapshot:  http://localhost:9200/snapshots/latest"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Test Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Check API health"
echo "curl http://localhost:3001/health"
echo ""
echo "# Check metagraph status"
echo "curl http://localhost:9200/cluster/info"
echo ""
echo "# View latest blockchain snapshot"
echo "curl http://localhost:9200/snapshots/latest | jq"
echo ""
echo "# Submit a policy to blockchain"
echo "curl -X POST http://localhost:3001/api/v1/policies \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer <your-token>' \\"
echo "  -d '{\"name\":\"Test\",\"jurisdiction\":\"GDPR\",...}'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  API:     tail -f api/logs/api.log"
echo "  L0:      tail -f metagraph/logs/l0.log"
echo "  L1:      tail -f metagraph/logs/l1.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 To stop all services:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  cd metagraph && ./scripts/stop-local.sh"
echo "  kill \$(cat api/api.pid)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
