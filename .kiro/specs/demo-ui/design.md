# Demo UI Design Document

## Overview

This document outlines the technical design for implementing a minimalist, demo-focused user interface for the Sushiii privacy compliance platform. The design prioritizes ultra-clean aesthetics, visual clarity, and performance using only shadcn/ui components with a strict black and white color palette and premium typography.

## Design System

### Typography
- **Primary Font**: Sansation (300, 400, 700) - For headings and primary text
- **Secondary Font**: Zalando Sans Expanded (200-900) - For data display and emphasis
- **Tertiary Font**: Zalando Sans SemiExpanded (200-900) - For body text and descriptions
- **Monospace**: System monospace for code, hashes, and technical data

### Color Palette
- **Pure Black**: #000000 - Primary text, borders, active states
- **Pure White**: #FFFFFF - Background, secondary text on dark
- **Gray Scale**: Only black/white, no intermediate grays
- **Transparency**: Black with opacity for subtle elements (5%, 10%, 20%)

### Visual Principles
- **Ultra Minimalism**: No shadows, gradients, or decorative elements
- **High Contrast**: Strict black on white or white on black
- **Clean Lines**: 1px borders, sharp corners, no rounded elements
- **Generous Whitespace**: Ample spacing between elements
- **Typography Hierarchy**: Font weight and size for visual hierarchy

## Architecture

### Component Structure
```
app/
├── (demo)/                    # Demo-specific route group
│   ├── layout.tsx            # Demo layout with header/footer
│   ├── page.tsx              # Home/Consent page
│   ├── admin/
│   │   └── page.tsx          # Admin policy management
│   ├── auditor/
│   │   └── page.tsx          # Auditor proof verification
│   └── health/
│       └── page.tsx          # System health monitoring
├── components/
│   ├── demo/                 # Demo-specific components
│   │   ├── ConsentModal.tsx
│   │   ├── PolicyCreator.tsx
│   │   ├── PolicyVersions.tsx
│   │   ├── ProofGenerator.tsx
│   │   ├── ProofViewer.tsx
│   │   └── HealthCards.tsx
│   ├── blockchain/           # Blockchain visualization components
│   │   ├── NetworkStatus.tsx
│   │   ├── TransactionFeed.tsx
│   │   ├── SnapshotViewer.tsx
│   │   ├── NodeTopology.tsx
│   │   ├── BlockchainExplorer.tsx
│   │   ├── SignatureVerifier.tsx
│   │   └── ConsensusMonitor.tsx
│   ├── common/               # Reusable components
│   │   ├── CopyButton.tsx
│   │   ├── Badge.tsx
│   │   ├── HashShort.tsx
│   │   ├── TimeAgo.tsx
│   │   └── JsonViewer.tsx
│   └── layout/
│       ├── DemoHeader.tsx
│       └── DemoFooter.tsx
└── lib/
    ├── demo-api.ts           # Demo-specific API client
    ├── crypto.ts             # Client-side hashing utilities
    └── demo-store.ts         # Demo state management
```

## Components and Interfaces

### Core Layout Components

#### DemoHeader
- Clean navigation: Home, Admin, Auditor, Health with minimal styling
- Sushiii branding using Sansation font with ultra-thin borders
- Subtle active route highlighting with black/white contrast
- Minimalist responsive design optimized for 1080p recording
- No backgrounds, shadows, or decorative elements

#### DemoFooter
- Build commit hash (first 7 characters) in monospace
- Network badge (Local/IntegrationNet) with black/white styling only
- Metagraph ID (first 6 + last 6 characters with ellipsis)
- API status indicator using only black/white states (●/○)

### Home/Consent Components

#### ConsentModal
```typescript
interface ConsentModalProps {
  isOpen: boolean
  onClose: () => void
  policies: Policy[]
}

interface ConsentFormData {
  subjectId: string
  policyId: string
  version: string
  eventType: 'accept' | 'withdraw'
}
```

Features:
- Subject ID input with demo UUID generator
- Policy dropdown with auto-version filling
- Jurisdiction and content hash display
- Receipt panel with copy functionality
- "Open in Auditor" navigation

### Admin Components

#### PolicyCreator
```typescript
interface PolicyCreatorProps {
  onPolicyCreated: (policy: Policy) => void
}

interface PolicyFormData {
  policyId: string
  version: string
  jurisdiction: string
  text: string
  contentHash?: string
}
```

Features:
- Real-time SHA-256 hashing
- Form validation (min 10 chars for text)
- Jurisdiction dropdown
- Hash preview display

#### PolicyVersions
```typescript
interface PolicyVersionsProps {
  policies: Policy[]
  onRefresh: () => void
}
```

Features:
- Sortable table with copy buttons
- Diff functionality with unified diff display
- Action buttons for each version
- Loading and empty states

### Auditor Components

#### ProofGenerator
```typescript
interface ProofGeneratorProps {
  initialSubjectId?: string
  initialPolicyId?: string
  onProofGenerated: (proof: ProofBundle) => void
}
```

Features:
- Subject ID validation and hashing notification
- Policy selection dropdown
- Generate/Download actions
- Loading states with progress indication

#### ProofViewer
```typescript
interface ProofViewerProps {
  proofBundle: ProofBundle
  verificationStatus: VerificationResult
}

interface VerificationResult {
  isVerified: boolean
  reason?: string
  signatureValid: boolean
  snapshotResolved: boolean
}
```

Features:
- Collapsible JSON viewer
- Verification status badge
- Copy functionality for bundle ID and verify command
- Signature and snapshot details

### Blockchain Components

#### NetworkStatus
```typescript
interface NetworkStatusProps {
  metagraphId: string
  nodeCount: number
  networkType: 'Local' | 'IntegrationNet' | 'MainNet'
  consensusState: 'Ready' | 'Syncing' | 'Error'
}
```

Features:
- Real-time node status updates
- Consensus health monitoring
- Network type badge with color coding
- Live connection indicators

#### TransactionFeed
```typescript
interface TransactionFeedProps {
  transactions: BlockchainTransaction[]
  autoRefresh?: boolean
  maxItems?: number
}

interface BlockchainTransaction {
  txRef: string
  type: 'policy_creation' | 'consent_event' | 'proof_generation'
  timestamp: string
  snapshotOrdinal: number
  status: 'pending' | 'confirmed' | 'finalized'
}
```

Features:
- Real-time transaction streaming
- Transaction type filtering
- Visual confirmation states
- Click-to-explore transaction details

#### SnapshotViewer
```typescript
interface SnapshotViewerProps {
  snapshots: Snapshot[]
  currentOrdinal: number
  onSnapshotSelect: (ordinal: number) => void
}

interface Snapshot {
  ordinal: number
  timestamp: string
  transactionCount: number
  hash: string
  previousHash: string
}
```

Features:
- Snapshot progression visualization
- Transaction count per snapshot
- Hash chain verification
- Interactive snapshot selection

### Common Components

#### CopyButton
```typescript
interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}
```

Features:
- 1.5-second success state
- Accessible with ARIA labels
- Toast notification integration

#### HashShort
```typescript
interface HashShortProps {
  hash: string
  startChars?: number
  endChars?: number
  showTooltip?: boolean
}
```

Features:
- Configurable truncation
- Tooltip with full hash
- Copy on click functionality

#### JsonViewer
```typescript
interface JsonViewerProps {
  data: any
  collapsible?: boolean
  fontSize?: 'sm' | 'base' | 'lg'
}
```

Features:
- Syntax highlighting
- Collapsible sections
- Monospace font (14-16px for recording)
- Search functionality

## Data Models

### Policy
```typescript
interface Policy {
  policy_id: string
  version: string
  jurisdiction: string
  content_hash: string
  effective_from: string
  text?: string
  tx_ref?: string
}
```

### Consent
```typescript
interface Consent {
  subject_id_hash: string
  policy_id: string
  version: string
  event_type: 'accept' | 'withdraw'
  tx_ref: string
  timestamp: string
  policy_ref: string
}
```

### ProofBundle
```typescript
interface ProofBundle {
  bundle_id: string
  subject_id_hash: string
  policy_ref: {
    policy_id: string
    version: string
    content_hash: string
  }
  events: ConsentEvent[]
  signature: {
    algorithm: string
    value: string
    public_key: string
  }
  finalization_refs: {
    snapshot_ordinal: number
    l0_endpoint: string
  }[]
  verification_status: VerificationResult
}
```

## Error Handling

### Error States
- **Network Errors**: Retry button with exponential backoff
- **Validation Errors**: Inline field validation with clear messages
- **API Errors**: Toast notifications with error IDs for debugging
- **Loading States**: Skeleton loaders and progress indicators

### Error Boundaries
- Page-level error boundaries with fallback UI
- Component-level error handling for non-critical failures
- Error reporting with context for debugging

## Testing Strategy

### Unit Tests
- Component rendering and interaction
- Utility functions (hashing, formatting)
- API client methods
- State management logic

### Integration Tests
- Complete demo flow execution
- API integration with mock responses
- Cross-component communication
- Navigation and routing

### E2E Tests
- Full demo workflow: Admin → Consent → Auditor
- Keyboard navigation and accessibility
- Copy functionality and toast notifications
- Error handling and recovery

### Visual Tests
- Screenshot comparison for UI consistency
- 1080p recording compatibility
- Responsive design validation
- Glassmorphism effects rendering

## Performance Considerations

### Optimization Strategies
- Code splitting by route for faster initial load
- Lazy loading of heavy components (JsonViewer, Diff)
- Memoization of expensive computations (hashing)
- Debounced search and filtering

### Bundle Size
- Tree shaking for unused dependencies
- Dynamic imports for optional features
- Optimized build configuration
- Asset optimization (fonts, images)

### Runtime Performance
- Virtual scrolling for large lists
- Efficient re-rendering with React.memo
- Optimistic updates for better UX
- Background data fetching

## Security Considerations

### Client-Side Security
- Input sanitization and validation
- Secure hash generation (Web Crypto API)
- XSS prevention in JSON viewer
- CSRF protection for API calls

### Data Handling
- No sensitive data in localStorage
- Secure clipboard operations
- Hash verification before display
- Audit trail for all actions

## Deployment Strategy

### Build Configuration
- Production optimizations enabled
- Source maps for debugging
- Environment-specific configurations
- Asset compression and caching

### Demo Environment
- Isolated demo data and APIs
- Reset functionality for clean demos
- Performance monitoring
- Error tracking and alerting