interface MFAFactor {
    id: string;
    friendly_name: string;
    factor_type: "totp" | "phone";
    status: "unverified" | "verified";
    created_at: string;
    updated_at: string;
}
interface MFAEnrollmentResult {
    factorId: string;
    qrCode: string;
    secret: string;
    friendlyName: string;
}
interface MFAVerificationResult {
    success: boolean;
    message: string;
    factorId?: string;
    challengeId?: string;
}
declare class MFAService {
    isMFARequired(role: string): boolean;
    getUserMFAStatus(): Promise<{
        mfaRequired: boolean;
        mfaEnrolled: boolean;
        currentAAL: string;
        factors: MFAFactor[];
        lastVerification?: Date;
    }>;
    enrollTOTP(friendlyName?: string): Promise<MFAEnrollmentResult>;
    challengeTOTP(factorId: string): Promise<string>;
    verifyTOTP(factorId: string, challengeId: string, code: string): Promise<MFAVerificationResult>;
    unenrollTOTP(factorId: string): Promise<boolean>;
    completeEnrollment(factorId: string, code: string): Promise<boolean>;
    needsMFAVerification(): Promise<{
        needsMFA: boolean;
        currentLevel: string;
        nextLevel: string;
        factors: MFAFactor[];
    }>;
    private logMFAAudit;
    getMFAAuditHistory(limit?: number): Promise<any[]>;
    validateMFACompliance(): Promise<{
        compliant: boolean;
        issues: string[];
        recommendations: string[];
    }>;
}
export declare const mfaService: MFAService;
export default mfaService;
//# sourceMappingURL=mfa.service.d.ts.map