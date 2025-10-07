/**
 * Test User Fixtures
 * 
 * Defines test users for integration tests with complete metadata.
 * These users will be created in Supabase via Admin API.
 */

export interface TestUserFixture {
  email: string;
  password: string;
  user_metadata: {
    full_name: string;
    role: string;
    phone_number?: string;
    citizen_id?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
  };
}

export const TEST_USERS: Record<string, TestUserFixture> = {
  ADMIN: {
    email: 'test.admin@hospital.com',
    password: 'TestAdmin123!',
    user_metadata: {
      full_name: 'Test Admin User',
      role: 'admin',
      phone_number: '0901234567',
      citizen_id: '001234567890',
      date_of_birth: '1980-01-01',
      gender: 'male',
      address: '123 Test Street, District 1, Ho Chi Minh City'
    }
  },

  DOCTOR: {
    email: 'test.doctor@hospital.com',
    password: 'TestDoctor123!',
    user_metadata: {
      full_name: 'Dr. Nguyen Van A',
      role: 'doctor',
      phone_number: '0901234568',
      citizen_id: '001234567891',
      date_of_birth: '1985-05-15',
      gender: 'female',
      address: '456 Test Avenue, District 3, Ho Chi Minh City'
    }
  },

  NURSE: {
    email: 'test.nurse@hospital.com',
    password: 'TestNurse123!',
    user_metadata: {
      full_name: 'Nurse Tran Thi B',
      role: 'nurse',
      phone_number: '0901234570',
      citizen_id: '001234567893',
      date_of_birth: '1992-08-20',
      gender: 'female',
      address: '321 Test Lane, District 7, Ho Chi Minh City'
    }
  },

  RECEPTIONIST: {
    email: 'test.receptionist@hospital.com',
    password: 'TestReceptionist123!',
    user_metadata: {
      full_name: 'Receptionist Le Van C',
      role: 'receptionist',
      phone_number: '0901234571',
      citizen_id: '001234567894',
      date_of_birth: '1995-03-10',
      gender: 'male',
      address: '654 Test Boulevard, District 2, Ho Chi Minh City'
    }
  },

  PATIENT: {
    email: 'test.patient@hospital.com',
    password: 'TestPatient123!',
    user_metadata: {
      full_name: 'Patient Pham Thi D',
      role: 'patient',
      phone_number: '0901234569',
      citizen_id: '001234567892',
      date_of_birth: '1990-12-25',
      gender: 'other',
      address: '789 Test Road, District 5, Ho Chi Minh City'
    }
  },

  PATIENT_2: {
    email: 'test.patient2@hospital.com',
    password: 'TestPatient2123!',
    user_metadata: {
      full_name: 'Patient Hoang Van E',
      role: 'patient',
      phone_number: '0901234572',
      citizen_id: '001234567895',
      date_of_birth: '1988-07-14',
      gender: 'male',
      address: '987 Test Street, District 10, Ho Chi Minh City'
    }
  },

  // User for MFA tests
  MFA_USER: {
    email: 'test.mfa@hospital.com',
    password: 'TestMFA123!',
    user_metadata: {
      full_name: 'MFA Test User',
      role: 'doctor',
      phone_number: '0901234573',
      citizen_id: '001234567896',
      date_of_birth: '1987-11-30',
      gender: 'male',
      address: '111 MFA Street, District 1, Ho Chi Minh City'
    }
  },

  // Inactive user for testing
  INACTIVE_USER: {
    email: 'test.inactive@hospital.com',
    password: 'TestInactive123!',
    user_metadata: {
      full_name: 'Inactive Test User',
      role: 'patient',
      phone_number: '0901234574',
      citizen_id: '001234567897',
      date_of_birth: '1993-04-18',
      gender: 'female',
      address: '222 Inactive Road, District 6, Ho Chi Minh City'
    }
  }
};

// Export individual users for convenience
export const ADMIN_USER = TEST_USERS.ADMIN;
export const DOCTOR_USER = TEST_USERS.DOCTOR;
export const NURSE_USER = TEST_USERS.NURSE;
export const RECEPTIONIST_USER = TEST_USERS.RECEPTIONIST;
export const PATIENT_USER = TEST_USERS.PATIENT;
export const PATIENT_2_USER = TEST_USERS.PATIENT_2;
export const MFA_USER = TEST_USERS.MFA_USER;
export const INACTIVE_USER = TEST_USERS.INACTIVE_USER;

// Get all users as array
export const ALL_TEST_USERS = Object.values(TEST_USERS);

// Get users by role
export const getUsersByRole = (role: string): TestUserFixture[] => {
  return ALL_TEST_USERS.filter(user => user.user_metadata.role === role);
};

// Get user by email
export const getUserByEmail = (email: string): TestUserFixture | undefined => {
  return ALL_TEST_USERS.find(user => user.email === email);
};

