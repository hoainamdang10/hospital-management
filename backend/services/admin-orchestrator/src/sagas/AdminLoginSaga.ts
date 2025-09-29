import { SagaStep, SagaCoordinator } from '../orchestrator/SagaCoordinator';
import { supabase } from '@/backend/lib/supabase';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface AdminLoginPayload {
  email: string;
  password: string;
  ip_address: string;
  user_agent: string;
  device_info: string;
  location: string;
  remember_me: boolean;
  two_factor_code?: string;
  security_context: {
    is_suspicious: boolean;
    risk_score: number;
    device_fingerprint: string;
  };
}

export interface AdminLoginResult {
  success: boolean;
  user?: any;
  session?: any;
  requires_2fa?: boolean;
  requires_security_verification?: boolean;
  error?: string;
  security_incident_id?: string;
}

export class AdminLoginSaga {
  private sagaId: string;
  private operationId: string;
  private payload: AdminLoginPayload;
  private coordinator: SagaCoordinator;

  constructor(sagaId: string, operationId: string, payload: AdminLoginPayload) {
    this.sagaId = sagaId;
    this.operationId = operationId;
    this.payload = payload;
    this.coordinator = new SagaCoordinator();
  }

  async execute(): Promise<AdminLoginResult> {
    try {
      // Log saga start
      await this.logSagaEvent('admin_login_saga_started', 'started', {
        email: this.payload.email,
        ip_address: this.payload.ip_address,
        security_context: this.payload.security_context
      });

      const steps = this.buildLoginSteps();
      const result = await this.coordinator.executeSaga(this.sagaId, steps);

      await this.logSagaEvent(
        'admin_login_saga_completed',
        result.success ? 'completed' : 'failed',
        { result }
      );

      return result.success ? result.data : { success: false, error: result.error };

    } catch (error: any) {
      await this.logSagaEvent('admin_login_saga_failed', 'failed', {
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  private buildLoginSteps(): SagaStep[] {
    return [
      {
        id: 'security_pre_check',
        name: 'Security Pre-Check',
        service: 'security-service',
        action: async () => {
          // Check for rate limiting
          const rateLimitKey = `admin_login_attempts:${this.payload.ip_address}`;
          const attempts = await redis.get(rateLimitKey);
          
          if (attempts && parseInt(attempts) >= 5) {
            throw new Error('Rate limit exceeded for admin login');
          }

          // Check for suspicious patterns
          const recentLogins = await supabase
            .from('audit_logs')
            .select('ip_address, user_agent, timestamp')
            .eq('action', 'admin_login_attempt')
            .eq('ip_address', this.payload.ip_address)
            .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
            .order('timestamp', { ascending: false });

          const suspiciousActivity = this.detectSuspiciousPatterns(recentLogins.data || []);
          
          return {
            rate_limit_ok: true,
            suspicious_activity: suspiciousActivity,
            security_score: this.calculateSecurityScore()
          };
        },
        compensationAction: async () => {
          // Log security check failure
          await this.logSagaEvent('security_pre_check_failed', 'compensated', {
            reason: 'Security pre-check compensation'
          });
        }
      },
      {
        id: 'user_authentication',
        name: 'User Authentication',
        service: 'auth-service',
        action: async (context: any) => {
          // Get user from database
          const { data: user, error: userError } = await supabase
            .from('profiles')
            .select(`
              id, email, password_hash, full_name, role, 
              account_locked, locked_at, failed_login_attempts,
              two_factor_enabled, last_login, created_at
            `)
            .eq('email', this.payload.email)
            .single();

          if (userError || !user) {
            await this.incrementLoginAttempts();
            throw new Error('Invalid credentials');
          }

          // Check admin role
          if (!['admin', 'superadmin'].includes(user.role)) {
            await this.incrementLoginAttempts();
            throw new Error('Insufficient privileges');
          }

          // Check account lock status
          if (user.account_locked) {
            const lockoutDuration = 30 * 60 * 1000; // 30 minutes
            const lockedAt = new Date(user.locked_at).getTime();
            const unlockTime = lockedAt + lockoutDuration;
            
            if (Date.now() < unlockTime) {
              throw new Error('Account is locked');
            } else {
              // Auto-unlock expired lockout
              await supabase
                .from('profiles')
                .update({
                  account_locked: false,
                  locked_at: null,
                  failed_login_attempts: 0
                })
                .eq('id', user.id);
            }
          }

          // Verify password
          const bcrypt = require('bcryptjs');
          const passwordValid = await bcrypt.compare(this.payload.password, user.password_hash);
          
          if (!passwordValid) {
            await this.handleFailedLogin(user);
            throw new Error('Invalid credentials');
          }

          return { user, authentication_success: true };
        },
        compensationAction: async (context: any) => {
          // Log authentication failure
          await this.logSagaEvent('user_authentication_failed', 'compensated', {
            email: this.payload.email,
            reason: 'Authentication compensation'
          });
        }
      },
      {
        id: 'two_factor_check',
        name: 'Two-Factor Authentication Check',
        service: 'auth-service',
        action: async (context: any) => {
          const user = context.user_authentication.user;
          
          if (!user.two_factor_enabled) {
            return { two_factor_required: false };
          }

          if (!this.payload.two_factor_code) {
            // Store temporary session for 2FA completion
            const tempSessionId = this.generateTempSessionId();
            await redis.setex(`temp_admin_session:${tempSessionId}`, 300, JSON.stringify({
              user_id: user.id,
              email: user.email,
              saga_id: this.sagaId,
              operation_id: this.operationId,
              timestamp: Date.now()
            }));

            return { 
              two_factor_required: true, 
              temp_session_id: tempSessionId 
            };
          }

          // Verify 2FA code
          const twoFactorResult = await this.verify2FACode(user.id, this.payload.two_factor_code);
          
          if (!twoFactorResult.valid) {
            throw new Error('Invalid 2FA code');
          }

          return { 
            two_factor_required: true, 
            two_factor_verified: true,
            verification_method: twoFactorResult.method
          };
        },
        compensationAction: async (context: any) => {
          // Clean up temporary session if created
          const tempSessionId = context.two_factor_check?.temp_session_id;
          if (tempSessionId) {
            await redis.del(`temp_admin_session:${tempSessionId}`);
          }
        }
      },
      {
        id: 'security_verification',
        name: 'Security Verification',
        service: 'security-service',
        action: async (context: any) => {
          const user = context.user_authentication.user;
          const securityContext = context.security_pre_check;

          // Check if additional security verification is needed
          if (securityContext.suspicious_activity || 
              this.payload.security_context.is_suspicious ||
              this.payload.security_context.risk_score > 70) {
            
            // Create security incident
            const { data: incident } = await supabase
              .from('security_incidents')
              .insert({
                type: 'suspicious_admin_login',
                severity: 'medium',
                user_id: user.id,
                user_email: user.email,
                ip_address: this.payload.ip_address,
                description: 'Suspicious admin login attempt detected',
                details: {
                  security_context: this.payload.security_context,
                  saga_id: this.sagaId,
                  operation_id: this.operationId
                },
                status: 'investigating',
                timestamp: new Date().toISOString()
              })
              .select()
              .single();

            return { 
              security_verification_required: true,
              security_incident_id: incident?.id,
              risk_score: this.payload.security_context.risk_score
            };
          }

          return { security_verification_required: false };
        },
        compensationAction: async (context: any) => {
          // Update security incident status if created
          const incidentId = context.security_verification?.security_incident_id;
          if (incidentId) {
            await supabase
              .from('security_incidents')
              .update({ 
                status: 'resolved',
                resolution_notes: 'Login saga compensated - incident resolved'
              })
              .eq('id', incidentId);
          }
        }
      },
      {
        id: 'session_creation',
        name: 'Session Creation',
        service: 'session-service',
        action: async (context: any) => {
          const user = context.user_authentication.user;
          const twoFactorContext = context.two_factor_check;
          
          // Skip session creation if 2FA is required but not completed
          if (twoFactorContext.two_factor_required && !twoFactorContext.two_factor_verified) {
            return { session_created: false, pending_2fa: true };
          }

          // Skip if security verification is required
          if (context.security_verification.security_verification_required) {
            return { session_created: false, pending_security_verification: true };
          }

          const sessionId = this.generateSecureSessionId();
          const expiresAt = new Date();
          
          if (this.payload.remember_me) {
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
          } else {
            expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours
          }

          // Create session in database
          const { data: session, error: sessionError } = await supabase
            .from('active_sessions')
            .insert({
              session_id: sessionId,
              user_id: user.id,
              ip_address: this.payload.ip_address,
              user_agent: this.payload.user_agent,
              location: this.payload.location,
              device_type: this.getDeviceType(this.payload.user_agent),
              expires_at: expiresAt.toISOString(),
              is_suspicious: this.payload.security_context.is_suspicious
            })
            .select()
            .single();

          if (sessionError) {
            throw new Error('Failed to create session');
          }

          // Store session in Redis
          await redis.setex(`admin_session:${sessionId}`, 
            Math.floor((expiresAt.getTime() - Date.now()) / 1000),
            JSON.stringify({
              user_id: user.id,
              email: user.email,
              role: user.role,
              session_id: sessionId,
              auth_method: twoFactorContext.verification_method || 'password',
              security_level: twoFactorContext.two_factor_verified ? 'high' : 'medium',
              saga_id: this.sagaId,
              created_at: new Date().toISOString()
            })
          );

          return { 
            session_created: true, 
            session, 
            session_id: sessionId 
          };
        },
        compensationAction: async (context: any) => {
          // Clean up session if created
          const sessionId = context.session_creation?.session_id;
          if (sessionId) {
            await redis.del(`admin_session:${sessionId}`);
            await supabase
              .from('active_sessions')
              .delete()
              .eq('session_id', sessionId);
          }
        }
      },
      {
        id: 'audit_logging',
        name: 'Audit Logging',
        service: 'audit-service',
        action: async (context: any) => {
          const user = context.user_authentication.user;
          const sessionContext = context.session_creation;
          const twoFactorContext = context.two_factor_check;
          const securityContext = context.security_verification;

          // Determine login status
          let loginStatus = 'success';
          let action = 'admin_login_success';
          
          if (twoFactorContext.two_factor_required && !twoFactorContext.two_factor_verified) {
            loginStatus = 'pending_2fa';
            action = 'admin_login_pending_2fa';
          } else if (securityContext.security_verification_required) {
            loginStatus = 'pending_security_verification';
            action = 'admin_login_pending_security';
          }

          // Log the login attempt
          await supabase.from('audit_logs').insert({
            action,
            resource_type: 'admin_authentication',
            user_id: user.id,
            user_name: user.full_name,
            user_email: user.email,
            user_role: user.role,
            ip_address: this.payload.ip_address,
            user_agent: this.payload.user_agent,
            location: this.payload.location,
            session_id: sessionContext.session_id,
            saga_id: this.sagaId,
            operation_id: this.operationId,
            details: {
              login_method: twoFactorContext.verification_method || 'password',
              remember_me: this.payload.remember_me,
              security_score: this.payload.security_context.risk_score,
              device_fingerprint: this.payload.security_context.device_fingerprint,
              two_factor_used: twoFactorContext.two_factor_verified || false,
              security_incident_id: securityContext.security_incident_id
            },
            status: loginStatus === 'success' ? 'success' : 'warning',
            timestamp: new Date().toISOString()
          });

          // Update user login info if successful
          if (loginStatus === 'success') {
            await supabase
              .from('profiles')
              .update({
                last_login: new Date().toISOString(),
                failed_login_attempts: 0
              })
              .eq('id', user.id);
          }

          return { audit_logged: true, login_status: loginStatus };
        },
        compensationAction: async (context: any) => {
          // Log compensation event
          await supabase.from('audit_logs').insert({
            action: 'admin_login_saga_compensated',
            resource_type: 'admin_authentication',
            saga_id: this.sagaId,
            operation_id: this.operationId,
            details: {
              reason: 'Login saga compensation',
              original_email: this.payload.email
            },
            status: 'warning',
            timestamp: new Date().toISOString()
          });
        }
      }
    ];
  }

  // Helper methods
  private async logSagaEvent(action: string, status: string, details: any) {
    await supabase.from('audit_logs').insert({
      action,
      resource_type: 'admin_login_saga',
      saga_id: this.sagaId,
      operation_id: this.operationId,
      details,
      status,
      timestamp: new Date().toISOString()
    });
  }

  private detectSuspiciousPatterns(recentLogins: any[]): boolean {
    // Implement suspicious pattern detection logic
    if (recentLogins.length > 10) return true; // Too many attempts
    
    // Check for different user agents from same IP
    const uniqueUserAgents = new Set(recentLogins.map(login => login.user_agent));
    if (uniqueUserAgents.size > 3) return true;
    
    return false;
  }

  private calculateSecurityScore(): number {
    let score = 0;
    
    // Base score
    score += 50;
    
    // IP reputation (simplified)
    if (this.payload.ip_address.startsWith('192.168.') || 
        this.payload.ip_address.startsWith('10.') ||
        this.payload.ip_address.startsWith('172.')) {
      score -= 20; // Local network
    }
    
    // Device fingerprint consistency
    if (this.payload.security_context.device_fingerprint) {
      score += 10;
    }
    
    // Time of day (business hours are safer)
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 18) {
      score += 10;
    } else {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private async incrementLoginAttempts() {
    const key = `admin_login_attempts:${this.payload.ip_address}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 3600); // 1 hour
    }
  }

  private async handleFailedLogin(user: any) {
    const failedAttempts = (user.failed_login_attempts || 0) + 1;
    const shouldLock = failedAttempts >= 5;

    await supabase
      .from('profiles')
      .update({
        failed_login_attempts: failedAttempts,
        last_failed_login: new Date().toISOString(),
        ...(shouldLock && {
          account_locked: true,
          locked_at: new Date().toISOString()
        })
      })
      .eq('id', user.id);

    await this.incrementLoginAttempts();
  }

  private async verify2FACode(userId: string, code: string): Promise<{ valid: boolean; method: string }> {
    // Get 2FA secret
    const { data: twoFactorData } = await supabase
      .from('two_factor_auth')
      .select('secret_key, backup_codes')
      .eq('user_id', userId)
      .single();

    if (!twoFactorData) {
      return { valid: false, method: 'none' };
    }

    // Try TOTP first
    const authenticator = require('otplib').authenticator;
    try {
      const isValidTOTP = authenticator.verify({
        token: code,
        secret: twoFactorData.secret_key,
        window: 2
      });

      if (isValidTOTP) {
        return { valid: true, method: 'totp' };
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
    }

    // Try backup codes
    if (twoFactorData.backup_codes && twoFactorData.backup_codes.includes(code)) {
      // Remove used backup code
      const updatedCodes = twoFactorData.backup_codes.filter((c: string) => c !== code);
      await supabase
        .from('two_factor_auth')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);

      return { valid: true, method: 'backup_code' };
    }

    return { valid: false, method: 'invalid' };
  }

  private generateTempSessionId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecureSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 16);
    const hash = require('crypto').createHash('sha256')
      .update(`${timestamp}_${random}_admin_saga_${this.sagaId}`)
      .digest('hex')
      .substr(0, 32);
    
    return `admin_saga_${hash}`;
  }

  private getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }
}
