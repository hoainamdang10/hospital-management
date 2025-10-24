/**
 * Test Setup Configuration
 * Global test setup with Vietnamese healthcare context and mocks
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Testing Best Practices
 */
export declare const VIETNAMESE_HEALTHCARE_CONSTANTS: {
    PATIENT_ID: string;
    DOCTOR_ID: string;
    APPOINTMENT_ID: string;
    MEDICAL_RECORD_ID: string;
    INVOICE_ID: string;
    NOTIFICATION_ID: string;
    PATIENT_NAME: string;
    DOCTOR_NAME: string;
    HOSPITAL_NAME: string;
    PHONE_NUMBER: string;
    EMAIL: string;
    APPOINTMENT_DATE: string;
    APPOINTMENT_TIME: string;
    ROOM_NUMBER: string;
    VIETNAMESE_MESSAGES: {
        APPOINTMENT_REMINDER: string;
        TEST_RESULTS_READY: string;
        PAYMENT_REMINDER: string;
        EMERGENCY_ALERT: string;
        MEDICATION_REMINDER: string;
    };
};
export declare const mockSupabaseClient: {
    from: jest.Mock<{
        select: jest.Mock<any, any, any>;
        insert: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
        eq: jest.Mock<any, any, any>;
        neq: jest.Mock<any, any, any>;
        gt: jest.Mock<any, any, any>;
        gte: jest.Mock<any, any, any>;
        lt: jest.Mock<any, any, any>;
        lte: jest.Mock<any, any, any>;
        like: jest.Mock<any, any, any>;
        ilike: jest.Mock<any, any, any>;
        in: jest.Mock<any, any, any>;
        contains: jest.Mock<any, any, any>;
        order: jest.Mock<any, any, any>;
        limit: jest.Mock<any, any, any>;
        range: jest.Mock<any, any, any>;
        single: jest.Mock<any, any, any>;
        maybeSingle: jest.Mock<any, any, any>;
    }, [], any>;
    auth: {
        getUser: jest.Mock<any, any, any>;
    };
    rpc: jest.Mock<any, any, any>;
};
export declare const mockRabbitMQConnection: {
    createChannel: jest.Mock<any, any, any>;
    close: jest.Mock<any, any, any>;
};
export declare const mockSocketIOServer: {
    on: jest.Mock<any, any, any>;
    emit: jest.Mock<any, any, any>;
    to: jest.Mock<any, any, any>;
    join: jest.Mock<any, any, any>;
    leave: jest.Mock<any, any, any>;
    disconnect: jest.Mock<any, any, any>;
};
export declare const mockSocketIOClient: {
    on: jest.Mock<any, any, any>;
    emit: jest.Mock<any, any, any>;
    disconnect: jest.Mock<any, any, any>;
    connected: boolean;
    id: string;
};
export declare const generateVietnameseTestData: {
    patient: () => {
        patientId: string;
        fullName: string;
        phoneNumber: string;
        email: string;
        dateOfBirth: string;
        address: string;
        insuranceNumber: string;
    };
    doctor: () => {
        doctorId: string;
        fullName: string;
        specialization: string;
        licenseNumber: string;
        phoneNumber: string;
        email: string;
    };
    appointment: () => {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        appointmentTime: string;
        roomNumber: string;
        status: string;
        notes: string;
    };
    notification: () => {
        notificationId: string;
        recipientId: string;
        recipientType: string;
        templateType: string;
        channels: string[];
        priority: string;
        status: string;
        templateData: {
            patientName: string;
            doctorName: string;
            appointmentDate: string;
            appointmentTime: string;
            roomNumber: string;
            hospitalName: string;
        };
        metadata: {
            healthcareContext: {
                patientId: string;
                doctorId: string;
                appointmentId: string;
            };
            tags: string[];
            source: string;
        };
        createdAt: Date;
        updatedAt: Date;
    };
    integrationEvent: () => {
        eventId: string;
        eventType: string;
        aggregateId: string;
        aggregateType: string;
        serviceName: string;
        eventVersion: string;
        eventData: {
            appointmentId: string;
            patientId: string;
            doctorId: string;
            patientName: string;
            doctorName: string;
            appointmentDate: string;
            appointmentTime: string;
            roomNumber: string;
        };
        occurredAt: Date;
        version: number;
        metadata: {
            correlationId: string;
            userId: string;
            source: string;
        };
    };
};
export declare const testUtils: {
    waitFor: (ms: number) => Promise<unknown>;
    generateVietnameseName: () => string;
    generateVietnamesePhone: () => string;
    isVietnameseText: (text: string) => boolean;
};
declare const _default: {
    VIETNAMESE_HEALTHCARE_CONSTANTS: {
        PATIENT_ID: string;
        DOCTOR_ID: string;
        APPOINTMENT_ID: string;
        MEDICAL_RECORD_ID: string;
        INVOICE_ID: string;
        NOTIFICATION_ID: string;
        PATIENT_NAME: string;
        DOCTOR_NAME: string;
        HOSPITAL_NAME: string;
        PHONE_NUMBER: string;
        EMAIL: string;
        APPOINTMENT_DATE: string;
        APPOINTMENT_TIME: string;
        ROOM_NUMBER: string;
        VIETNAMESE_MESSAGES: {
            APPOINTMENT_REMINDER: string;
            TEST_RESULTS_READY: string;
            PAYMENT_REMINDER: string;
            EMERGENCY_ALERT: string;
            MEDICATION_REMINDER: string;
        };
    };
    mockSupabaseClient: {
        from: jest.Mock<{
            select: jest.Mock<any, any, any>;
            insert: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
            delete: jest.Mock<any, any, any>;
            eq: jest.Mock<any, any, any>;
            neq: jest.Mock<any, any, any>;
            gt: jest.Mock<any, any, any>;
            gte: jest.Mock<any, any, any>;
            lt: jest.Mock<any, any, any>;
            lte: jest.Mock<any, any, any>;
            like: jest.Mock<any, any, any>;
            ilike: jest.Mock<any, any, any>;
            in: jest.Mock<any, any, any>;
            contains: jest.Mock<any, any, any>;
            order: jest.Mock<any, any, any>;
            limit: jest.Mock<any, any, any>;
            range: jest.Mock<any, any, any>;
            single: jest.Mock<any, any, any>;
            maybeSingle: jest.Mock<any, any, any>;
        }, [], any>;
        auth: {
            getUser: jest.Mock<any, any, any>;
        };
        rpc: jest.Mock<any, any, any>;
    };
    mockRabbitMQConnection: {
        createChannel: jest.Mock<any, any, any>;
        close: jest.Mock<any, any, any>;
    };
    mockSocketIOServer: {
        on: jest.Mock<any, any, any>;
        emit: jest.Mock<any, any, any>;
        to: jest.Mock<any, any, any>;
        join: jest.Mock<any, any, any>;
        leave: jest.Mock<any, any, any>;
        disconnect: jest.Mock<any, any, any>;
    };
    mockSocketIOClient: {
        on: jest.Mock<any, any, any>;
        emit: jest.Mock<any, any, any>;
        disconnect: jest.Mock<any, any, any>;
        connected: boolean;
        id: string;
    };
    generateVietnameseTestData: {
        patient: () => {
            patientId: string;
            fullName: string;
            phoneNumber: string;
            email: string;
            dateOfBirth: string;
            address: string;
            insuranceNumber: string;
        };
        doctor: () => {
            doctorId: string;
            fullName: string;
            specialization: string;
            licenseNumber: string;
            phoneNumber: string;
            email: string;
        };
        appointment: () => {
            appointmentId: string;
            patientId: string;
            doctorId: string;
            appointmentDate: string;
            appointmentTime: string;
            roomNumber: string;
            status: string;
            notes: string;
        };
        notification: () => {
            notificationId: string;
            recipientId: string;
            recipientType: string;
            templateType: string;
            channels: string[];
            priority: string;
            status: string;
            templateData: {
                patientName: string;
                doctorName: string;
                appointmentDate: string;
                appointmentTime: string;
                roomNumber: string;
                hospitalName: string;
            };
            metadata: {
                healthcareContext: {
                    patientId: string;
                    doctorId: string;
                    appointmentId: string;
                };
                tags: string[];
                source: string;
            };
            createdAt: Date;
            updatedAt: Date;
        };
        integrationEvent: () => {
            eventId: string;
            eventType: string;
            aggregateId: string;
            aggregateType: string;
            serviceName: string;
            eventVersion: string;
            eventData: {
                appointmentId: string;
                patientId: string;
                doctorId: string;
                patientName: string;
                doctorName: string;
                appointmentDate: string;
                appointmentTime: string;
                roomNumber: string;
            };
            occurredAt: Date;
            version: number;
            metadata: {
                correlationId: string;
                userId: string;
                source: string;
            };
        };
    };
    testUtils: {
        waitFor: (ms: number) => Promise<unknown>;
        generateVietnameseName: () => string;
        generateVietnamesePhone: () => string;
        isVietnameseText: (text: string) => boolean;
    };
};
export default _default;
//# sourceMappingURL=setup.d.ts.map