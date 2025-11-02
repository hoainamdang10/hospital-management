/**
 * Unit Tests - ExportToFHIRUseCase
 * Tests for exporting medical records to FHIR format
 */

import { ExportToFHIRUseCase } from '../../../src/application/use-cases/ExportToFHIRUseCase';

describe('ExportToFHIRUseCase', () => {
  let useCase: ExportToFHIRUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ExportToFHIRUseCase(mockRepository);
  });

  describe('execute - Happy Path', () => {
    it('should export to FHIR R4 format', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const mockRecord = {
        toFHIR: jest.fn().mockReturnValue({
          resourceType: 'Composition',
          id: recordId,
          status: 'final',
        }),
        recordReadAccess: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId,
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.resourceType).toBe('Composition');
      expect(result.data?.fhirVersion).toBe('4.0.1');
    });

    it('should include patient resource', async () => {
      const mockRecord = {
        toFHIR: jest.fn().mockReturnValue({
          resourceType: 'Composition',
          subject: { reference: 'Patient/123' },
        }),
        recordReadAccess: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.fhirResource).toBeDefined();
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('execute - Record Not Found', () => {
    it('should fail when record does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('NOT_FOUND');
    });
  });

  describe('execute - FHIR Compliance', () => {
    it('should support FHIR R4', async () => {
      const mockRecord = {
        toFHIR: jest.fn().mockReturnValue({
          resourceType: 'Composition',
          meta: { versionId: 'R4' },
        }),
        recordReadAccess: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.fhirVersion).toBe('4.0.1');
    });
  });
});
