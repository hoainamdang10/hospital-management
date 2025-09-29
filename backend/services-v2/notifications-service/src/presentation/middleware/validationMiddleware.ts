/**
 * validationMiddleware - Request Validation Middleware
 * JSON schema validation middleware with Vietnamese error messages
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Data Validation
 */

import { Request, Response, NextFunction } from 'express';

interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    minItems?: number;
    maxItems?: number;
    enum?: string[];
    format?: 'email' | 'date' | 'date-time' | 'phone' | 'url';
    items?: {
      type?: string;
      enum?: string[];
    };
    properties?: ValidationSchema;
  };
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export const validationMiddleware = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors = validateObject(req.body, schema, '');

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.map(error => ({
            field: error.field,
            message: error.message,
            value: error.value
          })),
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi validation',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  };
};

function validateObject(data: any, schema: ValidationSchema, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  Object.entries(schema).forEach(([field, rules]) => {
    const fieldPath = path ? `${path}.${field}` : field;
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldPath,
        message: `Trường ${field} là bắt buộc`,
        value
      });
      return;
    }

    if (value !== undefined && value !== null) {
      errors.push(...validateField(value, rules, fieldPath));
    }
  });

  return errors;
}

function validateField(value: any, rules: ValidationSchema[string], fieldPath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Type validation
  if (rules.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== rules.type) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} phải có kiểu ${getVietnameseType(rules.type)}`,
        value
      });
      return errors; // Stop further validation if type is wrong
    }
  }

  // String validations
  if (rules.type === 'string' && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} phải có ít nhất ${rules.minLength} ký tự`,
        value
      });
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} không được vượt quá ${rules.maxLength} ký tự`,
        value
      });
    }

    if (rules.format) {
      const formatError = validateFormat(value, rules.format, fieldPath);
      if (formatError) {
        errors.push(formatError);
      }
    }
  }

  // Number validations
  if (rules.type === 'number' && typeof value === 'number') {
    if (rules.minimum !== undefined && value < rules.minimum) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} phải lớn hơn hoặc bằng ${rules.minimum}`,
        value
      });
    }

    if (rules.maximum !== undefined && value > rules.maximum) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} phải nhỏ hơn hoặc bằng ${rules.maximum}`,
        value
      });
    }
  }

  // Array validations
  if (rules.type === 'array' && Array.isArray(value)) {
    if (rules.minItems && value.length < rules.minItems) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} phải có ít nhất ${rules.minItems} phần tử`,
        value
      });
    }

    if (rules.maxItems && value.length > rules.maxItems) {
      errors.push({
        field: fieldPath,
        message: `Trường ${fieldPath} không được vượt quá ${rules.maxItems} phần tử`,
        value
      });
    }

    // Validate array items
    if (rules.items) {
      value.forEach((item, index) => {
        const itemPath = `${fieldPath}[${index}]`;
        
        if (rules.items!.type) {
          const itemType = Array.isArray(item) ? 'array' : typeof item;
          if (itemType !== rules.items!.type) {
            errors.push({
              field: itemPath,
              message: `Phần tử tại ${itemPath} phải có kiểu ${getVietnameseType(rules.items!.type)}`,
              value: item
            });
          }
        }

        if (rules.items!.enum && !rules.items!.enum.includes(item)) {
          errors.push({
            field: itemPath,
            message: `Phần tử tại ${itemPath} phải là một trong các giá trị: ${rules.items!.enum.join(', ')}`,
            value: item
          });
        }
      });
    }
  }

  // Object validations
  if (rules.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
    if (rules.properties) {
      errors.push(...validateObject(value, rules.properties, fieldPath));
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push({
      field: fieldPath,
      message: `Trường ${fieldPath} phải là một trong các giá trị: ${rules.enum.join(', ')}`,
      value
    });
  }

  return errors;
}

function validateFormat(value: string, format: string, fieldPath: string): ValidationError | null {
  switch (format) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          field: fieldPath,
          message: `Trường ${fieldPath} phải là địa chỉ email hợp lệ`,
          value
        };
      }
      break;

    case 'phone':
      const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
      if (!phoneRegex.test(value)) {
        return {
          field: fieldPath,
          message: `Trường ${fieldPath} phải là số điện thoại Việt Nam hợp lệ`,
          value
        };
      }
      break;

    case 'date':
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value) || isNaN(Date.parse(value))) {
        return {
          field: fieldPath,
          message: `Trường ${fieldPath} phải có định dạng ngày hợp lệ (YYYY-MM-DD)`,
          value
        };
      }
      break;

    case 'date-time':
      if (isNaN(Date.parse(value))) {
        return {
          field: fieldPath,
          message: `Trường ${fieldPath} phải có định dạng ngày giờ hợp lệ (ISO 8601)`,
          value
        };
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        return {
          field: fieldPath,
          message: `Trường ${fieldPath} phải là URL hợp lệ`,
          value
        };
      }
      break;

    default:
      return {
        field: fieldPath,
        message: `Định dạng ${format} không được hỗ trợ`,
        value
      };
  }

  return null;
}

function getVietnameseType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'chuỗi',
    'number': 'số',
    'boolean': 'boolean',
    'array': 'mảng',
    'object': 'đối tượng'
  };

  return typeMap[type] || type;
}

/**
 * Validate Vietnamese healthcare specific fields
 */
export const validateHealthcareFields = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const errors: ValidationError[] = [];

    // Validate patient ID format
    if (req.body.patientId && typeof req.body.patientId === 'string') {
      const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
      if (!patientIdRegex.test(req.body.patientId)) {
        errors.push({
          field: 'patientId',
          message: 'Mã bệnh nhân phải có định dạng PAT-YYYYMM-XXX',
          value: req.body.patientId
        });
      }
    }

    // Validate doctor ID format
    if (req.body.doctorId && typeof req.body.doctorId === 'string') {
      const doctorIdRegex = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
      if (!doctorIdRegex.test(req.body.doctorId)) {
        errors.push({
          field: 'doctorId',
          message: 'Mã bác sĩ phải có định dạng DEPT-DOC-YYYYMM-XXX',
          value: req.body.doctorId
        });
      }
    }

    // Validate appointment ID format
    if (req.body.appointmentId && typeof req.body.appointmentId === 'string') {
      const appointmentIdRegex = /^APT-\d{6}-\d{6}$/;
      if (!appointmentIdRegex.test(req.body.appointmentId)) {
        errors.push({
          field: 'appointmentId',
          message: 'Mã lịch hẹn phải có định dạng APT-YYYYMM-XXXXXX',
          value: req.body.appointmentId
        });
      }
    }

    // Validate Vietnamese phone numbers
    if (req.body.phoneNumber && typeof req.body.phoneNumber === 'string') {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(req.body.phoneNumber)) {
        errors.push({
          field: 'phoneNumber',
          message: 'Số điện thoại phải là số điện thoại Việt Nam hợp lệ',
          value: req.body.phoneNumber
        });
      }
    }

    // Validate Vietnamese names
    if (req.body.patientName && typeof req.body.patientName === 'string') {
      const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
      if (!vietnameseNameRegex.test(req.body.patientName)) {
        errors.push({
          field: 'patientName',
          message: 'Tên bệnh nhân chỉ được chứa chữ cái tiếng Việt và khoảng trắng',
          value: req.body.patientName
        });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu y tế không hợp lệ',
        errors: errors.map(error => ({
          field: error.field,
          message: error.message,
          value: error.value
        })),
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi validation dữ liệu y tế',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      timestamp: new Date().toISOString()
    });
  }
};
