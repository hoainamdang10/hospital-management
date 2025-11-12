import { ClinicalEmrRepository } from "../repositories/ClinicalEmrRepository";
import { PatientSummary } from "../entities/PatientSummary";

export interface GetPatientSummaryRequest {
  patientId: string;
}

export interface GetPatientSummaryResponse {
  success: boolean;
  data?: PatientSummary;
  error?: string;
}

export class GetPatientSummaryUseCase {
  constructor(private readonly repository: ClinicalEmrRepository) {}

  async execute(request: GetPatientSummaryRequest): Promise<GetPatientSummaryResponse> {
    try {
      const patientSummary = await this.repository.getPatientSummary(request.patientId);
      
      if (!patientSummary) {
        return {
          success: false,
          error: "Patient not found or no clinical data available"
        };
      }

      return {
        success: true,
        data: patientSummary
      };
    } catch (error) {
      console.error("Error getting patient summary:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
