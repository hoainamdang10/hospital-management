import { GraphQLContext } from "../context";
/**
 * Department GraphQL Resolvers
 * Handles all department-related queries, mutations, and subscriptions
 */
export declare const departmentResolvers: {
    Query: {
        department(_: any, { id, departmentId }: {
            id?: string;
            departmentId?: string;
        }, context: GraphQLContext): Promise<{
            id: any;
            departmentId: any;
            name: any;
            nameVi: any;
            nameEn: any;
            description: any;
            code: any;
            type: any;
            floor: any;
            building: any;
            phoneNumber: any;
            email: any;
            status: string;
            is_active: any;
            emergencyAvailable: any;
            totalRooms: any;
            availableRooms: any;
            totalBeds: any;
            availableBeds: any;
            maxPatients: any;
            created_at: any;
            updated_at: any;
            currentPatients: number;
            todayAppointments: number;
            availabilityRate: number;
            occupancyRate: number;
        }>;
        departments(_: any, { filters, limit, offset, sortBy, sortOrder, }: {
            filters?: any;
            limit?: number;
            offset?: number;
            sortBy?: string;
            sortOrder?: string;
        }, context: GraphQLContext): Promise<{
            id: any;
            departmentId: any;
            name: any;
            nameVi: any;
            nameEn: any;
            description: any;
            code: any;
            type: any;
            floor: any;
            building: any;
            phoneNumber: any;
            email: any;
            status: string;
            is_active: any;
            emergencyAvailable: any;
            totalRooms: any;
            availableRooms: any;
            totalBeds: any;
            availableBeds: any;
            maxPatients: any;
            created_at: any;
            updated_at: any;
            currentPatients: number;
            todayAppointments: number;
            availabilityRate: number;
            occupancyRate: number;
        }[]>;
        departmentStats(_: any, { departmentId }: {
            departmentId: string;
        }, context: GraphQLContext): Promise<{
            departmentId: string;
            totalDoctors: number;
            activeDoctors: number;
            totalRooms: number;
            availableRooms: number;
            totalEquipment: number;
            operationalEquipment: number;
            todayAppointments: number;
            thisWeekAppointments: number;
            thisMonthAppointments: number;
            completedAppointments: number;
            cancelledAppointments: number;
            totalPatients: number;
            newPatients: number;
            returningPatients: number;
            revenue: {
                today: number;
                thisWeek: number;
                thisMonth: number;
                thisYear: number;
                currency: string;
            };
            averageWaitTime: number;
            averageConsultationTime: number;
            patientSatisfactionScore: number;
            occupancyRate: number;
        }>;
    };
    Mutation: {
        createDepartment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<never>;
        updateDepartment(_: any, { id, input }: {
            id: string;
            input: any;
        }, context: GraphQLContext): Promise<never>;
        deleteDepartment(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<never>;
    };
    Department: {
        head(parent: any, _: any, context: GraphQLContext): Promise<any>;
        doctors(parent: any, args: any, context: GraphQLContext): Promise<{
            nodes: never[];
            totalCount: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        }>;
        rooms(parent: any, args: any, context: GraphQLContext): Promise<never[]>;
        equipment(parent: any, args: any, context: GraphQLContext): Promise<never[]>;
        appointments(parent: any, args: any, context: GraphQLContext): Promise<{
            nodes: never[];
            totalCount: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        }>;
    };
};
export default departmentResolvers;
//# sourceMappingURL=department.resolvers.d.ts.map