/**
 * AdvancedSearchService - Infrastructure Layer
 * Advanced search capabilities for medical records with full-text search and filtering
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Vietnamese Healthcare Standards
 */
import { MedicalRecordAggregate } from '../../domain/aggregates/clinical.aggregate';
import { SearchCriteria } from '../../application/use-cases/SearchMedicalRecordsUseCase';
/**
 * Search Result with Relevance
 */
export interface SearchResultWithRelevance {
    record: MedicalRecordAggregate;
    relevanceScore: number;
    matchedFields: string[];
    highlightedContent: string;
    matchedTerms: string[];
}
/**
 * Search Performance Metrics
 */
export interface SearchMetrics {
    searchTime: number;
    totalRecords: number;
    filteredRecords: number;
    indexHitRate: number;
    cacheHitRate: number;
}
/**
 * Advanced Search Options
 */
export interface AdvancedSearchOptions {
    useFullTextSearch?: boolean;
    enableFuzzySearch?: boolean;
    includeArchived?: boolean;
    includeDeleted?: boolean;
    maxResults?: number;
    minRelevanceScore?: number;
    highlightMatches?: boolean;
    searchLanguage?: 'vi' | 'en' | 'both';
    enableCaching?: boolean;
    cacheTimeout?: number;
}
/**
 * Advanced Search Service
 */
export declare class AdvancedSearchService {
    private searchIndex;
    private searchCache;
    private lastIndexUpdate;
    /**
     * Perform advanced search on medical records
     */
    search(records: MedicalRecordAggregate[], criteria: SearchCriteria, options?: AdvancedSearchOptions): Promise<{
        results: SearchResultWithRelevance[];
        metrics: SearchMetrics;
        totalFound: number;
    }>;
    /**
     * Update search index for better performance
     */
    private updateSearchIndex;
    /**
     * Apply basic filters (patient, doctor, date range, status)
     */
    private applyBasicFilters;
    /**
     * Perform text search with Vietnamese support
     */
    private performTextSearch;
    /**
     * Apply advanced filters (diagnosis codes, medication codes, etc.)
     */
    private applyAdvancedFilters;
    /**
     * Calculate relevance scores for search results
     */
    private calculateRelevanceScores;
    /**
     * Extract searchable content from medical record
     */
    private extractSearchableContent;
    /**
     * Extract keywords from medical record
     */
    private extractKeywords;
    /**
     * Extract Vietnamese medical terms
     */
    private extractVietnameseTerms;
    /**
     * Normalize search text
     */
    private normalizeSearchText;
    /**
     * Expand Vietnamese terms to include English equivalents
     */
    private expandVietnameseTerms;
    /**
     * Fuzzy string matching
     */
    private fuzzyMatch;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Generate highlighted content
     */
    private generateHighlightedContent;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Calculate index hit rate
     */
    private calculateIndexHitRate;
    /**
     * Clear search cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        entries: number;
    };
}
//# sourceMappingURL=AdvancedSearchService.d.ts.map