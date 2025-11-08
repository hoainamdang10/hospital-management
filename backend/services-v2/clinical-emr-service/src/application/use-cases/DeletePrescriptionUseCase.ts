import { IUseCase } from "../interfaces/IUseCase";
import { IPrescriptionRepository } from "../../domain/repositories/IPrescriptionRepository";

interface DeletePrescriptionRequest {
  recordId: string;
  prescriptionId: string;
}

export class DeletePrescriptionUseCase
  implements IUseCase<DeletePrescriptionRequest, void>
{
  constructor(private readonly repository: IPrescriptionRepository) {}

  async execute({
    recordId,
    prescriptionId,
  }: DeletePrescriptionRequest): Promise<void> {
    await this.repository.delete(recordId, prescriptionId);
  }
}
