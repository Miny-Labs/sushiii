import { Redis } from 'ioredis';
import { redisClient } from './redis-client.js';
import { metricsService } from '../services/metrics.js';

/**
 * Cache Manager
 *
 * Provides a high-level caching interface with different strategies:
 * - Cache-aside (read-through): Load from cache, fallback to database
 * - Write-through: Write to cache and database simultaneously
 * - Write-behind: Write to cache immediately, database async (not implemented)
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  compress?: boolean; // Compress large values
}

export class CacheManager {
  private redis: Redis;

  constructor() {
    this.redis = redisClient.getClient();
  }

  /**
   * Generate cache key
   */
  private generateKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      const value = await this.redis.get(cacheKey);

      if (value) {
        metricsService.cacheHits.inc({ cache_type: options.prefix || 'default' });
        return JSON.parse(value) as T;
      }

      metricsService.cacheMisses.inc({ cache_type: options.prefix || 'default' });
      return null;
    } catch (error) {
      console.error(`[Cache] Error getting key ${cacheKey}:`, error);
      metricsService.cacheMisses.inc({ cache_type: options.prefix || 'default' });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      const serialized = JSON.stringify(value);

      if (options.ttl) {
        await this.redis.setex(cacheKey, options.ttl, serialized);
      } else {
        await this.redis.set(cacheKey, serialized);
      }
    } catch (error) {
      console.error(`[Cache] Error setting key ${cacheKey}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${cacheKey}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const searchPattern = this.generateKey(pattern, options.prefix);

    try {
      const keys = await this.redis.keys(searchPattern);
      if (keys.length === 0) return 0;

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${searchPattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   * If value exists in cache, return it. Otherwise, fetch from source and cache it.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  /**
   * Increment a counter
   */
  async increment(key: string, options: CacheOptions = {}): Promise<number> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      const result = await this.redis.incr(cacheKey);

      // Set TTL if specified
      if (options.ttl && result === 1) {
        await this.redis.expire(cacheKey, options.ttl);
      }

      return result;
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${cacheKey}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decrement(key: string, options: CacheOptions = {}): Promise<number> {
    const cacheKey = this.generateKey(key, options.prefix);

    try {
      return await this.redis.decr(cacheKey);
    } catch (error) {
      console.error(`[Cache] Error decrementing key ${cacheKey}:`, error);
      return 0;
    }
  }

  /**
   * Set with sliding expiration (resets TTL on access)
   */
  async getWithSliding<T>(key: string, ttl: number, options: CacheOptions = {}): Promise<T | null> {
    const value = await this.get<T>(key, options);

    if (value !== null) {
      // Reset TTL
      const cacheKey = this.generateKey(key, options.prefix);
      await this.redis.expire(cacheKey, ttl);
    }

    return value;
  }

  /**
   * Add item to a set
   */
  async addToSet(setKey: string, value: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(setKey, options.prefix);

    try {
      await this.redis.sadd(cacheKey, value);

      if (options.ttl) {
        await this.redis.expire(cacheKey, options.ttl);
      }
    } catch (error) {
      console.error(`[Cache] Error adding to set ${cacheKey}:`, error);
    }
  }

  /**
   * Remove item from a set
   */
  async removeFromSet(setKey: string, value: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(setKey, options.prefix);

    try {
      await this.redis.srem(cacheKey, value);
    } catch (error) {
      console.error(`[Cache] Error removing from set ${cacheKey}:`, error);
    }
  }

  /**
   * Check if item exists in set
   */
  async isInSet(setKey: string, value: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.generateKey(setKey, options.prefix);

    try {
      const result = await this.redis.sismember(cacheKey, value);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking set ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Get all members of a set
   */
  async getSetMembers(setKey: string, options: CacheOptions = {}): Promise<string[]> {
    const cacheKey = this.generateKey(setKey, options.prefix);

    try {
      return await this.redis.smembers(cacheKey);
    } catch (error) {
      console.error(`[Cache] Error getting set members ${cacheKey}:`, error);
      return [];
    }
  }

  /**
   * Push to list (queue)
   */
  async pushToList(listKey: string, value: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(listKey, options.prefix);

    try {
      await this.redis.rpush(cacheKey, value);

      if (options.ttl) {
        await this.redis.expire(cacheKey, options.ttl);
      }
    } catch (error) {
      console.error(`[Cache] Error pushing to list ${cacheKey}:`, error);
    }
  }

  /**
   * Pop from list (queue)
   */
  async popFromList(listKey: string, options: CacheOptions = {}): Promise<string | null> {
    const cacheKey = this.generateKey(listKey, options.prefix);

    try {
      return await this.redis.lpop(cacheKey);
    } catch (error) {
      console.error(`[Cache] Error popping from list ${cacheKey}:`, error);
      return null;
    }
  }
}

export const cacheManager = new CacheManager();
