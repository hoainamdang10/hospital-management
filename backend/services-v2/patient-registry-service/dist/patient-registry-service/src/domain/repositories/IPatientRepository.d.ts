/**
 * IPatientRepository - Repository Interface
 * Defines contract for patient data access
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';
export interface IPatientRepository {
    /**
     * Find patient by ID
     */
    findById(patientId: PatientId): Promise<Patient | null>;
    /**
     * Find patient by user ID
     */
    findByUserId(userId: string): Promise<Patient | null>;
    /**
     * Find patient by national ID
     */
    findByNationalId(nationalId: string): Promise<Patient | null>;
    /**
     * Create patient from user creation event
     * Used when Identity Service creates a new user with PATIENT role
     */
    createFromUserEvent(userData: {
        userId: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        address?: string;
        dateOfBirth?: Date;
        gender?: 'male' | 'female' | 'other';
        citizenId?: string;
    }): Promise<Patient>;
    /**
     * Save patient (create or update)
     */
    save(patient: Patient): Promise<void>;
    /**
     * Delete patient (soft delete)
     */
    delete(patientId: PatientId): Promise<void>;
    /**
     * Find patients with filters
     */
    findWithFilters(filters: {
        isActive?: boolean;
        registrationDateFrom?: string;
        registrationDateTo?: string;
        city?: string;
        province?: string;
        hasInsurance?: boolean;
    }, pagination?: {
        page: number;
        limit: number;
        sorting?: {
            field: string;
            direction: 'asc' | 'desc';
        };
    }): Promise<{
        patients: Patient[];
        total: number;
    }>;
    /**
     * Search patients by term
     */
    searchPatients(searchTerm: string, filters?: {
        isActive?: boolean;
        hasInsurance?: boolean;
    }, pagination?: {
        page: number;
        limit: number;
    }): Promise<{
        patients: Patient[];
        total: number;
    }>;
    /**
     * Match patients (PMI $match operation)
     * Find potential duplicate patients based on demographic data
     */
    matchPatients(criteria: {
        fullName?: string;
        dateOfBirth?: Date;
        nationalId?: string;
        primaryPhone?: string;
        email?: string;
    }, onlyCertainMatches?: boolean, limit?: number): Promise<Array<{
        patient: Patient;
        matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not';
        score: number;
    }>>;
    /**
     * Find patient by BHYT number
     */
    findByBHYTNumber(bhytNumber: string): Promise<Patient | null>;
    /**
     * Get repository health status
     */
    getHealthStatus(): Promise<{
        status: string;
        message?: string;
    }>;
    /**
     * Get patient statistics for dashboard
     */
    getStatistics(): Promise<{
        total: number;
        byGender: {
            male: number;
            female: number;
            other: number;
            unknown: number;
        };
        byAgeRange: {
            '0-18': number;
            '19-40': number;
            '41-60': number;
            '60+': number;
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
    /**
     * Get patient history (audit logs and access history)
     * Returns chronological history of patient record changes and accesses
     */
    getPatientHistory(patientId: PatientId, options?: {
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
}
//# sourceMappingURL=IPatientRepository.d.ts.map