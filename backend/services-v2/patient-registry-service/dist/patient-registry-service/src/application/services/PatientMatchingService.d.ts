/**
 * PatientMatchingService - Application Layer
 * Implements PMI (Patient Master Index) matching algorithm
 *
 * Based on HL7 FHIR Patient $match operation
 * Scoring algorithm for duplicate detection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR
 */
import { Patient } from '../../domain/aggregates/Patient';
import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientMatchingService, PatientMatchCriteria, PatientMatchResult } from './IPatientMatchingService';
/**
 * Patient Matching Service Implementation
 * Implements PMI matching algorithm with scoring
 */
export declare class PatientMatchingService implements IPatientMatchingService {
    private logger;
    private readonly WEIGHTS;
    private readonly THRESHOLDS;
    constructor(logger: ILogger);
    /**
     * Match patients against criteria
     */
    matchPatients(candidates: Patient[], criteria: PatientMatchCriteria, onlyCertainMatches?: boolean, limit?: number): Promise<PatientMatchResult[]>;
    /**
     * Calculate match score for a patient
     */
    private calculateMatchScore;
    /**
     * Determine match grade based on score
     */
    private determineMatchGrade;
    /**
     * Get detailed match information
     */
    private getMatchDetails;
    /**
     * Normalize string for comparison
     */
    private normalizeString;
    /**
     * Normalize phone number for comparison
     */
    private normalizePhone;
    /**
     * Check if two dates are the same
     */
    private isSameDate;
    /**
     * Calculate string similarity (Levenshtein distance based)
     * Returns value between 0 and 1
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
}
//# sourceMappingURL=PatientMatchingService.d.ts.map