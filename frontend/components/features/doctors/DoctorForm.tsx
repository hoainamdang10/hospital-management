'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  FormError
} from '@/components/forms/FormField';
import { doctorSchema, DoctorFormData, validateForm } from '@/lib/validations/schemas';
import { Doctor, Department } from '@/lib/types';
import { useApiForm } from '@/lib/hooks/useApi';
import { doctorsApi } from '@/lib/api/doctors';

interface DoctorFormProps {
  doctor?: Doctor;
  departments: Department[];
  onSuccess?: (doctor: Doctor) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({
  doctor,
  departments,
  onSuccess,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<DoctorFormData>({
    first_name: doctor?.first_name || '',
    last_name: doctor?.last_name || '',
    email: doctor?.email || '',
    phone: doctor?.phone || '',
    specialization: doctor?.specialization || '',
    license_number: doctor?.license_number || '',
    department_id: doctor?.department_id || '',
    bio: doctor?.bio || '',
    experience_years: doctor?.experience_years || undefined,
    consultation_fee: doctor?.consultation_fee || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { submit, isSubmitting, error: submitError } = useApiForm(
    doctor
      ? (data: DoctorFormData) => doctorsApi.update(doctor.id, data)
      : (data: DoctorFormData) => doctorsApi.create(data),
    onSuccess,
    (error) => console.error('Form submission error:', error)
  );

  const handleInputChange = (field: keyof DoctorFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(doctorSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    // Submit form
    const result = await submit(validation.data!);
    if (result) {
      // Form submitted successfully
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialization: '',
        license_number: '',
        department_id: '',
        bio: '',
        experience_years: undefined,
        consultation_fee: undefined,
      });
      setErrors({});
    }
  };

  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  const specializationOptions = [
    { value: 'Tim Mạch Học', label: 'Tim Mạch Học' },
    { value: 'Chấn Thương Chỉnh Hình', label: 'Chấn Thương Chỉnh Hình' },
    { value: 'Nhi Khoa', label: 'Nhi Khoa' },
    { value: 'Thần Kinh Học', label: 'Thần Kinh Học' },
    { value: 'Da Liễu', label: 'Da Liễu' },
    { value: 'Phụ Sản', label: 'Phụ Sản' },
    { value: 'Cấp Cứu', label: 'Cấp Cứu' },
    { value: 'Nội Tổng Hợp', label: 'Nội Tổng Hợp' },
    { value: 'Ngoại Tổng Hợp', label: 'Ngoại Tổng Hợp' },
    { value: 'Nhãn Khoa', label: 'Nhãn Khoa' },
    { value: 'Tai Mũi Họng', label: 'Tai Mũi Họng' },
    { value: 'Tâm Thần', label: 'Tâm Thần' },
    { value: 'Khác', label: 'Khác' },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {doctor ? 'Edit Doctor' : 'Add New Doctor'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="first_name" required>
                First Name
              </FormLabel>
              <FormInput
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                error={errors.first_name}
                placeholder="Enter first name"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.first_name} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="last_name" required>
                Last Name
              </FormLabel>
              <FormInput
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                error={errors.last_name}
                placeholder="Enter last name"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.last_name} />
            </FormField>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="email" required>
                Email
              </FormLabel>
              <FormInput
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                placeholder="Enter email address"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.email} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="phone">
                Phone
              </FormLabel>
              <FormInput
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={errors.phone}
                placeholder="Enter phone number"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.phone} />
            </FormField>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="specialization" required>
                Specialization
              </FormLabel>
              <FormSelect
                id="specialization"
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                options={specializationOptions}
                error={errors.specialization}
                placeholder="Select specialization"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.specialization} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="license_number" required>
                License Number
              </FormLabel>
              <FormInput
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                error={errors.license_number}
                placeholder="Enter license number"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.license_number} />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="department_id" required>
              Department
            </FormLabel>
            <FormSelect
              id="department_id"
              value={formData.department_id}
              onChange={(e) => handleInputChange('department_id', e.target.value)}
              options={departmentOptions}
              error={errors.department_id}
              placeholder="Select department"
              disabled={isLoading || isSubmitting}
            />
            <FormError message={errors.department_id} />
          </FormField>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="experience_years">
                Experience (Years)
              </FormLabel>
              <FormInput
                id="experience_years"
                type="number"
                min="0"
                max="50"
                value={formData.experience_years || ''}
                onChange={(e) => handleInputChange('experience_years', e.target.value ? parseInt(e.target.value) : undefined)}
                error={errors.experience_years}
                placeholder="Years of experience"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.experience_years} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="consultation_fee">
                Consultation Fee (VND)
              </FormLabel>
              <FormInput
                id="consultation_fee"
                type="number"
                min="0"
                value={formData.consultation_fee || ''}
                onChange={(e) => handleInputChange('consultation_fee', e.target.value ? parseFloat(e.target.value) : undefined)}
                error={errors.consultation_fee}
                placeholder="Consultation fee"
                disabled={isLoading || isSubmitting}
              />
              <FormError message={errors.consultation_fee} />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="bio">
              Biography
            </FormLabel>
            <FormTextarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              error={errors.bio}
              placeholder="Enter doctor's biography"
              rows={4}
              disabled={isLoading || isSubmitting}
            />
            <FormError message={errors.bio} />
          </FormField>

          {/* Submit Error */}
          {submitError && (
            <FormError message={submitError} className="text-center" />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : doctor ? 'Update Doctor' : 'Add Doctor'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
