/**
 * ValidationMiddleware Tests
 * @version 2.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { handleValidationErrors } from '../../../../src/presentation/middleware/ValidationMiddleware';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
  body: jest.fn(() => ({ notEmpty: jest.fn().mockReturnThis(), isUUID: jest.fn().mockReturnThis(), withMessage: jest.fn().mockReturnThis() })),
  param: jest.fn(() => ({ notEmpty: jest.fn().mockReturnThis(), matches: jest.fn().mockReturnThis(), withMessage: jest.fn().mockReturnThis() })),
  query: jest.fn(() => ({ optional: jest.fn().mockReturnThis(), isInt: jest.fn().mockReturnThis(), withMessage: jest.fn().mockReturnThis() }))
}));

describe('ValidationMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('handleValidationErrors', () => {
    it('should call next if no validation errors', () => {
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 if validation errors exist', () => {
      const errors = [
        { param: 'email', msg: 'Email không hợp lệ' },
        { param: 'phone', msg: 'Số điện thoại không hợp lệ' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: [
          { field: 'email', message: 'Email không hợp lệ' },
          { field: 'phone', message: 'Số điện thoại không hợp lệ' }
        ]
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors without param field', () => {
      const errors = [
        { msg: 'General error' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [{ field: 'unknown', message: 'General error' }]
        })
      );
    });

    it('should format multiple validation errors', () => {
      const errors = [
        { param: 'userId', msg: 'User ID không được để trống' },
        { param: 'staffType', msg: 'Loại nhân viên không hợp lệ' },
        { param: 'personalInfo.fullName', msg: 'Họ tên không được để trống' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors).toHaveLength(3);
      expect(jsonCall.errors[0].field).toBe('userId');
      expect(jsonCall.errors[1].field).toBe('staffType');
      expect(jsonCall.errors[2].field).toBe('personalInfo.fullName');
    });
  });

  describe('Vietnamese Validation Messages', () => {
    it('should use Vietnamese error messages', () => {
      const errors = [
        { param: 'email', msg: 'Email không đúng định dạng' },
        { param: 'phoneNumber', msg: 'Số điện thoại không đúng định dạng' },
        { param: 'nationalId', msg: 'CMND/CCCD phải là 9 hoặc 12 chữ số' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.message).toBe('Dữ liệu đầu vào không hợp lệ');
      expect(jsonCall.errors[0].message).toContain('không đúng định dạng');
      expect(jsonCall.errors[2].message).toContain('CMND/CCCD');
    });
  });

  describe('Staff ID Validation Format', () => {
    it('should validate STAFF-YYYYMM-XXX format', () => {
      const errors = [
        { param: 'staffId', msg: 'Staff ID phải có định dạng STAFF-YYYYMM-XXX' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors[0].message).toContain('STAFF-YYYYMM-XXX');
    });
  });

  describe('Healthcare-specific Validations', () => {
    it('should validate Vietnamese phone numbers', () => {
      const errors = [
        { param: 'phoneNumber', msg: 'Số điện thoại không đúng định dạng' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should validate Vietnamese national ID', () => {
      const errors = [
        { param: 'nationalId', msg: 'CMND/CCCD phải là 9 hoặc 12 chữ số' }
      ];

      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      handleValidationErrors(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors[0].message).toContain('9 hoặc 12 chữ số');
    });
  });
});
