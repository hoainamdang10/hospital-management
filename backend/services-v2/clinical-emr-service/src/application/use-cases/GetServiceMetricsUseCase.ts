import { ClinicalEmrRepository } from "../repositories/ClinicalEmrRepository";
import { ServiceMetrics } from "../entities/ServiceMetrics";

export interface GetServiceMetricsRequest {
  // No parameters needed for now
}

export interface GetServiceMetricsResponse {
  success: boolean;
  data?: ServiceMetrics;
  error?: string;
}

export class GetServiceMetricsUseCase {
  constructor(private readonly repository: ClinicalEmrRepository) {}

  async execute(_request: GetServiceMetricsRequest): Promise<GetServiceMetricsResponse> {
    try {
      const metrics = await this.repository.getServiceMetrics();
      
      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error("Error getting service metrics:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
