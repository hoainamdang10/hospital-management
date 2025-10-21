import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest } from '../../../../src/presentation/middleware/validateRequest';

describe('validateRequest', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      body: {}
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
  });

  describe('valid data', () => {
    it('should pass validation with valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });

      mockRequest.body = { name: 'John', age: 30 };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'John', age: 30 });
    });

    it('should apply default values', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        status: Joi.string().default('active')
      });

      mockRequest.body = { name: 'John' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'John', status: 'active' });
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockRequest.body = { name: 'John', unknownField: 'value' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'John' });
    });

    it('should validate nested objects', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required()
        }).required()
      });

      mockRequest.body = {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    it('should return 400 for missing required field', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });

      mockRequest.body = { name: 'John' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [
          {
            field: 'age',
            message: '"age" is required'
          }
        ]
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid type', () => {
      const schema = Joi.object({
        age: Joi.number().required()
      });

      mockRequest.body = { age: 'not-a-number' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [
          {
            field: 'age',
            message: '"age" must be a number'
          }
        ]
      });
    });

    it('should return multiple validation errors', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' }),
          expect.objectContaining({ field: 'email' })
        ])
      });
    });

    it('should return 400 for invalid enum value', () => {
      const schema = Joi.object({
        status: Joi.string().valid('active', 'inactive').required()
      });

      mockRequest.body = { status: 'invalid' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [
          {
            field: 'status',
            message: '"status" must be one of [active, inactive]'
          }
        ]
      });
    });

    it('should return 400 for forbidden field', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        forbidden: Joi.forbidden()
      });

      mockRequest.body = { name: 'John', forbidden: 'value' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'forbidden' })
        ])
      });
    });

    it('should handle nested field errors', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required()
        }).required()
      });

      mockRequest.body = {
        user: {
          name: 'John',
          email: 'invalid-email'
        }
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [
          {
            field: 'user.email',
            message: '"user.email" must be a valid email'
          }
        ]
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty body', () => {
      const schema = Joi.object({
        name: Joi.string().optional()
      });

      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null body', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockRequest.body = null as any;

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should handle array validation', () => {
      const schema = Joi.object({
        items: Joi.array().items(Joi.string()).required()
      });

      mockRequest.body = { items: ['a', 'b', 'c'] };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle custom validation messages', () => {
      const schema = Joi.object({
        age: Joi.number().min(18).required().messages({
          'number.min': 'Must be at least 18 years old'
        })
      });

      mockRequest.body = { age: 15 };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [
          {
            field: 'age',
            message: 'Must be at least 18 years old'
          }
        ]
      });
    });
  });
});

