/**
 * Multi-Factor Authentication (MFA) Service for Hospital Management System
 * Provides TOTP-based MFA for staff, doctors, and admin users
 */

import { supabaseAdmin } from "../supabase/server";

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

class MFAService {
  /**
   * Check if MFA is required for a specific user role
   */
  isMFARequired(role: string): boolean {
    return ["staff", "doctor", "admin"].includes(role);
  }

  /**
   * Get current user's MFA status
   */
  async getUserMFAStatus(): Promise<{
    mfaRequired: boolean;
    mfaEnrolled: boolean;
    currentAAL: string;
    factors: MFAFactor[];
    lastVerification?: Date;
  }> {
    try {
      // Get user profile and MFA status from database
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", (await supabaseAdmin.auth.getUser()).data.user?.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to get user profile: ${profileError.message}`);
      }

      const mfaRequired = this.isMFARequired(profileData.role);

      // Get MFA factors
      const { data: factorsData, error: factorsError } =
        await supabaseAdmin.auth.mfa.listFactors();
      if (factorsError) {
        throw new Error(`Failed to list MFA factors: ${factorsError.message}`);
      }

      // Get current AAL level
      const { data: aalData, error: aalError } =
        await supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) {
        throw new Error(`Failed to get AAL level: ${aalError.message}`);
      }

      const mfaEnrolled = aalData.currentLevel === "aal2";
      const currentAAL = aalData.currentLevel || "aal1";

      // Get last MFA verification time from audit log
      let lastVerification: Date | undefined;
      if (mfaEnrolled) {
        const { data: auditData } = await supabaseAdmin
          .from("mfa_audit_log")
          .select("created_at")
          .eq("user_id", (await supabaseAdmin.auth.getUser()).data.user?.id)
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
    } catch (error) {
      console.error("Error getting MFA status:", error);
      throw error;
    }
  }

  /**
   * Enroll a new TOTP factor for the current user
   */
  async enrollTOTP(
    friendlyName: string = "Hospital Staff MFA"
  ): Promise<MFAEnrollmentResult> {
    try {
      const { data, error } = await supabaseAdmin.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (error) {
        throw new Error(`MFA enrollment failed: ${error.message}`);
      }

      // Log enrollment attempt
      await this.logMFAAudit("mfa_enrollment_started", "totp", data.id, true, {
        friendly_name: friendlyName,
      });

      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        friendlyName: data.totp.friendly_name,
      };
    } catch (error) {
      console.error("Error enrolling TOTP:", error);
      throw error;
    }
  }

  /**
   * Challenge a TOTP factor
   */
  async challengeTOTP(factorId: string): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        throw new Error(`MFA challenge failed: ${error.message}`);
      }

      // Log challenge creation
      await this.logMFAAudit("mfa_challenge_created", "totp", factorId, true, {
        challenge_id: data.id,
      });

      return data.id;
    } catch (error) {
      console.error("Error challenging TOTP:", error);
      throw error;
    }
  }

  /**
   * Verify a TOTP challenge
   */
  async verifyTOTP(
    factorId: string,
    challengeId: string,
    code: string
  ): Promise<MFAVerificationResult> {
    try {
      const { data, error } = await supabaseAdmin.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        // Log failed verification
        await this.logMFAAudit(
          "mfa_verification_failed",
          "totp",
          factorId,
          false,
          {
            challenge_id: challengeId,
            error: error.message,
          }
        );

        return {
          success: false,
          message: error.message,
        };
      }

      // Log successful verification
      await this.logMFAAudit(
        "mfa_verification_success",
        "totp",
        factorId,
        true,
        {
          challenge_id: challengeId,
        }
      );

      return {
        success: true,
        message: "MFA verification successful",
        factorId,
        challengeId,
      };
    } catch (error) {
      console.error("Error verifying TOTP:", error);

      // Log verification error
      await this.logMFAAudit(
        "mfa_verification_error",
        "totp",
        factorId,
        false,
        {
          challenge_id: challengeId,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Unenroll a TOTP factor
   */
  async unenrollTOTP(factorId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.mfa.unenroll({ factorId });

      if (error) {
        throw new Error(`MFA unenrollment failed: ${error.message}`);
      }

      // Log successful unenrollment
      await this.logMFAAudit(
        "mfa_unenrollment_success",
        "totp",
        factorId,
        true
      );

      return true;
    } catch (error) {
      console.error("Error unenrolling TOTP:", error);

      // Log unenrollment error
      await this.logMFAAudit(
        "mfa_unenrollment_failed",
        "totp",
        factorId,
        false,
        {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );

      throw error;
    }
  }

  /**
   * Complete MFA enrollment flow
   */
  async completeEnrollment(factorId: string, code: string): Promise<boolean> {
    try {
      // Create challenge
      const challengeId = await this.challengeTOTP(factorId);

      // Verify challenge
      const result = await this.verifyTOTP(factorId, challengeId, code);

      if (result.success) {
        // Log successful enrollment completion
        await this.logMFAAudit(
          "mfa_enrollment_completed",
          "totp",
          factorId,
          true
        );
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error completing MFA enrollment:", error);
      throw error;
    }
  }

  /**
   * Check if user needs to complete MFA during login
   */
  async needsMFAVerification(): Promise<{
    needsMFA: boolean;
    currentLevel: string;
    nextLevel: string;
    factors: MFAFactor[];
  }> {
    try {
      const { data, error } =
        await supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        throw new Error(`Failed to get AAL level: ${error.message}`);
      }

      const needsMFA =
        data.nextLevel === "aal2" && data.currentLevel !== data.nextLevel;

      // Get available factors if MFA is needed
      let factors: MFAFactor[] = [];
      if (needsMFA) {
        const factorsData = await supabaseAdmin.auth.mfa.listFactors();
        factors = [...factorsData.data.totp, ...factorsData.data.phone];
      }

      return {
        needsMFA,
        currentLevel: data.currentLevel || "aal1",
        nextLevel: data.nextLevel || "aal1",
        factors,
      };
    } catch (error) {
      console.error("Error checking MFA verification need:", error);
      throw error;
    }
  }

  /**
   * Log MFA audit events
   */
  private async logMFAAudit(
    action: string,
    factorType: string,
    factorId: string,
    success: boolean,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const user = (await supabaseAdmin.auth.getUser()).data.user;
      if (!user) return;

      await supabaseAdmin.from("mfa_audit_log").insert({
        user_id: user.id,
        action,
        factor_type: factorType,
        factor_id: factorId,
        success,
        details: details || {},
        ip_address: "0.0.0.0", // Will be populated by application
        user_agent: "MFA Service", // Will be populated by application
      });
    } catch (error) {
      console.error("Failed to log MFA audit:", error);
      // Don't throw - audit logging failure shouldn't break MFA functionality
    }
  }

  /**
   * Get MFA audit history for a user
   */
  async getMFAAuditHistory(limit: number = 50): Promise<any[]> {
    try {
      const user = (await supabaseAdmin.auth.getUser()).data.user;
      if (!user) return [];

      const { data, error } = await supabaseAdmin
        .from("mfa_audit_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get MFA audit history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error getting MFA audit history:", error);
      return [];
    }
  }

  /**
   * Validate MFA setup for hospital staff
   */
  async validateMFACompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const status = await this.getUserMFAStatus();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check if MFA is required but not enrolled
      if (status.mfaRequired && !status.mfaEnrolled) {
        issues.push("MFA is required for your role but not enrolled");
        recommendations.push("Please enroll in MFA to access hospital systems");
      }

      // Check if MFA is enrolled but not required
      if (!status.mfaRequired && status.mfaEnrolled) {
        recommendations.push(
          "MFA is optional for your role but provides additional security"
        );
      }

      // Check if MFA is enrolled and required
      if (status.mfaRequired && status.mfaEnrolled) {
        recommendations.push("MFA is properly configured for your role");
      }

      // Check last verification time
      if (status.lastVerification) {
        const daysSinceVerification = Math.floor(
          (Date.now() - status.lastVerification.getTime()) /
            (1000 * 60 * 60 * 24)
        );

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
    } catch (error) {
      console.error("Error validating MFA compliance:", error);
      return {
        compliant: false,
        issues: ["Unable to validate MFA compliance"],
        recommendations: ["Please contact system administrator"],
      };
    }
  }
}

// Export singleton instance
export const mfaService = new MFAService();
export default mfaService;
