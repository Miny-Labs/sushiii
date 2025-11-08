# Demo UI Implementation Plan

## Task Overview

Convert the demo UI design into a series of implementation tasks that build incrementally toward a complete demonstration-ready interface. Each task focuses on specific functionality while maintaining integration with the overall system.

- [x] 1. Set up minimalist demo route structure and typography
  - Create demo route group with clean layout components
  - Implement ultra-minimalist DemoHeader with Sansation font branding
  - Implement clean DemoFooter with monospace technical data
  - Set up custom font integration (Sansation, Zalando Sans Expanded/SemiExpanded)
  - Configure strict black/white theme with shadcn/ui overrides
  - Remove all shadows, gradients, and decorative elements
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Implement minimalist design system and typography
  - [x] 2.0 Set up custom font integration and minimalist theme
    - Add Google Fonts integration for Sansation, Zalando Sans Expanded/SemiExpanded
    - Configure Tailwind with custom font families
    - Create black/white only color palette
    - Remove all shadcn/ui default colors, shadows, and rounded corners
    - Set up ultra-minimalist component overrides
    - _Requirements: 1.4, 1.5, 1.6_

- [x] 3. Create common utility components and functions
  - [x] 3.1 Implement minimalist CopyButton component
    - Create reusable copy-to-clipboard functionality with clean black/white styling
    - Add 1.5-second success state with minimal visual feedback
    - Integrate with clean toast notification system
    - _Requirements: 6.1_

  - [x] 3.2 Implement HashShort component for hash display
    - Create truncated hash display with "abc...def" format in monospace
    - Add minimal tooltip showing full hash on hover
    - Implement click-to-copy functionality with clean styling
    - _Requirements: 6.3_

  - [x] 3.3 Implement minimalist Badge component variants
    - Create black/white badges for jurisdictions (US, EU, IN, GB) using typography weight
    - Add verification status badges (Verified ✓, Unverified) with high contrast
    - Implement ultra-clean styling using only borders and typography
    - _Requirements: 6.2_

  - [x] 3.4 Implement TimeAgo component for relative timestamps
    - Create human-readable time formatting ("12s ago", "3m ago") in clean typography
    - Add real-time updates for recent timestamps
    - Handle edge cases for very old or future dates
    - _Requirements: 6.4_

- [x] 4. Implement client-side cryptography utilities
  - Create SHA-256 hashing function using Web Crypto API
  - Implement UUID generation for demo subjects
  - Add subject ID hashing with tenant salt simulation
  - Create hash verification utilities
  - _Requirements: 2.3, 3.4_

- [x] 5. Build minimalist Home page with consent modal functionality
  - [x] 5.1 Create ultra-clean Home page layout
    - Design minimal landing page with "What is Sushiii?" section using Sansation font
    - Add clean consent modal launcher button with black/white styling
    - Implement minimal responsive layout optimized for demo recording
    - _Requirements: 2.1_

  - [x] 5.2 Implement minimalist ConsentModal component
    - Create clean modal with Subject ID input and demo button
    - Add minimal Policy ID dropdown populated from API
    - Implement auto-fill version and display jurisdiction/hash in clean typography
    - Add stark Accept/Withdraw action buttons
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 5.3 Create minimal consent receipt panel with blockchain confirmation
    - Display transaction reference with clean copy functionality
    - Show timestamp, policy reference, and content hash in monospace
    - Add blockchain confirmation status and snapshot ordinal
    - Show minimal visual confirmation of transaction being written to Constellation Network
    - Add clean "View on Blockchain" and "Open in Auditor" buttons
    - Implement subtle success feedback with blockchain confirmation
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.11_

- [x] 6. Build minimalist Admin page for policy management
  - [x] 6.1 Create ultra-clean PolicyCreator component (left column)
    - Implement minimal policy text textarea with clean validation
    - Add stark Policy ID, Version, and Jurisdiction inputs
    - Create real-time SHA-256 hash computation with monospace preview
    - Add clean form submission with minimal API integration feedback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Implement minimal PolicyVersions table with blockchain integration
    - Create clean sortable table with policy version data and blockchain status
    - Add columns for TX ref, snapshot ordinal, and blockchain confirmation in monospace
    - Add minimal copy buttons for content hash, policy references, and blockchain links
    - Implement clean Diff, Copy ID, Copy policy_ref, and "View on Blockchain" actions
    - Show Ed25519 signature verification status with simple indicators
    - Add minimal loading states and clean empty state messaging
    - _Requirements: 3.8, 3.9, 3.10, 3.12_

  - [x]* 6.3 Add minimal policy diff functionality (optional)
    - Create clean diff drawer with unified diff display
    - Implement version comparison logic with minimal styling
    - Add clean monospace highlighting for policy text differences
    - Create minimal collapsible diff viewer
    - _Requirements: 3.8_

- [x] 7. Build Auditor page for proof generation and verification
  - [x] 7.1 Create ProofGenerator search panel
    - Implement Subject ID input with hash notification
    - Add Policy ID dropdown selection
    - Create Generate Proof and Download action buttons
    - Add loading states with "Resolving snapshot..." messaging
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Implement ProofViewer component
    - Create JsonViewer with collapsible sections
    - Display proof bundle structure with proper formatting
    - Show signature details and finalization references
    - Implement 14-16px monospace font for recording clarity
    - _Requirements: 4.5, 4.6, 6.5_

  - [x] 7.3 Add comprehensive blockchain proof verification
    - Implement verification status badge with detailed blockchain verification steps
    - Add Ed25519 signature verification with public key validation
    - Show snapshot ordinal verification and L0 endpoint confirmation
    - Display Merkle tree verification for proof bundle integrity
    - Add Copy bundle_id, Copy verify command, and "View Snapshots on Network" buttons
    - Show live connection status to Constellation Network during verification
    - Display complete blockchain audit trail with transaction references
    - _Requirements: 4.7, 4.8, 4.9, 4.11, 4.12, 4.13_

- [x] 8. Build comprehensive blockchain infrastructure dashboard
  - [x] 8.1 Create NetworkStatus component with live Constellation Network monitoring
    - Display Metagraph ID, network type, and active node count
    - Show real-time consensus state and cluster health
    - Add visual indicators for L0/L1 layer status
    - Implement connection status monitoring for all 3 nodes
    - _Requirements: 5.1, 5.7_

  - [x] 8.2 Implement live TransactionFeed component
    - Create real-time transaction streaming from blockchain
    - Display policy creations, consent events, and proof generations
    - Add transaction type filtering and status indicators
    - Show TX refs, timestamps, and snapshot ordinals
    - _Requirements: 5.4, 5.6_

  - [x]* 8.3 Build SnapshotViewer with progression tracking
    - Display live snapshot ordinals with timestamps
    - Show transaction counts per snapshot
    - Add block creation rate calculation
    - Implement interactive snapshot exploration
    - _Requirements: 5.2, 5.8_

  - [x] 8.4 Create NodeTopology visualization
    - Display all 3 metagraph nodes with peer IDs and states
    - Show session information and cluster membership
    - Add visual network topology with connection status
    - Implement node health monitoring with real-time updates
    - _Requirements: 5.3, 5.7_

- [x] 9. Add comprehensive error handling and loading states
  - [x] 9.1 Implement Admin error and loading states
    - Create "No policies yet" empty state with call-to-action
    - Add skeleton loading rows for policy table
    - Implement error banners with retry functionality and error IDs
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Implement Auditor error and loading states
    - Create "Provide subject and policy" empty state guidance
    - Add spinner with "Resolving snapshot..." loading message
    - Implement error handling with "Try again" and error details copy
    - _Requirements: 7.4, 7.5_

  - [x] 9.3 Implement Consent error and loading states
    - Create "Pick a policy first" empty state instruction
    - Add "Submitting consent..." loading message
    - Implement success receipt display and error banner handling
    - _Requirements: 7.6, 7.7_

- [x] 10. Enhance accessibility and keyboard navigation
  - Add ARIA labels to all interactive elements
  - Implement keyboard shortcuts (Enter, Ctrl+Enter) for primary actions
  - Create visible focus states for all focusable elements
  - Ensure proper heading hierarchy and screen reader support
  - Test color contrast ratios for accessibility compliance
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11. Integrate with API endpoints and create demo data flow
  - [x] 11.1 Implement API client for demo endpoints
    - Create demo-specific API client with proper error handling
    - Implement GET /api/policies with mock data for demo
    - Add POST /api/policies for policy creation
    - Create POST /api/consents for consent recording
    - Add POST /api/proof-bundles/generate for proof creation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 11.2 Create demo state management and flow
    - Implement state persistence across demo workflow
    - Create demo data seeding for consistent demonstrations
    - Add state reset functionality for clean demo runs
    - Ensure data consistency across Admin → Consent → Auditor flow
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Optimize for demo recording and performance
  - Ensure all text is legible at 1080p resolution
  - Optimize animations for smooth video recording
  - Implement proper loading states to avoid demo timing issues
  - Add demo mode toggle for consistent demonstration experience
  - Create demo script documentation for presentation flow
  - _Requirements: 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Build live blockchain explorer integration
  - [x] 13.1 Create BlockchainExplorer component
    - Display recent snapshots with ordinals, timestamps, and transaction counts
    - Show network topology visualization with 3 metagraph nodes
    - Add drill-down capability for individual transaction details
    - Implement real-time updates with WebSocket or polling
    - _Requirements: 10.1, 10.3, 10.7_

  - [x] 13.2 Implement SignatureVerifier component
    - Show cryptographic hash chains and signature verification
    - Display Ed25519 signature validation in real-time
    - Add public key verification and signature status
    - Create visual confirmation of cryptographic integrity
    - _Requirements: 10.6_

  - [x] 13.3 Add ConsensusMonitor component
    - Display consensus status across L0 and L1 layers
    - Show transaction finalization progress with visual confirmation
    - Add network metrics including TPS and finalization times
    - Implement cluster health monitoring across all nodes
    - _Requirements: 10.4, 10.5, 10.8_

- [x] 14. Final integration testing and demo validation with blockchain
  - Test complete demo workflow with blockchain visibility: Admin creates policy → User consents → Auditor verifies
  - Validate all blockchain transaction confirmations and visual feedback
  - Ensure proper error handling and recovery in demo scenarios
  - Test real-time blockchain updates and transaction streaming
  - Verify 1080p recording compatibility and visual clarity for blockchain components
  - Validate complete blockchain audit trail throughout demo flow
  - _Requirements: All requirements validation, 11.1, 11.2, 11.3, 11.6, 11.7_