#!/bin/bash

###############################################################################
# Sushiii Metagraph - Stop Local Development
#
# This script stops the locally running metagraph instances.
#
# Usage:
#   ./scripts/stop-local.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

stop_process() {
    local pid_file=$1
    local name=$2

    if [ ! -f "$pid_file" ]; then
        warn "$name PID file not found ($pid_file)"
        return 0
    fi

    local pid=$(cat "$pid_file")

    if ! ps -p $pid > /dev/null 2>&1; then
        warn "$name process (PID $pid) is not running"
        rm "$pid_file"
        return 0
    fi

    log "Stopping $name (PID $pid)..."

    # Try graceful shutdown first
    kill $pid 2>/dev/null || true

    # Wait up to 10 seconds for process to stop
    local count=0
    while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo ""

    # Force kill if still running
    if ps -p $pid > /dev/null 2>&1; then
        warn "$name did not stop gracefully, force killing..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi

    if ps -p $pid > /dev/null 2>&1; then
        error "Failed to stop $name (PID $pid)"
        return 1
    else
        success "$name stopped"
        rm "$pid_file"
        return 0
    fi
}

###############################################################################
# Main
###############################################################################

log "Stopping Sushiii Metagraph..."

# Stop L1 first (depends on L0)
stop_process "$L1_PID" "Data L1"

# Then stop L0
stop_process "$L0_PID" "Metagraph L0"

# Clean up any stray Java processes for this metagraph
STRAY_PIDS=$(ps aux | grep "sushiii-metagraph" | grep -v grep | awk '{print $2}' || true)
if [ -n "$STRAY_PIDS" ]; then
    warn "Found stray metagraph processes: $STRAY_PIDS"
    log "Cleaning up..."
    for pid in $STRAY_PIDS; do
        kill -9 $pid 2>/dev/null || true
    done
    success "Stray processes cleaned up"
fi

# Remove PID directory if empty
if [ -d "$PID_DIR" ] && [ -z "$(ls -A $PID_DIR)" ]; then
    rm -r "$PID_DIR"
fi

echo ""
success "Sushiii Metagraph stopped successfully"
echo ""
log "To start again: ./scripts/start-local.sh"
echo ""
