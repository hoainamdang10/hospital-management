import { supabaseClient } from '@/lib/supabase-client'

export interface TwoFactorSettings {
  id: string
  user_id: string
  is_enabled: boolean
  method: '2fa_app' | 'sms' | 'email'
  secret_key?: string
  backup_codes?: string[]
  phone_number?: string
  email?: string
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface TwoFactorAttempt {
  id: string
  user_id: string
  attempt_type: 'login' | 'setup' | 'disable'
  method: '2fa_app' | 'sms' | 'email' | 'backup'
  is_successful: boolean
  created_at: string
}

export interface SetupTwoFactorResponse {
  secret: string
  qr_code_url: string
  backup_codes: string[]
}

export class TwoFactorService {
  // Get user's 2FA settings
  static async getTwoFactorSettings(userId: string): Promise<TwoFactorSettings | null> {
    try {
      const { data, error } = await supabaseClient
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No 2FA settings found, create default
          return await this.createDefaultSettings(userId)
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error getting 2FA settings:', error)
      return null
    }
  }

  // Create default 2FA settings for user
  static async createDefaultSettings(userId: string): Promise<TwoFactorSettings> {
    const { data, error } = await supabaseClient
      .from('two_factor_auth')
      .insert({
        user_id: userId,
        is_enabled: false,
        method: '2fa_app'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  // Generate secret key for TOTP
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  // Generate QR code URL for authenticator apps
  static generateQRCodeURL(secret: string, userEmail: string, issuer: string = 'Hospital Management'): string {
    const label = encodeURIComponent(`${issuer}:${userEmail}`)
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    })
    
    return `otpauth://totp/${label}?${params.toString()}`
  }

  // Setup 2FA for user
  static async setupTwoFactor(userId: string, method: '2fa_app' | 'sms' | 'email', additionalData?: {
    phone_number?: string
    email?: string
  }): Promise<SetupTwoFactorResponse> {
    try {
      // Generate secret and backup codes
      const secret = this.generateSecret()
      const backupCodes = await this.generateBackupCodes()

      // Get user email for QR code
      const { data: user } = await supabaseClient.auth.getUser()
      const userEmail = user.user?.email || ''

      // Update 2FA settings
      const { error } = await supabaseClient
        .from('two_factor_auth')
        .upsert({
          user_id: userId,
          method,
          secret_key: method === '2fa_app' ? secret : null,
          backup_codes: backupCodes,
          phone_number: additionalData?.phone_number,
          email: additionalData?.email,
          is_enabled: false // Will be enabled after verification
        })

      if (error) {
        throw error
      }

      return {
        secret,
        qr_code_url: this.generateQRCodeURL(secret, userEmail),
        backup_codes: backupCodes
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      throw error
    }
  }

  // Generate backup codes
  static async generateBackupCodes(): Promise<string[]> {
    const { data, error } = await supabaseClient
      .rpc('generate_backup_codes')

    if (error) {
      throw error
    }

    return data || []
  }

  // Verify TOTP code
  static verifyTOTP(secret: string, token: string): boolean {
    // This is a simplified TOTP verification
    // In production, use a proper TOTP library like 'otplib'
    const window = 30 // 30 second window
    const currentTime = Math.floor(Date.now() / 1000 / window)
    
    // Check current time window and adjacent windows for clock drift
    for (let i = -1; i <= 1; i++) {
      const timeStep = currentTime + i
      const expectedToken = this.generateTOTP(secret, timeStep)
      if (expectedToken === token) {
        return true
      }
    }
    
    return false
  }

  // Generate TOTP token (simplified implementation)
  private static generateTOTP(secret: string, timeStep: number): string {
    // This is a simplified implementation
    // In production, use a proper TOTP library
    const hash = this.hmacSHA1(this.base32Decode(secret), this.intToBytes(timeStep))
    const offset = hash[hash.length - 1] & 0xf
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff)
    
    return (code % 1000000).toString().padStart(6, '0')
  }

  // Helper functions for TOTP (simplified)
  private static base32Decode(encoded: string): Uint8Array {
    // Simplified base32 decode - use proper library in production
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const bytes: number[] = []
    
    for (let i = 0; i < encoded.length; i += 8) {
      const chunk = encoded.slice(i, i + 8).padEnd(8, '=')
      let bits = 0
      let bitsCount = 0
      
      for (const char of chunk) {
        if (char === '=') break
        bits = (bits << 5) | alphabet.indexOf(char)
        bitsCount += 5
        
        if (bitsCount >= 8) {
          bytes.push((bits >> (bitsCount - 8)) & 0xff)
          bitsCount -= 8
        }
      }
    }
    
    return new Uint8Array(bytes)
  }

  private static intToBytes(num: number): Uint8Array {
    const bytes = new Uint8Array(8)
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xff
      num >>= 8
    }
    return bytes
  }

  private static hmacSHA1(key: Uint8Array, data: Uint8Array): Uint8Array {
    // Simplified HMAC-SHA1 - use proper crypto library in production
    // This is just a placeholder implementation
    return new Uint8Array(20) // SHA1 produces 20 bytes
  }

  // Verify 2FA code
  static async verifyTwoFactor(userId: string, code: string, method?: '2fa_app' | 'sms' | 'email' | 'backup'): Promise<boolean> {
    try {
      // Check rate limiting
      const { data: rateLimitOk } = await supabaseClient
        .rpc('check_2fa_rate_limit', {
          user_uuid: userId,
          attempt_type_param: 'login'
        })

      if (!rateLimitOk) {
        throw new Error('Too many failed attempts. Please try again later.')
      }

      // Get 2FA settings
      const settings = await this.getTwoFactorSettings(userId)
      if (!settings || !settings.is_enabled) {
        throw new Error('2FA is not enabled for this user')
      }

      let isValid = false

      // Verify based on method
      if (method === 'backup' || (!method && settings.backup_codes?.includes(code))) {
        // Verify backup code
        const { data } = await supabaseClient
          .rpc('validate_backup_code', {
            user_uuid: userId,
            input_code: code
          })
        isValid = data === true
      } else if (settings.method === '2fa_app' && settings.secret_key) {
        // Verify TOTP
        isValid = this.verifyTOTP(settings.secret_key, code)
      }

      // Log attempt
      await this.logAttempt(userId, 'login', method || settings.method, code, isValid)

      if (isValid) {
        // Update last used timestamp
        await supabaseClient
          .from('two_factor_auth')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', userId)

        // Update profile
        await supabaseClient
          .from('profiles')
          .update({ last_2fa_verification: new Date().toISOString() })
          .eq('id', userId)
      }

      return isValid
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      throw error
    }
  }

  // Enable 2FA after successful setup verification
  static async enableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const settings = await this.getTwoFactorSettings(userId)
      if (!settings) {
        throw new Error('2FA settings not found')
      }

      // Verify the code
      let isValid = false
      if (settings.method === '2fa_app' && settings.secret_key) {
        isValid = this.verifyTOTP(settings.secret_key, verificationCode)
      }

      if (!isValid) {
        await this.logAttempt(userId, 'setup', settings.method, verificationCode, false)
        return false
      }

      // Enable 2FA
      const { error } = await supabaseClient
        .from('two_factor_auth')
        .update({ is_enabled: true })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // Update profile
      await supabaseClient
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', userId)

      await this.logAttempt(userId, 'setup', settings.method, verificationCode, true)
      return true
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      throw error
    }
  }

  // Disable 2FA
  static async disableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      // Verify current 2FA code before disabling
      const isValid = await this.verifyTwoFactor(userId, verificationCode)
      
      if (!isValid) {
        return false
      }

      // Disable 2FA
      const { error } = await supabaseClient
        .from('two_factor_auth')
        .update({ 
          is_enabled: false,
          secret_key: null,
          backup_codes: null
        })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // Update profile
      await supabaseClient
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('id', userId)

      await this.logAttempt(userId, 'disable', 'app', verificationCode, true)
      return true
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      throw error
    }
  }

  // Log 2FA attempt
  static async logAttempt(
    userId: string, 
    attemptType: 'login' | 'setup' | 'disable',
    method: '2fa_app' | 'sms' | 'email' | 'backup',
    code: string,
    isSuccessful: boolean
  ): Promise<void> {
    try {
      await supabaseClient
        .from('two_factor_attempts')
        .insert({
          user_id: userId,
          attempt_type: attemptType,
          method,
          code_used: code.substring(0, 2) + '****', // Log partial code for security
          is_successful: isSuccessful,
          ip_address: null, // Would be populated by backend
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Error logging 2FA attempt:', error)
    }
  }

  // Get 2FA attempt history
  static async getAttemptHistory(userId: string, limit: number = 10): Promise<TwoFactorAttempt[]> {
    try {
      const { data, error } = await supabaseClient
        .from('two_factor_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error getting 2FA attempt history:', error)
      return []
    }
  }
}
