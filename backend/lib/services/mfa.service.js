"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mfaService = void 0;
const server_1 = require("../supabase/server");
class MFAService {
    isMFARequired(role) {
        return ["staff", "doctor", "admin"].includes(role);
    }
    async getUserMFAStatus() {
        try {
            const { data: profileData, error: profileError } = await server_1.supabaseAdmin
                .from("profiles")
                .select("role")
                .eq("id", (await server_1.supabaseAdmin.auth.getUser()).data.user?.id)
                .single();
            if (profileError) {
                throw new Error(`Failed to get user profile: ${profileError.message}`);
            }
            const mfaRequired = this.isMFARequired(profileData.role);
            const { data: factorsData, error: factorsError } = await server_1.supabaseAdmin.auth.mfa.listFactors();
            if (factorsError) {
                throw new Error(`Failed to list MFA factors: ${factorsError.message}`);
            }
            const { data: aalData, error: aalError } = await server_1.supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalError) {
                throw new Error(`Failed to get AAL level: ${aalError.message}`);
            }
            const mfaEnrolled = aalData.currentLevel === "aal2";
            const currentAAL = aalData.currentLevel || "aal1";
            let lastVerification;
            if (mfaEnrolled) {
                const { data: auditData } = await server_1.supabaseAdmin
                    .from("mfa_audit_log")
                    .select("created_at")
                    .eq("user_id", (await server_1.supabaseAdmin.auth.getUser()).data.user?.id)
                    .eq("action", "mfa_verification_success")
                    .eq("success", true)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                if (auditData) {
                    lastVerification = new Date(auditData.created_at);
                }
            }
            return {
                mfaRequired,
                mfaEnrolled,
                currentAAL,
                factors: [...factorsData.totp, ...factorsData.phone],
                lastVerification,
            };
        }
        catch (error) {
            console.error("Error getting MFA status:", error);
            throw error;
        }
    }
    async enrollTOTP(friendlyName = "Hospital Staff MFA") {
        try {
            const { data, error } = await server_1.supabaseAdmin.auth.mfa.enroll({
                factorType: "totp",
                friendlyName,
            });
            if (error) {
                throw new Error(`MFA enrollment failed: ${error.message}`);
            }
            await this.logMFAAudit("mfa_enrollment_started", "totp", data.id, true, {
                friendly_name: friendlyName,
            });
            return {
                factorId: data.id,
                qrCode: data.totp.qr_code,
                secret: data.totp.secret,
                friendlyName: data.totp.friendly_name,
            };
        }
        catch (error) {
            console.error("Error enrolling TOTP:", error);
            throw error;
        }
    }
    async challengeTOTP(factorId) {
        try {
            const { data, error } = await server_1.supabaseAdmin.auth.mfa.challenge({
                factorId,
            });
            if (error) {
                throw new Error(`MFA challenge failed: ${error.message}`);
            }
            await this.logMFAAudit("mfa_challenge_created", "totp", factorId, true, {
                challenge_id: data.id,
            });
            return data.id;
        }
        catch (error) {
            console.error("Error challenging TOTP:", error);
            throw error;
        }
    }
    async verifyTOTP(factorId, challengeId, code) {
        try {
            const { data, error } = await server_1.supabaseAdmin.auth.mfa.verify({
                factorId,
                challengeId,
                code,
            });
            if (error) {
                await this.logMFAAudit("mfa_verification_failed", "totp", factorId, false, {
                    challenge_id: challengeId,
                    error: error.message,
                });
                return {
                    success: false,
                    message: error.message,
                };
            }
            await this.logMFAAudit("mfa_verification_success", "totp", factorId, true, {
                challenge_id: challengeId,
            });
            return {
                success: true,
                message: "MFA verification successful",
                factorId,
                challengeId,
            };
        }
        catch (error) {
            console.error("Error verifying TOTP:", error);
            await this.logMFAAudit("mfa_verification_error", "totp", factorId, false, {
                challenge_id: challengeId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    async unenrollTOTP(factorId) {
        try {
            const { error } = await server_1.supabaseAdmin.auth.mfa.unenroll({ factorId });
            if (error) {
                throw new Error(`MFA unenrollment failed: ${error.message}`);
            }
            await this.logMFAAudit("mfa_unenrollment_success", "totp", factorId, true);
            return true;
        }
        catch (error) {
            console.error("Error unenrolling TOTP:", error);
            await this.logMFAAudit("mfa_unenrollment_failed", "totp", factorId, false, {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    async completeEnrollment(factorId, code) {
        try {
            const challengeId = await this.challengeTOTP(factorId);
            const result = await this.verifyTOTP(factorId, challengeId, code);
            if (result.success) {
                await this.logMFAAudit("mfa_enrollment_completed", "totp", factorId, true);
                return true;
            }
            else {
                throw new Error(result.message);
            }
        }
        catch (error) {
            console.error("Error completing MFA enrollment:", error);
            throw error;
        }
    }
    async needsMFAVerification() {
        try {
            const { data, error } = await server_1.supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel();
            if (error) {
                throw new Error(`Failed to get AAL level: ${error.message}`);
            }
            const needsMFA = data.nextLevel === "aal2" && data.currentLevel !== data.nextLevel;
            let factors = [];
            if (needsMFA) {
                const factorsData = await server_1.supabaseAdmin.auth.mfa.listFactors();
                factors = [...factorsData.data.totp, ...factorsData.data.phone];
            }
            return {
                needsMFA,
                currentLevel: data.currentLevel || "aal1",
                nextLevel: data.nextLevel || "aal1",
                factors,
            };
        }
        catch (error) {
            console.error("Error checking MFA verification need:", error);
            throw error;
        }
    }
    async logMFAAudit(action, factorType, factorId, success, details) {
        try {
            const user = (await server_1.supabaseAdmin.auth.getUser()).data.user;
            if (!user)
                return;
            await server_1.supabaseAdmin.from("mfa_audit_log").insert({
                user_id: user.id,
                action,
                factor_type: factorType,
                factor_id: factorId,
                success,
                details: details || {},
                ip_address: "0.0.0.0",
                user_agent: "MFA Service",
            });
        }
        catch (error) {
            console.error("Failed to log MFA audit:", error);
        }
    }
    async getMFAAuditHistory(limit = 50) {
        try {
            const user = (await server_1.supabaseAdmin.auth.getUser()).data.user;
            if (!user)
                return [];
            const { data, error } = await server_1.supabaseAdmin
                .from("mfa_audit_log")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error) {
                throw new Error(`Failed to get MFA audit history: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error("Error getting MFA audit history:", error);
            return [];
        }
    }
    async validateMFACompliance() {
        try {
            const status = await this.getUserMFAStatus();
            const issues = [];
            const recommendations = [];
            if (status.mfaRequired && !status.mfaEnrolled) {
                issues.push("MFA is required for your role but not enrolled");
                recommendations.push("Please enroll in MFA to access hospital systems");
            }
            if (!status.mfaRequired && status.mfaEnrolled) {
                recommendations.push("MFA is optional for your role but provides additional security");
            }
            if (status.mfaRequired && status.mfaEnrolled) {
                recommendations.push("MFA is properly configured for your role");
            }
            if (status.lastVerification) {
                const daysSinceVerification = Math.floor((Date.now() - status.lastVerification.getTime()) /
                    (1000 * 60 * 60 * 24));
                if (daysSinceVerification > 30) {
                    issues.push("MFA verification is older than 30 days");
                    recommendations.push("Consider re-verifying your MFA setup");
                }
            }
            return {
                compliant: issues.length === 0,
                issues,
                recommendations,
            };
        }
        catch (error) {
            console.error("Error validating MFA compliance:", error);
            return {
                compliant: false,
                issues: ["Unable to validate MFA compliance"],
                recommendations: ["Please contact system administrator"],
            };
        }
    }
}
exports.mfaService = new MFAService();
exports.default = exports.mfaService;
//# sourceMappingURL=mfa.service.js.map