/**
 * Global Test Setup
 *
 * Runs before all tests to configure the test environment
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(process.cwd(), '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for slower CI environments
if (process.env.CI) {
  // @ts-ignore
  globalThis.testTimeout = 30000;
}

// Suppress console logs during tests unless explicitly needed
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

if (process.env.TEST_VERBOSE !== 'true') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for debugging
}

// Restore console on test completion
afterAll(() => {
  if (process.env.TEST_VERBOSE !== 'true') {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  }
});

// Global test utilities
declare global {
  var testUtils: {
    originalConsole: typeof originalConsole;
  };
}

global.testUtils = {
  originalConsole,
};

export {};
