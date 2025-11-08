import {
  MedicalRecord,
  MedicalRecordProps,
  MedicalRecordStatus,
} from "../entities/MedicalRecord";
import { PaginationParams } from "../../shared/types/pagination";

export interface IMedicalRecordRepository {
  list(
    filters: {
      patientId?: string;
      doctorId?: string;
      status?: MedicalRecordStatus;
      encounterType?: "inpatient" | "outpatient";
    },
    pagination: PaginationParams,
  ): Promise<MedicalRecordProps[]>;
  getById(id: string): Promise<MedicalRecordProps | null>;
  save(record: MedicalRecord): Promise<MedicalRecordProps>;
  update(record: MedicalRecord): Promise<MedicalRecordProps>;
}
