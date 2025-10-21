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
import {
  IPatientMatchingService,
  PatientMatchCriteria,
  PatientMatchResult,
  MatchDetails
} from './IPatientMatchingService';

/**
 * Patient Matching Service Implementation
 * Implements PMI matching algorithm with scoring
 */
export class PatientMatchingService implements IPatientMatchingService {
  // Scoring weights (total = 100)
  private readonly WEIGHTS = {
    nationalId: 40,    // Exact match = 40 points (highest priority)
    fullName: 20,      // Exact match = 20 points
    dateOfBirth: 20,   // Exact match = 20 points
    primaryPhone: 15,  // Exact match = 15 points
    email: 5           // Exact match = 5 points
  };

  // Match grade thresholds
  private readonly THRESHOLDS = {
    certain: 90,       // 90-100: certain match
    probable: 70,      // 70-89: probable match
    possible: 50,      // 50-69: possible match
    certainlyNot: 0    // 0-49: certainly not a match
  };

  constructor(private logger: ILogger) {}

  /**
   * Match patients against criteria
   */
  async matchPatients(
    candidates: Patient[],
    criteria: PatientMatchCriteria,
    onlyCertainMatches: boolean = false,
    limit: number = 10
  ): Promise<PatientMatchResult[]> {
    try {
      // Calculate match scores for all candidates
      const results: PatientMatchResult[] = candidates.map(patient => {
        const score = this.calculateMatchScore(patient, criteria);
        const matchGrade = this.determineMatchGrade(score);
        const matchDetails = this.getMatchDetails(patient, criteria);

        return {
          patient,
          matchGrade,
          score,
          matchDetails
        };
      });

      // Filter by match grade if needed
      let filteredResults = results;
      if (onlyCertainMatches) {
        filteredResults = results.filter(r => r.matchGrade === 'certain');
      } else {
        // Exclude certainly-not matches
        filteredResults = results.filter(r => r.matchGrade !== 'certainly-not');
      }

      // Sort by score (descending)
      filteredResults.sort((a, b) => b.score - a.score);

      // Apply limit
      const limitedResults = filteredResults.slice(0, limit);

      this.logger.info('Patient matching completed', {
        totalCandidates: candidates.length,
        matchesFound: limitedResults.length,
        onlyCertainMatches
      });

      return limitedResults;

    } catch (error) {
      this.logger.error('Error in patient matching', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Calculate match score for a patient
   */
  private calculateMatchScore(patient: Patient, criteria: PatientMatchCriteria): number {
    let score = 0;
    const personalInfo = patient.getPersonalInfo();
    const contactInfo = patient.getContactInfo();

    // National ID match (40 points)
    if (criteria.nationalId && personalInfo.nationalId) {
      if (this.normalizeString(criteria.nationalId) === this.normalizeString(personalInfo.nationalId)) {
        score += this.WEIGHTS.nationalId;
      }
    }

    // Full name match (20 points)
    if (criteria.fullName && personalInfo.fullName) {
      const similarity = this.calculateStringSimilarity(
        this.normalizeString(criteria.fullName),
        this.normalizeString(personalInfo.fullName)
      );
      score += this.WEIGHTS.fullName * similarity;
    }

    // Date of birth match (20 points)
    if (criteria.dateOfBirth && personalInfo.dateOfBirth) {
      if (this.isSameDate(criteria.dateOfBirth, personalInfo.dateOfBirth)) {
        score += this.WEIGHTS.dateOfBirth;
      }
    }

    // Phone match (15 points)
    if (criteria.primaryPhone && contactInfo.primaryPhone) {
      if (this.normalizePhone(criteria.primaryPhone) === this.normalizePhone(contactInfo.primaryPhone)) {
        score += this.WEIGHTS.primaryPhone;
      }
    }

    // Email match (5 points)
    if (criteria.email && contactInfo.email) {
      if (this.normalizeString(criteria.email) === this.normalizeString(contactInfo.email)) {
        score += this.WEIGHTS.email;
      }
    }

    return Math.round(score);
  }

  /**
   * Determine match grade based on score
   */
  private determineMatchGrade(score: number): 'certain' | 'probable' | 'possible' | 'certainly-not' {
    if (score >= this.THRESHOLDS.certain) {
      return 'certain';
    } else if (score >= this.THRESHOLDS.probable) {
      return 'probable';
    } else if (score >= this.THRESHOLDS.possible) {
      return 'possible';
    } else {
      return 'certainly-not';
    }
  }

  /**
   * Get detailed match information
   */
  private getMatchDetails(patient: Patient, criteria: PatientMatchCriteria): MatchDetails {
    const personalInfo = patient.getPersonalInfo();
    const contactInfo = patient.getContactInfo();
    const matchedFields: string[] = [];
    const scores: Record<string, number> = {};

    if (criteria.nationalId && personalInfo.nationalId) {
      if (this.normalizeString(criteria.nationalId) === this.normalizeString(personalInfo.nationalId)) {
        matchedFields.push('nationalId');
        scores.nationalId = this.WEIGHTS.nationalId;
      }
    }

    if (criteria.fullName && personalInfo.fullName) {
      const similarity = this.calculateStringSimilarity(
        this.normalizeString(criteria.fullName),
        this.normalizeString(personalInfo.fullName)
      );
      if (similarity > 0.8) {
        matchedFields.push('fullName');
        scores.fullName = this.WEIGHTS.fullName * similarity;
      }
    }

    if (criteria.dateOfBirth && personalInfo.dateOfBirth) {
      if (this.isSameDate(criteria.dateOfBirth, personalInfo.dateOfBirth)) {
        matchedFields.push('dateOfBirth');
        scores.dateOfBirth = this.WEIGHTS.dateOfBirth;
      }
    }

    if (criteria.primaryPhone && contactInfo.primaryPhone) {
      if (this.normalizePhone(criteria.primaryPhone) === this.normalizePhone(contactInfo.primaryPhone)) {
        matchedFields.push('primaryPhone');
        scores.primaryPhone = this.WEIGHTS.primaryPhone;
      }
    }

    if (criteria.email && contactInfo.email) {
      if (this.normalizeString(criteria.email) === this.normalizeString(contactInfo.email)) {
        matchedFields.push('email');
        scores.email = this.WEIGHTS.email;
      }
    }

    return { matchedFields, scores };
  }

  // ==================== Helper Methods ====================

  /**
   * Normalize string for comparison
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove Vietnamese diacritics
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, ''); // Remove all non-digits
  }

  /**
   * Check if two dates are the same
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   * Returns value between 0 and 1
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

}
