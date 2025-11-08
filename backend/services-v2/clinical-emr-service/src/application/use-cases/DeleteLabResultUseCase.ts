import { IUseCase } from "../interfaces/IUseCase";
import { ILabResultRepository } from "../../domain/repositories/ILabResultRepository";

interface DeleteLabResultRequest {
  recordId: string;
  resultId: string;
}

export class DeleteLabResultUseCase
  implements IUseCase<DeleteLabResultRequest, void>
{
  constructor(private readonly repository: ILabResultRepository) {}

  async execute({ recordId, resultId }: DeleteLabResultRequest): Promise<void> {
    await this.repository.delete(recordId, resultId);
  }
}
