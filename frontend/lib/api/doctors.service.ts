import apiClient from './axios';

export interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialtyId: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  avatar: string;
  experience: number;
  locations: string[];
}

export interface DoctorOption {
  id: string;
  fullName: string;
  department?: string;
  specialization?: string;
}

export async function getDoctors(params?: { department?: string }): Promise<{ data: DoctorOption[] }> {
  try {
    const res = await apiClient.get('/v1/staff/search', {
      params: {
        staffType: 'doctor',
        isActive: true,
        limit: 50,
        departmentCode: params?.department,
      },
    });
    const data = res.data?.data?.items?.map((d: any) => ({
      id: d.staffId || d.id,
      fullName: d.personalInfo?.fullName ?? 'Chưa có tên',
      department: d.professionalInfo?.department,
      specialization:
        Array.isArray(d.specializations) && d.specializations.length > 0
          ? typeof d.specializations[0] === 'string'
            ? d.specializations[0]
            : d.specializations[0]?.name
          : undefined,
    })) ?? [];
    return { data };
  } catch (error) {
    console.error('Failed to fetch doctors', error);
    return { data: [] };
  }
}

export async function getFeaturedDoctors(): Promise<Doctor[]> {
  try {
    const res = await apiClient.get('/v1/staff/search', {
      params: { staffType: 'doctor', isActive: true, limit: 6 },
    });

    return (
      res.data?.data?.items?.map((d: any) => {
        const specialization = Array.isArray(d.specializations) && d.specializations.length > 0
          ? (typeof d.specializations[0] === 'string' ? d.specializations[0] : d.specializations[0]?.name)
          : 'Đa khoa';

        // Map specialization name to ID if possible, or use a default
        // This is a simplified mapping, ideally should match with specialties.json IDs
        const specialtyId = mapSpecialtyToId(specialization);

        return {
          id: d.staffId || d.id,
          name: d.personalInfo?.fullName ?? 'Bác sĩ',
          degree: d.professionalInfo?.title ?? 'Bác sĩ',
          specialtyId: specialtyId,
          hospital: 'Hospital V2', // Hardcoded for now
          rating: 4.8, // Mock data as it's not in API
          reviewCount: Math.floor(Math.random() * 100) + 20, // Mock data
          priceFrom: d.consultationFee ?? 300000,
          avatar: d.personalInfo?.gender === 'female'
            ? 'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg'
            : 'https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg',
          experience: d.yearsOfExperience ?? 5,
          locations: ['TP. Hồ Chí Minh'],
        };
      }) ?? []
    );
  } catch (error) {
    console.error('Failed to fetch featured doctors', error);
    return [];
  }
}

function mapSpecialtyToId(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('nhi')) return 'pediatrics';
  if (lower.includes('da liễu')) return 'dermatology';
  if (lower.includes('tim')) return 'cardiology';
  if (lower.includes('xương')) return 'orthopedics';
  if (lower.includes('nha') || lower.includes('răng')) return 'dental';
  if (lower.includes('mắt')) return 'ophthalmology';
  if (lower.includes('tai') || lower.includes('họng')) return 'ent';
  if (lower.includes('sản') || lower.includes('phụ')) return 'gynecology';
  if (lower.includes('thần kinh')) return 'neurology';
  return 'general';
}

export const doctorsService = {
  getDoctors,
  getFeaturedDoctors,
};
