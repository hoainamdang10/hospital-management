import { ClinicalEmrRepository } from "../repositories/ClinicalEmrRepository";

export interface ExportPatientDataRequest {
  patientId: string;
  format?: 'json' | 'xml';
}

export interface ExportPatientDataResponse {
  success: boolean;
  data?: any; // JSON export data
  error?: string;
}

export class ExportPatientDataUseCase {
  constructor(private readonly repository: ClinicalEmrRepository) {}

  async execute(request: ExportPatientDataRequest): Promise<ExportPatientDataResponse> {
    try {
      const format = request.format || 'json';
      
      if (format !== 'json') {
        return {
          success: false,
          error: "Only JSON format is currently supported"
        };
      }

      const exportData = await this.repository.exportPatientData(request.patientId);
      
      if (!exportData) {
        return {
          success: false,
          error: "Patient not found or no clinical data available"
        };
      }

      return {
        success: true,
        data: exportData
      };
    } catch (error) {
      console.error("Error exporting patient data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
