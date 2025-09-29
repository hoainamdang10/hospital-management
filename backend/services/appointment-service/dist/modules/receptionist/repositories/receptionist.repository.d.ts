import { CheckInData, DashboardStats, PaginatedResponse, PatientCheckIn, PatientSearchCriteria, PatientSearchResult, QueueItem, QueueStatus, Receptionist } from "../types/receptionist.types";
export declare class ReceptionistRepository {
    findById(receptionistId: string): Promise<Receptionist | null>;
    findByProfileId(profileId: string): Promise<Receptionist | null>;
    updateShiftSchedule(receptionistId: string, shiftSchedule: any): Promise<boolean>;
    createCheckIn(checkInData: CheckInData): Promise<PatientCheckIn>;
    updateCheckInStatus(checkInId: string, status: string): Promise<boolean>;
    getQueue(date?: string): Promise<QueueItem[]>;
    getQueueStatus(date?: string): Promise<QueueStatus>;
    callNextPatient(doctorId: string, roomNumber?: string): Promise<QueueItem | null>;
    updateAppointmentStatus(appointmentId: string, status: string): Promise<boolean>;
    updateAppointmentNotes(appointmentId: string, notes: string, insuranceVerified?: boolean): Promise<boolean>;
    searchPatients(criteria: PatientSearchCriteria): Promise<PaginatedResponse<PatientSearchResult>>;
    getDashboardStats(): Promise<DashboardStats | null>;
    private calculateEstimatedWaitTime;
    private calculateBusiestHour;
}
//# sourceMappingURL=receptionist.repository.d.ts.map