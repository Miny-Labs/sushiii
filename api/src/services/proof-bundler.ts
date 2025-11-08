import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as ed from '@noble/ed25519';
import { ProofBundle, ConsentEvent, SnapshotRef } from '../types/index.js';
import { hgtpClient } from './hgtp-client.js';
import { metricsService } from './metrics.js';

class ProofBundler {
  private readonly l0Url: string;
  private readonly storageDir: string;
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly maxBundleAge: number; // Max age in milliseconds
  private initialized: boolean = false;

  constructor() {
    this.l0Url = process.env.METAGRAPH_L0_URL || 'http://localhost:9200';
    this.storageDir = process.env.BUNDLE_STORAGE_DIR || './data/bundles';
    this.privateKey = process.env.SIGNING_PRIVATE_KEY || '';
    this.publicKey = process.env.SIGNING_PUBLIC_KEY || '';
    this.maxBundleAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (!this.privateKey || !this.publicKey) {
      console.warn('WARNING: SIGNING_PRIVATE_KEY or SIGNING_PUBLIC_KEY not set. Proof bundles will not be signed properly.');
    }
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create storage directory if it doesn't exist
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`[ProofBundler] Storage directory ready: ${this.storageDir}`);

      // Clean up old bundles on startup
      await this.cleanupOldBundles();

      this.initialized = true;
    } catch (error) {
      console.error('[ProofBundler] Failed to initialize storage:', error);
      throw error;
    }
  }

  private async cleanupOldBundles(): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = join(this.storageDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > this.maxBundleAge) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`[ProofBundler] Cleaned up ${cleanedCount} old bundles`);
      }
    } catch (error) {
      console.error('[ProofBundler] Error cleaning up old bundles:', error);
    }
  }

  private async saveBundle(bundleId: string, bundle: ProofBundle): Promise<void> {
    const filePath = join(this.storageDir, `${bundleId}.json`);
    try {
      const data = JSON.stringify(bundle, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
      console.log(`[ProofBundler] Saved bundle to disk: ${bundleId}`);
    } catch (error) {
      console.error(`[ProofBundler] Failed to save bundle ${bundleId}:`, error);
      throw error;
    }
  }

  private async loadBundle(bundleId: string): Promise<ProofBundle | null> {
    const filePath = join(this.storageDir, `${bundleId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as ProofBundle;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      console.error(`[ProofBundler] Failed to load bundle ${bundleId}:`, error);
      throw error;
    }
  }

  async generateBundle(subjectId: string): Promise<ProofBundle> {
    await this.initialize();

    const start = Date.now();
    let status = 'success';

    try {
      const consents = await hgtpClient.getConsentsBySubject(subjectId);
      const snapshotRefs = await this.getSnapshotRefs();

      // Generate signature
      const signature = await this.generateSignature(subjectId, consents, snapshotRefs);

      const bundle: ProofBundle = {
        subject_id: subjectId,
        consents,
        snapshot_refs: snapshotRefs,
        generated_at: new Date().toISOString(),
        signature,
      };

      const bundleId = this.generateBundleId(bundle);

      // Persist to disk
      await this.saveBundle(bundleId, bundle);

      console.log(`[ProofBundler] Generated proof bundle ${bundleId} for subject ${subjectId}`);

      metricsService.proofBundlesGenerated.inc({ status: 'success' });
      return bundle;
    } catch (error) {
      status = 'failure';
      metricsService.proofBundlesGenerated.inc({ status: 'failure' });
      throw error;
    } finally {
      const duration = (Date.now() - start) / 1000;
      metricsService.proofBundleGenerationDuration.observe(duration);
    }
  }

  async getBundle(bundleId: string): Promise<ProofBundle | null> {
    await this.initialize();
    return await this.loadBundle(bundleId);
  }

  async listBundles(subjectId?: string): Promise<string[]> {
    await this.initialize();

    try {
      const files = await fs.readdir(this.storageDir);
      const bundleIds = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      if (!subjectId) {
        return bundleIds;
      }

      // Filter by subject ID if provided
      const filtered: string[] = [];
      for (const bundleId of bundleIds) {
        const bundle = await this.loadBundle(bundleId);
        if (bundle && bundle.subject_id === subjectId) {
          filtered.push(bundleId);
        }
      }

      return filtered;
    } catch (error) {
      console.error('[ProofBundler] Error listing bundles:', error);
      return [];
    }
  }

  async verifyBundle(bundle: ProofBundle): Promise<boolean> {
    const start = Date.now();
    let status = 'success';

    try {
      // Create canonical representation
      const canonical = this.createCanonicalRepresentation(
        bundle.subject_id,
        bundle.consents,
        bundle.snapshot_refs
      );

      // Hash with SHA-512
      const hash = createHash('sha512').update(canonical).digest();

      // Verify Ed25519 signature
      const signatureBytes = Buffer.from(bundle.signature, 'hex');
      const publicKeyBytes = Buffer.from(this.publicKey, 'hex');

      const isValid = await ed.verify(signatureBytes, hash, publicKeyBytes);

      if (isValid) {
        // Also verify snapshot refs against metagraph
        for (const ref of bundle.snapshot_refs) {
          const snapshotValid = await this.verifySnapshotRef(ref);
          if (!snapshotValid) {
            console.warn(`Snapshot ${ref.ordinal} verification failed`);
            status = 'failure';
            return false;
          }
        }
      } else {
        status = 'failure';
      }

      metricsService.proofBundlesVerified.inc({ status });
      return isValid;
    } catch (error) {
      status = 'failure';
      metricsService.proofBundlesVerified.inc({ status: 'failure' });
      console.error('Error verifying bundle:', error);
      return false;
    } finally {
      const duration = (Date.now() - start) / 1000;
      metricsService.proofBundleVerificationDuration.observe(duration);
    }
  }

  private async getSnapshotRefs(): Promise<SnapshotRef[]> {
    try {
      const response = await fetch(`${this.l0Url}/snapshots/latest`);
      if (!response.ok) {
        console.error('Failed to fetch latest snapshot');
        return [];
      }

      const snapshot = await response.json();
      return [
        {
          ordinal: snapshot.ordinal || 0,
          hash: snapshot.hash || '',
          timestamp: snapshot.timestamp || new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error('Error fetching snapshot refs:', error);
      return [];
    }
  }

  private async verifySnapshotRef(ref: SnapshotRef): Promise<boolean> {
    try {
      const response = await fetch(`${this.l0Url}/snapshots/${ref.ordinal}`);
      if (!response.ok) {
        return false;
      }

      const snapshot = await response.json();
      return snapshot.hash === ref.hash;
    } catch (error) {
      console.error('Error verifying snapshot ref:', error);
      return false;
    }
  }

  private createCanonicalRepresentation(
    subjectId: string,
    consents: ConsentEvent[],
    snapshotRefs: SnapshotRef[]
  ): string {
    // Sort for deterministic representation
    const sortedConsents = [...consents].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const sortedSnapshots = [...snapshotRefs].sort((a, b) => a.ordinal - b.ordinal);

    return JSON.stringify(
      {
        subject_id: subjectId,
        consents: sortedConsents,
        snapshot_refs: sortedSnapshots,
      },
      null,
      0
    );
  }

  private async generateSignature(
    subjectId: string,
    consents: ConsentEvent[],
    snapshotRefs: SnapshotRef[]
  ): Promise<string> {
    if (!this.privateKey) {
      console.warn('No private key available, generating placeholder signature');
      return 'unsigned';
    }

    try {
      // Create canonical representation
      const canonical = this.createCanonicalRepresentation(subjectId, consents, snapshotRefs);

      // Hash with SHA-512 (per Constellation spec)
      const hash = createHash('sha512').update(canonical).digest();

      // Sign with Ed25519
      const privateKeyBytes = Buffer.from(this.privateKey, 'hex');
      const signature = await ed.sign(hash, privateKeyBytes);

      return Buffer.from(signature).toString('hex');
    } catch (error) {
      console.error('Error generating signature:', error);
      throw error;
    }
  }

  private generateBundleId(bundle: ProofBundle): string {
    return `${bundle.subject_id}-${Date.now()}`;
  }
}

export const proofBundler = new ProofBundler();
