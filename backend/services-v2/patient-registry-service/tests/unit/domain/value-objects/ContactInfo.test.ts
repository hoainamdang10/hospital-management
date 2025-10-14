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

  describe('immutability', () => {
    it('should be immutable', () => {
      const contactInfo = ContactInfo.create(validProps);
      
      expect(() => {
        (contactInfo as any).primaryPhone = '0987654321';
      }).toThrow();
    });
  });
});
