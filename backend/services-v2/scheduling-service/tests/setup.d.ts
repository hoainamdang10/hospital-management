/**
 * Test Setup Configuration
 * V2 Clean Architecture + DDD Implementation
 * Global test setup and configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidDate(): R;
            toBeValidUUID(): R;
            toBeValidVietnamesePhone(): R;
            toBeValidVietnameseNationalId(): R;
            toMatchAppointmentIdPattern(): R;
        }
    }
}
export declare const TEST_CONSTANTS: {
    DATES: {
        MOCK_NOW: Date;
        TOMORROW: Date;
        NEXT_WEEK: Date;
        YESTERDAY: Date;
    };
    PATIENT: {
        ID: string;
        NAME: string;
        PHONE: string;
        DATE_OF_BIRTH: string;
        NATIONAL_ID: string;
        EMAIL: string;
    };
    PROVIDER: {
        ID: string;
        NAME: string;
        SPECIALIZATION: string;
        DEPARTMENT: string;
        LICENSE: string;
    };
    APPOINTMENT: {
        ROOM_ID: string;
        REASON: string;
        DURATION: number;
        URGENCY_LEVEL: string;
    };
};
export declare function cleanupTestData(): Promise<void>;
//# sourceMappingURL=setup.d.ts.map