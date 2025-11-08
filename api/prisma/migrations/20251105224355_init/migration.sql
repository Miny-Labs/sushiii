-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_quotas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "max_policies" INTEGER NOT NULL DEFAULT 100,
    "max_consents_per_month" INTEGER NOT NULL DEFAULT 10000,
    "max_proof_bundles_per_day" INTEGER NOT NULL DEFAULT 100,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_storage_mb" INTEGER NOT NULL DEFAULT 1000,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_metrics" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "metric_value" BIGINT NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_log" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "aggregate_id" VARCHAR(255) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "event_data" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "aggregate_id" VARCHAR(255) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "policy_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parent_policy_id" UUID,
    "jurisdiction" VARCHAR(10) NOT NULL,
    "template_type" VARCHAR(50),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "uri" TEXT NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_until" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "compliance_mappings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "jurisdiction" VARCHAR(10) NOT NULL,
    "template_type" VARCHAR(50) NOT NULL,
    "template_content" JSONB NOT NULL,
    "compliance_framework" VARCHAR(50),
    "version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurisdiction_requirements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jurisdiction" VARCHAR(10) NOT NULL,
    "framework" VARCHAR(50) NOT NULL,
    "requirements" JSONB NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jurisdiction_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_compliance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_version_id" UUID NOT NULL,
    "framework" VARCHAR(50) NOT NULL,
    "article_references" JSONB NOT NULL DEFAULT '[]',
    "compliance_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "validated_at" TIMESTAMPTZ(6),
    "validated_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_version_diffs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "from_version_id" UUID NOT NULL,
    "to_version_id" UUID NOT NULL,
    "diff_data" JSONB NOT NULL,
    "diff_summary" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_version_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_update_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "schedule_type" VARCHAR(20) NOT NULL,
    "schedule_config" JSONB NOT NULL,
    "next_update_at" TIMESTAMPTZ(6),
    "last_updated_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_update_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "subject_id" VARCHAR(64) NOT NULL,
    "policy_version_id" UUID NOT NULL,
    "event_type" VARCHAR(20) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "purposes" JSONB NOT NULL DEFAULT '[]',
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "expiry_date" TIMESTAMPTZ(6),
    "geographic_scope" VARCHAR(10),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_purposes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "purpose_code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "legal_basis" VARCHAR(50),
    "retention_period" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_purposes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_purpose_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consent_id" UUID NOT NULL,
    "purpose_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "consent_purpose_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consent_id" UUID NOT NULL,
    "condition_type" VARCHAR(50) NOT NULL,
    "condition_value" JSONB NOT NULL,
    "is_met" BOOLEAN,
    "evaluated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geographic_scopes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "scope_type" VARCHAR(20) NOT NULL,
    "countries" JSONB NOT NULL DEFAULT '[]',
    "regions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geographic_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_bundles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "bundle_id" VARCHAR(255) NOT NULL,
    "subject_id" VARCHAR(64) NOT NULL,
    "bundle_data" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "encryption_key_id" VARCHAR(255),
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encryption_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "key_id" VARCHAR(255) NOT NULL,
    "algorithm" VARCHAR(50) NOT NULL,
    "public_key" TEXT NOT NULL,
    "encrypted_private_key" TEXT,
    "key_type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_lock_puzzles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proof_bundle_id" UUID NOT NULL,
    "puzzle_data" JSONB NOT NULL,
    "difficulty" BIGINT NOT NULL,
    "unlock_time" TIMESTAMPTZ(6) NOT NULL,
    "unlocked_at" TIMESTAMPTZ(6),
    "solution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_lock_puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregated_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "aggregate_id" VARCHAR(255) NOT NULL,
    "component_bundle_ids" JSONB NOT NULL,
    "aggregated_signature" TEXT NOT NULL,
    "merkle_root" VARCHAR(64) NOT NULL,
    "proof_count" INTEGER NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aggregated_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_delegations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proof_bundle_id" UUID NOT NULL,
    "delegator_id" VARCHAR(255) NOT NULL,
    "delegate_id" VARCHAR(255) NOT NULL,
    "delegation_signature" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zk_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proof_bundle_id" UUID NOT NULL,
    "proof_type" VARCHAR(50) NOT NULL,
    "proof_data" JSONB NOT NULL,
    "public_inputs" JSONB NOT NULL,
    "verification_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zk_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "actor_id" UUID,
    "actor_type" VARCHAR(50),
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(255) NOT NULL,
    "changes" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_api_key_key" ON "tenants"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_quotas_tenant_id_key" ON "tenant_quotas"("tenant_id");

-- CreateIndex
CREATE INDEX "usage_metrics_tenant_id_metric_type_period_start_idx" ON "usage_metrics"("tenant_id", "metric_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "usage_metrics_tenant_id_metric_type_period_start_key" ON "usage_metrics"("tenant_id", "metric_type", "period_start");

-- CreateIndex
CREATE INDEX "event_log_tenant_id_aggregate_id_aggregate_type_idx" ON "event_log"("tenant_id", "aggregate_id", "aggregate_type");

-- CreateIndex
CREATE INDEX "event_log_timestamp_idx" ON "event_log"("timestamp");

-- CreateIndex
CREATE INDEX "event_log_tenant_id_event_type_idx" ON "event_log"("tenant_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "event_log_tenant_id_aggregate_id_version_key" ON "event_log"("tenant_id", "aggregate_id", "version");

-- CreateIndex
CREATE INDEX "snapshots_tenant_id_aggregate_id_aggregate_type_version_idx" ON "snapshots"("tenant_id", "aggregate_id", "aggregate_type", "version" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_tenant_id_aggregate_id_version_key" ON "snapshots"("tenant_id", "aggregate_id", "version");

-- CreateIndex
CREATE INDEX "policies_tenant_id_deleted_at_idx" ON "policies"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "policies_tenant_id_jurisdiction_idx" ON "policies"("tenant_id", "jurisdiction");

-- CreateIndex
CREATE INDEX "policies_parent_policy_id_idx" ON "policies"("parent_policy_id");

-- CreateIndex
CREATE UNIQUE INDEX "policies_tenant_id_policy_id_key" ON "policies"("tenant_id", "policy_id");

-- CreateIndex
CREATE INDEX "policy_versions_tenant_id_idx" ON "policy_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "policy_versions_tenant_id_policy_id_status_idx" ON "policy_versions"("tenant_id", "policy_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_tenant_id_policy_id_version_key" ON "policy_versions"("tenant_id", "policy_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "policy_templates_name_version_key" ON "policy_templates"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "jurisdiction_requirements_jurisdiction_framework_effective__key" ON "jurisdiction_requirements"("jurisdiction", "framework", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "policy_version_diffs_from_version_id_to_version_id_key" ON "policy_version_diffs"("from_version_id", "to_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "policy_update_schedules_policy_id_key" ON "policy_update_schedules"("policy_id");

-- CreateIndex
CREATE INDEX "consents_tenant_id_idx" ON "consents"("tenant_id");

-- CreateIndex
CREATE INDEX "consents_tenant_id_subject_id_idx" ON "consents"("tenant_id", "subject_id");

-- CreateIndex
CREATE INDEX "consents_tenant_id_policy_version_id_idx" ON "consents"("tenant_id", "policy_version_id");

-- CreateIndex
CREATE INDEX "consents_tenant_id_timestamp_idx" ON "consents"("tenant_id", "timestamp");

-- CreateIndex
CREATE INDEX "consents_tenant_id_subject_id_policy_version_id_event_type_idx" ON "consents"("tenant_id", "subject_id", "policy_version_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "consent_purposes_tenant_id_purpose_code_key" ON "consent_purposes"("tenant_id", "purpose_code");

-- CreateIndex
CREATE UNIQUE INDEX "consent_purpose_mappings_consent_id_purpose_id_key" ON "consent_purpose_mappings"("consent_id", "purpose_id");

-- CreateIndex
CREATE UNIQUE INDEX "proof_bundles_bundle_id_key" ON "proof_bundles"("bundle_id");

-- CreateIndex
CREATE INDEX "proof_bundles_tenant_id_idx" ON "proof_bundles"("tenant_id");

-- CreateIndex
CREATE INDEX "proof_bundles_tenant_id_subject_id_idx" ON "proof_bundles"("tenant_id", "subject_id");

-- CreateIndex
CREATE INDEX "proof_bundles_generated_at_idx" ON "proof_bundles"("generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_key_id_key" ON "encryption_keys"("key_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_lock_puzzles_proof_bundle_id_key" ON "time_lock_puzzles"("proof_bundle_id");

-- CreateIndex
CREATE UNIQUE INDEX "aggregated_proofs_aggregate_id_key" ON "aggregated_proofs"("aggregate_id");

-- CreateIndex
CREATE UNIQUE INDEX "zk_proofs_proof_bundle_id_key" ON "zk_proofs"("proof_bundle_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_resource_type_resource_id_idx" ON "audit_logs"("tenant_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_actor_id_idx" ON "audit_logs"("tenant_id", "actor_id");

-- AddForeignKey
ALTER TABLE "tenant_quotas" ADD CONSTRAINT "tenant_quotas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_parent_policy_id_fkey" FOREIGN KEY ("parent_policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_compliance" ADD CONSTRAINT "policy_compliance_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_version_diffs" ADD CONSTRAINT "policy_version_diffs_from_version_id_fkey" FOREIGN KEY ("from_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_version_diffs" ADD CONSTRAINT "policy_version_diffs_to_version_id_fkey" FOREIGN KEY ("to_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_update_schedules" ADD CONSTRAINT "policy_update_schedules_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_purpose_mappings" ADD CONSTRAINT "consent_purpose_mappings_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "consents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_purpose_mappings" ADD CONSTRAINT "consent_purpose_mappings_purpose_id_fkey" FOREIGN KEY ("purpose_id") REFERENCES "consent_purposes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_conditions" ADD CONSTRAINT "consent_conditions_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "consents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_bundles" ADD CONSTRAINT "proof_bundles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encryption_keys" ADD CONSTRAINT "encryption_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_lock_puzzles" ADD CONSTRAINT "time_lock_puzzles_proof_bundle_id_fkey" FOREIGN KEY ("proof_bundle_id") REFERENCES "proof_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregated_proofs" ADD CONSTRAINT "aggregated_proofs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_delegations" ADD CONSTRAINT "proof_delegations_proof_bundle_id_fkey" FOREIGN KEY ("proof_bundle_id") REFERENCES "proof_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zk_proofs" ADD CONSTRAINT "zk_proofs_proof_bundle_id_fkey" FOREIGN KEY ("proof_bundle_id") REFERENCES "proof_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
