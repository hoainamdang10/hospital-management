/**
 * Supabase User Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Infrastructure Layer - Data Access with Vietnamese healthcare compliance
 * Schema: auth_schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, HIPAA
 */

import { OptimizedSupabaseClient } from '../../../../shared/infrastructure/database/optimized-supabase-client';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';
import { UserSession } from '../../domain/entities/UserSession';
import { LoginAttempt } from '../../domain/entities/LoginAttempt';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';

interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  national_id?: string;
  emergency_contact?: string;
  role_name: string;
  role_display_name: string;
  role_permissions: any[];
  role_hierarchy: number;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUserRepositoryConfig {
  supabase: OptimizedSupabaseClient;
  logger: ILogger;
  auditService: IAuditService;
  schema: string;
  tableName: string;
}

/**
 * Supabase User Repository
 * Implements user repository with Vietnamese healthcare compliance
 */
export class SupabaseUserRepository implements IUserRepository {
  private readonly supabaseClient: OptimizedSupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabaseUserRepositoryConfig) {
    this.supabaseClient = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'auth_schema';
    this.tableName = config.tableName || 'user_profiles';
  }

  public async save(user: User): Promise<void> {
    try {
      this.logger.info('Saving user to database', {
        userId: user.id.value,
        email: user.email.value,
        role: user.healthcareRole.name
      });

      const client = await this.supabaseClient.getConnection();

      // Convert aggregate to persistence format
      const record = this.toPersistence(user);

      // Use upsert to handle both create and update
      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .upsert(record, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error saving user to database', {
          userId: user.id.value,
          error: error.message,
          details: error.details
        });

        throw new Error(`Lỗi lưu người dùng: ${error.message}`);
      }

      // HIPAA audit logging
      await this.auditService.logUserAccess(
        'SAVE',
        user.id.value,
        'SYSTEM',
        'User record saved to database',
        {
          email: user.email.value,
          role: user.healthcareRole.name,
          isActive: user.isActive
        }
      );

      this.logger.info('User saved successfully', {
        userId: user.id.value,
        id: data?.id
      });

    } catch (error) {
      this.logger.error('Error saving user', {
        userId: user.id.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi lưu người dùng: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async findById(id: UserId): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('id', id.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Lỗi tìm người dùng: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('email', email.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Lỗi tìm người dùng theo email: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  public async findByNationalId(nationalId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('national_id', nationalId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Lỗi tìm người dùng theo CMND/CCCD: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }

  public async delete(id: UserId): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .delete()
      .eq('id', id.value);

    if (error) {
      throw new Error(`Lỗi xóa người dùng: ${error.message}`);
    }
  }

  public async exists(id: UserId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('id', id.value)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Lỗi kiểm tra tồn tại người dùng: ${error.message}`);
    }

    return !!data;
  }

  public async findByRole(role: HealthcareRole): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('role_name', role.name);

    if (error) {
      throw new Error(`Lỗi tìm người dùng theo vai trò: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async findActiveUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Lỗi tìm người dùng đang hoạt động: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async findInactiveUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('is_active', false);

    if (error) {
      throw new Error(`Lỗi tìm người dùng không hoạt động: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async findUnverifiedUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('is_email_verified', false);

    if (error) {
      throw new Error(`Lỗi tìm người dùng chưa xác thực: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async searchByName(name: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .ilike('full_name', `%${name}%`);

    if (error) {
      throw new Error(`Lỗi tìm kiếm người dùng theo tên: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async searchByPhoneNumber(phoneNumber: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .eq('phone_number', phoneNumber);

    if (error) {
      throw new Error(`Lỗi tìm kiếm người dùng theo số điện thoại: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async findAll(page: number, limit: number): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      this.supabase
        .from('user_profiles')
        .select(`
          *,
          healthcare_roles (
            name,
            display_name,
            description,
            hierarchy,
            is_active,
            role_permissions (
              permission_name,
              resource_type,
              actions,
              conditions
            )
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false }),
      
      this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
    ]);

    if (dataResult.error) {
      throw new Error(`Lỗi lấy danh sách người dùng: ${dataResult.error.message}`);
    }

    if (countResult.error) {
      throw new Error(`Lỗi đếm số lượng người dùng: ${countResult.error.message}`);
    }

    const users = dataResult.data.map(record => this.toDomain(record));
    const total = countResult.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Healthcare-specific queries
  public async findDoctors(): Promise<User[]> {
    return this.findByRole(HealthcareRole.createDoctor());
  }

  public async findNurses(): Promise<User[]> {
    return this.findByRole(HealthcareRole.createNurse());
  }

  public async findPatients(): Promise<User[]> {
    return this.findByRole(HealthcareRole.createPatient());
  }

  public async findAdministrators(): Promise<User[]> {
    return this.findByRole(HealthcareRole.createAdmin());
  }

  public async findReceptionists(): Promise<User[]> {
    return this.findByRole(HealthcareRole.createReceptionist());
  }

  public async countByRole(role: HealthcareRole): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role_name', role.name);

    if (error) {
      throw new Error(`Lỗi đếm người dùng theo vai trò: ${error.message}`);
    }

    return count || 0;
  }

  public async countActiveUsers(): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      throw new Error(`Lỗi đếm người dùng đang hoạt động: ${error.message}`);
    }

    return count || 0;
  }

  public async countInactiveUsers(): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (error) {
      throw new Error(`Lỗi đếm người dùng không hoạt động: ${error.message}`);
    }

    return count || 0;
  }

  public async getRegistrationStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    byRole: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    // Implementation for registration statistics
    // This would involve complex queries to aggregate data
    throw new Error('Method not implemented yet');
  }

  public async findUsersWithLastLogin(days: number): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .gte('last_login_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Lỗi tìm người dùng có đăng nhập gần đây: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async findUsersWithoutLogin(days: number): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        healthcare_roles (
          name,
          display_name,
          description,
          hierarchy,
          is_active,
          role_permissions (
            permission_name,
            resource_type,
            actions,
            conditions
          )
        )
      `)
      .or(`last_login_at.is.null,last_login_at.lt.${cutoffDate.toISOString()}`);

    if (error) {
      throw new Error(`Lỗi tìm người dùng không đăng nhập lâu: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  public async findExpiredAccounts(): Promise<User[]> {
    // Implementation for finding expired accounts
    // This would depend on business rules for account expiration
    throw new Error('Method not implemented yet');
  }

  public async saveMany(users: User[]): Promise<void> {
    const records = users.map(user => this.toRecord(user));
    
    const { error } = await this.supabase
      .from('user_profiles')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new Error(`Lỗi lưu nhiều người dùng: ${error.message}`);
    }
  }

  public async updateMany(userIds: UserId[], updates: Partial<User>): Promise<void> {
    // Implementation for bulk updates
    throw new Error('Method not implemented yet');
  }

  public async deactivateMany(userIds: UserId[]): Promise<void> {
    const ids = userIds.map(id => id.value);
    
    const { error } = await this.supabase
      .from('user_profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Lỗi vô hiệu hóa nhiều người dùng: ${error.message}`);
    }
  }

  public async activateMany(userIds: UserId[]): Promise<void> {
    const ids = userIds.map(id => id.value);
    
    const { error } = await this.supabase
      .from('user_profiles')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Lỗi kích hoạt nhiều người dùng: ${error.message}`);
    }
  }

  // Mapping methods
  private toRecord(user: User): UserRecord {
    return {
      id: user.id.value,
      email: user.email.value,
      password_hash: (user as any).props.passwordHash,
      full_name: user.personalInfo.fullName,
      phone_number: user.personalInfo.phoneNumber,
      date_of_birth: user.personalInfo.dateOfBirth?.toISOString().split('T')[0],
      gender: user.personalInfo.gender,
      address: user.personalInfo.address,
      national_id: user.personalInfo.nationalId,
      emergency_contact: user.personalInfo.emergencyContact,
      role_name: user.healthcareRole.name,
      role_display_name: user.healthcareRole.displayName,
      role_permissions: user.healthcareRole.permissions,
      role_hierarchy: user.healthcareRole.hierarchy,
      is_active: user.isActive,
      is_email_verified: user.isEmailVerified,
      last_login_at: user.lastLoginAt?.toISOString(),
      created_at: (user as any).props.createdAt.toISOString(),
      updated_at: (user as any).props.updatedAt.toISOString()
    };
  }

  private toDomain(record: any): User {
    const userId = UserId.create(record.id);
    const email = Email.create(record.email);
    const personalInfo = PersonalInfo.create({
      fullName: record.full_name,
      phoneNumber: record.phone_number,
      dateOfBirth: record.date_of_birth ? new Date(record.date_of_birth) : undefined,
      gender: record.gender,
      address: record.address,
      nationalId: record.national_id,
      emergencyContact: record.emergency_contact
    });

    const healthcareRole = HealthcareRole.reconstitute({
      id: record.healthcare_roles?.id || `role_${record.role_name}`,
      name: record.role_name,
      displayName: record.role_display_name,
      description: record.healthcare_roles?.description || '',
      permissions: record.healthcare_roles?.role_permissions || [],
      hierarchy: record.role_hierarchy,
      isActive: record.healthcare_roles?.is_active ?? true,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    });

    return User.reconstitute({
      id: userId,
      email,
      personalInfo,
      passwordHash: record.password_hash,
      healthcareRole,
      isActive: record.is_active,
      isEmailVerified: record.is_email_verified,
      lastLoginAt: record.last_login_at ? new Date(record.last_login_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    });
  }
}
