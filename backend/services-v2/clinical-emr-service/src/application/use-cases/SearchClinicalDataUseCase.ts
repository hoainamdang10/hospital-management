import { ClinicalEmrRepository } from "../repositories/ClinicalEmrRepository";
import { SearchResult } from "../entities/SearchResult";

export interface SearchClinicalDataRequest {
  searchTerm: string;
  limit?: number;
}

export interface SearchClinicalDataResponse {
  success: boolean;
  data?: SearchResult[];
  error?: string;
}

export class SearchClinicalDataUseCase {
  constructor(private readonly repository: ClinicalEmrRepository) {}

  async execute(request: SearchClinicalDataRequest): Promise<SearchClinicalDataResponse> {
    try {
      const limit = request.limit || 50;
      
      if (!request.searchTerm || request.searchTerm.trim().length < 2) {
        return {
          success: false,
          error: "Search term must be at least 2 characters long"
        };
      }

      const results = await this.repository.searchClinicalData(request.searchTerm, limit);
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error("Error searching clinical data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
