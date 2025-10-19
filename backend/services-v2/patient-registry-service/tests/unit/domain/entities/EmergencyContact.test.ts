/**
 * EmergencyContact Entity Tests
 * Comprehensive unit tests for EmergencyContact entity
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { EmergencyContact } from '@domain/entities/EmergencyContact';

describe('EmergencyContact Entity', () => {
  describe('create', () => {
    it('should create emergency contact with valid data', () => {
      const contact = EmergencyContact.create(
        'Nguyen Van A',
        'Spouse',
        '0912345678',
        '0987654321',
        'nguyenvana@example.com',
        '123 Nguyen Hue, HCMC',
        true
      );

      expect(contact).toBeDefined();
      expect(contact.name).toBe('Nguyen Van A');
      expect(contact.relationship).toBe('Spouse');
      expect(contact.primaryPhone).toBe('0912345678');
      expect(contact.secondaryPhone).toBe('0987654321');
      expect(contact.email).toBe('nguyenvana@example.com');
      expect(contact.address).toBe('123 Nguyen Hue, HCMC');
      expect(contact.isPrimary).toBe(true);
      expect(contact.isActive).toBe(true);
    });

    it('should create emergency contact with minimal data', () => {
      const contact = EmergencyContact.create(
        'Nguyen Van B',
        'Parent',
        '0912345678'
      );

      expect(contact).toBeDefined();
      expect(contact.name).toBe('Nguyen Van B');
      expect(contact.relationship).toBe('Parent');
      expect(contact.primaryPhone).toBe('0912345678');
      expect(contact.secondaryPhone).toBeUndefined();
      expect(contact.email).toBeUndefined();
      expect(contact.address).toBeUndefined();
      expect(contact.isPrimary).toBe(false);
      expect(contact.isActive).toBe(true);
    });

    it('should trim whitespace from input fields', () => {
      const contact = EmergencyContact.create(
        '  Nguyen Van C  ',
        '  Sibling  ',
        '  0912345678  ',
        '  0987654321  ',
        '  test@example.com  ',
        '  123 Street  '
      );

      expect(contact.name).toBe('Nguyen Van C');
      expect(contact.relationship).toBe('Sibling');
      expect(contact.primaryPhone).toBe('0912345678');
      expect(contact.secondaryPhone).toBe('0987654321');
      expect(contact.email).toBe('test@example.com');
      expect(contact.address).toBe('123 Street');
    });

    it('should generate unique ID for each contact', () => {
      const contact1 = EmergencyContact.create('Name 1', 'Spouse', '0912345678');
      const contact2 = EmergencyContact.create('Name 2', 'Parent', '0987654321');

      expect(contact1.getId()).not.toBe(contact2.getId());
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const beforeCreate = new Date();
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      const afterCreate = new Date();

      const persistence = contact.toPersistence();
      const createdAt = new Date(persistence.created_at);
      const updatedAt = new Date(persistence.updated_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute emergency contact from persistence data', () => {
      const props = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Nguyen Van D',
        relationship: 'Spouse',
        primaryPhone: '0912345678',
        secondaryPhone: '0987654321',
        email: 'test@example.com',
        address: '123 Street',
        isPrimary: true,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const contact = EmergencyContact.reconstitute(props);

      expect(contact.getId()).toBe(props.id);
      expect(contact.name).toBe(props.name);
      expect(contact.relationship).toBe(props.relationship);
      expect(contact.primaryPhone).toBe(props.primaryPhone);
      expect(contact.secondaryPhone).toBe(props.secondaryPhone);
      expect(contact.email).toBe(props.email);
      expect(contact.address).toBe(props.address);
      expect(contact.isPrimary).toBe(props.isPrimary);
      expect(contact.isActive).toBe(props.isActive);
    });
  });

  describe('setPrimary', () => {
    it('should set contact as primary', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678', undefined, undefined, undefined, false);
      
      expect(contact.isPrimary).toBe(false);
      
      contact.setPrimary();
      
      expect(contact.isPrimary).toBe(true);
    });

    it('should update updatedAt timestamp when setting primary', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      const originalUpdatedAt = contact.toPersistence().updated_at;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        contact.setPrimary();
        const newUpdatedAt = contact.toPersistence().updated_at;
        
        expect(newUpdatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('removePrimary', () => {
    it('should remove primary status from contact', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678', undefined, undefined, undefined, true);
      
      expect(contact.isPrimary).toBe(true);
      
      contact.removePrimary();
      
      expect(contact.isPrimary).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate inactive contact', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      contact.deactivate();
      
      expect(contact.isActive).toBe(false);
      
      contact.activate();
      
      expect(contact.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate active contact', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      
      expect(contact.isActive).toBe(true);
      
      contact.deactivate();
      
      expect(contact.isActive).toBe(false);
    });
  });

  describe('updateContactInfo', () => {
    it('should update all contact information', () => {
      const contact = EmergencyContact.create('Old Name', 'Spouse', '0912345678');
      
      contact.updateContactInfo(
        'New Name',
        '0987654321',
        '0123456789',
        'newemail@example.com',
        'New Address'
      );
      
      expect(contact.name).toBe('New Name');
      expect(contact.primaryPhone).toBe('0987654321');
      expect(contact.secondaryPhone).toBe('0123456789');
      expect(contact.email).toBe('newemail@example.com');
      expect(contact.address).toBe('New Address');
    });

    it('should update only specified fields', () => {
      const contact = EmergencyContact.create(
        'Original Name',
        'Spouse',
        '0912345678',
        '0987654321',
        'original@example.com',
        'Original Address'
      );
      
      contact.updateContactInfo('New Name', '0111111111');
      
      expect(contact.name).toBe('New Name');
      expect(contact.primaryPhone).toBe('0111111111');
      expect(contact.secondaryPhone).toBe('0987654321'); // Unchanged
      expect(contact.email).toBe('original@example.com'); // Unchanged
      expect(contact.address).toBe('Original Address'); // Unchanged
    });

    it('should trim whitespace when updating', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      
      contact.updateContactInfo('  New Name  ', '  0987654321  ');
      
      expect(contact.name).toBe('New Name');
      expect(contact.primaryPhone).toBe('0987654321');
    });
  });

  describe('isValid', () => {
    it('should return true for valid emergency contact', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      
      expect(contact.isValid()).toBe(true);
    });

    it('should return false for invalid Vietnamese phone number', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      
      // Manually set invalid phone (bypassing validation)
      contact.updateContactInfo(undefined, '123456789'); // 9 digits
      
      expect(contact.isValid()).toBe(false);
    });
  });

  describe('validate', () => {
    it('should not throw error for valid contact', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      
      expect(() => contact.validate()).not.toThrow();
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const contact = EmergencyContact.create(
        'Nguyen Van E',
        'Spouse',
        '0912345678',
        '0987654321',
        'test@example.com',
        '123 Street',
        true
      );
      
      const persistence = contact.toPersistence();
      
      expect(persistence).toHaveProperty('id');
      expect(persistence.name).toBe('Nguyen Van E');
      expect(persistence.relationship).toBe('Spouse');
      expect(persistence.primary_phone).toBe('0912345678');
      expect(persistence.secondary_phone).toBe('0987654321');
      expect(persistence.email).toBe('test@example.com');
      expect(persistence.address).toBe('123 Street');
      expect(persistence.is_primary).toBe(true);
      expect(persistence.is_active).toBe(true);
      expect(persistence.created_at).toBeDefined();
      expect(persistence.updated_at).toBeDefined();
    });
  });

  describe('getSummaryForLogging', () => {
    it('should return summary without sensitive data', () => {
      const contact = EmergencyContact.create(
        'Nguyen Van F',
        'Spouse',
        '0912345678',
        '0987654321',
        'test@example.com',
        '123 Street',
        true
      );
      
      const summary = contact.getSummaryForLogging();
      
      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('name');
      expect(summary).toHaveProperty('relationship');
      expect(summary).toHaveProperty('isPrimary');
      expect(summary).toHaveProperty('isActive');
      expect(summary).not.toHaveProperty('primaryPhone');
      expect(summary).not.toHaveProperty('email');
      expect(summary).not.toHaveProperty('address');
    });
  });

  describe('getMaskedPhoneNumber', () => {
    it('should mask phone number showing only last 4 digits', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      
      const masked = contact.getMaskedPhoneNumber();
      
      expect(masked).toBe('***5678');
    });

    it('should return *** for short phone numbers', () => {
      const contact = EmergencyContact.create('Name', 'Spouse', '0912345678');
      contact.updateContactInfo(undefined, '123');
      
      const masked = contact.getMaskedPhoneNumber();
      
      expect(masked).toBe('***');
    });
  });
});

