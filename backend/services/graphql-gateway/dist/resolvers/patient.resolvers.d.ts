import { GraphQLContext } from "../context";
/**
 * Patient GraphQL Resolvers
 * Handles all patient-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
export declare const patientResolvers: {
    Query: {
        patient(_: any, { id, patient_id }: {
            id?: string;
            patient_id?: string;
        }, context: GraphQLContext): Promise<any>;
        patientByProfile(_: any, { profileId }: {
            profileId: string;
        }, context: GraphQLContext): Promise<any>;
        patients(_: any, { filters, limit, offset, sortBy, sortOrder, }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
        searchPatients(_: any, { query, filters, limit, offset }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
        patientMedicalSummary(_: any, { patient_id }: {
            patient_id: string;
        }, context: GraphQLContext): Promise<any>;
        patientStats(_: any, { patient_id }: {
            patient_id: string;
        }, context: GraphQLContext): Promise<any>;
        patientDoctorHistory(_: any, { patient_id, doctor_id, limit, }: {
            patient_id: string;
            doctor_id: string;
            limit: number;
        }, context: GraphQLContext): Promise<any>;
        patientMedicalRecords(_: any, { patient_id, limit, offset, dateFrom, dateTo }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
    };
    Mutation: {
        createPatient(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        updatePatient(_: any, { id, input }: {
            id: string;
            input: any;
        }, context: GraphQLContext): Promise<any>;
        deletePatient(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<boolean>;
        activatePatient(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        deactivatePatient(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        updatePatientMedicalInfo(_: any, { id, bloodType, height, weight, allergies, chronicConditions, currentMedications, }: any, context: GraphQLContext): Promise<any>;
        updatePatientInsurance(_: any, { id, insuranceType, insuranceNumber, insuranceProvider, insuranceExpiryDate, }: any, context: GraphQLContext): Promise<any>;
    };
    Patient: {
        age(parent: any): number | null;
        bmi(parent: any): number | null;
        appointments(parent: any, { status, dateFrom, dateTo, limit, offset }: any, context: GraphQLContext): Promise<{
            edges: {
                node: any;
                cursor: string;
            }[];
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: number;
        }>;
        medicalRecords(parent: any, { limit, offset, dateFrom, dateTo }: any, context: GraphQLContext): Promise<{
            edges: {
                node: any;
                cursor: string;
            }[];
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: number;
        }>;
        totalAppointments(parent: any, _: any, context: GraphQLContext): Promise<number>;
        upcomingAppointments(parent: any, _: any, context: GraphQLContext): Promise<number>;
        completedAppointments(parent: any, _: any, context: GraphQLContext): Promise<number>;
        lastAppointment(parent: any, _: any, context: GraphQLContext): Promise<any>;
        nextAppointment(parent: any, _: any, context: GraphQLContext): Promise<any>;
    };
};
export default patientResolvers;
//# sourceMappingURL=patient.resolvers.d.ts.map