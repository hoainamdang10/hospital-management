import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';

export interface DeleteScheduleRequest {
  scheduleId: string;
}

export interface DeleteScheduleResponse {
  scheduleId: string;
  deleted: boolean;
}

export class DeleteScheduleUseCase {
  constructor(
    private readonly scheduleRepo: IScheduleRepository,
    private readonly runRepo: IScheduleRunRepository
  ) {}

  async execute(request: DeleteScheduleRequest): Promise<DeleteScheduleResponse> {
    const { scheduleId } = request;

    // Find schedule
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Delete all runs associated with this schedule
    await this.runRepo.deleteByScheduleId(scheduleId);

    // Delete schedule
    await this.scheduleRepo.delete(scheduleId);

    return {
      scheduleId,
      deleted: true
    };
  }
}

