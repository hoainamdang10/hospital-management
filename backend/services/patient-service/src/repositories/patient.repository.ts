import logger from "@hospital/shared/dist/utils/logger";
import { dbPool, supabaseAdmin } from "../config/database.config";
import {
  CreatePatientDto,
  Patient,
  PatientSearchFilters,
  PatientWithProfile,
  UpdatePatientDto,
} from "../types/patient.types";

export class PatientRepository {
  private supabase = supabaseAdmin; // Legacy fallback
  private pool = dbPool; // Primary connection pool

  // Remove local ID generation - now handled by database functions
  // Calculate age from date of birth (kept for backward compatibility)
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // Get all patients with optional filters and pagination
  async getAllPatients(
    filters: PatientSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ patients: PatientWithProfile[]; total: number }> {
    const offset = (page - 1) * limit;

    try {
      // Use Connection Pool for healthcare-specific FHIR validation
      return await this.pool.executeFHIRValidation(async (client) => {
        const { data, error } = await client.rpc("get_all_patients", {
          search_filters: {
            search: filters.search || null,
            gender: filters.gender || null,
            status: filters.status || null,
            blood_type: filters.blood_type || null,
            age_min: filters.age_min || null,
            age_max: filters.age_max || null,
            created_after: filters.created_after || null,
            created_before: filters.created_before || null,
          },
          limit_count: limit,
          offset_count: offset,
        });

        if (error) {
          logger.error("Database function error in getAllPatients:", error);
          throw error; // Let pool handle retry logic
        }

        if (!data || data.length === 0) {
          return { patients: [], total: 0 };
        }

        // Database function returns array with single object containing patients and total
        const result = data[0];
        if (!result || !result.patients) {
          return { patients: [], total: 0 };
        }

        return {
          patients: result.patients as PatientWithProfile[],
          total: result.total || 0,
        };
      });
    } catch (error) {
      logger.error("Connection pool error in getAllPatients:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase.rpc(
          "get_all_patients",
          {
            search_filters: {
              search: filters.search || null,
              gender: filters.gender || null,
              status: filters.status || null,
              blood_type: filters.blood_type || null,
              age_min: filters.age_min || null,
              age_max: filters.age_max || null,
              created_after: filters.created_after || null,
              created_before: filters.created_before || null,
            },
            limit_count: limit,
            offset_count: offset,
          }
        );

        if (fallbackError) {
          return this.getAllPatientsDirectQuery(filters, page, limit);
        }

        if (!data || data.length === 0) {
          return { patients: [], total: 0 };
        }

        const result = data[0];
        return {
          patients: result.patients as PatientWithProfile[],
          total: result.total || 0,
        };
      } catch (fallbackError) {
        logger.error("Fallback also failed in getAllPatients:", fallbackError);
        return this.getAllPatientsDirectQuery(filters, page, limit);
      }
    }
  }

  // FALLBACK: Direct query method (like Doctor Service)
  private async getAllPatientsDirectQuery(
    filters: PatientSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ patients: PatientWithProfile[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      let query = this.supabase.from("patients").select(
        `
          *,
          profiles!inner (
            id,
            email,
            full_name,
            date_of_birth,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `,
        { count: "exact" }
      );

      // Apply filters
      if (filters.gender) {
        query = query.eq("gender", filters.gender);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.blood_type) {
        query = query.eq("blood_type", filters.blood_type);
      }
      if (filters.search) {
        query = query.ilike("profiles.full_name", `%${filters.search}%`);
      }

      // Apply pagination and ordering
      query = query
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error("Direct query error in getAllPatientsDirectQuery:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { patients: [], total: count || 0 };
      }

      // Transform data to match PatientWithProfile interface
      const transformedPatients = data.map((patient: any) => ({
        ...patient,
        profile: patient.profiles, // Direct assignment from inner join
      }));

      return {
        patients: transformedPatients as PatientWithProfile[],
        total: count || 0,
      };
    } catch (error) {
      logger.error("Exception in getAllPatientsDirectQuery:", error);
      throw error;
    }
  }

  // Get patient by ID
  async getPatientById(patient_id: string): Promise<PatientWithProfile | null> {
    try {
      // Use Connection Pool for healthcare-specific FHIR validation
      return await this.pool.executeFHIRValidation(async (client) => {
        const { data, error } = await client.rpc("get_patient_by_id", {
          input_patient_id: patient_id,
        });

        if (error) {
          logger.error("Database function error in getPatientById:", error);
          throw error; // Let pool handle retry
        }

        if (!data || data.length === 0) {
          return null;
        }

        return data[0] as PatientWithProfile;
      });
    } catch (error) {
      logger.error("Connection pool error in getPatientById:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase.rpc(
          "get_patient_by_id",
          {
            input_patient_id: patient_id,
          }
        );

        if (fallbackError) {
          logger.error("Fallback error in getPatientById:", fallbackError);
          return null;
        }

        if (!data || data.length === 0) {
          return null;
        }

        return data[0] as PatientWithProfile;
      } catch (fallbackError) {
        logger.error(
          "Both pool and fallback failed in getPatientById:",
          fallbackError
        );
        return null;
      }
    }
  }

  // Get patient by profile ID
  async getPatientByProfileId(
    profileId: string
  ): Promise<PatientWithProfile | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_patient_by_profile_id",
        { input_profile_id: profileId }
      );

      if (error) {
        logger.error(
          "Database function error in getPatientByProfileId:",
          error
        );
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as PatientWithProfile;
    } catch (error) {
      logger.error("Exception in getPatientByProfileId:", error);
      throw error;
    }
  }

  // Get patients by doctor ID (through appointments)
  async getPatientsByDoctorId(
    doctor_id: string
  ): Promise<PatientWithProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .select(
          `
          patient_id,
          patients!appointments_patient_id_fkey (
            *,
            profile:profiles!patients_profile_id_fkey (
              id,
              email,
              full_name,
              date_of_birth,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          )
        `
        )
        .eq("doctor_id", doctor_id);

      if (error) {
        logger.error("Error fetching patients by doctor ID:", error);
        throw new Error(`Failed to fetch patients: ${error.message}`);
      }

      // Extract unique patients
      const uniquePatients = new Map();
      data?.forEach((appointment: any) => {
        if (appointment.patients && appointment.patients.patient_id) {
          uniquePatients.set(
            appointment.patients.patient_id,
            appointment.patients
          );
        }
      });

      return Array.from(uniquePatients.values()) as PatientWithProfile[];
    } catch (error) {
      logger.error("Exception in getPatientsByDoctorId:", error);
      throw error;
    }
  }

  // Verify if profile exists
  async verifyProfileExists(profileId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        logger.error("Error verifying profile existence:", error);
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error("Exception in verifyProfileExists:", error);
      return false;
    }
  }

  // Create new patient
  async createPatient(patientData: CreatePatientDto): Promise<Patient> {
    try {
      // Use Connection Pool for healthcare-specific FHIR validation
      return await this.pool.executeFHIRValidation(async (client) => {
        const { data, error } = await client.rpc("create_patient", {
          patient_data: {
            ...patientData,
            status: "active",
          },
        });

        if (error) {
          logger.error("Database function error in createPatient:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error("Failed to create patient - no data returned");
        }

        logger.info("Patient created successfully via connection pool:", {
          patient_id: data[0].patient_id,
        });

        return data[0] as Patient;
      });
    } catch (error) {
      logger.error("Connection pool error in createPatient:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase.rpc(
          "create_patient",
          {
            patient_data: {
              ...patientData,
              status: "active",
            },
          }
        );

        if (fallbackError) {
          logger.error("Fallback error in createPatient:", fallbackError);
          throw fallbackError;
        }

        if (!data || data.length === 0) {
          throw new Error("Failed to create patient - no data returned");
        }

        logger.info("Patient created successfully via fallback:", {
          patient_id: data[0].patient_id,
        });

        return data[0] as Patient;
      } catch (fallbackError) {
        logger.error(
          "Both pool and fallback failed in createPatient:",
          fallbackError
        );
        throw fallbackError;
      }
    }
  }

  // Update patient
  async updatePatient(
    patient_id: string,
    updateData: UpdatePatientDto
  ): Promise<Patient> {
    try {
      const { data, error } = await this.supabase.rpc("update_patient", {
        input_patient_id: patient_id,
        patient_data: updateData,
      });

      if (error) {
        logger.error("Database function error in updatePatient:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to update patient - patient not found");
      }

      logger.info("Patient updated successfully via database function:", {
        patient_id,
        updatedFields: Object.keys(updateData),
      });

      return data[0] as Patient;
    } catch (error) {
      logger.error("Exception in updatePatient:", error);
      throw error;
    }
  }

  // Delete patient (soft delete by setting status to inactive)
  async deletePatient(patient_id: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc("delete_patient", {
        input_patient_id: patient_id,
      });

      if (error) {
        logger.error("Database function error in deletePatient:", error);
        throw error;
      }

      logger.info("Patient deleted successfully via database function:", {
        patient_id,
      });
      return data === true;
    } catch (error) {
      logger.error("Exception in deletePatient:", error);
      throw error;
    }
  }

  // Check if patient exists (only active patients)
  async patientExists(patient_id: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("patients")
        .select("patient_id")
        .eq("patient_id", patient_id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") {
        logger.error("Error checking patient existence:", error);
        throw new Error(`Failed to check patient existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      logger.error("Exception in patientExists:", error);
      throw error;
    }
  }

  // Get patient statistics
  async getPatientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byGender: { male: number; female: number; other: number };
    byBloodType: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("patients")
        .select("status, gender, blood_type");

      if (error) {
        logger.error("Error fetching patient stats:", error);
        throw new Error(`Failed to fetch patient stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        active: 0,
        inactive: 0,
        byGender: { male: 0, female: 0, other: 0 },
        byBloodType: {} as Record<string, number>,
      };

      data?.forEach((patient) => {
        // Count by status
        if (patient.status === "active") stats.active++;
        else stats.inactive++;

        // Count by gender
        if (patient.gender in stats.byGender) {
          stats.byGender[patient.gender as keyof typeof stats.byGender]++;
        }

        // Count by blood type
        if (patient.blood_type) {
          stats.byBloodType[patient.blood_type] =
            (stats.byBloodType[patient.blood_type] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Exception in getPatientStats:", error);
      throw error;
    }
  }

  // ENHANCED: Search patients by multiple criteria
  async searchPatients(
    searchTerm: string,
    limit: number = 10
  ): Promise<PatientWithProfile[]> {
    try {
      // Use Connection Pool for high-frequency search operations
      return await this.pool.executeQuery(async (client) => {
        const { data, error } = await client
          .from("patients")
          .select(
            `
            *,
            profiles!inner (
              id,
              email,
              full_name,
              date_of_birth,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          `
          )
          .or(
            `profiles.full_name.ilike.%${searchTerm}%,profiles.phone_number.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`
          )
          .eq("status", "active")
          .limit(limit);

        if (error) {
          logger.error("Error searching patients:", error);
          throw new Error(`Failed to search patients: ${error.message}`);
        }

        return (
          (data?.map((patient: any) => ({
            ...patient,
            profile: patient.profiles,
          })) as PatientWithProfile[]) || []
        );
      });
    } catch (error) {
      logger.error("Connection pool error in searchPatients:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase
          .from("patients")
          .select(
            `
            *,
            profiles!inner (
              id,
              email,
              full_name,
              date_of_birth,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          `
          )
          .or(
            `profiles.full_name.ilike.%${searchTerm}%,profiles.phone_number.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`
          )
          .eq("status", "active")
          .limit(limit);

        if (fallbackError) {
          logger.error("Fallback error in searchPatients:", fallbackError);
          throw new Error(
            `Failed to search patients: ${fallbackError.message}`
          );
        }

        return (
          (data?.map((patient: any) => ({
            ...patient,
            profile: patient.profiles,
          })) as PatientWithProfile[]) || []
        );
      } catch (fallbackError) {
        logger.error(
          "Both pool and fallback failed in searchPatients:",
          fallbackError
        );
        throw fallbackError;
      }
    }
  }

  // ENHANCED: Get patients with upcoming appointments
  async getPatientsWithUpcomingAppointments(): Promise<PatientWithProfile[]> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await this.supabase
        .from("appointments")
        .select(
          `
          patient_id,
          appointment_date,
          patients!inner (
            *,
            profiles!inner (
              id,
              email,
              full_name,
              date_of_birth,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          )
        `
        )
        .gte("appointment_date", today)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true });

      if (error) {
        logger.error(
          "Error fetching patients with upcoming appointments:",
          error
        );
        throw new Error(
          `Failed to fetch patients with upcoming appointments: ${error.message}`
        );
      }

      // Extract unique patients
      const uniquePatients = new Map();
      data?.forEach((appointment: any) => {
        if (appointment.patients && appointment.patients.patient_id) {
          const patient = {
            ...appointment.patients,
            profile: appointment.patients.profiles,
          };
          uniquePatients.set(appointment.patients.patient_id, patient);
        }
      });

      return Array.from(uniquePatients.values()) as PatientWithProfile[];
    } catch (error) {
      logger.error("Exception in getPatientsWithUpcomingAppointments:", error);
      throw error;
    }
  }

  // ENHANCED: Get patient medical summary
  async getPatientMedicalSummary(patient_id: string): Promise<{
    patient: PatientWithProfile | null;
    appointmentCount: number;
    lastAppointment: string | null;
    medicalHistory: string[];
    allergies: string[];
    currentMedications: any;
  }> {
    try {
      // Get patient details
      const patient = await this.getPatientById(patient_id);

      if (!patient) {
        return {
          patient: null,
          appointmentCount: 0,
          lastAppointment: null,
          medicalHistory: [],
          allergies: [],
          currentMedications: {},
        };
      }

      // Get appointment count and last appointment
      const { data: appointments, error: appointmentError } =
        await this.supabase
          .from("appointments")
          .select("appointment_date, status")
          .eq("patient_id", patient_id)
          .order("appointment_date", { ascending: false });

      if (appointmentError) {
        logger.error("Error fetching patient appointments:", appointmentError);
      }

      const appointmentCount = appointments?.length || 0;
      const lastAppointment = appointments?.[0]?.appointment_date || null;

      return {
        patient,
        appointmentCount,
        lastAppointment,
        medicalHistory: Array.isArray(patient.medical_history)
          ? patient.medical_history
          : patient.medical_history
            ? [patient.medical_history]
            : [],
        allergies: patient.allergies || [],
        currentMedications: patient.current_medications || {},
      };
    } catch (error) {
      logger.error("Exception in getPatientMedicalSummary:", error);
      throw error;
    }
  }

  // Get unique patient count for a specific doctor (through appointments)
  async getPatientCountForDoctor(doctor_id: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .select("patient_id")
        .eq("doctor_id", doctor_id);

      if (error) {
        logger.error("Error fetching patient count for doctor:", error);
        throw error;
      }

      // Get unique patient IDs
      const uniquePatients = [
        ...new Set((data || []).map((a) => a.patient_id)),
      ];

      return uniquePatients.length;
    } catch (error) {
      logger.error("Exception in getPatientCountForDoctor:", error);
      throw error;
    }
  }

  // Get comprehensive patient statistics for a specific doctor
  async getPatientStatsForDoctor(doctor_id: string): Promise<any> {
    try {
      logger.info(`Getting patient statistics for doctor: ${doctor_id}`);

      // Get all appointments for this doctor with patient details
      const { data: appointments, error: appointmentsError } =
        await this.supabase
          .from("appointments")
          .select(
            `
          appointment_id,
          patient_id,
          appointment_date,
          status,
          created_at,
          patients!inner (
            patient_id,
            gender,
            created_at,
            profile:profiles!patients_profile_id_fkey (
              full_name,
              date_of_birth
            )
          )
        `
          )
          .eq("doctor_id", doctor_id);

      if (appointmentsError) {
        logger.error(
          "Error fetching appointments for patient stats:",
          appointmentsError
        );
        throw appointmentsError;
      }

      const appointmentList = appointments || [];

      // Calculate unique patients
      const uniquePatientIds = [
        ...new Set(appointmentList.map((a) => a.patient_id)),
      ];
      const totalUniquePatients = uniquePatientIds.length;

      // Calculate new vs returning patients
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentAppointments = appointmentList.filter(
        (a) => new Date(a.appointment_date) >= thirtyDaysAgo
      );

      const recentPatientIds = [
        ...new Set(recentAppointments.map((a) => a.patient_id)),
      ];

      // Determine new vs returning patients (patients with first appointment in last 30 days)
      const newPatients = [];
      const returningPatients = [];

      for (const patient_id of recentPatientIds) {
        const patientAppointments = appointmentList
          .filter((a) => a.patient_id === patient_id)
          .sort(
            (a, b) =>
              new Date(a.appointment_date).getTime() -
              new Date(b.appointment_date).getTime()
          );

        if (patientAppointments.length > 0) {
          const firstAppointment = patientAppointments[0];
          if (new Date(firstAppointment.appointment_date) >= thirtyDaysAgo) {
            newPatients.push(patient_id);
          } else {
            returningPatients.push(patient_id);
          }
        }
      }

      // Calculate demographics
      const demographics = {
        gender: { male: 0, female: 0, other: 0 },
        age_groups: {
          "0-18": 0,
          "19-35": 0,
          "36-50": 0,
          "51-65": 0,
          "65+": 0,
        },
      };

      // Process unique patients for demographics
      const uniquePatients = appointmentList
        .filter(
          (appointment, index, self) =>
            index ===
            self.findIndex((a) => a.patient_id === appointment.patient_id)
        )
        .map((a) => a.patients);

      uniquePatients.forEach((patient: any) => {
        // Gender demographics (from patients table)
        const gender = patient.gender?.toLowerCase();
        if (gender === "male" || gender === "nam") {
          demographics.gender.male++;
        } else if (gender === "female" || gender === "nữ") {
          demographics.gender.female++;
        } else {
          demographics.gender.other++;
        }

        // Age demographics (from profiles table)
        if (patient.profile && patient.profile.date_of_birth) {
          const birthDate = new Date(patient.profile.date_of_birth);
          const age = Math.floor(
            (now.getTime() - birthDate.getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          );

          if (age <= 18) {
            demographics.age_groups["0-18"]++;
          } else if (age <= 35) {
            demographics.age_groups["19-35"]++;
          } else if (age <= 50) {
            demographics.age_groups["36-50"]++;
          } else if (age <= 65) {
            demographics.age_groups["51-65"]++;
          } else {
            demographics.age_groups["65+"]++;
          }
        }
      });

      // Calculate appointment statistics
      const completedAppointments = appointmentList.filter(
        (a) => a.status === "completed"
      ).length;
      const totalAppointments = appointmentList.length;
      const averageAppointmentsPerPatient =
        totalUniquePatients > 0
          ? Math.round((totalAppointments / totalUniquePatients) * 10) / 10
          : 0;

      const stats = {
        total_unique_patients: totalUniquePatients,
        new_patients_last_30_days: newPatients.length,
        returning_patients_last_30_days: returningPatients.length,
        new_vs_returning_ratio: {
          new_percentage:
            recentPatientIds.length > 0
              ? Math.round((newPatients.length / recentPatientIds.length) * 100)
              : 0,
          returning_percentage:
            recentPatientIds.length > 0
              ? Math.round(
                  (returningPatients.length / recentPatientIds.length) * 100
                )
              : 0,
        },
        demographics,
        appointment_statistics: {
          total_appointments: totalAppointments,
          completed_appointments: completedAppointments,
          average_appointments_per_patient: averageAppointmentsPerPatient,
          completion_rate:
            totalAppointments > 0
              ? Math.round((completedAppointments / totalAppointments) * 100)
              : 0,
        },
        period: {
          from: thirtyDaysAgo.toISOString().split("T")[0],
          to: now.toISOString().split("T")[0],
        },
      };

      logger.info(`Patient statistics calculated for doctor ${doctor_id}:`, {
        totalPatients: totalUniquePatients,
        newPatients: newPatients.length,
        returningPatients: returningPatients.length,
      });

      return stats;
    } catch (error) {
      logger.error("Exception in getPatientStatsForDoctor:", error);
      throw error;
    }
  }
}
