"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_1 = require("../config/supabase");
const DEPARTMENT_CODES = {
    DEPT001: "CARD",
    DEPT002: "NEUR",
    DEPT003: "PEDI",
    DEPT004: "OBGY",
    DEPT005: "INTE",
    DEPT006: "SURG",
    DEPT007: "ORTH",
    DEPT008: "EMER",
    DEPT009: "OPHT",
    DEPT010: "ENT",
    DEPT011: "DERM",
    DEPT012: "ICU",
};
class AuthService {
    constructor() {
        this.pool = supabase_1.dbPool;
        this.supabase = supabase_1.supabaseAdmin;
    }
    async generateDoctorId(departmentId) {
        try {
            logger_1.default.info("Generating doctor ID for department:", departmentId);
            return await this.pool.executeQuery(async (client) => {
                const { data: doctorId, error } = await client.rpc("generate_doctor_id", { dept_id: departmentId });
                if (error) {
                    logger_1.default.error("Database function error for doctor ID generation:", error);
                    throw error;
                }
                if (!doctorId) {
                    throw new Error("Database function returned null doctor ID");
                }
                logger_1.default.info("Generated doctor ID via connection pool:", {
                    departmentId,
                    doctorId,
                });
                return doctorId;
            });
        }
        catch (error) {
            logger_1.default.error("Connection pool error in generateDoctorId:", error);
            try {
                const { data: doctorId, error: fallbackError } = await supabase_1.supabaseAdmin.rpc("generate_doctor_id", {
                    dept_id: departmentId,
                });
                if (fallbackError) {
                    logger_1.default.error("Fallback error for doctor ID generation:", fallbackError);
                    const departmentCode = DEPARTMENT_CODES[departmentId] || "GEN";
                    const yearMonth = new Date()
                        .toISOString()
                        .slice(0, 7)
                        .replace("-", "");
                    const timestamp = Date.now().toString().slice(-3);
                    const fallbackId = `${departmentCode}-DOC-${yearMonth}-${timestamp}`;
                    logger_1.default.warn("Using local fallback ID generation:", fallbackId);
                    return fallbackId;
                }
                if (!doctorId) {
                    throw new Error("Database function returned null doctor ID");
                }
                logger_1.default.info("Generated doctor ID via fallback:", {
                    departmentId,
                    doctorId,
                });
                return doctorId;
            }
            catch (fallbackError) {
                logger_1.default.error("Both pool and fallback failed in generateDoctorId:", fallbackError);
                const departmentCode = DEPARTMENT_CODES[departmentId] || "GEN";
                const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `${departmentCode}-DOC-${yearMonth}-${timestamp}`;
                logger_1.default.warn("Using emergency local ID generation:", fallbackId);
                return fallbackId;
            }
        }
    }
    async generatePatientId() {
        try {
            logger_1.default.info("Generating patient ID via database function");
            return await this.pool.executeQuery(async (client) => {
                const { data: patientId, error } = await client.rpc("generate_patient_id");
                if (error) {
                    logger_1.default.error("Database function error for patient ID generation:", error);
                    throw error;
                }
                if (!patientId) {
                    throw new Error("Database function returned null patient ID");
                }
                logger_1.default.info("Generated patient ID via connection pool:", patientId);
                return patientId;
            });
        }
        catch (error) {
            logger_1.default.error("Connection pool error in generatePatientId:", error);
            try {
                const { data: patientId, error: fallbackError } = await supabase_1.supabaseAdmin.rpc("generate_patient_id");
                if (fallbackError) {
                    logger_1.default.error("Fallback error for patient ID generation:", fallbackError);
                    const yearMonth = new Date()
                        .toISOString()
                        .slice(0, 7)
                        .replace("-", "");
                    const timestamp = Date.now().toString().slice(-3);
                    const fallbackId = `PAT-${yearMonth}-${timestamp}`;
                    logger_1.default.warn("Using local fallback ID generation:", fallbackId);
                    return fallbackId;
                }
                if (!patientId) {
                    throw new Error("Database function returned null patient ID");
                }
                logger_1.default.info("Generated patient ID via fallback:", patientId);
                return patientId;
            }
            catch (fallbackError) {
                logger_1.default.error("Both pool and fallback failed in generatePatientId:", fallbackError);
                const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `PAT-${yearMonth}-${timestamp}`;
                logger_1.default.warn("Using emergency local ID generation:", fallbackId);
                return fallbackId;
            }
        }
    }
    async generateAdminId() {
        try {
            logger_1.default.info("Generating admin ID via database function");
            const { data: adminId, error } = await supabase_1.supabaseAdmin.rpc("generate_admin_id");
            if (error) {
                logger_1.default.error("Database function error for admin ID generation:", error);
                return await this.generateAdminIdFallback();
            }
            if (!adminId) {
                throw new Error("Database function returned null admin ID");
            }
            logger_1.default.info("Generated admin ID via database function:", adminId);
            return adminId;
        }
        catch (error) {
            logger_1.default.error("Error in generateAdminId:", error);
            throw error;
        }
    }
    async generateAdminIdFallback() {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const prefix = `ADM-${year}${month}`;
            const { count, error } = await supabase_1.supabaseAdmin
                .from("admins")
                .select("*", { count: "exact", head: true })
                .like("admin_id", `${prefix}-%`);
            if (error) {
                logger_1.default.error("Error counting admins in fallback:", error);
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `${prefix}-${timestamp}`;
                logger_1.default.warn("Using timestamp-based fallback ID:", fallbackId);
                return fallbackId;
            }
            const sequence = String((count || 0) + 1).padStart(3, "0");
            const adminId = `${prefix}-${sequence}`;
            const adminIdPattern = /^ADM-\d{6}-\d{3}$/;
            if (!adminIdPattern.test(adminId)) {
                throw new Error(`Generated admin ID ${adminId} does not match expected pattern ADM-YYYYMM-XXX`);
            }
            logger_1.default.info(`Generated fallback admin ID: ${adminId} (sequence: ${sequence})`);
            return adminId;
        }
        catch (error) {
            logger_1.default.error("Error in generateAdminIdFallback:", error);
            throw error;
        }
    }
    async signUp(userData) {
        let authData = null;
        try {
            const passwordValidation = await this.validatePasswordPolicy(userData.password, userData.email, userData.full_name);
            if (!passwordValidation.is_valid) {
                logger_1.default.warn("Password validation failed:", {
                    email: userData.email,
                    errors: passwordValidation.errors,
                });
                return {
                    error: `Password does not meet security requirements: ${passwordValidation.errors.join(", ")}`,
                    details: {
                        validation: passwordValidation,
                        recommendations: passwordValidation.recommendations,
                    },
                };
            }
            logger_1.default.info("✅ Password validation passed:", {
                email: userData.email,
                strength_level: passwordValidation.strength_level,
                strength_score: passwordValidation.strength_score,
            });
            const { data: authDataResult, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
                user_metadata: {
                    full_name: userData.full_name,
                    role: userData.role,
                },
            });
            if (authError) {
                logger_1.default.error("Supabase auth error:", authError);
                return { error: authError.message };
            }
            if (!authDataResult.user) {
                return { error: "Failed to create user" };
            }
            authData = authDataResult;
            logger_1.default.info("✅ Auth user created successfully", {
                userId: authData.user.id,
                email: userData.email,
            });
            const profileData = {
                id: authData.user.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                phone_number: userData.phone_number || null,
                date_of_birth: userData.date_of_birth || null,
                email_verified: true,
                phone_verified: false,
                is_active: true,
                last_login: null,
                login_count: 0,
                created_by: null,
            };
            logger_1.default.info("Creating profile with data:", {
                userId: authData.user.id,
                email: userData.email,
                role: userData.role,
                phone_number: userData.phone_number,
                date_of_birth: userData.date_of_birth,
            });
            await this.pool.executeQuery(async (client) => {
                const { error: profileError } = await client
                    .from("profiles")
                    .insert(profileData);
                if (profileError) {
                    logger_1.default.error("❌ Profile creation error:", profileError);
                    throw new Error(`Profile creation failed: ${profileError.message}`);
                }
                logger_1.default.info("✅ Profile created successfully via connection pool", {
                    userId: authData.user.id,
                    phone_number: userData.phone_number,
                });
            });
            try {
                await this.createRoleSpecificRecord(authData.user.id, userData);
                logger_1.default.info("✅ Role-specific record created successfully", {
                    userId: authData.user.id,
                    role: userData.role,
                });
            }
            catch (roleError) {
                logger_1.default.error("❌ Role-specific record creation failed:", roleError);
                throw roleError;
            }
            const { data: signInData, error: signInError } = await supabase_1.supabaseClient.auth.signInWithPassword({
                email: userData.email,
                password: userData.password,
            });
            if (signInError) {
                logger_1.default.error("Auto sign-in after signup failed:", signInError);
            }
            let roleSpecificData = {};
            logger_1.default.info("🔍 [SignUp] Starting role-specific ID fetch after creation:", {
                role: userData.role,
                profile_id: authData.user.id,
                email: userData.email,
            });
            try {
                await new Promise((resolve) => setTimeout(resolve, 200));
                if (userData.role === "patient") {
                    logger_1.default.info("🔍 [SignUp] Fetching patient_id after creation for profile:", {
                        profile_id: authData.user.id,
                        email: userData.email,
                    });
                    const { data: patientData, error: patientError } = await supabase_1.supabaseAdmin
                        .from("patients")
                        .select("patient_id")
                        .eq("profile_id", authData.user.id)
                        .single();
                    logger_1.default.info("🔍 [SignUp] Patient query result:", {
                        patientData,
                        patientError,
                        profile_id: authData.user.id,
                    });
                    if (patientError) {
                        logger_1.default.warn("⚠️ [SignUp] Patient query error:", {
                            error: patientError.message,
                            code: patientError.code,
                            profile_id: authData.user.id,
                        });
                    }
                    if (patientData) {
                        logger_1.default.info("✅ [SignUp] Patient found after creation:", {
                            patient_id: patientData.patient_id,
                            profile_id: authData.user.id,
                        });
                        roleSpecificData = { patient_id: patientData.patient_id };
                        logger_1.default.info("🔍 [SignUp] roleSpecificData set to:", roleSpecificData);
                    }
                    else {
                        logger_1.default.warn("⚠️ [SignUp] No patient data found after creation for profile_id:", authData.user.id);
                    }
                }
                else if (userData.role === "doctor") {
                    logger_1.default.info("🔍 [SignUp] Fetching doctor_id after creation for profile:", {
                        profile_id: authData.user.id,
                        email: userData.email,
                    });
                    const { data: doctorData, error: doctorError } = await supabase_1.supabaseAdmin
                        .from("doctors")
                        .select("doctor_id")
                        .eq("profile_id", authData.user.id)
                        .single();
                    if (doctorError) {
                        logger_1.default.warn("⚠️ [SignUp] Doctor query error:", {
                            error: doctorError.message,
                            code: doctorError.code,
                            profile_id: authData.user.id,
                        });
                    }
                    if (doctorData) {
                        logger_1.default.info("✅ [SignUp] Doctor found after creation:", {
                            doctor_id: doctorData.doctor_id,
                            profile_id: authData.user.id,
                        });
                        roleSpecificData = { doctor_id: doctorData.doctor_id };
                    }
                }
                else if (userData.role === "admin") {
                    logger_1.default.info("🔍 [SignUp] Fetching admin_id after creation for profile:", {
                        profile_id: authData.user.id,
                        email: userData.email,
                    });
                    const { data: adminData, error: adminError } = await supabase_1.supabaseAdmin
                        .from("admins")
                        .select("admin_id")
                        .eq("profile_id", authData.user.id)
                        .single();
                    if (adminError) {
                        logger_1.default.warn("⚠️ [SignUp] Admin query error:", {
                            error: adminError.message,
                            code: adminError.code,
                            profile_id: authData.user.id,
                        });
                    }
                    if (adminData) {
                        logger_1.default.info("✅ [SignUp] Admin found after creation:", {
                            admin_id: adminData.admin_id,
                            profile_id: authData.user.id,
                        });
                        roleSpecificData = { admin_id: adminData.admin_id };
                    }
                }
            }
            catch (roleError) {
                logger_1.default.error("❌ [SignUp] Error fetching role-specific ID after signup:", {
                    error: roleError.message || "Unknown error",
                    stack: roleError.stack || "No stack trace",
                    role: userData.role,
                    profile_id: authData.user.id,
                });
            }
            logger_1.default.info("🔍 [SignUp] Final roleSpecificData before return:", roleSpecificData);
            logger_1.default.info("✅ User signup completed successfully", {
                userId: authData.user.id,
                email: authData.user.email,
                role: userData.role,
                roleSpecificData,
            });
            return {
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: userData.full_name,
                    role: userData.role,
                    email_confirmed_at: authData.user.email_confirmed_at,
                    created_at: authData.user.created_at,
                    ...roleSpecificData,
                },
                session: signInData?.session || null,
            };
        }
        catch (error) {
            logger_1.default.error("❌ Signup error, performing cleanup:", error);
            if (authData?.user?.id) {
                try {
                    if (userData.role === "doctor") {
                        await supabase_1.supabaseAdmin
                            .from("doctors")
                            .delete()
                            .eq("profile_id", authData.user.id);
                    }
                    else if (userData.role === "patient") {
                        await supabase_1.supabaseAdmin
                            .from("patients")
                            .delete()
                            .eq("profile_id", authData.user.id);
                    }
                    else if (userData.role === "admin") {
                        await supabase_1.supabaseAdmin
                            .from("admins")
                            .delete()
                            .eq("profile_id", authData.user.id);
                    }
                    await supabase_1.supabaseAdmin
                        .from("profiles")
                        .delete()
                        .eq("id", authData.user.id);
                    await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                    logger_1.default.info("✅ Cleanup completed successfully");
                }
                catch (cleanupError) {
                    logger_1.default.error("❌ Cleanup error:", cleanupError);
                }
            }
            return { error: error.message || "Registration failed" };
        }
    }
    async validatePasswordPolicy(password, email, fullName) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin.rpc("validate_password_policy", {
                password,
                user_email: email,
                user_name: fullName,
            });
            if (error) {
                logger_1.default.warn("Password validation error:", error);
                return { is_valid: false, errors: ["Password validation failed"] };
            }
            return data;
        }
        catch (error) {
            logger_1.default.warn("Password validation service error:", error);
            return {
                is_valid: false,
                errors: ["Password validation service unavailable"],
            };
        }
    }
    async logAuditEvent(actorId, action, resourceType, resourceId, details, ipAddress, userAgent, severity = "info") {
        try {
            await supabase_1.supabaseAdmin.rpc("enhanced_audit_log", {
                p_actor_id: actorId,
                p_action: action,
                p_resource_type: resourceType,
                p_resource_id: resourceId,
                p_details: details,
                p_ip_address: ipAddress,
                p_user_agent: userAgent,
                p_severity: severity,
            });
        }
        catch (error) {
            logger_1.default.warn("Failed to log audit event:", error);
        }
    }
    async signIn(email, password, ipAddress, userAgent) {
        try {
            const { data, error } = await supabase_1.supabaseClient.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                logger_1.default.error("Sign in error:", error);
                await this.logAuditEvent(null, "AUTH_SIGN_IN_FAILED", "AUTHENTICATION", undefined, { email, error: error.message }, ipAddress, userAgent, "warning");
                return { error: error.message };
            }
            if (!data.user || !data.session) {
                return { error: "Invalid credentials" };
            }
            let enhancedClaims = {};
            try {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.decode(data.session.access_token);
                enhancedClaims = decoded || {};
                logger_1.default.info("✅ Enhanced JWT Claims received:", {
                    userId: enhancedClaims.sub,
                    role: enhancedClaims.user_role,
                    roleSpecificId: enhancedClaims.doctor_id ||
                        enhancedClaims.patient_id ||
                        enhancedClaims.admin_id,
                    permissions: enhancedClaims.permissions?.length || 0,
                    tokenVersion: enhancedClaims.token_version,
                });
            }
            catch (jwtError) {
                logger_1.default.warn("JWT decode warning:", jwtError);
            }
            let securityCheck = null;
            try {
                const result = await this.pool.executeQuery(async (client) => {
                    const { data: securityCheck, error: securityError } = await client.rpc("enhanced_user_authentication", {
                        p_user_id: data.user.id,
                        p_ip_address: ipAddress,
                        p_user_agent: userAgent,
                        p_action: "AUTH_SIGN_IN_SUCCESS",
                    });
                    if (securityError) {
                        logger_1.default.warn("Security check failed:", securityError);
                        return null;
                    }
                    return securityCheck;
                });
                securityCheck = result;
            }
            catch (poolError) {
                logger_1.default.warn("Connection pool error in security check:", poolError);
                try {
                    const { data: fallbackSecurityCheck, error: fallbackSecurityError } = await supabase_1.supabaseAdmin.rpc("enhanced_user_authentication", {
                        p_user_id: data.user.id,
                        p_ip_address: ipAddress,
                        p_user_agent: userAgent,
                        p_action: "AUTH_SIGN_IN_SUCCESS",
                    });
                    if (fallbackSecurityError) {
                        logger_1.default.warn("Fallback security check failed:", fallbackSecurityError);
                    }
                    else {
                        securityCheck = fallbackSecurityCheck;
                    }
                }
                catch (fallbackError) {
                    logger_1.default.warn("Both pool and fallback security check failed:", fallbackError);
                }
            }
            if (securityCheck && !securityCheck.success) {
                logger_1.default.warn("Authentication blocked by security check:", {
                    userId: data.user.id,
                    error: securityCheck.error,
                    errorCode: securityCheck.error_code,
                    securityInfo: securityCheck.security_info,
                });
                return {
                    error: securityCheck.error,
                    securityInfo: securityCheck.security_info,
                };
            }
            if (enhancedClaims.is_active === false) {
                return { error: "Account is inactive" };
            }
            try {
                await this.pool.executeQuery(async (client) => {
                    await client.rpc("update_user_login_time", {
                        user_id: data.user.id,
                    });
                });
            }
            catch (poolError) {
                logger_1.default.warn("Connection pool error updating last_login time:", poolError);
                try {
                    await supabase_1.supabaseAdmin.rpc("update_user_login_time", {
                        user_id: data.user.id,
                    });
                }
                catch (fallbackError) {
                    logger_1.default.warn("Both pool and fallback failed to update last_login time:", fallbackError);
                }
            }
            const finalUser = {
                id: data.user.id,
                email: data.user.email,
                full_name: enhancedClaims.full_name || data.user.email,
                role: enhancedClaims.user_role || "unknown",
                phone_number: enhancedClaims.phone_number,
                date_of_birth: enhancedClaims.date_of_birth,
                is_active: enhancedClaims.is_active,
                email_verified: enhancedClaims.email_verified,
                last_sign_in_at: data.user.last_sign_in_at,
                ...(enhancedClaims.doctor_id && {
                    doctor_id: enhancedClaims.doctor_id,
                }),
                ...(enhancedClaims.patient_id && {
                    patient_id: enhancedClaims.patient_id,
                }),
                ...(enhancedClaims.admin_id && { admin_id: enhancedClaims.admin_id }),
                ...(enhancedClaims.receptionist_id && {
                    receptionist_id: enhancedClaims.receptionist_id,
                }),
                permissions: enhancedClaims.permissions || [],
                role_data: enhancedClaims.role_data || {},
                token_version: enhancedClaims.token_version || "v1.0",
            };
            await this.logAuditEvent(data.user.id, "AUTH_SIGN_IN_SUCCESS", "AUTHENTICATION", data.user.id, {
                email: data.user.email,
                role: enhancedClaims.user_role,
                token_version: enhancedClaims.token_version,
                permissions_count: enhancedClaims.permissions?.length || 0,
            }, ipAddress, userAgent, "info");
            logger_1.default.info("🔍 [SignIn] Final user object:", finalUser);
            return {
                user: finalUser,
                session: data.session,
                securityInfo: securityCheck
                    ? {
                        riskLevel: securityCheck.security_info?.risk_level,
                        riskScore: securityCheck.security_info?.risk_score,
                        sessionInfo: securityCheck.session_info,
                    }
                    : undefined,
            };
        }
        catch (error) {
            logger_1.default.error("Sign in service error:", error);
            return { error: "Internal server error" };
        }
    }
    async signOut(token) {
        try {
            await supabase_1.supabaseClient.auth.setSession({
                access_token: token,
                refresh_token: "",
            });
            const { error } = await supabase_1.supabaseClient.auth.signOut();
            if (error) {
                logger_1.default.error("Sign out error:", error);
                return { error: error.message };
            }
            return { user: null, session: null };
        }
        catch (error) {
            logger_1.default.error("Sign out service error:", error);
            return { error: "Internal server error" };
        }
    }
    async refreshToken(refreshToken) {
        try {
            const { data, error } = await supabase_1.supabaseClient.auth.refreshSession({
                refresh_token: refreshToken,
            });
            if (error) {
                logger_1.default.error("Refresh token error:", error);
                return { error: error.message };
            }
            return {
                session: data.session,
                user: data.user,
            };
        }
        catch (error) {
            logger_1.default.error("Refresh token service error:", error);
            return { error: "Internal server error" };
        }
    }
    async resetPassword(email) {
        try {
            const { error } = await supabase_1.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.CORS_ORIGIN}/auth/reset-password`,
            });
            if (error) {
                logger_1.default.error("Reset password error:", error);
                return { error: error.message };
            }
            return { user: null, session: null };
        }
        catch (error) {
            logger_1.default.error("Reset password service error:", error);
            return { error: "Internal server error" };
        }
    }
    async verifyToken(token) {
        try {
            const { data: { user }, error, } = await supabase_1.supabaseAdmin.auth.getUser(token);
            if (error || !user) {
                return { error: "Invalid or expired token" };
            }
            const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            if (profileError) {
                return { error: "User profile not found" };
            }
            let roleSpecificData = {};
            try {
                if (profile.role === "patient") {
                    logger_1.default.info("🔍 [VerifyToken] Fetching patient_id for profile:", {
                        profile_id: user.id,
                        email: user.email,
                    });
                    const { data: patientData, error: patientError } = await supabase_1.supabaseAdmin
                        .from("patients")
                        .select("patient_id")
                        .eq("profile_id", user.id)
                        .single();
                    if (patientError) {
                        logger_1.default.warn("⚠️ [VerifyToken] Patient query error:", {
                            error: patientError.message,
                            code: patientError.code,
                            profile_id: user.id,
                        });
                    }
                    if (patientData) {
                        logger_1.default.info("✅ [VerifyToken] Patient found:", {
                            patient_id: patientData.patient_id,
                            profile_id: user.id,
                        });
                        roleSpecificData = { patient_id: patientData.patient_id };
                    }
                    else {
                        logger_1.default.warn("⚠️ [VerifyToken] No patient data found for profile_id:", user.id);
                    }
                }
                else if (profile.role === "doctor") {
                    const { data: doctorData } = await supabase_1.supabaseAdmin
                        .from("doctors")
                        .select("doctor_id")
                        .eq("profile_id", user.id)
                        .single();
                    if (doctorData) {
                        roleSpecificData = { doctor_id: doctorData.doctor_id };
                    }
                }
                else if (profile.role === "admin") {
                    const { data: adminData } = await supabase_1.supabaseAdmin
                        .from("admins")
                        .select("admin_id")
                        .eq("profile_id", user.id)
                        .single();
                    if (adminData) {
                        roleSpecificData = { admin_id: adminData.admin_id };
                    }
                }
            }
            catch (roleError) {
                logger_1.default.warn("Could not fetch role-specific ID:", roleError);
            }
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: profile.full_name,
                    role: profile.role,
                    phone_number: profile.phone_number,
                    is_active: profile.is_active,
                    ...roleSpecificData,
                },
            };
        }
        catch (error) {
            logger_1.default.error("Verify token service error:", error);
            return { error: "Internal server error" };
        }
    }
    async createRoleSpecificRecord(userId, userData) {
        try {
            logger_1.default.info(`🔄 Creating ${userData.role} record for user ${userId}`);
            switch (userData.role) {
                case "doctor":
                    await this.createDoctorRecord(userId, userData);
                    break;
                case "patient":
                    await this.createPatientRecord(userId, userData);
                    break;
                case "admin":
                    await this.createAdminRecord(userId, userData);
                    break;
                case "receptionist":
                    await this.createReceptionistRecord(userId, userData);
                    break;
                default:
                    throw new Error(`Invalid role: ${userData.role}. Supported roles: admin, doctor, patient, receptionist`);
            }
            logger_1.default.info(`✅ ${userData.role} record created successfully for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error(`❌ Error creating ${userData.role} record:`, {
                userId,
                role: userData.role,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    async forceRefreshSchemaCache() {
        try {
            await Promise.all([
                supabase_1.supabaseAdmin.from("doctors").select("doctor_id").limit(1),
                supabase_1.supabaseAdmin.from("patients").select("patient_id").limit(1),
                supabase_1.supabaseAdmin.from("profiles").select("id").limit(1),
            ]);
            logger_1.default.info("✅ Schema cache refreshed successfully");
        }
        catch (error) {
            logger_1.default.warn("⚠️ Schema cache refresh failed, continuing anyway:", error);
        }
    }
    async createDoctorRecord(userId, userData) {
        try {
            await this.forceRefreshSchemaCache();
            if (!userData.department_id) {
                throw new Error("Department ID is required for doctor registration");
            }
            const doctorId = await this.generateDoctorId(userData.department_id);
            const timestamp = new Date().toISOString();
            const doctorData = {
                doctor_id: doctorId,
                profile_id: userId,
                specialty: userData.specialty || "General Medicine",
                license_number: userData.license_number || "PENDING",
                qualification: userData.qualification || "MD",
                department_id: userData.department_id,
                gender: userData.gender?.toLowerCase() || "other",
                bio: null,
                experience_years: 0,
                consultation_fee: null,
                address: {},
                languages_spoken: ["Vietnamese"],
                availability_status: "available",
                rating: 0.0,
                total_reviews: 0,
                created_at: timestamp,
                updated_at: timestamp,
                created_by: null,
            };
            logger_1.default.info("Creating doctor record with data:", {
                userId,
                doctorId,
                department_id: userData.department_id,
                phone_number: userData.phone_number,
            });
            const { error } = await supabase_1.supabaseFresh.from("doctors").insert(doctorData);
            if (error) {
                logger_1.default.error("❌ Doctor record creation error:", {
                    userId,
                    doctorId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    doctorData,
                });
                throw new Error(`Failed to create doctor record: ${error.message}`);
            }
            logger_1.default.info("✅ Doctor record created successfully", {
                userId,
                doctorId,
                department_id: userData.department_id,
                phone_number: userData.phone_number,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error in createDoctorRecord:", error);
            throw error;
        }
    }
    async createPatientRecord(userId, userData) {
        try {
            await this.forceRefreshSchemaCache();
            const patientId = await this.generatePatientId();
            const timestamp = new Date().toISOString();
            const patientData = {
                patient_id: patientId,
                profile_id: userId,
                gender: userData.gender?.toLowerCase() || "other",
                blood_type: userData.blood_type || null,
                address: userData.address || {},
                emergency_contact: userData.emergency_contact || {},
                insurance_info: userData.insurance_info || {},
                medical_history: "No medical history recorded",
                allergies: [],
                chronic_conditions: [],
                current_medications: {},
                status: "active",
                created_at: timestamp,
                updated_at: timestamp,
                created_by: null,
            };
            logger_1.default.info("Creating patient record with data:", {
                userId,
                patientId,
                phone_number: userData.phone_number,
            });
            const { error } = await supabase_1.supabaseFresh
                .from("patients")
                .insert(patientData);
            if (error) {
                logger_1.default.error("❌ Patient record creation error:", {
                    userId,
                    patientId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    patientData,
                });
                throw new Error(`Failed to create patient record: ${error.message}`);
            }
            logger_1.default.info("✅ Patient record created successfully", {
                userId,
                patientId,
                phone_number: userData.phone_number,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error in createPatientRecord:", error);
            throw error;
        }
    }
    async createAdminRecord(userId, userData) {
        try {
            const adminId = await this.generateAdminId();
            const timestamp = new Date().toISOString();
            const adminData = {
                admin_id: adminId,
                profile_id: userId,
                permissions: ["read", "write"],
                access_level: "standard",
                department_access: null,
                can_create_users: false,
                can_modify_system: false,
                status: "active",
                created_at: timestamp,
                updated_at: timestamp,
                created_by: null,
            };
            logger_1.default.info("Creating admin record with data:", {
                userId,
                adminId,
                phone_number: userData.phone_number,
            });
            const { error } = await supabase_1.supabaseAdmin.from("admins").insert(adminData);
            if (error) {
                logger_1.default.error("❌ Admin record creation error:", {
                    userId,
                    adminId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    adminData,
                });
                throw new Error(`Failed to create admin record: ${error.message}`);
            }
            logger_1.default.info("✅ Admin record created successfully", {
                userId,
                adminId,
                phone_number: userData.phone_number,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error in createAdminRecord:", error);
            throw error;
        }
    }
    async createReceptionistRecord(userId, userData) {
        try {
            const receptionistId = await this.generateReceptionistId();
            const timestamp = new Date().toISOString();
            const receptionistData = {
                receptionist_id: receptionistId,
                profile_id: userId,
                full_name: userData.full_name,
                department_id: userData.department_id || null,
                shift_schedule: {},
                access_permissions: {
                    can_manage_appointments: true,
                    can_manage_patients: true,
                    can_view_medical_records: false,
                },
                can_manage_appointments: true,
                can_manage_patients: true,
                can_view_medical_records: false,
                languages_spoken: ["Vietnamese"],
                status: "active",
                is_active: true,
                created_at: timestamp,
                updated_at: timestamp,
                created_by: null,
            };
            logger_1.default.info("Creating receptionist record with data:", {
                userId,
                receptionistId,
                phone_number: userData.phone_number,
            });
            const { error } = await supabase_1.supabaseAdmin
                .from("receptionist")
                .insert(receptionistData);
            if (error) {
                logger_1.default.error("❌ Receptionist record creation error:", {
                    userId,
                    receptionistId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    receptionistData,
                });
                throw new Error(`Failed to create receptionist record: ${error.message}`);
            }
            logger_1.default.info("✅ Receptionist record created successfully", {
                userId,
                receptionistId,
                phone_number: userData.phone_number,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error in createReceptionistRecord:", error);
            throw error;
        }
    }
    async generateReceptionistId() {
        try {
            logger_1.default.info("Generating receptionist ID via database function");
            const { data: receptionistId, error } = await supabase_1.supabaseAdmin.rpc("generate_receptionist_id");
            if (error) {
                logger_1.default.error("Database function error for receptionist ID generation:", error);
                return await this.generateReceptionistIdFallback();
            }
            if (!receptionistId) {
                throw new Error("Database function returned null receptionist ID");
            }
            logger_1.default.info("Generated receptionist ID via database function:", receptionistId);
            return receptionistId;
        }
        catch (error) {
            logger_1.default.error("Error in generateReceptionistId:", error);
            throw error;
        }
    }
    async generateReceptionistIdFallback() {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const prefix = `REC-${year}${month}`;
            const { count, error } = await supabase_1.supabaseAdmin
                .from("receptionist")
                .select("*", { count: "exact", head: true })
                .like("receptionist_id", `${prefix}-%`);
            if (error) {
                logger_1.default.error("Error counting receptionists in fallback:", error);
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `${prefix}-${timestamp}`;
                logger_1.default.warn("Using timestamp-based fallback ID:", fallbackId);
                return fallbackId;
            }
            const sequence = String((count || 0) + 1).padStart(3, "0");
            const receptionistId = `${prefix}-${sequence}`;
            const receptionistIdPattern = /^REC-\d{6}-\d{3}$/;
            if (!receptionistIdPattern.test(receptionistId)) {
                throw new Error(`Generated receptionist ID ${receptionistId} does not match expected pattern REC-YYYYMM-XXX`);
            }
            logger_1.default.info(`Generated fallback receptionist ID: ${receptionistId} (sequence: ${sequence})`);
            return receptionistId;
        }
        catch (error) {
            logger_1.default.error("Error in generateReceptionistIdFallback:", error);
            throw error;
        }
    }
    async sendMagicLink(email) {
        try {
            logger_1.default.info("Sending magic link to:", email);
            const { error } = await supabase_1.supabaseClient.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${process.env.CORS_ORIGIN}/auth/callback`,
                },
            });
            if (error) {
                logger_1.default.error("Magic link error:", error);
                return { error: error.message };
            }
            logger_1.default.info("Magic link sent successfully to:", email);
            return { user: null, session: null };
        }
        catch (error) {
            logger_1.default.error("Send magic link service error:", error);
            return { error: "Internal server error" };
        }
    }
    async sendPhoneOTP(phoneNumber) {
        try {
            logger_1.default.info("Sending phone OTP to:", phoneNumber);
            const { error } = await supabase_1.supabaseClient.auth.signInWithOtp({
                phone: phoneNumber,
                options: {},
            });
            if (error) {
                logger_1.default.error("Phone OTP error:", error);
                return { error: error.message };
            }
            logger_1.default.info("Phone OTP sent successfully to:", phoneNumber);
            return { user: null, session: null };
        }
        catch (error) {
            logger_1.default.error("Send phone OTP service error:", error);
            return { error: "Internal server error" };
        }
    }
    async verifyPhoneOTP(phoneNumber, otpCode) {
        try {
            logger_1.default.info("Verifying phone OTP for:", phoneNumber);
            const { data, error } = await supabase_1.supabaseClient.auth.verifyOtp({
                phone: phoneNumber,
                token: otpCode,
                type: "sms",
            });
            if (error) {
                logger_1.default.error("Phone OTP verification error:", error);
                return { error: error.message };
            }
            if (!data.user || !data.session) {
                return { error: "Invalid OTP code" };
            }
            const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();
            if (profileError) {
                logger_1.default.error("Profile fetch error after OTP verification:", profileError);
                return { error: "User profile not found" };
            }
            if (!profile.is_active) {
                return { error: "Account is inactive" };
            }
            logger_1.default.info("Phone OTP verified successfully for:", phoneNumber);
            return {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: profile.full_name,
                    role: profile.role,
                    phone_number: profile.phone_number,
                    is_active: profile.is_active,
                    last_sign_in_at: data.user.last_sign_in_at,
                },
                session: data.session,
            };
        }
        catch (error) {
            logger_1.default.error("Verify phone OTP service error:", error);
            return { error: "Internal server error" };
        }
    }
    async initiateOAuth(provider) {
        try {
            logger_1.default.info("Initiating OAuth login with provider:", provider);
            const { data, error } = await supabase_1.supabaseClient.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${process.env.CORS_ORIGIN}/auth/callback`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });
            if (error) {
                logger_1.default.error("OAuth initiation error:", error);
                return { error: error.message };
            }
            logger_1.default.info("OAuth login initiated successfully for provider:", provider);
            return {
                user: null,
                session: null,
                url: data.url,
            };
        }
        catch (error) {
            logger_1.default.error("Initiate OAuth service error:", error);
            return { error: "Internal server error" };
        }
    }
    async handleOAuthCallback(code, state, provider) {
        try {
            logger_1.default.info("Handling OAuth callback for provider:", provider);
            const { data, error } = await supabase_1.supabaseClient.auth.exchangeCodeForSession(code);
            if (error) {
                logger_1.default.error("OAuth callback error:", error);
                return { error: error.message };
            }
            if (!data.user || !data.session) {
                return { error: "OAuth login failed" };
            }
            let { data: profile, error: profileError } = await supabase_1.supabaseAdmin
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();
            if (profileError && profileError.code === "PGRST116") {
                const profileData = {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.user_metadata?.full_name ||
                        data.user.user_metadata?.name ||
                        "OAuth User",
                    role: "patient",
                    phone_number: data.user.user_metadata?.phone || null,
                    date_of_birth: null,
                    email_verified: true,
                    phone_verified: false,
                    is_active: true,
                    last_login: null,
                    login_count: 0,
                    created_by: null,
                };
                const { error: createProfileError } = await supabase_1.supabaseAdmin
                    .from("profiles")
                    .insert(profileData);
                if (createProfileError) {
                    logger_1.default.error("Failed to create profile for OAuth user:", createProfileError);
                    return { error: "Failed to create user profile" };
                }
                try {
                    await this.createPatientRecord(data.user.id, {
                        email: data.user.email,
                        password: "",
                        full_name: profileData.full_name,
                        role: "patient",
                    });
                }
                catch (patientError) {
                    logger_1.default.error("Failed to create patient record for OAuth user:", patientError);
                }
                profile = profileData;
            }
            else if (profileError) {
                logger_1.default.error("Profile fetch error after OAuth:", profileError);
                return { error: "User profile error" };
            }
            if (!profile.is_active) {
                return { error: "Account is inactive" };
            }
            logger_1.default.info("OAuth login successful for provider:", provider);
            return {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: profile.full_name,
                    role: profile.role,
                    phone_number: profile.phone_number,
                    is_active: profile.is_active,
                    last_sign_in_at: data.user.last_sign_in_at,
                },
                session: data.session,
            };
        }
        catch (error) {
            logger_1.default.error("OAuth callback service error:", error);
            return { error: "Internal server error" };
        }
    }
    async checkEmailAvailability(email) {
        try {
            logger_1.default.info(`🔍 Checking email availability in database: ${email}`);
            const { data, error } = await supabase_1.supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("email", email.toLowerCase())
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    logger_1.default.info(`✅ Email is available: ${email}`);
                    return true;
                }
                logger_1.default.error("Error checking email availability:", error);
                return false;
            }
            if (data) {
                logger_1.default.info(`❌ Email is already registered: ${email}`);
                return false;
            }
            logger_1.default.info(`✅ Email is available: ${email}`);
            return true;
        }
        catch (error) {
            logger_1.default.error("Email availability check service error:", error);
            return false;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map