BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE SCHEMA IF NOT EXISTS ai_schema;
CREATE SCHEMA IF NOT EXISTS analytics_schema;
CREATE SCHEMA IF NOT EXISTS appointments_schema;
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;
CREATE SCHEMA IF NOT EXISTS clinical_schema;
CREATE SCHEMA IF NOT EXISTS file_schema;
CREATE SCHEMA IF NOT EXISTS notifications_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS provider_schema;
CREATE SCHEMA IF NOT EXISTS shared_schema;

CREATE TYPE IF NOT EXISTS billing_schema.claim_status AS ENUM ('submitted', 'processing', 'approved', 'rejected', 'paid');
CREATE TYPE IF NOT EXISTS billing_schema.insurance_type AS ENUM ('BHYT', 'BHTN', 'Private', 'Self-pay');
CREATE TYPE IF NOT EXISTS billing_schema.invoice_status AS ENUM ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded', 'expired');
CREATE TYPE IF NOT EXISTS billing_schema.item_category AS ENUM ('consultation', 'medication', 'procedure', 'test', 'room', 'other');
CREATE TYPE IF NOT EXISTS billing_schema.payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'payos', 'insurance_direct', 'refund', 'wallet');
CREATE TYPE IF NOT EXISTS billing_schema.payment_status AS ENUM ('pending', 'completed', 'failed', 'refund_pending', 'refunded');
CREATE TYPE IF NOT EXISTS billing_schema.saga_status AS ENUM ('started', 'in_progress', 'completed', 'compensating', 'compensated', 'failed');
CREATE TYPE IF NOT EXISTS clinical_schema.clinical_integration_event_status AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED');

CREATE SEQUENCE IF NOT EXISTS file_schema.chat_sessions_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS file_schema.webhook_processing_log_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS shared_schema.provinces_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS shared_schema.medical_specialties_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS shared_schema.icd10_codes_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS notifications_schema.inbox_inbox_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS clinical_schema.outbox_events_sequence_number_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS billing_schema.invoice_sequences_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS patient_schema.outbox_events_sequence_number_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS patient_schema.patient_id_sequence_2025_01 START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 999 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS patient_schema.patient_id_sequence_202511 START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 999 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS public.department_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 NO CYCLE;

CREATE TABLE IF NOT EXISTS auth_schema.user_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    session_token text NOT NULL,
    device_info jsonb DEFAULT 'w}'::jsonb,
    ip_address inet,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT user_sessions_session_token_key UNIQUE (session_token),
    CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE
);

