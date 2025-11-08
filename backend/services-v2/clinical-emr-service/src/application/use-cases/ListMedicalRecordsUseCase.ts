import { IUseCase } from "../interfaces/IUseCase";
import { IMedicalRecordRepository } from "../../domain/repositories/IMedicalRecordRepository";
import { MedicalRecordDTO } from "../dto/MedicalRecordDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

interface ListFilters extends Partial<PaginationParams> {
  patientId?: string;
  doctorId?: string;
  status?: "draft" | "final" | "archived";
  encounterType?: "inpatient" | "outpatient";
}

export class ListMedicalRecordsUseCase
  implements IUseCase<ListFilters, MedicalRecordDTO[]>
{
  constructor(private readonly repository: IMedicalRecordRepository) {}

  async execute(request: ListFilters): Promise<MedicalRecordDTO[]> {
    const { page = 1, limit = 20, ...filters } = request;
    const results = await this.repository.list(filters, { page, limit });
    return results.map((record) => mappers.medicalRecord(record));
  }
}
