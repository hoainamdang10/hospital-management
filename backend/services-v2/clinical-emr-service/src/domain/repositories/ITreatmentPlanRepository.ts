import { TreatmentPlanProps } from "../entities/TreatmentPlan";
import { PaginationParams } from "../../shared/types/pagination";

export interface ITreatmentPlanRepository {
  listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<TreatmentPlanProps[]>;
  getById(planId: string): Promise<TreatmentPlanProps | null>;
  save(plan: TreatmentPlanProps): Promise<TreatmentPlanProps>;
  update(plan: TreatmentPlanProps): Promise<TreatmentPlanProps>;
  delete(recordId: string, planId: string): Promise<void>;
}
