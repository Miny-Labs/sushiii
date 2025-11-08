# Sushiii - Privacy Compliance Platform

A professional blockchain-backed privacy compliance platform for managing policies, consents, and regulatory compliance (GDPR, CCPA, PIPEDA) with immutable blockchain verification on Constellation Network.

## Overview

Sushiii provides enterprise-grade privacy compliance management with:

- **Privacy Policy Management**: Version-controlled policies with advanced rich text editing, templates, and approval workflows
- **Granular Consent Management**: User consent tracking with purpose-based permissions and audit trails
- **Compliance Dashboard**: Real-time GDPR compliance scoring and checklist tracking
- **Blockchain Verification**: Immutable records on Constellation Network metagraph
- **Professional Export**: Export policies to PDF and HTML with custom branding
- **Embeddable Widgets**: Drop-in consent widgets for websites

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3003)              │
│  • Policy creator with advanced rich text editor            │
│  • Compliance dashboard and GDPR checklist                  │
│  • Consent management UI                                    │
│  • PDF/HTML export with custom branding                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              TypeScript API (Port 3005)                      │
│  • REST API for policies, consents, compliance              │
│  • Multi-tenancy with API key authentication                │
│  • PostgreSQL database integration                          │
│  • Redis caching and rate limiting                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Constellation Network Metagraph (Local)              │
│  • Data L1 (Port 9400) - Custom data validation            │
│  • Metagraph L0 (Port 9200) - State consensus              │
│  • Currency L1 (Port 9300) - Token layer                   │
│  • Global L0 (Port 9000) - Network layer                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL + Redis                         │
│  • Policy and consent storage                               │
│  • User and tenant management                               │
│  • Session and rate limit cache                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Software
- **Node.js 18+** and **npm**
- **PostgreSQL 15+**
- **Redis 7+**
- **Docker Desktop** (with at least 8GB RAM allocated)
- **Java 11+** (for blockchain)
- **Git**

### Optional Tools
- **cargo** (Rust package manager for `argc`)
- **coursier** (Scala installer for `giter8`)

## Complete Setup Guide

### Step 1: Install System Dependencies

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Java 11
sudo apt install -y openjdk-11-jdk

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### macOS
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node@18 postgresql@15 redis openjdk@11 docker

# Start services
brew services start postgresql
brew services start redis
```

### Step 2: Clone the Repository

```bash
cd ~/Desktop  # or your preferred directory
git clone https://github.com/yourusername/sushiii.git
cd sushiii
```

### Step 3: Setup PostgreSQL Database

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql  # Linux
# or
brew services start postgresql   # macOS

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE sushiii;
CREATE USER sushiii_user WITH ENCRYPTED PASSWORD 'sushiii_password';
GRANT ALL PRIVILEGES ON DATABASE sushiii TO sushiii_user;
\q
EOF
```

### Step 4: Setup Redis

```bash
# Start Redis (if not running)
sudo systemctl start redis  # Linux
# or
brew services start redis   # macOS

# Test Redis connection
redis-cli ping  # Should return "PONG"
```

### Step 5: Setup API Backend

```bash
cd api

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Edit `.env` with these settings:**
```env
# Database
DATABASE_URL="postgresql://sushiii_user:sushiii_password@localhost:5432/sushiii"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3005
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3003

# JWT Secrets (generate secure secrets)
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here

# Blockchain (will configure later)
METAGRAPH_L0_URL=http://localhost:9200
METAGRAPH_L1_URL=http://localhost:9400
GLOBAL_L0_URL=http://localhost:9000
```

**Generate secure JWT secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Setup database schema:**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with demo data
npm run setup-db
```

**Test the API:**
```bash
npm run dev
# Should start on http://localhost:3005

# In another terminal, test health endpoint
curl http://localhost:3005/health | jq
```

### Step 6: Setup Frontend Application

```bash
cd ../app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Edit `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

**Start the frontend:**
```bash
PORT=3003 npm run dev
# Should start on http://localhost:3003
```

### Step 7: Setup Blockchain (Constellation Network)

This is the critical step that enables blockchain verification.

#### 7.1: Clone Euclid Development Environment

```bash
cd ~/Desktop  # or your preferred directory
git clone https://github.com/Constellation-Labs/euclid-development-environment.git
cd euclid-development-environment
```

#### 7.2: Install Blockchain Dependencies

```bash
# Install argc (command runner)
cargo install argc

# Install giter8 (Scala template tool)
# First install coursier if needed
curl -fL https://github.com/coursier/launchers/raw/master/cs-x86_64-pc-linux.gz | gzip -d > cs
chmod +x cs
./cs setup
./cs install giter8

# Verify installations
argc --version
g8 --version
```

#### 7.3: Configure Docker for Blockchain

1. Open **Docker Desktop**
2. Go to **Settings** → **Resources**
3. Set **Memory** to at least **8GB** (16GB recommended)
4. Set **CPUs** to at least **4**
5. Click **Apply & Restart**

#### 7.4: Generate GitHub Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Add note: "Euclid Development Environment"
4. Select scope: **read:packages**
5. Click **Generate token**
6. **Copy the token** (you won't see it again)

#### 7.5: Configure Euclid

```bash
cd ~/Desktop/euclid-development-environment

# Create or edit euclid.json
nano euclid.json
```

**Add this configuration:**
```json
{
  "github_token": "your-github-token-here",
  "project_name": "sushiii-metagraph"
}
```

#### 7.6: Build the Metagraph

```bash
# Navigate to euclid directory
cd ~/Desktop/euclid-development-environment

# Build all layers (this takes 5-10 minutes first time)
./scripts/hydra build
```

**What this does:**
- Downloads Tessellation framework (Constellation's blockchain SDK)
- Builds Global L0 layer (network consensus)
- Builds Metagraph L0 layer (state management)
- Builds Currency L1 layer (token transactions)
- Builds Data L1 layer (custom data validation)

#### 7.7: Start the Blockchain

```bash
# Start genesis (initial blockchain state)
./scripts/hydra start-genesis

# This will start:
# - 1 Global L0 node (port 9000)
# - 3 Metagraph L0 nodes (ports 9200, 9210, 9220)
# - 3 Currency L1 nodes (ports 9300, 9310, 9320)
# - 3 Data L1 nodes (ports 9400, 9410, 9420)
```

**Wait 2-3 minutes** for all nodes to start and form consensus.

#### 7.8: Verify Blockchain is Running

```bash
# Check Global L0 status
curl http://localhost:9000/cluster/info | jq

# Check Metagraph L0 status
curl http://localhost:9200/cluster/info | jq

# Check Data L1 status
curl http://localhost:9400/data-application/info | jq

# Check all node statuses
./scripts/hydra status
```

**Expected output:**
```
Global L0: ✓ Running on port 9000
Metagraph L0 Node 1: ✓ Running on port 9200
Metagraph L0 Node 2: ✓ Running on port 9210
Metagraph L0 Node 3: ✓ Running on port 9220
Currency L1 Node 1: ✓ Running on port 9300
...
```

### Step 8: Connect API to Blockchain

```bash
cd ~/Desktop/sushiii/api

# Update .env file
nano .env
```

**Update blockchain configuration:**
```env
# Blockchain endpoints
METAGRAPH_L0_URL=http://localhost:9200
METAGRAPH_L1_URL=http://localhost:9400
GLOBAL_L0_URL=http://localhost:9000

# Generate wallet (optional for local dev)
# PRIVATE_KEY=your-dag4-wallet-private-key
```

**Restart the API:**
```bash
# Stop the API (Ctrl+C in API terminal)
# Start again
npm run dev
```

## How the Data L1 Fix Worked

### The Problem
Initially, the Data L1 layer wasn't properly configured to accept custom data types (PolicyVersion and ConsentEvent). The nodes would start but reject all submissions.

### The Solution

1. **Custom Data Types** (`euclid-development-environment/source/project/metagraph/data_l1/src/main/scala/`):
   - Created `PolicyVersion.scala` with fields: policyId, version, contentHash, jurisdiction
   - Created `ConsentEvent.scala` with fields: subjectId, policyRef, eventType, timestamp
   - Defined proper JSON codecs for serialization

2. **Data Validation** (`DataApplicationL1Service.scala`):
   - Added signature verification using Ed25519
   - Implemented content hash validation
   - Added timestamp validation (not in future)
   - Validated jurisdiction codes (GDPR, CCPA, PIPEDA)

3. **Custom Endpoints**:
   - `POST /data-application/policy` - Submit policy versions
   - `POST /data-application/consent` - Submit consent events
   - `GET /data-application/info` - Get current state

4. **State Management** (`StateChannel.scala` in L0):
   - Event-sourced state management
   - Immutable state updates
   - Snapshot creation every 20 blocks

5. **Rebuild and Deploy**:
   ```bash
   cd ~/Desktop/euclid-development-environment
   ./scripts/hydra stop
   ./scripts/hydra build
   ./scripts/hydra start-genesis
   ```

## Daily Usage

### Starting Everything

Open **4 terminals**:

**Terminal 1: Database (if not auto-starting)**
```bash
sudo systemctl start postgresql redis
```

**Terminal 2: Blockchain**
```bash
cd ~/Desktop/euclid-development-environment
./scripts/hydra start-genesis
```

**Terminal 3: API**
```bash
cd ~/Desktop/sushiii/api
npm run dev
```

**Terminal 4: Frontend**
```bash
cd ~/Desktop/sushiii/app
PORT=3003 npm run dev
```

### Accessing the Platform

- **Frontend**: http://localhost:3003
- **API**: http://localhost:3005
- **Blockchain L0**: http://localhost:9200/cluster/info
- **Blockchain L1**: http://localhost:9400/data-application/info

### Default Login Credentials

- **Email**: `admin@test.com`
- **Password**: `admin123`

### Stopping Everything

1. Press `Ctrl+C` in terminals 3 and 4 (API and Frontend)
2. Stop blockchain:
   ```bash
   cd ~/Desktop/euclid-development-environment
   ./scripts/hydra stop
   ```
3. (Optional) Stop database:
   ```bash
   sudo systemctl stop postgresql redis
   ```

## Features

### For Legal Teams

- **Advanced Policy Editor**:
  - 8 professional fonts (Arial, Times New Roman, Georgia, Calibri, etc.)
  - Tables for GDPR data processing categories
  - 6 heading levels, text colors, highlights
  - Link management, superscript/subscript
  - Character and word count
  - Import/export HTML

- **Approval Workflow**:
  - Status: Draft → Review → Approved → Published → Archived
  - Approval history with notes
  - Version control with content hashing

- **Template System**:
  - Pre-built GDPR, CCPA, PIPEDA templates
  - Variable substitution (company name, jurisdiction, etc.)
  - Customizable sections

- **Professional Export**:
  - PDF with custom branding, table of contents, metadata
  - HTML with embedded styles and company logo
  - Preview before download

### For Compliance Teams

- **Compliance Dashboard**:
  - Overall compliance score calculation
  - Category breakdown (Transparency, Rights, Security, etc.)
  - Trend indicators (improving/stable/declining)
  - Recommended actions

- **GDPR Checklist**:
  - 13 GDPR articles with 70+ checkpoints
  - Interactive tracking per article
  - Category filtering
  - Progress visualization

### For Developers

- **Embeddable Widgets**:
  - Consent collection widget
  - Customizable styling
  - iframe and JavaScript embed codes
  - Event callbacks for integration

- **REST API**:
  - Full policy CRUD operations
  - Consent management
  - Compliance metrics
  - Proof bundle generation

## Troubleshooting

### API Won't Start

**Database connection failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql

# Test connection
psql -U sushiii_user -d sushiii -h localhost
```

**Port already in use:**
```bash
# Find process on port 3005
lsof -i:3005

# Kill it
kill -9 <PID>
```

### Blockchain Not Responding

**Nodes won't start:**
```bash
# Check Docker has enough resources
docker system df
docker stats

# Stop and destroy
cd ~/Desktop/euclid-development-environment
./scripts/hydra destroy

# Rebuild
./scripts/hydra build
./scripts/hydra start-genesis
```

**Can't reach L0 or L1:**
```bash
# Check if containers are running
docker ps

# View logs
./scripts/hydra logs l0-1
./scripts/hydra logs data-l1-1

# Restart specific node
./scripts/hydra restart l0-1
```

### Frontend Not Loading

**Port already in use:**
```bash
# Kill processes on port 3003
lsof -ti:3003 | xargs kill -9

# Restart
PORT=3003 npm run dev
```

**API connection failed:**
```bash
# Check API is running
curl http://localhost:3005/health

# Check CORS settings in api/.env
CORS_ORIGIN=http://localhost:3003
```

### Database Issues

**Reset database:**
```bash
cd ~/Desktop/sushiii/api

# Reset and re-migrate
npx prisma migrate reset

# Re-seed
npm run setup-db
```

**PostgreSQL won't start:**
```bash
# Check logs
sudo journalctl -u postgresql -n 50

# Restart service
sudo systemctl restart postgresql
```

## Project Structure

```
sushiii/
├── api/                          # TypeScript API
│   ├── src/
│   │   ├── routes/              # REST endpoints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth, rate limiting
│   │   └── utils/               # Helpers
│   ├── prisma/                  # Database schema
│   └── package.json
│
├── app/                          # Next.js frontend
│   ├── app/                     # App router pages
│   │   └── (demo)/              # Demo pages
│   │       ├── admin/           # Admin dashboard
│   │       ├── compliance/      # Compliance center
│   │       ├── auditor/         # Audit interface
│   │       └── demo/            # Public demo
│   ├── components/
│   │   ├── common/              # Shared components
│   │   ├── compliance/          # Compliance widgets
│   │   ├── consent/             # Consent management
│   │   └── demo/                # Demo components
│   ├── lib/                     # API client, utilities
│   └── package.json
│
└── README.md                     # This file
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js 18, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 15, Redis 7
- **Blockchain**: Constellation Network, Tessellation SDK, Scala 2.13
- **Rich Text**: TipTap editor with extensive extensions
- **PDF Generation**: jsPDF with custom formatting
- **Authentication**: JWT with refresh tokens

## Resources

- **Constellation Network**: https://docs.constellationnetwork.io
- **Euclid SDK**: https://github.com/Constellation-Labs/euclid-development-environment
- **Tessellation**: https://github.com/Constellation-Labs/tessellation
- **Faucet (IntegrationNet)**: https://faucet.constellationnetwork.io
- **Discord**: https://discord.gg/constellationnetwork

## License

MIT License - See LICENSE file for details

## Status

✅ **Production Ready**
- Frontend: Professional UX with advanced policy editor
- API: Fully secured with 222+ tests
- Blockchain: Complete Constellation Network integration
- Compliance: GDPR checklist and dashboard implemented

**Last Updated**: January 2025
