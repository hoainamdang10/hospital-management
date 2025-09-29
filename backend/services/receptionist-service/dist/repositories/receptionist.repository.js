"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceptionistRepository = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const database_config_1 = require("../config/database.config");
class ReceptionistRepository {
    constructor() {
        this.pool = database_config_1.dbPool;
        this.supabase = database_config_1.supabaseAdmin;
    }
    async findById(receptionistId) {
        try {
            return await this.pool.executeQuery(async (client) => {
                const { data, error } = await client
                    .from("receptionist")
                    .select("*")
                    .eq("receptionist_id", receptionistId)
                    .single();
                if (error) {
                    logger_1.default.error("Error finding receptionist by ID:", error);
                    return null;
                }
                return data;
            });
        }
        catch (error) {
            logger_1.default.error("Connection pool error in findById:", error);
            try {
                const { data, error: fallbackError } = await this.supabase
                    .from("receptionist")
                    .select("*")
                    .eq("receptionist_id", receptionistId)
                    .single();
                if (fallbackError) {
                    logger_1.default.error("Fallback error in findById:", fallbackError);
                    return null;
                }
                return data;
            }
            catch (fallbackError) {
                logger_1.default.error("Both pool and fallback failed in findById:", fallbackError);
                return null;
            }
        }
    }
    async findByProfileId(profileId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from("receptionist")
                .select("*")
                .eq("profile_id", profileId)
                .single();
            if (error) {
                logger_1.default.error("Error finding receptionist by profile ID:", error);
                return null;
            }
            return data;
        }
        catch (error) {
            logger_1.default.error("Repository error in findByProfileId:", error);
            return null;
        }
    }
    async updateShiftSchedule(receptionistId, schedule) {
        try {
            const { error } = await database_config_1.supabaseAdmin
                .from("receptionist")
                .update({
                shift_schedule: schedule,
                updated_at: new Date().toISOString(),
            })
                .eq("receptionist_id", receptionistId);
            if (error) {
                logger_1.default.error("Error updating shift schedule:", error);
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.default.error("Repository error in updateShiftSchedule:", error);
            return false;
        }
    }
    async createCheckIn(checkInData) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from("patient_check_ins")
                .insert({
                patient_id: checkInData.patient_id,
                appointment_id: checkInData.appointment_id,
                receptionist_id: checkInData.receptionist_id,
                check_in_time: checkInData.check_in_time,
                insurance_verified: checkInData.insurance_verified,
                documents_complete: checkInData.documents_complete,
                notes: checkInData.notes,
                status: checkInData.status,
            })
                .select()
                .single();
            if (error) {
                logger_1.default.error("Error creating check-in:", error);
                throw error;
            }
            return data;
        }
        catch (error) {
            logger_1.default.error("Repository error in createCheckIn:", error);
            throw error;
        }
    }
    async getQueue() {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from("appointments")
                .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          status,
          patients:patient_id (
            patient_id,
            profiles:profile_id (
              full_name
            )
          ),
          doctors:doctor_id (
            doctor_id,
            profiles:profile_id (
              full_name
            )
          ),
          patient_check_ins (
            check_in_time,
            status
          )
        `)
                .eq("appointment_date", new Date().toISOString().split("T")[0])
                .in("status", ["scheduled", "checked_in", "in_progress"])
                .order("appointment_time", { ascending: true });
            if (error) {
                logger_1.default.error("Error getting queue:", error);
                return [];
            }
            const queueItems = data.map((appointment, index) => ({
                id: appointment.appointment_id,
                patient_id: appointment.patient_id,
                appointment_id: appointment.appointment_id,
                patient_name: appointment.patients?.profiles?.full_name || "Unknown",
                doctor_name: appointment.doctors?.profiles?.full_name || "Unknown",
                appointment_time: appointment.appointment_time,
                status: appointment.status,
                check_in_time: appointment.patient_check_ins?.[0]?.check_in_time,
                queue_number: index + 1,
                estimated_wait_time: index * 15,
            }));
            return queueItems;
        }
        catch (error) {
            logger_1.default.error("Repository error in getQueue:", error);
            return [];
        }
    }
    async getDashboardStats() {
        try {
            const today = new Date().toISOString().split("T")[0];
            const { data: appointments, error: appointmentsError } = await database_config_1.supabaseAdmin
                .from("appointments")
                .select("*")
                .eq("appointment_date", today);
            const { data: checkIns, error: checkInsError } = await database_config_1.supabaseAdmin
                .from("patient_check_ins")
                .select("*")
                .gte("check_in_time", `${today}T00:00:00`)
                .lt("check_in_time", `${today}T23:59:59`);
            if (appointmentsError || checkInsError) {
                logger_1.default.error("Error getting dashboard stats:", {
                    appointmentsError,
                    checkInsError,
                });
                return null;
            }
            const stats = {
                todayAppointments: appointments?.length || 0,
                checkedInPatients: checkIns?.length || 0,
                pendingCheckIns: appointments?.filter((a) => a.status === "scheduled").length || 0,
                completedAppointments: appointments?.filter((a) => a.status === "completed").length || 0,
                averageWaitTime: 15,
                totalRevenue: 0,
            };
            return stats;
        }
        catch (error) {
            logger_1.default.error("Repository error in getDashboardStats:", error);
            return null;
        }
    }
}
exports.ReceptionistRepository = ReceptionistRepository;
//# sourceMappingURL=receptionist.repository.js.map