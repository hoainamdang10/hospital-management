import { AppointmentController } from '../../../../src/presentation/controllers/AppointmentController';

// Simple Response mock
function createRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.body = undefined;
  res.json = (obj: any) => { res.body = obj; return res; };
  return res;
}

describe('AppointmentController.previewReminders', () => {
  it('should return reminder previews using default policy and apply quiet hours shift', async () => {
    const futureDate = '2099-01-02';
    const futureTime = '08:00:00';

    // Mocks for use cases (only getAppointmentUseCase is used)
    const scheduleUC: any = { execute: jest.fn() };
    const cancelUC: any = { execute: jest.fn() };
    const confirmUC: any = { execute: jest.fn() };
    const completeUC: any = { execute: jest.fn() };
    const getUC: any = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        appointment: {
          appointmentId: 'A-123',
          appointmentDate: futureDate,
          appointmentTime: futureTime,
          priority: 'routine'
        }
      })
    };
    const listUC: any = { execute: jest.fn() };

    const rescheduleUC: any = { execute: jest.fn() };
    const checkInUC: any = { execute: jest.fn() };
    const markAsNoShowUC: any = { execute: jest.fn() };
    const startUC: any = { execute: jest.fn() };
    const bulkRescheduleUC: any = { execute: jest.fn() };
    const getHistoryUC: any = { execute: jest.fn() };
    const getStatisticsUC: any = { execute: jest.fn() };
    const createEmergencyUC: any = { execute: jest.fn() };
    const transferUC: any = { execute: jest.fn() };

    const controller = new AppointmentController(
      scheduleUC,
      cancelUC,
      confirmUC,
      completeUC,
      getUC,
      listUC,
      rescheduleUC,
      checkInUC,
      markAsNoShowUC,
      startUC,
      bulkRescheduleUC,
      getHistoryUC,
      getStatisticsUC,
      createEmergencyUC,
      transferUC
    );

    const req: any = { params: { id: 'A-123' }, user: { id: 'U-1' } };
    const res = createRes();

    await controller.previewReminders(req as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.appointmentId).toBe('A-123');
    // Default policy for ROUTINE has at least 24h and 2h windows
    const windows = res.body.previews.map((p: any) => p.window);
    expect(windows).toEqual(expect.arrayContaining(['24h', '2h']));
  });
});

