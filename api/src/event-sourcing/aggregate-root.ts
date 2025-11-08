import { DomainEvent } from './domain-event.js';
import { eventStore } from './event-store.js';

/**
 * Aggregate Root Base Class
 *
 * Represents a consistency boundary in the domain.
 * All changes to an aggregate result in domain events.
 */
export abstract class AggregateRoot {
  protected uncommittedEvents: DomainEvent[] = [];
  protected version: number = 0;

  constructor(
    protected readonly aggregateId: string,
    protected readonly aggregateType: string,
    protected readonly tenantId: string
  ) {}

  /**
   * Apply a new event to the aggregate
   * This both mutates the aggregate state and records the event
   */
  protected applyEvent(event: DomainEvent): void {
    // Apply the event to update aggregate state
    this.mutate(event);

    // Record the event for later persistence
    this.uncommittedEvents.push(event);

    // Increment version
    this.version = event.version;
  }

  /**
   * Mutate aggregate state based on an event
   * Subclasses must implement this to handle their specific events
   */
  protected abstract mutate(event: DomainEvent): void;

  /**
   * Load aggregate from event history
   */
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.mutate(event);
      this.version = event.version;
    }
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Mark all uncommitted events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get aggregate ID
   */
  getId(): string {
    return this.aggregateId;
  }

  /**
   * Get aggregate type
   */
  getType(): string {
    return this.aggregateType;
  }

  /**
   * Get tenant ID
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Save aggregate (persist uncommitted events)
   */
  async save(): Promise<void> {
    const events = this.getUncommittedEvents();
    if (events.length === 0) return;

    await eventStore.appendEvents(events);
    this.markEventsAsCommitted();
  }

  /**
   * Load aggregate from event store
   */
  static async load<T extends AggregateRoot>(
    this: new (aggregateId: string, tenantId: string) => T,
    aggregateId: string,
    tenantId: string
  ): Promise<T> {
    const aggregate = new this(aggregateId, tenantId);

    // Try to load from snapshot first
    const snapshot = await eventStore.getLatestSnapshot(tenantId, aggregateId);

    let fromVersion = 0;
    if (snapshot) {
      // Load state from snapshot
      (aggregate as any).loadFromSnapshot(snapshot.state);
      aggregate.version = snapshot.version;
      fromVersion = snapshot.version + 1;
    }

    // Load events since snapshot (or all events if no snapshot)
    const events = await eventStore.getEvents(tenantId, aggregateId, fromVersion);
    aggregate.loadFromHistory(events);

    return aggregate;
  }

  /**
   * Create a snapshot of current state
   * Subclasses can override to customize snapshot data
   */
  async createSnapshot(): Promise<void> {
    const state = this.getSnapshotData();
    await eventStore.createSnapshot(
      this.tenantId,
      this.aggregateId,
      this.aggregateType,
      this.version,
      state
    );
  }

  /**
   * Get data for snapshot
   * Subclasses should override this
   */
  protected getSnapshotData(): any {
    return {};
  }

  /**
   * Load state from snapshot
   * Subclasses should override this
   */
  protected loadFromSnapshot(snapshotData: any): void {
    // Default implementation does nothing
  }

  /**
   * Check if snapshot should be created (every 100 events by default)
   */
  protected shouldCreateSnapshot(): boolean {
    return this.version > 0 && this.version % 100 === 0;
  }
}
