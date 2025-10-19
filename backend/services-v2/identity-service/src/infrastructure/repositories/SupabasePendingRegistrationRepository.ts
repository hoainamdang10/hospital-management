/**
 * SupabasePendingRegistrationRepository
 * Infrastructure implementation of IPendingRegistrationRepository
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern, HIPAA
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IPendingRegistrationRepository } from '../../domain/repositories/IPendingRegistrationRepository';
import { PendingRegistration, PendingRegistrationData, PendingRegistrationStatus } from '../../domain/entities/PendingRegistration';
import { Email } from '../../domain/value-objects/Email';
import { ILogger } from '../../application/services/ILogger';
import { ICircuitBreaker } from '../../application/services/ICircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';

export interface SupabasePendingRegistrationRepositoryConfig {
  supabase: SupabaseClient;
  logger: ILogger;
  circuitBreaker: ICircuitBreaker;
  schema?: string;
  tableName?: string;
}

interface PendingRegistrationRecord {
  id: string;
  email: string;
  password_hash: string;
  user_data: PendingRegistrationData;
  verification_token: string;
  expires_at: string;
  created_at: string;
  is_used: boolean;
  status?: PendingRegistrationStatus;
}

export class SupabasePendingRegistrationRepository implements IPendingRegistrationRepository {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly circuitBreaker: ICircuitBreaker;
  private readonly tableName: string;

  constructor(config: SupabasePendingRegistrationRepositoryConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.circuitBreaker = config.circuitBreaker;
    this.tableName = config.tableName || 'pending_registrations';
  }

  /**
   * Store new pending registration
   */
  async store(pendingRegistration: PendingRegistration): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Storing pending registration', {
            email: pendingRegistration.email.getMaskedEmail(),
            expiresAt: pendingRegistration.expiresAt
          });

          const { error } = await this.supabase
            .from(this.tableName)
            .insert({
              id: pendingRegistration.id,
              email: pendingRegistration.email.value,
              password_hash: pendingRegistration.passwordHash,
              user_data: pendingRegistration.userData,
              verification_token: pendingRegistration.verificationToken,
              expires_at: pendingRegistration.expiresAt.toISOString(),
              created_at: pendingRegistration.createdAt.toISOString(),
              is_used: false,
              status: pendingRegistration.status
            });

          if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') {
              throw new Error('Email đã có đăng ký đang chờ xác thực. Vui lòng kiểm tra email hoặc đợi hết hạn.');
            }

            this.logger.error('Failed to store pending registration', {
              email: pendingRegistration.email.getMaskedEmail(),
              error: error.message
            });
            throw new Error(`Lưu đăng ký tạm thất bại: ${error.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATION_CREATED', pendingRegistration.id, {
            email: pendingRegistration.email.value,
            roleType: pendingRegistration.userData.roleType,
            expiresAt: pendingRegistration.expiresAt
          });

          this.logger.info('Pending registration stored successfully', {
            id: pendingRegistration.id,
            email: pendingRegistration.email.getMaskedEmail()
          });
        } catch (error) {
          this.logger.error('Error storing pending registration', {
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker open for store pending registration');
        throw new Error('Dịch vụ đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.');
      }
    );
  }

  /**
   * Find pending registration by verification token
   */
  async findByToken(token: string): Promise<PendingRegistration | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding pending registration by token', {
            tokenPrefix: token.substring(0, 10) + '...'
          });

          const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('verification_token', token)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              this.logger.info('Pending registration not found by token');
              return null;
            }

            this.logger.error('Failed to find pending registration by token', {
              error: error.message
            });
            throw new Error(`Tìm đăng ký tạm thất bại: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          return this.mapToDomain(data as PendingRegistrationRecord);
        } catch (error) {
          this.logger.error('Error finding pending registration by token', {
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker open for findByToken, returning null');
        return null;
      }
    );
  }

  /**
   * Find pending registration by email
   */
  async findByEmail(email: Email): Promise<PendingRegistration | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding pending registration by email', {
            email: email.getMaskedEmail()
          });

          const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('email', email.value)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              this.logger.info('No active pending registration found for email');
              return null;
            }

            this.logger.error('Failed to find pending registration by email', {
              error: error.message
            });
            throw new Error(`Tìm đăng ký tạm thất bại: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          return this.mapToDomain(data as PendingRegistrationRecord);
        } catch (error) {
          this.logger.error('Error finding pending registration by email', {
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker open for findByEmail, returning null');
        return null;
      }
    );
  }

  /**
   * Delete pending registration by ID
   */
  async delete(id: string): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Deleting pending registration', { id });

          const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

          if (error) {
            this.logger.error('Failed to delete pending registration', {
              id,
              error: error.message
            });
            throw new Error(`Xóa đăng ký tạm thất bại: ${error.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATION_DELETED', id, {
            reason: 'manual_deletion'
          });

          this.logger.info('Pending registration deleted successfully', { id });
        } catch (error) {
          this.logger.error('Error deleting pending registration', {
            id,
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker open for delete pending registration');
        throw new Error('Dịch vụ xóa đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.');
      }
    );
  }

  /**
   * Delete pending registration by email
   */
  async deleteByEmail(email: Email): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Deleting pending registration by email', {
            email: email.getMaskedEmail()
          });

          const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('email', email.value);

          if (error) {
            this.logger.error('Failed to delete pending registration by email', {
              email: email.getMaskedEmail(),
              error: error.message
            });
            throw new Error(`Xóa đăng ký tạm thất bại: ${error.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATION_DELETED_BY_EMAIL', email.value, {
            email: email.value,
            reason: 'cleanup_after_verification'
          });

          this.logger.info('Pending registration deleted by email successfully', {
            email: email.getMaskedEmail()
          });
        } catch (error) {
          this.logger.error('Error deleting pending registration by email', {
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker open for deleteByEmail');
        throw new Error('Dịch vụ xóa đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.');
      }
    );
  }

  /**
   * Map database record to domain entity
   */
  private mapToDomain(record: PendingRegistrationRecord): PendingRegistration {
    // Convert dateOfBirth from string to Date if present
    const userData: PendingRegistrationData = {
      ...record.user_data,
      dateOfBirth: record.user_data.dateOfBirth
        ? new Date(record.user_data.dateOfBirth as unknown as string)
        : undefined
    };

    return PendingRegistration.fromPersistenceData({
      id: record.id,
      email: record.email,
      passwordHash: record.password_hash,
      userData,
      verificationToken: record.verification_token,
      expiresAt: new Date(record.expires_at),
      createdAt: new Date(record.created_at),
      isUsed: record.is_used,
      status: record.status
    });
  }

  /**
   * Delete all expired pending registrations
   */
  async deleteExpired(): Promise<number> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Deleting expired pending registrations');

          const now = new Date().toISOString();

          // First, count expired records
          const { count, error: countError } = await this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .or(`is_used.eq.true,expires_at.lt.${now}`);

          if (countError) {
            this.logger.error('Failed to count expired pending registrations', {
              error: countError.message
            });
            throw new Error(`Đếm đăng ký tạm hết hạn thất bại: ${countError.message}`);
          }

          const expiredCount = count || 0;

          if (expiredCount === 0) {
            this.logger.info('No expired pending registrations to delete');
            return 0;
          }

          // Delete expired records
          const { error: deleteError } = await this.supabase
            .from(this.tableName)
            .delete()
            .or(`is_used.eq.true,expires_at.lt.${now}`);

          if (deleteError) {
            this.logger.error('Failed to delete expired pending registrations', {
              error: deleteError.message
            });
            throw new Error(`Xóa đăng ký tạm hết hạn thất bại: ${deleteError.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATIONS_CLEANUP', 'system', {
            deletedCount: expiredCount,
            cleanupTime: new Date()
          });

          this.logger.info('Expired pending registrations deleted successfully', {
            deletedCount: expiredCount
          });

          return expiredCount;
        } catch (error) {
          this.logger.error('Error deleting expired pending registrations', {
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker open for deleteExpired, returning 0');
        return 0;
      }
    );
  }

  /**
   * Mark pending registration as used
   */
  async markAsUsed(id: string): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Marking pending registration as used', { id });

          const { error } = await this.supabase
            .from(this.tableName)
            .update({ 
              is_used: true,
              status: 'VERIFIED'
            })
            .eq('id', id);

          if (error) {
            this.logger.error('Failed to mark pending registration as used', {
              id,
              error: error.message
            });
            throw new Error(`Đánh dấu đăng ký tạm đã sử dụng thất bại: ${error.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATION_USED', id, {
            usedAt: new Date()
          });

          this.logger.info('Pending registration marked as used successfully', { id });
        } catch (error) {
          this.logger.error('Error marking pending registration as used', {
            id,
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker open for markAsUsed');
        throw new Error('Dịch vụ đánh dấu đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.');
      }
    );
  }

  /**
   * Update status of pending registration
   */
  async updateStatus(id: string, status: PendingRegistrationStatus): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Updating pending registration status', { id, status });

          const { error } = await this.supabase
            .from(this.tableName)
            .update({ status })
            .eq('id', id);

          if (error) {
            this.logger.error('Failed to update pending registration status', {
              id,
              status,
              error: error.message
            });
            throw new Error(`Cập nhật trạng thái đăng ký tạm thất bại: ${error.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATION_STATUS_UPDATED', id, {
            status,
            updatedAt: new Date()
          });

          this.logger.info('Pending registration status updated successfully', { id, status });
        } catch (error) {
          this.logger.error('Error updating pending registration status', {
            id,
            status,
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker open for updateStatus');
        throw new Error('Dịch vụ cập nhật trạng thái không khả dụng. Vui lòng thử lại sau.');
      }
    );
  }

  /**
   * Update verification token for pending registration
   * Used when resending verification email
   */
  async updateToken(id: string, newToken: string, expiresAt: Date): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Updating pending registration token', {
            id,
            expiresAt
          });

          const { error } = await this.supabase
            .from(this.tableName)
            .update({
              verification_token: newToken,
              expires_at: expiresAt.toISOString(),
              status: 'EMAIL_RESENT'
            })
            .eq('id', id);

          if (error) {
            this.logger.error('Failed to update pending registration token', {
              id,
              error: error.message
            });
            throw new Error(`Cập nhật token đăng ký tạm thất bại: ${error.message}`);
          }

          // Log audit event
          await this.logAudit('PENDING_REGISTRATION_TOKEN_UPDATED', id, {
            expiresAt,
            updatedAt: new Date()
          });

          this.logger.info('Pending registration token updated successfully', { id });
        } catch (error) {
          this.logger.error('Error updating pending registration token', {
            id,
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        throw new Error('Dịch vụ cập nhật token đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.');
      }
    );
  }

  /**
   * Count active pending registrations for email
   */
  async countActiveForEmail(email: Email): Promise<number> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Counting active pending registrations for email', {
            email: email.getMaskedEmail()
          });

          const { count, error } = await this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('email', email.value)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString());

          if (error) {
            this.logger.error('Failed to count active pending registrations', {
              email: email.getMaskedEmail(),
              error: error.message
            });
            throw new Error(`Đếm đăng ký tạm thất bại: ${error.message}`);
          }

          return count || 0;
        } catch (error) {
          this.logger.error('Error counting active pending registrations', {
            error: getErrorMessage(error)
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker open for countActiveForEmail, returning 0');
        return 0;
      }
    );
  }

  /**
   * Check if email has active pending registration
   */
  async hasActivePendingRegistration(email: Email): Promise<boolean> {
    const count = await this.countActiveForEmail(email);
    return count > 0;
  }

  /**
   * Log audit event
   */
  private async logAudit(action: string, entityId: string, details: Record<string, unknown>): Promise<void> {
    try {
      await this.supabase
        .schema('auth_schema')
        .from('audit_logs')
        .insert({
          action,
          resource_type: 'pending_registration',
          resource_id: entityId,
          details,
          severity: 'info',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      this.logger.error('Failed to log audit event', {
        action,
        entityId,
        error: getErrorMessage(error)
      });
      // Don't throw - audit logging failure shouldn't break the operation
    }
  }
}

