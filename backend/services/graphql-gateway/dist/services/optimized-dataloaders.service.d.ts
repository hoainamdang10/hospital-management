/**
 * Optimized DataLoaders Service
 * Advanced batching and caching for N+1 query optimization
 */
import DataLoader from "dataloader";
import { RestApiService } from "./rest-api.service";
export interface DataLoaderOptions {
    batchSize?: number;
    cacheEnabled?: boolean;
    cacheTTL?: number;
    timeout?: number;
}
export declare class OptimizedDataLoadersService {
    private restApi;
    private loaders;
    constructor(restApi: RestApiService);
    /**
     * Initialize all DataLoaders with optimization
     */
    private initializeDataLoaders;
    /**
     * Create optimized DataLoader with caching
     */
    private createLoader;
    /**
     * Batch load doctors
     */
    private batchLoadDoctors;
    /**
     * Batch load doctors by department
     */
    private batchLoadDoctorsByDepartment;
    /**
     * Batch load doctor schedules
     */
    private batchLoadDoctorSchedules;
    /**
     * Batch load doctor reviews
     */
    private batchLoadDoctorReviews;
    /**
     * Batch load patients
     */
    private batchLoadPatients;
    /**
     * Batch load patients by doctor
     */
    private batchLoadPatientsByDoctor;
    /**
     * Get DataLoader by name
     */
    getLoader<K, V>(name: string): DataLoader<K, V> | undefined;
    /**
     * Clear all DataLoader caches
     */
    clearAll(): void;
    /**
     * Clear specific DataLoader cache
     */
    clear(name: string): void;
    /**
     * Prime DataLoader cache
     */
    prime<K, V>(loaderName: string, key: K, value: V): void;
    /**
     * Get DataLoader statistics
     */
    getStats(): any;
    private batchLoadPatientMedicalRecords;
    private batchLoadAppointments;
    private batchLoadAppointmentsByDoctor;
    private batchLoadAppointmentsByPatient;
    private batchLoadDepartments;
    private batchLoadDepartmentSpecialties;
    private batchLoadMedicalRecords;
    private batchLoadVitalSigns;
}
/**
 * Factory function to create optimized DataLoaders
 */
export declare function createOptimizedDataLoaders(restApi: RestApiService): OptimizedDataLoadersService;
//# sourceMappingURL=optimized-dataloaders.service.d.ts.map