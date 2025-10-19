-- Migration: 006_optimize_audit_logs.sql
-- Purpose: Optimize audit_logs table for better health check performance
-- Author: Hospital Management Team
-- Date: 2025-01-18

-- =============================================================================
-- PERFORMANCE OPTIMIZATION FOR AUDIT_LOGS
-- =============================================================================

-- Add index on created_at for faster recent logs queries
-- This index is used by health checks and audit log retrieval
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON auth_schema.audit_logs(created_at DESC);

-- Add index on actor_id for faster user-specific audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
ON auth_schema.audit_logs(actor_id);

-- Add index on action for faster action-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON auth_schema.audit_logs(action);

-- Add composite index for common query patterns
-- (actor_id + created_at) for user audit history
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
ON auth_schema.audit_logs(actor_id, created_at DESC);

-- Add index on resource_type for faster resource-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type
ON auth_schema.audit_logs(resource_type);

-- Update table statistics for query planner
ANALYZE auth_schema.audit_logs;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify indexes were created
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'auth_schema'
    AND tablename = 'audit_logs'
    AND indexname LIKE 'idx_audit_logs_%';
  
  RAISE NOTICE 'Created % indexes on audit_logs table', index_count;
END $$;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================

-- To rollback this migration, run:
-- DROP INDEX IF EXISTS auth_schema.idx_audit_logs_created_at;
-- DROP INDEX IF EXISTS auth_schema.idx_audit_logs_actor_id;
-- DROP INDEX IF EXISTS auth_schema.idx_audit_logs_action;
-- DROP INDEX IF EXISTS auth_schema.idx_audit_logs_actor_created;
-- DROP INDEX IF EXISTS auth_schema.idx_audit_logs_resource_type;

