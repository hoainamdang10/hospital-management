import { GraphQLContext } from "../context";
/**
 * Doctor GraphQL Resolvers
 * Handles all doctor-related queries, mutations, and subscriptions
 */
export declare const doctorResolvers: {
    Query: {
        doctor(_: any, { id, doctor_id }: {
            id?: string;
            doctor_id?: string;
        }, context: GraphQLContext): Promise<any>;
        doctors(_: any, { filters, limit, offset, sortBy, sortOrder, }: {
            filters?: any;
            limit?: number;
            offset?: number;
            sortBy?: string;
            sortOrder?: string;
        }, context: GraphQLContext): Promise<{
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
        searchDoctors(_: any, { query, filters, limit, offset, }: {
            query: string;
            filters?: any;
            limit?: number;
            offset?: number;
        }, context: GraphQLContext): Promise<{
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
        doctorAvailability(_: any, { doctor_id, date }: {
            doctor_id: string;
            date: string;
        }, context: GraphQLContext): Promise<any>;
        doctorStats(_: any, { doctor_id }: {
            doctor_id: string;
        }, context: GraphQLContext): Promise<any>;
        doctorReviews(_: any, { doctor_id, limit, offset, }: {
            doctor_id: string;
            limit?: number;
            offset?: number;
        }, context: GraphQLContext): Promise<any>;
        doctorSchedule(_: any, { doctor_id, date }: {
            doctor_id: string;
            date?: string;
        }, context: GraphQLContext): Promise<any>;
        doctorScheduleEnhanced(_: any, { doctor_id, weekStartDate, }: {
            doctor_id: string;
            weekStartDate?: string;
        }, context: GraphQLContext): Promise<any>;
        doctorWeeklyAvailability(_: any, { doctor_id, weekStartDate, }: {
            doctor_id: string;
            weekStartDate: string;
        }, context: GraphQLContext): Promise<any>;
        doctorAppointmentSlots(_: any, { doctor_id, date }: {
            doctor_id: string;
            date: string;
        }, context: GraphQLContext): Promise<any>;
        room(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        rooms(_: any, { departmentId, roomType, is_active, limit }: any, context: GraphQLContext): Promise<any>;
    };
    Mutation: {
        createDoctor(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        updateDoctor(_: any, { id, input }: {
            id: string;
            input: any;
        }, context: GraphQLContext): Promise<any>;
        deleteDoctor(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<boolean>;
        createDoctorReview(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        updateDoctorReview(_: any, { id, rating, comment, }: {
            id: string;
            rating?: number;
            comment?: string;
        }, context: GraphQLContext): Promise<any>;
        deleteDoctorReview(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<boolean>;
    };
    Doctor: {
        department(parent: any, _: any, context: GraphQLContext): Promise<any>;
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
        reviews(parent: any, { limit, offset }: any, context: GraphQLContext): Promise<{
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
        averageRating(parent: any, _: any, context: GraphQLContext): Promise<any>;
        totalPatients(parent: any, _: any, context: GraphQLContext): Promise<any>;
        totalAppointments(parent: any, _: any, context: GraphQLContext): Promise<any>;
        upcomingAppointments(parent: any, _: any, context: GraphQLContext): Promise<any>;
        availableToday(parent: any, _: any, context: GraphQLContext): Promise<boolean>;
    };
    DoctorReview: {
        serviceQuality: (parent: any) => any;
        isVerified: (parent: any) => any;
        isAnonymous: (parent: any) => any;
        created_at: (parent: any) => any;
        updated_at: (parent: any) => any;
        doctor(parent: any, _: any, context: GraphQLContext): Promise<any>;
        patient(parent: any, _: any, context: GraphQLContext): Promise<any>;
        appointment(parent: any, _: any, context: GraphQLContext): Promise<any>;
    };
    DoctorSchedule: {
        dayOfWeek: (parent: any) => any;
        startTime: (parent: any) => any;
        endTime: (parent: any) => any;
        templateId: (parent: any) => any;
        breakPeriods: (parent: any) => {
            startTime: any;
            endTime: any;
            breakType: any;
        }[];
        slotDuration: (parent: any) => any;
        bufferTime: (parent: any) => any;
        maxAppointments: (parent: any) => any;
        isAvailable: (parent: any) => any;
        availabilityType: (parent: any) => any;
        departmentRules: (parent: any) => any;
        effectiveFrom: (parent: any) => any;
        effectiveTo: (parent: any) => any;
        is_active: (parent: any) => any;
        created_at: (parent: any) => any;
        updated_at: (parent: any) => any;
        doctor(parent: any, _: any, context: GraphQLContext): Promise<any>;
        room(parent: any, _: any, context: GraphQLContext): Promise<any>;
    };
    Room: {
        roomNumber: (parent: any) => any;
        roomType: (parent: any) => any;
        departmentId: (parent: any) => any;
        currentOccupancy: (parent: any) => any;
        floorNumber: (parent: any) => any;
        dailyRate: (parent: any) => any;
        equipmentIds: (parent: any) => any;
        is_active: (parent: any) => any;
        created_at: (parent: any) => any;
        updated_at: (parent: any) => any;
        department(parent: any, _: any, context: GraphQLContext): Promise<any>;
    };
};
export default doctorResolvers;
//# sourceMappingURL=doctor.resolvers.d.ts.map