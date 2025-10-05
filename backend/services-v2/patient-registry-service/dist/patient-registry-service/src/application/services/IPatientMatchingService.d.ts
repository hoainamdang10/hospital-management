/**
 * IPatientMatchingService - Application Layer Interface
 * Defines contract for patient matching operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
import { Patient } from '../../domain/aggregates/Patient';
/**
 * Patient match criteria
 */
export interface PatientMatchCriteria {
    fullName?: string;
    dateOfBirth?: Date;
    nationalId?: string;
    primaryPhone?: string;
    email?: string;
}
/**
 * Match grade classification
 */
export type MatchGrade = 'certain' | 'probable' | 'possible' | 'certainly-not';
/**
 * Match details for debugging
 */
export interface MatchDetails {
    matchedFields: string[];
    scores: Record<string, number>;
}
/**
 * Patient match result
 */
export interface PatientMatchResult {
    patient: Patient;
    matchGrade: MatchGrade;
    score: number;
    matchDetails?: MatchDetails;
}
/**
 * Patient Matching Service Interface
 * Implements PMI (Patient Master Index) matching algorithm
 */
export interface IPatientMatchingService {
    /**
     * Match patients against criteria
     * @param candidates - List of candidate patients to match against
     * @param criteria - Matching criteria
     * @param onlyCertainMatches - If true, only return certain matches
     * @param limit - Maximum number of results to return
     * @returns Sorted list of matches (highest score first)
     */
    matchPatients(candidates: Patient[], criteria: PatientMatchCriteria, onlyCertainMatches?: boolean, limit?: number): Promise<PatientMatchResult[]>;
}
//# sourceMappingURL=IPatientMatchingService.d.ts.map