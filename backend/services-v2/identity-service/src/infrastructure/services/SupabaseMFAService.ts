/**
 * Supabase MFA Service Implementation
 * Infrastructure layer implementation of IMFAService
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { IMFAService, MFAMethod, MFASetupResult, MFASettings } from '../../application/services/IMFAService';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { getErrorMessage } from '../../utils/error-helper';

/**
 * Supabase MFA Service
 * Implements MFA operations using Supabase backend
 */
export class SupabaseMFAService implements IMFAService {
  constructor(
    private supabaseClient: SupabaseClient,
    private logger: any
  ) {}

  /**
   * Enable MFA for user
   */
  async enableMFA(
    userId: string,
    method: MFAMethod,
    phoneNumber?: string,
    email?: string
  ): Promise<MFASetupResult> {
    try {
      // Generate TOTP secret
      const secret = this.generateSecret();

      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId);

      // Generate QR code URL
      const qrCodeUrl = this.generateQRCodeURL(secret, userId);

      // Store MFA settings (not enabled yet - requires verification)
      const { error: insertError } = await this.supabaseClient
        .from('two_factor_auth')
        .upsert({
          user_id: userId,
          method,
          secret_key: method === '2fa_app' ? secret : null,
          backup_codes: backupCodes,
          phone_number: phoneNumber,
          email,
          is_enabled: false, // Will be enabled after verification
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        this.logger.error('Failed to store MFA settings', { error: insertError });
        throw new Error(`Lỗi lưu cài đặt MFA: ${getErrorMessage(insertError)}`);
      }

      return { secret, qrCodeUrl, backupCodes };
    } catch (error) {
      this.logger.error('Failed to enable MFA', { userId, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('two_factor_auth')
        .update({ is_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        this.logger.error('Failed to disable MFA', { userId, error });
        throw new Error(`Lỗi vô hiệu hóa MFA: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      this.logger.error('Failed to disable MFA', { userId, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  async verifyCode(userId: string, code: string, _method: MFAMethod): Promise<boolean> {
    try {
      // Get MFA settings
      const settings = await this.getMFASettings(userId);
      if (!settings || !settings.secretKey) {
        return false;
      }

      // Verify TOTP code (method is determined by settings)
      return this.verifyTOTP(code, settings.secretKey);
    } catch (error) {
      this.logger.error('Failed to verify MFA code', { userId, error: getErrorMessage(error) });
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(_userId: string): Promise<string[]> {
    try {
      // Try to call Supabase RPC function
      const { data, error } = await this.supabaseClient
        .rpc('generate_backup_codes');

      if (error) {
        this.logger.warn('Failed to generate backup codes via RPC, using fallback', { error });
        return this.generateBackupCodesLocally();
      }

      return data || this.generateBackupCodesLocally();
    } catch (error) {
      this.logger.warn('Error calling generate_backup_codes RPC, using fallback', { error });
      return this.generateBackupCodesLocally();
    }
  }

  /**
   * Validate backup code
   */
  async validateBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // Call Supabase RPC function to validate and mark code as used
      const { data, error } = await this.supabaseClient
        .rpc('validate_backup_code', {
          p_user_id: userId,
          p_code: code
        });

      if (error) {
        this.logger.error('Failed to validate backup code', { userId, error });
        return false;
      }

      return data?.valid || false;
    } catch (error) {
      this.logger.error('Error validating backup code', { userId, error: getErrorMessage(error) });
      return false;
    }
  }

  /**
   * Check if MFA is enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('two_factor_auth')
        .select('is_enabled')
        .eq('user_id', userId)
        .single();

      if (error) {
        return false;
      }

      return data?.is_enabled || false;
    } catch (error) {
      this.logger.error('Failed to check MFA status', { userId, error: getErrorMessage(error) });
      return false;
    }
  }

  /**
   * Get MFA settings
   */
  async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        method: data.method,
        isEnabled: data.is_enabled,
        secretKey: data.secret_key,
        phoneNumber: data.phone_number,
        email: data.email,
        backupCodes: data.backup_codes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      this.logger.error('Failed to get MFA settings', { userId, error: getErrorMessage(error) });
      return null;
    }
  }

  /**
   * Update MFA settings
   */
  async updateMFASettings(userId: string, settings: Partial<MFASettings>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (settings.isEnabled !== undefined) updateData.is_enabled = settings.isEnabled;
      if (settings.method) updateData.method = settings.method;
      if (settings.secretKey) updateData.secret_key = settings.secretKey;
      if (settings.phoneNumber) updateData.phone_number = settings.phoneNumber;
      if (settings.email) updateData.email = settings.email;
      if (settings.backupCodes) updateData.backup_codes = settings.backupCodes;

      const { error } = await this.supabaseClient
        .from('two_factor_auth')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        this.logger.error('Failed to update MFA settings', { userId, error });
        throw new Error(`Lỗi cập nhật cài đặt MFA: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      this.logger.error('Failed to update MFA settings', { userId, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(userId: string, attemptType: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('mfa_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('attempt_type', attemptType)
        .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order('attempted_at', { ascending: false });

      if (error) {
        this.logger.warn('Failed to check rate limit', { userId, error });
        return true; // Allow on error
      }

      // Allow max 5 attempts in 15 minutes
      return (data?.length || 0) < 5;
    } catch (error) {
      this.logger.warn('Error checking rate limit', { userId, error: getErrorMessage(error) });
      return true; // Allow on error
    }
  }

  /**
   * Record failed attempt
   */
  async recordFailedAttempt(
    userId: string,
    attemptType: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.supabaseClient
        .from('mfa_attempts')
        .insert({
          user_id: userId,
          attempt_type: attemptType,
          success: false,
          ip_address: ipAddress,
          user_agent: userAgent,
          attempted_at: new Date().toISOString()
        });
    } catch (error) {
      this.logger.warn('Failed to record failed attempt', { userId, error: getErrorMessage(error) });
    }
  }

  /**
   * Clear failed attempts
   */
  async clearFailedAttempts(userId: string, attemptType: string): Promise<void> {
    try {
      await this.supabaseClient
        .from('mfa_attempts')
        .delete()
        .eq('user_id', userId)
        .eq('attempt_type', attemptType);
    } catch (error) {
      this.logger.warn('Failed to clear failed attempts', { userId, error: getErrorMessage(error) });
    }
  }

  // Private helper methods

  /**
   * Generate TOTP secret (Base32 encoded)
   */
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  private generateQRCodeURL(secret: string, userId: string, issuer: string = 'Hospital Management'): string {
    const label = encodeURIComponent(`${issuer}:${userId}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });

    return `otpauth://totp/${label}?${params.toString()}`;
  }

  /**
   * Generate backup codes locally (fallback)
   */
  private generateBackupCodesLocally(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify TOTP code
   * Implements RFC 6238 TOTP algorithm
   */
  private verifyTOTP(code: string, secret: string): boolean {
    try {
      const window = 1; // Allow 1 time step before/after
      const timeStep = 30; // 30 seconds
      const currentTime = Math.floor(Date.now() / 1000);

      for (let i = -window; i <= window; i++) {
        const time = currentTime + (i * timeStep);
        const expectedCode = this.generateTOTP(secret, time);
        if (code === expectedCode) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to verify TOTP', { error: getErrorMessage(error) });
      return false;
    }
  }

  /**
   * Generate TOTP code
   */
  private generateTOTP(secret: string, time: number): string {
    const timeHex = Math.floor(time / 30).toString(16).padStart(16, '0');
    const timeBuffer = Buffer.from(timeHex, 'hex');
    const secretBuffer = this.base32Decode(secret);

    const hmac = createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Decode Base32 string to Buffer
   */
  private base32Decode(base32: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedBase32 = base32.toUpperCase().replace(/=+$/, '');
    let bits = '';

    for (const char of cleanedBase32) {
      const val = alphabet.indexOf(char);
      if (val === -1) throw new Error('Invalid base32 character');
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }

    return Buffer.from(bytes);
  }
}

