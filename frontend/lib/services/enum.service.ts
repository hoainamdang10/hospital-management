// =====================================================
// ENUM SERVICE - VIETNAMESE ONLY VERSION
// =====================================================
// Phiên bản đơn giản chỉ sử dụng tiếng Việt

import { supabaseClient } from '@/lib/supabase-client';
import {
  EnumOption,
  Specialty,
  DepartmentEnum,
  RoomType,
  Diagnosis,
  Medication,
  StatusValue,
  PaymentMethod,
  BaseEnum,
  getEnumDisplayName,
  enumToOption
} from '@/lib/types/enum.types';

class EnumService {
  // =====================================================
  // DIRECT TABLE ACCESS METHODS
  // =====================================================

  async getSpecialties(): Promise<Specialty[]> {
    try {
      const { data, error } = await supabaseClient
        .from('specialties')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching specialties:', error);
      throw error;
    }
  }

  async getDepartments(): Promise<DepartmentEnum[]> {
    try {
      const { data, error } = await supabaseClient
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('department_name');

      if (error) throw error;

      // Convert departments to enum format
      // Note: departments table has different structure than other enum tables
      const convertedData = data?.map(dept => ({
        id: parseInt(dept.department_id.replace('DEPT', '')) || 0, // Convert DEPT001 to 1
        code: dept.department_id, // Use department_id as code (DEPT001, DEPT002, etc.)
        name: dept.department_name, // ✅ FIXED: Use department_name instead of name
        description: dept.description,
        color_code: '#3498db', // Default color for departments
        icon_name: 'building-2', // Default icon for departments
        sort_order: parseInt(dept.department_id.replace('DEPT', '')) || 0,
        is_active: dept.is_active,
        created_at: dept.created_at,
        updated_at: dept.updated_at
      })) || [];

      return convertedData;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getRoomTypes(): Promise<RoomType[]> {
    try {
      const { data, error } = await supabaseClient
        .from('room_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching room types:', error);
      throw error;
    }
  }

  async getDiagnoses(): Promise<Diagnosis[]> {
    try {
      const { data, error } = await supabaseClient
        .from('diagnosis')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      throw error;
    }
  }

  async getMedications(): Promise<Medication[]> {
    try {
      const { data, error } = await supabaseClient
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  }

  async getStatusValues(): Promise<StatusValue[]> {
    try {
      const { data, error } = await supabaseClient
        .from('status_values')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching status values:', error);
      throw error;
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabaseClient
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILITY METHODS - CONVERT TO OPTIONS (Vietnamese only)
  // =====================================================

  private convertToOptions(items: BaseEnum[]): EnumOption[] {
    return items.map(item => enumToOption(item));
  }

  async getSpecialtyOptions(): Promise<EnumOption[]> {
    const specialties = await this.getSpecialties();
    return this.convertToOptions(specialties);
  }

  async getDepartmentOptions(): Promise<EnumOption[]> {
    const departments = await this.getDepartments();
    return this.convertToOptions(departments);
  }

  async getRoomTypeOptions(): Promise<EnumOption[]> {
    const roomTypes = await this.getRoomTypes();
    return this.convertToOptions(roomTypes);
  }

  async getDiagnosisOptions(): Promise<EnumOption[]> {
    const diagnoses = await this.getDiagnoses();
    return this.convertToOptions(diagnoses);
  }

  async getMedicationOptions(): Promise<EnumOption[]> {
    const medications = await this.getMedications();
    return this.convertToOptions(medications);
  }

  async getStatusOptions(appliesTo?: string): Promise<EnumOption[]> {
    const statusValues = await this.getStatusValues();
    let filtered = statusValues;

    if (appliesTo) {
      filtered = statusValues.filter(item =>
        !item.applies_to || item.applies_to === appliesTo
      );
    }

    return this.convertToOptions(filtered);
  }

  async getPaymentMethodOptions(): Promise<EnumOption[]> {
    const paymentMethods = await this.getPaymentMethods();
    return this.convertToOptions(paymentMethods);
  }

}

// Export singleton instance
export const enumService = new EnumService();
