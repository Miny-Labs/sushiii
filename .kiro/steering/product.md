---
inclusion: always
---

# Product Overview

Sushiii is a blockchain-backed privacy compliance platform that provides organizations with a complete solution for managing privacy policies and user consents with cryptographic verification on Constellation Network.

## Core Features

- **Privacy Policy Management**: Version-controlled policies with blockchain verification
- **Granular Consent Management**: Fine-grained consent tracking with conditions and purposes
- **Multi-Tenancy**: Isolated environments for multiple organizations with quota management
- **Cryptographic Proof System**: Generate verifiable proof bundles for compliance audits
- **Blockchain Integration**: Immutable records on Constellation Network metagraph
- **Production-Ready API**: Comprehensive security, monitoring, and 222+ tests

## Compliance Frameworks

The platform supports major privacy regulations:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PIPEDA (Personal Information Protection and Electronic Documents Act)

## Architecture

The system consists of three main components:
1. **TypeScript API** (Node.js/Express) - REST API with authentication, multi-tenancy, and business logic
2. **Constellation Network Metagraph** (Scala/Tessellation) - Blockchain layer for immutable consent records
3. **Database Layer** (PostgreSQL + Redis) - Data persistence and caching

## Key Business Concepts

- **Tenants**: Organizations using the platform with isolated data and API keys
- **Policies**: Privacy policies with versioning and compliance mappings
- **Consents**: User consent events with purposes, conditions, and expiry
- **Proof Bundles**: Cryptographically signed evidence packages for audits
- **Event Sourcing**: Complete audit trail of all policy and consent changes