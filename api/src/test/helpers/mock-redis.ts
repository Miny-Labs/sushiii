/**
 * Mock Redis Client
 *
 * Provides a mock Redis client for unit tests
 */

import { vi } from 'vitest';

export const createMockRedis = () => {
  const store = new Map<string, { value: string; expiry?: number }>();

  const mockRedis = {
    // String operations
    get: vi.fn(async (key: string) => {
      const item = store.get(key);
      if (!item) return null;
      if (item.expiry && Date.now() > item.expiry) {
        store.delete(key);
        return null;
      }
      return item.value;
    }),

    set: vi.fn(async (key: string, value: string) => {
      store.set(key, { value });
      return 'OK';
    }),

    setex: vi.fn(async (key: string, seconds: number, value: string) => {
      store.set(key, { value, expiry: Date.now() + seconds * 1000 });
      return 'OK';
    }),

    del: vi.fn(async (...keys: string[]) => {
      keys.forEach(key => store.delete(key));
      return keys.length;
    }),

    exists: vi.fn(async (key: string) => {
      return store.has(key) ? 1 : 0;
    }),

    expire: vi.fn(async (key: string, seconds: number) => {
      const item = store.get(key);
      if (item) {
        item.expiry = Date.now() + seconds * 1000;
        return 1;
      }
      return 0;
    }),

    keys: vi.fn(async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(store.keys()).filter(key => regex.test(key));
    }),

    // Counter operations
    incr: vi.fn(async (key: string) => {
      const item = store.get(key);
      const currentValue = item ? parseInt(item.value) : 0;
      const newValue = currentValue + 1;
      store.set(key, { value: String(newValue), expiry: item?.expiry });
      return newValue;
    }),

    decr: vi.fn(async (key: string) => {
      const item = store.get(key);
      const currentValue = item ? parseInt(item.value) : 0;
      const newValue = currentValue - 1;
      store.set(key, { value: String(newValue), expiry: item?.expiry });
      return newValue;
    }),

    // Set operations
    sadd: vi.fn(async (key: string, ...members: string[]) => {
      const item = store.get(key);
      const set = item ? new Set(JSON.parse(item.value)) : new Set();
      members.forEach(member => set.add(member));
      store.set(key, { value: JSON.stringify(Array.from(set)), expiry: item?.expiry });
      return members.length;
    }),

    srem: vi.fn(async (key: string, ...members: string[]) => {
      const item = store.get(key);
      if (!item) return 0;
      const set = new Set(JSON.parse(item.value));
      members.forEach(member => set.delete(member));
      store.set(key, { value: JSON.stringify(Array.from(set)), expiry: item.expiry });
      return members.length;
    }),

    sismember: vi.fn(async (key: string, member: string) => {
      const item = store.get(key);
      if (!item) return 0;
      const set = new Set(JSON.parse(item.value));
      return set.has(member) ? 1 : 0;
    }),

    smembers: vi.fn(async (key: string) => {
      const item = store.get(key);
      if (!item) return [];
      return JSON.parse(item.value);
    }),

    // List operations
    rpush: vi.fn(async (key: string, ...values: string[]) => {
      const item = store.get(key);
      const list = item ? JSON.parse(item.value) : [];
      list.push(...values);
      store.set(key, { value: JSON.stringify(list), expiry: item?.expiry });
      return list.length;
    }),

    lpop: vi.fn(async (key: string) => {
      const item = store.get(key);
      if (!item) return null;
      const list = JSON.parse(item.value);
      const value = list.shift();
      store.set(key, { value: JSON.stringify(list), expiry: item.expiry });
      return value || null;
    }),

    // Connection
    ping: vi.fn(async () => 'PONG'),
    quit: vi.fn(async () => 'OK'),
    disconnect: vi.fn(async () => undefined),

    // Info
    info: vi.fn(async () => 'redis_version:6.0.0'),
  };

  return {
    client: mockRedis,
    store,
    clear: () => store.clear(),
  };
};

/**
 * Reset mock Redis
 */
export const resetMockRedis = (mockRedis: any) => {
  mockRedis.store.clear();
  Object.keys(mockRedis.client).forEach((key) => {
    if (typeof mockRedis.client[key]?.mockReset === 'function') {
      mockRedis.client[key].mockReset();
    }
  });
};

export default createMockRedis;
