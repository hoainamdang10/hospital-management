import DataLoader from "dataloader";
import { RestApiService } from "../services/rest-api.service";
/**
 * DataLoader factory for N+1 query optimization
 * Creates batched loaders for efficient data fetching from REST APIs
 */
export declare function createDataLoaders(restApi: RestApiService): {
    doctorById: DataLoader<string, any, string>;
    doctorsByDepartment: DataLoader<string, any[], string>;
    patientById: DataLoader<string, any, string>;
    appointmentById: DataLoader<string, any, string>;
    appointmentsByDoctor: DataLoader<string, any[], string>;
    appointmentsByPatient: DataLoader<string, any[], string>;
    departmentById: DataLoader<string, any, string>;
    medicalRecordsByPatient: DataLoader<string, any[], string>;
    doctorStats: DataLoader<string, any, string>;
    doctorReviews: DataLoader<string, any[], string>;
    availableSlots: DataLoader<string, any[], string>;
};
export default createDataLoaders;
//# sourceMappingURL=index.d.ts.map