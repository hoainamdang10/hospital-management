"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const supabase_1 = require("../config/supabase");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class UserService {
    async getUserProfile(userId) {
        try {
            const { data: profile, error } = await supabase_1.supabaseAdmin
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
                logger_1.default.error('Get user profile error:', error);
                return { error: 'User not found' };
            }
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
                role_data: this.getRoleSpecificData(profile)
            };
            return { user };
        }
        catch (error) {
            logger_1.default.error('Get user profile service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async updateUserProfile(userId, updateData) {
        try {
            const { data: profile, error } = await supabase_1.supabaseAdmin
                .from('profiles')
                .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .select()
                .single();
            if (error) {
                logger_1.default.error('Update user profile error:', error);
                return { error: 'Failed to update profile' };
            }
            if (profile.role === 'doctor' && (updateData.phone_number || updateData.email || updateData.full_name)) {
                const doctorUpdateData = {};
                if (updateData.phone_number)
                    doctorUpdateData.phone_number = updateData.phone_number;
                if (updateData.email)
                    doctorUpdateData.email = updateData.email;
                if (updateData.full_name)
                    doctorUpdateData.full_name = updateData.full_name;
                if (Object.keys(doctorUpdateData).length > 0) {
                    doctorUpdateData.updated_at = new Date().toISOString();
                    const { error: doctorError } = await supabase_1.supabaseAdmin
                        .from('doctors')
                        .update(doctorUpdateData)
                        .eq('profile_id', userId);
                    if (doctorError) {
                        logger_1.default.warn('Failed to update doctor record during profile update', {
                            error: doctorError,
                            userId,
                            updatedFields: Object.keys(doctorUpdateData)
                        });
                    }
                    else {
                        logger_1.default.info('Successfully synced profile update to doctor record', {
                            userId,
                            updatedFields: Object.keys(doctorUpdateData)
                        });
                    }
                }
            }
            return { user: profile };
        }
        catch (error) {
            logger_1.default.error('Update user profile service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async getAllUsers(options) {
        try {
            const { page, limit, role, search } = options;
            const offset = (page - 1) * limit;
            let query = supabase_1.supabaseAdmin
                .from('profiles')
                .select(`
          *,
          doctors(doctor_id, specialization, license_number),
          patients(patient_id, medical_history, status),
          admin(admin_id, permissions)
        `, { count: 'exact' });
            if (role) {
                query = query.eq('role', role);
            }
            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
            }
            query = query
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });
            const { data: profiles, error, count } = await query;
            if (error) {
                logger_1.default.error('Get all users error:', error);
                return { error: 'Failed to retrieve users' };
            }
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
        }
        catch (error) {
            logger_1.default.error('Get all users service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async updateUserStatus(userId, isActive) {
        try {
            const { data: profile, error } = await supabase_1.supabaseAdmin
                .from('profiles')
                .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .select()
                .single();
            if (error) {
                logger_1.default.error('Update user status error:', error);
                return { error: 'Failed to update user status' };
            }
            if (!isActive) {
                try {
                    await supabase_1.supabaseAdmin.auth.admin.signOut(userId, 'global');
                }
                catch (signOutError) {
                    logger_1.default.warn('Failed to sign out user sessions:', signOutError);
                }
            }
            return { user: profile };
        }
        catch (error) {
            logger_1.default.error('Update user status service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async updateUserRole(userId, newRole) {
        try {
            const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .update({
                role: newRole,
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .select()
                .single();
            if (profileError) {
                logger_1.default.error('Update user role error:', profileError);
                return { error: 'Failed to update user role' };
            }
            await this.handleRoleChange(userId, newRole, profile);
            return { user: profile };
        }
        catch (error) {
            logger_1.default.error('Update user role service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async deleteUser(userId) {
        try {
            const { error: authError } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(userId);
            if (authError) {
                logger_1.default.error('Delete user auth error:', authError);
                return { error: 'Failed to delete user account' };
            }
            await this.cleanupRoleSpecificRecords(userId);
            return { user: null };
        }
        catch (error) {
            logger_1.default.error('Delete user service error:', error);
            return { error: 'Internal server error' };
        }
    }
    getRoleSpecificData(profile) {
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
    async handleRoleChange(userId, newRole, profile) {
        try {
            await this.cleanupRoleSpecificRecords(userId);
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
        }
        catch (error) {
            logger_1.default.error('Handle role change error:', error);
        }
    }
    async cleanupRoleSpecificRecords(userId) {
        try {
            await Promise.all([
                supabase_1.supabaseAdmin.from('doctors').delete().eq('profile_id', userId),
                supabase_1.supabaseAdmin.from('patients').delete().eq('profile_id', userId),
                supabase_1.supabaseAdmin.from('admin').delete().eq('profile_id', userId)
            ]);
        }
        catch (error) {
            logger_1.default.error('Cleanup role-specific records error:', error);
        }
    }
    async createDoctorRecord(userId, profile) {
        const doctorId = `DOC${Date.now().toString().slice(-6)}`;
        await supabase_1.supabaseAdmin
            .from('doctors')
            .insert({
            doctor_id: doctorId,
            profile_id: userId,
            specialty: 'General Medicine',
            license_number: 'PENDING',
            qualification: 'MD',
            department_id: 'DEPT001',
            gender: profile.gender || 'other',
            bio: null,
            experience_years: 0,
            consultation_fee: null,
            address: {},
            languages_spoken: ['Vietnamese'],
            availability_status: 'available',
            rating: 0.00,
            total_reviews: 0
        });
    }
    async createPatientRecord(userId, profile) {
        const patientId = `PAT${Date.now().toString().slice(-6)}`;
        await supabase_1.supabaseAdmin
            .from('patients')
            .insert({
            patient_id: patientId,
            profile_id: userId,
            gender: profile.gender || 'other',
            address: {},
            emergency_contact: {},
            insurance_info: {},
            medical_history: 'No medical history recorded',
            status: 'active'
        });
    }
    async createAdminRecord(userId, profile) {
        const adminId = `ADM${Date.now().toString().slice(-6)}`;
        await supabase_1.supabaseAdmin
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
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map