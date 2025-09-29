import { GraphQLScalarType } from "graphql";
import { GraphQLContext } from "../context";
/**
 * Combined resolvers
 * Merges all entity resolvers with base resolvers and scalars
 */
export declare const resolvers: {
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
        appointment(_: any, { id, appointment_id }: {
            id?: string;
            appointment_id?: string;
        }, context: GraphQLContext): Promise<any>;
        appointments(_: any, { filters, limit, offset, sortBy, sortOrder, }: any, context: GraphQLContext): Promise<{
            edges: any;
            pageInfo: {
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                startCursor: string | null;
                endCursor: string | null;
            };
            totalCount: any;
        }>;
        todayAppointments(_: any, { doctor_id, departmentId, status }: any, context: GraphQLContext): Promise<any>;
        waitingQueue(_: any, { doctor_id, department_id, date, }: {
            doctor_id?: string;
            department_id?: string;
            date?: string;
        }, context: GraphQLContext): Promise<{
            appointment_id: any;
            doctor_id: any;
            patient_id: any;
            status: any;
            scheduled_time: any;
            scheduled_date_time: any;
            duration: any;
            checked_in_at: any;
        }[]>;
        upcomingAppointments(_: any, { doctor_id, patient_id, days, limit }: any, context: GraphQLContext): Promise<any>;
        availableSlots(_: any, { doctor_id, date, duration, }: {
            doctor_id: string;
            date: string;
            duration: number;
        }, context: GraphQLContext): Promise<any[]>;
        appointmentStats(_: any, { doctor_id, patient_id, departmentId, dateFrom, dateTo }: any, context: GraphQLContext): Promise<any>;
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
        health: (_: any, __: any, context: GraphQLContext) => Promise<{
            status: string;
            timestamp: string;
            version: string;
            services: {
                name: string;
                status: string;
                url: string;
                responseTime: number;
                lastCheck: string;
            }[];
            database: {
                status: string;
                connectionCount: number;
                responseTime: number;
                lastCheck: string;
            };
            uptime: number;
        }>;
        systemInfo: (_: any, __: any, context: GraphQLContext) => Promise<{
            name: string;
            version: string;
            environment: string;
            graphqlVersion: string;
            apolloVersion: string;
            nodeVersion: string;
            uptime: number;
            memoryUsage: {
                used: number;
                total: number;
                percentage: number;
            };
            features: string[];
        }>;
        globalSearch: (_: any, { query, types, limit, }: {
            query: string;
            types: string[];
            limit: number;
        }, context: GraphQLContext) => Promise<{
            doctors: never[];
            patients: never[];
            appointments: never[];
            departments: never[];
            medicalRecords: never[];
            totalCount: number;
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
        createAppointment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        updateAppointment(_: any, { id, input }: {
            id: string;
            input: any;
        }, context: GraphQLContext): Promise<any>;
        cancelAppointment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        confirmAppointment(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<any>;
        rescheduleAppointment(_: any, { input }: {
            input: any;
        }, context: GraphQLContext): Promise<any>;
        checkInAppointment(_: any, { id }: {
            id: string;
        }, context: GraphQLContext): Promise<never>;
        completeAppointment(_: any, { id, notes }: {
            id: string;
            notes?: string;
        }, context: GraphQLContext): Promise<any>;
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
        _empty: () => string;
    };
    Subscription: {
        appointmentUpdated: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        appointmentStatusChanged: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        doctorAppointmentUpdated: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        patientAppointmentUpdated: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        newAppointmentCreated: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        waitingQueueUpdated: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        patientStatusChanged: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        patientUpdated: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        doctorStatusChanged: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        doctorScheduleChanged: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        doctorAvailabilityChanged: {
            subscribe: import("graphql-subscriptions").ResolverFn;
        };
        systemNotification: {
            subscribe: () => AsyncIterator<unknown, any, any>;
        };
        globalUpdate: {
            subscribe: () => AsyncIterator<unknown, any, any>;
        };
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
    Appointment: {
        endDateTime(parent: any): string | null;
        doctor(parent: any, _: any, context: GraphQLContext): Promise<any>;
        patient(parent: any, _: any, context: GraphQLContext): Promise<any>;
        department(parent: any, _: any, context: GraphQLContext): Promise<any>;
        isToday(parent: any): boolean;
        isUpcoming(parent: any): boolean;
        isPast(parent: any): boolean;
        canCancel(parent: any): boolean;
        canReschedule(parent: any): boolean;
        timeUntilAppointment(parent: any): number | null;
        waitingTime(parent: any): number | null;
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
    Date: GraphQLScalarType<Date, string>;
    DateTime: GraphQLScalarType<Date, string>;
    Time: GraphQLScalarType<string, string>;
    PhoneNumber: GraphQLScalarType<string, string>;
    LicenseNumber: GraphQLScalarType<string, string>;
    DoctorID: GraphQLScalarType<string, string>;
    PatientID: GraphQLScalarType<string, string>;
    UUID: GraphQLScalarType<string, string>;
};
export default resolvers;
//# sourceMappingURL=index.d.ts.map