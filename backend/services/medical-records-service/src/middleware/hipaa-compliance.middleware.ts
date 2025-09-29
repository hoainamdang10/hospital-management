import { createClient } from "@supabase/supabase-js";
import { NextFunction, Request, Response } from "express";

interface AuditLog {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  phi_accessed: boolean;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  success: boolean;
  details?: any;
}

export class HIPAAComplianceMiddleware {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Audit logging cho tất cả PHI access
  auditAccess = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      // Log the access
      this.logAccess(req, res, body, Date.now() - startTime);
      return originalJson(body);
    };

    next();
  };

  private async logAccess(
    req: Request,
    res: Response,
    responseBody: any,
    responseTime: number
  ) {
    try {
      const auditLog: AuditLog = {
        user_id: req.user?.id || "anonymous",
        action: `${req.method} ${req.path}`,
        resource_type: "medical_record",
        resource_id: req.params.id || req.params.patient_id || "bulk",
        phi_accessed: this.containsPHI(responseBody),
        ip_address: req.ip || req.connection.remoteAddress || "unknown",
        user_agent: req.get("User-Agent") || "unknown",
        timestamp: new Date(),
        success: res.statusCode < 400,
        details: {
          status_code: res.statusCode,
          response_time_ms: responseTime,
          query_params: req.query,
          patient_count: Array.isArray(responseBody?.data)
            ? responseBody.data.length
            : 1,
        },
      };

      await this.supabase.from("phi_access_log").insert(auditLog);
    } catch (error) {
      console.error("Audit logging failed:", error);
    }
  }

  // Detect if response contains PHI
  private containsPHI(body: any): boolean {
    if (!body) return false;

    const phiFields = [
      "symptoms",
      "diagnosis",
      "treatment",
      "examination_notes",
      "medication",
      "allergies",
      "vital_signs",
      "lab_results",
    ];

    const bodyStr = JSON.stringify(body).toLowerCase();
    return phiFields.some((field) => bodyStr.includes(field));
  }

  // Data masking for non-authorized access
  maskSensitiveData = (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !["doctor", "nurse", "admin"].includes(userRole)) {
      req.shouldMaskData = true;
    }

    next();
  };

  // Rate limiting for PHI access
  async rateLimitPHI(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check access count in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const { count } = await this.supabase
        .from("phi_access_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("phi_accessed", true)
        .gte("timestamp", oneHourAgo.toISOString());

      const limit = req.user?.role === "admin" ? 1000 : 100;

      if (count && count > limit) {
        // Log security event
        await this.supabase.from("security_events").insert({
          event_type: "rate_limit_exceeded",
          user_id: userId,
          severity: "medium",
          details: { access_count: count, limit },
          ip_address: req.ip,
        });

        return res.status(429).json({
          error: "Rate limit exceeded for PHI access",
          retry_after: 3600,
        });
      }

      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      next();
    }
  }
}

export const hipaaMiddleware = new HIPAAComplianceMiddleware();
