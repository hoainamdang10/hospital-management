"use strict";
/**
 * Test Patient Factory
 * Creates patient test data for integration tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestPatientFactory = void 0;
const uuid_1 = require("uuid");
/**
 * Test Patient Factory Class
 * Creates patient test data directly in database
 */
class TestPatientFactory {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.createdPatientIds = [];
    }
    /**
     * Create a test patient directly in database
     * Uses JSONB structure matching the actual schema
     */
    async createTestPatient(data) {
        const patientId = this.generatePatientId();
        const nationalId = data.nationalId || this.generateNationalId();
        const primaryPhone = data.primaryPhone || this.generatePhoneNumber();
        const email = data.email || this.generateEmail();
        // JSONB structure for personal_info
        const personalInfo = {
            fullName: data.fullName || 'Test Patient',
            dateOfBirth: data.dateOfBirth || '1990-01-01',
            gender: data.gender || 'male',
            nationalId: nationalId,
            nationality: 'Vietnamese'
        };
        // JSONB structure for contact_info
        const contactInfo = {
            primaryPhone: primaryPhone,
            email: email,
            address: {
                street: data.address?.street || '123 Đường Test',
                ward: data.address?.ward || 'Phường 1',
                district: data.address?.district || 'Quận 1',
                city: data.address?.city || 'Hồ Chí Minh',
                country: data.address?.country || 'Vietnam'
            }
        };
        // JSONB structure for basic_medical_info
        const basicMedicalInfo = {
            bloodType: 'O',
            allergies: [],
            chronicConditions: [],
            currentMedications: []
        };
        // Generate a valid UUID for test system user
        const testSystemUserId = (0, uuid_1.v4)();
        const patientData = {
            patient_id: patientId,
            user_id: data.userId,
            personal_info: personalInfo,
            contact_info: contactInfo,
            basic_medical_info: basicMedicalInfo,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: testSystemUserId,
            updated_by: testSystemUserId
        };
        try {
            const { data: insertedData, error } = await this.supabaseClient
                .schema('patient_schema')
                .from('patients') // Correct table name
                .insert(patientData)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create test patient: ${error.message}`);
            }
            // Track for cleanup
            this.createdPatientIds.push(patientId);
            console.log(`✅ Test patient created: ${patientId}`);
            return {
                patientId,
                userId: data.userId,
                fullName: personalInfo.fullName,
                dateOfBirth: personalInfo.dateOfBirth,
                gender: personalInfo.gender,
                nationalId,
                primaryPhone,
                email,
                address: contactInfo.address
            };
        }
        catch (error) {
            console.error(`❌ Error creating test patient:`, error);
            throw error;
        }
    }
    /**
     * Create emergency contact for patient
     */
    async createEmergencyContact(data) {
        const contactId = (0, uuid_1.v4)();
        const contactData = {
            id: contactId,
            patient_id: data.patientId,
            name: data.fullName || 'Nguyễn Thị Emergency', // Column is 'name' not 'full_name'
            relationship: data.relationship || 'Spouse',
            primary_phone: data.phoneNumber || this.generatePhoneNumber(), // Column is 'primary_phone'
            is_primary: data.isPrimary !== undefined ? data.isPrimary : true,
            is_active: true, // Required field
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        try {
            const { error } = await this.supabaseClient
                .schema('patient_schema')
                .from('emergency_contacts')
                .insert(contactData);
            if (error) {
                throw new Error(`Failed to create emergency contact: ${error.message}`);
            }
            console.log(`✅ Emergency contact created: ${contactId}`);
            return contactId;
        }
        catch (error) {
            console.error(`❌ Error creating emergency contact:`, error);
            throw error;
        }
    }
    /**
     * Update patient's basic medical info
     * Medical history is stored in JSONB field, not separate table
     */
    async updateMedicalInfo(data) {
        const medicalInfo = {
            bloodType: data.bloodType || 'O',
            allergies: data.allergies || [],
            chronicConditions: data.chronicConditions || [],
            currentMedications: data.currentMedications || []
        };
        try {
            const { error } = await this.supabaseClient
                .schema('patient_schema')
                .from('patients')
                .update({
                basic_medical_info: medicalInfo,
                updated_at: new Date().toISOString()
            })
                .eq('patient_id', data.patientId);
            if (error) {
                throw new Error(`Failed to update medical info: ${error.message}`);
            }
            console.log(`✅ Medical info updated for patient: ${data.patientId}`);
        }
        catch (error) {
            console.error(`❌ Error updating medical info:`, error);
            throw error;
        }
    }
    /**
     * Create insurance info for patient
     */
    async createInsuranceInfo(data) {
        const insuranceId = (0, uuid_1.v4)();
        const isVietnamese = data.insuranceType === 'BHYT' || data.insuranceType === 'BHTN';
        const insuranceData = {
            id: insuranceId,
            patient_id: data.patientId,
            provider: data.provider || 'BHXH Vietnam',
            policy_number: data.insuranceNumber || this.generateInsuranceNumber(), // Column is 'policy_number'
            valid_from: data.validFrom || new Date().toISOString().split('T')[0], // Date format
            valid_to: data.validTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            coverage_type: data.insuranceType || 'BHYT', // Required field
            is_vietnamese_insurance: isVietnamese, // Required field
            bhyt_number: isVietnamese ? (data.insuranceNumber || this.generateInsuranceNumber()) : null,
            is_primary: true, // Required field
            is_active: true, // Required field
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        try {
            const { error } = await this.supabaseClient
                .schema('patient_schema')
                .from('insurance_info')
                .insert(insuranceData);
            if (error) {
                throw new Error(`Failed to create insurance info: ${error.message}`);
            }
            console.log(`✅ Insurance info created: ${insuranceId}`);
            return insuranceId;
        }
        catch (error) {
            console.error(`❌ Error creating insurance info:`, error);
            throw error;
        }
    }
    /**
     * Cleanup all created patients
     */
    async cleanup() {
        console.log('🧹 Cleaning up test patients...');
        for (const patientId of this.createdPatientIds) {
            try {
                // Delete patient (cascading will handle related records)
                await this.supabaseClient
                    .schema('patient_schema')
                    .from('patients') // Correct table name
                    .delete()
                    .eq('patient_id', patientId);
                console.log(`✅ Deleted test patient: ${patientId}`);
            }
            catch (error) {
                console.warn(`⚠️  Error deleting test patient ${patientId}:`, error);
            }
        }
        this.createdPatientIds = [];
        console.log('✅ Test patients cleaned up');
    }
    /**
     * Generate random patient ID
     */
    generatePatientId() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PAT-${year}${month}-${random}`;
    }
    /**
     * Generate random Vietnamese national ID (CCCD)
     */
    generateNationalId() {
        return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    }
    /**
     * Generate random Vietnamese phone number
     */
    generatePhoneNumber() {
        const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return `${prefix}${suffix}`;
    }
    /**
     * Generate random email
     */
    generateEmail() {
        const randomString = Math.random().toString(36).substring(2, 10);
        return `patient-${randomString}@hospital.test`;
    }
    /**
     * Generate random insurance number
     */
    generateInsuranceNumber() {
        return `BHYT-${Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')}`;
    }
}
exports.TestPatientFactory = TestPatientFactory;
//# sourceMappingURL=test-patient-factory.js.map