import { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentWithDetails, DepartmentFilters, DepartmentStats, PaginationParams } from '../types/admin.types';
export declare class DepartmentRepository {
    findAll(filters: DepartmentFilters | undefined, pagination: PaginationParams): Promise<{
        departments: DepartmentWithDetails[];
        total: number;
        totalPages: number;
    }>;
    findById(departmentId: string): Promise<DepartmentWithDetails | null>;
    getStats(): Promise<DepartmentStats>;
    create(departmentData: CreateDepartmentRequest): Promise<Department>;
    update(departmentId: string, updateData: UpdateDepartmentRequest): Promise<Department | null>;
    delete(departmentId: string): Promise<boolean>;
    getDepartmentTree(): Promise<DepartmentWithDetails[]>;
    getChildDepartments(parentId: string): Promise<Department[]>;
    getDepartmentDoctors(departmentId: string): Promise<any[]>;
    getDepartmentRooms(departmentId: string): Promise<any[]>;
    private generateDepartmentId;
    private buildDepartmentTree;
}
//# sourceMappingURL=department.repository.d.ts.map