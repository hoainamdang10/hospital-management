import { supabaseAdmin } from '../config/supabase';
import logger from '@hospital/shared/dist/utils/logger';

export interface UserResponse {
  user?: any;
  users?: any[];
  pagination?: any;
  error?: string;
}

export interface GetUsersOptions {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

export class UserService {

  /**
   * Get user profile by ID
   */
  public async getUserProfile(userId: string): Promise<UserResponse> {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          doctors(*),
          patients(*),
          admin(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Get user profile error:', error);
        return { error: 'User not found' };
      }

      // Format user data
      const user = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        phone_number: profile.phone_number,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        // Include role-specific data
        role_data: this.getRoleSpecificData(profile)
      };

      return { user };

    } catch (error) {
      logger.error('Get user profile service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Update user profile
   */
  public async updateUserProfile(userId: string, updateData: any): Promise<UserResponse> {
    try {
      // First update the profile
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Update user profile error:', error);
        return { error: 'Failed to update profile' };
      }

      // If this is a doctor profile and we're updating phone_number, email, or full_name,
      // also update the doctors table
      if (profile.role === 'doctor' && (updateData.phone_number || updateData.email || updateData.full_name)) {
        const doctorUpdateData: any = {};

        if (updateData.phone_number) doctorUpdateData.phone_number = updateData.phone_number;
        if (updateData.email) doctorUpdateData.email = updateData.email;
        if (updateData.full_name) doctorUpdateData.full_name = updateData.full_name;

        if (Object.keys(doctorUpdateData).length > 0) {
          doctorUpdateData.updated_at = new Date().toISOString();

          const { error: doctorError } = await supabaseAdmin
            .from('doctors')
            .update(doctorUpdateData)
            .eq('profile_id', userId);

          if (doctorError) {
            logger.warn('Failed to update doctor record during profile update', {
              error: doctorError,
              userId,
              updatedFields: Object.keys(doctorUpdateData)
            });
            // Don't throw error, just log warning as profile update succeeded
          } else {
            logger.info('Successfully synced profile update to doctor record', {
              userId,
              updatedFields: Object.keys(doctorUpdateData)
            });
          }
        }
      }

      return { user: profile };

    } catch (error) {
      logger.error('Update user profile service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get all users with pagination and filters
   */
  public async getAllUsers(options: GetUsersOptions): Promise<UserResponse> {
    try {
      const { page, limit, role, search } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('profiles')
        .select(`
          *,
          doctors(doctor_id, specialization, license_number),
          patients(patient_id, medical_history, status),
          admin(admin_id, permissions)
        `, { count: 'exact' });

      // Apply filters
      if (role) {
        query = query.eq('role', role);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data: profiles, error, count } = await query;

      if (error) {
        logger.error('Get all users error:', error);
        return { error: 'Failed to retrieve users' };
      }

      // Format users data
      const users = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        phone_number: profile.phone_number,
        gender: profile.gender,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        role_data: this.getRoleSpecificData(profile)
      })) || [];

      // Calculate pagination
      const totalPages = Math.ceil((count || 0) / limit);
      const pagination = {
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      };

      return { users, pagination };

    } catch (error) {
      logger.error('Get all users service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Update user status (active/inactive)
   */
  public async updateUserStatus(userId: string, isActive: boolean): Promise<UserResponse> {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Update user status error:', error);
        return { error: 'Failed to update user status' };
      }

      // If deactivating, also revoke all sessions
      if (!isActive) {
        try {
          await supabaseAdmin.auth.admin.signOut(userId, 'global');
        } catch (signOutError) {
          logger.warn('Failed to sign out user sessions:', signOutError);
          // Don't fail the operation, just log the warning
        }
      }

      return { user: profile };

    } catch (error) {
      logger.error('Update user status service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Update user role
   */
  public async updateUserRole(userId: string, newRole: string): Promise<UserResponse> {
    try {
      // Start a transaction to update profile and create/remove role-specific records
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        logger.error('Update user role error:', profileError);
        return { error: 'Failed to update user role' };
      }

      // Handle role-specific record creation/deletion
      await this.handleRoleChange(userId, newRole, profile);

      return { user: profile };

    } catch (error) {
      logger.error('Update user role service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Delete user account
   */
  public async deleteUser(userId: string): Promise<UserResponse> {
    try {
      // Delete from Supabase Auth (this will cascade to profiles table)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        logger.error('Delete user auth error:', authError);
        return { error: 'Failed to delete user account' };
      }

      // Clean up role-specific records
      await this.cleanupRoleSpecificRecords(userId);

      return { user: null };

    } catch (error) {
      logger.error('Delete user service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Get role-specific data from profile
   */
  private getRoleSpecificData(profile: any): any {
    switch (profile.role) {
      case 'doctor':
        return profile.doctors?.[0] || null;
      case 'patient':
        return profile.patients?.[0] || null;
      case 'admin':
        return profile.admin?.[0] || null;
      default:
        return null;
    }
  }

  /**
   * Handle role change - create/delete role-specific records
   */
  private async handleRoleChange(userId: string, newRole: string, profile: any): Promise<void> {
    try {
      // Remove old role-specific records
      await this.cleanupRoleSpecificRecords(userId);

      // Create new role-specific record
      switch (newRole) {
        case 'doctor':
          await this.createDoctorRecord(userId, profile);
          break;
        case 'patient':
          await this.createPatientRecord(userId, profile);
          break;
        case 'admin':
          await this.createAdminRecord(userId, profile);
          break;
      }
    } catch (error) {
      logger.error('Handle role change error:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Clean up role-specific records
   */
  private async cleanupRoleSpecificRecords(userId: string): Promise<void> {
    try {
      // Delete from all role-specific tables
      await Promise.all([
        supabaseAdmin.from('doctors').delete().eq('profile_id', userId),
        supabaseAdmin.from('patients').delete().eq('profile_id', userId),
        supabaseAdmin.from('admin').delete().eq('profile_id', userId)
      ]);
    } catch (error) {
      logger.error('Cleanup role-specific records error:', error);
    }
  }

  /**
   * Create doctor record
   */
  private async createDoctorRecord(userId: string, profile: any): Promise<void> {
    const doctorId = `DOC${Date.now().toString().slice(-6)}`;
    
    await supabaseAdmin
      .from('doctors')
      .insert({
        doctor_id: doctorId,
        profile_id: userId,
        // ✅ UPDATED: Use correct column names that exist in database
        specialty: 'General Medicine',  // Changed from 'specialization'
        license_number: 'PENDING',
        qualification: 'MD',
        department_id: 'DEPT001',
        gender: profile.gender || 'other',
        bio: null,
        experience_years: 0,
        consultation_fee: null,
        address: {},
        languages_spoken: ['Vietnamese'],
        availability_status: 'available',  // Changed from 'status'
        rating: 0.00,
        total_reviews: 0
      });
  }

  /**
   * Create patient record
   */
  private async createPatientRecord(userId: string, profile: any): Promise<void> {
    const patientId = `PAT${Date.now().toString().slice(-6)}`;

    await supabaseAdmin
      .from('patients')
      .insert({
        patient_id: patientId,
        profile_id: userId,
        // ✅ CLEAN DESIGN: NO full_name, date_of_birth - they are in profiles table
        gender: profile.gender || 'other',
        address: {},
        emergency_contact: {},
        insurance_info: {},
        medical_history: 'No medical history recorded', // ✅ ADD: patient-specific field
        status: 'active'
      });
  }

  /**
   * Create admin record
   */
  private async createAdminRecord(userId: string, profile: any): Promise<void> {
    const adminId = `ADM${Date.now().toString().slice(-6)}`;
    
    await supabaseAdmin
      .from('admin')
      .insert({
        admin_id: adminId,
        profile_id: userId,
        full_name: profile.full_name,
        role: 'admin',
        permissions: ['read', 'write'],
        status: 'active'
      });
  }
}
