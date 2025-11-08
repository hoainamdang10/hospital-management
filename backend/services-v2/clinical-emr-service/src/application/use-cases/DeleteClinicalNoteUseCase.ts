import { IUseCase } from "../interfaces/IUseCase";
import { IClinicalNoteRepository } from "../../domain/repositories/IClinicalNoteRepository";

interface DeleteClinicalNoteRequest {
  recordId: string;
  noteId: string;
}

export class DeleteClinicalNoteUseCase
  implements IUseCase<DeleteClinicalNoteRequest, void>
{
  constructor(private readonly repository: IClinicalNoteRepository) {}

  async execute({
    recordId,
    noteId,
  }: DeleteClinicalNoteRequest): Promise<void> {
    await this.repository.delete(recordId, noteId);
  }
}
