import logger from "@hospital/shared/dist/utils/logger";
import {
  dbPool,
  supabaseAdmin,
  supabaseClient,
  supabaseFresh,
} from "../config/supabase";

// Department code mapping for ID generation
const DEPARTMENT_CODES: Record<string, string> = {
  DEPT001: "CARD", // Tim mạch
  DEPT002: "NEUR", // Thần kinh
  DEPT003: "PEDI", // Nhi
  DEPT004: "OBGY", // Sản phụ khoa
  DEPT005: "INTE", // Nội tổng hợp
  DEPT006: "SURG", // Ngoại tổng hợp
  DEPT007: "ORTH", // Chấn thương chỉnh hình
  DEPT008: "EMER", // Cấp cứu
  DEPT009: "OPHT", // Mắt
  DEPT010: "ENT", // Tai mũi họng
  DEPT011: "DERM", // Da liễu
  DEPT012: "ICU", // Hồi sức cấp cứu
};

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
    patient_id?: string; // For patients
    doctor_id?: string; // For doctors
    admin_id?: string; // For admins
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
  url?: string; // For OAuth redirects
  details?: {
    validation?: any;
    recommendations?: string[];
  };
  securityInfo?:
    | {
        riskLevel?: string;
        riskScore?: number;
        sessionInfo?: any;
        risk_level?: string;
        risk_score?: number;
        security_info?: any;
        session_info?: any;
      }
    | any;
}

export class AuthService {
  private pool = dbPool; // Primary connection pool
  private supabase = supabaseAdmin; // Legacy fallback
  /**
   * Generate department-based doctor ID using database function
   * Format: DEPT_CODE-DOC-YYYYMM-XXX
   * Example: CARD-DOC-202506-001
   */
  private async generateDoctorId(departmentId: string): Promise<string> {
    try {
      logger.info("Generating doctor ID for department:", departmentId);

      // Use Connection Pool for security-critical ID generation
      return await this.pool.executeQuery(async (client) => {
        const { data: doctorId, error } = await client.rpc(
          "generate_doctor_id",
          { dept_id: departmentId }
        );

        if (error) {
          logger.error(
            "Database function error for doctor ID generation:",
            error
          );
          throw error; // Let pool handle retry
        }

        if (!doctorId) {
          throw new Error("Database function returned null doctor ID");
        }

        logger.info("Generated doctor ID via connection pool:", {
          departmentId,
          doctorId,
        });
        return doctorId;
      });
    } catch (error: any) {
      logger.error("Connection pool error in generateDoctorId:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data: doctorId, error: fallbackError } =
          await supabaseAdmin.rpc("generate_doctor_id", {
            dept_id: departmentId,
          });

        if (fallbackError) {
          logger.error(
            "Fallback error for doctor ID generation:",
            fallbackError
          );

          // Final fallback to local generation
          const departmentCode = DEPARTMENT_CODES[departmentId] || "GEN";
          const yearMonth = new Date()
            .toISOString()
            .slice(0, 7)
            .replace("-", "");
          const timestamp = Date.now().toString().slice(-3);
          const fallbackId = `${departmentCode}-DOC-${yearMonth}-${timestamp}`;

          logger.warn("Using local fallback ID generation:", fallbackId);
          return fallbackId;
        }

        if (!doctorId) {
          throw new Error("Database function returned null doctor ID");
        }

        logger.info("Generated doctor ID via fallback:", {
          departmentId,
          doctorId,
        });
        return doctorId;
      } catch (fallbackError: any) {
        logger.error(
          "Both pool and fallback failed in generateDoctorId:",
          fallbackError
        );

        // Final fallback to local generation
        const departmentCode = DEPARTMENT_CODES[departmentId] || "GEN";
        const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `${departmentCode}-DOC-${yearMonth}-${timestamp}`;

        logger.warn("Using emergency local ID generation:", fallbackId);
        return fallbackId;
      }
    }
  }

  /**
   * Generate patient ID using database function
   * Format: PAT-YYYYMM-XXX
   * Example: PAT-202506-001
   */
  private async generatePatientId(): Promise<string> {
    try {
      logger.info("Generating patient ID via database function");

      // Use Connection Pool for security-critical ID generation
      return await this.pool.executeQuery(async (client) => {
        const { data: patientId, error } = await client.rpc(
          "generate_patient_id"
        );

        if (error) {
          logger.error(
            "Database function error for patient ID generation:",
            error
          );
          throw error; // Let pool handle retry
        }

        if (!patientId) {
          throw new Error("Database function returned null patient ID");
        }

        logger.info("Generated patient ID via connection pool:", patientId);
        return patientId;
      });
    } catch (error: any) {
      logger.error("Connection pool error in generatePatientId:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data: patientId, error: fallbackError } =
          await supabaseAdmin.rpc("generate_patient_id");

        if (fallbackError) {
          logger.error(
            "Fallback error for patient ID generation:",
            fallbackError
          );

          // Final fallback to local generation
          const yearMonth = new Date()
            .toISOString()
            .slice(0, 7)
            .replace("-", "");
          const timestamp = Date.now().toString().slice(-3);
          const fallbackId = `PAT-${yearMonth}-${timestamp}`;

          logger.warn("Using local fallback ID generation:", fallbackId);
          return fallbackId;
        }

        if (!patientId) {
          throw new Error("Database function returned null patient ID");
        }

        logger.info("Generated patient ID via fallback:", patientId);
        return patientId;
      } catch (fallbackError: any) {
        logger.error(
          "Both pool and fallback failed in generatePatientId:",
          fallbackError
        );

        // Final fallback to local generation
        const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `PAT-${yearMonth}-${timestamp}`;

        logger.warn("Using emergency local ID generation:", fallbackId);
        return fallbackId;
      }
    }
  }

  /**
   * Generate admin ID
   * Format: ADM-YYYYMM-XXX
   * Example: ADM-202506-001
   */
  private async generateAdminId(): Promise<string> {
    try {
      logger.info("Generating admin ID via database function");

      // Use database function for ID generation (production-ready)
      const { data: adminId, error } =
        await supabaseAdmin.rpc("generate_admin_id");

      if (error) {
        logger.error("Database function error for admin ID generation:", error);

        // Fallback to proper local generation with 3-digit sequence
        return await this.generateAdminIdFallback();
      }

      if (!adminId) {
        throw new Error("Database function returned null admin ID");
      }

      logger.info("Generated admin ID via database function:", adminId);
      return adminId;
    } catch (error: any) {
      logger.error("Error in generateAdminId:", error);
      throw error;
    }
  }

  /**
   * Fallback admin ID generation with proper 3-digit sequence
   * Format: ADM-YYYYMM-XXX (e.g., ADM-202501-001)
   */
  private async generateAdminIdFallback(): Promise<string> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `ADM-${year}${month}`;

      // Get the count of existing admins for this month with proper pattern matching
      const { count, error } = await supabaseAdmin
        .from("admins")
        .select("*", { count: "exact", head: true })
        .like("admin_id", `${prefix}-%`);

      if (error) {
        logger.error("Error counting admins in fallback:", error);
        // If count fails, use timestamp-based sequence as last resort
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `${prefix}-${timestamp}`;
        logger.warn("Using timestamp-based fallback ID:", fallbackId);
        return fallbackId;
      }

      // Generate proper 3-digit sequence (001, 002, 003, etc.)
      const sequence = String((count || 0) + 1).padStart(3, "0");
      const adminId = `${prefix}-${sequence}`;

      // Validate generated ID matches expected pattern
      const adminIdPattern = /^ADM-\d{6}-\d{3}$/;
      if (!adminIdPattern.test(adminId)) {
        throw new Error(
          `Generated admin ID ${adminId} does not match expected pattern ADM-YYYYMM-XXX`
        );
      }

      logger.info(
        `Generated fallback admin ID: ${adminId} (sequence: ${sequence})`
      );
      return adminId;
    } catch (error) {
      logger.error("Error in generateAdminIdFallback:", error);
      throw error;
    }
  }

  /**
   * Sign up a new user using Supabase Auth with Enhanced Security
   */
  public async signUp(userData: SignUpData): Promise<AuthResponse> {
    let authData: any = null;

    try {
      // Validate password against HIPAA-compliant policy
      const passwordValidation = await this.validatePasswordPolicy(
        userData.password,
        userData.email,
        userData.full_name
      );

      if (!passwordValidation.is_valid) {
        logger.warn("Password validation failed:", {
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

      logger.info("✅ Password validation passed:", {
        email: userData.email,
        strength_level: passwordValidation.strength_level,
        strength_score: passwordValidation.strength_score,
      });

      // Create user in Supabase Auth
      const { data: authDataResult, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email in development
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role,
          },
        });

      if (authError) {
        logger.error("Supabase auth error:", authError);
        return { error: authError.message };
      }

      if (!authDataResult.user) {
        return { error: "Failed to create user" };
      }

      authData = authDataResult;
      logger.info("✅ Auth user created successfully", {
        userId: authData.user.id,
        email: userData.email,
      });

      // Create optimized profile with only essential shared fields
      const profileData = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone_number: userData.phone_number || null,
        date_of_birth: userData.date_of_birth || null, // ✅ UPDATED: date_of_birth in profiles (shared)
        email_verified: true, // Auto-verified in development
        phone_verified: false,
        is_active: true,
        last_login: null,
        login_count: 0,
        created_by: null, // Self-registered
        // ❌ REMOVED: created_at, updated_at (auto-generated by database)
        // ❌ REMOVED: gender (moved to role tables - doctors/patients)
      };

      logger.info("Creating profile with data:", {
        userId: authData.user.id,
        email: userData.email,
        role: userData.role,
        phone_number: userData.phone_number,
        date_of_birth: userData.date_of_birth,
      });

      // Use Connection Pool for security-critical profile creation
      await this.pool.executeQuery(async (client) => {
        const { error: profileError } = await client
          .from("profiles")
          .insert(profileData);

        if (profileError) {
          logger.error("❌ Profile creation error:", profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        logger.info("✅ Profile created successfully via connection pool", {
          userId: authData.user.id,
          phone_number: userData.phone_number,
        });
      });

      // Create role-specific record
      try {
        await this.createRoleSpecificRecord(authData.user.id, userData);
        logger.info("✅ Role-specific record created successfully", {
          userId: authData.user.id,
          role: userData.role,
        });
      } catch (roleError: any) {
        logger.error("❌ Role-specific record creation failed:", roleError);
        throw roleError; // Re-throw to trigger cleanup in main catch block
      }

      // Sign in the user to get a session
      const { data: signInData, error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });

      if (signInError) {
        logger.error("Auto sign-in after signup failed:", signInError);
        // Don't return error here, user can still sign in manually
      }

      // Get role-specific ID after creation with retry mechanism
      let roleSpecificData = {};

      logger.info(
        "🔍 [SignUp] Starting role-specific ID fetch after creation:",
        {
          role: userData.role,
          profile_id: authData.user.id,
          email: userData.email,
        }
      );

      try {
        // Add small delay to ensure record is committed
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (userData.role === "patient") {
          logger.info(
            "🔍 [SignUp] Fetching patient_id after creation for profile:",
            {
              profile_id: authData.user.id,
              email: userData.email,
            }
          );

          const { data: patientData, error: patientError } = await supabaseAdmin
            .from("patients")
            .select("patient_id")
            .eq("profile_id", authData.user.id)
            .single();

          logger.info("🔍 [SignUp] Patient query result:", {
            patientData,
            patientError,
            profile_id: authData.user.id,
          });

          if (patientError) {
            logger.warn("⚠️ [SignUp] Patient query error:", {
              error: patientError.message,
              code: patientError.code,
              profile_id: authData.user.id,
            });
          }

          if (patientData) {
            logger.info("✅ [SignUp] Patient found after creation:", {
              patient_id: patientData.patient_id,
              profile_id: authData.user.id,
            });
            roleSpecificData = { patient_id: patientData.patient_id };
            logger.info(
              "🔍 [SignUp] roleSpecificData set to:",
              roleSpecificData
            );
          } else {
            logger.warn(
              "⚠️ [SignUp] No patient data found after creation for profile_id:",
              authData.user.id
            );
          }
        } else if (userData.role === "doctor") {
          logger.info(
            "🔍 [SignUp] Fetching doctor_id after creation for profile:",
            {
              profile_id: authData.user.id,
              email: userData.email,
            }
          );

          const { data: doctorData, error: doctorError } = await supabaseAdmin
            .from("doctors")
            .select("doctor_id")
            .eq("profile_id", authData.user.id)
            .single();

          if (doctorError) {
            logger.warn("⚠️ [SignUp] Doctor query error:", {
              error: doctorError.message,
              code: doctorError.code,
              profile_id: authData.user.id,
            });
          }

          if (doctorData) {
            logger.info("✅ [SignUp] Doctor found after creation:", {
              doctor_id: doctorData.doctor_id,
              profile_id: authData.user.id,
            });
            roleSpecificData = { doctor_id: doctorData.doctor_id };
          }
        } else if (userData.role === "admin") {
          logger.info(
            "🔍 [SignUp] Fetching admin_id after creation for profile:",
            {
              profile_id: authData.user.id,
              email: userData.email,
            }
          );

          const { data: adminData, error: adminError } = await supabaseAdmin
            .from("admins")
            .select("admin_id")
            .eq("profile_id", authData.user.id)
            .single();

          if (adminError) {
            logger.warn("⚠️ [SignUp] Admin query error:", {
              error: adminError.message,
              code: adminError.code,
              profile_id: authData.user.id,
            });
          }

          if (adminData) {
            logger.info("✅ [SignUp] Admin found after creation:", {
              admin_id: adminData.admin_id,
              profile_id: authData.user.id,
            });
            roleSpecificData = { admin_id: adminData.admin_id };
          }
        }
      } catch (roleError: any) {
        logger.error(
          "❌ [SignUp] Error fetching role-specific ID after signup:",
          {
            error: roleError.message || "Unknown error",
            stack: roleError.stack || "No stack trace",
            role: userData.role,
            profile_id: authData.user.id,
          }
        );
      }

      logger.info(
        "🔍 [SignUp] Final roleSpecificData before return:",
        roleSpecificData
      );

      logger.info("✅ User signup completed successfully", {
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
    } catch (error: any) {
      logger.error("❌ Signup error, performing cleanup:", error);

      // Cleanup in reverse order: role-specific record, profile, auth user
      if (authData?.user?.id) {
        try {
          // Clean up role-specific records
          if (userData.role === "doctor") {
            await supabaseAdmin
              .from("doctors")
              .delete()
              .eq("profile_id", authData.user.id);
          } else if (userData.role === "patient") {
            await supabaseAdmin
              .from("patients")
              .delete()
              .eq("profile_id", authData.user.id);
          } else if (userData.role === "admin") {
            await supabaseAdmin
              .from("admins")
              .delete()
              .eq("profile_id", authData.user.id);
          }

          // Clean up profile
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", authData.user.id);

          // Clean up auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

          logger.info("✅ Cleanup completed successfully");
        } catch (cleanupError: any) {
          logger.error("❌ Cleanup error:", cleanupError);
        }
      }

      return { error: error.message || "Registration failed" };
    }
  }

  /**
   * Validate password against HIPAA-compliant policy
   */
  private async validatePasswordPolicy(
    password: string,
    email?: string,
    fullName?: string
  ): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc(
        "validate_password_policy",
        {
          password,
          user_email: email,
          user_name: fullName,
        }
      );

      if (error) {
        logger.warn("Password validation error:", error);
        return { is_valid: false, errors: ["Password validation failed"] };
      }

      return data;
    } catch (error) {
      logger.warn("Password validation service error:", error);
      return {
        is_valid: false,
        errors: ["Password validation service unavailable"],
      };
    }
  }

  /**
   * Enhanced audit logging function
   */
  private async logAuditEvent(
    actorId: string | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
    severity: string = "info"
  ): Promise<void> {
    try {
      await supabaseAdmin.rpc("enhanced_audit_log", {
        p_actor_id: actorId,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_severity: severity,
      });
    } catch (error) {
      logger.warn("Failed to log audit event:", error);
      // Don't fail the main operation for audit logging failures
    }
  }

  /**
   * Sign in user using Enhanced Supabase Auth with Custom JWT Claims
   */
  public async signIn(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("Sign in error:", error);

        // Log failed authentication attempt
        await this.logAuditEvent(
          null, // No user ID for failed attempts
          "AUTH_SIGN_IN_FAILED",
          "AUTHENTICATION",
          undefined,
          { email, error: error.message },
          ipAddress,
          userAgent,
          "warning"
        );

        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: "Invalid credentials" };
      }

      // Decode enhanced JWT to get business data
      let enhancedClaims: any = {};
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.decode(data.session.access_token);
        enhancedClaims = decoded || {};

        logger.info("✅ Enhanced JWT Claims received:", {
          userId: enhancedClaims.sub,
          role: enhancedClaims.user_role,
          roleSpecificId:
            enhancedClaims.doctor_id ||
            enhancedClaims.patient_id ||
            enhancedClaims.admin_id,
          permissions: enhancedClaims.permissions?.length || 0,
          tokenVersion: enhancedClaims.token_version,
        });
      } catch (jwtError) {
        logger.warn("JWT decode warning:", jwtError);
      }

      // Enhanced security check with business logic using Connection Pool
      let securityCheck: any = null;
      try {
        const result = await this.pool.executeQuery(async (client) => {
          const { data: securityCheck, error: securityError } =
            await client.rpc("enhanced_user_authentication", {
              p_user_id: data.user.id,
              p_ip_address: ipAddress,
              p_user_agent: userAgent,
              p_action: "AUTH_SIGN_IN_SUCCESS",
            });

          if (securityError) {
            logger.warn("Security check failed:", securityError);
            return null; // Continue with basic checks if security service fails
          }

          return securityCheck;
        });

        securityCheck = result;
      } catch (poolError) {
        logger.warn("Connection pool error in security check:", poolError);
        // Fallback to direct client
        try {
          const { data: fallbackSecurityCheck, error: fallbackSecurityError } =
            await supabaseAdmin.rpc("enhanced_user_authentication", {
              p_user_id: data.user.id,
              p_ip_address: ipAddress,
              p_user_agent: userAgent,
              p_action: "AUTH_SIGN_IN_SUCCESS",
            });

          if (fallbackSecurityError) {
            logger.warn(
              "Fallback security check failed:",
              fallbackSecurityError
            );
          } else {
            securityCheck = fallbackSecurityCheck;
          }
        } catch (fallbackError) {
          logger.warn(
            "Both pool and fallback security check failed:",
            fallbackError
          );
        }
      }

      if (securityCheck && !securityCheck.success) {
        logger.warn("Authentication blocked by security check:", {
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

      // Check if user is active (from JWT claims as fallback)
      if (enhancedClaims.is_active === false) {
        return { error: "Account is inactive" };
      }

      // Update last_login time using Connection Pool
      try {
        await this.pool.executeQuery(async (client) => {
          await client.rpc("update_user_login_time", {
            user_id: data.user.id,
          });
        });
      } catch (poolError) {
        logger.warn(
          "Connection pool error updating last_login time:",
          poolError
        );
        // Fallback to direct client
        try {
          await supabaseAdmin.rpc("update_user_login_time", {
            user_id: data.user.id,
          });
        } catch (fallbackError) {
          logger.warn(
            "Both pool and fallback failed to update last_login time:",
            fallbackError
          );
          // Don't fail the login, just log the warning
        }
      }

      // Build enhanced user object from JWT claims (no need for additional DB queries)
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

        // Role-specific IDs from JWT claims
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

        // Enhanced data from JWT
        permissions: enhancedClaims.permissions || [],
        role_data: enhancedClaims.role_data || {},
        token_version: enhancedClaims.token_version || "v1.0",
      };

      // Log successful authentication
      await this.logAuditEvent(
        data.user.id,
        "AUTH_SIGN_IN_SUCCESS",
        "AUTHENTICATION",
        data.user.id,
        {
          email: data.user.email,
          role: enhancedClaims.user_role,
          token_version: enhancedClaims.token_version,
          permissions_count: enhancedClaims.permissions?.length || 0,
        },
        ipAddress,
        userAgent,
        "info"
      );

      logger.info("🔍 [SignIn] Final user object:", finalUser);

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
    } catch (error) {
      logger.error("Sign in service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Sign out user
   */
  public async signOut(token: string): Promise<AuthResponse> {
    try {
      // Set the session for the client
      await supabaseClient.auth.setSession({
        access_token: token,
        refresh_token: "", // We don't have refresh token here
      });

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        logger.error("Sign out error:", error);
        return { error: error.message };
      }

      return { user: null, session: null };
    } catch (error) {
      logger.error("Sign out service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        logger.error("Refresh token error:", error);
        return { error: error.message };
      }

      return {
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      logger.error("Refresh token service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CORS_ORIGIN}/auth/reset-password`,
      });

      if (error) {
        logger.error("Reset password error:", error);
        return { error: error.message };
      }

      return { user: null, session: null };
    } catch (error) {
      logger.error("Reset password service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Verify JWT token
   */
  public async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return { error: "Invalid or expired token" };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        return { error: "User profile not found" };
      }

      // Get role-specific ID
      let roleSpecificData = {};
      try {
        if (profile.role === "patient") {
          logger.info("🔍 [VerifyToken] Fetching patient_id for profile:", {
            profile_id: user.id,
            email: user.email,
          });

          const { data: patientData, error: patientError } = await supabaseAdmin
            .from("patients")
            .select("patient_id")
            .eq("profile_id", user.id)
            .single();

          if (patientError) {
            logger.warn("⚠️ [VerifyToken] Patient query error:", {
              error: patientError.message,
              code: patientError.code,
              profile_id: user.id,
            });
          }

          if (patientData) {
            logger.info("✅ [VerifyToken] Patient found:", {
              patient_id: patientData.patient_id,
              profile_id: user.id,
            });
            roleSpecificData = { patient_id: patientData.patient_id };
          } else {
            logger.warn(
              "⚠️ [VerifyToken] No patient data found for profile_id:",
              user.id
            );
          }
        } else if (profile.role === "doctor") {
          const { data: doctorData } = await supabaseAdmin
            .from("doctors")
            .select("doctor_id")
            .eq("profile_id", user.id)
            .single();
          if (doctorData) {
            roleSpecificData = { doctor_id: doctorData.doctor_id };
          }
        } else if (profile.role === "admin") {
          const { data: adminData } = await supabaseAdmin
            .from("admins")
            .select("admin_id")
            .eq("profile_id", user.id)
            .single();
          if (adminData) {
            roleSpecificData = { admin_id: adminData.admin_id };
          }
        }
      } catch (roleError) {
        logger.warn("Could not fetch role-specific ID:", roleError);
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
    } catch (error) {
      logger.error("Verify token service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Create role-specific record (doctor, patient, admin, receptionist)
   */
  private async createRoleSpecificRecord(
    userId: string,
    userData: SignUpData
  ): Promise<void> {
    try {
      logger.info(`🔄 Creating ${userData.role} record for user ${userId}`);

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
          throw new Error(
            `Invalid role: ${userData.role}. Supported roles: admin, doctor, patient, receptionist`
          );
      }

      logger.info(
        `✅ ${userData.role} record created successfully for user ${userId}`
      );
    } catch (error: any) {
      logger.error(`❌ Error creating ${userData.role} record:`, {
        userId,
        role: userData.role,
        error: error.message,
        stack: error.stack,
      });
      throw error; // Re-throw to handle in signup process
    }
  }

  private async forceRefreshSchemaCache(): Promise<void> {
    try {
      // Force refresh schema cache by making simple queries to all tables
      await Promise.all([
        supabaseAdmin.from("doctors").select("doctor_id").limit(1),
        supabaseAdmin.from("patients").select("patient_id").limit(1),
        supabaseAdmin.from("profiles").select("id").limit(1),
      ]);
      logger.info("✅ Schema cache refreshed successfully");
    } catch (error) {
      logger.warn("⚠️ Schema cache refresh failed, continuing anyway:", error);
    }
  }

  public async createDoctorRecord(
    userId: string,
    userData: SignUpData
  ): Promise<void> {
    try {
      // Force refresh schema cache first
      await this.forceRefreshSchemaCache();

      // Validate required fields
      if (!userData.department_id) {
        throw new Error("Department ID is required for doctor registration");
      }

      // Generate department-based doctor ID
      const doctorId = await this.generateDoctorId(userData.department_id);
      const timestamp = new Date().toISOString();

      // Prepare doctor data (full_name is stored in profiles table)
      const doctorData = {
        doctor_id: doctorId,
        profile_id: userId,
        // ✅ CLEAN DESIGN: full_name is in profiles table, not duplicated here
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
        created_by: null, // Self-registered
      };

      logger.info("Creating doctor record with data:", {
        userId,
        doctorId,
        department_id: userData.department_id,
        phone_number: userData.phone_number,
      });

      const { error } = await supabaseFresh.from("doctors").insert(doctorData);

      if (error) {
        logger.error("❌ Doctor record creation error:", {
          userId,
          doctorId,
          error: error.message,
          code: error.code,
          details: error.details,
          doctorData,
        });
        throw new Error(`Failed to create doctor record: ${error.message}`);
      }

      logger.info("✅ Doctor record created successfully", {
        userId,
        doctorId,
        department_id: userData.department_id,
        phone_number: userData.phone_number,
      });
    } catch (error: any) {
      logger.error("❌ Error in createDoctorRecord:", error);
      throw error;
    }
  }

  public async createPatientRecord(
    userId: string,
    userData: SignUpData
  ): Promise<void> {
    try {
      // Force refresh schema cache first
      await this.forceRefreshSchemaCache();

      // Generate month-based patient ID
      const patientId = await this.generatePatientId();
      const timestamp = new Date().toISOString();

      // Prepare patient data with ONLY patient-specific fields (clean design - no duplication)
      const patientData = {
        patient_id: patientId,
        profile_id: userId,
        // ✅ CLEAN DESIGN: NO email, full_name, phone_number, date_of_birth - they are in profiles table
        gender: userData.gender?.toLowerCase() || "other",
        blood_type: userData.blood_type || null,
        address: userData.address || {},
        emergency_contact: userData.emergency_contact || {},
        insurance_info: userData.insurance_info || {},
        medical_history: "No medical history recorded", // ✅ ADD: patient-specific field
        allergies: [],
        chronic_conditions: [],
        current_medications: {},
        status: "active",
        created_at: timestamp,
        updated_at: timestamp,
        created_by: null, // Self-registered
      };

      logger.info("Creating patient record with data:", {
        userId,
        patientId,
        phone_number: userData.phone_number,
      });

      const { error } = await supabaseFresh
        .from("patients")
        .insert(patientData);

      if (error) {
        logger.error("❌ Patient record creation error:", {
          userId,
          patientId,
          error: error.message,
          code: error.code,
          details: error.details,
          patientData,
        });
        throw new Error(`Failed to create patient record: ${error.message}`);
      }

      logger.info("✅ Patient record created successfully", {
        userId,
        patientId,
        phone_number: userData.phone_number,
      });
    } catch (error: any) {
      logger.error("❌ Error in createPatientRecord:", error);
      throw error;
    }
  }

  private async createAdminRecord(
    userId: string,
    userData: SignUpData
  ): Promise<void> {
    try {
      // Generate month-based admin ID
      const adminId = await this.generateAdminId();
      const timestamp = new Date().toISOString();

      // Prepare admin data with ONLY admin-specific fields (no duplication with profiles)
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
        created_by: null, // Self-registered
      };

      logger.info("Creating admin record with data:", {
        userId,
        adminId,
        phone_number: userData.phone_number,
      });

      const { error } = await supabaseAdmin.from("admins").insert(adminData);

      if (error) {
        logger.error("❌ Admin record creation error:", {
          userId,
          adminId,
          error: error.message,
          code: error.code,
          details: error.details,
          adminData,
        });
        throw new Error(`Failed to create admin record: ${error.message}`);
      }

      logger.info("✅ Admin record created successfully", {
        userId,
        adminId,
        phone_number: userData.phone_number,
      });
    } catch (error: any) {
      logger.error("❌ Error in createAdminRecord:", error);
      throw error;
    }
  }

  /**
   * Create receptionist record in receptionist table
   */
  private async createReceptionistRecord(
    userId: string,
    userData: SignUpData
  ): Promise<void> {
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

      logger.info("Creating receptionist record with data:", {
        userId,
        receptionistId,
        phone_number: userData.phone_number,
      });

      const { error } = await supabaseAdmin
        .from("receptionist")
        .insert(receptionistData);

      if (error) {
        logger.error("❌ Receptionist record creation error:", {
          userId,
          receptionistId,
          error: error.message,
          code: error.code,
          details: error.details,
          receptionistData,
        });
        throw new Error(
          `Failed to create receptionist record: ${error.message}`
        );
      }

      logger.info("✅ Receptionist record created successfully", {
        userId,
        receptionistId,
        phone_number: userData.phone_number,
      });
    } catch (error: any) {
      logger.error("❌ Error in createReceptionistRecord:", error);
      throw error;
    }
  }

  /**
   * Generate unique receptionist ID using database function
   * Format: REC-YYYYMM-XXX (e.g., REC-202501-001)
   */
  private async generateReceptionistId(): Promise<string> {
    try {
      logger.info("Generating receptionist ID via database function");

      // Use database function for ID generation (production-ready)
      const { data: receptionistId, error } = await supabaseAdmin.rpc(
        "generate_receptionist_id"
      );

      if (error) {
        logger.error(
          "Database function error for receptionist ID generation:",
          error
        );

        // Fallback to proper local generation with 3-digit sequence
        return await this.generateReceptionistIdFallback();
      }

      if (!receptionistId) {
        throw new Error("Database function returned null receptionist ID");
      }

      logger.info(
        "Generated receptionist ID via database function:",
        receptionistId
      );
      return receptionistId;
    } catch (error: any) {
      logger.error("Error in generateReceptionistId:", error);
      throw error;
    }
  }

  /**
   * Fallback receptionist ID generation with proper 3-digit sequence
   * Format: REC-YYYYMM-XXX (e.g., REC-202501-001)
   */
  private async generateReceptionistIdFallback(): Promise<string> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `REC-${year}${month}`;

      // Get the count of existing receptionists for this month with proper pattern matching
      const { count, error } = await supabaseAdmin
        .from("receptionist")
        .select("*", { count: "exact", head: true })
        .like("receptionist_id", `${prefix}-%`);

      if (error) {
        logger.error("Error counting receptionists in fallback:", error);
        // If count fails, use timestamp-based sequence as last resort
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `${prefix}-${timestamp}`;
        logger.warn("Using timestamp-based fallback ID:", fallbackId);
        return fallbackId;
      }

      // Generate proper 3-digit sequence (001, 002, 003, etc.)
      const sequence = String((count || 0) + 1).padStart(3, "0");
      const receptionistId = `${prefix}-${sequence}`;

      // Validate generated ID matches expected pattern
      const receptionistIdPattern = /^REC-\d{6}-\d{3}$/;
      if (!receptionistIdPattern.test(receptionistId)) {
        throw new Error(
          `Generated receptionist ID ${receptionistId} does not match expected pattern REC-YYYYMM-XXX`
        );
      }

      logger.info(
        `Generated fallback receptionist ID: ${receptionistId} (sequence: ${sequence})`
      );
      return receptionistId;
    } catch (error) {
      logger.error("Error in generateReceptionistIdFallback:", error);
      throw error;
    }
  }

  /**
   * Send magic link for passwordless login
   */
  public async sendMagicLink(email: string): Promise<AuthResponse> {
    try {
      logger.info("Sending magic link to:", email);

      const { error } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${process.env.CORS_ORIGIN}/auth/callback`,
          // You can customize the email template in Supabase dashboard
        },
      });

      if (error) {
        logger.error("Magic link error:", error);
        return { error: error.message };
      }

      logger.info("Magic link sent successfully to:", email);
      return { user: null, session: null };
    } catch (error: any) {
      logger.error("Send magic link service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Send OTP to phone number
   */
  public async sendPhoneOTP(phoneNumber: string): Promise<AuthResponse> {
    try {
      logger.info("Sending phone OTP to:", phoneNumber);

      const { error } = await supabaseClient.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          // You can customize SMS template in Supabase dashboard
        },
      });

      if (error) {
        logger.error("Phone OTP error:", error);
        return { error: error.message };
      }

      logger.info("Phone OTP sent successfully to:", phoneNumber);
      return { user: null, session: null };
    } catch (error: any) {
      logger.error("Send phone OTP service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Verify phone OTP and sign in
   */
  public async verifyPhoneOTP(
    phoneNumber: string,
    otpCode: string
  ): Promise<AuthResponse> {
    try {
      logger.info("Verifying phone OTP for:", phoneNumber);

      const { data, error } = await supabaseClient.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: "sms",
      });

      if (error) {
        logger.error("Phone OTP verification error:", error);
        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: "Invalid OTP code" };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        logger.error(
          "Profile fetch error after OTP verification:",
          profileError
        );
        return { error: "User profile not found" };
      }

      if (!profile.is_active) {
        return { error: "Account is inactive" };
      }

      logger.info("Phone OTP verified successfully for:", phoneNumber);

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
    } catch (error: any) {
      logger.error("Verify phone OTP service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Initiate OAuth login
   */
  public async initiateOAuth(
    provider: "google" | "github" | "facebook" | "apple"
  ): Promise<AuthResponse & { url?: string }> {
    try {
      logger.info("Initiating OAuth login with provider:", provider);

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
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
        logger.error("OAuth initiation error:", error);
        return { error: error.message };
      }

      logger.info("OAuth login initiated successfully for provider:", provider);

      return {
        user: null,
        session: null,
        url: data.url,
      };
    } catch (error: any) {
      logger.error("Initiate OAuth service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Handle OAuth callback
   */
  public async handleOAuthCallback(
    code: string,
    state: string,
    provider?: string
  ): Promise<AuthResponse> {
    try {
      logger.info("Handling OAuth callback for provider:", provider);

      // Exchange code for session
      const { data, error } =
        await supabaseClient.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("OAuth callback error:", error);
        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: "OAuth login failed" };
      }

      // Check if user profile exists, create if not
      let { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create one for OAuth user
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            "OAuth User",
          role: "patient", // Default role for OAuth users
          phone_number: data.user.user_metadata?.phone || null,
          date_of_birth: null,
          email_verified: true,
          phone_verified: false,
          is_active: true,
          last_login: null,
          login_count: 0,
          created_by: null,
        };

        const { error: createProfileError } = await supabaseAdmin
          .from("profiles")
          .insert(profileData);

        if (createProfileError) {
          logger.error(
            "Failed to create profile for OAuth user:",
            createProfileError
          );
          return { error: "Failed to create user profile" };
        }

        // Create patient record for OAuth user
        try {
          await this.createPatientRecord(data.user.id, {
            email: data.user.email!,
            password: "", // Not needed for OAuth
            full_name: profileData.full_name,
            role: "patient",
          });
        } catch (patientError) {
          logger.error(
            "Failed to create patient record for OAuth user:",
            patientError
          );
          // Continue anyway, profile is created
        }

        profile = profileData;
      } else if (profileError) {
        logger.error("Profile fetch error after OAuth:", profileError);
        return { error: "User profile error" };
      }

      if (!profile!.is_active) {
        return { error: "Account is inactive" };
      }

      logger.info("OAuth login successful for provider:", provider);

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile!.full_name,
          role: profile!.role,
          phone_number: profile!.phone_number,
          is_active: profile!.is_active,
          last_sign_in_at: data.user.last_sign_in_at,
        },
        session: data.session,
      };
    } catch (error: any) {
      logger.error("OAuth callback service error:", error);
      return { error: "Internal server error" };
    }
  }

  /**
   * Check if email is available for registration
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      logger.info(`🔍 Checking email availability in database: ${email}`);

      // Check if email exists in profiles table
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (error) {
        // If error is "PGRST116" (no rows found), email is available
        if (error.code === "PGRST116") {
          logger.info(`✅ Email is available: ${email}`);
          return true;
        }

        // Other errors should be logged and treated as unavailable for safety
        logger.error("Error checking email availability:", error);
        return false;
      }

      // If data exists, email is already taken
      if (data) {
        logger.info(`❌ Email is already registered: ${email}`);
        return false;
      }

      // Default to available if no data and no error
      logger.info(`✅ Email is available: ${email}`);
      return true;
    } catch (error: any) {
      logger.error("Email availability check service error:", error);
      // Return false for safety in case of errors
      return false;
    }
  }
}
