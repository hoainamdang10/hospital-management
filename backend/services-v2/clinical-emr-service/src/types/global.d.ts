/**
 * Global Type Declarations - Clinical EMR Service
 * Extend global namespace with test utilities
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

declare global {
  var testUtils: {
    generateUUID: () => string;
    generateMedicalRecordId: () => string;
    generatePatientId: () => string;
    generateDoctorId: () => string;
    generateTreatmentPlanId: () => string;
    sleep: (ms: number) => Promise<void>;
    futureDate: (daysFromNow?: number) => Date;
    pastDate: (daysAgo?: number) => Date;
  };
}

export {};
