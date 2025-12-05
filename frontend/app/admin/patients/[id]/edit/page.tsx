'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '@/lib/api/patient.service';

type GenderValue = 'male' | 'female' | 'other' | '';
type ContactMethodValue = 'PHONE' | 'EMAIL' | 'SMS';

type FormState = {
  fullName: string;
  dateOfBirth: string;
  gender: GenderValue;
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  postalCode: string;
  preferredContactMethod: ContactMethodValue;
};

const genderOptions: { label: string; value: GenderValue }[] = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
];

const contactMethodOptions: { label: string; value: ContactMethodValue }[] = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'Điện thoại', value: 'PHONE' },
];

const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyForm: FormState = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  phone: '',
  email: '',
  address: '',
  ward: '',
  district: '',
  city: '',
  postalCode: '',
  preferredContactMethod: 'EMAIL',
};

function extractAddressParts(addressSource: any) {
  if (!addressSource) {
    return { street: '', ward: '', district: '', city: '', postalCode: '' };
  }
  if (typeof addressSource === 'string') {
    return { street: addressSource, ward: '', district: '', city: '', postalCode: '' };
  }

  return {
    street:
      addressSource.street ||
      addressSource.addressLine ||
      addressSource.address ||
      addressSource.line1 ||
      '',
    ward: addressSource.ward || addressSource.wardName || '',
    district: addressSource.district || addressSource.districtName || '',
    city:
      addressSource.city ||
      addressSource.cityName ||
      addressSource.province ||
      addressSource.state ||
      '',
    postalCode: addressSource.postalCode || addressSource.zip || '',
  };
}

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const patientId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return '';
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatient = useCallback(async () => {
    if (!patientId) {
      toast.error('Không tìm thấy mã bệnh nhân');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data: any = await patientService.getPatientProfile(patientId);
      const personal = data?.personalInfo || data?.personal_info || {};
      const contact = data?.contactInfo || data?.contact_info || {};
      const addressSource =
        contact?.address ||
        contact?.addressInfo ||
        contact?.address_info ||
        data?.address ||
        data?.primaryAddress;
      const addressParts = extractAddressParts(addressSource);

      const rawGender = (data?.gender || personal?.gender || '')
        .toString()
        .toLowerCase() as GenderValue;
      const normalizedGender: GenderValue = ['male', 'female', 'other'].includes(rawGender)
        ? rawGender
        : '';

      const rawPreferred = (
        contact?.preferredContactMethod ||
        contact?.contactPreferences?.preferredMethod ||
        data?.preferredContactMethod ||
        'EMAIL'
      )
        .toString()
        .toUpperCase() as ContactMethodValue;
      const normalizedPreferred: ContactMethodValue = (['EMAIL', 'SMS', 'PHONE'] as const).includes(
        rawPreferred
      )
        ? rawPreferred
        : 'EMAIL';

      const rawBloodType = (data?.bloodType || personal?.bloodType || '').toUpperCase();
      const normalizedBloodType = bloodTypeOptions.includes(rawBloodType) ? rawBloodType : '';

      setForm({
        fullName:
          data?.fullName ||
          personal?.fullName ||
          `${personal?.lastName || ''} ${personal?.firstName || ''}`.trim(),
        dateOfBirth: personal?.dateOfBirth || data?.dateOfBirth || '',
        gender: normalizedGender,
        bloodType: normalizedBloodType,
        phone:
          data?.phoneNumber ||
          contact?.primaryPhone ||
          contact?.primary_phone ||
          contact?.phoneNumber ||
          '',
        email: data?.email || contact?.email || '',
        address: addressParts.street,
        ward: addressParts.ward,
        district: addressParts.district,
        city: addressParts.city,
        postalCode: addressParts.postalCode,
        preferredContactMethod: normalizedPreferred,
      });
    } catch (error) {
      console.error('Failed to load patient profile', error);
      toast.error('Không thể tải thông tin bệnh nhân');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void fetchPatient();
  }, [fetchPatient]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!patientId) {
      toast.error('Thiếu mã bệnh nhân');
      return;
    }
    const payload: any = {};
    if (form.fullName?.trim()) payload.fullName = form.fullName.trim();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.gender) payload.gender = form.gender;
    if (form.bloodType) payload.bloodType = form.bloodType;
    if (form.phone) payload.primaryPhone = form.phone;
    if (form.email) payload.email = form.email;
    if (form.preferredContactMethod) {
      payload.preferredContactMethod = form.preferredContactMethod.toLowerCase();
    }
    const addressPayload: Record<string, string> = {};
    if (form.address) addressPayload.street = form.address;
    if (form.ward) addressPayload.ward = form.ward;
    if (form.district) addressPayload.district = form.district;
    if (form.city) {
      addressPayload.city = form.city;
      addressPayload.province = form.city;
    }
    if (form.postalCode) addressPayload.postalCode = form.postalCode;
    if (Object.keys(addressPayload).length > 0) {
      addressPayload.country = 'Việt Nam';
      payload.address = addressPayload;
    }

    try {
      setIsSubmitting(true);
      await patientService.updatePatientProfile(patientId, payload);
      toast.success('Đã cập nhật hồ sơ bệnh nhân');
      router.push(`/admin/patients/${patientId}`);
    } catch (error: any) {
      console.error('Update patient failed', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Thông tin cá nhân</h2>
          <p className="text-sm text-slate-500">
            Cập nhật thông tin định danh của bệnh nhân trong hồ sơ điện tử
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => updateForm('fullName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ngày sinh</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateForm('dateOfBirth', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Giới tính</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              value={form.gender}
              onChange={(e) => updateForm('gender', e.target.value as FormState['gender'])}
            >
              <option value="">Chọn giới tính</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nhóm máu</label>
            <select
              value={form.bloodType}
              onChange={(e) => updateForm('bloodType', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            >
              <option value="">Chọn nhóm máu</option>
              {bloodTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Thông tin liên hệ</h2>
          <p className="text-sm text-slate-500">
            Sử dụng để gửi thông báo và liên lạc về lịch hẹn điều trị
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              placeholder="0901 234 567"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              placeholder="patient@hospital.vn"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phương thức liên hệ ưu tiên
            </label>
            <select
              value={form.preferredContactMethod}
              onChange={(e) =>
                updateForm(
                  'preferredContactMethod',
                  e.target.value as FormState['preferredContactMethod']
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            >
              {contactMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Địa chỉ cư trú</h2>
          <p className="text-sm text-slate-500">Phục vụ cho vận chuyển hồ sơ và thống kê khu vực</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Địa chỉ</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateForm('address', e.target.value)}
              placeholder="Số nhà, đường..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Phường/Xã</label>
            <input
              type="text"
              value={form.ward}
              onChange={(e) => updateForm('ward', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Quận/Huyện</label>
            <input
              type="text"
              value={form.district}
              onChange={(e) => updateForm('district', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tỉnh/Thành</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateForm('city', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Mã bưu chính</label>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => updateForm('postalCode', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={`/admin/patients/${patientId}`}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Hủy bỏ
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/patients/${patientId}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm font-medium text-slate-500">Quản trị viên</p>
              <h1 className="text-2xl font-bold text-slate-900">Cập nhật hồ sơ bệnh nhân</h1>
              <p className="text-sm text-slate-500">
                Mã hồ sơ: <span className="font-semibold text-slate-900">{patientId}</span>
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
              <p>Đang tải dữ liệu bệnh nhân...</p>
            </div>
          </div>
        ) : (
          renderForm()
        )}
      </div>
    </DashboardLayout>
  );
}
