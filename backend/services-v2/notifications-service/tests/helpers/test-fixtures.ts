/**
 * Test Fixtures - Sample data for testing
 * Vietnamese healthcare test data
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export const TestFixtures = {
  /**
   * Vietnamese patient data
   */
  patients: {
    patient1: {
      patientId: 'PAT-202501-000001',
      fullName: 'Nguyễn Văn Anh',
      email: 'nguyen.van.anh@example.com',
      phoneNumber: '+84912345678',
      dateOfBirth: '1990-05-15',
      gender: 'male',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM'
    },
    patient2: {
      patientId: 'PAT-202501-000002',
      fullName: 'Trần Thị Bình',
      email: 'tran.thi.binh@example.com',
      phoneNumber: '+84987654321',
      dateOfBirth: '1985-08-20',
      gender: 'female',
      address: '456 Đường Nguyễn Huệ, Quận 3, TP.HCM'
    }
  },

  /**
   * Vietnamese doctor data
   */
  doctors: {
    doctor1: {
      doctorId: 'DOC-202501-000001',
      fullName: 'BS. Lê Minh Tuấn',
      email: 'bs.le.minh.tuan@hospital.vn',
      phoneNumber: '+84901234567',
      specialization: 'Nội tim mạch',
      department: 'Khoa Tim mạch',
      licenseNumber: 'VN-12345'
    }
  },

  /**
   * Appointment data
   */
  appointments: {
    appointment1: {
      appointmentId: 'APT-202501-000001',
      patientId: 'PAT-202501-000001',
      doctorId: 'DOC-202501-000001',
      appointmentDate: '2025-01-15',
      appointmentTime: '09:00',
      roomNumber: 'P101',
      status: 'scheduled'
    }
  },

  /**
   * Template data
   */
  templateData: {
    appointmentConfirmation: {
      patientName: 'Nguyễn Văn Anh',
      appointmentDate: '15/01/2025',
      appointmentTime: '09:00',
      doctorName: 'BS. Lê Minh Tuấn',
      roomNumber: 'P101',
      hospitalName: 'Bệnh viện Đa khoa',
      hospitalAddress: '123 Đường ABC, Quận XYZ, TP.HCM',
      contactPhone: '1900-xxxx'
    },
    testResults: {
      patientName: 'Nguyễn Văn Anh',
      testType: 'Xét nghiệm máu',
      testCode: 'XN-12345',
      sampleDate: '10/01/2025',
      onlinePortalUrl: 'https://portal.hospital.vn',
      hospitalName: 'Bệnh viện Đa khoa',
      contactPhone: '1900-xxxx'
    },
    paymentReminder: {
      patientName: 'Nguyễn Văn Anh',
      invoiceNumber: 'INV-12345',
      amount: '500,000',
      dueDate: '20/01/2025',
      paymentUrl: 'https://payment.hospital.vn',
      hospitalName: 'Bệnh viện Đa khoa',
      contactPhone: '1900-xxxx'
    }
  },

  /**
   * Notification metadata
   */
  metadata: {
    standard: {
      source: 'test',
      correlationId: 'test-correlation-123',
      userId: 'user-123',
      healthcareContext: {
        patientId: 'PAT-202501-000001',
        doctorId: 'DOC-202501-000001',
        appointmentId: 'APT-202501-000001'
      }
    },
    emergency: {
      source: 'emergency-system',
      correlationId: 'emergency-456',
      userId: 'system',
      healthcareContext: {
        patientId: 'PAT-202501-000001',
        alertType: 'CRITICAL'
      }
    }
  }
};


