-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Prisma will generate the core tables from schema.prisma
-- This migration adds additional constraints and RLS policies

-- ============================================================================
-- ROW-LEVEL SECURITY SETUP
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_version_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_update_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_policy ON policy_versions
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON consents
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON proof_bundles
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON event_log
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON users
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON consent_purposes
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON encryption_keys
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON aggregated_proofs
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON snapshots
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON policy_version_diffs
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_policy ON policy_update_schedules
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- Ensure valid status values (in addition to Prisma enums)
ALTER TABLE consents ADD CONSTRAINT check_consent_event_type
  CHECK (event_type IN ('granted', 'revoked', 'updated', 'expired'));

ALTER TABLE users ADD CONSTRAINT check_user_status
  CHECK (status IN ('active', 'suspended', 'inactive'));

ALTER TABLE policy_update_schedules ADD CONSTRAINT check_schedule_type
  CHECK (schedule_type IN ('manual', 'scheduled', 'compliance_driven'));

ALTER TABLE policy_update_schedules ADD CONSTRAINT check_schedule_status
  CHECK (status IN ('active', 'paused', 'completed'));

ALTER TABLE policy_compliance ADD CONSTRAINT check_compliance_status
  CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant', 'review_required'));

ALTER TABLE consent_conditions ADD CONSTRAINT check_condition_type
  CHECK (condition_type IN ('time_limited', 'geographic', 'usage_limit', 'data_category', 'third_party'));

ALTER TABLE geographic_scopes ADD CONSTRAINT check_scope_type
  CHECK (scope_type IN ('country', 'region', 'eu', 'global'));

ALTER TABLE encryption_keys ADD CONSTRAINT check_key_type
  CHECK (key_type IN ('encryption', 'signing', 'time_lock'));

ALTER TABLE zk_proofs ADD CONSTRAINT check_proof_type
  CHECK (proof_type IN ('zk_snark', 'zk_stark', 'bulletproof'));

ALTER TABLE audit_logs ADD CONSTRAINT check_severity
  CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'));