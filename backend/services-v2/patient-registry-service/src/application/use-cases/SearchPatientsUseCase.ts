/**
 * SearchPatientsUseCase - Application Use Case
 *
 * Searches for patients by various criteria
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';

export interface SearchPatientsRequest {
  searchTerm: string;  // Search by name, phone, email, national ID
  filters?: {
    isActive?: boolean;
    city?: string;
    province?: string;
    hasInsurance?: boolean;
    insuranceType?: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
  };
  pagination?: {
    page: number;
    limit: number;
    sorting?: {
      field: 'fullName' | 'dateOfBirth' | 'createdAt' | 'updatedAt';
      direction: 'asc' | 'desc';
    };
  };
  requestedBy: string;
}

export interface SearchPatientsResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patients: Array<{
      patientId: string;
      userId: string;
      fullName: string;
      dateOfBirth: string;
      gender: string;
      nationalId: string;
      primaryPhone: string;
      email?: string;
      city: string;
      province: string;
      status: string;
      hasInsurance: boolean;
      insuranceType?: string;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class SearchPatientsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: SearchPatientsRequest): Promise<SearchPatientsResponse> {
    try {
      // 1. Validate search term
      if (!request.searchTerm || request.searchTerm.trim().length < 2) {
        return {
          success: false,
          message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự',
          errors: ['INVALID_SEARCH_TERM']
        };
      }

      // 2. Set default pagination
      const page = request.pagination?.page || 1;
      const limit = request.pagination?.limit || 20;

      // 3. Search patients
      const result = await this.patientRepository.searchPatients(
        request.searchTerm,
        {
          isActive: request.filters?.isActive,
          hasInsurance: request.filters?.hasInsurance
        },
        {
          page,
          limit
        }
      );

      // 4. Filter by additional criteria (if provided)
      let filteredPatients = result.patients;

      if (request.filters?.city) {
        filteredPatients = filteredPatients.filter(patient =>
          patient.getContactInfo().address.city.toLowerCase().includes(request.filters!.city!.toLowerCase())
        );
      }

      if (request.filters?.province) {
        filteredPatients = filteredPatients.filter(patient =>
          patient.getContactInfo().address.province.toLowerCase().includes(request.filters!.province!.toLowerCase())
        );
      }

      if (request.filters?.hasInsurance !== undefined) {
        filteredPatients = filteredPatients.filter(patient =>
          request.filters!.hasInsurance ? patient.hasValidInsurance() : !patient.hasValidInsurance()
        );
      }

      if (request.filters?.insuranceType) {
        filteredPatients = filteredPatients.filter(patient => {
          const insurance = patient.getInsuranceInfo();
          return insurance?.coverageType === request.filters!.insuranceType;
        });
      }

      // 5. Sort patients (if sorting is provided)
      if (request.pagination?.sorting) {
        const { field, direction } = request.pagination.sorting;
        filteredPatients.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          switch (field) {
            case 'fullName':
              aValue = a.getPersonalInfo().fullName;
              bValue = b.getPersonalInfo().fullName;
              break;
            case 'dateOfBirth':
              aValue = a.getPersonalInfo().dateOfBirth.getTime();
              bValue = b.getPersonalInfo().dateOfBirth.getTime();
              break;
            case 'createdAt':
              aValue = a.getProps().createdAt.getTime();
              bValue = b.getProps().createdAt.getTime();
              break;
            case 'updatedAt':
              aValue = a.getProps().updatedAt.getTime();
              bValue = b.getProps().updatedAt.getTime();
              break;
            default:
              aValue = a.getPersonalInfo().fullName;
              bValue = b.getPersonalInfo().fullName;
          }

          if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      // 6. Map patients to response DTO
      const patientsDTO = filteredPatients.map(patient => {
        const personalInfo = patient.getPersonalInfo();
        const contactInfo = patient.getContactInfo();
        const insuranceInfo = patient.getInsuranceInfo();

        return {
          patientId: patient.getPatientId() || '',
          userId: patient.getUserId(),
          fullName: personalInfo.fullName,
          dateOfBirth: personalInfo.dateOfBirth.toISOString(),
          gender: personalInfo.gender,
          nationalId: personalInfo.nationalId,
          primaryPhone: contactInfo.primaryPhone,
          email: contactInfo.email,
          city: contactInfo.address.city,
          province: contactInfo.address.province, // Province/City level (e.g., "Hồ Chí Minh", "Đồng Nai")
          status: patient.getStatus(),
          hasInsurance: patient.hasValidInsurance(),
          insuranceType: insuranceInfo?.coverageType,
          createdAt: patient.getProps().createdAt.toISOString(),
          updatedAt: patient.getProps().updatedAt.toISOString()
        };
      });

      // 7. Calculate pagination
      const total = filteredPatients.length;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: `Tìm thấy ${total} bệnh nhân`,
        data: {
          patients: patientsDTO,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Tìm kiếm bệnh nhân thất bại',
          errors: [error.message]
        };
      }

      // Handle unexpected errors
      return {
        success: false,
        message: 'Đã xảy ra lỗi không mong muốn',
        errors: ['UNEXPECTED_ERROR']
      };
    }
  }
}

