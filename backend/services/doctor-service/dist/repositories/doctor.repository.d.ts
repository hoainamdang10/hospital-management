import { Doctor, CreateDoctorRequest, UpdateDoctorRequest, DoctorSearchQuery } from '@hospital/shared/dist/types/doctor.types';
export declare class DoctorRepository {
    findById(doctor_id: string): Promise<Doctor | null>;
    findByProfileId(profileId: string): Promise<Doctor | null>;
    findByEmail(email: string): Promise<Doctor | null>;
    findAll(limit?: number, offset?: number): Promise<Doctor[]>;
    findByDepartment(departmentId: string, limit?: number, offset?: number): Promise<Doctor[]>;
    findByDepartmentWithCount(departmentId: string, limit?: number, offset?: number): Promise<{
        doctors: Doctor[];
        total: number;
    }>;
    findBySpecialty(specialty: string, limit?: number, offset?: number): Promise<Doctor[]>;
    search(query: DoctorSearchQuery, limit?: number, offset?: number): Promise<Doctor[]>;
    getSearchCount(query: DoctorSearchQuery): Promise<number>;
    create(doctorData: CreateDoctorRequest): Promise<Doctor>;
    update(doctor_id: string, doctorData: UpdateDoctorRequest): Promise<Doctor | null>;
    delete(doctor_id: string): Promise<boolean>;
    count(): Promise<number>;
    getDashboardStats(doctor_id: string): Promise<any>;
    getRecentAppointments(doctor_id: string, limit?: number): Promise<any[]>;
    getWeeklyStats(doctor_id: string): Promise<any>;
    getMonthlyStats(doctor_id: string): Promise<any>;
    countByDepartment(departmentId: string): Promise<number>;
    private mapSupabaseDoctorToDoctor;
}
//# sourceMappingURL=doctor.repository.d.ts.map