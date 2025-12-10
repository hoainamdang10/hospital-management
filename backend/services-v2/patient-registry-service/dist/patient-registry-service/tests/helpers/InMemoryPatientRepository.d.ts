import { IPatientRepository } from "../../src/domain/repositories/IPatientRepository";
import { Patient } from "../../src/domain/aggregates/Patient";
import { PatientId } from "../../src/domain/value-objects/PatientId";
import { PatientStatus } from "../../src/domain/value-objects/PatientStatus";
export declare class InMemoryPatientRepository implements IPatientRepository {
    private patients;
    findById(patientId: PatientId): Promise<Patient | null>;
    findByUserId(userId: string): Promise<Patient | null>;
    findByNationalId(nationalId: string): Promise<Patient | null>;
    save(patient: Patient): Promise<void>;
    delete(patientId: PatientId): Promise<void>;
    hardDeleteByUserId(userId: string): Promise<{
        deleted: boolean;
        patientId?: string;
    }>;
    updateStatusByUserId(userId: string, newStatus: PatientStatus): Promise<{
        updated: boolean;
        patientId?: string;
        previousStatus?: PatientStatus;
    }>;
    findWithFilters(): Promise<{
        patients: Patient[];
        total: number;
    }>;
    searchPatients(searchTerm: string, _filters?: {
        isActive?: boolean;
        hasInsurance?: boolean;
    }, _pagination?: {
        page: number;
        limit: number;
    }): Promise<{
        patients: Patient[];
        total: number;
    }>;
    matchPatients(): Promise<Array<{
        patient: Patient;
        matchGrade: "certain" | "probable" | "possible" | "certainly-not";
        score: number;
    }>>;
    findByBHYTNumber(bhytNumber: string): Promise<Patient | null>;
    getHealthStatus(): Promise<{
        status: string;
        message?: string;
    }>;
    getStatistics(): Promise<{
        total: number;
        byGender: {
            male: number;
            female: number;
            other: number;
            unknown: number;
        };
        byAgeRange: {
            "0-18": number;
            "19-40": number;
            "41-60": number;
            "60+": number;
        };
        byInsuranceType: {
            bhyt: number;
            bhtn: number;
            private: number;
            selfPay: number;
        };
        byStatus: {
            active: number;
            inactive: number;
            deceased: number;
            merged: number;
        };
        registrationTrend: Array<{
            month: string;
            count: number;
        }>;
    }>;
    getPatientHistory(_patientId: PatientId, _options?: {
        limit?: number;
        offset?: number;
        dateFrom?: Date;
        dateTo?: Date;
        eventTypes?: string[];
    }): Promise<{
        history: Array<{
            eventId: string;
            eventType: string;
            action: string;
            userId: string;
            userRole?: string;
            timestamp: Date;
            changes?: Record<string, any>;
            accessedFields?: string[];
            ipAddress?: string;
            userAgent?: string;
        }>;
        total: number;
    }>;
    createFromUserEvent(userData: {
        userId: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        address?: string;
        ward?: string;
        district?: string;
        city?: string;
        province?: string;
        dateOfBirth?: Date;
        gender?: "male" | "female" | "other";
        citizenId?: string;
    }): Promise<Patient>;
    /**
     * Utility helpers for tests
     */
    clear(): void;
    getAllPatients(): Patient[];
}
//# sourceMappingURL=InMemoryPatientRepository.d.ts.map