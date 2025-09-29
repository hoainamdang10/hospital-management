export declare const DEPARTMENT_CODES: Record<string, string>;
export declare const DEPARTMENT_NAMES_VI: Record<string, string>;
export interface IdGenerationOptions {
    departmentId?: string;
    entityType: 'DOC' | 'PAT' | 'APT' | 'ADM' | 'MR' | 'RX';
    useDatabase?: boolean;
}
export interface DepartmentBasedIdOptions extends Omit<IdGenerationOptions, 'departmentId'> {
    departmentId: string;
}
export declare class HospitalIdGenerator {
    private static supabase;
    static initialize(supabaseUrl: string, supabaseKey: string): void;
    /**
     * Generate department-based doctor ID
     * Format: CARD-DOC-202506-001
     */
    static generateDoctorId(departmentId?: string): Promise<string>;
    /**
     * Generate standard patient ID
     * Format: PAT-202506-001
     */
    static generatePatientId(): Promise<string>;
    /**
     * Generate department-based appointment ID
     * Format: CARD-APT-202506-001
     */
    static generateAppointmentId(departmentId: string): Promise<string>;
    /**
     * Generate admin ID
     * Format: ADM-202506-001
     */
    static generateAdminId(): Promise<string>;
    /**
     * Generate department-based medical record ID
     * Format: CARD-MR-202506-001
     */
    static generateMedicalRecordId(departmentId: string): Promise<string>;
    /**
     * Generate department-based prescription ID
     * Format: CARD-RX-202506-001
     */
    static generatePrescriptionId(departmentId: string): Promise<string>;
    /**
     * Local ID generation (fallback method)
     * Used when database functions are not available
     */
    private static generateLocalId;
    /**
     * Validate ID format - Department-Based Only
     */
    static validateId(id: string, expectedType: string): boolean;
    /**
     * Extract department from ID
     */
    static extractDepartment(id: string): string | null;
    /**
     * Extract entity type from ID
     */
    static extractEntityType(id: string): string | null;
    /**
     * Extract year-month from ID
     */
    static extractYearMonth(id: string): string | null;
    /**
     * Get department name from code
     */
    static getDepartmentName(deptCode: string): string;
}
export declare const generateDoctorId: typeof HospitalIdGenerator.generateDoctorId;
export declare const generatePatientId: typeof HospitalIdGenerator.generatePatientId;
export declare const generateAppointmentId: typeof HospitalIdGenerator.generateAppointmentId;
export declare const generateAdminId: typeof HospitalIdGenerator.generateAdminId;
//# sourceMappingURL=id-generator.d.ts.map