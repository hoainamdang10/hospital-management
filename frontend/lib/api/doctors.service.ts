import apiClient from './axios';

export interface DoctorOption {
  id: string;
  fullName: string;
  department?: string;
  specialization?: string;
}

export async function getDoctors(): Promise<DoctorOption[]> {
  try {
    const res = await apiClient.get('/v1/staff/search', {
      params: { staffType: 'doctor', isActive: true, limit: 50 },
    });
    return (
      res.data?.data?.items?.map((d: any) => ({
        id: d.staffId || d.id,
        fullName: d.personalInfo?.fullName ?? 'Chưa có tên',
        department: d.professionalInfo?.department,
        specialization:
          Array.isArray(d.specializations) && d.specializations.length > 0
            ? typeof d.specializations[0] === 'string'
              ? d.specializations[0]
              : d.specializations[0]?.name
            : undefined,
      })) ?? []
    );
  } catch (error) {
    console.error('Failed to fetch doctors', error);
    return [];
  }
}

export const doctorsService = {
  getDoctors,
};
