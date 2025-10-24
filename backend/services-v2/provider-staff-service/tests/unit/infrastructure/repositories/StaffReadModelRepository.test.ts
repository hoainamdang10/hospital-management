import { StaffReadModelRepository } from '@infrastructure/repositories/StaffReadModelRepository';
import { createMockLogger } from '@tests/helpers/mockFactories';

describe('StaffReadModelRepository', () => {
  const tableName = 'provider_schema.staff_read_model';
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
  });

  const buildSupabaseMock = () => {
    const fromMock = jest.fn();
    const supabaseClient = { from: fromMock } as any;
    return { supabaseClient, fromMock };
  };

  it('findById trả về read model khi tồn tại', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        staff_id: 'STF-001',
        user_id: 'USR-1',
        full_name: 'Bác sĩ A',
        specialization: 'Tim mạch',
        department: 'CARD',
        average_rating: 4.5,
        total_reviews: 12,
        rating_distribution: { 1: 0, 2: 0, 3: 2, 4: 4, 5: 6 },
        last_review_date: '2024-01-01T00:00:00.000Z',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-06-01T00:00:00.000Z'
      },
      error: null
    });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({
      select: selectMock,
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    const result = await repository.findById('STF-001');

    expect(fromMock).toHaveBeenCalledWith(tableName);
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('staff_id', 'STF-001');
    expect(result).toEqual(
      expect.objectContaining({
        staffId: 'STF-001',
        userId: 'USR-1',
        fullName: 'Bác sĩ A',
        averageRating: 4.5,
        totalReviews: 12
      })
    );
    expect(result?.lastReviewDate).toBeInstanceOf(Date);
  });

  it('findById trả về null khi không có dữ liệu', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' }
    });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({
      select: selectMock,
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    const result = await repository.findById('STF-404');

    expect(result).toBeNull();
  });

  it('findAll áp dụng range và sắp xếp theo rating', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const rangeMock = jest.fn().mockResolvedValue({
      data: [{
        staff_id: 'STF-100',
        user_id: 'USR-100',
        full_name: 'Điều dưỡng B',
        specialization: null,
        department: 'NURS',
        average_rating: 4.8,
        total_reviews: 20,
        rating_distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 15 },
        last_review_date: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-06-01T00:00:00.000Z'
      }],
      error: null
    });
    const orderMock = jest.fn().mockReturnValue({ range: rangeMock });
    const selectMock = jest.fn().mockReturnValue({ order: orderMock });
    fromMock.mockReturnValue({
      select: selectMock,
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    const results = await repository.findAll(10, 5);

    expect(orderMock).toHaveBeenCalledWith('average_rating', { ascending: false });
    expect(rangeMock).toHaveBeenCalledWith(5, 14);
    expect(results).toHaveLength(1);
    expect(results[0].staffId).toBe('STF-100');
  });

  it('findTopRated lọc theo total_reviews và giới hạn kết quả', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const limitMock = jest.fn().mockResolvedValue({
      data: [{
        staff_id: 'STF-200',
        user_id: 'USR-200',
        full_name: 'Bác sĩ C',
        specialization: 'Nhi khoa',
        department: 'PEDI',
        average_rating: 4.9,
        total_reviews: 45,
        rating_distribution: { 1: 0, 2: 1, 3: 2, 4: 10, 5: 32 },
        last_review_date: '2024-02-01T00:00:00.000Z',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-06-01T00:00:00.000Z'
      }],
      error: null
    });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const gteMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ gte: gteMock });
    fromMock.mockReturnValue({
      select: selectMock,
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    const results = await repository.findTopRated(3);

    expect(gteMock).toHaveBeenCalledWith('total_reviews', 5);
    expect(orderMock).toHaveBeenCalledWith('average_rating', { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(3);
    expect(results[0].averageRating).toBe(4.9);
  });

  it('create khởi tạo bản ghi với giá trị mặc định', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({
      select: jest.fn(),
      insert: insertMock,
      update: jest.fn(),
      delete: jest.fn()
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    await repository.create({
      staffId: 'STF-300',
      userId: 'USR-300',
      fullName: 'Điều dưỡng D',
      specialization: 'Hồi sức',
      department: 'ICU'
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        staff_id: 'STF-300',
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Staff read model created',
      expect.objectContaining({ staffId: 'STF-300' })
    );
  });

  it('updateRating cập nhật các trường được truyền', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({
      select: jest.fn(),
      insert: jest.fn(),
      update: updateMock,
      delete: jest.fn()
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    const lastReviewDate = new Date('2024-03-01T00:00:00.000Z');

    await repository.updateRating('STF-400', {
      averageRating: 4.2,
      totalReviews: 18,
      ratingDistribution: { 1: 0, 2: 1, 3: 3, 4: 5, 5: 9 },
      lastReviewDate
    });

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      average_rating: 4.2,
      total_reviews: 18,
      rating_distribution: { 1: 0, 2: 1, 3: 3, 4: 5, 5: 9 },
      last_review_date: lastReviewDate.toISOString()
    }));
    expect(eqMock).toHaveBeenCalledWith('staff_id', 'STF-400');
  });

  it('delete xoá bản ghi theo staffId', async () => {
    const { supabaseClient, fromMock } = buildSupabaseMock();
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: deleteMock
    });

    const repository = new StaffReadModelRepository(supabaseClient, logger);
    await repository.delete('STF-500');

    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('staff_id', 'STF-500');
    expect(logger.info).toHaveBeenCalledWith(
      'Staff read model deleted',
      expect.objectContaining({ staffId: 'STF-500' })
    );
  });
});
