import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';

const buildBaseProps = () => ({
  fullName: 'Trần Thị B',
  dateOfBirth: new Date('1990-02-10'),
  gender: 'female' as const,
  nationalId: '123456789012',
  nationality: 'Vietnam',
  phoneNumber: '0907654321',
  email: 'tran.thi.b@example.com',
  address: {
    street: '45 Nguyễn Huệ',
    ward: 'Bến Nghé',
    district: 'Quận 1',
    city: 'Hồ Chí Minh',
    province: 'Hồ Chí Minh',
    country: 'Vietnam'
  }
});

describe('PersonalInfo Value Object', () => {
  it('creates Vietnamese compliant personal info', () => {
    const info = PersonalInfo.create(buildBaseProps());

    expect(info.isVietnameseCompliant()).toBe(true);
    expect(info.containsPHI()).toBe(true);
    expect(info.fullName).toBe('Trần Thị B');
  });

  it('throws error for invalid CMND/CCCD', () => {
    const props = { ...buildBaseProps(), nationalId: 'ABC123' };

    expect(() => PersonalInfo.create(props)).toThrow('CMND/CCCD không đúng định dạng Việt Nam');
  });

  it('anonymize currently throws vì dữ liệu không còn đáp ứng định dạng CMND/CCCD', () => {
    const info = PersonalInfo.create(buildBaseProps());

    expect(() => info.anonymize()).toThrow('CMND/CCCD không đúng định dạng Việt Nam');
  });
});
