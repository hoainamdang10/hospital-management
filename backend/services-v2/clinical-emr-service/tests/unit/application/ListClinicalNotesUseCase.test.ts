/**
 * ListClinicalNotesUseCase Unit Tests
 * Tests for listing clinical notes with filtering
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ListClinicalNotesUseCase } from '../../../src/application/use-cases/ListClinicalNotesUseCase';
import {
  ListClinicalNotesRequest,
  ListClinicalNotesResponse,
} from '../../../src/application/dto/ClinicalNoteRequest';
import { IClinicalNoteRepository } from '../../../src/domain/repositories/IClinicalNoteRepository';
import {
  ClinicalNoteAggregate,
  ClinicalNoteType,
  ClinicalNoteStatus,
} from '../../../src/domain/aggregates/ClinicalNote.aggregate';
import { NoteId } from '../../../src/domain/value-objects/NoteId';

describe('ListClinicalNotesUseCase', () => {
  let useCase: ListClinicalNotesUseCase;
  let mockRepository: jest.Mocked<IClinicalNoteRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdString: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByAuthorId: jest.fn(),
      findByType: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getNextSequence: jest.fn(),
    } as any;

    useCase = new ListClinicalNotesUseCase(mockRepository);
  });

  // Helper to create mock clinical notes
  const createMockNote = (overrides: Partial<any> = {}): any => {
    const noteId = NoteId.create('NOTE-202501-001');
    return {
      noteId,
      medicalRecordId: global.testUtils.generateMedicalRecordId(),
      patientId: global.testUtils.generatePatientId(),
      authorId: global.testUtils.generateDoctorId(),
      noteType: ClinicalNoteType.PROGRESS_NOTE,
      noteTitle: 'Test Note',
      noteContent: 'Test content',
      requiresCosign: false,
      status: ClinicalNoteStatus.COMPLETED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  describe('Basic Listing', () => {
    it('should list all clinical notes successfully', async () => {
      const mockNotes = [
        createMockNote(),
        createMockNote(),
        createMockNote(),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(3);
      expect(result.data?.total).toBe(3);
      expect(result.message).toBe('Tìm thấy 3 ghi chú lâm sàng');
      expect(mockRepository.search).toHaveBeenCalledWith({});
    });

    it('should return empty list when no notes found', async () => {
      mockRepository.search.mockResolvedValue([]);

      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(0);
      expect(result.data?.total).toBe(0);
      expect(result.message).toBe('Tìm thấy 0 ghi chú lâm sàng');
    });

    it('should include correct summary fields', async () => {
      const mockNote = createMockNote({
        noteType: ClinicalNoteType.ADMISSION_NOTE,
        status: ClinicalNoteStatus.COMPLETED,
        requiresCosign: true,
        cosignedBy: global.testUtils.generateDoctorId(),
        cosignedAt: new Date(),
      });
      mockRepository.search.mockResolvedValue([mockNote]);

      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.data?.notes[0]).toHaveProperty('noteId');
      expect(result.data?.notes[0]).toHaveProperty('medicalRecordId');
      expect(result.data?.notes[0]).toHaveProperty('patientId');
      expect(result.data?.notes[0]).toHaveProperty('authorId');
      expect(result.data?.notes[0]).toHaveProperty('noteType');
      expect(result.data?.notes[0]).toHaveProperty('noteTitle');
      expect(result.data?.notes[0]).toHaveProperty('requiresCosign');
      expect(result.data?.notes[0]).toHaveProperty('status');
      expect(result.data?.notes[0]).toHaveProperty('createdAt');
      expect(result.data?.notes[0]).toHaveProperty('updatedAt');
    });
  });

  describe('Filtering by Medical Record', () => {
    it('should filter notes by medical record ID', async () => {
      const medicalRecordId = global.testUtils.generateMedicalRecordId();
      const mockNotes = [
        createMockNote({ medicalRecordId }),
        createMockNote({ medicalRecordId }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        medicalRecordId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(2);
      expect(mockRepository.search).toHaveBeenCalledWith({ medicalRecordId });
    });
  });

  describe('Filtering by Patient', () => {
    it('should filter notes by patient ID', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockNotes = [
        createMockNote({ patientId }),
        createMockNote({ patientId }),
        createMockNote({ patientId }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(3);
      expect(mockRepository.search).toHaveBeenCalledWith({ patientId });
    });
  });

  describe('Filtering by Author', () => {
    it('should filter notes by author ID', async () => {
      const authorId = global.testUtils.generateDoctorId();
      const mockNotes = [
        createMockNote({ authorId }),
        createMockNote({ authorId }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        authorId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(2);
      expect(mockRepository.search).toHaveBeenCalledWith({ authorId });
    });
  });

  describe('Filtering by Note Type', () => {
    it('should filter progress notes', async () => {
      const mockNotes = [
        createMockNote({ noteType: ClinicalNoteType.PROGRESS_NOTE }),
        createMockNote({ noteType: ClinicalNoteType.PROGRESS_NOTE }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(2);
      expect(mockRepository.search).toHaveBeenCalledWith({ noteType: ClinicalNoteType.PROGRESS_NOTE });
    });

    it('should filter admission notes', async () => {
      const mockNotes = [
        createMockNote({ noteType: ClinicalNoteType.ADMISSION_NOTE }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        noteType: ClinicalNoteType.ADMISSION_NOTE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(1);
    });

    it('should filter discharge notes', async () => {
      const mockNotes = [
        createMockNote({ noteType: ClinicalNoteType.DISCHARGE_NOTE }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        noteType: ClinicalNoteType.DISCHARGE_NOTE,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(1);
    });
  });

  describe('Filtering by Status', () => {
    it('should filter draft notes', async () => {
      const mockNotes = [
        createMockNote({ status: ClinicalNoteStatus.DRAFT }),
        createMockNote({ status: ClinicalNoteStatus.DRAFT }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        status: ClinicalNoteStatus.DRAFT,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(2);
    });

    it('should filter completed notes', async () => {
      const mockNotes = [
        createMockNote({ status: ClinicalNoteStatus.COMPLETED }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        status: ClinicalNoteStatus.COMPLETED,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(1);
    });
  });

  describe('Filtering by Cosign Requirement', () => {
    it('should filter notes requiring cosign', async () => {
      const mockNotes = [
        createMockNote({ requiresCosign: true }),
        createMockNote({ requiresCosign: true }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        requiresCosign: true,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(2);
      expect(result.data?.notes.every(n => n.requiresCosign)).toBe(true);
    });

    it('should filter notes not requiring cosign', async () => {
      const mockNotes = [
        createMockNote({ requiresCosign: false }),
        createMockNote({ requiresCosign: false }),
        createMockNote({ requiresCosign: false }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        requiresCosign: false,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(3);
      expect(result.data?.notes.every(n => !n.requiresCosign)).toBe(true);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter notes by start date', async () => {
      const startDate = new Date('2024-01-01');
      const mockNotes = [
        createMockNote({ createdAt: new Date('2024-01-15') }),
        createMockNote({ createdAt: new Date('2024-02-01') }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        startDate: startDate.toISOString(),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.search).toHaveBeenCalledWith({ startDate });
    });

    it('should filter notes by end date', async () => {
      const endDate = new Date('2024-12-31');
      const mockNotes = [
        createMockNote({ createdAt: new Date('2024-06-01') }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        endDate: endDate.toISOString(),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.search).toHaveBeenCalledWith({ endDate });
    });

    it('should filter notes by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockNotes = [
        createMockNote({ createdAt: new Date('2024-06-15') }),
        createMockNote({ createdAt: new Date('2024-08-20') }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(2);
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters simultaneously', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockNotes = [
        createMockNote({
          patientId,
          noteType: ClinicalNoteType.PROGRESS_NOTE,
          status: ClinicalNoteStatus.COMPLETED,
        }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        patientId,
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        status: ClinicalNoteStatus.COMPLETED,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith({
        patientId,
        noteType: ClinicalNoteType.PROGRESS_NOTE,
        status: ClinicalNoteStatus.COMPLETED,
      });
    });

    it('should filter by patient, author, and date range', async () => {
      const patientId = global.testUtils.generatePatientId();
      const authorId = global.testUtils.generateDoctorId();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockNotes = [
        createMockNote({ patientId, authorId }),
      ];
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        patientId,
        authorId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(1);
    });
  });

  describe('Pagination', () => {
    it('should apply default pagination (limit 50)', async () => {
      const mockNotes = Array(75).fill(null).map(() => createMockNote());
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(50); // Default limit
      expect(result.data?.total).toBe(75);
      expect(result.data?.limit).toBe(50);
      expect(result.data?.offset).toBe(0);
    });

    it('should apply custom limit', async () => {
      const mockNotes = Array(100).fill(null).map(() => createMockNote());
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        limit: 20,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(20);
      expect(result.data?.total).toBe(100);
      expect(result.data?.limit).toBe(20);
    });

    it('should apply offset for pagination', async () => {
      const mockNotes = Array(100).fill(null).map(() => createMockNote());
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        limit: 20,
        offset: 40,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(20);
      expect(result.data?.offset).toBe(40);
    });

    it('should handle last page correctly', async () => {
      const mockNotes = Array(55).fill(null).map(() => createMockNote());
      mockRepository.search.mockResolvedValue(mockNotes);

      const request: ListClinicalNotesRequest = {
        limit: 50,
        offset: 50,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toHaveLength(5); // Remaining items
      expect(result.data?.total).toBe(55);
    });
  });

  describe('Validation', () => {
    it('should fail when limit is zero', async () => {
      const request: ListClinicalNotesRequest = {
        limit: 0,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].field).toBe('limit');
    });

    it('should fail when limit is negative', async () => {
      const request: ListClinicalNotesRequest = {
        limit: -10,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].field).toBe('limit');
    });

    it('should fail when limit exceeds maximum (200)', async () => {
      const request: ListClinicalNotesRequest = {
        limit: 201,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].field).toBe('limit');
      expect(result.errors?.[0].message).toContain('200');
    });

    it('should fail when offset is negative', async () => {
      const request: ListClinicalNotesRequest = {
        offset: -5,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].field).toBe('offset');
    });

    it('should fail when start date is after end date', async () => {
      const request: ListClinicalNotesRequest = {
        startDate: '2024-12-31',
        endDate: '2024-01-01',
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].field).toBe('dateRange');
    });

    it('should accept valid pagination parameters', async () => {
      mockRepository.search.mockResolvedValue([]);

      const request: ListClinicalNotesRequest = {
        limit: 100,
        offset: 50,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should authorize when accessedBy matches userId', async () => {
      const userId = global.testUtils.generateDoctorId();
      const request: ListClinicalNotesRequest = {
        accessedBy: userId,
      };

      const authorized = await useCase.authorize(request, userId);

      expect(authorized).toBe(true);
    });

    it('should not authorize when accessedBy does not match userId', async () => {
      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const authorized = await useCase.authorize(request, global.testUtils.generateDoctorId());

      expect(authorized).toBe(false);
    });
  });

  describe('PHI Protection', () => {
    it('should identify listing as containing PHI', () => {
      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const containsPHI = useCase.involvesPHI(request);

      expect(containsPHI).toBe(true);
    });

    it('should extract patient ID when provided', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: ListClinicalNotesRequest = {
        patientId,
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBe(patientId);
    });

    it('should return null when patient ID not provided', () => {
      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      mockRepository.search.mockRejectedValue(new Error('Database connection failed'));

      const request: ListClinicalNotesRequest = {
        accessedBy: global.testUtils.generateDoctorId(),
      };

      await expect(useCase.execute(request)).rejects.toThrow('Lỗi khi lấy danh sách ghi chú lâm sàng');
    });
  });
});
