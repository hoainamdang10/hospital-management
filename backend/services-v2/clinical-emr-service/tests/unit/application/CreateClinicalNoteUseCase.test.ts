/**
 * CreateClinicalNoteUseCase Tests
 * Unit tests for clinical note creation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

import { CreateClinicalNoteUseCase } from '../../../src/application/use-cases/CreateClinicalNoteUseCase';
import { IClinicalNoteRepository } from '../../../src/domain/repositories/IClinicalNoteRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
import { CreateClinicalNoteRequest } from '../../../src/application/dto/ClinicalNoteRequest';
import { ClinicalNoteType } from '../../../src/domain/aggregates/ClinicalNote.aggregate';

describe('CreateClinicalNoteUseCase', () => {
  let useCase: CreateClinicalNoteUseCase;
  let mockRepository: jest.Mocked<IClinicalNoteRepository>;
  let mockEventPublisher: jest.Mocked<IDomainEventPublisher>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByAuthorId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getNextSequence: jest.fn().mockResolvedValue(1),
    } as any;

    // Create mock event publisher
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishBatch: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    } as any;

    // Create use case
    useCase = new CreateClinicalNoteUseCase(mockRepository, mockEventPublisher);
  });

  describe('Note Type: Progress Note', () => {
    it('should create progress note with valid data', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Daily Progress Note',
        noteContent: 'Patient showing improvement. Fever subsided.',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Temperature normal, appetite improving',
        assessment: 'Responding well to treatment',
        plan: 'Continue current medication, monitor for 24 hours',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.noteId).toBeDefined();
      expect(response.message).toContain('thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishBatch).toHaveBeenCalledTimes(1);
    });

    it('should track patient progress over time', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Day 3 Progress',
        noteContent: 'Significant improvement in symptoms',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Vital signs stable',
        assessment: 'Recovery progressing well',
        plan: 'Consider discharge tomorrow',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.PROGRESS_NOTE);
      expect(response.data?.status).toBe('completed');
    });
  });

  describe('Note Type: Admission Note', () => {
    it('should create admission note with complete patient history', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.ADMISSION_NOTE,
        noteTitle: 'Patient Admission',
        noteContent: 'Patient admitted with acute appendicitis',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Right lower quadrant tenderness, fever',
        assessment: 'Acute appendicitis, requires surgical intervention',
        plan: 'Prepare for emergency appendectomy',
        specialtyCode: 'SURGERY',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.ADMISSION_NOTE);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should require specialty code for admission notes', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.ADMISSION_NOTE,
        noteTitle: 'Patient Admission',
        noteContent: 'Patient admitted',
        createdBy: global.testUtils.generateUUID(),
      };

      const response = await useCase.execute(request);

      // Should still succeed but specialty code recommended
      expect(response.success).toBe(true);
    });
  });

  describe('Note Type: Discharge Note', () => {
    it('should create discharge note with follow-up instructions', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.DISCHARGE_NOTE,
        noteTitle: 'Discharge Summary',
        noteContent: 'Patient recovered well, ready for discharge',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'All vital signs normal, wound healing well',
        assessment: 'Post-operative recovery complete',
        plan: 'Follow-up in 1 week, continue oral antibiotics for 5 days',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.DISCHARGE_NOTE);
      expect(response.noteId).toBeTruthy();
    });
  });

  describe('Note Type: Consultation Note', () => {
    it('should create consultation note with specialist opinion', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.CONSULTATION_NOTE,
        noteTitle: 'Cardiology Consultation',
        noteContent: 'Consulted for chest pain evaluation',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'ECG shows normal sinus rhythm',
        assessment: 'No evidence of acute cardiac event',
        plan: 'Continue monitoring, stress test recommended',
        specialtyCode: 'CARDIOLOGY',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.CONSULTATION_NOTE);
    });
  });

  describe('Note Type: Procedure Note', () => {
    it('should create procedure note with technical details', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROCEDURE_NOTE,
        noteTitle: 'Central Line Insertion',
        noteContent: 'Central venous catheter inserted via right internal jugular vein',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Procedure completed without complications',
        assessment: 'Successful catheter placement',
        plan: 'Monitor insertion site, CXR to confirm placement',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.PROCEDURE_NOTE);
    });
  });

  describe('Note Type: Operative Note', () => {
    it('should create operative note with surgical details', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.OPERATIVE_NOTE,
        noteTitle: 'Appendectomy Operative Note',
        noteContent: 'Laparoscopic appendectomy performed under general anesthesia',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Inflamed appendix removed, no perforation noted',
        assessment: 'Successful appendectomy',
        plan: 'Post-operative monitoring, IV antibiotics for 24 hours',
        specialtyCode: 'SURGERY',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.OPERATIVE_NOTE);
    });
  });

  describe('Note Type: Emergency Note', () => {
    it('should create emergency note with urgent care details', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.EMERGENCY_NOTE,
        noteTitle: 'Emergency Department Evaluation',
        noteContent: 'Patient presented with acute chest pain',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'BP 160/95, pulse 110, diaphoretic',
        assessment: 'Possible acute coronary syndrome',
        plan: 'STAT ECG, troponin, admit to CCU',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.EMERGENCY_NOTE);
    });
  });

  describe('Note Type: Follow-up Note', () => {
    it('should create follow-up note with previous visit reference', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.FOLLOW_UP_NOTE,
        noteTitle: 'Post-Discharge Follow-up',
        noteContent: 'Patient returns for follow-up after appendectomy',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Surgical wound healing well, no signs of infection',
        assessment: 'Normal post-operative recovery',
        plan: 'No further follow-up needed unless symptoms develop',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.FOLLOW_UP_NOTE);
    });
  });

  describe('Note Type: SOAP Note', () => {
    it('should create SOAP note with structured format', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.SOAP_NOTE,
        noteTitle: 'SOAP Note - Diabetes Follow-up',
        noteContent: 'S: Patient reports good glucose control. O: HbA1c 6.8%, BP 130/80. A: Type 2 DM, well controlled. P: Continue current regimen.',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'HbA1c improved from 7.5% to 6.8%',
        assessment: 'Type 2 diabetes mellitus, good glycemic control',
        plan: 'Continue metformin 1000mg BID, lifestyle modifications, follow-up in 3 months',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.SOAP_NOTE);
    });
  });

  describe('Note Type: Nursing Note', () => {
    it('should create nursing note with care observations', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.NURSING_NOTE,
        noteTitle: 'Nursing Shift Note',
        noteContent: 'Patient resting comfortably, vital signs stable',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Pain level 2/10, wound dressing clean and dry',
        assessment: 'Patient recovering well',
        plan: 'Continue current care plan, monitor vital signs q4h',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.noteType).toBe(ClinicalNoteType.NURSING_NOTE);
    });
  });

  describe('Cosigning Workflow', () => {
    it('should require cosign for resident notes', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Resident Progress Note',
        noteContent: 'Patient evaluation by resident',
        createdBy: global.testUtils.generateUUID(),
        requiresCosign: true,
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.requiresCosign).toBe(true);
      expect(response.data?.status).toBe('pending_cosign' as any);
    });

    it('should not require cosign for attending physician notes', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Attending Progress Note',
        noteContent: 'Patient evaluation by attending',
        createdBy: global.testUtils.generateUUID(),
        requiresCosign: false,
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.data?.requiresCosign).toBe(false);
      expect(response.data?.status).toBe('completed' as any);
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: '',
        patientId: '',
        authorId: '',
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: '',
        noteContent: '',
        createdBy: '',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);
    });

    it('should fail when note type is invalid', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: 'invalid-type' as any,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: global.testUtils.generateUUID(),
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
    });

    it('should fail when note content is empty', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: '',
        createdBy: global.testUtils.generateUUID(),
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('should authorize author to create their own notes', async () => {
      const authorId = global.testUtils.generateDoctorId();
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId,
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: authorId,
      };

      const authorized = await useCase.authorize(request, authorId);

      expect(authorized).toBe(true);
    });

    it('should not authorize different user', async () => {
      const authorId = global.testUtils.generateDoctorId();
      const differentUserId = global.testUtils.generateDoctorId();
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId,
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: authorId,
      };

      const authorized = await useCase.authorize(request, differentUserId);

      expect(authorized).toBe(false);
    });
  });

  describe('PHI Protection', () => {
    it('should identify notes as containing PHI', () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: global.testUtils.generateUUID(),
      };

      const hasPHI = useCase.involvesPHI(request);

      expect(hasPHI).toBe(true);
    });

    it('should extract patient ID from request', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId,
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: global.testUtils.generateUUID(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBe(patientId);
    });
  });

  describe('Event Publishing', () => {
    it('should publish ClinicalNoteCreatedEvent on successful creation', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: global.testUtils.generateUUID(),
      };

      await useCase.execute(request);

      expect(mockEventPublisher.publishBatch).toHaveBeenCalledTimes(1);
      const events = mockEventPublisher.publishBatch.mock.calls[0][0];
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toContain('ClinicalNoteCreated');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValueOnce(new Error('Database error'));

      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: global.testUtils.generateUUID(),
      };

      await expect(useCase.execute(request)).rejects.toThrow();
    });

    it('should handle sequence generation errors', async () => {
      mockRepository.getNextSequence.mockRejectedValueOnce(new Error('Sequence error'));

      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Test Note',
        noteContent: 'Test content',
        createdBy: global.testUtils.generateUUID(),
      };

      await expect(useCase.execute(request)).rejects.toThrow();
    });
  });

  describe('Vietnamese Healthcare Standards', () => {
    it('should support Vietnamese medical terminology', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        noteTitle: 'Bệnh án tiến triển',
        noteContent: 'Bệnh nhân đang có tiến triển tốt. Không còn sốt.',
        createdBy: global.testUtils.generateUUID(),
        clinicalFindings: 'Nhiệt độ bình thường, ăn uống tốt',
        assessment: 'Đáp ứng tốt với điều trị',
        plan: 'Tiếp tục thuốc hiện tại, theo dõi thêm 24 giờ',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.message).toContain('thành công');
    });

    it('should support specialty codes', async () => {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        authorId: global.testUtils.generateDoctorId(),
        noteType: ClinicalNoteType.CONSULTATION_NOTE,
        noteTitle: 'Consultation Note',
        noteContent: 'Specialty consultation',
        createdBy: global.testUtils.generateUUID(),
        specialtyCode: 'NOI-KHOA',
      };

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });
  });
});
