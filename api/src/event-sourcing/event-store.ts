import { prisma } from '../db/client.js';
import { DomainEvent } from './domain-event.js';
import { TransactionClient } from '../db/transaction.js';

/**
 * Event Store
 *
 * Responsible for persisting and retrieving domain events.
 * Events are immutable - they can only be appended, never modified or deleted.
 */
export class EventStore {
  /**
   * Append events to the event log
   * Events must be in sequential order by version
   */
  async appendEvents(
    events: DomainEvent[],
    tx?: TransactionClient
  ): Promise<void> {
    if (events.length === 0) return;

    const delegate = tx ? tx.eventLog : prisma.eventLog;

    // Verify events are sequential
    this.verifyEventSequence(events);

    // Insert all events
    await delegate.createMany({
      data: events.map(event => ({
        tenantId: event.tenantId,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventData: event.data,
        metadata: event.metadata,
        version: event.version,
        timestamp: event.timestamp,
        createdBy: event.metadata.userId,
      })),
    });

    console.log(`[EventStore] Appended ${events.length} events for aggregate ${events[0].aggregateId}`);
  }

  /**
   * Get all events for an aggregate
   */
  async getEvents(
    tenantId: string,
    aggregateId: string,
    fromVersion: number = 0,
    tx?: TransactionClient
  ): Promise<DomainEvent[]> {
    const delegate = tx ? tx.eventLog : prisma.eventLog;

    const events = await delegate.findMany({
      where: {
        tenantId,
        aggregateId,
        version: {
          gte: fromVersion,
        },
      },
      orderBy: {
        version: 'asc',
      },
    });

    return events.map(event => this.toDomainEvent(event));
  }

  /**
   * Get events by type within a time range
   */
  async getEventsByType(
    tenantId: string,
    eventType: string,
    from: Date,
    to: Date,
    tx?: TransactionClient
  ): Promise<DomainEvent[]> {
    const delegate = tx ? tx.eventLog : prisma.eventLog;

    const events = await delegate.findMany({
      where: {
        tenantId,
        eventType,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return events.map(event => this.toDomainEvent(event));
  }

  /**
   * Get all events for an aggregate type
   */
  async getEventsByAggregateType(
    tenantId: string,
    aggregateType: string,
    from: Date,
    to: Date,
    tx?: TransactionClient
  ): Promise<DomainEvent[]> {
    const delegate = tx ? tx.eventLog : prisma.eventLog;

    const events = await delegate.findMany({
      where: {
        tenantId,
        aggregateType,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return events.map(event => this.toDomainEvent(event));
  }

  /**
   * Get the current version of an aggregate
   */
  async getCurrentVersion(
    tenantId: string,
    aggregateId: string,
    tx?: TransactionClient
  ): Promise<number> {
    const delegate = tx ? tx.eventLog : prisma.eventLog;

    const latestEvent = await delegate.findFirst({
      where: {
        tenantId,
        aggregateId,
      },
      orderBy: {
        version: 'desc',
      },
      select: {
        version: true,
      },
    });

    return latestEvent?.version ?? 0;
  }

  /**
   * Check if aggregate exists
   */
  async aggregateExists(
    tenantId: string,
    aggregateId: string,
    tx?: TransactionClient
  ): Promise<boolean> {
    const version = await this.getCurrentVersion(tenantId, aggregateId, tx);
    return version > 0;
  }

  /**
   * Create a snapshot of aggregate state
   */
  async createSnapshot(
    tenantId: string,
    aggregateId: string,
    aggregateType: string,
    version: number,
    state: any,
    tx?: TransactionClient
  ): Promise<void> {
    const delegate = tx ? tx.snapshot : prisma.snapshot;

    await delegate.create({
      data: {
        tenantId,
        aggregateId,
        aggregateType,
        version,
        snapshotData: state,
      },
    });

    console.log(`[EventStore] Created snapshot for ${aggregateId} at version ${version}`);
  }

  /**
   * Get the latest snapshot for an aggregate
   */
  async getLatestSnapshot(
    tenantId: string,
    aggregateId: string,
    tx?: TransactionClient
  ): Promise<{ version: number; state: any } | null> {
    const delegate = tx ? tx.snapshot : prisma.snapshot;

    const snapshot = await delegate.findFirst({
      where: {
        tenantId,
        aggregateId,
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!snapshot) return null;

    return {
      version: snapshot.version,
      state: snapshot.snapshotData,
    };
  }

  /**
   * Verify events are in sequential order
   */
  private verifyEventSequence(events: DomainEvent[]): void {
    if (events.length === 0) return;

    const aggregateId = events[0].aggregateId;
    let expectedVersion = events[0].version;

    for (const event of events) {
      if (event.aggregateId !== aggregateId) {
        throw new Error(`All events must belong to the same aggregate. Expected ${aggregateId}, got ${event.aggregateId}`);
      }

      if (event.version !== expectedVersion) {
        throw new Error(`Events must be sequential. Expected version ${expectedVersion}, got ${event.version}`);
      }

      expectedVersion++;
    }
  }

  /**
   * Convert database event to domain event
   */
  private toDomainEvent(dbEvent: any): DomainEvent {
    return {
      eventId: dbEvent.id.toString(),
      eventType: dbEvent.eventType,
      aggregateId: dbEvent.aggregateId,
      aggregateType: dbEvent.aggregateType,
      tenantId: dbEvent.tenantId,
      version: dbEvent.version,
      timestamp: dbEvent.timestamp,
      data: dbEvent.eventData,
      metadata: dbEvent.metadata,
    };
  }
}

export const eventStore = new EventStore();
