/**
 * StaffReadModelRepository Tests
 * @version 2.0.0
 */

import { StaffReadModelRepository } from '../../../../src/infrastructure/repositories/StaffReadModelRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../../../src/application/interfaces/ILogger';

describe('StaffReadModelRepository', () => {
  let repository: StaffReadModelRepository;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    repository = new StaffReadModelRepository(mockSupabase, mockLogger);
  });

  describe('findById', () => {
    it('should find staff read model by ID', async () => {
      const mockData = {
        staff_id: 'staff-123',
        user_id: 'user-123',
        full_name: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        average_rating: 4.5,
        total_reviews: 10,
        rating_distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 },
        last_review_date: '2024-01-15T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.findById('staff-123');

      expect(result).toBeDefined();
      expect(result?.staffId).toBe('staff-123');
      expect(result?.averageRating).toBe(4.5);
      expect(result?.totalReviews).toBe(10);
    });

    it('should return null when staff not found', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } as any 
      });

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'ERROR', message: 'Database error' } as any 
      });

      await expect(repository.findById('staff-123')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should find all staff with pagination', async () => {
      const mockData = [
        { staff_id: 'staff-1', full_name: 'Dr. A', average_rating: 4.8 },
        { staff_id: 'staff-2', full_name: 'Dr. B', average_rating: 4.5 }
      ];

      mockSupabase.range.mockResolvedValue({ 
        data: mockData.map(d => ({
          ...d,
          user_id: 'user-1',
          specialization: 'Cardiology',
          department: 'Cardiology',
          total_reviews: 10,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          last_review_date: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        })),
        error: null 
      });

      const result = await repository.findAll(10, 0);

      expect(result).toHaveLength(2);
      expect(result[0].staffId).toBe('staff-1');
    });

    it('should use default pagination values', async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null });

      await repository.findAll();

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
    });
  });

  describe('findByDepartment', () => {
    it('should find staff by department', async () => {
      const mockData = [{
        staff_id: 'staff-1',
        user_id: 'user-1',
        full_name: 'Dr. Cardiologist',
        specialization: 'Cardiology',
        department: 'Cardiology',
        average_rating: 4.8,
        total_reviews: 10,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 8 },
        last_review_date: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }];

      mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.findByDepartment('Cardiology');

      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('Cardiology');
      expect(mockSupabase.eq).toHaveBeenCalledWith('department', 'Cardiology');
    });
  });

  describe('findTopRated', () => {
    it('should find top rated staff', async () => {
      const mockData = [{
        staff_id: 'staff-1',
        user_id: 'user-1',
        full_name: 'Dr. Best',
        specialization: 'Cardiology',
        department: 'Cardiology',
        average_rating: 4.9,
        total_reviews: 20,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 18 },
        last_review_date: '2024-01-15',
        created_at: '2024-01-01',
        updated_at: '2024-01-15'
      }];

      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.findTopRated(5);

      expect(result).toHaveLength(1);
      expect(result[0].averageRating).toBe(4.9);
      expect(mockSupabase.gte).toHaveBeenCalledWith('total_reviews', 5);
    });
  });

  describe('create', () => {
    it('should create staff read model', async () => {
      mockSupabase.insert.mockResolvedValue({ data: null, error: null });

      await repository.create({
        staffId: 'staff-123',
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology'
      });

      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff read model created',
        expect.objectContaining({ staffId: 'staff-123' })
      );
    });

    it('should handle creation errors', async () => {
      mockSupabase.insert.mockResolvedValue({ 
        data: null, 
        error: { message: 'Insert failed' } as any 
      });

      await expect(repository.create({
        staffId: 'staff-123',
        userId: 'user-123',
        fullName: 'Dr. John'
      })).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateRating', () => {
    it('should update staff rating', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await repository.updateRating('staff-123', {
        averageRating: 4.8,
        totalReviews: 15,
        ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 10 },
        lastReviewDate: new Date('2024-01-20')
      });

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should update partial rating data', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await repository.updateRating('staff-123', {
        averageRating: 4.5
      });

      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete staff read model', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      await repository.delete('staff-123');

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Staff read model deleted',
        expect.objectContaining({ staffId: 'staff-123' })
      );
    });
  });
});
