import Redis from 'ioredis';

/**
 * Redis Client Configuration
 *
 * Provides a singleton Redis client with proper error handling and reconnection logic.
 */

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'sushiii:',
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  lazyConnect: false,
};

class RedisClient {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;

  /**
   * Get the main Redis client
   */
  getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(redisConfig);

      this.client.on('connect', () => {
        console.log('[Redis] Connected to Redis server');
      });

      this.client.on('error', (error) => {
        console.error('[Redis] Connection error:', error.message);
      });

      this.client.on('close', () => {
        console.log('[Redis] Connection closed');
      });

      this.client.on('reconnecting', () => {
        console.log('[Redis] Reconnecting...');
      });
    }

    return this.client;
  }

  /**
   * Get a subscriber client (for pub/sub)
   */
  getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = new Redis(redisConfig);

      this.subscriber.on('connect', () => {
        console.log('[Redis] Subscriber connected');
      });

      this.subscriber.on('error', (error) => {
        console.error('[Redis] Subscriber error:', error.message);
      });
    }

    return this.subscriber;
  }

  /**
   * Check if Redis is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }

    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }

    console.log('[Redis] Disconnected');
  }

  /**
   * Flush all keys (use with caution!)
   */
  async flushAll(): Promise<void> {
    const client = this.getClient();
    await client.flushdb();
    console.log('[Redis] Flushed all keys');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    usedMemory: string;
    connectedClients: number;
    totalKeys: number;
  }> {
    const client = this.getClient();
    const info = await client.info('memory');
    const clientInfo = await client.info('clients');
    const dbSize = await client.dbsize();

    // Parse memory info
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const usedMemory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

    // Parse client count
    const clientMatch = clientInfo.match(/connected_clients:(\d+)/);
    const connectedClients = clientMatch ? parseInt(clientMatch[1]) : 0;

    return {
      usedMemory,
      connectedClients,
      totalKeys: dbSize,
    };
  }
}

// Export singleton instance
export const redisClient = new RedisClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.disconnect();
  process.exit(0);
});
