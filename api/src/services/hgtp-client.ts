import { dag4 } from '@stardust-collective/dag4';
import { PolicyVersion, ConsentEvent } from '../types/index.js';
import { executeWithRetry, ErrorClassifier } from './error-classifier.js';
import { metricsService } from './metrics.js';

class HGTPClient {
  private readonly l0Url: string;
  private readonly l1Url: string;
  private readonly metagraphId: string;
  private readonly globalL0Url: string;
  private initialized: boolean = false;

  constructor() {
    this.l0Url = process.env.METAGRAPH_L0_URL || 'http://localhost:9200';
    this.l1Url = process.env.METAGRAPH_L1_URL || 'http://localhost:9400';
    this.globalL0Url = process.env.GLOBAL_L0_URL || 'http://localhost:9000';
    this.metagraphId = process.env.METAGRAPH_ID || '';
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // Connect to Constellation Network
      dag4.account.connect({
        networkVersion: '2.0',
        beUrl: this.globalL0Url,
        l0Url: this.l0Url,
        l1Url: this.l1Url,
      });

      // Login with private key for signing
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable not set');
      }

      await dag4.account.loginPrivateKey(privateKey);

      this.initialized = true;
      console.log('HGTP Client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HGTP client:', error);
      throw error;
    }
  }

  async submitPolicyVersion(policyVersion: PolicyVersion): Promise<{ hash: string }> {
    await this.initialize();

    const start = Date.now();
    let status = 'success';

    try {
      const result = await executeWithRetry(
        async () => {
          // The Data L1 expects just the PolicyVersion, not wrapped in a DataUpdate
          // The metagraph will create the DataUpdate wrapper internally
          const response = await fetch(`${this.l1Url}/data-application/policy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(policyVersion),
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          if (!response.ok) {
            const errorText = await response.text();
            const error: any = new Error(`HGTP submission failed: ${response.statusText} - ${errorText}`);
            error.status = response.status;
            throw error;
          }

          const result = await response.json();
          console.log('[HGTP] Policy version submitted successfully:', {
            policy_id: policyVersion.policy_id,
            version: policyVersion.version,
            status: result.status,
          });

          return { hash: result.policy_id || 'pending' };
        },
        'submitPolicyVersion'
      );

      metricsService.policyVersionsSubmitted.inc({ status: 'success' });
      return result;
    } catch (error) {
      status = 'failure';
      metricsService.policyVersionsSubmitted.inc({ status: 'failure' });
      throw error;
    } finally {
      const duration = (Date.now() - start) / 1000;
      metricsService.hgtpSubmissionDuration.observe({ type: 'policy' }, duration);
      metricsService.hgtpSubmissionTotal.inc({ type: 'policy', status });
    }
  }

  async submitConsentEvent(consentEvent: ConsentEvent): Promise<{ hash: string }> {
    await this.initialize();

    const start = Date.now();
    let status = 'success';

    try {
      const result = await executeWithRetry(
        async () => {
          // The Data L1 expects just the ConsentEvent, not wrapped in a DataUpdate
          // The metagraph will create the DataUpdate wrapper internally
          const response = await fetch(`${this.l1Url}/data-application/consent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(consentEvent),
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          if (!response.ok) {
            const errorText = await response.text();
            const error: any = new Error(`HGTP submission failed: ${response.statusText} - ${errorText}`);
            error.status = response.status;
            throw error;
          }

          const result = await response.json();
          console.log('[HGTP] Consent event submitted successfully:', {
            subject_id: consentEvent.subject_id,
            event_type: consentEvent.event_type,
            status: result.status,
          });

          return { hash: result.consent_id || result.hash || 'pending' };
        },
        'submitConsentEvent'
      );

      metricsService.consentEventsSubmitted.inc({
        status: 'success',
        event_type: consentEvent.event_type,
      });
      return result;
    } catch (error) {
      status = 'failure';
      metricsService.consentEventsSubmitted.inc({
        status: 'failure',
        event_type: consentEvent.event_type,
      });
      throw error;
    } finally {
      const duration = (Date.now() - start) / 1000;
      metricsService.hgtpSubmissionDuration.observe({ type: 'consent' }, duration);
      metricsService.hgtpSubmissionTotal.inc({ type: 'consent', status });
    }
  }

  async getPolicies(): Promise<PolicyVersion[]> {
    try {
      const response = await fetch(`${this.l0Url}/snapshots/latest`);
      if (!response.ok) {
        throw new Error(`Failed to fetch policies: ${response.statusText}`);
      }

      const snapshot = await response.json();
      return Object.values(snapshot.data?.policyVersions || {});
    } catch (error) {
      console.error('Error fetching policies:', error);
      return [];
    }
  }

  async getPolicy(policyId: string): Promise<PolicyVersion | null> {
    const policies = await this.getPolicies();
    return policies.find((p) => p.policy_id === policyId) || null;
  }

  async getConsentsBySubject(subjectId: string): Promise<ConsentEvent[]> {
    try {
      const response = await fetch(`${this.l0Url}/snapshots/latest`);
      if (!response.ok) {
        throw new Error(`Failed to fetch consents: ${response.statusText}`);
      }

      const snapshot = await response.json();
      const allConsents: ConsentEvent[] = snapshot.data?.consentEvents || [];
      return allConsents.filter((c) => c.subject_id === subjectId);
    } catch (error) {
      console.error('Error fetching consents:', error);
      return [];
    }
  }
}

export const hgtpClient = new HGTPClient();
