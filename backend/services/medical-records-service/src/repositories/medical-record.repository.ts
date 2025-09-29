import { logger } from "@hospital/shared";
import { dbPool, supabaseAdmin } from "../config/database.config";
import {
  CreateEmbeddedPrescriptionRequest,
  CreateMedicalRecordRequest,
  EmbeddedPrescription,
  MedicalRecord,
  UpdateEmbeddedPrescriptionRequest,
  UpdateMedicalRecordRequest,
} from "../types/medical-record.types";

export class MedicalRecordRepository {
  private supabase = supabaseAdmin; // Legacy fallback
  private pool = dbPool; // Primary connection pool

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<MedicalRecord[]> {
    try {
      // Use Connection Pool with FHIR validation for healthcare compliance
      return await this.pool.executeFHIRValidation(async (client) => {
        const { data, error } = await client.rpc("get_all_medical_records", {
          limit_count: limit,
          offset_count: offset,
        });

        if (error) {
          logger.error("Database function error in findAll:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          return [];
        }

        return data.map(this.mapSupabaseRecordToMedicalRecord);
      });
    } catch (error) {
      logger.error("Connection pool error in findAll:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase.rpc(
          "get_all_medical_records",
          {
            limit_count: limit,
            offset_count: offset,
          }
        );

        if (fallbackError) {
          logger.error("Fallback error in findAll:", fallbackError);
          throw fallbackError;
        }

        if (!data || data.length === 0) {
          return [];
        }

        return data.map(this.mapSupabaseRecordToMedicalRecord);
      } catch (fallbackError) {
        logger.error(
          "Both pool and fallback failed in findAll:",
          fallbackError
        );
        throw fallbackError;
      }
    }
  }

  async findById(recordId: string): Promise<MedicalRecord | null> {
    try {
      // Use Connection Pool with FHIR validation for healthcare compliance
      return await this.pool.executeFHIRValidation(async (client) => {
        const { data, error } = await client
          .from("medical_records")
          .select("*")
          .eq("record_id", recordId)
          .eq("status", "active")
          .single();

        if (error) {
          if (error.code === "PGRST116") return null;
          throw error;
        }

        return this.mapSupabaseRecordToMedicalRecord(data);
      });
    } catch (error) {
      logger.error("Connection pool error in findById:", { error, recordId });

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase
          .from("medical_records")
          .select("*")
          .eq("record_id", recordId)
          .eq("status", "active")
          .single();

        if (fallbackError) {
          if (fallbackError.code === "PGRST116") return null;
          throw fallbackError;
        }

        return this.mapSupabaseRecordToMedicalRecord(data);
      } catch (fallbackError) {
        logger.error("Both pool and fallback failed in findById:", {
          fallbackError,
          recordId,
        });
        throw fallbackError;
      }
    }
  }

  async findByPatientId(patient_id: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("status", "active")
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error("Error fetching medical records by patient ID", {
        error,
        patient_id,
      });
      throw error;
    }
  }

  async findByDoctorId(doctor_id: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("*")
        .eq("doctor_id", doctor_id)
        .eq("status", "active")
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error("Error fetching medical records by doctor ID", {
        error,
        doctor_id,
      });
      throw error;
    }
  }

  async create(
    recordData: CreateMedicalRecordRequest,
    createdBy: string
  ): Promise<MedicalRecord> {
    try {
      // Use Connection Pool with Diagnosis Operation for medical record creation
      return await this.pool.executeDiagnosisOperation(async (client) => {
        const { data, error } = await client.rpc("create_medical_record", {
          record_data: {
            ...recordData,
            created_by: createdBy,
            updated_by: createdBy,
          },
        });

        if (error) {
          logger.error("Database function error in create:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error("Failed to create medical record - no data returned");
        }

        logger.info(
          "Medical record created successfully via connection pool:",
          {
            recordId: data[0].record_id,
          }
        );

        return this.mapSupabaseRecordToMedicalRecord(data[0]);
      });
    } catch (error) {
      logger.error("Connection pool error in create:", { error, recordData });

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase.rpc(
          "create_medical_record",
          {
            record_data: {
              ...recordData,
              created_by: createdBy,
              updated_by: createdBy,
            },
          }
        );

        if (fallbackError) {
          logger.error("Fallback error in create:", fallbackError);
          throw fallbackError;
        }

        if (!data || data.length === 0) {
          throw new Error("Failed to create medical record - no data returned");
        }

        logger.info("Medical record created successfully via fallback:", {
          recordId: data[0].record_id,
        });

        return this.mapSupabaseRecordToMedicalRecord(data[0]);
      } catch (fallbackError) {
        logger.error("Both pool and fallback failed in create:", {
          fallbackError,
          recordData,
        });
        throw fallbackError;
      }
    }
  }

  async update(
    recordId: string,
    recordData: UpdateMedicalRecordRequest,
    updatedBy: string
  ): Promise<MedicalRecord> {
    try {
      const { data, error } = await this.supabase.rpc("update_medical_record", {
        record_id: recordId,
        record_data: {
          ...recordData,
          updated_by: updatedBy,
        },
      });

      if (error) {
        logger.error("Database function error in update:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to update medical record - record not found");
      }

      logger.info(
        "Medical record updated successfully via database function:",
        {
          recordId,
          updatedFields: Object.keys(recordData),
        }
      );

      return this.mapSupabaseRecordToMedicalRecord(data[0]);
    } catch (error) {
      logger.error("Error updating medical record", {
        error,
        recordId,
        recordData,
      });
      throw error;
    }
  }

  async delete(recordId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("medical_records")
        .update({ status: "deleted" })
        .eq("record_id", recordId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error deleting medical record", { error, recordId });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error counting medical records", { error });
      throw error;
    }
  }

  // =============================
  // VITAL SIGNS METHODS (history)
  // =============================
  async insertVital(
    recordId: string,
    payload: import("../types/medical-record.types").CreateVitalSignsRequest,
    recordedBy: string
  ) {
    // Basic validation
    if (
      payload.temperature &&
      (payload.temperature < 34 || payload.temperature > 43)
    ) {
      throw new Error("Invalid temperature range (34-43°C)");
    }
    if (
      payload.oxygen_saturation &&
      (payload.oxygen_saturation < 0 || payload.oxygen_saturation > 100)
    ) {
      throw new Error("Invalid SpO2 range (0-100%)");
    }

    // Calculate BMI if possible
    let bmi: number | undefined = undefined;
    if (payload.weight && payload.height) {
      const h = payload.height / 100; // cm -> m
      if (h > 0) bmi = Number((payload.weight / (h * h)).toFixed(1));
    }

    const { error } = await this.supabase.from("vital_signs_history").insert({
      vital_id: `VIT-${Date.now().toString().slice(-8)}`,
      record_id: recordId,
      recorded_at: payload.recorded_at,
      recorded_by: recordedBy,
      temperature: payload.temperature,
      blood_pressure_systolic: payload.blood_pressure_systolic,
      blood_pressure_diastolic: payload.blood_pressure_diastolic,
      heart_rate: payload.heart_rate,
      respiratory_rate: payload.respiratory_rate,
      oxygen_saturation: payload.oxygen_saturation,
      weight: payload.weight,
      height: payload.height,
      bmi,
      notes: payload.notes,
    });

    if (error) throw error;

    // Optionally update basic_vitals snapshot in medical_records
    const bp =
      payload.blood_pressure_systolic && payload.blood_pressure_diastolic
        ? `${payload.blood_pressure_systolic}/${payload.blood_pressure_diastolic}`
        : undefined;

    const { error: updateError } = await this.supabase
      .from("medical_records")
      .update({
        basic_vitals: {
          temperature: payload.temperature,
          blood_pressure: bp,
          heart_rate: payload.heart_rate,
          weight: payload.weight,
          height: payload.height,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("record_id", recordId);

    if (updateError) throw updateError;
  }

  async listVitals(
    recordId: string,
    from?: string,
    to?: string
  ): Promise<import("../types/medical-record.types").VitalSignsHistory[]> {
    let query = this.supabase
      .from("vital_signs_history")
      .select("*")
      .eq("record_id", recordId)
      .order("recorded_at", { ascending: false });

    if (from) query = query.gte("recorded_at", from);
    if (to) query = query.lte("recorded_at", to);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  // =============================
  // LAB RESULTS METHODS
  // =============================
  async createLabResult(
    recordId: string,
    payload: import("../types/medical-record.types").CreateLabResultRequest
  ) {
    if (!payload.test_name || !payload.test_type || !payload.test_date) {
      throw new Error("Missing required lab fields");
    }
    if (
      payload.status &&
      !["pending", "completed", "cancelled"].includes(payload.status)
    ) {
      throw new Error("Invalid lab status");
    }

    const { error } = await this.supabase.from("lab_results").insert({
      result_id: `LAB-${Date.now().toString().slice(-8)}`,
      record_id: recordId,
      test_name: payload.test_name,
      test_type: payload.test_type,
      test_date: payload.test_date,
      result_value: payload.result_value,
      reference_range: payload.reference_range,
      unit: payload.unit,
      result_date: payload.result_date,
      lab_technician: payload.lab_technician,
      notes: payload.notes,
      status: payload.status || "pending",
    });

    if (error) throw error;
  }

  async updateLabResult(
    recordId: string,
    resultId: string,
    payload: Partial<
      import("../types/medical-record.types").CreateLabResultRequest
    >
  ) {
    if (
      payload.status &&
      !["pending", "completed", "cancelled"].includes(payload.status)
    ) {
      throw new Error("Invalid lab status");
    }

    const { error } = await this.supabase
      .from("lab_results")
      .update({
        test_name: payload.test_name,
        test_type: payload.test_type,
        test_date: payload.test_date,
        result_value: payload.result_value,
        reference_range: payload.reference_range,
        unit: payload.unit,
        result_date: payload.result_date,
        lab_technician: payload.lab_technician,
        notes: payload.notes,
        status: payload.status,
      })
      .eq("record_id", recordId)
      .eq("result_id", resultId);

    if (error) throw error;
  }

  async listLabResultsByRecord(recordId: string) {
    const { data, error } = await this.supabase
      .from("lab_results")
      .select("*")
      .eq("record_id", recordId)
      .order("test_date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async listLabResultsByPatient(patientId: string) {
    const { data, error } = await this.supabase
      .from("lab_results")
      .select("lab_results:* , medical_records!inner(patient_id)")
      .eq("medical_records.patient_id", patientId)
      .order("test_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({ ...row }));
  }

  // =============================
  // MEDICAL HISTORY TIMELINE
  // =============================
  async getPatientHistory(
    patientId: string,
    from?: string,
    to?: string,
    type?: "records" | "vitals" | "labs" | "all"
  ) {
    const results: any[] = [];

    if (!type || type === "records" || type === "all") {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("record_id, visit_date, diagnosis, treatment, notes")
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      (data || []).forEach((r: any) =>
        results.push({ kind: "record", at: r.visit_date, ...r })
      );
    }

    if (!type || type === "vitals" || type === "all") {
      let q = this.supabase
        .from("vital_signs_history")
        .select("* , medical_records!inner(patient_id)")
        .eq("medical_records.patient_id", patientId)
        .order("recorded_at", { ascending: false });
      if (from) q = q.gte("recorded_at", from);
      if (to) q = q.lte("recorded_at", to);
      const { data, error } = await q;
      if (error) throw error;
      (data || []).forEach((v: any) =>
        results.push({ kind: "vital", at: v.recorded_at, ...v })
      );
    }

    if (!type || type === "labs" || type === "all") {
      let q = this.supabase
        .from("lab_results")
        .select("* , medical_records!inner(patient_id)")
        .eq("medical_records.patient_id", patientId)
        .order("test_date", { ascending: false });
      if (from) q = q.gte("test_date", from);
      if (to) q = q.lte("test_date", to);
      const { data, error } = await q;
      if (error) throw error;
      (data || []).forEach((l: any) =>
        results.push({ kind: "lab", at: l.test_date, ...l })
      );
    }

    // Sort combined results by time desc
    results.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return results;
  }

  // REMOVED: Lab Results methods - lab results now stored as simple text in medical records

  // REMOVED: Vital Signs methods - vital signs now embedded as BasicVitalSigns in medical records
  // REMOVED: calculateBMI method - no longer needed in simplified system

  // ============================================
  // PRESCRIPTION METHODS (Merged from Prescription Service)
  // ============================================

  async createPrescriptionForRecord(
    recordId: string,
    prescriptionData: CreateEmbeddedPrescriptionRequest,
    createdBy: string
  ): Promise<EmbeddedPrescription> {
    try {
      // Generate prescription ID
      const prescriptionId = `PRES-${Date.now().toString().slice(-6)}`;

      // Calculate total cost
      let totalCost = 0;
      const medications = prescriptionData.medications.map((med) => {
        const itemCost = (med.cost_per_unit || 0) * med.quantity;
        totalCost += itemCost;
        return {
          ...med,
          total_cost: itemCost,
        };
      });

      const prescription: EmbeddedPrescription = {
        prescription_id: prescriptionId,
        prescription_date: new Date(prescriptionData.prescription_date),
        status: "active",
        medications,
        notes: prescriptionData.notes,
        total_cost: totalCost,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Get current medical record
      const currentRecord = await this.findById(recordId);
      if (!currentRecord) {
        throw new Error("Medical record not found");
      }

      // Add prescription to existing prescriptions array
      const updatedPrescriptions = [
        ...(currentRecord.prescriptions || []),
        prescription,
      ];

      // Update medical record with new prescription
      const { error } = await this.supabase
        .from("medical_records")
        .update({
          prescriptions: updatedPrescriptions,
          updated_at: new Date().toISOString(),
        })
        .eq("record_id", recordId);

      if (error) throw error;
      return prescription;
    } catch (error) {
      logger.error("Error creating prescription for record", {
        error,
        recordId,
        prescriptionData,
      });
      throw error;
    }
  }

  async updatePrescriptionInRecord(
    recordId: string,
    prescriptionId: string,
    updateData: UpdateEmbeddedPrescriptionRequest
  ): Promise<EmbeddedPrescription> {
    try {
      // Get current medical record
      const currentRecord = await this.findById(recordId);
      if (!currentRecord) {
        throw new Error("Medical record not found");
      }

      // Find and update the prescription
      const prescriptions = currentRecord.prescriptions || [];
      const prescriptionIndex = prescriptions.findIndex(
        (p: EmbeddedPrescription) => p.prescription_id === prescriptionId
      );

      if (prescriptionIndex === -1) {
        throw new Error("Prescription not found");
      }

      // Update prescription
      const updatedPrescription = {
        ...prescriptions[prescriptionIndex],
        ...updateData,
        updated_at: new Date(),
      };

      // Recalculate total cost if medications updated
      if (updateData.medications) {
        let totalCost = 0;
        const medications = updateData.medications.map((med) => {
          const itemCost = (med.cost_per_unit || 0) * med.quantity;
          totalCost += itemCost;
          return {
            ...med,
            total_cost: itemCost,
          };
        });
        updatedPrescription.medications = medications;
        updatedPrescription.total_cost = totalCost;
      }

      prescriptions[prescriptionIndex] = updatedPrescription;

      // Update medical record
      const { error } = await this.supabase
        .from("medical_records")
        .update({
          prescriptions,
          updated_at: new Date().toISOString(),
        })
        .eq("record_id", recordId);

      if (error) throw error;
      return updatedPrescription;
    } catch (error) {
      logger.error("Error updating prescription in record", {
        error,
        recordId,
        prescriptionId,
      });
      throw error;
    }
  }

  async getPrescriptionsByPatientId(
    patient_id: string
  ): Promise<EmbeddedPrescription[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("prescriptions")
        .eq("patient_id", patient_id)
        .not("prescriptions", "is", null);

      if (error) throw error;

      // Flatten all prescriptions from all medical records
      const allPrescriptions: EmbeddedPrescription[] = [];
      data?.forEach((record) => {
        if (record.prescriptions) {
          allPrescriptions.push(...record.prescriptions);
        }
      });

      return allPrescriptions.sort(
        (a, b) =>
          new Date(b.prescription_date).getTime() -
          new Date(a.prescription_date).getTime()
      );
    } catch (error) {
      logger.error("Error fetching prescriptions by patient ID", {
        error,
        patient_id,
      });
      throw error;
    }
  }

  async getPrescriptionsByDoctorId(
    doctor_id: string
  ): Promise<EmbeddedPrescription[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("prescriptions")
        .eq("doctor_id", doctor_id)
        .not("prescriptions", "is", null);

      if (error) throw error;

      // Flatten all prescriptions from all medical records
      const allPrescriptions: EmbeddedPrescription[] = [];
      data?.forEach((record) => {
        if (record.prescriptions) {
          allPrescriptions.push(...record.prescriptions);
        }
      });

      return allPrescriptions.sort(
        (a, b) =>
          new Date(b.prescription_date).getTime() -
          new Date(a.prescription_date).getTime()
      );
    } catch (error) {
      logger.error("Error fetching prescriptions by doctor ID", {
        error,
        doctor_id,
      });
      throw error;
    }
  }

  private mapSupabaseRecordToMedicalRecord(supabaseRecord: any): MedicalRecord {
    return {
      record_id: supabaseRecord.record_id,
      patient_id: supabaseRecord.patient_id,
      doctor_id: supabaseRecord.doctor_id,
      appointment_id: supabaseRecord.appointment_id,
      visit_date: new Date(supabaseRecord.visit_date),
      // Map simplified fields
      symptoms: supabaseRecord.symptoms,
      examination_notes: supabaseRecord.examination_notes,
      diagnosis: supabaseRecord.diagnosis,
      treatment: supabaseRecord.treatment,
      medications: supabaseRecord.medications,
      notes: supabaseRecord.notes,
      basic_vitals: supabaseRecord.basic_vitals,
      // MERGED: Map prescriptions data
      prescriptions: supabaseRecord.prescriptions || [],
      status: supabaseRecord.status,
      created_at: new Date(supabaseRecord.created_at),
      updated_at: new Date(supabaseRecord.updated_at),
      created_by: supabaseRecord.created_by,
      updated_by: supabaseRecord.updated_by,
    };
  }
}
