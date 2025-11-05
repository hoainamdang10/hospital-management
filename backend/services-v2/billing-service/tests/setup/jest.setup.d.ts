/**
 * Jest Setup Configuration
 * Global test setup for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest Testing, Environment Setup, Vietnamese Healthcare Testing
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidVietnamesePhoneNumber(): R;
            toBeValidBHYTNumber(): R;
            toBeValidBHTNNumber(): R;
            toBeValidInvoiceId(): R;
            toBeValidPatientId(): R;
            toBeValidDoctorId(): R;
            toBeValidVNDAmount(): R;
            toContainVietnameseText(): R;
        }
    }
}
export declare const TestDataFactory: {
    createValidBillingAggregate: () => {
        invoiceId: string;
        patientId: string;
        doctorId: string;
        medicalRecordId: string;
        appointmentId: string;
        status: string;
        items: never[];
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        insuranceCoverage: number;
        patientPayment: number;
        createdAt: Date;
        updatedAt: Date;
    };
    createValidBillingItem: () => {
        serviceCode: string;
        serviceName: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        category: "CONSULTATION";
        description: string;
    };
    createValidBHYTInsurance: () => {
        type: "BHYT";
        policyNumber: string;
        beneficiaryName: string;
        validFrom: Date;
        validTo: Date;
        region: string;
        coverageLevel: number;
    };
    createValidBHTNInsurance: () => {
        type: "BHTN";
        policyNumber: string;
        beneficiaryName: string;
        validFrom: Date;
        validTo: Date;
        coverageLevel: number;
    };
    createValidPayment: () => {
        paymentMethod: "CASH";
        amount: number;
        currency: string;
        transactionId: string;
        processedAt: Date;
        status: "COMPLETED";
    };
};
export declare const TestUtils: {
    sleep: (ms: number) => Promise<unknown>;
    generateRandomInvoiceId: () => string;
    generateRandomPatientId: () => string;
    formatVNDAmount: (amount: number) => string;
};
//# sourceMappingURL=jest.setup.d.ts.map