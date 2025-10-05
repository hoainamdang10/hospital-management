/**
 * Migration: Add Transaction Functions for Patient Operations
 * 
 * Purpose: Fix transaction support anti-pattern
 * - Wrap multi-step operations in database transactions
 * - Ensure data consistency
 * - Prevent partial updates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @date 2025-10-04
 */

-- ============================================================================
-- Function: save_patient_transaction
-- Purpose: Save patient with all related data in a single transaction
-- ============================================================================

CREATE OR REPLACE FUNCTION patient_schema.save_patient_transaction(
  p_patient_data JSONB,
  p_insurance_data JSONB DEFAULT NULL,
  p_contacts_data JSONB[] DEFAULT ARRAY[]::JSONB[],
  p_consents_data JSONB[] DEFAULT ARRAY[]::JSONB[],
  p_links_data JSONB[] DEFAULT ARRAY[]::JSONB[]
) RETURNS JSONB AS $$
DECLARE
  v_patient_id TEXT;
  v_contact JSONB;
  v_consent JSONB;
  v_link JSONB;
  v_result JSONB;
BEGIN
  -- Extract patient_id
  v_patient_id := p_patient_data->>'patient_id';
  
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'patient_id is required';
  END IF;

  -- Start transaction (implicit in function)
  
  -- 1. Upsert patient record
  INSERT INTO patient_schema.patients (
    patient_id,
    user_id,
    personal_info,
    contact_info,
    demographics,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_patient_id,
    (p_patient_data->>'user_id')::UUID,
    p_patient_data->'personal_info',
    p_patient_data->'contact_info',
    p_patient_data->'demographics',
    COALESCE(p_patient_data->>'status', 'active'),
    COALESCE((p_patient_data->>'created_at')::TIMESTAMPTZ, NOW()),
    NOW()
  )
  ON CONFLICT (patient_id) DO UPDATE SET
    personal_info = EXCLUDED.personal_info,
    contact_info = EXCLUDED.contact_info,
    demographics = EXCLUDED.demographics,
    status = EXCLUDED.status,
    updated_at = NOW();

  -- 2. Handle insurance info
  IF p_insurance_data IS NOT NULL THEN
    -- Delete existing insurance
    DELETE FROM patient_schema.insurance_info
    WHERE patient_id = v_patient_id;
    
    -- Insert new insurance
    INSERT INTO patient_schema.insurance_info (
      patient_id,
      insurance_type,
      insurance_number,
      insurance_provider,
      policy_holder_name,
      policy_holder_relationship,
      valid_from,
      valid_until,
      coverage_details,
      created_at,
      updated_at
    ) VALUES (
      v_patient_id,
      p_insurance_data->>'insurance_type',
      p_insurance_data->>'insurance_number',
      p_insurance_data->>'insurance_provider',
      p_insurance_data->>'policy_holder_name',
      p_insurance_data->>'policy_holder_relationship',
      (p_insurance_data->>'valid_from')::DATE,
      (p_insurance_data->>'valid_until')::DATE,
      p_insurance_data->'coverage_details',
      NOW(),
      NOW()
    );
  END IF;

  -- 3. Handle emergency contacts
  IF array_length(p_contacts_data, 1) > 0 THEN
    -- Delete existing contacts
    DELETE FROM patient_schema.emergency_contacts
    WHERE patient_id = v_patient_id;
    
    -- Insert new contacts
    FOREACH v_contact IN ARRAY p_contacts_data
    LOOP
      INSERT INTO patient_schema.emergency_contacts (
        contact_id,
        patient_id,
        full_name,
        relationship,
        primary_phone,
        secondary_phone,
        email,
        address,
        is_primary,
        notes,
        created_at,
        updated_at
      ) VALUES (
        COALESCE(v_contact->>'contact_id', gen_random_uuid()::TEXT),
        v_patient_id,
        v_contact->>'full_name',
        v_contact->>'relationship',
        v_contact->>'primary_phone',
        v_contact->>'secondary_phone',
        v_contact->>'email',
        v_contact->'address',
        COALESCE((v_contact->>'is_primary')::BOOLEAN, FALSE),
        v_contact->>'notes',
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;

  -- 4. Handle consents
  IF array_length(p_consents_data, 1) > 0 THEN
    -- Delete existing consents
    DELETE FROM patient_schema.patient_consents
    WHERE patient_id = v_patient_id;
    
    -- Insert new consents
    FOREACH v_consent IN ARRAY p_consents_data
    LOOP
      INSERT INTO patient_schema.patient_consents (
        consent_id,
        patient_id,
        consent_type,
        granted_at,
        granted_by,
        expires_at,
        scope,
        status,
        created_at,
        updated_at
      ) VALUES (
        COALESCE(v_consent->>'consent_id', gen_random_uuid()::TEXT),
        v_patient_id,
        v_consent->>'consent_type',
        (v_consent->>'granted_at')::TIMESTAMPTZ,
        v_consent->>'granted_by',
        (v_consent->>'expires_at')::TIMESTAMPTZ,
        v_consent->'scope',
        COALESCE(v_consent->>'status', 'active'),
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;

  -- 5. Handle patient links
  IF array_length(p_links_data, 1) > 0 THEN
    -- Delete existing links
    DELETE FROM patient_schema.patient_links
    WHERE patient_id = v_patient_id;
    
    -- Insert new links
    FOREACH v_link IN ARRAY p_links_data
    LOOP
      INSERT INTO patient_schema.patient_links (
        link_id,
        patient_id,
        linked_patient_id,
        link_type,
        created_at,
        created_by
      ) VALUES (
        COALESCE(v_link->>'link_id', gen_random_uuid()::TEXT),
        v_patient_id,
        v_link->>'linked_patient_id',
        v_link->>'link_type',
        NOW(),
        v_link->>'created_by'
      );
    END LOOP;
  END IF;

  -- Return success result
  v_result := jsonb_build_object(
    'success', TRUE,
    'patient_id', v_patient_id,
    'message', 'Patient saved successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to save patient: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: merge_patients_transaction
-- Purpose: Merge two patient records in a single transaction
-- ============================================================================

CREATE OR REPLACE FUNCTION patient_schema.merge_patients_transaction(
  p_source_patient_id TEXT,
  p_target_patient_id TEXT,
  p_merged_by TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_source_patient_id IS NULL OR p_target_patient_id IS NULL THEN
    RAISE EXCEPTION 'Both source and target patient IDs are required';
  END IF;

  IF p_source_patient_id = p_target_patient_id THEN
    RAISE EXCEPTION 'Source and target patient IDs must be different';
  END IF;

  -- Start transaction (implicit in function)

  -- 1. Update insurance records
  UPDATE patient_schema.insurance_info
  SET patient_id = p_target_patient_id,
      updated_at = NOW()
  WHERE patient_id = p_source_patient_id;

  -- 2. Update emergency contacts
  UPDATE patient_schema.emergency_contacts
  SET patient_id = p_target_patient_id,
      updated_at = NOW()
  WHERE patient_id = p_source_patient_id;

  -- 3. Update consents
  UPDATE patient_schema.patient_consents
  SET patient_id = p_target_patient_id,
      updated_at = NOW()
  WHERE patient_id = p_source_patient_id;

  -- 4. Create merge link
  INSERT INTO patient_schema.patient_links (
    link_id,
    patient_id,
    linked_patient_id,
    link_type,
    created_at,
    created_by
  ) VALUES (
    gen_random_uuid()::TEXT,
    p_target_patient_id,
    p_source_patient_id,
    'replaces',
    NOW(),
    p_merged_by
  );

  -- 5. Deactivate source patient
  UPDATE patient_schema.patients
  SET status = 'merged',
      updated_at = NOW()
  WHERE patient_id = p_source_patient_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', TRUE,
    'source_patient_id', p_source_patient_id,
    'target_patient_id', p_target_patient_id,
    'message', 'Patients merged successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to merge patients: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION patient_schema.save_patient_transaction TO service_role;
GRANT EXECUTE ON FUNCTION patient_schema.merge_patients_transaction TO service_role;

-- ============================================================================
-- Success message
-- ============================================================================

SELECT 'Transaction functions created successfully!' as message;

