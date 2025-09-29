export declare class CacheService {
    private redis;
    private readonly TTL;
    constructor();
    getPatientRecords(patientId: string): Promise<any[] | null>;
    setPatientRecords(patientId: string, records: any[]): Promise<void>;
    getDoctorRecords(doctorId: string, page?: number): Promise<any[] | null>;
    setDoctorRecords(doctorId: string, page: number, records: any[]): Promise<void>;
    getSearchResults(query: string, filters: any): Promise<any[] | null>;
    setSearchResults(query: string, filters: any, results: any[]): Promise<void>;
    getStatistics(type: string, period: string): Promise<any | null>;
    setStatistics(type: string, period: string, stats: any): Promise<void>;
    invalidatePatientCache(patientId: string): Promise<void>;
    invalidateDoctorCache(doctorId: string): Promise<void>;
    invalidateSearchCache(): Promise<void>;
    private hashQuery;
    healthCheck(): Promise<boolean>;
    getStats(): Promise<any>;
    private parseMemoryUsage;
    private parseKeyCount;
    private getHitRate;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map