"use strict";
/**
 * Test Helpers and Utilities
 *
 * Shared helper functions for integration tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueMockIdentityToken = issueMockIdentityToken;
exports.generateRandomPhone = generateRandomPhone;
exports.generateRandomNationalId = generateRandomNationalId;
exports.generateRandomEmail = generateRandomEmail;
exports.generateRandomPatientId = generateRandomPatientId;
exports.createValidPatientData = createValidPatientData;
exports.waitFor = waitFor;
exports.sleep = sleep;
exports.retry = retry;
exports.cleanupTestPatients = cleanupTestPatients;
exports.cleanupTestUsers = cleanupTestUsers;
exports.getOrCreateTestUser = getOrCreateTestUser;
exports.verifyPatientExists = verifyPatientExists;
exports.getPatientFromDb = getPatientFromDb;
exports.createTestPatientInDb = createTestPatientInDb;
const crypto_1 = require("crypto");
const identityMockServer_1 = require("./identityMockServer");
function deriveRoleFromEmail(email) {
    const lowered = email.toLowerCase();
    if (lowered.includes('admin')) {
        return 'ADMIN';
    }
    if (lowered.includes('receptionist')) {
        return 'RECEPTIONIST';
    }
    if (lowered.includes('doctor')) {
        return 'DOCTOR';
    }
    if (lowered.includes('nurse')) {
        return 'NURSE';
    }
    return 'PATIENT';
}
function getDefaultPermissionsForRole(role) {
    switch (role) {
        case 'ADMIN':
            return ['patients:read', 'patients:write'];
        case 'RECEPTIONIST':
            return ['patients:read', 'patients:create'];
        case 'DOCTOR':
            return ['patients:read'];
        case 'NURSE':
            return ['patients:read'];
        default:
            return ['patients:read'];
    }
}
function issueMockIdentityToken(userId, email, roles) {
    const role = roles && roles.length > 0 ? roles[0] : deriveRoleFromEmail(email);
    const permissions = getDefaultPermissionsForRole(role);
    const token = `mock-token-${userId}-${Date.now()}`;
    (0, identityMockServer_1.registerIdentityToken)(token, {
        userId,
        email,
        roles: roles || [role],
        permissions
    });
    return token;
}
/**
 * Generate random Vietnamese phone number
 */
function generateRandomPhone() {
    const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${suffix}`;
}
/**
 * Generate random Vietnamese national ID (CCCD)
 */
function generateRandomNationalId() {
    // Vietnamese CCCD format: 12 digits
    return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
}
/**
 * Generate random email
 */
function generateRandomEmail() {
    const randomString = Math.random().toString(36).substring(2, 10);
    return `test-${randomString}@hospital.test`;
}
/**
 * Generate random patient ID
 */
function generateRandomPatientId() {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PAT-${year}${month}-${random}`;
}
/**
 * Create valid patient data for testing (API format - flat structure)
 */
function createValidPatientData(overrides = {}) {
    return {
        userId: overrides.userId || `user-${Math.random().toString(36).substring(7)}`,
        // Personal Info (flat structure for API)
        fullName: overrides.fullName || 'Test Patient',
        dateOfBirth: overrides.dateOfBirth || '1990-01-01',
        gender: overrides.gender || 'male',
        nationalId: overrides.nationalId || generateRandomNationalId(),
        nationality: overrides.nationality || 'Vietnamese',
        // Contact Info (flat structure for API)
        primaryPhone: overrides.primaryPhone || generateRandomPhone(),
        email: overrides.email || generateRandomEmail(),
        preferredContactMethod: overrides.preferredContactMethod || 'phone',
        address: {
            street: overrides.address?.street ?? overrides.street ?? '123 Đường Test',
            ward: overrides.address?.ward ?? overrides.ward ?? 'Phường 1',
            district: overrides.address?.district ?? overrides.district ?? 'Quận 1',
            city: overrides.address?.city ?? overrides.city ?? 'Hồ Chí Minh',
            province: overrides.address?.province ?? overrides.province ?? 'Hồ Chí Minh',
            country: overrides.address?.country ?? overrides.country ?? 'Vietnam'
        },
        // Emergency Contacts (using 'name' field as per DTO spec)
        emergencyContacts: overrides.emergencyContacts || [{
                name: 'Nguyễn Thị Emergency',
                relationship: 'Spouse',
                primaryPhone: generateRandomPhone(),
                email: 'emergency@example.com',
                address: '456 Emergency Street',
                isPrimary: true
            }],
        ...overrides
    };
}
/**
 * Wait for a condition to be true
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(interval);
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}
/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(delayMs * Math.pow(2, i));
            }
        }
    }
    throw lastError || new Error('Retry failed');
}
/**
 * Clean up test patients from database
 */
async function cleanupTestPatients(supabaseClient, pattern = 'TEST%') {
    if (!supabaseClient) {
        return;
    }
    try {
        const { error } = await supabaseClient
            .schema('patient_schema')
            .from('patient_profiles')
            .delete()
            .like('national_id', pattern);
        if (error) {
            console.warn(`  Could not cleanup test patients: ${error.message}`);
        }
        else {
            console.log(' Test patients cleaned up');
        }
    }
    catch (error) {
        console.warn(`  Error cleaning up test patients: ${error}`);
    }
}
/**
 * Clean up test users from auth
 * NOTE: Only cleanup user_profiles and user_roles, NOT auth.users
 * This prevents orphaned profiles when auth.users is deleted
 */
async function cleanupTestUsers(supabaseClient, emails) {
    if (!supabaseClient) {
        return;
    }
    for (const email of emails) {
        try {
            // Delete from auth_schema tables only
            // auth.users will be cleaned up by Supabase Auth automatically
            const { error: loginError } = await supabaseClient
                .from('login_attempts')
                .delete()
                .eq('email', email);
            if (loginError) {
                console.warn(`  Could not delete login attempts for ${email}: ${loginError.message}`);
            }
            // Get user profile to find user_id
            const { data: profile } = await supabaseClient
                .from('user_profiles')
                .select('id')
                .eq('email', email)
                .single();
            if (profile) {
                // Delete user roles
                const { error: rolesError } = await supabaseClient
                    .from('user_roles')
                    .delete()
                    .eq('user_id', profile.id);
                if (rolesError) {
                    console.warn(`  Could not delete user roles for ${email}: ${rolesError.message}`);
                }
                // Delete user profile
                const { error: profileError } = await supabaseClient
                    .from('user_profiles')
                    .delete()
                    .eq('id', profile.id);
                if (profileError) {
                    console.warn(`  Could not delete user profile for ${email}: ${profileError.message}`);
                }
                else {
                    console.log(` Deleted test user profile: ${email}`);
                }
            }
            // Finally, delete from auth.users using Admin API
            const { data: users } = await supabaseClient.auth.admin.listUsers();
            const user = users?.users.find(u => u.email === email);
            if (user) {
                const { error } = await supabaseClient.auth.admin.deleteUser(user.id);
                if (error) {
                    console.warn(`  Could not delete auth user ${email}: ${error.message}`);
                }
                else {
                    console.log(` Deleted auth user: ${email}`);
                }
            }
        }
        catch (error) {
            console.warn(`  Error deleting test user ${email}: ${error}`);
        }
    }
}
/**
 * Get or create test user via Identity Service
 * Creates verified users directly in database to bypass email verification
 */
async function getOrCreateTestUser(supabaseClient, email, password) {
    const axios = require('axios');
    const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';
    const useMockIdentity = process.env.IDENTITY_USE_MOCK === 'true';
    if (!supabaseClient) {
        const normalizedEmail = email.trim().toLowerCase();
        const userId = (0, crypto_1.randomUUID)();
        const token = issueMockIdentityToken(userId, normalizedEmail);
        return {
            userId,
            token
        };
    }
    try {
        // Try to login first when using real Identity Service
        if (!useMockIdentity) {
            try {
                const loginResponse = await axios.post(`${identityServiceUrl}/auth/login`, {
                    email,
                    password
                });
                if (loginResponse.data.success && loginResponse.data.data?.accessToken) {
                    return {
                        userId: loginResponse.data.data.user.id,
                        token: loginResponse.data.data.accessToken
                    };
                }
            }
            catch (loginError) {
                // Login failed, user might not exist yet
                console.log(`Login failed for ${email}, will try to create user`);
            }
        }
        // Create user in auth.users (Supabase Auth)
        console.log(` Creating auth user for ${email}...`);
        let authUserId = null;
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: `Test User ${email}`,
                role_type: 'patient'
            }
        });
        if (authError) {
            if (authError.message?.includes('already been registered')) {
                console.log(`ℹ  Auth user already exists for ${email}, reusing existing account`);
                const { data: existingProfile, error: existingProfileError } = await supabaseClient
                    .schema('auth_schema')
                    .from('user_profiles')
                    .select('id')
                    .eq('email', email)
                    .single();
                if (existingProfileError || !existingProfile) {
                    throw new Error(`Failed to lookup existing auth user: ${existingProfileError?.message ?? 'unknown error'}`);
                }
                const existingUserId = existingProfile.id;
                authUserId = existingUserId;
                const { error: updateError } = await supabaseClient.auth.admin.updateUserById(existingUserId, {
                    password,
                    email_confirm: true
                });
                if (updateError) {
                    console.warn(`  Unable to synchronize existing auth user password: ${updateError.message}`);
                }
                else {
                    console.log(` Synchronized existing auth user credentials for ${email}`);
                }
            }
            else {
                console.error(` Failed to create auth user: ${authError.message}`);
                throw new Error(`Failed to create auth user: ${authError.message}`);
            }
        }
        if (!authUserId) {
            if (!authUser?.user) {
                throw new Error('Auth user creation returned no user information');
            }
            authUserId = authUser.user.id;
            console.log(` Auth user created: ${authUserId}`);
        }
        // Verify user exists in auth.users
        const resolvedAuthUserId = authUserId;
        if (!resolvedAuthUserId) {
            throw new Error('Auth user id could not be resolved');
        }
        const { data: verifyProfile, error: verifyProfileError } = await supabaseClient
            .schema('auth_schema')
            .from('user_profiles')
            .select('email')
            .eq('id', resolvedAuthUserId)
            .single();
        if (verifyProfileError || !verifyProfile) {
            console.error(` User not found in auth_schema.user_profiles after creation: ${verifyProfileError?.message}`);
        }
        else {
            console.log(` Verified user exists in auth_schema.user_profiles: ${verifyProfile.email}`);
        }
        // Update user profile to verified using RPC function
        const { error: updateError } = await supabaseClient.rpc('create_verified_test_user', {
            p_user_id: resolvedAuthUserId,
            p_email: email,
            p_full_name: `Test User ${email}`
        });
        if (updateError) {
            console.warn(`Failed to create verified test user: ${updateError.message}`);
        }
        else {
            console.log(` Created verified test user for ${email}`);
        }
        if (useMockIdentity) {
            const mockToken = issueMockIdentityToken(resolvedAuthUserId, email);
            console.log(` Issued mock identity token for ${email}`);
            return {
                userId: resolvedAuthUserId,
                token: mockToken
            };
        }
        // Login via Identity Service to get valid token
        console.log(` Attempting login for ${email}...`);
        try {
            const loginResponse = await axios.post(`${identityServiceUrl}/auth/login`, {
                email,
                password
            });
            console.log(' Login response:', JSON.stringify(loginResponse.data, null, 2));
            if (!loginResponse.data.success || !loginResponse.data.data?.accessToken) {
                console.error(' Login failed:', loginResponse.data);
                throw new Error(`Failed to login after creating user: ${loginResponse.data.error || loginResponse.data.message || 'Unknown error'}`);
            }
            console.log(` Login successful for ${email}`);
            return {
                userId: loginResponse.data.data.user.id,
                token: loginResponse.data.data.accessToken
            };
        }
        catch (loginError) {
            if (axios.isAxiosError(loginError)) {
                const axiosError = loginError;
                console.error(' Login axios error:', {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message
                });
            }
            else {
                console.error(' Login error:', loginError);
            }
            const fallbackToken = issueMockIdentityToken(resolvedAuthUserId, email);
            console.log(` Using mock identity token for ${email} due to login failure`);
            return {
                userId: resolvedAuthUserId,
                token: fallbackToken
            };
        }
    }
    catch (error) {
        throw new Error(`Failed to get or create test user: ${error}`);
    }
}
/**
 * Verify patient exists in database
 */
async function verifyPatientExists(supabaseClient, patientId) {
    if (!supabaseClient) {
        return false;
    }
    try {
        const { data, error } = await supabaseClient
            .schema('patient_schema')
            .from('patient_profiles')
            .select('patient_id')
            .eq('patient_id', patientId)
            .single();
        return !error && !!data;
    }
    catch (error) {
        return false;
    }
}
/**
 * Get patient from database
 */
async function getPatientFromDb(supabaseClient, patientId) {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
    }
    const { data, error } = await supabaseClient
        .schema('patient_schema')
        .from('patient_profiles')
        .select('*')
        .eq('patient_id', patientId)
        .single();
    if (error) {
        throw new Error(`Failed to get patient: ${error.message}`);
    }
    return data;
}
/**
 * Create test patient directly in database
 */
async function createTestPatientInDb(supabaseClient, patientData) {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
    }
    // Use JSONB structure matching actual schema
    const personalInfo = {
        fullName: patientData.personalInfo.fullName,
        dateOfBirth: patientData.personalInfo.dateOfBirth,
        gender: patientData.personalInfo.gender,
        nationalId: patientData.personalInfo.nationalId,
        nationality: 'Vietnamese'
    };
    const contactInfo = {
        primaryPhone: patientData.contactInfo.primaryPhone,
        email: patientData.contactInfo.email,
        address: {
            street: patientData.contactInfo.address.street,
            ward: patientData.contactInfo.address.ward,
            district: patientData.contactInfo.address.district,
            city: patientData.contactInfo.address.city,
            country: 'Vietnam'
        }
    };
    const basicMedicalInfo = {
        bloodType: 'O',
        allergies: [],
        chronicConditions: [],
        currentMedications: []
    };
    const { data, error } = await supabaseClient
        .schema('patient_schema')
        .from('patients')
        .insert({
        patient_id: patientData.patientId || generateRandomPatientId(),
        user_id: patientData.userId,
        personal_info: personalInfo,
        contact_info: contactInfo,
        basic_medical_info: basicMedicalInfo,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: patientData.userId,
        updated_by: patientData.userId
    })
        .select('patient_id')
        .single();
    if (error) {
        throw new Error(`Failed to create test patient: ${error.message}`);
    }
    return data.patient_id;
}
//# sourceMappingURL=testHelpers.js.map