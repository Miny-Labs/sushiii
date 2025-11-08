import { v4 as uuidv4 } from 'uuid';

/**
 * Domain Event Base Interface
 *
 * All domain events in the system implement this interface.
 * Events are immutable records of things that have happened.
 */
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  version: number;
  timestamp: Date;
  data: any;
  metadata: EventMetadata;
}

export interface EventMetadata {
  causationId?: string; // The event that caused this event
  correlationId?: string; // For tracking related events across aggregates
  userId?: string; // Who triggered this event
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Base class for creating domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly timestamp: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly tenantId: string,
    public readonly version: number,
    public readonly data: any,
    public readonly metadata: EventMetadata = {}
  ) {
    this.eventId = uuidv4();
    this.eventType = this.constructor.name;
    this.timestamp = new Date();
  }

  /**
   * Serialize event to JSON
   */
  toJSON(): any {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      tenantId: this.tenantId,
      version: this.version,
      timestamp: this.timestamp.toISOString(),
      data: this.data,
      metadata: this.metadata,
    };
  }

  /**
   * Create event from JSON
   */
  static fromJSON(json: any): DomainEvent {
    return {
      ...json,
      timestamp: new Date(json.timestamp),
    };
  }
}

// ============================================================================
// POLICY EVENTS
// ============================================================================

export class PolicyCreated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      policyId: string;
      name: string;
      description?: string;
      jurisdiction: string;
      parentPolicyId?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

export class PolicyVersionPublished extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      versionId: string;
      versionNumber: string;
      contentHash: string;
      uri: string;
      effectiveFrom: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

export class PolicyVersionDeprecated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      versionId: string;
      reason?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

export class PolicyInheritanceEstablished extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      parentPolicyId: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

export class PolicyComplianceMapped extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      framework: string;
      articles: string[];
      status: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

export class PolicyUpdated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      policyId: string;
      changes: any;
      userId?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

export class PolicyArchived extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      policyId: string;
      userId?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Policy', tenantId, version, data, metadata);
  }
}

// ============================================================================
// CONSENT EVENTS
// ============================================================================

export class ConsentGranted extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      subjectId: string;
      policyVersionId: string;
      timestamp: string;
      purposes?: string[];
      conditions?: any;
      expiryDate?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Consent', tenantId, version, data, metadata);
  }
}

export class ConsentRevoked extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      subjectId: string;
      policyVersionId: string;
      timestamp: string;
      reason?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Consent', tenantId, version, data, metadata);
  }
}

export class ConsentUpdated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      subjectId: string;
      policyVersionId: string;
      timestamp: string;
      changes: any;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Consent', tenantId, version, data, metadata);
  }
}

export class ConsentExpired extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      subjectId: string;
      policyVersionId: string;
      expiryDate: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Consent', tenantId, version, data, metadata);
  }
}

export class ConsentPurposeAdded extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      purposeId: string;
      purposeCode: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Consent', tenantId, version, data, metadata);
  }
}

export class ConsentRenewed extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      subjectId: string;
      policyVersionId: string;
      timestamp: string;
      newExpiryDate?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'Consent', tenantId, version, data, metadata);
  }
}

// ============================================================================
// PROOF BUNDLE EVENTS
// ============================================================================

export class ProofBundleGenerated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      bundleId: string;
      subjectId: string;
      consentCount: number;
      snapshotRefs: any[];
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'ProofBundle', tenantId, version, data, metadata);
  }
}

export class ProofBundleEncrypted extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      bundleId: string;
      encryptionKeyId: string;
      algorithm: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'ProofBundle', tenantId, version, data, metadata);
  }
}

export class ProofBundleDelegated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      bundleId: string;
      delegateId: string;
      permissions: string[];
      validUntil?: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'ProofBundle', tenantId, version, data, metadata);
  }
}

export class ProofBundleAggregated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      aggregateId: string;
      componentBundleIds: string[];
      merkleRoot: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'ProofBundle', tenantId, version, data, metadata);
  }
}

export class ProofBundleVerified extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    version: number,
    data: {
      bundleId: string;
      verificationResult: boolean;
      verifiedBy?: string;
      timestamp: string;
    },
    metadata?: EventMetadata
  ) {
    super(aggregateId, 'ProofBundle', tenantId, version, data, metadata);
  }
}

/**
 * Event Type Registry
 * Maps event type names to their constructors for deserialization
 */
export const EVENT_TYPE_REGISTRY: Record<string, any> = {
  // Policy events
  PolicyCreated,
  PolicyVersionPublished,
  PolicyVersionDeprecated,
  PolicyInheritanceEstablished,
  PolicyComplianceMapped,
  PolicyUpdated,
  PolicyArchived,

  // Consent events
  ConsentGranted,
  ConsentRevoked,
  ConsentUpdated,
  ConsentExpired,
  ConsentPurposeAdded,
  ConsentRenewed,

  // Proof bundle events
  ProofBundleGenerated,
  ProofBundleEncrypted,
  ProofBundleDelegated,
  ProofBundleAggregated,
  ProofBundleVerified,
};
