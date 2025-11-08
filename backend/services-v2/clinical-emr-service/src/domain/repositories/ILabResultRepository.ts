import { LabResultProps } from "../entities/LabResult";
import { PaginationParams } from "../../shared/types/pagination";

export interface ILabResultRepository {
  listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<LabResultProps[]>;
  save(result: LabResultProps): Promise<LabResultProps>;
  delete(recordId: string, resultId: string): Promise<void>;
}
