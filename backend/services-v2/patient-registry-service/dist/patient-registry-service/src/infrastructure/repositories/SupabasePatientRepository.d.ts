/**
 * SupabasePatientRepository - Infrastructure Layer
 * Implements IPatientRepository with Supabase PostgreSQL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
import type { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { Patient } from "../../domain/aggregates/Patient";
import { PatientId } from "../../domain/value-objects/PatientId";
import { PatientStatus } from "../../domain/value-objects/PatientStatus";
import { PatientRegistryCircuitBreaker } from "../resilience/CircuitBreaker";
import { ILogger } from "../../../../shared/application/services/logger.interface";
import { IPatientMatchingService } from "../../application/services/IPatientMatchingService";
import { IDomainEventPublisher } from "../../../../shared/domain/events/IDomainEventPublisher";
import { PatientCache } from "../cache/PatientCache";
import { IOutboxRepository } from "../outbox/SupabaseOutboxRepository";
/**
 * Supabase Patient Repository Implementation
 */
export declare class SupabasePatientRepository implements IPatientRepository {
    private logger;
    private matchingService;
    private eventPublisher?;
    private patientCache?;
    private outboxRepository?;
    private readonly optimizedClient;
    private readonly supabaseClient;
    private circuitBreaker;
    constructor(optimizedClient: OptimizedSupabaseClient, logger: ILogger, matchingService: IPatientMatchingService, eventPublisher?: IDomainEventPublisher | undefined, patientCache?: PatientCache | undefined, outboxRepository?: IOutboxRepository | undefined);
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
     * Find patient by BHYT number
     */
    findByBHYTNumber(bhytNumber: string): Promise<Patient | null>;
    /**
     * Create patient from user creation event
     * Auto-creates patient record when Identity Service creates a PATIENT user
     */
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
     * Save patient (create or update)
     *  FIX TRANSACTION SUPPORT: Use PostgreSQL function for atomic operations
     */
    save(patient: Patient): Promise<void>;
    private shouldUseDirectPersistence;
    private savePatientFallback;
    /**
     * Delete patient (soft delete)
     */
    delete(patientId: PatientId): Promise<void>;
    /**
     * Hard delete patient by linked identity user ID
     * Used when Identity Service performs a permanent account deletion
     */
    hardDeleteByUserId(userId: string, options?: {
        deletedBy?: string;
        reason?: string;
    }): Promise<{
        deleted: boolean;
        patientId?: string;
    }>;
    /**
     * Update patient lifecycle status by user ID
     */
    updateStatusByUserId(userId: string, newStatus: PatientStatus, options?: {
        updatedBy?: string;
        reason?: string;
        source?: string;
    }): Promise<{
        updated: boolean;
        patientId?: string;
        previousStatus?: PatientStatus;
    }>;
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
            direction: "asc" | "desc";
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
     * Delegates to PatientMatchingService
     */
    matchPatients(criteria: {
        fullName?: string;
        dateOfBirth?: Date;
        nationalId?: string;
        primaryPhone?: string;
        email?: string;
    }, onlyCertainMatches?: boolean, limit?: number): Promise<Array<{
        patient: Patient;
        matchGrade: "certain" | "probable" | "possible" | "certainly-not";
        score: number;
    }>>;
    /**
     * Get repository health status
     */
    getHealthStatus(): Promise<RepositoryHealthStatus>;
    /**
     * Fetch insurance info for patient
     */
    private fetchInsurance;
    /**
     * Fetch emergency contacts for patient
     */
    private fetchEmergencyContacts;
    /**
     * Fetch consents for patient
     */
    private fetchConsents;
    /**
     * Fetch links for patient
     */
    private fetchLinks;
    /**
     *  FIX N+1 PROBLEM: Batch fetch insurance for multiple patients
     */
    private fetchInsuranceBatch;
    /**
     *  FIX N+1 PROBLEM: Batch fetch emergency contacts for multiple patients
     */
    private fetchEmergencyContactsBatch;
    /**
     *  FIX N+1 PROBLEM: Batch fetch consents for multiple patients
     */
    private fetchConsentsBatch;
    /**
     *  FIX N+1 PROBLEM: Batch fetch links for multiple patients
     */
    private fetchLinksBatch;
    private buildInClause;
    private getActiveInsurancePatientIds;
    /**
     * Save insurance info
     * @private - Reserved for future use
     */
    private _saveInsurance;
    /**
     * Save emergency contacts
     * @private - Reserved for future use
     */
    private _saveEmergencyContacts;
    /**
     * Save consents
     * @private - Reserved for future use
     */
    private _saveConsents;
    /**
     * Save links
     * @private - Reserved for future use
     */
    private _saveLinks;
    /**
     * Publish domain events from aggregate
     *  OUTBOX PATTERN: Save events to outbox table for reliable publishing
     */
    private publishDomainEvents;
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
interface RepositoryHealthStatus {
    status: "healthy" | "unhealthy";
    database?: string;
    circuitBreaker?: ReturnType<PatientRegistryCircuitBreaker["getStatus"]>;
    timestamp: string;
    error?: string;
}
export {};
//# sourceMappingURL=SupabasePatientRepository.d.ts.map