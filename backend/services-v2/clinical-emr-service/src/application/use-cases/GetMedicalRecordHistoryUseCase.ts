import { ClinicalEmrRepository } from "../repositories/ClinicalEmrRepository";
import { MedicalRecordHistory } from "../entities/MedicalRecordHistory";

export interface GetMedicalRecordHistoryRequest {
  recordId: string;
}

export interface GetMedicalRecordHistoryResponse {
  success: boolean;
  data?: MedicalRecordHistory[];
  error?: string;
}

export class GetMedicalRecordHistoryUseCase {
  constructor(private readonly repository: ClinicalEmrRepository) {}

  async execute(request: GetMedicalRecordHistoryRequest): Promise<GetMedicalRecordHistoryResponse> {
    try {
      const history = await this.repository.getMedicalRecordHistory(request.recordId);
      
      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error("Error getting medical record history:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
