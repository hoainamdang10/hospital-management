/**
 * Patient Registration Integration Tests
 * Tests patient registration flow with real database
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { TestDatabase } from '../helpers/test-database';
import { TestUserFactory, generateTestEmail, generateTestPassword } from '../helpers/test-user-factory';
import { TestPatientFactory } from '../helpers/test-patient-factory';

describe('Patient Registration Integration Tests', () => {
  let testDb: TestDatabase;
  let userFactory: TestUserFactory;
  let patientFactory: TestPatientFactory;

  beforeAll(async () => {
    // Setup test database
    testDb = new TestDatabase();
    await testDb.setup();

    const supabaseClient = testDb.getClient();
    userFactory = new TestUserFactory(supabaseClient);
    patientFactory = new TestPatientFactory(supabaseClient);
  });

  afterAll(async () => {
    // Cleanup all test data
    await patientFactory.cleanup();
    await userFactory.cleanup();
    await testDb.cleanup();
    await testDb.close();
  });

  afterEach(async () => {
    // Cleanup after each test
    await patientFactory.cleanup();
  });

  describe('Create Patient with Verified User', () => {
    it('should create patient with verified user successfully', async () => {
      // Arrange: Create verified user
      const email = generateTestEmail();
      const password = generateTestPassword();
      const testUser = await userFactory.createVerifiedPatient({
        email,
        password,
        fullName: 'Nguyễn Văn Test'
      });

      expect(testUser.userId).toBeDefined();
      expect(testUser.isEmailVerified).toBe(true);

      // Act: Create patient
      const patient = await patientFactory.createTestPatient({
        userId: testUser.userId,
        fullName: 'Nguyễn Văn Test',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        primaryPhone: '0912345678',
        email: email
      });

      // Assert
      expect(patient.patientId).toBeDefined();
      expect(patient.userId).toBe(testUser.userId);
      expect(patient.fullName).toBe('Nguyễn Văn Test');

      // Verify patient exists in database
      const exists = await testDb.verifyPatientExists(patient.patientId);
      expect(exists).toBe(true);

      // Verify patient data
      const dbPatient = await testDb.getPatient(patient.patientId);
      expect(dbPatient.user_id).toBe(testUser.userId);
      expect(dbPatient.personal_info.fullName).toBe('Nguyễn Văn Test'); // JSONB field
      expect(dbPatient.status).toBe('active');
    });

    it('should create patient with complete profile data', async () => {
      // Arrange
      const email = generateTestEmail();
      const password = generateTestPassword();
      const testUser = await userFactory.createVerifiedPatient({
        email,
        password,
        fullName: 'Trần Thị Test'
      });

      // Act
      const patient = await patientFactory.createTestPatient({
        userId: testUser.userId,
        fullName: 'Trần Thị Test',
        dateOfBirth: '1995-05-15',
        gender: 'female',
        nationalId: '001234567890',
        primaryPhone: '0987654321',
        email: email,
        address: {
          street: '456 Đường ABC',
          ward: 'Phường 2',
          district: 'Quận 3',
          city: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      // Assert
      expect(patient.patientId).toBeDefined();
      expect(patient.gender).toBe('female');
      expect(patient.nationalId).toBe('001234567890');
      expect(patient.address.street).toBe('456 Đường ABC');
      expect(patient.address.district).toBe('Quận 3');

      // Verify in database
      const dbPatient = await testDb.getPatient(patient.patientId);
      expect(dbPatient.personal_info.gender).toBe('female'); // JSONB field
      expect(dbPatient.personal_info.nationalId).toBe('001234567890'); // JSONB field
      expect(dbPatient.contact_info.address.street).toBe('456 Đường ABC'); // JSONB field
    });
  });

  describe('Patient with Emergency Contacts', () => {
    it('should create patient with emergency contact', async () => {
      // Arrange
      const email = generateTestEmail();
      const password = generateTestPassword();
      const testUser = await userFactory.createVerifiedPatient({
        email,
        password,
        fullName: 'Lê Văn Test'
      });

      const patient = await patientFactory.createTestPatient({
        userId: testUser.userId,
        fullName: 'Lê Văn Test'
      });

      // Act: Create emergency contact
      const contactId = await patientFactory.createEmergencyContact({
        patientId: patient.patientId,
        fullName: 'Lê Thị Emergency',
        relationship: 'Spouse',
        phoneNumber: '0911111111',
        isPrimary: true
      });

      // Assert
      expect(contactId).toBeDefined();

      // Verify in database
      const { data: contact } = await testDb.getClient()
        .schema('patient_schema')
        .from('emergency_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      expect(contact).toBeDefined();
      expect(contact.patient_id).toBe(patient.patientId);
      expect(contact.name).toBe('Lê Thị Emergency'); // Column is 'name' not 'full_name'
      expect(contact.relationship).toBe('Spouse');
      expect(contact.is_primary).toBe(true);
    });

    it('should create patient with multiple emergency contacts', async () => {
      // Arrange
      const email = generateTestEmail();
      const password = generateTestPassword();
      const testUser = await userFactory.createVerifiedPatient({
        email,
        password,
        fullName: 'Phạm Văn Test'
      });

      const patient = await patientFactory.createTestPatient({
        userId: testUser.userId,
        fullName: 'Phạm Văn Test'
      });

      // Act: Create multiple contacts
      const contact1Id = await patientFactory.createEmergencyContact({
        patientId: patient.patientId,
        fullName: 'Contact 1',
        relationship: 'Spouse',
        isPrimary: true
      });

      const contact2Id = await patientFactory.createEmergencyContact({
        patientId: patient.patientId,
        fullName: 'Contact 2',
        relationship: 'Parent',
        isPrimary: false
      });

      // Assert
      expect(contact1Id).toBeDefined();
      expect(contact2Id).toBeDefined();

      // Verify in database
      const { data: contacts } = await testDb.getClient()
        .schema('patient_schema')
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patient.patientId);

      expect(contacts).toHaveLength(2);
      expect(contacts?.find(c => c.id === contact1Id)?.is_primary).toBe(true);
      expect(contacts?.find(c => c.id === contact2Id)?.is_primary).toBe(false);
    });
  });

  describe('Patient with Medical Info', () => {
    it('should update patient medical info', async () => {
      // Arrange
      const email = generateTestEmail();
      const password = generateTestPassword();
      const testUser = await userFactory.createVerifiedPatient({
        email,
        password,
        fullName: 'Hoàng Văn Test'
      });

      const patient = await patientFactory.createTestPatient({
        userId: testUser.userId,
        fullName: 'Hoàng Văn Test'
      });

      // Act: Update medical info
      await patientFactory.updateMedicalInfo({
        patientId: patient.patientId,
        bloodType: 'A+',
        allergies: ['Penicillin', 'Peanuts'],
        chronicConditions: ['Hypertension'],
        currentMedications: ['Lisinopril 10mg']
      });

      // Assert: Verify in database
      const updatedPatient = await testDb.getPatient(patient.patientId);

      expect(updatedPatient).toBeDefined();
      expect(updatedPatient.basic_medical_info.bloodType).toBe('A+');
      expect(updatedPatient.basic_medical_info.allergies).toContain('Penicillin');
      expect(updatedPatient.basic_medical_info.chronicConditions).toContain('Hypertension');
      expect(updatedPatient.basic_medical_info.currentMedications).toContain('Lisinopril 10mg');
    });
  });

  describe('Patient with Insurance Info', () => {
    it('should create patient with BHYT insurance', async () => {
      // Arrange
      const email = generateTestEmail();
      const password = generateTestPassword();
      const testUser = await userFactory.createVerifiedPatient({
        email,
        password,
        fullName: 'Vũ Văn Test'
      });

      const patient = await patientFactory.createTestPatient({
        userId: testUser.userId,
        fullName: 'Vũ Văn Test'
      });

      // Act: Create insurance info
      const insuranceId = await patientFactory.createInsuranceInfo({
        patientId: patient.patientId,
        insuranceType: 'BHYT',
        insuranceNumber: 'BHYT-123456789012',
        provider: 'BHXH Vietnam'
      });

      // Assert
      expect(insuranceId).toBeDefined();

      // Verify in database
      const { data: insurance } = await testDb.getClient()
        .schema('patient_schema')
        .from('insurance_info')
        .select('*')
        .eq('id', insuranceId)
        .single();

      expect(insurance).toBeDefined();
      expect(insurance.patient_id).toBe(patient.patientId);
      expect(insurance.coverage_type).toBe('BHYT'); // Column is 'coverage_type'
      expect(insurance.policy_number).toBe('BHYT-123456789012'); // Column is 'policy_number'
      expect(insurance.is_vietnamese_insurance).toBe(true);
    });
  });
});

