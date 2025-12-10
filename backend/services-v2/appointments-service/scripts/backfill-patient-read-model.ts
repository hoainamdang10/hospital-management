/**
 * Backfill patient_read_model and appointment_read_model patient data
 * Usage:
 *   ts-node scripts/backfill-patient-read-model.ts
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "..", "..", ".env"),
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Please set them in backend/services-v2/.env",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const appointmentsSchema = supabase.schema("appointments_schema");
const patientSchema = supabase.schema("patient_schema");

type PatientRow = {
  patient_id: string;
  personal_info?: any;
  contact_info?: any;
  basic_medical_info?: any;
};

type PatientReadModelRow = {
  patient_id: string;
  tenant_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  national_id?: string | null;
  insurance_number?: string | null;
  insurance_type?: string | null;
  address?: any;
};

async function loadDistinctAppointmentPatientIds(): Promise<string[]> {
  const { data, error } = await appointmentsSchema
    .from("appointments")
    .select("patient_id")
    .not("patient_id", "is", null);

  if (error) {
    throw new Error(`Failed to load appointment patient ids: ${error.message}`);
  }

  const set = new Set<string>();
  for (const row of data || []) {
    if (row.patient_id) {
      set.add(row.patient_id);
    }
  }
  return Array.from(set);
}

async function loadExistingPatientIds(): Promise<Set<string>> {
  const { data, error } = await appointmentsSchema
    .from("patient_read_model")
    .select("patient_id");

  if (error) {
    throw new Error(
      `Failed to load existing patient_read_model ids: ${error.message}`,
    );
  }

  return new Set((data || []).map((row: any) => row.patient_id));
}

function transformPatient(row: PatientRow): PatientReadModelRow {
  const personal = row.personal_info || {};
  const contact = row.contact_info || {};
  const medical = row.basic_medical_info || {};

  return {
    patient_id: row.patient_id,
    tenant_id: "hospital-1",
    full_name: personal.fullName || "",
    phone: contact.phone || contact.primaryPhone || null,
    email: contact.email || null,
    date_of_birth: personal.dateOfBirth || null,
    gender: personal.gender || null,
    national_id: personal.nationalId || null,
    insurance_number: medical.insuranceNumber || null,
    insurance_type: medical.insuranceType || null,
    address: contact.address || null,
  };
}

async function backfillPatientReadModel(): Promise<number> {
  const appointmentPatientIds = await loadDistinctAppointmentPatientIds();
  const existing = await loadExistingPatientIds();

  const missing = appointmentPatientIds.filter(
    (patientId) => patientId && !existing.has(patientId),
  );

  if (missing.length === 0) {
    console.log("[Backfill] No missing patients detected.");
    return 0;
  }

  console.log(
    `[Backfill] Found ${missing.length} patients missing from patient_read_model.`,
  );

  const batches: PatientReadModelRow[] = [];
  for (const patientId of missing) {
    const { data, error } = await patientSchema
      .from("patients")
      .select("patient_id, personal_info, contact_info, basic_medical_info")
      .eq("patient_id", patientId)
      .maybeSingle();

    if (error) {
      console.error(
        `[Backfill] Failed to fetch patient ${patientId}: ${error.message}`,
      );
      continue;
    }

    if (!data) {
      console.warn(
        `[Backfill] Patient ${patientId} not found in patient_schema.patients`,
      );
      continue;
    }

    batches.push(transformPatient(data as PatientRow));
  }

  if (batches.length === 0) {
    console.log("[Backfill] No patients to insert.");
    return 0;
  }

  const { error: insertError } = await appointmentsSchema
    .from("patient_read_model")
    .upsert(batches, { onConflict: "patient_id" });

  if (insertError) {
    throw new Error(
      `Failed to upsert patient_read_model: ${insertError.message}`,
    );
  }

  console.log(`[Backfill] Upserted ${batches.length} patient_read_model rows.`);
  return batches.length;
}

async function updateAppointmentReadModel(): Promise<number> {
  const { data: rowsWithNull, error: nullError } = await appointmentsSchema
    .from("appointment_read_model")
    .select("appointment_id, patient_id")
    .is("patient_full_name", null);

  if (nullError) {
    throw new Error(
      `Failed to load appointment_read_model rows with null patient_full_name: ${nullError.message}`,
    );
  }

  const { data: rowsWithEmpty, error: emptyError } = await appointmentsSchema
    .from("appointment_read_model")
    .select("appointment_id, patient_id")
    .eq("patient_full_name", "");

  if (emptyError) {
    throw new Error(
      `Failed to load appointment_read_model rows with empty patient_full_name: ${emptyError.message}`,
    );
  }

  const affectedRows = [...(rowsWithNull || []), ...(rowsWithEmpty || [])];
  if (affectedRows.length === 0) {
    console.log("[Backfill] No appointment rows require patient info update.");
    return 0;
  }

  const patientIds = Array.from(
    new Set(affectedRows.map((row: any) => row.patient_id).filter(Boolean)),
  );

  if (patientIds.length === 0) {
    console.log(
      "[Backfill] No valid patient ids found in affected appointments.",
    );
    return 0;
  }

  const { data: patientData, error: patientError } = await appointmentsSchema
    .from("patient_read_model")
    .select(
      "patient_id, full_name, phone, email, date_of_birth, gender, national_id, insurance_number, insurance_type, address",
    )
    .in("patient_id", patientIds);

  if (patientError) {
    throw new Error(
      `Failed to load patient_read_model data for appointments: ${patientError.message}`,
    );
  }

  const patientMap = new Map(
    (patientData || []).map((row: any) => [row.patient_id, row]),
  );

  let updated = 0;
  for (const row of affectedRows) {
    const patient = patientMap.get(row.patient_id);
    if (!patient) continue;

    const { error: updateError } = await appointmentsSchema
      .from("appointment_read_model")
      .update({
        patient_full_name: patient.full_name,
        patient_phone: patient.phone,
        patient_email: patient.email,
        patient_date_of_birth: patient.date_of_birth,
        patient_gender: patient.gender,
        patient_national_id: patient.national_id,
        patient_insurance_number: patient.insurance_number,
        patient_insurance_type: patient.insurance_type,
        patient_address: patient.address,
      })
      .eq("appointment_id", row.appointment_id);

    if (updateError) {
      console.error(
        `[Backfill] Failed to update appointment ${row.appointment_id}: ${updateError.message}`,
      );
      continue;
    }

    updated++;
  }

  console.log(
    `[Backfill] Updated ${updated} appointment_read_model rows with patient data.`,
  );
  return updated;
}

async function cleanupOrphanedAppointmentReadModel(): Promise<number> {
  const { data: readRows, error: readError } = await appointmentsSchema
    .from("appointment_read_model")
    .select("appointment_id");

  if (readError) {
    throw new Error(
      `Failed to load appointment_read_model ids for cleanup: ${readError.message}`,
    );
  }

  const readIds = (readRows || [])
    .map((row: any) => row.appointment_id)
    .filter((id: string | null) => !!id);

  if (readIds.length === 0) {
    console.log("[Backfill] No appointment_read_model rows detected.");
    return 0;
  }

  const { data: appointmentRows, error: appError } = await appointmentsSchema
    .from("appointments")
    .select("appointment_id");

  if (appError) {
    throw new Error(
      `Failed to load appointments ids for cleanup: ${appError.message}`,
    );
  }

  const appointmentSet = new Set(
    (appointmentRows || []).map((row: any) => row.appointment_id),
  );

  const orphanIds = readIds.filter((id) => !appointmentSet.has(id));

  if (orphanIds.length === 0) {
    console.log("[Backfill] No orphaned appointment_read_model rows found.");
    return 0;
  }

  const chunkSize = 500;
  let deleted = 0;
  for (let i = 0; i < orphanIds.length; i += chunkSize) {
    const chunk = orphanIds.slice(i, i + chunkSize);
    const { error: deleteError } = await appointmentsSchema
      .from("appointment_read_model")
      .delete()
      .in("appointment_id", chunk);

    if (deleteError) {
      throw new Error(
        `Failed to delete orphaned appointment_read_model rows: ${deleteError.message}`,
      );
    }

    deleted += chunk.length;
  }

  console.log(
    `[Backfill] Deleted ${deleted} orphaned rows from appointment_read_model.`,
  );
  return deleted;
}

async function main(): Promise<void> {
  console.log("[Backfill] Starting patient read model backfill...");
  const inserted = await backfillPatientReadModel();
  console.log(
    `[Backfill] Patient read model backfill complete. Inserted ${inserted} rows.`,
  );

  console.log("[Backfill] Updating appointment_read_model patient data...");
  const updated = await updateAppointmentReadModel();
  console.log(
    `[Backfill] Appointment read model update complete. Updated ${updated} rows.`,
  );

  console.log("[Backfill] Cleaning up orphaned appointment_read_model rows...");
  const deleted = await cleanupOrphanedAppointmentReadModel();
  console.log(
    `[Backfill] Cleanup complete. Removed ${deleted} orphaned read model rows.`,
  );

  console.log("[Backfill] Done ");
}

main()
  .catch((error) => {
    console.error("[Backfill] Failed:", error);
    process.exit(1);
  })
  .finally(() => {
    supabase.auth.signOut();
  });
