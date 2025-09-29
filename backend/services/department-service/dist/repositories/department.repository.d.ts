import { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentWithDetails, DepartmentSearchFilters, DepartmentStats } from '../types/department.types';
export declare class DepartmentRepository {
    findAll(filters?: DepartmentSearchFilters, page?: number, limit?: number): Promise<{
        departments: DepartmentWithDetails[];
        total: number;
        totalPages: number;
    }>;
    findById(departmentId: string): Promise<DepartmentWithDetails | null>;
    create(departmentData: CreateDepartmentRequest): Promise<Department>;
    update(departmentId: string, updateData: UpdateDepartmentRequest): Promise<Department | null>;
    delete(departmentId: string): Promise<boolean>;
    getStats(): Promise<DepartmentStats>;
    getSubDepartments(parentDepartmentId: string): Promise<Department[]>;
    getDepartmentDoctors(departmentId: string): Promise<any[]>;
    getDepartmentRooms(departmentId: string): Promise<any[]>;
    getDepartmentTree(): Promise<any[]>;
    getChildDepartments(parentId: string): Promise<Department[]>;
    getDepartmentPath(departmentId: string): Promise<Department[]>;
    private buildDepartmentTree;
    private generateDepartmentId;
}
//# sourceMappingURL=department.repository.d.ts.map