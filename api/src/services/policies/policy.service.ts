import { prisma } from '../../db/client.js';
import { cacheManager } from '../../cache/cache-manager.js';
import { eventStore } from '../../event-sourcing/event-store.js';
import { PolicyCreated, PolicyVersionPublished, PolicyVersionDeprecated, PolicyUpdated, PolicyArchived } from '../../event-sourcing/domain-event.js';
import { PolicyRepository } from '../../repositories/policy.repository.js';
import { tenantService } from '../tenants/tenant.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced Policy Management Service
 *
 * Features:
 * - Policy CRUD with event sourcing
 * - Policy inheritance and templates
 * - Compliance checking (GDPR, CCPA, PIPEDA)
 * - Version management and diffing
 * - Automated policy updates
 */

export interface CreatePolicyRequest {
  tenantId: string;
  name: string;
  description: string;
  policyText: string;
  jurisdiction: string;
  category: string;
  dataTypes: string[];
  purposes: string[];
  retentionPeriod?: number;
  parentPolicyId?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePolicyRequest {
  name?: string;
  description?: string;
  policyText?: string;
  dataTypes?: string[];
  purposes?: string[];
  retentionPeriod?: number;
  metadata?: Record<string, any>;
}

export interface PolicyWithDetails {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  policyText: string;
  jurisdiction: string;
  category: string;
  dataTypes: string[];
  purposes: string[];
  retentionPeriod: number | null;
  status: string;
  version: number;
  parentPolicyId: string | null;
  templateId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  compliance: {
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    pipedaCompliant: boolean;
    issues: string[];
  };
  children?: PolicyWithDetails[];
}

export interface ComplianceCheckResult {
  compliant: boolean;
  framework: 'GDPR' | 'CCPA' | 'PIPEDA';
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export interface PolicyDiff {
  versionFrom: number;
  versionTo: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'removed' | 'modified';
  }[];
  changesSummary: string;
}

export class PolicyService {
  private policyRepository: PolicyRepository;

  constructor() {
    this.policyRepository = new PolicyRepository('');
  }

  /**
   * Create a new policy
   */
  async createPolicy(request: CreatePolicyRequest, userId: string): Promise<PolicyWithDetails> {
    // Check tenant quota
    const quota = await tenantService.checkQuota(request.tenantId, 'policies');
    if (!quota.allowed) {
      throw new Error(`Policy quota exceeded. Maximum: ${quota.max}, Current: ${quota.current}`);
    }

    // If using a template, load template data
    let templateData: any = {};
    if (request.templateId) {
      const template = await prisma.policyTemplate.findUnique({
        where: { id: request.templateId },
      });
      if (template) {
        templateData = template.templateData;
      }
    }

    // Create policy
    const policyId = uuidv4();
    const policy = await prisma.policy.create({
      data: {
        id: policyId,
        tenantId: request.tenantId,
        name: request.name,
        description: request.description,
        policyText: request.policyText,
        jurisdiction: request.jurisdiction,
        category: request.category,
        dataTypes: request.dataTypes,
        purposes: request.purposes,
        retentionPeriod: request.retentionPeriod,
        parentPolicyId: request.parentPolicyId,
        templateId: request.templateId,
        metadata: { ...templateData, ...request.metadata },
        status: 'draft',
        version: 1,
      },
    });

    // Create initial version record
    await prisma.policyVersion.create({
      data: {
        policyId: policy.id,
        version: 1,
        policyText: policy.policyText,
        dataTypes: policy.dataTypes,
        purposes: policy.purposes,
        retentionPeriod: policy.retentionPeriod,
        metadata: policy.metadata,
        changeDescription: 'Initial version',
        createdBy: userId,
      },
    });

    // Create domain event
    const event = new PolicyCreated({
      aggregateId: policy.id,
      tenantId: policy.tenantId,
      version: 1,
      data: {
        policyId: policy.id,
        name: policy.name,
        jurisdiction: policy.jurisdiction,
        category: policy.category,
        userId,
      },
    });

    await eventStore.appendEvents([event]);

    // Increment tenant usage
    await tenantService.incrementUsage(request.tenantId, 'policies');

    return await this.getPolicyById(policy.id);
  }

  /**
   * Get policy by ID with compliance check
   */
  async getPolicyById(policyId: string): Promise<PolicyWithDetails> {
    // Check cache first
    const cached = await cacheManager.get<PolicyWithDetails>(
      `policy:${policyId}`,
      { prefix: 'policies', ttl: 86400 }
    );
    if (cached) {
      return cached;
    }

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        children: true,
      },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    // Run compliance checks
    const compliance = await this.checkCompliance(policy);

    const policyWithDetails: PolicyWithDetails = {
      id: policy.id,
      tenantId: policy.tenantId,
      name: policy.name,
      description: policy.description,
      policyText: policy.policyText,
      jurisdiction: policy.jurisdiction,
      category: policy.category,
      dataTypes: policy.dataTypes as string[],
      purposes: policy.purposes as string[],
      retentionPeriod: policy.retentionPeriod,
      status: policy.status,
      version: policy.version,
      parentPolicyId: policy.parentPolicyId,
      templateId: policy.templateId,
      metadata: policy.metadata as Record<string, any>,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      compliance: {
        gdprCompliant: compliance.gdpr.compliant,
        ccpaCompliant: compliance.ccpa.compliant,
        pipedaCompliant: compliance.pipeda.compliant,
        issues: [
          ...compliance.gdpr.issues,
          ...compliance.ccpa.issues,
          ...compliance.pipeda.issues,
        ],
      },
      children: policy.children ? await Promise.all(
        policy.children.map(child => this.getPolicyById(child.id))
      ) : undefined,
    };

    // Cache the policy
    await cacheManager.set(
      `policy:${policyId}`,
      policyWithDetails,
      { prefix: 'policies', ttl: 86400 }
    );

    return policyWithDetails;
  }

  /**
   * Update policy (creates new version)
   */
  async updatePolicy(
    policyId: string,
    request: UpdatePolicyRequest,
    userId: string,
    changeDescription: string
  ): Promise<PolicyWithDetails> {
    const currentPolicy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!currentPolicy) {
      throw new Error('Policy not found');
    }

    if (currentPolicy.status === 'archived') {
      throw new Error('Cannot update archived policy');
    }

    const newVersion = currentPolicy.version + 1;

    // Update policy
    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        ...(request.name && { name: request.name }),
        ...(request.description && { description: request.description }),
        ...(request.policyText && { policyText: request.policyText }),
        ...(request.dataTypes && { dataTypes: request.dataTypes }),
        ...(request.purposes && { purposes: request.purposes }),
        ...(request.retentionPeriod !== undefined && { retentionPeriod: request.retentionPeriod }),
        ...(request.metadata && { metadata: { ...currentPolicy.metadata as object, ...request.metadata } }),
        version: newVersion,
      },
    });

    // Create version record
    await prisma.policyVersion.create({
      data: {
        policyId: updatedPolicy.id,
        version: newVersion,
        policyText: updatedPolicy.policyText,
        dataTypes: updatedPolicy.dataTypes,
        purposes: updatedPolicy.purposes,
        retentionPeriod: updatedPolicy.retentionPeriod,
        metadata: updatedPolicy.metadata,
        changeDescription,
        createdBy: userId,
      },
    });

    // Create domain event
    const event = new PolicyUpdated({
      aggregateId: updatedPolicy.id,
      tenantId: updatedPolicy.tenantId,
      version: newVersion,
      data: {
        policyId: updatedPolicy.id,
        changes: request,
        userId,
        changeDescription,
      },
    });

    await eventStore.appendEvents([event]);

    // Invalidate cache
    await cacheManager.delete(`policy:${policyId}`, { prefix: 'policies' });

    return await this.getPolicyById(policyId);
  }

  /**
   * Archive policy
   */
  async archivePolicy(policyId: string, userId: string): Promise<void> {
    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: { status: 'archived' },
    });

    // Create domain event
    const event = new PolicyArchived({
      aggregateId: policy.id,
      tenantId: policy.tenantId,
      version: policy.version + 1,
      data: {
        policyId: policy.id,
        userId,
      },
    });

    await eventStore.appendEvents([event]);

    // Invalidate cache
    await cacheManager.delete(`policy:${policyId}`, { prefix: 'policies' });
  }

  /**
   * Activate policy
   */
  async activatePolicy(policyId: string, userId: string): Promise<PolicyWithDetails> {
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    // Run compliance checks before activation
    const compliance = await this.checkCompliance(policy);
    const hasIssues = !compliance.gdpr.compliant || !compliance.ccpa.compliant || !compliance.pipeda.compliant;

    if (hasIssues) {
      throw new Error('Policy has compliance issues and cannot be activated');
    }

    await prisma.policy.update({
      where: { id: policyId },
      data: { status: 'active' },
    });

    // Invalidate cache
    await cacheManager.delete(`policy:${policyId}`, { prefix: 'policies' });

    return await this.getPolicyById(policyId);
  }

  /**
   * Get policy version history
   */
  async getVersionHistory(policyId: string): Promise<Array<{
    version: number;
    changeDescription: string;
    createdAt: Date;
    createdBy: string;
  }>> {
    const versions = await prisma.policyVersion.findMany({
      where: { policyId },
      orderBy: { version: 'desc' },
      include: {
        createdByUser: true,
      },
    });

    return versions.map(v => ({
      version: v.version,
      changeDescription: v.changeDescription,
      createdAt: v.createdAt,
      createdBy: v.createdByUser?.name || 'System',
    }));
  }

  /**
   * Get diff between two policy versions
   */
  async getPolicyDiff(policyId: string, versionFrom: number, versionTo: number): Promise<PolicyDiff> {
    const [versionFromData, versionToData] = await Promise.all([
      prisma.policyVersion.findFirst({
        where: { policyId, version: versionFrom },
      }),
      prisma.policyVersion.findFirst({
        where: { policyId, version: versionTo },
      }),
    ]);

    if (!versionFromData || !versionToData) {
      throw new Error('Version not found');
    }

    const changes: PolicyDiff['changes'] = [];

    // Compare fields
    if (versionFromData.policyText !== versionToData.policyText) {
      changes.push({
        field: 'policyText',
        oldValue: versionFromData.policyText,
        newValue: versionToData.policyText,
        changeType: 'modified',
      });
    }

    if (JSON.stringify(versionFromData.dataTypes) !== JSON.stringify(versionToData.dataTypes)) {
      changes.push({
        field: 'dataTypes',
        oldValue: versionFromData.dataTypes,
        newValue: versionToData.dataTypes,
        changeType: 'modified',
      });
    }

    if (JSON.stringify(versionFromData.purposes) !== JSON.stringify(versionToData.purposes)) {
      changes.push({
        field: 'purposes',
        oldValue: versionFromData.purposes,
        newValue: versionToData.purposes,
        changeType: 'modified',
      });
    }

    if (versionFromData.retentionPeriod !== versionToData.retentionPeriod) {
      changes.push({
        field: 'retentionPeriod',
        oldValue: versionFromData.retentionPeriod,
        newValue: versionToData.retentionPeriod,
        changeType: 'modified',
      });
    }

    const changesSummary = changes.map(c => `${c.field} was ${c.changeType}`).join(', ');

    return {
      versionFrom,
      versionTo,
      changes,
      changesSummary,
    };
  }

  /**
   * Check policy compliance with multiple frameworks
   */
  async checkCompliance(policy: any): Promise<{
    gdpr: ComplianceCheckResult;
    ccpa: ComplianceCheckResult;
    pipeda: ComplianceCheckResult;
  }> {
    return {
      gdpr: await this.checkGDPRCompliance(policy),
      ccpa: await this.checkCCPACompliance(policy),
      pipeda: await this.checkPIPEDACompliance(policy),
    };
  }

  /**
   * Check GDPR compliance
   */
  private async checkGDPRCompliance(policy: any): Promise<ComplianceCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for required data subject rights
    const policyText = policy.policyText.toLowerCase();

    if (!policyText.includes('right to access')) {
      issues.push('Missing explicit mention of right to access');
      recommendations.push('Add clear statement about data subject right to access their data');
      score -= 15;
    }

    if (!policyText.includes('right to erasure') && !policyText.includes('right to be forgotten')) {
      issues.push('Missing right to erasure/right to be forgotten');
      recommendations.push('Include information about data subject right to erasure');
      score -= 15;
    }

    if (!policyText.includes('right to portability')) {
      issues.push('Missing right to data portability');
      recommendations.push('Add statement about data portability rights');
      score -= 10;
    }

    // Check retention period
    if (!policy.retentionPeriod) {
      issues.push('No retention period specified');
      recommendations.push('Define a specific data retention period');
      score -= 20;
    }

    // Check for lawful basis
    if (!policyText.includes('lawful basis') && !policyText.includes('legal basis')) {
      issues.push('No lawful basis for processing specified');
      recommendations.push('Clearly state the lawful basis for data processing');
      score -= 20;
    }

    // Check for data protection officer mention (if applicable)
    if (!policyText.includes('data protection officer') && !policyText.includes('dpo')) {
      recommendations.push('Consider adding contact information for Data Protection Officer if applicable');
      score -= 5;
    }

    return {
      compliant: issues.length === 0,
      framework: 'GDPR',
      issues,
      recommendations,
      score: Math.max(0, score),
    };
  }

  /**
   * Check CCPA compliance
   */
  private async checkCCPACompliance(policy: any): Promise<ComplianceCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    const policyText = policy.policyText.toLowerCase();

    if (!policyText.includes('do not sell')) {
      issues.push('Missing "Do Not Sell" disclosure');
      recommendations.push('Add clear disclosure about consumer right to opt-out of data sales');
      score -= 20;
    }

    if (!policyText.includes('categories of personal information')) {
      issues.push('Missing categories of personal information collected');
      recommendations.push('List specific categories of personal information collected');
      score -= 15;
    }

    if (!policyText.includes('right to know')) {
      issues.push('Missing right to know disclosure');
      recommendations.push('Include information about consumer right to know what data is collected');
      score -= 15;
    }

    if (!policyText.includes('right to delete')) {
      issues.push('Missing right to delete disclosure');
      recommendations.push('Add statement about consumer right to delete personal information');
      score -= 15;
    }

    if (!policyText.includes('non-discrimination')) {
      issues.push('Missing non-discrimination statement');
      recommendations.push('Include statement that consumers will not be discriminated against for exercising their rights');
      score -= 15;
    }

    return {
      compliant: issues.length === 0,
      framework: 'CCPA',
      issues,
      recommendations,
      score: Math.max(0, score),
    };
  }

  /**
   * Check PIPEDA compliance
   */
  private async checkPIPEDACompliance(policy: any): Promise<ComplianceCheckResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    const policyText = policy.policyText.toLowerCase();

    // Check for consent mechanisms
    if (!policyText.includes('consent')) {
      issues.push('No mention of consent mechanism');
      recommendations.push('Clearly explain how consent is obtained and can be withdrawn');
      score -= 20;
    }

    // Check for purpose identification
    if (!policy.purposes || policy.purposes.length === 0) {
      issues.push('No purposes identified for data collection');
      recommendations.push('Identify and document specific purposes for data collection');
      score -= 15;
    }

    // Check for limiting collection
    if (!policyText.includes('necessary') && !policyText.includes('limited')) {
      issues.push('No statement about limiting data collection');
      recommendations.push('Include statement about collecting only necessary information');
      score -= 10;
    }

    // Check for accuracy
    if (!policyText.includes('accurate') && !policyText.includes('accuracy')) {
      issues.push('No mention of data accuracy');
      recommendations.push('Include commitment to maintaining accurate personal information');
      score -= 10;
    }

    // Check for safeguards
    if (!policyText.includes('security') && !policyText.includes('safeguard')) {
      issues.push('No mention of security safeguards');
      recommendations.push('Describe security measures to protect personal information');
      score -= 15;
    }

    // Check for openness
    if (!policyText.includes('access')) {
      issues.push('No statement about individual access to information');
      recommendations.push('Include information about how individuals can access their personal information');
      score -= 15;
    }

    return {
      compliant: issues.length === 0,
      framework: 'PIPEDA',
      issues,
      recommendations,
      score: Math.max(0, score),
    };
  }

  /**
   * Create policy from template
   */
  async createFromTemplate(
    tenantId: string,
    templateId: string,
    userId: string,
    customizations?: {
      name?: string;
      description?: string;
      retentionPeriod?: number;
    }
  ): Promise<PolicyWithDetails> {
    const template = await prisma.policyTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const templateData = template.templateData as any;

    return await this.createPolicy(
      {
        tenantId,
        name: customizations?.name || template.name,
        description: customizations?.description || template.description,
        policyText: templateData.policyText || '',
        jurisdiction: template.jurisdiction,
        category: template.category,
        dataTypes: templateData.dataTypes || [],
        purposes: templateData.purposes || [],
        retentionPeriod: customizations?.retentionPeriod || templateData.retentionPeriod,
        templateId: template.id,
        metadata: templateData.metadata || {},
      },
      userId
    );
  }

  /**
   * Search policies
   */
  async searchPolicies(
    tenantId: string,
    options: {
      query?: string;
      jurisdiction?: string;
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ policies: PolicyWithDetails[]; total: number }> {
    this.policyRepository = new PolicyRepository(tenantId);

    const policies = await this.policyRepository.findMany({
      where: {
        ...(options.query && {
          OR: [
            { name: { contains: options.query, mode: 'insensitive' } },
            { description: { contains: options.query, mode: 'insensitive' } },
          ],
        }),
        ...(options.jurisdiction && { jurisdiction: options.jurisdiction }),
        ...(options.category && { category: options.category }),
        ...(options.status && { status: options.status }),
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    const total = await prisma.policy.count({
      where: {
        tenantId,
        ...(options.jurisdiction && { jurisdiction: options.jurisdiction }),
        ...(options.category && { category: options.category }),
        ...(options.status && { status: options.status }),
      },
    });

    const policiesWithDetails = await Promise.all(
      policies.map(p => this.getPolicyById(p.id))
    );

    return { policies: policiesWithDetails, total };
  }
}

export const policyService = new PolicyService();
