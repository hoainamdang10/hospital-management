import { StaffId } from '../../../../src/domain/value-objects/StaffId';

describe('StaffId Value Object', () => {
  it('creates from valid string and normalizes value', () => {
    const staffId = StaffId.create('doc-card-202401-001');

    expect(staffId.value).toBe('DOC-CARD-202401-001');
    expect(staffId.getStaffType()).toBe('doctor');
    expect(staffId.getDepartmentCode()).toBe('CARD');
  });

  it('rejects invalid format', () => {
    expect(() => StaffId.create('INVALID-ID')).toThrow(
      'Mã nhân viên không đúng định dạng ({TYPE}-{DEPT}-YYYYMM-XXX)'
    );
  });

  it('generates id with correct prefix for nurse', () => {
    const generated = StaffId.generate('nurse');

    expect(generated.value).toMatch(/^NUR-[A-Z]{3,5}-\d{6}-\d{3}$/);
    expect(generated.getStaffType()).toBe('nurse');
  });
});
