import { DeadLetter } from '../entities/DeadLetter.entity';
export interface IDeadLetterRepository {
    save(deadLetter: DeadLetter): Promise<void>;
    findById(id: string): Promise<DeadLetter | null>;
    findByScheduleId(scheduleId: string, limit?: number): Promise<DeadLetter[]>;
    findByTenantId(tenantId: string, limit?: number): Promise<DeadLetter[]>;
    /**
     * Delete dead letters older than specified days
     *
     * @param daysOld - Number of days (e.g., 90 = delete dead letters older than 90 days)
     * @returns Number of deleted dead letters
     */
    deleteOlderThan(daysOld: number): Promise<number>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=IDeadLetterRepository.d.ts.map