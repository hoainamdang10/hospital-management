/**
 * Appointment ID Value Object - Domain Layer
 * Healthcare appointment identifier with Vietnamese healthcare standards
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Appointment Management
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  SURGERY = 'surgery',
  EMERGENCY = 'emergency',
  DIAGNOSTIC = 'diagnostic',
  THERAPY = 'therapy',
  VACCINATION = 'vaccination',
  HEALTH_CHECK = 'health_check'
}

export enum AppointmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export interface AppointmentIdProps {
  value: string;
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  department: string;
}

/**
 * Appointment ID Value Object
 * Format: {TYPE}-{DEPT}-{YYYYMM}-{SEQUENCE}
 * Example: CONS-CARD-202412-001, SURG-ORTH-202412-015
 */
export class AppointmentId extends HealthcareValueObject<AppointmentIdProps> {
  
  private constructor(props: AppointmentIdProps) {
    super(props);
  }

  /**
   * Create new appointment ID
   */
  public static create(
    appointmentType: AppointmentType,
    department: string,
    priority: AppointmentPriority = AppointmentPriority.NORMAL,
    customId?: string
  ): AppointmentId {
    if (customId) {
      return new AppointmentId({
        value: customId,
        appointmentType,
        priority,
        department
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 999) + 1;
    
    const typeCode = AppointmentId.getTypeCode(appointmentType);
    const departmentCode = department.substring(0, 4).toUpperCase();
    const id = `${typeCode}-${departmentCode}-${year}${month}-${sequence.toString().padStart(3, '0')}`;
    
    return new AppointmentId({
      value: id,
      appointmentType,
      priority,
      department
    });
  }

  /**
   * Create from string
   */
  public static fromString(appointmentId: string): AppointmentId {
    const parts = appointmentId.split('-');
    if (parts.length !== 4) {
      throw new Error(`ID cuộc hẹn không đúng định dạng: ${appointmentId}`);
    }

    const [typeCode, departmentCode, yearMonth, sequence] = parts;
    
    // Validate format
    if (!/^[A-Z]{4}$/.test(typeCode)) {
      throw new Error(`Mã loại cuộc hẹn không hợp lệ: ${typeCode}`);
    }

    if (!/^[A-Z]{4}$/.test(departmentCode)) {
      throw new Error(`Mã khoa không hợp lệ: ${departmentCode}`);
    }

    if (!/^\d{6}$/.test(yearMonth)) {
      throw new Error(`Mã thời gian không hợp lệ: ${yearMonth}`);
    }

    if (!/^\d{3}$/.test(sequence)) {
      throw new Error(`Số thứ tự không hợp lệ: ${sequence}`);
    }

    const appointmentType = AppointmentId.getTypeFromCode(typeCode);
    const department = departmentCode; // Would map to full department name in real system

    return new AppointmentId({
      value: appointmentId,
      appointmentType,
      priority: AppointmentPriority.NORMAL, // Default, would be determined from context
      department
    });
  }

  /**
   * Getters
   */
  get value(): string {
    return this.props.value;
  }

  get appointmentType(): AppointmentType {
    return this.props.appointmentType;
  }

  get priority(): AppointmentPriority {
    return this.props.priority;
  }

  get department(): string {
    return this.props.department;
  }

  /**
   * Get appointment type in Vietnamese
   */
  public getAppointmentTypeVietnamese(): string {
    const typeMap = {
      [AppointmentType.CONSULTATION]: 'Khám bệnh',
      [AppointmentType.FOLLOW_UP]: 'Tái khám',
      [AppointmentType.SURGERY]: 'Phẫu thuật',
      [AppointmentType.EMERGENCY]: 'Cấp cứu',
      [AppointmentType.DIAGNOSTIC]: 'Chẩn đoán',
      [AppointmentType.THERAPY]: 'Điều trị',
      [AppointmentType.VACCINATION]: 'Tiêm chủng',
      [AppointmentType.HEALTH_CHECK]: 'Khám sức khỏe'
    };

    return typeMap[this.props.appointmentType] || this.props.appointmentType;
  }

  /**
   * Get priority in Vietnamese
   */
  public getPriorityVietnamese(): string {
    const priorityMap = {
      [AppointmentPriority.LOW]: 'Thấp',
      [AppointmentPriority.NORMAL]: 'Bình thường',
      [AppointmentPriority.HIGH]: 'Cao',
      [AppointmentPriority.URGENT]: 'Khẩn cấp',
      [AppointmentPriority.EMERGENCY]: 'Cấp cứu'
    };

    return priorityMap[this.props.priority] || this.props.priority;
  }

  /**
   * Get department name in Vietnamese
   */
  public getDepartmentNameVietnamese(): string {
    const departmentMap: { [key: string]: string } = {
      'CARD': 'Khoa Tim mạch',
      'NEUR': 'Khoa Thần kinh',
      'ORTH': 'Khoa Chấn thương Chỉnh hình',
      'PEDI': 'Khoa Nhi',
      'INTE': 'Khoa Nội',
      'SURG': 'Khoa Phẫu thuật',
      'OBGY': 'Khoa Sản phụ khoa',
      'EMER': 'Khoa Cấp cứu',
      'RADI': 'Khoa Chẩn đoán hình ảnh',
      'ANES': 'Khoa Gây mê hồi sức',
      'PSYC': 'Khoa Tâm thần',
      'DERM': 'Khoa Da liễu',
      'OPHT': 'Khoa Mắt',
      'ENT': 'Khoa Tai mũi họng',
      'UROL': 'Khoa Tiết niệu'
    };

    return departmentMap[this.props.department] || this.props.department;
  }

  /**
   * Check if appointment is emergency
   */
  public isEmergency(): boolean {
    return this.props.appointmentType === AppointmentType.EMERGENCY ||
           this.props.priority === AppointmentPriority.EMERGENCY;
  }

  /**
   * Check if appointment is urgent
   */
  public isUrgent(): boolean {
    return this.props.priority === AppointmentPriority.URGENT ||
           this.props.priority === AppointmentPriority.EMERGENCY;
  }

  /**
   * Check if appointment requires surgery
   */
  public requiresSurgery(): boolean {
    return this.props.appointmentType === AppointmentType.SURGERY;
  }

  /**
   * Get estimated duration based on appointment type
   */
  public getEstimatedDurationMinutes(): number {
    const durationMap = {
      [AppointmentType.CONSULTATION]: 30,
      [AppointmentType.FOLLOW_UP]: 15,
      [AppointmentType.SURGERY]: 120,
      [AppointmentType.EMERGENCY]: 60,
      [AppointmentType.DIAGNOSTIC]: 45,
      [AppointmentType.THERAPY]: 60,
      [AppointmentType.VACCINATION]: 10,
      [AppointmentType.HEALTH_CHECK]: 45
    };

    return durationMap[this.props.appointmentType] || 30;
  }

  /**
   * Get required preparation time
   */
  public getPreparationTimeMinutes(): number {
    const preparationMap = {
      [AppointmentType.CONSULTATION]: 5,
      [AppointmentType.FOLLOW_UP]: 5,
      [AppointmentType.SURGERY]: 30,
      [AppointmentType.EMERGENCY]: 0,
      [AppointmentType.DIAGNOSTIC]: 10,
      [AppointmentType.THERAPY]: 10,
      [AppointmentType.VACCINATION]: 5,
      [AppointmentType.HEALTH_CHECK]: 10
    };

    return preparationMap[this.props.appointmentType] || 5;
  }

  /**
   * Check if appointment can be scheduled online
   */
  public canScheduleOnline(): boolean {
    const onlineSchedulableTypes = [
      AppointmentType.CONSULTATION,
      AppointmentType.FOLLOW_UP,
      AppointmentType.HEALTH_CHECK,
      AppointmentType.VACCINATION
    ];

    return onlineSchedulableTypes.includes(this.props.appointmentType) &&
           this.props.priority !== AppointmentPriority.EMERGENCY;
  }

  /**
   * Get scheduling restrictions
   */
  public getSchedulingRestrictions(): string[] {
    const restrictions: string[] = [];

    if (this.requiresSurgery()) {
      restrictions.push('Cần xác nhận từ bác sĩ phẫu thuật');
      restrictions.push('Cần chuẩn bị trước phẫu thuật');
      restrictions.push('Chỉ lên lịch trong giờ hành chính');
    }

    if (this.isEmergency()) {
      restrictions.push('Ưu tiên cao nhất');
      restrictions.push('Có thể thay đổi lịch khác');
      restrictions.push('Cần sẵn sàng 24/7');
    }

    if (this.props.appointmentType === AppointmentType.DIAGNOSTIC) {
      restrictions.push('Cần chuẩn bị theo yêu cầu');
      restrictions.push('Có thể cần nhịn ăn');
    }

    return restrictions;
  }

  /**
   * Private helper methods
   */

  private static getTypeCode(appointmentType: AppointmentType): string {
    const typeCodeMap = {
      [AppointmentType.CONSULTATION]: 'CONS',
      [AppointmentType.FOLLOW_UP]: 'FOLL',
      [AppointmentType.SURGERY]: 'SURG',
      [AppointmentType.EMERGENCY]: 'EMER',
      [AppointmentType.DIAGNOSTIC]: 'DIAG',
      [AppointmentType.THERAPY]: 'THER',
      [AppointmentType.VACCINATION]: 'VACC',
      [AppointmentType.HEALTH_CHECK]: 'HEAL'
    };

    return typeCodeMap[appointmentType] || 'CONS';
  }

  private static getTypeFromCode(typeCode: string): AppointmentType {
    const codeTypeMap = {
      'CONS': AppointmentType.CONSULTATION,
      'FOLL': AppointmentType.FOLLOW_UP,
      'SURG': AppointmentType.SURGERY,
      'EMER': AppointmentType.EMERGENCY,
      'DIAG': AppointmentType.DIAGNOSTIC,
      'THER': AppointmentType.THERAPY,
      'VACC': AppointmentType.VACCINATION,
      'HEAL': AppointmentType.HEALTH_CHECK
    };

    return codeTypeMap[typeCode] || AppointmentType.CONSULTATION;
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('ID cuộc hẹn không được để trống');
    }

    // Validate format: TYPE-DEPT-YYYYMM-XXX
    const pattern = /^[A-Z]{4}-[A-Z]{4}-\d{6}-\d{3}$/;
    if (!pattern.test(this.props.value)) {
      throw new Error(`ID cuộc hẹn không đúng định dạng: ${this.props.value}`);
    }

    if (!this.props.appointmentType) {
      throw new Error('Loại cuộc hẹn không được để trống');
    }

    if (!this.props.department || this.props.department.trim().length === 0) {
      throw new Error('Khoa không được để trống');
    }
  }

  /**
   * Contains PHI - Appointment ID may contain PHI
   */
  containsPHI(): boolean {
    return false; // Appointment ID itself doesn't contain PHI
  }

  /**
   * String representation
   */
  toString(): string {
    return this.props.value;
  }

  /**
   * Equals comparison
   */
  equals(other: AppointmentId): boolean {
    return this.props.value === other.props.value;
  }
}
