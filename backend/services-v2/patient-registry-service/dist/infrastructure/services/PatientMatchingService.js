"use strict";
/**
 * PatientMatchingService - Infrastructure Layer
 * Implements PMI (Patient Master Index) matching algorithm
 *
 * Based on HL7 FHIR Patient $match operation
 * Scoring algorithm for duplicate detection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientMatchingService = void 0;
/**
 * Patient Matching Service
 * Implements PMI matching algorithm with scoring
 */
class PatientMatchingService {
    constructor(logger) {
        this.logger = logger;
        // Scoring weights (total = 100)
        this.WEIGHTS = {
            nationalId: 40, // Exact match = 40 points (highest priority)
            fullName: 20, // Exact match = 20 points
            dateOfBirth: 20, // Exact match = 20 points
            primaryPhone: 15, // Exact match = 15 points
            email: 5 // Exact match = 5 points
        };
        // Match grade thresholds
        this.THRESHOLDS = {
            certain: 90, // 90-100: certain match
            probable: 70, // 70-89: probable match
            possible: 50, // 50-69: possible match
            certainlyNot: 0 // 0-49: certainly not a match
        };
    }
    /**
     * Match patients against criteria
     */
    async matchPatients(candidates, criteria, onlyCertainMatches = false, limit = 10) {
        try {
            // Calculate match scores for all candidates
            const results = candidates.map(patient => {
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
            }
            else {
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
        }
        catch (error) {
            this.logger.error('Error in patient matching', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Calculate match score for a patient
     */
    calculateMatchScore(patient, criteria) {
        let score = 0;
        const props = patient.getProps();
        // National ID match (40 points)
        if (criteria.nationalId && props.personalInfo.nationalId) {
            if (this.normalizeString(criteria.nationalId) === this.normalizeString(props.personalInfo.nationalId)) {
                score += this.WEIGHTS.nationalId;
            }
        }
        // Full name match (20 points)
        if (criteria.fullName && props.personalInfo.fullName) {
            const similarity = this.calculateStringSimilarity(this.normalizeString(criteria.fullName), this.normalizeString(props.personalInfo.fullName));
            score += this.WEIGHTS.fullName * similarity;
        }
        // Date of birth match (20 points)
        if (criteria.dateOfBirth && props.personalInfo.dateOfBirth) {
            if (this.isSameDate(criteria.dateOfBirth, props.personalInfo.dateOfBirth)) {
                score += this.WEIGHTS.dateOfBirth;
            }
        }
        // Phone match (15 points)
        if (criteria.primaryPhone && props.contactInfo.primaryPhone) {
            if (this.normalizePhone(criteria.primaryPhone) === this.normalizePhone(props.contactInfo.primaryPhone)) {
                score += this.WEIGHTS.primaryPhone;
            }
        }
        // Email match (5 points)
        if (criteria.email && props.contactInfo.email) {
            if (this.normalizeString(criteria.email) === this.normalizeString(props.contactInfo.email)) {
                score += this.WEIGHTS.email;
            }
        }
        return Math.round(score);
    }
    /**
     * Determine match grade based on score
     */
    determineMatchGrade(score) {
        if (score >= this.THRESHOLDS.certain) {
            return 'certain';
        }
        else if (score >= this.THRESHOLDS.probable) {
            return 'probable';
        }
        else if (score >= this.THRESHOLDS.possible) {
            return 'possible';
        }
        else {
            return 'certainly-not';
        }
    }
    /**
     * Get detailed match information
     */
    getMatchDetails(patient, criteria) {
        const props = patient.getProps();
        return {
            fullNameMatch: criteria.fullName ?
                this.normalizeString(criteria.fullName) === this.normalizeString(props.personalInfo.fullName) : false,
            dateOfBirthMatch: criteria.dateOfBirth ?
                this.isSameDate(criteria.dateOfBirth, props.personalInfo.dateOfBirth) : false,
            nationalIdMatch: criteria.nationalId ?
                this.normalizeString(criteria.nationalId) === this.normalizeString(props.personalInfo.nationalId) : false,
            phoneMatch: criteria.primaryPhone ?
                this.normalizePhone(criteria.primaryPhone) === this.normalizePhone(props.contactInfo.primaryPhone) : false,
            emailMatch: criteria.email && props.contactInfo.email ?
                this.normalizeString(criteria.email) === this.normalizeString(props.contactInfo.email) : false
        };
    }
    // ==================== Helper Methods ====================
    /**
     * Normalize string for comparison
     */
    normalizeString(str) {
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
    normalizePhone(phone) {
        return phone.replace(/\D/g, ''); // Remove all non-digits
    }
    /**
     * Check if two dates are the same
     */
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
    /**
     * Calculate string similarity (Levenshtein distance based)
     * Returns value between 0 and 1
     */
    calculateStringSimilarity(str1, str2) {
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
    levenshteinDistance(str1, str2) {
        const matrix = [];
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
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    /**
     * Get service status
     */
    getStatus() {
        return {
            serviceName: 'PatientMatchingService',
            weights: this.WEIGHTS,
            thresholds: this.THRESHOLDS,
            isHealthy: true,
            timestamp: new Date().toISOString()
        };
    }
}
exports.PatientMatchingService = PatientMatchingService;
//# sourceMappingURL=PatientMatchingService.js.map