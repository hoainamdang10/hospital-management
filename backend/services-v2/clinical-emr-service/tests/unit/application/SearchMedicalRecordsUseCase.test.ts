/**
 * Unit Tests - SearchMedicalRecordsUseCase
 * Tests for searching medical records
 */

import { SearchMedicalRecordsUseCase } from '../../../src/application/use-cases/SearchMedicalRecordsUseCase';

describe('SearchMedicalRecordsUseCase', () => {
  let useCase: SearchMedicalRecordsUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      search: jest.fn(),
      findByPatientId: jest.fn(),
    };
    useCase = new SearchMedicalRecordsUseCase(mockRepository);
  });

  describe('execute - Happy Path', () => {
    it('should search by patient ID', async () => {
      const patientId = global.testUtils.generatePatientId();
      const mockRecords = [
        { id: 'REC-001', patientId },
        { id: 'REC-002', patientId },
      ];
      mockRepository.findByPatientId.mockResolvedValue(mockRecords);
      
      const request = {
        patientId,
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should search by date range', async () => {
      const mockRecords = [
        { id: 'REC-001', createdAt: '2024-01-15' },
      ];
      mockRepository.search.mockResolvedValue(mockRecords);
      
      const request = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });

    it('should support pagination', async () => {
      const mockRecords = Array(10).fill(null).map((_, i) => ({ id: `REC-${i}` }));
      mockRepository.search.mockResolvedValue(mockRecords);
      
      const request = {
        patientId: global.testUtils.generatePatientId(),
        page: 1,
        limit: 10,
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when no search criteria provided', async () => {
      const request = {
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('execute - Empty Results', () => {
    it('should return empty array when no records found', async () => {
      mockRepository.findByPatientId.mockResolvedValue([]);
      
      const request = {
        patientId: global.testUtils.generatePatientId(),
        requestedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
