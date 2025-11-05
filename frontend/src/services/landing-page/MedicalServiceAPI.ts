import { MedicalService, ServiceResponse } from "../types/MedicalService";
import { apiClient } from "../api/client";

export class LandingPageMedicalServiceAPI {
  private static instance: LandingPageMedicalServiceAPI;

  private constructor() {}

  public static getInstance(): LandingPageMedicalServiceAPI {
    if (!LandingPageMedicalServiceAPI.instance) {
      LandingPageMedicalServiceAPI.instance =
        new LandingPageMedicalServiceAPI();
    }
    return LandingPageMedicalServiceAPI.instance;
  }

  async getAllServices(): Promise<ServiceResponse> {
    try {
      const response = await apiClient.get<MedicalService[]>("/provider-staff-service/medical-services");
      
      if (!response.success || !response.data) {
        return {
          success: false,
          data: [],
          message: response.message || "Có lỗi xảy ra khi lấy danh sách dịch vụ",
        };
      }

      return {
        success: true,
        data: response.data,
        message: "Lấy danh sách dịch vụ thành công",
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Có lỗi xảy ra khi lấy danh sách dịch vụ",
      };
    }
  }

  async getFeaturedServices(): Promise<ServiceResponse> {
    try {
      const response = await apiClient.get<MedicalService[]>("/provider-staff-service/medical-services/featured");
      
      if (!response.success || !response.data) {
        const allServices = await this.getAllServices();
        if (!allServices.success) {
          return allServices;
        }
        const featuredServices = allServices.data?.slice(0, 4) || [];
        return {
          success: true,
          data: featuredServices,
          message: "Lấy danh sách dịch vụ nổi bật thành công",
        };
      }

      return {
        success: true,
        data: response.data,
        message: "Lấy danh sách dịch vụ nổi bật thành công",
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Có lỗi xảy ra khi lấy dịch vụ nổi bật",
      };
    }
  }

  async searchServices(query: string): Promise<ServiceResponse> {
    try {
      const response = await apiClient.get<MedicalService[]>(
        `/provider-staff-service/medical-services/search?q=${encodeURIComponent(query)}`
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          data: [],
          message: response.message || "Có lỗi xảy ra khi tìm kiếm dịch vụ",
        };
      }

      return {
        success: true,
        data: response.data,
        message: `Tìm thấy ${response.data.length} dịch vụ phù hợp`,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Có lỗi xảy ra khi tìm kiếm dịch vụ",
      };
    }
  }
}

// Export singleton instance
export const landingPageMedicalServiceAPI =
  LandingPageMedicalServiceAPI.getInstance();
