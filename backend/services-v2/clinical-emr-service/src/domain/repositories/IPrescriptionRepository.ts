import { PrescriptionProps } from "../entities/Prescription";
import { PaginationParams } from "../../shared/types/pagination";

export interface IPrescriptionRepository {
  listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<PrescriptionProps[]>;
  save(prescription: PrescriptionProps): Promise<PrescriptionProps>;
  delete(recordId: string, prescriptionId: string): Promise<void>;
}
