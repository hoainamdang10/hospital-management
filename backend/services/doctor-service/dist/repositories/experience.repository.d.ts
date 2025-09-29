import { DoctorExperience, CreateExperienceRequest } from '@hospital/shared/dist/types/doctor.types';
export declare class ExperienceRepository {
    private supabase;
    constructor();
    findByDoctorId(doctor_id: string): Promise<DoctorExperience[]>;
    findById(experienceId: string): Promise<DoctorExperience | null>;
    findByType(doctor_id: string, experienceType: 'work' | 'education' | 'certification' | 'research'): Promise<DoctorExperience[]>;
    findCurrent(doctor_id: string): Promise<DoctorExperience[]>;
    create(experienceData: CreateExperienceRequest): Promise<DoctorExperience>;
    update(experienceId: string, experienceData: Partial<CreateExperienceRequest>): Promise<DoctorExperience | null>;
    delete(experienceId: string): Promise<boolean>;
    getWorkExperience(doctor_id: string): Promise<DoctorExperience[]>;
    getEducation(doctor_id: string): Promise<DoctorExperience[]>;
    getCertifications(doctor_id: string): Promise<DoctorExperience[]>;
    getResearch(doctor_id: string): Promise<DoctorExperience[]>;
    calculateTotalExperience(doctor_id: string): Promise<{
        total_years: number;
        work_years: number;
        education_years: number;
        current_positions: DoctorExperience[];
    }>;
    getExperienceTimeline(doctor_id: string): Promise<DoctorExperience[]>;
    searchExperiences(doctor_id: string, searchTerm: string): Promise<DoctorExperience[]>;
    getExperiencesByDateRange(doctor_id: string, startDate: Date, endDate: Date): Promise<DoctorExperience[]>;
    private updateCurrentStatus;
    private mapSupabaseExperienceToExperience;
}
//# sourceMappingURL=experience.repository.d.ts.map