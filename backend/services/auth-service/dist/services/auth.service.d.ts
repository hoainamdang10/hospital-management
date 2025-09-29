export interface SignUpData {
    email: string;
    password: string;
    full_name: string;
    role: "admin" | "doctor" | "patient" | "receptionist";
    phone_number?: string;
    gender?: "male" | "female" | "other";
    date_of_birth?: string;
    specialty?: string;
    license_number?: string;
    qualification?: string;
    department_id?: string;
    address?: any;
    emergency_contact?: any;
    insurance_info?: any;
    blood_type?: string;
}
export interface AuthResponse {
    user?: {
        id: string;
        email?: string;
        full_name?: string;
        role?: string;
        email_confirmed_at?: string;
        created_at?: string;
        patient_id?: string;
        doctor_id?: string;
        admin_id?: string;
        phone_number?: string;
        is_active?: boolean;
        last_sign_in_at?: string;
        date_of_birth?: string;
        email_verified?: boolean;
        permissions?: string[];
        role_data?: any;
        token_version?: string;
        receptionist_id?: string;
    } | null;
    session?: any;
    error?: string;
    url?: string;
    details?: {
        validation?: any;
        recommendations?: string[];
    };
    securityInfo?: {
        riskLevel?: string;
        riskScore?: number;
        sessionInfo?: any;
        risk_level?: string;
        risk_score?: number;
        security_info?: any;
        session_info?: any;
    } | any;
}
export declare class AuthService {
    private pool;
    private supabase;
    private generateDoctorId;
    private generatePatientId;
    private generateAdminId;
    private generateAdminIdFallback;
    signUp(userData: SignUpData): Promise<AuthResponse>;
    private validatePasswordPolicy;
    private logAuditEvent;
    signIn(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse>;
    signOut(token: string): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    resetPassword(email: string): Promise<AuthResponse>;
    verifyToken(token: string): Promise<AuthResponse>;
    private createRoleSpecificRecord;
    private forceRefreshSchemaCache;
    createDoctorRecord(userId: string, userData: SignUpData): Promise<void>;
    createPatientRecord(userId: string, userData: SignUpData): Promise<void>;
    private createAdminRecord;
    private createReceptionistRecord;
    private generateReceptionistId;
    private generateReceptionistIdFallback;
    sendMagicLink(email: string): Promise<AuthResponse>;
    sendPhoneOTP(phoneNumber: string): Promise<AuthResponse>;
    verifyPhoneOTP(phoneNumber: string, otpCode: string): Promise<AuthResponse>;
    initiateOAuth(provider: "google" | "github" | "facebook" | "apple"): Promise<AuthResponse & {
        url?: string;
    }>;
    handleOAuthCallback(code: string, state: string, provider?: string): Promise<AuthResponse>;
    checkEmailAvailability(email: string): Promise<boolean>;
}
//# sourceMappingURL=auth.service.d.ts.map