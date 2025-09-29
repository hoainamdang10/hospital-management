/**
 * Contact Info Value Object - Domain Layer
 * Vietnamese healthcare contact information with validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export interface ContactInfoProps {
  phone?: string;
  email?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
}

export interface Address {
  street: string;
  ward: string;
  district: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

/**
 * Contact Information Value Object
 * Contains patient's contact and address information
 */
export class ContactInfo extends HealthcareValueObject<ContactInfoProps> {
  private constructor(props: ContactInfoProps) {
    super(props);
  }

  /**
   * Create Contact Info
   */
  public static create(
    phone?: string,
    email?: string,
    address?: Address,
    emergencyContact?: EmergencyContact
  ): ContactInfo {
    return new ContactInfo({
      phone: phone?.trim(),
      email: email?.trim().toLowerCase(),
      address,
      emergencyContact
    });
  }

  /**
   * Getters
   */
  get phone(): string | undefined {
    return this.props.phone;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get address(): Address | undefined {
    return this.props.address;
  }

  get emergencyContact(): EmergencyContact | undefined {
    return this.props.emergencyContact;
  }

  /**
   * Check if has any contact method
   */
  get hasContactMethod(): boolean {
    return !!(this.props.phone || this.props.email);
  }

  /**
   * Check if has complete address
   */
  get hasCompleteAddress(): boolean {
    return !!(this.props.address && 
             this.props.address.street &&
             this.props.address.ward &&
             this.props.address.district &&
             this.props.address.city &&
             this.props.address.province);
  }

  /**
   * Get formatted address
   */
  get formattedAddress(): string {
    if (!this.props.address) return '';

    const parts = [
      this.props.address.street,
      this.props.address.ward,
      this.props.address.district,
      this.props.address.city,
      this.props.address.province,
      this.props.address.country
    ].filter(part => part && part.trim().length > 0);

    return parts.join(', ');
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    // Validate phone if provided
    if (this.props.phone) {
      this.validateVietnamesePhone(this.props.phone);
    }

    // Validate email if provided
    if (this.props.email) {
      this.validateEmail(this.props.email);
    }

    // Validate address if provided
    if (this.props.address) {
      this.validateAddress(this.props.address);
    }

    // Validate emergency contact if provided
    if (this.props.emergencyContact) {
      this.validateEmergencyContact(this.props.emergencyContact);
    }

    // At least one contact method should be provided
    if (!this.hasContactMethod && !this.props.emergencyContact) {
      throw new Error('Phải có ít nhất một phương thức liên lạc (điện thoại, email hoặc người liên hệ khẩn cấp)');
    }
  }

  /**
   * Validate Vietnamese phone number
   */
  private validateVietnamesePhone(phone: string): void {
    // Remove spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Vietnamese phone formats:
    // Mobile: 0xxxxxxxxx (10 digits starting with 0)
    // Landline: 0xxxxxxxx (9 digits starting with 0)
    // International: +84xxxxxxxxx
    
    const mobileRegex = /^0[3-9]\d{8}$/;
    const landlineRegex = /^0[2]\d{7,8}$/;
    const internationalRegex = /^\+84[3-9]\d{8}$/;

    if (!mobileRegex.test(cleanPhone) && 
        !landlineRegex.test(cleanPhone) && 
        !internationalRegex.test(cleanPhone)) {
      throw new Error('Số điện thoại không đúng định dạng Việt Nam. Ví dụ: 0901234567 hoặc +84901234567');
    }

    // Additional validation for mobile numbers
    if (mobileRegex.test(cleanPhone)) {
      const prefix = cleanPhone.substring(0, 3);
      const validMobilePrefixes = [
        '032', '033', '034', '035', '036', '037', '038', '039', // Viettel
        '070', '079', '077', '076', '078', // Mobifone
        '083', '084', '085', '081', '082', // Vinaphone
        '056', '058', // Vietnamobile
        '059', '099' // Gmobile
      ];

      if (!validMobilePrefixes.includes(prefix)) {
        throw new Error(`Đầu số điện thoại di động không hợp lệ: ${prefix}`);
      }
    }
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      throw new Error('Địa chỉ email không đúng định dạng');
    }

    if (email.length > 254) {
      throw new Error('Địa chỉ email quá dài (tối đa 254 ký tự)');
    }

    // Check for Vietnamese domain extensions
    const vietnameseDomains = ['.vn', '.com.vn', '.net.vn', '.org.vn', '.edu.vn', '.gov.vn'];
    const isVietnameseDomain = vietnameseDomains.some(domain => email.toLowerCase().endsWith(domain));
    
    // Allow international domains but prefer Vietnamese ones
    if (!isVietnameseDomain && !email.includes('.com') && !email.includes('.org') && !email.includes('.net')) {
      throw new Error('Địa chỉ email nên sử dụng tên miền phổ biến (.com, .vn, .com.vn, v.v.)');
    }
  }

  /**
   * Validate address
   */
  private validateAddress(address: Address): void {
    if (!address.street || address.street.trim().length === 0) {
      throw new Error('Địa chỉ đường/phố không được để trống');
    }

    if (!address.ward || address.ward.trim().length === 0) {
      throw new Error('Phường/xã không được để trống');
    }

    if (!address.district || address.district.trim().length === 0) {
      throw new Error('Quận/huyện không được để trống');
    }

    if (!address.city || address.city.trim().length === 0) {
      throw new Error('Thành phố không được để trống');
    }

    if (!address.province || address.province.trim().length === 0) {
      throw new Error('Tỉnh/thành phố không được để trống');
    }

    if (!address.country || address.country.trim().length === 0) {
      throw new Error('Quốc gia không được để trống');
    }

    // Validate Vietnamese postal code if provided
    if (address.postalCode) {
      const postalCodeRegex = /^\d{5,6}$/;
      if (!postalCodeRegex.test(address.postalCode)) {
        throw new Error('Mã bưu điện phải có 5-6 chữ số');
      }
    }

    // Validate Vietnamese provinces
    const vietnameseProvinces = [
      'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
      'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
      'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
      'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
      'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
      'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
      'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
      'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
      'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
      'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
      'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
      'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
      // Thành phố trực thuộc trung ương
      'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'
    ];

    if (address.country.toLowerCase() === 'việt nam' || address.country.toLowerCase() === 'vietnam') {
      const isValidProvince = vietnameseProvinces.some(province => 
        province.toLowerCase() === address.province.toLowerCase()
      );

      if (!isValidProvince) {
        throw new Error(`Tỉnh/thành phố không hợp lệ: ${address.province}. Vui lòng kiểm tra lại.`);
      }
    }
  }

  /**
   * Validate emergency contact
   */
  private validateEmergencyContact(emergencyContact: EmergencyContact): void {
    if (!emergencyContact.name || emergencyContact.name.trim().length === 0) {
      throw new Error('Tên người liên hệ khẩn cấp không được để trống');
    }

    if (!emergencyContact.relationship || emergencyContact.relationship.trim().length === 0) {
      throw new Error('Mối quan hệ với người liên hệ khẩn cấp không được để trống');
    }

    if (!emergencyContact.phone || emergencyContact.phone.trim().length === 0) {
      throw new Error('Số điện thoại người liên hệ khẩn cấp không được để trống');
    }

    // Validate emergency contact phone
    this.validateVietnamesePhone(emergencyContact.phone);

    // Validate emergency contact email if provided
    if (emergencyContact.email) {
      this.validateEmail(emergencyContact.email);
    }

    // Validate relationship
    const validRelationships = [
      'Cha', 'Mẹ', 'Vợ', 'Chồng', 'Con trai', 'Con gái', 'Anh trai', 'Em trai',
      'Chị gái', 'Em gái', 'Ông', 'Bà', 'Cháu', 'Bạn', 'Đồng nghiệp', 'Khác'
    ];

    const isValidRelationship = validRelationships.some(rel => 
      rel.toLowerCase() === emergencyContact.relationship.toLowerCase()
    );

    if (!isValidRelationship) {
      throw new Error(`Mối quan hệ không hợp lệ: ${emergencyContact.relationship}. Các mối quan hệ hợp lệ: ${validRelationships.join(', ')}`);
    }
  }

  /**
   * Contains PHI - Contact info contains PHI
   */
  containsPHI(): boolean {
    return true;
  }

  /**
   * Validate PHI format for HIPAA compliance
   */
  protected validatePHIFormat(): void {
    // Ensure contact information is properly secured
    if (this.props.phone && this.props.phone.length < 10) {
      throw new Error('Số điện thoại phải đủ độ dài để đảm bảo bảo mật');
    }
  }

  /**
   * Anonymize for non-PHI use
   */
  anonymize(): Partial<ContactInfoProps> {
    return {
      phone: this.props.phone ? this.maskPhone(this.props.phone) : undefined,
      email: this.props.email ? this.maskEmail(this.props.email) : undefined,
      address: this.props.address ? this.maskAddress(this.props.address) : undefined,
      emergencyContact: this.props.emergencyContact ? this.maskEmergencyContact(this.props.emergencyContact) : undefined
    };
  }

  /**
   * Mask phone number
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '*'.repeat(phone.length);
    
    const visiblePart = phone.substring(0, 3);
    const maskedPart = '*'.repeat(phone.length - 6);
    const lastPart = phone.substring(phone.length - 3);
    
    return visiblePart + maskedPart + lastPart;
  }

  /**
   * Mask email address
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return '*'.repeat(localPart.length) + '@' + domain;
    }
    
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return maskedLocal + '@' + domain;
  }

  /**
   * Mask address
   */
  private maskAddress(address: Address): Address {
    return {
      ...address,
      street: address.street.charAt(0) + '*'.repeat(Math.max(0, address.street.length - 1))
    };
  }

  /**
   * Mask emergency contact
   */
  private maskEmergencyContact(emergencyContact: EmergencyContact): EmergencyContact {
    return {
      ...emergencyContact,
      name: this.maskName(emergencyContact.name),
      phone: this.maskPhone(emergencyContact.phone),
      email: emergencyContact.email ? this.maskEmail(emergencyContact.email) : undefined
    };
  }

  /**
   * Mask name
   */
  private maskName(name: string): string {
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0) + '*'.repeat(Math.max(0, part.length - 1))).join(' ');
  }

  /**
   * String representation
   */
  toString(): string {
    const parts = [];
    if (this.props.phone) parts.push(`Tel: ${this.props.phone}`);
    if (this.props.email) parts.push(`Email: ${this.props.email}`);
    if (this.hasCompleteAddress) parts.push(`Address: ${this.formattedAddress}`);
    
    return parts.join(', ');
  }
}
