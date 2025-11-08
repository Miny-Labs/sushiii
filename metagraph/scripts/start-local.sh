#!/bin/bash

###############################################################################
# Sushiii Metagraph - Local Development Startup Script
#
# This script builds and runs the metagraph locally for development and testing.
#
# Usage:
#   ./scripts/start-local.sh
#
# Requirements:
#   - Java 11+
#   - sbt 1.9+
#   - Ports 9200-9203 (L0) and 9400-9403 (L1) available
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
L0_HTTP_PORT=9200
L0_PUBLIC_PORT=9201
L0_P2P_PORT=9202
L0_CLI_PORT=9203

L1_HTTP_PORT=9400
L1_PUBLIC_PORT=9401
L1_P2P_PORT=9402
L1_CLI_PORT=9403

L0_JAR="modules/l0/target/scala-2.13/sushiii-metagraph-l0-assembly-0.1.0.jar"
L1_JAR="modules/data_l1/target/scala-2.13/sushiii-metagraph-l1-assembly-0.1.0.jar"

LOG_DIR="logs"
L0_LOG="${LOG_DIR}/l0.log"
L1_LOG="${LOG_DIR}/l1.log"
PID_DIR="pids"
L0_PID="${PID_DIR}/l0.pid"
L1_PID="${PID_DIR}/l1.pid"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port in use
    else
        return 1  # Port available
    fi
}

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    log "Waiting for $name to be ready at $url..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            success "$name is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    error "$name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

###############################################################################
# Pre-flight Checks
###############################################################################

log "Starting pre-flight checks..."

# Check Java
if ! command -v java &> /dev/null; then
    error "Java is not installed. Please install Java 11+ and try again."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    error "Java 11+ is required. Found Java $JAVA_VERSION"
    exit 1
fi
success "Java $JAVA_VERSION found"

# Check sbt
if ! command -v sbt &> /dev/null; then
    error "sbt is not installed. Please install sbt 1.9+ and try again."
    exit 1
fi
success "sbt found"

# Check ports
PORTS_IN_USE=()
for port in $L0_HTTP_PORT $L0_PUBLIC_PORT $L0_P2P_PORT $L0_CLI_PORT $L1_HTTP_PORT $L1_PUBLIC_PORT $L1_P2P_PORT $L1_CLI_PORT; do
    if check_port $port; then
        PORTS_IN_USE+=($port)
    fi
done

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    warn "The following ports are already in use: ${PORTS_IN_USE[*]}"
    warn "Please stop the services using these ports or kill existing metagraph processes:"
    warn "  ./scripts/stop-local.sh"
    exit 1
fi
success "All required ports are available"

###############################################################################
# Build
###############################################################################

log "Building metagraph JARs..."

if sbt assembly; then
    success "Build completed successfully"
else
    error "Build failed. Please check the error messages above."
    exit 1
fi

# Verify JARs exist
if [ ! -f "$L0_JAR" ]; then
    error "L0 JAR not found at $L0_JAR"
    exit 1
fi

if [ ! -f "$L1_JAR" ]; then
    error "L1 JAR not found at $L1_JAR"
    exit 1
fi

success "JARs verified"

###############################################################################
# Setup
###############################################################################

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

###############################################################################
# Start L0
###############################################################################

log "Starting Metagraph L0 on port $L0_HTTP_PORT..."

java -jar "$L0_JAR" \
    --http-port $L0_HTTP_PORT \
    --public-port $L0_PUBLIC_PORT \
    --p2p-port $L0_P2P_PORT \
    --cli-port $L0_CLI_PORT \
    run-genesis \
    > "$L0_LOG" 2>&1 &

L0_PID_VALUE=$!
echo $L0_PID_VALUE > "$L0_PID"

success "L0 started with PID $L0_PID_VALUE"
log "L0 logs: tail -f $L0_LOG"

# Wait for L0 to be ready
if ! wait_for_service "http://localhost:$L0_HTTP_PORT/cluster/info" "L0"; then
    error "L0 failed to start. Check logs: $L0_LOG"
    exit 1
fi

###############################################################################
# Start L1
###############################################################################

log "Starting Data L1 on port $L1_HTTP_PORT..."

java -jar "$L1_JAR" \
    --http-port $L1_HTTP_PORT \
    --public-port $L1_PUBLIC_PORT \
    --p2p-port $L1_P2P_PORT \
    --cli-port $L1_CLI_PORT \
    --l0-peer-http-host localhost \
    --l0-peer-http-port $L0_HTTP_PORT \
    run-validator \
    > "$L1_LOG" 2>&1 &

L1_PID_VALUE=$!
echo $L1_PID_VALUE > "$L1_PID"

success "L1 started with PID $L1_PID_VALUE"
log "L1 logs: tail -f $L1_LOG"

# Wait for L1 to be ready
if ! wait_for_service "http://localhost:$L1_HTTP_PORT/cluster/info" "L1"; then
    error "L1 failed to start. Check logs: $L1_LOG"
    # Kill L0 since L1 failed
    if [ -f "$L0_PID" ]; then
        kill $(cat "$L0_PID") 2>/dev/null || true
        rm "$L0_PID"
    fi
    exit 1
fi

###############################################################################
# Success!
###############################################################################

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Sushiii Metagraph is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Endpoints:"
echo "   L0 (Consensus):     http://localhost:$L0_HTTP_PORT"
echo "   L1 (Application):   http://localhost:$L1_HTTP_PORT"
echo ""
echo "📋 Available APIs:"
echo "   Cluster Info (L0):  curl http://localhost:$L0_HTTP_PORT/cluster/info"
echo "   Cluster Info (L1):  curl http://localhost:$L1_HTTP_PORT/cluster/info"
echo "   Latest Snapshot:    curl http://localhost:$L0_HTTP_PORT/snapshots/latest"
echo ""
echo "   Submit Policy:      curl -X POST http://localhost:$L1_HTTP_PORT/data-application/policy \\"
echo "                            -H 'Content-Type: application/json' -d '{...}'"
echo ""
echo "   Submit Consent:     curl -X POST http://localhost:$L1_HTTP_PORT/data-application/consent \\"
echo "                            -H 'Content-Type: application/json' -d '{...}'"
echo ""
echo "📝 Logs:"
echo "   L0: tail -f $L0_LOG"
echo "   L1: tail -f $L1_LOG"
echo ""
echo "🔍 Process IDs:"
echo "   L0: $(cat $L0_PID)"
echo "   L1: $(cat $L1_PID)"
echo ""
echo "🛑 To stop:"
echo "   ./scripts/stop-local.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
