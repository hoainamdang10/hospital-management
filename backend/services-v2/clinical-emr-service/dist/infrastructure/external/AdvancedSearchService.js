"use strict";
/**
 * AdvancedSearchService - Infrastructure Layer
 * Advanced search capabilities for medical records with full-text search and filtering
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSearchService = void 0;
/**
 * Vietnamese Medical Terms Dictionary
 */
const VIETNAMESE_MEDICAL_TERMS = {
    // Common symptoms
    'đau đầu': ['headache', 'cephalgia'],
    'sốt': ['fever', 'pyrexia'],
    'ho': ['cough', 'tussis'],
    'khó thở': ['dyspnea', 'shortness of breath'],
    'đau bụng': ['abdominal pain', 'stomach ache'],
    'buồn nôn': ['nausea', 'feeling sick'],
    'chóng mặt': ['dizziness', 'vertigo'],
    'mệt mỏi': ['fatigue', 'tiredness'],
    // Common diagnoses
    'cao huyết áp': ['hypertension', 'high blood pressure'],
    'tiểu đường': ['diabetes', 'diabetes mellitus'],
    'viêm phổi': ['pneumonia', 'lung infection'],
    'viêm họng': ['pharyngitis', 'sore throat'],
    'cảm cúm': ['influenza', 'flu'],
    'dị ứng': ['allergy', 'allergic reaction'],
    // Common medications
    'paracetamol': ['acetaminophen', 'tylenol'],
    'aspirin': ['acetylsalicylic acid'],
    'amoxicillin': ['antibiotic'],
    'ibuprofen': ['pain reliever']
};
/**
 * Advanced Search Service
 */
class AdvancedSearchService {
    constructor() {
        this.searchIndex = new Map();
        this.searchCache = new Map();
        this.lastIndexUpdate = new Date();
    }
    /**
     * Perform advanced search on medical records
     */
    async search(records, criteria, options = {}) {
        const startTime = Date.now();
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(criteria, options);
            if (options.enableCaching && this.searchCache.has(cacheKey)) {
                const cached = this.searchCache.get(cacheKey);
                const cacheAge = Date.now() - cached.timestamp.getTime();
                const cacheTimeout = (options.cacheTimeout || 15) * 60 * 1000; // Convert to milliseconds
                if (cacheAge < cacheTimeout) {
                    return {
                        ...cached.results,
                        metrics: {
                            ...cached.results.metrics,
                            cacheHitRate: 1.0
                        }
                    };
                }
            }
            // Update search index if needed
            await this.updateSearchIndex(records);
            // Apply basic filters first
            let filteredRecords = this.applyBasicFilters(records, criteria, options);
            // Apply text search if specified
            if (criteria.searchText && criteria.searchText.trim() !== '') {
                filteredRecords = await this.performTextSearch(filteredRecords, criteria.searchText, options);
            }
            // Apply advanced filters
            filteredRecords = this.applyAdvancedFilters(filteredRecords, criteria);
            // Calculate relevance scores and sort
            const resultsWithRelevance = await this.calculateRelevanceScores(filteredRecords, criteria, options);
            // Apply minimum relevance score filter
            const minScore = options.minRelevanceScore || 0.1;
            const filteredResults = resultsWithRelevance.filter(r => r.relevanceScore >= minScore);
            // Sort by relevance score (descending)
            filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            // Apply result limit
            const maxResults = options.maxResults || 50;
            const limitedResults = filteredResults.slice(0, maxResults);
            // Calculate metrics
            const searchTime = Date.now() - startTime;
            const metrics = {
                searchTime,
                totalRecords: records.length,
                filteredRecords: filteredResults.length,
                indexHitRate: this.calculateIndexHitRate(),
                cacheHitRate: 0.0
            };
            const result = {
                results: limitedResults,
                metrics,
                totalFound: filteredResults.length
            };
            // Cache results if enabled
            if (options.enableCaching) {
                this.searchCache.set(cacheKey, {
                    results: result,
                    timestamp: new Date()
                });
            }
            return result;
        }
        catch (error) {
            throw new Error(`Advanced search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update search index for better performance
     */
    async updateSearchIndex(records) {
        const indexUpdateThreshold = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastUpdate = Date.now() - this.lastIndexUpdate.getTime();
        if (timeSinceLastUpdate < indexUpdateThreshold && this.searchIndex.size > 0) {
            return; // Index is still fresh
        }
        this.searchIndex.clear();
        for (const record of records) {
            const indexEntry = {
                recordId: record.recordId.value,
                patientId: record.patientId,
                doctorId: record.doctorId,
                content: this.extractSearchableContent(record),
                keywords: this.extractKeywords(record),
                diagnosisCodes: record.diagnoses.map(d => d.code),
                medicationCodes: record.medications.map(m => m.code),
                vietnameseTerms: this.extractVietnameseTerms(record),
                lastIndexed: new Date()
            };
            this.searchIndex.set(record.recordId.value, indexEntry);
        }
        this.lastIndexUpdate = new Date();
    }
    /**
     * Apply basic filters (patient, doctor, date range, status)
     */
    applyBasicFilters(records, criteria, options) {
        return records.filter(record => {
            // Patient filter
            if (criteria.patientId && record.patientId !== criteria.patientId) {
                return false;
            }
            // Doctor filter
            if (criteria.doctorId && record.doctorId !== criteria.doctorId) {
                return false;
            }
            // Date range filter
            if (criteria.dateFrom && record.visitDate < criteria.dateFrom) {
                return false;
            }
            if (criteria.dateTo && record.visitDate > criteria.dateTo) {
                return false;
            }
            // Status filters
            if (!options.includeArchived && record.isArchived()) {
                return false;
            }
            if (!options.includeDeleted && record.isDeleted()) {
                return false;
            }
            return true;
        });
    }
    /**
     * Perform text search with Vietnamese support
     */
    async performTextSearch(records, searchText, options) {
        const searchTerms = this.normalizeSearchText(searchText);
        const expandedTerms = this.expandVietnameseTerms(searchTerms, options.searchLanguage);
        return records.filter(record => {
            const indexEntry = this.searchIndex.get(record.recordId.value);
            if (!indexEntry) {
                return false;
            }
            // Check if any search term matches
            return expandedTerms.some(term => {
                if (options.enableFuzzySearch) {
                    return this.fuzzyMatch(term, indexEntry.content) ||
                        indexEntry.keywords.some(keyword => this.fuzzyMatch(term, keyword)) ||
                        indexEntry.vietnameseTerms.some(vTerm => this.fuzzyMatch(term, vTerm));
                }
                else {
                    return indexEntry.content.toLowerCase().includes(term.toLowerCase()) ||
                        indexEntry.keywords.some(keyword => keyword.toLowerCase().includes(term.toLowerCase())) ||
                        indexEntry.vietnameseTerms.some(vTerm => vTerm.toLowerCase().includes(term.toLowerCase()));
                }
            });
        });
    }
    /**
     * Apply advanced filters (diagnosis codes, medication codes, etc.)
     */
    applyAdvancedFilters(records, criteria) {
        return records.filter(record => {
            // Diagnosis code filter
            if (criteria.diagnosisCode) {
                const hasDiagnosis = record.diagnoses.some(d => d.code.toLowerCase().includes(criteria.diagnosisCode.toLowerCase()) ||
                    d.display.toLowerCase().includes(criteria.diagnosisCode.toLowerCase()));
                if (!hasDiagnosis)
                    return false;
            }
            // Medication code filter
            if (criteria.medicationCode) {
                const hasMedication = record.medications.some(m => m.code.toLowerCase().includes(criteria.medicationCode.toLowerCase()) ||
                    m.name.toLowerCase().includes(criteria.medicationCode.toLowerCase()));
                if (!hasMedication)
                    return false;
            }
            // Critical diagnoses filter
            if (criteria.hasCriticalDiagnoses) {
                const hasCritical = record.getCriticalDiagnoses().length > 0;
                if (!hasCritical)
                    return false;
            }
            // Active medications filter
            if (criteria.hasActiveMedications) {
                const hasActive = record.getActiveMedications().length > 0;
                if (!hasActive)
                    return false;
            }
            // Vital signs filter
            if (criteria.hasVitalSigns && !record.hasVitalSigns()) {
                return false;
            }
            // FHIR compliance filter
            if (criteria.fhirCompliant !== undefined) {
                if (record.isFHIRCompliant() !== criteria.fhirCompliant) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Calculate relevance scores for search results
     */
    async calculateRelevanceScores(records, criteria, options) {
        const results = [];
        for (const record of records) {
            let relevanceScore = 0.0;
            const matchedFields = [];
            const matchedTerms = [];
            let highlightedContent = '';
            const indexEntry = this.searchIndex.get(record.recordId.value);
            // Base relevance score
            relevanceScore += 0.1;
            // Text search relevance
            if (criteria.searchText) {
                const searchTerms = this.normalizeSearchText(criteria.searchText);
                const expandedTerms = this.expandVietnameseTerms(searchTerms, options.searchLanguage);
                for (const term of expandedTerms) {
                    // Check symptoms
                    if (record.symptoms && record.symptoms.toLowerCase().includes(term.toLowerCase())) {
                        relevanceScore += 0.3;
                        matchedFields.push('symptoms');
                        matchedTerms.push(term);
                    }
                    // Check diagnosis
                    if (record.diagnoses.some(d => d.display.toLowerCase().includes(term.toLowerCase()) ||
                        d.code.toLowerCase().includes(term.toLowerCase()))) {
                        relevanceScore += 0.4;
                        matchedFields.push('diagnosis');
                        matchedTerms.push(term);
                    }
                    // Check medications
                    if (record.medications.some(m => m.name.toLowerCase().includes(term.toLowerCase()) ||
                        m.code.toLowerCase().includes(term.toLowerCase()))) {
                        relevanceScore += 0.3;
                        matchedFields.push('medications');
                        matchedTerms.push(term);
                    }
                    // Check examination notes
                    if (record.examinationNotes && record.examinationNotes.toLowerCase().includes(term.toLowerCase())) {
                        relevanceScore += 0.2;
                        matchedFields.push('examination');
                        matchedTerms.push(term);
                    }
                }
            }
            // Exact match bonuses
            if (criteria.patientId === record.patientId) {
                relevanceScore += 0.5;
                matchedFields.push('patient');
            }
            if (criteria.doctorId === record.doctorId) {
                relevanceScore += 0.3;
                matchedFields.push('doctor');
            }
            // Recent records get higher scores
            const daysSinceVisit = (Date.now() - record.visitDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceVisit <= 30) {
                relevanceScore += 0.2;
            }
            else if (daysSinceVisit <= 90) {
                relevanceScore += 0.1;
            }
            // Complete records get bonus
            if (record.hasVitalSigns() && record.diagnoses.length > 0 && record.medications.length > 0) {
                relevanceScore += 0.1;
            }
            // Generate highlighted content if requested
            if (options.highlightMatches && criteria.searchText) {
                highlightedContent = this.generateHighlightedContent(record, matchedTerms);
            }
            results.push({
                record,
                relevanceScore: Math.min(relevanceScore, 1.0), // Cap at 1.0
                matchedFields: [...new Set(matchedFields)], // Remove duplicates
                highlightedContent,
                matchedTerms: [...new Set(matchedTerms)] // Remove duplicates
            });
        }
        return results;
    }
    /**
     * Extract searchable content from medical record
     */
    extractSearchableContent(record) {
        const parts = [];
        if (record.symptoms)
            parts.push(record.symptoms);
        if (record.examinationNotes)
            parts.push(record.examinationNotes);
        if (record.notes)
            parts.push(record.notes);
        // Add diagnosis information
        record.diagnoses.forEach(d => {
            parts.push(d.display);
            parts.push(d.code);
        });
        // Add medication information
        record.medications.forEach(m => {
            parts.push(m.name);
            parts.push(m.code);
            if (m.genericName)
                parts.push(m.genericName);
        });
        return parts.join(' ').toLowerCase();
    }
    /**
     * Extract keywords from medical record
     */
    extractKeywords(record) {
        const keywords = [];
        // Add diagnosis codes and displays
        record.diagnoses.forEach(d => {
            keywords.push(d.code);
            keywords.push(d.display);
            if (d.category)
                keywords.push(d.category);
        });
        // Add medication codes and names
        record.medications.forEach(m => {
            keywords.push(m.code);
            keywords.push(m.name);
            if (m.genericName)
                keywords.push(m.genericName);
        });
        // Add status and other metadata
        keywords.push(record.status);
        if (record.specialtyCode)
            keywords.push(record.specialtyCode);
        return keywords;
    }
    /**
     * Extract Vietnamese medical terms
     */
    extractVietnameseTerms(record) {
        const terms = [];
        const content = this.extractSearchableContent(record);
        // Find Vietnamese terms in content
        Object.keys(VIETNAMESE_MEDICAL_TERMS).forEach(vietnameseTerm => {
            if (content.includes(vietnameseTerm)) {
                terms.push(vietnameseTerm);
                // Add English equivalents
                terms.push(...VIETNAMESE_MEDICAL_TERMS[vietnameseTerm]);
            }
        });
        return terms;
    }
    /**
     * Normalize search text
     */
    normalizeSearchText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 1);
    }
    /**
     * Expand Vietnamese terms to include English equivalents
     */
    expandVietnameseTerms(terms, language) {
        if (language === 'en') {
            return terms; // Only search English terms
        }
        const expandedTerms = [...terms];
        terms.forEach(term => {
            // Check if term is Vietnamese and add English equivalents
            Object.entries(VIETNAMESE_MEDICAL_TERMS).forEach(([vietnamese, english]) => {
                if (vietnamese.includes(term) || term.includes(vietnamese)) {
                    expandedTerms.push(...english);
                }
                // Check reverse mapping
                if (english.some(eng => eng.includes(term) || term.includes(eng))) {
                    expandedTerms.push(vietnamese);
                }
            });
        });
        return [...new Set(expandedTerms)]; // Remove duplicates
    }
    /**
     * Fuzzy string matching
     */
    fuzzyMatch(term, content, threshold = 0.8) {
        const similarity = this.calculateStringSimilarity(term.toLowerCase(), content.toLowerCase());
        return similarity >= threshold;
    }
    /**
     * Calculate string similarity using Levenshtein distance
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
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }
        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        return matrix[str2.length][str1.length];
    }
    /**
     * Generate highlighted content
     */
    generateHighlightedContent(record, matchedTerms) {
        let content = record.getSummary();
        matchedTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            content = content.replace(regex, '<mark>$1</mark>');
        });
        return content;
    }
    /**
     * Generate cache key
     */
    generateCacheKey(criteria, options) {
        return JSON.stringify({ criteria, options });
    }
    /**
     * Calculate index hit rate
     */
    calculateIndexHitRate() {
        return this.searchIndex.size > 0 ? 1.0 : 0.0;
    }
    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.searchCache.size,
            entries: this.searchIndex.size
        };
    }
}
exports.AdvancedSearchService = AdvancedSearchService;
//# sourceMappingURL=AdvancedSearchService.js.map