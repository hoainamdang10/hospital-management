import { handleValidationErrors, validateRegisterStaff } from '@presentation/middleware/ValidationMiddleware';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

jest.mock('express-validator', () => {
  const actual = jest.requireActual('express-validator');
  return {
    ...actual,
    validationResult: jest.fn()
  };
});

const validationResultMock = validationResult as unknown as jest.Mock;

const createResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockImplementation(function (this: Response) {
    return this;
  });
  res.json = jest.fn().mockReturnValue(undefined);
  return res as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe('ValidationMiddleware', () => {
  beforeEach(() => {
    validationResultMock.mockReset();
  });

  it('handleValidationErrors trả về 400 khi có lỗi', () => {
    validationResultMock.mockReturnValue({
      isEmpty: () => false,
      array: () => ([{ param: 'userId', msg: 'User ID không hợp lệ' }])
    });

    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn();

    handleValidationErrors(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'VALIDATION_ERROR',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'userId' })
        ])
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('handleValidationErrors gọi next khi không có lỗi', () => {
    validationResultMock.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn();

    handleValidationErrors(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('validateRegisterStaff kết thúc bằng handleValidationErrors', () => {
    expect(validateRegisterStaff[validateRegisterStaff.length - 1]).toBe(handleValidationErrors);
  });
});
