import { BaseRepository } from '@hospital/shared/dist/repositories/base-repository';
export interface Doctor {
    doctor_id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone_number: string;
    specialization: string;
    license_number: string;
    department_id: string;
    years_of_experience: number;
    education: string;
    certifications: string[];
    languages_spoken: string[];
    consultation_fee: number;
    is_available: boolean;
    status: 'active' | 'inactive' | 'suspended';
    created_at: string;
    updated_at: string;
}
export interface DoctorSearchFilters {
    specialization?: string;
    department_id?: string;
    is_available?: boolean;
    status?: string;
    min_experience?: number;
    max_consultation_fee?: number;
    languages?: string[];
}
export interface DoctorWithProfile extends Doctor {
    profile?: {
        id: string;
        email: string;
        full_name: string;
        phone_number: string;
        is_active: boolean;
    };
}
export declare class DoctorRepositoryV2 extends BaseRepository<Doctor> {
    constructor();
    findById(doctorId: string): Promise<Doctor | null>;
    findAll(limit?: number, offset?: number): Promise<Doctor[]>;
    searchDoctors(filters: DoctorSearchFilters, limit?: number, offset?: number): Promise<{
        doctors: Doctor[];
        total: number;
    }>;
    create(doctorData: Partial<Doctor>): Promise<Doctor>;
    update(doctorId: string, updateData: Partial<Doctor>): Promise<Doctor | null>;
    delete(doctorId: string): Promise<boolean>;
    findByProfileId(profileId: string): Promise<Doctor | null>;
    getDoctorAvailability(doctorId: string): Promise<{
        isAvailable: boolean;
        nextAvailableSlot?: string;
        currentAppointments: number;
    }>;
    private validateDoctorData;
    private generateDoctorId;
    private getNextDoctorSequence;
    private mapSupabaseDoctorToDoctor;
}
export default DoctorRepositoryV2;
//# sourceMappingURL=doctor-repository-v2.d.ts.map