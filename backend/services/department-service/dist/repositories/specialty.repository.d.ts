import { Specialty, CreateSpecialtyRequest, UpdateSpecialtyRequest, SpecialtyWithDetails, SpecialtySearchFilters, SpecialtyStats } from '../types/department.types';
export declare class SpecialtyRepository {
    findAll(filters?: SpecialtySearchFilters, page?: number, limit?: number): Promise<{
        specialties: SpecialtyWithDetails[];
        total: number;
        totalPages: number;
    }>;
    findById(specialtyId: string): Promise<SpecialtyWithDetails | null>;
    create(specialtyData: CreateSpecialtyRequest): Promise<Specialty>;
    update(specialtyId: string, updateData: UpdateSpecialtyRequest): Promise<Specialty | null>;
    delete(specialtyId: string): Promise<boolean>;
    getStats(): Promise<SpecialtyStats>;
    getByDepartment(departmentId: string): Promise<Specialty[]>;
    getSpecialtyDoctors(specialtyId: string): Promise<any[]>;
    private generateSpecialtyId;
    private generateSpecialtyCode;
}
//# sourceMappingURL=specialty.repository.d.ts.map