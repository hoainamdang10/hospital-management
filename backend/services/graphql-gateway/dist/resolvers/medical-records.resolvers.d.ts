import { GraphQLContext } from "../context";
/**
 * Medical Records GraphQL Resolvers
 * Handles all medical record-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
export declare const medicalRecordsResolvers: {
    Query: {
        medicalRecord(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        medicalRecords(_: any, { filters, limit, offset, sortBy, sortOrder, }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
        doctorMedicalRecords(_: any, { doctor_id, limit, offset, dateFrom, dateTo }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
        searchMedicalRecords(_: any, { query, filters, limit, offset }: any, context: GraphQLContext): Promise<{
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
        createMedicalRecord(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        updateMedicalRecord(_: any, { id, input }: {
            id: string;
            input: any;
        }, context: GraphQLContext): Promise<any>;
        deleteMedicalRecord(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<boolean>;
    };
    MedicalRecord: {
        patient(parent: any, _: any, context: GraphQLContext): Promise<any>;
        doctor(parent: any, _: any, context: GraphQLContext): Promise<any>;
        appointment(parent: any, _: any, context: GraphQLContext): Promise<any>;
    };
    VitalSigns: {
        bloodPressureSystolic: (parent: any) => any;
        bloodPressureDiastolic: (parent: any) => any;
        heartRate: (parent: any) => any;
        temperature: (parent: any) => any;
        respiratoryRate: (parent: any) => any;
        oxygenSaturation: (parent: any) => any;
        height: (parent: any) => any;
        weight: (parent: any) => any;
        recorded_at: (parent: any) => any;
        recorded_by: (parent: any) => any;
        notes: (parent: any) => any;
        bmi(parent: any): number | null;
    };
};
export default medicalRecordsResolvers;
//# sourceMappingURL=medical-records.resolvers.d.ts.map