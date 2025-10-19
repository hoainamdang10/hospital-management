/**
 * ContactInfo Value Object Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';

describe('ContactInfo Value Object', () => {
  const validProps = {
    primaryPhone: '0901234567',
    email: 'test@example.com',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam',
      postalCode: '700000'
    },
    preferredContactMethod: 'phone' as const
  };

  describe('create', () => {
    it('should create ContactInfo with valid data', () => {
      const contactInfo = ContactInfo.create(validProps);
      
      expect(contactInfo).toBeInstanceOf(ContactInfo);
      expect(contactInfo.primaryPhone).toBe('0901234567');
      expect(contactInfo.email).toBe('test@example.com');
      expect(contactInfo.preferredContactMethod).toBe('phone');
    });

    it('should throw error for invalid phone number format', () => {
      const invalidPhones = [
        '123',
        'abcdefghij',
        '12345678901234567890',
        ''
      ];

      invalidPhones.forEach(phone => {
        const invalidProps = { ...validProps, primaryPhone: phone };
        expect(() => ContactInfo.create(invalidProps)).toThrow();
      });
    });

    it('should accept valid Vietnamese phone numbers', () => {
      const validPhones = [
        '0901234567',
        '0912345678',
        '0987654321'
      ];

      validPhones.forEach(phone => {
        const props = { ...validProps, primaryPhone: phone };
        const contactInfo = ContactInfo.create(props);
        expect(contactInfo.primaryPhone).toBeDefined();
      });
    });

    it('should throw error for invalid email format', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com'
      ];

      invalidEmails.forEach(email => {
        const invalidProps = { ...validProps, email };
        expect(() => ContactInfo.create(invalidProps)).toThrow();
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
        'user_name@example.com'
      ];

      validEmails.forEach(email => {
        const props = { ...validProps, email };
        const contactInfo = ContactInfo.create(props);
        expect(contactInfo.email).toBe(email);
      });
    });

    it('should throw error for empty address street', () => {
      const invalidProps = {
        ...validProps,
        address: { ...validProps.address, street: '' }
      };
      expect(() => ContactInfo.create(invalidProps)).toThrow();
    });

    it('should throw error for empty address ward', () => {
      const invalidProps = {
        ...validProps,
        address: { ...validProps.address, ward: '' }
      };
      expect(() => ContactInfo.create(invalidProps)).toThrow();
    });

    it('should throw error for empty address district', () => {
      const invalidProps = {
        ...validProps,
        address: { ...validProps.address, district: '' }
      };
      expect(() => ContactInfo.create(invalidProps)).toThrow();
    });

    it('should throw error for empty address city', () => {
      const invalidProps = {
        ...validProps,
        address: { ...validProps.address, city: '' }
      };
      expect(() => ContactInfo.create(invalidProps)).toThrow();
    });

    it('should create ContactInfo with optional postal code', () => {
      const props = {
        ...validProps,
        address: {
          street: '123 Test Street',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: 'Vietnam'
        }
      };
      const contactInfo = ContactInfo.create(props);
      expect(contactInfo).toBeInstanceOf(ContactInfo);
    });

    it('should accept Vietnamese address with city name', () => {
      const props = {
        ...validProps,
        address: {
          ...validProps.address,
          city: 'Thành phố Hồ Chí Minh'
        }
      };
      const contactInfo = ContactInfo.create(props);
      expect(contactInfo.address.city).toBe('Thành phố Hồ Chí Minh');
    });

    it('should accept Vietnamese address with postal code', () => {
      const props = {
        ...validProps,
        address: {
          ...validProps.address,
          postalCode: '700000'
        }
      };
      const contactInfo = ContactInfo.create(props);
      expect(contactInfo.address.postalCode).toBe('700000');
    });

    it('should create ContactInfo with optional secondary phone', () => {
      const props = {
        ...validProps,
        secondaryPhone: '0987654321'
      };
      const contactInfo = ContactInfo.create(props);
      expect(contactInfo.secondaryPhone).toBe('0987654321');
    });

    it('should accept all preferred contact methods', () => {
      const methods: Array<'phone' | 'email' | 'sms'> = ['phone', 'email', 'sms'];

      methods.forEach(method => {
        const props = { ...validProps, preferredContactMethod: method };
        const contactInfo = ContactInfo.create(props);
        expect(contactInfo.preferredContactMethod).toBe(method);
      });
    });

    it('should throw error for empty primary phone', () => {
      const props = { ...validProps, primaryPhone: '' };

      expect(() => ContactInfo.create(props)).toThrow('Số điện thoại chính không được để trống');
    });

    it('should throw error for whitespace-only primary phone', () => {
      const props = { ...validProps, primaryPhone: '   ' };

      expect(() => ContactInfo.create(props)).toThrow('Số điện thoại chính không được để trống');
    });

    it('should throw error for invalid secondary phone', () => {
      const props = { ...validProps, secondaryPhone: '123' };

      expect(() => ContactInfo.create(props)).toThrow('Số điện thoại phụ không đúng định dạng Việt Nam');
    });

    it('should throw error for empty province', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, province: '' }
      };

      expect(() => ContactInfo.create(props)).toThrow('Tỉnh/thành phố không được để trống');
    });

    it('should trim and lowercase email', () => {
      const props = { ...validProps, email: '  TEST@EXAMPLE.COM  ' };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.email).toBe('test@example.com');
    });

    it('should trim phone numbers', () => {
      const props = { ...validProps, primaryPhone: '  0901234567  ' };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.primaryPhone).toBe('0901234567');
    });

    it('should trim address fields', () => {
      const props = {
        ...validProps,
        address: {
          street: '  123 Test Street  ',
          ward: '  Ward 1  ',
          district: '  District 1  ',
          city: '  Ho Chi Minh City  ',
          province: '  Ho Chi Minh  ',
          country: 'Vietnam'
        }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.address.street).toBe('123 Test Street');
      expect(contactInfo.address.ward).toBe('Ward 1');
      expect(contactInfo.address.district).toBe('District 1');
      expect(contactInfo.address.city).toBe('Ho Chi Minh City');
      expect(contactInfo.address.province).toBe('Ho Chi Minh');
      expect(contactInfo.address.country).toBe('Vietnam');
    });

    it('should default country to Việt Nam when not provided', () => {
      const props = {
        ...validProps,
        address: {
          street: '123 Test Street',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: ''
        }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.address.country).toBe('Việt Nam');
    });
  });

  describe('isInHoChiMinhCity', () => {
    it('should return true for Hồ Chí Minh city', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Thành phố Hồ Chí Minh' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHoChiMinhCity()).toBe(true);
    });

    it('should return true for TP.HCM', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'TP.HCM' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHoChiMinhCity()).toBe(true);
    });

    it('should return true for Sài Gòn', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Sài Gòn' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHoChiMinhCity()).toBe(true);
    });

    it('should return false for other cities', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Hà Nội' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHoChiMinhCity()).toBe(false);
    });
  });

  describe('isInHanoi', () => {
    it('should return true for Hà Nội', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Hà Nội' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHanoi()).toBe(true);
    });

    it('should return true for Hanoi (English)', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Hanoi' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHanoi()).toBe(true);
    });

    it('should return false for other cities', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Đà Nẵng' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInHanoi()).toBe(false);
    });
  });

  describe('isInMajorCity', () => {
    it('should return true for Hồ Chí Minh', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Hồ Chí Minh' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInMajorCity()).toBe(true);
    });

    it('should return true for Hà Nội', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Hà Nội' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInMajorCity()).toBe(true);
    });

    it('should return true for Đà Nẵng', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Đà Nẵng' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInMajorCity()).toBe(true);
    });

    it('should return true for Cần Thơ', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Cần Thơ' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInMajorCity()).toBe(true);
    });

    it('should return true for Hải Phòng', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Hải Phòng' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInMajorCity()).toBe(true);
    });

    it('should return false for non-major cities', () => {
      const props = {
        ...validProps,
        address: { ...validProps.address, city: 'Đồng Nai' }
      };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.isInMajorCity()).toBe(false);
    });
  });

  describe('Vietnamese healthcare compliance', () => {
    it('should support Vietnamese address format', () => {
      const vietnameseProps = {
        ...validProps,
        address: {
          street: '123 Nguyễn Huệ',
          ward: 'Phường Bến Nghé',
          district: 'Quận 1',
          city: 'Thành phố Hồ Chí Minh',
          province: 'Hồ Chí Minh',
          country: 'Việt Nam',
          postalCode: '700000'
        }
      };
      const contactInfo = ContactInfo.create(vietnameseProps);
      expect(contactInfo.address.street).toBe('123 Nguyễn Huệ');
    });
  });

  describe('equals', () => {
    it('should return true for same contact info', () => {
      const info1 = ContactInfo.create(validProps);
      const info2 = ContactInfo.create(validProps);
      
      expect(info1.equals(info2)).toBe(true);
    });

    it('should return false for different contact info', () => {
      const info1 = ContactInfo.create(validProps);
      const info2 = ContactInfo.create({
        ...validProps,
        primaryPhone: '0987654321'
      });
      
      expect(info1.equals(info2)).toBe(false);
    });
  });

  describe('getFormattedPrimaryPhone', () => {
    it('should format primary phone number', () => {
      const contactInfo = ContactInfo.create(validProps);
      const formatted = contactInfo.getFormattedPrimaryPhone();

      expect(formatted).toBe('0901 234 567');
    });
  });

  describe('getFormattedSecondaryPhone', () => {
    it('should format secondary phone number', () => {
      const props = { ...validProps, secondaryPhone: '0987654321' };
      const contactInfo = ContactInfo.create(props);
      const formatted = contactInfo.getFormattedSecondaryPhone();

      expect(formatted).toBe('0987 654 321');
    });

    it('should return undefined when no secondary phone', () => {
      const contactInfo = ContactInfo.create(validProps);
      const formatted = contactInfo.getFormattedSecondaryPhone();

      expect(formatted).toBeUndefined();
    });
  });

  describe('getFullAddress', () => {
    it('should return full formatted address', () => {
      const contactInfo = ContactInfo.create(validProps);
      const fullAddress = contactInfo.getFullAddress();

      expect(fullAddress).toBe('123 Test Street, Ward 1, District 1, Ho Chi Minh City, Ho Chi Minh, Vietnam');
    });
  });

  describe('getShortAddress', () => {
    it('should return short address with district and city', () => {
      const contactInfo = ContactInfo.create(validProps);
      const shortAddress = contactInfo.getShortAddress();

      expect(shortAddress).toBe('District 1, Ho Chi Minh City');
    });
  });

  describe('hasEmail', () => {
    it('should return true when email exists', () => {
      const contactInfo = ContactInfo.create(validProps);

      expect(contactInfo.hasEmail()).toBe(true);
    });

    it('should return false when email does not exist', () => {
      const props = { ...validProps, email: undefined };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.hasEmail()).toBe(false);
    });
  });

  describe('hasSecondaryPhone', () => {
    it('should return true when secondary phone exists', () => {
      const props = { ...validProps, secondaryPhone: '0987654321' };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.hasSecondaryPhone()).toBe(true);
    });

    it('should return false when secondary phone does not exist', () => {
      const contactInfo = ContactInfo.create(validProps);

      expect(contactInfo.hasSecondaryPhone()).toBe(false);
    });
  });

  describe('canContactByEmail', () => {
    it('should return true when has email and preferred method is email', () => {
      const props = { ...validProps, preferredContactMethod: 'email' as const };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.canContactByEmail()).toBe(true);
    });

    it('should return true when has email and preferred method is sms', () => {
      const props = { ...validProps, preferredContactMethod: 'sms' as const };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.canContactByEmail()).toBe(true);
    });

    it('should return false when preferred method is phone', () => {
      const contactInfo = ContactInfo.create(validProps);

      expect(contactInfo.canContactByEmail()).toBe(false);
    });

    it('should return false when no email', () => {
      const props = { ...validProps, email: undefined, preferredContactMethod: 'email' as const };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.canContactByEmail()).toBe(false);
    });
  });

  describe('canContactByPhone', () => {
    it('should return true when preferred method is phone', () => {
      const contactInfo = ContactInfo.create(validProps);

      expect(contactInfo.canContactByPhone()).toBe(true);
    });

    it('should return false when preferred method is not phone', () => {
      const props = { ...validProps, preferredContactMethod: 'email' as const };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.canContactByPhone()).toBe(false);
    });
  });

  describe('canContactBySMS', () => {
    it('should return true when preferred method is sms', () => {
      const props = { ...validProps, preferredContactMethod: 'sms' as const };
      const contactInfo = ContactInfo.create(props);

      expect(contactInfo.canContactBySMS()).toBe(true);
    });

    it('should return false when preferred method is not sms', () => {
      const contactInfo = ContactInfo.create(validProps);

      expect(contactInfo.canContactBySMS()).toBe(false);
    });
  });

  describe('getContactPhones', () => {
    it('should return array with primary phone only', () => {
      const contactInfo = ContactInfo.create(validProps);
      const phones = contactInfo.getContactPhones();

      expect(phones).toEqual(['0901234567']);
    });

    it('should return array with both phones', () => {
      const props = { ...validProps, secondaryPhone: '0987654321' };
      const contactInfo = ContactInfo.create(props);
      const phones = contactInfo.getContactPhones();

      expect(phones).toEqual(['0901234567', '0987654321']);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const contactInfo = ContactInfo.create(validProps);

      expect(() => {
        (contactInfo as any).primaryPhone = '0987654321';
      }).toThrow();
    });
  });
});
