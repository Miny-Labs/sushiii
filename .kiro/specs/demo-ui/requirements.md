# Demo UI Requirements Document

## Introduction

This specification defines a streamlined, demo-focused user interface for the Sushiii privacy compliance platform. The UI is designed for video recording at 1080p resolution and demonstrates the complete workflow: Admin creates policies → Users give consent → Auditors verify compliance. The interface prioritizes clarity, speed, and visual appeal for demonstration purposes.

## Glossary

- **Sushiii**: Privacy compliance platform with blockchain verification
- **Policy**: Privacy policy document with versioning and jurisdiction
- **Consent**: User agreement to a specific policy version
- **Proof Bundle**: Cryptographic evidence package for compliance audits
- **Subject ID**: Unique identifier for data subjects (users)
- **Content Hash**: SHA-256 hash of policy text for integrity verification
- **Metagraph**: Constellation Network blockchain layer
- **TX Ref**: Transaction reference on the blockchain

## Requirements

### Requirement 1: Global Layout and Navigation

**User Story:** As a demo viewer, I want consistent navigation and status information so that I can understand the system context throughout the demonstration.

#### Acceptance Criteria

1. THE System SHALL display a minimalist header containing "Sushiii" in Sansation font and clean navigation links
2. THE System SHALL display a minimal footer with build commit, network badge, Metagraph ID, and status indicator using only black/white styling
3. THE System SHALL show clean toast notifications using only black/white contrast
4. THE System SHALL maintain strict minimalist design using only shadcn/ui components with black/white color scheme
5. THE System SHALL use Sansation, Zalando Sans Expanded, and Zalando Sans SemiExpanded fonts exclusively
6. THE System SHALL ensure ultra-high contrast and legibility at 1080p recording resolution

### Requirement 2: Home Page Consent Demo Entry

**User Story:** As a data subject, I want to easily grant or withdraw consent to privacy policies so that I can control my data usage and see the blockchain transaction in real-time.

#### Acceptance Criteria

1. THE System SHALL display a "What is Sushiii?" section with two explanatory lines and live blockchain network status
2. WHEN a user opens the consent modal, THE System SHALL provide a Subject ID input field with a "Use demo subject" button
3. WHEN the "Use demo subject" button is clicked, THE System SHALL generate a random UUID and hash it client-side
4. THE System SHALL provide a Policy ID dropdown populated from GET /api/policies
5. WHEN a policy is selected, THE System SHALL auto-fill the version field and display jurisdiction tag and content hash (first/last 6 characters)
6. THE System SHALL provide Accept and Withdraw action buttons with real-time blockchain submission status
7. WHEN an action is completed, THE System SHALL display a receipt panel with tx_ref, timestamp, policy_ref, content_hash, and blockchain confirmation status
8. THE System SHALL show the transaction being written to the Constellation Network with visual confirmation
9. THE System SHALL display the snapshot ordinal where the consent was recorded
10. THE System SHALL provide an "Open in Auditor" button that prefills the auditor search
11. THE System SHALL show a mini blockchain explorer link to view the transaction on the network

### Requirement 3: Admin Policy Management with Blockchain Integration

**User Story:** As an administrator, I want to create and manage privacy policies with full blockchain transparency so that I can see policies being published to the Constellation Network.

#### Acceptance Criteria

1. THE System SHALL display a two-column layout with policy creation on the left and policy versions on the right
2. THE System SHALL provide a policy text textarea with minimum 10 character validation
3. THE System SHALL provide input fields for Policy ID (slug format), Version (semver), and Jurisdiction (US, EU, IN, GB dropdown)
4. THE System SHALL compute SHA-256 hash of policy text client-side and show preview with blockchain verification status
5. WHEN policy is submitted, THE System SHALL show real-time blockchain submission progress with transaction status
6. THE System SHALL display the Constellation Network transaction reference and confirmation status
7. THE System SHALL show which snapshot ordinal the policy was included in
8. THE System SHALL display a policy versions table with columns: policy_id, version, jurisdiction, content_hash (short with copy), effective_from, tx_ref, snapshot_ordinal, and blockchain status
9. THE System SHALL provide Diff, Copy ID, Copy policy_ref, and "View on Blockchain" actions for each policy version
10. THE System SHALL show Ed25519 signature verification for each published policy
11. WHERE diff functionality is available, THE System SHALL show unified diff of last two versions in a drawer
12. THE System SHALL display a live feed of policy publications being written to the metagraph

### Requirement 4: Auditor Proof Generation with Blockchain Verification

**User Story:** As an auditor, I want to generate and verify proof bundles with full blockchain traceability so that I can validate compliance claims against the Constellation Network.

#### Acceptance Criteria

1. THE System SHALL provide a search panel with Subject ID and Policy ID inputs
2. WHEN Subject ID is raw format, THE System SHALL display "will hash with tenant salt" notification
3. THE System SHALL provide Generate Proof and Download actions (JSON/PDF)
4. WHEN Generate Proof is clicked, THE System SHALL show real-time blockchain query progress and snapshot resolution
5. THE System SHALL display a proof bundle viewer with collapsible JSON sections showing blockchain data
6. THE System SHALL show subject_id_hash, policy_ref, events array (last 3 with expand option), signature details, and finalization_refs with blockchain links
7. THE System SHALL display Ed25519 signature verification with public key and signature validation
8. THE System SHALL show snapshot ordinal verification and L0 endpoint confirmation
9. THE System SHALL display verification status badge: "Verified ✓" (green) or "Unverified" (red) with detailed blockchain verification steps
10. THE System SHALL provide Copy bundle_id, Copy verify command, and "View Snapshots on Network" buttons
11. THE System SHALL show the complete blockchain audit trail with transaction references and timestamps
12. THE System SHALL display Merkle tree verification for proof bundle integrity
13. THE System SHALL show live connection status to Constellation Network nodes during verification

### Requirement 5: Blockchain Infrastructure Dashboard

**User Story:** As a demo viewer, I want to see live blockchain activity and infrastructure status so that I understand the underlying Constellation Network integration.

#### Acceptance Criteria

1. THE System SHALL display a real-time Constellation Network status panel showing Metagraph ID, network type, and node count
2. THE System SHALL show live snapshot progression with ordinal numbers, timestamps, and block creation rate
3. THE System SHALL display individual node status for all 3 metagraph nodes with peer IDs, states, and session information
4. THE System SHALL show recent blockchain transactions with TX refs, timestamps, and transaction types (policy creation, consent events)
5. THE System SHALL display cryptographic signatures and hash verification status for recent transactions
6. THE System SHALL provide a live transaction feed showing policy publications and consent events as they occur
7. THE System SHALL show L0/L1 layer status with cluster information and consensus state
8. THE System SHALL display network metrics including transaction throughput and finalization times

### Requirement 6: Common UI Components

**User Story:** As a user, I want consistent interactive elements so that I have a predictable experience across the platform.

#### Acceptance Criteria

1. THE System SHALL provide a CopyButton component that shows checkmark for 1.5 seconds after click
2. THE System SHALL provide Badge components with color mapping for jurisdictions and verification status
3. THE System SHALL provide HashShort component rendering "abc...def" format with full hash tooltip
4. THE System SHALL provide TimeAgo component showing relative time ("12s ago", "3m ago")
5. THE System SHALL provide JsonViewer component with collapsible sections and 14-16px monospace font

### Requirement 7: Empty, Loading, and Error States

**User Story:** As a user, I want clear feedback about system state so that I understand what's happening and what actions I can take.

#### Acceptance Criteria

1. WHEN Admin has no policies, THE System SHALL display "No policies yet—create your first policy on the left"
2. WHEN Admin is loading, THE System SHALL show skeleton rows
3. WHEN Admin encounters errors, THE System SHALL show inline banner with "Retry" and error ID
4. WHEN Auditor has no data, THE System SHALL display "Provide subject and policy to generate a proof"
5. WHEN Auditor is loading, THE System SHALL show spinner with "Resolving snapshot..." message
6. WHEN Consent modal is empty, THE System SHALL instruct to pick a policy first
7. WHEN Consent is processing, THE System SHALL show "Submitting consent..." message

### Requirement 8: Accessibility and Keyboard Navigation

**User Story:** As a user with accessibility needs, I want keyboard navigation and screen reader support so that I can use the platform effectively.

#### Acceptance Criteria

1. THE System SHALL make all primary actions reachable by Enter or Ctrl+Enter
2. THE System SHALL provide ARIA labels for all buttons and form fields
3. THE System SHALL display visible focus states for keyboard navigation
4. THE System SHALL ensure proper heading hierarchy for screen readers
5. THE System SHALL provide sufficient color contrast for all text elements

### Requirement 9: API Integration Contracts

**User Story:** As a developer, I want well-defined API contracts so that the UI can integrate reliably with backend services.

#### Acceptance Criteria

1. THE System SHALL integrate with GET /api/policies returning array of policy objects with policy_id, version, jurisdiction, content_hash, effective_from
2. THE System SHALL integrate with POST /api/policies accepting policy_id, version, jurisdiction, content_hash, text and returning tx_ref, policy_ref
3. THE System SHALL integrate with POST /api/consents accepting subject_id_hash/subject_id_raw, policy_id, version, event_type and returning tx_ref, timestamp
4. THE System SHALL integrate with POST /api/proof-bundles/generate accepting subject_id_hash/subject_id_raw, policy_id and returning bundle_id, json
5. THE System SHALL integrate with GET /api/health returning ok status and l0 node information with snapshot_ordinal

### Requirement 10: Live Blockchain Explorer Integration

**User Story:** As a demo viewer, I want to see real-time blockchain activity and network visualization so that I understand how data flows through the Constellation Network.

#### Acceptance Criteria

1. THE System SHALL display a live blockchain explorer showing recent snapshots with ordinals, timestamps, and transaction counts
2. THE System SHALL show real-time transaction feed with policy creations, consent events, and proof generations
3. THE System SHALL display network topology visualization showing the 3 metagraph nodes and their connections
4. THE System SHALL show consensus status and cluster health across L0 and L1 layers
5. THE System SHALL display transaction finalization progress with visual confirmation
6. THE System SHALL show cryptographic hash chains and signature verification in real-time
7. THE System SHALL provide drill-down capability to view individual transaction details
8. THE System SHALL display network metrics including TPS (transactions per second) and finalization times

### Requirement 11: Demo Flow Execution with Blockchain Visibility

**User Story:** As a presenter, I want a clear demonstration path with full blockchain transparency so that I can showcase the complete privacy compliance workflow on Constellation Network.

#### Acceptance Criteria

1. THE System SHALL support the demo flow: Admin creates policy with policy_id=privacy, version=1.0.0, jurisdiction=US with live blockchain submission
2. THE System SHALL enable Home/Consent flow: Use demo subject → select privacy@1.0.0 → Accept → show receipt with blockchain confirmation
3. THE System SHALL support Auditor flow: prefilled Subject ID → policy_id=privacy → Generate Proof → show verification with blockchain validation
4. THE System SHALL provide copy functionality for verify command execution in terminal
5. THE System SHALL maintain state consistency across the complete demo workflow
6. THE System SHALL show each step being recorded on the Constellation Network with visual feedback
7. THE System SHALL display the complete blockchain audit trail throughout the demo flow