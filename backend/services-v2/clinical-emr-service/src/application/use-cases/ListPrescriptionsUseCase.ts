import { IUseCase } from "../interfaces/IUseCase";
import { IPrescriptionRepository } from "../../domain/repositories/IPrescriptionRepository";
import { PrescriptionDTO } from "../dto/PrescriptionDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

export class ListPrescriptionsUseCase
  implements
    IUseCase<
      { recordId: string } & Partial<PaginationParams>,
      PrescriptionDTO[]
    >
{
  constructor(private readonly repository: IPrescriptionRepository) {}

  async execute(
    request: { recordId: string } & Partial<PaginationParams>,
  ): Promise<PrescriptionDTO[]> {
    const { page = 1, limit = 20 } = request;
    const data = await this.repository.listByRecord(request.recordId, {
      page,
      limit,
    });
    return data.map((item) => mappers.prescription(item));
  }
}
